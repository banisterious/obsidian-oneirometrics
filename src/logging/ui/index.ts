/**
 * Log UI Module
 * 
 * Exports and initializes the log viewer UI components.
 */

import { Plugin } from 'obsidian';
import { MemoryAdapter } from '../adapters/MemoryAdapter';
import { LogManager } from '../core/LogManager';
import { LogCommands } from './LogCommands';
import { LogViewerModal } from './LogViewerModal';

// Export UI components
export { LogCommands, LogViewerModal };

/**
 * Initialize the log viewer UI
 * 
 * @param plugin The Obsidian plugin instance
 * @returns The initialized components
 */
export function initializeLogUI(plugin: Plugin): {
  memoryAdapter: MemoryAdapter;
  logCommands: LogCommands;
} {
  // Create a memory adapter for storing logs
  const memoryAdapter = new MemoryAdapter();
  
  // Add the memory adapter to the log manager
  LogManager.getInstance().addAdapter(memoryAdapter);
  
  // Create commands object but don't register commands - logging functionality is now in Unified Test Suite
  const logCommands = new LogCommands(plugin, memoryAdapter);
  // logCommands.registerCommands(); // Commented out - commands integrated into Unified Test Suite
  
  // Ribbon icon removed - log viewer accessible via command palette
  
  return {
    memoryAdapter,
    logCommands
  };
} 