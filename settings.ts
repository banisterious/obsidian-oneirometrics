import { App, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, Notice, TFile, TFolder, ExtraButtonComponent, MarkdownRenderer, getIcon, DropdownComponent, ToggleComponent, Scope } from "obsidian";
import { DEFAULT_METRICS, DreamMetricsSettings, LogLevel } from "./types";
import { DreamMetric, SelectionMode } from "./src/types/core";
import DreamMetricsPlugin from "./main";
import { Eye, Heart, CircleMinus, PenTool, CheckCircle, UsersRound, UserCog, Users, UserCheck, UserX, Sparkles, Wand2, Zap, Glasses, Link, Ruler, Layers } from 'lucide-static';
import { debug, info, error } from './src/logging';
import { ModalsManager } from './src/dom/modals/ModalsManager';
import { defaultLintingSettings } from './src/types/journal-check-defaults';

// Define the correct order for recommended metrics
export const RECOMMENDED_METRICS_ORDER = [
  'Sensory Detail',
  'Emotional Recall',
  'Lost Segments',
  'Descriptiveness',
  'Confidence Score'
];

// Define the correct order for disabled metrics
export const DISABLED_METRICS_ORDER = [
  'Words',
  'Dream Theme',
  'Dream Coherence',
  'Lucidity Level',
  'Character Roles',
  'Characters Count',
  'Characters List',
  'Familiar Count',
  'Unfamiliar Count',
  'Character Clarity/Familiarity',
  'Environmental Familiarity',
  'Ease of Recall',
  'Recall Stability'
];

// Import settings helpers
import { 
    getProjectNotePath, 
    setProjectNotePath,
    getSelectedFolder, 
    setSelectedFolder,
    isBackupEnabled,
    setBackupEnabled,
    getBackupFolderPath,
    setBackupFolderPath,
    shouldShowRibbonButtons,
    setShowRibbonButtons,
    getSelectionMode,
    setSelectionMode,
    getLogMaxSize
} from './src/utils/settings-helpers';

// Import metric helpers
import {
    isMetricEnabled,
    setMetricEnabled,
    getMetricMinValue,
    getMetricMaxValue,
    setMetricRange,
    getMetricRange,
    standardizeMetric,
    createCompatibleMetric
} from './src/utils/metric-helpers';

// Import selection mode helpers
import {
    isFolderMode,
    isNotesMode,
    areSelectionModesEquivalent,
    getSelectionModeLabel,
    normalizeSelectionMode
} from './src/utils/selection-mode-helpers';

// Import SettingsAdapter
import { SettingsAdapter } from './src/state/adapters/SettingsAdapter';

// Import utilities 
import { createSelectedNotesAutocomplete } from './autocomplete';

import { JournalStructureSettings as LintingSettings } from './src/types/journal-check';

interface IconCategory {
    name: string;
    description: string;
    icons: Record<string, string>;
}

export const iconCategories: IconCategory[] = [
    {
        name: "Metrics",
        description: "Icons for core metrics",
        icons: {
            eye: Eye,
            heart: Heart,
            'circle-minus': CircleMinus,
            'pen-tool': PenTool,
            'check-circle': CheckCircle,
            sparkles: Sparkles,
            'wand-2': Wand2,
            zap: Zap,
            glasses: Glasses,
            link: Link,
            ruler: Ruler,
            layers: Layers
        }
    },
    {
        name: "Characters",
        description: "Icons for character-related metrics",
        icons: {
            'user-cog': UserCog,
            users: Users,
            'user-check': UserCheck,
            'user-x': UserX,
            'users-round': UsersRound
        }
    }
];

// For backward compatibility
export const lucideIconMap: Record<string, string> = Object.assign({}, 
    ...iconCategories.map(category => category.icons)
);

