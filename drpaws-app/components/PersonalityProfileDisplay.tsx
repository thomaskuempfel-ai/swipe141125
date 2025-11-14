import React from 'react';
import { PetPersonalityProfile, PetProfile } from '../types';
import { SparklesIcon, SpinnerIcon } from './icons';

interface PersonalityProfileDisplayProps {
    pet: PetProfile;
    profile: PetPersonalityProfile | null;
    isLoading: boolean;
    error: string | null;
    t: (key: string, options?: any) => string;
}

export const PersonalityProfileDisplay: React.FC<PersonalityProfileDisplayProps> = ({ pet, profile, isLoading, error, t }) => {
    return (
        <div className="w-full bg-slate-800 p-6 rounded-2xl shadow-lg border-2 border-teal-500/30 mb-6 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-teal-400" />
                    {t('personality_insights_title', { petName: pet.name })}
                </h2>
                <p className="text-sm text-slate-400">{t('personality_unlocked_subtitle', { petName: pet.name })}</p>
            </div>
            
            {isLoading && (
                <div className="flex flex-col items-center justify-center gap-3 text-slate-400 p-8">
                    <SpinnerIcon className="w-8 h-8" />
                    <span>{t('generating_profile')}</span>
                </div>
            )}

            {error && (
                 <div className="text-center p-4 bg-red-900/40 rounded-lg text-red-300">
                    <p className="font-semibold">{t('error_oh_no')}</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {profile && (
                <div className="space-y-4 animate-fade-in">
                    <div className="text-center">
                        <h4 className="text-2xl font-bold text-teal-400">{profile.title}</h4>
                    </div>
                    <p className="text-slate-300 text-center bg-slate-900/50 p-3 rounded-md">{profile.description}</p>
                    <div>
                        <h5 className="font-bold text-slate-200 mb-2">{t('dominant_traits_title')}</h5>
                        <div className="space-y-3">
                            {profile.dominantTraits.map(trait => (
                                <div key={trait.trait}>
                                    <div className="flex justify-between items-center text-sm font-medium mb-1 text-slate-300">
                                        <span>{trait.trait}</span>
                                        <span>{trait.score}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-teal-500 h-2 rounded-full" style={{width: `${trait.score}%`}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};