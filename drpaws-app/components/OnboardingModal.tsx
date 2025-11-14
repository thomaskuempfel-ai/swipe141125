import React, { useState } from 'react';
import { PawPrintIcon, SparklesIcon, CheckCircleIcon, ShareIcon, HeartIcon } from './icons';

interface OnboardingModalProps {
    onClose: () => void;
    t: (key: string, options?: any) => string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, t }) => {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const StepIndicator: React.FC = () => (
        <div className="flex justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i + 1 === step ? 'bg-teal-500' : 'bg-gray-300 dark:bg-slate-600'}`}></div>
            ))}
        </div>
    );
    
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="mx-auto mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-900/50">
                            <PawPrintIcon className="h-9 w-9 text-teal-600 dark:text-teal-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('onboarding_welcome_family')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{t('onboarding_intro')}</p>
                        
                        <div className="space-y-4 text-left bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                             <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /> <span dangerouslySetInnerHTML={{ __html: t('onboarding_social_proof_users') }} /></p>
                             <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-yellow-500" /> <span dangerouslySetInnerHTML={{ __html: t('onboarding_social_proof_translations') }} /></p>
                             <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2"><HeartIcon className="w-5 h-5 text-pink-500" /> <span dangerouslySetInnerHTML={{ __html: t('onboarding_social_proof_bond') }} /></p>
                             <blockquote className="border-l-4 border-teal-500 pl-4 py-2 mt-4">
                                 <p className="italic text-slate-500 dark:text-slate-400">{t('onboarding_testimonial_text')}</p>
                                 <cite className="text-xs text-slate-400 dark:text-slate-500 block text-right mt-1">{t('onboarding_testimonial_author')}</cite>
                             </blockquote>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <div className="mx-auto mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-900/50">
                            <SparklesIcon className="h-9 w-9 text-teal-600 dark:text-teal-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('onboarding_step2_title_new')}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{t('onboarding_step2_desc_new')}</p>
                    </>
                );
            case 3:
                return (
                    <>
                        <div className="mx-auto mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-900/50">
                            <CheckCircleIcon className="h-9 w-9 text-teal-600 dark:text-teal-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('onboarding_step3_title_new')}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{t('onboarding_step3_desc_new')}</p>
                    </>
                );
            case 4:
                return (
                    <>
                        <div className="mx-auto mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-900/50">
                            <ShareIcon className="h-9 w-9 text-teal-600 dark:text-teal-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('onboarding_step4_title')}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{t('onboarding_step4_desc')}</p>
                    </>
                );
            default: return null;
        }
    }


    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative border border-gray-200 dark:border-gray-700 text-center transform transition-all animate-slide-in-up">
                <div className="p-8 min-h-[450px] flex flex-col justify-center">
                    <div className="animate-fade-in-fast">
                      {renderStepContent()}
                    </div>
                </div>
                
                <div className="p-6 bg-gray-50 dark:bg-slate-900/50 rounded-b-2xl border-t border-gray-200 dark:border-slate-700 space-y-4">
                    <StepIndicator />
                    <div className="flex items-center justify-between gap-4">
                         <button
                            onClick={prevStep}
                            className={`rounded-md py-2 px-4 text-sm font-semibold transition-opacity ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                         >
                            {t('onboarding_back_button')}
                         </button>
                        
                         {step < totalSteps ? (
                            <button
                                onClick={nextStep}
                                className="rounded-md bg-teal-600 py-2 px-6 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                            >
                                {t('onboarding_next_button')}
                            </button>
                         ) : (
                             <button
                                onClick={onClose}
                                className="rounded-md bg-teal-600 py-2 px-6 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                            >
                                {t('onboarding_cta_finish')}
                            </button>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;