/**
 * DOM Helper Functions
 * 
 * This file contains utility functions for safely manipulating the DOM
 * in OneiroMetrics UI components.
 */

/**
 * Creates an element with attributes and optional content
 * @param tag Element tag name
 * @param attributes Optional attributes to set
 * @param content Optional content (string or child elements)
 * @returns The created DOM element
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string>,
  content?: string | HTMLElement | HTMLElement[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  
  // Set attributes if provided
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    });
  }
  
  // Add content if provided
  if (content) {
    if (typeof content === 'string') {
      element.textContent = content;
    } else if (Array.isArray(content)) {
      content.forEach(child => element.appendChild(child));
    } else {
      element.appendChild(content);
    }
  }
  
  return element;
}

/**
 * Safely removes an element from the DOM
 * @param element Element to remove
 * @returns True if successful
 */
export function removeElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  
  if (element.parentNode) {
    element.parentNode.removeChild(element);
    return true;
  }
  
  return false;
}

/**
 * Creates a button with text, class, and click handler
 * @param text Button text
 * @param className CSS class name
 * @param onClick Click handler
 * @returns The created button element
 */
export function createButton(
  text: string,
  className: string,
  onClick: (e: MouseEvent) => void
): HTMLButtonElement {
  const button = createElement('button', { className }, text);
  button.addEventListener('click', onClick);
  return button;
}

/**
 * Creates a standard icon element
 * @param iconName Icon name (from Lucide icon set)
 * @param className Optional additional CSS class
 * @returns The created icon element
 */
export function createIcon(
  iconName: string,
  className?: string
): HTMLElement {
  const iconEl = createElement('span', { 
    className: `oom-icon ${className || ''}`.trim() 
  });
  
  // Set data attributes for Obsidian icon system
  iconEl.setAttribute('data-icon', iconName);
  
  return iconEl;
}

/**
 * Safely finds an element by selector, with optional parent context
 * @param selector CSS selector
 * @param parent Optional parent element (defaults to document)
 * @returns The found element or null
 */
export function findElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent: HTMLElement | Document = document
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Safely finds all elements matching a selector
 * @param selector CSS selector
 * @param parent Optional parent element (defaults to document)
 * @returns Array of found elements
 */
export function findAllElements<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent: HTMLElement | Document = document
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

/**
 * Adds a CSS class to an element, safely handling null elements
 * @param element Element to modify
 * @param className Class to add
 * @returns True if successful
 */
export function addClass(
  element: HTMLElement | null,
  className: string
): boolean {
  if (!element) return false;
  
  element.classList.add(className);
  return true;
}

/**
 * Removes a CSS class from an element, safely handling null elements
 * @param element Element to modify
 * @param className Class to remove
 * @returns True if successful
 */
export function removeClass(
  element: HTMLElement | null,
  className: string
): boolean {
  if (!element) return false;
  
  element.classList.remove(className);
  return true;
}

/**
 * Sets or toggles a CSS class based on a condition
 * @param element Element to modify
 * @param className Class to toggle
 * @param condition Condition determining whether class should be applied
 * @returns True if successful
 */
export function setClassIf(
  element: HTMLElement | null,
  className: string,
  condition: boolean
): boolean {
  if (!element) return false;
  
  if (condition) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
  
  return true;
}

/**
 * Creates a metric display element with icon and value
 * @param metric Metric object
 * @param value Value to display
 * @returns Created metric element
 */
export function createMetricElement(
  metric: { name: string; icon: string },
  value: number | string
): HTMLElement {
  const metricContainer = createElement('div', {
    className: 'oom-metric-item',
    'data-metric': metric.name
  });
  
  const icon = createIcon(metric.icon, 'oom-metric-icon');
  const valueEl = createElement('span', { className: 'oom-metric-value' }, String(value));
  const nameEl = createElement('span', { className: 'oom-metric-name' }, metric.name);
  
  metricContainer.appendChild(icon);
  metricContainer.appendChild(valueEl);
  metricContainer.appendChild(nameEl);
  
  return metricContainer;
} 