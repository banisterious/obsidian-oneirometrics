import { TFile } from 'obsidian';
import { ValidationResult } from '../../../journal_check/types';
import { ILintingEngineService, LintingEngineDependencies, LintingEngineState, LintingEngineViewProps } from './LintingEngineTypes';
import { LintingEngineService } from './LintingEngineService';
import { LintingEngineView } from './LintingEngineView';

/**
 * Container component for the LintingEngine
 * Implements business logic and state management
 */
export class LintingEngineContainer {
    private view: LintingEngineView;
    private service: ILintingEngineService;
    private state: LintingEngineState;
    private activeFile: TFile | null = null;
    private eventSubscriptions: Array<() => void> = [];

    constructor(
        private containerEl: HTMLElement,
        private dependencies: LintingEngineDependencies
    ) {
        // Initialize state
        this.state = {
            validationResults: [],
            currentFilePath: null,
            isValidating: false,
            templateId: null,
            structureInfo: null
        };

        // Create the service
        this.service = new LintingEngineService(dependencies.getSettings());

        // Create and render the view
        this.view = new LintingEngineView(containerEl, this.getViewProps());

        // Subscribe to events and set up initial state
        this.initialize();
    }

    /**
     * Initialize the component
     */
    private initialize(): void {
        // Get the active file
        this.activeFile = this.dependencies.getActiveFile();
        if (this.activeFile) {
            this.state.currentFilePath = this.activeFile.path;
            this.autoSelectTemplate();
        }

        // Update the view
        this.updateView();
    }
    
    /**
     * Clean up resources on component destruction
     */
    public destroy(): void {
        // Unsubscribe from events
        this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
        this.eventSubscriptions = [];
        
        // Destroy the view
        this.view.destroy();
    }

    /**
     * Get the props for the view component
     */
    private getViewProps(): LintingEngineViewProps {
        const settings = this.dependencies.getSettings();
        
        return {
            validationResults: this.state.validationResults,
            currentFilePath: this.state.currentFilePath,
            isValidating: this.state.isValidating,
            templateId: this.state.templateId,
            structureInfo: this.state.structureInfo,
            onSelectTemplate: this.handleSelectTemplate.bind(this),
            onApplyQuickFix: this.handleApplyQuickFix.bind(this),
            onRunValidation: this.handleRunValidation.bind(this),
            onClearValidation: this.handleClearValidation.bind(this),
            onExportResults: this.handleExportResults.bind(this),
            availableTemplates: settings.templates,
        };
    }

    /**
     * Update the view with current state
     */
    private updateView(): void {
        this.view.update(this.getViewProps());
    }

    /**
     * Auto-select a template based on the current file content
     */
    private async autoSelectTemplate(): Promise<void> {
        if (!this.activeFile) return;

        try {
            const content = await this.dependencies.getFileContent(this.activeFile);
            const template = this.service.getTemplateForContent(content);
            
            if (template) {
                this.state.templateId = template.id;
                this.state.structureInfo = this.service.getStructureForTemplate(template.id);
                this.updateView();
            }
        } catch (error) {
            console.error('Error auto-selecting template:', error);
            this.dependencies.createNotice('Error analyzing file content');
        }
    }

    /**
     * Handle template selection
     */
    private handleSelectTemplate(templateId: string): void {
        this.state.templateId = templateId;
        this.state.structureInfo = this.service.getStructureForTemplate(templateId);
        this.updateView();
        
        // Automatically run validation with the new template
        this.handleRunValidation();
    }

    /**
     * Handle applying a quick fix
     */
    private async handleApplyQuickFix(result: ValidationResult, fixIndex: number): Promise<void> {
        if (!this.activeFile) {
            this.dependencies.createNotice('No active file to apply fix to');
            return;
        }

        try {
            // Get the current content
            const content = await this.dependencies.getFileContent(this.activeFile);
            
            // Apply the quick fix
            const updatedContent = this.service.applyQuickFix(content, result, fixIndex);
            
            // Update the file
            await this.dependencies.setFileContent(this.activeFile, updatedContent);
            
            // Run validation again to update results
            await this.handleRunValidation();
            
            // Show success message
            this.dependencies.createNotice(`Applied fix: ${result.quickFixes?.[fixIndex]?.title}`);
        } catch (error) {
            console.error('Error applying quick fix:', error);
            this.dependencies.createNotice('Error applying quick fix');
        }
    }

