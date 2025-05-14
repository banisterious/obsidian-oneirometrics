import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { DreamMetricsState } from './state/DreamMetricsState';
import { DreamMetricsDOM } from './dom/DreamMetricsDOM';
import { DreamMetricsEvents } from './events/DreamMetricsEvents';
import { DreamMetricsProcessor } from './metrics/DreamMetricsProcessor';
import { DreamMetricsSettings, DreamMetricData, DreamMetric } from './types';

export default class DreamMetricsPlugin extends Plugin {
    private state: DreamMetricsState;
    private dom: DreamMetricsDOM;
    private events: DreamMetricsEvents;
    private processor: DreamMetricsProcessor;
    public settings: DreamMetricsSettings;

    async onload() {
        await this.loadSettings();

        // Initialize components
        this.state = new DreamMetricsState(this.settings);
        this.processor = new DreamMetricsProcessor(this.settings);

        // Register commands
        this.addCommand({
            id: 'show-dream-metrics',
            name: 'Show Dream Metrics',
            callback: () => this.showMetrics()
        });

        // Add settings tab
        this.addSettingTab(new DreamMetricsSettingTab(this.app, this));
    }

    onunload() {
        // Cleanup
        if (this.dom) {
            this.dom.cleanup();
        }
        if (this.events) {
            this.events.cleanup();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async showMetrics() {
        // Get the active leaf
        const leaf = this.app.workspace.activeLeaf;
        if (!leaf) return;

        // Create container
        const container = document.createElement('div');
        container.addClass('dream-metrics-container');

        // Initialize DOM and Events
        this.dom = new DreamMetricsDOM(container, this.state, this.app);
        this.events = new DreamMetricsEvents(this.state, this.dom);

        // Process and display metrics
        const entries = await this.getDreamEntries();
        const { metrics, processedEntries } = this.processor.processDreamEntries(entries);

        // Update state
        const dreamMetrics: Record<string, DreamMetric> = Object.entries(metrics).reduce((acc, [key, value]) => {
            acc[key] = {
                name: key,
                icon: 'circle', // default icon
                minValue: 0,
                maxValue: 100,
                description: ''
            };
            return acc;
        }, {} as Record<string, DreamMetric>);
        this.state.updateMetrics(dreamMetrics);
        this.state.updateDreamEntries(processedEntries);

        // Render table
        this.dom.render();

        // Attach event listeners
        this.events.attachEventListeners();

        // Display in leaf
        leaf.setViewState({
            type: 'markdown',
            state: { file: 'Dream Metrics' }
        });

        const view = leaf.view;
        if (view) {
            view.containerEl.empty();
            view.containerEl.appendChild(container);
        }
    }

    private async getDreamEntries(): Promise<DreamMetricData[]> {
        // TODO: Implement dream entry retrieval
        return [];
    }
}

class DreamMetricsSettingTab extends PluginSettingTab {
    plugin: DreamMetricsPlugin;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Dream Metrics Settings' });

        new Setting(containerEl)
            .setName('Project Note Path')
            .setDesc('Path to the project note where metrics will be displayed')
            .addText(text => text
                .setPlaceholder('Enter path')
                .setValue(this.plugin.settings.projectNotePath)
                .onChange(async (value) => {
                    this.plugin.settings.projectNotePath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Callout Name')
            .setDesc('Name of the callout to use for dream entries')
            .addText(text => text
                .setPlaceholder('Enter callout name')
                .setValue(this.plugin.settings.calloutName)
                .onChange(async (value) => {
                    this.plugin.settings.calloutName = value;
                    await this.plugin.saveSettings();
                }));
    }
}

const DEFAULT_SETTINGS: DreamMetricsSettings = {
    projectNotePath: '',
    metrics: {
        'Words': {
            name: 'Words',
            icon: '📝',
            minValue: 0,
            maxValue: 1000,
            description: 'Number of words in the dream entry'
        },
        'Reading Time': {
            name: 'Reading Time',
            icon: '⏱️',
            minValue: 0,
            maxValue: 10,
            description: 'Estimated reading time in minutes'
        }
    },
    selectedNotes: [],
    folderOptions: {
        enabled: false,
        path: ''
    },
    selectionMode: 'manual',
    calloutName: 'dream',
    backup: {
        enabled: true,
        maxBackups: 5
    },
    logging: {
        level: 'info',
        maxSize: 1024 * 1024, // 1MB
        maxBackups: 3
    }
}; 