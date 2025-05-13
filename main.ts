// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile, ButtonComponent, TFolder } from 'obsidian';
import { DEFAULT_METRICS, DreamMetricData, DreamMetricsSettings } from './types';
import { DreamMetricsSettingTab } from './settings';
import { lucideIconMap } from './settings';
import { TimeFilterView, TIME_FILTER_VIEW_TYPE } from './src/TimeFilterView';
import { CustomDateRangeModal } from './src/CustomDateRangeModal';

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

        // Register event handlers for project note view
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.updateProjectNoteView();
            })
        );

        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                if (file && file.path === this.settings.projectNotePath) {
                    this.updateProjectNoteView();
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
            backupFolderPath: '',
            weekStartDay: 0,
            readableLineLengthOverride: false
        }, await this.loadData());

        // Before accessing or assigning to _persistentExclusions, ensure it is defined
        if (!this.settings._persistentExclusions) this.settings._persistentExclusions = {};
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
                                    let date = '';
                                    // Try YYYY-MM-DD format
                                    let dateMatch = journalLine.match(/\b(\d{4}-\d{2}-\d{2})\b/);
                                    if (dateMatch) {
                                        date = dateMatch[1];
                                        console.log(`[OneiroMetrics] Found date in YYYY-MM-DD format: ${date}`);
                                    } else {
                                        // Try Month Day, YYYY format
                                        const monthDayMatch = journalLine.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}/);
                                        if (monthDayMatch) {
                                            const dateObj = new Date(monthDayMatch[0]);
                                            date = dateObj.toISOString().split('T')[0];
                                            console.log(`[OneiroMetrics] Found date in Month Day format: ${date}`);
                                        } else {
                                            // Try block reference format
                                            const blockRefMatch = journalLine.match(/\^(\d{8})/);
                                            if (blockRefMatch) {
                                                const dateStr = blockRefMatch[1];
                                                date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
                                                console.log(`[OneiroMetrics] Found date in block reference format: ${date}`);
                                            } else {
                                                // Try to extract date from the journal line itself
                                                const anyDateMatch = journalLine.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
                                                if (anyDateMatch) {
                                                    const [_, year, month, day] = anyDateMatch;
                                                    date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                                    console.log(`[OneiroMetrics] Found date in general format: ${date}`);
                                                }
                                            }
                                        }
                                    }
                                    
                                    if (!date) {
                                        console.error(`[OneiroMetrics] Could not extract date from line: ${journalLine}`);
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
            } else {
                new Notice('[DEBUG] No changes to metrics tables.');
                console.log('[OneiroMetrics] No changes detected. Project note left unchanged.');
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

        // Add filter controls
        content += '<div class="oom-filter-controls">\n';
        content += '<div class="oom-date-filter">\n';
        content += '<select id="oom-date-range-filter" class="oom-select">\n';
        content += '<option value="all">All Time</option>\n';
        content += '<option value="week">Last Week</option>\n';
        content += '<option value="month">Last Month</option>\n';
        content += '<option value="year">Last Year</option>\n';
        content += '</select>\n';
        content += '</div>\n';
        content += '</div>\n';

        // Generate summary table
        content += this.generateSummaryTable(metrics);

        // Generate detailed table
        content += '<h2 class="oom-dream-entries-title">Dream Entries</h2>\n';
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
                    <div class="oom-content-preview">${preview}</div>
                    <div class="oom-content-full" style="display: none;">${dreamContent}</div>
                    <button type="button" class="oom-button oom-button--expand" aria-expanded="false" aria-controls="${cellId}" data-expanded="false">
                        <span class="oom-button-text">Show more</span>
                        <span class="visually-hidden"> full dream content</span>
                    </button>
                </td>\n`;
            } else {
                content += `<td class="oom-dream-content"><div class="oom-content-preview">${dreamContent}</div></td>\n`;
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
        console.log('[OneiroMetrics] Table generation complete');
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

        // Try Month Day, YYYY format
        const monthDayMatch = dateStr.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}/);
        if (monthDayMatch) {
            const date = new Date(monthDayMatch[0]);
            if (this.validateDate(date)) {
                this.logger.log('Date', `Parsed Month Day format: ${date.toISOString()}`);
                this.logger.performance('Date', 'parseDate', startTime);
                return date;
            }
        }

        // Try general date format
        const anyDateMatch = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (anyDateMatch) {
            const [_, year, month, day] = anyDateMatch;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (this.validateDate(date)) {
                this.logger.log('Date', `Parsed general format: ${date.toISOString()}`);
                this.logger.performance('Date', 'parseDate', startTime);
                return date;
            }
        }

        // Try ISO string as last resort
        const date = new Date(dateStr);
        if (this.validateDate(date)) {
            this.logger.log('Date', `Parsed ISO string: ${date.toISOString()}`);
            this.logger.performance('Date', 'parseDate', startTime);
            return date;
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
                console.log('[OneiroMetrics] Project note was not open in any workspace leaf.');
            }

            // Attach event listeners for interactive elements
            this.attachProjectNoteEventListeners();

            // Add virtual scrolling to tables
            const tables = this.app.workspace.containerEl.querySelectorAll('.oom-metrics-table');
            tables.forEach(table => this.setupVirtualScrolling(table as HTMLElement));
        } catch (err) {
            new Notice('Error updating OneiroMetrics Note view. See console for details.');
            console.error('[OneiroMetrics] Error in updateProjectNoteView:', err);
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
        const container = this.app.workspace.containerEl;
        const cleanupFunctions: (() => void)[] = [];

        this.logger.log('Events', 'Attaching project note event listeners');
        const previewEl = document.querySelector('.markdown-preview-view[data-type="oom-project-note"]');
        if (!previewEl) {
            this.logger.warn('Events', 'No project note preview element found');
            return;
        }

        // Function to attach event listeners to expand buttons
        const attachExpandButtonListeners = (container: Element) => {
            const expandButtons = container.querySelectorAll('.oom-button--expand');
            this.logger.log('Events', `Found ${expandButtons.length} expand buttons`);
            
            expandButtons.forEach(button => {
                const buttonEl = button as HTMLElement;
                const contentCell = buttonEl.closest('.oom-dream-content') as HTMLElement;
                if (!contentCell) return;

                const previewDiv = contentCell.querySelector('.oom-content-preview') as HTMLElement;
                const fullDiv = contentCell.querySelector('.oom-content-full') as HTMLElement;
                if (!previewDiv || !fullDiv) return;

                // Get unique identifier for this content
                const contentId = this.getContentStateId(contentCell);
                
                // Check if this content was previously expanded
                const wasExpanded = this.expandedStates.has(contentId);
                if (wasExpanded) {
                    previewDiv.style.display = 'none';
                    fullDiv.style.display = 'block';
                    buttonEl.setAttribute('data-expanded', 'true');
                    buttonEl.setAttribute('aria-expanded', 'true');
                    buttonEl.querySelector('.oom-button-text')!.textContent = 'Show less';
                }

                const clickHandler = () => {
                    const isExpanded = buttonEl.getAttribute('data-expanded') === 'true';
                    buttonEl.setAttribute('data-expanded', (!isExpanded).toString());
                    buttonEl.setAttribute('aria-expanded', (!isExpanded).toString());
                    
                    if (isExpanded) {
                        previewDiv.style.display = 'block';
                        fullDiv.style.display = 'none';
                        buttonEl.querySelector('.oom-button-text')!.textContent = 'Show more';
                        this.expandedStates.delete(contentId);
                    } else {
                        previewDiv.style.display = 'none';
                        fullDiv.style.display = 'block';
                        buttonEl.querySelector('.oom-button-text')!.textContent = 'Show less';
                        this.expandedStates.add(contentId);
                    }

                    // Save state after a short delay to prevent too frequent saves
                    this.debounce(() => {
                        this.saveSettings();
                    }, 500)();

                    this.logger.log('UI', `Content ${isExpanded ? 'collapsed' : 'expanded'}`, {
                        contentId,
                        buttonId: buttonEl.id,
                        contentCellId: contentCell.id
                    });
                };

                buttonEl.addEventListener('click', clickHandler);
                cleanupFunctions.push(() => buttonEl.removeEventListener('click', clickHandler));
            });
        };

        // Initial attachment
        attachExpandButtonListeners(previewEl);

        // Re-attach when content changes
        const observer = new MutationObserver(() => {
            this.logger.debug('Events', 'Content changed, reattaching expand button listeners');
            attachExpandButtonListeners(previewEl);
        });

        observer.observe(previewEl, {
            childList: true,
            subtree: true
        });

        cleanupFunctions.push(() => observer.disconnect());

        // Attach event listener for Time Filter button
        const timeFilterBtn = previewEl.querySelector('#oom-time-filter-btn');
        if (timeFilterBtn) {
            const timeFilterHandler = () => {
                this.logger.log('Events', 'Time filter button clicked');
                this.activateView();
            };
            timeFilterBtn.addEventListener('click', timeFilterHandler);
            cleanupFunctions.push(() => timeFilterBtn.removeEventListener('click', timeFilterHandler));
        }

        // Subscribe to time filter changes
        const timeFilterView = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
        if (timeFilterView) {
            const filterManager = timeFilterView.getFilterManager();
            
            // Function to update the table based on the current filter
            const updateTableWithFilter = () => {
                const filterStartTime = performance.now();
                this.logger.log('Filter', 'Updating table with current filter');
                const currentFilter = filterManager.getCurrentFilter();
                const metricFilter = (previewEl.querySelector('#metricFilter') as HTMLSelectElement)?.value || 'all';
                
                if (currentFilter) {
                    const dateRange = currentFilter.getDateRange();
                    this.logger.debug('Filter', 'Filter date range', dateRange);
                    
                    const rows = previewEl.querySelectorAll('.oom-dream-row');
                    let visibleCount = 0;
                    
                    rows.forEach(row => {
                        const date = row.getAttribute('data-date');
                        if (date) {
                            const dreamDate = this.parseDate(date);
                            if (dreamDate && !isNaN(dreamDate.getTime())) {
                                const isInRange = dreamDate >= dateRange.start && dreamDate <= dateRange.end;
                                (row as HTMLElement).style.display = isInRange ? '' : 'none';
                                if (isInRange) visibleCount++;
                                this.logger.debug('Filter', `Row date ${dreamDate.toISOString()} is ${isInRange ? 'in' : 'out of'} range`);
                            } else {
                                this.logger.error('Filter', `Failed to parse date: ${date}`);
                                (row as HTMLElement).style.display = 'none';
                            }
                        }
                    });
                    
                    // Update the filter display
                    const filterDisplay = previewEl.querySelector('#oom-time-filter-display');
                    if (filterDisplay) {
                        filterDisplay.textContent = `${currentFilter.name} (${visibleCount} entries)`;
                    }
                    
                    this.logger.log('Filter', `Table updated with filter: ${currentFilter.name}`, {
                        visibleEntries: visibleCount,
                        totalEntries: rows.length
                    });
                }
                this.logger.performance('Filter', 'updateTableWithFilter', filterStartTime);
            };

            // Create debounced version of updateTableWithFilter
            const debouncedUpdateTable = this.debounce(updateTableWithFilter, 250);

            // Subscribe to filter changes
            const layoutChangeHandler = () => {
                this.logger.debug('Events', 'Layout changed, checking for filter updates');
                const newTimeFilterView = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
                if (newTimeFilterView) {
                    const newFilterManager = newTimeFilterView.getFilterManager();
                    const currentFilter = newFilterManager.getCurrentFilter();
                    if (currentFilter) {
                        this.logger.log('Filter', `New filter detected: ${currentFilter.name}`);
                        debouncedUpdateTable();
                    }
                }
            };

            this.registerEvent(
                this.app.workspace.on('layout-change', layoutChangeHandler)
            );

            // Subscribe to filter manager changes
            const resizeHandler = () => {
                this.logger.debug('Events', 'Workspace resized, updating filter');
                debouncedUpdateTable();
            };

            this.registerEvent(
                this.app.workspace.on('resize', resizeHandler)
            );

            // Subscribe to active leaf changes
            const activeLeafChangeHandler = () => {
                this.logger.debug('Events', 'Active leaf changed, updating filter');
                debouncedUpdateTable();
            };

            this.registerEvent(
                this.app.workspace.on('active-leaf-change', activeLeafChangeHandler)
            );

            // Subscribe to vault changes
            const vaultModifyHandler = () => {
                this.logger.debug('Events', 'File modified, updating filter');
                debouncedUpdateTable();
            };

            this.registerEvent(
                this.app.vault.on('modify', vaultModifyHandler)
            );

            // Initial update (not debounced)
            updateTableWithFilter();
        }

        // Store cleanup functions
        this.cleanupFunctions.push(...cleanupFunctions);

        this.logger.performance('Events', 'attachProjectNoteEventListeners', startTime);

        // Return cleanup function
        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }

    private sortTable(column: string) {
        const table = document.querySelector('.oom-metrics-table');
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('.oom-dream-row'));
        const currentDirection = this.currentSortDirection[column] || 'asc';

        // Sort rows
        rows.sort((a, b) => {
            let aValue: string | number = '';
            let bValue: string | number = '';

            switch (column) {
                case 'date':
                    aValue = a.getAttribute('data-date') || '';
                    bValue = b.getAttribute('data-date') || '';
                    break;
                case 'title':
                    aValue = a.querySelector('.oom-dream-title')?.textContent || '';
                    bValue = b.querySelector('.oom-dream-title')?.textContent || '';
                    break;
                case 'content':
                    aValue = a.querySelector('.oom-dream-content')?.textContent || '';
                    bValue = b.querySelector('.oom-dream-content')?.textContent || '';
                    break;
                default:
                    aValue = a.querySelector(`[data-metric="${column}"]`)?.textContent || '';
                    bValue = b.querySelector(`[data-metric="${column}"]`)?.textContent || '';
            }

            // Handle numeric values
            if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
                aValue = Number(aValue);
                bValue = Number(bValue);
            }

            // Compare values
            if (aValue < bValue) return currentDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return currentDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Update sort direction
        this.currentSortDirection[column] = currentDirection === 'asc' ? 'desc' : 'asc';

        // Reorder rows
        rows.forEach(row => tbody.appendChild(row));

        // Update row numbers
        this.updateRowNumbers();
    }

    private filterTable(dateRange: string, metricFilter: string) {
        console.log('[OneiroMetrics][DEBUG] Filtering table with dateRange:', dateRange, 'metricFilter:', metricFilter);
        const tbody = document.querySelector('.oom-metrics-table tbody');
        if (!tbody) {
            console.log('[OneiroMetrics][DEBUG] No tbody found in table');
            return;
        }

        const rows = Array.from(tbody.querySelectorAll('.oom-dream-row'));
        const timeFilterView = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0]?.view as TimeFilterView;
        const currentFilter = timeFilterView?.getFilterManager().getCurrentFilter();
        const currentRange = currentFilter?.getDateRange();

        rows.forEach(row => {
            const date = row.getAttribute('data-date');
            const title = row.querySelector('.oom-dream-title')?.textContent?.toLowerCase() || '';
            const content = row.querySelector('.oom-dream-content')?.textContent?.toLowerCase() || '';
            const metricCells = row.querySelectorAll('td[data-metric]');
            let showRow = true;

            // Apply time filter
            if (currentRange && date) {
                const dreamDate = new Date(date);
                showRow = dreamDate >= currentRange.start && dreamDate <= currentRange.end;
            }

            // Apply metric filter
            if (metricFilter !== 'all' && showRow) {
                const metricCell = row.querySelector(`td[data-metric="${metricFilter}"]`);
                if (metricCell) {
                    const value = parseFloat(metricCell.textContent || '0');
                    showRow = !isNaN(value) && value > 0;
                } else {
                    showRow = false;
                }
            }

            // Update row visibility
            (row as HTMLElement).style.display = showRow ? '' : 'none';
        });

        // Update row numbers
        this.updateRowNumbers();
        console.log('[OneiroMetrics][DEBUG] Table filtered successfully');
    }

    private updateRowNumbers() {
        const rows = document.querySelectorAll('.oom-dream-row');
        let visibleCount = 0;
        rows.forEach(row => {
            if ((row as HTMLElement).style.display !== 'none') {
                visibleCount++;
                const numberCell = row.querySelector('td:first-child');
                if (numberCell) {
                    numberCell.textContent = visibleCount.toString();
                }
            }
        });
    }

    // Add virtual scrolling implementation
    private setupVirtualScrolling(table: HTMLElement) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rowHeight = 40;
        const visibleRows = Math.ceil(tbody.clientHeight / rowHeight);
        let lastScrollTop = 0;

        const scrollHandler = () => {
            const scrollTop = tbody.scrollTop;
            if (Math.abs(scrollTop - lastScrollTop) > rowHeight) {
                const startIndex = Math.floor(scrollTop / rowHeight);
                const endIndex = Math.min(startIndex + visibleRows + 2, tbody.children.length);
                
                Array.from(tbody.children).forEach((row, index) => {
                    const htmlRow = row as HTMLElement;
                    if (index >= startIndex && index < endIndex) {
                        htmlRow.style.display = '';
                    } else {
                        htmlRow.style.display = 'none';
                    }
                });
                
                lastScrollTop = scrollTop;
            }
        };

        tbody.addEventListener('scroll', scrollHandler);
        
        // Add cleanup function
        this.cleanupFunctions.push(() => {
            tbody.removeEventListener('scroll', scrollHandler);
        });
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

    private setupFilterHandlers() {
        // Date range filter
        const dateRangeFilter = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Title filter
        const titleFilter = document.getElementById('oom-title-filter') as HTMLInputElement;
        if (titleFilter) {
            titleFilter.addEventListener('input', () => {
                this.applyFilters();
            });
        }

        // Content filter
        const contentFilter = document.getElementById('oom-content-filter') as HTMLInputElement;
        if (contentFilter) {
            contentFilter.addEventListener('input', () => {
                this.applyFilters();
            });
        }

        // Sort controls
        const sortControls = document.querySelectorAll('.oom-sort-control');
        sortControls.forEach(control => {
            control.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const column = target.getAttribute('data-column');
                if (column) {
                    this.sortTable(column);
                }
            });
        });
    }

    private applyFilters() {
        const dateRange = (document.getElementById('oom-date-range-filter') as HTMLSelectElement)?.value || 'all';
        const titleFilter = (document.getElementById('oom-title-filter') as HTMLInputElement)?.value.toLowerCase() || '';
        const contentFilter = (document.getElementById('oom-content-filter') as HTMLInputElement)?.value.toLowerCase() || '';

        const rows = document.querySelectorAll('.oom-dream-row');
        rows.forEach(row => {
            const date = row.getAttribute('data-date');
            const title = row.querySelector('.oom-dream-title')?.textContent?.toLowerCase() || '';
            const content = row.querySelector('.oom-dream-content')?.textContent?.toLowerCase() || '';

            let showRow = true;

            // Apply date range filter
            if (dateRange !== 'all' && date) {
                const dreamDate = new Date(date);
                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

                switch (dateRange) {
                    case 'week':
                        showRow = dreamDate >= oneWeekAgo;
                        break;
                    case 'month':
                        showRow = dreamDate >= oneMonthAgo;
                        break;
                    case 'year':
                        showRow = dreamDate >= oneYearAgo;
                        break;
                    default:
                        showRow = true;
                }
            }

            // Apply title filter
            if (showRow && titleFilter) {
                showRow = title.includes(titleFilter);
            }

            // Apply content filter
            if (showRow && contentFilter) {
                showRow = content.includes(contentFilter);
            }

            // Show/hide row
            (row as HTMLElement).style.display = showRow ? '' : 'none';
        });

        // Update row numbers
        this.updateRowNumbers();
    }
} 