# Tools Folder

This folder contains utility scripts and documentation for project maintenance and backup.

## Files

- **backup_non_committed_files.ps1**  
  PowerShell script to back up non-committed files and folders (such as `.github`, `.vscode`, `.env.local`, and `src/index_DEBUG_FIREBASE-config.html`) from the project directory to a safe backup location.  
  Use this script before deleting or migrating the project to avoid losing important configuration and environment files.

- **backup_non_committed_files.txt**  
  Instructions for running the backup script.  
  Includes steps for handling PowerShell execution policy errors.

- **CHANGELOG_template.md**  
  English template for maintaining changelogs.

- **generate-env.js**  
  Node.js script to generate Angular environment files (`environment.ts` and `environment.prod.ts`) from `.env.local` and process environment variables.  
  This script ensures secrets and configuration values are injected into the environment files and not committed to version control.

## Usage

1. Open PowerShell in the project directory.

2. To back up non-committed files, run:
   ```powershell
   .\tools\backup_non_committed_files.ps1
   ```
   If you get script execution errors, run:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\tools\backup_non_committed_files.ps1
   ```

3. To generate environment files, run:
   ```bash
   npm run generate-env
   ```
   (Make sure the `generate-env` script is defined in your root `package.json` as:  
   `"generate-env": "node ./tools/generate-env.js"`)

## Notes

- The backup location is set to `C:\SOURCE-ACTIVE\BACKUP_NON_COMMITTED_FILES\Landing-Page` by default.
- You can modify the backup script to include additional folders or change the backup path as needed.
- The `generate-env.js` script should be run whenever you update `.env.local` or want to refresh your environment files.
- These files are included in the repository to ensure backup instructions and scripts are always available.