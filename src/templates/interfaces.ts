/**
 * Stub template interfaces
 * 
 * This is a temporary stub to fix TypeScript errors.
 * It will be replaced with a proper implementation.
 */

import { JournalTemplate } from './types';

export interface ITemplateProcessor {
  processTemplate(template: string | JournalTemplate, variables: Record<string, any>): string | Promise<string>;
  registerHelper(name: string, helper: (context: any, options: any) => string): void;
  registerPartial(name: string, partial: string): void;
  convertToStaticTemplate?(content: string): string;
} 