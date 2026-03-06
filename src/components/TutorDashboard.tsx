import React, { useState, useMemo } from 'react';
import { Student, Deck, AppSettings, UserProfile } from '../types';
import { Word } from '../data/vocabulary';
import { Search, Plus, UserCircle, ChevronDown, SortAsc, Clock, GraduationCap, Users, Layout, Zap, MessageSquare, CheckSquare, ArrowLeft, MapPin, Bell, Library, ChevronUp, Pencil, Filter, ArrowDownAZ, ArrowUpAZ, X, AlertTriangle, Send } from 'lucide-react';
import { StudentProfile } from './StudentProfile';
import { AddContentModal } from './AddContentModal';
import { EditCardModal } from './EditCardModal';

interface TutorDashboardProps {
    user: UserProfile;
    students: Student[];
    decks: Deck[];
    onUpdateStudent: (student: Student) => void;
    onAddStudent: (student: Student) => void;
    view: 'dashboard' | 'students' | 'flashcards' | 'learning-content' | 'manage-flashcards';
    onViewChange: (view: 'dashboard' | 'students' | 'flashcards' | 'learning-content' | 'manage-flashcards') => void;
    onAddDeck: (deck: Deck) => void;
    onAddCard: (card: Word, deckId: string) => void;
    onEditCard: (card: Word) => void;
    apiKey?: string;
    settings: AppSettings;
    onNavigateToProfile?: (target?: string) => void;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({ user, students, decks, onUpdateStudent, onAddStudent, view, onViewChange, onAddDeck, onAddCard, onEditCard, apiKey, settings, onNavigateToProfile }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
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
    const [showMissingOnly, setShowMissingOnly] = useState(false);

    // Add Student / Quicksend State
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
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
            <main className="flex-1 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
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
                    </div>
                </div>



                {/* Page Header */}
                {/* The original page header content was replaced by the new header and filter/search bar above. */}

                {view === 'dashboard' && (
                    <div className="flex flex-col gap-6 max-w-6xl mx-auto mt-6">
                        {/* Tutor Hero Tile */}
                        <div className="bg-zinc-700 border border-zinc-600 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-md relative overflow-hidden text-zinc-100">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            {/* Profile Info (Left) */}
                            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto md:min-w-[320px] shrink-0">
                                <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/20 flex-shrink-0 overflow-hidden">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Tutor avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-12 h-12" />
                                    )}
                                </div>
                                <div className="flex-1 z-10">
                                    <h2 className="text-3xl font-bold mb-2 text-white">
                                        {user.preferredName || user.firstName || 'Tutor'} {user.lastName || ''}
                                    </h2>
                                    <div className="flex flex-col gap-y-1.5 mt-3 text-sm text-zinc-400 font-medium">
                                        <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-zinc-300" /> <span className="text-zinc-300 pointer-events-none">Professional Tutor</span></span>
                                        <span
                                            className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                                            onClick={() => onNavigateToProfile?.('section-location')}
                                            title="Edit Location"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            {user.currentCity ? `${user.currentCity}, ${user.currentCountry}` : (user.currentCountry || 'Location Not Set')}
                                        </span>
                                        <span
                                            className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                                            onClick={() => onNavigateToProfile?.('section-timezone')}
                                            title="Edit Timezone"
                                        >
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

                                {/* Active Students Widget */}
                                <div
                                    onClick={() => onViewChange('students')}
                                    className="bg-blue-500/20 hover:bg-blue-500/30 cursor-pointer transition-colors backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm"
                                >
                                    <Users className="w-5 h-5 text-blue-400 mb-2" />
                                    <span className="text-2xl font-bold text-white">{stats.active}</span>
                                    <span className="text-xs text-zinc-300 text-center line-clamp-2">Active<br />Students</span>
                                </div>

                                {/* Inbox/Pending Widget */}
                                <div
                                    onClick={() => alert('Messages Navigation - Coming Soon')}
                                    className="bg-green-500/20 hover:bg-green-500/30 cursor-pointer transition-colors backdrop-blur-sm border border-green-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm relative"
                                >
                                    <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                    <Bell className="w-5 h-5 text-green-400 mb-2" />
                                    <span className="text-2xl font-bold text-white">3</span>
                                    <span className="text-xs text-zinc-300 text-center line-clamp-2">New<br />Messages</span>
                                </div>

                                {/* Add Student Widget */}
                                <div
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        setIsAddStudentModalOpen(true);
                                    }}
                                    className="bg-primary/20 hover:bg-primary/30 cursor-pointer transition-colors backdrop-blur-sm border border-primary/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm group"
                                >
                                    <Plus className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold text-white text-center leading-tight">Add<br />Student</span>
                                </div>
                            </div>
                        </div>

                        {/* Control Dashboard Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* All Content Tile */}
                            <div
                                onClick={() => onViewChange('flashcards')}
                                className="bg-cyan-500/25 hover:bg-cyan-500/30 border border-cyan-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-cyan-200">
                                    <Library className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1">All Content</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">Browse the complete library of global flashcards and decks.</p>
                                </div>
                            </div>

                            {/* Quickstart Tile */}
                            <div
                                onClick={() => alert('Quickstart Navigation - Coming Soon')}
                                className="bg-yellow-500/25 hover:bg-yellow-500/30 border border-yellow-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-yellow-200">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1">Quickstart</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">Jump straight into your next scheduled session or lesson plan.</p>
                                </div>
                            </div>

                            {/* Manage Students Tile */}
                            <div
                                onClick={() => onViewChange('students')}
                                className="bg-blue-500/25 hover:bg-blue-500/30 border border-blue-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-blue-200">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">Students <span className="bg-blue-100 text-blue-800 text-xs py-0.5 px-2 rounded-full font-bold">{students.length}</span></h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">View progress, assign homework, and manage student profiles.</p>
                                </div>
                            </div>

                            {/* Manage Learning Content Tile */}
                            <div
                                onClick={() => onViewChange('learning-content')}
                                className="bg-green-500/25 hover:bg-green-500/30 border border-green-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-green-200">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">Manage Learning Content</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">Create, edit, and organize flashcard decks for your students.</p>
                                </div>
                            </div>

                            {/* Messages Tile */}
                            <div
                                onClick={() => alert('Messages Navigation - Coming Soon')}
                                className="bg-purple-500/25 hover:bg-purple-500/30 border border-purple-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-purple-200">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1">Messages</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">Communicate directly with your students and review feedback.</p>
                                </div>
                            </div>

                            {/* To-Do List Tile */}
                            <div
                                onClick={() => alert('To-Do List Navigation - Coming Soon')}
                                className="bg-orange-500/25 hover:bg-orange-500/30 border border-orange-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-orange-200">
                                    <CheckSquare className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1">To Do List</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">Track your administrative tasks, grading, and upcoming goals.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Learning Content View */}
                {view === 'learning-content' && (
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
                                <h2 className="text-2xl font-bold">Manage Learning Content</h2>
                                <p className="text-muted-foreground">Create, organize, and explore flashcard decks.</p>
                            </div>
                        </div>

                        {/* Content Action Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Manage Flashcards Tile */}
                            <div
                                onClick={() => onViewChange('manage-flashcards')}
                                className="bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-sky-200">
                                    <Library className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1">Manage Flashcards</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">View and edit your entire library of individual flashcards.</p>
                                </div>
                            </div>

                            {/* Manage Decks Tile */}
                            <div
                                onClick={() => onViewChange('flashcards')}
                                className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-indigo-200">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1">Manage Decks</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">Organize your flashcards into structured learning decks.</p>
                                </div>
                            </div>

                            {/* Create New Tile */}
                            <div
                                onClick={() => setIsManageContentOpen(true)}
                                className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-green-200">
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
                                className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-amber-200">
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
                                className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/20 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg group flex flex-col gap-4 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors"></div>
                                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-rose-200">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="relative z-10 font-medium">
                                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">Student Requests</h2>
                                    <p className="text-sm text-muted-foreground line-clamp-2">Review topic and deck requests submitted by your students.</p>
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, language, country..."
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
                                <div className="flex bg-secondary/50 p-1 rounded-lg gap-1">
                                    <button
                                        onClick={() => setActiveTab('active')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('archived')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'archived' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
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
                                    'bg-green-100 border-green-200 text-green-900', // Pastel green
                                    'bg-blue-100 border-blue-200 text-blue-900',   // Pastel blue
                                    'bg-[#F5F5DC] border-[#E6E6CA] text-stone-900'   // Pastel tan (Beige)
                                ];
                                const ICON_COLORS = [
                                    'bg-white/60 text-green-700',
                                    'bg-white/60 text-blue-700',
                                    'bg-white/60 text-stone-700',
                                ];

                                return filteredStudents.length > 0 ? (
                                    filteredStudents.map((student, index) => {
                                        const tileColor = TILE_COLORS[index % TILE_COLORS.length];
                                        const iconColor = ICON_COLORS[index % ICON_COLORS.length];

                                        return (
                                            <div
                                                key={student.id}
                                                onClick={() => setSelectedStudentId(student.id)}
                                                className={`group relative border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md hover:shadow-primary/5 active:scale-[0.98] ${tileColor}`}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 ${iconColor}`}>
                                                        {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle className="w-8 h-8" />}
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className={`px-3 py-1 rounded-full text-xs uppercase font-extrabold tracking-widest shadow-sm ${student.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'} `}>
                                                            {student.status}
                                                        </span>
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
                                                <div className="mt-4 pt-3 border-t border-current/10 flex justify-between text-xs opacity-70">
                                                    <span>Level: {student.englishLevel || 'N/A'}</span>
                                                    <span className="font-bold">{student.requestsHomework ? '📚 HW' : ''}</span>
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
                                    <div key={deck.id} className={`${color.bg} ${color.border} ${color.hoverBg} ${color.hoverBorder} border rounded-xl p-6 hover:shadow-md transition-all group relative backdrop-blur-sm`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 ${color.iconBg} rounded-lg ${color.iconText}`}>
                                                <Layout className="w-6 h-6" />
                                            </div>
                                            <span className={`px - 2 py - 1 rounded text - xs font - bold uppercase ${deck.status === 'public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} `}>
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
                            <div className={`border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-colors ${showMissingOnly ? 'bg-amber-100 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-900/20'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 ${showMissingOnly ? 'bg-amber-300 text-amber-900 dark:bg-amber-700 dark:text-amber-100' : 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200'}`}>
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-black dark:text-white">Attention Required</h3>
                                        <p className="text-sm font-medium text-black/80 dark:text-white/80">
                                            {missingDataCount} flashcard{missingDataCount === 1 ? '' : 's'} {missingDataCount === 1 ? 'is' : 'are'} missing field data.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowMissingOnly(!showMissingOnly)}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${showMissingOnly ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200' : 'bg-white text-slate-900 border border-slate-300 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    {showMissingOnly ? 'Show All Cards' : 'View Alerts'}
                                </button>
                            </div>
                        )}

                        {/* Controls Bar */}
                        <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
                                {/* Search */}
                                <div className="relative w-full lg:w-96 flex-shrink-0">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={flashcardSearchQuery}
                                        onChange={(e) => setFlashcardSearchQuery(e.target.value)}
                                        placeholder="Search words, definitions..."
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>

                                {/* Filters and Sort Toggle */}
                                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                    {/* Category Filter */}
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="all">All Categories</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>

                                    {/* Student Filter */}
                                    <select
                                        value={filterStudentId}
                                        onChange={(e) => setFilterStudentId(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="all">All Students</option>
                                        <option value="unassigned">Unassigned</option>
                                        {students.map(student => (
                                            <option key={student.id} value={student.id}>{student.name}</option>
                                        ))}
                                    </select>

                                    {/* Visible Sort Toggles */}
                                    <div className="flex bg-secondary/50 p-1 rounded-lg gap-1 border border-border/50">
                                        <button
                                            onClick={() => setSortConfig({ key: 'word', direction: 'asc' })}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${sortConfig?.key === 'word' && sortConfig.direction === 'asc' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            title="Sort A to Z"
                                        >
                                            A-Z
                                        </button>
                                        <button
                                            onClick={() => setSortConfig({ key: 'word', direction: 'desc' })}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${sortConfig?.key === 'word' && sortConfig.direction === 'desc' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            title="Sort Z to A"
                                        >
                                            Z-A
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Flashcards List */}
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden pb-4 sm:pb-0">
                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground select-none">
                                            <th className="py-3 px-4 font-bold whitespace-nowrap relative">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => setActiveColumnMenu(activeColumnMenu === 'word' ? null : 'word')}>
                                                    Word / Phrase {sortConfig?.key === 'word' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                                </div>
                                                {renderColumnMenu('word', (
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                        <input type="text" value={flashcardSearchQuery} onChange={(e) => setFlashcardSearchQuery(e.target.value)} placeholder="Search words..." className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary/20 outline-none" />
                                                    </div>
                                                ))}
                                            </th>
                                            <th className="py-3 px-4 font-bold whitespace-nowrap hidden sm:table-cell relative">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => setActiveColumnMenu(activeColumnMenu === 'definition' ? null : 'definition')}>
                                                    Definition {sortConfig?.key === 'definition' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                                </div>
                                                {renderColumnMenu('definition', (
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                        <input type="text" value={flashcardSearchQuery} onChange={(e) => setFlashcardSearchQuery(e.target.value)} placeholder="Search definitions..." className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary/20 outline-none" />
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
                                                    <tr key={`${card.deckId}-${card.id}-${index}`} className={`border-b border-border hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${index % 2 !== 0 ? 'bg-gray-100 dark:bg-gray-900/50' : ''}`}>
                                                        <td className={`py-3 px-4 font-bold max-w-[200px] ${index % 2 !== 0 ? 'text-white' : 'text-primary'}`}>
                                                            <div className="flex items-center gap-2">
                                                                {isMissingData && (
                                                                    <div title="Missing field data. Edit card to resolve." className="shrink-0">
                                                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                                    </div>
                                                                )}
                                                                <span className="truncate" title={card.word}>{card.word}</span>
                                                            </div>
                                                        </td>
                                                        <td className={`py-3 px-4 truncate max-w-[200px] hidden sm:table-cell ${index % 2 !== 0 ? 'text-white' : 'text-muted-foreground'}`} title={card.definition}>
                                                            {card.definition}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                                                                {card.category || 'Uncategorized'}
                                                            </span>
                                                        </td>
                                                        <td className={`py-3 px-4 truncate max-w-[150px] hidden md:table-cell ${index % 2 !== 0 ? 'text-white' : 'text-muted-foreground'}`} title={card.deckTitle}>
                                                            {card.deckTitle}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {card.assignedStudents.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {card.assignedStudents.map(student => (
                                                                        <button
                                                                            key={student.id}
                                                                            onClick={() => setSelectedStudentId(student.id)}
                                                                            className="px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 rounded text-xs font-medium transition-colors"
                                                                        >
                                                                            {student.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className={`italic text-xs ${index % 2 !== 0 ? 'text-white' : 'text-muted-foreground'}`}>Unassigned</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setEditingCard(card); }}
                                                                className={`p-1.5 rounded hover:bg-muted transition-colors ${index % 2 !== 0 ? 'text-white hover:text-white/80' : 'text-muted-foreground hover:text-primary'}`}
                                                                title="Edit Flashcard"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                    No flashcards found matching your criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                    onSave={(updated) => {
                        onEditCard(updated);
                        setEditingCard(null);
                    }}
                    onCancel={() => setEditingCard(null)}
                />
            )}
        </div>
    );
};
