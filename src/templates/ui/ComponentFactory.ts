/**
 * Component Factory
 * 
 * Provides utilities for creating UI components in a consistent manner.
 * This module replaces the legacy component-migrator.ts functions.
 */

import { setIcon } from 'obsidian';
import { BaseComponent, EventableComponent } from './BaseComponent';
import { createEventHandler } from './EventHandling';
import { DreamMetric } from '../../types/core';
import { warn } from '../../logging';
import safeLogger from '../../logging/safe-logger';

/**
 * Options for creating a component
 */
export interface ComponentOptions {
  className?: string;
  tag?: string;
  id?: string;
  text?: string;
  title?: string;
  parent?: HTMLElement;
  attributes?: Record<string, string>;
  events?: Record<string, (event: Event) => void>;
}

// Add backward compatibility interface
export interface OOMComponentProps {
  container: HTMLElement;
  className?: string;
  id?: string;
  metrics?: DreamMetric[];
  entries?: any[];
}

// Type for component constructor functions
export type ComponentConstructor<T = any> = new (props: Partial<OOMComponentProps>) => T;

/**
 * Creates a component with the specified options
 * @param options Component options
 * @returns The created component
 */
export function createComponent(options: ComponentOptions = {}): HTMLElement {
  // Create element with specified tag or default to div
  const el = document.createElement(options.tag || 'div');
  
  // Add class if specified
  if (options.className) {
    el.className = options.className;
  }
  
  // Add ID if specified
  if (options.id) {
    el.id = options.id;
  }
  
  // Add text if specified
  if (options.text) {
    el.textContent = options.text;
  }
  
  // Add title if specified
  if (options.title) {
    el.title = options.title;
  }
  
  // Add attributes if specified
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  
  // Add events if specified
  if (options.events) {
    Object.entries(options.events).forEach(([eventName, handler]) => {
      el.addEventListener(eventName, createEventHandler(handler));
    });
  }
  
  // Append to parent if specified
  if (options.parent) {
    options.parent.appendChild(el);
  }
  
  return el;
}

// Backward compatibility: Create a component instance with proper typing and event handling
export function createComponent2<T extends BaseComponent>(
  componentClass: ComponentConstructor<T>,
  props: Partial<OOMComponentProps> = {}
): T {
  // Standardize component properties
  const standardProps: OOMComponentProps = {
    container: props.container || document.createElement('div'),
    className: props.className || '',
    id: props.id || `oom-component-${Date.now()}`,
    metrics: props.metrics || [],
    entries: props.entries || []
  };
  
  return new componentClass(standardProps);
}

// Backward compatibility: Create an EventableComponent
export function createEventableComponent(
  props: Partial<OOMComponentProps> = {}
): EventableComponent {
  return new EventableComponent(props);
}

// Backward compatibility: Wraps an existing DOM element in a BaseComponent
export function createComponentFromElement(
  element: HTMLElement,
  className?: string
): BaseComponent {
  const props: Partial<OOMComponentProps> = {
    container: element.parentElement || undefined,
    className
  };
  
  // Create a base component
  const component = new BaseComponent(props);
  
  // Add the class name if provided
  if (className) {
    element.classList.add(className);
  }
  
  return component;
}

// Backward compatibility: Creates a specialized UI component with consistent styling
export function createUIComponent<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<OOMComponentProps> = {},
  content?: string | HTMLElement | HTMLElement[]
): BaseComponent {
  const component = new BaseComponent(props);
  
  // Create the element with the specified tag
  const element = document.createElement(tag);
  element.className = props.className || '';
  
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
  
  // Clear and append the new element
  if (component['container']) {
    component['container'].innerHTML = '';
    component['container'].appendChild(element);
  }
  
  return component;
}

// Backward compatibility: Creates a component from a legacy constructor function
export function createComponentFromLegacy<T extends Record<string, any>>(
  constructorFn: (container: HTMLElement, ...args: any[]) => T,
  props: Partial<OOMComponentProps> & Record<string, any> = {}
): BaseComponent & T {
  // Create a base component
  const baseComponent = new BaseComponent(props);
  
  // Extract the needed properties for the constructor
  const container = baseComponent['container'];
  const value = props.value;
  
  // Create the legacy component
  const legacyComponent = constructorFn(container, value);
  
  // Create a merged component object that has both BaseComponent and legacy methods
  const result = Object.assign({}, baseComponent, legacyComponent) as BaseComponent & T;
  
  return result;
}

/**
 * Creates a button with the specified options
 * @param text Button text
 * @param onClick Click handler
 * @param icon Optional icon name
 * @param className Optional class name
 * @returns The created button
 */
