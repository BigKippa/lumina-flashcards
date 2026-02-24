import { useState } from 'react';
import { AppSettings, UserProfile, LearningSession } from '../types';
import { X, Sparkles, User, Book, LogOut, History, ChevronLeft, Calendar, Clock, Trophy, Target, ArrowRight } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
    onOpenBulkImport: () => void;
    onNavigate: (path: 'profile' | 'flashcards') => void;
    onLogout: () => void;
    user: UserProfile | null;
}

type SettingsView = 'menu' | 'history' | 'history_detail';

export function SettingsModal({ isOpen, onClose, settings, onSave, onOpenBulkImport, onNavigate, onLogout, user }: SettingsModalProps) {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [currentView, setCurrentView] = useState<SettingsView>('menu');
    const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    // --- SUB-VIEWS ---

    const renderMenu = () => (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => onNavigate('profile')}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border hover:border-primary/50 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center mb-3 transition-colors">
                        <User className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-foreground">Manage Profile</span>
                </button>

                {user?.role === 'admin' && (
                    <button
                        onClick={() => onNavigate('flashcards')}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border hover:border-primary/50 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center mb-3 transition-colors">
                            <Book className="w-6 h-6" />
                        </div>
                        <span className="font-semibold text-foreground">Manage Flashcards</span>
                    </button>
                )}
            </div>

            <button
                onClick={() => setCurrentView('history')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border hover:border-blue-500/50 transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <History className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <span className="block font-semibold text-foreground">Learning History</span>
                        <span className="text-xs text-muted-foreground">View past sessions & stats</span>
                    </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
            </button>

            <div className="border-t border-border"></div>

            {/* Bulk Import Option */}
            <button
                onClick={() => {
                    onClose();
                    onOpenBulkImport();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 rounded-xl transition-colors font-bold"
            >
                <Sparkles className="w-5 h-5" />
                <span>Open Bulk Card Generator</span>
            </button>

            <div className="border-t border-border pt-6"></div>

            {/* General Settings */}
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Study Preferences</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-medium text-foreground">Auto-Advance Delay</label>
                            <span className="text-sm font-bold text-primary">{(localSettings.autoAdvanceDelay || 2000) / 1000}s</span>
                        </div>
                        <input
                            type="range"
                            min="2000"
                            max="15000"
                            step="500"
                            value={localSettings.autoAdvanceDelay || 2000}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, autoAdvanceDelay: parseInt(e.target.value) }))}
                            className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Wait time before next card (Voice & Manual modes).
                        </p>
                    </div>
                </div>
            </div>

            <div className="border-t border-border"></div>
            {/* Logout Option */}
            <button
                onClick={() => {
                    if (confirm('Are you sure you want to log out?')) {
                        onClose();
                        onLogout();
                    }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-xl transition-colors font-bold"
            >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
            </button>
        </div>
    );

    const renderHistory = () => {
        const history = user?.learningHistory || [];
        const reversedHistory = [...history].reverse();

        return (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 border-b border-border flex items-center gap-3">
                    <button onClick={() => setCurrentView('menu')} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-bold text-lg">Learning History</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {reversedHistory.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No learning sessions recorded yet.</p>
                        </div>
                    ) : (
                        reversedHistory.map(session => (
                            <button
                                key={session.id}
                                onClick={() => {
                                    setSelectedSession(session);
                                    setCurrentView('history_detail');
                                }}
                                className="w-full text-left p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        {formatDate(session.startTime)}
                                    </span>
                                    <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground">
                                        {formatDuration(session.durationSeconds)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex gap-4">
                                        <span className="text-muted-foreground">{session.summary.totalCards} cards</span>
                                        {session.summary.totalCards > 0 && (
                                            <span className={`font-semibold ${(session.summary.totalCorrect / session.summary.totalCards) > 0.8 ? 'text-green-600' : 'text-orange-500'
                                                }`}>
                                                {Math.round((session.summary.totalCorrect / session.summary.totalCards) * 100)}% Acc
                                            </span>
                                        )}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderDetail = () => {
        if (!selectedSession) return null;
        const { summary, activities } = selectedSession;

        return (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 border-b border-border flex items-center gap-3">
                    <button onClick={() => setCurrentView('history')} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h3 className="font-bold text-lg">Session Details</h3>
                        <p className="text-xs text-muted-foreground">{formatDate(selectedSession.startTime)}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                            <div className="flex items-center gap-2 mb-1 opacity-70">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Duration</span>
                            </div>
                            <p className="text-2xl font-black">{formatDuration(selectedSession.durationSeconds)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                            <div className="flex items-center gap-2 mb-1 opacity-70">
                                <Book className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Cards</span>
                            </div>
                            <p className="text-2xl font-black">{summary.totalCards}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                            <div className="flex items-center gap-2 mb-1 opacity-70">
                                <Target className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Accuracy</span>
                            </div>
                            <p className="text-2xl font-black">
                                {summary.totalCards > 0 ? Math.round((summary.totalCorrect / summary.totalCards) * 100) : 0}%
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
                            <div className="flex items-center gap-2 mb-1 opacity-70">
                                <Trophy className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Decks</span>
                            </div>
                            <p className="text-2xl font-black">{summary.decksStudied.length}</p>
                        </div>
                    </div>

                    {/* Decks List */}
                    <div className="mb-6">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                            <Book className="w-4 h-4 text-primary" />
                            Decks Studied
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {summary.decksStudied.map((deck, i) => (
                                <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                                    {deck}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div>
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                            <History className="w-4 h-4 text-primary" />
                            Activity Log
                        </h4>
                        <div className="space-y-3">
                            {activities.map((act) => (
                                <div key={act.id} className="p-3 rounded-lg bg-card border border-border flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${act.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {act.type === 'quiz' ? <Trophy className="w-3 h-3" /> : <Book className="w-3 h-3" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{act.deckName}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{act.type} Mode</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {act.type === 'quiz' ? (
                                            <span className={`font-bold ${act.stats.score && act.stats.score >= 80 ? 'text-green-600' : 'text-orange-500'}`}>
                                                {act.stats.score}%
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                {act.stats.correct} learned
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95">
                {/* Header for Main Menu Only */}
                {currentView === 'menu' && (
                    <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Menu</h2>
                            <p className="text-muted-foreground text-sm">Navigation & Settings</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <X className="w-6 h-6 text-muted-foreground" />
                        </button>
                    </div>
                )}

                {/* Dynamic Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background relative">
                    {currentView === 'menu' && renderMenu()}
                    {currentView === 'history' && renderHistory()}
                    {currentView === 'history_detail' && renderDetail()}
                </div>

                {/* Footer for Main Menu Only */}
                {currentView === 'menu' && (
                    <div className="p-6 border-t border-border bg-card flex justify-end gap-3 shrink-0">
                        <button
                            onClick={() => {
                                setLocalSettings(settings); // Reset
                                onClose();
                            }}
                            className="px-6 py-2 rounded-lg font-medium text-muted-foreground hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
