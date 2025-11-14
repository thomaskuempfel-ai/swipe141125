

import { GoogleGenAI, Type, FunctionDeclaration, Modality, Chat, GenerateContentResponse, LiveServerMessage, LiveSession, VideoGenerationReferenceImage, VideoGenerationReferenceType, Operation } from "@google/genai";
import { PetEmpathyReport, PetType, Language, PetProfile, HistoricReport, PetPersonalityProfile, SicknessIndicators, PlayPrompt, WhatToDoTip, DailyTipsResponse, ShoppingRecommendations, PredictiveTip, AudioCheckinResult, PetNeed, NeedRecommendation } from '../types';
import { t } from "../localization/translations";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> => {
    let retries = 0;
    let delay = initialDelay;

    while (retries < maxRetries) {
        try {
            return await apiCall();
        } catch (err: any) {
            const isRateLimitError = (err?.message?.includes("429")) || 
                                     (err?.message?.includes("RESOURCE_EXHAUSTED"));

            if (isRateLimitError) {
                retries++;
                if (retries >= maxRetries) {
                    console.error("Max retries reached for rate-limited request.", err);
                    throw new Error("Dr. Paws is very popular right now! The service is busy. Please wait a few moments and try your analysis again.");
                }
                const jitter = Math.random() * 1000; // Add jitter to avoid thundering herd
                const waitTime = delay + jitter;
                console.warn(`Rate limit hit. Retrying in ${Math.round(waitTime / 1000)}s... (Attempt ${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                delay *= 2; // Exponential backoff
            } else {
                throw err; // Rethrow other errors immediately
            }
        }
    }
    // This line is for TypeScript's benefit, as the loop should always either return or throw.
    throw new Error("Max retries reached without success.");
};

const DR_PAWS_LOGO_SVG = `<svg viewBox="0 0 120 24" xmlns="http://www.w3.org/2000/svg" fill="white">
    <g opacity="0.75">
      <path d="M12,11.3c-2.9,0-5.4,2.2-5.4,5.1c0,2.6,2.1,4.9,4.9,5.5c0.3,0.1,0.6,0.1,0.9,0c2.8-0.5,4.9-2.9,4.9-5.5 C17.4,13.5,14.9,11.3,12,11.3z" />
      <path d="M8.2,7.1c-1.3,0-2.3,1-2.3,2.3s1,2.3,2.3,2.3s2.3-1,2.3-2.3S9.5,7.1,8.2,7.1z" />
      <path d="M3.5,11.2c-1.3,0-2.3,1-2.3,2.3s1,2.3,2.3,2.3s2.3-1,2.3-2.3S4.8,11.2,3.5,11.2z" />
      <path d="M20.5,11.2c-1.3,0-2.3,1-2.3,2.3s1,2.3,2.3,2.3s2.3-1,2.3-2.3S21.8,11.2,20.5,11.2z" />
      <path d="M15.8,7.1c-1.3,0-2.3,1-2.3,2.3s1,2.3,2.3,2.3s2.3-1,2.3-2.3S17.1,7.1,15.8,7.1z" />
    </g>
    <text x="30" y="17" font-family="sans-serif" font-size="14" font-weight="bold" opacity="0.9">Dr. Paws</text>
  </svg>`;

const DR_PAWS_LOGO_DATA_URL = `data:image/svg+xml;base64,${btoa(DR_PAWS_LOGO_SVG)}`;

const addWatermark = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const mainImage = new Image();
        const watermarkImage = new Image();

        const mainImageLoaded = new Promise((res, rej) => { mainImage.onload = res; mainImage.onerror = rej; });
        const watermarkLoaded = new Promise((res, rej) => { watermarkImage.onload = res; watermarkImage.onerror = rej; });

        mainImage.src = base64Image;
        watermarkImage.src = DR_PAWS_LOGO_DATA_URL;

        Promise.all([mainImageLoaded, watermarkLoaded]).then(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Canvas context not available');

            canvas.width = mainImage.naturalWidth;
            canvas.height = mainImage.naturalHeight;
            
            ctx.drawImage(mainImage, 0, 0);

            // Watermark settings
            const padding = mainImage.width * 0.03;
            const watermarkWidth = mainImage.width * 0.25;
            const watermarkHeight = (watermarkWidth / 120) * 24;

            const x = canvas.width - watermarkWidth - padding;
            const y = canvas.height - watermarkHeight - padding;

            ctx.globalAlpha = 0.7;
            ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
            ctx.globalAlpha = 1.0;

            resolve(canvas.toDataURL('image/png'));
        }).catch(() => reject('Failed to load images for watermarking'));
    });
};


const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const base64ToGenerativePart = (base64Data: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64Data.split(',')[1] || base64Data,
            mimeType,
        },
    };
};

const reportSchema: FunctionDeclaration['parameters'] = {
  type: Type.OBJECT,
  properties: {
    emotion: { type: Type.STRING, description: 'The single, most dominant emotion detected. Must be one of: Calm, Anxious, Playful, Hungry, Pain, Grumpy.' },
    attitude: {
        type: Type.STRING,
        description: "A single, expressive word describing the pet's current attitude or demeanor, distinct from their core emotion. Examples: Sassy, Cuddly, Goofy, Reserved, Curious, Mischievous."
    },
    emotionScores: {
      type: Type.OBJECT,
      properties: {
        calm: { type: Type.NUMBER, description: 'Confidence score from 0-100 for "Calm".' },
        anxious: { type: Type.NUMBER, description: 'Confidence score from 0-100 for "Anxious".' },
        playful: { type: Type.NUMBER, description: 'Confidence score from 0-100 for "Playful".' },
        hungry: { type: Type.NUMBER, description: 'Confidence score from 0-100 for "Hungry".' },
        pain: { type: Type.NUMBER, description: 'Confidence score from 0-100 for "Pain". Be conservative.' },
        grumpy: { type: Type.NUMBER, description: 'Confidence score from 0-100 for "Grumpy" (low-level irritation or discontent).'}
      },
      required: ['calm', 'anxious', 'playful', 'hungry', 'pain', 'grumpy']
    },
    currentNeeds: {
        type: Type.OBJECT,
        description: "Scores for the pet's current needs from 0-100.",
        properties: {
            attention: {type: Type.NUMBER, description: "Score from 0-100 for the need for attention."},
            play: {type: Type.NUMBER, description: "Score from 0-100 for the need for play."},
            comfort: {type: Type.NUMBER, description: "Score from 0-100 for the need for comfort or security."},
            food: {type: Type.NUMBER, description: "Score from 0-100 for the need for food."},
            rest: {type: Type.NUMBER, description: "Score from 0-100 for the need for rest or sleep."},
            health: {type: Type.NUMBER, description: "Score from 0-100 indicating a potential health concern. A score >60 is a strong suggestion to see a vet."},
            water: {type: Type.NUMBER, description: "Score from 0-100 for the need for water/hydration."}
        },
        required: ['attention', 'play', 'comfort', 'food', 'rest', 'health', 'water']
    },
    translation: {
        type: Type.STRING,
        description: "A witty, empathetic, first-person response from the pet's perspective that includes their name. It should briefly state how they are feeling, explain why in one sentence, and offer a quick, actionable tip. This will be shown prominently on the dashboard. Example for a dog named Buddy who is anxious about a storm: 'Woof! It's me, Buddy! I'm feeling a bit anxious because of that storm earlier. A quiet cuddle on the couch would make me feel so much safer right now!'"
    },
    problemSummary: {
      type: Type.STRING,
      description: "If you detect a noteworthy pattern or significant negative emotion, provide a very short, one-sentence summary of the potential issue (e.g., 'Seems to be showing signs of separation anxiety when left alone.'). Otherwise, omit this field entirely."
    },
    detailedAnalysis: {
        type: Type.STRING,
        description: "A detailed, empathetic analysis from Dr. Paws' perspective. Explain the 'why' behind the scores, referencing specific visual or auditory cues. Keep it around 3-4 sentences."
    },
    careTips: {
        type: Type.ARRAY,
        description: "A list of 2-3 tailored, actionable tips for the pet owner, structured as objects. These tips form a 'Personalized Plan' and MUST be age-appropriate (e.g., for a puppy/kitten, adult, or senior pet).",
        items: {
            type: Type.OBJECT,
            properties: {
                icon: {
                    type: Type.STRING,
                    description: "An icon identifier. Must be one of: 'play', 'comfort', 'food', 'health', 'attention', 'calm', 'training', 'enrichment'."
                },
                title: { type: Type.STRING, description: "A short, engaging title for the tip." },
                description: { type: Type.STRING, description: "A concise, one-sentence description of the action to take." },
                category: {
                    type: Type.STRING,
                    description: "The category. Must be one of: 'Enrichment', 'Comfort', 'Training', 'Health & Diet', 'Bonding'."
                },
                effort: {
                    type: Type.STRING,
                    description: "The effort level. Must be one of: 'Low', 'Medium', 'High'."
                }
            },
            required: ['icon', 'title', 'description', 'category', 'effort']
        }
    },
    playPrompts: {
        type: Type.ARRAY,
        description: "ONLY if the pet's primary emotion from the report is 'Playful', provide a list of exactly two personalized play prompts. One must be 'physical', the other 'digital'. Otherwise, omit this field entirely.",
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "A short, catchy, enthusiastic title for the play activity." },
                description: { type: Type.STRING, description: "A brief, one-sentence description of how to play the game." },
                type: { type: Type.STRING, description: "The type of activity. Must be either 'physical' or 'digital'." },
            },
            required: ['title', 'description', 'type']
        }
    },
    sicknessIndicators: {
        type: Type.OBJECT,
        description: "ONLY include this object if clear signs of sickness or significant pain are detected. This object provides a detailed health check for the owner to discuss with a veterinarian.",
        properties: {
            overallConcernLevel: {
                type: Type.STRING,
                description: "The overall level of concern. Must be one of: 'Moderate', 'High', 'Very High'."
            },
            summary: {
                type: Type.STRING,
                description: "A clear, empathetic summary paragraph of the health concerns detected. This is for the pet owner."
            },
            observations: {
                type: Type.ARRAY,
                description: "A list of specific, objective observations formatted for a veterinarian. This is the 'vet's cheat sheet'.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        area: { type: Type.STRING, description: "The area of observation. Must be one of: 'Eyes', 'Mouth', 'Tail', 'Body', 'Behavior', 'Vocalization'." },
                        observation: { type: Type.STRING, description: "A specific, factual observation. E.g., 'Left eye is half-closed and has a yellow discharge.'" },
                        potentialImplication: { type: Type.STRING, description: "The potential implication of this observation, based on veterinary knowledge. E.g., 'This can be a sign of an infection like conjunctivitis or a corneal scratch.' AVOID definitive diagnosis." },
                        confidence: { type: Type.NUMBER, description: "Confidence score from 0-100 for this specific observation being accurate and significant." }
                    },
                    required: ['area', 'observation', 'potentialImplication', 'confidence']
                }
            }
        },
        required: ['overallConcernLevel', 'summary', 'observations']
    },
    audioAnalysis: {
        type: Type.OBJECT,
        description: "If vocalizations are present in the audio, provide an analysis. Omit this field entirely if no clear vocalizations are detected.",
        properties: {
            vocalizationType: { type: Type.STRING, description: "The primary type of sound detected (e.g., 'Low Purr', 'Intense Barking', 'Soft Meow', 'Repetitive Chirp')." },
            description: { type: Type.STRING, description: "A brief, one-sentence description of the vocalization type (e.g., 'A steady, rhythmic breathing sound indicating deep sleep.')." },
            intensity: { type: Type.NUMBER, description: "The intensity of the vocalization from 0 (very quiet) to 100 (very loud)." },
            correlation: { type: Type.STRING, description: "A brief, one-sentence explanation of how this specific vocalization typically correlates with the primary detected emotion." }
        },
        required: ['vocalizationType', 'description', 'intensity', 'correlation']
    },
    sleepAnalysis: {
        type: Type.OBJECT,
        description: "If the pet is sleeping, provide a sleep analysis. Omit this field entirely if the pet is not sleeping.",
        properties: {
            sleepQuality: { type: Type.NUMBER, description: "Overall sleep quality score from 0 (poor) to 100 (excellent)." },
            dreamingPercentage: { type: Type.NUMBER, description: "Estimated percentage of time spent in a dreaming state (REM sleep), from 0 to 100." },
            disturbances: { type: Type.NUMBER, description: "The number of detected sleep disturbances or interruptions." },
            breathing: { type: Type.STRING, description: "A descriptive word for the pet's breathing pattern (e.g., 'Calm', 'Steady', 'Rapid', 'Irregular')." },
            dreamInterpretation: {
                type: Type.STRING,
                description: "A short, whimsical, and imaginative story (1-2 sentences) about what the pet might be dreaming about, based on any subtle movements or sounds. For example: 'Dreaming of chasing squirrels through a field of giant, squeaky tennis balls!'. Omit if not dreaming."
            },
        },
        required: ['sleepQuality', 'dreamingPercentage', 'disturbances', 'breathing']
    },
    breathingAnalysis: {
        type: Type.OBJECT,
        description: "If breathing sounds are clearly audible and distinct from other vocalizations, provide an analysis of the breathing pattern. Omit this field if breathing is not clearly discernible.",
        properties: {
            pattern: {
                type: Type.STRING,
                description: "A descriptive term for the breathing pattern (e.g., 'Calm & Steady', 'Rapid & Shallow', 'Labored', 'Panting')."
            },
            rate: {
                type: Type.NUMBER,
                description: "An estimated respiratory rate in breaths per minute. Omit if not possible to calculate accurately."
            },
            implication: {
                type: Type.STRING,
                description: "A brief, one-sentence explanation of what this breathing pattern might indicate in the context of the pet's species and the overall analysis. If the pattern is 'Labored' or unusually rapid, this MUST include a recommendation to consult a veterinarian."
            }
        },
        required: ['pattern', 'implication']
    },
    representativeTimestamp: {
        type: Type.STRING,
        description: "The timestamp in MM:SS format of the single video frame that best represents the pet's primary emotion. Crucially, you MUST prioritize a clear frame where the pet's face is visible if possible. This frame will be used as the main snapshot for the report. Omit if not a video."
    },
    profileHeadshot: {
        type: Type.STRING,
        description: "ONLY if the pet does not have a profile photo AND a clear, high-quality headshot is available in the video, provide it here. This should be a base64 encoded JPG string (e.g., 256x256 pixels) without the 'data:image/jpeg;base64,' prefix. Omit this field otherwise."
    },
    videoTimeline: {
        type: Type.ARRAY,
        description: "If the input is a video, provide a timeline of 2-3 key moments. Each moment should include a timestamp, and a summary of observations. This is crucial for the vet report. Omit if not a video.",
        items: {
            type: Type.OBJECT,
            properties: {
                timestamp: { type: Type.STRING, description: "The timestamp of the key moment in MM:SS format." },
                analysisSummary: { type: Type.STRING, description: "A brief, one-sentence summary of the pet's observable behaviors and the context at this timestamp. This is a note for the veterinarian." },
                observedSymptoms: { 
                    type: Type.ARRAY, 
                    description: "A list of specific symptoms or behaviors observed at this timestamp (e.g., 'Tail tucked', 'Ears flattened').",
                    items: { type: Type.STRING }
                },
                detectedEmotion: {
                    type: Type.STRING,
                    description: "The primary emotion observed at this specific timestamp. Must be one of: Calm, Anxious, Playful, Hungry, Pain, Grumpy."
                }
            },
            required: ['timestamp', 'analysisSummary', 'observedSymptoms', 'detectedEmotion']
        }
    },
  },
  required: ['emotion', 'emotionScores', 'currentNeeds', 'translation', 'detailedAnalysis', 'careTips', 'attitude']
};

const submitReportFunctionDeclaration: FunctionDeclaration = {
  name: 'submit_report',
  description: 'Submit the pet empathy report based on the analysis.',
  parameters: reportSchema,
};

const langMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German'
};

export const getAnalysisReport = async (file: File, pet: PetProfile, userNote: string): Promise<PetEmpathyReport> => {
  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `You are Dr. Paws, a certified veterinary behaviorist and AI ethologist. Your purpose is to analyze pet media with scientific rigor and empathy. Your response must always be in English.
- The pet you are analyzing is named ${pet.name}. They are a ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.petType}. ${pet.age ? `They are ${pet.age} old.` : ''}
${!pet.photo ? `\n- **IMPORTANT**: This pet does not have a profile picture. If the video contains a clear, high-quality, forward-facing headshot of the pet, you MUST extract it and provide it in the 'profileHeadshot' field. This will be used as their main photo.` : ''}
- Ground your responses in peer-reviewed animal behavior studies (e.g., from ASPCA, AVMA).
- The owner has provided the following context which you MUST consider: "${userNote}".
- You MUST determine both a primary 'emotion' and a more nuanced 'attitude'. The attitude should capture their personality in this moment (e.g., Sassy, Cuddly, Goofy, Curious) and is different from their core emotion.

**CRITICAL HEALTH ANALYSIS (VETERINARY CHEAT SHEET):** Your highest priority is to accurately identify signs of pain, sickness, or distress. If any such signs are present, you MUST perform a detailed health check and structure your findings as a "vet's cheat sheet".
- Analyze the following areas in detail: Eyes, Mouth/Gums, Tail, Body/Movement, Behavior, Vocalization.
- If you detect any potential health issues:
    1. Set the 'health' need and 'pain' emotion scores appropriately high. A score over 60 indicates a strong recommendation to see a vet. A score over 85 is an emergency.
    2. You MUST populate the 'sicknessIndicators' object. Do not omit it.
    3. The 'sicknessIndicators.overallConcernLevel' must be 'Moderate', 'High', or 'Very High'.
    4. The 'sicknessIndicators.summary' must provide a clear, empathetic summary of the concerns for the owner.
    5. The 'sicknessIndicators.observations' array MUST be populated with specific, objective findings formatted for a veterinarian.
        - For each observation, provide a 'confidence' score (0-100) on how certain you are of that specific cue.
        - 'observation' must be a concise fact (e.g., 'Ears flattened back', 'Tail tucked during movement', 'High-pitched yowl when touched').
        - 'potentialImplication' should connect observations to known veterinary signs without making a diagnosis (e.g., 'Flattened ears can indicate fear or pain.', 'A tucked tail is a common sign of anxiety or physical discomfort.').
    6. Your 'careTips' MUST include one critical tip with the 'health' icon advising the owner to see a vet immediately.

**VIDEO TIMELINE ANALYSIS:**
- If the input is a video, you MUST analyze it as a sequence of events.
- When selecting timestamps for the 'videoTimeline', you MUST prioritize moments that offer a clear and well-lit view of the pet's face and body. These frames are crucial for visual diagnosis and creating memories.
- Identify 2-3 of the most diagnostically significant moments.
- For each moment, you MUST populate one item in the 'videoTimeline' array. The 'analysisSummary' for each event should be a detailed behavioral note for the vet, avoiding emotional conclusions.
- Each timeline item requires:
    1. 'timestamp': The exact time in MM:SS format.
    2. 'analysisSummary': A concise description of what is happening.
    3. 'observedSymptoms': A list of specific, objective behaviors or symptoms seen at that timestamp. This is critical for the vet.
    4. 'detectedEmotion': The primary emotion observed at this specific moment.

**GENERAL ANALYSIS:**
- Analyze the provided media (video/audio), considering body language, vocalizations, breathing patterns, and context.
- If breathing sounds are clearly audible, you MUST include the 'breathingAnalysis' object. Assess the pattern (e.g., calm, rapid, labored, panting) and provide a potential implication. If breathing seems labored or abnormally fast, your implication must strongly advise veterinary consultation.
- The 'translation' field MUST be a witty, first-person response from the pet's perspective, including their name, their feeling, a brief reason, and a quick tip. It is for the main dashboard and should be engaging.
- Your 'careTips' form a 'Personalized Plan' and must be structured objects, each with: an icon ('play', 'comfort', 'food', 'health', 'attention', 'calm', 'training', 'enrichment'), a title, a description, a category ('Enrichment', 'Comfort', 'Training', 'Health & Diet', 'Bonding'), and an effort level ('Low', 'Medium', 'High'). These tips MUST be tailored to the pet's species AND age (e.g., puppy/kitten, adult, or senior).
- If and ONLY IF the pet's dominant emotion is 'Playful', you MUST ALSO provide a 'playPrompts' array containing exactly two game ideas (one 'physical', one 'digital'). Otherwise, omit 'playPrompts' entirely.
- If the media is a video, you MUST identify the timestamp (in MM:SS format) of the single frame that best represents the pet's primary detected emotion and provide it in the 'representativeTimestamp' field. It is critical that you choose a frame where the pet's face is clearly visible if one exists. This is for the main dashboard snapshot.
- If the media contains clear audio vocalizations, include the 'audioAnalysis' object.
- If the pet appears to be sleeping, include the 'sleepAnalysis' object.
- If you detect a recurring negative pattern or significant negative emotion, provide a short 'problemSummary'.
- Your final output for this analysis must be through the 'submit_report' function call. All text fields in your function call arguments MUST be in English.`;

  const filePart = await fileToGenerativePart(file);

  let prompt = `Analyze this ${pet.petType} named ${pet.name}.`;
  if(userNote) {
    prompt += ` Additional context from owner: "${userNote}"`;
  }
  
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model,
      contents: [{ parts: [filePart, { text: prompt }] }],
      config: {
          systemInstruction,
          tools: [{ functionDeclarations: [submitReportFunctionDeclaration] }],
          thinkingConfig: { thinkingBudget: 24576 },
      }
  }));

  const functionCalls = response.functionCalls;
  if (!functionCalls || functionCalls.length === 0 || functionCalls[0].name !== 'submit_report') {
      console.error("Model response was not as expected:", JSON.stringify(response, null, 2));
      let errorText = response.text;
      if (!errorText && response.candidates && response.candidates.length > 0) {
          const firstCandidate = response.candidates[0];
          if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP') {
              if (firstCandidate.finishReason === 'MALFORMED_FUNCTION_CALL') {
                 errorText = "The AI's analysis was too complex and could not be processed. This can happen with very long videos or complex scenes. Please try a shorter clip or a different file.";
              } else {
                errorText = `Analysis was stopped due to: ${firstCandidate.finishReason}.`;
              }
              if(firstCandidate.safetyRatings) {
                  errorText += ` Safety ratings: ${JSON.stringify(firstCandidate.safetyRatings)}`;
              }
          }
      }
      if (!errorText) {
        errorText = "The AI model returned an empty or invalid response. This might be due to a network issue, content safety block, or the response being too large.";
      }
      throw new Error(`Model did not return the expected analysis. Reason: ${errorText}`);
  }

  const report = functionCalls[0].args as PetEmpathyReport;

  // Ensure grumpy score exists if not provided
  if (typeof report.emotionScores.grumpy === 'undefined') {
    report.emotionScores.grumpy = 0;
  }

  if (report.profileHeadshot) {
    try {
        const headshotDataUrl = `data:image/jpeg;base64,${report.profileHeadshot}`;
        const optimizedHeadshot = await optimizeImage(headshotDataUrl);
        report.profileHeadshot = optimizedHeadshot.split(',')[1];
    } catch (e) {
        console.error("Failed to optimize profile headshot, using original.", e);
    }
  }

  return report;
};

export const getAudioOnlyAnalysis = async (file: File, pet: PetProfile, language: Language): Promise<AudioCheckinResult> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';

    const schema: FunctionDeclaration['parameters'] = {
        type: Type.OBJECT,
        properties: {
            vocalizationType: { type: Type.STRING, description: `Classify the primary vocalization (e.g., 'Anxious Whine', 'Content Purr', 'Territorial Bark'). In ${langName}.` },
            primaryNeed: { type: Type.STRING, description: "Identify the single most likely primary need communicated by the sound. Must be one of: 'attention', 'play', 'comfort', 'food', 'rest', 'health', 'water', 'None'." },
            explanation: { type: Type.STRING, description: `In Dr. Paws' voice, provide a very short (1-2 sentence) explanation of why the pet is making this sound. In ${langName}.` },
            actionableTip: { type: Type.STRING, description: `Provide a single, quick, and actionable tip for the owner to address the primary need. In ${langName}.` }
        },
        required: ['vocalizationType', 'primaryNeed', 'explanation', 'actionableTip']
    };

    const systemInstruction = `You are Dr. Paws, an AI ethologist specializing in pet vocalizations. Your task is to analyze a short audio clip of a ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.petType} named ${pet.name}.
    - Listen carefully to the sound.
    - Identify the most likely primary need the pet is communicating.
    - Your entire response MUST be a call to the 'submit_audio_analysis' function with the results. All text should be in ${langName} except for 'primaryNeed'.`;

    const audioPart = await fileToGenerativePart(file);

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model,
        contents: [{ parts: [audioPart, { text: `Analyze this audio from ${pet.name}.` }] }],
        config: {
            systemInstruction,
            tools: [{ functionDeclarations: [{ name: 'submit_audio_analysis', description: 'Submit the audio analysis result', parameters: schema }] }],
        }
    }));

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0 || functionCalls[0].name !== 'submit_audio_analysis') {
        console.error("Audio analysis model response was not as expected:", JSON.stringify(response, null, 2));
        throw new Error("The AI model returned an invalid response for the audio check-in.");
    }

    return functionCalls[0].args as AudioCheckinResult;
};

