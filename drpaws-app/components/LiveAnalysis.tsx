
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PetProfile, LiveTranscriptMessage } from '../types';
import { createLiveSession } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { encode, createBlob } from '../services/audioUtils';
import { SoundWaveIcon, StopCircleIcon, DrPawsChatIcon, UserCircleIcon, XIcon } from './icons';

interface LiveAnalysisProps {
    pet: PetProfile;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}

export const LiveAnalysis: React.FC<LiveAnalysisProps> = ({ pet, onClose, t }) => {
    const [transcript, setTranscript] = useState<LiveTranscriptMessage[]>([]);
    const [status, setStatus] = useState<'connecting' | 'live' | 'error' | 'stopped'>('connecting');
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const stopAnalysis = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        setStatus('stopped');
    }, []);
    
    useEffect(() => {
        let currentInputTranscription = '';

        const onMessage = (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputTranscription += text;
            }

            if (message.serverContent?.turnComplete) {
                const finalInput = currentInputTranscription;
                if(finalInput) {
                    setTranscript(prev => [...prev, { speaker: 'user', text: finalInput }]);
                }
                currentInputTranscription = '';
            }
        };

        const onError = (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setStatus('error');
            stopAnalysis();
        };

        const setupAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;

                const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                audioContextRef.current = context;
                
                const source = context.createMediaStreamSource(stream);
                mediaStreamSourceRef.current = source;

                const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = scriptProcessor;

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    
                    if(sessionPromiseRef.current) {
                        sessionPromiseRef.current.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    }
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(context.destination);
                return true;

            } catch (err) {
                console.error('Microphone access denied:', err);
                setStatus('error');
                return false;
            }
        };

        const startSession = async () => {
            const audioReady = await setupAudio();
            if (!audioReady) return;
            
            const systemInstruction = t('live_analysis_system_prompt', { petName: pet.name });

            sessionPromiseRef.current = createLiveSession({ onMessage, onError, onClose: stopAnalysis }, systemInstruction);
            sessionPromiseRef.current.then(() => {
                setStatus('live');
            }).catch(err => {
                console.error("Failed to connect live session:", err);
                setStatus('error');
            });
        };

        startSession();

        return () => {
            stopAnalysis();
        };
    }, [pet, stopAnalysis, t]);

    const statusInfo = {
        connecting: { text: t('live_status_connecting'), color: 'text-yellow-400' },
        live: { text: t('live_status_live'), color: 'text-green-400' },
        error: { text: t('live_status_error'), color: 'text-red-400' },
        stopped: { text: t('live_status_stopped'), color: 'text-slate-400' },
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-slate-800 w-full max-w-2xl h-[90vh] max-h-[700px] rounded-2xl shadow-2xl flex flex-col border border-slate-700">
                <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SoundWaveIcon className="w-6 h-6 text-teal-400" />
                        <h2 className="text-xl font-bold text-white">{t('live_analysis_title')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex-grow p-6 overflow-y-auto space-y-4">
                    {transcript.map((msg, i) => (
                        <div key={i} className={`flex items-start gap-3 justify-center`}>
                            <DrPawsChatIcon className="w-8 h-8 text-teal-400 flex-shrink-0" />
                            <div className={`max-w-md p-3 rounded-lg text-sm bg-slate-700`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {transcript.length === 0 && status !== 'error' && (
                         <div className="text-center text-slate-400 pt-16">
                            <p>{t('live_analysis_waiting')}</p>
                         </div>
                    )}
                     {status === 'error' && (
                         <div className="text-center text-red-400 pt-16">
                            <p>{t('live_analysis_mic_error')}</p>
                         </div>
                    )}
                </div>
                
                <footer className="p-4 border-t border-slate-700 flex-shrink-0 space-y-3">
                    <div className="flex items-center justify-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusInfo[status].color} ${status === 'live' ? 'animate-pulse' : ''}`}></div>
                        <span className={`text-sm font-semibold ${statusInfo[status].color}`}>{statusInfo[status].text}</span>
                    </div>
                    <button 
                        onClick={stopAnalysis} 
                        disabled={status !== 'live'}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <StopCircleIcon className="w-5 h-5" />
                        {t('live_analysis_stop_button')}
                    </button>
                </footer>
            </div>
        </div>
    );
};
