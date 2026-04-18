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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-color1 text-color5 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-border overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-color4 text-white p-6 border-b border-color4 flex justify-between items-center relative">
                        <h2 className="text-2xl font-bold">Merge Duplicates</h2>
                        <button onClick={() => setIsMerging(false)} className="p-2 hover:bg-white/20 bg-color4 border-2 border-white/50 rounded-full absolute -top-4 -right-4 transition-all"><X className="w-5 h-5 text-white" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-4 text-color5">
                        <p className="text-color5/70 mb-4 font-medium">Edit the final version of the card.</p>

                        <div>
                            <label className="block text-sm font-bold mb-1">Word</label>
                            <input
                                type="text"
                                value={mergedCard.word}
                                onChange={e => setMergedCard({ ...mergedCard, word: e.target.value })}
                                className="w-full p-3 rounded-xl bg-white border-2 border-color2 focus:border-color4 outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Definition</label>
                            <textarea
                                value={mergedCard.definition}
                                onChange={e => setMergedCard({ ...mergedCard, definition: e.target.value })}
                                className="w-full p-3 rounded-xl bg-white border-2 border-color2 focus:border-color4 outline-none font-medium h-24 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Category</label>
                            <select
                                value={mergedCard.category || 'Vocabulary'}
                                onChange={e => setMergedCard({ ...mergedCard, category: e.target.value })}
                                className="w-full p-3 rounded-xl bg-white border-2 border-color2 focus:border-color4 outline-none font-bold"
                            >
                                {Object.keys(settings.categories).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="p-6 border-t border-color2 shadow-inner bg-color2 flex flex-col sm:flex-row justify-end gap-3 rounded-b-3xl">
                        <button onClick={() => setIsMerging(false)} className="px-6 py-3 rounded-xl font-bold hover:bg-color1 bg-white border-2 border-color3 transition-all text-color5 shadow-sm">Cancel</button>
                        <button onClick={handleSaveMerge} className="px-6 py-3 rounded-xl bg-color4 hover:bg-color4/90 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2 border border-color4/80">
                            <Check className="w-5 h-5" /> Save Final Merged Card
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-color1 text-color5 w-full max-w-4xl rounded-3xl shadow-2xl border-2 border-border flex flex-col max-h-[90vh] overflow-hidden">
                <div className="bg-color3 text-color5 p-6 border-b border-color3 flex justify-between items-center relative shadow-sm z-10">
                    <div>
                        <h2 className="text-2xl font-extrabold flex items-center gap-3">
                            Resolve Duplicates
                            <span className="text-sm font-bold text-white bg-color4 px-4 py-1.5 rounded-full shadow-md border-2 border-white/20">
                                {duplicates.length} versions found
                            </span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-color3/80 bg-white border-2 border-color3 rounded-full absolute -top-4 -right-4 transition-all shadow-md">
                        <X className="w-5 h-5 text-color5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-color1/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {duplicates.map((card, idx) => {
                            const isSelected = selectedIds.includes(card.id);
                            
                            const getCardClasses = (index: number) => {
                                const map = [
                                    { selected: 'border-color6 bg-color6 text-color1 shadow-md scale-[1.02]', unselected: 'border-color6/40 bg-color6/10 hover:border-color6/60 hover:bg-color6/20' },
                                    { selected: 'border-color7 bg-color7 text-color1 shadow-md scale-[1.02]', unselected: 'border-color7/40 bg-color7/10 hover:border-color7/60 hover:bg-color7/20' },
                                    { selected: 'border-color8 bg-color8 text-color1 shadow-md scale-[1.02]', unselected: 'border-color8/40 bg-color8/10 hover:border-color8/60 hover:bg-color8/20' },
                                    { selected: 'border-color9 bg-color9 text-color5 shadow-md scale-[1.02]', unselected: 'border-color9/40 bg-color9/10 hover:border-color9/60 hover:bg-color9/20' }
                                ];
                                const style = map[index % map.length];
                                return isSelected ? style.selected : style.unselected;
                            };

                            const textColor = isSelected ? (idx % 4 === 3 ? 'text-color5' : 'text-color1') : 'text-color5';
                            const innerBadgeColor = isSelected ? 'bg-black/20 text-current' : 'bg-white/80 border-color2/40 border-2 font-bold';
                            
                            return (
                            <div key={card.id} className={`
                                relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col
                                ${getCardClasses(idx)}
                            `}
                                onClick={() => toggleSelection(card.id)}
                            >
                                <div className="absolute top-4 right-4">
                                    {isSelected && <div className="bg-white/30 text-current p-1.5 rounded-full backdrop-blur-sm"><Check className="w-5 h-5" /></div>}
                                </div>
                                <div className={`mb-4 ${textColor}`}>
                                    <h3 className="font-extrabold text-2xl">{card.word}</h3>
                                    <p className="text-sm opacity-80 mt-1 font-medium">{card.category || 'Uncategorized'}</p>
                                </div>
                                <div className={`flex-1 p-4 rounded-xl text-sm mb-4 ${innerBadgeColor}`}>
                                    <p className="font-extrabold opacity-70 mb-1 uppercase text-xs tracking-wider">Definition:</p>
                                    <p className="font-medium text-base">{card.definition}</p>
                                </div>
                                <div className={`text-xs opacity-70 mb-4 font-bold flex items-center justify-between ${textColor}`}>
                                    <span>ID: {card.id}</span>
                                    {card.isPublic ? <span className="bg-green-500/20 text-green-700 px-2 py-0.5 rounded font-bold">Public</span> : <span className="opacity-70">Private</span>}
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleSelection(card.id); }}
                                    className={`w-full mt-auto py-3 font-bold rounded-xl transition-all shadow-sm ${isSelected ? 'bg-white text-color5 hover:bg-white/90 scale-105' : 'bg-white/50 hover:bg-white border-2 border-transparent hover:border-color2'}`}
                                >
                                    {isSelected ? 'Selected' : 'Select Version'}
                                </button>
                            </div>
                        )})}
                    </div>
                </div>

                <div className="p-6 border-t border-color2 shadow-inner bg-color2 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-3xl z-10">
                    <p className="text-color5/80 font-bold text-sm bg-white/50 px-4 py-2 rounded-xl">
                        Select multiple versions to combine them, or just one to keep exactly.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleStartMerge}
                            className="flex items-center gap-2 px-6 py-3 border-2 border-color3 bg-white hover:bg-color1 text-color5 font-bold rounded-xl transition-all shadow-md"
                        >
                            <Merge className="w-5 h-5" />
                            Merge Selected
                        </button>
                        <button
                            onClick={() => {
                                const kept = duplicates.filter(d => selectedIds.includes(d.id));
                                if (kept.length > 0) {
                                    onResolve(kept);
                                }
                            }}
                            disabled={selectedIds.length === 0}
                            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all shadow-lg ${selectedIds.length > 0 ? 'bg-color4 hover:bg-color4/90 text-white shadow-color4/40 scale-105' : 'bg-color2/30 text-color5/40 cursor-not-allowed border-2 border-color2'}`}
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
