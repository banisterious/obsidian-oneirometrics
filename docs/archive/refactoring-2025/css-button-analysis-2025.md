# CSS Analysis: Read More Button

## HTML Structure
```html
<td class="oom-dream-content">
  <div class="oom-content-wrapper">
    <div class="oom-content-preview">...</div>
    <div class="oom-content-full">...</div>
  </div>
  <button class="oom-button oom-button--expand">Read more</button>
</td>
```

## Component Files
1. `tables-dream-content.css` - Main styles for the content display
2. `tables-utilities.css` - Utility styles
3. `tables-dream-entries.css` - Table-specific styles
4. `responsive.css` - Responsive behavior
5. `accessibility.css` - Accessibility features

## CSS Rule Map

### Content Cell
```css
.oom-content-cell {
    position: relative;
    max-width: 100%;
    overflow: hidden;
}
```

### Preview Content
```css
.oom-content-preview {
    display: block;
    max-height: 200px;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.4;
    font-family: var(--font-text);
    color: var(--text-normal);
    width: 100%;
    overflow-wrap: break-word;
    hyphens: auto;
}

.oom-dream-content.expanded .oom-content-preview {
    display: none !important;
}
```

### Full Content
```css
.oom-content-full {
    display: none;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.4;
    font-family: var(--font-text);
    color: var(--text-normal);
    width: 100%;
    overflow-wrap: break-word;
    hyphens: auto;
}

.oom-dream-content.expanded .oom-content-full {
    display: block !important;
}
```

### Expand Button
```css
.oom-dream-content .oom-expand-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.25em 0.5em;
    margin-top: 0.5em;
    font-size: 0.9em;
    color: var(--text-muted);
    background: none;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--oom-radius-sm);
    cursor: pointer;
    transition: all var(--oom-transition-normal);
}

.oom-dream-content .oom-expand-button:hover {
    color: var(--text-normal);
    background: var(--background-modifier-hover);
}

.oom-dream-content .oom-expand-button:focus {
    outline: none;
    box-shadow: var(--oom-focus-ring);
}
```

## Specificity Analysis
1. Content Cell: `.oom-content-cell` (0,0,1,0)
2. Preview Content: 
   - `.oom-content-preview` (0,0,1,0)
   - `.oom-dream-content.expanded .oom-content-preview` (0,0,2,0)
3. Full Content:
   - `.oom-content-full` (0,0,1,0)
   - `.oom-dream-content.expanded .oom-content-full` (0,0,2,0)
4. Expand Button:
   - `.oom-dream-content .oom-expand-button` (0,0,2,0)
   - `.oom-dream-content .oom-expand-button:hover` (0,0,2,1)
   - `.oom-dream-content .oom-expand-button:focus` (0,0,2,1)

## Media Queries
1. Forced Colors (Accessibility):
```css
@media (forced-colors: active) {
    .oom-dream-content .oom-expand-button {
        border: 1px solid CanvasText;
    }
    
    .oom-dream-content .oom-expand-button:focus {
        outline: 2px solid CanvasText;
        outline-offset: 2px;
    }
}
```

2. Reduced Motion:
```css
@media (prefers-reduced-motion: reduce) {
    .oom-content-preview,
    .oom-dream-content .oom-expand-button {
        transition: none;
    }
}
```

3. Mobile:
```css
@media screen and (max-width: var(--oom-breakpoint-mobile)) {
    .oom-content-preview,
    .oom-content-full {
        font-size: 0.95em;
        line-height: 1.3;
    }
    
    .oom-dream-content .oom-expand-button {
        padding: 0.5em 0.75em;
        font-size: 1em;
    }
}
```

4. Print:
```css
@media print {
    .oom-content-full {
        display: block !important;
        max-height: none !important;
    }
    
    .oom-content-preview {
        display: none !important;
    }
    
    .oom-dream-content .oom-expand-button {
        display: none !important;
    }
}
```

## Theme Overrides

### Light Theme
```css
.theme-light .markdown-preview-view[data-type="oom-project-note"] {
    background: var(--oom-theme-light-bg);
    color: var(--oom-theme-light-text);
}

.theme-light .markdown-preview-view[data-type="oom-project-note"] .oom-table {
    border-color: var(--oom-theme-light-border);
}

.theme-light .markdown-preview-view[data-type="oom-project-note"] .oom-table tr:hover {
    background: var(--oom-theme-light-hover);
}
```

### Dark Theme
```css
.theme-dark .markdown-preview-view[data-type="oom-project-note"] {
    background: var(--oom-theme-dark-bg);
    color: var(--oom-theme-dark-text);
}

.theme-dark .markdown-preview-view[data-type="oom-project-note"] .oom-table {
    border-color: var(--oom-theme-dark-border);
}

.theme-dark .markdown-preview-view[data-type="oom-project-note"] .oom-table tr:hover {
    background: var(--oom-theme-dark-hover);
}
```

### Minimal Theme
```css
.minimal-theme .markdown-preview-view[data-type="oom-project-note"],
.minimal-theme .markdown-preview-view[data-type="oom-project-note"] .oom-table,
.minimal-theme .markdown-preview-view[data-type="oom-project-note"] .oom-table tr:hover {
    /* Minimal theme specific overrides */
}
```

### Theme Variables
```css
:root {
    /* Light Theme */
    --oom-theme-light-bg: var(--background-primary);
    --oom-theme-light-text: var(--text-normal);
    --oom-theme-light-border: var(--background-modifier-border);
    --oom-theme-light-hover: var(--background-modifier-hover);

    /* Dark Theme */
    --oom-theme-dark-bg: var(--background-primary);
    --oom-theme-dark-text: var(--text-normal);
    --oom-theme-dark-border: var(--background-modifier-border);
    --oom-theme-dark-hover: var(--background-modifier-hover);
}
```

## Accessibility Considerations
1. Forced Colors Mode:
   - Custom border and focus styles for high contrast
   - Ensures visibility in high contrast mode
2. Reduced Motion:
   - Removes transitions for users who prefer reduced motion
3. Print Mode:
   - Shows full content
   - Hides interactive elements
4. Focus States:
   - Custom focus ring for keyboard navigation
   - Visible focus indicators 