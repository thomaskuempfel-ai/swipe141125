import React from 'react';
import { HistoricReport, Language } from '../types';
import { SparklesIcon, XIcon } from './icons';

interface PositiveMemoryReminderProps {
    report: HistoricReport;
    onView: (report: HistoricReport) => void;
    onDismiss: () => void;
    t: (key: string, options?: any) => string;
    language: Language;
}

const getEmotionColorClass = (emotion: string) => {
    switch (emotion.toLowerCase()) {
        case 'playful': return 'text-yellow-400';
        case 'calm': return 'text-teal-400';
        default: return 'text-slate-200';
    }
};

export const PositiveMemoryReminder: React.FC<PositiveMemoryReminderProps> = ({ report, onView, onDismiss, t, language }) => {
    const emotionText = t(`emotion_${report.emotion.toLowerCase()}`, language);
    const emotionColor = getEmotionColorClass(report.emotion);

    const descriptionText = t('positive_memory_desc', { petName: report.petName, emotion: `%%${emotionText.toLowerCase()}%%` });
    const descriptionParts = descriptionText.split('%%');

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-teal-500/30 transform transition-all animate-slide-in-up">
                <div className="p-6 text-center">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <SparklesIcon className="w-6 h-6 text-yellow-400" />
                        <h2 className="text-xl font-bold text-white">{t('positive_memory_title')}</h2>
                    </div>
                    {report.petSnapshot && (
                        <div className="w-full aspect-video rounded-lg overflow-hidden mb-4 shadow-lg mx-auto">
                            <img src={report.petSnapshot} alt={report.petName} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <p className="text-slate-300">
                        {descriptionParts[0]}
                        <span className={`font-bold ${emotionColor}`}>{descriptionParts[1]}</span>
                        {descriptionParts[2]}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {new Date(report.timestamp).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-b-2xl flex flex-col gap-3">
                    <button
                        onClick={() => onView(report)}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        {t('revisit_this_memory')}
                    </button>
                    <button
                        onClick={onDismiss}
                        className="w-full text-slate-400 hover:text-white text-sm font-semibold py-2 px-4 rounded-lg"
                    >
                        {t('close_button')}
                    </button>
                </div>
            </div>
             <button
                onClick={onDismiss}
                className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                aria-label={t('close_button')}
            >
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};
