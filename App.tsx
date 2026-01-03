import React, { useState, useEffect } from 'react';
import { UserData, Lesson, LessonCategory } from './types';
import { signOut, onAuthStateChange, getUserData } from './services/firebaseService';
import { generateLessonPlan } from './services/geminiService';
import StreakCalendar from './components/StreakCalendar';
import LessonView from './components/LessonView';
import LoginPage from './components/LoginPage';
import Dock from './components/Dock';
import { Play, LogOut, GraduationCap, ChevronRight, MessageSquare, Type, Sparkles, Wand2, Home, Activity, Moon, Sun, BookOpen, LogIn, ArrowUpRight, Loader2, Search, MoveRight } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

// --- DATA DEFINITIONS ---

const getStableWikiUrl = (char: string) => {
    const charUpper = char.toUpperCase();
    return `https://commons.wikimedia.org/wiki/Special:FilePath/Sign_language_${charUpper}.svg?width=500`;
};

const generateAlphabet = (): Lesson[] => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    return letters.map((char) => ({
        id: `alpha-${char}`,
        category: 'alphabet',
        type: 'static',
        letter: char,
        description: `Sign for letter ${char}`,
        imageUrl: getStableWikiUrl(char),
        difficulty: ['A', 'B', 'C', 'E', 'F', 'I', 'L', 'O', 'U', 'V'].includes(char) ? 'Easy' : 'Medium'
    }));
};

const ALPHABET_LESSONS: Lesson[] = generateAlphabet().map(l => {
    if (l.letter === 'J') { l.description = "Trace a 'J' in the air with your pinky."; l.type = 'dynamic'; }
    if (l.letter === 'Z') { l.description = "Trace a 'Z' in the air with your index finger."; l.type = 'dynamic'; }
    return l;
});

