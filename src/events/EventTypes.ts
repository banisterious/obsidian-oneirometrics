import { Modal, TFile } from 'obsidian';
import { MetricsFilter } from '../filters/MetricsFilter';

/**
 * Metrics-related events definitions
 */
export interface MetricsEvents {
  /**
   * Emitted when metrics have been calculated from dream journal entries.
   * 
   * @property metrics - The calculated metrics data
   * @property source - Source of the metrics (e.g., "manual", "scheduled")
   */
  'metrics:calculated': { 
    metrics: Record<string, number[]>; 
    source: string;
  };
  
  /**
   * Emitted when metrics should be displayed in a specific UI element.
   * 
   * @property target - The HTML element where metrics should be displayed
   * @property metrics - The metrics data to display
   */
  'metrics:display': { 
    target: HTMLElement; 
    metrics: Record<string, number[]>; 
  };
  
  /**
   * Emitted when a metrics filter is applied.
   * 
   * @property filter - The filter being applied
   */
  'metrics:filter': { 
    filter: MetricsFilter;
  };
  
  /**
   * Emitted when an individual metric value changes.
   * 
   * @property name - The name of the metric
   * @property oldValue - The previous value
   * @property newValue - The new value
   * @property source - Source of the change
   */
  'metrics:valueChanged': {
    name: string;
    oldValue: number;
    newValue: number;
    source: string;
  };
}

/**
 * UI-related events definitions
 */
export interface UIEvents {
  /**
   * Emitted when a modal is opened.
   * 
   * @property modalType - The type of modal being opened
   * @property modal - The modal instance
   */
  'ui:modalOpened': { 
    modalType: string; 
    modal: Modal;
  };
  
  /**
   * Emitted when a modal is closed.
   * 
   * @property modalType - The type of modal that was closed
   */
  'ui:modalClosed': { 
    modalType: string;
  };
  
  /**
   * Emitted when the current view changes.
   * 
   * @property view - The new view
   * @property previousView - The previous view
   */
  'ui:viewChanged': { 
    view: string; 
    previousView: string;
  };
  
  /**
   * Emitted when content visibility is toggled.
   * 
   * @property contentId - The ID of the content
   * @property isExpanded - Whether the content is expanded or collapsed
   */
  'ui:contentToggled': {
    contentId: string;
    isExpanded: boolean;
  };
}

/**
 * Journal-related events definitions
 */
export interface JournalEvents {
  /**
   * Emitted when a journal entry has been processed.
   * 
   * @property path - The file path of the journal entry
   * @property date - The date of the entry
   * @property content - The content of the entry
   */
  'journal:entryProcessed': { 
    path: string; 
    date: string; 
    content: string;
  };
  
  /**
   * Emitted when processing a journal entry fails.
   * 
   * @property path - The file path of the journal entry
   * @property error - The error that occurred
   */
  'journal:entryFailed': { 
    path: string; 
    error: Error;
  };
  
  /**
   * Emitted when a journal scan is completed.
   * 
   * @property totalEntries - The total number of entries found
   * @property processedEntries - The number of entries successfully processed
   */
  'journal:scanCompleted': { 
    totalEntries: number; 
    processedEntries: number;
  };
  
  /**
   * Emitted when a journal entry is modified.
   * 
   * @property file - The file that was modified
   * @property previousContent - The previous content of the file
   * @property newContent - The new content of the file
   */
  'journal:entryModified': {
    file: TFile;
    previousContent?: string;
    newContent: string;
  };
}

/**
 * System-level events definitions
 */
export interface SystemEvents {
  /**
   * Emitted when a plugin setting is changed.
   * 
   * @property key - The setting key that changed
   * @property value - The new value
   * @property previousValue - The previous value
   */
  'system:settingChanged': {
    key: string;
    value: any;
    previousValue: any;
  };
  
  /**
   * Emitted when the plugin is loaded.
   * 
   * @property timestamp - When the plugin was loaded
   * @property version - The plugin version
   */
  'system:pluginLoaded': {
    timestamp: number;
    version: string;
  };
  
  /**
   * Emitted when the plugin is unloaded.
   * 
   * @property timestamp - When the plugin was unloaded
   */
  'system:pluginUnloaded': {
    timestamp: number;
  };
  
  /**
   * Emitted when an error occurs within the plugin.
   * 
   * @property error - The error that occurred
   * @property context - Additional context about where the error occurred
   */
  'system:error': {
    error: Error;
    context: string;
  };
} 