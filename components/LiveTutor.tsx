
import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Sparkles, Loader2, StopCircle } from 'lucide-react';
import { HandTrackingRef } from './HandTrackingCanvas';
import { FeedbackResponse } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// --- Manual Encoding Helpers ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // PCM 16-bit encoding: clip and scale
    int16[i] = Math.max(-32768, Math.min(32767, data[i] * 32768));
  }
  const uint8 = new Uint8Array(int16.buffer);
  return {
    data: encode(uint8),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface LiveTutorProps {
  lessonSign: string;
  lessonDescription: string;
  canvasRef: React.RefObject<HandTrackingRef | null>;
  feedback?: FeedbackResponse | null;
  triggerIntro?: boolean;
}

export default function LiveTutor({ lessonSign, lessonDescription, canvasRef, feedback, triggerIntro }: LiveTutorProps) {
  // AI Tutor is now ON by default
  const [isActive, setIsActive] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRef = useRef(false);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const videoIntervalRef = useRef<number | null>(null);

  const disconnect = () => {
    activeRef.current = false;
    setIsConnected(false);
    setIsSpeaking(false);
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try { session.close(); } catch (e) {}
      });
      sessionPromiseRef.current = null;
    }
    
    if (inputContextRef.current) {
      inputContextRef.current.close().catch(() => {});
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close().catch(() => {});
      outputContextRef.current = null;
    }
  };

  const connect = async () => {
    if (activeRef.current && isConnected) return;
    activeRef.current = true;
    setError(null);

    try {
      // Create fresh instance right before call
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are "Signify", a friendly and encouraging ASL tutor. 
          The user is currently learning the sign for: "${lessonSign}".
          Description: "${lessonDescription}".
          
          ALWAYS GUIDING RULES:
          1. When the session starts, briefly introduce the sign and how to do it.
          2. Use the provided video frames to see the user's hands.
          3. Be concise. Don't talk over the user for too long.
          4. Provide real-time corrective feedback based on what you see in the video frames.
          5. If the user succeeds, give them a warm compliment!`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
        callbacks: {
          onopen: () => {
            console.log('Live Session Opened');
            setIsConnected(true);
            setError(null);
            
            // Proactive Intro: Send initial guidance once connected
            sessionPromise.then(session => {
              // Fix: session.send replaced with session.sendRealtimeInput
              session.sendRealtimeInput({ text: `Hi! I'm your tutor. Let's practice the sign for "${lessonSign}". ${lessonDescription}. Show me your hand when you're ready!` });
            });
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioBase64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioBase64 && outputContextRef.current) {
                setIsSpeaking(true);
                const ctx = outputContextRef.current;
                const buffer = await decodeAudioData(decode(audioBase64), ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                
                // Track speaking state end
                source.onended = () => {
                  if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
                    setIsSpeaking(false);
                  }
                };
            }
            if (msg.serverContent?.interrupted) {
               nextStartTimeRef.current = 0;
               setIsSpeaking(false);
            }
          },
          onclose: (e) => {
            console.log('Live Session Closed', e);
            setIsConnected(false);
            setIsSpeaking(false);
            if (activeRef.current) setError("Session Ended");
          },
          onerror: (err) => {
            console.error('Live Session Error', err);
            setIsConnected(false);
            setError("Connection Error");
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

      // Audio Capture Loop (Input to Model)
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!activeRef.current || isMuted || !isConnected) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromise.then(session => {
           if (activeRef.current) {
               session.sendRealtimeInput({ media: pcmBlob });
           }
        }).catch(() => {});
      };
      source.connect(processor);
      processor.connect(inputCtx.destination);

      // Video Frame Loop (Eyes for the Model)
      videoIntervalRef.current = window.setInterval(() => {
        if (!activeRef.current || !isConnected) return;
        const snapshot = canvasRef.current?.getSnapshot();
        if (snapshot) {
          const base64Data = snapshot.split(',')[1];
          sessionPromise.then(session => {
            if (activeRef.current) {
              session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64Data } });
            }
          }).catch(() => {});
        }
      }, 1000);

    } catch (e: any) {
      console.error("Live Tutor Initialization Failed", e);
      setError("Failed to start session");
      disconnect();
    }
  };

  const toggleActive = () => {
    if (isActive) {
      disconnect();
      setIsActive(false);
    } else {
      setIsActive(true);
      connect();
    }
  };

  // Start connecting immediately on mount
  useEffect(() => {
    if (isActive) {
      connect();
    }
    return () => disconnect();
  }, []);

  // Proactive Guidance: Respond to automated assessment feedback
  useEffect(() => {
    if (isActive && isConnected && feedback && sessionPromiseRef.current) {
        const text = feedback.isCorrect 
            ? `The automated system just verified their sign was correct with a score of ${feedback.score}%. Give them a big enthusiastic congratulations!` 
            : `The automated system noticed an issue: ${feedback.feedback}. Politely guide them on how to fix it based on the description: ${lessonDescription}.`;
        
        sessionPromiseRef.current.then(session => {
            // Fix: session.send replaced with session.sendRealtimeInput
            session.sendRealtimeInput({ text });
        }).catch(() => {});
    }
  }, [feedback, isConnected, isActive, lessonDescription]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <AnimatePresence>
        {!isActive ? (
          <motion.button 
            key="inactive"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleActive}
            className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-full shadow-2xl transition-all"
          >
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-sm">Enable AI Tutor</span>
          </motion.button>
        ) : (
          <motion.div 
            key="active"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`backdrop-blur-xl border rounded-full flex items-center justify-between px-4 py-2 min-w-[320px] shadow-2xl transition-all ${error ? 'bg-red-500/10 border-red-500/50' : 'bg-white/90 dark:bg-zinc-900/95 border-zinc-200 dark:border-white/10'}`}
          >
            <div className="flex items-center gap-4 flex-1">
                <div className="relative flex items-center justify-center w-10 h-10">
                    <AnimatePresence>
                        {isConnected && isSpeaking ? (
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 0.2 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="absolute inset-0 bg-blue-500 rounded-full blur-md"
                            />
                        ) : null}
                    </AnimatePresence>
                    <div className="flex items-center justify-center relative z-10">
                        {isConnected ? (
                            <div className="flex items-center gap-0.5 h-4">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <motion.div 
                                        key={i} 
                                        animate={{ 
                                            height: isSpeaking ? [4, 16, 4] : [4, 6, 4],
                                            opacity: isSpeaking ? 1 : 0.5 
                                        }} 
                                        transition={{ 
                                            duration: isSpeaking ? 0.4 : 1, 
                                            repeat: Infinity, 
                                            delay: i * 0.1 
                                        }}
                                        className="w-1 bg-blue-500 rounded-full" 
                                    />
                                ))}
                            </div>
                        ) : <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />}
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {error ? "System Error" : (isConnected ? (isSpeaking ? "Speaking" : "Listening") : "Initializing")}
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">
                        {error || (isConnected ? "Signify ASL Tutor" : "Connecting...")}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-white/10 pl-2 ml-2">
                <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  title={isMuted ? "Unmute" : "Mute"}
                  className={`p-2 rounded-full transition-colors ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button 
                  onClick={toggleActive} 
                  title="Close Tutor"
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                >
                    <StopCircle className="w-4 h-4" />
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
