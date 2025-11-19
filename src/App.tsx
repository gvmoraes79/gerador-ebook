import React, { useState, useCallback, useRef } from 'react';
import type { Ebook, Chapter, EnhanceOptions } from './types';
import { generateOutline, generateChapterContent, generateCoverImage, selectTopReferences, structureText, enhanceChapterContent } from './services/geminiService';
import { extractTextFromFile } from './services/fileService';
import { generatePdf } from './services/pdfService';
import { EbookPreview } from './components/EbookPreview';
import { TopicForm } from './components/TopicForm';
import { EnhanceForm } from './components/EnhanceForm';
import { Loader } from './components/Loader';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('');
    const [ebook, setEbook] = useState<Ebook | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'create' | 'enhance'>('create');
    const [isDiagrammed, setIsDiagrammed] = useState<boolean>(true);
    const ebookPreviewRef = useRef<HTMLDivElement>(null);

    const handleGenerateEbook = useCallback(async (currentTopic: string, minPageCount: number, maxPageCount: number, language: string, includeImages: boolean, observations: string) => {
        if (!currentTopic.trim()) {
            setError('Por favor, insira um tópico.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setEbook(null);
        setTopic(currentTopic);
        setIsDiagrammed(true);

        try {
            setStatusMessage('Elaborando o plano... (Gerando esboço)');
            const outline = await generateOutline(currentTopic, minPageCount, maxPageCount, language, observations);

            setStatusMessage('Criando uma capa incrível...');
            const coverImage = await generateCoverImage(outline.title, currentTopic);

            const generatedEbook: Ebook = {
                title: outline.title,
                topic: currentTopic,
                chapters: [],
                references: new Set<string>(),
                coverImage: coverImage,
            };
            
            setEbook({ ...generatedEbook });

            const chapterTitles = ['Introdução', ...outline.chapters, 'Conclusão'];

            for (let i = 0; i < chapterTitles.length; i++) {
                const chapterTitle = chapterTitles[i];
                let statusMsg = `Dando vida às ideias... (Escrevendo: ${chapterTitle})`;
                if (includeImages) {
                    statusMsg += ' e criando imagem';
                }
                setStatusMessage(statusMsg);

                const result = await generateChapterContent(outline.title, chapterTitle, language, includeImages, observations);
                
                if (result) {
                    generatedEbook.chapters.push({ title: chapterTitle, content: result.content, image: result.image });
                    result.sources.forEach(source => generatedEbook.references.add(source));
                    setEbook({ ...generatedEbook });
                }
            }

            if (generatedEbook.references.size > 3) {
                setStatusMessage('Selecionando as fontes mais importantes...');
                const topReferences = await selectTopReferences(generatedEbook.references, generatedEbook.topic, language);
                generatedEbook.references = topReferences;
                setEbook({ ...generatedEbook });
            }
            
            setStatusMessage('E-book gerado com sucesso!');

        } catch (err) {
            console.error(err);
            setError('Ocorreu um erro ao gerar o e-book. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleEnhanceEbook = useCallback(async (file: File, options: EnhanceOptions) => {
        setIsLoading(true);
        setError(null);
        setEbook(null);
        setTopic(file.name);
        setIsDiagrammed(options.diagramming);

        try {
            setStatusMessage('Analisando seu documento...');
            const text = await extractTextFromFile(file);

            setStatusMessage('Identificando a estrutura do e-book...');
            const structuredDoc = await structureText(text);
            
            let coverImage: string | undefined = undefined;
            if (options.diagramming) {
                setStatusMessage('Criando uma capa incrível...');
                coverImage = await generateCoverImage(structuredDoc.title, structuredDoc.title);
            }

            const generatedEbook: Ebook = {
                title: structuredDoc.title,
                topic: file.name,
                chapters: [],
                references: new Set<string>(),
                coverImage: coverImage,
            };
            setEbook({ ...generatedEbook });

            for (let i = 0; i < structuredDoc.chapters.length; i++) {
                const chapter = structuredDoc.chapters[i];
                let statusMsg = `Aprimorando capítulo: ${chapter.title}`;
                 if (options.includeImages) {
                    statusMsg += ' e criando imagem';
                }
                setStatusMessage(statusMsg);

                const result = await enhanceChapterContent(chapter.title, chapter.content, options);

                if (result) {
                    const newChapter: Chapter = {
                        title: chapter.title,
                        content: result.content,
                        image: result.image,
                    };
                    generatedEbook.chapters.push(newChapter);
                    result.sources.forEach(source => generatedEbook.references.add(source));
                    setEbook({ ...generatedEbook });
                }
            }
            
            if (generatedEbook.references.size > 3) {
                setStatusMessage('Selecionando as fontes mais importantes...');
                const topReferences = await selectTopReferences(generatedEbook.references, generatedEbook.topic, options.language);
                generatedEbook.references = topReferences;
                setEbook({ ...generatedEbook });
            }

            setStatusMessage('E-book aprimorado com sucesso!');

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            setError(`Ocorreu um erro ao aprimorar o e-book. Detalhes: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleDownloadPdf = useCallback(async () => {
        if (!ebookPreviewRef.current || !ebook) return;
        setStatusMessage('Preparando seu PDF...');
        setIsLoading(true);
        try {
            await generatePdf(ebookPreviewRef.current, ebook.title);
        } catch(err) {
            console.error("PDF generation failed:", err);
            setError("Não foi possível gerar o PDF. Por favor, tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }, [ebook]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">Sua Fábrica de E-books com IA</h2>
                    <p className="text-slate-400 mb-8 text-lg">
                       Crie um e-book do zero ou aprimore um documento existente com correções, traduções e imagens.
                    </p>
                </div>
                
                <div className="w-full max-w-xl mb-6">
                    <div className="flex border-b border-slate-700">
                        <button onClick={() => setMode('create')} disabled={isLoading} className={`px-4 py-2 text-lg font-semibold transition-colors duration-300 disabled:opacity-50 ${mode === 'create' ? 'border-b-2 border-cyan-400 text-white' : 'text-slate-400 hover:text-white'}`}>
                            Criar do Zero
                        </button>
                        <button onClick={() => setMode('enhance')} disabled={isLoading} className={`px-4 py-2 text-lg font-semibold transition-colors duration-300 disabled:opacity-50 ${mode === 'enhance' ? 'border-b-2 border-cyan-400 text-white' : 'text-slate-400 hover:text-white'}`}>
                            Aprimorar Documento
                        </button>
                    </div>
                </div>

                {mode === 'create' ? (
                    <TopicForm onSubmit={handleGenerateEbook} isLoading={isLoading} />
                ) : (
                    <EnhanceForm onSubmit={handleEnhanceEbook} isLoading={isLoading} />
                )}

                {error && <p className="text-red-400 mt-4 bg-red-900/50 p-3 rounded-md">{error}</p>}
                
                {isLoading && !ebook && <Loader message={statusMessage} />}

                {ebook && (
                    <div className="w-full max-w-4xl mt-12">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-white">Seu E-book está Pronto</h3>
                            <button
                                onClick={handleDownloadPdf}
                                disabled={isLoading}
                                className="px-6 py-2 bg-cyan-500 text-slate-900 font-semibold rounded-lg shadow-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition duration-300 ease-in-out disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center"
                            >
                                {isLoading && statusMessage.includes('PDF') ? (
                                    <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Gerando...
                                    </>
                                ) : 'Baixar como PDF'}
                            </button>
                        </div>
                        <EbookPreview ref={ebookPreviewRef} ebook={ebook} diagramming={isDiagrammed} />
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default App;