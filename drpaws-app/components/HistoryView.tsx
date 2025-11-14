import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HistoricReport, PetProfile, Theme, Language } from '../types';
import { UserCircleIcon, CalendarIcon } from './icons';

interface MemoriesViewProps {
    reports: HistoricReport[];
    pets: PetProfile[];
    onViewReport: (report: HistoricReport) => void;
    theme: Theme;
    language: Language;
    t: (key: string, options?: any) => string;
}

const getEmotionColorClass = (emotion: string) => {
    switch (emotion.toLowerCase()) {
        case 'anxious':
        case 'pain':
            return 'text-red-500 dark:text-red-400';
        case 'playful':
            return 'text-yellow-500 dark:text-yellow-400';
        case 'calm':
            return 'text-teal-500 dark:text-teal-400';
        case 'hungry':
            return 'text-orange-500 dark:text-orange-400';
        default:
            return 'text-slate-600 dark:text-slate-300';
    }
};

export const MemoriesView: React.FC<MemoriesViewProps> = ({ reports, pets, onViewReport, theme, language, t }) => {
    const [selectedPetId, setSelectedPetId] = useState<string>('');

    const reportsForSelectedPet = useMemo(() => {
        if (!selectedPetId) return reports;
        return reports.filter(r => r.petId === selectedPetId);
    }, [reports, selectedPetId]);

    const chartData = useMemo(() => {
        return reportsForSelectedPet
            .slice()
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(r => ({
                date: new Date(r.timestamp).toLocaleDateString(language, { month: 'short', day: 'numeric'}),
                Calm: r.emotionScores.calm,
                Anxious: r.emotionScores.anxious,
            })).slice(-20); // show last 20 reports
    }, [reportsForSelectedPet, language]);
    
    const onThisDayReport = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        return reportsForSelectedPet.find(report => {
            const reportDate = new Date(report.timestamp);
            return reportDate.getMonth() === currentMonth &&
                   reportDate.getDate() === currentDay &&
                   reportDate.getFullYear() < today.getFullYear();
        });
    }, [reportsForSelectedPet]);

    if (reports.length === 0) {
        return (
            <div className="text-center animate-fade-in text-slate-500 dark:text-slate-400">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('no_memories_title')}</h2>
                <p>{t('no_memories_subtitle')}</p>
            </div>
        );
    }
    
    const tooltipStyle = theme === 'dark' 
        ? { backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#334155' }
        : { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#e2e8f0' };

    return (
        <div className="w-full animate-fade-in space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('emotion_trends_title')}</h2>
                <div className="relative">
                    <select
                        value={selectedPetId}
                        onChange={(e) => {
                            setSelectedPetId(e.target.value)
                        }}
                        className="appearance-none w-full sm:w-auto bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        aria-label={t('filter_by_pet')}
                    >
                        <option value="">{t('all_pets')}</option>
                        {pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900/50 rounded-xl p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, t(`emotion_${name.toLowerCase()}`, language)]} />
                        <Legend wrapperStyle={{fontSize: "14px"}} formatter={(value: string) => t(`emotion_${value.toLowerCase()}`, language)} />
                        <Line type="monotone" dataKey="Calm" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="Anxious" stroke="#f43f5e" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            {onThisDayReport && (
                <div className="bg-yellow-50 dark:bg-yellow-900/40 p-4 rounded-lg flex items-center gap-4 border-l-4 border-yellow-400">
                    <CalendarIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <div className='flex-grow'>
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-200">{t('on_this_day_title')}</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{t('on_this_day_desc', {petName: onThisDayReport.petName})} <span className={`font-semibold ${getEmotionColorClass(onThisDayReport.emotion)}`}>{t(`emotion_${onThisDayReport.emotion.toLowerCase()}`, language).toLowerCase()}</span>.</p>
                    </div>
                    <button onClick={() => onViewReport(onThisDayReport)} className="bg-yellow-400 text-yellow-900 text-xs font-bold py-1 px-3 rounded-full hover:bg-yellow-500 transition">{t('view_memory_button')}</button>
                </div>
            )}
            
            <div>
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">{t('memories_title')}</h2>
                 <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {reportsForSelectedPet.map(report => {
                        const pet = pets.find(p => p.id === report.petId);
                        const imageSrc = report.petSnapshot || pet?.photo;
                        return (
                           <button 
                                key={report.id}
                                onClick={() => onViewReport(report)}
                                className="w-full flex items-center gap-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-900/50 hover:bg-gray-200 dark:hover:bg-gray-700/70 transition-colors text-left"
                            >
                                {imageSrc ? (
                                    <img src={imageSrc} alt={report.petName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                    <UserCircleIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                                )}
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{report.petName}</p>
                                    <p className={`text-sm font-semibold ${getEmotionColorClass(report.emotion)}`}>{t(`emotion_${report.emotion.toLowerCase()}`)}</p>
                                </div>
                                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                                    <p>{new Date(report.timestamp).toLocaleDateString(language)}</p>
                                    <p>{new Date(report.timestamp).toLocaleTimeString(language)}</p>
                                </div>
                           </button>
                        );
                    })}
                 </div>
            </div>
        </div>
    );
};