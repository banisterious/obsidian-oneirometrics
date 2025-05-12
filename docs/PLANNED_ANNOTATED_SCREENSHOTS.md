# Planned Annotated Screenshots for Documentation

![Planned: Example of a dream journal entry in Obsidian](images/sample-dream-entry.png)
*Planned: This image will be annotated to highlight each section for new users.*

## Purpose

To enhance user understanding, we will add annotated screenshots to the documentation. These images will visually illustrate the structure of a complete dream journal entry, highlighting key sections and how they appear in Obsidian.

## Benefits
- Makes the documentation more accessible and user-friendly
- Reduces ambiguity for users unfamiliar with Markdown or Obsidian callouts
- Quickly communicates the relationship between different sections (callouts, metrics, etc.)
- Helps users replicate the correct structure in their own notes

## Key Sections to Annotate (with Descriptions)
- **YAML frontmatter (metadata):** Note metadata (date, tags, etc.)
- **[!journal-entry] callout:** Main entry for the day, groups all content for that date.
- **Dream entry section:** The actual dream narrative, often with a time and title, typically nested under the journal entry.
- **[!dream-metrics] callout:** Quantitative metrics for the dream, nested under the dream-diary.
- **Regular journal entry:** Non-dream notes for the day, can be included alongside dream entries.
- **Block references (e.g., ^20250511):** Used for linking or referencing this entry elsewhere.

## File Naming and Organization
- Save annotated screenshots in `docs/images/` or a similar directory.
- Use descriptive filenames, e.g., `annotated-dream-entry.png`, `annotated-metrics-table.png`.
- Keep image files organized by feature or documentation section for easy reference.

## Steps for Creating Annotated Screenshots
1. **Prepare a sample note** in Obsidian with a complete journal entry, including all relevant callouts and content.
2. **Switch to preview mode** (or reading mode) in Obsidian for a clean view.
3. **Take a screenshot** of the entire entry or relevant sections.
4. **Annotate the screenshot** using an image editor (e.g., draw boxes/arrows, add labels for each section).
   - Recommended tools: Snagit, Greenshot, Skitch, or any editor with annotation features.
5. **Use clear, contrasting colors** for boxes/arrows, and keep labels concise and legible.
6. **Consider accessibility:** Use colorblind-friendly palettes and readable font sizes for annotations.
7. **Optionally, number the annotations** and provide a legend below the image (see example below).
8. **Save the annotated image** in the appropriate directory.
9. **Insert the image** into the appropriate documentation file (e.g., `USAGE.md`, `SAMPLES.md`), with a caption and brief explanation.

## Suggested Locations for Annotated Screenshots
- `docs/USAGE.md` (in the "Adding Dream Metrics" section, near the sample entry)
- `docs/SAMPLES.md` (if a dedicated sample gallery is created)
- Plugin README (for a quick visual overview)

## Tips for Effective Annotation
- Use clear, contrasting colors for boxes/arrows
- Keep labels concise and legible
- Avoid clutter—focus on the most important sections
- Use readable font sizes for all annotation text
- Consider accessibility for colorblind users
- Optionally, number the annotations and provide a legend below the image

## Example Legend for Numbered Annotations
1. YAML frontmatter
2. [!journal-entry] callout
3. Dream-diary section
4. [!dream-metrics] callout
5. Regular journal entry
6. Block reference

## Review and Update
- Periodically review all screenshots to ensure they match the current UI, especially after major UI changes.
- Update annotated images as needed to reflect new features or layout changes.

## Contributions Welcome
- Community contributions of annotated screenshots or improvements to this guide are welcome!
- Please follow the file naming and annotation style guidelines above.
- Submit your images and suggestions via pull request or issue.

## Placeholder for Future Screenshots
- [ ] Add first annotated screenshot of a complete dream journal entry
- [ ] Add additional screenshots for advanced features (e.g., metrics table, modal UI)

---

*This document will be updated as annotated screenshots are created and integrated into the documentation.* 