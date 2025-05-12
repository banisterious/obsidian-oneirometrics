#   Documentation Style Guide

##   Purpose

This document provides guidelines for the visual style and presentation of OneiroMetrics plugin documentation, ensuring consistency, clarity, and user-friendliness. It covers image usage, annotated screenshots, and CSS styling.

##   1. Image Guidelines

###   1.1. Image Organization and Sizing

-   **Organization:** Store all images used in documentation within the `docs/images/` directory. This keeps images separate from other documentation files and makes them easier to manage.
-   **Naming:** Use web-friendly and descriptive filenames for images. This helps with searchability and makes it clear what the image represents (e.g., `feature-x-workflow.png` instead of `image01.png`).
-   **Sizing:**
    -   **Banner Images:** If using a banner image (e.g., in the `README.md`), aim for a width between 1200 and 1600 pixels. This ensures good display quality on various screen sizes.
    -   **Inline Images:** For images embedded within the main text of documentation, a width between 600 and 800 pixels is recommended. This provides sufficient detail without making the image too large.
-   **Display Width:** When embedding images in Markdown files, you can adjust their display width using HTML or CSS if needed. However, try to adhere to the recommended sizes to maintain consistency.

###   1.2. Banner Creation

-   **Concept:** The banner image for the OneiroMetrics plugin should visually represent the blend of structured data (the "barn") and the abstract nature of dreams (the "surreal landscape").
-   **Composition:**
    -   Use a horizontal fade effect to transition from the "gsa-barn.jpg" image on the left to the "gsa-strange-landscape.jpg" image on the right.
    -   Employ a gradient mask to create a smooth and seamless transition between the two images.
    -   Overlay subtle Lucide metric icons (e.g., `eye`, `smile`, `layers`, `feather`, `check-circle`) on the banner. Use white or soft colors and low opacity to ensure they don't distract from the main images.
-   **File:** Save the completed banner image as `banner-fade.jpg` in the `docs/images/` directory.
-   **Optional:** Consider using SVG code directly for the Lucide icons to ensure they scale well and maintain sharpness.

##   2. Annotated Screenshots

###   2.1. Purpose

-   Annotated screenshots are visual aids that enhance user understanding of the plugin's UI and workflows.
-   They are particularly helpful for:
    -   Users unfamiliar with Markdown or Obsidian's callouts.
    -   Quickly communicating the relationship between different elements.
    -   Guiding users in replicating specific structures or steps.

###   2.2. Key Sections to Annotate

When creating annotated screenshots, focus on highlighting these key sections of dream journal entries or plugin interfaces:

-   **YAML frontmatter (metadata):** The beginning of a note, containing metadata like date, tags, etc.
-   **[!journal-entry] callout:** The main container for a day's entry.
-   **Dream entry section:** The narrative description of a dream, often nested under the `[!journal-entry]` callout.
-   **[!dream-metrics] callout:** The section containing quantitative metrics for a dream.
-   **Regular journal entry:** Any non-dream notes within a journal.
-   **Block references (e.g., ^20250511):** Unique identifiers for specific blocks of content.

###   2.3. Steps for Creating Screenshots

1.  **Prepare a Sample Note:** Create a representative sample note in Obsidian that includes all the relevant sections you want to annotate.
2.  **Switch to Preview Mode:** Display the note or UI element in Obsidian's preview mode (or reading mode) to ensure a clean and accurate visual representation.
3.  **Take a Screenshot:** Capture the desired area using your operating system's screenshot tool or a dedicated screenshot application.
4.  **Annotate the Screenshot:** Use an image editor (e.g., Snagit, Greenshot, Skitch, or even a basic image editor) to add annotations.
    -   Use boxes, arrows, or other visual elements to highlight specific sections.
    -   Add concise labels to explain each highlighted section.
5.  **Annotation Style:**
    -   Use clear, contrasting colors for annotations to ensure they stand out against the screenshot.
    -   Keep labels brief and easy to read.
    -   Avoid cluttering the screenshot with excessive annotations.
    -   Use a readable font size for all annotation text.
6.  **Accessibility:**
    -   Consider colorblind users when choosing annotation colors. Use a colorblind-friendly palette or provide alternative text descriptions.
7.  **Optional Numbering and Legend:**
    -   For complex screenshots, you can number the annotations and provide a legend below the image to explain each number.

###   2.4. Suggested Locations

-   **`docs/USAGE.md`:** Include annotated screenshots in the "Adding Dream Metrics" section to illustrate the callout structure.
-   **`docs/SAMPLES.md`:** If you create a separate document showcasing sample notes or UI elements, use annotated screenshots there.
-   **Plugin README:** Add a simplified annotated screenshot to the `README.md` for a quick visual overview.

##   3. CSS Styling

The following CSS rules are intended for use in the plugin's `styles.css` file or within the `README.md` if necessary, to enhance the visual presentation of documentation:

###   3.1. Banner Fade Effect

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
}```

### 3.2. Lucide Icon Overlay (SVG Example)

```<svg width="32" height="32" style="position:absolute; top:40px; left:60px; opacity:0.3;">
    <use href="[https://unpkg.com/lucide-static/icons/eye.svg#icon](https://unpkg.com/lucide-static/icons/eye.svg#icon)" />
</svg>```

3.3. Custom Callout Background Example

```css
.callout[data-callout="dream-metrics"] {
    background-image: url('docs/images/gsa-barn.jpg');
    background-size: cover;
    background-blend-mode: lighten;
    color: #222;
}```

4. Color Palette
Use the following color palettes, derived from the project's imagery, for headings, callouts, or accents in documentation and plugin UI:

4.1. From "gsa-barn"
    -   Sky blue: #a7c7e7
    -   Barn red: #b97a56
    -   Leaf green: #7bb661
    -   Soft yellow: #f7e7a0
4.2. From "gsa-strange-landscape"
    -   Dream blue: #5a7fa3
    -   Surreal green: #b6e3c6
    -   Deep red: #a33c3c
    -   Lavender: #b6a3e3

5. Checklist
    [x] Create docs/images/ directory
    [x] Add gsa-barn.jpg and gsa-strange-landscape.jpg to docs/images/
    [ ] Create and add banner-fade.jpg to docs/images/
    [ ] Add banner to README.md
    [ ] Add "What is a Dream?" section with gsa-strange-landscape.jpg to README.md
    [ ] Add feature example section with barn image as background to README.md (optional)
    [ ] Implement CSS for custom callout backgrounds (optional)
    [ ] Overlay Lucide icons on banner (optional)
    [ ] Add first annotated screenshot of a complete dream journal entry to docs/USAGE.md
    [ ] Add additional annotated screenshots for advanced features (e.g., metrics table, modal UI)