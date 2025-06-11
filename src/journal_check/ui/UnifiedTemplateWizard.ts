import { App, Modal, Setting, ButtonComponent, DropdownComponent, TextAreaComponent, TextComponent, Notice } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
import { CalloutStructure, JournalTemplate, JournalStructureSettings } from '../types';
import { TemplaterIntegration } from '../TemplaterIntegration';
import { DreamMetric } from '../../types';
import { getLogger } from '../../logging';

/**
 * Creation methods for templates
 */
type TemplateCreationMethod = 'templater' | 'structure' | 'direct';

/**
 * Wizard state for template creation
 */
interface TemplateWizardState {
    method: TemplateCreationMethod | null;
    templaterFile: string;
    structure: CalloutStructure | null;
    content: string;
    templateName: string;
    templateDescription: string;
    isValid: boolean;
}

/**
 * Unified Template Creation Wizard
 * Replaces the previous multi-step template wizard with a streamlined approach
 */
export class UnifiedTemplateWizard extends Modal {
    private currentStep = 1;
    private state: TemplateWizardState;
    private stepContainers: HTMLElement[] = [];
    private navigationEl: HTMLElement;
    private previewEl: HTMLElement;
    
    // Components
    private methodRadios: HTMLInputElement[] = [];
    private templaterDropdown: DropdownComponent;
    private structureDropdown: DropdownComponent;
    private contentArea: TextAreaComponent;
    private nameInput: TextComponent;
    private descInput: TextComponent;
    
    constructor(
        app: App,
        private plugin: DreamMetricsPlugin,
        private templaterIntegration?: TemplaterIntegration,
        private editingTemplate?: JournalTemplate
    ) {
        super(app);
        
        // Initialize templaterIntegration if not provided
        if (!this.templaterIntegration && this.plugin.templaterIntegration) {
            this.templaterIntegration = this.plugin.templaterIntegration;
        }
        
        // Initialize state
        this.state = {
            method: null,
            templaterFile: '',
            structure: null,
            content: '',
            templateName: '',
            templateDescription: '',
            isValid: false
        };
        
        // If editing an existing template, populate the state
        if (editingTemplate) {
            this.loadExistingTemplate(editingTemplate);
        }
    }
    
    /**
     * Load existing template data for editing
     */
    private loadExistingTemplate(template: JournalTemplate) {
        this.state.templateName = template.name;
        this.state.templateDescription = template.description;
        this.state.content = template.content;
        
        if (template.isTemplaterTemplate && template.templaterFile) {
            this.state.method = 'templater';
            this.state.templaterFile = template.templaterFile;
        } else if (template.structure) {
            this.state.method = 'structure';
            const structure = this.plugin.settings.linting.structures.find(s => s.id === template.structure);
            this.state.structure = structure || null;
        } else {
            this.state.method = 'direct';
        }
    }
    
    /**
     * Get total steps based on selected method
     */
    private get totalSteps(): number {
        if (!this.state.method) return 2; // At least Step 1 + one completion step
        
        switch (this.state.method) {
            case 'templater':
                return 2; // Method selection → Preview
            case 'structure':
                return 3; // Method selection → Structure selection → Preview
            case 'direct':
                return 2; // Method selection → Content editing
            default:
                return 2;
        }
    }
    