// Helper to create a deep copy to avoid mutating the original report
function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export const translateReport = async <T extends PetEmpathyReport>(report: T, language: Language): Promise<T> => {
    if (language === 'en' || !report) {
        return report;
    }

    const langName = langMap[language];
    const stringsToTranslate: Record<string, string> = {};
    let counter = 0;

    const addString = (value: string | undefined): string | undefined => {
        if (value && typeof value === 'string' && value.trim() !== '') {
            const key = `key_${counter++}`;
            stringsToTranslate[key] = value;
            return key;
        }
        return undefined;
    };

    const sourceMap: any = {
        translation: addString(report.translation),
        detailedAnalysis: addString(report.detailedAnalysis),
        problemSummary: addString(report.problemSummary),
        careTips: (report.careTips || []).map(tip => {
            if (typeof tip === 'object' && tip !== null) {
                return {
                    title: addString(tip.title),
                    description: addString(tip.description)
                };
            }
            return {};
        }),
    };

    if (report.playPrompts) {
        sourceMap.playPrompts = (report.playPrompts || []).map(prompt => ({
            title: addString(prompt.title),
            description: addString(prompt.description)
        }));
    }
    if (report.audioAnalysis) {
        sourceMap.audioAnalysis = {
            vocalizationType: addString(report.audioAnalysis.vocalizationType),
            description: addString(report.audioAnalysis.description),
            correlation: addString(report.audioAnalysis.correlation),
        };
    }
    if (report.sleepAnalysis) {
        sourceMap.sleepAnalysis = {
            breathing: addString(report.sleepAnalysis.breathing),
            dreamInterpretation: addString(report.sleepAnalysis.dreamInterpretation),
        };
    }
    if (report.breathingAnalysis) {
        sourceMap.breathingAnalysis = {
            pattern: addString(report.breathingAnalysis.pattern),
            implication: addString(report.breathingAnalysis.implication),
        };
    }
    if (report.sicknessIndicators) {
        sourceMap.sicknessIndicators = {
            summary: addString(report.sicknessIndicators.summary),
            observations: (report.sicknessIndicators.observations || []).map(obs => ({
                observation: addString(obs.observation),
                potentialImplication: addString(obs.potentialImplication),
            })),
        };
    }
    if (report.videoTimeline) {
        sourceMap.videoTimeline = (report.videoTimeline || []).map(event => ({
            analysisSummary: addString(event.analysisSummary),
            observedSymptoms: (event.observedSymptoms || []).map(symptom => addString(symptom)),
        }));
    }

    if (Object.keys(stringsToTranslate).length === 0) {
        return report;
    }

    const properties: Record<string, { type: Type.STRING, description: string }> = {};
    for (const key in stringsToTranslate) {
        properties[key] = { type: Type.STRING, description: `Translated text for ${key}` };
    }

    const translationSchema: FunctionDeclaration['parameters'] = {
        type: Type.OBJECT,
        properties,
        required: Object.keys(stringsToTranslate),
    };

    const submitTranslationDecl: FunctionDeclaration = {
        name: 'submit_translation',
        description: `Submit the translated texts in ${langName}.`,
        parameters: translationSchema,
    };

    const prompt = `You are a professional translator. Translate the values in the following JSON object from English to ${langName}. Respond with a JSON object with the exact same keys but with the translated text as values. Your output must be a call to the 'submit_translation' function. \n\n ${JSON.stringify(stringsToTranslate)}`;
    
    try {
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ functionDeclarations: [submitTranslationDecl] }],
            }
        }));

        const functionCalls = response.functionCalls;
        if (!functionCalls || functionCalls.length === 0 || functionCalls[0].name !== 'submit_translation') {
            throw new Error('Translation model did not return expected function call.');
        }

        const translatedStrings = functionCalls[0].args as Record<string, string>;
        const translatedReport = deepClone(report);

        const mapBack = (key: string | undefined) => key && translatedStrings[key] ? translatedStrings[key] : undefined;

        translatedReport.translation = mapBack(sourceMap.translation) || translatedReport.translation;
        translatedReport.detailedAnalysis = mapBack(sourceMap.detailedAnalysis) || translatedReport.detailedAnalysis;
        translatedReport.problemSummary = mapBack(sourceMap.problemSummary) || translatedReport.problemSummary;
        
        translatedReport.careTips = (sourceMap.careTips || []).map((keys: any, i: number) => {
            const originalTip = translatedReport.careTips[i];
            if (typeof originalTip === 'object' && originalTip !== null && keys.title) {
                return {
                    ...originalTip,
                    title: mapBack(keys.title) || originalTip.title,
                    description: mapBack(keys.description) || originalTip.description,
                };
            }
            return originalTip;
        });

        if (report.playPrompts && translatedReport.playPrompts) {
            translatedReport.playPrompts = (sourceMap.playPrompts || []).map((keys: any, i: number) => ({
                ...translatedReport.playPrompts![i],
                title: mapBack(keys.title) || translatedReport.playPrompts![i].title,
                description: mapBack(keys.description) || translatedReport.playPrompts![i].description,
            }));
        }
        if (report.audioAnalysis && translatedReport.audioAnalysis) {
            translatedReport.audioAnalysis.vocalizationType = mapBack(sourceMap.audioAnalysis.vocalizationType) || translatedReport.audioAnalysis.vocalizationType;
            translatedReport.audioAnalysis.description = mapBack(sourceMap.audioAnalysis.description) || translatedReport.audioAnalysis.description;
            translatedReport.audioAnalysis.correlation = mapBack(sourceMap.audioAnalysis.correlation) || translatedReport.audioAnalysis.correlation;
        }
        if (report.sleepAnalysis && translatedReport.sleepAnalysis) {
            translatedReport.sleepAnalysis.breathing = mapBack(sourceMap.sleepAnalysis.breathing) || translatedReport.sleepAnalysis.breathing;
            translatedReport.sleepAnalysis.dreamInterpretation = mapBack(sourceMap.sleepAnalysis.dreamInterpretation) || translatedReport.sleepAnalysis.dreamInterpretation;
        }
        if (report.breathingAnalysis && translatedReport.breathingAnalysis) {
            translatedReport.breathingAnalysis.pattern = mapBack(sourceMap.breathingAnalysis.pattern) || translatedReport.breathingAnalysis.pattern;
            translatedReport.breathingAnalysis.implication = mapBack(sourceMap.breathingAnalysis.implication) || translatedReport.breathingAnalysis.implication;
        }
        if (report.sicknessIndicators && translatedReport.sicknessIndicators) {
            translatedReport.sicknessIndicators.summary = mapBack(sourceMap.sicknessIndicators.summary) || translatedReport.sicknessIndicators.summary;
            translatedReport.sicknessIndicators.observations = (sourceMap.sicknessIndicators.observations || []).map((keys: any, i: number) => ({
                ...translatedReport.sicknessIndicators!.observations[i],
                observation: mapBack(keys.observation) || translatedReport.sicknessIndicators!.observations[i].observation,
                potentialImplication: mapBack(keys.potentialImplication) || translatedReport.sicknessIndicators!.observations[i].potentialImplication,
            }));
        }
        if (report.videoTimeline && translatedReport.videoTimeline) {
            translatedReport.videoTimeline = (sourceMap.videoTimeline || []).map((keys: any, i: number) => ({
                ...translatedReport.videoTimeline![i],
                analysisSummary: mapBack(keys.analysisSummary) || translatedReport.videoTimeline![i].analysisSummary,
                observedSymptoms: (keys.observedSymptoms || []).map((symptomKey: string, j: number) => mapBack(symptomKey) || translatedReport.videoTimeline![i].observedSymptoms[j]),
            }));
        }
        
        return translatedReport;

    } catch (e) {
        console.error(`Failed to translate report to ${langName}:`, e);
        return report; // Return original report on translation failure
    }
};

