import { App, Notice, TFile } from 'obsidian';
import { EventManager } from './index';
import { MetricsFilter } from '../filters/MetricsFilter';

/**
 * This file contains examples of how to use the new event system.
 * These examples are intended for reference only and are not used in the actual plugin.
 */

/**
 * Example of a component that subscribes to various events.
 */
export class EventConsumerExample {
  private subscriptions: Array<() => void> = [];
  private app: App;
  
  constructor(app: App) {
    this.app = app;
    this.initialize();
  }
  
  private initialize(): void {
    const events = EventManager.getInstance();
    
    // Subscribe to metrics events
    this.subscriptions.push(
      events.metrics.on('metrics:calculated', this.handleMetricsCalculated.bind(this))
    );
    
    // Subscribe to UI events
    this.subscriptions.push(
      events.ui.on('ui:contentToggled', this.handleContentToggled.bind(this))
    );
    
    // Subscribe to journal events
    this.subscriptions.push(
      events.journal.on('journal:entryProcessed', this.handleJournalEntryProcessed.bind(this))
    );
    
    // Subscribe to system events
    this.subscriptions.push(
      events.system.on('system:error', this.handleSystemError.bind(this))
    );
  }
  
  private handleMetricsCalculated(payload: { metrics: Record<string, number[]>; source: string }): void {
    console.log(`Metrics calculated from ${payload.source}`);
    console.log('Metrics data:', payload.metrics);
    
    // Example: Update UI based on new metrics
    const lucidityValues = payload.metrics['lucidity'] || [];
    if (lucidityValues.length > 0) {
      const avgLucidity = lucidityValues.reduce((sum, val) => sum + val, 0) / lucidityValues.length;
      console.log(`Average lucidity: ${avgLucidity.toFixed(2)}`);
    }
  }
  
  private handleContentToggled(payload: { contentId: string; isExpanded: boolean }): void {
    console.log(`Content ${payload.contentId} was ${payload.isExpanded ? 'expanded' : 'collapsed'}`);
    
    // Example: Update related UI elements based on content state
    if (payload.isExpanded) {
      // Update any related UI elements that should react to this content being expanded
    }
  }
  
  private handleJournalEntryProcessed(payload: { path: string; date: string; content: string }): void {
    console.log(`Journal entry processed: ${payload.path} (${payload.date})`);
    
    // Example: Update metrics when a new journal entry is processed
    const events = EventManager.getInstance();
    events.metrics.notifyMetricsCalculated({
      // Sample metrics data that would normally come from processing the entry
      'lucidity': [3, 4, 5],
      'vividness': [4, 5, 4]
    }, 'journal_update');
  }
  
  private handleSystemError(payload: { error: Error; context: string }): void {
    console.error(`Error in ${payload.context}:`, payload.error);
    
    // Example: Show a user-friendly error notification
    new Notice(`An error occurred in ${payload.context}: ${payload.error.message}`);
  }
  
  /**
   * Clean up all event subscriptions when component is destroyed.
   */
  public destroy(): void {
    // Unsubscribe from all events to prevent memory leaks
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}

/**
 * Example of a component that emits events.
 */
export class EventEmitterExample {
  private events: EventManager;
  
  constructor() {
    this.events = EventManager.getInstance();
  }
  
  /**
   * Example of emitting a metrics event.
   */
  public processMetrics(metrics: Record<string, number[]>): void {
    console.log('Processing metrics...');
    
    // Do some processing...
    
    // Notify that metrics have been calculated
    this.events.metrics.notifyMetricsCalculated(metrics, 'manual_calculation');
  }
  
  /**
   * Example of emitting a UI event.
   */
  public toggleContent(contentId: string, isExpanded: boolean): void {
    console.log(`Toggling content ${contentId} to ${isExpanded ? 'expanded' : 'collapsed'}`);
    
    // Update UI...
    
    // Notify that content was toggled
    this.events.ui.notifyContentToggled(contentId, isExpanded);
  }
  
  /**
   * Example of emitting a journal event.
   */
  public processJournalEntry(file: TFile, content: string): void {
    console.log(`Processing journal entry: ${file.path}`);
    
    try {
      // Process journal entry...
      const date = new Date().toISOString().split('T')[0]; // Just an example
      
      // Notify that entry was processed
      this.events.journal.notifyEntryProcessed(file.path, date, content);
    } catch (error) {
      // Handle error and notify
      console.error('Error processing journal entry:', error);
      this.events.journal.notifyEntryFailed(file.path, error as Error);
      
      // Also emit a system error
      this.events.system.notifyError(
        error as Error,
        'EventEmitterExample.processJournalEntry'
      );
    }
  }
  
  /**
   * Example of using a filter with events.
   */
  public applyDateFilter(startDate: Date, endDate: Date): void {
    // Create a filter
    const filter = new MetricsFilter();
    filter.setDateRange(startDate, endDate);
    
    // Apply the filter and notify
    this.events.metrics.notifyFilterApplied(filter);
  }
} 