// Helper function to ensure a metric has all required properties
// Uses standardizeMetric under the hood to ensure proper type compatibility
function ensureCompleteMetric(metric: Partial<DreamMetric>): DreamMetric {
    // Start with at least these required properties
    const metricWithRequired = {
        name: metric.name || '',
        icon: metric.icon || '',
        minValue: metric.minValue || 1,
        maxValue: metric.maxValue || 5,
        description: metric.description || '',
        enabled: metric.enabled !== undefined ? metric.enabled : true
    };
    
    // Let standardizeMetric handle all the normalization
    return standardizeMetric(metricWithRequired);
}

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
        // Create a complete metric with all required properties
        // Then standardize it for consistency
        this.metric = ensureCompleteMetric(metric);
        this.existingMetrics = existingMetrics;
        this.onSubmit = onSubmit;
        this.isEditing = isEditing;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-metric-editor-modal');

        contentEl.createEl('h2', { text: this.isEditing ? 'Edit Metric' : 'Add New Metric', cls: 'oom-modal-title' });

        const nameSection = contentEl.createEl('div', { cls: 'oom-metric-editor-section' });
        const nameSetting = new Setting(nameSection)
            .setName('Name')
            .setDesc('The name of the metric (letters, numbers, spaces, and hyphens only)')
            .addText(text => {
                text.setValue(this.metric.name)
                    .onChange(value => {
                        const error = validateMetricName(value, this.existingMetrics);
                        nameSetting.setDesc(error || 'The name of the metric (letters, numbers, spaces, and hyphens only)');
                        nameSetting.controlEl.classList.toggle('is-invalid', !!error);
                        this.metric.name = value;
                        renderRangeSection();
                        this.updatePreview();
                    });
            });

        const iconSection = contentEl.createEl('div', { cls: 'oom-metric-editor-section' });
        const iconPickerContainer = contentEl.createEl('div', { cls: 'oom-icon-picker-container' });
        
        // Add search bar
        const searchContainer = iconPickerContainer.createEl('div', { cls: 'oom-icon-picker-search' });
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search icons...',
            cls: 'oom-icon-picker-search-input'
        });

        // Add category tabs
        const categoryTabs = iconPickerContainer.createEl('div', { cls: 'oom-icon-picker-tabs' });
        iconCategories.forEach((category, index) => {
            const tab = categoryTabs.createEl('button', {
                cls: 'oom-icon-picker-tab',
                text: category.name,
                attr: { type: 'button' }
            });
            if (index === 0) tab.classList.add('active');
            tab.onclick = () => {
                categoryTabs.querySelectorAll('.oom-icon-picker-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderIconGrid(category);
            };
        });

        // Create icon grid container
        const iconGrid = iconPickerContainer.createEl('div', { cls: 'oom-icon-picker-grid' });

        // Function to render icons for a category
        const renderIconGrid = (category: IconCategory) => {
            iconGrid.empty();
            Object.entries(category.icons).forEach(([iconName, iconSVG]: [string, string]) => {
                const iconBtn = iconGrid.createEl('button', {
                    cls: 'oom-icon-picker-btn',
                    attr: { 
                        type: 'button',
                        'aria-label': iconName,
                        'data-icon-name': iconName
                    }
                });
                iconBtn.innerHTML = iconSVG;
                if (this.metric.icon === iconName) iconBtn.classList.add('selected');
                iconBtn.onclick = () => {
                    this.metric.icon = String(iconName);
                    Array.from(iconGrid.children).forEach(btn => btn.classList.remove('selected'));
                    iconBtn.classList.add('selected');
                    this.updatePreview();
                };
            });
        };

        // Initial render of first category
        renderIconGrid(iconCategories[0]);

        // Add search functionality
        searchInput.oninput = (e) => {
            const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
            const allIcons = Object.assign({}, ...iconCategories.map(category => category.icons));
            
            iconGrid.empty();
            Object.entries(allIcons).forEach(([iconName, iconSVG]: [string, string]) => {
                if (iconName.toLowerCase().includes(searchTerm)) {
                    const iconBtn = iconGrid.createEl('button', {
                        cls: 'oom-icon-picker-btn',
                        attr: { 
                            type: 'button',
                            'aria-label': iconName,
                            'data-icon-name': iconName
                        }
                    });
                    iconBtn.innerHTML = iconSVG;
                    if (this.metric.icon === iconName) iconBtn.classList.add('selected');
                    iconBtn.onclick = () => {
                        this.metric.icon = String(iconName);
                        Array.from(iconGrid.children).forEach(btn => btn.classList.remove('selected'));
                        iconBtn.classList.add('selected');
                        this.updatePreview();
                    };
                }
            });
        };

        // Add clear button
        const clearBtn = iconPickerContainer.createEl('button', {
            cls: 'oom-icon-picker-clear',
            text: 'No icon',
            attr: { type: 'button' }
        });
        clearBtn.onclick = () => {
            this.metric.icon = '';
            Array.from(iconGrid.children).forEach(btn => btn.classList.remove('selected'));
            this.updatePreview();
        };

        const rangeSection = contentEl.createEl('div', { cls: 'oom-metric-editor-section' });
        let rangeSetting: Setting | null = null;
        const renderRangeSection = () => {
            const { min, max } = getMetricRange(this.metric);
            
            rangeSetting = new Setting(rangeSection)
                .setName('Range')
                .setDesc('The valid range for this metric')
                .addText(text => {
                    text.setValue(min.toString())
                        .setPlaceholder('Min')
                        .onChange(value => {
                            const minVal = parseInt(value);
                            const error = validateMetricRange(minVal, getMetricMaxValue(this.metric));
                            rangeSetting!.setDesc(error || 'The valid range for this metric');
                            rangeSetting!.controlEl.classList.toggle('is-invalid', !!error);
                            if (!isNaN(minVal)) {
                                setMetricRange(this.metric, minVal, getMetricMaxValue(this.metric));
                            }
                            this.updatePreview();
                        });
                })
                .addText(text => {
                    text.setValue(max.toString())
                        .setPlaceholder('Max')
                        .onChange(value => {
                            const maxVal = parseInt(value);
                            const error = validateMetricRange(getMetricMinValue(this.metric), maxVal);
                            rangeSetting!.setDesc(error || 'The valid range for this metric');
                            rangeSetting!.controlEl.classList.toggle('is-invalid', !!error);
                            if (!isNaN(maxVal)) {
                                setMetricRange(this.metric, getMetricMinValue(this.metric), maxVal);
                            }
                            this.updatePreview();
                        });
                });
        };
        renderRangeSection();

        const descSection = contentEl.createEl('div', { cls: 'oom-metric-editor-section' });
        const descSetting = new Setting(descSection)
            .setName('Description')
            .setDesc('A description of what this metric measures')
            .addTextArea(text => {
                text.setValue(this.metric.description)
                    .onChange(value => {
                        const error = validateMetricDescription(value);
                        descSetting.setDesc(error || 'A description of what this metric measures');
                        descSetting.controlEl.classList.toggle('is-invalid', !!error);
                        this.metric.description = value;
                        this.updatePreview();
                    });
            });

        // Enabled toggle
        new Setting(contentEl.createEl('div', { cls: 'oom-metric-editor-section' }))
            .setName('Enabled')
            .setDesc('Whether this metric is visible in the UI')
            .addToggle(toggle => {
                toggle
                    .setValue(isMetricEnabled(this.metric))
                    .onChange(value => {
                        setMetricEnabled(this.metric, value);
                        this.updatePreview();
                    });
            });

        const previewSection = contentEl.createEl('div', { cls: 'oom-metric-editor-section' });
        const previewSetting = new Setting(previewSection)
            .setName('Preview')
            .setDesc('How this metric will appear in your dream journal:');
        const previewEl = previewSection.createEl('div', { cls: 'oom-metric-preview' });
        this.updatePreview(previewEl);

        // Keyboard shortcuts help
        const shortcutsEl = contentEl.createEl('div', { cls: 'oom-keyboard-shortcuts' });
        shortcutsEl.createEl('div', { text: 'Keyboard Shortcuts:' });
        shortcutsEl.createEl('div', { text: '• Enter: Save changes' });
        shortcutsEl.createEl('div', { text: '• Esc: Cancel' });
        shortcutsEl.createEl('div', { text: '• Tab: Next field' });
        shortcutsEl.createEl('div', { text: '• Shift+Tab: Previous field' });

        // Buttons
        const buttonContainer = contentEl.createEl('div', { cls: 'oom-modal-button-container oom-metric-editor-buttons' });
        
        const cancelBtn = new ButtonComponent(buttonContainer)
            .setButtonText('Cancel');
        cancelBtn.buttonEl.classList.add('oom-modal-button');
        cancelBtn.onClick(() => this.close());

        const saveBtn = new ButtonComponent(buttonContainer)
            .setButtonText(this.isEditing ? 'Save Changes' : 'Add Metric')
            .setCta();
        saveBtn.buttonEl.classList.add('oom-modal-button');
        saveBtn.onClick(() => {
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
            previewEl = document.querySelector('.oom-metric-preview');
        }
        
        if (!previewEl) return;
        
        previewEl.empty();
        
        // Create preview header
        previewEl.createEl('h3', { text: 'Preview' });
        
        // Create metric line with a sample value, including icon if present
        const range = getMetricRange(this.metric);
        const sampleValue = Math.floor((range.min + range.max) / 2);
        const metricLine = previewEl.createEl('div', { cls: 'oom-metric-preview-line' });
        if (this.metric.icon && lucideIconMap[this.metric.icon]) {
            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = lucideIconMap[this.metric.icon];
            iconSpan.className = 'oom-metric-icon';
            metricLine.appendChild(iconSpan);
        }
        
        metricLine.createEl('span', {
            cls: 'oom-metric-name',
            text: this.metric.name + ': '
        });
        
        metricLine.createEl('span', {
            cls: 'oom-metric-value',
            text: sampleValue.toString()
        });
        
        if (this.metric.description) {
            previewEl.createEl('div', {
                cls: 'oom-preview-description',
                text: this.metric.description
            });
        }
        
        // Show range
        if (range.min !== undefined && range.max !== undefined) {
            previewEl.createEl('div', {
                cls: 'oom-preview-range',
                text: `Valid range: ${range.min} to ${range.max}`
            });
        }
    }

    private validateAll(): boolean {
        const nameError = validateMetricName(this.metric.name, this.existingMetrics);
        const rangeError = validateMetricRange(
            getMetricMinValue(this.metric), 
            getMetricMaxValue(this.metric)
        );
        const descError = validateMetricDescription(this.metric.description);

        if (nameError || rangeError || descError) {
            return false;
        }

        return true;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Add debounce utility function
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export class DreamMetricsSettingTab extends PluginSettingTab {
    id = 'oneirometrics';
    plugin: DreamMetricsPlugin;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('oneirometrics-settings');

        const prevScroll = containerEl.scrollTop;
        const activeElement = document.activeElement as HTMLElement;
        let focusSelector = '';
        if (activeElement && containerEl.contains(activeElement)) {
            if (activeElement.classList.contains('oom-drag-handle')) {
                focusSelector = `.oom-drag-handle[data-index="${activeElement.closest('.setting')?.getAttribute('data-index')}"]`;
            } else if (activeElement.classList.contains('setting-action')) {
                focusSelector = '.setting-action';
            }
        }

        containerEl.createEl('h2', { text: 'OneiroMetrics Settings' });

        // Add Reading View requirement notice with contextual styling
        const noticeEl = containerEl.createEl('div', {
            cls: 'oom-notice oom-notice--info'
        });
        noticeEl.createEl('strong', { text: 'Note: ' });
        noticeEl.createEl('span', { 
            text: 'OneiroMetrics is optimized for Reading View mode. While Live Preview is supported, you may experience some layout inconsistencies.'
        });

        // Ribbon buttons setting
        new Setting(containerEl)
            .setName('Show Ribbon Buttons')
            .setDesc('Add ribbon button for opening the Dream Journal Manager')
            .addToggle(toggle => toggle
                .setValue(shouldShowRibbonButtons(this.plugin.settings))
                .onChange(async (value) => {
                    setShowRibbonButtons(this.plugin.settings, value);
                    await this.plugin.saveSettings();
                    this.plugin.updateRibbonIcons();
                }));

        // OneiroMetrics Note Setting with Obsidian's built-in search like Templater
        const oneiroMetricsNoteSetting = new Setting(containerEl)
            .setName('OneiroMetrics Note')
            .setDesc('The note where OneiroMetrics tables will be written')
            .addSearch(search => {
                search.setPlaceholder('Example: Journals/Dream Diary/Metrics/Metrics.md')
                    .setValue(getProjectNotePath(this.plugin.settings))
                    .onChange(async (value) => {
                        setProjectNotePath(this.plugin.settings, value);
                        await this.plugin.saveSettings();
                    });
                
                // Add file suggestions
                new FileSuggest(this.app, search.inputEl);
            });

        // Add section border after basic settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Selection Mode (renamed from "Select Notes/Folders" section)
        const selectionModeSetting = new Setting(containerEl)
            .setName('Select Notes/Folders')
            .setDesc('How to select notes for analyzing')
            .addDropdown(drop => {
                drop.addOption('notes', 'Selected Notes');
                drop.addOption('folder', 'Selected Folder');
                
                // Use the UI representation (notes/folder)
                const settingsAdapter = new SettingsAdapter(this.plugin.settings);
                const selectionMode = getSelectionMode(this.plugin.settings);
                // Convert internal mode (manual/automatic) to UI mode (notes/folder)
                const uiMode = normalizeSelectionMode(selectionMode) === 'manual' ? 'notes' : 'folder';
                drop.setValue(uiMode);
                
                drop.onChange(async (value) => {
                    // Convert to internal representation (manual/automatic)
                    // 'notes' -> 'manual', 'folder' -> 'automatic'
                    const internalMode = value === 'notes' ? 'manual' : 'automatic';
                    this.plugin.settings.selectionMode = internalMode;
                    
                    // Clear irrelevant selection when switching modes
                    if (isFolderMode(value as SelectionMode)) {
                        this.plugin.settings.selectedNotes = [];
                    } else {
                        setSelectedFolder(this.plugin.settings, '');
                    }
                    await this.plugin.saveSettings();
                    this.display();
                });
            });

        // Dynamic label and field based on selection mode
        const selectionMode = getSelectionMode(this.plugin.settings);
        // Convert internal mode (manual/automatic) to UI mode (notes/folder)
        const uiMode = normalizeSelectionMode(selectionMode) === 'manual' ? 'notes' : 'folder';
        const selectionLabel = getSelectionModeLabel(uiMode);
        const selectionDesc = getSelectionModeDescription(uiMode);
        
        const selectionSetting = new Setting(containerEl)
            .setName(selectionLabel)
            .setDesc(selectionDesc);

        if (isFolderMode(uiMode as SelectionMode)) {
            // Use Obsidian's built-in search like Templater
            selectionSetting.addSearch(search => {
                search.setPlaceholder('Choose folder...')
                    .setValue(getSelectedFolder(this.plugin.settings))
                    .onChange(async (value) => {
                        setSelectedFolder(this.plugin.settings, value);
                        await this.plugin.saveSettings();
                    });
                
                // Add folder suggestions
                new FolderSuggest(this.app, search.inputEl);
            });
        } else {
            // Multi-chip note autocomplete
            const searchFieldContainer = containerEl.createEl('div', { cls: 'oom-multiselect-search-container' });
            const chipsContainer = containerEl.createEl('div', { cls: 'oom-multiselect-chips-container' });
            chipsContainer.style.display = (this.plugin.settings.selectedNotes && this.plugin.settings.selectedNotes.length > 0) ? '' : 'none';
            createSelectedNotesAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: searchFieldContainer,
                selectedNotes: this.plugin.settings.selectedNotes,
                onChange: (selected) => {
                    this.plugin.settings.selectedNotes = selected;
                    chipsContainer.style.display = (selected && selected.length > 0) ? '' : 'none';
                    this.plugin.saveSettings();
                }
            });
            // Fix: append the search field to the setting's control element
            selectionSetting.controlEl.appendChild(searchFieldContainer);
        }

        // Add section border after selection settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Journal Structure Check settings
        this.addJournalStructureSettings(containerEl);
        
        // Add section border after journal structure settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Metrics Settings Section
        containerEl.createEl('h2', { text: 'Metrics Settings' });

        // Add explanatory note about metrics
        const metricsInfoEl = containerEl.createEl('div', {
            cls: 'oom-notice oom-notice--info'
        });
        metricsInfoEl.createEl('span', { 
            text: 'Metrics allow you to track and analyze various aspects of your dreams over time. Enable the metrics you want to track, and customize them to suit your needs.'
        });

        // Add button to view metrics descriptions
        new Setting(containerEl)
            .setName('View Metrics Descriptions')
            .setDesc('View detailed descriptions of all available metrics')
            .addButton(button => {
                button.setButtonText('View Metrics Guide')
                    .onClick(() => {
                        // Close the settings modal first
                        (this.app as any).setting.close();
                        
                        // Use ModalsManager instead of the removed showMetricsTabsModal method
                        const modalsManager = new ModalsManager(this.app, this.plugin, null);
                        modalsManager.openHubModal();
                    });
            });

        // Create a dedicated "Add Metric" section
        const addMetricSection = new Setting(containerEl)
            .setName('Add Metric')
            .setDesc('Create a custom metric to track additional aspects of your dreams');
        
        // Add the button to the right side of the section
        addMetricSection.addButton(button => {
            button
                .setButtonText('Add Metric')
                .onClick(() => {
                    new MetricEditorModal(
                        this.app,
                        {
                            name: '',
                            icon: '',
                            minValue: 1,
                            maxValue: 5,
                            description: '',
                            enabled: true
                        },
                        Object.values(this.plugin.settings.metrics),
                        async (metric) => {
                            // Create a standardized metric with all required properties
                            const metricTemplate = DEFAULT_METRICS[metric.name] || {};
                            // Merge the template with our metric and ensure all required properties
                            const metricData = {
                                ...metricTemplate,
                                name: metric.name,
                                enabled: true,
                                icon: metricTemplate.icon || 'help-circle',
                                minValue: metricTemplate.minValue || 1,
                                maxValue: metricTemplate.maxValue || 5,
                                description: metricTemplate.description || ''
                            };
                            // Use our helper to ensure the metric is complete
                            metric = ensureCompleteMetric(metricData);
                            this.plugin.settings.metrics[metric.name] = metric;
                            await this.plugin.saveSettings();
                            this.display();
                        }
                    ).open();
                });
        });
        
        // Helper function to add metric toggles
        const addMetricToggle = (metric: DreamMetric, key: string, container: HTMLElement) => {
            const metricSetting = new Setting(container)
                .setName(metric.name)
                .setDesc(metric.description || '')
                .addToggle(toggle => {
                    toggle.setValue(isMetricEnabled(metric))
                        .onChange(async (value) => {
                            setMetricEnabled(metric, value);
                            await this.plugin.saveSettings();
                            this.display();
                        });
                })
                .addExtraButton(button => {
                    button.setIcon('pencil')
                        .setTooltip('Edit metric')
                        .onClick(() => {
                            new MetricEditorModal(
                                this.app,
                                { ...metric },
                                Object.values(this.plugin.settings.metrics),
                                async (updatedMetric) => {
                                    // Use our helper to ensure the metric is complete
                                    const completeUpdatedMetric = ensureCompleteMetric(updatedMetric);
                                    this.plugin.settings.metrics[updatedMetric.name] = completeUpdatedMetric;
                                    // If the name was changed, remove the old key
                                    if (updatedMetric.name !== key) {
                                        delete this.plugin.settings.metrics[key];
                                    }
                                    await this.plugin.saveSettings();
                                    this.display();
                                },
                                true // isEditing
                            ).open();
                        });
                })
                .addExtraButton(button => {
                    button.setIcon('trash')
                        .setTooltip('Delete metric')
                        .onClick(() => {
                            delete this.plugin.settings.metrics[key];
                            this.plugin.saveSettings();
                            this.display();
                        });
                });
                
            // Add drag handle
            const dragHandle = metricSetting.controlEl.createEl('div', {
                cls: 'oom-drag-handle',
                attr: { 'data-index': key }
            });
            dragHandle.innerHTML = '⋮⋮';
        };

        // Group metrics by enabled status
        const groupedMetrics = {
            enabled: [] as [string, DreamMetric][],
            disabled: [] as [string, DreamMetric][]
        };

        // Function to check if a metric should be displayed in settings
        const shouldDisplayInSettings = (metric: DreamMetric): boolean => {
            // Skip the Words metric as it's a calculated value
            return metric.name !== 'Words';
        };

        // Sort into enabled/disabled groups
        Object.entries(this.plugin.settings.metrics || {}).forEach(([key, metric]) => {
            // Only include metrics that should be displayed in settings
            if (shouldDisplayInSettings(metric)) {
                const group = isMetricEnabled(metric) ? groupedMetrics.enabled : groupedMetrics.disabled;
                group.push([key, metric]);
            }
        });

        // Log metrics information
        debug('Settings', 'Metrics summary', {
            total: Object.keys(this.plugin.settings.metrics || {}).length,
            enabled: groupedMetrics.enabled.length,
            disabled: groupedMetrics.disabled.length,
            enabledMetrics: groupedMetrics.enabled.map(([key, m]) => m.name).join(', '),
            disabledMetrics: groupedMetrics.disabled.map(([key, m]) => m.name).join(', ')
        });

        // Debug logging for metric groups is redundant, already captured above

        // Sort metrics by the predefined order rather than alphabetically
        if (groupedMetrics.enabled.length > 0) {
            groupedMetrics.enabled = sortMetricEntriesByOrder(
                groupedMetrics.enabled, 
                RECOMMENDED_METRICS_ORDER
            );
        }

        if (groupedMetrics.disabled.length > 0) {
            groupedMetrics.disabled = sortMetricEntriesByOrder(
                groupedMetrics.disabled,
                DISABLED_METRICS_ORDER
            );
        }

        // Create container for metrics settings
        const metricsContainer = containerEl.createDiv({ cls: 'oom-metrics-container' });

        // Display enabled metrics
        if (groupedMetrics.enabled.length > 0) {
            metricsContainer.createEl('h2', { text: 'Enabled Metrics' });
            groupedMetrics.enabled.forEach(([key, metric]) => {
                addMetricToggle(metric, key, metricsContainer);
            });
        }

        // Display disabled metrics
        if (groupedMetrics.disabled.length > 0) {
            metricsContainer.createEl('h2', { text: 'Disabled Metrics' });
            groupedMetrics.disabled.forEach(([key, metric]) => {
                addMetricToggle(metric, key, metricsContainer);
            });
        }

        // Add section border after metrics settings
        containerEl.createEl('div', { cls: 'oom-section-border' });
        
        // Check for missing metrics and add restore options
        this.addMissingMetrics(containerEl);
        
        // Add section border after missing metrics section
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Backup Settings Section
        containerEl.createEl('h2', { text: 'Backup Settings' });

        // Backup Enabled toggle
        const backupToggleSetting = new Setting(containerEl)
            .setName('Create Backups')
            .setDesc('Create backups of the project note before making changes')
            .addToggle(toggle => toggle
                .setValue(isBackupEnabled(this.plugin.settings))
                .onChange(async (value) => {
                    setBackupEnabled(this.plugin.settings, value);
                    await this.plugin.saveSettings();
                    // Show/hide backup folder setting without refreshing entire page
                    if (backupFolderContainer) {
                        backupFolderContainer.style.display = value ? 'block' : 'none';
                    }
                }));

        // Backup Folder Path (create container but may be hidden)
        const backupFolderContainer = containerEl.createEl('div');
        backupFolderContainer.style.display = isBackupEnabled(this.plugin.settings) ? 'block' : 'none';
        
        if (true) { // Always create the setting, just hide the container if needed
            const backupFolderSetting = new Setting(backupFolderContainer)
                .setName('Backup Folder')
                .setDesc('Select an existing folder where backups will be stored')
                .addSearch(search => {
                    search.setPlaceholder('Choose backup folder...')
                        .setValue(getBackupFolderPath(this.plugin.settings))
                        .onChange(async (value) => {
                            setBackupFolderPath(this.plugin.settings, value);
                            await this.plugin.saveSettings();
                        });
                    
                    // Add folder suggestions
                    new FolderSuggest(this.app, search.inputEl);
                });
        }

        // Add section border after backup settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Logging Settings Section
        containerEl.createEl('h2', { text: 'Logging Settings' });
        
        // Store references to conditional settings for showing/hiding
        let maxSizeSetting: Setting;
        let maxBackupsSetting: Setting;
        let performanceSection: HTMLElement;
        
        const updateLoggingSettingsVisibility = (logLevel: string) => {
            const shouldShow = logLevel !== 'off';
            if (maxSizeSetting) {
                maxSizeSetting.settingEl.style.display = shouldShow ? 'block' : 'none';
            }
            if (maxBackupsSetting) {
                maxBackupsSetting.settingEl.style.display = shouldShow ? 'block' : 'none';
            }
            if (performanceSection) {
                performanceSection.style.display = shouldShow ? 'block' : 'none';
            }
        };
        
        new Setting(containerEl)
            .setName('Logging Level')
            .setDesc('Control the verbosity of logging. Set to "Off" for normal operation, "Errors Only" for minimal logging, or "Debug" for detailed logging.')
            .addDropdown(dropdown => dropdown
                .addOption('off', 'Off')
                .addOption('errors', 'Errors Only')
                .addOption('warn', 'Warnings')
                .addOption('info', 'Info')
                .addOption('debug', 'Debug')
                // Cast to any to avoid type issues with LogLevel
                .setValue((this.plugin.settings.logging.level || 'off') as any)
                .onChange(async (value) => {
                    this.plugin.settings.logging.level = value as any;
                    await this.plugin.saveSettings();
                    this.plugin.setLogLevel(value as any);
                    updateLoggingSettingsVisibility(value);
                }));

        maxSizeSetting = new Setting(containerEl)
            .setName('Maximum Log Size')
            .setDesc('Maximum size of the log file in MB before rotation.')
            .addText(text => text
                .setValue(String(this.plugin.settings.logging.maxSize / (1024 * 1024)))
                .onChange(async (value) => {
                    const size = parseInt(value) * 1024 * 1024;
                    if (!isNaN(size) && size > 0) {
                        this.plugin.settings.logging.maxSize = size;
                        await this.plugin.saveSettings();
                        this.plugin.setLogConfig(
                            this.plugin.settings.logging.level as any,
                            size,
                            this.plugin.settings.logging.maxBackups
                        );
                    }
                }));

        maxBackupsSetting = new Setting(containerEl)
            .setName('Maximum Backups')
            .setDesc('Number of backup log files to keep.')
            .addText(text => text
                .setValue(String(this.plugin.settings.logging.maxBackups))
                .onChange(async (value) => {
                    const backups = parseInt(value);
                    if (!isNaN(backups) && backups > 0) {
                        this.plugin.settings.logging.maxBackups = backups;
                        await this.plugin.saveSettings();
                        this.plugin.setLogConfig(
                            this.plugin.settings.logging.level as any,
                            this.plugin.settings.logging.maxSize,
                            backups
                        );
                    }
                }));

        // Add section border after logging settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Create Performance Testing Settings Section (conditionally visible)
        performanceSection = containerEl.createDiv();
        performanceSection.createEl('h2', { text: 'Performance Testing Settings' });
        
        // Add explanatory note about performance testing
        const perfTestingInfoEl = performanceSection.createEl('div', {
            cls: 'oom-notice oom-notice--warning'
        });
        perfTestingInfoEl.createEl('strong', { text: 'Performance Testing Mode: ' });
        perfTestingInfoEl.createEl('span', { 
            text: 'Removes or increases the normal 200-file limit for scraping operations. Enable this only for testing with large datasets.'
        });

        // Performance mode toggle
        new Setting(performanceSection)
            .setName('Enable Performance Testing Mode')
            .setDesc('Removes the normal 200-file limit during scraping operations. Use for testing with large datasets.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.performanceTesting?.enabled ?? false)
                .onChange(async (value) => {
                    if (!this.plugin.settings.performanceTesting) {
                        this.plugin.settings.performanceTesting = {
                            enabled: false,
                            maxFiles: 0,
                            showWarnings: true
                        };
                    }
                    this.plugin.settings.performanceTesting.enabled = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide dependent settings
                }));

        // Show dependent settings only when performance mode is enabled
        if (this.plugin.settings.performanceTesting?.enabled) {
            // Max files setting
            new Setting(performanceSection)
                .setName('Maximum Files to Process')
                .setDesc('Maximum number of files to process in performance mode. Set to 0 for unlimited.')
                .addText(text => text
                    .setPlaceholder('0')
                    .setValue(String(this.plugin.settings.performanceTesting?.maxFiles ?? 0))
                    .onChange(async (value) => {
                        const maxFiles = parseInt(value) || 0;
                        if (!this.plugin.settings.performanceTesting) {
                            this.plugin.settings.performanceTesting = {
                                enabled: false,
                                maxFiles: 0,
                                showWarnings: true
                            };
                        }
                        this.plugin.settings.performanceTesting.maxFiles = maxFiles;
                        await this.plugin.saveSettings();
                    }));

            // Show warnings toggle
            new Setting(performanceSection)
                .setName('Show Performance Warnings')
                .setDesc('Display console warnings when performance testing mode is active.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.performanceTesting?.showWarnings ?? true)
                    .onChange(async (value) => {
                        if (!this.plugin.settings.performanceTesting) {
                            this.plugin.settings.performanceTesting = {
                                enabled: false,
                                maxFiles: 0,
                                showWarnings: true
                            };
                        }
                        this.plugin.settings.performanceTesting.showWarnings = value;
                        await this.plugin.saveSettings();
                    }));

            // Status indicator
            const statusText = this.plugin.settings.performanceTesting.maxFiles > 0 
                ? `Processing up to ${this.plugin.settings.performanceTesting.maxFiles} files`
                : 'Processing unlimited files';
            
            const statusEl = performanceSection.createEl('div', {
                cls: 'oom-notice oom-notice--info'
            });
            statusEl.createEl('span', { 
                text: `⚠️ Performance mode active: ${statusText}`
            });
        }

        // Add section border after performance testing settings
        performanceSection.createEl('div', { cls: 'oom-section-border' });
        
        // Initialize visibility based on current logging level
        const currentLogLevel = this.plugin.settings.logging.level || 'off';
        updateLoggingSettingsVisibility(currentLogLevel);

        containerEl.scrollTop = prevScroll;
        if (focusSelector) {
            const toFocus = containerEl.querySelector(focusSelector) as HTMLElement;
            if (toFocus) toFocus.focus();
        }
    }

    private addJournalStructureSettings(containerEl: HTMLElement) {
        // Journal Structure settings button
        new Setting(containerEl)
            .setName('Journal Structure Settings')
            .setDesc('Configure and manage all journal structure settings')
            .addButton(button => button
                .setButtonText('Open Settings')
                .onClick(() => {
                    // Close the current settings modal first
                    (this.app as any).setting.close();
                    
                    // Then open the Hub modal with Journal Structure tab
                    const modalsManager = new ModalsManager(this.app, this.plugin, this.plugin.logger);
                    modalsManager.openHubModal('journal-structure');
                }));
    }

    /**
     * Display template manager UI
     */
    private displayTemplateManager(containerEl: HTMLElement) {
        // Find or create template list container
        let templateListContainer = containerEl.querySelector('.oom-template-list-container');
        if (!templateListContainer) {
            templateListContainer = containerEl.createDiv({ cls: 'oom-template-list-container' });
        }
        
        // Clear and reset the container
        templateListContainer.empty();
        (templateListContainer as HTMLElement).style.display = 'block';
        
        // Create header
        const header = templateListContainer.createEl('h3', { text: 'Manage Templates' });
        
        // Add close button to header
        const closeButton = header.createEl('button', { 
            cls: 'oom-template-close-button',
            text: '×'
        });
        closeButton.style.float = 'right';
        closeButton.style.border = 'none';
        closeButton.style.background = 'none';
        closeButton.style.fontSize = '1.5em';
        closeButton.style.cursor = 'pointer';
        closeButton.style.padding = '0 0.5em';
        
        closeButton.addEventListener('click', () => {
            (templateListContainer as HTMLElement).style.display = 'none';
        });
        
        // Get templates from settings
        const templates = this.plugin.settings.linting?.templates || [];
        
        if (templates.length === 0) {
            templateListContainer.createEl('p', { 
                text: 'No templates found. Create a template to get started.' 
            });
            return;
        }
        
        // Create template list
        const templateList = templateListContainer.createEl('div', { cls: 'oom-template-list' });
        
        for (const template of templates) {
            const templateItem = templateList.createEl('div', { cls: 'oom-template-item' });
            
            // Template header with name
            const templateHeader = templateItem.createEl('div', { cls: 'oom-template-header' });
            templateHeader.createEl('h4', { text: template.name });
            
            // Template actions
            const actionsContainer = templateHeader.createEl('div', { cls: 'oom-template-actions' });
            
            // Edit button
            const editButton = actionsContainer.createEl('button', {
                text: 'Edit',
                cls: 'oom-template-edit-button'
            });
            editButton.addEventListener('click', () => {
                const { UnifiedTemplateWizard } = require('./src/journal_check/ui/UnifiedTemplateWizard');
                new UnifiedTemplateWizard(this.app, this.plugin).open();
                
                // Close the template manager (will be refreshed when reopened)
                (templateListContainer as HTMLElement).style.display = 'none';
            });
            
            // Delete button
            const deleteButton = actionsContainer.createEl('button', {
                text: 'Delete',
                cls: 'oom-template-delete-button'
            });
            deleteButton.addEventListener('click', () => {
                // Confirm before deleting
                const modal = new Modal(this.app);
                modal.titleEl.setText('Delete Template');
                modal.contentEl.createEl('p', { 
                    text: `Are you sure you want to delete the template "${template.name}"?` 
                });
                
                // Add buttons
                const buttonContainer = modal.contentEl.createDiv({ cls: 'oom-modal-buttons' });
                
                const cancelButton = buttonContainer.createEl('button', {
                    text: 'Cancel',
                    cls: 'oom-button-cancel'
                });
                cancelButton.addEventListener('click', () => {
                    modal.close();
                });
                
                const confirmButton = buttonContainer.createEl('button', {
                    text: 'Delete',
                    cls: 'oom-button-delete'
                });
                confirmButton.addEventListener('click', async () => {
                    // Remove template from array
                    const templates = this.plugin.settings.linting?.templates || [];
                    const index = templates.findIndex(t => t.id === template.id);
                    if (index >= 0) {
                        templates.splice(index, 1);
                        await this.plugin.saveSettings();
                        
                        // Refresh template list
                        this.displayTemplateManager(containerEl);
                        new Notice(`Deleted template: ${template.name}`);
                    }
                    
                    modal.close();
                });
                
                modal.open();
            });
            
            // Template details
            if (template.description) {
                templateItem.createEl('p', { 
                    text: template.description, 
                    cls: 'oom-template-description' 
                });
            }
            
            // Show structure name
            const structure = this.plugin.settings.linting?.structures?.find(s => s.id === template.structure);
            if (structure) {
                templateItem.createEl('p', { 
                    text: `Structure: ${structure.name} (${structure.type === 'nested' ? 'Nested' : 'Flat'})`, 
                    cls: 'oom-template-structure' 
                });
            }
            
            // Preview toggle
            const previewButton = templateItem.createEl('button', {
                text: 'Show Preview',
                cls: 'oom-template-preview-toggle'
            });
            
            const previewContainer = templateItem.createEl('div', { 
                cls: 'oom-template-preview-container' 
            });
            previewContainer.style.display = 'none';
            
            const previewContent = previewContainer.createEl('pre', { 
                cls: 'oom-template-preview-content' 
            });
            previewContent.textContent = template.content.substring(0, 300) + 
                (template.content.length > 300 ? '...' : '');
            
            previewButton.addEventListener('click', () => {
                const isHidden = previewContainer.style.display === 'none';
                previewContainer.style.display = isHidden ? 'block' : 'none';
                previewButton.textContent = isHidden ? 'Hide Preview' : 'Show Preview';
            });
        }
        
        // Add styles
        this.addTemplateManagerStyles();
    }

    /**
     * Add styles for template manager
     */
    private addTemplateManagerStyles() {
        // Remove existing styles
        const existingStyles = document.getElementById('oom-template-manager-styles');
        if (existingStyles) {
            existingStyles.remove();
        }
        
        // Add styles
        const styleEl = document.createElement('style');
        styleEl.id = 'oom-template-manager-styles';
        styleEl.textContent = `
            .oom-template-list-container {
                margin-top: 1em;
                padding: 1em;
                border-radius: 5px;
                background-color: var(--background-secondary);
            }
            
            .oom-template-item {
                margin-bottom: 1em;
                padding: 1em;
                border-radius: 5px;
                background-color: var(--background-primary);
            }
            
            .oom-template-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .oom-template-header h4 {
                margin: 0;
            }
            
            .oom-template-actions {
                display: flex;
                gap: 0.5em;
            }
            
            .oom-template-edit-button, 
            .oom-template-delete-button,
            .oom-template-preview-toggle {
                padding: 0.25em 0.5em;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .oom-template-edit-button {
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
            }
            
            .oom-template-delete-button {
                background-color: var(--text-error);
                color: var(--background-primary);
            }
            
            .oom-template-preview-toggle {
                background-color: var(--background-modifier-border);
                margin-top: 0.5em;
            }
            
            .oom-template-preview-container {
                margin-top: 0.5em;
                padding: 0.5em;
                background-color: var(--background-secondary);
                border-radius: 3px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .oom-template-preview-content {
                white-space: pre-wrap;
                margin: 0;
            }
            
            .oom-template-description {
                margin: 0.5em 0;
                font-style: italic;
            }
            
            .oom-template-structure {
                margin: 0.5em 0;
                font-size: 0.9em;
                color: var(--text-muted);
            }
            
            .oom-modal-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 1em;
                margin-top: 1em;
            }
            
            .oom-button-cancel,
            .oom-button-delete {
                padding: 0.25em 1em;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .oom-button-cancel {
                background-color: var(--background-modifier-border);
            }
            
            .oom-button-delete {
                background-color: var(--text-error);
                color: var(--background-primary);
            }
        `;
        
        document.head.appendChild(styleEl);
    }

    addMissingMetrics(containerEl: HTMLElement) {
        const missingMetrics = DEFAULT_METRICS
            .filter(defaultMetric => 
                !this.plugin.settings.metrics[defaultMetric.name]
            )
            .map(m => m.name);
        
        if (missingMetrics.length === 0) {
            return;
        }
        
        info('Settings', `Checking for missing metrics`, { 
            count: missingMetrics.length, 
            missing: missingMetrics.join(', ') 
        });
        
        const h2 = containerEl.createEl('h2', { text: 'Missing Metrics' });
        const infoEl = containerEl.createEl('p', { 
            text: `Found ${missingMetrics.length} metrics missing from your settings. Would you like to restore them?`
        });
        
        // Create a container for the buttons
        const buttonContainer = containerEl.createEl('div', {
            cls: 'oom-missing-metrics-buttons'
        });
        
        // Add a restore all button
        const restoreAllButton = buttonContainer.createEl('button', {
            text: 'Restore All Metrics',
            cls: 'mod-cta'
        });
        
        restoreAllButton.addEventListener('click', async () => {
            // Loop through all missing metrics and restore them
            const metricsToRestore = DEFAULT_METRICS.filter(defaultMetric => 
                !this.plugin.settings.metrics[defaultMetric.name]
            );
            
            for (const metricToRestore of metricsToRestore) {
                const metricName = metricToRestore.name;
                
                // Create a new metric from the default
                this.plugin.settings.metrics[metricName] = {
                    name: metricName,
                    icon: metricToRestore.icon,
                    minValue: metricToRestore.minValue,
                    maxValue: metricToRestore.maxValue,
                    description: metricToRestore.description || '',
                    enabled: metricToRestore.enabled,
                    category: metricToRestore.category || 'dream',
                    type: metricToRestore.type || 'number',
                    format: metricToRestore.format || 'number',
                    options: metricToRestore.options || [],
                    // Include legacy properties for backward compatibility
                    min: metricToRestore.minValue,
                    max: metricToRestore.maxValue,
                    step: 1
                };
                
                info('Settings', `Restored metric from DEFAULT_METRICS: ${metricName}`);
            }
            
            // Save settings and refresh UI
            await this.plugin.saveSettings();
            this.display();
            new Notice(`Restored ${metricsToRestore.length} missing metrics`);
        });
        
        // Also add a create manually button as another option
        const createManuallyButton = buttonContainer.createEl('button', {
            text: 'Create Manually',
            cls: 'mod-warning'
        });
        
        createManuallyButton.addEventListener('click', async () => {
            // Handle manual creation of missing metrics - just create an empty metric for each
            const metricsToCreate = DEFAULT_METRICS.filter(defaultMetric => 
                !this.plugin.settings.metrics[defaultMetric.name]
            );
            
            for (const metricToCreate of metricsToCreate) {
                const metricName = metricToCreate.name;
                
                // Create a minimal metric with just the name and default values
                this.plugin.settings.metrics[metricName] = {
                    name: metricName,
                    icon: '',
                    minValue: 1,
                    maxValue: 10,
                    description: '',
                    enabled: false,
                    category: 'dream',
                    type: 'number',
                    format: 'number',
                    options: [],
                    // Include legacy properties for backward compatibility
                    min: 1,
                    max: 10,
                    step: 1
                };
                
                info('Settings', `Manually created missing metric: ${metricName}`);
            }
            
            // Save settings and refresh UI
            await this.plugin.saveSettings();
            this.display();
            new Notice(`Created ${metricsToCreate.length} missing metrics with default values`);
        });
    }
}