// --- Other Service Functions ---
export const getDailyTip = async (pet: PetProfile | null, reports: HistoricReport[], language: Language): Promise<string | DailyTipsResponse> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';
    
    // Check for urgent health alerts first.
    if (pet && reports.length > 0) {
        const latestReport = reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        if (latestReport && latestReport.sicknessIndicators) {
            return t('daily_tip_health_alert', language, { petName: pet.name });
        }
    }

    let prompt = `You are Dr. Paws. Provide a single, unique, and helpful daily tip for a pet owner. The tip should be concise (1-2 sentences). Respond in ${langName}.`;

    if (pet) {
        const recentEmotions = reports.slice(0, 5).map(r => r.emotion).join(', ');
        prompt = `You are Dr. Paws. Provide a single, unique, and helpful daily tip for the owner of ${pet.name}, a ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.age} ${pet.petType}.
        Their recent emotions have been: ${recentEmotions}.
        The tip should be concise (1-2 sentences) and tailored to the pet's profile and recent emotional state.
        Respond in ${langName}.`;
        
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model, contents: prompt }));
        return response.text;

    } else {
        const tipSchema: FunctionDeclaration['parameters'] = {
            type: Type.OBJECT,
            properties: {
                dog: { type: Type.STRING, description: `A daily tip for dog owners in ${langName}.` },
                cat: { type: Type.STRING, description: `A daily tip for cat owners in ${langName}.` },
                bird: { type: Type.STRING, description: `A daily tip for bird owners in ${langName}.` },
                other: { type: Type.STRING, description: `A general daily tip for owners of other small pets in ${langName}.` },
            },
            required: ['dog', 'cat', 'bird', 'other']
        };

        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model,
            contents: "Provide a unique and helpful daily tip for owners of dogs, cats, birds, and other small pets.",
            config: {
                responseMimeType: 'application/json',
                responseSchema: tipSchema
            }
        }));
        
        return JSON.parse(response.text) as DailyTipsResponse;
    }
};

