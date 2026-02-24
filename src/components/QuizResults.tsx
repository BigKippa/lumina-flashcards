import { QuizResult } from '../types';
import { Trophy, ArrowLeft, RotateCcw } from 'lucide-react';

interface QuizResultsProps {
    result: QuizResult;
    onHome: () => void;
    onRetry: () => void;
}

export function QuizResults({ result, onHome, onRetry }: QuizResultsProps) {
    const percentage = Math.round((result.correct / result.total) * 100);

    let message = "Good Start!";
    if (percentage === 100) message = "Perfect Score!";
    else if (percentage >= 80) message = "Excellent Work!";
    else if (percentage >= 50) message = "Good Effort!";

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in duration-500">
            <div className="bg-card p-8 rounded-full mb-8 backdrop-blur-sm shadow-2xl shadow-accent/20 border border-border">
                <Trophy className="w-16 h-16 text-accent" />
            </div>

            <h2 className="text-4xl font-bold text-foreground mb-2">{message}</h2>
            <p className="text-muted-foreground mb-8 text-lg">
                You got <span className="text-primary font-bold">{result.correct}</span> out of <span className="text-primary font-bold">{result.total}</span> correct.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <button
                    onClick={onHome}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground font-semibold transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Home</span>
                </button>
                <button
                    onClick={onRetry}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <RotateCcw className="w-5 h-5" />
                    <span>Retry</span>
                </button>
            </div>
        </div>
    );
}
