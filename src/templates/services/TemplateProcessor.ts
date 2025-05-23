import { App, Notice, TFile, TFolder } from 'obsidian';
import { ITemplateProcessor } from '../interfaces';
import { JournalTemplate, TemplaterVariable } from '../types';

/**
 * Implementation of template processor with Templater integration.
 */
export class TemplateProcessor implements ITemplateProcessor {
  constructor(private app: App, private plugin: any) {}
  
  /**
   * Check if Templater plugin is installed and enabled
   */
  isTemplaterAvailable(): boolean {
    // Use any type to access plugins property safely
    return (this.app as any).plugins?.plugins['templater-obsidian'] !== undefined;
  }
  
  /**
   * Get a list of all Templater templates
   */
  getTemplaterFiles(): string[] {
    if (!this.isTemplaterAvailable()) {
      return [];
    }
    
    try {
      // Use any type to access plugins property safely
      const templaterPlugin = (this.app as any).plugins.plugins['templater-obsidian'];
      const templateFolder = templaterPlugin.settings.template_folder;
      
      if (!templateFolder) {
        return [];
      }
      
      // Get files from the template folder
      const templateFiles: string[] = [];
      this.getTemplateFilesInFolder(templateFolder, templateFiles);
      
      return templateFiles;
    } catch (error) {
      console.error('[OneiroMetrics] Error getting Templater templates:', error);
      return [];
    }
  }
  
  /**
   * Recursively get template files from a folder
   */
  private getTemplateFilesInFolder(folderPath: string, results: string[]): void {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    
    if (!folder || !(folder instanceof TFolder)) {
      return;
    }
    
    // Iterate through children
    // Cast to TFolder to use the children property safely
    const folderChildren = (folder as TFolder).children || [];
    for (const child of folderChildren) {
      if (child instanceof TFile) {
        if (child.extension === 'md') {
          results.push(child.path);
        }
      } else if (child instanceof TFolder) {
        this.getTemplateFilesInFolder(child.path, results);
      }
    }
  }
  
  /**
   * Process a template with dynamic content
   */
  async processTemplate(template: JournalTemplate, data?: Record<string, any>): Promise<string> {
    // If it's not a Templater template, just return the content
    if (!template.isTemplaterTemplate) {
      return template.content;
    }
    
    // Check if Templater is available
    if (!this.isTemplaterAvailable()) {
      // If a static version is available, use that
      if (template.staticContent) {
        new Notice('Templater plugin is not installed. Using static template with placeholders.');
        return template.staticContent;
      }
      // Otherwise, convert the content to static
      return this.convertToStaticTemplate(template.content);
    }
    
    // If it's a Templater template with a file path, use that
    if (template.templaterFile) {
      return this.processTemplaterFile(template.templaterFile, data);
    }
    
    // Otherwise, process the content directly
    return template.content;
  }
  
  /**
   * Process a Templater file with provided data
   */
  private async processTemplaterFile(templatePath: string, data?: Record<string, any>): Promise<string> {
    try {
      // Get the template file
      const file = this.app.vault.getAbstractFileByPath(templatePath);
      
      if (!file || !(file instanceof TFile)) {
        new Notice(`Template not found: ${templatePath}`);
        return '';
      }
      
      // This is a simplified implementation - in a real-world scenario, we would
      // need to interact with the Templater API to process templates with variables
      const content = await this.app.vault.read(file);
      
      // For now we'll just return the content
      // In a full implementation, we would process this with Templater
      return content;
    } catch (error) {
      console.error('[OneiroMetrics] Error processing template:', error);
      new Notice(`Error processing template: ${error.message}`);
      return '';
    }
  }
  
