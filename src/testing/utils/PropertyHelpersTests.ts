/**
 * Unit tests for property-helpers.ts
 * 
 * These tests verify the proper functionality of all helper functions
 * for safely accessing and modifying properties with compatibility support.
 */

import { 
  getPropertyValue,
  setPropertyValue,
  createPropertyProxy,
  createCompatibleObject,
  applyPropertyDefaults,
  extractMetricValue
} from '../../utils/property-helpers';
import { TestRunner } from '../TestRunner';

/**
 * Registers all property helper tests with the test runner
 * @param testRunner The test runner to register tests with
 */
export function registerPropertyHelpersTests(
  testRunner: TestRunner
): void {
  // Test: getPropertyValue functionality
  testRunner.addTest(
    'Property Helpers - getPropertyValue correctly handles direct properties',
    () => {
      // Test with direct property
      const testObj = { name: 'Test', value: 42 };
      
      return (
        getPropertyValue(testObj, 'name') === 'Test' &&
        getPropertyValue(testObj, 'value') === 42 &&
        getPropertyValue(testObj, 'missing', 'default') === 'default'
      );
    }
  );
  
  // Test: getPropertyValue with compatible properties
  testRunner.addTest(
    'Property Helpers - getPropertyValue correctly handles compatible properties',
    () => {
      // Test with compatible properties
      const testObj = { 
        projectNote: '/path/to/note.md',
        maxLogSize: 1024
      };
      
      return (
        // Legacy property name retrieves modern value
        getPropertyValue(testObj, 'projectNotePath') === '/path/to/note.md' &&
        // Modern property name retrieves legacy value
        getPropertyValue(testObj, 'maxSize') === 1024
      );
    }
  );
  
  // Test: getPropertyValue with nested properties
  testRunner.addTest(
    'Property Helpers - getPropertyValue correctly handles nested properties',
    () => {
      // Test with nested properties
      const testObj = { 
        logging: { 
          maxSize: 2048,
          level: 'info'
        },
        uiState: {
          lastTab: 'metrics'
        }
      };
      
      return (
        getPropertyValue(testObj, 'logging.maxSize') === 2048 &&
        getPropertyValue(testObj, 'logging.level') === 'info' &&
        // Compatible nested property
        getPropertyValue(testObj, 'uiState.activeTab') === 'metrics' &&
        // Missing nested property
        getPropertyValue(testObj, 'missing.property', 'not found') === 'not found'
      );
    }
  );
  
  // Test: setPropertyValue functionality
  testRunner.addTest(
    'Property Helpers - setPropertyValue correctly sets direct properties',
    () => {
      // Test direct property setting
      const testObj = { name: 'Test' };
      
      setPropertyValue(testObj, 'name', 'Updated');
      setPropertyValue(testObj, 'value', 100);
      
      return (
        testObj.name === 'Updated' &&
        (testObj as any).value === 100
      );
    }
  );
  
  // Test: setPropertyValue with compatible properties
  testRunner.addTest(
    'Property Helpers - setPropertyValue correctly sets compatible properties',
    () => {
      // Test with compatible properties
      const testObj: Record<string, any> = {};
      
      setPropertyValue(testObj, 'projectNote', '/path/to/note.md');
      setPropertyValue(testObj, 'maxSize', 1024);
      
      return (
        // Modern property is set
        testObj.projectNote === '/path/to/note.md' &&
        // Legacy property is also set
        testObj.projectNotePath === '/path/to/note.md' &&
        // Modern property is set
        testObj.maxSize === 1024 &&
        // Legacy property is also set
        testObj.maxLogSize === 1024
      );
    }
  );
  
  // Test: setPropertyValue with nested properties
  testRunner.addTest(
    'Property Helpers - setPropertyValue correctly sets nested properties',
    () => {
      // Test with nested properties
      const testObj: Record<string, any> = {};
      
      setPropertyValue(testObj, 'logging.maxSize', 2048);
      setPropertyValue(testObj, 'uiState.activeTab', 'metrics');
      
      return (
        // Nested property is set
        testObj.logging?.maxSize === 2048 &&
        // Also sets compatible nested property
        testObj.logging?.maxLogSize === 2048 &&
        // Nested property is set
        testObj.uiState?.activeTab === 'metrics' &&
        // Also sets compatible nested property
        testObj.uiState?.lastTab === 'metrics'
      );
    }
  );
  
  // Test: createPropertyProxy functionality
  testRunner.addTest(
    'Property Helpers - createPropertyProxy correctly handles property access',
    () => {
      // Test with property proxy
      const testObj = { 
        projectNote: '/path/to/note.md',
        logging: { maxSize: 2048 }
      };
      
      const proxy = createPropertyProxy(testObj);
      
      return (
        // Access by modern property name
        proxy.projectNote === '/path/to/note.md' &&
        // Access by legacy property name
        (proxy as any).projectNotePath === '/path/to/note.md' &&
        // Access nested property
        (proxy as any).logging.maxSize === 2048
      );
    }
  );
  
  // Test: createPropertyProxy with property setting
  testRunner.addTest(
    'Property Helpers - createPropertyProxy correctly handles property setting',
    () => {
      // Test with property proxy
      const testObj: Record<string, any> = {};
      
      const proxy = createPropertyProxy(testObj);
      
      // Set property through proxy
      (proxy as any).projectNote = '/path/to/note.md';
      (proxy as any).logging = { maxSize: 2048 };
      
      return (
        // Modern property is set
        testObj.projectNote === '/path/to/note.md' &&
        // Legacy property is also set
        testObj.projectNotePath === '/path/to/note.md' &&
        // Nested property is set
        testObj.logging?.maxSize === 2048
      );
    }
  );
  
  // Test: createCompatibleObject functionality
  testRunner.addTest(
    'Property Helpers - createCompatibleObject correctly synchronizes properties',
    () => {
      // Test with object having only some properties
      const testObj = { 
        projectNote: '/path/to/note.md',
        showTestRibbonButton: true,
        logging: { maxSize: 2048 }
      };
      
      const compatibleObj = createCompatibleObject(testObj);
      
      return (
        // Original property is preserved
        compatibleObj.projectNote === '/path/to/note.md' &&
        // Compatible property is added
        (compatibleObj as any).projectNotePath === '/path/to/note.md' &&
        // Original property is preserved
        (compatibleObj as any).showTestRibbonButton === true &&
        // Compatible property is added
        (compatibleObj as any).showRibbonButtons === true &&
        // Nested properties are preserved
        (compatibleObj as any).logging.maxSize === 2048
      );
    }
  );
  
  // Test: applyPropertyDefaults functionality
  testRunner.addTest(
    'Property Helpers - applyPropertyDefaults correctly applies defaults',
    () => {
      // Test with partial object
      const testObj = { 
        name: 'Test',
        showRibbonButtons: true
      };
      
      const defaults = {
        name: 'Default',
        value: 42,
        projectNote: '/default/path.md',
        showRibbonButtons: false
      };
      
      const result = applyPropertyDefaults(testObj, defaults);
      
      return (
        // Existing property is not overwritten
        result.name === 'Test' &&
        // Missing property is added from defaults
        (result as any).value === 42 &&
        // Missing property is added from defaults
        (result as any).projectNote === '/default/path.md' &&
        // Compatible property is also added
        (result as any).projectNotePath === '/default/path.md' &&
        // Existing property is not overwritten
        (result as any).showRibbonButtons === true
      );
    }
  );
  
  // Test: extractMetricValue functionality
  testRunner.addTest(
    'Property Helpers - extractMetricValue correctly extracts from different formats',
    () => {
      // Test with different metric formats
      const directMetric = { Words: 100 };
      const metricsObj = { metrics: { Words: 200 } };
      const legacyMetric = { wordCount: 300 };
      const compatibleMetric = { min: 5 };
      const emptyObj = {};
      
      return (
        // Direct property access
        extractMetricValue(directMetric, 'Words') === 100 &&
        // Metrics object format
        extractMetricValue(metricsObj, 'Words') === 200 &&
        // Legacy wordCount format
        extractMetricValue(legacyMetric, 'Words') === 300 &&
        // Compatible property name
        extractMetricValue(compatibleMetric, 'minValue') === 5 &&
        // Missing property with default
        extractMetricValue(emptyObj, 'Words', 999) === 999
      );
    }
  );
}

/**
 * Runs the property helpers tests
 * @returns A promise that resolves when tests are complete
 */
export function runPropertyHelpersTests(): Promise<void> {
  console.log('Running property helper tests...');
  
  const testRunner = TestRunner.create();
  registerPropertyHelpersTests(testRunner);
  
  return testRunner.runTests()
    .then(results => {
      const passedCount = results.filter(r => r.passed).length;
      console.log(`Property helper tests complete: ${passedCount}/${results.length} tests passed`);
      
      // Log any failures
      results.filter(r => !r.passed).forEach(failure => {
        console.error(`Test failed: ${failure.name}`);
        if (failure.error) {
          console.error(failure.error);
        }
      });
    });
} 