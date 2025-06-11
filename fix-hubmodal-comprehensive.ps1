#!/usr/bin/env powershell

<#
.SYNOPSIS
    Phase 7I: HubModal.ts Comprehensive Inline Style Cleanup Script
    
.DESCRIPTION
    Systematically converts 90+ inline styles in HubModal.ts to CSS classes.
    Organized by component patterns for maintainability.
    
.PARAMETER WhatIf
    Shows what changes would be made without applying them
    
.EXAMPLE
    .\fix-hubmodal-comprehensive.ps1 -WhatIf
    .\fix-hubmodal-comprehensive.ps1
#>

param(
    [switch]$WhatIf
)

# Configuration
$sourceFile = "src/dom/modals/HubModal.ts"
$hubCssFile = "styles/hub.css"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = "$sourceFile.backup.$timestamp"

# Pattern groups for systematic processing
$patternGroups = @{
    "PreviewSpan" = @{
        patterns = @(
            @{ regex = "previewSpan\.style\.fontWeight = 'bold';"; replacement = "previewSpan.classList.add('oom-preview-span--bold');" }
        )
        cssClass = ".oom-preview-span--bold"
        css = "font-weight: bold;"
    }
    
    "CreateButtonContainer" = @{
        patterns = @(
            @{ regex = "createBtnContainer\.style\.marginTop = '1em';"; replacement = "createBtnContainer.classList.add('oom-create-btn-container');" }
            @{ regex = "createBtnContainer\.style\.marginTop = '1\.5em';"; replacement = "createBtnContainer.classList.add('oom-create-btn-container--extended');" }
        )
        cssClasses = @(
            @{ class = ".oom-create-btn-container"; css = "margin-top: 1em;" }
            @{ class = ".oom-create-btn-container--extended"; css = "margin-top: 1.5em;" }
        )
    }
    
    "HelpersContainer" = @{
        patterns = @(
            @{ regex = "helpersContainer\.style\.marginTop = '10px';"; replacement = "helpersContainer.classList.add('oom-helpers-container');" }
            @{ regex = "helpersContainer\.style\.display = 'flex';"; replacement = "" } # Will be in CSS
            @{ regex = "helpersContainer\.style\.gap = '10px';"; replacement = "" } # Will be in CSS
        )
        cssClass = ".oom-helpers-container"
        css = @"
margin-top: 10px;
display: flex;
gap: 10px;
"@
    }
    
    "DropdownContainer" = @{
        patterns = @(
            @{ regex = "sampleDropdownContainer\.style\.position = 'relative';"; replacement = "sampleDropdownContainer.classList.add('oom-sample-dropdown-container');" }
            @{ regex = "sampleDropdownContainer\.style\.display = 'inline-block';"; replacement = "" } # Will be in CSS
        )
        cssClass = ".oom-sample-dropdown-container"
        css = @"
position: relative;
display: inline-block;
"@
    }
    
    "DropdownButton" = @{
        patterns = @(
            @{ regex = "sampleDropdownBtn\.style\.padding = '6px 12px';"; replacement = "sampleDropdownBtn.classList.add('oom-sample-dropdown-btn');" }
            @{ regex = "sampleDropdownBtn\.style\.fontSize = '14px';"; replacement = "" } # Will be in CSS
        )
        cssClass = ".oom-sample-dropdown-btn"
        css = @"
padding: 6px 12px;
font-size: 14px;
"@
    }
    
    "DropdownMenu" = @{
        patterns = @(
            @{ regex = "sampleDropdownMenu\.style\.position = 'absolute';"; replacement = "sampleDropdownMenu.classList.add('oom-sample-dropdown-menu');" }
            @{ regex = "sampleDropdownMenu\.style\.top = '100%';"; replacement = "" }
            @{ regex = "sampleDropdownMenu\.style\.left = '0';"; replacement = "" }
            @{ regex = "sampleDropdownMenu\.style\.backgroundColor = 'var\(--background-primary\)';"; replacement = "" }
            @{ regex = "sampleDropdownMenu\.style\.border = '1px solid var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "sampleDropdownMenu\.style\.borderRadius = '4px';"; replacement = "" }
            @{ regex = "sampleDropdownMenu\.style\.boxShadow = '0 2px 8px rgba\(0,0,0,0\.15\)';"; replacement = "" }
            @{ regex = "sampleDropdownMenu\.style\.zIndex = '1000';"; replacement = "" }
            @{ regex = "sampleDropdownMenu\.style\.minWidth = '200px';"; replacement = "" }
        )
        cssClass = ".oom-sample-dropdown-menu"
        css = @"
position: absolute;
top: 100%;
left: 0;
background-color: var(--background-primary);
border: 1px solid var(--background-modifier-border);
border-radius: 4px;
box-shadow: 0 2px 8px rgba(0,0,0,0.15);
z-index: 1000;
min-width: 200px;
"@
    }
    
    "DropdownOption" = @{
        patterns = @(
            @{ regex = "flatOption\.style\.padding = '8px 12px';"; replacement = "flatOption.classList.add('oom-dropdown-option');" }
            @{ regex = "flatOption\.style\.cursor = 'pointer';"; replacement = "" }
            @{ regex = "flatOption\.style\.borderBottom = '1px solid var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "nestedOption\.style\.padding = '8px 12px';"; replacement = "nestedOption.classList.add('oom-dropdown-option');" }
            @{ regex = "nestedOption\.style\.cursor = 'pointer';"; replacement = "" }
        )
        cssClass = ".oom-dropdown-option"
        css = @"
padding: 8px 12px;
cursor: pointer;
border-bottom: 1px solid var(--background-modifier-border);
transition: background-color 0.15s ease;

&:hover {
    background-color: var(--background-modifier-hover);
}
"@
    }
    
    "DropdownHover" = @{
        patterns = @(
            @{ regex = "flatOption\.style\.backgroundColor = 'var\(--background-modifier-hover\)';"; replacement = "flatOption.classList.add('oom-dropdown-option--hover');" }
            @{ regex = "flatOption\.style\.backgroundColor = '';"; replacement = "flatOption.classList.remove('oom-dropdown-option--hover');" }
            @{ regex = "nestedOption\.style\.backgroundColor = 'var\(--background-modifier-hover\)';"; replacement = "nestedOption.classList.add('oom-dropdown-option--hover');" }
            @{ regex = "nestedOption\.style\.backgroundColor = '';"; replacement = "nestedOption.classList.remove('oom-dropdown-option--hover');" }
        )
        cssClass = ".oom-dropdown-option--hover"
        css = "background-color: var(--background-modifier-hover);"
    }
    
    "ClearButton" = @{
        patterns = @(
            @{ regex = "clearBtn\.style\.padding = '6px 12px';"; replacement = "clearBtn.classList.add('oom-clear-btn');" }
            @{ regex = "clearBtn\.style\.fontSize = '14px';"; replacement = "" }
        )
        cssClass = ".oom-clear-btn"
        css = @"
padding: 6px 12px;
font-size: 14px;
"@
    }
    
    "WizardStep" = @{
        patterns = @(
            @{ regex = "this\.wizardStepContainers\[step - 1\]\.style\.display = 'block';"; replacement = "this.wizardStepContainers[step - 1].classList.add('oom-wizard-step--visible');" }
        )
        cssClass = ".oom-wizard-step--visible"
        css = "display: block;"
    }
    
    "Explanation" = @{
        patterns = @(
            @{ regex = "explanation\.style\.marginTop = '1em';"; replacement = "explanation.classList.add('oom-explanation');" }
            @{ regex = "explanation\.style\.padding = '1em';"; replacement = "" }
            @{ regex = "explanation\.style\.backgroundColor = 'var\(--background-primary\)';"; replacement = "" }
            @{ regex = "explanation\.style\.borderRadius = '4px';"; replacement = "" }
            @{ regex = "explanation\.style\.fontSize = '14px';"; replacement = "" }
        )
        cssClass = ".oom-explanation"
        css = @"
margin-top: 1em;
padding: 1em;
background-color: var(--background-primary);
border-radius: 4px;
font-size: 14px;
"@
    }
    
    "InfoSection" = @{
        patterns = @(
            @{ regex = "infoSection\.style\.marginTop = '0\.5em';"; replacement = "infoSection.classList.add('oom-info-section');" }
            @{ regex = "infoSection\.style\.fontSize = '0\.9em';"; replacement = "" }
            @{ regex = "infoSection\.style\.color = 'var\(--text-muted\)';"; replacement = "" }
        )
        cssClass = ".oom-info-section"
        css = @"
margin-top: 0.5em;
font-size: 0.9em;
color: var(--text-muted);
"@
    }
    
    "FolderList" = @{
        patterns = @(
            @{ regex = "folderList\.style\.maxHeight = '300px';"; replacement = "folderList.classList.add('oom-folder-list');" }
            @{ regex = "folderList\.style\.overflowY = 'auto';"; replacement = "" }
            @{ regex = "folderList\.style\.border = '1px solid var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "folderList\.style\.borderRadius = '4px';"; replacement = "" }
            @{ regex = "folderList\.style\.margin = '1em 0';"; replacement = "" }
        )
        cssClass = ".oom-folder-list"
        css = @"
max-height: 300px;
overflow-y: auto;
border: 1px solid var(--background-modifier-border);
border-radius: 4px;
margin: 1em 0;
"@
    }
    
    "FolderItem" = @{
        patterns = @(
            @{ regex = "folderItem\.style\.padding = '0\.5em';"; replacement = "folderItem.classList.add('oom-folder-item');" }
            @{ regex = "folderItem\.style\.borderBottom = '1px solid var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "folderItem\.style\.cursor = 'pointer';"; replacement = "" }
        )
        cssClass = ".oom-folder-item"
        css = @"
padding: 0.5em;
border-bottom: 1px solid var(--background-modifier-border);
cursor: pointer;
transition: background-color 0.15s ease;

&:hover {
    background-color: var(--background-modifier-hover);
}
"@
    }
    
    "FolderItemHover" = @{
        patterns = @(
            @{ regex = "folderItem\.style\.backgroundColor = 'var\(--background-modifier-hover\)';"; replacement = "folderItem.classList.add('oom-folder-item--hover');" }
            @{ regex = "folderItem\.style\.backgroundColor = '';"; replacement = "folderItem.classList.remove('oom-folder-item--hover');" }
        )
        cssClass = ".oom-folder-item--hover"
        css = "background-color: var(--background-modifier-hover);"
    }
    
    "ButtonContainer" = @{
        patterns = @(
            @{ regex = "buttonContainer\.style\.textAlign = 'right';"; replacement = "buttonContainer.classList.add('oom-button-container--right');" }
            @{ regex = "buttonContainer\.style\.marginTop = '1em';"; replacement = "buttonContainer.classList.add('oom-button-container');" }
        )
        cssClasses = @(
            @{ class = ".oom-button-container"; css = "margin-top: 1em;" }
            @{ class = ".oom-button-container--right"; css = "text-align: right; margin-top: 1em;" }
        )
    }
    
    "SearchContainer" = @{
        patterns = @(
            @{ regex = "searchContainer\.style\.margin = '1em 0';"; replacement = "searchContainer.classList.add('oom-search-container');" }
        )
        cssClass = ".oom-search-container"
        css = "margin: 1em 0;"
    }
    
    "SearchInput" = @{
        patterns = @(
            @{ regex = "searchInput\.style\.width = '100%';"; replacement = "searchInput.classList.add('oom-search-input');" }
            @{ regex = "searchInput\.style\.padding = '0\.5em';"; replacement = "" }
            @{ regex = "searchInput\.style\.border = '1px solid var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "searchInput\.style\.borderRadius = '4px';"; replacement = "" }
        )
        cssClass = ".oom-search-input"
        css = @"
width: 100%;
padding: 0.5em;
border: 1px solid var(--background-modifier-border);
border-radius: 4px;
"@
    }
    
    "NoteList" = @{
        patterns = @(
            @{ regex = "noteList\.style\.maxHeight = '300px';"; replacement = "noteList.classList.add('oom-note-list');" }
            @{ regex = "noteList\.style\.overflowY = 'auto';"; replacement = "" }
            @{ regex = "noteList\.style\.border = '1px solid var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "noteList\.style\.borderRadius = '4px';"; replacement = "" }
            @{ regex = "noteList\.style\.margin = '1em 0';"; replacement = "" }
        )
        cssClass = ".oom-note-list"
        css = @"
max-height: 300px;
overflow-y: auto;
border: 1px solid var(--background-modifier-border);
border-radius: 4px;
margin: 1em 0;
"@
    }
    
    "NoteItem" = @{
        patterns = @(
            @{ regex = "noteItem\.style\.padding = '0\.5em';"; replacement = "noteItem.classList.add('oom-note-item');" }
            @{ regex = "noteItem\.style\.borderBottom = '1px solid var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "noteItem\.style\.cursor = 'pointer';"; replacement = "" }
        )
        cssClass = ".oom-note-item"
        css = @"
padding: 0.5em;
border-bottom: 1px solid var(--background-modifier-border);
cursor: pointer;
transition: background-color 0.15s ease;

&:hover {
    background-color: var(--background-modifier-hover);
}
"@
    }
    
    "PathElement" = @{
        patterns = @(
            @{ regex = "pathEl\.style\.fontSize = '0\.8em';"; replacement = "pathEl.classList.add('oom-path-element');" }
            @{ regex = "pathEl\.style\.color = 'var\(--text-muted\)';"; replacement = "" }
        )
        cssClass = ".oom-path-element"
        css = @"
font-size: 0.8em;
color: var(--text-muted);
"@
    }
    
    "NoteItemHover" = @{
        patterns = @(
            @{ regex = "noteItem\.style\.backgroundColor = 'var\(--background-modifier-hover\)';"; replacement = "noteItem.classList.add('oom-note-item--hover');" }
            @{ regex = "noteItem\.style\.backgroundColor = '';"; replacement = "noteItem.classList.remove('oom-note-item--hover');" }
        )
        cssClass = ".oom-note-item--hover"
        css = "background-color: var(--background-modifier-hover);"
    }
    
    "MoreItem" = @{
        patterns = @(
            @{ regex = "moreItem\.style\.padding = '0\.5em';"; replacement = "moreItem.classList.add('oom-more-item');" }
            @{ regex = "moreItem\.style\.textAlign = 'center';"; replacement = "" }
            @{ regex = "moreItem\.style\.color = 'var\(--text-muted\)';"; replacement = "" }
        )
        cssClass = ".oom-more-item"
        css = @"
padding: 0.5em;
text-align: center;
color: var(--text-muted);
"@
    }
    
    "ProgressContainer" = @{
        patterns = @(
            @{ regex = "progressContainer\.style\.marginTop = '2em';"; replacement = "progressContainer.classList.add('oom-progress-container');" }
            @{ regex = "progressContainer\.style\.padding = '2em';"; replacement = "" }
            @{ regex = "progressContainer\.style\.border = '2px solid var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "progressContainer\.style\.borderRadius = '8px';"; replacement = "" }
        )
        cssClass = ".oom-progress-container"
        css = @"
margin-top: 2em;
padding: 2em;
border: 2px solid var(--background-modifier-border);
border-radius: 8px;
"@
    }
    
    "ProgressTitle" = @{
        patterns = @(
            @{ regex = "progressTitle\.style\.marginBottom = '1em';"; replacement = "progressTitle.classList.add('oom-progress-title');" }
        )
        cssClass = ".oom-progress-title"
        css = "margin-bottom: 1em;"
    }
    
    "ProgressBar" = @{
        patterns = @(
            @{ regex = "progressBar\.style\.width = '100%';"; replacement = "progressBar.classList.add('oom-progress-bar');" }
            @{ regex = "progressBar\.style\.height = '20px';"; replacement = "" }
            @{ regex = "progressBar\.style\.backgroundColor = 'var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "progressBar\.style\.borderRadius = '10px';"; replacement = "" }
            @{ regex = "progressBar\.style\.overflow = 'hidden';"; replacement = "" }
        )
        cssClass = ".oom-progress-bar"
        css = @"
width: 100%;
height: 20px;
background-color: var(--background-modifier-border);
border-radius: 10px;
overflow: hidden;
"@
    }
    
    "ProgressFill" = @{
        patterns = @(
            @{ regex = "progressFill\.style\.height = '100%';"; replacement = "progressFill.classList.add('oom-progress-fill');" }
            @{ regex = "progressFill\.style\.backgroundColor = 'var\(--interactive-accent\)';"; replacement = "" }
            @{ regex = "progressFill\.style\.width = '0%';"; replacement = "" }
            @{ regex = "progressFill\.style\.transition = 'width 0\.3s ease';"; replacement = "" }
            @{ regex = "progressFill\.style\.width = '100%';"; replacement = "progressFill.classList.add('oom-progress-fill--complete');" }
        )
        cssClasses = @(
            @{ class = ".oom-progress-fill"; css = @"
height: 100%;
background-color: var(--interactive-accent);
width: 0%;
transition: width 0.3s ease;
"@ }
            @{ class = ".oom-progress-fill--complete"; css = "width: 100%;" }
        )
    }
    
    "StatusText" = @{
        patterns = @(
            @{ regex = "statusText\.style\.marginTop = '1em';"; replacement = "statusText.classList.add('oom-status-text');" }
            @{ regex = "statusText\.style\.textAlign = 'center';"; replacement = "" }
        )
        cssClass = ".oom-status-text"
        css = @"
margin-top: 1em;
text-align: center;
"@
    }
    
    "ComplexitySection" = @{
        patterns = @(
            @{ regex = "complexitySection\.style\.marginBottom = '1\.5em';"; replacement = "complexitySection.classList.add('oom-complexity-section');" }
            @{ regex = "complexitySection\.style\.padding = '1em';"; replacement = "" }
            @{ regex = "complexitySection\.style\.background = 'var\(--background-secondary\)';"; replacement = "" }
            @{ regex = "complexitySection\.style\.borderRadius = '5px';"; replacement = "" }
        )
        cssClass = ".oom-complexity-section"
        css = @"
margin-bottom: 1.5em;
padding: 1em;
background: var(--background-secondary);
border-radius: 5px;
"@
    }
    
    "FileContainer" = @{
        patterns = @(
            @{ regex = "fileContainer\.style\.marginBottom = '1\.5em';"; replacement = "fileContainer.classList.add('oom-file-container');" }
            @{ regex = "fileContainer\.style\.border = '1px solid var\(--background-modifier-border\)';"; replacement = "" }
            @{ regex = "fileContainer\.style\.borderRadius = '5px';"; replacement = "" }
        )
        cssClass = ".oom-file-container"
        css = @"
margin-bottom: 1.5em;
border: 1px solid var(--background-modifier-border);
border-radius: 5px;
"@
    }
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $prefix = switch ($Level) {
        "ERROR" { "[!]" }
        "SUCCESS" { "[+]" }
        "INFO" { "[*]" }
        default { "[*]" }
    }
    Write-Host "$prefix $Message" -ForegroundColor $(
        switch ($Level) {
            "ERROR" { "Red" }
            "SUCCESS" { "Green" }
            "INFO" { "Cyan" }
            default { "White" }
        }
    )
}

function Add-CssToHubFile {
    param([hashtable]$PatternGroups)
    
    Write-Log "Adding CSS classes to $hubCssFile..." "INFO"
    
    $cssContent = @"

/* =============================================================================
   HUBMODAL COMPREHENSIVE COMPONENT STYLES 
   Generated by fix-hubmodal-comprehensive.ps1
   ============================================================================= */

"@
    
    foreach ($groupName in $PatternGroups.Keys) {
        $group = $PatternGroups[$groupName]
        $cssContent += "`n/* $groupName */`n"
        
        if ($group.cssClass -and $group.css) {
            $cssContent += "$($group.cssClass) {`n$($group.css)`n}`n"
        }
        
        if ($group.cssClasses) {
            foreach ($cssItem in $group.cssClasses) {
                $cssContent += "$($cssItem.class) {`n$($cssItem.css)`n}`n"
            }
        }
    }
    
    $cssContent += "`n/* ============================================================================= */"
    
    if (-not $WhatIf) {
        Add-Content -Path $hubCssFile -Value $cssContent -Encoding UTF8
        Write-Log "CSS classes added to $hubCssFile" "SUCCESS"
    } else {
        Write-Log "WHAT-IF: Would add CSS classes to $hubCssFile" "INFO"
    }
}

function Process-PatternGroup {
    param(
        [string]$GroupName,
        [hashtable]$Group,
        [string]$Content
    )
    
    $changeCount = 0
    $updatedContent = $Content
    
    Write-Log "Processing: $GroupName..." "INFO"
    
    foreach ($pattern in $Group.patterns) {
        if ($pattern.replacement -and $pattern.replacement -ne "") {
            $matches = [regex]::Matches($updatedContent, $pattern.regex)
            if ($matches.Count -gt 0) {
                $updatedContent = $updatedContent -replace $pattern.regex, $pattern.replacement
                $changeCount += $matches.Count
                Write-Log "  Replaced $($matches.Count) occurrence(s) of pattern" "SUCCESS"
            }
        } else {
            # Just count occurrences for patterns that will be handled by CSS
            $matches = [regex]::Matches($updatedContent, $pattern.regex)
            if ($matches.Count -gt 0) {
                $updatedContent = $updatedContent -replace $pattern.regex, ""
                $changeCount += $matches.Count
                Write-Log "  Removed $($matches.Count) occurrence(s) of redundant style" "SUCCESS"
            }
        }
    }
    
    if ($changeCount -eq 0) {
        Write-Log "  No patterns found in $GroupName" "ERROR"
    }
    
    return @{
        Content = $updatedContent
        ChangeCount = $changeCount
    }
}

function Main {
    Write-Log "Phase 7I: HubModal.ts Comprehensive Inline Style Cleanup" "INFO"
    Write-Log "==========================================================" "INFO"
    
    # Verify source file exists
    if (-not (Test-Path $sourceFile)) {
        Write-Log "Source file not found: $sourceFile" "ERROR"
        exit 1
    }
    
    # Create backup
    Write-Log "Creating backup: $backupFile" "INFO"
    if (-not $WhatIf) {
        Copy-Item $sourceFile $backupFile
    }
    
    # Read source content
    $content = Get-Content $sourceFile -Raw -Encoding UTF8
    $originalContent = $content
    $totalChanges = 0
    
    # Add CSS classes to hub.css first
    Add-CssToHubFile -PatternGroups $patternGroups
    
    # Process each pattern group
    foreach ($groupName in $patternGroups.Keys) {
        $result = Process-PatternGroup -GroupName $groupName -Group $patternGroups[$groupName] -Content $content
        $content = $result.Content
        $totalChanges += $result.ChangeCount
    }
    
    # Apply changes or show what-if
    if ($WhatIf) {
        Write-Log "WHAT-IF MODE: Would make $totalChanges changes" "INFO"
        Write-Log "Backup created: $backupFile" "INFO"
        Write-Log "No actual changes made to source file" "ERROR"
    } else {
        if ($totalChanges -gt 0) {
            Set-Content -Path $sourceFile -Value $content -Encoding UTF8
            Write-Log "Successfully applied $totalChanges changes to $sourceFile" "SUCCESS"
            Write-Log "Backup available: $backupFile" "INFO"
            
            # Verify file is still valid TypeScript
            if ($content.Length -gt 0 -and $content -match "export.*class.*HubModal") {
                Write-Log "File verification passed" "SUCCESS"
            } else {
                Write-Log "File verification failed - restoring backup" "ERROR"
                Copy-Item $backupFile $sourceFile
                exit 1
            }
        } else {
            Write-Log "No changes were needed" "INFO"
        }
    }
    
    # Summary
    Write-Log "`n[*] PHASE 7I SUMMARY" "INFO"
    Write-Log "===================" "INFO"
    Write-Log "Target File: $sourceFile" "INFO"
    Write-Log "Changes Made: $totalChanges" "INFO"
    Write-Log "Backup Created: $backupFile" "INFO"
    Write-Log "`nCSS Classes Added to $hubCssFile" "INFO"
    
    $groupNames = $patternGroups.Keys | Sort-Object
    foreach ($groupName in $groupNames) {
        $group = $patternGroups[$groupName]
        if ($group.cssClass) {
            Write-Log "- $($group.cssClass)" "INFO"
        }
        if ($group.cssClasses) {
            foreach ($cssItem in $group.cssClasses) {
                Write-Log "- $($cssItem.class)" "INFO"
            }
        }
    }
    
    Write-Log "`n[+] Phase 7I HubModal.ts comprehensive cleanup complete!" "SUCCESS"
}

# Run the script
Main 