/**
 * Base Component Class
 * 
 * Provides a foundation for all OneiroMetrics UI components with
 * type-safe methods and standardized lifecycle.
 * 
 * Enhanced with error boundary functionality and defensive coding practices.
 */

import { OOMComponentProps, standardizeComponentProps } from '../../utils/ui-component-adapter';
import { findElement, addClass, removeClass, createElement } from '../../utils/dom-helpers';
import { withErrorHandling, isObject } from '../../utils/defensive-utils';
import safeLogger from '../../logging/safe-logger';
import { ErrorBoundaryOptions } from '../../types/ui-types';
import { SafeDOMUtils } from '../../utils/SafeDOMUtils';

/**
 * Base component class that all UI components should extend
 */
export class BaseComponent {
  /**
   * The component's root container element
   */
  protected container: HTMLElement;
  
  /**
   * Component ID for reference
   */
  protected id: string;
  
  /**
   * Base CSS class for the component
   */
  protected className: string;
  
  /**
   * Flag indicating if the component has been rendered
   */
  protected isRendered: boolean = false;
  
  /**
   * Error boundary options
   */
  protected errorBoundaryOptions: ErrorBoundaryOptions = {
    showFallback: true,
    onError: (error: Error, componentName: string) => {
      safeLogger.error('UIComponent', `Error in component ${componentName || this.id}:`, error);
    },
    fallbackMessage: 'Something went wrong rendering this component.'
  };
  
  /**
   * Whether the component is currently in an error state
   */
  protected hasError: boolean = false;
  
  /**
   * Creates a new component instance
   * @param props Component properties
   */
  constructor(props: Partial<OOMComponentProps>) {
    const standardProps = standardizeComponentProps(props);
    
    this.id = standardProps.id;
    this.className = standardProps.className;
    
    // Create the container if it doesn't exist
    this.container = createElement('div', {
      id: this.id,
      className: `oom-component ${this.className}`.trim()
    });
    
    // Append to parent if provided
    if (standardProps.container) {
      standardProps.container.appendChild(this.container);
    }
    
    // Set error boundary options if provided
    if (isObject(standardProps.errorBoundary)) {
      this.errorBoundaryOptions = {
        ...this.errorBoundaryOptions,
        ...standardProps.errorBoundary
      };
    }
  }
  
