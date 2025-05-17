# CSS Refactoring

## Overview
This document outlines the CSS refactoring process for the OneiroMetrics plugin, focusing on improving organization, maintainability, and performance.

## Goals
- Improve CSS organization and maintainability
- Reduce specificity conflicts
- Optimize performance
- Enhance accessibility
- Improve responsive design
- Better documentation

## File Structure
```
styles/
├── base/                  # Base styles and variables
│   ├── variables.css     # CSS custom properties
│   ├── reset.css         # CSS reset/normalization
│   └── typography.css    # Typography styles
├── components/           # Component-specific styles
│   ├── modals.css                # Modal system styles
│   ├── settings-metrics-drag-drop.css    # Metric reordering in settings
│   ├── settings-metrics-icon-picker.css  # Icon picker in settings
│   ├── tables-dream-content.css          # Dream content display
│   ├── tables-dream-entries.css          # Dream entries table
│   ├── tables-dream-entries-buttons.css  # Dream entries table buttons
│   └── tables-metrics-summary.css        # Metrics summary table
└── styles.css            # Main stylesheet (imports all others)
```

## Component Organization

### Modals (`modals.css`)
- Base modal structure and states
- Modal content structure
- Modal actions (buttons)
- Modal variants (custom date, metrics, callout, icon picker, progress)
- Utility features (keyboard shortcuts)
- Responsive design
- Accessibility features

### Settings Components
- `settings-metrics-drag-drop.css`: Styles for metric reordering in settings
- `settings-metrics-icon-picker.css`: Styles for icon selection in custom metrics

### Table Components
- `tables-dream-content.css`: Dream content display and formatting
- `tables-dream-entries.css`: Dream entries table structure and layout
- `tables-dream-entries-buttons.css`: Expand/collapse buttons for dream content
- `tables-metrics-summary.css`: Metrics summary table styles

## Naming Conventions
- Use BEM-like naming: `.oom-component--variant`
- Prefix all classes with `oom-` to avoid conflicts
- Use semantic names that reflect component purpose
- Group related components with consistent prefixes

## CSS Custom Properties
- Define all colors, spacing, and other values as CSS variables
- Use semantic variable names
- Group related variables together
- Document variable purposes

## Media Queries
- Use mobile-first approach
- Define breakpoints as CSS variables
- Group media queries by feature
- Include accessibility media queries

## Accessibility
- Support high contrast mode
- Respect reduced motion preferences
- Ensure sufficient color contrast
- Maintain keyboard navigation support

## Performance Considerations

> **Note:** For detailed performance testing procedures and optimization guidelines, see [PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md).

### CSS Performance Optimization
- Minimize selector specificity
- Avoid unnecessary nesting
- Use efficient selectors
- Optimize transitions and animations

## Documentation
- Document component purposes
- Explain complex selectors
- Note accessibility features
- Document responsive behavior

## Testing
- Test across different themes
- Verify responsive behavior
- Check accessibility features
- Validate performance

## Migration Strategy
1. Create new file structure
2. Move and refactor styles
3. Update imports
4. Test thoroughly
5. Remove old files

## Progress Tracking
- [x] Create new file structure
- [x] Refactor component styles
- [x] Update imports
- [x] Test changes
- [x] Remove old files
- [x] Document all components (see DOCUMENTATION_STYLE_GUIDE.md)
- [x] Performance testing (see PERFORMANCE_TESTING.md)
- [x] Accessibility audit (see ACCESSIBILITY_TESTING.md)

> **Note:** All CSS refactoring tasks have been completed. Ongoing documentation, performance testing, and accessibility improvements are tracked in their respective documentation files. 