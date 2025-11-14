import React from 'react';
import { PetProfile } from '../types';
import { SparklesIcon, ClapperboardIcon } from './icons';

interface BirthdayModalProps {
    pet: PetProfile;
    onClose: () => void;
    onGenerate: () => void;
    t: (key: string, options?: any) => string;
}

export const BirthdayModal: React.FC<BirthdayModalProps> = ({ pet, onClose, onGenerate, t }) => {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8 relative border border-gray-200 dark:border-teal-500/30 text-center transform transition-all animate-slide-in-up">
                <div className="mx-auto mb-4 flex items-center justify-center h-20 w-20 rounded-full bg-teal-100 dark:bg-teal-900/50">
                    {pet.photo ? (
                        <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <SparklesIcon className="h-10 w-10 text-teal-600 dark:text-teal-400" />
                    )}
                </div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('happy_birthday_title', { petName: pet.name })}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">{t('happy_birthday_desc', { petName: pet.name })}</p>

                <div className="space-y-3">
                    <button
                        onClick={onGenerate}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-teal-600 py-3 px-4 text-base font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-transform transform hover:scale-105"
                    >
                        <ClapperboardIcon className="w-5 h-5" />
                        {t('generate_year_in_review_button')}
                    </button>
                     <button
                        onClick={onClose}
                        className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-semibold py-2 px-4 rounded-lg"
                    >
                        {t('close_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};