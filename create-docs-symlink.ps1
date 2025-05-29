# Create-Docs-Symlink.ps1
# This script creates a symbolic link from the OOMP docs directory to an Obsidian vault

# Source and target paths
$sourceDir = "C:\Dev\Obsidian\OOMP\docs"
$targetDir = "C:\Vaults\Banister\Projects\Obsidian Projects\OOMP (OneiroMetrics)\docs"

# Check if source directory exists
if (-not (Test-Path $sourceDir)) {
    Write-Error "Source directory '$sourceDir' does not exist."
    exit 1
}

# Check if target already exists
if (Test-Path $targetDir) {
    $response = Read-Host "Target '$targetDir' already exists. Do you want to remove it? (y/n)"
    if ($response -eq "y") {
        Remove-Item -Path $targetDir -Force -Recurse
        Write-Host "Removed existing target."
    } else {
        Write-Host "Operation cancelled."
        exit 0
    }
}

# Create the parent directory if it doesn't exist
$parentDir = Split-Path -Parent $targetDir
if (-not (Test-Path $parentDir)) {
    Write-Host "Creating parent directory: $parentDir"
    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
}

# Create the symbolic link
try {
    Write-Host "Creating symbolic link..."
    New-Item -ItemType SymbolicLink -Path $targetDir -Target $sourceDir
    Write-Host "Successfully created symbolic link from '$targetDir' to '$sourceDir'"
} catch {
    Write-Error "Failed to create symbolic link: $_"
    Write-Host "Note: Creating symbolic links requires administrator privileges."
    Write-Host "Please run this script as administrator and try again."
    exit 1
}

Write-Host "Operation completed successfully." 