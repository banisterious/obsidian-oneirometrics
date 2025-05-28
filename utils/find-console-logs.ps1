$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Script to find console.log statements in TypeScript files
Write-Host "Scanning for console.log statements in TypeScript files..."

# Get all TypeScript files
$tsFiles = Get-ChildItem -Path . -Include "*.ts" -Recurse -Exclude "node_modules", "dist", "*.d.ts" | Select-Object -ExpandProperty FullName

$results = @()

foreach ($file in $tsFiles) {
    $relativePath = $file.Replace((Get-Location).Path + "\", "")
    $lines = Get-Content $file
    
    # Find console.log statements
    $lineNumber = 0
    foreach ($line in $lines) {
        $lineNumber++
        if ($line -match "console\.log\(") {
            $results += [PSCustomObject]@{
                File = $relativePath
                Line = $lineNumber
                Content = $line.Trim()
                Type = "console.log"
            }
        }
        # Also find console.warn, console.error, console.debug, and console.info
        elseif ($line -match "console\.warn\(") {
            $results += [PSCustomObject]@{
                File = $relativePath
                Line = $lineNumber
                Content = $line.Trim()
                Type = "console.warn"
            }
        }
        elseif ($line -match "console\.error\(") {
            $results += [PSCustomObject]@{
                File = $relativePath
                Line = $lineNumber
                Content = $line.Trim()
                Type = "console.error"
            }
        }
        elseif ($line -match "console\.debug\(") {
            $results += [PSCustomObject]@{
                File = $relativePath
                Line = $lineNumber
                Content = $line.Trim()
                Type = "console.debug"
            }
        }
        elseif ($line -match "console\.info\(") {
            $results += [PSCustomObject]@{
                File = $relativePath
                Line = $lineNumber
                Content = $line.Trim()
                Type = "console.info"
            }
        }
    }
}

# Output results
Write-Host "`nConsole Statement Report:`n"
Write-Host ("=" * 80)

$groupedResults = $results | Group-Object -Property File

foreach ($group in $groupedResults) {
    Write-Host "`nFile: $($group.Name)"
    Write-Host ("-" * 80)
    
    foreach ($item in $group.Group) {
        Write-Host "Line $($item.Line): $($item.Type)"
        Write-Host "  $($item.Content)"
    }
}

# Create a mapping of suggested replacements for logging
Write-Host "`n`nSuggested Replacements:"
Write-Host ("=" * 80)
Write-Host "console.log() → logger.debug('Category', 'Message', context)"
Write-Host "console.warn() → logger.warn('Category', 'Message', context)"
Write-Host "console.error() → logger.error('Category', 'Message', error, context)"
Write-Host "console.debug() → logger.debug('Category', 'Message', context)"
Write-Host "console.info() → logger.info('Category', 'Message', context)"

# Summary
Write-Host "`n`nSummary:"
Write-Host ("=" * 80)
Write-Host "Total TypeScript files scanned: $($tsFiles.Count)"
Write-Host "Files with console statements: $($groupedResults.Count)"
Write-Host "Total console statements found: $($results.Count)"
Write-Host "By type:"
$byType = $results | Group-Object -Property Type
foreach ($type in $byType) {
    Write-Host "  $($type.Name): $($type.Count)"
}

Write-Host "`nRecommended Categories based on your code:"
Write-Host "  'Scrape' - For data collection processes"
Write-Host "  'Metrics' - For metrics calculations"
Write-Host "  'MetricsNote' - For metrics note updates"
Write-Host "  'Backup' - For backup operations"
Write-Host "  'Settings' - For settings operations"
Write-Host "  'UI' - For user interface operations"
Write-Host "  'Plugin' - For plugin lifecycle events"
Write-Host "  'Filter' - For filtering operations"
Write-Host "  'Table' - For table generation and processing"
Write-Host "  'Debug' - For general diagnostic information" 