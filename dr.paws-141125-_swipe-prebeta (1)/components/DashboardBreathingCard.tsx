
import React from 'react';
import { HistoricReport } from '../types';
import { HeartbeatIcon } from './icons';

interface DashboardBreathingCardProps {
    report: HistoricReport;
    t: (key: string, options?: any) => string;
}

export const DashboardBreathingCard: React.FC<DashboardBreathingCardProps> = ({ report, t }) => {
    const { breathingAnalysis } = report;
    if (!breathingAnalysis) return null;

    const isConcerning = breathingAnalysis.pattern.toLowerCase().includes('labored') || breathingAnalysis.pattern.toLowerCase().includes('rapid');

    return (
        <div className={`bg-slate-800 p-6 rounded-2xl shadow-lg border ${isConcerning ? 'border-orange-500/50' : 'border-slate-700'}`}>
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <HeartbeatIcon className="w-5 h-5 text-teal-400" />
                {t('breathing_analysis_title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-lg text-center">
                    <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{t('breathing_pattern_label')}</p>
                    <p className={`text-xl font-bold ${isConcerning ? 'text-orange-400' : 'text-slate-200'}`}>{breathingAnalysis.pattern}</p>
                </div>
                {breathingAnalysis.rate && (
                    <div className="bg-slate-900/50 p-3 rounded-lg text-center">
                        <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{t('breathing_rate_label')}</p>
                        <p className="text-xl font-bold text-slate-200">{breathingAnalysis.rate} <span className="text-sm text-slate-400">{t('breathing_rate_unit')}</span></p>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-1">{t('breathing_implication_label')}</h3>
                <p className={`text-sm ${isConcerning ? 'text-orange-300' : 'text-slate-400'}`}>{breathingAnalysis.implication}</p>
            </div>
        </div>
    );
};
