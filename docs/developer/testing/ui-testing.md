# OneiroMetrics UI Testing Guide

This document covers all user interface (UI) testing for the OneiroMetrics plugin, including tables, modals, buttons, theme compatibility, and responsive design. For general setup and other testing categories, see [Testing Overview](./testing-overview.md).

## Overview
UI testing ensures that all visual components of the OneiroMetrics plugin display correctly, respond appropriately to user interactions, and maintain consistent styling across different themes. This guide outlines the key areas to test, provides checklists for thorough validation, and links to related documentation.

## Table of Contents
- [Overview](#overview)
- [Table Testing](#table-testing)
- [Modal Testing](#modal-testing)
- [Button System Testing](#button-system-testing)
- [Theme Compatibility](#theme-compatibility)
- [Responsive Design](#responsive-design)
- [UI Test Checklist](#ui-test-checklist)
- [Related Documentation](#related-documentation)

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
- Accessibility features (see [Accessibility Testing](./accessibility-testing.md) for details)

## Theme Compatibility
- Light and dark themes
- Custom theme support
- Color and icon visibility

## Responsive Design
- Layout adapts to screen size
- Mobile and tablet usability
- No horizontal scrolling on desktop

## UI Test Checklist
- [x] Tables match Obsidian theme ✅ 2025-05-21
- [x] Hover effects work on rows ✅ 2025-05-21
- [x] Buttons have proper hover states ✅ 2025-05-21
- [x] Links have proper hover states ✅ 2025-05-21
- [x] Text is readable ✅ 2025-05-21
- [x] Spacing is consistent ✅ 2025-05-21
- [ ] UI is responsive
- [ ] No horizontal scrolling on desktop
- [ ] Mobile view is usable
- [ ] Table overrides readable line length setting
- [x] Table maintains full width regardless of theme settings ✅ 2025-05-21
- [ ] Column widths are optimized
- [ ] Progress modal styling matches theme
- [x] Suggestion containers use CSS classes ✅ 2025-05-21
- [ ] No inline styles present
- [ ] CSS components are properly organized

## Related Documentation
- [Accessibility Testing](./accessibility-testing.md)
- [Performance Testing](./performance-testing.md)
- [Testing Overview](./testing-overview.md)
- [Date and Time Handling](../implementation/date-time.md)
- [Logging](../implementation/logging.md) 