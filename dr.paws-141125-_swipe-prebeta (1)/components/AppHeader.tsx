import React, { useState, useEffect, useRef } from 'react';
import { PetProfile, Language, Theme } from '../types';
import { PawPrintIcon, SunIcon, ThemeMoonIcon, ChevronDownIcon, CheckIcon, PlusIcon, DogIcon, CatIcon, BirdIcon, OtherIcon } from './icons';

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme, t }) => {
    const isDark = theme === 'dark';
    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative inline-flex items-center h-8 w-14 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-slate-900"
            aria-label={t(isDark ? 'switch_to_light_mode' : 'switch_to_dark_mode')}
        >
            <span
                className={`absolute inline-flex items-center justify-center h-6 w-6 rounded-full bg-white dark:bg-slate-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
                    isDark ? 'translate-x-7' : 'translate-x-1'
                }`}
            >
                {isDark ? (
                    <SunIcon className="w-4 h-4 text-yellow-400" />
                ) : (
                    <ThemeMoonIcon className="w-4 h-4 text-slate-500" />
                )}
            </span>
        </button>
    );
};


const petTypeIcons = { dog: DogIcon, cat: CatIcon, bird: BirdIcon, other: OtherIcon };

interface PetSelectorDropdownProps {
    pets: PetProfile[];
    selectedPetId: string | null;
    onSelectPet: (id: string) => void;
    onAddPet: () => void;
    t: (key: string) => string;
}

const PetSelectorDropdown: React.FC<PetSelectorDropdownProps> = ({ pets, selectedPetId, onSelectPet, onAddPet, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedPet = pets.find(p => p.id === selectedPetId);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (pets.length === 0) {
        return (
            <button onClick={onAddPet} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600">
                    <PlusIcon className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                     <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{t('add_pet_dropdown')}</p>
                </div>
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                {selectedPet?.photo ? (
                    <img src={selectedPet.photo} alt={selectedPet.name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-300 dark:border-slate-600" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600">
                        <PawPrintIcon className="w-6 h-6 text-slate-400" />
                    </div>
                )}
                <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('select_a_pet')}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight flex items-center gap-1">{selectedPet?.name || '...'} <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></p>
                </div>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 animate-fade-in-fast">
                    <ul className="py-1">
                        {pets.map(pet => {
                            const Icon = petTypeIcons[pet.petType] || OtherIcon;
                            return (
                                <li key={pet.id}>
                                    <button
                                        onClick={() => { onSelectPet(pet.id); setIsOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            {pet.photo ? (
                                                <img src={pet.photo} alt={pet.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                                    <Icon className="w-5 h-5 text-slate-500" />
                                                </div>
                                            )}
                                            <span className="font-medium">{pet.name}</span>
                                        </div>
                                        {pet.id === selectedPetId && <CheckIcon className="w-5 h-5 text-teal-500" />}
                                    </button>
                                </li>
                            );
                        })}
                        <li className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                             <button
                                onClick={() => { onAddPet(); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span className="font-medium">{t('add_pet_dropdown')}</span>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

interface AppHeaderProps {
    pets: PetProfile[];
    selectedPetId: string | null;
    onSelectPet: (id: string) => void;
    onAddPet: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    t: (key: string, options?: any) => string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    pets,
    selectedPetId,
    onSelectPet,
    onAddPet,
    theme,
    setTheme,
    t
}) => {
    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 dark:border-slate-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side: Pet Selector */}
                    <div className="flex-1 min-w-0">
                       <PetSelectorDropdown 
                           pets={pets} 
                           selectedPetId={selectedPetId} 
                           onSelectPet={onSelectPet} 
                           onAddPet={onAddPet} 
                           t={t} 
                       />
                    </div>
                    
                    {/* Center: Logo (conditionally shown on larger screens) */}
                    <div className="hidden md:flex justify-center flex-1">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <PawPrintIcon className="w-7 h-7" />
                            <span className="font-bold text-xl">{t('app_title')}</span>
                        </div>
                    </div>

                    {/* Right side: Controls */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <ThemeToggle theme={theme} setTheme={setTheme} t={t} />
                    </div>
                </div>
            </div>
        </header>
    );
};