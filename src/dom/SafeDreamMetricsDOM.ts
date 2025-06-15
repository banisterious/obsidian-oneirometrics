/**
 * SafeDreamMetricsDOM - Enhanced DreamMetricsDOM with defensive coding patterns
 * 
 * This class implements robust DOM operations for dream metrics visualization with
 * comprehensive error handling, fallbacks, and recovery mechanisms.
 * 
 * CSS INLINE STYLES DOCUMENTATION:
 * This file contains 6 intentional CSS custom property assignments for table virtualization.
 * These cannot be converted to static CSS classes because they set dynamic values for:
 * 
 * 1. --oom-visible-rows: Number of visible rows in viewport (dynamic based on container height)
 * 2. --oom-row-height: Row height in pixels (configurable performance optimization)
 * 3. --oom-total-rows: Total number of rows for scroll calculation (data-dependent)
 * 4. --oom-row-index: Individual row position for virtualization (dynamic per row)
 * 
 * These CSS custom properties are essential for the virtual scrolling performance system
 * that enables smooth handling of large datasets without DOM performance degradation.
 * The virtualization system requires dynamic values that cannot be predetermined.
 */

import { App } from 'obsidian';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricData } from '../types/core';
import { DateRangeFilter } from '../filters/DateRangeFilter';
import { withErrorHandling } from '../utils/defensive-utils';
import { DOMSafetyGuard } from './DOMSafetyGuard';
import { DOMErrorBoundary } from './DOMErrorBoundary';
import { DOMComponent } from './NullDOM';
import { EventBus } from '../events/EventBus';
import safeLogger from '../logging/safe-logger';
import { error } from '../logging';

// Add id to the interface or augment DreamMetricData with an optional id property
interface EnhancedDreamMetricData extends DreamMetricData {
  id?: string;
}

export class SafeDreamMetricsDOM implements DOMComponent {
  // Core dependencies
  private container: HTMLElement;
  private state: DreamMetricsState;
  private app: App;
  
  // Utility instances
  private domSafetyGuard: DOMSafetyGuard;
  private eventBus: EventBus;
  private errorBoundaries: Map<string, DOMErrorBoundary> = new Map();
  
  // Component state
  private dateRangeFilter: DateRangeFilter;
  private cleanupFunctions: (() => void)[] = [];
  private expandedRows: Set<string> = new Set();
  private isRendering: boolean = false;
  
  // Virtualization settings
  private VISIBLE_ROWS = 12; // Reduced from 20 for better performance
  private ROW_HEIGHT = 50; // px
  
  /**
   * Creates a new SafeDreamMetricsDOM instance
   */
  constructor(app: App, container: HTMLElement, state: DreamMetricsState) {
    this.app = app;
    this.container = container;
    this.state = state;
    this.dateRangeFilter = new DateRangeFilter(state);
    this.domSafetyGuard = DOMSafetyGuard.getInstance();
    this.eventBus = EventBus.getInstance();
    
    // Register for state change events
    this.registerEventListeners();
  }
  
  /**
   * Registers event listeners with error handling
   */
  private registerEventListeners(): void {
    // Listen for state changes
    const stateChangeUnsubscribe = this.eventBus.subscribe('state:changed', () => {
      this.safeUpdate();
    });
    
    // Listen for filter changes
    const filterChangeUnsubscribe = this.eventBus.subscribe('filter:changed', () => {
      this.safeUpdate();
    });
    
    // Add to cleanup functions
    this.cleanupFunctions.push(stateChangeUnsubscribe);
    this.cleanupFunctions.push(filterChangeUnsubscribe);
  }
  
  /**
   * Safely updates the UI with error handling
   */
  private safeUpdate = withErrorHandling(
    (): void => {
      // Avoid concurrent updates
      if (this.isRendering) {
        safeLogger.debug('DOM', 'Update requested while already rendering, will be skipped');
        return;
      }
      
      // Re-render the UI
      this.render();
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to update dream metrics DOM",
      onError: (error) => safeLogger.error('DOM', 'Error updating UI', error)
    }
  );
  
