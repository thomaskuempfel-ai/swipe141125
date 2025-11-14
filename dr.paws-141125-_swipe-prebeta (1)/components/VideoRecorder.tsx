import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpinnerIcon, VideoIcon, XIcon } from './icons';

interface VideoRecorderProps {
    onClose: () => void;
    onRecordingComplete: (file: File) => void;
    t: (key: string, options?: any) => string;
}

const RECORDING_DURATION = 20; // in seconds

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onClose, onRecordingComplete, t }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);

    const [status, setStatus] = useState<'initializing' | 'ready' | 'recording' | 'processing' | 'error'>('initializing');
    const [countdown, setCountdown] = useState(RECORDING_DURATION);

    const cleanupStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        const setupCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setStatus('ready');
            } catch (err) {
                console.error("Error accessing camera:", err);
                setStatus('error');
            }
        };

        setupCamera();

        return () => {
            cleanupStream();
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, [cleanupStream]);

    const startRecording = useCallback(() => {
        if (status !== 'ready' || !streamRef.current) return;

        setStatus('recording');
        setCountdown(RECORDING_DURATION);
        recordedChunksRef.current = [];

        const options = { mimeType: 'video/webm' };
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = () => {
            setStatus('processing');
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const fileName = `dr-paws-capture-${new Date().toISOString()}.webm`;
            const videoFile = new File([blob], fileName, { type: 'video/webm' });
            onRecordingComplete(videoFile);
        };

        mediaRecorderRef.current.start();

        countdownIntervalRef.current = window.setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        }, RECORDING_DURATION * 1000);

    }, [status, onRecordingComplete]);

    useEffect(() => {
        if(status === 'ready') {
            startRecording();
        }
    }, [status, startRecording]);

    const progress = ((RECORDING_DURATION - countdown) / RECORDING_DURATION) * 100;
    const circumference = 2 * Math.PI * 54; // r=54
    const offset = circumference - (progress / 100) * circumference;

    const renderStatus = () => {
        switch (status) {
            case 'initializing':
                return <div className="flex flex-col items-center gap-2"><SpinnerIcon className="w-8 h-8" /><span>{t('video_recorder_starting_camera')}</span></div>;
            case 'error':
                return <div className="text-red-400 text-center">{t('video_recorder_error')}</div>;
            case 'recording':
                return <h2 className="text-2xl font-bold">{t('video_recorder_recording_in')} {countdown}s</h2>
            case 'processing':
                return <div className="flex flex-col items-center gap-2"><SpinnerIcon className="w-8 h-8" /><span>{t('video_recorder_processing')}</span></div>;
             case 'ready':
                return <h2 className="text-2xl font-bold">{t('video_recorder_getting_ready')}</h2>
            default:
                return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4 animate-fade-in-fast text-white">
            <div className="absolute top-4 right-4">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">{t('video_recorder_title')}</h1>
            </div>

            <div className="relative w-full max-w-2xl aspect-video rounded-lg overflow-hidden shadow-2xl bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                <div className="absolute inset-0 flex items-center justify-center">
                    {status === 'recording' && (
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    stroke="currentColor"
                                    className="text-teal-400"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    style={{ transition: 'stroke-dashoffset 1s linear'}}
                                />
                            </svg>
                            <span className="absolute text-4xl font-mono font-bold">{countdown}</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-8 h-10 text-center">
                {renderStatus()}
            </div>

        </div>
    );
};