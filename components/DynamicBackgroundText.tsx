import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserData, LessonCategory } from '../types';

interface DynamicBackgroundTextProps {
  user: UserData | null;
  activeTab: LessonCategory;
  totalLessons: number;
  streak: number;
  isLessonActive: boolean;
  lastAction?: string;
}

const DynamicBackgroundText: React.FC<DynamicBackgroundTextProps> = ({
  user,
  activeTab,
  totalLessons,
  streak,
  isLessonActive,
  lastAction
}) => {
  const [currentText, setCurrentText] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  // Contextual messages - Sign Language & Platform focused, with motivational quotes
  const messages = useMemo(() => {
    const baseMessages: string[] = [];

    // SIGN LANGUAGE & PLATFORM MESSAGES (Priority - shown initially)
    baseMessages.push("American Sign Language");
    baseMessages.push("ASL Learning Platform");
    baseMessages.push("Sign Language Mastery");
    baseMessages.push("Hand Gestures, Clear Communication");
    baseMessages.push("Learn ASL with AI");
    baseMessages.push("Signify - Your ASL Tutor");
    baseMessages.push("Real-Time Hand Tracking");
    baseMessages.push("AI-Powered Sign Language Learning");
    baseMessages.push("Master Sign Language");
    baseMessages.push("ASL Alphabet A-Z");
    baseMessages.push("Sign Language Phrases");
    baseMessages.push("Interactive ASL Lessons");
    baseMessages.push("Practice Sign Language Daily");
    baseMessages.push("Sign Language Made Easy");
    baseMessages.push("Your Hands, Your Voice");
    baseMessages.push("Learn to Sign");
    baseMessages.push("ASL Communication");
    baseMessages.push("Sign Language Basics");
    baseMessages.push("Express Through Signs");
    baseMessages.push("Sign Language Fluency");

    // Platform-specific features
    baseMessages.push("AI Tutor for Sign Language");
    baseMessages.push("MediaPipe Hand Tracking");
    baseMessages.push("Instant ASL Feedback");
    baseMessages.push("Sign Language Recognition");
    baseMessages.push("Practice Makes Perfect");
    baseMessages.push("Sign Language Progress");
    baseMessages.push("ASL Learning Journey");
    baseMessages.push("Sign Language Skills");

    // Motivational quotes (mixed in between)
    baseMessages.push("Every sign you learn opens a door");
    baseMessages.push("Language is the bridge between cultures");
    baseMessages.push("Practice today, communicate tomorrow");
    baseMessages.push("Sign by sign, you're making progress");
    baseMessages.push("Consistency beats intensity");
    baseMessages.push("Small steps, big impact");
    baseMessages.push("Learning never stops");
    baseMessages.push("Progress, not perfection");
    baseMessages.push("Every expert was once a beginner");
    baseMessages.push("Mastery through persistence");

    // Contextual messages based on progress
    if (totalLessons > 0) {
      baseMessages.push(`${totalLessons} ASL Lessons Completed`);
      baseMessages.push("Keep Building Your ASL Skills");
    }

    if (streak > 0) {
      baseMessages.push(`${streak} Day ASL Practice Streak`);
      baseMessages.push("Consistent ASL Learning");
    }

    // Tab-based sign language messages
    if (activeTab === 'alphabet') {
      baseMessages.push("ASL Alphabet Mastery");
      baseMessages.push("Learn ASL Letters A-Z");
      baseMessages.push("ASL Alphabet Foundation");
    } else if (activeTab === 'phrase') {
      baseMessages.push("ASL Common Phrases");
      baseMessages.push("Sign Language Expressions");
      baseMessages.push("ASL Conversation Starters");
    } else if (activeTab === 'custom') {
      baseMessages.push("Custom ASL Lessons");
      baseMessages.push("AI-Generated Sign Language");
      baseMessages.push("Personalized ASL Learning");
    }

    // Action-based messages
    if (lastAction === 'lesson_completed') {
      baseMessages.push("ASL Lesson Completed!");
      baseMessages.push("Great Sign Language Practice!");
    } else if (lastAction === 'lesson_started') {
      baseMessages.push("Starting ASL Practice");
      baseMessages.push("Focus on Your Signs");
    }

    return baseMessages;
  }, [streak, totalLessons, activeTab, lastAction]);

  useEffect(() => {
    // Prioritize sign language/platform messages initially (first 20 messages)
    const signLanguageMessages = messages.slice(0, 20);
    const allMessages = messages;
    
    // Set initial message from sign language/platform focused messages
    if (signLanguageMessages.length > 0) {
      setCurrentText(signLanguageMessages[Math.floor(Math.random() * signLanguageMessages.length)]);
    } else if (allMessages.length > 0) {
      setCurrentText(allMessages[Math.floor(Math.random() * allMessages.length)]);
    }

    // Rotate through messages - prioritize sign language messages 70% of the time
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        let selectedMessage;
        // 70% chance to show sign language/platform message, 30% for motivational
        if (Math.random() < 0.7 && signLanguageMessages.length > 0) {
          selectedMessage = signLanguageMessages[Math.floor(Math.random() * signLanguageMessages.length)];
        } else {
          selectedMessage = allMessages[Math.floor(Math.random() * allMessages.length)];
        }
        setCurrentText(selectedMessage);
        setIsVisible(true);
      }, 500);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [messages]);

  // React to immediate actions
  useEffect(() => {
    if (lastAction) {
      setIsVisible(false);
      setTimeout(() => {
        const actionMessages: Record<string, string[]> = {
          'lesson_completed': [
            "🎉 Excellent work!",
            "One step closer to mastery!",
            "Progress unlocked!",
            "You're getting better!"
          ],
          'lesson_started': [
            "Let's practice!",
            "Focus and learn",
            "You've got this!",
            "Time to shine!"
          ],
          'tab_changed': [
            "Exploring new content",
            "Discover what's next",
            "New lessons await"
          ],
          'streak_milestone': [
            "🔥 Streak milestone reached!",
            "Keep the fire burning!",
            "Consistency champion!"
          ]
        };

        const actionMsg = actionMessages[lastAction];
        if (actionMsg) {
          setCurrentText(actionMsg[Math.floor(Math.random() * actionMsg.length)]);
        }
        setIsVisible(true);
      }, 300);
    }
  }, [lastAction]);

  if (!currentText) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 flex items-center justify-center pb-32"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              key={currentText}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 0.03, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="text-center px-8"
            >
              <p className="text-[clamp(3rem,15vw,12rem)] font-black text-yellow-500/8 dark:text-yellow-400/6 leading-none select-none whitespace-nowrap">
                {currentText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DynamicBackgroundText;

