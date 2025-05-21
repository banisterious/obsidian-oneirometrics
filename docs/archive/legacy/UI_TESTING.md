# OneiroMetrics UI Testing Guide

This document covers all user interface (UI) testing for the OneiroMetrics plugin, including tables, modals, buttons, theme compatibility, and responsive design. For general setup and other testing categories, see [TESTING.md](TESTING.md).

## Table Testing
- Table layout and structure
- Column sizing and alignment
- Responsive behavior
- Theme compatibility

## Modal Testing
- Modal layout and content
- Button placement and behavior
- Progress indicators
- File/folder selection UI

## Button System Testing
- Base button styles and variants
- Hover, focus, and active states
- Accessibility features (see ACCESSIBILITY_TESTING.md for details)

## Theme Compatibility
- Light and dark themes
- Custom theme support
- Color and icon visibility

## Responsive Design
- Layout adapts to screen size
- Mobile and tablet usability
- No horizontal scrolling on desktop

## UI Test Checklist
- [ ] Tables match Obsidian theme
- [ ] Hover effects work on rows
- [ ] Buttons have proper hover states
- [ ] Links have proper hover states
- [ ] Text is readable
- [ ] Spacing is consistent
- [ ] UI is responsive
- [ ] No horizontal scrolling on desktop
- [ ] Mobile view is usable
- [ ] Table overrides readable line length setting
- [ ] Table maintains full width regardless of theme settings
- [ ] Column widths are optimized
- [ ] Progress modal styling matches theme
- [ ] Suggestion containers use CSS classes
- [ ] No inline styles present
- [ ] CSS components are properly organized

For accessibility-specific tests, see [ACCESSIBILITY_TESTING.md](ACCESSIBILITY_TESTING.md). 