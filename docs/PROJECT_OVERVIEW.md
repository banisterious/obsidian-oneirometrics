<p align="center">
  <img src="images/gsa-barn.jpg" alt="A country barn painting, representing the foundation of dream journaling." width="600"/>
</p>
<p align="center"><em>"Barn at Sunrise" by Gary Armstrong, inspiration for OneiroMetrics</em></p>

# OneiroMetrics Project Overview

## Recent Updates
- **New Optional Metrics Added:**
  - Dream Theme (Categorical/Keywords)
  - Lucidity Level (Score 1-5)
  - Dream Coherence (Score 1-5)
  - Setting Familiarity (Score 1-5)
  - Ease of Recall (Score 1-5)
  - Recall Stability (Score 1-5)

- **Metric Order Updated:**
  - **Default Metrics:** Sensory Detail, Emotional Recall, Descriptiveness, Characters Role, Confidence Score
  - **Optional Metrics:** Characters Count, Familiar Count, Unfamiliar Count, Characters List, Dream Theme, Lucidity Level, Dream Coherence, Setting Familiarity, Ease of Recall, Recall Stability

- **UI Enhancements:**
  - Optional metrics are now displayed in a collapsible section, improving usability and reducing visual clutter.
  - **Metrics Descriptions Modal:** A dedicated modal now displays all metric descriptions (default and optional) with a landscape layout, improved table borders, and Lucide icons integrated into headings. This modal is accessible via a 'Metrics Descriptions' button in the settings page.

## Current Status
- The project is actively maintained and updated with new features and improvements.
- Recent changes include the addition of new metrics and UI enhancements to improve user experience.

## Next Steps
- **Testing:** Ensure the new optional metrics and collapsible section function as expected.
- **Documentation:** Review and update documentation to reflect recent changes.
- **Feedback:** Gather user feedback on the new metrics and UI enhancements.

## Contributing
Contributions are welcome! Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Recent Improvements

### Version 0.3.0 (May 2025)
- **Metric Icon Picker**: Added visual customization for metrics with Lucide icons
- **Keyboard & Accessibility**: Implemented full keyboard navigation and screen reader support
- **'This Week' Filter**: Added configurable week start day for better date filtering
- **Readable Line Length Widget**: Added control for table width
- **Enhanced Metrics Description**: Improved metric information display
- **Automatic Backup System**: Added .bak extension for backup files
- **Open Metrics Note Button**: Added quick access to metrics note

### Version 0.2.1 (May 2025)
- **Widget for Readable Line Length**: Added control for table width
- **Metrics Description Section**: Added detailed metric information
- **UI Improvements**: Enhanced table styling and theme compatibility

### Version 0.2.0 (May 2025)
- **Metric Icon Picker**: Added visual customization for metrics
- **Keyboard & Accessibility**: Implemented full keyboard navigation
- **Table Improvements**: Enhanced sorting and filtering capabilities

### Version 0.1.3 (May 2025)
- **UI Improvements**: Enhanced autocomplete logic and modal fields
- **Bug Fixes**: Resolved various UI issues

## Project Description

OneiroMetrics is an Obsidian plugin designed to transform dream journaling into structured data analysis. It allows users to track and analyze various metrics from their dream journal entries, providing insights into dream patterns and characteristics.

### Key Features
- **Metric Tracking**: Define and track custom metrics for dream analysis
- **Data Visualization**: Generate comprehensive tables and summaries
- **Smart File Selection**: Intelligent note selection with autocomplete
- **Accessibility**: Full keyboard navigation and screen reader support
- **Theme Integration**: Seamless integration with Obsidian themes
- **Automatic Backups**: Reliable backup system with .bak extension

### User Interface
- Clean, modern interface with consistent styling
- Standardized button system with semantic variants:
  - `.oom-button` base class for all buttons
  - `.oom-button--primary` for primary actions
  - `.oom-button--secondary` for secondary actions
  - `.oom-button--expand` for expand/collapse buttons
  - `.oom-button--batch` for batch action buttons
- Responsive tables with virtual scrolling
- Interactive filters and sorting
- Expandable dream content previews
- Theme-aware styling that adapts to light/dark modes

### User Experience
- **Intuitive Design**: Easy-to-use interface for metric management
- **Real-time Feedback**: Immediate validation and error messages
- **Smart Suggestions**: Intelligent file and path suggestions
- **Responsive Tables**: Optimized for readability and interaction
- **Theme Compatibility**: Consistent appearance across themes
- **Keyboard Navigation**: Efficient keyboard-based interaction

## Development Focus

### Current Priorities
1. **Performance Optimization**
   - Table regeneration efficiency
   - Memory usage optimization
   - Icon rendering performance

2. **User Experience**
   - Modal feedback improvements
   - Accessibility enhancements
   - Theme compatibility

3. **Documentation**
   - Usage guidelines
   - API documentation
   - Testing procedures

