import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Word } from '../data/vocabulary';
import Flashcard from './Flashcard';
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Check, Mic, Shuffle, RotateCcw, Flame, Trophy, Target, Type, MonitorPlay, Heart, Timer, Pause, XCircle, Play, Flag, Bookmark } from 'lucide-react';
import { AppSettings, SessionActivity } from '../types';

interface StudyModeProps {
    cards: Word[];
    onExit: () => void;

    settings: AppSettings;
    onSaveSettings: (settings: AppSettings) => void;
    onMarkKnown: (card: Word) => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onReport: (cardId: number, reason: string) => void;
    deckId: string;
    learningHistory: import('../types').LearningSession[];
    onSessionUpdate: (activity: SessionActivity) => void;
    onInputModeChange?: (mode: string) => void;
    onMarkForReview: (cardId: string) => void;
}

export enum ExtendedLearningMode {
    DISCOVERY = 1,
    PRECISION = 2,
    THE_SPRINT = 3,
    THE_REFLEX = 4,
    ECHO_RACE = 5,
    THE_CHAOS = 6
}

export class DistractorEngine {
    static getDistractors(targetCard: Word, pool: Word[], _mode?: ExtendedLearningMode, count: number = 3): Word[] {
        const otherCards = pool.filter(c => c.id !== targetCard.id);

        // Filter and prioritize based on double-key matches: card.part_of_speech AND card.category identical to target card.
        const doubleKeyMatches = otherCards.filter(c => {
            const partOfSpeechMatches = c.part_of_speech && targetCard.part_of_speech &&
                c.part_of_speech.trim().toLowerCase() === targetCard.part_of_speech.trim().toLowerCase();
            const categoryMatches = c.category && targetCard.category &&
                c.category.trim().toLowerCase() === targetCard.category.trim().toLowerCase();
            return partOfSpeechMatches && categoryMatches;
        });

        let selected = [...doubleKeyMatches].sort(() => Math.random() - 0.5);

        if (selected.length < count) {
            const selectedIds = new Set(selected.map(s => s.id));
            const remaining = otherCards.filter(c => !selectedIds.has(c.id));

            // Specialized phrasal verb check for fallback (from original _getProximityDistractors)
            let phrasalMatches: Word[] = [];
            const subCategory = targetCard.category || '';
            if (subCategory.toLowerCase().includes("phrasal")) {
                const rootWord = targetCard.word.split(' ')[0].toLowerCase();
                phrasalMatches = remaining.filter(c => 
                    c.category && c.category.toLowerCase() === subCategory.toLowerCase() && 
                    c.word.toLowerCase().startsWith(rootWord)
                );
            }

            // Single key matches
            const singleKeyMatches = remaining.filter(c => {
                const matchPOS = c.part_of_speech && targetCard.part_of_speech &&
                    c.part_of_speech.trim().toLowerCase() === targetCard.part_of_speech.trim().toLowerCase();
                const matchCat = c.category && targetCard.category &&
                    c.category.trim().toLowerCase() === targetCard.category.trim().toLowerCase();
                return matchPOS || matchCat;
            }).sort(() => Math.random() - 0.5);

            // Combine fallbacks in priority order
            const fallbackPool = [
                ...phrasalMatches,
                ...singleKeyMatches,
                ...remaining.filter(c => !phrasalMatches.some(p => p.id === c.id))
            ];

            const uniqueFallback: Word[] = [];
            const fallbackSet = new Set(selected.map(s => s.id));
            for (const item of fallbackPool) {
                if (!fallbackSet.has(item.id)) {
                    fallbackSet.add(item.id);
                    uniqueFallback.push(item);
                }
            }

            selected = [...selected, ...uniqueFallback];
        }

        return selected.slice(0, count);
    }
}


export class AudioModeLayoutController {
    card: Word;
    pool: Word[];
    timerLimit: number;

    constructor(currentCard: Word, assetPool: Word[]) {
        this.card = currentCard;
        this.pool = assetPool;
        this.timerLimit = 2.0; // Strict target limit for Stage 5 Echo Race
    }

    executeAudioModeState() {
        const distractors = this._getProximityDistractors();
        const sortedChoices = [...distractors, this.card.definition].sort(() => Math.random() - 0.5);
        
        return {
            display_prompt: "[🔊 AUDIO INCOMING]",
            blur_text_layer_active: true,
            trigger_audio_payload_url: `/assets/audio/cards/${this.card.id}.mp3`,
            choices_labels: sortedChoices,
            input_mode_architecture: "MULTIPLE_CHOICE",
            active_countdown_limit: this.timerLimit,
            error_lifecycle_action: "SKIP_CARD_LOG"
        };
    }

    _getProximityDistractors(): string[] {
        const distractors = DistractorEngine.getDistractors(this.card, this.pool, 3);
        return distractors.map(m => m.definition);
    }
}

type StudyPhase = 'setup' | 'manual_setup' | 'choice_setup' | 'learning' | 'finished';
type InputMode = 'manual_self' | 'manual_type' | 'manual_choice' | 'voice';

