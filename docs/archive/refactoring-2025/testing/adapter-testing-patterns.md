# Adapter Testing Patterns

## Overview

This document outlines the established testing patterns for the permanent adapter helper utilities in the OneiroMetrics plugin. Following the TypeScript refactoring in 2025, these utilities form a critical layer in the plugin architecture and require comprehensive testing to ensure reliability and backward compatibility.

## Testing Philosophy

Our adapter testing philosophy is built on these principles:

1. **Comprehensive Testing**: Every exported function must be tested with various input scenarios.
2. **Edge Case Coverage**: Tests should include normal use cases, edge cases, and invalid inputs.
3. **Bidirectional Compatibility**: Test both forward and backward compatibility between legacy and new interfaces.
4. **Documentation Through Tests**: Tests serve as living documentation of expected behavior.
5. **Integration Validation**: Adapters must be tested as part of the larger system.

## Established Test Pattern

For each adapter module, we follow this structured test pattern:

1. **Test Registration**: Each adapter module has a `register[ModuleName]Tests` function.
2. **Individual Function Tests**: Each exported function has dedicated test cases.
3. **Test Organization**: Tests are grouped by function and scenario type.
4. **Command Integration**: Each test suite has a corresponding Obsidian command for easy testing.
5. **Feedback Mechanism**: Test results are displayed in the console and via notifications.

### Example Test Structure

```typescript
/**
 * Registers all module tests with the test runner
 * @param testRunner The test runner to register tests with
 */
export function registerModuleTests(testRunner: TestRunner): void {
  // Group 1: Test function A
  testRunner.addTest('Module - Function A handles normal input', () => {
    // Test implementation
    return true; // or false if the test fails
  });
  
  testRunner.addTest('Module - Function A handles edge cases', () => {
    // Test implementation
    return true;
  });
  
  // Group 2: Test function B
  // ...more tests
}

/**
 * Runs all module tests and returns results
 * @returns Promise resolving to test results
 */
export async function runModuleTests(): Promise<TestResults> {
  const testRunner = new TestRunner();
  registerModuleTests(testRunner);
  return await testRunner.runTests();
}
```

## Tested Adapter Modules

The following adapter modules have been tested using this pattern:

### 1. Settings Helpers (`settings-helpers.ts`)

- **Purpose**: Safely access settings properties across different versions.
- **Test Coverage**: 16 tests covering property access, defaults, and bidirectional compatibility.
- **Key Test Cases**:
  - Legacy property access
  - Default values when properties are missing
  - Property type conversion
  - Bidirectional synchronization

### 2. Metric Helpers (`metric-helpers.ts`)

- **Purpose**: Process metrics data and perform calculations.
- **Test Coverage**: 11 tests covering metric creation, aggregation, and formatting.
- **Key Test Cases**:
  - Metric creation and validation
  - Aggregation methods (sum, average, min, max, median, mode)
  - Property adaptation
  - Edge cases with empty or invalid metrics

### 3. Selection Mode Helpers (`selection-mode-helpers.ts`)

- **Purpose**: Handle selection mode preferences and conversions.
- **Test Coverage**: 9 tests covering mode validation, conversion, and defaults.
- **Key Test Cases**:
  - Mode validation
  - Default selection
  - Conversion between string and enum representations
  - Legacy mode handling

### 4. Type Guards (`type-guards.ts`)

- **Purpose**: Validate types at runtime and provide type-safe operations.
- **Test Coverage**: 10 tests covering type checking and validation.
- **Key Test Cases**:
  - Object source validation
  - Source file and ID extraction
  - Source creation
  - Callout metadata validation
  - Promise detection

## Integration with Test Framework

All adapter tests are integrated with the OneiroMetrics testing framework:

1. **Test Registration**: Each module's tests are registered in `src/testing/index.ts`.
2. **Command Palette Integration**: Tests can be run directly from Obsidian's command palette.
3. **Visual Feedback**: Test results are displayed via notifications and detailed in the console.
4. **Automation Capability**: Tests can be run programmatically or through development tools.

## Best Practices for New Adapter Tests

When creating tests for new adapter utilities, follow these guidelines:

1. **Start with Function Analysis**: Understand all parameters, return values, and behaviors.
2. **Create Test Categories**: Group tests by function and scenario type.
3. **Test Normal Cases First**: Establish that basic functionality works as expected.
4. **Add Edge Cases**: Test boundary conditions, empty values, and invalid inputs.
5. **Test Integration**: Verify adapter functions work correctly with real components.
6. **Document Expected Behavior**: Use descriptive test names that explain expected outcomes.
7. **Ensure Independence**: Each test should be independent and not rely on other tests.

## Conclusion

The comprehensive testing patterns established for our adapter utilities ensure reliability, correctness, and backward compatibility. These tests not only verify functionality but also serve as documentation of expected behavior, making the codebase more maintainable and facilitating future development.

By adhering to these testing patterns, we can continue to evolve the OneiroMetrics plugin while ensuring stability for our users. 