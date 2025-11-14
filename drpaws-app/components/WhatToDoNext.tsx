import React from 'react';
import { WhatToDoTip } from '../types';
import { PlayIcon, HeartIcon, FoodIcon, HealthIcon, HandIcon, MoonIcon, TrainingIcon, EnrichmentIcon } from './icons';

interface WhatToDoNextProps {
    tips: WhatToDoTip[] | null;
    t: (key: string, options?: any) => string;
}

const iconMap: Record<WhatToDoTip['icon'], React.ElementType> = {
    play: PlayIcon,
    comfort: HeartIcon,
    food: FoodIcon,
    health: HealthIcon,
    attention: HandIcon,
    calm: MoonIcon,
    training: TrainingIcon,
    enrichment: EnrichmentIcon,
};

const effortColorMap = {
    Low: 'bg-green-500/20 text-green-300',
    Medium: 'bg-yellow-500/20 text-yellow-300',
    High: 'bg-red-500/20 text-red-300',
};

const categoryColorMap: Record<WhatToDoTip['category'], string> = {
    'Enrichment': 'bg-blue-500/20 text-blue-300',
    'Comfort': 'bg-pink-500/20 text-pink-300',
    'Training': 'bg-indigo-500/20 text-indigo-300',
    'Health & Diet': 'bg-red-500/20 text-red-300',
    'Bonding': 'bg-teal-500/20 text-teal-300',
};

const productKeywords = [
    'toy', 'toys', 'bed', 'treat', 'treats', 'puzzle', 'feeder',
    'brush', 'leash', 'harness', 'collar', 'chew', 'ball', 'mat', 'snuffle mat'
];

const linkifyProducts = (text: string) => {
    const regex = new RegExp(`\\b(${productKeywords.join('|')})\\b`, 'gi');
    return text.replace(regex, (match) => {
        const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(match)}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-teal-500 dark:text-teal-400 font-bold underline decoration-dotted hover:text-teal-600 dark:hover:text-teal-300">${match}</a>`;
    });
};


export const WhatToDoNext: React.FC<WhatToDoNextProps> = ({ tips, t }) => {
    if (!tips || tips.length === 0) {
        return null;
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
            {tips.map((tip, index) => {
                const Icon = iconMap[tip.icon] || HandIcon;
                const effortClass = effortColorMap[tip.effort] || 'bg-slate-500/20 text-slate-300';
                const categoryClass = categoryColorMap[tip.category] || 'bg-slate-500/20 text-slate-300';
                const categoryKey = `category_${tip.category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`;
                const effortKey = `effort_${tip.effort.toLowerCase()}`;
                const linkedTitle = linkifyProducts(tip.title);
                const linkedDescription = linkifyProducts(tip.description);

                return (
                    <div key={index} className="flex-shrink-0 w-64 bg-slate-900/50 p-4 rounded-xl flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-slate-700/50 p-2 rounded-full mt-1">
                                <Icon className="w-5 h-5 text-teal-400 flex-shrink-0" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold text-slate-200" dangerouslySetInnerHTML={{ __html: linkedTitle }} />
                                <p className="text-xs text-slate-400" dangerouslySetInnerHTML={{ __html: linkedDescription }} />
                            </div>
                        </div>
                            <div className="flex items-center gap-2 flex-wrap border-t border-slate-700/50 pt-3 mt-auto">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${categoryClass}`}>
                                {t(categoryKey)}
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${effortClass}`}>
                                {t('effort_label')}: {t(effortKey)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};