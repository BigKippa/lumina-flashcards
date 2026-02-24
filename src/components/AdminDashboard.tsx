import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Word, Deck } from '../data/vocabulary';
import { Search, Trash2, Edit2, ArrowLeft, Plus, Image as ImageIcon, Video, Volume2, FolderPlus, Library, Lock, Key, Users, UserPlus, GraduationCap, Sparkles, Shield, User, X, Check, AlertTriangle, Merge, Archive, RotateCcw, Settings, Upload, Download } from 'lucide-react';
import { CategoryManager } from './CategoryManager';
import { EditCardModal } from './EditCardModal';
import { BulkGeneratorModal } from './BulkGeneratorModal';
import { DuplicateResolverModal } from './DuplicateResolverModal';
import { AppSettings, UserProfile, UserRole, Ticket } from '../types';

interface AdminDashboardProps {
    decks: Deck[];
    cards: Word[];
    activeDeckId: string | null;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onBack: () => void;

    onDeleteCard: (id: string) => void;
    onArchiveDeck: (id: string) => void;
    onUnarchiveDeck: (id: string) => void;
    onEdit: (updatedWord: Word) => void;
    onSelectDeck: (deckId: string | null) => void;
    onCreateDeck: (deck: Deck) => void;
    onBulkAdd: (cards: Word[]) => void;
    onMoveCard: (cardId: string, newDeckId: string) => void;
    settings: AppSettings;
    onSaveSettings: (settings: AppSettings) => void;
}

