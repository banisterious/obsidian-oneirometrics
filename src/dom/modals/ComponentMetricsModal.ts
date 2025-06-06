import { App, Modal, Notice, Setting } from 'obsidian';
import DreamMetricsPlugin from '../../../main';

// Simple helper functions for component metrics configuration
function getComponentMetrics(settings: any, component: 'calendar' | 'charts') {
    if (!settings.unifiedMetrics?.preferredMetrics?.[component]) {
        return [];
    }
    return settings.unifiedMetrics.preferredMetrics[component];
}

function setComponentMetrics(settings: any, component: 'calendar' | 'charts', metrics: any[]) {
    if (!settings.unifiedMetrics) {
        return;
    }
    if (!settings.unifiedMetrics.preferredMetrics) {
        settings.unifiedMetrics.preferredMetrics = { calendar: [], charts: [] };
    }
    settings.unifiedMetrics.preferredMetrics[component] = metrics;
}

export class ComponentMetricsModal extends Modal {
    private component: 'calendar' | 'charts';
    private plugin: DreamMetricsPlugin;
    private onSave: () => void;
    private availableMetrics: string[] = [];
    private selectedMetrics: string[] = [];

    constructor(
        app: App, 
        plugin: DreamMetricsPlugin, 
        component: 'calendar' | 'charts',
        onSave: () => void
    ) {
        super(app);
        this.plugin = plugin;
        this.component = component;
        this.onSave = onSave;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-component-metrics-modal');

        // Title
        const title = this.component === 'calendar' ? 'Calendar Metrics Configuration' : 'Chart Metrics Configuration';
        contentEl.createEl('h2', { text: title, cls: 'oom-modal-title' });

        // Description
        const description = this.component === 'calendar' 
            ? 'Select which metrics should be used for calendar day quality visualization.'
            : 'Select which metrics should be preferred for chart displays.';
        contentEl.createEl('p', { text: description, cls: 'oom-modal-description' });

        // Load current configuration
        this.loadCurrentConfiguration();

        // Create metrics selection section
        this.createMetricsSelection(contentEl);

        // Create buttons
        this.createButtons(contentEl);
    }

    private loadCurrentConfiguration(): void {
        // Get all available metrics from enabled metrics
        this.availableMetrics = Object.values(this.plugin.settings.metrics || {})
            .filter((metric: any) => metric.enabled)
            .map((metric: any) => metric.name);

        // Get currently selected metrics for this component
        if (this.plugin.settings.unifiedMetrics) {
            const currentMetrics = getComponentMetrics(this.plugin.settings, this.component);
            this.selectedMetrics = currentMetrics.map((m: any) => m.name || m);
        } else {
            this.selectedMetrics = [];
        }
    }

    private createMetricsSelection(container: HTMLElement): void {
        const section = container.createDiv('oom-metrics-selection-section');
        
        section.createEl('h3', { 
            text: 'Available Metrics', 
            cls: 'oom-section-title' 
        });

        if (this.availableMetrics.length === 0) {
            section.createEl('p', { 
                text: 'No metrics are currently enabled. Please enable metrics in the main settings first.',
                cls: 'oom-empty-state' 
            });
            return;
        }

        // Create checkboxes for each metric
        this.availableMetrics.forEach(metricKey => {
            const metricName = this.getMetricDisplayName(metricKey);
            const isSelected = this.selectedMetrics.includes(metricKey);

            new Setting(section)
                .setName(metricName)
                .setDesc(this.getMetricDescription(metricKey))
                .addToggle(toggle => toggle
                    .setValue(isSelected)
                    .onChange((value) => {
                        if (value && !this.selectedMetrics.includes(metricKey)) {
                            this.selectedMetrics.push(metricKey);
                        } else if (!value && this.selectedMetrics.includes(metricKey)) {
                            this.selectedMetrics = this.selectedMetrics.filter(m => m !== metricKey);
                        }
                    }));
        });

        // Add "Select All" and "Clear All" buttons
        const buttonContainer = section.createDiv('oom-bulk-selection');
        
        const selectAllBtn = buttonContainer.createEl('button', {
            text: 'Select All',
            cls: 'oom-button oom-button-secondary'
        });
        selectAllBtn.onclick = () => {
            this.selectedMetrics = [...this.availableMetrics];
            this.refreshMetricsSelection(section);
        };

        const clearAllBtn = buttonContainer.createEl('button', {
            text: 'Clear All',
            cls: 'oom-button oom-button-secondary'
        });
        clearAllBtn.onclick = () => {
            this.selectedMetrics = [];
            this.refreshMetricsSelection(section);
        };
    }

    private refreshMetricsSelection(section: HTMLElement): void {
        // Re-render the metrics selection section
        section.empty();
        this.createMetricsSelection(section.parentElement!);
    }

    private getMetricDisplayName(metricKey: string): string {
        // Convert metric key to display name
        return metricKey.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    private getMetricDescription(metricKey: string): string {
        // Basic descriptions for common metrics
        const descriptions: Record<string, string> = {
            'clarity': 'How clear and vivid the dream was',
            'intensity': 'Emotional or experiential intensity of the dream',
            'recall': 'How well you remember the dream details',
            'lucidity': 'Level of awareness that you were dreaming',
            'satisfaction': 'How satisfied you felt with the dream experience'
        };
        
        return descriptions[metricKey] || `Metric: ${metricKey}`;
    }

    private createButtons(container: HTMLElement): void {
        const buttonContainer = container.createDiv('oom-modal-buttons');

        // Save button
        const saveBtn = buttonContainer.createEl('button', {
            text: 'Save Configuration',
            cls: 'oom-button oom-button-primary'
        });
        saveBtn.onclick = async () => {
            await this.saveConfiguration();
        };

        // Cancel button
        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'oom-button oom-button-secondary'
        });
        cancelBtn.onclick = () => {
            this.close();
        };

        // Reset to defaults button
        const resetBtn = buttonContainer.createEl('button', {
            text: 'Reset to Defaults',
            cls: 'oom-button oom-button-warning'
        });
        resetBtn.onclick = async () => {
            await this.resetToDefaults();
        };
    }

    private async saveConfiguration(): Promise<void> {
        try {
            // Ensure unified metrics config exists
            if (!this.plugin.settings.unifiedMetrics) {
                new Notice('Unified metrics configuration not found. Please initialize unified metrics first.');
                return;
            }

            // Update the component preferences
            const metricObjects = this.selectedMetrics.map(name => ({
                name,
                minValue: 0,
                maxValue: 10, // Default range
                weight: 1.0
            }));

            setComponentMetrics(this.plugin.settings, this.component, metricObjects);

            // Save settings
            await this.plugin.saveSettings();

            new Notice(`${this.component === 'calendar' ? 'Calendar' : 'Chart'} metrics configuration saved successfully!`);
            
            // Call the onSave callback to refresh parent UI
            this.onSave();
            
            this.close();
        } catch (error) {
            console.error('Error saving component metrics configuration:', error);
            new Notice('Error saving configuration. Please try again.');
        }
    }

    private async resetToDefaults(): Promise<void> {
        // Clear component preferences (will use defaults)
        if (this.plugin.settings.unifiedMetrics) {
            setComponentMetrics(this.plugin.settings, this.component, []);
            await this.plugin.saveSettings();
            
            new Notice(`${this.component === 'calendar' ? 'Calendar' : 'Chart'} metrics reset to defaults.`);
            this.onSave();
            this.close();
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
} 