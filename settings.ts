import { App, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, Notice } from "obsidian";
import { DEFAULT_METRICS, DreamMetric, DreamMetricsSettings } from "./types";
import DreamMetricsPlugin from "./main";

// Validation functions
function validateMetricName(name: string, existingMetrics: DreamMetric[]): string | null {
    if (!name.trim()) return "Name cannot be empty";
    if (name.length > 50) return "Name must be 50 characters or less";
    if (!/^[a-zA-Z0-9\s-]+$/.test(name)) return "Name can only contain letters, numbers, spaces, and hyphens";
    if (existingMetrics.some(m => m.name.toLowerCase() === name.toLowerCase())) {
        return "A metric with this name already exists";
    }
    return null;
}

function validateMetricRange(min: number, max: number): string | null {
    if (min < 0 || max < 0) return "Range values cannot be negative";
    if (min > max) return "Minimum value must be less than maximum value";
    if (max > 100) return "Maximum value cannot exceed 100";
    if (!Number.isInteger(min) || !Number.isInteger(max)) return "Range values must be integers";
    return null;
}

function validateMetricDescription(description: string): string | null {
    if (!description.trim()) return "Description cannot be empty";
    if (description.length > 200) return "Description must be 200 characters or less";
    return null;
}

// Metric Editor Modal
class MetricEditorModal extends Modal {
    private metric: DreamMetric;
    private onSubmit: (metric: DreamMetric) => void;
    private existingMetrics: DreamMetric[];
    private isEditing: boolean;
    private previewInterval: number;

    constructor(app: App, metric: DreamMetric, existingMetrics: DreamMetric[], onSubmit: (metric: DreamMetric) => void, isEditing: boolean = false) {
        super(app);
        this.metric = { ...metric };
        this.existingMetrics = existingMetrics;
        this.onSubmit = onSubmit;
        this.isEditing = isEditing;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-metric-editor-modal');

        contentEl.createEl('h2', { text: this.isEditing ? 'Edit Metric' : 'Add New Metric' });

        // Name field
        const nameSetting = new Setting(contentEl)
            .setName('Name')
            .setDesc('The name of the metric (letters, numbers, spaces, and hyphens only)')
            .addText(text => {
                text.setValue(this.metric.name)
                    .onChange(value => {
                        const error = validateMetricName(value, this.existingMetrics);
                        nameSetting.setDesc(error || 'The name of the metric (letters, numbers, spaces, and hyphens only)');
                        nameSetting.controlEl.classList.toggle('is-invalid', !!error);
                        this.metric.name = value;
                        this.updatePreview();
                    });
            });

        // Range fields
        const rangeSetting = new Setting(contentEl)
            .setName('Range')
            .setDesc('The valid range for this metric')
            .addText(text => {
                text.setValue(this.metric.range.min.toString())
                    .setPlaceholder('Min')
                    .onChange(value => {
                        const min = parseInt(value);
                        const error = validateMetricRange(min, this.metric.range.max);
                        rangeSetting.setDesc(error || 'The valid range for this metric');
                        rangeSetting.controlEl.classList.toggle('is-invalid', !!error);
                        if (!isNaN(min)) this.metric.range.min = min;
                        this.updatePreview();
                    });
            })
            .addText(text => {
                text.setValue(this.metric.range.max.toString())
                    .setPlaceholder('Max')
                    .onChange(value => {
                        const max = parseInt(value);
                        const error = validateMetricRange(this.metric.range.min, max);
                        rangeSetting.setDesc(error || 'The valid range for this metric');
                        rangeSetting.controlEl.classList.toggle('is-invalid', !!error);
                        if (!isNaN(max)) this.metric.range.max = max;
                        this.updatePreview();
                    });
            });

        // Description field
        const descSetting = new Setting(contentEl)
            .setName('Description')
            .setDesc('A description of what this metric measures')
            .addTextArea(text => {
                text.setValue(this.metric.description)
                    .onChange(value => {
                        const error = validateMetricDescription(value);
                        descSetting.setDesc(error || 'A description of what this metric measures');
                        descSetting.controlEl.classList.toggle('is-invalid', !!error);
                        this.metric.description = value;
                    });
            });

        // Preview
        const previewSetting = new Setting(contentEl)
            .setName('Preview')
            .setDesc('How this metric will appear in your dream journal:');
        
        const previewEl = contentEl.createEl('div', { cls: 'oom-metric-preview' });
        this.updatePreview(previewEl);

        // Keyboard shortcuts help
        const shortcutsEl = contentEl.createEl('div', { cls: 'oom-keyboard-shortcuts' });
        shortcutsEl.createEl('div', { text: 'Keyboard Shortcuts:' });
        shortcutsEl.createEl('div', { text: '• Enter: Save changes' });
        shortcutsEl.createEl('div', { text: '• Esc: Cancel' });
        shortcutsEl.createEl('div', { text: '• Tab: Next field' });
        shortcutsEl.createEl('div', { text: '• Shift+Tab: Previous field' });

        // Buttons
        const buttonContainer = contentEl.createEl('div', { cls: 'oom-metric-editor-buttons' });
        
        new ButtonComponent(buttonContainer)
            .setButtonText('Cancel')
            .onClick(() => this.close());

        new ButtonComponent(buttonContainer)
            .setButtonText(this.isEditing ? 'Save Changes' : 'Add Metric')
            .setCta()
            .onClick(() => {
                if (this.validateAll()) {
                    this.onSubmit(this.metric);
                    this.close();
                }
            });

        // Focus the name field
        const nameInput = nameSetting.controlEl.querySelector('input');
        if (nameInput) nameInput.focus();
    }

