/**
 * DOMSafetyGuard - Defensive DOM manipulation utilities
 * 
 * This utility class provides defensive methods for safely working with the DOM
 * to prevent common errors related to missing elements, timing issues, and
 * unexpected DOM structures.
 */

import { withErrorHandling, safeQuerySelector } from '../utils/defensive-utils';
import safeLogger from '../logging/safe-logger';

export class DOMSafetyGuard {
  /**
   * Singleton instance
   */
  private static instance: DOMSafetyGuard;
  
  /**
   * Fallback container that's guaranteed to exist
   * Used when target elements can't be found
   */
  private fallbackContainer: HTMLDivElement;
  
  /**
   * Map of element IDs to elements for fast access
   */
  private elementCache: Map<string, HTMLElement> = new Map();
  
  /**
   * Function to run when a fallback element is used
   */
  private onFallbackUsed?: (selector: string, action: string) => void;
  
  /**
   * Gets the singleton instance
   */
  public static getInstance(): DOMSafetyGuard {
    if (!DOMSafetyGuard.instance) {
      DOMSafetyGuard.instance = new DOMSafetyGuard();
    }
    return DOMSafetyGuard.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Create fallback container
    this.fallbackContainer = document.createElement('div');
    this.fallbackContainer.style.display = 'none';
    this.fallbackContainer.id = 'oom-fallback-container';
    this.fallbackContainer.setAttribute('aria-hidden', 'true');
    
    // Add fallback container to body when safe
    this.appendToBodyWhenReady(this.fallbackContainer);
  }
  
  /**
   * Set a callback to be notified when fallback elements are used
   */
  setFallbackCallback(callback: (selector: string, action: string) => void): void {
    this.onFallbackUsed = callback;
  }
  
  /**
   * Safely query for an element with fallback
   */
  getElement = withErrorHandling(
    (selector: string, parent?: HTMLElement | Document): HTMLElement => {
      // Check cache first
      if (this.elementCache.has(selector)) {
        return this.elementCache.get(selector)!;
      }
      
      // Use provided parent or document
      const root = parent || document;
      
      // Query for element
      const element = root.querySelector(selector);
      
      if (element instanceof HTMLElement) {
        // Cache element for future use
        this.elementCache.set(selector, element);
        return element;
      }
      
      // Log and return fallback if not found
      safeLogger.warn('DOM', `Element not found: ${selector}`);
      if (this.onFallbackUsed) {
        this.onFallbackUsed(selector, 'query');
      }
      
      // Return fallback element
      return this.createFallbackElement(selector);
    },
    {
      fallbackValue: document.createElement('div'),
      errorMessage: "Failed to query for element",
      onError: (error) => safeLogger.error('DOM', 'Error in getElement method', error)
    }
  );
  
  /**
   * Safely query for multiple elements with empty array fallback
   */
  getElements = withErrorHandling(
    (selector: string, parent?: HTMLElement | Document): HTMLElement[] => {
      // Use provided parent or document
      const root = parent || document;
      
      // Query for elements
      const elements = Array.from(root.querySelectorAll(selector));
      
      // Filter to HTMLElements only
      const htmlElements = elements.filter((el): el is HTMLElement => el instanceof HTMLElement);
      
      if (htmlElements.length === 0) {
        safeLogger.debug('DOM', `No elements found for selector: ${selector}`);
      }
      
      return htmlElements;
    },
    {
      fallbackValue: [] as HTMLElement[],
      errorMessage: "Failed to query for elements",
      onError: (error) => safeLogger.error('DOM', 'Error in getElements method', error)
    }
  );
  
