import { App, ButtonComponent } from 'obsidian';
import { BaseModal } from './BaseModal';

/**
 * Modal for confirming actions with Yes/No options.
 * Extends the BaseModal class with specific confirmation functionality.
 */
export class ConfirmModal extends BaseModal {
  /**
   * Creates a new confirmation modal.
   * @param app The Obsidian app instance
   * @param title Modal title
   * @param message Message to display
   * @param confirmText Text for confirm button (default: "Yes")
   * @param cancelText Text for cancel button (default: "No")
   * @param onConfirm Callback when confirm is clicked
   * @param onCancel Optional callback when cancel is clicked
   */
  constructor(
    app: App,
    title: string,
    private message: string,
    private confirmText: string = "Yes",
    private cancelText: string = "No",
    private onConfirm: () => void,
    private onCancel?: () => void
  ) {
    super(app, title);
  }
  
  /**
   * Set up the modal content when opened.
   */
  onOpen(): void {
    super.onOpen();
    
    const { contentEl } = this;
    
    // Add message
    contentEl.createDiv({ 
      cls: 'oom-modal-message',
      text: this.message
    });
    
    // Create button container
    const buttonContainer = contentEl.createDiv('oom-modal-button-container');
    
    // Cancel button
    new ButtonComponent(buttonContainer)
      .setButtonText(this.cancelText)
      .setCta()
      .onClick(() => {
        if (this.onCancel) {
          this.onCancel();
        }
        this.close();
      });
    
    // Confirm button  
    new ButtonComponent(buttonContainer)
      .setButtonText(this.confirmText)
      .setCta()
      .onClick(() => {
        this.onConfirm();
        this.close();
      });
  }
  
  /**
   * Static helper method to show a confirmation dialog.
   * @param app The Obsidian app instance
   * @param title Modal title
   * @param message Message to display
   * @param confirmText Text for confirm button
   * @param cancelText Text for cancel button
   * @returns Promise that resolves to true if confirmed, false otherwise
   */
  static async show(
    app: App,
    title: string,
    message: string,
    confirmText: string = "Yes",
    cancelText: string = "No"
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new ConfirmModal(
        app,
        title,
        message,
        confirmText,
        cancelText,
        () => resolve(true),
        () => resolve(false)
      );
      
      modal.open();
    });
  }
} 