    private updatePreview(previewEl?: HTMLElement) {
        if (!previewEl) {
            const el = this.contentEl.querySelector('.oom-metric-preview');
            if (!el) return;
            previewEl = el as HTMLElement;
        }
        previewEl.empty();

        // Create callout header
        previewEl.createEl('div', { text: `> [!dream-metrics]` });

        // Create metric line with a sample value
        const sampleValue = Math.floor((this.metric.range.min + this.metric.range.max) / 2);
        previewEl.createEl('div', { text: `> ${this.metric.name}: ${sampleValue}` });

        // Add range information
        previewEl.createEl('div', { 
            cls: 'oom-preview-range',
            text: `Valid range: ${this.metric.range.min} to ${this.metric.range.max}`
        });
    }

    private validateAll(): boolean {
        const nameError = validateMetricName(this.metric.name, this.existingMetrics);
        const rangeError = validateMetricRange(this.metric.range.min, this.metric.range.max);
        const descError = validateMetricDescription(this.metric.description);

        if (nameError || rangeError || descError) {
            new Notice('Please fix all validation errors before saving');
            return false;
        }
        return true;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

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
            .addSearch(text => {
                text.setPlaceholder('Dreams/Metrics.md')
                    .setValue(this.plugin.settings.projectNotePath)
                    .onChange(async (value) => {
                        this.plugin.settings.projectNotePath = value;
                        await this.plugin.saveSettings();
                    });

                // Add file suggestions
                const inputEl = text.inputEl;
                inputEl.addClass('oom-file-suggestion');
                
                // Create suggestion container
                const suggestionContainer = containerEl.createEl('div', {
                    cls: 'suggestion-container',
                    attr: { style: 'display: none;' }
                });

                // Handle input changes
                inputEl.addEventListener('input', async (e) => {
                    const value = (e.target as HTMLInputElement).value;
                    if (!value) {
                        suggestionContainer.style.display = 'none';
                        return;
                    }

                    // Get all markdown files in the vault
                    const files = this.app.vault.getMarkdownFiles();
                    const suggestions = files
                        .map(file => file.path)
                        .filter(path => path.toLowerCase().includes(value.toLowerCase()))
                        .slice(0, 5); // Limit to 5 suggestions

                    if (suggestions.length > 0) {
                        suggestionContainer.empty();
                        suggestions.forEach(suggestion => {
                            const item = suggestionContainer.createEl('div', {
                                cls: 'suggestion-item',
                                text: suggestion
                            });
                            item.addEventListener('click', () => {
                                inputEl.value = suggestion;
                                this.plugin.settings.projectNotePath = suggestion;
                                this.plugin.saveSettings();
                                suggestionContainer.style.display = 'none';
                            });
                        });
                        suggestionContainer.style.display = 'block';
                    } else {
                        suggestionContainer.style.display = 'none';
                    }
                });

                // Hide suggestions when clicking outside
                document.addEventListener('click', (e) => {
                    if (!inputEl.contains(e.target as Node) && !suggestionContainer.contains(e.target as Node)) {
                        suggestionContainer.style.display = 'none';
                    }
                });
            });

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
                .addExtraButton(button => {
                    const handle = button
                        .setIcon('grip-vertical')
                        .setTooltip('Drag to reorder')
                        .extraSettingsEl;
                    
                    handle.addClass('oom-drag-handle');
                    handle.setAttribute('draggable', 'true');
                    
                    // Drag start
                    handle.addEventListener('dragstart', (e: DragEvent) => {
                        if (e.dataTransfer) {
                            e.dataTransfer.setData('text/plain', index.toString());
                            handle.addClass('is-dragging');
                        }
                    });

                    // Drag end
                    handle.addEventListener('dragend', () => {
                        handle.removeClass('is-dragging');
                    });
                });

            // Add drop zone
            const settingEl = metricSetting.settingEl;
            settingEl.setAttribute('data-index', index.toString());
            
            settingEl.addEventListener('dragover', (e: DragEvent) => {
                e.preventDefault();
                const draggingEl = containerEl.querySelector('.is-dragging');
                if (draggingEl && draggingEl !== settingEl) {
                    settingEl.addClass('oom-drop-target');
                }
            });

            settingEl.addEventListener('dragleave', () => {
                settingEl.removeClass('oom-drop-target');
            });

            settingEl.addEventListener('drop', async (e: DragEvent) => {
                e.preventDefault();
                settingEl.removeClass('oom-drop-target');
                
                const fromIndex = parseInt(e.dataTransfer?.getData('text/plain') || '-1');
                const toIndex = parseInt(settingEl.getAttribute('data-index') || '-1');
                
                if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                    const metrics = this.plugin.settings.metrics;
                    const [movedMetric] = metrics.splice(fromIndex, 1);
                    metrics.splice(toIndex, 0, movedMetric);
                    await this.plugin.saveSettings();
                    this.display();
                }
            });

