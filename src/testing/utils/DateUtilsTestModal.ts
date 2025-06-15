import { App, Modal, Setting, TextAreaComponent, DropdownComponent, ButtonComponent, Notice } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';
import { 
    parseDate, 
    formatDate, 
    validateDate, 
    isSameDay,
    getStartOfDay, 
    getEndOfDay, 
    safeDateOrDefault,
    formatDateKey,
    parseDateKey,
    getDreamEntryDate
} from '../../utils/date-utils';
import safeLogger from '../../logging/safe-logger';

/**
 * Modal for testing date utilities
 */
export class DateUtilsTestModal extends Modal {
    private textArea: TextAreaComponent;
    private functionSelector: DropdownComponent;
    private resultsEl: HTMLElement;
    private dateFunctions: Record<string, Function> = {
        'parseDate': parseDate,
        'formatDate': formatDate,
        'validateDate': validateDate,
        'isSameDay': isSameDay,
        'getStartOfDay': getStartOfDay,
        'getEndOfDay': getEndOfDay,
        'safeDateOrDefault': safeDateOrDefault,
        'formatDateKey': formatDateKey,
        'parseDateKey': parseDateKey,
        'getDreamEntryDate': getDreamEntryDate
    };
    private selectedFunction: string = 'parseDate';
    private input: string = '';
    
    constructor(app: App, private plugin: DreamMetricsPlugin) {
        super(app);
    }
    
