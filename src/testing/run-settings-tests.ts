/**
 * Simple script to run the settings helper tests
 * 
 * This script runs the tests directly without needing a UI,
 * useful during development while the TestRunnerModal is being built.
 */

import { runSettingsHelpersTests } from './utils/SettingsHelpersTests';

// Run the tests
runSettingsHelpersTests()
  .then(() => {
    console.log('Settings helper tests complete');
  })
  .catch(error => {
    console.error('Error running settings helper tests:', error);
  }); 