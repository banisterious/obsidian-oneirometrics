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

#### ✅ OneiroMetrics Dashboard (Complete)
- **Native Obsidian View**: Transform static HTML metrics into performant ItemView
- **Real-time Updates**: Instant updates without manual refresh
- **Virtual Scrolling**: Handle thousands of entries smoothly
- **Persistent State**: Remember filters, expanded rows, and view preferences

> See [OneiroMetrics Dashboard Migration Plan](../archived/oneirometrics-dashboard.md) for implementation details.

#### ✅ Frontmatter Properties Support (Complete)
- **Property Mapping**: Map metrics to Obsidian frontmatter properties
- **Multi-format Support**: Handle both compact and expanded YAML arrays
- **Dataview Integration**: Enable powerful queries through frontmatter
- **Backward Compatibility**: Maintain existing callout-based system

> See [Frontmatter Properties Support](../archived/frontmatter-properties-support.md) for technical details.

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

#### Dream Taxonomy & Oneirograph Integration
- **Hierarchical Dream Taxonomy**: Three-tier system (Clusters → Vectors → Themes)
- **Default Taxonomy**: 14 clusters with 300+ pre-defined themes
- **Customizable Structure**: Full drag-and-drop editing of taxonomy
- **Oneirograph Visualization**: Force-directed graph based on taxonomy structure
- **Progressive Disclosure**: Zoom from clusters to individual dreams
- **Theme Networks**: Visualize connections between related dreams
- **Interactive Exploration**: Click, zoom, filter, and navigate dream landscape

> See [Dream Taxonomy & Oneirograph Integration Plan](./dream-taxonomy-oneirograph-integration.md) for comprehensive implementation details.

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

#### Narrative Weaving (In Planning)
- **Dream-to-Narrative AI**: Transform dream collections into cohesive stories
- **Multiple Narrative Flows**: Thematic, Character Arc, Setting-Based, and Emotional Arc weaving
- **Local-First LLM Support**: Prioritizes local models (Ollama) over cloud APIs
- **Customizable Parameters**: Tone, style, and contradiction handling options
- **Template System**: Save and reuse narrative "recipes" for consistent storytelling
- **Real-time Generation**: Stream narrative output as it's generated
- **Privacy Protection**: Clear warnings and preferences for data handling

> **Implementation Status**: Planning phase complete. See [Narrative Weaving Implementation Plan](../implementation/narrative-weaving-implementation-plan.md) for detailed technical specifications, phased timeline, and architecture decisions.

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
- [Dream Taxonomy & Oneirograph Integration](./dream-taxonomy-oneirograph-integration.md): Comprehensive visualization and taxonomy plan
- [OneiroMetrics Dashboard](../archived/oneirometrics-dashboard.md): Dashboard migration plan (Complete)
- [Frontmatter Properties Support](../archived/frontmatter-properties-support.md): Frontmatter integration plan (Complete)
- [Date & Calendar Features](../../archive/planning/features/2025-completed/date-calendar-unified.md): Unified plan for date-related functionality
- [Metrics Enhancements Plan](./metrics-enhancements.md): Metrics system improvements
- [Dream Journal Manager Plan](./dream-journal-manager.md): Dream Journal Manager enhancements 