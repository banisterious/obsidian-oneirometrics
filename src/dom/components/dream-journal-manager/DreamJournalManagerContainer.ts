import { App, Notice, Modal, TFile } from 'obsidian';
// Use a type-only import for the plugin to avoid circular dependencies
import type DreamMetricsPlugin from 'main';
import { DreamJournalManagerView } from './DreamJournalManagerView';
import { 
    DreamJournalManagerProps,
    DreamJournalManagerCallbacks,
    JournalManagerTab,
    QuickAction,
    RecentActivity,
    StatusItem,
    SelectionMode,
    ScrapeProgress
} from './DreamJournalManagerTypes';
import { ContentIsolationSettings, JournalTemplate, LintingSettings } from '../../../journal_check/types';
import { TemplaterIntegration } from '../../../journal_check/TemplaterIntegration';

/**
 * Container component for the Dream Journal Manager
 * 
 * This component handles the business logic for the dream journal manager,
 * while delegating rendering to the DreamJournalManagerView component.
 */
export class DreamJournalManagerContainer {
    // Dependencies
    private app: App;
    private plugin: DreamMetricsPlugin;
    private templaterIntegration: TemplaterIntegration;
    
    // Component references
    private view: DreamJournalManagerView;
    
    // Component state
    private activeTab: JournalManagerTab;
    private selectionMode: SelectionMode = 'notes';
    private selectedNotes: string[] = [];
    private selectedFolder: string = '';
    private isScraping: boolean = false;
    private hasScraped: boolean = false;
    
    /**
     * Constructor
     * @param app Obsidian app instance
     * @param container DOM element to render into
     * @param plugin DreamMetricsPlugin instance
     * @param initialTab Initial tab to show
     */
    constructor(
        app: App, 
        container: HTMLElement,
        plugin: DreamMetricsPlugin,
        initialTab: JournalManagerTab = 'dashboard'
    ) {
        this.app = app;
        this.plugin = plugin;
        this.activeTab = initialTab;
        this.templaterIntegration = this.plugin.templaterIntegration;
        
        // Initialize state from plugin settings
        this.selectionMode = plugin.settings.selectionMode || 'notes';
        this.selectedNotes = plugin.settings.selectedNotes || [];
        this.selectedFolder = plugin.settings.selectedFolder || '';
        
        // Create callbacks for view
        const callbacks: DreamJournalManagerCallbacks = {
            // Navigation
            onTabChange: this.handleTabChange.bind(this),
            
            // Dashboard callbacks
            onQuickActionClick: this.handleQuickActionClick.bind(this),
            
            // Dream Scrape callbacks
            onSelectionModeChange: this.handleSelectionModeChange.bind(this),
            onSelectedNotesChange: this.handleSelectedNotesChange.bind(this),
            onSelectedFolderChange: this.handleSelectedFolderChange.bind(this),
            onStartScrape: this.handleStartScrape.bind(this),
            onCancelScrape: this.handleCancelScrape.bind(this),
            onOpenProjectNote: this.handleOpenProjectNote.bind(this),
            onViewMetricsDescriptions: this.handleViewMetricsDescriptions.bind(this),
            
            // Journal Structure callbacks
            onLintingSettingsChange: this.handleLintingSettingsChange.bind(this),
            
            // Templates callbacks
            onCreateTemplate: this.handleCreateTemplate.bind(this),
            onEditTemplate: this.handleEditTemplate.bind(this),
            onDeleteTemplate: this.handleDeleteTemplate.bind(this),
            onApplyTemplate: this.handleApplyTemplate.bind(this),
            
            // Content isolation callbacks
            onContentIsolationSettingsChange: this.handleContentIsolationSettingsChange.bind(this),
            
            // UI customization callbacks
            onCustomCssChange: this.handleCustomCssChange.bind(this)
        };
        
        // Create props for view
        const props: DreamJournalManagerProps = this.getProps();
        
        // Create view
        this.view = new DreamJournalManagerView(props, callbacks);
        
        // Render view
        this.view.render(container);
    }
    
    /**
     * Clean up resources
     */
    public cleanup(): void {
        this.view.cleanup();
    }
    
