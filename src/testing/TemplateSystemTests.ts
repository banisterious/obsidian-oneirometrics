import { TestRunner } from './TestRunner';
import { ITemplateProcessor } from '../templates/interfaces';
import { JournalTemplate } from '../templates/types';
// Import the correct TemplaterVariable type for compatibility
import { TemplaterVariable } from '../journal_check/types';

// Mock template processor for testing
class MockTemplateProcessor implements ITemplateProcessor {
  private templaterAvailable: boolean = false;
  
  constructor(templaterAvailable: boolean = false) {
    this.templaterAvailable = templaterAvailable;
  }
  
  isTemplaterAvailable(): boolean {
    return this.templaterAvailable;
  }
  
  getTemplaterFiles(): string[] {
    return [
      'templates/dream-basic.md',
      'templates/dream-detailed.md'
    ];
  }
  
  async processTemplate(template: JournalTemplate, data?: Record<string, any>): Promise<string> {
    if (!template.isTemplaterTemplate) {
      return template.content;
    }
    
    if (!this.templaterAvailable) {
      return template.staticContent || this.convertToStaticTemplate(template.content);
    }
    
    // Mock templater processing
    let processed = template.content;
    
    // Simple variable replacement for testing
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        processed = processed.replace(new RegExp(`<%\\s*${key}\\s*%>`, 'g'), String(value));
      });
    }
    
    return processed;
  }
  
  extractTemplateVariables(content: string): TemplaterVariable[] {
    const variables: TemplaterVariable[] = [];
    const regex = /<%\s*(.+?)\s*%>/g;
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const variableName = match[1];
      const startIndex = match.index;
      
      // Create a template variable that matches the journal_check/types.ts interface
      const variable: TemplaterVariable = {
        name: variableName,
        type: 'custom',
        // Add the required position property
        position: {
          start: { line: this.getLineNumber(content, startIndex), column: this.getColumnNumber(content, startIndex) },
          end: { line: this.getLineNumber(content, startIndex + fullMatch.length), column: this.getColumnNumber(content, startIndex + fullMatch.length) }
        }
      };
      
      variables.push(variable);
    }
    
    return variables;
  }
  
  // Helper methods to calculate line and column numbers
  private getLineNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }
  
  private getColumnNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n');
    if (lines.length === 0) return 0;
    return lines[lines.length - 1].length;
  }
  
  convertToStaticTemplate(content: string): string {
    return content.replace(/<%\s*(.+?)\s*%>/g, '[[placeholder:$1]]');
  }
  
  hasTemplaterSyntax(content: string): boolean {
    return content.match(/<%\s*.+?\s*%>/) !== null;
  }
  
  generateTemplateVersions(templatePath: string): { content: string; staticContent: string } {
    // Mock template content
    const content = '# Dream Entry\n\nDate: <% tp.date.now() %>\n\nDream content: <% tp.file.selection() %>';
    const staticContent = this.convertToStaticTemplate(content);
    
    return { content, staticContent };
  }
}

/**
 * Register template system tests to the test runner
 * @param testRunner The test runner instance
 */
export function registerTemplateSystemTests(
  testRunner: TestRunner
): void {
  // Test: Basic template processing
  testRunner.addTest(
    'TemplateSystem - Should process non-Templater templates',
    async () => {
      const processor = new MockTemplateProcessor(false);
      
      const template: JournalTemplate = {
        id: 'test',
        name: 'Test Template',
        description: 'A test template',
        content: 'This is a static template',
        isTemplaterTemplate: false,
        structure: 'flat',
        // Add required properties
        isBuiltIn: false,
        lastModified: Date.now()
      };
      
      const result = await processor.processTemplate(template);
      
      return result === 'This is a static template';
    }
  );
  
  // Test: Templater fallback
  testRunner.addTest(
    'TemplateSystem - Should fall back to static content when Templater unavailable',
    async () => {
      const processor = new MockTemplateProcessor(false);
      
      const template: JournalTemplate = {
        id: 'test',
        name: 'Test Template',
        description: 'A test template',
        content: 'Date: <% tp.date.now() %>',
        staticContent: 'Date: [[placeholder:date]]',
        isTemplaterTemplate: true,
        structure: 'flat',
        // Add required properties
        isBuiltIn: false,
        lastModified: Date.now()
      };
      
      const result = await processor.processTemplate(template);
      
      return result === 'Date: [[placeholder:date]]';
    }
  );
  
  // Test: Templater processing
  testRunner.addTest(
    'TemplateSystem - Should process Templater templates when available',
    async () => {
      const processor = new MockTemplateProcessor(true);
      
      const template: JournalTemplate = {
        id: 'test',
        name: 'Test Template',
        description: 'A test template',
        content: 'Date: <% date %>\nUser: <% user %>',
        staticContent: 'Date: [[placeholder:date]]\nUser: [[placeholder:user]]',
        isTemplaterTemplate: true,
        structure: 'flat',
        // Add required properties
        isBuiltIn: false,
        lastModified: Date.now()
      };
      
      const data = {
        date: '2025-05-23',
        user: 'John'
      };
      
      const result = await processor.processTemplate(template, data);
      
      return (
        result === 'Date: 2025-05-23\nUser: John'
      );
    }
  );
  
  // Test: Variable extraction
  testRunner.addTest(
    'TemplateSystem - Should extract variables from Templater syntax',
    () => {
      const processor = new MockTemplateProcessor();
      
      const content = 'Date: <% tp.date.now() %>\nUser: <% tp.user.name %>';
      
      const variables = processor.extractTemplateVariables(content);
      
      return (
        variables.length === 2 &&
        variables[0].name === 'tp.date.now()' &&
        variables[1].name === 'tp.user.name'
      );
    }
  );
  
  // Test: Static template conversion
  testRunner.addTest(
    'TemplateSystem - Should convert Templater syntax to static placeholders',
    () => {
      const processor = new MockTemplateProcessor();
      
      const templaterContent = 'Date: <% tp.date.now() %>\nUser: <% tp.user.name %>';
      
      const staticContent = processor.convertToStaticTemplate(templaterContent);
      
      return (
        staticContent === 'Date: [[placeholder:tp.date.now()]]\nUser: [[placeholder:tp.user.name]]'
      );
    }
  );
  
  // Test: Templater syntax detection
  testRunner.addTest(
    'TemplateSystem - Should detect Templater syntax',
    () => {
      const processor = new MockTemplateProcessor();
      
      const results = [
        processor.hasTemplaterSyntax('Content with <% syntax %>') === true,
        processor.hasTemplaterSyntax('Content without syntax') === false
      ];
      
      return results.every(result => result === true);
    }
  );
  
  // Test: Template version generation
  testRunner.addTest(
    'TemplateSystem - Should generate dynamic and static versions',
    () => {
      const processor = new MockTemplateProcessor();
      
      const { content, staticContent } = processor.generateTemplateVersions('templates/test.md');
      
      return (
        content.includes('<% tp.date.now() %>') &&
        staticContent.includes('[[placeholder:tp.date.now()]]')
      );
    }
  );
} 