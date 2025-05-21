# OneiroMetrics Accessibility Testing Guide

This document covers all accessibility testing for the OneiroMetrics plugin, including keyboard navigation, screen reader support, color contrast, focus management, ARIA attributes, and reduced motion. For general setup and other testing categories, see [Testing Overview](./testing-overview.md).

## Overview
Accessibility testing ensures that the OneiroMetrics plugin is usable by people with different abilities and disabilities. This includes supporting keyboard navigation, screen readers, high contrast modes, and other assistive technologies. This guide provides a framework for testing accessibility features and ensuring the plugin meets modern accessibility standards.

## Table of Contents
- [Overview](#overview)
- [Accessibility Test Areas](#accessibility-test-areas)
- [Accessibility Test Checklist](#accessibility-test-checklist)
- [Related Documentation](#related-documentation)

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

## Related Documentation
- [UI Testing](./ui-testing.md)
- [Performance Testing](./performance-testing.md)
- [Testing Overview](./testing-overview.md)
- [Date and Time Handling](../implementation/date-time.md)
- [Logging](../implementation/logging.md) 