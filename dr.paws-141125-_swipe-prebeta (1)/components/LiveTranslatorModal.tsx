
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PetProfile } from '../types';
import { createLiveSession } from '../services/geminiService';
import { LiveServerMessage, LiveSession, FunctionDeclaration, Type } from '@google/genai';
import { createBlob } from '../services/audioUtils';
import { XIcon, PawPrintIcon, SpinnerIcon, HeartIcon, MoonIcon, AlertTriangleIcon, PlayIcon, FoodIcon, HeartbeatIcon, SparklesIcon, EyeIcon, SearchIcon, ShuffleIcon, GameControllerIcon } from './icons';

interface LiveTranslatorModalProps {
    pet: PetProfile;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}

const emotionMap: { [key: string]: { Icon: React.ElementType, color: string } } = {
    'calm': { Icon: MoonIcon, color: 'text-teal-400' },
    'anxious': { Icon: AlertTriangleIcon, color: 'text-red-400' },
    'playful': { Icon: PlayIcon, color: 'text-yellow-400' },
    'hungry': { Icon: FoodIcon, color: 'text-orange-400' },
    'pain': { Icon: HeartbeatIcon, color: 'text-red-500' },
    'grumpy': { Icon: PawPrintIcon, color: 'text-slate-400' },
};

const attitudeMap: { [key: string]: { Icon: React.ElementType, color: string } } = {
    'sassy': { Icon: SparklesIcon, color: 'text-purple-400' },
    'cuddly': { Icon: HeartIcon, color: 'text-pink-400' },
    'goofy': { Icon: ShuffleIcon, color: 'text-lime-400' },
    'reserved': { Icon: EyeIcon, color: 'text-slate-400' },
    'curious': { Icon: SearchIcon, color: 'text-blue-400' },
    'mischievous': { Icon: GameControllerIcon, color: 'text-indigo-400' },
};

const StatusDisplay: React.FC<{ label: string, value: string | null, map: typeof emotionMap, type: 'emotion' | 'attitude', t: (key: string) => string }> = ({ label, value, map, type, t }) => {
    if (!value) return null;
    const details = map[value.toLowerCase()];
    if (!details) return null;

    const { Icon, color } = details;
    const isGrumpy = value.toLowerCase() === 'grumpy';
    const translationKey = `${type}_${value.toLowerCase()}`;
    const translatedValue = t(translationKey);

    return (
        <div className="bg-slate-900/50 p-3 rounded-lg flex-1 text-center animate-fade-in-fast">
            <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{label}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
                <Icon className={`w-6 h-6 ${color} ${isGrumpy ? 'transform rotate-12' : ''}`} />
                <p className={`text-lg font-bold ${color}`}>{translatedValue === translationKey ? value : translatedValue}</p>
            </div>
        </div>
    );
};

const displayTranslationFunction: FunctionDeclaration = {
  name: 'displayTranslation',
  description: 'Displays the translated text from the pet on the user\'s screen.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      translation_text: {
        type: Type.STRING,
        description: 'The short, first-person translation of the pet\'s vocalization. E.g., "I\'m hungry!", "Let\'s play!"',
      },
    },
    required: ['translation_text'],
  },
};

const updateEmotionFunction: FunctionDeclaration = {
  name: 'updateEmotion',
  description: 'Updates the pet\'s detected primary emotion and current attitude on the screen.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      emotion: {
        type: Type.STRING,
        description: 'The single, most dominant emotion detected. Must be one of: Calm, Anxious, Playful, Hungry, Pain, Grumpy.',
      },
      attitude: {
        type: Type.STRING,
        description: 'A single, expressive word for the pet\'s demeanor. E.g., Sassy, Cuddly, Goofy, Reserved, Curious, Mischievous.',
      },
    },
    required: ['emotion', 'attitude'],
  },
};


