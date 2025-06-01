/**
 * LogCommands - Registers log-related commands in Obsidian
 * 
 * This class registers commands for opening the log viewer,
 * clearing logs, etc.
 */

import { App, Notice, Plugin } from 'obsidian';
import { LogManager } from '../core/LogManager';
import { MemoryAdapter } from '../adapters/MemoryAdapter';
import { LogViewerModal } from './LogViewerModal';

/**
 * Manages log-related commands
 */
export class LogCommands {
  private plugin: Plugin;
  private memoryAdapter: MemoryAdapter;
  
  /**
   * Create a new log commands manager
   */
  constructor(plugin: Plugin, memoryAdapter: MemoryAdapter) {
    this.plugin = plugin;
    this.memoryAdapter = memoryAdapter;
  }
  
  /**
   * Check if logging is enabled (not set to "Off")
   */
  private isLoggingEnabled(): boolean {
    const settings = (this.plugin as any).settings;
    const logLevel = settings?.logging?.level || 'off';
    return logLevel !== 'off';
  }
  
  /**
   * Register all log-related commands
   */
  registerCommands(): void {
    // Command to open the log viewer
    this.plugin.addCommand({
      id: 'open-log-viewer',
      name: 'Open Log Viewer',
      checkCallback: (checking: boolean) => {
        if (!this.isLoggingEnabled()) return false;
        if (!checking) {
          new LogViewerModal(this.plugin.app, this.memoryAdapter).open();
        }
        return true;
      }
    });
    
    // Command to clear logs
    this.plugin.addCommand({
      id: 'clear-logs',
      name: 'Clear Logs',
      checkCallback: (checking: boolean) => {
        if (!this.isLoggingEnabled()) return false;
        if (!checking) {
          this.memoryAdapter.clear();
          new Notice('Logs cleared');
        }
        return true;
      }
    });
    
    // Command to copy recent logs to clipboard
    this.plugin.addCommand({
      id: 'copy-logs-to-clipboard',
      name: 'Copy Recent Logs to Clipboard',
      checkCallback: (checking: boolean) => {
        if (!this.isLoggingEnabled()) return false;
        if (!checking) {
          const logs = this.memoryAdapter.getEntries().slice(0, 50); // Get most recent 50 logs
          const logsText = logs.map(entry => 
            `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()} [${entry.category}] ${entry.message}`
          ).join('\n');
          
          navigator.clipboard.writeText(logsText).then(() => {
            new Notice('Recent logs copied to clipboard');
          }).catch(err => {
            new Notice('Failed to copy logs: ' + err.message);
          });
        }
        return true;
      }
    });
    
    // Command to export logs to file
    this.plugin.addCommand({
      id: 'export-logs',
      name: 'Export Logs to File',
      checkCallback: (checking: boolean) => {
        if (!this.isLoggingEnabled()) return false;
        if (!checking) {
          const logs = this.memoryAdapter.getEntries();
          const logsJson = JSON.stringify(logs, null, 2);
          
          const element = document.createElement('a');
          element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(logsJson));
          element.setAttribute('download', `logs-${new Date().toISOString()}.json`);
          
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          
          new Notice('Logs exported');
        }
        return true;
      }
    });
  }
  
  /**
   * Add a ribbon icon for quick access to the log viewer
   */
  addRibbonIcon(): void {
    // Only add ribbon if logging is enabled
    if (!this.isLoggingEnabled()) return;
    
    this.plugin.addRibbonIcon(
      'file-text-2', 
      'Open Log Viewer', 
      () => {
        new LogViewerModal(this.plugin.app, this.memoryAdapter).open();
      }
    );
  }
} 