import React, { useState, useEffect } from 'react';
import { UserData, Lesson, LessonCategory } from './types';
import { signOut, onAuthStateChange } from './services/firebaseService';
import { generateLessonPlan } from './services/geminiService';
import StreakCalendar from './components/StreakCalendar';
import LessonView from './components/LessonView';
import LoginPage from './components/LoginPage';
import Dock from './components/Dock';
import { Play, LogOut, Home, Activity, Moon, Sun, BookOpen, LogIn, Loader2, Wand2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

// --- DATA DEFINITIONS ---

const getStableWikiUrl = (char: string) => {
    const charUpper = char.toUpperCase();
    return `https://commons.wikimedia.org/wiki/Special:FilePath/Sign_language_${charUpper}.svg?width=500`;
};

const ALPHABET_LESSONS: Lesson[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map((char) => ({
    id: `alpha-${char}`,
    category: 'alphabet',
    type: (char === 'J' || char === 'Z') ? 'dynamic' : 'static',
    letter: char,
    description: char === 'J' ? "Trace a 'J' in the air." : char === 'Z' ? "Trace a 'Z' in the air." : `Sign for letter ${char}`,
    imageUrl: getStableWikiUrl(char),
    difficulty: ['A', 'B', 'C', 'E', 'F', 'I', 'L', 'O', 'U', 'V'].includes(char) ? 'Easy' : 'Medium'
}));

const PHRASE_LESSONS: Lesson[] = [
    { id: 'p1', category: 'phrase', type: 'dynamic', letter: 'Thank You', description: 'Hand moves from chin forward.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Thank+You&font=roboto', difficulty: 'Easy' },
    { id: 'p2', category: 'phrase', type: 'dynamic', letter: 'Please', description: 'Circular motion on chest.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Please&font=roboto', difficulty: 'Easy' },
    { id: 'p3', category: 'phrase', type: 'dynamic', letter: 'Help', description: 'Fist on palm, lifting up.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Help&font=roboto', difficulty: 'Medium' },
    { id: 'p4', category: 'phrase', type: 'dynamic', letter: 'Yes', description: 'Fist nodding like a head.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Yes&font=roboto', difficulty: 'Easy' },
    { id: 'p5', category: 'phrase', type: 'dynamic', letter: 'No', description: 'Index/Middle tap thumb.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=No&font=roboto', difficulty: 'Easy' },
    { id: 'p6', category: 'phrase', type: 'dynamic', letter: 'Hello', description: 'Salute from forehead.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Hello&font=roboto', difficulty: 'Easy' },
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
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    const [genError, setGenError] = useState<string | null>(null);

    useEffect(() => {
        return onAuthStateChange((userData) => { setUser(userData); setLoading(false); });
    }, []);

    // Clear state when switching tabs
    useEffect(() => {
        setGenError(null);
        setCustomInput('');
    }, [activeTab]);


    const handleGenerateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customInput.trim()) return;
        setIsGenerating(true);
        setGenError(null);
        try {
            const lessons = await generateLessonPlan(customInput);
            if (lessons.length === 0) setGenError("No lessons generated. Try a different phrase.");
            setGeneratedLessons(lessons);
        } catch (err: any) {
            console.error("Generation Error:", err);
            setGenError(err.message || "Failed to generate lessons. Please check your connection or API quota.");
        } finally {
            setIsGenerating(false);
        }
    };

    const startLesson = (lessons: Lesson[]) => {
        setLessonQueue(lessons);
        setCurrentQueueIndex(0);
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
        { label: 'Home', icon: <Home />, onClick: () => { setLessonQueue([]); setCurrentQueueIndex(-1); } },
        { label: 'Lessons', icon: <BookOpen />, onClick: () => setActiveTab('alphabet') },
        {
            label: 'Progress',
            icon: <Activity />,
            onClick: () => {
                const calendar = document.getElementById('streak-calendar');
                if (calendar) calendar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },
        { label: theme === 'dark' ? 'Light' : 'Dark', icon: theme === 'dark' ? <Sun /> : <Moon />, onClick: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark') },
    ];

    if (user) {
        dockItems.push({
            label: user.displayName,
            icon: (
                <div className="w-full h-full rounded-lg overflow-hidden border border-white/10 shadow-inner bg-zinc-800">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {user.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            ),
            onClick: () => { }
        });

        dockItems.push({
            label: 'Logout',
            icon: <LogOut className="text-red-400" />,
            onClick: () => { signOut(); setUser(null); }
        });
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-white w-8 h-8" /></div>;

    return (
        <div className="min-h-screen bg-transparent text-text-primary overflow-x-hidden font-sans">
            <LayoutGroup>
                <AnimatePresence mode="wait">
                    {!user ? (
                        <LoginPage key="login" onLoginSuccess={setUser} />
                    ) : (
                        <motion.div key="authenticated-app" className="contents">
                            <AnimatePresence mode="wait">
                                {currentQueueIndex !== -1 && lessonQueue[currentQueueIndex] ? (
                                    <motion.div key="lesson-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black">
                                        <LessonView
                                            lesson={lessonQueue[currentQueueIndex]}
                                            user={user}
                                            onBack={() => { setLessonQueue([]); setCurrentQueueIndex(-1); }}
                                            onComplete={handleLessonComplete}
                                            hasNext={currentQueueIndex < lessonQueue.length - 1}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen p-8 lg:p-12 relative max-w-[1600px] mx-auto">

                                        {/* Top Navigation */}
                                        <div className="absolute top-8 right-8 z-50">
                                            <Dock items={dockItems} />
                                        </div>
                                        <div className="absolute top-8 left-8 z-50">
                                            <h1 className="text-3xl font-bold tracking-tighter text-zinc-900 dark:text-white">Signify</h1>
                                        </div>

                                        {/* Dashboard Header Area */}
                                        <header className="flex flex-col lg:flex-row justify-between items-end gap-12 mt-20 mb-20">
                                            <div className="flex-1">
                                                <h2 className="text-zinc-500 font-medium mb-2 text-lg">Welcome back, {user.displayName || 'Learner'}</h2>
                                                <h1 className="text-6xl lg:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white drop-shadow-sm">Dashboard</h1>
                                            </div>
                                            <div id="streak-calendar" className="w-full lg:w-auto">
                                                <StreakCalendar user={user} />
                                            </div>
                                        </header>

                                        {/* Tab Navigation */}
                                        <nav className="flex justify-center mb-12">
                                            <div className="p-1 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/5 rounded-2xl inline-flex relative shadow-sm">
                                                {['alphabet', 'phrase', 'custom'].map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveTab(tab as LessonCategory)}
                                                        className={`relative px-10 py-3 rounded-xl text-sm font-bold transition-all duration-300 z-10 ${activeTab === tab ? 'text-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                                            }`}
                                                    >
                                                        {tab === 'custom' ? 'AI Generator' : `${tab.charAt(0).toUpperCase() + tab.slice(1)}s`}
                                                        {activeTab === tab && (
                                                            <motion.div
                                                                layoutId="active-tab"
                                                                className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-xl shadow-lg -z-10"
                                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                            />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </nav>

                                        {/* Main Content Grid */}
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeTab}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {activeTab === 'alphabet' && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                                                        {ALPHABET_LESSONS.map((lesson, i) => (
                                                            <Card key={lesson.id} lesson={lesson} index={i} onClick={() => startLesson([lesson])} />
                                                        ))}
                                                    </div>
                                                )}

                                                {activeTab === 'phrase' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {PHRASE_LESSONS.map((lesson, i) => (
                                                            <PhraseCard key={lesson.id} lesson={lesson} index={i} onClick={() => startLesson([lesson])} />
                                                        ))}
                                                    </div>
                                                )}

                                                {activeTab === 'custom' && (
                                                    <div className="w-full max-w-3xl mx-auto">
                                                        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/5 rounded-3xl p-8 mb-12 shadow-sm">
                                                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">AI Lesson Generator</h3>
                                                            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Type anything you want to learn, and Gemini will create a lesson plan.</p>

                                                            <form onSubmit={handleGenerateLesson} className="flex gap-4">
                                                                <input
                                                                    value={customInput}
                                                                    onChange={(e) => setCustomInput(e.target.value)}
                                                                    placeholder="e.g. Nice to meet you"
                                                                    aria-label="Prompt for AI lesson generation"
                                                                    className="flex-1 bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-6 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                                />
                                                                <button
                                                                    disabled={isGenerating}
                                                                    className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                                                                >
                                                                    {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                                                                    Generate
                                                                </button>
                                                            </form>

                                                            {genError && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 dark:text-red-400 text-sm"
                                                                >
                                                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                                                    <p className="font-medium">{genError}</p>
                                                                </motion.div>
                                                            )}
                                                        </div>

                                                        {generatedLessons.length > 0 && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {generatedLessons.map((lesson, i) => (
                                                                    <PhraseCard key={lesson.id} lesson={lesson} index={i} onClick={() => startLesson(generatedLessons)} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
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

// --- Card Components ---

interface CardProps {
    lesson: Lesson;
    index: number;
    onClick: () => void;
}

const Card: React.FC<CardProps> = ({ lesson, index, onClick }) => (
    <motion.div
        layout
        whileHover={{ y: -5 }}
        onClick={onClick}
        className="group relative aspect-square bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden cursor-pointer hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-xl"
    >
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">{(index + 1).toString().padStart(2, '0')}</span>
            <div className={`w-2 h-2 rounded-full ${lesson.difficulty === 'Easy' ? 'bg-emerald-500' : lesson.difficulty === 'Hard' ? 'bg-rose-500' : 'bg-amber-500'}`} />
        </div>

        {/* Big Typography Background */}
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none translate-y-4">
            <span className="text-[140px] font-black text-zinc-900/5 dark:text-white/5 leading-none select-none group-hover:scale-110 transition-transform duration-500">
                {lesson.letter}
            </span>
        </div>

        {/* Hand Image */}
        <div className="absolute inset-0 flex items-center justify-center p-8 z-10 transition-transform duration-500 group-hover:-translate-y-2">
            <img src={lesson.imageUrl} className="w-full h-full object-contain dark-invert drop-shadow-sm" alt={lesson.letter} />
        </div>

        {/* Hover Label */}
        <div className="absolute bottom-3 left-0 right-0 text-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-white/80 dark:bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                Letter {lesson.letter}
            </span>
        </div>
    </motion.div>
);

const PhraseCard: React.FC<CardProps> = ({ lesson, index, onClick }) => (
    <motion.div
        layout
        whileHover={{ y: -5 }}
        onClick={onClick}
        className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 cursor-pointer hover:border-blue-500/30 transition-all duration-300 flex items-center gap-6 shadow-sm hover:shadow-xl"
    >
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-2 shrink-0 flex items-center justify-center">
            <img src={lesson.imageUrl} className="w-full h-full object-contain dark-invert" alt={lesson.letter} />
        </div>
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{(index + 1).toString().padStart(2, '0')}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${lesson.difficulty === 'Easy' ? 'border-emerald-500/30 text-emerald-500' :
                    lesson.difficulty === 'Hard' ? 'border-rose-500/30 text-rose-500' :
                        'border-amber-500/30 text-amber-500'
                    }`}>{lesson.difficulty}</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{lesson.letter}</h3>
            <p className="text-xs text-zinc-500 line-clamp-1">{lesson.description}</p>
        </div>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
            <Play className="w-5 h-5 text-blue-500 fill-blue-500" />
        </div>
    </motion.div>
);