// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile, ButtonComponent, TFolder, View, WorkspaceLeaf, Menu } from 'obsidian';
import { DEFAULT_METRICS, DreamMetricData, LogLevel, DEFAULT_LOGGING, DreamMetric, DreamMetricsSettings } from './types';
import { DreamMetricsSettingTab } from './settings';
import { lucideIconMap } from './settings';
import { CustomDateRangeModal } from './src/CustomDateRangeModal';
import { Logger as LogManager } from './utils/logger';
import { createSelectedNotesAutocomplete, createFolderAutocomplete } from './autocomplete';

// Move this to the top of the file, before any functions that use it
let customDateRange: { start: string, end: string } | null = null;

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
        this.selectionMode = plugin.settings.selectionMode || 'notes';
        this.selectedNotes = plugin.settings.selectedNotes || [];
        this.selectedFolder = plugin.settings.selectedFolder || '';
    }

    onOpen() {
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
                        this.plugin.settings.selectedFolder = folder;
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
            const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.projectNote);
            if (file instanceof TFile) {
                this.app.workspace.openLinkText(this.plugin.settings.projectNote, '', true);
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
            this.plugin.settings.selectionMode = value;
            if (value === 'folder') {
                this.plugin.settings.selectedNotes = [];
            } else {
                this.plugin.settings.selectedFolder = '';
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
                            this.plugin.settings.selectedFolder = folder;
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
    logger: LogManager;
    expandedStates: Set<string>;
    private ribbonIcons: HTMLElement[] = [];
    private container: HTMLElement | null = null;

    // Add memoization for table calculations
    private memoizedTableData = new Map<string, any>();
    private cleanupFunctions: (() => void)[] = [];

    private currentSortDirection: { [key: string]: 'asc' | 'desc' } = {};

    async onload() {
        console.log('[DEBUG] Plugin loaded');
        console.log("PLUGIN LOADED: OneiroMetrics");
        (window as any).oneiroMetricsPlugin = this;
        this.logger = LogManager.getInstance(this.app);
        
        // Initialize container
        this.container = document.querySelector('.markdown-preview-view');
        
        await this.loadSettings();
        
        // Configure logger with settings
        this.logger.configure(this.settings.logging.level);
        
        // Load expanded states from settings
        if (this.settings.expandedStates) {
            this.expandedStates = new Set(Object.keys(this.settings.expandedStates).filter(key => this.settings.expandedStates[key]));
            this.logger.log('UI', `Loaded ${this.expandedStates.size} expanded states`);
        }

        // Add settings tab
        this.addSettingTab(new DreamMetricsSettingTab(this.app, this));

        // Add ribbon icon for modal
        const ribbonIcon = this.addRibbonIcon('wand', 'Dream Scrape Tool', () => {
            new OneiroMetricsModal(this.app, this).open();
        });
        ribbonIcon.addClass('oom-ribbon-scrape-button');

        // Add right-click menu for settings
        ribbonIcon.addEventListener('contextmenu', (evt) => {
            evt.preventDefault();
            (this.app as any).setting.open('oneirometrics');
        });

        // Add command to open modal
        this.addCommand({
            id: 'open-oneirometrics-modal',
            name: 'Dream Scrape Tool',
            callback: () => {
                new OneiroMetricsModal(this.app, this).open();
            }
        });

        // Add command to open settings
        this.addCommand({
            id: 'open-oneirometrics-settings',
            name: 'Open OneiroMetrics Settings',
            callback: () => {
                (this.app as any).setting.open();
                (this.app as any).setting.openTabById('oneirometrics');
            }
        });

        // Add command to open metrics note
        this.addCommand({
            id: 'open-metrics-note',
            name: 'Open Metrics Note',
            callback: () => {
                const file = this.app.vault.getAbstractFileByPath(this.settings.projectNote);
                if (file instanceof TFile) {
                    this.app.workspace.openLinkText(this.settings.projectNote, '', true);
                } else {
                    new Notice('Metrics note not found. Please set the path in settings.');
                    // Open settings to the OneiroMetrics tab
                    (this.app as any).setting.open('oneirometrics');
                }
            }
        });

        // Update ribbon icons based on settings
        this.updateRibbonIcons();

        this.addCommand({
            id: 'scrape-metrics',
            name: 'Scrape Metrics',
            callback: () => this.scrapeMetrics(),
        });

        // Add command to copy console logs
        this.addCommand({
            id: 'copy-console-logs',
            name: 'Copy Console Logs to Debug File',
            callback: () => this.copyConsoleLogs()
        });

        // Register event handlers for project note view
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.updateProjectNoteView();
            })
        );

        // Add check for Live Preview mode
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                if (!leaf) return;
                
                const view = leaf.view;
                if (!view || !(view instanceof MarkdownView)) return;

                // Check if this is a OneiroMetrics note
                const file = view.file;
                if (!file) return;

                if (file.path === this.settings.projectNote) {
                    // Check if we're in Live Preview mode
                    const isLivePreview = view.getMode() === 'source';
                    if (isLivePreview) {
                        // Show notice
                        new Notice('OneiroMetrics requires Reading View. Please switch to Reading View for proper functionality.', 10000);
                        
                        // Add a warning banner
                        const container = view.containerEl;
                        const existingWarning = container.querySelector('.oom-live-preview-warning');
                        if (!existingWarning) {
                            const warning = container.createEl('div', {
                                cls: 'oom-live-preview-warning',
                                attr: {
                                    style: `
                                        position: fixed;
                                        top: 0;
                                        left: 0;
                                        right: 0;
                                        z-index: 1000;
                                        background: var(--background-modifier-error);
                                        color: var(--text-error);
                                        padding: 1em;
                                        text-align: center;
                                        border-bottom: 1px solid var(--text-error);
                                    `
                                }
                            });
                            warning.createEl('strong', { text: 'Warning: ' });
                            warning.createEl('span', { 
                                text: 'OneiroMetrics requires Reading View. Please switch to Reading View for proper functionality.'
                            });
                        }
                    } else {
                        // Remove warning if it exists
                        const container = view.containerEl;
                        const warning = container.querySelector('.oom-live-preview-warning');
                        if (warning) {
                            warning.remove();
                        }
                    }
                }
            })
        );

        // Add commands for log management
        this.addCommand({
            id: 'clear-debug-log',
            name: 'Clear Debug Log',
            callback: () => this.clearDebugLog()
        });

        this.addCommand({
            id: 'backup-debug-log',
            name: 'Backup Debug Log',
            callback: () => this.backupDebugLog()
        });

        // Check log file size periodically
        this.registerInterval(
            window.setInterval(() => this.checkLogFileSize(), 5 * 60 * 1000) // Check every 5 minutes
        );
    }

    onunload() {
        // Execute all cleanup functions
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
        
        // Clear memoization cache
        this.memoizedTableData.clear();
    }

    async loadSettings() {
        console.log('[OneiroMetrics] Starting loadSettings...');
        const defaultSettings: DreamMetricsSettings = {
            projectNote: 'Journals/Dream Diary/Metrics/Metrics.md',
            showNoteButton: true,
            showScrapeButton: true,
            metrics: Object.fromEntries(DEFAULT_METRICS.map(metric => [
                metric.name,
                { ...metric }  // Preserve the original enabled state from DEFAULT_METRICS
            ])),
            selectedNotes: [],
            calloutName: 'dream-metrics',
            selectionMode: 'notes',
            selectedFolder: '',
            expandedStates: {},
            backupEnabled: false,
            backupFolderPath: '',
            logging: { ...DEFAULT_LOGGING },
            _persistentExclusions: {}
        };

        console.log('[OneiroMetrics] Default metrics:', Object.keys(defaultSettings.metrics), 'Count:', Object.keys(defaultSettings.metrics).length);

        // Load saved data
        const savedData = await this.loadData();
        if (savedData && savedData.metrics) {
            console.log('[OneiroMetrics] Saved metrics:', Object.keys(savedData.metrics), 'Count:', Object.keys(savedData.metrics).length);
        } else {
            console.log('[OneiroMetrics] No saved metrics found.');
        }

        // Initialize settings with defaults
        this.settings = { ...defaultSettings };
        console.log('[OneiroMetrics] Defaults after init:', Object.entries(this.settings.metrics).map(([name, m]) => `${name}: ${m.enabled}`));

        // Merge logic: always show all defaults (enabled), all customs (disabled unless user enabled them)
        const mergedMetrics: Record<string, DreamMetric> = { ...defaultSettings.metrics };
        if (savedData && typeof savedData.metrics === 'object' && savedData.metrics !== null) {
            for (const [name, metricRaw] of Object.entries(savedData.metrics)) {
                const metric = metricRaw as DreamMetric;
                if (mergedMetrics[name]) {
                    // If it's a default, preserve user's enabled state
                    const source = `SAVED (overrides default: ${mergedMetrics[name].enabled} -> ${metric.enabled})`;
                    mergedMetrics[name] = { ...mergedMetrics[name], ...metric };
                    console.log(`[OneiroMetrics] Merging metric '${name}': enabled=${mergedMetrics[name].enabled} [${source}]`);
                } else {
                    // Custom metric: use saved value
                    const source = `CUSTOM (saved: ${metric.enabled})`;
                    mergedMetrics[name] = { ...metric, enabled: metric.enabled ?? false };
                    console.log(`[OneiroMetrics] Merging metric '${name}': enabled=${mergedMetrics[name].enabled} [${source}]`);
                }
            }
        }
        this.settings.metrics = mergedMetrics;
        console.log('[OneiroMetrics] Merged metrics:', Object.keys(mergedMetrics), 'Count:', Object.keys(mergedMetrics).length);

        // Merge all other settings except metrics
        if (savedData) {
            Object.keys(savedData).forEach(key => {
                if (key !== 'metrics' && key in this.settings) {
                    (this.settings as any)[key] = savedData[key];
                }
            });
        }

        // Ensure logging settings are properly initialized
        if (!this.settings.logging) {
            this.settings.logging = { ...DEFAULT_LOGGING };
        }

        console.log('[OneiroMetrics] Final settings:', this.settings);
        console.log('[OneiroMetrics] Final metrics:', Object.keys(this.settings.metrics), 'Count:', Object.keys(this.settings.metrics).length);
        console.log('[OneiroMetrics] Enabled states:', Object.entries(this.settings.metrics).map(([name, m]) => `${name}: ${m.enabled}`));
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    public async showMetrics() {
        // Get the active leaf
        const leaf = this.app.workspace.activeLeaf;
        // ... existing code ...
    }

    async scrapeMetrics() {
        console.log('[OneiroMetrics] Starting metrics scrape...');
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

        // --- Flexible Note/Folder Selection (mirroring settings tab) ---
        new Setting(progressContent)
            .setName('Selection Mode')
            .setDesc('Choose whether to select individual notes or a folder for metrics scraping')
            .addDropdown(drop => {
                drop.addOption('notes', 'Notes');
                drop.addOption('folder', 'Folder');
                drop.setValue(this.settings.selectionMode || 'notes');
                drop.onChange(async (value) => {
                    this.settings.selectionMode = value as 'notes' | 'folder';
                    // Clear irrelevant selection when switching modes
                    if (value === 'folder') {
                        this.settings.selectedNotes = [];
                    } else {
                        this.settings.selectedFolder = '';
                    }
                    await this.saveSettings();
                    this.scrapeMetrics();
                });
            });

        // Dynamic label and field
        let selectionLabel = this.settings.selectionMode === 'folder' ? 'Selected Folder' : 'Selected Notes';
        let selectionDesc = this.settings.selectionMode === 'folder'
            ? 'Choose a folder to recursively search for dream metrics (max 200 files)'
            : 'Notes to search for dream metrics (select one or more)';
        let selectionSetting = new Setting(progressContent)
            .setName(selectionLabel)
            .setDesc(selectionDesc);

        if ((this.settings.selectionMode || 'notes') === 'folder') {
            // Folder autocomplete (styled like in settings)
            selectionSetting.addSearch(search => {
                search.setPlaceholder('Choose folder...');
                search.setValue(this.settings.selectedFolder || '');
                const parentForSuggestions = search.inputEl.parentElement || progressContent;
                const suggestionContainer = parentForSuggestions.createEl('div', {
                    cls: 'suggestion-container oom-suggestion-container',
                    attr: {
                        style: `
                            display: none;
                            position: absolute;
                            z-index: 1000;
                            background: var(--background-primary);
                            border: 1px solid var(--background-modifier-border);
                            border-radius: 4px;
                            max-height: 200px;
                            overflow-y: auto;
                            min-width: 180px;
                            width: 100%;
                            box-shadow: 0 2px 8px var(--background-modifier-box-shadow);
                        `
                    }
                });
                function positionSuggestionContainer() {
                    const inputRect = search.inputEl.getBoundingClientRect();
                    const parent = search.inputEl.parentElement || progressContent;
                    const parentRect = parent.getBoundingClientRect();
                    const dropdownWidth = Math.max(inputRect.width, 180);
                    let left = inputRect.left - parentRect.left;
                    let top = inputRect.bottom - parentRect.top;
                    suggestionContainer.classList.add('oom-suggestion-container');
                    suggestionContainer.style.removeProperty('position');
                    suggestionContainer.style.removeProperty('left');
                    suggestionContainer.style.removeProperty('top');
                    suggestionContainer.style.removeProperty('width');
                    suggestionContainer.style.removeProperty('overflowX');
                    suggestionContainer.style.removeProperty('maxWidth');
                    suggestionContainer.style.removeProperty('right');
                    suggestionContainer.style.setProperty('--oom-suggestion-left', `${left}px`);
                    suggestionContainer.style.setProperty('--oom-suggestion-top', `${top}px`);
                    suggestionContainer.style.setProperty('--oom-suggestion-width', `${dropdownWidth}px`);
                }
                this.register(() => suggestionContainer.remove());
                const getFolders = (): string[] => {
                    const folders: string[] = [];
                    const files = this.app.vault.getAllLoadedFiles();
                    files.forEach(file => {
                        if (file instanceof TFolder) {
                            folders.push(file.path);
                        }
                    });
                    return folders.sort((a, b) => a.localeCompare(b));
                };
                const showSuggestions = (query: string) => {
                    const folders = getFolders();
                    const normalizedQuery = query.toLowerCase();
                    const filteredFolders = folders
                        .filter(folder => folder.toLowerCase().includes(normalizedQuery))
                        .slice(0, 10);
                    suggestionContainer.empty();
                    if (filteredFolders.length > 0) {
                        filteredFolders.forEach(folder => {
                            const item = suggestionContainer.createEl('div', {
                                cls: 'suggestion-item',
                                attr: { title: folder }
                            });
                            item.textContent = folder;
                            item.addEventListener('mousedown', async (e) => {
                                e.preventDefault();
                                search.setValue(folder);
                                this.settings.selectedFolder = folder;
                                await this.saveSettings();
                                suggestionContainer.classList.remove('visible');
                                suggestionContainer.style.display = 'none';
                                this.scrapeMetrics();
                            });
                        });
                        positionSuggestionContainer();
                        suggestionContainer.classList.add('visible');
                        suggestionContainer.style.display = 'block';
                    } else {
                        suggestionContainer.classList.remove('visible');
                        suggestionContainer.style.display = 'none';
                    }
                };
                search.inputEl.addEventListener('input', (e) => {
                    showSuggestions(search.inputEl.value);
                });
                search.inputEl.addEventListener('focus', (e) => {
                    showSuggestions(search.inputEl.value);
                });
                search.inputEl.addEventListener('blur', () => {
                    setTimeout(() => {
                        suggestionContainer.classList.remove('visible');
                        suggestionContainer.style.display = 'none';
                    }, 200);
                });
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
        if (this.settings.selectionMode === 'folder' && this.settings.selectedFolder) {
            // Recursively gather up to 200 markdown files from the selected folder
            const folder = this.app.vault.getAbstractFileByPath(this.settings.selectedFolder);
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
            console.warn('[OneiroMetrics] No notes selected.');
            progressModal.close();
            return;
        }

        // Process files in batches of 5
        const BATCH_SIZE = 5;
        const totalFiles = files.length;
        console.log(`[OneiroMetrics] Processing ${totalFiles} files in batches of ${BATCH_SIZE}`);

        for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (path) => {
                const file = this.app.vault.getAbstractFileByPath(path);
                if (!(file instanceof TFile)) {
                    console.warn(`[OneiroMetrics] File not found or not a file: ${path}`);
                    return;
                }
                validNotes++;
                try {
                    const content = await this.app.vault.read(file);
                    console.log(`[OneiroMetrics] Processing file: ${path}`);
                    console.log(`[OneiroMetrics] Content length: ${content.length} characters`);

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
                                    dreamEntries.push({
                                        date,
                                        title,
                                        content: dreamContent,
                                        source: {
                                            file: path,
                                            id: blockId // Store the block ID
                                        },
                                        metrics: dreamMetrics,
                                        calloutMetadata: [] // Could extract if needed
                                    });
                                    entriesProcessed++;
                                }
                            }
                        }
                    }
                    // --- END IMPROVED STACK LOGIC ---
                    // After the blockStack/line-walking loop, before extracting dream entries:
                    console.log('[OneiroMetrics][DEBUG] Parsed callout structure for file:', path, JSON.stringify({ journals, blockStack }, null, 2));
                } catch (error) {
                    console.error(`[OneiroMetrics] Error processing file ${path}:`, error);
                    new Notice(`Error processing file: ${path}`);
                }
            });

            // Wait for batch to complete
            await Promise.all(batchPromises);
        }

        // Final validation and logging
        console.log('[OneiroMetrics] Scrape complete:');
        console.log(`- Valid notes: ${validNotes}`);
        console.log(`- Journal entries found: ${foundAnyJournalEntries}`);
        console.log(`- Metrics found: ${foundAnyMetrics}`);
        console.log(`- Total entries processed: ${entriesProcessed}`);
        console.log(`- Total callouts found: ${calloutsFound}`);

        if (validNotes === 0) {
            console.log('[OneiroMetrics] No valid notes found');
            new Notice('No valid notes found. Please check your selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyJournalEntries) {
            console.log('[OneiroMetrics] No journal entries found');
            new Notice('No journal entries found in selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyMetrics) {
            console.log('[OneiroMetrics] No dream metrics callouts found');
            new Notice('No dream metrics callouts found in selected notes.');
            progressModal.close();
            return;
        }
        if (entriesProcessed === 0) {
            console.log('[OneiroMetrics] No metrics data found');
            new Notice('No metrics data found in selected notes.');
            progressModal.close();
            return;
        }

        // Sort and update
        dreamEntries.sort((a, b) => a.date.localeCompare(b.date));
        console.log(`[OneiroMetrics] Updating project note with ${dreamEntries.length} entries`);
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
        
        console.log('[OneiroMetrics] Processing metrics text:', metricsText);
        
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
                
                console.log(`[OneiroMetrics] Processed metric: ${metricName} = ${numValue}`);
            }
        }
        
        console.log('[OneiroMetrics] Final dream metrics:', dreamMetrics);
        return dreamMetrics;
    }

    private async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]) {
        console.log('[OneiroMetrics][DEBUG] updateProjectNote called for:', this.settings.projectNote);
        const projectFile = this.app.vault.getAbstractFileByPath(this.settings.projectNote);
        new Notice(`[DEBUG] updateProjectNote called for: ${this.settings.projectNote}`);
        console.log('[OneiroMetrics] updateProjectNote called for:', this.settings.projectNote);
        if (!(projectFile instanceof TFile)) {
            console.log('[OneiroMetrics][DEBUG] Early return: projectFile is not a TFile');
            new Notice(`[DEBUG] Project note not found: ${this.settings.projectNote}`);
            return;
        }
        if (dreamEntries.length === 0) {
            console.log('[OneiroMetrics][DEBUG] Early return: dreamEntries.length === 0');
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
                console.log('[OneiroMetrics] Project note updated with new metrics and dream entries.');
                // Force reload of the project note in all open leaves
                let reloaded = false;
                this.app.workspace.iterateAllLeaves(leaf => {
                    if (leaf.view instanceof MarkdownView && leaf.view.file && leaf.view.file.path === this.settings.projectNote) {
                        leaf.openFile(projectFile, { active: leaf === this.app.workspace.activeLeaf });
                        reloaded = true;
                        console.log('[OneiroMetrics] Forced reload of project note in workspace leaf.');
                    }
                });
                if (!reloaded) {
                    console.log('[OneiroMetrics] Project note was not open in any workspace leaf.');
                }
                // Update view after content change
                this.updateProjectNoteView();
                // Attach event listeners after table render
                setTimeout(() => this.attachProjectNoteEventListeners(), 500);
            } else {
                new Notice('[DEBUG] No changes to metrics tables.');
                console.log('[OneiroMetrics] No changes detected. Project note left unchanged.');
                // Attach event listeners after table render
                setTimeout(() => this.attachProjectNoteEventListeners(), 500);
            }
        } catch (error) {
            console.error('[OneiroMetrics][ERROR] updateProjectNote error:', error);
            new Notice(`[ERROR] Failed to update project note: ${error.message}`);
        }
    }

    private async backupProjectNote(file: TFile) {
        if (!this.settings.backupEnabled) {
            console.log('[OneiroMetrics] Backups are disabled in settings');
            return;
        }

        if (!this.settings.backupFolderPath) {
            console.log('[OneiroMetrics] No backup folder path set in settings');
            new Notice('Please select a backup folder in settings');
            return;
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
            const backupPath = `${this.settings.backupFolderPath}/${fileName}.backup-${timestamp}.bak`;
            
            // Check if backup folder exists
            const backupFolder = this.app.vault.getAbstractFileByPath(this.settings.backupFolderPath);
            if (!backupFolder) {
                try {
                    await this.app.vault.createFolder(this.settings.backupFolderPath);
                    console.log(`[OneiroMetrics] Created backup folder: ${this.settings.backupFolderPath}`);
                } catch (error) {
                    console.error('[OneiroMetrics] Error creating backup folder:', error);
                    throw new Error(`Failed to create backup folder: ${error.message}`);
                }
            }
            
            // Check if backup file already exists
            const existingBackup = this.app.vault.getAbstractFileByPath(backupPath);
            if (existingBackup) {
                console.log(`[OneiroMetrics] Backup file already exists: ${backupPath}`);
                throw new Error('Backup file already exists');
            }
            
            // Create the backup file
            await this.app.vault.create(backupPath, content);
            console.log(`[OneiroMetrics] Created backup at: ${backupPath}`);
            
            // Clean up old backups (keep last 5)
            try {
                const backupFiles = this.app.vault.getMarkdownFiles()
                    .filter(f => f.path.startsWith(this.settings.backupFolderPath ?? '') && 
                        f.basename.startsWith(fileName) && 
                        f.basename.includes('.backup-'))
                    .sort((a, b) => b.stat.mtime - a.stat.mtime);
                
                // Delete backups older than the 5 most recent
                for (let i = 5; i < backupFiles.length; i++) {
                    await this.app.vault.delete(backupFiles[i]);
                    console.log(`[OneiroMetrics] Deleted old backup: ${backupFiles[i].path}`);
                }
            } catch (error) {
                console.warn('[OneiroMetrics] Error cleaning up old backups:', error);
                // Don't throw here, as the main backup was successful
            }
            
            new Notice(`Backup created: ${backupPath}`);
        } catch (error) {
            console.error('[OneiroMetrics] Error creating backup:', error);
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
        let content = '';
        content += `<div class="oom-table-section oom-stats-section">`;
        content += '<h2 class="oom-table-title oom-stats-title">Statistics</h2>';
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

        // Only show metrics that are in the configured list (plus Words)
        const validMetricNames = [
            'Words',
            ...Object.values(this.settings.metrics).map(m => m.name)
        ];

        let hasMetrics = false;
        for (const name of validMetricNames) {
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
            } else {
                const metric = Object.values(this.settings.metrics).find(m => m.name === name);
                if (metric?.icon && lucideIconMap[metric.icon]) {
                    label = `<span class="oom-metric-icon-svg oom-metric-icon--start">${lucideIconMap[metric.icon]}</span> ${name}`;
                }
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
            content += '<tr><td colspan="5" class="oom-no-metrics">No metrics available</td></tr>\n';
        }

        content += '</tbody>\n';
        content += '</table>\n';
        content += '</div>\n';
        content += '</div>\n';
        return content;
    }

    private generateMetricsTable(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): string {
        console.log('[DEBUG] generateMetricsTable called');
        console.log(`[OneiroMetrics] Generating table with ${dreamEntries.length} entries`);
        let content = '';
        const cacheKey = JSON.stringify({ metrics, dreamEntries });
        
        if (this.memoizedTableData.has(cacheKey)) {
            console.log('[OneiroMetrics] Using cached table data');
            return this.memoizedTableData.get(cacheKey);
        }

        // Add H1 title above the button bar
        content += '<h1 class="oneirometrics-title">OneiroMetrics (Dream Metrics)</h1>';
        // Add rescrape/settings/debug buttons at the top
        content += '<div class="oom-rescrape-container">';
        content += '<button class="mod-cta oom-rescrape-button">Rescrape Metrics</button>';
        content += '<button class="mod-cta oom-settings-button">Settings</button>';
        content += '<button class="mod-warning oom-debug-attach-listeners">Debug: Attach Show More Listeners</button>';
        content += '</div>';

        content += '<!-- OOM METRICS START -->\n';
        content += '<div class="oom-metrics-container">\n';
        content += '<div class="oom-metrics-content">\n';

        // Generate summary table
        content += this.generateSummaryTable(metrics);

        // Generate detailed table
        content += '<h2 class="oom-dream-entries-title">Dream Entries</h2>\n';
        
        // Add filter controls
        content += '<div class="oom-filter-controls">\n';
        content += '<div class="oom-filter-group">\n';
        content += '<select id="oom-date-range-filter" class="oom-select">\n';
        content += '<option value="all">All Time</option>\n';
        content += '<option value="today">Today</option>\n';
        content += '<option value="yesterday">Yesterday</option>\n';
        content += '<option value="thisWeek">This Week</option>\n';
        content += '<option value="thisMonth">This Month</option>\n';
        content += '<option value="last30">Last 30 Days</option>\n';
        content += '<option value="last6months">Last 6 Months</option>\n';
        content += '<option value="thisYear">This Year</option>\n';
        content += '<option value="last12months">Last 12 Months</option>\n';
        content += '</select>\n';
        content += '<button id="oom-custom-range-btn" class="oom-button">Custom Range</button>\n';
        content += '<div id="oom-time-filter-display" class="oom-filter-display"></div>\n';
        content += '</div>\n';

        content += '<div class="oom-table-section">\n';
        content += '<table class="oom-table">\n';
        content += '<thead>\n<tr>\n';
        content += '<th class="column-date">Date</th>\n';
        content += '<th class="column-dream-title">Dream Title</th>\n';
        content += '<th class="column-words">Words</th>\n';
        content += '<th class="column-content">Content</th>\n';
        // Add metric columns
        for (const metric of Object.values(this.settings.metrics)) {
            if (metric.enabled) {
                const metricClass = `column-metric-${metric.name.toLowerCase().replace(/\s+/g, '-')}`;
                content += `<th class=\"${metricClass}\">${metric.name}</th>\n`;
            }
        }
        content += '</tr>\n</thead>\n<tbody>\n';

        // Sort entries by date
        dreamEntries.sort((a, b) => {
            const dateA = this.parseDate(a.date);
            const dateB = this.parseDate(b.date);
            return dateA.getTime() - dateB.getTime();
        });

        for (const entry of dreamEntries) {
            content += `<tr class=\"oom-dream-row\" data-date=\"${entry.date}\">\n`;
            // Date
            content += `<td class=\"column-date\">${this.formatDate(this.parseDate(entry.date))}</td>\n`;
            // Dream Title
            content += `<td class=\"oom-dream-title column-dream-title\"><a href=\"${entry.source.file.replace(/\.md$/, '')}#${entry.source.id}\" data-href=\"${entry.source.file.replace(/\.md$/, '')}#${entry.source.id}\" class=\"internal-link\" data-link-type=\"block\" data-link-path=\"${entry.source.file.replace(/\.md$/, '')}\" data-link-hash=\"${entry.source.id}\" title=\"${entry.title}\">${entry.title}</a></td>\n`;
            // Words
            content += `<td class=\"column-words\">${entry.metrics['Words'] || 0}</td>\n`;
            // Content
            let dreamContent = this.processDreamContent(entry.content);
            if (!dreamContent || !dreamContent.trim()) {
                dreamContent = '';
            }
            const cellId = `oom-content-${entry.date}-${entry.title.replace(/[^a-zA-Z0-9]/g, '')}`;
            const preview = dreamContent.length > 200 ? dreamContent.substring(0, 200) + '...' : dreamContent;
            if (dreamContent.length > 200) {
                content += `<td class=\"oom-dream-content column-content\" id=\"${cellId}\">` +
                    `<div class=\"oom-content-wrapper\">` +
                    `<div class=\"oom-content-preview\">${preview}</div>` +
                    `<div class=\"oom-content-full\">${dreamContent}</div>` +
                    `<button type=\"button\" class=\"oom-button oom-button--expand oom-button--state-default\" aria-expanded=\"false\" aria-controls=\"${cellId}\" data-expanded=\"false\" data-content-id=\"${cellId}\" data-parent-cell=\"${cellId}\">` +
                    `<span class=\"oom-button-text\">Show more</span>` +
                    `<span class=\"oom-button-icon\">▼</span>` +
                    `<span class=\"visually-hidden\"> full dream content</span>` +
                    `</button>` +
                    `</div></td>\n`;
            } else {
                content += `<td class=\"oom-dream-content column-content\"><div class=\"oom-content-wrapper\"><div class=\"oom-content-preview\">${dreamContent}</div></div></td>\n`;
            }
            // Metric values
            for (const metric of Object.values(this.settings.metrics)) {
                if (metric.enabled) {
                    const metricClass = `column-metric-${metric.name.toLowerCase().replace(/\s+/g, '-')}`;
                    const value = entry.metrics[metric.name];
                    content += `<td class=\"metric-value ${metricClass}\" data-metric=\"${metric.name}\">${value !== undefined ? value : ''}</td>\n`;
                }
            }
            content += '</tr>\n';
        }
        content += '</tbody>\n</table>\n';
        content += '</div>\n';
        content += '</div>\n';
        content += '\n<!-- OOM METRICS END -->\n';

        const result = content;
        this.memoizedTableData.set(cacheKey, result);
        return result;
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

    private updateProjectNoteView(currentLogLevel?: LogLevel) {
        console.log('updateProjectNoteView called');
        try {
            const leaves = this.app.workspace.getLeavesOfType('markdown');
            let updated = false;
            leaves.forEach(leaf => {
                const view = leaf.view;
                if (view instanceof MarkdownView && view.file && view.file.path === this.settings.projectNote) {
                    // Remove old .oom-rescrape-container if present
                    const container = view.containerEl;
                    const oldButtonContainer = container.querySelector('.oom-rescrape-container');
                    if (oldButtonContainer) oldButtonContainer.remove();
                    // Update the view's content
                    if (view.getMode() === 'preview') {
                        view.previewMode?.rerender();
                    } else {
                        view.editor?.refresh();
                    }
                    updated = true;
                }
            });
            if (!updated) {
                this.logger.log('UI', 'Project note was not open in any workspace leaf.');
            }
            // Attach event listeners after table render
            setTimeout(() => this.attachProjectNoteEventListeners(), 500);
        } catch (err) {
            this.logger.error('UI', 'Error updating OneiroMetrics Note view', err as Error);
            new Notice('Error updating OneiroMetrics Note view. See console for details.');
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
        const debugBtn = previewEl.querySelector('.oom-debug-attach-listeners');
        if (debugBtn) {
            debugBtn.addEventListener('click', () => {
                new Notice('Manually attaching Show More listeners...');
                this.attachProjectNoteEventListeners();
            });
        }

        // Add date range filter event listener
        const dateRangeFilter = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', () => {
                console.log('[DEBUG] Date range filter changed:', dateRangeFilter.value);
                this.applyFilters(previewEl);
            });
        }

        // Existing show more/less button handlers
        const buttons = previewEl.querySelectorAll('.oom-button--expand');
        buttons.forEach((button) => {
            // Remove any existing click listeners by replacing the node
            const newButton = button.cloneNode(true) as HTMLElement;
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const contentCellId = newButton.getAttribute('data-parent-cell');
                const contentCell = contentCellId ? 
                    previewEl.querySelector(`#${contentCellId}`) as HTMLElement :
                    newButton.closest('.oom-dream-content') as HTMLElement;
                if (!contentCell) return;
                const contentWrapper = contentCell.querySelector('.oom-content-wrapper');
                const previewDiv = contentWrapper?.querySelector('.oom-content-preview') as HTMLElement;
                const fullDiv = contentWrapper?.querySelector('.oom-content-full') as HTMLElement;
                if (!contentWrapper || !previewDiv || !fullDiv) return;
                const isExpanded = newButton.getAttribute('data-expanded') === 'true';
                if (isExpanded) {
                    contentWrapper.classList.remove('expanded');
                    previewDiv.style.display = 'block';
                    fullDiv.style.display = 'none';
                    newButton.querySelector('.oom-button-text')!.textContent = 'Show more';
                    newButton.setAttribute('data-expanded', 'false');
                    newButton.setAttribute('aria-expanded', 'false');
                } else {
                    contentWrapper.classList.add('expanded');
                    previewDiv.style.display = 'none';
                    fullDiv.style.display = 'block';
                    newButton.querySelector('.oom-button-text')!.textContent = 'Show less';
                    newButton.setAttribute('data-expanded', 'true');
                    newButton.setAttribute('aria-expanded', 'true');
                }
            });
            button.parentNode?.replaceChild(newButton, button);
        });

        // Add custom range button event listener
        const customRangeBtn = document.getElementById('oom-custom-range-btn');
        if (customRangeBtn) {
            customRangeBtn.addEventListener('click', () => {
                openCustomRangeModal(this.app);
            });
        }
    }

    private applyFilters(previewEl: HTMLElement) {
        console.log('[DEBUG] main.ts applyFilters called', previewEl);
        const rows = previewEl.querySelectorAll('.oom-dream-row');
        const dateRange = (previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement)?.value || 'all';
        this.logger.log('Filter', `Applying filter: ${dateRange}`, {
            totalRows: rows.length
        });

        let visibleCount = 0;
        let invalidDates = 0;
        let outOfRangeDates = 0;

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

        rows.forEach((rowEl, index) => {
            const row = rowEl as HTMLElement;
            const date = row.getAttribute('data-date');
            if (!date) {
                this.logger.warn('Filter', `Row ${index} has no date attribute`);
                row.classList.remove('oom-row--visible');
                row.style.display = 'none';
                return;
            }

            const dreamDate = this.parseDate(date);
            if (isNaN(dreamDate.getTime())) {
                this.logger.error('Filter', `Invalid date for row ${index}: ${date}`);
                invalidDates++;
                row.classList.remove('oom-row--visible');
                row.style.display = 'none';
                return;
            }

            let isVisible = true;
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
                row.classList.add('oom-row--visible');
                row.style.display = '';
                visibleCount++;
                this.logger.log('Filter', `Row ${index} visible`, {
                    date: dreamDate.toISOString(),
                    title: row.querySelector('.oom-dream-title')?.textContent
                });
            } else {
                row.classList.remove('oom-row--visible');
                row.style.display = 'none';
                outOfRangeDates++;
            }
        });

        // Update filter display with enhanced information
        const filterDisplay = previewEl.querySelector('#oom-time-filter-display');
        if (filterDisplay) {
            const totalEntries = rows.length;
            const hiddenCount = totalEntries - visibleCount;
            const colorClass = visibleCount === totalEntries ? 'oom-filter--all-visible' : visibleCount > 0 ? 'oom-filter--partially-visible' : 'oom-filter--none-visible';
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
            const displayLabel = filterLabels[dateRange] || dateRange;
            filterDisplay.innerHTML = `
                <span class="oom-filter-icon"></span>
                <span class="oom-filter-text ${colorClass}">
                    ${displayLabel} (${visibleCount} entries)
                    ${hiddenCount > 0 ? `<span class="oom-filter-hidden">- ${hiddenCount} hidden</span>` : ''}
                </span>
            `;
            // Set Lucide icon using Obsidian's setIcon utility
            // @ts-ignore
            const { setIcon } = require('obsidian');
            const iconSpan = filterDisplay.querySelector('.oom-filter-icon');
            if (iconSpan && setIcon) setIcon(iconSpan, 'calendar-range');
            filterDisplay.setAttribute('title', `Total Entries: ${totalEntries}\nVisible: ${visibleCount}\nHidden: ${hiddenCount}\nInvalid Dates: ${invalidDates}\nOut of Range: ${outOfRangeDates}\nFilter Type: ${dateRange}\nApplied: ${new Date().toLocaleTimeString()}`);
            filterDisplay.classList.add('oom-filter-display--updated');
            setTimeout(() => filterDisplay.classList.remove('oom-filter-display--updated'), 500);
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

    setLogConfig(level: LogLevel, maxLogSize: number, maxBackups: number) {
        this.logger.configure(level, maxLogSize, maxBackups);
    }

    private announceToScreenReader(message: string) {
        // Create or get the live region
        let liveRegion = document.querySelector('.oom-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.className = 'oom-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(liveRegion);
        }
        
        // Update the message
        liveRegion.textContent = message;
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

    // Method to update ribbon icons based on settings
    updateRibbonIcons() {
        // Remove existing note button if it exists
        const existingNoteButton = document.querySelector('.oom-ribbon-note-button');
        if (existingNoteButton) {
            existingNoteButton.remove();
        }

        // Remove existing scrape button if it exists
        const existingScrapeButton = document.querySelector('.oom-ribbon-scrape-button');
        if (existingScrapeButton) {
            existingScrapeButton.remove();
        }

        // Add scrape button if enabled in settings
        if (this.settings.showScrapeButton) {
            const scrapeIcon = this.addRibbonIcon('wand', 'Dream Scrape Tool', () => {
                new OneiroMetricsModal(this.app, this).open();
            });
            scrapeIcon.addClass('oom-ribbon-scrape-button');
            // Attach right-click handler to open settings
            scrapeIcon.addEventListener('contextmenu', (evt) => {
                evt.preventDefault();
                (this.app as any).setting.open('oneirometrics');
            });
        }

        // Add note button if enabled in settings
        if (this.settings.showNoteButton) {
            const ribbonIcon = this.addRibbonIcon('shell', 'Open Metrics Note', () => {
                this.showMetrics();
            });
            ribbonIcon.addClass('oom-ribbon-note-button');
        }
    }

    private async cleanupOldBackups() {
        if (!this.settings.backupEnabled || !this.settings.backupFolderPath) return;

        try {
            const backupFolder = this.app.vault.getAbstractFileByPath(this.settings.backupFolderPath);
            if (!(backupFolder instanceof TFolder)) {
                this.logger.warn('Backup', 'Backup folder not found');
                return;
            }

            const files = backupFolder.children
                .filter(f => f instanceof TFile && f.path.startsWith(this.settings.backupFolderPath ?? ''))
                .sort((a, b) => {
                    const aFile = a as TFile;
                    const bFile = b as TFile;
                    return bFile.stat.mtime - aFile.stat.mtime;
                });

            if (files.length > (this.settings.logging?.maxBackups ?? 5)) {
                for (let i = (this.settings.logging?.maxBackups ?? 5); i < files.length; i++) {
                    await this.app.vault.delete(files[i]);
                }
            }
        } catch (error) {
            this.logger.error('Backup', 'Error cleaning up old backups', error);
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
        const [_, month, day, year] = longDateMatch;
        const dateObj = new Date(`${month} ${day}, ${year}`);
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

// Persist last-used custom range in localStorage
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

// On plugin load, check for a saved custom range and auto-apply it
const lastRange = loadLastCustomRange();
if (lastRange && lastRange.start && lastRange.end) {
    customDateRange = lastRange;
    // Optionally, auto-apply filter on load
    document.addEventListener('DOMContentLoaded', () => {
        applyCustomDateRangeFilter();
        const btn = document.getElementById('oom-custom-range-btn');
        if (btn) btn.classList.add('active');
    });
}

function openCustomRangeModal(app: App) {
    const favorites = loadFavoriteRanges();
    console.log('[DEBUG] Opening modal with favorites:', favorites);
    new CustomDateRangeModal(app, (start: string, end: string, saveName?: string) => {
        if (start && end) {
            customDateRange = { start, end };
            saveLastCustomRange(customDateRange);
            if (saveName) {
                saveFavoriteRange(saveName, customDateRange);
                new Notice(`Saved favorite: ${saveName}`);
            }
            applyCustomDateRangeFilter();
            const btn = document.getElementById('oom-custom-range-btn');
            if (btn) btn.classList.add('active');
        } else {
            customDateRange = null;
            const btn = document.getElementById('oom-custom-range-btn');
            if (btn) btn.classList.remove('active');
            const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
            if (dropdown) dropdown.dispatchEvent(new Event('change'));
        }
    }, favorites, deleteFavoriteRange).open();
}

function applyCustomDateRangeFilter() {
    if (!customDateRange) return;
    const previewEl = document.querySelector('.oom-metrics-container') as HTMLElement;
    if (!previewEl) return;
    const rows = previewEl.querySelectorAll('.oom-dream-row');
    const startDate = new Date(customDateRange.start);
    const endDate = new Date(customDateRange.end);
    let visibleCount = 0;
    rows.forEach((rowEl) => {
        const row = rowEl as HTMLElement;
        const dateAttr = row.getAttribute('data-date');
        if (!dateAttr) return row.style.display = 'none';
        const rowDate = new Date(dateAttr);
        if (rowDate >= startDate && rowDate <= endDate) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    updateFilterDisplay(visibleCount);
}

function updateFilterDisplay(entryCount: number) {
    const filterDisplay = document.getElementById('oom-time-filter-display');
    if (!filterDisplay) return;
    filterDisplay.innerHTML = '';

    // Add icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'oom-filter-icon';
    iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-calendar-range"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M17 14h-6"/><path d="M13 18H7"/></svg>`;
    filterDisplay.appendChild(iconSpan);

    // Add text
    const textSpan = document.createElement('span');
    textSpan.className = 'oom-filter-text';
    if (customDateRange) {
        textSpan.classList.add('oom-filter--custom-range');
        textSpan.textContent = ` Custom Range: ${customDateRange.start} to ${customDateRange.end} (${entryCount} entries) `;
        // Add clear button
        const clearBtn = document.createElement('span');
        clearBtn.className = 'oom-filter-clear';
        clearBtn.setAttribute('title', 'Clear custom range');
        clearBtn.setAttribute('tabindex', '0');
        clearBtn.setAttribute('role', 'button');
        clearBtn.textContent = '×';
        clearBtn.addEventListener('click', () => {
            customDateRange = null;
            const btn = document.getElementById('oom-custom-range-btn');
            if (btn) btn.classList.remove('active');
            const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
            if (dropdown) dropdown.dispatchEvent(new Event('change'));
        });
        clearBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clearBtn.click();
            }
        });
        textSpan.appendChild(clearBtn);
    } else {
        // Show dropdown label as before
        const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
        const label = dropdown ? dropdown.options[dropdown.selectedIndex].text : 'All Time';
        textSpan.classList.add('oom-filter--all-visible');
        textSpan.textContent = ` ${label} (${entryCount} entries) `;
    }
    filterDisplay.appendChild(textSpan);
} 