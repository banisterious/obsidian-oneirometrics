import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { DEFAULT_METRICS, DreamMetricData, DreamMetricsSettings } from './types';
import { DreamMetricsSettingTab } from './settings';

export default class DreamMetricsPlugin extends Plugin {
    settings: DreamMetricsSettings;

    async onload() {
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new DreamMetricsSettingTab(this.app, this));

        // Add ribbon icon
        this.addRibbonIcon('dream', 'Dream Metrics', () => {
            new DreamMetricsModal(this.app, this).open();
        });

        // Add command to open modal
        this.addCommand({
            id: 'open-dream-metrics-modal',
            name: 'Open Dream Metrics',
            callback: () => {
                new DreamMetricsModal(this.app, this).open();
            }
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
        const metrics: DreamMetricData[] = [];

        for (const notePath of this.settings.selectedNotes) {
            const file = this.app.vault.getAbstractFileByPath(notePath);
            if (!file) {
                new Notice(`Note not found: ${notePath}`);
                continue;
            }

            const content = await this.app.vault.read(file);
            const calloutRegex = new RegExp(`> \\[!${this.settings.calloutName}\\]\\n> ([^\\n]+)`, 'g');
            let match;

            while ((match = calloutRegex.exec(content)) !== null) {
                const metricsText = match[1];
                const metricPairs = metricsText.split(',').map(pair => pair.trim());
                const metricData: DreamMetricData = {
                    date: this.extractDateFromNotePath(notePath),
                    title: this.extractTitleFromNotePath(notePath),
                    metrics: {}
                };

                for (const pair of metricPairs) {
                    const [key, value] = pair.split(':').map(s => s.trim());
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        metricData.metrics[key] = numValue;
                    }
                }

                metrics.push(metricData);
            }
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

    private async updateProjectNote(metrics: DreamMetricData[]) {
        const projectFile = this.app.vault.getAbstractFileByPath(this.settings.projectNotePath);
        if (!projectFile) {
            // Create the project note if it doesn't exist
            await this.app.vault.create(this.settings.projectNotePath, this.generateMetricsTable(metrics));
        } else {
            await this.app.vault.modify(projectFile, this.generateMetricsTable(metrics));
        }
    }

    private generateMetricsTable(metrics: DreamMetricData[]): string {
        const headers = ['Date', 'Title', ...this.settings.metrics.map(m => m.name)];
        const rows = metrics.map(data => [
            data.date,
            data.title,
            ...this.settings.metrics.map(m => data.metrics[m.name]?.toString() || '')
        ]);

        const table = [
            '| ' + headers.join(' | ') + ' |',
            '| ' + headers.map(() => '---').join(' | ') + ' |',
            ...rows.map(row => '| ' + row.join(' | ') + ' |')
        ].join('\n');

        return `# Dream Metrics\n\n${table}`;
    }
}

class DreamMetricsModal extends Modal {
    plugin: DreamMetricsPlugin;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Dream Metrics' });

        // Project Note Path
        new Setting(contentEl)
            .setName('Project Note Path')
            .addText(text => text
                .setValue(this.plugin.settings.projectNotePath)
                .onChange(value => {
                    this.plugin.settings.projectNotePath = value;
                }));

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