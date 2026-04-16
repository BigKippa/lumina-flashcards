import React, { useState } from 'react';
import { Word } from '../data/vocabulary';
import { X, Check, Merge } from 'lucide-react';

interface DuplicateResolverModalProps {
    isOpen: boolean;
    onClose: () => void;
    duplicates: Word[]; // 2 or more cards
    onResolve: (keptCards: Word[]) => void;
    settings: any; // for category list
}

export const DuplicateResolverModal: React.FC<DuplicateResolverModalProps> = ({ isOpen, onClose, duplicates, onResolve, settings }) => {
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const [isMerging, setIsMerging] = useState(false);
    const [mergedCard, setMergedCard] = useState<Word>(duplicates[0]);

    if (!isOpen) return null;

    const toggleSelection = (id: string | number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleStartMerge = () => {
        // Pre-fill merged card with data from the first one, but maybe combining logic?
        // For now, just pick the first one as base
        setMergedCard({ ...duplicates[0], id: -1 }); // ID -1 to indicate new/merged
        setIsMerging(true);
    };

    const handleSaveMerge = () => {
        // Logic to save 'mergedCard' as the final version
        // We need to pick an ID to keep. Usually we keep the ID of the first one or create new?
        // Let's keep the ID of the first duplicate for stability, or ask.
        // Simpler: Keep the ID of the first duplicate.
        const finalCard = { ...mergedCard, id: duplicates[0].id };
        onResolve([finalCard]);
    };

    if (isMerging) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Merge Duplicates</h2>
                        <button onClick={() => setIsMerging(false)} className="p-2 hover:bg-secondary rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-4">
                        <p className="text-muted-foreground mb-4">Edit the final version of the card.</p>

                        <div>
                            <label className="block text-sm font-medium mb-1">Word</label>
                            <input
                                type="text"
                                value={mergedCard.word}
                                onChange={e => setMergedCard({ ...mergedCard, word: e.target.value })}
                                className="w-full p-2 rounded-lg bg-secondary border border-border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Definition</label>
                            <textarea
                                value={mergedCard.definition}
                                onChange={e => setMergedCard({ ...mergedCard, definition: e.target.value })}
                                className="w-full p-2 rounded-lg bg-secondary border border-border h-24"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                value={mergedCard.category || 'Vocabulary'}
                                onChange={e => setMergedCard({ ...mergedCard, category: e.target.value })}
                                className="w-full p-2 rounded-lg bg-secondary border border-border"
                            >
                                {Object.keys(settings.categories).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="p-6 border-t border-border flex justify-end gap-3">
                        <button onClick={() => setIsMerging(false)} className="px-4 py-2 rounded-lg hover:bg-secondary">Cancel</button>
                        <button onClick={handleSaveMerge} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold">
                            Save Merged Card
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-4xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            Resolve Duplicates
                            <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                {duplicates.length} versions found
                            </span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {duplicates.map((card) => (
                            <div key={card.id} className={`
                                relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col
                                ${selectedIds.includes(card.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                            `}
                                onClick={() => toggleSelection(card.id)}
                            >
                                <div className="absolute top-3 right-3">
                                    {selectedIds.includes(card.id) && <div className="bg-primary text-primary-foreground p-1 rounded-full"><Check className="w-4 h-4" /></div>}
                                </div>
                                <div className="mb-4">
                                    <h3 className="font-bold text-lg">{card.word}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{card.category || 'Uncategorized'}</p>
                                </div>
                                <div className="flex-1 bg-secondary/30 p-3 rounded-lg text-sm mb-4">
                                    <p className="font-medium text-muted-foreground mb-1">Definition:</p>
                                    <p>{card.definition}</p>
                                </div>
                                <div className="text-xs text-muted-foreground mb-4">
                                    ID: {card.id}
                                    {card.isPublic ? <span className="ml-2 text-green-500 font-bold">Public</span> : <span className="ml-2">Private</span>}
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleSelection(card.id); }}
                                    className={`w-full mt-auto py-2 font-bold rounded-lg transition-colors ${selectedIds.includes(card.id) ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                                >
                                    {selectedIds.includes(card.id) ? 'Selected' : 'Select'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-secondary/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-muted-foreground text-sm">
                        Select versions to keep, or merge them into a new card.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleStartMerge}
                            className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl transition-colors shadow-sm"
                        >
                            <Merge className="w-5 h-5" />
                            Merge All
                        </button>
                        <button
                            onClick={() => {
                                const kept = duplicates.filter(d => selectedIds.includes(d.id));
                                if (kept.length > 0) {
                                    onResolve(kept);
                                }
                            }}
                            disabled={selectedIds.length === 0}
                            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-colors shadow-lg ${selectedIds.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20' : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'}`}
                        >
                            <Check className="w-5 h-5" />
                            Keep Selected ({selectedIds.length})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
