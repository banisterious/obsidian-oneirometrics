# =============================================================================
# Phase 7A: HubModal.ts Inline Style Cleanup Script
# =============================================================================
# Purpose: Remove remaining inline styles from HubModal.ts Priority 1 items
# Target: 6+ inline style instances in HubModal.ts
# Date: 2025-06-11
# =============================================================================

param(
    [switch]$WhatIf = $false,
    [switch]$Verbose = $false
)

Write-Host "[*] Phase 7A: HubModal.ts Inline Style Cleanup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$targetFile = "src/dom/modals/HubModal.ts"
$backupFile = "$targetFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"

if (-not (Test-Path $targetFile)) {
    Write-Error "[!] Target file not found: $targetFile"
    exit 1
}

# Create backup
Write-Host "[*] Creating backup: $backupFile" -ForegroundColor Yellow
Copy-Item $targetFile $backupFile

# Read the file content
$content = Get-Content $targetFile -Raw

# Track changes
$changeCount = 0

# =============================================================================
# REPLACEMENT 1: Object style configuration (Line ~1234)
# =============================================================================
Write-Host "[*] Processing: Object style configuration..." -ForegroundColor Green

$pattern1 = "attr: \{ style: 'display: none;' \}"
$replacement1 = "cls: 'oom-feedback-area-hidden'"

if ($content -match [regex]::Escape($pattern1)) {
    $content = $content -replace [regex]::Escape($pattern1), $replacement1
    $changeCount++
    Write-Host "  [+] Replaced object style configuration with CSS class" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "    Pattern: $pattern1" -ForegroundColor DarkGray
        Write-Host "    Replacement: $replacement1" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [!] Object style configuration pattern not found" -ForegroundColor Yellow
}

# =============================================================================
# REPLACEMENT 2: Table header styling with cssText (Lines ~5516-5517)
# =============================================================================
Write-Host "[*] Processing: Table header styling..." -ForegroundColor Green

$pattern2a = "headerRow\.createEl\('th', \{ text: 'Callout Type' \}\)\.style\.cssText = 'border: 1px solid var\(--background-modifier-border\); padding: 0\.5em; text-align: left;';"
$replacement2a = "headerRow.createEl('th', { text: 'Callout Type', cls: 'oom-table-header' });"

$pattern2b = "headerRow\.createEl\('th', \{ text: 'Count' \}\)\.style\.cssText = 'border: 1px solid var\(--background-modifier-border\); padding: 0\.5em; text-align: right;';"
$replacement2b = "headerRow.createEl('th', { text: 'Count', cls: 'oom-table-header oom-table-header--right' });"

if ($content -match $pattern2a) {
    $content = $content -replace $pattern2a, $replacement2a
    $changeCount++
    Write-Host "  [+] Replaced 'Callout Type' header cssText with CSS class" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "    Replaced table header cssText styling" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [!] 'Callout Type' header pattern not found" -ForegroundColor Yellow
}

if ($content -match $pattern2b) {
    $content = $content -replace $pattern2b, $replacement2b
    $changeCount++
    Write-Host "  [+] Replaced 'Count' header cssText with CSS class" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "    Replaced table header cssText styling (right-aligned)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [!] 'Count' header pattern not found" -ForegroundColor Yellow
}

# =============================================================================
# REPLACEMENT 3: Table cell styling with cssText (Lines ~5520-5521)
# =============================================================================
Write-Host "[*] Processing: Table cell styling..." -ForegroundColor Green

$pattern3a = "row\.createEl\('td', \{ text: type \}\)\.style\.cssText = 'border: 1px solid var\(--background-modifier-border\); padding: 0\.5em;';"
$replacement3a = "row.createEl('td', { text: type, cls: 'oom-table-cell' });"

$pattern3b = "row\.createEl\('td', \{ text: count\.toString\(\) \}\)\.style\.cssText = 'border: 1px solid var\(--background-modifier-border\); padding: 0\.5em; text-align: right;';"
$replacement3b = "row.createEl('td', { text: count.toString(), cls: 'oom-table-cell oom-table-cell--right' });"

