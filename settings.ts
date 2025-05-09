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
                    attr: { style: 'display: none; position: absolute; z-index: 100; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; max-height: 200px; overflow-y: auto; min-width: 180px;' }
                });

                // Helper to position the dropdown
                function positionSuggestionContainer() {
                    const inputRect = inputEl.getBoundingClientRect();
                    const modalEl = containerEl.closest('.modal') as HTMLElement;
                    const modalRect = modalEl ? modalEl.getBoundingClientRect() : containerEl.getBoundingClientRect();
                    const dropdownWidth = Math.max(inputRect.width, 180);
                    let left = inputRect.left - modalRect.left;
                    let top = inputRect.bottom - modalRect.top;
                    let maxWidth = modalRect.width;

                    // Default: align left edge of dropdown with input
                    suggestionContainer.style.position = 'absolute';
                    suggestionContainer.style.left = `${left}px`;
                    suggestionContainer.style.right = '';
                    suggestionContainer.style.maxWidth = `${maxWidth}px`;

                    // If dropdown would overflow modal to the right, align right edge with modal
                    if (left + dropdownWidth > modalRect.width) {
                        suggestionContainer.style.left = 'auto';
                        suggestionContainer.style.right = '0';
                    }

                    suggestionContainer.style.top = `${top}px`;
                    suggestionContainer.style.width = `${dropdownWidth}px`;
                    suggestionContainer.style.overflowX = 'auto';
                }

                // Normalize function (lowercase, collapse whitespace)
                function normalize(str: string) {
                    return str.toLowerCase().replace(/\s+/g, '');
                }

                // Handle input changes
                inputEl.addEventListener('input', async (e) => {
                    const value = (e.target as HTMLInputElement).value;
                    if (!value) {
                        suggestionContainer.style.display = 'none';
                        return;
                    }

                    // Get all markdown files in the vault
                    const files = this.app.vault.getMarkdownFiles();
                    const lowerInput = value.toLowerCase();
                    const normalizedInput = normalize(value);

                    const suggestions = files
                        .map(file => file.path)
                        .filter(path => {
                            const lowerPath = path.toLowerCase();
                            const normalizedPath = normalize(path);
                            // Split path into segments by / and space
                            const segments = lowerPath.split(/[\/ ]+/);
                            // Match if input is in the full path, any segment, or the normalized path
                            return (
                                lowerPath.includes(lowerInput) ||
                                segments.some(segment => segment.includes(lowerInput)) ||
                                normalizedPath.includes(normalizedInput)
                            );
                        })
                        .slice(0, 5); // Limit to 5 suggestions

                    // Debug output
                    console.log('[OneiroMetrics] Autocomplete input:', value);
                    console.log('[OneiroMetrics] Suggestions:', suggestions);

                    if (suggestions.length > 0) {
                        suggestionContainer.empty();
                        suggestions.forEach(suggestion => {
                            const item = suggestionContainer.createEl('div', {
                                cls: 'suggestion-item',
                                attr: { 
                                    title: suggestion
                                },
                                text: suggestion
                            });
                            // Highlight matching text
                            const regex = new RegExp(`(${value})`, 'gi');
                            item.innerHTML = suggestion.replace(regex, '<strong>$1</strong>');
                            item.addEventListener('mouseover', () => {
                                item.style.backgroundColor = 'var(--background-modifier-hover)';
                            });
                            item.addEventListener('mouseout', () => {
                                item.style.backgroundColor = '';
                            });
                            item.addEventListener('click', () => {
                                inputEl.value = suggestion;
                                this.plugin.settings.projectNotePath = suggestion;
                                this.plugin.saveSettings();
                                suggestionContainer.style.display = 'none';
                            });
                        });
                        suggestionContainer.style.display = 'block';
                        positionSuggestionContainer();
                    } else {
                        suggestionContainer.style.display = 'none';
                    }
                });

                // Handle keyboard navigation
                inputEl.addEventListener('keydown', (e) => {
                    const items = suggestionContainer.querySelectorAll('.suggestion-item');
                    const currentIndex = Array.from(items).findIndex(item => item.classList.contains('is-selected'));
                    
                    switch (e.key) {
                        case 'ArrowDown':
                            e.preventDefault();
                            if (currentIndex < items.length - 1) {
                                items[currentIndex]?.classList.remove('is-selected');
                                items[currentIndex + 1].classList.add('is-selected');
                                items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
                            }
                            break;
                        case 'ArrowUp':
                            e.preventDefault();
                            if (currentIndex > 0) {
                                items[currentIndex]?.classList.remove('is-selected');
                                items[currentIndex - 1].classList.add('is-selected');
                                items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
                            }
                            break;
                        case 'Enter':
                            e.preventDefault();
                            const selectedItem = suggestionContainer.querySelector('.is-selected');
                            if (selectedItem) {
                                const path = selectedItem.textContent;
                                if (path) {
                                    inputEl.value = path;
                                    this.plugin.settings.projectNotePath = path;
                                    this.plugin.saveSettings();
                                    suggestionContainer.style.display = 'none';
                                }
                            }
                            break;
                        case 'Escape':
                            suggestionContainer.style.display = 'none';
                            break;
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
            .setDesc('Notes to search for dream metrics (select one or more)')
            .addExtraButton(button => {
                // No-op, just for layout
            });

        // Multi-select autocomplete for Selected Notes
        const selectedNotesContainer = containerEl.createEl('div', { cls: 'oom-multiselect-container' });
        const chipsContainer = selectedNotesContainer.createEl('div', { cls: 'oom-chips-container' });
        const input = selectedNotesContainer.createEl('input', {
            type: 'text',
            cls: 'oom-multiselect-input',
            attr: { placeholder: 'Type to search notes...' }
        });
        const suggestionContainer = selectedNotesContainer.createEl('div', {
            cls: 'suggestion-container',
            attr: { style: 'display: none; position: absolute; z-index: 100; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; max-height: 200px; overflow-y: auto; min-width: 180px;' }
        });

        // Render chips for selected notes
        function renderChips() {
            chipsContainer.empty();
            for (const note of this.plugin.settings.selectedNotes) {
                const chip = chipsContainer.createEl('span', { cls: 'oom-chip', text: note });
                chip.setAttr('title', note);
                const removeBtn = chip.createEl('span', { cls: 'oom-chip-remove', text: '×' });
                removeBtn.onclick = () => {
                    this.plugin.settings.selectedNotes = this.plugin.settings.selectedNotes.filter((n: string) => n !== note);
                    this.plugin.saveSettings();
                    renderChips.call(this);
                };
            }
        }
        renderChips.call(this);

        // Suggestion logic
        input.addEventListener('input', async (e) => {
            const value = input.value;
            if (!value) {
                suggestionContainer.style.display = 'none';
                return;
            }
            const files = this.app.vault.getMarkdownFiles();
            const lowerInput = value.toLowerCase();
            const suggestions = files
                .map(file => file.path)
                .filter(path =>
                    !this.plugin.settings.selectedNotes.includes(path) &&
                    path.toLowerCase().includes(lowerInput)
                )
                .slice(0, 7);
            suggestionContainer.empty();
            if (suggestions.length > 0) {
                for (const suggestion of suggestions) {
                    const item = suggestionContainer.createEl('div', {
                        cls: 'suggestion-item',
                        attr: { title: suggestion },
                        text: suggestion
                    });
                    item.onclick = () => {
                        this.plugin.settings.selectedNotes.push(suggestion);
                        this.plugin.saveSettings();
                        input.value = '';
                        suggestionContainer.style.display = 'none';
                        renderChips.call(this);
                    };
                }
                suggestionContainer.style.display = 'block';
            } else {
                suggestionContainer.style.display = 'none';
            }
        });
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target as Node) && !suggestionContainer.contains(e.target as Node)) {
                suggestionContainer.style.display = 'none';
            }
        });
        // Keyboard navigation for suggestions
        input.addEventListener('keydown', (e) => {
            const items = suggestionContainer.querySelectorAll('.suggestion-item');
            const currentIndex = Array.from(items).findIndex(item => item.classList.contains('is-selected'));
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < items.length - 1) {
                        items[currentIndex]?.classList.remove('is-selected');
                        items[currentIndex + 1].classList.add('is-selected');
                        items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
                    } else if (items.length > 0 && currentIndex === -1) {
                        items[0].classList.add('is-selected');
                        items[0].scrollIntoView({ block: 'nearest' });
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        items[currentIndex]?.classList.remove('is-selected');
                        items[currentIndex - 1].classList.add('is-selected');
                        items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const selectedItem = suggestionContainer.querySelector('.is-selected');
                    if (selectedItem) {
                        const path = selectedItem.textContent;
                        if (path) {
                            this.plugin.settings.selectedNotes.push(path);
                            this.plugin.saveSettings();
                            input.value = '';
                            suggestionContainer.style.display = 'none';
                            renderChips.call(this);
                        }
                    }
                    break;
                case 'Escape':
                    suggestionContainer.style.display = 'none';
                    break;
            }
        });

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