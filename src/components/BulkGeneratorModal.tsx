import React, { useState, useRef } from 'react';
import { X, Sparkles, Upload, FileText, Check, AlertCircle, Loader2, Link, Image as ImageIcon, Video, Mic } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Word } from '../data/vocabulary';

interface BulkGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cards: Word[]) => void;
    apiKey?: string;
}

export const BulkGeneratorModal: React.FC<BulkGeneratorModalProps> = ({ isOpen, onClose, onSave, apiKey }) => {
    const [activeTab, setActiveTab] = useState<'ai' | 'url' | 'media' | 'file'>('ai');
    const [textInput, setTextInput] = useState(''); // For Text and URL content
    const [urlInput, setUrlInput] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);

    const [generatedCards, setGeneratedCards] = useState<Word[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // --- Helpers ---

    const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
        };
    };

    const handleAIGenerate = async () => {
        if (!apiKey) {
            setError("Please add your Gemini API Key in Settings first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setStatusMessage("Initializing Gemini...");

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            // Flash model is faster/cheaper and good for multimodal
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            let promptParts: any[] = [];
            let systemInstruction = `
                You are an expert English language teacher. 
                Extract useful vocabulary (CEFR B1-C2) from the input and convert it into flashcards.
                
                Return ONLY a JSON array of objects. Do not include markdown formatting like \`\`\`json.
                Each object must have:
                - "word": The vocabulary word or phrase.
                - "definition": A clear, concise definition (CEFR B2 level).
                - "example": A short example sentence relevant to the context if possible.
                - "phonetic": IPA pronunciation (estimate if unknown).
            `;

            if (activeTab === 'ai') {
                if (!textInput.trim()) throw new Error("Please enter some text.");
                promptParts = [systemInstruction, `Text to process:\n"${textInput}"`];
                setStatusMessage("Analyzing text...");
            }
            else if (activeTab === 'url') {
                if (!urlInput.trim()) throw new Error("Please enter a URL.");
                // If we succeeded in fetching text, use it.
                if (textInput.trim()) {
                    promptParts = [systemInstruction, `Context from URL (${urlInput}):\n"${textInput}"`];
                } else {
                    // Try to ask Gemini to browse? No, it can't interact with live web.
                    // We rely on the user having run 'Fetch Content' or fallback.
                    throw new Error("Please click 'Fetch Content' first, or paste the text manually if fetching failed.");
                }
                setStatusMessage("Analyzing content...");
            }
            else if (activeTab === 'media') {
                if (!mediaFile) throw new Error("Please upload an image, audio, or video file.");

                const mediaPart = await fileToGenerativePart(mediaFile);
                promptParts = [
                    systemInstruction,
                    "Analyze this media. Identify key objects, actions, text, or spoken words that would be good vocabulary words.",
                    mediaPart
                ];
                setStatusMessage("Uploading & Analyzing media...");
            }

            const result = await model.generateContent(promptParts);
            setStatusMessage("Processing response...");
            const response = await result.response;
            const text = response.text();

            // Clean markdown
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanText);

            if (!Array.isArray(data)) throw new Error("AI returned invalid format.");

            const cards: Word[] = data.map((item: any) => ({
                id: Date.now() + Math.random(),
                word: item.word || "Unknown",
                definition: item.definition || "No definition",
                example: item.example || "",
                phonetic: item.phonetic || ""
            }));

            setGeneratedCards(cards);
        } catch (err: any) {
            console.error("AI Gen Error:", err);
            setError(err.message || "Failed to generate cards.");
        } finally {
            setIsLoading(false);
            setStatusMessage('');
        }
    };

    const handleFetchUrl = async () => {
        if (!urlInput) return;
        setIsLoading(true);
        setError(null);
        setStatusMessage("Fetching URL...");

        try {
            // Try simple fetch - likely to fail for many sites due to CORS
            const res = await fetch(urlInput);
            if (!res.ok) throw new Error("Failed to fetch");
            const html = await res.text();

            // basic text extraction
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            // Remove scripts and styles
            doc.querySelectorAll('script, style, meta, noscript').forEach(el => el.remove());
            const text = doc.body.textContent || "";
            const clean = text.replace(/\s+/g, ' ').trim().slice(0, 15000); // Limit context

            setTextInput(clean);
            setStatusMessage("Content fetched! Ready to generate.");
        } catch (e) {
            console.error(e);
            setError("Could not fetch URL directly (CORS restriction). Please copy and paste the text instead.");
        } finally {
            setIsLoading(false);
            // Don't clear status immediately if success, but we handled it above
            if (error) setStatusMessage('');
        }
    };

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit check (Gemini allows 20MB inline)
            setError("File too large. Please use files under 10MB.");
            return;
        }

        setMediaFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setMediaPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        setError(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        const processRows = (rows: any[]) => {
            const cards: Word[] = rows.map((row: any) => ({
                id: Date.now() + Math.random(),
                word: row.Word || row.word || row[0],
                definition: row.Definition || row.definition || row[1],
                example: row.Example || row.example || row[2] || '',
                phonetic: row.Phonetic || row.phonetic || row[3] || ''
            })).filter(c => c.word && c.definition);

            if (cards.length === 0) {
                setError("No valid cards found. Ensure headers are Word, Definition, Example.");
            } else {
                setGeneratedCards(cards);
            }
            setIsLoading(false);
        };

        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                complete: (results) => processRows(results.data),
                error: (err) => {
                    setError("CSV Parse Error: " + err.message);
                    setIsLoading(false);
                }
            });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                processRows(data);
            };
            reader.readAsBinaryString(file);
        } else {
            setError("Unsupported file type. Use CSV or Excel.");
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        onSave(generatedCards);
        onClose();
        setGeneratedCards([]);
        setTextInput('');
        setUrlInput('');
        setMediaFile(null);
        setMediaPreview(null);
    };

    const handleDownloadTemplate = () => {
        const csvContent = "Word,Definition,Example\nApple,A round fruit with red or green skin,I ate an apple for lunch.\nRun,To move at a speed faster than a walk,I run every morning.";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'flashcards_template.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-5xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">

                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-primary" />
                            Bulk Import & AI Studio
                        </h2>
                        <p className="text-muted-foreground text-sm">Generate cards from text, URLs, images, or audio.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar / Tabs */}
                    <div className="w-56 border-r border-border bg-secondary/10 p-3 space-y-1">
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'ai' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-secondary text-muted-foreground'}`}
                        >
                            <Sparkles className="w-4 h-4" /> Text Input
                        </button>
                        <button
                            onClick={() => setActiveTab('url')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'url' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-secondary text-muted-foreground'}`}
                        >
                            <Link className="w-4 h-4" /> Website URL
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'media' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-secondary text-muted-foreground'}`}
                        >
                            <ImageIcon className="w-4 h-4" /> Image / Audio
                        </button>
                        <hr className="border-border/50 my-2" />
                        <button
                            onClick={() => setActiveTab('file')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'file' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-secondary text-muted-foreground'}`}
                        >
                            <FileText className="w-4 h-4" /> CSV / Excel
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto bg-background/50 relative">
                        {error && (
                            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                <p className="text-lg font-medium text-foreground">{statusMessage || "Processing..."}</p>
                            </div>
                        )}

                        {generatedCards.length === 0 ? (
                            <div className="h-full flex flex-col">
                                {activeTab === 'ai' && (
                                    <div className="flex flex-col h-full animate-in fade-in">
                                        <label className="text-sm font-medium text-muted-foreground mb-2">Paste text here (article, story, notes)</label>
                                        <textarea
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            className="flex-1 p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none resize-none mb-4 font-mono text-sm"
                                            placeholder="Paste text to analyze..."
                                        />
                                        <div className="flex justify-end">
                                            <button onClick={handleAIGenerate} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20">
                                                <Sparkles className="w-5 h-5" /> Generate
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'url' && (
                                    <div className="flex flex-col h-full animate-in fade-in max-w-2xl mx-auto w-full pt-10">
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Link className="w-6 h-6 text-primary" /> Extract from Web
                                        </h3>
                                        <div className="flex gap-2 mb-6">
                                            <input
                                                value={urlInput}
                                                onChange={(e) => setUrlInput(e.target.value)}
                                                placeholder="https://example.com/article"
                                                className="flex-1 px-4 py-3 rounded-xl border border-border bg-input outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <button
                                                onClick={handleFetchUrl}
                                                className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-medium transition-colors"
                                            >
                                                Fetch
                                            </button>
                                        </div>

                                        {textInput && (
                                            <div className="flex-1 flex flex-col">
                                                <label className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Extracted Content Preview</label>
                                                <textarea
                                                    value={textInput}
                                                    onChange={(e) => setTextInput(e.target.value)}
                                                    className="flex-1 p-4 rounded-xl border border-border bg-muted/30 text-sm font-mono resize-none outline-none mb-4"
                                                />
                                                <button onClick={handleAIGenerate} className="self-end flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20">
                                                    <Sparkles className="w-5 h-5" /> Analyze Content
                                                </button>
                                            </div>
                                        )}

                                        {!textInput && (
                                            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-sm">
                                                <p className="font-bold mb-1">CORS Warning</p>
                                                Many websites block automated access. If 'Fetch' fails, please copy the text from the website and paste it into the <b>Text Input</b> tab.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'media' && (
                                    <div className="flex flex-col h-full animate-in fade-in items-center justify-center">
                                        {!mediaFile ? (
                                            <div className="text-center p-10 border-2 border-dashed border-border rounded-xl bg-card/50 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
                                                    <Upload className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-xl font-bold mb-2">Upload Media</h3>
                                                <p className="text-muted-foreground mb-6">
                                                    Supports Images (PNG, JPG), Audio (MP3), or Video (MP4) <br />
                                                    <span className="text-xs opacity-70">Max 10MB</span>
                                                </p>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*,audio/*,video/*"
                                                    className="hidden"
                                                    onChange={handleMediaUpload}
                                                />
                                                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
                                                    Select File
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full max-w-lg flex flex-col items-center">
                                                {/* Preview */}
                                                <div className="w-full aspect-video rounded-xl bg-black/5 border border-border mb-6 overflow-hidden flex items-center justify-center relative group">
                                                    {mediaFile.type.startsWith('image') && mediaPreview && (
                                                        <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain" />
                                                    )}
                                                    {mediaFile.type.startsWith('audio') && (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Mic className="w-12 h-12 text-primary animate-pulse" />
                                                            <p className="font-mono text-sm">{mediaFile.name}</p>
                                                        </div>
                                                    )}
                                                    {mediaFile.type.startsWith('video') && mediaPreview && (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Video className="w-12 h-12 text-primary" />
                                                            <p className="font-mono text-sm">{mediaFile.name}</p>
                                                            <p className="text-xs text-muted-foreground">(Video preview not supported yet)</p>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <button onClick={handleAIGenerate} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20">
                                                    <Sparkles className="w-5 h-5" /> Analyze Media
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'file' && (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-card/50 animate-in fade-in">
                                        <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium text-foreground">Upload CSV or Excel</h3>
                                        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                                            Headers: <b>Word, Definition, Example</b>
                                        </p>
                                        <label className="cursor-pointer px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-colors font-medium mb-4">
                                            Choose File
                                            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Download Template (CSV)
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Preview State (Shared) */
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-foreground">
                                        Preview ({generatedCards.length} cards)
                                    </h3>
                                    <button onClick={() => setGeneratedCards([])} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
                                        Discard
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                                    <div className="space-y-3">
                                        {generatedCards.map((card, idx) => (
                                            <div key={idx} className="p-4 rounded-xl border border-border bg-card flex gap-4 items-start">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-xs text-muted-foreground block mb-1">Word</label>
                                                        <div className="font-bold text-foreground">{card.word}</div>
                                                        {card.phonetic && <div className="text-xs text-muted-foreground">{card.phonetic}</div>}
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground block mb-1">Definition</label>
                                                        <div className="text-sm text-foreground">{card.definition}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground block mb-1">Example</label>
                                                        <div className="text-sm text-muted-foreground italic">"{card.example}"</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                    <button
                                        onClick={handleConfirm}
                                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 font-bold"
                                    >
                                        <Check className="w-5 h-5" />
                                        Add Cards
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
