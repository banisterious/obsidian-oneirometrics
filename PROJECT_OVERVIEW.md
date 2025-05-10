# OneiroMetrics Plugin Project Overview

## Project Description
OneiroMetrics is an Obsidian plugin designed to transform dream journaling into structured data analysis. It provides tools for tracking, analyzing, and visualizing dream-related metrics, making it easier to identify patterns and insights in your dream journal.

## Current Development Status

### Completed Features
- Basic plugin structure and configuration
- Dream journal entry parsing and data extraction
- Metric tracking system
- Data visualization components
- Theme-aware styling system
- Responsive design for all screen sizes
- Enhanced CSS architecture with custom properties
- Improved theme compatibility across Obsidian themes
- Reduced use of `!important` declarations
- Better organization of style rules
- Enhanced responsive design
- Improved table layout and spacing
- Better handling of readable line width settings
- Fixed settings UI bug: Patched incorrect use of `this.register` in the settings tab to `this.plugin.register`, restoring all settings fields
- Improved Selected Notes autocomplete: Autocomplete and chip selection now work reliably in the settings modal
- Section heading consistency: Section headings now use `--h2-size` and theme heading variables for full Obsidian theme compatibility
- Backup Folder autocomplete: Patched for real-time, responsive suggestions as you type
- Markdown stripping in content columns and metric configuration improvements
- Modal Selected Notes autocomplete: The modal's Selected Notes field now only shows real, existing markdown files from your vault

### In Progress
- CSS optimization and maintenance
- Theme override system refinement
- Performance improvements
- Documentation updates
- Selected Notes autocomplete in modal: Not listing files when text is entered; needs patching to match settings field logic
- No backup created upon scraping: Backup logic may not be triggered or configured correctly; needs investigation

### Planned Features
- [ ] Advanced data visualization
- [ ] Custom metric definitions
- [ ] Widget for Readable Line Length
    - [ ] Add a toggle in settings to enable/disable readable line length override for tables, allowing users to retain their preferred Obsidian setting.
    - [ ] When implemented, display a notice or callout in the Project note to inform users that this feature is available and where to find the toggle in plugin settings.
- [ ] Metrics Descriptions Section
    - [ ] Add a section in the UI and/or documentation that clearly describes each metric, its scoring, and examples for user reference.
- [ ] Export/Import functionality
    - [ ] CSV export with filtering
    - [ ] Summary and detailed exports
    - [ ] Custom column selection
    - [ ] Date range filtering
- [ ] Integration with other Obsidian plugins
- [ ] Enhanced search and filtering
- [ ] Statistical analysis tools
- [ ] Settings callout preview and copy
- [ ] Folder selection mode
- [ ] UI text updates ("Choose Notes" instead of "Select Notes")

At the bottom of the Settings page, display a section:

## Metric Descriptions

### Sensory Detail (Score 1-5)
This metric aims to capture the richness and vividness of the sensory information you recall from your dream.

| Score        | Description |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Minimal)  | You recall very little sensory information. The dream feels vague and lacks specific sights, sounds, textures, smells, or tastes. You might remember the general feeling of a place but not any distinct visual elements, for example. |
| 2 (Limited)  | You recall a few basic sensory details, perhaps a dominant color or a general sound. The sensory landscape is still quite sparse. |
| 3 (Moderate) | You recall a noticeable amount of sensory information. You might remember some visual details, perhaps a few distinct sounds, or a general feeling of touch. |
| 4 (Rich)     | You recall a significant amount of sensory information across multiple senses. You can describe specific visual elements, distinct sounds, perhaps a smell or a texture. The dream feels more immersive. |
| 5 (Vivid)    | Your recall is highly detailed and encompasses a wide range of sensory experiences. You can clearly describe intricate visual scenes, distinct and multiple sounds, and perhaps even specific tastes and smells. The dream feels very real and alive in your memory. |

### Emotional Recall (Score 1-5)
This metric focuses on your ability to remember and articulate the emotions you experienced within the dream.

| Score                | Description |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Vague)            | You have a faint sense that you felt some emotion in the dream, but you can't identify it specifically. You might just say you felt "something." |
| 2 (General)          | You can identify a primary emotion (e.g., happy, sad, scared) but can't describe its intensity or nuances. |
| 3 (Identified)       | You can identify one or two specific emotions you felt and perhaps describe their general intensity. |
| 4 (Nuanced)          | You recall several distinct emotions and can describe some of the nuances or shifts in your feelings throughout the dream. |
| 5 (Deep and Complex) | You have a strong recollection of the emotional landscape of the dream, including multiple emotions, their intensity, how they evolved, and perhaps even subtle emotional undertones. |