            // Add up/down buttons for reordering
            if (index > 0) {
                metricSetting.addExtraButton(button => button
                    .setIcon('arrow-up')
                    .setTooltip('Move up')
                    .onClick(async () => {
                        const metrics = this.plugin.settings.metrics;
                        [metrics[index], metrics[index - 1]] = [metrics[index - 1], metrics[index]];
                        await this.plugin.saveSettings();
                        this.display();
                    }));
            }

            if (index < this.plugin.settings.metrics.length - 1) {
                metricSetting.addExtraButton(button => button
                    .setIcon('arrow-down')
                    .setTooltip('Move down')
                    .onClick(async () => {
                        const metrics = this.plugin.settings.metrics;
                        [metrics[index], metrics[index + 1]] = [metrics[index + 1], metrics[index]];
                        await this.plugin.saveSettings();
                        this.display();
                    }));
            }

            metricSetting
                .addExtraButton(button => button
                    .setIcon('pencil')
                    .setTooltip('Edit metric')
                    .onClick(() => {
                        new MetricEditorModal(
                            this.app,
                            metric,
                            this.plugin.settings.metrics,
                            async (updatedMetric) => {
                                this.plugin.settings.metrics[index] = updatedMetric;
                                await this.plugin.saveSettings();
                                this.display();
                            },
                            true
                        ).open();
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
                .onClick(() => {
                    new MetricEditorModal(
                        this.app,
                        {
                            name: 'New Metric',
                            range: { min: 1, max: 5 },
                            description: 'Description of the metric'
                        },
                        this.plugin.settings.metrics,
                        async (newMetric) => {
                            this.plugin.settings.metrics.push(newMetric);
                            await this.plugin.saveSettings();
                            this.display();
                        }
                    ).open();
                }));

        // Reset to Defaults Button
        new Setting(containerEl)
            .setName('Reset to Defaults')
            .setDesc('Restore default metrics while preserving custom metrics')
            .addButton(button => button
                .setButtonText('Reset')
                .onClick(async () => {
                    // Get names of default metrics
                    const defaultMetricNames = DEFAULT_METRICS.map(m => m.name.toLowerCase());
                    
                    // Filter out default metrics
                    const customMetrics = this.plugin.settings.metrics.filter(
                        m => !defaultMetricNames.includes(m.name.toLowerCase())
                    );
                    
                    // Combine default metrics with custom ones
                    this.plugin.settings.metrics = [...DEFAULT_METRICS, ...customMetrics];
                    
                    await this.plugin.saveSettings();
                    this.display();
                }));
    }
} 