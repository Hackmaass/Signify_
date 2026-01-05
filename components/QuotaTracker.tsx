import React, { useEffect, useState } from 'react';
import { getQuotaUsage } from '../services/geminiService';
import { Database, Server } from 'lucide-react';

const MAX_QUOTA = 100;

const QuotaTracker: React.FC = () => {
  const [usage, setUsage] = useState(0);

  const updateUsage = () => {
    setUsage(getQuotaUsage());
  };

  useEffect(() => {
    updateUsage();
    window.addEventListener('quota-updated', updateUsage);
    return () => window.removeEventListener('quota-updated', updateUsage);
  }, []);

  const percentage = Math.min(100, (usage / MAX_QUOTA) * 100);
  let colorClass = 'bg-blue-500';
  if (percentage > 70) colorClass = 'bg-amber-500';
  if (percentage > 90) colorClass = 'bg-red-500';

  return (
    <div className="glass-panel p-5 rounded-3xl border border-zinc-200 dark:border-white/10">
        <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                <Database className={`w-4 h-4 ${percentage > 90 ? 'text-red-500' : (percentage > 70 ? 'text-amber-500' : 'text-blue-500')}`} />
            </div>
            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Daily API Quota</h4>
                <div className="text-sm font-bold text-zinc-900 dark:text-white">
                    {usage} <span className="text-zinc-400 font-normal">/ {MAX_QUOTA}</span>
                </div>
            </div>
        </div>
        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${percentage}%` }} />
        </div>
    </div>
  );
};

export default QuotaTracker;