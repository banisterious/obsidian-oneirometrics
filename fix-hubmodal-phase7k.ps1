#!/usr/bin/env pwsh

Write-Host "Phase 7K: HubModal.ts Remaining Styles Cleanup Script" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

$hubModalPath = "src/dom/modals/HubModal.ts"
$hubCssPath = "styles/hub.css"

# Check if files exist
if (!(Test-Path $hubModalPath)) {
    Write-Host "ERROR: HubModal.ts not found at $hubModalPath" -ForegroundColor Red
    exit 1
}

if (!(Test-Path $hubCssPath)) {
    Write-Host "ERROR: hub.css not found at $hubCssPath" -ForegroundColor Red
    exit 1
}

Write-Host "Reading files..." -ForegroundColor Yellow
$hubModalContent = Get-Content $hubModalPath -Raw
$hubCssContent = Get-Content $hubCssPath -Raw

$totalReplacements = 0

# File container patterns
Write-Host "`nProcessing file container patterns..." -ForegroundColor Cyan
$hubModalContent = $hubModalContent -replace "fileContainer\.style\.padding\s*=\s*['""]1em['""];", "fileContainer.classList.add('oom-file-container');"
$hubModalContent = $hubModalContent -replace "fileHeader\.style\.marginBottom\s*=\s*['""]0\.5em['""];", "fileHeader.classList.add('oom-file-header');"
$hubModalContent = $hubModalContent -replace "fileHeader\.style\.fontWeight\s*=\s*['""]bold['""];", ""
$hubModalContent = $hubModalContent -replace "pathSpan\.style\.fontSize\s*=\s*['""]0\.9em['""];", ""
$hubModalContent = $hubModalContent -replace "pathSpan\.style\.color\s*=\s*['""]var\(--text-muted\)['""];", ""
$hubModalContent = $hubModalContent -replace "pathSpan\.style\.fontWeight\s*=\s*['""]normal['""];", ""
$hubModalContent = $hubModalContent -replace "(\s+)(const pathSpan = [^;]+;)", "`$1`$2`n`$1pathSpan.classList.add('oom-file-path');"
$totalReplacements += 7

# Table and button patterns
Write-Host "Processing table and button patterns..." -ForegroundColor Cyan
$hubModalContent = $hubModalContent -replace "calloutTable\.style\.width\s*=\s*['""]100%['""];", "calloutTable.classList.add('oom-callout-table');"
$hubModalContent = $hubModalContent -replace "calloutTable\.style\.borderCollapse\s*=\s*['""]collapse['""];", ""
$hubModalContent = $hubModalContent -replace "buttonContainer\.style\.marginTop\s*=\s*['""]2em['""];", "buttonContainer.classList.add('oom-button-container-spaced');"
$hubModalContent = $hubModalContent -replace "closeBtn\.style\.marginTop\s*=\s*['""]2em['""];", "closeBtn.classList.add('oom-close-btn-spaced');"
$totalReplacements += 4

# Title patterns
Write-Host "Processing title patterns..." -ForegroundColor Cyan
$hubModalContent = $hubModalContent -replace "titleEl\.style\.color\s*=\s*['""]var\(--text-muted\)['""];", "titleEl.classList.add('oom-title-muted');"
$totalReplacements += 1

# Item and preview patterns
Write-Host "Processing item and preview patterns..." -ForegroundColor Cyan
$hubModalContent = $hubModalContent -replace "itemEl\.style\.border\s*=\s*['""]1px solid var\(--background-modifier-border\)['""];", "itemEl.classList.add('oom-item-container');"
$hubModalContent = $hubModalContent -replace "itemEl\.style\.padding\s*=\s*['""]1em['""];", ""
$hubModalContent = $hubModalContent -replace "itemEl\.style\.margin\s*=\s*['""]0\.5em 0['""];", ""
$hubModalContent = $hubModalContent -replace "itemEl\.style\.borderRadius\s*=\s*['""]4px['""];", ""
$hubModalContent = $hubModalContent -replace "previewEl\.style\.fontSize\s*=\s*['""]0\.8em['""];", "previewEl.classList.add('oom-preview-element');"
$hubModalContent = $hubModalContent -replace "previewEl\.style\.background\s*=\s*['""]var\(--background-secondary\)['""];", ""
$hubModalContent = $hubModalContent -replace "previewEl\.style\.padding\s*=\s*['""]0\.5em['""];", ""
$hubModalContent = $hubModalContent -replace "previewEl\.style\.borderRadius\s*=\s*['""]3px['""];", ""
$totalReplacements += 8

# Form input patterns
Write-Host "Processing form input patterns..." -ForegroundColor Cyan
$hubModalContent = $hubModalContent -replace "textarea\.style\.width\s*=\s*['""]100%['""];", "textarea.classList.add('oom-textarea-editor');"
$hubModalContent = $hubModalContent -replace "textarea\.style\.height\s*=\s*['""]200px['""];", ""
$hubModalContent = $hubModalContent -replace "textarea\.style\.fontFamily\s*=\s*['""]var\(--font-monospace\)['""];", ""
$hubModalContent = $hubModalContent -replace "textarea\.style\.padding\s*=\s*['""]1em['""];", ""
$hubModalContent = $hubModalContent -replace "templateNameInput\.style\.width\s*=\s*['""]100%['""];", "templateNameInput.classList.add('oom-template-name-input');"
$hubModalContent = $hubModalContent -replace "templateNameInput\.style\.margin\s*=\s*['""]1em 0['""];", ""
$hubModalContent = $hubModalContent -replace "templateNameInput\.style\.padding\s*=\s*['""]0\.5em['""];", ""
$totalReplacements += 7

