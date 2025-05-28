$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Script to find commented-out code in TypeScript files
Write-Host "Scanning for commented-out code in TypeScript files..."

# Get all TypeScript files
$tsFiles = Get-ChildItem -Path . -Include "*.ts" -Recurse -Exclude "node_modules", "dist", "*.d.ts" | Select-Object -ExpandProperty FullName

$results = @()
$commentBlocks = @()
$inCommentBlock = $false
$currentCommentBlock = @()
$currentFile = ""

foreach ($file in $tsFiles) {
    $relativePath = $file.Replace((Get-Location).Path + "\", "")
    $lines = Get-Content $file
    
    # Reset for new file
    $inCommentBlock = $false
    $currentCommentBlock = @()
    $currentFile = $relativePath
    $lineNumber = 0
    
    foreach ($line in $lines) {
        $lineNumber++
        $trimmedLine = $line.Trim()
        
        # Check for single-line commented code (not just documentation)
        if ($trimmedLine -match "^\s*//.*[;{}()\[\]=><]") {
            # Looks like commented code, not just a comment
            if ($trimmedLine -notmatch "^\s*//\s*(TODO|FIXME|NOTE|XXX|HACK|BUG):" -and 
                $trimmedLine.Length -gt 10) {  # Avoid short comments
                $results += [PSCustomObject]@{
                    File = $relativePath
                    Line = $lineNumber
                    Content = $trimmedLine
                    Type = "Single-line comment"
                }
            }
        }
        
        # Check for start of multi-line comment block
        if ($trimmedLine -match "^\s*/\*" -and -not $inCommentBlock) {
            $inCommentBlock = $true
            $currentCommentBlock = @([PSCustomObject]@{
                StartLine = $lineNumber
                Lines = @($trimmedLine)
                File = $currentFile
            })
            continue
        }
        
        # Add line to current comment block
        if ($inCommentBlock) {
            $currentCommentBlock[0].Lines += $trimmedLine
            
            # Check for end of comment block
            if ($trimmedLine -match "\*/\s*$") {
                $inCommentBlock = $false
                
                # Check if this looks like commented-out code and not documentation
                $commentText = $currentCommentBlock[0].Lines -join " "
                if ($commentText -match "[;{}()\[\]=><]" -and 
                    $commentText -notmatch "@param|@returns|@description|@example|@since" -and
                    $currentCommentBlock[0].Lines.Count -gt 1) {
                    $commentBlocks += [PSCustomObject]@{
                        File = $currentFile
                        StartLine = $currentCommentBlock[0].StartLine
                        EndLine = $lineNumber
                        Lines = $currentCommentBlock[0].Lines
                        Type = "Multi-line comment block"
                    }
                }
                
                $currentCommentBlock = @()
            }
        }
    }
}

# Output results for single-line comments
Write-Host "`nSingle-Line Commented Code Report:`n"
Write-Host ("=" * 80)

$groupedResults = $results | Group-Object -Property File

foreach ($group in $groupedResults) {
    Write-Host "`nFile: $($group.Name)"
    Write-Host ("-" * 80)
    
    foreach ($item in $group.Group) {
        Write-Host "Line $($item.Line): $($item.Content)"
    }
}

# Output results for multi-line comment blocks
Write-Host "`n`nMulti-Line Commented Code Blocks Report:`n"
Write-Host ("=" * 80)

$groupedBlocks = $commentBlocks | Group-Object -Property File

foreach ($group in $groupedBlocks) {
    Write-Host "`nFile: $($group.Name)"
    Write-Host ("-" * 80)
    
    foreach ($block in $group.Group) {
        Write-Host "Lines $($block.StartLine)-$($block.EndLine):"
        foreach ($line in $block.Lines) {
            Write-Host "  $line"
        }
        Write-Host ""
    }
}

# Summary
Write-Host "`n`nSummary:"
Write-Host ("=" * 80)
Write-Host "Total TypeScript files scanned: $($tsFiles.Count)"
Write-Host "Files with single-line commented code: $($groupedResults.Count)"
Write-Host "Total single-line commented code instances: $($results.Count)"
Write-Host "Files with multi-line commented code blocks: $($groupedBlocks.Count)"
Write-Host "Total multi-line commented code blocks: $($commentBlocks.Count)"

Write-Host "`nNote: This is a heuristic analysis and may contain false positives."
Write-Host "Please verify each case before removing commented code."
Write-Host "Remember that version control already keeps history, so commented code can often be safely removed." 