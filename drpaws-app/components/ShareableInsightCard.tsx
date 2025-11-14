
import React, { useRef, useState } from 'react';
import { PetProfile, HistoricReport } from '../types';
import { ShareIcon, SpinnerIcon, DrPawsLogo, PawPrintIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, PaletteIcon, ShareAltIcon, MoonIcon, AlertTriangleIcon, FoodIcon, HeartbeatIcon, ShuffleIcon, HeartIcon, SearchIcon, GameControllerIcon, EyeIcon } from './icons';
import html2canvas from 'html2canvas';

interface ShareableInsightCardProps {
    pet: PetProfile;
    report: HistoricReport;
    t: (key: string, options?: any) => string;
    onViewDetails: (report: HistoricReport) => void;
    // New props from parent (Dashboard)
    imageSources: string[];
    currentIndex: number;
    cardColor: string;
    aiImageIndices: Set<number>;
    handlePrev: () => void;
    handleNext: () => void;
}

const emotionIconMap: { [key: string]: { Icon: React.ElementType, color: string } } = {
    calm: { Icon: MoonIcon, color: 'text-teal-500' },
    anxious: { Icon: AlertTriangleIcon, color: 'text-red-500' },
    playful: { Icon: SparklesIcon, color: 'text-yellow-500' },
    hungry: { Icon: FoodIcon, color: 'text-orange-500' },
    pain: { Icon: HeartbeatIcon, color: 'text-red-600' },
    grumpy: { Icon: PawPrintIcon, color: 'text-slate-500' },
};

const getAttitudeIconDetails = (attitude: string) => {
     switch (attitude.toLowerCase()) {
        case 'sassy': case 'mischievous': return { Icon: SparklesIcon, color: 'text-purple-500' };
        case 'cuddly': return { Icon: HeartIcon, color: 'text-pink-500' };
        case 'goofy': return { Icon: SparklesIcon, color: 'text-lime-500' };
        case 'curious': return { Icon: SearchIcon, color: 'text-blue-500' };
        case 'reserved': return { Icon: EyeIcon, color: 'text-slate-500' };
        case 'adventurous': return { Icon: ShuffleIcon, color: 'text-cyan-500' };
        case 'dreamy': return { Icon: MoonIcon, color: 'text-indigo-500' };
        default: return { Icon: SparklesIcon, color: 'text-gray-500' };
    }
}

