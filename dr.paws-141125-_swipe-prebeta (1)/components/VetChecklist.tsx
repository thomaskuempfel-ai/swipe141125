import React, { useState, useEffect } from 'react';
import { VetChecklistEntry } from '../types';

interface VetChecklistProps {
    initialData: VetChecklistEntry[];
    onChecklistChange: (data: VetChecklistEntry[]) => void;
    t: (key: string, options?: any) => string;
}

const checklistQuestions: Array<VetChecklistEntry['key']> = [
    'eating_drinking',
    'urination_defecation',
    'energy_levels',
    'aggression_fear',
    'vomiting_diarrhea',
    'limping_pain',
];

export const VetChecklist: React.FC<VetChecklistProps> = ({ initialData, onChecklistChange, t }) => {
    const [checklist, setChecklist] = useState<VetChecklistEntry[]>([]);

    useEffect(() => {
        const fullChecklist = checklistQuestions.map(key => {
            const existing = initialData.find(item => item.key === key);
            return { key, answer: existing ? existing.answer : 'n/a' };
        });
        setChecklist(fullChecklist);
    }, [initialData]);
    
    const handleAnswer = (key: string, answer: 'yes' | 'no' | 'n/a') => {
        const newData = checklist.map(item => 
            item.key === key ? { ...item, answer } : item
        );
        setChecklist(newData);
        onChecklistChange(newData);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 text-center">{t('vet_checklist_title')}</h3>
            <div className="space-y-3">
                {checklistQuestions.map(questionKey => {
                    const currentItem = checklist.find(item => item.key === questionKey);
                    return (
                        <div key={questionKey} className="p-3 bg-slate-900/50 rounded-lg">
                            <p className="text-sm font-medium text-slate-300 mb-2">{t(`checklist_q_${questionKey}`)}</p>
                            <div className="flex items-center justify-end gap-2">
                                {(['yes', 'no', 'n/a'] as const).map(answer => {
                                    const isSelected = currentItem?.answer === answer;
                                    const baseClass = "px-3 py-1 text-xs font-semibold rounded-full transition-colors";
                                    const selectedClass = {
                                        yes: 'bg-red-500 text-white',
                                        no: 'bg-green-500 text-white',
                                        'n/a': 'bg-slate-500 text-white'
                                    }[answer];
                                    const unselectedClass = "bg-slate-600 hover:bg-slate-500 text-slate-300";
                                    
                                    return (
                                        <button
                                            key={answer}
                                            type="button"
                                            onClick={() => handleAnswer(questionKey, answer)}
                                            className={`${baseClass} ${isSelected ? selectedClass : unselectedClass}`}
                                        >
                                            {t(`checklist_a_${answer}`)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};