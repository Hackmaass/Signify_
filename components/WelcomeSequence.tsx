import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlurText from './BlurText';

interface WelcomeSequenceProps {
  onComplete: () => void;
}

const WelcomeSequence: React.FC<WelcomeSequenceProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = useMemo(() => [
    { text: "Hello There!", duration: 2500 },
    { text: "Learn Sign language the easy way", duration: 3000 }
  ], []);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        // Fade out current step
        setIsVisible(false);
        
        // After fade out, move to next step or complete
        setTimeout(() => {
          if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
            setIsVisible(true);
          } else {
            // Last step completed, proceed to dashboard
            onComplete();
          }
        }, 500); // Fade out duration
      }, steps[currentStep].duration);

      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete, steps]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {isVisible && currentStep < steps.length && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center px-8"
          >
            <BlurText
              text={steps[currentStep].text}
              className="text-5xl md:text-7xl font-bold text-white"
              delay={100}
              animateBy="words"
              direction="top"
              stepDuration={0.4}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeSequence;

