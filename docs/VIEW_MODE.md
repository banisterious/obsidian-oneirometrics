# OneiroMetrics View Mode Requirements

## Overview

OneiroMetrics is designed to work exclusively with Reading View mode in Obsidian. This document explains the technical requirements, limitations, and future plans for view mode support.

## Current Requirements

### Reading View Mode
OneiroMetrics requires Reading View mode for optimal functionality. This requirement is essential for several reasons:

1. **Layout Consistency**
   - Reading View provides a stable, predictable layout environment
   - Tables and metrics are rendered consistently across different themes
   - Content expansion/collapse animations work reliably
   - Column widths and alignments remain stable

2. **Performance**
   - Reading View offers better performance for large tables
   - Reduced DOM updates and reflows
   - Smoother animations and transitions
   - More efficient event handling

3. **Accessibility**
   - Better screen reader support
   - Consistent keyboard navigation
   - Reliable focus management
   - Proper ARIA attribute handling

### Live Preview Limitations
Live Preview mode is not supported due to several technical limitations:

1. **Layout Issues**
   - Inconsistent table rendering
   - Unreliable content expansion/collapse
   - Column width instability
   - Theme compatibility problems

2. **Performance Problems**
   - Frequent DOM updates causing lag
   - Unreliable event handling
   - Animation stuttering
   - Memory usage spikes

3. **Accessibility Challenges**
   - Inconsistent screen reader behavior
   - Unreliable keyboard navigation
   - Focus management issues
   - ARIA attribute conflicts

## Technical Implementation

### View Mode Detection
The plugin automatically detects the current view mode and provides appropriate feedback:

1. **Warning Notifications**
   - A persistent warning banner appears in Live Preview mode
   - Temporary notices inform users when switching to Live Preview
   - Settings UI includes a prominent warning about the requirement

2. **Automatic Detection**
   - The plugin monitors view mode changes
   - Warnings are displayed immediately when needed
   - Notifications are cleared when switching to Reading View

3. **User Experience**
   - Clear, non-intrusive warnings
   - Easy-to-understand instructions
   - Smooth transition between modes
   - Consistent behavior across themes

## Future Enhancements

The following improvements are planned for view mode support:

1. **Automatic View Mode Switching**
   - Automatically switch to Reading View when opening OneiroMetrics notes
   - Remember user's preferred view mode for other notes
   - Provide a setting to enable/disable automatic switching

2. **Enhanced Live Preview Support**
   - Improve layout consistency in Live Preview mode
   - Add specific styles for Live Preview compatibility
   - Implement fallback behaviors for Live Preview features

3. **View Mode Persistence**
   - Remember the last used view mode per note
   - Allow setting default view mode preferences
   - Provide quick toggle between view modes

4. **Accessibility Improvements**
   - Add keyboard shortcuts for view mode switching
   - Improve screen reader announcements for view mode changes
   - Add visual indicators for current view mode

## Best Practices

### For Users
1. **Always Use Reading View**
   - Switch to Reading View before opening metrics notes
   - Use the Reading View button in the top-right corner
   - Enable "Default to Reading View" in Obsidian settings if desired

2. **Theme Compatibility**
   - Test your theme in Reading View mode
   - Ensure proper contrast for metrics tables
   - Verify that animations work smoothly
   - Check accessibility features

3. **Performance Optimization**
   - Keep your metrics tables organized
   - Use filters to manage large datasets
   - Regular backups to maintain performance
   - Monitor log file sizes

### For Developers
1. **Testing Requirements**
   - Test all features in both Reading View and Live Preview
   - Verify warning messages appear correctly
   - Check theme compatibility
   - Validate accessibility features

2. **Implementation Guidelines**
   - Use Reading View-specific selectors
   - Implement proper fallbacks for Live Preview
   - Follow accessibility best practices
   - Maintain consistent styling

## Related Documentation
- [Usage Guide](USAGE.md) - For user-facing instructions
- [Technical Specification](SPECIFICATION.md) - For implementation details
- [Testing Guide](TESTING.md) - For testing procedures 