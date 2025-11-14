import React, { useState } from 'react';
import { PetProfile, ShoppingRecommendations, ProductRecommendation, CommunityLink } from '../types';
import { SpinnerIcon, ShoppingBagIcon, SearchIcon, UsersIcon, VideoIcon, SealOfApprovalIcon } from './icons';

interface MarketplaceViewProps {
    pet: PetProfile | null;
    recommendations: ShoppingRecommendations | null;
    isLoading: boolean;
    onViewVendors: (product: ProductRecommendation) => void;
    t: (key: string, options?: any) => string;
}

type MarketplaceTab = 'shopping' | 'learning';

const CommunitySection: React.FC<{
    title: string;
    Icon: React.ElementType;
    items: CommunityLink[];
}> = ({ title, Icon, items }) => {
    if (!items || items.length === 0) return null;

    return (
        <div>
            <h3 className="flex items-center gap-3 text-xl font-bold text-slate-700 dark:text-slate-200 mb-3">
                <Icon className="w-6 h-6 text-slate-500" />
                {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item, index) => (
                    <a href={item.url} key={index} target="_blank" rel="noopener noreferrer" className="block bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-teal-500/10 transition-all">
                        <h4 className="font-bold text-teal-600 dark:text-teal-400">{item.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                    </a>
                ))}
            </div>
        </div>
    );
};

const TabButton: React.FC<{
    label: string;
    Icon: React.ElementType;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
            ${isActive
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:border-gray-300 hover:text-gray-700 dark:hover:border-slate-600 dark:hover:text-slate-200'
            }`}
    >
        <Icon className={`w-5 h-5 ${isActive ? 'text-teal-500' : 'text-slate-400'}`} />
        {label}
    </button>
);


export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ pet, recommendations, isLoading, onViewVendors, t }) => {
    const [activeTab, setActiveTab] = useState<MarketplaceTab>('shopping');

    if (!pet) {
        return <div className="text-center p-8">{t('select_a_pet')}</div>;
    }

    const hasShoppingRecs = recommendations && recommendations.recommendations?.length > 0;
    const hasCommunityLinks = recommendations?.communityLinks && (recommendations.communityLinks.forums?.length > 0 || recommendations.communityLinks.videos?.length > 0);

    const topPick = hasShoppingRecs ? recommendations.recommendations[0] : null;
    const otherRecs = hasShoppingRecs ? recommendations.recommendations.slice(1) : [];

    return (
        <div className="w-full animate-fade-in space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('marketplace_title_for_pet', { petName: pet.name })}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{t('marketplace_subtitle', { petName: pet.name })}</p>
            </div>

             {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <TabButton 
                        label={t('marketplace_tab_shopping')}
                        Icon={ShoppingBagIcon}
                        isActive={activeTab === 'shopping'}
                        onClick={() => setActiveTab('shopping')}
                    />
                     <TabButton 
                        label={t('marketplace_tab_learning')}
                        Icon={UsersIcon}
                        isActive={activeTab === 'learning'}
                        onClick={() => setActiveTab('learning')}
                    />
                </nav>
            </div>
            
            {isLoading && (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 dark:text-slate-400">
                    <SpinnerIcon className="w-12 h-12 text-teal-500 mb-4" />
                    <p className="font-semibold">{t('marketplace_loading', { petName: pet.name })}</p>
                </div>
            )}

            {!isLoading && !recommendations && (
                <div className="text-center p-12 bg-white dark:bg-slate-800/50 rounded-2xl">
                    <ShoppingBagIcon className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">{t('marketplace_no_recs')}</p>
                </div>
            )}
            
            {!isLoading && recommendations && (
                 <div className="space-y-12 animate-fade-in-fast">
                    {activeTab === 'shopping' && (
                        hasShoppingRecs ? (
                            <div className="space-y-8">
                                {topPick && (
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border-2 border-teal-500/50">
                                        <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-4 text-center">{t('marketplace_dr_paws_pick', { petName: pet.name })}</h2>
                                        <div className="flex flex-col md:flex-row gap-6 items-center">
                                            <div className="flex-grow">
                                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 self-start mb-2 inline-block">{topPick.category}</span>
                                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{topPick.productName}</h3>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 space-y-2">
                                                    <p className="font-semibold text-slate-600 dark:text-slate-300">{t('marketplace_why_recommend')}</p>
                                                    <p className="italic border-l-2 border-teal-500 pl-3">"{topPick.description}"</p>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 flex flex-col items-center gap-4 w-full md:w-auto">
                                                 <div title={t('marketplace_seal_of_approval')} className="text-teal-500">
                                                    <SealOfApprovalIcon className="w-20 h-20"/>
                                                </div>
                                                <button onClick={() => onViewVendors(topPick)} className="w-full flex justify-center items-center gap-2 rounded-md bg-slate-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-all">
                                                    <SearchIcon className="w-4 h-4" />
                                                    {t('marketplace_view_options')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {otherRecs.map((item, index) => (
                                        <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-xl flex flex-col gap-3 shadow-lg border border-gray-200 dark:border-slate-700 h-full">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 self-start">{item.category}</span>
                                                <div title={t('marketplace_seal_of_approval')} className="text-teal-500/70">
                                                    <SealOfApprovalIcon className="w-8 h-8"/>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-slate-700 dark:text-slate-200">{item.productName}</h3>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 flex-grow space-y-2">
                                                <p className="font-semibold text-slate-600 dark:text-slate-300">{t('marketplace_why_recommend')}</p>
                                                <p className="italic border-l-2 border-teal-500 pl-2 text-xs">"{item.description}"</p>
                                            </div>
                                            <button
                                                onClick={() => onViewVendors(item)}
                                                className="mt-2 w-full flex justify-center items-center gap-2 rounded-md bg-slate-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-all"
                                            >
                                                <SearchIcon className="w-4 h-4" />
                                                {t('marketplace_view_options')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-8">{t('marketplace_empty_category')}</p>
                        )
                    )}

                    {activeTab === 'learning' && (
                         hasCommunityLinks ? (
                            <div className="space-y-8">
                                <CommunitySection title={t('marketplace_forums')} Icon={UsersIcon} items={recommendations.communityLinks!.forums} />
                                <CommunitySection title={t('marketplace_videos')} Icon={VideoIcon} items={recommendations.communityLinks!.videos} />
                            </div>
                        ) : (
                             <p className="text-center text-slate-500 dark:text-slate-400 py-8">{t('marketplace_empty_category')}</p>
                        )
                    )}
                </div>
            )}
        </div>
    );
};
