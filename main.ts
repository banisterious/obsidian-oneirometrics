import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile } from 'obsidian';
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
    }

    onunload() {
        // Clean up if needed
    }

    async loadSettings() {
        this.settings = Object.assign({}, {
            projectNotePath: 'Dreams/Metrics.md',
            metrics: [...DEFAULT_METRICS],
            selectedNotes: [],
            calloutName: 'dream-metrics'
        }, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async scrapeMetrics() {
        const metrics: Record<string, number[]> = {};
        let totalWords = 0;
        let entriesProcessed = 0;

        for (const path of this.settings.selectedNotes) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (!(file instanceof TFile)) {
                console.log(`File not found or not a file: ${path}`);
                continue;
            }

            try {
                const content = await this.app.vault.read(file);
                const calloutMatch = content.match(/>\s*\[!${this.settings.calloutName}\]\s*\n>(.*?)(?=\n\n|\n[^>]|$)/s);
                
                if (calloutMatch) {
                    const metricsText = calloutMatch[1].replace(/>\s*/g, '');
                    const wordCount = content.split(/\s+/).length;
                    totalWords += wordCount;
                    entriesProcessed++;

                    const metricPairs = metricsText.split(',').map(pair => pair.trim());
                    for (const pair of metricPairs) {
                        const [name, value] = pair.split(':').map(s => s.trim());
                        if (name && !isNaN(Number(value))) {
                            if (!metrics[name]) {
                                metrics[name] = [];
                            }
                            metrics[name].push(Number(value));
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing file ${path}:`, error);
            }
        }

        // Add average word count metric
        if (entriesProcessed > 0) {
            const avgWords = Math.round(totalWords / entriesProcessed);
            metrics['Average Words'] = [avgWords];
        }

        await this.updateProjectNote(metrics);
    }

    private extractDateFromNotePath(path: string): string {
        // Extract date from filename or content if possible
        const filename = path.split('/').pop() || '';
        const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}/);
        return dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
    }

    private extractTitleFromNotePath(path: string): string {
        // Extract title from filename
        const filename = path.split('/').pop() || '';
        return filename.replace(/\.md$/, '');
    }

    private async updateProjectNote(metrics: Record<string, number[]>) {
        const projectFile = this.app.vault.getAbstractFileByPath(this.settings.projectNotePath);
        if (!(projectFile instanceof TFile)) {
            console.log(`Project note not found: ${this.settings.projectNotePath}`);
            return;
        }

        try {
            await this.app.vault.modify(projectFile, this.generateMetricsTable(metrics));
        } catch (error) {
            console.error('Error writing to project note:', error);
        }
    }

    private generateMetricsTable(metrics: Record<string, number[]>): string {
        let table = '# OneiroMetrics Analysis\n\n';
        table += '<div class="oom-table-container">\n';
        table += '<table class="oom-table">\n';
        table += '<thead>\n';
        table += '<tr>\n';
        table += '<th>Metric</th>\n';
        table += '<th>Average</th>\n';
        table += '<th>Min</th>\n';
        table += '<th>Max</th>\n';
        table += '<th>Count</th>\n';
        table += '</tr>\n';
        table += '</thead>\n';
        table += '<tbody>\n';

        for (const [name, values] of Object.entries(metrics)) {
            if (values.length === 0) continue;

            const avg = values.reduce((a, b) => a + b) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            table += '<tr>\n';
            table += `<td>${name}</td>\n`;
            table += `<td>${avg.toFixed(2)}</td>\n`;
            table += `<td>${min}</td>\n`;
            table += `<td>${max}</td>\n`;
            table += `<td>${values.length}</td>\n`;
            table += '</tr>\n';
        }

        table += '</tbody>\n';
        table += '</table>\n';
        table += '</div>';
        return table;
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
                    .onChange(value => {
                        this.plugin.settings.projectNotePath = value;
                    });
                
                // Configure file suggestions
                text.inputEl.addClass('oom-file-suggestion');
                text.inputEl.setAttribute('data-suggestion', 'file');
            });

        // Selected Notes
        new Setting(contentEl)
            .setName('Selected Notes')
            .addTextArea(text => text
                .setValue(this.plugin.settings.selectedNotes.join('\n'))
                .onChange(value => {
                    this.plugin.settings.selectedNotes = value.split('\n').filter(note => note.trim());
                }));

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