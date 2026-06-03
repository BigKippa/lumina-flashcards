import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, MessageCircle, GitMerge, Users, MapPin, Shuffle, Clock, Heart, UserCircle, Bell, X } from 'lucide-react';
import { FavoriteItem, SessionInfo, UserProfile } from '../types';

interface WelcomeScreenProps {
    user: UserProfile;
    onSelect: (category: string) => void;
    lastSession?: SessionInfo;
    favorites: FavoriteItem[];
    onQuickStart: () => void;
    onSelectFavorite: (fav: FavoriteItem) => void;
    onToggleFavorite: (id: string, type: 'deck' | 'mode', label: string, modeName?: string) => void;
    onNavigate?: (mode: any, deckId?: string | null) => void;
    onUpdateProfile?: (oldUsername: string, newUserData: Partial<UserProfile>) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onSelect, lastSession, favorites, onQuickStart, onSelectFavorite, onToggleFavorite, onNavigate }) => {
    const { t } = useTranslation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

    // Live Clock Timer
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Descriptions lookup for rich cards
    const getDesc = (id: string) => {
        switch (id) {
            case 'random': return "Shuffle words from all topics and test your knowledge.";
            case 'vocabulary': return "Explore words, definitions, and usage in daily conversation.";
            case 'idioms': return "Master figurative expressions and common idioms.";
            case 'phrasal-verbs': return "Understand verbs combined with prepositions or adverbs.";
            case 'collocations': return "Learn natural word pairings and common phrases.";
            case 'prepositions': return "Practice prepositions of time, place, and movement.";
            default: return "Start a new interactive study session.";
        }
    };

    return (
        <div className="w-full h-full bg-background text-foreground flex flex-col">
            {/* Main Content */}
            <main data-dev-id="student-main-content" className="flex-1 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div data-dev-id="student-header-title">
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-primary" />
                            Student Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back to your personalized study space
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-6 max-w-6xl mx-auto mt-6">

                    {/* Student Hero Tile */}
                    <div data-dev-id="student-hero-tile" className="lumina-glow lumina-glow-hero hover-glow-5 bg-color5 border border-color5/50 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-md text-color1">

                        {/* Profile Info (Left) */}
                        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto md:min-w-[320px] shrink-0">
                            <div className="w-24 h-24 rounded-2xl bg-color1/20 flex items-center justify-center text-color1 shadow-inner border border-color1/20 flex-shrink-0 overflow-hidden">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Student avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-12 h-12" />
                                )}
                            </div>
                            <div className="flex-1 z-10">
                                <h2 className="text-3xl font-bold mb-2 text-color1">
                                    {user.preferredName || user.firstName || user.username}
                                </h2>
                                <div className="flex flex-col gap-y-1.5 mt-3 text-sm text-color1/70 font-medium">
                                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-color1" /> <span className="text-color1 pointer-events-none">Language Student</span></span>
                                    <span className="flex items-center gap-2 hover:text-color1 transition-colors">
                                        <MapPin className="w-4 h-4" />
                                        {user.currentCity ? `${user.currentCity}, ${user.currentCountry}` : (user.currentCountry || 'Location Not Set')}
                                    </span>
                                    <span className="flex items-center gap-2 hover:text-color1 transition-colors">
                                        <Clock className="w-4 h-4" />
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: user.timeZone || undefined })} ({user.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time'})
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 flex items-center justify-center text-[10px] bg-color5/50 rounded-sm border border-zinc-500/50">📅</span>
                                        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', timeZone: user.timeZone || undefined })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Stats & Time (Right) */}
                        <div className="flex flex-wrap md:flex-nowrap justify-center gap-4 relative z-10 w-full md:flex-1">

                            {/* Active Decks Widget */}
                            <div
                                onClick={() => onNavigate && onNavigate('topic-selection', null)}
                                className="bg-color4 hover:bg-color4/80 cursor-pointer transition-colors border border-color4/50 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm"
                            >
                                <BookOpen className="w-5 h-5 text-color5 mb-2" />
                                <span className="text-2xl font-bold text-color1">{user.activeDeckIds?.length || 0}</span>
                                <span className="text-xs text-color1 text-center leading-tight">Active<br />Decks</span>
                            </div>

                            {/* Inbox/Pending Widget */}
                            <div
                                onClick={() => alert('Messages Navigation - Coming Soon')}
                                className="bg-color2 hover:bg-color2/80 cursor-pointer transition-colors border border-color2/50 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm relative"
                            >
                                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-color5 rounded-full animate-pulse shadow-sm border border-color1/20"></div>
                                <Bell className="w-5 h-5 text-color5 mb-2" />
                                <span className="text-2xl font-bold text-color5">1</span>
                                <span className="text-xs text-color5 text-center leading-tight font-medium">New<br />Messages</span>
                            </div>

                            {/* Quick Start Widget */}
                            <div
                                onClick={onQuickStart}
                                className={`bg-color3 hover:bg-color3/80 cursor-pointer transition-colors border border-color3/50 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm group ${!lastSession ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={lastSession ? `Resume ${lastSession.label}` : 'No recent session'}
                            >
                                <Clock className="w-5 h-5 text-color5 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-2xl font-bold invisible block">&nbsp;</span>
                                <span className="text-xs font-bold text-color5 text-center leading-tight">Quick<br />Start</span>
                            </div>

                            {/* Favorites Widget */}
                            <div
                                onClick={() => setIsFavoritesModalOpen(true)}
                                className="bg-color3 hover:bg-color3/30 cursor-pointer transition-colors backdrop-blur-sm border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm group"
                            >
                                <Heart className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform fill-current" />
                                <span className="text-2xl font-bold invisible block">&nbsp;</span>
                                <span className="text-xs font-bold text-color1 text-center leading-tight">Favorites</span>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Header Elements */}
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-foreground opacity-80 pl-2">Dashboard Actions</h3>
                    </div>

                    {/* Categories Grid (Bottom) */}
                    <div data-dev-id="student-tiles-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* Card 1: Random Mix */}
                        <div
                            onClick={() => onSelect('random')}
                            className="bg-color2 hover:bg-color2/30 border border-color2/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color2 transition-colors"></div>
                            <div className="w-12 h-12 rounded-xl bg-color1 text-color2 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                <Shuffle className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">{t('welcome.categories.random')}</h2>
                                <p className="text-sm text-color1/80 line-clamp-2">{getDesc('random')}</p>
                            </div>
                        </div>

                        {/* Card 2: Vocabulary */}
                        <div
                            onClick={() => onSelect('vocabulary')}
                            className="bg-color4 hover:bg-color4/30 border border-color4/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color4 transition-colors"></div>
                            <div className="w-12 h-12 rounded-xl bg-color1 text-color4 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">{t('welcome.categories.vocabulary')}</h2>
                                <p className="text-sm text-color1/80 line-clamp-2">{getDesc('vocabulary')}</p>
                            </div>
                        </div>

                        {/* Card 3: Idioms & Sayings */}
                        <div
                            onClick={() => onSelect('idioms')}
                            className="bg-color5 hover:bg-color5/30 border border-color5/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color5 transition-colors"></div>
                            <div className="w-12 h-12 rounded-xl bg-color1 text-color5 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">{t('welcome.categories.idioms')}</h2>
                                <p className="text-sm text-color1/80 line-clamp-2">{getDesc('idioms')}</p>
                            </div>
                        </div>

                        {/* Card 4: Phrasal Verbs */}
                        <div
                            onClick={() => onSelect('phrasal-verbs')}
                            className="bg-color3 hover:bg-color3/30 border border-color3/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color3 transition-colors"></div>
                            <div className="w-12 h-12 rounded-xl bg-color1 text-color3 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                <GitMerge className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">{t('welcome.categories.phrasal_verbs')}</h2>
                                <p className="text-sm text-color1/80 line-clamp-2">{getDesc('phrasal-verbs')}</p>
                            </div>
                        </div>

                        {/* Card 5: Phrases & Collocations */}
                        <div
                            onClick={() => onSelect('collocations')}
                            className="bg-color2 hover:bg-color2/30 border border-color2/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color2 transition-colors"></div>
                            <div className="w-12 h-12 rounded-xl bg-color1 text-color2 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">{t('welcome.categories.collocations')}</h2>
                                <p className="text-sm text-color1/80 line-clamp-2">{getDesc('collocations')}</p>
                            </div>
                        </div>

                        {/* Card 6: Prepositions */}
                        <div
                            onClick={() => onSelect('prepositions')}
                            className="bg-color4 hover:bg-color4/30 border border-color4/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color4 transition-colors"></div>
                            <div className="w-12 h-12 rounded-xl bg-color1 text-color4 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">{t('welcome.categories.prepositions')}</h2>
                                <p className="text-sm text-color1/80 line-clamp-2">{getDesc('prepositions')}</p>
                            </div>
                        </div>
                    </div>

                </div>

            </main>

            {/* Favorites Modal */}
            {isFavoritesModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[480px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-foreground flex items-center gap-2 text-xl">
                                <Heart className="w-6 h-6 text-red-500 fill-current" /> {t('welcome.favorites')}
                            </h3>
                            <button 
                                onClick={() => setIsFavoritesModalOpen(false)} 
                                className="text-muted-foreground hover:text-foreground bg-black/5 dark:bg-white/5 p-1.5 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* List of Favorites */}
                        {favorites.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {favorites.map((fav) => (
                                    <div
                                        key={fav.id}
                                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors group/item"
                                    >
                                        <button
                                            onClick={() => {
                                                onSelectFavorite(fav);
                                                setIsFavoritesModalOpen(false);
                                            }}
                                            className="flex items-center gap-3 flex-1 text-left min-w-0"
                                        >
                                            <div className="p-2 rounded-lg bg-background text-muted-foreground group-hover/item:text-primary transition-colors">
                                                {fav.type === 'mode' ? <Clock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-semibold truncate text-foreground/90">{fav.label}</span>
                                                {fav.mode && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{fav.mode}</span>}
                                            </div>
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite(fav.deckId, fav.type, fav.label, fav.mode);
                                            }}
                                            className="p-2 text-red-500 hover:scale-110 active:scale-95 transition-transform"
                                            title="Remove from favorites"
                                        >
                                            <Heart className="w-4.5 h-4.5 fill-current" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">{t('welcome.no_favorites')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
