
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PetProfile, LiveTranscriptMessage, HistoricReport } from '../types';
import { createLiveSession } from '../services/geminiService';
import { LiveServerMessage, LiveSession } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';
import { SoundWaveIcon, StopCircleIcon, DrPawsChatIcon, UserCircleIcon, XIcon, SpinnerIcon } from './icons';

interface VoiceChatModalProps {
    pet: PetProfile;
    report: HistoricReport;
    onClose: () => void;
    t: (key: string, options?: any) => string;
    language: string;
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({ pet, report, onClose, t, language }) => {
    const [transcript, setTranscript] = useState<LiveTranscriptMessage[]>([]);
    const [status, setStatus] = useState<'connecting' | 'live' | 'error' | 'stopped'>('connecting');
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    
    const audioQueue = useRef<string[]>([]).current;
    const isPlaying = useRef(false);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const stopChat = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        
        sessionPromiseRef.current = null;
        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;

        setStatus('stopped');
    }, []);
    
    const playAudioQueue = useCallback(async () => {
        if (isPlaying.current || audioQueue.length === 0 || !outputAudioContextRef.current) {
            return;
        }
    
        isPlaying.current = true;
        const base64Audio = audioQueue.shift();
    
        if (base64Audio) {
            try {
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    outputAudioContextRef.current,
                    24000, // Gemini TTS sample rate
                    1
                );
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);
                source.onended = () => {
                    isPlaying.current = false;
                    playAudioQueue(); // Play next item in queue
                };
                source.start();
            } catch (error) {
                console.error('Error playing audio:', error);
                isPlaying.current = false;
                playAudioQueue(); // Try next item even if current one fails
            }
        } else {
            isPlaying.current = false;
        }
    }, [audioQueue, isPlaying]);

    useEffect(() => {
        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        const onMessage = (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                currentOutputTranscription += text;
            } else if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputTranscription += text;
            }

            if (message.serverContent?.turnComplete) {
                const finalInput = currentInputTranscription;
                const finalOutput = currentOutputTranscription;

                setTranscript(prev => {
                    let newTranscript = [...prev];
                    if (finalInput) newTranscript.push({ speaker: 'user', text: finalInput });
                    if (finalOutput) newTranscript.push({ speaker: 'model', text: finalOutput });
                    return newTranscript;
                });
                
                currentInputTranscription = '';
                currentOutputTranscription = '';
            }

            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64EncodedAudioString) {
                audioQueue.push(base64EncodedAudioString);
                if (!isPlaying.current) {
                    playAudioQueue();
                }
            }
        };

        const onError = (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setStatus('error');
            stopChat();
        };

        const setupAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;

                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                mediaStreamSourceRef.current = source;

                const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = scriptProcessor;

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    
                    sessionPromiseRef.current?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContextRef.current.destination);
                return true;

            } catch (err) {
                console.error('Microphone access denied:', err);
                setStatus('error');
                return false;
            }
        };

        const startSession = async () => {
            if (await setupAudio()) {
                const reportJson = JSON.stringify(report);
                const genderText = pet.gender && pet.gender !== 'unknown' ? pet.gender : '';
                const systemInstruction = t('voice_chat_system_prompt', { petName: pet.name, gender: genderText, petType: pet.petType, reportJson });
                
                sessionPromiseRef.current = createLiveSession({ onMessage, onError, onClose: stopChat }, systemInstruction);
                sessionPromiseRef.current
                    .then(() => setStatus('live'))
                    .catch(err => {
                        console.error("Failed to connect live session:", err);
                        setStatus('error');
                    });
            }
        };

        startSession();

        return () => stopChat();
    }, [pet, report, stopChat, t, playAudioQueue, audioQueue]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const statusInfo = {
        connecting: { text: t('voice_chat_status_connecting'), color: 'text-yellow-400' },
        live: { text: t('voice_chat_status_live'), color: 'text-green-400' },
        error: { text: t('voice_chat_status_error'), color: 'text-red-400' },
        stopped: { text: t('voice_chat_status_stopped'), color: 'text-slate-400' },
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-slate-800 w-full max-w-2xl h-[90vh] max-h-[700px] rounded-2xl shadow-2xl flex flex-col border border-slate-700">
                <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SoundWaveIcon className="w-6 h-6 text-teal-400" />
                        <h2 className="text-xl font-bold text-white">{t('voice_chat_title')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex-grow p-6 overflow-y-auto space-y-4">
                    {transcript.map((msg, i) => (
                        <div key={i} className={`flex items-start gap-3 ${msg.speaker === 'user' ? 'justify-end' : ''}`}>
                            {msg.speaker === 'model' && <DrPawsChatIcon className="w-8 h-8 text-teal-400 flex-shrink-0" />}
                            <div className={`max-w-md p-3 rounded-lg text-sm ${msg.speaker === 'model' ? 'bg-slate-700' : 'bg-teal-600'}`}>
                                {msg.text}
                            </div>
                             {msg.speaker === 'user' && <UserCircleIcon className="w-8 h-8 text-slate-400 flex-shrink-0" />}
                        </div>
                    ))}
                    {transcript.length === 0 && status === 'live' && (
                         <div className="text-center text-slate-400 pt-16">
                            <p>{t('voice_chat_waiting')}</p>
                         </div>
                    )}
                     {status === 'connecting' && <div className="text-center pt-16"><SpinnerIcon className="w-8 h-8 mx-auto text-slate-400" /></div>}
                     {status === 'error' && (
                         <div className="text-center text-red-400 pt-16">
                            <p>{t('voice_chat_mic_error')}</p>
                         </div>
                    )}
                    <div ref={transcriptEndRef} />
                </div>
                
                <footer className="p-4 border-t border-slate-700 flex-shrink-0 space-y-3">
                    <div className="flex items-center justify-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusInfo[status].color} ${status === 'live' ? 'animate-pulse' : ''}`}></div>
                        <span className={`text-sm font-semibold ${statusInfo[status].color}`}>{statusInfo[status].text}</span>
                    </div>
                    <button 
                        onClick={() => { stopChat(); onClose(); }}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        <StopCircleIcon className="w-5 h-5" />
                        {t('voice_chat_stop_button')}
                    </button>
                </footer>
            </div>
        </div>
    );
};
