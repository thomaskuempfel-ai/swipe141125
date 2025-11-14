import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PetProfile, Language, HistoricReport, AudioCheckinResult } from '../types';
import { FileUpload } from './FileUpload';
import { VideoRecorder } from './VideoRecorder';
import { getAnalysisReport, getAudioOnlyAnalysis, optimizeImage } from '../services/geminiService';
import { extractFrame, parseTimestamp, getTimestampFromVideoFile } from '../services/videoUtils';
import { XIcon, MicrophoneIcon, StopCircleIcon, VideoIcon, PawPrintIcon, SoundWaveIcon, HandIcon, PlayIcon, HeartIcon, FoodIcon, BedIcon, HealthIcon, WaterIcon, CheckCircleIcon } from './icons';
import { LoadingIndicator } from './LoadingIndicator';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const loadingMessages = [
  "Analyzing tail wags and ear flicks...",
  "Listening for the tiniest meows...",
  "Decoding chirps and feather ruffles...",
  "Calibrating the empathy matrix...",
  "Consulting with veterinary behaviorists...",
  "Translating barks into insights...",
];

interface AnalysisFlowModalProps {
    pet: PetProfile;
    onClose: () => void;
    onAnalysisComplete: (report: HistoricReport, sourceFile: File) => void;
    language: Language;
    t: (key: string, options?: any) => string;
}

