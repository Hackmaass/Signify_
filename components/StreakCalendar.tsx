import React, { useMemo, useState, useEffect } from 'react';
import { UserData } from '../types';
import { Flame, Quote, CalendarCheck, Trophy, Zap, TrendingUp, Target, Award, Star } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import ProgressPieChart from './ProgressPieChart';

interface Props {
  user: UserData;
  showChart: boolean;
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

const StreakCalendar: React.FC<Props> = ({ user, showChart }) => {
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
    let max = 0, curr = 0;
    const sortedDates = Object.keys(user.history).sort();
    for (const date of sortedDates) {
      if (user.history[date]) { curr++; max = Math.max(max, curr); } else curr = 0;
    }
    return max;
  }, [user.history]);

  const completionRate = useMemo(() => {
    return Math.round((activeDays / 84) * 100); // 12 weeks = 84 days
  }, [activeDays]);

  const calendarData = useMemo(() => {
    const today = new Date();
    const weeks = 12;
    const days = weeks * 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data.push({ date: d, dateStr, active: !!user.history[dateStr] });
    }
    return data;
  }, [user.history]);

  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < calendarData.length; i += 7) w.push(calendarData.slice(i, i + 7));
    return w;
  }, [calendarData]);

  return (
    <motion.div
      className="relative w-full max-w-md group"
      onMouseMove={(e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Background & Border Layer - CLIPPED */}
      <div className="absolute inset-0 rounded-[40px] overflow-hidden pointer-events-none">
        {/* Base Glass Panel */}
        <div className="absolute inset-0 glass-panel border border-zinc-200/50 dark:border-white/10 group-hover:border-zinc-300 dark:group-hover:border-white/20 transition-all duration-500 shadow-2xl dark:shadow-2xl bg-white/70 dark:bg-zinc-900/50 backdrop-blur-2xl" />

        {/* Animated Background Mesh */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, -45, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 p-8">
        {/* Enhanced Header with Stats - ALWAYS VISIBLE */}
        <div className="mb-8">
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
              className={`p-4 rounded-2xl border ${user.streak > 0
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
                  className={`text-4xl font-black tabular-nums ${user.streak > 0
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

          {!showChart && completionRate > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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

        {/* Visualization Section: Heatmap OR Pie Chart */}
        <div className="min-h-[220px] flex items-center justify-center mb-8 relative z-10 w-full">
          <AnimatePresence mode="wait">
            {showChart ? (
              <motion.div
                key="chart"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center"
              >
                <div className="flex items-center justify-center gap-2 mb-4 w-full">
                  <Trophy className="w-4 h-4 text-purple-500" />
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Mastery Overview</h3>
                </div>
                <ProgressPieChart user={user} />
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="flex flex-col gap-3">
                  {/* Top: Month Labels */}
                  <div className="flex pl-8 relative h-4 select-none">
                    {weeks.map((week, i) => {
                      const weekDate = week[0].date;
                      const prevWeekDate = i > 0 ? weeks[i - 1][0].date : null;
                      const isNewMonth = i === 0 || (prevWeekDate && weekDate.getMonth() !== prevWeekDate.getMonth());
                      const monthName = weekDate.toLocaleString('default', { month: 'short' });

                      return isNewMonth ? (
                        <div
                          key={i}
                          className="absolute text-[10px] font-bold text-zinc-400/80 dark:text-zinc-500 uppercase tracking-widest transform -translate-x-2"
                          style={{ left: `calc(${i * 100}% / ${weeks.length} + 32px)` }}
                        >
                          {monthName}
                        </div>
                      ) : null;
                    })}
                  </div>

                  {/* Main Grid Section */}
                  <div className="flex gap-2 relative">
                    {/* Left: Weekday Labels (All 7 days) */}
                    <div className="flex flex-col gap-2 pt-[2px] pr-2 select-none h-full justify-between pb-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="h-3 sm:h-3.5 flex items-center justify-end">
                          <span className="text-[9px] font-bold text-zinc-400/60 dark:text-zinc-600/80 uppercase tracking-normal tabular-nums leading-none">
                            {day}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Right: Heatmap Columns */}
                    <div className="flex justify-between gap-2 px-1 flex-1">
                      {weeks.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-col gap-2">
                          {week.map((day, dIdx) => {
                            const isToday = day.dateStr === new Date().toISOString().split('T')[0];

                            const getRelativeDate = (date: Date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              date.setHours(0, 0, 0, 0);
                              const diffTime = today.getTime() - date.getTime();
                              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                              if (diffDays === 0) return 'Today';
                              if (diffDays === 1) return 'Yesterday';
                              if (diffDays > 1) return `${diffDays} days ago`;
                              return '';
                            };

                            return (
                              <motion.div
                                key={day.dateStr}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.4, zIndex: 50 }}
                                onHoverStart={() => setHoveredDay(day.dateStr)}
                                onHoverEnd={() => setHoveredDay(null)}
                                transition={{
                                  delay: (wIdx * 7 + dIdx) * 0.002,
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 25
                                }}
                                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] sm:rounded text-[0px] relative group/day cursor-help transition-all duration-300 ${day.active
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-400 dark:from-blue-600 dark:to-cyan-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                  : isToday
                                    ? 'bg-zinc-300 dark:bg-zinc-700 ring-1 ring-zinc-400 dark:ring-zinc-600'
                                    : 'bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10'
                                  }`}
                              >
                                {day.active && (
                                  <div className="absolute inset-0 bg-white/20 rounded-[inherit]" />
                                )}

                                <AnimatePresence>
                                  {hoveredDay === day.dateStr && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                      animate={{ opacity: 1, y: -4, scale: 1 }}
                                      exit={{ opacity: 0, y: 2, scale: 0.9 }}
                                      className="absolute bottom-full left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                                    >
                                      <div className="px-3 py-2 bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/10 dark:border-zinc-900/10 flex flex-col items-center gap-0.5 whitespace-nowrap min-w-[100px]">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{day.date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                          <span className="text-[9px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-100/10 px-1 py-0.5 rounded">{getRelativeDate(day.date)}</span>
                                        </div>
                                        <span className="text-xs font-bold text-white dark:text-zinc-900 leading-none mb-1">{day.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>

                                        {day.active ? (
                                          <span className="text-[10px] font-bold text-cyan-400 dark:text-blue-600 flex items-center gap-1 mt-1">
                                            <CalendarCheck className="w-3 h-3" /> Practice Completed
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-1">No activity recorded</span>
                                        )}
                                      </div>
                                      <div className="w-2 h-2 bg-zinc-900/95 dark:bg-white/95 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quote Footer - ALWAYS VISIBLE */}
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
      </div>
    </motion.div>
  );
};

export default StreakCalendar;
