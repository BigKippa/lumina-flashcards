import React, { useMemo } from 'react';
import { Deck } from '../types';
import { Word } from '../data/vocabulary';
import { X, Search, AlertTriangle, Layers, ArrowRight, CheckCircle } from 'lucide-react';

interface LibraryDiagnosticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    decks: Deck[];
    onResolveMissing: (card: Word & { deckId: string }) => void;
    onResolveDuplicates: (duplicates: (Word & { deckId: string })[]) => void;
}

export const LibraryDiagnosticsModal: React.FC<LibraryDiagnosticsModalProps> = ({ 
    isOpen, 
    onClose, 
    decks, 
    onResolveMissing, 
    onResolveDuplicates 
}) => {
    // Compute Issues
    const { missingDataCards, duplicateGroups } = useMemo(() => {
        const allCards: (Word & { deckId: string; deckTitle: string })[] = [];
        
        decks.forEach(deck => {
            deck.cards.forEach(card => {
                allCards.push({ ...card, deckId: deck.id, deckTitle: deck.title });
            });
        });

        // 1. Missing Data
        const missing = allCards.filter(c => !c.definition || !c.example || !c.phonetic || !c.category);

        // 2. Duplicates
        const groups = new Map<string, typeof allCards>();
        allCards.forEach(card => {
            const key = card.word.toLowerCase().trim();
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(card);
        });

        const duplicates = Array.from(groups.values()).filter(group => {
            if (group.length <= 1) return false;
            
            // Check if every pair mutually ignores each other
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    const cardA = group[i];
                    const cardB = group[j];
                    const aIgnoresB = cardA.ignoredDuplicateIds?.includes(cardB.id) ?? false;
                    const bIgnoresA = cardB.ignoredDuplicateIds?.includes(cardA.id) ?? false;
                    
                    if (!aIgnoresB || !bIgnoresA) {
                        return true; // Found a conflict pair!
                    }
                }
            }
            
            return false; // All elements in this group safely ignore each other
        });

        return { missingDataCards: missing, duplicateGroups: duplicates };
    }, [decks]);

    if (!isOpen) return null;

    const totalIssues = missingDataCards.length + duplicateGroups.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-primary/5 p-6 border-b border-border flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Search className="w-6 h-6 text-primary" /> 
                            Library Diagnostics
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Scan your vocabulary library for inconsistencies, duplicates, and missing data.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Status Banner */}
                    <div className={`p-4 rounded-xl border flex items-center gap-4 ${totalIssues > 0 ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-100' : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-100'}`}>
                        {totalIssues > 0 ? (
                            <>
                                <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-lg">Issues Detected</h3>
                                    <p className="opacity-80">We found {totalIssues} potential issue(s) that require your attention to ensure optimal student learning.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-lg">Library is Healthy</h3>
                                    <p className="opacity-80">No duplicates or missing fields found. Your library is in excellent shape!</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Duplicate Errors */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 border-b border-border pb-2">
                                <Layers className="w-5 h-5 text-indigo-500" />
                                Duplicate Cards <span className="text-sm font-normal bg-secondary px-2 py-0.5 rounded-full">{duplicateGroups.length}</span>
                            </h3>

                            {duplicateGroups.length === 0 ? (
                                <p className="text-muted-foreground text-sm italic">No duplicate words found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {duplicateGroups.map((group, idx) => (
                                        <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors flex justify-between items-center group">
                                            <div>
                                                <p className="font-bold text-foreground">{group[0].word}</p>
                                                <p className="text-xs text-muted-foreground">{group.length} versions found in {Array.from(new Set(group.map(g => g.deckTitle))).join(', ')}</p>
                                            </div>
                                            <button 
                                                onClick={() => onResolveDuplicates(group)}
                                                className="px-3 py-1.5 text-xs font-bold rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 transition-colors flex items-center gap-1"
                                            >
                                                Resolve <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Missing Data Errors */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 border-b border-border pb-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Missing Fields <span className="text-sm font-normal bg-secondary px-2 py-0.5 rounded-full">{missingDataCards.length}</span>
                            </h3>

                            {missingDataCards.length === 0 ? (
                                <p className="text-muted-foreground text-sm italic">All cards have complete data.</p>
                            ) : (
                                <div className="space-y-3">
                                    {missingDataCards.slice(0, 10).map((card, idx) => {
                                        const missing = [];
                                        if (!card.definition) missing.push("Def");
                                        if (!card.example) missing.push("Ex");
                                        if (!card.phonetic) missing.push("IPA");
                                        if (!card.category) missing.push("Cat");

                                        return (
                                            <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors flex justify-between items-center group">
                                                <div>
                                                    <p className="font-bold text-foreground truncate max-w-[200px]">{card.word}</p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">Missing: {missing.join(", ")}</p>
                                                </div>
                                                <button 
                                                    onClick={() => onResolveMissing(card)}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 transition-colors flex items-center gap-1"
                                                >
                                                    Edit <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                    {missingDataCards.length > 10 && (
                                        <p className="text-xs text-muted-foreground text-center pt-2">
                                            + {missingDataCards.length - 10} more. Resolving these will reveal others.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
