/**
 * Unit tests for settings-helpers.ts
 * 
 * These tests verify the proper functionality of all helper functions
 * for safely accessing and modifying settings properties.
 */

import { DreamMetricsSettings } from '../../types/core';
import { JournalStructureSettings } from '../../types/journal-check';
import { 
  getProjectNotePath,
  setProjectNotePath,
  getSelectedFolder,
  setSelectedFolder,
  getSelectionMode,
  setSelectionMode,
  getLogMaxSize,
  setLogMaxSize,
  isBackupEnabled,
  setBackupEnabled,
  getBackupFolderPath,
  setBackupFolderPath,
  getJournalStructure,
  setJournalStructure,
  shouldShowRibbonButtons,
  setShowRibbonButtons,
  isDeveloperModeEnabled,
  setDeveloperModeEnabled,
  getUIState,
  setUIState,
  getActiveTab,
  setActiveTab
} from '../../utils/settings-helpers';
import { TestRunner } from '../TestRunner';

/**
 * Registers all settings helper tests with the test runner
 * @param testRunner The test runner to register tests with
 */
export function registerSettingsHelpersTests(
  testRunner: TestRunner
): void {
  // Test: getProjectNotePath functionality
  testRunner.addTest(
    'Settings Helpers - getProjectNotePath correctly handles both property names',
    () => {
      // Test with new property
      const settingsWithNew = { projectNote: '/path/to/note.md' } as DreamMetricsSettings;
      // Test with legacy property
      const settingsWithLegacy = { projectNotePath: '/legacy/path.md' } as DreamMetricsSettings;
      // Test with both properties
      const settingsWithBoth = { 
        projectNote: '/primary/path.md', 
        projectNotePath: '/should/not/use/this.md' 
      } as DreamMetricsSettings;
      // Test with neither property
      const settingsWithNeither = {} as DreamMetricsSettings;
      
      return (
        getProjectNotePath(settingsWithNew) === '/path/to/note.md' &&
        getProjectNotePath(settingsWithLegacy) === '/legacy/path.md' &&
        getProjectNotePath(settingsWithBoth) === '/primary/path.md' &&
        getProjectNotePath(settingsWithNeither) === ''
      );
    }
  );
  
  // Test: setProjectNotePath functionality
  testRunner.addTest(
    'Settings Helpers - setProjectNotePath updates both property names',
    () => {
      // Create settings object
      const settings = {} as DreamMetricsSettings;
      
      // Set the path
      setProjectNotePath(settings, '/new/path.md');
      
      // Verify both properties are set
      return (
        settings.projectNote === '/new/path.md' &&
        (settings as any).projectNotePath === '/new/path.md'
      );
    }
  );
  
  // Test: getSelectedFolder functionality
  testRunner.addTest(
    'Settings Helpers - getSelectedFolder correctly handles property',
    () => {
      // Test with property set
      const settingsWithFolder = { selectedFolder: '/path/to/folder' } as DreamMetricsSettings;
      // Test with empty property
      const settingsWithEmptyFolder = { selectedFolder: '' } as DreamMetricsSettings;
      // Test with missing property
      const settingsWithoutFolder = {} as DreamMetricsSettings;
      
      return (
        getSelectedFolder(settingsWithFolder) === '/path/to/folder' &&
        getSelectedFolder(settingsWithEmptyFolder) === '' &&
        getSelectedFolder(settingsWithoutFolder) === ''
      );
    }
  );
  
  // Test: setSelectedFolder functionality
  testRunner.addTest(
    'Settings Helpers - setSelectedFolder updates property',
    () => {
      // Create settings object
      const settings = {} as DreamMetricsSettings;
      
      // Set the folder
      setSelectedFolder(settings, '/selected/folder');
      
      // Verify property is set
      return settings.selectedFolder === '/selected/folder';
    }
  );
  
  // Test: getSelectionMode functionality
  testRunner.addTest(
    'Settings Helpers - getSelectionMode correctly handles different values',
    () => {
      // Test with 'notes' value
      const settingsWithNotes = { selectionMode: 'notes' } as DreamMetricsSettings;
      // Test with 'folder' value
      const settingsWithFolder = { selectionMode: 'folder' } as DreamMetricsSettings;
      // Test with 'manual' value
      const settingsWithManual = { selectionMode: 'manual' } as DreamMetricsSettings;
      // Test with 'automatic' value
      const settingsWithAutomatic = { selectionMode: 'automatic' } as DreamMetricsSettings;
      // Test with missing property
      const settingsWithoutMode = {} as DreamMetricsSettings;
      
      return (
        getSelectionMode(settingsWithNotes) === 'notes' &&
        getSelectionMode(settingsWithFolder) === 'folder' &&
        getSelectionMode(settingsWithManual) === 'notes' &&
        getSelectionMode(settingsWithAutomatic) === 'folder' &&
        getSelectionMode(settingsWithoutMode) === 'notes'
      );
    }
  );
  
  // Test: setSelectionMode functionality
  testRunner.addTest(
    'Settings Helpers - setSelectionMode updates property with correct format',
    () => {
      // Create settings objects
      const settingsForNotes = {} as DreamMetricsSettings;
      const settingsForFolder = {} as DreamMetricsSettings;
      
      // Set the modes
      setSelectionMode(settingsForNotes, 'notes');
      setSelectionMode(settingsForFolder, 'folder');
      
      // Verify property is set to the internal format
      return (
        settingsForNotes.selectionMode === 'manual' &&
        settingsForFolder.selectionMode === 'automatic'
      );
    }
  );
  
  // Test: getLogMaxSize functionality
  testRunner.addTest(
    'Settings Helpers - getLogMaxSize correctly handles various property states',
    () => {
      // Test with new property
      const settingsWithNew = { logging: { maxSize: 2048 } } as DreamMetricsSettings;
      // Test with legacy property
      const settingsWithLegacy = { logging: { maxLogSize: 4096 } } as DreamMetricsSettings;
      // Test with both properties
      const settingsWithBoth = { 
        logging: { 
          maxSize: 8192, 
          maxLogSize: 1024 
        } 
      } as DreamMetricsSettings;
      // Test with neither property but logging object exists
      const settingsWithNeither = { logging: { level: 'info' } } as DreamMetricsSettings;
      // Test with no logging object
      const settingsWithoutLogging = {} as DreamMetricsSettings;
      
      const defaultSize = 1024 * 1024; // 1MB
      
      return (
        getLogMaxSize(settingsWithNew) === 2048 &&
        getLogMaxSize(settingsWithLegacy) === 4096 &&
        getLogMaxSize(settingsWithBoth) === 8192 &&
        getLogMaxSize(settingsWithNeither) === defaultSize &&
        getLogMaxSize(settingsWithoutLogging) === defaultSize
      );
    }
  );
  
  // Test: setLogMaxSize functionality
  testRunner.addTest(
    'Settings Helpers - setLogMaxSize updates properties correctly',
    () => {
      // Create settings objects
      const settingsWithLogging = { logging: { level: 'info' } } as DreamMetricsSettings;
      const settingsWithoutLogging = {} as DreamMetricsSettings;
      
      // Set the log max size
      setLogMaxSize(settingsWithLogging, 16384);
      setLogMaxSize(settingsWithoutLogging, 32768);
      
      // Verify properties are set correctly
      return (
        settingsWithLogging.logging.maxSize === 16384 &&
        settingsWithLogging.logging.maxLogSize === 16384 &&
        settingsWithoutLogging.logging.maxSize === 32768 &&
        settingsWithoutLogging.logging.maxLogSize === 32768 &&
        settingsWithoutLogging.logging.level === 'info'
      );
    }
  );
  
  // Test: isBackupEnabled functionality
  testRunner.addTest(
    'Settings Helpers - isBackupEnabled correctly handles property',
    () => {
      // Test with property true
      const settingsWithBackupTrue = { backupEnabled: true } as DreamMetricsSettings;
      // Test with property false
      const settingsWithBackupFalse = { backupEnabled: false } as DreamMetricsSettings;
      // Test with missing property
      const settingsWithoutBackup = {} as DreamMetricsSettings;
      
      return (
        isBackupEnabled(settingsWithBackupTrue) === true &&
        isBackupEnabled(settingsWithBackupFalse) === false &&
        isBackupEnabled(settingsWithoutBackup) === false
      );
    }
  );
  
  // Test: setBackupEnabled functionality
  testRunner.addTest(
    'Settings Helpers - setBackupEnabled updates property',
    () => {
      // Create settings object
      const settings = {} as DreamMetricsSettings;
      
      // Set backup enabled to true
      setBackupEnabled(settings, true);
      const trueResult = settings.backupEnabled === true;
      
      // Set backup enabled to false
      setBackupEnabled(settings, false);
      const falseResult = settings.backupEnabled === false;
      
      return trueResult && falseResult;
    }
  );
  
  // Test: getBackupFolderPath functionality
  testRunner.addTest(
    'Settings Helpers - getBackupFolderPath correctly handles property',
    () => {
      // Test with property set
      const settingsWithPath = { backupFolderPath: '/path/to/backups' } as DreamMetricsSettings;
      // Test with empty property
      const settingsWithEmptyPath = { backupFolderPath: '' } as DreamMetricsSettings;
      // Test with missing property
      const settingsWithoutPath = {} as DreamMetricsSettings;
      
      return (
        getBackupFolderPath(settingsWithPath) === '/path/to/backups' &&
        getBackupFolderPath(settingsWithEmptyPath) === '' &&
        getBackupFolderPath(settingsWithoutPath) === ''
      );
    }
  );
  
  // Test: setBackupFolderPath functionality
  testRunner.addTest(
    'Settings Helpers - setBackupFolderPath updates property',
    () => {
      // Create settings object
      const settings = {} as DreamMetricsSettings;
      
      // Set the backup folder path
      setBackupFolderPath(settings, '/backup/folder/path');
      
      // Verify property is set
      return settings.backupFolderPath === '/backup/folder/path';
    }
  );
  
  // Test: getJournalStructure functionality
  testRunner.addTest(
    'Settings Helpers - getJournalStructure correctly handles both property names',
    () => {
      // Create test structure
      const testStructure: JournalStructureSettings = {
        enabled: true,
        rules: [],
        structures: [],
        templates: [],
        templaterIntegration: {
          enabled: false,
          folderPath: '',
          defaultTemplate: ''
        },
        contentIsolation: {
          ignoreImages: false,
          ignoreLinks: false,
          ignoreFormatting: false,
          ignoreHeadings: false,
          ignoreCodeBlocks: false,
          ignoreFrontmatter: false,
          ignoreComments: false,
          customIgnorePatterns: []
        },
        userInterface: {
          showInlineValidation: true,
          severityIndicators: {
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
          },
          quickFixesEnabled: true
        }
      };
      
      // Test with new property
      const settingsWithNew = { journalStructure: testStructure } as DreamMetricsSettings;
      // Test with legacy property
      const settingsWithLegacy = { linting: testStructure } as DreamMetricsSettings;
      // Test with both properties
      const settingsWithBoth = { 
        journalStructure: testStructure, 
        linting: { ...testStructure, enabled: false }
      } as DreamMetricsSettings;
      // Test with neither property
      const settingsWithNeither = {} as DreamMetricsSettings;
      
      return (
        getJournalStructure(settingsWithNew) === testStructure &&
        getJournalStructure(settingsWithLegacy) === testStructure &&
        getJournalStructure(settingsWithBoth) === testStructure &&
        getJournalStructure(settingsWithNeither) === undefined
      );
    }
  );
  
  // Test: setJournalStructure functionality
  testRunner.addTest(
    'Settings Helpers - setJournalStructure updates both property names',
    () => {
      // Create settings object
      const settings = {} as DreamMetricsSettings;
      
      // Create test structure
      const testStructure: JournalStructureSettings = {
        enabled: true,
        rules: [],
        structures: [],
        templates: [],
        templaterIntegration: {
          enabled: false,
          folderPath: '',
          defaultTemplate: ''
        },
        contentIsolation: {
          ignoreImages: false,
          ignoreLinks: false,
          ignoreFormatting: false,
          ignoreHeadings: false,
          ignoreCodeBlocks: false,
          ignoreFrontmatter: false,
          ignoreComments: false,
          customIgnorePatterns: []
        },
        userInterface: {
          showInlineValidation: true,
          severityIndicators: {
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
          },
          quickFixesEnabled: true
        }
      };
      
      // Set the journal structure
      setJournalStructure(settings, testStructure);
      
      // Verify both properties are set
      return (
        settings.journalStructure === testStructure &&
        settings.linting === testStructure
      );
    }
  );
  
  // Test: shouldShowRibbonButtons functionality
  testRunner.addTest(
    'Settings Helpers - shouldShowRibbonButtons correctly handles both property names',
    () => {
      // Test with new property true
      const settingsWithNewTrue = { showRibbonButtons: true } as DreamMetricsSettings;
      // Test with new property false
      const settingsWithNewFalse = { showRibbonButtons: false } as DreamMetricsSettings;
      // Test with legacy property true
      const settingsWithLegacyTrue = { showTestRibbonButton: true } as DreamMetricsSettings;
      // Test with legacy property false
      const settingsWithLegacyFalse = { showTestRibbonButton: false } as DreamMetricsSettings;
      // Test with both properties
      const settingsWithBoth = { 
        showRibbonButtons: true, 
        showTestRibbonButton: false 
      } as DreamMetricsSettings;
      // Test with neither property
      const settingsWithNeither = {} as DreamMetricsSettings;
      
      return (
        shouldShowRibbonButtons(settingsWithNewTrue) === true &&
        shouldShowRibbonButtons(settingsWithNewFalse) === false &&
        shouldShowRibbonButtons(settingsWithLegacyTrue) === true &&
        shouldShowRibbonButtons(settingsWithLegacyFalse) === false &&
        shouldShowRibbonButtons(settingsWithBoth) === true &&
        shouldShowRibbonButtons(settingsWithNeither) === false
      );
    }
  );
  
  // Test: setShowRibbonButtons functionality
  testRunner.addTest(
    'Settings Helpers - setShowRibbonButtons updates both property names',
    () => {
      // Create settings object
      const settings = {} as DreamMetricsSettings;
      
      // Set the ribbon buttons to true
      setShowRibbonButtons(settings, true);
      const trueResult = settings.showRibbonButtons === true && settings.showTestRibbonButton === true;
      
      // Set the ribbon buttons to false
      setShowRibbonButtons(settings, false);
      const falseResult = settings.showRibbonButtons === false && settings.showTestRibbonButton === false;
      
      return trueResult && falseResult;
    }
  );
  
  // Test: isDeveloperModeEnabled functionality
  testRunner.addTest(
    'Settings Helpers - isDeveloperModeEnabled correctly handles property',
    () => {
      // Test with enabled true
      const settingsWithDevModeTrue = { 
        developerMode: { enabled: true } 
      } as DreamMetricsSettings;
      
      // Test with enabled false
      const settingsWithDevModeFalse = { 
        developerMode: { enabled: false } 
      } as DreamMetricsSettings;
      
      // Test with developerMode object but no enabled property
      const settingsWithDevModeNoEnabled = { 
        developerMode: {} 
      } as DreamMetricsSettings;
      
      // Test with no developerMode object
      const settingsWithoutDevMode = {} as DreamMetricsSettings;
      
      return (
        isDeveloperModeEnabled(settingsWithDevModeTrue) === true &&
        isDeveloperModeEnabled(settingsWithDevModeFalse) === false &&
        isDeveloperModeEnabled(settingsWithDevModeNoEnabled) === false &&
        isDeveloperModeEnabled(settingsWithoutDevMode) === false
      );
    }
  );
  
  // Test: setDeveloperModeEnabled functionality
  testRunner.addTest(
    'Settings Helpers - setDeveloperModeEnabled updates property correctly',
    () => {
      // Test with existing developerMode object
      const settingsWithDevMode = { 
        developerMode: { enabled: false, showDebugRibbon: true } 
      } as DreamMetricsSettings;
      
      // Test with no developerMode object
      const settingsWithoutDevMode = {} as DreamMetricsSettings;
      
      // Set developer mode to true
      setDeveloperModeEnabled(settingsWithDevMode, true);
      setDeveloperModeEnabled(settingsWithoutDevMode, true);
      
      // Check that properties were set correctly
      const withDevModeResult = 
        settingsWithDevMode.developerMode.enabled === true &&
        settingsWithDevMode.developerMode.showDebugRibbon === true; // Should preserve existing props
      
      const withoutDevModeResult = 
        settingsWithoutDevMode.developerMode?.enabled === true;
      
      return withDevModeResult && withoutDevModeResult;
    }
  );
  
  // Test: getUIState functionality
  testRunner.addTest(
    'Settings Helpers - getUIState correctly handles property',
    () => {
      // Test with uiState object with properties
      const settingsWithUIState = { 
        projectNote: '',
        metrics: {},
        selectedNotes: [],
        selectedFolder: '',
        selectionMode: 'notes',
        calloutName: 'dream',
        showRibbonButtons: false,
        backupEnabled: false,
        backupFolderPath: '',
        logging: { level: 'info' },
        uiState: { 
          activeTab: 'metrics',
          lastFilter: 'today',
          customRanges: { 'last-week': { start: '2025-05-01', end: '2025-05-07' } }
        } 
      } as DreamMetricsSettings;
      
      // Test with empty uiState object
      const settingsWithEmptyUIState = { 
        uiState: {} 
      } as DreamMetricsSettings;
      
      // Test with no uiState object
      const settingsWithoutUIState = {} as DreamMetricsSettings;
      
      // Get UI state for each case
      const withUIState = getUIState(settingsWithUIState);
      const withEmptyUIState = getUIState(settingsWithEmptyUIState);
      const withoutUIState = getUIState(settingsWithoutUIState);
      
      return (
        withUIState.activeTab === 'metrics' &&
        withUIState.lastFilter === 'today' &&
        withUIState.customRanges['last-week'].start === '2025-05-01' &&
        Object.keys(withEmptyUIState).length === 0 &&
        Object.keys(withoutUIState).length === 0
      );
    }
  );
  
  // Test: setUIState functionality
  testRunner.addTest(
    'Settings Helpers - setUIState updates property',
    () => {
      // Create settings object
      const settings = {} as DreamMetricsSettings;
      
      // Create UI state to set
      const uiState = {
        activeTab: 'settings',
        lastFilter: 'all',
        layout: { collapsed: true }
      };
      
      // Set UI state
      setUIState(settings, uiState);
      
      // Check that property was set correctly
      return (
        settings.uiState?.activeTab === 'settings' &&
        settings.uiState?.lastFilter === 'all' &&
        settings.uiState?.layout?.collapsed === true
      );
    }
  );
  
  // Test: getActiveTab functionality
  testRunner.addTest(
    'Settings Helpers - getActiveTab correctly handles various property states',
    () => {
      // Test with activeTab property
      const settingsWithActiveTab = { 
        uiState: { activeTab: 'metrics' } 
      } as DreamMetricsSettings;
      
      // Test with legacy lastTab property
      const settingsWithLastTab = { 
        uiState: { lastTab: 'developer' } 
      } as any; // Using 'any' to bypass TypeScript checks for legacy property
      
      // Test with both properties
      const settingsWithBoth = { 
        uiState: { 
          activeTab: 'settings',
          lastTab: 'developer'
        } 
      } as any;
      
      // Test with neither property
      const settingsWithNeither = { 
        uiState: {} 
      } as DreamMetricsSettings;
      
      // Test with no uiState object
      const settingsWithoutUIState = {} as DreamMetricsSettings;
      
      return (
        getActiveTab(settingsWithActiveTab) === 'metrics' &&
        getActiveTab(settingsWithLastTab) === 'developer' &&
        getActiveTab(settingsWithBoth) === 'settings' && // activeTab takes precedence
        getActiveTab(settingsWithNeither) === 'general' && // default
        getActiveTab(settingsWithoutUIState) === 'general' // default
      );
    }
  );
  
  // Test: setActiveTab functionality
  testRunner.addTest(
    'Settings Helpers - setActiveTab updates property correctly',
    () => {
      // Test with existing uiState object
      const settingsWithUIState = { 
        uiState: { 
          activeTab: 'metrics',
          lastFilter: 'today'
        } 
      } as DreamMetricsSettings;
      
      // Test with no uiState object
      const settingsWithoutUIState = {} as DreamMetricsSettings;
      
      // Set active tab
      setActiveTab(settingsWithUIState, 'developer');
      setActiveTab(settingsWithoutUIState, 'settings');
      
      // Check that properties were set correctly
      const withUIStateResult = 
        settingsWithUIState.uiState?.activeTab === 'developer' &&
        (settingsWithUIState.uiState as any).lastTab === 'developer' && // legacy property
        settingsWithUIState.uiState?.lastFilter === 'today'; // should preserve existing props
      
      const withoutUIStateResult = 
        settingsWithoutUIState.uiState?.activeTab === 'settings' &&
        (settingsWithoutUIState.uiState as any).lastTab === 'settings';
      
      return withUIStateResult && withoutUIStateResult;
    }
  );
}

// Example of how to use these tests
export function runSettingsHelpersTests(): Promise<void> {
  console.log('Running settings helper tests...');
  
  const testRunner = TestRunner.create();
  registerSettingsHelpersTests(testRunner);
  
  return testRunner.runTests()
    .then(results => {
      const passedCount = results.filter(r => r.passed).length;
      console.log(`Settings helper tests complete: ${passedCount}/${results.length} tests passed`);
      
      // Log any failures
      results.filter(r => !r.passed).forEach(failure => {
        console.error(`Test failed: ${failure.name}`);
        if (failure.error) {
          console.error(failure.error);
        }
      });
    });
} 