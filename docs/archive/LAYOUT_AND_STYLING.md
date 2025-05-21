# Layout and Styling Technical Specification

> **Note:** A comprehensive CSS refactoring plan is available in [CSS_REFACTORING.md](../CSS_REFACTORING.md). This document will be updated as the refactoring progresses.

## Overview

This document outlines the layout and styling options available for OneiroMetrics, with a focus on compatibility with the [Modular CSS Layout (MCL)](https://efemkay.github.io/obsidian-modular-css-layout/) snippet collection.

For documentation standards and guidelines, see [Documentation Style Guide](DOCUMENTATION_STYLE_GUIDE.md).
For code quality standards, see [Journal Structure Guidelines](../user/guides/journal-structure.md) and [Journal Structure Check Implementation Plan](../planning/features/journal-structure-check.md).
For icon implementation details, see [Icon Picker Technical Implementation](../developer/implementation/icon-picker.md).
For metric descriptions and styling, see [Metrics Reference](../user/reference/metrics.md).

## Plugin Feature Integration

This layout system is designed to support and enhance several key features of the OneiroMetrics plugin:

1. **Metrics Display**
   - Callout-based metric entry and display
     ```markdown
     > [!dream-metrics]
     > Sensory Detail: 4, Emotional Recall: 3
     ```
   - Multi-column layouts for detailed analysis
     ```markdown
     > [!journal-entry|20250513] Multi-column
     > 
     > > [!dream-content] Column 1
     > > Dream content here...
     > > 
     > > > [!dream-metrics] Column 2
     > > > - Vividness: 4
     > > > - Emotional Intensity: 3
     ```
   - Timeline visualizations for dream sequences
   - Gallery layouts for pattern visualization
   - See [Metrics Guide](docs/METRICS.md) for detailed metric descriptions

2. **Theme Integration**
   - Seamless compatibility with Minimal and ITS themes
     ```css
     .theme-minimal {
         --callout-background: var(--minimal-card-bg);
         --callout-border-color: var(--minimal-border-color);
     }
     ```
   - Support for Style Settings plugin customization
   - Consistent styling across different themes
   - Dark mode support
   - See [Theme Compatibility](#theme-compatibility) for detailed theme integration

3. **Core Settings**
   - Readable line length override for tables
     ```css
     .markdown-preview-view.is-readable-line-width.oom-full-width {
         --line-width: 100%;
         --max-width: none;
     }
     ```
   - Font and spacing customization
   - Responsive layout adaptation
   - Mobile-friendly design
   - See [Core Settings Integration](#core-settings-integration) for implementation details

4. **Plugin Settings UI**
   - Style Settings-inspired collapsible sections
     ```css
     .style-settings-collapse {
         border: 1px solid var(--background-modifier-border);
         border-radius: 8px;
         margin: 1.5em 0;
     }
     ```
   - Consistent button and control styling
   - Clear visual hierarchy
   - Accessible form elements
   - See [Plugin Integration Best Practices](#plugin-integration-best-practices) for guidelines

5. **Data Visualization**
   - Summary tables with responsive layouts
     ```markdown
     > [!weekly|20250513] List-column
     > 
     > > [!dream-stats] Column 1
     > > ## Statistics
     > > - Total Dreams: 7
     > > - Average Vividness: 3.5
     ```
   - Interactive filtering and sorting
   - Expandable content previews
   - Metric trend visualization
   - See [Data Presentation](#data-presentation) for implementation details

6. **Accessibility Features**
   - Keyboard navigation support
   - Screen reader compatibility
   - High contrast mode support
   - Focus management
   - See [Accessibility Guidelines](#accessibility-guidelines) for best practices

7. **Performance Optimization**
   - Efficient style calculations
   - Lazy loading for custom styles
   - Optimized selectors
   - Caching strategies
   - See [Performance Optimization](#performance-optimization) for techniques

8. **Future Features**
   - Timeline support for dream sequence analysis
     ```markdown
     > [!timeline|blue] Dream Sequence
     > 
     > > [!timeline-event] Event 1
     > > Time: 2:30 AM
     > > Location: Mountain cabin
     ```
   - Gallery layouts for pattern visualization
   - Advanced callout customization
   - Enhanced theme integration
   - See [Future Considerations](#future-considerations) for planned improvements

9. **Integration with Other Plugins**
   - Dataview compatibility
   - Calendar plugin integration
   - Graph view enhancements
   - Templater support
   - See [Plugin Integration](#plugin-integration) for compatibility details

10. **Mobile Experience**
    - Touch-friendly interfaces
    - Responsive layouts
    - Optimized performance
    - Adaptive spacing
    - See [Mobile Optimization](#mobile-optimization) for implementation details

## MCL Integration

### Basic Callout Styling

1. **Standard Callouts**
   ```markdown
   > [!journal-entry|20250513]
   > Basic dream journal entry
   ```

2. **Multi-column Layouts**
   ```markdown
   > [!journal-entry|20250513] Multi-column
   > 
   > > [!dream-content] Column 1
   > > Dream content here...
   > > 
   > > > [!dream-metrics] Column 2
   > > > - Vividness: 4
   > > > - Emotional Intensity: 3
   ```

3. **Float Callouts**
   ```markdown
   > [!journal-entry|20250513] Float-right
   > 
   > > [!dream-summary] Float-left
   > > Quick summary
   > > 
   > > Main content here...
   ```

### Advanced Layouts

1. **Gallery Cards**
   ```markdown
   > [!journal-entry|20250513] Gallery
   > 
   > > [!dream-image] Image 1
   > > ![[dream-sketch-1.png]]
   > > 
   > > > [!dream-image] Image 2
   > > > ![[dream-sketch-2.png]]
   ```

2. **List Columns**
   ```markdown
   > [!journal-entry|20250513] List-column
   > 
   > > [!dream-list] Column 1
   > > - Dream 1
   > > - Dream 2
   > > 
   > > > [!dream-list] Column 2
   > > > - Dream 3
   > > > - Dream 4
   ```

3. **Showcases**
   ```markdown
   > [!journal-entry|20250513] Showcase
   > 
   > > [!dream-showcase] Main Content
   > > Detailed dream analysis
   > > 
   > > > [!dream-sidebar] Sidebar
   > > > Additional information
   ```

4. **Timeline Layouts**
   ```markdown
   > [!journal-entry|20250513] Timeline
   > 
   > > [!timeline] Dream Sequence
   > > 
   > > > [!timeline-event] Event 1
   > > > Time: 2:30 AM
   > > > Location: Mountain cabin
   > > > 
   > > > > [!timeline-event] Event 2
   > > > > Time: 2:45 AM
   > > > > Location: Forest clearing
   > > > > 
   > > > > > [!timeline-event] Event 3
   > > > > > Time: 3:00 AM
   > > > > > Location: Beach
   ```

   **Timeline Styling**
   ```css
   /* Timeline Callout settings */
   body {
     --timeline-title-color: var(--text-normal);
     --timeline-title-size: var(--h2-size);
     --timeline-title-width: 150px;

     --timeline-line-color: var(--color-base-35);
     --timeline-line-margin: 16px;
     --timeline-line-width: 4px;
     --timeline-line-style: solid;

     --timeline-dot-color: var(--color-base-70);
     --timeline-dot-size: 32px;
     --timeline-dot-radius: 100%;
     --timeline-dot-border-color: var(--background-primary);
     --timeline-dot-border-size: 6px;
     --timeline-dot-offset-x: -18px;
     --timeline-dot-offset-y: -2px;

     --timeline-card-margin: 16px;
     --timeline-card-background-color: var(--color-base-30);
     --timeline-card-padding-x: 10px;
     --timeline-card-padding-y: 16px;
   }

   /* Timeline styling */
   [data-callout="timeline"] {
     order: 1;
     padding: 0;
     margin: 0;
     display: grid;
     mix-blend-mode: normal;
     background-color: unset;
     grid-template-columns: var(--timeline-title-width, 150px) auto;
     --dot-offset: calc(
       var(--timeline-dot-offset-y) + var(--timeline-card-padding-y)
     );
   }

   /* Timeline dot colors */
   [data-callout-metadata="red"] {
     --timeline-dot-color: var(--color-red);
   }
   [data-callout-metadata="orange"] {
     --timeline-dot-color: var(--color-orange);
   }
   [data-callout-metadata="yellow"] {
     --timeline-dot-color: var(--color-yellow);
   }
   [data-callout-metadata="green"] {
     --timeline-dot-color: var(--color-green);
   }
   [data-callout-metadata="cyan"] {
     --timeline-dot-color: var(--color-cyan);
   }
   [data-callout-metadata="blue"] {
     --timeline-dot-color: var(--color-blue);
   }
   [data-callout-metadata="purple"] {
     --timeline-dot-color: var(--color-purple);
   }
   [data-callout-metadata="pink"] {
     --timeline-dot-color: var(--color-pink);
   }
   ```

   **Colored Timeline Example**
   ```markdown
   > [!journal-entry|20250513] Timeline
   > 
   > > [!timeline|red] Dream Sequence
   > > 
   > > > [!timeline-event] Event 1
   > > > Time: 2:30 AM
   > > > Location: Mountain cabin
   > > > 
   > > > > [!timeline-event] Event 2
   > > > > Time: 2:45 AM
   > > > > Location: Forest clearing
   > > > > 
   > > > > > [!timeline-event] Event 3
   > > > > > Time: 3:00 AM
   > > > > > Location: Beach
   ```

   **Multiple Timelines**
   ```markdown
   > [!journal-entry|20250513] Timeline
   > 
   > > [!timeline|blue] Morning Dreams
   > > 
   > > > [!timeline-event] Event 1
   > > > Time: 2:30 AM
   > > > 
   > > > > [!timeline-event] Event 2
   > > > > Time: 2:45 AM
   > 
   > > [!timeline|purple] Afternoon Dreams
   > > 
   > > > [!timeline-event] Event 1
   > > > Time: 3:30 PM
   > > > 
   > > > > [!timeline-event] Event 2
   > > > > Time: 3:45 PM
   ```

### Theme Compatibility

1. **Core Theme Support**

   a. **Minimal Theme**
   ```css
   /* Minimal Theme Integration */
   .theme-minimal {
       /* Layout adjustments */
       --layout-spacing: var(--minimal-spacing);
       --layout-border-radius: var(--minimal-border-radius);
       --layout-shadow: var(--minimal-shadow);
       
       /* Callout adjustments */
       --callout-background: var(--minimal-card-bg);
       --callout-border-color: var(--minimal-border-color);
       --callout-title-color: var(--minimal-accent-color);
       
       /* Timeline adjustments */
       --timeline-line-color: var(--minimal-border-color);
       --timeline-dot-color: var(--minimal-accent-color);
       --timeline-card-background-color: var(--minimal-card-bg);
   }
   ```

   b. **ITS Theme**
   ```css
   /* ITS Theme Integration */
   .theme-its {
       /* Layout adjustments */
       --layout-spacing: var(--its-spacing);
       --layout-border-radius: var(--its-border-radius);
       --layout-shadow: var(--its-shadow);
       
       /* Callout adjustments */
       --callout-background: var(--its-card-bg);
       --callout-border-color: var(--its-border-color);
       --callout-title-color: var(--its-accent-color);
       
       /* Timeline adjustments */
       --timeline-line-color: var(--its-border-color);
       --timeline-dot-color: var(--its-accent-color);
       --timeline-card-background-color: var(--its-card-bg);
   }
   ```

2. **Extended Color Schemes**

   a. **Minimal Theme Colors**
   ```css
   /* Minimal Theme Color Palette */
   .theme-minimal {
       /* Primary colors */
       --color-primary: var(--minimal-accent-color);
       --color-primary-hover: var(--minimal-accent-hover);
       --color-primary-active: var(--minimal-accent-active);
       
       /* Background colors */
       --color-bg-primary: var(--minimal-card-bg);
       --color-bg-secondary: var(--minimal-bg-secondary);
       --color-bg-tertiary: var(--minimal-bg-tertiary);
       
       /* Text colors */
       --color-text-primary: var(--minimal-text-normal);
       --color-text-secondary: var(--minimal-text-muted);
       --color-text-tertiary: var(--minimal-text-faint);
       
       /* Border colors */
       --color-border-primary: var(--minimal-border-color);
       --color-border-secondary: var(--minimal-border-color-hover);
       --color-border-tertiary: var(--minimal-border-color-focus);
       
       /* Status colors */
       --color-success: var(--minimal-success-color);
       --color-warning: var(--minimal-warning-color);
       --color-error: var(--minimal-error-color);
   }
   ```

   b. **ITS Theme Colors**
   ```css
   /* ITS Theme Color Palette */
   .theme-its {
       /* Primary colors */
       --color-primary: var(--its-accent-color);
       --color-primary-hover: var(--its-accent-hover);
       --color-primary-active: var(--its-accent-active);
       
       /* Background colors */
       --color-bg-primary: var(--its-card-bg);
       --color-bg-secondary: var(--its-bg-secondary);
       --color-bg-tertiary: var(--its-bg-tertiary);
       
       /* Text colors */
       --color-text-primary: var(--its-text-normal);
       --color-text-secondary: var(--its-text-muted);
       --color-text-tertiary: var(--its-text-faint);
       
       /* Border colors */
       --color-border-primary: var(--its-border-color);
       --color-border-secondary: var(--its-border-color-hover);
       --color-border-tertiary: var(--its-border-color-focus);
       
       /* Status colors */
       --color-success: var(--its-success-color);
       --color-warning: var(--its-warning-color);
       --color-error: var(--its-error-color);
   }
   ```

3. **Theme Testing Scenarios**

   a. **Minimal Theme Testing**
   ```markdown
   ## Minimal Theme Test Cases
   
   1. **Layout Tests**
      - [ ] Multi-column layouts maintain spacing
      - [ ] Callout borders match theme style
      - [ ] Timeline alignment is consistent
      - [ ] Gallery layouts respect theme spacing
   
   2. **Color Tests**
      - [ ] Text colors maintain readability
      - [ ] Background colors provide contrast
      - [ ] Accent colors are consistent
      - [ ] Status colors are distinguishable
   
   3. **Interaction Tests**
      - [ ] Hover states match theme style
      - [ ] Focus states are visible
      - [ ] Active states are distinct
      - [ ] Transitions are smooth
   
   4. **Responsive Tests**
      - [ ] Layouts adapt to different widths
      - [ ] Mobile view maintains theme style
      - [ ] Tablet view preserves spacing
      - [ ] Desktop view optimizes space
   ```

   b. **ITS Theme Testing**
   ```markdown
   ## ITS Theme Test Cases
   
   1. **Layout Tests**
      - [ ] Grid layouts maintain alignment
      - [ ] Callout styles match theme
      - [ ] Timeline spacing is consistent
      - [ ] Gallery layouts respect theme
   
   2. **Color Tests**
      - [ ] Text hierarchy is clear
      - [ ] Background contrast is sufficient
      - [ ] Accent usage is consistent
      - [ ] Status indicators are clear
   
   3. **Interaction Tests**
      - [ ] Hover effects match theme
      - [ ] Focus indicators are visible
      - [ ] Active states are clear
      - [ ] Animations are smooth
   
   4. **Responsive Tests**
      - [ ] Layouts scale appropriately
      - [ ] Mobile view is consistent
      - [ ] Tablet view maintains style
      - [ ] Desktop view is optimized
   ```

4. **Theme-Specific Troubleshooting**

   a. **Minimal Theme Issues**
   ```markdown
   ## Minimal Theme Troubleshooting
   
   1. **Common Issues**
      - Layout spacing inconsistencies
      - Callout border mismatches
      - Timeline alignment problems
      - Color contrast issues
   
   2. **Solutions**
      ```css
      /* Fix spacing issues */
      .theme-minimal .callout {
          margin: var(--minimal-spacing);
          padding: var(--minimal-spacing);
      }
      
      /* Fix border issues */
      .theme-minimal .callout {
          border-color: var(--minimal-border-color);
          border-width: var(--minimal-border-width);
      }
      
      /* Fix timeline issues */
      .theme-minimal [data-callout="timeline"] {
          --timeline-line-color: var(--minimal-border-color);
          --timeline-dot-color: var(--minimal-accent-color);
      }
      
      /* Fix contrast issues */
      .theme-minimal {
          --text-normal: var(--minimal-text-normal);
          --text-muted: var(--minimal-text-muted);
      }
      ```
   
   3. **Debugging Steps**
      1. Check theme variable inheritance
      2. Verify CSS specificity
      3. Test in both light/dark modes
      4. Validate contrast ratios
   ```

   b. **ITS Theme Issues**
   ```markdown
   ## ITS Theme Troubleshooting
   
   1. **Common Issues**
      - Grid alignment problems
      - Callout style mismatches
      - Timeline spacing issues
      - Color consistency problems
   
   2. **Solutions**
      ```css
      /* Fix grid issues */
      .theme-its .callout {
          display: grid;
          gap: var(--its-spacing);
      }
      
      /* Fix callout issues */
      .theme-its .callout {
          background: var(--its-card-bg);
          border: var(--its-border-width) solid var(--its-border-color);
      }
      
      /* Fix timeline issues */
      .theme-its [data-callout="timeline"] {
          --timeline-line-color: var(--its-border-color);
          --timeline-dot-color: var(--its-accent-color);
      }
      
      /* Fix color issues */
      .theme-its {
          --text-normal: var(--its-text-normal);
          --text-muted: var(--its-text-muted);
      }
      ```
   
   3. **Debugging Steps**
      1. Verify grid system implementation
      2. Check theme variable overrides
      3. Test responsive behavior
      4. Validate color consistency
   ```

5. **Theme Customization Plugins**

   a. **Minimal Theme Settings**
   ```markdown
   ## Minimal Theme Settings Integration
   
   1. **Layout Settings**
      - [ ] Card Style: Adjusts callout appearance
      - [ ] Border Radius: Affects callout and timeline corners
      - [ ] Spacing: Controls layout gaps and margins
      - [ ] Shadow: Modifies callout and card elevation
   
   2. **Color Settings**
      - [ ] Accent Color: Updates timeline dots and highlights
      - [ ] Background Colors: Affects callout backgrounds
      - [ ] Text Colors: Controls content readability
      - [ ] Border Colors: Modifies callout and timeline lines
   
   3. **Typography Settings**
      - [ ] Font Size: Affects content scaling
      - [ ] Line Height: Controls spacing in callouts
      - [ ] Font Family: Updates text appearance
      - [ ] Font Weight: Modifies emphasis levels
   ```

   b. **Style Settings Plugin**
   ```markdown
   ## Style Settings Integration
   
   1. **Layout Customization**
      ```css
      /* Style Settings Variables */
      :root {
          /* Callout Customization */
          --callout-custom-spacing: var(--style-settings-spacing);
          --callout-custom-radius: var(--style-settings-radius);
          --callout-custom-shadow: var(--style-settings-shadow);
          
          /* Timeline Customization */
          --timeline-custom-line-width: var(--style-settings-line-width);
          --timeline-custom-dot-size: var(--style-settings-dot-size);
          --timeline-custom-spacing: var(--style-settings-spacing);
      }
      ```
   
   2. **Color Customization**
      ```css
      /* Color Overrides */
      .style-settings-active {
          /* Primary Colors */
          --color-primary: var(--style-settings-primary);
          --color-primary-hover: var(--style-settings-primary-hover);
          
          /* Background Colors */
          --color-bg-primary: var(--style-settings-bg-primary);
          --color-bg-secondary: var(--style-settings-bg-secondary);
          
          /* Text Colors */
          --color-text-primary: var(--style-settings-text-primary);
          --color-text-secondary: var(--style-settings-text-secondary);
      }
      ```
   
   3. **Typography Customization**
      ```css
      /* Typography Overrides */
      .style-settings-active {
          /* Font Settings */
          --font-text: var(--style-settings-font-text);
          --font-heading: var(--style-settings-font-heading);
          
          /* Size Settings */
          --font-size-small: var(--style-settings-font-size-small);
          --font-size-normal: var(--style-settings-font-size-normal);
          --font-size-large: var(--style-settings-font-size-large);
          
          /* Weight Settings */
          --font-weight-normal: var(--style-settings-font-weight-normal);
          --font-weight-bold: var(--style-settings-font-weight-bold);
      }
      ```
   ```

   c. **Plugin Integration Best Practices**
   ```markdown
   ## Plugin Integration Guidelines
   
   1. **Variable Inheritance**
      - Use CSS custom properties for theme settings
      - Implement fallback values for missing settings
      - Maintain consistent variable naming
      - Document variable dependencies
   
   2. **Settings Priority**
      - Style Settings overrides take highest priority
      - Minimal Theme Settings follow next
      - Default theme values serve as fallback
      - Custom CSS has lowest priority
   
   3. **Performance Considerations**
      - Cache computed style values
      - Minimize style recalculations
      - Use efficient selectors
      - Implement lazy loading for custom styles
   
   4. **Testing Requirements**
      - Test with all setting combinations
      - Verify inheritance chain
      - Check performance impact
      - Validate accessibility
   ```

   d. **Common Plugin Issues**
   ```markdown
   ## Plugin-Specific Troubleshooting
   
   1. **Minimal Theme Settings Issues**
      - Settings not applying correctly
      - Inconsistent spacing
      - Color mismatches
      - Typography conflicts
   
   2. **Style Settings Issues**
      - Variable overrides not working
      - Performance degradation
      - Style conflicts
      - Inheritance problems
   
   3. **Solutions**
      ```css
      /* Fix Settings Priority */
      .style-settings-active {
          /* Ensure Style Settings take precedence */
          --callout-background: var(--style-settings-bg) !important;
          --callout-border-color: var(--style-settings-border) !important;
      }
      
      /* Fix Inheritance Chain */
      .theme-minimal.style-settings-active {
          /* Proper inheritance order */
          --callout-background: var(--style-settings-bg, var(--minimal-card-bg));
          --callout-border-color: var(--style-settings-border, var(--minimal-border-color));
      }
      
      /* Fix Performance */
      .style-settings-active {
          /* Optimize style calculations */
          contain: style layout;
          will-change: transform;
      }
      ```
   
   4. **Debugging Steps**
      1. Check settings inheritance
      2. Verify variable values
      3. Test style priority
      4. Monitor performance
   ```

   e. **Plugin Settings Combinations**
   ```markdown
   ## Common Settings Combinations
   
   1. **Minimal Theme + Style Settings**
      ```css
      /* Combined Settings Example */
      .theme-minimal.style-settings-active {
          /* Layout */
          --callout-spacing: var(--style-settings-spacing, var(--minimal-spacing));
          --callout-radius: var(--style-settings-radius, var(--minimal-radius));
          
          /* Colors */
          --callout-bg: var(--style-settings-bg, var(--minimal-card-bg));
          --callout-border: var(--style-settings-border, var(--minimal-border));
          
          /* Typography */
          --callout-font: var(--style-settings-font, var(--minimal-font));
      }
      
      /* Specific Combinations */
      /* Modern Minimal */
      .theme-minimal[data-minimal-style="modern"].style-settings-active {
          --callout-radius: 12px;
          --callout-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      /* Classic Minimal */
      .theme-minimal[data-minimal-style="classic"].style-settings-active {
          --callout-radius: 4px;
          --callout-shadow: none;
      }
      ```
   
   2. **Common Use Cases**
      ```css
      /* Timeline with Custom Colors */
      .style-settings-active [data-callout="timeline"] {
          --timeline-dot-color: var(--style-settings-accent);
          --timeline-line-color: var(--style-settings-border);
      }
      
      /* Callouts with Custom Typography */
      .style-settings-active .callout {
          font-family: var(--style-settings-font);
          line-height: var(--style-settings-line-height);
      }
      
      /* Gallery with Custom Spacing */
      .style-settings-active .gallery {
          gap: var(--style-settings-spacing);
          padding: var(--style-settings-spacing);
      }
      ```
   ```

   f. **Extended Troubleshooting**
   ```markdown
   ## Advanced Troubleshooting
   
   1. **Plugin Conflict Resolution**
      ```css
      /* Resolve Style Settings Conflicts */
      .style-settings-active {
          /* Force specific overrides */
          --callout-bg: var(--style-settings-bg) !important;
          --callout-border: var(--style-settings-border) !important;
      }
      
      /* Resolve Minimal Theme Conflicts */
      .theme-minimal {
          /* Ensure theme defaults */
          --minimal-card-bg: var(--background-primary);
          --minimal-border-color: var(--background-modifier-border);
      }
      
      /* Handle Combined Conflicts */
      .theme-minimal.style-settings-active {
          /* Proper inheritance with fallbacks */
          --callout-bg: var(--style-settings-bg, var(--minimal-card-bg, var(--background-primary)));
          --callout-border: var(--style-settings-border, var(--minimal-border-color, var(--background-modifier-border)));
      }
      ```
   
   2. **Common Edge Cases**
      ```css
      /* Handle Missing Variables */
      .style-settings-active {
          /* Fallback chain */
          --custom-color: var(--style-settings-color, var(--minimal-color, var(--text-normal)));
      }
      
      /* Handle Invalid Values */
      .style-settings-active {
          /* Validation and fallback */
          --custom-size: max(0px, min(100px, var(--style-settings-size, 16px)));
      }
      
      /* Handle Theme Switching */
      .theme-transitioning {
          /* Smooth transitions */
          transition: all 0.3s ease;
      }
      ```
   
   3. **Advanced Debugging Scenarios**
      ```css
      /* Debug Theme Switching */
      .theme-switching {
          /* Track theme changes */
          --theme-change-time: attr(data-theme-change-time);
          --previous-theme: attr(data-previous-theme);
          --current-theme: attr(data-current-theme);
      }
      
      /* Debug Style Settings */
      .style-settings-debug {
          /* Track setting changes */
          --setting-change-time: attr(data-setting-change-time);
          --previous-setting: attr(data-previous-setting);
          --current-setting: attr(data-current-setting);
      }
      
      /* Debug Layout Issues */
      .layout-debug {
          /* Visualize layout structure */
          --debug-grid: 1px solid rgba(255, 0, 0, 0.2);
          --debug-margin: 1px solid rgba(0, 255, 0, 0.2);
          --debug-padding: 1px solid rgba(0, 0, 255, 0.2);
      }
      
      /* Debug Performance Issues */
      .performance-debug {
          /* Track rendering performance */
          --render-start: attr(data-render-start);
          --render-end: attr(data-render-end);
          --render-duration: attr(data-render-duration);
      }
      ```
   
   4. **Complex Debugging Tools**
      ```css
      /* Advanced Variable Inspection */
      .variable-inspector {
          /* Track variable inheritance */
          --var-chain: attr(data-var-chain);
          --var-source: attr(data-var-source);
          --var-value: attr(data-var-value);
      }
      
      /* Style Conflict Detection */
      .conflict-detector {
          /* Identify conflicting styles */
          --conflict-selector: attr(data-conflict-selector);
          --conflict-property: attr(data-conflict-property);
          --conflict-value: attr(data-conflict-value);
      }
      
      /* Layout Flow Analysis */
      .flow-analyzer {
          /* Analyze layout flow */
          --flow-direction: attr(data-flow-direction);
          --flow-break: attr(data-flow-break);
          --flow-overflow: attr(data-flow-overflow);
      }
      
      /* Performance Profiling */
      .performance-profiler {
          /* Profile style calculations */
          --calc-time: attr(data-calc-time);
          --calc-count: attr(data-calc-count);
          --calc-impact: attr(data-calc-impact);
      }
      ```
   ```

   g. **Advanced Performance Optimization**
   ```markdown
   ## Performance Optimization Techniques
   
   1. **Style Calculation Optimization**
      ```css
      /* Reduce Style Recalculations */
      .optimized-element {
          /* Prevent unnecessary recalculations */
          contain: strict;
          content-visibility: auto;
          contain-intrinsic-size: 0 500px;
      }
      
      /* Optimize Layout Calculations */
      .optimized-layout {
          /* Reduce layout thrashing */
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
      }
      
      /* Optimize Paint Operations */
      .optimized-paint {
          /* Reduce paint operations */
          isolation: isolate;
          mix-blend-mode: normal;
          filter: none;
      }
      
      /* Optimize Composite Operations */
      .optimized-composite {
          /* Optimize compositing */
          transform: translate3d(0, 0, 0);
          perspective: 1000px;
          transform-style: preserve-3d;
      }
      ```
   
   2. **Memory Optimization**
      ```css
      /* Reduce Memory Usage */
      .memory-optimized {
          /* Optimize memory usage */
          contain: size layout;
          content-visibility: auto;
          contain-intrinsic-size: 0;
      }
      
      /* Optimize Image Loading */
      .image-optimized {
          /* Optimize image loading */
          loading: lazy;
          decoding: async;
          fetchpriority: low;
      }
      
      /* Optimize Font Loading */
      .font-optimized {
          /* Optimize font loading */
          font-display: swap;
          font-feature-settings: normal;
          font-variation-settings: normal;
      }
      ```
   
   3. **Rendering Optimization**
      ```css
      /* Optimize Rendering Pipeline */
      .render-optimized {
          /* Optimize rendering */
          contain: paint;
          content-visibility: auto;
          contain-intrinsic-size: 0 500px;
      }
      
      /* Optimize Animations */
      .animation-optimized {
          /* Optimize animations */
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
      }
      
      /* Optimize Transitions */
      .transition-optimized {
          /* Optimize transitions */
          transition-property: transform, opacity;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
      }
      ```
   ```

   h. **Advanced Conflict Prevention**
   ```markdown
   ## Advanced Conflict Prevention
   
   1. **Isolation Strategies**
      ```css
      /* Isolate Components */
      .isolated-component {
          /* Prevent style leakage */
          contain: style layout;
          isolation: isolate;
          mix-blend-mode: normal;
      }
      
      /* Isolate Themes */
      .isolated-theme {
          /* Prevent theme conflicts */
          --theme-scope: local;
          --theme-isolation: strict;
          --theme-containment: style;
      }
      
      /* Isolate Plugins */
      .isolated-plugin {
          /* Prevent plugin conflicts */
          --plugin-scope: local;
          --plugin-isolation: strict;
          --plugin-containment: style;
      }
      ```
   
   2. **Scope Management**
      ```css
      /* Manage Style Scope */
      .scoped-styles {
          /* Control style scope */
          --style-scope: local;
          --style-isolation: strict;
          --style-containment: style;
      }
      
      /* Manage Theme Scope */
      .scoped-theme {
          /* Control theme scope */
          --theme-scope: local;
          --theme-isolation: strict;
          --theme-containment: style;
      }
      
      /* Manage Plugin Scope */
      .scoped-plugin {
          /* Control plugin scope */
          --plugin-scope: local;
          --plugin-isolation: strict;
          --plugin-containment: style;
      }
      ```
   
   3. **Dependency Management**
      ```css
      /* Manage Style Dependencies */
      .style-dependencies {
          /* Control style dependencies */
          --style-deps: minimal;
          --style-order: strict;
          --style-priority: high;
      }
      
      /* Manage Theme Dependencies */
      .theme-dependencies {
          /* Control theme dependencies */
          --theme-deps: minimal;
          --theme-order: strict;
          --theme-priority: high;
      }
      
      /* Manage Plugin Dependencies */
      .plugin-dependencies {
          /* Control plugin dependencies */
          --plugin-deps: minimal;
          --plugin-order: strict;
          --plugin-priority: high;
      }
      ```
   
   4. **Version Control**
      ```css
      /* Control Style Versions */
      .versioned-styles {
          /* Control style versions */
          --style-version: 1.0.0;
          --style-compatibility: strict;
          --style-upgrade: manual;
      }
      
      /* Control Theme Versions */
      .versioned-theme {
          /* Control theme versions */
          --theme-version: 1.0.0;
          --theme-compatibility: strict;
          --theme-upgrade: manual;
      }
      
      /* Control Plugin Versions */
      .versioned-plugin {
          /* Control plugin versions */
          --plugin-version: 1.0.0;
          --plugin-compatibility: strict;
          --plugin-upgrade: manual;
      }
      ```
   ```

## Layout Components

### 1. Dream Entry Layouts

1. **Basic Entry**
   ```markdown
   > [!journal-entry|20250513]
   > 
   > ## Dream Content
   > {{content}}
   > 
   > ## Metrics
   > - Vividness: {{input:Vividness (1-5)}}
   > - Emotional Intensity: {{input:Intensity (1-5)}}
   ```

2. **Detailed Entry**
   ```markdown
   > [!journal-entry|20250513] Multi-column
   > 
   > > [!dream-content] Column 1
   > > ## Dream Content
   > > {{content}}
   > > 
   > > > [!dream-analysis] Column 2
   > > > ## Analysis
   > > > - Themes: {{input:Themes}}
   > > > - Symbols: {{input:Symbols}}
   > > > - Interpretation: {{input:Interpretation}}
   ```

### 2. Summary Layouts

1. **Weekly Summary**
   ```markdown
   > [!weekly|20250513] List-column
   > 
   > > [!dream-list] Column 1
   > > ## Daily Entries
   > > - [[2025-05-13]]
   > > - [[2025-05-14]]
   > > 
   > > > [!dream-stats] Column 2
   > > > ## Statistics
   > > > - Total Dreams: 7
   > > > - Average Vividness: 3.5
   ```

2. **Monthly Review**
   ```markdown
   > [!monthly|202505] Gallery
   > 
   > > [!dream-chart] Chart 1
   > > ![[vividness-chart.png]]
   > > 
   > > > [!dream-chart] Chart 2
   > > > ![[themes-chart.png]]
   ```

### 3. Timeline Layouts

1. **Basic Timeline**
   ```markdown
   > [!journal-entry|20250513] Timeline
   > 
   > > [!timeline|blue] Dream Sequence
   > > 
   > > > [!timeline-event] Initial Scene
   > > > Time: {{input:Time}}
   > > > Location: {{input:Location}}
   > > > 
   > > > > [!timeline-event] Transition
   > > > > Time: {{input:Time}}
   > > > > Location: {{input:Location}}
   > > > > 
   > > > > > [!timeline-event] Final Scene
   > > > > > Time: {{input:Time}}
   > > > > > Location: {{input:Location}}
   ```

2. **Rich Timeline**
   ```markdown
   > [!journal-entry|20250513] Timeline
   > 
   > > [!timeline|purple] Dream Journey
   > > 
   > > > [!timeline-event] Scene 1
   > > > ## Initial State
   > > > - Time: {{input:Time}}
   > > > - Location: {{input:Location}}
   > > > - Emotional State: {{input:Emotional State}}
   > > > 
   > > > > [!timeline-event] Scene 2
   > > > > ## Transformation
   > > > > - Time: {{input:Time}}
   > > > > - Location: {{input:Location}}
   > > > > - Emotional State: {{input:Emotional State}}
   > > > > 
   > > > > > [!timeline-event] Scene 3
   > > > > > ## Resolution
   > > > > > - Time: {{input:Time}}
   > > > > > - Location: {{input:Location}}
   > > > > > - Emotional State: {{input:Emotional State}}
   ```

3. **Timeline with Analysis**
   ```markdown
   > [!journal-entry|20250513] Timeline
   > 
   > > [!timeline|green] Dream Analysis
   > > 
   > > > [!timeline-event] Beginning
   > > > ## Scene
   > > > {{input:Scene Description}}
   > > > 
   > > > ## Analysis
   > > > - Themes: {{input:Themes}}
   > > > - Symbols: {{input:Symbols}}
   ```

## Obsidian Core Appearance Settings

### Core Settings Integration

1. **Readable Line Length**
   ```css
   /* Readable Line Length Integration */
   .markdown-preview-view.is-readable-line-width {
       /* Default readable line width */
       --line-width: 65ch;
       --line-width-adaptive: 65ch;
       --max-width: 65ch;
   }
   
   /* Full Width Override */
   .markdown-preview-view.is-readable-line-width.oom-full-width {
       --line-width: 100%;
       --line-width-adaptive: 100%;
       --max-width: none;
   }
   ```

2. **Font Settings**
   ```css
   /* Font Integration */
   .markdown-preview-view {
       /* Text Font */
       --font-text: var(--font-text-family);
       --font-text-size: var(--font-text-size);
       --font-text-line-height: var(--font-text-line-height);
       
       /* UI Font */
       --font-ui: var(--font-ui-family);
       --font-ui-size: var(--font-ui-size);
       --font-ui-line-height: var(--font-ui-line-height);
       
       /* Monospace Font */
       --font-monospace: var(--font-monospace-family);
       --font-monospace-size: var(--font-monospace-size);
       --font-monospace-line-height: var(--font-monospace-line-height);
   }
   ```

3. **Text Size Settings**
   ```css
   /* Text Size Integration */
   .markdown-preview-view {
       /* Base Text Sizes */
       --font-size-small: calc(var(--font-text-size) * 0.875);
       --font-size-normal: var(--font-text-size);
       --font-size-large: calc(var(--font-text-size) * 1.25);
       
       /* Heading Sizes */
       --h1-size: calc(var(--font-text-size) * 2);
       --h2-size: calc(var(--font-text-size) * 1.5);
       --h3-size: calc(var(--font-text-size) * 1.25);
       --h4-size: calc(var(--font-text-size) * 1.1);
       --h5-size: var(--font-text-size);
       --h6-size: calc(var(--font-text-size) * 0.9);
   }
   ```

4. **Spacing Settings**
   ```css
   /* Spacing Integration */
   .markdown-preview-view {
       /* Base Spacing */
       --spacing-xs: 4px;
       --spacing-sm: 8px;
       --spacing-md: 16px;
       --spacing-lg: 24px;
       --spacing-xl: 32px;
       
       /* Component Spacing */
       --callout-padding: var(--spacing-md);
       --timeline-spacing: var(--spacing-md);
       --gallery-gap: var(--spacing-md);
   }
   ```

### Settings Interaction

1. **Readable Line Length Behavior**
   ```markdown
   ## Readable Line Length Options
   
   1. **Default Mode**
      - Respects Obsidian's readable line length setting
      - Content is centered and width-limited
      - Tables and galleries adapt to width
   
   2. **Full Width Mode**
      - Overrides readable line length setting
      - Content spans full viewport width
      - Tables and galleries expand to fill space
      - Toggle available in settings
   ```

2. **Font Size Scaling**
   ```markdown
   ## Font Size Behavior
   
   1. **Base Text**
      - Scales with Obsidian's text size setting
      - Maintains readability at all sizes
      - Preserves line height ratios
   
   2. **Headings**
      - Proportional scaling with base text
      - Maintains hierarchy at all sizes
      - Preserves spacing relationships
   
   3. **UI Elements**
      - Scales with UI font size setting
      - Maintains touch targets at all sizes
      - Preserves visual hierarchy
   ```

3. **Spacing Adaptation**
   ```markdown
   ## Spacing Behavior
   
   1. **Component Spacing**
      - Adapts to text size changes
      - Maintains visual rhythm
      - Preserves readability
   
   2. **Layout Spacing**
      - Scales with viewport size
      - Maintains proportions
      - Preserves visual balance
   ```

### Best Practices

1. **Readable Line Length**
   ```markdown
   ## Readable Line Length Guidelines
   
   1. **Default Mode**
      - Use for standard content
      - Maintains readability
      - Works with all themes
   
   2. **Full Width Mode**
      - Use for data-heavy content
      - Improves table visibility
      - Better for wide screens
   ```

2. **Font Settings**
   ```markdown
   ## Font Usage Guidelines
   
   1. **Text Font**
      - Use for main content
      - Maintains readability
      - Scales with user settings
   
   2. **UI Font**
      - Use for controls and labels
      - Maintains consistency
      - Scales with UI settings
   
   3. **Monospace Font**
      - Use for code and metrics
      - Maintains alignment
      - Scales with monospace settings
   ```

3. **Spacing Guidelines**
   ```markdown
   ## Spacing Usage Guidelines
   
   1. **Component Spacing**
      - Use consistent spacing
      - Scale with text size
      - Maintain visual rhythm
   
   2. **Layout Spacing**
      - Use proportional spacing
      - Scale with viewport
      - Maintain visual balance
   ```

### Troubleshooting

1. **Readable Line Length Issues**
   ```markdown
   ## Common Issues
   
   1. **Content Width**
      - Check readable line length setting
      - Verify full width override
      - Test with different themes
   
   2. **Table Display**
      - Check table container width
      - Verify column proportions
      - Test with different content
   ```

2. **Font Issues**
   ```markdown
   ## Common Issues
   
   1. **Text Scaling**
      - Check font size settings
      - Verify font family settings
      - Test with different sizes
   
   2. **UI Scaling**
      - Check UI font settings
      - Verify component sizes
      - Test with different themes
   ```

3. **Spacing Issues**
   ```markdown
   ## Common Issues
   
   1. **Component Spacing**
      - Check spacing variables
      - Verify component margins
      - Test with different sizes
   
   2. **Layout Spacing**
      - Check layout variables
      - Verify container spacing
      - Test with different content
   ```

## Metrics Table Column Class Naming Convention

To enable precise CSS targeting for each column in the OneiroMetrics metrics table, both <th> and <td> elements in the detailed dream entries table are assigned specific classes based on their column name.

> **Note:** As of May 2025, this convention is implemented only for the detailed dream entries table, not the summary table.

### Naming Convention
- All classes are prefixed with `column-` followed by a lowercase, hyphenated version of the column name.
- For metric columns, use the metric name (lowercased, spaces replaced with hyphens).

### Standard Columns
| Column Name   | <th> Class             | <td> Class             |
|---------------|--------------------------|--------------------------|
| Date          | column-date            | column-date            |
| Dream Title   | column-dream-title     | column-dream-title     |
| Words         | column-words           | column-words           |
| Content       | column-content         | column-content         |

### Metric Columns
For each enabled metric (e.g., "Confidence Score", "Lucidity"):
| Column Name         | <th> Class                       | <td> Class                       |
|---------------------|------------------------------------|------------------------------------|
| Confidence Score    | column-metric-confidence-score   | column-metric-confidence-score   |
| Lucidity            | column-metric-lucidity           | column-metric-lucidity           |
| (etc.)              | ...                              | ...                              |

*Metric names should be lowercased and spaces replaced with hyphens.*

### Example Table Row
```html
<tr>
  <td class="column-date">2025-05-15</td>
  <td class="column-dream-title">Flying Over Mountains</td>
  <td class="column-words">123</td>
  <td class="column-content">We were making toys in the outdoors...</td>
  <td class="column-metric-confidence-score">5</td>
  <td class="column-metric-lucidity">3</td>
  <!-- ...other metrics -->
</tr>
```

And the corresponding header:
```html
<tr>
  <th class="column-date">Date</th>
  <th class="column-dream-title">Dream Title</th>
  <th class="column-words">Words</th>
  <th class="column-content">Content</th>
  <th class="column-metric-confidence-score">Confidence Score</th>
  <th class="column-metric-lucidity">Lucidity</th>
  <!-- ...other metrics -->
</tr>
```