import React from 'react';
import { PawPrintIcon, DashboardIcon } from './icons';

interface UploadCardProps {
    onUpload: () => void;
    onViewHub: () => void;
    t: (key: string) => string;
}

export const UploadCard: React.FC<UploadCardProps> = ({ onUpload, onViewHub, t }) => {
    return (
        <div className="swipe-card">
            <div className="flex flex-col items-center justify-center text-center">
                <button 
                    onClick={onUpload}
                    className="w-48 h-48 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-teal-500/50 mb-12"
                    aria-label={t('nav_new_analysis')}
                 >
                    <PawPrintIcon className="w-24 h-24" />
                 </button>
                 <button 
                    onClick={onViewHub}
                    className="flex items-center gap-2 py-2 px-4 rounded-full text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
                 >
                     <DashboardIcon className="w-5 h-5" />
                     <span className="font-semibold">{t('wellness_hub')}</span>
                 </button>
            </div>
        </div>
    );
};