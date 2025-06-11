/**
 * DOMErrorBoundary - Component for isolating UI errors
 * 
 * Creates an error boundary for DOM elements to prevent errors in one component
 * from crashing the entire UI. Provides fallback content and error recovery.
 */

import safeLogger from '../logging/safe-logger';
import { DOMSafetyGuard } from './DOMSafetyGuard';

export interface DOMErrorBoundaryOptions {
  /** Component name for logging */
  componentName: string;
  
  /** Fallback content to display on error */
  fallbackContent?: string | HTMLElement;
  
  /** Whether to show error details in the fallback UI */
  showErrorDetails?: boolean;
  
  /** Callback function when an error occurs */
  onError?: (error: Error, componentName: string) => void;
  
  /** Callback to try to recover from errors */
  onRecoveryAttempt?: () => boolean;
}

/**
 * Creates an error boundary for DOM elements
 */
export class DOMErrorBoundary {
  /** The component name for logging */
  private componentName: string;
  
  /** The container element */
  private container: HTMLElement;
  
  /** The content element */
  private contentElement: HTMLElement;
  
  /** The fallback element shown on error */
  private fallbackElement: HTMLElement;
  
  /** The DOM safety guard instance */
  private domSafetyGuard: DOMSafetyGuard;
  
  /** Whether the component is currently in an error state */
  private hasError: boolean = false;
  
  /** Error callback */
  private errorCallback?: (error: Error, componentName: string) => void;
  
  /** Recovery attempt callback */
  private recoveryCallback?: () => boolean;
  
  /** Whether to show error details */
  private showErrorDetails: boolean;
  
  /**
   * Creates a new DOMErrorBoundary
   * 
   * @param container The container element
   * @param options Configuration options
   */
  constructor(container: HTMLElement, options: DOMErrorBoundaryOptions) {
    this.componentName = options.componentName || 'UnknownComponent';
    this.container = container;
    this.domSafetyGuard = DOMSafetyGuard.getInstance();
    this.errorCallback = options.onError;
    this.recoveryCallback = options.onRecoveryAttempt;
    this.showErrorDetails = options.showErrorDetails || false;
    
    // Create content container
    this.contentElement = this.domSafetyGuard.createElement('div', {
      className: 'oom-error-boundary-content',
      parent: this.container
    });
    
    // Create fallback element
    this.fallbackElement = this.createFallbackElement(options.fallbackContent);
    this.container.appendChild(this.fallbackElement);
    
    // Hide fallback initially using CSS class
    this.fallbackElement.classList.add('oom-error-boundary-fallback--hidden');
  }
  
  /**
   * Creates the fallback element
   */
  private createFallbackElement(content?: string | HTMLElement): HTMLElement {
    const fallback = this.domSafetyGuard.createElement('div', {
      className: 'oom-error-boundary-fallback'
    });
    
    // Add default or custom content
    if (content instanceof HTMLElement) {
      fallback.appendChild(content);
    } else if (typeof content === 'string') {
      fallback.textContent = content;
    } else {
      // Default fallback content
      const message = this.domSafetyGuard.createElement('p', {
        className: 'oom-error-message',
        text: `Something went wrong in ${this.componentName}. Please try reloading.`
      });
      
      fallback.appendChild(message);
      
      // Add retry button
      const retryButton = this.domSafetyGuard.createElement('button', {
        className: 'oom-error-retry-btn',
        text: 'Try Again'
      });
      
      this.domSafetyGuard.addListener(retryButton, 'click', () => this.attemptRecovery());
      fallback.appendChild(retryButton);
      
      // Container for error details (hidden by default)
      const errorDetails = this.domSafetyGuard.createElement('div', {
        className: 'oom-error-details',
        attributes: {
          'aria-hidden': 'true'
        }
      });
      
      if (!this.showErrorDetails) {
        errorDetails.classList.add('oom-error-details--hidden');
      } else {
        errorDetails.classList.add('oom-error-details--visible');
      }
      
      fallback.appendChild(errorDetails);
    }
    
    return fallback;
  }
  