// --- Metrics Descriptions Modal has been archived (moved to HubModal Reference Overview tab) ---

// Import for file suggestion modal
class FileSuggestModal extends Modal {
    constructor(app: App) { 
        super(app);
    }
    
    setPlaceholder(placeholder: string) {
        return this;
    }
    
    onChooseItem: (item: string) => void = () => {};
    
    open() {
        super.open();
        // This is a stub implementation
        setTimeout(() => {
            if (this.onChooseItem) {
                this.onChooseItem('');
            }
            this.close();
        }, 100);
    }
}

// Helper function to get selection mode description
function getSelectionModeDescription(mode: string): string {
    if (mode === 'notes' || mode === 'manual') {
        return 'Select individual notes to include in dream metrics';
    }
    if (mode === 'folder' || mode === 'automatic') {
        return 'Select a folder to recursively search for dream metrics';
    }
    return 'Choose how to select notes for metrics processing';
} 

// Note: TemplateWizard is now replaced by UnifiedTemplateWizard
// The stub implementation has been removed

// Add a helper function to sort metrics by a predefined order
export function sortMetricsByOrder(metrics: string[], orderArray: string[]): string[] {
  // Create a copy to avoid modifying the original array
  const sortedMetrics = [...metrics];
  
  // Sort by the predefined order
  sortedMetrics.sort((a, b) => {
    const indexA = orderArray.indexOf(a);
    const indexB = orderArray.indexOf(b);
    
    // If both are in the order array, sort by their position
    if (indexA >= 0 && indexB >= 0) {
      return indexA - indexB;
    }
    
    // If only one is in the order array, prioritize it
    if (indexA >= 0) return -1;
    if (indexB >= 0) return 1;
    
    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });
  
  return sortedMetrics;
}

