import React from 'react';
import { PetProfile } from '../types';
import { XIcon, BrainIcon } from './icons';

interface BreedInfoModalProps {
    pet: PetProfile;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}

export const BreedInfoModal: React.FC<BreedInfoModalProps> = ({ pet, onClose, t }) => {
    if (!pet.breedInfo) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{pet.breed}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{t('breed_insights_for', { petName: pet.name })}</p>
                </div>
                
                <div className="overflow-y-auto p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <BrainIcon className="w-5 h-5" />
                            {t('characteristics_summary')}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-900/50 p-4 rounded-lg">
                            {pet.breedInfo.summary}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('learn_more_online')}</h3>
                        <div className="space-y-3">
                            {pet.breedInfo.articles.map((article, index) => (
                                <a 
                                    key={index} 
                                    href={article.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block p-3 bg-gray-100 dark:bg-slate-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <p className="font-semibold text-teal-700 dark:text-teal-400">{article.title}</p>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-slate-700 text-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-6 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                        {t('close_button')}
                    </button>
                </div>

                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};