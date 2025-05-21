import { App, Modal, Setting, MarkdownRenderer, ToggleComponent, TextComponent, ButtonComponent, Notice, setIcon, TFile } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
import { CalloutStructure, JournalTemplate, LintingRule, ContentIsolationSettings, LintingSettings } from '../types';
import { TemplaterIntegration } from '../TemplaterIntegration';
import { TemplateWizard } from './TemplateWizard';
import { createSelectedNotesAutocomplete, createFolderAutocomplete } from '../../../autocomplete';

/**
 * Dream Journal Manager Modal
 * 
 * A unified interface for managing dream journal entries, including:
 * - Dashboard overview
 * - Dream scraping functionality
 * - Journal structure settings
 * - Template management
 * - Templater integration
 * - Content isolation settings
 * - User interface preferences
 */
export class DreamJournalManager extends Modal {
    private mainContentEl: HTMLElement;
    private templaterIntegration: TemplaterIntegration;
    private sections: {[key: string]: HTMLElement} = {};
    
    // Dream Scrape related properties
    private selectionMode: 'notes' | 'folder';
    private selectedNotes: string[];
    private selectedFolder: string;
    private progressContent: HTMLElement;
    private statusText: HTMLElement;
    private progressBar: HTMLElement;
    private progressFill: HTMLElement;
    private detailsText: HTMLElement;
    private scrapeButton: HTMLButtonElement;
    private isScraping: boolean = false;
    private noteDismissed: boolean = false;
    public hasScraped: boolean = false;
    public openNoteButton: HTMLButtonElement;
    public static activeModal: DreamJournalManager | null = null;
    
    constructor(
        app: App,
        private plugin: DreamMetricsPlugin,
        private initialTab: string = 'dashboard'
    ) {
        super(app);
        this.templaterIntegration = this.plugin.templaterIntegration;
        
        // Initialize Dream Scrape properties
        this.selectionMode = plugin.settings.selectionMode || 'notes';
        this.selectedNotes = plugin.settings.selectedNotes || [];
        this.selectedFolder = plugin.settings.selectedFolder || '';
    }
    
    onOpen() {
        DreamJournalManager.activeModal = this;
        const { contentEl } = this;
        
        // Reset scrape state when modal is opened
        this.hasScraped = false;
        
        // Set modal classes
        this.modalEl.addClass('oom-modal');
        this.modalEl.addClass('oom-journal-manager-modal');
        
        // Clear and set up content container
        contentEl.empty();
        contentEl.addClass('oom-journal-manager-content');
        
        // Create header
        contentEl.createEl('h2', { text: 'Dream Journal Manager', cls: 'oom-journal-manager-title' });
        
        // Create main content container with navigation sidebar and content area
        const container = contentEl.createDiv({ cls: 'oom-journal-manager-container' });
        const sidebar = container.createDiv({ cls: 'oom-journal-manager-sidebar' });
        this.mainContentEl = container.createDiv({ cls: 'oom-journal-manager-main-content' });
        
        // Build sidebar navigation
        this.buildSidebar(sidebar);
        
        // Build content sections
        this.buildDashboardSection();
        this.buildDreamScrapeSection();
        this.buildJournalStructureSection();
        this.buildTemplatesSection();
        this.buildTemplaterSection();
        this.buildContentIsolationSection();
        this.buildInterfaceSection();
        
        // Show the specified initial tab
        this.showSection(this.initialTab);
    }
    
    onClose() {
        DreamJournalManager.activeModal = null;
        const { contentEl } = this;
        contentEl.empty();
    }
    
    /**
     * Builds the sidebar navigation
     */
    private buildSidebar(containerEl: HTMLElement) {
        const navItems = [
            { id: 'dashboard', label: 'Dashboard', icon: 'home' },
            { id: 'dream-scrape', label: 'Dream Scrape', icon: 'sparkles' },
            { id: 'journal-structure', label: 'Journal Structure', icon: 'layout' },
            { id: 'templates', label: 'Templates', icon: 'file-text' },
            { id: 'templater', label: 'Templater', icon: 'code' },
            { id: 'content-isolation', label: 'Content Isolation', icon: 'filter' },
            { id: 'interface', label: 'Interface', icon: 'sliders' }
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
            cls: 'oom-collapsible-content' + (expanded ? '' : ' collapsed')
        });
        
