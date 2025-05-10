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
        const projectFile = this.app.vault.getAbstractFileByPath(this.settings.projectNotePath);
        if (!(projectFile instanceof TFile)) {
            console.log(`Project note not found: ${this.settings.projectNotePath}`);
            return;
        }

        try {
            // Create backup before any operations if enabled
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
            const timestamp = now.toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '_')
                .replace('Z', '');
            
            // Create backup filename with original filename and timestamp
            const fileName = file.basename;
            const backupPath = `${this.settings.backupFolderPath}/${fileName}.backup-${timestamp}.md`;
            
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
            } else {
                const metric = this.settings.metrics.find(m => m.name === name);
                if (metric?.icon) {
                    label = `<span class="oom-metric-icon oom-metric-icon--start">${metric.icon}</span> ${name}`;
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
        for (const metric of this.settings.metrics) {
            const label = metric.icon ? `<span class="oom-metric-icon oom-metric-icon--start">${metric.icon}</span> ${metric.name}` : metric.name;
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
            const label = metric.icon ? `<span class="oom-metric-icon oom-metric-icon--start">${metric.icon}</span> ${metric.name}` : metric.name;
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

        // Reference the external sorting/filtering script instead of injecting it
        content += '<script src="js/oom-table.js"></script>';
        // Add expand/collapse script for dream content
        content += `<script>
        document.querySelectorAll('.oom-dream-content').forEach(cell => {
            const preview = cell.querySelector('.oom-content-preview');
            const full = cell.querySelector('.oom-content-full');
            const button = cell.querySelector('.oom-expand-button');
            if (!button) return;
            button.addEventListener('click', () => {
                const expanded = cell.classList.contains('expanded');
                button.setAttribute('aria-expanded', String(!expanded));
                cell.classList.toggle('expanded');
            });
        });
        </script>`;

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

        import('./autocomplete').then(({ createSelectedNotesAutocomplete }) => {
            createSelectedNotesAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: selectedNotesContainer,
                selectedNotes: this.plugin.settings.selectedNotes,
                onChange: (selected) => {
                    this.plugin.settings.selectedNotes = selected;
                }
            });
        });

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