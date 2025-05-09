import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile, ButtonComponent } from 'obsidian';
import { DEFAULT_METRICS, DreamMetricData, DreamMetricsSettings } from './types';
import { DreamMetricsSettingTab } from './settings';

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
            calloutName: 'dream-metrics'
        }, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async scrapeMetrics() {
        // Show progress modal
        const progressModal = new Modal(this.app);
        progressModal.titleEl.setText('Scraping Dream Metrics...');
        progressModal.contentEl.createEl('div', { text: 'Please wait while metrics are being scraped. This may take a few seconds for large journals.' });
        progressModal.open();

        const metrics: Record<string, number[]> = {};
        const dreamEntries: DreamMetricData[] = [];
        let totalWords = 0;
        let entriesProcessed = 0;
        let calloutsFound = 0;
        let validNotes = 0;
        let foundAnyJournalEntries = false;
        let foundAnyMetrics = false;

        if (!this.settings.selectedNotes || this.settings.selectedNotes.length === 0) {
            new Notice('No notes selected. Please select at least one note to scrape.');
            console.warn('[OneiroMetrics] No notes selected.');
            progressModal.close();
            return;
        }

        for (const path of this.settings.selectedNotes) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (!(file instanceof TFile)) {
                console.warn(`[OneiroMetrics] File not found or not a file: ${path}`);
                continue;
            }
            validNotes++;
            try {
                const content = await this.app.vault.read(file);
                console.log(`[OneiroMetrics] Processing file: ${path}`);
                console.log(`[OneiroMetrics] Content length: ${content.length} characters`);
                // Updated regex: match blocks between --- that contain a journal entry, but don't break on internal ---
                let journalEntries: string[] | null = content.match(/---\n+> \[!journal-entry\][\s\S]*?\n> \^\d{8}[\s\S]*?(?=\n+---\n+(?:> \[!journal-entry\]|$)|$)/g);
                if (!journalEntries) {
                    console.warn(`[OneiroMetrics] No journal entries found in: ${path}`);
                    console.log(`[OneiroMetrics] Content preview: ${content.substring(0, 500)}...`);
                    continue;
                }
                foundAnyJournalEntries = true;
                console.log(`[OneiroMetrics] Found ${journalEntries.length} journal entries in ${path}`);
                for (const journalEntry of journalEntries) {
                    // Extract date from journal entry ID
                    const dateMatch = journalEntry.match(/\^(\d{8})/);
                    if (!dateMatch) {
                        console.warn(`[OneiroMetrics] Could not extract date from journal entry: ${journalEntry.substring(0, 100)}...`);
                        continue;
                    }
                    const date = dateMatch[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
                    const entryId = dateMatch[1];
                    // Find dream diary callouts within this journal entry, handling internal horizontal rules
                    const dreamDiaries = journalEntry.match(/> \[!dream-diary\].*?\[\[.*?\]\][\s\S]*?(?=\n\n> \[!(?!dream-metrics)|$)/g);
                    if (!dreamDiaries) {
                        console.log(`[OneiroMetrics] No dream diaries found in journal entry ${date}`);
                        continue;
                    }
                    console.log(`[OneiroMetrics] Found ${dreamDiaries.length} dream diaries in journal entry ${date}`);
                    for (const dreamDiary of dreamDiaries) {
                        // Extract dream title
                        const titleMatch = dreamDiary.match(/> \[!dream-diary\] (.*?) \[\[/);
                        if (!titleMatch) {
                            console.warn(`[OneiroMetrics] Could not extract title from dream diary: ${dreamDiary.substring(0, 100)}...`);
                            continue;
                        }
                        const title = titleMatch[1].trim();
                        // Find dream metrics callout (with or without |hide)
                        const metricsMatch = dreamDiary.match(/> \[!dream-metrics(?:\|.*)?\][\s\S]*?>\s*([\w\W]*?)(?=\n\n> \[!|$)/);
                        if (!metricsMatch) {
                            console.log(`[OneiroMetrics] No metrics callout found in dream diary: ${title}`);
                            continue;
                        }
                        calloutsFound++;
                        foundAnyMetrics = true;
                        const metricsText = metricsMatch[1].replace(/>\s*/g, '');
                        console.log(`[OneiroMetrics] Found metrics for dream: ${title}`);
                        console.log(`[OneiroMetrics] Metrics text: ${metricsText}`);
                        // Extract dream content, being very strict about boundaries
                        const dreamContent = dreamDiary
                            .split(/> \[!dream-metrics\]/)[0] // Get everything before the metrics callout
                            .replace(/^> \[!dream-diary\].*?\[\[.*?\]\]\n/m, '') // Remove the dream-diary callout header
                            .replace(/^>+\s*/gm, '') // Remove blockquote markers
                            .replace(/\[\[([^\]]+?)\]\]/g, '$1') // Convert wiki links to plain text
                            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image links
                            .replace(/\[([^\]]+?)\]\(.*?\)/g, '$1') // Convert markdown links to plain text
                            .replace(/`([^`]+?)`/g, '$1') // Convert inline code to plain text
                            .replace(/\*\*([^*]+?)\*\*/g, '$1') // Convert bold to plain text
                            .replace(/\*([^*]+?)\*/g, '$1') // Convert italic to plain text
                            .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
                            .replace(/^---+\s*$/gm, '') // Remove horizontal rules
                            .replace(/\n{2,}/g, ' ') // Replace multiple newlines with space
                            .trim();
                        const wordCount = dreamContent.split(/\s+/).length;
                        totalWords += wordCount;
                        entriesProcessed++;
                        // Extract metrics for this dream
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
                        // Add word count to metrics
                        if (!metrics['Words']) {
                            metrics['Words'] = [];
                        }
                        metrics['Words'].push(wordCount);
                        dreamMetrics['Words'] = wordCount;
                        // Create dream entry
                        dreamEntries.push({
                            date: date,
                            title: title,
                            content: dreamContent,
                            source: {
                                file: path,
                                id: entryId
                            },
                            metrics: dreamMetrics
                        });
                    }
                }
            } catch (error) {
                console.error(`[OneiroMetrics] Error processing file ${path}:`, error);
                new Notice(`Error processing file: ${path}`);
            }
        }
        console.log(`[OneiroMetrics] Notes processed: ${validNotes}`);
        console.log(`[OneiroMetrics] Callouts found: ${calloutsFound}`);
        console.log(`[OneiroMetrics] Entries processed: ${entriesProcessed}`);
        if (validNotes === 0) {
            new Notice('No valid notes found. Please check your selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyJournalEntries) {
            new Notice('No journal entries found in selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyMetrics) {
            new Notice('No dream metrics callouts found in selected notes.');
            progressModal.close();
            return;
        }
        if (entriesProcessed === 0) {
            new Notice('No metrics data found in selected notes.');
            progressModal.close();
            return;
        }
        // Sort dream entries by date
        dreamEntries.sort((a, b) => a.date.localeCompare(b.date));
        await this.updateProjectNote(metrics, dreamEntries);
        progressModal.close();
        new Notice('Metrics scraped successfully!');
    }

    private async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]) {
        const projectFile = this.app.vault.getAbstractFileByPath(this.settings.projectNotePath);
        if (!(projectFile instanceof TFile)) {
            console.log(`Project note not found: ${this.settings.projectNotePath}`);
            return;
        }

        try {
            // Read existing content
            const existingContent = await this.app.vault.read(projectFile);
            
            // Extract content before and after the metrics tables
            const tableMatch = existingContent.match(/(.*?)(# OneiroMetrics Analysis.*?)(\n\n.*)/s);
            const beforeTable = tableMatch ? tableMatch[1] : '';
            const afterTable = tableMatch ? tableMatch[3] : '';
            
            // Generate new content
            const newContent = beforeTable + 
                             this.generateMetricsTable(metrics, dreamEntries) + 
                             afterTable;
            
            // Only proceed if content has changed
            if (newContent !== existingContent) {
                // Create backup before modifying
                await this.backupProjectNote(projectFile);
                
                // Confirm with user
                const confirmed = await this.confirmOverwrite();
                if (confirmed) {
                    await this.app.vault.modify(projectFile, newContent);
                    new Notice('Metrics tables updated successfully!');
                    // Update view after content change
                    this.updateProjectNoteView();
                }
            }
        } catch (error) {
            console.error('Error writing to project note:', error);
            new Notice('Error updating metrics tables. Check console for details.');
        }
    }

    private async backupProjectNote(file: TFile) {
        try {
            const content = await this.app.vault.read(file);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            // Get the directory of the project note
            const projectDir = file.parent;
            if (!projectDir) {
                throw new Error('Project note has no parent directory');
            }
            // Create Backups folder if it doesn't exist
            const backupsFolderPath = `${projectDir.path}/Backups`;
            const backupsFolder = this.app.vault.getAbstractFileByPath(backupsFolderPath);
            if (!backupsFolder) {
                await this.app.vault.createFolder(backupsFolderPath);
            }
            // Create backup file in the Backups folder
            const backupPath = `${backupsFolderPath}/Metrics.${timestamp}.backup.md`;
            // Check if backup already exists
            const existingBackup = this.app.vault.getAbstractFileByPath(backupPath);
            if (existingBackup) {
                await this.app.vault.delete(existingBackup);
            }
            await this.app.vault.create(backupPath, content);
            console.log(`Created backup at: ${backupPath}`);
        } catch (error) {
            console.error('Error creating backup:', error);
            new Notice('Error creating backup. Check console for details.');
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

    private generateMetricsTable(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): string {
        let content = '';
        
        // Metrics Section
        content += '<div class="oom-table-section">';
        content += '<div class="oom-table-title">Metrics</div>';
        
        // Summary Table
        content += '<div class="oom-table-container">\n';
        content += '<table class="oom-table">\n';
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
        for (const name of validMetricNames) {
            const values = metrics[name];
            if (!values || values.length === 0) continue;
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
        content += '</tbody>\n';
        content += '</table>\n';
        content += '</div>\n';
        content += '</div>\n';

        // Dream Entries Section
        content += '<div class="oom-table-section">';
        content += '<div class="oom-table-title">Dream Entries</div>';
        
        // Filter Controls
        content += '<div class="oom-filter-controls">\n';
        content += '<div class="oom-date-filter">\n';
        content += '<label for="dateRange">Date Range:</label>\n';
        content += '<select id="dateRange" class="oom-select">\n';
        content += '<option value="all">All Time</option>\n';
        content += '<option value="month">Last Month</option>\n';
        content += '<option value="week">Last Week</option>\n';
        content += '</select>\n';
        content += '</div>\n';
        content += '<div class="oom-metric-filter">\n';
        content += '<label for="metricFilter">Filter by Metric:</label>\n';
        content += '<select id="metricFilter" class="oom-select">\n';
        content += '<option value="all">All Metrics</option>\n';
        for (const name of this.settings.metrics.map(m => m.name)) {
            content += `<option value="${name}">${name}</option>\n`;
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
        for (const name of this.settings.metrics.map(m => m.name)) {
            content += `<th class="oom-sortable metric-value" data-sort="${name}">${name} <span class="oom-sort-icon">↕</span></th>\n`;
        }
        content += '</tr>\n';
        content += '</thead>\n';
        content += '<tbody>\n';

        for (const entry of dreamEntries) {
            content += '<tr>\n';
            content += `<td>${entry.date}</td>\n`;
            content += `<td><a href="#^${entry.source.id}" data-href="${entry.source.file}#^${entry.source.id}" class="internal-link">${entry.title}</a></td>\n`;
            content += `<td class="metric-value">${entry.metrics['Words'] || 0}</td>\n`;

            // Extract and clean only the dream content
            let dreamContent = entry.content;
            
            // Find the content between dream-diary and dream-metrics callouts
            const diaryMatch = dreamContent.match(/> \[!dream-diary\].*?\[\[.*?\]\]\n([\s\S]*?)(?=\n> \[!dream-metrics\]|$)/);
            if (diaryMatch) {
                dreamContent = diaryMatch[1]
                    // First, remove specific markdown elements
                    .replace(/^\[!journal-page\|right\]\s*$/gm, '') // Remove journal-page callouts exactly as they appear
                    .replace(/^![\w-]+-\d{8}-[\w-]+\.png\|\d+\s*$/gm, '') // Remove image embeds with date format and dimensions
                    // Then proceed with general markdown cleaning
                    .replace(/^>+\s*/gm, '') // Remove blockquote markers
                    .replace(/\[\[([^\]]+?)\]\]/g, '$1') // Convert wiki links to plain text
                    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image links
                    .replace(/\[([^\]]+?)\]\(.*?\)/g, '$1') // Convert markdown links to plain text
                    .replace(/`([^`]+?)`/g, '$1') // Convert inline code to plain text
                    .replace(/\*\*([^*]+?)\*\*/g, '$1') // Convert bold to plain text
                    .replace(/\*([^*]+?)\*/g, '$1') // Convert italic to plain text
                    .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
                    .replace(/^---+\s*$/gm, '') // Remove horizontal rules
                    .replace(/\n{2,}/g, ' ') // Replace multiple newlines with space
                    .replace(/^\s+|\s+$/gm, '') // Trim each line
                    .trim();
            }

            if (dreamContent.length > 200) {
                const preview = dreamContent.substring(0, 200) + '...';
                content += `<td class="oom-dream-content">
                    <input type="checkbox" class="oom-show-toggle" id="oom-toggle-${entry.date}-${entry.title.replace(/[^a-zA-Z0-9]/g, '')}">
                    <div class="oom-content-preview">${preview}</div>
                    <div class="oom-content-full">${dreamContent}</div>
                    <label for="oom-toggle-${entry.date}-${entry.title.replace(/[^a-zA-Z0-9]/g, '')}" class="oom-expand-button oom-show-more">Show more</label>
                    <label for="oom-toggle-${entry.date}-${entry.title.replace(/[^a-zA-Z0-9]/g, '')}" class="oom-expand-button oom-show-less">Show less</label>
                </td>\n`;
            } else {
                content += `<td class="oom-dream-content"><div class="oom-content-preview">${dreamContent}</div></td>\n`;
            }

            // Add metric values
            for (const name of this.settings.metrics.map(m => m.name)) {
                content += `<td class="metric-value">${entry.metrics[name] || ''}</td>\n`;
            }
            content += '</tr>\n';
        }
        content += '</tbody>\n';
        content += '</table>\n';
        content += '</div>\n';
        content += '</div>\n';
        return content;
    }

    private updateProjectNoteView() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && activeView.file && activeView.file.path === this.settings.projectNotePath) {
            const previewEl = activeView.previewMode?.containerEl;
            if (previewEl) {
                previewEl.setAttribute('data-type', 'oom-project-note');
            }
        }
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
            .setName('Project Note Path')
            .addSearch(text => {
                text.setValue(this.plugin.settings.projectNotePath)
                    .setPlaceholder('Journals/Dream Diary/Metrics/Metrics.md')
                    .onChange(value => {
                        this.plugin.settings.projectNotePath = value;
                    });
                // Configure file suggestions
                const inputEl = text.inputEl;
                inputEl.addClass('oom-file-suggestion');
                inputEl.setAttribute('data-suggestion', 'file');

                // Create suggestion container
                const suggestionContainer = contentEl.createEl('div', {
                    cls: 'suggestion-container oom-suggestion-container'
                });

                // Helper to position the dropdown
                function positionSuggestionContainer() {
                    const inputRect = inputEl.getBoundingClientRect();
                    const modalEl = contentEl.closest('.modal');
                    const modalRect = modalEl ? modalEl.getBoundingClientRect() : contentEl.getBoundingClientRect();
                    const dropdownWidth = Math.max(inputRect.width, 180);
                    let left = inputRect.left - modalRect.left;
                    let top = inputRect.bottom - modalRect.top;
                    let maxWidth = modalRect.width;
                    suggestionContainer.style.position = 'absolute';
                    suggestionContainer.style.left = `${left}px`;
                    suggestionContainer.style.right = '';
                    suggestionContainer.style.maxWidth = `${maxWidth}px`;
                    if (left + dropdownWidth > modalRect.width) {
                        suggestionContainer.style.left = 'auto';
                        suggestionContainer.style.right = '0';
                    }
                    suggestionContainer.style.top = `${top}px`;
                    suggestionContainer.style.width = `${dropdownWidth}px`;
                    suggestionContainer.style.overflowX = 'auto';
                }

                // Normalize function (lowercase, collapse whitespace)
                function normalize(str: string): string {
                    return str.toLowerCase().replace(/\s+/g, '');
                }

                inputEl.addEventListener('input', async (e) => {
                    const value = inputEl.value;
                    if (!value) {
                        suggestionContainer.classList.add('oom-hidden');
                        return;
                    }

                    const files = this.app.vault.getMarkdownFiles()
                        .filter(file => !file.path.includes('/Backups/') && !file.path.endsWith('.backup'));
                    const lowerInput = value.toLowerCase();
                    const normalizedInput = normalize(value);
                    
                    const suggestions = files
                        .map(file => file.path)
                        .filter(path => {
                            const lowerPath = path.toLowerCase();
                            const normalizedPath = normalize(path);
                            const segments = lowerPath.split(/[\/ ]+/);
                            
                            // Check for exact matches first
                            if (lowerPath === lowerInput) return true;
                            
                            // Check for path segment matches
                            if (segments.some(segment => segment.includes(lowerInput))) return true;
                            
                            // Check for normalized path matches
                            if (normalizedPath.includes(normalizedInput)) return true;
                            
                            // Check for partial path matches
                            return lowerPath.includes(lowerInput);
                        })
                        .slice(0, 7);

                    suggestionContainer.empty();
                    if (suggestions.length > 0) {
                        for (const suggestion of suggestions) {
                            const item = suggestionContainer.createEl('div', {
                                cls: 'suggestion-item',
                                attr: { title: suggestion },
                                text: suggestion
                            });
                            item.onclick = () => {
                                this.plugin.settings.projectNotePath = suggestion;
                                this.plugin.saveSettings();
                                inputEl.value = suggestion;
                                suggestionContainer.classList.add('oom-hidden');
                            };
                        }
                        suggestionContainer.classList.remove('oom-hidden');
                        positionSuggestionContainer();
                    } else {
                        suggestionContainer.classList.add('oom-hidden');
                    }
                });
            });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!inputEl.contains(e.target as Node) && !suggestionContainer.contains(e.target as Node)) {
                suggestionContainer.classList.add('oom-hidden');
            }
        });

        // Selected Notes (multi-chip autocomplete)
        new Setting(contentEl)
            .setName('Selected Notes')
            .setDesc('Notes to search for dream metrics (select one or more)')
            .addExtraButton(button => {
                // No-op, just for layout
            });

        // Multi-select autocomplete for Selected Notes
        const selectedNotesContainer = contentEl.createEl('div', { cls: 'oom-multiselect-container' });
        const chipsContainer = selectedNotesContainer.createEl('div', { cls: 'oom-chips-container' });
        const input = selectedNotesContainer.createEl('input', {
            type: 'text',
            cls: 'oom-multiselect-input',
            attr: { placeholder: 'Type to search notes...' }
        });
        const suggestionContainer = selectedNotesContainer.createEl('div', {
            cls: 'suggestion-container oom-suggestion-container'
        });

        // Render chips for selected notes
        function renderChips() {
            chipsContainer.empty();
            for (const note of this.plugin.settings.selectedNotes) {
                const chip = chipsContainer.createEl('span', { cls: 'oom-chip' });
                const chipText = chip.createEl('span', { cls: 'oom-chip-text', text: note });
                chipText.setAttr('title', note);
                const removeBtn = chip.createEl('span', { cls: 'oom-chip-remove', text: '×' });
                removeBtn.onclick = () => {
                    this.plugin.settings.selectedNotes = this.plugin.settings.selectedNotes.filter((n: string) => n !== note);
                    this.plugin.saveSettings();
                    renderChips.call(this);
                };
            }
        }
        renderChips.call(this);

        // Suggestion logic
        input.addEventListener('input', async (e) => {
            const value = input.value;
            if (!value) {
                suggestionContainer.classList.add('oom-hidden');
                return;
            }
            const files = this.app.vault.getMarkdownFiles();
            const lowerInput = value.toLowerCase();
            const suggestions = files
                .map(file => file.path)
                .filter(path =>
                    !this.plugin.settings.selectedNotes.includes(path) &&
                    path.toLowerCase().includes(lowerInput)
                )
                .slice(0, 7);
            suggestionContainer.empty();
            if (suggestions.length > 0) {
                for (const suggestion of suggestions) {
                    const item = suggestionContainer.createEl('div', {
                        cls: 'suggestion-item',
                        attr: { title: suggestion },
                        text: suggestion
                    });
                    item.onclick = () => {
                        this.plugin.settings.selectedNotes.push(suggestion);
                        this.plugin.saveSettings();
                        input.value = '';
                        suggestionContainer.classList.add('oom-hidden');
                    };
                }
                suggestionContainer.classList.remove('oom-hidden');
            } else {
                suggestionContainer.classList.add('oom-hidden');
            }
        });
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target as Node) && !suggestionContainer.contains(e.target as Node)) {
                suggestionContainer.classList.add('oom-hidden');
            }
        });
        // Keyboard navigation for suggestions
        input.addEventListener('keydown', (e) => {
            const items = suggestionContainer.querySelectorAll('.suggestion-item');
            const currentIndex = Array.from(items).findIndex(item => item.classList.contains('is-selected'));
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < items.length - 1) {
                        items[currentIndex]?.classList.remove('is-selected');
                        items[currentIndex + 1].classList.add('is-selected');
                        items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
                    } else if (items.length > 0 && currentIndex === -1) {
                        items[0].classList.add('is-selected');
                        items[0].scrollIntoView({ block: 'nearest' });
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        items[currentIndex]?.classList.remove('is-selected');
                        items[currentIndex - 1].classList.add('is-selected');
                        items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const selectedItem = suggestionContainer.querySelector('.is-selected');
                    if (selectedItem) {
                        const path = selectedItem.textContent;
                        if (path) {
                            this.plugin.settings.selectedNotes.push(path);
                            this.plugin.saveSettings();
                            input.value = '';
                            suggestionContainer.classList.add('oom-hidden');
                        }
                    }
                    break;
                case 'Escape':
                    suggestionContainer.classList.add('oom-hidden');
                    break;
            }
        });

        // Callout Name
        new Setting(contentEl)
            .setName('Callout Name')
            .addText(text => text
                .setValue(this.plugin.settings.calloutName)
                .onChange(value => {
                    this.plugin.settings.calloutName = value.toLowerCase().replace(/\s+/g, '-');
                }));

        // Scrape Button
        new Setting(contentEl)
            .setName('Scrape Metrics')
            .addButton(button => button
                .setButtonText('Scrape')
                .onClick(async () => {
                    await this.plugin.scrapeMetrics();
                    new Notice('Metrics scraped successfully!');
                    this.close();
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