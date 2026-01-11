import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Info, X, Sparkles, Camera, BookOpen, Zap } from 'lucide-react';
import ClickSpark from './ClickSpark';

interface LandingPageProps {
    onNavigateToLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
    const [showKnowMore, setShowKnowMore] = useState(false);

    return (
        <>
            <motion.div
                key="landing-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1]
                }}
                className="min-h-screen w-full flex items-center justify-center bg-[#000000] overflow-hidden relative font-sans"
            >
                {/* Background Ambient Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                </div>

                {/* Large Background Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 1.15, filter: "blur(40px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(12px)" }}
                    transition={{
                        duration: 2,
                        ease: [0.16, 1, 0.3, 1],
                        opacity: { duration: 1.5 }
                    }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                >
                    <motion.div
                        animate={{
                            scale: [1, 1.03, 1],
                            rotate: [0, 1, -1, 0],
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative"
                    >
                        <img
                            src="/logo.png"
                            alt="Signify Logo"
                            className="w-[800px] h-[800px] sm:w-[1000px] sm:h-[1000px] md:w-[1200px] md:h-[1200px] opacity-[0.2]"
                        />
                        {/* Gradient overlay for depth */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.3) 100%)'
                            }}
                        />
                    </motion.div>
                </motion.div>

                {/* Secondary blurred logo layers for depth */}
                <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 2.5, delay: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]"
                >
                    <img
                        src="/logo.png"
                        alt=""
                        className="w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] opacity-[0.1] blur-[40px]"
                    />
                </motion.div>

                {/* Main Content */}
                <div className="relative z-20 text-center px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                        className="relative inline-block mb-12"
                    >
                        {/* Animated glow effect behind text */}
                        <motion.div
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 blur-3xl -z-10"
                        >
                            <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Signify
                            </h1>
                        </motion.div>

                        {/* Main text with gradient */}
                        <h1 className="relative text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter">
                            <span
                                className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent"
                                style={{
                                    textShadow: '0 0 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(59, 130, 246, 0.3), 0 0 120px rgba(59, 130, 246, 0.2)'
                                }}
                            >
                                Signify
                            </span>
                        </h1>

                        {/* Additional light rays effect */}
                        <motion.div
                            animate={{
                                opacity: [0.1, 0.2, 0.1],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 blur-2xl -z-20"
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                                transform: 'scale(1.2)'
                            }}
                        />
                    </motion.div>

                    {/* Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
                    >
                        <ClickSpark
                            sparkColor="#fff"
                            sparkSize={10}
                            sparkRadius={20}
                            sparkCount={8}
                            duration={400}
                        >
                            <motion.button
                                onClick={onNavigateToLogin}
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative group overflow-hidden bg-[#0071e3] hover:bg-[#0077ED] text-white font-semibold text-[16px] px-10 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(0,113,227,0.4)] hover:shadow-[0_8px_30px_rgba(0,113,227,0.6)]"
                            >
                                {/* Subtle shine on hover */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: '200%' }}
                                    transition={{ duration: 0.6 }}
                                />

                                {/* Content */}
                                <span className="relative z-10 flex items-center gap-3">
                                    <LogIn className="w-5 h-5" />
                                    <span>Login</span>
                                </span>
                            </motion.button>
                        </ClickSpark>

                        <ClickSpark
                            sparkColor="#fff"
                            sparkSize={8}
                            sparkRadius={15}
                            sparkCount={6}
                            duration={400}
                        >
                            <motion.button
                                onClick={() => setShowKnowMore(true)}
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative group overflow-hidden bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-medium text-[14px] px-6 py-3 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                            >
                                {/* Subtle shine */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: '200%' }}
                                    transition={{ duration: 0.6 }}
                                />

                                {/* Content */}
                                <span className="relative z-10 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    <span>Know More</span>
                                </span>
                            </motion.button>
                        </ClickSpark>
                    </motion.div>
                </div>
            </motion.div>

            {/* Know More Modal */}
            <AnimatePresence>
                {showKnowMore && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowKnowMore(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#1c1c1e] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-3xl font-bold text-white">About Signify</h2>
                                    <button
                                        onClick={() => setShowKnowMore(false)}
                                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="space-y-6 text-white/80">
                                    <p className="text-lg leading-relaxed">
                                        Signify is your personal AI-powered tutor for mastering American Sign Language (ASL).
                                        Learn sign language interactively with real-time feedback and guidance.
                                    </p>

                                    {/* Features Grid */}
                                    <div className="grid md:grid-cols-2 gap-4 mt-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-6"
                                        >
                                            <Camera className="w-8 h-8 text-[#0071e3] mb-4" />
                                            <h3 className="font-semibold text-white mb-2 text-lg">Real-time Feedback</h3>
                                            <p className="text-sm text-white/60">
                                                Get instant AI-powered feedback on your sign language gestures using your camera.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-6"
                                        >
                                            <BookOpen className="w-8 h-8 text-[#0071e3] mb-4" />
                                            <h3 className="font-semibold text-white mb-2 text-lg">Comprehensive Lessons</h3>
                                            <p className="text-sm text-white/60">
                                                Learn the alphabet, common phrases, and generate custom lessons with AI.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-6"
                                        >
                                            <Zap className="w-8 h-8 text-[#0071e3] mb-4" />
                                            <h3 className="font-semibold text-white mb-2 text-lg">Track Progress</h3>
                                            <p className="text-sm text-white/60">
                                                Monitor your learning streak, completed lessons, and overall progress.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-6"
                                        >
                                            <Sparkles className="w-8 h-8 text-[#0071e3] mb-4" />
                                            <h3 className="font-semibold text-white mb-2 text-lg">AI-Powered</h3>
                                            <p className="text-sm text-white/60">
                                                Generate custom lessons tailored to your learning goals using advanced AI.
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* CTA */}
                                    <div className="pt-6 border-t border-white/10 mt-8">
                                        <ClickSpark
                                            sparkColor="#fff"
                                            sparkSize={12}
                                            sparkRadius={25}
                                            sparkCount={10}
                                            duration={500}
                                        >
                                            <motion.button
                                                onClick={onNavigateToLogin}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-semibold text-[17px] py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(0,113,227,0.3)] hover:shadow-[0_0_30px_rgba(0,113,227,0.5)] flex items-center justify-center gap-3"
                                            >
                                                <LogIn className="w-5 h-5" />
                                                Get Started
                                            </motion.button>
                                        </ClickSpark>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default LandingPage;
