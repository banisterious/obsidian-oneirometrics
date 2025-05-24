/**
 * Stub template types
 * 
 * This is a temporary stub to fix TypeScript errors.
 * It will be replaced with a proper implementation.
 */

export interface JournalTemplate {
  id: string;
  name: string;
  content: string;
  isBuiltIn: boolean;
  lastModified: number;
  description?: string;
  isTemplaterTemplate?: boolean;
  staticContent?: string;
}

export interface TemplaterVariable {
  name: string;
  value: string;
  description?: string;
  type?: string;
} 