
import React, { useState, useEffect, useMemo } from 'react';
import { PetProfile, HistoricReport } from '../types';
import { getBehavioralExplanation } from '../services/geminiService';
import { t } from '../localization/translations';
import { BrainIcon, LightbulbIcon, AnalyticsIcon, SparklesIcon, SpinnerIcon } from './icons';

interface PersonalityCardProps {
    pet: PetProfile;
    reports: HistoricReport[];
    onViewDetails: () => void;
    onViewHub: () => void;
}

const countOccurrences = (arr: (string | undefined)[]) => {
    return arr.reduce((acc, curr) => {
        if (curr) {
            acc[curr] = (acc[curr] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
};

const getTopItem = (counts: Record<string, number>) => {
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
};


const InsightSection: React.FC<{ Icon: React.ElementType, title: string, children: React.ReactNode }> = ({ Icon, title, children }) => (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <h3 className="text-lg font-bold text-teal-400 mb-2 flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
        </h3>
        <div className="text-sm text-slate-300 space-y-2">
            {children}
        </div>
    </div>
);

export const PersonalityCard: React.FC<PersonalityCardProps> = ({ pet, reports, onViewDetails, onViewHub }) => {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isExplanationLoading, setIsExplanationLoading] = useState(true);
    const [shuffledFeatures, setShuffledFeatures] = useState<any[]>([]);
    
    const localT = (key: string, options?: any) => t(key, 'en', options);

    const latestReport = useMemo(() => {
        if (reports.length === 0) return null;
        return [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    }, [reports]);

    const allFeatures = useMemo(() => [
        { 
            text: 'create a detailed <health_report> to share with your vet, including a timeline of observations.',
            link: 'health_report',
            action: onViewDetails,
            isAvailable: !!latestReport?.sicknessIndicators
        },
        {
            text: 'perform a deep <sleep_analysis> and even interpret what your pet might be dreaming about.',
            link: 'sleep_analysis',
            action: onViewDetails,
            isAvailable: !!latestReport?.sleepAnalysis
        },
        {
            text: 'analyze your pet\'s breathing patterns for signs of stress or relaxation with <breath_analysis>.',
            link: 'breath_analysis',
            action: onViewDetails,
            isAvailable: !!latestReport?.breathingAnalysis
        },
        {
            text: 'decode every bark, meow, or chirp with detailed <sound_analysis>.',
            link: 'sound_analysis',
            action: onViewDetails,
            isAvailable: !!latestReport?.audioAnalysis
        },
        {
            text: 'track emotional <trends> and view all your memories in the Wellness Hub.',
            link: 'trends',
            action: onViewHub,
            isAvailable: true
        },
        {
            text: 'detect subtle signs of pain, hunger, or thirst before they become bigger problems.',
            isAvailable: true
        },
        {
            text: 'set automated alarms for feeding or medication times. (Coming soon!)',
            isAvailable: true
        },
        {
            text: 'view your memories on a <calendar> in the Wellness Hub to spot seasonal patterns.',
            link: 'calendar',
            action: onViewHub,
            isAvailable: true
        }
    ], [latestReport, onViewDetails, onViewHub]);

    useEffect(() => {
        const availableFeatures = allFeatures.filter(f => f.isAvailable);
        const shuffled = [...availableFeatures].sort(() => 0.5 - Math.random());
        setShuffledFeatures(shuffled.slice(0, 3));
    }, [pet.id, reports, allFeatures]);

    useEffect(() => {
        if (!latestReport) return;

        const fetchExplanation = async () => {
            setIsExplanationLoading(true);
            try {
                const result = await getBehavioralExplanation(latestReport.emotion, latestReport.attitude, pet, 'en');
                setExplanation(result);
            } catch (e) {
                console.error("Failed to get behavioral explanation", e);
                setExplanation("Could not load explanation at this time.");
            } finally {
                setIsExplanationLoading(false);
            }
        };

        fetchExplanation();
    }, [latestReport, pet]);
    
    const trendData = useMemo(() => {
        const recentReports = reports.slice(0, 10);
        if (recentReports.length < 2) return null;

        const emotions = recentReports.map(r => r.emotion);
        const attitudes = recentReports.map(r => r.attitude).filter(Boolean);

        const emotionCounts = countOccurrences(emotions);
        const attitudeCounts = countOccurrences(attitudes);

        const topEmotion = getTopItem(emotionCounts);
        const topAttitude = getTopItem(attitudeCounts);

        const emotionRecKey = `mood_rec_${topEmotion.toLowerCase()}`;
        const attitudeRecKey = topAttitude ? `attitude_rec_${topAttitude.toLowerCase()}` : 'mood_rec_default';

        const recommendation = localT(emotionRecKey) || localT(attitudeRecKey) || localT('mood_rec_default');

        return {
            topEmotion,
            topAttitude,
            recommendation
        };
    }, [reports, localT]);

    if (!latestReport) {
        return <div className="swipe-card"><p>Not enough data for insights.</p></div>;
    }
    
    const trendSummaryAttitude = trendData?.topAttitude 
        ? localT('insights_trends_summary_attitude', { attitude: trendData.topAttitude }) 
        : '';

    return (
        <div className="swipe-card justify-start pt-12">
            <div className="w-full max-w-md mx-auto flex flex-col gap-6">
                <div className="text-center px-4">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                        <BrainIcon className="w-8 h-8"/>
                        {localT('insights_title')}
                    </h2>
                    <p className="text-slate-400">{localT('insights_subtitle', { petName: pet.name })}</p>
                </div>

                <InsightSection Icon={SparklesIcon} title={localT('insights_how_we_know')}>
                    <p className="italic">"{latestReport.detailedAnalysis}"</p>
                </InsightSection>

                <InsightSection Icon={LightbulbIcon} title={localT('insights_what_it_means')}>
                    {isExplanationLoading ? (
                        <div className="flex items-center gap-2 text-slate-400">
                            <SpinnerIcon className="w-4 h-4"/>
                            <span>{localT('insights_loading_explanation')}</span>
                        </div>
                    ) : (
                        <p>{explanation}</p>
                    )}
                </InsightSection>

                {trendData && (
                    <>
                        <InsightSection Icon={AnalyticsIcon} title={localT('insights_trends')}>
                             <p dangerouslySetInnerHTML={{ __html: localT('insights_trends_summary', { petName: pet.name, emotion: trendData.topEmotion, attitude: trendSummaryAttitude }) }} />
                        </InsightSection>
                        <InsightSection Icon={LightbulbIcon} title={localT('insights_recommendation')}>
                            <p>{trendData.recommendation}</p>
                        </InsightSection>
                    </>
                )}

                {shuffledFeatures.length > 0 && (
                    <InsightSection Icon={SparklesIcon} title={localT('did_you_know_title')}>
                        <ul className="space-y-3 list-disc list-inside">
                            {shuffledFeatures.map((feature, index) => {
                                if (feature.link) {
                                    const parts = feature.text.split(`<${feature.link}>`);
                                    return (
                                        <li key={index}>
                                            {parts[0]}
                                            <button onClick={feature.action} className="text-teal-400 font-bold underline hover:text-teal-300">
                                                {feature.link.replace(/_/g, ' ')}
                                            </button>
                                            {parts[1]}
                                        </li>
                                    );
                                }
                                return <li key={index}>{feature.text}</li>;
                            })}
                        </ul>
                    </InsightSection>
                )}

                 <div className="h-8 flex-shrink-0"></div>
            </div>
        </div>
    );
};
