# OneiroMetrics Architecture Overview

<p align="center">
  <img src="../../images/gsa-barn.jpg" alt="A country barn painting, representing the foundation of dream journaling." width="600"/>
</p>
<p align="center"><em>"Barn at Sunrise" by Gary Armstrong, inspiration for OneiroMetrics</em></p>

## Project Description
OneiroMetrics is an Obsidian plugin designed to help users track and analyze their dreams. It provides tools for recording dream entries, analyzing dream patterns, and generating insights through various metrics and visualizations.

## Core Features
1. **Dream Entry Management**
   - Record and organize dream entries
   - Tag and categorize dreams
   - Search and filter dream content

2. **Metrics and Analysis**
   - Track dream patterns and themes
   - Generate insights from dream content
   - Visualize dream data through tables and charts

3. **Project Note Integration**
   - Display dream entries in a structured table
   - Show metrics summary
   - Provide interactive content expansion
   - **Date Tools:** Comprehensive suite for analyzing dream entries across time periods, including custom date filtering, multi-month calendar views, date range comparison, and pattern analysis.

4. **Templater Integration**
   - Standardized templates using Templater for dynamic content
   - Automatic static fallback for users without Templater installed
   - Interactive template creation with placeholders
   - Template wizard with dual preview (dynamic and static versions)
   - Smart placeholder navigation for template filling

5. **Settings and Customization**
   - Configure custom metrics
   - Customize display options
   - Manage dream entry sources

## Technical Architecture

### Frontend Components
1. **Modal System**
   - Base modal structure
   - Various modal variants (custom date, metrics, callout, etc.)
   - Accessibility features
   - Responsive design

2. **Table Components**
   - Dream entries table
   - Metrics summary table
   - Dream content display
   - Interactive buttons and controls

3. **Settings Interface**
   - Metric configuration
   - Icon selection
   - Drag and drop reordering
   - Custom date selection

### CSS Architecture
- Modular component-based structure
- BEM-like naming conventions
- CSS custom properties for theming
- Mobile-first responsive design
- Accessibility considerations

### File Organization
```
styles/
├── base/                  # Base styles and variables
│   ├── variables.css     # CSS custom properties
│   ├── reset.css         # CSS reset/normalization
│   └── typography.css    # Typography styles
├── components/           # Component-specific styles
│   ├── modals.css                # Modal system styles
│   ├── settings-metrics-drag-drop.css    # Metric reordering
│   ├── settings-metrics-icon-picker.css  # Icon picker
│   ├── tables-dream-content.css          # Dream content
│   ├── tables-dream-entries.css          # Dream entries
│   ├── tables-dream-entries-buttons.css  # Table buttons
│   └── tables-metrics-summary.css        # Metrics summary
└── styles.css            # Main stylesheet
```

## Key Features

### Metrics Extraction
- Automatically scrapes dream metrics from selected notes using configurable callouts
- Supports multiple metric formats and callout styles
- Processes nested callouts and extracts hierarchical data

### Dream Entries Table
- Displays a sortable, filterable table of dream entries
- Includes date, title (with clickable links), word count, and all configured metrics
- Features dream content column with expandable/collapsible preview and full text
- Optimizes column widths and alignment for better readability
- Center-aligns numeric metrics for easy scanning
- Provides full-width table layout that overrides readable line length

### Metrics Summary
- Shows averages, min/max, and counts for each metric
- Presents statistical insights about dream patterns
- Supports interactive filtering to update summaries

### Multi-Note Selection
- Select multiple notes to include in metrics scraping
- Uses a multi-chip autocomplete field for easy selection
- Maintains persistence of selected notes

### Settings and Configuration
- Configure project note path, callout name, and selected notes
- Modern, user-friendly UI with responsive design
- Comprehensive options for customizing the plugin behavior

### Data Handling and Security
- Project note is backed up before overwriting metrics tables
- Ensures user data integrity with reliable backup systems
- Implements safe update procedures for all data modifications

## Development Status

### Completed Features
- ✅ Core functionality implemented
- ✅ CSS refactoring completed
- ✅ Component organization improved
- ✅ Templater integration
- ✅ Enhanced filtering system
- ✅ UI improvements for consistency and usability
- ✅ New optional metrics added
- ✅ Metrics descriptions modal with improved layout
- ✅ Settings page overhaul with better organization
- ✅ Logging system with configurable levels

### In Progress
- ⏳ Performance optimization for large datasets
- ⏳ Comprehensive accessibility audit
- ⏳ Advanced date tools implementation
- ⏳ Documentation updates and improvements

## Recent Updates

### UI/UX Enhancements
- Optional metrics are now displayed in a collapsible section
- Dedicated metrics descriptions modal with landscape layout and improved table borders
- Settings page overhaul with visually distinct bordered sections
- Improved filtering system with date range selection and visual feedback
- Filter container with consistent styling and quick filter buttons with icons
- Better mobile responsiveness and enhanced accessibility features

### Technical Improvements
- Replaced non-existent events with correct Obsidian API events
- Enhanced logging for better debugging and troubleshooting
- Improved state management for filters and UI components
- Implemented robust date parsing for multiple formats
- Added ARIA attributes for better accessibility
- Enhanced error handling and debugging capabilities

## Testing Strategy
- Automated unit testing for core functions
- Manual integration testing for Obsidian API
- End-to-end testing for user workflows
- Performance testing for large datasets
- Cross-platform compatibility testing
- Theme compatibility testing

## Documentation
For more detailed information about specific aspects of the plugin, please refer to these documentation resources:

- [Metrics Reference](../../user/reference/metrics.md) - Detailed descriptions of all metrics
- [Usage Guide](../../user/guides/usage.md) - How to use the plugin
- [Templater Integration](../../user/guides/templater.md) - Working with Templater
- [State Management](../implementation/state.md) - How plugin state is managed
- [Testing Overview](../testing/testing-overview.md) - Testing procedures and guidelines
- [Date and Time Implementation](../implementation/date-time.md) - Technical details of date handling

## Related Documentation
- [Performance Testing](../testing/performance-testing.md)
- [UI Testing](../testing/ui-testing.md)
- [Accessibility Testing](../testing/accessibility-testing.md)
- [Contributing Guidelines](../contributing/code-standards.md) 