  /**
   * Renders the dream metrics visualization with error handling
   */
  public render(): void {
    try {
      safeLogger.debug('DOM', 'Starting render');
      this.isRendering = true;
      
      // Clear container
      this.domSafetyGuard.clearElement(this.container);
      this.container.classList.add('oom-container');
      
      // Create error boundaries for main components
      this.createErrorBoundaries();
      
      // Render components within error boundaries
      this.renderFiltersWithErrorBoundary();
      this.renderMetricsTableWithErrorBoundary();
      
      this.isRendering = false;
      safeLogger.debug('DOM', 'Render completed successfully');
    } catch (error) {
      this.isRendering = false;
      safeLogger.error('DOM', 'Critical error in render method', error);
      this.showFallbackUI();
    }
  }
  
  /**
   * Creates error boundaries for major UI components
   */
  private createErrorBoundaries(): void {
    // Create filter error boundary if it doesn't exist
    if (!this.errorBoundaries.has('filters')) {
      const filterContainer = this.domSafetyGuard.createElement('div', {
        className: 'oom-filter-container-wrapper',
        parent: this.container
      });
      
      const filterErrorBoundary = new DOMErrorBoundary(filterContainer, {
        componentName: 'DreamMetricsFilters',
        fallbackContent: 'Unable to display filters. Try reloading.',
        onError: (error) => {
          safeLogger.error('DOM', 'Error in filters component', error);
          this.eventBus.publish('error', {
            component: 'DreamMetricsFilters',
            error
          });
        }
      });
      
      this.errorBoundaries.set('filters', filterErrorBoundary);
    }
    
    // Create table error boundary if it doesn't exist
    if (!this.errorBoundaries.has('table')) {
      const tableContainer = this.domSafetyGuard.createElement('div', {
        className: 'oom-table-container-wrapper',
        parent: this.container
      });
      
      const tableErrorBoundary = new DOMErrorBoundary(tableContainer, {
        componentName: 'DreamMetricsTable',
        fallbackContent: 'Unable to display metrics table. Try reloading.',
        onError: (error) => {
          safeLogger.error('DOM', 'Error in table component', error);
          this.eventBus.publish('error', {
            component: 'DreamMetricsTable',
            error
          });
        }
      });
      
      this.errorBoundaries.set('table', tableErrorBoundary);
    }
  }
  
  /**
   * Renders filters within an error boundary
   */
  private renderFiltersWithErrorBoundary(): void {
    const filterErrorBoundary = this.errorBoundaries.get('filters');
    if (!filterErrorBoundary) {
      safeLogger.error('DOM', 'Filter error boundary not found');
      return;
    }
    
    filterErrorBoundary.render((container) => {
      this.renderFilters(container);
    });
  }
  
  /**
   * Renders metrics table within an error boundary
   */
  private renderMetricsTableWithErrorBoundary(): void {
    const tableErrorBoundary = this.errorBoundaries.get('table');
    if (!tableErrorBoundary) {
      safeLogger.error('DOM', 'Table error boundary not found');
      return;
    }
    
    tableErrorBoundary.render((container) => {
      this.renderMetricsTable(container);
    });
  }
  
  /**
   * Renders filter components with defensive patterns
   */
  private renderFilters = withErrorHandling(
    (container: HTMLElement): void => {
      const filterContainer = this.domSafetyGuard.createElement('div', {
        className: 'oom-filter-container',
        parent: container
      });
      
      // Render date range filter
      this.dateRangeFilter.render(filterContainer);
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to render filters",
      onError: (error) => safeLogger.error('DOM', 'Error rendering filters', error)
    }
  );
  
  /**
   * Renders metrics table with defensive patterns
   */
  private renderMetricsTable = withErrorHandling(
    (container: HTMLElement): void => {
      // Use requestAnimationFrame to batch DOM updates
      const rafId = requestAnimationFrame(() => {
        try {
          const tableContainer = this.domSafetyGuard.createElement('div', {
            className: 'oom-table-container',
            parent: container
          });
          
          // Set virtualization properties
          tableContainer.style.setProperty('--oom-visible-rows', this.VISIBLE_ROWS.toString()); // INTENTIONAL: Dynamic viewport size
          tableContainer.style.setProperty('--oom-row-height', `${this.ROW_HEIGHT}px`); // INTENTIONAL: Dynamic row height for virtualization
          
          const table = this.domSafetyGuard.createElement('table', {
            className: 'oom-table',
            parent: tableContainer
          });
          
          // Render table header
          this.renderTableHeader(table);
          
          // Render table body with virtualization
          this.renderTableBody(table);
          
          // Set up scroll handler for virtualization
          this.setupVirtualizationScrollHandler(tableContainer, table);
        } catch (error) {
          safeLogger.error('DOM', 'Error in requestAnimationFrame callback', error);
          cancelAnimationFrame(rafId);
        }
      });
      
      // Add cleanup for animation frame
      this.cleanupFunctions.push(() => {
        cancelAnimationFrame(rafId);
      });
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to render metrics table",
      onError: (error) => safeLogger.error('DOM', 'Error rendering metrics table', error)
    }
  );
  
