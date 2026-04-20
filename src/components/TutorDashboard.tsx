import React, { useState, useMemo } from 'react';
import { Student, Deck, AppSettings, UserProfile } from '../types';
import { Word } from '../data/vocabulary';
import { Search, Plus, UserCircle, ChevronDown, SortAsc, Clock, GraduationCap, Users, Layout, Zap, MessageSquare, CheckSquare, ArrowLeft, MapPin, Bell, Library, ChevronUp, Pencil, Filter, ArrowDownAZ, ArrowUpAZ, X, AlertTriangle, Send, Settings, Check, Move, Eye, Archive, Trash2, Sparkles, MoreVertical } from 'lucide-react';
import { StudentProfile } from './StudentProfile';
import { AddContentModal } from './AddContentModal';
import { EditCardModal } from './EditCardModal';
import { QuickAddFlashcardsModal } from './QuickAddFlashcardsModal';
import Flashcard from './Flashcard';
import { LibraryDiagnosticsModal } from './LibraryDiagnosticsModal';
import { DuplicateResolverModal } from './DuplicateResolverModal';
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

interface TutorDashboardProps {
    user: UserProfile;
    students: Student[];
    decks: Deck[];
    onUpdateStudent: (student: Student) => void;
    onAddStudent: (student: Student) => void;
    view: 'dashboard' | 'students' | 'flashcards' | 'learning-content' | 'manage-flashcards' | 'review-new-flashcards';
    onViewChange: (view: 'dashboard' | 'students' | 'flashcards' | 'learning-content' | 'manage-flashcards' | 'review-new-flashcards') => void;
    onAddDeck: (deck: Deck) => void;
    onAddCard: (card: Word, deckId: string) => void;
    onEditCard: (card: Word, additionalCards?: {card: Word, deckId: string}[]) => void;
    apiKey?: string;
    settings: AppSettings;
    onNavigateToProfile?: (target?: string) => void;
    onUpdateProfile?: (oldUsername: string, newUserData: Partial<UserProfile>) => void;
    onDeleteCard: (id: string) => void;
    onBulkDeleteCards: (ids: string[]) => void;
    onBulkArchiveCards: (ids: string[], isArchiving: boolean) => void;
    onDeleteStudent: (id: string) => void;
    onSelectDeck?: (deckId: string) => void;
}

