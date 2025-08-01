/**
 * Metric Component
 * 
 * This file provides utilities for rendering and managing metric UI components
 * in a consistent manner across the application.
 */

import { setIcon } from 'obsidian';
import { BaseComponent, EventableComponent } from './BaseComponent';
import { DreamMetric } from '../../types/core';
import { standardizeMetric } from '../../utils/metric-helpers';
import { getLogger } from '../../logging';

// Import directly from absolute path without the .ts extension
// This matches what main.ts is doing (line 114)
import { lucideIconMap } from '../../../settings';

/**
 * Configuration options for metric component
 */
export interface MetricComponentOptions {
  metric: DreamMetric;
  showIcon?: boolean;
  showValue?: boolean;
  showName?: boolean;
  editButton?: boolean;
  toggleButton?: boolean;
  compact?: boolean;
  onClick?: (metric: DreamMetric) => void;
  onEdit?: (metric: DreamMetric) => void;
  onToggle?: (metric: DreamMetric, enabled: boolean) => void;
}

/**
 * Default options for the MetricComponent
 */
const DEFAULT_OPTIONS: Partial<MetricComponentOptions> = {
  showIcon: true,
  showValue: true,
  showName: true,
  editButton: false,
  toggleButton: false,
  compact: false
};

/**
 * Component for displaying and interacting with a metric
 */
export class MetricComponent extends EventableComponent {
  private metric: DreamMetric;
  private options: MetricComponentOptions;
  private iconElement: HTMLElement | null = null;
  private nameElement: HTMLElement | null = null;
  private valueElement: HTMLElement | null = null;
  private editButton: HTMLElement | null = null;
  private toggleButton: HTMLElement | null = null;
  
