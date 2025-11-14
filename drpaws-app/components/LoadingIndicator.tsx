import React from 'react';
import { PawPrintIcon } from './icons';

interface LoadingIndicatorProps {
  message: string;
  t: (key: string) => string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message, t }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <style>
        {`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-pulse-custom {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        `}
      </style>
      <PawPrintIcon className="w-20 h-20 text-teal-400 animate-pulse-custom" />
      <h2 className="mt-6 text-xl font-semibold text-slate-200">{t('loading_analyzing')}...</h2>
      <p className="mt-2 text-slate-400">{message}</p>
    </div>
  );
};
