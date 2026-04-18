import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DeckView from './components/DeckView';
import StudyMode from './components/StudyMode';
import QuizMode from './components/QuizMode';
import { LoginScreen } from './components/LoginScreen';
import { ProfilePage } from './components/ProfilePage';
import { QuizResults } from './components/QuizResults';
import { AdminDashboard } from './components/AdminDashboard';
import { TutorDashboard } from './components/TutorDashboard';
import TimedMode from './components/TimedMode';
import { initialDecks, Word, Deck } from './data/vocabulary';
import { TOPIC_CONTENT } from './data/topicContent';
import { UserProfile, QuizResult, SessionLog, AppSettings, LearningSession, Student, AppMode } from './types';
import { User, Home, Sparkles, ArrowLeft, Shield, GraduationCap, LogOut, UserCircle, HelpCircle, Mail } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { BulkGeneratorModal } from './components/BulkGeneratorModal';
import { TopicSelectionScreen, TOPIC_GROUPS } from './components/TopicSelectionScreen';
import { Toast, ToastProps } from './components/Toast';
import { TicketModal } from './components/TicketModal';
import { UserModeSelectionScreen } from './components/UserModeSelectionScreen';
import { LanguageSelector } from './components/LanguageSelector';
import PageIdentifier from './components/PageIdentifier';
import { DevModeProvider } from './components/DevModeProvider';
import './i18n';




const DEFAULT_SETTINGS: AppSettings = {
    categories: {
        'Adjectives': { backgroundColor: '#fecaca', titleColor: '#7f1d1d', textColor: '#1e293b' },
        'Collocations': { backgroundColor: '#e9d5ff', titleColor: '#6b21a8', textColor: '#1e293b' },
        'Conjunctions': { backgroundColor: '#fed7aa', titleColor: '#c2410c', textColor: '#1e293b' },
        'Determiners': { backgroundColor: '#fef08a', titleColor: '#a16207', textColor: '#1e293b' },
        'Idioms & Sayings': { backgroundColor: '#fbcfe8', titleColor: '#be185d', textColor: '#1e293b' },
        'Modal Verbs': { backgroundColor: '#ccfbf1', titleColor: '#0f766e', textColor: '#1e293b' },
        'Nouns': { backgroundColor: '#bfdbfe', titleColor: '#1e3a8a', textColor: '#1e293b' },
        'Phrasal Verbs': { backgroundColor: '#a7f3d0', titleColor: '#047857', textColor: '#1e293b' },
        'Prepositional Phrases': { backgroundColor: '#cffafe', titleColor: '#0e7490', textColor: '#1e293b' },
        'Prepositions': { backgroundColor: '#bae6fd', titleColor: '#0369a1', textColor: '#1e293b' },
        'Pronouns': { backgroundColor: '#c7d2fe', titleColor: '#3730a3', textColor: '#1e293b' },
        'Verbs': { backgroundColor: '#bbf7d0', titleColor: '#14532d', textColor: '#1e293b' },
    },
    autoAdvanceDelay: 2000,
    autoAdvanceEnabled: true
};

// Mock Students Data
const INITIAL_STUDENTS: Student[] = [
    {
        id: 's1',
        name: 'Maria Garcia',
        email: 'maria.g@example.com',
        avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=e9d5ff&color=7c3aed',
        nativeLanguage: 'Spanish',
        originCountry: 'Spain',
        originCity: 'Madrid',
        currentCountry: 'UK',
        currentCity: 'London',
        timeZone: 'GMT+0',
        phone: '+44 7700 900077',
        profession: 'Marketing Manager',
        interests: 'Travel, Photography, Cooking, Yoga',
        basicNotes: 'Prefer visual learning style.',

        // Learning Needs
        englishLevel: 'Intermediate',
        goals: 'Improve business English for presentations and negotiations. Expand vocabulary related to digital marketing.',
        learningHistory: 'Studied English in high school (5 years). Took a 3-month intensive course in 2023.',
        schedule: 'Mon/Wed 18:00 - 19:30',
        preferences: 'Correction immediately after mistakes. Likes role-playing scenarios.',
        requestsHomework: true,
        englishEnvironment: 'Uses English daily at work (written), but rarely spoken.',
        learningNotes: 'Struggles with prepositions and phrasal verbs.',

        // Stats & Activity
        activeDeckIds: ['deck-1', 'deck-3'],
        lastSessionDate: Date.now() - 86400000 * 2, // 2 days ago
        lastSessionSummary: 'Completed "Business Verbs" quiz with 85% accuracy.',
        homeworkStatus: 'Needs Review',

        status: 'active',
        joinedDate: Date.now() - 10000000,
        requests: [
            { id: 'r1', studentId: 's1', type: 'question', content: 'What is the difference between "make" and "do"?', status: 'pending', timestamp: Date.now() - 100000 },
            { id: 'r2', studentId: 's1', type: 'pronunciation', content: 'Struggling with "colonel" pronunciation.', status: 'resolved', timestamp: Date.now() - 500000 }
        ]
    },
    {
        id: 's2',
        name: 'Kenji Tanaka',
        email: 'kenji.t@example.com',
        avatarUrl: 'https://ui-avatars.com/api/?name=Kenji+Tanaka&background=dcfce7&color=166534',
        nativeLanguage: 'Japanese',
        originCountry: 'Japan',
        originCity: 'Tokyo',
        currentCountry: 'Japan',
        currentCity: 'Tokyo',
        timeZone: 'GMT+9',
        profession: 'Software Engineer',
        interests: 'Coding, Gaming, Sci-Fi Movies, Hiking',

        englishLevel: 'Advanced',
        goals: 'Reduce accent and improve fluency for international conferences. Master technical jargon.',
        learningHistory: 'Self-taught mostly. High TOEFL score (105).',
        schedule: 'Sat 10:00 AM',
        preferences: 'Focus on pronunciation and intonation. Strict correction.',
        requestsHomework: false,
        englishEnvironment: 'Reads documentation in English daily. Attends monthly webinars.',

        activeDeckIds: ['deck-2'],
        lastSessionDate: Date.now() - 86400000 * 5,
        lastSessionSummary: 'Review session: 50 cards active.',
        homeworkStatus: 'Completed',

        status: 'active',
        joinedDate: Date.now() - 5000000,
        requests: []
    },
    {
        id: 's3',
        name: 'Elena Ionescu',
        email: 'elena.i@example.com',
        nativeLanguage: 'Romanian',
        originCountry: 'Romania',
        originCity: 'Bucharest',
        currentCountry: 'France',
        currentCity: 'Paris',
        timeZone: 'CET',
        profession: 'Student (Architecture)',
        interests: 'Art History, Sketching, French Literature',

        englishLevel: 'Beginner',
        goals: 'Basic conversation skills for travel. IELTS preparation for university exchange.',
        learningHistory: 'Just started learning 2 months ago.',
        schedule: 'Flexible',
        preferences: 'More grammar exercises. Gentle correction.',
        requestsHomework: true,
        homeworkStatus: 'Incomplete',

        activeDeckIds: [],
        lastSessionDate: undefined,
        status: 'active', // Changed to active for testing visibility
        joinedDate: Date.now() - 20000000,
        requests: [
            { id: 'r3', studentId: 's3', type: 'other', content: 'Can we reschedule next weeks lesson?', status: 'pending', timestamp: Date.now() - 20000 }
        ]
    },
    {
        id: 's4',
        name: 'Ahmed Al-Fayed',
        email: 'ahmed.a@example.com',
        avatarUrl: 'https://ui-avatars.com/api/?name=Ahmed+Al-Fayed&background=ffedd5&color=9a3412',
        nativeLanguage: 'Arabic',
        originCountry: 'Egypt',
        originCity: 'Cairo',
        currentCountry: 'UAE',
        currentCity: 'Dubai',
        timeZone: 'GMT+4',
        profession: 'Civil Engineer',
        interests: 'Soccer, Engineering, History',

        englishLevel: 'Upper Intermediate',
        goals: 'Writing professional reports and emails.',
        learningHistory: 'University courses in English.',
        schedule: 'Tue/Thu 19:00',
        requestsHomework: true,
        homeworkStatus: 'Completed',

        activeDeckIds: ['deck-1', 'deck-2', 'deck-3'],
        lastSessionDate: Date.now() - 86400000,
        lastSessionSummary: 'aced the "Engineering Terms" deck.',

        status: 'active',
        joinedDate: Date.now() - 3000000,
        requests: []
    },
    {
        id: 's5',
        name: 'Sophie Müller',
        email: 'sophie.m@example.com',
        nativeLanguage: 'German',
        originCountry: 'Germany',
        originCity: 'Berlin',
        currentCountry: 'Germany',
        currentCity: 'Berlin',
        englishLevel: 'Advanced',
        status: 'archived',
        joinedDate: Date.now() - 60000000,
        activeDeckIds: []
    }
];

