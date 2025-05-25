/**
 * Component Migration Examples
 * 
 * This file demonstrates how to use the component migration utilities
 * to convert existing UI components to use the new typed architecture.
 */

import { 
  wrapLegacyComponent, 
  adaptLegacyEvents, 
  migrateToEventable,
  transformToComponentClass
} from '../../../../src/utils/component-migrator';
import { DreamMetricData, DreamMetric } from '../../../../src/types/core';

/**
 * Example 1: Simple legacy functional component
 */

// Original functional component with untyped parameters
function LegacyChartComponent(
  container: HTMLElement, 
  title: string,
  data: any[]
) {
  const chartContainer = document.createElement('div');
  chartContainer.className = 'chart-container';
  container.appendChild(chartContainer);
  
  // Set title
  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  chartContainer.appendChild(titleEl);
  
  // Render data
  const render = () => {
    // Rendering logic here...
    console.log('Rendering chart with', data.length, 'data points');
  };
  
  // Initial render
  render();
  
  // Return API
  return {
    render,
    updateData: (newData: any[]) => {
      data = newData;
      render();
    }
  };
}

// Migrated component with typed parameters
const ChartComponent = wrapLegacyComponent(LegacyChartComponent);

// Usage of migrated component
// const chart = ChartComponent({
//   container: document.getElementById('chart-container')!,
//   title: 'Dream Metrics Trends',
//   data: [{date: '2023-01-01', value: 5}]
// });
// chart.updateData([{date: '2023-01-02', value: 7}]);


/**
 * Example 2: Legacy class component with event handlers
 */

// Original class component
class LegacyMetricsListComponent {
  private container: HTMLElement;
  private metrics: any[];
  private selectedMetric: any | null = null;
  
  constructor(container: HTMLElement, metrics: any[]) {
    this.container = container;
    this.metrics = metrics;
    this.render();
  }
  
  render() {
    this.container.innerHTML = '';
    
    this.metrics.forEach(metric => {
      const item = document.createElement('div');
      item.className = 'metric-item';
      item.textContent = metric.name;
      
      item.addEventListener('click', (e) => this.handleMetricClick(e, metric));
      
      this.container.appendChild(item);
    });
  }
  
  handleMetricClick(e: MouseEvent, metric: any) {
    this.selectedMetric = metric;
    console.log('Selected metric:', metric.name);
    // Notify listeners would go here
  }
  
  getSelectedMetric() {
    return this.selectedMetric;
  }
}

// Step 1: Create typed version with transformToComponentClass
const TypedMetricsListComponent = transformToComponentClass(LegacyMetricsListComponent);

// Step 2: Adapt event handlers if needed
// Usage:
// const metricsComponent = new TypedMetricsListComponent({
//   container: document.getElementById('metrics-container')!,
//   metrics: [{name: 'Clarity', icon: 'sun'}]
// });
// adaptLegacyEvents(metricsComponent, {
//   'metricClick': 'handleMetricClick'
// });


/**
 * Example 3: Convert an object-based component with custom events
 */

// Original object-based component
function createLegacyDreamJournal(container: HTMLElement) {
  let entries: any[] = [];
  
  // Create DOM elements
  const journalEl = document.createElement('div');
  journalEl.className = 'dream-journal';
  container.appendChild(journalEl);
  
  // Render function
  const render = () => {
    journalEl.innerHTML = '';
    entries.forEach(entry => {
      const entryEl = document.createElement('div');
      entryEl.className = 'journal-entry';
      entryEl.textContent = entry.title;
      journalEl.appendChild(entryEl);
    });
  };
  
  // Event callbacks
  const callbacks: Record<string, Function[]> = {
    'entrySelect': [],
    'entryAdd': [],
    'entryDelete': []
  };
  
  // Simple event system
  const fireEvent = (name: string, data: any) => {
    if (callbacks[name]) {
      callbacks[name].forEach(cb => cb(data));
    }
  };
  
  // Return the component object
  return {
    render,
    setEntries(newEntries: any[]) {
      entries = newEntries;
      render();
    },
    addEntry(entry: any) {
      entries.push(entry);
      render();
      fireEvent('entryAdd', entry);
    },
    on(event: string, callback: Function) {
      if (!callbacks[event]) {
        callbacks[event] = [];
      }
      callbacks[event].push(callback);
    },
    off(event: string, callback: Function) {
      if (callbacks[event]) {
        callbacks[event] = callbacks[event].filter(cb => cb !== callback);
      }
    }
  };
}

// Convert using migrateToEventable
const wrappedJournal = wrapLegacyComponent(createLegacyDreamJournal);

// Usage:
// const journal = wrappedJournal({
//   container: document.getElementById('journal-container')!
// });
// migrateToEventable(journal, ['entrySelect', 'entryAdd', 'entryDelete']);
// journal.on('entryAdd', (entry) => console.log('New entry added:', entry.title));


/**
 * Example 4: Complete migration for a real component
 * 
 * This demonstrates a complete workflow for migrating an existing component
 * to use the new typed architecture.
 */

// Step 1: Define proper types for the component
interface MetricSummary {
  metric: DreamMetric;
  average: number;
  count: number;
  mostRecent: number;
}

interface MetricsSummaryProps {
  container: HTMLElement;
  metrics?: DreamMetric[];
  entries?: DreamMetricData[];
  title?: string;
}

// Step 2: Create the wrapper function with proper typing
const createMetricsSummary = wrapLegacyComponent(
  (container: HTMLElement, metrics: DreamMetric[] = [], entries: DreamMetricData[] = []) => {
    // Original implementation...
    // Just a placeholder for this example
    const summaryEl = document.createElement('div');
    summaryEl.className = 'metrics-summary';
    container.appendChild(summaryEl);
    
    const calculateSummaries = (): MetricSummary[] => {
      return metrics.map(metric => {
        // Calculate statistics
        const values = entries
          .filter(entry => entry.metrics && entry.metrics[metric.name] !== undefined)
          .map(entry => Number(entry.metrics![metric.name]));
        
        const sum = values.reduce((acc, val) => acc + val, 0);
        const average = values.length > 0 ? sum / values.length : 0;
        const mostRecent = values.length > 0 ? values[values.length - 1] : 0;
        
        return {
          metric,
          average,
          count: values.length,
          mostRecent
        };
      });
    };
    
    const render = () => {
      const summaries = calculateSummaries();
      summaryEl.innerHTML = '';
      
      summaries.forEach(summary => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        item.innerHTML = `
          <h4>${summary.metric.name}</h4>
          <div>Average: ${summary.average.toFixed(1)}</div>
          <div>Count: ${summary.count}</div>
          <div>Recent: ${summary.mostRecent}</div>
        `;
        summaryEl.appendChild(item);
      });
    };
    
    // Initial render
    render();
    
    // Return component API
    return {
      render,
      updateEntries(newEntries: DreamMetricData[]) {
        entries = newEntries;
        render();
      },
      updateMetrics(newMetrics: DreamMetric[]) {
        metrics = newMetrics;
        render();
      }
    };
  }
);

// Step 3: Add event support if needed
// Usage example:
// const summary = createMetricsSummary({
//   container: document.getElementById('summary-container')!,
//   metrics: [{name: 'Clarity', icon: 'sun', minValue: 1, maxValue: 5}],
//   entries: [{date: '2023-01-01', metrics: {Clarity: 4}}]
// });
// 
// const eventableSummary = migrateToEventable(summary, ['update']);
// eventableSummary.on('update', () => console.log('Summary updated')); 