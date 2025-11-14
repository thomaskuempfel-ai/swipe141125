import React, { useState, useEffect } from 'react';
import { PetProfile, PetNeed, NeedRecommendation } from '../types';
import { getNeedRecommendation } from '../services/geminiService';
import { XIcon, SpinnerIcon, LightbulbIcon, PawPrintIcon } from './icons';

interface NeedRecommendationModalProps {
    pet: PetProfile;
    need: PetNeed;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}

export const NeedRecommendationModal: React.FC<NeedRecommendationModalProps> = ({ pet, need, onClose, t }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<NeedRecommendation | null>(null);

    useEffect(() => {
        if (!pet || !need) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getNeedRecommendation(pet, need, 'en');
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : t('error_unknown'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [pet, need, t]);

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative border border-slate-700 max-h-[90vh] flex flex-col animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 flex-shrink-0 flex justify-between items-center border-b border-slate-700">
                    <h2 className="text-xl font-bold text-teal-400">{t(`need_${need.toLowerCase()}`)}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="overflow-y-auto p-6">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <SpinnerIcon className="w-10 h-10 mb-4" />
                            <p>{t('loading_recommendations_for', { need: t(`need_${need.toLowerCase()}`) })}</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center text-red-400">
                            <p>{t('error_oh_no')}</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {data && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-100 text-center mb-4">{data.title}</h3>
                                <p className="text-slate-300 bg-slate-900/50 p-4 rounded-lg">{data.recommendation}</p>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-teal-400 mb-2 flex items-center gap-2">
                                    <LightbulbIcon className="w-5 h-5"/>
                                    {t('actionable_tips_title')}
                                </h4>
                                <ul className="space-y-3">
                                    {data.tips.map((tip, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <PawPrintIcon className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
                                            <span className="text-slate-300">{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
                 <footer className="p-4 border-t border-slate-700 text-right">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-slate-600 py-2 px-6 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
                    >
                        {t('close_button')}
                    </button>
                </footer>
            </div>
        </div>
    );
};