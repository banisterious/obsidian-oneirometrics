import { App, Notice, TFile } from 'obsidian';
import { TemplaterVariable } from './types';
import { debug, error } from '../logging';
import safeLogger from '../logging/safe-logger';

interface TemplaterIntegrationSettings {
    enabled?: boolean;
    templateFolder?: string;
    defaultTemplate?: string;
    options?: Record<string, any>;
}

/**
 * Integration with the Templater plugin for advanced template support
 */
export class TemplaterIntegration {
    private settings: TemplaterIntegrationSettings;
    
    constructor(
        private app: App,
        private plugin: any,
        settings?: TemplaterIntegrationSettings
    ) {
        this.settings = settings || {};
    }
    
    /**
     * Check if Templater plugin is installed and enabled
     */
    isTemplaterInstalled(): boolean {
        // Use the plugin instance to check for Templater
        // @ts-ignore - Accessing internal plugin registry
        return Boolean(this.plugin && this.plugin.app && this.plugin.app.plugins && 
                      this.plugin.app.plugins.plugins['templater-obsidian']);
    }
    
    /**
     * Get the Templater plugin instance
     */
    private getTemplaterPlugin(): any {
        if (!this.isTemplaterInstalled()) {
            return null;
        }
        
        try {
            // @ts-ignore - Plugin API access
            return this.plugin.app.plugins.plugins['templater-obsidian'];
        } catch (err) {
            try {
                safeLogger.error('TemplaterIntegration', 'Error accessing Templater plugin', err);
            } catch (e) {
                error('TemplaterIntegration', 'Error accessing Templater plugin', err);
            }
            return null;
        }
    }
    
    /**
     * Get list of all available Templater templates
     */
    getTemplaterTemplates(): string[] {
        if (!this.isTemplaterInstalled()) {
            return [];
        }
        
        try {
            const templaterPlugin = this.getTemplaterPlugin();
            if (!templaterPlugin) return [];
            
            const templateFolder = templaterPlugin.settings.templates_folder;
            
            if (!templateFolder) {
                return [];
            }
            
            // Get files from the template folder
            const templateFiles: string[] = [];
            this.getTemplateFilesInFolder(templateFolder, templateFiles);
            
            return templateFiles;
        } catch (err) {
            try {
                safeLogger.error('TemplaterIntegration', 'Error getting Templater templates', err);
            } catch (e) {
                error('TemplaterIntegration', 'Error getting Templater templates', err);
            }
            return [];
        }
    }
    
    /**
     * Recursively get template files from a folder
     */
    private getTemplateFilesInFolder(folderPath: string, results: string[]): void {
        // Use the plugin's app reference
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
            // Use the plugin's app reference
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
        } catch (err) {
            try {
                safeLogger.error('TemplaterIntegration', 'Error getting template content', err);
            } catch (e) {
                error('TemplaterIntegration', 'Error getting template content', err);
            }
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
            const content = this.getTemplateContent(templatePath);
            const staticContent = this.convertToStaticTemplate(content);
            
            new Notice('Templater plugin is not installed. Using static template with placeholders.');
            return staticContent;
        }
        
        try {
            const templaterPlugin = this.getTemplaterPlugin();
            if (!templaterPlugin) {
                throw new Error("Templater plugin not found");
            }
            
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
        } catch (err) {
            try {
                safeLogger.error('TemplaterIntegration', 'Error processing template', err);
            } catch (e) {
                error('TemplaterIntegration', 'Error processing template', err);
            }
            new Notice(`Error processing template: ${err.message}`);
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
    
    /**
     * Converts Templater template content to a static version with placeholders
     * This is used when Templater is not installed
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
            (match, prompt, defaultVal) => {
                if (defaultVal) {
                    return `[[PROMPT: ${prompt} (default: ${defaultVal})]]`;
                }
                return `[[PROMPT: ${prompt}]]`;
            }
        );
        
        // Convert system variables: <% tp.system.clipboard() %> → [[SYSTEM: clipboard]]
        staticContent = staticContent.replace(
            /<%[\s\*]*tp\.system\.([a-zA-Z0-9_]+)\(\)[\s\*]*%>/g,
            '[[SYSTEM: $1]]'
        );
        
        // Convert file variables: <% tp.file.title %> → [[FILE: title]]
        staticContent = staticContent.replace(
            /<%[\s\*]*tp\.file\.([a-zA-Z0-9_]+)[\s\*]*%>/g,
            '[[FILE: $1]]'
        );
        
        // Handle remaining Templater code blocks with a generic placeholder
        staticContent = staticContent.replace(
            /<%[\s\*]*([\s\S]*?)[\s\*]*%>/g,
            (match, code) => {
                // Try to extract a meaningful name from the code
                const variableName = code.trim().match(/(?:let|const|var)\s+([a-zA-Z0-9_]+)/) || 
                                     code.trim().match(/([a-zA-Z0-9_]+)\s*=/) ||
                                     ['', 'templater_code'];
                
                return `[[CODE: ${variableName[1]}]]`;
            }
        );
        
        return staticContent;
    }
    
    /**
     * Generate both dynamic and static versions of a template
     * Returns an object with both versions
     */
    generateTemplateVersions(templatePath: string): { 
        content: string; 
        staticContent: string;
    } {
        const content = this.getTemplateContent(templatePath);
        const staticContent = this.convertToStaticTemplate(content);
        
        return {
            content,
            staticContent
        };
    }
    
    /**
     * Check if a template contains Templater syntax
     */
    hasTemplaterSyntax(content: string): boolean {
        return /<%[\s\*]*.*?[\s\*]*%>/g.test(content);
    }
    
    /**
     * Find all placeholders in a static template
     * Useful for navigation and replacing placeholders
     */
    findPlaceholders(staticContent: string): Array<{
        type: string;
        name: string;
        defaultValue?: string;
        position: { start: number; end: number; }
    }> {
        const placeholders = [];
        
        // Match all [[TYPE: name (default: value)]] placeholders
        const placeholderRegex = /\[\[([A-Z]+):\s*([^(\]]+)(?:\s*\(default:\s*([^)]+)\))?\]\]/g;
        let match;
        
        while ((match = placeholderRegex.exec(staticContent)) !== null) {
            placeholders.push({
                type: match[1],
                name: match[2].trim(),
                defaultValue: match[3]?.trim(),
                position: {
                    start: match.index,
                    end: match.index + match[0].length
                }
            });
        }
        
        return placeholders;
    }
    
    /**
     * Test method to demonstrate template conversion
     * Shows both the original Templater content and the static version
     */
    testTemplateConversion(templateContent: string): void {
        if (!templateContent) {
            new Notice('No template content provided');
            return;
        }
        
        const staticContent = this.convertToStaticTemplate(templateContent);
        const placeholders = this.findPlaceholders(staticContent);
        
        try {
            safeLogger.debug('TemplaterIntegration', 'Template Conversion', {
                originalContent: templateContent,
                staticContent: staticContent,
                placeholders: placeholders,
                hasTemplaterSyntax: this.hasTemplaterSyntax(templateContent)
            });
        } catch (e) {
            debug('TemplaterIntegration', 'Original Templater Content', templateContent);
            debug('TemplaterIntegration', 'Static Content with Placeholders', staticContent);
            debug('TemplaterIntegration', 'Detected Placeholders', placeholders);
            debug('TemplaterIntegration', `Has Templater Syntax: ${this.hasTemplaterSyntax(templateContent)}`);
        }
        
        new Notice(`Template converted: ${placeholders.length} placeholders found`);
    }
} 