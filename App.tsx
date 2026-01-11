import React, { useState, useEffect, useRef } from 'react';
import { UserData, Lesson, LessonCategory } from './types';
import { ALPHABET_LESSONS, PHRASE_LESSONS } from './data';
import { signOut, onAuthStateChange, trackUserAction } from './services/firebaseService';
import { generateLessonPlan } from './services/geminiService';
import StreakCalendar from './components/StreakCalendar';
import QuotaTracker from './components/QuotaTracker';
import LessonView from './components/LessonView';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import WelcomeSequence from './components/WelcomeSequence';
import InteractiveTutorial from './components/InteractiveTutorial';
import DashboardSuggestions from './components/DashboardSuggestions';
import MotivationalMessage from './components/MotivationalMessage';
import DynamicBackgroundText from './components/DynamicBackgroundText';
import ProfileMenu from './components/ProfileMenu';
import Dock from './components/Dock';
import { Play, LogOut, Home, Activity, Moon, Sun, BookOpen, LogIn, Loader2, Sparkles, Wand2, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Footer from './components/Footer';

// --- DATA DEFINITIONS moved to data.ts ---

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [lessonQueue, setLessonQueue] = useState<Lesson[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTab, setActiveTab] = useState<LessonCategory>('alphabet');
  const [customInput, setCustomInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLessons, setGeneratedLessons] = useState<Lesson[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lastAction, setLastAction] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState({ x: 0, y: 0 });
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [showProgressChart, setShowProgressChart] = useState(false);

  const statsRef = useRef<HTMLDivElement>(null);
  const hasShownWelcomeRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    return onAuthStateChange((userData) => {
      setUser(userData);
      setLoading(false);
    });
  }, []);

  const handleLoginSuccess = (userData: UserData) => {
    // Show welcome sequence when user explicitly logs in
    setShowWelcome(true);
    setUser(userData);
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    // Show tutorial after welcome sequence
    setShowTutorial(true);
    hasShownWelcomeRef.current = true;
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
  };

  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    setIsGenerating(true);

    // Track lesson generation
    if (user) {
      trackUserAction(user.uid, 'lesson_generated', { input: customInput });
    }

    const lessons = await generateLessonPlan(customInput);
    setGeneratedLessons(lessons);

    // Track successful generation
    if (user && lessons.length > 0) {
      trackUserAction(user.uid, 'lesson_generation_success', {
        input: customInput,
        lessonCount: lessons.length
      });
    }

    setIsGenerating(false);
  };

  const startLesson = (lessons: Lesson[]) => {
    setLessonQueue(lessons);
    setCurrentQueueIndex(0);
  };

  // Get recommended lessons based on user progress
  const getRecommendedLessons = (): Lesson[] => {
    if (!user) return [];

    // For new users, recommend easy alphabet letters
    if (user.totalLessons === 0) {
      return ALPHABET_LESSONS.filter(l => l.difficulty === 'Easy').slice(0, 3);
    }

    // For users with some progress, recommend next in sequence or easy phrases
    if (user.totalLessons < 5) {
      return ALPHABET_LESSONS.slice(user.totalLessons, user.totalLessons + 2);
    }

    // For more advanced users, mix alphabet and phrases
    const nextAlphabet = ALPHABET_LESSONS.slice(user.totalLessons % 26, (user.totalLessons % 26) + 1);
    const easyPhrases = PHRASE_LESSONS.filter(l => l.difficulty === 'Easy').slice(0, 1);
    return [...nextAlphabet, ...easyPhrases].slice(0, 2);
  };

  const handleLessonComplete = (updatedUser: UserData) => {
    // Check for streak milestones
    const previousStreak = user?.streak || 0;
    const newStreak = updatedUser.streak;

    // Trigger milestone message for significant streaks
    if (newStreak > previousStreak && (newStreak === 7 || newStreak === 30 || newStreak === 100)) {
      setLastAction('streak_milestone');
      setTimeout(() => setLastAction(''), 6000);
    } else {
      setLastAction('lesson_completed');
      setTimeout(() => setLastAction(''), 5000);
    }

    setUser(updatedUser);
    if (currentQueueIndex < lessonQueue.length - 1) {
      setCurrentQueueIndex(prev => prev + 1);
    } else {
      setLessonQueue([]);
      setCurrentQueueIndex(-1);
    }
  };

  const handleStartLesson = (lessons: Lesson[]) => {
    setLastAction('lesson_started');
    setTimeout(() => setLastAction(''), 3000);

    // Track lesson start
    if (user) {
      trackUserAction(user.uid, 'lesson_started', {
        lessonId: lessons[0]?.id,
        lessonCategory: lessons[0]?.category,
        letter: lessons[0]?.letter
      });
    }

    startLesson(lessons);
  };

  const handleTabChange = (tab: LessonCategory) => {
    setLastAction('tab_changed');
    setTimeout(() => setLastAction(''), 3000);

    // Track tab change
    if (user) {
      trackUserAction(user.uid, 'tab_changed', { tab });
    }

    setActiveTab(tab);
  };

  const dockItems = [
    {
      label: 'Home',
      icon: <Home />,
      onClick: () => {
        setLessonQueue([]);
        setCurrentQueueIndex(-1);
        setActiveTab('alphabet');
        statsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      label: 'Lessons',
      icon: <BookOpen />,
      onClick: () => {
        handleTabChange('alphabet');
        setTimeout(() => {
          const lessonsSection = document.querySelector('[data-tutorial="lessons"]');
          lessonsSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    },
    {
      label: 'Progress',
      icon: <Activity />,
      onClick: () => {
        setShowProgressChart(prev => !prev);
        statsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    {
      label: theme === 'dark' ? 'Light' : 'Dark',
      icon: theme === 'dark' ? <Sun /> : <Moon />,
      onClick: () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
      }
    },
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
      onClick: () => {
        // Position menu below dock (top-right area)
        setProfileMenuPosition({ x: window.innerWidth - 20, y: 80 });
        setShowProfileMenu(true);
      }
    });
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-white w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-transparent text-text-primary overflow-x-hidden font-sans relative">
      {/* Dynamic Background Text */}
      {user && (
        <DynamicBackgroundText
          user={user}
          activeTab={activeTab}
          totalLessons={user.totalLessons}
          streak={user.streak}
          isLessonActive={currentQueueIndex !== -1}
          lastAction={lastAction}
        />
      )}
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {!user ? (
            showLoginPage ? (
              <LoginPage key="login" onLoginSuccess={handleLoginSuccess} />
            ) : (
              <LandingPage key="landing" onNavigateToLogin={() => setShowLoginPage(true)} />
            )
          ) : showWelcome ? (
            <WelcomeSequence key="welcome" onComplete={handleWelcomeComplete} />
          ) : (
            <div className="contents">
              {showTutorial && (
                <InteractiveTutorial
                  onComplete={handleTutorialComplete}
                  onSkip={handleTutorialSkip}
                />
              )}
              {showProfileMenu && user && (
                <ProfileMenu
                  user={user}
                  onClose={() => setShowProfileMenu(false)}
                  onLogout={() => {
                    signOut();
                    setUser(null);
                    setShowProfileMenu(false);
                  }}
                  onViewProfile={() => {
                    statsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  position={profileMenuPosition}
                />
              )}
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
                  <div key="dashboard" className="min-h-screen p-4 lg:p-8 relative max-w-[1600px] mx-auto">
                    <Dock items={dockItems} />
                    <div className="absolute top-8 left-8 z-50">
                      <h1 className="text-4xl font-bold tracking-tighter text-zinc-900 dark:text-white">Signify</h1>
                    </div>
                    <header
                      data-tutorial="dashboard"
                      className="flex flex-col md:flex-row justify-between items-center gap-12 mt-16 mb-6"
                    >
                      <div className="flex-1">
                        <h2 className="text-zinc-500 font-medium mb-2 text-lg">Welcome, {user.displayName}</h2>
                        <h1 className="text-6xl lg:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white mb-4">Dashboard</h1>
                        <MotivationalMessage user={user} />
                      </div>
                      <div
                        data-tutorial="streak"
                        className="w-full lg:w-auto flex flex-col gap-4"
                        ref={statsRef}
                      >
                        <StreakCalendar user={user} showChart={showProgressChart} />
                        <QuotaTracker />
                      </div>
                    </header>

                    {/* Dashboard Suggestions & Quick Actions */}
                    <DashboardSuggestions
                      user={user}
                      onStartLesson={(lesson) => handleStartLesson([lesson])}
                      recommendedLessons={getRecommendedLessons()}
                    />

                    <nav
                      data-tutorial="lessons"
                      className="flex justify-center mb-4"
                    >
                      <div className="p-1 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/5 rounded-2xl inline-flex relative">
                        {['alphabet', 'phrase', 'custom'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => handleTabChange(tab as LessonCategory)}
                            className={`relative px-10 py-3 rounded-xl text-sm font-bold transition-all z-10 ${activeTab === tab ? 'text-white dark:text-black' : 'text-zinc-500'
                              }`}
                          >
                            {tab === 'custom' ? 'AI Generator' : `${tab.charAt(0).toUpperCase() + tab.slice(1)}s`}
                            {activeTab === tab && (
                              <motion.div layoutId="active-tab" className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-xl -z-10" />
                            )}
                          </button>
                        ))}
                      </div>
                    </nav>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6"
                      >
                        {activeTab === 'alphabet' && ALPHABET_LESSONS.map((lesson, i) => (
                          <Card key={lesson.id} lesson={lesson} index={i} onClick={() => handleStartLesson([lesson])} />
                        ))}
                      </motion.div>
                    </AnimatePresence>

                    {activeTab === 'phrase' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PHRASE_LESSONS.map((lesson, i) => (
                          <PhraseCard key={lesson.id} lesson={lesson} index={i} onClick={() => handleStartLesson([lesson])} />
                        ))}
                      </div>
                    )}

                    {activeTab === 'custom' && (
                      <div className="w-full max-w-3xl mx-auto">
                        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/5 rounded-3xl p-8 mb-12">
                          <h3 className="text-2xl font-bold mb-6">AI Lesson Generator</h3>
                          <form onSubmit={handleGenerateLesson} className="flex gap-4">
                            <input
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              placeholder="e.g. Nice to meet you"
                              className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-6 py-4"
                            />
                            <button disabled={isGenerating} className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 rounded-xl font-bold flex items-center gap-2">
                              {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                              Generate
                            </button>
                          </form>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {generatedLessons.map((lesson, i) => (
                            <PhraseCard key={lesson.id} lesson={lesson} index={i} onClick={() => handleStartLesson(generatedLessons)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
        <Footer />
      </LayoutGroup>
    </div>
  );
}

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
    className="group relative aspect-square bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
  >
    <div className="absolute top-4 left-4 z-20">
      <span className="text-[10px] font-bold text-zinc-400">{(index + 1).toString().padStart(2, '0')}</span>
    </div>
    <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
      <span className="text-[120px] font-black leading-none text-zinc-900 dark:text-white">{lesson.letter}</span>
    </div>
    <div className="absolute inset-0 flex items-center justify-center p-8 z-10 transition-transform group-hover:-translate-y-2">
      <img src={lesson.imageUrl} className="w-full h-full object-contain dark-invert" alt={lesson.letter} />
    </div>
    <div className="absolute bottom-3 inset-x-0 text-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-[10px] font-bold uppercase text-zinc-500 bg-white/80 dark:bg-black/50 px-3 py-1 rounded-full">
        {lesson.letter}
      </span>
    </div>
  </motion.div>
);

const PhraseCard: React.FC<CardProps> = ({ lesson, index, onClick }) => (
  <motion.div
    layout
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 cursor-pointer flex items-center gap-6 shadow-sm hover:shadow-xl transition-all"
  >
    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-2 shrink-0 flex items-center justify-center">
      <img src={lesson.imageUrl} className="w-full h-full object-contain dark-invert" alt={lesson.letter} />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase">{(index + 1).toString().padStart(2, '0')}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/30 text-blue-500">{lesson.difficulty}</span>
      </div>
      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{lesson.letter}</h3>
      <p className="text-xs text-zinc-500 line-clamp-1">{lesson.description}</p>
    </div>
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
      <Play className="w-5 h-5 text-blue-500 fill-blue-500" />
    </div>
  </motion.div>
);