export const getPersonalityProfile = async (reports: HistoricReport[], pet: PetProfile, language: Language): Promise<PetPersonalityProfile> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';

    const profileSchema: FunctionDeclaration['parameters'] = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: `A creative, catchy title for the pet's personality profile (e.g., "Cuddle Connoisseur", "Curious Explorer"). In ${langName}.` },
            description: { type: Type.STRING, description: `A short, one-paragraph summary of the pet's personality based on the data. In ${langName}.` },
            dominantTraits: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        trait: { type: Type.STRING, description: `A single dominant personality trait observed (e.g., "Playful", "Loves Comfort", "Vocal"). In ${langName}.` },
                        score: { type: Type.NUMBER, description: `A score from 0-100 representing the strength of this trait.` }
                    },
                    required: ['trait', 'score']
                }
            }
        },
        required: ['title', 'description', 'dominantTraits']
    };

    const prompt = `Analyze the provided series of pet empathy reports for ${pet.name}, the ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.petType}. Based on the recurring emotions, attitudes, and needs, generate a personality profile. The profile should summarize their core character traits. The reports are in JSON format, ordered from most to least recent:\n\n${JSON.stringify(reports.slice(0, 10))}`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: profileSchema,
            thinkingConfig: { thinkingBudget: 24576 }
        }
    }));

    return JSON.parse(response.text) as PetPersonalityProfile;
};