const PHRASE_LESSONS: Lesson[] = [
    { id: 'p1', category: 'phrase', type: 'dynamic', letter: 'Thank You', description: 'A gesture of gratitude.', instruction: 'Start with the fingertips of your flat hand on your chin. Move your hand forward and down towards the person you are thanking.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Thank+You&font=roboto', difficulty: 'Easy' },
    { id: 'p2', category: 'phrase', type: 'dynamic', letter: 'Please', description: 'Used for polite requests.', instruction: 'Place your flat hand on your chest and move it in a circular motion (clockwise).', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Please&font=roboto', difficulty: 'Easy' },
    { id: 'p3', category: 'phrase', type: 'dynamic', letter: 'Help', description: 'Asking for assistance.', instruction: 'Place your closed fist (thumb up) of one hand onto the open palm of the other hand. Lift both hands together.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Help&font=roboto', difficulty: 'Medium' },
    { id: 'p4', category: 'phrase', type: 'dynamic', letter: 'Yes', description: 'Nodding your fist.', instruction: 'Make a fist at shoulder height. Bend your wrist forward and back like a head nodding.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Yes&font=roboto', difficulty: 'Easy' },
    { id: 'p5', category: 'phrase', type: 'dynamic', letter: 'No', description: 'Tapping fingers together.', instruction: 'Tap your index and middle fingers against your thumb twice, like a mouth closing.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=No&font=roboto', difficulty: 'Easy' },
    { id: 'p6', category: 'phrase', type: 'dynamic', letter: 'Sorry', description: 'Circular rub on chest.', instruction: 'Make a fist with your thumb against the side. Rub it in a circle over your heart area.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Sorry&font=roboto', difficulty: 'Easy' },
    { id: 'p7', category: 'phrase', type: 'dynamic', letter: 'Hello', description: 'A standard salute.', instruction: 'Place your flat hand near your forehead and move it outward in a small arc.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Hello&font=roboto', difficulty: 'Easy' },
    { id: 'p8', category: 'phrase', type: 'dynamic', letter: 'Good', description: 'Chin to palm gesture.', instruction: 'Touch your chin with fingertips, then bring your hand down into your other open palm.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Good&font=roboto', difficulty: 'Medium' },
    { id: 'p9', category: 'phrase', type: 'dynamic', letter: 'I Love You', description: 'The ILY handshape.', instruction: 'Extend your thumb, index, and pinky fingers. Keep middle and ring fingers down.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=I+Love+You&font=roboto', difficulty: 'Easy' },
];

export default function App() {
    const [user, setUser] = useState<UserData | null>(null);
    const [lessonQueue, setLessonQueue] = useState<Lesson[]>([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<LessonCategory>('alphabet');
    const [customInput, setCustomInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLessons, setGeneratedLessons] = useState<Lesson[]>([]);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [theme]);

    // Handle Authentication State Persistency
    useEffect(() => {
        const unsubscribe = onAuthStateChange((userData) => {
            setUser(userData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut();
        setUser(null);
    };

    const handleGenerateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customInput.trim()) return;
        setIsGenerating(true);
        try {
            const lessons = await generateLessonPlan(customInput);
            if (lessons.length === 0) {
                alert("Could not generate lessons. This might be due to API limits or invalid input. Try a shorter sentence.");
            }
            setGeneratedLessons(lessons);
        } catch (err: any) {
            console.error("Generation Error:", err);
            alert(`Failed to generate lesson: ${err.message || 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const startLesson = (lessons: Lesson[], startIndex: number = 0) => {
        setLessonQueue(lessons);
        setCurrentQueueIndex(startIndex);
    };

    const handleLessonComplete = (updatedUser: UserData) => {
        setUser(updatedUser);
        if (currentQueueIndex < lessonQueue.length - 1) {
            setCurrentQueueIndex(prev => prev + 1);
        } else {
            setLessonQueue([]);
            setCurrentQueueIndex(-1);
        }
    };

    const dockItems = [
        { label: 'Home', icon: <Home />, onClick: () => { setLessonQueue([]); setCurrentQueueIndex(-1); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
        { label: 'Lessons', icon: <BookOpen />, onClick: () => { setLessonQueue([]); setCurrentQueueIndex(-1); setActiveTab('alphabet'); document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth' }); } },
        { label: 'Progress', icon: <Activity />, onClick: () => { setLessonQueue([]); setCurrentQueueIndex(-1); document.getElementById('progress-area')?.scrollIntoView({ behavior: 'smooth' }); } },
        { label: theme === 'dark' ? 'Light' : 'Dark', icon: theme === 'dark' ? <Sun /> : <Moon />, onClick: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark') },
        { label: user ? 'Logout' : 'Login', icon: user ? <LogOut /> : <LogIn />, onClick: user ? handleLogout : () => { } }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-accent w-8 h-8" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-text-primary transition-colors duration-500 overflow-x-hidden">
            <LayoutGroup>
                <AnimatePresence mode="wait">
                    {!user ? (
                        <LoginPage key="login" onLoginSuccess={setUser} />
                    ) : (
                        <motion.div
                            key="authenticated-app"
                            className="contents"
                        >
                            <AnimatePresence mode="wait">
                                {currentQueueIndex !== -1 && lessonQueue[currentQueueIndex] ? (
                                    <motion.div
                                        key="lesson-view"
                                        initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        className="fixed inset-0 z-50 bg-background"
                                    >
                                        <LessonView
                                            key={lessonQueue[currentQueueIndex].id}
                                            lesson={lessonQueue[currentQueueIndex]}
                                            user={user}
                                            onBack={() => { setLessonQueue([]); setCurrentQueueIndex(-1); }}
                                            onComplete={handleLessonComplete}
                                            hasNext={currentQueueIndex < lessonQueue.length - 1}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="dashboard"
                                        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        className="min-h-screen pb-32 relative"
                                    >
                                        <Dock items={dockItems} />

                                        {/* Signify Text Logo (Fixed Top-Left for Brand Visibility) */}
                                        <div className="fixed top-6 left-8 z-40 pointer-events-none select-none">
                                            <motion.h1
                                                layoutId="app-logo"
                                                className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white"
                                            >
                                                Signify
                                            </motion.h1>
                                        </div>

                                        <header className="pt-24 pb-12 px-8 max-w-[1600px] mx-auto">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8"
                                            >
                                                <div>
                                                    <h2 className="text-text-secondary font-medium mb-1">Welcome back, {user.displayName ? user.displayName.split(' ')[0] : 'Learner'}</h2>
                                                    <h1 className="text-5xl font-bold tracking-tight text-gradient">Dashboard</h1>
                                                </div>
                                                <div id="progress-area" className="hidden md:block w-full max-w-md">
                                                    <StreakCalendar user={user} />
                                                </div>
                                            </motion.div>
                                        </header>

                                        <main id="content-area" className="px-8 max-w-[1600px] mx-auto space-y-16">

                                            {/* Premium Tab Navigation */}
                                            <nav className="flex justify-center mb-8">
                                                <div className="p-1.5 bg-zinc-200/50 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl inline-flex gap-1 relative shadow-xl">
                                                    {['alphabet', 'phrase', 'custom'].map((tab) => (
                                                        <button
                                                            key={tab}
                                                            onClick={() => setActiveTab(tab as LessonCategory)}
                                                            className={`relative px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 z-10 ${activeTab === tab
                                                                ? 'text-black dark:text-black'
                                                                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                                                }`}
                                                        >
                                                            {tab === 'custom' ? 'AI Generator' : `${tab.charAt(0).toUpperCase() + tab.slice(1)}s`}
                                                            {activeTab === tab && (
                                                                <motion.div
                                                                    layoutId="active-tab"
                                                                    className="absolute inset-0 bg-white dark:bg-white rounded-xl border border-zinc-200 dark:border-black/5 shadow-md -z-10"
                                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </nav>

                                            {/* Content Grid */}
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={activeTab}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {activeTab === 'alphabet' && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5">
                                                            {ALPHABET_LESSONS.map((lesson, i) => (
                                                                <AlphabetCard key={lesson.id} lesson={lesson} onClick={() => startLesson([lesson])} index={i} />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {activeTab === 'phrase' && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {PHRASE_LESSONS.map((lesson, i) => (
                                                                <PhraseCard key={lesson.id} lesson={lesson} onClick={() => startLesson([lesson])} index={i} />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {activeTab === 'custom' && (
                                                        <div className="space-y-12">
                                                            {/* Hero AI Generator Card */}
                                                            <div className="glass-panel-heavy p-10 rounded-[2.5rem] relative overflow-hidden group border border-white/20 dark:border-white/10 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-black">
                                                                {/* Animated Gradient Border effect via overlay */}
                                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

                                                                <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                                                                    <div className="flex-1">
                                                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider mb-6">
                                                                            <Sparkles className="w-3 h-3" />
                                                                            Gemini Powered
                                                                        </div>
                                                                        <h3 className="text-4xl md:text-5xl font-bold mb-4 text-zinc-900 dark:text-white tracking-tight">Create your own <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Curriculum</span></h3>
                                                                        <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-8 leading-relaxed max-w-xl">
                                                                            Enter any phrase, song lyric, or sentence. Our AI will instantly break it down into a step-by-step sign language lesson plan for you.
                                                                        </p>

                                                                        <form onSubmit={handleGenerateLesson} className="flex gap-3 max-w-lg relative">
                                                                            <div className="relative flex-1 group/input">
                                                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 group-hover/input:opacity-100 blur transition duration-500"></div>
                                                                                <input
                                                                                    value={customInput}
                                                                                    onChange={(e) => setCustomInput(e.target.value)}
                                                                                    placeholder="e.g., How are you today?"
                                                                                    className="relative w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-xl px-6 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                                                                />
                                                                            </div>
                                                                            <button
                                                                                disabled={isGenerating}
                                                                                className="relative bg-zinc-900 dark:bg-white text-white dark:text-black px-8 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                                                                            >
                                                                                {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                                                                    <>
                                                                                        <span>Generate</span>
                                                                                        <Wand2 className="w-4 h-4" />
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </form>
                                                                    </div>

                                                                    {/* Visual Illustration */}
                                                                    <div className="hidden md:flex w-1/3 aspect-square relative items-center justify-center">
                                                                        <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
                                                                        <div className="relative z-10 grid grid-cols-2 gap-4 opacity-80 rotate-3 scale-90">
                                                                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl animate-pulse"><div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-3" /><div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" /></div>
                                                                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl translate-y-8"><div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-3" /><div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" /></div>
                                                                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl -translate-y-4"><div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-3" /><div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" /></div>
                                                                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl translate-y-4"><div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-3" /><div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" /></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {generatedLessons.length > 0 && (
                                                                <div className="space-y-8">
                                                                    <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/10 pb-4">
                                                                        <h3 className="text-2xl font-bold text-text-primary">Curriculum Preview</h3>
                                                                        <button onClick={() => startLesson(generatedLessons)} className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20">
                                                                            <Play className="w-4 h-4 fill-current" />
                                                                            Start Learning
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                        {generatedLessons.map((lesson, i) => (
                                                                            <PhraseCard key={lesson.id} lesson={lesson} onClick={() => startLesson(generatedLessons, i)} index={i} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </AnimatePresence>
                                        </main>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </LayoutGroup>
        </div>
    );
}

// --- SUB-COMPONENTS ---

// 1. Specialized Alphabet Card (Vertical, Clean, High Visibility)
const AlphabetCard: React.FC<{ lesson: Lesson, onClick: () => void, index: number }> = ({ lesson, onClick, index }) => (
    <motion.div
        layout
        whileHover={{ y: -8, scale: 1.02 }}
        onClick={onClick}
        className="group relative overflow-hidden rounded-[24px] cursor-pointer transition-all duration-300 
        bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/5
        shadow-sm hover:shadow-xl hover:shadow-blue-500/10 dark:shadow-none dark:hover:shadow-blue-900/20
        aspect-[3/4] flex flex-col items-center justify-between py-6 px-4"
    >
        {/* Giant Watermark Letter Background */}
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] font-black text-zinc-100 dark:text-zinc-800/50 pointer-events-none select-none z-0 leading-none transition-colors duration-500">
            {lesson.letter}
        </span>

        {/* Top Header */}
        <div className="w-full flex justify-between items-start z-10">
            <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 group-hover:text-blue-500 transition-colors">
                {(index + 1).toString().padStart(2, '0')}
            </span>
            <div className={`w-2 h-2 rounded-full ${lesson.difficulty === 'Easy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </div>

        {/* Hand Image */}
        <div className="flex-1 relative w-full flex items-center justify-center z-10 my-2 group-hover:scale-110 transition-transform duration-500">
            <img
                src={lesson.imageUrl}
                className="h-3/5 w-auto object-contain transition-all duration-500 dark-invert drop-shadow-sm"
                loading="lazy"
                alt={lesson.letter}
            />
        </div>

        {/* Footer Label */}
        <div className="z-10 relative">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {lesson.letter}
            </h3>
        </div>

        {/* Hover Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
);

// 2. Specialized Phrase Card (Horizontal, Editorial, Rich Info)
const PhraseCard: React.FC<{ lesson: Lesson, onClick: () => void, index: number }> = ({ lesson, onClick, index }) => (
    <motion.div
        layout
        whileHover={{ x: 5 }}
        onClick={onClick}
        className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 
        bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/5
        hover:border-zinc-300 dark:hover:border-white/10
        shadow-sm hover:shadow-2xl hover:shadow-purple-500/5 dark:shadow-black/40
        flex flex-row h-48 sm:h-52"
    >
        {/* Left: Content Area */}
        <div className="flex-1 p-8 flex flex-col justify-between relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300 border border-zinc-200 dark:border-white/5">
                        {lesson.category}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${lesson.difficulty === 'Easy'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                        }`}>
                        {lesson.difficulty}
                    </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {lesson.letter}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {lesson.description}
                </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white mt-4 group/btn">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">Start Lesson</span>
            </div>
        </div>

        {/* Right: Visual Area */}
        <div className="w-1/3 sm:w-2/5 relative bg-zinc-50 dark:bg-[#151515] flex items-center justify-center overflow-hidden">
            {/* Decorative Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Dynamic Line Divider */}
            <div className="absolute left-0 top-4 bottom-4 w-[1px] bg-gradient-to-b from-transparent via-zinc-200 dark:via-white/10 to-transparent" />

            <img
                src={lesson.imageUrl}
                className="w-full h-full object-contain p-6 mix-blend-multiply dark:mix-blend-normal dark-invert transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3"
                loading="lazy"
                alt={lesson.letter}
            />
        </div>
    </motion.div>
);