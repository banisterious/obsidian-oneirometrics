# Regression Testing for OneiroMetrics

This document outlines the regression testing strategy for the OneiroMetrics Obsidian plugin.

## What is Regression Testing?

Regression testing is a type of software testing that verifies that previously developed and tested software still performs correctly after it was changed or interfaced with other software. Changes may include software enhancements, patches, configuration changes, etc.

For OneiroMetrics, regression testing is essential to ensure that:

1. New features don't break existing functionality
2. Bug fixes don't introduce new issues
3. Refactoring doesn't alter expected behavior
4. UI changes maintain usability and accessibility

## Regression Testing Process

### 1. Baseline Establishment

Before implementing any significant changes:

- Run the full test suite in the TestRunnerModal
- Document the results, including all passing and failing tests
- Capture key UI screenshots for visual comparison
- Document current performance metrics using Developer Tools
- Note any existing known issues or limitations

### 2. Change Implementation

During implementation of new features or fixes:

- Follow the interface-first development approach
- Maintain all existing tests
- Add new tests for the changed functionality
- Update existing tests if expected behavior has intentionally changed

### 3. Post-Change Testing

After implementation:

- Run targeted tests for directly affected components
- Run relevant test categories that could be indirectly affected
- Compare performance metrics with baseline
- Verify that no new errors appear in the console

### 4. Full Regression Suite

Periodically, and before major releases:

- Run the complete test suite to verify end-to-end functionality
- Perform manual testing of core user journeys
- Verify compatibility with different Obsidian themes and settings
- Check performance on large datasets

## Automated vs Manual Regression Testing

### Automated Testing

The current automated test suite in TestRunnerModal covers:

- Content parsing and extraction
- State management
- Template functionality
- File operations
- Error handling
- Configuration management
- Basic UI component functionality

These automated tests should be run for all code changes.

### Manual Testing Checklist

Some aspects require manual verification:

1. **UI/UX Consistency**
   - Verify that UI elements maintain their appearance and positioning
   - Check that animations and transitions work smoothly
   - Ensure that modal dialogs appear and function correctly
   - Verify that table layouts remain consistent

2. **Interaction Testing**
   - Test keyboard navigation throughout the UI
   - Verify that drag-and-drop functionality works
   - Check that expanding/collapsing content works correctly
   - Test filter controls and sorting functionality

3. **Theme Compatibility**
   - Test with light and dark themes
   - Verify compatibility with popular community themes
   - Check high contrast mode support
   - Test with different font sizes and zoom levels

4. **Performance Testing**
   - Test with large journal datasets
   - Monitor memory usage during extended operations
   - Check CPU usage during filtering and sorting
   - Verify startup performance

## Regression Test Documentation

For each regression testing cycle, document:

1. **Test Environment**
   - Obsidian version
   - Plugin version
   - Operating system
   - Device type (desktop, mobile)
   - Test data characteristics

2. **Test Results**
   - Automated test pass/fail counts by category
   - Manual test checklist results
   - Performance metrics
   - Screen recordings or screenshots as needed

3. **Regressions Identified**
   - Description of regression
   - Steps to reproduce
   - Affected components
   - Severity assessment

4. **Recommendations**
   - Fixes for identified regressions
   - Improvements to test coverage
   - Performance optimization opportunities

## Implementation for OneiroMetrics

### Current Status

- [x] Base test infrastructure implemented
- [x] 52 passing tests across 8 categories
- [x] Manual testing procedures documented
- [ ] Automated regression testing framework
- [ ] Continuous integration setup
- [ ] Performance benchmarking baseline

### Next Steps

1. **Establish Performance Baselines**
   - Document loading times for various dataset sizes
   - Measure rendering performance for tables and components
   - Quantify memory usage patterns

2. **Create Standard Test Datasets**
   - Small dataset (10-20 entries)
   - Medium dataset (50-100 entries)
   - Large dataset (500+ entries)
   - Special case dataset (unusual formatting, edge cases)

3. **Implement Automated Regression Framework**
   - Create regression test script that runs all tests
   - Add comparison of results with baseline
   - Implement automatic reporting of regressions

4. **Continuous Integration**
   - Set up GitHub workflow for running tests
   - Add test runs on pull requests
   - Implement status checks before merging

## Handling Identified Regressions

When a regression is identified:

1. **Triage and Document**
   - Document the issue in ISSUES.md
   - Categorize by severity and impact
   - Add reproduction steps

2. **Root Cause Analysis**
   - Identify the change that caused the regression
   - Determine which components are affected
   - Understand the underlying cause

3. **Fix Implementation**
   - Implement a fix without breaking other functionality
   - Add a specific test to prevent future regressions
   - Document the fix approach

4. **Verification**
   - Run targeted tests for the fixed component
   - Run full regression suite to ensure no side effects
   - Verify on different environments if applicable

## Conclusion

Regression testing is a critical part of maintaining the quality and reliability of the OneiroMetrics plugin. By systematically testing existing functionality after changes, we can ensure that the plugin continues to meet user expectations while evolving with new features and improvements.

As the plugin grows in complexity, investing in robust regression testing will become increasingly important to manage the risk of changes and maintain a positive user experience. 