    /**
     * Generate quick actions for the dashboard
     */
    private getQuickActions(): QuickAction[] {
        return [
            {
                id: 'open-settings',
                label: 'Open Settings',
                icon: 'settings',
                onClick: () => {
                    (this.app as any).setting.open();
                    (this.app as any).setting.openTabById('oneirometrics');
                }
            },
            {
                id: 'scrape-metrics',
                label: 'Scrape Metrics',
                icon: 'sparkles',
                onClick: () => {
                    this.handleTabChange('dream-scrape');
                }
            },
            {
                id: 'check-structure',
                label: 'Check Structure',
                icon: 'check-circle',
                onClick: () => {
                    this.handleTabChange('journal-structure');
                }
            },
            {
                id: 'create-template',
                label: 'Create Template',
                icon: 'file-plus',
                onClick: () => {
                    this.handleTabChange('templates');
                }
            },
            {
                id: 'view-metrics',
                label: 'View Metrics',
                icon: 'bar-chart',
                onClick: () => {
                    this.handleOpenProjectNote();
                }
            },
            {
                id: 'help-docs',
                label: 'Help & Docs',
                icon: 'help-circle',
                onClick: () => {
                    window.open('https://github.com/banisterious/obsidian-oneirometrics/blob/main/docs/user/guides/usage.md', '_blank');
                }
            }
        ];
    }
    
    /**
     * Get recent activities for the dashboard
     */
    private getRecentActivities(): RecentActivity[] {
        // In a real implementation, this would be loaded from the plugin's state
        // For now, return placeholder activities
        return [
            {
                type: 'scrape',
                message: 'Last scrape: 15 entries processed, 7 with metrics',
                timestamp: new Date()
            },
            {
                type: 'validation',
                message: 'Last validation: 2 errors, 1 warning',
                timestamp: new Date()
            },
            {
                type: 'template',
                message: 'Recently used template: "Lucid Dream Template"',
                timestamp: new Date()
            }
        ];
    }
    
    /**
     * Get status items for the dashboard
     */
    private getStatusItems(): StatusItem[] {
        return [
            {
                id: 'selection',
                label: 'Current selection',
                value: `${this.selectedNotes.length} notes selected`
            },
            {
                id: 'templates',
                label: 'Templates',
                value: `${(this.plugin.settings as any).templates?.length || 0} templates defined`
            },
            {
                id: 'structures',
                label: 'Structures',
                value: `${(this.plugin.settings as any).contentIsolation?.callouts?.length || 0} structures defined`
            },
            {
                id: 'validation',
                label: 'Validation',
                value: `${this.plugin.settings.linting?.enabled ? 'Enabled' : 'Disabled'}`
            }
        ];
    }
    
    /**
     * Get default linting settings
     */
    private getDefaultLintingSettings(): LintingSettings {
        return {
            enabled: true,
            rules: [],
            structures: [],
            templates: [],
            templaterIntegration: {
                enabled: false,
                folderPath: '',
                defaultTemplate: ''
            },
            contentIsolation: {
                enabled: true,
                callouts: []
            },
            userInterface: {
                showWarnings: true
            }
        } as unknown as LintingSettings;
    }
    
    /**
     * Handle tab change
     */
    private handleTabChange(tab: JournalManagerTab): void {
        this.activeTab = tab;
        this.view.update({ activeTab: tab });
    }
    
    /**
     * Handle quick action click
     */
    private handleQuickActionClick(actionId: string): void {
        const action = this.getQuickActions().find(a => a.id === actionId);
        if (action) {
            action.onClick();
        }
    }
    
    /**
     * Handle selection mode change
     */
    private handleSelectionModeChange(mode: SelectionMode): void {
        this.selectionMode = mode;
        this.plugin.settings.selectionMode = mode;
        this.plugin.saveSettings();
        
        this.view.update({ 
            selectionMode: mode 
        });
    }
    
    /**
     * Handle selected notes change
     */
    private handleSelectedNotesChange(notes: string[]): void {
        this.selectedNotes = notes;
        this.plugin.settings.selectedNotes = notes;
        this.plugin.saveSettings();
        
        this.view.update({ 
            selectedNotes: notes,
            statusItems: this.getStatusItems()
        });
    }
    
    /**
     * Handle selected folder change
     */
    private handleSelectedFolderChange(folder: string): void {
        this.selectedFolder = folder;
        this.plugin.settings.selectedFolder = folder;
        this.plugin.saveSettings();
        
        this.view.update({ 
            selectedFolder: folder 
        });
    }
    
    /**
     * Handle start scrape
     */
    private handleStartScrape(): void {
        if (this.isScraping) {
            return;
        }
        
        this.isScraping = true;
        this.view.update({ isScraping: true });
        
        // Call the main plugin to start scraping
        // This is just a simulation for now
        if (this.plugin) {
            (this.plugin as any).startScrapeProcess();
        } else {
            // Simulate scraping
            setTimeout(() => {
                this.isScraping = false;
                this.hasScraped = true;
                this.view.update({ 
                    isScraping: false,
                    hasScraped: true
                });
            }, 2000);
        }
    }
    
