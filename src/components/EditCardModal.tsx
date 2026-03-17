import React, { useState, useEffect } from 'react';
import { Word } from '../data/vocabulary';
import { Trash2, Image as ImageIcon, Video, Volume2, Upload, X, Plus, Sparkles, CheckCircle } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

import { AppSettings } from '../types';

interface EditCardModalProps {
    card: Word;
    onSave: (updatedCard: Word) => void;
    onCancel: () => void;
    settings: AppSettings;
    apiKey?: string;
}

export function EditCardModal({ card, onSave, onCancel, settings, apiKey }: EditCardModalProps) {
    const [editingCard, setEditingCard] = useState<Word>(card);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAiPopulated, setIsAiPopulated] = useState(false);

    // Sync if card prop changes, though usually this component is mounted only when needed
    useEffect(() => {
        setEditingCard(card);
    }, [card]);

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editingCard);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'audioUrl' | 'videoUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size validation (warn if > 500KB)
        if (file.size > 500 * 1024) {
            if (!window.confirm(`File size is ${(file.size / 1024).toFixed(0)} KB.Large files may fill up your storage quickly.Continue ? `)) {
                e.target.value = ''; // Reset input
                return;
            }
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setEditingCard(prev => ({ ...prev, [field]: base64String }));
        };
        reader.readAsDataURL(file);
    };

    const handleAlternateFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'alternateImageUrls' | 'alternateAudioUrls', index: number) => {
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
            setEditingCard(prev => {
                const currentArray = prev[field] || [];
                const newArray = [...currentArray];
                newArray[index] = base64String;
                return { ...prev, [field]: newArray };
            });
        };
        reader.readAsDataURL(file);
    };

    const updateAlternateArray = (field: keyof Word, index: number, value: string) => {
        setEditingCard(prev => {
            const currentArray = (prev[field] as string[]) || [];
            const newArray = [...currentArray];
            newArray[index] = value;
            return { ...prev, [field]: newArray };
        });
    };

    const addAlternateItem = (field: keyof Word) => {
        setEditingCard(prev => ({
            ...prev,
            [field]: [...((prev[field] as string[]) || []), '']
        }));
    };

    const removeAlternateItem = (field: keyof Word, index: number) => {
        setEditingCard(prev => {
            const currentArray = (prev[field] as string[]) || [];
            const newArray = [...currentArray];
            newArray.splice(index, 1);
            return { ...prev, [field]: newArray };
        });
    };

    const handleAutoFillMissing = async () => {
        if (!editingCard.word || !apiKey) return;

        setIsGenerating(true);
        setError(null);
        setIsAiPopulated(false);

        const cleanKey = apiKey.trim();
        const modelsToTry = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-001",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-1.5-flash",
            "gemini-pro"
        ];

        let lastError = null;

        try {
            const genAI = new GoogleGenerativeAI(cleanKey);

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Attempting to generate with model: ${modelName}`);
                    const model = genAI.getGenerativeModel({ model: modelName });

                    const prompt = `
                        You are an expert English teacher. The user is editing a flashcard for the word/phrase: "${editingCard.word}".
                        Please fill in the missing information. 
                        Target level: CEFR B2.
                        Return ONLY a JSON object with these keys (only include the keys if they would provide useful information):
                        - definition: A clear, concise definition.
                        - example: A natural example sentence.
                        - phonetic: IPA pronunciation.
                        - category: Part of speech (Noun, Verb, Adjective, Adverb, Pronoun, Preposition, Conjunction, Interjection, Phrasal Verb, Idiom, Slang, Collocation).
                    `;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();
                    
                    // Robustly extract JSON block if wrapped in markdown
                    let jsonStr = text;
                    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
                    if (jsonMatch) {
                        jsonStr = jsonMatch[1];
                    }
                    const data = JSON.parse(jsonStr.trim());

                    // Overwrite fields with AI data, keep previous if AI didn't return it
                    setEditingCard(prev => ({
                        ...prev,
                        definition: data.definition || prev.definition || '',
                        example: data.example || prev.example || '',
                        phonetic: data.phonetic || prev.phonetic || '',
                        category: data.category || prev.category || 'Other'
                    }));

                    setIsAiPopulated(true);
                    return; // Success, exit function
                } catch (e: any) {
                    console.warn(`Model ${modelName} failed:`, e.message);
                    lastError = e;
                }
            }

            throw lastError || new Error("All models failed to generate content");

        } catch (error: any) {
            console.error("AI Generation failed:", error);
            const errorDetails = error.message || "Unknown error";
            const shortError = errorDetails.length > 200 ? errorDetails.substring(0, 200) + "..." : errorDetails;
            setError(`AI Error: ${shortError}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-background border border-border rounded-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-foreground mb-6">Edit Card</h2>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Word</label>
                        <input
                            className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            value={editingCard.word}
                            onChange={e => setEditingCard({ ...editingCard, word: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">IPA / Phonetic</label>
                            <input
                                className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono"
                                value={editingCard.phonetic || ''}
                                onChange={e => setEditingCard({ ...editingCard, phonetic: e.target.value })}
                                placeholder="/fəˈnɛtɪk/"
                            />

                            {(editingCard.alternatePhonetics || []).map((val, idx) => (
                                <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                                    <input
                                        className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
                                        value={val}
                                        onChange={e => updateAlternateArray('alternatePhonetics', idx, e.target.value)}
                                        placeholder="Alternate IPA..."
                                    />
                                    <button type="button" onClick={() => removeAlternateItem('alternatePhonetics', idx)} className="p-3 text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addAlternateItem('alternatePhonetics')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                <Plus className="w-3 h-3" /> Add Alternate
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Custom Pronunciation</label>
                            <input
                                className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                value={editingCard.customPronunciation || ''}
                                onChange={e => setEditingCard({ ...editingCard, customPronunciation: e.target.value })}
                                placeholder="e.g. fuh-NEH-tik"
                            />

                            {(editingCard.alternatePronunciations || []).map((val, idx) => (
                                <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                                    <input
                                        className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                        value={val}
                                        onChange={e => updateAlternateArray('alternatePronunciations', idx, e.target.value)}
                                        placeholder="Alternate Pronunciation..."
                                    />
                                    <button type="button" onClick={() => removeAlternateItem('alternatePronunciations', idx)} className="p-3 text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addAlternateItem('alternatePronunciations')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                <Plus className="w-3 h-3" /> Add Alternate
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Definition</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-24"
                            value={editingCard.definition}
                            onChange={e => setEditingCard({ ...editingCard, definition: e.target.value })}
                        />

                        {(editingCard.alternateDefinitions || []).map((val, idx) => (
                            <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                                <textarea
                                    className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-16 text-sm"
                                    value={val}
                                    onChange={e => updateAlternateArray('alternateDefinitions', idx, e.target.value)}
                                    placeholder="Alternate definition..."
                                />
                                <button type="button" onClick={() => removeAlternateItem('alternateDefinitions', idx)} className="p-3 text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors h-16 flex items-center justify-center">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addAlternateItem('alternateDefinitions')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                            <Plus className="w-3 h-3" /> Add Alternate Definition
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Example</label>
                        <input
                            className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            value={editingCard.example}
                            onChange={e => setEditingCard({ ...editingCard, example: e.target.value })}
                        />

                        {(editingCard.alternateExamples || []).map((val, idx) => (
                            <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                                <input
                                    className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                    value={val}
                                    onChange={e => updateAlternateArray('alternateExamples', idx, e.target.value)}
                                    placeholder="Alternate example..."
                                />
                                <button type="button" onClick={() => removeAlternateItem('alternateExamples', idx)} className="p-3 text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addAlternateItem('alternateExamples')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                            <Plus className="w-3 h-3" /> Add Alternate Example
                        </button>
                    </div>

                    {/* Category Selection */}
                    <div className="pt-4 border-t border-border space-y-4">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Classification</h3>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                            <div className="space-y-2">
                                <select
                                    className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
                                    value={Object.keys(settings.categories).includes(editingCard.category || '') ? editingCard.category : 'Other'}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val === 'Other') {
                                            if (Object.keys(settings.categories).includes(editingCard.category || '')) {
                                                setEditingCard({ ...editingCard, category: '' });
                                            }
                                        } else {
                                            setEditingCard({ ...editingCard, category: val });
                                        }
                                    }}
                                >
                                    {Object.keys(settings.categories).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="Other">Other (Custom)</option>
                                </select>
                                {(!Object.keys(settings.categories).includes(editingCard.category || '') || editingCard.category === '') && (
                                    <input
                                        type="text"
                                        value={editingCard.category || ''}
                                        onChange={e => setEditingCard({ ...editingCard, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none animate-in fade-in slide-in-from-top-1"
                                        placeholder="Enter custom category..."
                                    />
                                )}
                            </div>

                            {(editingCard.alternateCategories || []).map((val, idx) => (
                                <div key={idx} className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                                    <input
                                        className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                        value={val}
                                        onChange={e => updateAlternateArray('alternateCategories', idx, e.target.value)}
                                        placeholder="Alternate Category..."
                                    />
                                    <button type="button" onClick={() => removeAlternateItem('alternateCategories', idx)} className="p-3 text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addAlternateItem('alternateCategories')} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                <Plus className="w-3 h-3" /> Add Alternate Category
                            </button>

                            <p className="text-xs text-muted-foreground mt-2">
                                Categories determine the styling of the card. You can customize these in Settings.
                            </p>
                        </div>
                    </div>

                    {/* TEFL Level Selection */}
                    <div className="pt-4 border-t border-border space-y-4">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Difficulty</h3>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">TEFL Level</label>
                            <select
                                className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                                value={editingCard.level || ''}
                                onChange={e => setEditingCard({ ...editingCard, level: e.target.value })}
                            >
                                <option value="" disabled>Select a level</option>
                                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Media Fields */}
                    <div className="pt-4 border-t border-border space-y-4">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Media Attachments</h3>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Image
                            </label>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="https://... or upload file"
                                        value={editingCard.imageUrl || ''}
                                        onChange={e => setEditingCard({ ...editingCard, imageUrl: e.target.value })}
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
                                {editingCard.imageUrl && (
                                    <div className="relative mt-2 rounded-lg overflow-hidden border border-border h-32 w-full bg-secondary/20 group">
                                        <img src={editingCard.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => setEditingCard({ ...editingCard, imageUrl: undefined })}
                                            className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove Image"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Alternate Images */}
                            {(editingCard.alternateImageUrls || []).map((url, idx) => (
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

                        {/* Audio Upload */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                <Volume2 className="w-4 h-4" /> Audio
                            </label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="https://... or upload file"
                                    value={editingCard.audioUrl || ''}
                                    onChange={e => setEditingCard({ ...editingCard, audioUrl: e.target.value })}
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

                            {/* Alternate Audios */}
                            {(editingCard.alternateAudioUrls || []).map((url, idx) => (
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

                        {/* Video Upload */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                <Video className="w-4 h-4" /> Video
                            </label>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="https://... or upload file"
                                        value={editingCard.videoUrl || ''}
                                        onChange={e => setEditingCard({ ...editingCard, videoUrl: e.target.value })}
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
                                {editingCard.videoUrl && (
                                    <div className="relative mt-2 rounded-lg overflow-hidden border border-border h-32 w-full bg-black group">
                                        <video src={editingCard.videoUrl} className="w-full h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => setEditingCard({ ...editingCard, videoUrl: undefined })}
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

                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border mt-6">
                        <div className="flex flex-col">
                            <button
                                type="button"
                                onClick={handleAutoFillMissing}
                                disabled={!editingCard.word || isGenerating || !apiKey}
                                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all h-[48px] ${!apiKey ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800'}`}
                                title={!apiKey ? "Set API Key in Settings to use AI" : "Auto-fill missing details with AI"}
                            >
                                <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                                {isGenerating ? 'Generating...' : (isAiPopulated ? 'Regenerate' : 'Fill with A.I.')}
                            </button>
                            {error && <p className="text-xs text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-950/50 rounded border border-red-200 dark:border-red-900">{error}</p>}
                            <p className="text-[10px] text-muted-foreground/80 mt-2 text-center leading-tight">A.I. can make mistakes. Please review all fields before saving.</p>
                        </div>

                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors border border-border h-[48px]"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm h-[48px] ${isAiPopulated ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                        >
                            {isAiPopulated && <CheckCircle className="w-4 h-4" />}
                            {isAiPopulated ? 'Accept & Save' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
