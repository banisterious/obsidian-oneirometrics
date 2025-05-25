#!/bin/bash
# Script to archive refactoring-related documentation
# Run this from the root of the project

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}OneiroMetrics Post-Refactoring Documentation Archiver${NC}"
echo "This script will archive all refactoring-related documentation."
echo ""

# Ensure the archive directory exists
ARCHIVE_DIR="docs/archive/legacy"
mkdir -p $ARCHIVE_DIR
echo -e "${GREEN}✓${NC} Created archive directory: $ARCHIVE_DIR"

# List of files to archive
FILES_TO_ARCHIVE=(
  "TypeScript-Migration-Plan.md"
  "docs/developer/implementation/typescript-issues.md"
  "docs/developer/implementation/typescript-issues-next-steps.md" 
  "docs/developer/implementation/typescript-migration-status.md"
  "docs/developer/implementation/typescript-component-migration.md"
  "docs/developer/implementation/examples/component-migration-example.ts"
  "docs/developer/implementation/post-refactoring-roadmap.md"
  "docs/developer/implementation/refactoring-plan-2025.md"
  "docs/developer/implementation/post-refactoring-cleanup-checklist.md"
  "docs/developer/implementation/archive-refactoring-docs.sh"
)

# Create subdirectories in archive as needed
mkdir -p "$ARCHIVE_DIR/developer/implementation/examples"
echo -e "${GREEN}✓${NC} Created subdirectories in archive"

# Archive each file
for file in "${FILES_TO_ARCHIVE[@]}"; do
  if [ -f "$file" ]; then
    # Determine the target path in the archive
    if [[ $file == docs/* ]]; then
      # For files in docs directory, preserve the structure
      target_file="${ARCHIVE_DIR}/${file#docs/}"
      target_dir=$(dirname "$target_file")
      mkdir -p "$target_dir"
    else
      # For files in root, just move them to the archive root
      target_file="${ARCHIVE_DIR}/$(basename "$file")"
    fi
    
    # Copy the file to the archive
    cp "$file" "$target_file"
    echo -e "${GREEN}✓${NC} Archived: $file → $target_file"
    
    # Add a note to the top of the file indicating it was archived
    current_date=$(date +"%Y-%m-%d")
    temp_file=$(mktemp)
    echo "---" > "$temp_file"
    echo "ARCHIVED: This document was archived on $current_date as part of post-refactoring cleanup." >> "$temp_file"
    echo "It is preserved for historical reference only and may contain outdated information." >> "$temp_file"
    echo "---" >> "$temp_file"
    echo "" >> "$temp_file"
    cat "$file" >> "$temp_file"
    mv "$temp_file" "$target_file"
    
    # Replace the original with a reference to the archived version
    echo "# This document has been archived" > "$file"
    echo "" >> "$file"
    echo "This document was archived on $current_date as part of the post-refactoring cleanup process." >> "$file"
    echo "" >> "$file"
    echo "The archived version is available at: \`$target_file\`" >> "$file"
    echo "" >> "$file"
    echo "Please refer to current documentation for up-to-date information." >> "$file"
    
    echo -e "${GREEN}✓${NC} Updated original with reference to archive"
  else
    echo -e "${RED}✗${NC} File not found: $file"
  fi
done

echo ""
echo -e "${GREEN}Archiving complete!${NC}"
echo "All refactoring documentation has been archived to: $ARCHIVE_DIR"
echo "Original files have been replaced with references to their archived versions." 