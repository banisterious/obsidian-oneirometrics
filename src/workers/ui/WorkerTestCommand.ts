// Worker Test Command Integration
// Helper for adding web worker test command to the plugin

import { App, Plugin } from 'obsidian';
import { WebWorkerTestModal } from './WebWorkerTestModal';
import { DateNavigatorWorkerManager } from '../DateNavigatorWorkerManager';
import safeLogger from '../../logging/safe-logger';

/**
 * Add Web Worker test command to plugin
 * Available via Command Palette: "Test Web Workers (Phase 1)"
 */
export function addWorkerTestCommand(plugin: any): void {
    plugin.addCommand({
        id: 'test-web-workers-phase1',
        name: 'Test Web Workers (Phase 1)',
        callback: () => {
            try {
                const modal = new WebWorkerTestModal(plugin.app);
                modal.open();
                safeLogger.info('WorkerTest', 'Web Worker test modal opened');
            } catch (error) {
                safeLogger.error('WorkerTest', 'Failed to open Web Worker test modal', 
                    error instanceof Error ? error : new Error(String(error)));
            }
        }
    });
} 