  /**
   * Renders content safely with error handling
   * 
   * @param renderFunction Function that renders content
   * @returns True if rendering was successful, false otherwise
   */
  render(renderFunction: (container: HTMLElement) => void): boolean {
    try {
      // Clear any existing content
      this.domSafetyGuard.clearElement(this.contentElement);
      
      // Hide fallback, show content using CSS classes
      this.fallbackElement.classList.remove('oom-error-boundary-fallback--visible');
      this.fallbackElement.classList.add('oom-error-boundary-fallback--hidden');
      this.contentElement.classList.remove('oom-error-boundary-content--hidden');  
      this.contentElement.classList.add('oom-error-boundary-content--visible');
      
      // Render content
      renderFunction(this.contentElement);
      
      // Reset error state
      this.hasError = false;
      return true;
    } catch (error) {
      // Handle error
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
  
  /**
   * Handles an error by showing the fallback UI and logging
   * 
   * @param error The error that occurred
   */
  private handleError(error: Error): void {
    // Set error state
    this.hasError = true;
    
    // Log error
    safeLogger.error(
      'DOMErrorBoundary', 
      `Error rendering ${this.componentName}`, 
      error
    );
    
    // Show fallback UI using CSS classes
    this.contentElement.classList.remove('oom-error-boundary-content--visible');
    this.contentElement.classList.add('oom-error-boundary-content--hidden');
    this.fallbackElement.classList.remove('oom-error-boundary-fallback--hidden');  
    this.fallbackElement.classList.add('oom-error-boundary-fallback--visible');
    
    // Update error details if enabled
    if (this.showErrorDetails) {
      const errorDetailsElement = this.fallbackElement.querySelector('.oom-error-details');
      if (errorDetailsElement) {
        errorDetailsElement.textContent = `${error.name}: ${error.message}`;
        if (error.stack) {
          const stackElement = document.createElement('pre');
          stackElement.textContent = error.stack;
          errorDetailsElement.appendChild(stackElement);
        }
      }
    }
    
    // Call error callback if provided
    if (this.errorCallback) {
      try {
        this.errorCallback(error, this.componentName);
      } catch (callbackError) {
        safeLogger.error(
          'DOMErrorBoundary', 
          'Error in error callback', 
          callbackError
        );
      }
    }
  }
  
  /**
   * Attempts to recover from an error
   * 
   * @returns True if recovery was successful, false otherwise
   */
  attemptRecovery(): boolean {
    if (!this.hasError) {
      return true;
    }
    
    try {
      // Try recovery callback if provided
      if (this.recoveryCallback) {
        const recovered = this.recoveryCallback();
        if (recovered) {
          // Reset error state
          this.hasError = false;
          
          // Show content, hide fallback using CSS classes
          this.contentElement.classList.remove('oom-error-boundary-content--hidden');
          this.contentElement.classList.add('oom-error-boundary-content--visible');
          this.fallbackElement.classList.remove('oom-error-boundary-fallback--visible');
          this.fallbackElement.classList.add('oom-error-boundary-fallback--hidden');
          
          safeLogger.info(
            'DOMErrorBoundary', 
            `${this.componentName} recovered from error`
          );
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      safeLogger.error(
        'DOMErrorBoundary', 
        `Error attempting to recover ${this.componentName}`, 
        error
      );
      
      return false;
    }
  }
  
  /**
   * Checks if the component is in an error state
   * 
   * @returns True if in error state, false otherwise
   */
  hasErrorState(): boolean {
    return this.hasError;
  }
  
  /**
   * Gets the content element
   * 
   * @returns The content element
   */
  getContentElement(): HTMLElement {
    return this.contentElement;
  }
  
  /**
   * Gets the fallback element
   * 
   * @returns The fallback element
   */
  getFallbackElement(): HTMLElement {
    return this.fallbackElement;
  }
  
  /**
   * Manually triggers an error state
   * 
   * @param error The error to handle
   */
  triggerError(error: Error): void {
    this.handleError(error);
  }
  
  /**
   * Resets the error boundary to normal state
   */
  reset(): void {
    this.hasError = false;
    this.contentElement.classList.remove('oom-error-boundary-content--hidden');
    this.contentElement.classList.add('oom-error-boundary-content--visible');
    this.fallbackElement.classList.remove('oom-error-boundary-fallback--visible');
    this.fallbackElement.classList.add('oom-error-boundary-fallback--hidden');
  }
} 