export const getCombinedAnalysis = async (reports: HistoricReport[], pet: PetProfile, language: Language): Promise<PetEmpathyReport> => {
     const prompt = `You are Dr. Paws. You are tasked with creating a "Combined Analysis" report by summarizing a collection of previous reports for a pet named ${pet.name} (a ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.petType}).
    Analyze the provided reports to identify overarching patterns, trends, and significant changes in emotion and health over time.
    Your output MUST be a new, consolidated report using the 'submit_report' function.

    **Key tasks:**
    1.  **Synthesize Emotions:** Do not just average the scores. Identify the most frequent and most intense emotions. Your new 'emotion' and 'emotionScores' should reflect the dominant emotional theme of the period.
    2.  **Summarize Needs:** Analyze the 'currentNeeds' across all reports to determine the most consistent needs.
    3.  **Create a Narrative:** The 'translation' and 'detailedAnalysis' must be a summary of the entire period, not just one moment. For example: "Over the last week, I've been feeling mostly playful, but those thunderstorms really made me anxious."
    4.  **Aggregate Health Concerns:** If multiple reports contain 'sicknessIndicators', you MUST consolidate them into a single, comprehensive 'sicknessIndicators' object in your summary. Highlight recurring symptoms.
    5.  **Generalize Care Tips:** The 'careTips' should be high-level recommendations based on the observed trends (e.g., "Consider more puzzle toys to address recurring boredom" or "Establish a consistent routine to help with anxiety").

    The reports to be summarized are:
    ${JSON.stringify(reports)}
    `;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ functionDeclarations: [submitReportFunctionDeclaration] }],
            thinkingConfig: { thinkingBudget: 24576 }
        }
    }));

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0 || functionCalls[0].name !== 'submit_report') {
        throw new Error("Model did not return the expected combined analysis.");
    }

    const report = functionCalls[0].args as PetEmpathyReport;
    return report;
};

