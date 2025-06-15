import { App, Modal, Setting, TextAreaComponent, DropdownComponent, ButtonComponent, Notice } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';
import { ContentParser, ContentParsingOptions } from '../../parsing/services/ContentParser';
import safeLogger from '../../logging/safe-logger';

/**
 * Modal for testing the ContentParser
 */
export class ContentParserTestModal extends Modal {
    private textArea: TextAreaComponent;
    private functionSelector: DropdownComponent;
    private optionsArea: HTMLElement;
    private resultsEl: HTMLElement;
    
    private contentParser: ContentParser;
    private parserFunctions: Record<string, Function> = {};
    private selectedFunction: string = 'parseContent';
    private input: string = '';
    private options: ContentParsingOptions = {
        calloutType: 'dream',
        validate: true,
        includeNested: false,
        sanitize: true
    };
    
    constructor(app: App, private plugin: DreamMetricsPlugin) {
        super(app);
        this.contentParser = new ContentParser();
        
        // Set up parser functions
        this.parserFunctions = {
            'parseContent': (content: string, options?: ContentParsingOptions) => 
                this.contentParser.parseContent(content, options?.calloutType, 'test-source.md', options),
            'extractDreamEntries': (content: string, options?: ContentParsingOptions) => 
                this.contentParser.extractDreamEntries(content, options?.calloutType, 'test-source.md', options),
            'cleanDreamContent': (content: string) => 
                this.contentParser.cleanDreamContent(content, this.options.calloutType || 'dream'),
            'extractTitle': (content: string) => 
                this.contentParser.extractTitle(content),
            'sanitizeContent': (content: string) => 
                this.contentParser.sanitizeContent(content)
        };
    }
    
