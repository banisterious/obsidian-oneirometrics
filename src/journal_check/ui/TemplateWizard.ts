import { App, Modal, Setting, MarkdownRenderer, ToggleComponent, TextComponent, TextAreaComponent, DropdownComponent, ButtonComponent, Notice } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
import { CalloutStructure, JournalTemplate } from '../types';
import { TemplaterIntegration } from '../TemplaterIntegration';
import { DreamMetric } from '../../types';

/**
 * Wizard for creating or editing journal templates
 */
export class TemplateWizard extends Modal {
    private currentStep = 1;
    private totalSteps = 4;
    private stepContainers: HTMLElement[] = [];
    private navigationEl: HTMLElement;
    private previewEl: HTMLElement;
    
    // Template data
    private templateId: string = '';
    private templateName: string = '';
    private templateDescription: string = '';
    private structureId: string = '';
    private useTemplater: boolean = false;
    private templaterFile: string = '';
    private content: string = '';
    private staticContent: string = '';
    
    // Components
    private nameInput: TextComponent;
    private descInput: TextComponent;
    private structureDropdown: DropdownComponent;
    private templaterDropdown: DropdownComponent;
    private contentArea: TextAreaComponent;
    
    constructor(
        app: App,
        private plugin: any,
        private templaterIntegration?: TemplaterIntegration,
        private editingTemplate?: JournalTemplate
    ) {
        super(app);
        
        // Initialize templaterIntegration if not provided
        if (!this.templaterIntegration && this.plugin.templaterIntegration) {
            this.templaterIntegration = this.plugin.templaterIntegration;
        }
        
        // If editing an existing template, populate the fields
        if (editingTemplate) {
            this.templateId = editingTemplate.id;
            this.templateName = editingTemplate.name;
            this.templateDescription = editingTemplate.description;
            this.structureId = editingTemplate.structure;
            this.useTemplater = editingTemplate.isTemplaterTemplate;
            this.templaterFile = editingTemplate.templaterFile || '';
            this.content = editingTemplate.content;
        } else {
            // Generate a new ID
            this.templateId = `template-${Date.now()}`;
        }
    }
    
    onOpen() {
        const { contentEl } = this;
        
        contentEl.addClass('oom-dream-journal-template-wizard');
        
        // Create header
        contentEl.createEl('h2', { 
            text: this.editingTemplate 
                ? `Edit Template: ${this.templateName}`
                : 'Create Journal Template' 
        });
        
        // Create single column layout
        const container = contentEl.createDiv({ cls: 'oom-template-wizard-container-single' });
        
        // Create step containers
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepContainer = container.createDiv({ 
                cls: `oom-template-wizard-step step-${i}`,
                attr: { 'data-step': i.toString() }
            });
            
            if (i !== this.currentStep) {
                stepContainer.style.display = 'none';
            }
            
            this.stepContainers.push(stepContainer);
        }
        
        // Build the steps
        this.buildStep1();
        this.buildStep2();
        this.buildStep3();
        this.buildStep4();
        
        // Create collapsible preview section
        const previewContainer = container.createDiv({ cls: 'oom-template-preview-container' });
        
        const previewHeader = previewContainer.createDiv({ cls: 'oom-template-preview-header' });
        previewHeader.createEl('h3', { text: 'Preview' });
        
        // Add toggle button
        const toggleButton = previewHeader.createDiv({ cls: 'oom-preview-toggle' });
        toggleButton.innerHTML = '<svg viewBox="0 0 100 100" class="oom-chevron-down"><path fill="none" stroke="currentColor" stroke-width="15" d="M10,30 L50,70 L90,30"/></svg>';
        
        // Preview content (initially expanded)
        this.previewEl = previewContainer.createDiv({ cls: 'oom-template-preview' });
        this.updatePreview();
        
        // Toggle preview when clicking header
        previewHeader.addEventListener('click', () => {
            const isCollapsed = previewContainer.hasClass('collapsed');
            previewContainer.toggleClass('collapsed', !isCollapsed);
            toggleButton.toggleClass('collapsed', !isCollapsed);
        });
        