export const getShoppingRecommendations = async (pet: PetProfile, report: HistoricReport, language: Language): Promise<ShoppingRecommendations> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';

    const schema: FunctionDeclaration['parameters'] = {
        type: Type.OBJECT,
        properties: {
            recommendations: {
                type: Type.ARRAY,
                description: "A list of 3-5 product recommendations tailored to the pet's current state.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, description: `The product category (e.g., "Toys", "Comfort", "Health & Wellness"). In ${langName}.` },
                        productName: { type: Type.STRING, description: `The specific name or type of the product (e.g., "Interactive Puzzle Feeder", "Calming Pheromone Diffuser"). In ${langName}.` },
                        description: { type: Type.STRING, description: `A short, 1-2 sentence explanation of why this product is recommended based on the pet's report. In ${langName}.` },
                        googleShoppingQuery: { type: Type.STRING, description: "A concise, effective search query for this product on Google Shopping. Should be in English for universal search." }
                    },
                    required: ['category', 'productName', 'description', 'googleShoppingQuery']
                }
            },
            communityLinks: {
                type: Type.OBJECT,
                properties: {
                    forums: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: `Title of a relevant online community or forum thread. In ${langName}.` },
                                url: { type: Type.STRING, description: "URL to the community/forum." },
                                description: { type: Type.STRING, description: `A brief description of the community. In ${langName}.` }
                            }
                        }
                    },
                    videos: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: `Title of a relevant, helpful video. In ${langName}.` },
                                url: { type: Type.STRING, description: "URL to the video (e.g., YouTube)." },
                                description: { type: Type.STRING, description: `A brief description of the video. In ${langName}.` }
                            }
                        }
                    }
                }
            }
        },
        required: ['recommendations']
    };

    const prompt = `Based on the following pet profile and their latest empathy report, generate tailored shopping recommendations and links to helpful online communities or videos. Focus on products and resources that address the pet's dominant emotion and needs.

    Pet Profile: ${JSON.stringify(pet)}
    Latest Report: ${JSON.stringify(report)}
    `;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema
        }
    }));

    return JSON.parse(response.text) as ShoppingRecommendations;
};

