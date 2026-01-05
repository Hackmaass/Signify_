import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Sparkles, ArrowRight, BookOpen, Zap, Award, PlayCircle } from 'lucide-react';
import { UserData, Lesson } from '../types';

interface DashboardSuggestionsProps {
  user: UserData;
  onStartLesson: (lesson: Lesson) => void;
  recommendedLessons?: Lesson[];
}

const DashboardSuggestions: React.FC<DashboardSuggestionsProps> = ({ user, onStartLesson, recommendedLessons = [] }) => {
  const completionRate = user.totalLessons > 0 ? Math.min(100, (user.totalLessons / 26) * 100) : 0;
  const hasStreak = user.streak > 0;
  const isNewUser = user.totalLessons === 0;

  // Get next suggested lesson
  const getSuggestedLesson = () => {
    if (recommendedLessons.length > 0) {
      return recommendedLessons[0];
    }
    return null;
  };

  const suggestedLesson = getSuggestedLesson();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
      {/* Daily Goal Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 rounded-3xl border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all group cursor-pointer"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          {hasStreak && (
            <div className="px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">🔥 {user.streak} Day Streak</span>
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Daily Goal</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          {isNewUser 
            ? "Complete your first lesson today to start your learning journey!"
            : hasStreak
            ? `Keep your ${user.streak}-day streak alive! Practice at least one lesson today.`
            : "Complete at least one lesson today to build your streak."
          }
        </p>
        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${hasStreak ? 100 : 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6 rounded-3xl border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Your Progress</h3>
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black text-zinc-900 dark:text-white">{Math.round(completionRate)}%</span>
            <span className="text-sm text-zinc-500">Complete</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.totalLessons} lesson{user.totalLessons !== 1 ? 's' : ''} completed
          </p>
        </div>
        <div className="relative h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Quick Start / Recommended Lesson */}
      {suggestedLesson && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onStartLesson(suggestedLesson)}
          className="glass-panel p-6 rounded-3xl border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all group cursor-pointer hover:shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20">
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <motion.div
              whileHover={{ x: 4 }}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </motion.div>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Recommended</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {isNewUser 
              ? "Start with this lesson to begin your ASL journey"
              : "Continue learning with this suggested lesson"
            }
          </p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-white/10">
              <span className="text-xl font-bold text-zinc-900 dark:text-white">{suggestedLesson.letter}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-zinc-900 dark:text-white">{suggestedLesson.letter}</p>
              <p className="text-xs text-zinc-500">{suggestedLesson.difficulty}</p>
            </div>
            <PlayCircle className="w-5 h-5 text-zinc-400" />
          </div>
        </motion.div>
      )}

      {/* Achievement Badge */}
      {user.totalLessons >= 5 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="glass-panel p-6 rounded-3xl border-2 border-amber-500/30 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 dark:bg-amber-500/30">
              <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Milestone!</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Keep up the great work</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              {user.totalLessons} Lessons Completed
            </span>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel p-6 rounded-3xl border border-zinc-200 dark:border-white/10"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20">
            <Zap className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-left">
            <BookOpen className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <span className="text-sm font-medium text-zinc-900 dark:text-white">Browse All Lessons</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-left">
            <Sparkles className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <span className="text-sm font-medium text-zinc-900 dark:text-white">Create Custom Lesson</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardSuggestions;