### Future Enhancements
1. **Feature Expansion**
   - Icon picker search/filter
   - Additional icon options
   - Advanced data visualization

2. **Technical Improvements**
   - Code optimization
   - Testing coverage
   - Performance monitoring

3. **User Support**
   - Enhanced documentation
   - Tutorial content
   - Community resources

## Technical Architecture

### Core Components
1. **Data Management**
   - Dream entry parsing
   - Metric extraction
   - Data storage and retrieval
   - State management

2. **User Interface**
   - Table-based data display
   - Filter controls
   - Responsive design
   - Theme integration

3. **Styling System**
   - Theme-aware CSS architecture
   - Custom properties for consistent theming
   - Responsive breakpoints
   - Mobile-first approach

### CSS Architecture
The plugin uses a sophisticated CSS architecture that:
- Maintains compatibility with Obsidian's theming system
- Provides consistent styling across different themes
- Supports responsive design
- Uses CSS custom properties for maintainability
- Implements a mobile-first approach

Key CSS features:
- Theme override selectors for consistent behavior
- Custom properties for centralized theming
- Responsive breakpoints for different screen sizes
- Touch device optimizations
- Accessible color contrast
- Flexible layout system

### Lucide Icon Mappings
The plugin uses Lucide icons to provide visual indicators for different metrics. Here are the current mappings:

| Metric | Icon | Description |
|--------|------|-------------|
| Lost Segments | `circle-minus` | Indicates missing or forgotten dream segments |
| Lucidity | `sparkles` | Represents awareness within the dream |
| Emotional Intensity | `heart` | Shows emotional impact of the dream |
| Vividness | `eye` | Indicates visual clarity and detail |
| Control | `wand-2` | Represents dream control and influence |
| Bizarreness | `zap` | Shows unusual or surreal elements |
| Clarity | `glasses` | Indicates overall dream clarity |
| Coherence | `link` | Shows narrative connectedness |
| Length | `ruler` | Represents dream duration/length |
| Complexity | `layers` | Indicates narrative complexity |
| Familiar People | `users-round` | Shows presence of known people |

These icons are used consistently throughout the plugin's interface to provide quick visual recognition of different metrics. The icons are displayed:
- In the settings page next to each metric name
- In the metrics table header for each metric column
- In tooltips when hovering over metric values
- In the metric editor when configuring metrics

The icons are implemented using the Lucide icon library, which provides a consistent and modern look across the plugin. Each icon is chosen to intuitively represent its associated metric, making it easier for users to quickly identify and understand different metrics at a glance.

## Development Guidelines

### CSS Best Practices
1. **Theme Compatibility**
   - Use CSS custom properties for theme values
   - Avoid hard-coded colors
   - Support both light and dark themes
   - Maintain compatibility with Minimal theme

2. **Responsive Design**
   - Mobile-first approach
   - Fluid layouts
   - Touch-friendly interfaces
   - Progressive enhancement

3. **Performance**
   - Minimize CSS specificity
   - Reduce use of `!important`
   - Optimize selectors
   - Use efficient properties

4. **Maintainability**
   - Clear organization
   - Consistent naming
   - Comprehensive comments
   - Modular structure

### Code Organization
- Separate concerns (data, UI, styling)
- Modular component structure
- Clear file organization
- Comprehensive documentation

## Testing Strategy
1. **Theme Testing**
   - Light theme
   - Dark theme
   - Minimal theme variants
   - Custom themes

2. **Responsive Testing**
   - Desktop
   - Tablet
   - Mobile
   - Different aspect ratios

3. **Functionality Testing**
   - Data parsing
   - Metric calculations
   - UI interactions
   - Performance

4. **Automated unit testing for core functions**
5. **Manual integration testing for Obsidian API**
6. **End-to-end testing for user workflows**
7. **Performance testing for large datasets**
8. **Cross-platform compatibility testing**
9. **Theme compatibility testing**

## Next Steps
1. Complete CSS optimization
2. Enhance theme compatibility
3. Improve performance
4. Add new features
5. Update documentation
6. Expand test coverage

## Contributing
We welcome contributions! Please see our contributing guidelines for more information.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

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

## Recent Fixes (May 2025)

- Lucide icons now render correctly in all tables and modals, including the Metric Edit modal and Project Note tables.
- The "Show more" button for dream content now reliably expands and collapses content in the Dream Entries table.
- Table sorting is fully functional: click any column header to sort Dream Entries by that column.
- Filtering by date and metric now works as expected in the Dream Entries table.
- All previously identified UI/UX issues with autocomplete, backup creation, content column formatting, and metric modal fields have been resolved.
- The codebase now attaches all interactive logic (sorting, filtering, expand/collapse) directly via the plugin, ensuring compatibility with Obsidian's preview mode.

## Current Status (as of May 2025)

