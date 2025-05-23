import { App } from 'obsidian';
import { MetricsState, MetricsStateShape, MetricsActions, StateSelector } from './index';
import { DreamMetricsSettings } from '../../types';

/**
 * This file contains examples of how to use the new state management system.
 * These examples are intended for reference only and are not used in the actual plugin.
 */

/**
 * Example component that consumes state.
 */
export class StateConsumerExample {
  private state: MetricsState;
  private uiSelector: StateSelector<MetricsStateShape, 'ui'>;
  private metricsSelector: StateSelector<MetricsStateShape, 'metrics'>;
  private subscriptions: Array<() => void> = [];
  
  constructor(app: App, settings: DreamMetricsSettings) {
    // Get the state instance
    this.state = MetricsState.getInstance(settings);
    
    // Create selectors for specific parts of state
    this.uiSelector = new StateSelector<MetricsStateShape, 'ui'>(this.state, 'ui');
    this.metricsSelector = new StateSelector<MetricsStateShape, 'metrics'>(this.state, 'metrics');
    
    // Set up subscriptions
    this.setupSubscriptions();
  }
  
  private setupSubscriptions(): void {
    // Subscribe to UI state changes
    this.subscriptions.push(
      this.uiSelector.subscribe(selected => {
        console.log('UI state changed:', selected);
        this.updateUI(selected.ui);
      })
    );
    
    // Subscribe to metrics changes
    this.subscriptions.push(
      this.metricsSelector.subscribe(selected => {
        console.log('Metrics changed, count:', Object.keys(selected.metrics).length);
        this.updateMetricsDisplay(selected.metrics);
      })
    );
    
    // Subscribe to all state changes
    this.subscriptions.push(
      this.state.subscribe(changes => {
        console.log('Partial state update:', Object.keys(changes).join(', '));
      })
    );
  }
  
  // Example method to update UI based on state changes
  private updateUI(ui: MetricsStateShape['ui']): void {
    // Update loading indicator
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
      loadingEl.style.display = ui.isLoading ? 'block' : 'none';
    }
    
    // Update active view
    const viewTabs = document.querySelectorAll('.view-tab');
    viewTabs.forEach(tab => {
      const tabId = tab.getAttribute('data-view-id');
      if (tabId === ui.activeView) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update filters
    const filterElements = document.querySelectorAll('.filter-checkbox');
    filterElements.forEach(el => {
      const filterId = el.getAttribute('data-filter-id');
      if (filterId) {
        (el as HTMLInputElement).checked = ui.selectedFilters.includes(filterId);
      }
    });
  }
  
  // Example method to update metrics display
  private updateMetricsDisplay(metrics: Record<string, any>): void {
    const metricsContainer = document.getElementById('metrics-container');
    if (!metricsContainer) return;
    
    // Clear existing content
    metricsContainer.innerHTML = '';
    
    // Create elements for each metric
    Object.values(metrics).forEach(metric => {
      if (!metric.enabled) return;
      
      const metricEl = document.createElement('div');
      metricEl.className = 'metric-item';
      metricEl.innerHTML = `
        <div class="metric-icon">${metric.icon}</div>
        <div class="metric-name">${metric.name}</div>
        <div class="metric-description">${metric.description}</div>
      `;
      
      metricsContainer.appendChild(metricEl);
    });
  }
  
  // Example of dispatching actions
  public setActiveView(viewId: string): void {
    this.state.dispatcher.dispatch(MetricsActions.SET_ACTIVE_VIEW, viewId);
  }
  
  public setLoading(isLoading: boolean): void {
    this.state.dispatcher.dispatch(MetricsActions.SET_LOADING, isLoading);
  }
  
  public toggleFilter(filterId: string): void {
    // Get current filters
    const currentFilters = this.state.getState().ui.selectedFilters;
    
    // Toggle the filter
    let updatedFilters: string[];
    if (currentFilters.includes(filterId)) {
      updatedFilters = currentFilters.filter(id => id !== filterId);
    } else {
      updatedFilters = [...currentFilters, filterId];
    }
    
    // Update state
    this.state.dispatcher.dispatch(MetricsActions.UPDATE_FILTERS, updatedFilters);
  }
  
  public setDateRange(startDate: string, endDate: string): void {
    this.state.dispatcher.dispatch(MetricsActions.SET_DATE_RANGE, {
      startDate,
      endDate
    });
  }
  
  public cleanup(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
} 