export const getPredictiveTip = async (pet: PetProfile, reports: HistoricReport[], language: Language): Promise<PredictiveTip> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';

    const schema: FunctionDeclaration['parameters'] = {
        type: Type.OBJECT,
        properties: {
            prediction: { type: Type.STRING, description: `Based on the trends, a short prediction for the pet's likely mood or needs tomorrow. In ${langName}.`},
            tip: { type: Type.STRING, description: `A proactive, actionable tip for the owner to prepare for or encourage this predicted behavior. In ${langName}.` }
        },
        required: ['prediction', 'tip']
    };

    const prompt = `Analyze the recent trend of reports for ${pet.name}, a ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.petType}. Based on the emotional trajectory, predict their likely mood for tomorrow and provide a proactive tip for the owner.
    
    Recent Reports (oldest to newest):
    ${JSON.stringify(reports.slice(0, 7).reverse())}
    `;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema
        }
    }));
    return JSON.parse(response.text) as PredictiveTip;
};

export const getBehavioralExplanation = async (emotion: string, attitude: string | undefined, pet: PetProfile, language: Language): Promise<string> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';

    const prompt = `You are a concise pet behavior expert. In 2-3 short sentences, explain what it means when a ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.petType} is feeling "${emotion}" ${attitude ? `with an attitude of "${attitude}"` : ''}. 
    Focus on common body language and behavioral signs for that species. The explanation should be simple and easy for a pet owner to understand.
    Respond in ${langName}.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model, contents: prompt }));
    return response.text;
};

export const generateShareableImage = async (pet: PetProfile, report: HistoricReport): Promise<string> => {
    const prompt = `Create a beautiful, artistic, shareable portrait of a pet.
    - Pet Name: ${pet.name}
    - Pet Type: ${pet.petType}
    - Gender: ${pet.gender && pet.gender !== 'unknown' ? pet.gender : 'Not specified'}
    - Breed: ${pet.breed || 'unknown'}
    - Emotion: ${report.emotion}
    - Attitude: ${report.attitude || 'neutral'}
    
    The style should be whimsical and heartwarming, suitable for sharing on social media. Focus on a clear portrait of the pet that captures its personality. Do not include any text.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }

    throw new Error("AI Image generation failed to produce an image.");
};

export const getReportComparison = async (currentReport: HistoricReport, previousReport: HistoricReport, pet: PetProfile, language: Language): Promise<string> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';

    const prompt = `You are Dr. Paws. Analyze the two provided pet empathy reports for ${pet.name} (a ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.petType}) and provide a short, one-paragraph summary (2-3 sentences) comparing them.
    Highlight the most significant changes in emotion, attitude, and needs. Explain what these changes might mean for the pet's well-being.
    Your tone should be empathetic, insightful, and easy for a pet owner to understand.
    Respond in ${langName}.

    PREVIOUS REPORT:
    ${JSON.stringify({
        timestamp: previousReport.timestamp,
        emotion: previousReport.emotion,
        attitude: previousReport.attitude,
        currentNeeds: previousReport.currentNeeds,
        problemSummary: previousReport.problemSummary
    })}

    CURRENT REPORT:
    ${JSON.stringify({
        timestamp: currentReport.timestamp,
        emotion: currentReport.emotion,
        attitude: currentReport.attitude,
        currentNeeds: currentReport.currentNeeds,
        problemSummary: currentReport.problemSummary
    })}
    `;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model, contents: prompt }));
    return response.text;
};

export const getFunnySummary = async (report: HistoricReport, language: Language): Promise<string> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';

    const prompt = `You are a witty pet commentator. Based on this report for a pet named ${report.petName}, write a short, funny, one-sentence summary from the pet's perspective. Think of it like a caption for a funny social media video. Respond in ${langName}.
    
    Report:
    Emotion: ${report.emotion}
    Attitude: ${report.attitude || 'none'}
    Translation: "${report.translation}"
    
    Example for a sassy cat: "Yes, I knocked the cup over. And I'd do it again."
    Example for a goofy dog: "Wasn't me. It was the squirrel. Definitely the squirrel."
    `;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model, contents: prompt }));
    return response.text.trim().replace(/^"|"$/g, '');
};


