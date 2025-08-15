# OneiroMetrics Development Roadmap

## Table of Contents
- [Current Focus](#current-focus)
  - [Custom Date Tools UI Enhancements](#custom-date-tools-ui-enhancements)
- [Planned Features](#planned-features)
  - [Custom Date Tools System](#custom-date-tools-system)
  - [Journal Structure Check](#journal-structure-check)
  - [Metrics System](#metrics-system)
  - [User Experience](#user-experience)
    - [UI/UX Improvements](#uiux-improvements)
  - [Performance](#performance)
  - [Integration](#integration)
- [Future Considerations](#future-considerations)
  - [Advanced Time Filter Features](#advanced-time-filter-features)
  - [Documentation Maintenance](#documentation-maintenance)
- [Potential Future Features](#potential-future-features)
  - [Dream Analysis Features](#dream-analysis-features)
    - [Dream Sequence Visualization](#dream-sequence-visualization)
    - [Temporal Analysis](#temporal-analysis)
    - [Pattern Recognition](#pattern-recognition)
    - [Statistical Analysis](#statistical-analysis)
- [Notes](#notes)
- [Custom Date Filter Improvements](#custom-date-filter-improvements)

## Current Focus

### OneiroMetrics Dashboard Migration
- Transform static HTML metrics into native Obsidian ItemView
- Implement virtual scrolling for performance
- Add real-time updates without manual refresh
- Preserve all existing functionality during migration

See [OneiroMetrics Dashboard Migration Plan](./features/oneirometrics-dashboard.md) for detailed implementation strategy.

### Frontmatter Properties Integration
- Enable metrics storage in frontmatter properties
- Support both compact and expanded YAML formats
- Maintain backward compatibility with callouts
- Enable Dataview queries on metrics

See [Frontmatter Properties Support](./features/frontmatter-properties-support.md) for technical specifications.

### Custom Date Tools UI Enhancements
- Calendar preview optimization
- Accessibility improvements
- Mobile responsiveness
- Theme compatibility
- Performance optimization

## Planned Features

### Custom Date Tools System
- [x] Basic date range UI
- [ ] Calendar preview
- [ ] Accessibility features
- [ ] Mobile optimization
- [ ] Custom date range presets
- [ ] Multi-month calendar view
- [ ] Week numbers in calendar
- [ ] Date range comparison
- [ ] Advanced filtering options

See [Date & Calendar Features](../archive/planning/features/2025-completed/date-calendar-unified.md) for detailed implementation specifications.

### Journal Structure Check
- [x] ~~Basic structure validation~~ (**COMPLETED in Journal Structure Integration 2025**)
- [x] ~~Metrics list ordering~~ (**COMPLETED**)
- [x] ~~Content isolation~~ (**COMPLETED**)
- [x] ~~Quick fixes~~ (**COMPLETED**)
- [x] ~~Settings UI~~ (**COMPLETED**)
- [x] ~~Linter plugin integration~~ (**COMPLETED**)

> **✅ COMPLETED**: Journal Structure functionality has been fully implemented as part of the [Journal Structure Integration Project 2025](../archive/planning/features/journal-structure-integration-2025.md).
> 
> **🚀 NEXT PHASE**: Advanced features now tracked in [Smart Journal Analysis 2025](../archive/planning/features/2025-completed/smart-journal-analysis-2025.md) including auto-detection, content analysis, and migration tools.

See [Journal Structure Guidelines](../user/guides/journal-structure.md) for structure rules and best practices.

### Metrics System
- [ ] Enhanced metrics visualization
- [ ] Custom metric types
- [ ] Metric templates
- [ ] Batch operations
- [ ] Lucide Icon Picker integration

See [Metrics Enhancements Plan](./features/metrics-enhancements.md) for detailed implementation specifications.

### User Experience
- [ ] Improved settings organization
- [ ] Better error messages
- [ ] More keyboard shortcuts
- [ ] Enhanced documentation
- [ ] Unified Dream Journal Manager modal with tabbed interface
  - [ ] Consolidate Dream Scrape and Journal Structure Settings modals
  - [ ] Implement Dashboard with quick actions
  - [ ] Add Usage & Help modal system for in-app documentation
- [ ] UI/UX improvements
  - [ ] Modern interface elements
  - [ ] Better visual hierarchy
  - [ ] Improved navigation
  - [ ] Enhanced feedback
- [ ] Structure import/export to Journal Structure wizard
- [ ] Dream pattern detection to OneiroMetrics note
- [ ] Metric trend visualizations to OneiroMetrics note
- [ ] Mobile-friendly quick entry mode

See [Dream Journal Manager Plan](./features/dream-journal-manager.md) for detailed implementation specifications of the unified modal system.

### Performance
- [ ] Optimize validation engine
- [ ] Improve rendering performance
- [ ] Reduce memory usage
- [ ] Better caching strategies
- [ ] Lazy loading for large datasets
- [ ] Calendar preview optimization
- [ ] Time filter state management
- [ ] Large template collections optimization (50+ templates)
- [ ] Complex Templater script performance analysis
- [ ] Modal rendering optimization for multiple tabs
- [ ] Memory usage analysis for wizard states

### Integration
- [ ] Dataview compatibility
- [ ] Calendar plugin integration
- [ ] Graph view enhancements
- [ ] Export/Import functionality

## Future Considerations

### Oneirograph - Advanced Dream Network Visualization
- Force-directed graph visualization of dream connections
- Interactive exploration with zoom, pan, and filtering
- Automatic theme clustering and character networks
- Temporal pattern analysis
- Integration with existing metrics system

See [Oneirograph Planning Document](./features/oneirograph.md) for the complete vision.

### AI-Powered Features
- AI-powered suggestions
- Advanced rule creation
- Custom visualization options
- Mobile optimization

### Advanced Time Filter Features
- Pattern recognition
- Trend analysis
- Custom date range templates
- Export/import date ranges
- **Possible TODO:** Allow user-defined custom presets to appear in the dropdown alongside built-in presets

### Documentation Maintenance
- Consider deleting archived documentation files from `docs/archive/legacy/` after thorough testing period
  - Verify all content has been properly migrated
  - Ensure no important historical context or information has been lost
  - Confirm users and contributors have adapted to the new documentation structure
  - Target timeframe: 3-6 months after documentation reorganization completion

## Potential Future Features

These features are under consideration but not yet planned for implementation. They represent areas of potential expansion based on user needs and technical feasibility.

### Dream Analysis Features
- **Dream Sequence Visualization**
  - Interactive timeline visualization of dream sequences
  - Visual representation of dream transitions and scenes
  - Support for multiple parallel timelines
  - Color-coding based on emotional states or themes

- **Temporal Analysis**
  - Time-based pattern detection across dreams
  - Analysis of dream frequency and timing
  - Correlation with external events or activities
  - Long-term trend visualization

- **Pattern Recognition**
  - Automated detection of recurring themes
  - Symbol and motif tracking across dreams
  - Emotional pattern analysis
  - Location and setting correlations

- **Statistical Analysis**
  - Advanced metric correlation analysis
  - Custom statistical visualizations
  - Export capabilities for external analysis
  - Comparative analysis tools

## Notes
- Features are listed in approximate order of implementation
- Priorities may shift based on user feedback
- Some features may be combined or split during development
- All features are subject to change

For details about the date tools implementation, see [Date & Calendar Features](../archive/planning/features/2025-completed/date-calendar-unified.md).

### Custom Date Filter Improvements
- [ ] Multi-month view
- [ ] Week numbers
- [ ] Preview optimization
- [ ] Favorites editing
- [ ] Tooltips
- [ ] Empty state

## Related Documentation
- [Usage Guide](../user/guides/usage.md)
- [Metrics Reference](../user/reference/metrics.md)
- [Architecture Overview](../developer/architecture/overview.md)
- [Implementation Details](../developer/implementation/)
- [OneiroMetrics Dashboard Migration](./features/oneirometrics-dashboard.md)
- [Frontmatter Properties Support](./features/frontmatter-properties-support.md)
- [Oneirograph Vision](./features/oneirograph.md)

## TODOs and Technical Debt

### Documentation Priorities
- [ ] **Architectural Documentation**
  - [ ] Component interaction diagrams
  - [ ] Data flow documentation
  - [ ] API reference for developers
- [ ] **End User Documentation**
  - [ ] Step-by-step wizard tutorials
  - [ ] Template creation best practices
  - [ ] Troubleshooting common issues

### Build Process Improvements
- [ ] **Bundle optimization** - Reduce plugin file size
- [ ] **Development workflow** - Hot reload, faster builds
- [ ] **Asset management** - Optimize CSS, compress images
- [ ] **Deployment automation** - Automated releases, changelog generation

### Performance Optimization Areas
- [ ] **Large template collections** - Handle 50+ templates efficiently
- [ ] **Complex Templater scripts** - Profile templates with heavy JavaScript
- [ ] **Modal rendering** - Optimize initial load with many tabs
- [ ] **Memory usage** - Analyze keeping multiple wizard states in memory

### Error Handling Improvements
- [ ] **Templater plugin disabled** - Graceful degradation
- [ ] **Template file corruption** - Handle malformed template files
- [ ] **Settings corruption** - Recover from broken plugin settings
- [ ] **Network issues** - Handle templates referencing external resources
- [ ] **Permission errors** - File system access issues

### Testing & Quality Assurance
- [ ] **Developer Tools Tab** in Hub Modal
  - [ ] Component Tests - Test wizard navigation, template creation, validation
  - [ ] Integration Tests - Test Templater integration, settings persistence
  - [ ] UI Tests - Test responsive behavior, accessibility features
  - [ ] Data Tests - Test template parsing, metric extraction
  - [ ] Performance Tests - Measure modal load times, large template handling
- [ ] **Accessibility Testing**
  - [ ] Keyboard navigation audit
  - [ ] Screen reader support verification
  - [ ] Color contrast compliance check
  - [ ] Focus management review
  - [ ] Error messaging accessibility
- [ ] **Mobile/Responsiveness Testing**
  - [ ] Responsive breakpoint testing
  - [ ] Touch target size verification
  - [ ] Modal behavior on small screens
  - [ ] Text readability assessment
  - [ ] Navigation usability review

---

*Last updated: May 2025* 