/**
 * LogViewerModal - Interactive log viewer for Obsidian
 * 
 * This modal provides a UI for viewing, filtering, and searching logs
 * directly within Obsidian.
 */

import { App, Modal, Setting, TextComponent } from 'obsidian';
import { LogEntry, LogLevel } from '../LoggerTypes';
import { LogManager } from '../core/LogManager';
import { MemoryAdapter } from '../adapters/MemoryAdapter';

/**
 * Modal for viewing logs within Obsidian
 */
export class LogViewerModal extends Modal {
  private memoryAdapter: MemoryAdapter;
  private logContainer: HTMLElement;
  private filterLevel: LogLevel = 'info';
  private filterCategory: string = '';
  private filterText: string = '';
  private autoRefresh: boolean = true;
  private refreshInterval: number | null = null;
  
  /**
   * Create a new log viewer modal
   */
  constructor(app: App, memoryAdapter: MemoryAdapter) {
    super(app);
    this.memoryAdapter = memoryAdapter;
  }
  
  /**
   * Initialize the modal when it opens
   */
  onOpen() {
    // Set up the modal container
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('oom-log-viewer-modal');
    
    contentEl.createEl('h2', { text: 'Log Viewer' });
    
    // Create filter controls
    this.createFilterControls(contentEl);
    
    // Create action buttons
    this.createActionButtons(contentEl);
    
    // Create log container
    this.logContainer = contentEl.createDiv({ cls: 'oom-log-container' });
    
    // Initial log display
    this.refreshLogs();
    
    // Set up auto-refresh if enabled
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }
  
  /**
   * Clean up when the modal closes
   */
  onClose() {
    // Clean up the auto-refresh interval
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    // Clear the container
    const { contentEl } = this;
    contentEl.empty();
  }
  
  /**
   * Create filter controls for the logs
   */
  private createFilterControls(containerEl: HTMLElement) {
    const filterContainer = containerEl.createDiv({ cls: 'oom-log-filters' });
    
    // Level filter
    new Setting(filterContainer)
      .setName('Log Level')
      .setDesc('Show logs at or above this level')
      .addDropdown(dropdown => {
        dropdown
          .addOption('trace', 'Trace')
          .addOption('debug', 'Debug')
          .addOption('info', 'Info')
          .addOption('warn', 'Warning')
          .addOption('error', 'Error')
          .setValue(this.filterLevel)
          .onChange(value => {
            this.filterLevel = value as LogLevel;
            this.refreshLogs();
          });
      });
    
    // Category filter
    new Setting(filterContainer)
      .setName('Category')
      .setDesc('Filter by category (empty for all)')
      .addText(text => {
        text
          .setPlaceholder('Category filter')
          .setValue(this.filterCategory)
          .onChange(value => {
            this.filterCategory = value;
            this.refreshLogs();
          });
      });
    
    // Text search
    new Setting(filterContainer)
      .setName('Search')
      .setDesc('Search in log messages')
      .addText(text => {
        text
          .setPlaceholder('Search text')
          .setValue(this.filterText)
          .onChange(value => {
            this.filterText = value;
            this.refreshLogs();
          });
      });
    
    // Auto-refresh toggle
    new Setting(filterContainer)
      .setName('Auto-refresh')
      .setDesc('Automatically refresh logs')
      .addToggle(toggle => {
        toggle
          .setValue(this.autoRefresh)
          .onChange(value => {
            this.autoRefresh = value;
            if (value) {
              this.startAutoRefresh();
            } else if (this.refreshInterval) {
              window.clearInterval(this.refreshInterval);
              this.refreshInterval = null;
            }
          });
      });
  }
  
