import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricsDOM } from '../dom/DreamMetricsDOM';
import { DreamMetricsEvents } from './DreamMetricsEvents';
import { EventManager } from './index';
import { MetricsFilter } from '../filters/MetricsFilter';

/**
 * Adapter class that bridges between the existing DreamMetricsEvents class
 * and the new typed event emitter system. This enables a gradual migration path
 * while maintaining backward compatibility.
 */
export class DreamMetricsEventsAdapter {
  private legacyEvents: DreamMetricsEvents;
  private eventManager: EventManager;
  private subscriptions: Array<() => void> = [];

  /**
   * Creates a new adapter bridging the legacy events system with the new one.
   * @param state The metrics state
   * @param dom The DOM manipulation utilities
   */
  constructor(state: DreamMetricsState, dom: DreamMetricsDOM) {
    // Initialize the legacy events handler
    this.legacyEvents = new DreamMetricsEvents(state, dom);
    
    // Initialize the new event system
    this.eventManager = EventManager.getInstance();
    
    // Set up subscriptions to translate between systems
    this.setupSubscriptions();
  }

  /**
   * Sets up event subscriptions between the new event system and legacy handlers.
   * This creates a bridge allowing both systems to communicate during transition.
   */
  private setupSubscriptions(): void {
    // Subscribe to UI events and forward to legacy handlers
    this.subscriptions.push(
      this.eventManager.ui.on('ui:contentToggled', ({ contentId, isExpanded }) => {
        // Find the button for this content and simulate a click through the legacy system
        const button = document.querySelector(`.oom-button--expand[data-content-id="${contentId}"]`) as HTMLElement;
        if (button) {
          // Only trigger if the state is different than current
          const currentState = button.getAttribute('data-expanded') === 'true';
          if (currentState !== isExpanded) {
            // Manually call the legacy handler
            const expandMethod = this.legacyEvents['handleExpandButtonClick'].bind(this.legacyEvents);
            if (expandMethod) {
              expandMethod(button);
            }
          }
        }
      })
    );
    
    // Subscribe to metrics filter events
    this.subscriptions.push(
      this.eventManager.metrics.on('metrics:filter', ({ filter }) => {
        // Handle filter changes using the legacy system
        const filterManager = this.legacyEvents['handleDateRangeChange'].bind(this.legacyEvents);
        if (filterManager && filter.getConfig().startDate && filter.getConfig().endDate) {
          // Extract the date range and convert to a format the legacy system expects
          const range = this.convertFilterToLegacyRange(filter);
          filterManager(range);
        }
      })
    );
  }

  /**
   * Converts a new MetricsFilter to a legacy range string format
   * @param filter The new filter object
   * @returns A legacy range string (e.g., 'day', 'week', 'month', 'custom')
   */
  private convertFilterToLegacyRange(filter: MetricsFilter): string {
    // Default to "custom" if we can't determine the exact range
    let range = 'custom';
    
    // Try to map to standard ranges based on date span
    const config = filter.getConfig();
    if (config.startDate && config.endDate) {
      const startDate = config.startDate;
      const endDate = config.endDate;
      const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Approximate matching to standard ranges
      if (diffDays === 0) {
        range = 'day';
      } else if (diffDays === 6 || diffDays === 7) {
        range = 'week';
      } else if (diffDays >= 28 && diffDays <= 31) {
        range = 'month';
      }
    }
    
    return range;
  }

  /**
   * Initializes event listeners using both the legacy and new systems.
   * This ensures compatibility during the transition period.
   */
  public attachEventListeners(): void {
    // Use the legacy event listener attachment
    this.legacyEvents.attachEventListeners();
    
    // Set up DOM observers to emit events through the new system
    this.setupDOMObservers();
  }

  /**
   * Observes DOM changes and emits events through the new system 
   * when relevant actions occur.
   */
  private setupDOMObservers(): void {
    // Observe expand button clicks and emit through new event system
    const tableContainer = document.querySelector('.oom-table-container');
    if (tableContainer) {
      tableContainer.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const button = target.closest('.oom-button--expand') as HTMLElement;
        
        if (button && tableContainer.contains(button)) {
          const contentId = button.getAttribute('data-content-id');
          const currentState = button.getAttribute('data-expanded') === 'true';
          if (contentId) {
            // Don't stop propagation - let the legacy handler work too
            // Just emit through the new system as well
            this.eventManager.ui.notifyContentToggled(contentId, !currentState);
          }
        }
      });
    }
    
    // Observe filter changes
    const dateRangeFilter = document.getElementById('oom-date-range-filter');
    if (dateRangeFilter) {
      dateRangeFilter.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const value = target.value;
        
        // Create a new filter based on the selected range
        const filter = new MetricsFilter();
        const now = new Date();
        
        // Set date range based on selection
        if (value === 'day') {
          filter.setDateRange(now, now);
        } else if (value === 'week') {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          filter.setDateRange(weekStart, weekEnd);
        } else if (value === 'month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          filter.setDateRange(monthStart, monthEnd);
        }
        
        // Emit through the new event system
        this.eventManager.metrics.notifyFilterApplied(filter);
      });
    }
  }

  /**
   * Cleans up event listeners and subscriptions from both systems.
   * Should be called when the plugin is unloaded.
   */
  public cleanup(): void {
    // Clean up legacy event listeners
    this.legacyEvents.cleanup();
    
    // Clean up new event subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
} 