import React from 'react';
import { AppMode, UserRole } from '../types';

interface PageIdentifierProps {
    mode: AppMode;
    userRole?: UserRole;
    language: string;
    activeDeckId?: string | null;
    studyModeSuffix?: string;
}

const PAGE_NUMBERS: Record<AppMode, number> = {
    'mode-selection': 1,
    'welcome': 2,
    'topic-selection': 3,
    'topic-group': 13,
    'deck': 4,
    'study': 5,
    'quiz': 6,
    'timed': 7,
    'typing': 8,
    'quiz-result': 9,
    'profile': 10,
    'tutor': 11,
    'admin': 12
};

const PageIdentifier: React.FC<PageIdentifierProps> = ({ mode, userRole, language, activeDeckId, studyModeSuffix }) => {

    const pageNum = PAGE_NUMBERS[mode] ?? 99;
    // Defensive check for language
    const langCode = (language || 'en').substring(0, 2).toLowerCase();

    let userModeChar = 'l'; // Default learner
    if (userRole === 'admin') userModeChar = 'a';
    else if (userRole === 'tutor') userModeChar = 't';

    // If rendering a deck layout type and there's a deck id, append a hash identifier derived from the deckId string
    let dIdSuffix = "";
    if (activeDeckId && ['deck', 'study', 'quiz', 'timed', 'typing', 'quiz-result'].includes(mode)) {
        // Just extract numeric parts or unique characters from the activeDeckId
        const numericHash = activeDeckId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        dIdSuffix = `-${numericHash}`;
    }

    const identifier = `${pageNum}${langCode}${userModeChar}${studyModeSuffix || ''}${dIdSuffix}`.toUpperCase();

    return (
        <div className="fixed bottom-0 right-0 z-[100] bg-black/80 text-white font-mono text-xs px-2 py-1 rounded-tl-lg pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
            {identifier}
        </div>
    );
};

export default PageIdentifier;
