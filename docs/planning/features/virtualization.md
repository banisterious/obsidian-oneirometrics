# Dream Entries Table Virtualization Plan

This document outlines the plan for implementing vanilla JavaScript virtualization for the Dream Entries table in the OneiroMetrics Obsidian plugin.

## Overview

To improve performance and responsiveness with large datasets, we will render only a subset of table rows (12 at a time, reduced from 25 for better performance) and update the visible rows as the user scrolls. This approach reduces DOM size and memory usage while maintaining a seamless user experience.

## Step-by-Step Plan

### 1. Determine Virtualization Parameters
- **Visible rows:** 12
- **Row height:** Use a fixed value (e.g., 40px) or calculate dynamically if needed.

### 2. Structure the Table for Virtualization
- Wrap table rows (`<tr>`) in a scrollable container (e.g., a `<div>` with `overflow-y: auto;` and a fixed height).
- Keep the table header (`<thead>`) fixed and always visible.

### 3. Calculate Visible Row Range
- On scroll, determine which rows should be visible based on the scroll position.
- Calculate the start and end indices for the visible window.

### 4. Render Only Visible Rows
- In the DOM, only render the `<tr>` elements for the visible rows.
- Use two "spacer" rows (or divs) above and below the visible rows to maintain the correct scroll height and scrollbar behavior.

### 5. Handle Scrolling
- Add a debounced scroll event listener to the container for better performance.
- On scroll, recalculate the visible row range and update the DOM accordingly.
- **Scroll logic ensures that expanding/collapsing a row keeps the view stable and prevents jumping beneath the table.**

### 6. Event Handling for Expand/Collapse
- In the virtualized table (settings modal and interactive UI), event listeners are attached only to the currently visible rows when they are rendered.
- In the static project note table (rendered as HTML in the main note), a minimal event handler attaches listeners to all expand/collapse buttons after the table is rendered or updated.
- This approach ensures reliable expand/collapse behavior, prevents duplicate or lost listeners, and keeps performance high even with large tables.
- See [Technical Specification](../../developer/architecture/specification.md#expandcollapse-read-more-functionality) for further technical details.

### 7. Accessibility Considerations
- Ensure keyboard navigation (Tab, Arrow keys) works across all rows, not just visible ones.
- Optionally, announce dynamic content changes for screen readers.

### 8. Edge Cases
- Handle cases where the number of entries is less than the visible window.
- Handle resizing of the container (e.g., if the user resizes the Obsidian window).

### 9. Testing
- Test with small and large datasets.
- Test in all supported themes and with accessibility tools.

## Example Pseudocode

```js
const ROW_HEIGHT = 40; // px, or calculate dynamically
const VISIBLE_ROWS = 12;

function onScroll() {
  const scrollTop = container.scrollTop;
  const startIdx = Math.floor(scrollTop / ROW_HEIGHT);
  const endIdx = Math.min(startIdx + VISIBLE_ROWS, totalRows);

  // Render only rows[startIdx...endIdx]
  // Add a spacer div above: height = startIdx * ROW_HEIGHT
  // Add a spacer div below: height = (totalRows - endIdx) * ROW_HEIGHT
}
``` 