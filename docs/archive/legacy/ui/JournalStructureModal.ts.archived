import { App, Modal, Setting, MarkdownRenderer, ToggleComponent, TextComponent, ButtonComponent, Notice, setIcon } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
import { CalloutStructure, JournalTemplate, LintingRule, ContentIsolationSettings, LintingSettings } from '../types';
import { TemplaterIntegration } from '../TemplaterIntegration';
import { TemplateWizard } from './TemplateWizard';
import { defaultLintingSettings } from '../../types/journal-check-defaults';

/**
 * Modal for managing Journal Structure settings
 */
export class JournalStructureModal extends Modal {
    private mainContentEl: HTMLElement;
    private templaterIntegration: TemplaterIntegration;
    private sections: {[key: string]: HTMLElement} = {};
    
    constructor(
        app: App,
        private plugin: DreamMetricsPlugin
    ) {
        super(app);
        this.templaterIntegration = this.plugin.templaterIntegration;
    }
    
    /**
     * Helper method to get default linting settings
     */
    private getDefaultLintingSettings(): LintingSettings {
        return { ...defaultLintingSettings };
    }
    
    onOpen() {
        const { contentEl } = this;
        
        contentEl.addClass('oom-journal-structure-modal');
        
        // Create header
        contentEl.createEl('h2', { text: 'Journal Structure Settings' });
        
        // Create main content container with navigation sidebar and content area
        const container = contentEl.createDiv({ cls: 'oom-journal-structure-container' });
        const sidebar = container.createDiv({ cls: 'oom-journal-structure-sidebar' });
        this.mainContentEl = container.createDiv({ cls: 'oom-journal-structure-content' });
        
        // Build sidebar navigation
        this.buildSidebar(sidebar);
        
        // Build content sections
        this.buildOverviewSection();
        this.buildStructuresSection();
        this.buildTemplatesSection();
        this.buildTemplaterSection();
        this.buildContentIsolationSection();
        this.buildInterfaceSection();
        
        // Show the overview section by default
        this.showSection('overview');
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    /**
     * Builds the sidebar navigation
     */
    private buildSidebar(containerEl: HTMLElement) {
        const navItems = [
            { id: 'overview', label: 'Overview', icon: 'home' },
            { id: 'structures', label: 'Structures', icon: 'layout' },
            { id: 'templates', label: 'Templates', icon: 'file-text' },
            { id: 'templater', label: 'Templater', icon: 'code' },
            { id: 'content-isolation', label: 'Content Isolation', icon: 'filter' },
            { id: 'ui', label: 'Interface', icon: 'sliders' }
        ];
        
        for (const item of navItems) {
            const navItemEl = containerEl.createDiv({ cls: 'oom-nav-item' });
            navItemEl.setAttribute('data-section', item.id);
            
            const iconEl = navItemEl.createSpan({ cls: 'oom-nav-icon' });
            setIcon(iconEl, item.icon);
            
            navItemEl.createSpan({ text: item.label, cls: 'oom-nav-label' });
            
            navItemEl.addEventListener('click', () => {
                this.showSection(item.id);
            });
        }
    }
    
    /**
     * Shows the specified section and hides all others
     */
    private showSection(sectionId: string) {
        // Hide all sections
        for (const id in this.sections) {
            this.sections[id].hide();
        }
        
        // Show the requested section
        if (this.sections[sectionId]) {
            this.sections[sectionId].show();
        }
        
        // Update active state in sidebar
        const navItems = document.querySelectorAll('.oom-nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('data-section') === sectionId) {
                item.addClass('active');
            } else {
                item.removeClass('active');
            }
        });
    }
    
    /**
     * Creates a collapsible section
     */
    private createCollapsibleSection(containerEl: HTMLElement, title: string, expanded = true): HTMLElement {
        const sectionEl = containerEl.createDiv({ cls: 'oom-collapsible-section' });
        
        const headerEl = sectionEl.createDiv({ cls: 'oom-collapsible-header' });
        headerEl.createEl('h3', { text: title });
        
        const toggleEl = headerEl.createDiv({ cls: 'oom-collapsible-toggle' });
        setIcon(toggleEl, expanded ? 'chevron-down' : 'chevron-right');
        
        const contentEl = sectionEl.createDiv({ 
            cls: 'oom-collapsible-content',
            attr: { style: expanded ? '' : 'display: none;' }
        });
        
        headerEl.addEventListener('click', () => {
            const isExpanded = toggleEl.getAttribute('data-expanded') !== 'false';
            toggleEl.setAttribute('data-expanded', isExpanded ? 'false' : 'true');
            setIcon(toggleEl, isExpanded ? 'chevron-right' : 'chevron-down');
            if (contentEl) {
                contentEl.toggle(!isExpanded);
            }
        });
        
        toggleEl.setAttribute('data-expanded', expanded ? 'true' : 'false');
        
        return contentEl;
    }
    
    /**
     * Builds the overview section
     */
    private buildOverviewSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['overview'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Journal Structure Overview' });
        
        sectionEl.createEl('p', { 
            text: 'Journal Structure Check helps you maintain consistent formatting in your dream journal entries.' 
        });
        
        // Enable/disable linting
        new Setting(sectionEl)
            .setName('Enable Structure Validation')
            .setDesc('Validate journal entries against defined structures')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.linting?.enabled ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        // Create default settings if not exists
                        this.plugin.settings.linting = this.getDefaultLintingSettings();
                    }
                    this.plugin.settings.linting.enabled = value;
                    await this.plugin.saveSettings();
                }));
        
        // Quick stats about configured structures and templates
        const statsEl = sectionEl.createDiv({ cls: 'oom-structure-stats' });
        
        const structures = this.plugin.settings.linting?.structures || [];
        const templates = this.plugin.settings.linting?.templates || [];
        
        statsEl.createEl('h4', { text: 'Configuration Summary' });
        statsEl.createEl('div', { 
            text: `Structures: ${structures.length}`,
            cls: 'oom-stat-item' 
        });
        statsEl.createEl('div', { 
            text: `Templates: ${templates.length}`,
            cls: 'oom-stat-item' 
        });
        statsEl.createEl('div', { 
            text: `Templater Integration: ${this.plugin.settings.linting?.templaterIntegration?.enabled ? 'Enabled' : 'Disabled'}`,
            cls: 'oom-stat-item' 
        });
        
        // Quick action buttons
        const actionsEl = sectionEl.createDiv({ cls: 'oom-quick-actions' });
        actionsEl.createEl('h4', { text: 'Quick Actions' });
        
        const actionsGrid = actionsEl.createDiv({ cls: 'oom-actions-grid' });
        
        this.createQuickActionButton(actionsGrid, 'Create Structure', 'layout', () => {
            this.showSection('structures');
            // Implement structure creation
            new Notice('Structure creation will be implemented soon');
        });
        
        this.createQuickActionButton(actionsGrid, 'Create Template', 'file-text', () => {
            new TemplateWizard(this.app, this.plugin, this.templaterIntegration).open();
        });
        
        this.createQuickActionButton(actionsGrid, 'Validate Current Note', 'check-circle', () => {
            // Implement validation
            new Notice('Validation will be implemented soon');
        });
        
        this.createQuickActionButton(actionsGrid, 'Apply Template', 'file-plus', () => {
            // Implement template application
            new Notice('Template application will be implemented soon');
        });
    }
    
    /**
     * Creates a quick action button
     */
    private createQuickActionButton(containerEl: HTMLElement, label: string, icon: string, callback: () => void) {
        const buttonEl = containerEl.createDiv({ cls: 'oom-action-button' });
        
        const iconEl = buttonEl.createDiv({ cls: 'oom-action-icon' });
        setIcon(iconEl, icon);
        
        buttonEl.createEl('div', { text: label, cls: 'oom-action-label' });
        
        buttonEl.addEventListener('click', callback);
        
        return buttonEl;
    }
    
    /**
     * Builds the structures section
     */
    private buildStructuresSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['structures'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Journal Structures' });
        
        sectionEl.createEl('p', { 
            text: 'Define and manage structures that define the expected format of your journal entries.' 
        });
        
        // Structures list
        const structures = this.plugin.settings.linting?.structures || [];
        
        if (structures.length === 0) {
            sectionEl.createEl('p', { 
                text: 'No structures defined yet. Create your first structure to get started.',
                cls: 'oom-empty-state'
            });
        } else {
            const listEl = sectionEl.createDiv({ cls: 'oom-structures-list' });
            
            for (const structure of structures) {
                this.createStructureListItem(listEl, structure);
            }
        }
        
        // Create new structure button
        new Setting(sectionEl)
            .setName('Create New Structure')
            .setDesc('Add a new journal structure definition')
            .addButton(button => button
                .setButtonText('New Structure')
                .onClick(() => {
                    // Implement structure creation
                    new Notice('Structure creation will be implemented soon');
                }));
    }
    
    /**
     * Creates a structure list item
     */
    private createStructureListItem(containerEl: HTMLElement, structure: CalloutStructure) {
        const itemEl = containerEl.createDiv({ cls: 'oom-structure-item' });
        
        itemEl.createEl('h4', { text: structure.name });
        
        const metaEl = itemEl.createDiv({ cls: 'oom-structure-meta' });
        metaEl.createSpan({ text: `Type: ${structure.type}`, cls: 'oom-meta-item' });
        
        if (structure.requiredFields.length > 0) {
            metaEl.createSpan({ 
                text: `Required Fields: ${structure.requiredFields.length}`,
                cls: 'oom-meta-item' 
            });
        }
        
        // Actions
        const actionsEl = itemEl.createDiv({ cls: 'oom-structure-actions' });
        
        const editBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(editBtn, 'edit');
        editBtn.setAttribute('aria-label', 'Edit');
        editBtn.addEventListener('click', () => {
            // Implement structure editing
            new Notice('Structure editing will be implemented soon');
        });
        
        const deleteBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(deleteBtn, 'trash');
        deleteBtn.setAttribute('aria-label', 'Delete');
        deleteBtn.addEventListener('click', () => {
            // Implement structure deletion
            new Notice('Structure deletion will be implemented soon');
        });
        
        return itemEl;
    }
    
    /**
     * Builds the templates section
     */
    private buildTemplatesSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['templates'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Journal Templates' });
        
        sectionEl.createEl('p', { 
            text: 'Create and manage templates that follow your defined journal structures.' 
        });
        
        // Templates list
        const templates = this.plugin.settings.linting?.templates || [];
        
        if (templates.length === 0) {
            sectionEl.createEl('p', { 
                text: 'No templates defined yet. Create your first template to get started.',
                cls: 'oom-empty-state'
            });
        } else {
            const listEl = sectionEl.createDiv({ cls: 'oom-templates-list' });
            
            for (const template of templates) {
                this.createTemplateListItem(listEl, template);
            }
        }
        
        // Create new template button
        new Setting(sectionEl)
            .setName('Create New Template')
            .setDesc('Add a new journal template')
            .addButton(button => button
                .setButtonText('New Template')
                .onClick(() => {
                    new TemplateWizard(this.app, this.plugin, this.templaterIntegration).open();
                }));
        
        // Import/export buttons
        const importExportEl = sectionEl.createDiv({ cls: 'oom-import-export' });
        
        new Setting(importExportEl)
            .setName('Import/Export Templates')
            .setDesc('Share templates between vaults or with other users')
            .addButton(button => button
                .setButtonText('Import')
                .onClick(() => {
                    // Implement template import
                    new Notice('Template import will be implemented soon');
                }))
            .addButton(button => button
                .setButtonText('Export')
                .onClick(() => {
                    // Implement template export
                    new Notice('Template export will be implemented soon');
                }));
    }
    
    /**
     * Creates a template list item
     */
    private createTemplateListItem(containerEl: HTMLElement, template: JournalTemplate) {
        const itemEl = containerEl.createDiv({ cls: 'oom-template-item' });
        
        itemEl.createEl('h4', { text: template.name });
        
        if (template.description) {
            itemEl.createEl('p', { text: template.description, cls: 'oom-template-desc' });
        }
        
        const metaEl = itemEl.createDiv({ cls: 'oom-template-meta' });
        
        // Find associated structure
        const structures = this.plugin.settings.linting?.structures || [];
        const structure = structures.find(s => s.id === template.structure);
        
        if (structure) {
            metaEl.createSpan({ 
                text: `Structure: ${structure.name}`,
                cls: 'oom-meta-item' 
            });
        }
        
        metaEl.createSpan({ 
            text: template.isTemplaterTemplate ? 'Uses Templater' : 'Static Template',
            cls: 'oom-meta-item' 
        });
        
        // Actions
        const actionsEl = itemEl.createDiv({ cls: 'oom-template-actions' });
        
        const editBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(editBtn, 'edit');
        editBtn.setAttribute('aria-label', 'Edit');
        editBtn.addEventListener('click', () => {
            new TemplateWizard(this.app, this.plugin, this.templaterIntegration, template).open();
        });
        
        const deleteBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(deleteBtn, 'trash');
        deleteBtn.setAttribute('aria-label', 'Delete');
        deleteBtn.addEventListener('click', () => {
            // Implement template deletion confirmation
            if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
                const templates = this.plugin.settings.linting?.templates || [];
                const index = templates.findIndex(t => t.id === template.id);
                
                if (index !== -1) {
                    templates.splice(index, 1);
                    this.plugin.saveSettings().then(() => {
                        // Refresh the templates list
                        this.buildTemplatesSection();
                        this.showSection('templates');
                        new Notice(`Template "${template.name}" deleted`);
                    });
                }
            }
        });
        
        const applyBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(applyBtn, 'check');
        applyBtn.setAttribute('aria-label', 'Apply to current note');
        applyBtn.addEventListener('click', () => {
            // Implement template application
            new Notice('Template application will be implemented soon');
        });
        
        return itemEl;
    }
    
    /**
     * Builds the Templater integration section
     */
    private buildTemplaterSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['templater'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Templater Integration' });
        
        // Check if Templater is installed
        const templaterInstalled = this.templaterIntegration?.isTemplaterInstalled();
        
        if (!templaterInstalled) {
            const infoEl = sectionEl.createDiv({ cls: 'oom-notice oom-notice-warning' });
            setIcon(infoEl.createSpan({ cls: 'oom-notice-icon' }), 'alert-triangle');
            infoEl.createSpan({ 
                text: 'Templater plugin is not installed. Install it to use dynamic templates.',
                cls: 'oom-notice-text'
            });
        }
        
        // Templater integration settings
        new Setting(sectionEl)
            .setName('Enable Templater Integration')
            .setDesc('Use Templater templates for journal structures')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.linting?.templaterIntegration?.enabled ?? false)
                    .onChange(async (value) => {
                        if (!this.plugin.settings.linting) {
                            this.plugin.settings.linting = this.getDefaultLintingSettings();
                        }
                        if (!this.plugin.settings.linting.templaterIntegration) {
                            this.plugin.settings.linting.templaterIntegration = {
                                enabled: false,
                                folderPath: 'templates/dreams',
                                defaultTemplate: ''
                            };
                        }
                        this.plugin.settings.linting.templaterIntegration.enabled = value;
                        await this.plugin.saveSettings();
                    });
                
                // Disable if Templater is not installed
                if (!templaterInstalled) {
                    toggle.setDisabled(true);
                    toggle.setValue(false);
                }
            });
        
        // Only show these settings if Templater is installed
        if (templaterInstalled) {
            new Setting(sectionEl)
                .setName('Templates Folder')
                .setDesc('Path to the folder containing Templater templates')
                .addText(text => text
                    .setValue(this.plugin.settings.linting?.templaterIntegration?.folderPath || 'templates/dreams')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.linting) {
                            this.plugin.settings.linting = this.getDefaultLintingSettings();
                        }
                        if (!this.plugin.settings.linting.templaterIntegration) {
                            this.plugin.settings.linting.templaterIntegration = {
                                enabled: false,
                                folderPath: 'templates/dreams',
                                defaultTemplate: ''
                            };
                        }
                        if (this.plugin.settings.linting.templaterIntegration) {
                            this.plugin.settings.linting.templaterIntegration.folderPath = value;
                            await this.plugin.saveSettings();
                        }
                    }));
            
            // Default template setting
            new Setting(sectionEl)
                .setName('Default Template')
                .setDesc('Template to use by default')
                .addText(text => text
                    .setValue(this.plugin.settings.linting?.templaterIntegration?.defaultTemplate || '')
                    .setPlaceholder('templates/dreams/default.md')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.linting) {
                            this.plugin.settings.linting = this.getDefaultLintingSettings();
                        }
                        if (!this.plugin.settings.linting.templaterIntegration) {
                            this.plugin.settings.linting.templaterIntegration = {
                                enabled: false,
                                folderPath: 'templates/dreams',
                                defaultTemplate: ''
                            };
                        }
                        if (this.plugin.settings.linting.templaterIntegration) {
                            this.plugin.settings.linting.templaterIntegration.defaultTemplate = value;
                            await this.plugin.saveSettings();
                        }
                    }));
        }
    }
    
    /**
     * Builds the content isolation section
     */
    private buildContentIsolationSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['content-isolation'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Content Isolation Settings' });
        
        sectionEl.createEl('p', { 
            text: 'Configure which elements should be ignored during validation.' 
        });
        
        // Get current settings or defaults
        const contentIsolation = this.plugin.settings.linting?.contentIsolation || {
            ignoreImages: true,
            ignoreLinks: false,
            ignoreFormatting: true,
            ignoreHeadings: false,
            ignoreCodeBlocks: true,
            ignoreFrontmatter: true,
            ignoreComments: true,
            customIgnorePatterns: []
        };
        
        // Create settings for each option
        new Setting(sectionEl)
            .setName('Ignore Images')
            .setDesc('Exclude images from structure validation')
            .addToggle(toggle => toggle
                .setValue(contentIsolation.ignoreImages)
                .onChange(async (value) => {
                    this.updateContentIsolationSetting('ignoreImages', value);
                }));
        
        new Setting(sectionEl)
            .setName('Ignore Links')
            .setDesc('Exclude links from structure validation')
            .addToggle(toggle => toggle
                .setValue(contentIsolation.ignoreLinks)
                .onChange(async (value) => {
                    this.updateContentIsolationSetting('ignoreLinks', value);
                }));
        
        new Setting(sectionEl)
            .setName('Ignore Formatting')
            .setDesc('Exclude bold, italic, etc. from structure validation')
            .addToggle(toggle => toggle
                .setValue(contentIsolation.ignoreFormatting)
                .onChange(async (value) => {
                    this.updateContentIsolationSetting('ignoreFormatting', value);
                }));
        
        new Setting(sectionEl)
            .setName('Ignore Headings')
            .setDesc('Exclude headings from structure validation')
            .addToggle(toggle => toggle
                .setValue(contentIsolation.ignoreHeadings)
                .onChange(async (value) => {
                    this.updateContentIsolationSetting('ignoreHeadings', value);
                }));
        
        new Setting(sectionEl)
            .setName('Ignore Code Blocks')
            .setDesc('Exclude code blocks from structure validation')
            .addToggle(toggle => toggle
                .setValue(contentIsolation.ignoreCodeBlocks)
                .onChange(async (value) => {
                    this.updateContentIsolationSetting('ignoreCodeBlocks', value);
                }));
        
        new Setting(sectionEl)
            .setName('Ignore Frontmatter')
            .setDesc('Exclude YAML frontmatter from structure validation')
            .addToggle(toggle => toggle
                .setValue(contentIsolation.ignoreFrontmatter)
                .onChange(async (value) => {
                    this.updateContentIsolationSetting('ignoreFrontmatter', value);
                }));
        
        new Setting(sectionEl)
            .setName('Ignore Comments')
            .setDesc('Exclude comments from structure validation')
            .addToggle(toggle => toggle
                .setValue(contentIsolation.ignoreComments)
                .onChange(async (value) => {
                    this.updateContentIsolationSetting('ignoreComments', value);
                }));
        
        // Custom ignore patterns
        const customPatternsEl = sectionEl.createDiv({ cls: 'oom-custom-patterns' });
        customPatternsEl.createEl('h4', { text: 'Custom Ignore Patterns' });
        
        const patterns = contentIsolation.customIgnorePatterns || [];
        
        if (patterns.length === 0) {
            customPatternsEl.createEl('p', { 
                text: 'No custom patterns defined yet.',
                cls: 'oom-empty-state'
            });
        } else {
            const listEl = customPatternsEl.createDiv({ cls: 'oom-patterns-list' });
            
            for (let i = 0; i < patterns.length; i++) {
                this.createPatternListItem(listEl, patterns[i], i);
            }
        }
        
        // Add new pattern
        new Setting(customPatternsEl)
            .setName('Add Custom Pattern')
            .setDesc('Add a regex pattern to ignore during validation')
            .addText(text => {
                text.setPlaceholder('RegEx pattern');
                
                // Add button next to the text field - add null check for parent element
                const parentEl = text.inputEl.parentElement;
                if (parentEl) {
                    const addBtn = new ButtonComponent(parentEl);
                    addBtn.setButtonText('Add')
                        .onClick(() => {
                            const pattern = text.getValue();
                            if (pattern) {
                                const patterns = [...(this.plugin.settings.linting?.contentIsolation?.customIgnorePatterns || [])];
                                patterns.push(pattern);
                                this.updateContentIsolationSetting('customIgnorePatterns', patterns);
                                text.setValue('');
                                
                                // Refresh section
                                this.buildContentIsolationSection();
                                this.showSection('content-isolation');
                            }
                        });
                } else {
                    // Fallback if parent element is not available
                    const container = customPatternsEl.createDiv();
                    container.style.marginTop = '8px';
                    const addBtn = new ButtonComponent(container);
                    addBtn.setButtonText('Add')
                        .onClick(() => {
                            const pattern = text.getValue();
                            if (pattern) {
                                const patterns = [...(this.plugin.settings.linting?.contentIsolation?.customIgnorePatterns || [])];
                                patterns.push(pattern);
                                this.updateContentIsolationSetting('customIgnorePatterns', patterns);
                                text.setValue('');
                                
                                // Refresh section
                                this.buildContentIsolationSection();
                                this.showSection('content-isolation');
                            }
                        });
                }
                
                return text;
            });
    }
    
    /**
     * Creates a pattern list item
     */
    private createPatternListItem(containerEl: HTMLElement, pattern: string, index: number) {
        const itemEl = containerEl.createDiv({ cls: 'oom-pattern-item' });
        
        itemEl.createSpan({ text: pattern, cls: 'oom-pattern-text' });
        
        const deleteBtn = itemEl.createSpan({ cls: 'oom-pattern-delete' });
        setIcon(deleteBtn, 'x');
        
        deleteBtn.addEventListener('click', () => {
            const patterns = [...(this.plugin.settings.linting?.contentIsolation?.customIgnorePatterns || [])];
            patterns.splice(index, 1);
            this.updateContentIsolationSetting('customIgnorePatterns', patterns);
            
            // Refresh section
            this.buildContentIsolationSection();
            this.showSection('content-isolation');
        });
        
        return itemEl;
    }
    
    /**
     * Updates a content isolation setting
     */
    private async updateContentIsolationSetting(key: string, value: any) {
        if (!this.plugin.settings.linting) {
            this.plugin.settings.linting = this.getDefaultLintingSettings();
        }
        
        if (!this.plugin.settings.linting.contentIsolation) {
            this.plugin.settings.linting.contentIsolation = {
                ignoreImages: true,
                ignoreLinks: false,
                ignoreFormatting: true,
                ignoreHeadings: false,
                ignoreCodeBlocks: true,
                ignoreFrontmatter: true,
                ignoreComments: true,
                customIgnorePatterns: []
            };
        }
        
        // @ts-ignore - Dynamically set property
        this.plugin.settings.linting.contentIsolation[key] = value;
        await this.plugin.saveSettings();
    }
    
    /**
     * Builds the interface section
     */
    private buildInterfaceSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['ui'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'User Interface Settings' });
        
        sectionEl.createEl('p', { 
            text: 'Configure how validation results are displayed in the editor.' 
        });
        
        // Get current settings
        const ui = this.plugin.settings.linting?.userInterface || {
            showInlineValidation: true,
            severityIndicators: {
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            },
            quickFixesEnabled: true
        };
        
        // UI settings
        new Setting(sectionEl)
            .setName('Show Inline Validation')
            .setDesc('Display validation results within the editor')
            .addToggle(toggle => toggle
                .setValue(ui.showInlineValidation)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        this.plugin.settings.linting = this.getDefaultLintingSettings();
                    }
                    if (!this.plugin.settings.linting.userInterface) {
                        this.plugin.settings.linting.userInterface = {
                            showInlineValidation: true,
                            severityIndicators: {
                                error: '❌',
                                warning: '⚠️',
                                info: 'ℹ️'
                            },
                            quickFixesEnabled: true
                        };
                    }
                    if (this.plugin.settings.linting.userInterface) {
                        this.plugin.settings.linting.userInterface.showInlineValidation = value;
                        await this.plugin.saveSettings();
                    }
                }));
        
        new Setting(sectionEl)
            .setName('Enable Quick Fixes')
            .setDesc('Allow quick fixing of validation issues')
            .addToggle(toggle => toggle
                .setValue(ui.quickFixesEnabled)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        this.plugin.settings.linting = this.getDefaultLintingSettings();
                    }
                    if (!this.plugin.settings.linting.userInterface) {
                        this.plugin.settings.linting.userInterface = {
                            showInlineValidation: true,
                            severityIndicators: {
                                error: '❌',
                                warning: '⚠️',
                                info: 'ℹ️'
                            },
                            quickFixesEnabled: true
                        };
                    }
                    if (this.plugin.settings.linting.userInterface) {
                        this.plugin.settings.linting.userInterface.quickFixesEnabled = value;
                        await this.plugin.saveSettings();
                    }
                }));
        
        // Severity indicators
        const indicatorsEl = this.createCollapsibleSection(sectionEl, 'Severity Indicators');
        
        new Setting(indicatorsEl)
            .setName('Error Indicator')
            .setDesc('Symbol to use for error severity issues')
            .addText(text => text
                .setValue(ui.severityIndicators.error)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        this.plugin.settings.linting = this.getDefaultLintingSettings();
                    }
                    if (!this.plugin.settings.linting.userInterface) {
                        this.plugin.settings.linting.userInterface = {
                            showInlineValidation: true,
                            severityIndicators: {
                                error: '❌',
                                warning: '⚠️',
                                info: 'ℹ️'
                            },
                            quickFixesEnabled: true
                        };
                    }
                    if (this.plugin.settings.linting.userInterface && 
                        this.plugin.settings.linting.userInterface.severityIndicators) {
                        this.plugin.settings.linting.userInterface.severityIndicators.error = value;
                        await this.plugin.saveSettings();
                    }
                }));
        
        new Setting(indicatorsEl)
            .setName('Warning Indicator')
            .setDesc('Symbol to use for warning severity issues')
            .addText(text => text
                .setValue(ui.severityIndicators.warning)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        this.plugin.settings.linting = this.getDefaultLintingSettings();
                    }
                    if (!this.plugin.settings.linting.userInterface || 
                        !this.plugin.settings.linting.userInterface.severityIndicators) {
                        return;
                    }
                    this.plugin.settings.linting.userInterface.severityIndicators.warning = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(indicatorsEl)
            .setName('Info Indicator')
            .setDesc('Symbol to use for info severity issues')
            .addText(text => text
                .setValue(ui.severityIndicators.info)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        this.plugin.settings.linting = this.getDefaultLintingSettings();
                    }
                    if (!this.plugin.settings.linting.userInterface || 
                        !this.plugin.settings.linting.userInterface.severityIndicators) {
                        return;
                    }
                    this.plugin.settings.linting.userInterface.severityIndicators.info = value;
                    await this.plugin.saveSettings();
                }));
    }
} 