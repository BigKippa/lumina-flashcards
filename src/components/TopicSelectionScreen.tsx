import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Utensils, Plane, Activity, ShoppingBag, Briefcase, Users, FileText, Search, UserMinus, MessageCircle, Smile, GraduationCap, Globe, Palette, Clock, Link, GitMerge, Heart, BookOpen } from 'lucide-react';
import { FavoriteItem, Deck } from '../types';

interface Topic {
    id: string;
    labelKey: string;
    descriptionKey: string;
    icon: React.ElementType;
}

interface TopicGroup {
    id: string;
    titleKey: string;
    descriptionKey: string;
    topics: Topic[];
    color: string;
}

export const TOPIC_GROUPS: TopicGroup[] = [
    {
        id: "daily_life",
        titleKey: "topics.daily_life.title",
        descriptionKey: "topics.daily_life.description",
        color: "text-blue-600 bg-blue-50 border-blue-200",
        topics: [
            { id: 'vocab-home', labelKey: 'topics.daily_life.home.label', descriptionKey: 'topics.daily_life.home.desc', icon: Home },
            { id: 'vocab-food', labelKey: 'topics.daily_life.food.label', descriptionKey: 'topics.daily_life.food.desc', icon: Utensils },
            { id: 'vocab-transport', labelKey: 'topics.daily_life.transport.label', descriptionKey: 'topics.daily_life.transport.desc', icon: Plane },
            { id: 'vocab-health', labelKey: 'topics.daily_life.health.label', descriptionKey: 'topics.daily_life.health.desc', icon: Activity },
            { id: 'vocab-shopping', labelKey: 'topics.daily_life.shopping.label', descriptionKey: 'topics.daily_life.shopping.desc', icon: ShoppingBag },
        ]
    },
    {
        id: "business",
        titleKey: "topics.business.title",
        descriptionKey: "topics.business.description",
        color: "text-purple-600 bg-purple-50 border-purple-200",
        topics: [
            { id: 'vocab-office', labelKey: 'topics.business.office.label', descriptionKey: 'topics.business.office.desc', icon: Briefcase },
            { id: 'vocab-meetings', labelKey: 'topics.business.meetings.label', descriptionKey: 'topics.business.meetings.desc', icon: Users },
            { id: 'vocab-finance', labelKey: 'topics.business.finance.label', descriptionKey: 'topics.business.finance.desc', icon: FileText },
            { id: 'vocab-job', labelKey: 'topics.business.job.label', descriptionKey: 'topics.business.job.desc', icon: Search },
        ]
    },
    {
        id: "communication",
        titleKey: "topics.communication.title",
        descriptionKey: "topics.communication.description",
        color: "text-green-600 bg-green-50 border-green-200",
        topics: [
            { id: 'vocab-phrasal', labelKey: 'topics.communication.phrasal.label', descriptionKey: 'topics.communication.phrasal.desc', icon: GitMerge },
            { id: 'vocab-idioms', labelKey: 'topics.communication.idioms.label', descriptionKey: 'topics.communication.idioms.desc', icon: MessageCircle },
            { id: 'vocab-social', labelKey: 'topics.communication.social.label', descriptionKey: 'topics.communication.social.desc', icon: UserMinus },
            { id: 'vocab-emotions', labelKey: 'topics.communication.emotions.label', descriptionKey: 'topics.communication.emotions.desc', icon: Smile },
        ]
    },
    {
        id: "academic",
        titleKey: "topics.academic.title",
        descriptionKey: "topics.academic.description",
        color: "text-orange-600 bg-orange-50 border-orange-200",
        topics: [
            { id: 'vocab-science', labelKey: 'topics.academic.science.label', descriptionKey: 'topics.academic.science.desc', icon: Activity },
            { id: 'vocab-env', labelKey: 'topics.academic.env.label', descriptionKey: 'topics.academic.env.desc', icon: Globe },
            { id: 'vocab-arts', labelKey: 'topics.academic.arts.label', descriptionKey: 'topics.academic.arts.desc', icon: Palette },
            { id: 'vocab-edu', labelKey: 'topics.academic.edu.label', descriptionKey: 'topics.academic.edu.desc', icon: GraduationCap },
        ]
    },
    {
        id: "grammar",
        titleKey: "topics.grammar.title",
        descriptionKey: "topics.grammar.description",
        color: "text-red-600 bg-red-50 border-red-200",
        topics: [
            { id: 'vocab-temporal', labelKey: 'topics.grammar.temporal.label', descriptionKey: 'topics.grammar.temporal.desc', icon: Clock },
            { id: 'vocab-connectors', labelKey: 'topics.grammar.connectors.label', descriptionKey: 'topics.grammar.connectors.desc', icon: Link },
            { id: 'vocab-collocations', labelKey: 'topics.grammar.collocations.label', descriptionKey: 'topics.grammar.collocations.desc', icon: GitMerge },
        ]
    }
];

