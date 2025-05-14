# CSS Refactoring Plan

## Current Issues
- ~~Stylesheet is 2493 lines long~~ ✅ Reduced to 34 lines
- ~~Contains 94 `!important` declarations~~ ✅ Reduced significantly
- ~~Has redundant and conflicting rules~~ ✅ Removed duplicates
- ~~Rules are scattered throughout the file~~ ✅ Organized into components
- ~~Difficult to maintain and debug~~ ✅ Improved organization

## Implementation Progress

### Completed Components
1. `project-note-tables.css`
   - Table layout and structure
   - Column widths and alignment
   - Header and cell styling
   - Print styles
   - Responsive table behavior

2. `project-note-content.css`
   - Content display rules
   - Text formatting
   - Spacing and layout

3. `theme-overrides.css`
   - Theme-specific styles
   - Light/dark mode support
   - Minimal theme compatibility

4. `buttons.css`
   - Button styles and variants
   - Hover and focus states
   - Icon buttons
   - Dialog buttons

5. `modals.css`
   - Modal dialog styles
   - Overlay and backdrop
   - Animation and transitions

6. `filters.css`
   - Filter controls
   - Date range filters
   - Quick filters
   - Filter display

7. `settings.css`
   - Settings page layout
   - Form controls
   - Input fields
   - Collapsible sections

8. `icon-picker.css`
   - Icon picker interface
   - Icon grid
   - Selection states

9. `drag-drop.css`
   - Drag and drop functionality
   - Drop zones
   - Visual feedback

10. `multiselect.css`
    - Multiselect component
    - Selection states
    - Dropdown behavior

11. `metrics-summary.css`
    - Metrics display
    - Statistics tables
    - Summary sections

12. `utilities.css`
    - Helper classes
    - Common patterns
    - Reusable styles

13. `responsive.css`
    - Media queries
    - Mobile/tablet styles
    - Touch optimizations

14. `accessibility.css`
    - High contrast mode
    - Reduced motion
    - Focus states
    - Screen reader support

### Current State
- Main `styles.css` is now just a manifest file
- All styles are organized into focused components
- Each component has clear documentation
- Improved maintainability and debugging
- Better separation of concerns

## Next Steps
1. Review each component for:
   - Documentation completeness
   - Code organization
   - Performance optimizations
   - Accessibility compliance

2. Consider additional improvements:
   - CSS custom properties for theming
   - Further reduction of `!important` usage
   - Performance optimizations
   - Additional accessibility features

3. Testing:
   - Cross-theme compatibility
   - Responsive behavior
   - Print styles
   - Accessibility features

## Benefits Achieved
- ✅ Improved maintainability
- ✅ Better organization
- ✅ Easier debugging
- ✅ Reduced file size
- ✅ Clearer separation of concerns
- ✅ Better performance through focused loading

## Documentation
Each component file includes:
- Purpose and scope
- Dependencies
- Theme compatibility
- Accessibility considerations
- Responsive behavior

## Proposed Solution
Split the current `styles.css` into multiple focused stylesheets:

### 1. `base.css`
Core styles and structure:
- Theme variables and overrides
- Base layout rules
- Common component styles (tables, buttons)
- Print styles
- Accessibility features
- High contrast mode support

### 2. `components.css`
Component-specific styles:
- Dream content display rules
- Metrics table styles
- Filter controls
- Modal dialogs
- Interactive elements
- Icons and visual elements

### 3. `responsive.css`
Responsive design:
- Media queries
- Mobile/tablet specific styles
- Touch device optimizations
- Reduced motion preferences
- Screen size breakpoints

## Implementation Steps

### Phase 1: Cleanup
1. Remove redundant rules
2. Consolidate duplicate selectors
3. Reduce `!important` usage by:
   - Using more specific selectors
   - Leveraging CSS cascade
   - Using CSS custom properties for theme overrides
   - Organizing rules in correct order
4. Document necessary `!important` declarations

### Phase 2: Split
1. Create new CSS files
2. Move related rules to appropriate files
3. Update manifest to load all files
4. Test in different themes and modes

### Phase 3: Documentation
1. Document the purpose of each file
2. Create a style guide
3. Add comments for complex rules
4. Document theme compatibility

## Obsidian Plugin Support
- Multiple stylesheets are supported through the `styles.css` array in the manifest
- Files are loaded in the order specified
- Each file can be loaded conditionally

## Example Manifest Update
```json
{
  "styles": [
    "styles/base.css",
    "styles/components.css",
    "styles/responsive.css"
  ]
}
```

## Current Focus
Before proceeding with the refactoring, we need to resolve the Read more/Show less button issues in the current implementation.

## Next Steps
1. Fix content visibility issues
2. Document current CSS structure
3. Begin cleanup phase
4. Plan the split
5. Implement changes gradually 