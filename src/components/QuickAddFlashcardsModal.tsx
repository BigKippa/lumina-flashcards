import React, { useState, useRef, useEffect } from 'react';
import { Word } from '../data/vocabulary';
import { Student } from '../types';
import { X, ArrowRight, CheckCircle, Users, Globe, UserPlus, User } from 'lucide-react';

interface QuickAddFlashcardsModalProps {
    onClose: () => void;
    onComplete: (cards: Word[], audience: string, specificStudentId?: string) => void;
    students: Student[];
    initialAudience?: string;
    initialSpecificStudentId?: string;
}

export const QuickAddFlashcardsModal: React.FC<QuickAddFlashcardsModalProps> = ({ onClose, onComplete, students, initialAudience, initialSpecificStudentId }) => {
    const [step, setStep] = useState<1 | 2>(1);
    
    // Step 1 State
    const [audience, setAudience] = useState<string>(initialAudience || '');
    const [specificStudentId, setSpecificStudentId] = useState<string>(initialSpecificStudentId || '');
    
    // Step 2 State
    const [cards, setCards] = useState<Word[]>([]);
    const [currentWord, setCurrentWord] = useState('');
    const [currentCategory, setCurrentCategory] = useState('Noun');
    const [currentDefinition, setCurrentDefinition] = useState('');
    const [currentExample, setCurrentExample] = useState('');
    
    const wordInputRef = useRef<HTMLInputElement>(null);

    const CATEGORIES = ["Noun", "Verb", "Adjective", "Adverb", "Pronoun", "Preposition", "Conjunction", "Interjection", "Phrasal Verb", "Idiom", "Collocation", "Slang"];

    useEffect(() => {
        if (step === 2 && wordInputRef.current) {
            wordInputRef.current.focus();
        }
    }, [step]);

    // Automatically advance to step 2 if audience and student were pre-filled via props
    useEffect(() => {
        if (initialAudience === 'specific_student' && initialSpecificStudentId) {
            setStep(2);
        }
    }, [initialAudience, initialSpecificStudentId]);

    const handleNextStep = () => {
        if (!audience) return;
        if (audience === 'specific_student' && !specificStudentId) return;
        setStep(2);
    };

    const handleSaveCurrentCard = () => {
        if (!currentWord.trim()) return;

        const newCard: Word = {
            id: Date.now(),
            word: currentWord.trim(),
            definition: currentDefinition.trim(),
            example: currentExample.trim(),
            category: currentCategory,
            phonetic: '',
            notes: '',
            status: 'private',
            authorId: 'tutor'
        };

        setCards(prev => [...prev, newCard]);
        
        // Reset form for next card
        setCurrentWord('');
        setCurrentDefinition('');
        setCurrentExample('');
        setCurrentCategory('Noun');
        
        // Focus back to word input
        setTimeout(() => {
            if (wordInputRef.current) wordInputRef.current.focus();
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveCurrentCard();
        }
    };

    const handleDone = () => {
        // If there's a partially filled card with at least a word, save it automatically
        let finalCards = [...cards];
        if (currentWord.trim()) {
            finalCards.push({
                id: Date.now(),
                word: currentWord.trim(),
                definition: currentDefinition.trim(),
                example: currentExample.trim(),
                category: currentCategory,
                phonetic: '',
                notes: '',
                status: 'private',
                authorId: 'tutor'
            });
        }
        
        onComplete(finalCards, audience, specificStudentId);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-primary/5 p-6 border-b border-border flex justify-between items-center relative">
                    <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            Quick Add Flashcards
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            {step === 1 ? 'Step 1: Choose your audience' : `Step 2: Rapidly create flashcards (${cards.length} created)`}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="font-bold text-lg mb-4">Who are these flashcards for?</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setAudience('specific_student')}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${audience === 'specific_student' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                                >
                                    <User className={`w-6 h-6 mb-3 ${audience === 'specific_student' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <h4 className="font-bold text-md">A Specific Student</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Assign directly to one of your current students.</p>
                                </button>
                                
                                <button 
                                    onClick={() => setAudience('new_student')}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${audience === 'new_student' ? 'border-green-500 bg-green-500/10' : 'border-border hover:border-green-500/50'}`}
                                >
                                    <UserPlus className={`w-6 h-6 mb-3 ${audience === 'new_student' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    <h4 className="font-bold text-md">New Student</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Create an onboarding deck for a new student.</p>
                                </button>
                                
                                <button 
                                    onClick={() => setAudience('all_students')}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${audience === 'all_students' ? 'border-blue-500 bg-blue-500/10' : 'border-border hover:border-blue-500/50'}`}
                                >
                                    <Users className={`w-6 h-6 mb-3 ${audience === 'all_students' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                    <h4 className="font-bold text-md">All Students</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Make available to every student you tutor.</p>
                                </button>
                                
                                <button 
                                    onClick={() => setAudience('public')}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${audience === 'public' ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/50'}`}
                                >
                                    <Globe className={`w-6 h-6 mb-3 ${audience === 'public' ? 'text-purple-500' : 'text-muted-foreground'}`} />
                                    <h4 className="font-bold text-md">Publicly Available</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Add to the global Lumina community library.</p>
                                </button>
                            </div>

                            {audience === 'specific_student' && (
                                <div className="mt-6 p-4 bg-secondary/50 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-bold mb-2">Select Student</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={specificStudentId}
                                        onChange={(e) => setSpecificStudentId(e.target.value)}
                                    >
                                        <option value="" disabled>Choose a student...</option>
                                        {students.filter(s => s.status === 'active').map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={handleNextStep}
                                    disabled={!audience || (audience === 'specific_student' && !specificStudentId)}
                                    className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    Continue <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-secondary/30 p-4 rounded-2xl border border-secondary">
                                <p className="text-sm font-medium mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">💡</span>
                                    Type a word, fill any optional details, and press Enter to quickly save and move to the next.
                                </p>
                                <div className="space-y-4" onKeyDown={handleKeyDown}>
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 ml-1">Target Vocabulary <span className="text-destructive">*</span></label>
                                        <input
                                            ref={wordInputRef}
                                            type="text"
                                            value={currentWord}
                                            onChange={e => setCurrentWord(e.target.value)}
                                            className="w-full p-3 md:p-4 rounded-xl border-2 border-primary/20 bg-background text-lg font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/50"
                                            placeholder="Word or phrase..."
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 ml-1">Category / Part of Speech</label>
                                        <select
                                            value={currentCategory}
                                            onChange={e => setCurrentCategory(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-border mt-2">
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 ml-1">Meaning/Definition</label>
                                        <input
                                            type="text"
                                            value={currentDefinition}
                                            onChange={e => setCurrentDefinition(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="Translation or description..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 ml-1">Example Sentence</label>
                                        <input
                                            type="text"
                                            value={currentExample}
                                            onChange={e => setCurrentExample(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="Use it in a context..."
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                                    {cards.length} flashcards ready to create
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        onClick={handleSaveCurrentCard}
                                        disabled={!currentWord.trim()}
                                        className="flex-1 md:flex-none px-6 py-3 bg-secondary text-secondary-foreground font-bold rounded-xl shadow-sm hover:bg-secondary/80 transition-all disabled:opacity-50"
                                    >
                                        Next (Enter)
                                    </button>
                                    <button
                                        onClick={handleDone}
                                        className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5" /> Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
