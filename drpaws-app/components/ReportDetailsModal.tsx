
import React, { useState, useEffect, useRef } from 'react';
import { PetEmpathyReport, HistoricReport, Language, VetChecklistEntry, VideoTimelineEvent } from '../types';
import { PawPrintIcon, EyeIcon, SoundWaveIcon, ActivityIcon, PrinterIcon, SpinnerIcon, XIcon, HeartbeatIcon } from './icons';
import { StressSpectrum } from './StressSpectrum';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { translateReport } from '../services/geminiService';
import { extractFrame, parseTimestamp } from '../services/videoUtils';
import { VetChecklist } from './VetChecklist';

interface ReportDetailsModalProps {
    report: HistoricReport;
    petName?: string;
    petPhoto?: string;
    originalFile: File | null;
    onClose: () => void;
    onVetChecklistChange: (checklist: VetChecklistEntry[]) => void;
    translationCache: Record<string, HistoricReport>;
    setTranslationCache: React.Dispatch<React.SetStateAction<Record<string, HistoricReport>>>;
    language: Language;
    t: (key: string, options?: any) => string;
}

const observationAreaIconMap: Record<string, React.ElementType> = {
    Eyes: EyeIcon,
    Mouth: PawPrintIcon, // Placeholder
    Tail: PawPrintIcon, // Placeholder
    Body: ActivityIcon,
    Behavior: ActivityIcon,
    Vocalization: SoundWaveIcon,
};

// Helper function to extract only the parts of the report that need translation
const getTranslatableContent = (reportData: PetEmpathyReport) => {
    if (!reportData) return null;
    const { emotion, translation, detailedAnalysis, careTips, playPrompts, audioAnalysis, sleepAnalysis, breathingAnalysis, sicknessIndicators, videoTimeline } = reportData;
    return { emotion, translation, detailedAnalysis, careTips, playPrompts, audioAnalysis, sleepAnalysis, breathingAnalysis, sicknessIndicators, videoTimeline };
};

const getEmotionColorClass = (emotion: string) => {
    switch (emotion.toLowerCase()) {
        case 'anxious':
        case 'pain':
        case 'grumpy':
            return 'text-red-600 dark:text-red-400';
        case 'playful':
            return 'text-yellow-600 dark:text-yellow-400';
        case 'calm':
            return 'text-teal-600 dark:text-teal-400';
        case 'hungry':
            return 'text-orange-600 dark:text-orange-400';
        default:
            return 'text-slate-700 dark:text-slate-200';
    }
};