function App() {
    const { i18n } = useTranslation();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [lastQuizResult, setLastQuizResult] = useState<QuizResult | null>(null);
    const [decks, setDecks] = useState<Deck[]>(initialDecks);
    const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [quizStyle, setQuizStyle] = useState<'def-to-word' | 'word-to-def' | 'mix'>('word-to-def');
    const [isNewUserSession, setIsNewUserSession] = useState(false);
    const [profileScrollTarget, setProfileScrollTarget] = useState<string | null>(null);
    const [studyInputMode, setStudyInputMode] = useState<string | null>(null);
    const { t } = useTranslation();

    // Unified Routing State
    type RouteState = {
        mode: AppMode;
        activeDeckId: string | null;
        adminTab: string;
        tutorView: 'dashboard' | 'students' | 'flashcards' | 'learning-content' | 'manage-flashcards' | 'review-new-flashcards';
        topicGroupId: string | null;
    };

    const [currentRoute, setCurrentRoute] = useState<RouteState>({
        mode: 'welcome',
        activeDeckId: null,
        adminTab: 'menu',
        tutorView: 'dashboard',
        topicGroupId: null
    });

    const [history, setHistory] = useState<RouteState[]>([]);

    // Backward-Compatible Shims
    const mode = currentRoute.mode;
    const activeDeckId = currentRoute.activeDeckId;
    const adminActiveTab = currentRoute.adminTab;
    const tutorActiveView = currentRoute.tutorView;
    const topicGroupId = currentRoute.topicGroupId;

    const setMode = (m: AppMode) => setCurrentRoute(prev => ({ ...prev, mode: m }));
    const setActiveDeckId = (id: string | null) => setCurrentRoute(prev => ({ ...prev, activeDeckId: id }));
    const setTopicGroupId = (id: string | null) => setCurrentRoute(prev => ({ ...prev, topicGroupId: id }));

    const navigate = (newMode: AppMode, newDeckId: string | null = null, newAdminTab?: string, newTutorView?: 'dashboard' | 'students' | 'flashcards' | 'learning-content' | 'manage-flashcards' | 'review-new-flashcards') => {
        // Build the new explicitly strict route object
        const routeObj: RouteState = {
            mode: newMode,
            activeDeckId: newDeckId,
            adminTab: newAdminTab || 'menu',
            tutorView: newTutorView || 'dashboard',
            topicGroupId: currentRoute.topicGroupId
        };

        // Push full current state map to history
        setHistory(prev => [...prev, currentRoute]);
        setCurrentRoute(routeObj);

        setIsNewUserSession(false); // Clear new user flag on navigation
        if (newMode === 'study') {
            setStudyInputMode(null); // Reset when entering study mode
        }
    };

    const goBack = () => {
        if (history.length === 0) {
            if (mode !== 'welcome' && mode !== 'mode-selection') {
                goHome();
                setActiveDeckId(null);
            }
            return;
        }

        const previousState = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        if (previousState && previousState.mode) {
            setHistory(newHistory);
            setCurrentRoute(previousState);
        } else {
            goHome();
        }
    };

    const goHome = () => {
        if (user?.role === 'admin') {
            navigate('mode-selection');
        } else if (user?.role === 'tutor') {
            navigate('tutor');
        } else {
            navigate('welcome');
        }
    };

    // ... (inside component)

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            document.body.setAttribute('data-user-role', user.role);
        } else {
            document.body.removeAttribute('data-user-role');
        }
    }, [user?.role]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Session Tracking
    const currentSessionRef = useRef<LearningSession | null>(null);

    const handleLogin = (user: UserProfile, isNewUser: boolean = false) => {
        setUser(user);
        if (isNewUser) {
            setIsNewUserSession(true);
            setMode('profile');
        } else if (user.role === 'admin') {
            setMode('mode-selection');
        } else if (user.role === 'tutor') {
            setMode('tutor');
        } else {
            setMode('welcome');
        }
    };

    // Start Session on Login / User Load
    useEffect(() => {
        // Check for remembered user
        const rememberedUser = localStorage.getItem('rememberedUser');
        if (rememberedUser && !user) {
            try {
                const parsedUser = JSON.parse(rememberedUser);
                handleLogin(parsedUser);
            } catch (e) {
                console.error("Failed to parse remembered user", e);
                localStorage.removeItem('rememberedUser');
            }
        }

        if (user && !currentSessionRef.current) {
            currentSessionRef.current = {
                id: crypto.randomUUID(),
                startTime: Date.now(),
                endTime: null,
                durationSeconds: 0,
                activities: [],
                summary: { totalCards: 0, totalCorrect: 0, totalTime: 0, decksStudied: [] }
            };
        }
    }, [user]);
    const handleLogout = () => {
        if (!user || !currentSessionRef.current) {
            setUser(null);
            setMode('welcome');
            setActiveDeckId(null);
            return;
        }

        // Finalize Session
        const session = currentSessionRef.current;
        session.endTime = Date.now();
        session.durationSeconds = Math.round((session.endTime - session.startTime) / 1000);

        // Calculate Summary
        const totalCards = session.activities.reduce((acc, act) => acc + (act.stats.correct + act.stats.incorrect), 0);
        const totalCorrect = session.activities.reduce((acc, act) => acc + act.stats.correct, 0);
        const decks = Array.from(new Set(session.activities.map(a => a.deckName)));

        session.summary = {
            totalCards,
            totalCorrect,
            totalTime: session.durationSeconds,
            decksStudied: decks
        };

        const updatedUser = {
            ...user,
            learningHistory: [...(user.learningHistory || []), session]
        };

        // Persist
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
            const profiles = JSON.parse(storedProfiles);
            profiles[updatedUser.username] = updatedUser;
            localStorage.setItem('profiles', JSON.stringify(profiles));
        }

        // Clear Remember Me on manual logout
        localStorage.removeItem('rememberedUser');

        currentSessionRef.current = null;
        setUser(null);
        navigate('welcome');
    };

    // ... (existing effects)


    useEffect(() => {
        // Retroactive Ghost Profile Cleanup
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
            try {
                let modified = false;
                const profiles: Record<string, UserProfile> = JSON.parse(storedProfiles);
                Object.keys(profiles).forEach(key => {
                    const p = profiles[key];
                    if (!p) return;

                    // 1. Delete ghost alias keys
                    if (key !== p.username && key !== p.email) {
                        delete profiles[key];
                        modified = true;
                    }
                    // 2. Repair missing IDs so they aren't invisible to Admin Dashboard
                    else if (!p.id) {
                        p.id = crypto.randomUUID();
                        modified = true;
                    }
                });
                if (modified) {
                    localStorage.setItem('profiles', JSON.stringify(profiles));
                    console.log("Scrubbed ghost profiles from storage.");
                }
            } catch (e) {
                console.error("Cleanup failed", e);
            }
        }

        const storedDecks = localStorage.getItem('decks');
        if (storedDecks) {
            try {
                const parsedDecks: Deck[] = JSON.parse(storedDecks);
                if (parsedDecks.length > 0) {
                    setDecks(parsedDecks);
                }
            } catch (e) {
                console.error("Failed to load decks", e);
            }
        }

        const storedStudents = localStorage.getItem('students');
        if (storedStudents) {
            try {
                const parsedStudents: Student[] = JSON.parse(storedStudents);
                if (parsedStudents.length > 0) {
                    setStudents(parsedStudents);
                }
            } catch (e) {
                console.error("Failed to load students", e);
            }
        }

        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
            try {
                // Merge with defaults to ensure new fields are present
                const loadedSettings = JSON.parse(storedSettings);
                // Migration: If autoAdvanceDelay is the old default (7000), reset it to new default (2000)
                if (loadedSettings.autoAdvanceDelay === 7000) {
                    loadedSettings.autoAdvanceDelay = 2000;
                }

                // Identify if categories are purely the old default or heavily customized
                if (loadedSettings.categories) {
                    const keys = Object.keys(loadedSettings.categories);
                    // If they just have the old default 4 keys, overwrite them with the new comprehensive list
                    if (keys.length === 4 && keys.includes('Noun') && keys.includes('Verb')) {
                        delete loadedSettings.categories;
                    }
                }

                setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings });
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        }
    }, []);

    // Check for existing session or show login
    // Check for existing session or show login where needed (now handled in layout)
    // if (!user) ... logic moved to render

    // (Old goHome/goBack removed)

    const persistDecks = (currentDecks: Deck[]) => {
        setDecks(currentDecks);
        localStorage.setItem('decks', JSON.stringify(currentDecks));
    };

    const handleSaveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        localStorage.setItem('settings', JSON.stringify(newSettings));
    };

    const handleBulkAdd = (newCards: Word[]) => {
        let targetRealDeckId = activeDeckId;

        // If "session" deck (virtual), try to map it to a real deck
        if (targetRealDeckId?.startsWith('session-')) {
            const cat = targetRealDeckId.replace('session-', '');
            const subjectMap: Record<string, string> = {
                'vocabulary': 'Vocabulary', 'idioms': 'Idioms', 'phrasal-verbs': 'Phrasal Verbs',
                'collocations': 'Collocations', 'prepositions': 'Prepositions'
            };
            // Default to Vocabulary if unknown, or find first deck with matching subject
            const targetSubject = subjectMap[cat] || 'Vocabulary';
            const match = decks.find(d => d.subject === targetSubject);
            if (match) {
                targetRealDeckId = match.id;
            } else {
                // Fallback to first deck if absolutely nothing matches
                targetRealDeckId = decks[0].id;
            }
        }

        // Final fallback if activeDeckId was null
        if (!targetRealDeckId) {
            targetRealDeckId = decks[0].id;
        }

        const decksWithBulk = decks.map(d => {
            if (d.id === targetRealDeckId) {
                return { ...d, cards: [...d.cards, ...newCards] };
            }
            return d;
        });

        persistDecks(decksWithBulk);
    };



    const handleAddCardToDeck = (newWord: Word, deckId: string) => {
        setDecks(prevDecks => {
            const updatedDecks = prevDecks.map(d => {
                if (d.id === deckId) {
                    return { ...d, cards: [...d.cards, newWord] };
                }
                return d;
            });
            localStorage.setItem('decks', JSON.stringify(updatedDecks));
            return updatedDecks;
        });
    };

    const handleAddDeckGlobal = (newDeck: Deck) => {
        setDecks(prevDecks => {
            const updatedDecks = [...prevDecks, newDeck];
            localStorage.setItem('decks', JSON.stringify(updatedDecks));
            return updatedDecks;
        });
    };



    const handleDeleteCard = (id: string) => {
        const updatedDecks = decks.map(d => ({
            ...d,
            cards: d.cards.filter(c => String(c.id) !== id)
        }));
        persistDecks(updatedDecks);
    };

    const handleBulkDeleteCards = (ids: string[]) => {
        const idSet = new Set(ids);
        const updatedDecks = decks.map(d => ({
            ...d,
            cards: d.cards.filter(c => !idSet.has(String(c.id)))
        }));
        persistDecks(updatedDecks);
    };

    const handleBulkArchiveCards = (ids: string[], isArchiving: boolean) => {
        const idSet = new Set(ids);
        const updatedDecks = decks.map(d => ({
            ...d,
            cards: d.cards.map(c => idSet.has(String(c.id)) ? { ...c, isArchived: isArchiving } : c)
        }));
        persistDecks(updatedDecks);
    };

    const handleEditCard = (updatedWord: Word, additionalCards?: {card: Word, deckId: string}[]) => {
        setDecks(prevDecks => {
            const updatedDecks = prevDecks.map(d => {
                let nextDeck = { ...d };
                
                // 1. Update the origin card explicitly mapped to this deck 
                nextDeck.cards = nextDeck.cards.map(c => String(c.id) === String(updatedWord.id) ? updatedWord : c);
                
                // 2. Splice in any newly generated split meanings explicitly bound to this deck
                if (additionalCards && additionalCards.length > 0) {
                    const destinedCards = additionalCards.filter(ac => ac.deckId === d.id).map(ac => ac.card);
                    if (destinedCards.length > 0) {
                        nextDeck.cards = [...nextDeck.cards, ...destinedCards];
                    }
                }
                return nextDeck;
            });
            localStorage.setItem('decks', JSON.stringify(updatedDecks));
            return updatedDecks;
        });
    };

    const handleMarkForReview = (cardId: string) => {
        setDecks(prevDecks => {
            const updatedDecks = prevDecks.map(d => ({
                ...d,
                cards: d.cards.map(c => 
                    String(c.id) === String(cardId) 
                        ? { ...c, markedForReview: !c.markedForReview } 
                        : c
                )
            }));
            localStorage.setItem('decks', JSON.stringify(updatedDecks));
            return updatedDecks;
        });
    };

    const handleMoveCard = (cardId: string, newDeckId: string) => {
        let cardToMove: Word | undefined;

        // 1. Find and remove card from source
        const decksWithoutCard = decks.map(d => {
            const card = d.cards.find(c => String(c.id) === cardId);
            if (card) {
                cardToMove = card;
                return { ...d, cards: d.cards.filter(c => String(c.id) !== cardId) };
            }
            return d;
        });

        if (!cardToMove) return;

        // 2. Add to target
        const updatedDecks = decksWithoutCard.map(d => {
            if (d.id === newDeckId) {
                return { ...d, cards: [...d.cards, cardToMove!] };
            }
            return d;
        });

        persistDecks(updatedDecks);
    };

    const handleCreateDeck = (newDeck: Deck) => {
        const updatedDecks = [...decks, newDeck];
        persistDecks(updatedDecks);
        navigate('admin', newDeck.id);
    };

    const handleQuizComplete = (result: QuizResult) => {
        if (!user) return;
        setLastQuizResult(result);
        const updatedUser = { ...user };
        // Legacy Logging
        const newLog: SessionLog = {
            id: crypto.randomUUID(),
            date: new Date(),
            deckId: activeDeckId || 'default',
            mode: 'quiz',
            durationSeconds: 0,
            score: {
                correct: result.correct,
                incorrect: result.incorrect,
                unanswered: 0
            }
        };
        updatedUser.history = [...updatedUser.history, newLog];

        // NEW Session Tracking
        if (currentSessionRef.current) {
            currentSessionRef.current.activities.push({
                id: crypto.randomUUID(),
                type: 'quiz',
                deckId: activeDeckId || 'default',
                deckName: getActiveTitle(),
                timestamp: Date.now(),
                durationSeconds: 0, // Could track actual quiz time if passed
                stats: {
                    correct: result.correct,
                    incorrect: result.incorrect,
                    score: Math.round((result.correct / result.total) * 100)
                }
            });
        }

        const deckId = activeDeckId || 'default';
        const currentProgress = updatedUser.progress[deckId] || {
            deckId: deckId, cardsLearned: 0, cardsDue: 0, accuracy: 0
        };
        const currentDeck = decks.find(d => d.id === deckId);
        const totalCards = currentDeck ? currentDeck.cards.length : 10;
        const newLearned = Math.min(totalCards, currentProgress.cardsLearned + result.correct);
        updatedUser.progress[deckId] = {
            ...currentProgress,
            cardsLearned: newLearned,
            accuracy: Math.round((result.correct / result.total) * 100)
        };
        setUser(updatedUser);
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
            const profiles = JSON.parse(storedProfiles);
            profiles[updatedUser.username] = updatedUser;
            localStorage.setItem('profiles', JSON.stringify(profiles));
        }
        setMode('quiz-result');
    };



    const handleCardLearned = (_card: Word) => {
        if (!user) return;
        const updatedUser = { ...user };
        const deckId = activeDeckId || 'default';

        // NEW Session Tracking (Aggregation)
        if (currentSessionRef.current) {
            const activities = currentSessionRef.current.activities;
            const lastActivity = activities[activities.length - 1];

            // If last activity was studying this deck, aggregate
            if (lastActivity && lastActivity.type === 'study' && lastActivity.deckId === deckId) {
                lastActivity.stats.correct += 1;
                lastActivity.durationSeconds += 5; // Estimate 5s per card?
            } else {
                // Create new block
                activities.push({
                    id: crypto.randomUUID(),
                    type: 'study',
                    deckId: deckId,
                    deckName: getActiveTitle(),
                    timestamp: Date.now(),
                    durationSeconds: 0,
                    stats: {
                        correct: 1,
                        incorrect: 0
                    }
                });
            }
        }

        const currentProgress = updatedUser.progress[deckId] || {
            deckId: deckId, cardsLearned: 0, cardsDue: 0, accuracy: 0
        };
        const newLearned = currentProgress.cardsLearned + 1;
        updatedUser.progress[deckId] = {
            ...currentProgress,
            cardsLearned: newLearned
        };
        setUser(updatedUser);
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
            const profiles = JSON.parse(storedProfiles);
            profiles[updatedUser.username] = updatedUser;
            localStorage.setItem('profiles', JSON.stringify(profiles));
        }
    };

    // Explicit Session Update (for End/Restart)
    const handleSessionUpdate = (activity: import('./types').SessionActivity) => {
        if (!user) return;
        const updatedUser = { ...user };

        // Ensure learningHistory exists
        if (!updatedUser.learningHistory) updatedUser.learningHistory = [];

        // Find or create current session block
        // Ideally we are inside a session, but if not we can create one
        let currentSession = updatedUser.learningHistory.find(s => s.id === currentSessionRef.current?.id);

        if (!currentSession) {
            // Fallback: create a new session block if not found (e.g. reload)
            const newSession = {
                id: crypto.randomUUID(),
                startTime: Date.now(),
                endTime: null,
                durationSeconds: 0,
                activities: [],
                summary: { totalCards: 0, totalCorrect: 0, totalTime: 0, decksStudied: [] }
            };
            updatedUser.learningHistory.push(newSession);
            currentSession = newSession;
        }

        currentSession.activities.push(activity);

        // Update User
        setUser(updatedUser);

        // Persist
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
            const profiles = JSON.parse(storedProfiles);
            profiles[updatedUser.username] = updatedUser;
            localStorage.setItem('profiles', JSON.stringify(profiles));
        }
    };


    const showToast = (message: string, actionLabel?: string, onAction?: () => void) => {
        setToast({ message, actionLabel, onAction });
    };

    const handleUpdateProfile = (_oldUsername: string, newUserData: Partial<UserProfile>) => {
        if (!user) return;

        const storedProfiles = localStorage.getItem('profiles');
        const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};

        // Determine current key: Email takes precedence, otherwise Username
        // Note: oldUsername arg is passed from ProfilePage, but we might rely on user.email if set.
        const currentKey = user.email || user.username;
        const newKey = newUserData.email || (user.email ? user.email : newUserData.username); // If we have email, keep it. If not, maybe switching username?

        // Check if we are changing the Key
        // Key changes if:
        // 1. We are setting an Email for the first time (Migration from Username -> Email)
        // 2. We are changing the Email
        // 3. We are changing Username AND we don't have an Email yet (Legacy Migration)

        const isKeyChange = (() => {
            if (newUserData.email && newUserData.email !== user.email) return true; // Adding/Changing Email
            if (!user.email && newUserData.username && newUserData.username !== user.username) return true; // Legacy Username change
            return false;
        })();

        if (isKeyChange && newKey) {
            // Collision Check
            if (profiles[newKey]) {
                alert("Email or Username already taken!");
                return;
            }

            const updatedProfile = { ...user, ...newUserData };
            const roleChanged = user.role !== updatedProfile.role;

            delete profiles[currentKey];
            profiles[newKey] = updatedProfile;

            setUser(updatedProfile);
            localStorage.setItem('profiles', JSON.stringify(profiles));

            if (localStorage.getItem('rememberedUser')) {
                localStorage.setItem('rememberedUser', JSON.stringify(updatedProfile));
            }

            if (isNewUserSession || roleChanged) {
                if (isNewUserSession) setIsNewUserSession(false);
                setHistory([]);
                setTimeout(() => {
                    if (updatedProfile.role === 'admin') setMode('mode-selection');
                    else if (updatedProfile.role === 'tutor') setMode('tutor');
                    else setMode('welcome'); // User dashboard
                }, 500);
            }
        } else {
            // Just updating fields, key remains same
            const updatedProfile = { ...user, ...newUserData };
            const roleChanged = user.role !== updatedProfile.role;

            profiles[currentKey] = updatedProfile;

            setUser(updatedProfile);
            localStorage.setItem('profiles', JSON.stringify(profiles));

            if (localStorage.getItem('rememberedUser')) {
                localStorage.setItem('rememberedUser', JSON.stringify(updatedProfile));
            }

            if (isNewUserSession || roleChanged) {
                if (isNewUserSession) setIsNewUserSession(false);
                setHistory([]);
                setTimeout(() => {
                    if (updatedProfile.role === 'admin') setMode('mode-selection');
                    else if (updatedProfile.role === 'tutor') setMode('tutor');
                    else setMode('welcome'); // User dashboard
                }, 500);
            }
        }

        showToast("Profile Updated Successfully!");
    };

    const handleToggleFavorite = (id: string, type: 'deck' | 'mode', label: string, modeName?: string) => {
        if (!user) return;
        const updatedUser = { ...user };
        const existingIndex = updatedUser.favorites?.findIndex(f => f.deckId === id && f.mode === modeName);

        if (existingIndex !== undefined && existingIndex >= 0) {
            // Remove
            updatedUser.favorites = updatedUser.favorites.filter((_, i) => i !== existingIndex);
            showToast("Removed from favorites");
        } else {
            // Add
            if (!updatedUser.favorites) updatedUser.favorites = [];
            updatedUser.favorites.push({
                id: crypto.randomUUID(),
                type,
                deckId: id,
                mode: modeName,
                label,
                timestamp: Date.now()
            });
            showToast("Saved to favorites", "View", () => {
                navigate('welcome'); // Go to favorites list
            });
        }
        setUser(updatedUser);

        // Persist
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
            const profiles = JSON.parse(storedProfiles);
            profiles[updatedUser.username] = updatedUser;
            localStorage.setItem('profiles', JSON.stringify(profiles));
        }
    };

    const handleQuickStart = () => {
        if (!user?.lastSession) return;
        const { deckId } = user.lastSession; // Ignore saved mode
        navigate('deck', deckId); // Always go to Deck View options
    };

    const handleSelectFavorite = (fav: import('./types').FavoriteItem) => {
        if (fav.deckId.startsWith('vocab-')) {
            navigate('deck', `session-${fav.deckId}`);
        } else {
            navigate('deck', fav.deckId);
        }
        // Ignore fav.mode, always go to options
    };

    // Helper to get active cards
    const getActiveCards = () => {
        if (!activeDeckId) return decks[0].cards;

        // 1. Global Random Mix (Decks + Vocab Topics)
        if (activeDeckId === 'random-mix') {
            const deckCards = decks.flatMap(d => d.cards);
            const topicCards = Object.values(TOPIC_CONTENT).flat();
            // Dedup by ID if needed, but IDs should be unique ranges
            return [...deckCards, ...topicCards].sort(() => Math.random() - 0.5);
        }

        if (activeDeckId.startsWith('session-')) {
            const categoryId = activeDeckId.replace('session-', '');

            // 2. All Vocabulary Random Mix
            if (categoryId === 'vocab-random') {
                return Object.values(TOPIC_CONTENT).flat().sort(() => Math.random() - 0.5);
            }

            // 3. Group Random Mix
            if (categoryId.startsWith('vocab-group-')) {
                const groupId = categoryId.replace('vocab-group-', '');
                const group = TOPIC_GROUPS.find(g => g.id === groupId);
                if (group) {
                    const groupTopicIds = group.topics.map(t => t.id);
                    return groupTopicIds.flatMap(id => TOPIC_CONTENT[id] || []).sort(() => Math.random() - 0.5);
                }
                return [];
            }

            // Handle new Vocab Topics
            if (categoryId.startsWith('vocab-')) {
                // Return specific content from our new data file
                return TOPIC_CONTENT[categoryId] || [];
            }


            const subjectMap: Record<string, string> = {
                'vocabulary': 'Vocabulary',
                'idioms': 'Idioms',
                'phrasal-verbs': 'Phrasal Verbs',
                'collocations': 'Collocations',
                'prepositions': 'Prepositions'
            };
            const targetSubject = subjectMap[categoryId];
            const matchingDecks = decks.filter(d => d.subject === targetSubject);
            return matchingDecks.flatMap(d => d.cards).sort(() => Math.random() - 0.5);
        }

        return decks.find(d => d.id === activeDeckId)?.cards || [];
    };

    const activeCards = getActiveCards();

    const getActiveTitle = () => {
        if (!activeDeckId) return t('topics.selection.student_library'); // Or just "Library"
        if (activeDeckId === 'random-mix') return t('topics.selection.surprise_me_title');

        if (activeDeckId.startsWith('session-')) {
            const catId = activeDeckId.replace('session-', '');

            if (catId === 'vocab-random') return t('topics.selection.surprise_me_title');

            if (catId.startsWith('vocab-group-')) {
                const groupId = catId.replace('vocab-group-', '');
                const group = TOPIC_GROUPS.find(g => g.id === groupId);
                if (group) return t('topics.selection.random_mix_title', { group: t(group.titleKey) });
                return "Group Mix";
            }

            if (catId.startsWith('vocab-')) {
                // Find the topic label
                for (const group of TOPIC_GROUPS) {
                    const topic = group.topics.find(t => t.id === catId);
                    if (topic) return t(topic.labelKey);
                }
                const part = catId.replace('vocab-', '');
                return `Vocabulary: ${part.charAt(0).toUpperCase() + part.slice(1)}`;
            }

            // Capitalize or map
            const subjectMap: Record<string, string> = {
                'vocabulary': t('welcome.categories.vocabulary'),
                'idioms': t('welcome.categories.idioms'),
                'phrasal-verbs': t('welcome.categories.phrasal_verbs'),
                'collocations': t('welcome.categories.collocations'),
                'prepositions': t('welcome.categories.prepositions')
            };
            return subjectMap[catId] || catId;
        }
        return decks.find(d => d.id === activeDeckId)?.title || "Deck";
    };

    const getTicketContext = () => {
        const deckName = activeDeckId ? getActiveTitle() : 'None';
        return `Mode: ${mode}, Page: ${activeDeckId || 'Home'}, Deck: ${deckName}`;
    };

    // ... (removed duplicate state)

    const handleReportCard = (cardId: number, reason: string) => {
        if (!activeDeckId) return;
        setDecks(prevDecks => prevDecks.map(deck => ({
            ...deck,
            cards: deck.cards.map(card => {
                if (card.id === cardId) {
                    return {
                        ...card,
                        reports: [...(card.reports || []), { reason, timestamp: Date.now(), userId: user?.id || 'anonymous' }]
                    };
                }
                return card;
            })
        })));
    };

    const handleArchiveDeck = (deckId: string) => {
        if (window.confirm("Are you sure you want to archive this deck? It will be moved to the Archived tab.")) {
            setDecks(prev => prev.map(d => d.id === deckId ? { ...d, isArchived: true } : d));
            if (activeDeckId === deckId) {
                setActiveDeckId(null);
                if (mode === 'deck') goBack();
            }
        }
    };

    const handleUnarchiveDeck = (deckId: string) => {
        setDecks(prev => prev.map(d => d.id === deckId ? { ...d, isArchived: false } : d));
    };

    const handleDeleteDeck = (deckId: string) => {
        if (window.confirm("Are you sure you want to permanently delete this deck and all its flashcards? This cannot be undone.")) {
            setDecks(prev => {
                const updated = prev.filter(d => d.id !== deckId);
                localStorage.setItem('decks', JSON.stringify(updated));
                return updated;
            });
            if (activeDeckId === deckId) {
                setActiveDeckId(null);
                if (mode === 'deck') goBack();
            }
        }
    };

    const handleUpdateStudent = (updatedStudent: Student) => {
        const newStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
        setStudents(newStudents);
        localStorage.setItem('students', JSON.stringify(newStudents));
    };

    const handleDeleteStudent = (id: string) => {
        const newStudents = students.filter(s => s.id !== id);
        setStudents(newStudents);
        localStorage.setItem('students', JSON.stringify(newStudents));
    };

    const handleAddStudent = (newStudent: Student) => {
        const newStudents = [...students, newStudent];
        setStudents(newStudents);
        localStorage.setItem('students', JSON.stringify(newStudents));
    };

    // Admin Handlers (Duplicates Removed)

    // Admin Handlers (Duplicates Removed)


    const handleDeleteAccount = () => {
        if (!user) return;

        if (window.confirm("WARNING: This will permanently delete your account and all associated data from this device.")) {
            // Read all users
            const storedUsersStr = localStorage.getItem('flashcard_users');
            if (storedUsersStr) {
                try {
                    const allUsers = JSON.parse(storedUsersStr);
                    // Filter out the current user
                    const updatedUsers = allUsers.filter((u: any) => u.email !== user.email);
                    localStorage.setItem('flashcard_users', JSON.stringify(updatedUsers));
                } catch (e) {
                    console.error("Failed handling user deletion:", e);
                }
            }

            // Clear current login state
            localStorage.removeItem('flashcard_login_state');

            setUser(null);
            showToast('Your account was successfully deleted.', 'success');
            navigate('welcome');
        }
    };


    return (
        <DevModeProvider isAdmin={user?.role === 'admin'}>
            <div data-dev-id="app-root" className="min-h-screen bg-background flex">
            {/* Sidebar / Spacer - Fixed width to shift content right */}
            {/* Using fixed width (w-64/w-72) instead of % to prevent extreme shifts on wide screens */}
            {/* Sidebar / Spacer - Fixed width to shift content right */}
            {/* Using fixed width (w-36 ~144px) to provide a subtle shift without unbalancing the page */}
            {user && <div className="hidden lg:block w-36 flex-shrink-0" />}

            {/* Main Content Column - Alignment Context */}
            <div data-dev-id="app-main-column" className="flex-1 flex flex-col min-w-0 relative">

                {/* Global Header - Sticky within the content column */}
                <header data-dev-id="app-header" className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border px-6 py-4">
                    <div className={`${mode === 'study' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto flex items-center justify-between relative`}>
                        {/* Navigation - Fixed Width for visual balance */}
                        <div className="flex items-center gap-3 z-10 w-24">
                            <button
                                onClick={goBack}
                                className="p-2 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={t('common.back')}
                                disabled={!user && mode === 'welcome'}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={goHome}
                                className="p-2 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-95"
                                title={t('common.home')}
                            >
                                <Home className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Brand - Centered relative to container, shifted left in study mode to align with flashcard (compensating for right sidebar) */}
                        <div data-dev-id="app-logo" className={`absolute left-1/2 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none transition-all duration-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${mode === 'study' ? 'md:-translate-x-[calc(50%+9rem)] -translate-x-1/2' : '-translate-x-1/2'}`}>
                            <Sparkles className="w-10 h-10 text-primary" />
                            <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                                Lumina
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 z-10 w-auto min-w-[100px]">
                            <LanguageSelector />
                            {user && (
                                <>
                                    <div ref={profileMenuRef} className="relative">
                                        <button
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors text-foreground border border-border hover:border-primary/20"
                                        >
                                            {(() => {
                                                const isSuperAdmin = user.id === 'admin';
                                                let Icon = User;
                                                let label = user.username;

                                                if (user.role === 'admin') {
                                                    Icon = Shield;
                                                    label = t('roles.admin');
                                                } else if (user.role === 'tutor') {
                                                    Icon = GraduationCap;
                                                    label = isSuperAdmin ? t('roles.adminTutor') : user.username;
                                                } else if (user.role === 'user') {
                                                    Icon = Sparkles;
                                                    label = isSuperAdmin ? t('roles.adminLearner') : user.username;
                                                }
                                                return (
                                                    <>
                                                        <Icon className="w-4 h-4" />
                                                        <span className="text-sm font-medium leading-none">{label}</span>
                                                    </>
                                                );
                                            })()}
                                        </button>

                                        {isProfileMenuOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-secondary border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-2 space-y-1">
                                                    <button
                                                        onClick={() => {
                                                            if (user.id === 'admin') {
                                                                setMode('mode-selection');
                                                            } else {
                                                                setMode('profile');
                                                            }
                                                            setIsProfileMenuOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                                                    >
                                                        <UserCircle className="w-4 h-4" />
                                                        <span>{t('common.profile')}</span>
                                                    </button>
                                                    <div className="h-px bg-border/50 my-1" />
                                                    <button
                                                        onClick={() => {
                                                            handleLogout();
                                                            setIsProfileMenuOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors text-left"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        <span>{t('common.logout')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    settings={settings}
                    onSave={handleSaveSettings}
                    onOpenBulkImport={() => setIsBulkModalOpen(true)}
                    onNavigate={(path) => {
                        setIsSettingsOpen(false);
                        if (path === 'profile') navigate('profile');
                        if (path === 'flashcards') {
                            navigate('admin', null);
                        }
                    }}
                    onLogout={handleLogout}
                    user={user}
                />

                <BulkGeneratorModal
                    isOpen={isBulkModalOpen}
                    onClose={() => setIsBulkModalOpen(false)}
                    onSave={handleBulkAdd}
                    apiKey={settings.geminiApiKey}
                />

                {/* Main Scrollable Content */}
                <main className={`flex-grow flex flex-col ${!user ? '' : 'py-8 px-4'}`}>
                    {!user ? (
                        <div className="flex-grow w-full flex flex-col items-center justify-center">
                            <LoginScreen
                                onLogin={handleLogin}
                                showToast={showToast}
                            />
                        </div>
                    ) : (
                        <div className="max-w-5xl w-full mx-auto flex-grow flex flex-col">
                            {mode === 'welcome' && (
                                <WelcomeScreen
                                    user={user}
                                    lastSession={user.lastSession}
                                    favorites={user.favorites || []}
                                    onQuickStart={handleQuickStart}
                                    onSelectFavorite={handleSelectFavorite}
                                    onNavigate={navigate}
                                    onUpdateProfile={handleUpdateProfile}
                                />
                            )}

                            {mode === 'mode-selection' && (
                                <UserModeSelectionScreen
                                    onSelectMode={(role) => {
                                        if (user) {
                                            const updatedUser = { ...user, role };
                                            setUser(updatedUser);
                                            // Persist role selection for this session if needed, 
                                            // but for now just routing.
                                            if (role === 'admin') {
                                                navigate('admin', null, 'menu');
                                            } else if (role === 'tutor') {
                                                navigate('tutor');
                                            } else {
                                                navigate('welcome');
                                            }
                                        }
                                    }}
                                />
                            )}

                            {mode === 'topic-selection' && (
                                <TopicSelectionScreen
                                    onSelect={(topicId, _label) => {
                                        setActiveDeckId(`session-${topicId}`);
                                        setMode('deck');
                                    }}
                                    onBack={goHome}
                                    favorites={user?.favorites || []}
                                    onToggleFavorite={handleToggleFavorite}
                                    decks={decks}
                                    activeDeckIds={user?.activeDeckIds || []}
                                    onSelectDeck={(deckId) => {
                                        navigate('deck', deckId);
                                    }}
                                    onGroupSelect={setTopicGroupId}
                                />
                            )}

                            {mode === 'profile' && (
                                <ProfilePage
                                    user={user}
                                    onManageDeck={() => navigate('admin', null)}
                                    onBack={goBack}
                                    onUpdateProfile={handleUpdateProfile}
                                    showToast={showToast}
                                    initialEditMode={isNewUserSession}
                                    onLogout={handleLogout}
                                    onDeleteAccount={handleDeleteAccount}
                                    onOpenSettings={() => setIsSettingsOpen(true)}
                                    initialScrollTarget={profileScrollTarget}
                                />
                            )}

                            {mode === 'deck' && (
                                <DeckView
                                    cards={activeCards}
                                    title={getActiveTitle()}
                                    onStartStudy={() => navigate('study', activeDeckId)}
                                    onStartQuiz={(style) => {
                                        setQuizStyle(style || 'word-to-def');
                                        navigate('quiz', activeDeckId);
                                    }}
                                    onStartTimedMode={() => navigate('timed', activeDeckId)}
                                    isFavorite={user.favorites?.some(f => f.deckId === activeDeckId && !f.mode) ?? false}
                                    onToggleFavorite={() => handleToggleFavorite(activeDeckId || '', 'deck', getActiveTitle())}
                                    onBack={goBack}
                                    deck={decks.find(d => d.id === activeDeckId)}
                                />
                            )}

                            {mode === 'study' && (
                                <StudyMode
                                    cards={activeCards}
                                    onExit={goBack}
                                    settings={settings}
                                    onSaveSettings={handleSaveSettings} // New prop
                                    onMarkKnown={handleCardLearned}
                                    isFavorite={user.favorites?.some(f => f.deckId === activeDeckId && f.mode === 'study') ?? false}
                                    onToggleFavorite={() => handleToggleFavorite(activeDeckId || '', 'mode', `${getActiveTitle()} (Study)`, 'study')}
                                    onReport={handleReportCard}
                                    deckId={activeDeckId || ''}
                                    learningHistory={user.learningHistory || []}
                                    onSessionUpdate={handleSessionUpdate}
                                    onInputModeChange={setStudyInputMode}
                                    onMarkForReview={handleMarkForReview}
                                />
                            )}

                            {mode === 'quiz' && (
                                <QuizMode cards={activeCards} onExit={goBack} onComplete={handleQuizComplete} quizStyle={quizStyle} />
                            )}

                            {mode === 'timed' && (
                                <TimedMode cards={activeCards} onExit={goBack} settings={settings} />
                            )}

                            {mode === 'typing' && (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <p className="text-muted-foreground">Typing Mode Coming Soon!</p>
                                    <button onClick={goHome} className="mt-4 text-primary hover:underline">Go Home</button>
                                </div>
                            )}

                            {mode === 'quiz-result' && lastQuizResult && (
                                <QuizResults result={lastQuizResult} onHome={goHome} onRetry={() => navigate('quiz', activeDeckId)} />
                            )}

                            {mode === 'tutor' && (
                                <TutorDashboard
                                    user={user!}
                                    students={students}
                                    decks={decks}
                                    onUpdateStudent={handleUpdateStudent}
                                    onAddStudent={handleAddStudent}
                                    onDeleteStudent={handleDeleteStudent}
                                    view={tutorActiveView}
                                    onViewChange={(newView) => navigate('tutor', activeDeckId, adminActiveTab, newView)}
                                    onAddDeck={handleAddDeckGlobal}
                                    onAddCard={handleAddCardToDeck}
                                    onEditCard={handleEditCard}
                                    apiKey={settings.geminiApiKey}
                                    settings={settings}
                                    onNavigateToProfile={(target) => {
                                        setProfileScrollTarget(target || null);
                                        navigate('profile');
                                    }}
                                    onUpdateProfile={handleUpdateProfile}
                                    onDeleteCard={handleDeleteCard}
                                    onBulkDeleteCards={handleBulkDeleteCards}
                                    onBulkArchiveCards={handleBulkArchiveCards}
                                    onSelectDeck={(deckId) => navigate('admin', deckId, 'cards')}
                                />
                            )}

                            {mode === 'admin' && user && (() => {
                                // For non-admins, ONLY show decks they have authored. This prevents them from modifying global public cards
                                // and correctly triggers the empty state when they have no cards of their own. (Allow viewing if explicitly navigated to).
                                const viewableDecks = user.role === 'admin' ? decks : decks.filter(d => d.authorId === user.id || d.id === activeDeckId);
                                const totalCards = adminActiveTab === 'cards' && !activeDeckId ? viewableDecks.flatMap(d => d.cards) : (activeCards.length > 0 ? activeCards : viewableDecks.find(d => d.id === activeDeckId)?.cards || []);
                                
                                return (
                                    <AdminDashboard
                                        userRole={user.role}
                                        decks={viewableDecks}
                                        cards={totalCards}
                                    onBack={goBack}

                                    onDeleteCard={handleDeleteCard}
                                    onBulkDeleteCards={handleBulkDeleteCards}
                                    onBulkArchiveCards={handleBulkArchiveCards}
                                    onEdit={handleEditCard}
                                    onSelectDeck={(id) => navigate('admin', id, adminActiveTab)}
                                    onCreateDeck={handleCreateDeck}
                                    onBulkAdd={handleBulkAdd}
                                    onMoveCard={handleMoveCard}
                                    activeDeckId={activeDeckId}
                                    activeTab={adminActiveTab}
                                    onTabChange={(tab) => navigate('admin', null, tab)}
                                    settings={settings}
                                    onSaveSettings={handleSaveSettings}
                                    onArchiveDeck={handleArchiveDeck}
                                    onDeleteDeck={handleDeleteDeck}
                                    onUnarchiveDeck={handleUnarchiveDeck}
                                        onBrowsePublic={() => navigate('topic-selection', null)}
                                    />
                                );
                            })()}
                        </div>
                    )}
                </main>

                {
                    toast && (
                        <Toast
                            message={toast.message}
                            actionLabel={toast.actionLabel}
                            onAction={toast.onAction}
                            onClose={() => setToast(null)}
                        />
                    )
                }

                {/* Footer */}
                {
                    user && (
                        <footer className="py-6 border-t border-border text-center text-sm text-muted-foreground bg-background/50 backdrop-blur-sm">
                            <div className="flex justify-center items-center gap-4">
                                <span>&copy; 2026 Lumina Flashcards</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <button
                                    onClick={() => setIsTicketModalOpen(true)}
                                    className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
                                >
                                    <Mail className="w-4 h-4" />
                                    Contact Us
                                </button>
                            </div>
                        </footer>
                    )
                }

                <TicketModal
                    isOpen={isTicketModalOpen}
                    onClose={() => setIsTicketModalOpen(false)}
                    context={getTicketContext()}
                    userId={user?.id || 'anonymous'}
                    username={user?.username || 'Guest'}
                />

                {/* Floating Flag (Only if user logged in) */}
                {
                    user && (
                        <button
                            onClick={() => setIsTicketModalOpen(true)}
                            className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-110 transition-all flex items-center justify-center animate-in fade-in zoom-in duration-300 border border-white/10"
                            title="Help"
                        >
                            <HelpCircle className="w-6 h-6" />
                        </button>
                    )
                }

                {/* Calculate additional suffix for Study Mode page ID based on input mode */}
                {(() => {
                    let studySuffix = '';
                    if (mode === 'study' && studyInputMode) {
                        if (studyInputMode === 'manual_self') studySuffix = 'm';
                        else if (studyInputMode === 'manual_type') studySuffix = 't';
                        else if (studyInputMode === 'manual_choice') studySuffix = 'c';
                        else if (studyInputMode === 'voice') studySuffix = 'v';
                    }

                    return (
                        <PageIdentifier
                            mode={mode === 'topic-selection' && topicGroupId ? 'topic-group' : mode}
                            userRole={user?.role}
                            language={i18n.language}
                            activeDeckId={activeDeckId}
                            studyModeSuffix={studySuffix}
                        />
                    );
                })()}
            </div >
        </div >
        </DevModeProvider>
    );
}

export default App;
