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
        // Show progress modal with detailed status
        const progressModal = new Modal(this.app);
        progressModal.titleEl.setText('Scraping Dream Metrics...');
        const progressContent = progressModal.contentEl.createEl('div', { cls: 'oom-progress-content' });
        const statusText = progressContent.createEl('div', { cls: 'oom-status-text' });
        const progressBar = progressContent.createEl('div', { cls: 'oom-progress-bar' });
        const progressFill = progressBar.createEl('div', { cls: 'oom-progress-fill' });
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

        if (!this.settings.selectedNotes || this.settings.selectedNotes.length === 0) {
            new Notice('No notes selected. Please select at least one note to scrape.');
            console.warn('[OneiroMetrics] No notes selected.');
            progressModal.close();
            return;
        }

        // Process files in batches of 5
        const BATCH_SIZE = 5;
        const files = this.settings.selectedNotes;
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
                    progressFill.classList.add('oom-progress-fill');
                    detailsText.setText(`Found ${entriesProcessed} entries, ${calloutsFound} callouts`);

                    // Process journal entries
                    let journalEntries: string[] | null = content.match(/---\n+> \[!journal-entry\][\s\S]*?\n> \^\d{8}[\s\S]*?(?=\n+---\n+(?:> \[!journal-entry\]|$)|$)/g);
                    if (!journalEntries) {
                        console.warn(`[OneiroMetrics] No journal entries found in: ${path}`);
                        console.log(`[OneiroMetrics] Content preview: ${content.substring(0, 500)}...`);
                        return;
                    }
                    foundAnyJournalEntries = true;
                    console.log(`[OneiroMetrics] Found ${journalEntries.length} journal entries in ${path}`);

                    // Process each journal entry
                    for (const journalEntry of journalEntries) {
                        const dateMatch = journalEntry.match(/\^(\d{8})/);
                        if (!dateMatch) {
                            console.warn(`[OneiroMetrics] Could not extract date from journal entry: ${journalEntry.substring(0, 100)}...`);
                            continue;
                        }
                        const date = dateMatch[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
                        const entryId = dateMatch[1];

                        // Find dream diaries
                        const dreamDiaries = journalEntry.match(/> \[!dream-diary\].*?\[\[.*?\]\][\s\S]*?(?=\n\n> \[!(?!dream-metrics)|$)/g);
                        if (!dreamDiaries) {
                            console.log(`[OneiroMetrics] No dream diaries found in journal entry ${date}`);
                            continue;
                        }

                        // Process each dream diary
                        for (const dreamDiary of dreamDiaries) {
                            const titleMatch = dreamDiary.match(/> \[!dream-diary\] (.*?) \[\[/);
                            if (!titleMatch) {
                                console.warn(`[OneiroMetrics] Could not extract title from dream diary: ${dreamDiary.substring(0, 100)}...`);
                                continue;
                            }
                            const title = titleMatch[1].trim();

                            // Find metrics
                            const metricsMatch = dreamDiary.match(/> \[!dream-metrics(?:\|.*)?\][\s\S]*?>\s*([\w\W]*?)(?=\n\n> \[!|$)/);
                            if (!metricsMatch) {
                                console.log(`[OneiroMetrics] No metrics callout found in dream diary: ${title}`);
                                continue;
                            }
                            calloutsFound++;
                            foundAnyMetrics = true;

                            // Process metrics and content
                            const metricsText = metricsMatch[1].replace(/>\s*/g, '');
                            const dreamContent = this.processDreamContent(dreamDiary);
                            const wordCount = dreamContent.split(/\s+/).length;
                            totalWords += wordCount;
                            entriesProcessed++;

                            // Update progress
                            detailsText.setText(`Found ${entriesProcessed} entries, ${calloutsFound} callouts`);

                            // Process metrics
                            const dreamMetrics = this.processMetrics(metricsText, metrics);
                            dreamMetrics['Words'] = wordCount;
                            if (!metrics['Words']) {
                                metrics['Words'] = [];
                            }
                            metrics['Words'].push(wordCount);

                            // Add dream entry
                            dreamEntries.push({
                                date,
                                title,
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
            });

            // Wait for batch to complete
            await Promise.all(batchPromises);
        }

        // Final validation
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

        // Sort and update
        dreamEntries.sort((a, b) => a.date.localeCompare(b.date));
        await this.updateProjectNote(metrics, dreamEntries);
        progressModal.close();
        new Notice('Metrics scraped successfully!');
    }

    private processDreamContent(dreamDiary: string): string {
        return dreamDiary
            .split(/> \[!dream-metrics\]/)[0]
            .replace(/^> \[!dream-diary\].*?\[\[.*?\]\]\n/m, '')
            .replace(/^>+\s*/gm, '')
            .replace(/\[\[([^\]]+?)\]\]/g, '$1')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/\[([^\]]+?)\]\(.*?\)/g, '$1')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+?)`/g, '$1')
            .replace(/\*\*([^*]+?)\*\*/g, '$1')
            .replace(/\*([^*]+?)\*/g, '$1')
            .replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/^---+\s*$/gm, '')
            .replace(/\[!journal-page\|.*?\]/g, '')
            .replace(/![^|\n]+?\|?\d*\s*/g, '')
            .replace(/\n{2,}/g, ' ')
            .trim();
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
                if (this.settings.backupEnabled) {
                    try {
                        await this.backupProjectNote(projectFile);
                    } catch (error) {
                        console.error('Error creating backup:', error);
                        new Notice('Error creating backup. Check console for details.');
                        // Ask user if they want to proceed without backup
                        const proceed = await this.confirmProceedWithoutBackup();
                        if (!proceed) {
                            return;
                        }
                    }
                }
                
                // Confirm with user
                const confirmed = await this.confirmOverwrite();
                if (confirmed) {
                    await this.app.vault.modify(projectFile, newContent);
                    new Notice('Metrics tables updated successfully!');
                    // Update view after content change
                    this.updateProjectNoteView();
                }
            } else {
                new Notice('No changes to metrics tables.');
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

    private createDreamEntriesTable(dreamEntries: DreamMetricData[]): HTMLElement {
        const tableContainer = document.createElement('div');
        tableContainer.addClass('oom-table-container');

        const table = document.createElement('table');
        table.addClass('oom-table');

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Date', 'Title', 'Content', 'Metrics'].forEach(text => {
            const th = document.createElement('th');
            th.setText(text);
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create tbody
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        // Add table to container
        tableContainer.appendChild(table);

        // Implement lazy loading
        const ITEMS_PER_PAGE = 20;
        let currentPage = 0;
        let isLoading = false;
        let hasMore = true;

        const loadMoreEntries = () => {
            if (isLoading || !hasMore) return;
            isLoading = true;

            const start = currentPage * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            const pageEntries = dreamEntries.slice(start, end);

            if (pageEntries.length === 0) {
                hasMore = false;
                isLoading = false;
                return;
            }

            pageEntries.forEach(entry => {
                const row = document.createElement('tr');
                
                // Date cell
                const dateCell = document.createElement('td');
                dateCell.setText(entry.date);
                row.appendChild(dateCell);

                // Title cell
                const titleCell = document.createElement('td');
                titleCell.setText(entry.title);
                row.appendChild(titleCell);

                // Content cell
                const contentCell = document.createElement('td');
                contentCell.setText(entry.content);
                row.appendChild(contentCell);

                // Metrics cell
                const metricsCell = document.createElement('td');
                const metricsList = document.createElement('ul');
                metricsList.addClass('oom-metrics-list');
                Object.entries(entry.metrics).forEach(([name, value]) => {
                    const li = document.createElement('li');
                    li.setText(`${name}: ${value}`);
                    metricsList.appendChild(li);
                });
                metricsCell.appendChild(metricsList);
                row.appendChild(metricsCell);

                tbody.appendChild(row);
            });

            currentPage++;
            isLoading = false;
        };

        // Create intersection observer for infinite scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && hasMore) {
                    loadMoreEntries();
                }
            });
        }, { threshold: 0.5 });

        // Create loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.addClass('oom-loading-indicator');
        loadingIndicator.setText('Loading more entries...');
        loadingIndicator.classList.remove('visible');
        tableContainer.appendChild(loadingIndicator);

        // Observe loading indicator
        observer.observe(loadingIndicator);

        // Load initial entries
        loadMoreEntries();

        return tableContainer;
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
                text.inputEl.addClass('oom-file-suggestion');
            });

        // Selected Notes
        const selectedNotesSetting = new Setting(contentEl)
            .setName('Selected Notes')
            .setDesc('Select notes to include in metrics scraping');

        const selectedNotesContainer = contentEl.createEl('div', {
            cls: 'oom-selected-notes-container'
        });

        // Display current selections
        this.plugin.settings.selectedNotes.forEach(note => {
            const chip = selectedNotesContainer.createEl('div', {
                cls: 'oom-chip',
                text: note
            });
            const removeBtn = chip.createEl('button', {
                cls: 'oom-chip-remove',
                text: '×'
            });
            removeBtn.addEventListener('click', () => {
                this.plugin.settings.selectedNotes = this.plugin.settings.selectedNotes.filter(n => n !== note);
                chip.remove();
            });
        });

        // Add note input
        const inputContainer = selectedNotesContainer.createEl('div', {
            cls: 'oom-input-container'
        });
        const input = inputContainer.createEl('input', {
            type: 'text',
            placeholder: 'Type to search notes...',
            cls: 'oom-search-input'
        });

        const suggestionContainer = inputContainer.createEl('div', {
            cls: 'oom-suggestion-container'
        });

        // Show/hide suggestions
        const showSuggestions = (suggestions: string[]) => {
            suggestionContainer.empty();
            if (suggestions.length > 0) {
                suggestions.forEach(suggestion => {
                    const item = suggestionContainer.createEl('div', {
                        cls: 'oom-suggestion-item',
                        text: suggestion
                    });
                    item.addEventListener('click', () => {
                        if (!this.plugin.settings.selectedNotes.includes(suggestion)) {
                            this.plugin.settings.selectedNotes.push(suggestion);
                            const chip = selectedNotesContainer.createEl('div', {
                                cls: 'oom-chip',
                                text: suggestion
                            });
                            const removeBtn = chip.createEl('button', {
                                cls: 'oom-chip-remove',
                                text: '×'
                            });
                            removeBtn.addEventListener('click', () => {
                                this.plugin.settings.selectedNotes = this.plugin.settings.selectedNotes.filter(n => n !== suggestion);
                                chip.remove();
                            });
                        }
                        input.value = '';
                        suggestionContainer.empty();
                    });
                });
                suggestionContainer.classList.add('visible');
            } else {
                suggestionContainer.classList.remove('visible');
            }
        };

        // Handle input
        input.addEventListener('input', async (e) => {
            const value = input.value;
            if (!value) {
                suggestionContainer.classList.remove('visible');
                return;
            }

            const files = this.app.vault.getMarkdownFiles();
            const lowerInput = value.toLowerCase();
            const suggestions = files
                .map(file => file.path)
                .filter(path => {
                    if (path.includes('.backup-') || 
                        path.includes('/Backups/') ||
                        path.endsWith('.backup')) {
                        return false;
                    }
                    const lowerPath = path.toLowerCase();
                    return !this.plugin.settings.selectedNotes.includes(path) && 
                           lowerPath.includes(lowerInput);
                })
                .sort((a, b) => {
                    const aExact = a.toLowerCase() === lowerInput;
                    const bExact = b.toLowerCase() === lowerInput;
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                    return a.localeCompare(b);
                })
                .slice(0, 7);

            showSuggestions(suggestions);
        });

        // Hide suggestions on blur
        input.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionContainer.classList.remove('visible');
            }, 200);
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