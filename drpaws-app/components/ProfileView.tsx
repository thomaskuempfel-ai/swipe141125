import React, { useState, useEffect } from 'react';
import { PetProfile, PetType, Language, LANGUAGES, PetPersonalityProfile } from '../types';
import { PlusIcon, PencilIcon, DogIcon, CatIcon, BirdIcon, OtherIcon, BrainIcon, ShieldCheckIcon, TrashIcon } from './icons';
import { ScoreDisplay } from './ScoreDisplay';

interface ProfileViewProps {
  pets: PetProfile[];
  averageScore: number;
  onAddPet: () => void;
  onEditPet: (petId: string) => void;
  onUpdatePet: (petId: string, updates: Partial<PetProfile>) => void;
  onViewBreedInfo: (pet: PetProfile) => void;
  onViewPrivacyPolicy: () => void;
  onDeleteAllData: () => void;
  personalityProfiles: Record<string, PetPersonalityProfile | null>;
  t: (key: string, options?: any) => string;
}

const petTypeIcons: Record<PetType, React.ElementType> = {
    dog: DogIcon,
    cat: CatIcon,
    bird: BirdIcon,
    other: OtherIcon,
};

export const ProfileView: React.FC<ProfileViewProps> = ({ pets, averageScore, onAddPet, onEditPet, onUpdatePet, t, onViewBreedInfo, onViewPrivacyPolicy, onDeleteAllData, personalityProfiles }) => {
    const [feedback, setFeedback] = useState('');
    const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);

    const handleFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        try {
            const existingFeedbackStr = localStorage.getItem('appFeedback');
            const existingFeedback = existingFeedbackStr ? JSON.parse(existingFeedbackStr) : [];
            const newFeedback = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                text: feedback.trim(),
            };
            existingFeedback.push(newFeedback);
            localStorage.setItem('appFeedback', JSON.stringify(existingFeedback));
            
            setFeedback('');
            setIsFeedbackSubmitted(true);
            setTimeout(() => setIsFeedbackSubmitted(false), 3000);

        } catch (error) {
            console.error("Failed to save feedback:", error);
        }
    };

  return (
    <div className="w-full animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">{t('profile_view_title')}</h1>
        
        {pets.length > 1 && <ScoreDisplay score={averageScore} t={t} title={t('average_guardian_score')} />}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-8">
            {pets.map(pet => {
                const Icon = petTypeIcons[pet.petType] || OtherIcon;
                const profile = personalityProfiles[pet.id];
                return (
                    <div key={pet.id} className="relative group flex flex-col">
                        <div className="w-full flex-grow flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm">
                            <div className="w-24 h-24 mb-3 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                {pet.photo ? (
                                    <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Icon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                                )}
                            </div>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">{pet.name}</span>
                            
                             {pet.breed && pet.breed !== 'Unknown' ? (
                                <span className="text-xs mt-1 font-semibold bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">{pet.breed}</span>
                            ) : pet.age ? (
                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pet.age}</span>
                            ) : <div className="h-[22px] mt-1"></div>}

                            <div className="flex-grow flex flex-col justify-center items-center text-center py-2">
                                {profile && (
                                    <div className="animate-fade-in">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('personality_title')}</p>
                                        <p className="font-semibold text-sm text-teal-600 dark:text-teal-400">{profile.title}</p>
                                    </div>
                                )}
                            </div>


                            {pet.breedInfo && (
                                <button 
                                    onClick={() => onViewBreedInfo(pet)} 
                                    className="mt-auto pt-2 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                                >
                                    <BrainIcon className="w-4 h-4" />
                                    {t('breed_insights')}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => onEditPet(pet.id)}
                            className="absolute top-2 right-2 p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full text-slate-500 dark:text-slate-400 hover:bg-teal-500 dark:hover:bg-teal-600 hover:text-white dark:hover:text-white transition-colors"
                            aria-label={`${t('edit_pet_aria_prefix')} ${pet.name}`}
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
            <button
                onClick={onAddPet}
                className="group flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-transparent hover:border-teal-500 dark:hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
            >
                <PlusIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-teal-500" />
                <span className="mt-2 font-semibold text-sm text-center text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-300">{t('add_a_pet_profile')}</span>
            </button>
        </div>

        <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">{t('profile_feedback_title')}</h2>
            <form onSubmit={handleFeedbackSubmit} className="max-w-sm mx-auto space-y-4">
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-slate-800 dark:text-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    placeholder={t('profile_feedback_placeholder')}
                    required
                />
                <button
                    type="submit"
                    className="w-full rounded-md border border-transparent bg-teal-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-slate-500"
                    disabled={!feedback.trim()}
                >
                    {t('profile_feedback_button')}
                </button>
                {isFeedbackSubmitted && (
                    <p className="text-sm text-center text-green-600 dark:text-green-400 animate-fade-in">
                        {t('profile_feedback_success')}
                    </p>
                )}
            </form>
        </div>

        <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">{t('profile_data_privacy_title')}</h2>
            <div className="max-w-sm mx-auto space-y-4">
                <button
                    onClick={onViewPrivacyPolicy}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <ShieldCheckIcon className="w-6 h-6 text-teal-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{t('profile_view_policy_button')}</span>
                    </div>
                </button>
                <button
                    onClick={onDeleteAllData}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <TrashIcon className="w-6 h-6 text-red-500" />
                        <span className="font-semibold text-red-700 dark:text-red-300">{t('profile_delete_data_button')}</span>
                    </div>
                </button>
            </div>
        </div>
    </div>
  );
};
