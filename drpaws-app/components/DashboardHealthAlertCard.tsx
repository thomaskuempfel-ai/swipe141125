import React from 'react';
import { HistoricReport } from '../types';
import { AlertTriangleIcon } from './icons';

interface DashboardHealthAlertCardProps {
    report: HistoricReport;
    onViewDetails: () => void;
    t: (key: string) => string;
}

export const DashboardHealthAlertCard: React.FC<DashboardHealthAlertCardProps> = ({ report, onViewDetails, t }) => {
    const { sicknessIndicators } = report;
    if (!sicknessIndicators) return null;
    
    const concernLevel = sicknessIndicators.overallConcernLevel;
    const concernColorClass = concernLevel === 'Very High' ? 'border-red-500' : 'border-yellow-500';

    return (
        <div className={`bg-red-900/20 p-6 rounded-2xl shadow-lg border-2 ${concernColorClass}`}>
            <div className="flex flex-col items-center text-center">
                <AlertTriangleIcon className="w-8 h-8 text-red-400 mb-2" />
                <h2 className="text-lg font-bold text-red-300">{t('dashboard_health_alert')}</h2>
                <p className="text-sm text-slate-300 mt-2 mb-4">{sicknessIndicators.summary}</p>
                <button
                    onClick={onViewDetails}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    {t('dashboard_view_details')}
                </button>
            </div>
        </div>
    );
};
