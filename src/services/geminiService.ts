import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Outline, EnhanceOptions } from '../types';

// Fix: Updated API key initialization to use process.env.API_KEY to align with guidelines and resolve TypeScript error.
// The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = ai.models;
const IMAGE_PROMPT_MARKER = "IMAGE_PROMPT:";

const generateImage = async (prompt: string): Promise<string | undefined> => {
    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        return undefined;
    } catch (error) {
        console.error("Error generating image:", error);
        return undefined;
    }
};

export const generateCoverImage = async (title: string, topic: string): Promise<string | undefined> => {
    try {
        const promptResponse = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a single, concise, and visually rich prompt (in English) for an AI image generator to create a stunning and professional e-book cover.
            E-book Title: "${title}"
            Main Topic: "${topic}"
            The cover design should be high-quality, visually striking, and directly and clearly represent the e-book's main topic. It needs to make the subject matter instantly recognizable. Avoid including any text in the image itself.
            Example prompt for 'The History of the Inca Empire': A majestic, photorealistic view of Machu Picchu at sunrise, with golden light illuminating the ancient stone structures and dramatic mountain peaks in the background.
            Just return the prompt text, nothing else.`
        });

        const imagePrompt = promptResponse.text.trim();
        if (imagePrompt) {
            return await generateImage(imagePrompt);
        }
        return undefined;
    } catch(error) {
        console.error("Error generating cover image prompt:", error);
        return undefined;
    }
};

export const generateOutline = async (topic: string, minPageCount: number, maxPageCount: number, language: string, observations: string): Promise<Outline> => {
    const averagePageCount = Math.ceil((minPageCount + maxPageCount) / 2);
    const numChapters = Math.max(3, Math.ceil(averagePageCount / 2));
    const observationsPrompt = observations ? `\n\nAdditional instructions from the user: "${observations}"` : "";

    try {
        const response = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: `Your task is to create a detailed outline for an e-book on the topic: '${topic}'.
The target audience is the general public.
The e-book needs to have a structure suitable for a length between ${minPageCount} and ${maxPageCount} pages.
To achieve this, please generate a list of exactly ${numChapters} thematic chapter titles. These chapter titles should be logical, sequential, and cover the topic comprehensively. Do not include 'Introduction' or 'Conclusion' in this list of chapters.
The entire response, including the e-book title and the chapter titles, must be in ${language}.${observationsPrompt}
You must respond with a JSON object.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: "A creative and engaging title for the e-book.",
                        },
                        chapters: {
                            type: Type.ARRAY,
                            description: `An array of strings for each thematic chapter title. The number of chapters should be exactly ${numChapters}.`,
                            items: {
                                type: Type.STRING,
                            }
                        }
                    },
                    required: ["title", "chapters"],
                }
            }
        });
        
        const jsonText = response.text.trim();
        const outlineData = JSON.parse(jsonText);

        if (!outlineData.title || !Array.isArray(outlineData.chapters) || outlineData.chapters.length === 0) {
            throw new Error("Invalid outline structure or empty chapters received from API.");
        }
        
        return outlineData as Outline;

    } catch (error) {
        console.error("Error generating outline:", error);
        throw new Error("Failed to generate e-book outline.");
    }
};

export const generateChapterContent = async (ebookTitle: string, chapterTitle: string, language: string, includeImages: boolean, observations: string): Promise<{ content: string; sources: string[]; image?: string }> => {
    try {
        const observationsPrompt = observations ? `\n\nAdditional instructions to follow for this chapter: "${observations}"` : "";

        let prompt = `You are an expert writer creating content for an e-book titled '${ebookTitle}'.
        Write the content for the chapter titled '${chapterTitle}'.
        The language should be clear, engaging, and easy for a general audience to understand, and must be written in ${language}.
        Ground your information in facts and reliable sources from the web.
        The chapter should be substantial, approximately 800-1000 words long, to ensure the final e-book meets its target page count.${observationsPrompt}
        Respond with the chapter content in ${language}, using Markdown format.`;

        if (includeImages) {
            prompt += `\n\nAfter the content, on a new line, add the text "${IMAGE_PROMPT_MARKER}" followed by a concise, descriptive, and visually rich prompt (in English) for an AI image generator that captures the essence of this chapter. Example: ${IMAGE_PROMPT_MARKER} A photorealistic image of an ancient Roman aqueduct at sunset, with a detailed and textured stone structure.`
        }
        
        const response = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let content = response.text;
        let image: string | undefined = undefined;

        if (includeImages && content.includes(IMAGE_PROMPT_MARKER)) {
            const parts = content.split(IMAGE_PROMPT_MARKER);
            content = parts[0].trim();
            const imagePrompt = parts[1].trim();
            if (imagePrompt) {
                image = await generateImage(imagePrompt);
            }
        }
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .map(chunk => chunk.web?.uri)
            .filter((uri): uri is string => !!uri);
        
        return { content, sources, image };

    } catch (error) {
        console.error(`Error generating content for chapter "${chapterTitle}":`, error);
        throw new Error(`Failed to generate content for chapter: ${chapterTitle}.`);
    }
};

