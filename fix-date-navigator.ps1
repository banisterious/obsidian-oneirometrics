# Fix DateNavigator.ts syntax errors
# This script corrects the try/catch syntax issues in DateNavigator.ts

$file = "src/dom/DateNavigator.ts"
$backup = "src/dom/DateNavigator.ts.bak"

# Make a backup of the original file
Copy-Item $file $backup

# Read the file content
$content = Get-Content $file -Raw

# Fix 1: Line 468 - Fix the improperly nested try/catch block
$content = $content -replace '(?s)(window\[\''globalLogger\''\]\.debug\(\''DateNavigator\'', \''DIAGNOSTIC - Date filtering:\'', \{.*?\}\)\;.*?)\}\s+\} catch \(e\) \{\s+\/\/ Silent failure - logging should never break functionality\s+\}', '$1}
                    } catch (e) {
                        // Silent failure - logging should never break functionality
                    }'

# Fix 2: Line 543 - Fix malformed catch block
$content = $content -replace '(?s)(window\[\''globalLogger\''\]\.debug\(\''DateNavigator\'', \''DIAGNOSTIC - Date parsing:\'', \{.*?\}\)\;.*?)\}\s+\} catch \(e\) \{\s+\/\/ Silent failure - logging should never break functionality\s+\}', '$1}
                            } catch (e) {
                                // Silent failure - logging should never break functionality
                            }'

# Fix 3: Line 635 - Fix missing catch or finally
$content = $content -replace '(?s)(window\[\''globalLogger\''\]\.debug\(\''DateNavigator\'', \''No window\.dreamEntries found\''\)\;.*?)\}\s+\} else \{', '$1}
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            } else {'

# Fix 4: Line 778 - Fix unmatched try
$content = $content -replace '(?s)(window\[\''globalLogger\''\]\.error\(\''DateNavigator\'', "Error during state inspection:", e\)\;.*?)\}\s+\} catch \(e\) \{', '$1}
            } catch (e) {'

# Fix 5: Line 903 - Add missing catch/finally before method definition
$content = $content -replace '(?s)(window\[\''globalLogger\''\]\.debug\(\''DateNavigator\'', \''DIAGNOSTIC - Final entries map:\'', entriesByDate\)\;.*?)\}\s+\}\s+\/\/ Update the UI with the loaded entries\s+this\.updateMonthGrid\(\);\s+\}\s+\s+\/\/ New helper method to process entries for display', '$1}
        } catch (e) {
            // Silent failure - logging should never break functionality
        }
        
        // Update the UI with the loaded entries
        this.updateMonthGrid();
    }
    
    // New helper method to process entries for display'

# Write the fixed content back to the file
$content | Set-Content $file

Write-Host "Fixed DateNavigator.ts syntax errors. Original file backed up to $backup" 