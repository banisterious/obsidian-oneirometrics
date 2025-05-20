# Templater Integration Plan

## Overview

This document outlines the plan to standardize OneiroMetrics template functionality on Templater, while providing a fallback mechanism for users who don't have Templater installed.

Date: 2025-05-21

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

## Implementation Plan

### Phase 1: Update Data Model
1. **Update JournalTemplate Interface**
   - Add `staticContent` field to store the pre-processed static version

2. **Enhance TemplaterIntegration Class**
   - Add methods to generate static versions of templates
   - Implement placeholder conversion logic

### Phase 2: Update UI and Functionality
1. **Update Template Wizard**
   - Clarify that Templater is recommended
   - Preview both dynamic and static versions of templates
   - Save both versions when creating/editing templates

2. **Update Template Insertion Logic**
   - Implement the fallback mechanism in `insertTemplate()`
   - Add placeholder navigation

### Phase 3: Documentation and User Guidance
1. **Update Plugin Documentation**
   - Clarify that Templater is the recommended way to use templates
   - Instructions for manually filling in placeholders when Templater isn't available
   - Guidance on installing Templater for the full experience

2. **In-Plugin Guidance**
   - Add helpful instructions when using static templates
   - Improve notification messages

## Migration and Compatibility
- Existing templates will continue to work
- Users can open and edit existing templates with the updated wizard
- Non-Templater templates will be maintained for backward compatibility

## Future Considerations
- Enhance placeholder detection and replacement
- Add more advanced fallback capabilities
- Consider generating full static alternatives for complex Templater templates 