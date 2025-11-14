import React from 'react';
import { XIcon, ClapperboardIcon } from './icons';
import { HistoricReport, Language } from '../types';

interface MemoryVideoGeneratorModalProps {
    reports: HistoricReport[];
    emotion: string;
    onClose: () => void;
    t: (key: string, options?: any) => string;
    language: Language;
}

export const MemoryVideoGeneratorModal: React.FC<MemoryVideoGeneratorModalProps> = ({ reports, emotion, onClose, t, language }) => {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative border border-gray-700">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="text-center p-8">
                    <ClapperboardIcon className="w-16 h-16 text-slate-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-slate-100 mt-4">Video Generation Disabled</h3>
                    <p className="text-slate-400 mt-2">To improve app performance, this feature is currently unavailable.</p>
                </div>
            </div>
        </div>
    );
};