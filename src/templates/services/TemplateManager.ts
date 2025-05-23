import { App, Editor, Modal, Notice, Setting, TFile } from 'obsidian';
import { ITemplateManager, ITemplateProcessor } from '../interfaces';
import { JournalTemplate } from '../types';

/**
 * Implementation of template manager service.
 * Handles template creation, management, and application.
 */
export class TemplateManager implements ITemplateManager {
  private templates: JournalTemplate[] = [];
  
  constructor(
    private app: App,
    private plugin: any,
    private templateProcessor: ITemplateProcessor
  ) {
    // Load templates from settings
    this.loadTemplates();
  }
  
  /**
   * Load templates from plugin settings
   */
  private loadTemplates(): void {
    if (this.plugin.settings?.linting?.templates) {
      this.templates = [...this.plugin.settings.linting.templates];
    } else {
      this.templates = [];
    }
  }
  
  /**
   * Save templates to plugin settings
   */
  private saveTemplates(): void {
    if (!this.plugin.settings.linting) {
      this.plugin.settings.linting = { templates: [] };
    }
    
    this.plugin.settings.linting.templates = [...this.templates];
    this.plugin.saveSettings();
  }
  
  /**
   * Get all available templates
   */
  getTemplates(): JournalTemplate[] {
    return [...this.templates];
  }
  
  /**
   * Get a template by ID
   */
  getTemplateById(id: string): JournalTemplate | null {
    return this.templates.find(t => t.id === id) || null;
  }
  
  /**
   * Create a new template
   */
  createTemplate(template: Omit<JournalTemplate, 'id'>): JournalTemplate {
    const id = `template-${Date.now()}`;
    const newTemplate: JournalTemplate = {
      id,
      ...template
    };
    
    this.templates.push(newTemplate);
    this.saveTemplates();
    
    return newTemplate;
  }
  
  /**
   * Update an existing template
   */
  updateTemplate(id: string, template: Partial<JournalTemplate>): JournalTemplate | null {
    const index = this.templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedTemplate = {
      ...this.templates[index],
      ...template
    };
    
    this.templates[index] = updatedTemplate;
    this.saveTemplates();
    
    return updatedTemplate;
  }
  
  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(t => t.id !== id);
    
    if (this.templates.length !== initialLength) {
      this.saveTemplates();
      return true;
    }
    
    return false;
  }
  
  /**
   * Insert a template into the editor
   */
  async insertTemplate(editor: Editor, templateId: string): Promise<void> {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      new Notice(`Template not found: ${templateId}`);
      return;
    }
    
    try {
      // Process the template content
      const content = await this.templateProcessor.processTemplate(template);
      
      // Insert the processed content at the cursor position
      editor.replaceSelection(content);
      
      new Notice(`Inserted template: ${template.name}`);
    } catch (error) {
      console.error('[OneiroMetrics] Error inserting template:', error);
      new Notice(`Error inserting template: ${error.message}`);
    }
  }
  
  /**
   * Open the template selection modal
   */
  openTemplateSelectionModal(editor: Editor, onSelect?: (templateId: string) => void): void {
    const templates = this.getTemplates();
    
    if (templates.length === 0) {
      new Notice('No templates available. Create templates in the OneiroMetrics settings.');
      return;
    }
    
    // Create and open template selection modal
    const modal = new Modal(this.app);
    modal.titleEl.setText('Insert Journal Template');
    modal.contentEl.addClass('oom-template-selection-modal');
    
    // Create template list
    for (const template of templates) {
      const templateItem = modal.contentEl.createDiv({ cls: 'oom-template-item' });
      
      // Create template header with name
      const headerEl = templateItem.createDiv({ cls: 'oom-template-header' });
      headerEl.createEl('h3', { text: template.name });
      
      // Get the structure for this template
      const structures = this.plugin.settings.linting?.structures || [];
      const structure = structures.find((s: any) => s.id === template.structure);
      
      if (structure) {
        headerEl.createEl('span', {
          text: structure.name,
          cls: `oom-template-type oom-${structure.type}-type`,
          attr: { title: `Structure: ${structure.name}` }
        });
      }
      
      // Add templater badge if applicable
      if (template.isTemplaterTemplate) {
        const templaterBadge = headerEl.createEl('span', {
          cls: 'oom-templater-badge',
          attr: { title: 'Uses Templater for dynamic content' }
        });
        templaterBadge.setText('⚡ Templater');
      }
      
      // Add description if available
      if (template.description) {
        templateItem.createEl('p', { text: template.description, cls: 'oom-template-description' });
      }
      
      // Add action buttons
      const buttonContainer = templateItem.createDiv({ cls: 'oom-template-buttons' });
      
      // Insert button
      const insertButton = buttonContainer.createEl('button', {
        text: 'Insert',
        cls: 'oom-button'
      });
      
      insertButton.addEventListener('click', async () => {
        if (onSelect) {
          onSelect(template.id);
        } else {
          await this.insertTemplate(editor, template.id);
        }
        modal.close();
      });
      
      // Preview section
      const previewEl = templateItem.createDiv({ cls: 'oom-template-preview' });
      previewEl.createEl('pre', { text: template.content });
    }
    
    modal.open();
  }
  
  /**
   * Open the template wizard for creating or editing templates
   * Note: This is a temporary implementation. The full implementation
   * will be added when the TemplateWizard UI component is migrated.
   */
  openTemplateWizard(templateId?: string): void {
    // Currently uses the existing TemplateWizard class
    // This will be replaced when the UI components are migrated
    if (templateId) {
      const template = this.getTemplateById(templateId);
      if (!template) {
        new Notice(`Template not found: ${templateId}`);
        return;
      }
      
      // Display a notice for now
      new Notice(`Template wizard will be migrated in a future update. Template ID: ${templateId}`);
    } else {
      // Display a notice for now
      new Notice('Template wizard will be migrated in a future update.');
    }
  }
} 