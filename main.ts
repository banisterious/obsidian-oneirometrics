// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile, ButtonComponent, TFolder, View, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_METRICS, DreamMetricData, DreamMetricsSettings, LogLevel, DEFAULT_LOGGING } from './types';
import { DreamMetricsSettingTab } from './settings';
import { lucideIconMap } from './settings';
import { TimeFilterView, TIME_FILTER_VIEW_TYPE } from './src/TimeFilterView';
import { CustomDateRangeModal } from './src/CustomDateRangeModal';
import { Logger as LogManager } from './utils/logger';

class Logger {
    private static instance: Logger;
    private categories: Set<string> = new Set([
        'Date',
        'Events',
        'Filter',
        'Metrics',
        'UI',
        'Performance',
        'Error'
    ]);

    private constructor() {}

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(category: string, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
        return `[OneiroMetrics][${category}] ${message}${dataStr}`;
    }

    log(category: string, message: string, data?: any) {
        if (!this.categories.has(category)) {
            console.warn(`[OneiroMetrics] Unknown logging category: ${category}`);
            return;
        }
        console.log(this.formatMessage(category, message, data));
    }

    warn(category: string, message: string, data?: any) {
        if (!this.categories.has(category)) {
            console.warn(`[OneiroMetrics] Unknown logging category: ${category}`);
            return;
        }
        console.warn(this.formatMessage(category, message, data));
    }

    error(category: string, message: string, error?: Error, data?: any) {
        if (!this.categories.has(category)) {
            console.warn(`[OneiroMetrics] Unknown logging category: ${category}`);
            return;
        }
        const errorStr = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
        console.error(this.formatMessage(category, message, data) + errorStr);
    }

    debug(category: string, message: string, data?: any) {
        if (!this.categories.has(category)) {
            console.warn(`[OneiroMetrics] Unknown logging category: ${category}`);
            return;
        }
        console.debug(this.formatMessage(category, message, data));
    }

    performance(category: string, operation: string, startTime: number) {
        const duration = performance.now() - startTime;
        this.log('Performance', `${operation} took ${duration.toFixed(2)}ms`, { category, operation, duration });
    }

    configure(level: LogLevel, maxLogSize?: number, maxBackups?: number) {
        // Implementation of configure method
    }
}

