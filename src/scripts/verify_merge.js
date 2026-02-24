
// MOCK DATA
const sourceUser = {
    id: 'user1',
    username: 'SourceUser',
    email: 'source@test.com',
    progress: {
        'deck1': { cardsLearned: 5, nextReview: 100 }, // Source has less
        'deck2': { cardsLearned: 10, nextReview: 200 } // Source exclusive
    },
    history: [{ date: '2023-01-01', action: 'login' }],
    favorites: [{ type: 'deck', deckId: 'deck1', mode: 'standard' }],
    learningHistory: [{ startTime: 1000, endTime: 2000, cardsReviewed: 5 }]
};

const targetUser = {
    id: 'user2',
    username: 'TargetUser',
    email: 'target@test.com',
    progress: {
        'deck1': { cardsLearned: 10, nextReview: 300 }, // Target has more (Keep this)
        'deck3': { cardsLearned: 2, nextReview: 400 } // Target exclusive
    },
    history: [{ date: '2023-01-02', action: 'logout' }],
    favorites: [
        { type: 'deck', deckId: 'deck1', mode: 'standard' }, // Duplicate
        { type: 'deck', deckId: 'deck3', mode: 'standard' }
    ],
    learningHistory: [{ startTime: 3000, endTime: 4000, cardsReviewed: 10 }]
};

console.log("--- STARTING MERGE TEST ---");

// MERGE LOGIC (Copied from AdminDashboard and adapted)
const mergedUser = { ...targetUser };

// 1. History (Concat & Sort)
mergedUser.history = [...(targetUser.history || []), ...(sourceUser.history || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
console.log("History Length:", mergedUser.history.length, "(Expected 2)");

// 2. Favorites (Merge & Dedup)
const allFavs = [...(targetUser.favorites || []), ...(sourceUser.favorites || [])];
const seenFavs = new Set();
mergedUser.favorites = allFavs.filter(f => {
    const key = `${f.type}-${f.deckId}-${f.mode}`;
    if (seenFavs.has(key)) return false;
    seenFavs.add(key);
    return true;
});
console.log("Favorites Length:", mergedUser.favorites.length, "(Expected 2 - deduced duplicate deck1)");

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

console.log("Progress Deck Count:", Object.keys(mergedUser.progress).length, "(Expected 3)");
console.log("Deck1 CardsLearned:", mergedUser.progress['deck1'].cardsLearned, "(Expected 10 - from Target)");
console.log("Deck2 CardsLearned:", mergedUser.progress['deck2'].cardsLearned, "(Expected 10 - from Source)");

if (mergedUser.history.length === 2 && mergedUser.favorites.length === 2 && mergedUser.progress['deck1'].cardsLearned === 10) {
    console.log(">>> TEST PASSED <<<");
} else {
    console.error(">>> TEST FAILED <<<");
}
