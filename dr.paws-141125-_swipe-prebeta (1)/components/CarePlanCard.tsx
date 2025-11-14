

import React, { useMemo, useState } from 'react';
import { HistoricReport, PetProfile, PetNeed, AppView } from '../types';
import { NeedRecommendationModal } from './NeedRecommendationModal';
import { t } from '../localization/translations';
import { HandIcon, PlayIcon, HeartIcon, FoodIcon, BedIcon, HealthIcon, WaterIcon, PawPrintIcon, HeartbeatIcon, AnalyticsIcon } from './icons';
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Bar,
    Cell
} from 'recharts';

interface CarePlanCardProps {
    report: HistoricReport;
    pet: PetProfile;
    setView: (view: AppView) => void;
    onViewDetails: (report: HistoricReport) => void;
}

const NeedMeter: React.FC<{ Icon: React.ElementType, label: string, value: number, color: string }> = ({ Icon, label, value, color }) => {
    return (
        <div className="bg-slate-900/50 p-3 rounded-xl text-center flex flex-col items-center justify-center h-full">
            <Icon className={`w-6 h-6 mb-1 ${color}`} />
            <p className="text-xs font-semibold text-slate-300 mb-2">{label}</p>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-auto">
                <div className={`bg-gradient-to-r from-teal-500 to-green-400 h-2 rounded-full`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
};

const NeedsGrid: React.FC<{ needs: HistoricReport['currentNeeds'], t: (key: string) => string, onNeedClick: (need: PetNeed) => void }> = ({ needs, t, onNeedClick }) => {
    const needsMap = [
        { key: 'attention', Icon: HandIcon, color: 'text-yellow-400' },
        { key: 'play', Icon: PlayIcon, color: 'text-lime-400' },
        { key: 'comfort', Icon: HeartIcon, color: 'text-pink-400' },
        { key: 'food', Icon: FoodIcon, color: 'text-orange-400' },
        { key: 'rest', Icon: BedIcon, color: 'text-blue-400' },
        { key: 'health', Icon: HealthIcon, color: 'text-red-400' },
        { key: 'water', Icon: WaterIcon, color: 'text-cyan-400' },
    ];

    const sortedNeeds = Object.entries(needs)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .filter(([, score]) => (score as number) > 10)
        .slice(0, 4);

    if (sortedNeeds.length === 0) return null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sortedNeeds.map(([key, value]) => {
                const needInfo = needsMap.find(n => n.key === key);
                if (!needInfo) return null;
                return (
                    <button 
                        key={key} 
                        onClick={() => onNeedClick(key as PetNeed)}
                        className="transition-transform transform hover:scale-105"
                    >
                        <NeedMeter Icon={needInfo.Icon} label={t(`need_${key.toLowerCase()}`)} value={value as number} color={needInfo.color} />
                    </button>
                );
            })}
        </div>
    );
};

const Section: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 backdrop-blur-sm">
    <h3 className="text-lg font-bold text-[var(--accent-color-light)] mb-3 flex items-center gap-2">
      <Icon className="w-5 h-5" />
      {title}
    </h3>
    {children}
  </div>
);

export const CarePlanCard: React.FC<CarePlanCardProps> = ({ report, pet, setView, onViewDetails }) => {
    const [selectedNeed, setSelectedNeed] = useState<PetNeed | null>(null);
    const localT = (key: string, options?: any) => t(key, 'en', options);
    
    const wellnessData = useMemo(() => {
        if (!report) return [];

        const physicalHealth = Math.round(Math.max(0, 100 - ((report.currentNeeds.health + report.emotionScores.pain) / 2)));
        const mentalHealth = Math.round((report.emotionScores.calm + report.emotionScores.playful) / 2);
        const stressLevel = Math.round((report.emotionScores.anxious + report.emotionScores.grumpy) / 2);

        return [
            { name: 'Physical', value: physicalHealth, color: '#3b82f6' }, // blue-500
            { name: 'Mental', value: mentalHealth, color: '#22c55e' }, // green-500
            { name: 'Stress', value: stressLevel, color: '#ef4444' }, // red-500
        ];
    }, [report]);
    
    const keywordActions: Record<string, () => void> = {
        'health': () => report.sicknessIndicators && onViewDetails(report),
        'trends': () => setView('wellness_hub'),
        'wellness hub': () => setView('wellness_hub'),
        'toys': () => setView('marketplace'),
        'food': () => setView('marketplace'),
        'vitamins': () => setView('marketplace'),
        'treats': () => setView('marketplace'),
        'puzzle feeder': () => setView('marketplace')
    };
    const keywordsRegex = new RegExp(`\\b(${Object.keys(keywordActions).join('|')})\\b`, 'gi');

    const renderLinkedText = (text: string) => {
        if (!text) return null;
        const parts = text.split(keywordsRegex);
        return parts.map((part, index) => {
            const keyword = part.toLowerCase();
            if (keywordActions[keyword]) {
                return (
                    <strong key={index}>
                        <button onClick={keywordActions[keyword]} className="text-[var(--accent-text)] underline decoration-dotted hover:text-[var(--accent-color-light)]">
                            {part}
                        </button>
                    </strong>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="swipe-card justify-start pt-12">
             {selectedNeed && pet && (
                <NeedRecommendationModal 
                    pet={pet}
                    need={selectedNeed}
                    onClose={() => setSelectedNeed(null)}
                    t={localT}
                />
            )}
            <div className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-6 h-full overflow-y-auto hide-scrollbar pb-24">
                <div className="text-center px-4">
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{localT('dashboard_care_plan', { petName: report.petName })}</h2>
                </div>

                {report.careTips && report.careTips.length > 0 && (
                    <Section icon={PawPrintIcon} title={localT('personalized_plan_title')}>
                         <ol className="space-y-4">
                            {report.careTips.map((tip, index) => (
                                <li key={index} className="flex gap-3 items-start">
                                    <span className="font-bold text-lg text-[var(--accent-text)] pt-0.5">{index + 1}.</span>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-[var(--text-primary)]">{renderLinkedText(tip.title)}</h4>
                                        <p className="text-sm text-[var(--text-secondary)]">{renderLinkedText(tip.description)}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Section>
                )}

                <Section icon={AnalyticsIcon} title="Wellness Balance">
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <BarChart layout="vertical" data={wellnessData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid stroke="#475569" strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide domain={[0, 100]} />
                                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 14 }} width={80} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                        borderColor: '#475569',
                                        borderRadius: '0.5rem',
                                    }}
                                    labelStyle={{ color: '#f1f5f9' }}
                                    formatter={(value: number) => [`${value}%`, 'Level']}
                                    cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {wellnessData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Section>

                {report.currentNeeds && Object.values(report.currentNeeds).some(v => (v as number) > 10) && (
                    <Section icon={HeartbeatIcon} title={`${report.petName}'s Needs`}>
                        <NeedsGrid needs={report.currentNeeds} t={localT} onNeedClick={setSelectedNeed} />
                    </Section>
                )}
                
                 <div className="h-8 flex-shrink-0"></div>
            </div>
        </div>
    );
};