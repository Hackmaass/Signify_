import React, { useState, useRef, useEffect } from 'react';
import { Lesson, UserData, FeedbackResponse } from '../types';
import HandTrackingCanvas, { HandTrackingRef } from './HandTrackingCanvas';
import { evaluateHandSign } from '../services/geminiService';
import { updateStreak } from '../services/firebaseService';
import LiveTutor from './LiveTutor';
import { ArrowLeft, CheckCircle, XCircle, ArrowRight, Camera, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonViewProps {
  lesson: Lesson;
  user: UserData;
  onBack: () => void;
  onComplete: (user: UserData) => void;
  hasNext: boolean;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, user, onBack, onComplete, hasNext }) => {
  const canvasRef = useRef<HandTrackingRef>(null);
  const [handsDetected, setHandsDetected] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Reset state when lesson changes
  useEffect(() => {
    setFeedback(null);
    setCompleted(false);
    setAnalyzing(false);
  }, [lesson.id]);

  const handleCheckSign = async () => {
    if (!canvasRef.current) return;

    // Get snapshot from canvas
    const imageBase64 = canvasRef.current.getSnapshot();
    if (!imageBase64) {
      setFeedback({ isCorrect: false, feedback: "No camera feed detected." });
      return;
    }

    setAnalyzing(true);
    setFeedback(null);

    try {
      // Send to Gemini
      const result = await evaluateHandSign(
        imageBase64.split(',')[1],
        lesson.letter,
        lesson.instruction
      );

      setFeedback(result);

      if (result.isCorrect) {
        setCompleted(true);
        // Update streak in background
        updateStreak(user).then(updatedUser => {
          onComplete(updatedUser);
        });
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      setFeedback({ isCorrect: false, feedback: "Failed to analyze sign. Please try again." });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-6 z-20">
        <button
          onClick={onBack}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors backdrop-blur-md border border-white/5"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">{lesson.category} Lesson</span>
          <h2 className="text-xl font-black text-text-primary">Sign for "{lesson.letter}"</h2>
        </div>

        <div className="w-12" /> {/* Spacer */}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 px-6 pb-24 lg:pb-6 max-w-[1600px] mx-auto w-full z-10 relative">

        {/* Left Column: Camera Feed */}
        <div className="flex-1 relative bg-black/40 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm group">
          {/* Status Badge */}
          <div className="absolute top-6 left-6 z-20 flex gap-3">
            <div className={`px-4 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-2 text-xs font-bold shadow-lg ${handsDetected
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${handsDetected ? 'bg-green-500' : 'bg-red-500'}`} />
              {handsDetected ? 'Hands Detected' : 'No Hands Detected'}
            </div>
          </div>

          <HandTrackingCanvas
            ref={canvasRef}
            onHandsDetected={setHandsDetected}
            show3DView={false}
          />

          {/* Feedback Overlay */}
          <AnimatePresence>
            {analyzing && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-accent animate-spin" />
                  <span className="text-lg font-bold text-white">Analyzing your form...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Instruction & Feedback */}
        <div className="lg:w-[480px] flex flex-col gap-6">

          {/* Reference Card */}
          <div className="glass-panel p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-24 h-24 text-white" />
            </div>

            <div className="flex gap-6 items-start relative z-10">
              <div className="w-24 h-24 bg-white/5 rounded-2xl p-2 border border-white/10 shrink-0">
                <img src={lesson.imageUrl} alt={lesson.letter} className="w-full h-full object-contain dark-invert" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-primary mb-2">Instructions</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{lesson.instruction}</p>
              </div>
            </div>
          </div>

          {/* Feedback Area */}
          <AnimatePresence mode="wait">
            {feedback ? (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-8 rounded-[32px] border ${feedback.isCorrect
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full shrink-0 ${feedback.isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                    {feedback.isCorrect ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className={`text-xl font-bold mb-2 ${feedback.isCorrect ? 'text-green-500' : 'text-red-500'
                      }`}>
                      {feedback.isCorrect ? 'Perfect!' : 'Incorrect'}
                    </h4>
                    <p className="text-text-secondary text-sm leading-relaxed">{feedback.feedback}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Initial Empty State or Prompt */
              <div className="bg-white/5 border border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center text-center py-12">
                <Camera className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-text-secondary font-medium">Position your hands in the frame <br /> and press Check when ready.</p>
              </div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-auto grid gap-4">
            {!completed ? (
              <button
                onClick={handleCheckSign}
                disabled={analyzing || !handsDetected}
                className="w-full py-4 rounded-2xl font-bold text-lg bg-accent text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:hover:bg-accent shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {analyzing ? 'Checking...' : 'Check Sign'}
                {!analyzing && <Camera className="w-5 h-5" />}
              </button>
            ) : (
              <button
                onClick={onBack} // Or OnNext if implemented
                className="w-full py-4 rounded-2xl font-bold text-lg bg-green-500 text-white hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
              >
                Next Lesson
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Gemini Live Tutor Overlay */}
      <LiveTutor
        lessonSign={lesson.letter}
        lessonDescription={lesson.instruction}
        canvasRef={canvasRef}
        feedback={feedback}
      />

    </div>
  );
};

export default LessonView;
