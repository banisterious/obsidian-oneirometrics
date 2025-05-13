# Dream Metrics Plugin Specification

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
- [Logging System](LOGGING.md) for debugging and monitoring capabilities

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