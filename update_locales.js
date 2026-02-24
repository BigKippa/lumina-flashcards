
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Only process en.json to merge into others. 
// Note: recursive merge helper
function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
            deepMerge(target[key], source[key]);
        } else if (!(key in target)) {
            // Key missing in target, add it from source
            target[key] = source[key];
        }
    }
}

const files = fs.readdirSync(localesDir);

files.forEach(file => {
    if (file === 'en.json' || file === 'es.json') return; // Skip en and es

    const filePath = path.join(localesDir, file);
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`Processing ${file}...`);

        if (!data.auth) data.auth = {};
        if (!data.topics) data.topics = {};

        // Merge auth (shallow-ish is fine for now if structure is flat, but let's be safe)
        deepMerge(data.auth, enData.auth);

        // Merge topics (deep)
        deepMerge(data.topics, enData.topics);

        // Also check if 'common' is missing logic? Just in case.
        if (!data.common) data.common = {};
        deepMerge(data.common, enData.common);

        // Also check if 'welcome' is missing logic?
        if (!data.welcome) data.welcome = {};
        deepMerge(data.welcome, enData.welcome);


        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`Updated ${file}`);
    } catch (e) {
        console.error(`Error updating ${file}:`, e);
    }
});
