# OneiroMetrics Technical Specification

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Features](#features)
4. [Technical Architecture](#technical-architecture)
5. [Technical Requirements](#technical-requirements)
6. [Security Considerations](#security-considerations)
7. [CSS Organization and Approach](#css-organization-and-approach)
8. [Expand/Collapse Functionality](#expandcollapse-read-more-functionality)
9. [Performance Considerations](#performance-considerations)
10. [Future Considerations](#future-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Recent Updates](#recent-updates)
13. [UI Components](#ui-components)

## Overview

OneiroMetrics is an Obsidian plugin designed to analyze dream journal entries and provide detailed metrics and insights. This document outlines the technical specifications, requirements, and implementation details.

## Core Components

### 1. View Mode Requirements
OneiroMetrics is designed to work exclusively with Reading View mode in Obsidian. For detailed information about view mode requirements, limitations, and future enhancements, please refer to the [View Mode Requirements](../../user/guides/view-mode.md) document.

### 2. Plugin Structure

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

### 3. Data Structures

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

### 4. Callout Format

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

### 5. Project Note Format

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
- Quick access to settings via multiple entry points

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
- Optimized column widths
- Expandable/collapsible content preview
- Center-aligned numeric metrics
- Sortable columns
- Date range and metric filtering
- 'This Week' filter with configurable start day

### 4. File Suggestion System
- Smart path matching
- Multi-chip autocomplete for note selection
- Real-time validation and feedback

### 5. Accessibility Features
- Full keyboard navigation support
- Screen reader compatibility
- ARIA labels and roles
- Focus management
- Keyboard shortcuts for common actions

### 6. Table Virtualization for Performance
- Efficient handling of large datasets
- Only 12 rows rendered in the DOM at any time
- Spacer rows for proper scroll height
- Debounced scroll handling
- Stable view during expand/collapse operations

## Technical Architecture

### Core Components
1. **Data Management**
   - Dream entry parsing
   - Metric extraction
   - Data storage and retrieval
   - State management
   - See [State Persistence](../implementation/state.md) for user preference management

2. **Date Handling Strategy**
   - See [Date and Time Technical Specification](../implementation/date-time.md) for detailed implementation
   - Block references as primary date source
   - Fallback date formats
   - Date filtering system
   - Multi-month calendar
   - Date comparison tools
   - Pattern analysis

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
- [Date and Time Technical Specification](../implementation/date-time.md) for date handling implementation
- [Testing Guide](../testing/testing-overview.md) for testing procedures
- [Architecture Overview](overview.md) for high-level architecture
- [Logging System](../implementation/logging.md) for debugging and monitoring capabilities

## Security Considerations

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

- The plugin uses CSS custom properties (variables) extensively for theme compatibility
- The `styles.css` file is organized into clearly marked sections
- Sections are ordered to reflect the structure of the UI
- All styles are consolidated in `styles.css` for production use

## Expand/Collapse ("Read more") Functionality

- **Purpose:** Allows users to preview a truncated version of dream content in the table and expand to view the full entry
- **UI Behavior:**
  - By default, only a preview of the dream content is shown
  - Clicking the "Read more" button expands the content
  - Clicking "Show less" collapses the content back to the preview
- **Accessibility:**
  - Uses `aria-expanded` and descriptive `aria-label` attributes
  - Keyboard navigation is supported
- **Implementation:**
  - CSS classes toggle visibility of preview and full content
  - Expand/collapse state is managed per row
  - Compatible with table virtualization

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
   - Dream Sequence Visualization
   - Temporal Analysis
   - Pattern Recognition
   - Statistical Analysis

2. **Technical Improvements**
   - Advanced visualization engine
   - Pattern detection algorithms
   - Statistical analysis framework
   - Performance optimization
   - Mobile device compatibility
   - Theme integration
   - Accessibility enhancements

3. **User Support**
   - Enhanced documentation
   - Tutorial content
   - Community resources
   - Analysis guides

4. **Scalability**
   - Large vault support
   - Performance optimization
   - Memory management
   - Batch processing improvements
   - Data processing optimization

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

## Recent Updates
- Improved "Show more" button reliability
- Debug and backup log files now stored in `logs/` folder
- Added debug button for manually attaching event listeners
- Enhanced expand/collapse content functionality
- Improved performance with large datasets

## UI Components

### Scraping Modal

The Scraping Modal follows a consistent DOM structure with two-column rows, left-aligned labels/helpers, and right-aligned widgets to ensure consistency with Obsidian's settings UI and plugin conventions.

### Settings Interface

The Settings page provides a comprehensive interface for managing dream metrics and plugin configuration, with the following features:

- **Metrics Grouping:** Metrics displayed in Enabled and Disabled sections
- **Metric Editing:** Comprehensive editing modal with real-time validation
- **Adding Metrics:** Interface for creating new metrics
- **Organization:** UI designed to match Obsidian's settings conventions

## Related Documentation
- [Architecture Overview](overview.md)
- [State Management](../implementation/state.md)
- [Date and Time Implementation](../implementation/date-time.md)
- [Usage Guide](../../user/guides/usage.md)
- [Metrics Reference](../../user/reference/metrics.md) 