import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, MessageCircle, GitMerge, Users, MapPin, Shuffle, Clock, Heart } from 'lucide-react';
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
    { id: 'random', label: 'Random Mix', icon: Shuffle, color: 'bg-gradient-to-br from-gray-800 to-gray-600 text-white border-none' },
    { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
    { id: 'idioms', label: 'Idioms & Sayings', icon: MessageCircle, color: 'bg-purple-100 text-purple-600' },
    { id: 'phrasal-verbs', label: 'Phrasal Verbs', icon: GitMerge, color: 'bg-green-100 text-green-600' },
    { id: 'collocations', label: 'Phrases & Collocations', icon: Users, color: 'bg-orange-100 text-orange-600' },
    { id: 'prepositions', label: 'Prepositions', icon: MapPin, color: 'bg-red-100 text-red-600' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onSelect, lastSession, favorites, onQuickStart, onSelectFavorite, onToggleFavorite }) => {
    const { t } = useTranslation();

    // Get time of day for greeting
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    const userName = user.preferredName || user.firstName || user.username;

    // Helper for consistency
    const tileClass = "group relative overflow-hidden p-6 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 text-left h-full flex flex-col justify-between";

    return (
        <div className="flex flex-col items-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700 w-full py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                    {t(`welcome.greeting.${timeOfDay}`)}, <span className="text-primary">{userName}</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                    {t('welcome.subtitle')}
                </p>
            </div>

            {/* Categories Grid (Top) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mb-6">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={tileClass}
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${cat.color}`}>
                            <cat.icon className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                        </div>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className={`p-4 rounded-xl ${cat.color} group-hover:scale-110 transition-transform duration-300`}>
                                <cat.icon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                    {t(`welcome.categories.${cat.id.replace(/-/g, '_')}`)}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">{t('welcome.start_session')}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Bottom Split: Quick Start & Favorites */}
            <div className="w-full max-w-4xl grid grid-cols-2 gap-6 animate-in slide-in-from-bottom-6 duration-700 delay-200">

                {/* Left: Quick Start - Styled exactly like a category tile */}
                <div className="h-full">
                    {lastSession ? (
                        <button
                            onClick={onQuickStart}
                            className={tileClass}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                                <Clock className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                            </div>

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                                    <Clock className="w-8 h-8 fill-current" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                        {t('welcome.quick_start')}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 capitalize">{t('welcome.resume', { deck: lastSession.label })}</p>
                                </div>
                            </div>
                        </button>
                    ) : (
                        <div className="relative overflow-hidden p-6 rounded-2xl bg-card border border-border shadow-sm text-left h-full flex flex-col justify-between opacity-80">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
                                <Clock className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                            </div>

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-4 rounded-xl bg-primary/10 text-primary">
                                    <Clock className="w-8 h-8 fill-current" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        {t('welcome.quick_start_title')}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">{t('welcome.no_recent_session')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Favorites Tile - Container looks like a tile */}
                <div className="h-full relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm p-6 flex flex-col justify-between">
                    {/* Background Icon Effect */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-red-500">
                        <Heart className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 rounded-xl bg-red-100/50 text-red-500">
                                <Heart className="w-8 h-8 fill-current" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{t('welcome.favorites')}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{t('welcome.favorites_subtitle')}</p>
                            </div>
                        </div>

                        {/* List embedded in the tile */}
                        {favorites.length > 0 ? (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                {favorites.map((fav) => (
                                    <div
                                        key={fav.id}
                                        className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors group/item"
                                    >
                                        <button
                                            onClick={() => onSelectFavorite(fav)}
                                            className="flex items-center gap-3 flex-1 text-left min-w-0"
                                        >
                                            <div className="p-1.5 rounded-md bg-white/50 dark:bg-black/20 text-muted-foreground group-hover/item:text-primary transition-colors">
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
        </div>
    );
};
