

export type AppView = 'swipe' | 'memories' | 'wellness_hub' | 'marketplace' | 'profile';

export type PetType = 'dog' | 'cat' | 'bird' | 'other';
export type Language = 'en' | 'es' | 'fr' | 'de';
export type Theme = 'light' | 'dark';

export const LANGUAGES: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
];

export interface PetProfile {
  id: string;
  name: string;
  petType: PetType;
  photo?: string; // base64 data URL
  age?: string; // e.g., "5 years"
  breed?: string; // e.g., "Golden Retriever"
  breedInfo?: {
    summary: string;
    articles: {
      title: string;
      url: string;
    }[];
  };
  language?: Language;
  gender?: 'male' | 'female' | 'unknown';
}

export interface AudioAnalysis {
  vocalizationType: string; // e.g., 'Purring', 'High-pitched bark', 'Chirp'
  description: string; // e.g., 'A steady, rhythmic breathing sound indicating deep sleep.'
  intensity: number; // 0-100
  correlation: string; // e.g., 'Correlates with contentment and calm.'
}

export interface SleepAnalysis {
  sleepQuality: number; // 0-100
  dreamingPercentage: number; // 0-100
  disturbances: number;
  breathing: string; // e.g., 'Calm', 'Rapid'
  dreamInterpretation?: string; // A whimsical interpretation of the pet's dream.
}

export interface BreathingAnalysis {
  pattern: string; // e.g., 'Calm & Steady', 'Rapid & Shallow', 'Labored'
  rate?: number; // Breaths per minute
  implication: string; // e.g., 'Indicates relaxation.', 'Could be a sign of stress, heat, or exertion.', 'May indicate respiratory distress. Veterinary consultation is recommended.'
}

export interface SymptomObservation {
    area: 'Eyes' | 'Mouth' | 'Tail' | 'Body' | 'Behavior' | 'Vocalization';
    observation: string;
    potentialImplication: string;
    confidence: number; // 0-100 confidence score for this observation
}

export interface SicknessIndicators {
    overallConcernLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
    summary: string;
    observations: SymptomObservation[];
}

export interface VideoTimelineEvent {
    timestamp: string; // e.g., "00:12"
    analysisSummary: string;
    observedSymptoms: string[];
    detectedEmotion?: string; // The primary emotion observed at this specific timestamp.
}

export interface WhatToDoTip {
  icon: 'play' | 'comfort' | 'food' | 'health' | 'attention' | 'calm' | 'training' | 'enrichment';
  title: string;
  description: string;
  category: 'Enrichment' | 'Comfort' | 'Training' | 'Health & Diet' | 'Bonding';
  effort: 'Low' | 'Medium' | 'High';
}

export interface PlayPrompt {
    title: string;
    description: string;
    type: 'physical' | 'digital';
}

export interface VetChecklistEntry {
    key: string; // e.g., 'eating_habits'
    answer: 'yes' | 'no' | 'n/a';
}

export interface PetEmpathyReport {
  emotion: string; // The dominant emotion
  attitude?: string; // A single word describing the pet's demeanor. e.g., Sassy, Cuddly.
  emotionScores: {
    calm: number;
    anxious: number;
    playful: number;
    hungry: number;
    pain: number;
    grumpy: number; // New emotion
  };
  currentNeeds: {
    attention: number;
    play: number;
    comfort: number;
    food: number;
    rest: number;
    health: number;
    water: number;
  };
  translation: string; // A short, one-sentence summary for the main dashboard.
  detailedAnalysis: string; // A longer, more detailed analysis from Dr. Paws.
  careTips: WhatToDoTip[]; // A list of actionable care tips.
  problemSummary?: string; // New summary for dashboard insights
  playPrompts?: PlayPrompt[]; // Optional list of games if the pet is playful.
  audioAnalysis?: AudioAnalysis; // Optional details about vocalizations
  sleepAnalysis?: SleepAnalysis; // Optional sleep analysis
  breathingAnalysis?: BreathingAnalysis; // Optional breathing analysis
  representativeTimestamp?: string; // e.g., "00:08". The timestamp of the best frame to use as a snapshot.
  sicknessIndicators?: SicknessIndicators; // Optional detailed health check results
  videoTimeline?: VideoTimelineEvent[];
  profileHeadshot?: string; // Optional base64 encoded headshot if no profile photo exists
}

export interface HistoricReport extends PetEmpathyReport {
  id: string;
  petId: string;
  petName: string;
  timestamp: string;
  userNote?: string;
  petSnapshot?: string; // base64 data URL of the extracted representative frame
  emotionSnapshots?: string[]; // base64 data URLs for emotion collage
  sourceVideoCount?: number; // How many videos have been analyzed for this report
  vetChecklist?: VetChecklistEntry[]; // User-answered checklist for the vet
  score?: number; // Gamification score for this report
  isSummaryReport?: boolean; // Flag for combined analysis reports
  sourceReportIds?: string[]; // IDs of reports used for a summary
}

export interface PetPersonalityProfile {
  title: string; // e.g., "Cuddle Connoisseur", "Curious Explorer"
  description: string; // A paragraph describing the personality.
  dominantTraits: {
      trait: string; // e.g., "Playful", "Loves Comfort", "Vocal"
      score: number; // 0-100
  }[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface LiveTranscriptMessage {
    speaker: 'user' | 'model';
    text: string;
}

export interface DailyTipsResponse {
    dog: string;
    cat: string;
    bird: string;
    other: string;
}

export interface PredictiveTip {
    prediction: string;
    tip: string;
}

export interface ProductRecommendation {
    category: string;
    productName: string;
    description: string;
    googleShoppingQuery: string;
}

export interface CommunityLink {
    title: string;
    url: string;
    description: string;
}

export interface ShoppingRecommendations {
    recommendations: ProductRecommendation[];
    communityLinks?: {
        forums: CommunityLink[];
        videos: CommunityLink[];
    };
}

export type PetNeed = 'attention' | 'play' | 'comfort' | 'food' | 'rest' | 'health' | 'water' | 'None';

export interface AudioCheckinResult {
  vocalizationType: string;
  primaryNeed: PetNeed;
  explanation: string;
  actionableTip: string;
}

export interface NeedRecommendation {
    title: string;
    recommendation: string;
    tips: string[];
}