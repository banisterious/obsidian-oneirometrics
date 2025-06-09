# =============================================================================
# CSS BUILD SCRIPT - OneiroMetrics Component System
# =============================================================================

Write-Host "Building OneiroMetrics CSS from components..." -ForegroundColor Cyan

# Component order matters for proper cascade
$components = @(
    "styles/variables.css",
    "styles/base.css", 
    "styles/modals.css",
    "styles/buttons.css",
    "styles/tables.css",
    "styles/utilities.css",
    "styles/icons.css",
    "styles/navigation.css",
    "styles/forms.css"
)

# Initialize build
$output = @()
$totalSize = 0
$componentSizes = @{}

# Add build header with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$header = @"
/* =============================================================================
   ONEIROMETRICS COMPILED CSS - Component System v3
   Generated: $timestamp
   Components: $($components.Count)
   ============================================================================= */

"@

$output += $header

# Process each component
foreach ($component in $components) {
    if (Test-Path $component) {
        $componentName = (Split-Path $component -Leaf) -replace '\.css$', ''
        $content = Get-Content $component -Raw
        $size = [System.Text.Encoding]::UTF8.GetByteCount($content)
        $sizeKB = [Math]::Round($size / 1KB, 1)
        
        # Add component header
        $componentHeader = @"

/* =============================================================================
   COMPONENT: $($componentName.ToUpper()) ($sizeKB KB)
   ============================================================================= */
"@
        
        $output += $componentHeader
        $output += $content
        
        $totalSize += $size
        $componentSizes[$componentName] = $sizeKB
        
        Write-Host "[+] Added $componentName ($sizeKB KB)" -ForegroundColor Green
    } else {
        Write-Host "[-] Component not found: $component" -ForegroundColor Red
    }
}

# Write final CSS file
$finalContent = $output -join "`n"
$finalContent | Out-File "styles.css" -Encoding UTF8

# Generate size report
$totalSizeKB = [Math]::Round($totalSize / 1KB, 1)
Write-Host "`n=== BUILD COMPLETE ===" -ForegroundColor Yellow
Write-Host "Final CSS: $totalSizeKB KB" -ForegroundColor Cyan
Write-Host "`nComponent breakdown:" -ForegroundColor White

foreach ($comp in $componentSizes.GetEnumerator() | Sort-Object Value -Descending) {
    Write-Host "  $($comp.Key): $($comp.Value) KB" -ForegroundColor Gray
}

Write-Host "`nCSS file generated successfully!" -ForegroundColor Green 