// Add a specialized function for sorting metric entries
function sortMetricEntriesByOrder(
  metricEntries: [string, DreamMetric][],
  orderArray: string[]
): [string, DreamMetric][] {
  try {
    // Create a map for O(1) lookup of position
    const orderMap: Record<string, number> = {};
    orderArray.forEach((name, index) => {
      orderMap[name] = index;
    });
    
    // Sort based on the order array
    return [...metricEntries].sort(([_keyA, metricA], [_keyB, metricB]) => {
      const nameA = metricA.name;
      const nameB = metricB.name;
      
      // If both are in the order array, sort by their position
      const posA = orderMap[nameA];
      const posB = orderMap[nameB];
      
      if (posA !== undefined && posB !== undefined) {
        return posA - posB;
      }
      
      // If only one is in the order array, prioritize it
      if (posA !== undefined) return -1;
      if (posB !== undefined) return 1;
      
      // If neither is in the order array, sort alphabetically
      return nameA.localeCompare(nameB);
    });
  } catch (error) {
    error('Settings', 'Error sorting metric entries', error);
    // Return the original entries if there's an error
    return metricEntries;
  }
}

// Suggestion classes based on Templater's implementation
class SuggestionDisplay {
    private owner: any;
    private containerEl: HTMLElement;
    private values: any[] = [];
    private suggestions: HTMLElement[] = [];
    private selectedItem: number = 0;

