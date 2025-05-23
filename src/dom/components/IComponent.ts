/**
 * Interface for UI components in OneiroMetrics
 * 
 * All UI components should implement this interface to ensure consistent 
 * lifecycle management and rendering behavior.
 */
export interface IComponent {
  /**
   * Render the component to the target container
   * @param container Element to render the component into
   */
  render(container: HTMLElement): void;
  
  /**
   * Update the component with new data
   * @param data New data to update the component with
   */
  update(data: any): void;
  
  /**
   * Clean up any resources used by the component
   * This should remove event listeners, subscriptions, etc.
   */
  cleanup(): void;
} 