class OneiroMetricsModal extends Modal {
    private plugin: DreamMetricsPlugin;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
    }

    open(): void {
        super.open();
        this.contentEl.empty();
        this.titleEl.setText('OneiroMetrics');
        
        // Add scrape button
        const scrapeButton = this.contentEl.createEl('button', {
            text: 'Scrape Metrics',
            cls: 'mod-cta'
        });
        scrapeButton.addEventListener('click', () => {
            this.plugin.scrapeMetrics();
            this.close();
        });
    }

    close(): void {
        super.close();
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
            cls: 'modal-button-container'
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
    private logger: Logger;
    private expandedStates: Set<string> = new Set();

    // Add memoization for table calculations
    private memoizedTableData = new Map<string, any>();
    private cleanupFunctions: (() => void)[] = [];

    private currentSortDirection: { [key: string]: 'asc' | 'desc' } = {};

    async onload() {
        this.logger = Logger.getInstance();
        await this.loadSettings();
        
        // Load expanded states from settings
        if (this.settings.expandedStates) {
            this.expandedStates = new Set(this.settings.expandedStates);
            this.logger.debug('UI', `Loaded ${this.expandedStates.size} expanded states`);
        }

        // Add settings tab
        this.addSettingTab(new DreamMetricsSettingTab(this.app, this));

        // Add ribbon icon
        this.addRibbonIcon('lucide-shell', 'OneiroMetrics', () => {
            new OneiroMetricsModal(this.app, this).open();
        });

        // Add command to open modal
        this.addCommand({
            id: 'open-oneirometrics-modal',
            name: 'Open OneiroMetrics',
            callback: () => {
                new OneiroMetricsModal(this.app, this).open();
            }
        });

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

                if (file.path === this.settings.projectNotePath) {
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

        // Register the time filter view
        this.registerView(
            TIME_FILTER_VIEW_TYPE,
            (leaf) => new TimeFilterView(leaf)
        );

        // Add ribbon icon for time filter
        this.addRibbonIcon('calendar', 'Time Filter', () => {
            this.activateView();
        });

        // Add command to open time filter
        this.addCommand({
            id: 'open-time-filter',
            name: 'Open Time Filter',
            callback: () => {
                this.activateView();
            }
        });

        // Register time filter commands
        this.addCommand({
            id: 'set-today-filter',
            name: 'Set filter to Today',
            callback: () => {
                const view = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
                if (view) {
                    view.getFilterManager().setFilter('today');
                }
            }
        });

        this.addCommand({
            id: 'set-yesterday-filter',
            name: 'Set filter to Yesterday',
            callback: () => {
                const view = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
                if (view) {
                    view.getFilterManager().setFilter('yesterday');
                }
            }
        });

        this.addCommand({
            id: 'set-this-week-filter',
            name: 'Set filter to This Week',
            callback: () => {
                const view = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
                if (view) {
                    view.getFilterManager().setFilter('thisWeek');
                }
            }
        });

        this.addCommand({
            id: 'set-last-week-filter',
            name: 'Set filter to Last Week',
            callback: () => {
                const view = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
                if (view) {
                    view.getFilterManager().setFilter('lastWeek');
                }
            }
        });

        this.addCommand({
            id: 'set-this-month-filter',
            name: 'Set filter to This Month',
            callback: () => {
                const view = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
                if (view) {
                    view.getFilterManager().setFilter('thisMonth');
                }
            }
        });

        this.addCommand({
            id: 'set-last-month-filter',
            name: 'Set filter to Last Month',
            callback: () => {
                const view = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
                if (view) {
                    view.getFilterManager().setFilter('lastMonth');
                }
            }
        });

        this.addCommand({
            id: 'open-custom-date-range',
            name: 'Open Custom Date Range',
            callback: () => {
                const view = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
                if (view) {
                    new CustomDateRangeModal(this.app, (start, end) => {
                        const filter = view.getFilterManager().addCustomFilter(start, end);
                        view.getFilterManager().setFilter(filter.id);
                    }).open();
                }
            }
        });

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
        this.settings = Object.assign({}, {
            projectNotePath: 'Journals/Dream Diary/Metrics/Metrics.md',
            metrics: [...DEFAULT_METRICS],
            selectedNotes: [],
            calloutName: 'dream-metrics',
            backupEnabled: true,
            backupFolderPath: 'Meta/Backups/OOM',
            weekStartDay: 0,
            readableLineLengthOverride: false,
            logging: { ...DEFAULT_LOGGING }  // Initialize logging with default values
        }, await this.loadData());

        // Before accessing or assigning to _persistentExclusions, ensure it is defined
        if (!this.settings._persistentExclusions) this.settings._persistentExclusions = {};
        
        // Ensure logging settings are properly initialized
        if (!this.settings.logging) {
            this.settings.logging = { ...DEFAULT_LOGGING };
        }
    }

    async saveSettings() {
        // Save expanded states to settings
        this.settings.expandedStates = Array.from(this.expandedStates);
        await this.saveData(this.settings);
        this.logger.debug('UI', `Saved ${this.expandedStates.size} expanded states`);
    }

    async scrapeMetrics() {
        console.log('[OneiroMetrics] Starting metrics scrape...');
        // Show progress modal with detailed status
        const progressModal = new Modal(this.app);
        progressModal.titleEl.setText('Scraping Dream Metrics...');
        const progressContent = progressModal.contentEl.createEl('div', { cls: 'oom-progress-content' });
        const statusText = progressContent.createEl('div', { cls: 'oom-status-text' });
        const progressBar = progressContent.createEl('div', { cls: 'oom-progress-bar' });
        progressBar.style.height = '8px';
        progressBar.style.background = '#eee';
        progressBar.style.borderRadius = '4px';
        progressBar.style.margin = '1em 0';
        const progressFill = progressBar.createEl('div');
        progressFill.style.height = '100%';
        progressFill.style.background = 'var(--interactive-accent, #2563eb)';
        progressFill.style.width = '0%';
        progressFill.style.borderRadius = '4px';
        const detailsText = progressContent.createEl('div', { cls: 'oom-details-text' });
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
        new Notice('Metrics scraped successfully!');

        // After scraping, clear exclusion list
        const pluginAny = this as any;
        if (pluginAny._excludedFilesForNextScrape) pluginAny._excludedFilesForNextScrape = [];
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
        
        for (const pair of metricPairs) {
            const [name, value] = pair.split(':').map(s => s.trim());
            if (name && value !== '—' && !isNaN(Number(value))) {
                if (!metrics[name]) {
                    metrics[name] = [];
                }
                const numValue = Number(value);
                metrics[name].push(numValue);
                dreamMetrics[name] = numValue;
            }
        }
        
        return dreamMetrics;
    }

    private async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]) {
        console.log('[OneiroMetrics][DEBUG] updateProjectNote called for:', this.settings.projectNotePath);
        const projectFile = this.app.vault.getAbstractFileByPath(this.settings.projectNotePath);
        new Notice(`[DEBUG] updateProjectNote called for: ${this.settings.projectNotePath}`);
        console.log('[OneiroMetrics] updateProjectNote called for:', this.settings.projectNotePath);
        if (!(projectFile instanceof TFile)) {
            console.log('[OneiroMetrics][DEBUG] Early return: projectFile is not a TFile');
            new Notice(`[DEBUG] Project note not found: ${this.settings.projectNotePath}`);
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
                    if (leaf.view instanceof MarkdownView && leaf.view.file && leaf.view.file.path === this.settings.projectNotePath) {
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
                    .filter(f => f.path.startsWith(this.settings.backupFolderPath) && 
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
                cls: 'modal-button-container'
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
        content += '<div class="oom-table-title oom-stats-title">Statistics</div>';
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
            ...this.settings.metrics.map(m => m.name)
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
                const metric = this.settings.metrics.find(m => m.name === name);
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
        console.log(`[OneiroMetrics] Generating table with ${dreamEntries.length} entries`);
        let content = '';
        const cacheKey = JSON.stringify({ metrics, dreamEntries });
        
        if (this.memoizedTableData.has(cacheKey)) {
            console.log('[OneiroMetrics] Using cached table data');
            return this.memoizedTableData.get(cacheKey);
        }

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
        content += '<option value="week">Last Week</option>\n';
        content += '<option value="month">Last Month</option>\n';
        content += '<option value="year">Last Year</option>\n';
        content += '</select>\n';
        content += '<button id="oom-time-filter-btn" class="oom-button">Time Filters</button>\n';
        content += '</div>\n';
        content += '<div id="oom-time-filter-display" class="oom-filter-display"></div>\n';
        content += '</div>\n';

        content += '<div class="oom-table-section">\n';
        content += '<table class="oom-table">\n';
        content += '<thead>\n<tr>\n';
        content += '<th>Date</th>\n';
        content += '<th>Dream Title</th>\n';
        content += '<th>Words</th>\n';
        content += '<th>Content</th>\n';
        
        // Add metric columns
        for (const metric of this.settings.metrics) {
            content += `<th>${metric.name}</th>\n`;
        }
        
        content += '</tr>\n</thead>\n<tbody>\n';

        // Sort entries by date
        dreamEntries.sort((a, b) => {
            const dateA = this.parseDate(a.date);
            const dateB = this.parseDate(b.date);
            return dateA.getTime() - dateB.getTime();
        });

        for (const entry of dreamEntries) {
            content += `<tr class="oom-dream-row" data-date="${entry.date}">\n`;
            
            // Format date
            let formattedDate = 'Invalid Date';
            try {
                const parsedDate = this.parseDate(entry.date);
                if (!isNaN(parsedDate.getTime())) {
                    formattedDate = parsedDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            } catch (e) {
                console.error(`[OneiroMetrics] Error formatting date ${entry.date}:`, e);
            }
            content += `<td>${formattedDate}</td>\n`;
            
            // Create note link with block reference
            const noteLink = entry.source.file.replace(/\.md$/, '');
            const blockRef = entry.source.id ? `#^${entry.source.id}` : '';
            const fullLink = `${noteLink}${blockRef}`;
            content += `<td class="oom-dream-title"><a href="${fullLink}" data-href="${fullLink}" class="internal-link" data-link-type="block" data-link-path="${noteLink}" data-link-hash="${blockRef}" title="${entry.title}">${entry.title}</a></td>\n`;
            content += `<td class="metric-value">${entry.metrics['Words'] || 0}</td>\n`;

            // Process dream content for display
            let dreamContent = this.processDreamContent(entry.content);
            if (!dreamContent || !dreamContent.trim()) {
                dreamContent = '';
            }

            if (dreamContent.length > 200) {
                const preview = dreamContent.substring(0, 200) + '...';
                const cellId = `oom-content-${entry.date}-${entry.title.replace(/[^a-zA-Z0-9]/g, '')}`;
                content += `<td class="oom-dream-content" id="${cellId}">
                    <div class="oom-content-wrapper">
                        <div class="oom-content-preview">${preview}</div>
                        <div class="oom-content-full">${dreamContent}</div>
                        <button type="button" class="oom-button oom-button--expand oom-button--state-default" 
                                aria-expanded="false" 
                                aria-controls="${cellId}" 
                                data-expanded="false"
                                data-content-id="${cellId}"
                                data-parent-cell="${cellId}">
                            <span class="oom-button-text">Show more</span>
                            <span class="oom-button-icon">▼</span>
                            <span class="visually-hidden"> full dream content</span>
                        </button>
                    </div>
                </td>\n`;
            } else {
                content += `<td class="oom-dream-content"><div class="oom-content-wrapper"><div class="oom-content-preview">${dreamContent}</div></div></td>\n`;
            }

            // Add metric values
            for (const name of this.settings.metrics.map(m => m.name)) {
                content += `<td class="metric-value" data-metric="${name}">${entry.metrics[name] || ''}</td>\n`;
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
        this.logger.debug('Date', `Processing date: ${dateStr}`);
        
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
                this.logger.performance('Date', 'parseDate', startTime);
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
                this.logger.performance('Date', 'parseDate', startTime);
                return date;
            }
        }

        // Try journal entry format (e.g., "Monday, January 6, 2024")
        const journalEntryMatch = dateStr.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}/);
        if (journalEntryMatch) {
            const dateObj = new Date(journalEntryMatch[0]);
            if (!isNaN(dateObj.getTime())) {
                this.logger.log('Date', `Parsed journal entry format: ${dateObj.toISOString()}`);
                this.logger.performance('Date', 'parseDate', startTime);
                return dateObj;
            }
        }

        // If all parsing attempts fail, log error and return current date
        this.logger.error('Date', `Failed to parse date: ${dateStr}`, new Error('Date parsing failed'));
        this.logger.performance('Date', 'parseDate', startTime);
        return new Date();
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    private updateProjectNoteView() {
        try {
            const leaves = this.app.workspace.getLeavesOfType('markdown');
            let updated = false;
            leaves.forEach(leaf => {
                const view = leaf.view;
                if (view instanceof MarkdownView && view.file && view.file.path === this.settings.projectNotePath) {
                    // Add rescraping button at the top of the note
                    const container = view.containerEl;
                    const existingButton = container.querySelector('.oom-rescrape-button');
                    if (!existingButton) {
                        const buttonContainer = container.createDiv('oom-rescrape-container');
                        const rescrapeButton = buttonContainer.createEl('button', {
                            text: 'Rescrape Metrics',
                            cls: 'mod-cta oom-rescrape-button'
                        });
                        rescrapeButton.addEventListener('click', () => {
                            this.scrapeMetrics();
                        });

                        // Only show debug button in development mode
                        if (process.env.NODE_ENV === 'development') {
                            const debugButton = buttonContainer.createEl('button', {
                                text: 'Debug: Attach Show More Listeners',
                                cls: 'mod-warning oom-debug-attach-listeners'
                            });
                            debugButton.addEventListener('click', () => {
                                new Notice('Manually attaching Show More listeners...');
                                this.attachProjectNoteEventListeners();
                            });
                        }
                    }
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
                this.logger.debug('UI', 'Project note was not open in any workspace leaf.');
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
        const startTime = performance.now();
        const cleanupFunctions: (() => void)[] = [];
        let isAttaching = false;
        let attachmentTimeout: NodeJS.Timeout | null = null;
        
        // Function to attach event listeners to expand buttons
        const attachExpandButtonListeners = () => {
            if (isAttaching) return;
            isAttaching = true;

            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (!view || view.getMode() !== 'preview') {
                isAttaching = false;
                return;
            }

            const previewEl = view.previewMode?.containerEl;
            if (!previewEl) {
                isAttaching = false;
                return;
            }

            const buttons = previewEl.querySelectorAll('.oom-button--expand');
            if (buttons.length === 0) {
                isAttaching = false;
                return;
            }

            this.logger.debug('Events', 'Attaching listeners', {
                buttonsFound: buttons.length,
                timestamp: new Date().toISOString()
            });

            buttons.forEach((button, index) => {
                try {
                    const buttonEl = button as HTMLElement;
                    const contentCellId = buttonEl.getAttribute('data-parent-cell');
                    const contentCell = contentCellId ? 
                        previewEl.querySelector(`#${contentCellId}`) as HTMLElement :
                        buttonEl.closest('.oom-dream-content') as HTMLElement;
                    
                    if (!contentCell) {
                        this.logger.warn('Events', `No content cell found for button ${index + 1}`);
                        return;
                    }

                    const contentWrapper = contentCell.querySelector('.oom-content-wrapper');
                    if (!contentWrapper) {
                        this.logger.warn('Events', `No content wrapper found for button ${index + 1}`);
                        return;
                    }

                    const previewDiv = contentWrapper.querySelector('.oom-content-preview') as HTMLElement;
                    const fullDiv = contentWrapper.querySelector('.oom-content-full') as HTMLElement;
                    
                    if (!previewDiv || !fullDiv) {
                        this.logger.warn('Events', `Missing content divs for button ${index + 1}`);
                        return;
                    }

                    // Get unique identifier for this content
                    const contentId = contentCell.id || this.getContentStateId(contentCell);
                    const title = contentCell.closest('.oom-dream-row')?.querySelector('.oom-dream-title')?.textContent;
                    const rowDate = contentCell.closest('.oom-dream-row')?.getAttribute('data-date');

                    // Set up ARIA attributes
                    buttonEl.setAttribute('role', 'button');
                    buttonEl.setAttribute('aria-label', `Toggle dream content for ${title} on ${rowDate}`);
                    buttonEl.setAttribute('aria-controls', contentId);
                    buttonEl.setAttribute('tabindex', '0');
                    buttonEl.setAttribute('data-parent-cell', contentId);

                    // Ensure expanded state is properly set
                    const wasExpanded = this.expandedStates.has(contentId);
                    if (wasExpanded) {
                        contentCell.classList.add('expanded');
                        buttonEl.setAttribute('data-expanded', 'true');
                        buttonEl.setAttribute('aria-expanded', 'true');
                        buttonEl.querySelector('.oom-button-text')!.textContent = 'Show less';
                        buttonEl.classList.add('oom-button--state-expanded');
                        previewDiv.style.display = 'none';
                        fullDiv.style.display = 'block';
                    } else {
                        contentCell.classList.remove('expanded');
                        buttonEl.setAttribute('data-expanded', 'false');
                        buttonEl.setAttribute('aria-expanded', 'false');
                        buttonEl.querySelector('.oom-button-text')!.textContent = 'Show more';
                        buttonEl.classList.add('oom-button--state-default');
                        previewDiv.style.display = 'block';
                        fullDiv.style.display = 'none';
                    }

                    // Add keyboard support
                    const handleKeyPress = (e: KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            buttonEl.click();
                        }
                    };

                    const clickHandler = () => {
                        const isExpanded = buttonEl.getAttribute('data-expanded') === 'true';
                        
                        // Update ARIA attributes
                        buttonEl.setAttribute('data-expanded', (!isExpanded).toString());
                        buttonEl.setAttribute('aria-expanded', (!isExpanded).toString());
                        
                        // Update button state classes
                        buttonEl.classList.remove('oom-button--state-default', 'oom-button--state-expanded', 'oom-button--state-collapsed');
                        buttonEl.classList.add(isExpanded ? 'oom-button--state-collapsed' : 'oom-button--state-expanded');
                        
                        // Update button icon
                        const icon = buttonEl.querySelector('.oom-button-icon');
                        if (icon) {
                            icon.textContent = isExpanded ? '▼' : '▲';
                        }
                        
                        // Add click animation
                        buttonEl.classList.add('oom-button--clicked');
                        setTimeout(() => buttonEl.classList.remove('oom-button--clicked'), 200);

                        // Update content visibility immediately
                        if (isExpanded) {
                            // Collapse content
                            contentCell.classList.remove('expanded');
                            previewDiv.style.display = 'block';
                            fullDiv.style.display = 'none';
                            buttonEl.querySelector('.oom-button-text')!.textContent = 'Show more';
                            this.expandedStates.delete(contentId);
                            this.announceToScreenReader(`Collapsed dream content for ${title}`);
                        } else {
                            // Expand content
                            contentCell.classList.add('expanded');
                            previewDiv.style.display = 'none';
                            fullDiv.style.display = 'block';
                            buttonEl.querySelector('.oom-button-text')!.textContent = 'Show less';
                            this.expandedStates.add(contentId);
                            this.announceToScreenReader(`Expanded dream content for ${title}`);
                        }

                        // Save state immediately
                        this.saveSettings();
                    };

                    // Remove any existing listeners
                    const newButton = buttonEl.cloneNode(true) as HTMLElement;
                    Array.from(buttonEl.attributes).forEach(attr => {
                        newButton.setAttribute(attr.name, attr.value);
                    });

                    // Add event listeners to the new button
                    newButton.addEventListener('click', clickHandler);
                    newButton.addEventListener('keydown', handleKeyPress);

                    // Replace the old button with the new one
                    buttonEl.parentNode?.replaceChild(newButton, buttonEl);
                } catch (error) {
                    this.logger.error('Events', `Error processing button ${index + 1}`, error as Error);
                }
            });

            isAttaching = false;
        };

        // Debounced version of attachExpandButtonListeners
        const debouncedAttach = this.debounce(attachExpandButtonListeners, 250);

        // Initial attachment
        debouncedAttach();

        // Re-attach when content changes, but only if we're not already attaching
        const observer = new MutationObserver(() => {
            if (!isAttaching) {
                debouncedAttach();
            }
        });

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view?.previewMode?.containerEl) {
            observer.observe(view.previewMode.containerEl, {
                childList: true,
                subtree: true
            });

            cleanupFunctions.push(() => {
                observer.disconnect();
            });
        }

        // Store cleanup functions
        this.cleanupFunctions.push(...cleanupFunctions);
    }

    private applyFilters(previewEl: HTMLElement) {
        const rows = previewEl.querySelectorAll('.oom-dream-row');
        const dateRange = (previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement)?.value || 'all';
        this.logger.debug('Filter', `Applying filter: ${dateRange}`, {
            totalRows: rows.length
        });

        let visibleCount = 0;
        let invalidDates = 0;
        let outOfRangeDates = 0;

        const now = new Date();
        const ranges = {
            week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        };

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
            if (dateRange !== 'all') {
                const rangeStart = ranges[dateRange as keyof typeof ranges];
                isVisible = dreamDate >= rangeStart && dreamDate <= now;
                if (!isVisible) outOfRangeDates++;
            }

            if (isVisible) {
                row.classList.add('oom-row--visible');
                row.style.display = '';
                visibleCount++;
                this.logger.debug('Filter', `Row ${index} visible`, {
                    date: dreamDate.toISOString(),
                    title: row.querySelector('.oom-dream-title')?.textContent
                });
            } else {
                row.classList.remove('oom-row--visible');
                row.style.display = 'none';
            }
        });

        // Update filter display with enhanced information
        const filterDisplay = previewEl.querySelector('#oom-time-filter-display');
        if (filterDisplay) {
            const totalEntries = rows.length;
            const hiddenCount = totalEntries - visibleCount;
            
            // Get icon based on filter type
            const getFilterIcon = (type: string) => {
                switch (type) {
                    case 'all': return '📅';
                    case 'week': return '📆';
                    case 'month': return '📊';
                    case 'year': return '📈';
                    default: return '🔍';
                }
            };

            // Get color class based on filter state
            const getColorClass = (visible: number, total: number) => {
                const ratio = visible / total;
                if (ratio === 1) return 'oom-filter--all-visible';
                if (ratio > 0.5) return 'oom-filter--mostly-visible';
                if (ratio > 0) return 'oom-filter--partially-visible';
                return 'oom-filter--none-visible';
            };

            const icon = getFilterIcon(dateRange);
            const colorClass = getColorClass(visibleCount, totalEntries);
            
            // Create detailed tooltip content
            const tooltipContent = `
                Total Entries: ${totalEntries}
                Visible: ${visibleCount}
                Hidden: ${hiddenCount}
                Invalid Dates: ${invalidDates}
                Out of Range: ${outOfRangeDates}
                Filter Type: ${dateRange}
                Applied: ${new Date().toLocaleTimeString()}
            `.trim();

            // Update display with enhanced content
            filterDisplay.innerHTML = `
                <span class="oom-filter-icon">${icon}</span>
                <span class="oom-filter-text ${colorClass}">
                    ${dateRange === 'all' ? 'All Time' : dateRange} (${visibleCount} entries)
                    ${hiddenCount > 0 ? `<span class="oom-filter-hidden">- ${hiddenCount} hidden</span>` : ''}
                </span>
            `;
            
            // Add tooltip
            filterDisplay.setAttribute('title', tooltipContent);
            filterDisplay.classList.add('oom-filter-display--updated');
            setTimeout(() => filterDisplay.classList.remove('oom-filter-display--updated'), 500);
        }
    }

    async activateView() {
        const { workspace } = this.app;
        
        let leaf = workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0];
        
        if (!leaf) {
            const newLeaf = workspace.getRightLeaf(false);
            if (newLeaf) {
                await newLeaf.setViewState({
                    type: TIME_FILTER_VIEW_TYPE,
                    active: true,
                });
                leaf = newLeaf;
            }
        }
        
        if (leaf) {
            workspace.revealLeaf(leaf);
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
        this.logger.configure(level);
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