import React, { useRef } from 'react';
import { HistoricReport, AppView } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface MemoryCarouselProps {
    reports: HistoricReport[];
    onViewReport: (report: HistoricReport) => void;
    setActiveView: (view: AppView) => void;
    t: (key: string, options?: any) => string;
}

export const MemoryCarousel: React.FC<MemoryCarouselProps> = ({ reports, onViewReport, setActiveView, t }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };
    
    if (reports.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('recent_memories_title')}</h2>
                <button 
                    onClick={() => setActiveView('memories')}
                    className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                    {t('see_all_memories_button')}
                </button>
            </div>
            <div className="relative">
                <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
                    {reports.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => onViewReport(report)}
                            className="flex-shrink-0 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden group border border-gray-200 dark:border-slate-700 transform transition-transform hover:-translate-y-1"
                        >
                            <div className="w-full h-32 bg-slate-200 dark:bg-slate-700">
                                {report.petSnapshot && (
                                    <img src={report.petSnapshot} alt={report.petName} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="p-3 text-left">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t(`emotion_${report.emotion.toLowerCase()}`)}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(report.timestamp).toLocaleDateString()}</p>
                            </div>
                        </button>
                    ))}
                </div>
                 {reports.length > 2 && (
                    <>
                        <button 
                            onClick={() => scroll('left')}
                            className="absolute top-1/2 -translate-y-1/2 -left-3 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/80 shadow-md flex items-center justify-center border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => scroll('right')}
                            className="absolute top-1/2 -translate-y-1/2 -right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/80 shadow-md flex items-center justify-center border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                        >
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
