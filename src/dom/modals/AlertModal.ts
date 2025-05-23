import { App, ButtonComponent } from 'obsidian';
import { BaseModal } from './BaseModal';

/**
 * Modal for displaying alert messages with an OK button.
 * Extends the BaseModal class with specific alert functionality.
 */
export class AlertModal extends BaseModal {
  /**
   * Creates a new alert modal.
   * @param app The Obsidian app instance
   * @param title Modal title
   * @param message Message to display
   * @param buttonText Text for OK button (default: "OK")
   * @param onDismiss Optional callback when modal is closed
   */
  constructor(
    app: App,
    title: string,
    private message: string,
    private buttonText: string = "OK",
    private onDismiss?: () => void
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
    
    // OK button
    new ButtonComponent(buttonContainer)
      .setButtonText(this.buttonText)
      .setCta()
      .onClick(() => {
        if (this.onDismiss) {
          this.onDismiss();
        }
        this.close();
      });
  }
  
  /**
   * Static helper method to show an alert dialog.
   * @param app The Obsidian app instance
   * @param title Modal title
   * @param message Message to display
   * @param buttonText Text for OK button
   * @returns Promise that resolves when the modal is closed
   */
  static async show(
    app: App,
    title: string,
    message: string,
    buttonText: string = "OK"
  ): Promise<void> {
    return new Promise((resolve) => {
      const modal = new AlertModal(
        app,
        title,
        message,
        buttonText,
        () => resolve()
      );
      
      modal.open();
    });
  }
} 