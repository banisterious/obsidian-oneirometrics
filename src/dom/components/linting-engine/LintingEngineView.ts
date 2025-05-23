import { CalloutStructure, ValidationResult } from '../../../journal_check/types';
import { LintingEngineViewProps } from './LintingEngineTypes';

/**
 * View component for the LintingEngine
 * Handles UI rendering and DOM interactions
 */
export class LintingEngineView {
    private containerEl: HTMLElement;
    private contentEl: HTMLElement;
    private resultsList: HTMLElement;
    private templateSelect: HTMLSelectElement;
    private validationButtons: HTMLElement;
    private structureInfoEl: HTMLElement;
    private loadingEl: HTMLElement;
    private emptyStateEl: HTMLElement;

    constructor(containerEl: HTMLElement, private props: LintingEngineViewProps) {
        this.containerEl = containerEl;
        this.containerEl.addClass('oom-linting-engine');
        
        this.render();
    }

    /**
     * Update the view with new props
     */
    public update(props: LintingEngineViewProps): void {
        this.props = props;
        
        // Update template selection
        if (this.templateSelect) {
            this.templateSelect.value = this.props.templateId || '';
        }
        
        // Update structure info display
        this.updateStructureInfo();
        
        // Update validation results
        this.updateValidationResults();
        
        // Update loading state
        this.toggleLoading(this.props.isValidating);
    }
    
    /**
     * Clean up resources on view destruction
     */
    public destroy(): void {
        this.containerEl.empty();
    }

