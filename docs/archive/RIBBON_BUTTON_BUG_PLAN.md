# RIBBON BUTTON BUG PLAN (ARCHIVED)

---

## Resolution (2025-05-19)

**Status:** RESOLVED & ARCHIVED

- **Root Cause:** The inability to independently toggle two ribbon buttons was due to a limitation or quirk in the Obsidian API, not a bug in plugin logic or settings persistence.
- **Solution:** The plugin was refactored to use a single toggle for both ribbon buttons, which is a pragmatic and user-friendly workaround. All settings and UI were updated accordingly. Extensive debug logging and diagnostics were removed after resolution.
- **Lessons Learned:**
    - Obsidian's ribbon API may not support multiple independently toggled buttons per plugin.
    - Incremental, minimal test plugins are invaluable for isolating core issues.
    - Detailed plans and logs are useful for future debugging and onboarding.
- **Follow-up:** This plan is now archived for reference. No further action required unless the Obsidian API changes.

> **NOTE:** This file is now archived and should be considered read-only. If you need to reference or revive this issue, copy this file to a new location or create a new plan.

---

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
- Ribbon buttons remain accessible (keyboard navigation, screen reader labels) after the fix.

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
- Settings file: `.obsidian/plugins/oneirometrics/data.json` (or equivalent, depending on Obsidian version)

---

## User Communication
- Once the bug is fixed, update the changelog and release notes to inform users.
- If the bug affected end users, consider a brief note in the next release summary.
- If both buttons are hidden, consider showing a Notice or log entry to inform users why the ribbon is empty.

---

## Symptoms
- Both buttons are hidden when both toggles are Off (expected).
- When only one toggle is Off, both buttons remain visible (unexpected).
- Toggling either setting does not independently show/hide the corresponding button.

---

## Observations on Current Code Logic
- The current `updateRibbonIcons()` implementation in `main.ts` removes both ribbon buttons and re-adds them based on the settings.
- Each toggle (`showScrapeButton`, `showNoteButton`) is checked independently:
  - If only one is true, only that button should be added.
  - If both are true, both are added.
  - If both are false, neither is added.
- There is no logic in `updateRibbonIcons()` that would cause both buttons to be shown if only one toggle is on.
- The bug is likely due to one of the following:
  - Settings are not being updated or saved correctly before `updateRibbonIcons()` is called.
  - The DOM is not being updated as expected (e.g., old buttons are not being removed, or new ones are being added redundantly).
  - There is some other state or event issue outside this function.
- Therefore, detailed logging should be added to both the settings change handlers and `updateRibbonIcons()` to confirm the flow of values and DOM changes, and to pinpoint whether the bug is in settings persistence, event timing, or DOM manipulation.

## Additional Findings from Log Analysis
- The settings logic and toggle handling are working as intended; toggling settings updates the values and calls updateRibbonIcons() as expected.
- However, log output shows that after updateRibbonIcons() runs, both ribbon buttons are present in the DOM even when only one should be.
- Repeatedly toggling the settings does not create duplicate buttons—there are never more than two buttons at a time, as expected.
- This suggests the issue is not with settings persistence or logic, nor with accidental duplication, but rather with how ribbon buttons are being removed or managed in the DOM.
- It is possible that Obsidian keeps its own references to ribbon icons, and that simply removing the DOM element is insufficient. There may be a more appropriate API or method for removing ribbon icons.
- Recommend updating the removal logic to remove all instances of each button (using querySelectorAll), and adding logging to report the number and actual elements of each button in the DOM after each update.
- Further investigation into the Obsidian API for ribbon icon removal may be warranted to ensure proper cleanup and avoid stale references.

