import React from 'react';
import { ProductRecommendation } from '../types';
import { XIcon, SearchIcon, ShoppingBagIcon } from './icons';

interface VendorModalProps {
    product: ProductRecommendation;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}

const vendors = [
    { name: 'Google Shopping', url: 'https://www.google.com/search?tbm=shop&q=' },
    { name: 'Amazon', url: 'https://www.amazon.com/s?k=' },
    { name: 'Chewy', url: 'https://www.chewy.com/s?q=' },
];

export const VendorModal: React.FC<VendorModalProps> = ({ product, onClose, t }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative border border-gray-200 dark:border-gray-700 animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-6">
                    <ShoppingBagIcon className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{product.productName}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{product.description}</p>
                </div>

                <div className="space-y-3">
                    {vendors.map(vendor => (
                        <a
                            key={vendor.name}
                            href={`${vendor.url}${encodeURIComponent(product.googleShoppingQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex justify-between items-center gap-4 p-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Search on {vendor.name}</span>
                            <SearchIcon className="w-5 h-5 text-slate-500" />
                        </a>
                    ))}
                </div>

                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};