import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, MapPin, Clock, Heart, UserCircle, Bell, Sparkles, Library, MessageSquare, CheckSquare, Move, Settings, Check } from 'lucide-react';
import { FavoriteItem, SessionInfo, UserProfile, AppMode } from '../types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WelcomeScreenProps {
    user: UserProfile;
    lastSession?: SessionInfo;
    favorites: FavoriteItem[];
    onQuickStart: () => void;
    onSelectFavorite: (fav: FavoriteItem) => void;
    onNavigate: (mode: AppMode, deckId: string | null) => void;
    onUpdateProfile: (oldUsername: string, newUserData: Partial<UserProfile>) => void;
}

const DEFAULT_TILES = [
    'study-topics',
    'manage-flashcards',
    'favorites',
    'search-library',
    'messages',
    'assignments'
];

function SortableDashboardTile({ id, children, isCustomizeMode }: { id: string, children: React.ReactNode, isCustomizeMode: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={`h-full ${isDragging ? 'opacity-50 ring-2 ring-primary rounded-xl scale-[1.02] shadow-2xl transition-all' : ''}`}>
            <div className="relative h-full">
                {isCustomizeMode && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 rounded-lg cursor-grab active:cursor-grabbing backdrop-blur-md z-20 text-white shadow-sm transition-colors border border-white/10"
                        title="Drag to reorder"
                    >
                        <Move className="w-5 h-5" />
                    </div>
                )}
                <div className={`h-full ${isCustomizeMode ? 'pointer-events-none' : ''}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, lastSession, favorites, onQuickStart, onSelectFavorite, onNavigate, onUpdateProfile }) => {
    const { t } = useTranslation();
    const [currentTime, setCurrentTime] = React.useState(new Date());
    
    // Layout Customization State
    const [isCustomizeMode, setIsCustomizeMode] = useState(false);
    const [tileOrder, setTileOrder] = useState<string[]>([]);

    useEffect(() => {
        const savedOrder = user.studentDashboardTileOrder;
        if (savedOrder && savedOrder.length > 0) {
            // Merge defaults in case new tiles were added since last save
            const merged = [...savedOrder];
            DEFAULT_TILES.forEach(id => {
                if (!merged.includes(id)) merged.push(id);
            });
            setTileOrder(merged);
        } else {
            setTileOrder(DEFAULT_TILES);
        }
    }, [user.studentDashboardTileOrder]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setTileOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const toggleCustomizeMode = () => {
        if (isCustomizeMode) {
            // Save on exit
            onUpdateProfile(user.username, { studentDashboardTileOrder: tileOrder });
        }
        setIsCustomizeMode(!isCustomizeMode);
    };

    // Live Clock Timer
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Get time of day for greeting
    const hour = currentTime.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    // Tile Render Map
    const renderTileContent = (id: string) => {
        switch (id) {
            case 'study-topics':
                return (
                    <div
                        onClick={() => onNavigate('topic-selection', null)}
                        className="bg-blue-500/25 hover:bg-blue-500/30 border border-blue-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full"
                    >
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-blue-200 shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="relative z-10 font-medium flex-1">
                            <h2 className="text-xl font-bold mb-1">{t('welcome.study', 'Study Topics')}</h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">{t('welcome.studyDesc', 'Explore vocabulary, grammar, reading comprehension, and more.')}</p>
                        </div>
                    </div>
                );
            case 'manage-flashcards':
                return (
                    <div
                        onClick={() => onNavigate('admin', null)}
                        className="bg-purple-500/25 hover:bg-purple-500/30 border border-purple-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full"
                    >
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-purple-200 shrink-0">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="relative z-10 font-medium flex-1">
                            <h2 className="text-xl font-bold mb-1">{t('welcome.manageFlashcards', 'Manage Flashcards')}</h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">{t('welcome.manageFlashcardsDesc', 'Create, edit, and use AI to generate cards.')}</p>
                        </div>
                    </div>
                );
            case 'favorites':
                return (
                    <div className="bg-rose-500/20 border border-rose-500/20 rounded-2xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden h-full">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl transition-colors"></div>
                        <div className="flex items-center gap-3 relative z-10 shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm border border-rose-200">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">Favorites</h2>
                        </div>
                        <div className="relative z-10 font-medium flex-1 overflow-y-auto custom-scrollbar max-h-[100px] flex flex-col gap-2">
                            {favorites.length > 0 ? (
                                favorites.map((fav) => (
                                    <button
                                        key={fav.id}
                                        onClick={() => onSelectFavorite(fav)}
                                        className="w-full text-left truncate text-sm px-3 py-2 bg-background/50 hover:bg-background/80 border border-border/50 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <span className="opacity-70 shrink-0">{fav.type === 'mode' ? <Clock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}</span>
                                        <span className="truncate">{fav.label}</span>
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground mt-2">No favorites saved yet.</p>
                            )}
                        </div>
                    </div>
                );
            case 'search-library':
                return (
                    <div
                        onClick={() => alert('Search Library Navigation - Coming Soon')}
                        className="bg-cyan-500/25 hover:bg-cyan-500/30 border border-cyan-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full"
                    >
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors"></div>
                        <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-cyan-200 shrink-0">
                            <Library className="w-6 h-6" />
                        </div>
                        <div className="relative z-10 font-medium flex-1">
                            <h2 className="text-xl font-bold mb-1">Search Library</h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">Browse community flashcards and decks to add to your collection.</p>
                        </div>
                    </div>
                );
            case 'messages':
                return (
                    <div
                        onClick={() => alert('Messages Navigation - Coming Soon')}
                        className="bg-green-500/25 hover:bg-green-500/30 border border-green-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full"
                    >
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
                        <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-green-200 shrink-0">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div className="relative z-10 font-medium flex-1">
                            <h2 className="text-xl font-bold mb-1">Messages</h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">Communicate with your tutors and review feedback.</p>
                        </div>
                    </div>
                );
            case 'assignments':
                return (
                    <div
                        onClick={() => alert('Assignments Navigation - Coming Soon')}
                        className="bg-orange-500/25 hover:bg-orange-500/30 border border-orange-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full"
                    >
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>
                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-orange-200 shrink-0">
                            <CheckSquare className="w-6 h-6" />
                        </div>
                        <div className="relative z-10 font-medium flex-1">
                            <h2 className="text-xl font-bold mb-1">Assignments</h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">Track homework, upcoming tests, and administrative tasks.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full h-full bg-background text-foreground flex flex-col">
            <main className="flex-1 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-6 max-w-6xl mx-auto mt-6">
                    
                    {/* Student Hero Tile */}
                    <div className="bg-zinc-700 border border-zinc-600 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-md relative overflow-hidden text-zinc-100">
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
                                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-zinc-300" /> <span className="text-zinc-300 pointer-events-none">Language Learner</span></span>
                                    <span className="flex items-center gap-2 hover:text-white transition-colors">
                                        <MapPin className="w-4 h-4" />
                                        {user.currentCity ? `${user.currentCity}, ${user.currentCountry}` : (user.currentCountry || 'Location Not Set')}
                                    </span>
                                    <span className="flex items-center gap-2 hover:text-white transition-colors">
                                        <Clock className="w-4 h-4" />
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: user.timeZone || undefined })} ({user.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time'})
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 flex items-center justify-center text-[10px] bg-zinc-600 rounded-sm border border-zinc-500/50">📅</span>
                                        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', timeZone: user.timeZone || undefined })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Stats & Time (Right) */}
                        <div className="flex flex-wrap md:flex-nowrap justify-center gap-4 relative z-10 w-full md:flex-1">
                            {/* Active Decks Widget */}
                            <div
                                onClick={() => onNavigate('topic-selection', null)}
                                className="bg-blue-500/20 hover:bg-blue-500/30 cursor-pointer transition-colors backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm"
                            >
                                <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
                                <span className="text-2xl font-bold text-white">{user.activeDeckIds?.length || 0}</span>
                                <span className="text-xs text-zinc-300 text-center line-clamp-2">Active<br />Decks</span>
                            </div>

                            {/* Inbox/Pending Widget */}
                            <div
                                onClick={() => alert('Messages Navigation - Coming Soon')}
                                className="bg-green-500/20 hover:bg-green-500/30 cursor-pointer transition-colors backdrop-blur-sm border border-green-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm relative group"
                            >
                                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                <Bell className="w-5 h-5 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-2xl font-bold text-white">1</span>
                                <span className="text-xs text-zinc-300 text-center line-clamp-2">New<br />Messages</span>
                            </div>

                            {/* Quick Start Widget */}
                            {lastSession ? (
                                <div
                                    onClick={onQuickStart}
                                    className="bg-orange-500/20 hover:bg-orange-500/30 cursor-pointer transition-colors backdrop-blur-sm border border-orange-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm group"
                                    title={`Resume ${lastSession.label}`}
                                >
                                    <Clock className="w-6 h-6 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold text-white text-center leading-tight">Quick<br />Start</span>
                                </div>
                            ) : (
                                <div className="bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm opacity-70">
                                    <Clock className="w-6 h-6 text-orange-400/50 mb-2" />
                                    <span className="text-sm font-bold text-white/70 text-center leading-tight">Quick<br/>Start</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dashboard Header Elements */}
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-foreground opacity-80 pl-2">Dashboard</h3>
                        <button
                            onClick={toggleCustomizeMode}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-offset-background border ${isCustomizeMode ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}
                        >
                            {isCustomizeMode ? (
                                <>
                                    <Check className="w-4 h-4" /> Save Layout
                                </>
                            ) : (
                                <>
                                    <Settings className="w-4 h-4" /> Customize Layout
                                </>
                            )}
                        </button>
                    </div>

                    {/* Dashboard Grid - Draggable */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={tileOrder} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tileOrder.map(id => (
                                    <SortableDashboardTile key={id} id={id} isCustomizeMode={isCustomizeMode}>
                                        {renderTileContent(id)}
                                    </SortableDashboardTile>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                </div>
            </main>
        </div>
    );
};

