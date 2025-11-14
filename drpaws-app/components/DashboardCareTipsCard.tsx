import React from 'react';
import { HistoricReport } from '../types';
import { WhatToDoNext } from './WhatToDoNext';

interface DashboardCareTipsCardProps {
    report: HistoricReport;
    t: (key: string, options?: any) => string;
}

export const DashboardCareTipsCard: React.FC<DashboardCareTipsCardProps> = ({ report, t }) => {
    return (
        <WhatToDoNext tips={report.careTips} t={t} />
    );
};
