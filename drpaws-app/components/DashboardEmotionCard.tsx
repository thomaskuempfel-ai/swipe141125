
import React from 'react';
import { HistoricReport, Language } from '../types';

interface DashboardEmotionCardProps {
    report: HistoricReport;
    t: (key: string, options?: any) => string;
    language: Language;
}

const getEmotionColorClass = (emotion: string) => {
    switch (emotion.toLowerCase()) {
        case 'anxious': case 'pain': case 'grumpy': return 'text-red-400 border-red-500/50';
        case 'playful': return 'text-yellow-400 border-yellow-500/50';
        case 'calm': return 'text-teal-400 border-teal-500/50';
        case 'hungry': return 'text-orange-400 border-orange-500/50';
        default: return 'text-slate-200 border-slate-600';
    }
};

export const DashboardEmotionCard: React.FC<DashboardEmotionCardProps> = ({ report, t, language }) => {
    const dominantEmotionClass = getEmotionColorClass(report.emotion);
    
    const secondaryEmotions = Object.entries(report.emotionScores)
        .filter(([emotion, score]) => (score as number) > 40 && emotion.toLowerCase() !== report.emotion.toLowerCase())
        .sort(([, scoreA], [, scoreB]) => (scoreB as number) - (scoreA as number));

    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-lg font-bold text-slate-100 mb-4">{t('dashboard_emotion_overview')}</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-1/3 text-center p-4 border-2 rounded-xl" style={{ borderColor: getEmotionColorClass(report.emotion).split(' ')[1].replace('border-', '#') }}>
                    <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{t('dashboard_primary_emotion')}</p>
                    <p className={`text-4xl font-bold ${dominantEmotionClass}`}>
                        {t(`emotion_${report.emotion.toLowerCase()}`)}
                    </p>
                </div>
                <div className="w-full sm:w-2/3">
                    <p className="text-sm font-semibold text-slate-300 mb-1">{t('dashboard_dr_paws_says')}</p>
                    <p className="text-lg italic text-slate-300 bg-slate-900/50 p-3 rounded-md">"{report.translation}"</p>
                </div>
            </div>

            {secondaryEmotions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">{t('dashboard_secondary_emotions')}</h3>
                    <div className="flex flex-wrap gap-2">
                        {secondaryEmotions.map(([emotion, score]) => (
                            <span key={emotion} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getEmotionColorClass(emotion)} bg-opacity-10 border`}>
                                {t(`emotion_${emotion.toLowerCase()}`)} ({score as number}%)
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
