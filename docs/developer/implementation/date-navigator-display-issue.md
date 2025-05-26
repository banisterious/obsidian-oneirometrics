# Date Navigator Display Issue Documentation

## Table of Contents
- [Problem Summary](#problem-summary)
- [Symptoms](#symptoms)
- [Investigation Process](#investigation-process)
  - [Initial Diagnostics](#initial-diagnostics)
  - [Attempts Made](#attempts-made)
  - [Current Workaround](#current-workaround)
- [Root Cause Analysis](#root-cause-analysis)
- [Recommended Next Steps](#recommended-next-steps)
  - [Short-term](#short-term)
  - [Medium-term (post-refactoring)](#medium-term-post-refactoring)
  - [Long-term architectural considerations](#long-term-architectural-considerations)
- [Conclusion](#conclusion)

## Problem Summary
The DateNavigator calendar component isn't correctly displaying dots and stars for dream entries. While the calendar UI itself renders properly, it fails to show indicators for dream entries that exist in the system, instead only showing test entries.

## Symptoms
- Calendar modal appears and basic UI renders correctly
- Dream entries are being loaded into the system (visible in window.dreamEntries, state.entries, etc.)
- The calendar shows indicators (dots/stars) only for a single day rather than all days with entries
- When indicators do appear, the count is incorrect
- Test entries (via createGuaranteedEntriesForCurrentMonth) display correctly, suggesting the display mechanism works

## Investigation Process

### Initial Diagnostics
- Added detailed logging throughout DateNavigator component
- Verified entries were being loaded into window.dreamEntries (confirmed ~80 entries)
- Confirmed entry dates were in expected format (YYYY-MM-DD)
- Metrics data (Sensory Detail, Emotional Recall, etc.) was being correctly extracted

### Attempts Made
1. **Method Access**: Called various functions directly via console:
   - window.oneiroMetricsPlugin.showDateNavigator()
   - window.oneiroMetricsPlugin.dateNavigator.dateNavigator.debugDisplay()
   - window.debugDateNavigator()

2. **Entry Forcing**: Created methods to bypass normal entry loading:
   - forceDreamEntries(entries) - to directly inject entries
   - createGuaranteedEntriesForCurrentMonth() - to generate test entries
   
3. **DOM Manipulation**: Attempted direct DOM operations:
   - Created containers manually
   - Initialized components with known-good parameters
   - Added test entries directly to window.dreamEntries

4. **Date Parsing**: Enhanced date parsing logic:
   - Implemented a more robust parseEntryDate method
   - Added support for multiple date formats
   - Added extensive logging of date parsing results

5. **Table Extraction**: Attempted to extract entries directly from UI tables:
   - Scanned for .oom-dream-row elements
   - Extracted dates, titles, and metrics
   - Created entry objects from extracted data

### Current Workaround
The current solution is to:
1. Show test entries instead of real entries for visualization purposes
2. Hide the debug ribbon button from the UI
3. Keep the debug functionality accessible via console (window.oneiroMetricsPlugin.debugDateNavigator())

## Root Cause Analysis
The root cause appears to be architectural. The investigation revealed:

1. **Complex Data Flow**: The entry data flows through multiple components with unclear ownership:
   - window.dreamEntries global object
   - state.entries in the plugin state
   - this.dreamEntries in the DateNavigator component
   - Direct extraction from DOM elements

2. **Inconsistent Date Handling**: Multiple date formats and parsing methods across the codebase:
   - Some places use YYYY-MM-DD
   - Others use Date objects
   - Some rely on dateKey strings with different formats

3. **Component Coupling**: The DateNavigator depends on many external state sources:
   - Tightly coupled to the global window object
   - Depends on the plugin state structure
   - References DOM elements directly

4. **File Size/Complexity**: The main.ts file is over 5000 lines with many responsibilities:
   - UI components
   - Data processing
   - State management
   - Event handling
   - Plugin lifecycle

## Recommended Next Steps

### Short-term
1. **Continue with refactoring plans**: Complete the architectural refactoring before revisiting this issue
2. **Keep using test data**: The current approach of showing test data is sufficient for development

### Medium-term (post-refactoring)
1. **Establish clear data flow**: Create a single source of truth for entry data
2. **Standardize date handling**: Use consistent date formats and parsing methods
3. **Implement proper component isolation**: Remove global state dependencies
4. **Add proper tests**: Create unit tests for date parsing and entry display

### Long-term architectural considerations
1. **Web Worker Architecture**: Consider implementing a Web Worker to manage entry data:
   - Central data management
   - Background processing
   - Clear API for components to request data

2. **Module Separation**: Split main.ts into focused modules:
   - UI components
   - Data processing
   - State management
   - Plugin lifecycle

3. **Event-based Communication**: Replace direct method calls with event-based architecture:
   - Components publish events when state changes
   - Other components subscribe to relevant events
   - Reduced coupling between components

## Conclusion
The DateNavigator display issue is symptomatic of broader architectural concerns in the codebase. While we've implemented a workable solution for now, addressing the root causes through refactoring will provide a more sustainable fix and prevent similar issues in the future.

The current implementation using test data provides a functional visualization of how the calendar should work. After completing the planned refactoring efforts, we'll be better positioned to implement a proper fix with cleaner architecture and more predictable behavior. 