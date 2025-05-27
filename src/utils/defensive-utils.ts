/**
 * Defensive Coding Utilities
 * 
 * This module provides utility functions and classes for implementing defensive
 * coding practices throughout the OneiroMetrics plugin. These utilities help
 * create robust, error-resistant code that can withstand unexpected conditions.
 * 
 * @module defensive-utils
 */

import { Notice } from 'obsidian';

// Type for a function that takes any arguments and returns any value
type AnyFunction = (...args: any[]) => any;

/**
 * Safely access a property through a getter function with a fallback value
 * 
 * @param obj - The object to access properties from
 * @param getter - A function that retrieves the desired property
 * @param fallback - The value to return if the property cannot be accessed
 * @returns The property value or fallback
 */
export function getSafe<T, R>(obj: T, getter: (obj: T) => R, fallback: R): R {
  try {
    if (obj === null || obj === undefined) {
      return fallback;
    }
    const result = getter(obj);
    return result === undefined || result === null ? fallback : result;
  } catch (e) {
    console.error('Error accessing property:', e);
    return fallback;
  }
}

/**
 * Safely access a nested property with a fallback value
 * 
 * @param obj - The object to access
 * @param path - The property path as an array of keys
 * @param fallback - The value to return if the property cannot be accessed
 * @returns The property value or fallback
 */
export function getNestedProperty<T, R>(
  obj: T,
  path: string[],
  fallback: R
): R {
  try {
    let current: any = obj;
    for (const key of path) {
      if (current === null || current === undefined) {
        return fallback;
      }
      current = current[key];
    }
    return current === undefined || current === null ? fallback : current as R;
  } catch (e) {
    console.error(`Error accessing nested property ${path.join('.')}:`, e);
    return fallback;
  }
}

/**
 * Wraps a function with error handling
 * 
 * @param fn - The function to wrap
 * @param fallback - The fallback value to return if the function throws
 * @param errorHandler - Optional function to handle errors
 * @returns A wrapped function that never throws
 */
export function withErrorHandling<T extends AnyFunction>(
  fn: T,
  fallback: ReturnType<T>,
  errorHandler?: (error: any) => void
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (e) {
      if (errorHandler) {
        errorHandler(e);
      } else {
        console.error(`Error in function ${fn.name || 'anonymous'}:`, e);
      }
      return fallback;
    }
  };
}

/**
 * Create a debounced version of a function
 * 
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends AnyFunction>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Safe DOM query with fallback
 * 
 * @param selector - CSS selector
 * @param parent - Optional parent element (defaults to document)
 * @param fallbackElement - Optional fallback element
 * @returns The found element or fallback
 */
export function safeQuerySelector(
  selector: string,
  parent: Document | Element = document,
  fallbackElement?: HTMLElement
): HTMLElement {
  try {
    const element = parent.querySelector(selector);
    if (element) {
      return element as HTMLElement;
    }
  } catch (e) {
    console.error(`Error querying for ${selector}:`, e);
  }
  
  // Return fallback or create an invisible div
  return fallbackElement || createInvisibleFallbackElement();
}

/**
 * Create an invisible fallback element
 * 
 * @returns An invisible div element
 */
function createInvisibleFallbackElement(): HTMLElement {
  const div = document.createElement('div');
  div.style.display = 'none';
  div.classList.add('oom-fallback-element');
  document.body.appendChild(div);
  return div;
}

/**
 * Safe event listener registration with automatic cleanup
 * 
 * @param element - The element to attach the listener to
 * @param event - The event name
 * @param handler - The event handler
 * @param options - Optional event listener options
 * @returns A cleanup function that removes the listener
 */
