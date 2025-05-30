/**
 * TemplateManager
 * 
 * Handles template insertion functionality for dream journal templates.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Editor, Modal, Notice } from 'obsidian';
import { DreamMetricsSettings } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';
import { TemplaterIntegration } from '../journal_check/TemplaterIntegration';

export class TemplateManager {
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private templaterIntegration: TemplaterIntegration,
        private logger?: ILogger
    ) {}

    /**
     * Insert a journal template into the current editor
     * @param editor The editor instance to insert the template into
     */
    async insertTemplate(editor: Editor): Promise<void> {
        this.logger?.debug('Templates', 'insertTemplate called');

        // Get templates from settings
        const templates = this.settings.linting?.templates || [];
        if (templates.length === 0) {
            new Notice('No templates available. Create templates in the OneiroMetrics settings.');
            return;
        }

        // Open template selection modal
        const modal = new Modal(this.app);
        modal.titleEl.setText('Insert Journal Template');
        modal.contentEl.addClass('oom-template-selection-modal');
        
        // Create template list
        for (const template of templates) {
            this.createTemplateItem(modal, template, editor);
        }
        
        modal.open();
    }

    /**
     * Create a template item in the modal
     * @param modal The modal instance
     * @param template The template configuration
     * @param editor The editor instance
     */
    private createTemplateItem(modal: Modal, template: any, editor: Editor): void {
        const templateItem = modal.contentEl.createDiv({ cls: 'oom-template-item' });
        
        // Create template header with name
        const headerEl = templateItem.createDiv({ cls: 'oom-template-header' });
        headerEl.createEl('h3', { text: template.name });
        
        // Get structure info to display structure type
        const structures = this.settings.linting?.structures || [];
        const structure = structures.find(s => s.id === template.structure);
        
        if (structure) {
            this.addStructureTypeIndicator(headerEl, structure);
        }
        
        // Add templater badge if applicable
        if (template.isTemplaterTemplate) {
            this.addTemplaterBadge(headerEl);
        }
        
        // Add description if available
        if (template.description) {
            templateItem.createEl('p', { text: template.description, cls: 'oom-template-description' });
        }
        
        // Create buttons container
        const buttonContainer = templateItem.createDiv({ cls: 'oom-template-buttons' });
        
        // Add preview button
        this.createPreviewButton(buttonContainer, templateItem, template);
        
        // Add insert button
        this.createInsertButton(buttonContainer, modal, template, editor, structure);
    }

    /**
     * Add structure type indicator to template header
     * @param headerEl The header element
     * @param structure The structure configuration
     */
    private addStructureTypeIndicator(headerEl: HTMLElement, structure: any): void {
        const typeIndicator = headerEl.createEl('span', { 
            cls: `oom-template-type oom-${structure.type}-type`,
            attr: { title: structure.type === 'nested' ? 'Nested Structure' : 'Flat Structure' }
        });
        const typeIcon = structure.type === 'nested' ? '📦' : '📄';
        typeIndicator.setText(`${typeIcon} ${structure.type}`);
    }

    /**
     * Add Templater badge to template header
     * @param headerEl The header element
     */
    private addTemplaterBadge(headerEl: HTMLElement): void {
        const templaterBadge = headerEl.createEl('span', {
            cls: 'oom-templater-badge',
            attr: { title: 'Uses Templater for dynamic content' }
        });
        templaterBadge.setText('⚡ Templater');
    }

    /**
     * Create preview button for template
     * @param buttonContainer The button container element
     * @param templateItem The template item element
     * @param template The template configuration
     */
    private createPreviewButton(buttonContainer: HTMLElement, templateItem: HTMLElement, template: any): void {
        const previewButton = buttonContainer.createEl('button', {
            text: 'Preview',
            cls: 'oom-preview-button'
        });
        
        previewButton.addEventListener('click', () => {
            this.togglePreview(templateItem, previewButton, template);
        });
    }

    /**
     * Toggle preview visibility for a template
     * @param templateItem The template item element
     * @param previewButton The preview button element
     * @param template The template configuration
     */
    private togglePreview(templateItem: HTMLElement, previewButton: HTMLElement, template: any): void {
        const previewEl = templateItem.querySelector('.oom-template-preview');
        
        if (previewEl) {
            // Hide preview
            previewEl.remove();
            previewButton.setText('Preview');
        } else {
            // Show preview
            const newPreviewEl = templateItem.createDiv({ cls: 'oom-template-preview' });
            
            if (template.isTemplaterTemplate && template.staticContent) {
                this.createDynamicStaticToggle(newPreviewEl, template);
            } else {
                // Regular preview for non-Templater templates
                newPreviewEl.createEl('pre', { text: template.content });
            }
            
            previewButton.setText('Hide Preview');
        }
    }

    /**
     * Create dynamic/static toggle for Templater templates
     * @param previewEl The preview element
     * @param template The template configuration
     */
    private createDynamicStaticToggle(previewEl: HTMLElement, template: any): void {
        const toggleContainer = previewEl.createDiv({ cls: 'oom-preview-toggle-container' });
        
        const dynamicToggle = toggleContainer.createEl('button', {
            text: 'Dynamic (Templater)',
            cls: 'oom-preview-toggle oom-preview-toggle-active'
        });
        
        const staticToggle = toggleContainer.createEl('button', {
            text: 'Static (Fallback)',
            cls: 'oom-preview-toggle'
        });
        
        const previewContent = previewEl.createDiv({ cls: 'oom-preview-content' });
        previewContent.createEl('pre', { text: template.content });
        
        dynamicToggle.addEventListener('click', () => {
            dynamicToggle.addClass('oom-preview-toggle-active');
            staticToggle.removeClass('oom-preview-toggle-active');
            previewContent.empty();
            previewContent.createEl('pre', { text: template.content });
        });
        
        staticToggle.addEventListener('click', () => {
            staticToggle.addClass('oom-preview-toggle-active');
            dynamicToggle.removeClass('oom-preview-toggle-active');
            previewContent.empty();
            previewContent.createEl('pre', { text: template.staticContent });
        });
    }

    /**
     * Create insert button for template
     * @param buttonContainer The button container element
     * @param modal The modal instance
     * @param template The template configuration
     * @param editor The editor instance
     * @param structure The structure configuration
     */
    private createInsertButton(
        buttonContainer: HTMLElement, 
        modal: Modal, 
        template: any, 
        editor: Editor, 
        structure: any
    ): void {
        const insertButton = buttonContainer.createEl('button', { 
            text: 'Insert',
            cls: 'mod-cta'
        });
        
        insertButton.addEventListener('click', async () => {
            try {
                modal.close();
                await this.processTemplateInsertion(template, editor, structure);
            } catch (error) {
                this.logger?.error('Templates', 'Error during template insertion', error instanceof Error ? error : new Error(String(error)));
                new Notice('Error inserting template. See console for details.');
            }
        });
    }

    /**
     * Process template insertion including Templater integration
     * @param template The template configuration
     * @param editor The editor instance
     * @param structure The structure configuration
     */
    private async processTemplateInsertion(template: any, editor: Editor, structure: any): Promise<void> {
        this.logger?.debug('Templates', 'Processing template insertion', { templateName: template.name });

        // Get template content
        let content = '';
        let usingFallback = false;
        
        if (template.isTemplaterTemplate && template.templaterFile) {
            const result = await this.processTemplaterTemplate(template);
            content = result.content;
            usingFallback = result.usingFallback;
        } else {
            // Regular non-Templater template
            content = template.content;
        }
        
        // Insert content at cursor position
        const initialCursorPosition = editor.getCursor();
        editor.replaceSelection(content);
        
        // Handle placeholder navigation if using static version
        if (usingFallback && this.templaterIntegration) {
            await this.handlePlaceholderNavigation(content, editor, initialCursorPosition);
        }
        
        // Show confirmation with structure type
        this.showInsertionConfirmation(template, structure, usingFallback);
    }

    /**
     * Process Templater template with fallback handling
     * @param template The template configuration
     * @returns Object with content and fallback status
     */
    private async processTemplaterTemplate(template: any): Promise<{ content: string; usingFallback: boolean }> {
        let content = '';
        let usingFallback = false;

        if (this.templaterIntegration && this.templaterIntegration.isTemplaterInstalled()) {
            try {
                content = await this.templaterIntegration.processTemplaterTemplate(template.templaterFile);
                this.logger?.debug('Templates', 'Successfully processed Templater template');
            } catch (error) {
                this.logger?.error('Templates', 'Error processing Templater template', error instanceof Error ? error : new Error(String(error)));
                new Notice('Error processing Templater template');
                
                // Fallback to static content if available
                content = this.getTemplaterFallbackContent(template);
                usingFallback = true;
            }
        } else {
            // Templater not installed, use static version
            content = this.getTemplaterFallbackContent(template);
            usingFallback = true;
            new Notice('Templater plugin is not installed. Using static template with placeholders.');
        }

        return { content, usingFallback };
    }

    /**
     * Get fallback content for Templater templates
     * @param template The template configuration
     * @returns The fallback content string
     */
    private getTemplaterFallbackContent(template: any): string {
        if (template.staticContent) {
            return template.staticContent;
        } else {
            // Generate static content on the fly if not available
            if (this.templaterIntegration) {
                return this.templaterIntegration.convertToStaticTemplate(template.content);
            } else {
                return template.content;
            }
        }
    }

    /**
     * Handle placeholder navigation for static templates
     * @param content The template content
     * @param editor The editor instance
     * @param initialCursorPosition The initial cursor position
     */
    private async handlePlaceholderNavigation(content: string, editor: Editor, initialCursorPosition: any): Promise<void> {
        try {
            // Find placeholders
            const placeholders = this.templaterIntegration.findPlaceholders(content);
            
            if (placeholders.length > 0) {
                // Navigate to first placeholder
                const firstPlaceholder = placeholders[0];
                const lines = content.substring(0, firstPlaceholder.position.start).split('\n');
                
                const position = {
                    line: initialCursorPosition.line + lines.length - 1,
                    ch: lines.length > 1 ? lines[lines.length - 1].length : initialCursorPosition.ch + firstPlaceholder.position.start
                };
                
                editor.setCursor(position);
                
                // Select the placeholder
                const endPosition = {
                    line: position.line,
                    ch: position.ch + (firstPlaceholder.position.end - firstPlaceholder.position.start)
                };
                
                editor.setSelection(position, endPosition);
                
                // Show instructional notice
                new Notice(`Fill in the ${placeholders.length} placeholder(s). Press Tab to navigate between them.`);
            }
        } catch (error) {
            this.logger?.error('Templates', 'Error handling placeholder navigation', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Show insertion confirmation notice
     * @param template The template configuration
     * @param structure The structure configuration
     * @param usingFallback Whether fallback content was used
     */
    private showInsertionConfirmation(template: any, structure: any, usingFallback: boolean): void {
        if (structure) {
            if (usingFallback) {
                new Notice(`Inserted "${template.name}" (${structure.type} structure) using static placeholders.`);
            } else {
                new Notice(`Inserted "${template.name}" (${structure.type} structure)`);
            }
        } else {
            new Notice(`Template "${template.name}" inserted`);
        }
    }
} 