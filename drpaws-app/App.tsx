

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PetProfile, HistoricReport, PetPersonalityProfile, DailyTipsResponse, PredictiveTip, AppView } from './types';
import { getAnalysisReport, getPersonalityProfile, getPredictiveTip, getDailyTip } from './services/geminiService';
import * as notificationService from './services/notificationService';
import PetProfileForm from './components/PetProfileForm';
import { MemoriesView } from './components/MemoriesView';
import { AnalysisFlowModal } from './components/AnalysisFlowModal';
import { PawPrintIcon, SpinnerIcon, PaletteIcon, BellIcon, XIcon, PlusIcon, DogIcon, CatIcon, BirdIcon, OtherIcon } from './components/icons';
import { VibeCard } from './components/VibeCard';
import { EditorCard } from './components/EditorCard';
import { CarePlanCard } from './components/CarePlanCard';
import { PersonalityCard } from './components/PersonalityCard';
import { UploadCard } from './components/UploadCard';
import { t } from './localization/translations';
import { Dashboard } from './components/Dashboard';
import { WellnessHub } from './components/WellnessHub';
import { ReportDetailsModal } from './components/ReportDetailsModal';
import { VoiceChatModal } from './components/VoiceChatModal';
import { MemoryLaneModal } from './components/MemoryLaneModal';

type DailyUploadData = { date: string; count: number };
type Theme = 'male' | 'female';
type AppState = 'splash' | 'pet_selection' | 'main';

const SplashScreen: React.FC = () => {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center splash-bg text-white">
            <style>{`
                @keyframes paw-pulse {
                    0% { transform: scale(0.9); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.9); opacity: 0.8; }
                }
                .animate-paw-pulse {
                    animation: paw-pulse 2s ease-in-out infinite;
                }
            `}</style>
            <PawPrintIcon className="w-32 h-32 animate-paw-pulse text-pink-200" />
            <h1 className="text-4xl font-bold font-kalam mt-4 animate-text-glow">Dr. Paws</h1>
            <p className="text-lg text-pink-100 mt-2">{t('app_tagline', 'en')}</p>
        </div>
    );
};

const petTypeIcons: { [key: string]: React.ElementType } = { dog: DogIcon, cat: CatIcon, bird: BirdIcon, other: OtherIcon };

const PetSelectionScreen: React.FC<{
    pets: PetProfile[];
    onSelectPet: (id: string) => void;
    onAddPet: () => void;
    t: (key: string) => string;
}> = ({ pets, onSelectPet, onAddPet, t }) => {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center p-8 bg-[var(--bg-gradient)]">
            <h1 className="text-4xl font-bold text-white mb-2 font-kalam">Welcome Back!</h1>
            <h2 className="text-xl text-[var(--accent-text)] mb-12">Who are we checking on today?</h2>

            <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {pets.map(pet => {
                    const Icon = petTypeIcons[pet.petType] || OtherIcon;
                    return (
                        <button
                            key={pet.id}
                            onClick={() => onSelectPet(pet.id)}
                            className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-color)] transition-all duration-300 transform hover:scale-105 hover:border-[var(--accent-color)]"
                        >
                            <div className="w-24 h-24 mb-3 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 border-4 border-transparent group-hover:border-[var(--accent-color-light)] transition-colors">
                                {pet.photo ? (
                                    <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Icon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                                )}
                            </div>
                            <span className="font-semibold text-lg text-[var(--text-primary)]">{pet.name}</span>
                        </button>
                    );
                })}
                <button
                    onClick={onAddPet}
                    className="group flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-600 bg-transparent hover:border-[var(--accent-color)] hover:text-[var(--accent-text)] transition-colors"
                >
                    <PlusIcon className="w-12 h-12 text-slate-500 group-hover:text-[var(--accent-text)] transition-colors" />
                    <span className="mt-2 font-semibold text-lg text-center text-slate-400 group-hover:text-[var(--accent-text)] transition-colors">{t('add_a_pet_profile')}</span>
                </button>
            </div>
        </div>
    );
};


