# OneiroMetrics Testing Documentation

## Table of Contents
- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Test Plan Structure](#test-plan-structure)
- [Test Plan Index](#test-plan-index)
  - [Core Components](#core-components)
  - [Feature Areas (Planned)](#feature-areas-planned)
- [Testing Tools and Utilities](#testing-tools-and-utilities)
- [Test Result Documentation](#test-result-documentation)
- [Integration with Development Process](#integration-with-development-process)
- [Collaborative Testing Protocol](#collaborative-testing-protocol)
- [Merge Criteria](#merge-criteria)
- [Additional Resources](#additional-resources)

## Overview

This directory contains comprehensive testing documentation for the OneiroMetrics plugin following the 2025 TypeScript refactoring effort. The testing documentation is organized by component and feature area, with each document providing detailed test plans, approaches, and expected outcomes.

## Testing Philosophy

The OneiroMetrics testing strategy follows these key principles:

1. **Comprehensive Coverage**: Test all critical functionality across the system
2. **Tiered Approach**: Balance automated tests with systematic manual verification
3. **User-Centric**: Focus on validating user-facing functionality and workflows
4. **Cross-Platform**: Verify functionality across operating systems and environments
5. **Edge Case Awareness**: Test boundary conditions and error scenarios thoroughly

## Test Plan Structure

Each test plan in this directory follows a consistent structure:

1. **Overview**: Purpose and scope of the test plan
2. **Test Environment Requirements**: Required setup and resources
3. **Test Categories**: Specific test cases organized by feature area
4. **Test Execution Plan**: Phased approach to testing
5. **Test Data Requirements**: Sample data needed for testing
6. **Expected Results Documentation**: How test results should be documented
7. **Issues and Defect Tracking**: Process for documenting and prioritizing issues
8. **Test Schedule**: Timeline for test execution
9. **Success Criteria**: Measurable outcomes that define testing success

## Test Plan Index

### Core Components

1. [Settings Component Test Plan](./settings-test-plan.md)
   - Settings initialization, persistence, adaptation, and UI tests
   - Helper function verification
   - Migration and integration testing

2. [Dream Journal Management Test Plan](./journal-management-test-plan.md)
   - Journal entry creation and editing
   - Structure validation
   - Template system
   - Navigation and analytics

### Feature Areas (Planned)

3. Date Navigation Test Plan
   - Calendar interface
   - Date selection
   - Navigation controls
   - Date range handling

4. Metrics System Test Plan
   - Metrics calculation
   - Visualization
   - Custom metrics
   - Data export

5. Template System Test Plan
   - Template creation
   - Variable expansion
   - Templater integration
   - Template management

6. User Interface Test Plan
   - Modal components
   - Settings UI
   - Navigation controls
   - Responsive design

## Testing Tools and Utilities

The following tools and utilities support the testing process:

1. **Automated Testing**
   - Jest for unit testing
   - DOM testing utilities for UI component tests
   - Mock implementations for Obsidian API

2. **Manual Testing Aids**
   - Test vault generator
   - Sample journal entry creator
   - Performance monitoring utilities
   - Error injection tools

## Test Result Documentation

Test results should be documented in a structured format:

1. **Result Summary**: Overall pass/fail status with metrics
2. **Test Case Results**: Individual test case outcomes
3. **Issue Reports**: Detailed information about identified issues
4. **Environment Details**: Test environment configuration
5. **Evidence**: Screenshots, logs, and other supporting artifacts

## Integration with Development Process

Testing is integrated into the development workflow:

1. Unit tests run automatically on each build
2. Integration tests run before each pull request
3. Manual test cycles performed before each release
4. Regression testing after major bug fixes

## Collaborative Testing Protocol

To ensure thorough and efficient testing, a collaborative testing protocol has been established:

### Protocol Overview

1. **Guided Testing Flow**
   - Claude will prompt the user with specific test cases to run
   - Each test will include step-by-step instructions and expected outcomes
   - Tests will be performed in a logical sequence (basic functionality first, then edge cases)

2. **Test Execution and Documentation**
   - User executes each test in their Obsidian environment
   - User reports the actual outcome to Claude
   - Claude documents results and checks off completed tests
   - Any issues are noted with detailed information for later debugging

3. **Progress Tracking**
   - Each test plan includes checklists to mark completed tests
   - Tests are categorized by priority (High, Medium, Low)
   - The testing session focuses on high-priority items first
   - Summary of progress is maintained across testing sessions

### Testing Session Structure

A typical testing session follows this structure:

1. **Session Preparation**
   - Confirm testing environment readiness
   - Review test plan and prerequisites
   - Ensure necessary test data is available

2. **Incremental Testing**
   - Claude prompts user with next test from the checklist
   - User performs test and reports results
   - Claude records outcome and marks test as complete
   - Process repeats for each test in the current batch

3. **Issue Documentation**
   - For failed tests, Claude guides user to document:
     - Exact steps to reproduce
     - Expected vs. actual behavior
     - Any error messages or unexpected states
     - Environmental details

4. **Session Summary**
   - At the end of each session, Claude provides a summary:
     - Number of tests completed
     - Pass/fail statistics
     - Key issues identified
     - Plan for the next testing session

This collaborative approach ensures both thorough coverage and efficient use of testing resources, while maintaining detailed documentation of the process and results.

## Merge Criteria

The criteria for merging the TypeScript refactoring branch back to the main branch follows a test-completion-based approach rather than a time-based approach. This ensures that the refactored code meets quality standards before merging.

### Core Test Requirements

Before merging the refactoring branch to main, the following core areas must be thoroughly tested and verified:

1. **Settings System** - All settings functionality verified
2. **Basic Scraping** - File and folder scraping functionality verified
3. **Metrics Tables** - Table generation and display functionality verified
4. **Basic Filters** - Date and metrics filtering functionality verified

The detailed merge criteria, including specific test requirements and the approval process, are documented in [Refactoring Merge Criteria](../refactoring-merge-criteria.md).

## Additional Resources

- [TypeScript Migration Status](../typescript-migration-status.md)
- [Post-Refactoring Roadmap](../post-refactoring-roadmap.md)
- [Adapter Documentation](../../architecture/adapter-documentation-tasks.md) 