interface TopicSelectionScreenProps {
    onSelect: (topicId: string, label: string) => void;
    onBack: () => void;
    favorites: FavoriteItem[];
    onToggleFavorite: (id: string, type: 'deck' | 'mode', label: string, modeName?: string) => void;
    decks?: Deck[];
    activeDeckIds?: string[];
    onSelectDeck?: (deckId: string) => void;
    onGroupSelect?: (groupId: string | null) => void;
}

export const TopicSelectionScreen: React.FC<TopicSelectionScreenProps> = ({ onSelect, onBack, favorites, onToggleFavorite, decks, activeDeckIds, onSelectDeck, onGroupSelect }) => {
    const { t } = useTranslation();
    const [selectedGroup, setSelectedGroup] = React.useState<TopicGroup | null>(null);

    // Dynamic contrast colors for mapping distinct tiles
    const TILE_COLORS = [
        'bg-blue-500/10 border-blue-500/20 text-blue-700 hover:bg-blue-500/20 hover:border-blue-500/40',
        'bg-purple-500/10 border-purple-500/20 text-purple-700 hover:bg-purple-500/20 hover:border-purple-500/40',
        'bg-amber-500/10 border-amber-500/20 text-amber-700 hover:bg-amber-500/20 hover:border-amber-500/40',
        'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20 hover:border-emerald-500/40',
        'bg-rose-500/10 border-rose-500/20 text-rose-700 hover:bg-rose-500/20 hover:border-rose-500/40',
        'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 hover:bg-cyan-500/20 hover:border-cyan-500/40',
    ];

    const ICON_COLORS = [
        'text-blue-500', 'text-purple-500', 'text-amber-500', 'text-emerald-500', 'text-rose-500', 'text-cyan-500'
    ];

    React.useEffect(() => {
        if (onGroupSelect) {
            onGroupSelect(selectedGroup ? selectedGroup.id : null);
        }
    }, [selectedGroup, onGroupSelect]);

    const isFavorite = (id: string) => favorites.some(f => f.deckId === id);

    const studentDecks = decks?.filter(d => activeDeckIds?.includes(d.id)) || [];

    // View 2: Topic Selection (Inside a Group)
    if (selectedGroup) {
        // Use group ID for the mix ID instead of title
        const groupMixId = `vocab-group-${selectedGroup.id}`;
        const isGroupMixFav = isFavorite(groupMixId);

        const groupTitle = t(selectedGroup.titleKey);
        const groupDesc = t(selectedGroup.descriptionKey);

        return (
            <div className="flex flex-col items-center w-full max-w-5xl mx-auto py-8 animate-in fade-in duration-500">
                <div className="w-full mb-8 text-center relative">
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                        &larr; {t('topics.selection.back_to_groups')}
                    </button>
                    <h1 className="text-3xl font-bold text-foreground">{groupTitle}</h1>
                    <p className="text-muted-foreground mt-2">{groupDesc}</p>
                </div>

                <div className="w-full max-w-4xl space-y-6">
                    {/* Random Mix for this Group */}
                    <button
                        onClick={() => onSelect(groupMixId, t('topics.selection.random_mix_title', { group: groupTitle }))}
                        className="w-full p-6 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex items-center justify-between group relative"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <GitMerge className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold">{t('topics.selection.random_mix_title', { group: groupTitle })}</h3>
                                <p className="text-gray-300 text-sm">{t('topics.selection.random_mix_subtitle')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(groupMixId, 'deck', t('topics.selection.random_mix_title', { group: groupTitle }));
                                }}
                                className={`p-2 rounded-full hover:bg-white/20 transition-colors ${isGroupMixFav ? 'text-red-500' : 'text-white/50 hover:text-white'}`}
                            >
                                <Heart className={`w-6 h-6 ${isGroupMixFav ? "fill-current" : ""}`} />
                            </div>
                            <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                                <Home className="w-5 h-5 opacity-0" /> {/* Placeholder/Arrow */}
                                &rarr;
                            </div>
                        </div>
                    </button>

                    {/* Topics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedGroup.topics.map((topic, index) => {
                            const isTopicFav = isFavorite(topic.id);
                            const topicLabel = t(topic.labelKey);
                            const tileColor = TILE_COLORS[index % TILE_COLORS.length];
                            const iconColor = ICON_COLORS[index % ICON_COLORS.length];

                            return (
                                <button
                                    key={topic.id}
                                    onClick={() => onSelect(topic.id, topicLabel)}
                                    className={`
                                        flex flex-col p-6 rounded-xl border relative
                                        transition-all duration-200 text-left h-full group
                                        ${tileColor} shadow-sm hover:shadow-md hover:scale-[1.02]
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-white/60 dark:bg-black/10 w-fit rounded-lg shadow-sm">
                                            <topic.icon className={`w-6 h-6 ${iconColor}`} />
                                        </div>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite(topic.id, 'deck', topicLabel);
                                            }}
                                            className={`p-2 rounded-full hover:bg-white/50 transition-colors ${isTopicFav ? 'text-red-500' : 'text-muted-foreground/30 hover:text-red-500'}`}
                                        >
                                            <Heart className={`w-5 h-5 ${isTopicFav ? "fill-current" : ""}`} />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{topicLabel}</h3>
                                    <p className="text-sm opacity-80">{t(topic.descriptionKey)}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // View 1: Group Selection (Root)
    const isGlobalMixFav = isFavorite('vocab-random');
    const globalMixLabel = t('topics.selection.surprise_me_title');

    return (
        <div className="flex flex-col items-center w-full max-w-5xl mx-auto py-8 animate-in fade-in duration-500">
            <div className="w-full mb-8 text-center relative">
                <button
                    onClick={onBack}
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    &larr; {t('topics.selection.back_to_home')}
                </button>
                <h1 className="text-3xl font-bold text-foreground">{t('topics.selection.title')}</h1>
                <p className="text-muted-foreground mt-2">{t('topics.selection.subtitle')}</p>
            </div>

            <div className="w-full max-w-4xl space-y-6">

                {/* STUDENT LIBRARY SECTION */}
                {studentDecks.length > 0 && (
                    <div className="w-full mb-8 animate-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
                            <BookOpen className="w-6 h-6" />
                            {t('topics.selection.student_library')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {studentDecks.map((deck, index) => {
                                const tileColor = TILE_COLORS[index % TILE_COLORS.length];
                                const iconColor = ICON_COLORS[index % ICON_COLORS.length];

                                return (
                                    <button
                                        key={deck.id}
                                        onClick={() => onSelectDeck?.(deck.id)}
                                        className={`flex flex-col p-6 rounded-xl border hover:shadow-lg transition-all text-left group relative overflow-hidden ${tileColor}`}
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <BookOpen className={`w-16 h-16 ${iconColor} transform translate-x-4 -translate-y-4`} />
                                        </div>
                                        <h3 className="font-bold text-lg mb-1 relative z-10">{deck.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 relative z-10 mb-2">{deck.description}</p>
                                        <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80 bg-black/5 dark:bg-white/5 w-fit px-2 py-1 rounded relative z-10">
                                            <span>{t('topics.selection.cards_count', { count: deck.cards.length })}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="my-8 border-t border-border" />
                    </div>
                )}
                {/* Global Vocabulary Random Mix */}
                <button
                    onClick={() => onSelect('vocab-random', globalMixLabel)}
                    className="w-full p-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] flex items-center gap-6 group relative"
                >
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                        <Palette className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="text-2xl font-bold mb-1">{globalMixLabel}</h3>
                        <p className="text-indigo-100">{t('topics.selection.surprise_me_subtitle')}</p>
                    </div>

                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite('vocab-random', 'deck', globalMixLabel);
                        }}
                        className={`p-3 mr-4 rounded-full hover:bg-white/20 transition-colors relative z-10 ${isGlobalMixFav ? 'text-red-500' : 'text-white/50 hover:text-white'}`}
                    >
                        <Heart className={`w-8 h-8 ${isGlobalMixFav ? "fill-current" : ""}`} />
                    </div>

                    <div className="text-white/50 group-hover:translate-x-1 transition-transform">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                </button>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TOPIC_GROUPS.map((group) => {
                        const groupMixId = `vocab-group-${group.id}`;
                        const isGroupFav = isFavorite(groupMixId);
                        const groupTitle = t(group.titleKey);
                        return (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={`
                                flex items-center p-6 rounded-2xl border border-transparent 
                                transition-all duration-200 text-left w-full group
                                ${group.color} hover:shadow-lg hover:scale-[1.01] relative
                            `}
                            >
                                <div className="flex-1">
                                    <h3 className="font-bold text-xl mb-2 pr-8">{groupTitle}</h3>
                                    <p className="text-sm opacity-80 line-clamp-2">{t(group.descriptionKey)}</p>
                                    <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-60">
                                        <span>{group.topics.length} Topics</span>
                                    </div>
                                </div>

                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(groupMixId, 'deck', t('topics.selection.random_mix_title', { group: groupTitle }));
                                    }}
                                    className={`absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors z-10 ${isGroupFav ? 'text-red-500' : 'text-muted-foreground/30 hover:text-red-500'}`}
                                >
                                    <Heart className={`w-6 h-6 ${isGroupFav ? "fill-current" : ""}`} />
                                </div>

                                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
