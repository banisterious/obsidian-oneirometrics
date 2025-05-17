# OneiroMetrics Accessibility Testing Guide

This document covers all accessibility testing for the OneiroMetrics plugin, including keyboard navigation, screen reader support, color contrast, focus management, ARIA attributes, and reduced motion. For general setup and other testing categories, see [TESTING.md](TESTING.md).

## Accessibility Test Areas
- Keyboard navigation (Tab, Enter, Space)
- Focus management and indicators
- Screen reader support (ARIA labels, roles, announcements)
- Color contrast and high contrast mode
- Reduced motion and animation preferences
- Accessible button and link roles
- Logical tab order

## Accessibility Test Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] ARIA labels and roles are present and correct
- [ ] Screen reader announcements work for dynamic content
- [ ] Color contrast meets WCAG standards
- [ ] High contrast mode is supported
- [ ] Reduced motion preference is respected
- [ ] All modals and dialogs are accessible
- [ ] Table and button roles are correct
- [ ] Live regions update properly
- [ ] Tab order is logical and intuitive

For UI-specific tests, see [UI_TESTING.md](UI_TESTING.md). 