  /**
   * Renders the table header with defensive patterns
   */
  private renderTableHeader = withErrorHandling(
    (table: HTMLElement): void => {
      const thead = this.domSafetyGuard.createElement('thead', {
        parent: table
      });
      
      const headerRow = this.domSafetyGuard.createElement('tr', {
        parent: thead
      });
      
      // Add date column
      this.domSafetyGuard.createElement('th', {
        text: 'Date',
        parent: headerRow
      });
      
      // Add title column
      this.domSafetyGuard.createElement('th', {
        text: 'Title',
        parent: headerRow
      });
      
      // Add words column
      this.domSafetyGuard.createElement('th', {
        text: 'Words',
        parent: headerRow
      });
      
      // Add content column
      this.domSafetyGuard.createElement('th', {
        text: 'Content',
        parent: headerRow
      });
      
      // Add metrics columns
      const metrics = this.state.getMetrics();
      Object.entries(metrics).forEach(([key, metric]) => {
        const th = this.domSafetyGuard.createElement('th', {
          parent: headerRow
        });
        
        th.textContent = metric.name || key;
        
        if (metric.description) {
          th.setAttribute('title', metric.description);
        }
      });
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to render table header",
      onError: (error) => safeLogger.error('DOM', 'Error rendering table header', error)
    }
  );
  
  /**
   * Renders the table body with virtualization for better performance
   */
  private renderTableBody = withErrorHandling(
    (table: HTMLElement): void => {
      // Create or get existing tbody
      let tbody = table.querySelector('tbody') as HTMLTableSectionElement;
      if (tbody) {
        this.domSafetyGuard.clearElement(tbody);
      } else {
        // Use document.createElement to specifically create a tbody element
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
      }
      
      const entries = this.state.getDreamEntries();
      const totalRows = entries.length;
      
      if (totalRows === 0) {
        this.renderEmptyState(tbody);
        return;
      }
      
      // Create a container for virtualized rows
      const rowsContainer = this.domSafetyGuard.createElement('div', {
        className: 'oom-virtualized-rows-container',
        parent: tbody
      });
      
      // Set dynamic properties for the total scrollable area
      rowsContainer.style.setProperty('--oom-total-rows', totalRows.toString()); // INTENTIONAL: Data-dependent total row count
      rowsContainer.style.setProperty('--oom-row-height', `${this.ROW_HEIGHT}px`); // INTENTIONAL: Dynamic row height for virtualization
      
      // Render initial visible rows
      this.renderVisibleRows(rowsContainer, entries, 0);
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to render table body",
      onError: (error) => safeLogger.error('DOM', 'Error rendering table body', error)
    }
  );
  
  /**
   * Renders an empty state when no entries are available
   */
  private renderEmptyState = withErrorHandling(
    (tbody: HTMLElement): void => {
      const emptyRow = this.domSafetyGuard.createElement('tr', {
        className: 'oom-empty-state-row',
        parent: tbody
      });
      
      const emptyCell = this.domSafetyGuard.createElement('td', {
        parent: emptyRow,
        attributes: {
          colspan: '20' // Large enough to span all potential columns
        }
      });
      
      const emptyMessage = this.domSafetyGuard.createElement('div', {
        className: 'oom-empty-state-message',
        text: 'No dream entries found matching your criteria.',
        parent: emptyCell
      });
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to render empty state",
      onError: (error) => safeLogger.error('DOM', 'Error rendering empty state', error)
    }
  );
  
