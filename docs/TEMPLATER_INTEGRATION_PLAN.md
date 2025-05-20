# Templater Integration Plan

## Overview

This document outlines the plan to standardize OneiroMetrics template functionality on Templater, while providing a fallback mechanism for users who don't have Templater installed.

Date: 2025-05-20

## Current Status

- The Template Wizard now exclusively supports Templater for dynamic content
- Step 3 in the wizard has been renamed from "Template Source" to "Templater Integration"
- The codebase has moved away from Obsidian's core template functionality

## Benefits of Standardizing on Templater

1. **Enhanced functionality**
   - Dynamic date formatting
   - User prompts and inputs
   - Conditional content and logic
   - System information access

2. **Consistency across the plugin**
   - Single approach to templates
   - Easier to maintain and extend
   - Less complex UI with fewer options

3. **Alignment with community practices**
   - Templater is widely adopted in the Obsidian community
   - Extensive documentation and support available

## Fallback Mechanism for Users Without Templater

To support users who haven't installed Templater, we'll implement a fallback mechanism:

### 1. Detection and Notification
- When a user attempts to use a Templater template without Templater installed:
  - Show a clear notice: "This template requires the Templater plugin for dynamic functionality. Using static version instead."
  - Provide a link to install Templater

### 2. Template Preprocessing
- When saving Templater templates, store both the dynamic version and a "static" version with placeholders
- Convert Templater variables to user-friendly, editable placeholders:
  - Example: `<% tp.date.now("YYYY-MM-DD") %>` becomes `[[DATE: YYYY-MM-DD]]`
  - Example: `<% tp.system.prompt("Enter mood", "neutral") %>` becomes `[[PROMPT: Enter mood (default: neutral)]]`

### 3. Insertion Logic
```typescript
// In insertTemplate function
if (template.isTemplaterTemplate && template.templaterFile) {
    if (this.templaterIntegration && this.templaterIntegration.isTemplaterInstalled()) {
        // Use Templater as currently implemented
        content = await this.templaterIntegration.processTemplaterTemplate(template.templaterFile);
    } else {
        // Fallback - use static version with placeholders
        content = template.staticContent || template.content;
        new Notice('Templater not installed. Using static template with placeholders.');
    }
} else {
    // Regular non-Templater template
    content = template.content;
}
```

### 4. User Experience
- After inserting a template with placeholders, the cursor automatically moves to the first placeholder
- Add a simple utility to help users find and fill in all placeholders
- Highlight placeholders with a different color to make them more visible

### 5. UI Mockups

```
┌─────────────────────── Template Wizard ───────────────────────┐
│                                                               │
│  Step 3 of 4: Templater Integration                      ○●○○ │
│  ─────────────────────────────────────────────────────────    │
│                                                               │
│  [ℹ️] Templater provides powerful dynamic content              │
│      capabilities for your templates.                         │
│                                                               │
│  Template Source:                                             │
│  ○ Create New Template                                        │
│  ● Use Existing Templater Template                            │
│                                                               │
│  Template File: [oom-dream-entry.md                     🔍]   │
│                                                               │
│  Preview:                                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ## Dream Entry: <% tp.date.now("YYYY-MM-DD") %>         │  │
│  │                                                         │  │
│  │ **Mood:** <% tp.system.prompt("Enter mood", "neutral") %>│  │
│  │ **Time:** <% tp.system.prompt("Time of day", "night") %>│  │
│  │                                                         │  │
│  │ [!dream-metrics]                                        │  │
│  │ clarity: 3                                              │  │
│  │ vividness: 4                                            │  │
│  │ [!end-dream-metrics]                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Static Fallback Preview (when Templater is not installed):   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ## Dream Entry: [[DATE: YYYY-MM-DD]]                    │  │
│  │                                                         │  │
│  │ **Mood:** [[PROMPT: Enter mood (default: neutral)]]     │  │
│  │ **Time:** [[PROMPT: Time of day (default: night)]]      │  │
│  │                                                         │  │
│  │ [!dream-metrics]                                        │  │
│  │ clarity: 3                                              │  │
│  │ vividness: 4                                            │  │
│  │ [!end-dream-metrics]                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│                                                               │
│  [  Back  ]                               [  Next  ]          │
└───────────────────────────────────────────────────────────────┘

┌─────────── Template Insertion Notification ──────────────┐
│                                                          │
│  ⚠️ Templater not installed                              │
│                                                          │
│  This template uses Templater for dynamic content.       │
│  A static version with placeholders has been inserted.   │
│                                                          │
│  [Install Templater]        [Don't show again]  [Close]  │
└──────────────────────────────────────────────────────────┘

┌─── Template with Placeholders (Editor View) ───┐
│                                                │
│ ## Dream Entry: [[DATE: YYYY-MM-DD]]           │
│                                                │
│ **Mood:** [[PROMPT: Enter mood (default...     │
│ **Time:** [[PROMPT: Time of day (defaul...     │
│                                                │
│ [!dream-metrics]                               │
│ clarity: 3                                     │
│ vividness: 4                                   │
│ [!end-dream-metrics]                           │
│                                                │
└────────────────────────────────────────────────┘
```

