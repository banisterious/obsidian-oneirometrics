# Documentation Style Guide

## Executive Summary

- **Consistency**: Maintain consistent formatting, voice, and structure across all documentation
- **Visual Aid**: Use annotated screenshots and images to enhance understanding
- **Accessibility**: Ensure all documentation is accessible to all users
- **Organization**: Follow the established file and section structure for all documents
- **User-Focused**: Write from the user's perspective with clear, concise language

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Voice and Tone](#2-voice-and-tone)
- [3. Documentation Types](#3-documentation-types)
- [4. Image Guidelines](#4-image-guidelines)
  - [4.1. Image Organization and Sizing](#41-image-organization-and-sizing)
  - [4.2. Banner Creation](#42-banner-creation)
- [5. Annotated Screenshots](#5-annotated-screenshots)
  - [5.1. Purpose](#51-purpose)
  - [5.2. Key Sections to Annotate](#52-key-sections-to-annotate)
  - [5.3. Steps for Creating Screenshots](#53-steps-for-creating-screenshots)
  - [5.4. Suggested Locations](#54-suggested-locations)
  - [5.5. Annotated Screenshot Template](#55-annotated-screenshot-template)
- [6. CSS Styling](#6-css-styling)
  - [6.1. Banner Fade Effect](#61-banner-fade-effect)
  - [6.2. Lucide Icon Overlay](#62-lucide-icon-overlay)
  - [6.3. Custom Callout Background](#63-custom-callout-background)
- [7. Color Palette](#7-color-palette)
  - [7.1. From "gsa-barn"](#71-from-gsa-barn)
  - [7.2. From "gsa-strange-landscape"](#72-from-gsa-strange-landscape)
- [8. Modal and Leaf Design Standards](#8-modal-and-leaf-design-standards)
  - [8.1. Standard Modal Layout](#81-standard-modal-layout)
  - [8.2. Implementation Notes](#82-implementation-notes)
- [9. Accessibility Guidelines](#9-accessibility-guidelines)
  - [9.1. Images and Visual Content](#91-images-and-visual-content)
  - [9.2. Structure and Navigation](#92-structure-and-navigation)
  - [9.3. Text and Readability](#93-text-and-readability)
- [10. Mobile Considerations](#10-mobile-considerations)
  - [10.1. Responsive Design](#101-responsive-design)
  - [10.2. Touch Interactions](#102-touch-interactions)
- [11. Documentation Review Process](#11-documentation-review-process)
  - [11.1. Review Checklist](#111-review-checklist)
  - [11.2. Workflow](#112-workflow)
- [12. Version Control Guidelines](#12-version-control-guidelines)
  - [12.1. When to Update Documentation](#121-when-to-update-documentation)
  - [12.2. Versioning Strategy](#122-versioning-strategy)
- [13. Documentation Templates](#13-documentation-templates)
  - [13.1. Feature Documentation Template](#131-feature-documentation-template)
  - [13.2. Tutorial Template](#132-tutorial-template)
- [14. Implementation Checklist](#14-implementation-checklist)

## 1. Introduction

This document provides guidelines for the visual style and presentation of OneiroMetrics plugin documentation, ensuring consistency, clarity, and user-friendliness. It covers writing style, image usage, annotated screenshots, and CSS styling.

The primary goal of our documentation is to help users understand and effectively use the OneiroMetrics plugin while adhering to a consistent style that reflects the project's aesthetic and values.

## 2. Voice and Tone

### Writing Style

- **Person**: Use second person ("you") when addressing the user directly
- **Tense**: Use present tense for actions and descriptions
- **Active Voice**: Prefer active voice over passive voice
- **Clarity**: Use clear, concise language without unnecessary jargon
- **Consistency**: Maintain consistent terminology throughout all documentation

### Examples

#### Preferred:
- "Click the Settings button to access configuration options."
- "You can customize your metrics by adding new entries."
- "The plugin automatically creates backups before making changes."

#### Avoid:
- "The Settings button should be clicked to access configuration options."
- "Users may customize their metrics by adding new entries."
- "Backups are automatically created by the plugin before changes are made."

### Technical Writing Guidelines

- Break complex procedures into numbered steps
- Use bullet points for lists of related items
- Highlight important notes using blockquotes (> syntax in Markdown)
- Use code blocks for any commands, callout syntax, or code examples
- Define abbreviations and technical terms on first use

## 3. Documentation Types

OneiroMetrics documentation includes several types, each with specific purposes:

### User Guide (USAGE.md)
- **Purpose**: Comprehensive instructions for using the plugin
- **Structure**: Organized by features, with step-by-step instructions
- **Content**: Screenshots, examples, and detailed explanations
- **Audience**: All users, from beginners to advanced

### Tutorials
- **Purpose**: Guide users through specific tasks from start to finish
- **Structure**: Sequential steps with clear beginnings and endpoints
- **Content**: Heavily illustrated with screenshots, focused on learning by doing
- **Audience**: New users or those learning specific features

### Reference Guides
- **Purpose**: Detailed information about specific features
- **Structure**: Organized by feature or component, not by task
- **Content**: Comprehensive, detailed explanations of options and settings
- **Audience**: Users who need in-depth information about specific features

### Technical Documentation (SPECIFICATION.md)
- **Purpose**: Technical details for developers and contributors
- **Structure**: Organized by system components and technical concepts
- **Content**: Code examples, API descriptions, data structures
- **Audience**: Developers and contributors

### README.md
- **Purpose**: Project overview and quick start information
- **Structure**: Brief introduction, key features, installation instructions
- **Content**: Concise, focused on getting users started quickly
- **Audience**: New users and potential users evaluating the plugin

## 4. Image Guidelines

### 4.1. Image Organization and Sizing

- **Organization:** Store all images used in documentation within the `docs/images/` directory. This keeps images separate from other documentation files and makes them easier to manage.
- **Naming:** Use web-friendly and descriptive filenames for images. This helps with searchability and makes it clear what the image represents (e.g., `feature-x-workflow.png` instead of `image01.png`).
- **Sizing:**
  - **Banner Images:** If using a banner image (e.g., in the `README.md`), aim for a width between 1200 and 1600 pixels. This ensures good display quality on various screen sizes.
  - **Inline Images:** For images embedded within the main text of documentation, a width between 600 and 800 pixels is recommended. This provides sufficient detail without making the image too large.
- **Display Width:** When embedding images in Markdown files, you can adjust their display width using HTML or CSS if needed. However, try to adhere to the recommended sizes to maintain consistency.

### 4.2. Banner Creation

- **Concept:** The banner image for the OneiroMetrics plugin should visually represent the blend of structured data (the "barn") and the abstract nature of dreams (the "surreal landscape").
- **Composition:**
  - Use a horizontal fade effect to transition from the "gsa-barn.jpg" image on the left to the "gsa-strange-landscape.jpg" image on the right.
  - Employ a gradient mask to create a smooth and seamless transition between the two images.
  - Overlay subtle Lucide metric icons (e.g., `eye`, `smile`, `layers`, `feather`, `check-circle`) on the banner. Use white or soft colors and low opacity to ensure they don't distract from the main images.
- **File:** Save the completed banner image as `banner-fade.jpg` in the `docs/images/` directory.
- **Optional:** Consider using SVG code directly for the Lucide icons to ensure they scale well and maintain sharpness.

#### Example Banner:

<p align="center">
  <img src="images/banner-example.jpg" alt="Example banner showing the transition from structured data (barn) to dreams (surreal landscape)" width="1200"/>
</p>

## 5. Annotated Screenshots

### 5.1. Purpose

- Annotated screenshots are visual aids that enhance user understanding of the plugin's UI and workflows.
- They are particularly helpful for:
  - Users unfamiliar with Markdown or Obsidian's callouts.
  - Quickly communicating the relationship between different elements.
  - Guiding users in replicating specific structures or steps.

### 5.2. Key Sections to Annotate

When creating annotated screenshots, focus on highlighting these key sections of dream journal entries or plugin interfaces:

- **YAML frontmatter (metadata):** The beginning of a note, containing metadata like date, tags, etc.
- **[!journal-entry] callout:** The main container for a day's entry.
- **Dream entry section:** The narrative description of a dream, often nested under the `[!journal-entry]` callout.
- **[!dream-metrics] callout:** The section containing quantitative metrics for a dream.
- **Regular journal entry:** Any non-dream notes within a journal.
- **Block references (e.g., ^20250511):** Unique identifiers for specific blocks of content.

### 5.3. Steps for Creating Screenshots

1. **Prepare a Sample Note:** Create a representative sample note in Obsidian that includes all the relevant sections you want to annotate.
2. **Switch to Preview Mode:** Display the note or UI element in Obsidian's preview mode (or reading mode) to ensure a clean and accurate visual representation.
3. **Take a Screenshot:** Capture the desired area using your operating system's screenshot tool or a dedicated screenshot application.
4. **Annotate the Screenshot:** Use an image editor (e.g., Snagit, Greenshot, Skitch, or even a basic image editor) to add annotations.
   - Use boxes, arrows, or other visual elements to highlight specific sections.
   - Add concise labels to explain each highlighted section.
5. **Annotation Style:**
   - Use clear, contrasting colors for annotations to ensure they stand out against the screenshot.
   - Keep labels brief and easy to read.
   - Avoid cluttering the screenshot with excessive annotations.
   - Use a readable font size for all annotation text.
6. **Accessibility:**
   - Consider colorblind users when choosing annotation colors. Use a colorblind-friendly palette or provide alternative text descriptions.
7. **Optional Numbering and Legend:**
   - For complex screenshots, you can number the annotations and provide a legend below the image to explain each number.

### 5.4. Suggested Locations

- **`docs/USAGE.md`:** Include annotated screenshots in the "Adding Dream Metrics" section to illustrate the callout structure.
- **`docs/SAMPLES.md`:** If you create a separate document showcasing sample notes or UI elements, use annotated screenshots there.
- **Plugin README:** Add a simplified annotated screenshot to the `README.md` for a quick visual overview.

### 5.5. Annotated Screenshot Template

Below is an example of a properly annotated screenshot showing a dream journal entry:

<p align="center">
  <img src="images/annotated-screenshot-example.jpg" alt="Annotated screenshot showing the structure of a dream journal entry with YAML frontmatter, journal-entry callout, dream-diary callout, and dream-metrics" width="800"/>
</p>

#### How to Replicate This Style:

1. Use a colorblind-friendly highlight scheme:
   - YAML frontmatter: Blue (#3498db)
   - Journal entry callout: Green (#2ecc71)
   - Dream diary callout: Purple (#9b59b6)
   - Dream metrics callout: Orange (#e67e22)

2. Use a consistent annotation style:
   - Rounded rectangles for highlighting sections
   - Solid 2px borders
   - 50% transparent fill
   - Clear, sans-serif font for labels (Calibri, Arial, or similar)
   - 14-16pt font size for readability

3. Place labels:
   - Above or to the side of highlighted sections
   - Connected by thin (1px) lines if necessary
   - With consistent positioning (e.g., all labels on the left)

## 6. CSS Styling

The following CSS rules are intended for use in the plugin's `styles.css` file or within the `README.md` if necessary, to enhance the visual presentation of documentation:

### 6.1. Banner Fade Effect

```css
.banner-fade {
    width: 100%;
    height: 300px;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%);
    position: relative;
}

.banner-fade img {
    width: 50%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
}

.banner-fade .left {
    left: 0;
}

.banner-fade .right {
    right: 0;
}
```

#### Visual Example:

<p align="center">
  <img src="images/banner-fade-example.jpg" alt="Example of banner fade effect showing transition between two images" width="800"/>
</p>

### 6.2. Lucide Icon Overlay

```html
<svg width="32" height="32" style="position:absolute; top:40px; left:60px; opacity:0.3;">
    <use href="../images/icons/eye.svg#icon" />
</svg>
```

Note: This example uses a local reference to the icons rather than an external URL to ensure stability.

### 6.3. Custom Callout Background

```css
.callout[data-callout="dream-metrics"] {
    background-image: url('../images/gsa-barn.jpg');
    background-size: cover;
    background-blend-mode: lighten;
    color: #222;
}
```

#### Visual Example of Custom Callout:

<p align="center">
  <img src="images/custom-callout-example.jpg" alt="Example of a custom callout with dream-metrics styling" width="600"/>
</p>

## 7. Color Palette

Use the following color palettes, derived from the project's imagery, for headings, callouts, or accents in documentation and plugin UI:

### 7.1. From "gsa-barn"
- Sky blue: #a7c7e7
- Barn red: #b97a56
- Leaf green: #7bb661
- Soft yellow: #f7e7a0

### 7.2. From "gsa-strange-landscape"
- Dream blue: #5a7fa3
- Surreal green: #b6e3c6
- Deep red: #a33c3c
- Lavender: #b6a3e3

#### Color Palette Visual Reference:

<p align="center">
  <img src="images/color-palette-example.jpg" alt="Visual representation of the color palette derived from project imagery" width="600"/>
</p>

## 8. Modal and Leaf Design Standards

### 8.1. Standard Modal Layout

The following layout standards apply to all modals and leaves in the plugin, ensuring consistency with Obsidian's UI conventions:

1. **Overall Structure**
   - Dismissible note at the very top (if needed)
   - Sections ordered logically from top to bottom
   - Progress/status section at the very bottom

2. **Section Layout**
   - Two-column layout for each section:
     - Left column: Label and helper text (left-aligned)
     - Right column: Widget (right-aligned)
   - Label and widget appear on the same row
   - Helper text appears below the label (still in left column)

3. **Progress Section**
   - Left-aligned label (e.g., "Scrape Progress")
   - Progress bar and status text on their own row below the label
   - Centered within the modal

4. **Widgets**
   - Autocomplete fields: Right-aligned in their section
   - Buttons: Right-aligned in their section
   - Multi-select fields: Right-aligned with appropriate width

5. **Spacing**
   - Consistent vertical spacing between sections
   - No thick horizontal lines or unnecessary dividers
   - Modal height adapts to content

### 8.2. Implementation Notes

- Use CSS Grid or Flexbox for the two-column layout
- Ensure proper spacing using CSS variables
- Match Obsidian's Settings page conventions for consistency
- Support both light and dark themes
- Ensure accessibility with proper ARIA labels and keyboard navigation

#### Example Modal Layout:

<p align="center">
  <img src="images/modal-layout-example.jpg" alt="Example of the standard two-column modal layout with labels on the left and widgets on the right" width="700"/>
</p>

## 9. Accessibility Guidelines

### 9.1. Images and Visual Content

- **Alt Text**: All images must include descriptive alt text that conveys the content and purpose of the image
- **Contrast**: Ensure sufficient contrast between text and background (minimum 4.5:1 ratio)
- **Color Independence**: Never use color as the only means of conveying information
- **Image Size**: Ensure images can be enlarged for users with visual impairments

#### Example of Good Alt Text:
```markdown
![Dream Journal Manager interface showing three tabs: Dream Scraper, Journal Structure, and Templates, with the Dream Scraper tab active and displaying note selection options](images/dream-journal-manager.png)
```

### 9.2. Structure and Navigation

- **Heading Hierarchy**: Use proper heading levels (h1, h2, h3) in sequential order
- **Link Text**: Use descriptive link text rather than "click here" or URLs
- **Lists**: Use proper list formatting for sequential and non-sequential items
- **Tables**: Include header rows and provide sufficient context
- **Keyboard Navigation**: Ensure all interactive elements can be accessed via keyboard

### 9.3. Text and Readability

- **Plain Language**: Use clear, straightforward language (aim for a 9th-grade reading level)
- **Abbreviations**: Spell out abbreviations on first use
- **Font**: Use readable fonts (sans-serif fonts are generally more accessible)
- **Line Length**: Keep line lengths reasonable (60-80 characters per line)
- **Text Alternatives**: Provide text alternatives for any non-text content

## 10. Mobile Considerations

### 10.1. Responsive Design

- **Image Sizing**: Use relative sizing for images (percentage-based or max-width)
- **Tables**: Create responsive tables that can be viewed on smaller screens
  - Consider using a scrollable container for wide tables
  - Or reorganize data for vertical display on mobile
- **Code Blocks**: Ensure code blocks wrap or scroll horizontally on small screens
- **Touch Targets**: Buttons and links should be at least 44×44 pixels for easy tapping

### 10.2. Touch Interactions

- **Instructions**: Adapt instructions for touch interfaces where appropriate
  - Example: "Tap the Settings button" instead of "Click the Settings button"
- **Gestures**: Clearly explain any required touch gestures
- **Mobile-Specific Features**: Document any features that work differently on mobile

## 11. Documentation Review Process

### 11.1. Review Checklist

Before submitting documentation changes, ensure the following:

- [ ] Follows the voice and tone guidelines
- [ ] Adheres to the established formatting and structure
- [ ] Images include alt text and follow size guidelines
- [ ] Includes appropriate examples for complex concepts
- [ ] Links to related documentation where helpful
- [ ] Code examples are complete and properly formatted
- [ ] Spell-checked and grammar-checked
- [ ] Mobile-friendly

### 11.2. Workflow

1. **Create**: Draft new documentation following the style guide
2. **Review**: Self-review using the checklist above
3. **Submit**: Create a pull request with the documentation changes
4. **Peer Review**: Another team member reviews the changes
5. **Revise**: Make any necessary revisions based on feedback
6. **Merge**: Once approved, merge the changes
7. **Monitor**: Watch for user feedback on the documentation

## 12. Version Control Guidelines

### 12.1. When to Update Documentation

Update documentation in the following scenarios:

- When adding a new feature
- When changing existing functionality
- When deprecating or removing features
- When fixing bugs that affect user workflow
- When improving clarity based on user feedback

### 12.2. Versioning Strategy

- **Changelog**: Keep documentation changes in the CHANGELOG.md file
- **Version Tagging**: Tag documentation versions to match plugin versions
- **Documentation Commits**: Use the prefix "docs:" for documentation-only commits
- **Breaking Changes**: Clearly mark breaking changes in both code and documentation

## 13. Documentation Templates

### 13.1. Feature Documentation Template

```markdown
# Feature Name

## Overview
Brief description of what the feature does and its purpose.

## How to Access
Explain how to access or enable the feature.

## Configuration Options
List and explain all configuration options with examples.

## Usage Examples
Provide 2-3 practical examples of how to use the feature.

## Tips and Best Practices
Offer advice on getting the most out of the feature.

## Troubleshooting
Address common issues and how to resolve them.

## Related Features
Link to related features that users might also want to explore.
```

### 13.2. Tutorial Template

```markdown
# Tutorial: Accomplishing X with OneiroMetrics

## What You'll Learn
Brief description of what the user will accomplish.

## Prerequisites
What the user needs to know or have before starting.

## Step 1: [First Task]
Detailed instructions with screenshots.

## Step 2: [Second Task]
Detailed instructions with screenshots.

## Step 3: [Third Task]
Detailed instructions with screenshots.

## Next Steps
Suggestions for what to learn or try next.

## Troubleshooting
Common issues and solutions specific to this tutorial.
```

## 14. Implementation Checklist

- [x] Create docs/images/ directory
- [x] Add gsa-barn.jpg and gsa-strange-landscape.jpg to docs/images/
- [ ] Create and add banner-fade.jpg to docs/images/
- [ ] Add banner to README.md
- [ ] Add "What is a Dream?" section with gsa-strange-landscape.jpg to README.md
- [ ] Add feature example section with barn image as background to README.md (optional)
- [ ] Implement CSS for custom callout backgrounds (optional)
- [ ] Overlay Lucide icons on banner (optional)
- [ ] Add first annotated screenshot of a complete dream journal entry to docs/USAGE.md
- [ ] Add additional annotated screenshots for advanced features (e.g., metrics table, modal UI)
- [ ] Create and add example images for CSS effects
- [ ] Add color palette visual reference
- [ ] Add example modal layout image