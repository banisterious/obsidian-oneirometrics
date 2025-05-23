import { setIcon } from 'obsidian';
import { 
    DreamJournalManagerCallbacks, 
    DreamJournalManagerProps, 
    JournalManagerTab,
    QuickAction,
    RecentActivity,
    StatusItem,
    ScrapeProgress
} from './DreamJournalManagerTypes';
import { createSelectedNotesAutocomplete, createFolderAutocomplete } from '../../../../autocomplete';

/**
 * View component for the Dream Journal Manager
 * 
 * This component handles rendering of the Dream Journal Manager UI
 * without containing any business logic.
 */
export class DreamJournalManagerView {
    private containerEl: HTMLElement;
    private mainContentEl: HTMLElement;
    private sidebarEl: HTMLElement;
    private sectionsEl: { [key in JournalManagerTab]?: HTMLElement } = {};
    private progressContentEl: HTMLElement | null = null;
    private statusTextEl: HTMLElement | null = null;
    private progressBarEl: HTMLElement | null = null;
    private progressFillEl: HTMLElement | null = null;
    private detailsTextEl: HTMLElement | null = null;
    private scrapeButtonEl: HTMLButtonElement | null = null;
    private openNoteButtonEl: HTMLButtonElement | null = null;
    private notesAutoCompleteContainer: HTMLElement | null = null;
    private folderAutoCompleteContainer: HTMLElement | null = null;
    private props: DreamJournalManagerProps;
    private callbacks: DreamJournalManagerCallbacks;
    
    /**
     * Constructor
     * @param props View props
     * @param callbacks Callbacks for user interactions
     */
    constructor(props: DreamJournalManagerProps, callbacks: DreamJournalManagerCallbacks) {
        this.props = props;
        this.callbacks = callbacks;
        
        // Create container elements
        this.containerEl = document.createElement('div');
        this.containerEl.addClass('oom-journal-manager-content');
        
        // Create header
        this.containerEl.createEl('h2', { text: 'Dream Journal Manager', cls: 'oom-journal-manager-title' });
        
        // Create main layout container
        const container = this.containerEl.createDiv({ cls: 'oom-journal-manager-container' });
        this.sidebarEl = container.createDiv({ cls: 'oom-journal-manager-sidebar' });
        this.mainContentEl = container.createDiv({ cls: 'oom-journal-manager-main-content' });
    }
    
    /**
     * Render the Dream Journal Manager view
     * @param containerEl Container element to render into
     */
    public render(containerEl: HTMLElement): void {
        // Add the main container to the provided container
        containerEl.appendChild(this.containerEl);
        
        // Build sidebar navigation
        this.buildSidebar();
        
        // Build content sections
        this.buildDashboardSection();
        this.buildDreamScrapeSection();
        this.buildJournalStructureSection();
        this.buildTemplatesSection();
        this.buildContentIsolationSection();
        this.buildInterfaceSection();
        
        // Show the active tab
        this.showSection(this.props.activeTab);
    }
    
    /**
     * Update the view with new props
     * @param newProps New props to update with
     */
    public update(newProps: Partial<DreamJournalManagerProps>): void {
        // Update props
        this.props = { ...this.props, ...newProps };
        
        // Show the active tab if it changed
        if (newProps.activeTab && newProps.activeTab !== this.props.activeTab) {
            this.showSection(newProps.activeTab);
        }
        
        // Update progress if changed
        if (newProps.scrapeProgress) {
            this.updateProgress(this.props.scrapeProgress);
        }
        
        // Update the UI state based on isScraping
        if (newProps.isScraping !== undefined) {
            this.updateScrapeButtonState(this.props.isScraping);
        }
        
        // Update hasScraped state
        if (newProps.hasScraped !== undefined) {
            this.updateHasScrapedState(this.props.hasScraped);
        }
        
        // If selected notes changed and we have a notes container
        if (newProps.selectedNotes && this.notesAutoCompleteContainer) {
            // The autocomplete component needs to be rebuilt with new selected notes
            this.notesAutoCompleteContainer.empty();
            this.setupNotesAutocomplete(this.notesAutoCompleteContainer);
        }
        
        // If selected folder changed and we have a folder container
        if (newProps.selectedFolder && this.folderAutoCompleteContainer) {
            // The folder autocomplete component needs to be rebuilt with new selected folder
            this.folderAutoCompleteContainer.empty();
            this.setupFolderAutocomplete(this.folderAutoCompleteContainer);
        }
    }
    
