import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ScanFace, CheckCircle, AlertCircle, SkipForward, Move } from 'lucide-react';
import HandTrackingCanvas, { HandTrackingRef } from './HandTrackingCanvas';
import LiveTutor from './LiveTutor';
import { evaluateHandSign } from '../services/geminiService';
import { updateStreak } from '../services/firebaseService';
import { Lesson, UserData, FeedbackResponse } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  lesson: Lesson;
  user: UserData;
  onBack: () => void;
  onComplete: (user: UserData) => void;
  hasNext?: boolean;
  onNext?: () => void;
}

const LessonView: React.FC<Props> = ({ lesson, user, onBack, onComplete, hasNext, onNext }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [verifyDuration, setVerifyDuration] = useState(5000);

  const canvasRef = useRef<HandTrackingRef>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-Verify Logic
  useEffect(() => {
    if (handDetected && !isProcessing && !feedback) {
      if (!timerRef.current) {
        const startTime = Date.now();
        timerRef.current = window.setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(100, (elapsed / verifyDuration) * 100);
          setTimer(progress);

          if (progress >= 100) {
            if (timerRef.current) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleVerify();
          }
        }, 50);
      }
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimer(0);
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [handDetected, isProcessing, feedback, verifyDuration]);

  // Handle auto-retry timer reset
  // EXTENDED DELAY: Gave AI 6 seconds to explain the error before clearing feedback
  useEffect(() => {
    if (feedback && !feedback.isCorrect) {
      const retryTimer = setTimeout(() => {
        setFeedback(null);
        setVerifyDuration(5000);
        setTimer(0);
      }, 6000);
      return () => clearTimeout(retryTimer);
    }
  }, [feedback]);

  const handleVerify = async () => {
    if (!canvasRef.current || isProcessing) return;
    setIsProcessing(true);
    setFeedback(null);

    const imageBase64 = canvasRef.current.getSnapshot();
    if (imageBase64) {
      const result = await evaluateHandSign(imageBase64, lesson.letter, lesson.description, lesson.type);
      setFeedback(result);

      if (result.isCorrect) {
        const updatedUser = await updateStreak(user);
        setVerifyDuration(5000);
        // EXTENDED DELAY: Wait 5.5s before moving on so the AI can finish complimenting
        setTimeout(() => onComplete(updatedUser), 5500);
      }
    }
    setIsProcessing(false);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white overflow-hidden flex flex-col transition-colors duration-500">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50 to-white dark:from-zinc-900 dark:via-black dark:to-zinc-900 z-0 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar Navigation */}
      <header className="h-20 flex items-center justify-between px-8 z-20 w-full max-w-[1920px] mx-auto">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center bg-white dark:bg-white/5 group-hover:bg-zinc-100 transition-all shadow-sm dark:shadow-none">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Back to Dashboard</span>
            <span className="font-semibold">{lesson.category}</span>
          </div>
        </button>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight leading-none">{lesson.letter}</h1>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{lesson.difficulty}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 w-32 justify-end">
          {lesson.type === 'dynamic' && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/20">
              <Move className="w-3 h-3" />
              <span className="text-xs font-bold">Dynamic</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-8 pt-4 flex flex-col lg:flex-row gap-6 overflow-hidden z-10 relative">

        {/* Left: Reference Portal (Image Only) */}
        <section className="lg:w-1/3 flex flex-col gap-6 relative group h-full">
          <div className="flex-1 glass-panel rounded-[32px] overflow-hidden relative border border-zinc-200 dark:border-white/5 shadow-2xl bg-white dark:bg-zinc-900/50">
            {/* Content */}
            <div className="w-full h-full flex items-center justify-center p-12 bg-white dark:bg-transparent transition-colors">
              <img
                src={lesson.imageUrl}
                alt={lesson.letter}
                className="w-full h-full object-contain drop-shadow-xl opacity-90 dark-invert"
              />
            </div>

            {/* Instructions Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-black dark:via-black/80 dark:to-transparent">
              <p className="text-lg text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed mb-1">
                {lesson.description}
              </p>
              {lesson.instruction && (
                <p className="text-sm text-zinc-500">{lesson.instruction}</p>
              )}
            </div>
          </div>
        </section>

        {/* Right: Camera Portal */}
        <section className="flex-1 relative rounded-[32px] overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/10 bg-zinc-900 dark:bg-black">
          <HandTrackingCanvas
            ref={canvasRef}
            onHandsDetected={setHandDetected}
            show3DView={true}
          />

          {/* HUD Overlays */}
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border transition-colors ${handDetected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${handDetected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-xs font-bold uppercase tracking-wide">{handDetected ? 'Tracking Active' : 'No Hands Detected'}</span>
            </div>
          </div>

          {/* Feedback Toast (HUD Style) */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30"
              >
                <div className={`glass-panel-heavy px-8 py-5 rounded-2xl border flex items-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${feedback.isCorrect ? 'border-green-500/30 shadow-green-900/20 bg-zinc-900/90' : 'border-orange-500/30 shadow-orange-900/20 bg-zinc-900/90'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${feedback.isCorrect ? 'bg-green-500 text-black' : 'bg-orange-500 text-black'}`}>
                    {feedback.isCorrect ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${feedback.isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
                      {feedback.isCorrect ? 'Perfect Form!' : 'Adjustment Needed'}
                    </h3>
                    <p className="text-zinc-300 text-sm">{feedback.feedback}</p>
                  </div>
                  {feedback.isCorrect && hasNext && (
                    <button onClick={() => onComplete(user)} className="ml-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10">
                      <SkipForward className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verify Timer Ring */}
          {handDetected && !isProcessing && !feedback && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-64 h-64 transform -rotate-90 drop-shadow-2xl">
                <circle cx="128" cy="128" r="120" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                <circle
                  cx="128" cy="128" r="120"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - timer / 100)}
                  className="transition-all duration-75 ease-linear"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-5xl font-bold text-white tabular-nums tracking-tighter">
                {(verifyDuration - (timer / 100) * verifyDuration) / 1000 < 1 ? '1' : Math.ceil((verifyDuration - (timer / 100) * verifyDuration) / 1000)}
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-400 font-bold tracking-widest uppercase text-sm animate-pulse">Analyzing</span>
              </div>
            </div>
          )}

          {/* Manual Trigger */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={handleVerify}
              disabled={!handDetected || isProcessing}
              className={`group px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-all ${!handDetected ? 'bg-white/5 text-zinc-600 cursor-not-allowed' :
                'bg-white text-black hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]'
                }`}
            >
              <ScanFace className={`w-5 h-5 ${handDetected ? 'text-black' : 'text-zinc-600'}`} />
              <span>Manual Scan</span>
            </button>
          </div>

        </section>
      </main>

      {/* AI Live Tutor (Floating) */}
      <LiveTutor
        lessonSign={lesson.letter}
        lessonDescription={lesson.description}
        canvasRef={canvasRef}
        feedback={feedback}
        triggerIntro={true}
      />

    </div>
  );
};

export default LessonView;