### Lost Segments (Number)
This metric tracks the number of distinct instances where you have a clear feeling or awareness that a part of the dream is missing or has been forgotten. This isn't about omitting fragments you never recalled in the first place. It's about those "gaps" in your recalled narrative where you feel like "there was something else there," or you have a fleeting image or feeling that then vanishes.

If you recall the dream as a complete, seamless narrative with no sense of missing parts, this score would be 0.

If you have a distinct feeling of one or more breaks or missing chunks in the dream's sequence, you would count each of those instances.

### Descriptiveness (Score 1-5)
This metric assesses the level of detail and elaboration in your written dream capture, beyond just sensory details (which have their own metric). This considers how thoroughly you describe the events, characters, interactions, and the overall narrative flow.

| Score                | Description |
| -------------------- | ----------- |
| 1 (Minimal)          | Your capture is very brief and outlines only the most basic elements of the dream. It lacks detail and elaboration. |
| 2 (Limited)          | Your capture provides a basic account of the dream but lacks significant descriptive detail in terms of actions, character behavior, or plot progression. |
| 3 (Moderate)         | Your capture provides a reasonably detailed account of the main events and characters, with some descriptive language used. |
| 4 (Detailed)         | Your capture includes a significant level of descriptive detail, bringing the dream narrative and its elements to life with more thorough explanations and imagery. |
| 5 (Highly Elaborate) | Your capture is very rich in detail, using vivid language to describe the events, characters, their motivations (if perceived), and the overall unfolding of the dream narrative. |

### Confidence Score (Score 1-5)
This is a subjective metric reflecting your overall sense of how complete and accurate your dream recall feels immediately after waking. It's your gut feeling about how much of the dream you've managed to retrieve.

| Score         | Description |
| ------------- | ----------- |
| 1 (Very Low)  | You feel like you've barely scratched the surface of the dream, remembering only a tiny fragment or a fleeting feeling. You suspect you've forgotten a significant portion. |
| 2 (Low)       | You recall a bit more, but you still feel like a substantial part of the dream is lost. The recall feels fragmented and incomplete. |
| 3 (Moderate)  | You feel like you've recalled a fair amount of the dream, perhaps the main storyline, but there might be some fuzzy areas or details you're unsure about. |
| 4 (High)      | You feel like you've recalled the majority of the dream with a good level of detail and coherence. You feel relatively confident in the accuracy of your memory. |
| 5 (Very High) | You feel like you've recalled the entire dream in vivid detail and with strong confidence in the accuracy and completeness of your memory. You don't have a sense of significant missing parts. |

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

## Current Status (as of May 2025)

- ✅ **Backup Folder autocomplete:** Now working correctly and matches other autocomplete fields.
- ⚠️ **Selected Notes autocomplete in modal:** Not listing files when text is entered; needs patching to match settings field logic.
- ⚠️ **No backup created upon scraping:** Backup logic may not be triggered or configured correctly; needs investigation.
- ✅ **Selected Notes autocomplete in settings:** Working as expected.
- ⏳ **Section headings:** Patch to use `var(--h2-size)` and theme heading variables applied; pending user verification.
- ⏳ **Markdown stripping in Content column:** Not yet fully stripping all markdown/image/file links; patch in progress.
- ⏳ **Lost Segments metric:** Still shows 1–10 range; update to fixed integer in progress.
- 🆕 **Planned:** Settings callout preview/copy feature and Metric Descriptions section added to roadmap.
- 🆕 **Planned:** Performance optimizations and new feature requests added to roadmap.

---

## Known Issues & Testing

- [x] Backup Folder autocomplete now works as expected.
- [ ] Selected Notes autocomplete in modal does not list files (should match settings field behavior).
- [ ] No backup is created when scraping, even if enabled and folder is set.
- [ ] Markdown/image/file links not fully stripped from Content column.
- [ ] Lost Segments metric still shows 1–10 range (should be integer).
- [ ] Section headings patch pending user verification.
- [ ] Performance optimizations pending implementation and testing.

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