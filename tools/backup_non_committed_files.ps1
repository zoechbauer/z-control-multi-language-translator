$source = "C:\SOURCE-ACTIVE\ionic\multi-language-translator"
$backup = "C:\SOURCE-ACTIVE\BACKUP_NON_COMMITTED_FILES\Multi-Language-Translator"

# Create backup directory if it doesn't exist
if (!(Test-Path $backup)) {
    New-Item -ItemType Directory -Path $backup | Out-Null
}

# List of folders and files to back up
$itemsToBackup = @(
    ".github",
    ".vscode",
    ".env.local",
    "src\index_DEBUG_FIREBASE-config.html"
)

foreach ($item in $itemsToBackup) {
    $srcItem = Join-Path $source $item
    $destItem = Join-Path $backup $item

    # Ensure destination directory exists for files in subfolders
    $destDir = Split-Path $destItem -Parent
    if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    if (Test-Path $srcItem) {
        Copy-Item -Path $srcItem -Destination $destItem -Recurse -Force
    }
}

Write-Host "Backup complete. Files and folders copied to $backup"