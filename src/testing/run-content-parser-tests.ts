/**
 * Simple script to run the ContentParser parameter variation tests
 * 
 * This script runs the tests directly without needing a UI,
 * useful for testing ContentParser parameter variations in Obsidian.
 */

import { TestRunner } from './TestRunner';
import { registerContentParserParameterTests } from './ContentParserParameterTests';
import { getLogger } from '../logging';

/**
 * Run the ContentParser parameter tests
 * @returns A promise that resolves when tests are complete
 */
export async function runContentParserParameterTests(): Promise<void> {
  const logger = getLogger('ContentParserTests');
  logger.info('Test', 'Running ContentParser parameter variation tests...');
  
  const testRunner = TestRunner.create();
  registerContentParserParameterTests(testRunner);
  
  const results = await testRunner.runTests();
  
  const passedCount = results.filter(r => r.passed).length;
  logger.info('Test', `ContentParser parameter tests complete: ${passedCount}/${results.length} tests passed`);
  
  // Log any failures
  results.filter(r => !r.passed).forEach(failure => {
    logger.error('Test', `Test failed: ${failure.name}`);
    if (failure.error) {
      logger.error('Test', 'Error details:', failure.error);
    }
  });
}

// Run the tests directly when this script is executed
if (require.main === module) {
  runContentParserParameterTests()
    .then(() => {
      const logger = getLogger('ContentParserTests');
      logger.info('Test', 'ContentParser parameter tests execution complete');
    })
    .catch(error => {
      const logger = getLogger('ContentParserTests');
      logger.error('Test', 'Error running ContentParser parameter tests:', error);
    });
} 