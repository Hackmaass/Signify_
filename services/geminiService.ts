import { FeedbackResponse, Lesson } from '../types';

// Universal Safe Key Access (Works for Vite, Next.js, CRA, and Node)
const getApiKey = () => {
  // 1. Try Vite (Client-side) - Preferred for this project
  try {
    // @ts-ignore
    if (import.meta && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
      // @ts-ignore
      if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
    }
  } catch (e) { }

  // 2. Try Process Env (Next.js / CRA / Node)
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
      if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (process.env.API_KEY) return process.env.API_KEY;
    }
  } catch (e) { }

  return '';
};

// Using gemini-1.5-flash for better availability and free-tier stability
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Fast & Spontaneous Analysis via REST
export const evaluateHandSign = async (
  imageBase64: string,
  targetSign: string,
  targetDescription: string,
  signType: 'static' | 'dynamic' = 'static'
): Promise<FeedbackResponse> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing. Please set VITE_GEMINI_API_KEY in your environment.");

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

    const body = {
      contents: [{
        parts: [
          { inline_data: { mime_type: "image/png", data: cleanBase64 } },
          { text: prompt }
        ]
      }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            feedback: { type: "STRING" },
            isCorrect: { type: "BOOLEAN" }
          },
          required: ["score", "feedback", "isCorrect"]
        }
      }
    };

    const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      // Enhanced error handling for quota issues
      if (response.status === 429) {
        throw new Error(`⚠️ API Quota Exceeded. Your Gemini API has hit its daily limit. Please wait until midnight PT (1:30 PM IST) for quota reset, or upgrade to a paid plan.`);
      } else if (response.status === 403) {
        throw new Error(`🔒 Invalid API Key. Please check your VITE_GEMINI_API_KEY in .env.local`);
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("No response content");
    return JSON.parse(text) as FeedbackResponse;

  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    // Check if it's a quota error
    const isQuotaError = error.message?.includes('Quota Exceeded') || error.message?.includes('429');
    return {
      score: 0,
      feedback: isQuotaError
        ? "⚠️ API Quota Exceeded - Wait or upgrade your plan"
        : error.message || "Analysis failed. Try again.",
      isCorrect: false
    };
  }
};

// Generates a lesson plan from a raw sentence via REST
export const generateLessonPlan = async (sentence: string): Promise<Lesson[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return [];

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

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              sign: { type: "STRING" },
              type: { type: "STRING", enum: ["static", "dynamic"] },
              difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
              description: { type: "STRING" },
              instruction: { type: "STRING" }
            },
            required: ["sign", "type", "difficulty", "description", "instruction"]
          }
        }
      }
    };

    const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error details:", errorData);
      throw new Error(`API Failed with status ${response.status}: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn("Gemini response empty. Full data:", data);
      return [];
    }

    const rawData = JSON.parse(text);

    // Map to Lesson interface
    return rawData.map((item: any, index: number) => {
      // Smart Image Selection
      let imageUrl = `https://placehold.co/400x400/27272a/FFFFFF/png?text=${encodeURIComponent(item.sign)}&font=roboto`;

      // If it is a single letter, use the stable Wikimedia URL
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
    throw error; // Throw the error so the UI can catch and display it
  }
};

// Generates speech via REST using audio modalities
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const body = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        response_modalities: ["AUDIO"],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: { voice_name: 'Kore' },
          },
        },
      }
    };

    const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) return null;

    const data = await response.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;

    return audioData || null;

  } catch (e) {
    console.error("TTS Generation Error:", e);
    return null;
  }
};