    /**
     * Clean up resources
     */
    public cleanup(): void {
        // Remove all event listeners and DOM elements
        this.containerEl.empty();
        if (this.containerEl.parentNode) {
            this.containerEl.parentNode.removeChild(this.containerEl);
        }
    }
    
    /**
     * Builds the sidebar navigation
     */
    private buildSidebar(): void {
        const navItems: { id: JournalManagerTab; label: string; icon: string }[] = [
            { id: 'dashboard', label: 'Dashboard', icon: 'home' },
            { id: 'dream-scrape', label: 'Dream Scraper', icon: 'sparkles' },
            { id: 'journal-structure', label: 'Journal Structure', icon: 'layout' },
            { id: 'templates', label: 'Templates', icon: 'file-text' },
            { id: 'content-isolation', label: 'Content Isolation', icon: 'filter' },
            { id: 'interface', label: 'Interface', icon: 'sliders' }
        ];
        
        for (const item of navItems) {
            const navItemEl = this.sidebarEl.createDiv({ cls: 'oom-nav-item' });
            navItemEl.setAttribute('data-section', item.id);
            
            const iconEl = navItemEl.createSpan({ cls: 'oom-nav-icon' });
            setIcon(iconEl, item.icon);
            
            navItemEl.createSpan({ text: item.label, cls: 'oom-nav-label' });
            
            navItemEl.addEventListener('click', () => {
                this.callbacks.onTabChange(item.id);
            });
        }
    }
    
    /**
     * Shows the specified section and hides all others
     */
    private showSection(sectionId: JournalManagerTab): void {
        // Hide all sections
        Object.values(this.sectionsEl).forEach(el => {
            if (el) el.hide();
        });
        
        // Show the requested section
        if (this.sectionsEl[sectionId]) {
            this.sectionsEl[sectionId]?.show();
        }
        
        // Update active state in sidebar
        const navItems = this.sidebarEl.querySelectorAll('.oom-nav-item');
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
        action: QuickAction
    ): HTMLButtonElement {
        const button = containerEl.createEl('button', { 
            cls: 'oom-quick-action-button', 
            text: action.label 
        });
        
        const iconEl = button.createSpan({ cls: 'oom-quick-action-icon' });
        setIcon(iconEl, action.icon);
        
        button.addEventListener('click', () => {
            this.callbacks.onQuickActionClick(action.id);
        });
        
        return button;
    }
    