Key UI elements:
- Dual preview showing both Templater syntax and static fallback
- Visual highlighting for placeholders
- Notification when Templater isn't installed
- Easy-to-identify placeholders in the editor

## Risks and Mitigations

### 1. Template Conversion Complexity
- **Risk**: Complex Templater syntax might not convert cleanly to static placeholders
- **Mitigation**: 
  - Create a comprehensive conversion regex library for common Templater patterns
  - Add a validation step that flags potentially problematic conversions
  - Implement a fallback that preserves original syntax with clear instructions when conversion fails

### 2. Storage Impact
- **Risk**: Storing both dynamic and static versions could increase storage requirements
- **Mitigation**:
  - Monitor storage impact during implementation
  - Consider implementing on-demand conversion instead of storing both versions if impact is significant
  - Implement cleanup utility to remove redundant template data if no longer needed

### 3. User Experience Consistency
- **Risk**: Two different experiences depending on whether Templater is installed
- **Mitigation**:
  - Design the placeholder UI to mimic Templater's functionality where possible
  - Create clear visual indicators for replaceable placeholders
  - Make placeholder interaction intuitive and accessible

### 4. Templater Dependency Issues
- **Risk**: Future Templater updates could break integration
- **Mitigation**:
  - Monitor Templater GitHub repository for upcoming changes
  - Implement version checking to detect compatibility issues
  - Design the integration with loose coupling to minimize dependency risks

### 5. Backward Compatibility
- **Risk**: Existing templates might not work with the new system
- **Mitigation**:
  - Create an automatic migration path for existing templates
  - Preserve original functionality alongside new features
  - Include thorough testing with a variety of existing templates

## Implementation Plan (Same-Day Implementation)

### Phase 1: Update Data Model (Morning)
1. **Update JournalTemplate Interface**
   - Add `staticContent` field to store the pre-processed static version

2. **Enhance TemplaterIntegration Class**
   - Add methods to generate static versions of templates
   - Implement placeholder conversion logic

### Phase 2: Update UI and Functionality (Afternoon)
1. **Update Template Wizard**
   - Clarify that Templater is recommended
   - Preview both dynamic and static versions of templates
   - Save both versions when creating/editing templates

2. **Update Template Insertion Logic**
   - Implement the fallback mechanism in `insertTemplate()`
   - Add placeholder navigation

### Phase 3: Documentation and User Guidance (Evening)
1. **Update Plugin Documentation**
   - Clarify that Templater is the recommended way to use templates
   - Instructions for manually filling in placeholders when Templater isn't available
   - Guidance on installing Templater for the full experience

2. **In-Plugin Guidance**
   - Add helpful instructions when using static templates
   - Improve notification messages

## Testing Strategy

### Automated Tests
1. **Unit Tests**
   - Test template conversion functions with various Templater syntax patterns
   - Verify template storage and retrieval with both versions
   - Test placeholder detection and replacement

2. **Integration Tests**
   - Verify template insertion with Templater installed
   - Verify template insertion with Templater not installed
   - Test cursor positioning after template insertion
   - Verify placeholder navigation and replacement

### Manual Testing Scenarios
1. **With Templater**
   - Create and use templates with various Templater functions
   - Verify all dynamic content resolves correctly
   - Test with complex nested Templater syntax

2. **Without Templater**
   - Verify fallback mechanism activates correctly
   - Test placeholder visibility and navigation
   - Verify notification and guidance are clear
   - Test manually filling in all placeholders

3. **Cross-environment Testing**
   - Test on different operating systems
   - Test with various vault structures
   - Verify performance with large templates

## Rollback Strategy

In case of significant issues discovered during or after implementation:

1. **Code Versioning**
   - Maintain a feature branch separate from main until full testing is complete
   - Tag release points for easy rollback

2. **Data Migration**
   - Store template data in a backward-compatible format
   - Implement data versioning to allow conversion back to pre-integration format

3. **Feature Flags**
   - Add a settings toggle to disable Templater integration and use legacy template system
   - Allow temporary reversion to previous behavior while issues are addressed

4. **Emergency Patch Plan**
   - Prepare simplified hotfix process for critical issues
   - Document steps for rapid deployment of fixes

## Success Metrics

The integration will be considered successful when:

1. **Functionality**
   - All existing templates continue to work as expected
   - Templates with Templater syntax function correctly when Templater is installed
   - Static fallback provides usable functionality when Templater is not installed

2. **Performance**
   - Template creation and insertion performance remains within 10% of pre-integration metrics
   - No significant increase in storage requirements

3. **Code Quality**
   - Integration passes all automated tests
   - Code maintains or improves maintainability scores
   - Documentation is complete and accurate

4. **User Experience**
   - Template creation workflow remains intuitive
   - Placeholder system is usable without additional training
   - No increase in template-related error reports

## Migration and Compatibility
- Existing templates will continue to work
- Users can open and edit existing templates with the updated wizard
- Non-Templater templates will be maintained for backward compatibility

## Future Considerations
- Enhance placeholder detection and replacement
- Add more advanced fallback capabilities
- Consider generating full static alternatives for complex Templater templates 