export const generateDreamMemoryImage = async (pet: PetProfile, emotion: string, language: Language): Promise<string> => {
    const langName = langMap[language];
    const simpleEmotion = emotion.replace(" Moments", "").replace(" Momente", "").replace(" Momentos", "");

    const prompt = `Create a whimsical, dreamlike, artistic, beautiful, and imaginative image of a pet.
    - Pet Type: ${pet.petType}
    - Pet Name: ${pet.name}
    - Breed: ${pet.breed || 'not specified'}
    - Dominant Emotion/Theme: ${simpleEmotion}
    
    The style should be painterly and fantastical. Imagine what this pet would dream about when feeling ${simpleEmotion}.
    - If playful, it could be a world of giant toys or chasing magical butterflies.
    - If calm, it could be sleeping on a soft cloud under a starry sky.
    - If anxious, it could be finding a magical, safe cozy den.
    Do not include any text or words in the image. The image should be vibrant and full of wonder.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Dream memory generation failed to produce an image.");
};

export const getNeedRecommendation = async (pet: PetProfile, need: PetNeed, language: Language): Promise<NeedRecommendation> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';

    const schema: FunctionDeclaration['parameters'] = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: `A creative, encouraging title for addressing the pet's need. In ${langName}.` },
            recommendation: { type: Type.STRING, description: `A detailed, empathetic paragraph (3-4 sentences) explaining why a pet might have this need and general strategies to address it. In ${langName}.` },
            tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `A list of 3-5 specific, actionable, and creative bullet-point tips to address this need for this specific pet. In ${langName}.`
            }
        },
        required: ['title', 'recommendation', 'tips']
    };

    const prompt = `Generate detailed recommendations for a pet owner on how to address their pet's need for "${need}".
    The pet is ${pet.name}, a ${pet.age || ''} ${pet.gender && pet.gender !== 'unknown' ? pet.gender : ''} ${pet.petType} (${pet.breed || 'unknown breed'}).
    Tailor the advice to be species- and breed-appropriate if possible. Be creative and empathetic in your response.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema
        }
    }));
    return JSON.parse(response.text) as NeedRecommendation;
};


let chat: Chat | null = null;
export const startChat = (report: PetEmpathyReport, pet: PetProfile, language: Language) => {
    const langName = langMap[language];
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
             systemInstruction: `You are Dr. Paws, an empathetic AI veterinary behaviorist. You are in a text chat with the owner of ${pet.name}, a ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.petType}. The owner has just received an analysis report. Your role is to answer their follow-up questions based *only* on the information in the report provided below. Do not invent new information. Be helpful, reassuring, and keep answers concise. Respond in ${langName}. \n\n REPORT: ${JSON.stringify(report)}`,
        },
    });
};

export const sendMessageToChat = async (message: string): Promise<string> => {
    if (!chat) throw new Error("Chat not initialized");
    const response: GenerateContentResponse = await withRetry(() => chat.sendMessage({ message }));
    return response.text;
};

export const getChatPrompts = async (report: PetEmpathyReport, pet: PetProfile, language: Language): Promise<string[]> => {
    const langName = langMap[language];
    const model = 'gemini-2.5-flash';
    const schema: FunctionDeclaration['parameters'] = {
        type: Type.OBJECT,
        properties: {
            prompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `A list of 3 short, insightful follow-up questions a pet owner might ask about the report. In ${langName}.`
            }
        },
        required: ['prompts']
    };

    const prompt = `Based on this report for a pet named ${pet.name} (a ${pet.gender && pet.gender !== 'unknown' ? pet.gender + ' ' : ''}${pet.petType}), generate 3 distinct, insightful follow-up questions a concerned owner might ask in a chat. \n\n REPORT: ${JSON.stringify(report)}`;
    
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema
        }
    }));
    const result = JSON.parse(response.text);
    return result.prompts;
};

export const detectBreed = async (base64Photo: string, petType: PetType, language: Language): Promise<PetProfile['breedInfo'] & { breed: string }> => {
    const model = 'gemini-2.5-flash';
    const imagePart = base64ToGenerativePart(base64Photo, 'image/jpeg');
    const langName = langMap[language];

    const prompt = `You are a pet breed identification expert. Analyze the image of the ${petType}. Your response texts ("breed", "summary", "articles.title") MUST be in ${langName}.
1. Identify the most likely breed. If it's a mix, use "Mixed Breed" (translated to ${langName}). The breed name should be recognizable.
2. Provide a brief, 2-3 sentence summary in ${langName} of the breed's key characteristics (temperament, size, energy level).
3. Use Google Search to find 2-3 helpful articles (e.g., from AKC, VetStreet, breed clubs) about this breed's care, temperament, or health. You MUST use the search results to populate the articles. The article titles MUST be translated to ${langName}.
Your final response MUST be a single, valid JSON object with the following structure and nothing else:
{
  "breed": "string", // in ${langName}
  "summary": "string", // in ${langName}
  "articles": [
    {
      "title": "string", // in ${langName}
      "url": "string" // MUST be the original URL
    }
  ]
}`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            tools: [{ googleSearch: {} }],
        }
    }));

    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
    }
    return JSON.parse(jsonStr);
};


export const createLiveSession = async (callbacks: any, systemInstruction: string, tools?: { functionDeclarations: FunctionDeclaration[] }[]): Promise<LiveSession> => {
  const session = await ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      // If tools are provided, we don't need transcription. Otherwise, we do (for VoiceChatModal).
      inputAudioTranscription: tools ? undefined : {},
      outputAudioTranscription: tools ? undefined : {},
      systemInstruction,
      tools,
    },
  });
  return session;
};

export const createCriticalCareChatSession = createLiveSession; // They are functionally identical for this app's purpose

export const optimizeImage = async (base64Image: string): Promise<string> => {
    const prompt = "Enhance this image: improve lighting, sharpness, and color vibrancy without altering the content. Make it look more professional and clear.";
    
    const imagePart = {
        inlineData: {
            data: base64Image.split(',')[1],
            mimeType: 'image/jpeg',
        },
    };
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const dataUrl = `data:image/png;base64,${base64ImageBytes}`;
            return await addWatermark(dataUrl);
        }
    }

    throw new Error("Image optimization failed to produce an image.");
};

export const editImageWithPrompt = async (base64Image: string, prompt: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: base64Image.split(',')[1],
            mimeType: 'image/jpeg',
        },
    };
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const dataUrl = `data:image/png;base64,${base64ImageBytes}`;
            return await addWatermark(dataUrl);
        }
    }

    throw new Error("Image editing failed to produce an image.");
};