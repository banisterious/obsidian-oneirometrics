import { App, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_METRICS, DreamMetric, DreamMetricsSettings } from "./types";
import DreamMetricsPlugin from "./main";

export class DreamMetricsSettingTab extends PluginSettingTab {
    plugin: DreamMetricsPlugin;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Dream Metrics Settings' });

        // Project Note Path Setting
        new Setting(containerEl)
            .setName('Project Note Path')
            .setDesc('Path to the note where dream metrics will be aggregated')
            .addText(text => text
                .setPlaceholder('Dreams/Metrics.md')
                .setValue(this.plugin.settings.projectNotePath)
                .onChange(async (value) => {
                    this.plugin.settings.projectNotePath = value;
                    await this.plugin.saveSettings();
                }));

        // Callout Name Setting
        new Setting(containerEl)
            .setName('Callout Name')
            .setDesc('Name of the callout block used for dream metrics (e.g., "dream-metrics")')
            .addText(text => text
                .setPlaceholder('dream-metrics')
                .setValue(this.plugin.settings.calloutName)
                .onChange(async (value) => {
                    this.plugin.settings.calloutName = value.toLowerCase().replace(/\s+/g, '-');
                    await this.plugin.saveSettings();
                }));

        // Selected Notes Setting
        new Setting(containerEl)
            .setName('Selected Notes')
            .setDesc('Notes to search for dream metrics (one per line)')
            .addTextArea(text => text
                .setPlaceholder('Journal/Journal.md\nDreams/2024.md')
                .setValue(this.plugin.settings.selectedNotes.join('\n'))
                .onChange(async (value) => {
                    this.plugin.settings.selectedNotes = value.split('\n').filter(note => note.trim());
                    await this.plugin.saveSettings();
                }));

        // Metrics Section
        containerEl.createEl('h3', { text: 'Metrics Configuration' });

        // Display existing metrics
        this.plugin.settings.metrics.forEach((metric, index) => {
            const metricSetting = new Setting(containerEl)
                .setName(metric.name)
                .setDesc(`Range: ${metric.range.min}-${metric.range.max}`)
                .addText(text => text
                    .setValue(metric.description)
                    .onChange(async (value) => {
                        this.plugin.settings.metrics[index].description = value;
                        await this.plugin.saveSettings();
                    }))
                .addExtraButton(button => button
                    .setIcon('trash')
                    .setTooltip('Remove metric')
                    .onClick(async () => {
                        this.plugin.settings.metrics.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    }));
        });

        // Add New Metric Button
        new Setting(containerEl)
            .setName('Add New Metric')
            .addButton(button => button
                .setButtonText('Add Metric')
                .onClick(async () => {
                    this.plugin.settings.metrics.push({
                        name: 'New Metric',
                        range: { min: 1, max: 5 },
                        description: 'Description of the metric'
                    });
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Reset to Defaults Button
        new Setting(containerEl)
            .setName('Reset to Defaults')
            .setDesc('Restore default metrics configuration')
            .addButton(button => button
                .setButtonText('Reset')
                .onClick(async () => {
                    this.plugin.settings.metrics = [...DEFAULT_METRICS];
                    await this.plugin.saveSettings();
                    this.display();
                }));
    }
} 