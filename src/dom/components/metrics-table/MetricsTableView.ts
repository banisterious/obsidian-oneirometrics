import { BaseComponent } from '../BaseComponent';
import { MetricsTableProps, MetricsTableCallbacks, MetricsTableConfig } from './MetricsTableTypes';

/**
 * View component for displaying metrics data in a table
 */
export class MetricsTableView extends BaseComponent {
  // Default configuration
  private static readonly DEFAULT_CONFIG: MetricsTableConfig = {
    visibleRows: 20,
    rowHeight: 50
  };

  // Component state
  private props: MetricsTableProps;
  private callbacks: MetricsTableCallbacks;
  private config: MetricsTableConfig;

  // DOM references
  private table: HTMLElement | null = null;
  private tbody: HTMLElement | null = null;
  private scrollTimeout: number | null = null;
  private isScrolling = false;
  private lastScrollTop = 0;
  private currentStartIdx = 0;

  /**
   * Constructor
   * @param props Initial props for the component
   * @param callbacks Event callbacks for the component
   */
  constructor(props: MetricsTableProps, callbacks: MetricsTableCallbacks = {}) {
    super();
    this.props = props;
    this.callbacks = callbacks;
    this.config = { ...MetricsTableView.DEFAULT_CONFIG, ...props.config };
  }

  /**
   * Called when the component is rendered
   */
  protected onRender(): void {
    if (!this.containerEl) return;

    const tableContainer = this.containerEl.createDiv({ cls: 'oom-table-container' });
    this.table = tableContainer.createEl('table', { cls: 'oom-table' });
    
    // Render table header
    this.renderTableHeader();
    
    // Render table body
    this.renderTableBody();

    // Register scroll handler for virtualization
    this.registerScrollHandler(tableContainer);
  }

  /**
   * Called when the component is updated
   * @param data New data for the component
   */
  protected onUpdate(data: Partial<MetricsTableProps>): void {
    // Update props
    this.props = { ...this.props, ...data };
    
    // Update config if provided
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
    
    // Re-render the table
    if (this.table) {
      // Update header if metrics changed
      if (data.metrics) {
        this.renderTableHeader();
      }
      
      // Update body if entries or expanded rows changed
      if (data.entries || data.expandedRows) {
        this.renderTableBody();
      }
      
      // Scroll to row if specified
      if (data.scrollToRowId && this.tbody) {
        this.scrollToRow(data.scrollToRowId);
      }
    }
  }