    /**
     * Builds the dashboard section (main overview)
     */
    private buildDashboardSection(): void {
        const sectionEl = this.mainContentEl.createDiv();
        this.sectionsEl['dashboard'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Dashboard' });
        
        sectionEl.createEl('p', { 
            text: 'Welcome to the Dream Journal Manager! Manage all aspects of your dream journal from this central hub.'
        });
        
        // Quick Actions Section
        const quickActionsSection = sectionEl.createDiv({ cls: 'oom-dashboard-section' });
        quickActionsSection.createEl('h4', { text: 'Quick Actions' });
        
        const quickActionsGrid = quickActionsSection.createDiv({ cls: 'oom-quick-actions-grid' });
        
        // Add quick action buttons
        this.props.quickActions.forEach(action => {
            this.createQuickActionButton(quickActionsGrid, action);
        });
        
        // Recent Activity Section
        const recentActivitySection = sectionEl.createDiv({ cls: 'oom-dashboard-section' });
        recentActivitySection.createEl('h4', { text: 'Recent Activity' });
        
        const recentActivityList = recentActivitySection.createEl('ul', { cls: 'oom-recent-activity-list' });
        
        // Add recent activities
        this.props.recentActivities.forEach(activity => {
            recentActivityList.createEl('li', { 
                text: `${activity.message} (${activity.timestamp.toLocaleDateString()})` 
            });
        });
        
        // Status Overview Section
        const statusSection = sectionEl.createDiv({ cls: 'oom-dashboard-section' });
        statusSection.createEl('h4', { text: 'Status Overview' });
        
        const statusList = statusSection.createEl('ul', { cls: 'oom-status-list' });
        
        // Add status items
        this.props.statusItems.forEach(item => {
            statusList.createEl('li', { 
                text: `${item.label}: ${item.value}` 
            });
        });
    }
    
    /**
     * Builds the dream scrape section
     */
    private buildDreamScrapeSection(): void {
        const sectionEl = this.mainContentEl.createDiv();
        this.sectionsEl['dream-scrape'] = sectionEl;
        
        // Add data-section attribute for CSS targeting
        sectionEl.setAttribute('data-section', 'dream-scrape');
        
        sectionEl.createEl('h3', { text: 'Dream Scraper' });
        
        sectionEl.createEl('p', { 
            text: 'Extract dream metrics from journal entries.' 
        });
        
        // View Metrics Descriptions Section
        const metricsDescriptionsSection = sectionEl.createDiv({ cls: 'oom-modal-section' });
        
        // Create a container for the heading, helper text, and button
        const metricsDescHeader = metricsDescriptionsSection.createDiv({ cls: 'oom-section-header oom-flex-row' });
        
        // Left side with heading and helper text
        const metricsDescLeft = metricsDescHeader.createDiv({ cls: 'oom-section-header-left oom-flex-grow' });
        metricsDescLeft.createEl('h4', { text: 'View Metrics Descriptions' });
        metricsDescLeft.createEl('p', { 
            text: 'View detailed descriptions of all available metrics',
            cls: 'oom-section-helper'
        });
        
        // Right side with button
        const metricsDescRight = metricsDescHeader.createDiv({ cls: 'oom-section-header-right' });
        
        const viewDescriptionsButton = metricsDescRight.createEl('button', {
            text: 'View Descriptions',
            cls: 'oom-button'
        });
        
        viewDescriptionsButton.addEventListener('click', () => {
            this.callbacks.onViewMetricsDescriptions();
        });
        
        // Mode Selection Section
        const modeSection = sectionEl.createDiv({ cls: 'oom-modal-section' });
        
        // Create a container for the heading, helper text, and dropdown
        const modeSectionHeader = modeSection.createDiv({ cls: 'oom-section-header oom-flex-row' });
        
        // Left side with heading and helper text
        const modeSectionLeft = modeSectionHeader.createDiv({ cls: 'oom-section-header-left oom-flex-grow' });
        modeSectionLeft.createEl('h4', { text: 'Selection Mode' });
        modeSectionLeft.createEl('p', { 
            text: 'Choose whether to scrape individual notes or a folder',
            cls: 'oom-section-helper'
        });
        
        // Right side with dropdown
        const modeSectionRight = modeSectionHeader.createDiv({ cls: 'oom-section-header-right' });
        
        const modeDropdown = modeSectionRight.createEl('select', { cls: 'oom-dropdown' });
        modeDropdown.createEl('option', { text: 'Notes', value: 'notes' });
        modeDropdown.createEl('option', { text: 'Folder', value: 'folder' });
        modeDropdown.value = this.props.selectionMode;
        
        modeDropdown.addEventListener('change', () => {
            this.callbacks.onSelectionModeChange(modeDropdown.value as 'notes' | 'folder');
        });
        
        // File/Folder Selector Section - with less vertical padding
        const selectorSection = sectionEl.createDiv({ cls: 'oom-modal-section oom-selector-section' });
        
        if (this.props.selectionMode === 'folder') {
            selectorSection.createEl('h4', { text: 'Selected Folder' });
            selectorSection.createEl('p', { 
                text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)',
                cls: 'oom-section-helper'
            });
            
            // Create folder selector
            this.folderAutoCompleteContainer = selectorSection.createDiv('oom-folder-selector-container');
            this.setupFolderAutocomplete(this.folderAutoCompleteContainer);
        } else {
            selectorSection.createEl('h4', { text: 'Selected Notes' });
            selectorSection.createEl('p', { 
                text: 'Notes to search for dream metrics (select one or more)',
                cls: 'oom-section-helper'
            });
            
            // Create notes selector
            this.notesAutoCompleteContainer = selectorSection.createDiv('oom-notes-selector-container');
            this.setupNotesAutocomplete(this.notesAutoCompleteContainer);
        }
        
        // Dream Scraping Section
        const scrapingSection = sectionEl.createDiv({ cls: 'oom-modal-section' });
        
        scrapingSection.createEl('h4', { text: 'Scrape Metrics' });
        
        const scrapeButtonContainer = scrapingSection.createDiv({ cls: 'oom-button-container' });
        this.scrapeButtonEl = scrapeButtonContainer.createEl('button', {
            text: 'Start Scraping',
            cls: 'oom-button oom-button-primary'
        });
        
        this.scrapeButtonEl.addEventListener('click', () => {
            if (this.props.isScraping) {
                this.callbacks.onCancelScrape();
            } else {
                this.callbacks.onStartScrape();
            }
        });
        
        // Progress Section (initially hidden)
        this.progressContentEl = scrapingSection.createDiv({ cls: 'oom-progress-content oom-hidden' });
        
        this.statusTextEl = this.progressContentEl.createDiv({ cls: 'oom-status-text' });
        this.statusTextEl.textContent = 'Ready';
        
        const progressContainer = this.progressContentEl.createDiv({ cls: 'oom-progress-container' });
        this.progressBarEl = progressContainer.createDiv({ cls: 'oom-progress-bar' });
        this.progressFillEl = this.progressBarEl.createDiv({ cls: 'oom-progress-fill' });
        
        this.detailsTextEl = this.progressContentEl.createDiv({ cls: 'oom-details-text' });
        
        // Note button (initially hidden)
        const noteButtonContainer = this.progressContentEl.createDiv({ cls: 'oom-button-container' });
        this.openNoteButtonEl = noteButtonContainer.createEl('button', {
            text: 'Open Project Note',
            cls: 'oom-button oom-hidden'
        });
        
        this.openNoteButtonEl.addEventListener('click', () => {
            this.callbacks.onOpenProjectNote();
        });
        
        // Set initial progress if available
        if (this.props.scrapeProgress) {
            this.updateProgress(this.props.scrapeProgress);
        }
        
        // Set initial button state
        this.updateScrapeButtonState(this.props.isScraping);
        
        // Set initial hasScraped state
        this.updateHasScrapedState(this.props.hasScraped);
    }
    
