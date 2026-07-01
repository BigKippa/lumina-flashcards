import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');

// Get environment argument ('prod' or 'beta'). Defaults to 'beta'.
const envArg = process.argv[2] || 'beta';
const folderName = envArg.toLowerCase() === 'prod' ? 'Historical Prod' : 'Historical Beta';
const backupsDir = path.join(rootDir, 'backups', folderName);

// Ensure target backups directory exists
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

// Generate timestamp: YYYY-MM-DD_HH-mm-ss
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

const backupFileName = `backup-${timestamp}.zip`;
const backupFilePath = path.join(backupsDir, backupFileName);

console.log(`Creating ${folderName} backup archive: ${backupFileName}...`);

try {
    // Use git archive to create a zip of the HEAD commit
    execSync(`git archive --format=zip -o "${backupFilePath}" HEAD`, { cwd: rootDir, stdio: 'inherit' });
    console.log(`Backup successfully saved to: ${path.relative(rootDir, backupFilePath)}`);
} catch (error) {
    console.error(`Failed to create backup in ${folderName} via git archive:`, error.message);
    process.exit(1);
}