    constructor(owner: any, containerEl: HTMLElement, scope: Scope) {
        this.owner = owner;
        this.containerEl = containerEl;
        
        containerEl.on("click", ".suggestion-item", this.onSuggestionClick.bind(this));
        containerEl.on("mousemove", ".suggestion-item", this.onSuggestionMouseover.bind(this));
        
        scope.register([], "ArrowUp", (evt) => {
            if (!evt.isComposing) {
                this.setSelectedItem(this.selectedItem - 1, true);
                return false;
            }
        });
        
        scope.register([], "ArrowDown", (evt) => {
            if (!evt.isComposing) {  
                this.setSelectedItem(this.selectedItem + 1, true);
                return false;
            }
        });
        
        scope.register([], "Enter", (evt) => {
            if (!evt.isComposing) {
                this.useSelectedItem(evt);
                return false;
            }
        });
    }

    private onSuggestionClick(evt: MouseEvent, target: HTMLElement) {
        evt.preventDefault();
        const index = this.suggestions.indexOf(target);
        this.setSelectedItem(index, false);
        this.useSelectedItem(evt);
    }

    private onSuggestionMouseover(evt: MouseEvent, target: HTMLElement) {
        const index = this.suggestions.indexOf(target);
        this.setSelectedItem(index, false);
    }