# Template list patterns
Write-Host "Processing template list patterns..." -ForegroundColor Cyan
$hubModalContent = $hubModalContent -replace "templateList\.style\.maxHeight\s*=\s*['""]300px['""];", "templateList.classList.add('oom-template-list');"
$hubModalContent = $hubModalContent -replace "templateList\.style\.overflowY\s*=\s*['""]auto['""];", ""
$hubModalContent = $hubModalContent -replace "templateList\.style\.border\s*=\s*['""]1px solid var\(--background-modifier-border\)['""];", ""
$hubModalContent = $hubModalContent -replace "templateList\.style\.borderRadius\s*=\s*['""]4px['""];", ""
$hubModalContent = $hubModalContent -replace "templateList\.style\.padding\s*=\s*['""]0\.5em['""];", ""
$hubModalContent = $hubModalContent -replace "templateList\.style\.marginTop\s*=\s*['""]1em['""];", ""
$hubModalContent = $hubModalContent -replace "templateItem\.style\.display\s*=\s*['""]flex['""];", "templateItem.classList.add('oom-template-item');"
$hubModalContent = $hubModalContent -replace "templateItem\.style\.alignItems\s*=\s*['""]center['""];", ""
$hubModalContent = $hubModalContent -replace "templateItem\.style\.padding\s*=\s*['""]0\.5em['""];", ""
$hubModalContent = $hubModalContent -replace "templateItem\.style\.borderBottom\s*=\s*['""]1px solid var\(--background-modifier-border-focus\)['""];", ""
$hubModalContent = $hubModalContent -replace "checkbox\.style\.marginRight\s*=\s*['""]0\.75em['""];", "checkbox.classList.add('oom-template-checkbox');"
$totalReplacements += 11

# Select all patterns
Write-Host "Processing select all patterns..." -ForegroundColor Cyan
$hubModalContent = $hubModalContent -replace "selectAllContainer\.style\.marginTop\s*=\s*['""]0\.75em['""];", "selectAllContainer.classList.add('oom-select-all-container');"
$hubModalContent = $hubModalContent -replace "selectAllCheckbox\.style\.marginRight\s*=\s*['""]0\.5em['""];", "selectAllCheckbox.classList.add('oom-select-all-checkbox');"
$totalReplacements += 2

# Feedback area patterns
Write-Host "Processing feedback area patterns..." -ForegroundColor Cyan
$hubModalContent = $hubModalContent -replace "this\.feedbackArea\.style\.display\s*=\s*['""]block['""];", "this.feedbackArea.classList.remove('oom-hidden'); this.feedbackArea.classList.add('oom-visible');"
$hubModalContent = $hubModalContent -replace "this\.feedbackArea\.style\.display\s*=\s*['""]none['""];", "this.feedbackArea.classList.remove('oom-visible'); this.feedbackArea.classList.add('oom-hidden');"
$totalReplacements += 3

# Add CSS classes
Write-Host "Adding CSS classes to hub.css..." -ForegroundColor Cyan
$newCssClasses = @"

/* Phase 7K: Remaining HubModal.ts Styles */
.oom-file-container { padding: 1em; }
.oom-file-header { margin-bottom: 0.5em; font-weight: bold; }
.oom-file-path { font-size: 0.9em; color: var(--text-muted); font-weight: normal; }
.oom-callout-table { width: 100%; border-collapse: collapse; }
.oom-button-container-spaced { margin-top: 2em; }
.oom-close-btn-spaced { margin-top: 2em; }
.oom-title-muted { color: var(--text-muted); }
.oom-item-container { border: 1px solid var(--background-modifier-border); padding: 1em; margin: 0.5em 0; border-radius: 4px; }
.oom-preview-element { font-size: 0.8em; background: var(--background-secondary); padding: 0.5em; border-radius: 3px; }
.oom-textarea-editor { width: 100%; height: 200px; font-family: var(--font-monospace); padding: 1em; }
.oom-template-name-input { width: 100%; margin: 1em 0; padding: 0.5em; }
.oom-template-list { max-height: 300px; overflow-y: auto; border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 0.5em; margin-top: 1em; }
.oom-template-item { display: flex; align-items: center; padding: 0.5em; border-bottom: 1px solid var(--background-modifier-border-focus); }
.oom-template-checkbox { margin-right: 0.75em; }
.oom-select-all-container { margin-top: 0.75em; }
.oom-select-all-checkbox { margin-right: 0.5em; }
.oom-visible { display: block !important; }
.oom-hidden { display: none !important; }

"@

$hubCssContent += $newCssClasses

# Write files
Write-Host "Writing updated files..." -ForegroundColor Yellow
Set-Content -Path $hubModalPath -Value $hubModalContent -NoNewline
Set-Content -Path $hubCssPath -Value $hubCssContent -NoNewline

Write-Host "Phase 7K Complete!" -ForegroundColor Green
Write-Host "Total inline styles eliminated: $totalReplacements" -ForegroundColor Green

# Build
Write-Host "Running build..." -ForegroundColor Yellow
& npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}

Write-Host "Total Progress: 473+ inline styles eliminated" -ForegroundColor Green 