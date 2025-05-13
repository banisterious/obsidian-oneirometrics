# Lucide Icon Picker – Technical Implementation Plan

## Overview
This document outlines the technical plan for implementing a Lucide-style, CDN-powered icon picker for the OneiroMetrics plugin. The picker will allow users to select from the full Lucide icon library, using a search-first, single-grid UI. Only the icon name will be stored in settings, and SVGs will be inlined for theme compatibility.

---

## 1. Fetch the Full Icon List
- On modal open, fetch the list of all Lucide icon names from the CDN (e.g., [index.json](https://unpkg.com/lucide-static/icons/index.json)).
- Store the list in memory (and optionally cache in localStorage).

## 2. Build the Picker UI
- Display a search bar at the top.
- Show a scrollable grid (8 columns x 5 rows) of icon previews.
- As the user types, filter the icon list live (minimum 1 character).
- For each icon, fetch and inline the SVG from the CDN (e.g., `https://unpkg.com/lucide-static/icons/{icon-name}.svg`).

## 3. Inline SVGs for Theming
- Fetch the SVG as text and inject it into the DOM (not as `<img>`) so CSS can style it.
- Optionally, cache SVG markup in localStorage for performance/offline use.

## 4. Handle Selection
- When an icon is clicked, store its name in your settings.
- Use the icon name everywhere you need to display the icon (fetch/inject SVG as needed).

## 5. Fallback Handling
- If the CDN is unavailable, show a warning and/or use a local fallback set (optional).

## 6. Accessibility
- Ensure keyboard navigation (Tab, Arrow keys, Enter to select).
- Add ARIA labels and high-contrast support.

---

## Code Sample: Core Picker Logic

```typescript
const ICON_LIST_URL = 'https://unpkg.com/lucide-static/icons/index.json';
const ICON_SVG_URL = (name: string) => `https://unpkg.com/lucide-static/icons/${name}.svg`;
const ICON_CACHE_KEY = 'lucideIconCacheV1';

// Fetch and cache icon list
async function getIconList(): Promise<string[]> {
  let icons = localStorage.getItem(ICON_CACHE_KEY);
  if (icons) return JSON.parse(icons);
  const res = await fetch(ICON_LIST_URL);
  const list = await res.json();
  localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(list));
  return list;
}

// Fetch and inline SVG
async function fetchAndInlineSVG(iconName: string): Promise<string> {
  const res = await fetch(ICON_SVG_URL(iconName));
  return await res.text();
}

// Render picker grid
async function renderIconPicker(container: HTMLElement, onSelect: (iconName: string) => void) {
  const iconList = await getIconList();
  let filtered = iconList;

  // Search bar
  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = 'Search icons...';
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    filtered = iconList.filter(name => name.includes(q));
    updateGrid();
  });
  container.appendChild(search);

  // Grid
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(8, 1fr)';
  grid.style.gap = '8px';
  grid.style.maxHeight = '320px';
  grid.style.overflowY = 'auto';
  container.appendChild(grid);

  async function updateGrid() {
    grid.innerHTML = '';
    for (const iconName of filtered.slice(0, 40)) { // Show first 40, add paging/scroll as needed
      const iconDiv = document.createElement('div');
      iconDiv.tabIndex = 0;
      iconDiv.setAttribute('role', 'button');
      iconDiv.setAttribute('aria-label', iconName);
      iconDiv.style.cursor = 'pointer';
      iconDiv.style.padding = '4px';
      iconDiv.style.borderRadius = '4px';
      iconDiv.style.display = 'flex';
      iconDiv.style.alignItems = 'center';
      iconDiv.style.justifyContent = 'center';
      iconDiv.addEventListener('click', () => onSelect(iconName));
      iconDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(iconName);
      });

      // Inline SVG
      fetchAndInlineSVG(iconName).then(svg => {
        iconDiv.innerHTML = svg;
        // Optionally, add a class for theming: iconDiv.firstChild.classList.add('your-svg-class');
      });

      grid.appendChild(iconDiv);
    }
  }

  updateGrid();
}
```

---

## Integration Notes
- Call `renderIconPicker(containerEl, (iconName) => { ... })` in your metric editor modal.
- Store the selected `iconName` in your settings.
- When displaying the icon elsewhere, fetch and inline the SVG using the same logic.
- Style the grid and SVGs to match your theme.
- Add error handling and fallback logic for CDN failures.
- Optionally, expand caching and add paging/virtual scrolling for large lists.

---

**For further enhancements, consider adding a category dropdown, paging, or more advanced caching as needed.** 