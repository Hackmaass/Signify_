import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, BookOpen, Camera, Sparkles, TrendingUp, Wand2, Hand } from 'lucide-react';
import BlurText from './BlurText';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlight?: {
    selector: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  };
  action?: () => void;
}

interface InteractiveTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Signify!',
      description: 'Your personal AI-powered ASL tutor. Let\'s learn how to master sign language together!',
    },
    {
      id: 'dashboard',
      title: 'Your Dashboard',
      description: 'This is your learning hub. Here you can track your progress, see your daily streak, and access all lessons.',
      highlight: {
        selector: '[data-tutorial="dashboard"]',
        position: 'center',
      },
    },
    {
      id: 'streak',
      title: 'Track Your Progress',
      description: 'Your streak calendar shows your daily practice. Keep it going to build momentum! The more you practice, the longer your streak.',
      highlight: {
        selector: '[data-tutorial="streak"]',
        position: 'right',
      },
    },
    {
      id: 'lessons',
      title: 'Choose Your Lessons',
      description: 'Select from three types: Alphabet (A-Z), Phrases (common words), or use AI Generator to create custom lessons for any phrase!',
      highlight: {
        selector: '[data-tutorial="lessons"]',
        position: 'top',
      },
    },
    {
      id: 'hand-tracking',
      title: 'Real-Time Hand Tracking',
      description: 'When you start a lesson, your webcam tracks your hands in real-time. Make sure your hands are visible in the camera view!',
      highlight: {
        selector: '[data-tutorial="hand-tracking"]',
        position: 'center',
      },
    },
    {
      id: 'ai-tutor',
      title: 'AI Live Tutor',
      description: 'The AI tutor watches you sign and provides instant feedback. It will guide you to perfect your form with helpful tips.',
      highlight: {
        selector: '[data-tutorial="ai-tutor"]',
        position: 'bottom',
      },
    },
    {
      id: 'auto-verify',
      title: 'Auto-Verification',
      description: 'Hold your sign steady for 5 seconds, and the system will automatically verify your form. Or click "Manual Scan" anytime!',
      highlight: {
        selector: '[data-tutorial="auto-verify"]',
        position: 'center',
      },
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start with an easy letter like "A" to get comfortable. Remember: practice makes perfect!',
    },
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const currentStepData = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200]"
        >
          {/* Dark Overlay */}
          <motion.div
            ref={overlayRef}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onSkip}
          />

          {/* Tutorial Card */}
          <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 max-w-2xl w-full p-8 relative overflow-hidden"
            >
              {/* Background Gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              {/* Header */}
              <div className="relative z-10 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {currentStepData.id === 'welcome' && <Sparkles className="w-6 h-6 text-blue-500" />}
                    {currentStepData.id === 'dashboard' && <BookOpen className="w-6 h-6 text-blue-500" />}
                    {currentStepData.id === 'streak' && <TrendingUp className="w-6 h-6 text-blue-500" />}
                    {currentStepData.id === 'lessons' && <Wand2 className="w-6 h-6 text-blue-500" />}
                    {currentStepData.id === 'hand-tracking' && <Camera className="w-6 h-6 text-blue-500" />}
                    {currentStepData.id === 'ai-tutor' && <Sparkles className="w-6 h-6 text-blue-500" />}
                    {currentStepData.id === 'auto-verify' && <Hand className="w-6 h-6 text-blue-500" />}
                    {currentStepData.id === 'complete' && <Sparkles className="w-6 h-6 text-blue-500" />}
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {currentStepData.title}
                    </h2>
                  </div>
                  <button
                    onClick={onSkip}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 mb-8">
                <div className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <BlurText
                    text={currentStepData.description}
                    className="text-lg"
                    delay={50}
                    animateBy="words"
                    direction="top"
                    stepDuration={0.3}
                  />
                </div>
              </div>

              {/* Step Indicator */}
              <div className="relative z-10 flex items-center justify-center gap-2 mb-6">
                {tutorialSteps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-8 bg-blue-500'
                        : index < currentStep
                        ? 'w-2 bg-blue-500/50'
                        : 'w-2 bg-zinc-300 dark:bg-zinc-700'
                    }`}
                    initial={false}
                    animate={{
                      width: index === currentStep ? 32 : index < currentStep ? 8 : 8,
                    }}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="relative z-10 flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    currentStep === 0
                      ? 'text-zinc-400 cursor-not-allowed'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-sm text-zinc-500">
                  {currentStep + 1} of {tutorialSteps.length}
                </span>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InteractiveTutorial;

