import { App } from 'obsidian';
import { DreamMetricData } from '../../../types';
import { DreamMetricsState } from '../../../state/DreamMetricsState';
import { MetricsTableView } from './MetricsTableView';
import { MetricsTableProps, MetricsTableConfig } from './MetricsTableTypes';
import { OneiroMetricsEvents } from '../../../events';

/**
 * Interface for filter range
 */
interface MetricFilterRange {
  min?: number;
  max?: number;
}

/**
 * Interface for filter criteria
 */
interface FilterCriteria {
  startDate?: string;
  endDate?: string;
  metrics?: Record<string, MetricFilterRange>;
}

/**
 * Container component for the metrics table
 * 
 * This component manages the state and business logic for the metrics table,
 * while delegating rendering to the MetricsTableView component.
 */
export class MetricsTableContainer {
  // Dependencies
  private app: App;
  private state: DreamMetricsState;
  private events: OneiroMetricsEvents;
  
  // Component references
  private view: MetricsTableView;
  
  // Component state
  private expandedRows: Set<string> = new Set();
  private lastSortedColumn: string | null = null;
  private sortAscending = true;
  
  /**
   * Constructor
   * @param app Obsidian app instance
   * @param container DOM element to render into
   * @param state Plugin state
   * @param config Configuration options
   */
  constructor(
    app: App, 
    container: HTMLElement, 
    state: DreamMetricsState,
    config?: Partial<MetricsTableConfig>
  ) {
    this.app = app;
    this.state = state;
    this.events = OneiroMetricsEvents.getInstance();
    
    // Create initial props
    const props: MetricsTableProps = {
      entries: this.state.getDreamEntries(),
      metrics: this.state.getMetrics(),
      expandedRows: this.expandedRows,
      config
    };
    
    // Create view component
    this.view = new MetricsTableView(props, {
      onToggleExpand: this.handleToggleExpand.bind(this),
      onHeaderClick: this.handleHeaderClick.bind(this),
      onRowClick: this.handleRowClick.bind(this)
    });
    
    // Render the view
    this.view.render(container);
    
    // Subscribe to state changes
    this.subscribeToStateChanges();
  }
  
  /**
   * Clean up resources used by the component
   */
  public cleanup(): void {
    this.view.cleanup();
  }
  
  /**
   * Update the component with filtered entries
   * @param entries Filtered dream entries
   */
  public updateEntries(entries: DreamMetricData[]): void {
    this.view.update({ entries });
  }
  
  /**
   * Scroll to a specific entry
   * @param id ID of the entry to scroll to
   */
  public scrollToEntry(id: string): void {
    this.view.update({ scrollToRowId: id });
  }
  
  /**
   * Subscribe to state changes
   */
  private subscribeToStateChanges(): void {
    // Example subscription to events
    this.events.on('metrics:updated', () => {
      this.view.update({
        entries: this.state.getDreamEntries(),
        metrics: this.state.getMetrics()
      });
    });
    
    this.events.on('filter:applied', (filter: FilterCriteria) => {
      // Apply filter logic here
      const filteredEntries = this.applyFilter(this.state.getDreamEntries(), filter);
      this.updateEntries(filteredEntries);
    });
  }
  
  /**
   * Handle toggling the expanded state of a row
   * @param id ID of the row
   * @param expanded Whether the row is expanded
   */
  private handleToggleExpand(id: string, expanded: boolean): void {
    if (expanded) {
      this.expandedRows.add(id);
    } else {
      this.expandedRows.delete(id);
    }
    
    // Publish event for other components
    // Using Obsidian's event system instead of direct emit
    this.app.workspace.trigger('oneirometrics:content-expanded', { id, expanded });
    
    // Store expanded state for persistence
    this.saveExpandedState();
  }
  
  /**
   * Save the expanded state to plugin settings
   */
  private saveExpandedState(): void {
    // Save expanded rows using app workspace
    this.app.workspace.trigger('oneirometrics:save-expanded-rows', {
      expandedRows: Array.from(this.expandedRows)
    });
    
    // Note: The main plugin will listen for this event and save to settings
  }
  
  /**
   * Handle clicking on a table header for sorting
   * @param column Column key that was clicked
   */
  private handleHeaderClick(column: string): void {
    // Toggle sort direction if clicking the same column
    if (this.lastSortedColumn === column) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.lastSortedColumn = column;
      this.sortAscending = true;
    }
    
    // Sort the entries
    const entries = [...this.state.getDreamEntries()];
    
    entries.sort((a, b) => {
      let valueA, valueB;
      
      if (column === 'date') {
        valueA = new Date(a.date).getTime();
        valueB = new Date(b.date).getTime();
      } else {
        valueA = a.metrics[column] ?? 0;
        valueB = b.metrics[column] ?? 0;
      }
      
      // Compare values
      if (valueA < valueB) return this.sortAscending ? -1 : 1;
      if (valueA > valueB) return this.sortAscending ? 1 : -1;
      return 0;
    });
    
    // Update the view with sorted entries
    this.view.update({ entries });
    
    // Publish event for other components using Obsidian events
    this.app.workspace.trigger('oneirometrics:table-sorted', { 
      column, 
      ascending: this.sortAscending 
    });
  }
  
  /**
   * Handle clicking on a table row
   * @param entry Entry that was clicked
   */
  private handleRowClick(entry: DreamMetricData): void {
    // Example: Navigate to the source file
    const { vault } = this.app;
    const file = vault.getAbstractFileByPath(entry.source);
    
    if (file) {
      const leaf = this.app.workspace.getLeaf();
      leaf.openFile(file as any);
    }
  }
  
  /**
   * Apply filters to entries
   * @param entries Entries to filter
   * @param filter Filter criteria
   * @returns Filtered entries
   */
  private applyFilter(entries: DreamMetricData[], filter: FilterCriteria): DreamMetricData[] {
    // Example filter implementation
    return entries.filter(entry => {
      // Date filter
      if (filter.startDate && filter.endDate) {
        const entryDate = new Date(entry.date).getTime();
        const startDate = new Date(filter.startDate).getTime();
        const endDate = new Date(filter.endDate).getTime();
        
        if (entryDate < startDate || entryDate > endDate) {
          return false;
        }
      }
      
      // Metric value filters
      if (filter.metrics) {
        for (const [key, range] of Object.entries(filter.metrics)) {
          const value = entry.metrics[key];
          
          if (value === undefined) continue;
          
          if (range.min !== undefined && value < range.min) {
            return false;
          }
          
          if (range.max !== undefined && value > range.max) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
} 