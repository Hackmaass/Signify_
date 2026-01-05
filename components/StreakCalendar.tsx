import React, { useMemo, useState, useEffect } from 'react';
import { UserData } from '../types';
import { Flame, Quote, CalendarCheck, Trophy, Zap, TrendingUp, Target, Award, Star } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

interface Props {
  user: UserData;
}

const QUOTES = [
  "The beautiful thing about learning is that no one can take it away from you.",
  "Consistency is what transforms average into excellence.",
  "Small steps every day add up to big results.",
  "Language is the road map of a culture.",
  "Don't practice until you get it right. Practice until you can't get it wrong.",
  "A different language is a different vision of life.",
  "Expertise is just practice standardized."
];

const StreakCalendar: React.FC<Props> = ({ user }) => {
  const [quote, setQuote] = useState('');
  const [mounted, setMounted] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setMounted(true);
  }, []);

  // Calculate statistics
  const activeDays = useMemo(() => {
    return Object.keys(user.history).filter(key => user.history[key]).length;
  }, [user.history]);

  const longestStreak = useMemo(() => {
    let maxStreak = 0;
    let currentStreak = 0;
    const sortedDates = Object.keys(user.history).sort();
    
    for (const date of sortedDates) {
      if (user.history[date]) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }, [user.history]);

  const completionRate = useMemo(() => {
    return Math.round((activeDays / 84) * 100); // 12 weeks = 84 days
  }, [activeDays]);

  // Generate the last 12 weeks for a cleaner look
  const calendarData = useMemo(() => {
    const today = new Date();
    const weeks = 12;
    const days = weeks * 7;
    const data = [];

    // Start from 'days' ago
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data.push({
        date: d,
        dateStr,
        active: !!user.history[dateStr]
      });
    }
    return data;
  }, [user.history]);

  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      w.push(calendarData.slice(i, i + 7));
    }
    return w;
  }, [calendarData]);

  return (
    <motion.div 
      className="glass-panel p-8 rounded-[40px] w-full max-w-md border border-zinc-200/50 dark:border-white/10 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-500 shadow-2xl dark:shadow-2xl bg-white/70 dark:bg-zinc-900/50 backdrop-blur-2xl"
      onMouseMove={(e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
      whileHover={{ scale: 1.02 }}
    >

      {/* Animated Background Mesh - Adapted for Light/Dark */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[80px] pointer-events-none mix-blend-multiply dark:mix-blend-screen"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -45, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply dark:mix-blend-screen"
      />

      {/* Enhanced Header with Stats */}
      <div className="relative z-10 mb-8">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-500/20 dark:border-blue-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">Total Lessons</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <motion.span 
                className="text-4xl font-black text-zinc-900 dark:text-white tabular-nums"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {user.totalLessons}
              </motion.span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className={`p-4 rounded-2xl border ${
              user.streak > 0 
                ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border-amber-500/30 dark:border-amber-500/40' 
                : 'bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {user.streak > 0 ? (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </motion.div>
              ) : (
                <Zap className="w-4 h-4 text-zinc-500" />
              )}
              <h3 className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">Current Streak</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <motion.span 
                className={`text-4xl font-black tabular-nums ${
                  user.streak > 0 
                    ? 'text-transparent bg-clip-text bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 dark:from-amber-300 dark:via-orange-400 dark:to-red-500' 
                    : 'text-zinc-400 dark:text-zinc-600'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.25, type: "spring" }}
              >
                {user.streak}
              </motion.span>
              <span className="text-xs font-semibold text-zinc-500">days</span>
            </div>
          </motion.div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Active Days</span>
            </div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{activeDays}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-3 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Best Streak</span>
            </div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{longestStreak}</span>
          </motion.div>
        </div>

        {/* Completion Rate */}
        {completionRate > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">12-Week Progress</span>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">{completionRate}%</span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Heatmap Grid */}
      <div className="flex justify-between gap-2 mb-8 relative z-10 px-1">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-2">
            {week.map((day, dIdx) => {
              const isToday = day.dateStr === new Date().toISOString().split('T')[0];
              return (
                <motion.div
                  key={day.dateStr}
                  initial={{ scale: 0, opacity: 0, rotate: -180 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  whileHover={{ scale: 1.8, zIndex: 50, rotate: 5 }}
                  onHoverStart={() => setHoveredDay(day.dateStr)}
                  onHoverEnd={() => setHoveredDay(null)}
                  transition={{
                    delay: (wIdx * 7 + dIdx) * 0.003,
                    type: "spring",
                    stiffness: 400,
                    damping: 20
                  }}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-md relative group/day cursor-help transition-all duration-300 ${
                    day.active
                      ? 'bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-400 dark:from-blue-600 dark:via-cyan-500 dark:to-teal-500 shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30 ring-2 ring-blue-400/30 dark:ring-blue-400/20'
                      : isToday
                      ? 'bg-zinc-400 dark:bg-zinc-600 ring-2 ring-zinc-500/50 dark:ring-zinc-500/30'
                      : 'bg-zinc-200 dark:bg-white/5 border border-zinc-300 dark:border-white/10 hover:bg-zinc-300 dark:hover:bg-white/10'
                  }`}
                >
                  {/* Active Day Effects */}
                  {day.active && (
                    <>
                      <motion.div
                        className="absolute inset-0 bg-white/30 rounded-md"
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.div
                        className="absolute -inset-1 bg-blue-400/20 rounded-md blur-sm"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </>
                  )}
                  
                  {isToday && !day.active && (
                    <motion.div
                      className="absolute inset-0 border-2 border-dashed border-zinc-500 dark:border-zinc-400 rounded-md"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}

                  {/* Enhanced Tooltip */}
                  <AnimatePresence>
                    {hoveredDay === day.dateStr && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.9 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2.5 bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap pointer-events-none flex flex-col items-center z-50"
                      >
                        <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-wider mb-1">{day.date.toLocaleDateString(undefined, { weekday: 'long' })}</span>
                        <span className="text-zinc-900 dark:text-white font-bold">{day.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        {day.active ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[10px] mt-2 flex items-center gap-1.5 font-bold">
                            <CalendarCheck className="w-3 h-3" /> Lesson Completed
                          </span>
                        ) : isToday ? (
                          <span className="text-blue-600 dark:text-blue-400 text-[10px] mt-2 flex items-center gap-1.5">
                            <Star className="w-3 h-3" /> Today
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[10px] mt-2">No practice</span>
                        )}
                        {/* Tooltip Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-zinc-900/95"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Quote Footer */}
      <AnimatePresence>
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative pt-6 border-t border-zinc-200 dark:border-white/5 flex gap-4 items-start group/quote"
          >
            <div className="p-2 rounded-xl bg-blue-500/5 dark:bg-white/5 group-hover/quote:bg-blue-500/10 dark:group-hover/quote:bg-white/10 transition-colors">
              <Quote className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 fill-blue-500/20 dark:fill-blue-400/20" />
            </div>
            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed italic opacity-90 dark:opacity-80 group-hover/quote:opacity-100 transition-opacity">
                "{quote}"
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 uppercase tracking-widest font-bold">Daily Inspiration</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StreakCalendar;