export const AnalysisFlowModal: React.FC<AnalysisFlowModalProps> = ({ pet, onClose, onAnalysisComplete, language, t }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [userNote, setUserNote] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(t('loading_dr_paws_ready'));
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    
    const [audioCheckinResult, setAudioCheckinResult] = useState<AudioCheckinResult | null>(null);
    const [isAudioCheckinLoading, setIsAudioCheckinLoading] = useState(false);
    const audioInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        let interval: number;
        if (isAnalysisLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
            }, 3500);
        }
        return () => clearInterval(interval);
    }, [isAnalysisLoading]);
    
    useEffect(() => {
        if(recognition) {
            recognition.lang = language;
        }
    }, [language]);


    const handleAnalyze = useCallback(async () => {
        if (files.length === 0 || !pet) {
          setError(t('error_select_pet_and_file'));
          return;
        }
        setIsAnalysisLoading(true);
        setError(null);
    
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setLoadingMessage(t('analysis_progress', { current: i + 1, total: files.length, fileName: file.name }));

            try {
              const reportData = await getAnalysisReport(file, pet, userNote);
              
              let petSnapshotDataUrl: string | undefined = undefined;
              if (reportData.representativeTimestamp && file.type.startsWith('video/')) {
                try {
                    const time = parseTimestamp(reportData.representativeTimestamp);
                    const extractedFrame = await extractFrame(file, time);
                    try {
                        // New: Optimize the frame
                        petSnapshotDataUrl = await optimizeImage(extractedFrame);
                    } catch (e) {
                        console.error("Failed to optimize representative frame, using original.", e);
                        petSnapshotDataUrl = extractedFrame;
                    }
                } catch (e) {
                    console.error("Failed to extract representative frame:", e);
                }
              }

              let emotionSnapshots: string[] = [];
              if (reportData.videoTimeline && file.type.startsWith('video/')) {
                  const dominantEmotion = reportData.emotion;
                  const matchingEvents = reportData.videoTimeline.filter(event => event.detectedEmotion === dominantEmotion);
                  const otherEvents = reportData.videoTimeline.filter(event => event.detectedEmotion !== dominantEmotion);
                  
                  const eventsForSnapshots = [...matchingEvents, ...otherEvents].slice(0, 3);
                  
                  if (eventsForSnapshots.length > 0) {
                      try {
                          const snapshotPromises = eventsForSnapshots.map(async event => {
                              const time = parseTimestamp(event.timestamp);
                              const extractedFrame = await extractFrame(file, time);
                              try {
                                  // New: Optimize each snapshot
                                  return await optimizeImage(extractedFrame);
                              } catch (e) {
                                  console.error(`Failed to optimize emotion snapshot for ${event.timestamp}, using original.`, e);
                                  return extractedFrame;
                              }
                          });
                          emotionSnapshots = await Promise.all(snapshotPromises);
                      } catch (e) {
                          console.error("Failed to extract emotion snapshots:", e);
                      }
                  }
              }
        
              const timestamp = getTimestampFromVideoFile(file);
              const newHistoricReport: HistoricReport = {
                ...reportData,
                id: crypto.randomUUID(),
                petId: pet.id,
                petName: pet.name,
                timestamp: timestamp,
                userNote: userNote,
                petSnapshot: petSnapshotDataUrl,
                emotionSnapshots: emotionSnapshots.length > 0 ? emotionSnapshots : undefined,
                sourceVideoCount: 1,
                vetChecklist: [],
              };
              
              onAnalysisComplete(newHistoricReport, file);
        
            } catch (err) {
              console.error(err);
              const errorMessage = err instanceof Error ? err.message : t('error_unknown');
              setError(`Error on file ${i + 1}: ${errorMessage}`);
              setIsAnalysisLoading(false); // Stop loading on error
              return; // Exit the process
            }
        }
        
        onClose(); // Close modal after all analyses are complete

    }, [files, pet, userNote, onAnalysisComplete, t, onClose]);

    const handleVoiceInput = useCallback(() => {
      if (!recognition) {
          setError("Voice recognition is not supported in your browser.");
          return;
      }
      if (isRecording) {
          recognition.stop();
          return;
      }
      recognition.onresult = (event: any) => setUserNote(prev => prev ? `${prev.trim()} ${event.results[event.resultIndex][0].transcript}` : event.results[event.resultIndex][0].transcript);
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event: any) => { setError(`Speech recognition error: ${event.error}`); setIsRecording(false); };
      recognition.start();
    }, [isRecording]);

    const handleRecordingComplete = (videoFile: File) => {
        setIsRecordingVideo(false);
        setFiles([videoFile]);
    };

    const handleAudioFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAudioCheckinLoading(true);
        setError(null);
        setAudioCheckinResult(null);

        try {
            const result = await getAudioOnlyAnalysis(file, pet, language);
            setAudioCheckinResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('error_unknown'));
        } finally {
            setIsAudioCheckinLoading(false);
            if(event.target) {
                event.target.value = '';
            }
        }
    };
    
    if (isRecordingVideo) {
        return (
            <VideoRecorder 
                onClose={() => { setIsRecordingVideo(false); onClose(); }}
                onRecordingComplete={handleRecordingComplete}
                t={t}
            />
        );
    }

    const renderAudioCheckinResult = () => {
        if (!audioCheckinResult) return null;

        const { vocalizationType, primaryNeed, explanation, actionableTip } = audioCheckinResult;
        const needDetails = {
            Attention: { Icon: HandIcon, color: 'text-yellow-400' },
            Play: { Icon: PlayIcon, color: 'text-lime-400' },
            Comfort: { Icon: HeartIcon, color: 'text-pink-400' },
            Food: { Icon: FoodIcon, color: 'text-orange-400' },
            Rest: { Icon: BedIcon, color: 'text-blue-400' },
            Health: { Icon: HealthIcon, color: 'text-red-400' },
            Water: { Icon: WaterIcon, color: 'text-cyan-400' },
            None: { Icon: CheckCircleIcon, color: 'text-green-400' },
        };
        const { Icon, color } = needDetails[primaryNeed] || needDetails['None'];
        const needKey = `need_${primaryNeed.toLowerCase()}`;
        
        return (
            <div className="p-8 space-y-6 text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('audio_checkin_title')}</h2>
                <div className={`mx-auto w-24 h-24 rounded-full bg-slate-700/50 flex items-center justify-center border-4 ${color.replace('text-', 'border-')}`}>
                    <Icon className={`w-12 h-12 ${color}`} />
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-slate-400">{t('audio_checkin_heard')}</p>
                    <p className="text-lg font-semibold text-slate-200">{vocalizationType}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-slate-400">{t('audio_checkin_primary_need')}</p>
                    <p className={`text-2xl font-bold ${color}`}>{t(needKey)}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg text-left">
                     <p className="text-sm font-semibold text-slate-300 mb-1">{t('audio_checkin_explanation')}</p>
                     <p className="text-sm italic text-slate-400">"{explanation}"</p>
                </div>
                <div className="bg-teal-900/30 p-4 rounded-lg text-left">
                     <p className="text-sm font-semibold text-teal-300 mb-1">{t('audio_checkin_tip')}</p>
                     <p className="text-sm text-slate-300">{actionableTip}</p>
                </div>
                <div className="flex gap-4 pt-4">
                     <button onClick={() => setAudioCheckinResult(null)} className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                        {t('audio_checkin_analyze_another')}
                    </button>
                     <button onClick={onClose} className="flex-1 rounded-md border border-transparent bg-teal-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-700">
                        {t('audio_checkin_done')}
                    </button>
                </div>
            </div>
        );
    };


    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl relative border border-gray-200 dark:border-gray-700">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                
                {isAnalysisLoading || isAudioCheckinLoading ? (
                    <LoadingIndicator message={loadingMessage} t={t} />
                ) : audioCheckinResult ? (
                    renderAudioCheckinResult()
                ) : (
                    <div className="p-8 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center">{t('analysis_flow_title', { petName: pet.name })}</h2>

                        {error && (
                            <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">
                                {error}
                            </div>
                        )}
                        
                        <FileUpload files={files} setFiles={setFiles} setError={setError} t={t} />

                        <div className="relative flex items-center">
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                            <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 text-sm">{t('or')}</span>
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsRecordingVideo(true)}
                                className="w-full flex justify-center items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 font-semibold text-slate-800 dark:text-slate-100 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                <VideoIcon className="w-5 h-5 text-teal-500" />
                                {t('live_capture_button')}
                            </button>
                             <button
                                onClick={() => audioInputRef.current?.click()}
                                className="w-full flex justify-center items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 font-semibold text-slate-800 dark:text-slate-100 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                <SoundWaveIcon className="w-5 h-5 text-teal-500" />
                                {t('quick_audio_check_button')}
                            </button>
                             <input type="file" ref={audioInputRef} onChange={handleAudioFileSelect} className="sr-only" accept="audio/*" />
                        </div>
                        
                        <div>
                          <label htmlFor="user-note" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('optional_note_label')}</label>
                          <div className="relative">
                            <textarea
                              id="user-note"
                              rows={3}
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-slate-800 dark:text-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm pr-12"
                              placeholder={t('note_placeholder', { petName: pet.name })}
                              value={userNote}
                              onChange={(e) => setUserNote(e.target.value)}
                              disabled={isRecording}
                            />
                            {recognition && (
                              <button onClick={handleVoiceInput} className={`absolute right-2 top-2 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-600 text-slate-500 dark:text-slate-300 hover:bg-teal-700'}`}>
                                {isRecording ? <StopCircleIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleAnalyze}
                          disabled={files.length === 0}
                          className="w-full flex justify-center items-center gap-2 rounded-md border border-transparent bg-teal-600 py-3 px-4 text-base font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-slate-500 disabled:cursor-not-allowed"
                        >
                          <PawPrintIcon className="w-5 h-5" />
                          {t('ask_dr_paws_button')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};