# Planned Visual and README Enhancements for OneiroMetrics

## Overview
This document tracks planned visual improvements and README enhancements for the OneiroMetrics plugin, including image integration, banner creation, and style guidance.

---

## 1. Image Organization and Sizing
- Store images in `docs/images/`.
- Use web-friendly names: `gsa-barn.jpg`, `gsa-strange-landscape.jpg`, `banner-fade.jpg`.
- Recommended sizes:
  - Banner: 1200–1600px wide
  - Inline: 600–800px wide
- Adjust display width in Markdown as needed.

---

## 2. Banner Creation (Planned)
- Create a banner that fades from `gsa-barn.jpg` (left) to `gsa-strange-landscape.jpg` (right).
- Use a horizontal gradient mask for a smooth transition.
- Overlay Lucide metric icons (e.g., `eye`, `smile`, `layers`, `feather`, `check-circle`) in white or soft colors, low opacity.
- Save as `banner-fade.jpg` in `docs/images/`.
- (Optional) Use SVG code for Lucide icons.

---

## 3. README.md Integration (Planned)
- Add banner at the top:
  ```markdown
  <p align="center">
    <img src="docs/images/banner-fade.jpg" alt="A banner fading from a country barn to a surreal dream landscape, with subtle metric icons." width="100%" />
  </p>
  ```
- Add "What is a Dream?" section with `gsa-strange-landscape.jpg`:
  ```markdown
  ## What is a Dream?
  ![A surreal, dreamlike landscape with flying fish and abstract forms.](docs/images/gsa-strange-landscape.jpg)
  Dreams are more than memories—they are vivid, surreal experiences. OneiroMetrics helps you capture and analyze these moments, turning the abstract into actionable insights.
  ```
- Add feature example section with barn image as background (optional, see CSS below).

---

## 4. CSS Guidance (Planned)
- **Fade Effect for Banner (HTML/CSS):**
  ```css
  .banner-fade {
    width: 100%;
    height: 300px;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%);
    position: relative;
  }
  .banner-fade img { width: 50%; height: 100%; object-fit: cover; position: absolute; top: 0; }
  .banner-fade .left { left: 0; }
  .banner-fade .right { right: 0; }
  ```
- **Overlaying Lucide Icons (SVG Example):**
  ```html
  <svg width="32" height="32" style="position:absolute; top:40px; left:60px; opacity:0.3;">
    <use href="https://unpkg.com/lucide-static/icons/eye.svg#icon" />
  </svg>
  ```
- **Custom Callout Background Example:**
  ```css
  .callout[data-callout="dream-metrics"] {
    background-image: url('docs/images/gsa-barn.jpg');
    background-size: cover;
    background-blend-mode: lighten;
    color: #222;
  }
  ```

---

## 5. Checklist
- [x] Create `docs/images/` directory
- [x] Add `gsa-barn.jpg` and `gsa-strange-landscape.jpg`
- [ ] Create and add `banner-fade.jpg`
- [ ] Add banner to README.md
- [ ] Add "What is a Dream?" section to README.md
- [ ] Add feature example section with barn image as background
- [ ] Implement CSS for custom callout backgrounds (optional)
- [ ] Overlay Lucide icons on banner (optional)

---

## 6. Color Palette Suggestions
- From `gsa-barn`:
  - Sky blue: #a7c7e7
  - Barn red: #b97a56
  - Leaf green: #7bb661
  - Soft yellow: #f7e7a0
- From `gsa-strange-landscape`:
  - Dream blue: #5a7fa3
  - Surreal green: #b6e3c6
  - Deep red: #a33c3c
  - Lavender: #b6a3e3

Use these for headings, callouts, or accents in documentation and plugin UI. 