const NotificationPermissionBanner: React.FC<{
    onAllow: () => void;
    onDismiss: () => void;
    t: (key: string) => string;
}> = ({ onAllow, onDismiss, t }) => {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-slate-800 text-white p-4 rounded-lg shadow-lg flex items-start gap-4 animate-fade-in z-50 border border-slate-700">
            <div className="bg-teal-500/20 p-2 rounded-full mt-1">
                <BellIcon className="w-6 h-6 text-teal-400" />
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-slate-100">{t('notifications_prompt_title')}</h3>
                <p className="text-sm text-slate-300">{t('notifications_prompt_desc')}</p>
                <div className="mt-4 flex gap-4">
                    <button onClick={onAllow} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1.5 px-4 rounded-md text-sm">
                        {t('notifications_prompt_allow')}
                    </button>
                    <button onClick={onDismiss} className="text-slate-400 hover:text-white font-semibold py-1.5 px-4 rounded-md text-sm">
                        {t('cancel_button')}
                    </button>
                </div>
            </div>
             <button onClick={onDismiss} className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-700">
                <XIcon className="w-5 h-5 text-slate-400" />
            </button>
        </div>
    );
};

const App: React.FC = () => {
    const [pets, setPets] = useState<PetProfile[]>([]);
    const [historicReports, setHistoricReports] = useState<HistoricReport[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
    const [isPetProfileModalOpen, setIsPetProfileModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    
    const [currentCard, setCurrentCard] = useState(0);
    const [view, setView] = useState<AppView>('swipe');
    
    const [guardianScores, setGuardianScores] = useState<Record<string, number>>({});
    const [dailyUploadData, setDailyUploadData] = useState<DailyUploadData | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [appState, setAppState] = useState<AppState>('splash');

    // State for Dashboard
    const [personalityProfile, setPersonalityProfile] = useState<PetPersonalityProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [dailyTip, setDailyTip] = useState<string | DailyTipsResponse | null>(null);
    const [isTipLoading, setIsTipLoading] = useState(false);
    const [predictiveTip, setPredictiveTip] = useState<PredictiveTip | null>(null);
    const [isPredictiveTipLoading, setIsPredictiveTipLoading] = useState(false);
    const [historicReportToShow, setHistoricReportToShow] = useState<HistoricReport | null>(null);

    // State for Dashboard Modals
    const [reportForDetails, setReportForDetails] = useState<HistoricReport | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [reportForVoiceChat, setReportForVoiceChat] = useState<HistoricReport | null>(null);
    const [isVoiceChatModalOpen, setIsVoiceChatModalOpen] = useState(false);
    const [reelReports, setReelReports] = useState<{reports: HistoricReport[], title: string} | null>(null);
    const [isMemoryLaneModalOpen, setIsMemoryLaneModalOpen] = useState(false);
    const [translationCache, setTranslationCache] = useState<Record<string, HistoricReport>>({});
    const [sharedImageUrl, setSharedImageUrl] = useState<string | null>(null);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('petTranslatorTheme') as Theme) || 'male');

    // Notification State
    const [notificationPermission, setNotificationPermission] = useState(notificationService.isSupported() ? Notification.permission : 'denied');
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

    const selectedPet = useMemo(() => pets.find(p => p.id === selectedPetId) || null, [pets, selectedPetId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAppState(pets.length > 0 ? 'pet_selection' : 'main');
        }, 5000); // 5 seconds
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const themeFromStorage = localStorage.getItem('petTranslatorTheme');
        const userHasToggled = localStorage.getItem('userThemeToggle') === 'true';

        if (!userHasToggled && selectedPet) {
            const newTheme = selectedPet.gender === 'female' ? 'female' : 'male';
            setTheme(newTheme);
        } else if (themeFromStorage) {
            setTheme(themeFromStorage as Theme);
        }
    }, [selectedPetId, pets]);
    
    useEffect(() => {
        document.documentElement.classList.add('dark');
        document.body.classList.remove('theme-male', 'theme-female');
        document.body.classList.add(`theme-${theme}`);
        localStorage.setItem('petTranslatorTheme', theme);
    }, [theme]);

    const handleThemeToggle = () => {
        const newTheme = theme === 'male' ? 'female' : 'male';
        setTheme(newTheme);
        localStorage.setItem('userThemeToggle', 'true');
    };

    useEffect(() => {
        try {
            const savedPets = localStorage.getItem('petProfiles');
            if (savedPets) {
                const parsedPets = JSON.parse(savedPets);
                setPets(parsedPets);
                // We no longer automatically select a pet on startup
            }
            const savedReports = localStorage.getItem('historicReports');
            if (savedReports) setHistoricReports(JSON.parse(savedReports));
            const savedScores = localStorage.getItem('guardianScores');
            if (savedScores) setGuardianScores(JSON.parse(savedScores));
            const savedDailyData = localStorage.getItem('dailyUploadData');
            if (savedDailyData) setDailyUploadData(JSON.parse(savedDailyData));
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
        } finally {
            setIsInitialLoading(false);
        }

        if (notificationService.isSupported() && Notification.permission === 'default') {
            const prompted = localStorage.getItem('notificationPrompted');
            if (!prompted) {
                setTimeout(() => setShowNotificationPrompt(true), 8000); // Delay prompt until after splash
            }
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('petProfiles', JSON.stringify(pets));
        } catch (e) { console.error("Failed to save pets", e); }
    }, [pets]);

    useEffect(() => {
        // If there are no reports, clear the item from storage.
        if (historicReports.length === 0) {
            localStorage.removeItem('historicReports');
            return;
        }
        
        try {
            const MAX_REPORTS_WITH_IMAGES = 20;
    
            // Sort reports, newest first, to decide which ones to prune.
            const sortedReports = [...historicReports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            // Create a pruned version for storage.
            const reportsToStore = sortedReports.map((report, index) => {
                // For reports older than the limit, remove large image data.
                // We don't prune summary reports as they are valuable overviews and might not have large images anyway.
                if (index >= MAX_REPORTS_WITH_IMAGES && !report.isSummaryReport) {
                    // Create a new object without the large base64 image fields.
                    const { petSnapshot, emotionSnapshots, profileHeadshot, ...restOfReport } = report;
                    // The properties `petSnapshot`, `emotionSnapshots`, and `profileHeadshot` will be omitted from `restOfReport`.
                    return restOfReport;
                }
                return report;
            });
            
            localStorage.setItem('historicReports', JSON.stringify(reportsToStore));
    
        } catch (e) {
            console.error("Failed to save reports", e);
            // Fallback strategy: If pruning is not enough, drastically reduce the data by saving only the latest 5 full reports.
            try {
                const latestFiveReports = [...historicReports]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5);
                localStorage.setItem('historicReports', JSON.stringify(latestFiveReports));
                // Let the developer know what happened.
                console.warn("Storage quota exceeded. As a fallback, only the 5 most recent reports were saved to prevent data loss for the current session.");
            } catch (fallbackError) {
                console.error("Fallback save failed. Could not save any reports. Data will be lost on refresh.", fallbackError);
            }
        }
    }, [historicReports]);

    useEffect(() => {
        try { localStorage.setItem('guardianScores', JSON.stringify(guardianScores)); }
        catch (e) { console.error("Failed to save scores", e); }
    }, [guardianScores]);

    useEffect(() => {
        try { if (dailyUploadData) localStorage.setItem('dailyUploadData', JSON.stringify(dailyUploadData)); }
        catch (e) { console.error("Failed to save daily upload data", e); }
    }, [dailyUploadData]);

    const reportsForSelectedPet = useMemo(() => historicReports.filter(r => r.petId === selectedPetId), [historicReports, selectedPetId]);
    const latestReport = useMemo(() => reportsForSelectedPet.length > 0 ? [...reportsForSelectedPet].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null, [reportsForSelectedPet]);
    const individualScore = guardianScores[selectedPetId || ''] || 0;

     useEffect(() => {
        if (latestReport) {
            setSharedImageUrl(latestReport.petSnapshot || latestReport.emotionSnapshots?.[0] || selectedPet?.photo || null);
        }
    }, [latestReport, selectedPet]);

    useEffect(() => {
        if (selectedPet && reportsForSelectedPet.length > 0) {
            if (reportsForSelectedPet.length >= 3) {
                setIsProfileLoading(true);
                setProfileError(null);
                getPersonalityProfile(reportsForSelectedPet, selectedPet, 'en')
                    .then(setPersonalityProfile)
                    .catch(() => setProfileError(t('profile_error_generic', 'en')))
                    .finally(() => setIsProfileLoading(false));
            } else {
                setProfileError(t('profile_error_not_enough_reports', 'en'));
                setPersonalityProfile(null);
            }

            if (reportsForSelectedPet.length >= 2) {
                setIsPredictiveTipLoading(true);
                getPredictiveTip(selectedPet, reportsForSelectedPet, 'en')
                    .then(setPredictiveTip)
                    .catch(() => {})
                    .finally(() => setIsPredictiveTipLoading(false));
            }
        } else {
            setPersonalityProfile(null);
            setPredictiveTip(null);
        }

        setIsTipLoading(true);
        getDailyTip(selectedPet, reportsForSelectedPet, 'en')
            .then(setDailyTip)
            .catch(() => {})
            .finally(() => setIsTipLoading(false));
    }, [selectedPetId, pets, reportsForSelectedPet]);
    
    // Daily Tip Notification Effect
    useEffect(() => {
        if (!dailyTip || isTipLoading || !notificationService.isSupported() || !notificationService.isPermissionGranted()) {
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const lastTipDate = localStorage.getItem('lastDailyTipNotificationDate');

        if (lastTipDate !== today) {
            const tipText = typeof dailyTip === 'string'
                ? dailyTip
                : (dailyTip as DailyTipsResponse)[selectedPet?.petType || 'dog'];

            if (tipText) {
                notificationService.showNotification(
                    t('daily_tip_title', 'en'),
                    {
                        body: tipText,
                        icon: selectedPet?.photo || '/vite.svg'
                    }
                );
                localStorage.setItem('lastDailyTipNotificationDate', today);
            }
        }
    }, [dailyTip, isTipLoading, selectedPet, t]);

    const handleAnalysisComplete = (newReport: HistoricReport) => {
        let score = 0;
        if (['Calm', 'Playful'].includes(newReport.emotion)) score += 10;
        const today = new Date().toISOString().split('T')[0];
        if (dailyUploadData?.date !== today) {
            score += 5;
            setDailyUploadData({ date: today, count: 1 });
        } else {
            setDailyUploadData(prev => ({ ...prev!, count: prev!.count + 1 }));
        }
        if (newReport.playPrompts?.some(p => p.type === 'physical')) score += 5;
        if (newReport.playPrompts?.some(p => p.type === 'digital')) score += 5;

        const finalScore = Math.round(score / 3.5);
        const reportWithScore = { ...newReport, score: finalScore };

        setGuardianScores(prev => ({
            ...prev,
            [newReport.petId]: (Number(prev[newReport.petId]) || 0) + finalScore
        }));

        setHistoricReports(prev => [...prev, reportWithScore]);
        setCurrentCard(0);
        setIsAnalysisModalOpen(false);

        // Show notification
        if (notificationService.isPermissionGranted()) {
            const petForNotification = pets.find(p => p.id === newReport.petId);
            if (reportWithScore.sicknessIndicators) {
                notificationService.showNotification(
                    t('notification_health_alert_title', 'en', { petName: newReport.petName }),
                    {
                        body: t('notification_health_alert_body', 'en'),
                        icon: newReport.petSnapshot || petForNotification?.photo || '/vite.svg'
                    }
                );
            } else {
                notificationService.showNotification(
                    t('notification_report_ready_title', 'en'),
                    {
                        body: t('notification_report_ready_body', 'en', { petName: newReport.petName }),
                        icon: newReport.petSnapshot || petForNotification?.photo || '/vite.svg'
                    }
                );
            }
        }
    };

    const handleSavePet = (pet: PetProfile) => {
        const isNewPet = !pets.some(p => p.id === pet.id);
        setPets(prev => isNewPet ? [...prev, pet] : prev.map(p => p.id === pet.id ? pet : p));
        if (isNewPet && appState !== 'pet_selection') {
            setSelectedPetId(pet.id);
        }
        setIsPetProfileModalOpen(false);
    };

    const handleDeletePet = (petId: string) => {
        if (window.confirm(t('confirm_delete_pet', 'en'))) {
            setPets(prev => prev.filter(p => p.id !== petId));
            if (selectedPetId === petId) {
                const remainingPets = pets.filter(p => p.id !== petId);
                setSelectedPetId(remainingPets.length > 0 ? remainingPets[0].id : null);
            }
        }
    };
    
    const handleViewDetails = (report: HistoricReport) => {
        setReportForDetails(report);
        setIsDetailsModalOpen(true);
    };
    
    const handlePetSelection = (petId: string) => {
        setSelectedPetId(petId);
        setAppState('main');
    };

    const handleStartVoiceChat = (report: HistoricReport) => {
        setReportForVoiceChat(report);
        setIsVoiceChatModalOpen(true);
    };

    const handleShowEmotionReel = (report: HistoricReport) => {
        const emotionReports = historicReports.filter(r => r.petId === report.petId && r.emotion === report.emotion);
        setReelReports({ reports: emotionReports, title: t('emotion_group_title', 'en', { emotion: report.emotion }) });
        setIsMemoryLaneModalOpen(true);
    };

    const handleShowAttitudeReel = (report: HistoricReport) => {
        if (!report.attitude) return;
        const attitudeReports = historicReports.filter(r => r.petId === report.petId && r.attitude === report.attitude);
        setReelReports({ reports: attitudeReports, title: t('attitude_group_title', 'en', { attitude: report.attitude }) });
        setIsMemoryLaneModalOpen(true);
    };
    
    const handleRequestNotificationPermission = async () => {
        const permission = await notificationService.requestPermission();
        setNotificationPermission(permission);
        setShowNotificationPrompt(false);
        localStorage.setItem('notificationPrompted', 'true');
    };

    const handleDismissNotificationPermission = () => {
        setShowNotificationPrompt(false);
        localStorage.setItem('notificationPrompted', 'true');
    };

    const handleExportPDF = () => {
        alert('PDF export feature coming soon! This will generate a comprehensive vet-ready report.');
    };

    const cards = selectedPet && latestReport ? [
        <EditorCard key={`${latestReport.id}-2`} report={latestReport} sharedImageUrl={sharedImageUrl} dailyTip={dailyTip} isTipLoading={isTipLoading} />,
        <VibeCard key={`${latestReport.id}-1`} report={latestReport} sharedImageUrl={sharedImageUrl} setSharedImageUrl={setSharedImageUrl} />,
        <CarePlanCard key={`${latestReport.id}-3`} report={latestReport} pet={selectedPet} setView={setView} onViewDetails={handleViewDetails} />,
        <PersonalityCard key={`${latestReport.id}-4`} pet={selectedPet} reports={reportsForSelectedPet} onViewDetails={() => handleViewDetails(latestReport)} onViewHub={() => setView('wellness_hub')} />,
        <UploadCard key="upload" onUpload={() => setIsAnalysisModalOpen(true)} onViewHub={() => setView('wellness_hub')} t={t} />
    ] : [<UploadCard key="upload-only" onUpload={() => setIsAnalysisModalOpen(true)} onViewHub={() => setView('wellness_hub')} t={t} />];


    const handleTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = 0; // Reset
        touchStartX.current = e.targetTouches[0].clientX;
        setIsSwiping(true);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
        if (touchStartX.current) {
            const delta = touchEndX.current - touchStartX.current;
            setSwipeOffset(delta);
        }
    };
    const handleTouchEnd = () => {
        setIsSwiping(false);
        if (touchStartX.current && touchEndX.current) {
            const deltaX = touchStartX.current - touchEndX.current;
            if (deltaX > 50) { // Swipe left
                setCurrentCard(prev => Math.min(prev + 1, cards.length - 1));
            } else if (deltaX < -50) { // Swipe right
                setCurrentCard(prev => Math.max(prev - 1, 0));
            }
        }
        touchStartX.current = 0;
        touchEndX.current = 0;
        setSwipeOffset(0);
    };
    
    if (isInitialLoading) {
        return <SplashScreen />;
    }

    if (appState === 'splash') {
        return <SplashScreen />;
    }

    if (appState === 'pet_selection') {
        return (
            <>
                <PetSelectionScreen pets={pets} onSelectPet={handlePetSelection} onAddPet={() => setIsPetProfileModalOpen(true)} t={(key) => t(key, 'en')} />
                {isPetProfileModalOpen && <PetProfileForm petToEdit={null} onSave={handleSavePet} onCancel={() => setIsPetProfileModalOpen(false)} onDelete={handleDeletePet} t={t} language="en" />}
            </>
        );
    }

    if (view === 'memories') {
        return <MemoriesView reports={historicReports} onViewReport={(report) => {}} onBack={() => setView('swipe')} t={t} language="en" />;
    }

    if (view === 'wellness_hub') {
        return (
            <div className="w-full h-full flex flex-col bg-slate-900">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <button 
                        onClick={() => setView('swipe')} 
                        className="text-teal-400 font-semibold hover:text-teal-300 transition-colors flex items-center gap-2"
                    >
                        ← Back to Swipe View
                    </button>
                    <h1 className="text-xl font-bold text-slate-100">Wellness Hub</h1>
                    <div className="w-32"></div>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <WellnessHub
                        pet={selectedPet}
                        reports={reportsForSelectedPet}
                        latestReport={latestReport}
                        personalityProfile={personalityProfile}
                        isProfileLoading={isProfileLoading}
                        profileError={profileError}
                        dailyTip={dailyTip}
                        isTipLoading={isTipLoading}
                        predictiveTip={predictiveTip}
                        isPredictiveTipLoading={isPredictiveTipLoading}
                        individualScore={individualScore}
                        notificationPermission={notificationPermission}
                        onStartAnalysis={() => setIsAnalysisModalOpen(true)}
                        onViewDetails={handleViewDetails}
                        onRequestNotificationPermission={handleRequestNotificationPermission}
                        onExportPDF={handleExportPDF}
                        t={(key, options) => t(key, 'en', options)}
                        language='en'
                    />
                </div>
            </div>
        );
    }
    
    if (pets.length === 0) {
        return (
            <>
                <div className="w-screen h-screen flex flex-col items-center justify-center text-center p-4">
                    <PawPrintIcon className="w-20 h-20 text-slate-400 dark:text-slate-600 mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Welcome to Dr. Paws!</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Add a pet to start translating their world.</p>
                    <button onClick={() => setIsPetProfileModalOpen(true)} className="bg-[var(--accent-color)] text-white font-bold py-2 px-6 rounded-lg">Add Pet</button>
                </div>
                {isPetProfileModalOpen && <PetProfileForm petToEdit={null} onSave={handleSavePet} onCancel={() => setIsPetProfileModalOpen(false)} onDelete={handleDeletePet} t={t} language="en" />}
            </>
        );
    }

    return (
        <div 
          className="w-full h-full relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
            <button
                onClick={handleThemeToggle}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Toggle Design Theme"
            >
                <PaletteIcon className="w-6 h-6" />
            </button>
            <div
                className="swipe-container"
                style={{
                    transform: `translateX(calc(-${currentCard * 100}% + ${swipeOffset}px))`,
                    transition: isSwiping ? 'none' : undefined
                }}
            >
                {cards.map((card, index) => card)}
            </div>

            {cards.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-2 z-10">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentCard(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                currentCard === index ? 'bg-[var(--accent-color-light)] scale-125' : 'bg-gray-400 dark:bg-gray-600'
                            }`}
                            aria-label={`Go to card ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {isPetProfileModalOpen && <PetProfileForm petToEdit={null} onSave={handleSavePet} onCancel={() => setIsPetProfileModalOpen(false)} onDelete={handleDeletePet} t={t} language="en" />}
            {isAnalysisModalOpen && selectedPet && (
                <AnalysisFlowModal
                    pet={selectedPet}
                    onClose={() => setIsAnalysisModalOpen(false)}
                    onAnalysisComplete={(report, file) => handleAnalysisComplete(report)}
                    language="en"
                    t={t}
                />
            )}
            
            {isDetailsModalOpen && reportForDetails && (
                <ReportDetailsModal
                    report={reportForDetails}
                    petName={selectedPet?.name}
                    petPhoto={selectedPet?.photo}
                    originalFile={null} 
                    onClose={() => setIsDetailsModalOpen(false)}
                    onVetChecklistChange={(checklist) => {
                        const newReports = historicReports.map(r => r.id === reportForDetails.id ? {...r, vetChecklist: checklist} : r);
                        setHistoricReports(newReports);
                    }}
                    translationCache={translationCache}
                    setTranslationCache={setTranslationCache}
                    language={'en'}
                    t={(key, options) => t(key, 'en', options)}
                />
            )}
            {isVoiceChatModalOpen && reportForVoiceChat && selectedPet && (
                <VoiceChatModal
                    pet={selectedPet}
                    report={reportForVoiceChat}
                    onClose={() => setIsVoiceChatModalOpen(false)}
                    t={(key, options) => t(key, 'en', options)}
                    language={'en'}
                />
            )}
            {isMemoryLaneModalOpen && reelReports && selectedPet && (
                <MemoryLaneModal
                    reports={reelReports.reports}
                    title={reelReports.title}
                    pet={selectedPet}
                    onClose={() => setIsMemoryLaneModalOpen(false)}
                    onViewDetails={(report) => {
                        setIsMemoryLaneModalOpen(false);
                        handleViewDetails(report);
                    }}
                    onEditImage={() => {}}
                    t={(key, options) => t(key, 'en', options)}
                    language={'en'}
                />
            )}
            {showNotificationPrompt && (
                <NotificationPermissionBanner
                    onAllow={handleRequestNotificationPermission}
                    onDismiss={handleDismissNotificationPermission}
                    t={(key) => t(key, 'en')}
                />
            )}
        </div>
    );
};

export default App;
