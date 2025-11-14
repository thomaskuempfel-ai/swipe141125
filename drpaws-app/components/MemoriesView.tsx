import React from 'react';
import { HistoricReport, Language } from '../types';
import { ChevronLeftIcon, NoMemoriesIcon, PawPrintIcon } from './icons';

interface MemoriesViewProps {
    reports: HistoricReport[];
    onViewReport: (report: HistoricReport) => void;
    onBack: () => void;
    t: (key: string, options?: any) => string;
    language: Language;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({ reports, onViewReport, onBack, t, language }) => {
    
    const sortedReports = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="w-full h-screen flex flex-col p-4 bg-slate-900 text-white">
            <header className="flex items-center justify-between mb-6 flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Memories</h1>
                <div className="w-10"></div>
            </header>

            {sortedReports.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-500 text-center">
                    <NoMemoriesIcon className="w-16 h-16 mb-4" />
                    <h2 className="text-xl font-semibold">No Memories Yet</h2>
                    <p>Your past analyses will appear here.</p>
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {sortedReports.map(report => (
                        <button 
                            key={report.id} 
                            onClick={() => onViewReport(report)}
                            className="group aspect-square rounded-xl overflow-hidden relative shadow-lg"
                        >
                            {report.petSnapshot ? (
                                <img src={report.petSnapshot} alt={report.petName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <PawPrintIcon className="w-12 h-12 text-slate-600" />
                                </div>
                            )}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                             <div className="absolute bottom-2 left-2 text-white text-left">
                                <p className="font-bold text-sm">{report.petName}</p>
                                <p className="text-xs">{new Date(report.timestamp).toLocaleDateString(language, { month: 'short', day: 'numeric' })}</p>
                             </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
