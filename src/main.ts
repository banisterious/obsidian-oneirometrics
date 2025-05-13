import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { TimeFilterView, TIME_FILTER_VIEW_TYPE } from './TimeFilterView.js';
import { TimeFilterManager } from './timeFilters.js';

interface DreamMetricsSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: DreamMetricsSettings = {
    mySetting: 'default'
}

export default class DreamMetricsPlugin extends Plugin {
    settings: DreamMetricsSettings;
    private timeFilterManager: TimeFilterManager;
    private timeFilterView: TimeFilterView | null = null;

    async onload() {
        await this.loadSettings();
        this.timeFilterManager = new TimeFilterManager();

        // Register the time filter view
        this.registerView(
            TIME_FILTER_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new TimeFilterView(leaf)
        );

        // Add ribbon icon
        this.addRibbonIcon('calendar', 'Time Filter', () => {
            this.activateView();
        });

        // Add commands
        this.addCommand({
            id: 'show-time-filter',
            name: 'Show Time Filter',
            callback: () => {
                this.activateView();
            }
        });

        // Add time filter commands
        this.addCommand({
            id: 'set-filter-today',
            name: 'Set filter to Today',
            callback: () => {
                this.timeFilterManager.setFilter('today');
            }
        });

        this.addCommand({
            id: 'set-filter-yesterday',
            name: 'Set filter to Yesterday',
            callback: () => {
                this.timeFilterManager.setFilter('yesterday');
            }
        });

        this.addCommand({
            id: 'set-filter-this-week',
            name: 'Set filter to This Week',
            callback: () => {
                this.timeFilterManager.setFilter('thisWeek');
            }
        });

        this.addCommand({
            id: 'set-filter-last-week',
            name: 'Set filter to Last Week',
            callback: () => {
                this.timeFilterManager.setFilter('lastWeek');
            }
        });

        this.addCommand({
            id: 'set-filter-this-month',
            name: 'Set filter to This Month',
            callback: () => {
                this.timeFilterManager.setFilter('thisMonth');
            }
        });

        this.addCommand({
            id: 'set-filter-last-month',
            name: 'Set filter to Last Month',
            callback: () => {
                this.timeFilterManager.setFilter('lastMonth');
            }
        });

        this.addCommand({
            id: 'open-custom-date-range',
            name: 'Open Custom Date Range',
            callback: () => {
                const leaf = this.app.workspace.getLeavesOfType(TIME_FILTER_VIEW_TYPE)[0];
                if (leaf?.view instanceof TimeFilterView) {
                    leaf.view.openCustomDateRange();
                }
            }
        });

        // Add settings tab
        this.addSettingTab(new DreamMetricsSettingTab(this.app, this));
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(TIME_FILTER_VIEW_TYPE);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
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
}

class DreamMetricsSettingTab extends PluginSettingTab {
    plugin: DreamMetricsPlugin;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Setting #1')
            .setDesc('It\'s a secret')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.mySetting)
                .onChange(async (value) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
} 