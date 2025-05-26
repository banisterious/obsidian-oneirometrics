/**
 * Simple script to run the ContentParser parameter variation tests
 * 
 * This script runs the tests directly without needing a UI,
 * useful for testing ContentParser parameter variations in Obsidian.
 */

import { TestRunner } from './TestRunner';
import { registerContentParserParameterTests } from './ContentParserParameterTests';

/**
 * Run the ContentParser parameter tests
 * @returns A promise that resolves when tests are complete
 */
export async function runContentParserParameterTests(): Promise<void> {
  console.log('Running ContentParser parameter variation tests...');
  
  const testRunner = TestRunner.create();
  registerContentParserParameterTests(testRunner);
  
  const results = await testRunner.runTests();
  
  const passedCount = results.filter(r => r.passed).length;
  console.log(`ContentParser parameter tests complete: ${passedCount}/${results.length} tests passed`);
  
  // Log any failures
  results.filter(r => !r.passed).forEach(failure => {
    console.error(`Test failed: ${failure.name}`);
    if (failure.error) {
      console.error(failure.error);
    }
  });
}

// Run the tests directly when this script is executed
if (require.main === module) {
  runContentParserParameterTests()
    .then(() => {
      console.log('ContentParser parameter tests execution complete');
    })
    .catch(error => {
      console.error('Error running ContentParser parameter tests:', error);
    });
} 