const StudyMode: React.FC<StudyModeProps> = ({ cards, onExit, settings, onSaveSettings, onMarkKnown, isFavorite, onToggleFavorite, onReport, deckId, learningHistory, onSessionUpdate, onMarkForReview }) => {
    const { t } = useTranslation();

    // Session State
    const [phase, setPhase] = useState<StudyPhase>('setup');
    const [inputMode, setInputMode] = useState<InputMode>('manual_self');
    const sessionStartTime = useRef<number>(Date.now());

    // Extended Learning Modes State
    const [learningMode, setLearningMode] = useState<ExtendedLearningMode>(ExtendedLearningMode.DISCOVERY);
    const [currentChaosMode, setCurrentChaosMode] = useState<ExtendedLearningMode | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Stop watch / Pause State
    const [isPaused, setIsPaused] = useState(false);
    const [pauseTimeRemaining, setPauseTimeRemaining] = useState<number>(0); // Seconds
    const pauseIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Learning Queue
    const [queue, setQueue] = useState<Word[]>([]);
    const [currentCard, setCurrentCard] = useState<Word | null>(null);
    const [knownCount, setKnownCount] = useState(0);

    // Round Stats
    const [firstAttemptCorrect, setFirstAttemptCorrect] = useState(0);
    const [incorrectCards, setIncorrectCards] = useState<Word[]>([]);
    const [isReviewingMissed, setIsReviewingMissed] = useState(false);

    // Card State
    const [isFlipped, setIsFlipped] = useState(false);
    const hasAttemptedRef = useRef(false);

    // Input States
    const [typedAnswer, setTypedAnswer] = useState('');
    const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [currentQuestionType, setCurrentQuestionType] = useState<'def-to-word' | 'word-to-def'>('word-to-def');

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [matchStatus, setMatchStatus] = useState<'none' | 'match' | 'nomatch'>('none');

    // Retry Logic State
    const [attempts, setAttempts] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [subMessage, setSubMessage] = useState('');

    // Gamification State
    const [correctAttempts, setCorrectAttempts] = useState(0); // Total correct answers
    const [totalAttempts, setTotalAttempts] = useState(0); // Total answer attempts
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    const recognitionRef = useRef<any>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- Extended Modes Handlers ---

    const resetCardState = React.useCallback(() => {
        setIsFlipped(false);
        setMatchStatus('none');
        setStatusMessage('');
        setSubMessage('');
        setAttempts(0);
        setTypedAnswer('');
        setSelectedOption(null);
    }, []);

    const getCurrentActiveMode = React.useCallback((): ExtendedLearningMode => {
        if (learningMode === ExtendedLearningMode.THE_CHAOS) {
            return currentChaosMode || ExtendedLearningMode.DISCOVERY;
        }
        return learningMode;
    }, [learningMode, currentChaosMode]);

    const selectRandomChaosMode = React.useCallback(() => {
        const modes = [
            ExtendedLearningMode.DISCOVERY,
            ExtendedLearningMode.PRECISION,
            ExtendedLearningMode.THE_SPRINT,
            ExtendedLearningMode.THE_REFLEX,
            ExtendedLearningMode.ECHO_RACE
        ];
        const rand = modes[Math.floor(Math.random() * modes.length)];
        setCurrentChaosMode(rand);
    }, []);

    const playAudioForEchoRace = React.useCallback((card: Word) => {
        window.speechSynthesis.cancel();
        const audioUrl = `/assets/audio/cards/${card.id}.mp3`;
        const audio = new Audio(audioUrl);
        
        audio.play().catch(() => {
            const utterance = new SpeechSynthesisUtterance(card.word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        });
    }, []);

    const stopCountdown = React.useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setTimeLeft(null);
    }, []);

    const handleNext = React.useCallback((markAsKnown: boolean = false) => {
        if (!currentCard) return;
        resetCardState();
        hasAttemptedRef.current = false;
        stopCountdown();

        // If Chaos mode, select random sub-mode for the next card
        if (learningMode === ExtendedLearningMode.THE_CHAOS) {
            selectRandomChaosMode();
        }

        setQueue(prevQueue => {
            let nextQueue = [...prevQueue];
            if (markAsKnown) {
                nextQueue = nextQueue.filter(c => c.id !== currentCard.id);
                setKnownCount(prev => prev + 1);
                onMarkKnown(currentCard);
            } else {
                nextQueue = nextQueue.filter(c => c.id !== currentCard.id);
                nextQueue.push(currentCard);
            }

            if (nextQueue.length === 0) {
                setPhase('finished');
                setCurrentCard(null);
            } else {
                setCurrentCard(nextQueue[0]);
            }
            return nextQueue;
        });
    }, [currentCard, onMarkKnown, learningMode, selectRandomChaosMode, stopCountdown, resetCardState]);

    const handleTimeout = React.useCallback(() => {
        const activeMode = getCurrentActiveMode();
        setCurrentStreak(0);
        
        if (activeMode === ExtendedLearningMode.ECHO_RACE) {
            setMatchStatus('nomatch');
            setStatusMessage('Time Out!');
            setIncorrectCards(prev => {
                if (prev.find(c => c.id === currentCard?.id)) return prev;
                return [...prev, currentCard!];
            });
            setTimeout(() => {
                handleNext(false);
            }, 1500);
        } else {
            setMatchStatus('nomatch');
            setStatusMessage('Time Out!');
            setIsFlipped(true);
            setIncorrectCards(prev => {
                if (prev.find(c => c.id === currentCard?.id)) return prev;
                return [...prev, currentCard!];
            });
        }
    }, [getCurrentActiveMode, currentCard, handleNext]);

    const startCountdown = React.useCallback((limit: number) => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setTimeLeft(limit);
        
        timerIntervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null) return null;
                if (prev <= 0.1) {
                    clearInterval(timerIntervalRef.current!);
                    timerIntervalRef.current = null;
                    handleTimeout();
                    return 0;
                }
                return Math.round((prev - 0.1) * 10) / 10;
            });
        }, 100);
    }, [handleTimeout]);

    const startExtendedSession = (mode: ExtendedLearningMode) => {
        setLearningMode(mode);
        setQueue([...cards]);
        if (mode === ExtendedLearningMode.THE_CHAOS) {
            const modes = [
                ExtendedLearningMode.DISCOVERY,
                ExtendedLearningMode.PRECISION,
                ExtendedLearningMode.THE_SPRINT,
                ExtendedLearningMode.THE_REFLEX,
                ExtendedLearningMode.ECHO_RACE
            ];
            const rand = modes[Math.floor(Math.random() * modes.length)];
            setCurrentChaosMode(rand);
        } else {
            setCurrentChaosMode(null);
        }
        setCurrentCard(cards[0]);
        setKnownCount(0);
        setPhase('learning');
    };

    // --- Session Control Logic ---

    const saveSessionStats = () => {
        const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000);
        // Create activity block
        const activity: SessionActivity = {
            id: crypto.randomUUID(),
            type: 'study',
            deckId: deckId,
            deckName: 'Study Session', // Ideally passed or derived
            timestamp: Date.now(),
            durationSeconds: durationSeconds,
            stats: {
                correct: firstAttemptCorrect,
                incorrect: incorrectCards.length,
                score: Math.round((firstAttemptCorrect / Math.max(1, (firstAttemptCorrect + incorrectCards.length))) * 100)
            }
        };
        onSessionUpdate(activity);
        return activity;
    };

    const handleRestartSession = () => {
        if (confirm(t('studyMode.restartConfirm') || "Restart session? Current progress will be saved.")) {
            saveSessionStats();
            // Reset
            setQueue([...cards]);
            setCurrentCard(cards[0]);
            setKnownCount(0);
            setFirstAttemptCorrect(0);
            setIncorrectCards([]);
            setIsReviewingMissed(false);
            sessionStartTime.current = Date.now();
            hasAttemptedRef.current = false;
            setPhase('learning');
            setIsPaused(false);
        }
    };

    const handleEndSessionEarly = () => {
        if (confirm(t('studyMode.endSessionConfirm') || "End session now? Progress will be saved.")) {
            saveSessionStats();
            setPhase('finished');
        }
    };

    const handlePauseSession = () => {
        setIsPaused(true);
        setPauseTimeRemaining(300); // 5 minutes default
    };

    const handleResumeSession = () => {
        setIsPaused(false);
        if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
    };

    const handleExtendPause = (minutes: number) => {
        setPauseTimeRemaining(prev => prev + (minutes * 60));
    };

    // Pause Timer Effect
    useEffect(() => {
        if (isPaused) {
            pauseIntervalRef.current = setInterval(() => {
                setPauseTimeRemaining(prev => {
                    if (prev <= 1) {
                        // Timer expired
                        clearInterval(pauseIntervalRef.current as NodeJS.Timeout);
                        handleEndSessionEarly(); // Auto-end
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
        }
        return () => {
            if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
        };
    }, [isPaused]);

    // --- Helpers ---

    const handleReport = () => {
        if (!currentCard) return;
        const reason = window.prompt(t('studyMode.reportReason') || "Please describe the issue with this card:");
        if (reason) {
            onReport(currentCard.id, reason);
            alert(t('studyMode.reportThanks') || "Thank you! The card has been reported for review.");
        }
    };

    const generateOptions = (correctWord: Word, allCards: Word[], style: 'def-to-word' | 'word-to-def') => {
        const distractors = DistractorEngine.getDistractors(correctWord, allCards, 3);

        const options = [...distractors.map(w => style === 'word-to-def' ? w.definition : w.word),
        style === 'word-to-def' ? correctWord.definition : correctWord.word];

        return options.sort(() => Math.random() - 0.5);
    };

    // --- Voice Logic ---

    const startListening = React.useCallback(() => {
        if (recognitionRef.current) {
            setMatchStatus('none');
            // setTranscript('Listening...');
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.log("Mic activation msg:", e);
            }
        }
    }, []);

    const stopListening = React.useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    const playAudioHint = React.useCallback(() => {
        if (!currentCard) return;
        setStatusMessage(t('studyMode.listen'));
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(currentCard.word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utteranceRef.current = utterance;

        utterance.onend = () => {
            if (inputMode === 'voice') {
                setTimeout(() => {
                    setStatusMessage(t('studyMode.nowYouTry') || "Now you try...");
                    startListening();
                }, 500);
            }
        };

        window.speechSynthesis.speak(utterance);
    }, [currentCard, inputMode, startListening, t]);

    // --- Answer Checking Logic ---

    const checkAnswer = React.useCallback((input: string) => {
        if (!currentCard) return;
        stopCountdown();

        const activeMode = getCurrentActiveMode();
        let target = currentCard.word;

        if (activeMode === ExtendedLearningMode.PRECISION ||
            activeMode === ExtendedLearningMode.THE_SPRINT ||
            activeMode === ExtendedLearningMode.ECHO_RACE) {
            target = currentCard.definition;
        } else if (activeMode === ExtendedLearningMode.THE_REFLEX) {
            target = currentCard.word;
        } else if (activeMode === ExtendedLearningMode.DISCOVERY) {
            target = currentCard.word;
        }

        const cleanInput = input.trim().toLowerCase().replace(/[.,/#!$%^&*;:{ }=\-_`~()]/g, "");
        const cleanTarget = target.toLowerCase().replace(/[.,/#!$%^&*;:{ }=\-_`~()]/g, "");

        // Loose match
        const isMatch = cleanInput.includes(cleanTarget) || cleanTarget.includes(cleanInput);

        if (isMatch) {
            // Stats Tracking
            if (!hasAttemptedRef.current && !isReviewingMissed) {
                setFirstAttemptCorrect(prev => prev + 1);
            }
            hasAttemptedRef.current = true;

            setMatchStatus('match');
            setStatusMessage(t('studyMode.correct'));
            setSubMessage(t('studyMode.greatJob'));
            setIsFlipped(true);

            setTotalAttempts(prev => prev + 1);
            setCorrectAttempts(prev => prev + 1);
            setCurrentStreak(prev => {
                const newStreak = prev + 1;
                setBestStreak(b => Math.max(b, newStreak));
                return newStreak;
            });
        } else {
            // Stats Tracking
            if (!hasAttemptedRef.current && !isReviewingMissed) {
                setIncorrectCards(prev => {
                    if (prev.find(c => c.id === currentCard.id)) return prev;
                    return [...prev, currentCard];
                });
            }
            hasAttemptedRef.current = true;

            setMatchStatus('nomatch');
            setCurrentStreak(0); // Reset streak on error

            // Precision Mode: Zero-Error Reset Pool
            if (activeMode === ExtendedLearningMode.PRECISION) {
                setAttempts(0);
                setTotalAttempts(prev => prev + 1);
                setStatusMessage("Incorrect! Card returned to pool.");
                setIsFlipped(true);
                return;
            }

            // Echo Race Mode: error_lifecycle_action: "SKIP_CARD_LOG"
            if (activeMode === ExtendedLearningMode.ECHO_RACE) {
                setAttempts(0);
                setTotalAttempts(prev => prev + 1);
                setStatusMessage(t('studyMode.notQuite') || "Not quite!");
                setIsFlipped(true);
                setTimeout(() => {
                    handleNext(false);
                }, 1500);
                return;
            }

            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setTotalAttempts(prev => prev + 1); // Count wrong attempts too

            if (newAttempts < 3) {
                setStatusMessage(t('studyMode.tryAgain', { count: newAttempts }));
                if (inputMode === 'voice') {
                    if (recognitionRef.current) recognitionRef.current.stop();
                    setTimeout(() => startListening(), 1500);
                } else if (inputMode === 'manual_type') {
                    // Refocus input?
                    setTimeout(() => inputRef.current?.focus(), 100);
                }
            } else if (newAttempts === 3) {
                setStatusMessage(t('studyMode.listen'));
                setTimeout(() => playAudioHint(), 1000);
            } else {
                setStatusMessage(t('studyMode.notQuite'));
                setIsFlipped(true);
            }
        }
    }, [currentCard, attempts, playAudioHint, startListening, inputMode, currentQuestionType, isReviewingMissed, t, stopCountdown, getCurrentActiveMode, handleNext]);

    // --- Effects ---

    // Initialize Recognition
    useEffect(() => {
        if (('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && !recognitionRef.current) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';
        }
    }, []);

    // Bind Voice Handlers
    useEffect(() => {
        if (!recognitionRef.current) return;
        recognitionRef.current.onresult = (event: any) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript.toLowerCase().trim();
            checkAnswer(text);
        };
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
    }, [checkAnswer]);



    // Auto-start Logic per Card and Mode
    useEffect(() => {
        if (phase === 'learning' && currentCard && !isFlipped) {
            resetCardState(); // Ensure clean slate visually
            const activeMode = getCurrentActiveMode();

            // Dynamically set inputMode and question type
            if (activeMode === ExtendedLearningMode.DISCOVERY) {
                setInputMode('manual_self');
                setCurrentQuestionType('def-to-word');
                stopCountdown();
            } else if (activeMode === ExtendedLearningMode.PRECISION) {
                setInputMode('manual_type');
                setCurrentQuestionType('word-to-def');
                stopCountdown();
                setTimeout(() => inputRef.current?.focus(), 100);
            } else if (activeMode === ExtendedLearningMode.THE_SPRINT) {
                setInputMode('manual_choice');
                setCurrentQuestionType('word-to-def');
                setMultipleChoiceOptions(generateOptions(currentCard, cards, 'word-to-def'));
                startCountdown(3.0);
            } else if (activeMode === ExtendedLearningMode.THE_REFLEX) {
                setInputMode('voice');
                setCurrentQuestionType('def-to-word');
                setStatusMessage(t('studyMode.listening'));
                const timer = setTimeout(() => startListening(), 500);
                startCountdown(4.0);
                return () => {
                    clearTimeout(timer);
                    stopListening();
                    stopCountdown();
                };
            } else if (activeMode === ExtendedLearningMode.ECHO_RACE) {
                setInputMode('manual_choice');
                setCurrentQuestionType('def-to-word');
                playAudioForEchoRace(currentCard);
                const controller = new AudioModeLayoutController(currentCard, cards);
                const uiState = controller.executeAudioModeState();
                setMultipleChoiceOptions(uiState.choices_labels);
                startCountdown(uiState.active_countdown_limit);
            }
        } else {
            stopListening();
            stopCountdown();
        }
    }, [currentCard, phase, isFlipped, learningMode, currentChaosMode, cards, t, startListening, stopListening, startCountdown, stopCountdown, playAudioForEchoRace, getCurrentActiveMode]);



    // Session Timer Override
    const [sessionDelay, setSessionDelay] = useState(settings.autoAdvanceDelay || 2000);
    const [isAutoAdvanceEnabled, setIsAutoAdvanceEnabled] = useState(settings.autoAdvanceEnabled ?? true);

    // Auto-advance Timer
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isAutoAdvanceEnabled && matchStatus === 'match') {
            const delay = sessionDelay;
            timer = setTimeout(() => {
                handleNext(true);
            }, delay);
        }
        return () => clearTimeout(timer);
    }, [matchStatus, handleNext, settings.autoAdvanceDelay, isAutoAdvanceEnabled, sessionDelay]);

    const handleManualSelfCorrect = () => {
        stopCountdown();
        setMatchStatus('match');
        setStatusMessage(t('studyMode.correct'));
        setSubMessage(t('studyMode.greatJob'));
        // Stats update
        setTotalAttempts(prev => prev + 1);
        setCorrectAttempts(prev => prev + 1);
        setCurrentStreak(prev => {
            const newStreak = prev + 1;
            setBestStreak(b => Math.max(b, newStreak));
            return newStreak;
        });
    };

    const handleShuffle = () => {
        const shuffled = [...queue].sort(() => Math.random() - 0.5);
        setQueue(shuffled);
        if (shuffled.length > 0) setCurrentCard(shuffled[0]);
        resetCardState();
    };

    // Helper for layout with Skip Button
    const renderWithSkip = (content: React.ReactNode, maxWidthClass: string = "max-w-md") => {
        return (
            <div className={`relative w-full ${maxWidthClass} flex flex-col md:flex-row items-center justify-center gap-4`}>
                {/* Skip Button - Absolute Left on Desktop to preserve centering of content */}
                <div className="md:absolute md:right-[100%] md:mr-4 md:top-1/2 md:-translate-y-1/2">
                    <button
                        onClick={() => handleNext(false)}
                        className="p-3 md:p-4 rounded-full bg-secondary/80 backdrop-blur-sm border border-border hover:bg-secondary active:scale-95 text-foreground transition-all"
                        title={t('studyMode.skip')}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
                {content}
            </div>
        );
    };

    const renderInputArea = () => {
        if (inputMode === 'manual_self') {
            const content = (
                <button
                    onClick={matchStatus === 'match' ? () => handleNext(true) : handleManualSelfCorrect}
                    className={`flex-1 max-w-xs flex items-center justify-center gap-2 px-8 py-4 rounded-full shadow-lg transition-all active:scale-95 ${matchStatus === 'match'
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20'
                        : 'bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90'}`}
                >
                    {matchStatus === 'match' ? (
                        <>
                            <span className="font-semibold text-lg">{t('studyMode.nextCard')}</span>
                            <ChevronRight className="w-5 h-5" />
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            <span className="font-semibold text-lg">{t('studyMode.gotIt')}</span>
                        </>
                    )}
                </button>
            );
            return renderWithSkip(content, "max-w-xs");
        }

        if (inputMode === 'manual_type') {
            const content = (
                <div className="w-full flex flex-col gap-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (matchStatus !== 'match') checkAnswer(typedAnswer);
                            else handleNext(true);
                        }}
                        className="relative"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={typedAnswer}
                            onChange={(e) => setTypedAnswer(e.target.value)}
                            disabled={matchStatus === 'match' || isFlipped}
                            placeholder={t('studyMode.typeAnswerDesc')}
                            className={`w-full px-6 py-4 rounded-xl border-2 text-lg text-center outline-none transition-all
                                ${matchStatus === 'match' ? 'border-green-500 bg-green-50 text-green-700' :
                                    matchStatus === 'nomatch' ? 'border-red-300 bg-red-50' :
                                        'border-border focus:border-primary'}`}
                        />
                        <button
                            type="submit"
                            disabled={!typedAnswer}
                            className="absolute right-2 top-2 bottom-2 aspect-square rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </form>
                </div>
            );
            return renderWithSkip(content, "max-w-md");
        }

        if (inputMode === 'manual_choice') {
            const content = (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full [grid-auto-rows:1fr]">
                    {multipleChoiceOptions.map((option, idx) => {
                        const isSelected = selectedOption === option;
                        // Determine correct answer text based on current type
                        const correctText = currentQuestionType === 'word-to-def' ? currentCard?.definition : currentCard?.word;
                        const isCorrect = currentCard && option === correctText;

                        // "Game Over" means success or failure (card flipped)
                        const isGameOver = matchStatus === 'match' || isFlipped;

                        let btnClass = "bg-card hover:bg-secondary border-border";

                        if (isGameOver) {
                            if (isCorrect) btnClass = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-500/50";
                            else if (isSelected && !isCorrect) btnClass = "bg-red-100 border-red-300 text-red-800 opacity-60";
                            else btnClass = "opacity-50 grayscale";
                        } else if (matchStatus === 'nomatch' && isSelected) {
                            // Active retry state - only highlight the current wrong selection
                            btnClass = "bg-red-100 border-red-300 text-red-800";
                        } else if (isSelected) {
                            btnClass = "bg-primary text-primary-foreground border-primary";
                        }

                        const textSize = option.length > 70 ? "text-sm leading-tight" : "text-lg";

                        return (
                            <button
                                key={idx}
                                disabled={isGameOver}
                                onClick={() => {
                                    if (isGameOver) return;
                                    setSelectedOption(option);
                                    checkAnswer(option);
                                }}
                                className={`p-4 rounded-xl border-2 font-medium transition-all active:scale-95 flex items-center justify-center text-center h-full w-full ${textSize} ${btnClass}`}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            );
            return renderWithSkip(content, "max-w-2xl");
        }

        return null;
    };


    if (phase === 'setup') {
        return (
            <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="w-full flex justify-start mb-4">
                    <button onClick={onExit} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" />
                        {t('common.back')}
                    </button>
                </div>

                <div className="flex-grow w-full flex flex-col items-center justify-center">
                    <h2 className="text-3xl font-bold mb-2">{t('studyMode.readyToStudy') || 'Select Study Mode'}</h2>
                    <p className="text-muted-foreground mb-8 text-center">
                        {t('studyMode.cardsInDeck', { count: cards.length })}
                    </p>

                    <div data-dev-id="student-tiles-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12 animate-in slide-in-from-bottom-3 fade-in duration-500 delay-100">
                        {/* Tile 1: Discovery */}
                        <div
                            onClick={() => startExtendedSession(ExtendedLearningMode.DISCOVERY)}
                            className="bg-color2 hover:bg-color2/30 border border-color2/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color2-foreground text-left items-start w-full"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color2-foreground rounded-full blur-2xl group-hover:bg-color2 transition-colors opacity-10 group-hover:opacity-20"></div>
                            <div className="w-12 h-12 rounded-xl bg-color2-foreground/10 text-color2-foreground flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color2-foreground/20 shrink-0">
                                <MonitorPlay className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">Discovery Mode</h2>
                                <p className="text-sm opacity-80 line-clamp-2">Self-paced flashcard tap translation (Native to Target)</p>
                            </div>
                        </div>

                        {/* Tile 2: Precision */}
                        <div
                            onClick={() => startExtendedSession(ExtendedLearningMode.PRECISION)}
                            className="bg-color4 hover:bg-color4/30 border border-color4/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color4-foreground text-left items-start w-full"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color4-foreground rounded-full blur-2xl group-hover:bg-color4 transition-colors opacity-10 group-hover:opacity-20"></div>
                            <div className="w-12 h-12 rounded-xl bg-color4-foreground/10 text-color4-foreground flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color4-foreground/20 shrink-0">
                                <Type className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">Precision Mode</h2>
                                <p className="text-sm opacity-80 line-clamp-2">Strict zero-error typing reset pool (Target to Native)</p>
                            </div>
                        </div>

                        {/* Tile 3: The Sprint */}
                        <div
                            onClick={() => startExtendedSession(ExtendedLearningMode.THE_SPRINT)}
                            className="bg-color5 hover:bg-color5/30 border border-color5/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color5-foreground text-left items-start w-full"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color5-foreground rounded-full blur-2xl group-hover:bg-color5 transition-colors opacity-10 group-hover:opacity-20"></div>
                            <div className="w-12 h-12 rounded-xl bg-color5-foreground/10 text-color5-foreground flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color5-foreground/20 shrink-0">
                                <Timer className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">The Sprint</h2>
                                <p className="text-sm opacity-80 line-clamp-2">3.0s timed multiple choice selection (Target to Native)</p>
                            </div>
                        </div>

                        {/* Tile 4: The Reflex */}
                        <div
                            onClick={() => startExtendedSession(ExtendedLearningMode.THE_REFLEX)}
                            className="bg-color3 hover:bg-color3/30 border border-color3/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color3-foreground text-left items-start w-full"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color3-foreground rounded-full blur-2xl group-hover:bg-color3 transition-colors opacity-10 group-hover:opacity-20"></div>
                            <div className="w-12 h-12 rounded-xl bg-color3-foreground/10 text-color3-foreground flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color3-foreground/20 shrink-0">
                                <Mic className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">The Reflex</h2>
                                <p className="text-sm opacity-80 line-clamp-2">4.0s reversal audio production or self-report (Native to Target)</p>
                            </div>
                        </div>

                        {/* Tile 5: Echo Race */}
                        <div
                            onClick={() => startExtendedSession(ExtendedLearningMode.ECHO_RACE)}
                            className="bg-color2 hover:bg-color2/30 border border-color2/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color2-foreground text-left items-start w-full"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color2-foreground rounded-full blur-2xl group-hover:bg-color2 transition-colors opacity-10 group-hover:opacity-20"></div>
                            <div className="w-12 h-12 rounded-xl bg-color2-foreground/10 text-color2-foreground flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color2-foreground/20 shrink-0">
                                <Flame className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">Echo Race</h2>
                                <p className="text-sm opacity-80 line-clamp-2">2.0s auditory match with hidden text prompt (Audio to Native)</p>
                            </div>
                        </div>

                        {/* Tile 6: The Chaos */}
                        <div
                            onClick={() => startExtendedSession(ExtendedLearningMode.THE_CHAOS)}
                            className="bg-color4 hover:bg-color4/30 border border-color4/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color4-foreground text-left items-start w-full"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color4-foreground rounded-full blur-2xl group-hover:bg-color4 transition-colors opacity-10 group-hover:opacity-20"></div>
                            <div className="w-12 h-12 rounded-xl bg-color4-foreground/10 text-color4-foreground flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color4-foreground/20 shrink-0">
                                <Shuffle className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">The Chaos</h2>
                                <p className="text-sm opacity-80 line-clamp-2">Interleaved variable context jitter matrix (Random mixture of all modes)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'finished') {
        const accuracy = Math.round((firstAttemptCorrect / (isReviewingMissed ? queue.length : cards.length)) * 100) || 0;

        // Calculate Duration
        const durationMs = Date.now() - sessionStartTime.current;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Calculate Best Score from History
        const previousBest = learningHistory
            .filter(s => s.activities.some(a => a.deckId === deckId))
            .reduce((max, session) => {
                const deckActivity = session.activities.find(a => a.deckId === deckId);
                if (!deckActivity) return max;
                const acc = (deckActivity.stats.correct / (deckActivity.stats.correct + deckActivity.stats.incorrect)) * 100;
                return Math.max(max, acc);
            }, 0);

        const isNewRecord = accuracy > previousBest && !isReviewingMissed;

        return (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center p-6 animate-in slide-in-from-bottom-5 w-full">

                <div className="mb-8 relative">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4 mx-auto relative z-10">
                        {isNewRecord ? <Trophy className="w-12 h-12 text-yellow-500" /> : <Check className="w-12 h-12" />}
                    </div>
                    {isNewRecord && (
                        <div className="absolute -top-4 -right-12 rotate-12 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                            {t('studyMode.newBest')}
                        </div>
                    )}
                    <h2 className="text-4xl font-bold mb-2">{t('studyMode.sessionComplete')}</h2>
                    <p className="text-muted-foreground">
                        {isReviewingMissed ? t('studyMode.reviewPassed') : t('studyMode.greatJob')}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full mb-8">
                    <div className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2">
                        <Target className="w-6 h-6 text-blue-500" />
                        <div className="text-2xl font-bold">{accuracy}%</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('studyMode.accuracy')}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2">
                        <Timer className="w-6 h-6 text-orange-500" />
                        <div className="text-2xl font-bold">{timeString}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('studyMode.time')}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <div className="text-2xl font-bold">{Math.round(Math.max(previousBest, accuracy))}%</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('studyMode.best')}</div>
                    </div>
                </div>

                {incorrectCards.length > 0 && !isReviewingMissed && (
                    <div className="w-full mb-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
                        <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">{t('studyMode.needsImprovement')}</h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{t('studyMode.missedCount', { count: incorrectCards.length })}</p>
                        <button
                            onClick={() => {
                                setQueue([...incorrectCards]);
                                setCurrentCard(incorrectCards[0]);
                                setKnownCount(0);
                                setIsReviewingMissed(true);
                                setPhase('learning');
                                hasAttemptedRef.current = false;
                            }}
                            className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {t('studyMode.reviewMissed') || "Review Missed Cards"}
                        </button>
                    </div>
                )}

                <div className="flex gap-4 w-full justify-center">
                    <button onClick={onExit} className="px-8 py-3 rounded-xl bg-secondary hover:bg-secondary/80 font-medium min-w-[120px]">
                        {t('common.exit')}
                    </button>
                    <button
                        onClick={() => {
                            setQueue([...cards]);
                            setCurrentCard(cards[0]);
                            setKnownCount(0);
                            setFirstAttemptCorrect(0);
                            setIncorrectCards([]);
                            setIsReviewingMissed(false);
                            sessionStartTime.current = Date.now();
                            setPhase('learning');
                            hasAttemptedRef.current = false;
                        }}
                        className="px-8 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium flex items-center gap-2 min-w-[150px] justify-center"
                    >
                        <RotateCcw className="w-4 h-4" />
                        {t('studyMode.startOver') || "Start Over"}
                    </button>
                </div>
            </div>
        );
    }

    if (!currentCard) return null;

    // --- Render ---

    return (
        <div className="flex flex-col h-[calc(100vh-5.5rem)] bg-background relative py-6 px-4">
            {/* Pause Overlay */}
            {isPaused && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold">{t('studyMode.paused')}</h2>
                            <p className="text-muted-foreground">{t('studyMode.pausedDesc')}</p>
                            <p className="text-xs text-muted-foreground/60 max-w-[280px] mx-auto leading-relaxed">
                                {t('studyMode.pausedWarning')}
                            </p>
                        </div>

                        <div className="text-6xl font-mono font-bold tracking-wider text-primary tabular-nums">
                            {Math.floor(pauseTimeRemaining / 60)}:{(pauseTimeRemaining % 60).toString().padStart(2, '0')}
                        </div>

                        <button
                            onClick={handleResumeSession}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 flex items-center justify-center gap-2 transition-all"
                        >
                            <Play className="w-6 h-6 fill-current" />
                            {t('studyMode.resume')}
                        </button>

                        <div className="space-y-3 pt-4 border-t border-border">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('studyMode.extendPause')}</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleExtendPause(5)} className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-sm transition-colors">+5m</button>
                                <button onClick={() => handleExtendPause(10)} className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-sm transition-colors">+10m</button>
                                <button onClick={() => handleExtendPause(15)} className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-sm transition-colors">+15m</button>
                            </div>
                            <button
                                onClick={() => {
                                    const m = prompt(t('studyMode.enterMinutes') || "Enter minutes to extend:");
                                    if (m && !isNaN(parseInt(m))) handleExtendPause(parseInt(m));
                                }}
                                className="w-full p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
                            >
                                {t('studyMode.customTime')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-start justify-center w-full h-full gap-4 relative">

                {/* Left Column: Flashcard & Controls */}
                <div className="flex flex-col items-center w-full max-w-2xl flex-1 justify-between h-full">
                    {/* Header removed */}

                    {/* Main Card Area */}
                    <div className="w-full flex-grow flex flex-col items-center justify-center my-6 relative group-card">


                        {/* Auto-Advance Timer Control (Floating Left - Lower) */}
                        <div className="absolute left-0 xl:-left-12 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-2 shadow-sm hover:shadow-md hover:bg-card hover:border-border transition-all group">
                            {/* Box Label */}
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center leading-tight">
                                {isAutoAdvanceEnabled ? (
                                    <>Auto<br />Advance</>
                                ) : (
                                    <>Manual<br />Advance</>
                                )}
                            </div>

                            {/* Toggle Switch */}
                            <button
                                onClick={() => setIsAutoAdvanceEnabled(!isAutoAdvanceEnabled)}
                                className={`w-8 h-4 rounded-full transition-colors mb-2 relative ${isAutoAdvanceEnabled ? 'bg-primary' : 'bg-muted'}`}
                                title={isAutoAdvanceEnabled ? t('studyMode.disableAutoAdvance') : t('studyMode.enableAutoAdvance')}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isAutoAdvanceEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                            </button>

                            {/* Tooltip */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-52 bg-popover text-popover-foreground text-sm p-3 rounded-xl border border-border shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none -translate-x-2 group-hover:translate-x-0 z-50">
                                <p className="font-semibold mb-1 flex items-center gap-2">
                                    <Timer className="w-4 h-4 text-primary" />
                                    {isAutoAdvanceEnabled ? t('studyMode.autoAdvanceOn') : t('studyMode.autoAdvanceOff')}
                                </p>
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                    {isAutoAdvanceEnabled
                                        ? t('studyMode.autoAdvanceDesc', { seconds: sessionDelay / 1000 })
                                        : t('studyMode.manualAdvanceDesc')
                                    }
                                </p>
                            </div>

                            {/* Controls (Only visible if enabled) */}
                            <div className={`flex flex-col items-center transition-all duration-300 ${isAutoAdvanceEnabled ? 'opacity-100 max-h-40' : 'opacity-30 max-h-40 grayscale pointer-events-none'}`}>
                                <button
                                    onClick={() => setSessionDelay(prev => prev + 500)}
                                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                    title="Increase Delay (+0.5s)"
                                >
                                    <ChevronUp className="w-5 h-5" />
                                </button>

                                <div className="relative my-1 flex items-center justify-center gap-0.5">
                                    {/* Invisible spacer to balance the 's' label and keep number centered */}
                                    <span className="text-xl font-medium invisible">s</span>
                                    <input
                                        type="number"
                                        min="0.5"
                                        step="0.5"
                                        value={sessionDelay / 1000}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val) && val >= 0.5) setSessionDelay(val * 1000);
                                        }}
                                        className="w-10 bg-transparent text-center font-bold text-xl outline-none appearance-none [&::-webkit-inner-spin-button]:hidden p-0"
                                        title={t('studyMode.delaySeconds')}
                                    />
                                    <span className="text-xl font-medium text-muted-foreground">s</span>
                                </div>

                                <button
                                    onClick={() => setSessionDelay(prev => Math.max(500, prev - 500))}
                                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                    title="Decrease Delay (-0.5s)"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mt-2 pt-2 border-t border-border/50 w-full flex flex-col items-center gap-1">
                                <button
                                    onClick={() => {
                                        onSaveSettings({
                                            ...settings,
                                            autoAdvanceDelay: sessionDelay,
                                            autoAdvanceEnabled: isAutoAdvanceEnabled
                                        });
                                        // Optional: Show a small confirmation or toast?
                                        // For now, simple click.
                                    }}
                                    className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                                    title={t('studyMode.saveDefault') || "Save Default"}
                                >
                                    {t('studyMode.save')}
                                </button>
                                <Timer className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </div>



                        <Flashcard
                            word={currentCard}
                            isFlipped={isFlipped}
                            onFlip={() => { if (getCurrentActiveMode() === ExtendedLearningMode.DISCOVERY || matchStatus === 'match' || attempts >= 3) setIsFlipped(!isFlipped) }}
                            settings={settings}
                            overrideFront={getCurrentActiveMode() === ExtendedLearningMode.ECHO_RACE ? "[🔊 AUDIO INCOMING]" : (getCurrentActiveMode() === ExtendedLearningMode.DISCOVERY || getCurrentActiveMode() === ExtendedLearningMode.THE_REFLEX ? currentCard.definition : undefined)}
                            overrideBack={getCurrentActiveMode() === ExtendedLearningMode.ECHO_RACE ? currentCard.definition : (getCurrentActiveMode() === ExtendedLearningMode.DISCOVERY || getCurrentActiveMode() === ExtendedLearningMode.THE_REFLEX ? currentCard.word : undefined)}
                            hideFlipHint={getCurrentActiveMode() === ExtendedLearningMode.THE_SPRINT || getCurrentActiveMode() === ExtendedLearningMode.ECHO_RACE}
                            blurFrontText={getCurrentActiveMode() === ExtendedLearningMode.ECHO_RACE}
                            overlayHeader={
                                <>
                                    {/* Top Left: Counter */}
                                    <div className="bg-black/20 backdrop-blur-md text-white/90 text-xs font-bold px-3 py-1.5 rounded-full pointer-events-auto transition-opacity duration-300">
                                        {knownCount + 1} / {queue.length + knownCount}
                                    </div>

                                    {/* Center: Feedback Overlay */}
                                    <div className="flex-1 flex justify-center mx-2 pointer-events-none relative z-50">
                                        {(matchStatus !== 'none' || timeLeft !== null || (inputMode === 'voice' && !isFlipped) || (inputMode === 'manual_type' && matchStatus !== 'none')) && (
                                            <div className={`pointer-events-auto p-1.5 px-4 rounded-full shadow-lg backdrop-blur-md border transition-all duration-300 animate-in fade-in zoom-in
                                                ${matchStatus === 'match' ? 'bg-green-100/90 dark:bg-green-900/40 border-green-500/30' :
                                                    matchStatus === 'nomatch' ? 'bg-yellow-100/90 dark:bg-yellow-900/40 border-yellow-500/30' :
                                                        'bg-secondary/80 border-border/50'}`}>

                                                <div className="flex items-center gap-2 justify-center text-center">
                                                    {inputMode === 'voice' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startListening(); }}
                                                            disabled={isListening || matchStatus === 'match'}
                                                            className={`p-1 rounded-full transition-all active:scale-95 flex-shrink-0 ${matchStatus === 'match' ? 'bg-green-100 text-green-600' : matchStatus === 'nomatch' ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'}`}
                                                        >
                                                            {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4 opacity-50" />}
                                                        </button>
                                                    )}
                                                    <div>
                                                        <h3 className={`text-sm font-bold whitespace-nowrap ${matchStatus === 'match' ? 'text-green-800 dark:text-green-300' : matchStatus === 'nomatch' ? 'text-yellow-800 dark:text-yellow-300' : 'text-foreground'}`}>
                                                            {statusMessage || (timeLeft !== null ? `⏱️ Time Left: ${timeLeft.toFixed(1)}s` : (inputMode === 'voice' ? (isListening ? t('studyMode.listening') : t('studyMode.tapToSpeak')) : ""))}
                                                        </h3>
                                                        {subMessage && <p className={`text-[10px] font-bold ${matchStatus === 'match' ? 'text-green-700 dark:text-green-400' : 'opacity-80'}`}>{subMessage}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Top Right: Actions */}
                                    <div className="flex items-center gap-2 pointer-events-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                                            className={`p-2 rounded-full backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500/80 text-white hover:bg-red-600' : 'bg-black/20 text-white/70 hover:bg-black/30 hover:text-white'}`}
                                            title={isFavorite ? t('studyMode.removeFromFavorites') : t('studyMode.addToFavorites')}
                                        >
                                            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                                        </button>

                                        {currentCard && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onMarkForReview(currentCard.id.toString()); }}
                                                className={`p-2 rounded-full backdrop-blur-md transition-all ${currentCard.markedForReview ? 'bg-amber-500/80 text-white hover:bg-amber-600' : 'bg-black/20 text-white/70 hover:bg-black/30 hover:text-white'}`}
                                                title={currentCard.markedForReview ? t('studyMode.unmarkForReview') : t('studyMode.markForReview')}
                                            >
                                                <Bookmark className={`w-4 h-4 ${currentCard.markedForReview ? "fill-current" : ""}`} />
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReport(); }}
                                            className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white/70 hover:text-amber-400 hover:bg-black/30 transition-all"
                                            title={t('studyMode.reportIssue')}
                                        >
                                            <Flag className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            }
                        />
                    </div>

                    {/* Bottom Controls / Input Area */}
                    <div className="relative flex flex-col items-center justify-center w-full min-h-[0px] mt-2 mb-4 gap-6">
                        <div className="flex-1 flex justify-center w-full">
                            {renderInputArea()}
                        </div>

                        {/* Session Controls (Large Buttons) */}
                        <div className="grid grid-cols-4 gap-6 w-full max-w-lg px-4">
                            <button
                                onClick={handleRestartSession}
                                className="flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-all border border-border/50 hover:border-primary/20"
                                title={t('studyMode.restartSession')}
                            >
                                <RotateCcw className="w-5 h-5 mb-1" />
                                <span className="text-xs font-semibold uppercase tracking-wide">{t('studyMode.restart')}</span>
                            </button>

                            <button
                                onClick={handlePauseSession}
                                className="flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-all border border-border/50 hover:border-primary/20"
                                title={t('studyMode.pauseSession')}
                            >
                                <Pause className="w-5 h-5 mb-1" />
                                <span className="text-xs font-semibold uppercase tracking-wide">{t('studyMode.pause')}</span>
                            </button>

                            <button
                                onClick={handleEndSessionEarly}
                                className="flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-destructive transition-all border border-transparent hover:border-destructive/20"
                                title={t('studyMode.endSession')}
                            >
                                <XCircle className="w-5 h-5 mb-1" />
                                <span className="text-xs font-semibold uppercase tracking-wide">{t('studyMode.end')}</span>
                            </button>

                            <button
                                onClick={handleShuffle}
                                className="flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-all border border-border/50 hover:border-primary/20"
                                title={t('studyMode.shuffleRemaining')}
                            >
                                <Shuffle className="w-5 h-5 mb-1" />
                                <span className="text-xs font-semibold uppercase tracking-wide">{t('studyMode.shuffle')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats (Unchanged) */}
                <div className="hidden md:flex flex-col w-64 shrink-0 gap-6 sticky top-8">
                    {/* Session Progress */}
                    <div className="p-5 rounded-2xl bg-primary border border-primary/80 shadow-lg backdrop-blur-md">
                        <h3 className="text-sm font-bold text-primary-foreground uppercase tracking-wider mb-4">{t('studyMode.sessionProgress')}</h3>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-semibold text-primary-foreground/90">{t('studyMode.mastered')}</span>
                                <span className="font-bold text-primary-foreground">{knownCount}</span>
                            </div>
                            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-black/10">
                                <div className="h-full bg-white/90 transition-all duration-500" style={{ width: `${(knownCount / cards.length) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Gamification Stats */}
                    <div className="p-5 rounded-2xl bg-secondary border border-secondary/80 shadow-lg backdrop-blur-md">
                        <h3 className="text-sm font-bold text-secondary-foreground uppercase tracking-wider mb-4">{t('studyMode.stats')}</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/50 text-secondary-foreground/80 shadow-sm border border-black/5">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-secondary-foreground/60 font-bold uppercase">{t('studyMode.accuracy')}</p>
                                    <p className="text-xl font-black text-secondary-foreground">{Math.round((correctAttempts / (totalAttempts || 1)) * 100)}%</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-white/50 shadow-sm border border-black/5 ${currentStreak > 2 ? 'text-orange-700 animate-pulse' : 'text-secondary-foreground/80'}`}>
                                    <Flame className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-secondary-foreground/60 font-bold uppercase">{t('studyMode.streak')}</p>
                                    <p className="text-xl font-black text-secondary-foreground">{currentStreak}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/50 text-secondary-foreground/80 shadow-sm border border-black/5">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-secondary-foreground/60 font-bold uppercase">{t('studyMode.bestStreak')}</p>
                                    <p className="text-xl font-black text-secondary-foreground">{bestStreak}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudyMode;
