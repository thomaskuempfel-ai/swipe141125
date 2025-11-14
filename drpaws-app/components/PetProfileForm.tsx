import React, { useState, useEffect } from 'react';
import { PetProfile, PetType, Language, LANGUAGES } from '../types';
import { PetSelector } from './PetSelector';
import { UserCircleIcon, TrashIcon, SpinnerIcon, DogIcon, CatIcon, BirdIcon, OtherIcon } from './icons';
import { detectBreed } from '../services/geminiService';

interface PetProfileFormProps {
  petToEdit: PetProfile | null;
  onSave: (pet: PetProfile) => void;
  onCancel: () => void;
  onDelete: (petId: string) => void;
  t: (key: string) => string;
  language: Language;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const PetProfileForm: React.FC<PetProfileFormProps> = ({ petToEdit, onSave, onCancel, onDelete, t, language: appLanguage }) => {
  const [name, setName] = useState('');
  const [petType, setPetType] = useState<PetType>('dog');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [age, setAge] = useState('');
  const [isDetectingBreed, setIsDetectingBreed] = useState(false);
  const [breed, setBreed] = useState<string | undefined>(undefined);
  const [breedInfo, setBreedInfo] = useState<PetProfile['breedInfo'] | undefined>(undefined);
  const [language, setLanguage] = useState<Language>(appLanguage);
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown');

  useEffect(() => {
    if (petToEdit) {
      setName(petToEdit.name);
      setPetType(petToEdit.petType);
      setPhoto(petToEdit.photo);
      setAge(petToEdit.age || '');
      setBreed(petToEdit.breed);
      setBreedInfo(petToEdit.breedInfo);
      setLanguage(petToEdit.language || appLanguage);
      setGender(petToEdit.gender || 'unknown');
    } else {
      // For new pets, default to the current app language
      setLanguage(appLanguage);
      setGender('unknown');
    }
  }, [petToEdit, appLanguage]);

  // Clean up blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
        if (photo && photo.startsWith('blob:')) {
            URL.revokeObjectURL(photo);
        }
    };
  }, [photo]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (photo && photo.startsWith('blob:')) {
          URL.revokeObjectURL(photo); // Clean up previous blob URL
      }
      const base64Photo = await fileToBase64(file);
      setPhoto(base64Photo);
      
      // Trigger breed detection
      setIsDetectingBreed(true);
      setBreed(undefined);
      setBreedInfo(undefined);
      try {
          const result = await detectBreed(base64Photo, petType, language);
          setBreed(result.breed);
          setBreedInfo({ summary: result.summary, articles: result.articles });
      } catch (error) {
          console.error("Breed detection failed:", error);
          setBreed(t('Unknown'));
      } finally {
          setIsDetectingBreed(false);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    onSave({
      id: petToEdit?.id || crypto.randomUUID(),
      name,
      petType,
      photo,
      age,
      breed,
      breedInfo,
      language,
      gender,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">{petToEdit ? t('edit_pet_title') : t('add_pet_title')}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <label htmlFor="photo-upload" className="cursor-pointer">
              {photo ? (
                <img src={photo} alt="Pet" className="w-28 h-28 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden border-4 border-gray-300 dark:border-gray-600">
                    <DogIcon className="w-8 h-8 text-orange-400 absolute animate-pet-icon-1" />
                    <CatIcon className="w-8 h-8 text-sky-400 absolute animate-pet-icon-2" />
                    <BirdIcon className="w-8 h-8 text-pink-400 absolute animate-pet-icon-3" />
                    <OtherIcon className="w-8 h-8 text-green-400 absolute animate-pet-icon-4" />
                </div>
              )}
            </label>
            <input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
             <button type="button" onClick={() => document.getElementById('photo-upload')?.click()} className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
                {photo ? t('change_photo_button') : t('upload_photo_button')}
             </button>
             {isDetectingBreed && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <SpinnerIcon className="w-4 h-4" />
                    <span>{t('detecting_breed')}...</span>
                </div>
             )}
             {breed && !isDetectingBreed && (
                <div className="text-sm text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                    <span className="font-bold">{t('breed_label')}:</span> {breed}
                </div>
             )}
          </div>
          <div>
            <label htmlFor="pet-name" className="block text-sm font-medium text-slate-600 dark:text-slate-300">{t('pet_name_label')}</label>
            <input
              type="text"
              id="pet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-slate-800 dark:text-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="pet-age" className="block text-sm font-medium text-slate-600 dark:text-slate-300">{t('pet_age_label')}</label>
            <input
                type="text"
                id="pet-age"
                placeholder="e.g., 5 years"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-slate-800 dark:text-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">{t('pet_gender_label')}</label>
            <div className="mt-2 grid grid-cols-3 gap-3">
                {(['male', 'female', 'unknown'] as const).map((g) => (
                    <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                            gender === g
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {t(`gender_${g}`)}
                    </button>
                ))}
            </div>
          </div>

          <div>
            <label htmlFor="pet-language" className="block text-sm font-medium text-slate-600 dark:text-slate-300">{t('language_label')}</label>
            <select
              id="pet-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-slate-800 dark:text-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            >
              {LANGUAGES.map(({ code, name }) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          
          <PetSelector 
            selectedPet={petType} 
            onSelectPet={(newPetType) => {
                if (newPetType !== petType) {
                    setPetType(newPetType);
                    setBreed(undefined);
                    setBreedInfo(undefined);
                }
            }} 
            t={t}
          />
          
          <div className="flex items-center justify-between pt-4">
            {petToEdit ? (
                <button 
                  type="button" 
                  onClick={() => onDelete(petToEdit.id)}
                  className="p-2 text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400"
                  aria-label={t('delete_pet_aria')}
                  >
                    <TrashIcon className="w-5 h-5" />
                </button>
            ) : <div />}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {t('cancel_button')}
              </button>
              <button
                type="submit"
                className="rounded-md border border-transparent bg-teal-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                {t('save_button')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PetProfileForm;