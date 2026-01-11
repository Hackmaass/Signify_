import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { UserData } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';
import { ALPHABET_LESSONS, PHRASE_LESSONS } from '../data';

interface Props {
    user: UserData;
}

const ProgressPieChart: React.FC<Props> = ({ user }) => {
    // 1. Calculate Total Available Stats
    const allLessons = useMemo(() => [...ALPHABET_LESSONS, ...PHRASE_LESSONS], []);

    const stats = useMemo(() => {
        const total = allLessons.length;
        const easyTotal = allLessons.filter(l => l.difficulty === 'Easy').length;
        const mediumTotal = allLessons.filter(l => l.difficulty === 'Medium').length;
        const hardTotal = allLessons.filter(l => l.difficulty === 'Hard').length || 1; // Avoid divide by zero if none

        // 2. Calculate User Progress (Mock/Approximation Algorithm)
        // Since we don't have granular history, we distribute "totalLessons" completed
        // into Easy -> Medium -> Hard buckets sequentially.
        let remaining = user.totalLessons;

        const easyCompleted = Math.min(remaining, easyTotal);
        remaining = Math.max(0, remaining - easyTotal);

        const mediumCompleted = Math.min(remaining, mediumTotal);
        remaining = Math.max(0, remaining - mediumTotal);

        const hardCompleted = Math.min(remaining, hardTotal);

        return {
            total,
            easy: { completed: easyCompleted, total: easyTotal, color: '#22d3ee' }, // Cyan-400
            medium: { completed: mediumCompleted, total: mediumTotal, color: '#fbbf24' }, // Amber-400
            hard: { completed: hardCompleted, total: hardTotal, color: '#f87171' } // Red-400
        };
    }, [allLessons, user.totalLessons]);

    // 3. SVG Calculations for Ring Chart
    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    // Total completed
    const totalCompleted = stats.easy.completed + stats.medium.completed + stats.hard.completed;
    const validTotal = totalCompleted > 0 ? totalCompleted : 1; // Prevent 0/0

    const easyRatio = stats.easy.completed / validTotal;
    const mediumRatio = stats.medium.completed / validTotal;
    const hardRatio = stats.hard.completed / validTotal;

    return (
        <div className="w-full bg-zinc-900/50 rounded-2xl p-4 flex items-center justify-between gap-4">
            {/* Left: Ring Chart */}
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg width="160" height="160" viewBox="0 0 200 200" className="rotate-[-90deg]">
                    {/* Background Track */}
                    <circle
                        cx="100" cy="100" r={radius}
                        fill="none"
                        stroke="#27272a" // zinc-800
                        strokeWidth="8"
                    />

                    {/* Segments - Only render if user has data */}
                    {totalCompleted > 0 && (
                        <>
                            <circle cx="100" cy="100" r={radius} fill="none" stroke={stats.easy.color} strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${circumference * easyRatio} ${circumference}`} strokeDashoffset={0} />
                            <circle cx="100" cy="100" r={radius} fill="none" stroke={stats.medium.color} strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${circumference * mediumRatio} ${circumference}`} strokeDashoffset={-circumference * easyRatio} />
                            <circle cx="100" cy="100" r={radius} fill="none" stroke={stats.hard.color} strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${circumference * hardRatio} ${circumference}`} strokeDashoffset={-circumference * (easyRatio + mediumRatio)} />
                        </>
                    )}
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-white">{user.totalLessons}</span>
                        <span className="text-sm text-zinc-500 font-medium">/{stats.total}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Solved</span>
                    </div>
                </div>
            </div>

            {/* Right: Stats Legend */}
            <div className="flex-1 flex flex-col gap-3 min-w-[120px]">
                <StatRow label="Easy" color={stats.easy.color} current={stats.easy.completed} total={stats.easy.total} />
                <StatRow label="Med." color={stats.medium.color} current={stats.medium.completed} total={stats.medium.total} />
                <StatRow label="Hard" color={stats.hard.color} current={stats.hard.completed} total={stats.hard.total} />
            </div>
        </div>
    );
};

const StatRow = ({ label, color, current, total }: { label: string, color: string, current: number, total: number }) => (
    <div className="bg-zinc-800/50 rounded-lg p-2 flex items-center justify-between transition-colors hover:bg-zinc-800">
        <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
            <span className="text-xs font-medium text-zinc-400">{current}<span className="text-zinc-600">/</span>{total}</span>
        </div>
    </div>
);

export default ProgressPieChart;
