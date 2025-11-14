import React from 'react';
import { AppView, PetProfile } from '../types';
import { DashboardIcon, MemoriesIcon, PawPrintIcon, UserCircleIcon, ShoppingBagIcon } from './icons';

interface BottomNavProps {
    activeView: AppView;
    setActiveView: (view: AppView) => void;
    onNewAnalysis: () => void;
    pet: PetProfile | null;
    disabled: boolean;
    t: (key: string, options?: any) => string;
}

const NavButton: React.FC<{
    view: AppView;
    activeView: AppView;
    onClick: () => void;
    Icon: React.ElementType;
    label: string;
}> = ({ view, activeView, onClick, Icon, label }) => {
    const isActive = activeView === view;
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-teal-500' : 'text-slate-400 hover:text-teal-400'
            }`}
        >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );
};

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView, onNewAnalysis, pet, disabled, t }) => {
    return (
        <>
            <div className="fab-container">
                 <button 
                    onClick={onNewAnalysis}
                    disabled={disabled}
                    className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-teal-500/50 disabled:bg-slate-500 disabled:cursor-not-allowed disabled:transform-none"
                    aria-label={t('nav_new_analysis')}
                 >
                    <PawPrintIcon className="w-8 h-8" />
                 </button>
            </div>
            <nav className="bottom-nav h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-200 dark:border-slate-800">
                <div className="max-w-md mx-auto h-full grid grid-cols-5 items-center">
                    <NavButton view="dashboard" activeView={activeView} onClick={() => setActiveView('dashboard')} Icon={DashboardIcon} label={t('nav_dashboard')} />
                    <NavButton view="memories" activeView={activeView} onClick={() => setActiveView('memories')} Icon={MemoriesIcon} label={t('nav_memories')} />
                    <div className="text-center">
                        {/* This is the placeholder for the FAB */}
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-16 block">{t('nav_new_analysis')}</span>
                    </div>
                    <NavButton view="marketplace" activeView={activeView} onClick={() => setActiveView('marketplace')} Icon={ShoppingBagIcon} label={pet ? t('nav_marketplace_personalized', { petName: pet.name }) : t('nav_marketplace')} />
                    <NavButton view="profile" activeView={activeView} onClick={() => setActiveView('profile')} Icon={UserCircleIcon} label={t('nav_profile')} />
                </div>
            </nav>
        </>
    );
};