## Results of Manual DOM Removal Test and Next Debugging Steps
- Manual removal of the unwanted ribbon button from the DOM does not cause it to reappear, indicating Obsidian is not restoring it and the plugin is not re-adding it after removal.
- This suggests the plugin is re-adding both buttons during the update process, even when only one should be present, or that the logic for adding/removing is not correctly gated by the settings.
- Next recommended debugging steps:
  1. Add a unique log or stack trace each time updateRibbonIcons() is called to check for multiple calls per toggle.
  2. Log the entire this.settings object at the start of updateRibbonIcons() to ensure it matches expectations.
  3. After toggling, inspect the DOM to see if both buttons are inside the same parent, and if both are visible or one is hidden via CSS.
  4. Try a minimal plugin that only adds/removes a ribbon button based on a toggle, to see if the issue is reproducible outside the current codebase.
- These steps will help isolate whether the issue is with plugin logic, settings state, or something else.

## Latest Findings (Vanilla Vault Test)
- The bug is reproducible in a clean, vanilla Obsidian vault with only this plugin enabled, ruling out vault-specific or plugin conflicts.
- With all toggles off, no orphaned ribbon button elements remain in the DOM, confirming removal logic is working.
- The minimal/test button logic works perfectly, both standalone and when integrated into the main plugin.
- The main plugin's two-button logic (scrape/note) fails even when using the same removal/creation code as the minimal/test button.

### Speculation
- The issue is likely due to a subtle logic or state issue in the main plugin's handling of the two main ribbon buttons.
- Possible causes include: settings object mutation or caching, asynchronous update race, or a quirk in Obsidian's ribbon API when handling multiple buttons.

### Next Step
- Add deep diagnostic logging to trace settings, stack, and event order.

## Latest Findings and Next Steps
- Despite robust removal and correct settings logic, both ribbon buttons persist in the DOM after toggling either toggle, except when both are off.
- The plugin is not duplicating buttons, but is unable to remove the 'other' button; after removing both and adding only one, both appear.
- This suggests Obsidian may be restoring ribbon buttons from elsewhere, or there is a race condition or API bug.
- Next steps:
  1. Create a minimal plugin that only adds/removes a single ribbon button based on a toggle, to see if the bug is reproducible in isolation.
  2. Ensure there are not multiple instances of the plugin enabled (e.g., dev and release versions).
  3. Fully quit and restart Obsidian, then retest.
  4. If the issue persists, consider posting a summary and findings to the Obsidian forums or Discord for community or developer insight.
- Note: These steps will help determine if the issue is with the plugin, the environment, or the Obsidian API itself.

---

## Step-by-Step Plan

### 0. Safeguard Metrics Settings
- **Backup plugin settings**: Copy/export the settings file from `.obsidian/plugins/oneirometrics/data.json` before making changes.
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
- If both buttons are hidden, log this state and optionally show a Notice to the user.

### 2. Reproduce and Document the Bug
- With logging enabled, toggle each setting individually and together.
- Record the logs and the actual UI result for each combination.
- Note any discrepancies between expected and actual behavior.

### 3. Review and Refactor the Update Logic
- Carefully review the `updateRibbonIcons()` method (or equivalent).
- Check for early returns, shared state, or logic errors that could cause both buttons to be hidden or not updated.
- Ensure button removal/creation is properly isolated for each button.
- Consider refactoring to always remove both buttons first, then add them back only if their respective toggle is enabled.
- If toggles are changed rapidly, consider debouncing UI updates (though this may be unnecessary if changes are infrequent).

### 4. Test Each Scenario
- Test: both on, both off, only scrape on, only note on (see Testing Matrix).
- Confirm logs and UI match expectations.
- Verify that ribbon buttons remain accessible (keyboard navigation, screen reader labels) after the fix.

### 5. Add Unit/Integration Tests (if possible)
- Add tests for the ribbon button logic to prevent regressions.
- Example: Mock settings changes and assert DOM state (button presence/absence, correct icons/labels).
- Place these tests in a `tests/` directory or as inline tests in `main.ts` if a test framework is not set up.

### 6. Add Debugging Tools (Temporary)
- Add a temporary debug command or hotkey to force-refresh the ribbon buttons for troubleshooting. Remove this after the fix is verified.

