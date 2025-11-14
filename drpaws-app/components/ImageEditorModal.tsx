import React, { useState } from 'react';
import { XIcon, SparklesIcon, SpinnerIcon, DownloadIcon } from './icons';
import { editImageWithPrompt } from '../services/geminiService';

interface ImageEditorModalProps {
    imageSrc: string;
    petName: string;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ imageSrc, petName, onClose, t }) => {
    const [prompt, setPrompt] = useState('');
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEdit = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setEditedImage(null);
        try {
            const result = await editImageWithPrompt(imageSrc, prompt);
            setEditedImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('error_unknown'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleEdit();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 flex-shrink-0 flex justify-between items-center border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6" />
                        {t('image_editor_title')}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/50 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex-grow overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2 space-y-4">
                        <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden relative">
                            <img src={imageSrc} alt={t('original_image')} className="w-full h-full object-contain" />
                            <span className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full bg-black/50 text-white">{t('original_image')}</span>
                        </div>
                    </div>
                     <div className="w-full md:w-1/2 space-y-4 flex flex-col">
                        <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center relative">
                            {isLoading && <SpinnerIcon className="w-12 h-12 text-teal-400" />}
                            {error && <p className="text-red-400 text-sm p-4 text-center">{error}</p>}
                            {editedImage && <img src={editedImage} alt={t('edited_image')} className="w-full h-full object-contain" />}
                             {!isLoading && !editedImage && !error && (
                                <div className="text-center text-slate-500 p-4">
                                    <SparklesIcon className="w-12 h-12 mx-auto mb-2" />
                                    <p>{t('edited_image_placeholder')}</p>
                                </div>
                            )}
                            {(editedImage && !isLoading) && (
                                <span className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full bg-black/50 text-white">{t('edited_image')}</span>
                            )}
                        </div>
                    </div>
                </div>
                <footer className="p-4 border-t border-slate-700/50 flex-shrink-0 space-y-3">
                     <form onSubmit={handleFormSubmit} className="relative">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('image_editor_prompt_placeholder')}
                            className="w-full rounded-lg border-slate-600 bg-slate-900 text-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm pl-4 pr-32 py-3"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !prompt}
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-md bg-teal-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:bg-slate-500"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            {isLoading ? t('editing_image') : t('edit_image_button')}
                        </button>
                    </form>
                    <a
                        href={editedImage ?? undefined}
                        download={editedImage ? `DrPaws-Edited-${petName}.png` : undefined}
                        className={`w-full flex justify-center items-center gap-2 rounded-md py-3 text-sm font-semibold text-white shadow-sm transition-colors ${editedImage && !isLoading ? 'bg-slate-600 hover:bg-slate-700' : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'}`}
                        onClick={(e) => !editedImage && e.preventDefault()}
                    >
                        <DownloadIcon className="w-5 h-5" />
                        {t('download_edited_image')}
                    </a>
                </footer>
            </div>
        </div>
    );
};