        // Create navigation buttons
        this.navigationEl = container.createDiv({ cls: 'oom-template-wizard-navigation' });
        this.updateNavigation();
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    /**
     * Step 1: Basic template information
     */
    private buildStep1() {
        const container = this.stepContainers[0];
        
        container.createEl('h3', { text: 'Step 1: Basic Information' });
        container.createEl('p', { 
            text: 'Enter the basic information for your journal template.' 
        });
        
        new Setting(container)
            .setName('Template Name')
            .setDesc('A name for this template')
            .addText(text => {
                this.nameInput = text;
                text.setValue(this.templateName)
                    .setPlaceholder('My Dream Journal')
                    .onChange(value => {
                        this.templateName = value;
                        this.updatePreview();
                    });
            });
            
        new Setting(container)
            .setName('Description')
            .setDesc('A brief description of this template')
            .addText(text => {
                this.descInput = text;
                text.setValue(this.templateDescription)
                    .setPlaceholder('A template for recording dream journal entries')
                    .onChange(value => {
                        this.templateDescription = value;
                    });
            });
    }
    
    /**
     * Step 2: Structure selection
     */
    private buildStep2() {
        const container = this.stepContainers[1];
        
        container.createEl('h3', { text: 'Step 2: Journal Structure' });
        container.createEl('p', { 
            text: 'Select a journal structure for your template.' 
        });
        
        // Get available structures
        const structures = this.plugin.settings.linting.structures;
        
        new Setting(container)
            .setName('Structure')
            .setDesc('Select a structure for this template')
            .addDropdown(dropdown => {
                this.structureDropdown = dropdown;
                
                // Add each structure as an option
                for (const structure of structures) {
                    dropdown.addOption(structure.id, structure.name);
                }
                
                // Set the current value
                if (this.structureId) {
                    dropdown.setValue(this.structureId);
                } else if (structures.length > 0) {
                    this.structureId = structures[0].id;
                    dropdown.setValue(this.structureId);
                }
                
                dropdown.onChange(value => {
                    this.structureId = value;
                    this.updatePreview();
                    
                    // Update guidance based on selected structure
                    const structure = structures.find((s: CalloutStructure) => s.id === value);
                    if (structure) {
                        this.updateStructureGuidance(structure);
                    }
                });
                
                // Initial guidance update
                if (this.structureId) {
                    const structure = structures.find((s: CalloutStructure) => s.id === this.structureId);
                    if (structure) {
                        this.updateStructureGuidance(structure);
                    }
                }
            });
        
        // Placeholder for structure guidance
        container.createDiv({ cls: 'oom-structure-guidance' });
        
        // Add button to create a new structure if one doesn't exist
        new Setting(container)
            .setName('Create New Structure')
            .setDesc('Don\'t see a structure you like? Create a new one.')
            .addButton(button => button
                .setButtonText('Create Structure')
                .onClick(() => {
                    // Open the structure creation modal
                    // This would need to be implemented separately
                    alert('Structure creation not yet implemented');
                    
                    // After creation, we would refresh the dropdown options
                    // this.refreshStructureDropdown();
                }));
    }
    