  /**
   * Safely create an element with error handling
   */
  createElement = withErrorHandling(
    <K extends keyof HTMLElementTagNameMap>(
      tagName: K,
      options?: { 
        className?: string;
        id?: string;
        text?: string;
        attributes?: Record<string, string>;
        parent?: HTMLElement;
      }
    ): HTMLElementTagNameMap[K] => {
      // Create element
      const element = document.createElement(tagName);
      
      // Add class if provided
      if (options?.className) {
        element.className = options.className;
      }
      
      // Add ID if provided
      if (options?.id) {
        element.id = options.id;
      }
      
      // Add text if provided
      if (options?.text) {
        element.textContent = options.text;
      }
      
      // Add attributes if provided
      if (options?.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
      
      // Append to parent if provided
      if (options?.parent) {
        options.parent.appendChild(element);
      }
      
      return element;
    },
    {
      fallbackValue: document.createElement('div') as any,
      errorMessage: "Failed to create element",
      onError: (error) => safeLogger.error('DOM', 'Error in createElement method', error)
    }
  );
  
  /**
   * Safely add an event listener with error handling
   */
  addListener = withErrorHandling(
    (
      element: HTMLElement | null | undefined,
      event: string,
      handler: EventListener,
      options?: AddEventListenerOptions
    ): () => void => {
      if (!element) {
        safeLogger.warn('DOM', `Cannot add ${event} listener to null/undefined element`);
        return () => {};
      }
      
      // Create wrapped handler that catches errors
      const wrappedHandler = ((e: Event) => {
        try {
          handler(e);
        } catch (error) {
          safeLogger.error('DOM', `Error in ${event} event handler`, error);
        }
      }) as EventListener;
      
      // Add listener
      element.addEventListener(event, wrappedHandler, options);
      
      // Return cleanup function
      return () => {
        try {
          element.removeEventListener(event, wrappedHandler, options);
        } catch (error) {
          safeLogger.error('DOM', `Error removing ${event} listener`, error);
        }
      };
    },
    {
      fallbackValue: () => {},
      errorMessage: "Failed to add event listener",
      onError: (error) => safeLogger.error('DOM', 'Error in addListener method', error)
    }
  );
  
  /**
   * Safely set element properties with error handling
   */
  setElementProps = withErrorHandling(
    (
      element: HTMLElement | null | undefined,
      props: Record<string, string | boolean | number>
    ): void => {
      if (!element) {
        safeLogger.warn('DOM', `Cannot set properties on null/undefined element`);
        return;
      }
      
      Object.entries(props).forEach(([key, value]) => {
        try {
          if (key === 'className') {
            element.className = String(value);
          } else if (key === 'innerHTML') {
            element.innerHTML = String(value);
          } else if (key === 'textContent') {
            element.textContent = String(value);
          } else if (key.startsWith('data-')) {
            element.setAttribute(key, String(value));
          } else if (typeof value === 'boolean') {
            if (value) {
              element.setAttribute(key, '');
            } else {
              element.removeAttribute(key);
            }
          } else {
            element.setAttribute(key, String(value));
          }
        } catch (error) {
          safeLogger.error('DOM', `Error setting property ${key} on element`, error);
        }
      });
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to set element properties",
      onError: (error) => safeLogger.error('DOM', 'Error in setElementProps method', error)
    }
  );
  
  /**
   * Safely remove all children from an element
   */
  clearElement = withErrorHandling(
    (element: HTMLElement | null | undefined): void => {
      if (!element) {
        safeLogger.warn('DOM', `Cannot clear null/undefined element`);
        return;
      }
      
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to clear element",
      onError: (error) => safeLogger.error('DOM', 'Error in clearElement method', error)
    }
  );
  
  /**
   * Creates a mutation observer with error handling
   */
  createObserver = withErrorHandling(
    (
      callback: MutationCallback,
      targetNode: Node | null,
      config: MutationObserverInit
    ): { observer: MutationObserver; disconnect: () => void } => {
      if (!targetNode) {
        safeLogger.warn('DOM', 'Cannot observe null/undefined node');
        return { 
          observer: null as unknown as MutationObserver, 
          disconnect: () => {} 
        };
      }
      
      // Create wrapped callback
      const wrappedCallback: MutationCallback = (mutations, observer) => {
        try {
          callback(mutations, observer);
        } catch (error) {
          safeLogger.error('DOM', 'Error in mutation observer callback', error);
        }
      };
      
      // Create observer
      const observer = new MutationObserver(wrappedCallback);
      
      // Start observing
      observer.observe(targetNode, config);
      
      // Return observer and disconnect function
      return {
        observer,
        disconnect: () => {
          try {
            observer.disconnect();
          } catch (error) {
            safeLogger.error('DOM', 'Error disconnecting mutation observer', error);
          }
        }
      };
    },
    {
      fallbackValue: { 
        observer: null as unknown as MutationObserver, 
        disconnect: () => {} 
      },
      errorMessage: "Failed to create mutation observer",
      onError: (error) => safeLogger.error('DOM', 'Error in createObserver method', error)
    }
  );
  
  /**
   * Creates a fallback element for when target elements can't be found
   */
  private createFallbackElement(selector: string): HTMLElement {
    const fallback = document.createElement('div');
    fallback.className = 'oom-fallback-element';
    fallback.dataset.originalSelector = selector;
    fallback.style.display = 'none';
    fallback.setAttribute('aria-hidden', 'true');
    
    // Add to fallback container
    this.fallbackContainer.appendChild(fallback);
    
    return fallback;
  }
  
  /**
   * Safely appends an element to body when document is ready
   */
  private appendToBodyWhenReady(element: HTMLElement): void {
    if (document.body) {
      document.body.appendChild(element);
    } else {
      // Wait for DOM to be ready
      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(element);
      });
    }
  }
  
  /**
   * Clear element cache
   */
  clearCache(): void {
    this.elementCache.clear();
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.clearCache();
    if (this.fallbackContainer.parentNode) {
      this.fallbackContainer.parentNode.removeChild(this.fallbackContainer);
    }
  }
} 