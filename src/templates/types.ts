/**
 * Template System Type Definitions
 * 
 * REFACTORING NOTE:
 * ----------------
 * During the refactoring process, some types are temporarily duplicated between 
 * src/journal_check/types.ts and src/templates/types.ts. This is intentional to 
 * allow for gradual migration without breaking existing code.
 * 
 * The plan is:
 * 1. Define all template-related types in this file
 * 2. Update importing modules to use these types
 * 3. Once all imports are updated, remove duplicate types from src/journal_check/types.ts
 * 
 * This file should be considered the source of truth for all template-related types.
 */

/**
 * Template structure for dream journals
 */
export interface JournalTemplate {
  /**
   * Unique template identifier
   */
  id: string;
  
  /**
   * Display name for the template
   */
  name: string;
  
  /**
   * Optional description of the template
   */
  description: string;
  
  /**
   * ID of the associated journal structure
   */
  structure: string;
  
  /**
   * Template content (markdown with placeholders)
   */
  content: string;
  
  /**
   * Whether this template uses Templater for dynamic content
   */
  isTemplaterTemplate: boolean;
  
  /**
   * Path to Templater template file if using Templater
   */
  templaterFile?: string;
  
  /**
   * Static version of the template with placeholders
   * Used when Templater is not available
   */
  staticContent?: string;
}

/**
 * Settings for template system
 */
export interface TemplateSettings {
  /**
   * List of available templates
   */
  templates: JournalTemplate[];
  
  /**
   * Templater integration settings
   */
  templaterIntegration: {
    /**
     * Whether Templater integration is enabled
     */
    enabled: boolean;
    
    /**
     * Path to Templater templates folder
     */
    folderPath: string;
    
    /**
     * Default template to use
     */
    defaultTemplate: string;
  };
}

/**
 * Position in a document
 */
export interface TemplatePosition {
  line: number;
  column: number;
}

/**
 * Variable in a Templater template
 */
export interface TemplaterVariable {
  /**
   * Variable name
   */
  name: string;
  
  /**
   * Variable type
   */
  type: 'date' | 'prompt' | 'system' | 'custom';
  
  /**
   * Position in the document
   */
  position: {
    start: TemplatePosition;
    end: TemplatePosition;
  };
  
  /**
   * Default value if available
   */
  defaultValue?: string;
} 