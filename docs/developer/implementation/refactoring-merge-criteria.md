# OneiroMetrics TypeScript Refactoring Merge Criteria

## Table of Contents
- [Overview](#overview)
- [Core Test Completion Requirements](#core-test-completion-requirements)
- [Testing Priority Sequence](#testing-priority-sequence)
- [Test Validation Process](#test-validation-process)
- [Merge Approval Process](#merge-approval-process)
- [Post-Merge Verification](#post-merge-verification)

## Overview

This document outlines the criteria for merging the TypeScript refactoring branch back to the main branch. Instead of using a time-based approach, we've adopted a test-completion-based approach to ensure the refactored code meets quality standards before merging.

## Core Test Completion Requirements

The following core test requirements must be met before the refactoring branch can be merged to main:

### 1. Settings System Verification
- [ ] All settings persistence tests pass
- [ ] Settings migration tests from previous versions pass
- [ ] Settings adaptation via adaptSettingsToCore verified
- [ ] Default values application works correctly
- [ ] All settings UI components render and function properly
- [ ] Settings helper functions pass all tests

### 2. Basic Scraping Functionality
- [ ] Scrape functionality works in both notes and folder modes
- [ ] Progress reporting during scraping is accurate
- [ ] Metrics extraction works correctly
- [ ] Batch processing for large datasets functions properly
- [ ] Error handling during scraping is appropriate

### 3. Metrics Tables Generation
- [ ] Summary metrics table generates correctly
- [ ] Detailed metrics table renders correctly
- [ ] All metrics calculations are accurate
- [ ] Table sorting and filtering work as expected
- [ ] Lazy loading for large datasets functions properly

### 4. Basic Filters
- [ ] Date range filtering works correctly
- [ ] Custom date filters function properly
- [ ] Metric value filtering works as expected
- [ ] Filter combinations produce correct results
- [ ] Filter UI components render and function properly

## Testing Priority Sequence

Tests will be conducted in the following sequence of priority:

1. **Settings Interface**
   - Core settings storage and retrieval
   - Settings UI components
   - Settings migration

2. **Basic Scraping**
   - File and folder scraping
   - Metrics extraction
   - Progress reporting

3. **Metrics Tables**
   - Table generation
   - Data display
   - Performance with large datasets

4. **Basic Filters**
   - Date filtering
   - Metrics filtering
   - UI components

Additional features will be tested after these core components are verified.

## Test Validation Process

Each test area will be validated using the following process:

1. **Automated Testing**
   - Run unit tests where available
   - Document test coverage and results

2. **Manual Testing**
   - Follow test plans in the testing documentation
   - Document test steps and outcomes
   - Include screenshots or recordings of functionality

3. **Edge Case Verification**
   - Test with boundary conditions
   - Test with unexpected inputs
   - Verify error handling

## Merge Approval Process

1. **Test Completion Report**
   - Document results of all core tests
   - Note any remaining minor issues
   - Provide evidence of test passage

2. **Code Review**
   - Complete final code review of critical components
   - Verify TypeScript errors have been addressed
   - Check for any remaining code quality issues

3. **Approval Sign-off**
   - Obtain sign-off from project maintainers
   - Document approval in the merge request

## Post-Merge Verification

After merging to main:

1. **Deployment Verification**
   - Verify the plugin builds correctly from main
   - Test installation in a clean Obsidian vault
   - Verify all core functionality works in production

2. **Monitoring**
   - Monitor for any regression issues
   - Track performance metrics
   - Address any critical issues immediately

3. **Cleanup**
   - Follow the post-refactoring cleanup checklist
   - Archive refactoring-specific documentation
   - Remove temporary compatibility code as appropriate

## Conclusion

This test-completion-based approach ensures that the refactored codebase meets quality standards before being merged to the main branch. The focus on core functionality first ensures that the most critical aspects of the plugin work correctly, while less frequently used features can be addressed in subsequent updates if necessary. 