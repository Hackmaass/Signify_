import React from 'react';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full relative z-10">
      {/* Top Section - White/Light */}
      <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-white/5 px-8 lg:px-12 py-16">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-24">
          
          {/* Logo Section */}
          <div className="shrink-0">
            <h2 className="text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white">
              Signify
            </h2>
          </div>

          {/* Description Section */}
          <div className="max-w-2xl text-center lg:text-left">
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm md:text-base font-medium">
              Signify is an AI-powered platform designed to make learning sign language accessible, interactive, and engaging. 
              By combining real-time computer vision, gamified lessons, and instant feedback, we're bridging communication gaps 
              and empowering users to master sign language from anywhere in the world.
            </p>
          </div>

          {/* Contact Section */}
          <div className="shrink-0 text-center lg:text-left">
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-2">Still have questions?</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-1">Email us at</p>
            <a 
              href="mailto:omkarrane0934@gmail.com" 
              className="text-base font-black text-zinc-900 dark:text-white hover:underline decoration-2 underline-offset-4 flex items-center gap-2 justify-center lg:justify-start"
            >
              <Mail className="w-4 h-4" />
              omkarrane0934@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Section - Black/Dark */}
      <div className="bg-black text-white px-8 py-6">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-sm font-medium text-zinc-400">
            Made by <span className="text-white font-bold">Omkar Rane</span> - All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
