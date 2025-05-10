# OneiroMetrics Issues & Feature Requests

## Bugs / Action Items
- [x] **Settings Layout:** Move Project Note Path, Callout Name, and "Selected Notes" above "Enable Backups" in the settings UI.
- [x] **Backup Section Styling:** Add a muted gray border around the backup section in settings.
- [x] **Selected Notes UI:** Clarify the "Selected Notes" box and fix chip/file suggestion positioning.
- [ ] **Content Column:** Strip image/file links (e.g., `filename.png|400`) from the Content column in the Dream Entries table.
- [ ] **Content Column Paragraph Breaks:** Dream content needs paragraph breaks (`<br>` or similar) preserved in the table.
- [ ] **Selected Notes Autocomplete (Scrape Modal):** Files list does not appear when typing; should match settings modal behavior.
- [ ] **Selected Notes Autocomplete (Settings Modal):** Files appear, but are misaligned (appear up to the left).
- [ ] **Edit Metric Modal (Lost Segments):** Missing field for value type or min/max (should show "Any whole number" and hide min/max fields).
- [ ] **Metrics Table Font Size:** Font size is still inconsistent across columns and UI.
- [ ] **Filters:** Filters in the metrics table do not change the content shown.
- [ ] **Columns Not Sorting:** Clicking column headers does not sort the table.
- [ ] **Icons Not Rendering:** Lucide icons are not rendering in the metrics table.
- [ ] **Scraping Incomplete:** Some entries still need to be scraped or scraping is only partially successful.

## Feature Requests
- [ ] **Widget for Readable Line Length (Next Feature):** Add a toggle in settings to enable/disable readable line length override for tables, allowing users to retain their preferred Obsidian setting.
    - [ ] When implemented, display a notice or callout in the Project note to inform users that this feature is available and where to find the toggle in plugin settings.
- [ ] **Metrics Descriptions Section:** Add a section in the UI and/or documentation that clearly describes each metric, its scoring, and examples for user reference.
- [ ] **CSV Export:** Export summary and detailed dream metrics as CSV, with filtering and column selection (see TESTING.md for details).
- [ ] **Callout Metadata Support:** Add support for metadata in dream metrics callouts:
    - [ ] Document supported metadata options (e.g., `hide`, `compact`, `summary`)
    - [ ] Add CSS classes for metadata-based styling
    - [ ] Create a settings option to configure default metadata
    - [ ] Add metadata documentation to the UI

## Current Focus
- [ ] **Selected Notes autocomplete in modal:** Not listing files when text is entered; needs patching to match settings field logic.
- [ ] **No backup created upon scraping:** Backup logic may not be triggered or configured correctly; needs investigation.
- [ ] **Content Column:** Strip image/file links and preserve paragraph breaks.
- [ ] **Metrics Table:** Fix font size, sorting, icon rendering, and filter functionality.
- [ ] **Autocomplete UI:** Fix file suggestion alignment in settings and implement in scrape modal.
- [ ] **Edit Metric Modal:** Ensure correct fields are shown for "Any whole number" metrics.
- [ ] **Scraping:** Ensure all entries are scraped successfully and completely.

---

**How to use this file:**
- Check off items as they are completed.
- Add new bugs or feature requests as they arise.
- Reference this file in commit messages for traceability.

For detailed testing steps and scenarios, see `TESTING.md`. 