export const selectTopReferences = async (references: Set<string>, topic: string, language: string): Promise<Set<string>> => {
    if (references.size <= 3) {
        return references;
    }

    const referenceList = [...references].join('\n');

    try {
        const response = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: `For an e-book about "${topic}", I have the following list of source URLs:\n\n${referenceList}\n\nFrom this list, please select the two or three most relevant, authoritative, and comprehensive sources. Your response must be in ${language} and must be a JSON object containing a single key "top_sources" with an array of the selected URL strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        top_sources: {
                            type: Type.ARRAY,
                            description: "An array containing 2 or 3 of the most relevant source URLs from the provided list.",
                            items: {
                                type: Type.STRING,
                            }
                        }
                    },
                    required: ["top_sources"],
                }
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result.top_sources && Array.isArray(result.top_sources)) {
            return new Set(result.top_sources);
        }

        return new Set([...references].slice(0, 3));

    } catch (error) {
        console.error("Error selecting top references:", error);
        return new Set([...references].slice(0, 3));
    }
};

interface StructuredText {
    title: string;
    chapters: Array<{ title: string, content: string }>;
}

export const structureText = async (fullText: string): Promise<StructuredText> => {
    try {
        const response = await model.generateContent({
            model: "gemini-2.5-pro",
            contents: `Analyze the following text and structure it into an e-book format.
1.  Create a concise, engaging title for the e-book based on the content.
2.  Divide the entire text into logical, thematic chapters.
3.  For each chapter, provide a clear, descriptive title.
4.  Ensure that all of the original text is included and correctly assigned to its chapter.

The text to analyze is below:
---
${fullText}
---

You must respond with a JSON object.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The generated e-book title." },
                        chapters: {
                            type: Type.ARRAY,
                            description: "An array of chapter objects.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING, description: "The title of the chapter." },
                                    content: { type: Type.STRING, description: "The full text content of the chapter." }
                                },
                                required: ["title", "content"]
                            }
                        }
                    },
                    required: ["title", "chapters"]
                }
            }
        });
        const jsonText = response.text.trim();
        const structuredData = JSON.parse(jsonText);
        if (!structuredData.title || !Array.isArray(structuredData.chapters) || structuredData.chapters.length === 0) {
            throw new Error("Failed to structure document correctly. The response from the AI was invalid.");
        }
        return structuredData;
    } catch (error) {
        console.error("Error structuring text:", error);
        throw new Error("Failed to structure the provided document.");
    }
};

export const enhanceChapterContent = async (
    chapterTitle: string,
    chapterContent: string,
    options: EnhanceOptions
): Promise<{ content: string; sources: string[]; image?: string }> => {

    let styleInstruction = "";
    switch (options.style) {
        case 'MoreFormal': styleInstruction = "Rewrite the text in a more formal, academic tone."; break;
        case 'MoreCasual': styleInstruction = "Rewrite the text in a more casual, conversational, and engaging tone."; break;
        case 'MoreDidactic': styleInstruction = "Rewrite the text in a more didactic and educational tone, simplifying complex concepts."; break;
        default: styleInstruction = "Perform only grammatical corrections and light improvements for clarity, preserving the original style.";
    }
    
    const observationsPrompt = options.observations ? `\n5. Follow these specific instructions: "${options.observations}"` : "";

    let prompt = `You are an expert editor enhancing a chapter for an e-book.
The chapter is titled: "${chapterTitle}".
Your tasks are:
1.  ${styleInstruction}
2.  Translate the entire final text into ${options.language}. The output must be ONLY in ${options.language}.
3.  Ensure the final text is grammatically perfect, clear, and well-structured.
4.  Ground your information in facts and reliable sources from the web. If you make substantial changes or add information, provide sources.${observationsPrompt}

Original chapter content to enhance:
---
${chapterContent}
---

Respond with the enhanced chapter content in ${options.language}, using Markdown format.`;

    if (options.includeImages) {
        prompt += `\n\nAfter the content, on a new line, add the text "${IMAGE_PROMPT_MARKER}" followed by a concise, descriptive, and visually rich prompt (in English) for an AI image generator that captures the essence of this chapter. Example: ${IMAGE_PROMPT_MARKER} A photorealistic image of an ancient Roman aqueduct at sunset, with a detailed and textured stone structure.`;
    }

    try {
        const response = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let content = response.text;
        let image: string | undefined = undefined;

        if (options.includeImages && content.includes(IMAGE_PROMPT_MARKER)) {
            const parts = content.split(IMAGE_PROMPT_MARKER);
            content = parts[0].trim();
            const imagePrompt = parts[1].trim();
            if (imagePrompt) {
                image = await generateImage(imagePrompt);
            }
        }

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .map(chunk => chunk.web?.uri)
            .filter((uri): uri is string => !!uri);

        return { content, sources, image };

    } catch (error) {
        console.error(`Error enhancing content for chapter "${chapterTitle}":`, error);
        throw new Error(`Failed to enhance content for chapter: ${chapterTitle}.`);
    }
};