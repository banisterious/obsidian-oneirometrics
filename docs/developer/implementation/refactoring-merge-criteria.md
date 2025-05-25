# OneiroMetrics TypeScript Refactoring Merge Criteria

## Table of Contents
- [Overview](#overview)
- [Core Test Completion Requirements](#core-test-completion-requirements)
- [Testing Priority Sequence](#testing-priority-sequence)
- [Test Validation Process](#test-validation-process)
- [Merge Approval Process](#merge-approval-process)
- [Post-Merge Verification](#post-merge-verification)

## Overview

This document outlines the criteria for merging the `refactoring/2025-typescript` branch back to the `main` branch. Instead of using a time-based approach, we've adopted a test-completion-based approach to ensure the refactored code meets quality standards before merging.

> **Note:** The `refactoring/2025-typescript` branch is the current active development branch for the TypeScript refactoring effort, superseding the earlier `refactoring/2025` branch.

## Core Test Completion Requirements

The following core test requirements must be met before the refactoring branch can be merged to main:

### 1. Settings System Verification
- [x] All settings persistence tests pass
- [x] Settings migration tests from previous versions pass
- [x] Settings adaptation via adaptSettingsToCore verified
- [x] Default values application works correctly
- [x] All settings UI components render and function properly
- [x] Settings helper functions pass all tests

### 2. Basic Scraping Functionality
- [x] Scrape functionality works in both notes and folder modes
- [x] Progress reporting during scraping is accurate
- [x] Metrics extraction works correctly
- [x] Batch processing for large datasets functions properly
- [x] Error handling during scraping is appropriate

### 3. Metrics Tables Generation
- [x] Summary metrics table generates correctly
- [x] Detailed metrics table renders correctly
- [x] All metrics calculations are accurate
- [x] Table sorting and filtering work as expected
- [x] Lazy loading for large datasets functions properly

### 4. Basic Filters
- [x] Date range filtering works correctly
- [x] Custom date filters function properly
- [ ] Metric value filtering works as expected
- [x] Filter combinations produce correct results
- [x] Filter UI components render and function properly

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