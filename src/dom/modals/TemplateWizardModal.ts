/**
 * TemplateWizardModal
 * 
 * A dedicated modal for creating journal templates with a clean, 
 * step-by-step interface following Material Design principles.
 */

import { App, Modal, Setting, Notice, DropdownComponent, TextAreaComponent, TextComponent, setIcon, TFile } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
import { CalloutStructure, JournalTemplate } from '../../types/journal-check';
import safeLogger from '../../logging/safe-logger';

type TemplateCreationMethod = 'direct' | 'structure' | 'templater';

interface TemplateWizardState {
    method: TemplateCreationMethod | null;
    templateName: string;
    templateDescription: string;
    content: string;
    structure: CalloutStructure | null;
    templaterFile: string;
    currentStep: number;
    isValid: boolean;
    editingTemplateId?: string; // For editing existing templates
}

export class TemplateWizardModal extends Modal {
    private plugin: DreamMetricsPlugin;
    private wizardState: TemplateWizardState;
    private contentContainer: HTMLElement;
    private footerContainer: HTMLElement;
    private progressFill: HTMLElement;
    private stepIndicatorContainer: HTMLElement;
    private isEditMode: boolean = false;
    
    // Form elements for state management
    private nameInput: TextComponent | null = null;
    private descriptionInput: TextComponent | null = null;
    private contentTextarea: TextAreaComponent | null = null;
    private structureDropdown: DropdownComponent | null = null;

    constructor(app: App, plugin: DreamMetricsPlugin, existingTemplate?: JournalTemplate) {
        super(app);
        this.plugin = plugin;
        this.isEditMode = !!existingTemplate;
        
        if (existingTemplate) {
            // Initialize wizard state from existing template
            const method = this.determineTemplateMethod(existingTemplate);
            const structure = method === 'structure' ? this.findStructureById(existingTemplate.structure) : null;
            const startStep = this.determineStartingStep(method);
            
            this.wizardState = {
                method,
                templateName: existingTemplate.name,
                templateDescription: existingTemplate.description || '',
                content: existingTemplate.content || '',
                structure,
                templaterFile: existingTemplate.templaterFile || '',
                currentStep: startStep,
                isValid: true,
                editingTemplateId: existingTemplate.id
            };
        } else {
            // Initialize empty wizard state for new template
            this.wizardState = {
                method: null,
                templateName: '',
                templateDescription: '',
                content: '',
                structure: null,
                templaterFile: '',
                currentStep: 1,
                isValid: false
            };
        }
    }

    onOpen() {
        safeLogger.debug('TemplateWizardModal', 'Opening template wizard modal');
        
        this.modalEl.addClass('oom-template-wizard-modal');
        this.renderModal();
        this.renderCurrentStep();
    }

    onClose() {
        safeLogger.debug('TemplateWizardModal', 'Closing template wizard modal');
        this.cleanup();
    }

    private renderModal() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-template-wizard-content');

        // Header
        this.renderHeader();
        
        // Content container
        this.contentContainer = contentEl.createDiv({ cls: 'oom-wizard-content' });
        
