import { App, Modal, setIcon } from 'obsidian';
import { IModal } from './IModal';

/**
 * Base modal class that implements common functionality.
 * Extends Obsidian's Modal class and implements the IModal interface.
 */
export class BaseModal extends Modal implements IModal {
  private modalTitle: string;
  private modalContent: HTMLElement | string | DocumentFragment;
  private isModalOpen: boolean = false;
  
  /**
   * Create a new BaseModal instance.
   * @param app The Obsidian app instance
   * @param title Optional title for the modal
   */
  constructor(app: App, title?: string) {
    super(app);
    this.modalTitle = title || '';
  }
  
  /**
   * Set up the modal when it opens.
   * Creates the title and content elements.
   */
  onOpen(): void {
    this.isModalOpen = true;
    
    if (!this.contentEl) {
      console.error('Modal content element not available');
      return;
    }
    
    // Create modal container with OneiroMetrics class for styling
    this.contentEl.addClass('oom-modal');
    
    // Create title element if a title was provided
    if (this.modalTitle) {
      const titleEl = this.contentEl.createEl('h2', { 
        cls: 'oom-modal-title',
        text: this.modalTitle 
      });
    }
    
    // Add content if it was set
    if (this.modalContent) {
      this.updateContentElement(this.modalContent);
    }
    
    // Call onCreateContent if it exists on the subclass
    if (typeof (this as any).onCreateContent === 'function') {
      (this as any).onCreateContent();
    }
  }
  
  /**
   * Clean up when the modal closes.
   */
  onClose(): void {
    this.isModalOpen = false;
    this.contentEl.empty();
  }
  
  /**
   * Open the modal.
   * @returns Promise that resolves when the modal is opened
   */
  async open(): Promise<void> {
    super.open();
    return Promise.resolve();
  }
  
  /**
   * Close the modal.
   * @returns Promise that resolves when the modal is closed
   */
  async close(): Promise<void> {
    super.close();
    return Promise.resolve();
  }
  
  /**
   * Set the title of the modal.
   * Updates the title element if the modal is already open.
   * @param title The title to set
   * @returns This instance for chaining
   */
  setTitle(title: string): this {
    this.modalTitle = title;
    
    if (this.isModalOpen && this.contentEl) {
      const titleEl = this.contentEl.querySelector('.oom-modal-title') as HTMLElement;
      if (titleEl) {
        titleEl.textContent = title;
      } else {
        // Create title element if it doesn't exist
        this.contentEl.prepend(
          createEl('h2', { 
            cls: 'oom-modal-title',
            text: title 
          })
        );
      }
    }
    
    return this;
  }
  
  /**
   * Set the content of the modal.
   * This method overrides the base Modal's setContent with additional functionality.
   * @param content The content HTML element, string, or DocumentFragment
   * @returns This instance for chaining
   */
  setContent(content: string | DocumentFragment): this {
    this.modalContent = content;
    this.updateContentElement(content);
    return this;
  }
  
  /**
   * Implementation of the IModal interface to set content.
   * This method handles both the HTML element form and string form.
   * @param content The content to set
   */
  setContentElement(content: HTMLElement | string): void {
    if (typeof content === 'string') {
      this.setContent(content);
    } else {
      this.modalContent = content;
      this.updateContentElement(content);
    }
  }
  
  /**
   * Internal method to update content based on type.
   * @param content Content to update
   */
  private updateContentElement(content: HTMLElement | string | DocumentFragment): void {
    if (!this.isModalOpen || !this.contentEl) {
      return;
    }
    
    // Clear existing content
    const contentContainer = this.contentEl.querySelector('.oom-modal-content') as HTMLElement;
    if (contentContainer) {
      contentContainer.empty();
      
      if (typeof content === 'string') {
        contentContainer.innerHTML = content;
      } else {
        contentContainer.appendChild(content);
      }
    } else {
      // Create content container if it doesn't exist
      const container = this.contentEl.createDiv('oom-modal-content');
      
      if (typeof content === 'string') {
        container.innerHTML = content;
      } else {
        container.appendChild(content);
      }
    }
  }
  
  /**
   * Get the modal container element.
   * @returns The container element for the modal
   */
  getContentEl(): HTMLElement {
    return this.contentEl;
  }
  
  /**
   * Check if the modal is currently open.
   * @returns True if the modal is open, false otherwise
   */
  isOpen(): boolean {
    return this.isModalOpen;
  }
} 