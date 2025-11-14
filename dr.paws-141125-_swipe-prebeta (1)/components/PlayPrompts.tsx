
import React from 'react';
import { PlayPrompt } from '../types';
import { GameControllerIcon, SearchIcon } from './icons';

interface PlayPromptsProps {
    prompts: PlayPrompt[];
    petName: string;
    t: (key: string, options?: any) => string;
}

const iconMap: Record<PlayPrompt['type'], React.ElementType> = {
    physical: SearchIcon,
    digital: GameControllerIcon,
};

export const PlayPrompts: React.FC<PlayPromptsProps> = ({ prompts, petName, t }) => {
    
    const handleLaunchGame = () => {
        alert(t('ar_game_coming_soon'));
    };
    
    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg animate-fade-in">
            <h2 className="text-xl font-bold text-teal-400 mb-4 text-center">{t('play_prompts_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prompts.map((prompt, index) => {
                    const Icon = iconMap[prompt.type];
                    return (
                        <div key={index} className="bg-slate-900/50 p-4 rounded-lg flex flex-col">
                            <div className="flex items-center gap-3 mb-2">
                                <Icon className="w-6 h-6 text-teal-400 flex-shrink-0" />
                                <h3 className="font-bold text-slate-200">{prompt.title}</h3>
                            </div>
                            <p className="text-sm text-slate-400 flex-grow">{prompt.description}</p>
                            {prompt.type === 'digital' && (
                                <button
                                    onClick={handleLaunchGame}
                                    className="mt-4 w-full flex justify-center items-center gap-2 rounded-md bg-teal-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all"
                                >
                                    <GameControllerIcon className="w-4 h-4" />
                                    {t('launch_game_button')}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};