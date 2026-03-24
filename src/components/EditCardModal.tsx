import React, { useState, useEffect } from 'react';
import { Word } from '../data/vocabulary';
import { Trash2, Image as ImageIcon, Video, Volume2, Upload, X, Plus, Sparkles, CheckCircle } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

import { AppSettings } from '../types';

interface EditCardModalProps {
    card: Word;
    onSave: (updatedCard: Word, additionalCards?: Word[]) => void;
    onCancel: () => void;
    settings: AppSettings;
    apiKey?: string;
    isAiResolveMode?: boolean;
    aiResolveQueueInfo?: { current: number; total: number; };
    onDecline?: () => void;
}

export function EditCardModal({ card, onSave, onCancel, settings, apiKey, isAiResolveMode, aiResolveQueueInfo, onDecline }: EditCardModalProps) {
    const [editingCards, setEditingCards] = useState<Word[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAiPopulated, setIsAiPopulated] = useState(false);
    const [pendingAlternateMeanings, setPendingAlternateMeanings] = useState<any[]>([]);
    const [approvedCardsQueue, setApprovedCardsQueue] = useState<Word[]>([]);

    const SPLIT_CARD_COLORS = [
        'bg-color2 border-color3 text-color2-foreground',
        'bg-color3 border-color4 text-color3-foreground',
        'bg-color4 border-color5 text-color4-foreground',
        'bg-color5 border-color4 text-color5-foreground',
        'bg-white dark:bg-black/80 border-color2 text-color5'
    ];

    const hasTriggeredAiResolve = React.useRef(false);

    useEffect(() => {
        setEditingCards([{...card}]);
    }, [card]);

    useEffect(() => {
        if (isAiResolveMode && apiKey && !hasTriggeredAiResolve.current && editingCards.length > 0) {
            hasTriggeredAiResolve.current = true;
            handleAutoFillMissing(0);
        }
    }, [isAiResolveMode, apiKey, editingCards]);

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (approvedCardsQueue.length > 0) {
            const finalApproved = [...approvedCardsQueue, ...editingCards];
            onSave(finalApproved[0], finalApproved.slice(1));
        } else {
            onSave(editingCards[0], editingCards.length > 1 ? editingCards.slice(1) : undefined);
        }
    };

    const removeCard = (index: number) => {
        setEditingCards(prev => {
            const next = [...prev];
            next.splice(index, 1);
            if (next.length === 0) {
                if (approvedCardsQueue.length > 0) {
                    onSave(approvedCardsQueue[0], approvedCardsQueue.slice(1));
                } else {
                    if (isAiResolveMode && onDecline) onDecline();
                    else onCancel();
                }
            }
            return next;
        });
    };

    const approveCard = (index: number) => {
        const approved = editingCards[index];
        setApprovedCardsQueue(prev => [...prev, approved]);
        setEditingCards(prev => {
            const next = [...prev];
            next.splice(index, 1);
            if (next.length === 0) {
                const finalApproved = [...approvedCardsQueue, approved];
                onSave(finalApproved[0], finalApproved.slice(1));
            }
            return next;
        });
    };

    const updateCard = (index: number, updater: (prev: Word) => Word) => {
        setEditingCards(prev => {
            const next = [...prev];
            next[index] = updater(next[index]);
            return next;
        });
    };

    const handleAutoFillMissing = async (targetIndex: number) => {
        const targetCard = editingCards[targetIndex];
        if (!targetCard.word || !apiKey) return;

        setIsGenerating(true);
        setError(null);
        setIsAiPopulated(false);

        const cleanKey = apiKey.trim();
        
        // Paid Tier 1 API Keys actively reject generic aliases (like 'gemini-1.5-flash') with a 404.
        // We MUST use explicit, stable point-release versions for production billing environments!
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-1.5-flash-002",
            "gemini-1.5-pro-002",
            "gemini-2.0-flash-001"
        ];

        let lastError = null;

        try {
            const genAI = new GoogleGenerativeAI(cleanKey);

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Attempting to generate with strict production model: ${modelName}`);
                    const model = genAI.getGenerativeModel({ model: modelName });

                    const prompt = `
                        You are an expert English teacher. The user is editing a flashcard for the word/phrase: "${targetCard.word}".
                        Please fill in the missing information. 
                        Return ONLY a JSON object with the following structure:
                        {
                            "meanings": [
                                {
                                    "definition": "A clear, concise definition.",
                                    "example": "A natural example sentence.",
                                    "category": "MUST be exactly one of: Nouns, Verbs, Adjectives, Pronouns, Prepositions, Determiners, Conjunctions, Modal Verbs, Phrasal Verbs, Collocations, Idioms & Sayings, Prepositional Phrases"
                                }
                            ],
                            "phonetic": "IPA pronunciation",
                            "level": "Assign a TEFL level: A1, A2, B1, B2, C1, or C2"
                        }
                        If the word has multiple distinct common meanings, provide up to 3 of the most common ones in the "meanings" array. Otherwise, just provide 1.
                    `;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();
                    
                    let jsonStr = text;
                    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
                    if (jsonMatch) {
                        jsonStr = jsonMatch[1];
                    }
                    const data = JSON.parse(jsonStr.trim());

                    if (data.meanings && data.meanings.length > 0) {
                        const firstMeaning = data.meanings[0];
                        updateCard(targetIndex, prev => ({
                            ...prev,
                            definition: firstMeaning.definition || prev.definition || '',
                            example: firstMeaning.example || prev.example || '',
                            phonetic: data.phonetic || prev.phonetic || '',
                            category: firstMeaning.category || prev.category || '',
                            level: data.level || prev.level || ''
                        }));
                        
                        if (data.meanings.length > 1 && editingCards.length === 1) {
                            setPendingAlternateMeanings(data.meanings.slice(1));
                        }
                    } else {
                        updateCard(targetIndex, prev => ({
                            ...prev,
                            definition: data.definition || prev.definition || '',
                            example: data.example || prev.example || '',
                            phonetic: data.phonetic || prev.phonetic || '',
                            category: data.category || prev.category || '',
                            level: data.level || prev.level || ''
                        }));
                    }

                    setIsAiPopulated(true);
                    return; 
                } catch (e: any) {
                    console.warn(`Model ${modelName} failed:`, e.message);
                    lastError = e;
                    
                    const msg = e.message?.toLowerCase() || "";
                    // If it is NOT a 404 (or deprecated), THROW the real billing/quota error!
                    if (!msg.includes("404") && !msg.includes("not found") && !msg.includes("no longer available")) {
                        throw e;
                    }
                }
            }

            throw lastError || new Error(`No compatible production model found for this Paid Tier key.`);

        } catch (error: any) {
            console.error("AI Generation failed:", error);
            const errorDetails = error.message || "Unknown error";
            const shortError = errorDetails.length > 200 ? errorDetails.substring(0, 200) + "..." : errorDetails;
            setError(`AI Error: ${shortError}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleKeepMeanings = () => {
        updateCard(0, prev => {
            const next = { ...prev };
            
            const newAltDefs = [...(next.alternateDefinitions || [])];
            const newAltExs = [...(next.alternateExamples || [])];
            const newAltCats = [...(next.alternateCategories || [])];

            pendingAlternateMeanings.forEach(m => {
                if (m.definition) newAltDefs.push(m.definition);
                if (m.example) newAltExs.push(m.example);
                if (m.category) newAltCats.push(m.category);
            });

            next.alternateDefinitions = newAltDefs;
            next.alternateExamples = newAltExs;
            next.alternateCategories = newAltCats;

            return next;
        });
        setPendingAlternateMeanings([]);
    };

    const handleSplitMeanings = () => {
        const newCards = pendingAlternateMeanings.map((m, idx) => ({
            ...editingCards[0],
            id: Date.now() + idx + 1,
            definition: m.definition || '',
            example: m.example || '',
            category: m.category || 'Other',
            alternateDefinitions: [],
            alternateExamples: [],
            alternateCategories: [],
            alternatePhonetics: [],
            alternatePronunciations: [],
            imageUrl: '',
            audioUrl: '',
            videoUrl: '',
            alternateImageUrls: [],
            alternateAudioUrls: [],
            status: 'private' as const
        }));
        
        setEditingCards(prev => [...prev, ...newCards]);
        setPendingAlternateMeanings([]);
    };
    
    if (editingCards.length === 0) return null;

    const isSplitSession = editingCards.length > 1 || approvedCardsQueue.length > 0;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full bg-background border border-border rounded-2xl p-8 shadow-2xl relative flex flex-col animate-in zoom-in-95 h-fit max-h-[90vh] ${editingCards.length > 1 ? 'max-w-[95vw]' : 'max-w-xl'}`}>
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 z-10 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold text-foreground mb-4 shrink-0 flex items-center gap-2">
                    {isAiResolveMode ? 'AI Review Suggested Changes' : 'Edit Card'}{editingCards.length > 1 && !isAiResolveMode ? 's' : ''}
                    {editingCards.length > 1 && !isAiResolveMode && (
                        <span className="text-sm font-normal px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                            {editingCards.length} meanings
                        </span>
                    )}
                    {isAiResolveMode && aiResolveQueueInfo && (
                        <span className="text-sm font-normal px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 rounded-full border border-amber-200 dark:border-amber-800">
                            Card {aiResolveQueueInfo.current} of {aiResolveQueueInfo.total}
                        </span>
                    )}
                </h2>

                {!isGenerating && (isAiPopulated || isAiResolveMode) && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4 shrink-0 flex items-start gap-3 dark:bg-blue-900/20 dark:border-blue-800">
                        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-blue-900 dark:text-blue-300 leading-none mb-1">A.I. Suggestions Ready</h3>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                A.I. has finished resolving issues. Please review the suggestions carefully before approving them, because A.I. can make mistakes.
                            </p>
                        </div>
                    </div>
                )}

                {pendingAlternateMeanings.length > 0 && (
                    <div className="bg-amber-100 border border-amber-300 p-4 rounded-xl mb-4 shrink-0 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-amber-900 leading-none mb-1">Multiple Meanings Found</h3>
                            <p className="text-sm text-amber-800">
                                The AI found {pendingAlternateMeanings.length + 1} distinct meanings for "{editingCards[0].word}". Would you like to keep all meanings on this card, or split them into entirely new flashcards?
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={handleKeepMeanings}
                                    className="px-4 py-2 bg-amber-200 text-amber-900 font-bold text-sm rounded-lg hover:bg-amber-300 transition-colors"
                                >
                                    Keep on One Card
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSplitMeanings}
                                    className="px-4 py-2 bg-white border border-amber-400 text-amber-900 font-bold text-sm rounded-lg hover:bg-amber-50 transition-colors"
                                >
                                    Split into Separate Cards
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0 min-w-0 h-full">
                    <div className={`flex flex-row overflow-x-auto overflow-y-auto gap-4 snap-x pb-2 flex-1 min-h-0 custom-scrollbar ${!isSplitSession ? 'justify-start' : ''}`}>
                        {editingCards.map((c, index) => {
                            const absoluteIndex = approvedCardsQueue.length + index;
                            return (
                                <div key={c.id || index} className={`snap-center flex flex-col shrink-0 ${isSplitSession ? `w-[450px] border rounded-xl p-5 relative shadow-sm ${SPLIT_CARD_COLORS[absoluteIndex % 5]}` : 'w-full px-1'}`}>
                                    {isSplitSession && (
                                        <div className="absolute top-0 right-0 bg-black/10 dark:bg-white/10 text-current text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                            Meaning {absoluteIndex + 1}
                                        </div>
                                    )}
                                <CardEditor 
                                    card={c} 
                                    index={index} 
                                    updateCard={updateCard} 
                                    settings={settings}
                                    apiKey={apiKey}
                                    handleAutoFillMissing={() => handleAutoFillMissing(index)}
                                    isGenerating={isGenerating}
                                    isAiPopulated={isAiPopulated}
                                    error={error}
                                    originalCard={isAiResolveMode ? card : undefined}
                                />
                                {isSplitSession && (
                                    <div className="flex gap-2 mt-6 pt-4 border-t border-black/10 dark:border-white/10 shrink-0">
                                        <button type="button" onClick={() => removeCard(index)} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm shadow-sm transition-colors">Decline Changes</button>
                                        <button type="button" onClick={() => approveCard(index)} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors">Save Changes</button>
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>

                    {!isSplitSession && (
                        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border mt-2 shrink-0">
                        <button
                            type="button"
                            onClick={isAiResolveMode && onDecline ? onDecline : onCancel}
                            className="w-full py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors border border-border h-[48px]"
                        >
                            {isAiResolveMode ? 'Decline Changes' : 'Cancel'}
                        </button>

                        <button
                            type="submit"
                            className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm h-[48px] ${isAiResolveMode || isAiPopulated ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'}`}
                        >
                            {(isAiPopulated || isAiResolveMode) && <CheckCircle className="w-4 h-4" />}
                            {isAiResolveMode ? 'Approve Changes' : (isAiPopulated ? 'Accept & Save' : 'Save Changes')}
                        </button>
                    </div>
                    )}
                </form>
            </div>
        </div>
    );
}

