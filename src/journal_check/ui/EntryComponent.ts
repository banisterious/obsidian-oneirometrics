/**
 * Entry Component
 * 
 * This file provides utilities for rendering and managing journal entry UI components
 * in a consistent manner across the application.
 */

import { setIcon } from 'obsidian';
import { EventableComponent } from '../../templates/ui/BaseComponent';
import { DreamEntry } from '../../types/declarations/dream-entry';

/**
 * Configuration options for entry component
 */
export interface EntryComponentOptions {
  entry: DreamEntry;
  showDate?: boolean;
  showContent?: boolean;
  showMetrics?: boolean;
  expandable?: boolean;
  compact?: boolean;
  maxContentLength?: number;
  onClick?: (entry: DreamEntry) => void;
  onExpand?: (entry: DreamEntry, expanded: boolean) => void;
}

/**
 * Default component options
 */
const DEFAULT_OPTIONS: Partial<EntryComponentOptions> = {
  showDate: true,
  showContent: true,
  showMetrics: true,
  expandable: true,
  compact: false,
  maxContentLength: 150
};

/**
 * Component for displaying and interacting with a journal entry
 */
export class EntryComponent extends EventableComponent {
  private entry: DreamEntry;
  private options: EntryComponentOptions;
  private dateElement: HTMLElement | null = null;
  private contentElement: HTMLElement | null = null;
  private metricsElement: HTMLElement | null = null;
  private expandButton: HTMLElement | null = null;
  private expanded: boolean = false;
  
  constructor(options: EntryComponentOptions) {
    // Set container and class name
    super({
      className: 'oom-entry-component'
    });
    
    this.entry = options.entry;
    
    // Merge with default options
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Add classes based on options
    if (this.options.compact) {
      this.container.addClass('oom-entry-compact');
    }
    
    // Register events
    this.registerDOMEvents();
  }
  
  /**
   * Register DOM event handlers
   */
  private registerDOMEvents(): void {
    // Click handler for the component
    if (this.options.onClick) {
      this.container.addEventListener('click', (e) => {
        // Don't trigger if clicking expand button
        if (this.expandButton && e.target === this.expandButton) {
          return;
        }
        
        this.options.onClick?.(this.entry);
        this.trigger('click', this.entry);
      });
    }
  }
  
