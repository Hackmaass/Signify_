import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
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
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200]"
        >
          {/* Animated Background Overlay */}
          <motion.div
            ref={overlayRef}
            className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 backdrop-blur-md pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onSkip}
          >
          </motion.div>


          {/* Tutorial Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 pointer-events-auto">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.95, y: 30, rotateX: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -30 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="glass-panel rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 max-w-3xl w-full p-8 sm:p-10 relative overflow-hidden backdrop-blur-2xl bg-white/90 dark:bg-zinc-900/90"
            >

              {/* Header */}
              <div className="relative z-10 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div>
                      <motion.h2 
                        className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {currentStepData.title}
                      </motion.h2>
                      <motion.div
                        className="h-1 w-20 bg-zinc-400 dark:bg-zinc-600 rounded-full mt-2"
                        initial={{ width: 0 }}
                        animate={{ width: 80 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                  <motion.button
                    onClick={onSkip}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 hover:bg-white/10 dark:hover:bg-white/5 rounded-xl transition-all backdrop-blur-sm border border-white/10"
                  >
                    <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </motion.button>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-zinc-600 dark:bg-zinc-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Content */}
              <motion.div 
                className="relative z-10 mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-lg sm:text-xl text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                  <BlurText
                    text={currentStepData.description}
                    className="text-lg sm:text-xl"
                    delay={60}
                    animateBy="words"
                    direction="top"
                    stepDuration={0.35}
                  />
                </div>
              </motion.div>

              {/* Step Indicator */}
              <div className="relative z-10 flex items-center justify-center gap-2.5 mb-8">
                {tutorialSteps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-2.5 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-10 bg-zinc-600 dark:bg-zinc-400'
                        : index < currentStep
                        ? 'w-2.5 bg-zinc-500 dark:bg-zinc-500'
                        : 'w-2.5 bg-zinc-300/50 dark:bg-zinc-700/50'
                    }`}
                    animate={{
                      width: index === currentStep ? 40 : index < currentStep ? 10 : 10,
                    }}
                    transition={{
                      width: { duration: 0.3 }
                    }}
                  />
                ))}
              </div>

              {/* Enhanced Navigation */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                <motion.button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  whileHover={currentStep > 0 ? { scale: 1.05, x: -2 } : {}}
                  whileTap={currentStep > 0 ? { scale: 0.95 } : {}}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all backdrop-blur-sm border ${
                    currentStep === 0
                      ? 'text-zinc-400 cursor-not-allowed border-transparent'
                      : 'text-zinc-700 dark:text-zinc-300 border-white/20 dark:border-white/10 hover:bg-white/10 dark:hover:bg-white/5 hover:border-white/30'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </motion.button>

                <motion.div
                  className="px-4 py-2 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    {currentStep + 1} <span className="text-zinc-500">/ {tutorialSteps.length}</span>
                  </span>
                </motion.div>

                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  <span>{currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InteractiveTutorial;

