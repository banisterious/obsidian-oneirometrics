/**
 * Entry Component
 * 
 * This file provides utilities for rendering and managing journal entry UI components
 * in a consistent manner across the application.
 */

import { setIcon } from 'obsidian';
import { EventableComponent } from '../../templates/ui/BaseComponent';
import type { DreamEntry } from '../../../src/types/declarations/dream-entry';

// Import directly from absolute path without the .ts extension
// This matches what main.ts is doing (line 114)
import { lucideIconMap } from '../../../settings';

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
 * Default options for the EntryComponent
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
 * Component for displaying and interacting with a dream entry
 */
export class EntryComponent extends EventableComponent {
  private entry: DreamEntry;
  private options: EntryComponentOptions;
  private expanded: boolean = false;
  private contentElement: HTMLElement | null = null;
  private expandButton: HTMLElement | null = null;
  
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
    
    // Create header section
    const header = this.container.createDiv({
      cls: 'oom-entry-header'
    });
    
    // Create date if enabled
    if (this.options.showDate) {
      const date = header.createDiv({
        cls: 'oom-entry-date',
        text: new Date(this.entry.date).toLocaleDateString()
      });
    }
    
    // Create title if available
    if (this.entry.title) {
      const title = header.createDiv({
        cls: 'oom-entry-title',
        text: this.entry.title
      });
    }
    
    // Create content if enabled
    if (this.options.showContent) {
      const contentContainer = this.container.createDiv({
        cls: 'oom-entry-content-container'
      });
      
      // Determine if content should be truncated
      let contentText = this.entry.content;
      let isTruncated = false;
      
      if (!this.expanded && this.options.maxContentLength && contentText.length > this.options.maxContentLength) {
        contentText = contentText.substring(0, this.options.maxContentLength) + '...';
        isTruncated = true;
      }
      
      // Create content element
      this.contentElement = contentContainer.createDiv({
        cls: 'oom-entry-content',
        text: contentText
      });
      
      // Add expand button if needed and expandable
      if ((isTruncated || this.options.expandable) && this.options.expandable) {
        this.expandButton = contentContainer.createSpan({
          cls: 'oom-entry-expand-button'
        });
        
        // Use direct HTML approach for expand icon
        const expandIcon = this.expanded ? 'chevron-up' : 'chevron-down';
        if (typeof lucideIconMap === 'object' && lucideIconMap && expandIcon in lucideIconMap) {
          this.expandButton.innerHTML = lucideIconMap[expandIcon];
        } else {
          setIcon(this.expandButton, expandIcon);
        }
        
        this.expandButton.addEventListener('click', (e) => {
          e.stopPropagation();
          
          this.expanded = !this.expanded;
          
          // Update content
          if (this.contentElement) {
            this.contentElement.setText(
              this.expanded ? this.entry.content : 
                (this.options.maxContentLength && this.entry.content.length > this.options.maxContentLength 
                  ? this.entry.content.substring(0, this.options.maxContentLength) + '...' 
                  : this.entry.content)
            );
          }
          
          // Update icon with direct HTML approach
          const newExpandIcon = this.expanded ? 'chevron-up' : 'chevron-down';
          if (typeof lucideIconMap === 'object' && lucideIconMap && newExpandIcon in lucideIconMap) {
            this.expandButton!.innerHTML = lucideIconMap[newExpandIcon];
          } else {
            setIcon(this.expandButton!, newExpandIcon);
          }
          
          // Trigger callbacks
          this.options.onExpand?.(this.entry, this.expanded);
          this.trigger('expand', { entry: this.entry, expanded: this.expanded });
        });
      }
    }
    
    // Create metrics if enabled and available
    if (this.options.showMetrics && this.entry.metrics && this.entry.metrics.length > 0) {
      const metricsContainer = this.container.createDiv({
        cls: 'oom-entry-metrics'
      });
      
      // Create a metric item for each metric
      this.entry.metrics.forEach(metric => {
        const metricItem = metricsContainer.createDiv({
          cls: 'oom-entry-metric-item'
        });
        
        // Metric icon
        if (metric.icon) {
          const iconElement = metricItem.createSpan({
            cls: 'oom-entry-metric-icon oom-metric-icon-svg'
          });
          
          // Direct HTML approach (based on main.ts line 2037)
          if (typeof lucideIconMap === 'object' && lucideIconMap && metric.icon in lucideIconMap) {
            // Use direct HTML with the SVG content from lucideIconMap
            iconElement.innerHTML = lucideIconMap[metric.icon];
          } else {
            // Fallback if lucideIconMap isn't available or doesn't contain the icon
            try {
              setIcon(iconElement, metric.icon);
              
              // If setIcon didn't work, use fallback
              if (!iconElement.querySelector('svg') && !iconElement.innerHTML.trim()) {
                iconElement.addClass('oom-icon-fallback');
                iconElement.setText(metric.icon.substring(0, 1).toUpperCase());
              }
            } catch (error) {
              // Fallback: Use the first letter of the icon name
              console.warn(`Failed to set icon ${metric.icon}:`, error);
              iconElement.addClass('oom-icon-fallback');
              iconElement.setText(metric.icon.substring(0, 1).toUpperCase());
            }
          }
        }
        
        // Metric name
        metricItem.createSpan({
          cls: 'oom-entry-metric-name',
          text: metric.name
        });
        
        // Metric value (if available)
        if ('value' in metric) {
          metricItem.createSpan({
            cls: 'oom-entry-metric-value',
            text: String(metric.value)
          });
        }
      });
    }
  }
  
  /**
   * Update the component with a new entry
   * @param entry New entry data
   */
  updateEntry(entry: DreamEntry): void {
    this.entry = entry;
    this.expanded = false;
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
   * Check if the content is expanded
   * @returns True if expanded, false otherwise
   */
  isExpanded(): boolean {
    return this.expanded;
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