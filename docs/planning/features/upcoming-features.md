# Upcoming Features

> **Last Updated:** 2025-05-21  
> This document outlines features planned for future releases of OneiroMetrics.

## 📑 Table of Contents

- [Feature Roadmap](#feature-roadmap)
  - [Coming Soon (Next 1-2 Releases)](#coming-soon-next-1-2-releases)
  - [Medium-Term Plans (3-6 Months)](#medium-term-plans-3-6-months)
  - [Long-Term Vision (6+ Months)](#long-term-vision-6-months)
- [Experimental Features](#experimental-features)
  - [AI Integration (Experimental)](#ai-integration-experimental)
  - [Virtual Reality Visualization (Concept)](#virtual-reality-visualization-concept)
- [Feature Requests](#feature-requests)
- [Implementation Notes](#implementation-notes)
  - [Backward Compatibility](#backward-compatibility)
  - [Performance Considerations](#performance-considerations)
- [Related Documentation](#related-documentation)

---

## Feature Roadmap

The OneiroMetrics team is working on several exciting enhancements. While we can't guarantee specific timelines, this roadmap provides insight into our priorities and direction.

### Coming Soon (Next 1-2 Releases)

#### OneiroMetrics Dashboard
- **Native Obsidian View**: Transform static HTML metrics into performant ItemView
- **Real-time Updates**: Instant updates without manual refresh
- **Virtual Scrolling**: Handle thousands of entries smoothly
- **Persistent State**: Remember filters, expanded rows, and view preferences

> See [OneiroMetrics Dashboard Migration Plan](./oneirometrics-dashboard.md) for detailed implementation strategy.

#### Frontmatter Properties Support
- **Property Mapping**: Map metrics to Obsidian frontmatter properties
- **Multi-format Support**: Handle both compact and expanded YAML arrays
- **Dataview Integration**: Enable powerful queries through frontmatter
- **Backward Compatibility**: Maintain existing callout-based system

> See [Frontmatter Properties Support](./frontmatter-properties-support.md) for technical details.

#### Enhanced Date Tools
- **Multi-month Calendar View**: View and select dates across multiple months
- **Week Numbers**: Display week numbers in the calendar for better reference
- **Favorites Management**: Edit and organize saved date range favorites
- **Pattern Detection**: Basic pattern detection based on day of week and time of month

#### Metrics Visualization
- **Basic Charts**: Visual representations of metrics over time
- **Trend Lines**: Show trends in specific metrics
- **Heatmaps**: Calendar heatmaps showing dream frequency and intensity
- **Exportable Images**: Export visualizations for sharing or external use

#### Performance Improvements
- **Optimized Table Rendering**: Faster loading and scrolling for large datasets
- **Memory Usage Reduction**: Lower memory footprint for better performance
- **Background Processing**: Run intensive operations in the background
- **Batch Processing**: Process large journals in smaller batches

### Medium-Term Plans (3-6 Months)

#### Dream Journal Manager Enhancements
- **Dashboard View**: At-a-glance insights about your dream journal
- **Quick Entry**: Streamlined interface for recording new dreams
- **Batch Operations**: Apply changes to multiple entries at once
- **Advanced Search**: Find dreams by content, metrics, and other criteria

#### Advanced Metrics System
- **Categorical Metrics**: Support for non-numerical metrics (e.g., dream themes)
- **Conditional Metrics**: Metrics that appear based on other values
- **Metric Sets**: Group metrics into sets for different tracking purposes
- **Smart Suggestions**: Get metric suggestions based on dream content

#### Integration Improvements
- **DataView Integration**: Better compatibility with DataView plugin
- **Calendar Plugin Support**: Enhanced integration with Calendar plugin
- **Custom CSS API**: Hooks for theme developers to style OneiroMetrics elements
- **Mobile Optimization**: Improved experience on mobile devices

### Long-Term Vision (6+ Months)

#### Oneirograph - Advanced Dream Visualization
- **Force-Directed Graph**: Interactive network visualization of dream connections
- **Theme Clustering**: Automatic grouping of related dreams by themes
- **Character Networks**: Visualize relationships between dream characters
- **Temporal Patterns**: Show how dream themes evolve over time
- **Interactive Exploration**: Click, zoom, and filter dream networks

> See [Oneirograph Planning Document](./oneirograph.md) for the complete vision.

#### Dream Analysis Features
- **Dream Sequence Visualization**: Interactive timeline of dream sequences
- **Parallel Timeline Support**: Track multiple concurrent storylines
- **Emotional Mapping**: Visual representation of emotional states in dreams
- **Character Network Analysis**: Map relationships between dream characters

#### Advanced Pattern Recognition
- **Correlation Analysis**: Identify correlations between metrics and external factors
- **Dream Signs Detection**: Automatically identify recurring dream signs
- **Theme Analysis**: Detect common themes across dream entries
- **Predictive Insights**: Suggest potential patterns based on historical data

#### Community Features
- **Template Sharing**: Platform for sharing templates with the community
- **Anonymized Research**: Opt-in contribution to dream research (with full privacy)
- **Metric Set Sharing**: Exchange custom metric configurations
- **Community Dashboards**: Compare your patterns with anonymous aggregates

## Experimental Features

These features are under consideration but may change significantly or might not be implemented:

### AI Integration (Experimental)
- **Content Suggestions**: Optional AI assistance for dream description
- **Metric Suggestions**: AI-recommended metrics based on dream content
- **Theme Detection**: AI-assisted identification of dream themes
- **Privacy-Focused**: All processing done locally, no data sharing

### Virtual Reality Visualization (Concept)
- **3D Dream Mapping**: Experimental visualization of dream environments
- **Spatial Relationship Tracking**: Map physical relationships in dreams
- **Movement Patterns**: Track movement and transitions in dreams

## Feature Requests

We welcome community input on feature priorities. To suggest features:

1. Check if your idea is already on the roadmap
2. Submit a feature request on our GitHub repository
3. Include use cases and why the feature would be valuable

Features are prioritized based on:
- User demand and feedback
- Technical feasibility
- Alignment with our vision for OneiroMetrics
- Development resources available

## Implementation Notes

### Backward Compatibility

All new features are designed with backward compatibility in mind:
- Existing journal entries and formats will continue to work
- Older plugin versions will maintain core functionality
- Data migration tools will be provided when necessary

### Performance Considerations

As we add features, we remain committed to excellent performance:
- Large dream journals must remain responsive
- Mobile devices are considered in design decisions
- Memory usage is carefully monitored
- Features can be selectively enabled/disabled

---

*Note: This roadmap represents our current plans and is subject to change based on user feedback, technical considerations, and development resources. Not all features will necessarily be implemented exactly as described.*

## Related Documentation

- [Project Roadmap](../roadmap.md): High-level project direction
- [OneiroMetrics Dashboard](./oneirometrics-dashboard.md): Dashboard migration plan
- [Frontmatter Properties Support](./frontmatter-properties-support.md): Frontmatter integration plan
- [Oneirograph](./oneirograph.md): Advanced visualization planning
- [Date & Calendar Features](../../archive/planning/features/2025-completed/date-calendar-unified.md): Unified plan for date-related functionality
- [Metrics Enhancements Plan](./metrics-enhancements.md): Metrics system improvements
- [Dream Journal Manager Plan](./dream-journal-manager.md): Dream Journal Manager enhancements 