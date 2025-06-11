# CSS Extraction Implementation Plan

**Related:** [CSS Inline Styles Audit](./css-inline-styles-audit.md)  
**Branch:** fix/remove-inline-styles  
**Date:** 2025-06-10

## Table of Contents

- [Overview](#overview)
- [Quick Start Guide](#quick-start-guide)
  - [Step 1: Start with HubModal.ts (Highest Impact)](#step-1-start-with-hubmodalts-highest-impact)
  - [Step 2: Tooltip System (High Visibility)](#step-2-tooltip-system-high-visibility)
  - [Step 3: Calendar Components](#step-3-calendar-components)
- [Detailed Extraction Tasks](#detailed-extraction-tasks)
  - [Task 1: Extract Hub Modal Button Styling](#task-1-extract-hub-modal-button-styling)
  - [Task 2: Extract Status Text Styling](#task-2-extract-status-text-styling)
  - [Task 3: Extract Complete Tooltip System](#task-3-extract-complete-tooltip-system)
- [Testing Strategy](#testing-strategy)
  - [1. Visual Regression Testing](#1-visual-regression-testing)
  - [2. Functionality Testing](#2-functionality-testing)
  - [3. Performance Testing](#3-performance-testing)
- [File Organization](#file-organization)
  - [New CSS Files to Create](#new-css-files-to-create)
  - [CSS Build Integration](#css-build-integration)
- [Extraction Checklist](#extraction-checklist)
  - [Phase 1: Critical Components (Week 1)](#phase-1-critical-components-week-1)
  - [Phase 2: Core Components (Week 2)](#phase-2-core-components-week-2)
  - [Phase 3: Integration & Tables (Week 3)](#phase-3-integration--tables-week-3)
  - [Phase 4: Test Components (Optional)](#phase-4-test-components-optional)
- [Success Metrics](#success-metrics)
  - [Before Extraction](#before-extraction)
  - [After Extraction (Target)](#after-extraction-target)
  - [Code Quality Improvements](#code-quality-improvements)
- [Extraction Principles](#extraction-principles)
  - [What to Extract](#what-to-extract)
  - [What to Keep Inline](#what-to-keep-inline)
- [Tracking Tables](#tracking-tables)
  - [Task Progress Tracking](#task-progress-tracking)
  - [Phase Progress Tracking](#phase-progress-tracking)
  - [File Creation Progress](#file-creation-progress)
  - [Quality Metrics Dashboard](#quality-metrics-dashboard)

## Overview

This plan focuses on **extracting inline styles** from TypeScript files and converting them into proper CSS classes. We are not refactoring existing CSS, but rather moving JavaScript/TypeScript style definitions into component stylesheets.

## Quick Start Guide

### Step 1: Start with HubModal.ts (Highest Impact)

**Target File:** `src/dom/modals/HubModal.ts`  
**New CSS File:** `styles/hub-components.css`  
**Priority:** 🚨 Critical

**Immediate Actions:**
1. Create `styles/hub-components.css`
2. Extract the 20+ most common inline styling patterns
3. Add to CSS build pipeline
4. Test hub modal functionality

### Step 2: Tooltip System (High Visibility)

**Target File:** `src/dom/date-navigator/PatternTooltips.ts`  
**New CSS File:** `styles/tooltips.css`  
**Priority:** 🚨 Critical

**Focus Areas:**
- Extract complete tooltip positioning system (15+ properties)
- Extract arrow styling
- Extract animation and transitions

### Step 3: Calendar Components

**Target Files:**
- `src/dom/modals/EnhancedDateNavigatorModal.ts`
- `src/dom/date-navigator/DateNavigator.ts`

**Update CSS File:** `styles/enhanced-date-navigator.css`  
**Priority:** 🟡 High

## Detailed Extraction Tasks

### Task 1: Extract Hub Modal Button Styling
**Estimated Time:** 2 hours

**Extract from TypeScript:**
```typescript
// Lines 1664-1666 in HubModal.ts - EXTRACT THESE:
buttonContainer.style.display = 'flex';
buttonContainer.style.gap = '0.75em';
buttonContainer.style.marginTop = '0.5em';
```

**Move to CSS:**
```css
/* Add to styles/hub-components.css */
.oom-hub-button-container {
    display: flex;
    gap: 0.75em;
    margin-top: 0.5em;
}

.oom-hub-template-row {
    /* Base styles */
}

.oom-hub-template-row:hover {
    background-color: var(--background-modifier-hover);
}
```

**Replace in TypeScript:**
```typescript
// After extraction:
buttonContainer.className = 'oom-hub-button-container';
```

### Task 2: Extract Status Text Styling
**Estimated Time:** 1 hour

**Extract from TypeScript (Lines 2667-2693):**
```typescript
// EXTRACT THESE inline styles:
(el as HTMLElement).style.color = 'var(--text-success)';
(el as HTMLElement).style.fontWeight = '500';
// ... and more
```

**Move to CSS:**
```css
/* Add to styles/hub-components.css */
.oom-hub-status-success {
    color: var(--text-success);
    font-weight: 500;
}

.oom-hub-status-warning {
    color: var(--text-warning);
    font-style: italic;
}

.oom-hub-status-error {
    color: var(--text-error);
    font-weight: 500;
}

.oom-hub-status-muted {
    color: var(--text-muted);
    font-size: 0.9em;
}
```

### Task 3: Extract Complete Tooltip System
**Estimated Time:** 3 hours

**Extract from TypeScript (Lines 259-278):**
```typescript
// EXTRACT ALL THESE tooltip styles:
tooltip.style.position = 'absolute';
tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
tooltip.style.color = 'white';
tooltip.style.padding = '8px 12px';
// ... (15+ more properties)
```

**Move to CSS:**
```css
/* Add to styles/tooltips.css */
.oomp-tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.75em;
    line-height: 1.4;
    max-width: 250px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.oomp-tooltip--visible {
    opacity: 1;
}

.oomp-tooltip--bottom {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
}

.oomp-tooltip--left {
    left: 0;
    transform: none;
}

.oomp-tooltip--right {
    left: auto;
    right: 0;
    transform: none;
}

.oomp-tooltip-arrow {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid rgba(0, 0, 0, 0.9);
    width: 0;
    height: 0;
}
```

## Testing Strategy

### 1. Visual Regression Testing
- Take screenshots before extraction
- Compare after each component extraction
- Test in both light and dark themes

### 2. Functionality Testing
- Ensure all interactive elements work
- Test hover states and animations
- Verify accessibility features

### 3. Performance Testing
- Measure bundle size reduction
- Check for CSS/JS execution improvements

## File Organization

### New CSS Files to Create:
```
styles/
├── components/
│   ├── hub-components.css      # Extracted hub modal styling
│   ├── tooltips.css           # Extracted tooltip system
│   ├── calendar-indicators.css # Extracted calendar day indicators
│   ├── progress-indicators.css # Extracted progress bars
│   └── test-components.css    # Extracted test modal styling
```

### CSS Build Integration:
Update `build-css.js` to include new component files.

## Extraction Checklist

### Phase 1: Critical Components (Week 1)
- [ ] **HubModal.ts** - Extract 80+ inline styles
  - [ ] Button containers (lines 1664-1666, 1879-1881, etc.)
  - [ ] Template row hover states (lines 1710, 1714, 1798-1799)
  - [ ] Status text styling (lines 2667-2693)
  - [ ] Callout box styling (lines 2625-2636)
  - [ ] Config section styling (lines 2655-2659)
  - [ ] Button styling with hover (lines 2699-2737)
  - [ ] Dropdown menu system (lines 3417-3571)

- [ ] **PatternTooltips.ts** - Extract 20+ inline styles
  - [ ] Complete tooltip system (lines 259-278)
  - [ ] Arrow styling (lines 313-321)
  - [ ] HTML template inline styles (lines 209, 218)

### Phase 2: Core Components (Week 2)
- [ ] **EnhancedDateNavigatorModal.ts** - Extract 15+ inline styles
  - [ ] Context menu positioning (lines 380-383)
  - [ ] Calendar indicators (lines 2150-2167)
  - [ ] Screen reader elements (lines 2178-2182)

- [ ] **DateNavigator.ts** - Extract 5+ inline styles
  - [ ] Debug button hiding (line 193)
  - [ ] Screen reader announcements (lines 524-528)

### Phase 3: Integration & Tables (Week 3)
- [ ] **DateNavigatorIntegration.ts** - Extract 5+ inline styles
  - [ ] Container display toggles (lines 750, 759, 768, 912, 916)

- [ ] **TableGenerator.ts** - Extract 1 inline style
  - [ ] Content collapse styling (line 154)

### Phase 4: Test Components (Optional)
- [ ] Create standardized test component CSS
- [ ] Extract all test modal inline styles

## Success Metrics

### Before Extraction:
- **Inline Style Instances:** 150+
- **CSS Component Files:** 12
- **Bundle Size:** TBD
- **Maintainability Score:** Low

### After Extraction (Target):
- **Inline Style Instances:** <20 (only dynamic/data-driven)
- **CSS Component Files:** 17
- **Bundle Size:** Reduced (estimate 5-10%)
- **Maintainability Score:** High

### Code Quality Improvements:
- Cleaner TypeScript files (no inline styling)
- Centralized styling rules in CSS
- Better theme support
- Improved debugging experience
- Enhanced accessibility support

## Extraction Principles

### What to Extract:
✅ Static styling properties  
✅ Hover states and interactions  
✅ Layout and positioning  
✅ Typography and colors  
✅ Animation and transitions  

### What to Keep Inline:
❌ Dynamic values based on data  
❌ Calculated positions  
❌ Runtime-dependent styling  
❌ Temporary debugging styles  

## Tracking Tables

### Task Progress Tracking

| Task | Component | Estimated Time | Priority | Status | Assignee | Start Date | End Date | Notes |
|------|-----------|----------------|----------|--------|----------|------------|----------|--------|
| Extract Hub Modal Button Styling | HubModal.ts | 2 hours | 🚨 Critical | ✅ **CSS Ready** | - | - | - | Found 7 instances, hub.css already has .oom-import-export-buttons |
| Extract Status Text Styling | HubModal.ts | 1 hour | 🚨 Critical | 🔄 **In Progress** | - | - | - | Lines 2667-2693 |
| Extract Complete Tooltip System | PatternTooltips.ts | 3 hours | 🚨 Critical | Not Started | - | - | - | Lines 259-278, 313-321 |
| Extract Hub Modal Template Rows | HubModal.ts | 1.5 hours | 🚨 Critical | 🔄 **In Progress** | - | - | - | Found hover effects need JS->CSS conversion |
| Extract Hub Modal Callout Styling | HubModal.ts | 1 hour | 🚨 Critical | Not Started | - | - | - | Lines 2625-2636 |
| Extract Hub Modal Dropdown System | HubModal.ts | 2.5 hours | 🚨 Critical | Not Started | - | - | - | Lines 3417-3571 |
| Extract Calendar Context Menu | EnhancedDateNavigatorModal.ts | 1 hour | 🟡 High | Not Started | - | - | - | Lines 380-383 |
| Extract Calendar Indicators | EnhancedDateNavigatorModal.ts | 1.5 hours | 🟡 High | Not Started | - | - | - | Lines 2150-2167 |
| Extract Date Navigator Debug | DateNavigator.ts | 0.5 hours | 🟡 Medium | Not Started | - | - | - | Line 193 |
| Extract Container Display Toggles | DateNavigatorIntegration.ts | 0.5 hours | 🟡 Medium | Not Started | - | - | - | Lines 750, 759, 768, 912, 916 |

### Discovery Update - HubModal.ts Analysis

**Button Container Patterns Found:**
- 7 instances of `buttonContainer.style.display = 'flex'` pattern
- All using same 3-line pattern: display, gap, marginTop
- CSS solution: `.oom-import-export-buttons` class already exists in hub.css
- **Action needed:** Remove 21 lines of inline styling (7 × 3 lines each)

**Template Row Hover Effects Found:**
- Multiple instances of hover event listeners with inline backgroundColor
- Preview container visibility toggling with `style.display = 'none'/'block'`
- CSS solution: Use `.oom-hidden` utility class + CSS hover states
- **Action needed:** Convert JavaScript hover to CSS-only solution

**Current Status:**
- ✅ CSS infrastructure exists in hub.css and buttons.css
- ✅ Found exact inline style patterns and locations  
- 🔄 File modifications require careful targeting due to size (7000+ lines)
- 🔄 Need systematic approach to replace JS hover with CSS hover

### Quality Metrics Dashboard

| Metric | Current | Target | Progress | Status | Improvement |
|--------|---------|--------|----------|--------|-------------|
| **Inline Style Instances** | 150+ | <20 | 15% | 🟡 In Progress | Hub.css infrastructure ready |
| **CSS Component Files** | 12 | 17 | 70% | 🟢 Good | Existing files cover most needs |
| **Bundle Size** | Baseline | -5 to -10% | 0% | 🔴 Not Started | Pending style removal |
| **Maintainability Score** | Low | High | 25% | 🟡 In Progress | CSS patterns identified |
| **Theme Consistency** | Low | High | 60% | 🟡 In Progress | Using CSS variables properly |
| **Accessibility Score** | Medium | High | 0% | 🔴 Not Started | No change yet |

### Implementation Strategy Update

**Phase 1A: Quick Wins (2 hours)**
1. ✅ Verify CSS infrastructure (completed)
2. 🔄 Remove button container inline styles (7 instances) 
3. 🔄 Add .oom-hidden utility class
4. 🔄 Replace preview container display toggles

**Phase 1B: JavaScript to CSS Conversion (3 hours)**  
1. Convert template row hover from JS events to CSS :hover
2. Remove backgroundColor inline styling from event handlers
3. Test hover effects work consistently

**Phase 1C: Validation & Testing (1 hour)**
1. Test hub modal functionality 
2. Verify visual consistency
3. Check responsive behavior

**Lessons Learned:**
- Existing CSS infrastructure is better than expected
- File size makes targeted edits challenging  
- Some patterns need JS->CSS architecture changes, not just style extraction
- Hub.css already anticipates many of the patterns we're extracting

### Phase Completion Checklist

#### Phase 1: Critical Components (Week 1)
| Component | Task | Line References | Status | Assignee | Notes |
|-----------|------|----------------|--------|----------|--------|
| **HubModal.ts** | Extract button containers | 1664-1666, 1879-1881, etc. | ☐ Not Started | - | - |
| **HubModal.ts** | Extract template row hover states | 1710, 1714, 1798-1799 | ☐ Not Started | - | - |
| **HubModal.ts** | Extract status text styling | 2667-2693 | ☐ Not Started | - | - |
| **HubModal.ts** | Extract callout box styling | 2625-2636 | ☐ Not Started | - | - |
| **HubModal.ts** | Extract config section styling | 2655-2659 | ☐ Not Started | - | - |
| **HubModal.ts** | Extract button styling with hover | 2699-2737 | ☐ Not Started | - | - |
| **HubModal.ts** | Extract dropdown menu system | 3417-3571 | ☐ Not Started | - | - |
| **PatternTooltips.ts** | Extract complete tooltip system | 259-278 | ☐ Not Started | - | - |
| **PatternTooltips.ts** | Extract arrow styling | 313-321 | ☐ Not Started | - | - |
| **PatternTooltips.ts** | Extract HTML template inline styles | 209, 218 | ☐ Not Started | - | - |

#### Phase 2: Core Components (Week 2)
| Component | Task | Line References | Status | Assignee | Notes |
|-----------|------|----------------|--------|----------|--------|
| **EnhancedDateNavigatorModal.ts** | Extract context menu positioning | 380-383 | ☐ Not Started | - | - |
| **EnhancedDateNavigatorModal.ts** | Extract calendar indicators | 2150-2167 | ☐ Not Started | - | - |
| **EnhancedDateNavigatorModal.ts** | Extract screen reader elements | 2178-2182 | ☐ Not Started | - | - |
| **DateNavigator.ts** | Extract debug button hiding | 193 | ☐ Not Started | - | - |
| **DateNavigator.ts** | Extract screen reader announcements | 524-528 | ☐ Not Started | - | - |

#### Phase 3: Integration & Tables (Week 3)
| Component | Task | Line References | Status | Assignee | Notes |
|-----------|------|----------------|--------|----------|--------|
| **DateNavigatorIntegration.ts** | Extract container display toggles | 750, 759, 768, 912, 916 | ☐ Not Started | - | - |
| **TableGenerator.ts** | Extract content collapse styling | 154 | ☐ Not Started | - | - |

#### Phase 4: Test Components (Optional)
| Component | Task | Status | Assignee | Notes |
|-----------|------|--------|----------|--------|
| **Test Components** | Create standardized test component CSS | ☐ Not Started | - | - |
| **Test Components** | Extract all test modal inline styles | ☐ Not Started | - | - |

---

**Next Action:** Start with Task 1 (Extract Hub Modal Button Styling) - Estimated 2 hours  
**Status:** 🔄 Ready to Begin  
**Assignee:** CSS Extraction Team 