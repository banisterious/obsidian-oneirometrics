import { JournalTemplate } from '../types';
import { Editor } from 'obsidian';

/**
 * Interface for managing dream journal templates.
 * Handles template creation, selection, and application.
 */
export interface ITemplateManager {
  /**
   * Get all available templates
   * @returns Array of journal templates
   */
  getTemplates(): JournalTemplate[];
  
  /**
   * Get a template by ID
   * @param id Template ID
   * @returns The found template or null if not found
   */
  getTemplateById(id: string): JournalTemplate | null;
  
  /**
   * Create a new template
   * @param template Template data to create
   * @returns The created template
   */
  createTemplate(template: Omit<JournalTemplate, 'id'>): JournalTemplate;
  
  /**
   * Update an existing template
   * @param id Template ID
   * @param template Updated template data
   * @returns The updated template or null if not found
   */
  updateTemplate(id: string, template: Partial<JournalTemplate>): JournalTemplate | null;
  
  /**
   * Delete a template
   * @param id Template ID
   * @returns True if the template was deleted, false otherwise
   */
  deleteTemplate(id: string): boolean;
  
  /**
   * Insert a template into the editor
   * @param editor Obsidian editor instance
   * @param templateId Template ID
   * @returns Promise that resolves when the template is inserted
   */
  insertTemplate(editor: Editor, templateId: string): Promise<void>;
  
  /**
   * Open the template selection modal
   * @param editor Obsidian editor instance
   * @param onSelect Optional callback for template selection
   */
  openTemplateSelectionModal(editor: Editor, onSelect?: (templateId: string) => void): void;
  
  /**
   * Open the template wizard for creating or editing templates
   * @param templateId Optional template ID to edit
   */
  openTemplateWizard(templateId?: string): void;
} 