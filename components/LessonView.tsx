import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Sparkles, X, Video, VideoOff, Loader2, Volume2, StopCircle, Info, Camera, MessageSquareText, Check } from 'lucide-react';
import { HandTrackingRef } from './HandTrackingCanvas';
import { FeedbackResponse } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveTutorProps {
  lessonSign: string;
  lessonDescription: string;
  canvasRef: React.RefObject<HandTrackingRef | null>;
  feedback?: FeedbackResponse | null;
  triggerIntro?: boolean;
}

// --- Audio Helpers ---
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, data[i] * 32768));
  }
  const uint8 = new Uint8Array(int16.buffer);
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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

export default function LiveTutor({ lessonSign, lessonDescription, canvasRef, feedback, triggerIntro }: LiveTutorProps) {
  // Auto-start by default
  const [isActive, setIsActive] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [volume, setVolume] = useState(0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const activeRef = useRef(false);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const videoIntervalRef = useRef<number | null>(null);
  const prevSignRef = useRef(lessonSign);
  const audioStreamingEnabledRef = useRef(false); // Gate audio input

  const toggleActive = () => {
    if (isActive) {
      disconnect();
      setIsActive(false);
    } else {
      setIsActive(true);
      // Connection handled by effect
    }
  };

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('signify_tutor_tutorial_seen', 'true');
  };

  const connect = async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    audioStreamingEnabledRef.current = false; // Reset streaming gate

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      // Ensure contexts are running (handling autoplay policies)
      try {
        if (inputCtx.state === 'suspended') await inputCtx.resume();
        if (outputCtx.state === 'suspended') await outputCtx.resume();
      } catch (e) {
        console.warn("Audio Context Resume failed (interaction required):", e);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const config = {
        model: 'gemini-2.0-flash-exp', // Updated to latest model for Live API
        config: {
          responseModalities: [Modality.AUDIO],
          // INSTRUCTION: Crucial for "Speaking First"
          systemInstruction: `You are "Signify", an expert ASL tutor.
          
          CURRENT LESSON CONTEXT:
          - Sign: "${lessonSign}"
          - Visual Description: "${lessonDescription}"

          PROTOCOL:
          1. As soon as you connect, you MUST SPEAK FIRST. Do not wait for the user.
          2. Say exactly: "Welcome! Let's practice the sign for ${lessonSign}. ${lessonDescription}"
          3. Then pause and wait for the user to try it.
          4. Be encouraging and concise.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      };

      // We use the promise pattern for safe closure access in callbacks
      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Socket Opened');
            setIsConnected(true);

            // HACK: Send a tiny silent audio frame to "wake" the model and trigger the turn
            // This ensures the model processes the system instruction "Speak First" immediately
            try {
              const silentData = new Float32Array(1024).fill(0);
              const pcmBlob = createBlob(silentData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            } catch (e) { console.warn("Wake signal failed", e); }
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (!activeRef.current) return;
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              setAgentSpeaking(true);
              const ctx = outputContextRef.current;
              try {
                const buffer = await decodeAudioData(decodeBase64(audioData), ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                const now = ctx.currentTime;
                // Prevent overlap but ensure low latency
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;

                // Reset speaking state estimate
                setTimeout(() => setAgentSpeaking(false), buffer.duration * 1000);
              } catch (e) {
                console.error("Audio decode error", e);
              }
            }
          },
          onclose: () => {
            console.log("Gemini Live Socket Closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            // Often "Network Error" happens on close or bad state, we can log it as warn
            console.warn("Gemini Live Session Error:", err);
          }
        }
      });

      // Store session reference when resolved
      sessionPromise.then(session => {
        if (!activeRef.current) {
          session.close();
          return;
        }
        sessionRef.current = session;

        console.log("Session connected. Waiting to enable audio...");

        // 1.0s delay prevents user ambient noise from interrupting the Model's Intro
        setTimeout(() => {
          if (activeRef.current) {
            audioStreamingEnabledRef.current = true;
            console.log("Audio input enabled");
          }
        }, 1000);

      }).catch(err => {
        console.error("Failed to connect:", err);
        setIsConnected(false);
        activeRef.current = false;
      });

      // --- Setup Audio Input Stream ---
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        // Gate audio input with audioStreamingEnabledRef
        if (!activeRef.current || isMuted || !audioStreamingEnabledRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate volume for UI
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        setVolume(Math.sqrt(sum / inputData.length) * 5);

        const pcmBlob = createBlob(inputData);

        sessionPromise.then(async (session) => {
          if (activeRef.current && sessionRef.current === session) {
            try {
              // Explicitly await and catch to prevent unhandled promise rejections which cause "Network Error"
              await session.sendRealtimeInput({ media: pcmBlob });
            } catch (e) {
              // Ignore send errors which happen if socket closes mid-stream
            }
          }
        }).catch(() => { });
      };
      source.connect(processor);
      processor.connect(inputCtx.destination);

      // --- Setup Video Stream ---
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = window.setInterval(() => {
        // Gate video input as well to prevent interruption
        if (!activeRef.current || !isVideoEnabled || !audioStreamingEnabledRef.current) return;

        const snapshot = canvasRef.current?.getSnapshot();
        if (snapshot) {
          const base64Data = snapshot.split(',')[1];
          sessionPromise.then(async (session) => {
            if (activeRef.current && sessionRef.current === session) {
              try {
                await session.sendRealtimeInput({
                  media: { mimeType: 'image/jpeg', data: base64Data }
                });
              } catch (e) { }
            }
          }).catch(() => { });
        }
      }, 500);

    } catch (error) {
      console.error("Connection setup failed", error);
      setIsConnected(false);
      activeRef.current = false;
    }
  };

  const disconnect = () => {
    activeRef.current = false;
    audioStreamingEnabledRef.current = false;
    setIsConnected(false);

    // Close audio contexts to release hardware
    if (inputContextRef.current) {
      inputContextRef.current.close().catch(console.error);
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close().catch(console.error);
      outputContextRef.current = null;
    }

    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }

    // Properly close the Gemini session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error("Error closing session:", e);
      }
      sessionRef.current = null;
    }
  };

  // 1. Initial Connect on Mount
  useEffect(() => {
    // Check for tutorial seen state
    const tutorialSeen = localStorage.getItem('signify_tutor_tutorial_seen');
    if (!tutorialSeen) {
      setShowTutorial(true);
    }

    if (isActive) {
      connect();
    }
    return () => { disconnect(); };
  }, []); // Run once on mount

  // 2. Handle Reconnect if User Toggles back on
  useEffect(() => {
    if (isActive && !activeRef.current) {
      connect();
    }
  }, [isActive]);

  // 3. Handle Lesson Change (Reconnect with new context)
  useEffect(() => {
    if (isActive && lessonSign !== prevSignRef.current) {
      prevSignRef.current = lessonSign;
      disconnect();
      // Small buffer to allow cleanup
      setTimeout(() => { if (isActive) connect(); }, 500);
    }
  }, [lessonSign, isActive]);

  // 4. Handle Feedback Injection
  useEffect(() => {
    if (activeRef.current && sessionRef.current && feedback) {
      const text = feedback.isCorrect
        ? `SYSTEM UPDATE: The user successfully performed the sign "${lessonSign}". Congratulate them warmly!`
        : `SYSTEM UPDATE: The user failed the sign "${lessonSign}". The error detected is: "${feedback.feedback}". Please explain this correction to them helpfuly.`;

      try {
        // We attempt to send a text turn to the model to guide its speech
        // Note: The specific method to send text in a live session depends on the exact SDK version behavior,
        // but 'send' with content parts is the standard pattern for GenAI sessions.
        if (typeof sessionRef.current.send === 'function') {
          sessionRef.current.send({ parts: [{ text }] });
        } else {
          // Fallback if 'send' isn't directly exposed on the session object
          console.log("Sending feedback via realtime input text injection");
          // Some versions allow text in sendRealtimeInput contents
          sessionRef.current.sendRealtimeInput([{ text }]);
        }
      } catch (e) {
        console.warn("Failed to send feedback text to Gemini Live:", e);
      }
    }
  }, [feedback, lessonSign]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-6 w-80 bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-2xl z-50"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Meet your AI Tutor</h3>
            </div>

            <ul className="space-y-3 mb-4">
              <li className="flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                <Camera className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-900 dark:text-zinc-100">I can see you.</strong> The camera tracks your hands to give real-time feedback on your form.
                </span>
              </li>
              <li className="flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                <MessageSquareText className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-900 dark:text-zinc-100">I can hear you.</strong> Ask questions like "Is my thumb correct?" or "Can you repeat that?".
                </span>
              </li>
            </ul>

            <button
              onClick={handleDismissTutorial}
              className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              Got it
              <Check className="w-3 h-3" />
            </button>

            {/* Arrow pointer */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-900 border-b border-r border-zinc-200 dark:border-white/10 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isActive ? (
          <motion.button
            key="inactive"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={toggleActive}
            className="flex items-center gap-3 px-6 py-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-full shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-10 dark:opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Enable AI Tutor</span>
          </motion.button>
        ) : (
          <motion.div
            key="active"
            initial={{ width: 60, height: 60, borderRadius: 30 }}
            animate={{
              width: isConnected ? 320 : 200,
              height: 64,
              borderRadius: 32
            }}
            exit={{ width: 60, opacity: 0 }}
            className="bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-between px-2 overflow-hidden relative"
          >
            {/* Background Glow */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${agentSpeaking ? 'opacity-30' : 'opacity-0'} bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-xl`} />

            {/* Content Container */}
            <div className="flex items-center gap-4 w-full px-2 z-10">

              {/* Status Indicator / Waveform */}
              <div className="flex items-center justify-center w-10 h-10 shrink-0">
                {!isConnected ? (
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                ) : (
                  <div className="flex items-center gap-1 h-4">
                    {/* Dynamic Waveform */}
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-zinc-900 dark:bg-white rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(4, Math.min(24, 4 + (Math.random() * ((agentSpeaking ? 1 : volume) * 30))))}px`,
                          opacity: agentSpeaking ? 0.8 : (volume > 0.1 ? 0.8 : 0.3)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Text Status */}
              {isConnected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 min-w-0 flex flex-col justify-center"
                >
                  <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-wide">
                    {agentSpeaking ? 'Speaking...' : (volume > 0.2 ? 'Listening...' : 'Gemini Live')}
                  </span>
                  <span className="text-[10px] text-zinc-500 truncate">
                    {lessonSign} Lesson
                  </span>
                </motion.div>
              )}

              {!isConnected && (
                <span className="flex-1 text-xs text-zinc-400 font-medium ml-2">Connecting...</span>
              )}

              {/* Controls */}
              {isConnected && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400' : 'hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={toggleActive}
                    className="p-2 rounded-full hover:bg-red-500/10 text-zinc-400 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
