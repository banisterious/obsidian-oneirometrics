/**
 * UI Component Adapters
 * 
 * This file contains adapter functions specifically for UI components
 * to ensure proper typing and consistent parameter handling.
 */

import { DreamMetric, DreamMetricData } from '../types/core';
import { createIcon, createElement } from './dom-helpers';
import { isMetricEnabled } from './type-guards';

/**
 * Standard component properties for OneiroMetrics UI elements
 */
export interface OOMComponentProps {
  container: HTMLElement;
  className?: string;
  id?: string;
  metrics?: DreamMetric[];
  entries?: DreamMetricData[];
}

/**
 * Standardizes component properties to ensure consistent interface
 * @param props Partial or legacy component properties
 * @returns Standardized component properties
 */
export function standardizeComponentProps(props: Partial<OOMComponentProps>): OOMComponentProps {
  return {
    container: props.container || document.createElement('div'),
    className: props.className || '',
    id: props.id || `oom-component-${Date.now()}`,
    metrics: props.metrics || [],
    entries: props.entries || []
  };
}

/**
 * Creates a standard component container with consistent styling
 * @param props Component properties
 * @returns The created container element
 */
export function createComponentContainer(props: Partial<OOMComponentProps>): HTMLElement {
  const standardProps = standardizeComponentProps(props);
  
  const containerClass = `oom-component ${standardProps.className}`.trim();
  const container = createElement('div', { 
    className: containerClass,
    id: standardProps.id
  });
  
  standardProps.container.appendChild(container);
  return container;
}

/**
 * Creates a metric slider component with proper typing
 * @param metric Metric configuration
 * @param initialValue Initial value
 * @param onChange Change handler
 * @returns The created slider element
 */
export function createMetricSlider(
  metric: DreamMetric,
  initialValue: number,
  onChange: (value: number) => void
): HTMLElement {
  const container = createElement('div', { 
    className: 'oom-metric-slider',
    'data-metric': metric.name
  });
  
  // Create label with icon
  const label = createElement('label', { className: 'oom-slider-label' });
  const icon = createIcon(metric.icon || 'help-circle');
  const nameSpan = createElement('span', { className: 'oom-slider-name' }, metric.name);
  
  label.appendChild(icon);
  label.appendChild(nameSpan);
  container.appendChild(label);
  
  // Create input slider
  const min = metric.minValue || metric.min || 1;
  const max = metric.maxValue || metric.max || 5;
  const slider = createElement('input', {
    type: 'range',
    min: String(min),
    max: String(max),
    value: String(initialValue),
    className: 'oom-slider'
  }) as HTMLInputElement;
  
  // Create value display
  const valueDisplay = createElement('span', { 
    className: 'oom-slider-value' 
  }, String(initialValue));
  
  // Add event listener
  slider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    valueDisplay.textContent = String(value);
    onChange(value);
  });
  
  container.appendChild(slider);
  container.appendChild(valueDisplay);
  
  return container;
}

/**
 * Creates a metric selector/toggle component
 * @param metric Metric configuration
 * @param selected Whether the metric is selected
 * @param onToggle Toggle handler
 * @returns The created toggle element
 */
export function createMetricToggle(
  metric: DreamMetric,
  selected: boolean,
  onToggle: (selected: boolean) => void
): HTMLElement {
  const container = createElement('div', {
    className: `oom-metric-toggle ${selected ? 'selected' : ''}`,
    'data-metric': metric.name
  });
  
  const icon = createIcon(metric.icon || 'help-circle');
  const nameSpan = createElement('span', { className: 'oom-toggle-name' }, metric.name);
  
  container.appendChild(icon);
  container.appendChild(nameSpan);
  
  container.addEventListener('click', () => {
    const newState = !container.classList.contains('selected');
    container.classList.toggle('selected', newState);
    onToggle(newState);
  });
  
  return container;
}

/**
 * Creates a standardized header for components
 * @param title Header title
 * @param icon Optional icon name
 * @returns The created header element
 */
export function createComponentHeader(
  title: string,
  icon?: string
): HTMLElement {
  const header = createElement('div', { className: 'oom-component-header' });
  
  if (icon) {
    const iconEl = createIcon(icon);
    header.appendChild(iconEl);
  }
  
  const titleEl = createElement('h3', { className: 'oom-component-title' }, title);
  header.appendChild(titleEl);
  
  return header;
}

/**
 * Creates a standardized button for components
 * @param text Button text
 * @param onClick Click handler
 * @param icon Optional icon
 * @returns The created button
 */
export function createComponentButton(
  text: string,
  onClick: (e: MouseEvent) => void,
  icon?: string
): HTMLElement {
  const button = createElement('button', { className: 'oom-component-button' });
  
  if (icon) {
    const iconEl = createIcon(icon);
    button.appendChild(iconEl);
  }
  
  const textSpan = createElement('span', {}, text);
  button.appendChild(textSpan);
  
  button.addEventListener('click', onClick);
  
  return button;
} 