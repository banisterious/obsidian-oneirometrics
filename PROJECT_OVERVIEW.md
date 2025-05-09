# OneiroMetrics Project Overview

## Project Description
**OneiroMetrics** is an Obsidian plugin for tracking, analyzing, and visualizing dream journal metrics. It provides a structured way to extract, score, and review dream-related data from your notes, helping you gain insights into your dream patterns and recall.

---

## Key Features

- **Metrics Extraction:** Automatically scrapes dream metrics from selected notes using configurable callouts.
- **Detailed Metrics Table:** Displays a sortable, filterable table of dream entries, including:
  - Date, title (with clickable links), word count, and all configured metrics.
  - Dream content column with expandable/collapsible preview and full text (preserving paragraph breaks).
  - Optimized column widths and alignment for better readability.
  - Center-aligned numeric metrics for easy scanning.
  - Full-width table layout that overrides readable line length.
- **Summary Table:** Shows averages, min/max, and counts for each metric.
- **Multi-Note Selection:** Select multiple notes to include in metrics scraping, using a multi-chip autocomplete field.
- **Settings Modal:** Configure project note path, callout name, and selected notes with a modern, user-friendly UI.
- **Theme & Mobile Friendly:** 
  - All UI elements are styled to match Obsidian's theme and are responsive.
  - Tables adapt to screen size while maintaining readability.
  - Full-width sections for optimal space utilization.
- **Safe Updates:** Project note is backed up before overwriting metrics tables.
- **Testing & Troubleshooting:** Comprehensive testing checklist and troubleshooting guide included.

---

## Current Status (as of May 2025)

- ✅ **Metrics scraping and table generation** are robust and support nested callouts, content cleaning, and all configured metrics.
- ✅ **Dream content column** supports expandable/collapsible text with "Show more/less" and preserves formatting.
- ✅ **Clickable dream titles** link directly to the source journal entry.
- ✅ **Multi-chip autocomplete** for "Selected Notes" in both Settings and the modal.
- ✅ **File suggestion logic** improved for:
  - Spaces, dashes, underscores
  - Case-insensitive matching
  - Year-based paths (e.g., typing "2025" suggests "Journals/2025/2025.md")
- ✅ **Enhanced table styling:**
  - Full-width sections that override readable line length
  - Optimized column widths and content wrapping
  - Center-aligned numeric metrics
  - Improved filter controls layout
  - Better organization of Dream Entries section
- ✅ **All inline styles** have been moved to `styles.css` for maintainability.
- ✅ **Comprehensive testing checklist and troubleshooting guide** included.
- ⚠️ **Known Issues:** 
  - Content cleaning for markdown elements needs improvement
  - Some deeply nested paths may still be tricky for file suggestions

---

## Documentation & Testing

- 📄 **Testing & Troubleshooting Guide:**  
  See [`TESTING.md`](TESTING.md) in the project root for a full checklist, performance tests, and troubleshooting steps.

---

## How to Use

1. **Install the plugin** in Obsidian.
2. **Open the OneiroMetrics modal** from the ribbon or command palette.
3. **Configure your settings:**  
   - Set the Project Note Path (where metrics tables will be written).
   - Select notes to include using the multi-chip autocomplete.
   - Set your callout name if different from the default.
4. **Scrape metrics** and review the generated tables in your project note.
5. **Expand/collapse dream content** in the detailed table for full context.
6. **Use filters and sorting** to analyze your dream metrics:
   - Sort any column by clicking its header
   - Filter by date range or specific metrics
   - Expand dream content entries for more detail

---

## Contributing & Feedback

- Please use the checklist in `TESTING.md` when testing new features or reporting bugs.
- For issues, include console logs, screenshots, and details as described in the bug reporting template in `TESTING.md`.
- When suggesting UI improvements, please consider both desktop and mobile usability.