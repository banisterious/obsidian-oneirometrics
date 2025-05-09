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
}
```

#### DreamMetricData Interface
```typescript
interface DreamMetricData {
    date: string;
    title: string;
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

The project note is generated as a Markdown table with the following structure:

```markdown
# Dream Metrics

| Date | Title | Metric1 | Metric2 | ... |
|------|-------|---------|---------|-----|
| 2025-05-08 | Dream Journal | value1 | value2 | ... |
```

## Features

### 1. Settings Management
- Project note path configuration
- Custom metric definitions
- Note selection
- Callout name customization

### 2. Metric Scraping
- Regex-based callout detection
- Key-value pair parsing
- Date and title extraction
- Metric validation

### 3. Data Presentation
- Markdown table generation
- Sortable columns
- Custom styling
- Error handling

## Technical Requirements

### 1. Obsidian API
- Minimum version: 0.15.0
- Required API features:
  - Vault access
  - File operations
  - UI components
  - Settings management

### 2. Development Environment
- Node.js
- TypeScript
- esbuild
- Obsidian plugin development tools

### 3. Build Process
- TypeScript compilation
- CSS processing
- Bundle optimization
- Source map generation

## Security Considerations

1. **File Access**
   - Only access files specified by the user
   - Validate file paths
   - Handle missing files gracefully

2. **Data Validation**
   - Validate metric values against defined ranges
   - Sanitize user input
   - Handle malformed callouts

3. **Error Handling**
   - Graceful degradation
   - User-friendly error messages
   - Logging for debugging

## Performance Considerations

1. **File Operations**
   - Efficient file reading
   - Batch processing for multiple notes
   - Caching where appropriate

2. **UI Responsiveness**
   - Asynchronous operations
   - Progress indicators
   - Non-blocking UI updates

## Future Considerations

1. **Potential Enhancements**
   - Data visualization
   - Export functionality
   - Advanced filtering
   - Metric trends analysis

2. **Scalability**
   - Large vault support
   - Performance optimization
   - Memory management

## Testing Strategy

1. **Unit Tests**
   - Metric parsing
   - Data validation
   - File operations

2. **Integration Tests**
   - Settings management
   - UI components
   - End-to-end workflows

3. **User Testing**
   - Different vault sizes
   - Various note structures
   - Edge cases 