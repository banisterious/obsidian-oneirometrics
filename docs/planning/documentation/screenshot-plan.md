# Screenshot Generation Plan

## Executive Summary

This document outlines the plan for creating and maintaining consistent, high-quality screenshots across the OneiroMetrics documentation. Following our Documentation Style Guide, these screenshots will enhance user understanding of features and workflows while maintaining a professional appearance.

## Table of Contents

- [1. Screenshot Priorities](#1-screenshot-priorities)
- [2. Capture Guidelines](#2-capture-guidelines)
- [3. Annotation Standards](#3-annotation-standards)
- [4. File Organization](#4-file-organization)
- [5. Maintenance Process](#5-maintenance-process)
- [6. Screenshot Inventory](#6-screenshot-inventory)

## 1. Screenshot Priorities

### High Priority (Phase 1)
- Dream Journal Manager interface (all tabs)
- Journal Structure configuration UI
- Template selection and creation dialogs
- Templater integration UI elements
- Metric editor interface
- Reading view showing rendered metrics

### Medium Priority (Phase 2)
- Settings panels for all OneiroMetrics features
- Error states and validation messages
- Toolbar buttons and ribbon icons
- Context menus and command palette entries

### Low Priority (Phase 3)
- Advanced feature workflows
- Example analysis views
- Mobile interface adaptations

## 2. Capture Guidelines

### Technical Requirements
- Resolution: 1920x1080 (desktop) or 390x844 (mobile)
- Format: PNG with transparent background where appropriate
- Theme: Capture in both light and dark themes (primary: light)
- Size: Optimize for web (100-200KB per image)
- Margins: Include 16px padding around UI elements

### Content Requirements
- Display realistic but fictitious dream journal data
- Avoid text that could be misinterpreted as real personal information
- Showcase complete workflows rather than isolated screens
- Demonstrate features with typical use cases

## 3. Annotation Standards

### Visual Elements
- Arrows: Use red (#FF3366) arrows to indicate interaction points
- Highlights: Use yellow (#FFDD00) semi-transparent highlights for focus areas
- Boxes: Use blue (#3366FF) rectangles to group related elements
- Numbers: Use white circles with black numbers for sequential steps

### Annotation Text
- Font: Roboto or system sans-serif, 14pt minimum
- Style: Concise instruction or identification (5 words maximum)
- Placement: Outside the UI element, connected with a thin line if needed
- Consistency: Use same terms as in the documentation text

## 4. File Organization

### Naming Convention
- Format: `feature-action-context-theme.png`
- Example: `journal-manager-metrics-tab-light.png`

### Directory Structure
- `/docs/images/ui/` - Core UI components
- `/docs/images/workflows/` - Sequential workflow steps
- `/docs/images/examples/` - Example outputs and configurations
- `/docs/images/mobile/` - Mobile-specific interfaces

## 5. Maintenance Process

### Update Triggers
- Major version releases
- UI changes affecting existing screenshots
- New feature additions
- Documentation updates requiring new visuals

### Version Control
- Store screenshot source files (if applicable) in the `/docs/images/source/` directory
- Document which screenshots correspond to which software versions
- Update screenshots within 7 days of a UI-changing release

## 6. Screenshot Inventory

| ID | Description | Priority | Status | Path | Last Updated |
|----|-------------|----------|--------|------|-------------|
| 001 | Dream Journal Manager - Overview | High | Needed | - | - |
| 002 | Dream Journal Manager - Scraper Tab | High | Needed | - | - |
| 003 | Dream Journal Manager - Structure Tab | High | Needed | - | - |
| 004 | Dream Journal Manager - Templates Tab | High | Needed | - | - |
| 005 | Journal Structure - Configuration | High | Needed | - | - |
| 006 | Template - Selection Dialog | High | Needed | - | - |
| 007 | Template - Creation Form | High | Needed | - | - |
| 008 | Templater - Integration UI | High | Needed | - | - |
| 009 | Metrics - Editor Interface | High | Needed | - | - |
| 010 | Metrics - Reading View Rendering | High | Needed | - | - |

## 7. Implementation Checklist

- [ ] Create directory structure for screenshots
- [ ] Set up tools for consistent screenshot capture
- [ ] Create annotation templates
- [ ] Complete Phase 1 (High Priority) screenshots
- [ ] Update docs/user/guides/usage.md with new screenshot references
- [ ] Complete Phase 2 screenshots
- [ ] Complete Phase 3 screenshots
- [ ] Establish regular screenshot review process 