- ✅ **Lucide icons:** Now render correctly in all tables and modals.
- ✅ **Show more button:** Expands/collapses dream content as expected.
- ✅ **Table sorting:** Clicking column headers sorts the Dream Entries table.
- ✅ **Filtering:** Date and metric filtering now updates the Dream Entries table.
- ✅ **Autocomplete, backup, and modal UI:** All previously reported issues are resolved.
- ⏳ **Performance optimizations:** Pending further implementation and testing.
- ⏳ **Advanced features:** See Planned Features below.

## Known Issues & Testing

- [x] Lucide icons now render in all tables and modals.
- [x] Show more button expands/collapses content.
- [x] Table sorting works for all columns except Content.
- [x] Filtering by date and metric works as expected.
- [x] All previously reported UI/UX issues are resolved.
- [ ] Performance optimizations pending implementation and testing.
- [ ] Advanced features and enhancements in progress (see Planned Features).

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
   - **Toggle Readable Line Length** directly below the Dream Entries heading for instant table width control (also available in settings).

---

## Contributing & Feedback

- Please use the checklist in `TESTING.md` when testing new features or reporting bugs.
- For issues, include console logs, screenshots, and details as described in the bug reporting template in `TESTING.md`.
- When suggesting UI improvements, please consider both desktop and mobile usability.

## Testing Strategy
- [ ] Automated unit testing for core functions
- [ ] Manual integration testing for Obsidian API
- [ ] End-to-end testing for user workflows
- [ ] Performance testing for large datasets
- [ ] Cross-platform compatibility testing
- [ ] Theme compatibility testing

## Development Guidelines
- [ ] Follow TypeScript best practices
- [ ] Maintain comprehensive test coverage
- [ ] Document all new features
- [ ] Update testing documentation
- [ ] Regular performance optimization
- [ ] Consistent error handling
- [ ] User feedback integration

## Documentation
For detailed information about the metrics used in OneiroMetrics, including scoring guidelines and examples, see [METRICS.md](METRICS.md).

- 🛠️ **Lucide icons now render correctly as SVGs in the Settings > Metrics section, providing clear visual indicators for each metric.**
- 🛠️ **Metric range labels for 'Lost Segments' and 'Familiar People' now display 'Any whole number' instead of a fixed range.**
- 🛠️ **File/folder suggestion and autocomplete logic in settings has been reviewed and is being improved for reliability and usability.**
- 🛠️ **Metric editor modal now supports 'Any whole number' for Lost Segments and Familiar People, hiding min/max fields and updating the preview accordingly.**
- 🛠️ **Fix for file/folder suggestions in settings is in progress.**
- 🛠️ **File/folder suggestion dropdowns in settings now explicitly set display:block/display:none, ensuring suggestions are visible as you type in Backup Folder and Selected Notes fields.**
- 🛠️ **Parser blockStack logic has been fixed:** The plugin now correctly nests dream-diary and dream-metrics callouts under their parent journal-entry and dream-diary blocks, enabling robust extraction of dream entries from nested callouts.
- 🛠️ **Granular debug logging:** Extensive debug logs and iterative troubleshooting were used to diagnose and resolve extraction issues, ensuring reliability for real-world dream journal structures.

## Recent Updates (June 2025)

- **Chips Area UI:** The chips area for selected notes is now visually flat, with no border, background, or box-shadow.
- **Backup File Extension:** Backup files now use the .bak extension instead of .md.
- **Open Metrics Note Button:** The modal now includes an Open Metrics Note button, only enabled when the note exists, which opens the note in Obsidian.

## Debug Logging & Troubleshooting Note Updates

To ensure reliability in metrics extraction and note updating, the plugin now includes granular debug logging at key steps:

- When scraping, logs show the number of dream entries found, the project note path, and the full array of extracted entries.
- Before updating the OneiroMetrics Note, logs and Notices indicate whether the update function is called, the number of entries, and the content being written.
- If no entries are found or the note path does not match, debug Notices and logs are shown.

**Troubleshooting Steps:**
1. Check for debug Notices in Obsidian (e.g., `[DEBUG] updateProjectNote called for: ...`).
2. Confirm the "OneiroMetrics Note Path" in settings matches the file you are viewing.
3. Open the note in the editor and look for the `<!-- OOM METRICS START -->` marker in the raw Markdown.
4. If no entries are found, check the console for logs about dream entry extraction.
5. If issues persist, enable even more granular debug logs in the extraction loop to print each entry (date, title, metrics).

This approach helps pinpoint where the update process may be breaking down and ensures the correct file is being updated with the latest metrics.

## Logging and Debug Output Policy

- To improve performance and maintainability, we plan to reduce excessive logging and remove or limit debug console.logs, especially those related to backup creation and extraction logic.
- Future code changes should ensure only essential logs remain, and debug output should be temporary and well-scoped.