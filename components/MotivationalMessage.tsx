import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { UserData } from '../types';
import { Sparkles, Trophy, Rocket, Star } from 'lucide-react';

interface MotivationalMessageProps {
  user: UserData;
}

const MotivationalMessage: React.FC<MotivationalMessageProps> = ({ user }) => {
  const message = useMemo(() => {
    if (user.totalLessons === 0) {
      return {
        text: "Ready to start your ASL journey?",
        subtext: "Begin with an easy letter like 'A' to get comfortable!",
        icon: <Rocket className="w-5 h-5" />,
        color: "text-blue-600 dark:text-blue-400"
      };
    }
    if (user.totalLessons < 5) {
      return {
        text: "Great start! Keep the momentum going.",
        subtext: "You're building a strong foundation. Practice daily to see progress!",
        icon: <Star className="w-5 h-5" />,
        color: "text-purple-600 dark:text-purple-400"
      };
    }
    if (user.totalLessons < 15) {
      return {
        text: "You're making excellent progress!",
        subtext: "Try learning some phrases to expand your vocabulary.",
        icon: <Sparkles className="w-5 h-5" />,
        color: "text-emerald-600 dark:text-emerald-400"
      };
    }
    return {
      text: "You're becoming an ASL pro!",
      subtext: "Keep challenging yourself with new signs and phrases.",
      icon: <Trophy className="w-5 h-5" />,
      color: "text-amber-600 dark:text-amber-400"
    };
  }, [user.totalLessons]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 mb-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10"
    >
      <div className={`p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 ${message.color}`}>
        {message.icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-zinc-900 dark:text-white text-sm">{message.text}</p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{message.subtext}</p>
      </div>
    </motion.div>
  );
};

export default MotivationalMessage;