    /**
     * Handle cancel scrape
     */
    private handleCancelScrape(): void {
        if (!this.isScraping) {
            return;
        }
        
        // Call the main plugin to cancel scraping
        (this.plugin as any).cancelScrapeProcess();
        
        this.isScraping = false;
        this.view.update({ isScraping: false });
    }
    
    /**
     * Handle open project note
     */
    private handleOpenProjectNote(): void {
        const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.projectNote);
        if (file instanceof TFile) {
            this.app.workspace.openLinkText(this.plugin.settings.projectNote, '', true);
        } else {
            new Notice('Metrics note not found. Please set the path in settings.');
        }
    }
    
    /**
     * Handle view metrics descriptions
     */
    private handleViewMetricsDescriptions(): void {
        // In a real implementation, this would open the plugin's metrics descriptions modal
        this.plugin.openMetricsDescriptionsModal();
    }
    
    /**
     * Handle linting settings change
     */
    private handleLintingSettingsChange(settings: Partial<LintingSettings>): void {
        (this.plugin.settings.linting as any) = {
            ...this.plugin.settings.linting,
            ...settings,
            enabled: settings.enabled ?? (this.plugin.settings.linting?.enabled || false)
        };
        
        this.plugin.saveSettings();
        
        this.view.update({
            lintingSettings: this.plugin.settings.linting
        });
    }
    
    /**
     * Handle create template
     */
    private handleCreateTemplate(): void {
        // In a real implementation, this would open the plugin's template wizard
    }
    
    /**
     * Handle edit template
     */
    private handleEditTemplate(templateId: string): void {
        // In a real implementation, this would open the plugin's template wizard with the specified template
    }
    
    /**
     * Handle delete template
     */
    private handleDeleteTemplate(templateId: string): void {
        // In a real implementation, this would delete the specified template
    }
    
    /**
     * Handle apply template
     */
    private handleApplyTemplate(templateId: string, targetFile?: TFile): void {
        // In a real implementation, this would apply the specified template to the target file
    }
    
    /**
     * Handle content isolation settings change
     */
    private handleContentIsolationSettingsChange(settings: Partial<ContentIsolationSettings>): void {
        (this.plugin.settings as any).contentIsolation = {
            ...(this.plugin.settings as any).contentIsolation,
            ...settings
        };
        
        this.plugin.saveSettings();
        
        this.view.update({
            contentIsolationSettings: (this.plugin.settings as any).contentIsolation,
        });
    }
    
    /**
     * Handle custom CSS change
     */
    private handleCustomCssChange(css: string): void {
        (this.plugin.settings as any).customCss = css;
        this.plugin.saveSettings();
        
        this.view.update({
            customCss: css
        });
    }
    
    /**
     * Update the progress display during scraping
     */
    public updateProgress(current: number, total: number, message: string, details: string = ''): void {
        this.view.update({
            scrapeProgress: {
                current,
                total,
                message,
                details,
                isActive: true
            }
        });
        
        // If we're done, update the state
        if (current >= total) {
            this.isScraping = false;
            this.hasScraped = true;
            
            this.view.update({
                isScraping: false,
                hasScraped: true
            });
        }
    }
    
    private getProps(): DreamJournalManagerProps {
        return {
            // General props
            activeTab: this.activeTab,
            quickActions: this.getQuickActions(),
            recentActivities: this.getRecentActivities(),
            statusItems: this.getStatusItems(),
            
            // Selection props
            selectionMode: this.selectionMode,
            selectedNotes: this.selectedNotes,
            selectedFolder: this.selectedFolder,
            
            // Scraping props
            isScraping: this.isScraping,
            hasScraped: this.hasScraped,
            scrapeProgress: {
                current: 0,
                total: 0,
                message: 'Ready',
                isActive: false
            },
            
            // Linting props
            lintingSettings: this.plugin.settings.linting || this.getDefaultLintingSettings(),
            
            // Templates props
            templates: (this.plugin.settings as any).templates || [],
            
            // Content isolation props
            contentIsolationSettings: (this.plugin.settings as any).contentIsolation || {
                enabled: true,
                callouts: []
            },
            
            // UI customization props
            customCss: (this.plugin.settings as any).customCss || ''
        };
    }
} 