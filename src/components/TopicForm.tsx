import React, { useState } from 'react';

interface TopicFormProps {
    onSubmit: (topic: string, minPageCount: number, maxPageCount: number, language: string, includeImages: boolean, observations: string) => void;
    isLoading: boolean;
}

export const TopicForm: React.FC<TopicFormProps> = ({ onSubmit, isLoading }) => {
    const [topic, setTopic] = useState('');
    const [minPageCount, setMinPageCount] = useState(20);
    const [maxPageCount, setMaxPageCount] = useState(30);
    const [language, setLanguage] = useState('Português');
    const [includeImages, setIncludeImages] = useState(false);
    const [observations, setObservations] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(topic, minPageCount, maxPageCount, language, includeImages, observations);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col items-center gap-4 bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <div className="w-full">
                <label htmlFor="topic-input" className="block text-sm font-medium text-slate-300 mb-2">
                    Tópico do E-book
                </label>
                <input
                    id="topic-input"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: A História do Império Inca"
                    className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                    disabled={isLoading}
                    aria-required="true"
                />
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
                <div>
                    <label htmlFor="min-pages-input" className="block text-sm font-medium text-slate-300 mb-2">
                        Páginas (mín)
                    </label>
                    <input
                        id="min-pages-input"
                        type="number"
                        value={minPageCount}
                        onChange={(e) => setMinPageCount(Number(e.target.value))}
                        min="5"
                        max="100"
                        className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                        disabled={isLoading}
                    />
                </div>
                 <div>
                    <label htmlFor="max-pages-input" className="block text-sm font-medium text-slate-300 mb-2">
                        Páginas (máx)
                    </label>
                    <input
                        id="max-pages-input"
                        type="number"
                        value={maxPageCount}
                        onChange={(e) => setMaxPageCount(Number(e.target.value))}
                        min="5"
                        max="100"
                        className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="w-full">
                <label htmlFor="language-select" className="block text-sm font-medium text-slate-300 mb-2">
                    Idioma
                </label>
                <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                    disabled={isLoading}
                >
                    <option value="Português">Português</option>
                    <option value="English">English</option>
                    <option value="Español">Español</option>
                    <option value="Français">Français</option>
                    <option value="Italiano">Italiano</option>
                    <option value="Mandarim">Mandarim</option>
                </select>
            </div>
            
            <div className="w-full">
                <label htmlFor="observations-input-create" className="block text-sm font-medium text-slate-300 mb-2">
                    Observações Adicionais (opcional)
                </label>
                <textarea
                    id="observations-input-create"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Ex: Usar um tom mais irônico, focar na economia do império..."
                    className="w-full h-24 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300 resize-y"
                    disabled={isLoading}
                />
            </div>

            <div className="w-full mt-2">
                <label htmlFor="include-images-checkbox" className="flex items-center gap-2 text-sm font-medium text-slate-300 cursor-pointer">
                    <input
                        id="include-images-checkbox"
                        type="checkbox"
                        checked={includeImages}
                        onChange={(e) => setIncludeImages(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                        disabled={isLoading}
                    />
                    Incluir imagens geradas por IA?
                </label>
            </div>


            <button
                type="submit"
                disabled={isLoading || !topic.trim()}
                className="w-full mt-2 px-8 py-3 bg-cyan-500 text-slate-900 font-semibold rounded-lg shadow-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition duration-300 ease-in-out disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Gerando...</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                           <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                        <span>Gerar E-book</span>
                    </>
                )}
            </button>
        </form>
    );
};