export function createButton(
  text: string,
  onClick: (event: MouseEvent) => void,
  icon?: string,
  className: string = 'oom-button'
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  
  // Add icon if specified
  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'oom-button-icon';
    try {
      setIcon(iconEl, icon);
    } catch (error) {
      try {
        safeLogger.warn('ComponentFactory', `Failed to set icon ${icon}`, error);
      } catch (e) {
        warn('ComponentFactory', `Failed to set icon ${icon}`, error);
      }
    }
    button.appendChild(iconEl);
  }
  
  // Add text
  const textEl = document.createElement('span');
  textEl.className = 'oom-button-text';
  textEl.textContent = text;
  button.appendChild(textEl);
  
  // Add click handler
  button.addEventListener('click', onClick);
  
  return button;
}

/**
 * Creates a header with the specified title and icon
 * @param title Header title
 * @param icon Optional icon name
 * @param level Header level (1-6)
 * @param className Optional class name
 * @returns The created header
 */
export function createHeader(
  title: string,
  icon?: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 2,
  className: string = 'oom-header'
): HTMLHeadingElement {
  const header = document.createElement(`h${level}`);
  header.className = className;
  
  // Add icon if specified
  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'oom-header-icon';
    try {
      setIcon(iconEl, icon);
    } catch (error) {
      try {
        safeLogger.warn('ComponentFactory', `Failed to set icon ${icon}`, error);
      } catch (e) {
        warn('ComponentFactory', `Failed to set icon ${icon}`, error);
      }
    }
    header.appendChild(iconEl);
  }
  
  // Add title
  const titleEl = document.createElement('span');
  titleEl.className = 'oom-header-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);
  
  return header;
}

/**
 * Creates a component class instance
 * This function is provided for backward compatibility with component-migrator.ts
 * @param componentClass Component class
 * @param options Component options
 * @returns The created component
 * @deprecated Use direct class instantiation instead
 */
export function createCompatibleComponent<T extends BaseComponent>(
  componentClass: new (options: any) => T,
  options: any
): T {
  return new componentClass(options);
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
  const container = document.createElement('div');
  container.className = 'oom-metric-slider';
  container.setAttribute('data-metric', metric.name);
  
  // Create label with icon
  const label = document.createElement('label');
  label.className = 'oom-slider-label';
  
  // Create icon
  const icon = document.createElement('span');
  icon.className = 'oom-icon';
  try {
    setIcon(icon, metric.icon || 'help-circle');
  } catch (error) {
    try {
      safeLogger.warn('ComponentFactory', `Failed to set icon ${metric.icon}`, error);
    } catch (e) {
      warn('ComponentFactory', `Failed to set icon ${metric.icon}`, error);
    }
    icon.textContent = '?';
  }
  
  // Create name span
  const nameSpan = document.createElement('span');
  nameSpan.className = 'oom-slider-name';
  nameSpan.textContent = metric.name;
  
  label.appendChild(icon);
  label.appendChild(nameSpan);
  container.appendChild(label);
  
  // Create input slider
  const min = metric.minValue || metric.min || 1;
  const max = metric.maxValue || metric.max || 5;
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  slider.value = String(initialValue);
  slider.className = 'oom-slider';
  
  // Create value display
  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'oom-slider-value';
  valueDisplay.textContent = String(initialValue);
  
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
 * Creates a standardized header for components
 * @param title Header title
 * @param icon Optional icon name
 * @returns The created header element
 */
export function createComponentHeader(
  title: string,
  icon?: string
): HTMLElement {
  const header = document.createElement('div');
  header.className = 'oom-component-header';
  
  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'oom-icon';
    try {
      setIcon(iconEl, icon);
    } catch (error) {
      try {
        safeLogger.warn('ComponentFactory', `Failed to set icon ${icon}`, error);
      } catch (e) {
        warn('ComponentFactory', `Failed to set icon ${icon}`, error);
      }
    }
    header.appendChild(iconEl);
  }
  
  const titleEl = document.createElement('h3');
  titleEl.className = 'oom-component-title';
  titleEl.textContent = title;
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
  const button = document.createElement('button');
  button.className = 'oom-component-button';
  
  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'oom-icon';
    try {
      setIcon(iconEl, icon);
    } catch (error) {
      try {
        safeLogger.warn('ComponentFactory', `Failed to set icon ${icon}`, error);
      } catch (e) {
        warn('ComponentFactory', `Failed to set icon ${icon}`, error);
      }
    }
    button.appendChild(iconEl);
  }
  
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  button.appendChild(textSpan);
  
  button.addEventListener('click', onClick);
  
  return button;
} 