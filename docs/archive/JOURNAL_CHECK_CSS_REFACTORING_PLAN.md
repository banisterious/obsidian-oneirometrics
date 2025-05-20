# Journal Structure CSS Refactoring Plan

## Overview

This document outlines the plan to refactor the CSS for the Journal Structure Check feature by:
1. Adding "oom-" prefixes to all classes in src/journal_check/styles.css
2. Merging the prefixed CSS into the root level styles.css

Date: 2025-05-20

## Phase 1: Preparation & Analysis

1. **Create a backup branch**
   - Create a git branch to preserve the current state
   - Tag the current version for easy rollback

2. **Analyze class usage**
   - Identify all CSS classes in src/journal_check/styles.css
   - Create a mapping document (old class → new class)
   - Grep for all class usages in JS files:
     - Check for `classList.add/remove/toggle/contains`
     - Check for `querySelector/querySelectorAll` 
     - Check for `className =` assignments
     - Check for template literals containing class names

3. **Map affected files**
   - List all files that need updates (JS components that use these classes)
   - Group files by component for organized updates

## Phase 2: CSS Transformation

1. **Create a temporary CSS file**
   - Make a copy of src/journal_check/styles.css
   - Add "oom-" prefix to all class names
   - Update all class references within the CSS (e.g., in nesting or `:hover` selectors)

2. **Prepare root styles.css**
   - Identify the correct section to add journal structure styles
   - Create clear section headers and comments matching existing style
   - Plan where to add media queries for the new classes

## Phase 3: Code Updates

1. **Update JS files systematically**
   - Work through each component:
     - Update all class references using the mapping document
     - Test each component individually after updates

2. **Update any HTML templates**
   - Identify and update any hardcoded HTML or template strings
   - Check for any render functions that output HTML with these classes

## Phase 4: CSS Merging

1. **Integrate the CSS**
   - Add a new section to styles.css with clear header comments
   - Insert the transformed journal_check CSS
   - Ensure existing sections are not disrupted
   - Adapt media queries as needed

2. **Remove direct loading of the old CSS file**
   - Check how src/journal_check/styles.css is being loaded
   - Remove those references, ensuring styles.css is properly loaded everywhere
   - Note: The CSS is currently loaded in main.ts using `loadStyles()` method which directly injects a subset of styles

## Phase 5: Testing

1. **Systematic UI testing**
   - Test each component of the journal structure validation UI:
     - Template wizard
     - Validation modal
     - Structure editor
     - All interactive elements

2. **Test across themes and platforms**
   - Verify appearance in light/dark themes
   - Check responsive behavior at different screen sizes

3. **Run the build process**
   - Verify no build errors occur
   - Check for any style-related warnings

## Phase 6: Cleanup & Finalization

1. **Remove redundant files**
   - Delete src/journal_check/styles.css after confirming everything works

2. **Documentation update**
   - Update comments in code
   - Update any documentation referring to CSS classes

3. **Final commit & PR**
   - Create a pull request with clear documentation
   - Include before/after screenshots

## Rollback Plan

1. **Immediate issues**
   - Keep the original branch/tag accessible
   - Be prepared to revert to the original CSS file if issues occur

2. **Post-deployment issues**
   - Maintain a mapping of old→new class names for debugging

## Class Mapping

| Original Class | New Class |
|----------------|-----------|
| dream-journal-test-modal | oom-dream-journal-test-modal |
| test-modal-container | oom-test-modal-container |
| test-modal-content-pane | oom-test-modal-content-pane |
| test-modal-results-pane | oom-test-modal-results-pane |
| highlight-pane | oom-highlight-pane |
| test-modal-editor-section | oom-test-modal-editor-section |
| test-modal-actions-section | oom-test-modal-actions-section |
| validating | oom-validating |
| template-wizard-container | oom-template-wizard-container |
| template-wizard-steps | oom-template-wizard-steps |
| template-wizard-preview | oom-template-wizard-preview |
| template-wizard-navigation | oom-template-wizard-navigation |
| button-container | oom-button-container |
| step-indicator | oom-step-indicator |
| structure-guidance | oom-structure-guidance |
| structure-selected-info | oom-structure-selected-info |
| structure-details | oom-structure-details |
| templater-warning | oom-templater-warning |
| validation-summary | oom-validation-summary |
| validation-details | oom-validation-details |
| validation-item | oom-validation-item |
| validation-error | oom-validation-error |
| validation-warning | oom-validation-warning |
| validation-info | oom-validation-info |
| validation-item-header | oom-validation-item-header |
| validation-item-severity | oom-validation-item-severity |
| validation-item-message | oom-validation-item-message |
| validation-item-location | oom-validation-item-location |
| validation-item-fixes | oom-validation-item-fixes |
| template-preview | oom-template-preview |
| preview-structure | oom-preview-structure |
| preview-content | oom-preview-content |
| cm-validation-error | oom-cm-validation-error |
| cm-validation-warning | oom-cm-validation-warning |
| cm-validation-info | oom-cm-validation-info |
| validation-tooltip | oom-validation-tooltip |
| validation-tooltip-header | oom-validation-tooltip-header |
| validation-tooltip-message | oom-validation-tooltip-message |
| validation-tooltip-fixes | oom-validation-tooltip-fixes |

## Affected Files

Based on the analysis, the following files will need to be updated to reference the new class names:

1. **UI Components**:
   - `src/journal_check/ui/TestModal.ts` - Uses classes like `dream-journal-test-modal`, `test-modal-container`, etc.
   - `src/journal_check/ui/TemplateWizard.ts` - Uses classes like `template-wizard-container`, `template-wizard-steps`, etc.

2. **Main File**:
   - `main.ts` - Contains the `loadStyles()` method which will need updating to either:
     - Include the full journal check styles with proper prefixes, or
     - Be modified to load from the main styles.css file

3. **Note about Style Loading**:
   - Currently, some styles are already prefixed with "oom-" in the `loadStyles()` method
   - These are inlined directly in main.ts rather than loaded from the external CSS file
   - As part of this refactoring, we should consolidate all styles into styles.css 