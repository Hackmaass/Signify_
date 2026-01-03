import { FeedbackResponse, Lesson } from '../types';
import { GoogleGenAI } from "@google/genai";

// Universal Safe Key Access
const getApiKey = () => {
  try {
    // @ts-ignore
    if (import.meta?.env?.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
    // @ts-ignore
    if (import.meta?.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  } catch (e) { }

  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
      if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (process.env.API_KEY) return process.env.API_KEY;
    }
  } catch (e) { }

  return '';
};

// Initialize the SDK Client
const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing. Please set VITE_GEMINI_API_KEY in your environment.");
  return new GoogleGenAI({ apiKey });
};

const DEFAULT_MODEL = "gemini-1.5-flash";

// Fast & Spontaneous Analysis via SDK
export const evaluateHandSign = async (
  imageBase64: string,
  targetSign: string,
  targetDescription: string,
  signType: 'static' | 'dynamic' = 'static'
): Promise<FeedbackResponse> => {
  try {
    const ai = getClient();
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg);base64,/, "");

    const prompt = `
      Act as a strict ASL Instructor. 
      The user is attempting to perform the sign for: "${targetSign}".
      Sign Type: ${signType.toUpperCase()}.
      
      Expected Visual Description of the sign: "${targetDescription}".

      Task:
      1. Analyze the hand shape, finger positioning, and orientation in the image.
      2. Compare it specifically against the "Expected Visual Description" provided above.
      3. ${signType === 'dynamic'
        ? 'For this DYNAMIC sign (movement), accept the STARTING handshape, ENDING handshape, or the KEY handshape of the motion as correct. Be lenient on motion blur.'
        : 'For this STATIC sign, be STRICT on specific finger placement and orientation.'}
      
      Return a JSON object:
      { 
        "score": (integer 0-100), 
        "isCorrect": (boolean, true if score > 75), 
        "feedback": (string, max 15 words, direct instruction like "Tuck your thumb in" or "Straighten index finger") 
      }
    `;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/png", data: cleanBase64 } },
          { text: prompt }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        // @ts-ignore
        responseSchema: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            feedback: { type: "STRING" },
            isCorrect: { type: "BOOLEAN" }
          },
          required: ["score", "feedback", "isCorrect"]
        }
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response content");
    return JSON.parse(text) as FeedbackResponse;

  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    const isQuotaError = error.message?.includes('429') || error.status === 429;
    return {
      score: 0,
      feedback: isQuotaError
        ? "⚠️ API Quota Exceeded - Wait or upgrade"
        : error.message || "Analysis failed.",
      isCorrect: false
    };
  }
};

// Generates a lesson plan from a raw sentence
export const generateLessonPlan = async (sentence: string): Promise<Lesson[]> => {
  try {
    const ai = getClient();

    const prompt = `
      You are an ASL Teacher. Convert the sentence "${sentence}" into a sequence of ASL signs (Gloss).
      For each sign, provide a lesson object.
      
      Return a JSON array of objects with this schema:
      {
        "sign": "The gloss word (e.g. HELLO)",
        "type": "static" | "dynamic" (static for single letters/numbers, dynamic for words/phrases),
        "difficulty": "Easy" | "Medium" | "Hard",
        "description": "Visual description of how to make the sign (e.g. 'Place hand on forehead...')",
        "instruction": "Step-by-step guide for the user."
      }
    `;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        // @ts-ignore
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              sign: { type: "STRING" },
              type: { type: "STRING" },
              difficulty: { type: "STRING" },
              description: { type: "STRING" },
              instruction: { type: "STRING" }
            },
            required: ["sign", "type", "difficulty", "description", "instruction"]
          }
        }
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
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

  } catch (error: any) {
    console.error("Lesson Gen Error:", error);
    throw error;
  }
};

// Generates speech via SDK
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ parts: [{ text }] }],
      config: {
        // @ts-ignore
        responseModalities: ["AUDIO"],
        // @ts-ignore
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      }
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

  } catch (e) {
    console.error("TTS Generation Error:", e);
    return null;
  }
};