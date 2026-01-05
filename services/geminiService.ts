
import { FeedbackResponse, Lesson } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";

// QUOTA TRACKING CONSTANTS
const QUOTA_KEY = 'signify_quota_usage';
const QUOTA_DATE_KEY = 'signify_quota_date';
const getTodayString = () => new Date().toISOString().split('T')[0];

// Universal Safe Key Access
const getApiKey = () => {
  try {
    // @ts-ignore
    if (import.meta?.env?.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
    // @ts-ignore
    if (import.meta?.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  } catch (e) { }

  try {
    // Direct check for Vite replacement (Vite replaces the whole string 'process.env.API_KEY')
    // @ts-ignore
    if (process.env.API_KEY) return process.env.API_KEY;
    // @ts-ignore
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  } catch (e) { }

  return '';
};

export const getQuotaUsage = () => {
  const today = getTodayString();
  const storedDate = localStorage.getItem(QUOTA_DATE_KEY);
  if (storedDate !== today) {
    localStorage.setItem(QUOTA_DATE_KEY, today);
    localStorage.setItem(QUOTA_KEY, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(QUOTA_KEY) || '0', 10);
};

const incrementQuota = () => {
  const current = getQuotaUsage();
  localStorage.setItem(QUOTA_KEY, (current + 1).toString());
  window.dispatchEvent(new Event('quota-updated'));
};

export const evaluateHandSign = async (
  imageBase64: string, 
  targetSign: string,
  targetDescription: string,
  signType: 'static' | 'dynamic' = 'static'
): Promise<FeedbackResponse> => {
  incrementQuota();
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg);base64,/, "");

    const prompt = `
      Act as a strict ASL Instructor. 
      The user is attempting to perform the sign for: "${targetSign}".
      Sign Type: ${signType.toUpperCase()}.
      Expected Visual Description: "${targetDescription}".

      Task:
      1. Analyze the hand shape and orientation in the image.
      2. Return JSON:
      { 
        "score": (integer 0-100), 
        "isCorrect": (boolean, true if score > 75), 
        "feedback": (string, max 15 words) 
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/png", data: cleanBase64 } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response content");
    return JSON.parse(text) as FeedbackResponse;

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return { score: 0, feedback: "Analysis failed. Try again.", isCorrect: false };
  }
};

export const generateLessonPlan = async (sentence: string): Promise<Lesson[]> => {
  incrementQuota();
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `
      Convert the sentence "${sentence}" into a sequence of ASL signs.
      Return a JSON array of objects:
      {
        "sign": "GLOSS",
        "type": "static" | "dynamic",
        "difficulty": "Easy" | "Medium" | "Hard",
        "description": "Visual description...",
        "instruction": "Step-by-step..."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];

    const rawData = JSON.parse(text);
    return rawData.map((item: any, index: number) => {
      let imageUrl = `https://placehold.co/400x400/27272a/FFFFFF/png?text=${encodeURIComponent(item.sign)}&font=roboto`;
      if (item.sign.length === 1 && /^[A-Za-z]$/.test(item.sign)) {
         imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/Sign_language_${item.sign.toUpperCase()}.svg?width=500`;
      }
      return {
        id: `custom-${Date.now()}-${index}`,
        category: 'custom',
        type: item.type || (item.sign.length === 1 ? 'static' : 'dynamic'),
        letter: item.sign,
        description: item.description,
        instruction: item.instruction,
        imageUrl: imageUrl, 
        difficulty: item.difficulty
      };
    });
  } catch (error) {
    console.error("Lesson Gen Error:", error);
    return [];
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    incrementQuota();
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text }] }],
          config: {
            // Corrected: Use Modality.AUDIO instead of string literal
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
          },
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return audioData || null;
    } catch (e) {
        console.error("TTS Generation Error:", e);
        return null;
    }
};
