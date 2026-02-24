export type MediaType = 'text' | 'image' | 'audio' | 'video';

export interface QuizResult {
    total: number;
    correct: number;
    incorrect: number;
}

export interface CardContent {
    text?: string;
    imageUrl?: string;
    audioUrl?: string;
    videoUrl?: string;
    layout?: 'stack' | 'overlay'; // For future flexibility
}

export interface SpacedRepetitionStats {
    interval: number; // Days
    ease: number;
    dueDate: Date;
    viewCount: number;
    correctCount: number;
    incorrectCount: number;
}

import { Word } from './data/vocabulary';

export interface Deck {
    id: string;
    title: string;
    description: string;
    cards: Word[];
    subject?: string;
    category?: string;
    level?: string;
    status?: 'public' | 'private' | 'pending' | 'rejected';
    authorId?: string;
    reports?: { reason: string; timestamp: number; userId: string; }[];
    isArchived?: boolean;
}


export interface DeckProgress {
    deckId: string;
    cardsLearned: number;
    cardsDue: number;
    accuracy: number; // Percentage 0-100
}

export interface SessionLog {
    id: string;
    date: Date;
    deckId: string;
    mode: string;
    durationSeconds: number;
    score: {
        correct: number;
        incorrect: number;
        unanswered: number;
    };
}

export interface FavoriteItem {
    id: string; // Unique ID for the favorite entry
    type: 'deck' | 'mode';
    deckId: string;
    mode?: string; // e.g. 'study', 'timed'
    label: string; // Display name
    timestamp: number;
}

export interface SessionActivity {
    id: string;
    type: 'quiz' | 'study' | 'timed';
    deckId: string;
    deckName: string;
    timestamp: number;
    durationSeconds: number;
    stats: {
        correct: number;
        incorrect: number;
        score?: number; // For quiz/timed
        streak?: number;
    };
}

export interface LearningSession {
    id: string;
    startTime: number;
    endTime: number | null;
    durationSeconds: number;
    activities: SessionActivity[];
    summary: {
        totalCards: number;
        totalCorrect: number;
        totalTime: number;
        decksStudied: string[];
    };
}

export interface SessionInfo {
    deckId: string;
    mode: string;
    timestamp: number;
    label?: string;
}

export type UserRole = 'admin' | 'user' | 'tutor';

export interface ContactDetail {
    id: string;
    value: string;
    label: string;
    isCustomLabel: boolean;
    isRecovery: boolean;
}

export interface UserProfile {
    id: string;
    username: string;
    email?: string; // New anchor for identity
    activeDeckIds?: string[]; // IDs of assigned decks
    avatarUrl?: string; // For future use
    progress: Record<string, DeckProgress>; // Keyed by DeckID
    history: SessionLog[]; // Old simpler log (legacy support or summary)
    learningHistory: LearningSession[]; // New detailed history
    favorites: FavoriteItem[];
    lastSession?: SessionInfo;
    role?: UserRole;
    password?: string; // Optional for backward compatibility, but recommended
    forcePasswordReset?: boolean; // Forces user to reset password/username on next login

    // Expanded Profile Fields
    // Expanded Profile Fields - Contact & Location
    phone?: string;
    phones?: ContactDetail[]; // Array of structured phone numbers
    emails?: ContactDetail[]; // Array of structured emails
    additionalPhones?: string[]; // Legacy array of phone numbers
    secondaryEmails?: string[]; // Legacy array of additional email addresses
    timeZone?: string;
    originCity?: string;
    originCountry?: string;
    currentCity?: string;
    currentCountry?: string;

    // Professional & Identity
    profession?: string;
    interests?: string; // Comma-separated

    // Learning Profile
    nativeLanguage?: string;
    targetLanguage?: string;
    englishLevel?: string;
    goals?: string;
    englishEnvironment?: string;
    schedule?: string;
    preferences?: string;

    isArchived?: boolean;
}

export interface Ticket {
    id: string;
    userId: string;
    username: string;
    timestamp: number;
    description: string;
    context: string;
    category?: 'technical' | 'edit' | 'visual' | 'other';
    attachmentUrl?: string;
    status: 'open' | 'resolved';
}

export interface CategoryStyle {
    backgroundColor: string;
    titleColor: string;
    textColor: string;
    borderColor?: string;
}

export interface StudentRequest {
    id: string;
    studentId: string;
    type: 'question' | 'pronunciation' | 'other';
    content: string;
    status: 'pending' | 'resolved';
    timestamp: number;
}

export interface Student {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string; // Optional avatar

    // Basic Info
    nativeLanguage?: string;
    originCity?: string;
    originCountry?: string;
    currentCity?: string;
    currentCountry?: string;
    timeZone?: string;
    phone?: string;
    profession?: string;
    interests?: string; // Comma separated or free text
    basicNotes?: string;

    // Learning Needs
    englishLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
    goals?: string;
    learningHistory?: string;
    schedule?: string;
    preferences?: string;
    requestsHomework?: boolean;
    englishEnvironment?: string; // Free type
    learningNotes?: string;

    // Current Flashcards / Stats
    activeDeckIds: string[];
    // We can link to UserProfile for detailed stats if they are a registered user, 
    // but for now we might just store a summary or link by ID.
    // For this standalone feature, let's assume manual entry or mock data for now.
    lastSessionDate?: number;
    lastSessionSummary?: string; // "Studied verbs value: 20/20"

    status: 'active' | 'archived';
    joinedDate: number;

    homeworkStatus?: 'Incomplete' | 'Completed' | 'Needs Review';
    requests?: StudentRequest[];
}

export interface AppSettings {
    categories: Record<string, CategoryStyle>;
    autoAdvanceDelay?: number; // milliseconds
    autoAdvanceEnabled?: boolean;
    geminiApiKey?: string;
}

export type AppMode = 'deck' | 'study' | 'quiz' | 'quiz-result' | 'profile' | 'admin' | 'tutor' | 'typing' | 'timed' | 'welcome' | 'topic-selection' | 'topic-group' | 'mode-selection';
