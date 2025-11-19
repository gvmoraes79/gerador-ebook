import React, { forwardRef } from 'react';
import type { Ebook } from '../types';

interface EbookPreviewProps {
    ebook: Ebook;
    diagramming: boolean;
}

// Using ReactMarkdown would be better, but for simplicity and no extra deps, we'll just dangerously set HTML.
// A simple markdown to HTML converter.
const markdownToHtml = (text: string): string => {
    let html = text
        // Headings
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold mt-8 mb-4">$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/__(.*?)__/gim, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/_(.*?)_/gim, '<em>$1</em>')
        // Unordered lists
        .replace(/^\s*\n\* (.*)/gim, '<ul>\n<li class="ml-5 list-disc">$1</li>')
        .replace(/^\s*\* (.*)/gim, '<li class="ml-5 list-disc">$1</li>')
        // Paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br />');

    return `<p>${html}</p>`.replace(/<\/ul>\s*<br \/>/g, '</ul>');
};

export const EbookPreview = forwardRef<HTMLDivElement, EbookPreviewProps>(({ ebook, diagramming }, ref) => {
    // This outer div is for scrolling in the browser UI, it will not be part of the PDF
    return (
        <div className="bg-slate-800 p-4 md:p-8 rounded-lg max-h-[70vh] overflow-y-auto border border-slate-700 flex justify-center">
            {/* This inner div is what gets captured for the PDF. It simulates a continuous roll of A4 paper. */}
            <div ref={ref} className="bg-white text-slate-800 font-serif shadow-lg" style={{ width: '595pt' }}>
                {/* Cover Page: Full bleed, fixed A4 dimensions */}
                {diagramming && ebook.coverImage && (
                    <div className="w-full flex flex-col items-center justify-center text-center p-0" style={{ height: '842pt' }}>
                         <div className="w-full h-3/5 relative">
                             {ebook.coverImage ? (
                                 <img 
                                    src={`data:image/png;base64,${ebook.coverImage}`} 
                                    alt={`Capa do e-book sobre ${ebook.topic}`}
                                    className="w-full h-full object-cover"
                                />
                             ) : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                    <p className="text-slate-500">Gerando capa...</p>
                                </div>
                             )}
                        </div>
                        <div className="w-full h-2/5 flex flex-col justify-center p-12">
                            <h1 className="text-5xl font-bold text-slate-900 mb-4">{ebook.title}</h1>
                            <p className="text-2xl text-slate-600">Um Guia Detalhado sobre {ebook.topic}</p>
                        </div>
                    </div>
                )}

                {/* Content Wrapper: provides consistent padding (margins) for all subsequent content */}
                <div style={{ padding: '60pt' }}>
                    {/* Table of Contents */}
                    {diagramming && ebook.chapters.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-4xl font-bold mb-10 pb-3 border-b-2 border-cyan-500 text-slate-900">Índice</h2>
                            <ul className="space-y-4 text-xl">
                                {ebook.chapters.map((chapter, index) => (
                                    <li key={index} className="border-b border-slate-200 pb-2">
                                        <span><span className="font-semibold mr-2">{index + 1}.</span>{chapter.title}</span>
                                    </li>
                                ))}
                                {ebook.references.size > 0 && (
                                    <li className="border-b border-slate-200 pb-2">
                                        <span><span className="font-semibold mr-2">{ebook.chapters.length + 1}.</span>Referências</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                    
                    {/* Content Chapters */}
                    {ebook.chapters.map((chapter, index) => (
                        <div key={index} className="pt-8">
                            <div className="mb-6 pb-2 border-b-2 border-cyan-500">
                               <h2 className="text-3xl font-bold text-slate-900">{chapter.title}</h2>
                            </div>
                            
                            {chapter.image && (
                                <div className="my-6 flex justify-center">
                                    <img
                                        src={`data:image/png;base64,${chapter.image}`}
                                        alt={`Imagem para o capítulo: ${chapter.title}`}
                                        className="max-w-md h-auto rounded-lg shadow-lg object-contain"
                                    />
                                </div>
                            )}

                            <div
                                className="prose prose-lg max-w-none text-justify space-y-4 text-slate-800"
                                dangerouslySetInnerHTML={{ __html: markdownToHtml(chapter.content) }}
                            />
                        </div>
                    ))}
                    
                    {/* References Page */}
                    {ebook.references.size > 0 && (
                        <div className="pt-8">
                            <h2 className="text-3xl font-bold mb-6 pb-2 border-b-2 border-cyan-500 text-slate-900">Referências</h2>
                            <ul className="list-disc pl-5 space-y-2 prose prose-lg max-w-none">
                                {[...ebook.references].map((ref, i) => (
                                    <li key={i}>
                                        <a href={ref} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all hover:underline">{ref}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
