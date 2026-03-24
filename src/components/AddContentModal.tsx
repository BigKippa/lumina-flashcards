import React, { useState } from 'react';
import { Deck } from '../types';
import { Word } from '../data/vocabulary';
import { X, Search, Plus, Volume2, Book, Sparkles, CheckCircle, Image as ImageIcon, Mic, Trash2, Upload } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ... rest of imports

interface AddContentModalProps {
    onClose: () => void;
    mode: 'student' | 'tutor'; // 'student' = assigning to specific student, 'tutor' = managing global library
    studentName?: string;

    // Data Sources
    availableDecks: Deck[];
    availableCards: Word[]; // For searching existing cards
    activeDeckIds?: string[]; // For filtering already assigned decks (student mode)
    apiKey?: string;

    // Actions
    onAssignDeck?: (deckId: string) => void;
    onAddExistingCard?: (card: Word, targetDeckId: string) => void;
    onCreateNewCard: (card: Word, targetDeckId: string, addToLibrary: boolean) => void;
    onCreateNewDeck?: (deck: Deck) => void;
}

export const AddContentModal: React.FC<AddContentModalProps> = ({
    onClose,
    mode,
    studentName,
    availableDecks,
    availableCards,
    activeDeckIds = [],
    onAssignDeck,
    onAddExistingCard,
    onCreateNewCard,
    onCreateNewDeck,
    apiKey
}) => {
    const [actionType, setActionType] = useState<'new-card' | 'new-deck' | 'existing-card' | 'existing-deck'>('new-card');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [targetDeckId, setTargetDeckId] = useState<string>(activeDeckIds.length > 0 ? activeDeckIds[0] : (availableDecks.length > 0 ? availableDecks[0].id : ''));

    // New Card Form State
    const [newCard, setNewCard] = useState<Partial<Word>>({
        word: '',
        category: 'Noun',
        definition: '',
        example: '',
        phonetic: '',
        notes: '',
        status: 'private'
    });

    const [isGenerating, setIsGenerating] = useState(false);

    // Media State
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingInterval = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        return () => {
            if (recordingInterval.current) clearInterval(recordingInterval.current);
            if (audioStream) audioStream.getTracks().forEach(track => track.stop());
        };
    }, [audioStream]);

    // New Deck Form State
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [newDeckDescription, setNewDeckDescription] = useState('');
    const [customDeckTitle, setCustomDeckTitle] = useState('');

    const handleSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const [error, setError] = useState<string | null>(null);
    const [isAiPopulated, setIsAiPopulated] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'audioUrl' | 'videoUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("File is too large (max 5MB).");
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setNewCard(prev => ({ ...prev, [field]: base64String }));
        };
        reader.readAsDataURL(file);
    };

    const startRecording = async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setNewCard(prev => ({ ...prev, audioUrl: base64String }));
                };
                reader.readAsDataURL(blob);

                // Cleanup
                stream.getTracks().forEach(track => track.stop());
                setAudioStream(null);
                setMediaRecorder(null);
                setIsRecording(false);
                if (recordingInterval.current) clearInterval(recordingInterval.current);
                setRecordingDuration(0);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setAudioStream(stream);
            setIsRecording(true);

            // Timer
            const startTime = Date.now();
            recordingInterval.current = setInterval(() => {
                setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    };

    const handleAutoFill = async () => {
        if (!newCard.word || !apiKey) return;

        setIsGenerating(true);
        setError(null);
        setIsAiPopulated(false);

        const cleanKey = apiKey.trim();
        // Updated list based on user's available models
        const modelsToTry = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ];

        let lastError = null;

        try {
            const genAI = new GoogleGenerativeAI(cleanKey);

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Attempting to generate with model: ${modelName}`);
                    const model = genAI.getGenerativeModel({ model: modelName });

                    const prompt = `
                        You are an expert English teacher. Create a flashcard for the word/phrase: "${newCard.word}".
                        Target level: CEFR B2.
                        Return ONLY a JSON object with these keys:
                        - definition: Clear, concise definition.
                        - example: A natural example sentence.
                        - phonetic: IPA pronunciation.
                        - category: Part of speech (Noun, Verb, Adjective, Adverb, Pronoun, Preposition, Conjunction, Interjection, Phrasal Verb, Idiom, Slang, Collocation).
                        - notes: A short usage note or mnemonic.
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

                    setNewCard(prev => ({
                        ...prev,
                        definition: data.definition || prev.definition,
                        example: data.example || prev.example,
                        phonetic: data.phonetic || prev.phonetic,
                        category: data.category || prev.category,
                        notes: data.notes || prev.notes
                    }));
                    setIsAiPopulated(true);
                    return; // Success, exit function
                } catch (e: any) {
                    console.warn(`Model ${modelName} failed:`, e.message);
                    lastError = e;
                    // Continue to next model
                }
            }

            // If we get here, all models failed
            throw lastError || new Error("All models failed to generate content");

        } catch (error: any) {
            console.error("AI Generation failed:", error);
            const errorDetails = error.message || "Unknown error";
            // Truncate error details if too long
            const shortError = errorDetails.length > 200 ? errorDetails.substring(0, 200) + "..." : errorDetails;
            setError(`AI Error: ${shortError}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveNewCard = () => {
        if (!newCard.word || !newCard.definition) return;
        if (targetDeckId === 'NEW_DECK' && !customDeckTitle.trim()) return;
        if (targetDeckId !== 'NEW_DECK' && !targetDeckId) return;

        let finalDeckId = targetDeckId;

        // Handle New Deck Creation
        if (targetDeckId === 'NEW_DECK') {
            const newDeck: Deck = {
                id: `deck-${Date.now()}`,
                title: customDeckTitle,
                description: 'Created via Add Content',
                cards: [],
                status: 'private',
                authorId: 'tutor'
            };

            if (onCreateNewDeck) onCreateNewDeck(newDeck);
            if (mode === 'student' && onAssignDeck) {
                onAssignDeck(newDeck.id);
            }
            finalDeckId = newDeck.id;
        }

        const card: Word = {
            id: Date.now(),
            word: newCard.word!,
            definition: newCard.definition!,
            example: newCard.example || '',
            phonetic: newCard.phonetic || '',
            category: newCard.category,
            notes: newCard.notes,
            disableAudio: newCard.disableAudio,
            customPronunciation: newCard.customPronunciation,
            status: 'private',
            authorId: 'tutor'
        };

        if (mode === 'student' && onAssignDeck && !activeDeckIds.includes(finalDeckId)) {
            onAssignDeck(finalDeckId);
        }

        onCreateNewCard(card, finalDeckId, true);
        onClose();
    };

    const handleCreateDeck = () => {
        if (!newDeckTitle) return;
        const newDeck: Deck = {
            id: `deck-${Date.now()}`,
            title: newDeckTitle,
            description: newDeckDescription,
            cards: [],
            status: 'private',
            authorId: 'tutor'
        };

        if (onCreateNewDeck) onCreateNewDeck(newDeck);
        if (mode === 'student' && onAssignDeck) {
            onAssignDeck(newDeck.id);
        }
        onClose();
    };

    const handleAssignDeck = () => {
        if (selectedItems.length > 0 && onAssignDeck) {
            selectedItems.forEach(id => onAssignDeck(id));
            onClose();
        }
    };

    // Grammar Categories
    const CATEGORIES = [
        "Noun", "Verb", "Adjective", "Adverb", "Pronoun", "Preposition", "Conjunction", "Interjection",
        "Phrasal Verb", "Idiom", "Collocation", "Slang"
    ];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col border border-border">

                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-card/50">
                    <div>
                        <h2 className="text-2xl font-bold">Add Content</h2>
                        <p className="text-muted-foreground text-sm">
                            {mode === 'student' ? `Adding to ${studentName}` : 'Manage Library'}
                        </p>
                        {mode === 'student' && (
                            <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Also adds to your global library
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-muted/30 p-2 m-6 mb-0 rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <button
                        onClick={() => setActionType('new-card')}
                        className={`py-2 px-3 text-sm font-medium rounded-md transition-all whitespace-nowrap ${actionType === 'new-card' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        New Flashcard
                    </button>
                    <button
                        onClick={() => setActionType('new-deck')}
                        className={`py-2 px-3 text-sm font-medium rounded-md transition-all whitespace-nowrap ${actionType === 'new-deck' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        New Deck
                    </button>
                    <button
                        onClick={() => setActionType('existing-card')}
                        className={`py-2 px-3 text-sm font-medium rounded-md transition-all whitespace-nowrap ${actionType === 'existing-card' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Add Existing Card
                    </button>
                    {mode === 'student' && (
                        <button
                            onClick={() => setActionType('existing-deck')}
                            className={`py-2 px-3 text-sm font-medium rounded-md transition-all whitespace-nowrap ${actionType === 'existing-deck' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Assign Decks
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                    {/* === CREATE NEW CARD === */}
                    {actionType === 'new-card' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            {/* Target Deck Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-1">Target Deck</label>
                                <select
                                    value={targetDeckId}
                                    onChange={e => setTargetDeckId(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-input bg-background"
                                >
                                    <option value="" disabled>Select a deck...</option>
                                    <option value="NEW_DECK">➕ Create New Deck...</option>
                                    {availableDecks
                                        .filter(d => mode === 'tutor' || activeDeckIds.includes(d.id))
                                        .map(d => (
                                            <option key={d.id} value={d.id}>{d.title}</option>
                                        ))}
                                </select>
                                {targetDeckId === 'NEW_DECK' && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                        <input
                                            type="text"
                                            value={customDeckTitle}
                                            onChange={e => setCustomDeckTitle(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-primary bg-background focus:ring-1 focus:ring-primary outline-none"
                                            placeholder="Enter new deck name..."
                                            autoFocus
                                        />
                                    </div>
                                )}
                                {availableDecks.filter(d => mode === 'tutor' || activeDeckIds.includes(d.id)).length === 0 && targetDeckId !== 'NEW_DECK' && (
                                    <p className="text-xs text-red-500 mt-1">Student has no active decks. Create a deck or assign one first.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Word & Pronunciation */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Word / Phrase</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newCard.word}
                                                onChange={e => {
                                                    setNewCard(prev => ({ ...prev, word: e.target.value }));
                                                    setIsAiPopulated(false);
                                                }}
                                                className="flex-1 p-2 rounded-lg border border-input bg-background"
                                                placeholder="e.g. Ephemeral"
                                            />

                                            <button
                                                onClick={() => handleSpeak(newCard.word || '')}
                                                disabled={!newCard.word}
                                                className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 disabled:opacity-50"
                                                title="Preview Pronunciation"
                                            >
                                            </button>
                                        </div>

                                        <div className="pt-2 border-t border-border mt-3 space-y-2">
                                            <label className="block text-sm font-medium mb-1">Category / Part of Speech</label>
                                            <select
                                                value={CATEGORIES.includes(newCard.category || '') ? newCard.category : 'Other'}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === 'Other') {
                                                        if (CATEGORIES.includes(newCard.category || '')) {
                                                            setNewCard(prev => ({ ...prev, category: '' }));
                                                        }
                                                    } else {
                                                        setNewCard(prev => ({ ...prev, category: val }));
                                                    }
                                                }}
                                                className="w-full p-2 rounded-lg border border-input bg-background"
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                <option value="Other">Other (Custom)</option>
                                            </select>

                                            {(!CATEGORIES.includes(newCard.category || '') || newCard.category === '') && (
                                                <input
                                                    type="text"
                                                    value={newCard.category || ''}
                                                    onChange={e => setNewCard(prev => ({ ...prev, category: e.target.value }))}
                                                    className="w-full p-2 rounded-lg border border-input bg-background animate-in fade-in slide-in-from-top-1"
                                                    placeholder="Enter custom category..."
                                                />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 my-2">
                                            <span className="text-xs font-medium text-muted-foreground">Card Audio:</span>
                                            <button
                                                onClick={() => setNewCard(prev => ({ ...prev, disableAudio: !prev.disableAudio }))}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${!newCard.disableAudio ? 'bg-primary' : 'bg-muted'}`}
                                                title={!newCard.disableAudio ? "Audio will be included on card" : "Audio will be disabled on card"}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${!newCard.disableAudio ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                            <span className="text-xs text-muted-foreground">{!newCard.disableAudio ? 'Enabled' : 'Disabled'}</span>
                                        </div>


                                        {/* Media Attachments */}
                                        <div className="space-y-4 pt-2 border-t border-border mt-4">
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Media</h3>

                                            {/* Image Upload */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Image</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-input border border-input text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                        placeholder="Upload image..."
                                                        value={newCard.imageUrl ? 'Image Selected' : ''}
                                                        readOnly
                                                    />
                                                    <label className="cursor-pointer px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg flex items-center gap-2 transition-colors">
                                                        <Upload className="w-4 h-4" />
                                                        <input
                                                            type="file"
                                                            hidden
                                                            accept="image/*"
                                                            onChange={(e) => handleFileSelect(e, 'imageUrl')}
                                                        />
                                                    </label>
                                                    {newCard.imageUrl && (
                                                        <button
                                                            onClick={() => setNewCard(prev => ({ ...prev, imageUrl: undefined }))}
                                                            className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg"
                                                            title="Remove Image"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                {newCard.imageUrl && (
                                                    <div className="mt-2 h-20 w-fit rounded-lg overflow-hidden border border-border">
                                                        <img src={newCard.imageUrl} alt="Preview" className="h-full w-auto object-contain" />
                                                    </div>
                                                )}
                                            </div>



                                            {/* Audio Recording */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Mic className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Custom Audio</span>
                                                </div>

                                                {!newCard.audioUrl && !isRecording && (
                                                    <button
                                                        onClick={startRecording}
                                                        className="w-full py-2 px-4 rounded-lg border-2 border-dashed border-primary/20 hover:border-primary/50 text-primary flex items-center justify-center gap-2 transition-all bg-primary/5 hover:bg-primary/10"
                                                    >
                                                        <Mic className="w-4 h-4" />
                                                        Record Pronunciation
                                                    </button>
                                                )}

                                                {isRecording && (
                                                    <div className="flex items-center gap-2 w-full p-2 bg-red-50 text-red-600 rounded-lg border border-red-200 animate-pulse">
                                                        <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                                                        <span className="text-sm font-bold flex-1">Recording... {recordingDuration}s</span>
                                                        <button
                                                            onClick={stopRecording}
                                                            className="p-1 px-3 bg-white rounded shadow-sm text-xs font-bold hover:bg-red-50"
                                                        >
                                                            Stop
                                                        </button>
                                                    </div>
                                                )}

                                                {newCard.audioUrl && (
                                                    <div className="flex items-center gap-2 w-full p-2 bg-secondary/50 rounded-lg border border-border">
                                                        <Volume2 className="w-4 h-4 text-primary" />
                                                        <span className="text-sm flex-1 truncate">Custom Recording Saved</span>
                                                        <button
                                                            onClick={() => {
                                                                const audio = new Audio(newCard.audioUrl);
                                                                audio.play();
                                                            }}
                                                            className="p-1.5 hover:bg-background rounded-md transition-colors"
                                                            title="Play"
                                                        >
                                                            <Volume2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setNewCard(prev => ({ ...prev, audioUrl: undefined }))}
                                                            className="p-1.5 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                                                            title="Delete Recording"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-4">

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Definition</label>
                                        <textarea
                                            value={newCard.definition}
                                            onChange={e => setNewCard(prev => ({ ...prev, definition: e.target.value }))}
                                            className="w-full p-2 rounded-lg border border-input bg-background h-24 resize-none"
                                            placeholder="Enter definition..."
                                        />
                                    </div>

                                    {/* Pronunciation Fields */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">IPA / Phonetic</label>
                                            <input
                                                type="text"
                                                value={newCard.phonetic || ''}
                                                onChange={e => setNewCard(prev => ({ ...prev, phonetic: e.target.value }))}
                                                className="w-full p-2 rounded-lg border border-input bg-background font-mono text-sm"
                                                placeholder="/fəˈnɛtɪk/"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium">Alternate Pronunciation</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={newCard.customPronunciation || ''}
                                                onChange={e => setNewCard(prev => ({ ...prev, customPronunciation: e.target.value }))}
                                                className="w-full p-2 rounded-lg border border-input bg-background text-sm"
                                                placeholder="e.g. fuh-NEH-tik"
                                            />
                                        </div>

                                    </div>

                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Example Sentence</label>
                                <input
                                    type="text"
                                    value={newCard.example}
                                    onChange={e => setNewCard(prev => ({ ...prev, example: e.target.value }))}
                                    className="w-full p-2 rounded-lg border border-input bg-background"
                                    placeholder="Use the word in a sentence..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Freeform Notes</label>
                                <textarea
                                    value={newCard.notes}
                                    onChange={e => setNewCard(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full p-2 rounded-lg border border-input bg-background h-20 resize-none"
                                    placeholder="Add any extra context, mnemonic devices, or teaching notes..."
                                />
                            </div>

                            <div className="pt-4 flex justify-between items-start">
                                <div className="flex flex-col">
                                    <button
                                        onClick={handleAutoFill}
                                        disabled={!newCard.word || isGenerating || !apiKey}
                                        className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${!apiKey ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800'}`}
                                        title={!apiKey ? "Set API Key in Settings to use AI" : "Auto-fill details with AI"}
                                    >
                                        <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                                        {isGenerating ? 'Generating...' : (isAiPopulated ? 'Regenerate' : 'Fill with A.I.')}
                                    </button>
                                    {error && <p className="text-xs text-red-500 mt-2 max-w-[350px] bg-red-50 p-2 rounded border border-red-200">{error}</p>}
                                    <p className="text-[10px] text-muted-foreground/80 mt-2 max-w-[250px] leading-tight">A.I. can make mistakes. Please review all fields before saving.</p>
                                </div>

                                <button
                                    onClick={handleSaveNewCard}
                                    disabled={!newCard.word || !newCard.definition || (!targetDeckId && targetDeckId !== 'NEW_DECK') || (targetDeckId === 'NEW_DECK' && !customDeckTitle.trim())}
                                    className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${isAiPopulated ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-[1.02]' : 'bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-primary/25 hover:scale-[1.02]'}`}
                                >
                                    {isAiPopulated ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    {isAiPopulated ? 'Accept & Save' : 'Add Flashcard'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === CREATE NEW DECK === */}
                    {actionType === 'new-deck' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Deck Title</label>
                                    <input
                                        type="text"
                                        value={newDeckTitle}
                                        onChange={e => setNewDeckTitle(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="e.g. Business Phrasal Verbs"
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Create a unique, descriptive name for your custom deck.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                                    <textarea
                                        value={newDeckDescription}
                                        onChange={e => setNewDeckDescription(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-input bg-background h-32 resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="What will students learn from this deck?"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleCreateDeck}
                                    disabled={!newDeckTitle}
                                    className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Book className="w-5 h-5" />
                                    Create Deck
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === ADD EXISTING CARD === */}
                    {actionType === 'existing-card' && (
                        <div className="space-y-4">
                            {/* Target Deck for Existing Card */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-1">Target Deck</label>
                                <select
                                    value={targetDeckId}
                                    onChange={e => setTargetDeckId(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-input bg-background"
                                >
                                    <option value="" disabled>Select a deck...</option>
                                    {availableDecks
                                        .filter(d => mode === 'tutor' || activeDeckIds.includes(d.id))
                                        .map(d => (
                                            <option key={d.id} value={d.id}>{d.title}</option>
                                        ))}
                                </select>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search library..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 p-2 rounded-lg border border-input bg-background"
                                />
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {availableCards
                                    .filter(c => c.word.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .slice(0, 20) // Limit results
                                    .map(card => (
                                        <div
                                            key={card.id}
                                            className="p-3 rounded-lg border border-border bg-card flex justify-between items-center group hover:border-primary/50"
                                        >
                                            <div>
                                                <p className="font-bold">{card.word}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[300px]">{card.definition}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (onAddExistingCard && targetDeckId) {
                                                        if (mode === 'student' && onAssignDeck && !activeDeckIds.includes(targetDeckId)) {
                                                            onAssignDeck(targetDeckId);
                                                        }
                                                        onAddExistingCard(card, targetDeckId);
                                                        onClose();
                                                    }
                                                }}
                                                disabled={!targetDeckId}
                                                className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* === ASSIGN EXISTING DECK === */}
                    {actionType === 'existing-deck' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search decks..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 p-2 rounded-lg border border-input bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                {availableDecks
                                    .filter(d => !activeDeckIds.includes(d.id))
                                    .filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(deck => (
                                        <div
                                            key={deck.id}
                                            onClick={() => {
                                                if (selectedItems.includes(deck.id)) {
                                                    setSelectedItems(prev => prev.filter(id => id !== deck.id));
                                                } else {
                                                    setSelectedItems(prev => [...prev, deck.id]);
                                                }
                                            }}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedItems.includes(deck.id) ? 'bg-primary/5 border-primary' : 'bg-card border-border hover:border-primary/50'}`}
                                        >
                                            <div>
                                                <h4 className="font-bold">{deck.title}</h4>
                                                <p className="text-sm text-muted-foreground">{deck.cards.length} cards</p>
                                            </div>
                                            {selectedItems.includes(deck.id) && <div className="w-4 h-4 rounded-full bg-primary" />}
                                        </div>
                                    ))}
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleAssignDeck}
                                    disabled={selectedItems.length === 0}
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Assign Selected Decks
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
