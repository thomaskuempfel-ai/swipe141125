import React, { useMemo, useState } from 'react';
import { PetProfile, HistoricReport, PetPersonalityProfile, DailyTipsResponse, PredictiveTip, Language } from '../types';
import { 
    getLatestReport, 
    getEmotionTrend, 
    getAverageNeeds, 
    getSleepTrend, 
    getVocalizationTrend,
    getWellnessAlerts,
    getEngagementStreak,
    getTopNeeds,
    calculateWellnessScore
} from '../services/wellnessMetrics';
import { 
    LineChart, 
    Line, 
    RadarChart, 
    Radar, 
    PolarGrid, 
    PolarAngleAxis, 
    PolarRadiusAxis,
    BarChart,
    Bar,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import { 
    PawPrintIcon, 
    HeartIcon, 
    AlertTriangleIcon, 
    TrendingUpIcon,
    ActivityIcon,
    MoonIcon,
    MicIcon,
    ClipboardIcon,
    ShareIcon,
    SparklesIcon,
    CheckCircleIcon,
    BellIcon,
    CalendarIcon
} from './icons';

interface WellnessHubProps {
    pet: PetProfile | null;
    reports: HistoricReport[];
    latestReport: HistoricReport | null;
    personalityProfile: PetPersonalityProfile | null;
    isProfileLoading: boolean;
    profileError: string | null;
    dailyTip: string | DailyTipsResponse | null;
    isTipLoading: boolean;
    predictiveTip: PredictiveTip | null;
    isPredictiveTipLoading: boolean;
    individualScore: number;
    notificationPermission: NotificationPermission;
    onStartAnalysis: () => void;
    onViewDetails: (report: HistoricReport) => void;
    onRequestNotificationPermission: () => void;
    onExportPDF: () => void;
    t: (key: string, options?: any) => string;
    language: Language;
}

export const WellnessHub: React.FC<WellnessHubProps> = ({
    pet,
    reports,
    latestReport,
    personalityProfile,
    isProfileLoading,
    profileError,
    dailyTip,
    isTipLoading,
    predictiveTip,
    isPredictiveTipLoading,
    individualScore,
    notificationPermission,
    onStartAnalysis,
    onViewDetails,
    onRequestNotificationPermission,
    onExportPDF,
    t,
    language
}) => {
    const [completedTips, setCompletedTips] = useState<Set<string>>(new Set());

    const wellnessScore = useMemo(() => 
        calculateWellnessScore(reports, individualScore),
        [reports, individualScore]
    );

    const emotionTrend = useMemo(() => 
        getEmotionTrend(reports, 14),
        [reports]
    );

    const averageNeeds = useMemo(() => 
        getAverageNeeds(reports, 7),
        [reports]
    );

    const sleepTrend = useMemo(() => 
        getSleepTrend(reports, 14),
        [reports]
    );

    const vocalizationTrend = useMemo(() => 
        getVocalizationTrend(reports, 14),
        [reports]
    );

    const alerts = useMemo(() => 
        getWellnessAlerts(reports, pet, notificationPermission),
        [reports, pet, notificationPermission]
    );

    const engagementStreak = useMemo(() => 
        getEngagementStreak(reports),
        [reports]
    );

    const topNeeds = useMemo(() => 
        latestReport ? getTopNeeds(latestReport.currentNeeds, 2) : [],
        [latestReport]
    );

    const needsRadarData = useMemo(() => {
        if (!latestReport) return [];
        return [
            { need: 'Attention', value: latestReport.currentNeeds.attention, fullMark: 100 },
            { need: 'Play', value: latestReport.currentNeeds.play, fullMark: 100 },
            { need: 'Comfort', value: latestReport.currentNeeds.comfort, fullMark: 100 },
            { need: 'Food', value: latestReport.currentNeeds.food, fullMark: 100 },
            { need: 'Rest', value: latestReport.currentNeeds.rest, fullMark: 100 },
            { need: 'Health', value: latestReport.currentNeeds.health, fullMark: 100 },
            { need: 'Water', value: latestReport.currentNeeds.water, fullMark: 100 }
        ];
    }, [latestReport]);

    const emotionColors: Record<string, string> = {
        'Calm': '#10b981',
        'Playful': '#f59e0b',
        'Anxious': '#ef4444',
        'Hungry': '#8b5cf6',
        'Pain': '#dc2626',
        'Grumpy': '#64748b'
    };

    const handleToggleTip = (tipTitle: string) => {
        setCompletedTips(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tipTitle)) {
                newSet.delete(tipTitle);
            } else {
                newSet.add(tipTitle);
            }
            return newSet;
        });
    };

    if (!pet) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                    <PawPrintIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">Welcome to Wellness Hub</h2>
                    <p className="text-slate-400 mb-6">Add a pet profile to start tracking their wellness</p>
                </div>
            </div>
        );
    }

    if (!latestReport) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                    <SparklesIcon className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">Start {pet.name}'s Wellness Journey</h2>
                    <p className="text-slate-400 mb-6">Analyze your first photo or video to unlock wellness insights</p>
                    <button
                        onClick={onStartAnalysis}
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        <PawPrintIcon className="w-5 h-5" />
                        Start First Analysis
                    </button>
                </div>
            </div>
        );
    }

    const lastUpdateTime = new Date(latestReport.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

    return (
        <div className="w-full max-w-7xl mx-auto p-4 space-y-6 overflow-y-auto h-full">
            {/* Header Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        {pet.photo && (
                            <img 
                                src={pet.photo} 
                                alt={pet.name} 
                                className="w-16 h-16 rounded-full object-cover border-4 border-teal-500"
                            />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-slate-100">{pet.name}'s Wellness Hub</h1>
                            <p className="text-slate-400 text-sm">Last updated {lastUpdateTime}</p>
                        </div>
                    </div>
                    <button
                        onClick={onStartAnalysis}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <PawPrintIcon className="w-5 h-5" />
                        New Analysis
                    </button>
                </div>

                {/* Wellness Score & Streak */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HeartIcon className="w-5 h-5 text-red-400" />
                            <span className="text-slate-300 text-sm font-semibold">Wellness Score</span>
                        </div>
                        <div className="text-4xl font-bold text-slate-100">{wellnessScore}</div>
                        <div className="text-xs text-slate-400 mt-1">Out of 100</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="w-5 h-5 text-orange-400" />
                            <span className="text-slate-300 text-sm font-semibold">Engagement Streak</span>
                        </div>
                        <div className="text-4xl font-bold text-slate-100">{engagementStreak}</div>
                        <div className="text-xs text-slate-400 mt-1">{engagementStreak === 1 ? 'day' : 'days'} in a row</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ActivityIcon className="w-5 h-5 text-blue-400" />
                            <span className="text-slate-300 text-sm font-semibold">Total Analyses</span>
                        </div>
                        <div className="text-4xl font-bold text-slate-100">{reports.length}</div>
                        <div className="text-xs text-slate-400 mt-1">Lifetime insights</div>
                    </div>
                </div>
            </div>

            {/* Alerts & Triage */}
            {alerts.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangleIcon className="w-6 h-6 text-yellow-400" />
                        <h2 className="text-xl font-bold text-slate-100">Attention Needed</h2>
                    </div>
                    <div className="space-y-3">
                        {alerts.map((alert, idx) => (
                            <div 
                                key={idx}
                                className={`p-4 rounded-lg border-l-4 ${
                                    alert.severity === 'critical' ? 'bg-red-900/20 border-red-500' :
                                    alert.severity === 'high' ? 'bg-orange-900/20 border-orange-500' :
                                    alert.severity === 'medium' ? 'bg-yellow-900/20 border-yellow-500' :
                                    'bg-blue-900/20 border-blue-500'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-100 mb-1">{alert.title}</h3>
                                        <p className="text-sm text-slate-300">{alert.message}</p>
                                    </div>
                                    {alert.action && (
                                        <button
                                            onClick={() => {
                                                if (alert.type === 'health') onViewDetails(latestReport);
                                                else if (alert.type === 'permission') onRequestNotificationPermission();
                                                else onStartAnalysis();
                                            }}
                                            className="ml-4 text-sm font-semibold text-teal-400 hover:text-teal-300 whitespace-nowrap"
                                        >
                                            {alert.action} →
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Today at a Glance */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-slate-100 mb-4">Today at a Glance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Emotion */}
                    <div className="bg-slate-900/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300 text-sm font-semibold">Primary Emotion</span>
                            <span 
                                className="px-3 py-1 rounded-full text-sm font-bold"
                                style={{ 
                                    backgroundColor: `${emotionColors[latestReport.emotion]}20`,
                                    color: emotionColors[latestReport.emotion]
                                }}
                            >
                                {latestReport.emotion}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm">{latestReport.translation}</p>
                    </div>

                    {/* Top Needs */}
                    <div className="bg-slate-900/50 rounded-xl p-4">
                        <span className="text-slate-300 text-sm font-semibold block mb-2">Current Needs</span>
                        <div className="space-y-2">
                            {topNeeds.map((need, idx) => (
                                <div key={idx}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-slate-300 capitalize">{need.need}</span>
                                        <span className="text-slate-400">{need.score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div 
                                            className="bg-teal-500 h-2 rounded-full transition-all"
                                            style={{ width: `${need.score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Daily Tip */}
                    {dailyTip && (
                        <div className="bg-slate-900/50 rounded-xl p-4">
                            <span className="text-slate-300 text-sm font-semibold block mb-2">Daily Tip</span>
                            <p className="text-slate-400 text-sm">
                                {typeof dailyTip === 'string' ? dailyTip : dailyTip[pet.petType]}
                            </p>
                        </div>
                    )}

                    {/* Predictive Tip */}
                    {predictiveTip && (
                        <div className="bg-slate-900/50 rounded-xl p-4">
                            <span className="text-slate-300 text-sm font-semibold block mb-2">Predictive Insight</span>
                            <p className="text-slate-400 text-sm font-semibold mb-1">{predictiveTip.prediction}</p>
                            <p className="text-slate-500 text-xs">{predictiveTip.tip}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Trends & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Emotion Trend */}
                {emotionTrend.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUpIcon className="w-5 h-5 text-teal-400" />
                            <h3 className="text-lg font-bold text-slate-100">Emotion Trend (14 Days)</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={emotionTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="confidence" 
                                    stroke="#14b8a6" 
                                    strokeWidth={2}
                                    dot={{ fill: '#14b8a6', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Needs Radar */}
                {needsRadarData.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <ActivityIcon className="w-5 h-5 text-purple-400" />
                            <h3 className="text-lg font-bold text-slate-100">Current Needs Profile</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <RadarChart data={needsRadarData}>
                                <PolarGrid stroke="#475569" />
                                <PolarAngleAxis dataKey="need" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" />
                                <Radar 
                                    name="Needs" 
                                    dataKey="value" 
                                    stroke="#a855f7" 
                                    fill="#a855f7" 
                                    fillOpacity={0.6} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Sleep Trend */}
                {sleepTrend.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <MoonIcon className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-lg font-bold text-slate-100">Sleep Quality Trend</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={sleepTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="quality" 
                                    stroke="#6366f1" 
                                    strokeWidth={2}
                                    name="Quality"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Vocalization Trend */}
                {vocalizationTrend.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <MicIcon className="w-5 h-5 text-pink-400" />
                            <h3 className="text-lg font-bold text-slate-100">Vocalization Intensity</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={vocalizationTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                />
                                <Bar dataKey="intensity" fill="#ec4899" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Care Plan */}
            {latestReport.careTips && latestReport.careTips.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-100">Today's Care Plan</h2>
                        <span className="text-sm text-slate-400">
                            {completedTips.size} of {latestReport.careTips.length} completed
                        </span>
                    </div>
                    <div className="space-y-3">
                        {latestReport.careTips.map((tip, idx) => (
                            <div 
                                key={idx}
                                className={`p-4 rounded-lg border transition-all ${
                                    completedTips.has(tip.title)
                                        ? 'bg-teal-900/20 border-teal-500'
                                        : 'bg-slate-900/50 border-slate-700'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={() => handleToggleTip(tip.title)}
                                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            completedTips.has(tip.title)
                                                ? 'bg-teal-500 border-teal-500'
                                                : 'border-slate-500 hover:border-teal-500'
                                        }`}
                                    >
                                        {completedTips.has(tip.title) && (
                                            <CheckCircleIcon className="w-4 h-4 text-white" />
                                        )}
                                    </button>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`font-bold ${completedTips.has(tip.title) ? 'text-teal-300 line-through' : 'text-slate-100'}`}>
                                                {tip.title}
                                            </h3>
                                            <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                                                {tip.effort} effort
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400">{tip.description}</p>
                                        <span className="text-xs text-slate-500 mt-1 inline-block">{tip.category}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions Row */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-slate-100 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => onViewDetails(latestReport)}
                        className="flex flex-col items-center justify-center p-4 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <ClipboardIcon className="w-8 h-8 text-blue-400 mb-2" />
                        <span className="text-sm font-semibold text-slate-300 text-center">View Full Report</span>
                    </button>

                    <button
                        onClick={onExportPDF}
                        className="flex flex-col items-center justify-center p-4 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <ShareIcon className="w-8 h-8 text-green-400 mb-2" />
                        <span className="text-sm font-semibold text-slate-300 text-center">Export PDF</span>
                    </button>

                    <button
                        onClick={onStartAnalysis}
                        className="flex flex-col items-center justify-center p-4 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <PawPrintIcon className="w-8 h-8 text-teal-400 mb-2" />
                        <span className="text-sm font-semibold text-slate-300 text-center">New Analysis</span>
                    </button>

                    {notificationPermission !== 'granted' && (
                        <button
                            onClick={onRequestNotificationPermission}
                            className="flex flex-col items-center justify-center p-4 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            <BellIcon className="w-8 h-8 text-yellow-400 mb-2" />
                            <span className="text-sm font-semibold text-slate-300 text-center">Enable Alerts</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Recent Timeline */}
            {reports.length > 1 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                    <h2 className="text-xl font-bold text-slate-100 mb-4">Recent History</h2>
                    <div className="space-y-3">
                        {reports.slice(0, 5).map((report, idx) => (
                            <div 
                                key={report.id}
                                className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                                onClick={() => onViewDetails(report)}
                            >
                                {report.petSnapshot && (
                                    <img 
                                        src={report.petSnapshot} 
                                        alt="Report snapshot" 
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span 
                                            className="px-2 py-1 rounded-full text-xs font-bold"
                                            style={{ 
                                                backgroundColor: `${emotionColors[report.emotion]}20`,
                                                color: emotionColors[report.emotion]
                                            }}
                                        >
                                            {report.emotion}
                                        </span>
                                        {report.sleepAnalysis && (
                                            <span className="text-xs text-slate-500">Sleep analysis</span>
                                        )}
                                        {report.audioAnalysis && (
                                            <span className="text-xs text-slate-500">Vocalization</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {new Date(report.timestamp).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