  /**
   * Sets up scroll handler for virtualization
   */
  private setupVirtualizationScrollHandler = withErrorHandling(
    (container: HTMLElement, table: HTMLElement): void => {
      const entries = this.state.getDreamEntries();
      
      // Debounce scroll handler with RAF for better performance
      let scrollTimeout: number | null = null;
      let isScrolling = false;
      let lastScrollTop = 0;
      let currentStartIdx = 0;
      
      const scrollHandler = () => {
        if (scrollTimeout) {
          cancelAnimationFrame(scrollTimeout);
        }
        
        if (!isScrolling) {
          isScrolling = true;
          
          scrollTimeout = requestAnimationFrame(() => {
            try {
              const scrollTop = container.scrollTop;
              const newStartIdx = Math.floor(scrollTop / this.ROW_HEIGHT);
              
              // Only update if we've scrolled at least one row
              if (newStartIdx !== currentStartIdx) {
                currentStartIdx = newStartIdx;
                const rowsContainer = container.querySelector('.oom-virtualized-rows-container') as HTMLElement;
                if (rowsContainer) {
                  this.renderVisibleRows(rowsContainer, entries, currentStartIdx);
                }
              }
              
              isScrolling = false;
              scrollTimeout = null;
            } catch (error) {
              safeLogger.error('DOM', 'Error in scroll handler', error);
              isScrolling = false;
              scrollTimeout = null;
            }
          });
        }
      };
      
      // Add scroll event listener
      const cleanupScroll = this.domSafetyGuard.addListener(container, 'scroll', scrollHandler);
      this.cleanupFunctions.push(cleanupScroll);
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to setup virtualization scroll handler",
      onError: (error) => safeLogger.error('DOM', 'Error setting up scroll handler', error)
    }
  );
  
  /**
   * Generate a unique ID for an entry
   */
  private getEntryId(entry: DreamMetricData, index: number): string {
    // Use entry.id if available, otherwise generate a unique ID
    return (entry as EnhancedDreamMetricData).id || 
           `entry-${entry.date || 'unknown'}-${entry.title || index}`;
  }
  
  /**
   * Renders visible rows for virtualization
   */
  private renderVisibleRows = withErrorHandling(
    (container: HTMLElement, entries: DreamMetricData[], startIdx: number): void => {
      // Clear existing visible rows
      this.domSafetyGuard.clearElement(container);
      
      const totalRows = entries.length;
      const endIdx = Math.min(startIdx + this.VISIBLE_ROWS, totalRows);
      
      // Render visible rows
      for (let i = startIdx; i < endIdx; i++) {
        try {
          const entry = entries[i];
          if (!entry) continue;
          
          const row = this.domSafetyGuard.createElement('div', {
            className: 'oom-dream-row',
            parent: container
          });
          
          // Position using CSS custom properties for virtualization
          row.classList.add('oom-virtualized');
          row.style.setProperty('--oom-row-index', i.toString()); // INTENTIONAL: Dynamic row positioning for virtualization
          row.style.setProperty('--oom-row-height', `${this.ROW_HEIGHT}px`); // INTENTIONAL: Dynamic row height for virtualization
          
          // Generate a unique ID for the entry
          const entryId = this.getEntryId(entry, i);
          
          // Set data attributes
          row.setAttribute('data-entry-id', entryId);
          
          // Render row cells
          this.renderRowCells(row, entry, entryId);
        } catch (error) {
          safeLogger.error('DOM', `Error rendering row at index ${i}`, error);
          // Continue with next row to avoid complete failure
        }
      }
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to render visible rows",
      onError: (error) => safeLogger.error('DOM', 'Error rendering visible rows', error)
    }
  );
  
  /**
   * Renders cells for a single row
   */
  private renderRowCells = withErrorHandling(
    (row: HTMLElement, entry: DreamMetricData, entryId: string): void => {
      // Date cell
      const dateCell = this.domSafetyGuard.createElement('div', {
        className: 'oom-cell oom-date-cell',
        parent: row
      });
      
      try {
        const dateStr = entry.date ? new Date(entry.date).toLocaleDateString() : 'Unknown';
        dateCell.textContent = dateStr;
      } catch (error) {
        safeLogger.error('DOM', 'Error formatting date', error);
        dateCell.textContent = 'Invalid Date';
      }
      
      // Title cell
      const titleCell = this.domSafetyGuard.createElement('div', {
        className: 'oom-cell oom-title-cell',
        parent: row
      });
      
      titleCell.textContent = entry.title || 'Untitled';
      
      // Word count cell
      const wordCountCell = this.domSafetyGuard.createElement('div', {
        className: 'oom-cell oom-word-count-cell',
        parent: row
      });
      
      wordCountCell.textContent = String(entry.wordCount || 0);
      
      // Content cell with expand/collapse
      this.renderContentCell(row, entry, entryId);
      
      // Metric cells
      const metrics = this.state.getMetrics();
      Object.entries(metrics).forEach(([key, metric]) => {
        const metricCell = this.domSafetyGuard.createElement('div', {
          className: 'oom-cell oom-metric-cell',
          parent: row
        });
        
        const value = entry.metrics?.[key];
        metricCell.textContent = value !== undefined ? String(value) : '-';
      });
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to render row cells",
      onError: (error) => safeLogger.error('DOM', 'Error rendering row cells', error)
    }
  );
  
