import React from 'react';
import { LightbulbIcon, SpinnerIcon, DogIcon, CatIcon, BirdIcon, OtherIcon } from './icons';
import { DailyTipsResponse, PetType } from '../types';

interface DailyTipProps {
  tip: string | DailyTipsResponse | null;
  isLoading: boolean;
  t: (key: string) => string;
}

const petTypeIcons: Record<PetType, React.ElementType> = {
    dog: DogIcon,
    cat: CatIcon,
    bird: BirdIcon,
    other: OtherIcon,
};

export const DailyTip: React.FC<DailyTipProps> = ({ tip, isLoading, t }) => {
    const renderTipContent = () => {
        if (typeof tip === 'string') {
            return <p className="text-sm text-slate-300">{tip}</p>;
        }
        if (tip && typeof tip === 'object') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(tip) as PetType[]).map(petType => {
                        if (!(tip as DailyTipsResponse)[petType]) return null;
                        const Icon = petTypeIcons[petType];
                        return (
                            <div key={petType} className="flex items-start gap-2 p-3 bg-slate-900/50 rounded-lg">
                                <Icon className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-xs text-teal-300">{t(`tip_for_${petType}`)}</h4>
                                    <p className="text-sm text-slate-300">{(tip as DailyTipsResponse)[petType]}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full text-left">
            {isLoading && (
                <div className="flex items-center gap-2">
                    <SpinnerIcon className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-400">{t('loading_tip')}</p>
                </div>
            )}
            {!isLoading && renderTipContent()}
        </div>
    );
};