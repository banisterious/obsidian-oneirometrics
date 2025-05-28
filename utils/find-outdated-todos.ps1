$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Script to find outdated TODOs in TypeScript files
Write-Host "Scanning for TODO comments in TypeScript files..."

# Get all TypeScript files
$tsFiles = Get-ChildItem -Path . -Include "*.ts" -Recurse -Exclude "node_modules", "dist", "*.d.ts" | Select-Object -ExpandProperty FullName

$results = @()

foreach ($file in $tsFiles) {
    $relativePath = $file.Replace((Get-Location).Path + "\", "")
    $lines = Get-Content $file
    
    $lineNumber = 0
    foreach ($line in $lines) {
        $lineNumber++
        $trimmedLine = $line.Trim()
        
        # Check for TODO/FIXME comments
        if ($trimmedLine -match "(?://|/\*)\s*(TODO|FIXME|XXX|HACK)(?:\([^)]+\))?:?\s*(.+?)(?:\*/)?$") {
            $todoType = $matches[1]
            $todoText = $matches[2].Trim()
            
            # Try to extract date if present
            $dateMatch = $todoText -match "\b(202[0-5])[-/]?([0-1]?[0-9])[-/]?([0-3]?[0-9])\b"
            $hasDate = $dateMatch
            $dateStr = if ($hasDate) { "$($matches[1])-$($matches[2].PadLeft(2, '0'))-$($matches[3].PadLeft(2, '0'))" } else { "No date" }
            
            # Check if TODO is outdated (older than current date)
            $isOutdated = $false
            if ($hasDate) {
                try {
                    $todoDate = [DateTime]::ParseExact($dateStr, "yyyy-MM-dd", $null)
                    $currentDate = Get-Date
                    $isOutdated = $todoDate -lt $currentDate
                }
                catch {
                    # Invalid date format, can't determine if outdated
                    $isOutdated = $false
                }
            }
            
            # Check for completed TODOs (has "DONE" or "COMPLETED" in the comment)
            $isCompleted = $todoText -match "\b(DONE|COMPLETED|FIXED|RESOLVED)\b"
            
            $results += [PSCustomObject]@{
                File = $relativePath
                Line = $lineNumber
                Type = $todoType
                Text = $todoText
                Date = $dateStr
                HasDate = $hasDate
                IsOutdated = $isOutdated
                IsCompleted = $isCompleted
                Content = $trimmedLine
            }
        }
    }
}

# Output results
Write-Host "`nTODO Comment Report:`n"
Write-Host ("=" * 80)

# Group by different categories
$outdatedTodos = $results | Where-Object { $_.IsOutdated -eq $true }
$completedTodos = $results | Where-Object { $_.IsCompleted -eq $true }
$noDateTodos = $results | Where-Object { $_.HasDate -eq $false }
$currentTodos = $results | Where-Object { $_.IsOutdated -eq $false -and $_.IsCompleted -eq $false -and $_.HasDate -eq $true }

# 1. Outdated TODOs (with dates in the past)
if ($outdatedTodos.Count -gt 0) {
    Write-Host "`n== OUTDATED TODOs (Past Due Date) =="
    Write-Host ("-" * 80)
    
    $groupedOutdated = $outdatedTodos | Group-Object -Property File
    
    foreach ($group in $groupedOutdated) {
        Write-Host "`nFile: $($group.Name)"
        
        foreach ($item in $group.Group) {
            Write-Host "Line $($item.Line): [$($item.Date)] $($item.Type): $($item.Text)"
        }
    }
}

# 2. Completed TODOs
if ($completedTodos.Count -gt 0) {
    Write-Host "`n`n== COMPLETED TODOs (Can Be Removed) =="
    Write-Host ("-" * 80)
    
    $groupedCompleted = $completedTodos | Group-Object -Property File
    
    foreach ($group in $groupedCompleted) {
        Write-Host "`nFile: $($group.Name)"
        
        foreach ($item in $group.Group) {
            Write-Host "Line $($item.Line): $($item.Type): $($item.Text)"
        }
    }
}

# 3. TODOs without dates
if ($noDateTodos.Count -gt 0) {
    Write-Host "`n`n== TODOs WITHOUT DATES =="
    Write-Host ("-" * 80)
    
    $groupedNoDate = $noDateTodos | Group-Object -Property File
    
    foreach ($group in $groupedNoDate) {
        Write-Host "`nFile: $($group.Name)"
        
        foreach ($item in $group.Group) {
            Write-Host "Line $($item.Line): $($item.Type): $($item.Text)"
        }
    }
}

# 4. Current TODOs (with future dates)
if ($currentTodos.Count -gt 0) {
    Write-Host "`n`n== CURRENT TODOs (Future Dates) =="
    Write-Host ("-" * 80)
    
    $groupedCurrent = $currentTodos | Group-Object -Property File
    
    foreach ($group in $groupedCurrent) {
        Write-Host "`nFile: $($group.Name)"
        
        foreach ($item in $group.Group) {
            Write-Host "Line $($item.Line): [$($item.Date)] $($item.Type): $($item.Text)"
        }
    }
}

# Summary
Write-Host "`n`nSummary:"
Write-Host ("=" * 80)
Write-Host "Total TypeScript files scanned: $($tsFiles.Count)"
Write-Host "Total TODOs found: $($results.Count)"
Write-Host "Outdated TODOs (past due date): $($outdatedTodos.Count)"
Write-Host "Completed TODOs (can be removed): $($completedTodos.Count)"
Write-Host "TODOs without dates: $($noDateTodos.Count)"
Write-Host "Current TODOs (future dates): $($currentTodos.Count)"

Write-Host "`nRecommendations:"
Write-Host "1. Remove all COMPLETED TODOs"
Write-Host "2. Review OUTDATED TODOs to either update the date or implement the fix"
Write-Host "3. Consider adding dates to TODOs WITHOUT DATES for better tracking" 