  /**
   * Called when the component is cleaned up
   */
  protected onCleanup(): void {
    // Cancel any pending scroll animation
    if (this.scrollTimeout) {
      window.cancelAnimationFrame(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  /**
   * Render the table header
   */
  private renderTableHeader(): void {
    if (!this.table) return;

    // Remove existing header
    const oldThead = this.table.querySelector('thead');
    if (oldThead) oldThead.remove();

    // Create new header
    const thead = this.table.createEl('thead');
    const headerRow = thead.createEl('tr');
    
    // Add date column
    const dateHeader = headerRow.createEl('th', { text: 'Date' });
    dateHeader.addEventListener('click', () => {
      this.callbacks.onHeaderClick?.('date');
    });
    
    // Add metrics columns
    Object.entries(this.props.metrics).forEach(([key, metric]) => {
      const th = headerRow.createEl('th', { text: metric.name });
      
      if (metric.description) {
        th.setAttribute('title', metric.description);
      }
      
      th.addEventListener('click', () => {
        this.callbacks.onHeaderClick?.(key);
      });
    });

    // Add content column
    const contentHeader = headerRow.createEl('th', { text: 'Content' });
    contentHeader.classList.add('oom-content-header');
  }

  /**
   * Render the table body with virtual scrolling
   */
  private renderTableBody(): void {
    if (!this.table) return;

    // Remove existing body
    const oldTbody = this.table.querySelector('tbody');
    if (oldTbody) oldTbody.remove();

    // Create new body
    this.tbody = this.table.createEl('tbody');
    const totalRows = this.props.entries.length;

    // No data case
    if (totalRows === 0) {
      const emptyRow = this.tbody.createEl('tr');
      const emptyCell = emptyRow.createEl('td');
      emptyCell.colSpan = Object.keys(this.props.metrics).length + 2; // +2 for date and content
      emptyCell.textContent = 'No dream entries found.';
      emptyCell.classList.add('oom-empty-table');
      return;
    }

    // Only render the visible rows
    const endIdx = Math.min(this.currentStartIdx + this.config.visibleRows, totalRows);
    
    for (let i = this.currentStartIdx; i < endIdx; i++) {
      this.renderRow(i);
    }
  }

  /**
   * Render a single row
   * @param index Index of the row to render
   */
  private renderRow(index: number): void {
    if (!this.tbody) return;
    
    const entry = this.props.entries[index];
    const row = this.tbody.createEl('tr', { cls: 'oom-dream-row' });
    row.setAttribute('data-source', entry.source);
    row.setAttribute('data-index', index.toString());
    
    // Add date cell
    const dateCell = row.createEl('td');
    dateCell.textContent = new Date(entry.date).toLocaleDateString();
    
    // Add metric cells
    Object.entries(this.props.metrics).forEach(([key, metric]) => {
      const cell = row.createEl('td');
      const value = entry.metrics[key];
      cell.textContent = value !== undefined ? value.toString() : '-';
    });
    
    // Add content cell
    const contentCell = row.createEl('td', { cls: 'oom-content-cell' });
    
    const contentWrapper = contentCell.createDiv({ cls: 'oom-content-wrapper' });
    
    const preview = contentWrapper.createDiv({ cls: 'oom-content-preview' });
    preview.textContent = entry.content.substring(0, 100) + '...';
    
    const fullContent = contentWrapper.createDiv({ cls: 'oom-content-full' });
    fullContent.textContent = entry.content;
    
    // Set expanded state based on props
    const isExpanded = this.props.expandedRows?.has(entry.source) || false;
    contentWrapper.classList.toggle('oom-expanded', isExpanded);
    
    // Add expand button
    const expandButton = contentCell.createEl('button', {
      cls: 'oom-button oom-button--expand',
      text: isExpanded ? 'Show less' : 'Read more'
    });
    expandButton.setAttribute('data-content-id', entry.source);
    expandButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = entry.source;
      const newExpandedState = !isExpanded;
      this.toggleExpand(id, newExpandedState);
      this.callbacks.onToggleExpand?.(id, newExpandedState);
    });
    
    // Add row click handler
    row.addEventListener('click', () => {
      this.callbacks.onRowClick?.(entry);
    });
  }

  /**
   * Register scroll handler for virtual scrolling
   * @param container The scrollable container
   */
  private registerScrollHandler(container: HTMLElement): void {
    const handleScroll = () => {
      if (this.scrollTimeout) {
        window.cancelAnimationFrame(this.scrollTimeout);
      }
      
      if (!this.isScrolling) {
        this.isScrolling = true;
        this.scrollTimeout = window.requestAnimationFrame(() => {
          const scrollTop = container.scrollTop;
          const newStartIdx = Math.floor(scrollTop / this.config.rowHeight);
          
          // Only update if we've scrolled at least one row
          if (newStartIdx !== this.currentStartIdx) {
            this.currentStartIdx = newStartIdx;
            this.updateVisibleRows();
          }
          
          this.isScrolling = false;
          this.scrollTimeout = null;
        });
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    this.registerCleanup(() => container.removeEventListener('scroll', handleScroll));
  }

  /**
   * Update which rows are visible based on current scroll position
   */
  private updateVisibleRows(): void {
    if (!this.tbody) return;
    
    this.tbody.empty();
    
    const totalRows = this.props.entries.length;
    const endIdx = Math.min(this.currentStartIdx + this.config.visibleRows, totalRows);
    
    for (let i = this.currentStartIdx; i < endIdx; i++) {
      this.renderRow(i);
    }
  }

  /**
   * Toggle the expanded state of a row
   * @param id ID of the row to toggle
   * @param expanded Whether the row should be expanded
   */
  private toggleExpand(id: string, expanded: boolean): void {
    if (!this.tbody) return;
    
    const row = this.tbody.querySelector(`tr[data-source="${id}"]`);
    if (!row) return;
    
    const contentWrapper = row.querySelector('.oom-content-wrapper');
    if (!contentWrapper) return;
    
    contentWrapper.classList.toggle('oom-expanded', expanded);
    
    const button = row.querySelector('.oom-button--expand');
    if (button) {
      button.textContent = expanded ? 'Show less' : 'Read more';
    }
  }

  /**
   * Scroll to a specific row
   * @param id ID of the row to scroll to
   */
  private scrollToRow(id: string): void {
    if (!this.tbody || !this.table) return;
    
    const index = this.props.entries.findIndex(entry => entry.source === id);
    if (index === -1) return;
    
    // Calculate target scroll position
    const targetScrollTop = index * this.config.rowHeight;
    
    // Get the scroll container
    const container = this.table.parentElement as HTMLElement;
    if (!container) return;
    
    // Animate scrolling
    const startScrollTop = container.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const duration = 300; // ms
    const startTime = performance.now();
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2; // Sine easing
      
      container.scrollTop = startScrollTop + distance * easeProgress;
      
      if (progress < 1) {
        this.scrollTimeout = window.requestAnimationFrame(animateScroll);
      } else {
        this.scrollTimeout = null;
      }
    };
    
    if (this.scrollTimeout) {
      window.cancelAnimationFrame(this.scrollTimeout);
    }
    
    this.scrollTimeout = window.requestAnimationFrame(animateScroll);
  }
} 