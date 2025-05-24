// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// External imports (Obsidian)
import { 
  App, 
  Editor, 
  FileSystemAdapter, 
  FileView, 
  MarkdownView, 
  Menu,
  MetadataCache, 
  Modal, 
  Notice, 
  Plugin, 
  Scope, 
  Setting, 
  TFile, 
  TFolder, 
  Vault, 
  WorkspaceLeaf, 
  parseYaml,
  parseFrontMatterEntry,
  parseFrontMatterTags
} from 'obsidian';

// External libraries
import { 
  format, 
  startOfDay, 
  endOfDay, 
  addMonths, 
  subMonths, 
  subDays, 
  subWeeks,
  addDays,
  isAfter,
  isBefore,
  isWithinInterval,
  parse,
  isValid,
  formatISO
} from 'date-fns';

// Internal imports - Types
import { 
  DEFAULT_LOGGING, 
  DEFAULT_METRICS, 
  DreamMetric, 
  DreamMetricData, 
  DreamMetricsSettings, 
  LogLevel,
  JournalStructureSettings
} from './types';

// Internal imports - Helper functions
import {
  getProjectNotePath,
  setProjectNotePath,
  getSelectedFolder,
  setSelectedFolder,
  getSelectionMode,
  setSelectionMode,
  isBackupEnabled,
  getBackupFolderPath,
  getLogMaxSize,
  shouldShowRibbonButtons,
  setShowRibbonButtons,
  getJournalStructure,
  setJournalStructure
} from './src/utils/settings-helpers';

import {
  isMetricEnabled,
  setMetricEnabled,
  getMetricMinValue,
  getMetricMaxValue,
  setMetricRange,
  getMetricRange,
  standardizeMetric
} from './src/utils/metric-helpers';

import {
  getSourceFile,
  getSourceId,
  isObjectSource,
  createSource,
  isCalloutMetadataArray
} from './src/utils/type-guards';

import {
  isFolderMode,
  isNotesMode,
  areSelectionModesEquivalent,
  getSelectionModeLabel,
  normalizeSelectionMode
} from './src/utils/selection-mode-helpers';

// Import the adapter utilities we'll use to fix type errors
import { 
  adaptSettingsToCore,
  getProjectNotePathSafe,
  getSelectionModeSafe,
  getSelectedFolderSafe,
  shouldShowRibbonButtonsSafe,
  isBackupEnabledSafe,
  getBackupFolderPathSafe,
  getExpandedStatesSafe
} from './src/utils/type-adapters';

// Import the DEFAULT_JOURNAL_STRUCTURE_SETTINGS constant directly from the source
import { DEFAULT_JOURNAL_STRUCTURE_SETTINGS } from './src/types/journal-check';

// Import LintingSettings from the root types.ts file for backward compatibility
import { LintingSettings, Timeline, CalendarView, ActiveJournal } from './types';

// Internal imports - Settings
import { DreamMetricsSettingTab, lucideIconMap } from './settings';
import { createFolderAutocomplete, createSelectedNotesAutocomplete } from './autocomplete';

// Internal imports - Logging
import { Logger as LogManager } from './utils/logger';
import { LoggingAdapter } from './src/logging';

// Internal imports - UI Components
import { CustomDateRangeModal } from './src/CustomDateRangeModal';
import { DateNavigatorModal, NavigatorViewMode } from './src/dom/DateNavigatorModal';
import { DateNavigatorView, DATE_NAVIGATOR_VIEW_TYPE } from './src/dom/DateNavigatorView';
import { DateNavigatorIntegration } from './src/dom/DateNavigatorIntegration';

// Import UI components from journal_check/ui using individual imports instead of barrel file
import { 
  DreamJournalManager 
} from './src/journal_check/ui/DreamJournalManager';
import { JournalStructureModal } from './src/journal_check/ui/JournalStructureModal';
import { TestModal } from './src/journal_check/ui/TestModal';
import { TemplateWizard } from './src/journal_check/ui/TemplateWizard';

// Internal imports - Services
import { LintingEngine } from './src/journal_check/LintingEngine';
import { TemplaterIntegration } from './src/journal_check/TemplaterIntegration';
import { TimeFilterManager } from './src/timeFilters';
import { DreamMetricsState } from './src/state/DreamMetricsState';

// Move this to the top of the file, before any functions that use it
let customDateRange: { start: string, end: string } | null = null;

// Create a global logger instance for functions outside the plugin class
let globalLogger: LoggingAdapter | null = null;

