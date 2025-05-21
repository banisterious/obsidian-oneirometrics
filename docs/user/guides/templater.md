# Templater Integration

## Overview

OneiroMetrics now uses Templater as its recommended template engine, providing powerful dynamic content capabilities while maintaining backward compatibility through a fallback mechanism for users who don't have Templater installed.

## Table of Contents
- [Overview](#overview)
- [Why Templater?](#why-templater)
- [Fallback Mechanism](#fallback-mechanism)
  - [How It Works](#how-it-works)
  - [Placeholder Format](#placeholder-format)
  - [Using Placeholders](#using-placeholders)
- [Setting Up Templater](#setting-up-templater)
- [Creating Templates with Templater](#creating-templates-with-templater)
  - [Basic Template Example](#basic-template-example)
  - [Advanced Techniques](#advanced-techniques)
- [Compatibility and Migration](#compatibility-and-migration)
  - [Migrating Existing Templates](#migrating-existing-templates)
  - [Compatibility Notes](#compatibility-notes)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
- [Resources](#resources)

## Why Templater?

Templater offers several advantages over basic templates:

1. **Dynamic Date Formatting**
   - Insert dates in any format: `<% tp.date.now("YYYY-MM-DD") %>`
   - Use relative dates: `<% tp.date.now("dddd, MMMM DD, YYYY", 7) %>` (one week from now)
   - Format dream entry dates automatically

2. **User Prompts and Inputs**
   - Interactive template creation: `<% tp.system.prompt("How would you rate clarity?", "7") %>`
   - Multiple-choice selections: `<% tp.system.suggester(["Low", "Medium", "High"], ["1-3", "4-7", "8-10"]) %>`
   - Create customized journal entries with minimal effort

3. **Conditional Content**
   - Include sections based on conditions: `<% if (tp.file.title.includes("lucid")) { %>Lucid Dream<% } else { %>Regular Dream<% } %>`
   - Adapt template structure dynamically
   - Show relevant metrics based on dream types

4. **System Integration**
   - Access file metadata: `<% tp.file.creation_date() %>`
   - Reference other notes: `<% tp.file.include("[[DreamSymbols]]") %>`
   - Create interconnected journal entries

## Fallback Mechanism

For users who don't have Templater installed, OneiroMetrics provides a fallback system:

### How It Works

1. When you save a template, OneiroMetrics automatically generates a static version with placeholders
2. If Templater is not installed when you use the template, the static version is used instead
3. Placeholders are automatically highlighted and easy to navigate

### Placeholder Format

Templater syntax is converted to user-friendly placeholders:

| Templater Syntax | Static Placeholder |
|------------------|-------------------|
| `<% tp.date.now("YYYY-MM-DD") %>` | `[[DATE: YYYY-MM-DD]]` |
| `<% tp.system.prompt("Enter mood", "neutral") %>` | `[[PROMPT: Enter mood (default: neutral)]]` |
| `<% tp.file.title %>` | `[[FILENAME]]` |

### Using Placeholders

When inserting a template with placeholders:

1. Your cursor automatically moves to the first placeholder
2. Fill in the information and press Tab to move to the next placeholder
3. All placeholders are visually distinct to make them easy to find

## Setting Up Templater

To get the full functionality of OneiroMetrics templates:

1. Install the Templater plugin from Obsidian's Community Plugins
   - Open Obsidian Settings > Community plugins
   - Turn off Safe mode if prompted
   - Browse for "Templater" and install
   - Enable the plugin

2. Configure Templater (recommended settings)
   - Set template folder location to match your OneiroMetrics settings
   - Enable trigger on new file creation
   - Configure hotkeys for template insertion (optional)

## Creating Templates with Templater

### Basic Template Example

```markdown
# Dream Journal: <% tp.date.now("YYYY-MM-DD") %>

## Summary
<% tp.system.prompt("Enter a brief summary of your dream", "I was in a forest...") %>

> [!dream]
> <% tp.system.prompt("Describe your dream in detail", "") %>

> [!symbols]
> - Symbol 1: <% tp.system.prompt("What does it mean?", "") %>
> - Symbol 2: <% tp.system.prompt("What does it mean?", "") %>

> [!metrics]
> Clarity: <% tp.system.prompt("Rate clarity (1-10)", "7") %>
> Vividness: <% tp.system.prompt("Rate vividness (1-10)", "7") %>
> Coherence: <% tp.system.prompt("Rate coherence (1-10)", "7") %>
```

### Advanced Techniques

#### Date Formatting

```markdown
Today: <% tp.date.now("YYYY-MM-DD") %>
Yesterday: <% tp.date.now("YYYY-MM-DD", -1) %>
Tomorrow: <% tp.date.now("YYYY-MM-DD", 1) %>
Full date: <% tp.date.now("dddd, MMMM Do YYYY") %>
```

#### Conditional Content

```markdown
<% if (tp.file.title.includes("lucid")) { %>
> [!lucid]
> This was a lucid dream. I realized I was dreaming when: <% tp.system.prompt("When did you realize you were dreaming?") %>
<% } %>
```

#### Dynamic Sections

```markdown
<% 
let dreamType = tp.system.suggester(
  ["Nightmare", "Lucid Dream", "Recurring Dream", "Normal Dream"], 
  ["nightmare", "lucid", "recurring", "normal"]
) 
%>

> [!dream-type]
> Type: <%= dreamType %>

<% if (dreamType === "nightmare") { %>
> [!nightmare]
> Fear level: <% tp.system.prompt("Rate fear level (1-10)", "8") %>
<% } %>
```

## Compatibility and Migration

### Migrating Existing Templates

1. Open the Template Wizard
2. Select your existing template
3. Toggle "Use Templater" to Yes
4. The wizard will convert your template to Templater format
5. Review and customize the Templater syntax as needed

### Compatibility Notes

- All existing templates continue to work
- Non-Templater templates are fully supported
- The system automatically detects if Templater is available

## Troubleshooting

### Common Issues

**Templater syntax not processing:**
- Ensure Templater plugin is installed and enabled
- Check that your template file is in the correct format
- Verify syntax follows the `<% %>` pattern

**Placeholder navigation not working:**
- Ensure you're using the latest version of OneiroMetrics
- Try reinserting the template
- Check for any error messages in the console

## Resources

- [Official Templater Documentation](https://silentvoid13.github.io/Templater/)
- [Templater GitHub Repository](https://github.com/SilentVoid13/Templater)
- [OneiroMetrics Usage Guide](./usage.md#using-templates) 