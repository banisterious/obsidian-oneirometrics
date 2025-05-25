# Post-Refactoring Cleanup PowerShell Script
# This script automates the cleanup tasks specified in post-refactoring-cleanup-checklist.md

Write-Host "Starting post-refactoring cleanup..." -ForegroundColor Green

# Create archive directories if they don't exist
Write-Host "Creating archive directories..." -ForegroundColor Cyan
if (-Not (Test-Path "docs\archive\legacy")) {
    New-Item -Path "docs\archive\legacy" -ItemType Directory -Force | Out-Null
}
if (-Not (Test-Path "docs\archive\refactoring-2025")) {
    New-Item -Path "docs\archive\refactoring-2025" -ItemType Directory -Force | Out-Null
}

# Archive documentation files
Write-Host "Archiving documentation files..." -ForegroundColor Cyan

$filesToArchive = @(
    @{Source = "TypeScript-Migration-Plan.md"; Destination = "docs\archive\refactoring-2025\"}
    @{Source = "docs\developer\implementation\typescript-issues.md"; Destination = "docs\archive\refactoring-2025\"}
    @{Source = "docs\developer\implementation\typescript-issues-next-steps.md"; Destination = "docs\archive\refactoring-2025\"}
    @{Source = "docs\developer\implementation\typescript-migration-status.md"; Destination = "docs\archive\refactoring-2025\"}
    @{Source = "docs\developer\implementation\typescript-component-migration.md"; Destination = "docs\archive\refactoring-2025\"}
    @{Source = "docs\developer\implementation\examples\component-migration-example.ts"; Destination = "docs\archive\refactoring-2025\"}
    @{Source = "docs\developer\implementation\refactoring-plan-2025.md"; Destination = "docs\archive\refactoring-2025\"}
)

foreach ($file in $filesToArchive) {
    if (Test-Path $file.Source) {
        Write-Host "Moving $($file.Source) to $($file.Destination)" -ForegroundColor Yellow
        Move-Item -Path $file.Source -Destination $file.Destination -Force
    } else {
        Write-Host "$($file.Source) already archived or doesn't exist" -ForegroundColor Gray
    }
}

# NOTE: Adapter files are NOT removed automatically anymore
# We now use a phased migration approach documented in post-refactoring-cleanup-checklist.md
Write-Host "IMPORTANT: Adapter files will NOT be automatically removed" -ForegroundColor Yellow
Write-Host "Following the new phased migration approach documented in post-refactoring-cleanup-checklist.md" -ForegroundColor Yellow
Write-Host "The following files will be migrated gradually:" -ForegroundColor Cyan
Write-Host "  - src\utils\adapter-functions.ts" -ForegroundColor Cyan
Write-Host "  - src\utils\type-adapters.ts" -ForegroundColor Cyan
Write-Host "  - src\utils\property-compatibility.ts" -ForegroundColor Cyan
Write-Host "  - src\utils\component-migrator.ts" -ForegroundColor Cyan

# Add a comment to the adapter files to indicate they're pending migration
Write-Host "Adding migration notice to adapter files..." -ForegroundColor Cyan

$adapterFiles = @(
    "src\utils\adapter-functions.ts",
    "src\utils\type-adapters.ts",
    "src\utils\property-compatibility.ts",
    "src\utils\component-migrator.ts"
)

foreach ($file in $adapterFiles) {
    if (Test-Path $file) {
        # Check if notice already exists
        $fileContent = Get-Content -Path $file -Raw
        if ($fileContent -notmatch "MIGRATION NOTICE") {
            # Add notice to the beginning of the file
            $notice = @"
/**
 * MIGRATION NOTICE
 * 
 * This file is part of the phased migration plan and will eventually be replaced.
 * Do not add new dependencies on this file. Instead, use the permanent replacements
 * as documented in the TypeScript architecture documentation.
 * 
 * See post-refactoring-cleanup-checklist.md for the detailed migration plan.
 */

"@
            $updatedContent = $notice + $fileContent
            Set-Content -Path $file -Value $updatedContent
            Write-Host "Added migration notice to $file" -ForegroundColor Green
        } else {
            Write-Host "Migration notice already exists in $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "$file not found" -ForegroundColor Gray
    }
}

Write-Host "Cleanup complete! Please run TypeScript compilation to verify no errors." -ForegroundColor Green
Write-Host "When you've confirmed everything works, you can archive the post-refactoring-cleanup-checklist.md file." -ForegroundColor Green 