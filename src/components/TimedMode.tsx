import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../data/vocabulary';
import { AppSettings } from '../types';
import { Timer, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Mic, Keyboard, SkipForward, Square, Play, ChevronLeft } from 'lucide-react';

interface TimedModeProps {
    cards: Word[];
    onExit: () => void;
    settings: AppSettings;
}

interface TimedStats {
    firstTryCorrect: number;
    firstTryIncorrect: number;
}

interface IncorrectAttempt {
    card: Word;
    attemptValue: string;
    correctValue: string;
}

type ModePhase = 'setup' | 'playing' | 'finished' | 'ready';
type InputMode = 'manual' | 'voice';

export default function TimedMode({ cards, onExit, settings }: TimedModeProps) {
    const [phase, setPhase] = useState<ModePhase>('setup');
    const [inputMode, setInputMode] = useState<InputMode>('manual');

    const [currentQueue, setCurrentQueue] = useState<Word[]>([...cards]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState('');
    const [attempts, setAttempts] = useState(0); // 0-3
    const [startTime, setStartTime] = useState(Date.now());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [stats, setStats] = useState<TimedStats>({ firstTryCorrect: 0, firstTryIncorrect: 0 });
    const [incorrectHistory, setIncorrectHistory] = useState<IncorrectAttempt[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [shake, setShake] = useState(false);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize Speech Recognition (Once)
    useEffect(() => {
        if (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';
        }
    }, []);

    // 1. checkAnswer needs to be defined BEFORE usage in dependencies. 
    // But it uses state. So let's define it first.

    const checkAnswerRef = useRef<(e: React.FormEvent | null, v?: string) => void>(() => { });

    // Main Game Logic
    const handleCheckAnswer = (e: React.FormEvent | null, voiceInput?: string) => {
        if (e) e.preventDefault();
        const currentCard = currentQueue[currentIndex];
        if (!currentCard || phase !== 'playing') return;

        const valToCheck = voiceInput !== undefined ? voiceInput : input;
        const cleanInput = valToCheck.trim().toLowerCase();
        const cleanAnswer = currentCard.word.trim().toLowerCase();

        // Remove punctuation for voice matching to be more lenient
        // Fixed regex escape for backtick
        const normalize = (s: string) => s.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

        const isCorrect = cleanInput === cleanAnswer ||
            (inputMode === 'voice' && normalize(cleanInput).includes(normalize(cleanAnswer)));

        if (isCorrect) {
            // Correct
            setStatusMessage('Correct!');
            setTimeout(() => setStatusMessage(''), 1000); // Clear msg

            if (attempts === 0) {
                setStats(prev => ({ ...prev, firstTryCorrect: prev.firstTryCorrect + 1 }));
            }

            // Stop listening to ensure clean state for next card
            if (isListening) stopListening();

            if (currentIndex < currentQueue.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setInput('');
                setAttempts(0);
            } else {
                setPhase('finished');
            }
        } else {
            // Incorrect
            setShake(true);
            setTimeout(() => setShake(false), 500);

            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            setIncorrectHistory(prev => [...prev, {
                card: currentCard,
                attemptValue: valToCheck,
                correctValue: currentCard.word
            }]);

            if (newAttempts >= 3) {
                alert(`Strike 3! The correct answer was "${currentCard.word}". Restarting session.`);
                resetSession();
            } else {
                setStatusMessage(`Incorrect. Attempt ${newAttempts}/3`);
                if (attempts === 0) {
                    setStats(prev => ({ ...prev, firstTryIncorrect: prev.firstTryIncorrect + 1 }));
                }
                setInput('');
                // If voice, it auto-restarts listening via effect
            }
        }
    };

    // Keep ref updated
    useEffect(() => {
        checkAnswerRef.current = handleCheckAnswer;
    });

    // Bind Event Handlers to Recognition
    useEffect(() => {
        if (!recognitionRef.current) return;

        recognitionRef.current.onresult = (event: any) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript.toLowerCase().trim();
            setInput(text);
            // Call via ref to avoid stale closure
            checkAnswerRef.current(null, text);
        };

        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = (e: any) => {
            console.error("Speech error", e);
            setIsListening(false);
        };

    }, [recognitionRef.current]); // Bind once, use ref for logic

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                setStatusMessage('Listening...');
            } catch (e) {
                console.error("Mic start error", e);
            }
        }
    };

    const handleSkip = () => {
        const currentCard = currentQueue[currentIndex];
        if (!currentCard || phase !== 'playing') return;

        // Count as incorrect
        setStats(prev => ({ ...prev, firstTryIncorrect: prev.firstTryIncorrect + 1 }));

        // Add to history
        setIncorrectHistory(prev => [...prev, {
            card: currentCard,
            attemptValue: "Skipped",
            correctValue: currentCard.word
        }]);

        setStatusMessage('Skipped');
        setTimeout(() => setStatusMessage(''), 1000);

        // Advance
        if (currentIndex < currentQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setInput('');
            setAttempts(0);
        } else {
            setPhase('finished');
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleStop = () => {
        stopListening();
        setPhase('ready');
    };

    // Card Timer Logic (Independent of Mic State)
    // We use a high-precision approach: Store the END time and count down to it.

    // Tracks the absolute timestamp when the current card started
    const [cardDeadline, setCardDeadline] = useState<number>(0);
    const [timeLeftDisplay, setTimeLeftDisplay] = useState(5);

    // Reset timer on card change
    useEffect(() => {
        // Set deadline to now + 5000ms (+ small buffer for render? No, exact is better for sync)
        const now = Date.now();
        setCardDeadline(now + 5000);
        setTimeLeftDisplay(5);
    }, [currentIndex, phase]);

    // Countdown Effect (High Frequency Check)
    useEffect(() => {
        if (phase !== 'playing' || inputMode !== 'voice' || cardDeadline === 0) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = cardDeadline - now;

            // Sync Display (ceil ensures we see "5" immediately, "1" until the very end)
            // Clamp to 0
            const sec = Math.max(0, Math.ceil(remaining / 1000));
            setTimeLeftDisplay(sec);

            if (remaining <= 0) {
                // Time's up!
                clearInterval(interval);
                stopListening();
                handleSkip();
            }
        }, 100); // Check every 100ms for precision

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardDeadline, phase, inputMode]); // Re-create if deadline changes

    // Auto-listen in voice mode (remains mostly same, but ensures it doesn't fight timer)
    useEffect(() => {
        if (phase === 'playing' && inputMode === 'voice' && !isFinished() && attempts < 3) {
            if (!isListening) {
                const timer = setTimeout(() => {
                    startListening();
                }, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [currentIndex, attempts, phase, inputMode, isListening]);

    // Timer
    useEffect(() => {
        if (phase !== 'playing') return;
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime, phase]);

    // Focus input on card change (Manual only)
    useEffect(() => {
        if (inputMode === 'manual') {
            inputRef.current?.focus();
        }
    }, [currentIndex, inputMode, phase]);

    const isFinished = () => phase === 'finished';

    const startSession = (mode: InputMode) => {
        setInputMode(mode);
        setPhase('playing');
        setStartTime(Date.now());
        setCurrentIndex(0);
        setAttempts(0);
        setInput('');
        setStats({ firstTryCorrect: 0, firstTryIncorrect: 0 });
        setIncorrectHistory([]);
    };

    const resetSession = () => {
        setCurrentQueue([...cards]);
        setCurrentIndex(0);
        setInput('');
        setAttempts(0);
        setStatusMessage('Session Reset! 3 Strikes.');
        setStats({ firstTryCorrect: 0, firstTryIncorrect: 0 });
        setIncorrectHistory([]);
        setStartTime(Date.now()); // Reset timer on full reset? Yes.
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- RENDER ---

    if (phase === 'setup') {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-6 animate-in fade-in zoom-in-95 duration-300">
                <h2 className="text-3xl font-bold mb-2">Timed Challenge</h2>
                <p className="text-muted-foreground mb-12 text-center">
                    Review {cards.length} cards against the clock. 3 strikes and you restart.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
                    <button
                        onClick={() => startSession('manual')}
                        className="flex flex-col items-center p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                            <Keyboard className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Manual Mode</h3>
                        <p className="text-sm text-muted-foreground text-center">Type the answers.</p>
                    </button>

                    <button
                        onClick={() => startSession('voice')}
                        className="flex flex-col items-center p-8 rounded-2xl bg-card border border-border hover:border-accent/50 hover:bg-secondary/30 transition-all cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                            <Mic className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Voice Mode</h3>
                        <p className="text-sm text-muted-foreground text-center">Speak the answers.</p>
                    </button>
                </div>

                <div className="flex gap-4">
                    <button onClick={onExit} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Deck
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'ready') {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto p-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    {inputMode === 'voice' ? <Mic className="w-10 h-10 text-primary" /> : <Keyboard className="w-10 h-10 text-primary" />}
                </div>
                <h2 className="text-3xl font-bold mb-4">Ready?</h2>
                <p className="text-muted-foreground mb-8 text-center">
                    Starting {inputMode} session with {cards.length} cards.
                </p>

                <button
                    onClick={() => startSession(inputMode)}
                    className="flex items-center gap-2 px-12 py-4 bg-primary text-primary-foreground rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-primary/25"
                >
                    <Play className="w-6 h-6 fill-current" /> Begin
                </button>

                <button onClick={onExit} className="mt-8 text-muted-foreground hover:text-foreground text-sm">
                    Back to Menu
                </button>
            </div>
        );
    }

    if (phase === 'finished') {
        const total = stats.firstTryCorrect + stats.firstTryIncorrect;
        const initialSuccessRate = total > 0 ? Math.round((stats.firstTryCorrect / total) * 100) : 0;

        return (
            <div className="flex flex-col h-full max-w-4xl mx-auto p-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-card border border-border rounded-xl p-8 shadow-xl text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
                    <p className="text-muted-foreground mb-8">Great focus!</p>

                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="p-4 bg-secondary/20 rounded-xl">
                            <div className="text-sm text-muted-foreground mb-1">Total Time</div>
                            <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
                        </div>
                        <div className="p-4 bg-secondary/20 rounded-xl">
                            <div className="text-sm text-muted-foreground mb-1">First Try Correct</div>
                            <div className="text-2xl font-bold text-green-600">{stats.firstTryCorrect}</div>
                        </div>
                        <div className="p-4 bg-secondary/20 rounded-xl">
                            <div className="text-sm text-muted-foreground mb-1">Accuracy (1st Try)</div>
                            <div className="text-2xl font-bold text-blue-600">{initialSuccessRate}%</div>
                        </div>
                    </div>

                    {incorrectHistory.length > 0 && (
                        <div className="text-left mt-8">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Review List (Failed Attempts)
                            </h3>
                            <div className="bg-secondary/10 rounded-xl border border-border overflow-hidden">
                                {incorrectHistory.map((item, i) => (
                                    <div key={i} className="p-3 border-b border-border last:border-0 flex justify-between items-center text-sm">
                                        <div>
                                            <span className="font-semibold text-foreground">{item.card.word}</span>
                                            <span className="mx-2 text-muted-foreground">→</span>
                                            <span className="text-red-500 line-through mr-2">{item.attemptValue}</span>
                                        </div>
                                        <div className="text-green-600 font-medium">
                                            {item.correctValue}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-center">
                    <button onClick={onExit} className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = currentQueue[currentIndex];

    // Fix: Ensure category exists in settings, fallback to 'Noun' or generic default style if missing
    // We use a safe accessor to handle potential undefined
    const categoryKey = (currentCard.category && settings.categories[currentCard.category])
        ? currentCard.category
        : 'Noun';

    const categoryStyle = settings.categories[categoryKey] || {
        backgroundColor: '#e2e8f0',
        titleColor: '#64748b'
    };

    return (
        <div className="flex flex-col md:flex-row items-start justify-center w-full max-w-6xl mx-auto p-4 md:p-8 h-full gap-8">

            {/* Left Column: Card & Input */}
            <div className="flex flex-col items-center w-full max-w-2xl flex-1">
                {/* Header (Exit & Stop) */}
                <div className="w-full flex justify-between items-center mb-4">
                    <button
                        onClick={onExit}
                        className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" /> End Session
                    </button>

                    {/* Mobile Timer */}
                    <div className="md:hidden flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full">
                        <Timer className="w-4 h-4" /> {formatTime(elapsedTime)}
                    </div>


                </div>

                {/* Card Area */}
                <div className={`w-full flex-grow flex flex-col items-center justify-center min-h-[400px] mb-8 mt-12 relative transition-all ${shake ? 'animate-shake' : ''}`}>
                    {/* Status Message Overlay (Floating ABOVE card) */}
                    <div className="absolute -top-12 w-full text-center h-8">
                        {statusMessage && (
                            <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold animate-in fade-in slide-in-from-top-2 shadow-sm ${statusMessage.includes('Correct') ? 'bg-green-100 text-green-700 border border-green-200' :
                                statusMessage.includes('Listening') ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                    'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                {statusMessage}
                            </span>
                        )}
                    </div>

                    <div
                        className="w-full aspect-[4/3] max-h-96 rounded-3xl shadow-xl border-2 flex flex-col items-center justify-center p-8 relative bg-background"
                        style={{ borderColor: categoryStyle.backgroundColor }}
                    >
                        {/* Category Badge */}
                        <div
                            className="absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                            style={{ backgroundColor: categoryStyle.backgroundColor, color: categoryStyle.titleColor }}
                        >
                            {currentCard.category}
                        </div>

                        <div className="mb-4 text-center">
                            <span className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Definition</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-medium text-center mb-0 text-foreground animate-in slide-in-from-bottom-2 px-4 leading-relaxed">
                            "{currentCard.definition}"
                        </h2>
                    </div>
                </div>

                {/* Input Area */}
                <div className="w-full max-w-md relative mt-4">
                    {inputMode === 'manual' ? (
                        <form onSubmit={(e) => handleCheckAnswer(e)} className="w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type the word..."
                                className="w-full px-6 py-4 text-xl rounded-full border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all shadow-sm text-center"
                                autoFocus
                            />
                        </form>
                    ) : (
                        <div className="flex flex-col items-center gap-4 w-full">
                            {/* Grid container to ensure true centering of Mic */}
                            <div className="grid grid-cols-3 w-full items-center">
                                {/* Left Spacer */}
                                <div></div>

                                {/* Center: Mic Button */}
                                <div className="flex justify-center relative">
                                    <div className="relative">
                                        {/* Countdown Ring/Text */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                            <span className={`text-2xl font-bold ${timeLeftDisplay <= 2 ? 'text-red-600 scale-125 transition-transform' : 'text-primary-foreground'}`}>
                                                {timeLeftDisplay}
                                            </span>
                                        </div>

                                        <button
                                            onClick={isListening ? stopListening : startListening}
                                            className={`relative z-0 p-6 rounded-full transition-all duration-500 overflow-hidden ${isListening
                                                ? 'bg-red-100 text-transparent scale-110 shadow-lg' // Make text transparent to show countdown, change bg
                                                : 'bg-primary text-primary-foreground hover:scale-105'
                                                }`}
                                        >
                                            <Mic className={`w-8 h-8 ${isListening ? 'opacity-20 animate-pulse text-red-500' : 'opacity-30'}`} />

                                            {/* Progress Ring (Visuals synced via CSS) */}
                                            <svg
                                                key={currentIndex} // Force restart on card change
                                                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                                                viewBox="0 0 100 100"
                                            >
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    className="text-red-200"
                                                />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    strokeDasharray="283"
                                                    style={{
                                                        animation: 'countdown 5s linear forwards'
                                                    }}
                                                    className="text-red-500"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Stop Button */}
                                <div className="flex justify-start pl-4">
                                    <button
                                        onClick={handleStop}
                                        className="p-4 rounded-full bg-secondary hover:bg-red-100 text-muted-foreground hover:text-red-600 border border-transparent hover:border-red-200 transition-all shadow-sm hover:scale-105 group"
                                        title="Stop Session"
                                    >
                                        <Square className="w-6 h-6 fill-current" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-lg font-medium text-foreground h-8 opacity-0">
                                Placeholder
                            </p>
                        </div>
                    )}
                </div>

                {/* Skip Button (Mobile/Desktop consistent location) */}
                <div className="flex justify-center mt-6">
                    <button
                        type="button"
                        onClick={handleSkip}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-secondary/50"
                    >
                        <span>Don't Know</span>
                        <SkipForward className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Right Column: Stats Dashboard */}
            <div className="hidden md:flex flex-col w-64 shrink-0 gap-6 sticky top-8">
                {/* Timer Card */}
                <div className="p-5 rounded-2xl bg-secondary border border-secondary/80 shadow-lg backdrop-blur-md">
                    <h3 className="text-sm font-bold text-secondary-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Timer className="w-4 h-4" /> Timer
                    </h3>
                    <div className="text-4xl font-mono font-bold text-secondary-foreground">
                        {formatTime(elapsedTime)}
                    </div>
                </div>

                {/* Performance Card */}
                <div className="p-5 rounded-2xl bg-primary border border-primary/80 shadow-lg backdrop-blur-md">
                    <h3 className="text-sm font-bold text-primary-foreground uppercase tracking-wider mb-4">
                        Performance
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary-foreground/90">
                                <CheckCircle className="w-5 h-5" /> Correct
                            </div>
                            <span className="text-xl font-bold text-white">{stats.firstTryCorrect}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary-foreground/90">
                                <XCircle className="w-5 h-5" /> Incorrect
                            </div>
                            <span className="text-xl font-bold text-white">{stats.firstTryIncorrect}</span>
                        </div>
                    </div>
                </div>

                {/* Strikes Card */}
                <div className="p-5 rounded-2xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 shadow-lg backdrop-blur-md">
                    <h3 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Strikes
                    </h3>
                    <div className="flex gap-2">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className={`h-3 flex-1 rounded-full transition-colors ${i < attempts ? 'bg-red-500' : 'bg-red-200 dark:bg-red-900/40'}`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-right font-medium">
                        {3 - attempts} lives left
                    </p>
                </div>

                {/* Queue Progress */}
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2 uppercase font-bold tracking-wider">
                        <span>Progress</span>
                        <span>{currentIndex + 1} / {currentQueue.length}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / currentQueue.length) * 100}%` }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
