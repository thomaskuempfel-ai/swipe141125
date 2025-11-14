
import React from 'react';
import { HistoricReport, DailyTipsResponse } from '../types';
import { t } from '../localization/translations';
import { HeartIcon, SparklesIcon, AlertTriangleIcon, LightbulbIcon } from './icons';
import { DailyTip } from './DailyTip';

interface EditorCardProps {
    report: HistoricReport;
    sharedImageUrl: string | null;
    dailyTip: string | DailyTipsResponse | null;
    isTipLoading: boolean;
}

const getEmotionColor = (emotion?: string) => {
    switch (emotion?.toLowerCase()) {
        case 'anxious': case 'pain': case 'grumpy': return 'text-red-400';
        case 'playful': return 'text-yellow-400';
        case 'calm': return 'text-teal-400';
        case 'hungry': return 'text-orange-400';
        default: return 'text-slate-200';
    }
};

export const EditorCard: React.FC<EditorCardProps> = ({ report, sharedImageUrl, dailyTip, isTipLoading }) => {

    const localT = (key: string, options?: any) => t(key, 'en', options);
    const emotionText = localT(`emotion_${report.emotion.toLowerCase()}`);
    let attitudeText = '';
    if (report.attitude) {
        const attitudeKey = `attitude_${report.attitude.trim().toLowerCase()}`;
        attitudeText = localT(attitudeKey);
        if (attitudeText === attitudeKey) {
            attitudeText = report.attitude; // Fallback to original if no translation
        }
    }
    const emotionColorClass = getEmotionColor(report.emotion);

    return (
        <div className="swipe-card justify-start pt-8">
            <div className="w-full max-w-md mx-auto flex flex-col gap-6">
                <div className="relative w-full aspect-square bg-slate-800 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
                    {sharedImageUrl ? (
                        <img src={sharedImageUrl} alt={report.petName} className="w-full h-full object-cover" />
                    ) : (
                        <p className="text-slate-400">No image available</p>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-between p-4">
                        <div className="flex justify-end animate-pulse-heart">
                            <div className="relative">
                                <HeartIcon className="w-20 h-20 text-red-500/80 drop-shadow-lg" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold">
                                    <span className="text-3xl drop-shadow-md">{report.score || 0}</span>
                                    <span className="text-xs -mt-1 tracking-tight drop-shadow-md">score</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                             {attitudeText && (
                                <h3 className="text-3xl font-bold text-purple-300 drop-shadow-lg animate-text-glow font-kalam">{attitudeText}</h3>
                             )}
                            <h2 className={`text-5xl font-bold ${emotionColorClass} drop-shadow-lg animate-text-glow font-kalam`}>{emotionText}</h2>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-[var(--accent-color-light)] mb-2 flex items-center gap-2">
                       <SparklesIcon className="w-5 h-5"/> Dr. Paws' Insights
                    </h3>
                    <div className="text-sm text-[var(--text-secondary)] space-y-3">
                        {report.sicknessIndicators && (
                            <div className="p-3 bg-red-900/30 rounded-md border border-red-500/30">
                                <h4 className="font-bold text-red-300 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4"/> Health Summary</h4>
                                <p className="italic mt-1">{report.sicknessIndicators.summary}</p>
                            </div>
                        )}
                        <p className="italic">"{report.detailedAnalysis}"</p>
                    </div>
                </div>
                
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-[var(--accent-color-light)] mb-2 flex items-center gap-2">
                       <LightbulbIcon className="w-5 h-5"/> {localT('daily_tip_title')}
                    </h3>
                    <DailyTip tip={dailyTip} isLoading={isTipLoading} t={localT} />
                </div>
            </div>
        </div>
    );
};
