import React, { useState } from 'react';
import type { EnhanceOptions } from '../types';

interface EnhanceFormProps {
    onSubmit: (file: File, options: EnhanceOptions) => void;
    isLoading: boolean;
}

export const EnhanceForm: React.FC<EnhanceFormProps> = ({ onSubmit, isLoading }) => {
    const [file, setFile] = useState<File | null>(null);
    const [style, setStyle] = useState<EnhanceOptions['style']>('AsIs');
    const [language, setLanguage] = useState('Português');
    const [includeImages, setIncludeImages] = useState(false);
    const [diagramming, setDiagramming] = useState(true);
    const [observations, setObservations] = useState('');
    const [fileName, setFileName] = useState('Nenhum arquivo selecionado');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if(selectedFile.name.endsWith('.pdf') || selectedFile.name.endsWith('.docx')) {
                setFile(selectedFile);
                setFileName(selectedFile.name);
            } else {
                alert("Por favor, selecione um arquivo .pdf ou .docx");
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file) {
            onSubmit(file, { style, language, includeImages, diagramming, observations });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col items-center gap-4 bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            
            <div className="w-full">
                <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">
                    Seu Documento (.pdf, .docx)
                </label>
                <label htmlFor="file-upload" className="w-full flex items-center justify-between bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg px-4 py-3 focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-500 transition duration-300 cursor-pointer hover:bg-slate-600">
                    <span className="truncate pr-2">{fileName}</span>
                    <span className="font-semibold text-cyan-400">Selecionar Arquivo</span>
                </label>
                <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    aria-required="true"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
                <div>
                    <label htmlFor="style-select" className="block text-sm font-medium text-slate-300 mb-2">
                        Estilo de Escrita
                    </label>
                    <select
                        id="style-select"
                        value={style}
                        onChange={(e) => setStyle(e.target.value as EnhanceOptions['style'])}
                        className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                        disabled={isLoading}
                    >
                        <option value="AsIs">Corrigir e Manter</option>
                        <option value="MoreFormal">Mais Formal</option>
                        <option value="MoreCasual">Mais Casual</option>
                        <option value="MoreDidactic">Mais Didático</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="language-select-enhance" className="block text-sm font-medium text-slate-300 mb-2">
                        Traduzir para
                    </label>
                    <select
                        id="language-select-enhance"
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
            </div>
            
            <div className="w-full">
                <label htmlFor="observations-input-enhance" className="block text-sm font-medium text-slate-300 mb-2">
                    Observações Adicionais (opcional)
                </label>
                <textarea
                    id="observations-input-enhance"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Ex: Manter a estrutura original mas usar um tom mais formal..."
                    className="w-full h-24 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300 resize-y"
                    disabled={isLoading}
                />
            </div>

            <div className="w-full mt-2 space-y-3">
                <label htmlFor="include-images-checkbox-enhance" className="flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer">
                    <input
                        id="include-images-checkbox-enhance"
                        type="checkbox"
                        checked={includeImages}
                        onChange={(e) => setIncludeImages(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                        disabled={isLoading}
                    />
                    <span>Incrementar com imagens geradas por IA?</span>
                </label>
                <label htmlFor="diagramming-checkbox-enhance" className="flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer">
                    <input
                        id="diagramming-checkbox-enhance"
                        type="checkbox"
                        checked={diagramming}
                        onChange={(e) => setDiagramming(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                        disabled={isLoading}
                    />
                    <span>Aplicar diagramação de e-book (capa, índice)?</span>
                </label>
            </div>


            <button
                type="submit"
                disabled={isLoading || !file}
                className="w-full mt-2 px-8 py-3 bg-cyan-500 text-slate-900 font-semibold rounded-lg shadow-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition duration-300 ease-in-out disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Aprimorando...</span>
                    </>
                ) : (
                    <>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>Aprimorar Documento</span>
                    </>
                )}
            </button>
        </form>
    );
};