  /**
   * Renders the component with error boundary protection
   */
  render(): void {
    if (this.hasError && this.errorBoundaryOptions.showFallback) {
      this.renderErrorFallback();
      return;
    }
    
    try {
      if (this.isRendered) {
        this.update();
        return;
      }
      
      this.renderContent();
      this.isRendered = true;
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * Renders the component content
   * Override in child classes
   */
  protected renderContent(): void {
    // Default implementation does nothing
  }
  
  /**
   * Handles errors that occur during rendering
   * @param error The error that occurred
   */
  protected handleError(error: Error): void {
    this.hasError = true;
    
    // Call the error handler if provided
    if (this.errorBoundaryOptions.onError) {
      this.errorBoundaryOptions.onError(error, this.constructor.name);
    } else {
      safeLogger.error('UIComponent', `Error in component ${this.constructor.name}:`, error);
    }
    
    // Render fallback UI if enabled
    if (this.errorBoundaryOptions.showFallback) {
      this.renderErrorFallback();
    }
  }
  
  /**
   * Renders a fallback UI when an error occurs
   */
  protected renderErrorFallback(): void {
    try {
      // Clear the container
      SafeDOMUtils.safelyEmptyContainer(this.container);
      
      // Add error class
      addClass(this.container, 'oom-component-error');
      
      // Create error message
      const errorMessage = createElement('div', {
        className: 'oom-error-message'
      });
      errorMessage.textContent = this.errorBoundaryOptions.fallbackMessage || 'Something went wrong.';
      
      // Create retry button
      const retryButton = createElement('button', {
        className: 'oom-error-retry'
      });
      retryButton.textContent = 'Retry';
      retryButton.addEventListener('click', () => this.retry());
      
      // Append elements
      this.container.appendChild(errorMessage);
      this.container.appendChild(retryButton);
    } catch (fallbackError) {
      // Last resort - if even the fallback fails
      SafeDOMUtils.safelyEmptyContainer(this.container);
      const errorDiv = createElement('div', { className: 'oom-critical-error' });
      errorDiv.textContent = 'Component Error';
      this.container.appendChild(errorDiv);
      safeLogger.error('UIComponent', 'Error rendering fallback UI:', fallbackError);
    }
  }
  
  /**
   * Retry rendering after an error
   */
  retry(): void {
    this.hasError = false;
    removeClass(this.container, 'oom-component-error');
    SafeDOMUtils.safelyEmptyContainer(this.container);
    this.isRendered = false;
    this.render();
  }
  
  /**
   * Updates the component with new data
   * Override in child classes
   */
  update(): void {
    // Default implementation does nothing
  }
  
  /**
   * Shows the component
   */
  show(): void {
    removeClass(this.container, 'oom-hidden');
  }
  
  /**
   * Hides the component
   */
  hide(): void {
    addClass(this.container, 'oom-hidden');
  }
  
  /**
   * Sets the visibility of the component
   * @param visible Whether the component should be visible
   */
  setVisible(visible: boolean): void {
    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  }
  
  /**
   * Finds an element within this component
   * @param selector CSS selector for the element
   * @returns The found element or null
   */
  findElement<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return findElement<T>(selector, this.container);
  }
  
  /**
   * Creates and appends a child element to this component
   * @param tag Element tag name
   * @param attributes Optional attributes
   * @param content Optional content
   * @returns The created element
   */
  createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes?: Record<string, string>,
    content?: string | HTMLElement | HTMLElement[]
  ): HTMLElementTagNameMap[K] {
    try {
      const element = createElement(tag, attributes, content);
      this.container.appendChild(element);
      return element;
    } catch (error) {
      safeLogger.error('UIComponent', `Error creating element ${tag}:`, error);
      // Return a fallback element to prevent null references
      return document.createElement(tag);
    }
  }
  
  /**
   * Safely executes a function with error handling
   * @param fn The function to execute
   * @param fallbackValue The value to return if the function throws
   * @returns The result of the function or the fallback value
   */
  protected safeExecute<T>(fn: () => T, fallbackValue: T): T {
    try {
      return fn();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      return fallbackValue;
    }
  }
  
  /**
   * Destroys the component and removes it from the DOM
   */
  destroy(): void {
    try {
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      
      this.isRendered = false;
    } catch (error) {
      safeLogger.error('UIComponent', `Error destroying component ${this.id}:`, error);
    }
  }
}

/**
 * Event handler type for component events
 */
export type ComponentEventHandler<T = any> = (data: T) => void;

/**
 * Base component with event handling capabilities
 */
export class EventableComponent extends BaseComponent {
  /**
   * Event handlers by event name
   */
  private eventHandlers: Map<string, Set<ComponentEventHandler>> = new Map();
  
  /**
   * Adds an event handler
   * @param eventName Event name
   * @param handler Event handler function
   */
  on<T = any>(eventName: string, handler: ComponentEventHandler<T>): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    
    this.eventHandlers.get(eventName)!.add(handler);
  }
  
  /**
   * Removes an event handler
   * @param eventName Event name
   * @param handler Event handler function
   */
  off<T = any>(eventName: string, handler: ComponentEventHandler<T>): void {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    this.eventHandlers.get(eventName)!.delete(handler);
  }
  
  /**
   * Triggers an event with error handling
   * @param eventName Event name
   * @param data Event data
   */
  trigger<T = any>(eventName: string, data?: T): void {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    for (const handler of this.eventHandlers.get(eventName)!) {
      try {
        handler(data);
      } catch (error) {
        safeLogger.error('EventableComponent', `Error in event handler for ${eventName}:`, error);
        // Continue with other handlers even if one fails
      }
    }
  }
  
  /**
   * Destroys the component and removes all event handlers
   */
  destroy(): void {
    super.destroy();
    
    // Clear all event handlers
    this.eventHandlers.clear();
  }
} 