import { JournalTemplate, TemplaterVariable } from '../types';

/**
 * Interface for processing templates and working with templating systems.
 */
export interface ITemplateProcessor {
  /**
   * Check if the Templater plugin is installed and available
   * @returns True if Templater is available
   */
  isTemplaterAvailable(): boolean;
  
  /**
   * Get a list of available Templater template files
   * @returns Array of file paths
   */
  getTemplaterFiles(): string[];
  
  /**
   * Process a template with dynamic content
   * @param template Template to process
   * @param data Optional data to use for processing
   * @returns Processed template content
   */
  processTemplate(template: JournalTemplate, data?: Record<string, any>): Promise<string>;
  
  /**
   * Extract variables from Templater syntax
   * @param content Template content
   * @returns Array of template variables
   */
  extractTemplateVariables(content: string): TemplaterVariable[];
  
  /**
   * Convert a Templater template to static content with placeholders
   * @param content Templater template content
   * @returns Static version with placeholders
   */
  convertToStaticTemplate(content: string): string;
  
  /**
   * Check if content contains Templater syntax
   * @param content Content to check
   * @returns True if content contains Templater syntax
   */
  hasTemplaterSyntax(content: string): boolean;
  
  /**
   * Generate static and dynamic versions of a template
   * @param templatePath Path to Templater template
   * @returns Object containing both versions
   */
  generateTemplateVersions(templatePath: string): { 
    content: string; 
    staticContent: string;
  };
} 