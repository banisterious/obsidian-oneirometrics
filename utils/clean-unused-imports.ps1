# Clean Unused Imports Script
# This script reads the output from find-unused-imports.ps1 and generates
# code cleanup instructions for each file

# Usage:
# .\utils\clean-unused-imports.ps1 -outputMode [summary|patch|edit]
# Where:
#   summary - Output a summary of changes to make (default)
#   patch - Output patch-style diff for each file
#   edit - Actually modify the files (use with caution)

param (
    [string]$outputMode = "summary", # "summary", "patch", or "edit"
    [string]$targetFile = $null      # Optional specific file to process
)

# Function to read a file's content
function Get-FileContent {
    param (
        [string]$filePath
    )
    
    if (Test-Path $filePath) {
        return Get-Content $filePath -Raw
    } else {
        Write-Error "File not found: $filePath"
        return $null
    }
}

# Function to write updated content to a file
function Set-FileContent {
    param (
        [string]$filePath,
        [string]$content
    )
    
    if ($outputMode -eq "edit") {
        $content | Out-File -FilePath $filePath -Encoding utf8
        Write-Host "Updated: $filePath" -ForegroundColor Green
    } else {
        Write-Host "Would update: $filePath" -ForegroundColor Yellow
    }
}

# Function to process a single file's imports
function Process-File {
    param (
        [string]$filePath,
        [string[]]$unusedImports
    )
    
    Write-Host "Processing: $filePath" -ForegroundColor Cyan
    
    $content = Get-FileContent $filePath
    if ($null -eq $content) {
        return
    }
    
    $original = $content
    $lines = $content -split "`n"
    $updated = @()
    $i = 0
    $inImport = $false
    $importBuffer = @()
    $skipImport = $false
    $updatedContent = $false
    
    # Process file line by line
    while ($i -lt $lines.Length) {
        $line = $lines[$i]
        $i++
        
        # Check if line starts an import statement
        if ($line -match "^\s*import\s+.*\s+from\s+.*") {
            # Check for unused imports
            $importToSkip = $false
            foreach ($unusedImport in $unusedImports) {
                if ($unusedImport -match "^\s*Symbol:\s+(.+?)\s+from\s+'(.+?)'") {
                    $symbolName = $Matches[1]
                    $sourcePath = $Matches[2]
                    
                    # Check if this is a direct import of the unused symbol
                    if ($line -match "import\s+\{\s*$symbolName\s*\}\s+from\s+['`"]$sourcePath['`"]") {
                        $importToSkip = $true
                        $updatedContent = $true
                        Write-Host "  Removed entire import: $symbolName from $sourcePath" -ForegroundColor Yellow
                        break
                    }
                    
                    # Check if this is part of a multi-import statement
                    if ($line -match "import\s+\{.*$symbolName.*\}\s+from\s+['`"]$sourcePath['`"]") {
                        # Replace just the specific symbol
                        $line = $line -replace "\{\s*$symbolName\s*,\s*", "{ "
                        $line = $line -replace "\{\s*,\s*$symbolName\s*", "{ "
                        $line = $line -replace ",\s*$symbolName\s*\}", " }"
                        $line = $line -replace "\{\s*$symbolName\s*\}", "{ }"
                        $line = $line -replace "\s*$symbolName\s*,", ""
                        $line = $line -replace ",\s*$symbolName\s*", ""
                        
                        # Cleanup empty braces
                        $line = $line -replace "import\s+\{\s*\}\s+from", "// REMOVED: import { $symbolName } from"
                        
                        $updatedContent = $true
                        Write-Host "  Removed symbol: $symbolName from import" -ForegroundColor Yellow
                    }
                }
            }
            
            if (!$importToSkip) {
                $updated += $line
            }
            
            # If this is a multi-line import, start capturing it
            if ($line -match "{\s*$" -and !($line -match "}.*from")) {
                $inImport = $true
                $importBuffer = @($line)
                $skipImport = $importToSkip
            }
        }
        # If we're in a multi-line import
        elseif ($inImport) {
            $importBuffer += $line
            
            # Check if this line ends the import
            if ($line -match "}.*from") {
                $inImport = $false
                $fullImport = $importBuffer -join "`n"
                
                # Process the full import statement for unused imports
                $modifiedImport = $fullImport
                foreach ($unusedImport in $unusedImports) {
                    if ($unusedImport -match "^\s*Symbol:\s+(.+?)\s+from\s+'(.+?)'") {
                        $symbolName = $Matches[1]
                        $sourcePath = $Matches[2]
                        
                        # Check if this import is from the correct source
                        if ($fullImport -match "from\s+['`"]$sourcePath['`"]") {
                            # Remove the symbol from the import list
                            $modifiedImport = $modifiedImport -replace "\s*$symbolName\s*,", ""
                            $modifiedImport = $modifiedImport -replace ",\s*$symbolName\s*", ""
                            $modifiedImport = $modifiedImport -replace "\s*$symbolName\s*", ""
                            
                            Write-Host "  Removed: $symbolName from multi-line import" -ForegroundColor Yellow
                            $updatedContent = $true
                        }
                    }
                }
                
                # Add the modified import if it wasn't completely removed
                if (!$skipImport) {
                    if ($modifiedImport -ne $fullImport) {
                        # Clean up empty or malformed imports
                        if ($modifiedImport -match "import\s+\{\s*\}\s+from") {
                            # Skip this import as it's now empty
                        } else {
                            $updated += $modifiedImport
                        }
                    } else {
                        $updated += $importBuffer
                    }
                }
                
                $importBuffer = @()
            }
        }
        # Regular line, not part of an import
        else {
            $updated += $line
        }
    }
    
    # Check if we made any changes
    if ($updatedContent) {
        $newContent = $updated -join "`n"
        
        # Clean up any blank lines created by removing imports
        $newContent = $newContent -replace "`n`n`n+", "`n`n"
        
        # Show diff if requested
        if ($outputMode -eq "patch") {
            Write-Host "Diff for $filePath:" -ForegroundColor Magenta
            $originalLines = $original -split "`n"
            $updatedLines = $newContent -split "`n"
            
            for ($i = 0; $i -lt [Math]::Max($originalLines.Count, $updatedLines.Count); $i++) {
                if ($i -ge $originalLines.Count) {
                    Write-Host "+ $($updatedLines[$i])" -ForegroundColor Green
                } elseif ($i -ge $updatedLines.Count) {
                    Write-Host "- $($originalLines[$i])" -ForegroundColor Red
                } elseif ($originalLines[$i] -ne $updatedLines[$i]) {
                    Write-Host "- $($originalLines[$i])" -ForegroundColor Red
                    Write-Host "+ $($updatedLines[$i])" -ForegroundColor Green
                }
            }
            Write-Host ""
        }
        
        # Write the updated content back to the file
        Set-FileContent -filePath $filePath -content $newContent
    } else {
        Write-Host "  No changes needed" -ForegroundColor Green
    }
}

