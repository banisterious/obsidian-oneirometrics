import { App, Modal, Setting, MarkdownRenderer, TextAreaComponent, DropdownComponent, ButtonComponent, Notice } from 'obsidian';
import { LintingEngine } from '../LintingEngine';
import { JournalTemplate, ValidationResult } from '../types';

/**
 * Modal for testing journal entry validation
 */
export class TestModal extends Modal {
    private lintingEngine: LintingEngine;
    private textArea: TextAreaComponent;
    private templateSelector: DropdownComponent;
    private resultsEl: HTMLElement;
    private templates: JournalTemplate[] = [];
    private selectedTemplateId: string | null = null;
    private content: string = '';
    private results: ValidationResult[] = [];
    
    constructor(app: App, private plugin: any) {
        super(app);
        this.lintingEngine = plugin.lintingEngine;
        this.templates = plugin.settings.linting.templates;
    }
    
    onOpen() {
        const { contentEl } = this;
        
        contentEl.addClass('dream-journal-test-modal');
        
        // Create header
        contentEl.createEl('h2', { text: 'Journal Structure Test' });
        
        // Create description
        contentEl.createEl('p', { 
            text: 'Test your journal entry against validation rules. Enter content below and see validation results.' 
        });
        
        // Create layout
        const container = contentEl.createDiv({ cls: 'test-modal-container' });
        const leftPane = container.createDiv({ cls: 'test-modal-content-pane' });
        const rightPane = container.createDiv({ cls: 'test-modal-results-pane' });
        
        // Template selector
        const templateSection = leftPane.createDiv({ cls: 'test-modal-template-section' });
        new Setting(templateSection)
            .setName('Template')
            .setDesc('Select a journal template to validate against')
            .addDropdown(dropdown => {
                this.templateSelector = dropdown;
                
                dropdown.addOption('', 'Auto-detect');
                for (const template of this.templates) {
                    dropdown.addOption(template.id, template.name);
                }
                
                dropdown.onChange(value => {
                    this.selectedTemplateId = value || null;
                    this.validate();
                });
            });
        
        // Create text area for content
        const contentSection = leftPane.createDiv({ cls: 'test-modal-editor-section' });
        contentSection.createEl('h3', { text: 'Journal Content' });
        
        this.textArea = new TextAreaComponent(contentSection)
            .setValue(this.content)
            .setPlaceholder('Enter your journal content here...')
            .onChange(value => {
                this.content = value;
                this.validate();
            });
        
        // Make the text area larger
        this.textArea.inputEl.style.height = '300px';
        this.textArea.inputEl.style.width = '100%';
        
        // Sample content button
        new Setting(contentSection)
            .addButton(button => {
                button
                    .setButtonText('Insert Sample Content')
                    .onClick(() => {
                        this.textArea.setValue(this.getSampleContent());
                        this.content = this.textArea.getValue();
                        this.validate();
                    });
            })
            .addButton(button => {
                button
                    .setButtonText('Clear')
                    .onClick(() => {
                        this.textArea.setValue('');
                        this.content = '';
                        this.validate();
                    });
            });
        
        // Test actions
        const actionsSection = leftPane.createDiv({ cls: 'test-modal-actions-section' });
        
        new Setting(actionsSection)
            .addButton(button => {
                button
                    .setButtonText('Validate')
                    .setCta()
                    .onClick(() => {
                        this.validate();
                    });
            });
        
        // Results section
        rightPane.createEl('h3', { text: 'Validation Results' });
        this.resultsEl = rightPane.createDiv({ cls: 'test-modal-results' });
        
        // Initial validation
        this.validate();
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    /**
     * Validate the current content
     */
    private validate() {
        if (!this.content) {
            this.results = [];
            this.renderResults();
            return;
        }
        
        // Add visual feedback when validating
        const validateButton = document.querySelector('.test-modal-actions-section button') as HTMLElement;
        if (validateButton) {
            // Add a temporary class for animation
            validateButton.classList.add('validating');
            validateButton.textContent = 'Validating...';
            
            // Remove the class after a short delay
            setTimeout(() => {
                validateButton.classList.remove('validating');
                validateButton.textContent = 'Validate';
            }, 500);
        }
        
        this.results = this.lintingEngine.validate(this.content, this.selectedTemplateId || undefined);
        this.renderResults();
        
        // Show a notice that validation was performed
        new Notice(`Validation complete: ${this.results.length === 0 ? 'No issues found!' : `${this.results.length} issues found`}`);
        
        // Highlight the results pane
        const resultsPane = document.querySelector('.test-modal-results-pane') as HTMLElement;
        if (resultsPane) {
            resultsPane.classList.add('highlight-pane');
            setTimeout(() => {
                resultsPane.classList.remove('highlight-pane');
            }, 1000);
        }
    }
    
    /**
     * Render validation results
     */
    private renderResults() {
        this.resultsEl.empty();
        
        if (this.results.length === 0) {
            this.resultsEl.createEl('p', { 
                text: this.content ? 'No issues found! 🎉' : 'Enter content to validate' 
            });
            return;
        }
        
        // Count issues by severity
        const errorCount = this.results.filter(r => r.severity === 'error').length;
        const warningCount = this.results.filter(r => r.severity === 'warning').length;
        const infoCount = this.results.filter(r => r.severity === 'info').length;
        
        // Create summary
        const summaryEl = this.resultsEl.createDiv({ cls: 'validation-summary' });
        summaryEl.createEl('h4', { text: 'Summary' });
        
        const summaryList = summaryEl.createEl('ul');
        if (errorCount > 0) {
            summaryList.createEl('li', { 
                text: `Errors: ${errorCount}`,
                cls: 'validation-error'
            });
        }
        if (warningCount > 0) {
            summaryList.createEl('li', { 
                text: `Warnings: ${warningCount}`,
                cls: 'validation-warning'
            });
        }
        if (infoCount > 0) {
            summaryList.createEl('li', { 
                text: `Info: ${infoCount}`,
                cls: 'validation-info'
            });
        }
        
        // Create detailed results
        const detailsEl = this.resultsEl.createDiv({ cls: 'validation-details' });
        detailsEl.createEl('h4', { text: 'Details' });
        
        // Group results by severity
        const errors = this.results.filter(r => r.severity === 'error');
        const warnings = this.results.filter(r => r.severity === 'warning');
        const infos = this.results.filter(r => r.severity === 'info');
        
        // Add all results in order of severity
        for (const result of [...errors, ...warnings, ...infos]) {
            this.createResultItem(detailsEl, result);
        }
    }
    
    /**
     * Create a result item in the UI
     */
    private createResultItem(container: HTMLElement, result: ValidationResult) {
        const itemEl = container.createDiv({ cls: `validation-item validation-${result.severity}` });
        
        // Create header with message and severity
        const headerEl = itemEl.createDiv({ cls: 'validation-item-header' });
        
        // Add severity indicator
        const severityIndicator = headerEl.createSpan({ cls: `validation-item-severity validation-${result.severity}` });
        severityIndicator.innerHTML = result.severity === 'error' 
            ? '❌' 
            : result.severity === 'warning' 
                ? '⚠️' 
                : 'ℹ️';
        
        // Add message
        headerEl.createSpan({ 
            text: result.message,
            cls: 'validation-item-message'
        });
        
        // Add location if available
        const locationString = `Line ${result.position.start.line}`;
        headerEl.createSpan({ 
            text: locationString,
            cls: 'validation-item-location'
        });
        
        // Add quick fixes if available
        if (result.quickFixes && result.quickFixes.length > 0) {
            const fixesEl = itemEl.createDiv({ cls: 'validation-item-fixes' });
            
            for (const fix of result.quickFixes) {
                new ButtonComponent(fixesEl)
                    .setButtonText(`🔧 ${fix.title}`)
                    .onClick(() => {
                        // Apply the quick fix
                        const fixedContent = fix.action(this.content);
                        
                        // Update content
                        this.content = fixedContent;
                        this.textArea.setValue(fixedContent);
                        
                        // Re-validate
                        this.validate();
                    });
            }
        }
    }
    
    /**
     * Get sample content for testing
     */
    private getSampleContent(): string {
        // If template is selected, use that
        if (this.selectedTemplateId) {
            const template = this.templates.find(t => t.id === this.selectedTemplateId);
            if (template) {
                return template.content;
            }
        }
        
        // Otherwise use a generic sample with nested formatting
        return `# Dream Journal Entry

> [!dream]
> Last night I dreamed I was flying over a vast city. The buildings were made of crystal and glowed with an inner light. I could feel the wind rushing past me as I soared between towers. 
> 
> It felt incredibly liberating and joyful.
>
>> [!symbols]
>> - Flying: Freedom, overcoming limitations
>> - Crystal buildings: Clarity, transparency
>> - Wind: Change, movement
>
>> [!reflections]
>> This dream came after a day where I felt stuck on a problem at work. The feeling of freedom in the dream contrasts with my waking feelings of being trapped.
>
>> [!interpretation]
>> What might this dream mean?
>
>> [!metrics]
>> Sensory Detail: 1-5
>> Emotional Recall: 1-5
>> Lost Segments: 0-10
>> Descriptiveness: 1-5
>> Confidence Score: 1-5
>> Characters Role: 1-5
`;
    }
} 