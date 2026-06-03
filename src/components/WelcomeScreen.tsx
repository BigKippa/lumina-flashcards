import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, MessageCircle, GitMerge, Users, MapPin, Shuffle, Clock, Heart, UserCircle, Bell } from 'lucide-react';
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

const CATEGORIES = [
    { 
        id: 'random', 
        label: 'Random Mix', 
        icon: Shuffle, 
        bgColor: 'bg-color2 hover:bg-color2/30 border-color2/20 text-color1', 
        iconColor: 'text-color2', 
        hoverBg: 'bg-color2'
    },
    { 
        id: 'vocabulary', 
        label: 'Vocabulary', 
        icon: BookOpen, 
        bgColor: 'bg-color4 hover:bg-color4/30 border-color4/20 text-color1', 
        iconColor: 'text-color4', 
        hoverBg: 'bg-color4'
    },
    { 
        id: 'idioms', 
        label: 'Idioms & Sayings', 
        icon: MessageCircle, 
        bgColor: 'bg-color5 hover:bg-color5/30 border-color5/20 text-color1', 
        iconColor: 'text-color5', 
        hoverBg: 'bg-color5'
    },
    { 
        id: 'phrasal-verbs', 
        label: 'Phrasal Verbs', 
        icon: GitMerge, 
        bgColor: 'bg-color3 hover:bg-color3/30 border-color3/20 text-color1', 
        iconColor: 'text-color3', 
        hoverBg: 'bg-color3'
    },
    { 
        id: 'collocations', 
        label: 'Phrases & Collocations', 
        icon: Users, 
        bgColor: 'bg-color2 hover:bg-color2/30 border-color2/20 text-color1', 
        iconColor: 'text-color2', 
        hoverBg: 'bg-color2'
    },
    { 
        id: 'prepositions', 
        label: 'Prepositions', 
        icon: MapPin, 
        bgColor: 'bg-color4 hover:bg-color4/30 border-color4/20 text-color1', 
        iconColor: 'text-color4', 
        hoverBg: 'bg-color4'
    },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onSelect, lastSession, favorites, onQuickStart, onSelectFavorite, onToggleFavorite, onNavigate }) => {
    const { t } = useTranslation();
    const [currentTime, setCurrentTime] = React.useState(new Date());

    // Live Clock Timer
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Get time of day for greeting
    const hour = currentTime.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

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
        <div className="flex flex-col items-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700 w-full py-8">

            {/* Student Hero Tile */}
            <div className="lumina-glow lumina-glow-hero hover-glow-5 bg-color5 border border-color5/50 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-md text-color1 w-full max-w-4xl mb-8">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

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
                            {t(`welcome.greeting.${timeOfDay}`)}, <span className="text-color1">{user.preferredName || user.firstName || user.username}</span>
                        </h2>
                        <div className="flex flex-col gap-y-1.5 mt-3 text-sm text-color1/70 font-medium">
                            <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-color1" /> <span className="text-color1 pointer-events-none">Language Learner</span></span>
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

                {/* Engagement / Notification Widgets (Right) */}
                <div className="flex flex-wrap md:flex-nowrap justify-center gap-4 relative z-10 w-full md:flex-1 md:justify-end">

                    {/* Inbox/Pending Widget */}
                    <div
                        onClick={() => alert('Messages Navigation - Coming Soon')}
                        className="bg-color2 hover:bg-color2/80 cursor-pointer transition-colors border border-color2/50 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm relative text-color5"
                    >
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-color5 rounded-full animate-pulse shadow-sm border border-color1/20"></div>
                        <Bell className="w-5 h-5 text-color5 mb-2" />
                        <span className="text-2xl font-bold text-color5">1</span>
                        <span className="text-xs text-color5 text-center leading-tight font-medium">New<br />Message</span>
                    </div>

                    {/* Active Decks Widget */}
                    <div
                        onClick={() => onNavigate && onNavigate('topic-selection', null)}
                        className="bg-color4 hover:bg-color4/80 cursor-pointer transition-colors border border-color4/50 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm text-color1"
                    >
                        <BookOpen className="w-5 h-5 text-color1 mb-2" />
                        <span className="text-2xl font-bold text-color1">{user.activeDeckIds?.length || 0}</span>
                        <span className="text-xs text-color1 text-center leading-tight">Active<br />Decks</span>
                    </div>
                </div>
            </div>

            {/* Quick Start & Favorites Header */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground opacity-80 pl-2">Dashboard</h3>
            </div>

            {/* Top Split: Quick Start & Favorites */}
            <div className="w-full max-w-4xl grid grid-cols-2 gap-6 mb-8 animate-in slide-in-from-bottom-6 duration-700 delay-200">

                {/* Left: Quick Start */}
                <div className="h-full">
                    {lastSession ? (
                        <div
                            onClick={onQuickStart}
                            className="bg-color3 hover:bg-color3/30 border border-color3/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color3 transition-colors opacity-20 group-hover:opacity-35 pointer-events-none"></div>
                            <div className="w-12 h-12 rounded-xl bg-color1 text-color3 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1">
                                <h2 className="text-xl font-bold mb-1">{t('welcome.quick_start')}</h2>
                                <p className="text-sm text-color1/80 line-clamp-2 capitalize">{t('welcome.resume', { deck: lastSession.label })}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-color3/50 border border-color3/20 rounded-2xl p-6 relative overflow-hidden h-full text-color1 opacity-80">
                            <div className="w-12 h-12 rounded-xl bg-color1/50 text-color3/80 flex items-center justify-center relative z-10 shadow-sm border border-color1/20 shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="relative z-10 font-medium flex-1 mt-4">
                                <h2 className="text-xl font-bold mb-1">{t('welcome.quick_start_title')}</h2>
                                <p className="text-sm text-color1/70 line-clamp-2">{t('welcome.no_recent_session')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Favorites Tile */}
                <div className="bg-color4 hover:bg-color4/30 border border-color4/20 rounded-2xl p-6 transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color4 transition-colors opacity-20 group-hover:opacity-35 pointer-events-none"></div>
                    
                    <div className="flex items-center gap-3 relative z-10 shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-color1 text-color4 flex items-center justify-center shadow-sm border border-color1/20">
                            <Heart className="w-6 h-6 fill-current" />
                        </div>
                        <h2 className="text-xl font-bold">{t('welcome.favorites')}</h2>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-between">
                        {/* List embedded in the tile */}
                        {favorites.length > 0 ? (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar w-full">
                                {favorites.map((fav) => (
                                    <div
                                        key={fav.id}
                                        className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors group/item"
                                    >
                                        <button
                                            onClick={() => onSelectFavorite(fav)}
                                            className="flex items-center gap-3 flex-1 text-left min-w-0 text-color1"
                                        >
                                            <div className="p-1.5 rounded-md bg-white/20 text-inherit opacity-85 group-hover/item:opacity-100 transition-colors">
                                                {fav.type === 'mode' ? <Clock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-semibold truncate text-inherit">{fav.label}</span>
                                                {fav.mode && <span className="text-[10px] opacity-75 uppercase tracking-wider">{fav.mode}</span>}
                                            </div>
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite(fav.deckId, fav.type, fav.label, fav.mode);
                                            }}
                                            className="p-2 opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 transition-transform text-color1"
                                            title="Remove from favorites"
                                        >
                                            <Heart className="w-4 h-4 fill-current text-color1" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 w-full">
                                <p className="text-sm text-color1/70">{t('welcome.no_favorites')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Categories Header */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground opacity-80 pl-2">Study Categories</h3>
            </div>

            {/* Categories Grid (Bottom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={`group relative overflow-hidden p-6 rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 text-left h-full flex flex-col gap-4 ${cat.bgColor}`}
                    >
                        {/* Blur decoration */}
                        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:${cat.hoverBg} transition-colors opacity-20 group-hover:opacity-35 pointer-events-none`}></div>

                        {/* Icon Box */}
                        <div className={`w-12 h-12 rounded-xl bg-color1 ${cat.iconColor} flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0`}>
                            <cat.icon className="w-6 h-6" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 font-medium flex-grow flex flex-col justify-end">
                            <h3 className="text-xl font-bold mb-1">
                                {t(`welcome.categories.${cat.id.replace(/-/g, '_')}`)}
                            </h3>
                            <p className="text-sm text-color1/80 mt-1">{getDesc(cat.id)}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
