/**
 * NullDOM - Null Object implementation for DOM components
 * 
 * Provides a safe, no-op fallback implementation for DOM components
 * when the actual DOM components cannot be used (e.g., in testing,
 * when elements are missing, or during initialization).
 */

import safeLogger from '../logging/safe-logger';

/**
 * Basic interface for DOM components
 */
export interface DOMComponent {
  render(): void;
  cleanup(): void;
  update(data?: any): void;
}

/**
 * Null Object implementation of a DOM component
 */
export class NullDOM implements DOMComponent {
  /**
   * The component name for logging
   */
  private componentName: string;
  
  /**
   * Whether to log operations (useful for debugging)
   */
  private verbose: boolean;
  
  /**
   * Singleton instance
   */
  private static instance: NullDOM;
  
  /**
   * Gets the singleton instance
   * 
   * @param componentName Optional component name for logging
   * @param verbose Whether to log operations
   * @returns The NullDOM instance
   */
  public static getInstance(componentName: string = 'Unknown', verbose: boolean = false): NullDOM {
    if (!NullDOM.instance) {
      NullDOM.instance = new NullDOM(componentName, verbose);
    } else {
      // Update instance properties
      NullDOM.instance.componentName = componentName;
      NullDOM.instance.verbose = verbose;
    }
    return NullDOM.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   * 
   * @param componentName The component name for logging
   * @param verbose Whether to log operations
   */
  private constructor(componentName: string, verbose: boolean) {
    this.componentName = componentName;
    this.verbose = verbose;
    
    if (this.verbose) {
      safeLogger.debug('NullDOM', `Created NullDOM for ${componentName}`);
    }
  }
  
  /**
   * No-op render method
   */
  render(): void {
    if (this.verbose) {
      safeLogger.debug('NullDOM', `[${this.componentName}] render() called`);
    }
  }
  
  /**
   * No-op cleanup method
   */
  cleanup(): void {
    if (this.verbose) {
      safeLogger.debug('NullDOM', `[${this.componentName}] cleanup() called`);
    }
  }
  
  /**
   * No-op update method
   * 
   * @param data Optional data for the update
   */
  update(data?: any): void {
    if (this.verbose) {
      safeLogger.debug('NullDOM', `[${this.componentName}] update() called`, data);
    }
  }
  
  /**
   * Generic method to handle any method call
   * 
   * @param methodName The name of the method being called
   * @param args Arguments passed to the method
   * @returns undefined
   */
  handleMethod(methodName: string, ...args: any[]): any {
    if (this.verbose) {
      safeLogger.debug('NullDOM', `[${this.componentName}] ${methodName}() called`, args);
    }
    return undefined;
  }
  
  /**
   * Returns an empty HTML element that can be used as a placeholder
   * 
   * @returns An empty div element
   */
  getElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'oom-null-dom-element';
    el.setAttribute('aria-hidden', 'true');
    el.style.display = 'none';
    return el;
  }
  
  /**
   * Returns an empty document fragment
   * 
   * @returns An empty document fragment
   */
  getFragment(): DocumentFragment {
    return document.createDocumentFragment();
  }
}

/**
 * Creates a null DOM component for a specific type
 * 
 * @param componentName The component name for logging
 * @param verbose Whether to log operations
 * @returns A proxy that returns undefined for any property or method access
 */
export function createNullDOMComponent<T extends object>(
  componentName: string = 'Unknown', 
  verbose: boolean = false
): T {
  const nullDOM = NullDOM.getInstance(componentName, verbose);
  
  // Create a proxy that handles any property access or method call
  return new Proxy({} as T, {
    get: (target, prop) => {
      const propName = String(prop);
      
      // Special case for Symbol.toPrimitive, toString, etc.
      if (typeof prop === 'symbol' || propName === 'toString' || propName === 'valueOf') {
        return () => `[NullDOM: ${componentName}]`;
      }
      
      // Handle methods
      return (...args: any[]) => {
        return nullDOM.handleMethod(propName, ...args);
      };
    }
  });
} 