  /**
   * Render the component
   */
  render(): void {
    this.container.empty();
    
    // Create date if enabled
    if (this.options.showDate && this.entry.date) {
      this.dateElement = this.container.createDiv({
        cls: 'oom-entry-date'
      });
      
      const formattedDate = typeof this.entry.date === 'string' 
        ? this.entry.date 
        : this.entry.date.toLocaleDateString();
      
      this.dateElement.textContent = formattedDate;
    }
    
    // Create content if enabled
    if (this.options.showContent && this.entry.content) {
      this.contentElement = this.container.createDiv({
        cls: 'oom-entry-content'
      });
      
      // Handle content display based on expanded state and max length
      if (!this.expanded && this.options.maxContentLength && 
          this.entry.content.length > this.options.maxContentLength) {
        // Show truncated content
        this.contentElement.textContent = 
          this.entry.content.substring(0, this.options.maxContentLength) + '...';
      } else {
        // Show full content
        this.contentElement.textContent = this.entry.content;
      }
      
      // Add expand button if needed
      if (this.options.expandable && 
          this.entry.content.length > (this.options.maxContentLength || 0)) {
        this.expandButton = this.container.createDiv({
          cls: 'oom-entry-expand-button'
        });
        
        setIcon(this.expandButton, this.expanded ? 'chevron-up' : 'chevron-down');
        this.expandButton.appendChild(document.createTextNode(
          this.expanded ? 'Show less' : 'Read more'
        ));
        
        this.expandButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleExpand();
        });
      }
    }
    
    // Create metrics section if enabled
    if (this.options.showMetrics && this.entry.metrics && this.entry.metrics.length > 0) {
      this.metricsElement = this.container.createDiv({
        cls: 'oom-entry-metrics'
      });
      
      // Create a list of metrics
      const metricsList = this.metricsElement.createDiv({
        cls: 'oom-entry-metrics-list'
      });
      
      for (const metric of this.entry.metrics) {
        const metricItem = metricsList.createDiv({
          cls: 'oom-entry-metric-item'
        });
        
        // Metric icon
        if (metric.icon) {
          const iconElement = metricItem.createSpan({
            cls: 'oom-entry-metric-icon'
          });
          
          setIcon(iconElement, metric.icon);
        }
        
        // Metric name and value
        metricItem.createSpan({
          cls: 'oom-entry-metric-name',
          text: metric.name + ': '
        });
        
        metricItem.createSpan({
          cls: 'oom-entry-metric-value',
          text: metric.value !== undefined ? metric.value.toString() : 'N/A'
        });
      }
    }
  }
  
  /**
   * Toggle expanded state
   */
  toggleExpand(): void {
    this.expanded = !this.expanded;
    
    // Update UI
    if (this.contentElement && this.entry.content) {
      if (this.expanded) {
        // Show full content
        this.contentElement.textContent = this.entry.content;
      } else if (this.options.maxContentLength) {
        // Show truncated content
        this.contentElement.textContent = 
          this.entry.content.substring(0, this.options.maxContentLength) + '...';
      }
    }
    
    // Update expand button
    if (this.expandButton) {
      this.expandButton.empty();
      setIcon(this.expandButton, this.expanded ? 'chevron-up' : 'chevron-down');
      this.expandButton.appendChild(document.createTextNode(
        this.expanded ? 'Show less' : 'Read more'
      ));
    }
    
    // Trigger callbacks
    this.options.onExpand?.(this.entry, this.expanded);
    this.trigger('expand', { entry: this.entry, expanded: this.expanded });
  }
  
  /**
   * Update the component with a new entry
   * @param entry New entry data
   */
  updateEntry(entry: DreamEntry): void {
    this.entry = entry;
    this.render();
  }
  
  /**
   * Get the current entry
   * @returns Current entry data
   */
  getEntry(): DreamEntry {
    return this.entry;
  }
  
  /**
   * Check if entry is expanded
   * @returns True if expanded
   */
  isExpanded(): boolean {
    return this.expanded;
  }
  
  /**
   * Set expanded state
   * @param expanded New expanded state
   */
  setExpanded(expanded: boolean): void {
    if (this.expanded !== expanded) {
      this.expanded = expanded;
      this.render();
    }
  }
}

/**
 * Adapts an entry object for UI display
 * @param entry The entry to adapt
 * @returns A standardized entry object suitable for UI display
 */
export function adaptEntryForUI(entry: DreamEntry): DreamEntry {
  // Create a copy to avoid modifying the original
  const adaptedEntry = { ...entry };
  
  // Ensure date is present and in a standard format
  if (adaptedEntry.date instanceof Date) {
    // Keep Date object
  } else if (typeof adaptedEntry.date === 'string') {
    // Try to parse the date
    const parsedDate = new Date(adaptedEntry.date);
    if (!isNaN(parsedDate.getTime())) {
      adaptedEntry.date = parsedDate;
    }
  } else if (!adaptedEntry.date) {
    // Set default date if missing
    adaptedEntry.date = new Date();
  }
  
  // Ensure content is a string
  if (adaptedEntry.content === undefined || adaptedEntry.content === null) {
    adaptedEntry.content = '';
  } else if (typeof adaptedEntry.content !== 'string') {
    adaptedEntry.content = String(adaptedEntry.content);
  }
  
  // Ensure metrics is an array
  if (!Array.isArray(adaptedEntry.metrics)) {
    adaptedEntry.metrics = [];
  }
  
  // Standardize metrics
  adaptedEntry.metrics = adaptedEntry.metrics.map(metric => {
    return {
      name: metric.name || 'Unnamed Metric',
      value: metric.value,
      icon: metric.icon || 'bar-chart'
    };
  });
  
  return adaptedEntry;
}

/**
 * Creates an entry component
 * @param options Component options
 * @returns A new EntryComponent instance
 */
export function createEntryComponent(options: EntryComponentOptions): EntryComponent {
  return new EntryComponent(options);
} 