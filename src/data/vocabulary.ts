export interface Word {
    id: number;
    word: string;
    definition: string;
    example: string;
    phonetic: string;
    imageUrl?: string;
    audioUrl?: string;
    videoUrl?: string;
    category?: string;
    level?: string;
    isPublic?: boolean; // Deprecated in favor of status
    status?: 'public' | 'private' | 'pending' | 'rejected';
    authorId?: string;
    reports?: { reason: string; timestamp: number; userId: string; }[];
    notes?: string;
    disableAudio?: boolean;
    customPronunciation?: string;

    // Alternate fields for edge cases and multiple usages
    alternateDefinitions?: string[];
    alternateExamples?: string[];
    alternatePhonetics?: string[];
    alternatePronunciations?: string[];
    alternateImageUrls?: string[];
    alternateAudioUrls?: string[];
    alternateCategories?: string[];
}

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

export const vocabulary: Word[] = [
    {
        id: 1,
        word: "Ephemeral",
        definition: "Lasting for a very short time.",
        example: "Fashions are ephemeral, changing with every season.",
        phonetic: "/əˈfem(ə)rəl/",
        isPublic: true,
        status: 'public',
        authorId: 'system'
    },
    {
        id: 2,
        word: "Serendipity",
        definition: "The occurrence and development of events by chance in a happy or beneficial way.",
        example: "It was pure serendipity that we met at the coffee shop right before the rain started.",
        phonetic: "/ˌserənˈdipədē/",
        isPublic: true,
        status: 'public',
        authorId: 'system'
    },
    {
        id: 3,
        word: "Mellifluous",
        definition: "(of a voice or words) sweet or musical; pleasant to hear.",
        example: "She had a rich, mellifluous voice that captivated the audience.",
        phonetic: "/məˈliflo͞oəs/"
    },
    {
        id: 4,
        word: "Limerence",
        definition: "The state of being infatuated or obsessed with another person, typically experienced involuntarily and characterized by a strong desire for reciprocation of one's feelings.",
        example: "His feelings for her were more akin to limerence than true love.",
        phonetic: "/ˈlimərəns/"
    },
    {
        id: 5,
        word: "Petrichor",
        definition: "A pleasant smell that frequently accompanies the first rain after a long period of warm, dry weather.",
        example: "The air was filled with the scent of petrichor as the storm broke.",
        phonetic: "/ˈpetrəˌkô(ə)r/"
    },
    {
        id: 6,
        word: "Solitude",
        definition: "The state or situation of being alone.",
        example: "She savored her moments of solitude in the garden.",
        phonetic: "/ˈsäləˌt(y)o͞od/"
    },
    {
        id: 7,
        word: "Aurora",
        definition: "A natural electrical phenomenon characterized by the appearance of streamers of reddish or greenish light in the sky.",
        example: "We traveled north to see the spectacular aurora borealis.",
        phonetic: "/əˈrôrə/"
    },
    {
        id: 8,
        word: "Vellichor",
        definition: "The strange wistfulness of used bookstores.",
        example: "Entering the old shop, he was immediately struck by a sense of vellichor.",
        phonetic: "/ˈvɛlɪkɔːr/"
    },
    {
        id: 9,
        word: "Ineffable",
        definition: "Too great or extreme to be expressed or described in words.",
        example: "The ineffable beauty of the sunset left them speechless.",
        phonetic: "/inˈefəb(ə)l/"
    },
    {
        id: 10,
        word: "Sonder",
        definition: "The realization that each random passerby is living a life as vivid and complex as your own.",
        example: "Sitting on the park bench, he was overcome by a wave of sonder.",
        phonetic: "/ˈsɒndə/"
    }
];

export const initialDecks: Deck[] = [
    {
        id: 'core-vocab',
        title: 'Core Vocabulary',
        description: 'Essential words for elevating your daily expression.',
        cards: vocabulary,
        subject: 'Vocabulary',
        level: 'Intermediate'
    },
    {
        id: 'common-idioms',
        title: 'Common Idioms',
        description: 'Master the art of figurative language.',
        cards: [
            {
                id: 101,
                word: "Bite the bullet",
                definition: "To get something over with because it is inevitable.",
                example: "I decided to bite the bullet and finish the report.",
                phonetic: "/baɪt ðə ˈbʊlɪt/",
                category: "Idioms"
            }
        ],
        subject: 'Idioms',
        level: 'Beginner'
    },
    {
        id: 'phrasal-verbs-1',
        title: 'Essential Phrasal Verbs',
        description: 'Verbs that change meaning when combined.',
        cards: [
            {
                id: 201,
                word: "Give up",
                definition: "To stop trying to do something.",
                example: "Don't give up on your dreams.",
                phonetic: "/ɡɪv ʌp/",
                category: "Phrasal Verbs"
            }
        ],
        subject: 'Phrasal Verbs',
        level: 'Intermediate'
    },
    {
        id: 'collocations-1',
        title: 'Common Collocations',
        description: 'Words that naturally go together.',
        cards: [
            {
                id: 301,
                word: "Do homework",
                definition: "To complete school assignments.",
                example: "I need to do my homework before dinner.",
                phonetic: "/duː ˈhoʊmˌwɜːrk/",
                category: "Collocations"
            }
        ],
        subject: 'Collocations',
        level: 'Intermediate'
    },
    {
        id: 'prepositions-1',
        title: 'Tricky Prepositions',
        description: 'Mastering in, on, at, and more.',
        cards: [
            {
                id: 401,
                word: "Depend on",
                definition: "To rely on someone or something.",
                example: "You can always depend on him.",
                phonetic: "/dɪˈpend ɒn/",
                category: "Prepositions"
            }
        ],
        subject: 'Prepositions',
        level: 'Beginner'
    }
];
