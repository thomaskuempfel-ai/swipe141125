import React from 'react';
import { HistoricReport } from '../types';
import { SoundWaveIcon } from './icons';

interface DashboardAudioCardProps {
    report: HistoricReport;
    t: (key: string) => string;
}

export const DashboardAudioCard: React.FC<DashboardAudioCardProps> = ({ report, t }) => {
    const { audioAnalysis } = report;
    if (!audioAnalysis) return null;

    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <SoundWaveIcon className="w-5 h-5 text-teal-400" />
                {t('dashboard_sound_analysis')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{t('dashboard_vocalization_type')}</p>
                    <p className="text-xl font-bold text-slate-200">{audioAnalysis.vocalizationType}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{t('dashboard_intensity')}</p>
                    <p className="text-xl font-bold text-slate-200">{audioAnalysis.intensity}%</p>
                </div>
            </div>
            {audioAnalysis.correlation && (
                 <div className="mt-4 pt-4 border-t border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-300 mb-1">{t('dashboard_correlation')}</h3>
                    <p className="text-sm text-slate-400">{audioAnalysis.correlation}</p>
                </div>
            )}
        </div>
    );
};
