import React, { useState, useEffect, useRef } from 'react';
import { Student, Deck, AppSettings } from '../types';
import { X, Save, User, Globe, MapPin, Clock, Phone, Briefcase, Heart, BookOpen, Calendar, Settings, MessageSquare, CheckCircle, Activity, Layout, Mail, Plus, Volume2, Archive, Trash2, UserCircle, Zap, ArrowRight } from 'lucide-react';
import { Word } from '../data/vocabulary';
import { AddContentModal } from './AddContentModal';
import { EditCardModal } from './EditCardModal';
import { AvatarCropperModal } from './AvatarCropperModal';

interface StudentProfileProps {
    student: Student;
    onClose: () => void;
    onSave: (updatedStudent: Student) => void;
    onAddCard: (card: Word, targetDeckId: string) => void;
    onEditCard: (card: Word) => void;
    onDeleteStudent?: (id: string) => void;
    decks: Deck[]; // To show active decks
    apiKey?: string;
    settings: AppSettings;
}

// ... existing code ...

export const StudentProfile: React.FC<StudentProfileProps> = ({ student, onClose, onSave, onDeleteStudent, decks, onAddCard, onEditCard, apiKey, settings }) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'learning' | 'library'>('basic');
    const [editingCard, setEditingCard] = useState<Word | null>(null);
    const isNewProfile = student.name === 'New Student';

    // Initialize with defaults safely
    const [formData, setFormData] = useState<Student>({
        ...student,
        activeDeckIds: student.activeDeckIds || [],
        requests: student.requests || []
    });

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            ...student,
            activeDeckIds: student.activeDeckIds || [],
            requests: student.requests || []
        }));
    }, [student]);

    const [isEditing, setIsEditing] = useState(isNewProfile);
    useEffect(() => {
        if (student.name === 'New Student') {
            setIsEditing(true);
        }
    }, [student.id, student.name]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const handleChange = (field: keyof Student, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    const handleDoneEditing = () => {
        onSave(formData);
        setIsEditing(false);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            'active': 'bg-green-100 text-green-700 border-green-200',
            'archived': 'bg-gray-100 text-gray-600 border-gray-200'
        };
        const c = colors[status as keyof typeof colors] || 'bg-gray-100';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${c} uppercase tracking-wide`}>{status}</span>;
    };

    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border relative">
                {/* Close Button Top Right */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-background/50 backdrop-blur-md hover:bg-secondary rounded-full transition-colors z-50 shadow-sm border border-border/50">
                    <X className="w-5 h-5 text-foreground" />
                </button>

                {/* Header (Hero Tile Standardized) */}
                <div data-dev-id="student-profile-hero-tile" className="m-6 bg-color5 border border-color5/50 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-md relative overflow-hidden text-color1">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-color1/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {/* Profile Info (Left) */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 flex-1">
                        <div className="relative group shrink-0">
                            <div className="w-24 h-24 rounded-2xl flex-shrink-0 bg-color1/20 flex items-center justify-center text-color1 shadow-inner border border-color1/20 overflow-hidden">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-12 h-12" />
                                )}
                            </div>
                            {isEditing && (
                                <>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setAvatarFile(e.target.files[0]);
                                            }
                                            e.target.value = ''; // Reset
                                        }}
                                    />
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                        title="Change Profile Picture"
                                    >
                                        <span className="text-[10px] text-white font-bold uppercase tracking-wider text-center">Edit</span>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* User Details */}
                        <div className="space-y-2 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-3">
                                <h2 className="text-3xl font-bold flex items-center gap-3 text-color1">
                                    {formData.name}
                                    <StatusBadge status={formData.status} />
                                </h2>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-color1/80 font-medium">
                                <Mail className="w-4 h-4" /> {formData.email || 'No email'}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 relative z-10 shrink-0">
                        {isEditing ? (
                            <>
                                <button 
                                    data-dev-id="btn-quick-add"
                                    onClick={() => {
                                        let finalName = formData.name;
                                        if (!finalName || finalName.trim() === '' || finalName === 'New Student') {
                                            const promptedName = window.prompt("Please enter a name for the student:");
                                            if (!promptedName || promptedName.trim() === '') return;
                                            finalName = promptedName.trim();
                                        }
                                        onSave({...formData, name: finalName, isUncompletedProfile: true});
                                        onClose();
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm bg-color3 text-color5 hover:bg-color3/90"
                                >
                                    <Zap className="w-4 h-4 pointer-events-none" /> Quick Add
                                </button>
                                <button onClick={handleDoneEditing} className="flex items-center gap-2 px-4 py-2 bg-color1 text-color5 rounded-lg hover:bg-color1/90 transition-colors shadow-sm font-bold text-sm">
                                    <CheckCircle className="w-4 h-4" /> Done
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-color1 text-color5 rounded-lg hover:bg-color1/90 transition-colors shadow-sm font-bold text-sm">
                                <Settings className="w-4 h-4" /> Edit
                            </button>
                        )}
                        <button onClick={() => { onSave({...formData, status: formData.status === 'archived' ? 'active' : 'archived'}); }} className="flex items-center gap-2 px-3 py-2 bg-color5/50 border border-color1/20 text-color1 rounded-lg hover:bg-color5/70 transition-colors text-sm font-medium" title={formData.status === 'archived' ? "Unarchive Student" : "Archive Student"}>
                            <Archive className="w-4 h-4" /> <span className="hidden sm:inline">{formData.status === 'archived' ? 'Unarchive' : 'Archive'}</span>
                        </button>
                        {onDeleteStudent && (
                            <button onClick={() => { if(window.confirm(`Are you sure you want to delete ${formData.name}?`)) { onDeleteStudent(formData.id); onClose(); } }} className="flex items-center gap-2 px-3 py-2 border border-color1/20 text-color1 rounded-lg hover:bg-color5/70 transition-colors text-sm font-medium" title="Delete Student">
                                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-6 bg-card/30 border-b border-border overflow-x-auto">
                    <TabButton id="basic" label="Basic Info" icon={User} />
                    <TabButton id="learning" label="Learning Needs" icon={BookOpen} />
                    <TabButton id="library" label="Student Library" icon={Layout} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-secondary/10 custom-scrollbar">

                    {/* BASIC INFO TAB */}
                    {activeTab === 'basic' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                            <SectionCard title="Personal Details" icon={User} isEditing={isEditing} onSaveRegion={handleSave}>
                                <Field label="Full Name" value={formData.name} isEditing={isEditing} onChange={v => handleChange('name', v)} isMandatory={true} />
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Native Language</label>
                                    {isEditing ? (
                                        <select
                                            value={formData.nativeLanguage || ''}
                                            onChange={e => handleChange('nativeLanguage', e.target.value)}
                                            className={`w-full p-2 rounded-md border bg-background transition-colors ${!formData.nativeLanguage ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,1)]' : 'border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,1)]'}`}
                                        >
                                            <option value="">Select Language</option>
                                            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            {formData.nativeLanguage || 'Not set'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 mt-4">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Learning Platform</label>
                                    {isEditing ? (
                                        <select
                                            value={formData.learningPlatform || ''}
                                            onChange={e => handleChange('learningPlatform', e.target.value)}
                                            className={`w-full p-2 rounded-md border bg-background transition-colors ${!formData.learningPlatform ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,1)]' : 'border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,1)]'}`}
                                        >
                                            <option value="">Select Platform</option>
                                            {['Zoom', 'Google Meet', 'Preply', 'Skype', 'Microsoft Teams', 'In-Person', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            {formData.learningPlatform || 'Not set'}
                                        </div>
                                    )}
                                </div>
                            </SectionCard>

                            <SectionCard title="Origin & Location" icon={MapPin} isEditing={isEditing} onSaveRegion={handleSave}>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Origin City" value={formData.originCity} isEditing={isEditing} onChange={v => handleChange('originCity', v)} />
                                    <Field label="Origin Country" value={formData.originCountry} isEditing={isEditing} onChange={v => handleChange('originCountry', v)} list="countries" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <Field label="Current City" value={formData.currentCity} isEditing={isEditing} onChange={v => handleChange('currentCity', v)} />
                                    <Field label="Current Country" value={formData.currentCountry} isEditing={isEditing} onChange={v => handleChange('currentCountry', v)} list="countries" />
                                </div>
                                <div className="mt-4">
                                    <Field label="Time Zone" value={formData.timeZone} isEditing={isEditing} onChange={v => handleChange('timeZone', v)} icon={Clock} />
                                </div>
                                <datalist id="countries">
                                    {COUNTRIES.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </SectionCard>

                            <SectionCard title="Contact & Work" icon={Briefcase} isEditing={isEditing} onSaveRegion={handleSave}>
                                <Field label="Email" value={formData.email} isEditing={isEditing} onChange={v => handleChange('email', v)} icon={Mail} />
                                <Field label="Phone" value={formData.phone} isEditing={isEditing} onChange={v => handleChange('phone', v)} icon={Phone} />
                                <Field label="Profession" value={formData.profession} isEditing={isEditing} onChange={v => handleChange('profession', v)} icon={Briefcase} />
                            </SectionCard>

                            <SectionCard title="Interests & Notes" icon={Heart} isEditing={isEditing} onSaveRegion={handleSave}>
                                <Field label="Interests / Hobbies" value={formData.interests} isEditing={isEditing} onChange={v => handleChange('interests', v)} />
                                <TextArea label="Private Notes" value={formData.basicNotes} isEditing={isEditing} onChange={v => handleChange('basicNotes', v)} />
                            </SectionCard>
                            {isNewProfile && isEditing && (
                                <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
                                    <button onClick={() => setActiveTab('learning')} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md">
                                        Next: Learning Needs <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* LEARNING NEEDS TAB */}
                    {activeTab === 'learning' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                            <SectionCard title="Level & Goals" icon={Activity} isEditing={isEditing} onSaveRegion={handleSave}>
                                <Field label="English Level" value={formData.englishLevel} isEditing={isEditing} onChange={v => handleChange('englishLevel', v)} />
                                <TextArea label="Goals" value={formData.goals} isEditing={isEditing} onChange={v => handleChange('goals', v)} />
                            </SectionCard>

                            <SectionCard title="Background" icon={BookOpen} isEditing={isEditing} onSaveRegion={handleSave}>
                                <TextArea label="Learning History" value={formData.learningHistory} isEditing={isEditing} onChange={v => handleChange('learningHistory', v)} placeholder="Previous schools, tutors..." />
                                <TextArea label="English Environment" value={formData.englishEnvironment} isEditing={isEditing} onChange={v => handleChange('englishEnvironment', v)} placeholder="Uses English at work, home..." />
                            </SectionCard>

                            <SectionCard title="Schedule & Logistics" icon={Calendar} isEditing={isEditing} onSaveRegion={handleSave}>
                                <Field label="Lesson Schedule" value={formData.schedule} isEditing={isEditing} onChange={v => handleChange('schedule', v)} placeholder="e.g. Mon/Wed 5pm" />
                                <div className="flex items-center gap-2 mt-4">
                                    <input
                                        type="checkbox"
                                        checked={formData.requestsHomework || false}
                                        disabled={!isEditing}
                                        onChange={e => handleChange('requestsHomework', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <label className="text-sm font-medium">Requests Homework</label>
                                </div>
                            </SectionCard>

                            <SectionCard title="Preferences" icon={Settings} isEditing={isEditing} onSaveRegion={handleSave}>
                                <TextArea label="Student Preferences" value={formData.preferences} isEditing={isEditing} onChange={v => handleChange('preferences', v)} />
                            </SectionCard>
                            {isNewProfile && isEditing && (
                                <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
                                    <button onClick={() => setActiveTab('library')} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md">
                                        Next: Setup Library <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STUDENT LIBRARY TAB */}
                    {activeTab === 'library' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Stats Summary */}
                                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                    <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                                        <Activity className="w-5 h-5" /> Last Session
                                    </h3>
                                    {formData.lastSessionDate ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">{new Date(formData.lastSessionDate).toLocaleString()}</p>
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <p className="font-medium">{formData.lastSessionSummary || "No detailed stats"}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground italic">No sessions recorded yet.</p>
                                    )}
                                </div>

                                {/* Homework Status */}
                                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                    <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                                        <BookOpen className="w-5 h-5" /> Homework
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {['Incomplete', 'Completed', 'Needs Review'].map(status => (
                                            <button
                                                key={status}
                                                disabled={!isEditing}
                                                onClick={() => handleChange('homeworkStatus', status)}
                                                className={`p-3 rounded-lg text-left border transition-all ${formData.homeworkStatus === status
                                                    ? 'bg-primary/10 border-primary text-primary font-bold'
                                                    : 'bg-transparent border-transparent hover:bg-secondary'
                                                    }`}
                                            >
                                                {status}
                                                {formData.homeworkStatus === status && <CheckCircle className="w-4 h-4 float-right" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Student Requests */}
                                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                    <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                                        <MessageSquare className="w-5 h-5" /> Requests
                                    </h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {formData.requests && formData.requests.length > 0 ? (
                                            formData.requests.map(req => (
                                                <div key={req.id} className="p-2 text-sm bg-muted rounded-md border border-border">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-xs uppercase opacity-70">{req.type}</span>
                                                        <span className="text-[10px] text-muted-foreground">{new Date(req.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    <p>{req.content}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground text-sm italic">No active requests.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Active Decks */}
                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Layout className="w-5 h-5 text-primary" /> Flashcards & Decks
                                    </h3>
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-1 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Add Content
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {decks.filter(d => formData.activeDeckIds?.includes(d.id)).map(deck => (
                                        <div key={deck.id} className="p-4 border border-border rounded-lg flex flex-col gap-2 relative group overflow-hidden">
                                            <div className="font-bold pr-6">{deck.title}</div>
                                            <div className="text-xs text-muted-foreground">{deck.cards.length} cards</div>
                                            {!isEditing && <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full w-fit">Active</span>}
                                            {isEditing && (
                                                <button
                                                    onClick={() => handleChange('activeDeckIds', formData.activeDeckIds?.filter(id => id !== deck.id))}
                                                    className="absolute top-2 right-2 p-1.5 hover:bg-red-100 text-muted-foreground hover:text-red-600 rounded-full transition-colors"
                                                    title="Remove Deck"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {(!formData.activeDeckIds || formData.activeDeckIds.length === 0) && (
                                        <p className="text-muted-foreground italic col-span-full py-4 text-center border-2 border-dashed border-border rounded-xl">
                                            No active decks assigned. <br />
                                            {isEditing ? 'Click "Add Content" to assign decks.' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* All Assigned Cards View */}
                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                <h3 className="font-bold flex items-center gap-2 mb-4">
                                    <BookOpen className="w-5 h-5 text-primary" /> All Assigned Cards
                                </h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar border rounded-lg p-2 bg-background/50">
                                    {decks
                                        .filter(d => formData.activeDeckIds?.includes(d.id))
                                        .flatMap(d => d.cards.map(c => ({ ...c, deckTitle: d.title })))
                                        .length > 0 ? (
                                        decks
                                            .filter(d => formData.activeDeckIds?.includes(d.id))
                                            .flatMap(d => d.cards.map(c => ({ ...c, deckTitle: d.title })))
                                            .map((card, idx) => (
                                                <div
                                                    key={`${card.id}-${idx}`}
                                                    onClick={() => setEditingCard(card)}
                                                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg border border-transparent hover:border-border transition-all cursor-pointer group"
                                                >
                                                    <div>
                                                        <div className="font-bold group-hover:text-primary transition-colors">{card.word}</div>
                                                        <div className="text-xs text-muted-foreground flex gap-2">
                                                            <span className="opacity-70">{card.deckTitle}</span>
                                                            <span>•</span>
                                                            <span className="italic">{card.definition}</span>
                                                        </div>
                                                    </div>
                                                    {card.audioUrl && <Volume2 className="w-4 h-4 text-muted-foreground" />}
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground italic">
                                            No cards found in active decks.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isAddModalOpen && (
                <AddContentModal
                    onClose={() => setIsAddModalOpen(false)}
                    mode="student"
                    studentName={formData.name}
                    availableDecks={decks}
                    availableCards={decks.flatMap(d => d.cards)}
                    activeDeckIds={formData.activeDeckIds}
                    onAssignDeck={(deckId) => {
                        const current = formData.activeDeckIds || [];
                        if (!current.includes(deckId)) {
                            const updatedIds = [...current, deckId];
                            const updatedStudent = { ...formData, activeDeckIds: updatedIds };
                            handleChange('activeDeckIds', updatedIds);
                            onSave(updatedStudent);
                        }
                    }}
                    onAddExistingCard={(card, targetDeckId) => onAddCard(card, targetDeckId)}
                    onCreateNewCard={(card, targetDeckId) => onAddCard(card, targetDeckId)}
                    apiKey={apiKey}
                />
            )}

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

            {avatarFile && (
                <AvatarCropperModal
                    imageFile={avatarFile}
                    onClose={() => setAvatarFile(null)}
                    onSave={(croppedUrl) => {
                        const updated = { ...formData, avatarUrl: croppedUrl };
                        handleChange('avatarUrl', croppedUrl);
                        onSave(updated); // auto persist image
                        setAvatarFile(null);
                    }}
                />
            )}
        </div>
    );
};
// Mock language list for dropdown
const LANGUAGES = [
    "Arabic", "Chinese (Mandarin)", "Chinese (Cantonese)", "English", "French", "German",
    "Hindi", "Italian", "Japanese", "Korean", "Polish", "Portuguese", "Russian", "Spanish",
    "Thai", "Turkish", "Ukrainian", "Vietnamese", "Other"
].sort();

// Mock country list for suggestions
const COUNTRIES = [
    "Brazil", "Canada", "China", "France", "Germany", "India", "Italy", "Japan", "Mexico",
    "Poland", "Russia", "South Korea", "Spain", "Thailand", "Turkey", "Ukraine", "United Kingdom", "United States", "Vietnam"
];




// Helper Components

const SectionCard = ({ title, icon: Icon, children, isEditing, onSaveRegion }: { title: string, icon: any, children: React.ReactNode, isEditing?: boolean, onSaveRegion?: () => void }) => (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm relative group transition-colors">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Icon className="w-5 h-5 text-primary" /> {title}
            </h3>
            {isEditing && onSaveRegion && (
                <button
                    onClick={onSaveRegion}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-color4/20 text-color4 rounded-md hover:bg-color4 hover:text-color1 transition-colors text-xs font-bold border border-color4/30"
                    title="Save fields in this tile"
                >
                    <Save className="w-3 h-3" /> Save Box
                </button>
            )}
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Field = ({ label, value, isEditing, onChange, icon: Icon, placeholder, list, isMandatory }: { label: string, value?: string, isEditing: boolean, onChange: (v: string) => void, icon?: any, placeholder?: string, list?: string, isMandatory?: boolean }) => {
    const hasValue = value && value.trim() !== '' && value !== 'New Student';
    const borderClass = isMandatory 
        ? (!hasValue ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,1)]' : 'border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,1)]')
        : 'border-input';

    return (
    <div className="w-full">
        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{label}</label>
        {isEditing ? (
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                    list={list}
                    className={`w-full p-2 rounded-md border bg-background transition-colors ${borderClass} ${Icon ? 'pl-9' : ''}`}
                />
            </div>
        ) : (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px]">
                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                <span className={!value ? 'text-muted-foreground italic' : ''}>{value || 'Not set'}</span>
            </div>
        )}
    </div>
    );
};

const TextArea = ({ label, value, isEditing, onChange, placeholder }: { label: string, value?: string, isEditing: boolean, onChange: (v: string) => void, placeholder?: string }) => (
    <div className="w-full">
        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{label}</label>
        {isEditing ? (
            <textarea
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                className="w-full p-2 rounded-md border border-input bg-background min-h-[100px] resize-y"
            />
        ) : (
            <div className="p-3 bg-muted/50 rounded-md min-h-[60px] whitespace-pre-wrap">
                <span className={!value ? 'text-muted-foreground italic' : ''}>{value || 'No notes.'}</span>
            </div>
        )}
    </div>
);
