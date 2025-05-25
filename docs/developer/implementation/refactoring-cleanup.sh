#!/bin/bash

# Post-Refactoring Cleanup Script
# This script automates the cleanup tasks specified in post-refactoring-cleanup-checklist.md

echo "Starting post-refactoring cleanup..."

# Create archive directories if they don't exist
echo "Creating archive directories..."
mkdir -p docs/archive/legacy
mkdir -p docs/archive/refactoring-2025

# Archive documentation files
echo "Archiving documentation files..."
mv -v TypeScript-Migration-Plan.md docs/archive/refactoring-2025/ 2>/dev/null || echo "TypeScript-Migration-Plan.md already archived"
mv -v docs/developer/implementation/typescript-issues.md docs/archive/refactoring-2025/ 2>/dev/null || echo "typescript-issues.md already archived"
mv -v docs/developer/implementation/typescript-issues-next-steps.md docs/archive/refactoring-2025/ 2>/dev/null || echo "typescript-issues-next-steps.md already archived" 
mv -v docs/developer/implementation/typescript-migration-status.md docs/archive/refactoring-2025/ 2>/dev/null || echo "typescript-migration-status.md already archived"
mv -v docs/developer/implementation/typescript-component-migration.md docs/archive/refactoring-2025/ 2>/dev/null || echo "typescript-component-migration.md already archived"
mv -v docs/developer/implementation/examples/component-migration-example.ts docs/archive/refactoring-2025/ 2>/dev/null || echo "component-migration-example.ts already archived"
mv -v docs/developer/implementation/refactoring-plan-2025.md docs/archive/refactoring-2025/ 2>/dev/null || echo "refactoring-plan-2025.md already archived"

# NOTE: Adapter files are NOT removed automatically anymore
# We now use a phased migration approach documented in post-refactoring-cleanup-checklist.md
echo "IMPORTANT: Adapter files will NOT be automatically removed"
echo "Following the new phased migration approach documented in post-refactoring-cleanup-checklist.md"
echo "The following files will be migrated gradually:"
echo "  - src/utils/adapter-functions.ts"
echo "  - src/utils/type-adapters.ts"
echo "  - src/utils/property-compatibility.ts"
echo "  - src/utils/component-migrator.ts"

# Add a comment to the adapter files to indicate they're pending migration
echo "Adding migration notice to adapter files..."
for file in src/utils/adapter-functions.ts src/utils/type-adapters.ts src/utils/property-compatibility.ts src/utils/component-migrator.ts; do
    if [ -f "$file" ]; then
        # Check if notice already exists
        if ! grep -q "MIGRATION NOTICE" "$file"; then
            # Add notice to the beginning of the file
            tempfile=$(mktemp)
            echo "/**" > "$tempfile"
            echo " * MIGRATION NOTICE" >> "$tempfile"
            echo " * " >> "$tempfile"
            echo " * This file is part of the phased migration plan and will eventually be replaced." >> "$tempfile"
            echo " * Do not add new dependencies on this file. Instead, use the permanent replacements" >> "$tempfile"
            echo " * as documented in the TypeScript architecture documentation." >> "$tempfile"
            echo " * " >> "$tempfile"
            echo " * See post-refactoring-cleanup-checklist.md for the detailed migration plan." >> "$tempfile"
            echo " */" >> "$tempfile"
            echo "" >> "$tempfile"
            cat "$file" >> "$tempfile"
            mv "$tempfile" "$file"
            echo "Added migration notice to $file"
        else
            echo "Migration notice already exists in $file"
        fi
    else
        echo "$file not found"
    fi
done

echo "Cleanup complete! Please run TypeScript compilation to verify no errors."
echo "When you've confirmed everything works, you can archive the post-refactoring-cleanup-checklist.md file." 