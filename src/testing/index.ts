/**
 * Index file for the testing module
 * 
 * This file exports all test registration functions and utilities.
 */

import { TestRunner } from './TestRunner';
import { registerUIComponentTests } from './UIComponentTests';
import { registerSelectionModeHelperTests } from './utils/SelectionModeHelpersTests';
import { registerSettingsHelpersTests } from './utils/SettingsHelpersTests';
import { registerMetricHelpersTests } from './utils/MetricHelpersTests';
import { registerTypeGuardsTests } from './utils/TypeGuardsTests';

/**
 * Registers all tests with the test runner
 * @param testRunner The test runner to register tests with
 */
export function registerAllTests(testRunner: TestRunner): void {
  // Register UI component tests
  registerUIComponentTests(testRunner);
  
  // Register utility tests
  registerSelectionModeHelperTests(testRunner);
  registerSettingsHelpersTests(testRunner);
  registerMetricHelpersTests(testRunner);
  registerTypeGuardsTests(testRunner);
  
  // Add other test registration functions here as they are implemented
}

/**
 * Creates a test runner with all tests registered
 * @returns A test runner with all tests registered
 */
export function createTestRunner(): TestRunner {
  const testRunner = TestRunner.create();
  registerAllTests(testRunner);
  return testRunner;
}

/**
 * Runs all tests and returns the results
 * @returns A promise that resolves when all tests have completed
 */
export async function runAllTests(): Promise<void> {
  console.log('Running all tests...');
  
  const testRunner = createTestRunner();
  const results = await testRunner.runTests();
  
  const passedCount = results.filter(r => r.passed).length;
  console.log(`All tests complete: ${passedCount}/${results.length} tests passed`);
  
  // Log any failures
  results.filter(r => !r.passed).forEach(failure => {
    console.error(`Test failed: ${failure.name}`);
    if (failure.error) {
      console.error(failure.error);
    }
  });
}

// Export test runner and individual test registration functions
export { TestRunner };
export { registerUIComponentTests };
export { registerSelectionModeHelperTests };
export { registerSettingsHelpersTests };
export { registerMetricHelpersTests };
export { registerTypeGuardsTests };
export { runSettingsHelpersTests } from './utils/SettingsHelpersTests';
export { runMetricHelpersTests } from './utils/MetricHelpersTests';
export { runSelectionModeHelperTests } from './utils/SelectionModeHelpersTests';
export { runTypeGuardsTests } from './utils/TypeGuardsTests';
export { runPropertyHelpersTests } from './utils/PropertyHelpersTests'; 