import React, { useState, useMemo } from 'react';
import { Student, Deck, AppSettings, UserProfile } from '../types';
import { Word } from '../data/vocabulary';
import { Search, Plus, UserCircle, ChevronDown, SortAsc, Clock, GraduationCap, Users, Layout, Zap, MessageSquare, CheckSquare, ArrowLeft, MapPin, Bell, Library } from 'lucide-react';
import { StudentProfile } from './StudentProfile';
import { AddContentModal } from './AddContentModal';

interface TutorDashboardProps {
    user: UserProfile;
    students: Student[];
    decks: Deck[];
    onUpdateStudent: (student: Student) => void;
    onAddStudent: (student: Student) => void;
    view: 'dashboard' | 'students' | 'flashcards';
    onViewChange: (view: 'dashboard' | 'students' | 'flashcards') => void;
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

    // Sort Dropdown State
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const sortDropdownRef = React.useRef<HTMLDivElement>(null);

    // Close sort dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setIsSortDropdownOpen(false);
            }
        };

        if (isSortDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSortDropdownOpen]);

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

                    <div className="flex gap-3">

                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-5 h-5" />
                            Add Student
                        </button>
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
                                    className="bg-zinc-500/20 hover:bg-zinc-500/30 cursor-pointer transition-colors backdrop-blur-sm border border-zinc-500/30 rounded-2xl p-4 flex flex-col justify-center items-center flex-1 max-w-[12rem] md:w-28 shadow-sm"
                                >
                                    <Users className="w-5 h-5 text-zinc-400 mb-2" />
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
                                onClick={() => setIsManageContentOpen(true)}
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
                                    onClick={handleAddNew}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium whitespace-nowrap shadow-md hover:shadow-lg transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Student
                                </button>
                            </div>
                        </div>

                        {/* Student List Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <div
                                        key={student.id}
                                        onClick={() => setSelectedStudentId(student.id)}
                                        className="group relative bg-card hover:bg-secondary/20 border border-border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg overflow-hidden">
                                                {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle className="w-8 h-8" />}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`px - 2 py - 0.5 rounded text - [10px] uppercase font - bold tracking - wider ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} `}>
                                                    {student.status}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-lg truncate mb-1 group-hover:text-primary transition-colors">{student.name}</h3>

                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p className="flex items-center gap-2">
                                                <span className="w-4 text-center">🌍</span> {student.originCountry || 'No origin'}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="w-4 text-center">🗣️</span> {student.nativeLanguage || 'Unknown Lang'}
                                            </p>
                                        </div>

                                        {/* Footer Info */}
                                        <div className="mt-4 pt-3 border-t border-border/50 flex justify-between text-xs text-muted-foreground">
                                            <span>Level: {student.englishLevel || 'N/A'}</span>
                                            <span>{student.requestsHomework ? '📚 HW' : ''}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60">
                                    <Users className="w-16 h-16 mb-4 text-muted-foreground/50" />
                                    <h3 className="text-xl font-bold mb-2">No students found</h3>
                                    <p>Try adjusting your search or filters, or add a new student.</p>
                                </div>
                            )}
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
                            {decks.map(deck => (
                                <div key={deck.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
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
                            ))}
                        </div>

                        {decks.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground">No decks in library.</p>
                                <button onClick={() => setIsManageContentOpen(true)} className="text-primary font-bold mt-2 hover:underline">Create your first deck</button>
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
                    decks={decks}
                    onAddCard={onAddCard}
                    onEditCard={onEditCard}
                    apiKey={apiKey}
                    settings={settings}
                />
            )}
        </div>
    );
};
