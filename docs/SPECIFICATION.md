# Dream Metrics Plugin Specification

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Features](#features)
4. [Technical Architecture](#technical-architecture)
5. [Technical Requirements](#technical-requirements)
6. [Security Considerations](#security-considerations)
7. [CSS Organization and Approach](#6-css-organization-and-approach)
8. [Expand/Collapse ("Read more") Functionality](#7-expandcollapse-read-more-functionality)
9. [Performance Considerations](#performance-considerations)
10. [Future Considerations](#future-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Recent Fixes](#recent-fixes)

## Overview

The Dream Metrics plugin is designed to help users track and analyze metrics from their dream journal entries in Obsidian. This document outlines the technical specifications and implementation details.

## Core Components

### 1. Plugin Structure

```
dream-metrics/
├── main.ts              # Main plugin logic
├── settings.ts          # Settings management
├── types.ts            # TypeScript interfaces
├── styles.css          # Custom styling
├── manifest.json       # Plugin metadata
├── package.json        # NPM configuration
├── esbuild.config.mjs  # Build configuration
└── docs/              # Documentation
```

### 2. Data Structures

#### DreamMetric Interface
```typescript
interface DreamMetric {
    name: string;
    icon: string;        // Lucide icon identifier
    range: {
        min: number;
        max: number;
    };
    description: string;
}
```

#### DreamMetricsSettings Interface
```typescript
interface DreamMetricsSettings {
    projectNotePath: string;
    metrics: DreamMetric[];
    selectedNotes: string[];
    calloutName: string;
    weekStartDay: number;  // 0-6, where 0 is Sunday
    overrideReadableLineLength: boolean;
}
```

#### DreamMetricData Interface
```typescript
interface DreamMetricData {
    date: string;
    title: string;
    content: string;
    wordCount: number;
    metrics: {
        [key: string]: number;
    };
}
```

### 3. Callout Format

Dream metrics are stored in Obsidian callout blocks with the following format:

```markdown
> [!dream-metrics]
> Metric1: value1, Metric2: value2, ...
```

Example:
```markdown
> [!dream-metrics]
> Words: 343, Sensory Detail: 3, Emotional Recall: 3, Lost Segments: 3, Descriptiveness: 4, Confidence Score: 4
```

### 4. Project Note Format

The project note is generated with two main sections:

#### Summary Section
```markdown
# Dream Metrics Summary

| Metric | Average | Min | Max | Count |
|--------|---------|-----|-----|-------|
| Metric1 | 3.5 | 1 | 5 | 10 |
| Metric2 | 4.2 | 2 | 5 | 10 |
```

#### Detailed Section
```markdown
# Dream Entries

| Date | Title | Words | Content | Metric1 | Metric2 | ... |
|------|-------|-------|---------|---------|---------|-----|
| 2025-05-08 | Dream Title | 343 | [Preview] | 4 | 3 | ... |
```

## Features

### 1. Settings Management
- Project note path configuration with smart file suggestions
- Multi-chip autocomplete for note selection
- Custom metric definitions with validation
- Callout name customization
- Real-time validation feedback
- Metric icon picker with Lucide icons
- Week start day configuration
- Readable line length override toggle

### 2. Metric Scraping
- Regex-based callout detection
- Key-value pair parsing
- Date and title extraction
- Metric validation
- Content cleaning for markdown elements
- Automatic backup system with .bak extension

### 3. Data Presentation
- Responsive table layout
- Full-width sections (overrides readable line length)
- Optimized column widths:
  - Date: 8%
  - Title: 15%
  - Words: 7%
  - Content: 30%
  - Metrics: 8% each
- Expandable/collapsible content preview
- Center-aligned numeric metrics
- Sortable columns
- Date range and metric filtering
- 'This Week' filter with configurable start day

### 4. File Suggestion System
- Smart path matching for:
  - Spaces, dashes, underscores
  - Case-insensitive matching
  - Year-based paths (e.g., "2025" → "Journals/2025/2025.md")
- Multi-chip autocomplete for note selection
- Real-time validation and feedback

### 5. Accessibility Features
- Full keyboard navigation support
- Screen reader compatibility
- ARIA labels and roles
- Focus management
- Keyboard shortcuts for common actions

### 5. Table Virtualization for Performance

- The Dream Entries table uses vanilla JavaScript virtualization to efficiently handle large datasets.
- Only **12 rows** are rendered in the DOM at any given time (reduced from 25 for better performance and responsiveness); as the user scrolls, the visible window of rows is updated.
- Spacer rows are used above and below the visible rows to maintain correct scroll height and scrollbar behavior.
- A debounced scroll event handler recalculates and renders the visible rows as needed.
- **Scroll logic ensures that expanding/collapsing a row keeps the view stable and prevents jumping beneath the table.**
- This approach significantly reduces DOM size and memory usage, improving responsiveness and scalability for large dream journals.

## Technical Architecture

### Core Components
1. **Data Management**
   - Dream entry parsing
   - Metric extraction
   - Data storage and retrieval
   - State management
   - See [State Persistence](STATE_PERSISTENCE.md) for user preference management

2. **Date Handling Strategy**
   - See [Date and Time Technical Specification](DATE_TIME_TECHNICAL.md) for detailed implementation
   - Block references as primary date source
   - Fallback date formats
   - Time filter system
   - Calendar integration

## Technical Requirements

### 1. Obsidian API
- Minimum version: 0.15.0
- Required API features:
  - Vault access
  - File operations
  - UI components
  - Settings management
  - Markdown parsing
  - Theme integration
  - Keyboard event handling

### 2. Development Environment
- Node.js
- TypeScript
- esbuild
- Obsidian plugin development tools
- Lucide icons library

### 3. Build Process
- TypeScript compilation
- CSS processing
- Bundle optimization
- Source map generation

### 4. Documentation Requirements
- [Date and Time Technical Specification](DATE_TIME_TECHNICAL.md) for date handling implementation
- [Layout and Styling Technical Specification](LAYOUT_AND_STYLING.md) for UI/UX implementation
- [Testing Guide](TESTING.md) for testing procedures
- [Project Overview](PROJECT_OVERVIEW.md) for high-level architecture
- [Issues and Future Improvements](ISSUES.md) for known issues and planned features
- [Logging System](docs/LOGGING.md) for debugging and monitoring capabilities

## Security Considerations

*For full details on privacy, data protection, and user controls, see [SECURITY.md](../SECURITY.md).*

1. **File Access**
   - Only access files specified by the user
   - Validate file paths
   - Handle missing files gracefully
   - Automatic backup system with .bak extension

2. **Data Validation**
   - Validate metric values against defined ranges
   - Sanitize user input
   - Handle malformed callouts
   - Real-time validation feedback

3. **Error Handling**
   - Graceful degradation
   - User-friendly error messages
   - Logging for debugging
   - Backup restoration options

## CSS Organization and Approach

- The plugin uses CSS custom properties (variables) extensively for theme compatibility, spacing, colors, and sizing, enabling easy adaptation to Obsidian themes and user preferences.
- The `styles.css` file is organized into clearly marked sections, each dedicated to a major UI component or concern (e.g., tables, buttons, modals, accessibility, responsive design).
- Sections are ordered to reflect the structure of the UI: base/reset styles first, followed by layout, tables, buttons, content, modals, utilities, accessibility, and responsive overrides.
- During the refactoring process, component stylesheets were used temporarily to aid modularity, clarity, and testing, but all styles are now consolidated in `styles.css` for production use.

## Expand/Collapse ("Read more") Functionality

- **Purpose:** Allows users to preview a truncated version of dream content in the table and expand to view the full entry, improving readability and reducing visual clutter.
- **UI Behavior:**
  - By default, only a preview (first N characters or lines) of the dream content is shown in the table.
  - Clicking the "Read more" button expands the content to show the full entry and changes the button text to "Show less."
  - Clicking "Show less" collapses the content back to the preview.
- **Accessibility:**
  - The expand/collapse button uses `aria-expanded` and descriptive `aria-label` attributes for screen reader compatibility.
  - Keyboard navigation is supported; the button is focusable and can be toggled with Enter/Space.
- **Implementation:**
  - CSS classes are used to toggle the visibility of the preview and full content sections within each row.
  - The expand/collapse state is managed per row, not globally, and is preserved as rows are re-rendered during virtualization.
  - The logic is compatible with the table virtualization system, ensuring that expand/collapse works seamlessly as the user scrolls through large datasets.

- Each row in the Dream Entries table includes a "Show more"/"Show less" button to expand or collapse the full dream content.
- **Event handling is split:**
  - In the virtualized table (settings modal and interactive UI), event listeners are attached only to the currently visible rows when they are rendered.
  - In the static project note table (rendered as HTML in the main note), a minimal event handler attaches listeners to all expand/collapse buttons after the table is rendered or updated.
- This ensures reliable expand/collapse behavior, prevents duplicate or lost listeners, and keeps performance high even with large tables.
- The scroll logic is designed so that expanding a row scrolls it into view if needed, but never scrolls past the end of the table or causes the viewport to jump unexpectedly.

## Performance Considerations

1. **File Operations**
   - Efficient file reading
   - Batch processing for multiple notes
   - Caching where appropriate
   - Optimized content cleaning

2. **UI Responsiveness**
   - Asynchronous operations
   - Progress indicators
   - Non-blocking UI updates
   - Optimized table rendering
   - Efficient icon rendering

3. **Memory Management**
   - Efficient content preview handling
   - Optimized table data structures
   - Smart caching strategies
   - Icon resource management

## Future Considerations

1. **Potential Dream Analysis Features**
   - **Dream Sequence Visualization**
     - Interactive timeline implementation
     - Scene transition detection
     - Parallel timeline support
     - Theme-aware color coding
     - Performance with large datasets
     - Mobile responsiveness

   - **Temporal Analysis**
     - Time series data processing
     - Pattern detection algorithms
     - External event correlation
     - Long-term data storage
     - Performance optimization
     - Data visualization techniques

   - **Pattern Recognition**
     - Natural language processing
     - Theme detection algorithms
     - Symbol tracking system
     - Emotional state analysis
     - Location correlation
     - Performance with large datasets

   - **Statistical Analysis**
     - Advanced metric correlation
     - Custom visualization engine
     - Data export formats
     - Comparative analysis tools
     - Performance optimization
     - Mobile-friendly displays

2. **Technical Improvements**
   - Advanced visualization engine
   - Pattern detection algorithms
   - Statistical analysis framework
   - Performance optimization
   - Memory usage optimization
   - Mobile device compatibility
   - Theme integration
   - Accessibility requirements

3. **User Support**
   - Enhanced documentation
   - Tutorial content
   - Community resources
   - Analysis guides
   - Pattern recognition tutorials
   - Statistical analysis examples

4. **Scalability**
   - Large vault support
   - Performance optimization
   - Memory management
   - Batch processing improvements
   - Data processing optimization
   - Visualization performance
   - Mobile responsiveness

## Testing Strategy

1. **Unit Tests**
   - Metric parsing
   - Data validation
   - File operations
   - Content cleaning
   - File suggestion logic
   - Icon picker functionality
   - Keyboard navigation

2. **Integration Tests**
   - Settings management
   - UI components
   - End-to-end workflows
   - Theme compatibility
   - Mobile responsiveness
   - Accessibility compliance

3. **User Testing**
   - Different vault sizes
   - Various note structures
   - Edge cases
   - Performance benchmarks
   - Accessibility testing 

## Recent Fixes (May 2025)
- The "Show more" button for dream content now reliably expands and collapses content in the Dream Entries table across all tested themes and with/without custom CSS snippets.
- All debug and backup log files are now stored in the `logs/` folder and excluded from version control.
- A temporary debug button ("Debug: Attach Show More Listeners") is available at the top of the project note to manually attach event listeners for expand/collapse buttons if needed. 