    /**
     * Handle running validation on the current file
     */
    private async handleRunValidation(): Promise<void> {
        if (!this.activeFile) {
            this.dependencies.createNotice('No active file to validate');
            return;
        }

        this.state.isValidating = true;
        this.updateView();

        try {
            const content = await this.dependencies.getFileContent(this.activeFile);
            
            // Perform validation
            const results = this.service.validate(content, this.state.templateId || undefined);
            
            // Update state
            this.state.validationResults = results;
            
            // Show summary
            const errorCount = results.filter(r => r.severity === 'error').length;
            const warningCount = results.filter(r => r.severity === 'warning').length;
            const infoCount = results.filter(r => r.severity === 'info').length;
            
            if (results.length === 0) {
                this.dependencies.createNotice('Validation passed with no issues');
            } else {
                this.dependencies.createNotice(
                    `Validation complete: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info`
                );
            }
        } catch (error) {
            console.error('Error validating file:', error);
            this.dependencies.createNotice('Error validating file');
        } finally {
            this.state.isValidating = false;
            this.updateView();
        }
    }

    /**
     * Handle clearing validation results
     */
    private handleClearValidation(): void {
        this.state.validationResults = [];
        this.updateView();
    }

    /**
     * Handle exporting validation results
     */
    private handleExportResults(): void {
        const { validationResults, currentFilePath } = this.state;
        
        if (validationResults.length === 0) {
            this.dependencies.createNotice('No validation results to export');
            return;
        }
        
        // Create Markdown report
        const errorCount = validationResults.filter(r => r.severity === 'error').length;
        const warningCount = validationResults.filter(r => r.severity === 'warning').length;
        const infoCount = validationResults.filter(r => r.severity === 'info').length;
        
        let report = `# Journal Structure Validation Report\n\n`;
        report += `**File:** ${currentFilePath}\n`;
        report += `**Template:** ${this.state.templateId || 'Auto-detected'}\n`;
        report += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
        report += `## Summary\n\n`;
        report += `- **Errors:** ${errorCount}\n`;
        report += `- **Warnings:** ${warningCount}\n`;
        report += `- **Info:** ${infoCount}\n\n`;
        report += `## Detailed Results\n\n`;
        
        // Group by severity
        const errorResults = validationResults.filter(r => r.severity === 'error');
        const warningResults = validationResults.filter(r => r.severity === 'warning');
        const infoResults = validationResults.filter(r => r.severity === 'info');
        
        if (errorResults.length > 0) {
            report += `### Errors\n\n`;
            errorResults.forEach(result => {
                report += `- **${result.rule.name}**: ${result.message}\n`;
                report += `  - Line: ${result.position.start.line}\n`;
                if (result.quickFixes && result.quickFixes.length > 0) {
                    report += `  - Suggested fix: ${result.quickFixes[0].title}\n`;
                }
                report += `\n`;
            });
        }
        
        if (warningResults.length > 0) {
            report += `### Warnings\n\n`;
            warningResults.forEach(result => {
                report += `- **${result.rule.name}**: ${result.message}\n`;
                report += `  - Line: ${result.position.start.line}\n\n`;
            });
        }
        
        if (infoResults.length > 0) {
            report += `### Info\n\n`;
            infoResults.forEach(result => {
                report += `- **${result.rule.name}**: ${result.message}\n`;
                report += `  - Line: ${result.position.start.line}\n\n`;
            });
        }
        
        // Create a notification with the report
        navigator.clipboard.writeText(report)
            .then(() => {
                this.dependencies.createNotice('Validation report copied to clipboard');
            })
            .catch(error => {
                console.error('Error copying report to clipboard:', error);
                this.dependencies.createNotice('Error exporting validation report');
            });
    }
} 