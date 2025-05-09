# OneiroMetrics Testing Guide

## Setup Testing
- [ ] Plugin installs correctly in Obsidian
- [ ] Plugin appears in the community plugins list
- [ ] Plugin can be enabled/disabled without errors
- [ ] Plugin settings are accessible
- [ ] Plugin icon appears in the ribbon

## Settings Testing
- [ ] Project note path can be set and saved
- [ ] Selected notes can be added and removed using multi-chip autocomplete in both Settings and the modal
- [ ] Chips are pre-populated from Settings in the modal
- [ ] Removing a chip updates the selected notes
- [ ] Adding a chip via autocomplete works as expected
- [ ] Modal and Settings selected notes stay in sync
- [ ] Callout name can be modified
- [ ] Settings persist after Obsidian restart
- [ ] Invalid paths are handled gracefully
- [ ] File suggestions work in the project note path field
- [ ] File suggestions work for paths with spaces and special characters (e.g., 'Journals/Dream Diary/Dream Diary.md')
- [ ] Year-based paths are suggested correctly (e.g., typing '2025' suggests 'Journals/2025/2025.md')

## Metrics Scraping
- [ ] Scrape button works from modal
- [ ] Scrape command works from command palette
- [ ] Progress is shown during scraping
- [ ] Errors are handled gracefully
- [ ] Backup is created before overwriting
- [ ] Confirmation dialog appears before overwriting

## Metrics Table - Summary Section
- [ ] Table renders correctly
- [ ] All metrics are displayed
- [ ] Averages are calculated correctly
- [ ] Min/Max values are correct
- [ ] Count values are accurate
- [ ] Table is responsive on different screen sizes

## Metrics Table - Detailed Section
- [ ] Table renders correctly
- [ ] All columns are present
- [ ] Data is sorted by date by default
- [ ] Clickable dream titles work
- [ ] Links navigate to correct journal entries
- [ ] Word counts are accurate

## Content Display
- [ ] Content preview shows first 200 characters
- [ ] Gradient fade effect works in preview
- [ ] "Show more" button appears for long content
- [ ] "Show less" button appears when expanded
- [ ] Paragraph breaks are preserved
- [ ] Text wrapping works correctly
- [ ] Content is properly formatted
- [ ] Font size and colors match theme
- [ ] Markdown elements are properly stripped:
  - [ ] Journal page callouts (e.g., [!journal-page|right])
  - [ ] Image embeds with dimensions (e.g., !image.png|400)
  - [ ] Wiki links
  - [ ] HTML tags
  - [ ] Horizontal rules
  - [ ] Multiple newlines

## Filtering and Sorting
- [ ] Date range filter works
  - [ ] All Time option
  - [ ] Last Month option
  - [ ] Last Week option
- [ ] Metric filter works
  - [ ] All Metrics option
  - [ ] Individual metric options
- [ ] Column sorting works
  - [ ] Date column
  - [ ] Title column
  - [ ] Words column
  - [ ] Metric columns
- [ ] Sort indicators show correct direction

## Styling and UI
- [ ] Tables match Obsidian theme
- [ ] Hover effects work on rows
- [ ] Buttons have proper hover states
- [ ] Links have proper hover states
- [ ] Text is readable
- [ ] Spacing is consistent
- [ ] UI is responsive
- [ ] No horizontal scrolling on desktop
- [ ] Mobile view is usable
- [ ] Table overrides readable line length setting
- [ ] Table maintains full width regardless of theme settings
- [ ] Column widths are optimized:
  - [ ] Date column (8%)
  - [ ] Dream Title column (15%)
  - [ ] Words column (7%)
  - [ ] Content column (30%)
  - [ ] Metric columns (8% each)

## Error Handling
- [ ] Invalid file paths show appropriate errors
- [ ] Missing metrics show appropriate messages
- [ ] Network errors are handled gracefully
- [ ] Permission errors are handled gracefully
- [ ] Invalid data formats are handled gracefully

## Performance
- [ ] Plugin loads quickly
- [ ] Tables render quickly
- [ ] Sorting is responsive
- [ ] Filtering is responsive
- [ ] No lag when expanding content
- [ ] Memory usage is reasonable

## Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

## Theme Compatibility
- [ ] Works with Light theme
- [ ] Works with Dark theme
- [ ] Works with custom themes
- [ ] Colors adapt to theme changes

## Backup System Testing
- [ ] Backup is created before table update
- [ ] Backup filename includes timestamp
- [ ] Backup contains complete note content
- [ ] Backup is created in correct location
- [ ] Backup can be restored if needed
- [ ] Multiple backups are handled correctly
- [ ] Backup process doesn't block UI
- [ ] Backup errors are handled gracefully
- [ ] Backup files are visually distinct in file explorer
- [ ] Backup process works with large files

## Notes for Testing
1. Test with various dream journal entry lengths
2. Test with different metric combinations
3. Test with special characters in content
4. Test with different date ranges
5. Test with different screen sizes
6. Test with different Obsidian themes

## Bug Reporting Template
When reporting bugs, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Obsidian version
6. Plugin version
7. Operating system
8. Any error messages from the console

## Performance Testing
- [ ] Test with 100+ dream entries
- [ ] Test with 10+ metrics
- [ ] Test with large content (1000+ words)
- [ ] Monitor memory usage
- [ ] Check load times
- [ ] Verify smooth scrolling
- [ ] Check filter response time
- [ ] Check sort response time

## Troubleshooting: File Suggestion Issues

If a file path does not appear in suggestions:
- [ ] Confirm the file and all parent folders exist in your vault
- [ ] Check for typos, extra spaces, or case mismatches
- [ ] Try typing the full path, including spaces and special characters
- [ ] Try replacing spaces with dashes or underscores
- [ ] If the file was recently created or renamed, restart Obsidian or reload the vault
- [ ] Ensure the file is not hidden or excluded by Obsidian settings
- [ ] If the issue persists, report it with details (see Bug Reporting Template) 