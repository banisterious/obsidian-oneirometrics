$content = Get-Content "main.ts" -Raw

# Remove the declaration comment and variable
$content = $content -replace "// Add this near the top of the file, with other global variables\r?\n// let globalLogger: LogManager \| LoggingAdapter \| null = null;\r?\n", ""

# Remove the initialization comment
$content = $content -replace "// Set the global logger reference\r?\n// globalLogger = this.logger;\r?\n", ""

# Save the file
$content | Set-Content "main.ts" -NoNewline 