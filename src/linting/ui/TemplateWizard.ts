import { App, Modal, Setting, TextAreaComponent, TextComponent, ButtonComponent, DropdownComponent, Notice } from 'obsidian';
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
    
    // Components
    private nameInput: TextComponent;
    private descInput: TextComponent;
    private structureDropdown: DropdownComponent;
    private templaterDropdown: DropdownComponent;
    private contentArea: TextAreaComponent;
    
    constructor(
        app: App,
        private plugin: any,
        private templaterIntegration: TemplaterIntegration,
        private editingTemplate?: JournalTemplate
    ) {
        super(app);
        
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
        
        contentEl.addClass('dream-journal-template-wizard');
        
        // Create header
        contentEl.createEl('h2', { 
            text: this.editingTemplate 
                ? `Edit Template: ${this.templateName}`
                : 'Create Journal Template' 
        });
        
        // Create layout with steps panel and preview panel
        const container = contentEl.createDiv({ cls: 'template-wizard-container' });
        const stepsPanel = container.createDiv({ cls: 'template-wizard-steps' });
        const previewPanel = container.createDiv({ cls: 'template-wizard-preview' });
        
        // Create step containers
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepContainer = stepsPanel.createDiv({ 
                cls: `template-wizard-step step-${i}`,
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
        
        // Create navigation buttons
        this.navigationEl = stepsPanel.createDiv({ cls: 'template-wizard-navigation' });
        this.updateNavigation();
        
        // Create preview panel
        previewPanel.createEl('h3', { text: 'Preview' });
        this.previewEl = previewPanel.createDiv({ cls: 'template-preview' });
        this.updatePreview();
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
        container.createDiv({ cls: 'structure-guidance' });
        
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
     * Step 3: Template Source
     */
    private buildStep3() {
        const container = this.stepContainers[2];
        
        container.createEl('h3', { text: 'Step 3: Template Source' });
        container.createEl('p', { 
            text: 'Choose how to create your template content.' 
        });
        
        // Option to use Templater
        const templaterEnabled = this.templaterIntegration.isTemplaterInstalled();
        
        new Setting(container)
            .setName('Use Templater')
            .setDesc(templaterEnabled 
                ? 'Use a Templater template for dynamic content'
                : 'Templater plugin is not installed or enabled')
            .addToggle(toggle => {
                toggle
                    .setValue(this.useTemplater)
                    .setDisabled(!templaterEnabled)
                    .onChange(value => {
                        this.useTemplater = value;
                        this.updateTemplaterSection(value);
                    });
            });
        
        // Templater template selection section
        const templaterSection = container.createDiv({ cls: 'templater-section' });
        
        if (!templaterEnabled) {
            templaterSection.style.display = 'none';
        }
        
        new Setting(templaterSection)
            .setName('Templater Template')
            .setDesc('Select a Templater template to use')
            .addDropdown(dropdown => {
                this.templaterDropdown = dropdown;
                
                // Get available Templater templates
                const templaterTemplates = this.templaterIntegration.getTemplaterTemplates();
                
                for (const template of templaterTemplates) {
                    dropdown.addOption(template, template);
                }
                
                if (this.templaterFile) {
                    dropdown.setValue(this.templaterFile);
                } else if (templaterTemplates.length > 0) {
                    this.templaterFile = templaterTemplates[0];
                    dropdown.setValue(this.templaterFile);
                }
                
                dropdown.onChange(value => {
                    this.templaterFile = value;
                    
                    // Load the template content
                    const content = this.templaterIntegration.getTemplateContent(value);
                    if (content) {
                        this.content = content;
                        
                        // Check template compatibility
                        const compatibility = this.templaterIntegration.isTemplateCompatible(value);
                        if (!compatibility.compatible) {
                            templaterSection.createEl('div', {
                                text: `Warning: ${compatibility.reason}`,
                                cls: 'templater-warning'
                            });
                        }
                        
                        this.updatePreview();
                    }
                });
            });
        
        // Update visibility based on current setting
        this.updateTemplaterSection(this.useTemplater && templaterEnabled);
    }
    
    /**
     * Step 4: Content Editing
     */
    private buildStep4() {
        const container = this.stepContainers[3];
        
        container.createEl('h3', { text: 'Step 4: Template Content' });
        
        // Show selected structure information
        const structures = this.plugin.settings.linting.structures;
        const structure = structures.find((s: CalloutStructure) => s.id === this.structureId);
        
        if (structure) {
            // Improve the description to be clearer about structure type
            container.createEl('p', { 
                text: `Creating template for: ${structure.name}`, 
                cls: 'structure-selected-info'
            });
            
            // Add a more descriptive explanation of the structure type
            container.createEl('p', { 
                text: structure.type === 'nested' 
                    ? 'This is a NESTED structure where child callouts will be created inside the root callout.'
                    : 'This is a FLAT structure where all callouts will be at the same level.',
                cls: 'structure-type-info'
            });
        }
        
        container.createEl('p', { 
            text: 'Edit the content of your template.' 
        });
        
        // Create text area for content
        this.contentArea = new TextAreaComponent(container)
            .setValue(this.content)
            .setPlaceholder('Enter your template content here...')
            .onChange(value => {
                this.content = value;
                this.updatePreview();
            });
        
        // Make the text area larger
        this.contentArea.inputEl.style.height = '300px';
        this.contentArea.inputEl.style.width = '100%';
        
        // Add a button to insert a default structure if content is empty
        if (!this.content) {
            new Setting(container)
                .setName('Insert Default Content')
                .setDesc('Insert default content based on the selected structure')
                .addButton(button => button
                    .setButtonText('Insert Default Content')
                    .onClick(() => {
                        const content = this.getDefaultContent();
                        this.contentArea.setValue(content);
                        this.content = content;
                        this.updatePreview();
                    }));
        }
    }
    
    /**
     * Update navigation buttons based on current step
     */
    private updateNavigation() {
        this.navigationEl.empty();
        
        const buttonContainer = this.navigationEl.createDiv({ cls: 'button-container' });
        
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
        
        // Add step indicator
        this.navigationEl.createEl('div', { 
            text: `Step ${this.currentStep} of ${this.totalSteps}`,
            cls: 'step-indicator'
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
        this.stepContainers[this.currentStep - 1].style.display = 'none';
        
        // Show new step
        this.currentStep = step;
        this.stepContainers[this.currentStep - 1].style.display = 'block';
        
        // Update navigation
        this.updateNavigation();
        
        // Update preview
        this.updatePreview();
    }
    
    /**
     * Update the preview panel
     */
    private updatePreview() {
        this.previewEl.empty();
        
        // Show template name
        this.previewEl.createEl('h4', { 
            text: this.templateName || 'Untitled Template' 
        });
        
        // Show selected structure
        const structures = this.plugin.settings.linting.structures;
        const structure = structures.find((s: CalloutStructure) => s.id === this.structureId);
        
        if (structure) {
            // Add a structure info container 
            const structureInfo = this.previewEl.createDiv({ cls: 'preview-structure-info' });
            
            // Show structure name
            structureInfo.createEl('p', { 
                text: `Structure: ${structure.name}`,
                cls: 'preview-structure'
            });
            
            // Show structure type with icon or visual indicator
            const typeEl = structureInfo.createEl('p', {
                cls: `preview-structure-type preview-${structure.type}`
            });
            
            // Use emoji as visual indicator
            const typeIcon = structure.type === 'nested' ? '📦' : '📄';
            typeEl.setText(`${typeIcon} ${structure.type.charAt(0).toUpperCase() + structure.type.slice(1)} Structure`);
        }
        
        // Show sample content
        const previewContent = this.previewEl.createDiv({ cls: 'preview-content' });
        
        if (this.content) {
            // Create a "read-only" version for preview
            const contentEl = previewContent.createDiv({ cls: 'markdown-preview' });
            contentEl.setText(this.content);
        } else {
            previewContent.createEl('p', { 
                text: 'No content yet. Select a Templater template or enter custom content.'
            });
        }
    }
    
    /**
     * Update templater section visibility
     */
    private updateTemplaterSection(visible: boolean) {
        const templaterSection = document.querySelector('.templater-section') as HTMLElement;
        if (templaterSection) {
            templaterSection.style.display = visible ? 'block' : 'none';
        }
    }
    
    /**
     * Update structure guidance based on selected structure
     */
    private updateStructureGuidance(structure: CalloutStructure) {
        const guidanceEl = document.querySelector('.structure-guidance') as HTMLElement;
        if (!guidanceEl) return;
        
        guidanceEl.empty();
        
        guidanceEl.createEl('h4', { text: 'Structure Details' });
        
        const structureDetails = guidanceEl.createEl('ul', { cls: 'structure-details' });
        
        structureDetails.createEl('li', { 
            text: `Type: ${structure.type === 'flat' ? 'Flat' : 'Nested'}`
        });
        
        structureDetails.createEl('li', { 
            text: `Root Callout: ${structure.rootCallout}`
        });
        
        if (structure.childCallouts.length > 0) {
            const childList = structureDetails.createEl('li');
            childList.createSpan({ text: 'Child Callouts: ' });
            const childUl = childList.createEl('ul');
            
            for (const callout of structure.childCallouts) {
                childUl.createEl('li', { 
                    text: callout + (structure.requiredFields.includes(callout) ? ' (Required)' : ' (Optional)')
                });
            }
        }
        
        if (structure.metricsCallout) {
            structureDetails.createEl('li', { 
                text: `Metrics Callout: ${structure.metricsCallout}`
            });
        }
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
        
        // Create template object
        const template: JournalTemplate = {
            id: this.templateId,
            name: this.templateName,
            description: this.templateDescription,
            structure: this.structureId,
            content: this.content,
            isTemplaterTemplate: this.useTemplater,
            templaterFile: this.useTemplater ? this.templaterFile : undefined
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