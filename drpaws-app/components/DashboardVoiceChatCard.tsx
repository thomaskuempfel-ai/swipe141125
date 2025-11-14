import React from 'react';
import { DrPawsChatIcon } from './icons';

interface DashboardVoiceChatCardProps {
    onStartChat: () => void;
    t: (key: string) => string;
}

export const DashboardVoiceChatCard: React.FC<DashboardVoiceChatCardProps> = ({ onStartChat, t }) => {
    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 text-center">
            <DrPawsChatIcon className="w-10 h-10 text-teal-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-100">{t('dashboard_talk_to_dr_paws_title')}</h2>
            <p className="text-sm text-slate-400 mt-1 mb-4">{t('dashboard_talk_to_dr_paws_desc')}</p>
            <button
                onClick={onStartChat}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                {t('dashboard_talk_to_dr_paws_button')}
            </button>
        </div>
    );
};
