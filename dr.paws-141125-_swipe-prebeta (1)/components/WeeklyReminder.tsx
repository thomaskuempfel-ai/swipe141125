import React from 'react';
import { HistoricReport, Language } from '../types';
import { SparklesIcon, XIcon } from './icons';

interface WeeklyReminderProps {
    report: HistoricReport;
    onView: (report: HistoricReport) => void;
    onDismiss: () => void;
    t: (key: string, options?: any) => string;
    language: Language;
}

export const WeeklyReminder: React.FC<WeeklyReminderProps> = ({ report, onView, onDismiss, t, language }) => {
    const emotionText = t(`emotion_${report.emotion.toLowerCase()}`, language);

    return (
        <div className="w-full mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-r-lg animate-fade-in text-left relative">
            <div className="flex items-start gap-4">
                <SparklesIcon className="w-8 h-8 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-1" />
                <div className="flex-grow">
                    <h3 className="text-base font-bold text-yellow-800 dark:text-yellow-200">{t('weekly_reminder_title_dynamic', { emotion: emotionText })}</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 mb-3">
                       {t('weekly_reminder_desc_dynamic', { petName: report.petName, emotion: emotionText.toLowerCase() })}
                    </p>
                     <button 
                        onClick={() => onView(report)}
                        className="bg-yellow-400 text-yellow-900 text-xs font-bold py-1.5 px-3 rounded-full hover:bg-yellow-500 transition-transform transform hover:scale-105"
                    >
                        {t('revisit_memory_lane_button')}
                    </button>
                </div>
            </div>
             <button 
                onClick={onDismiss}
                className="absolute top-2 right-2 p-1 rounded-full text-yellow-700/70 dark:text-yellow-300/70 hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50"
                aria-label="Dismiss reminder"
            >
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};