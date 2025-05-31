// Worker Test Command Integration
// Helper for adding web worker test command to the plugin

import { App, Plugin } from 'obsidian';
import { WebWorkerTestModal } from './WebWorkerTestModal';

/**
 * Adds the web worker test command to a plugin
 * Usage: addWorkerTestCommand(this) in the plugin's onload method
 */
export function addWorkerTestCommand(plugin: Plugin): void {
  plugin.addCommand({
    id: 'test-web-workers',
    name: 'Test Web Workers (Phase 1)',
    callback: () => {
      new WebWorkerTestModal(plugin.app).open();
    }
  });
}

/**
 * Alternative: Add as a ribbon button for easy access during development
 */
export function addWorkerTestRibbon(plugin: Plugin): HTMLElement {
  return plugin.addRibbonIcon('test-tube', 'Test Web Workers', () => {
    new WebWorkerTestModal(plugin.app).open();
  });
} 