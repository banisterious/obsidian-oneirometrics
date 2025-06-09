import { App, Modal, Setting, MarkdownRenderer, TextAreaComponent, DropdownComponent, ButtonComponent, Notice } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
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
        
        contentEl.addClass('oom-dream-journal-test-modal');
        
        // Create header
        contentEl.createEl('h2', { text: 'Journal Structure Test' });
        
        // Create description
        contentEl.createEl('p', { 
            text: 'Test your journal entry against validation rules. Enter content below and see validation results.' 
        });
        
        // Create layout
        const container = contentEl.createDiv({ cls: 'oom-test-modal-container' });
        const leftPane = container.createDiv({ cls: 'oom-test-modal-content-pane' });
        const rightPane = container.createDiv({ cls: 'oom-test-modal-results-pane' });
        
        // Template selector
        const templateSection = leftPane.createDiv({ cls: 'oom-test-modal-template-section' });
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
        const contentSection = leftPane.createDiv({ cls: 'oom-test-modal-editor-section' });
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
        const actionsSection = leftPane.createDiv({ cls: 'oom-test-modal-actions-section' });
        
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
        this.resultsEl = rightPane.createDiv({ cls: 'oom-test-modal-results' });
        
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
        const validateButton = document.querySelector('.oom-test-modal-actions-section button') as HTMLElement;
        if (validateButton) {
            // Add a temporary class for animation
            validateButton.classList.add('oom-validating');
            validateButton.textContent = 'Validating...';
            
            // Remove the class after a short delay
            setTimeout(() => {
                validateButton.classList.remove('oom-validating');
                validateButton.textContent = 'Validate';
            }, 500);
        }
        
        this.results = this.lintingEngine.validate(this.content, this.selectedTemplateId || undefined);
        this.renderResults();
        
        // Show a notice that validation was performed
        new Notice(`Validation complete: ${this.results.length === 0 ? 'No issues found!' : `${this.results.length} issues found`}`);
        
        // Highlight the results pane
        const resultsPane = document.querySelector('.oom-test-modal-results-pane') as HTMLElement;
        if (resultsPane) {
            resultsPane.classList.add('oom-highlight-pane');
            setTimeout(() => {
                resultsPane.classList.remove('oom-highlight-pane');
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
        const summaryEl = this.resultsEl.createDiv({ cls: 'oom-validation-summary' });
        summaryEl.createEl('h4', { text: 'Summary' });
        
        const summaryList = summaryEl.createEl('ul');
        if (errorCount > 0) {
            summaryList.createEl('li', { 
                text: `Errors: ${errorCount}`,
                cls: 'oom-validation-error u-state--error'
            });
        }
        if (warningCount > 0) {
            summaryList.createEl('li', { 
                text: `Warnings: ${warningCount}`,
                cls: 'oom-validation-warning'
            });
        }
        if (infoCount > 0) {
            summaryList.createEl('li', { 
                text: `Info: ${infoCount}`,
                cls: 'oom-validation-info'
            });
        }
        
        // Create detailed results
        const detailsEl = this.resultsEl.createDiv({ cls: 'oom-validation-details' });
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
        const itemEl = container.createDiv({ cls: `oom-validation-item oom-validation-${result.severity}` });
        
        // Create header with message and severity
        const headerEl = itemEl.createDiv({ cls: 'oom-validation-item-header' });
        
        // Add severity indicator
        const severityIndicator = headerEl.createSpan({ cls: `oom-validation-item-severity oom-validation-${result.severity}` });
        severityIndicator.innerHTML = result.severity === 'error' 
            ? '❌' 
            : result.severity === 'warning' 
                ? '⚠️' 
                : 'ℹ️';
        
        // Add message
        headerEl.createSpan({ 
            text: result.message,
            cls: 'oom-validation-item-message'
        });
        
        // Add location if available
        const locationString = `Line ${result.position.start.line}`;
        headerEl.createSpan({ 
            text: locationString,
            cls: 'oom-validation-item-location'
        });
        
        // Add rule description if available
        if (result.rule?.description) {
            itemEl.createDiv({
                text: result.rule.description
            });
        }
        
        // Add quick fixes if available
        if (result.quickFixes && result.quickFixes.length > 0) {
            const fixesContainer = itemEl.createDiv({ cls: 'oom-validation-item-fixes' });
            
            for (const fix of result.quickFixes) {
                const fixButton = fixesContainer.createEl('button', {
                    text: fix.title,
                    cls: 'mod-cta'
                });
                
                fixButton.addEventListener('click', () => {
                    // Apply the fix
                    this.content = fix.action(this.content);
                    
                    // Update the text area
                    this.textArea.setValue(this.content);
                    
                    // Validate again
                    this.validate();
                    
                    // Show a notice
                    new Notice(`Applied fix: ${fix.title}`);
                });
            }
        }
    }
    
    /**
     * Get sample content for the test modal
     */
    private getSampleContent(): string {
        return `# Dream Journal Entry

> [!dream]
> I was flying through a vast, colorful world filled with floating islands. Each island had its own unique environment, from lush forests to crystalline caves. I could control my flight with just a thought, soaring higher or diving down at will.
> 
> At one point, I landed on an island with a strange tower made of books. Inside, I found a library where the books would speak to me when touched. They were telling stories of other dreamers who had visited before.

> [!symbols]
> - Flying: Freedom, transcending limitations
> - Islands: Isolated aspects of myself
> - Library of speaking books: Collective unconscious, ancestral memory

> [!reflections]
> This dream felt incredibly vivid and liberating. The sensation of flight was so realistic that I could feel the wind rushing past. The speaking books seemed to be trying to tell me something important about connecting with others through shared experiences.

> [!interpretation]
> I think this dream reflects my current desire for freedom from daily constraints and a longing to connect with something larger than myself. The islands might represent different facets of my personality that I'm exploring.

> [!metrics]
> Clarity: 9
> Vividness: 10
> Coherence: 7
> Emotional Intensity: 8
> Recall Detail: 9`;
    }
} 