const VideoTimelineDisplay: React.FC<{
    timeline: VideoTimelineEvent[];
    videoFile: File;
    language: Language;
    t: (key: string, options?: any) => string;
}> = ({ timeline, videoFile, language, t }) => {
    const [snapshots, setSnapshots] = useState<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const extractAllFrames = async () => {
            setIsLoading(true);
            const newSnapshots = new Map<string, string>();
            // Use Promise.all for concurrent frame extraction
            await Promise.all(timeline.map(async (event) => {
                if (!isMounted) return;
                try {
                    const time = parseTimestamp(event.timestamp);
                    const dataUrl = await extractFrame(videoFile, time);
                    newSnapshots.set(event.timestamp, dataUrl);
                } catch (err) {
                    console.error(`Failed to extract frame at ${event.timestamp}`, err);
                    newSnapshots.set(event.timestamp, 'error'); // Mark as error
                }
            }));

            if (isMounted) {
                setSnapshots(newSnapshots);
                setIsLoading(false);
            }
        };

        extractAllFrames();

        return () => { isMounted = false; };
    }, [timeline, videoFile]);

    return (
        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
            {timeline.map((event, index) => {
                const snapshotSrc = snapshots.get(event.timestamp);
                const emotionKey = event.detectedEmotion ? event.detectedEmotion.toLowerCase() : '';
                const emotionText = t(`emotion_${emotionKey}`);
                const emotionColorClass = getEmotionColorClass(emotionKey);
                
                return (
                    <div key={index} className={`pt-4 ${index > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="sm:w-1/3 flex-shrink-0">
                                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    {(isLoading && !snapshotSrc) ? (
                                        <SpinnerIcon className="w-6 h-6 text-slate-400" />
                                    ) : snapshotSrc && snapshotSrc !== 'error' ? (
                                        <img src={snapshotSrc} alt={`Snapshot at ${event.timestamp}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-slate-500">Preview N/A</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-baseline mb-2">
                                    <p className="font-bold text-lg text-teal-600 dark:text-teal-400">{event.timestamp}</p>
                                    {event.detectedEmotion && (
                                        <div className="text-right">
                                            <span className="font-semibold text-sm text-slate-500 dark:text-slate-400">{t('detected_emotion_label')}</span>
                                            <p className={`font-bold text-base ${emotionColorClass}`}>{emotionText}</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{event.analysisSummary}</p>
                                <h5 className="font-semibold text-slate-500 dark:text-slate-400 text-sm mb-1">{t('symptoms_observed_title')}</h5>
                                <ul className="list-disc list-inside space-y-1">
                                    {event.observedSymptoms.map((symptom, i) => (
                                        <li key={i} className="text-sm text-slate-600 dark:text-slate-300">{symptom}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const VetCheatSheet: React.FC<{ report: HistoricReport, t: (key: string, options?: any) => string, language: Language }> = ({ report: sheetReport, t, language }) => {
    if (!sheetReport.sicknessIndicators) return null;

    const { sicknessIndicators, timestamp, isSummaryReport } = sheetReport;
    
    let displayDate: string;
    if (isSummaryReport) {
        displayDate = timestamp; // This is the "From ... to ..." string
    } else {
        const reportDate = new Date(timestamp);
        displayDate = reportDate.toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })
                        + ' - ' +
                        reportDate.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
    }
    
    const concernLevel = sicknessIndicators.overallConcernLevel;

    const getConcernColor = (level: string) => {
        switch(level) {
            case 'Moderate': return 'text-yellow-600 dark:text-yellow-400';
            case 'High': return 'text-orange-600 dark:text-orange-400';
            case 'Very High': return 'text-red-600 dark:text-red-400';
            default: return 'text-slate-700 dark:text-slate-200';
        }
    }
    const concernColorClass = getConcernColor(concernLevel);
    const concernTranslationKey = `concern_level_${concernLevel.toLowerCase().replace(' ', '_')}`;
   
    return (
        <div className="vet-cheat-sheet">
             <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1 text-center">{t('vet_cheat_sheet_title')}</h3>
              {concernLevel && (
                 <div className="text-center mb-3">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('concern_level_label')}: </span>
                    <span className={`font-bold ${concernColorClass}`}>{t(concernTranslationKey)}</span>
                 </div>
             )}
             <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
                <div className="text-center pb-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{isSummaryReport ? t('report_date_range') : t('report_generated_on')}</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {displayDate}
                    </p>
                </div>

                {sheetReport.userNote && (
                    <div className="pt-2">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">{t('owners_observations_title')}</h4>
                        <div className="bg-yellow-50 dark:bg-yellow-900/40 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 italic">"{sheetReport.userNote}"</p>
                        </div>
                    </div>
                )}

                <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">{t('observed_cues_title')}</h4>
                    <div className="space-y-3">
                        {sicknessIndicators.observations.map((obs, index) => {
                            const Icon = observationAreaIconMap[obs.area] || PawPrintIcon;
                            const isCritical = obs.confidence >= 75;
                            return (
                                <div key={index} className={`border-t border-gray-200 dark:border-gray-700 pt-3 transition-colors ${isCritical ? 'bg-red-50 dark:bg-red-900/20 rounded-md p-3' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <h5 className="flex items-center gap-2 font-bold text-base text-slate-700 dark:text-slate-200 mb-1">
                                            <Icon className="w-5 h-5 text-teal-500 dark:text-teal-400"/>
                                            {t(`area_${obs.area.toLowerCase()}`)}
                                        </h5>
                                        <div className="text-right">
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('confidence_label')}</div>
                                            <div className="font-bold text-teal-600 dark:text-teal-400">{obs.confidence}%</div>
                                        </div>
                                    </div>
                                    <dl className="text-sm ml-7">
                                        <dt className="font-semibold text-slate-500 dark:text-slate-400">{t('observation_label')}</dt>
                                        <dd className={`pl-2 ${isCritical ? 'text-red-800 dark:text-red-200 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{obs.observation}</dd>
                                        <dt className="font-semibold text-slate-500 dark:text-slate-400 mt-1">{t('implication_label')}</dt>
                                        <dd className={`pl-2 ${isCritical ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-300'}`}>{obs.potentialImplication}</dd>
                                    </dl>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-500 text-center">
                    <p className="font-bold">{t('vet_disclaimer_header')}</p>
                    <p>{t('vet_disclaimer_text')}</p>
                </div>
             </div>
        </div>
    );
};

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({ report, petName, petPhoto, originalFile, onClose, language, t, onVetChecklistChange, translationCache, setTranslationCache }) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [displayedReport, setDisplayedReport] = useState<HistoricReport>(report);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

    useEffect(() => {
        if (!report) return;
        let isMounted = true;

        const doTranslation = async () => {
            const cacheKey = `${report.id}-${language}`;
            if (translationCache[cacheKey]) {
                setDisplayedReport(translationCache[cacheKey]);
                return;
            }

            setIsTranslating(true);
            try {
                // We pass the original `report` prop for translation
                const translated = await translateReport(report, language);
                if (isMounted) {
                    const fullTranslatedReport = { ...report, ...translated };
                    setTranslationCache(prev => ({ ...prev, [cacheKey]: fullTranslatedReport }));
                    setDisplayedReport(fullTranslatedReport);
                }
            } catch (e) {
                console.error("Failed to translate report for modal", e);
                if (isMounted) {
                    setDisplayedReport(report); // fallback to original on error
                }
            } finally {
                if (isMounted) {
                    setIsTranslating(false);
                }
            }
        };

        doTranslation();

        return () => { isMounted = false; };
    }, [report, language, translationCache, setTranslationCache]); // Effect runs when the source `report` or `language` changes

    const petImageSrc = petPhoto || displayedReport.petSnapshot;

    const handlePrint = async () => {
        const reportElement = document.querySelector('.printable-area');
        if (!reportElement) {
            console.error('Printable area not found');
            return;
        }

        setIsGeneratingPdf(true);

        const wasDark = document.documentElement.classList.contains('dark');
        if (wasDark) document.documentElement.classList.remove('dark');
        
        await new Promise(r => setTimeout(r, 100));

        const pdfContentElement = document.createElement('div');
        pdfContentElement.style.position = 'absolute';
        pdfContentElement.style.left = '-9999px';
        pdfContentElement.style.width = '800px'; 
        pdfContentElement.style.padding = '2rem';
        pdfContentElement.style.backgroundColor = 'white';
        pdfContentElement.className = 'text-slate-700';

        const clonedContent = reportElement.cloneNode(true) as HTMLElement;
        clonedContent.querySelectorAll('.no-print').forEach(el => el.remove());
        
        // Add Vet Checklist to PDF
        if (displayedReport.vetChecklist && displayedReport.vetChecklist.length > 0) {
            const checklistContainer = document.createElement('div');
            checklistContainer.className = 'pt-2';
            let checklistHTML = `<h4 class="font-bold text-slate-700 mb-2">${t('vet_checklist_title')}</h4><div class="space-y-1 border-t border-gray-200 pt-2">`;
            
            displayedReport.vetChecklist.filter(item => item.answer !== 'n/a').forEach(item => {
                const question = t(`checklist_q_${item.key}`);
                const answer = t(`checklist_a_${item.answer}`);
                const answerColor = item.answer === 'yes' ? 'text-red-600 font-bold' : 'text-slate-600';
                
                checklistHTML += `
                    <div class="flex justify-between text-sm py-1">
                        <span class="text-slate-500">${question}</span>
                        <span class="${answerColor}">${answer}</span>
                    </div>
                `;
            });
            checklistHTML += `</div>`;
            checklistContainer.innerHTML = checklistHTML;

            const vetSheetContent = clonedContent.querySelector('.vet-cheat-sheet .bg-gray-100');
            if (vetSheetContent) {
                const observedCuesSection = Array.from(vetSheetContent.children).find(child => child.textContent?.includes(t('observed_cues_title')));
                if (observedCuesSection) {
                    vetSheetContent.insertBefore(checklistContainer, observedCuesSection);
                }
            }
        }

        if (displayedReport.breathingAnalysis) {
            const breathingContainer = document.createElement('div');
            breathingContainer.className = 'pt-4';
            let breathingHTML = `<h4 class="font-bold text-slate-700 mb-2">${t('breathing_analysis_title')}</h4><div class="space-y-1 border-t border-gray-200 pt-2">`;
            breathingHTML += `
                <div class="flex justify-between text-sm py-1">
                    <span class="text-slate-500">${t('breathing_pattern_label')}</span>
                    <span class="text-slate-700 font-bold">${displayedReport.breathingAnalysis.pattern}</span>
                </div>
            `;
            if (displayedReport.breathingAnalysis.rate) {
                breathingHTML += `
                    <div class="flex justify-between text-sm py-1">
                        <span class="text-slate-500">${t('breathing_rate_label')}</span>
                        <span class="text-slate-700 font-bold">${displayedReport.breathingAnalysis.rate} ${t('breathing_rate_unit')}</span>
                    </div>
                `;
            }
            breathingHTML += `
                <div class="text-sm py-1">
                    <span class="text-slate-500">${t('breathing_implication_label')}</span>
                    <p class="text-slate-600">${displayedReport.breathingAnalysis.implication}</p>
                </div>
            `;
            breathingHTML += `</div>`;
            breathingContainer.innerHTML = breathingHTML;

            const detailedAnalysisSection = Array.from(clonedContent.children).find(child => child.textContent?.includes(t('detailed_analysis_title')));
            if (detailedAnalysisSection) {
                clonedContent.insertBefore(breathingContainer, detailedAnalysisSection);
            } else {
                const vetSheet = clonedContent.querySelector('.vet-cheat-sheet');
                if (vetSheet) {
                    vetSheet.parentNode?.insertBefore(breathingContainer, vetSheet.nextSibling);
                } else {
                     clonedContent.appendChild(breathingContainer);
                }
            }
        }

        if (displayedReport.videoTimeline && displayedReport.videoTimeline.length > 0 && originalFile && originalFile.type.startsWith('video/')) {
            const snapshots = new Map<string, string>();
            try {
                const snapshotPromises = displayedReport.videoTimeline.map(async (event) => {
                    const timeInSeconds = parseTimestamp(event.timestamp);
                    const snapshotDataUrl = await extractFrame(originalFile, timeInSeconds);
                    snapshots.set(event.timestamp, snapshotDataUrl);
                });
                await Promise.all(snapshotPromises);
            } catch (err) {
                console.error("Failed to extract one or more video frames for the PDF.", err);
            }

            const timelineContainer = document.createElement('div');
            timelineContainer.className = 'mt-4';
            let timelineHTML = `<h4 class="font-bold text-slate-700 mb-2">${t('video_analysis_timeline_title')}</h4><div class="space-y-4">`;
            
            const reportDate = new Date(displayedReport.timestamp);
            const formattedDateTime = reportDate.toLocaleString(language, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            displayedReport.videoTimeline.forEach(event => {
                const snapshotSrc = snapshots.get(event.timestamp) || '';
                const emotionKey = event.detectedEmotion ? event.detectedEmotion.toLowerCase() : displayedReport.emotion.toLowerCase();
                const emotionText = t(`emotion_${emotionKey}`);
                const emotionColorClass = getEmotionColorClass(emotionKey);
                
                timelineHTML += `
                    <div class="border-t border-gray-200 pt-3 flex flex-col sm:flex-row gap-4" style="page-break-inside: avoid;">
                        <div class="sm:w-1/3 flex-shrink-0">
                            <p class="font-bold text-lg text-teal-600 mb-2">${t('pdf_snapshot_header', { dateTime: formattedDateTime, timestamp: event.timestamp })}</p>
                            ${snapshotSrc ? 
                                `<img src="${snapshotSrc}" alt="Snapshot at ${event.timestamp}" class="rounded-lg shadow-md w-full" />` : 
                                `<div class="w-full aspect-video bg-gray-200 flex items-center justify-center text-xs text-gray-500">Error loading snapshot</div>`
                            }
                        </div>
                        <div class="flex-grow">
                            <div class="mb-2">
                                <span class="font-semibold text-sm text-slate-500">${t('detected_emotion_label')}: </span>
                                <span class="font-bold text-base ${emotionColorClass}">${emotionText}</span>
                            </div>
                            <p class="text-sm text-slate-600 mb-2">${event.analysisSummary}</p>
                            <h5 class="font-semibold text-slate-500 text-sm mb-1">${t('symptoms_observed_title')}</h5>
                            <ul class="list-disc list-inside space-y-1">
                                ${event.observedSymptoms.map(symptom => `<li class="text-sm text-slate-600">${symptom}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            });
            timelineHTML += `</div>`;
            timelineContainer.innerHTML = timelineHTML;

            const detailedAnalysisSection = clonedContent.querySelector('#detailed-analysis-section');
            if (detailedAnalysisSection) {
                // Insert the timeline container right after the detailed analysis section
                detailedAnalysisSection.after(timelineContainer);
            } else {
                // Fallback: if the analysis section isn't found, append it before the vet sheet if it exists, or at the end.
                const vetSheet = clonedContent.querySelector('.vet-cheat-sheet');
                if (vetSheet) {
                    vetSheet.before(timelineContainer);
                } else {
                    clonedContent.appendChild(timelineContainer);
                }
            }
        }
        
        pdfContentElement.appendChild(clonedContent);
        document.body.appendChild(pdfContentElement);

        try {
            const canvas = await html2canvas(pdfContentElement, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'px', [canvas.width, canvas.height]);
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            
            const safeDate = displayedReport.isSummaryReport
                ? new Date().toLocaleDateString().replace(/[/\s]/g, '-')
                : new Date(displayedReport.timestamp).toLocaleDateString().replace(/[/\s]/g, '-');
            
            const reportType = displayedReport.isSummaryReport ? 'Combined-Report' : 'Report';
            
            pdf.save(`DrPaws-${reportType}-${displayedReport.petName}-${safeDate}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            if (wasDark) document.documentElement.classList.add('dark');
            document.body.removeChild(pdfContentElement);
            setIsGeneratingPdf(false);
        }
    };

    const handlePrepareClick = () => {
        if (displayedReport.sicknessIndicators) {
            setIsChecklistModalOpen(true);
        } else {
            handlePrint();
        }
    };

    const handleGenerateFromChecklist = async () => {
        await handlePrint();
        setIsChecklistModalOpen(false);
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl relative border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {isChecklistModalOpen && (
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
                        <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 relative border border-slate-700 animate-slide-in-up">
                            <h3 className="text-xl font-bold text-white text-center">{t('checklist_modal_title')}</h3>
                            <p className="text-sm text-slate-400 text-center mt-1 mb-4">{t('checklist_modal_desc')}</p>
                            <div className="max-h-[50vh] overflow-y-auto pr-2 -mr-2">
                                <VetChecklist
                                    initialData={displayedReport.vetChecklist || []}
                                    onChecklistChange={onVetChecklistChange}
                                    t={t}
                                />
                            </div>
                             <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button onClick={() => setIsChecklistModalOpen(false)} className="w-full rounded-md border border-slate-600 py-2 px-4 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-700">
                                    {t('cancel_button')}
                                </button>
                                <button
                                    onClick={handleGenerateFromChecklist}
                                    disabled={isGeneratingPdf}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 px-5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 disabled:bg-slate-500"
                                >
                                    {isGeneratingPdf ? <SpinnerIcon className="w-5 h-5" /> : <PrinterIcon className="w-5 h-5" />}
                                    {isGeneratingPdf ? t('generating_pdf') : t('checklist_modal_generate_button')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                 {isTranslating && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2 rounded-2xl">
                        <SpinnerIcon className="w-6 h-6 text-teal-500" />
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('translating_report')}</span>
                    </div>
                )}
                <div className="overflow-y-auto p-6 sm:p-8 printable-area">
                    <div className="text-center mb-6 flex flex-col items-center gap-4">
                        {petImageSrc && (
                            <img
                                src={petImageSrc}
                                alt={petName || 'Pet'}
                                className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-gray-200 dark:border-gray-700"
                            />
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                {displayedReport.isSummaryReport ? t('combined_report_for', { petName }) : t('full_report_title')}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                               {displayedReport.isSummaryReport 
                                    ? t('combined_report_source_count', { count: displayedReport.sourceVideoCount })
                                    : t('full_report_for', { petName })
                               }
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                       
                        {displayedReport.sicknessIndicators ? (
                           <VetCheatSheet report={displayedReport} t={t} language={language} />
                        ) : (
                             <StressSpectrum emotionScores={displayedReport.emotionScores} t={(key) => t(key)} dominantEmotion={displayedReport.emotion} />
                        )}

                        {displayedReport.breathingAnalysis && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <HeartbeatIcon className="w-5 h-5" />
                                    {t('breathing_analysis_title')}
                                </h3>
                                <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('breathing_pattern_label')}</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{displayedReport.breathingAnalysis.pattern}</span>
                                    </div>
                                    {displayedReport.breathingAnalysis.rate && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('breathing_rate_label')}</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{displayedReport.breathingAnalysis.rate} {t('breathing_rate_unit')}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('breathing_implication_label')}</span>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{displayedReport.breathingAnalysis.implication}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div id="detailed-analysis-section">
                            <h3 className={`text-lg font-semibold mb-2 ${displayedReport.sicknessIndicators ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>{t('detailed_analysis_title')}</h3>
                            <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{displayedReport.detailedAnalysis}</p>
                            </div>
                        </div>

                        {displayedReport.videoTimeline && originalFile && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">
                                    {t('video_analysis_timeline_title')}
                                </h3>
                                <VideoTimelineDisplay timeline={displayedReport.videoTimeline} videoFile={originalFile} language={language} t={t} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center no-print">
                    <div className="flex-1">
                        {displayedReport.videoTimeline && displayedReport.videoTimeline.length > 0 && !originalFile && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t('pdf_snapshots_unavailable_note')}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-6 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            {t('close_button')}
                        </button>
                        <button
                            onClick={handlePrepareClick}
                            disabled={isGeneratingPdf}
                            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-lg bg-slate-600 py-2.5 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors disabled:opacity-50"
                        >
                            {isGeneratingPdf ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <PrinterIcon className="w-5 h-5" />}
                            {isGeneratingPdf ? t('generating_pdf') : t('print_save_pdf_button')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
