import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Student, Deck, AppSettings } from '../types';
import { Word } from '../data/vocabulary';
import { Search, Plus, UserCircle, ChevronDown, SortAsc, Clock, Archive, GraduationCap, Users, Layout } from 'lucide-react';
import { StudentProfile } from './StudentProfile';
import { AddContentModal } from './AddContentModal';

interface TutorDashboardProps {
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
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({ students, decks, onUpdateStudent, onAddStudent, view, onViewChange, onAddDeck, onAddCard, onEditCard, apiKey, settings }) => {
    const { t } = useTranslation();
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
                            {t('tutor.dashboard_title')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {activeTab === 'active'
                                ? `${stats.active} ${t('tutor.stats.active_students')}`
                                : `${stats.archived} ${t('tutor.stats.archived_students')}`
                            }
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsManageContentOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80 transition-all border border-border"
                        >
                            <Layout className="w-5 h-5" />
                            {t('tutor.actions.manage_content')}
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-5 h-5" />
                            {t('tutor.actions.add_student')}
                        </button>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Active/Archived Toggle */}
                    <div className="flex bg-secondary/50 p-1 rounded-xl border border-border gap-1">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Users className="w-4 h-4" />
                            {t('tutor.toggle.active')}
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'archived' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Archive className="w-4 h-4" />
                            {t('tutor.toggle.archived')}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('tutor.search_placeholder')}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative" ref={sortDropdownRef}>
                        <button
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-xl text-sm font-bold transition-colors border border-border"
                        >
                            {sortOption === 'a-z' || sortOption === 'z-a' ? <SortAsc className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            <span className="capitalize">{t(`tutor.sort_options.${sortOption.replace('-', '_')}`)}</span>
                            <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {/* Dropdown Menu */}
                        {isSortDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-40 bg-popover border border-border rounded-xl shadow-xl p-1 z-20 animate-in fade-in zoom-in-95">
                                <button onClick={() => { setSortOption('a-z'); setIsSortDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg">{t('tutor.sort_options.a_z')}</button>
                                <button onClick={() => { setSortOption('z-a'); setIsSortDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg">{t('tutor.sort_options.z_a')}</button>
                                <button onClick={() => { setSortOption('newest'); setIsSortDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg">{t('tutor.sort_options.newest')}</button>
                                <button onClick={() => { setSortOption('oldest'); setIsSortDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg">{t('tutor.sort_options.oldest')}</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Page Header */}
                {/* The original page header content was replaced by the new header and filter/search bar above. */}

                {view === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
                        {/* Manage Students Tile */}
                        <div
                            onClick={() => onViewChange('students')}
                            className="bg-card hover:bg-secondary/20 border border-border rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg group flex flex-col items-center text-center gap-4"
                        >
                            <div className="p-4 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                                <Users className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Manage Students</h2>
                                <p className="text-muted-foreground">View progress, assign homework, and manage student profiles.</p>
                            </div>
                        </div>

                        {/* Manage Flashcards Tile */}
                        <div
                            onClick={() => onViewChange('flashcards')} // Placeholder for now
                            className="bg-card hover:bg-secondary/20 border border-border rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg group flex flex-col items-center text-center gap-4"
                        >
                            <div className="p-4 rounded-full bg-green-100 text-green-600 group-hover:scale-110 transition-transform">
                                <Archive className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Manage Flashcards</h2>
                                <p className="text-muted-foreground">Create, edit, and organize flashcard decks for your students.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Students View */}
                {view === 'students' && (
                    <div className="flex flex-col gap-6">

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
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Flashcard Library</h2>
                                <p className="text-muted-foreground">Manage global decks and cards.</p>
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