    onOpen() {
        const { contentEl } = this;
        
        contentEl.addClass('oom-content-parser-test-modal');
        
        // Create header
        contentEl.createEl('h2', { text: 'Content Parser Test' });
        
        // Create description
        contentEl.createEl('p', { 
            text: 'Test content parsing functions with different inputs and see results.' 
        });
        
        // Create layout
        const container = contentEl.createDiv({ cls: 'oom-test-modal-container' });
        const leftPane = container.createDiv({ cls: 'oom-test-modal-content-pane' });
        const rightPane = container.createDiv({ cls: 'oom-test-modal-results-pane' });
        
        // Function selector
        const functionSection = leftPane.createDiv({ cls: 'oom-test-modal-function-section' });
        new Setting(functionSection)
            .setName('Function')
            .setDesc('Select a content parser function to test')
            .addDropdown(dropdown => {
                this.functionSelector = dropdown;
                
                for (const funcName of Object.keys(this.parserFunctions)) {
                    dropdown.addOption(funcName, funcName);
                }
                
                dropdown.setValue('parseContent');
                dropdown.onChange(value => {
                    this.selectedFunction = value;
                    this.updatePlaceholder();
                    this.updateOptionsVisibility();
                    this.runTest();
                });
            });
        
        // Options section
        const optionsSection = leftPane.createDiv({ cls: 'oom-test-modal-options-section' });
        optionsSection.createEl('h3', { text: 'Options' });
        this.optionsArea = optionsSection.createDiv({ cls: 'oom-test-modal-options' });
        
        // Create options UI
        this.createOptionsUI();
        
        // Create text area for input
        const inputSection = leftPane.createDiv({ cls: 'oom-test-modal-editor-section' });
        inputSection.createEl('h3', { text: 'Test Input' });
        
        this.textArea = new TextAreaComponent(inputSection)
            .setValue(this.input)
            .setPlaceholder('Enter test input here...')
            .onChange(value => {
                this.input = value;
                this.runTest();
            });
        
        // Set initial placeholder based on selected function
        this.updatePlaceholder();
        
        // Make the text area larger
        this.textArea.inputEl.classList.add('oom-test-textarea-large');
        
        // Sample inputs button
        new Setting(inputSection)
            .addButton(button => {
                button
                    .setButtonText('Insert Sample Input')
                    .onClick(() => {
                        this.textArea.setValue(this.getSampleInput());
                        this.input = this.textArea.getValue();
                        this.runTest();
                    });
            })
            .addButton(button => {
                button
                    .setButtonText('Clear')
                    .onClick(() => {
                        this.textArea.setValue('');
                        this.input = '';
                        this.runTest();
                    });
            });
        
        // Test actions
        const actionsSection = leftPane.createDiv({ cls: 'oom-test-modal-actions-section' });
        
        new Setting(actionsSection)
            .addButton(button => {
                button
                    .setButtonText('Run Test')
                    .setCta()
                    .onClick(() => {
                        this.runTest();
                    });
            })
            .addButton(button => {
                button
                    .setButtonText('Run All Tests')
                    .onClick(() => {
                        this.runAllTests();
                    });
            });
        
        // Results section
        rightPane.createEl('h3', { text: 'Test Results' });
        this.resultsEl = rightPane.createDiv({ cls: 'oom-test-modal-results' });
        
        // Initial test
        this.runTest();
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    /**
     * Create options UI based on selected function
     */
    private createOptionsUI() {
        this.optionsArea.empty();
        
        // Callout type option
        new Setting(this.optionsArea)
            .setName('Callout Type')
            .setDesc('The type of callout to look for')
            .addText(text => text
                .setValue(this.options.calloutType || 'dream')
                .onChange(value => {
                    this.options.calloutType = value;
                    this.runTest();
                }));
        
        // Validate option
        new Setting(this.optionsArea)
            .setName('Validate Entries')
            .setDesc('Whether to validate extracted entries')
            .addToggle(toggle => toggle
                .setValue(this.options.validate !== false)
                .onChange(value => {
                    this.options.validate = value;
                    this.runTest();
                }));
        
        // Include nested option
        new Setting(this.optionsArea)
            .setName('Include Nested Callouts')
            .setDesc('Whether to include nested callouts')
            .addToggle(toggle => toggle
                .setValue(this.options.includeNested === true)
                .onChange(value => {
                    this.options.includeNested = value;
                    this.runTest();
                }));
        
        // Sanitize option
        new Setting(this.optionsArea)
            .setName('Sanitize Content')
            .setDesc('Whether to sanitize content before parsing')
            .addToggle(toggle => toggle
                .setValue(this.options.sanitize !== false)
                .onChange(value => {
                    this.options.sanitize = value;
                    this.runTest();
                }));
    }
    
    /**
     * Update options visibility based on selected function
     */
    private updateOptionsVisibility() {
        // Only show options relevant to the selected function
        const optionsContainer = this.optionsArea.parentElement;
        if (!optionsContainer) return;
        
        const shouldShow = ['parseContent', 'extractDreamEntries'].includes(this.selectedFunction);
        optionsContainer.classList.toggle('oom-display-block', shouldShow);
        optionsContainer.classList.toggle('oom-display-none', !shouldShow);
    }
    
    /**
     * Update placeholder text based on selected function
     */
    private updatePlaceholder() {
        let placeholder = '';
        
        switch (this.selectedFunction) {
            case 'parseContent':
            case 'extractDreamEntries':
                placeholder = 'Enter markdown content with dream callouts\n\nExample:\n[!dream]\nThis is a dream entry.\nClarity: 7, Vividness: 8';
                break;
            case 'cleanDreamContent':
                placeholder = 'Enter dream callout content to clean\n\nExample:\n# Dream Title\nThis is the dream content.\nClarity: 7, Vividness: 8';
                break;
            case 'extractTitle':
                placeholder = 'Enter content to extract title from\n\nExample:\n# My Dream Title\nThis is the dream content.';
                break;
            case 'sanitizeContent':
                placeholder = 'Enter content to sanitize\n\nExample:\nThis content has unclosed tags [!dream\nor too many\n\n\n\nnewlines.';
                break;
            default:
                placeholder = 'Enter input for the selected function';
        }
        
        this.textArea.setPlaceholder(placeholder);
    }
    
    /**
     * Run the selected test with the current input
     */
    private runTest() {
        this.resultsEl.empty();
        
        if (!this.input) {
            this.resultsEl.createEl('p', { text: 'Enter input to run test' });
            return;
        }
        
        const func = this.parserFunctions[this.selectedFunction];
        if (!func) {
            this.resultsEl.createEl('p', { text: 'Invalid function selected' });
            return;
        }
        
        try {
            let result;
            const args = [this.input];
            
            // Apply options for functions that support them
            if (['parseContent', 'extractDreamEntries'].includes(this.selectedFunction)) {
                result = func(this.input, this.options);
            } else {
                result = func(this.input);
            }
            
            // Display the result
            this.renderTestResult(this.selectedFunction, args, result);
            
        } catch (error) {
            // Display the error
            this.renderError(error);
        }
    }
    
    /**
     * Run tests for all parser functions with sample inputs
     */
    private runAllTests() {
        this.resultsEl.empty();
        
        const allResults = this.resultsEl.createDiv({ cls: 'oom-all-test-results' });
        allResults.createEl('h4', { text: 'All Tests' });
        
        // Run tests for each function with sample inputs
        for (const funcName of Object.keys(this.parserFunctions)) {
            const funcSection = allResults.createDiv({ cls: 'oom-test-function-section' });
            funcSection.createEl('h5', { text: funcName });
            
            const resultsList = funcSection.createEl('ul');
            
            try {
                const func = this.parserFunctions[funcName];
                const sampleInput = this.getSampleInput(funcName);
                
                const listItem = resultsList.createEl('li');
                
                try {
                    let result;
                    if (['parseContent', 'extractDreamEntries'].includes(funcName)) {
                        // Use default options
                        const defaultOptions = {
                            calloutType: 'dream',
                            validate: true,
                            includeNested: false,
                            sanitize: true
                        };
                        result = func(sampleInput, defaultOptions);
                    } else {
                        result = func(sampleInput);
                    }
                    
                    listItem.innerHTML = `<strong>Result:</strong> ${this.formatValue(result)}`;
                } catch (error) {
                    listItem.innerHTML = `<strong>Error:</strong> <span class="error">${error.message}</span>`;
                }
            } catch (error) {
                funcSection.createEl('p', { 
                    text: `Error running tests: ${error.message}`,
                    cls: 'error'
                });
            }
        }
        
        // Show a notice that all tests were run
        new Notice('All content parser tests completed');
    }
    
    /**
     * Format a value for display
     */
    private formatValue(value: any): string {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        
        if (value instanceof Date) {
            if (isNaN(value.getTime())) {
                return 'Invalid Date';
            }
            return `Date(${value.toISOString()})`;
        }
        
        if (typeof value === 'object') {
            try {
                // Attempt to pretty-print JSON with 2-space indentation
                return `<pre>${JSON.stringify(value, null, 2)}</pre>`;
            } catch (e) {
                return String(value);
            }
        }
        
        if (typeof value === 'string') {
            return `"${value}"`;
        }
        
        return String(value);
    }
    
    /**
     * Render test result
     */
    private renderTestResult(functionName: string, args: any[], result: any) {
        this.resultsEl.empty();
        
        const resultContainer = this.resultsEl.createDiv({ cls: 'oom-test-result-container' });
        
        // Function call
        let callSignature = `${functionName}(${args.map(arg => 
            typeof arg === 'string' ? '"[content]"' : String(arg)
        ).join(', ')}`;
        
        // Add options to call signature if applicable
        if (['parseContent', 'extractDreamEntries'].includes(functionName)) {
            callSignature += `, ${JSON.stringify(this.options)}`;
        }
        callSignature += ')';
        
        resultContainer.createEl('div', { 
            text: 'Function Call:',
            cls: 'oom-result-label'
        });
        resultContainer.createEl('pre', { 
            text: callSignature,
            cls: 'oom-function-call'
        });
        
        // Result
        resultContainer.createEl('div', { 
            text: 'Result:',
            cls: 'oom-result-label'
        });
        
        const resultEl = resultContainer.createDiv({ cls: 'oom-function-result' });
        resultEl.innerHTML = this.formatValue(result);
        
        // Result details for specific types
        if (result && typeof result === 'object') {
            const detailsContainer = resultContainer.createDiv({ cls: 'oom-result-details' });
            
            // For dream entries, show count and details
            if (Array.isArray(result) && functionName === 'extractDreamEntries') {
                detailsContainer.createEl('div', {
                    text: `Found ${result.length} dream entries`,
                    cls: 'oom-result-summary'
                });
                
                // For each entry, show key details
                if (result.length > 0) {
                    const entriesList = detailsContainer.createEl('ul', {
                        cls: 'oom-entries-list'
                    });
                    
                    for (const entry of result) {
                        const item = entriesList.createEl('li');
                        item.innerHTML = `
                            <strong>Date:</strong> ${entry.date || 'Unknown'}<br>
                            <strong>Title:</strong> ${entry.title || 'Untitled'}<br>
                            <strong>Word Count:</strong> ${entry.wordCount || 0}<br>
                            <strong>Metrics:</strong> ${Object.keys(entry.metrics || {}).length} metrics
                        `;
                    }
                }
            }
            
            // For parseContent results, show metadata
            if (result.metadata && functionName === 'parseContent') {
                detailsContainer.createEl('div', {
                    text: 'Metadata Summary:',
                    cls: 'oom-result-subtitle'
                });
                
                const metadataList = detailsContainer.createEl('ul');
                for (const [key, value] of Object.entries(result.metadata)) {
                    metadataList.createEl('li', {
                        text: `${key}: ${value}`
                    });
                }
            }
        }
    }
    
    /**
     * Render an error
     */
    private renderError(error: Error) {
        this.resultsEl.empty();
        
        const errorContainer = this.resultsEl.createDiv({ cls: 'oom-test-error-container' });
        
        errorContainer.createEl('div', { 
            text: 'Error:',
            cls: 'oom-result-label'
        });
        errorContainer.createEl('pre', { 
            text: error.message,
            cls: 'oom-function-error'
        });
        
        if (error.stack) {
            errorContainer.createEl('div', { 
                text: 'Stack:',
                cls: 'oom-result-label'
            });
            errorContainer.createEl('pre', { 
                text: error.stack,
                cls: 'oom-error-stack'
            });
        }
    }
    
    /**
     * Get sample input for the selected function
     */
    private getSampleInput(specificFunction?: string): string {
        const funcName = specificFunction || this.selectedFunction;
        
        switch (funcName) {
            case 'parseContent':
            case 'extractDreamEntries':
                return `# Dream Journal Entry

[!dream] My Dream
I was flying over a vast ocean. The water below was crystal clear, and I could see schools of colorful fish swimming.

Clarity: 8
Vividness: 9

[!dream] Another Dream
I was in a strange house with many rooms. Each room had a different theme and color scheme.

Clarity: 6
Vividness: 7`;
            
            case 'cleanDreamContent':
                return `# Flying Dream
I was flying over a vast ocean. The water below was crystal clear.

Clarity: 8
Vividness: 9`;
            
            case 'extractTitle':
                return `# The Flying Dream
I was flying over a vast ocean. The water below was crystal clear.`;
            
            case 'sanitizeContent':
                return `This content has an unclosed callout [!dream
And too many


newlines.`;
            
            default:
                return '';
        }
    }
} 