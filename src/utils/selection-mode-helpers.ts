import { SelectionMode, mapSelectionMode, mapLegacySelectionMode } from '../types/core';

/**
 * Updates any SelectionMode comparisons in the code to ensure they work correctly
 * with either 'manual'/'automatic' or 'notes'/'folder' values.
 * 
 * This is needed because different parts of the codebase use different values
 * for the same concepts.
 */

/**
 * Checks if a selection mode is equivalent to 'folder' mode
 * (either 'folder' or 'automatic')
 * @param mode The selection mode to check
 * @returns True if the mode is folder-based
 */
export function isFolderMode(mode: SelectionMode): boolean {
  return mode === 'folder' || mode === 'automatic';
}

/**
 * Checks if a selection mode is equivalent to 'notes' mode
 * (either 'notes' or 'manual')
 * @param mode The selection mode to check
 * @returns True if the mode is notes-based
 */
export function isNotesMode(mode: SelectionMode): boolean {
  return mode === 'notes' || mode === 'manual';
}

/**
 * Compares two selection modes for equality,
 * handling equivalence between 'folder'/'automatic' and 'notes'/'manual'
 * @param mode1 First selection mode to compare
 * @param mode2 Second selection mode to compare
 * @returns True if the modes are equivalent
 */
export function areSelectionModesEquivalent(
  mode1: SelectionMode, 
  mode2: SelectionMode
): boolean {
  // Direct equality
  if (mode1 === mode2) {
    return true;
  }
  
  // Check equivalence
  if ((mode1 === 'notes' && mode2 === 'manual') || 
      (mode1 === 'manual' && mode2 === 'notes')) {
    return true;
  }
  
  if ((mode1 === 'folder' && mode2 === 'automatic') || 
      (mode1 === 'automatic' && mode2 === 'folder')) {
    return true;
  }
  
  return false;
}

/**
 * Gets a user-friendly label for the selection mode
 * @param mode The selection mode
 * @returns A user-friendly label
 */
export function getSelectionModeLabel(mode: SelectionMode): string {
  return isFolderMode(mode) ? 'Selected Folder' : 'Selected Notes';
}

/**
 * Gets a user-friendly description for the selection mode
 * @param mode The selection mode
 * @returns A user-friendly description
 */
export function getSelectionModeDescription(mode: SelectionMode): string {
  return isFolderMode(mode) 
    ? 'Process all notes in a folder' 
    : 'Select individual notes to process';
}

/**
 * Normalizes a selection mode to the new format ('manual'/'automatic')
 * @param mode The selection mode to normalize
 * @returns The normalized selection mode
 */
export function normalizeSelectionMode(mode: SelectionMode): 'manual' | 'automatic' {
  return mapSelectionMode(mode);
}

/**
 * Normalizes a selection mode to the legacy format ('notes'/'folder')
 * @param mode The selection mode to normalize
 * @returns The normalized selection mode
 */
export function normalizeLegacySelectionMode(mode: SelectionMode): 'notes' | 'folder' {
  return mapLegacySelectionMode(mode);
}

/**
 * Returns a compatible selection mode value based on the requested format
 * This function converts between UI and internal representations of selection modes
 * @param mode The current selection mode
 * @param format The format to convert to: 'ui' (notes/folder) or 'internal' (manual/automatic)
 * @returns A compatible selection mode string
 */
export function getCompatibleSelectionMode(
  mode: string, 
  format: 'ui' | 'internal'
): string {
  if (format === 'ui') {
    if (mode === 'manual') return 'notes';
    if (mode === 'automatic') return 'folder';
    return mode;
  } else {
    if (mode === 'notes') return 'manual';
    if (mode === 'folder') return 'automatic';
    return mode;
  }
} 