import { App, Notice, TFile } from 'obsidian';
import { TemplaterVariable } from './types';

/**
 * Integration with the Templater plugin for advanced template support
 */
export class TemplaterIntegration {
    constructor(private plugin: any) {}
    
    /**
     * Check if Templater plugin is installed and enabled
     */
    isTemplaterInstalled(): boolean {
        return this.plugin.app.plugins.plugins['templater-obsidian'] !== undefined;
    }
    
    /**
     * Get list of all available Templater templates
     */
    getTemplaterTemplates(): string[] {
        if (!this.isTemplaterInstalled()) {
            return [];
        }
        
        try {
            const templaterPlugin = this.plugin.app.plugins.plugins['templater-obsidian'];
            const templateFolder = templaterPlugin.settings.template_folder;
            
            if (!templateFolder) {
                return [];
            }
            
            // Get files from the template folder
            const templateFiles: string[] = [];
            this.getTemplateFilesInFolder(templateFolder, templateFiles);
            
            return templateFiles;
        } catch (error) {
            console.error('Error getting Templater templates:', error);
            return [];
        }
    }
    
    /**
     * Recursively get template files from a folder
     */
    private getTemplateFilesInFolder(folderPath: string, results: string[]): void {
        const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
        
        if (!folder || folder instanceof TFile) {
            return;
        }
        
        // Iterate through children
        for (const child of folder.children) {
            if (child instanceof TFile) {
                if (child.extension === 'md') {
                    results.push(child.path);
                }
            } else {
                this.getTemplateFilesInFolder(child.path, results);
            }
        }
    }
    
    /**
     * Get the content of a Templater template
     */
    getTemplateContent(templatePath: string): string {
        try {
            const file = this.plugin.app.vault.getAbstractFileByPath(templatePath);
            
            if (!file || !(file instanceof TFile)) {
                return '';
            }
            
            // This is an async function, so we can't just return the content
            // But for our validation purposes, we can use a cached copy if available
            const cachedContent = this.plugin.app.metadataCache.getFileCache(file)?.content;
            
            if (cachedContent) {
                return cachedContent;
            }
            
            // Return empty string if we can't get the content
            return '';
        } catch (error) {
            console.error('Error getting template content:', error);
            return '';
        }
    }
    
    /**
     * Extract Templater variables from content
     */
    parseTemplaterVariables(content: string): TemplaterVariable[] {
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
     * Execute a Templater template with provided data
     * Note: This is an async operation and will require a UI component to handle
     * any interactive prompts
     */
    async processTemplaterTemplate(templatePath: string, data?: any): Promise<string> {
        if (!this.isTemplaterInstalled()) {
            new Notice('Templater plugin is not installed or enabled');
            return '';
        }
        
        try {
            const templaterPlugin = this.plugin.app.plugins.plugins['templater-obsidian'];
            const templater = templaterPlugin.templater;
            
            // Get the template file
            const file = this.plugin.app.vault.getAbstractFileByPath(templatePath);
            
            if (!file || !(file instanceof TFile)) {
                new Notice(`Template not found: ${templatePath}`);
                return '';
            }
            
            // This is a simplified version - actual processing would be more complex
            // and involve dynamic user interaction for prompts
            const content = await this.plugin.app.vault.read(file);
            
            // For now, just return the raw template content - actual processing 
            // requires access to Templater's internal API
            return content;
        } catch (error) {
            console.error('Error processing template:', error);
            new Notice(`Error processing template: ${error.message}`);
            return '';
        }
    }
    
    /**
     * Check if a template is compatible with the journal structure validation
     */
    isTemplateCompatible(templatePath: string): { compatible: boolean, reason?: string } {
        const content = this.getTemplateContent(templatePath);
        
        // Check if it has any callout blocks which would be parsed by our system
        const hasCallouts = />\s*\[!(\w+)\]/.test(content);
        
        if (!hasCallouts) {
            return { 
                compatible: false, 
                reason: 'Template does not contain any callout blocks' 
            };
        }
        
        return { compatible: true };
    }
} 