export const LiveTranslatorModal: React.FC<LiveTranslatorModalProps> = ({ pet, onClose, t }) => {
    const [status, setStatus] = useState<'connecting' | 'live' | 'error' | 'stopped'>('connecting');
    const [translation, setTranslation] = useState<string>('');
    const [isDetectingSound, setIsDetectingSound] = useState(false);
    const [emotion, setEmotion] = useState<string | null>(null);
    const [attitude, setAttitude] = useState<string | null>(null);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const soundDetectionTimeoutRef = useRef<number | null>(null);
    const fullTranscriptRef = useRef('');
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const stop = useCallback(() => {
        if (soundDetectionTimeoutRef.current) {
            clearTimeout(soundDetectionTimeoutRef.current);
        }
        sessionPromiseRef.current?.then(session => session.close());
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        audioContextRef.current?.close().catch(console.error);
        
        sessionPromiseRef.current = null;
        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        audioContextRef.current = null;

        setStatus('stopped');
    }, []);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [translation]);

    useEffect(() => {
        const onMessage = (message: LiveServerMessage) => {
            if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                    if (fc.name === 'displayTranslation' && fc.args.translation_text) {
                        fullTranscriptRef.current += fc.args.translation_text + '\n';
                        setTranslation(fullTranscriptRef.current);
                    } else if (fc.name === 'updateEmotion' && fc.args.emotion && fc.args.attitude) {
                        setEmotion(fc.args.emotion as string);
                        setAttitude(fc.args.attitude as string);
                    }
                }
            }
        };

        const onError = (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setStatus('error');
            stop();
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

                scriptProcessor.onaudioprocess = (audioEvent) => {
                    const inputData = audioEvent.inputBuffer.getChannelData(0);
                    
                    let max = 0;
                    for (let i = 0; i < inputData.length; i++) {
                        if (Math.abs(inputData[i]) > max) {
                            max = Math.abs(inputData[i]);
                        }
                    }
                    if (max > 0.1) { // Sound detection threshold
                        setIsDetectingSound(true);
                        if (soundDetectionTimeoutRef.current) {
                            clearTimeout(soundDetectionTimeoutRef.current);
                        }
                        soundDetectionTimeoutRef.current = window.setTimeout(() => {
                            setIsDetectingSound(false);
                        }, 300);
                    }
                    
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
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
            if (await setupAudio()) {
                const systemInstruction = t('live_translate_system_prompt', { petName: pet.name, petType: pet.petType });
                const tools = [{ functionDeclarations: [displayTranslationFunction, updateEmotionFunction] }];
                sessionPromiseRef.current = createLiveSession({ onMessage, onError, onClose: stop }, systemInstruction, tools);
                sessionPromiseRef.current
                    .then(() => setStatus('live'))
                    .catch(err => {
                        console.error("Failed to connect live session:", err);
                        setStatus('error');
                    });
            }
        };

        startSession();

        return () => stop();
    }, [pet, stop, t]);

    const statusInfo = {
        connecting: { text: t('live_translate_status_connecting'), color: 'text-yellow-400' },
        live: { text: t('live_translate_status_live'), color: 'text-green-400' },
        error: { text: t('live_translate_status_error'), color: 'text-red-400' },
        stopped: { text: t('live_translate_status_stopped'), color: 'text-slate-400' },
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-slate-800 w-full max-w-2xl h-[90vh] max-h-[700px] rounded-2xl shadow-2xl flex flex-col border border-slate-700">
                <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">{t('live_translate_title', { petName: pet.name })}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2.5 h-2.5 rounded-full bg-current ${statusInfo[status].color} ${status === 'live' ? 'animate-pulse' : ''}`}></div>
                            <span className={`text-sm font-semibold ${statusInfo[status].color}`}>{statusInfo[status].text}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex-grow p-6 flex flex-col items-center justify-center overflow-hidden">
                    <div className="w-full flex gap-4 mb-8">
                        <StatusDisplay label={t('live_translate_emotion')} value={emotion} map={emotionMap} type="emotion" t={t} />
                        <StatusDisplay label={t('live_translate_attitude')} value={attitude} map={attitudeMap} type="attitude" t={t} />
                    </div>

                    <div className={`relative w-48 h-48 flex items-center justify-center rounded-full bg-slate-700/50 transition-all duration-200 ${isDetectingSound ? 'scale-105 shadow-2xl shadow-teal-500/30' : ''}`}>
                        <PawPrintIcon className={`w-24 h-24 text-teal-400 transition-colors duration-200 ${isDetectingSound ? 'text-teal-300' : 'text-teal-500'}`} />
                    </div>
                    
                    <div className="w-full mt-8 h-32 overflow-y-auto text-center">
                        {status === 'live' && !translation && (
                            <p className="text-slate-400 italic">{t('live_translate_listening', { petName: pet.name })}</p>
                        )}
                        {status === 'connecting' && <SpinnerIcon className="mx-auto w-8 h-8 text-slate-400" />}
                        {status === 'error' && <p className="text-red-400">{t('live_translate_mic_error')}</p>}

                        <p className="text-lg text-slate-200 whitespace-pre-wrap">{translation}</p>
                        <div ref={transcriptEndRef} />
                    </div>
                </div>
                
                <footer className="p-4 border-t border-slate-700 flex-shrink-0">
                    <button 
                        onClick={() => { stop(); onClose(); }}
                        className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        {t('live_translate_stop')}
                    </button>
                </footer>
            </div>
        </div>
    );
};