  /**
   * Extract variables from Templater syntax
   */
  extractTemplateVariables(content: string): TemplaterVariable[] {
    const variables: TemplaterVariable[] = [];
    
    // Match Templater variables in the format <% ... %>
    const variableRegex = /<%(?:\*|\s+\*)?\s*([\s\S]*?)\s*%>/g;
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const variableContent = match[1];
      
      // Try to determine variable type
      let type: 'date' | 'prompt' | 'system' | 'custom' = 'custom';
      let name = '';
      let defaultValue: string | undefined;
      
      if (variableContent.startsWith('tp.date')) {
        type = 'date';
        name = 'date';
        
        // Try to extract date format if available
        const formatMatch = variableContent.match(/tp\.date\.now\(['"]([^'"]+)['"]/);
        if (formatMatch) {
          name = `date_${formatMatch[1]}`;
        }
      } else if (variableContent.includes('tp.system.prompt')) {
        type = 'prompt';
        
        // Try to extract prompt name and default value
        const promptMatch = variableContent.match(/tp\.system\.prompt\(['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?\)/);
        if (promptMatch) {
          name = promptMatch[1];
          defaultValue = promptMatch[2];
        } else {
          name = 'prompt';
        }
      } else if (variableContent.startsWith('tp.system')) {
        type = 'system';
        
        // Try to extract system command name
        const systemMatch = variableContent.match(/tp\.system\.([a-zA-Z0-9_]+)/);
        if (systemMatch) {
          name = `system_${systemMatch[1]}`;
        } else {
          name = 'system';
        }
      } else {
        name = 'custom';
        
        // Try to extract custom variable name
        const customMatch = variableContent.match(/(?:let|const|var)\s+([a-zA-Z0-9_]+)/);
        if (customMatch) {
          name = customMatch[1];
        }
      }
      
      // Convert match index to line and column
      const lines = content.substring(0, match.index).split('\n');
      const startLine = lines.length;
      const startColumn = lines[lines.length - 1].length;
      
      const endLines = content.substring(0, match.index + fullMatch.length).split('\n');
      const endLine = endLines.length;
      const endColumn = endLines[endLines.length - 1].length;
      
      variables.push({
        name,
        type,
        position: {
          start: { line: startLine, column: startColumn },
          end: { line: endLine, column: endColumn }
        },
        defaultValue
      });
    }
    
    return variables;
  }
  
  /**
   * Convert a Templater template to static content with placeholders
   */
  convertToStaticTemplate(content: string): string {
    if (!content) return '';
    
    let staticContent = content;
    
    // Convert date variables: <% tp.date.now("YYYY-MM-DD") %> → [[DATE: YYYY-MM-DD]]
    staticContent = staticContent.replace(
      /<%[\s\*]*tp\.date\.now\(['"]([^'"]+)['"]\)[\s\*]*%>/g,
      '[[DATE: $1]]'
    );
    
    // Convert prompt variables: <% tp.system.prompt("Enter mood", "neutral") %> → [[PROMPT: Enter mood (default: neutral)]]
    staticContent = staticContent.replace(
      /<%[\s\*]*tp\.system\.prompt\(['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?\)[\s\*]*%>/g,
      (match, prompt, defaultValue) => {
        return defaultValue
          ? `[[PROMPT: ${prompt} (default: ${defaultValue})]]`
          : `[[PROMPT: ${prompt}]]`;
      }
    );
    
    // Convert system variables: <% tp.file.title %> → [[SYSTEM: file.title]]
    staticContent = staticContent.replace(
      /<%[\s\*]*tp\.file\.([a-zA-Z0-9_]+)[\s\*]*%>/g,
      '[[SYSTEM: file.$1]]'
    );
    
    // Convert system variables: <% tp.date.now() %> → [[SYSTEM: date.now]]
    staticContent = staticContent.replace(
      /<%[\s\*]*tp\.date\.now\(\)[\s\*]*%>/g,
      '[[SYSTEM: date.now]]'
    );
    
    // Convert remaining Templater variables: <% ... %> → [[VARIABLE]]
    staticContent = staticContent.replace(
      /<%[\s\*]*([\s\S]*?)[\s\*]*%>/g,
      '[[VARIABLE]]'
    );
    
    return staticContent;
  }
  
  /**
   * Check if content contains Templater syntax
   */
  hasTemplaterSyntax(content: string): boolean {
    return /<%[\s\S]*?%>/.test(content);
  }
  
  /**
   * Generate static and dynamic versions of a template
   */
  generateTemplateVersions(templatePath: string): { 
    content: string; 
    staticContent: string;
  } {
    try {
      const file = this.app.vault.getAbstractFileByPath(templatePath);
      
      if (!file || !(file instanceof TFile)) {
        return { content: '', staticContent: '' };
      }
      
      // Read the file content directly from vault instead of using metadata cache
      let content = '';
      try {
        // Read file content synchronously (we're already in a try/catch block)
        content = this.app.vault.read(file as TFile) as unknown as string;
      } catch (e) {
        console.error('[OneiroMetrics] Error reading template file:', e);
      }
      
      // Convert to static content if it has Templater syntax
      const hasTemplater = this.hasTemplaterSyntax(content);
      const staticContent = hasTemplater 
        ? this.convertToStaticTemplate(content)
        : content;
      
      return {
        content: content,
        staticContent: staticContent
      };
    } catch (error) {
      console.error('[OneiroMetrics] Error generating template versions:', error);
      return { content: '', staticContent: '' };
    }
  }
} 