export function AdminDashboard({ decks, cards, activeDeckId, activeTab, onTabChange, onBack, onDeleteCard, onEdit, onSelectDeck, onCreateDeck, onBulkAdd, onMoveCard, settings, onSaveSettings, onArchiveDeck, onUnarchiveDeck }: AdminDashboardProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCard, setEditingCard] = useState<Word | null>(null);
    const [isCreatingDeck, setIsCreatingDeck] = useState(false);
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [newDeckDesc, setNewDeckDesc] = useState('');
    const [newDeckIsPublic, setNewDeckIsPublic] = useState(false);
    const [sortBy, _setSortBy] = useState<'az' | 'za'>('az');
    const [filterCategory, _setFilterCategory] = useState<string>('all');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // Section State (Now Lifted)
    // const [activeTab, setActiveTab] = useState<'menu' | 'decks' | 'users' | 'tickets'>('menu');

    // ... (lines 42-55)


    // User Management State
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('user');
    const [createdUserCreds, setCreatedUserCreds] = useState<{ email: string, password: string } | null>(null);

    // Merge Modal State
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [mergeSourceId, setMergeSourceId] = useState<string>('');
    const [mergeTargetId, setMergeTargetId] = useState<string>('');
    const [mergeStep, setMergeStep] = useState<1 | 2>(1); // 1: Selection, 2: Confirmation



    // Bulk Deletion State
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [showArchivedUsers, setShowArchivedUsers] = useState(false);

    const [tickets, setTickets] = useState<Ticket[]>([]);

    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers();
        } else if (activeTab === 'tickets') {
            loadTickets();
        }
    }, [activeTab]);




    const loadUsers = () => {
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
            const profiles: Record<string, UserProfile> = JSON.parse(storedProfiles);
            setUsers(Object.values(profiles));
        }
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail.trim()) return;

        const storedProfiles = localStorage.getItem('profiles');
        const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};

        // Check availability (email key)
        // Check availability (email key AND username property)
        const isTaken = Object.values(profiles).some(u =>
            (u.email && u.email.toLowerCase() === newUserEmail.toLowerCase()) ||
            u.username.toLowerCase() === newUserEmail.toLowerCase()
        );

        if (profiles[newUserEmail] || isTaken) {
            alert("User with this email/username already exists.");
            return;
        }

        const generatedPassword = Math.random().toString(36).slice(-8);
        const newUser: UserProfile = {
            id: crypto.randomUUID(),
            username: newUserEmail, // Username starts as email
            email: newUserEmail,
            password: generatedPassword,
            role: newUserRole,
            progress: {},
            history: [],
            learningHistory: [],
            favorites: [],
            forcePasswordReset: true // Force reset on first login
        };

        profiles[newUserEmail] = newUser;
        localStorage.setItem('profiles', JSON.stringify(profiles));

        setUsers(Object.values(profiles));
        setCreatedUserCreds({ email: newUserEmail, password: generatedPassword });
        setIsCreatingUser(false);
        setNewUserEmail('');
        setNewUserRole('user');
    };

    const handleDeleteUser = (userId: string, username: string) => {
        if (userId === 'admin') {
            alert("Cannot delete the main admin account.");
            return;
        }
        if (window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
            const storedProfiles = localStorage.getItem('profiles');
            if (storedProfiles) {
                const profiles: Record<string, UserProfile> = JSON.parse(storedProfiles);
                const keyToDelete = Object.keys(profiles).find(k => profiles[k].id === userId);
                if (keyToDelete) {
                    delete profiles[keyToDelete];
                    localStorage.setItem('profiles', JSON.stringify(profiles));
                    setUsers(Object.values(profiles));

                    // Cleanup selection if deleted
                    if (selectedUserIds.has(userId)) {
                        const newSet = new Set(selectedUserIds);
                        newSet.delete(userId);
                        setSelectedUserIds(newSet);
                    }
                }
            }
        }
    };

    const handleArchiveUser = (userId: string, isArchiving: boolean) => {
        if (userId === 'admin') return;
        const storedProfiles = localStorage.getItem('profiles');
        if (storedProfiles) {
            const profiles: Record<string, UserProfile> = JSON.parse(storedProfiles);
            const keyToUpdate = Object.keys(profiles).find(k => profiles[k].id === userId);
            if (keyToUpdate) {
                profiles[keyToUpdate].isArchived = isArchiving;
                localStorage.setItem('profiles', JSON.stringify(profiles));
                setUsers(Object.values(profiles));

                // Cleanup selection
                if (selectedUserIds.has(userId)) {
                    const newSet = new Set(selectedUserIds);
                    newSet.delete(userId);
                    setSelectedUserIds(newSet);
                }
            }
        }
    };

    const handleBulkArchive = (isArchiving: boolean) => {
        if (selectedUserIds.size === 0) return;

        const action = isArchiving ? "archive" : "restore";
        if (window.confirm(`Are you sure you want to ${action} ${selectedUserIds.size} users?`)) {
            const storedProfiles = localStorage.getItem('profiles');
            if (storedProfiles) {
                const profiles: Record<string, UserProfile> = JSON.parse(storedProfiles);
                let count = 0;

                selectedUserIds.forEach(id => {
                    const keyToUpdate = Object.keys(profiles).find(k => profiles[k].id === id);
                    if (keyToUpdate && profiles[keyToUpdate].id !== 'admin') {
                        profiles[keyToUpdate].isArchived = isArchiving;
                        count++;
                    }
                });

                localStorage.setItem('profiles', JSON.stringify(profiles));
                setUsers(Object.values(profiles));
                setSelectedUserIds(new Set());
                alert(`Successfully ${isArchiving ? 'archived' : 'restored'} ${count} users.`);
            }
        }
    };

    const handleToggleSelect = (userId: string) => {
        if (userId === 'admin') return;
        const newSet = new Set(selectedUserIds);
        if (newSet.has(userId)) {
            newSet.delete(userId);
        } else {
            newSet.add(userId);
        }
        setSelectedUserIds(newSet);
    };

    const handleSelectAll = (isChecked: boolean) => {
        if (isChecked) {
            const visibleUsers = users.filter(u => u.id !== 'admin' && (showArchivedUsers ? u.isArchived : !u.isArchived));
            setSelectedUserIds(new Set(visibleUsers.map(u => u.id)));
        } else {
            setSelectedUserIds(new Set());
        }
    };

    const handleBulkDelete = () => {
        if (selectedUserIds.size === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedUserIds.size} users? This cannot be undone.`)) {
            const storedProfiles = localStorage.getItem('profiles');
            if (storedProfiles) {
                const profiles: Record<string, UserProfile> = JSON.parse(storedProfiles);
                let deletedCount = 0;

                selectedUserIds.forEach(id => {
                    const keyToDelete = Object.keys(profiles).find(k => profiles[k].id === id);
                    if (keyToDelete && profiles[keyToDelete].id !== 'admin') {
                        delete profiles[keyToDelete];
                        deletedCount++;
                    }
                });

                localStorage.setItem('profiles', JSON.stringify(profiles));
                setUsers(Object.values(profiles));
                setSelectedUserIds(new Set());
                alert(`Successfully deleted ${deletedCount} users.`);
            }
        }
    };

    const handleMergeUsers = () => {
        if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) return;

        const storedProfiles = localStorage.getItem('profiles');
        const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};

        // Find keys
        const sourceKey = Object.keys(profiles).find(k => profiles[k].id === mergeSourceId);
        const targetKey = Object.keys(profiles).find(k => profiles[k].id === mergeTargetId);

        if (!sourceKey || !targetKey) return;

        const sourceUser = profiles[sourceKey];
        const targetUser = profiles[targetKey];

        // MERGE LOGIC
        const mergedUser = { ...targetUser };

        // 1. History (Concat & Sort)
        mergedUser.history = [...(targetUser.history || []), ...(sourceUser.history || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        mergedUser.learningHistory = [...(targetUser.learningHistory || []), ...(sourceUser.learningHistory || [])].sort((a, b) => a.startTime - b.startTime);

        // 2. Favorites (Merge & Dedup)
        const allFavs = [...(targetUser.favorites || []), ...(sourceUser.favorites || [])];
        const seenFavs = new Set();
        mergedUser.favorites = allFavs.filter(f => {
            const key = `${f.type}-${f.deckId}-${f.mode}`;
            if (seenFavs.has(key)) return false;
            seenFavs.add(key);
            return true;
        });

        // 3. Progress (Smart Merge - Max Cards Learned)
        const sourceProgress = sourceUser.progress || {};
        const targetProgress = targetUser.progress || {};
        const mergedProgress = { ...targetProgress };

        Object.keys(sourceProgress).forEach(deckId => {
            if (!mergedProgress[deckId]) {
                // Target doesn't have it, allow copy
                mergedProgress[deckId] = sourceProgress[deckId];
            } else {
                // Collision: Keep the one with more progress
                if (sourceProgress[deckId].cardsLearned > mergedProgress[deckId].cardsLearned) {
                    mergedProgress[deckId] = sourceProgress[deckId];
                }
            }
        });
        mergedUser.progress = mergedProgress;

        // SAVE & DELETE
        profiles[targetKey] = mergedUser;
        delete profiles[sourceKey];

        localStorage.setItem('profiles', JSON.stringify(profiles));
        setUsers(Object.values(profiles));

        // RESET
        setIsMergeModalOpen(false);
        setMergeSourceId('');
        setMergeTargetId('');
        setMergeStep(1);

        alert(`Successfully merged ${sourceUser.username} into ${targetUser.username}.`);
    };

    const loadTickets = () => {
        const stored = localStorage.getItem('support_tickets');
        if (stored) {
            setTickets((JSON.parse(stored) as Ticket[]).sort((a, b) => b.timestamp - a.timestamp));
        }
    };

    const handleResolveTicket = (id: string, currentStatus: 'open' | 'resolved') => {
        const newStatus: 'open' | 'resolved' = currentStatus === 'open' ? 'resolved' : 'open';
        const updatedTickets = tickets.map(t => t.id === id ? { ...t, status: newStatus } as Ticket : t);
        setTickets(updatedTickets);
        localStorage.setItem('support_tickets', JSON.stringify(updatedTickets));
    };

    const handleDeleteTicket = (id: string) => {
        if (!window.confirm("Delete this ticket?")) return;
        const updatedTickets = tickets.filter(t => t.id !== id);
        setTickets(updatedTickets);
        localStorage.setItem('support_tickets', JSON.stringify(updatedTickets));
    };

    const [resolvingDuplicateGroup, setResolvingDuplicateGroup] = useState<Word[] | null>(null);

    const duplicates = React.useMemo(() => {
        const groups: Record<string, Word[]> = {};
        cards.forEach(card => {
            if (card.isPublic) {
                const key = card.word.toLowerCase().trim();
                if (!groups[key]) groups[key] = [];
                groups[key].push(card);
            }
        });
        return Object.values(groups).filter(group => group.length > 1);
    }, [cards]);

    const handleResolveDuplicate = (_decision: 'keep', data: Word) => {
        if (!resolvingDuplicateGroup) return;

        // Data is the card we want to keep (possibly merged/edited).
        // Logic: Update the 'kept' card (if needed) and delete others in the group.

        const idsToDelete = resolvingDuplicateGroup.map(c => c.id).filter(id => id !== data.id && String(id) !== '-1'); // -1 is temp ID for merge

        // 1. Update the kept card (if it's one of the originals, we might be updating it with new data from merge)
        // If data.id is -1, it means we are creating a fresh card? No, my modal logic said "Keep ID of first duplicate".
        // So data.id should be valid.

        onEdit(data); // Save the kept version

        // 2. Delete others
        idsToDelete.forEach(id => onDeleteCard(String(id)));

        setResolvingDuplicateGroup(null);
    };

    const filteredCards = cards
        .filter(card => {
            const matchesSearch = card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.definition.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || card.category === filterCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'az') return a.word.localeCompare(b.word);
            if (sortBy === 'za') return b.word.localeCompare(a.word);
            return 0;
        });

    const handleCreateDeck = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckTitle.trim()) return;

        onCreateDeck({
            id: crypto.randomUUID(),
            title: newDeckTitle,
            description: newDeckDesc,
            cards: [],
            status: newDeckIsPublic ? 'public' : 'private',
            authorId: 'admin'
        });

        setIsCreatingDeck(false);
        setNewDeckTitle('');
        setNewDeckDesc('');
        setNewDeckIsPublic(false);
    };

    // Data Management
    const handleExportDataAction = () => {
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            decks,
            cards,
            users: JSON.parse(localStorage.getItem('profiles') || '{}'),
            settings
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `english_flashcards_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportDataAction = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm("WARNING: This will overwrite ALL current data (Decks, Cards, Users, Settings). This action cannot be undone. Are you sure?")) {
            e.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);

                // Basic Validation
                if (!data.decks || !data.cards || !data.users) {
                    throw new Error("Invalid backup file format.");
                }

                // Restore Data
                // Note: We need to update localStorage manually since props are read-only and passed down. 
                // A full reload is the safest way to ensure all state is reset from localStorage.

                // 1. Users
                localStorage.setItem('profiles', JSON.stringify(data.users));

                // 2. Settings
                if (data.settings) {
                    localStorage.setItem('appSettings', JSON.stringify(data.settings));
                }

                // 3. Decks & Cards (These are usually managed by App.tsx state, which initializes from localStorage)
                // We assume App.tsx loads initial state from these keys:
                localStorage.setItem('decks', JSON.stringify(data.decks));
                localStorage.setItem('cards', JSON.stringify(data.cards));

                alert("Data imported successfully! The application will now reload.");
                window.location.reload();

            } catch (err) {
                console.error("Import failed:", err);
                alert("Failed to import data. Invalid file format.");
            }
        };
        reader.readAsText(file);
    };

    // TAB SELECTION & HEADER
    if (!activeDeckId) {
        return (
            <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
                <div className="relative flex items-center justify-center mb-8 min-h-[3rem]">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                        <button
                            onClick={() => {
                                // Since we use history stack, "Back" implies popping the stack.
                                onBack();
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" /> {activeTab === 'menu' ? 'Back to Selection' : 'Back to Admin Menu'}
                        </button>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground text-center">
                        {activeTab === 'menu' ? 'Admin Dashboard' :
                            activeTab === 'decks' ? 'Manage Decks' :
                                activeTab === 'cards' ? 'Manage Flashcards' :
                                    activeTab === 'users' ? 'User Database' :
                                        activeTab === 'archived' ? 'Archived Decks' :
                                            'Support Tickets'}
                    </h1>
                </div>

                {activeTab === 'menu' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button
                            onClick={() => onTabChange('users')}
                            className="flex flex-col items-center p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/40 transition-all group hover:scale-105 shadow-md"
                        >
                            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Manage Users</h3>
                            <p className="text-muted-foreground text-center text-sm">
                                Create, edit, and remove user accounts.
                            </p>
                        </button>

                        <button
                            onClick={() => onTabChange('decks')}
                            className="flex flex-col items-center p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/40 transition-all group hover:scale-105 shadow-md"
                        >
                            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Library className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Manage Decks</h3>
                            <p className="text-muted-foreground text-center text-sm">
                                Create and organize deck collections.
                            </p>
                        </button>

                        <button
                            onClick={() => onTabChange('cards')}
                            className="flex flex-col items-center p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/40 transition-all group hover:scale-105 shadow-md"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <Edit2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Manage Flashcards</h3>
                            <p className="text-muted-foreground text-center text-sm">
                                View, edit, and bulk upload cards.
                            </p>
                        </button>

                        <button
                            onClick={() => onTabChange('tickets')}
                            className="flex flex-col items-center p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/40 transition-all group hover:scale-105 shadow-md"
                        >
                            <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Support Tickets</h3>
                            <p className="text-muted-foreground text-center text-sm">
                                View feedback and issues from users.
                            </p>
                        </button>

                        <button
                            onClick={() => onTabChange('archived')}
                            className="flex flex-col items-center p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/40 transition-all group hover:scale-105 shadow-md"
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mb-6 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                                <Archive className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Archived</h3>
                            <p className="text-muted-foreground text-center text-sm">
                                Manage archived decks and content.
                            </p>
                        </button>

                        <button
                            onClick={() => onTabChange('settings')}
                            className="flex flex-col items-center p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/40 transition-all group hover:scale-105 shadow-md"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-6 group-hover:bg-slate-600 group-hover:text-white transition-colors">
                                <Settings className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">System</h3>
                            <p className="text-muted-foreground text-center text-sm">
                                Backup, restore, and app configuration.
                            </p>
                        </button>
                    </div>
                )
                }

                {
                    activeTab === 'tickets' && (
                        <div className="space-y-6">
                            {tickets.length === 0 ? (
                                <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
                                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-foreground mb-2">No Tickets Yet</h3>
                                    <p className="text-muted-foreground">User submitted issues will appear here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {tickets.map(ticket => (
                                        <div key={ticket.id} className={`p-6 rounded-2xl border transition-all ${ticket.status === 'resolved' ? 'bg-secondary/30 border-border opacity-70' : 'bg-card border-border shadow-sm'}`}>
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${ticket.status === 'open' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                            {ticket.status}
                                                        </span>
                                                        <span className="text-sm text-foreground font-semibold">{ticket.username}</span>
                                                        <span className="text-xs text-muted-foreground">• {new Date(ticket.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-foreground whitespace-pre-wrap mb-3">{ticket.description}</p>

                                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-mono bg-secondary/50 p-2 rounded-lg inline-block">
                                                        {ticket.context}
                                                    </div>

                                                    {ticket.attachmentUrl && (
                                                        <div className="mt-4">
                                                            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">Attachment</p>
                                                            <img src={ticket.attachmentUrl} alt="Ticket Attachment" className="max-h-48 rounded-lg border border-border" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleResolveTicket(ticket.id, ticket.status)}
                                                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold ${ticket.status === 'open' ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                                                    >
                                                        {ticket.status === 'open' ? <><Check className="w-4 h-4" /> Mark Resolved</> : <><Sparkles className="w-4 h-4" /> Re-open</>}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTicket(ticket.id)}
                                                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-2 text-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'archived' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Archive className="w-5 h-5 text-muted-foreground" />
                                    Archived Decks
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {decks.filter(d => d.isArchived).map(deck => (
                                        <div
                                            key={deck.id}
                                            className="group relative p-8 rounded-2xl bg-card/50 border border-border/50 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all hover:bg-card"
                                        >
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button
                                                    onClick={() => onUnarchiveDeck(deck.id)}
                                                    className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                                                    title="Unarchive Deck"
                                                >
                                                    <RotateCcw className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{deck.title}</h3>
                                            <p className="text-muted-foreground text-sm line-clamp-2">{deck.description || "No description"}</p>
                                            <div className="mt-4 flex items-center gap-4 text-sm font-medium text-muted-foreground">
                                                <span>{deck.cards.length} cards</span>
                                            </div>
                                        </div>
                                    ))}
                                    {decks.filter(d => d.isArchived).length === 0 && (
                                        <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
                                            <p className="text-muted-foreground">No archived decks.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'decks' && (
                        <>
                            <div className="space-y-8">
                                {/* My Decks Section */}
                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-muted-foreground" />
                                        My Private Decks
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Create New Deck Card */}
                                        <button
                                            onClick={() => setIsCreatingDeck(true)}
                                            className="group flex flex-col items-center justify-center p-8 rounded-2xl bg-secondary/20 border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/40 transition-all min-h-[200px]"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                                <Plus className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-bold text-foreground">Create New Deck</h3>
                                            <p className="text-muted-foreground text-sm mt-2">Organize a new collection</p>
                                        </button>

                                        {/* Bulk Upload Tile */}
                                        <button
                                            onClick={() => setIsBulkModalOpen(true)}
                                            className="group flex flex-col items-center justify-center p-8 rounded-2xl bg-secondary/20 border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/40 transition-all min-h-[200px]"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                                                <FolderPlus className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-bold text-foreground">Bulk Upload</h3>
                                            <p className="text-muted-foreground text-sm mt-2">Import from CSV or AI</p>
                                        </button>

                                        {/* Private Decks */}
                                        {decks.filter(d => (!d.status || d.status === 'private' || d.status === 'rejected') && !d.isArchived).map(deck => (
                                            <div
                                                key={deck.id}
                                                onClick={() => onSelectDeck(deck.id)}
                                                className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5"
                                            >
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                    {deck.status === 'rejected' && (
                                                        <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full">Rejected</span>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onArchiveDeck(deck.id);
                                                        }}
                                                        className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                                                        title="Archive Deck"
                                                    >
                                                        <Archive className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                                        <Library className="w-6 h-6" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{deck.title}</h3>
                                                <p className="text-muted-foreground text-sm line-clamp-2">{deck.description || "No description"}</p>
                                                <div className="mt-4 flex items-center gap-4 text-sm font-medium text-muted-foreground">
                                                    <span>{deck.cards.length} cards</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Public Library Section */}
                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        Public Library
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {decks.filter(d => d.status === 'public' && !d.isArchived).map(deck => (
                                            <div
                                                key={deck.id}
                                                onClick={() => onSelectDeck(deck.id)}
                                                className="group relative p-8 rounded-2xl bg-card border-none ring-1 ring-border hover:ring-primary/50 cursor-pointer transition-all hover:shadow-lg"
                                            >
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">Public</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onArchiveDeck(deck.id);
                                                        }}
                                                        className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Archive (Unpublish)"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                                        <Users className="w-6 h-6" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{deck.title}</h3>
                                                <p className="text-muted-foreground text-sm line-clamp-2">{deck.description || "By Community"}</p>
                                                <div className="mt-4 flex items-center gap-4 text-sm font-medium text-muted-foreground">
                                                    <span>{deck.cards.length} cards</span>
                                                </div>
                                            </div>
                                        ))}
                                        {decks.filter(d => d.status === 'public' && !d.isArchived).length === 0 && (
                                            <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
                                                <p className="text-muted-foreground">No public decks available yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pending Approval Section (If any) */}
                                {decks.some(d => d.status === 'pending') && (
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-amber-500" />
                                            Pending Approval
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {decks.filter(d => d.status === 'pending').map(deck => (
                                                <div
                                                    key={deck.id}
                                                    className="relative p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20 cursor-not-allowed opacity-75"
                                                >
                                                    <div className="absolute top-4 right-4">
                                                        <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">Pending</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-foreground mb-2">{deck.title}</h3>
                                                    <p className="text-muted-foreground text-sm line-clamp-2">{deck.description}</p>
                                                    <div className="mt-4 flex items-center gap-4 text-sm font-medium text-muted-foreground">
                                                        <span>{deck.cards.length} cards</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Category Customization for All Users */}
                            <CategoryManager settings={settings} onSave={onSaveSettings} />

                            <div className="mt-12 pt-8 border-t border-border">
                                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                                    <Lock className="w-6 h-6 text-primary" />
                                    {t('admin.system.title')}
                                </h2>

                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <Key className="w-5 h-5 text-primary" />
                                        {t('admin.system.api_keys')}
                                    </h3>

                                    <div className="max-w-xl">
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t('admin.system.gemini_label')}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={settings.geminiApiKey || ''}
                                                onChange={(e) => onSaveSettings({ ...settings, geminiApiKey: e.target.value })}
                                                placeholder={t('admin.system.gemini_placeholder')}
                                                className="flex-1 px-4 py-3 rounded-xl bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono text-sm"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {t('admin.system.gemini_hint')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Create Deck Modal */}
                            {isCreatingDeck && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                    <div className="w-full max-w-md bg-background border border-border rounded-2xl p-8 shadow-2xl animate-in zoom-in-95">
                                        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                                            <FolderPlus className="w-6 h-6 text-primary" />
                                            New Deck
                                        </h2>
                                        <form onSubmit={handleCreateDeck} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                                                <input
                                                    autoFocus
                                                    className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                                    placeholder="e.g., Advanced Verbs"
                                                    value={newDeckTitle}
                                                    onChange={e => setNewDeckTitle(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                                                <textarea
                                                    className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-24"
                                                    placeholder="What's this deck about?"
                                                    value={newDeckDesc}
                                                    onChange={e => setNewDeckDesc(e.target.value)}
                                                />
                                            </div>

                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
                                                <input
                                                    type="checkbox"
                                                    id="makePublic"
                                                    checked={newDeckIsPublic}
                                                    onChange={e => setNewDeckIsPublic(e.target.checked)}
                                                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                                                />
                                                <label htmlFor="makePublic" className="text-sm font-medium text-foreground cursor-pointer select-none">
                                                    Make this deck Public
                                                    <p className="text-xs text-muted-foreground font-normal">Visible to all users in the library</p>
                                                </label>
                                            </div>

                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreatingDeck(false)}
                                                    className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={!newDeckTitle.trim()}
                                                    className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    Create Deck
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>
                    )
                }

                {
                    activeTab === 'users' && (
                        <div className="space-y-6">
                            {/* Users Tab Content */}
                            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">{t('admin.users.title')}</h2>
                                    <p className="text-muted-foreground text-sm">{t('admin.users.subtitle')}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowArchivedUsers(!showArchivedUsers)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors border ${showArchivedUsers ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}
                                    >
                                        <Archive className="w-5 h-5" />
                                        {showArchivedUsers ? 'View Active Users' : 'View Archived Users'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMergeModalOpen(true);
                                            setMergeStep(1);
                                            setMergeSourceId('');
                                            setMergeTargetId('');
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 transition-colors border border-border"
                                    >
                                        <Users className="w-5 h-5" />
                                        {t('admin.users.merge_btn')}
                                    </button>
                                    {!showArchivedUsers && (
                                        <button
                                            onClick={() => setIsCreatingUser(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                            {t('admin.users.add_btn')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {selectedUserIds.size > 0 && (
                                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3 text-destructive font-medium">
                                        <Trash2 className="w-5 h-5" />
                                        <span>{selectedUserIds.size} users selected</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleBulkArchive(!showArchivedUsers)}
                                            className={`px-4 py-2 rounded-lg font-bold transition-colors text-sm ${showArchivedUsers ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                                        >
                                            {showArchivedUsers ? 'Restore Selected' : 'Archive Selected'}
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-bold hover:bg-destructive/90 transition-colors text-sm"
                                        >
                                            Delete Selected
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-secondary/30 border-b border-border text-sm text-muted-foreground">
                                                <th className="p-4 w-10">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        checked={users.filter(u => u.id !== 'admin' && (showArchivedUsers ? u.isArchived : !u.isArchived)).length > 0 && selectedUserIds.size === users.filter(u => u.id !== 'admin' && (showArchivedUsers ? u.isArchived : !u.isArchived)).length}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                    />
                                                </th>
                                                <th className="p-4 font-semibold">{t('admin.users.table.user')}</th>
                                                <th className="p-4 font-semibold">{t('admin.users.table.role')}</th>
                                                <th className="p-4 font-semibold">{t('admin.users.table.progress')}</th>
                                                <th className="p-4 font-semibold text-right">{t('admin.users.table.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {users.filter(u => showArchivedUsers ? u.isArchived : !u.isArchived).map(user => (
                                                <tr key={user.id} className={`hover:bg-secondary/10 transition-colors ${selectedUserIds.has(user.id) ? 'bg-primary/5' : ''}`}>
                                                    <td className="p-4">
                                                        {user.id !== 'admin' && (
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                checked={selectedUserIds.has(user.id)}
                                                                onChange={() => handleToggleSelect(user.id)}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                {user.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-foreground">{user.username}</div>
                                                                <div className="text-xs text-muted-foreground">{user.email || 'No email'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                            user.role === 'tutor' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                'bg-green-100 text-green-700 border-green-200'
                                                            }`}>
                                                            {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                                            {user.role === 'tutor' && <GraduationCap className="w-3 h-3" />}
                                                            {user.role === 'user' && <Sparkles className="w-3 h-3" />}
                                                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {Object.values(user.progress || {}).reduce((acc, curr) => acc + curr.cardsLearned, 0)} cards
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {user.id !== 'admin' && (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleArchiveUser(user.id, !user.isArchived)}
                                                                    className={`p-2 rounded-lg transition-colors ${user.isArchived ? 'text-green-600 hover:bg-green-100' : 'text-amber-600 hover:bg-amber-100'}`}
                                                                    title={user.isArchived ? "Restore User" : "Archive User"}
                                                                >
                                                                    <Archive className="w-5 h-5" />
                                                                </button>
                                                                {user.isArchived && (
                                                                    <button
                                                                        onClick={() => handleDeleteUser(user.id, user.username)}
                                                                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                                        title={t('admin.users.delete_confirm')}
                                                                    >
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {users.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                        {t('admin.users.table.empty')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Create User Modal */}
                            {isCreatingUser && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                    <div className="w-full max-w-md bg-background border border-border rounded-2xl p-8 shadow-2xl animate-in zoom-in-95">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold text-foreground">Add New User</h2>
                                            <button onClick={() => setIsCreatingUser(false)} className="text-muted-foreground hover:text-foreground">
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <form onSubmit={handleCreateUser} className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                    <input
                                                        type="email"
                                                        required
                                                        autoFocus
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                                        placeholder="user@example.com"
                                                        value={newUserEmail}
                                                        onChange={e => setNewUserEmail(e.target.value)}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Username will be set to email initially.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewUserRole('user')}
                                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newUserRole === 'user' ? 'bg-primary/10 border-primary text-primary font-bold' : 'border-border hover:bg-secondary'}`}
                                                    >
                                                        <Sparkles className="w-5 h-5" /> Learner
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewUserRole('tutor')}
                                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newUserRole === 'tutor' ? 'bg-primary/10 border-primary text-primary font-bold' : 'border-border hover:bg-secondary'}`}
                                                    >
                                                        <GraduationCap className="w-5 h-5" /> Tutor
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={!newUserEmail.trim()}
                                                    className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <UserPlus className="w-5 h-5" />
                                                    Create User & Generate Password
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Merge Users Modal */}
                            {isMergeModalOpen && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                    <div className="w-full max-w-lg bg-background border border-border rounded-2xl p-8 shadow-2xl animate-in zoom-in-95">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                                <Users className="w-6 h-6 text-primary" />
                                                Merge Users
                                            </h2>
                                            <button onClick={() => setIsMergeModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        {mergeStep === 1 ? (
                                            <div className="space-y-6">
                                                <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 flex gap-3">
                                                    <div className="shrink-0"><Shield className="w-5 h-5" /></div>
                                                    <div>
                                                        <p className="font-bold">How Merging Works</p>
                                                        <p>All progress, history, and favorites will be combined. Deck progress will default to the highest value between the two.</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-muted-foreground">Source Profile</label>
                                                        <p className="text-xs text-muted-foreground mb-1">This user will be DELETED.</p>
                                                        <select
                                                            className="w-full p-2 rounded-lg bg-input border border-border text-foreground"
                                                            value={mergeSourceId}
                                                            onChange={(e) => setMergeSourceId(e.target.value)}
                                                        >
                                                            <option value="">Select User...</option>
                                                            {users.filter(u => u.id !== 'admin' && u.id !== mergeTargetId).map(u => (
                                                                <option key={u.id} value={u.id}>{u.username} ({u.email || 'No Email'})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-muted-foreground">Target Profile</label>
                                                        <p className="text-xs text-muted-foreground mb-1">This user will remain.</p>
                                                        <select
                                                            className="w-full p-2 rounded-lg bg-input border border-border text-foreground"
                                                            value={mergeTargetId}
                                                            onChange={(e) => setMergeTargetId(e.target.value)}
                                                        >
                                                            <option value="">Select User...</option>
                                                            {users.filter(u => u.id !== 'admin' && u.id !== mergeSourceId).map(u => (
                                                                <option key={u.id} value={u.id}>{u.username} ({u.email || 'No Email'})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setMergeStep(2)}
                                                    disabled={!mergeSourceId || !mergeTargetId}
                                                    className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors disabled:opacity-50 mt-4"
                                                >
                                                    Continue to Review
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="p-4 bg-red-50 text-red-900 rounded-xl text-sm border border-red-100 flex gap-3">
                                                    <div className="shrink-0"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                                                    <div>
                                                        <p className="font-bold text-red-700">Warning: Irreversible Action</p>
                                                        <p>
                                                            You are about to merge <strong>{users.find(u => u.id === mergeSourceId)?.username}</strong> INTO <strong>{users.find(u => u.id === mergeTargetId)?.username}</strong>.
                                                        </p>
                                                        <p className="mt-2 font-semibold">
                                                            The source profile will be permanently deleted.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => setMergeStep(1)}
                                                        className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl transition-colors"
                                                    >
                                                        Back
                                                    </button>
                                                    <button
                                                        onClick={handleMergeUsers}
                                                        className="flex-1 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl transition-colors"
                                                    >
                                                        Confirm Merge
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Merge Users Modal */}
                            {isMergeModalOpen && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                    <div className="w-full max-w-lg bg-background border border-border rounded-2xl p-8 shadow-2xl animate-in zoom-in-95">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                                <Users className="w-6 h-6 text-primary" />
                                                Merge Users
                                            </h2>
                                            <button onClick={() => setIsMergeModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        {mergeStep === 1 ? (
                                            <div className="space-y-6">
                                                <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 flex gap-3">
                                                    <div className="shrink-0"><Shield className="w-5 h-5" /></div>
                                                    <div>
                                                        <p className="font-bold">How Merging Works</p>
                                                        <p>All progress, history, and favorites will be combined. Deck progress will default to the highest value between the two.</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-muted-foreground">Source Profile</label>
                                                        <p className="text-xs text-muted-foreground mb-1">This user will be DELETED.</p>
                                                        <select
                                                            className="w-full p-2 rounded-lg bg-input border border-border text-foreground"
                                                            value={mergeSourceId}
                                                            onChange={(e) => setMergeSourceId(e.target.value)}
                                                        >
                                                            <option value="">Select User...</option>
                                                            {users.filter(u => u.id !== 'admin' && u.id !== mergeTargetId).map(u => (
                                                                <option key={u.id} value={u.id}>{u.username} ({u.email || 'No Email'})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-muted-foreground">Target Profile</label>
                                                        <p className="text-xs text-muted-foreground mb-1">This user will remain.</p>
                                                        <select
                                                            className="w-full p-2 rounded-lg bg-input border border-border text-foreground"
                                                            value={mergeTargetId}
                                                            onChange={(e) => setMergeTargetId(e.target.value)}
                                                        >
                                                            <option value="">Select User...</option>
                                                            {users.filter(u => u.id !== 'admin' && u.id !== mergeSourceId).map(u => (
                                                                <option key={u.id} value={u.id}>{u.username} ({u.email || 'No Email'})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setMergeStep(2)}
                                                    disabled={!mergeSourceId || !mergeTargetId}
                                                    className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors disabled:opacity-50 mt-4"
                                                >
                                                    Continue to Review
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="p-4 bg-red-50 text-red-900 rounded-xl text-sm border border-red-100 flex gap-3">
                                                    <div className="shrink-0"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                                                    <div>
                                                        <p className="font-bold text-red-700">Warning: Irreversible Action</p>
                                                        <p>
                                                            You are about to merge <strong>{users.find(u => u.id === mergeSourceId)?.username}</strong> INTO <strong>{users.find(u => u.id === mergeTargetId)?.username}</strong>.
                                                        </p>
                                                        <p className="mt-2 font-semibold">
                                                            The source profile will be permanently deleted.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => setMergeStep(1)}
                                                        className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl transition-colors"
                                                    >
                                                        Back
                                                    </button>
                                                    <button
                                                        onClick={handleMergeUsers}
                                                        className="flex-1 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl transition-colors"
                                                    >
                                                        Confirm Merge
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Credentials Modal */}
                            {createdUserCreds && (
                                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl animate-in zoom-in-95">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Check className="w-8 h-8" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-foreground">User Created!</h2>
                                            <p className="text-muted-foreground">Please share these credentials with the user.</p>
                                        </div>

                                        <div className="bg-secondary/50 rounded-xl p-6 space-y-4 mb-6 border border-border">
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email / Username</label>
                                                <div className="text-lg font-mono text-foreground select-all">{createdUserCreds.email}</div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Temporary Password</label>
                                                <div className="text-xl font-mono font-bold text-primary select-all">{createdUserCreds.password}</div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 flex gap-3 items-start">
                                            <Shield className="w-5 h-5 flex-shrink-0" />
                                            <p>The user will be required to change their username and password immediately upon their first login.</p>
                                        </div>

                                        <button
                                            onClick={() => setCreatedUserCreds(null)}
                                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'cards' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Manage Flashcards</h2>
                                    <p className="text-muted-foreground text-sm">View and edit all cards across decks</p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search cards..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary/50 border-transparent focus:bg-input focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => duplicates.length > 0 && setResolvingDuplicateGroup(duplicates[0])}
                                        disabled={duplicates.length === 0}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors shadow-lg shrink-0 ${duplicates.length > 0
                                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                                            : 'bg-secondary text-muted-foreground opacity-50 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        {duplicates.length > 0 ? (
                                            <>
                                                <Merge className="w-5 h-5" />
                                                Resolve Duplicates ({duplicates.length})
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                No Duplicates
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setIsBulkModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 shrink-0"
                                    >
                                        <FolderPlus className="w-5 h-5" />
                                        Bulk Upload
                                    </button>
                                </div>
                            </div>

                            {/* Duplicate Alert */}
                            {duplicates.length > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                                        <div>
                                            <h3 className="font-bold text-amber-500">Duplicate Cards Detected</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Found {duplicates.length} groups of potential duplicate cards that are public.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setResolvingDuplicateGroup(duplicates[0])}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors"
                                    >
                                        Resolve Issues
                                    </button>
                                </div>
                            )}

                            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-secondary/30 border-b border-border text-sm text-muted-foreground">
                                                <th className="p-4 font-semibold">Word</th>
                                                <th className="p-4 font-semibold">Definition</th>
                                                <th className="p-4 font-semibold">Category</th>
                                                <th className="p-4 font-semibold">Deck</th>
                                                <th className="p-4 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredCards.map(card => {
                                                const currentDeck = decks.find(d => d.cards.some(c => c.id === card.id));
                                                return (
                                                    <tr key={card.id} className="hover:bg-secondary/10 transition-colors group">
                                                        <td className="p-4 font-medium text-foreground">{card.word}</td>
                                                        <td className="p-4">
                                                            <input
                                                                type="text"
                                                                defaultValue={card.definition}
                                                                onBlur={(e) => {
                                                                    if (e.target.value !== card.definition) {
                                                                        onEdit({ ...card, definition: e.target.value });
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                                className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none transition-colors text-muted-foreground"
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <select
                                                                value={card.category || 'Vocabulary'}
                                                                onChange={(e) => onEdit({ ...card, category: e.target.value })}
                                                                className="bg-transparent border-none outline-none cursor-pointer hover:text-primary transition-colors text-sm font-medium"
                                                            >
                                                                {Object.keys(settings.categories).map(cat => (
                                                                    <option key={cat} value={cat}>{cat}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="p-4">
                                                            <select
                                                                value={currentDeck?.id || ''}
                                                                onChange={(e) => {
                                                                    if (currentDeck && e.target.value !== currentDeck.id) {
                                                                        onMoveCard(String(card.id), e.target.value);
                                                                    }
                                                                }}
                                                                className="bg-transparent border-none outline-none cursor-pointer hover:text-primary transition-colors text-sm text-muted-foreground w-32 truncate"
                                                            >
                                                                {decks.map(d => (
                                                                    <option key={d.id} value={d.id}>{d.title}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => setEditingCard(card)}
                                                                    className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm(`Delete "${card.word}"?`)) {
                                                                            onDeleteCard(String(card.id));
                                                                        }
                                                                    }}
                                                                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredCards.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                        No cards found matching "{searchTerm}"
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>


                            {/* Edit Modal (Reused) */}
                            {editingCard && (
                                <EditCardModal
                                    card={editingCard}
                                    onSave={(updatedCard) => {
                                        onEdit(updatedCard);
                                        setEditingCard(null);
                                    }}
                                    onCancel={() => setEditingCard(null)}
                                    settings={settings}
                                />
                            )}

                            {/* Duplicate Resolver Modal */}
                            {resolvingDuplicateGroup && (
                                <DuplicateResolverModal
                                    isOpen={!!resolvingDuplicateGroup}
                                    onClose={() => setResolvingDuplicateGroup(null)}
                                    duplicates={resolvingDuplicateGroup}
                                    onResolve={handleResolveDuplicate}
                                    settings={settings}
                                />
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'settings' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    System Settings
                                </h2>
                                <div className="grid gap-6">
                                    {/* Category Manager */}
                                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                        <h3 className="font-bold text-lg mb-4">Card Categories</h3>
                                        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-secondary/20 border border-border">
                                            {Object.entries(settings.categories).map(([name, style]) => (
                                                <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: style.backgroundColor }}></span>
                                                    <span className="font-medium text-sm">{name}</span>
                                                </div>
                                            ))}
                                            {/* Minimal view since CategoryManager might be complex to fully reconstruct or use existing one if imported */}
                                            <CategoryManager settings={settings} onSave={onSaveSettings} />
                                        </div>
                                    </div>

                                    {/* Data Management */}
                                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                        <h3 className="font-bold text-lg mb-4">Data Management</h3>
                                        <div className="flex flex-wrap gap-4">
                                            <button
                                                onClick={handleExportDataAction}
                                                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors font-medium"
                                            >
                                                <Download className="w-4 h-4" />
                                                Export All Data (Backup)
                                            </button>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept=".json"
                                                    onChange={handleImportDataAction}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors font-medium pointer-events-none">
                                                    <Upload className="w-4 h-4" />
                                                    Import Data
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Export your decks, cards, and users to a JSON file. Import to restore a backup.
                                            <span className="block text-amber-500 font-bold mt-1">Warning: Import will overwrite all current data.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                <BulkGeneratorModal
                    isOpen={isBulkModalOpen}
                    onClose={() => setIsBulkModalOpen(false)}
                    onSave={(newCards) => {
                        onBulkAdd(newCards);
                        setIsBulkModalOpen(false);
                    }}
                    apiKey={settings.geminiApiKey}
                />
            </div >
        );
    }

    // Deck View (When activeDeckId is present)
    return (
        <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            {decks.find(d => d.id === activeDeckId)?.title || 'Manage Deck'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {decks.find(d => d.id === activeDeckId)?.description}
                        </p>
                    </div>
                </div>
                <div className="text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full font-mono">
                    {cards.filter(c => decks.find(d => d.id === activeDeckId)?.cards.some(dc => dc.id === c.id)).length} Cards
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search words in this deck..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-card border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
                />
            </div>

            <div className="grid gap-4">
                {cards.filter(card => {
                    const inDeck = decks.find(d => d.id === activeDeckId)?.cards.some(dc => dc.id === card.id);
                    const matchesSearch = card.word.toLowerCase().includes(searchTerm.toLowerCase()) || card.definition.toLowerCase().includes(searchTerm.toLowerCase());
                    return inDeck && matchesSearch;
                }).map(card => (
                    <div key={card.id} className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex items-center justify-between group">
                        <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-foreground truncate">{card.word}</h3>
                                {card.level && (
                                    <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold border border-border">
                                        {card.level}
                                    </span>
                                )}
                                <div className="flex gap-1">
                                    {card.imageUrl && <ImageIcon className="w-4 h-4 text-primary" />}
                                    {card.audioUrl && <Volume2 className="w-4 h-4 text-primary" />}
                                    {card.videoUrl && <Video className="w-4 h-4 text-primary" />}
                                </div>
                            </div>
                            <p className="text-muted-foreground/80 line-clamp-1">{card.definition}</p>
                        </div>

                    </div>

                ))}
                {cards.filter(c => decks.find(d => d.id === activeDeckId)?.cards.some(dc => dc.id === c.id)).length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
                        <p className="text-muted-foreground">No cards in this deck.</p>
                    </div>
                )}
            </div>
        </div >
    );
}

export default AdminDashboard;