    setSuggestions(items: any[]) {
        this.containerEl.empty();
        const suggestions: HTMLElement[] = [];
        
        items.forEach(item => {
            const suggestionEl = this.containerEl.createDiv("suggestion-item");
            this.owner.renderSuggestion(item, suggestionEl);
            suggestions.push(suggestionEl);
        });
        
        this.values = items;
        this.suggestions = suggestions;
        this.setSelectedItem(0, false);
    }

    private useSelectedItem(evt: Event) {
        const selectedValue = this.values[this.selectedItem];
        if (selectedValue) {
            this.owner.selectSuggestion(selectedValue, evt);
        }
    }

    private setSelectedItem(index: number, scroll: boolean) {
        const wrappedIndex = ((index % this.suggestions.length) + this.suggestions.length) % this.suggestions.length;
        const currentSelected = this.suggestions[this.selectedItem];
        const newSelected = this.suggestions[wrappedIndex];
        
        currentSelected?.removeClass("is-selected");
        newSelected?.addClass("is-selected");
        
        this.selectedItem = wrappedIndex;
        
        if (scroll) {
            newSelected?.scrollIntoView(false);
        }
    }
}

abstract class BaseSuggest {
    protected app: App;
    protected inputEl: HTMLInputElement;
    protected scope: Scope;
    protected suggestEl: HTMLElement;
    protected suggest: SuggestionDisplay;
    protected popper: any;

