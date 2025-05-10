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
            calloutName: 'dream-metrics',
            backupEnabled: true,
            backupFolderPath: ''
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
                            .replace(/```[\s\S]*?```/g, '')    // Remove code blocks
                            .replace(/`([^`]+?)`/g, '$1')      // Convert inline code to plain text
                            .replace(/\*\*([^*]+?)\*\*/g, '$1') // Convert bold to plain text
                            .replace(/\*([^*]+?)\*/g, '$1')    // Convert italic to plain text
                            .replace(/<\/?[^>]+(>|$)/g, '')    // Remove HTML tags
                            .replace(/^---+\s*$/gm, '') // Remove horizontal rules
                            .replace(/\[!journal-page\|.*?\]/g, '') // Remove journal-page callouts
                            .replace(/![^|\n]+?\|?\d*\s*/g, '') // Remove image embeds with optional dimensions
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
        if (!this.settings.backupEnabled) {
            console.log('Backups are disabled in settings');
            return;
        }

        if (!this.settings.backupFolderPath) {
            console.log('No backup folder path set in settings');
            new Notice('Please select a backup folder in settings');
            return;
        }

        try {
            const content = await this.app.vault.read(file);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = file.basename;
            const backupPath = `${this.settings.backupFolderPath}/${fileName}.backup-${timestamp}.md`;
            
            // Create backup folder if it doesn't exist
            const backupFolder = this.app.vault.getAbstractFileByPath(this.settings.backupFolderPath);
            if (!backupFolder) {
                try {
                    await this.app.vault.createFolder(this.settings.backupFolderPath);
                    console.log(`Created backup folder: ${this.settings.backupFolderPath}`);
                } catch (error) {
                    console.error('Error creating backup folder:', error);
                    new Notice(`Error creating backup folder: ${error.message}`);
                    return;
                }
            }
            
            // Create the backup file
            await this.app.vault.create(backupPath, content);
            console.log(`Created backup at: ${backupPath}`);
            new Notice(`Backup created: ${backupPath}`);
        } catch (error) {
            console.error('Error creating backup:', error);
            new Notice(`Error creating backup: ${error.message}`);
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
                dreamContent = diaryMatch[1];
                
                // First pass: Remove specific patterns line by line
                dreamContent = dreamContent
                    .split('\n')
                    .map(line => {
                        // Remove any line containing image references or specific patterns
                        if (line.match(/\.(?:png|jpg|jpeg|gif)(?:\|\d+)?/i) ||
                            line.match(/(?:banister|anister)-journals-\d{8}-.*?(?:\|\d+)?/) ||
                            line.match(/^!.*?\|/) ||
                            line.match(/^>\s*!.*?\|/) ||
                            line.match(/^>\s*\[\[.*?\]\]/) ||
                            line.match(/^>\s*\[!.*?\|/) ||
                            line.match(/^---+$/)) {
                            return '';
                        }
                        return line;
                    })
                    .filter(line => line.trim() !== '')
                    .join('\n');

                // Second pass: Clean up markdown and other elements
                dreamContent = dreamContent
                    .replace(/^>+\s*/gm, '')           // Remove blockquote markers
                    .replace(/\[\[([^\]]+?)\]\]/g, '$1') // Convert wiki links to plain text
                    .replace(/!\[.*?\]\(.*?\)/g, '')   // Remove image links
                    .replace(/\[([^\]]+?)\]\(.*?\)/g, '$1') // Convert markdown links to plain text
                    .replace(/```[\s\S]*?```/g, '')    // Remove code blocks
                    .replace(/`([^`]+?)`/g, '$1')      // Convert inline code to plain text
                    .replace(/\*\*([^*]+?)\*\*/g, '$1') // Convert bold to plain text
                    .replace(/\*([^*]+?)\*/g, '$1')    // Convert italic to plain text
                    .replace(/<\/?[^>]+(>|$)/g, '')    // Remove HTML tags
                    .replace(/\[!.*?\|.*?\]/g, '')     // Remove any remaining callouts
                    .replace(/\n{2,}/g, ' ')           // Replace multiple newlines with space
                    .trim();

                // Third pass: Remove any remaining image references or unwanted patterns
                dreamContent = dreamContent
                    .split(' ')
                    .filter(word => {
                        // Filter out any word that looks like an image reference or unwanted pattern
                        return !(
                            word.match(/\.(?:png|jpg|jpeg|gif)(?:\|\d+)?$/i) ||
                            word.match(/(?:banister|anister)-journals-\d{8}-.*?(?:\|\d+)?/) ||
                            word.match(/^!.*?\|/) ||
                            word.match(/\[\[.*?\]\]/) ||
                            word.match(/\[!.*?\|.*?\]/)
                        );
                    })
                    .join(' ')
                    .replace(/\s+/g, ' ') // Normalize spaces
                    .trim();
            }

            if (!dreamContent || !dreamContent.trim()) {
                dreamContent = '';
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
                const projectNoteInput = text.inputEl;
                projectNoteInput.addClass('oom-file-suggestion');
                projectNoteInput.setAttribute('data-suggestion', 'file');

                // Create suggestion container
                const projectNoteSuggestionContainer = contentEl.createEl('div', {
                    cls: 'suggestion-container oom-suggestion-container'
                });

                // Helper to position the dropdown
                function positionSuggestionContainer() {
                    const inputRect = projectNoteInput.getBoundingClientRect();
                    const modalEl = contentEl.closest('.modal');
                    const modalRect = modalEl ? modalEl.getBoundingClientRect() : contentEl.getBoundingClientRect();
                    const dropdownWidth = Math.max(inputRect.width, 180);
                    let left = inputRect.left - modalRect.left;
                    let top = inputRect.bottom - modalRect.top;
                    let maxWidth = modalRect.width;
                    projectNoteSuggestionContainer.style.position = 'absolute';
                    projectNoteSuggestionContainer.style.left = `${left}px`;
                    projectNoteSuggestionContainer.style.right = '';
                    projectNoteSuggestionContainer.style.maxWidth = `${maxWidth}px`;
                    if (left + dropdownWidth > modalRect.width) {
                        projectNoteSuggestionContainer.style.left = 'auto';
                        projectNoteSuggestionContainer.style.right = '0';
                    }
                    projectNoteSuggestionContainer.style.top = `${top}px`;
                    projectNoteSuggestionContainer.style.width = `${dropdownWidth}px`;
                    projectNoteSuggestionContainer.style.overflowX = 'auto';
                }

                // Normalize function (lowercase, collapse whitespace)
                function normalize(str: string): string {
                    return str.toLowerCase().replace(/\s+/g, '');
                }

                projectNoteInput.addEventListener('input', async (e) => {
                    const value = projectNoteInput.value;
                    if (!value) {
                        projectNoteSuggestionContainer.classList.add('oom-hidden');
                        return;
                    }

                    const files = this.app.vault.getMarkdownFiles();
                    const lowerInput = value.toLowerCase();
                    const yearMatch = value.match(/^(20\d{2})$/);
                    let suggestions: string[] = [];

                    // Add year-based suggestions if it's a year
                    if (yearMatch) {
                        const basePaths = [
                            'Journals',
                            'Dreams',
                            'Journal',
                            'Dream Diary'
                        ];
                        suggestions.push(...basePaths.flatMap(base => [
                            `${base}/${yearMatch[1]}/${yearMatch[1]}.md`,
                            `${base}/${yearMatch[1]}/`,
                            `${base}/${yearMatch[1]}/Entries/`,
                            `${base}/${yearMatch[1]}/Dreams/`
                        ]));
                    }

                    // Add matching files, excluding backups
                    const matchingFiles = files
                        .map(file => file.path)
                        .filter(path => {
                            // Exclude backup files and directories
                            if (path.includes('.backup-') || 
                                path.includes('/Backups/') ||
                                path.endsWith('.backup')) {
                                return false;
                            }

                            const lowerPath = path.toLowerCase();
                            // Match by path or year
                            return !this.plugin.settings.selectedNotes.includes(path) &&
                                   (lowerPath.includes(lowerInput) || 
                                    (yearMatch && path.includes(yearMatch[1])));
                        });

                    suggestions.push(...matchingFiles);

                    // Remove duplicates and sort
                    suggestions = [...new Set(suggestions)]
                        .sort((a, b) => {
                            // Prioritize exact matches
                            const aExact = a.toLowerCase() === lowerInput;
                            const bExact = b.toLowerCase() === lowerInput;
                            if (aExact && !bExact) return -1;
                            if (!aExact && bExact) return 1;
                            
                            // Then prioritize year-based paths
                            const aYear = a.includes(`/${value}/`);
                            const bYear = b.includes(`/${value}/`);
                            if (aYear && !bYear) return -1;
                            if (!aYear && bYear) return 1;
                            
                            // Finally sort alphabetically
                            return a.localeCompare(b);
                        })
                        .slice(0, 7);

                    projectNoteSuggestionContainer.empty();
                    if (suggestions.length > 0) {
                        for (const suggestion of suggestions) {
                            const item = projectNoteSuggestionContainer.createEl('div', {
                                cls: 'suggestion-item',
                                attr: { title: suggestion },
                                text: suggestion
                            });
                            item.onclick = () => {
                                this.plugin.settings.projectNotePath = suggestion;
                                this.plugin.saveSettings();
                                projectNoteInput.value = suggestion;
                                projectNoteSuggestionContainer.classList.add('oom-hidden');
                            };
                        }
                        projectNoteSuggestionContainer.classList.remove('oom-hidden');
                        positionSuggestionContainer();
                    } else {
                        projectNoteSuggestionContainer.classList.add('oom-hidden');
                    }
                });

                // Hide suggestions when clicking outside (scoped to this field)
                document.addEventListener('click', (e) => {
                    if (!projectNoteInput.contains(e.target as Node) && !projectNoteSuggestionContainer.contains(e.target as Node)) {
                        projectNoteSuggestionContainer.classList.add('oom-hidden');
                    }
                });
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
        const selectedNotesInput = selectedNotesContainer.createEl('input', {
            type: 'text',
            cls: 'oom-multiselect-input',
            attr: { placeholder: 'Type to search notes...' }
        });
        const selectedNotesSuggestionContainer = selectedNotesContainer.createEl('div', {
            cls: 'suggestion-container oom-suggestion-container oom-hidden',
            attr: {
                style: `
                    position: absolute;
                    z-index: 1000;
                    background: var(--background-primary);
                    border: 1px solid var(--background-modifier-border);
                    border-radius: 4px;
                    max-height: 200px;
                    overflow-y: auto;
                    box-shadow: 0 2px 8px var(--background-modifier-box-shadow);
                    width: 100%;
                    top: 100%;
                    left: 0;
                `
            }
        });

        // Function to hide suggestions
        function hideSelectedNotesSuggestions() {
            selectedNotesSuggestionContainer.classList.add('oom-hidden');
        }

        // Function to show suggestions
        function showSelectedNotesSuggestions() {
            selectedNotesSuggestionContainer.classList.remove('oom-hidden');
            // Position the container below the input
            const inputRect = selectedNotesInput.getBoundingClientRect();
            const containerRect = selectedNotesContainer.getBoundingClientRect();
            selectedNotesSuggestionContainer.style.top = `${inputRect.bottom - containerRect.top}px`;
            selectedNotesSuggestionContainer.style.width = `${inputRect.width}px`;
        }

        // Function to render chips
        const renderChips = () => {
            chipsContainer.empty();
            this.plugin.settings.selectedNotes.forEach((note: string) => {
                const chip = chipsContainer.createEl('div', { cls: 'oom-chip' });
                chip.createEl('span', { text: note });
                const removeBtn = chip.createEl('button', { cls: 'oom-chip-remove' });
                removeBtn.onclick = () => {
                    this.plugin.settings.selectedNotes = this.plugin.settings.selectedNotes.filter((n: string) => n !== note);
                    this.plugin.saveSettings();
                    renderChips();
                };
            });
        };

        // Initial render of chips
        renderChips();

        // Handle input for autocomplete
        selectedNotesInput.addEventListener('input', async (e) => {
            const value = selectedNotesInput.value;
            console.log('[OneiroMetrics][Modal] Input event fired. Value:', value);
            console.log('[OneiroMetrics][Modal] Current selectedNotes:', this.plugin.settings.selectedNotes);
            if (!value) {
                hideSelectedNotesSuggestions();
                return;
            }

            // Only get real markdown files
            const files = this.app.vault.getMarkdownFiles();
            console.log('[OneiroMetrics][Modal] Files returned by getMarkdownFiles:', files.map(f => f.path));
            const lowerInput = value.toLowerCase();
            let suggestions: string[] = [];

            // Only add matching files, excluding backups and already-selected notes
            const matchingFiles = files
                .map(file => file.path)
                .filter(path => {
                    // Exclude backup files and directories
                    if (path.includes('.backup-') || 
                        path.includes('/Backups/') ||
                        path.endsWith('.backup')) {
                        return false;
                    }
                    const lowerPath = path.toLowerCase();
                    return !this.plugin.settings.selectedNotes.includes(path) && lowerPath.includes(lowerInput);
                });

            suggestions = matchingFiles
                .sort((a, b) => {
                    // Prioritize exact matches
                    const aExact = a.toLowerCase() === lowerInput;
                    const bExact = b.toLowerCase() === lowerInput;
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                    // Finally sort alphabetically
                    return a.localeCompare(b);
                })
                .slice(0, 7);

            console.log('[OneiroMetrics][Modal] Suggestions to display:', suggestions);

            selectedNotesSuggestionContainer.empty();
            if (suggestions.length > 0) {
                console.log('[OneiroMetrics][Modal] Creating suggestion items...');
                for (const suggestion of suggestions) {
                    const item = selectedNotesSuggestionContainer.createEl('div', {
                        cls: 'suggestion-item',
                        attr: { title: suggestion },
                        text: suggestion
                    });
                    item.onclick = () => {
                        if (!this.plugin.settings.selectedNotes.includes(suggestion)) {
                            this.plugin.settings.selectedNotes.push(suggestion);
                            this.plugin.saveSettings();
                            renderChips();
                        }
                        selectedNotesInput.value = '';
                        hideSelectedNotesSuggestions();
                    };
                }
                console.log('[OneiroMetrics][Modal] Showing suggestions container...');
                console.log('[OneiroMetrics][Modal] Container display style:', selectedNotesSuggestionContainer.style.display);
                console.log('[OneiroMetrics][Modal] Container classList:', selectedNotesSuggestionContainer.classList);
                showSelectedNotesSuggestions();
                console.log('[OneiroMetrics][Modal] Container display style after show:', selectedNotesSuggestionContainer.style.display);
                console.log('[OneiroMetrics][Modal] Container classList after show:', selectedNotesSuggestionContainer.classList);
            } else {
                console.log('[OneiroMetrics][Modal] No suggestions to display');
                hideSelectedNotesSuggestions();
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!selectedNotesInput.contains(e.target as Node) && !selectedNotesSuggestionContainer.contains(e.target as Node)) {
                hideSelectedNotesSuggestions();
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