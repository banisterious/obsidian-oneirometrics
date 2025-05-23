# OneiroMetrics Testing Plan

This document outlines the comprehensive testing strategy for the OneiroMetrics plugin.

## Testing Philosophy

The testing approach for OneiroMetrics follows these key principles:

1. **Test-Driven Development**: Tests should be written before or alongside code implementation
2. **Comprehensive Coverage**: All critical functionality should be covered by automated tests
3. **Isolation**: Tests should be independent and not rely on external state
4. **Performance**: Tests should run quickly to encourage frequent execution
5. **Maintainability**: Tests should be easy to understand and maintain

## Test Infrastructure

OneiroMetrics implements a custom testing framework tailored to the Obsidian plugin environment:

![Test Infrastructure](../architecture/diagrams/test-infrastructure.png)

The testing infrastructure consists of:

### Test Framework Components

- **TestRunner**: Orchestrates test execution and result collection
- **TestRegistry**: Maintains registry of available tests
- **TestCase**: Base class for all test implementations
- **TestFixture**: Provides test environment and mock data
- **TestReporter**: Formats and presents test results

### User Interface

- **TestRunnerModal**: Provides UI for running tests and viewing results
- **TestResultView**: Displays formatted test results
- **TestCategorySelector**: Allows selecting test categories to run

### Mock Utilities

- **MockFileSystem**: Simulates file system operations
- **MockObsidianAPI**: Simulates Obsidian API behavior
- **MockServiceContainer**: Provides mock implementations of services

## Test Categories

Tests are organized into the following categories:

1. **Unit Tests**
   - Parser functionality
   - Individual service methods
   - Utility functions
   - State management

2. **Integration Tests**
   - Service interactions
   - Component with service interactions
   - State propagation

3. **UI Tests**
   - Component rendering
   - Event handling
   - User interactions

4. **End-to-End Tests**
   - Complete user workflows
   - Data persistence
   - Plugin initialization

## Test Data Flow

The flow of data through the testing system is outlined in this diagram:

![Test Data Flow](../architecture/diagrams/test-data-flow.png)

The typical test execution process:

1. Developer selects tests to run via TestRunnerModal
2. TestRunner retrieves tests from TestRegistry
3. For each test:
   - TestFixture creates isolated environment
   - Test case executes against the subject
   - Results are collected and verified
4. Results are formatted and displayed

## Test Implementation Guidelines

When implementing tests, follow these guidelines:

### 1. Test Naming

Use descriptive names in the format:
`test[FunctionName]_[Scenario]_[ExpectedResult]`

Example: `testParseDate_ValidFormat_ReturnsCorrectDate`

### 2. Test Structure

Each test should follow this structure:
```typescript
// Arrange: Set up the test environment and data
const testData = createMockData();
const subject = new ComponentUnderTest(mockDependencies);

// Act: Execute the functionality being tested
const result = subject.methodBeingTested(testData);

// Assert: Verify the expected outcome
assert.strictEqual(result, expectedResult);
```

### 3. Mock Dependencies

All external dependencies should be mocked:
```typescript
const mockFileService = {
  readFile: async (path) => mockFileContents,
  writeFile: async (path, contents) => true
};

const subject = new JournalService(mockFileService, otherMocks);
```

### 4. Test Isolation

Ensure each test is isolated:
- Reset mocks between tests
- Don't rely on global state
- Clean up after tests complete

## Regression Testing

A comprehensive regression testing process is documented in [Regression Testing](./regression-testing.md), which includes:

1. Baseline establishment
2. Change implementation testing
3. Post-change verification
4. Full regression suite execution

## Test Coverage Goals

The testing strategy aims for:

- **Unit Tests**: 90% code coverage
- **Integration Tests**: All service interactions covered
- **UI Tests**: All user-facing components tested
- **End-to-End Tests**: All critical user workflows validated

## Continuous Integration

When implementing CI, tests will be:
- Run automatically on pull requests
- Required to pass before merging
- Tracked over time for performance and coverage

## Performance Testing

In addition to functional testing, performance testing will measure:
- Plugin startup time
- Journal processing speed
- UI rendering performance
- Memory usage patterns

## Metrics and Reporting

Test metrics to be tracked include:
- Test pass/fail rate
- Code coverage percentage
- Test execution time
- Number of regression issues identified

## Manual Testing Requirements

Some aspects require manual testing:
- UI appearance across themes
- Accessibility features
- Performance on large vaults
- Mobile compatibility

## Future Test Improvements

Planned improvements to the testing infrastructure:
- Automated visual regression testing
- Performance benchmark automation
- Test data generation tools
- Improved test reporting

## Implementation Status

- [x] Test Runner Infrastructure
- [x] Content Parser Tests (7/7 passing)
- [x] State Management Tests (6/6 passing)
- [x] Template System Tests (3/3 passing)
- [x] File Operations Tests (3/3 passing)
- [x] Error Handling Tests (8/8 passing)
- [x] Edge Case Tests (8/8 passing)
- [x] Configuration Tests (4/4 passing)
- [x] UI Component Tests (9/9 passing)
- [ ] Automated Regression Testing (planned)
- [ ] Integration Testing (planned)
- [ ] Performance Benchmarking (planned)

## Conclusion

This testing plan provides a structured approach to ensuring the quality and reliability of the OneiroMetrics plugin. By implementing comprehensive testing practices, we can maintain a robust codebase while continuing to evolve the plugin's capabilities. 