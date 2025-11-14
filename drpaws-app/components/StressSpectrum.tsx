

import React from 'react';
import { PetEmpathyReport } from '../types';

interface StressSpectrumProps {
  emotionScores: PetEmpathyReport['emotionScores'];
  dominantEmotion: string;
  t: (key: string) => string;
}

const getEmotionColorClass = (emotion?: string) => {
    switch (emotion?.toLowerCase()) {
        case 'anxious': case 'pain': case 'grumpy': return 'text-red-500 dark:text-red-400';
        case 'playful': return 'text-yellow-500 dark:text-yellow-400';
        case 'calm': return 'text-teal-500 dark:text-teal-400';
        case 'hungry': return 'text-orange-500 dark:text-orange-400';
        default: return 'text-slate-800 dark:text-slate-200';
    }
};

export const StressSpectrum: React.FC<StressSpectrumProps> = ({ emotionScores, dominantEmotion, t }) => {
  const { calm = 0, anxious = 0, playful = 0, hungry = 0, pain = 0, grumpy = 0 } = emotionScores;

  const positive = calm + playful;
  const negative = anxious + pain + grumpy;
  const neutral = hungry;

  const total = positive + negative + neutral;

  if (total === 0) return null;

  const positivePercent = (positive / total) * 100;
  const negativePercent = (negative / total) * 100;
  const neutralPercent = (neutral / total) * 100;

  const circumference = 2 * Math.PI * 45; // r=45
  
  const segments = [
      { percent: negativePercent, color: "stroke-red-500", rotation: -90 },
      { percent: neutralPercent, color: "stroke-yellow-500", rotation: -90 + negativePercent * 3.6 },
      { percent: positivePercent, color: "stroke-teal-500", rotation: -90 + (negativePercent + neutralPercent) * 3.6 },
  ];
  
  const dominantEmotionColor = getEmotionColorClass(dominantEmotion);

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 text-center">{t('stress_spectrum_title')}</h3>
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="10" className="stroke-gray-200 dark:stroke-gray-700" />
          {segments.map((segment, index) => (
             <circle
                key={index}
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className={`${segment.color} transition-all duration-1000 ease-out`}
                strokeDasharray={`${(segment.percent / 100) * circumference} ${circumference}`}
                transform={`rotate(${segment.rotation} 50 50)`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
                <span className={`block text-3xl font-bold ${dominantEmotionColor}`}>{t(`emotion_${dominantEmotion.toLowerCase()}`)}</span>
            </div>
        </div>
      </div>
      <div className="flex justify-center text-xs text-slate-500 dark:text-slate-400 mt-4 gap-4">
           <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>{t('stress_negative')}</span>
           </div>
           <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span>{t('stress_neutral')}</span>
           </div>
           <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                <span>{t('stress_positive')}</span>
           </div>
      </div>
    </div>
  );
};