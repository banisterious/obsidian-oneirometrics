# innerHTML/outerHTML Security Review

**Date:** 2025-10-22
**Reviewer:** Development Team
**Status:** In Progress

---

## Overview

This document reviews all instances of `innerHTML` and `outerHTML` usage in the OneiroMetrics codebase to identify potential security risks and ensure proper sanitization.

---

## Risk Categories

### 🔴 HIGH RISK - User-Controlled Content
Content that comes directly from user input without sanitization

### 🟡 MEDIUM RISK - Partially Controlled
Content from parsed user data (markdown, frontmatter, etc.)

### 🟢 LOW RISK - Static/Controlled
Hardcoded strings, icon SVGs, or fully sanitized content

---

## Findings

### 1. OneirographInteractions.ts (Line 366)
**Risk Level:** 🟡 MEDIUM
**Usage:**
```typescript
this.tooltipEl.innerHTML = content;
// Where content contains:
// - ${node.label} - from graph nodes
// - ${dream.date} - from parsed dream data
// - ${node.themes.join(', ')} - array join
```

**Analysis:**
- `node.label` and `dream.date` come from parsed dream journal entries
- User could include HTML/script tags in dream titles or dates
- **Recommendation:** Use `textContent` for dynamic values or sanitize with `createEl()`

**Fix:**
```typescript
// Replace template literal with safe DOM construction
const titleEl = this.tooltipEl.createDiv({ cls: 'oom-oneirograph-tooltip-title' });
titleEl.textContent = node.label; // Safe - no HTML parsing
```

---

### 2. VirtualScroller.ts (Lines 331, 600)
**Risk Level:** 🟢 LOW
**Usage:**
```typescript
row.innerHTML = ''; // Clearing content
```

**Analysis:**
- Only used to clear row content, no user data involved
- Safe operation
- **Recommendation:** No action needed, but could use `row.empty()` for consistency

---

### 3. Test Files (DateUtilsTestModal.ts, ContentParserTestModal.ts)
**Risk Level:** 🟢 LOW
**Usage:** Displaying test results in development/debug modals

**Analysis:**
- Only used in testing infrastructure
- Not exposed to end users in production
- **Recommendation:** No action needed for test files

---

### 4. Debug Buttons (EventHandler.ts, ProjectNoteEvents.ts)
**Risk Level:** 🟢 LOW
**Usage:**
```typescript
newDebugBtn.innerHTML = '<span class="oom-button-text">Debug: Expand All Content</span>';
```

**Analysis:**
- Static hardcoded HTML
- Debug functionality only
- **Recommendation:** No action needed

---

### 5. Icon Insertions (EntryComponent.ts, TemplateWizard.ts)
**Risk Level:** 🟢 LOW
**Usage:**
```typescript
iconElement.innerHTML = lucideIconMap[metric.icon];
toggleButton.innerHTML = '<svg viewBox="0 0 100 100">...</svg>';
```

**Analysis:**
- SVG icons from controlled icon map
- Hardcoded SVG strings
- **Recommendation:** No action needed - icons are from trusted source

---

### 6. HubModal.ts (Lines 2179, 2813, 5972)
**Risk Level:** 🟢 LOW
**Usage:**
```typescript
if (previewContainer.innerHTML === '') { ... } // Checking if empty
resultsEl.innerHTML = ''; // Clearing content
```

**Analysis:**
- Either checking for empty state or clearing
- No user content injection
- **Recommendation:** No action needed

---

### 7. DateSelectionModal.ts (Lines 376, 1204, 1334)
**Risk Level:** 🟡 MEDIUM
**Usage:**
```typescript
starsContainer.innerHTML = starsHtml; // Metric stars display
filterDisplay.innerHTML = `<span>...</span>`; // Filter display
```

**Analysis:**
- `starsHtml` contains metric data from user's dream entries
- Filter display may contain user input
- **Recommendation:** Review and sanitize if needed

---

### 8. OneirographView.ts (Lines 437, 456)
**Risk Level:** 🟢 LOW
**Usage:**
```typescript
themeSelect.innerHTML = ''; // Clearing dropdowns
clusterSelect.innerHTML = '';
```

**Analysis:**
- Only clearing dropdown content
- **Recommendation:** No action needed

---

## Security Comments Found

Several files already have security fix comments:
- `src/dom/modals/HubModal.ts:4037` - "SECURITY FIX: Use safe DOM manipulation instead of innerHTML"
- `src/dom/modals/EnhancedDateNavigatorModal.ts:351` - "SECURITY FIX: Use safe DOM manipulation instead of innerHTML"
- `src/utils/TemplateHelpers.ts:7` - "Created as part of Issue 1: innerHTML/outerHTML Security Risk remediation"

This indicates previous security review work has been done.

---

## Recommended Actions

### Priority 1: Fix Medium Risk Items

1. **OneirographInteractions.ts** - Replace innerHTML with safe DOM construction:
```typescript
private showTooltip(node: OneirographNode) {
    if (!this.tooltipEl) return;

    // Clear existing content safely
    this.tooltipEl.empty();

    if (node.type === 'cluster') {
        const titleEl = this.tooltipEl.createDiv({ cls: 'oom-oneirograph-tooltip-title' });
        titleEl.textContent = node.label; // Safe

        const typeEl = this.tooltipEl.createDiv({ cls: 'oom-oneirograph-tooltip-type' });
        typeEl.textContent = 'Cluster'; // Safe
    } else if (node.type === 'dream') {
        const dream = node.data as any;

        const titleEl = this.tooltipEl.createDiv({ cls: 'oom-oneirograph-tooltip-title' });
        titleEl.textContent = node.label; // Safe

        const dateEl = this.tooltipEl.createDiv({ cls: 'oom-oneirograph-tooltip-date' });
        dateEl.textContent = dream.date; // Safe

        if (node.themes) {
            const themesEl = this.tooltipEl.createDiv({ cls: 'oom-oneirograph-tooltip-themes' });
            const themeText = node.themes.slice(0, 3).join(', ');
            themesEl.textContent = `Themes: ${themeText}${node.themes.length > 3 ? '...' : ''}`; // Safe
        }
    }

    this.tooltipEl.removeClass('oom-tooltip-hidden');
}
```

2. **DateSelectionModal.ts** - Review and fix if user data is involved

### Priority 2: Consistency Improvements

Replace `innerHTML = ''` with `element.empty()` for consistency across codebase.

---

## Obsidian Guidelines Reference

From [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines):

> **Avoid innerHTML and outerHTML**
> - Prefer using `createEl()`, `createDiv()`, `createSpan()`, etc.
> - If you must use innerHTML, ensure content is properly sanitized
> - Never insert user-controlled content directly

---

## Conclusion

**Current Status:**
- ✅ Most innerHTML usage is LOW RISK (static content, clearing, icons)
- ⚠️ 2 MEDIUM RISK items need attention (OneirographInteractions, DateSelectionModal)
- ✅ Previous security work has addressed many concerns

**Next Steps:**
1. Fix OneirographInteractions.ts tooltip rendering
2. Review DateSelectionModal.ts metric display
3. Test all changes thoroughly
4. Update this document when complete
