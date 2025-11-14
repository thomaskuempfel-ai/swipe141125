import React from 'react';
import { SparklesIcon, TrophyIcon } from './icons';

interface ScoreDisplayProps {
    score: number;
    t: (key: string, options?: any) => string;
    title?: string;
    showTrophy?: boolean;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, t, title, showTrophy = true }) => {
    const trophyLevel = Math.floor(score / 1000);

    const trophyColors = [
        'text-orange-400',  // Level 1: Bronze
        'text-slate-400',   // Level 2: Silver
        'text-yellow-400',  // Level 3: Gold
        'text-emerald-400', // Level 4: Emerald
        'text-blue-400',    // Level 5: Sapphire
        'text-red-400',     // Level 6: Ruby
        'text-purple-400',  // Level 7: Amethyst
        'text-cyan-300',    // Level 8: Diamond
        'text-pink-400',    // Level 9: Opal
        'text-rose-400',    // Level 10+: Rose Gold
    ];

    const trophyColorClass = trophyLevel > 0 ? trophyColors[Math.min(trophyLevel - 1, trophyColors.length - 1)] : '';


    return (
        <div className="relative group w-full max-w-sm mx-auto cursor-pointer">
            <div className="bg-teal-500/10 dark:bg-teal-900/40 border-2 border-teal-500/30 rounded-2xl p-6 text-center shadow-lg transition-transform group-hover:scale-105">
                <div className="flex justify-center items-center gap-2">
                    {showTrophy && trophyLevel > 0 ? (
                        <TrophyIcon className={`w-6 h-6 ${trophyColorClass}`} />
                    ) : (
                        <SparklesIcon className="w-6 h-6 text-teal-400" />
                    )}
                    <h3 className="text-lg font-bold text-teal-600 dark:text-teal-300">{title || t('guardian_score')}</h3>
                </div>
                <p className="text-5xl font-bold text-slate-800 dark:text-slate-100 mt-2">{score.toLocaleString()}</p>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 w-full max-w-xs left-1/2 -translate-x-1/2 p-3 bg-slate-900 text-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-10">
                <h4 className="font-bold text-center border-b border-slate-700 pb-1 mb-2">{t('score_tooltip_title')}</h4>
                <ul className="text-xs space-y-1 text-slate-300">
                    <li>{t('score_tooltip_rule1')}</li>
                    <li>{t('score_tooltip_rule2')}</li>
                    <li>{t('score_tooltip_rule3')}</li>
                    <li>{t('score_tooltip_rule4')}</li>
                    <li>{t('score_tooltip_rule5')}</li>
                    {showTrophy && <li className="pt-1 mt-1 border-t border-slate-700 font-semibold">{t('score_tooltip_trophy_unlock')}</li>}
                </ul>
                {showTrophy && trophyLevel > 0 && (
                    <div className="mt-2 text-center text-xs font-bold">
                        <p className={trophyColorClass}>{t('score_tooltip_trophy_level', { level: trophyLevel })}</p>
                    </div>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900"></div>
            </div>
        </div>
    );
};
