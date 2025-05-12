// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile, ButtonComponent, TFolder } from 'obsidian';
import { DEFAULT_METRICS, DreamMetricData, DreamMetricsSettings } from './types';
import { DreamMetricsSettingTab } from './settings';
import { lucideIconMap } from './settings';

export default class DreamMetricsPlugin extends Plugin {
    settings: DreamMetricsSettings;

    async onload() {
        await this.loadSettings();

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
    }

    onunload() {
        // Clean up if needed
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
        await this.saveData(this.settings);
    }

    async scrapeMetrics() {
        console.log('[OneiroMetrics][DEBUG] scrapeMetrics called - VERSION DEBUG-LOG-1');
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
                    let currentJournal: any = null;
                    let currentDiary: any = null;
                    let currentMetrics: any = null;
                    let blockLevel = 0;
                    let blockStack: any[] = [];
                    let currentBlock: any = null;
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
                        // Debug log for each line
                        console.log('[OneiroMetrics][DEBUG] Line:', { idx, line, level, calloutType, blockStack: JSON.stringify(blockStack) });
                    }
                    // --- END IMPROVED STACK LOGIC ---
                    // Now extract data from the parsed structure
                    if (currentJournal && currentJournal.diaries.length > 0) {
                        foundAnyJournalEntries = true;
                        for (const diary of currentJournal.diaries) {
                            for (const metricsBlock of diary.metrics) {
                                // Extract metrics text
                                const metricsText = metricsBlock.lines.map((l: string) => l.replace(/^>+\s*/, '')).join(' ').replace(/\s+/g, ' ').trim();
                                // Extract dream content (all lines in diary except metrics blocks)
                                const diaryContentLines = diary.lines.filter((l: string) => !/^>+\s*\[!dream-diary/i.test(l) && !/^>+\s*\[!dream-metrics/i.test(l));
                                let dreamContent = diaryContentLines.map((l: string) => l.replace(/^>+\s*/, '').trim()).join(' ').replace(/\s+/g, ' ').trim();
                                console.log('[OneiroMetrics][DEBUG] dreamContent after filtering:', dreamContent.slice(0, 200));
                                // Extract date and title from the journal and diary callout lines
                                const journalLine = currentJournal.lines[0];
                                const diaryLine = diary.lines[0];
                                
                                // Try to extract date in YYYY-MM-DD format first
                                let dateMatch = journalLine.match(/\b(\d{4}-\d{2}-\d{2})\b/);
                                let date = dateMatch ? dateMatch[1] : '';
                                
                                // If no YYYY-MM-DD format found, try Month Day, YYYY format
                                if (!date) {
                                    const monthDayMatch = journalLine.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/);
                                    if (monthDayMatch) {
                                        const dateObj = new Date(monthDayMatch[0]);
                                        date = dateObj.toISOString().split('T')[0];
                                    }
                                }
                                
                                // If still no date found, try to extract from the block reference
                                if (!date) {
                                    const blockRefMatch = journalLine.match(/\^(\d{8})/);
                                    if (blockRefMatch) {
                                        const dateStr = blockRefMatch[1];
                                        date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
                                    }
                                }
                                
                                const titleMatch = diaryLine.match(/\] (.*?) \[\[/);
                                const title = titleMatch ? titleMatch[1].trim() : '';
                                // Parse metrics
                                const dreamMetrics = this.processMetrics(metricsText, metrics);
                                dreamMetrics['Words'] = dreamContent.split(/\s+/).length;
                                if (!metrics['Words']) {
                                    metrics['Words'] = [];
                                }
                                metrics['Words'].push(dreamMetrics['Words']);
                                // Add dream entry
                                foundAnyMetrics = true;
                                console.log('[OneiroMetrics][DEBUG] foundAnyMetrics set to true');
                                dreamEntries.push({
                                    date,
                                    title,
                                    content: dreamContent,
                                    source: {
                                        file: path,
                                        id: '' // Could extract block ref if needed
                                    },
                                    metrics: dreamMetrics,
                                    calloutMetadata: [] // Could extract if needed
                                });
                                entriesProcessed++;
                                console.log(`[OneiroMetrics] Extracted dream entry: ${date} - ${title}`);
                                console.log(`[OneiroMetrics][DEBUG] Extracted dream entry:`, { date, title, metrics: dreamMetrics, content: dreamContent.slice(0, 100), source: path });
                            }
                        }
                    }
                    // After the blockStack/line-walking loop, before extracting dream entries:
                    console.log('[OneiroMetrics][DEBUG] Parsed callout structure for file:', path, JSON.stringify({ currentJournal, blockStack }, null, 2));
                } catch (error) {
                    console.error(`[OneiroMetrics] Error processing file ${path}:`, error);
                    new Notice(`Error processing file: ${path}`);
                }
            });

            // Wait for batch to complete
            await Promise.all(batchPromises);
        }

        // Final validation
        if (validNotes === 0) {
            console.log('[OneiroMetrics][DEBUG] scrapeMetrics early return: validNotes === 0');
            new Notice('No valid notes found. Please check your selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyJournalEntries) {
            console.log('[OneiroMetrics][DEBUG] scrapeMetrics early return: !foundAnyJournalEntries');
            new Notice('No journal entries found in selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyMetrics) {
            console.log('[OneiroMetrics][DEBUG] scrapeMetrics early return: !foundAnyMetrics');
            new Notice('No dream metrics callouts found in selected notes.');
            progressModal.close();
            return;
        }
        if (entriesProcessed === 0) {
            console.log('[OneiroMetrics][DEBUG] scrapeMetrics early return: entriesProcessed === 0');
            new Notice('No metrics data found in selected notes.');
            progressModal.close();
            return;
        }

        // Sort and update
        dreamEntries.sort((a, b) => a.date.localeCompare(b.date));
        // After processing all files and before calling updateProjectNote:
        console.log('[OneiroMetrics][DEBUG] scrapeMetrics: dreamEntries.length =', dreamEntries.length);
        console.log('[OneiroMetrics][DEBUG] scrapeMetrics: dreamEntries =', JSON.stringify(dreamEntries, null, 2));
        if (dreamEntries.length === 0) {
            new Notice('[DEBUG] No dream entries found. updateProjectNote will not be called.');
            console.log('[OneiroMetrics][DEBUG] No dream entries found. updateProjectNote will not be called. Metrics object:', metrics);
        } else {
            console.log('[OneiroMetrics][DEBUG] scrapeMetrics: About to call updateProjectNote with', dreamEntries.length, 'entries');
            this.updateProjectNote(metrics, dreamEntries);
        }
        progressModal.close();
        new Notice('Metrics scraped successfully!');

        // After scraping, clear exclusion list
        const pluginAny = this as any;
        if (pluginAny._excludedFilesForNextScrape) pluginAny._excludedFilesForNextScrape = [];
    }

    private processDreamContent(dreamDiary: string): string {
        // First, extract the content between dream-diary and dream-metrics callouts
        const diaryMatch = dreamDiary.match(/> \[!dream-diary\].*?\[\[.*?\]\]\n([\s\S]*?)(?=\n> \[!dream-metrics\]|$)/);
        if (!diaryMatch) {
            return '';
        }
        let content = diaryMatch[1];

        // After extracting content, before further cleaning, strip [!dream-metrics] callouts and their content
        content = content.replace(/\[!dream-metrics\][^\n]*((\n[^\n]*)*)/g, '').replace(/>\s*\[!dream-metrics\][^\n]*((\n[^\n]*)*)/g, '');

        // Improved logic: preserve paragraph breaks
        content = content
            .split('\n')
            .map(line => {
                // If the line is only blockquote markers (with or without spaces), treat as paragraph break
                if (/^([> ]+)$/.test(line.trim())) return '';
                // Remove all leading blockquote markers (with or without spaces)
                const stripped = line.replace(/^([> ]+)/, '').trim();
                if (stripped === '') return '';
                const filtered = stripped
                    .split(' ')
                    .filter(word =>
                        !(
                            word.match(/\.(?:png|jpg|jpeg|gif)(?:\|\d+)?$/i) ||
                            word.match(/(?:banister|anister)-journals-\d{8}-.*?(?:\|\d+)?/) ||
                            word.match(/^!.*?\|/) ||
                            word.match(/\[\[.*?\]\]/) ||
                            word.match(/\[!.*?\|.*?\]/)
                        )
                    )
                    .join(' ')
                    .replace(/\s+/g, ' ');
                return filtered;
            })
            .join('\n')
            .replace(/([^\n])\n([^\n])/g, '$1\n\n$2') // Ensure a blank line between paragraphs
            .replace(/^\n+|\n+$/g, ''); // Trim leading/trailing newlines

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

    private generateMetricsTable(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): string {
        let content = '';
        // Add explicit markers for section replacement
        content += '\n<!-- OOM METRICS START -->\n';
        
        // Metrics Section
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

        // Dream Entries Section
        content += '<div class="oom-table-section">';
        content += '<div class="oom-table-title">Dream Entries</div>';
        // Update Metrics Button
        content += `<div class="oom-update-metrics-row">
            <button id="oom-update-metrics-btn" class="oom-update-metrics-btn">Update Metrics</button>
            <span class="oom-update-metrics-desc">Re-scrape all selected notes or folder</span>
        </div>`;
        // Readable Line Length Toggle Widget
        content += `<div class="oom-line-length-toggle">
            <label class="oom-line-length-label">
                <input type="checkbox" id="oom-line-length-toggle" ${this.settings.readableLineLengthOverride ? 'checked' : ''} />
                Override Readable Line Length for this table
            </label>
            <span class="oom-line-length-desc">When enabled, this table will use the full width of the editor, ignoring Obsidian's readable line width setting.</span>
        </div>`;
        
        // Filter Controls
        content += '<div class="oom-filter-controls">\n';
        content += '<div class="oom-date-filter">\n';
        content += '<label for="dateRange">Date Range:</label>\n';
        content += '<select id="dateRange" class="oom-select">\n';
        content += '<option value="all">All Time</option>\n';
        content += '<option value="month">Last Month</option>\n';
        content += '<option value="week">Last Week</option>\n';
        content += '<option value="thisweek">This Week</option>\n';
        content += '</select>\n';
        content += '</div>\n';
        content += '<div class="oom-metric-filter">\n';
        content += '<label for="metricFilter">Filter by Metric:</label>\n';
        content += '<select id="metricFilter" class="oom-select">\n';
        content += '<option value="all">All Metrics</option>\n';
        for (const metric of this.settings.metrics) {
            const label = metric.icon && lucideIconMap[metric.icon]
                ? `<span class="oom-metric-icon-svg oom-metric-icon--start">${lucideIconMap[metric.icon]}</span> ${metric.name}`
                : metric.name;
            content += `<option value="${metric.name}">${label}</option>\n`;
        }
        content += '</select>\n';
        content += '</div>\n';
        content += '</div>\n';
        
        // Detailed Entries Table
        content += '<div class="oom-table-container">\n';
        content += '<table class="oom-table oom-sortable">\n';
        content += '<thead>\n';
        content += '<tr>\n';
        content += '<th class="oom-sortable" data-sort="date">Date <span class="oom-sort-icon">↕</span></th>\n';
        content += '<th class="oom-sortable" data-sort="title">Dream Title <span class="oom-sort-icon">↕</span></th>\n';
        content += '<th class="oom-sortable metric-value" data-sort="words">Words <span class="oom-sort-icon">↕</span></th>\n';
        content += '<th>Content</th>\n';
        for (const metric of this.settings.metrics) {
            const label = metric.icon && lucideIconMap[metric.icon]
                ? `<span class="oom-metric-icon-svg oom-metric-icon--start">${lucideIconMap[metric.icon]}</span> ${metric.name}`
                : metric.name;
            content += `<th class="oom-sortable metric-value" data-sort="${metric.name}">${label} <span class="oom-sort-icon">↕</span></th>\n`;
        }
        content += '</tr>\n';
        content += '</thead>\n';
        content += '<tbody>\n';

        for (const entry of dreamEntries) {
            content += '<tr>\n';
            content += `<td>${entry.date}</td>\n`;
            content += `<td><a href="#^${entry.source.id}" data-href="${entry.source.file}#^${entry.source.id}" class="internal-link">${entry.title}</a></td>\n`;
            content += `<td class="metric-value">${entry.metrics['Words'] || 0}</td>\n`;

            // Process dream content for display
            let dreamContent = entry.content;
            
            // Escape HTML special characters, but allow <br> and <br /> tags, and preserve ampersands
            dreamContent = dreamContent
                // First, temporarily protect <br> and <br /> tags
                .replace(/<br\s*\/?\s*>/gi, '___BR___')
                // Escape ampersands not part of an entity
                .replace(/&(?![a-zA-Z]+;|#\d+;)/g, '&amp;')
                // Escape other HTML special characters
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                // Restore <br> and <br /> tags
                .replace(/___BR___/g, '<br />');

            // Convert markdown to HTML
            dreamContent = dreamContent
                .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')  // Bold
                .replace(/\*([^*]+?)\*/g, '<em>$1</em>')             // Italic
                .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2">$1</a>')  // Links
                .replace(/\[\[([^\]]+?)\]\]/g, '<a href="$1">$1</a>')  // Wiki links
                .replace(/`([^`]+?)`/g, '<code>$1</code>')           // Inline code
                .replace(/\n/g, '<br>');                             // Line breaks

            if (!dreamContent || !dreamContent.trim()) {
                dreamContent = '';
            }

            if (dreamContent.length > 200) {
                const preview = dreamContent.substring(0, 200) + '...';
                const cellId = `oom-content-${entry.date}-${entry.title.replace(/[^a-zA-Z0-9]/g, '')}`;
                content += `<td class="oom-dream-content" id="${cellId}">
                    <div class="oom-content-preview">${preview}</div>
                    <div class="oom-content-full">${dreamContent}</div>
                    <button type="button" class="oom-expand-button oom-show-more" aria-expanded="false" aria-controls="${cellId}-full">Show more<span class="visually-hidden"> full dream content</span></button>
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
        content += '</tbody>\n';
        content += '</table>\n';
        content += '</div>\n';
        content += '</div>\n';
        content += '\n<!-- OOM METRICS END -->\n';
        console.log('[OneiroMetrics] generateMetricsTable output (first 200 chars):', content.slice(0, 200));
        return content;
    }

    private updateProjectNoteView() {
        try {
            // Get all leaves that might contain our project note
            const leaves = this.app.workspace.getLeavesOfType('markdown');
            let updated = false;

            leaves.forEach(leaf => {
                const view = leaf.view;
                if (view instanceof MarkdownView && view.file && view.file.path === this.settings.projectNotePath) {
                    // Set the data attribute to identify this as our project note
                    const container = view.containerEl;
                    container.setAttribute('data-type', 'oom-project-note');

                    // Apply styles to the preview container
                    const previewEl = container.querySelector('.markdown-preview-view') as HTMLElement;
                    if (previewEl) {
                        previewEl.setAttribute('data-type', 'oom-project-note');
                        
                        // Apply full width styles if enabled
                        if (this.settings.readableLineLengthOverride) {
                            previewEl.classList.add('oom-full-width');
                            previewEl.style.setProperty('--oom-line-width', '100%', 'important');
                            previewEl.style.setProperty('--oom-max-width', 'none', 'important');
                        } else {
                            previewEl.classList.remove('oom-full-width');
                            previewEl.style.removeProperty('--oom-line-width');
                            previewEl.style.removeProperty('--oom-max-width');
                        }

                        // Force a reflow to ensure styles are applied
                        previewEl.style.display = 'none';
                        previewEl.offsetHeight; // Force reflow
                        previewEl.style.display = '';
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
        } catch (err) {
            new Notice('Error updating OneiroMetrics Note view. See console for details.');
            console.error('[OneiroMetrics] Error in updateProjectNoteView:', err);
        }
    }

    private attachProjectNoteEventListeners() {
        console.log('[OneiroMetrics][DEBUG] attachProjectNoteEventListeners called');
        const previewEl = document.querySelector('.markdown-preview-view[data-type="oom-project-note"]');
        if (!previewEl) {
            console.log('[OneiroMetrics][DEBUG] No project note preview element found');
            return;
        }

        // Function to attach event listeners to expand buttons
        const attachExpandButtonListeners = (container: Element) => {
            const expandButtons = container.querySelectorAll('.oom-expand-button');
            console.log('[OneiroMetrics][DEBUG] Found', expandButtons.length, 'expand buttons');
            
            expandButtons.forEach(button => {
                // Remove any existing listeners to prevent duplicates
                const newButton = button.cloneNode(true) as HTMLButtonElement;
                button.parentNode?.replaceChild(newButton, button);
                
                // Add the click listener
                newButton.addEventListener('click', handleExpandClick);
            });
        };

        // Click handler for expand buttons
        const handleExpandClick = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.currentTarget as HTMLButtonElement;
            const contentCell = button.closest('.oom-dream-content');
            if (!contentCell) {
                console.log('[OneiroMetrics][DEBUG] No content cell found for button');
                return;
            }

            const isExpanded = contentCell.classList.contains('expanded');
            contentCell.classList.toggle('expanded');
            button.setAttribute('aria-expanded', (!isExpanded).toString());
            
            // Update button text
            const buttonText = button.querySelector('span:not(.visually-hidden)');
            if (buttonText) {
                buttonText.textContent = isExpanded ? 'Show more' : 'Show less';
            }
            
            // Update hidden text for screen readers
            const hiddenText = button.querySelector('.visually-hidden');
            if (hiddenText) {
                hiddenText.textContent = isExpanded ? ' full dream content' : ' less dream content';
            }

            console.log('[OneiroMetrics][DEBUG] Button clicked, expanded:', !isExpanded);
        };

        // Initial attachment of listeners
        attachExpandButtonListeners(previewEl);

        // Set up MutationObserver to handle dynamic content changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof Element) {
                            attachExpandButtonListeners(node);
                        }
                    });
                }
            });
        });

        // Start observing the preview element for changes
        observer.observe(previewEl, {
            childList: true,
            subtree: true
        });

        // Clean up observer when plugin is unloaded
        this.register(() => observer.disconnect());

        // Attach event listener for Update Metrics button
        const updateBtn = previewEl.querySelector('#oom-update-metrics-btn');
        if (updateBtn) {
            updateBtn.addEventListener('click', async () => {
                const modal = new Modal(this.app);
                modal.titleEl.setText('Updating metrics...');
                modal.contentEl.createEl('div', { text: 'Please wait while metrics are updated.' });
                modal.open();
                try {
                    await this.scrapeMetrics();
                    modal.titleEl.setText('Metrics updated successfully!');
                    modal.contentEl.empty();
                    modal.contentEl.createEl('div', { text: 'Metrics tables have been updated.' });
                    const okBtn = modal.contentEl.createEl('button', { text: 'OK' });
                    okBtn.classList.add('oom-modal-btn');
                    okBtn.onclick = () => modal.close();
                    this.updateProjectNoteView();
                } catch (error) {
                    modal.titleEl.setText('Error updating metrics');
                    modal.contentEl.empty();
                    modal.contentEl.createEl('div', { text: 'Error updating metrics. Check console for details.' });
                    const okBtn = modal.contentEl.createEl('button', { text: 'OK' });
                    okBtn.classList.add('oom-modal-btn');
                    okBtn.onclick = () => modal.close();
                    console.error('Error updating metrics:', error);
                }
            });
        }

        // Attach event listeners to sortable headers
        const table = previewEl.querySelector('.oom-table.oom-sortable') as HTMLElement;
        if (!table) {
            console.log('[OneiroMetrics][DEBUG] No sortable table found');
            return;
        }

        const headers = table.querySelectorAll('th.oom-sortable');
        headers.forEach(header => {
            const sortKey = header.getAttribute('data-sort');
            if (sortKey) {
                header.setAttribute('data-column', sortKey);
                header.addEventListener('click', () => {
                    this.sortTable(table, sortKey);
                });
            }
        });

        // Attach event listeners to filters
        const dateRangeSelect = previewEl.querySelector('#dateRange') as HTMLSelectElement;
        const metricFilterSelect = previewEl.querySelector('#metricFilter') as HTMLSelectElement;

        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', () => {
                this.filterTable(table, dateRangeSelect.value, metricFilterSelect?.value || 'all');
            });
        }

        if (metricFilterSelect) {
            metricFilterSelect.addEventListener('change', () => {
                this.filterTable(table, dateRangeSelect?.value || 'all', metricFilterSelect.value);
            });
        }

        // Attach event listener for line length toggle
        const lineLengthToggle = previewEl.querySelector('#oom-line-length-toggle') as HTMLInputElement;
        if (lineLengthToggle) {
            lineLengthToggle.addEventListener('change', () => {
                this.settings.readableLineLengthOverride = lineLengthToggle.checked;
                this.saveSettings();
                this.updateProjectNoteView();
            });
        }
    }

    private sortTable(table: HTMLElement, column: string) {
        console.log('[OneiroMetrics][DEBUG] Sorting table by column:', column);
        const headers = table.querySelectorAll('th.oom-sortable');
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            console.log('[OneiroMetrics][DEBUG] No tbody found in table');
            return;
        }

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const header = Array.from(headers).find(h => h.getAttribute('data-sort') === column);
        if (!header) {
            console.log('[OneiroMetrics][DEBUG] No header found for column:', column);
            return;
        }

        const currentDirection = header.getAttribute('data-direction') || 'asc';
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

        // Update sort direction indicators
        headers.forEach(h => {
            h.setAttribute('data-direction', '');
            const icon = h.querySelector('.oom-sort-icon');
            if (icon) icon.textContent = '↕';
        });
        header.setAttribute('data-direction', newDirection);
        const thisIcon = header.querySelector('.oom-sort-icon');
        if (thisIcon) thisIcon.textContent = newDirection === 'asc' ? '↑' : '↓';

        // Sort the rows
        rows.sort((a, b) => {
            const colIndex = Array.from(headers).indexOf(header);
            const aCell = a.querySelector(`td:nth-child(${colIndex + 1})`);
            const bCell = b.querySelector(`td:nth-child(${colIndex + 1})`);
            let aVal = aCell?.textContent?.trim() || '';
            let bVal = bCell?.textContent?.trim() || '';

            // Handle numeric columns
            if (header.classList.contains('metric-value') || column === 'words') {
                aVal = String(parseFloat(aVal) || 0);
                bVal = String(parseFloat(bVal) || 0);
            } else if (column === 'date') {
                aVal = String(Date.parse(aVal.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3')) || 0);
                bVal = String(Date.parse(bVal.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3')) || 0);
            } else {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return newDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return newDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Reorder rows
        rows.forEach(row => tbody.appendChild(row));
        console.log('[OneiroMetrics][DEBUG] Table sorted successfully');
    }

    private filterTable(table: HTMLElement, dateRange: string, metricFilter: string) {
        console.log('[OneiroMetrics][DEBUG] Filtering table with dateRange:', dateRange, 'metricFilter:', metricFilter);
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            console.log('[OneiroMetrics][DEBUG] No tbody found in table');
            return;
        }

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        rows.forEach(row => {
            const dateCell = row.querySelector('td:first-child');
            const metricCells = row.querySelectorAll('td[data-metric]');
            let showRow = true;

            // Apply date filter
            if (dateRange !== 'all' && dateCell) {
                const date = new Date(dateCell.textContent || '');
                switch (dateRange) {
                    case 'week':
                        showRow = date >= oneWeekAgo;
                        break;
                    case 'month':
                        showRow = date >= oneMonthAgo;
                        break;
                    case 'thisweek':
                        showRow = date >= startOfWeek;
                        break;
                }
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
            row.style.display = showRow ? '' : 'none';
        });

        console.log('[OneiroMetrics][DEBUG] Table filtered successfully');
    }
}

class OneiroMetricsModal extends Modal {
    plugin: DreamMetricsPlugin;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-modal');
        contentEl.createEl('h2', { text: 'OneiroMetrics' });

        // Project Note Path
        new Setting(contentEl)
            .setName('OneiroMetrics Note Path')
            .addSearch(text => {
                text.setValue(this.plugin.settings.projectNotePath)
                    .setPlaceholder('Journals/Dream Diary/Metrics/Metrics.md')
                    .onChange(value => {
                        this.plugin.settings.projectNotePath = value;
                    });
                text.inputEl.addClass('oom-file-suggestion');
            });

        // Open Metrics Note Button
        const openBtnSetting = new Setting(contentEl)
            .setName('Open OneiroMetrics Note')
            .setDesc('Open your configured OneiroMetrics Note for metrics tables.');
        let openBtnComponent: ButtonComponent | null = null;
        openBtnSetting.addButton(btn => {
            openBtnComponent = btn;
            btn.setButtonText('Open OneiroMetrics Note')
                .setCta()
                .setDisabled(true)
                .onClick(async () => {
                    const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.projectNotePath);
                    if (file) {
                        await this.app.workspace.getLeaf(true).openFile(file as TFile);
                        this.close();
                    }
                });
        });
        // Enable button if file exists
        const checkEnable = () => {
            const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.projectNotePath);
            if (openBtnComponent) openBtnComponent.setDisabled(!file);
        };
        checkEnable();
        // Re-check when path changes
        contentEl.querySelectorAll('.oom-file-suggestion').forEach(input => {
            input.addEventListener('input', checkEnable);
        });

        // --- Flexible Note/Folder Selection (mirroring settings tab) ---
        new Setting(contentEl)
            .setName('Selection Mode')
            .setDesc('Choose whether to select individual notes or a folder for metrics scraping')
            .addDropdown(drop => {
                drop.addOption('notes', 'Notes');
                drop.addOption('folder', 'Folder');
                drop.setValue(this.plugin.settings.selectionMode || 'notes');
                drop.onChange(async (value) => {
                    this.plugin.settings.selectionMode = value as 'notes' | 'folder';
                    // Clear irrelevant selection when switching modes
                    if (value === 'folder') {
                        this.plugin.settings.selectedNotes = [];
                    } else {
                        this.plugin.settings.selectedFolder = '';
                    }
                    await this.plugin.saveSettings();
                    this.close();
                    new OneiroMetricsModal(this.app, this.plugin).open();
                });
            });

        // Dynamic label and field
        let selectionLabel = this.plugin.settings.selectionMode === 'folder' ? 'Selected Folder' : 'Selected Notes';
        let selectionDesc = this.plugin.settings.selectionMode === 'folder'
            ? 'Choose a folder to recursively search for dream metrics (max 200 files)'
            : 'Notes to search for dream metrics (select one or more)';
        let selectionSetting = new Setting(contentEl)
            .setName(selectionLabel)
            .setDesc(selectionDesc);

        if ((this.plugin.settings.selectionMode || 'notes') === 'folder') {
            // Folder autocomplete (styled like in settings)
            selectionSetting.addSearch(search => {
                search.setPlaceholder('Choose folder...');
                search.setValue(this.plugin.settings.selectedFolder || '');
                const parentForSuggestions = search.inputEl.parentElement || contentEl;
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
                    const parent = search.inputEl.parentElement || contentEl;
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
                this.plugin.register(() => suggestionContainer.remove());
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
                                this.plugin.settings.selectedFolder = folder;
                                await this.plugin.saveSettings();
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
            const searchFieldContainer = contentEl.createEl('div', { cls: 'oom-multiselect-search-container' });
            const chipsContainer = contentEl.createEl('div', { cls: 'oom-multiselect-chips-container' });
            chipsContainer.style.display = (this.plugin.settings.selectedNotes && this.plugin.settings.selectedNotes.length > 0) ? '' : 'none';
            import('./autocomplete').then(({ createSelectedNotesAutocomplete }) => {
                createSelectedNotesAutocomplete({
                    app: this.app,
                    plugin: this.plugin,
                    containerEl: searchFieldContainer,
                    selectedNotes: this.plugin.settings.selectedNotes,
                    onChange: (selected) => {
                        this.plugin.settings.selectedNotes = selected;
                        chipsContainer.style.display = (selected && selected.length > 0) ? '' : 'none';
                        this.plugin.saveSettings();
                    }
                });
            });
        }

        // Callout Name
        new Setting(contentEl)
            .setName('Callout Name')
            .addText(text => text
                .setValue(this.plugin.settings.calloutName)
                .onChange(value => {
                    this.plugin.settings.calloutName = value.toLowerCase().replace(/\s+/g, '-');
                }));

        // Scrape Metrics button
        new Setting(contentEl)
            .setName('Scrape Metrics')
            .addButton(button => button
                .setButtonText('Scrape')
                .onClick(async () => {
                    new Notice('[DEBUG] Scrape button clicked in Project Note modal');
                    console.log('[DEBUG] Scrape button clicked in Project Note modal');
                    // If in folder mode, show preview modal before scraping
                    if (this.plugin.settings.selectionMode === 'folder' && this.plugin.settings.selectedFolder) {
                        new Notice('[DEBUG] About to create folder preview modal in Project Note modal');
                        console.log('[DEBUG] About to create folder preview modal in Project Note modal');
                        const folderPath = this.plugin.settings.selectedFolder;
                        if (!folderPath) {
                            new Notice('Please select a folder first.');
                            return;
                        }
                        const folder = this.app.vault.getAbstractFileByPath(folderPath);
                        if (!folder || !(folder instanceof TFolder)) {
                            new Notice('Selected folder not found.');
                            return;
                        }
                        // Gather up to 200 markdown files recursively
                        const files: string[] = [];
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
                        gatherFiles(folder, files);
                        // Count total markdown files (for warning)
                        let totalCount = 0;
                        const countFiles = (folder: TFolder) => {
                            for (const child of folder.children) {
                                if (child instanceof TFile && child.extension === 'md') {
                                    totalCount++;
                                } else if (child instanceof TFolder) {
                                    countFiles(child);
                                }
                            }
                        };
                        countFiles(folder);
                        if (files.length === 0) {
                            new Notice('No markdown files found in the selected folder.');
                            return;
                        }
                        // Get any previously excluded files for this folder
                        const pluginAny = this.plugin as any;
                        const persistentKey = folderPath;
                        const persistentExclusions = (this.plugin.settings._persistentExclusions && this.plugin.settings._persistentExclusions[persistentKey]) || [];
                        let fileList: { path: string; name: string; checked: boolean; mtime: number }[] = files.map(path => {
                            const file = this.app.vault.getAbstractFileByPath(path);
                            return {
                                path,
                                name: path.split('/').pop() || path,
                                checked: !persistentExclusions.includes(path),
                                mtime: file instanceof TFile ? file.stat.mtime : 0
                            };
                        });
                        const modal = new Modal(this.app);
                        modal.titleEl.setText('Preview Files to be Scraped');
                        const content = modal.contentEl.createEl('div');
                        content.style.maxHeight = '400px';
                        content.style.overflowY = 'auto';
                        content.style.fontSize = '0.98em';
                        content.style.padding = '0.5em 0';
                        // File list UI
                        const listContainer = content.createEl('div');
                        listContainer.style.margin = '0';
                        listContainer.style.paddingLeft = '0';
                        // Render function
                        function renderList() {
                            listContainer.empty();
                            // File count display
                            const selectedCount = fileList.filter(f => f.checked).length;
                            const totalCount = fileList.length;
                            const countDisplay = listContainer.createEl('div', { cls: 'oom-file-count' });
                            countDisplay.textContent = `${selectedCount} of ${totalCount} files selected`;
                            // Render file list
                            fileList.forEach((file, idx) => {
                                const row = listContainer.createEl('div', { cls: 'oom-file-row' });
                                const checkbox = row.createEl('input');
                                checkbox.type = 'checkbox';
                                checkbox.checked = file.checked;
                                checkbox.addClass('oom-checkbox');
                                checkbox.addEventListener('change', () => {
                                    fileList[idx].checked = checkbox.checked;
                                    // Update file count display
                                    countDisplay.textContent = `${fileList.filter(f => f.checked).length} of ${fileList.length} files selected`;
                                });
                                row.createEl('span', { text: file.name, cls: 'oom-file-name' });
                            });
                        }
                        renderList();
                        // Add batch action buttons
                        const batchActionsRow = content.createEl('div', { cls: 'oom-batch-actions-row' });
                        const selectAllBtn = batchActionsRow.createEl('button', { text: 'Select All' });
                        selectAllBtn.classList.add('oom-modal-btn', 'oom-modal-btn--batch');
                        selectAllBtn.setAttribute('aria-label', 'Select all files');
                        selectAllBtn.onclick = () => {
                            fileList.forEach(f => f.checked = true);
                            renderList();
                            selectAllBtn.focus();
                        };
                        const deselectAllBtn = batchActionsRow.createEl('button', { text: 'Deselect All' });
                        deselectAllBtn.classList.add('oom-modal-btn', 'oom-modal-btn--batch');
                        deselectAllBtn.setAttribute('aria-label', 'Deselect all files');
                        deselectAllBtn.onclick = () => {
                            fileList.forEach(f => f.checked = false);
                            renderList();
                            deselectAllBtn.focus();
                        };
                        // Add spinner/progress bar and status message
                        const statusRow = content.createEl('div', { cls: 'oom-modal-status-row', attr: { role: 'status', 'aria-live': 'polite' } });
                        const spinner = statusRow.createEl('div', { cls: 'oom-spinner', attr: { 'aria-hidden': 'true' } });
                        spinner.style.display = 'none';
                        const statusMsg = statusRow.createEl('span', { text: '', cls: 'oom-status-msg' });
                        function showStatus(msg: string, showSpinner = false) {
                            statusMsg.textContent = msg;
                            spinner.style.display = showSpinner ? '' : 'none';
                        }
                        // Show gathering status at start
                        showStatus('Gathering files…', true);
                        setTimeout(() => {
                            showStatus('Ready', false);
                        }, 500);
                        // Add Continue and Cancel buttons
                        const btnRow = content.createEl('div', { cls: 'oom-modal-btn-row' });
                        const continueBtn = btnRow.createEl('button', { text: 'Continue' });
                        continueBtn.classList.add('oom-modal-btn', 'oom-modal-btn--continue');
                        continueBtn.onclick = async () => {
                            const selectedFiles = fileList.filter(f => f.checked).map(f => f.path);
                            if (selectedFiles.length === 0) {
                                new Notice('Please select at least one file to scrape.');
                                return;
                            }
                            // Save persistent exclusions for this folder
                            if (!this.plugin.settings._persistentExclusions) this.plugin.settings._persistentExclusions = {};
                            this.plugin.settings._persistentExclusions[persistentKey] = fileList.filter(f => !f.checked).map(f => f.path);
                            await this.plugin.saveSettings();
                            // Pass selectedFiles to the scraping logic
                            const pluginAny = this.plugin as any;
                            pluginAny._excludedFilesForNextScrape = fileList.filter(f => !f.checked).map(f => f.path);
                            await this.plugin.scrapeMetrics();
                            modal.close();
                            showSuccessModal(this.app, 'Metrics scraped successfully!');
                        };
                        const cancelBtn = btnRow.createEl('button', { text: 'Cancel' });
                        cancelBtn.classList.add('oom-modal-btn');
                        cancelBtn.onclick = () => {
                            modal.close();
                        };
                        modal.open();
                    }
                    // Notes mode: scrape immediately
                    await this.plugin.scrapeMetrics();
                    showSuccessModal(this.app, 'Metrics scraped successfully!');
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Add ConfirmModal class
class ConfirmModal extends Modal {
    public onConfirm: () => void;
    public onCancel: () => void;

    constructor(
        app: App,
        private title: string,
        private message: string
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-confirm-modal');

        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.message });

        const buttonContainer = contentEl.createEl('div', { cls: 'oom-modal-buttons' });

        new ButtonComponent(buttonContainer)
            .setButtonText('Cancel')
            .onClick(() => {
                this.onCancel();
                this.close();
            });

        new ButtonComponent(buttonContainer)
            .setButtonText('Continue')
            .setCta()
            .onClick(() => {
                this.onConfirm();
                this.close();
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Helper function to show a success modal
function showSuccessModal(app: App, message: string) {
    const modal = new Modal(app);
    modal.titleEl.setText('Success');
    modal.contentEl.createEl('div', { text: message, cls: 'oom-success-message' });
    const closeBtn = modal.contentEl.createEl('button', { text: 'Close' });
    closeBtn.classList.add('oom-modal-btn');
    closeBtn.onclick = () => modal.close();
    modal.open();
} 