export function safeAddEventListener(
  element: HTMLElement | null,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): () => void {
  if (!element) {
    return () => {}; // No-op cleanup function
  }
  
  try {
    const wrappedHandler = ((e: Event) => {
      try {
        handler(e);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }) as EventListener;
    
    element.addEventListener(event, wrappedHandler, options);
    
    // Return cleanup function
    return () => {
      try {
        element.removeEventListener(event, wrappedHandler, options);
      } catch (e) {
        console.error(`Error removing event listener for ${event}:`, e);
      }
    };
  } catch (e) {
    console.error(`Error adding event listener for ${event}:`, e);
    return () => {}; // No-op cleanup function
  }
}

/**
 * Type guard for checking if an object has a specific property
 * 
 * @param obj - The object to check
 * @param prop - The property name
 * @returns True if the object has the property
 */
export function hasProperty<T extends object>(
  obj: T,
  prop: string
): boolean {
  return obj !== null && 
         obj !== undefined && 
         typeof obj === 'object' && 
         prop in obj;
}

/**
 * Type guard for checking if a value is a non-null object
 * 
 * @param value - The value to check
 * @returns True if the value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value);
}

/**
 * Type guard for checking if a value is a non-empty string
 * 
 * @param value - The value to check
 * @returns True if the value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard for checking if a value is a valid date
 * 
 * @param value - The value to check
 * @returns True if the value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Error boundary component for containing UI errors
 */
export class ErrorBoundary {
  private fallbackUI: HTMLElement;
  private contentUI: HTMLElement;
  private errorLogger: (error: any, componentName: string) => void;
  
  /**
   * Create a new error boundary
   * 
   * @param container - The container element
   * @param fallbackContent - Content to show when an error occurs
   * @param errorLogger - Optional custom error logger
   */
  constructor(
    container: HTMLElement, 
    fallbackContent: string,
    errorLogger?: (error: any, componentName: string) => void
  ) {
    this.fallbackUI = document.createElement('div');
    this.fallbackUI.className = 'oom-error-boundary-fallback';
    this.fallbackUI.textContent = fallbackContent;
    
    this.contentUI = document.createElement('div');
    this.contentUI.className = 'oom-error-boundary-content';
    
    container.appendChild(this.contentUI);
    
    this.errorLogger = errorLogger || ((error, componentName) => {
      console.error(`Error in UI component ${componentName}:`, error);
    });
  }
  
  /**
   * Render content within the error boundary
   * 
   * @param renderFn - Function that renders content
   * @param componentName - Name of the component for error reporting
   */
  public renderContent(renderFn: () => void, componentName = 'unknown'): void {
    try {
      renderFn();
    } catch (e) {
      this.handleError(e, componentName);
    }
  }
  
  /**
   * Handle an error by showing the fallback UI
   * 
   * @param error - The error that occurred
   * @param componentName - Name of the component where the error occurred
   */
  private handleError(error: any, componentName: string): void {
    this.errorLogger(error, componentName);
    
    // Replace content with fallback
    this.contentUI.replaceWith(this.fallbackUI);
    
    // Show error notice to user
    new Notice(`Error in ${componentName}. Please check console for details.`);
  }
  
  /**
   * Get the content element for rendering
   * 
   * @returns The content element
   */
  public getContentElement(): HTMLElement {
    return this.contentUI;
  }
  
  /**
   * Reset the error boundary to its initial state
   */
  public reset(): void {
    if (this.fallbackUI.parentElement) {
      this.fallbackUI.replaceWith(this.contentUI);
    }
  }
}

/**
 * Safe JSON parsing with fallback
 * 
 * @param text - The JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns The parsed object or fallback
 */
export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return fallback;
  }
}

/**
 * Safe JSON stringification with fallback
 * 
 * @param value - The value to stringify
 * @param fallback - Fallback string if stringification fails
 * @returns The JSON string or fallback
 */
export function safeJsonStringify(value: unknown, fallback = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (e) {
    console.error('Error stringifying to JSON:', e);
    return fallback;
  }
}

/**
 * Get a safe service from the service registry with fallback
 * 
 * @param serviceRegistry - The service registry
 * @param serviceId - The service identifier
 * @param fallback - Fallback service if not found
 * @returns The service or fallback
 */
export function getSafeService<T>(
  serviceRegistry: { getService: (serviceId: string) => T | null | undefined },
  serviceId: string,
  fallback: T
): T {
  try {
    if (!serviceRegistry || typeof serviceRegistry.getService !== 'function') {
      return fallback;
    }
    
    const service = serviceRegistry.getService(serviceId);
    return service || fallback;
  } catch (e) {
    console.error(`Error resolving service ${serviceId}:`, e);
    return fallback;
  }
} 