/**
 * Unit tests for type-guards.ts
 * 
 * These tests verify the proper functionality of all type guard functions
 * and related helper functions.
 */

import { DreamMetricData, DreamMetric } from '../../types/core';
import { CalloutMetadata } from '../../types/callout-types';
import { 
  isObjectSource,
  getSourceFile,
  getSourceId,
  createSource,
  isCalloutMetadataArray,
  getCalloutType,
  getCalloutId,
  isMetricEnabled,
  isCalloutMetadata,
  isPromise
} from '../../utils/type-guards';
import { TestRunner } from '../TestRunner';
import { getLogger } from '../../logging';

/**
 * Registers all type guard tests with the test runner
 * @param testRunner The test runner to register tests with
 */
export function registerTypeGuardsTests(
  testRunner: TestRunner
): void {
  const logger = getLogger('TypeGuardsTests');

  // Test: isObjectSource functionality
  testRunner.addTest(
    'Type Guards - isObjectSource correctly identifies object sources',
    () => {
      // Test with string source
      const stringSource = 'path/to/file.md';
      
      // Test with object source with just file
      const objectSourceFile = { file: 'path/to/file.md' };
      
      // Test with object source with file and id
      const objectSourceWithId = { file: 'path/to/file.md', id: '123' };
      
      // Test with null
      const nullSource = null as any;
      
      // Test with undefined
      const undefinedSource = undefined as any;
      
      return (
        isObjectSource(stringSource) === false &&
        isObjectSource(objectSourceFile) === true &&
        isObjectSource(objectSourceWithId) === true &&
        isObjectSource(nullSource) === false &&
        isObjectSource(undefinedSource) === false
      );
    }
  );
  
  // Test: getSourceFile functionality
  testRunner.addTest(
    'Type Guards - getSourceFile correctly extracts file path',
    () => {
      // Test with string source
      const entryWithStringSource: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {}
      };
      
      // Test with object source
      const entryWithObjectSource: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: { file: 'path/to/object/file.md' },
        metrics: {}
      };
      
      // Test with object source with id
      const entryWithObjectSourceAndId: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: { file: 'path/to/object/file/with/id.md', id: '123' },
        metrics: {}
      };
      
      // Test with empty object source (shouldn't happen but test anyway)
      const entryWithEmptyObjectSource: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: {} as any,
        metrics: {}
      };
      
      return (
        getSourceFile(entryWithStringSource) === 'path/to/file.md' &&
        getSourceFile(entryWithObjectSource) === 'path/to/object/file.md' &&
        getSourceFile(entryWithObjectSourceAndId) === 'path/to/object/file/with/id.md' &&
        getSourceFile(entryWithEmptyObjectSource) === ''
      );
    }
  );
  
  // Test: getSourceId functionality
  testRunner.addTest(
    'Type Guards - getSourceId correctly extracts source ID',
    () => {
      // Test with string source
      const entryWithStringSource: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {}
      };
      
      // Test with object source without id
      const entryWithObjectSource: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: { file: 'path/to/object/file.md' },
        metrics: {}
      };
      
      // Test with object source with id
      const entryWithObjectSourceAndId: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: { file: 'path/to/object/file.md', id: '123' },
        metrics: {}
      };
      
      // Test with empty object source
      const entryWithEmptyObjectSource: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: {} as any,
        metrics: {}
      };
      
      return (
        getSourceId(entryWithStringSource) === '' &&
        getSourceId(entryWithObjectSource) === '' &&
        getSourceId(entryWithObjectSourceAndId) === '123' &&
        getSourceId(entryWithEmptyObjectSource) === ''
      );
    }
  );
  
  // Test: createSource functionality
  testRunner.addTest(
    'Type Guards - createSource creates correct source format',
    () => {
      // Test with just file path
      const sourceWithJustFile = createSource('path/to/file.md');
      
      // Test with file path and id
      const sourceWithFileAndId = createSource('path/to/file.md', '123');
      
      // Test with empty string
      const sourceWithEmptyString = createSource('');
      
      // Test with empty string and id
      const sourceWithEmptyStringAndId = createSource('', '123');
      
      return (
        sourceWithJustFile === 'path/to/file.md' &&
        typeof sourceWithFileAndId === 'object' &&
        sourceWithFileAndId.file === 'path/to/file.md' &&
        sourceWithFileAndId.id === '123' &&
        sourceWithEmptyString === '' &&
        typeof sourceWithEmptyStringAndId === 'object' &&
        sourceWithEmptyStringAndId.file === '' &&
        sourceWithEmptyStringAndId.id === '123'
      );
    }
  );
  
  // Test: isCalloutMetadataArray functionality
  testRunner.addTest(
    'Type Guards - isCalloutMetadataArray correctly identifies arrays',
    () => {
      // Test with array of metadata
      const metadataArray: CalloutMetadata[] = [
        { type: 'dream' },
        { type: 'nightmare', id: '123' }
      ];
      
      // Test with single metadata object
      const singleMetadata: CalloutMetadata = { type: 'dream' };
      
      // Test with undefined
      const undefinedMetadata = undefined;
      
      // Test with null
      const nullMetadata = null as any;
      
      // Test with empty array
      const emptyArray: CalloutMetadata[] = [];
      
      return (
        isCalloutMetadataArray(metadataArray) === true &&
        isCalloutMetadataArray(singleMetadata) === false &&
        isCalloutMetadataArray(undefinedMetadata) === false &&
        isCalloutMetadataArray(nullMetadata) === false &&
        isCalloutMetadataArray(emptyArray) === true
      );
    }
  );
  
  // Test: getCalloutType functionality
  testRunner.addTest(
    'Type Guards - getCalloutType correctly extracts callout type',
    () => {
      // Test with array of metadata
      const entryWithMetadataArray: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {},
        calloutMetadata: [
          { type: 'dream' },
          { type: 'nightmare', id: '123' }
        ]
      };
      
      // Test with single metadata object
      const entryWithSingleMetadata: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {},
        calloutMetadata: { type: 'lucid' }
      };
      
      // Test with undefined metadata
      const entryWithUndefinedMetadata: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {}
      };
      
      // Test with empty array metadata
      const entryWithEmptyArrayMetadata: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {},
        calloutMetadata: []
      };
      
      return (
        getCalloutType(entryWithMetadataArray) === 'dream' &&
        getCalloutType(entryWithSingleMetadata) === 'lucid' &&
        getCalloutType(entryWithUndefinedMetadata) === undefined &&
        getCalloutType(entryWithEmptyArrayMetadata) === undefined
      );
    }
  );
  
  // Test: getCalloutId functionality
  testRunner.addTest(
    'Type Guards - getCalloutId correctly extracts callout ID',
    () => {
      // Test with array of metadata with ID
      const entryWithMetadataArrayId: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {},
        calloutMetadata: [
          { type: 'dream', id: 'dream-123' },
          { type: 'nightmare', id: 'nightmare-456' }
        ]
      };
      
      // Test with array of metadata without ID
      const entryWithMetadataArrayNoId: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {},
        calloutMetadata: [
          { type: 'dream' },
          { type: 'nightmare' }
        ]
      };
      
      // Test with single metadata object with ID
      const entryWithSingleMetadataId: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {},
        calloutMetadata: { type: 'lucid', id: 'lucid-789' }
      };
      
      // Test with single metadata object without ID
      const entryWithSingleMetadataNoId: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {},
        calloutMetadata: { type: 'lucid' }
      };
      
      // Test with undefined metadata
      const entryWithUndefinedMetadata: DreamMetricData = {
        date: '2025-01-01',
        title: 'Test Dream',
        content: 'Test content',
        source: 'path/to/file.md',
        metrics: {}
      };
      
      return (
        getCalloutId(entryWithMetadataArrayId) === 'dream-123' &&
        getCalloutId(entryWithMetadataArrayNoId) === undefined &&
        getCalloutId(entryWithSingleMetadataId) === 'lucid-789' &&
        getCalloutId(entryWithSingleMetadataNoId) === undefined &&
        getCalloutId(entryWithUndefinedMetadata) === undefined
      );
    }
  );
  
  // Test: isMetricEnabled functionality
  testRunner.addTest(
    'Type Guards - isMetricEnabled correctly determines if metric is enabled',
    () => {
      // Test with enabled metric
      const enabledMetric: DreamMetric = {
        name: 'Enabled Metric',
        icon: 'check',
        minValue: 1,
        maxValue: 5,
        enabled: true
      };
      
      // Test with disabled metric
      const disabledMetric: DreamMetric = {
        name: 'Disabled Metric',
        icon: 'x',
        minValue: 1,
        maxValue: 5,
        enabled: false
      };
      
      // Test with metric missing enabled property
      const metricWithoutEnabled = {
        name: 'Missing Enabled',
        icon: 'question',
        minValue: 1,
        maxValue: 5
      } as any;
      
      return (
        isMetricEnabled(enabledMetric) === true &&
        isMetricEnabled(disabledMetric) === false &&
        isMetricEnabled(metricWithoutEnabled) === true // Default is true
      );
    }
  );
  
  // Test: isCalloutMetadata functionality
  testRunner.addTest(
    'Type Guards - isCalloutMetadata correctly identifies callout metadata',
    () => {
      // Test with valid metadata
      const validMetadata = { type: 'dream', id: '123' };
      
      // Test with metadata missing id
      const metadataWithoutId = { type: 'dream' };
      
      // Test with invalid metadata (missing type)
      const invalidMetadata = { id: '123' };
      
      // Test with null
      const nullMetadata = null;
      
      // Test with undefined
      const undefinedMetadata = undefined;
      
      // Test with string
      const stringMetadata = 'dream';
      
      // Test with number
      const numberMetadata = 123;
      
      return (
        isCalloutMetadata(validMetadata) === true &&
        isCalloutMetadata(metadataWithoutId) === true &&
        isCalloutMetadata(invalidMetadata) === false &&
        isCalloutMetadata(nullMetadata) === false &&
        isCalloutMetadata(undefinedMetadata) === false &&
        isCalloutMetadata(stringMetadata) === false &&
        isCalloutMetadata(numberMetadata) === false
      );
    }
  );
  
  // Test: isPromise functionality
  testRunner.addTest(
    'Type Guards - isPromise correctly identifies promises',
    () => {
      // Test with actual promise
      const promise = Promise.resolve('test');
      
      // Test with promise-like object
      const promiseLike = {
        then: (resolve: any) => resolve('test'),
        catch: (reject: any) => {}
      };
      
      // Test with non-promise object
      const notPromise = { value: 'test' };
      
      // Test with undefined
      const undefinedValue = undefined;
      
      // Test with null
      const nullValue = null;
      
      const results = {
        promiseResult: isPromise(promise),
        promiseLikeResult: isPromise(promiseLike),
        notPromiseResult: isPromise(notPromise),
        undefinedResult: isPromise(undefinedValue),
        nullResult: isPromise(nullValue)
      };
      
      logger.debug('TypeGuards', 'isPromise test results:', results);
      
      return (
        results.promiseResult === true &&
        results.promiseLikeResult === true &&
        results.notPromiseResult === false &&
        results.undefinedResult === false &&
        results.nullResult === false
      );
    }
  );
}

/**
 * Runs all type guard tests
 */
export async function runTypeGuardsTests(): Promise<void> {
  const logger = getLogger('TypeGuardsTests');
  logger.info('TypeGuards', 'Running type guard tests...');
  
  const testRunner = new TestRunner();
  registerTypeGuardsTests(testRunner);
  
  const results = await testRunner.runTests();
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  logger.info('TypeGuards', `Type guard tests complete: ${passedCount}/${totalCount} passed`);
  
  if (passedCount !== totalCount) {
    const failedTests = results.filter(r => !r.passed);
    logger.warn('TypeGuards', `Failed tests (${failedTests.length}):`, 
      failedTests.map(t => ({ name: t.name, error: t.error?.message })));
  }
} 