    /**
     * Step 3: Template content
     */
    private buildStep3() {
        const container = this.stepContainers[2];
        
        container.createEl('h3', { text: 'Step 3: Template Content' });
        container.createEl('p', { 
            text: 'Create the content for your template.' 
        });
        
        // Check if Templater is available
        const templaterEnabled = this.templaterIntegration && this.templaterIntegration.isTemplaterInstalled();
        
        // Templater toggle
        new Setting(container)
            .setName('Use Templater')
            .setDesc('Use a Templater template for dynamic content')
            .addToggle(toggle => {
                toggle.setValue(this.useTemplater)
                    .setDisabled(!templaterEnabled)
                    .onChange(value => {
                        this.useTemplater = value;
                        this.updateTemplaterSection(value);
                        this.updatePreview();
                    });
            });
        
        // Templater template selection
        const templaterSection = container.createDiv({ cls: 'oom-templater-section' });
        
        if (!templaterEnabled) {
            const warningEl = templaterSection.createDiv({ cls: 'oom-templater-warning' });
            warningEl.createEl('p', { 
                text: 'Templater plugin is not installed or enabled. You can still create a template, but without dynamic content.' 
            });
        }
        
        new Setting(templaterSection)
            .setName('Templater Template')
            .setDesc('Select a Templater template to use')
            .addDropdown(dropdown => {
                this.templaterDropdown = dropdown;
                
                // Add empty option
                dropdown.addOption('', 'Select a template...');
                
                // Get Templater templates if available
                if (templaterEnabled) {
                    const hasTemplaterSupport = this.templaterIntegration?.isTemplaterInstalled();
                    
                    if (hasTemplaterSupport) {
                        const templates = this.templaterIntegration?.getTemplaterTemplates() || [];
                        
                        if (templates.length === 0) {
                            dropdown.addOption('no-templates', 'No templates found');
                            dropdown.setDisabled(true);
                        } else {
                            for (const template of templates) {
                                dropdown.addOption(template, template);
                            }
                        }
                        
                        // Set the current value
                        if (this.templaterFile) {
                            dropdown.setValue(this.templaterFile);
                        }
                        
                        dropdown.onChange(value => {
                            this.templaterFile = value;
                            
                            // Load the content from the templater file
                            if (value && this.templaterIntegration) {
                                const content = this.templaterIntegration.getTemplateContent(value);
                                this.content = content;
                                this.contentArea.setValue(content);
                                this.updatePreview();
                            }
                        });
                    }
                } else {
                    dropdown.addOption('templater-disabled', 'Templater not available');
                    dropdown.setDisabled(true);
                }
            });
        
        // Make sure the templater section is initially hidden if not using templater
        templaterSection.style.display = this.useTemplater ? 'block' : 'none';
        
        // Content area for manual editing
        const contentSection = container.createDiv({ cls: 'oom-content-section' });
        
        new Setting(contentSection)
            .setName('Template Content')
            .setDesc('Create the content for your template')
            .setHeading();
        
        const contentAreaContainer = contentSection.createDiv({
            cls: 'oom-template-content-container'
        });
        
        this.contentArea = new TextAreaComponent(contentAreaContainer);
        this.contentArea.inputEl.addClass('oom-template-content');
        this.contentArea.setValue(this.content || this.getDefaultContent());
        this.contentArea.onChange(value => {
            this.content = value;
            this.updatePreview();
        });
    }
    
    /**
     * Update the static preview with converted template content
     */
    private updateStaticPreview(content: string) {
        if (!content) {
            this.staticContent = '';
            return;
        }
        
        // Convert to static content if using Templater
        if (this.useTemplater && this.templaterIntegration) {
            const staticContent = this.templaterIntegration.convertToStaticTemplate(content);
            this.staticContent = staticContent;
        } else {
            this.staticContent = content;
        }
    }
    