if ($content -match $pattern3a) {
    $content = $content -replace $pattern3a, $replacement3a
    $changeCount++
    Write-Host "  [+] Replaced table cell cssText with CSS class" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "    Replaced table data cell cssText styling" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [!] Table cell (type) pattern not found" -ForegroundColor Yellow
}

if ($content -match $pattern3b) {
    $content = $content -replace $pattern3b, $replacement3b
    $changeCount++
    Write-Host "  [+] Replaced table cell (count) cssText with CSS class" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "    Replaced table data cell cssText styling (right-aligned)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [!] Table cell (count) pattern not found" -ForegroundColor Yellow
}

# =============================================================================
# REPLACEMENT 4: Font style italic assignment (Line ~5628)
# =============================================================================
Write-Host "[*] Processing: Font style italic assignment..." -ForegroundColor Green

$pattern4 = "titleEl\.style\.fontStyle = 'italic';"
$replacement4 = "titleEl.classList.add('oom-title-italic');"

if ($content -match [regex]::Escape($pattern4)) {
    $content = $content -replace [regex]::Escape($pattern4), $replacement4
    $changeCount++
    Write-Host "  [+] Replaced fontStyle italic with CSS class" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "    Pattern: $pattern4" -ForegroundColor DarkGray
        Write-Host "    Replacement: $replacement4" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [!] Font style italic pattern not found" -ForegroundColor Yellow
}

# =============================================================================
# SAVE RESULTS
# =============================================================================

if ($changeCount -gt 0) {
    if ($WhatIf) {
        Write-Host "[*] WHAT-IF MODE: Would make $changeCount changes" -ForegroundColor Magenta
        Write-Host "[*] Backup created: $backupFile" -ForegroundColor Yellow
        Write-Host "[!] No actual changes made to source file" -ForegroundColor Yellow
    } else {
        # Save the modified content
        Set-Content -Path $targetFile -Value $content -NoNewline
        Write-Host "[+] Successfully applied $changeCount changes to $targetFile" -ForegroundColor Green
        Write-Host "[*] Backup available: $backupFile" -ForegroundColor Yellow
        
        # Verify changes
        $newContent = Get-Content $targetFile -Raw
        if ($newContent -eq $content) {
            Write-Host "[+] File verification passed" -ForegroundColor Green
        } else {
            Write-Error "[!] File verification failed - content mismatch"
        }
    }
} else {
    Write-Host "[!] No patterns matched - no changes made" -ForegroundColor Red
    Write-Host "[*] Backup created but not needed: $backupFile" -ForegroundColor Yellow
}

# =============================================================================
# SUMMARY
# =============================================================================

Write-Host "" -ForegroundColor White
Write-Host "[*] PHASE 7A SUMMARY" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Target File: $targetFile" -ForegroundColor White
Write-Host "Changes Made: $changeCount" -ForegroundColor White
Write-Host "Backup Created: $backupFile" -ForegroundColor White

if ($changeCount -gt 0) {
    Write-Host "" -ForegroundColor White
    Write-Host "[*] Next Steps:" -ForegroundColor Green
    Write-Host "1. Build and test the application" -ForegroundColor White
    Write-Host "2. Verify table styling in Content Analysis tab" -ForegroundColor White
    Write-Host "3. Check italic text rendering" -ForegroundColor White
    Write-Host "4. Commit changes if successful" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "CSS Classes Added to hub.css:" -ForegroundColor Green
    Write-Host "- .oom-table-header" -ForegroundColor White
    Write-Host "- .oom-table-header--right" -ForegroundColor White  
    Write-Host "- .oom-table-cell" -ForegroundColor White
    Write-Host "- .oom-table-cell--right" -ForegroundColor White
    Write-Host "- .oom-title-italic" -ForegroundColor White
    Write-Host "- .oom-feedback-area-hidden" -ForegroundColor White
}

Write-Host "" -ForegroundColor White
Write-Host "[+] Phase 7A HubModal.ts cleanup complete!" -ForegroundColor Green 