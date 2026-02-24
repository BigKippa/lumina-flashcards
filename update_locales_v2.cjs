const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const otherLocales = ['es', 'fr', 'de', 'it', 'pt', 'hi', 'ja', 'ko', 'ru', 'tr', 'uk', 'zh'];

// Recursively merge keys, keeping existing translations if they exist, 
// or using English value (prefixed/marked) if missing.
function mergeDeep(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] }); // Fallback to English
                }
            }
        });
    }
    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

otherLocales.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
        console.log(`Updating ${lang}...`);
        const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Specifically Update studyMode and pageTitles
        // We can just overwrite/merge these specific sections since we know they are new or need update

        if (!existingData.studyMode) existingData.studyMode = {};
        if (!existingData.pageTitles) existingData.pageTitles = {};

        // Helper to fill missing keys in a specific section
        const fillSection = (sectionName) => {
            Object.keys(enData[sectionName]).forEach(key => {
                if (!existingData[sectionName][key]) {
                    existingData[sectionName][key] = enData[sectionName][key]; // Use English as fallback for now
                }
            });
        };

        fillSection('studyMode');
        fillSection('pageTitles');

        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    } else {
        // If file doesn't exist, Create it (though we expect them to exist from previous steps)
        // fs.writeFileSync(filePath, JSON.stringify(enData, null, 2));
    }
});

console.log('Done updating locales.');
