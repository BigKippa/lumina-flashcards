import React, { useState, useMemo } from 'react';
import { Word } from '../data/vocabulary';
import { CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';

interface QuizResult {
    total: number;
    correct: number;
    incorrect: number;
}

interface QuizModeProps {
    cards: Word[];
    onExit: () => void;
    onComplete: (result: QuizResult) => void;
    quizStyle: 'def-to-word' | 'word-to-def' | 'mix';
}

const QuizMode: React.FC<QuizModeProps> = ({ cards, onExit, onComplete, quizStyle }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);

    const currentCard = cards[currentIndex];

    // Determine question type for this specific card
    const questionType = useMemo(() => {
        if (quizStyle === 'mix') {
            return Math.random() > 0.5 ? 'def-to-word' : 'word-to-def';
        }
        return quizStyle;
    }, [currentIndex, quizStyle]); // Re-roll for each card if mix


    // Generate options (1 correct + 3 random distractors)
    const options = useMemo(() => {
        if (!currentCard) return [];

        // Filter out current card
        const otherCards = cards.filter(c => c.id !== currentCard.id);

        // Shuffle and pick 3
        const distractors = otherCards
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(c => ({
                id: c.id,
                text: questionType === 'word-to-def' ? c.definition : c.word, // Option text depends on type
                isCorrect: false
            }));

        // Add correct answer
        const correct = {
            id: currentCard.id,
            text: questionType === 'word-to-def' ? currentCard.definition : currentCard.word,
            isCorrect: true
        };

        // Combine and shuffle
        return [...distractors, correct].sort(() => 0.5 - Math.random());
    }, [currentCard, cards, questionType]);

    const handleSelect = (index: number, isCorrect: boolean) => {
        if (selectedOption !== null) return; // Prevent changing answer

        setSelectedOption(index);
        const newScore = isCorrect ? score + 1 : score;
        if (isCorrect) setScore(newScore);

        // Auto-advance after small delay
        setTimeout(() => {
            if (currentIndex < cards.length - 1) {
                setSelectedOption(null);
                setCurrentIndex(prev => prev + 1);
            } else {
                // Determine final stats
                onComplete({
                    total: cards.length,
                    correct: newScore,
                    incorrect: cards.length - newScore
                });
            }
        }, 2000);
    };

    // removed internal completion screen to delegate to parent

    const questionText = questionType === 'word-to-def' ? currentCard.word : currentCard.definition;
    const promptText = questionType === 'word-to-def' ? "Select the correct definition" : "Select the correct word";

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-6">
            <div className="w-full flex justify-between items-center mb-8">
                <button
                    onClick={onExit}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Deck
                </button>
                <span className="text-muted-foreground/60 font-mono text-sm">
                    {currentIndex + 1} / {cards.length}
                </span>
            </div>

            <div className="w-full mb-8">
                <div className="bg-muted backdrop-blur-md rounded-2xl p-8 border border-muted/80 text-center shadow-lg">
                    <h2 className="text-3xl font-bold text-muted-foreground mb-2">{questionText}</h2>
                    <p className="text-muted-foreground/80">{promptText}</p>
                </div>
            </div>

            <div className="w-full grid gap-4">
                {options.map((option, idx) => {
                    let statusStyle = "bg-white/50 border-input text-foreground hover:bg-white/80"; // Default
                    if (selectedOption !== null) {
                        if (option.isCorrect) statusStyle = "bg-green-500/10 border-green-500 text-green-700";
                        else if (selectedOption === idx) statusStyle = "bg-red-500/10 border-red-500 text-red-700";
                        else statusStyle = "opacity-50";
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelect(idx, option.isCorrect)}
                            disabled={selectedOption !== null}
                            className={`p-4 rounded-xl border text-left transition-all duration-200 transform ${statusStyle} ${selectedOption === null ? "active:scale-98" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span>{option.text}</span>
                                {selectedOption !== null && option.isCorrect && <CheckCircle2 className="text-green-600 w-5 h-5 flex-shrink-0 ml-2" />}
                                {selectedOption === idx && !option.isCorrect && <XCircle className="text-red-500 w-5 h-5 flex-shrink-0 ml-2" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuizMode;
