
import React, { useState, useEffect, useMemo } from 'react';
import { HistoricReport } from '../types';
import { optimizeImage, editImageWithPrompt } from '../services/geminiService';
import { SpinnerIcon, SparklesIcon, CrownIcon, HeartIcon, ShieldCheckIcon, GlassesIcon, DiademIcon, BeardIcon, HeartEyesIcon, XIcon, ShuffleIcon } from './icons';
import { t } from '../localization/translations';

interface VibeCardProps {
    report: HistoricReport;
    sharedImageUrl: string | null;
    setSharedImageUrl: (url: string | null) => void;
}

type EditStyle = 'king' | 'hearts' | 'superhero' | 'glasses' | 'princess' | 'beard' | 'heart eyes';

const styleButtons: { style: EditStyle; Icon: React.ElementType, prompt: string }[] = [
    { style: 'king', Icon: CrownIcon, prompt: 'add a majestic golden crown on the pet\'s head' },
    { style: 'hearts', Icon: HeartIcon, prompt: 'surround the pet with floating, cartoonish red hearts' },
    { style: 'superhero', Icon: ShieldCheckIcon, prompt: 'give the pet a red superhero cape' },
    { style: 'glasses', Icon: GlassesIcon, prompt: 'put cool sunglasses on the pet' },
    { style: 'princess', Icon: DiademIcon, prompt: 'add a sparkling princess tiara to the pet\'s head' },
    { style: 'beard', Icon: BeardIcon, prompt: 'give the pet a funny, bushy beard' },
    { style: 'heart eyes', Icon: HeartEyesIcon, prompt: 'give the pet cartoon heart eyes' },
];

export const VibeCard: React.FC<VibeCardProps> = ({ report, sharedImageUrl, setSharedImageUrl }) => {
    const [optimizedImages, setOptimizedImages] = useState<Record<string, string>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sourceImages = useMemo(() => {
        const images: string[] = [];
        if (report.petSnapshot) images.push(report.petSnapshot);
        if (report.emotionSnapshots) images.push(...report.emotionSnapshots);
        return [...new Set(images)].slice(0, 5);
    }, [report]);
    
    const [displayedImages, setDisplayedImages] = useState<string[]>([]);

    useEffect(() => {
        setDisplayedImages(sourceImages);
    }, [sourceImages]);

    useEffect(() => {
        const optimizeAll = async () => {
            const newOptimized: Record<string, string> = {};
            const newLoading: Record<string, boolean> = {};
            
            sourceImages.forEach((src) => { newLoading[src] = true; });
            setLoadingStates(newLoading);
            setOptimizedImages({});

            await Promise.all(sourceImages.map(async (src) => {
                try {
                    const optimized = await optimizeImage(src);
                    setOptimizedImages(prev => ({...prev, [src]: optimized}));
                } catch (e) {
                    console.error(`Failed to optimize image`, e);
                    setOptimizedImages(prev => ({...prev, [src]: src})); // fallback
                } finally {
                    setLoadingStates(prev => ({...prev, [src]: false}));
                }
            }));
        };

        if (sourceImages.length > 0) {
            optimizeAll();
        }
    }, [sourceImages]);

    const handleEdit = async (prompt: string) => {
        const currentImage = sharedImageUrl ? optimizedImages[sharedImageUrl] || sharedImageUrl : null;
        if (!currentImage || isEditing) return;
        
        setIsEditing(true);
        setError(null);
        try {
            const edited = await editImageWithPrompt(currentImage, prompt);
            const newImageKey = `edited-${Date.now()}`;
            setOptimizedImages(prev => ({...prev, [newImageKey]: edited}));
            setSharedImageUrl(newImageKey);
        } catch(e) {
            console.error("Failed to edit image:", e);
            setError("Image editing failed. Please try again.");
        } finally {
            setIsEditing(false);
        }
    };
    
    const handleShuffle = () => {
        const shuffled = [...sourceImages].sort(() => Math.random() - 0.5);
        setDisplayedImages(shuffled);
        if (shuffled.length > 0) {
            setSharedImageUrl(shuffled[0]);
        }
    };

    const mainImageSrc = sharedImageUrl ? optimizedImages[sharedImageUrl] || sharedImageUrl : null;
    const isMainImageLoading = (sharedImageUrl && loadingStates[sharedImageUrl]) || isEditing;

    return (
        <div className="swipe-card">
            <div className="w-full max-w-sm mx-auto text-center flex flex-col h-full">
                 <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2"><SparklesIcon className="w-6 h-6 text-teal-400"/> AI Photo Studio</h2>
                 </div>
                
                <div className="relative w-full aspect-square bg-slate-800 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
                    {isMainImageLoading ? (
                        <SpinnerIcon className="w-16 h-16 text-teal-400" />
                    ) : mainImageSrc ? (
                        <img src={mainImageSrc} alt={report.petName} className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                        <p className="text-slate-400">No image available</p>
                    )}
                </div>

                <div className="mt-4">
                    {sourceImages.length > 1 && (
                        <div className="flex items-center gap-2">
                            <div className="flex-grow flex gap-2 overflow-x-auto p-2 -mx-2 hide-scrollbar">
                                {displayedImages.map((src, index) => (
                                    <button 
                                        key={index} 
                                        onClick={() => setSharedImageUrl(src)}
                                        className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700 transition-all duration-200 transform hover:scale-105 ${sharedImageUrl === src ? 'ring-4 ring-teal-500' : 'ring-2 ring-transparent'}`}
                                    >
                                        <img src={src} alt={`snapshot ${index + 1}`} className="w-full h-full object-cover" />
                                        {loadingStates[src] && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <SpinnerIcon className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={handleShuffle}
                                className="p-3 bg-slate-800 rounded-lg text-slate-400 hover:bg-teal-500 hover:text-white transition-colors"
                            >
                                <ShuffleIcon className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4">
                    {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
                     <p className="text-sm font-semibold text-slate-400 mb-2">Add a Fun Effect</p>
                    <div className="grid grid-cols-4 gap-3">
                        {styleButtons.map(({ style, Icon, prompt }) => (
                            <button 
                                key={style}
                                onClick={() => handleEdit(prompt)}
                                disabled={isMainImageLoading}
                                className="aspect-square bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-white transition-colors disabled:opacity-50"
                                title={style}
                            >
                                <Icon className="w-8 h-8" />
                            </button>
                        ))}
                         <button 
                            onClick={() => {
                                if (sharedImageUrl) {
                                    setSharedImageUrl(sourceImages.includes(sharedImageUrl) ? sharedImageUrl : sourceImages[0]);
                                }
                            }}
                            disabled={isMainImageLoading}
                            className="aspect-square bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                            title="Reset"
                        >
                            <XIcon className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
