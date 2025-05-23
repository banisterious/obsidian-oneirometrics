import { IComponent } from './IComponent';

/**
 * Base component implementation with common functionality
 * 
 * This class implements the IComponent interface and provides basic
 * functionality that most components will need.
 */
export abstract class BaseComponent implements IComponent {
  protected containerEl: HTMLElement | null = null;
  protected cleanupFunctions: (() => void)[] = [];
  
  /**
   * Render the component to the target container
   * @param container Element to render the component into
   */
  render(container: HTMLElement): void {
    this.containerEl = container;
    this.onRender();
  }
  
  /**
   * Update the component with new data
   * @param data New data to update the component with
   */
  update(data: any): void {
    if (!this.containerEl) {
      console.warn('Cannot update component: not rendered yet');
      return;
    }
    
    this.onUpdate(data);
  }
  
  /**
   * Clean up any resources used by the component
   */
  cleanup(): void {
    // Run all cleanup functions
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
    
    // Additional cleanup
    this.onCleanup();
    
    // Clear container reference
    this.containerEl = null;
  }
  
  /**
   * Register a cleanup function to be called when the component is cleaned up
   * @param cleanupFn Function to call during cleanup
   */
  protected registerCleanup(cleanupFn: () => void): void {
    this.cleanupFunctions.push(cleanupFn);
  }
  
  /**
   * Called when the component is rendered
   * Implement this in subclasses to perform the actual rendering
   */
  protected abstract onRender(): void;
  
  /**
   * Called when the component is updated
   * Implement this in subclasses to handle updates
   * @param data New data for the component
   */
  protected abstract onUpdate(data: any): void;
  
  /**
   * Called when the component is cleaned up
   * Implement this in subclasses if additional cleanup is needed
   */
  protected onCleanup(): void {
    // Default implementation does nothing
  }
} 