    constructor(app: App, inputEl: HTMLInputElement) {
        this.app = app;
        this.inputEl = inputEl;
        this.scope = new Scope();
        
        this.suggestEl = createDiv("suggestion-container");
        const suggestionDiv = this.suggestEl.createDiv("suggestion");
        this.suggest = new SuggestionDisplay(this, suggestionDiv, this.scope);
        
        this.scope.register([], "Escape", this.close.bind(this));
        
        this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("blur", this.close.bind(this));
        
        this.suggestEl.on("mousedown", ".suggestion-container", (evt) => {
            evt.preventDefault();
        });
    }

    abstract getSuggestions(query: string): any[];
    abstract renderSuggestion(item: any, el: HTMLElement): void;
    abstract selectSuggestion(item: any, evt?: Event): void;

    private onInputChanged() {
        const query = this.inputEl.value;
        const suggestions = this.getSuggestions(query);
        
        if (!suggestions) {
            this.close();
            return;
        }
        
        if (suggestions.length > 0) {
            this.suggest.setSuggestions(suggestions);
            this.open(document.body, this.inputEl);
        } else {
            this.close();
        }
    }

    private open(container: HTMLElement, referenceEl: HTMLElement) {
        this.app.keymap.pushScope(this.scope);
        container.appendChild(this.suggestEl);
        
        // Use Obsidian's positioning if available, otherwise fallback to simple positioning
        if ((window as any).Popper) {
            this.popper = (window as any).Popper.createPopper(referenceEl, this.suggestEl, {
                placement: "bottom-start",
                modifiers: [{
                    name: "sameWidth",
                    enabled: true,
                    fn: ({ state, instance }: any) => {
                        const width = `${state.rects.reference.width}px`;
                        if (state.styles.popper.width !== width) {
                            state.styles.popper.width = width;
                            instance.update();
                        }
                    },
                    phase: "beforeWrite",
                    requires: ["computeStyles"]
                }]
            });
        } else {
            // Fallback positioning
            const rect = referenceEl.getBoundingClientRect();
            this.suggestEl.style.position = "absolute";
            this.suggestEl.style.top = `${rect.bottom}px`;
            this.suggestEl.style.left = `${rect.left}px`;
            this.suggestEl.style.width = `${rect.width}px`;
        }
    }