  constructor(options: MetricComponentOptions) {
    // Set container and class name
    super({
      className: 'oom-metric-component'
    });
    
    // Standardize the metric to ensure it has all required properties
    this.metric = standardizeMetric(options.metric);
    
    // Merge with default options
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Add classes based on options
    if (this.options.compact) {
      this.container.addClass('oom-metric-compact');
    }
    
    if (!this.metric.enabled) {
      this.container.addClass('oom-metric-disabled');
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
        // Don't trigger if clicking buttons
        if (
          (this.editButton && e.target === this.editButton) ||
          (this.toggleButton && e.target === this.toggleButton)
        ) {
          return;
        }
        
        this.options.onClick?.(this.metric);
        this.trigger('click', this.metric);
      });
    }
  }
  
  /**
   * Render the component
   */
  render(): void {
    this.container.empty();
    
    // Create icon if enabled
    if (this.options.showIcon && this.metric.icon) {
      this.iconElement = this.container.createSpan({
        cls: 'oom-metric-icon-svg oom-metric-icon'
      });
      
      // Direct HTML approach (based on main.ts line 2037)
      if (typeof lucideIconMap === 'object' && lucideIconMap && this.metric.icon in lucideIconMap) {
        // Parse the SVG string and set it safely
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(lucideIconMap[this.metric.icon], 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        if (svgElement && svgElement.tagName === 'svg') {
          this.iconElement.appendChild(svgElement.cloneNode(true));
        }
      } else {
        // Fallback if lucideIconMap isn't available or doesn't contain the icon
        try {
          setIcon(this.iconElement, this.metric.icon);
          
          // If setIcon didn't work, use fallback
          if (!this.iconElement.querySelector('svg') && !this.iconElement.textContent?.trim()) {
            this.iconElement.addClass('oom-icon-fallback');
            this.iconElement.setText(this.metric.icon.substring(0, 1).toUpperCase());
          }
        } catch (error) {
          // Fallback: Use the first letter of the icon name
          const logger = getLogger('MetricComponent');
          logger.warn('UI', `Failed to set icon ${this.metric.icon}:`, error);
          this.iconElement.addClass('oom-icon-fallback');
          this.iconElement.setText(this.metric.icon.substring(0, 1).toUpperCase());
        }
      }
    }
    
    // Create name if enabled
    if (this.options.showName) {
      this.nameElement = this.container.createSpan({
        cls: 'oom-metric-name',
        text: this.metric.name
      });
    }
    
    // Create value if enabled and available
    if (this.options.showValue && 'value' in this.metric) {
      this.valueElement = this.container.createSpan({
        cls: 'oom-metric-value',
        text: String(this.metric.value)
      });
    }
    
    // Create edit button if enabled
    if (this.options.editButton) {
      this.editButton = this.container.createSpan({
        cls: 'oom-metric-edit-button'
      });
      
      // Direct HTML approach for the edit button
      if (typeof lucideIconMap === 'object' && lucideIconMap && 'pencil' in lucideIconMap) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(lucideIconMap['pencil'], 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        if (svgElement && svgElement.tagName === 'svg') {
          this.editButton.appendChild(svgElement.cloneNode(true));
        }
      } else {
        setIcon(this.editButton, 'pencil');
      }
      
      this.editButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.options.onEdit?.(this.metric);
        this.trigger('edit', this.metric);
      });
    }
    
    // Create toggle button if enabled
    if (this.options.toggleButton) {
      this.toggleButton = this.container.createSpan({
        cls: 'oom-metric-toggle-button'
      });
      
      const toggleIcon = this.metric.enabled ? 'check-circle' : 'circle';
      
      // Direct HTML approach for the toggle button
      if (typeof lucideIconMap === 'object' && lucideIconMap && toggleIcon in lucideIconMap) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(lucideIconMap[toggleIcon], 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        if (svgElement && svgElement.tagName === 'svg') {
          this.toggleButton.appendChild(svgElement.cloneNode(true));
        }
      } else {
        setIcon(this.toggleButton, toggleIcon);
      }
      
      this.toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Toggle enabled state
        this.metric.enabled = !this.metric.enabled;
        
        // Update icon
        const newToggleIcon = this.metric.enabled ? 'check-circle' : 'circle';
        
        // Direct HTML approach for updating the toggle button
        if (typeof lucideIconMap === 'object' && lucideIconMap && newToggleIcon in lucideIconMap) {
          // Clear existing content
          while (this.toggleButton!.firstChild) {
            this.toggleButton!.removeChild(this.toggleButton!.firstChild);
          }
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(lucideIconMap[newToggleIcon], 'image/svg+xml');
          const svgElement = svgDoc.documentElement;
          if (svgElement && svgElement.tagName === 'svg') {
            this.toggleButton!.appendChild(svgElement.cloneNode(true));
          }
        } else {
          setIcon(this.toggleButton!, newToggleIcon);
        }
        
        // Update container class
        if (this.metric.enabled) {
          this.container.removeClass('oom-metric-disabled');
        } else {
          this.container.addClass('oom-metric-disabled');
        }
        
        // Trigger callbacks
        this.options.onToggle?.(this.metric, this.metric.enabled);
        this.trigger('toggle', { metric: this.metric, enabled: this.metric.enabled });
      });
    }
  }
  
  /**
   * Update the component with a new metric
   * @param metric New metric data
   */
  updateMetric(metric: DreamMetric): void {
    this.metric = standardizeMetric(metric);
    this.render();
  }
  
  /**
   * Get the current metric
   * @returns Current metric data
   */
  getMetric(): DreamMetric {
    return this.metric;
  }
}

/**
 * Adapts a metric object for UI display
 * @param metric The metric to adapt
 * @returns A standardized metric object suitable for UI display
 */
export function adaptMetricForUI(metric: DreamMetric): DreamMetric {
  const standardized = standardizeMetric(metric);
  
  // Ensure name is display-friendly
  if (!standardized.name) {
    standardized.name = standardized.name || 'Unnamed Metric';
  }
  
  // Ensure icon is present
  if (!standardized.icon) {
    standardized.icon = 'bar-chart';
  }
  
  return standardized;
}

/**
 * Creates a metric component
 * @param options Component options
 * @returns A new MetricComponent instance
 */
export function createMetricComponent(options: MetricComponentOptions): MetricComponent {
  return new MetricComponent(options);
} 