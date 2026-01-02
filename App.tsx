import React, { useState, useEffect } from 'react';
import { UserData, Lesson, LessonCategory } from './types';
import { signOut, onAuthStateChange, getUserData } from './services/firebaseService';
import { generateLessonPlan } from './services/geminiService';
import StreakCalendar from './components/StreakCalendar';
import LessonView from './components/LessonView';
import LoginPage from './components/LoginPage';
import Dock from './components/Dock';
import { Play, LogOut, GraduationCap, ChevronRight, MessageSquare, Type, Sparkles, Wand2, Home, Activity, Moon, Sun, BookOpen, LogIn, ArrowUpRight, Loader2 } from 'lucide-react';
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
        const lessons = await generateLessonPlan(customInput);
        setGeneratedLessons(lessons);
        setIsGenerating(false);
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
                                        className="fixed inset-0 z-50 bg-black"
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
                                                className="text-4xl font-black tracking-tighter text-text-primary"
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

                                            {/* Navigation Tabs */}
                                            <nav className="flex gap-8 border-b border-white/5 pb-4">
                                                {['alphabet', 'phrase', 'custom'].map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveTab(tab as LessonCategory)}
                                                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                                                            }`}
                                                    >
                                                        {tab === 'custom' ? 'AI Generator' : `${tab}s`}
                                                        {activeTab === tab && (
                                                            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                                                        )}
                                                    </button>
                                                ))}
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
                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                            {ALPHABET_LESSONS.map((lesson, i) => (
                                                                <LessonCard key={lesson.id} lesson={lesson} onClick={() => startLesson([lesson])} index={i} />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {activeTab === 'phrase' && (
                                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            {PHRASE_LESSONS.map((lesson, i) => (
                                                                <LessonCard key={lesson.id} lesson={lesson} onClick={() => startLesson([lesson])} index={i} large />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {activeTab === 'custom' && (
                                                        <div className="space-y-12">
                                                            <div className="glass-panel-heavy p-12 rounded-[32px] relative overflow-hidden group">
                                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                                                <div className="relative z-10 max-w-xl">
                                                                    <h3 className="text-3xl font-bold mb-4 text-text-primary">AI Lesson Generator</h3>
                                                                    <p className="text-text-secondary mb-8 leading-relaxed">
                                                                        Powered by Gemini. Enter any phrase, and we'll generate a custom curriculum instantly, breaking down complex signs into manageable steps.
                                                                    </p>
                                                                    <form onSubmit={handleGenerateLesson} className="flex gap-4">
                                                                        <input
                                                                            value={customInput}
                                                                            onChange={(e) => setCustomInput(e.target.value)}
                                                                            placeholder="Type a phrase to learn..."
                                                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/50 transition-colors"
                                                                        />
                                                                        <button
                                                                            disabled={isGenerating}
                                                                            className="bg-accent text-white px-8 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                                                                        >
                                                                            {isGenerating ? <Loader2 className="animate-spin" /> : 'Generate'}
                                                                        </button>
                                                                    </form>
                                                                </div>
                                                            </div>

                                                            {generatedLessons.length > 0 && (
                                                                <div className="space-y-6">
                                                                    <div className="flex justify-between items-center">
                                                                        <h3 className="text-xl font-bold text-text-primary">Generated Curriculum</h3>
                                                                        <button onClick={() => startLesson(generatedLessons)} className="text-accent hover:text-blue-400 font-medium flex items-center gap-2">
                                                                            Play All <Play className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid md:grid-cols-3 gap-6">
                                                                        {generatedLessons.map((lesson, i) => (
                                                                            <LessonCard key={lesson.id} lesson={lesson} onClick={() => startLesson(generatedLessons, i)} index={i} large />
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

const LessonCard: React.FC<{ lesson: Lesson, onClick: () => void, index: number, large?: boolean }> = ({ lesson, onClick, index, large }) => (
    <motion.div
        layout
        whileHover={{ y: -5 }}
        onClick={onClick}
        className={`group relative overflow-hidden glass-panel rounded-3xl cursor-pointer hover:border-white/20 transition-all ${large ? 'p-8 aspect-video' : 'p-6 aspect-square'}`}
    >
        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">0{index + 1}</span>
                <div className={`w-2 h-2 rounded-full ${lesson.difficulty === 'Easy' ? 'bg-green-500' : 'bg-orange-500'}`} />
            </div>

            <div className="self-center my-auto w-full flex justify-center">
                {/* 
                    Image logic: 
                    'dark-invert' class (defined in index.html) inverts colors ONLY in dark mode.
                    This makes black SVG lines turn white in dark mode, but stay black in light mode.
                 */}
                <img
                    src={lesson.imageUrl}
                    className={`object-contain transition-all duration-500 dark-invert opacity-80 group-hover:opacity-100 ${large ? 'h-32' : 'h-24'}`}
                    loading="lazy"
                    alt={lesson.letter}
                />
            </div>

            <div>
                <h3 className="font-bold text-text-primary group-hover:text-accent transition-colors">{lesson.letter}</h3>
                {large && <p className="text-xs text-text-secondary mt-1 line-clamp-1 group-hover:text-text-primary transition-colors">{lesson.description}</p>}
            </div>
        </div>

        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <ArrowUpRight className="w-5 h-5 text-text-primary" />
        </div>
    </motion.div>
);
