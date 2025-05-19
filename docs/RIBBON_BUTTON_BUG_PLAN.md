# Ribbon Button Visibility Bug – Investigation & Fix Plan

## Background
There is a bug affecting the visibility toggles for the two ribbon buttons in OneiroMetrics:
- **Dream Scrape Tool** (lucide wand-sparkles icon)
- **Open Metrics Note** (lucide shell icon)

Currently, when both toggles are set to Off, both buttons are hidden as expected. However, when only one toggle is set to Off, both buttons remain visible, and the toggles do not work independently as intended.

This issue has proven difficult to resolve in the past, so this plan is designed to proceed with maximum caution, observability, and minimal disruption.

---

## Success Criteria
- Each toggle independently controls the visibility of its corresponding ribbon button.
- The state persists after plugin reload or Obsidian restart.
- No regressions: both buttons work as before, with correct icons and text.
- All four toggle combinations behave as expected (see Testing Matrix).

---

## Testing Matrix
| Scrape Toggle | Note Toggle | Expected Visible Buttons         | Tested | Pass |
|--------------|-------------|----------------------------------|--------|------|
| On           | On          | Both                             | [ ]    | [ ]  |
| On           | Off         | Dream Scrape Tool only           | [ ]    | [ ]  |
| Off          | On          | Open Metrics Note only           | [ ]    | [ ]  |
| Off          | Off         | None                             | [ ]    | [ ]  |

---

## Rollback Plan
- All changes will be committed in small, logical increments.
- If a change introduces new issues, use `git checkout` or `git revert` to return to the last known good state.
- Keep a backup of the current working state before making major changes.

---

## Reference to Related Code
- Main function: `updateRibbonIcons()` in `main.ts` (or equivalent)
- Settings: `showScrapeButton`, `showNoteButton` in plugin settings
- Button classes: `.oom-ribbon-scrape-button`, `.oom-ribbon-note-button`

---

## User Communication
- Once the bug is fixed, update the changelog and release notes to inform users.
- If the bug affected end users, consider a brief note in the next release summary.

---

## Symptoms
- Both buttons are hidden when both toggles are Off (expected).
- When only one toggle is Off, both buttons remain visible (unexpected).
- Toggling either setting does not independently show/hide the corresponding button.

---

## Step-by-Step Plan

### 0. Safeguard Metrics Settings
- **Backup plugin settings** (e.g., copy/export the settings file from `.obsidian/plugins/oneirometrics/`).
- **Review and isolate**: Before making changes, review the code that handles settings—especially metrics and ribbon button toggles—to ensure changes do not affect metrics.
- **Add logging**: Temporarily add logging to settings load/save methods to confirm only ribbon button toggles are changed.
- **Test metrics settings persistence**: After each code change and before committing, reload the plugin and verify all metrics settings remain unchanged.
- **Restore from backup if needed**: If any metrics settings are lost or changed, immediately restore from the backup.

### 0b. Safeguard Ribbon Button Icons and Labels
- **Document expected icons/labels:**
  - "Dream Scrape Tool" → lucide wand-sparkles icon, label "Dream Scrape Tool"
  - "Open Metrics Note" → lucide shell icon, label "Open Metrics Note"
- **Add code comments and checks** to ensure correct icon/label assignment.
- **Log icon/label assignment** during button creation/update.
- **Manually verify** correct icons/labels after each change and plugin reload.
- **Restore from backup** or revert if icons/labels are lost or changed.

### 1. Add Logging for Debugging
- Log the values of `showScrapeButton` and `showNoteButton` from settings whenever the UI is updated.
- Log when each button is created, shown, hidden, or removed.
- Log the current DOM state (whether `.oom-ribbon-scrape-button` and `.oom-ribbon-note-button` exist) after each update.

### 2. Reproduce and Document the Bug
- With logging enabled, toggle each setting individually and together.
- Record the logs and the actual UI result for each combination.
- Note any discrepancies between expected and actual behavior.

### 3. Review and Refactor the Update Logic
- Carefully review the `updateRibbonIcons()` method (or equivalent).
- Check for early returns, shared state, or logic errors that could cause both buttons to be hidden or not updated.
- Ensure button removal/creation is properly isolated for each button.
- Consider refactoring to always remove both buttons first, then add them back only if their respective toggle is enabled.

### 4. Test Each Scenario
- Test: both on, both off, only scrape on, only note on (see Testing Matrix).
- Confirm logs and UI match expectations.

### 5. Add Unit/Integration Tests (if possible)
- If feasible, add tests for the ribbon button logic to prevent regressions.

### 6. Document the Fix
- Add comments to the code explaining the logic and any edge cases.
- Update the changelog and troubleshooting docs as needed.

---

## Additional Improvements

### Update "Open Metrics Note" Button to Use Command Palette Command
- **Note:** This step should be performed only after the visibility bug is fixed and thoroughly tested.
- Refactor the "Open Metrics Note" ribbon button so that it triggers the same logic as the "Open Metrics Note" command palette command.
- This ensures consistent behavior and makes future maintenance easier.

### Retain Current Icons and Text
- The "Open Metrics Note" button should continue to use the **lucide shell icon** and its text should remain **"Open Metrics Note"**.
- The "Dream Scrape Tool" button should continue to use the **lucide wand-sparkles icon** and its text should remain **"Dream Scrape Tool"**.
- Any refactoring or bug fixes should not alter the appearance or labeling of these buttons.

---

## Discussion Points
- Is the bug only present after toggling, or also after plugin reload/restart?
- Should we debounce or throttle UI updates if toggles are changed rapidly?
- Do we want to provide user feedback (e.g., a Notice) if both buttons are hidden?
- Should we expose a debug command to force-refresh the ribbon buttons for troubleshooting?

---

## Logs & Findings
(To be filled in as the investigation proceeds)

---

## Resolution
(To be filled in after the fix is implemented)

---

## Lessons Learned
(Optional, for future reference) 