    /**
     * Updates progress display
     */
    private updateProgress(progress: ScrapeProgress): void {
        if (!this.statusTextEl || !this.progressFillEl || !this.detailsTextEl || !this.progressContentEl) {
            return;
        }
        
        // Show the progress content if active
        if (progress.isActive) {
            this.progressContentEl.removeClass('oom-hidden');
        } else {
            this.progressContentEl.addClass('oom-hidden');
            return;
        }
        
        // Update status text
        this.statusTextEl.textContent = progress.message;
        
        // Update progress bar
        const percent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
        this.progressFillEl.style.width = `${percent}%`;
        
        // Update details
        if (progress.details) {
            this.detailsTextEl.textContent = progress.details;
            this.detailsTextEl.removeClass('oom-hidden');
        } else {
            this.detailsTextEl.addClass('oom-hidden');
        }
    }
    
    /**
     * Updates scrape button state based on isScraping
     */
    private updateScrapeButtonState(isScraping: boolean): void {
        if (!this.scrapeButtonEl) return;
        
        if (isScraping) {
            this.scrapeButtonEl.textContent = 'Cancel';
            this.scrapeButtonEl.addClass('oom-cancel-button');
        } else {
            this.scrapeButtonEl.textContent = 'Start Scraping';
            this.scrapeButtonEl.removeClass('oom-cancel-button');
        }
    }
    
