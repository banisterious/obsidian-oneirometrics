/**
 * Modal Factory
 * 
 * This file provides utilities for creating and configuring modals
 * in a consistent manner across the application.
 */

import { Modal, App } from 'obsidian';

/**
 * Modal configuration options
 */
export interface ModalConfig {
  title?: string;
  description?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  closeOnEsc?: boolean;
  closeOnClickOutside?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Default modal configuration
 */
const DEFAULT_MODAL_CONFIG: ModalConfig = {
  closeOnEsc: true,
  closeOnClickOutside: false
};

/**
 * Creates a modal with standardized configuration
 * @param app Obsidian App instance
 * @param config Modal configuration
 * @returns Configured Modal instance
 */
export function createModal(app: App, config: ModalConfig = {}): Modal {
  // Merge default and provided configuration
  const finalConfig = { ...DEFAULT_MODAL_CONFIG, ...config };
  
  // Create the modal
  const modal = new Modal(app);
  
  // Store the original onOpen and onClose functions
  const originalOnOpen = modal.onOpen.bind(modal);
  const originalOnClose = modal.onClose.bind(modal);
  
  // Override onOpen
  modal.onOpen = () => {
    const { contentEl } = modal;
    
    // Apply className if provided
    if (finalConfig.className) {
      contentEl.addClass(finalConfig.className);
    }
    
    // Apply width if provided
    if (finalConfig.width) {
      const width = typeof finalConfig.width === 'number' 
        ? `${finalConfig.width}px` 
        : finalConfig.width;
      
      contentEl.style.width = width;
    }
    
    // Apply height if provided
    if (finalConfig.height) {
      const height = typeof finalConfig.height === 'number' 
        ? `${finalConfig.height}px` 
        : finalConfig.height;
      
      contentEl.style.height = height;
    }
    
    // Add title if provided
    if (finalConfig.title) {
      contentEl.createEl('h2', { text: finalConfig.title });
    }
    
    // Add description if provided
    if (finalConfig.description) {
      contentEl.createEl('p', { text: finalConfig.description });
    }
    
    // Call the original onOpen
    originalOnOpen();
    
    // Call the custom onOpen if provided
    if (finalConfig.onOpen) {
      finalConfig.onOpen();
    }
    
    // Handle click outside if configured
    if (finalConfig.closeOnClickOutside) {
      const modalBg = document.querySelector('.modal-bg');
      if (modalBg) {
        modalBg.addEventListener('click', (e) => {
          if (e.target === modalBg) {
            modal.close();
          }
        });
      }
    }
  };
  
  // Override onClose
  modal.onClose = () => {
    // Call the custom onClose if provided
    if (finalConfig.onClose) {
      finalConfig.onClose();
    }
    
    // Call the original onClose
    originalOnClose();
  };
  
  return modal;
}

/**
 * Creates a progress modal with standardized layout
 * @param app Obsidian App instance
 * @param config Modal configuration
 * @returns Modal with progress elements
 */
export function createProgressModal(app: App, config: ModalConfig = {}): {
  modal: Modal;
  progressBar: HTMLElement;
  progressText: HTMLElement;
  detailsText: HTMLElement;
  updateProgress: (percent: number, text?: string, details?: string) => void;
} {
  const modal = createModal(app, {
    ...config,
    className: `oom-progress-modal ${config.className || ''}`
  });
  
  // Container for progress elements
  const progressContainer = modal.contentEl.createDiv({
    cls: 'oom-progress-container'
  });
  
  // Progress bar elements
  const progressBarContainer = progressContainer.createDiv({
    cls: 'oom-progress-bar-container'
  });
  
  const progressBar = progressBarContainer.createDiv({
    cls: 'oom-progress-bar'
  });
  
  // Progress text
  const progressText = progressContainer.createDiv({
    cls: 'oom-progress-text'
  });
  
  // Details text
  const detailsText = progressContainer.createDiv({
    cls: 'oom-progress-details'
  });
  
  // Helper function to update progress
  const updateProgress = (percent: number, text?: string, details?: string) => {
    progressBar.style.width = `${percent}%`;
    
    if (text !== undefined) {
      progressText.textContent = text;
    }
    
    if (details !== undefined) {
      detailsText.textContent = details;
    }
  };
  
  return {
    modal,
    progressBar,
    progressText,
    detailsText,
    updateProgress
  };
}

/**
 * Creates a confirmation modal with standardized layout
 * @param app Obsidian App instance
 * @param options Confirmation options
 * @returns Promise that resolves to true if confirmed, false otherwise
 */
export function createConfirmationModal(app: App, options: {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  className?: string;
  dangerous?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = createModal(app, {
      title: options.title || 'Confirm',
      className: `oom-confirmation-modal ${options.className || ''} ${options.dangerous ? 'oom-dangerous' : ''}`
    });
    
    const { contentEl } = modal;
    
    // Message
    contentEl.createEl('p', { 
      text: options.message,
      cls: 'oom-confirmation-message'
    });
    
    // Button container
    const buttonContainer = contentEl.createDiv({
      cls: 'oom-confirmation-buttons'
    });
    
    // Cancel button
    const cancelButton = buttonContainer.createEl('button', {
      text: options.cancelText || 'Cancel',
      cls: 'oom-cancel-button'
    });
    
    // Confirm button
    const confirmButton = buttonContainer.createEl('button', {
      text: options.confirmText || 'Confirm',
      cls: `oom-confirm-button ${options.dangerous ? 'oom-dangerous' : ''}`
    });
    
    // Event handlers
    cancelButton.addEventListener('click', () => {
      modal.close();
      resolve(false);
    });
    
    confirmButton.addEventListener('click', () => {
      modal.close();
      resolve(true);
    });
    
    modal.open();
  });
} 