/**
 * Folder Validation Utilities
 * 
 * Provides folder existence validation and user-friendly prompts
 * for folder creation during scraping operations.
 */

import { App, Modal, Notice, Setting } from 'obsidian';

export interface FolderValidationResult {
    exists: boolean;
    path: string;
    userChoice?: 'create' | 'choose' | 'cancel';
    newPath?: string;
}

/**
 * Modal for prompting user when target folder doesn't exist
 */
class FolderPromptModal extends Modal {
    private result: Promise<FolderValidationResult>;
    private resolveResult: (result: FolderValidationResult) => void;
    
    constructor(app: App, private folderPath: string) {
        super(app);
        this.result = new Promise((resolve) => {
            this.resolveResult = resolve;
        });
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-folder-prompt-modal');
        
        // Title
        contentEl.createEl('h2', { 
            text: '📁 Folder Not Found',
            cls: 'oom-folder-prompt-title'
        });
        
        // Description
        const description = contentEl.createDiv({ cls: 'oom-folder-prompt-description' });
        description.createEl('p', {
            text: `The target folder doesn't exist:`
        });
        description.createEl('code', {
            text: this.folderPath,
            cls: 'oom-folder-path'
        });
        description.createEl('p', {
            text: 'What would you like to do?'
        });
        
        // Options
        const optionsContainer = contentEl.createDiv({ cls: 'oom-folder-prompt-options' });
        
        // Create folder button
        const createButton = optionsContainer.createEl('button', {
            text: '📁 Create this folder',
            cls: 'mod-cta oom-folder-option-button'
        });
        createButton.addEventListener('click', () => {
            this.resolveResult({
                exists: false,
                path: this.folderPath,
                userChoice: 'create'
            });
            this.close();
        });
        
        // Choose different folder button
        const chooseButton = optionsContainer.createEl('button', {
            text: '📂 Choose a different folder',
            cls: 'oom-folder-option-button'
        });
        chooseButton.addEventListener('click', () => {
            this.showFolderSelector();
        });
        
        // Cancel button
        const cancelButton = optionsContainer.createEl('button', {
            text: '❌ Cancel scraping',
            cls: 'oom-folder-option-button oom-cancel-button'
        });
        cancelButton.addEventListener('click', () => {
            this.resolveResult({
                exists: false,
                path: this.folderPath,
                userChoice: 'cancel'
            });
            this.close();
        });
    }
    
    private showFolderSelector() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Title
        contentEl.createEl('h2', { 
            text: '📂 Choose Target Folder',
            cls: 'oom-folder-prompt-title'
        });
        
        // Folder selector
        const selectorContainer = contentEl.createDiv({ cls: 'oom-folder-selector' });
        
        new Setting(selectorContainer)
            .setName('Target folder')
            .setDesc('Choose the folder where scraped data should be stored')
            .addText(text => {
                text.setPlaceholder('e.g., Journals/Dream Diary/Metrics')
                    .setValue(this.folderPath);
                
                // Add folder suggestions
                const inputEl = text.inputEl;
                const suggestions = this.app.vault.getAllLoadedFiles()
                    .filter(file => file instanceof (this.app.vault as any).TFolder)
                    .map(folder => folder.path)
                    .sort();
                
                inputEl.addEventListener('input', () => {
                    // Simple autocomplete could be added here
                });
                
                // Buttons
                const buttonsContainer = selectorContainer.createDiv({ 
                    cls: 'oom-folder-selector-buttons' 
                });
                
                const confirmButton = buttonsContainer.createEl('button', {
                    text: '✅ Use this folder',
                    cls: 'mod-cta'
                });
                confirmButton.addEventListener('click', () => {
                    const newPath = text.getValue().trim();
                    if (newPath) {
                        this.resolveResult({
                            exists: false,
                            path: this.folderPath,
                            userChoice: 'choose',
                            newPath: newPath
                        });
                        this.close();
                    } else {
                        new Notice('Please enter a folder path');
                    }
                });
                
                const backButton = buttonsContainer.createEl('button', {
                    text: '⬅️ Back',
                    cls: 'oom-folder-option-button'
                });
                backButton.addEventListener('click', () => {
                    this.onOpen(); // Go back to main options
                });
            });
    }
    
    public getResult(): Promise<FolderValidationResult> {
        return this.result;
    }
}

/**
 * Validate if a folder exists and prompt user if it doesn't
 * 
 * @param app Obsidian app instance
 * @param folderPath Path to validate
 * @returns Promise with validation result and user choice
 */
export async function validateFolderWithPrompt(
    app: App, 
    folderPath: string
): Promise<FolderValidationResult> {
    // Check if folder exists
    const folder = app.vault.getAbstractFileByPath(folderPath);
    
    if (folder) {
        return {
            exists: true,
            path: folderPath
        };
    }
    
    // Folder doesn't exist - prompt user
    const modal = new FolderPromptModal(app, folderPath);
    modal.open();
    
    return modal.getResult();
}

/**
 * Create a folder recursively if it doesn't exist
 * 
 * @param app Obsidian app instance
 * @param folderPath Path to create
 * @returns Promise that resolves when folder is created
 */
export async function createFolderRecursively(app: App, folderPath: string): Promise<void> {
    if (!folderPath) return;
    
    const pathParts = folderPath.split('/').filter(part => part.length > 0);
    let currentPath = '';
    
    for (const part of pathParts) {
        currentPath += (currentPath ? '/' : '') + part;
        const folder = app.vault.getAbstractFileByPath(currentPath);
        
        if (!folder) {
            try {
                await app.vault.createFolder(currentPath);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (!(errorMessage.includes('Folder already exists') || errorMessage.includes('already exists'))) {
                    throw error;
                }
            }
        }
    }
}

/**
 * Extract folder path from a file path (OneiroMetrics note path)
 * 
 * @param filePath Full path to a file
 * @returns Folder path or empty string if no folder
 */
export function extractFolderPath(filePath: string): string {
    if (!filePath) return '';
    
    const lastSlashIndex = filePath.lastIndexOf('/');
    if (lastSlashIndex === -1) return '';
    
    return filePath.substring(0, lastSlashIndex);
} 