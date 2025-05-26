/**
 * Metrics Editor Component
 * 
 * A UI component for editing dream metrics values.
 */

import { DreamMetric, DreamMetricData } from '../../types/core';
import { EventableComponent, ComponentEventHandler } from './BaseComponent';
import { createMetricSlider, createComponentHeader, createComponentButton } from '../../utils/ui-component-adapter';
import { adaptMetricForUI } from './MetricComponent';

/**
 * Properties for the MetricsEditor component
 */
export interface MetricsEditorProps {
  container: HTMLElement;
  metrics?: DreamMetric[];
  entry?: DreamMetricData;
  title?: string;
  showSaveButton?: boolean;
  onSave?: ComponentEventHandler<Record<string, number>>;
  onChange?: ComponentEventHandler<{metric: string, value: number}>;
}

/**
 * Component for editing dream metrics values
 */
export class MetricsEditor extends EventableComponent {
  /**
   * Available metrics for editing
   */
  private metrics: DreamMetric[] = [];
  
  /**
   * Current entry being edited
   */
  private entry: DreamMetricData | null = null;
  
  /**
   * Current metric values
   */
  private values: Record<string, number> = {};
  
  /**
   * Show save button
   */
  private showSaveButton: boolean = true;
  
  /**
   * Component title
   */
  private title: string = 'Dream Metrics';
  
  /**
   * Creates a new MetricsEditor component
   * @param props Component properties
   */
  constructor(props: Partial<MetricsEditorProps>) {
    super(props);
    
    // Set properties with defaults
    this.metrics = props.metrics || [];
    this.entry = props.entry || null;
    this.showSaveButton = props.showSaveButton !== undefined ? props.showSaveButton : true;
    this.title = props.title || 'Dream Metrics';
    
    // Initialize values from entry if available
    if (this.entry && this.entry.metrics) {
      // Ensure we only use number values to avoid type errors
      const numericMetrics: Record<string, number> = {};
      
      Object.entries(this.entry.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          numericMetrics[key] = value;
        } else if (typeof value === 'string') {
          // Try to parse string values as numbers
          const parsed = parseFloat(value);
          if (!isNaN(parsed)) {
            numericMetrics[key] = parsed;
          }
        }
      });
      
      this.values = numericMetrics;
    }
    
    // Register event handlers if provided
    if (props.onSave) {
      this.on('save', props.onSave);
    }
    
    if (props.onChange) {
      this.on('change', props.onChange);
    }
    
    // Add component-specific class
    this.container.classList.add('oom-metrics-editor');
  }
  
  /**
   * Renders the component
   */
  render(): void {
    if (this.isRendered) {
      this.update();
      return;
    }
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create header
    const header = createComponentHeader(this.title, 'bar-chart-2');
    this.container.appendChild(header);
    
    // Create metrics sliders
    const slidersContainer = this.createElement('div', { className: 'oom-metrics-sliders' });
    
    this.metrics.forEach(metric => {
      // Use permanent implementation to standardize metric properties
      const adaptedMetric = adaptMetricForUI(metric);
      
      // Get initial value from current values or default to minimum
      const initialValue = this.values[metric.name] || adaptedMetric.minValue;
      
      // Create slider
      const slider = createMetricSlider(
        adaptedMetric,
        initialValue,
        (value: number) => this.handleMetricChange(metric.name, value)
      );
      
      slidersContainer.appendChild(slider);
    });
    
    this.container.appendChild(slidersContainer);
    
    // Create save button if needed
    if (this.showSaveButton) {
      const buttonsContainer = this.createElement('div', { className: 'oom-editor-buttons' });
      
      const saveButton = createComponentButton(
        'Save Metrics',
        () => this.handleSave(),
        'save'
      );
      
      buttonsContainer.appendChild(saveButton);
      this.container.appendChild(buttonsContainer);
    }
    
    super.render();
  }
  
  /**
   * Updates the component with new data
   * @param entry Optional new entry to edit
   */
  update(entry?: DreamMetricData): void {
    if (entry) {
      this.entry = entry;
      
      // Update values from entry
      if (this.entry.metrics) {
        // Ensure we only use number values to avoid type errors
        const numericMetrics: Record<string, number> = {};
        
        Object.entries(this.entry.metrics).forEach(([key, value]) => {
          if (typeof value === 'number') {
            numericMetrics[key] = value;
          } else if (typeof value === 'string') {
            // Try to parse string values as numbers
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
              numericMetrics[key] = parsed;
            }
          }
        });
        
        this.values = numericMetrics;
      } else {
        this.values = {};
      }
      
      // Re-render if already rendered
      if (this.isRendered) {
        this.render();
      }
    }
  }
  
  /**
   * Sets available metrics
   * @param metrics Metrics to set
   */
  setMetrics(metrics: DreamMetric[]): void {
    this.metrics = metrics;
    
    // Re-render if already rendered
    if (this.isRendered) {
      this.render();
    }
  }
  
  /**
   * Gets current metric values
   * @returns Current metric values
   */
  getValues(): Record<string, number> {
    return { ...this.values };
  }
  
  /**
   * Handles metric value changes
   * @param metricName Metric name
   * @param value New value
   */
  private handleMetricChange(metricName: string, value: number): void {
    // Update value
    this.values[metricName] = value;
    
    // Trigger change event
    this.trigger('change', { metric: metricName, value });
  }
  
  /**
   * Handles save button click
   */
  private handleSave(): void {
    // Trigger save event with current values
    this.trigger('save', this.getValues());
  }
} 