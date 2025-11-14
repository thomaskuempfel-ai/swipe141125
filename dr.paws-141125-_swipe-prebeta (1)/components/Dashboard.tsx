

import React from 'react';
import { PetProfile, HistoricReport, PetPersonalityProfile, DailyTipsResponse, Language, AppView, PredictiveTip } from '../types';
import { DailyTip } from './DailyTip';
import { PersonalityProfileDisplay } from './PersonalityProfileDisplay';
import { PlusIcon, PawPrintIcon, AnalyticsIcon, ShoppingBagIcon, HealthIcon, DrPawsChatIcon } from './icons';
import { MemoryCarousel } from './MemoryCarousel';
import { ScoreDisplay } from './ScoreDisplay';
import { DashboardEmotionCard } from './DashboardEmotionCard';
import { DashboardCareTipsCard } from './DashboardCareTipsCard';
import { DashboardSleepCard } from './DashboardSleepCard';
import { DashboardAudioCard } from './DashboardAudioCard';
import { DashboardBreathingCard } from './DashboardBreathingCard';
import { DashboardHealthAlertCard } from './DashboardHealthAlertCard';
import { DashboardVoiceChatCard } from './DashboardVoiceChatCard';

interface DashboardProps {
    pet: PetProfile | null;
    pets: PetProfile[];
    reports: HistoricReport[];
    latestReport: HistoricReport | null;
    isLatestReportLoading?: boolean;
    highlightedReportId?: string | null;
    personalityProfile: PetPersonalityProfile | null;
    isProfileLoading: boolean;
    profileError: string | null;
    dailyTip: string | DailyTipsResponse | null;
    isTipLoading: boolean;
    predictiveTip: PredictiveTip | null;
    isPredictiveTipLoading: boolean;
    individualScore: number;
    historicReportToShow: HistoricReport | null;
    onExitHistoricView: () => void;
    onViewReport: (report: HistoricReport) => void;
    onViewDetails: (report: HistoricReport) => void;
    onAddPet: () => void;
    onStartAnalysis: () => void;
    onStartVoiceChat: (report: HistoricReport) => void;
    onShowEmotionReel: (report: HistoricReport) => void;
    onShowAttitudeReel: (report: HistoricReport) => void;
    t: (key: string, options?: any) => string;
    language: Language;
    setActiveView: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    pet,
    reports,
    latestReport,
    personalityProfile,
    isProfileLoading,
    profileError,
    dailyTip,
    isTipLoading,
    individualScore,
    historicReportToShow,
    onExitHistoricView,
    onViewReport,
    onViewDetails,
    onAddPet,
    onStartAnalysis,
    onStartVoiceChat,
    setActiveView,
    t,
    language
}) => {
    const reportToDisplay = historicReportToShow || latestReport;

    if (!pet) {
        return (
            <div className="text-center p-8">
                <PawPrintIcon className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('dashboard_welcome_title')}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">{t('dashboard_welcome_subtitle')}</p>
                <button
                    onClick={onAddPet}
                    className="inline-flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-6 rounded-lg"
                >
                    <PlusIcon className="w-5 h-5" />
                    {t('dashboard_add_first_pet')}
                </button>
            </div>
        );
    }

    if (!reportToDisplay) {
         return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('no_reports_yet_title')}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">{t('no_reports_yet_subtitle', { petName: pet.name })}</p>
                <button
                    onClick={onStartAnalysis}
                    className="inline-flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-6 rounded-lg"
                >
                    <PawPrintIcon className="w-5 h-5" />
                    {t('start_first_analysis_button')}
                </button>
            </div>
        );
    }

    const sortedReports = [...reports].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                 <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('dashboard_title', { petName: pet.name })}</h1>
            </div>

            {historicReportToShow && (
                <div className="bg-yellow-100 dark:bg-yellow-900/40 p-4 rounded-lg flex items-center justify-between animate-fade-in">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">{t('dashboard_viewing_memory_from', { date: new Date(historicReportToShow.timestamp).toLocaleDateString() })}</p>
                    <button onClick={onExitHistoricView} className="text-sm font-bold text-yellow-800 dark:text-yellow-200 hover:underline">{t('dashboard_back_to_today')}</button>
                </div>
            )}

            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h2 className="text-lg font-bold text-slate-100 mb-4">{t('quick_look_title')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button
                        onClick={() => setActiveView('memories')}
                        className="flex flex-col items-center justify-center text-center p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <AnalyticsIcon className="w-8 h-8 text-teal-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-300">{t('quick_look_mood_attitude_stats')}</span>
                    </button>

                    <button
                        onClick={() => setActiveView('marketplace')}
                        className="flex flex-col items-center justify-center text-center p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <ShoppingBagIcon className="w-8 h-8 text-purple-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-300">{t('quick_look_pet_shopping')}</span>
                    </button>

                    <button
                        onClick={() => onViewDetails(reportToDisplay)}
                        className="flex flex-col items-center justify-center text-center p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <HealthIcon className="w-8 h-8 text-red-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-300">{t('dashboard_prepare_vet_report')}</span>
                    </button>

                    <button
                        onClick={() => onStartVoiceChat(reportToDisplay)}
                        className="flex flex-col items-center justify-center text-center p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <DrPawsChatIcon className="w-8 h-8 text-blue-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-300">{t('dashboard_talk_to_dr_paws_button')}</span>
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <ScoreDisplay score={individualScore} t={t} title={t('pet_guardian_score', { petName: pet.name })} />
                    <DashboardEmotionCard report={reportToDisplay} t={t} language={language} />
                    {reportToDisplay.sicknessIndicators && <DashboardHealthAlertCard report={reportToDisplay} onViewDetails={() => onViewDetails(reportToDisplay)} t={t} />}
                    {reportToDisplay.careTips && reportToDisplay.careTips.length > 0 && <DashboardCareTipsCard report={reportToDisplay} t={t} />}
                    {reportToDisplay.sleepAnalysis && <DashboardSleepCard report={reportToDisplay} t={t} />}
                    {reportToDisplay.audioAnalysis && <DashboardAudioCard report={reportToDisplay} t={t} />}
                    {reportToDisplay.breathingAnalysis && <DashboardBreathingCard report={reportToDisplay} t={t} />}
                </div>

                 <div className="space-y-6">
                    {(isProfileLoading || profileError || personalityProfile) && (
                        <PersonalityProfileDisplay
                            pet={pet}
                            profile={personalityProfile}
                            isLoading={isProfileLoading}
                            error={profileError}
                            t={t}
                        />
                    )}

                    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                        <h2 className="text-lg font-bold text-slate-100 mb-4">{t('daily_tip_title')}</h2>
                        <DailyTip tip={dailyTip} isLoading={isTipLoading} t={t} />
                    </div>
                    
                    <DashboardVoiceChatCard onStartChat={() => onStartVoiceChat(reportToDisplay)} t={t} />

                 </div>
            </div>

            <MemoryCarousel
                reports={sortedReports}
                onViewReport={onViewReport}
                setActiveView={setActiveView}
                t={t}
            />
        </div>
    );
};