    onOpen() {
        const { contentEl } = this;
        
        contentEl.addClass('oom-date-utils-test-modal');
        
        // Create header
        contentEl.createEl('h2', { text: 'Date Utilities Test' });
        
        // Create description
        contentEl.createEl('p', { 
            text: 'Test date utility functions with different inputs and see results.' 
        });
        
        // Create layout
        const container = contentEl.createDiv({ cls: 'oom-test-modal-container' });
        const leftPane = container.createDiv({ cls: 'oom-test-modal-content-pane' });
        const rightPane = container.createDiv({ cls: 'oom-test-modal-results-pane' });
        
        // Function selector
        const functionSection = leftPane.createDiv({ cls: 'oom-test-modal-function-section' });
        new Setting(functionSection)
            .setName('Function')
            .setDesc('Select a date utility function to test')
            .addDropdown(dropdown => {
                this.functionSelector = dropdown;
                
                for (const funcName of Object.keys(this.dateFunctions)) {
                    dropdown.addOption(funcName, funcName);
                }
                
                dropdown.setValue('parseDate');
                dropdown.onChange(value => {
                    this.selectedFunction = value;
                    this.updatePlaceholder();
                    this.runTest();
                });
            });
        
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
        this.textArea.inputEl.classList.add('oom-test-textarea-medium');
        
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
     * Update placeholder text based on selected function
     */
    private updatePlaceholder() {
        let placeholder = '';
        
        switch (this.selectedFunction) {
            case 'parseDate':
                placeholder = 'Enter a date string to parse\nExamples:\n2025-05-15\n^20250515\n[!journal-entry|20250520]\nMonday, January 6, 2025';
                break;
            case 'formatDate':
                placeholder = 'Enter a date object or date string and optional format\nExamples:\n2025-05-15\n2025-05-15, yyyy-MM-dd';
                break;
            case 'validateDate':
                placeholder = 'Enter a date object or date string to validate\nExamples:\n2025-05-15\n1800-01-01';
                break;
            case 'isSameDay':
                placeholder = 'Enter two dates separated by a comma\nExample:\n2025-05-15, 2025-05-15T12:30:00';
                break;
            case 'getStartOfDay':
            case 'getEndOfDay':
                placeholder = 'Enter a date to get start/end of day\nExample:\n2025-05-15T12:30:00';
                break;
            case 'safeDateOrDefault':
                placeholder = 'Enter a date or invalid value, and optional default date\nExamples:\ninvalid-date\ninvalid-date, 2000-01-01';
                break;
            case 'formatDateKey':
                placeholder = 'Enter a date to format as a key\nExample:\n2025-05-15T12:30:00';
                break;
            case 'parseDateKey':
                placeholder = 'Enter a date key to parse\nExample:\n2025-05-15';
                break;
            case 'getDreamEntryDate':
                placeholder = 'Enter journal lines, file path, and file content separated by | pipes\nExamples:\n[!journal] January 6, 2025|test.md|Full file content\n[!dream-diary] Dream title ^20250106|test.md|Content\nDate: 2025-01-06|test.md|Field format content';
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
        
        const func = this.dateFunctions[this.selectedFunction];
        if (!func) {
            this.resultsEl.createEl('p', { text: 'Invalid function selected' });
            return;
        }
        
        try {
            // Parse input based on function requirements
            let result;
            let args = [];
            
            switch (this.selectedFunction) {
                case 'parseDate':
                case 'validateDate':
                case 'getStartOfDay':
                case 'getEndOfDay':
                case 'formatDateKey':
                case 'parseDateKey':
                    // These functions take a single input
                    args = [this.input];
                    result = func(this.input);
                    break;
                
                case 'getDreamEntryDate':
                    // getDreamEntryDate takes (journalLines, filePath, fileContent, dateHandling)
                    if (this.input.includes('|')) {
                        const parts = this.input.split('|').map(s => s.trim());
                        if (parts.length >= 3) {
                            const journalLines = [parts[0]];
                            const filePath = parts[1];
                            const fileContent = parts[2];
                            // Optional 4th parameter for dateHandling config
                            const dateHandling = parts[3] ? JSON.parse(parts[3]) : undefined;
                            args = [journalLines, filePath, fileContent, dateHandling];
                            result = func(journalLines, filePath, fileContent, dateHandling);
                        } else {
                            throw new Error('getDreamEntryDate requires: journalLines|filePath|fileContent[|dateHandling]');
                        }
                    } else {
                        // Treat as single journal line with defaults
                        args = [[this.input], 'test.md', this.input];
                        result = func([this.input], 'test.md', this.input);
                    }
                    break;
                
                case 'formatDate':
                    // Format date can take a second format parameter
                    if (this.input.includes(',')) {
                        const [dateStr, formatStr] = this.input.split(',').map(s => s.trim());
                        args = [dateStr, formatStr];
                        const dateObj = this.parseInputAsDate(dateStr);
                        result = func(dateObj, formatStr);
                    } else {
                        args = [this.input];
                        const dateObj = this.parseInputAsDate(this.input);
                        result = func(dateObj);
                    }
                    break;
                
                case 'isSameDay':
                    // isSameDay takes two date parameters
                    if (this.input.includes(',')) {
                        const [date1Str, date2Str] = this.input.split(',').map(s => s.trim());
                        args = [date1Str, date2Str];
                        const date1 = this.parseInputAsDate(date1Str);
                        const date2 = this.parseInputAsDate(date2Str);
                        result = func(date1, date2);
                    } else {
                        args = [this.input, this.input]; // Same date twice
                        const date = this.parseInputAsDate(this.input);
                        result = func(date, date);
                    }
                    break;
                
                case 'safeDateOrDefault':
                    // safeDateOrDefault can take a second default date parameter
                    if (this.input.includes(',')) {
                        const [dateStr, defaultDateStr] = this.input.split(',').map(s => s.trim());
                        args = [dateStr, defaultDateStr];
                        const defaultDate = this.parseInputAsDate(defaultDateStr);
                        result = func(dateStr, defaultDate);
                    } else {
                        args = [this.input];
                        result = func(this.input);
                    }
                    break;
                
                default:
                    args = [this.input];
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
     * Run all date utility tests with sample inputs
     */
    private runAllTests() {
        this.resultsEl.empty();
        
        const allResults = this.resultsEl.createDiv({ cls: 'oom-all-test-results' });
        allResults.createEl('h4', { text: 'All Tests' });
        
        // Run tests for each function with sample inputs
        for (const funcName of Object.keys(this.dateFunctions)) {
            const funcSection = allResults.createDiv({ cls: 'oom-test-function-section' });
            funcSection.createEl('h5', { text: funcName });
            
            const resultsList = funcSection.createEl('ul');
            
            try {
                const func = this.dateFunctions[funcName];
                let testInputs: any[] = [];
                
                // Get appropriate test inputs for each function
                switch (funcName) {
                    case 'parseDate':
                        testInputs = [
                            '2025-05-15',
                            '^20250515',
                            '[!journal-entry|20250520]',
                            'Monday, January 6, 2025',
                            'invalid-date',
                            null,
                            ''
                        ];
                        break;
                    
                    case 'getDreamEntryDate':
                        testInputs = [
                            [['[!journal] January 6, 2025'], 'test.md', 'Content'],
                            [['[!dream-diary] Dream title ^20250106'], 'test.md', 'Content'],
                            [['Date: 2025-01-06'], 'test.md', 'Content'],
                            [['Monday, January 6, 2025'], 'test.md', 'Content'],
                            [['No date content'], 'test.md', 'Content']
                        ];
                        break;
                    
                    case 'formatDate':
                        testInputs = [
                            new Date(2025, 4, 15),
                            [new Date(2025, 4, 15), 'yyyy-MM-dd'],
                            null
                        ];
                        break;
                    
                    case 'validateDate':
                        testInputs = [
                            new Date(2025, 4, 15),
                            new Date(1800, 0, 1),
                            new Date('invalid'),
                            null
                        ];
                        break;
                    
                    case 'isSameDay':
                        testInputs = [
                            [new Date(2025, 4, 15, 9, 30), new Date(2025, 4, 15, 14, 45)],
                            [new Date(2025, 4, 15), new Date(2025, 4, 16)],
                            [new Date(2025, 4, 15), null]
                        ];
                        break;
                    
                    case 'getStartOfDay':
                    case 'getEndOfDay':
                        testInputs = [
                            new Date(2025, 4, 15, 12, 30),
                            null
                        ];
                        break;
                    
                    case 'safeDateOrDefault':
                        testInputs = [
                            '2025-05-15',
                            'invalid-date',
                            ['invalid-date', new Date(2000, 0, 1)],
                            null
                        ];
                        break;
                    
                    case 'formatDateKey':
                    case 'parseDateKey':
                        testInputs = [
                            '2025-05-15',
                            new Date(2025, 4, 15),
                            null
                        ];
                        break;
                }
                
                // Run tests for each input
                for (const input of testInputs) {
                    const listItem = resultsList.createEl('li');
                    
                    try {
                        let result;
                        let displayInput;
                        
                        if (Array.isArray(input)) {
                            displayInput = input.map(i => this.formatValue(i)).join(', ');
                            result = func(...input);
                        } else {
                            displayInput = this.formatValue(input);
                            result = func(input);
                        }
                        
                        listItem.innerHTML = `<strong>${displayInput}</strong> → ${this.formatValue(result)}`;
                    } catch (error) {
                        listItem.innerHTML = `<strong>${this.formatValue(input)}</strong> → <span class="error">Error: ${error.message}</span>`;
                    }
                }
            } catch (error) {
                funcSection.createEl('p', { 
                    text: `Error running tests: ${error.message}`,
                    cls: 'error'
                });
            }
        }
        
        // Show a notice that all tests were run
        new Notice('All date utility tests completed');
    }
    
    /**
     * Parse input as a date based on the type
     */
    private parseInputAsDate(input: any): Date | null {
        if (!input) return null;
        
        if (input instanceof Date) {
            return input;
        }
        
        if (typeof input === 'string') {
            try {
                // First try parsing with parseDate utility
                const parsedDate = parseDate(input);
                if (parsedDate) return parsedDate;
                
                // Fall back to direct Date constructor
                const directDate = new Date(input);
                if (!isNaN(directDate.getTime())) return directDate;
            } catch (error) {
                // Handle error
                safeLogger.warn('DateUtils', `Failed to parse input as date: ${input}`, error instanceof Error ? error : new Error(String(error)));
            }
        }
        
        return null;
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
            return JSON.stringify(value);
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
        const callSignature = `${functionName}(${args.map(arg => this.formatValue(arg)).join(', ')})`;
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
        resultContainer.createEl('pre', { 
            text: this.formatValue(result),
            cls: 'oom-function-result'
        });
        
        // Result type
        resultContainer.createEl('div', { 
            text: 'Result Type:',
            cls: 'oom-result-label'
        });
        resultContainer.createEl('div', { 
            text: result === null ? 'null' : typeof result,
            cls: 'oom-result-type'
        });
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
    private getSampleInput(): string {
        switch (this.selectedFunction) {
            case 'parseDate':
                return '2025-05-15';
            case 'formatDate':
                return '2025-05-15, yyyy-MM-dd';
            case 'validateDate':
                return '2025-05-15';
            case 'isSameDay':
                return '2025-05-15, 2025-05-15T12:30:00';
            case 'getStartOfDay':
            case 'getEndOfDay':
                return '2025-05-15T12:30:00';
            case 'safeDateOrDefault':
                return 'invalid-date, 2000-01-01';
            case 'formatDateKey':
                return '2025-05-15';
            case 'parseDateKey':
                return '2025-05-15';
            case 'getDreamEntryDate':
                return '[!journal] January 6, 2025|test.md|Full file content with journal entry';
            default:
                return '';
        }
    }
} 