const DEFAULT_TILES = [
    'all-content',
    'quickstart',
    'students',
    'manage-learning-content',
    'messages',
    'to-do'
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
                        className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 rounded-lg cursor-grab active:cursor-grabbing backdrop-blur-md z-20 text-color1 shadow-sm transition-colors border border-white/10"
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

export const TutorDashboard: React.FC<TutorDashboardProps> = ({ user, students, decks, onUpdateStudent, onAddStudent, onDeleteStudent, view, onViewChange, onAddDeck, onAddCard, onEditCard, apiKey, settings, onNavigateToProfile, onUpdateProfile, onDeleteCard, onBulkDeleteCards, onBulkArchiveCards, onSelectDeck }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCustomizeMode, setIsCustomizeMode] = useState(false);
    const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
    const [resolvingDuplicates, setResolvingDuplicates] = useState<(Word & { deckId: string })[] | null>(null);
    const [tileOrder, setTileOrder] = useState<string[]>([]);
    const [studentMenuOpenId, setStudentMenuOpenId] = useState<string | null>(null);
    
    // Quick Add Flashcards State
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [pendingQuickAddCards, setPendingQuickAddCards] = useState<Word[]>([]);
    const [quickAddAudience, setQuickAddAudience] = useState('');
    const [quickAddStudentId, setQuickAddStudentId] = useState('');
    const [editingPendingCard, setEditingPendingCard] = useState<Word | null>(null);

    // AI Bulk Resolution State
    const [pendingAiResolveCards, setPendingAiResolveCards] = useState<(Word & { deckId: string })[]>([]);
    const [originalAiResolveTotal, setOriginalAiResolveTotal] = useState(0);

    const [quickAddAiQueue, setQuickAddAiQueue] = useState<Word[]>([]);
    const [quickAddAiTotal, setQuickAddAiTotal] = useState(0);

    // Close student action menu on external click
    React.useEffect(() => {
        const handleClickOutside = () => setStudentMenuOpenId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Force scroll to top when changing distinct views (fixes React state preservation scroll traps)
    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [view]);

    const commitCardsToLibrary = (cardsToCommit: Word[], shouldNavAway: boolean = false) => {
        if (cardsToCommit.length === 0) return;

        // 1. Create a "New Flashcards" deck if it doesn't exist
        const existingDeck = decks.find(d => d.title === "New Flashcards");
        
        const targetDeck = existingDeck || {
            id: crypto.randomUUID(),
            title: "New Flashcards",
            description: "Quickly added flashcards",
            subject: "Vocabulary",
            level: "All Levels",
            tags: ["QuickAdd"],
            cards: [...cardsToCommit],
            status: 'private',
            authorId: user.id
        };

        if (!existingDeck) {
            onAddDeck(targetDeck);
        } else {
            // Add cards to this deck
            cardsToCommit.forEach(card => {
                onAddCard(card, targetDeck.id);
            });
        }

        // 2. Assign to audience if needed
        if (quickAddAudience === 'specific_student' && quickAddStudentId) {
            const student = students.find(s => s.id === quickAddStudentId);
            if (student && !student.activeDeckIds.includes(targetDeck.id)) {
                onUpdateStudent({ ...student, activeDeckIds: [...student.activeDeckIds, targetDeck.id] });
            }
        } else if (quickAddAudience === 'all_students') {
            students.forEach(student => {
                if (!student.activeDeckIds.includes(targetDeck.id)) {
                    onUpdateStudent({ ...student, activeDeckIds: [...student.activeDeckIds, targetDeck.id] });
                }
            });
        }

        // 3. Remove committed cards from the local visible pending array
        setPendingQuickAddCards(prev => prev.filter(p => !cardsToCommit.some(c => c.id === p.id)));

        // 4. Handle navigation and cleanup if finishing the batch
        if (shouldNavAway) {
            setPendingQuickAddCards([]);
            setQuickAddAudience('');
            setQuickAddStudentId('');
            onViewChange('dashboard');
            setTimeout(() => alert(`Successfully approved and added ${cardsToCommit.length} flashcards to "${targetDeck.title}".`), 100);
        }
    };

    const handleApprovePendingCards = () => {
        commitCardsToLibrary(pendingQuickAddCards, true);
    };

    React.useEffect(() => {
        const savedOrder = user.tutorDashboardTileOrder;
        if (savedOrder && savedOrder.length > 0) {
            const merged = [...savedOrder];
            DEFAULT_TILES.forEach(id => {
                if (!merged.includes(id)) merged.push(id);
            });
            setTileOrder(merged);
        } else {
            setTileOrder(DEFAULT_TILES);
        }
    }, [user.tutorDashboardTileOrder]);

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
        if (isCustomizeMode && onUpdateProfile) {
            onUpdateProfile(user.username, { tutorDashboardTileOrder: tileOrder });
        }
        setIsCustomizeMode(!isCustomizeMode);
    };

    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<'a-z' | 'z-a' | 'newest' | 'oldest'>('a-z');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isManageContentOpen, setIsManageContentOpen] = useState(false);

    // Flashcards List State
    const [flashcardSearchQuery, setFlashcardSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStudentId, setFilterStudentId] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: 'word' | 'definition' | 'category' | 'deckTitle' | 'student', direction: 'asc' | 'desc' } | null>({ key: 'word', direction: 'asc' });
    const [editingCard, setEditingCard] = useState<(Word & { deckId: string }) | null>(null);
    const [previewCard, setPreviewCard] = useState<Word | null>(null);
    const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
    const [showMissingOnly, setShowMissingOnly] = useState(false);
    const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
    const [showArchivedCards, setShowArchivedCards] = useState(false);

    // Add Student / Quicksend State
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [quickAddInitialParams, setQuickAddInitialParams] = useState<{audience: string, studentId: string} | null>(null);
    const [quicksendFirst, setQuicksendFirst] = useState('');
    const [quicksendLast, setQuicksendLast] = useState('');
    const [quicksendEmail, setQuicksendEmail] = useState('');

    // Sort Dropdown State
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const sortDropdownRef = React.useRef<HTMLDivElement>(null);

    // Column Menu State
    const [activeColumnMenu, setActiveColumnMenu] = useState<string | null>(null);
    const columnMenuRef = React.useRef<HTMLDivElement>(null);

    // Close menus on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setIsSortDropdownOpen(false);
            }
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
                setActiveColumnMenu(null);
            }
        };

        if (isSortDropdownOpen || activeColumnMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSortDropdownOpen, activeColumnMenu]);

    // Live Clock Timer
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Initial Empty Student for creating new
    const handleAddNew = () => {
        const newStudent: Student = {
            id: crypto.randomUUID(),
            name: "New Student",
            activeDeckIds: [],
            status: 'active',
            joinedDate: Date.now()
        };
        onAddStudent(newStudent);
        setSelectedStudentId(newStudent.id);
        setIsAddStudentModalOpen(false);
    };

    const handleQuicksendSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams({
            invite: 'true',
            email: quicksendEmail,
            first: quicksendFirst,
            last: quicksendLast
        });
        const inviteUrl = `${window.location.origin}/?${params.toString()}`;

        window.alert(`Quicksend simulated! The student would receive an email containing this link:\n\n${inviteUrl}`);

        setIsAddStudentModalOpen(false);
        setQuicksendFirst('');
        setQuicksendLast('');
        setQuicksendEmail('');
    };

    const filteredStudents = useMemo(() => {
        return students
            .filter(s => s.status === activeTab)
            .filter(s => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                // Deep search in string fields
                return (
                    s.name.toLowerCase().includes(q) ||
                    s.email?.toLowerCase().includes(q) ||
                    s.nativeLanguage?.toLowerCase().includes(q) ||
                    s.originCountry?.toLowerCase().includes(q) ||
                    s.profession?.toLowerCase().includes(q) ||
                    s.interests?.toLowerCase().includes(q) ||
                    s.goals?.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => {
                switch (sortOption) {
                    case 'a-z': return a.name.localeCompare(b.name);
                    case 'z-a': return b.name.localeCompare(a.name);
                    case 'newest': return b.joinedDate - a.joinedDate;
                    case 'oldest': return a.joinedDate - b.joinedDate;
                    default: return 0;
                }
            });
    }, [students, activeTab, searchQuery, sortOption]);

    const stats = {
        total: students.length,
        active: students.filter(s => s.status === 'active').length,
        archived: students.filter(s => s.status === 'archived').length
    };

    // Derived State for Flashcards List
    const allFlashcards = useMemo(() => {
        const cardsWithMetadata: (Word & { deckId: string; deckTitle: string; assignedStudents: Student[] })[] = [];

        decks.forEach(deck => {
            const assigned = students.filter(s => s.activeDeckIds.includes(deck.id));
            deck.cards.forEach(card => {
                cardsWithMetadata.push({
                    ...card,
                    deckId: deck.id,
                    deckTitle: deck.title,
                    assignedStudents: assigned
                });
            });
        });

        // 2. Filtering
        let filtered = cardsWithMetadata;

        if (!showArchivedCards) {
            filtered = filtered.filter(c => !c.isArchived);
        }

        if (showMissingOnly) {
            filtered = filtered.filter(c => !c.definition || !c.example || !c.phonetic || !c.category);
        }

        if (filterCategory !== 'all') {
            filtered = filtered.filter(c => (c.category || 'Uncategorized') === filterCategory);
        }

        if (filterStudentId !== 'all') {
            if (filterStudentId === 'unassigned') {
                filtered = filtered.filter(c => c.assignedStudents.length === 0);
            } else {
                filtered = filtered.filter(c => c.assignedStudents.some(s => s.id === filterStudentId));
            }
        }

        if (flashcardSearchQuery) {
            const q = flashcardSearchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.word.toLowerCase().includes(q) ||
                c.definition.toLowerCase().includes(q) ||
                (c.category || '').toLowerCase().includes(q) ||
                c.assignedStudents.some(s => s.name.toLowerCase().includes(q))
            );
        }

        // 3. Sorting
        return filtered.sort((a, b) => {
            if (!sortConfig) return 0;

            let comparison = 0;
            switch (sortConfig.key) {
                case 'word':
                    comparison = a.word.localeCompare(b.word);
                    break;
                case 'definition':
                    comparison = a.definition.localeCompare(b.definition);
                    break;
                case 'category':
                    comparison = (a.category || '').localeCompare(b.category || '');
                    break;
                case 'deckTitle':
                    comparison = a.deckTitle.localeCompare(b.deckTitle);
                    break;
                case 'student':
                    const aNames = a.assignedStudents.map(s => s.name).join(', ');
                    const bNames = b.assignedStudents.map(s => s.name).join(', ');
                    comparison = aNames.localeCompare(bNames);
                    break;
            }

            // Fallback to word string comparison if primary sort is identical
            if (comparison === 0 && sortConfig.key !== 'word') {
                comparison = a.word.localeCompare(b.word);
            }

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [decks, students, flashcardSearchQuery, sortConfig, filterCategory, filterStudentId, showMissingOnly]);

    // Calculate total missing across all raw cards to show in banner regardless of current filters
    const missingDataCount = useMemo(() => {
        let count = 0;
        decks.forEach(deck => {
            deck.cards.forEach(c => {
                if (!c.definition || !c.example || !c.phonetic || !c.category) count++;
            });
        });
        return count;
    }, [decks]);

    // Derived distinct categories for the filter dropdown
    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        decks.forEach(deck => deck.cards.forEach(card => cats.add(card.category || 'Uncategorized')));
        return Array.from(cats).sort();
    }, [decks]);

    const renderColumnMenu = (columnKey: 'word' | 'definition' | 'category' | 'deckTitle' | 'student', filterNode: React.ReactNode) => {
        if (activeColumnMenu !== columnKey) return null;
        return (
            <div ref={columnMenuRef} onClick={(e) => e.stopPropagation()} className="absolute left-0 top-full mt-2 w-64 bg-card text-foreground border border-border rounded-xl shadow-xl z-50 p-3 flex flex-col gap-3 font-normal cursor-default shadow-primary/5">
                <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sort & Filter</span>
                    <button onClick={() => setActiveColumnMenu(null)} className="p-1 hover:bg-secondary hover:text-foreground rounded-md text-muted-foreground transition-colors"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex flex-col gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setSortConfig({ key: columnKey, direction: 'asc' }); setActiveColumnMenu(null); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary hover:text-foreground text-sm transition-colors text-left"
                    >
                        <ArrowDownAZ className="w-4 h-4 text-muted-foreground" />
                        Sort A to Z
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setSortConfig({ key: columnKey, direction: 'desc' }); setActiveColumnMenu(null); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary hover:text-foreground text-sm transition-colors text-left"
                    >
                        <ArrowUpAZ className="w-4 h-4 text-muted-foreground" />
                        Sort Z to A
                    </button>
                </div>
                <div className="h-px bg-border w-full"></div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 px-1"><Filter className="w-3 h-3" /> Filter</label>
                    {filterNode}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-background text-foreground flex flex-col">
            {/* Main Content */}
            <main data-dev-id="tutor-main-content" className="flex-1 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div data-dev-id="tutor-header-title">
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-primary" />
                            Tutor Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {activeTab === 'active'
                                ? `${stats.active} Active Students`
                                : `${stats.archived} Archived Students`
                            }
                        </p>
                    </div>

                    <div className="flex gap-3 relative">
                        {/* Unified Add Student Modal (Centered) */}
                        {isAddStudentModalOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="w-full max-w-[380px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                                    <div className="bg-primary/5 p-6 border-b border-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-foreground flex items-center gap-2 text-xl">
                                                <GraduationCap className="w-6 h-6 text-primary" /> Add Student
                                            </h3>
                                            <button onClick={() => setIsAddStudentModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-black/5 dark:bg-white/5 p-1.5 rounded-full transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed mt-2 text-balance">
                                            Send a Quicksend invite, or manually create a blank profile now.
                                        </p>
                                    </div>
                                    <div className="p-6">
                                        <form onSubmit={(e) => { handleQuicksendSubmit(e); setIsAddStudentModalOpen(false); }} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-primary uppercase tracking-wider ml-1">First Name</label>
                                                    <input
                                                        required
                                                        placeholder="John"
                                                        value={quicksendFirst}
                                                        onChange={e => setQuicksendFirst(e.target.value)}
                                                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-primary uppercase tracking-wider ml-1">Last Name</label>
                                                    <input
                                                        required
                                                        placeholder="Doe"
                                                        value={quicksendLast}
                                                        onChange={e => setQuicksendLast(e.target.value)}
                                                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-primary uppercase tracking-wider ml-1">Email Address</label>
                                                <input
                                                    required
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    value={quicksendEmail}
                                                    onChange={e => setQuicksendEmail(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                                                />
                                            </div>
                                            <button type="submit" className="w-full py-3.5 mt-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2">
                                                <Send className="w-4 h-4" /> Send Invite Link
                                            </button>
                                        </form>

                                        <div className="relative my-6">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-border/80"></div>
                                            </div>
                                            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                <span className="bg-card px-3">or</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                handleAddNew();
                                                setIsAddStudentModalOpen(false);
                                            }}
                                            className="w-full py-3.5 bg-secondary text-secondary-foreground font-bold rounded-xl text-sm border border-border/50 hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
                                        >
                                            <UserCircle className="w-4 h-4" /> Add Profile Manually
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Quick Add Flashcards Modal */}
                        {isQuickAddOpen && (
                            <QuickAddFlashcardsModal
                                students={students}
                                initialAudience={quickAddInitialParams?.audience}
                                initialSpecificStudentId={quickAddInitialParams?.studentId}
                                onClose={() => { setIsQuickAddOpen(false); setQuickAddInitialParams(null); }}
                                onComplete={(cards, audience, specificStudentId) => {
                                    setPendingQuickAddCards(cards);
                                    setQuickAddAudience(audience);
                                    if (specificStudentId) setQuickAddStudentId(specificStudentId);
                                    setIsQuickAddOpen(false);
                                    setQuickAddInitialParams(null);
                                    if (cards.length > 0) {
                                        onViewChange('review-new-flashcards');
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>



                {/* Page Header */}
                {/* The original page header content was replaced by the new header and filter/search bar above. */}

                {view === 'dashboard' && (
                    <div className="flex flex-col gap-6 max-w-6xl mx-auto mt-6">
                        {/* Tutor Hero Tile */}
                        <div data-dev-id="tutor-hero-tile" className="lumina-glow lumina-glow-hero hover-glow-5 bg-color5 border border-color5/50 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-md text-color1">

                            {/* Profile Info (Left) */}
                            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto md:min-w-[320px] shrink-0">
                                <div className="w-24 h-24 rounded-2xl bg-color1/20 flex items-center justify-center text-color1 shadow-inner border border-color1/20 flex-shrink-0 overflow-hidden">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Tutor avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-12 h-12" />
                                    )}
                                </div>
                                <div className="flex-1 z-10">
                                    <h2 className="text-3xl font-bold mb-2 text-color1">
                                        {user.preferredName || user.firstName || 'Tutor'} {user.lastName || ''}
                                    </h2>
                                    <div className="flex flex-col gap-y-1.5 mt-3 text-sm text-color1/70 font-medium">
                                        <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-color1" /> <span className="text-color1 pointer-events-none">Professional Tutor</span></span>
                                        <span
                                            className="flex items-center gap-2 cursor-pointer hover:text-color1 transition-colors"
                                            onClick={() => onNavigateToProfile?.('section-location')}
                                            title="Edit Location"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            {user.currentCity ? `${user.currentCity}, ${user.currentCountry}` : (user.currentCountry || 'Location Not Set')}
                                        </span>
                                        <span
                                            className="flex items-center gap-2 cursor-pointer hover:text-color1 transition-colors"
                                            onClick={() => onNavigateToProfile?.('section-timezone')}
                                            title="Edit Timezone"
                                        >
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

                                {/* Active Students Widget */}
                                <div
                                    data-dev-id="tutor-widget-active-students"
                                    onClick={() => onViewChange('students')}
                                    className="bg-color4 hover:bg-color4/80 cursor-pointer transition-colors border border-color4/50 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm"
                                >
                                    <Users className="w-5 h-5 text-color5 mb-2" />
                                    <span className="text-2xl font-bold text-color1">{stats.active}</span>
                                    <span className="text-xs text-color1 text-center line-clamp-2">Active<br />Students</span>
                                </div>

                                {/* Inbox/Pending Widget */}
                                <div
                                    data-dev-id="tutor-widget-messages"
                                    onClick={() => alert('Messages Navigation - Coming Soon')}
                                    className="bg-color2 hover:bg-color2/80 cursor-pointer transition-colors border border-color2/50 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm relative"
                                >
                                    <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-color5 rounded-full animate-pulse shadow-sm border border-color1/20"></div>
                                    <Bell className="w-5 h-5 text-color5 mb-2" />
                                    <span className="text-2xl font-bold text-color5">3</span>
                                    <span className="text-xs text-color5 text-center line-clamp-2 font-medium">New<br />Messages</span>
                                </div>

                                {/* Add Student Widget */}
                                <div
                                    data-dev-id="tutor-widget-add-student"
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        setIsAddStudentModalOpen(true);
                                    }}
                                    className="bg-color3 hover:bg-color3/80 cursor-pointer transition-colors border border-color3/50 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm group"
                                >
                                    <Plus className="w-5 h-5 text-color5 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-2xl font-bold invisible block">&nbsp;</span>
                                    <span className="text-xs font-bold text-color5 text-center line-clamp-2">Add<br />Student</span>
                                </div>

                                {/* Create Flashcards Widget */}
                                <div
                                    data-dev-id="tutor-widget-create-flashcards"
                                    onClick={() => setIsQuickAddOpen(true)}
                                    className="bg-color3 hover:bg-color3/30 cursor-pointer transition-colors backdrop-blur-sm border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm group"
                                >
                                    <Library className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-2xl font-bold invisible block">&nbsp;</span>
                                    <span className="text-xs font-bold text-color1 text-center line-clamp-2">Create<br />Flashcards</span>
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Header Elements */}
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-foreground opacity-80 pl-2">Dashboard Actions</h3>
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

                        {/* Control Dashboard Grid - Draggable */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={tileOrder} strategy={rectSortingStrategy}>
                                <div data-dev-id="tutor-tiles-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tileOrder.map(id => {
                                        let tileContent = null;
                                        switch (id) {
                                            case 'all-content':
                                                tileContent = (
                                                    <div
                                                        data-dev-id="tutor-tile-all-content"
                                                        onClick={() => onViewChange('flashcards')}
                                                        className="bg-color2 hover:bg-color2/30 border border-color2/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                                                    >
                                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color2 transition-colors"></div>
                                                        <div className="w-12 h-12 rounded-xl bg-color1 text-color2 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                                            <Library className="w-6 h-6" />
                                                        </div>
                                                        <div className="relative z-10 font-medium flex-1">
                                                            <h2 className="text-xl font-bold mb-1">Get New Material</h2>
                                                            <p className="text-sm text-color1/80 line-clamp-2">Browse the complete library of global flashcards and decks.</p>
                                                        </div>
                                                    </div>
                                                );
                                                break;
                                            case 'quickstart':
                                                tileContent = (
                                                    <div
                                                        data-dev-id="tutor-tile-quickstart"
                                                        onClick={() => alert('Quickstart Navigation - Coming Soon')}
                                                        className="bg-color4 hover:bg-color4/30 border border-color4/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                                                    >
                                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color4 transition-colors"></div>
                                                        <div className="w-12 h-12 rounded-xl bg-color1 text-color4 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                                            <Zap className="w-6 h-6" />
                                                        </div>
                                                        <div className="relative z-10 font-medium flex-1">
                                                            <h2 className="text-xl font-bold mb-1">Quickstart</h2>
                                                            <p className="text-sm text-color1/80 line-clamp-2">Jump straight into your next scheduled session or lesson plan.</p>
                                                        </div>
                                                    </div>
                                                );
                                                break;
                                            case 'students':
                                                tileContent = (
                                                    <div
                                                        data-dev-id="tutor-tile-students"
                                                        onClick={() => onViewChange('students')}
                                                        className="bg-color5 hover:bg-color5/30 border border-color5/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                                                    >
                                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color5 transition-colors"></div>
                                                        <div className="w-12 h-12 rounded-xl bg-color1 text-color5 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                                            <Users className="w-6 h-6" />
                                                        </div>
                                                        <div className="relative z-10 font-medium flex-1">
                                                            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">Students <span className="bg-color1 text-color5 text-xs py-0.5 px-2 rounded-full font-bold">{students.length}</span></h2>
                                                            <p className="text-sm text-color1/80 line-clamp-2">View progress, assign homework, and manage student profiles.</p>
                                                        </div>
                                                    </div>
                                                );
                                                break;
                                            case 'manage-learning-content':
                                                tileContent = (
                                                    <div
                                                        data-dev-id="tutor-tile-content"
                                                        onClick={() => onViewChange('learning-content')}
                                                        className="bg-color3 hover:bg-color3/30 border border-color3/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                                                    >
                                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color3 transition-colors"></div>
                                                        <div className="w-12 h-12 rounded-xl bg-color1 text-color3 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                                            <Layout className="w-6 h-6" />
                                                        </div>
                                                        <div className="relative z-10 font-medium flex-1">
                                                            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">Manage Learning Content</h2>
                                                            <p className="text-sm text-color1/80 line-clamp-2">Create, edit, and organize flashcard decks for your students.</p>
                                                        </div>
                                                    </div>
                                                );
                                                break;
                                            case 'messages':
                                                tileContent = (
                                                    <div
                                                        data-dev-id="tutor-tile-messages"
                                                        onClick={() => alert('Messages Navigation - Coming Soon')}
                                                        className="bg-color2 hover:bg-color2/30 border border-color2/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                                                    >
                                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color2 transition-colors"></div>
                                                        <div className="w-12 h-12 rounded-xl bg-color1 text-color2 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                                            <MessageSquare className="w-6 h-6" />
                                                        </div>
                                                        <div className="relative z-10 font-medium flex-1">
                                                            <h2 className="text-xl font-bold mb-1">Messages</h2>
                                                            <p className="text-sm text-color1/80 line-clamp-2">Communicate directly with your students and review feedback.</p>
                                                        </div>
                                                    </div>
                                                );
                                                break;
                                            case 'to-do':
                                                tileContent = (
                                                    <div
                                                        data-dev-id="tutor-tile-todo"
                                                        onClick={() => alert('To-Do List Navigation - Coming Soon')}
                                                        className="bg-color4 hover:bg-color4/30 border border-color4/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                                                    >
                                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color4 transition-colors"></div>
                                                        <div className="w-12 h-12 rounded-xl bg-color1 text-color4 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                                            <CheckSquare className="w-6 h-6" />
                                                        </div>
                                                        <div className="relative z-10 font-medium flex-1">
                                                            <h2 className="text-xl font-bold mb-1">To Do List</h2>
                                                            <p className="text-sm text-color1/80 line-clamp-2">Track your administrative tasks, grading, and upcoming goals.</p>
                                                        </div>
                                                    </div>
                                                );
                                                break;
                                        }

                                        return (
                                            <SortableDashboardTile key={id} id={id} isCustomizeMode={isCustomizeMode}>
                                                {tileContent}
                                            </SortableDashboardTile>
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}

                {/* Manage Learning Content View */}
                {view === 'learning-content' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* Go Back Header */}
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => onViewChange('dashboard')}
                                    className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-all"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold">Manage Learning Content</h2>
                                    <p className="text-muted-foreground">Create, organize, and explore flashcard decks.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDiagnosticsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-color3 text-color5 font-bold rounded-xl shadow-sm hover:bg-color3/80 transition-all text-sm"
                            >
                                <AlertTriangle className="w-4 h-4" /> Scan Library for Problems
                            </button>
                        </div>

                        {/* Content Action Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Manage Flashcards Tile */}
                            <div
                                onClick={() => onViewChange('manage-flashcards')}
                                className="bg-color2 hover:bg-color2/30 border border-color2/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden h-full text-color1"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color2 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-color1 text-color2 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color1/20 shrink-0">
                                    <Library className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium flex-1">
                                    <h2 className="text-xl font-bold mb-1">Manage Flashcards</h2>
                                    <p className="text-sm text-color1/80 line-clamp-2">View and edit your entire library of individual flashcards.</p>
                                </div>
                            </div>

                            {/* Manage Decks Tile */}
                            <div
                                onClick={() => onViewChange('flashcards')}
                                className="bg-color5 hover:bg-color5/30 border border-color5/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden text-color1"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color5 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-color1 text-color5 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color5/30">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1">Manage Decks</h2>
                                    <p className="text-sm text-color1/70 line-clamp-2">Organize your flashcards into structured learning decks.</p>
                                </div>
                            </div>

                            {/* Create New Tile */}
                            <div
                                onClick={() => setIsManageContentOpen(true)}
                                className="bg-color2 hover:bg-color2/30 border border-color2/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color2 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-color1 text-color2 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color2/30">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1">Create New</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">Generate new content manually or using AI generation tools.</p>
                                </div>
                            </div>

                            {/* Browse for New Tile */}
                            <div
                                onClick={() => alert('Browse Content Navigation - Coming Soon')}
                                className="bg-color3 hover:bg-color3/30 border border-color3/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color3 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-color1 text-color3 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color3/30">
                                    <Search className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1">Browse for New</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">Explore the community library for publicly shared decks.</p>
                                </div>
                            </div>

                            {/* Student Requests Tile */}
                            <div
                                onClick={() => alert('Student Requests Navigation - Coming Soon')}
                                className="bg-color5 hover:bg-color5/30 border border-color5/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden text-color1"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-color1 rounded-full blur-2xl group-hover:bg-color5 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-color1 text-color5 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-color5/30">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">Student Requests</h2>
                                    <p className="text-sm text-color1/70 line-clamp-2">Review topic and deck requests submitted by your students.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Students View */}
                {view === 'students' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* Go Back Header */}
                        <div className="flex items-center gap-4 border-b border-border pb-4">
                            <button
                                onClick={() => onViewChange('dashboard')}
                                className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-all"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold">Manage Students</h2>
                            </div>
                        </div>

                        {/* Controls Bar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">

                            {/* Search */}
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-color5 opacity-50" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, language, country..."
                                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-color1 border-2 border-color2 focus:bg-white focus:border-color4 outline-none transition-all text-color5 font-medium placeholder-color5/50 shadow-sm h-10"
                                />
                            </div>

                            {/* Filters & Actions */}
                            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">

                                {/* Sort Dropdown */}
                                <div className="relative" ref={sortDropdownRef}>
                                    <button
                                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                        className="flex items-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {sortOption === 'a-z' || sortOption === 'z-a' ? <SortAsc className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        <span className="capitalize">{sortOption.replace('-', ' ')}</span>
                                        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {/* Dropdown Menu */}
                                    {isSortDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-40 bg-popover border border-border rounded-xl shadow-xl p-1 z-20 animate-in fade-in zoom-in-95">
                                            <button onClick={() => { setSortOption('a-z'); setIsSortDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg">Name (A-Z)</button>
                                            <button onClick={() => { setSortOption('z-a'); setIsSortDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg">Name (Z-A)</button>
                                            <button onClick={() => { setSortOption('newest'); setIsSortDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg">Newest First</button>
                                            <button onClick={() => { setSortOption('oldest'); setIsSortDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg">Oldest First</button>
                                        </div>
                                    )}
                                </div>

                                {/* Active/Archived Tabs (Toggle) */}
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => setActiveTab('active')}
                                        className={`px-4 py-2 h-10 rounded-xl text-sm font-bold transition-all border-2 ${activeTab === 'active' ? 'bg-color4 text-color1 border-color4 shadow-sm' : 'bg-color2/30 text-color5 border-color2 hover:bg-color2/50'}`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('archived')}
                                        className={`px-4 py-2 h-10 rounded-xl text-sm font-bold transition-all border-2 ${activeTab === 'archived' ? 'bg-color4 text-color1 border-color4 shadow-sm' : 'bg-color2/30 text-color5 border-color2 hover:bg-color2/50'}`}
                                    >
                                        Archived
                                    </button>
                                </div>

                                {/* Add Student Button */}
                                <button
                                    onClick={() => setIsAddStudentModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium whitespace-nowrap shadow-md hover:shadow-lg transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Student
                                </button>
                            </div>
                        </div>

                        {/* Student List Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {(() => {
                                const TILE_COLORS = [
                                    'bg-color2 border-color3 text-color2-foreground',
                                    'bg-color3 border-color4 text-color3-foreground',
                                    'bg-color4 border-color5 text-color4-foreground',
                                    'bg-color5 border-color4 text-color5-foreground',
                                    'bg-white dark:bg-black/80 border-color2 text-color5'
                                ];
                                const ICON_COLORS = [
                                    'bg-black/10 dark:bg-white/10 text-color2-foreground',
                                    'bg-black/10 dark:bg-white/10 text-color3-foreground',
                                    'bg-black/10 dark:bg-white/10 text-color4-foreground',
                                    'bg-black/10 dark:bg-white/10 text-color5-foreground',
                                    'bg-color1 text-color5'
                                ];
                                const BUTTON_COLORS = [
                                    'bg-color5 text-color5-foreground hover:bg-color5/90', // on color2 -> use color5
                                    'bg-color5 text-color5-foreground hover:bg-color5/90', // on color3 -> use color5
                                    'bg-color5 text-color5-foreground hover:bg-color5/90', // on color4 -> use color5
                                    'bg-color2 text-color2-foreground hover:bg-color2/90', // on color5 -> use color2
                                    'bg-color5 text-color5-foreground hover:bg-color5/90', // on white -> use color5
                                ];

                                return filteredStudents.length > 0 ? (
                                    filteredStudents.map((student, index) => {
                                        const tileColor = TILE_COLORS[index % TILE_COLORS.length];
                                        const iconColor = ICON_COLORS[index % ICON_COLORS.length];
                                        const buttonColor = BUTTON_COLORS[index % BUTTON_COLORS.length];

                                        return (
                                            <div
                                                key={student.id}
                                                onClick={() => setSelectedStudentId(student.id)}
                                                className={`group relative border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md hover:shadow-primary/5 active:scale-[0.98] ${tileColor}`}
                                            >
                                                <div className="flex items-start justify-between mb-4 relative">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 ${iconColor}`}>
                                                        {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle className="w-8 h-8" />}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-xs uppercase font-extrabold tracking-widest shadow-sm ${student.status === 'active' ? 'bg-emerald-500 text-color1' : 'bg-color1 text-color5/70'} `}>
                                                                {student.status}
                                                            </span>
                                                            <button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    // We need a slight delay to avoid the document level click listener firing immediately
                                                                    setTimeout(() => {
                                                                        setStudentMenuOpenId(studentMenuOpenId === student.id ? null : student.id); 
                                                                    }, 0);
                                                                }}
                                                                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        {studentMenuOpenId === student.id && (
                                                            <div className="absolute top-10 right-0 w-36 bg-background border border-border rounded-xl shadow-xl p-1 z-20 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedStudentId(student.id); setStudentMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg flex items-center gap-2 text-foreground"><Pencil className="w-4 h-4" /> Edit</button>
                                                                <button onClick={(e) => { e.stopPropagation(); onUpdateStudent({ ...student, status: student.status === 'archived' ? 'active' : 'archived' }); setStudentMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg flex items-center gap-2 text-foreground"><Archive className="w-4 h-4" /> {student.status === 'archived' ? 'Unarchive' : 'Archive'}</button>
                                                                <div className="h-px bg-border my-1" />
                                                                <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`Are you sure you want to delete ${student.name}?`)) { onDeleteStudent(student.id); } setStudentMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg flex items-center gap-2 text-foreground"><Trash2 className="w-4 h-4" /> Delete</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <h3 className="font-bold text-lg truncate mb-1 group-hover:opacity-80 transition-opacity">{student.name}</h3>

                                                <div className="space-y-1 text-sm opacity-80">
                                                    <p className="flex items-center gap-2">
                                                        <span className="w-4 text-center">🌍</span> {student.originCountry || 'No origin'}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <span className="w-4 text-center">🗣️</span> {student.nativeLanguage || 'Unknown Lang'}
                                                    </p>
                                                </div>

                                                {/* Footer Info */}
                                                <div className="mt-4 pt-3 border-t border-current/15 flex flex-col gap-2.5 text-xs opacity-90">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span><span className="opacity-80">Lvl:</span> <span className="font-bold">{student.englishLevel || 'N/A'}</span></span>
                                                        <span><span className="opacity-80">Cards:</span> <span className="font-bold text-sm tracking-tight">{decks.filter(d => student.activeDeckIds.includes(d.id)).reduce((acc, deck) => acc + deck.cards.length, 0)}</span></span>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setQuickAddInitialParams({ audience: 'specific_student', studentId: student.id });
                                                            setIsQuickAddOpen(true);
                                                        }}
                                                        className={`w-full py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors font-bold shadow-sm hover:shadow active:scale-95 border border-transparent ${buttonColor}`}
                                                    >
                                                        <Zap className="w-3.5 h-3.5" /> QuickCards
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60">
                                        <Users className="w-16 h-16 mb-4 text-muted-foreground/50" />
                                        <h3 className="text-xl font-bold mb-2">No students found</h3>
                                        <p>Try adjusting your search or filters, or add a new student.</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* Manage Flashcards View */}
                {view === 'flashcards' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center border-b border-border pb-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => onViewChange('dashboard')}
                                    className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-all"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold">Flashcard Library</h2>
                                    <p className="text-muted-foreground">Manage global decks and cards.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsManageContentOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                <Plus className="w-5 h-5" /> Add Content
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {decks.map((deck, index) => {
                                const colors = [
                                    { bg: 'bg-sky-500/30', border: 'border-sky-500/40', iconBg: 'bg-sky-500/40', iconText: 'text-sky-400', hoverBg: 'hover:bg-sky-500/35', hoverBorder: 'hover:border-sky-500/50' },
                                    { bg: 'bg-teal-500/30', border: 'border-teal-500/40', iconBg: 'bg-teal-500/40', iconText: 'text-teal-400', hoverBg: 'hover:bg-teal-500/35', hoverBorder: 'hover:border-teal-500/50' },
                                    { bg: 'bg-amber-500/30', border: 'border-amber-500/40', iconBg: 'bg-amber-500/40', iconText: 'text-amber-400', hoverBg: 'hover:bg-amber-500/35', hoverBorder: 'hover:border-amber-500/50' },
                                    { bg: 'bg-cyan-500/30', border: 'border-cyan-500/40', iconBg: 'bg-cyan-500/40', iconText: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500/35', hoverBorder: 'hover:border-cyan-500/50' },
                                    { bg: 'bg-rose-400/30', border: 'border-rose-400/40', iconBg: 'bg-rose-400/40', iconText: 'text-rose-300', hoverBg: 'hover:bg-rose-400/35', hoverBorder: 'hover:border-rose-400/50' },
                                    { bg: 'bg-emerald-400/30', border: 'border-emerald-400/40', iconBg: 'bg-emerald-400/40', iconText: 'text-emerald-300', hoverBg: 'hover:bg-emerald-400/35', hoverBorder: 'hover:border-emerald-400/50' },
                                ];
                                const color = colors[index % colors.length];

                                return (
                                    <div 
                                        key={deck.id} 
                                        onClick={() => onSelectDeck?.(deck.id)}
                                        className={`${color.bg} ${color.border} ${color.hoverBg} ${color.hoverBorder} border rounded-xl p-6 hover:shadow-md transition-all group relative backdrop-blur-sm cursor-pointer`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 ${color.iconBg} rounded-lg ${color.iconText}`}>
                                                <Layout className="w-6 h-6" />
                                            </div>
                                            <span className={`px - 2 py - 1 rounded text - xs font - bold uppercase ${deck.status === 'public' ? 'bg-color1 text-green-700' : 'bg-gray-100 text-gray-600'} `}>
                                                {deck.status || 'private'}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">{deck.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{deck.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1"><Layout className="w-4 h-4" /> {deck.cards.length} cards</span>
                                            {deck.level && <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {deck.level}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {decks.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground">No decks in library.</p>
                                <button onClick={() => setIsManageContentOpen(true)} className="text-primary font-bold mt-2 hover:underline">Create your first deck</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Manage Flashcards (Line-Item List) View */}
                {view === 'manage-flashcards' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* Go Back Header */}
                        <div className="flex items-center gap-4 border-b border-border pb-4">
                            <button
                                onClick={() => onViewChange('learning-content')}
                                className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-all"
                                title="Back to Learning Content"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold">All Flashcards</h2>
                                <p className="text-muted-foreground">View and manage individual flashcards across your entire library.</p>
                            </div>
                        </div>

                        {/* Alert Notification Bar */}
                        {missingDataCount > 0 && (
                            <div className={`border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-colors ${showMissingOnly ? 'bg-color1 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700' : 'bg-amber-50 border-color3/30 dark:bg-amber-900/10 dark:border-amber-800/30 hover:bg-color1 dark:hover:bg-amber-900/20'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 ${showMissingOnly ? 'bg-amber-300 text-amber-900 dark:bg-amber-700 dark:text-amber-100' : 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200'}`}>
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-black dark:text-color1">Attention Required</h3>
                                        <p className="text-sm font-medium text-black/80 dark:text-color1/80">
                                            {missingDataCount} flashcard{missingDataCount === 1 ? '' : 's'} {missingDataCount === 1 ? 'is' : 'are'} missing field data.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => setShowMissingOnly(!showMissingOnly)}
                                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm whitespace-nowrap shrink-0 border-2 ${showMissingOnly ? 'bg-color4 text-color1 border-color4 hover:bg-color4/90' : 'bg-color2/30 text-color5 border-color2 hover:bg-color2/50'}`}
                                    >
                                        {showMissingOnly ? 'Show All Cards' : 'View Alerts'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const missing = allFlashcards.filter(c => !c.definition || !c.example || !c.phonetic || !c.category);
                                            setPendingAiResolveCards(missing);
                                            setOriginalAiResolveTotal(missing.length);
                                        }}
                                        className="px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap shrink-0 bg-color3 text-color5 hover:bg-color3/80 shadow-sm flex items-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" /> Auto-Resolve with A.I.
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Controls Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full mb-2">
                            {/* Search */}
                            <div className="relative w-full sm:max-w-md flex-shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-color5 opacity-50" />
                                <input
                                    type="text"
                                    value={flashcardSearchQuery}
                                    onChange={(e) => setFlashcardSearchQuery(e.target.value)}
                                    placeholder="Search library..."
                                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-color1 border-2 border-color2 focus:bg-white focus:border-color4 outline-none transition-all text-color5 font-medium placeholder-color5/50 shadow-sm h-10"
                                />
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button 
                                    onClick={() => setIsDiagnosticsModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 h-10 bg-color3 text-color5 font-bold rounded-xl shadow-sm hover:bg-color3/80 transition-all text-sm shrink-0 whitespace-nowrap"
                                >
                                    <AlertTriangle className="w-4 h-4" /> Scan Library for Problems
                                </button>
                                <button
                                    onClick={() => setShowArchivedCards(!showArchivedCards)}
                                    className={`flex items-center gap-2 px-4 py-2 h-10 text-sm font-bold rounded-xl shadow-sm transition-all border-2 shrink-0 whitespace-nowrap ${showArchivedCards ? 'bg-color4 text-color1 border-color4 hover:bg-color4/90' : 'bg-color2/30 text-color5 border-color2 hover:bg-color2/50'}`}
                                >
                                    <Archive className="w-4 h-4" />
                                    {showArchivedCards ? 'Hide Archived' : 'Show Archived'}
                                </button>
                            </div>
                        </div>
                        
                        {selectedCardIds.size > 0 && (
                            <div className="mb-2 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-0.5 rounded-md">
                                        {selectedCardIds.size}
                                    </span>
                                    <span className="text-sm font-medium text-foreground">Cards Selected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const isArchiving = !Array.from(selectedCardIds).every(id => 
                                                allFlashcards.find(c => String(c.id) === id)?.isArchived
                                            );
                                            if (window.confirm(`Are you sure you want to ${isArchiving ? 'archive' : 'unarchive'} ${selectedCardIds.size} cards?`)) {
                                                onBulkArchiveCards(Array.from(selectedCardIds), isArchiving);
                                                setSelectedCardIds(new Set());
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-color3 bg-amber-50 hover:bg-color1 rounded-lg transition-colors border border-color3/30"
                                    >
                                        <Archive className="w-4 h-4" />
                                        Archive
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to PERMANENTLY delete ${selectedCardIds.size} cards?`)) {
                                                onBulkDeleteCards(Array.from(selectedCardIds));
                                                setSelectedCardIds(new Set());
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Flashcards List */}
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden pb-4 sm:pb-0">
                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground select-none">
                                            <th className="py-3 px-4 w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCardIds.size === allFlashcards.length && allFlashcards.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCardIds(new Set(allFlashcards.map(c => String(c.id))));
                                                        } else {
                                                            setSelectedCardIds(new Set());
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                                />
                                            </th>
                                            <th className="py-3 px-4 font-bold whitespace-nowrap relative">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => setActiveColumnMenu(activeColumnMenu === 'word' ? null : 'word')}>
                                                    Word / Phrase {sortConfig?.key === 'word' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                                </div>
                                                {renderColumnMenu('word', (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex gap-1 border-b border-border pb-2">
                                                            <button onClick={() => setSortConfig({ key: 'word', direction: 'asc' })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded transition-colors ${sortConfig?.key === 'word' && sortConfig.direction === 'asc' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}>A-Z</button>
                                                            <button onClick={() => setSortConfig({ key: 'word', direction: 'desc' })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded transition-colors ${sortConfig?.key === 'word' && sortConfig.direction === 'desc' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}>Z-A</button>
                                                        </div>
                                                        <div className="relative">
                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                            <input type="text" value={flashcardSearchQuery} onChange={(e) => setFlashcardSearchQuery(e.target.value)} placeholder="Search words..." className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background/50 text-sm focus:ring-1 focus:ring-primary/20 outline-none" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </th>
                                            <th className="py-3 px-4 font-bold whitespace-nowrap hidden sm:table-cell relative">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => setActiveColumnMenu(activeColumnMenu === 'definition' ? null : 'definition')}>
                                                    Definition {sortConfig?.key === 'definition' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                                </div>
                                                {renderColumnMenu('definition', (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex gap-1 border-b border-border pb-2">
                                                            <button onClick={() => setSortConfig({ key: 'definition', direction: 'asc' })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded transition-colors ${sortConfig?.key === 'definition' && sortConfig.direction === 'asc' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}>A-Z</button>
                                                            <button onClick={() => setSortConfig({ key: 'definition', direction: 'desc' })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded transition-colors ${sortConfig?.key === 'definition' && sortConfig.direction === 'desc' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}>Z-A</button>
                                                        </div>
                                                        <div className="relative">
                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                            <input type="text" value={flashcardSearchQuery} onChange={(e) => setFlashcardSearchQuery(e.target.value)} placeholder="Search definitions..." className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background/50 text-sm focus:ring-1 focus:ring-primary/20 outline-none" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </th>
                                            <th className="py-3 px-4 font-bold whitespace-nowrap relative">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => setActiveColumnMenu(activeColumnMenu === 'category' ? null : 'category')}>
                                                    Category {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                                </div>
                                                {renderColumnMenu('category', (
                                                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-primary/20">
                                                        <option value="all">All Categories</option>
                                                        {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                    </select>
                                                ))}
                                            </th>
                                            <th className="py-3 px-4 font-bold whitespace-nowrap hidden md:table-cell relative">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => setActiveColumnMenu(activeColumnMenu === 'deckTitle' ? null : 'deckTitle')}>
                                                    Deck {sortConfig?.key === 'deckTitle' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                                </div>
                                                {renderColumnMenu('deckTitle', (
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                        <input type="text" value={flashcardSearchQuery} onChange={(e) => setFlashcardSearchQuery(e.target.value)} placeholder="Search decks..." className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary/20 outline-none" />
                                                    </div>
                                                ))}
                                            </th>
                                            <th className="py-3 px-4 font-bold whitespace-nowrap relative">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => setActiveColumnMenu(activeColumnMenu === 'student' ? null : 'student')}>
                                                    Assigned Students {sortConfig?.key === 'student' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                                </div>
                                                {renderColumnMenu('student', (
                                                    <select value={filterStudentId} onChange={(e) => setFilterStudentId(e.target.value)} className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-primary/20">
                                                        <option value="all">All Students</option>
                                                        <option value="unassigned">Unassigned</option>
                                                        {students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
                                                    </select>
                                                ))}
                                            </th>
                                            <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {allFlashcards.length > 0 ? (
                                            allFlashcards.map((card, index) => {
                                                const isMissingData = !card.definition || !card.example || !card.phonetic || !card.category;
                                                return (
                                                    <tr key={`${card.deckId}-${card.id}-${index}`} className={`border-b border-border hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${index % 2 !== 0 ? 'bg-gray-100 dark:bg-gray-900/50' : ''} ${card.isArchived ? 'opacity-60 bg-amber-50/10' : ''}`}>
                                                        <td className="py-3 px-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCardIds.has(String(card.id))}
                                                                onChange={(e) => {
                                                                    const newSelected = new Set(selectedCardIds);
                                                                    if (e.target.checked) {
                                                                        newSelected.add(String(card.id));
                                                                    } else {
                                                                        newSelected.delete(String(card.id));
                                                                    }
                                                                    setSelectedCardIds(newSelected);
                                                                }}
                                                                className="w-4 h-4 rounded border-input text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </td>
                                                        <td className={`py-3 px-4 font-bold max-w-[200px] ${index % 2 !== 0 ? 'text-color1' : 'text-primary'}`}>
                                                            <div className="flex items-center gap-2">
                                                                {isMissingData && (
                                                                    <div title="Missing field data. Edit card to resolve." className="shrink-0">
                                                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                                    </div>
                                                                )}
                                                                <span className="truncate" title={card.word}>{card.word}</span>
                                                            </div>
                                                        </td>
                                                        <td className={`py-3 px-4 truncate max-w-[200px] hidden sm:table-cell ${index % 2 !== 0 ? 'text-color1' : 'text-muted-foreground'}`} title={card.definition}>
                                                            {card.definition}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                                                                {card.category || 'Uncategorized'}
                                                            </span>
                                                        </td>
                                                        <td className={`py-3 px-4 truncate max-w-[150px] hidden md:table-cell ${index % 2 !== 0 ? 'text-color1' : 'text-muted-foreground'}`} title={card.deckTitle}>
                                                            {card.deckTitle}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {card.assignedStudents.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {card.assignedStudents.map(student => (
                                                                        <button
                                                                            key={student.id}
                                                                            onClick={() => setSelectedStudentId(student.id)}
                                                                            className="px-2 py-0.5 bg-color1 text-blue-700 hover:bg-blue-200 hover:text-color5 rounded text-xs font-medium transition-colors"
                                                                        >
                                                                            {student.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className={`italic text-xs ${index % 2 !== 0 ? 'text-color1' : 'text-muted-foreground'}`}>Unassigned</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPreviewCard(card);
                                                                        setIsPreviewFlipped(false);
                                                                    }}
                                                                    className={`p-1.5 rounded hover:bg-muted transition-colors ${index % 2 !== 0 ? 'text-color1 hover:text-color1/80' : 'text-muted-foreground hover:text-secondary-foreground'}`}
                                                                    title="View as Flashcard"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingCard(card); }}
                                                                    className={`p-1.5 rounded hover:bg-muted transition-colors ${index % 2 !== 0 ? 'text-color1 hover:text-color1/80' : 'text-muted-foreground hover:text-primary'}`}
                                                                    title="Edit Flashcard"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (window.confirm(`Are you sure you want to delete "${card.word}"?`)) {
                                                                            onDeleteCard(String(card.id));
                                                                        }
                                                                    }}
                                                                    className={`p-1.5 rounded hover:bg-red-100 transition-colors ${index % 2 !== 0 ? 'text-color1 hover:text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                                                                    title="Delete Flashcard"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center placeholder">
                                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                                            <Library className="w-8 h-8 text-primary" />
                                                        </div>
                                                        <h3 className="text-xl font-bold mb-2 text-foreground">Let's start filling your library!</h3>
                                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                                                            You don't have any flashcards matching your criteria. Create your own custom cards or adjust your search.
                                                        </p>
                                                        <button
                                                            onClick={() => setIsManageContentOpen(true)}
                                                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold transition-all shadow-sm"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            Create New Cards
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review New Flashcards View */}
                {view === 'review-new-flashcards' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => onViewChange('dashboard')}
                                    className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-all"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        Review New Flashcards 
                                        <span className="bg-primary/20 text-primary text-sm px-2 py-0.5 rounded-full">{pendingQuickAddCards.length} Pending</span>
                                    </h2>
                                    <p className="text-muted-foreground text-sm">Review, edit, and approve the flashcards you just created.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        const missing = pendingQuickAddCards.filter(c => !c.definition || !c.category);
                                        if (missing.length === 0) {
                                            alert("All pending cards already have definitions and categories!");
                                            return;
                                        }
                                        setQuickAddAiTotal(missing.length);
                                        setQuickAddAiQueue(missing);
                                    }}
                                    disabled={pendingQuickAddCards.length === 0 || !apiKey}
                                    className={`px-4 py-2 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${!apiKey ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'}`}
                                    title={!apiKey ? "Set API Key in Settings to use AI" : "Auto-fill missing fields via AI"}
                                >
                                    <Sparkles className="w-5 h-5" /> Fill Missing Fields with A.I.
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm("Discard all pending flashcards?")) {
                                            setPendingQuickAddCards([]);
                                            onViewChange('dashboard');
                                        }
                                    }}
                                    className="px-4 py-2 border border-destructive text-destructive hover:bg-destructive/10 rounded-xl font-bold transition-colors"
                                >
                                    Discard All
                                </button>
                                <button
                                    onClick={handleApprovePendingCards}
                                    disabled={pendingQuickAddCards.length === 0}
                                    className="px-6 py-2 bg-primary text-primary-foreground shadow-lg hover:shadow-primary/25 hover:scale-[1.02] rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Check className="w-5 h-5" /> Approve All
                                </button>
                            </div>
                        </div>

                        {pendingQuickAddCards.length === 0 ? (
                            <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-secondary">
                                <p className="text-xl font-bold text-muted-foreground">No pending flashcards.</p>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto min-h-[300px]">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground select-none">
                                                <th className="py-3 px-4 font-bold whitespace-nowrap">Word / Phrase</th>
                                                <th className="py-3 px-4 font-bold whitespace-nowrap hidden sm:table-cell">Definition</th>
                                                <th className="py-3 px-4 font-bold whitespace-nowrap">Category</th>
                                                <th className="py-3 px-4 font-bold whitespace-nowrap hidden md:table-cell">Example</th>
                                                <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {pendingQuickAddCards.map((card, index) => (
                                                <tr key={card.id} className={`border-b border-border hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${index % 2 !== 0 ? 'bg-secondary/20' : ''}`}>
                                                    <td className="py-3 px-4 font-bold max-w-[200px] text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <span className="truncate" title={card.word}>{card.word}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 truncate max-w-[200px] hidden sm:table-cell text-muted-foreground" title={card.definition}>
                                                        {card.definition || '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                                                            {card.category || 'Uncategorized'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 truncate max-w-[200px] hidden md:table-cell text-muted-foreground" title={card.example}>
                                                        {card.example || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setEditingPendingCard(card); }}
                                                                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                                                                title="Edit Flashcard"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPendingQuickAddCards(prev => prev.filter(c => c.id !== card.id));
                                                                }}
                                                                className="p-1.5 rounded hover:bg-red-100 transition-colors text-muted-foreground hover:text-red-500"
                                                                title="Delete Flashcard"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Global Add Content Modal */}
            {isManageContentOpen && (
                <AddContentModal
                    onClose={() => setIsManageContentOpen(false)}
                    mode="tutor"
                    availableDecks={decks}
                    availableCards={decks.flatMap(d => d.cards)}
                    onCreateNewCard={(card, deckId) => onAddCard(card, deckId)}
                    onCreateNewDeck={onAddDeck}
                    apiKey={apiKey}
                />
            )}

            {/* Student Profile Modal */}
            {selectedStudentId && (
                <StudentProfile
                    student={students.find(s => s.id === selectedStudentId)!}
                    onClose={() => setSelectedStudentId(null)}
                    onSave={onUpdateStudent}
                    onDeleteStudent={onDeleteStudent}
                    decks={decks}
                    onAddCard={onAddCard}
                    onEditCard={onEditCard}
                    apiKey={apiKey}
                    settings={settings}
                />
            )}

            {/* Edit Card Modal */}
            {editingCard && (
                <EditCardModal
                    card={editingCard}
                    settings={settings}
                    apiKey={apiKey || ''}
                    onSave={(updated, additionalCards) => {
                        onEditCard(updated);
                        if (additionalCards && additionalCards.length > 0) {
                            const currentDeck = decks.find(d => d.cards.some(c => c.id === updated.id));
                            if (currentDeck) {
                                additionalCards.forEach(ac => onAddCard(ac, currentDeck.id));
                            } else if (decks.length > 0) {
                                additionalCards.forEach(ac => onAddCard(ac, decks[0].id));
                            }
                        }
                        setEditingCard(null);
                    }}
                    onCancel={() => setEditingCard(null)}
                />
            )}

            {/* Edit Pending Card Modal */}
            {editingPendingCard && (
                <EditCardModal
                    card={editingPendingCard}
                    settings={settings}
                    apiKey={apiKey || ''}
                    onSave={(updated, additionalCards) => {
                        const committed = [updated];
                        if (additionalCards && additionalCards.length > 0) {
                            committed.push(...additionalCards);
                        }
                        commitCardsToLibrary(committed, false);
                        setEditingPendingCard(null);
                    }}
                    onCancel={() => setEditingPendingCard(null)}
                />
            )}

            {/* Quick Add AI Bulk Resolution Modal */}
            {quickAddAiQueue.length > 0 && (
                <EditCardModal
                    key={`quick-ai-resolve-${quickAddAiQueue[0].id}-${quickAddAiQueue.length}`}
                    card={quickAddAiQueue[0]}
                    settings={settings}
                    apiKey={apiKey || ''}
                    isAiResolveMode={true}
                    aiResolveQueueInfo={{ current: quickAddAiTotal - quickAddAiQueue.length + 1, total: quickAddAiTotal }}
                    onSave={(updated, additionalCards) => {
                        const committed = [updated];
                        if (additionalCards && additionalCards.length > 0) {
                            committed.push(...additionalCards);
                        }
                        commitCardsToLibrary(committed, false);
                        setQuickAddAiQueue(prev => prev.slice(1));
                    }}
                    onDecline={() => {
                        setQuickAddAiQueue(prev => prev.slice(1));
                    }}
                    onCancel={() => setQuickAddAiQueue([])}
                />
            )}

            {/* AI Bulk Resolution Modal */}
            {pendingAiResolveCards.length > 0 && (
                <EditCardModal
                    key={`ai-resolve-${pendingAiResolveCards[0].id}-${pendingAiResolveCards.length}`}
                    card={pendingAiResolveCards[0]}
                    settings={settings}
                    apiKey={apiKey || ''}
                    isAiResolveMode={true}
                    aiResolveQueueInfo={{ current: originalAiResolveTotal - pendingAiResolveCards.length + 1, total: originalAiResolveTotal }}
                    onSave={(updated, additionalCards) => {
                        // Polymorphic Save: The AI Bulk Resolver might be triggered from 
                        // the local uncommitted QuickAdd queue OR the global Manage Flashcards library.
                        
                        // 1. Attempt local staging queue sync
                        setPendingQuickAddCards(prev => {
                            const clone = [...prev];
                            const targetIdx = clone.findIndex(c => c.id === updated.id);
                            if (targetIdx !== -1) {
                                clone[targetIdx] = updated;
                                if (additionalCards && additionalCards.length > 0) {
                                    clone.splice(targetIdx + 1, 0, ...additionalCards);
                                }
                            }
                            return clone;
                        });

                        // 2. Attempt explicit global library sync
                        const targetDeckId = (updated as any).deckId || (pendingAiResolveCards[0] as any).deckId;
                        if (additionalCards && additionalCards.length > 0 && targetDeckId) {
                            onEditCard(updated, additionalCards.map(ac => ({ card: ac, deckId: targetDeckId })));
                        } else {
                            onEditCard(updated);
                        }
                        
                        setPendingAiResolveCards(prev => prev.slice(1));
                    }}
                    onDecline={() => {
                        setPendingAiResolveCards(prev => prev.slice(1));
                    }}
                    onCancel={() => setPendingAiResolveCards([])}
                />
            )}

            {/* View as Flashcard Preview Modal */}
            {previewCard && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-background rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Card Preview</h3>
                                <p className="text-sm text-muted-foreground">This is how learners see the card.</p>
                            </div>
                            <button
                                onClick={() => setPreviewCard(null)}
                                className="p-2 hover:bg-secondary rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Card Container */}
                        <div className="p-8 flex justify-center bg-secondary/10">
                            <Flashcard
                                word={previewCard}
                                isFlipped={isPreviewFlipped}
                                onFlip={() => setIsPreviewFlipped(!isPreviewFlipped)}
                                settings={settings}
                            />
                        </div>

                        {/* Footer details */}
                        <div className="p-4 bg-muted/30 border-t border-border flex justify-between items-center text-sm font-medium text-muted-foreground">
                            <span>Category: {previewCard.category || 'Vocabulary'}</span>
                            <button
                                onClick={() => setIsPreviewFlipped(!isPreviewFlipped)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                {isPreviewFlipped ? 'Flip to Front' : 'Flip to Back'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <LibraryDiagnosticsModal
                isOpen={isDiagnosticsModalOpen}
                onClose={() => setIsDiagnosticsModalOpen(false)}
                decks={decks}
                onResolveMissing={(card) => {
                    setIsDiagnosticsModalOpen(false);
                    onViewChange('manage-flashcards'); // Switch view so user can see it being edited in context?
                    setTimeout(() => setEditingCard({ ...card, deckId: card.deckId }), 100);
                }}
                onResolveDuplicates={(duplicates) => {
                    setIsDiagnosticsModalOpen(false);
                    setResolvingDuplicates(duplicates);
                }}
            />

            <DuplicateResolverModal
                isOpen={resolvingDuplicates !== null}
                onClose={() => setResolvingDuplicates(null)}
                settings={settings}
                duplicates={resolvingDuplicates || []}
                onResolve={(keptCards) => {
                    if (resolvingDuplicates) {
                        const originalIds = resolvingDuplicates.map(c => String(c.id));
                        const keepIds = keptCards.map(c => String(c.id));
                        
                        // The ones that were not selected for keeping should be deleted
                        const idsToDelete = originalIds.filter(id => !keepIds.includes(id));
                        
                        keptCards.forEach(kept => {
                            if (kept.id !== -1) {
                                let updatedCard = kept;
                                if (keptCards.length > 1) {
                                    const otherKeptIds = keepIds
                                        .filter(id => id !== String(kept.id))
                                        .map(id => parseInt(id, 10));
                                    
                                    const currentIgnored = kept.ignoredDuplicateIds || [];
                                    const newIgnored = Array.from(new Set([...currentIgnored, ...otherKeptIds]));
                                    updatedCard = { ...kept, ignoredDuplicateIds: newIgnored };
                                }
                                onEditCard(updatedCard);
                            }
                        });

                        // Delete the others
                        if (idsToDelete.length > 0) {
                            onBulkDeleteCards(idsToDelete);
                        }
                    }
                    setResolvingDuplicates(null);
                }}
            />
        </div>
    );
};
