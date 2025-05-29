/**
 * Unit tests for metric-helpers.ts
 * 
 * These tests verify the proper functionality of all helper functions
 * for safely accessing and modifying metric properties.
 */

import { DreamMetric } from '../../types/core';
import { 
  isMetricEnabled,
  setMetricEnabled,
  getMetricMinValue,
  getMetricMaxValue,
  setMetricRange,
  getMetricRange,
  standardizeMetric,
  createCompatibleMetric,
  adaptMetric,
  getFormattedMetricValue,
  getAggregatedMetricValue
} from '../../utils/metric-helpers';
import { TestRunner } from '../TestRunner';
import { getLogger } from '../../logging';

/**
 * Registers all metric helper tests with the test runner
 * @param testRunner The test runner to register tests with
 */
export function registerMetricHelpersTests(
  testRunner: TestRunner
): void {
  // Test: isMetricEnabled functionality
  testRunner.addTest(
    'Metric Helpers - isMetricEnabled correctly handles various property states',
    () => {
      // Test with explicitly enabled
      const enabledMetric = { enabled: true } as DreamMetric;
      
      // Test with explicitly disabled
      const disabledMetric = { enabled: false } as DreamMetric;
      
      // Test with legacy property (disabled = true)
      const legacyDisabled = { disabled: true } as any;
      
      // Test with legacy property (disabled = false)
      const legacyEnabled = { disabled: false } as any;
      
      // Test with missing property
      const missingProperty = {} as DreamMetric;
      
      // Test with null metric
      const nullMetric = null as unknown as DreamMetric;
      
      return (
        isMetricEnabled(enabledMetric) === true &&
        isMetricEnabled(disabledMetric) === false &&
        isMetricEnabled(legacyDisabled) === false &&
        isMetricEnabled(legacyEnabled, true) === true &&
        isMetricEnabled(missingProperty, true) === true &&
        isMetricEnabled(missingProperty, false) === false &&
        isMetricEnabled(nullMetric, true) === true &&
        isMetricEnabled(nullMetric) === false
      );
    }
  );
  
  // Test: setMetricEnabled functionality
  testRunner.addTest(
    'Metric Helpers - setMetricEnabled updates both current and legacy properties',
    () => {
      // Test with basic metric
      const basicMetric = { name: 'Test Metric' } as DreamMetric;
      
      // Test with existing properties
      const existingPropsMetric = { 
        name: 'Test', 
        enabled: false, 
        disabled: true 
      } as any;
      
      // Test enable a metric
      const enabledResult = setMetricEnabled(basicMetric, true);
      
      // Test disable a metric
      const disabledResult = setMetricEnabled(existingPropsMetric, false);
      
      // Test with null
      const nullResult = setMetricEnabled(null, true);
      
      return (
        // Check that enabled is set correctly
        enabledResult.enabled === true &&
        disabledResult.enabled === false &&
        
        // Check that disabled is set to the opposite (for legacy compatibility)
        enabledResult.disabled === false &&
        disabledResult.disabled === true &&
        
        // Check original not modified
        basicMetric.enabled === undefined &&
        
        // Check null returns null
        nullResult === null
      );
    }
  );
  
  // Test: getMetricMinValue functionality
  testRunner.addTest(
    'Metric Helpers - getMetricMinValue correctly handles various property formats',
    () => {
      // Test with minValue property
      const withMinValue = { minValue: 2 } as DreamMetric;
      
      // Test with range.min property
      const withRangeMin = { range: { min: 3 } } as DreamMetric;
      
      // Test with min property (legacy)
      const withMin = { min: 4 } as any;
      
      // Test with multiple properties (should prioritize minValue)
      const withMultiple = { minValue: 2, range: { min: 3 }, min: 4 } as any;
      
      // Test with no properties (default is 1)
      const noProps = {} as DreamMetric;
      
      return (
        getMetricMinValue(withMinValue) === 2 &&
        getMetricMinValue(withRangeMin) === 3 &&
        getMetricMinValue(withMin) === 4 &&
        getMetricMinValue(withMultiple) === 2 &&
        getMetricMinValue(noProps) === 1
      );
    }
  );
  
  // Test: getMetricMaxValue functionality
  testRunner.addTest(
    'Metric Helpers - getMetricMaxValue correctly handles various property formats',
    () => {
      // Test with maxValue property
      const withMaxValue = { maxValue: 8 } as DreamMetric;
      
      // Test with range.max property
      const withRangeMax = { range: { max: 9 } } as DreamMetric;
      
      // Test with max property (legacy)
      const withMax = { max: 10 } as any;
      
      // Test with multiple properties (should prioritize maxValue)
      const withMultiple = { maxValue: 8, range: { max: 9 }, max: 10 } as any;
      
      // Test with no properties (default is 5)
      const noProps = {} as DreamMetric;
      
      return (
        getMetricMaxValue(withMaxValue) === 8 &&
        getMetricMaxValue(withRangeMax) === 9 &&
        getMetricMaxValue(withMax) === 10 &&
        getMetricMaxValue(withMultiple) === 8 &&
        getMetricMaxValue(noProps) === 5
      );
    }
  );
  
  // Test: setMetricRange functionality
  testRunner.addTest(
    'Metric Helpers - setMetricRange updates all range representations',
    () => {
      // Test with empty metric
      const emptyMetric = {} as any;
      setMetricRange(emptyMetric, 1, 10);
      
      // Test with existing range
      const withRange = { range: { min: 3, max: 7 } } as any;
      setMetricRange(withRange, 2, 8);
      
      return (
        // Check all properties on empty metric
        emptyMetric.minValue === 1 &&
        emptyMetric.maxValue === 10 &&
        emptyMetric.range.min === 1 &&
        emptyMetric.range.max === 10 &&
        emptyMetric.min === 1 &&
        emptyMetric.max === 10 &&
        
        // Check all properties on metric with existing range
        withRange.minValue === 2 &&
        withRange.maxValue === 8 &&
        withRange.range.min === 2 &&
        withRange.range.max === 8 &&
        withRange.min === 2 &&
        withRange.max === 8
      );
    }
  );
  
  // Test: getMetricRange functionality
  testRunner.addTest(
    'Metric Helpers - getMetricRange returns correct min and max values',
    () => {
      // Test with minValue/maxValue
      const withMinMaxValue = { minValue: 2, maxValue: 8 } as DreamMetric;
      
      // Test with range
      const withRange = { range: { min: 3, max: 9 } } as DreamMetric;
      
      // Test with min/max
      const withMinMax = { min: 4, max: 10 } as any;
      
      // Test with multiple properties (should prioritize minValue/maxValue)
      const withMultiple = { 
        minValue: 2, maxValue: 8, 
        range: { min: 3, max: 9 }, 
        min: 4, max: 10 
      } as any;
      
      // Test with no properties (defaults: min=1, max=5)
      const noProps = {} as DreamMetric;
      
      const rangeMinMaxValue = getMetricRange(withMinMaxValue);
      const rangeWithRange = getMetricRange(withRange);
      const rangeWithMinMax = getMetricRange(withMinMax);
      const rangeWithMultiple = getMetricRange(withMultiple);
      const rangeNoProps = getMetricRange(noProps);
      
      return (
        rangeMinMaxValue.min === 2 && rangeMinMaxValue.max === 8 &&
        rangeWithRange.min === 3 && rangeWithRange.max === 9 &&
        rangeWithMinMax.min === 4 && rangeWithMinMax.max === 10 &&
        rangeWithMultiple.min === 2 && rangeWithMultiple.max === 8 &&
        rangeNoProps.min === 1 && rangeNoProps.max === 5
      );
    }
  );
  
  // Test: standardizeMetric functionality
  testRunner.addTest(
    'Metric Helpers - standardizeMetric creates a complete metric with all properties',
    () => {
      // Test with minimal input
      const minimalInput = { name: 'Minimal Metric' } as Partial<DreamMetric>;
      const standardizedMinimal = standardizeMetric(minimalInput);
      
      // Test with partial input
      const partialInput = { 
        name: 'Partial Metric',
        icon: 'star',
        enabled: true,
        range: { min: 2, max: 8 }
      } as any;
      const standardizedPartial = standardizeMetric(partialInput);
      
      // Test with legacy format
      const legacyInput = {
        name: 'Legacy Metric',
        disabled: false,
        min: 0,
        max: 10,
        step: 1
      } as any;
      const standardizedLegacy = standardizeMetric(legacyInput);
      
      return (
        // Check minimal input standardization
        standardizedMinimal.name === 'Minimal Metric' &&
        standardizedMinimal.icon === 'help-circle' &&
        standardizedMinimal.minValue === 1 &&
        standardizedMinimal.maxValue === 5 &&
        standardizedMinimal.enabled === false &&
        standardizedMinimal.category === 'general' &&
        standardizedMinimal.type === 'number' &&
        standardizedMinimal.format === 'number' &&
        
        // Check partial input standardization
        standardizedPartial.name === 'Partial Metric' &&
        standardizedPartial.icon === 'star' &&
        standardizedPartial.minValue === 2 &&
        standardizedPartial.maxValue === 8 &&
        standardizedPartial.enabled === true &&
        standardizedPartial.range.min === 2 &&
        standardizedPartial.range.max === 8 &&
        
        // Check legacy input standardization
        standardizedLegacy.name === 'Legacy Metric' &&
        standardizedLegacy.enabled === true &&
        standardizedLegacy.minValue === 0 &&
        standardizedLegacy.maxValue === 10 &&
        standardizedLegacy.min === 0 &&
        standardizedLegacy.max === 10 &&
        standardizedLegacy.step === 1
      );
    }
  );
  
  // Test: createCompatibleMetric functionality
  testRunner.addTest(
    'Metric Helpers - createCompatibleMetric creates a CoreDreamMetric with all required properties',
    () => {
      // Test with minimal input
      const minimalInput = { name: 'Minimal' } as Partial<DreamMetric>;
      const compatibleMinimal = createCompatibleMetric(minimalInput);
      
      // Test with partial input
      const partialInput = { 
        name: 'Partial',
        icon: 'star',
        enabled: true,
        min: 1,
        max: 10
      } as any;
      const compatiblePartial = createCompatibleMetric(partialInput);
      
      // Test with null
      const compatibleNull = createCompatibleMetric(null);
      
      return (
        // Check minimal input
        compatibleMinimal.name === 'Minimal' &&
        (compatibleMinimal as any).label === 'Minimal' &&
        compatibleMinimal.enabled === true &&
        (compatibleMinimal as any).min === 0 &&
        (compatibleMinimal as any).max === 100 &&
        (compatibleMinimal as any).step === 1 &&
        (compatibleMinimal as any).format === '{}' &&
        (compatibleMinimal as any).group === 'general' &&
        
        // Check partial input
        compatiblePartial.name === 'Partial' &&
        compatiblePartial.icon === 'star' &&
        compatiblePartial.enabled === true &&
        compatiblePartial.min === 1 &&
        compatiblePartial.max === 10 &&
        
        // Check null input
        compatibleNull.name === '' &&
        compatibleNull.enabled === true
      );
    }
  );
  
  // Test: adaptMetric functionality
  testRunner.addTest(
    'Metric Helpers - adaptMetric properly adapts metrics to CoreDreamMetric format',
    () => {
      // Test with already compatible metric
      const compatibleMetric = { 
        name: 'Compatible',
        enabled: true,
        min: 1,
        max: 10
      } as any;
      const adaptedCompatible = adaptMetric(compatibleMetric);
      
      // Test with legacy metric
      const legacyMetric = { 
        name: 'Legacy',
        disabled: false,
        min: 2,
        max: 8
      } as any;
      const adaptedLegacy = adaptMetric(legacyMetric);
      
      // Test with null
      const adaptedNull = adaptMetric(null);
      
      return (
        // Compatible metric should be returned as is
        adaptedCompatible === compatibleMetric &&
        
        // Legacy metric should be adapted
        adaptedLegacy.name === 'Legacy' &&
        adaptedLegacy.enabled === true &&
        adaptedLegacy.min === 2 &&
        adaptedLegacy.max === 8 &&
        
        // Null should return empty compatible metric
        adaptedNull.name === '' &&
        adaptedNull.enabled === true
      );
    }
  );
  
  // Test: getFormattedMetricValue functionality
  testRunner.addTest(
    'Metric Helpers - getFormattedMetricValue correctly formats values based on format pattern',
    () => {
      // Test with explicit format
      const withFormat = { format: '{}%' } as DreamMetric;
      
      // Test with explicit format that has multiple placeholders
      const withMultiFormat = { format: '{} out of 10' } as DreamMetric;
      
      // Test with no format (default is {})
      const noFormat = {} as DreamMetric;
      
      // Test with null metric
      const nullMetric = null as unknown as DreamMetric;
      
      return (
        getFormattedMetricValue(withFormat, 75) === '75%' &&
        getFormattedMetricValue(withMultiFormat, 7) === '7 out of 10' &&
        getFormattedMetricValue(noFormat, 5) === '5' &&
        getFormattedMetricValue(nullMetric, 'N/A') === 'N/A'
      );
    }
  );
  
  // Test: getAggregatedMetricValue functionality
  testRunner.addTest(
    'Metric Helpers - getAggregatedMetricValue correctly aggregates values based on method',
    () => {
      // Sample values array
      const values = [2, 4, 6, 8, 10];
      
      // Test various aggregation methods
      const sumMetric = { aggregate: 'sum' } as any;
      const avgMetric = { aggregate: 'average' } as any;
      const minMetric = { aggregate: 'min' } as any;
      const maxMetric = { aggregate: 'max' } as any;
      const medianMetric = { aggregate: 'median' } as any;
      const modeMetric = { aggregate: 'mode' } as any;
      const lastMetric = { aggregate: 'last' } as any;
      const defaultMetric = {} as any;
      const invalidMetric = { aggregate: 'invalid' } as any;
      
      // Test with mixed number and string values
      const mixedValues = [2, '4', 6, '8', 10];
      
      // Test with no values
      const emptyValues: number[] = [];
      
      // Test with null
      const nullMetric = null as unknown as DreamMetric;
      
      return (
        // Test each aggregation method
        getAggregatedMetricValue(sumMetric, values) === 30 &&
        getAggregatedMetricValue(avgMetric, values) === 6 &&
        getAggregatedMetricValue(minMetric, values) === 2 &&
        getAggregatedMetricValue(maxMetric, values) === 10 &&
        getAggregatedMetricValue(medianMetric, values) === 6 &&
        getAggregatedMetricValue(modeMetric, values) === 2 && // First value is the mode if all occur once
        getAggregatedMetricValue(lastMetric, values) === 10 &&
        getAggregatedMetricValue(defaultMetric, values) === 6 && // Default is average
        getAggregatedMetricValue(invalidMetric, values) === 6 && // Invalid falls back to average
        
        // Test with mixed values
        getAggregatedMetricValue(sumMetric, mixedValues) === 30 &&
        
        // Test with empty values
        getAggregatedMetricValue(sumMetric, emptyValues) === 0 &&
        
        // Test with null metric
        getAggregatedMetricValue(nullMetric, values) === 0
      );
    }
  );
  
  // Test: getAggregatedMetricValue with mode functionality
  testRunner.addTest(
    'Metric Helpers - getAggregatedMetricValue correctly calculates mode',
    () => {
      // Mode should return the most frequently occurring value
      const modeValues = [2, 4, 4, 6, 4, 8, 10];
      const modeMetric = { aggregate: 'mode' } as any;
      
      // String values should be converted to numbers
      const stringModeValues = ['2', '4', '4', '6', '4', '8', '10'];
      
      return (
        getAggregatedMetricValue(modeMetric, modeValues) === 4 &&
        getAggregatedMetricValue(modeMetric, stringModeValues) === 4
      );
    }
  );
  
  // Test: getAggregatedMetricValue with median functionality for even arrays
  testRunner.addTest(
    'Metric Helpers - getAggregatedMetricValue correctly calculates median for even arrays',
    () => {
      // Median of even array should average the middle two values
      const evenValues = [2, 4, 6, 8];
      const medianMetric = { aggregate: 'median' } as any;
      
      return getAggregatedMetricValue(medianMetric, evenValues) === 5;
    }
  );
}

// Example of how to use these tests
export function runMetricHelpersTests(): Promise<void> {
  const logger = getLogger('MetricHelpersTests');
  logger.info('Test', 'Running metric helper tests...');
  
  const testRunner = TestRunner.create();
  registerMetricHelpersTests(testRunner);
  
  return testRunner.runTests()
    .then(results => {
      const passedCount = results.filter(r => r.passed).length;
      logger.info('Test', `Metric helper tests complete: ${passedCount}/${results.length} tests passed`);
      
      // Log any failures
      results.filter(r => !r.passed).forEach(failure => {
        logger.error('Test', `Test failed: ${failure.name}`);
        if (failure.error) {
          logger.error('Test', 'Error details:', failure.error);
        }
      });
    });
} 