  /**
   * Renders content cell with expand/collapse functionality
   */
  private renderContentCell = withErrorHandling(
    (row: HTMLElement, entry: DreamMetricData, entryId: string): void => {
      const contentCell = this.domSafetyGuard.createElement('div', {
        className: 'oom-cell oom-content-cell',
        parent: row
      });
      
      const contentWrapper = this.domSafetyGuard.createElement('div', {
        className: 'oom-content-wrapper',
        parent: contentCell
      });
      
      const isExpanded = this.expandedRows.has(entryId);
      
      // Preview content (always visible)
      const preview = this.domSafetyGuard.createElement('div', {
        className: 'oom-content-preview',
        parent: contentWrapper
      });
      
      preview.textContent = entry.content 
        ? (entry.content.length > 100 
            ? entry.content.substring(0, 100) + '...' 
            : entry.content)
        : 'No content';
      
      // Full content (hidden by default)
      const fullContent = this.domSafetyGuard.createElement('div', {
        className: 'oom-content-full',
        parent: contentWrapper
      });
      
      fullContent.textContent = entry.content || 'No content';
      
      // Set visibility using CSS classes instead of inline styles
      if (isExpanded) {
        fullContent.classList.add('oom-content-full--visible');
        fullContent.classList.remove('oom-content-full--hidden');
      } else {
        fullContent.classList.add('oom-content-full--hidden');
        fullContent.classList.remove('oom-content-full--visible');
      }
      
      // Expand/collapse button
      const expandButton = this.domSafetyGuard.createElement('button', {
                        className: 'oom-button oom-button--expand u-padding--xs',
        parent: contentCell
      });
      
      expandButton.setAttribute('data-content-id', entryId);
      expandButton.setAttribute('data-expanded', isExpanded ? 'true' : 'false');
      expandButton.textContent = isExpanded ? 'Show less' : 'Show more';
      
      // Add click handler
      const cleanupClick = this.domSafetyGuard.addListener(
        expandButton,
        'click',
        (e) => this.handleExpandButtonClick(e, entryId)
      );
      
      this.cleanupFunctions.push(cleanupClick);
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to render content cell",
      onError: (error) => safeLogger.error('DOM', 'Error rendering content cell', error)
    }
  );
  
  /**
   * Handles expand button clicks
   */
  private handleExpandButtonClick = withErrorHandling(
    (e: Event, entryId: string): void => {
      e.preventDefault();
      e.stopPropagation();
      
      const isExpanded = this.expandedRows.has(entryId);
      
      if (isExpanded) {
        this.expandedRows.delete(entryId);
      } else {
        this.expandedRows.add(entryId);
      }
      
      const button = e.currentTarget as HTMLElement;
      const newExpandedState = !isExpanded;
      
      // Update button state
      button.setAttribute('data-expanded', newExpandedState ? 'true' : 'false');
      button.textContent = newExpandedState ? 'Show less' : 'Show more';
      
      // Update content visibility using CSS classes
      const row = button.closest('.oom-dream-row');
      if (row) {
        const contentFull = row.querySelector('.oom-content-full') as HTMLElement;
        if (contentFull) {
          if (newExpandedState) {
            contentFull.classList.add('oom-content-full--visible');
            contentFull.classList.remove('oom-content-full--hidden');
          } else {
            contentFull.classList.add('oom-content-full--hidden');
            contentFull.classList.remove('oom-content-full--visible');
          }
        }
      }
      
      // Notify about state change
      this.eventBus.publish('ui:interaction', {
        type: 'content-toggle',
        entryId,
        expanded: newExpandedState
      });
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to handle expand button click",
      onError: (error) => safeLogger.error('DOM', 'Error handling expand button click', error)
    }
  );
  