        // Footer
        this.renderFooter();
    }

    private renderHeader() {
        const header = this.contentEl.createDiv({ cls: 'oom-wizard-header' });
        
        // Title
        header.createEl('h1', { 
            text: this.isEditMode ? 'Edit Template' : 'Create Template',
            cls: 'oom-wizard-title'
        });
        
        // Step indicator
        this.stepIndicatorContainer = header.createDiv({ cls: 'oom-step-indicator' });
        this.updateStepIndicator();
        
        // Close button
        const closeBtn = header.createEl('button', { cls: 'oom-wizard-close' });
        setIcon(closeBtn, 'x');
        closeBtn.addEventListener('click', () => this.close());
    }

    private updateStepIndicator() {
        this.stepIndicatorContainer.empty();
        
        for (let i = 1; i <= 3; i++) {
            if (i > 1) {
                this.stepIndicatorContainer.createDiv({ cls: 'oom-step-divider' });
            }
            
            const stepEl = this.stepIndicatorContainer.createDiv({ 
                cls: `oom-step-number ${this.getStepClass(i)}`
            });
            
            if (i < this.wizardState.currentStep) {
                stepEl.innerHTML = '✓';
            } else {
                stepEl.textContent = i.toString();
            }
        }
    }

    private getStepClass(stepNumber: number): string {
        if (stepNumber < this.wizardState.currentStep) return 'completed';
        if (stepNumber === this.wizardState.currentStep) return 'active';
        return 'inactive';
    }

    private renderFooter() {
        this.footerContainer = this.contentEl.createDiv({ cls: 'oom-wizard-footer' });
        
        // Progress section
        const progressSection = this.footerContainer.createDiv({ cls: 'oom-footer-progress' });
        progressSection.createSpan({ 
            text: `Step ${this.wizardState.currentStep} of 3`,
            cls: 'oom-progress-text'
        });
        
        const progressContainer = progressSection.createDiv({ cls: 'oom-progress-indicator' });
        this.progressFill = progressContainer.createDiv({ cls: 'oom-progress-fill' });
        this.updateProgress();
        
        // Buttons section
        const buttonsSection = this.footerContainer.createDiv({ cls: 'oom-footer-buttons' });
        this.renderFooterButtons(buttonsSection);
    }

    private updateProgress() {
        const progress = (this.wizardState.currentStep / 3) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    private renderFooterButtons(container: HTMLElement) {
        container.empty();
        
        // Back button (if not on first step)
        if (this.wizardState.currentStep > 1) {
            const backBtn = container.createEl('button', { cls: 'oom-btn oom-btn-ghost' });
            const backIcon = backBtn.createSpan({ cls: 'oom-btn-icon' });
            setIcon(backIcon, 'arrow-left');
            backBtn.createSpan({ text: ' Back' });
            backBtn.addEventListener('click', () => this.goBack());
        }
        
        // Cancel button
        const cancelBtn = container.createEl('button', { cls: 'oom-btn oom-btn-ghost' });
        const cancelIcon = cancelBtn.createSpan({ cls: 'oom-btn-icon' });
        setIcon(cancelIcon, 'x');
        cancelBtn.createSpan({ text: ' Cancel' });
        cancelBtn.addEventListener('click', () => this.close());
        
        // Next/Create button
        const nextBtn = container.createEl('button', { cls: 'oom-btn oom-btn-primary' });
        
        if (this.wizardState.currentStep === 3) {
            const createIcon = nextBtn.createSpan({ cls: 'oom-btn-icon' });
            setIcon(createIcon, 'plus');
            nextBtn.createSpan({ text: ' Create Template' });
            nextBtn.addEventListener('click', () => this.createTemplate());
        } else {
            nextBtn.createSpan({ text: 'Continue ' });
            const continueIcon = nextBtn.createSpan({ cls: 'oom-btn-icon' });
            setIcon(continueIcon, 'arrow-right');
            nextBtn.addEventListener('click', () => this.goNext());
        }
        
        // Enable/disable based on validation
        this.validateCurrentStep();
        nextBtn.disabled = !this.wizardState.isValid;
    }

    private renderCurrentStep() {
        this.contentContainer.empty();
        
        switch (this.wizardState.currentStep) {
            case 1:
                this.renderMethodSelection();
                break;
            case 2:
                this.renderContentCreation();
                break;
            case 3:
                this.renderPreviewAndConfirm();
                break;
        }
        
        this.updateStepIndicator();
        this.updateProgress();
        this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
    }

    private renderMethodSelection() {
        const container = this.contentContainer;
        
        // Step title and description
        container.createEl('h2', { 
            text: 'How would you like to create your template?',
            cls: 'oom-step-title'
        });
        
        container.createEl('p', {
            text: 'Choose the method that best fits your workflow and technical comfort level.',
            cls: 'oom-step-description'
        });
        
        // Method cards
        const methodGrid = container.createDiv({ cls: 'oom-method-grid' });
        
        this.createMethodCard(methodGrid, 'direct', 'edit-3', 'Direct Input', 
            'Write template content directly with markdown and callout syntax');
        
        this.createMethodCard(methodGrid, 'structure', 'building-2', 'From Structure', 
            'Build from predefined journal structure patterns');
        
        this.createMethodCard(methodGrid, 'templater', 'zap', 'From Templater', 
            'Import existing Templater template files');
    }

    private createMethodCard(container: HTMLElement, method: TemplateCreationMethod, 
                           icon: string, title: string, description: string) {
        const card = container.createDiv({ 
            cls: `oom-method-card ${this.wizardState.method === method ? 'selected' : ''}`
        });
        
        const content = card.createDiv({ cls: 'oom-method-content' });
        
        // Icon
        const iconEl = content.createDiv({ cls: 'oom-method-icon' });
        setIcon(iconEl, icon);
        
        // Title and description
        content.createEl('h3', { text: title, cls: 'oom-method-title' });
        content.createEl('p', { text: description, cls: 'oom-method-desc' });
        
        // Click handler
        card.addEventListener('click', () => {
            // Remove selection from other cards
            container.querySelectorAll('.oom-method-card').forEach(c => c.removeClass('selected'));
            // Select this card
            card.addClass('selected');
            this.wizardState.method = method;
            this.validateCurrentStep();
            this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
        });
    }

    private renderContentCreation() {
        const container = this.contentContainer;
        
        switch (this.wizardState.method) {
            case 'direct':
                this.renderDirectInput(container);
                break;
            case 'structure':
                this.renderStructureSelection(container);
                break;
            case 'templater':
                this.renderTemplaterSelection(container);
                break;
        }
    }

    private renderDirectInput(container: HTMLElement) {
        container.createEl('h2', { 
            text: 'Create Template Content',
            cls: 'oom-step-title'
        });
        
        container.createEl('p', {
            text: 'Write your template content directly using markdown and callout syntax.',
            cls: 'oom-step-description'
        });
        
        // Template name
        new Setting(container)
            .setName('Template Name')
            .setDesc('Enter a descriptive name for this template')
            .addText(text => {
                this.nameInput = text;
                text.setValue(this.wizardState.templateName)
                    .setPlaceholder('e.g., Dream Journal Entry')
                    .onChange(value => {
                        this.wizardState.templateName = value;
                        this.validateCurrentStep();
                        this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
                    });
            });
        
        // Content textarea - custom layout to place below label
        const contentSection = container.createDiv({ cls: 'oom-content-section' });
        
        // Label and description
        const contentLabel = contentSection.createEl('h3', { 
            text: 'Template Content',
            cls: 'oom-content-label'
        });
        const contentDesc = contentSection.createEl('p', {
            text: 'Enter the markdown content for your template. Use callouts like > [!journal-entry] for structure.',
            cls: 'oom-content-description'
        });
        
        // Add placeholder documentation from HubModal
        const placeholderDesc = contentSection.createEl('p', {
            text: 'When creating templates, use placeholders for dynamic content: {{date}} (2025-01-15), {{date-long}} (January 15, 2025), {{date-month-day}} (January 15), {{date-compact}} / {{date-ref}} (20250115), {{title}}, {{content}}, {{metrics}}, or individual metric names like {{Sensory Detail}}.',
            cls: 'oom-content-description'
        });
        
        // Textarea below label and description
        const textarea = contentSection.createEl('textarea', {
            cls: 'oom-wizard-textarea',
            attr: {
                placeholder: this.getContentPlaceholder()
            }
        });
        
        // Set initial value and styling
        textarea.value = this.wizardState.content || '';
        textarea.style.minHeight = '320px';
        textarea.style.fontFamily = 'var(--font-monospace)';
        
        // Create TextAreaComponent wrapper for compatibility
        this.contentTextarea = {
            inputEl: textarea,
            setValue: (value: string) => {
                textarea.value = value;
                return this.contentTextarea!;
            },
            getValue: () => textarea.value
        } as TextAreaComponent;
        
        // Add event handler
        textarea.addEventListener('input', () => {
            this.wizardState.content = textarea.value;
            this.validateCurrentStep();
            this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
        });
        
        // Helper buttons
        this.renderContentHelpers(container);
    }

    private renderContentHelpers(container: HTMLElement) {
        const helpersContainer = container.createDiv({ cls: 'oom-content-helpers' });
        
        this.createHelperChip(helpersContainer, 'clipboard', 'Paste Sample', () => {
            this.pasteTemplateExample();
        });
        
        this.createHelperChip(helpersContainer, 'message-square', 'Insert Callout', () => {
            this.insertCallout();
        });
        
        this.createHelperChip(helpersContainer, 'bar-chart-3', 'Add Metrics', () => {
            this.insertMetrics();
        });
        
        this.createHelperChip(helpersContainer, 'type', 'Format Text', () => {
            this.formatText();
        });
    }

    private createHelperChip(container: HTMLElement, icon: string, text: string, onClick: () => void) {
        const chip = container.createEl('button', { cls: 'oom-helper-chip' });
        const iconEl = chip.createSpan({ cls: 'oom-helper-chip-icon' });
        setIcon(iconEl, icon);
        chip.createSpan({ text: ` ${text}` });
        chip.addEventListener('click', onClick);
    }

    private renderStructureSelection(container: HTMLElement) {
        container.createEl('h2', { 
            text: 'Choose Journal Structure',
            cls: 'oom-step-title'
        });
        
        container.createEl('p', {
            text: 'Select a predefined structure pattern to base your template on.',
            cls: 'oom-step-description'
        });
        
        // Template name
        new Setting(container)
            .setName('Template Name')
            .setDesc('Enter a descriptive name for this template')
            .addText(text => {
                this.nameInput = text;
                text.setValue(this.wizardState.templateName || '')
                    .setPlaceholder('Enter template name...')
                    .onChange(value => {
                        this.wizardState.templateName = value;
                        this.validateCurrentStep();
                        this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
                    });
            });
        
        // Structure selection
        new Setting(container)
            .setName('Journal Structure')
            .setDesc('Choose the organizational pattern for your template')
            .addDropdown(dropdown => {
                this.structureDropdown = dropdown;
                dropdown.addOption('', 'Select a structure...');
                
                const availableStructures = this.getAvailableStructures();
                availableStructures.forEach(structure => {
                    dropdown.addOption(structure.id, `${structure.name} - ${structure.description}`);
                });
                
                // Set current value if any
                dropdown.setValue(this.wizardState.structure?.id || '');
                
                dropdown.onChange(value => {
                    if (value) {
                        this.wizardState.structure = this.getStructureById(value);
                        this.wizardState.content = this.generateContentFromStructure(this.wizardState.structure);
                    } else {
                        this.wizardState.structure = null;
                        this.wizardState.content = '';
                    }
                    this.validateCurrentStep();
                    this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
                });
            });
        
        // Preview (if structure selected)
        if (this.wizardState.structure) {
            this.renderPreview(container, 'Structure Preview', this.wizardState.content);
        }
    }

    private renderTemplaterSelection(container: HTMLElement) {
        container.createEl('h2', { 
            text: 'Import from Templater',
            cls: 'oom-step-title'
        });
        
        container.createEl('p', {
            text: 'Select an existing Templater template file to import.',
            cls: 'oom-step-description'
        });
        
        // Check Templater availability
        const templaterEnabled = !!(this.plugin.templaterIntegration?.isTemplaterInstalled?.());
        let templaterTemplates: string[] = [];
        
        if (templaterEnabled) {
            templaterTemplates = this.plugin.templaterIntegration?.getTemplaterTemplates?.() || [];
        }
        
        if (!templaterEnabled) {
            container.createEl('p', {
                text: 'Templater plugin not found. Please install and enable the Templater plugin to use this feature.',
                cls: 'oom-placeholder-text'
            });
            return;
        }
        
        if (templaterTemplates.length === 0) {
            container.createEl('p', {
                text: 'No Templater templates found. Please create some templates in your Templater folder first.',
                cls: 'oom-placeholder-text'
            });
            return;
        }
        
        // Templater file selection
        new Setting(container)
            .setName('Templater Template')
            .setDesc('Select from your available Templater templates')
            .addDropdown(dropdown => {
                this.structureDropdown = dropdown; // Reuse for templater
                dropdown.addOption('', 'Select a template...');
                
                templaterTemplates.forEach(template => {
                    dropdown.addOption(template, template);
                });
                
                dropdown.setValue(this.wizardState.templaterFile || '');
                dropdown.onChange(async (value) => {
                    this.wizardState.templaterFile = value;
                    if (value) {
                        // Auto-generate template name from filename
                        if (!this.wizardState.templateName) {
                            this.wizardState.templateName = this.generateTemplateNameFromFile(value);
                            if (this.nameInput) {
                                this.nameInput.setValue(this.wizardState.templateName);
                            }
                        }
                        
                        // Load template content for preview
                        try {
                            const templateContent = await this.loadTemplaterTemplateContent(value);
                            this.wizardState.content = templateContent;
                        } catch (error) {
                            this.wizardState.content = `Error loading template: ${(error as Error).message}`;
                        }
                    } else {
                        this.wizardState.content = '';
                    }
                    this.validateCurrentStep();
                    this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
                });
            });
        
        // Template name
        new Setting(container)
            .setName('Template Name')
            .setDesc('Enter a name for this template (auto-generated from filename)')
            .addText(text => {
                this.nameInput = text;
                text.setValue(this.wizardState.templateName || '')
                    .setPlaceholder('Will be auto-generated from filename')
                    .onChange(value => {
                        this.wizardState.templateName = value;
                        this.validateCurrentStep();
                        this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
                    });
            });
        
        // Preview if file is selected
        if (this.wizardState.templaterFile && this.wizardState.content) {
            this.renderPreview(container, 'Templater Template Preview', this.wizardState.content);
        }
    }

    private renderPreviewAndConfirm() {
        const container = this.contentContainer;
        
        container.createEl('h2', { 
            text: 'Review Your Template',
            cls: 'oom-step-title'
        });
        
        container.createEl('p', {
            text: 'Review the template content and settings before creating.',
            cls: 'oom-step-description'
        });
        
        // Template description (optional)
        new Setting(container)
            .setName('Template Description (Optional)')
            .setDesc('Add a description to help identify this template later')
            .addText(text => {
                this.descriptionInput = text;
                text.setValue(this.wizardState.templateDescription)
                    .setPlaceholder('e.g., Standard dream journal with metrics tracking')
                    .onChange(value => {
                        this.wizardState.templateDescription = value;
                    });
            });
        
        // Preview
        this.renderPreview(container, 'Template Preview', this.wizardState.content);
    }

    private renderPreview(container: HTMLElement, title: string, content: string) {
        const previewCard = container.createDiv({ cls: 'oom-preview-card' });
        
        const titleEl = previewCard.createEl('h3', { cls: 'oom-preview-title' });
        const titleIcon = titleEl.createSpan();
        setIcon(titleIcon, 'eye');
        titleEl.createSpan({ text: ` ${title}` });
        
        const contentEl = previewCard.createEl('pre', { cls: 'oom-preview-content' });
        contentEl.textContent = content || 'No content yet...';
    }

    private goNext() {
        if (this.wizardState.isValid && this.wizardState.currentStep < 3) {
            this.wizardState.currentStep++;
            this.renderCurrentStep();
        }
    }

    private goBack() {
        if (this.wizardState.currentStep > 1) {
            this.wizardState.currentStep--;
            this.renderCurrentStep();
        }
    }

    private validateCurrentStep() {
        switch (this.wizardState.currentStep) {
            case 1:
                this.wizardState.isValid = this.wizardState.method !== null;
                break;
            case 2:
                this.wizardState.isValid = 
                    this.wizardState.templateName.trim().length > 0 &&
                    this.wizardState.content.trim().length > 0;
                break;
            case 3:
                this.wizardState.isValid = 
                    this.wizardState.templateName.trim().length > 0 &&
                    this.wizardState.content.trim().length > 0;
                break;
            default:
                this.wizardState.isValid = false;
        }
        
        safeLogger.trace('TemplateWizardModal', 'validateCurrentStep', {
            currentStep: this.wizardState.currentStep,
            method: this.wizardState.method,
            templateName: this.wizardState.templateName,
            contentLength: this.wizardState.content?.length || 0,
            isValid: this.wizardState.isValid
        });
    }

    private async createTemplate() {
        safeLogger.trace('TemplateWizardModal', 'createTemplate() called', {
            wizardState: {
                method: this.wizardState.method,
                templateName: this.wizardState.templateName,
                contentLength: this.wizardState.content?.length || 0,
                structureId: this.wizardState.structure?.id,
                currentStep: this.wizardState.currentStep,
                isValid: this.wizardState.isValid
            }
        });
        
        try {
            const template: JournalTemplate = {
                id: this.wizardState.editingTemplateId || Date.now().toString(),
                name: this.wizardState.templateName,
                description: this.wizardState.templateDescription,
                content: this.wizardState.content,
                structure: this.wizardState.structure?.id || '',
                isTemplaterTemplate: this.wizardState.method === 'templater',
                templaterFile: this.wizardState.method === 'templater' ? this.wizardState.templaterFile : undefined,
                staticContent: this.wizardState.method === 'templater' ? this.wizardState.content : undefined
            };
            
            safeLogger.trace('TemplateWizardModal', 'Template object created', {
                templateId: template.id,
                templateName: template.name,
                contentLength: template.content.length,
                structureId: template.structure,
                isTemplaterTemplate: template.isTemplaterTemplate
            });
            
            safeLogger.trace('TemplateWizardModal', 'Plugin settings before save', {
                lintingExists: !!this.plugin.settings.linting,
                templatesExists: !!this.plugin.settings.linting?.templates,
                templatesCount: this.plugin.settings.linting?.templates?.length || 0
            });
            
            // Save template (this would integrate with the plugin's template system)
            await this.saveTemplate(template);
            
            safeLogger.trace('TemplateWizardModal', 'Template saved successfully', {
                templateId: template.id,
                templateName: template.name,
                totalTemplates: this.plugin.settings.linting?.templates?.length || 0
            });
            
            const actionText = this.isEditMode ? 'updated' : 'created';
            new Notice(`Template "${template.name}" ${actionText} successfully!`);
            safeLogger.debug('TemplateWizardModal', `Template ${actionText} successfully`, { templateName: template.name });
            
            this.close();
        } catch (error) {
            const actionText = this.isEditMode ? 'update' : 'create';
            safeLogger.error('TemplateWizardModal', `Failed to ${actionText} template`, error);
            new Notice(`Failed to ${actionText} template. Please try again.`);
        }
    }

    private async saveTemplate(template: JournalTemplate) {
        safeLogger.trace('TemplateWizardModal', 'saveTemplate() called', {
            templateId: template.id,
            templateName: template.name
        });
        
        try {
            // Initialize linting settings if they don't exist
            if (!this.plugin.settings.linting) {
                safeLogger.trace('TemplateWizardModal', 'Initializing linting settings (none existed)');
                this.plugin.settings.linting = {
                    enabled: true,
                    rules: [],
                    structures: [],
                    templates: [],
                    templaterIntegration: {
                        enabled: false,
                        folderPath: 'templates/dreams',
                        defaultTemplate: 'templates/dreams/default.md'
                    },
                    contentIsolation: {
                        ignoreImages: true,
                        ignoreLinks: false,
                        ignoreFormatting: true,
                        ignoreHeadings: false,
                        ignoreCodeBlocks: true,
                        ignoreFrontmatter: true,
                        ignoreComments: true,
                        customIgnorePatterns: []
                    },
                    userInterface: {
                        showInlineValidation: true,
                        severityIndicators: {
                            error: '❌',
                            warning: '⚠️',
                            info: 'ℹ️'
                        },
                        quickFixesEnabled: true
                    }
                };
            }

            // Initialize templates array if it doesn't exist
            if (!this.plugin.settings.linting.templates) {
                safeLogger.trace('TemplateWizardModal', 'Initializing templates array (none existed)');
                this.plugin.settings.linting.templates = [];
            }

            const templatesBeforeCount = this.plugin.settings.linting.templates.length;
            safeLogger.trace('TemplateWizardModal', 'Adding template to array', {
                templatesBeforeCount,
                templateId: template.id
            });

            if (this.wizardState.editingTemplateId) {
                // Update existing template
                const existingIndex = this.plugin.settings.linting.templates.findIndex(t => t.id === this.wizardState.editingTemplateId);
                if (existingIndex !== -1) {
                    this.plugin.settings.linting.templates[existingIndex] = template;
                    safeLogger.trace('TemplateWizardModal', 'Template updated in array', {
                        existingIndex,
                        templateId: template.id
                    });
                } else {
                    safeLogger.warn('TemplateWizardModal', 'Could not find existing template to update, adding as new', {
                        editingTemplateId: this.wizardState.editingTemplateId
                    });
                    this.plugin.settings.linting.templates.push(template);
                }
            } else {
                // Add new template to the templates array
                this.plugin.settings.linting.templates.push(template);
                
                const templatesAfterCount = this.plugin.settings.linting.templates.length;
                safeLogger.trace('TemplateWizardModal', 'Template added to array', {
                    templatesAfterCount,
                    templateAdded: templatesAfterCount > templatesBeforeCount
                });
            }
            
            // Save settings to persist the template
            safeLogger.trace('TemplateWizardModal', 'Calling plugin.saveSettings()');
            await this.plugin.saveSettings();
            safeLogger.trace('TemplateWizardModal', 'plugin.saveSettings() completed');
            
            safeLogger.debug('TemplateWizardModal', 'Template saved successfully', { 
                templateId: template.id, 
                templateName: template.name,
                totalTemplates: this.plugin.settings.linting.templates.length
            });
            
        } catch (error) {
            safeLogger.error('TemplateWizardModal', 'Failed to save template', error);
            throw error; // Re-throw to trigger error handling in createTemplate
        }
    }

    // Helper methods
    private getContentPlaceholder(): string {
        return `Enter your template content here...

Example:
# Dream Journal Entry

> [!journal-entry]
> Enter your dream here.
>
> > [!dream-diary]
> > Describe your dream experience.
> >
> > > [!dream-metrics]
> > > Sensory Detail: 1-5
> > > Emotional Recall: 1-5
> > > Lost Segments: 0-10
> > > Descriptiveness: 1-5
> > > Confidence Score: 1-5`;
    }

    private pasteTemplateExample() {
        const example = `# Dream Journal Entry

> [!journal-entry]
> Enter your dream here.
>
> > [!dream-diary]
> > Describe your dream experience.
> >
> > > [!dream-metrics]
> > > Sensory Detail: 1-5
> > > Emotional Recall: 1-5
> > > Lost Segments: 0-10
> > > Descriptiveness: 1-5
> > > Confidence Score: 1-5`;

        if (this.contentTextarea) {
            this.contentTextarea.setValue(example);
            this.wizardState.content = example;
            this.validateCurrentStep();
            this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
        }
    }

    private insertCallout() {
        const callout = `\n> [!callout-type]\n> Enter callout content here.\n`;
        this.insertTextAtCursor(callout);
    }

    private insertMetrics() {
        const metrics = `\n> > > [!dream-metrics]\n> > > Sensory Detail: 1-5\n> > > Emotional Recall: 1-5\n> > > Lost Segments: 0-10\n> > > Descriptiveness: 1-5\n> > > Confidence Score: 1-5\n`;
        this.insertTextAtCursor(metrics);
    }

    private formatText() {
        // Basic text formatting helper
        new Notice('Text formatting helper - coming soon!');
    }

    private insertTextAtCursor(text: string) {
        if (this.contentTextarea && this.contentTextarea.inputEl) {
            const textarea = this.contentTextarea.inputEl;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            
            const newValue = value.substring(0, start) + text + value.substring(end);
            this.contentTextarea.setValue(newValue);
            this.wizardState.content = newValue;
            
            // Set cursor position after inserted text
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            textarea.focus();
            
            this.validateCurrentStep();
            this.renderFooterButtons(this.footerContainer.querySelector('.oom-footer-buttons') as HTMLElement);
        }
    }

    private getAvailableStructures(): CalloutStructure[] {
        return [
            {
                id: 'nested-3-level',
                name: 'Nested (3-level)',
                description: 'Deep nested structure: journal-entry → dream-diary → dream-metrics',
                type: 'nested',
                rootCallout: 'journal-entry',
                childCallouts: ['dream-diary'],
                metricsCallout: 'dream-metrics',
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['content'],
                optionalFields: ['tags', 'mood']
            },
            {
                id: 'nested-2-level',
                name: 'Nested (2-level)',
                description: 'Simple nested structure: journal-entry → dream-metrics',
                type: 'nested',
                rootCallout: 'journal-entry',
                childCallouts: [],
                metricsCallout: 'dream-metrics',
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['content'],
                optionalFields: ['tags']
            },
            {
                id: 'flat-structured',
                name: 'Flat Structure',
                description: 'Separate callouts: journal-entry, dream-diary, dream-metrics (no nesting)',
                type: 'flat',
                rootCallout: 'journal-entry',
                childCallouts: ['dream-diary'],
                metricsCallout: 'dream-metrics',
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['content'],
                optionalFields: ['tags', 'mood']
            },
            {
                id: 'simple-basic',
                name: 'Simple Basic',
                description: 'Just journal-entry with embedded dream-metrics',
                type: 'flat',
                rootCallout: 'journal-entry',
                childCallouts: [],
                metricsCallout: 'dream-metrics',
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['content'],
                optionalFields: []
            }
        ];
    }

    private getStructureById(id: string): CalloutStructure | null {
        const structures = this.getAvailableStructures();
        return structures.find(s => s.id === id) || null;
    }

    private generateContentFromStructure(structure: CalloutStructure | null): string {
        if (!structure) return '';
        
        let content = `# Dream Journal Entry\n\n`;
        
        if (structure.type === 'nested') {
            // For nested structures
            content += `> [!${structure.rootCallout}]\n> Enter your dream here.\n>\n`;
            
            if (structure.childCallouts.length > 0) {
                // Add child callouts as nested (2-level nesting)
                for (const callout of structure.childCallouts) {
                    content += `> > [!${callout}]\n`;
                    content += `> > Dream content goes here.\n`;
                    
                    // Add metrics callout nested inside this child callout (3-level nesting)
                    if (structure.metricsCallout) {
                        content += `> >\n> > > [!${structure.metricsCallout}]\n`;
                        content += `> > > Sensory Detail: 1-5\n`;
                        content += `> > > Emotional Recall: 1-5\n`;
                        content += `> > > Lost Segments: 0-10\n`;
                        content += `> > > Descriptiveness: 1-5\n`;
                        content += `> > > Confidence Score: 1-5\n`;
                    }
                    content += `>\n`;
                }
            } else {
                // If no child callouts, add metrics directly nested under root (3-level nesting to match user templates)
                if (structure.metricsCallout) {
                    content += `>\n> > > [!${structure.metricsCallout}]\n`;
                    content += `> > > Sensory Detail: 1-5\n`;
                    content += `> > > Emotional Recall: 1-5\n`;
                    content += `> > > Lost Segments: 0-10\n`;
                    content += `> > > Descriptiveness: 1-5\n`;
                    content += `> > > Confidence Score: 1-5\n`;
                }
            }
        } else {
            // For flat structures
            content += `> [!${structure.rootCallout}]\n> Enter your dream here.\n\n`;
            
            // Add child callouts as separate
            for (const callout of structure.childCallouts) {
                if (callout === structure.metricsCallout) continue;
                content += `> [!${callout}]\n> Dream content goes here.\n\n`;
            }
            
            // Add metrics callout last
            if (structure.metricsCallout) {
                content += `> [!${structure.metricsCallout}]\n`;
                content += `> Sensory Detail: 1-5\n`;
                content += `> Emotional Recall: 1-5\n`;
                content += `> Lost Segments: 0-10\n`;
                content += `> Descriptiveness: 1-5\n`;
                content += `> Confidence Score: 1-5\n`;
            }
        }
        
        return content;
    }

    private generateTemplateNameFromFile(filename: string): string {
        // Remove extension and convert to title case
        const name = filename.replace(/\.[^/.]+$/, '');
        return name.replace(/[-_]/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase()) + ' Template';
    }

    private async loadTemplaterTemplateContent(templatePath: string): Promise<string> {
        try {
            const file = this.app.vault.getAbstractFileByPath(templatePath);
            if (file instanceof TFile) {
                return await this.app.vault.read(file);
            } else {
                throw new Error(`Template file not found: ${templatePath}`);
            }
        } catch (error) {
            safeLogger.error('TemplateWizardModal', 'Error loading Templater template content', { 
                templatePath, 
                error: error instanceof Error ? error.message : String(error) 
            });
            throw error;
        }
    }

    /**
     * Determine the template creation method based on template properties
     */
    private determineTemplateMethod(template: JournalTemplate): TemplateCreationMethod {
        // Check for Templater template first
        if (template.isTemplaterTemplate && template.templaterFile) {
            return 'templater';
        }
        
        // Check for structure-based template
        if (template.structure && template.structure.trim() !== '') {
            const availableStructures = this.getAvailableStructures();
            const matchingStructure = availableStructures.find(s => s.id === template.structure);
            
            if (matchingStructure && template.content) {
                // Check if content looks structure-generated
                const hasStructureMarkers = template.content.includes('[!journal-entry]') ||
                                          template.content.includes('[!dream-diary]') ||
                                          template.content.includes('[!dream-metrics]');
                
                if (hasStructureMarkers) {
                    return 'structure';
                }
            }
        }
        
        // Default to direct input
        return 'direct';
    }

    /**
     * Find a structure by its ID
     */
    private findStructureById(structureId: string): CalloutStructure | null {
        if (!structureId) return null;
        
        const availableStructures = this.getAvailableStructures();
        return availableStructures.find(s => s.id === structureId) || null;
    }

    /**
     * Determine the starting step based on template method
     */
    private determineStartingStep(method: TemplateCreationMethod): number {
        switch (method) {
            case 'structure':
                return 3; // Go to preview step for structure-based templates
            case 'templater':
            case 'direct':
            default:
                return 2; // Go to content creation step
        }
    }

    /**
     * Update the modal title based on edit mode
     */
    private updateModalTitle() {
        const titleEl = this.contentEl.querySelector('.oom-wizard-title');
        if (titleEl) {
            titleEl.textContent = this.isEditMode ? 'Edit Template' : 'Create Template';
        }
    }

    private cleanup() {
        this.nameInput = null;
        this.descriptionInput = null;
        this.contentTextarea = null;
        this.structureDropdown = null;
    }
}