function CardEditor({ 
    card, index, updateCard, settings, apiKey, handleAutoFillMissing, isGenerating, isAiPopulated, error, originalCard
}: {
    card: Word;
    index: number;
    updateCard: (index: number, updater: (prev: Word) => Word) => void;
    settings: AppSettings;
    apiKey?: string;
    handleAutoFillMissing: () => void;
    isGenerating: boolean;
    isAiPopulated: boolean;
    error: string | null;
    originalCard?: Word;
}) {

    const isChanged = (field: keyof Word) => originalCard && card[field] !== undefined && originalCard[field] !== card[field];
    const highlightedClass = "bg-green-50 border-green-300 ring-1 ring-green-400 dark:bg-green-900/20 dark:border-green-800 dark:ring-green-700 transition-colors duration-500 text-green-950 dark:text-green-50";
    const defaultClass = "bg-input border-border text-foreground";
    
    // Specifically handle edge case where card.category might have defaulted
    const isCategoryChanged = () => {
        if (!originalCard) return false;
        const curr = card.category || 'Other';
        // 'Other' vs empty string diffs
        if (!originalCard.category && curr && curr !== 'Other') return true;
        return originalCard && originalCard.category !== card.category;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'audioUrl' | 'videoUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            if (!window.confirm(`File size is ${(file.size / 1024).toFixed(0)} KB. Large files may fill up your storage quickly. Continue?`)) {
                e.target.value = '';
                return;
            }
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            updateCard(index, prev => ({ ...prev, [field]: base64String }));
        };
        reader.readAsDataURL(file);
    };

    const handleAlternateFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'alternateImageUrls' | 'alternateAudioUrls', altIndex: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            if (!window.confirm(`File size is ${(file.size / 1024).toFixed(0)} KB. Large files may fill up your storage quickly. Continue?`)) {
                e.target.value = '';
                return;
            }
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            updateCard(index, prev => {
                const currentArray = prev[field] || [];
                const newArray = [...currentArray];
                newArray[altIndex] = base64String;
                return { ...prev, [field]: newArray };
            });
        };
        reader.readAsDataURL(file);
    };

    const updateAlternateArray = (field: keyof Word, altIndex: number, value: string) => {
        updateCard(index, prev => {
            const currentArray = (prev[field] as string[]) || [];
            const newArray = [...currentArray];
            newArray[altIndex] = value;
            return { ...prev, [field]: newArray };
        });
    };

    const addAlternateItem = (field: keyof Word) => {
        updateCard(index, prev => ({
            ...prev,
            [field]: [...((prev[field] as string[]) || []), '']
        }));
    };

    const removeAlternateItem = (field: keyof Word, altIndex: number) => {
        updateCard(index, prev => {
            const currentArray = (prev[field] as string[]) || [];
            const newArray = [...currentArray];
            newArray.splice(altIndex, 1);
            return { ...prev, [field]: newArray };
        });
    };

    return (
        <div className="relative">
            {isGenerating && (
                <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[2px] rounded-xl overflow-hidden">
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none w-full px-4 z-[100]">
                        <div className="bg-background shadow-2xl border-2 border-primary/20 p-8 rounded-2xl flex flex-col items-center text-center animate-in zoom-in duration-300 pointer-events-auto max-w-sm">
                            <Sparkles className="w-10 h-10 text-primary animate-pulse mb-4" />
                            <h3 className="font-bold text-xl mb-2 text-foreground whitespace-nowrap">A.I. is working...</h3>
                            <p className="text-sm text-muted-foreground font-medium">Please be patient while A.I. resolves the issues with this card.</p>
                        </div>
                    </div>
                </div>
            )}
            <div className={`space-y-4 transition-opacity duration-300 ${isGenerating ? 'opacity-30 pointer-events-none select-none' : ''}`}>
                <div>
                <label className="block text-sm font-medium text-current/70 mb-1">Word</label>
                <input
                    className={`w-full px-4 py-3 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none ${isChanged('word') ? highlightedClass : defaultClass}`}
                    value={card.word}
                    onChange={e => updateCard(index, prev => ({ ...prev, word: e.target.value }))}
                />
            </div>

            <div className="pt-2 border-t border-black/10 dark:border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-current uppercase tracking-wider">Classification</h3>

                <div>
                    <label className="block text-sm font-medium text-current/70 mb-1">Category</label>
                    <div className="space-y-2">
                        <select
                            className={`w-full px-4 py-3 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none ${isCategoryChanged() ? highlightedClass : defaultClass}`}
                            value={card.category || ''}
                            onChange={e => updateCard(index, prev => ({ ...prev, category: e.target.value }))}
                        >
                            <option value="" disabled>Select a category</option>
                            {Object.keys(settings.categories).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {(card.alternateCategories || []).map((val, idx) => (
                        <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                            <input
                                className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                value={val}
                                onChange={e => updateAlternateArray('alternateCategories', idx, e.target.value)}
                                placeholder="Alternate Category..."
                            />
                            <button type="button" onClick={() => removeAlternateItem('alternateCategories', idx)} className="p-3 bg-background text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addAlternateItem('alternateCategories')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Add Alternate Category
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2 border-t border-black/10 dark:border-white/10">
                <div>
                    <label className="block text-sm font-medium text-current/70 mb-1">IPA / Phonetic</label>
                    <input
                        className={`w-full px-4 py-3 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono ${isChanged('phonetic') ? highlightedClass : defaultClass}`}
                        value={card.phonetic || ''}
                        onChange={e => updateCard(index, prev => ({ ...prev, phonetic: e.target.value }))}
                        placeholder="/fəˈnɛtɪk/"
                    />

                    {(card.alternatePhonetics || []).map((val, idx) => (
                        <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                            <input
                                className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
                                value={val}
                                onChange={e => updateAlternateArray('alternatePhonetics', idx, e.target.value)}
                                placeholder="Alternate IPA..."
                            />
                            <button type="button" onClick={() => removeAlternateItem('alternatePhonetics', idx)} className="p-3 bg-background text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addAlternateItem('alternatePhonetics')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Add Alternate
                    </button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-current/70 mb-1">Custom Pronunciation</label>
                    <input
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        value={card.customPronunciation || ''}
                        onChange={e => updateCard(index, prev => ({ ...prev, customPronunciation: e.target.value }))}
                        placeholder="e.g. fuh-NEH-tik"
                    />

                    {(card.alternatePronunciations || []).map((val, idx) => (
                        <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                            <input
                                className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                value={val}
                                onChange={e => updateAlternateArray('alternatePronunciations', idx, e.target.value)}
                                placeholder="Alternate Pronunciation..."
                            />
                            <button type="button" onClick={() => removeAlternateItem('alternatePronunciations', idx)} className="p-3 bg-background text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addAlternateItem('alternatePronunciations')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Add Alternate
                    </button>
                </div>
            </div>
            <div className="pt-2 border-t border-black/10 dark:border-white/10">
                <label className="block text-sm font-medium text-current/70 mb-1">Definition</label>
                <textarea
                    className={`w-full px-4 py-3 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-24 ${isChanged('definition') ? highlightedClass : defaultClass}`}
                    value={card.definition}
                    onChange={e => updateCard(index, prev => ({ ...prev, definition: e.target.value }))}
                />

                {(card.alternateDefinitions || []).map((val, idx) => (
                    <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                        <textarea
                            className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-16 text-sm"
                            value={val}
                            onChange={e => updateAlternateArray('alternateDefinitions', idx, e.target.value)}
                            placeholder="Alternate definition..."
                        />
                        <button type="button" onClick={() => removeAlternateItem('alternateDefinitions', idx)} className="p-3 bg-background text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors h-16 flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => addAlternateItem('alternateDefinitions')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                    <Plus className="w-3 h-3" /> Add Alternate Definition
                </button>
            </div>
            <div className="pt-2 border-t border-black/10 dark:border-white/10">
                <label className="block text-sm font-medium text-current/70 mb-1">Example</label>
                <textarea
                    className={`w-full px-4 py-3 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y min-h-[80px] ${isChanged('example') ? highlightedClass : defaultClass}`}
                    value={card.example}
                    onChange={e => updateCard(index, prev => ({ ...prev, example: e.target.value }))}
                />

                {(card.alternateExamples || []).map((val, idx) => (
                    <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                        <textarea
                            className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y min-h-[60px] text-sm"
                            value={val}
                            onChange={e => updateAlternateArray('alternateExamples', idx, e.target.value)}
                            placeholder="Alternate example..."
                        />
                        <button type="button" onClick={() => removeAlternateItem('alternateExamples', idx)} className="p-3 bg-background text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors flex items-center justify-center max-h-[60px]">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => addAlternateItem('alternateExamples')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                    <Plus className="w-3 h-3" /> Add Alternate Example
                </button>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-current uppercase tracking-wider">Difficulty</h3>
                <div>
                    <label className="block text-sm font-medium text-current/70 mb-1">TEFL Level</label>
                    <select
                        className={`w-full px-4 py-3 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer ${isChanged('level') ? highlightedClass : defaultClass}`}
                        value={card.level || ''}
                        onChange={e => updateCard(index, prev => ({ ...prev, level: e.target.value }))}
                    >
                        <option value="" disabled>Select a level</option>
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-current uppercase tracking-wider">Media Attachments</h3>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Image
                    </label>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="https://... or upload file"
                                value={card.imageUrl || ''}
                                onChange={e => updateCard(index, prev => ({ ...prev, imageUrl: e.target.value }))}
                            />
                            <label className="cursor-pointer px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg flex items-center gap-2 transition-colors">
                                <Upload className="w-4 h-4" />
                                <span className="hidden sm:inline">Upload</span>
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e, 'imageUrl')}
                                />
                            </label>
                        </div>
                        {card.imageUrl && (
                            <div className="relative mt-2 rounded-lg overflow-hidden border border-border h-32 w-full bg-secondary/20 group">
                                <img src={card.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                <button
                                    type="button"
                                    onClick={() => updateCard(index, prev => ({ ...prev, imageUrl: undefined }))}
                                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove Image"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {(card.alternateImageUrls || []).map((url, idx) => (
                        <div key={idx} className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Alternate Image {idx + 1}</span>
                                <button type="button" onClick={() => removeAlternateItem('alternateImageUrls', idx)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Remove
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                    placeholder="https://... or upload file"
                                    value={url || ''}
                                    onChange={e => updateAlternateArray('alternateImageUrls', idx, e.target.value)}
                                />
                                <label className="cursor-pointer px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg flex items-center gap-2 transition-colors">
                                    <Upload className="w-4 h-4" />
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => handleAlternateFileSelect(e, 'alternateImageUrls', idx)}
                                    />
                                </label>
                            </div>
                            {url && (
                                <div className="relative mt-2 rounded-lg overflow-hidden border border-border h-24 w-full bg-secondary/20">
                                    <img src={url} alt="Alternate Preview" className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => addAlternateItem('alternateImageUrls')} className="mt-3 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Add Alternate Image
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                        <Volume2 className="w-4 h-4" /> Audio
                    </label>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            placeholder="https://... or upload file"
                            value={card.audioUrl || ''}
                            onChange={e => updateCard(index, prev => ({ ...prev, audioUrl: e.target.value }))}
                        />
                        <label className="cursor-pointer px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg flex items-center gap-2 transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Upload</span>
                            <input
                                type="file"
                                hidden
                                accept="audio/*"
                                onChange={(e) => handleFileSelect(e, 'audioUrl')}
                            />
                        </label>
                    </div>

                    {(card.alternateAudioUrls || []).map((url, idx) => (
                        <div key={idx} className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Alternate Audio {idx + 1}</span>
                                <button type="button" onClick={() => removeAlternateItem('alternateAudioUrls', idx)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Remove
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                    placeholder="https://... or upload file"
                                    value={url || ''}
                                    onChange={e => updateAlternateArray('alternateAudioUrls', idx, e.target.value)}
                                />
                                <label className="cursor-pointer px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg flex items-center gap-2 transition-colors">
                                    <Upload className="w-4 h-4" />
                                    <input
                                        type="file"
                                        hidden
                                        accept="audio/*"
                                        onChange={(e) => handleAlternateFileSelect(e, 'alternateAudioUrls', idx)}
                                    />
                                </label>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => addAlternateItem('alternateAudioUrls')} className="mt-3 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Add Alternate Audio
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                        <Video className="w-4 h-4" /> Video
                    </label>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="https://... or upload file"
                                value={card.videoUrl || ''}
                                onChange={e => updateCard(index, prev => ({ ...prev, videoUrl: e.target.value }))}
                            />
                            <label className="cursor-pointer px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg flex items-center gap-2 transition-colors">
                                <Upload className="w-4 h-4" />
                                <span className="hidden sm:inline">Upload</span>
                                <input
                                    type="file"
                                    hidden
                                    accept="video/*"
                                    onChange={(e) => handleFileSelect(e, 'videoUrl')}
                                />
                            </label>
                        </div>
                        {card.videoUrl && (
                            <div className="relative mt-2 rounded-lg overflow-hidden border border-border h-32 w-full bg-black group">
                                <video src={card.videoUrl} className="w-full h-full object-contain" />
                                <button
                                    type="button"
                                    onClick={() => updateCard(index, prev => ({ ...prev, videoUrl: undefined }))}
                                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove Video"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col mt-6 border-t border-border pt-4">
                <button
                    type="button"
                    onClick={handleAutoFillMissing}
                    disabled={!card.word || isGenerating || !apiKey}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all h-[48px] ${!apiKey ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800'}`}
                    title={!apiKey ? "Set API Key in Settings to use AI" : "Auto-fill missing details with AI"}
                >
                    <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : (isAiPopulated ? 'Regenerate for this Card' : 'Fill with A.I.')}
                </button>
                {error && <p className="text-xs text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-950/50 rounded border border-red-200 dark:border-red-900">{error}</p>}
                <p className="text-[10px] text-muted-foreground/80 mt-2 text-center leading-tight">A.I. can make mistakes. Please review all fields before saving.</p>
            </div>
        </div>
        </div>
    );
}
