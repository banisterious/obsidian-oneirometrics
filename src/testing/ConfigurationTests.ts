import { TestRunner } from './TestRunner';
import { DEFAULT_METRICS, DreamMetricsSettings } from '../types/core';
import { LogLevel } from '../types/logging';
import { getLogger } from '../logging';

// Define an extended settings interface for testing
interface TestDreamMetricsSettings extends DreamMetricsSettings {
  _persistentExclusions: Record<string, any>;
}

/**
 * Register configuration tests to the test runner
 * @param testRunner The test runner instance
 */
export function registerConfigurationTests(
  testRunner: TestRunner
): void {
  // ================================
  // SETTINGS MIGRATION TESTS
  // ================================
  
  // Test: Should migrate from v1 to v2 settings
  testRunner.addTest(
    'Configuration - Should migrate from v1 to v2 settings',
    async () => {
      // Create mock v1 settings (pre-metricsVersion field)
      const v1Settings: Record<string, any> = {
        projectNote: 'DreamMetrics.md',
        showRibbonButtons: true,
        metrics: {
          'Sensory Detail': {
            name: 'Sensory Detail',
            icon: 'eye',
            range: { min: 1, max: 5 },
            description: 'Level of sensory detail in the dream',
            enabled: true,
            type: 'number',
            category: 'dream',
            format: 'number',
            options: [],
            min: 1,
            max: 5,
            step: 1
          }
        },
        selectedNotes: ['dreams.md'],
        calloutName: 'dream',
        selectionMode: 'notes',
        selectedFolder: '',
        expandedStates: {},
        backupEnabled: true,
        backupFolderPath: 'backups',
        _persistentExclusions: {},
        logging: {
          level: 'warn',
          maxLogSize: 1000,
          maxBackups: 3
        }
        // Notice: no metricsVersion field
      };
      
      // Simulate a migration function (this would typically be in the settings handler)
      const migrateToV2 = (settings: Record<string, any>): TestDreamMetricsSettings => {
        const logger = getLogger('ConfigurationTests');
        const newSettings = { ...settings } as TestDreamMetricsSettings;
        
        // Add version field if it doesn't exist
        if (!newSettings.metricsVersion) {
          newSettings.metricsVersion = '2.0.0';
          logger.info('Migration', 'Migrated settings to version 2.0.0');
        }
        
        return newSettings;
      };
      
      // Perform the migration
      const v2Settings = migrateToV2(v1Settings);
      
      // Check that migration was successful
      return v2Settings.metricsVersion === '2.0.0' &&
             v2Settings.projectNote === 'DreamMetrics.md' &&
             v2Settings.metrics['Sensory Detail']?.name === 'Sensory Detail';
    }
  );
  
  // ================================
  // DEFAULT SETTINGS BEHAVIOR
  // ================================
  
  // Test: Should provide default values for missing settings
  testRunner.addTest(
    'Configuration - Should provide defaults for missing settings',
    async () => {
      // Create incomplete settings object
      const incompleteSettings: Partial<TestDreamMetricsSettings> = {
        projectNote: 'DreamMetrics.md',
        // Many fields missing
      };
      
      // Function to provide defaults (this would typically be in the settings handler)
      const withDefaults = (settings: Partial<TestDreamMetricsSettings>): TestDreamMetricsSettings => {
        // Start with complete defaults
        const defaults: TestDreamMetricsSettings = {
          projectNote: 'OneiroMetrics.md',
          showRibbonButtons: true,
          metrics: Object.fromEntries(DEFAULT_METRICS.map(m => [m.name, m])),
          selectedNotes: [],
          calloutName: 'dream',
          selectionMode: 'notes',
          selectedFolder: '',
          expandedStates: {},
          backupEnabled: false,
          backupFolderPath: 'backups',
          _persistentExclusions: {},
          logging: {
            level: 'off',
            maxLogSize: 1000,
            maxBackups: 3
          },
          metricsVersion: '2.0.0'
        };
        
        // Override defaults with provided settings
        return { ...defaults, ...settings };
      };
      
      // Apply defaults
      const fullSettings = withDefaults(incompleteSettings);
      
      // Check that defaults were applied correctly
      return fullSettings.projectNote === 'DreamMetrics.md' && // from incomplete
             fullSettings.calloutName === 'dream' && // from defaults
             fullSettings.showRibbonButtons === true && // from defaults
             Object.keys(fullSettings.metrics).length > 0; // from defaults
    }
  );
  
  // ================================
  // SETTINGS VALIDATION
  // ================================
  
  // Test: Should validate metric ranges
  testRunner.addTest(
    'Configuration - Should validate metric ranges',
    async () => {
      // Create settings with invalid metric ranges
      const invalidSettings: TestDreamMetricsSettings = {
        projectNote: 'DreamMetrics.md',
        showRibbonButtons: true,
        metrics: {
          'Invalid Range': {
            name: 'Invalid Range',
            icon: 'alert-triangle',
            minValue: 10,
            maxValue: 5,
            range: { min: 10, max: 5 }, // Invalid: min > max
            description: 'This has an invalid range',
            enabled: true,
            type: 'number',
            category: 'test',
            format: 'number',
            options: [],
            min: 10,
            max: 5, // Also invalid
            step: 1
          },
          'Valid Range': {
            name: 'Valid Range',
            icon: 'check',
            minValue: 1,
            maxValue: 5,
            range: { min: 1, max: 5 },
            description: 'This has a valid range',
            enabled: true,
            type: 'number',
            category: 'test',
            format: 'number',
            options: [],
            min: 1,
            max: 5,
            step: 1
          }
        },
        selectedNotes: [],
        calloutName: 'dream',
        selectionMode: 'notes',
        selectedFolder: '',
        expandedStates: {},
        backupEnabled: false,
        backupFolderPath: 'backups',
        _persistentExclusions: {},
        logging: {
          level: 'off',
          maxLogSize: 1000,
          maxBackups: 3
        },
        metricsVersion: '2.0.0'
      };
      
      // Function to validate settings
      const validateSettings = (settings: TestDreamMetricsSettings): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];
        
        // Check metric ranges
        Object.values(settings.metrics).forEach(metric => {
          if (metric.range.min > metric.range.max) {
            errors.push(`Metric "${metric.name}" has invalid range: min (${metric.range.min}) > max (${metric.range.max})`);
          }
          
          if (metric.min > metric.max) {
            errors.push(`Metric "${metric.name}" has invalid min/max: min (${metric.min}) > max (${metric.max})`);
          }
        });
        
        return {
          valid: errors.length === 0,
          errors
        };
      };
      
      // Validate settings
      const validationResult = validateSettings(invalidSettings);
      
      // Check that validation detected the issues
      return !validationResult.valid && 
             validationResult.errors.length === 2 &&
             validationResult.errors[0].includes('Invalid Range') &&
             validationResult.errors[1].includes('Invalid Range');
    }
  );
  
  // Test: Should validate callout name
  testRunner.addTest(
    'Configuration - Should validate callout name',
    () => {
      // Test cases for callout names
      const testCases = [
        { name: 'dream', expected: true }, // Valid
        { name: 'DREAM', expected: true }, // Valid, case-insensitive
        { name: 'dream-journal', expected: true }, // Valid with hyphen
        { name: 'dream_journal', expected: true }, // Valid with underscore
        { name: '', expected: false }, // Invalid: empty
        { name: ' ', expected: false }, // Invalid: just space
        { name: '<script>', expected: false }, // Invalid: HTML-like
        { name: '"quotes"', expected: false }, // Invalid: quotes
        { name: '[brackets]', expected: false } // Invalid: brackets
      ];
      
      // Function to validate callout name
      const isValidCalloutName = (name: string): boolean => {
        if (!name || name.trim() === '') return false;
        
        // Only allow alphanumeric, hyphen, underscore
        return /^[a-zA-Z0-9_-]+$/.test(name);
      };
      
      // Run all test cases
      const results = testCases.map(test => 
        isValidCalloutName(test.name) === test.expected
      );
      
      // All test cases should pass
      return results.every(result => result === true);
    }
  );
} 