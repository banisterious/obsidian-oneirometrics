/**
 * Tests for the SettingsAdapter class
 * 
 * These tests verify that the SettingsAdapter correctly adapts
 * settings from legacy formats to the modern format.
 */

import { TestRunner } from '../TestRunner';
import { SettingsAdapter } from '../../state/adapters/SettingsAdapter';

/**
 * Register tests for the SettingsAdapter
 * @param testRunner The test runner to register tests with
 */
export function registerSettingsAdapterTests(
  testRunner: TestRunner
): void {
  // Test: Adapt empty settings
  testRunner.addTest(
    'SettingsAdapter - Should handle empty settings',
    async () => {
      const adapter = new SettingsAdapter();
      const settings = adapter.toCoreSettings();
      
      // Check basic required properties with default values
      return settings.projectNote === '' &&
             Object.keys(settings.metrics).length === 0 &&
             settings.selectedNotes.length === 0 &&
             settings.selectedFolder === '' &&
             settings.selectionMode === 'notes' &&
             settings.calloutName === 'dream' &&
             settings.showRibbonButtons === false &&
             settings.backupEnabled === false &&
             settings.backupFolderPath === './backups' &&
             settings.logging.level === 'info';
    }
  );
  
  // Test: Adapt legacy settings
  testRunner.addTest(
    'SettingsAdapter - Should handle legacy settings',
    async () => {
      const legacySettings = {
        projectNotePath: 'legacy/path.md',
        metrics: { clarity: { name: 'Clarity', minValue: 1, maxValue: 5 } },
        selectedNotes: ['note1.md', 'note2.md'],
        selectionMode: 'manual',
        calloutName: 'legacy-callout'
      };
      
      const adapter = new SettingsAdapter(legacySettings);
      const settings = adapter.toCoreSettings();
      
      // Check if values are correctly adapted
      return settings.projectNote === 'legacy/path.md' &&
             settings.projectNotePath === 'legacy/path.md' &&
             settings.selectedNotes.length === 2 &&
             settings.selectionMode === 'manual' &&
             settings.calloutName === 'legacy-callout';
    }
  );
  
  // Test: Handle mixed properties
  testRunner.addTest(
    'SettingsAdapter - Should handle mixed properties (both legacy and modern)',
    async () => {
      const mixedSettings = {
        projectNote: 'modern/path.md',
        projectNotePath: 'legacy/path.md',
        selectionMode: 'folder',
        backup: { enabled: true, folderPath: 'modern/backups' },
        backupEnabled: false,
        backupFolderPath: 'legacy/backups'
      };
      
      const adapter = new SettingsAdapter(mixedSettings);
      const settings = adapter.toCoreSettings();
      
      // Modern properties should take precedence
      return settings.projectNote === 'modern/path.md' &&
             settings.projectNotePath === 'legacy/path.md' &&
             settings.selectionMode === 'folder' &&
             settings.backupEnabled === true &&
             settings.backupFolderPath === 'modern/backups' &&
             settings.backup?.enabled === true &&
             settings.backup?.folderPath === 'modern/backups';
    }
  );
  
  // Test: Developer mode settings
  testRunner.addTest(
    'SettingsAdapter - Should handle developer mode settings',
    async () => {
      const devSettings = {
        developerMode: {
          enabled: true,
          showDebugRibbon: true,
          experimentalFeatures: ['feature1', 'feature2']
        }
      };
      
      const adapter = new SettingsAdapter(devSettings);
      const settings = adapter.toCoreSettings();
      
      return settings.developerMode?.enabled === true &&
             settings.developerMode?.showDebugRibbon === true &&
             settings.developerMode?.experimentalFeatures?.length === 2 &&
             settings.developerMode?.experimentalFeatures?.includes('feature1');
    }
  );
  
  // Test: UI state settings
  testRunner.addTest(
    'SettingsAdapter - Should handle UI state settings',
    async () => {
      const uiSettings = {
        uiState: {
          activeTab: 'metrics',
          lastFilter: 'week',
          customRanges: { 'last month': { start: '2025-05-01', end: '2025-05-31' } },
          layout: { compact: true }
        }
      };
      
      const adapter = new SettingsAdapter(uiSettings);
      const settings = adapter.toCoreSettings();
      
      return settings.uiState?.activeTab === 'metrics' &&
             settings.uiState?.lastFilter === 'week' &&
             settings.uiState?.customRanges?.['last month']?.start === '2025-05-01' &&
             settings.uiState?.layout?.compact === true;
    }
  );
  
  // Test: Journal structure settings
  testRunner.addTest(
    'SettingsAdapter - Should handle journal structure settings',
    async () => {
      // Test with both journalStructure and linting to ensure correct priority
      const structureSettings = {
        journalStructure: { version: 2, templates: [{ id: 'template1' }] } as any,
        linting: { version: 1, templates: [{ id: 'old-template' }] } as any
      };
      
      const adapter = new SettingsAdapter(structureSettings);
      const settings = adapter.toCoreSettings();
      
      // journalStructure should take precedence over linting
      return (settings.journalStructure as any)?.version === 2 &&
             (settings.journalStructure as any)?.templates?.[0]?.id === 'template1' &&
             (settings.linting as any)?.version === 1;
    }
  );
  
  // Test: Logging settings
  testRunner.addTest(
    'SettingsAdapter - Should handle logging settings',
    async () => {
      const loggingSettings = {
        logging: {
          level: 'debug',
          maxSize: 2048576,
          maxBackups: 5
        }
      };
      
      const adapter = new SettingsAdapter(loggingSettings);
      const settings = adapter.toCoreSettings();
      
      return settings.logging.level === 'debug' &&
             settings.logging.maxSize === 2048576 &&
             settings.logging.maxBackups === 5;
    }
  );
  
  // Test: Getter methods
  testRunner.addTest(
    'SettingsAdapter - Should provide getters for common properties',
    async () => {
      const testSettings = {
        projectNote: 'test/path.md',
        selectionMode: 'folder',
        selectedFolder: 'test/folder',
        showRibbonButtons: true,
        backupEnabled: true,
        backupFolderPath: 'test/backups',
        expandedStates: { 'section1': true },
        developerMode: { enabled: true },
        uiState: { activeTab: 'metrics' },
        journalStructure: { version: 2 } as any
      };
      
      const adapter = new SettingsAdapter(testSettings);
      
      return adapter.getProjectNotePath() === 'test/path.md' &&
             adapter.getSelectionMode() === 'folder' &&
             adapter.getSelectedFolder() === 'test/folder' &&
             adapter.shouldShowRibbonButtons() === true &&
             adapter.isBackupEnabled() === true &&
             adapter.getBackupFolderPath() === 'test/backups' &&
             adapter.getExpandedStates()['section1'] === true &&
             adapter.isDeveloperModeEnabled() === true &&
             adapter.getUIState().activeTab === 'metrics' &&
             adapter.getActiveTab() === 'metrics' &&
             (adapter.getJournalStructure() as any).version === 2;
    }
  );
  
  // Test: Handle invalid log level
  testRunner.addTest(
    'SettingsAdapter - Should handle invalid log level',
    async () => {
      const invalidSettings = {
        logging: {
          level: 'invalid-level'
        }
      };
      
      const adapter = new SettingsAdapter(invalidSettings);
      const settings = adapter.toCoreSettings();
      
      // Should default to 'info' for invalid level
      return settings.logging.level === 'info';
    }
  );
  
  // Test: Generic property getter
  testRunner.addTest(
    'SettingsAdapter - Should get property with getProperty method',
    async () => {
      const testSettings = {
        projectNote: 'test/path.md',
        metrics: { clarity: { name: 'Clarity' } }
      };
      
      const adapter = new SettingsAdapter(testSettings);
      
      const projectNote = adapter.getProperty<string>('projectNote');
      const metrics = adapter.getProperty<Record<string, any>>('metrics');
      const nonExistent = adapter.getProperty<string>('nonExistent', 'default');
      
      return projectNote === 'test/path.md' &&
             metrics.clarity.name === 'Clarity' &&
             nonExistent === 'default';
    }
  );
  
  // Test: Factory method
  testRunner.addTest(
    'SettingsAdapter - Should create adapter with static fromSettings method',
    async () => {
      const testSettings = {
        projectNote: 'factory/path.md'
      };
      
      const adapter = SettingsAdapter.fromSettings(testSettings);
      const settings = adapter.toCoreSettings();
      
      return settings.projectNote === 'factory/path.md';
    }
  );
}

/**
 * Run the settings adapter tests directly
 * @returns Promise that resolves when tests are complete
 */
export async function runSettingsAdapterTests(): Promise<void> {
  const testRunner = TestRunner.create();
  registerSettingsAdapterTests(testRunner);
  
  return testRunner.runTests().then((results) => {
    const passedCount = results.filter(r => r.passed).length;
    console.log(`Settings adapter tests: ${passedCount}/${results.length} passed`);
    
    if (passedCount < results.length) {
      console.error("Failed tests:");
      results.filter(r => !r.passed).forEach(result => {
        console.error(`- ${result.name}: ${result.error}`);
      });
    }
  });
} 