### 7. Document the Fix
- Add comments to the code explaining the logic and any edge cases.
- Update the changelog, troubleshooting docs, `docs/TESTING.md`, and `ISSUES.md` as needed with the fix and new test cases.

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

## Incremental Migration Plan: Minimal Ribbon Button Approach

### Rationale
After extensive debugging, we will adopt a proven, incremental approach: start from the minimal working ribbon button plugin ("oom-ribbon-test"), and gradually add features until it fully replicates the desired UI and logic. This isolates the bug, ensures each step works, and provides a clean migration path if successful.

### Steps
1. **Start with the Minimal Plugin**
   - Use the working minimal ribbon button code as the base (e.g., `oom-ribbon-test`).

2. **Add a Second Button**
   - Add a second ribbon button and a toggle for it, mirroring the main plugin's UI.
   - Test toggling each button independently.

3. **Add Settings UI**
   - Add settings UI for both toggles, ensuring changes persist and update the ribbon as expected.

4. **Incrementally Add Features**
   - Add logging, icon/label assignment, and any other features from the main plugin, one at a time.
   - After each addition, test all toggle combinations and DOM state.

5. **Replicate Full UI**
   - Continue until the minimal plugin fully replicates the main plugin's ribbon button UI and logic.

6. **Switch Over**
   - If the new version works without the bug, replace the old ribbon logic in the main plugin with this new, proven code.
   - Remove the old settings/toggles if they are no longer needed.

7. **Clean Up**
   - Remove legacy or redundant code.
   - Update documentation and settings UI as needed.

### Benefits
- Pinpoints the source of the bug if it reappears during migration.
- Ensures a clean, maintainable codebase.
- Provides a clear rollback path if needed.

### Next Action
Proceed to implement this migration, starting with the minimal plugin and incrementally adding features, testing after each step.

---

## Findings: Minimal Plugin Reproduces the Bug & Chosen Workaround

### Key Findings
- The bug is now reproduced in the minimal test plugin: when two ribbon buttons are controlled by independent toggles, both buttons remain visible as long as either toggle is enabled.
- This confirms the issue is not due to legacy code, settings persistence, or complexity in the main plugin.
- The bug is likely a limitation or quirk in the Obsidian API when handling multiple ribbon buttons in the same plugin.
- The logic for adding/removing buttons is correct, but the DOM does not update as expected when toggling independently.

### Workaround & Path Forward
- **Consolidate to a Single Toggle:**
  - Remove the two independent toggles.
  - Add a single toggle: "Show OneiroMetrics Ribbon Buttons" and list both icons in parentheses in the description.
  - Add a description: "Add ribbon buttons to quickly open the Dream Scrape tool or your metrics note (icons shown side by side)".
  - When enabled, both buttons are shown; when disabled, both are hidden.
- This avoids the problematic code path and is not a major UX compromise.
- Add a note in the settings and changelog explaining the change and the reason (Obsidian API limitation).
- Keep the minimal test plugin and bug report handy for future reference or escalation.

### Additional Suggestions
- If desired, prepare a minimal bug report for the Obsidian developers, including the minimal plugin code and a description of the issue.
- Optionally, try variations (e.g., tracking button elements, using different icons, adding a delay) to further isolate the bug for reporting.
- If users request independent toggles in the future, explain the technical reason and point to the bug report.

### Next Action
- Update the main plugin and settings UI to use a single toggle for both ribbon buttons, with the improved label and description.
- Test to confirm both buttons appear/disappear together as expected.
- Update documentation and changelog to reflect the change and rationale.

---

## Discussion Points
- Is the bug only present after toggling, or also after plugin reload/restart?
- Should we debounce or throttle UI updates if toggles are changed rapidly?
- Do we want to provide user feedback (e.g., a Notice) if both buttons are hidden?
- Should we expose a debug command to force-refresh the ribbon buttons for troubleshooting?
- Are there additional accessibility checks needed after the fix?

---

## Logs & Findings
(To be filled in as the investigation proceeds)

---

## Resolution
(To be filled in after the fix is implemented) 