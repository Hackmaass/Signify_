import React, { useMemo, useState, useEffect } from 'react';
import { UserData } from '../types';
import { Flame, Quote, CalendarCheck, Trophy, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setMounted(true);
  }, []);

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
    <div className="glass-panel p-8 rounded-[32px] w-full max-w-md border border-zinc-200/50 dark:border-white/10 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-500 shadow-xl dark:shadow-2xl bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl">

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

      {/* Header with Stats */}
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 opacity-80 dark:opacity-60">
            <div className="p-1 rounded bg-blue-500/10 dark:bg-blue-500/20">
              <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">Total Sessions</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tight filter drop-shadow-sm">{user.totalLessons}</span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">lessons</span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1.5 opacity-80 dark:opacity-60">
            <div className={`p-1 rounded ${user.streak > 0 ? 'bg-amber-500/10 dark:bg-amber-500/20' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
              <Zap className={`w-3 h-3 ${user.streak > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-500'}`} />
            </div>
            <h2 className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">Current Streak</h2>
          </div>
          <div className="flex items-baseline justify-end gap-2">
            <span className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br ${user.streak > 0 ? 'from-amber-500 via-orange-500 to-red-600 dark:from-amber-300 dark:via-orange-400 dark:to-red-500' : 'from-zinc-400 to-zinc-600'} tabular-nums tracking-tight filter drop-shadow-sm`}>
              {user.streak}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">days</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex justify-between gap-1.5 mb-8 relative z-10 px-1">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1.5">
            {week.map((day, dIdx) => (
              <motion.div
                key={day.dateStr}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.5, zIndex: 50, borderRadius: "4px" }}
                transition={{
                  delay: (wIdx * 7 + dIdx) * 0.003,
                  type: "spring",
                  stiffness: 400,
                  damping: 20
                }}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] relative group/day cursor-help transition-all duration-300 ${day.active
                    ? 'bg-gradient-to-t from-blue-500 to-cyan-400 dark:from-blue-600 dark:to-cyan-400 shadow-[0_2px_4px_rgba(34,211,238,0.2)] dark:shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                    : 'bg-zinc-200 dark:bg-white/5 border border-transparent dark:border-white/5 hover:bg-zinc-300 dark:hover:border-white/20'
                  }`}
              >
                {/* Active Day Shimmer */}
                {day.active && (
                  <div className="absolute inset-0 bg-white/40 blur-[1px] rounded-[3px] opacity-0 group-hover/day:opacity-100 transition-opacity" />
                )}

                {/* Enhanced Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-[10px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover/day:opacity-100 transition-all pointer-events-none scale-75 group-hover/day:scale-100 origin-bottom flex flex-col items-center z-50">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[9px] uppercase tracking-wider mb-0.5">{day.date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span className="text-zinc-900 dark:text-white">{day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  {day.active && <span className="text-green-600 dark:text-green-400 text-[9px] mt-1 flex items-center gap-1"><CalendarCheck className="w-2 h-2" /> Completed</span>}

                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-zinc-900/95"></div>
                </div>
              </motion.div>
            ))}
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
    </div>
  );
};

export default StreakCalendar;