    private close() {
        this.app.keymap.popScope(this.scope);
        this.suggest.setSuggestions([]);
        
        if (this.popper) {
            this.popper.destroy();
            this.popper = null;
        }
        
        this.suggestEl.detach();
    }
}

export class FileSuggest extends BaseSuggest {
    getSuggestions(query: string): TFile[] {
        const files = this.app.vault.getAllLoadedFiles();
        const markdownFiles: TFile[] = [];
        const lowerQuery = query.toLowerCase();
        
        files.forEach(file => {
            if (file instanceof TFile && 
                file.extension === "md" && 
                file.path.toLowerCase().contains(lowerQuery)) {
                markdownFiles.push(file);
            }
        });
        
        return markdownFiles.slice(0, 1000);
    }

    renderSuggestion(file: TFile, el: HTMLElement) {
        el.setText(file.path);
    }

    selectSuggestion(file: TFile) {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        // Use the inherited close method
        (this as any).close();
    }
}

export class FolderSuggest extends BaseSuggest {
    getSuggestions(query: string): TFolder[] {
        const files = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerQuery = query.toLowerCase();
        
        files.forEach(file => {
            if (file instanceof TFolder && file.path.toLowerCase().contains(lowerQuery)) {
                folders.push(file);
            }
        });
        
        return folders.slice(0, 1000);
    }

    renderSuggestion(folder: TFolder, el: HTMLElement) {
        el.setText(folder.path);
    }

    selectSuggestion(folder: TFolder) {
        this.inputEl.value = folder.path;
        this.inputEl.trigger("input");
        // Use the inherited close method
        (this as any).close();
    }
}