    /**
     * Render the initial UI
     */
    private render(): void {
        this.containerEl.empty();
        
        // Create main sections
        this.contentEl = this.containerEl.createDiv('oom-linting-engine-content');
        
        // Create header
        const header = this.contentEl.createDiv('oom-linting-engine-header');
        header.createEl('h2', { text: 'Journal Structure Validation' });
        
        // Create file info
        const fileInfo = this.contentEl.createDiv('oom-linting-engine-file-info');
        if (this.props.currentFilePath) {
            fileInfo.createEl('div', { 
                text: `Current file: ${this.props.currentFilePath}`,
                cls: 'oom-linting-engine-file-path'
            });
        } else {
            fileInfo.createEl('div', { 
                text: 'No file selected',
                cls: 'oom-linting-engine-file-path oom-linting-engine-no-file'
            });
        }
        
        // Create template selector
        const templateSection = this.contentEl.createDiv('oom-linting-engine-template-section');
        templateSection.createEl('label', { 
            text: 'Structure Template:',
            attr: { for: 'oom-template-select' }
        });
        
        this.templateSelect = templateSection.createEl('select', {
            cls: 'oom-linting-engine-template-select',
            attr: { id: 'oom-template-select' }
        });
        
        // Add auto-detect option
        const autoOption = this.templateSelect.createEl('option', {
            text: 'Auto-detect',
            value: ''
        });
        
        // Add template options
        this.props.availableTemplates.forEach(template => {
            const option = this.templateSelect.createEl('option', {
                text: template.name,
                value: template.id
            });
            
            if (this.props.templateId === template.id) {
                option.selected = true;
            }
        });
        
        // Set initial selection
        if (this.props.templateId) {
            this.templateSelect.value = this.props.templateId;
        } else {
            autoOption.selected = true;
        }
        
        // Add template change listener
        this.templateSelect.addEventListener('change', () => {
            const selectedId = this.templateSelect.value;
            if (selectedId) {
                this.props.onSelectTemplate(selectedId);
            }
        });
        
        // Create structure info section
        this.structureInfoEl = this.contentEl.createDiv('oom-linting-engine-structure-info');
        this.updateStructureInfo();
        
        // Create validation buttons
        this.validationButtons = this.contentEl.createDiv('oom-linting-engine-buttons');
        
        const validateButton = this.validationButtons.createEl('button', {
            text: 'Validate',
            cls: 'oom-button oom-linting-engine-validate-button'
        });
        validateButton.addEventListener('click', () => {
            this.props.onRunValidation();
        });
        
        const clearButton = this.validationButtons.createEl('button', {
            text: 'Clear Results',
            cls: 'oom-button oom-linting-engine-clear-button'
        });
        clearButton.addEventListener('click', () => {
            this.props.onClearValidation();
        });
        
        const exportButton = this.validationButtons.createEl('button', {
            text: 'Export Results',
            cls: 'oom-button oom-linting-engine-export-button'
        });
        exportButton.addEventListener('click', () => {
            this.props.onExportResults();
        });
        
        // Create results section
        const resultsSection = this.contentEl.createDiv('oom-linting-engine-results-section');
        resultsSection.createEl('h3', { text: 'Validation Results' });
        
        // Create loading indicator
        this.loadingEl = resultsSection.createDiv('oom-linting-engine-loading');
        this.loadingEl.createEl('span', { 
            text: 'Validating...',
            cls: 'oom-linting-engine-loading-text'
        });
        const spinner = this.loadingEl.createSpan('oom-linting-engine-spinner');
        spinner.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>`;
        this.toggleLoading(this.props.isValidating);
        
        // Create empty state message
        this.emptyStateEl = resultsSection.createDiv('oom-linting-engine-empty-state');
        this.emptyStateEl.createEl('span', { 
            text: 'No validation results. Click "Validate" to check your document.',
            cls: 'oom-linting-engine-empty-text'
        });
        
        // Create results list
        this.resultsList = resultsSection.createDiv('oom-linting-engine-results-list');
        
        // Populate results
        this.updateValidationResults();
    }

    /**
     * Update the structure info display
     */
    private updateStructureInfo(): void {
        if (!this.structureInfoEl) return;
        
        this.structureInfoEl.empty();
        
        if (this.props.structureInfo) {
            const structure = this.props.structureInfo;
            
            // Display structure details
            this.structureInfoEl.createEl('h3', { text: 'Structure Details' });
            
            const table = this.structureInfoEl.createEl('table', {
                cls: 'oom-linting-engine-structure-table'
            });
            
            this.addStructureTableRow(table, 'Name', structure.name);
            this.addStructureTableRow(table, 'Type', this.formatStructureType(structure.type));
            this.addStructureTableRow(table, 'Root Callout', `[!${structure.rootCallout}]`);
            
            if (structure.childCallouts.length > 0) {
                this.addStructureTableRow(
                    table, 
                    'Child Callouts', 
                    structure.childCallouts.map(c => `[!${c}]`).join(', ')
                );
            }
            
            if (structure.requiredFields.length > 0) {
                this.addStructureTableRow(
                    table, 
                    'Required Fields', 
                    structure.requiredFields.map(f => `[!${f}]`).join(', ')
                );
            }
            
            if (structure.metricsCallout) {
                this.addStructureTableRow(table, 'Metrics Callout', `[!${structure.metricsCallout}]`);
            }
            
            // Add description if available
            if (structure.description) {
                const descriptionDiv = this.structureInfoEl.createDiv('oom-linting-engine-structure-description');
                descriptionDiv.createEl('strong', { text: 'Description: ' });
                descriptionDiv.createSpan({ text: structure.description });
            }
        } else {
            // Show message when no structure is selected
            this.structureInfoEl.createEl('p', {
                text: 'No structure template selected. Select a template or use auto-detection.',
                cls: 'oom-linting-engine-no-structure'
            });
        }
    }
    
    /**
     * Add a row to the structure info table
     */
    private addStructureTableRow(table: HTMLTableElement, label: string, value: string): void {
        const row = table.createEl('tr');
        row.createEl('td', { 
            text: label,
            cls: 'oom-linting-engine-structure-label'
        });
        row.createEl('td', { 
            text: value,
            cls: 'oom-linting-engine-structure-value'
        });
    }
    
    /**
     * Format structure type for display
     */
    private formatStructureType(type: string): string {
        if (type === 'flat') {
            return 'Flat (sequential callouts)';
        } else if (type === 'nested') {
            return 'Nested (hierarchical callouts)';
        }
        return type;
    }

    /**
     * Update the validation results list
     */
    private updateValidationResults(): void {
        if (!this.resultsList || !this.emptyStateEl) return;
        
        this.resultsList.empty();
        
        const results = this.props.validationResults;
        
        // Show/hide empty state
        if (results.length === 0) {
            this.emptyStateEl.style.display = 'block';
            this.resultsList.style.display = 'none';
            return;
        } else {
            this.emptyStateEl.style.display = 'none';
            this.resultsList.style.display = 'block';
        }
        
        // Summary counts
        const errorCount = results.filter(r => r.severity === 'error').length;
        const warningCount = results.filter(r => r.severity === 'warning').length;
        const infoCount = results.filter(r => r.severity === 'info').length;
        
        // Create summary
        const summary = this.resultsList.createDiv('oom-linting-engine-summary');
        summary.createSpan({
            text: `${results.length} issues found: `,
            cls: 'oom-linting-engine-summary-text'
        });
        
        if (errorCount > 0) {
            summary.createSpan({
                text: `${errorCount} errors`,
                cls: 'oom-linting-engine-count oom-linting-engine-error-count'
            });
        }
        
        if (warningCount > 0) {
            if (errorCount > 0) summary.createSpan({ text: ', ' });
            summary.createSpan({
                text: `${warningCount} warnings`,
                cls: 'oom-linting-engine-count oom-linting-engine-warning-count'
            });
        }
        
        if (infoCount > 0) {
            if (errorCount > 0 || warningCount > 0) summary.createSpan({ text: ', ' });
            summary.createSpan({
                text: `${infoCount} info`,
                cls: 'oom-linting-engine-count oom-linting-engine-info-count'
            });
        }
        
        // Group results by severity
        const errorResults = results.filter(r => r.severity === 'error');
        const warningResults = results.filter(r => r.severity === 'warning');
        const infoResults = results.filter(r => r.severity === 'info');
        
        // Render each group
        if (errorResults.length > 0) {
            this.renderResultGroup('Errors', errorResults, 'error');
        }
        
        if (warningResults.length > 0) {
            this.renderResultGroup('Warnings', warningResults, 'warning');
        }
        
        if (infoResults.length > 0) {
            this.renderResultGroup('Info', infoResults, 'info');
        }
    }
    
    /**
     * Render a group of validation results
     */
    private renderResultGroup(
        title: string, 
        results: ValidationResult[], 
        severityCls: string
    ): void {
        const group = this.resultsList.createDiv(`oom-linting-engine-group oom-linting-engine-${severityCls}-group`);
        
        group.createEl('h4', { 
            text: title,
            cls: `oom-linting-engine-group-title oom-linting-engine-${severityCls}-title`
        });
        
        const list = group.createEl('ul', {
            cls: 'oom-linting-engine-issues-list'
        });
        
        // Render each result
        results.forEach(result => {
            this.renderResultItem(list, result, severityCls);
        });
    }
    
    /**
     * Render a single validation result item
     */
    private renderResultItem(
        list: HTMLElement, 
        result: ValidationResult, 
        severityCls: string
    ): void {
        const item = list.createEl('li', {
            cls: `oom-linting-engine-issue oom-linting-engine-${severityCls}-issue`
        });
        
        // Add severity icon
        const iconSpan = item.createSpan('oom-linting-engine-severity-icon');
        if (severityCls === 'error') {
            iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
        } else if (severityCls === 'warning') {
            iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
        } else {
            iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
        }
        
        // Create content container
        const content = item.createDiv('oom-linting-engine-issue-content');
        
        // Add rule name and message
        content.createEl('div', {
            cls: 'oom-linting-engine-issue-header',
            text: `[${result.rule.name}] ${result.message}`
        });
        
        // Add location info
        content.createEl('div', {
            cls: 'oom-linting-engine-issue-location',
            text: `Line: ${result.position.start.line}, Column: ${result.position.start.column}`
        });
        
        // Add quick fixes if available
        if (result.quickFixes && result.quickFixes.length > 0) {
            const fixesContainer = content.createDiv('oom-linting-engine-fixes');
            fixesContainer.createEl('span', {
                text: 'Quick Fixes:',
                cls: 'oom-linting-engine-fixes-label'
            });
            
            const fixesList = fixesContainer.createEl('div', {
                cls: 'oom-linting-engine-fixes-list'
            });
            
            // Create buttons for each fix
            result.quickFixes.forEach((fix, index) => {
                const fixButton = fixesList.createEl('button', {
                    text: fix.title,
                    cls: 'oom-button oom-linting-engine-fix-button'
                });
                
                fixButton.addEventListener('click', () => {
                    this.props.onApplyQuickFix(result, index);
                });
            });
        }
    }
    
    /**
     * Toggle loading indicator visibility
     */
    private toggleLoading(isLoading: boolean): void {
        if (!this.loadingEl) return;
        
        this.loadingEl.style.display = isLoading ? 'flex' : 'none';
        
        // Disable buttons during validation
        if (this.validationButtons) {
            const buttons = this.validationButtons.querySelectorAll('button');
            buttons.forEach(button => {
                button.disabled = isLoading;
            });
        }
    }
} 