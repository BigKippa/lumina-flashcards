import React, { useState, useEffect } from 'react';
import { Word } from '../data/vocabulary';
import { Volume2, Square, Flag, Info, X } from 'lucide-react';

import { AppSettings } from '../types';

interface FlashcardProps {
    word: Word;
    isFlipped: boolean;
    onFlip: () => void;
    onReport?: () => void; // Optional reporting handler
    settings?: AppSettings;
    overrideFront?: string;
    overrideBack?: string;
    overlayHeader?: React.ReactNode;
    hideFlipHint?: boolean; // Optional flag to hide "Tap to reveal" hint
}

type AudioSection = 'none' | 'front-word' | 'back-word' | 'back-definition';

const Flashcard: React.FC<FlashcardProps> = ({ word, isFlipped, onFlip, onReport, settings, overrideFront, overrideBack, overlayHeader, hideFlipHint = false }) => {
    const categoryStyle = (settings && word.category) ? settings.categories[word.category] : undefined;

    // Default or Custom Colors
    const bgStyle = categoryStyle ? { backgroundColor: categoryStyle.backgroundColor, borderColor: categoryStyle.borderColor } : {};
    const titleStyle = categoryStyle ? { color: categoryStyle.titleColor } : {};
    const textStyle = categoryStyle ? { color: categoryStyle.textColor } : {};

    const [playingSection, setPlayingSection] = useState<AudioSection>('none');
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    // Reset audio when card flips
    useEffect(() => {
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingSection('none');
        setShowInfo(false);
    }, [isFlipped, word]);

    const playAudio = (text: string, section: AudioSection, rate: number = 0.8) => {
        // Stop any previous audio
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // If currently playing this section, stop it (toggle off)
        if (playingSection === section) {
            setPlayingSection('none');
            return;
        }

        // Custom Audio Logic
        const isWordAudio = text === word.word && word.audioUrl;

        if (isWordAudio) {
            const audio = new Audio(word.audioUrl);
            audioRef.current = audio;
            audio.onplay = () => setPlayingSection(section);
            audio.onended = () => {
                setPlayingSection('none');
                audioRef.current = null;
            };
            audio.onerror = () => {
                setPlayingSection('none');
                audioRef.current = null;
            };
            audio.play().catch(e => console.error("Audio playback error:", e));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = rate;

        utterance.onstart = () => setPlayingSection(section);
        utterance.onend = () => setPlayingSection('none');
        utterance.onerror = () => setPlayingSection('none');

        window.speechSynthesis.speak(utterance);
    };

    const handlePlayFrontWord = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Play the visible text (word or definition)
        playAudio(overrideFront || word.word, 'front-word', 0.8);
    };

    const handlePlayBackWord = (e: React.MouseEvent) => {
        e.stopPropagation();
        playAudio(overrideBack || word.word, 'back-word', 0.8);
    };

    const handlePlayDefinition = (e: React.MouseEvent) => {
        e.stopPropagation();
        playAudio(`${word.definition}. For example: ${word.example}`, 'back-definition', 0.85);
    };

    const renderAudioButton = (section: AudioSection, handler: (e: React.MouseEvent) => void, title: string, sizeClass = "w-5 h-5") => {
        if (word.disableAudio) return null;
        const isPlaying = playingSection === section;
        return (
            <button
                onClick={handler}
                className={`rounded-full transition-all active:scale-95 flex items-center justify-center ${isPlaying
                    ? "bg-accent text-accent-foreground hover:bg-accent/90 p-2"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 p-2"
                    } ${section.startsWith('back') ? "bg-primary/20 hover:bg-primary/40 text-primary" : ""}`}
                title={isPlaying ? "Stop" : title}
            >
                {isPlaying ? <Square className={`${sizeClass} fill-current`} /> : <Volume2 className={sizeClass} />}
            </button>
        );
    };

    const renderInfoOverlay = () => {
        if (!showInfo) return null;
        return (
            <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowInfo(false); }}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold mb-4 text-foreground">Card Information</h3>
                <div className="space-y-3 text-sm text-muted-foreground w-full max-w-[200px]">
                    <div className="flex justify-between border-b border-border/50 pb-1">
                        <span className="font-medium">Creator:</span>
                        <span>{word.creatorUsername || 'System'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-1">
                        <span className="font-medium">Created:</span>
                        <span>{word.createdAt ? new Date(word.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-1">
                        <span className="font-medium">Views:</span>
                        <span>{word.viewCount || 0}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-1">
                        <span className="font-medium">Downloads:</span>
                        <span>{word.downloadCount || 0}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                        <span className="font-medium">Language:</span>
                        <span>{word.languageCategory || 'General'}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="group h-72 w-full max-w-md perspective-1000 cursor-pointer relative"
            onClick={onFlip}
        >
            {/* Header Overlay (Static) */}
            {overlayHeader && (
                <div className="absolute inset-0 z-50 pointer-events-none p-4 flex justify-between items-start">
                    {overlayHeader}
                </div>
            )}

            <div
                className={`relative h-full w-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 h-full w-full items-center justify-center rounded-2xl bg-card border border-border/50 shadow-xl [backface-visibility:hidden] flex flex-col p-6 overflow-hidden transition-colors duration-300"
                    style={bgStyle}
                >
                    {/* Report Flag (Front) */}
                    {onReport && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onReport(); }}
                            className="absolute top-4 left-4 p-2 text-muted-foreground/50 hover:text-orange-500 transition-colors z-20"
                            title="Report Issue with this card"
                        >
                            <Flag className="w-4 h-4" />
                        </button>
                    )}
                    
                    {/* Info Button (Front) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                        className="absolute top-4 right-4 p-2 text-muted-foreground/50 hover:text-primary transition-colors z-20"
                        title="View Card Info"
                    >
                        <Info className="w-4 h-4" />
                    </button>

                    {renderInfoOverlay()}

                    {/* Background Image if available */}
                    {word.imageUrl && (
                        <div className="absolute inset-0 z-0 opacity-10">
                            <img src={word.imageUrl} alt="Background" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 w-full">
                        {word.imageUrl && (
                            <div className="mb-4 rounded-lg overflow-hidden h-32 w-full max-w-[200px] shadow-sm border border-border/50">
                                <img src={word.imageUrl} alt={word.word} className="w-full h-full object-cover" />
                            </div>
                        )}

                        <h2
                            className="text-4xl font-bold text-foreground mb-2 transition-colors duration-300"
                            style={titleStyle}
                        >
                            {overrideFront || word.word}
                        </h2>


                        <div className="flex flex-col items-center gap-1 mt-2">
                            <div className="flex items-center gap-3">
                                {word.phonetic && !overrideFront && <p className="text-muted-foreground text-lg font-mono">{word.phonetic}</p>}
                                {renderAudioButton('front-word', handlePlayFrontWord, overrideFront ? "Listen to definition" : "Listen to word")}
                            </div>
                            {word.customPronunciation && !overrideFront && (
                                <p className="text-sm text-primary/80 font-medium italic">"{word.customPronunciation}"</p>
                            )}
                        </div>
                    </div>
                    {/* Tap to Reveal Hint - Hidden dynamically */}
                    {!hideFlipHint && <div className="text-muted-foreground/60 text-sm relative z-10">Tap to reveal meaning</div>}
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 h-full w-full items-center justify-center rounded-2xl bg-card border border-primary/20 shadow-xl [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col p-6 overflow-hidden transition-colors duration-300"
                    style={bgStyle}
                >
                    {/* Report Flag (Back) */}
                    {onReport && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onReport(); }}
                            className="absolute top-4 left-4 p-2 text-muted-foreground/50 hover:text-orange-500 transition-colors z-20"
                            title="Report Issue with this card"
                        >
                            <Flag className="w-4 h-4" />
                        </button>
                    )}

                    {/* Info Button (Back) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                        className="absolute top-4 right-4 p-2 text-muted-foreground/50 hover:text-primary transition-colors z-20"
                        title="View Card Info"
                    >
                        <Info className="w-4 h-4" />
                    </button>

                    {renderInfoOverlay()}

                    <div className="flex-1 flex flex-col items-center justify-center text-center w-full overflow-y-auto custom-scrollbar">

                        {/* Word Section */}
                        <div className="flex items-center justify-center gap-3 mb-2 flex-shrink-0">
                            <h3
                                className="text-2xl font-bold text-foreground transition-colors duration-300"
                                style={titleStyle}
                            >
                                {overrideBack || word.word}
                            </h3>
                            {renderAudioButton('back-word', handlePlayBackWord, "Listen to word", "w-4 h-4")}
                        </div>

                        <div className="w-12 h-1 bg-primary/20 rounded-full mb-4 mx-auto flex-shrink-0"></div>

                        {/* Media Section (Back) */}
                        {(word.imageUrl || word.videoUrl) && (
                            <div className="mb-4 flex gap-2 justify-center w-full">
                                {word.imageUrl && (
                                    <div className="rounded-lg overflow-hidden h-24 w-auto shadow-sm border border-border/50">
                                        <img src={word.imageUrl} alt={word.word} className="h-full w-auto object-cover" />
                                    </div>
                                )}
                                {word.videoUrl && (
                                    <div className="rounded-lg overflow-hidden h-24 w-auto shadow-sm border border-border/50 aspect-video bg-black">
                                        <video src={word.videoUrl} controls className="h-full w-full" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Definition Section */}
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <div className="flex items-center gap-3">
                                <p
                                    className="text-lg font-medium text-foreground/90 transition-colors duration-300"
                                    style={textStyle}
                                >
                                    {word.definition}
                                </p>
                                {renderAudioButton('back-definition', handlePlayDefinition, "Listen to definition", "w-4 h-4")}
                            </div>
                        </div>

                        <p
                            className="text-muted-foreground italic text-sm transition-colors duration-300"
                            style={textStyle}
                        >
                            "{word.example}"
                        </p>

                    </div>
                </div>
            </div>
        </div >
    );
};

export default Flashcard;