    /**
     * Updates UI based on hasScraped state
     */
    private updateHasScrapedState(hasScraped: boolean): void {
        if (!this.openNoteButtonEl) return;
        
        if (hasScraped) {
            this.openNoteButtonEl.removeClass('oom-hidden');
        } else {
            this.openNoteButtonEl.addClass('oom-hidden');
        }
    }
    
    /**
     * Sets up the notes autocomplete
     */
    private setupNotesAutocomplete(containerEl: HTMLElement): void {
        createSelectedNotesAutocomplete({
            app: (window as any).app,
            plugin: (window as any).app.plugins.plugins.oneirometrics,
            containerEl: containerEl,
            selectedNotes: this.props.selectedNotes,
            onChange: (notes: string[]) => {
                this.callbacks.onSelectedNotesChange(notes);
            }
        });
    }
    
    /**
     * Sets up the folder autocomplete
     */
    private setupFolderAutocomplete(containerEl: HTMLElement): void {
        createFolderAutocomplete({
            app: (window as any).app,
            plugin: (window as any).app.plugins.plugins.oneirometrics,
            containerEl: containerEl,
            selectedFolder: this.props.selectedFolder,
            onChange: (folder: string) => {
                this.callbacks.onSelectedFolderChange(folder);
            }
        });
    }
    
    /**
     * Builds the journal structure section
     */
    private buildJournalStructureSection(): void {
        const sectionEl = this.mainContentEl.createDiv();
        this.sectionsEl['journal-structure'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Journal Structure' });
        
        // This would be expanded with the actual journal structure settings
        // For the refactoring, we're focusing on the component structure
        
        const descEl = sectionEl.createEl('p', { 
            text: 'Configure structure validation for your dream journal entries.'
        });
        
        // Placeholder for journal structure settings
        sectionEl.createEl('div', { 
            text: 'Journal structure settings will be implemented here',
            cls: 'oom-placeholder'
        });
    }
    
    /**
     * Builds the templates section
     */
    private buildTemplatesSection(): void {
        const sectionEl = this.mainContentEl.createDiv();
        this.sectionsEl['templates'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Templates' });
        
        // This would be expanded with the actual templates functionality
        // For the refactoring, we're focusing on the component structure
        
        const descEl = sectionEl.createEl('p', { 
            text: 'Manage templates for your dream journal entries.'
        });
        
        // Placeholder for templates
        sectionEl.createEl('div', { 
            text: 'Templates functionality will be implemented here',
            cls: 'oom-placeholder'
        });
    }
    
    /**
     * Builds the content isolation section
     */
    private buildContentIsolationSection(): void {
        const sectionEl = this.mainContentEl.createDiv();
        this.sectionsEl['content-isolation'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Content Isolation' });
        
        // This would be expanded with the actual content isolation settings
        // For the refactoring, we're focusing on the component structure
        
        const descEl = sectionEl.createEl('p', { 
            text: 'Configure how dream content is isolated in your journal entries.'
        });
        
        // Placeholder for content isolation settings
        sectionEl.createEl('div', { 
            text: 'Content isolation settings will be implemented here',
            cls: 'oom-placeholder'
        });
    }
    
    /**
     * Builds the interface section
     */
    private buildInterfaceSection(): void {
        const sectionEl = this.mainContentEl.createDiv();
        this.sectionsEl['interface'] = sectionEl;
        
        sectionEl.createEl('h3', { text: 'Interface' });
        
        // This would be expanded with the actual interface settings
        // For the refactoring, we're focusing on the component structure
        
        const descEl = sectionEl.createEl('p', { 
            text: 'Customize the appearance of the dream journal interface.'
        });
        
        // Placeholder for interface settings
        sectionEl.createEl('div', { 
            text: 'Interface customization will be implemented here',
            cls: 'oom-placeholder'
        });
    }
} 