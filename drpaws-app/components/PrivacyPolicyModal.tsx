import React from 'react';
import { XIcon } from './icons';

interface PrivacyPolicyModalProps {
    onClose: () => void;
    t: (key: string) => string;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ onClose, t }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast">
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl relative border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('privacy_policy_title')}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="overflow-y-auto p-6 space-y-4 text-slate-600 dark:text-slate-300">
                    <p className="text-xs text-slate-500">{t('privacy_policy_last_updated')}</p>
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{t('privacy_policy_section_1_title')}</h3>
                        <p className="whitespace-pre-wrap">{t('privacy_policy_section_1_content')}</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{t('privacy_policy_section_2_title')}</h3>
                        <p className="whitespace-pre-wrap">{t('privacy_policy_section_2_content')}</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{t('privacy_policy_section_3_title')}</h3>
                        <p className="whitespace-pre-wrap">{t('privacy_policy_section_3_content')}</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{t('privacy_policy_section_4_title')}</h3>
                        <p className="whitespace-pre-wrap">{t('privacy_policy_section_4_content')}</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{t('privacy_policy_section_5_title')}</h3>
                        <p className="whitespace-pre-wrap">{t('privacy_policy_section_5_content')}</p>
                    </div>
                     <div className="space-y-2">
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{t('privacy_policy_section_6_title')}</h3>
                        <p className="whitespace-pre-wrap">{t('privacy_policy_section_6_content')}</p>
                    </div>
                </div>
                 <footer className="p-4 border-t border-gray-200 dark:border-slate-700 text-right">
                    <button
                        onClick={onClose}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-6 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                        {t('close_button')}
                    </button>
                </footer>
            </div>
        </div>
    );
};