import React, { useState } from 'react';
import { ShieldCheckIcon, CheckCircleIcon } from './icons';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

interface PrivacyConsentModalProps {
    onAccept: () => void;
    t: (key: string) => string;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ onAccept, t }) => {
    const [isPolicyVisible, setIsPolicyVisible] = useState(false);

    return (
        <>
            <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative border border-gray-200 dark:border-gray-700 text-center transform transition-all animate-slide-in-up">
                    <div className="p-8">
                        <div className="mx-auto mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50">
                            <ShieldCheckIcon className="h-9 w-9 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('privacy_consent_title')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{t('privacy_consent_intro')}</p>
                        
                        <div className="space-y-3 text-left bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-start gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    <span className="font-bold">{t('privacy_consent_summary_1_title')}:</span> {t('privacy_consent_summary_1_desc')}
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    <span className="font-bold">{t('privacy_consent_summary_2_title')}:</span> {t('privacy_consent_summary_2_desc')}
                                </p>
                            </div>
                             <div className="flex items-start gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    <span className="font-bold">{t('privacy_consent_summary_3_title')}:</span> {t('privacy_consent_summary_3_desc')}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => setIsPolicyVisible(true)}
                                className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                            >
                                {t('privacy_consent_view_policy')}
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50 dark:bg-slate-900/50 rounded-b-2xl border-t border-gray-200 dark:border-slate-700">
                        <button
                            onClick={onAccept}
                            className="w-full rounded-md bg-teal-600 py-3 px-4 text-base font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                        >
                            {t('privacy_consent_accept')}
                        </button>
                    </div>
                </div>
            </div>
            {isPolicyVisible && <PrivacyPolicyModal onClose={() => setIsPolicyVisible(false)} t={t} />}
        </>
    );
};