  /**
   * Updates content visibility when toggled programmatically
   */
  public updateContentVisibility(id: string, isExpanded: boolean): void {
    try {
      // Update internal state
      if (isExpanded) {
        this.expandedRows.add(id);
      } else {
        this.expandedRows.delete(id);
      }
      
      // Find the button and update attributes
      const button = document.querySelector(`.oom-button--expand[data-content-id="${id}"]`);
      if (button) {
        button.setAttribute('data-expanded', isExpanded ? 'true' : 'false');
        button.textContent = isExpanded ? 'Show less' : 'Show more';
        
        // Find and update content visibility using CSS classes
        const row = button.closest('.oom-dream-row');
        if (row) {
          const contentFull = row.querySelector('.oom-content-full') as HTMLElement;
          if (contentFull) {
            if (isExpanded) {
              contentFull.classList.add('oom-content-full--visible');
              contentFull.classList.remove('oom-content-full--hidden');
            } else {
              contentFull.classList.add('oom-content-full--hidden');
              contentFull.classList.remove('oom-content-full--visible');
            }
          }
        }
      }
    } catch (error) {
      safeLogger.error('DOM', `Error updating content visibility for ID ${id}`, error);
    }
  }
  
  /**
   * Shows a fallback UI when critical errors occur
   */
  private showFallbackUI(): void {
    try {
      // Clear container
      this.domSafetyGuard.clearElement(this.container);
      
      // Create fallback message
      const fallbackContainer = this.domSafetyGuard.createElement('div', {
        className: 'oom-fallback-container',
        parent: this.container
      });
      
      const fallbackHeading = this.domSafetyGuard.createElement('h3', {
        className: 'oom-fallback-heading',
        text: 'Something went wrong',
        parent: fallbackContainer
      });
      
      const fallbackMessage = this.domSafetyGuard.createElement('p', {
        className: 'oom-fallback-message',
        text: 'Unable to display dream metrics visualization. Please try reloading or check the console for errors.',
        parent: fallbackContainer
      });
      
      const retryButton = this.domSafetyGuard.createElement('button', {
        className: 'oom-fallback-retry-button',
        text: 'Try Again',
        parent: fallbackContainer
      });
      
      this.domSafetyGuard.addListener(retryButton, 'click', () => {
        this.render();
      });
    } catch (err) {
      safeLogger.error('DOM', 'Failed to show fallback UI', err);
      // At this point, we can't do much more - use direct error logging as last resort
      try {
        error('SafeDreamMetricsDOM', 'Critical error in DreamMetricsDOM', err);
      } catch (e) {
        // If all else fails, use console as absolute last resort
        // This should never happen in normal operation
        error('SafeDreamMetricsDOM', 'Catastrophic error in error handling', e);
      }
    }
  }
  
  /**
   * Applies date range filter to the entries
   */
  public applyDateRangeFilter(dateRange: { start: string, end: string }): void {
    try {
      // Since we can't directly access the DateRangeFilter's private methods,
      // we'll implement our own filtering logic directly with the state
      
      // Convert string dates to Date objects
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Get all entries from state
      const allEntries = this.state.getDreamEntries();
      
      // Filter entries based on date range
      const filteredEntries = allEntries.filter(entry => {
        if (!entry.date) return false;
        
        try {
          const entryDate = new Date(entry.date);
          
          // Start date check
          if (entryDate < startDate) {
            return false;
          }
          
          // End date check (inclusive of the end date)
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          if (entryDate > endOfDay) {
            return false;
          }
          
          return true;
        } catch (error) {
          safeLogger.error('DOM', `Error filtering entry by date: ${entry.date}`, error);
          return false;
        }
      });
      
      // Update the state with filtered entries
      this.state.updateDreamEntries(filteredEntries);
      
      // Log filtering stats
      safeLogger.debug('DOM', 'Date filter applied', {
        totalEntries: allEntries.length,
        filteredEntries: filteredEntries.length
      });
      
      this.safeUpdate();
    } catch (error) {
      safeLogger.error('DOM', 'Error applying date range filter', error);
    }
  }
  
  /**
   * Public update method to refresh the UI
   */
  public update(data?: any): void {
    this.safeUpdate();
  }
  
  /**
   * Cleans up all resources
   */
  public cleanup(): void {
    try {
      // Execute all cleanup functions
      this.cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          safeLogger.error('DOM', 'Error in cleanup function', error);
        }
      });
      
      // Clear references
      this.cleanupFunctions = [];
      this.expandedRows.clear();
      
      // Clear DOM elements
      this.domSafetyGuard.clearElement(this.container);
      
      safeLogger.debug('DOM', 'SafeDreamMetricsDOM cleanup completed');
    } catch (error) {
      safeLogger.error('DOM', 'Error during cleanup', error);
    }
  }
} 