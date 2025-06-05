# Metrics Charts Enhancement Plan

## 📑 Table of Contents

- [Overview](#overview)
- [Core Feature: Chart Visualization](#core-feature-chart-visualization)
- [Implementation Plan](#implementation-plan)
- [Future Considerations](#future-considerations)

---

## Overview
This document outlines the plan to enhance OneiroMetrics with chart-based visualization, focusing on a tab-based interface that extends the existing Current Statistics table with interactive charts.

## Core Feature: Chart Visualization

### UI Design
**Tab-Based Navigation**
- Horizontal tab navigation above the Current Statistics table
- **"Statistics" tab**: Current table view (existing functionality)
- **Chart tabs**: Various chart visualizations
  - "Trends" tab: Line charts for time-based metrics
  - "Compare" tab: Bar charts for metric comparison
  - "Correlations" tab: Scatter plots for relationship analysis
  - "Heatmap" tab: Heat map for pattern visualization

### Chart Types

#### 1. Trend Charts (Line Charts)
**Purpose**: Visualize metric values over time
- **Data**: Time series of individual metrics
- **Features**:
  - Multiple metric lines on same chart
  - Date range selection
  - Interactive tooltips showing exact values
  - Zoom/pan functionality
  - Legend toggle for showing/hiding metrics

#### 2. Comparison Charts (Bar Charts)
**Purpose**: Compare current values across metrics
- **Data**: Current metric values or averages over selected period
- **Features**:
  - Horizontal or vertical bars
  - Sorting options (value, alphabetical)
  - Color coding by metric category
  - Value labels on bars

#### 3. Correlation Charts (Scatter Plots)
**Purpose**: Analyze relationships between metrics
- **Data**: Paired metric values across time
- **Features**:
  - X/Y axis metric selection
  - Trend line overlay
  - Point clustering
  - Date-based color coding

#### 4. Pattern Heatmaps
**Purpose**: Visualize metric patterns over calendar periods
- **Data**: Metric values mapped to calendar grid
- **Features**:
  - Month/week/day view options
  - Color intensity based on values
  - Hover details
  - Multiple metric overlay

### Technical Implementation

#### Technology Stack
- **Chart Library**: Chart.js (lightweight, good Obsidian integration)
- **Responsive Design**: Mobile-friendly tabs and charts
- **Theme Integration**: Automatic light/dark theme detection
- **Export**: PNG/SVG export functionality

#### Component Structure
```typescript
interface ChartTabConfig {
    id: string;
    label: string;
    chartType: 'line' | 'bar' | 'scatter' | 'heatmap';
    defaultMetrics: string[];
    settings: ChartSettings;
}

interface ChartSettings {
    dateRange: DateRange;
    selectedMetrics: string[];
    display: {
        showLegend: boolean;
        showTooltips: boolean;
        responsive: boolean;
    };
    export: {
        format: 'png' | 'svg';
        filename: string;
    };
}
```

#### Integration Points
- **Current Statistics Table**: Preserve existing functionality in "Statistics" tab
- **Metrics Data**: Use existing DreamMetric data structure
- **Date Filtering**: Integrate with existing date range filters
- **Settings**: Extend existing settings for chart preferences

## Implementation Plan

### Phase 1: Core Infrastructure (2-3 weeks)
1. **Tab Navigation System**
   - Create horizontal tab component above statistics table
   - Implement tab switching logic
   - Preserve statistics table in first tab

2. **Chart.js Integration**
   - Add Chart.js dependency
   - Create base chart component
   - Implement theme integration

3. **Basic Line Chart (Trends Tab)**
   - Single metric trend visualization
   - Date range integration
   - Basic interactions (tooltips, legend)

### Phase 2: Chart Expansion (2-3 weeks)
1. **Multi-Metric Trends**
   - Multiple lines on same chart
   - Metric selection interface
   - Color coding system

2. **Bar Charts (Compare Tab)**
   - Current values comparison
   - Sorting and filtering
   - Value labels and formatting

3. **Basic Export Functionality**
   - PNG export for charts
   - Filename generation

### Phase 3: Advanced Features (2-3 weeks)
1. **Scatter Plots (Correlations Tab)**
   - X/Y axis metric selection
   - Trend line calculations
   - Point interactions

2. **Heatmaps (Pattern Tab)**
   - Calendar-based visualization
   - Color intensity mapping
   - Period selection (month/week)

3. **Enhanced Interactions**
   - Zoom/pan for line charts
   - Chart settings modal
   - SVG export option

### Phase 4: Polish & Optimization (1-2 weeks)
1. **Mobile Optimization**
   - Touch-friendly interactions
   - Responsive tab navigation
   - Chart scaling

2. **Performance Optimization**
   - Data caching
   - Lazy loading
   - Chart rendering optimization

3. **User Testing & Refinement**
   - Gather feedback
   - UI/UX improvements
   - Bug fixes

## Future Considerations

### Advanced Visualization Features
- **Comparative Calendar Views**
  - Side-by-side calendar comparison
  - Overlapping date ranges
  - Interactive date selection

- **Pattern Analysis**
  - Recurring theme detection
  - Statistical significance markers
  - Anomaly detection

- **Advanced Chart Types**
  - Radar charts for multi-dimensional analysis
  - Sankey diagrams for flow visualization
  - Box plots for distribution analysis

### Extended Functionality
- **Custom Metric Types** (from original plan)
- **Metric Templates** (from original plan)
- **Batch Operations** (from original plan)
- **Lucide Icon Picker Integration** (from original plan)

## Testing Requirements

### Functional Testing
- Tab navigation functionality
- Chart rendering across themes
- Data accuracy in visualizations
- Export functionality
- Mobile responsiveness

### User Experience Testing
- Chart readability
- Interaction intuitiveness
- Performance with large datasets
- Cross-browser compatibility

## Notes
- **Backward Compatibility**: Statistics table functionality remains unchanged
- **Progressive Enhancement**: Charts enhance but don't replace existing features
- **Performance**: Monitor impact on plugin load times
- **Accessibility**: Ensure charts work with screen readers where possible
- **Mobile First**: All charts must work well on mobile devices

---

*Last updated: January 2025* 