$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Script to find potentially unused imports in TypeScript files
Write-Host "Scanning for unused imports in TypeScript files..."

# Get all TypeScript files
$tsFiles = Get-ChildItem -Path . -Include "*.ts" -Recurse -Exclude "node_modules", "dist", "*.d.ts" | Select-Object -ExpandProperty FullName

$results = @()

foreach ($file in $tsFiles) {
    $relativePath = $file.Replace((Get-Location).Path + "\", "")
    $content = Get-Content $file -Raw
    $lines = Get-Content $file

    # Find import statements
    $importLines = $lines | Select-String -Pattern "^\s*import\s+(?:{([^}]+)}|([^\s{]+))\s+from\s+'([^']+)';" -AllMatches

    foreach ($importLine in $importLines) {
        $lineNumber = $importLine.LineNumber
        $importText = $importLine.Line.Trim()
        
        # Extract imported symbols or default import
        if ($importLine.Matches[0].Groups[1].Success) {
            # Named imports like: import { Symbol1, Symbol2 } from 'module';
            $importedSymbols = $importLine.Matches[0].Groups[1].Value -split ',\s*' | ForEach-Object { $_.Trim() }
            $fromModule = $importLine.Matches[0].Groups[3].Value
            
            foreach ($symbol in $importedSymbols) {
                # Skip type-only imports or 'as' aliases for now
                if ($symbol -match "^\s*type\s+" -or $symbol -match "\s+as\s+") {
                    continue
                }

                # Extract actual symbol name (handling 'as' aliases)
                if ($symbol -match "(.+?)\s+as\s+(.+)") {
                    $symbol = $matches[1].Trim()
                }

                # Check if the symbol is used elsewhere in the file
                $escapedSymbol = [regex]::Escape($symbol)
                $usagePattern = "(?<!\w)$escapedSymbol(?!\w)"
                $contentWithoutImport = $content -replace $importText, ""
                
                if (-not ([regex]::Match($contentWithoutImport, $usagePattern)).Success) {
                    $results += [PSCustomObject]@{
                        File = $relativePath
                        Line = $lineNumber
                        Import = $importText
                        Symbol = $symbol
                        Module = $fromModule
                        Status = "Potentially unused"
                    }
                }
            }
        } elseif ($importLine.Matches[0].Groups[2].Success) {
            # Default import like: import DefaultExport from 'module';
            $defaultImport = $importLine.Matches[0].Groups[2].Value.Trim()
            $fromModule = $importLine.Matches[0].Groups[3].Value
            
            # Check if the default import is used elsewhere in the file
            $escapedSymbol = [regex]::Escape($defaultImport)
            $usagePattern = "(?<!\w)$escapedSymbol(?!\w)"
            $contentWithoutImport = $content -replace $importText, ""
            
            if (-not ([regex]::Match($contentWithoutImport, $usagePattern)).Success) {
                $results += [PSCustomObject]@{
                    File = $relativePath
                    Line = $lineNumber
                    Import = $importText
                    Symbol = $defaultImport
                    Module = $fromModule
                    Status = "Potentially unused"
                }
            }
        }
    }
}

# Output results
Write-Host "`nPotentially Unused Imports Report:`n"
Write-Host ("=" * 80)

$groupedResults = $results | Group-Object -Property File

foreach ($group in $groupedResults) {
    Write-Host "`nFile: $($group.Name)"
    Write-Host ("-" * 80)
    
    foreach ($item in $group.Group) {
        Write-Host "Line $($item.Line): $($item.Import)"
        Write-Host "  - Symbol: $($item.Symbol) from '$($item.Module)'"
    }
}

# Summary
Write-Host "`n`nSummary:"
Write-Host ("=" * 80)
Write-Host "Total TypeScript files scanned: $($tsFiles.Count)"
Write-Host "Files with potentially unused imports: $($groupedResults.Count)"
Write-Host "Total potentially unused imports found: $($results.Count)"
Write-Host "`nNote: This is a heuristic analysis and may contain false positives."
Write-Host "Please verify each case before removing imports." 