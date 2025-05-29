import { TestRunner } from './TestRunner';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricData } from '../types/core';
import { getLogger } from '../logging';

/**
 * Registers tests for the DreamMetricsState class
 * 
 * @param testRunner The test runner to register tests with
 */
export function registerDreamMetricsStateTests(
  testRunner: TestRunner
): void {
  // Test: Constructor initialization with SettingsAdapter
  testRunner.addTest(
    'DreamMetricsState - should initialize with SettingsAdapter',
    async () => {
      // Create with partial settings
      const state = new DreamMetricsState({
        projectNote: 'test-project',
        selectionMode: 'folder'
      });
      
      // Verify settings were adapted and converted to core settings
      const settings = state.getSettings();
      const adapter = state.getSettingsAdapter();
      
      return (
        settings.projectNote === 'test-project' &&
        settings.selectionMode === 'folder' &&
        adapter !== undefined &&
        typeof settings.metrics === 'object'
      );
    }
  );
  
  // Test: Expanded states management
  testRunner.addTest(
    'DreamMetricsState - should manage expanded states',
    async () => {
      // Create with predefined expanded states
      const state = new DreamMetricsState({
        expandedStates: {
          'section1': true,
          'section2': false
        }
      });
      
      // Verify initial expanded states were loaded
      const initialSection1 = state.getExpandedState('section1');
      const initialSection2 = state.getExpandedState('section2');
      const initialSection3 = state.getExpandedState('section3'); // Not in initial state
      
      // Toggle states
      state.toggleExpandedState('section2', true);
      state.toggleExpandedState('section3', true);
      
      // Verify states were updated
      const updatedSection2 = state.getExpandedState('section2');
      const updatedSection3 = state.getExpandedState('section3');
      
      // Verify settings were updated
      const settings = state.getSettings();
      
      return (
        initialSection1 === true &&
        initialSection2 === false &&
        initialSection3 === false &&
        updatedSection2 === true &&
        updatedSection3 === true &&
        settings.expandedStates?.section2 === true &&
        settings.expandedStates?.section3 === true
      );
    }
  );
  
  // Test: Metrics management
  testRunner.addTest(
    'DreamMetricsState - should manage metrics correctly',
    async () => {
      // Create empty state
      const state = new DreamMetricsState();
      
      // Update metrics
      const testMetrics = {
        'clarity': {
          name: 'Clarity',
          icon: 'sun',
          minValue: 1,
          maxValue: 5,
          enabled: true
        }
      };
      
      state.updateMetrics(testMetrics);
      
      // Verify metrics were updated
      const metrics = state.getMetrics();
      
      // Verify settings were updated
      const settings = state.getSettings();
      
      return (
        metrics.clarity?.name === 'Clarity' &&
        settings.metrics?.clarity?.name === 'Clarity'
      );
    }
  );
  
  // Test: Dream entries management
  testRunner.addTest(
    'DreamMetricsState - should manage dream entries',
    async () => {
      const state = new DreamMetricsState();
      
      // Update dream entries with proper DreamMetricData structure
      const entries: DreamMetricData[] = [
        { 
          date: '2025-05-26',
          title: 'Test Dream',
          content: 'This is a test dream content',
          source: 'test-file.md',
          metrics: {
            'clarity': 4
          }
        }
      ];
      
      state.updateDreamEntries(entries);
      
      // Verify entries were updated
      const dreamEntries = state.getDreamEntries();
      
      return (
        dreamEntries.length === 1 &&
        dreamEntries[0].date === '2025-05-26' &&
        dreamEntries[0].metrics.clarity === 4
      );
    }
  );
  
  // Test: Settings update
  testRunner.addTest(
    'DreamMetricsState - should update settings correctly',
    async () => {
      const state = new DreamMetricsState({
        projectNote: 'initial-project',
        selectionMode: 'notes'
      });
      
      // Update settings
      state.updateSettings({
        projectNote: 'updated-project',
        backupEnabled: true
      });
      
      // Verify settings were updated
      const settings = state.getSettings();
      
      return (
        settings.projectNote === 'updated-project' &&
        settings.selectionMode === 'notes' && // Preserved
        settings.backupEnabled === true // Added
      );
    }
  );
  
  // Test: Listener notification
  testRunner.addTest(
    'DreamMetricsState - should notify listeners on changes',
    async () => {
      const state = new DreamMetricsState();
      
      // Track number of notifications
      let notificationCount = 0;
      
      // Subscribe to changes
      const unsubscribe = state.subscribe(() => {
        notificationCount++;
      });
      
      // Make various changes
      state.toggleExpandedState('section1', true);
      state.updateMetrics({ 'test': { name: 'Test', icon: 'test', minValue: 1, maxValue: 5, enabled: true } });
      
      // Create a valid DreamMetricData object
      const entries: DreamMetricData[] = [{ 
        date: '2025-05-26', 
        title: 'Test Dream',
        content: 'Dream content',
        source: 'test-file.md',
        metrics: {}
      }];
      
      state.updateDreamEntries(entries);
      state.updateSettings({ projectNote: 'new-project' });
      
      // Clean up
      unsubscribe();
      
      // Verify listener was notified for each change
      return notificationCount === 4;
    }
  );
}

/**
 * Runs the DreamMetricsState tests directly
 * Used by the Obsidian command palette
 * @returns A promise that resolves when all tests have completed
 */
export async function runDreamMetricsStateTests(): Promise<void> {
  const logger = getLogger('DreamMetricsStateTests');
  logger.info('Test', 'Running DreamMetricsState tests...');
  
  const testRunner = TestRunner.create();
  registerDreamMetricsStateTests(testRunner);
  const results = await testRunner.runTests();
  
  const passedCount = results.filter(r => r.passed).length;
  logger.info('Test', `DreamMetricsState tests complete: ${passedCount}/${results.length} tests passed`);
  
  // Log any failures
  results.filter(r => !r.passed).forEach(failure => {
    logger.error('Test', `Test failed: ${failure.name}`);
    if (failure.error) {
      logger.error('Test', 'Error details:', failure.error);
    }
  });
  
  return Promise.resolve();
} 