  /**
   * Create action buttons for the log viewer
   */
  private createActionButtons(containerEl: HTMLElement) {
    const buttonContainer = containerEl.createDiv({ cls: 'oom-log-actions' });
    
    // Refresh button
    const refreshButton = buttonContainer.createEl('button', { text: 'Refresh' });
    refreshButton.addEventListener('click', () => {
      this.refreshLogs();
    });
    
    // Clear logs button
    const clearButton = buttonContainer.createEl('button', { text: 'Clear Logs' });
    clearButton.addEventListener('click', () => {
      this.memoryAdapter.clear();
      this.refreshLogs();
    });
    
    // Export logs button
    const exportButton = buttonContainer.createEl('button', { text: 'Export Logs' });
    exportButton.addEventListener('click', () => {
      this.exportLogs();
    });
  }
  
  /**
   * Start auto-refreshing the logs
   */
  private startAutoRefresh() {
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = window.setInterval(() => {
      this.refreshLogs();
    }, 1000); // Refresh every second
  }
  
  /**
   * Refresh the logs displayed in the container
   */
  private refreshLogs() {
    // Clear the container
    this.logContainer.empty();
    
    // Get filtered logs
    const logs = this.filterLogs(this.memoryAdapter.getEntries());
    
    if (logs.length === 0) {
      this.logContainer.createEl('p', { 
        text: 'No logs match the current filters', 
        cls: 'oom-log-empty' 
      });
      return;
    }
    
    // Create a container for the logs
    const logList = this.logContainer.createEl('div', { cls: 'oom-log-entries' });
    
    // Add each log entry
    logs.forEach(entry => {
      const logEntry = logList.createEl('div', { cls: `oom-log-entry oom-log-${entry.level}` });
      
      // Format timestamp
      const timestamp = entry.timestamp.toISOString();
      logEntry.createEl('span', { text: timestamp, cls: 'oom-log-timestamp' });
      
      // Format level
      logEntry.createEl('span', { 
        text: entry.level.toUpperCase(), 
        cls: `oom-log-level oom-log-level-${entry.level}` 
      });
      
      // Format category
      logEntry.createEl('span', { text: entry.category, cls: 'oom-log-category' });
      
      // Format message
      logEntry.createEl('span', { text: entry.message, cls: 'oom-log-message' });
      
      // Add data if present
      if (entry.data) {
        const dataContainer = logEntry.createEl('div', { cls: 'oom-log-data' });
        try {
          const dataStr = typeof entry.data === 'string' 
            ? entry.data 
            : JSON.stringify(entry.data, null, 2);
          dataContainer.createEl('pre', { text: dataStr });
        } catch (error) {
          dataContainer.createEl('p', { text: `[Could not stringify data: ${error}]` });
        }
      }
      
      // Add error details if present
      if (entry.error) {
        const errorContainer = logEntry.createEl('div', { cls: 'oom-log-error' });
        errorContainer.createEl('p', { text: `Error: ${entry.error.message}` });
        
        if (entry.error.stack) {
          errorContainer.createEl('pre', { text: entry.error.stack });
        }
      }
    });
  }
  
  /**
   * Filter logs based on the current filter settings
   */
  private filterLogs(logs: LogEntry[]): LogEntry[] {
    const levelValues: Record<LogLevel, number> = {
      'off': 0,
      'error': 1,
      'warn': 2,
      'info': 3,
      'debug': 4,
      'trace': 5
    };
    
    const minLevelValue = levelValues[this.filterLevel];
    
    return logs.filter(entry => {
      // Filter by level
      if (levelValues[entry.level] > minLevelValue) {
        return false;
      }
      
      // Filter by category
      if (this.filterCategory && !entry.category.toLowerCase().includes(this.filterCategory.toLowerCase())) {
        return false;
      }
      
      // Filter by text
      if (this.filterText) {
        const textToSearch = (entry.message + ' ' + JSON.stringify(entry.data || '')).toLowerCase();
        if (!textToSearch.includes(this.filterText.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Export logs to a file
   */
  private exportLogs() {
    // Get filtered logs
    const logs = this.filterLogs(this.memoryAdapter.getEntries());
    
    // Format logs as JSON
    const logsJson = JSON.stringify(logs, null, 2);
    
    // Create a download link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(logsJson));
    element.setAttribute('download', `logs-${new Date().toISOString()}.json`);
    
    // Simulate click to download
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
} 