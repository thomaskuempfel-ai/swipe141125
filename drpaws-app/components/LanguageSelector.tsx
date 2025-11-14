import React, { useState, useRef, useEffect } from 'react';
import { Language, LANGUAGES } from '../types';
import { GlobeIcon } from './icons';

interface LanguageSelectorProps {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  isFirstVisit: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, setLanguage, isFirstVisit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 py-2 px-3 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${isFirstVisit ? 'animate-pulse-glow' : ''}`}
        aria-label="Select language"
      >
        <GlobeIcon className="w-5 h-5" />
        <span className="font-semibold text-xs uppercase">{currentLanguage}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 animate-fade-in-fast">
          <ul className="py-1">
            {LANGUAGES.map(({ code, name }) => (
              <li key={code}>
                <button
                  onClick={() => handleLanguageChange(code)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    currentLanguage === code
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