    /**
     * Step 4: Template content
     */
    private buildStep4() {
        const container = this.stepContainers[3];
        
        container.createEl('h3', { text: 'Step 4: Template Content' });
        container.createEl('p', { 
            text: 'Enter the template content based on the selected structure.' 
        });
        
        // Get the structure details for guidance
        if (this.structureId) {
            const structure = this.plugin.settings.linting.structures.find((s: CalloutStructure) => s.id === this.structureId);
            
            if (structure) {
                container.createEl('p', { 
                    text: `Creating template for: ${structure.name}`, 
                    cls: 'oom-structure-selected-info'
                });
                
                container.createEl('p', { 
                    text: structure.type === 'nested' 
                        ? 'This is a NESTED structure where child callouts will be created inside the root callout.'
                        : 'This is a FLAT structure where all callouts will be at the same level.',
                    cls: 'oom-structure-type-info'
                });
            }
        }
        
        // Only show the content editor if not using Templater
        if (!this.useTemplater) {
            const editorContainer = container.createDiv({ cls: 'oom-template-editor-container' });
            
            // Add a button to generate default content
            new Setting(editorContainer)
                .setName('Template Content')
                .setDesc('Enter the content for your template or click to generate based on structure')
                .addButton(button => {
                    button
                        .setButtonText('Generate Default Content')
                        .onClick(() => {
                            const defaultContent = this.getDefaultContent();
                            this.content = defaultContent;
                            this.contentArea.setValue(defaultContent);
                            this.updatePreview();
                        });
                });
            
            // Text area for manual editing
            this.contentArea = new TextAreaComponent(editorContainer)
                .setValue(this.content)
                .setPlaceholder('Enter template content here...')
                .onChange(value => {
                    this.content = value;
                    this.updatePreview();
                });
            
            // Make the text area larger
            this.contentArea.inputEl.style.height = '300px';
            this.contentArea.inputEl.style.width = '100%';
        } else {
            container.createEl('p', { 
                text: 'Using Templater template. Content will be dynamically generated.',
                cls: 'oom-templater-info'
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
        new ButtonComponent(buttonContainer)
            .setButtonText(isLastStep ? 'Finish' : 'Next')
            .setCta()
            .onClick(() => {
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
            this.stepContainers[this.currentStep - 1].style.display = 'none';
        }
        
        // Show new step
        this.currentStep = step;
        if (this.stepContainers[this.currentStep - 1]) {
            this.stepContainers[this.currentStep - 1].style.display = 'block';
        }
        
        // Update navigation
        this.updateNavigation();
    }
    
    /**
     * Update preview based on current settings
     */
    private updatePreview() {
        this.previewEl.empty();
        
        // Add template name as title
        this.previewEl.createEl('h4', { 
            text: this.templateName || 'Untitled Template',
            cls: 'oom-preview-title'
        });
        
        // Show structure details if available
        const structure = this.structureId 
            ? this.plugin.settings.linting.structures.find((s: CalloutStructure) => s.id === this.structureId)
            : null;
            
        if (structure) {
            // Add a structure info container 
            const structureInfo = this.previewEl.createDiv({ cls: 'oom-preview-structure-info' });
            
            const structureDetails = structureInfo.createDiv({ cls: 'oom-preview-structure-details' });
            
            // Show structure name and type in a row
            const typeRow = structureDetails.createDiv({ cls: 'oom-preview-row' });
            typeRow.createSpan({ 
                text: `Structure: ${structure.name}`,
                cls: 'oom-preview-structure'
            });
            
            typeRow.createSpan({
                text: `Type: ${structure.type === 'nested' ? 'Nested' : 'Flat'}`,
                cls: `oom-preview-structure-type oom-preview-${structure.type}`
            });
            
            // Show required fields
            if (structure.requiredFields.length > 0) {
                structureDetails.createDiv({ 
                    text: `Required callouts: ${structure.requiredFields.join(', ')}`,
                    cls: 'oom-preview-required-fields'
                });
            }
        }
        
        // Add divider
        this.previewEl.createEl('hr');
        
        // Show sample content
        const previewContent = this.previewEl.createDiv({ cls: 'oom-preview-content' });
        
        if (this.content) {
            // Create a "read-only" version for preview
            const contentEl = previewContent.createDiv({ cls: 'oom-markdown-preview' });
            contentEl.setText(this.content);
        } else {
            previewContent.createEl('p', { 
                text: 'No content yet. Complete the wizard to generate content.',
                cls: 'oom-preview-empty'
            });
        }
    }
    
    /**
     * Update visibility of Templater section
     */
    private updateTemplaterSection(visible: boolean) {
        const templaterSection = document.querySelector('.oom-templater-section') as HTMLElement;
        if (templaterSection) {
            templaterSection.style.display = visible ? 'block' : 'none';
        }
    }
    
    /**
     * Update structure guidance
     */
    private updateStructureGuidance(structure: CalloutStructure) {
        const guidanceEl = document.querySelector('.oom-structure-guidance') as HTMLElement;
        if (!guidanceEl) return;
        
        guidanceEl.empty();
        
        guidanceEl.createEl('h4', { text: 'Structure Details' });
        
        const structureDetails = guidanceEl.createEl('ul', { cls: 'oom-structure-details' });
        
        structureDetails.createEl('li', { 
            text: `Type: ${structure.type === 'nested' ? 'Nested' : 'Flat'}`
        });
        
        structureDetails.createEl('li', { 
            text: `Root Callout: ${structure.rootCallout}`
        });
        
        structureDetails.createEl('li', { 
            text: `Child Callouts: ${structure.childCallouts.join(', ')}`
        });
        
        structureDetails.createEl('li', { 
            text: `Required Fields: ${structure.requiredFields.length > 0 ? structure.requiredFields.join(', ') : 'None'}`
        });
        
        // Show guidance based on structure type
        let guidance = '';
        if (structure.type === 'nested') {
            guidance = `
                For nested structures, use multiple > characters to create nested callouts:
                
                > [!${structure.rootCallout}]
                > Root callout content
                >
                >> [!${structure.childCallouts[0] || 'child'}]
                >> Child callout content
            `;
        } else {
            guidance = `
                For flat structures, all callouts should be at the same level:
                
                > [!${structure.rootCallout}]
                > Root callout content
                
                > [!${structure.childCallouts[0] || 'child'}]
                > Child callout content
            `;
        }
        
        guidanceEl.createEl('pre', { 
            text: guidance.trim(),
            cls: 'oom-structure-guidance-example'
        });
    }
    
    /**
     * Get default content based on selected structure
     */
    private getDefaultContent(): string {
        const structures = this.plugin.settings.linting.structures;
        const structure = structures.find((s: CalloutStructure) => s.id === this.structureId);
        
        if (!structure) {
            return '# Dream Journal Entry\n\n> [!dream]\n> Enter your dream here.';
        }
        
        let content = `# Dream Journal Entry\n\n`;
        
        if (structure.type === 'nested') {
            // For nested structures, format with the root callout and nested children
            content += `> [!${structure.rootCallout}]\n> Enter your dream here.\n>\n`;
            
            // Add child callouts as nested - use proper nesting syntax with double >
            for (const callout of structure.childCallouts) {
                // Skip metrics callout to add it last
                if (callout === structure.metricsCallout) continue; 
                
                // Proper nesting format with double >
                content += `> > [!${callout}]\n`;
                content += `> > ${this.getPlaceholderForCallout(callout)}\n>\n`;
            }
            
            // Add metrics callout last if defined
            if (structure.metricsCallout && structure.childCallouts.includes(structure.metricsCallout)) {
                content += `> > [!${structure.metricsCallout}]\n`;
                
                // Add enabled metrics from settings
                const enabledMetrics = this.getEnabledMetrics();
                if (enabledMetrics.length > 0) {
                    for (const metric of enabledMetrics) {
                        // Use type assertion to access range property
                        const metricAny = metric as any;
                        content += `> > ${metric.name}: ${metricAny.range ? metricAny.range : `${metricAny.min || 1}-${metricAny.max || 10}`}\n`;
                    }
                } else {
                    // Fallback to default metrics if none are enabled
                    content += `> > Clarity: 1-10\n`;
                    content += `> > Vividness: 1-10\n`;
                    content += `> > Coherence: 1-10\n`;
                    content += `> > Emotional Intensity: 1-10\n`;
                    content += `> > Lucidity: 1-10\n`;
                }
            }
        } else {
            // For flat structures
            content += `> [!${structure.rootCallout}]\n> Enter your dream here.\n\n`;
            
            // Add child callouts as separate
            for (const callout of structure.childCallouts) {
                if (callout === structure.metricsCallout) continue; // Skip metrics callout to add it last
                content += `> [!${callout}]\n> ${this.getPlaceholderForCallout(callout)}\n\n`;
            }
            
            // Add metrics callout last if defined
            if (structure.metricsCallout && structure.childCallouts.includes(structure.metricsCallout)) {
                content += `> [!${structure.metricsCallout}]\n`;
                
                // Add enabled metrics from settings
                const enabledMetrics = this.getEnabledMetrics();
                if (enabledMetrics.length > 0) {
                    for (const metric of enabledMetrics) {
                        // Use type assertion to access range property
                        const metricAny = metric as any;
                        content += `> ${metric.name}: ${metricAny.range ? metricAny.range : `${metricAny.min || 1}-${metricAny.max || 10}`}\n`;
                    }
                } else {
                    // Fallback to default metrics if none are enabled
                    content += `> Clarity: 1-10\n`;
                    content += `> Vividness: 1-10\n`;
                    content += `> Coherence: 1-10\n`;
                    content += `> Emotional Intensity: 1-10\n`;
                    content += `> Lucidity: 1-10\n`;
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
        
        // Type assertion to handle any type issues
        return Object.values(this.plugin.settings.metrics)
            .filter((metric: any) => metric.enabled === true)
            .map(metric => metric as DreamMetric);
    }
    
    /**
     * Get a placeholder for a specific callout type
     */
    private getPlaceholderForCallout(callout: string): string {
        const lowerCallout = callout.toLowerCase();
        
        if (lowerCallout.includes('symbol')) {
            return '- Symbol 1: Meaning\n- Symbol 2: Meaning';
        } else if (lowerCallout.includes('reflection')) {
            return 'Add your reflections here.';
        } else if (lowerCallout.includes('emotion')) {
            return 'How did you feel in the dream? How do you feel now?';
        } else if (lowerCallout.includes('interpretation')) {
            return 'What might this dream mean?';
        } else if (lowerCallout.includes('action')) {
            return 'What actions will you take based on this dream?';
        } else {
            return `Add ${callout} content here.`;
        }
    }
    
    /**
     * Finish the wizard and save the template
     */
    private finishWizard() {
        // Validate
        if (!this.templateName) {
            alert('Please enter a template name.');
            this.navigateToStep(1);
            return;
        }
        
        if (!this.structureId) {
            alert('Please select a structure.');
            this.navigateToStep(2);
            return;
        }
        
        if (this.useTemplater && !this.templaterFile) {
            alert('Please select a Templater template.');
            this.navigateToStep(3);
            return;
        }
        
        if (!this.content) {
            alert('Please enter template content.');
            this.navigateToStep(4);
            return;
        }
        
        // Ensure we have static content
        if (!this.staticContent && this.useTemplater) {
            if (this.templaterIntegration) {
                this.staticContent = this.templaterIntegration.convertToStaticTemplate(this.content);
            } else {
                // If templaterIntegration is unavailable, use the content as-is
                this.staticContent = this.content;
            }
        }
        
        // Create template object
        const template: JournalTemplate = {
            id: this.templateId,
            name: this.templateName,
            description: this.templateDescription,
            structure: this.structureId,
            content: this.content,
            isTemplaterTemplate: this.useTemplater,
            templaterFile: this.useTemplater ? this.templaterFile : undefined,
            staticContent: this.staticContent || undefined
        };
        
        // Ensure templates array exists in settings
        if (!this.plugin.settings.linting) {
            this.plugin.settings.linting = {};
        }
        
        if (!this.plugin.settings.linting.templates) {
            this.plugin.settings.linting.templates = [];
        }
        
        // Get templates from settings
        const templates = this.plugin.settings.linting.templates;
        
        // Log debugging information
        console.log('Saving template:', template);
        console.log('Current templates:', templates);
        
        // If editing an existing template, replace it
        const existingIndex = templates.findIndex((t: JournalTemplate) => t.id === this.templateId);
        if (existingIndex >= 0) {
            templates[existingIndex] = template;
        } else {
            // Otherwise add new template
            templates.push(template);
        }
        
        console.log('Templates after update:', templates);
        
        // Save settings and ensure the changes persist
        this.plugin.saveSettings().then(() => {
            // Show confirmation notice
            new Notice(`Template "${this.templateName}" saved successfully!`);
            console.log('Settings saved successfully');
            
            // Close the modal
            this.close();
        }).catch((error: Error) => {
            console.error('Failed to save template:', error);
            new Notice('Failed to save template. Please try again.');
        });
    }
} 