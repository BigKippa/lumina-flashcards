import React, { useState } from 'react';
import { Word } from '../data/vocabulary';
import { BookOpen, BrainCircuit, X, Clock, Heart, Info } from 'lucide-react';
import { InfoModal } from './InfoModal';
import { Deck } from '../types';

interface DeckViewProps {
    cards: Word[];
    title?: string;
    onStartStudy: () => void;
    onStartQuiz: (style?: 'def-to-word' | 'word-to-def' | 'mix') => void;
    onStartTimedMode: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onBack: () => void;
    deck?: Deck;
}

const DeckView: React.FC<DeckViewProps> = ({ cards: _cards, title, onStartStudy, onStartQuiz, onStartTimedMode, isFavorite, onToggleFavorite, onBack, deck }) => {
    const [isQuizOptionsOpen, setIsQuizOptionsOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

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
                        <button
                            onClick={() => setShowInfo(true)}
                            className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-primary transition-all"
                            title="View Deck Info"
                        >
                            <Info className="w-6 h-6" />
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
                    className="flex flex-col items-center justify-center p-6 border rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden bg-t-green hover:bg-t-green/30 border-t-green/20 text-color1 lumina-glow hover-glow-t-green"
                >
                    <div className="w-12 h-12 rounded-xl bg-color1 text-t-green flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-lg relative z-10">Study Mode</span>
                    <span className="text-sm text-color1/80 relative z-10">Standard flashcards</span>
                </button>

                <button
                    onClick={() => setIsQuizOptionsOpen(true)}
                    className="group relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-t-blue hover:bg-t-blue/30 border-t-blue/20 text-color1 lumina-glow hover-glow-t-blue shadow-lg"
                >
                    <div className="p-8 flex flex-col h-full relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-color1 text-t-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                            <BrainCircuit className="w-7 h-7" />
                        </div>

                        <h3 className="text-2xl font-bold mb-2">Quiz Challenge</h3>
                        <p className="text-color1/90 mb-8 flex-grow">
                            Test your knowledge with multiple choice questions.
                        </p>

                        <div className="flex items-center text-sm font-medium text-color1/80 transition-colors">
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
                    className="flex flex-col items-center justify-center p-6 border rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden bg-t-sand hover:bg-t-sand/30 border-t-sand/20 text-color1 lumina-glow hover-glow-t-sand"
                >
                    <div className="w-12 h-12 rounded-xl bg-color1 text-t-sand flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-lg relative z-10">Timed Mode</span>
                    <span className="text-sm text-color1/80 relative z-10">Speed & Accuracy</span>
                </button>
            </div>

            <footer className="mt-16 text-muted-foreground/40 text-sm">
                v1.1.0 • Built with React & Tailwind
            </footer>

            {deck && (
                <InfoModal 
                    isOpen={showInfo} 
                    onClose={() => setShowInfo(false)} 
                    title={deck.title} 
                    creatorUsername={deck.creatorUsername} 
                    createdAt={deck.createdAt} 
                    viewCount={deck.viewCount} 
                    downloadCount={deck.downloadCount} 
                    languageCategory={deck.languageCategory} 
                />
            )}
            {!deck && (
                <InfoModal 
                    isOpen={showInfo} 
                    onClose={() => setShowInfo(false)} 
                    title={title || 'Study Session'} 
                />
            )}
        </div >
    );
};

export default DeckView;
