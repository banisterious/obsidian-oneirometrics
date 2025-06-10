# Keyboard Navigation Reference
> **Last Updated:** 2025-06-10

## Table of Contents

- [Overview](#overview)
- [Quick Reference](#quick-reference)
  - [Global Shortcuts](#global-shortcuts)
  - [Calendar Navigation](#calendar-navigation)
  - [Interface Navigation](#interface-navigation)
- [Enhanced Date Navigator](#enhanced-date-navigator)
  - [Opening the Date Navigator](#opening-the-date-navigator)
  - [Basic Calendar Navigation](#basic-calendar-navigation)
  - [Date Selection](#date-selection)
  - [View Mode Navigation](#view-mode-navigation)
  - [Multi-Month Navigation](#multi-month-navigation)
- [Advanced Navigation Patterns](#advanced-navigation-patterns)
  - [Range Selection](#range-selection)
  - [Multi-Date Selection](#multi-date-selection)
  - [Quick Navigation](#quick-navigation)
  - [Keyboard Shortcuts Combinations](#keyboard-shortcuts-combinations)
- [Interface Elements](#interface-elements)
  - [Dropdowns and Menus](#dropdowns-and-menus)
  - [Buttons and Controls](#buttons-and-controls)
  - [Modal Dialogs](#modal-dialogs)
  - [Form Elements](#form-elements)
- [Filter and Search Navigation](#filter-and-search-navigation)
  - [Date Filter Navigation](#date-filter-navigation)
  - [Filter Application](#filter-application)
  - [Search Interface](#search-interface)
- [Accessibility Navigation](#accessibility-navigation)
  - [Screen Reader Navigation](#screen-reader-navigation)
  - [High Contrast Navigation](#high-contrast-navigation)
  - [Reduced Motion Navigation](#reduced-motion-navigation)
- [Platform-Specific Shortcuts](#platform-specific-shortcuts)
  - [Windows Shortcuts](#windows-shortcuts)
  - [Mac Shortcuts](#mac-shortcuts)
  - [Linux Shortcuts](#linux-shortcuts)
- [Customization](#customization)
  - [Custom Shortcuts](#custom-shortcuts)
  - [Shortcut Conflicts](#shortcut-conflicts)
  - [Preference Settings](#preference-settings)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Shortcut Conflicts](#shortcut-conflicts-1)
  - [Focus Problems](#focus-problems)
- [Advanced Techniques](#advanced-techniques)
  - [Power User Workflows](#power-user-workflows)
  - [Efficiency Tips](#efficiency-tips)
  - [Keyboard-Only Workflows](#keyboard-only-workflows)

---

This comprehensive keyboard navigation reference provides complete coverage of all keyboard shortcuts and navigation patterns available in OneiroMetrics v0.16.0, with special focus on the Enhanced Date Navigator.

## Overview

OneiroMetrics provides extensive keyboard navigation support designed for efficiency and accessibility. All features are accessible via keyboard, with logical tab order, standard keyboard conventions, and screen reader compatibility.

### Navigation Principles
- **Standard conventions**: Uses familiar keyboard patterns (Tab, Arrow keys, Enter, Escape)
- **Logical tab order**: Interface elements follow intuitive navigation flow
- **Visual feedback**: Clear focus indicators show current keyboard position
- **Escape hatches**: Easy ways to cancel or return to previous states

### Keyboard-First Design
- **Primary actions accessible**: All major functions available via keyboard
- **Efficient shortcuts**: Quick access to frequently used features  
- **Context-aware navigation**: Keyboard behavior adapts to current interface state
- **Consistent patterns**: Similar actions use similar keyboard interactions across the interface

## Quick Reference

### Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+D` | Open Enhanced Date Navigator | Global |
| `Escape` | Close Modal/Cancel | Global |

*Note: On Mac, use `Cmd` instead of `Ctrl`*

**Note**: Only `Ctrl+Shift+D` is currently implemented as a global shortcut. Other global shortcuts like `Ctrl+Shift+T`, `Ctrl+Shift+F`, and `Ctrl+Shift+C` are planned for future implementation.

### Calendar Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `←` `→` | Previous/Next Day | Calendar Grid |
| `↑` `↓` | Previous/Next Week | Calendar Grid |
| `Home` | First Day of Month | Calendar Grid |
| `End` | Last Day of Month | Calendar Grid |
| `Page Up` | Previous Month | Calendar Grid |
| `Page Down` | Next Month | Calendar Grid |
| `Ctrl+Home` | Go to Today | Calendar Grid |
| `Enter` / `Space` | Select Date | Calendar Grid |

### Interface Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `Tab` | Next Element | Global |
| `Shift+Tab` | Previous Element | Global |
| `Enter` | Activate/Confirm | Buttons, Links |
| `Space` | Toggle/Select | Checkboxes, Buttons |
| `Alt+↓` | Open Dropdown | Dropdowns |
| `Escape` | Close/Cancel | Modals, Dropdowns |
| `Ctrl+Z` | Undo | Input Fields |
| `Ctrl+Y` | Redo | Input Fields |

## Enhanced Date Navigator

### Opening the Date Navigator

#### Primary Methods
- **Global shortcut**: `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
- **Ribbon access**: Tab to ribbon, navigate to calendar icon, press Enter
- **Command palette**: `Ctrl+Shift+P`, type "Enhanced Date", press Enter

#### Alternative Access
- **Menu navigation**: Alt menu access where available
- **Context menus**: Right-click date-related elements for quick access
- **Filter dropdown**: Navigate to "Choose Dates..." option

### Basic Calendar Navigation

#### Within Calendar Grid
```
←  →     Navigate days (left/right)
↑  ↓     Navigate weeks (up/down)  
Home     Jump to first day of month
End      Jump to last day of month
Enter    Select focused date
Space    Select focused date (alternative)
Escape   Exit calendar/close navigator
```

#### Month Navigation
```
Page Up     Previous month
Page Down   Next month
Ctrl+←      Previous month (alternative)
Ctrl+→      Next month (alternative)
```

#### Quick Navigation
```
Ctrl+Home   Jump to today's date
Ctrl+T      Jump to today (when available)
T           Quick today access (context dependent)
```

### Date Selection

#### Single Date Selection
1. **Navigate to date**: Use arrow keys to focus desired date
2. **Select date**: Press `Enter` or `Space`
3. **Confirm selection**: Selected date highlighted, ready for filter application

#### Multiple Date Selection
1. **Enable multi-selection**: Tab to selection mode controls, enable multi-mode
2. **Select first date**: Navigate and press `Enter`/`Space`
3. **Add more dates**: Continue navigating and selecting additional dates
4. **Ctrl+click equivalent**: `Ctrl+Enter` or `Ctrl+Space` for additional selections

### View Mode Navigation

#### Switching View Modes
1. **Tab to view dropdown**: Navigate to "View Mode" dropdown
2. **Open dropdown**: Press `Alt+↓` or `Enter`
3. **Select view**: Use `↑`/`↓` arrows, press `Enter` to confirm

**Note**: Direct keyboard shortcuts for view modes (1, 2, 3 keys) are planned for future implementation.

#### View-Specific Navigation
- **Single Month**: Full keyboard navigation, all features accessible
- **Dual Month**: Tab between month grids, arrow keys within each grid
- **Quarter View**: Tab between months, arrow navigation within focused month

### Multi-Month Navigation

#### Dual Month View
```
Tab            Move to next month grid
Shift+Tab      Move to previous month grid
Arrow keys     Navigate within current month grid
Ctrl+←/→       Navigate between months in focused grid
```

#### Quarter View
```
Tab            Cycle through month grids (chronological order)
Shift+Tab      Reverse cycle through month grids
Arrow keys     Navigate within focused month grid
Page Up/Down   Navigate months within focused grid
```

#### Navigation Best Practices
- **Tab to enter**: Use Tab to move focus into calendar grids
- **Arrow to navigate**: Use arrow keys for date navigation within grids
- **Tab to exit**: Tab out of grid to access other interface elements
- **Visual feedback**: Focus indicators show current navigation position

## Advanced Navigation Patterns

### Range Selection

#### Keyboard Range Selection
1. **Enable range mode**: Tab to selection controls, enable range selection
2. **Select start date**: Navigate to first date, press `Enter`
3. **Navigate to end date**: Use arrow keys or month navigation
4. **Select end date**: Press `Enter` to complete range selection
5. **Visual feedback**: Range highlighted between start and end dates

#### Range Navigation Shortcuts
```
Shift+→        Extend selection one day forward
Shift+←        Extend selection one day backward  
Shift+↓        Extend selection one week forward
Shift+↑        Extend selection one week backward
Shift+Page Down Extend selection one month forward
Shift+Page Up   Extend selection one month backward
```

**Note**: Shift+arrow key range selection shortcuts are planned for future implementation. Currently use selection mode controls and individual date selection.

### Multi-Date Selection

#### Scattered Date Selection
1. **Enable multi-mode**: Access selection mode controls via Tab
2. **First selection**: Navigate and select with `Enter`/`Space`
3. **Additional selections**: Use `Ctrl+Enter` or `Ctrl+Space` for each additional date
4. **Deselection**: `Ctrl+Enter`/`Ctrl+Space` on selected dates to deselect

#### Bulk Selection Methods
- **Month selection**: Focus month header, use shortcuts for entire month selection
- **Week selection**: Focus week row, use shortcuts for entire week selection
- **Pattern selection**: Use search/filter combinations for pattern-based selection

### Quick Navigation

#### Jump to Specific Dates
1. **Year navigation**: Tab to year display, press `Enter`, type year, press `Enter`
2. **Month navigation**: Tab to month display, press `Enter`, use arrows or type month
3. **Direct date entry**: Use date input fields when available for direct navigation

#### Pattern Navigation
- **Navigation memory**: Use recent dates chips for quick navigation to previously selected dates
- **Month/year picker**: Direct navigation using year and month selection interfaces

**Note**: Advanced pattern navigation features like N/P keys for entry navigation and quality hotkeys are planned for future implementation.

### Keyboard Shortcuts Combinations

#### Power User Combinations
```
Ctrl+Shift+D → Tab → Enter    Quick date navigator open and enter calendar
Ctrl+Home → Enter → Tab       Jump to today, select, move to apply button
Page Down × 3 → Arrow keys    Navigate 3 months forward, then to specific date
Alt+↓ → ↑/↓ → Enter          Quick dropdown navigation pattern
```

#### Workflow Combinations
- **Range selection workflow**: Range mode + start date + navigation + end date + apply
- **Multi-month workflow**: Tab between grids + individual date selections + bulk apply

**Note**: Advanced shortcut combinations with Alt+A and other global shortcuts are planned for future implementation.

## Interface Elements

### Dropdowns and Menus

#### Standard Dropdown Navigation
```
Tab           Navigate to dropdown
Alt+↓         Open dropdown menu
↑ ↓          Navigate menu options
Enter         Select highlighted option
Escape        Close without selection
Home          Jump to first option
End           Jump to last option
```

#### Menu Search
- **Type-ahead**: Type first letter(s) to jump to matching options
- **Incremental search**: Continue typing to refine matches
- **Clear search**: `Escape` or wait for search timeout

### Buttons and Controls

#### Button Navigation
```
Tab           Navigate to button
Enter         Activate button
Space         Activate button (alternative)
```

#### Toggle Controls
```
Space         Toggle checkbox/switch state
Enter         Activate toggle (context dependent)
```

#### Radio Button Groups
```
↑ ↓          Navigate radio options (vertical groups)
← →          Navigate radio options (horizontal groups)
Space        Select focused radio option
```

### Modal Dialogs

#### Modal Navigation
```
Tab           Navigate within modal
Shift+Tab     Reverse navigate within modal  
Escape        Close modal (usually)
Enter         Confirm/Apply (default button)
Alt+C         Cancel (when available)
Alt+A         Apply/OK (when available)
```

#### Modal Focus Management
- **Focus trapping**: Tab navigation stays within modal
- **Initial focus**: Automatic focus on first interactive element or primary action
- **Return focus**: Focus returns to trigger element when modal closes

### Form Elements

#### Input Field Navigation
```
Tab           Move to next field
Shift+Tab     Move to previous field
Enter         Submit form (single-line inputs)
Ctrl+A        Select all text
Home          Move to beginning of field
End           Move to end of field
```

#### Text Area Navigation
```
Tab           Move to next field (doesn't insert tab)
Ctrl+Tab      Insert tab character (when supported)
Page Up/Down  Scroll within large text areas
```

## Filter and Search Navigation

### Date Filter Navigation

#### Filter Interface Access
1. **Open filter**: `Ctrl+Shift+F` or navigate via Tab to filter controls
2. **Date selection**: Access date navigator via filter interface
3. **Filter options**: Tab through filter configuration options
4. **Apply filter**: Tab to Apply button, press `Enter`

#### Filter Management
**Note**: Advanced filter keyboard shortcuts (Ctrl+Shift+C, Alt+C, Alt+A, Alt+R) are planned for future implementation. Currently use Tab navigation to access filter controls.

### Filter Application

#### Quick Filter Workflows
1. **Date range filter**: `Ctrl+Shift+D` → range selection → Tab to Apply Filter → Enter
2. **Today filter**: Use Today button in Enhanced Date Navigator
3. **Clear filter**: Use Clear button in filter interface

**Note**: Global filter shortcuts (Ctrl+Shift+T, Ctrl+Shift+C) are planned for future implementation.

### Search Interface

#### Search Navigation
```
Ctrl+F        Open search (when available)
/             Quick search activation
Escape        Close search
Enter         Execute search
F3            Find next result
Shift+F3      Find previous result
```

## Accessibility Navigation

### Screen Reader Navigation

#### Screen Reader Shortcuts
```
H             Navigate by headings
K             Navigate by links
B             Navigate by buttons
T             Navigate by tables
F             Navigate by form elements
```

#### ARIA Navigation
- **Landmarks**: Navigate by page regions (main, navigation, etc.)
- **Live regions**: Automatic announcement of important updates
- **Role-based navigation**: Navigate by element roles (grid, button, etc.)

### High Contrast Navigation

#### High Contrast Optimized Shortcuts
- **Enhanced focus indicators**: More visible focus rings in high contrast mode
- **Color-independent navigation**: All navigation cues work without color perception
- **Increased target sizes**: Larger click/tap targets for easier navigation

### Reduced Motion Navigation

#### Motion-Sensitive Navigation
- **No animation dependence**: All navigation works without animations
- **Immediate feedback**: Instant state changes without transition delays
- **Alternative indicators**: Static indicators replace motion-based feedback

## Platform-Specific Shortcuts

### Windows Shortcuts

#### Windows-Specific Patterns
```
Alt           Access menu bar
Alt+F4        Close application/modal
F10           Focus menu bar
Ctrl+Tab      Switch between interface panels
Alt+Tab       System application switching
```

#### Windows Accessibility
```
Windows+U     Open Ease of Access settings
Windows++     Zoom in (system magnifier)
Windows+-     Zoom out (system magnifier)
```

### Mac Shortcuts

#### Mac-Specific Patterns
```
Cmd           Replace Ctrl in most shortcuts
Cmd+Q         Quit application
Cmd+W         Close window/modal
Cmd+`         Cycle between windows
Cmd+Tab       Application switching
```

#### Mac Accessibility
```
Cmd+Opt+F5    Open VoiceOver settings
Cmd+Opt+8     Toggle zoom
Cmd+Opt+=     Zoom in
Cmd+Opt+-     Zoom out
```

### Linux Shortcuts

#### Linux-Specific Patterns
```
Alt+F2        Run command (varies by desktop)
Ctrl+Alt+T    Open terminal (common shortcut)
Super         Open application launcher
```

#### Desktop Environment Variations
- **GNOME**: Super key for activities overview
- **KDE**: Alt+F1 for application launcher  
- **XFCE**: Ctrl+Alt+D for desktop
- **Unity**: Super for Unity dash

## Customization

### Custom Shortcuts

#### Shortcut Customization Process
1. **Access settings**: Navigate to OneiroMetrics settings/preferences
2. **Keyboard section**: Find keyboard shortcuts or hotkeys section
3. **Shortcut assignment**: Click/focus shortcut field, press desired key combination
4. **Conflict resolution**: System alerts for conflicting shortcuts
5. **Save settings**: Apply and save custom shortcut configuration

#### Customizable Shortcuts
- **Date Navigator**: Custom shortcut for opening Enhanced Date Navigator
- **Filter shortcuts**: Custom shortcuts for common filter operations
- **Navigation shortcuts**: Custom shortcuts for frequently used navigation actions
- **View shortcuts**: Custom shortcuts for switching between view modes

### Shortcut Conflicts

#### Conflict Detection
- **System shortcuts**: Detection of conflicts with OS-level shortcuts
- **Browser shortcuts**: Identification of browser shortcut conflicts
- **Obsidian shortcuts**: Integration with Obsidian's shortcut system
- **Plugin conflicts**: Detection of conflicts with other plugin shortcuts

#### Conflict Resolution
1. **Automatic suggestions**: Alternative shortcut suggestions when conflicts detected
2. **Priority settings**: Configure which shortcuts take precedence
3. **Context-specific shortcuts**: Different shortcuts for different interface contexts
4. **Fallback options**: Alternative access methods when shortcuts conflict

### Preference Settings

#### Keyboard Behavior Settings
- **Tab behavior**: Configure Tab key behavior in different contexts
- **Arrow key sensitivity**: Adjust arrow key repeat rates and sensitivity
- **Modifier key preferences**: Choose preferred modifier keys (Ctrl, Alt, Shift combinations)
- **Focus indicators**: Customize focus indicator appearance and behavior

#### Accessibility Preferences
- **Screen reader optimization**: Enhanced keyboard navigation for screen readers
- **High contrast shortcuts**: Optimized shortcuts for high contrast mode
- **Reduced motion**: Keyboard navigation without animation dependencies

## Troubleshooting

### Common Issues

#### Shortcuts Not Working
**Symptoms**: Keyboard shortcuts don't respond or work inconsistently

**Solutions**:
1. **Check focus**: Ensure OneiroMetrics interface has focus
2. **Modifier keys**: Verify correct modifier keys for your platform (Ctrl vs Cmd)
3. **Shortcut conflicts**: Check for conflicts with system or browser shortcuts
4. **Browser settings**: Verify browser allows JavaScript keyboard event handling
5. **Plugin conflicts**: Disable other Obsidian plugins temporarily to test

#### Focus Lost or Trapped
**Symptoms**: Keyboard focus disappears or gets stuck in interface elements

**Solutions**:
1. **Escape key**: Press Escape to exit current context
2. **Tab reset**: Press Tab multiple times to cycle through interface
3. **Page refresh**: Refresh page if focus becomes completely stuck
4. **Modal closure**: Ensure all modal dialogs are properly closed

### Shortcut Conflicts

#### System Shortcut Conflicts
**Common Conflicts**:
- `Ctrl+Shift+D`: May conflict with browser bookmark manager
- `Ctrl+Shift+T`: May conflict with browser "reopen closed tab"  
- `Ctrl+Shift+F`: May conflict with browser search in page

**Solutions**:
1. **Use alternative shortcuts**: Configure custom shortcuts to avoid conflicts
2. **Context awareness**: Shortcuts work when OneiroMetrics has focus
3. **Browser settings**: Modify browser shortcut preferences where possible
4. **Platform alternatives**: Use platform-specific alternatives (Cmd on Mac)

#### Application Conflicts
**Obsidian Conflicts**: 
- Check Obsidian's hotkey settings for conflicting shortcuts
- Use Obsidian's hotkey interface to resolve conflicts
- Consider OneiroMetrics context-specific shortcuts

**Plugin Conflicts**:
- Review other plugin shortcuts for conflicts
- Use plugin priority settings where available
- Coordinate with other accessibility-focused plugins

### Focus Problems

#### Focus Indicators Not Visible
**Symptoms**: Can't see where keyboard focus is located

**Solutions**:
1. **High contrast mode**: Enable system high contrast for better focus visibility
2. **Browser zoom**: Increase browser zoom level for larger focus indicators
3. **Theme settings**: Check if current theme hides focus indicators
4. **CSS overrides**: Custom CSS may be hiding focus indicators

#### Focus Order Problems
**Symptoms**: Tab order doesn't follow logical interface flow

**Solutions**:
1. **Interface state**: Ensure interface is in expected state (no hidden modals)
2. **Browser standards**: Modern browsers should follow proper tab order
3. **Report issues**: Document tab order problems for developer attention
4. **Alternative navigation**: Use arrow keys and other navigation methods

## Advanced Techniques

### Power User Workflows

#### Rapid Date Selection Workflow
```
1. Ctrl+Shift+D     (Open date navigator)
2. Tab              (Enter calendar grid)  
3. Ctrl+Home        (Jump to today)
4. Page Down × N    (Navigate N months forward)
5. Arrow keys       (Fine-tune to specific date)
6. Enter            (Select date)
7. Tab              (Move to Apply button)
8. Enter            (Apply filter)
```

#### Bulk Date Management
```
1. Ctrl+Shift+D     (Open date navigator)
2. Tab to multi-mode (Enable multi-selection)
3. Space            (Enable multi-mode)
4. Tab to calendar  (Enter calendar grid)
5. Date selection loop:
   - Arrow navigation to date
   - Ctrl+Enter (Add to selection)
   - Repeat for each desired date
6. Tab to Apply     (Move to apply button)
7. Enter            (Apply multi-date filter)
```

#### Quick Month Comparison
```
1. Ctrl+Shift+D     (Open date navigator)
2. Tab to view mode (Access view dropdown)
3. Alt+↓, ↓, Enter  (Switch to dual month view)
4. Tab to calendar  (Enter first month grid)
5. Arrow navigation (Compare dates in current month)
6. Tab              (Move to next month grid)
7. Arrow navigation (Compare dates in next month)
```

### Efficiency Tips

#### Muscle Memory Development
- **Practice common patterns**: Repeat frequently used shortcut combinations
- **Consistent usage**: Use keyboard shortcuts consistently instead of mixing mouse/keyboard
- **Progressive complexity**: Master basic shortcuts before advancing to complex combinations
- **Contextual learning**: Learn shortcuts within context of actual workflows

#### Speed Optimization
- **Minimize mode switching**: Stay in keyboard mode for entire workflows
- **Batch operations**: Group similar actions together to minimize navigation
- **Shortcut chaining**: Chain related shortcuts together for fluid operation
- **Context awareness**: Learn which shortcuts work in which interface contexts

### Keyboard-Only Workflows

#### Complete Keyboard-Only Date Filtering
1. **Open OneiroMetrics**: Via Obsidian navigation or pinned note
2. **Access date navigator**: `Ctrl+Shift+D`
3. **Configure view**: Tab to view mode, select optimal view
4. **Navigate calendar**: Tab to calendar, use arrow keys for navigation
5. **Select dates**: Enter/Space for selection, Ctrl+Enter for multi-selection
6. **Apply filter**: Tab to Apply button, Enter to confirm
7. **Review results**: Tab through filtered results, use screen reader if needed
8. **Modify filter**: Return to date navigator for adjustments as needed

#### Accessibility-First Navigation
- **Screen reader users**: Utilize heading navigation (H key) and landmark navigation
- **High contrast users**: Rely on focus indicators and keyboard navigation exclusively
- **Motor impairment users**: Use sticky keys and longer press durations as needed
- **Voice control users**: Combine voice commands with keyboard shortcuts where supported

---

This keyboard navigation reference ensures that OneiroMetrics is fully accessible and efficient for keyboard users across all experience levels and accessibility needs. Master these shortcuts to significantly improve your dream tracking workflow efficiency! 