export const ShareableInsightCard: React.FC<ShareableInsightCardProps> = ({ 
    pet, report, t, onViewDetails, 
    imageSources, currentIndex, cardColor, aiImageIndices, handlePrev, handleNext 
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        if (!cardRef.current || !navigator.share) return;
        setIsSharing(true);
        // Temporarily switch to light theme for canvas rendering if current is dark
        const cardElement = cardRef.current;
        const wasDark = cardElement.classList.contains('share-card-color-black') || cardElement.classList.contains('share-card-color-blue') || cardElement.classList.contains('share-card-color-pink');
        
        // Ensure white theme styles are applied for readability, especially for text
        if(cardColor !== 'white') {
            cardElement.classList.remove(`share-card-color-${cardColor}`);
            cardElement.classList.add('share-card-color-white');
            await new Promise(r => setTimeout(r, 50)); // allow DOM to update
        }

        try {
            const canvas = await html2canvas(cardElement, { 
                backgroundColor: '#ffffff',
                useCORS: true,
                scale: 2
            });
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const file = new File([blob], `${pet.name}-insight.png`, { type: 'image/png' });
                    try {
                        await navigator.share({
                            title: t('dashboard_share_insight'),
                            text: t('dashboard_share_text', { petName: pet.name }),
                            files: [file],
                        });
                    } catch (error) {
                         if ((error as DOMException).name !== 'AbortError') {
                            console.error('Sharing failed', error);
                        }
                    }
                }
            }, 'image/png');
        } catch (error) {
            console.error('Canvas generation failed', error);
        } finally {
            // Restore original theme
            if(cardColor !== 'white') {
                cardElement.classList.add(`share-card-color-${cardColor}`);
                cardElement.classList.remove('share-card-color-white');
            }
            setIsSharing(false);
        }
    };
    
    const hasHealthConcern = report.sicknessIndicators || report.emotion.toLowerCase() === 'pain';
    const emotionDetails = emotionIconMap[report.emotion.toLowerCase()] || { Icon: PawPrintIcon, color: 'text-slate-500' };
    const attitudeDetails = report.attitude ? getAttitudeIconDetails(report.attitude) : null;
    
    let attitudeText = '';
    if (report.attitude) {
        const attitudeKey = `attitude_${report.attitude.trim().toLowerCase()}`;
        const translatedAttitude = t(attitudeKey);
        attitudeText = translatedAttitude !== attitudeKey ? translatedAttitude : report.attitude;
    }


    return (
        <div className="bg-white dark:bg-transparent rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
            <div ref={cardRef} className={`share-card-color-${cardColor} p-4 sm:p-6 rounded-xl font-sans transition-colors duration-300`}>
                <div className="text-center mb-4">
                    <p className="pet-name text-3xl font-bold">{pet.name}</p>
                </div>
                <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden group image-container bg-gray-200 dark:bg-slate-700">
                    {imageSources.length > 0 ? (
                        <img src={imageSources[currentIndex]} alt="pet insight" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <PawPrintIcon className="w-24 h-24 text-slate-400 dark:text-slate-500" />
                        </div>
                    )}

                    {imageSources.length > 1 && (
                        <>
                            <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>
                            <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <ChevronRightIcon className="w-6 h-6" />
                            </button>
                        </>
                    )}
                     {aiImageIndices.has(currentIndex) && (
                        <div className="absolute top-3 left-3 bg-purple-600/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-white">
                           <SparklesIcon className="w-3 h-3" /> {t('ai_generated_art')}
                        </div>
                    )}
                </div>

                <div className="flex justify-center items-center gap-4 p-2 rounded-lg bg-gray-100 dark:bg-slate-800/50">
                    <div className="emotion-badge flex items-center gap-2">
                        <emotionDetails.Icon className={`w-6 h-6 ${emotionDetails.color}`} />
                        <span className={`font-bold text-lg ${emotionDetails.color}`}>{t(`emotion_${report.emotion.toLowerCase()}`)}</span>
                    </div>
                     {report.attitude && attitudeDetails && (
                        <div className="attitude-badge flex items-center gap-2">
                           <attitudeDetails.Icon className={`w-6 h-6 ${attitudeDetails.color}`} />
                           <span className={`font-bold text-lg ${attitudeDetails.color}`}>{attitudeText}</span>
                        </div>
                    )}
                </div>

                <div className="pet-translation text-center bg-gray-100 dark:bg-slate-800/50 p-4 rounded-lg mt-4">
                     {hasHealthConcern ? (
                        <button 
                            onClick={() => onViewDetails(report)} 
                            className="w-full text-base italic text-slate-600 dark:text-slate-300 text-center hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <span className="underline decoration-red-500/70 decoration-2 underline-offset-2">"{report.translation}"</span>
                        </button>
                    ) : (
                        <p className="text-base italic">"{report.translation}"</p>
                    )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700/50 flex justify-center items-center gap-2">
                    <PawPrintIcon className="w-4 h-4 dr-paws-logo" />
                    <span className="text-sm font-semibold dr-paws-logo">Dr. Paws</span>
                </div>
            </div>
             {navigator.share && (
                 <div className="p-4 bg-gray-50 dark:bg-slate-800/20 rounded-b-2xl border-t border-gray-200 dark:border-slate-700 flex justify-end">
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title={t('dashboard_share_insight')}
                    >
                        {isSharing ? <SpinnerIcon className="w-5 h-5" /> : <ShareAltIcon className="w-5 h-5" />}
                    </button>
                </div>
            )}
        </div>
    );
};
