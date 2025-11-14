import React from 'react';
import { HistoricReport } from '../types';
import { MoonIcon } from './icons';

interface DashboardSleepCardProps {
    report: HistoricReport;
    t: (key: string) => string;
}

export const DashboardSleepCard: React.FC<DashboardSleepCardProps> = ({ report, t }) => {
    const { sleepAnalysis } = report;
    if (!sleepAnalysis) return null;

    const qualityColor = sleepAnalysis.sleepQuality > 75 ? 'text-green-400' : sleepAnalysis.sleepQuality > 50 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <MoonIcon className="w-5 h-5 text-teal-400" />
                {t('dashboard_sleep_analysis')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{t('dashboard_sleep_quality')}</p>
                    <p className={`text-3xl font-bold ${qualityColor}`}>{sleepAnalysis.sleepQuality}%</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{t('dashboard_dreaming')}</p>
                    <p className="text-3xl font-bold text-slate-200">{sleepAnalysis.dreamingPercentage}%</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{t('dashboard_disturbances')}</p>
                    <p className="text-3xl font-bold text-slate-200">{sleepAnalysis.disturbances}</p>
                </div>
            </div>
            {sleepAnalysis.dreamInterpretation && (
                 <div className="mt-4 pt-4 border-t border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-300 mb-1">{t('dashboard_dream_interpretation')}</h3>
                    <p className="text-sm italic text-slate-400">"{sleepAnalysis.dreamInterpretation}"</p>
                </div>
            )}
        </div>
    );
};