        headerEl.addEventListener('click', () => {
            const isExpanded = toggleEl.getAttribute('data-expanded') !== 'false';
            toggleEl.setAttribute('data-expanded', isExpanded ? 'false' : 'true');
            setIcon(toggleEl, isExpanded ? 'chevron-right' : 'chevron-down');
            if (contentEl) {
                contentEl.toggleClass('collapsed', isExpanded);
            }
        });
        
        toggleEl.setAttribute('data-expanded', expanded ? 'true' : 'false');
        
        return contentEl;
    }
    
    /**
     * Creates a quick action button for the dashboard
     */
    private createQuickActionButton(
        containerEl: HTMLElement, 
        label: string, 
        icon: string, 
        callback: () => void
    ) {
        const button = containerEl.createEl('button', { 
            cls: 'oom-quick-action-button', 
            text: label 
        });
        
        const iconEl = button.createSpan({ cls: 'oom-quick-action-icon' });
        setIcon(iconEl, icon);
        
        button.addEventListener('click', callback);
        
        return button;
    }
    
    /**
     * Builds the dashboard section (main overview)
     */
    private buildDashboardSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['dashboard'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Dashboard' });
        
        sectionEl.createEl('p', { 
            text: 'Welcome to the Dream Journal Manager! Manage all aspects of your dream journal from this central hub.'
        });
        
        // Quick Actions Section
        const quickActionsSection = sectionEl.createDiv({ cls: 'oom-dashboard-section' });
        quickActionsSection.createEl('h4', { text: 'Quick Actions' });
        
        const quickActionsGrid = quickActionsSection.createDiv({ cls: 'oom-quick-actions-grid' });
        
        this.createQuickActionButton(quickActionsGrid, 'Open Settings', 'settings', () => {
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById('oneirometrics');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Scrape Metrics', 'sparkles', () => {
            this.showSection('dream-scrape');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Check Structure', 'check-circle', () => {
            this.showSection('journal-structure');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Create Template', 'file-plus', () => {
            this.showSection('templates');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'View Metrics', 'bar-chart', () => {
            const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.projectNote);
            if (file instanceof TFile) {
                this.app.workspace.openLinkText(this.plugin.settings.projectNote, '', true);
            } else {
                new Notice('Metrics note not found. Please set the path in settings.');
            }
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Help & Docs', 'help-circle', () => {
            window.open('https://github.com/banisterious/obsidian-oneirometrics/blob/main/docs/USAGE.md', '_blank');
        });
        
        // Recent Activity Section
        const recentActivitySection = sectionEl.createDiv({ cls: 'oom-dashboard-section' });
        recentActivitySection.createEl('h4', { text: 'Recent Activity' });
        
        const recentActivityList = recentActivitySection.createEl('ul', { cls: 'oom-recent-activity-list' });
        
        // Placeholder activities - these would be populated from actual usage data in a real implementation
        recentActivityList.createEl('li', { 
            text: 'Last scrape: ' + new Date().toLocaleDateString() + ' - 15 entries processed, 7 with metrics' 
        });
        
        recentActivityList.createEl('li', { 
            text: 'Last validation: ' + new Date().toLocaleDateString() + ' - 2 errors, 1 warning' 
        });
        
        recentActivityList.createEl('li', { 
            text: 'Recently used template: "Lucid Dream Template"' 
        });
        
        // Status Overview Section
        const statusSection = sectionEl.createDiv({ cls: 'oom-dashboard-section' });
        statusSection.createEl('h4', { text: 'Status Overview' });
        
        const statusList = statusSection.createEl('ul', { cls: 'oom-status-list' });
        
        statusList.createEl('li', { 
            text: `Current selection: ${this.selectedNotes.length} notes selected` 
        });
        
        statusList.createEl('li', { 
            text: 'Templates: 4 templates defined' 
        });
        
        statusList.createEl('li', { 
            text: 'Structures: 2 structures defined' 
        });
        
        statusList.createEl('li', { 
            text: `Validation: ${this.plugin.settings.linting?.enabled ? 'Enabled' : 'Disabled'}` 
        });
    }
    
    /**
     * Builds the dream scrape section
     */
    private buildDreamScrapeSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['dream-scrape'] = sectionEl;
        
        // Add data-section attribute for CSS targeting
        sectionEl.setAttribute('data-section', 'dream-scrape');
        
        sectionEl.createEl('h3', { text: 'Dream Scrape' });
        
        sectionEl.createEl('p', { 
            text: 'Extract dream metrics from journal entries.' 
        });
        
        // Mode Selection Section
        const modeSection = sectionEl.createDiv({ cls: 'oom-modal-section' });
        
        modeSection.createEl('h4', { text: 'Selection Mode' });
        modeSection.createEl('p', { 
            text: 'Choose whether to scrape individual notes or a folder',
            cls: 'oom-section-helper'
        });
        
        const modeRow = modeSection.createDiv({ cls: 'oom-actions-row' });
        
        const modeDropdown = modeRow.createEl('select', { cls: 'oom-dropdown' });
        modeDropdown.createEl('option', { text: 'Notes', value: 'notes' });
        modeDropdown.createEl('option', { text: 'Folder', value: 'folder' });
        modeDropdown.value = this.selectionMode;
        
        // File/Folder Selector Section
        const selectorSection = sectionEl.createDiv({ cls: 'oom-modal-section' });
        
        if (this.selectionMode === 'folder') {
            selectorSection.createEl('h4', { text: 'Selected Folder' });
            selectorSection.createEl('p', { 
                text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)',
                cls: 'oom-section-helper'
            });
            
            // Replace placeholder with actual folder selector
            const folderSelectorContainer = selectorSection.createDiv('oom-folder-selector-container');
            createFolderAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: folderSelectorContainer,
                selectedFolder: this.selectedFolder,
                onChange: (folder: string) => {
                    this.selectedFolder = folder;
                    this.plugin.settings.selectedFolder = folder;
                    this.plugin.saveSettings();
                }
            });
        } else {
            selectorSection.createEl('h4', { text: 'Selected Notes' });
            selectorSection.createEl('p', { 
                text: 'Notes to search for dream metrics (select one or more)',
                cls: 'oom-section-helper'
            });
            
            // Replace placeholder with actual notes selector
            const notesSelectorContainer = selectorSection.createDiv('oom-notes-selector-container');
            createSelectedNotesAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: notesSelectorContainer,
                selectedNotes: this.selectedNotes,
                onChange: (notes: string[]) => {
                    this.selectedNotes = notes;
                    this.plugin.settings.selectedNotes = notes;
                    this.plugin.saveSettings();
                }
            });
        }
        
        // Progress Section
        const progressSection = sectionEl.createDiv({ cls: 'oom-modal-section oom-progress-section' });
        
        progressSection.createEl('h4', { text: 'Progress' });
        
        this.progressContent = progressSection.createDiv({ cls: 'oom-progress-content' });
        this.statusText = this.progressContent.createEl('div', { cls: 'oom-status-text' });
        this.progressBar = this.progressContent.createEl('div', { cls: 'oom-progress-bar' });
        this.progressFill = this.progressBar.createEl('div', { cls: 'oom-progress-fill' });
        this.detailsText = this.progressContent.createEl('div', { cls: 'oom-details-text' });
        
        // Create the sticky footer for scrape actions
        const scrapeFooter = sectionEl.createDiv({ cls: 'oom-dream-scrape-footer' });
        
        // Scrape Action Section
        const scrapeRow = scrapeFooter.createDiv({ cls: 'oom-actions-row' });
        
        this.scrapeButton = scrapeRow.createEl('button', {
            text: 'Scrape Notes',
            cls: 'mod-cta oom-button oom-scrape-button'
        });
        
        this.openNoteButton = scrapeRow.createEl('button', {
            text: 'Open OneiroMetrics',
            cls: 'oom-button oom-open-note-button',
            attr: { title: 'Run a scrape to enable this' }
        });
        this.openNoteButton.disabled = true;
        
        // Set up event handlers
        
        // Mode dropdown change handler
        modeDropdown.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value as 'notes' | 'folder';
            this.selectionMode = value;
            this.plugin.settings.selectionMode = value;
            this.plugin.saveSettings();
            
            // Rebuild the selector section with the new mode
            selectorSection.empty();
            
            if (value === 'folder') {
                selectorSection.createEl('h4', { text: 'Selected Folder' });
                selectorSection.createEl('p', { 
                    text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)',
                    cls: 'oom-section-helper'
                });
                
                // Add folder selector
                const folderSelectorContainer = selectorSection.createDiv('oom-folder-selector-container');
                createFolderAutocomplete({
                    app: this.app,
                    plugin: this.plugin,
                    containerEl: folderSelectorContainer,
                    selectedFolder: this.selectedFolder,
                    onChange: (folder: string) => {
                        this.selectedFolder = folder;
                        this.plugin.settings.selectedFolder = folder;
                        this.plugin.saveSettings();
                    }
                });
            } else {
                selectorSection.createEl('h4', { text: 'Selected Notes' });
                selectorSection.createEl('p', { 
                    text: 'Notes to search for dream metrics (select one or more)',
                    cls: 'oom-section-helper'
                });
                
                // Add notes selector
                const notesSelectorContainer = selectorSection.createDiv('oom-notes-selector-container');
                createSelectedNotesAutocomplete({
                    app: this.app,
                    plugin: this.plugin,
                    containerEl: notesSelectorContainer,
                    selectedNotes: this.selectedNotes,
                    onChange: (notes: string[]) => {
                        this.selectedNotes = notes;
                        this.plugin.settings.selectedNotes = notes;
                        this.plugin.saveSettings();
                    }
                });
            }
        });
        
        // Scrape button click handler
        this.scrapeButton.addEventListener('click', () => {
            if (!this.isScraping) {
                this.isScraping = true;
                this.scrapeButton.disabled = true;
                this.plugin.scrapeMetrics();
                // Set timer to enable the open note button after scraping
                setTimeout(() => {
                    this.openNoteButton.disabled = false;
                    this.openNoteButton.classList.add('enabled');
                    this.hasScraped = true;
                }, 2000); // This is a placeholder, actual enabling would happen when scraping completes
            }
        });
        
        // Open note button click handler
        this.openNoteButton.addEventListener('click', () => {
            if (this.openNoteButton.disabled) return;
            const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.projectNote);
            if (file instanceof TFile) {
                this.app.workspace.openLinkText(this.plugin.settings.projectNote, '', true);
            } else {
                new Notice('Metrics note not found. Please set the path in settings.');
                (this.app as any).setting.open('oneirometrics');
            }
        });
    }
    
    /**
     * Builds the journal structure section
     */
    private buildJournalStructureSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['journal-structure'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Journal Structure' });
        
        sectionEl.createEl('p', { 
            text: 'Configure journal structure settings and validation rules.' 
        });
        
        // Structure Settings Section
        const structureSettingsContent = this.createCollapsibleSection(sectionEl, 'Structure Settings');
        
        new Setting(structureSettingsContent)
            .setName('Enable Structure Validation')
            .setDesc('Validate journal entries against defined structures')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.linting?.enabled ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        this.plugin.settings.linting = this.getDefaultLintingSettings();
                    }
                    this.plugin.settings.linting.enabled = value;
                    await this.plugin.saveSettings();
                }));
        
        // Placeholder for more structure settings
        structureSettingsContent.createEl('p', { 
            text: 'Additional structure settings will be implemented here' 
        });
    }
    
    /**
     * Builds the templates section
     */
    private buildTemplatesSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['templates'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Templates' });
        
        sectionEl.createEl('p', { 
            text: 'Manage templates for dream journal entries.' 
        });
        
        // Create Template Button
        const createTemplateRow = sectionEl.createDiv({ cls: 'oom-actions-row' });
        
        const createTemplateButton = createTemplateRow.createEl('button', {
            text: 'Create New Template',
            cls: 'mod-cta oom-button'
        });
        
        createTemplateButton.addEventListener('click', () => {
            new TemplateWizard(this.app, this.plugin, this.templaterIntegration).open();
        });
        
        // Templates List Section
        const templatesListSection = sectionEl.createDiv({ cls: 'oom-templates-list-section' });
        
        templatesListSection.createEl('h4', { text: 'Available Templates' });
        
        const templatesListEl = templatesListSection.createEl('div', { cls: 'oom-templates-list' });
        
        // Get templates from settings
        const templates = this.plugin.settings.linting?.templates || [];
        
        if (templates.length === 0) {
            templatesListEl.createEl('p', { 
                text: 'No templates found. Create a template to get started.' 
            });
        } else {
            // Display the templates
            for (const template of templates) {
                const templateItem = templatesListEl.createDiv({ cls: 'oom-template-item' });
                
                templateItem.createEl('h5', { text: template.name });
                
                if (template.description) {
                    templateItem.createEl('p', { text: template.description });
                }
                
                // Template metadata
                const metaContainer = templateItem.createDiv({ cls: 'oom-template-meta' });
                
                if (template.structure) {
                    metaContainer.createSpan({ 
                        cls: 'oom-meta-item', 
                        text: `Structure: ${template.structure}` 
                    });
                }
                
                // Template actions
                const actionsContainer = templateItem.createDiv({ cls: 'oom-template-actions' });
                
                // Edit button
                const editButton = actionsContainer.createEl('button', {
                    cls: 'oom-action-btn',
                    attr: { title: 'Edit Template' }
                });
                setIcon(editButton, 'edit');
                
                editButton.addEventListener('click', () => {
                    new TemplateWizard(this.app, this.plugin, this.templaterIntegration, template).open();
                });
                
                // Delete button
                const deleteButton = actionsContainer.createEl('button', {
                    cls: 'oom-action-btn',
                    attr: { title: 'Delete Template' }
                });
                setIcon(deleteButton, 'trash');
                
                deleteButton.addEventListener('click', () => {
                    const confirmDelete = confirm(`Are you sure you want to delete the template "${template.name}"?`);
                    if (confirmDelete) {
                        if (!this.plugin.settings.linting) {
                            this.plugin.settings.linting = this.getDefaultLintingSettings();
                        }
                        
                        this.plugin.settings.linting.templates = this.plugin.settings.linting.templates.filter(
                            t => t.id !== template.id
                        );
                        
                        this.plugin.saveSettings().then(() => {
                            new Notice(`Template "${template.name}" deleted.`);
                            this.buildTemplatesSection(); // Refresh templates list
                        });
                    }
                });
            }
        }
    }
    
    /**
     * Builds the templater section
     */
    private buildTemplaterSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['templater'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Templater Integration' });
        
        const templaterInstalled = (this.app as any).plugins?.plugins?.['templater-obsidian'] !== undefined;
        
        if (templaterInstalled) {
            sectionEl.createEl('p', { 
                text: 'Configure integration with the Templater plugin for dynamic templates.' 
            });
            
            // Templater Settings Section
            const templaterSettingsContent = this.createCollapsibleSection(sectionEl, 'Templater Settings');
            
            new Setting(templaterSettingsContent)
                .setName('Enable Templater Integration')
                .setDesc('Use Templater for dynamic template content')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.linting?.templaterIntegration?.enabled ?? false)
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
                    }));
            
            new Setting(templaterSettingsContent)
                .setName('Templates Folder')
                .setDesc('Location of dream templates for Templater')
                .addText(text => text
                    .setPlaceholder('templates/dreams')
                    .setValue(this.plugin.settings.linting?.templaterIntegration?.folderPath ?? 'templates/dreams')
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
                        this.plugin.settings.linting.templaterIntegration.folderPath = value;
                        await this.plugin.saveSettings();
                    }));
        } else {
            sectionEl.createEl('p', { 
                text: 'Templater plugin is not installed. Install Templater for enhanced template functionality.' 
            });
            
            const installRow = sectionEl.createDiv({ cls: 'oom-actions-row' });
            
            const installButton = installRow.createEl('button', {
                text: 'Install Templater',
                cls: 'mod-cta oom-button'
            });
            
            installButton.addEventListener('click', () => {
                // Open Obsidian's community plugins tab
                (this.app as any).setting.open('community-plugins');
                new Notice('Search for "Templater" in the Community Plugins tab');
            });
        }
    }
    
    /**
     * Builds the content isolation section
     */
    private buildContentIsolationSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['content-isolation'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Content Isolation' });
        
        sectionEl.createEl('p', { 
            text: 'Configure what content elements should be ignored during validation.' 
        });
        
        // Content Isolation Settings Section
        const contentIsolationContent = this.createCollapsibleSection(sectionEl, 'Content Isolation Settings');
        
        new Setting(contentIsolationContent)
            .setName('Ignore Images')
            .setDesc('Do not validate image links and embeds')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.linting?.contentIsolation?.ignoreImages ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        this.plugin.settings.linting = this.getDefaultLintingSettings();
                    }
                    if (!this.plugin.settings.linting.contentIsolation) {
                        this.plugin.settings.linting.contentIsolation = this.getDefaultLintingSettings().contentIsolation;
                    }
                    this.plugin.settings.linting.contentIsolation.ignoreImages = value;
                    await this.plugin.saveSettings();
                }));
        
        // Placeholder for more content isolation settings
        contentIsolationContent.createEl('p', { 
            text: 'Additional content isolation settings will be implemented here' 
        });
    }
    
    /**
     * Builds the interface section
     */
    private buildInterfaceSection() {
        const sectionEl = this.mainContentEl.createDiv();
        this.sections['interface'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Interface Settings' });
        
        sectionEl.createEl('p', { 
            text: 'Configure how the journal structure validator appears in the editor.' 
        });
        
        // Interface Settings Section
        const interfaceContent = this.createCollapsibleSection(sectionEl, 'User Interface Settings');
        
        new Setting(interfaceContent)
            .setName('Show Inline Validation')
            .setDesc('Display structure validation warnings directly in the editor')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.linting?.userInterface?.showInlineValidation ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        this.plugin.settings.linting = this.getDefaultLintingSettings();
                    }
                    if (!this.plugin.settings.linting.userInterface) {
                        this.plugin.settings.linting.userInterface = this.getDefaultLintingSettings().userInterface;
                    }
                    this.plugin.settings.linting.userInterface.showInlineValidation = value;
                    await this.plugin.saveSettings();
                }));
        
        // Placeholder for more interface settings
        interfaceContent.createEl('p', { 
            text: 'Additional interface settings will be implemented here' 
        });
    }
    
    /**
     * Helper method to get default linting settings
     */
    private getDefaultLintingSettings(): LintingSettings {
        return {
            enabled: true,
            rules: [],
            structures: [],
            templates: [],
            templaterIntegration: {
                enabled: false,
                folderPath: 'templates/dreams',
                defaultTemplate: ''
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
    
    /**
     * Updates the scraping progress display
     */
    public updateProgress(current: number, total: number, message: string, details: string = '') {
        const percent = Math.floor((current / total) * 100);
        
        this.statusText.setText(message);
        this.progressFill.style.width = `${percent}%`;
        this.detailsText.setText(details);
        
        // Re-enable the scrape button when done
        if (current >= total) {
            this.isScraping = false;
            this.scrapeButton.disabled = false;
            this.openNoteButton.disabled = false;
            this.hasScraped = true;
            
            // Add enabled class for styling
            this.openNoteButton.addClass('enabled');
        }
    }
} 