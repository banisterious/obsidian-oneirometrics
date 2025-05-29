/**
 * Simple script to run the settings helper tests
 * 
 * This script runs the tests directly without needing a UI,
 * useful during development while the TestRunnerModal is being built.
 */

import { runSettingsHelpersTests } from './utils/SettingsHelpersTests';
import { getLogger } from '../logging';

// Create a logger
const logger = getLogger('SettingsTests');

// Run the tests
runSettingsHelpersTests()
  .then(() => {
    logger.info('Test', 'Settings helper tests complete');
  })
  .catch(error => {
    logger.error('Test', 'Error running settings helper tests:', error);
  }); 