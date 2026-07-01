# Lumina Flashcards Backup & Restore Guide

This directory contains timestamped ZIP backups of the Lumina Flashcards codebase. Backups are automatically generated when publishing to the Beta or Production environments.

## Backup Locations
- **[Historical Beta Folder](file:///c:/Users/kipsc/Documents/GitHub/lumina-flashcards/backups/Historical%20Beta)**
- **[Historical Prod Folder](file:///c:/Users/kipsc/Documents/GitHub/lumina-flashcards/backups/Historical%20Prod)**

---

## How to Restore a Backup (Step-by-Step)

Follow these instructions to restore your project to any earlier backup version:

### Method 1: The Simple Extract-and-Overwrite Way (Recommended)
This is the easiest and safest way to restore.

1. **Locate your desired backup**:
   - Open the **[Historical Beta](file:///c:/Users/kipsc/Documents/GitHub/lumina-flashcards/backups/Historical%20Beta)** or **[Historical Prod](file:///c:/Users/kipsc/Documents/GitHub/lumina-flashcards/backups/Historical%20Prod)** folder in your File Explorer.
   - Choose the ZIP file corresponding to the date and time you want to restore.
2. **Extract the ZIP file**:
   - Right-click the ZIP file and choose **Extract All...** (or use tools like 7-Zip / WinRAR).
   - Extract it to a temporary folder on your computer.
3. **Overwrite the project files**:
   - Copy all the files and folders from the extracted temporary folder.
   - Paste them directly into your project root directory: `c:\Users\kipsc\Documents\GitHub\lumina-flashcards`
   - When Windows asks if you want to replace existing files, select **Replace the files in the destination**.
4. **Reinstall dependencies (only if package.json changed)**:
   - If the backup you restored had different libraries, open your terminal in the project directory and run:
     ```bash
     npm install
     ```

---

### Method 2: The Clean Git Way
If you prefer to restore using Git to maintain a clean git history:

1. **Stage and commit your current uncommitted work** so you don't lose anything:
   ```bash
   git add .
   git commit -m "Save work before restore"
   ```
2. **Locate the ZIP file** you want to restore.
3. **Clean the project directory** (except for ignored folders):
   ```bash
   git clean -fd
   ```
4. **Extract and replace**:
   - Extract the ZIP file directly into the project root directory, replacing all existing files.
5. **Stage and commit the restored files**:
   ```bash
   git add .
   git commit -m "Restore project to backup version"
   ```
