import { Deck } from '../types';

export const MOCK_DECKS: Deck[] = [
    // BEGINNER - PREPOSITIONS
    {
        id: 'deck-beg-prep-time',
        title: 'Prepositions of Time',
        description: 'Learn in, on, at for time expressions',
        level: 'Beginner',
        subject: 'Prepositions',
        category: 'Time',
        cards: [
            { id: 1001, word: 'In (Time)', definition: 'Used for months, years, centuries, and long periods', example: 'I was born in 1990.', phonetic: '/ɪn/' },
            { id: 1002, word: 'On (Time)', definition: 'Used for days and dates', example: 'See you on Monday.', phonetic: '/ɒn/' },
        ]
    },
    {
        id: 'deck-beg-prep-place',
        title: 'Prepositions of Place',
        description: 'Learn in, on, at for locations',
        // level: 'Beginner',
        // subject: 'Prepositions',
        // category: 'Place',
        cards: []
    },
    {
        id: 'deck-beg-prep-dir',
        title: 'Direction & Movement',
        description: 'To, towards, into, out of',
        // level: 'Beginner',
        // subject: 'Prepositions',
        // category: 'Direction/Movement',
        cards: []
    },

    // BEGINNER - VERBS
    {
        id: 'deck-beg-verb-pres',
        title: 'Present Simple',
        description: 'Daily routines and facts',
        level: 'Beginner',
        subject: 'Verbs',
        category: 'Tense',
        cards: [
            { id: 501, word: 'Run', definition: 'To move at a speed faster than a walk', example: 'I run every morning.', phonetic: '/rʌn/' }
        ]
    },

    // COMMON PHRASES & COLLOCATIONS
    {
        id: 'deck-phrases-common',
        title: 'Common Collocations',
        description: 'Words that go together naturally',
        subject: 'Collocations',
        category: 'General',
        cards: [
            { id: 101, word: 'Heavy rain', definition: 'Intense rainfall', example: 'We canceled the picnic due to heavy rain.', phonetic: '/ˈhɛvi reɪn/' },
            { id: 102, word: 'Make a mistake', definition: 'To do something incorrect', example: 'It is okay to make a mistake if you learn from it.', phonetic: '/meɪk ə mɪˈsteɪk/' },
        ]
    },

    // IDIOMS
    {
        id: 'deck-idioms-1',
        title: 'Color Idioms',
        description: 'Expressions using colors',
        subject: 'Idioms',
        category: 'Colors',
        cards: [
            { id: 201, word: 'Out of the blue', definition: 'Unexpectedly; without warning', example: 'She called me out of the blue after five years.', phonetic: '/aʊt əv ðə bluː/' },
            { id: 202, word: 'Green with envy', definition: 'Very jealous', example: 'He was green with envy when he saw my new car.', phonetic: '/griːn wɪð ˈɛnvi/' },
        ]
    },

    // PHRASAL VERBS (Existing adapted)
    {
        id: 'deck-int-phrasal-get',
        title: 'Phrasal Verbs with GET',
        description: 'Get up, get over, get by',
        subject: 'Phrasal Verbs',
        category: 'General',
        cards: [
            { id: 401, word: 'Get along', definition: 'To have a friendly relationship', example: 'I get along well with my neighbors.', phonetic: '/gɛt əˈlɒŋ/' }
        ]
    },

    // VOCABULARY (General)
    {
        id: 'deck-vocab-advanced',
        title: 'Advanced Vocabulary',
        description: 'Sophisticated words for essays',
        subject: 'Vocabulary',
        category: 'Academic',
        cards: [
            { id: 301, word: 'Evanescent', definition: 'Soon passing out of sight, memory, or existence', example: 'A shimmering evanescent bubble.', phonetic: '/ˌɛvəˈnɛsnt/' },
            { id: 302, word: 'Serendipity', definition: 'The occurrence of events by chance in a happy or beneficial way', example: 'Meeting my wife was pure serendipity.', phonetic: '/ˌsɛrənˈdɪpɪti/' }
        ]
    }
];

export const HIERARCHY = {
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    subjects: ['Prepositions', 'Verbs', 'Nouns', 'Phrasal Verbs', 'Verb Tense', 'Collocations', 'Idioms', 'Vocabulary'],
    categories: {
        'Prepositions': ['Time', 'Place', 'Direction/Movement', 'Manner', 'Agent/Instrument', 'Source', 'Measure'],
        'Verbs': ['Tense', 'Conjugation', 'Irregular'],
        // Add others as needed
    }
};