// Default settings for linting functionality
const DEFAULT_LINTING_SETTINGS: LintingSettings = {
    enabled: true,
    rules: [
        {
            id: 'dream-callout-required',
            name: 'Dream Callout Required',
            description: 'Requires the dream callout in journal entries',
            type: 'structure',
            severity: 'error',
            enabled: true,
            pattern: '> \\[!dream\\]',
            message: 'Dream journal entries must include a dream callout',
            priority: 10
        }
    ],
    structures: [
        {
            id: 'default-dream-structure',
            name: 'Default Dream Structure',
            description: 'Standard dream journal structure with required callouts',
            type: 'flat',
            rootCallout: 'dream',
            childCallouts: ['symbols', 'reflections', 'interpretation'],
            metricsCallout: 'metrics',
            dateFormat: ['YYYY-MM-DD'],
            requiredFields: ['dream'],
            optionalFields: ['symbols', 'reflections', 'interpretation', 'metrics']
        },
        {
            id: 'nested-dream-structure',
            name: 'Nested Dream Structure',
            description: 'Nested dream journal structure with all callouts inside the root callout',
            type: 'nested',
            rootCallout: 'dream',
            childCallouts: ['symbols', 'reflections', 'interpretation', 'metrics'],
            metricsCallout: 'metrics',
            dateFormat: ['YYYY-MM-DD'],
            requiredFields: ['dream', 'reflections'],
            optionalFields: ['symbols', 'interpretation', 'metrics']
        }
    ],
    templates: [
        {
            id: 'default-template',
            name: 'Standard Dream Journal',
            description: 'Default template for dream journal entries',
            structure: 'default-dream-structure',
            content: `# Dream Journal Entry

> [!dream]
> Enter your dream here.

> [!symbols]
> - Symbol 1: Meaning
> - Symbol 2: Meaning

> [!reflections]
> Add your reflections here.

> [!metrics]
> Clarity: 7
> Vividness: 8
> Coherence: 6
`,
            isTemplaterTemplate: false
        }
    ],
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

class OneiroMetricsModal extends Modal {
    private plugin: DreamMetricsPlugin;
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
    public static activeModal: OneiroMetricsModal | null = null;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
        
        // Import settings helpers
        const { getSelectionMode, getSelectedFolder } = require('./src/utils/settings-helpers');
        
        // Use helper functions to safely get settings values
        this.selectionMode = getSelectionMode(plugin.settings);
        this.selectedNotes = plugin.settings.selectedNotes || [];
        this.selectedFolder = getSelectedFolder(plugin.settings);
    }

    onOpen() {
        // Import settings helpers
        const { setSelectedFolder, setSelectionMode, getProjectNotePath } = require('./src/utils/settings-helpers');
        
        OneiroMetricsModal.activeModal = this;
        const { contentEl } = this;
        // Reset scrape state when modal is opened
        this.hasScraped = false;
        if (this.openNoteButton) {
            this.openNoteButton.disabled = true;
            this.openNoteButton.title = 'Run a scrape to enable this';
            this.openNoteButton.classList.remove('enabled');
        }
        // Set modal dimensions and classes first
        this.modalEl.style.width = '600px';
        this.modalEl.style.maxHeight = '80vh';
        this.modalEl.addClass('oom-modal');
        // Clear and set up content container
        contentEl.empty();
        contentEl.className = 'modal-content oom-modal'; // Only these classes, per spec

        // Create title
        contentEl.createEl('h2', { text: 'OneiroMetrics Dream Scrape', cls: 'oom-modal-title' });

        // Add dismissible note
        if (!this.noteDismissed) {
            const noteEl = contentEl.createEl('div', { cls: 'oom-modal-note' });
            noteEl.createEl('strong', { text: 'Note: ' });
            noteEl.createEl('span', { 
                text: 'This is where you kick off the "scraping" process, which searches your selected notes or folder and gathers up dream entries and metrics. Click the Scrape button to begin, or change your files/folder selection, below.'
            });
        }

        // --- Selection Mode Row ---
        const modeRow = contentEl.createEl('div', { cls: 'oom-modal-section oom-modal-row' });
        const modeLeft = modeRow.createEl('div', { cls: 'oom-modal-col-left' });
        modeLeft.createEl('label', { text: 'File or folder selection', cls: 'oom-modal-label' });
        modeLeft.createEl('div', { text: 'Choose whether to select individual notes or a folder for metrics scraping', cls: 'oom-modal-helper' });
        const modeRight = modeRow.createEl('div', { cls: 'oom-modal-col-right' });
        const modeDropdown = modeRight.createEl('select', { cls: 'oom-dropdown' });
        modeDropdown.createEl('option', { text: 'Notes', value: 'notes' });
        modeDropdown.createEl('option', { text: 'Folder', value: 'folder' });
        modeDropdown.value = this.selectionMode;

        // --- File/Folder Selector Row ---
        const selectorRow = contentEl.createEl('div', { cls: 'oom-modal-section oom-modal-row' });
        const selectorLeft = selectorRow.createEl('div', { cls: 'oom-modal-col-left' });
        if (this.selectionMode === 'folder') {
            selectorLeft.createEl('label', { text: 'Selected Folder', cls: 'oom-modal-label' });
            selectorLeft.createEl('div', { text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)', cls: 'oom-modal-helper' });
        } else {
            selectorLeft.createEl('label', { text: 'Selected Notes', cls: 'oom-modal-label' });
            selectorLeft.createEl('div', { text: 'Notes to search for dream metrics (select one or more)', cls: 'oom-modal-helper' });
        }
        const selectorRight = selectorRow.createEl('div', { cls: 'oom-modal-col-right' });
        if (this.selectionMode === 'folder') {
            // Restore folder autocomplete
            const folderAutocompleteContainer = selectorRight.createDiv('oom-folder-autocomplete-container');
            import('./autocomplete').then(({ createFolderAutocomplete }) => {
                createFolderAutocomplete({
                    app: this.app,
                    plugin: this,
                    containerEl: folderAutocompleteContainer,
                    selectedFolder: this.selectedFolder,
                    onChange: async (folder) => {
                        this.selectedFolder = folder;
                        setSelectedFolder(this.plugin.settings, folder);
                        await this.plugin.saveSettings();
                    }
                });
            });
        } else {
            // Restore notes autocomplete
            const notesAutocompleteContainer = selectorRight.createDiv('oom-notes-autocomplete-container');
            import('./autocomplete').then(({ createSelectedNotesAutocomplete }) => {
                createSelectedNotesAutocomplete({
                    app: this.app,
                    plugin: this,
                    containerEl: notesAutocompleteContainer,
                    selectedNotes: this.selectedNotes,
                    onChange: async (selected) => {
                        this.selectedNotes = selected;
                        this.plugin.settings.selectedNotes = selected;
                        await this.plugin.saveSettings();
                    }
                });
            });
        }

        // --- Scrape Button Row ---
        const scrapeRow = contentEl.createEl('div', { cls: 'oom-modal-section oom-modal-row' });
        const scrapeLeft = scrapeRow.createEl('div', { cls: 'oom-modal-col-left' });
        scrapeLeft.createEl('label', { text: 'Scrape Files or Folder', cls: 'oom-modal-label' });
        scrapeLeft.createEl('div', { text: 'Begin the scraping operation', cls: 'oom-modal-helper' });
        const scrapeRight = scrapeRow.createEl('div', { cls: 'oom-modal-col-right' });
        this.scrapeButton = scrapeRight.createEl('button', {
            text: 'Scrape Notes',
            cls: 'mod-cta oom-modal-button oom-scrape-button'
        });
        this.scrapeButton.addEventListener('click', () => {
            if (!this.isScraping) {
                this.isScraping = true;
                this.scrapeButton.disabled = true;
                this.plugin.scrapeMetrics();
            }
        });

        // Add Settings button directly after Scrape Metrics
        const settingsButton = scrapeRight.createEl('button', {
            text: 'Open Settings',
            cls: 'mod-cta oom-modal-button oom-settings-button'
        });
        settingsButton.addEventListener('click', () => {
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById('oneirometrics');
        });

        // Add Open OneiroMetrics button directly after Settings
        this.openNoteButton = scrapeRight.createEl('button', {
            text: 'Open OneiroMetrics',
            cls: 'mod-cta oom-modal-button oom-open-note-button',
            attr: { title: 'Run a scrape to enable this' }
        });
        this.openNoteButton.disabled = true;
        this.openNoteButton.classList.remove('enabled');
        this.openNoteButton.addEventListener('click', () => {
            if (this.openNoteButton.disabled) return;
            const projPath = getProjectNotePathSafe(this.plugin.settings);
            const file = this.app.vault.getAbstractFileByPath(projPath);
            if (file instanceof TFile) {
                this.app.workspace.openLinkText(projPath, '', true);
            } else {
                new Notice('Metrics note not found. Please set the path in settings.');
                (this.app as any).setting.open('oneirometrics');
            }
        });

        // --- Progress Section ---
        const progressSection = contentEl.createEl('div', { cls: 'oom-modal-section oom-modal-progress' });
        this.progressContent = progressSection.createEl('div', { cls: 'oom-progress-content' });
        this.statusText = this.progressContent.createEl('div', { cls: 'oom-status-text' });
        this.progressBar = this.progressContent.createEl('div', { cls: 'oom-progress-bar' });
        this.progressFill = this.progressBar.createEl('div', { cls: 'oom-progress-fill' });
        this.detailsText = this.progressContent.createEl('div', { cls: 'oom-details-text' });

        // --- Dropdown Change Handler ---
        modeDropdown.addEventListener('change', async (e) => {
            const value = (e.target as HTMLSelectElement).value as 'notes' | 'folder';
            this.selectionMode = value;
            setSelectionMode(this.plugin.settings, value);
            if (value === 'folder') {
                this.plugin.settings.selectedNotes = [];
            } else {
                setSelectedFolder(this.plugin.settings, '');
            }
            await this.plugin.saveSettings();
            // Re-render selector row
            selectorLeft.empty();
            selectorRight.empty();
            if (value === 'folder') {
                selectorLeft.createEl('label', { text: 'Selected Folder', cls: 'oom-modal-label' });
                selectorLeft.createEl('div', { text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)', cls: 'oom-modal-helper' });
                // Restore folder autocomplete
                const folderAutocompleteContainer = selectorRight.createDiv('oom-folder-autocomplete-container');
                import('./autocomplete').then(({ createFolderAutocomplete }) => {
                    createFolderAutocomplete({
                        app: this.app,
                        plugin: this,
                        containerEl: folderAutocompleteContainer,
                        selectedFolder: this.selectedFolder,
                        onChange: async (folder) => {
                            this.selectedFolder = folder;
                            setSelectedFolder(this.plugin.settings, folder);
                            await this.plugin.saveSettings();
                        }
                    });
                });
            } else {
                selectorLeft.createEl('label', { text: 'Selected Notes', cls: 'oom-modal-label' });
                selectorLeft.createEl('div', { text: 'Notes to search for dream metrics (select one or more)', cls: 'oom-modal-helper' });
                // Restore notes autocomplete
                const notesAutocompleteContainer = selectorRight.createDiv('oom-notes-autocomplete-container');
                import('./autocomplete').then(({ createSelectedNotesAutocomplete }) => {
                    createSelectedNotesAutocomplete({
                        app: this.app,
                        plugin: this,
                        containerEl: notesAutocompleteContainer,
                        selectedNotes: this.selectedNotes,
                        onChange: async (selected) => {
                            this.selectedNotes = selected;
                            this.plugin.settings.selectedNotes = selected;
                            await this.plugin.saveSettings();
                        }
                    });
                });
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        if (OneiroMetricsModal.activeModal === this) {
            OneiroMetricsModal.activeModal = null;
        }
    }
}

class ConfirmModal extends Modal {
    private onConfirmCallback: () => void;
    private onCancelCallback: () => void;

    constructor(app: App, title: string, message: string) {
        super(app);
        this.titleEl.setText(title);
        this.contentEl.createEl('p', { text: message });
    }

    set onConfirm(callback: () => void) {
        this.onConfirmCallback = callback;
    }

    set onCancel(callback: () => void) {
        this.onCancelCallback = callback;
    }

    open(): void {
        super.open();
        const buttonContainer = this.contentEl.createEl('div', {
            cls: 'oom-modal-button-container'
        });

        const cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-warning'
        });
        cancelButton.addEventListener('click', () => {
            if (this.onCancelCallback) this.onCancelCallback();
            this.close();
        });

        const confirmButton = buttonContainer.createEl('button', {
            text: 'Confirm',
            cls: 'mod-cta'
        });
        confirmButton.addEventListener('click', () => {
            if (this.onConfirmCallback) this.onConfirmCallback();
            this.close();
        });
    }

    close(): void {
        super.close();
    }
}

export default class DreamMetricsPlugin extends Plugin {
    settings: DreamMetricsSettings;
    ribbonIconEl: HTMLElement;
    statusBarItemEl: HTMLElement;
    timeline: Timeline;
    calendar: CalendarView;
    
    // Use a more specific type for logger
    logger: LogManager | LoggingAdapter;
    
    lintingEngine: LintingEngine;
    templaterIntegration: TemplaterIntegration;
    
    // Dream journal manager reference
    activeJournal: ActiveJournal | null = null;
    private dreamJournalManager: DreamJournalManager;
    private dateNavigator: DateNavigatorIntegration;
    private timeFilterManager: TimeFilterManager;
    
    state: DreamMetricsState;
    
    loadedSettings: boolean = false;
    ribbons: Map<string, HTMLElement> = new Map();
    onlyActiveFile: boolean = false;
    expandedStates: Set<string>;
    private ribbonIcons: HTMLElement[] = [];
    private container: HTMLElement | null = null;
    private journalManagerRibbonEl: HTMLElement | null = null;
    private memoizedTableData = new Map<string, any>();
    private cleanupFunctions: (() => void)[] = [];
    private dateNavigatorIntegration: DateNavigatorIntegration | null = null;
    private currentSortDirection: { [key: string]: 'asc' | 'desc' } = {};

    async onload() {
        // Initialize mutable state and app state
        this.state = new DreamMetricsState();
        
        console.log("Loading Dream Metrics plugin");
        
        // Initialize logs directory for plugin logs
        if (this.app.vault.adapter instanceof FileSystemAdapter) {
            const baseFolder = (this.app.vault.adapter as FileSystemAdapter).getBasePath();
            
            try {
                // Check if logs directory exists
                await this.app.vault.adapter.exists(`${baseFolder}/logs`);
            } catch (error) {
                // If it doesn't exist, try to create it
                try {
                    // @ts-ignore - fs is not in the types
                    await this.app.vault.adapter.mkdir(`${baseFolder}/logs`);
                } catch (mkdirError) {
                    console.error("Could not create logs directory:", mkdirError);
                }
            }
        }
        
        await this.loadSettings();
        
        // Set global logger for functions outside the plugin class
        globalLogger = this.logger as LoggingAdapter;
        
        // Initialize linting engine
        const journalStructure = getJournalStructure(this.settings);
        this.lintingEngine = new LintingEngine(this, journalStructure || DEFAULT_JOURNAL_STRUCTURE_SETTINGS);
        
        // Initialize templater integration
        this.templaterIntegration = new TemplaterIntegration(this.app, this, journalStructure?.templaterIntegration);
        
        // Initialize expanded states set from the settings
        this.expandedStates = new Set();
        if (this.settings.expandedStates) {
            for (const [id, expanded] of Object.entries(this.settings.expandedStates)) {
                if (expanded) {
                    this.expandedStates.add(id);
                }
            }
        }
        
        // Initialize time filter manager
        this.timeFilterManager = new TimeFilterManager();
        
        // Add settings tab
        this.addSettingTab(new DreamMetricsSettingTab(this.app, this));
        
        // Register commands
        this.addCommand({
            id: 'show-metrics',
            name: 'Show Metrics',
            callback: () => {
                this.showMetrics();
            }
        });
        
        this.addCommand({
            id: 'recalculate-metrics',
            name: 'Recalculate Metrics',
            callback: () => {
                this.scrapeMetrics();
            }
        });
        
        this.addCommand({
            id: 'show-date-navigator',
            name: 'Open Date Navigator',
            callback: () => {
                this.showDateNavigator();
            }
        });
        
        this.addCommand({
            id: 'open-project-note',
            name: 'Open Project Note',
            callback: () => {
                this.openProjectNote();
            }
        });
        
        this.addCommand({
            id: 'open-date-range-modal',
            name: 'Set Custom Date Range',
            callback: () => {
                openCustomRangeModal(this.app);
            }
        });
        
        this.addCommand({
            id: 'open-journal-manager',
            name: 'Open Journal Manager',
            callback: () => {
                if (this.dreamJournalManager) {
                    this.dreamJournalManager.open();
                } else {
                    new JournalStructureModal(this.app, this).open();
                }
            }
        });
        
        this.addCommand({
            id: 'insert-dream-template',
            name: 'Insert Dream Journal Template',
            editorCallback: (editor: Editor) => {
                this.insertTemplate(editor);
            }
        });
        
        this.addCommand({
            id: 'open-template-wizard',
            name: 'Open Template Wizard',
            callback: () => {
                new TemplateWizard(this.app, this).open();
            }
        });
        
        // Register API for use by other plugins
        (window as any).oneirometrics = {
            getMetrics: () => this.state.getMetrics(),
            getDreamEntries: () => this.state.getDreamEntries(),
            openDateNavigator: () => this.showDateNavigator(),
            applyDateFilter: (date: Date) => forceApplyDateFilter(date),
            applyDateRangeFilter: (start: Date, end: Date) => {
                customDateRange = {
                    start: format(start, 'yyyy-MM-dd'),
                    end: format(end, 'yyyy-MM-dd')
                };
                saveLastCustomRange(customDateRange);
                applyCustomDateRangeFilter();
            }
        };
        
        // Load custom date range from localStorage if available
        customDateRange = loadLastCustomRange();
        
        // Initialize ribbon icons
        this.addRibbonIcons();
        
        // Register date navigator view
        this.registerView(
            DATE_NAVIGATOR_VIEW_TYPE,
            (leaf) => new DateNavigatorView(leaf, this)
        );
        
        // Initialize date navigator for reuse
        this.dateNavigatorIntegration = new DateNavigatorIntegration(this.app, this);
        
        // Assign window object for external access
        (window as any).forceApplyDateFilter = forceApplyDateFilter;
        
        // Initialize dream journal manager
        this.dreamJournalManager = new DreamJournalManager(this.app, this);
        
        // Load CSS styles
        this.loadStyles();
        
        // Check log file size periodically
        this.registerInterval(
            window.setInterval(() => this.checkLogFileSize(), 1000 * 60 * 60) // Check every hour
        );
    }

    onunload() {
        console.log("Unloading Dream Metrics plugin");
        
        // Remove ribbon icons
        this.removeRibbonIcons();
        
        // Clean up any registered event listeners and observers
        for (const cleanup of this.cleanupFunctions) {
            cleanup();
        }
        
        // Clear any cached data
        this.memoizedTableData.clear();
        
        // Save the expanded states before unloading
        if (this.loadedSettings) {
            const expandedStatesRecord: Record<string, boolean> = {};
            for (const id of this.expandedStates) {
                expandedStatesRecord[id] = true;
            }
            this.settings.expandedStates = expandedStatesRecord;
            this.saveSettings();
        }
    }

    async saveSettings() {
        // Save expandedStates from set to object
        if (this.expandedStates) {
            // Create a new object for expanded states
            const expandedStatesObj: Record<string, boolean> = {};
            
            // Add all expanded states from the set
            this.expandedStates.forEach(id => {
                expandedStatesObj[id] = true;
            });
            
            // Safely set the property
            this.settings.expandedStates = expandedStatesObj;
        }
        
        await this.saveData(this.settings);
        
        // Update ribbon icons after saving settings
        this.updateRibbonIcons();
    }

    async loadSettings() {
        const data = await this.loadData();
        // Apply the adapter to ensure all properties exist with correct types
        this.settings = adaptSettingsToCore(data || {});
        this.loadedSettings = true;
        
        // Use the expandedStates helper instead of direct access
        this.expandedStates = new Set<string>();
        
        // Use helper to safely get expanded states
        const expandedStatesMap = getExpandedStatesSafe(this.settings);
        if (expandedStatesMap) {
            Object.entries(expandedStatesMap).forEach(([id, isExpanded]) => {
                if (isExpanded) {
                    this.expandedStates.add(id);
                }
            });
        }
        
        // Initialize the logger with safe property access
        if (!globalLogger) {
            const logLevel = this.settings.logging?.level || 'info';
            const maxSize = getLogMaxSize(this.settings);
            const maxBackups = this.settings.logging?.maxBackups || 3;
            
            // Fix the constructor to use the correct signature
            this.logger = new LoggingAdapter(this.app);
            // Then configure it separately
            this.logger.configure(logLevel as LogLevel, maxSize, maxBackups);
            globalLogger = this.logger;
        } else {
            this.logger = globalLogger;
        }
        
        // Initialize other components with consistent settings access
        
        // Create proper settings object for DreamMetricsState
        const stateSettings = {
            projectNote: getProjectNotePath(this.settings),
            selectedNotes: this.settings.selectedNotes || [],
            selectedFolder: getSelectedFolder(this.settings),
            selectionMode: getSelectionMode(this.settings),
            calloutName: this.settings.calloutName || 'dream',
            metrics: this.settings.metrics || {},
            showRibbonButtons: shouldShowRibbonButtons(this.settings),
            backupEnabled: isBackupEnabled(this.settings),
            backupFolderPath: getBackupFolderPath(this.settings),
            logging: {
                level: this.settings.logging?.level || 'info'
            }
        };
        
        // Initialize state management with proper constructor parameters
        this.state = new DreamMetricsState(stateSettings);
        
        // Initialize the time filter manager with proper parameters
        this.timeFilterManager = new TimeFilterManager();
        
        // Create proper settings object for TemplaterIntegration
        const templaterSettings = {
            enabled: true,
            templateFolder: this.settings.journalStructure?.templaterIntegration?.folderPath || 'templates/dreams',
            defaultTemplate: this.settings.journalStructure?.templaterIntegration?.defaultTemplate || ''
        };
        
        // Use type-safe property access for integration components
        this.templaterIntegration = new TemplaterIntegration(
            this.app,
            this,
            templaterSettings
        );
        
        // Use proper constructor parameters for DateNavigatorIntegration
        this.dateNavigator = new DateNavigatorIntegration(
            this.app,
            this
        );
        
        // Initialize the linting engine with safe property access
        const journalStructure = getJournalStructure(this.settings);
        this.lintingEngine = new LintingEngine(journalStructure || DEFAULT_JOURNAL_STRUCTURE_SETTINGS);
        
        // Initialize UI components
        this.dreamJournalManager = new DreamJournalManager(this.app, this);
    }

    /**
     * Validate the structure of the current file
     */
    private async validateCurrentFile() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No file is active');
            return;
        }
        
        // Get the content of the file
        const content = await this.app.vault.read(activeFile);
        
        // Validate content
        const results = this.lintingEngine.validate(content);
        
        // If no issues, show a success notice
        if (results.length === 0) {
            new Notice('No structure issues found! 🎉');
            return;
        }
        
        // Otherwise, show the validation modal with the results
        const modal = new TestModal(this.app, this);
        modal.open();
    }
    
    public async showMetrics() {
        // Get the active leaf
        const leaf = this.app.workspace.activeLeaf;
        // ... existing code ...
    }

    async scrapeMetrics() {
        globalLogger?.info('Scrape', 'Starting metrics scrape process');
        // Show progress modal with detailed status
        const progressModal = new Modal(this.app);
        progressModal.titleEl.setText('Scraping Dream Metrics...');
        const progressContent = progressModal.contentEl.createEl('div', { cls: 'oom-progress-content' });
        const statusText = progressContent.createEl('div', { cls: 'oom-status-text' });
        const progressBar = progressContent.createEl('div', { cls: 'oom-progress-bar' });
        const progressFill = progressBar.createEl('div', { cls: 'oom-progress-fill' });
        const detailsText = progressContent.createEl('div', { cls: 'oom-details-text' });
        progressModal.open();
        progressBar.style.height = '8px';
        progressBar.style.background = '#eee';
        progressBar.style.borderRadius = '4px';
        progressBar.style.margin = '1em 0';
        progressFill.style.height = '100%';
        progressFill.style.background = 'var(--interactive-accent, #2563eb)';
        progressFill.style.width = '0%';
        progressFill.style.borderRadius = '4px';
        progressModal.open();

        const metrics: Record<string, number[]> = {};
        const dreamEntries: DreamMetricData[] = [];
        let totalWords = 0;
        let entriesProcessed = 0;
        let calloutsFound = 0;
        let validNotes = 0;
        let foundAnyJournalEntries = false;
        let foundAnyMetrics = false;

        // Import our helper functions to access settings safely
        const { getSelectionMode, getSelectedFolder } = require('./src/utils/settings-helpers');

        // --- Flexible Note/Folder Selection (mirroring settings tab) ---
        new Setting(progressContent)
            .setName('Selection Mode')
            .setDesc('Choose whether to select individual notes or a folder for metrics scraping')
            .addDropdown(drop => {
                drop.addOption('notes', 'Notes');
                drop.addOption('folder', 'Folder');
                // Use helper to get selection mode safely
                const currentMode = getSelectionMode(this.settings);
                drop.setValue(currentMode);
                drop.onChange(async (value) => {
                    const { setSelectionMode } = require('./src/utils/settings-helpers');
                    // Use helper to set selection mode safely
                    setSelectionMode(this.settings, value as 'notes' | 'folder');
                    // Clear irrelevant selection when switching modes
                    if (value === 'folder') {
                        this.settings.selectedNotes = [];
                    } else {
                        const { setSelectedFolder } = require('./src/utils/settings-helpers');
                        setSelectedFolder(this.settings, '');
                    }
                    await this.saveSettings();
                    this.scrapeMetrics();
                });
            });

        // Dynamic label and field
        const currentMode = getSelectionMode(this.settings);
        let selectionLabel = currentMode === 'folder' ? 'Selected Folder' : 'Selected Notes';
        let selectionDesc = currentMode === 'folder'
            ? 'Choose a folder to recursively search for dream metrics (max 200 files)'
            : 'Notes to search for dream metrics (select one or more)';
        let selectionSetting = new Setting(progressContent)
            .setName(selectionLabel)
            .setDesc(selectionDesc);

        if (currentMode === 'folder') {
            // Folder autocomplete (styled like in settings)
            selectionSetting.addSearch(search => {
                const selectedFolder = getSelectedFolder(this.settings);
                search.setPlaceholder('Choose folder...');
                search.setValue(selectedFolder);
                // ... rest of existing code ...
            });
        } else {
            // Multi-chip note autocomplete (existing)
            selectionSetting.addExtraButton(button => { }); // No-op for layout
            const searchFieldContainer = progressContent.createEl('div', { cls: 'oom-multiselect-search-container' });
            const chipsContainer = progressContent.createEl('div', { cls: 'oom-multiselect-chips-container' });
            chipsContainer.style.display = (this.settings.selectedNotes && this.settings.selectedNotes.length > 0) ? '' : 'none';
            import('./autocomplete').then(({ createSelectedNotesAutocomplete }) => {
                createSelectedNotesAutocomplete({
                    app: this.app,
                    plugin: this,
                    containerEl: searchFieldContainer,
                    selectedNotes: this.settings.selectedNotes,
                    onChange: (selected) => {
                        this.settings.selectedNotes = selected;
                        chipsContainer.style.display = (selected && selected.length > 0) ? '' : 'none';
                        this.saveSettings();
                    }
                });
            });
        }

        // After the selection UI, define files for scraping
        let files: string[] = [];
        const mode = getSelectionMode(this.settings);
        const selectedFolderPath = getSelectedFolder(this.settings);
        if (mode === 'folder' && selectedFolderPath) {
            // Recursively gather up to 200 markdown files from the selected folder
            const folder = this.app.vault.getAbstractFileByPath(selectedFolderPath);
            if (folder && folder instanceof TFolder) {
                const gatherFiles = (folder: TFolder, acc: string[]) => {
                    for (const child of folder.children) {
                        if (child instanceof TFile && child.extension === 'md') {
                            acc.push(child.path);
                            if (acc.length >= 200) break;
                        } else if (child instanceof TFolder) {
                            gatherFiles(child, acc);
                            if (acc.length >= 200) break;
                        }
                    }
                };
                const acc: string[] = [];
                gatherFiles(folder, acc);
                files = acc.slice(0, 200);
            }
            // Exclude files if user previewed and unchecked them
            const pluginAny = this as any;
            if (Array.isArray(pluginAny._excludedFilesForNextScrape)) {
                files = files.filter((f: string) => !pluginAny._excludedFilesForNextScrape.includes(f));
            }
        } else {
            // Default: use selectedNotes
            files = this.settings.selectedNotes || [];
        }

        if (!files || files.length === 0) {
            new Notice('No notes selected. Please select at least one note or a folder to scrape.');
            globalLogger?.warn('Scrape', 'No notes selected for processing');
            progressModal.close();
            return;
        }

        // Process files in batches of 5
        const BATCH_SIZE = 5;
        const totalFiles = files.length;
        globalLogger?.debug('Scrape', `Processing ${totalFiles} files in batches of ${BATCH_SIZE}`);

        for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (path) => {
                const file = this.app.vault.getAbstractFileByPath(path);
                if (!(file instanceof TFile)) {
                    globalLogger?.warn('Scrape', `File not found or not a file: ${path}`);
                    return;
                }
                validNotes++;
                try {
                    const content = await this.app.vault.read(file);
                    globalLogger?.debug('Scrape', `Processing file: ${path}`, { contentLength: content.length });

                    // Update progress
                    statusText.setText(`Processing file ${i + 1} of ${totalFiles}: ${path}`);
                    progressFill.style.width = `${((i + 1) / totalFiles) * 100}%`;
                    detailsText.setText(`Found ${entriesProcessed} entries, ${calloutsFound} callouts`);

                    // --- Robust Nested Callout Parsing ---
                    // Split content into lines
                    const lines = content.split('\n');
                    let journals: any[] = [];
                    let currentJournal: any = null;
                    let currentDiary: any = null;
                    let currentMetrics: any = null;
                    let blockLevel = 0;
                    let blockStack: any[] = [];
                    
                    // Helper to get callout type from a line
                    const getCalloutType = (line: string) => {
                        const match = line.match(/^>+\s*\[!(\w[\w-]*)/i);
                        return match ? match[1].toLowerCase() : null;
                    };
                    
                    // Helper to get blockquote level
                    const getBlockLevel = (line: string) => {
                        const match = line.match(/^(>+)/);
                        return match ? match[1].length : 0;
                    };
                    
                    // --- BEGIN IMPROVED STACK LOGIC ---
                    for (let idx = 0; idx < lines.length; idx++) {
                        const line = lines[idx];
                        const level = getBlockLevel(line);
                        const calloutType = getCalloutType(line);
                        
                        // Only pop the stack if the current level is LESS than the top of the stack's level
                        while (blockStack.length > 0 && blockStack[blockStack.length - 1].level > level) {
                            blockStack.pop();
                        }
                        
                        if (calloutType === 'journal-entry') {
                            currentJournal = {
                                lines: [line],
                                level,
                                idx,
                                diaries: []
                            };
                            journals.push(currentJournal);
                            blockStack.push({ type: 'journal-entry', obj: currentJournal, level });
                            calloutsFound++;
                        } else if (calloutType === 'dream-diary') {
                            currentDiary = {
                                lines: [line],
                                level,
                                idx,
                                metrics: []
                            };
                            // Attach to parent journal-entry if present
                            if (blockStack.length > 0 && blockStack[blockStack.length - 1].type === 'journal-entry') {
                                blockStack[blockStack.length - 1].obj.diaries.push(currentDiary);
                            }
                            blockStack.push({ type: 'dream-diary', obj: currentDiary, level });
                            calloutsFound++;
                        } else if (calloutType === 'dream-metrics') {
                            currentMetrics = {
                                lines: [line],
                                level,
                                idx
                            };
                            // Attach to parent dream-diary if present
                            if (blockStack.length > 0 && blockStack[blockStack.length - 1].type === 'dream-diary') {
                                blockStack[blockStack.length - 1].obj.metrics.push(currentMetrics);
                            }
                            blockStack.push({ type: 'dream-metrics', obj: currentMetrics, level });
                            calloutsFound++;
                        } else if (blockStack.length > 0) {
                            // Add line to current block
                            blockStack[blockStack.length - 1].obj.lines.push(line);
                        }
                    }
                    
                    // Now extract data from the parsed structure
                    for (const journal of journals) {
                        if (journal.diaries.length > 0) {
                            foundAnyJournalEntries = true;
                            for (const diary of journal.diaries) {
                                for (const metricsBlock of diary.metrics) {
                                    // Extract metrics text
                                    const metricsText = metricsBlock.lines.map((l: string) => l.replace(/^>+\s*/, '')).join(' ').replace(/\s+/g, ' ').trim();
                                    
                                    // Extract dream content (all lines in diary except metrics blocks)
                                    const diaryContentLines = diary.lines.filter((l: string) => !/^>+\s*\[!dream-diary/i.test(l) && !/^>+\s*\[!dream-metrics/i.test(l));
                                    let dreamContent = diaryContentLines.map((l: string) => l.replace(/^>+\s*/, '').trim()).join(' ').replace(/\s+/g, ' ').trim();
                                    
                                    // Extract date and title from the journal and diary callout lines
                                    const journalLine = journal.lines[0];
                                    const diaryLine = diary.lines[0];
                                    
                                    // More flexible date extraction
                                    let date = getDreamEntryDate([journalLine, lines[journal.idx + 1] || ''], path, content);
                                    if (!date) {
                                        console.error(`[OneiroMetrics] Could not extract date for journal at line: ${journalLine}`);
                                    }
                                    
                                    // More flexible title extraction
                                    let title = '';
                                    let blockId = '';
                                    // Try dream-diary callout format
                                    const titleMatch = diaryLine.match(/\[!dream-diary\](?:\s*\[\[.*?\]\])?\s*(.*?)(?:\s*\[\[|$)/);
                                    if (titleMatch) {
                                        title = titleMatch[1].trim();
                                    }
                                    // Try block reference format
                                    if (!title) {
                                        const blockRefMatch = diaryLine.match(/\[\[.*?\|(.*?)\]\]/);
                                        if (blockRefMatch) {
                                            title = blockRefMatch[1].trim();
                                        }
                                    }
                                    // Try plain text after callout
                                    if (!title) {
                                        const plainTextMatch = diaryLine.match(/\[!dream-diary\](?:\s*\[\[.*?\]\])?\s*(.*)/);
                                        if (plainTextMatch) {
                                            title = plainTextMatch[1].trim();
                                        }
                                    }
                                    // Default if no title found
                                    if (!title) {
                                        title = 'Untitled Dream';
                                    }

                                    // Extract block ID if present
                                    const blockIdMatch = diaryLine.match(/\^(\d{8})/);
                                    if (blockIdMatch) {
                                        blockId = blockIdMatch[1];
                                        console.log(`[OneiroMetrics] Found block ID: ${blockId}`);
                                    }
                                    
                                    // Parse metrics
                                    const dreamMetrics = this.processMetrics(metricsText, metrics);
                                    dreamMetrics['Words'] = dreamContent.split(/\s+/).length;
                                    if (!metrics['Words']) {
                                        metrics['Words'] = [];
                                    }
                                    metrics['Words'].push(dreamMetrics['Words']);
                                    
                                    // Add dream entry
                                    foundAnyMetrics = true;
                                    const dreamTitle = title || 'Untitled Dream';
                                    const dreamEntry: any = {  // Use any temporarily to avoid type errors
                                        date: date ? date.format('YYYY-MM-DD') : 'Unknown date',
                                        title: dreamTitle || 'Untitled Dream',
                                        content: dreamContent,
                                        source: {
                                            file: path,
                                            id: blockId // Store the block ID
                                        },
                                        wordCount: dreamMetrics['Words'],
                                        metrics: dreamMetrics,
                                        calloutMetadata: [{
                                            type: 'dream', // Default type for dream callouts
                                            id: blockId
                                        }]
                                    };
                                    dreamEntries.push(dreamEntry);
                                    entriesProcessed++;
                                }
                            }
                        }
                    }
                    // --- END IMPROVED STACK LOGIC ---
                    // After the blockStack/line-walking loop, before extracting dream entries:
                    console.log('[OneiroMetrics][DEBUG] Parsed callout structure for file:', path, JSON.stringify({ journals, blockStack }, null, 2));
                } catch (error) {
                    globalLogger?.error('Scrape', `Error processing file ${path}:`, error as Error);
                    new Notice(`Error processing file: ${path}`);
                }
            });

            // Wait for batch to complete
            await Promise.all(batchPromises);
        }

        // Final validation and logging
        globalLogger?.info('Scrape', 'Scrape complete', {
            validNotes,
            journalEntriesFound: foundAnyJournalEntries,
            metricsFound: foundAnyMetrics,
            entriesProcessed,
            calloutsFound
        });

        if (validNotes === 0) {
            globalLogger?.warn('Scrape', 'No valid notes found');
            new Notice('No valid notes found. Please check your selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyJournalEntries) {
            globalLogger?.warn('Scrape', 'No journal entries found');
            new Notice('No journal entries found in selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyMetrics) {
            globalLogger?.warn('Scrape', 'No dream metrics callouts found');
            new Notice('No dream metrics callouts found in selected notes.');
            progressModal.close();
            return;
        }
        if (entriesProcessed === 0) {
            globalLogger?.warn('Scrape', 'No metrics data found');
            new Notice('No metrics data found in selected notes.');
            progressModal.close();
            return;
        }

        // Sort and update
        dreamEntries.sort((a, b) => a.date.localeCompare(b.date));
        globalLogger?.info('Scrape', `Updating project note with ${dreamEntries.length} entries`);
        this.updateProjectNote(metrics, dreamEntries);
        progressModal.close();

        // Show the Open OneiroMetrics Note button in the modal
        if (OneiroMetricsModal.activeModal) {
            OneiroMetricsModal.activeModal.hasScraped = true;
            if (OneiroMetricsModal.activeModal.openNoteButton) {
                const btn = OneiroMetricsModal.activeModal.openNoteButton;
                btn.disabled = false;
                btn.title = 'Open OneiroMetrics';
                btn.classList.add('enabled');
            }
        }
    }

    private processDreamContent(content: string): string {
        // Remove callouts and images
        content = content.replace(/\[!.*?\]/g, '')
                       .replace(/!\[\[.*?\]\]/g, '')
                       .replace(/\[\[.*?\]\]/g, '')
                       .trim();
        
        // Remove any remaining markdown artifacts
        content = content.replace(/[#*_~`]/g, '')
                       .replace(/\n{3,}/g, '\n\n')
                       .replace(/^>\s*>/g, '') // Remove nested blockquotes
                       .replace(/^>\s*/gm, '') // Remove single blockquotes
                       .trim();
        
        return content;
    }

    private processMetrics(metricsText: string, metrics: Record<string, number[]>): Record<string, number> {
        const dreamMetrics: Record<string, number> = {};
        const metricPairs = metricsText.split(',').map(pair => pair.trim());
        
        globalLogger?.debug('Metrics', 'Processing metrics text', { text: metricsText });
        
        for (const pair of metricPairs) {
            const [name, value] = pair.split(':').map(s => s.trim());
            if (name && value !== '—' && !isNaN(Number(value))) {
                const numValue = Number(value);
                // Find the matching metric name from settings (case-insensitive)
                const metricName = Object.values(this.settings.metrics).find(
                    m => m.name.toLowerCase() === name.toLowerCase()
                )?.name || name;
                
                dreamMetrics[metricName] = numValue;
                
                // Update global metrics record
                if (!metrics[metricName]) {
                    metrics[metricName] = [];
                }
                metrics[metricName].push(numValue);
                
                globalLogger?.debug('Metrics', `Processed metric: ${metricName} = ${numValue}`);
            }
        }
        
        globalLogger?.debug('Metrics', 'Completed metrics processing', { dreamMetrics });
        return dreamMetrics;
    }

    private async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]) {
        const projectNotePath = getProjectNotePathSafe(this.settings);
        
        globalLogger?.debug('ProjectNote', 'updateProjectNote called', { 
            projectNote: projectNotePath,
            entriesCount: dreamEntries.length 
        });
        
        const projectFile = this.app.vault.getAbstractFileByPath(projectNotePath);
        new Notice(`[DEBUG] updateProjectNote called for: ${projectNotePath}`);
        
        if (!(projectFile instanceof TFile)) {
            globalLogger?.error('ProjectNote', 'Project note not found', { path: projectNotePath });
            new Notice(`[DEBUG] Project note not found: ${projectNotePath}`);
            return;
        }
        
        if (dreamEntries.length === 0) {
            globalLogger?.warn('ProjectNote', 'No dream entries to update', { projectNote: projectNotePath });
            new Notice('[DEBUG] updateProjectNote called with zero dream entries. No update will be performed.');
            return;
        }

        try {
            const existingContent = await this.app.vault.read(projectFile);
            
            // Define markers for the metrics section
            const startMarker = '<!-- OOM METRICS START -->';
            const endMarker = '<!-- OOM METRICS END -->';

            // Generate new content with markers
            const newMetricsContent = startMarker + '\n\n' + this.generateMetricsTable(metrics, dreamEntries) + '\n\n' + endMarker;

            let newContent = '';
            if (existingContent.includes(startMarker) && existingContent.includes(endMarker)) {
                // Replace content between markers
                const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
                newContent = existingContent.replace(regex, newMetricsContent);
            } else {
                // If no markers exist, append to the end of the file
                newContent = existingContent.trim() + '\n\n' + newMetricsContent;
            }

            // Only proceed if content has changed
            if (newContent !== existingContent) {
                await this.app.vault.modify(projectFile, newContent);
                new Notice('Metrics tables updated successfully!');
                globalLogger?.info('ProjectNote', 'Project note updated with new metrics and dream entries');
                
                // Force reload of the project note in all open leaves
                let reloaded = false;
                this.app.workspace.iterateAllLeaves(leaf => {
                    if (leaf.view instanceof MarkdownView && leaf.view.file && leaf.view.file.path === projectNotePath) {
                        leaf.openFile(projectFile, { active: leaf === this.app.workspace.activeLeaf });
                        reloaded = true;
                        globalLogger?.debug('ProjectNote', 'Forced reload of project note in workspace leaf');
                    }
                });
                
                if (!reloaded) {
                    globalLogger?.debug('ProjectNote', 'Project note was not open in any workspace leaf');
                }
                
                // Update view after content change
                this.updateProjectNoteView();
                // Attach event listeners after table render
                setTimeout(() => this.attachProjectNoteEventListeners(), 500);
            } else {
                new Notice('[DEBUG] No changes to metrics tables.');
                globalLogger?.debug('ProjectNote', 'No changes detected in project note content');
                // Attach event listeners after table render
                setTimeout(() => this.attachProjectNoteEventListeners(), 500);
            }
        } catch (error) {
            globalLogger?.error('ProjectNote', 'Failed to update project note', error as Error);
            new Notice(`[ERROR] Failed to update project note: ${error.message}`);
        }
    }

    private async backupProjectNote(file: TFile) {
        if (!isBackupEnabled(this.settings)) {
            const shouldProceed = await this.confirmProceedWithoutBackup();
            if (!shouldProceed) {
                return false;
            }
            return true;
        }
        
        const backupFolderPath = getBackupFolderPath(this.settings);
        
        if (!backupFolderPath) {
            new Notice("Backup folder path not set. Please configure in settings.");
            return false;
        }

        try {
            // Read the file content
            const content = await this.app.vault.read(file);
            
            // Generate timestamp in a more readable format
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
            
            // Create backup filename with original filename and timestamp
            const fileName = file.basename;
            const backupFilePath = `${backupFolderPath}/${fileName}.backup-${timestamp}.bak`;
            
            // Check if backup folder exists
            const backupFolderObj = this.app.vault.getAbstractFileByPath(backupFolderPath);
            if (!backupFolderObj) {
                try {
                    await this.app.vault.createFolder(backupFolderPath);
                    globalLogger?.info('Backup', `Created backup folder: ${backupFolderPath}`);
                } catch (error) {
                    globalLogger?.error('Backup', 'Error creating backup folder', error as Error);
                    throw new Error(`Failed to create backup folder: ${error.message}`);
                }
            }
            
            // Check if backup file already exists
            const existingBackup = this.app.vault.getAbstractFileByPath(backupFilePath);
            if (existingBackup) {
                globalLogger?.warn('Backup', `Backup file already exists: ${backupFilePath}`);
                throw new Error('Backup file already exists');
            }
            
            // Create the backup file
            await this.app.vault.create(backupFilePath, content);
            globalLogger?.info('Backup', `Created backup at: ${backupFilePath}`);
            
            // Clean up old backups (keep last 5)
            try {
                const backupFiles = this.app.vault.getMarkdownFiles()
                    .filter(f => f.path.startsWith(backupFolderPath) && 
                        f.basename.startsWith(fileName) && 
                        f.basename.includes('.backup-'))
                    .sort((a, b) => b.stat.mtime - a.stat.mtime);
                
                // Delete backups older than the 5 most recent
                for (let i = 5; i < backupFiles.length; i++) {
                    await this.app.vault.delete(backupFiles[i]);
                    globalLogger?.debug('Backup', `Deleted old backup: ${backupFiles[i].path}`);
                }
            } catch (error) {
                globalLogger?.warn('Backup', 'Error cleaning up old backups', error as Error);
                // Don't throw here, as the main backup was successful
            }
            
            new Notice(`Backup created: ${backupFilePath}`);
        } catch (error) {
            globalLogger?.error('Backup', 'Error creating backup', error as Error);
            throw new Error(`Failed to create backup: ${error.message}`);
        }
    }

    private async confirmOverwrite(): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new ConfirmModal(
                this.app,
                'Update Metrics Tables',
                'This will overwrite the current metrics tables. A backup will be created before proceeding. Continue?'
            );
            
            modal.onConfirm = () => {
                resolve(true);
            };
            
            modal.onCancel = () => {
                resolve(false);
            };
            
            modal.open();
        });
    }

    private async confirmProceedWithoutBackup(): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.titleEl.setText('Backup Failed');
            modal.contentEl.createEl('p', {
                text: 'Failed to create a backup. Would you like to proceed without a backup?'
            });
            
            const buttonContainer = modal.contentEl.createEl('div', {
                cls: 'oom-modal-button-container'
            });
            
            const cancelButton = buttonContainer.createEl('button', {
                text: 'Cancel',
                cls: 'mod-warning'
            });
            cancelButton.addEventListener('click', () => {
                modal.close();
                resolve(false);
            });
            
            const proceedButton = buttonContainer.createEl('button', {
                text: 'Proceed',
                cls: 'mod-cta'
            });
            proceedButton.addEventListener('click', () => {
                modal.close();
                resolve(true);
            });
            
            modal.open();
        });
    }

    private generateSummaryTable(metrics: Record<string, number[]>): string {
        const rows: string[] = [];
        
        for (const [metricName, values] of Object.entries(metrics)) {
            // Skip empty metrics or those with no values
            if (!values || values.length === 0) continue;
            
            // Get the metric definition from settings
            const metric = this.settings.metrics[metricName];
            if (!metric) continue;
            
            // Skip disabled metrics
            if (!isMetricEnabled(metric)) continue;
            
            // Calculate statistics
            let count = values.length;
            let sum = values.reduce((a, b) => a + b, 0);
            let avg = sum / count;
            let min = Math.min(...values);
            let max = Math.max(...values);
            
            // Create icon HTML
            const iconName = metric.icon || 'circle';
            const icon = getIcon(iconName) || `<span>${iconName}</span>`;
            const iconHtml = icon ? `<span class="oom-metric-icon">${icon}</span>` : '';
            
            // Add row to table
            rows.push(`
                <tr>
                    <td class="oom-metric-name">${iconHtml} ${metricName}</td>
                    <td class="oom-metric-avg">${avg.toFixed(1)}</td>
                    <td class="oom-metric-min">${min}</td>
                    <td class="oom-metric-max">${max}</td>
                    <td class="oom-metric-count">${count}</td>
                </tr>
            `);
        }
        
        // Create the table HTML
        return `
            <table class="oom-summary-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Average</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.join('')}
                </tbody>
            </table>
        `;
    }

    private generateMetricsTable(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): string {
        // Sort dream entries by date, newest first
        dreamEntries.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        // Build headers
        const headers: string[] = [`
            <th class="oom-col-date">Date</th>
            <th class="oom-col-dream">Dream</th>
        `];
        
        // Add metric headers
        for (const metricName of Object.keys(metrics)) {
            const metric = this.settings.metrics[metricName];
            if (!metric) continue;
            
            // Skip disabled metrics
            if (!isMetricEnabled(metric)) continue;
            
            // Create icon HTML
            const iconName = metric.icon || 'circle';
            const icon = getIcon(iconName) || `<span>${iconName}</span>`;
            const iconHtml = icon ? `<span class="oom-metric-icon">${icon}</span>` : '';
            
            headers.push(`
                <th class="oom-col-metric" data-metric="${metricName}">
                    ${iconHtml} ${metricName}
                </th>
            `);
        }
        
        // Create the table HTML
        const tableHtml = `
            <table class="oom-metrics-table">
                <thead>
                    <tr>
                        ${headers.join('')}
                    </tr>
                </thead>
                <tbody>
                    ${dreamEntries.map(entry => `
                        <tr data-date="${entry.date}">
                            <td class="oom-col-date">${this.formatDate(this.parseDate(entry.date))}</td>
                            <td class="oom-col-dream">${entry.title}</td>
                            ${Object.values(metrics).map(metricValues => `
                                <td class="oom-col-metric" data-metric="${Object.keys(metrics)[Object.values(metrics).indexOf(metricValues)]}">${metricValues[0]}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        return tableHtml;
    }

    private validateDate(date: Date): boolean {
        return !isNaN(date.getTime()) && 
               date.getFullYear() >= 1900 && 
               date.getFullYear() <= 2100;
    }

    private parseDate(dateStr: string): Date {
        const startTime = performance.now();
        this.logger.log('Date', `Processing date: ${dateStr}`);
        
        if (!dateStr || dateStr.trim() === '') {
            this.logger.error('Date', 'Empty date string provided');
            return new Date();
        }

        // Try block reference format first (^YYYYMMDD)
        const blockRefMatch = dateStr.match(/\^(\d{8})/);
        if (blockRefMatch) {
            const dateStr = blockRefMatch[1];
            const year = parseInt(dateStr.slice(0, 4));
            const month = parseInt(dateStr.slice(4, 6)) - 1;
            const day = parseInt(dateStr.slice(6, 8));
            const date = new Date(year, month, day);
            if (this.validateDate(date)) {
                this.logger.log('Date', `Parsed block reference format: ${date.toISOString()}`);
                return date;
            }
        }

        // Try YYYY-MM-DD format
        const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
            const [_, year, month, day] = dateMatch;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (this.validateDate(date)) {
                this.logger.log('Date', `Parsed YYYY-MM-DD format: ${date.toISOString()}`);
                return date;
            }
        }

        // Try journal entry format (e.g., "Monday, January 6, 2024")
        const journalEntryMatch = dateStr.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}/);
        if (journalEntryMatch) {
            const dateObj = new Date(journalEntryMatch[0]);
            if (!isNaN(dateObj.getTime())) {
                this.logger.log('Date', `Parsed journal entry format: ${dateObj.toISOString()}`);
                return dateObj;
            }
        }

        // If all parsing attempts fail, log error and return current date
        this.logger.error('Date', `Failed to parse date: ${dateStr}`, new Error('Date parsing failed'));
        return new Date();
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

        private updateProjectNoteView(currentLogLevel?: string) {
        // Only update if the current file is a project note
        
        // Setup event listeners for project notes
        this.attachProjectNoteEventListeners();
        
        // Initialize the table row classes for improved filtering
        // Defer initialization to avoid blocking initial render
        setTimeout(() => {
            initializeTableRowClasses();
        }, 250);
        
        // Apply debug mode classes if needed
        // Use the currentLogLevel or fall back to the settings
        const logLevel = currentLogLevel || this.settings.logging?.level || 'off';
        
        if (logLevel === 'debug' || logLevel === 'trace') {
            document.body.addClass('oom-debug-mode');
        } else {
            document.body.removeClass('oom-debug-mode');
        }
    }

    private debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout | null = null;
        
        return (...args: Parameters<T>) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            
            timeout = setTimeout(() => {
                func(...args);
                timeout = null;
            }, wait);
        };
    }

    private getContentStateId(contentCell: HTMLElement): string {
        const date = contentCell.closest('.oom-dream-row')?.getAttribute('data-date');
        const title = contentCell.closest('.oom-dream-row')?.querySelector('.oom-dream-title')?.textContent;
        return `${date}-${title}`.replace(/[^a-zA-Z0-9-]/g, '');
    }

    private attachProjectNoteEventListeners() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || view.getMode() !== 'preview') return;
        const previewEl = view.previewMode?.containerEl;
        if (!previewEl) return;

        // Add event listeners for new rescrape/settings/debug buttons
        const rescrapeBtn = previewEl.querySelector('.oom-rescrape-button');
        if (rescrapeBtn) {
            rescrapeBtn.addEventListener('click', () => {
                this.scrapeMetrics();
            });
        }
        const settingsBtn = previewEl.querySelector('.oom-settings-button');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                (this.app as any).setting.open();
                (this.app as any).setting.openTabById('oneirometrics');
            });
        }
        
        // Add event listeners for debug buttons
        const debugBtn = previewEl.querySelector('.oom-debug-attach-listeners');
        if (debugBtn) {
            debugBtn.addEventListener('click', () => {
                new Notice('Manually attaching Show More listeners...');
                this.attachProjectNoteEventListeners();
            });
        }
        
        // Add debug expand all button in debug mode
        if (this.settings.logging?.level === 'debug' || this.settings.logging?.level === 'trace') {
            const expandAllDebugBtn = previewEl.querySelector('.oom-debug-expand-all');
            if (!expandAllDebugBtn) {
                // Create a new debug button if it doesn't exist
                const debugBtnContainer = previewEl.querySelector('.oom-filter-controls');
                if (debugBtnContainer) {
                    const newDebugBtn = document.createElement('button');
                    newDebugBtn.className = 'oom-button oom-debug-expand-all';
                    newDebugBtn.innerHTML = '<span class="oom-button-text">Debug: Expand All Content</span>';
                    newDebugBtn.style.backgroundColor = 'var(--color-red)';
                    newDebugBtn.style.color = 'white';
                    newDebugBtn.style.marginLeft = '8px';
                    newDebugBtn.addEventListener('click', () => {
                        new Notice('Expanding all content sections for debugging...');
                        expandAllContentSections(previewEl);
                    });
                    debugBtnContainer.appendChild(newDebugBtn);
                }
            }
        }

        // Add date range filter event listener with performance optimizations
        const dateRangeFilter = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (dateRangeFilter) {
            // First remove any existing event listeners by cloning the node
            const newDateRangeFilter = dateRangeFilter.cloneNode(true) as HTMLSelectElement;
            newDateRangeFilter.addEventListener('change', () => {
                console.log('[DEBUG] Date range filter changed:', newDateRangeFilter.value);
                
                // Clear any custom date range when using dropdown
                customDateRange = null;
                
                // Reset any active state on custom range button - do this in a requestAnimationFrame
                // to avoid forced reflow
                const customRangeBtn = document.getElementById('oom-custom-range-btn');
                if (customRangeBtn) {
                    requestAnimationFrame(() => {
                        customRangeBtn.classList.remove('active');
                    });
                }
                
                // Apply the filter in a delayed manner to avoid UI jank
                setTimeout(() => this.applyFilters(previewEl), 50);
            });
            dateRangeFilter.parentNode?.replaceChild(newDateRangeFilter, dateRangeFilter);
            console.log('[DEBUG] Attached event listener to date range filter');
        }

        // Existing show more/less button handlers
        const buttons = previewEl.querySelectorAll('.oom-button--expand');
        buttons.forEach((button) => {
            // Remove any existing click listeners by replacing the node
            const newButton = button.cloneNode(true) as HTMLElement;
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('[OOM-DEBUG] Show more/less button clicked');
                
                // Use the dedicated function to handle content visibility toggle
                toggleContentVisibility(newButton, previewEl);
            });
            button.parentNode?.replaceChild(newButton, button);
        });

        // Add custom range button event listener
        const customRangeBtn = document.getElementById('oom-custom-range-btn');
        if (customRangeBtn) {
            // Clone the button to remove any existing listeners
            const newCustomRangeBtn = customRangeBtn.cloneNode(true) as HTMLElement;
            newCustomRangeBtn.addEventListener('click', () => {
                console.log('[DEBUG] Custom range button clicked');
                openCustomRangeModal(this.app);
            });
            customRangeBtn.parentNode?.replaceChild(newCustomRangeBtn, customRangeBtn);
            console.log('[DEBUG] Attached event listener to custom range button');
        }
    }

    private applyFilters(previewEl: HTMLElement) {
        console.log('[DEBUG] main.ts applyFilters called', previewEl);

        // Get important elements early before any DOM operations
        const tableContainer = previewEl.querySelector('.oom-table-container');
        const rows = previewEl.querySelectorAll('.oom-dream-row');
        const dateRange = (previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement)?.value || 'all';
        
        // Apply will-change to the table container for better performance
        if (tableContainer) {
            tableContainer.setAttribute('style', 'will-change: contents;');
        }
        
        this.logger.log('Filter', `Applying filter: ${dateRange}`, {
            totalRows: rows.length
        });

        // Prepare date ranges before any DOM operations
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        const last6months = new Date(today);
        last6months.setMonth(today.getMonth() - 6);
        const last12months = new Date(today);
        last12months.setFullYear(today.getFullYear() - 1);
        
        // Process in chunks to avoid UI freezing
        const CHUNK_SIZE = 20;
        const totalRows = rows.length;
        let currentChunk = 0;
        
        // Prep counters
        let visibleCount = 0;
        let invalidDates = 0;
        let outOfRangeDates = 0;

        // Show a loading indicator for large tables
        let loadingIndicator: HTMLElement | null = null;
        if (totalRows > 50) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'oom-loading-indicator';
            loadingIndicator.textContent = 'Filtering entries...';
            loadingIndicator.style.position = 'fixed';
            loadingIndicator.style.top = '10px';
            loadingIndicator.style.right = '10px';
            loadingIndicator.style.background = 'var(--background-primary)';
            loadingIndicator.style.color = 'var(--text-normal)';
            loadingIndicator.style.padding = '8px 12px';
            loadingIndicator.style.borderRadius = '4px';
            loadingIndicator.style.boxShadow = '0 2px 8px var(--background-modifier-box-shadow)';
            loadingIndicator.style.zIndex = '1000';
            document.body.appendChild(loadingIndicator);
        }
        
        // First, pre-compute all row visibility states without touching the DOM
        const rowVisibility: boolean[] = [];
        
        for (let i = 0; i < totalRows; i++) {
            const rowEl = rows[i] as HTMLElement;
            const date = rowEl.getAttribute('data-date');
            
            if (!date) {
                this.logger.warn('Filter', `Row ${i} has no date attribute`);
                rowVisibility.push(false);
                continue;
            }

            const dreamDate = this.parseDate(date);
            if (isNaN(dreamDate.getTime())) {
                this.logger.error('Filter', `Invalid date for row ${i}: ${date}`);
                invalidDates++;
                rowVisibility.push(false);
                continue;
            }

            let isVisible = true;
            // Only compute visibility based on the selected date range
            // We've already calculated the date ranges above
            switch (dateRange) {
                case 'all':
                    isVisible = true;
                    break;
                case 'today':
                    isVisible = dreamDate >= today && dreamDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                    break;
                case 'yesterday':
                    isVisible = dreamDate >= yesterday && dreamDate < today;
                    break;
                case 'thisWeek':
                    isVisible = dreamDate >= startOfWeek && dreamDate <= now;
                    break;
                case 'thisMonth':
                    isVisible = dreamDate >= startOfMonth && dreamDate <= now;
                    break;
                case 'last30':
                    isVisible = dreamDate >= last30 && dreamDate <= now;
                    break;
                case 'last6months':
                    isVisible = dreamDate >= last6months && dreamDate <= now;
                    break;
                case 'thisYear':
                    isVisible = dreamDate >= startOfYear && dreamDate <= now;
                    break;
                case 'last12months':
                    isVisible = dreamDate >= last12months && dreamDate <= now;
                    break;
                default:
                    isVisible = true;
            }

            if (isVisible) {
                visibleCount++;
                this.logger.log('Filter', `Row ${i} visible`, {
                    date: dreamDate.toISOString(),
                    title: rowEl.querySelector('.oom-dream-title')?.textContent
                });
            } else {
                outOfRangeDates++;
            }
            
            rowVisibility.push(isVisible);
        }
        
        // Create a function to process chunks of rows
        const processNextChunk = () => {
            const start = currentChunk * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalRows);
            
            // Update loading indicator if present
            if (loadingIndicator) {
                const percent = Math.floor((currentChunk * CHUNK_SIZE / totalRows) * 100);
                loadingIndicator.textContent = `Filtering entries... ${percent}%`;
            }
            
            // Batch all DOM operations inside requestAnimationFrame
            requestAnimationFrame(() => {
                // Apply visibility to this chunk of rows
                for (let i = start; i < end; i++) {
                    const rowEl = rows[i] as HTMLElement;
                    const isVisible = rowVisibility[i];
                    
                    if (isVisible) {
                        rowEl.classList.remove('oom-row--hidden');
                        rowEl.classList.add('oom-row--visible');
                    } else {
                        rowEl.classList.add('oom-row--hidden');
                        rowEl.classList.remove('oom-row--visible');
                    }
                }
                
                // Move to next chunk or finish
                currentChunk++;
                
                if (currentChunk * CHUNK_SIZE < totalRows) {
                    // Schedule next chunk with a slight delay to allow rendering
                    setTimeout(() => processNextChunk(), 0);
                } else {
                                        // All done, update UI                    if (loadingIndicator) {                        document.body.removeChild(loadingIndicator);                    }                                        // Reset will-change property once filtering is complete                    if (tableContainer) {                        requestAnimationFrame(() => {                            tableContainer.removeAttribute('style');                        });                    }                                        // ADDED: Update summary table with filtered metrics                    const filteredMetrics = collectVisibleRowMetrics(previewEl);                    updateSummaryTable(previewEl, filteredMetrics);                                        // Update filter display in the next animation frame                    requestAnimationFrame(() => {                        updateFilterDisplayWithDetails(dateRange, visibleCount, totalRows, invalidDates, outOfRangeDates);                    });
                }
            });
        };
        
        // Delay the start of processing slightly to avoid UI jank
        setTimeout(() => processNextChunk(), 20);
        
        // This function updates the filter display with detailed information
        function updateFilterDisplayWithDetails(
            filterType: string, 
            visible: number, 
            total: number, 
            invalid: number, 
            outOfRange: number
        ) {
            const filterDisplay = previewEl.querySelector('#oom-time-filter-display') as HTMLElement;
            if (!filterDisplay) return;
            
            // Temporarily set will-change for better performance
            filterDisplay.style.willChange = 'contents';
            
            const hiddenCount = total - visible;
            const colorClass = visible === total 
                ? 'oom-filter--all-visible' 
                : visible > 0 
                    ? 'oom-filter--partially-visible' 
                    : 'oom-filter--none-visible';
                    
            // Map filter keys to human-friendly labels
            const filterLabels: Record<string, string> = {
                all: 'All Time',
                today: 'Today',
                yesterday: 'Yesterday',
                thisWeek: 'This Week',
                thisMonth: 'This Month',
                last30: 'Last 30 Days',
                last6months: 'Last 6 Months',
                thisYear: 'This Year',
                last12months: 'Last 12 Months',
            };
            
            const displayLabel = filterLabels[filterType] || filterType;
            
            // Build HTML content in a single string to minimize DOM operations
            let htmlContent = '';
            
            htmlContent += `<span class="oom-filter-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-calendar-range">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M16 2v4"/>
                    <path d="M8 2v4"/>
                    <path d="M3 10h18"/>
                    <path d="M17 14h-6"/>
                    <path d="M13 18H7"/>
                </svg>
            </span>`;
            
            htmlContent += `<span class="oom-filter-text ${colorClass}">
                ${displayLabel} (${visible} entries)
                ${hiddenCount > 0 ? `<span class="oom-filter-hidden">- ${hiddenCount} hidden</span>` : ''}
            </span>`;
            
            // Set detailed title attribute
            const titleInfo = `Total Entries: ${total}
Visible: ${visible}
Hidden: ${hiddenCount}
Invalid Dates: ${invalid}
Out of Range: ${outOfRange}
Filter Type: ${filterType}
Applied: ${new Date().toLocaleTimeString()}`;
            
            // Use requestAnimationFrame for smooth transition
            requestAnimationFrame(() => {
                // First, remove the transition for immediate change
                filterDisplay.style.transition = 'none';
                filterDisplay.classList.remove('oom-filter-display--updated');
                
                // Force a reflow to ensure the removal of the class takes effect immediately
                void filterDisplay.offsetHeight;
                
                // Apply all changes at once
                filterDisplay.innerHTML = htmlContent;
                filterDisplay.setAttribute('title', titleInfo);
                
                // Add animation back in the next frame
                setTimeout(() => {
                    // Reset will-change property
                    filterDisplay.style.willChange = 'auto';
                    
                    // Restore transition and add the updated class
                    filterDisplay.style.removeProperty('transition');
                    filterDisplay.classList.add('oom-filter-display--updated');
                    
                    // Remove class after transition completes
                    setTimeout(() => {
                        filterDisplay.classList.remove('oom-filter-display--updated');
                    }, 1000);
                }, 20);
            });
        }
    }

    private async clearDebugLog() {
        try {
            const logPath = 'logs/oom-debug-log.txt';
            const logFile = this.app.vault.getAbstractFileByPath(logPath);
            
            if (logFile instanceof TFile) {
                // Create backup before clearing
                const backupPath = `logs/oom-debug-log.backup-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
                const content = await this.app.vault.read(logFile);
                await this.app.vault.create(backupPath, content);
                
                // Clear the log file
                await this.app.vault.modify(logFile, '');
                this.logger.log('Log', 'Debug log cleared and backed up');
                
                // Clean up old backups (keep last 5)
                const backupFiles = this.app.vault.getMarkdownFiles()
                    .filter(f => f.path.startsWith('logs/oom-debug-log.backup-'))
                    .sort((a, b) => b.stat.mtime - a.stat.mtime);
                
                for (let i = 5; i < backupFiles.length; i++) {
                    await this.app.vault.delete(backupFiles[i]);
                }
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to clear debug log', error as Error);
            new Notice('Failed to clear debug log. See console for details.');
        }
    }

    private async backupDebugLog() {
        try {
            const logPath = 'logs/oom-debug-log.txt';
            const logFile = this.app.vault.getAbstractFileByPath(logPath);
            
            if (logFile instanceof TFile) {
                const backupPath = `logs/oom-debug-log.backup-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
                const content = await this.app.vault.read(logFile);
                await this.app.vault.create(backupPath, content);
                this.logger.log('Log', 'Debug log backed up');
                new Notice('Debug log backed up successfully');
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to backup debug log', error as Error);
            new Notice('Failed to backup debug log. See console for details.');
        }
    }

    private async checkLogFileSize() {
        try {
            const logPath = 'logs/oom-debug-log.txt';
            const logFile = this.app.vault.getAbstractFileByPath(logPath);
            
            if (logFile instanceof TFile) {
                const MAX_SIZE = 1024 * 1024; // 1MB
                if (logFile.stat.size > MAX_SIZE) {
                    await this.clearDebugLog();
                    new Notice('Debug log exceeded size limit and was cleared');
                }
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to check log file size', error as Error);
        }
    }

    private async copyConsoleLogs() {
        try {
            // Get the console log content
            const consoleLog = await this.getConsoleLog();
            if (!consoleLog) {
                new Notice('No console logs found');
                return;
            }

            // Filter for OneiroMetrics entries
            const filteredLogs = consoleLog
                .split('\n')
                .filter(line => line.includes('[OneiroMetrics]'))
                .join('\n');

            if (!filteredLogs) {
                new Notice('No OneiroMetrics logs found in console');
                return;
            }

            // Get or create the log file
            const logPath = 'logs/oom-debug-log.txt';
            let logFile = this.app.vault.getAbstractFileByPath(logPath);
            
            if (!logFile) {
                logFile = await this.app.vault.create(logPath, '');
            }

            // Add timestamp and separator
            const timestamp = new Date().toISOString();
            const separator = '\n\n' + '-'.repeat(80) + '\n';
            const newContent = `${separator}Console Log Capture - ${timestamp}\n${separator}\n${filteredLogs}\n`;

            // Append to existing content
            const existingContent = await this.app.vault.read(logFile as TFile);
            await this.app.vault.modify(logFile as TFile, existingContent + newContent);

            new Notice('Console logs copied to debug file');
            this.logger.log('Log', 'Console logs copied to debug file');
        } catch (error) {
            this.logger.error('Log', 'Failed to copy console logs', error as Error);
            new Notice('Failed to copy console logs. See console for details.');
        }
    }

    private async getConsoleLog(): Promise<string | null> {
        try {
            // This is a workaround since we can't directly access the console log
            // We'll use the developer tools API to get the log
            const devTools = (window as any).devTools;
            if (!devTools) {
                new Notice('Developer Tools not available. Please open them first (Ctrl+Shift+I)');
                return null;
            }

            // Get the console log from the developer tools
            const consoleLog = await devTools.getConsoleLog();
            return consoleLog;
        } catch (error) {
            this.logger.error('Log', 'Failed to get console log', error as Error);
            return null;
        }
    }

    setLogLevel(level: LogLevel) {
        console.log('setLogLevel called with:', level);
        this.logger.configure(level);
        this.updateProjectNoteView(level);
    }

    setLogConfig(level: LogLevel, maxSize: number, maxBackups: number) {
        this.logger.configure(level, maxSize, maxBackups);
    }

    private announceToScreenReader(message: string) {
        const ariaLive = document.createElement('div');
        ariaLive.setAttribute('aria-live', 'polite');
        ariaLive.classList.add('sr-only');
        document.body.append(ariaLive);
        ariaLive.textContent = message;
        setTimeout(() => ariaLive.remove(), 1000);
    }

    // Update content visibility
    private updateContentVisibility(id: string, isExpanded: boolean): void {
        if (!this.container) return;
        
        const row = this.container.querySelector(`tr[data-source="${id}"]`);
        if (row) {
            const contentWrapper = row.querySelector('.oom-content-wrapper');
            const previewDiv = row.querySelector('.oom-content-preview');
            const fullDiv = row.querySelector('.oom-content-full');
            const expandButton = row.querySelector('.oom-button--expand');

            if (contentWrapper && previewDiv && fullDiv && expandButton) {
                if (isExpanded) {
                    contentWrapper.classList.add('expanded');
                } else {
                    contentWrapper.classList.remove('expanded');
                }
                expandButton.textContent = isExpanded ? 'Show less' : 'Read more';
                expandButton.setAttribute('data-expanded', isExpanded.toString());
                expandButton.setAttribute('aria-expanded', isExpanded.toString());
            }
        }
    }

    // Method to update ribbon icon based on settings
    updateRibbonIcons() {
        // Remove existing ribbon icons
        this.removeRibbonIcons();
        
        // Only add ribbon icons if enabled
        if (shouldShowRibbonButtons(this.settings)) {
            this.addRibbonIcons();
        }
    }

    private removeRibbonIcons(): void {
        // Remove icons if they exist
        this.ribbonIcons.forEach(icon => {
            icon.remove();
        });
        this.ribbonIcons = [];
    }

    private addRibbonIcons(): void {
        // Only add ribbon icons if they're enabled
        if (!shouldShowRibbonButtonsSafe(this.settings)) {
            return;
        }

        // Add journal manager button if enabled in settings
        this.journalManagerRibbonEl = this.addRibbonIcon('moon', 'Dream Journal Manager', () => {
            new DreamJournalManager(this.app, this, 'dashboard').open();
        });
        this.journalManagerRibbonEl.addClass('oom-journal-manager-button');
        this.journalManagerRibbonEl.addEventListener('contextmenu', (evt: MouseEvent) => {
            evt.preventDefault();
            (this.app as any).setting.open('oneirometrics');
        });
    }

    /**
     * Insert a journal template into the current editor
     */
    async insertTemplate(editor: Editor) {
        // Get templates from settings
        const templates = this.settings.linting?.templates || [];
        if (templates.length === 0) {
            new Notice('No templates available. Create templates in the OneiroMetrics settings.');
            return;
        }

        // Open template selection modal
        const modal = new Modal(this.app);
        modal.titleEl.setText('Insert Journal Template');
        modal.contentEl.addClass('oom-template-selection-modal');
        
        // Create template list
        for (const template of templates) {
            const templateItem = modal.contentEl.createDiv({ cls: 'oom-template-item' });
            
            // Create template header with name
            const headerEl = templateItem.createDiv({ cls: 'oom-template-header' });
            headerEl.createEl('h3', { text: template.name });
            
            // Get structure info to display structure type
            const structures = this.settings.linting?.structures || [];
            const structure = structures.find(s => s.id === template.structure);
            
            if (structure) {
                // Add structure type indicator with visual cue
                const typeIndicator = headerEl.createEl('span', { 
                    cls: `oom-template-type oom-${structure.type}-type`,
                    attr: { title: structure.type === 'nested' ? 'Nested Structure' : 'Flat Structure' }
                });
                const typeIcon = structure.type === 'nested' ? '📦' : '📄';
                typeIndicator.setText(`${typeIcon} ${structure.type}`);
            }
            
            // Add templater badge if applicable
            if (template.isTemplaterTemplate) {
                const templaterBadge = headerEl.createEl('span', {
                    cls: 'oom-templater-badge',
                    attr: { title: 'Uses Templater for dynamic content' }
                });
                templaterBadge.setText('⚡ Templater');
            }
            
            // Add description if available
            if (template.description) {
                templateItem.createEl('p', { text: template.description, cls: 'oom-template-description' });
            }
            
            // Preview button and insert button in a button container
            const buttonContainer = templateItem.createDiv({ cls: 'oom-template-buttons' });
            
            // Preview button
            const previewButton = buttonContainer.createEl('button', {
                text: 'Preview',
                cls: 'oom-preview-button'
            });
            
            previewButton.addEventListener('click', () => {
                // Toggle preview visibility
                const previewEl = templateItem.querySelector('.oom-template-preview');
                if (previewEl) {
                    previewEl.remove();
                    previewButton.setText('Preview');
                } else {
                    const newPreviewEl = templateItem.createDiv({ cls: 'oom-template-preview' });
                    
                    // Dynamic/static toggle if it's a Templater template
                    if (template.isTemplaterTemplate && template.staticContent) {
                        const toggleContainer = newPreviewEl.createDiv({ cls: 'oom-preview-toggle-container' });
                        const dynamicToggle = toggleContainer.createEl('button', {
                            text: 'Dynamic (Templater)',
                            cls: 'oom-preview-toggle oom-preview-toggle-active'
                        });
                        const staticToggle = toggleContainer.createEl('button', {
                            text: 'Static (Fallback)',
                            cls: 'oom-preview-toggle'
                        });
                        
                        const previewContent = newPreviewEl.createDiv({ cls: 'oom-preview-content' });
                        previewContent.createEl('pre', { text: template.content });
                        
                        dynamicToggle.addEventListener('click', () => {
                            dynamicToggle.addClass('oom-preview-toggle-active');
                            staticToggle.removeClass('oom-preview-toggle-active');
                            previewContent.empty();
                            previewContent.createEl('pre', { text: template.content });
                        });
                        
                        staticToggle.addEventListener('click', () => {
                            staticToggle.addClass('oom-preview-toggle-active');
                            dynamicToggle.removeClass('oom-preview-toggle-active');
                            previewContent.empty();
                            previewContent.createEl('pre', { text: template.staticContent });
                        });
                    } else {
                        // Regular preview for non-Templater templates
                        newPreviewEl.createEl('pre', { text: template.content });
                    }
                    
                    previewButton.setText('Hide Preview');
                }
            });
            
            // Insert button
            const insertButton = buttonContainer.createEl('button', { 
                text: 'Insert',
                cls: 'mod-cta'
            });
            
            insertButton.addEventListener('click', async () => {
                modal.close();
                
                // Get template content
                let content = '';
                let usingFallback = false;
                
                // If it's a Templater template, process it
                if (template.isTemplaterTemplate && template.templaterFile) {
                    if (this.templaterIntegration && this.templaterIntegration.isTemplaterInstalled()) {
                        try {
                            content = await this.templaterIntegration.processTemplaterTemplate(template.templaterFile);
                        } catch (error) {
                            console.error('Error processing Templater template:', error);
                            new Notice('Error processing Templater template');
                            
                            // Fallback to static content if available
                            if (template.staticContent) {
                                content = template.staticContent;
                                usingFallback = true;
                            } else {
                                content = template.content;
                            }
                        }
                    } else {
                        // Templater not installed, use static version
                        if (template.staticContent) {
                            content = template.staticContent;
                        } else {
                            // Generate static content on the fly if not available
                            if (this.templaterIntegration) {
                                content = this.templaterIntegration.convertToStaticTemplate(template.content);
                            } else {
                                content = template.content;
                            }
                        }
                        usingFallback = true;
                        new Notice('Templater plugin is not installed. Using static template with placeholders.');
                    }
                } else {
                    // Regular non-Templater template
                    content = template.content;
                }
                
                // Insert content at cursor position
                const initialCursorPosition = editor.getCursor();
                editor.replaceSelection(content);
                
                // Handle placeholder navigation if using static version
                if (usingFallback && this.templaterIntegration) {
                    // Find placeholders
                    const placeholders = this.templaterIntegration.findPlaceholders(content);
                    
                    if (placeholders.length > 0) {
                        // Navigate to first placeholder
                        const firstPlaceholder = placeholders[0];
                        const lines = content.substring(0, firstPlaceholder.position.start).split('\n');
                        
                        const position = {
                            line: initialCursorPosition.line + lines.length - 1,
                            ch: lines.length > 1 ? lines[lines.length - 1].length : initialCursorPosition.ch + firstPlaceholder.position.start
                        };
                        
                        editor.setCursor(position);
                        
                        // Select the placeholder
                        const endPosition = {
                            line: position.line,
                            ch: position.ch + (firstPlaceholder.position.end - firstPlaceholder.position.start)
                        };
                        
                        editor.setSelection(position, endPosition);
                        
                        // Show instructional notice
                        new Notice(`Fill in the ${placeholders.length} placeholder(s). Press Tab to navigate between them.`);
                    }
                }
                
                // Show confirmation with structure type
                if (structure) {
                    if (usingFallback) {
                        new Notice(`Inserted "${template.name}" (${structure.type} structure) using static placeholders.`);
                    } else {
                        new Notice(`Inserted "${template.name}" (${structure.type} structure)`);
                    }
                } else {
                    new Notice(`Template "${template.name}" inserted`);
                }
            });
        }
        
        modal.open();
    }

    // Add the updateTestRibbon method
    private updateTestRibbon() {
        // Remove all test buttons
        document.querySelectorAll('.oom-ribbon-test-btn').forEach(btn => btn.remove());
        if ((this.settings as any).showTestRibbonButton) {
            const btn = this.addRibbonIcon('wand', 'Test Ribbon Button', () => {
                new Notice('Test button clicked!');
            });
            btn.addClass('oom-ribbon-test-btn');
        }
    }

    /**
     * Loads the CSS styles for the journal structure check feature
     * Note: The CSS styles have been moved to styles.css
     */
    private loadStyles() {
        // Journal structure check styles are now in styles.css
        // This method is kept for backwards compatibility
    }

    /**
     * Opens the settings tab and shows a notice prompting the user to click "View Metrics Descriptions"
     */
    public openMetricsDescriptionsModal(): void {
        (this.app as any).setting.open();
        (this.app as any).setting.openTabById('oneirometrics');
        new Notice('Click on "View Metrics Descriptions" in the settings panel');
    }

    /**
     * Shows the date navigator
     */
    showDateNavigator() {
        // Create or focus existing date navigator
        this.app.workspace.detachLeavesOfType(DATE_NAVIGATOR_VIEW_TYPE);
        
        const leaf = this.app.workspace.getRightLeaf(false);
        if (leaf) {
            leaf.setViewState({
                type: DATE_NAVIGATOR_VIEW_TYPE,
                active: true
            });
            this.app.workspace.revealLeaf(leaf);
        }
    }

    async openProjectNote(): Promise<void> {
        const projectNotePath = getProjectNotePath(this.settings);
        
        if (!projectNotePath) {
            new Notice("No project note set. Please set one in settings.");
            return;
        }
        
        try {
            const file = this.app.vault.getAbstractFileByPath(projectNotePath);
            if (file instanceof TFile) {
                await this.app.workspace.openLinkText(projectNotePath, '', false);
            } else {
                new Notice(`Project note not found: ${projectNotePath}`);
            }
        } catch (error) {
            new Notice(`Error opening project note: ${error.message}`);
        }
    }
}

// Helper to extract date for a dream entry
function getDreamEntryDate(journalLines: string[], filePath: string, fileContent: string): string {
    // 1. Block Reference (^YYYYMMDD) on the callout line or the next line
    const blockRefRegex = /\^(\d{8})/;
    for (let i = 0; i < Math.min(2, journalLines.length); i++) {
        const blockRefMatch = journalLines[i].match(blockRefRegex);
        if (blockRefMatch) {
            const dateStr = blockRefMatch[1];
            return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }
    }
    // 2. Date in the callout line (e.g., 'Monday, January 6, 2025')
    const calloutLine = journalLines[0] || '';
    const longDateRegex = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/;
    const longDateMatch = calloutLine.match(longDateRegex);
    if (longDateMatch) {
        const [_, day, year] = longDateMatch;
        const dateObj = new Date(`${longDateMatch[0]}`);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString().split('T')[0];
        }
    }
    // 3. YAML 'created' field
    const yamlCreatedMatch = fileContent.match(/created:\s*(\d{8})/);
    if (yamlCreatedMatch) {
        const dateStr = yamlCreatedMatch[1];
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    // 4. YAML 'modified' field
    const yamlModifiedMatch = fileContent.match(/modified:\s*(\d{8})/);
    if (yamlModifiedMatch) {
        const dateStr = yamlModifiedMatch[1];
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    // 5. Folder or filename (for year only, as a fallback)
    // Try to extract year from folder or filename
    const yearRegex = /\b(\d{4})\b/;
    const pathMatch = filePath.match(yearRegex);
    if (pathMatch) {
        return pathMatch[1];
    }
    // 6. Current date
    return new Date().toISOString().split('T')[0];
}

// Function to open the custom date range modal
function openCustomRangeModal(app: App) {
    const favorites = loadFavoriteRanges();
    console.log('[DEBUG] Opening modal with favorites:', favorites);
    new CustomDateRangeModal(app, (start: string, end: string, saveName?: string) => {
        if (start && end) {
            // First, update button state before making any layout changes
            requestAnimationFrame(() => {
                const btn = document.getElementById('oom-custom-range-btn');
                if (btn) btn.classList.add('active');
            });
            
            // Batch remaining operations with slight delays to avoid layout thrashing
            setTimeout(() => {
                // Set the customDateRange
                const newRange = { start, end };
                customDateRange = newRange;
                
                // Persist the selection to localStorage but without forcing layout
                setTimeout(() => {
                    saveLastCustomRange(newRange);
                    
                    // Save favorite if needed without disrupting the filter application
                    if (saveName) {
                        saveFavoriteRange(saveName, newRange);
                        // Show notification after filtering is complete
                        setTimeout(() => {
                            new Notice(`Saved favorite: ${saveName}`);
                        }, 100);
                    }
                    
                    // Apply the filter with delay for UI responsiveness
                    setTimeout(() => {
                        console.log('[DEBUG] Applying custom date range filter:', customDateRange);
                        applyCustomDateRangeFilter();
                    }, 50);
                }, 0);
            }, 10);
        } else {
            // Handle clearing the filter
            customDateRange = null;
            
            // Batch UI updates
            requestAnimationFrame(() => {
                const btn = document.getElementById('oom-custom-range-btn');
                if (btn) btn.classList.remove('active');
                
                // Trigger date range dropdown to apply the default filter
                setTimeout(() => {
                    const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
                    if (dropdown) {
                        dropdown.value = dropdown.value; // Keep same value
                        dropdown.dispatchEvent(new Event('change'));
                    }
                }, 10);
            });
        }
    }, favorites, deleteFavoriteRange).open();
}

// Helper functions for range management
const CUSTOM_RANGE_KEY = 'oneirometrics-last-custom-range';
const SAVED_RANGES_KEY = 'oneirometrics-saved-custom-ranges';

function saveLastCustomRange(range: { start: string, end: string }) {
    localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(range));
}

function loadLastCustomRange(): { start: string, end: string } | null {
    const data = localStorage.getItem(CUSTOM_RANGE_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

function saveFavoriteRange(name: string, range: { start: string, end: string }) {
    const saved = loadFavoriteRanges();
    saved[name] = range;
    localStorage.setItem(SAVED_RANGES_KEY, JSON.stringify(saved));
    console.log('[DEBUG] Saved favorite range:', name, range);
}

function loadFavoriteRanges(): Record<string, { start: string, end: string }> {
    const data = localStorage.getItem(SAVED_RANGES_KEY);
    if (!data) return {};
    try {
        return JSON.parse(data);
    } catch {
        return {};
    }
}

function deleteFavoriteRange(name: string) {
    const saved = loadFavoriteRanges();
    delete saved[name];
    localStorage.setItem(SAVED_RANGES_KEY, JSON.stringify(saved));
    console.log('[DEBUG] Deleted favorite range:', name);
    new Notice(`Deleted favorite: ${name}`);
}

// Find the DateNavigatorModal's Apply button click handler
// In src/dom/DateNavigatorModal.ts, replace with this direct implementation in main.ts

// Utility function to force filtering - called directly from DateNavigatorModal
function forceApplyDateFilter(date: Date) {
    console.log('[OOM-DEBUG] forceApplyDateFilter called with date:', date);
    
    if (!date || isNaN(date.getTime())) {
        console.error('[OOM-DEBUG] Invalid date provided to forceApplyDateFilter');
        return;
    }
    
    try {
        // Extract year, month, day components directly to avoid timezone issues
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        const day = date.getDate();
        
        // Format dates as YYYY-MM-DD strings for consistency
        const start = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const end = start; // For a single day selection, start and end are the same
        
        console.log('[OOM-DEBUG] Setting date range for filtering:', {
            selectedDate: date.toISOString(),
            selectedYear: year, 
            selectedMonth: month, 
            selectedDay: day,
            formattedStart: start,
            formattedEnd: end
        });
        
        // First, set customDateRange to trigger filtering
        // This must happen BEFORE updating the UI to prevent event handlers from clearing it
        customDateRange = { start: start, end: end };
        
        console.log('[OOM-DEBUG] Setting customDateRange to:', customDateRange);
        
        // Save to localStorage for persistence
        localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(customDateRange));
        
        // Create a small delay to ensure customDateRange is set before any event handlers run
        setTimeout(() => {
            // Update UI to show filter is active
            requestAnimationFrame(() => {
                // Update button state
                const btn = document.getElementById('oom-custom-range-btn');
                if (btn) {
                    btn.classList.add('active');
                }
                
                // Update filter info display
                const filterDisplay = document.getElementById('oom-time-filter-display');
                if (filterDisplay) {
                    // Quick update to give immediate feedback
                    const formattedDate = date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                    });
                    filterDisplay.innerHTML = `<span class="oom-filter-icon">🗓️</span> <span class="oom-filter-text">Filtering for: ${formattedDate}</span>`;
                }
                
                // Update dropdown to show "Custom" is selected - AFTER setting customDateRange
                const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
                if (dropdown) {
                    // Add a custom option if it doesn't exist
                    let customOption = dropdown.querySelector('option[value="custom"]') as HTMLOptionElement;
                    if (!customOption) {
                        customOption = document.createElement('option');
                        customOption.value = 'custom';
                        customOption.text = 'Custom Date';
                        dropdown.appendChild(customOption);
                    }
                    
                    // Set the value WITHOUT dispatching a change event
                    dropdown.value = 'custom';
                    
                    // Dispatch a custom event instead that won't trigger our change handler
                    dropdown.dispatchEvent(new CustomEvent('oom-value-set', { 
                        bubbles: true,
                        detail: { isDateNavigator: true }
                    }));
                }
            });
            
            // Apply the filter after UI updates to avoid jank
            setTimeout(() => {
                console.log('[OOM-DEBUG] Calling applyCustomDateRangeFilter');
                applyCustomDateRangeFilter();
            }, 100);
            
            console.log('[OOM-DEBUG] Filter applied for date:', date.toLocaleDateString());
        }, 50);
    } catch (error) {
        console.error('[OOM-DEBUG] Error in forceApplyDateFilter:', error);
    }
}

// Expose the function globally so it can be called from DateNavigatorModal
(window as any).forceApplyDateFilter = forceApplyDateFilter;

// Phase 1: CSS-based visibility optimization to reduce browser reflows
function applyCustomDateRangeFilter() {
    console.log('[OOM-DEBUG] applyCustomDateRangeFilter called with customDateRange:', customDateRange);
    
    if (!customDateRange) {
        console.log('[OOM-DEBUG] No customDateRange found, returning early');
        return;
    }
    
    const previewEl = document.querySelector('.oom-metrics-container') as HTMLElement;
    if (!previewEl) {
        console.log('[OOM-DEBUG] No .oom-metrics-container found, returning early');
        return;
    }
    
    // Ensure table styles are initialized before filtering
    initializeTableRowClasses();
    
    // Performance optimization: Prevent layout thrashing by reading all data at once
    const tableContainer = previewEl.querySelector('.oom-table-container');
    if (tableContainer) {
        // Set will-change to optimize for upcoming changes
        tableContainer.setAttribute('style', 'will-change: transform, contents; contain: content;');
    }
    
    // Store the date range values safely
    // IMPORTANT: We need to clone these to avoid timezone issues
    const startDateString = customDateRange?.start || '';
    const endDateString = customDateRange?.end || '';
    
    // Ensure we create the dates in a timezone-safe way
    // For UTC date handling, we'll parse YYYY-MM-DD directly
    const startYMD = startDateString.split('-').map(n => parseInt(n));
    const endYMD = endDateString.split('-').map(n => parseInt(n));
    
    // Validate the date parts
    if (startYMD.length !== 3 || endYMD.length !== 3 || 
        startYMD.some(isNaN) || endYMD.some(isNaN)) {
        console.error('[OOM-DEBUG] Invalid date format:', {startDateString, endDateString});
        return;
    }
    
    // Create date objects with the exact day boundaries (year, month-1, day)
    const startDate = new Date(startYMD[0], startYMD[1] - 1, startYMD[2], 0, 0, 0, 0);
    const endDate = new Date(endYMD[0], endYMD[1] - 1, endYMD[2], 23, 59, 59, 999);
    
    // Sanity check on the dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('[OOM-DEBUG] Could not create valid date objects:', {startYMD, endYMD});
        return;
    }
    
    console.log('[OOM-DEBUG] Using date objects for comparison:', {
        startDate: startDate.toISOString(),
        startYMD: startYMD,
        endDate: endDate.toISOString(),
        endYMD: endYMD
    });
    
    // Create a processing function to handle filtering without touching the DOM immediately
    function processFiltering() {
        // Ensure we're working with an array for consistent handling
        const rowsArray = Array.from(previewEl.querySelectorAll('.oom-dream-row'));
        const totalRows = rowsArray.length;
        console.log('[OOM-DEBUG] Found', totalRows, 'rows to filter');
        
        // Show a loading indicator for large tables (over 50 rows)
        let loadingIndicator: HTMLElement | null = null;
        if (totalRows > 50) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'oom-loading-indicator';
            loadingIndicator.textContent = 'Filtering entries...';
            loadingIndicator.style.position = 'fixed';
            loadingIndicator.style.top = '10px';
            loadingIndicator.style.right = '10px';
            loadingIndicator.style.background = 'var(--background-primary)';
            loadingIndicator.style.color = 'var(--text-normal)';
            loadingIndicator.style.padding = '8px 12px';
            loadingIndicator.style.borderRadius = '4px';
            loadingIndicator.style.boxShadow = '0 2px 8px var(--background-modifier-box-shadow)';
            loadingIndicator.style.zIndex = '1000';
            document.body.appendChild(loadingIndicator);
        }
        
        console.log('[OOM-DEBUG] Filtering dates between', startDateString, 'and', endDateString);
        
        let visibleCount = 0;
        let hiddenCount = 0;
        let emptyDateCount = 0;
        let invalidDateCount = 0;
        
        // First, read all data before modifying DOM (reduce layout thrashing)
        const rowVisibility: boolean[] = [];
        
                // Before full processing, do a quick filter on dateAttr to avoid unnecessary computation        const startYearMonth = `${startYMD[0]}-${startYMD[1].toString().padStart(2, '0')}`;        const endYearMonth = `${endYMD[0]}-${endYMD[1].toString().padStart(2, '0')}`;        console.log('[OOM-DEBUG] Quick filtering with year-month range:', startYearMonth, 'to', endYearMonth);                    // Pre-process all row visibility without touching the DOM        rowsArray.forEach((row, index) => {            const dateAttr = row.getAttribute('data-date');                        if (!dateAttr || dateAttr.trim() === '') {                // Handle rows without a date attribute                emptyDateCount++;                rowVisibility.push(false); // Always hide rows without dates                return;            }                        // Quick check - if date is outside year-month range, don't process further            // This avoids detailed parsing for dates clearly outside the range            if (dateAttr < startYearMonth || dateAttr > endYearMonth + '-31') {                // Skip detailed processing for dates clearly outside range                hiddenCount++;                rowVisibility.push(false);                return;            }                        try {                // Parse the date in a consistent way matching our comparison dates                // Split YYYY-MM-DD format for exact control                const rowYMD = dateAttr.split('-').map(n => parseInt(n));                                if (rowYMD.length !== 3 || rowYMD.some(isNaN)) {                    console.log('[OOM-DEBUG] Row has invalid date format:', dateAttr);                    invalidDateCount++;                    rowVisibility.push(false);                    return;                }                                // Create a date object with the same time (noon) and force local timezone interpretation                const rowDate = new Date(rowYMD[0], rowYMD[1] - 1, rowYMD[2], 12, 0, 0, 0);                                // Check if date is valid                if (isNaN(rowDate.getTime())) {                    console.log('[OOM-DEBUG] Row has invalid date value:', dateAttr);                    invalidDateCount++;                    rowVisibility.push(false);                    return;                }                                // Only log for rows close to the time range to avoid console spam                const daysBefore = Math.floor((startDate.getTime() - rowDate.getTime()) / (24 * 60 * 60 * 1000));                const daysAfter = Math.floor((rowDate.getTime() - endDate.getTime()) / (24 * 60 * 60 * 1000));                                if (daysBefore <= 2 || daysAfter <= 2 || (daysBefore < 0 && daysAfter < 0)) {                    // Only log for dates within 2 days of the range or actually in the range                    console.log('[OOM-DEBUG] Row date parts:', {                        rowDate: rowDate.toISOString(),                        rowYMD: rowYMD,                        dateAttr,                        index                    });                }                                // Check if the row date is within range (inclusive)                // Use direct year/month/day comparison to avoid timezone issues                const isInRange =                     // Simple date comparison using dateAttr - more reliable                    dateAttr >= startDateString && dateAttr <= endDateString;                                if (isInRange) {                    console.log('[OOM-DEBUG] Row matches date range:', {                        rowDate: rowDate.toISOString(),                        dateAttr,                        index                    });                    visibleCount++;                } else {                    hiddenCount++;                }                                rowVisibility.push(isInRange);            } catch (error) {                console.error('[OOM-DEBUG] Error parsing date:', dateAttr, error);                invalidDateCount++;                rowVisibility.push(false);            }        });
        
        // Process rows in chunks to avoid blocking the UI
        const CHUNK_SIZE = 20; // Process 20 rows per frame
        let currentChunk = 0;
        
        // Create a processing function that will handle a chunk of rows
        const processNextChunk = () => {
            const start = currentChunk * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalRows);
            
            // Update loading indicator if present
            if (loadingIndicator) {
                const percent = Math.floor((start / totalRows) * 100);
                loadingIndicator.textContent = `Filtering entries... ${percent}%`;
            }
            
            // Batch DOM operations by applying visibility in chunks
            requestAnimationFrame(() => {
                for (let i = start; i < end; i++) {
                    const rowEl = rowsArray[i] as HTMLElement;
                    const isVisible = rowVisibility[i];
                    
                    if (isVisible) {
                        // Show row using CSS classes
                        rowEl.classList.remove('oom-row--hidden');
                        rowEl.classList.add('oom-row--visible');
                        rowEl.style.removeProperty('display');
                    } else {
                        // Hide row using CSS classes
                        rowEl.classList.add('oom-row--hidden');
                        rowEl.classList.remove('oom-row--visible');
                        // Use display:none for complete removal from layout
                        rowEl.style.display = 'none';
                    }
                }
                
                // Move to next chunk or finish
                currentChunk++;
                
                if (currentChunk * CHUNK_SIZE < totalRows) {
                    // Schedule next chunk with a slight delay to allow rendering
                    setTimeout(() => processNextChunk(), 5);
                } else {
                                        // All chunks processed, finalize                    console.log(`[OOM-DEBUG] Filter complete: ${visibleCount} visible, ${hiddenCount} hidden, ${emptyDateCount} empty dates, ${invalidDateCount} invalid dates`);                                        // Remove loading indicator if present                    if (loadingIndicator) {                        document.body.removeChild(loadingIndicator);                    }                                        // Reset will-change property once filtering is complete                    if (tableContainer) {                        requestAnimationFrame(() => {                            tableContainer.removeAttribute('style');                        });                    }                                        // ADDED: Update summary table with filtered metrics                    const filteredMetrics = collectVisibleRowMetrics(previewEl);                    updateSummaryTable(previewEl, filteredMetrics);                                        // Update filter display after all rows are processed                    // But do it in the next frame to avoid forced reflow                    requestAnimationFrame(() => {                        updateFilterDisplay(visibleCount);                                                // Show notification after UI is updated                        setTimeout(() => {                            if (visibleCount === 0) {                                new Notice(`No entries found for the selected date range.`);                            } else {                                new Notice(`Date filter applied: ${visibleCount} entries visible`);                            }                        }, 50);                    });
                }
            });
        };
        
        // Start processing the first chunk, but delay slightly to allow the UI to update first
        setTimeout(() => processNextChunk(), 50);
    }
    
    // Delay the actual processing to let any previous operations complete
    setTimeout(processFiltering, 10);
}

function updateFilterDisplay(entryCount: number) {
    const filterDisplay = document.getElementById('oom-time-filter-display');
    if (!filterDisplay) return;
    
    // Temporarily set will-change to optimize for layout changes
    filterDisplay.style.willChange = 'contents';
    
    // Create a complete HTML string instead of multiple DOM manipulations
    // This is more efficient as it causes only one reflow when inserted
    let htmlContent = '';
    
    // Icon element
    htmlContent += '<span class="oom-filter-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-calendar-range"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M17 14h-6"/><path d="M13 18H7"/></svg></span>';
    
    // Text content with appropriate class
    if (customDateRange) {
        htmlContent += `<span class="oom-filter-text oom-filter--custom-range"> Custom Range: ${customDateRange.start} to ${customDateRange.end} (${entryCount} entries) <span class="oom-filter-clear" title="Clear custom range" tabindex="0" role="button" aria-label="Clear date filter">×</span></span>`;
    } else {
        // Show dropdown label
        const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
        const label = dropdown ? dropdown.options[dropdown.selectedIndex].text : 'All Time';
        htmlContent += `<span class="oom-filter-text oom-filter--all-visible"> ${label} (${entryCount} entries) </span>`;
    }
    
    // Use a single update to minimize reflows
    requestAnimationFrame(() => {
        // First, remove the transition for immediate change
        filterDisplay.style.transition = 'none';
        filterDisplay.classList.remove('oom-filter-display--updated');
        
        // Force a reflow to ensure the removal of the class takes effect immediately
        void filterDisplay.offsetHeight;
        
        // Apply the HTML content in one operation
        filterDisplay.innerHTML = htmlContent;
        
        // Now add event listeners to the clear button if present
        const clearBtn = filterDisplay.querySelector('.oom-filter-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                // Prevent event bubbling for better performance
                e.stopPropagation();
                
                customDateRange = null;
                
                // Batch related DOM operations together
                requestAnimationFrame(() => {
                    const btn = document.getElementById('oom-custom-range-btn');
                    if (btn) btn.classList.remove('active');
                    
                    const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
                    if (dropdown) {
                        dropdown.value = dropdown.value; // Keep same value
                        dropdown.dispatchEvent(new Event('change'));
                    }
                });
            });
            
            // Keyboard accessibility
            clearBtn.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    (e.target as HTMLElement).click();
                }
            });
        }
        
        // Add the animation class in the next frame
        setTimeout(() => {
            // Reset will-change property
            filterDisplay.style.willChange = 'auto';
            
            // Restore transition and add the updated class
            filterDisplay.style.removeProperty('transition');
            filterDisplay.classList.add('oom-filter-display--updated');
            
            // Remove class after transition completes
            setTimeout(() => {
                filterDisplay.classList.remove('oom-filter-display--updated');
            }, 1000);
        }, 20);
    });
}

// Add this function to initialize CSS classes for table rows with performance optimizations
function initializeTableRowClasses() {
    // Use a flag to ensure this only runs once per page load
    if ((window as any).__tableRowsInitialized) {
        console.log('[OOM-DEBUG] Table rows already initialized, skipping');
        return;
    }
    
    // Use requestIdleCallback to run this during browser idle time
    // This prevents blocking the main thread during initial page load
    const runWhenIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
    
    runWhenIdle(() => {
        console.log('[OOM-DEBUG] Initializing table row classes during idle time');
        const tables = document.querySelectorAll('.oom-table');
        
        if (tables.length === 0) {
            console.log('[OOM-DEBUG] No tables found for row initialization');
            return;
        }
        
        // Process tables one at a time to avoid large reflows
        tables.forEach((table) => {
            // Use DocumentFragment to batch DOM operations
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            
            if (rows.length === 0) {
                console.log('[OOM-DEBUG] No rows found in table');
                return;
            }
            
            console.log(`[OOM-DEBUG] Initializing ${rows.length} table rows`);
            
            // Process rows in chunks to avoid long tasks
            const CHUNK_SIZE = 20;
            let currentChunk = 0;
            
            const processNextChunk = () => {
                const start = currentChunk * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, rows.length);
                
                // Use a single requestAnimationFrame to batch operations
                requestAnimationFrame(() => {
                    for (let i = start; i < end; i++) {
                        const row = rows[i];
                        // Add base class to all rows
                        row.classList.add('oom-dream-row');
                        
                        // Default all rows to visible
                        row.classList.add('oom-row--visible');
                        
                        // Make sure hidden class is not present initially
                        row.classList.remove('oom-row--hidden');
                        
                        // Make sure inline style display is removed if it exists
                        (row as HTMLElement).style.removeProperty('display');
                    }
                    
                    // Move to next chunk or finish
                    currentChunk++;
                    
                    if (currentChunk * CHUNK_SIZE < rows.length) {
                        // Schedule next chunk with slight delay
                        setTimeout(processNextChunk, 10);
                    } else {
                        console.log(`[OOM-DEBUG] Table row initialization complete`);
                    }
                });
            };
            
            // Start processing chunks with slight delay to allow initial render
            setTimeout(processNextChunk, 50);
        });
        
        // Set the flag to prevent reinitialization
        (window as any).__tableRowsInitialized = true;
    }, { timeout: 1000 });
}

// Function to collect metrics data from visible rows only
function collectVisibleRowMetrics(container: HTMLElement): Record<string, number[]> {
    console.log('[OOM-DEBUG] Collecting metrics from visible rows');
    const visibleRows = container.querySelectorAll('.oom-dream-row:not(.oom-row--hidden)');
    const metrics: Record<string, number[]> = {};
    
    // Initialize metrics with empty arrays
    container.querySelectorAll('.oom-table th').forEach(header => {
        const metricName = header.textContent?.trim() || '';
        if (metricName && metricName !== 'Date' && metricName !== 'Dream Title' && metricName !== 'Content') {
            metrics[metricName] = [];
        }
    });
    
    // Always include Words metric
    if (!metrics['Words']) {
        metrics['Words'] = [];
    }
    
    // Collect metrics from visible rows
    visibleRows.forEach(row => {
        // Get Words metric
        const wordsCell = row.querySelector('.column-words');
        if (wordsCell && wordsCell.textContent) {
            const wordsValue = parseInt(wordsCell.textContent.trim(), 10);
            if (!isNaN(wordsValue)) {
                metrics['Words'].push(wordsValue);
            }
        }
        
        // Process all metric columns by iterating through all cells
        row.querySelectorAll('td').forEach(cell => {
            // Skip non-metric cells
            if (cell.classList.contains('column-date') || 
                cell.classList.contains('column-dream-title') || 
                cell.classList.contains('column-content')) {
                return;
            }
            
            // Get column header to determine metric name
            const colIndex = cell.parentNode ? Array.from(cell.parentNode.children).indexOf(cell) : -1;
            if (colIndex === -1) return;
            const header = container.querySelector(`.oom-table th:nth-child(${colIndex + 1})`);
            if (!header) return;
            
            const metricName = header.textContent?.trim() || '';
            if (!metricName || metricName === 'Words') return; // Skip already handled Words column
            
            const value = parseFloat(cell.textContent?.trim() || '0');
            if (!isNaN(value)) {
                if (!metrics[metricName]) {
                    metrics[metricName] = [];
                }
                metrics[metricName].push(value);
            }
        });
    });
    
    console.log('[OOM-DEBUG] Collected metrics from visible rows:', metrics);
    return metrics;
}

// Function to update the summary table with new metrics
function updateSummaryTable(container: HTMLElement, metrics: Record<string, number[]>) {
    console.log('[OOM-DEBUG] Updating summary table with filtered metrics');
    const summarySection = container.querySelector('.oom-stats-section');
    if (!summarySection) {
        console.log('[OOM-DEBUG] No summary section found');
        return;
    }
    
    // Set will-change to optimize for upcoming changes
    summarySection.setAttribute('style', 'will-change: contents;');
    
    // Generate new summary table content
    let content = '<h2 class="oom-table-title oom-stats-title">Statistics (Filtered)</h2>';
    content += '<div class="oom-table-container">\n';
    content += '<table class="oom-table oom-stats-table">\n';
    content += '<thead>\n';
    content += '<tr>\n';
    content += '<th>Metric</th>\n';
    content += '<th>Average</th>\n';
    content += '<th>Min</th>\n';
    content += '<th>Max</th>\n';
    content += '<th>Count</th>\n';
    content += '</tr>\n';
    content += '</thead>\n';
    content += '<tbody>\n';

    // Get metric names from all table headers
    const metricNames = Object.keys(metrics);
    
    let hasMetrics = false;
    for (const name of metricNames) {
        const values = metrics[name];
        if (!values || values.length === 0) continue;
        
        hasMetrics = true;
        const avg = values.reduce((a, b) => a + b) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        let label = name;
        
        if (name === 'Words') {
            const total = values.reduce((a, b) => a + b, 0);
            label = `Words <span class="oom-words-total">(total: ${total})</span>`;
        }
        
        content += '<tr>\n';
        content += `<td>${label}</td>\n`;
        content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
        content += `<td class="metric-value">${min}</td>\n`;
        content += `<td class="metric-value">${max}</td>\n`;
        content += `<td class="metric-value">${values.length}</td>\n`;
        content += '</tr>\n';
    }

    if (!hasMetrics) {
        content += '<tr><td colspan="5" class="oom-no-metrics">No metrics available for filtered results</td></tr>\n';
    }

    content += '</tbody>\n';
    content += '</table>\n';
    content += '</div>\n';
    
    // Update the summary section in a requestAnimationFrame to avoid forced reflows
    requestAnimationFrame(() => {
        // Update the summary section
        summarySection.innerHTML = content;
        
        // Remove will-change property after update
        setTimeout(() => {
            summarySection.removeAttribute('style');
        }, 100);
    });
}

// Helper function to format a date for display
function formatDateForDisplay(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Function to force apply a date filter, called from DateNavigatorModal
window.forceApplyDateFilter = function(selectedDate: Date) {
    console.log('[OOM-DEBUG] forceApplyDateFilter called with date:', selectedDate);
    
    if (!selectedDate) {
        console.error('[OOM-DEBUG] No date provided to forceApplyDateFilter');
        new Notice('Cannot apply filter: no date selected.');
        return;
    }

    // Get the OOM content
    const previewEl = document.querySelector('.oom-metrics-content');
    if (!previewEl) {
        console.error('[OOM-DEBUG] Cannot find .oom-metrics-content element');
        new Notice('Cannot apply filter: OOM content not found.');
        return;
    }

    // Create start and end of day for precise filtering
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('[OOM-DEBUG] Filtering for date range:', {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
    });

    // Get all rows
    const rows = previewEl.querySelectorAll('.oom-dream-row');
    console.log(`[OOM-DEBUG] Found ${rows.length} rows to filter`);
    
    // For performance, prepare date strings before filtering
    const startStr = startOfDay.toISOString().split('T')[0];
    const endStr = endOfDay.toISOString().split('T')[0];
    
    // Track counts for feedback
    let visibleCount = 0;
    let hiddenCount = 0;
    let invalidDateCount = 0;
    
    // Apply date filter to each row
    rows.forEach(row => {
        const dateCell = row.querySelector('.column-date');
        if (!dateCell || !dateCell.textContent) {
            invalidDateCount++;
            (row as HTMLElement).classList.add('oom-row--hidden');
            (row as HTMLElement).classList.remove('oom-row--visible');
            return;
        }
        
        try {
            // Parse date from cell
            const dateText = dateCell.textContent.trim();
            const rowDate = new Date(dateText);
            const rowDateStr = rowDate.toISOString().split('T')[0];
            
            // Check if the date matches the selected date
            const isVisible = rowDateStr === startStr;
            
            if (isVisible) {
                (row as HTMLElement).classList.remove('oom-row--hidden');
                (row as HTMLElement).classList.add('oom-row--visible');
                visibleCount++;
            } else {
                (row as HTMLElement).classList.add('oom-row--hidden');
                (row as HTMLElement).classList.remove('oom-row--visible');
                hiddenCount++;
            }
        } catch (e) {
            console.error('[OOM-DEBUG] Error processing row date:', dateCell.textContent, e);
            invalidDateCount++;
            (row as HTMLElement).classList.add('oom-row--hidden');
            (row as HTMLElement).classList.remove('oom-row--visible');
        }
    });
    
    console.log(`[OOM-DEBUG] Date filter applied: ${visibleCount} visible, ${hiddenCount} hidden, ${invalidDateCount} invalid dates`);
    
    // Update the filter display
    const filterDisplay = previewEl.querySelector('#oom-time-filter-display');
    if (filterDisplay) {
        filterDisplay.textContent = `Filtered by date: ${selectedDate.toLocaleDateString()} (${visibleCount} entries)`;
        filterDisplay.classList.add('oom-filter-active');
    }
    
    // IMPORTANT: Update summary table with filtered metrics
    const filteredMetrics = collectVisibleRowMetrics(previewEl as HTMLElement);
    updateSummaryTable(previewEl as HTMLElement, filteredMetrics);
    
    new Notice(`Date filter applied: ${visibleCount} entries visible`);
}

// Add TypeScript declaration for the window object extension
declare global {
    interface Window {
        forceApplyDateFilter: (selectedDate: Date) => void;
    }
}

// Function to toggle content visibility for a given button - alternative implementation
function toggleContentVisibility(button: HTMLElement, previewEl: HTMLElement) {
    console.log('[OOM-DEBUG] Using alternative content visibility implementation');
    
    try {
        // Get the content cell ID from the button
        const contentCellId = button.getAttribute('data-parent-cell');
        if (!contentCellId) {
            console.error('[OOM-DEBUG] No data-parent-cell attribute on button');
            new Notice('Error: Cannot find content to expand');
            return;
        }
        
        const contentCell = document.getElementById(contentCellId);
        if (!contentCell) {
            console.error('[OOM-DEBUG] Could not find content cell with ID:', contentCellId);
            new Notice('Error: Content cell not found');
            return;
        }
        
        // Get the current state
        const isExpanded = button.getAttribute('data-expanded') === 'true';
        console.log('[OOM-DEBUG] Current state:', isExpanded);
        
        // Get elements
        const contentWrapper = contentCell.querySelector('.oom-content-wrapper');
        const previewContent = contentCell.querySelector('.oom-content-preview');
        const fullContent = contentCell.querySelector('.oom-content-full');
        
        if (!contentWrapper || !previewContent || !fullContent) {
            console.error('[OOM-DEBUG] Missing required elements');
            return;
        }
        
        // Force browser reflow first
        void contentCell.offsetHeight;
        
        // Direct DOM manipulation approach
        if (!isExpanded) {
            // EXPANDING
            // 1. First update button state
            button.setAttribute('data-expanded', 'true');
            button.setAttribute('aria-expanded', 'true');
            const buttonText = button.querySelector('.oom-button-text');
            if (buttonText) buttonText.textContent = 'Show less';
            
            // 2. Update content wrapper
            contentWrapper.setAttribute('data-expanded', 'true');
            contentWrapper.classList.add('expanded');
            
            // 3. Set styles directly on the elements
            (previewContent as HTMLElement).style.display = 'none';
            (fullContent as HTMLElement).style.display = 'block';
            
            // 4. Update the table row height to fit the new content
            const tableRow = contentCell.closest('tr');
            if (tableRow) {
                (tableRow as HTMLElement).style.height = 'auto';
                (tableRow as HTMLElement).style.minHeight = 'fit-content';
            }
            
            console.log('[OOM-DEBUG] Expanded content');
        } else {
            // COLLAPSING
            // 1. First update button state
            button.setAttribute('data-expanded', 'false');
            button.setAttribute('aria-expanded', 'false');
            const buttonText = button.querySelector('.oom-button-text');
            if (buttonText) buttonText.textContent = 'Show more';
            
            // 2. Update content wrapper
            contentWrapper.setAttribute('data-expanded', 'false');
            contentWrapper.classList.remove('expanded');
            
            // 3. Set styles directly on the elements
            (previewContent as HTMLElement).style.display = 'block';
            (fullContent as HTMLElement).style.display = 'none';
            
            console.log('[OOM-DEBUG] Collapsed content');
        }
        
        // Force browser reflow once more to ensure changes are applied
        void contentCell.offsetHeight;
        
    } catch (error) {
        console.error('[OOM-DEBUG] Error in toggleContentVisibility:', error);
    }
}

// Helper function to expand all content sections - useful for debugging
function expandAllContentSections(previewEl: HTMLElement) {
    console.log('[OOM-DEBUG] Expanding all content sections for debugging');
    
    const expandButtons = previewEl.querySelectorAll('.oom-button--expand');
    expandButtons.forEach(button => {
        const isExpanded = button.getAttribute('data-expanded') === 'true';
        if (!isExpanded) {
            // Only expand sections that aren't already expanded
            console.log('[OOM-DEBUG] Expanding content section:', button.getAttribute('data-parent-cell'));
            toggleContentVisibility(button as HTMLElement, previewEl);
        }
    });
    
    console.log('[OOM-DEBUG] Finished expanding all content sections');
}

// Debug helper - expose content expansion function to window object for console debugging
(window as any).debugContentExpansion = function(showExpanded: boolean = true) {
    console.log('[OOM-DEBUG] Manual content expansion debug triggered');
    
    // Get the OOM content container
    const previewEl = document.querySelector('.oom-metrics-content') as HTMLElement;
    if (!previewEl) {
        console.error('[OOM-DEBUG] Cannot find .oom-metrics-content element');
        return 'Error: Content container not found';
    }
    
    // Find all expand buttons
    const expandButtons = previewEl.querySelectorAll('.oom-button--expand');
    console.log(`[OOM-DEBUG] Found ${expandButtons.length} content expansion buttons`);
    
    if (expandButtons.length === 0) {
        return 'No content expansion buttons found';
    }
    
    // Toggle each button to the desired state
    let processed = 0;
    expandButtons.forEach(button => {
        const isCurrentlyExpanded = button.getAttribute('data-expanded') === 'true';
        
        // Only process if the button isn't already in the desired state
        if (showExpanded !== isCurrentlyExpanded) {
            console.log(`[OOM-DEBUG] Processing button:`, button);
            toggleContentVisibility(button as HTMLElement, previewEl);
            processed++;
        }
    });
    
    // Output summary
    if (processed > 0) {
        return `${processed} content sections ${showExpanded ? 'expanded' : 'collapsed'}`;
    } else {
        return `All content sections already ${showExpanded ? 'expanded' : 'collapsed'}`;
    }
};

// Helper function to safely access settings properties (handles type compatibility during refactoring)
function safeSettingsAccess(settings: any, propName: string, defaultValue: any = undefined) {
    if (!settings) return defaultValue;
    return settings[propName] !== undefined ? settings[propName] : defaultValue;
}

// Helper function for icon rendering
function getIcon(iconName: string): string | null {
    if (!iconName) return null;
    // Check if it's a Lucide icon
    const lucideIcon = lucideIconMap?.[iconName];
    if (lucideIcon) return lucideIcon;
    // Return a simple span as fallback
    return `<span class="icon">${iconName}</span>`;
}
