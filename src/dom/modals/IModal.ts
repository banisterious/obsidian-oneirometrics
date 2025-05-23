/**
 * Interface for modal dialogs.
 * Defines common functionality across all modals in the application.
 */
export interface IModal {
  /**
   * Open the modal.
   * @returns Promise that resolves when the modal is opened
   */
  open(): Promise<void>;
  
  /**
   * Close the modal.
   * @returns Promise that resolves when the modal is closed
   */
  close(): Promise<void>;
  
  /**
   * Set the title of the modal.
   * @param title The title to set
   * @returns The modal instance for chaining
   */
  setTitle(title: string): this;
  
  /**
   * Set the content element of the modal.
   * This is a wrapper method to work with both Obsidian's Modal interface
   * and our custom content handling.
   * @param content The content HTML element or string
   */
  setContentElement(content: HTMLElement | string): void;
  
  /**
   * Get the modal container element.
   * @returns The container element for the modal
   */
  getContentEl(): HTMLElement;
  
  /**
   * Check if the modal is currently open.
   * @returns True if the modal is open, false otherwise
   */
  isOpen(): boolean;
} 