    onOpen() {
        const { contentEl } = this;
        
        contentEl.addClass('oom-unified-template-wizard');
        
        // Create header
        const title = this.editingTemplate 
            ? `Edit Template: ${this.editingTemplate.name}`
            : 'Create Template';
        contentEl.createEl('h2', { text: title });
        
        // Create main container
        const container = contentEl.createDiv({ cls: 'oom-template-wizard-container' });
        
        // Create step containers
        for (let i = 1; i <= 3; i++) { // Max 3 steps possible
            const stepContainer = container.createDiv({ 
                cls: `oom-template-wizard-step step-${i}`,
                attr: { 'data-step': i.toString() }
            });
            
            if (i !== this.currentStep) {
                stepContainer.classList.add('oom-template-wizard-step--hidden');
            } else {
                stepContainer.classList.add('oom-template-wizard-step--visible');
            }
            
            this.stepContainers.push(stepContainer);
        }
        
        // Build the steps
        this.buildStep1();
        this.buildStep2();
        this.buildStep3();
        
        // Create collapsible preview section
        this.createPreviewSection(container);
        
        // Create navigation
        this.navigationEl = container.createDiv({ cls: 'oom-template-wizard-navigation' });
        this.updateNavigation();
        
        // Update preview initially
        this.updatePreview();
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    /**
     * Step 1: Choose creation method
     */
    private buildStep1() {
        const container = this.stepContainers[0];
        
        container.createEl('h3', { text: 'Choose Template Creation Method' });
        container.createEl('p', { 
            text: 'Select how you would like to create your journal template.' 
        });
        
        // Check if Templater is available
        const templaterEnabled = this.templaterIntegration?.isTemplaterInstalled();
        const templaterTemplates = templaterEnabled ? this.templaterIntegration?.getTemplaterTemplates() || [] : [];
        
        // Method selection
        const methodsContainer = container.createDiv({ cls: 'oom-template-methods' });
        
        // Option 1: Templater
        const templaterOption = methodsContainer.createDiv({ cls: 'oom-method-option' });
        const templaterRadio = templaterOption.createEl('input', {
            type: 'radio',
            attr: { 
                name: 'creation-method',
                value: 'templater',
                id: 'method-templater'
            }
        });
        this.methodRadios.push(templaterRadio);
        
        const templaterLabel = templaterOption.createEl('label', {
            attr: { for: 'method-templater' },
            cls: 'oom-method-label'
        });
        templaterLabel.createEl('strong', { text: 'Use Templater Template' });
        templaterLabel.createEl('br');
        templaterLabel.createEl('span', { 
            text: 'Select an existing Templater template for dynamic content generation',
            cls: 'oom-method-description'
        });
        
        if (!templaterEnabled || templaterTemplates.length === 0) {
            templaterRadio.disabled = true;
            templaterLabel.addClass('disabled');
            templaterLabel.createEl('br');
            templaterLabel.createEl('span', { 
                text: templaterEnabled ? 'No Templater templates found' : 'Templater plugin not installed',
                cls: 'oom-method-warning'
            });
        }
        
        // Option 2: Structure-based
        const structureOption = methodsContainer.createDiv({ cls: 'oom-method-option' });
        const structureRadio = structureOption.createEl('input', {
            type: 'radio',
            attr: { 
                name: 'creation-method',
                value: 'structure',
                id: 'method-structure'
            }
        });
        this.methodRadios.push(structureRadio);
        
        const structureLabel = structureOption.createEl('label', {
            attr: { for: 'method-structure' },
            cls: 'oom-method-label'
        });
        structureLabel.createEl('strong', { text: 'Create from Journal Structure' });
        structureLabel.createEl('br');
        structureLabel.createEl('span', { 
            text: 'Generate template content based on predefined journal structures',
            cls: 'oom-method-description'
        });
        
        // Option 3: Direct input
        const directOption = methodsContainer.createDiv({ cls: 'oom-method-option' });
        const directRadio = directOption.createEl('input', {
            type: 'radio',
            attr: { 
                name: 'creation-method',
                value: 'direct',
                id: 'method-direct'
            }
        });
        this.methodRadios.push(directRadio);
        
        const directLabel = directOption.createEl('label', {
            attr: { for: 'method-direct' },
            cls: 'oom-method-label'
        });
        directLabel.createEl('strong', { text: 'Direct Input' });
        directLabel.createEl('br');
        directLabel.createEl('span', { 
            text: 'Paste or type template content directly',
            cls: 'oom-method-description'
        });
        
        // Set up event listeners
        this.methodRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.state.method = radio.value as TemplateCreationMethod;
                    this.validateState();
                    this.updatePreview();
                }
            });
        });
        
        // Pre-select method if editing
        if (this.state.method) {
            const radio = this.methodRadios.find(r => r.value === this.state.method);
            if (radio) {
                radio.checked = true;
            }
        }
    }
    
    /**
     * Step 2: Method-specific configuration
     */
    private buildStep2() {
        const container = this.stepContainers[1];
        
        // This step will be dynamically populated based on the selected method
        // We'll update it in navigateToStep when the user moves to step 2
    }
    
    /**
     * Step 3: Final preview and completion
     */
    private buildStep3() {
        const container = this.stepContainers[2];
        
        // This step will be dynamically populated for structure-based method
        // We'll update it in navigateToStep when the user moves to step 3
    }
    
    /**
     * Build step 2 content based on selected method
     */
    private buildStep2Content() {
        const container = this.stepContainers[1];
        container.empty();
        
        if (!this.state.method) return;
        
        switch (this.state.method) {
            case 'templater':
                this.buildTemplaterStep(container);
                break;
            case 'structure':
                this.buildStructureStep(container);
                break;
            case 'direct':
                this.buildDirectInputStep(container);
                break;
        }
    }
    
    /**
     * Build step 3 content (only used for structure method)
     */
    private buildStep3Content() {
        const container = this.stepContainers[2];
        container.empty();
        
        if (this.state.method === 'structure') {
            this.buildFinalPreviewStep(container);
        }
    }
    
    /**
     * Build Templater configuration step
     */
    private buildTemplaterStep(container: HTMLElement) {
        container.createEl('h3', { text: 'Select Templater Template' });
        container.createEl('p', { 
            text: 'Choose a Templater template to use for this journal template.' 
        });
        
        const templaterTemplates = this.templaterIntegration?.getTemplaterTemplates() || [];
        
        new Setting(container)
            .setName('Templater Template')
            .setDesc('Select a template file from your Templater templates')
            .addDropdown(dropdown => {
                this.templaterDropdown = dropdown;
                
                dropdown.addOption('', 'Select a template...');
                
                for (const template of templaterTemplates) {
                    dropdown.addOption(template, template);
                }
                
                if (this.state.templaterFile) {
                    dropdown.setValue(this.state.templaterFile);
                }
                
                dropdown.onChange(value => {
                    this.state.templaterFile = value;
                    
                    if (value && this.templaterIntegration) {
                        // Load content and auto-generate name
                        this.state.content = this.templaterIntegration.getTemplateContent(value);
                        this.state.templateName = this.generateTemplateNameFromFile(value);
                    }
                    
                    this.validateState();
                    this.updatePreview();
                });
            });
        
        // Template details section
        if (this.state.templaterFile) {
            this.addTemplateDetailsSection(container);
        }
    }
    
    /**
     * Build structure selection step
     */
    private buildStructureStep(container: HTMLElement) {
        container.createEl('h3', { text: 'Select Journal Structure' });
        container.createEl('p', { 
            text: 'Choose a journal structure to generate template content.' 
        });
        
        const structures = this.plugin.settings.linting.structures;
        
        new Setting(container)
            .setName('Journal Structure')
            .setDesc('Select a structure for this template')
            .addDropdown(dropdown => {
                this.structureDropdown = dropdown;
                
                dropdown.addOption('', 'Select a structure...');
                
                for (const structure of structures) {
                    dropdown.addOption(structure.id, structure.name);
                }
                
                if (this.state.structure) {
                    dropdown.setValue(this.state.structure.id);
                }
                
                dropdown.onChange(value => {
                    const structure = structures.find(s => s.id === value);
                    this.state.structure = structure || null;
                    
                    if (structure) {
                        // Auto-generate template name
                        this.state.templateName = `${structure.name} Template`;
                        this.state.templateDescription = `Template based on ${structure.name}`;
                    }
                    
                    this.validateState();
                    this.updatePreview();
                    
                    // Update structure details
                    this.updateStructureDetails(container, structure);
                });
            });
        
        // Structure details placeholder
        container.createDiv({ cls: 'oom-structure-details' });
        
        // Structure management buttons
        const actionsContainer = container.createDiv({ cls: 'oom-structure-actions' });
        
        new Setting(actionsContainer)
            .setName('Structure Management')
            .setDesc('Create, edit, or delete journal structures')
            .addButton(button => button
                .setButtonText('Manage Structures')
                .onClick(() => {
                    // TODO: Open structure management modal
                    new Notice('Structure management not yet implemented');
                }));
    }
    
    /**
     * Build direct input step
     */
    private buildDirectInputStep(container: HTMLElement) {
        container.createEl('h3', { text: 'Template Content' });
        container.createEl('p', { 
            text: 'Enter or paste your template content directly.' 
        });
        
        // Template metadata
        new Setting(container)
            .setName('Template Name')
            .setDesc('A name for this template')
            .addText(text => {
                this.nameInput = text;
                text.setValue(this.state.templateName)
                    .setPlaceholder('My Custom Template')
                    .onChange(value => {
                        this.state.templateName = value;
                        this.validateState();
                    });
            });
            
        new Setting(container)
            .setName('Description')
            .setDesc('A brief description of this template')
            .addText(text => {
                this.descInput = text;
                text.setValue(this.state.templateDescription)
                    .setPlaceholder('Custom template for dream journaling')
                    .onChange(value => {
                        this.state.templateDescription = value;
                    });
            });
        
        // Content area
        const contentSection = container.createDiv({ cls: 'oom-content-section' });
        
        new Setting(contentSection)
            .setName('Template Content')
            .setDesc('Enter the content for your template')
            .setHeading();
        
        // Helper buttons
        const helpersContainer = contentSection.createDiv({ cls: 'oom-content-helpers' });
        
        new ButtonComponent(helpersContainer)
            .setButtonText('Insert Sample')
            .onClick(() => this.insertSampleContent());
            
        new ButtonComponent(helpersContainer)
            .setButtonText('Clear')
            .onClick(() => {
                this.state.content = '';
                this.contentArea.setValue('');
                this.updatePreview();
            });
        
        // Content text area
        const contentAreaContainer = contentSection.createDiv({ cls: 'oom-template-content-container' });
        
        this.contentArea = new TextAreaComponent(contentAreaContainer);
        this.contentArea.inputEl.addClass('oom-template-content');
        this.contentArea.setValue(this.state.content);
        this.contentArea.onChange(value => {
            this.state.content = value;
            
            // Auto-suggest template name from content if empty
            if (!this.state.templateName && value) {
                this.state.templateName = this.generateTemplateNameFromContent(value);
                if (this.nameInput) {
                    this.nameInput.setValue(this.state.templateName);
                }
            }
            
            this.validateState();
            this.updatePreview();
        });
        
        // Make the text area larger using CSS class
        this.contentArea.inputEl.classList.add('oom-template-wizard-content-area');
    }
    
    /**
     * Build final preview step (for structure method)
     */
    private buildFinalPreviewStep(container: HTMLElement) {
        container.createEl('h3', { text: 'Template Preview' });
        container.createEl('p', { 
            text: 'Review your generated template and click Finish to save.' 
        });
        
        if (this.state.structure) {
            // Generate content from structure
            this.state.content = this.generateContentFromStructure(this.state.structure);
            
            // Show structure info
            const structureInfo = container.createDiv({ cls: 'oom-final-structure-info' });
            structureInfo.createEl('p', { 
                text: `Generated from: ${this.state.structure.name}`,
                cls: 'oom-structure-name'
            });
            
            structureInfo.createEl('p', { 
                text: `Type: ${this.state.structure.type === 'nested' ? 'Nested' : 'Flat'}`,
                cls: 'oom-structure-type'
            });
        }
        
        // Content preview
        const previewContainer = container.createDiv({ cls: 'oom-final-preview' });
        previewContainer.createEl('h4', { text: 'Template Content' });
        
        const contentEl = previewContainer.createEl('pre', { 
            cls: 'oom-markdown-preview',
            text: this.state.content
        });
    }
    
    /**
     * Create collapsible preview section
     */
    private createPreviewSection(container: HTMLElement) {
        const previewContainer = container.createDiv({ cls: 'oom-template-preview-container' });
        
        const previewHeader = previewContainer.createDiv({ cls: 'oom-template-preview-header' });
        previewHeader.createEl('h3', { text: 'Live Preview' });
        
        // Add toggle button
        const toggleButton = previewHeader.createDiv({ cls: 'oom-preview-toggle' });
        toggleButton.innerHTML = '<svg viewBox="0 0 100 100" class="oom-chevron-down"><path fill="none" stroke="currentColor" stroke-width="15" d="M10,30 L50,70 L90,30"/></svg>';
        
        // Preview content (initially expanded)
        this.previewEl = previewContainer.createDiv({ cls: 'oom-template-preview' });
        
        // Toggle preview when clicking header
        previewHeader.addEventListener('click', () => {
            const isCollapsed = previewContainer.hasClass('collapsed');
            previewContainer.toggleClass('collapsed', !isCollapsed);
            toggleButton.toggleClass('collapsed', !isCollapsed);
        });
    }
    
    /**
     * Update preview based on current state
     */
    private updatePreview() {
        this.previewEl.empty();
        
        // Template name and description
        const headerEl = this.previewEl.createDiv({ cls: 'oom-preview-header' });
        headerEl.createEl('h4', { 
            text: this.state.templateName || 'Untitled Template',
            cls: 'oom-preview-title'
        });
        
        if (this.state.templateDescription) {
            headerEl.createEl('p', { 
                text: this.state.templateDescription,
                cls: 'oom-preview-description'
            });
        }
        
        // Method info
        if (this.state.method) {
            const methodInfo = this.previewEl.createDiv({ cls: 'oom-preview-method' });
            let methodText = '';
            
            switch (this.state.method) {
                case 'templater':
                    methodText = `Templater: ${this.state.templaterFile || 'Not selected'}`;
                    break;
                case 'structure':
                    methodText = `Structure: ${this.state.structure?.name || 'Not selected'}`;
                    break;
                case 'direct':
                    methodText = 'Direct Input';
                    break;
            }
            
            methodInfo.createEl('span', { 
                text: methodText,
                cls: 'oom-preview-method-text'
            });
        }
        
        // Divider
        this.previewEl.createEl('hr');
        
        // Content preview
        const contentPreview = this.previewEl.createDiv({ cls: 'oom-preview-content' });
        
        let contentToShow = this.state.content;
        
        // Generate preview content if needed
        if (!contentToShow && this.state.method === 'structure' && this.state.structure) {
            contentToShow = this.generateContentFromStructure(this.state.structure);
        }
        
        if (contentToShow) {
            contentPreview.createEl('pre', { 
                cls: 'oom-markdown-preview',
                text: contentToShow
            });
        } else {
            contentPreview.createEl('p', { 
                text: 'No content to preview yet.',
                cls: 'oom-preview-empty'
            });
        }
    }
    
    /**
     * Update navigation buttons
     */
    private updateNavigation() {
        this.navigationEl.empty();
        
        const buttonContainer = this.navigationEl.createDiv({ cls: 'oom-button-container' });
        
        // Back button (if not on first step)
        if (this.currentStep > 1) {
            new ButtonComponent(buttonContainer)
                .setButtonText('Back')
                .onClick(() => {
                    this.navigateToStep(this.currentStep - 1);
                });
        }
        
        // Next/Finish button
        const isLastStep = this.currentStep === this.totalSteps;
        const nextButton = new ButtonComponent(buttonContainer)
            .setButtonText(isLastStep ? 'Finish' : 'Next')
            .setCta();
            
        // Enable/disable based on validation
        if (!this.state.isValid) {
            nextButton.setDisabled(true);
        }
        
        nextButton.onClick(() => {
            if (isLastStep) {
                this.finishWizard();
            } else {
                this.navigateToStep(this.currentStep + 1);
            }
        });
        
        // Cancel button
        new ButtonComponent(buttonContainer)
            .setButtonText('Cancel')
            .onClick(() => {
                this.close();
            });
        
        // Step indicator
        this.navigationEl.createEl('div', { 
            text: `Step ${this.currentStep} of ${this.totalSteps}`,
            cls: 'oom-step-indicator'
        });
    }
    
    /**
     * Navigate to a specific step
     */
    private navigateToStep(step: number) {
        if (step < 1 || step > this.totalSteps) {
            return;
        }
        
        // Hide current step
        if (this.stepContainers[this.currentStep - 1]) {
            this.stepContainers[this.currentStep - 1].classList.remove('oom-template-wizard-step--visible');
            this.stepContainers[this.currentStep - 1].classList.add('oom-template-wizard-step--hidden');
        }
        
        // Update current step
        this.currentStep = step;
        
        // Build step content if needed
        if (step === 2) {
            this.buildStep2Content();
        } else if (step === 3) {
            this.buildStep3Content();
        }
        
        // Show new step
        if (this.stepContainers[this.currentStep - 1]) {
            this.stepContainers[this.currentStep - 1].classList.remove('oom-template-wizard-step--hidden');
            this.stepContainers[this.currentStep - 1].classList.add('oom-template-wizard-step--visible');
        }
        
        // Update navigation
        this.updateNavigation();
        this.updatePreview();
    }
    
    /**
     * Validate current state
     */
    private validateState() {
        let isValid = false;
        
        switch (this.state.method) {
            case 'templater':
                isValid = !!this.state.templaterFile;
                break;
            case 'structure':
                isValid = !!this.state.structure;
                break;
            case 'direct':
                isValid = !!(this.state.templateName && this.state.content);
                break;
            default:
                isValid = false;
        }
        
        this.state.isValid = isValid;
        this.updateNavigation();
    }
    
    /**
     * Generate template name from file
     */
    private generateTemplateNameFromFile(filename: string): string {
        // Remove extension and convert to title case
        const name = filename.replace(/\.[^/.]+$/, '');
        return name.replace(/[-_]/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase()) + ' Template';
    }
    
    /**
     * Generate template name from content
     */
    private generateTemplateNameFromContent(content: string): string {
        // Try to extract from first heading
        const headingMatch = content.match(/^#\s+(.+)$/m);
        if (headingMatch) {
            return headingMatch[1] + ' Template';
        }
        
        // Try to extract from first callout
        const calloutMatch = content.match(/>\s*\[!([^\]]+)\]/);
        if (calloutMatch) {
            return calloutMatch[1].replace(/-/g, ' ')
                              .replace(/\b\w/g, l => l.toUpperCase()) + ' Template';
        }
        
        return 'Custom Template';
    }
    
    /**
     * Generate content from structure
     */
    private generateContentFromStructure(structure: CalloutStructure): string {
        let content = `# Dream Journal Entry\n\n`;
        
        if (structure.type === 'nested') {
            // For nested structures
            content += `> [!${structure.rootCallout}]\n> Enter your dream here.\n>\n`;
            
            // Add child callouts as nested
            for (const callout of structure.childCallouts) {
                content += `> > [!${callout}]\n`;
                content += `> > ${this.getPlaceholderForCallout(callout)}\n`;
                
                // Add metrics callout nested inside this child callout
                if (structure.metricsCallout) {
                    content += `> >\n> > > [!${structure.metricsCallout}]\n`;
                    
                    // Add enabled metrics
                    const enabledMetrics = this.getEnabledMetrics();
                    if (enabledMetrics.length > 0) {
                        for (const metric of enabledMetrics) {
                            content += `> > > ${metric.name}: ${metric.minValue}-${metric.maxValue}\n`;
                        }
                    } else {
                        // Fallback metrics
                        content += `> > > Words: 1-1000\n`;
                        content += `> > > Sensory Detail: 1-5\n`;
                        content += `> > > Emotional Recall: 1-5\n`;
                        content += `> > > Lost Segments: 1-5\n`;
                        content += `> > > Descriptiveness: 1-5\n`;
                        content += `> > > Confidence Score: 1-5\n`;
                    }
                }
                content += `>\n`;
            }
        } else {
            // For flat structures
            content += `> [!${structure.rootCallout}]\n> Enter your dream here.\n\n`;
            
            // Add child callouts as separate
            for (const callout of structure.childCallouts) {
                if (callout === structure.metricsCallout) continue;
                content += `> [!${callout}]\n> ${this.getPlaceholderForCallout(callout)}\n\n`;
            }
            
            // Add metrics callout last
            if (structure.metricsCallout) {
                content += `> [!${structure.metricsCallout}]\n`;
                
                const enabledMetrics = this.getEnabledMetrics();
                if (enabledMetrics.length > 0) {
                    for (const metric of enabledMetrics) {
                        content += `> ${metric.name}: ${metric.minValue}-${metric.maxValue}\n`;
                    }
                } else {
                    content += `> Words: 1-1000\n`;
                    content += `> Sensory Detail: 1-5\n`;
                    content += `> Emotional Recall: 1-5\n`;
                    content += `> Lost Segments: 1-5\n`;
                    content += `> Descriptiveness: 1-5\n`;
                    content += `> Confidence Score: 1-5\n`;
                }
            }
        }
        
        return content;
    }
    
    /**
     * Get enabled metrics from plugin settings
     */
    private getEnabledMetrics(): DreamMetric[] {
        if (!this.plugin.settings.metrics) {
            return [];
        }
        
        return Object.values(this.plugin.settings.metrics)
            .filter((metric: any) => metric.enabled === true)
            .map(metric => metric as DreamMetric);
    }
    
    /**
     * Get placeholder text for a callout type
     */
    private getPlaceholderForCallout(callout: string): string {
        const lowerCallout = callout.toLowerCase();
        
        if (lowerCallout.includes('symbol')) {
            return '- Symbol 1: Meaning\n> > - Symbol 2: Meaning';
        } else if (lowerCallout.includes('reflection')) {
            return 'Add your reflections here.';
        } else if (lowerCallout.includes('emotion')) {
            return 'How did you feel in the dream? How do you feel now?';
        } else if (lowerCallout.includes('interpretation')) {
            return 'What might this dream mean?';
        } else if (lowerCallout.includes('action')) {
            return 'What actions will you take based on this dream?';
        } else if (lowerCallout.includes('diary')) {
            return 'Add dream-diary content here.';
        } else {
            return `Add ${callout} content here.`;
        }
    }
    
    /**
     * Insert sample content for direct input
     */
    private insertSampleContent() {
        const sampleContent = `# Dream Journal Entry

> [!journal-entry]
> Enter your dream here.
>
> > [!dream-diary]
> > Add dream-diary content here.
> >
> > > [!dream-metrics]
> > > Words: 1-1000
> > > Sensory Detail: 1-5
> > > Emotional Recall: 1-5
> > > Lost Segments: 1-5
> > > Descriptiveness: 1-5
> > > Confidence Score: 1-5`;

        this.state.content = sampleContent;
        if (this.contentArea) {
            this.contentArea.setValue(sampleContent);
        }
        this.updatePreview();
    }
    
    /**
     * Add template details section for Templater
     */
    private addTemplateDetailsSection(container: HTMLElement) {
        const detailsContainer = container.createDiv({ cls: 'oom-template-details' });
        
        detailsContainer.createEl('h4', { text: 'Template Details' });
        
        new Setting(detailsContainer)
            .setName('Template Name')
            .setDesc('Name for this template (auto-generated from file)')
            .addText(text => {
                text.setValue(this.state.templateName)
                    .onChange(value => {
                        this.state.templateName = value;
                        this.validateState();
                    });
            });
            
        new Setting(detailsContainer)
            .setName('Description')
            .setDesc('Optional description for this template')
            .addText(text => {
                text.setValue(this.state.templateDescription)
                    .setPlaceholder('Template description...')
                    .onChange(value => {
                        this.state.templateDescription = value;
                    });
            });
    }
    
    /**
     * Update structure details display
     */
    private updateStructureDetails(container: HTMLElement, structure: CalloutStructure | null) {
        const detailsEl = container.querySelector('.oom-structure-details') as HTMLElement;
        if (!detailsEl) return;
        
        detailsEl.empty();
        
        if (!structure) return;
        
        detailsEl.createEl('h4', { text: 'Structure Details' });
        
        const details = detailsEl.createEl('div', { cls: 'oom-structure-info' });
        
        details.createEl('p', { 
            text: `Type: ${structure.type === 'nested' ? 'Nested' : 'Flat'}`
        });
        
        details.createEl('p', { 
            text: `Root Callout: ${structure.rootCallout}`
        });
        
        if (structure.childCallouts.length > 0) {
            details.createEl('p', { 
                text: `Child Callouts: ${structure.childCallouts.join(', ')}`
            });
        }
        
        if (structure.metricsCallout) {
            details.createEl('p', { 
                text: `Metrics Callout: ${structure.metricsCallout}`
            });
        }
        
        if (structure.requiredFields.length > 0) {
            details.createEl('p', { 
                text: `Required: ${structure.requiredFields.join(', ')}`
            });
        }
    }
    
    /**
     * Finish the wizard and save the template
     */
    private finishWizard() {
        if (!this.state.isValid) {
            new Notice('Please complete all required fields.');
            return;
        }
        
        // Ensure we have all required data
        if (!this.state.templateName) {
            new Notice('Please enter a template name.');
            return;
        }
        
        if (!this.state.content) {
            new Notice('Template content is required.');
            return;
        }
        
        // Create template object
        const template: JournalTemplate = {
            id: this.editingTemplate?.id || `template-${Date.now()}`,
            name: this.state.templateName,
            description: this.state.templateDescription,
            structure: this.state.structure?.id || '',
            content: this.state.content,
            isTemplaterTemplate: this.state.method === 'templater',
            templaterFile: this.state.method === 'templater' ? this.state.templaterFile : undefined,
            staticContent: this.state.method === 'templater' ? this.state.content : undefined
        };
        
        // Save template
        this.saveTemplate(template);
    }
    
    /**
     * Save template to settings
     */
    private async saveTemplate(template: JournalTemplate) {
        try {
            // Ensure linting settings exist with proper structure
            if (!this.plugin.settings.linting) {
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
                } as JournalStructureSettings;
            }
            
            if (!this.plugin.settings.linting.templates) {
                this.plugin.settings.linting.templates = [];
            }
            
            const templates = this.plugin.settings.linting.templates;
            
            // If editing, replace existing; otherwise add new
            const existingIndex = templates.findIndex(t => t.id === template.id);
            if (existingIndex >= 0) {
                templates[existingIndex] = template;
            } else {
                templates.push(template);
            }
            
            // Save settings
            await this.plugin.saveSettings();
            
            const logger = getLogger('UnifiedTemplateWizard');
            logger.debug('Template', 'Template saved successfully:', template);
            
            new Notice(`Template "${template.name}" saved successfully!`);
            this.close();
            
        } catch (error) {
            const logger = getLogger('UnifiedTemplateWizard');
            logger.error('Template', 'Failed to save template:', error);
            new Notice('Failed to save template. Please try again.');
        }
    }
} 