import React, { useEffect, useRef, useState } from 'react';
import { HistoricReport, Language, PetProfile } from '../types';
import { XIcon, PawPrintIcon, DownloadIcon, ShareAltIcon, DrPawsLogo, ShuffleIcon, ShareIcon, SparklesIcon, SpinnerIcon } from './icons';
import html2canvas from 'html2canvas';
import { generateDreamMemoryImage } from '../services/geminiService';

interface MemoryLaneModalProps {
    reports: HistoricReport[];
    title: string;
    pet: PetProfile;
    onClose: () => void;
    onViewDetails: (report: HistoricReport) => void;
    onEditImage: (report: HistoricReport) => void;
    t: (key: string, options?: any) => string;
    language: Language;
}

const PhotoCard: React.FC<{
    report: HistoricReport;
    onViewDetails: () => void;
    onEdit: () => void;
    index: number;
    language: Language;
    pet: PetProfile;
    t: (key: string, options?: any) => string;
}> = ({ report, onViewDetails, onEdit, index, language, pet, t }) => {
    const isDream = report.id.startsWith('dream-');
    const rotations = ['-rotate-2', 'rotate-3', 'rotate-1', '-rotate-1', 'rotate-2'];
    const rotationClass = rotations[index % rotations.length];

    let attitudeText = '';
    if (report.attitude) {
        const attitudeKey = `attitude_${report.attitude.trim().toLowerCase()}`;
        const translatedAttitude = t(attitudeKey);
        attitudeText = translatedAttitude === attitudeKey
            ? report.attitude.charAt(0).toUpperCase() + report.attitude.slice(1)
            : translatedAttitude;
    }

    return (
        <div
            className={`relative group w-full transition-transform duration-300 hover:scale-110 hover:z-10 ${isDream ? 'transform-none' : rotationClass}`}
        >
            <div className={`bg-white p-2 pb-10 shadow-lg rounded-md w-full ${isDream ? 'ring-2 ring-purple-500 ring-offset-4 ring-offset-slate-900' : ''}`}>
                 {isDream && (
                    <div className="absolute top-[-10px] left-[-10px] z-20 transform -rotate-12">
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3"/>
                            {t('dream_memory_card_label')}
                        </span>
                    </div>
                 )}
                <button onClick={onViewDetails} disabled={isDream} className="w-full aspect-square bg-slate-200 rounded-sm overflow-hidden block disabled:cursor-default">
                    {report.petSnapshot ? (
                        <img src={report.petSnapshot} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <PawPrintIcon className="w-12 h-12 text-slate-400" />
                        </div>
                    )}
                </button>
            </div>
            {report.petSnapshot && !isDream && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="absolute top-0 right-0 z-20 p-2 m-1 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/50"
                    title={t('image_editor_title')}
                >
                    <SparklesIcon className="w-4 h-4" />
                </button>
            )}
            <p className="absolute bottom-3 left-3 text-slate-700 font-kalam text-sm transform -rotate-1">
                {isDream ? report.timestamp : new Date(report.timestamp).toLocaleDateString(language, { month: 'short', day: 'numeric' })}
            </p>
            {attitudeText && (
                <p className={`absolute bottom-3 right-3 font-kalam font-bold text-sm transform rotate-2 ${isDream ? 'text-purple-600' : 'text-pink-600'}`}>
                    {attitudeText}
                </p>
            )}
        </div>
    );
};

const LoadingCard: React.FC<{ t: (key: string) => string }> = ({ t }) => (
    <div className="relative group w-full">
        <div className="bg-slate-800 p-2 pb-10 shadow-lg rounded-md w-full aspect-square flex flex-col items-center justify-center text-center">
            <SpinnerIcon className="w-10 h-10 text-teal-400" />
            <p className="text-sm text-slate-400 mt-2 font-kalam">{t('dream_memory_generating')}</p>
        </div>
    </div>
);


