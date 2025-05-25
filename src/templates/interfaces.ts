/**
 * Stub template interfaces
 * 
 * This is a temporary stub to fix TypeScript errors.
 * It will be replaced with a proper implementation.
 */

import { JournalTemplate } from './types';
import { TemplaterVariable } from '../journal_check/types';

export interface ITemplateProcessor {
  processTemplate(template: string | JournalTemplate, variables?: Record<string, any>): string | Promise<string>;
  
  // Make these methods optional for testing implementations
  registerHelper?(name: string, helper: (context: any, options: any) => string): void;
  registerPartial?(name: string, partial: string): void;
  
  // Add methods used in the tests
  isTemplaterAvailable?(): boolean;
  getTemplaterFiles?(): string[];
  extractTemplateVariables?(content: string): TemplaterVariable[];
  convertToStaticTemplate?(content: string): string;
  hasTemplaterSyntax?(content: string): boolean;
  generateTemplateVersions?(templatePath: string): { content: string; staticContent: string };
} 