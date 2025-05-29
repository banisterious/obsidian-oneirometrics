# Fix script for DateNavigator.ts try/catch syntax errors
# This applies specific line changes to fix compile errors

$file = "src/dom/DateNavigator.ts"
$backup = "src/dom/DateNavigator.ts.script.bak"

# Make a backup of the file
Copy-Item $file $backup
Write-Host "Backup created at $backup"

# Read the file content
$content = Get-Content $file -Raw

# Fix the import first
$content = $content -replace "import \{ DreamMetricData \} from '\.\.\/types\/core';", "import { DreamMetricData } from '../types';"

# Write the fixed content back to the file
$content | Set-Content $file

# Now let's fix each try/catch issue one by one
$lineNumber = 467
$line = (Get-Content $file)[$lineNumber - 1]
Write-Host "Line $lineNumber before: $line"

# Fixes for the errors - I'm going to take a simple approach by specifically targeting each error
# Since the PowerShell string replacement is causing issues, we'll manually edit the file

# 1. Locate and modify key lines
$lines = Get-Content $file

# Fix error at line 468
$fixedLines = @()
$inError = $false
$fixApplied = $false

for ($i = 0; $i -lt $lines.Length; $i++) {
    $currentLine = $lines[$i]
    
    # Fix for line 468 - try/catch nesting issue
    if (-not $fixApplied -and $i -ge 466 -and $i -le 470) {
        if ($currentLine -match "} catch \(e\) \{" -and $i -eq 467) {
            $fixedLines += "                } catch (e) {"
            $fixedLines += "                    // Silent failure - logging should never break functionality"
            $fixedLines += "                }"
            $inError = $true
            continue
        }
        
        if ($inError -and $currentLine -match "Silent failure") {
            continue
        }
        
        if ($inError -and $currentLine -match "^[\s]*\}[\s]*$") {
            $inError = $false
            $fixApplied = $true
            continue
        }
    }
    
    # Fix for line 543 - malformed catch
    if ($i -eq 542 -and $currentLine -match "} catch \(e\) \{") {
        $fixedLines += "                } catch (e) {"
        $fixedLines += "                    // Silent failure - logging should never break functionality"
        $fixedLines += "                }"
        $i += 2  # Skip the next two lines
        continue
    }
    
    # Fix for line 635 - missing catch/finally
    if ($i -eq 634 -and $currentLine -match "\} else \{") {
        $fixedLines += "            } catch (e) {"
        $fixedLines += "                // Silent failure - logging should never break functionality"
        $fixedLines += "            }"
        $fixedLines += "            } else {"
        continue
    }
    
    # Fix for line 778 - missing try
    if ($i -eq 777 -and $currentLine -match "\} catch \(e\) \{") {
        $fixedLines += "        } catch (e) {"
        continue
    }
    
    # Fix for line 903 - missing catch/finally before method definition
    if ($i -eq 902 -and $currentLine -match "private processEntriesToDisplay") {
        $fixedLines += "        } catch (e) {"
        $fixedLines += "            // Silent failure - logging should never break functionality"
        $fixedLines += "        }"
        $fixedLines += ""
        $fixedLines += "    // New helper method to process entries for display"
        $fixedLines += $currentLine
        continue
    }
    
    # Add the current line if we haven't modified it
    $fixedLines += $currentLine
}

# Write the fixed content back to the file
$fixedLines | Set-Content $file

Write-Host "Fixed syntax errors in DateNavigator.ts" 