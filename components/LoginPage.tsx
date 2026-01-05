import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { loginWithEmail, registerWithEmail } from '../services/firebaseService';
import { UserData } from '../types';
import SplitText from './SplitText';
import ClickSpark from './ClickSpark';

// REPLACE THIS WITH YOUR UPLOADED CAT IMAGE URL/PATH
const HERO_IMAGE_URL = "/login_cat.png";
// Note: Please update the above URL to point to your transparent cat image file (e.g. "/assets/my-cat.png")

interface LoginPageProps {
    onLoginSuccess: (user: UserData) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const validate = () => {
        if (!email.includes('@')) { setError("Invalid email address."); return false; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return false; }
        if (isSignUp && name.trim().length < 2) { setError("Name is required."); return false; }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setError(null);

        try {
            let user: UserData;
            if (isSignUp) {
                user = await registerWithEmail(email, password, name);
            } else {
                user = await loginWithEmail(email, password);
            }
            onLoginSuccess(user);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Email is already registered.");
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else {
                setError(err.message || "Authentication failed.");
            }
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            key="login-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen w-full flex bg-[#000000] overflow-hidden selection:bg-blue-500/30 font-sans"
        >
            {/* --- Left Column: Content & Form --- */}
            <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 z-20 relative bg-black/50 backdrop-blur-sm lg:bg-transparent">

                {/* Mobile Background Fade */}
                <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-black/20 via-black/80 to-black z-[-1]" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-[420px] mx-auto"
                >
                    {/* Brand Header */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-8">
                            {/* Logo Icon Removed as requested */}
                            <motion.h1
                                layoutId="app-logo-text"
                                className="text-3xl font-bold tracking-tight text-white"
                            >
                                Signify
                            </motion.h1>
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white mb-4 leading-[1.1]">
                            {isSignUp ? "Create your\naccount." : "Welcome\nback."}
                        </h2>
                        <p className="text-zinc-400 text-lg font-medium leading-relaxed">
                            Your personal AI tutor for mastering American Sign Language.
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {isSignUp && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="overflow-hidden"
                                >
                                    <Input
                                        type="text"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />

                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-xl"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-4">
                            <ClickSpark
                                sparkColor="#fff"
                                sparkSize={12}
                                sparkRadius={25}
                                sparkCount={10}
                                duration={500}
                            >
                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-semibold text-[17px] py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(0,113,227,0.3)] hover:shadow-[0_0_30px_rgba(0,113,227,0.5)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span>{isSignUp ? "Get Started" : "Sign In"}</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>
                            </ClickSpark>
                        </div>
                    </form>

                    {/* Footer Toggle */}
                    <div className="mt-8 flex items-center gap-2">
                        <span className="text-zinc-500">{isSignUp ? "Already have an account?" : "New to Signify?"}</span>
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                            className="text-[#2997ff] hover:text-[#4dabff] font-medium transition-colors"
                        >
                            {isSignUp ? "Sign in" : "Create account"}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* --- Right Column: Hero Visual --- */}
            <div className="hidden lg:flex flex-1 relative bg-[#09090b] items-end justify-end overflow-hidden">
                {/* Ambient Lighting */}
                <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Grid Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

                {/* Glow behind the cat */}
                <div className="absolute bottom-0 right-0 w-[80%] h-[80%] bg-gradient-to-t from-blue-500/5 to-transparent blur-3xl z-10" />

                {/* Marketing Text Sequence */}
                <div className="absolute top-32 left-14 z-30 max-w-xl font-sans">
                    <SplitText
                        text="Hello There"
                        className="text-6xl font-bold text-white mb-6"
                        delay={30}
                        duration={0.6}
                        
                    />
                    <SplitText
                        text="Welcome to Signify"
                        className="text-4xl font-semibold text-white/80 mb-4"
                        delay={20}
                        duration={0.6}
                        rootMargin="-50px"
                    />
                     <div className="mt-8 space-y-3">
                        <SplitText
                            text="The master platform for Sign Language"
                            className="text-xl font-medium text-zinc-400"
                            delay={15}
                            duration={0.5}
                        />
                        <SplitText
                            text="Experience real-time AI feedback on your gestures."
                            className="text-lg text-zinc-500 block"
                            delay={10}
                            duration={0.5}
                        />
                        <SplitText
                            text="Learn at your own pace, anytime, anywhere."
                            className="text-lg text-zinc-500 block"
                            delay={10}
                            duration={0.5}
                        />
                     </div>
                </div>

                {/* Cat Image Anchored to Bottom Right */}
                <motion.img
                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    src={HERO_IMAGE_URL}
                    alt="Signify Guide"
                    className="relative z-20 h-[90vh] w-auto object-contain object-right-bottom drop-shadow-2xl translate-x-12 translate-y-8"
                // translate to push it slightly off screen if needed to look "attached" to edge
                />
            </div>
        </motion.div>
    );
};

// --- Reusable Input Component ---
const Input = ({ type, placeholder, value, onChange }: any) => (
    <div className="group relative">
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full bg-[#1c1c1e] text-white placeholder:text-zinc-500 px-5 py-4 rounded-2xl border border-transparent focus:border-[#0071e3]/50 focus:bg-[#2c2c2e] focus:outline-none focus:ring-4 focus:ring-[#0071e3]/10 transition-all font-medium text-[16px]"
        />
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5" />
    </div>
);

export default LoginPage;
