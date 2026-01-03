import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FeedbackResponse, Lesson } from '../types';

// Lazy Init Function to safely access env vars in various environments
const getAI = () => {
  let apiKey = '';
  try { apiKey = process.env.API_KEY || ''; } catch (e) { }
  if (!apiKey) {
    try {
      // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY || '';
    } catch (e) { }
  }
  return new GoogleGenAI({ apiKey });
};

// Fast & Spontaneous Analysis
export const evaluateHandSign = async (
  imageBase64: string,
  targetSign: string,
  targetDescription: string,
  signType: 'static' | 'dynamic' = 'static'
): Promise<FeedbackResponse> => {
  try {
    const ai = getAI();
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
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            isCorrect: { type: Type.BOOLEAN }
          },
          required: ["score", "feedback", "isCorrect"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as FeedbackResponse;

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return {
      score: 0,
      feedback: "Analysis failed. Try again.",
      isCorrect: false
    };
  }
};

// Generates a lesson plan from a raw sentence
export const generateLessonPlan = async (sentence: string): Promise<Lesson[]> => {
  try {
    const ai = getAI();
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
      model: 'gemini-3-flash-preview',
      contents: { text: prompt },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sign: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["static", "dynamic"] },
              difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
              description: { type: Type.STRING },
              instruction: { type: Type.STRING }
            },
            required: ["sign", "type", "difficulty", "description", "instruction"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

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

  } catch (error) {
    console.error("Lesson Gen Error:", error);
    return [];
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
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