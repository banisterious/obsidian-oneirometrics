import { App, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, Notice, TFile, TFolder, ExtraButtonComponent, MarkdownRenderer, getIcon, DropdownComponent, ToggleComponent, Scope, setIcon, AbstractInputSuggest } from "obsidian";
import { DEFAULT_METRICS, DreamMetricsSettings } from "./src/types/core";
import { LogLevel } from "./src/types/logging";
import { DreamMetric, SelectionMode } from "./src/types/core";
import DreamMetricsPlugin from "./main";
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
  'Symbolic Content',
  'Lucidity Level',
  'Dream Coherence',
  'Environmental Familiarity',
  'Time Distortion',
  'Character Roles',
  'Characters Count',
  'Characters List',
  'Familiar Count',
  'Unfamiliar Count',
  'Character Clarity/Familiarity',
  'Ease of Recall',
  'Recall Stability'
];

// Import settings helpers
import { 
    getProjectNotePath, 
    setProjectNotePath,
    isBackupEnabled,
    setBackupEnabled,
    getBackupFolderPath,
    setBackupFolderPath,
    shouldShowRibbonButtons,
    setShowRibbonButtons,
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

// Import SettingsAdapter
import { SettingsAdapter } from './src/state/adapters/SettingsAdapter';

import { JournalStructureSettings as LintingSettings } from './src/types/journal-check';

interface IconCategory {
    name: string;
    description: string;
    icons: string[];
}

export const iconCategories: IconCategory[] = [
    {
        name: "Metrics",
        description: "Icons for core metrics",
        icons: [
            'eye',
            'heart',
            'circle-minus',
            'pen-tool',
            'check-circle',
            'sparkles',
            'wand-2',
            'zap',
            'glasses',
            'link',
            'ruler',
            'layers'
        ]
    },
    {
        name: "Characters",
        description: "Icons for character-related metrics",
        icons: [
            'user-cog',
            'users',
            'user-check',
            'user-x',
            'users-round'
        ]
    }
];

// For backward compatibility - map icon names to themselves
export const lucideIconMap: Record<string, string> = {};
iconCategories.forEach(category => {
    category.icons.forEach(icon => {
        lucideIconMap[icon] = icon;
    });
});

// Helper function to ensure a metric has all required properties
// Uses standardizeMetric under the hood to ensure proper type compatibility
export function ensureCompleteMetric(metric: Partial<DreamMetric>): DreamMetric {
    // Start with all properties from the original metric
    const metricWithRequired = {
        ...metric, // Include all original properties
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

function validateMetricDescription(description: string | undefined): string | null {
    // Description is optional, so empty or undefined is valid
    if (!description || !description.trim()) return null;
    if (description.length > 200) return "Description must be 200 characters or less";
    return null;
}

// Metric Editor Modal
export class MetricEditorModal extends Modal {
    private metric: DreamMetric;
    private onSubmit: (metric: DreamMetric) => void;
    private existingMetrics: DreamMetric[];
    private isEditing: boolean;
    private previewInterval: number;
    private originalName: string;

    constructor(app: App, metric: DreamMetric, existingMetrics: DreamMetric[], onSubmit: (metric: DreamMetric) => void, isEditing: boolean = false) {
        super(app);
        // Create a complete metric with all required properties
        // Then standardize it for consistency
        this.metric = ensureCompleteMetric(metric);
        this.existingMetrics = existingMetrics;
        this.onSubmit = onSubmit;
        this.isEditing = isEditing;
        this.originalName = metric.name || '';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-metric-editor-modal');

        contentEl.createEl('h2', { text: this.isEditing ? 'Edit metric' : 'Add new metric', cls: 'oom-modal-title' });

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
            category.icons.forEach((iconName: string) => {
                const iconBtn = iconGrid.createEl('button', {
                    cls: 'oom-icon-picker-btn u-padding--xs',
                    attr: { 
                        type: 'button',
                        'aria-label': iconName,
                        'data-icon-name': iconName
                    }
                });
                // Use Obsidian's setIcon function
                setIcon(iconBtn, iconName);
                
                if (this.metric.icon === iconName) iconBtn.classList.add('selected');
                iconBtn.onclick = () => {
                    this.metric.icon = iconName;
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
            const allIcons: string[] = [];
            iconCategories.forEach(category => {
                allIcons.push(...category.icons);
            });
            
            iconGrid.empty();
            allIcons.forEach((iconName: string) => {
                if (iconName.toLowerCase().includes(searchTerm)) {
                    const iconBtn = iconGrid.createEl('button', {
                        cls: 'oom-icon-picker-btn u-padding--xs',
                        attr: { 
                            type: 'button',
                            'aria-label': iconName,
                            'data-icon-name': iconName
                        }
                    });
                    // Use Obsidian's setIcon function
                    setIcon(iconBtn, iconName);
                    
                    if (this.metric.icon === iconName) iconBtn.classList.add('selected');
                    iconBtn.onclick = () => {
                        this.metric.icon = iconName;
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
            .setName('Description (optional)')
            .setDesc('A description of what this metric measures')
            .addTextArea(text => {
                text.setValue(this.metric.description || '')
                    .onChange(value => {
                        const error = validateMetricDescription(value);
                        descSetting.setDesc(error || 'A description of what this metric measures (optional)');
                        descSetting.controlEl.classList.toggle('is-invalid', !!error);
                        this.metric.description = value;
                        this.updatePreview();
                    });
            });

        // Frontmatter property
        const frontmatterSection = contentEl.createEl('div', { cls: 'oom-metric-editor-section' });
        new Setting(frontmatterSection)
            .setName('Frontmatter property')
            .setDesc('Optional: Map this metric to a frontmatter property (e.g., dream-lucidity-level)')
            .addText(text => {
                // Generate suggested property name based on metric name
                const suggestedProperty = `dream-${this.metric.name.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '-')          // Replace spaces with hyphens
                    .replace(/-+/g, '-')           // Replace multiple hyphens with single
                    .trim()}`;
                
                text.setValue(this.metric.frontmatterProperty || '')
                    .setPlaceholder(suggestedProperty)
                    .onChange(value => {
                        this.metric.frontmatterProperty = value.trim() || undefined;
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
                        this.metric.enabled = value;
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
            .setButtonText(this.isEditing ? 'Save changes' : 'Add metric')
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
        if (this.metric.icon) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'oom-metric-icon';
            
            // Use Obsidian's setIcon function
            setIcon(iconSpan, this.metric.icon);
            
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
        
        // Show frontmatter property if set
        if (this.metric.frontmatterProperty) {
            previewEl.createEl('div', {
                cls: 'oom-preview-frontmatter',
                text: `Frontmatter property: ${this.metric.frontmatterProperty}`
            });
        }
    }

    private validateAll(): boolean {
        // When editing, exclude the original metric from name validation
        const metricsForValidation = this.isEditing 
            ? this.existingMetrics.filter(m => m.name !== this.originalName)
            : this.existingMetrics;
        
        const nameError = validateMetricName(this.metric.name, metricsForValidation);
        const rangeError = validateMetricRange(
            getMetricMinValue(this.metric), 
            getMetricMaxValue(this.metric)
        );
        const descError = validateMetricDescription(this.metric.description);

        if (nameError || rangeError || descError) {
            // Show specific error message
            const errorMsg = nameError || rangeError || descError;
            new Notice(`Validation error: ${errorMsg}`);
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

        // Onboarding Banner - dismissible welcome message
        if (!this.plugin.settings.onboardingDismissed) {
            const onboardingBanner = containerEl.createDiv({ cls: 'oom-onboarding-banner' });
            
            // Create content structure using DOM methods
            const content = onboardingBanner.createDiv({ cls: 'oom-onboarding-content' });
            
            // Header section
            const header = content.createDiv({ cls: 'oom-onboarding-header' });
            header.createSpan({ cls: 'oom-onboarding-icon', text: '🌙' });
            header.createEl('h3', { text: 'Welcome to OneiroMetrics v0.17.0!' });
            const dismissBtn = header.createEl('button', { 
                cls: 'oom-onboarding-dismiss',
                attr: { 'aria-label': 'Dismiss' },
                text: '×'
            });
            
            // Description paragraph
            const description = content.createEl('p');
            description.appendText('Get started by exploring the ');
            description.createEl('strong', { text: 'OneiroMetrics Hub' });
            description.appendText(' - your central command center for dream tracking and analytics.');
            
            // Action buttons
            const actions = content.createDiv({ cls: 'oom-onboarding-actions' });
            const hubBtn = actions.createEl('button', { 
                cls: 'oom-onboarding-hub-btn',
                text: 'Open OneiroMetrics Hub'
            });
            const dismissTextBtn = actions.createEl('button', { 
                cls: 'oom-onboarding-dismiss-btn',
                text: 'Got it, dismiss'
            });

            // Handle dismiss button - no need for querySelector now
            
            const dismissOnboarding = async () => {
                this.plugin.settings.onboardingDismissed = true;
                await this.plugin.saveSettings();
                onboardingBanner.remove();
            };

            dismissBtn.addEventListener('click', dismissOnboarding);
            dismissTextBtn.addEventListener('click', dismissOnboarding);

            // Handle Hub button
            hubBtn.addEventListener('click', () => {
                // Close the settings modal first
                (this.app as any).setting.close();
                
                // Open Hub modal
                const modalsManager = new ModalsManager(this.app, this.plugin, null);
                modalsManager.openHubModal();
            });
        }

        // Add Reading View requirement notice with contextual styling
        const noticeEl = containerEl.createEl('div', {
            cls: 'oom-notice oom-notice--info'
        });
        noticeEl.createEl('strong', { text: 'Note: ' });
        noticeEl.createEl('span', { 
            text: 'OneiroMetrics requires Reading View mode to function properly. The plugin generates interactive HTML content that will only display as raw markup in Live Preview mode.'
        });

        // Ribbon button is now always enabled by default (as recommended by Obsidian team)

        // OneiroMetrics Note Setting with Obsidian's built-in search like Templater
        const oneiroMetricsNoteSetting = new Setting(containerEl)
            .setName('OneiroMetrics note')
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

        // Backup Enabled toggle
        const backupToggleSetting = new Setting(containerEl)
            .setName('Create backups')
            .setDesc('Create backups of the OneiroMetrics note before scraping operations')
            .addToggle(toggle => toggle
                .setValue(isBackupEnabled(this.plugin.settings))
                .onChange(async (value) => {
                    setBackupEnabled(this.plugin.settings, value);
                    await this.plugin.saveSettings();
                    // Show/hide backup folder setting without refreshing entire page
                    if (backupFolderContainer) {
                        if (value) {
                            backupFolderContainer.classList.add('oom-backup-folder-container--visible');
                            backupFolderContainer.classList.remove('oom-backup-folder-container--hidden');
                        } else {
                            backupFolderContainer.classList.add('oom-backup-folder-container--hidden');
                            backupFolderContainer.classList.remove('oom-backup-folder-container--visible');
                        }
                    }
                }));

        // Backup Folder Path (create container but may be hidden)
        const backupFolderContainer = containerEl.createEl('div', { cls: 'oomp-note-backup-folder oom-backup-folder-container' });
        
        // Set initial visibility using CSS classes
        if (isBackupEnabled(this.plugin.settings)) {
            backupFolderContainer.classList.add('oom-backup-folder-container--visible');
        } else {
            backupFolderContainer.classList.add('oom-backup-folder-container--hidden');
        }
        
        if (true) { // Always create the setting, just hide the container if needed
            const backupFolderSetting = new Setting(backupFolderContainer)
                .setName('Backup folder')
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

        // Add section border after basic settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Journal Structure Check settings
        this.addJournalStructureSettings(containerEl);
        
        // Add section border after journal structure settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Metrics Management - Redirect to Hub
        new Setting(containerEl)
            .setName('Metrics management')
            .setDesc('Manage the metrics that are tracked in your dream diary')
            .addButton(button => {
                button.setButtonText('Open Metrics Settings')
                    .onClick(() => {
                        // Close the settings modal first
                        (this.app as any).setting.close();
                        
                        // Open Hub modal and navigate to Metrics Settings tab
                        const modalsManager = new ModalsManager(this.app, this.plugin, null);
                        const hubModal = modalsManager.openHubModal() as any;
                        // Navigate to the metrics-settings tab
                        setTimeout(() => {
                            hubModal.selectTab('metrics-settings');
                        }, 100);
                    });
            });

        // This functionality has been moved to the OneiroMetrics Hub - Metrics Settings tab

        // Create Advanced Settings Section (collapsed by default)
        const advancedSection = containerEl.createDiv({ cls: 'oom-collapsible-section collapsed' });
        
        // Use Setting API for consistent heading style, but make it collapsible
        const advancedSetting = new Setting(advancedSection)
            .setName('Advanced')
            .setHeading();
        
        // Add collapsible toggle to the setting element
        const advancedToggle = advancedSetting.settingEl.createDiv({ cls: 'oom-collapsible-toggle' });
        
        // Create chevron SVG safely
        const createChevronSvg = (direction: 'right' | 'down') => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 100 100');
            svg.setAttribute('class', `oom-chevron-${direction}`);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'currentColor');
            path.setAttribute('stroke-width', '15');
            path.setAttribute('d', direction === 'right' ? 'M30,10 L70,50 L30,90' : 'M10,30 L50,70 L90,30');
            svg.appendChild(path);
            return svg;
        };
        
        advancedToggle.appendChild(createChevronSvg('right'));
        advancedToggle.style.position = 'absolute';
        advancedToggle.style.right = '0';
        advancedToggle.style.top = '50%';
        advancedToggle.style.transform = 'translateY(-50%)';
        advancedToggle.style.cursor = 'pointer';
        advancedToggle.style.width = '20px';
        advancedToggle.style.height = '20px';
        
        // Make the setting element itself clickable
        advancedSetting.settingEl.style.position = 'relative';
        advancedSetting.settingEl.style.cursor = 'pointer';
        
        const advancedContent = advancedSection.createDiv({ 
            cls: 'oom-collapsible-content oom-advanced-content oom-advanced-content--collapsed'
        });
        
        const toggleAdvanced = () => {
            const isCollapsed = advancedSection.hasClass('collapsed');
            advancedSection.toggleClass('collapsed', !isCollapsed);
            if (isCollapsed) {
                advancedToggle.empty();
                advancedToggle.appendChild(createChevronSvg('down'));
                advancedContent.classList.add('oom-advanced-content--expanded');
                advancedContent.classList.remove('oom-advanced-content--collapsed');
            } else {
                advancedToggle.empty();
                advancedToggle.appendChild(createChevronSvg('right'));
                advancedContent.classList.add('oom-advanced-content--collapsed');
                advancedContent.classList.remove('oom-advanced-content--expanded');
            }
        };
        
        advancedSetting.settingEl.addEventListener('click', toggleAdvanced);
        advancedToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAdvanced();
        });

        // Logging Settings (inside Advanced section)
        
        // Store references to conditional settings for showing/hiding
        let logManagementSetting: Setting;
        let performanceSection: HTMLElement;
        
        const updateLoggingSettingsVisibility = (logLevel: string) => {
            const shouldShow = logLevel !== 'off';

            if (logManagementSetting) {
                if (shouldShow) {
                    logManagementSetting.settingEl.classList.add('oom-logging-management--visible');
                    logManagementSetting.settingEl.classList.remove('oom-logging-management--hidden');
                } else {
                    logManagementSetting.settingEl.classList.add('oom-logging-management--hidden');
                    logManagementSetting.settingEl.classList.remove('oom-logging-management--visible');
                }
            }
            if (performanceSection) {
                if (shouldShow) {
                    performanceSection.classList.add('oom-performance-section--visible');
                    performanceSection.classList.remove('oom-performance-section--hidden');
                } else {
                    performanceSection.classList.add('oom-performance-section--hidden');
                    performanceSection.classList.remove('oom-performance-section--visible');
                }
            }
        };
        
        new Setting(advancedContent)
            .setName('Logging level')
            .setDesc('Control the verbosity of logging. Set to "Off" for normal operation, "Info" for basic progress, "Debug" for detailed logging, or "Trace" for maximum verbosity.')
            .addDropdown(dropdown => dropdown
                .addOption('off', 'Off')
                .addOption('errors', 'Errors Only')
                .addOption('warn', 'Warnings')
                .addOption('info', 'Info')
                .addOption('debug', 'Debug')
                .addOption('trace', 'Trace')
                // Cast to any to avoid type issues with LogLevel
                .setValue((this.plugin.settings.logging.level || 'off') as any)
                .onChange(async (value) => {
                    this.plugin.settings.logging.level = value as any;
                    await this.plugin.saveSettings();
                    this.plugin.setLogLevel(value as any);
                    updateLoggingSettingsVisibility(value);
                }));

        // Export logs button
        new Setting(advancedContent)
            .setName('Export logs')
            .setDesc('Export all logs to a JSON file for analysis or sharing')
            .addButton(button => {
                button.setButtonText('Export')
                    .onClick(() => {
                        this.exportLogsToFile();
                    });
            });

        logManagementSetting = new Setting(advancedContent)
            .setName('View and manage logs')
            .setDesc('Easy access to plugin logs for debugging purposes')
            .addButton(button => {
                button.setButtonText('Go to Logging')
                    .onClick(() => {
                        // Close the settings modal first
                        (this.app as any).setting.close();
                        
                        // Open the Test Suite modal with Logging tab
                        const { UnifiedTestSuiteModal } = require('./src/testing/ui/UnifiedTestSuiteModal');
                        const testSuiteModal = new UnifiedTestSuiteModal(this.app, this.plugin);
                        testSuiteModal.open();
                        // Navigate to the logging tab
                        setTimeout(() => {
                            testSuiteModal.selectTab('logging');
                        }, 100);
                    });
            });

        // Add CSS class for conditional visibility
        logManagementSetting.settingEl.classList.add('oom-logging-management');

        // Add section border after logging settings within Advanced
        advancedContent.createEl('div', { cls: 'oom-section-border' });

        // Performance Testing Settings (inside Advanced section)
        performanceSection = advancedContent.createDiv({ cls: 'oom-performance-section' });

        // Performance mode toggle
        new Setting(performanceSection)
            .setName('Enable performance testing mode')
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
                .setName('Maximum files to process')
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
                .setName('Show performance warnings')
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

        // Initialize visibility based on current logging level
        const currentLogLevel = this.plugin.settings.logging.level || 'off';
        updateLoggingSettingsVisibility(currentLogLevel);

        // Add section border after the entire Advanced section
        containerEl.createEl('div', { cls: 'oom-section-border' });

        containerEl.scrollTop = prevScroll;
        if (focusSelector) {
            const toFocus = containerEl.querySelector(focusSelector) as HTMLElement;
            if (toFocus) toFocus.focus();
        }
    }

    private addJournalStructureSettings(containerEl: HTMLElement) {
        // Journal Structure settings button
        new Setting(containerEl)
            .setName('Journal structures and templates')
            .setDesc('Configure how journal and dream callouts are generated and recognized')
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
        templateListContainer.classList.add('oom-template-manager--visible');
        templateListContainer.classList.remove('oom-template-manager--hidden');
        
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
            templateListContainer.classList.add('oom-template-manager--hidden');
            templateListContainer.classList.remove('oom-template-manager--visible');
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
                templateListContainer.classList.add('oom-template-manager--hidden');
                templateListContainer.classList.remove('oom-template-manager--visible');
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
                cls: 'oom-template-preview-container oom-template-preview--hidden' 
            });
            
            const previewContent = previewContainer.createEl('pre', { 
                cls: 'oom-template-preview-content' 
            });
            previewContent.textContent = template.content.substring(0, 300) + 
                (template.content.length > 300 ? '...' : '');
            
            previewButton.addEventListener('click', () => {
                const isHidden = previewContainer.classList.contains('oom-template-preview--hidden');
                if (isHidden) {
                    previewContainer.classList.remove('oom-template-preview--hidden');
                    previewContainer.classList.add('oom-template-preview--visible'); 
                    previewButton.textContent = 'Hide Preview';
                } else {
                    previewContainer.classList.remove('oom-template-preview--visible');
                    previewContainer.classList.add('oom-template-preview--hidden');
                    previewButton.textContent = 'Show Preview';
                }
            });
        }
        
        // Add styles
        this.addTemplateManagerStyles();
    }

    /**
     * Add styles for template manager
     */
    private addTemplateManagerStyles() {
        // Note: Styles for template manager are now in settings.css component stylesheet
        // Per Obsidian reviewer feedback, we should not inject styles dynamically
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
        
        new Setting(containerEl)
            .setName('Missing metrics')
            .setHeading();
        const infoEl = containerEl.createEl('p', { 
            text: `Found ${missingMetrics.length} metrics missing from your settings. Would you like to restore them?`
        });
        
        // Create a container for the buttons
        const buttonContainer = containerEl.createEl('div', {
            cls: 'oom-missing-metrics-buttons'
        });
        
        // Add a restore all button
        const restoreAllButton = buttonContainer.createEl('button', {
            text: 'Restore all metrics',
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
            text: 'Create manually',
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

    /**
     * Export logs to a JSON file with timestamp format
     */
    private exportLogsToFile(): void {
        const memoryAdapter = (this.plugin.logger as any)?.memoryAdapter;
        if (!memoryAdapter) {
            new Notice('Memory adapter not available');
            return;
        }
        
        const entries = memoryAdapter.getEntries();
        if (entries.length === 0) {
            new Notice('No logs to export');
            return;
        }
        
        // Format logs as JSON
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalEntries: entries.length,
            entries: entries.map(entry => ({
                timestamp: entry.timestamp.toISOString(),
                level: entry.level,
                category: entry.category,
                message: entry.message,
                data: entry.data
            }))
        };
        
        // Create timestamp string in format YYYYMMDD-HHMMSS
        const now = new Date();
        const timestamp = 
            now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') + '-' +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');
        
        // Create downloadable file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oomp-logs-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        new Notice(`Exported ${entries.length} log entries to file`);
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


export class FileSuggest extends AbstractInputSuggest<TFile> {
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
        this.setValue(file.path);
        this.close();
    }
}

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
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
        this.setValue(folder.path);
        this.close();
    }
}
