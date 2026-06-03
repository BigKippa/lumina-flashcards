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
    { id: 'random', label: 'Random Mix', icon: Shuffle, color: 'opacity-90', bgColor: 'bg-color2 text-color2-foreground border-color5/20 hover:bg-color2/80 hover:scale-105' },
    { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen, color: 'opacity-90', bgColor: 'bg-color3 text-color3-foreground border-color5/20 hover:bg-color3/80 hover:scale-105' },
    { id: 'idioms', label: 'Idioms & Sayings', icon: MessageCircle, color: 'opacity-90', bgColor: 'bg-color4 text-color4-foreground border-color5/20 hover:bg-color4/80 hover:scale-105' },
    { id: 'phrasal-verbs', label: 'Phrasal Verbs', icon: GitMerge, color: 'opacity-90', bgColor: 'bg-color5 text-color5-foreground border-color1/20 hover:bg-color5/80 hover:scale-105' },
    { id: 'collocations', label: 'Phrases & Collocations', icon: Users, color: 'opacity-90', bgColor: 'bg-color1 text-color1-foreground border-color5/20 hover:bg-color1/80 hover:scale-105' },
    { id: 'prepositions', label: 'Prepositions', icon: MapPin, color: 'opacity-90', bgColor: 'bg-color2 text-color2-foreground border-color5/20 hover:bg-color2/80 hover:scale-105' },
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

    // Helper for base tile
    const baseTileClass = "group relative overflow-hidden p-6 rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 text-left h-full flex flex-col justify-between";

    return (
        <div className="flex flex-col items-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700 w-full py-8">

            {/* Student Hero Tile */}
            <div className="bg-zinc-700 border border-zinc-600 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-md relative overflow-hidden text-zinc-100 w-full max-w-4xl mb-8">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {/* Profile Info (Left) */}
                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto md:min-w-[320px] shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/20 flex-shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Student avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserCircle className="w-12 h-12" />
                        )}
                    </div>
                    <div className="flex-1 z-10">
                        <h2 className="text-3xl font-bold mb-2 text-white">
                            {t(`welcome.greeting.${timeOfDay}`)}, <span className="text-white">{user.preferredName || user.firstName || user.username}</span>
                        </h2>
                        <div className="flex flex-col gap-y-1.5 mt-3 text-sm text-zinc-400 font-medium">
                            <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {user.currentCity ? `${user.currentCity}, ${user.currentCountry}` : (user.currentCountry || 'Location Not Set')}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: user.timeZone || undefined })} ({user.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time'})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Engagement / Notification Widgets (Right) */}
                <div className="flex flex-wrap md:flex-nowrap justify-center gap-4 relative z-10 w-full md:flex-1 md:justify-end">

                    {/* Inbox/Pending Widget */}
                    <div
                        onClick={() => alert('Messages Navigation - Coming Soon')}
                        className="bg-green-500/20 hover:bg-green-500/30 cursor-pointer transition-colors backdrop-blur-sm border border-green-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm relative"
                    >
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                        <Bell className="w-5 h-5 text-green-400 mb-2" />
                        <span className="text-2xl font-bold text-white">1</span>
                        <span className="text-xs text-zinc-300 text-center line-clamp-2">New<br />Message</span>
                    </div>

                    {/* Active Decks Widget */}
                    <div
                        onClick={() => onNavigate && onNavigate('topic-selection', null)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 cursor-pointer transition-colors backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm"
                    >
                        <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
                        <span className="text-2xl font-bold text-white">{user.activeDeckIds?.length || 0}</span>
                        <span className="text-xs text-zinc-300 text-center line-clamp-2">Active<br />Decks</span>
                    </div>
                </div>
            </div>

            {/* Top Split: Quick Start & Favorites */}
            <div className="w-full max-w-4xl grid grid-cols-2 gap-6 mb-6 animate-in slide-in-from-bottom-6 duration-700 delay-200">

                {/* Left: Quick Start - Styled exactly like a category tile */}
                <div className="h-full">
                    {lastSession ? (
                        <button
                            onClick={onQuickStart}
                            className={`${baseTileClass} bg-color3 text-color3-foreground border-color5/20 hover:bg-color3/80 hover:scale-105`}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity z-0 text-white">
                                <Clock className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                            </div>

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-4 rounded-xl bg-black/10 transition-transform duration-300 group-hover:scale-110">
                                    <Clock className="w-8 h-8 fill-current opacity-90" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold transition-colors opacity-95">
                                        {t('welcome.quick_start')}
                                    </h3>
                                    <p className="text-xs opacity-80 mt-1 capitalize">{t('welcome.resume', { deck: lastSession.label })}</p>
                                </div>
                            </div>
                        </button>
                    ) : (
                        <div className={`${baseTileClass} bg-color3 text-color3-foreground border-color5/20 opacity-90`}>
                            <div className="absolute top-0 right-0 p-4 opacity-20 z-0 text-white">
                                <Clock className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                            </div>

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-4 rounded-xl bg-black/10">
                                    <Clock className="w-8 h-8 fill-current opacity-90" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold opacity-95">
                                        {t('welcome.quick_start_title')}
                                    </h3>
                                    <p className="text-xs opacity-80 mt-1">{t('welcome.no_recent_session')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Favorites Tile - Container looks like a tile */}
                <div className="h-full relative overflow-hidden rounded-2xl bg-color4 text-color4-foreground border border-color5/20 shadow-sm p-6 flex flex-col justify-between">
                    {/* Background Icon Effect */}
                    <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none z-0 text-white">
                        <Heart className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 rounded-xl bg-black/10 opacity-90">
                                <Heart className="w-8 h-8 fill-current" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold opacity-95">{t('welcome.favorites')}</h3>
                                <p className="text-xs opacity-80 mt-1">{t('welcome.favorites_subtitle')}</p>
                            </div>
                        </div>

                        {/* List embedded in the tile */}
                        {favorites.length > 0 ? (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                {favorites.map((fav) => (
                                    <div
                                        key={fav.id}
                                        className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors group/item"
                                    >
                                        <button
                                            onClick={() => onSelectFavorite(fav)}
                                            className="flex items-center gap-3 flex-1 text-left min-w-0"
                                        >
                                            <div className="p-1.5 rounded-md bg-white/20 text-inherit opacity-80 group-hover/item:opacity-100 transition-colors">
                                                {fav.type === 'mode' ? <Clock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-semibold truncate text-inherit">{fav.label}</span>
                                                {fav.mode && <span className="text-[10px] opacity-70 uppercase tracking-wider">{fav.mode}</span>}
                                            </div>
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite(fav.deckId, fav.type, fav.label, fav.mode);
                                            }}
                                            className="p-2 opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 transition-transform"
                                            title="Remove from favorites"
                                        >
                                            <Heart className="w-4 h-4 fill-current" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-2">
                                <p className="text-sm text-muted-foreground">{t('welcome.no_favorites')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Categories Grid (Bottom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={`${baseTileClass} ${cat.bgColor}`}
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity z-0 text-white`}>
                            <cat.icon className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                        </div>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className={`p-4 rounded-xl bg-black/10 group-hover:bg-black/20 ${cat.color} group-hover:scale-110 transition-all duration-300`}>
                                <cat.icon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold opacity-90 transition-colors">
                                    {t(`welcome.categories.${cat.id.replace(/-/g, '_')}`)}
                                </h3>
                                <p className="text-xs opacity-70 mt-1">{t('welcome.start_session')}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
