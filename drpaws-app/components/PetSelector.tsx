import React from 'react';
import { PetType } from '../types';
import { PET_TYPES } from '../constants';
import { DogIcon, CatIcon, BirdIcon, OtherIcon } from './icons';

interface PetSelectorProps {
  selectedPet: PetType;
  onSelectPet: (pet: PetType) => void;
  t: (key: string) => string;
}

const petIcons: { [key in PetType]: React.ElementType } = {
  dog: DogIcon,
  cat: CatIcon,
  bird: BirdIcon,
  other: OtherIcon,
};

export const PetSelector: React.FC<PetSelectorProps> = ({ selectedPet, onSelectPet, t }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('pet_type_label')}</label>
      <div className="grid grid-cols-4 gap-3">
        {PET_TYPES.map(({ id }) => {
          const Icon = petIcons[id];
          const isSelected = selectedPet === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectPet(id)}
              className={`group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-teal-500
                ${
                  isSelected
                    ? 'bg-teal-500/10 border-teal-500 dark:bg-teal-500/20'
                    : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-teal-400'
                }`}
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors
                ${
                  isSelected 
                    ? 'bg-teal-500' 
                    : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50'
                }`}>
                <Icon className={`w-7 h-7 transition-colors ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-teal-500'}`} />
              </div>
              <span className={`mt-2 font-semibold text-xs text-center transition-colors ${isSelected ? 'text-teal-600 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>{t(`pet_type_${id}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
