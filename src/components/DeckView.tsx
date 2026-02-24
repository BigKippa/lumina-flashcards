import React, { useState } from 'react';
import { Word } from '../data/vocabulary';
import { BookOpen, BrainCircuit, X, Clock, Heart } from 'lucide-react';


interface DeckViewProps {
    cards: Word[];
    title?: string;
    onStartStudy: () => void;
    onStartQuiz: (style?: 'def-to-word' | 'word-to-def' | 'mix') => void;
    onStartTimedMode: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onBack: () => void;
}

const DeckView: React.FC<DeckViewProps> = ({ cards: _cards, title, onStartStudy, onStartQuiz, onStartTimedMode, isFavorite, onToggleFavorite, onBack }) => {
    const [isQuizOptionsOpen, setIsQuizOptionsOpen] = useState(false);

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-6 animate-in fade-in duration-700">

            {/* Header Section */}
            <div className="relative w-full flex flex-col md:flex-row items-center justify-center mb-8">
                <div className="w-full md:w-auto md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 z-10 mb-4 md:mb-0 flex justify-start md:block">
                    <button
                        onClick={onBack}
                        className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
                    >
                        &larr; Back to Topics
                    </button>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-foreground">
                            {title || "Study Session"}
                        </h1>
                        <button
                            onClick={onToggleFavorite}
                            className={`p-2 rounded-full transition-all ${isFavorite ? 'text-red-500 bg-red-100 hover:bg-red-200' : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'}`}
                            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                        >
                            <Heart className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`} />
                        </button>
                    </div>
                    <p className="text-foreground/80 text-lg max-w-md mx-auto font-medium">
                        Elevate your vocabulary with our curated collection of beautiful words.
                    </p>
                </div>
            </div>

            {/* Deck Card */}
            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-in slide-in-from-bottom-3 fade-in duration-500 delay-100">
                <button
                    onClick={onStartStudy}
                    className="flex flex-col items-center justify-center p-6 bg-card hover:bg-secondary/20 border border-border rounded-xl shadow-sm hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                        <BookOpen className="w-6 h-6 text-primary group-hover:text-white" />
                    </div>
                    <span className="font-semibold text-lg">Study Mode</span>
                    <span className="text-sm text-muted-foreground">Standard flashcards</span>
                </button>

                <button
                    onClick={() => setIsQuizOptionsOpen(true)}
                    className="group relative overflow-hidden rounded-3xl bg-muted border border-muted/80 hover:border-muted-foreground/30 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-muted/20"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="p-8 flex flex-col h-full relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 text-white group-hover:bg-white/30 transition-colors duration-300">
                            <BrainCircuit className="w-7 h-7" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">Quiz Challenge</h3>
                        <p className="text-white/90 mb-8 flex-grow">
                            Test your knowledge with multiple choice questions.
                        </p>

                        <div className="flex items-center text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                            <span>Endless</span>
                            <span className="mx-2">•</span>
                            <span>Multiple Choice</span>
                        </div>
                    </div>
                </button>

                {/* Quiz Style Modal */}
                {isQuizOptionsOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsQuizOptionsOpen(false)}>
                        <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setIsQuizOptionsOpen(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Choose Quiz Style</h2>

                            <div className="space-y-4">
                                <button
                                    onClick={() => onStartQuiz('def-to-word')}
                                    className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all flex items-center gap-4 group"
                                >
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-lg">Match Word to Definition</h3>
                                        <p className="text-sm text-muted-foreground">See definition, choose the word.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => onStartQuiz('word-to-def')}
                                    className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all flex items-center gap-4 group"
                                >
                                    <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:scale-110 transition-transform">
                                        <BrainCircuit className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-lg">Match Definition to Word</h3>
                                        <p className="text-sm text-muted-foreground">See word, choose the definition.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => onStartQuiz('mix')}
                                    className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all flex items-center gap-4 group"
                                >
                                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                                        <BrainCircuit className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-lg">Mixed Mode</h3>
                                        <p className="text-sm text-muted-foreground">Randomly switch between both styles.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={onStartTimedMode}
                    className="flex flex-col items-center justify-center p-6 bg-card hover:bg-secondary/20 border border-border rounded-xl shadow-sm hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-3 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400 group-hover:text-white" />
                    </div>
                    <span className="font-semibold text-lg">Timed Mode</span>
                    <span className="text-sm text-muted-foreground">Speed & Accuracy</span>
                </button>
            </div>

            <footer className="mt-16 text-muted-foreground/40 text-sm">
                v1.1.0 • Built with React & Tailwind
            </footer>
        </div >
    );
};

export default DeckView;
