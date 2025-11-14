import React, { useMemo, useState, useEffect, useRef } from 'react';
import { PetEmpathyReport, PetProfile, ChatMessage, Language, HistoricReport, PetPersonalityProfile, SicknessIndicators } from '../types';
// FIX: Add missing icon imports and remove unused ones.
import { SoundWaveIcon, SpinnerIcon, HealthIcon, PawPrintIcon, MeaningIcon, DrPawsChatIcon, AlertTriangleIcon, ActivityIcon } from './icons';
import { translateReport, sendMessageToChat, getChatPrompts, startChat } from '../services/geminiService';
import { PlayPrompts } from './PlayPrompts';
import { WhatToDoNext } from './WhatToDoNext';
import { StressSpectrum } from './StressSpectrum';
import { ReportDetailsModal } from './ReportDetailsModal';

type ReportTab = 'summary' | 'health' | 'details' | 'chat';

const TabButton: React.FC<{
  tab: ReportTab;
  activeTab: ReportTab;
  onClick: (tab: ReportTab) => void;
  children: React.ReactNode;
  Icon: React.ElementType;
}> = ({ tab, activeTab, onClick, children, Icon }) => (
  <button
    onClick={() => onClick(tab)}
    className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-teal-500 text-teal-500'
        
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
    }`}
  >
    <Icon className="w-5 h-5" />
    {children}
  </button>
);


interface ReportDisplayProps {
  report: HistoricReport;
  pet: PetProfile;
  language: Language;
  t: (key: string, options?: any) => string;
  onBack: () => void;
}

// Helper function to extract only the parts of the report that need translation
const getTranslatableContent = (report: PetEmpathyReport) => {
    if (!report) return null;
    const { emotion, translation, detailedAnalysis, careTips, playPrompts, audioAnalysis, sleepAnalysis, sicknessIndicators, videoTimeline } = report;
    return { emotion, translation, detailedAnalysis, careTips, playPrompts, audioAnalysis, sleepAnalysis, sicknessIndicators, videoTimeline };
};


export const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, pet, language, t, onBack }) => {
    const [displayedReport, setDisplayedReport] = useState<HistoricReport>(report);
    const [isTranslating, setIsTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState<ReportTab>('summary');

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatPrompts, setChatPrompts] = useState<string[] | null>(null);
    const [isPromptsLoading, setIsPromptsLoading] = useState(false);
    
    const prevLanguageRef = useRef<Language>(language);

    useEffect(() => {
        if (!report) return;

        const initChat = (finalReport: PetEmpathyReport) => {
            startChat(finalReport, pet, language);
            const initialMessage = t('chat_initial_message', { petName: pet.name, emotion: t(`emotion_${finalReport.emotion.toLowerCase()}`) });
            setChatMessages([{ role: 'model', parts: [{ text: initialMessage }] }]);
            
            setChatPrompts(null);
            setIsPromptsLoading(true);
            try {
                getChatPrompts(finalReport, pet, language).then(prompts => {
                    setChatPrompts(prompts);
                }).finally(() => {
                    setIsPromptsLoading(false);
                });
            } catch (err) {
                console.error("Failed to get chat prompts", err);
                setIsPromptsLoading(false);
            }
        };

        const currentContentStr = JSON.stringify(getTranslatableContent(report));
        const displayedContentStr = JSON.stringify(getTranslatableContent(displayedReport));
        const hasLanguageChanged = language !== prevLanguageRef.current;
        let isMounted = true;
        
        if (currentContentStr !== displayedContentStr || hasLanguageChanged) {
            const doTranslationAndInit = async () => {
                setIsTranslating(true);
                try {
                    const translated = await translateReport(report, language);
                    if (isMounted) {
                        const finalReport = { ...report, ...translated };
                        setDisplayedReport(finalReport);
                        initChat(finalReport);
                    }
                } catch (e) {
                    console.error("Failed to translate report", e);
                    if (isMounted) {
                        setDisplayedReport(report); // Fallback
                        initChat(report);
                    }
                } finally {
                    if (isMounted) {
                        setIsTranslating(false);
                        prevLanguageRef.current = language;
                    }
                }
            };
            doTranslationAndInit();
        } else if (report.vetChecklist !== displayedReport.vetChecklist) {
            // Only non-translatable data has changed, so update it without re-translating.
            setDisplayedReport(prev => ({...prev, vetChecklist: report.vetChecklist}));
        }

        return () => { isMounted = false; };
    }, [report, language, pet, t, displayedReport]);
    
    // Switch to health tab if there is a concern
    useEffect(() => {
      if(report.sicknessIndicators) {
        setActiveTab('health');
      }
    }, [report.id]);

    const handleSendMessage = async (message: string) => {
        setChatPrompts(null);
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
        setChatMessages(prev => [...prev, userMessage]);
        setIsChatLoading(true);
        
        try {
            const responseText = await sendMessageToChat(message);
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
            setChatMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            console.error("Chat error:", err);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: t('error_chat_response') }] };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const renderSummaryTab = () => (
      <div className="space-y-6">
          <div className="text-center bg-slate-800 p-4 rounded-xl">
              <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">{t('dominant_emotion_label')}</p>
              <p className={`text-5xl font-bold text-teal-400`}>{t(`emotion_${displayedReport.emotion.toLowerCase()}`)}</p>
              <p className="mt-2 text-lg italic text-slate-300">"{displayedReport.translation}"</p>
          </div>
          <WhatToDoNext tips={displayedReport.careTips} t={t} />
          {displayedReport.playPrompts && <PlayPrompts prompts={displayedReport.playPrompts} petName={pet.name} t={t} />}
      </div>
    );
    
    const renderHealthTab = () => (
       <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl shadow-lg text-center animate-fade-in">
            <div className="flex justify-center items-center gap-3">
                <AlertTriangleIcon className="w-8 h-8 text-red-400" />
                <h2 className="text-2xl font-bold text-red-300">{t('health_alert_title')}</h2>
            </div>
            <p className="text-red-300 mt-2 mb-4">{displayedReport.sicknessIndicators?.summary || t('high_pain_desc')}</p>
            <p className="text-xs text-red-400">{t('vet_disclaimer_text')}</p>
        </div>
    );

    const renderDetailsTab = () => (
      <div className="space-y-6">
        <StressSpectrum emotionScores={displayedReport.emotionScores} t={t} dominantEmotion={displayedReport.emotion} />
         {displayedReport.audioAnalysis && (
            <div className="bg-slate-800 p-6 rounded-2xl space-y-4 shadow-lg">
                <h2 className="text-xl font-bold text-teal-400">{t('whats_that_sound_title')}</h2>
                <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <SoundWaveIcon className="w-8 h-8 text-slate-400 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-semibold text-slate-100">{displayedReport.audioAnalysis.vocalizationType}</h3>
                            <p className="text-sm text-slate-400">{displayedReport.audioAnalysis.description}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <MeaningIcon className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-slate-300">{t('what_it_might_mean_title')}</h4>
                        <p className="text-sm text-slate-400">{displayedReport.audioAnalysis.correlation}</p>
                    </div>
                </div>
            </div>
        )}
      </div>
    );

    const ChatInterface = () => {
        const [chatInput, setChatInput] = useState('');
        const messagesEndRef = useRef<HTMLDivElement>(null);
        
        useEffect(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [chatMessages, isChatLoading]);
        
        const handleChatSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (chatInput.trim() && !isChatLoading) {
                handleSendMessage(chatInput.trim());
                setChatInput('');
            }
        };

        const handlePromptClick = (prompt: string) => {
            if (!isChatLoading) {
                handleSendMessage(prompt);
            }
        };

        const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
            const isModel = message.role === 'model';
            return (
                <div className={`flex items-start gap-2.5 ${isModel ? '' : 'justify-end'}`}>
                    {isModel && (
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                            <DrPawsChatIcon className="w-5 h-5" />
                        </div>
                    )}
                    <div className={`max-w-xs md:max-w-sm p-3 rounded-xl ${isModel ? 'bg-slate-700/50 text-slate-300 rounded-tl-none' : 'bg-teal-600 text-white rounded-br-none'}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.parts[0].text}</p>
                    </div>
                </div>
            );
        };

        return (
             <div className="flex flex-col h-full bg-slate-800 rounded-xl p-4">
                <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2">
                    {chatMessages.map((msg, index) => <ChatBubble key={index} message={msg} />)}

                    {chatMessages.length === 1 && !isChatLoading && (
                        <div className="pt-2">
                            {isPromptsLoading ? (
                                <div className="text-center text-xs text-slate-400 italic flex items-center justify-center gap-2">
                                    <SpinnerIcon className="w-3 h-3" />
                                    {t('generating_prompts')}
                                </div>
                            ) : chatPrompts && chatPrompts.length > 0 && (
                                <div className="space-y-2 animate-fade-in-fast">
                                    <p className="text-xs font-semibold text-slate-400 text-center mb-1">{t('suggested_questions_title')}</p>
                                    {chatPrompts.map((prompt, i) => (
                                        <button key={i} onClick={() => handlePromptClick(prompt)} className="w-full text-left text-sm text-slate-300 bg-slate-700/50 hover:bg-slate-700 p-2 rounded-md transition-colors">
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {isChatLoading && (
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0"><DrPawsChatIcon className="w-5 h-5 animate-pulse" /></div>
                            <div className="max-w-xs md:max-w-sm p-3 rounded-xl bg-slate-700/50 rounded-tl-none">
                            <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-teal-500 rounded-full animate-bounce"></span>
                            </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2 flex-shrink-0">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={t('chat_placeholder')}
                        className="flex-grow rounded-lg border-slate-600 bg-slate-900 text-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                        disabled={isChatLoading}
                    />
                    <button type="submit" className="rounded-lg border border-transparent bg-slate-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-500 disabled:bg-slate-500" disabled={isChatLoading || !chatInput.trim()}>
                        {t('chat_send_button')}
                    </button>
                </form>
            </div>
        );
    }


    if (isTranslating) {
       return <div className="flex flex-col items-center justify-center p-12 text-center"><SpinnerIcon className="w-12 h-12 text-teal-400" /><p className="mt-2 text-slate-400">{t('translating_report')}</p></div>
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in text-slate-300">
             <header className="text-center mb-6">
                 <img src={pet.photo || displayedReport.petSnapshot} alt={pet.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-slate-700" />
                 <h1 className="text-3xl font-bold text-white">{t('report_for_pet', {petName: pet.name})}</h1>
                 <p className="text-slate-400">{new Date(displayedReport.timestamp).toLocaleString(language, { dateStyle: 'long', timeStyle: 'short' })}</p>
             </header>

            <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                <nav className="flex border-b border-slate-800">
                    <TabButton tab="summary" activeTab={activeTab} onClick={setActiveTab} Icon={PawPrintIcon}>{t('report_tab_summary')}</TabButton>
                    {displayedReport.sicknessIndicators && <TabButton tab="health" activeTab={activeTab} onClick={setActiveTab} Icon={HealthIcon}>{t('report_tab_health')}</TabButton>}
                    <TabButton tab="details" activeTab={activeTab} onClick={setActiveTab} Icon={ActivityIcon}>{t('report_tab_details')}</TabButton>
                    <TabButton tab="chat" activeTab={activeTab} onClick={setActiveTab} Icon={DrPawsChatIcon}>{t('report_tab_chat')}</TabButton>
                </nav>

                <div className="p-6 min-h-[400px]">
                    {activeTab === 'summary' && renderSummaryTab()}
                    {activeTab === 'health' && renderHealthTab()}
                    {activeTab === 'details' && renderDetailsTab()}
                    {activeTab === 'chat' && <ChatInterface />}
                </div>
            </div>
        </div>
    );
};