# PowerShell script to remove buttonContainer inline styles from HubModal.ts
$filePath = "src\dom\modals\HubModal.ts"
$content = Get-Content $filePath -Raw

# Remove the inline style lines
$content = $content -replace "        buttonContainer\.style\.display = 'flex';\r?\n", ""
$content = $content -replace "        buttonContainer\.style\.gap = '0\.75em';\r?\n", ""
$content = $content -replace "        buttonContainer\.style\.gap = '0\.5em';\r?\n", ""
$content = $content -replace "        buttonContainer\.style\.marginTop = '0\.5em';\r?\n", ""
$content = $content -replace "        buttonContainer\.style\.marginTop = '1\.5em';\r?\n", ""
$content = $content -replace "        buttonContainer\.style\.justifyContent = 'flex-end';\r?\n", ""

# Write the content back
Set-Content $filePath $content -NoNewline

Write-Host "Removed buttonContainer inline styles from HubModal.ts" 