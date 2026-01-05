import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, UserCircle, Award, TrendingUp, Calendar, X } from 'lucide-react';
import { UserData } from '../types';

interface ProfileMenuProps {
  user: UserData;
  onClose: () => void;
  onLogout: () => void;
  onViewProfile?: () => void;
  onSettings?: () => void;
  position: { x: number; y: number };
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, onClose, onLogout, onViewProfile, onSettings, position }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const stats = [
    { label: 'Total Lessons', value: user.totalLessons, icon: <Award className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Current Streak', value: `${user.streak} days`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Active Days', value: Object.keys(user.history).filter(k => user.history[k]).length, icon: <Calendar className="w-4 h-4" />, color: 'text-purple-600 dark:text-purple-400' },
  ];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[299] bg-black/20 backdrop-blur-sm"
      />
      
      {/* Menu */}
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[300] glass-panel rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 p-6 min-w-[320px] max-w-sm"
        style={{
          top: '80px',
          right: '20px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Profile</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-200 dark:border-white/10">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-white/10 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-zinc-900 dark:text-white text-lg">{user.displayName}</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">ASL Learner</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 text-center"
            >
              <div className={`${stat.color} flex items-center justify-center mb-1.5`}>
                {stat.icon}
              </div>
              <div className="text-xl font-black text-zinc-900 dark:text-white mb-0.5">
                {stat.value}
              </div>
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-1 mb-4">
          <button
            onClick={() => {
              if (onViewProfile) {
                onViewProfile();
              } else {
                // Default: scroll to progress section
                const progressSection = document.querySelector('[data-tutorial="streak"]');
                progressSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30 transition-colors">
              <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-zinc-900 dark:text-white text-sm">View Profile</div>
              <div className="text-xs text-zinc-500">See your full progress</div>
            </div>
          </button>

          <button
            onClick={() => {
              if (onSettings) {
                onSettings();
              } else {
                // Default: show settings info (could be expanded later)
                alert('Settings coming soon! For now, use the theme toggle in the dock to switch between dark and light mode.');
              }
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 group-hover:bg-purple-500/20 dark:group-hover:bg-purple-500/30 transition-colors">
              <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-zinc-900 dark:text-white text-sm">Settings</div>
              <div className="text-xs text-zinc-500">Preferences & options</div>
            </div>
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 border border-red-500/20 dark:border-red-500/30 transition-colors text-left group"
        >
          <div className="p-2 rounded-lg bg-red-500/20 dark:bg-red-500/30">
            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-red-600 dark:text-red-400 text-sm">Sign Out</div>
            <div className="text-xs text-red-500/70 dark:text-red-400/70">Log out of your account</div>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileMenu;

