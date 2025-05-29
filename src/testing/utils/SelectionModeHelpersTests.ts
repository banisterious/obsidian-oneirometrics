/**
 * Unit tests for selection-mode-helpers.ts
 * 
 * These tests verify the proper functionality of all helper functions
 * for handling selection mode compatibility.
 */

import { SelectionMode } from '../../types/core';
import { 
  isFolderMode,
  isNotesMode,
  areSelectionModesEquivalent,
  getSelectionModeLabel,
  getSelectionModeDescription,
  normalizeSelectionMode,
  normalizeLegacySelectionMode,
  getCompatibleSelectionMode
} from '../../utils/selection-mode-helpers';
import { TestRunner } from '../TestRunner';
import { getLogger } from '../../logging';

/**
 * Registers all selection mode helper tests with the test runner
 * @param testRunner The test runner to register tests with
 */
export function registerSelectionModeHelperTests(
  testRunner: TestRunner
): void {
  // Test: isFolderMode functionality
  testRunner.addTest(
    'Selection Mode Helpers - isFolderMode correctly identifies folder modes',
    () => {
      // Test with all possible values
      const folderModesCorrect = 
        isFolderMode('folder') === true &&
        isFolderMode('automatic') === true &&
        isFolderMode('notes') === false &&
        isFolderMode('manual') === false;
      
      return folderModesCorrect;
    }
  );
  
  // Test: isNotesMode functionality
  testRunner.addTest(
    'Selection Mode Helpers - isNotesMode correctly identifies notes modes',
    () => {
      // Test with all possible values
      const notesModesCorrect = 
        isNotesMode('notes') === true &&
        isNotesMode('manual') === true &&
        isNotesMode('folder') === false &&
        isNotesMode('automatic') === false;
      
      return notesModesCorrect;
    }
  );
  
  // Test: areSelectionModesEquivalent functionality
  testRunner.addTest(
    'Selection Mode Helpers - areSelectionModesEquivalent correctly compares modes',
    () => {
      // Same values should be equivalent
      const sameValuesCorrect = 
        areSelectionModesEquivalent('notes', 'notes') === true &&
        areSelectionModesEquivalent('folder', 'folder') === true &&
        areSelectionModesEquivalent('manual', 'manual') === true &&
        areSelectionModesEquivalent('automatic', 'automatic') === true;
      
      // Equivalent values should be equivalent
      const equivalentValuesCorrect = 
        areSelectionModesEquivalent('notes', 'manual') === true &&
        areSelectionModesEquivalent('manual', 'notes') === true &&
        areSelectionModesEquivalent('folder', 'automatic') === true &&
        areSelectionModesEquivalent('automatic', 'folder') === true;
      
      // Different values should not be equivalent
      const differentValuesCorrect = 
        areSelectionModesEquivalent('notes', 'folder') === false &&
        areSelectionModesEquivalent('manual', 'automatic') === false &&
        areSelectionModesEquivalent('folder', 'manual') === false &&
        areSelectionModesEquivalent('automatic', 'notes') === false;
      
      return sameValuesCorrect && equivalentValuesCorrect && differentValuesCorrect;
    }
  );
  
  // Test: getSelectionModeLabel functionality
  testRunner.addTest(
    'Selection Mode Helpers - getSelectionModeLabel returns correct labels',
    () => {
      // Notes/manual modes should return "Selected Notes"
      const notesLabelsCorrect = 
        getSelectionModeLabel('notes') === 'Selected Notes' &&
        getSelectionModeLabel('manual') === 'Selected Notes';
      
      // Folder/automatic modes should return "Selected Folder"
      const folderLabelsCorrect = 
        getSelectionModeLabel('folder') === 'Selected Folder' &&
        getSelectionModeLabel('automatic') === 'Selected Folder';
      
      return notesLabelsCorrect && folderLabelsCorrect;
    }
  );
  
  // Test: getSelectionModeDescription functionality
  testRunner.addTest(
    'Selection Mode Helpers - getSelectionModeDescription returns correct descriptions',
    () => {
      // Notes/manual modes should return description for selecting individual notes
      const notesDescriptionsCorrect = 
        getSelectionModeDescription('notes') === 'Select individual notes to process' &&
        getSelectionModeDescription('manual') === 'Select individual notes to process';
      
      // Folder/automatic modes should return description for processing folder
      const folderDescriptionsCorrect = 
        getSelectionModeDescription('folder') === 'Process all notes in a folder' &&
        getSelectionModeDescription('automatic') === 'Process all notes in a folder';
      
      return notesDescriptionsCorrect && folderDescriptionsCorrect;
    }
  );
  
  // Test: normalizeSelectionMode functionality
  testRunner.addTest(
    'Selection Mode Helpers - normalizeSelectionMode correctly normalizes to internal format',
    () => {
      const correctNormalization = 
        normalizeSelectionMode('notes') === 'manual' &&
        normalizeSelectionMode('folder') === 'automatic' &&
        normalizeSelectionMode('manual') === 'manual' &&
        normalizeSelectionMode('automatic') === 'automatic';
      
      return correctNormalization;
    }
  );
  
  // Test: normalizeLegacySelectionMode functionality
  testRunner.addTest(
    'Selection Mode Helpers - normalizeLegacySelectionMode correctly normalizes to UI format',
    () => {
      const correctNormalization = 
        normalizeLegacySelectionMode('manual') === 'notes' &&
        normalizeLegacySelectionMode('automatic') === 'folder' &&
        normalizeLegacySelectionMode('notes') === 'notes' &&
        normalizeLegacySelectionMode('folder') === 'folder';
      
      return correctNormalization;
    }
  );
  
  // Test: getCompatibleSelectionMode functionality with UI format
  testRunner.addTest(
    'Selection Mode Helpers - getCompatibleSelectionMode correctly converts to UI format',
    () => {
      const correctConversion = 
        getCompatibleSelectionMode('manual', 'ui') === 'notes' &&
        getCompatibleSelectionMode('automatic', 'ui') === 'folder' &&
        getCompatibleSelectionMode('notes', 'ui') === 'notes' &&
        getCompatibleSelectionMode('folder', 'ui') === 'folder';
      
      return correctConversion;
    }
  );
  
  // Test: getCompatibleSelectionMode functionality with internal format
  testRunner.addTest(
    'Selection Mode Helpers - getCompatibleSelectionMode correctly converts to internal format',
    () => {
      const correctConversion = 
        getCompatibleSelectionMode('notes', 'internal') === 'manual' &&
        getCompatibleSelectionMode('folder', 'internal') === 'automatic' &&
        getCompatibleSelectionMode('manual', 'internal') === 'manual' &&
        getCompatibleSelectionMode('automatic', 'internal') === 'automatic';
      
      return correctConversion;
    }
  );
}

// Example of how to use these tests
export function runSelectionModeHelperTests(): Promise<void> {
  const logger = getLogger('SelectionModeHelpersTests');
  logger.info('Test', 'Running selection mode helper tests...');
  
  const testRunner = TestRunner.create();
  registerSelectionModeHelperTests(testRunner);
  
  return testRunner.runTests()
    .then(results => {
      const passedCount = results.filter(r => r.passed).length;
      logger.info('Test', `Selection mode helper tests complete: ${passedCount}/${results.length} tests passed`);
      
      // Log any failures
      results.filter(r => !r.passed).forEach(failure => {
        logger.error('Test', `Test failed: ${failure.name}`);
        if (failure.error) {
          logger.error('Test', 'Error details:', failure.error);
        }
      });
    });
} 