# Main execution
Write-Host "Running find-unused-imports.ps1 to get the latest list of unused imports..." -ForegroundColor Cyan
$importScanResults = & "$PSScriptRoot\find-unused-imports.ps1" | Out-String

# Process the results to extract file paths and unused imports
$currentFile = $null
$unusedImports = @()
$filesToProcess = @{}

$importScanResults -split "`n" | ForEach-Object {
    $line = $_
    
    # Check for file headers
    if ($line -match "^File: (.+)$") {
        # Process the previous file before moving to the next one
        if ($currentFile -and $unusedImports.Count -gt 0) {
            $filesToProcess[$currentFile] = $unusedImports
        }
        
        $currentFile = $Matches[1]
        $unusedImports = @()
    } 
    # Check for unused import symbols
    elseif ($line -match "^\s*- Symbol: (.+)$") {
        $unusedImports += $line.Trim()
    }
}

# Process the last file
if ($currentFile -and $unusedImports.Count -gt 0) {
    $filesToProcess[$currentFile] = $unusedImports
}

# Output summary
Write-Host "`nFound $($filesToProcess.Count) files with unused imports to process" -ForegroundColor Cyan

# Process a specific file if requested
if ($targetFile) {
    if ($filesToProcess.ContainsKey($targetFile)) {
        Process-File -filePath $targetFile -unusedImports $filesToProcess[$targetFile]
    } else {
        Write-Host "Target file not found in the list of files with unused imports: $targetFile" -ForegroundColor Red
    }
} else {
    # Process all files
    foreach ($file in $filesToProcess.Keys) {
        Process-File -filePath $file -unusedImports $filesToProcess[$file]
    }
}

Write-Host "`nCompleted processing unused imports." -ForegroundColor Cyan
if ($outputMode -ne "edit") {
    Write-Host "No files were modified. Run with -outputMode edit to apply changes." -ForegroundColor Yellow
} 