export const MemoryLaneModal: React.FC<MemoryLaneModalProps> = ({ reports, title, pet, onClose, onViewDetails, onEditImage, t, language }) => {
    const collageRef = useRef<HTMLDivElement>(null);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [displayedReports, setDisplayedReports] = useState<HistoricReport[]>([]);
    const [isGeneratingDream, setIsGeneratingDream] = useState(false);
    
    useEffect(() => {
        setDisplayedReports(reports);
    }, [reports]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareMenuOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
    const handleShuffle = () => {
        setDisplayedReports(prevReports => [...prevReports].sort(() => Math.random() - 0.5));
    };

    const handleGenerateDream = async () => {
        setIsGeneratingDream(true);
        try {
            const simpleEmotion = title.split(' ')[0];
            const dreamImage = await generateDreamMemoryImage(pet, simpleEmotion, language);
            const dreamReport: HistoricReport = {
                id: `dream-${crypto.randomUUID()}`,
                petId: pet.id,
                petName: pet.name,
                timestamp: t('dream_memory_timestamp'),
                petSnapshot: dreamImage,
                emotion: 'Dream',
                emotionScores: { calm: 0, anxious: 0, playful: 0, hungry: 0, pain: 0, grumpy: 0 },
                currentNeeds: { attention: 0, play: 0, comfort: 0, food: 0, rest: 0, health: 0, water: 0 },
                translation: '',
                detailedAnalysis: '',
                careTips: [],
                attitude: t('dream_memory_attitude')
            };
            setDisplayedReports(prev => [dreamReport, ...prev]);
        } catch (error) {
            console.error("Failed to generate dream memory:", error);
        } finally {
            setIsGeneratingDream(false);
        }
    };

    const handleSave = async () => {
        if (!collageRef.current) return;
        try {
            const canvas = await html2canvas(collageRef.current, { backgroundColor: '#0f172a' }); // slate-900
            const image = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = `DrPaws-Memories-${pet.name}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error saving collage:', error);
            alert('An error occurred while trying to save the image.');
        }
    };

    const handleShare = async () => {
        if (!collageRef.current) return;
        
        try {
            const canvas = await html2canvas(collageRef.current, { backgroundColor: '#0f172a', useCORS: true }); // slate-900
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    alert('Could not create image to share.');
                    return;
                }
                const file = new File([blob], `DrPaws-Memories-${pet.name}.png`, { type: 'image/png' });
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: `${title} with ${pet.name}`,
                        text: `Check out these lovely moments with ${pet.name}, created with Dr. Paws!`,
                        files: [file],
                    });
                } else {
                    handleSave();
                }
            }, 'image/png');
        } catch (error) {
            console.error('Error sharing collage:', error);
            alert('An error occurred while trying to share the image.');
        }
    };


    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 flex-shrink-0 flex justify-between items-center border-b border-slate-700/50">
                    <div className='text-center flex-grow'>
                        <h2 className="text-2xl font-bold text-teal-400">{title}</h2>
                        <p className="text-slate-400 text-sm">{t('memory_collage_subtitle', { count: reports.length })}</p>
                    </div>
                    <div className="flex items-center gap-2 absolute top-4 right-4">
                        <button onClick={handleGenerateDream} disabled={isGeneratingDream} title={t('generate_dream_memory')} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleShuffle} title={t('shuffle_button_title')} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/50 transition-colors">
                            <ShuffleIcon className="w-5 h-5" />
                        </button>
                        <div className="relative" ref={shareMenuRef}>
                            <button onClick={() => setIsShareMenuOpen(prev => !prev)} title={t('share_button')} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/50 transition-colors">
                                <ShareIcon className="w-5 h-5" />
                            </button>
                            {isShareMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-20 animate-fade-in-fast">
                                    <ul className="py-1">
                                        <li>
                                            <button onClick={() => { handleShare(); setIsShareMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-3">
                                                <ShareAltIcon className="w-4 h-4" />
                                                {t('share_to_socials')}
                                            </button>
                                        </li>
                                        <li>
                                            <button onClick={() => { handleSave(); setIsShareMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-3">
                                                <DownloadIcon className="w-4 h-4" />
                                                {t('download_image')}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/50 transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>
                
                <div className="flex-grow overflow-y-auto p-2 sm:p-6">
                    {displayedReports.length > 0 || isGeneratingDream ? (
                        <div ref={collageRef} className="bg-slate-900 p-4 sm:p-6 rounded-lg">
                            <div className="flex items-center gap-4 mb-6">
                                {pet.photo && <img src={pet.photo} alt={pet.name} className="w-16 h-16 rounded-full object-cover border-4 border-slate-700" />}
                                <div>
                                    <h3 className="text-2xl font-bold text-white leading-tight">{pet.name}'s</h3>
                                    <p className="text-xl font-semibold text-teal-400 leading-tight">{title}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4 py-4">
                                {isGeneratingDream && <LoadingCard t={t} />}
                                {displayedReports.map((report, index) => (
                                    <PhotoCard
                                        key={report.id}
                                        report={report}
                                        onViewDetails={() => onViewDetails(report)}
                                        onEdit={() => onEditImage(report)}
                                        index={index}
                                        language={language}
                                        pet={pet}
                                        t={t}
                                    />
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between text-slate-500">
                                <span className="text-xs italic">{t('app_tagline')}</span>
                                <DrPawsLogo className="w-24" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <PawPrintIcon className="w-16 h-16" />
                            <p className="mt-4">No memories found for this group.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};