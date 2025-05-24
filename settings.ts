import { App, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, Notice, TFile, TFolder, ExtraButtonComponent, MarkdownRenderer, getIcon } from "obsidian";
import { DEFAULT_METRICS, DreamMetric } from "./types";
import DreamMetricsPlugin from "./main";
import { Eye, Heart, CircleMinus, PenTool, CheckCircle, UsersRound, UserCog, Users, UserCheck, UserX, Sparkles, Wand2, Zap, Glasses, Link, Ruler, Layers, Shell } from 'lucide-static';

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
    setSelectionMode
} from './src/utils/settings-helpers';

// Import metric helpers
import {
    isMetricEnabled,
    setMetricEnabled,
    getMetricMinValue,
    getMetricMaxValue,
    setMetricRange,
    getMetricRange
} from './src/utils/metric-helpers';

// Import selection mode helpers
import {
    isFolderMode,
    isNotesMode,
    areSelectionModesEquivalent,
    getSelectionModeLabel,
    normalizeSelectionMode
} from './src/utils/selection-mode-helpers';

// Import utilities 
import { createFolderAutocomplete, createSelectedNotesAutocomplete } from './autocomplete';

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

// Define DEFAULT_LINTING_SETTINGS for the settings tab to use
const DEFAULT_LINTING_SETTINGS: LintingSettings = {
    enabled: true,
    rules: [],
    structures: [],
    templates: [],
    templaterIntegration: {
        enabled: false,
        folderPath: 'templates/dreams',
        defaultTemplate: 'templates/dreams/default.md'
    },
    contentIsolation: {
        ignoreImages: true,
        ignoreLinks: false,
        ignoreFormatting: true,
        ignoreHeadings: false,
        ignoreCodeBlocks: true,
        ignoreFrontmatter: true,
        ignoreComments: true,
        customIgnorePatterns: []
    },
    userInterface: {
        showInlineValidation: true,
        severityIndicators: {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        },
        quickFixesEnabled: true
    }
};

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

        // Add Ribbon Button Section (move to top)
        containerEl.createEl('h2', { text: 'Ribbon Button' });

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

        // Project Note Path
        new Setting(containerEl)
            .setName('Project Note')
            .setDesc('Note for storing your processed metrics data')
            .addText(text => {
                // Use the helper function to get the project note path
                text.setValue(getProjectNotePath(this.plugin.settings))
                    .setPlaceholder('Path/to/note.md')
                    .onChange(async (value) => {
                        // Use the helper function to set the project note path
                        setProjectNotePath(this.plugin.settings, value);
                        await this.plugin.saveSettings();
                    });

                // Create file picker button
                text.inputEl.style.width = '70%';
                const button = new ButtonComponent(text.inputEl.parentElement!)
                    .setButtonText('Choose')
                    .setClass('oom-browse-button')
                    .onClick(async () => {
                        const modal = new FileSuggestModal(this.app);
                        modal.setPlaceholder('Select project note');
                        modal.onChooseItem = async (item: string) => {
                            if (!item.endsWith('.md')) {
                                item += '.md';
                            }
                            text.setValue(item);
                            // Use the helper function to set the project note path
                            setProjectNotePath(this.plugin.settings, item);
                            await this.plugin.saveSettings();
                        };
                        modal.open();
                    });
            });

        // Add section border after button settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // New section: Metrics Note and Callout Name
        containerEl.createEl('h2', { text: 'Metrics Note and Callout Name' });

        // OneiroMetrics Note Setting
        new Setting(containerEl)
            .setName('OneiroMetrics Note')
            .setDesc('The note where OneiroMetrics tables will be written')
            .addText(text => {
                text.setPlaceholder('Journals/Dream Diary/Metrics/Metrics.md')
                    .setValue(this.plugin.settings.projectNote)
                    .onChange(async (value) => {
                        this.plugin.settings.projectNote = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Metrics Callout Name Setting
        new Setting(containerEl)
            .setName('Metrics Callout Name')
            .setDesc('Name of the callout block used for dream metrics (e.g., "dream-metrics")')
            .addText(text => text
                .setPlaceholder('dream-metrics')
                .setValue(this.plugin.settings.calloutName)
                .onChange(async (value) => {
                    this.plugin.settings.calloutName = value.toLowerCase().replace(/\s+/g, '-');
                    await this.plugin.saveSettings();
                }));

        // Add section border after basic settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Journal Structure Check settings
        this.addJournalStructureSettings(containerEl);
        
        // Add section border after journal structure settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Select Notes/Folders Section
        containerEl.createEl('h2', { text: 'Select Notes/Folders' });
        
        // Selection Mode
        const selectionModeSetting = new Setting(containerEl)
            .setName('Selection Mode')
            .setDesc('How to select notes for analyzing')
            .addDropdown(drop => {
                drop.addOption('notes', 'Selected Notes');
                drop.addOption('folder', 'Selected Folder');
                
                // Use the UI representation (notes/folder)
                const uiMode = getCompatibleSelectionMode(
                    getSelectionMode(this.plugin.settings), 
                    'ui'
                );
                drop.setValue(uiMode);
                
                drop.onChange(async (value) => {
                    // Convert to internal representation (manual/automatic)
                    const internalMode = getCompatibleSelectionMode(value, 'internal');
                    this.plugin.settings.selectionMode = internalMode as 'manual' | 'automatic';
                    
                    // Clear irrelevant selection when switching modes
                    if (isFolderMode(value)) {
                        this.plugin.settings.selectedNotes = [];
                    } else {
                        setSelectedFolder(this.plugin.settings, '');
                    }
                    await this.plugin.saveSettings();
                    this.display();
                });
            });

        // Dynamic label and field based on selection mode
        const uiMode = getCompatibleSelectionMode(
            getSelectionMode(this.plugin.settings), 
            'ui'
        );
        const selectionLabel = getSelectionModeLabel(uiMode);
        const selectionDesc = getSelectionModeDescription(uiMode);
        
        const selectionSetting = new Setting(containerEl)
            .setName(selectionLabel)
            .setDesc(selectionDesc);

        if (isFolderMode(uiMode)) {
            // Folder autocomplete
            selectionSetting.addSearch(search => {
                search.setPlaceholder('Choose folder...');
                search.setValue(getSelectedFolder(this.plugin.settings));
                const parentForSuggestions = search.inputEl.parentElement || containerEl;
                const suggestionContainer = parentForSuggestions.createEl('div', {
                    cls: 'suggestion-container oom-suggestion-container',
                    attr: {
                        style: 'display: none;'
                    }
                });

                // Helper to position the dropdown
                function positionSuggestionContainer() {
                    const inputRect = search.inputEl.getBoundingClientRect();
                    const parent = search.inputEl.parentElement || containerEl;
                    const parentRect = parent.getBoundingClientRect();
                    const dropdownWidth = Math.max(inputRect.width, 180);
                    let left = inputRect.left - parentRect.left;
                    let top = inputRect.bottom - parentRect.top;
                    suggestionContainer.classList.add('oom-suggestion-container');
                    suggestionContainer.style.removeProperty('position');
                    suggestionContainer.style.removeProperty('left');
                    suggestionContainer.style.removeProperty('top');
                    suggestionContainer.style.removeProperty('width');
                    suggestionContainer.style.removeProperty('overflowX');
                    suggestionContainer.style.removeProperty('maxWidth');
                    suggestionContainer.style.removeProperty('right');
                    suggestionContainer.style.setProperty('--oom-suggestion-left', `${left}px`);
                    suggestionContainer.style.setProperty('--oom-suggestion-top', `${top}px`);
                    suggestionContainer.style.setProperty('--oom-suggestion-width', `${dropdownWidth}px`);
                }

                // Clean up suggestion container on plugin unload
                this.plugin.register(() => suggestionContainer.remove());

                // Function to get all folders
                const getFolders = (): string[] => {
                    const folders: string[] = [];
                    const files = this.app.vault.getAllLoadedFiles();
                    files.forEach(file => {
                        if (file instanceof TFolder) {
                            folders.push(file.path);
                        }
                    });
                    return folders.sort((a, b) => a.localeCompare(b));
                };

                // Function to show suggestions
                const showSuggestions = (query: string) => {
                    const folders = getFolders();
                    const normalizedQuery = query.toLowerCase();
                    const filteredFolders = folders
                        .filter(folder => folder.toLowerCase().includes(normalizedQuery))
                        .slice(0, 10);
                    console.log('[Backup Folder] all folders:', folders);
                    console.log('[Backup Folder] filtered folders:', filteredFolders);

                    suggestionContainer.empty();
                    
                    if (filteredFolders.length > 0) {
                        filteredFolders.forEach(folder => {
                            const item = suggestionContainer.createEl('div', {
                                cls: 'suggestion-item',
                                attr: { title: folder }
                            });
                            item.textContent = folder;
                            
                            item.addEventListener('mousedown', async (e) => {
                                e.preventDefault();
                                search.setValue(folder);
                                setSelectedFolder(this.plugin.settings, folder);
                                this.plugin.settings.backupFolderPath = folder;
                                await this.plugin.saveSettings();
                                suggestionContainer.classList.remove('visible');
                                suggestionContainer.style.display = 'none';
                            });
                        });
                        
                        positionSuggestionContainer();
                        suggestionContainer.classList.add('visible');
                        suggestionContainer.style.display = 'block';
                    } else {
                        suggestionContainer.classList.remove('visible');
                        suggestionContainer.style.display = 'none';
                    }
                };

                // Update search input handling
                search.inputEl.addEventListener('input', debounce((e) => {
                    showSuggestions(search.inputEl.value);
                }, 300));

                search.inputEl.addEventListener('focus', debounce((e) => {
                    showSuggestions(search.inputEl.value);
                }, 300));

                // Keyboard navigation for suggestions
                search.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
                    const items = suggestionContainer.querySelectorAll('.suggestion-item');
                    const currentIndex = Array.from(items).findIndex(item => 
                        item.classList.contains('is-selected')
                    );

                    switch (e.key) {
                        case 'ArrowDown':
                            e.preventDefault();
                            if (currentIndex < items.length - 1) {
                                items[currentIndex]?.classList.remove('is-selected');
                                items[currentIndex + 1].classList.add('is-selected');
                                (items[currentIndex + 1] as HTMLElement).scrollIntoView({ block: 'nearest' });
                            }
                            break;

                        case 'ArrowUp':
                            e.preventDefault();
                            if (currentIndex > 0) {
                                items[currentIndex]?.classList.remove('is-selected');
                                items[currentIndex - 1].classList.add('is-selected');
                                (items[currentIndex - 1] as HTMLElement).scrollIntoView({ block: 'nearest' });
                            }
                            break;

                        case 'Enter':
                            e.preventDefault();
                            const selectedItem = suggestionContainer.querySelector('.is-selected');
                            if (selectedItem) {
                                const folder = selectedItem.textContent;
                                if (folder) {
                                    search.setValue(folder);
                                    setSelectedFolder(this.plugin.settings, folder);
                                    this.plugin.settings.backupFolderPath = folder;
                                    this.plugin.saveSettings();
                                    suggestionContainer.classList.add('visible');
                                    suggestionContainer.classList.remove('visible');
                                }
                            }
                            break;

                        case 'Escape':
                            suggestionContainer.classList.remove('visible');
                            suggestionContainer.style.display = 'none';
                            break;
                    }
                });

                // Hide suggestions on blur (with delay for click)
                search.inputEl.addEventListener('blur', () => {
                    setTimeout(() => { suggestionContainer.classList.remove('visible'); suggestionContainer.style.display = 'none'; }, 200);
                });

                // Update suggestions on resize
                window.addEventListener('resize', () => {
                    if (suggestionContainer.classList.contains('visible')) {
                        positionSuggestionContainer();
                    }
                });
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
                button.setButtonText('View Descriptions')
                    .onClick(() => {
                        new MetricsDescriptionsModal(this.app, this.plugin).open();
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
                            enabled: true,
                            category: 'custom'
                        },
                        Object.values(this.plugin.settings.metrics),
                        async (metric) => {
                            this.plugin.settings.metrics[metric.name] = metric;
                            await this.plugin.saveSettings();
                            this.display();
                        }
                    ).open();
                });
        });

        // Add Metrics List
        const metricsContainer = containerEl.createEl('div', { cls: 'oom-metrics-container' });
        
        // Group metrics by enabled state
        const enabledMetrics = Object.entries(this.plugin.settings.metrics)
            .filter(([_, metric]) => isMetricEnabled(metric));
        const disabledMetrics = Object.entries(this.plugin.settings.metrics)
            .filter(([_, metric]) => !isMetricEnabled(metric));

        // Display enabled metrics
        if (enabledMetrics.length > 0) {
            metricsContainer.createEl('h2', { text: 'Enabled Metrics' });
            enabledMetrics.forEach(([key, metric]) => {
                const metricSetting = new Setting(metricsContainer)
                    .setName(metric.name)
                    .setDesc(metric.description || "")
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
                                        this.plugin.settings.metrics[updatedMetric.name] = updatedMetric;
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
            });
        }

        // Display disabled metrics
        if (disabledMetrics.length > 0) {
            metricsContainer.createEl('h2', { text: 'Disabled Metrics' });
            disabledMetrics.forEach(([key, metric]) => {
                const metricSetting = new Setting(metricsContainer)
                    .setName(metric.name)
                    .setDesc(metric.description || "")
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
                                        this.plugin.settings.metrics[updatedMetric.name] = updatedMetric;
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
            });
        }

        // Add section border after metrics settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Backup Settings Section
        containerEl.createEl('h2', { text: 'Backup Settings' });

        // Backup Enabled toggle
        new Setting(containerEl)
            .setName('Create Backups')
            .setDesc('Create backups of the project note before making changes')
            .addToggle(toggle => toggle
                .setValue(isBackupEnabled(this.plugin.settings))
                .onChange(async (value) => {
                    setBackupEnabled(this.plugin.settings, value);
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide backup folder setting
                }));

        // Backup Folder Path (only shown when backups are enabled)
        if (isBackupEnabled(this.plugin.settings)) {
            const backupFolderSetting = new Setting(containerEl)
                .setName('Backup Folder')
                .setDesc('Select an existing folder where backups will be stored')
                .addSearch(search => {
                    search
                        .setPlaceholder('Choose backup folder...')
                        .setValue(getBackupFolderPath(this.plugin.settings));

                    // Create suggestion container with fixed positioning
                    const parentForSuggestions = search.inputEl.parentElement || containerEl;
                    const suggestionContainer = parentForSuggestions.createEl('div', {
                        cls: 'suggestion-container oom-suggestion-container',
                        attr: {
                            style: `
                                display: none;
                                position: absolute;
                                z-index: 1000;
                                background: var(--background-primary);
                                border: 1px solid var(--background-modifier-border);
                                border-radius: 4px;
                                max-height: 200px;
                                overflow-y: auto;
                                min-width: 180px;
                                width: 100%;
                                box-shadow: 0 2px 8px var(--background-modifier-box-shadow);
                            `
                        }
                    });

                    // Helper to position the dropdown
                    function positionSuggestionContainer() {
                        const inputRect = search.inputEl.getBoundingClientRect();
                        const parent = search.inputEl.parentElement || containerEl;
                        const parentRect = parent.getBoundingClientRect();
                        const dropdownWidth = Math.max(inputRect.width, 180);
                        let left = inputRect.left - parentRect.left;
                        let top = inputRect.bottom - parentRect.top;
                        suggestionContainer.classList.add('oom-suggestion-container');
                        suggestionContainer.style.removeProperty('position');
                        suggestionContainer.style.removeProperty('left');
                        suggestionContainer.style.removeProperty('top');
                        suggestionContainer.style.removeProperty('width');
                        suggestionContainer.style.removeProperty('overflowX');
                        suggestionContainer.style.removeProperty('maxWidth');
                        suggestionContainer.style.removeProperty('right');
                        suggestionContainer.style.setProperty('--oom-suggestion-left', `${left}px`);
                        suggestionContainer.style.setProperty('--oom-suggestion-top', `${top}px`);
                        suggestionContainer.style.setProperty('--oom-suggestion-width', `${dropdownWidth}px`);
                    }

                    // Clean up suggestion container on plugin unload
                    this.plugin.register(() => suggestionContainer.remove());

                    // Function to get all folders
                    const getFolders = (): string[] => {
                        const folders: string[] = [];
                        const files = this.app.vault.getAllLoadedFiles();
                        files.forEach(file => {
                            if (file instanceof TFolder) {
                                folders.push(file.path);
                            }
                        });
                        return folders.sort((a, b) => a.localeCompare(b));
                    };

                    // Function to show suggestions
                    const showSuggestions = (query: string) => {
                        const folders = getFolders();
                        const normalizedQuery = query.toLowerCase();
                        const filteredFolders = folders
                            .filter(folder => folder.toLowerCase().includes(normalizedQuery))
                            .slice(0, 10);
                        console.log('[Backup Folder] all folders:', folders);
                        console.log('[Backup Folder] filtered folders:', filteredFolders);

                        suggestionContainer.empty();
                        
                        if (filteredFolders.length > 0) {
                            filteredFolders.forEach(folder => {
                                const item = suggestionContainer.createEl('div', {
                                    cls: 'suggestion-item',
                                    attr: { title: folder }
                                });
                                item.textContent = folder;
                                
                                // Add hover effect
                                item.classList.add('selected');
                                item.classList.remove('selected');
                                
                                item.addEventListener('mousedown', async (e) => {
                                    e.preventDefault();
                                    search.setValue(folder);
                                    setSelectedFolder(this.plugin.settings, folder);
                                    this.plugin.settings.backupFolderPath = folder;
                                    await this.plugin.saveSettings();
                                    suggestionContainer.classList.remove('visible');
                                    suggestionContainer.style.display = 'none';
                                });
                            });
                            
                            positionSuggestionContainer();
                            suggestionContainer.classList.add('visible');
                            suggestionContainer.style.display = 'block';
                        } else {
                            suggestionContainer.classList.remove('visible');
                            suggestionContainer.style.display = 'none';
                        }
                    };

                    // Update search input handling
                    search.inputEl.addEventListener('input', debounce((e) => {
                        showSuggestions(search.inputEl.value);
                    }, 300));

                    search.inputEl.addEventListener('focus', debounce((e) => {
                        showSuggestions(search.inputEl.value);
                    }, 300));

                    // Keyboard navigation for suggestions
                    search.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
                        const items = suggestionContainer.querySelectorAll('.suggestion-item');
                        const currentIndex = Array.from(items).findIndex(item => 
                            item.classList.contains('is-selected')
                        );

                        switch (e.key) {
                            case 'ArrowDown':
                                e.preventDefault();
                                if (currentIndex < items.length - 1) {
                                    items[currentIndex]?.classList.remove('is-selected');
                                    items[currentIndex + 1].classList.add('is-selected');
                                    (items[currentIndex + 1] as HTMLElement).scrollIntoView({ block: 'nearest' });
                                }
                                break;

                            case 'ArrowUp':
                                e.preventDefault();
                                if (currentIndex > 0) {
                                    items[currentIndex]?.classList.remove('is-selected');
                                    items[currentIndex - 1].classList.add('is-selected');
                                    (items[currentIndex - 1] as HTMLElement).scrollIntoView({ block: 'nearest' });
                                }
                                break;

                            case 'Enter':
                                e.preventDefault();
                                const selectedItem = suggestionContainer.querySelector('.is-selected');
                                if (selectedItem) {
                                    const folder = selectedItem.textContent;
                                    if (folder) {
                                        search.setValue(folder);
                                        setSelectedFolder(this.plugin.settings, folder);
                                        this.plugin.settings.backupFolderPath = folder;
                                        this.plugin.saveSettings();
                                        suggestionContainer.classList.add('visible');
                                        suggestionContainer.classList.remove('visible');
                                    }
                                }
                                break;

                            case 'Escape':
                                suggestionContainer.classList.remove('visible');
                                suggestionContainer.style.display = 'none';
                                break;
                        }
                    });

                    // Hide suggestions on blur (with delay for click)
                    search.inputEl.addEventListener('blur', () => {
                        setTimeout(() => { suggestionContainer.classList.remove('visible'); suggestionContainer.style.display = 'none'; }, 200);
                    });

                    // Update suggestions on resize
                    window.addEventListener('resize', () => {
                        if (suggestionContainer.classList.contains('visible')) {
                            positionSuggestionContainer();
                        }
                    });
                });
        }

        // Add section border after backup settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Logging Settings Section
        containerEl.createEl('h2', { text: 'Logging Settings' });
        
        new Setting(containerEl)
            .setName('Logging Level')
            .setDesc('Control the verbosity of logging. Set to "Off" for normal operation, "Errors Only" for minimal logging, or "Debug" for detailed logging.')
            .addDropdown(dropdown => dropdown
                .addOption('off', 'Off')
                .addOption('errors', 'Errors Only')
                .addOption('warn', 'Warnings')
                .addOption('info', 'Info')
                .addOption('debug', 'Debug')
                .addOption('trace', 'Trace')
                .setValue(this.plugin.settings.logging.level || 'off')
                .onChange(async (value: LogLevel) => {
                    this.plugin.settings.logging.level = value;
                    await this.plugin.saveSettings();
                    this.plugin.setLogLevel(value);
                }));

        new Setting(containerEl)
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
                            this.plugin.settings.logging.level,
                            size,
                            this.plugin.settings.logging.maxBackups
                        );
                    }
                }));

        new Setting(containerEl)
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
                            this.plugin.settings.logging.level,
                            this.plugin.settings.logging.maxSize,
                            backups
                        );
                    }
                }));

        // Add section border after logging settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        containerEl.scrollTop = prevScroll;
        if (focusSelector) {
            const toFocus = containerEl.querySelector(focusSelector) as HTMLElement;
            if (toFocus) toFocus.focus();
        }
    }

    private addJournalStructureSettings(containerEl: HTMLElement) {
        containerEl.createEl('h2', { text: 'Journal Structure' });
        
        // Enable/disable linting
        new Setting(containerEl)
            .setName('Enable Structure Validation')
            .setDesc('Validate journal entries against defined structures')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.linting?.enabled ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.linting) {
                        this.plugin.settings.linting = { ...DEFAULT_LINTING_SETTINGS };
                    }
                    this.plugin.settings.linting.enabled = value;
                    await this.plugin.saveSettings();
                }));
        
        // Journal Structure settings button
        new Setting(containerEl)
            .setName('Journal Structure Settings')
            .setDesc('Configure and manage all journal structure settings')
            .addButton(button => button
                .setButtonText('Open Settings')
                .onClick(() => {
                    new JournalStructureModal(this.app, this.plugin).open();
                }));

        // Templater status indicator
        if (this.plugin.templaterIntegration) {
            const isTemplaterInstalled = this.plugin.templaterIntegration.isTemplaterInstalled();
            const isEnabled = this.plugin.settings.linting?.templaterIntegration?.enabled ?? false;
            
            let status = '';
            let statusClass = '';
            
            if (!isTemplaterInstalled) {
                status = 'Templater plugin not installed';
                statusClass = 'oom-status-warning';
            } else if (!isEnabled) {
                status = 'Templater integration disabled';
                statusClass = 'oom-status-neutral';
            } else {
                status = 'Templater integration active';
                statusClass = 'oom-status-success';
            }
            
            new Setting(containerEl)
                .setName('Templater Status')
                .setDesc('Status of Templater integration')
                .addExtraButton(button => {
                    button.setIcon(isTemplaterInstalled ? (isEnabled ? 'checkmark-circle' : 'alert-circle') : 'x-circle');
                    button.setTooltip(status);
                    button.extraSettingsEl.addClass(statusClass);
                    return button;
                })
                .infoEl.setText(status);
        }
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
                new TemplateWizard(this.app, this.plugin, this.plugin.templaterIntegration, template).open();
                
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
}

// --- Metrics Descriptions Modal ---
class MetricsDescriptionsModal extends Modal {
    plugin: DreamMetricsPlugin;
    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-metrics-modal');
        // Modal Title
        contentEl.createEl('h2', { text: 'Metrics Descriptions' });
        // Markdown content (default + optional)
        const allMetricsMarkdown = `### Default Metrics\n\n- **Sensory Detail (Score 1-5):** Level of sensory information recalled from the dream.\n- **Emotional Recall (Score 1-5):** Level of emotional detail recalled from the dream.\n- **Descriptiveness (Score 1-5):** Level of detail in the dream description.\n- **Characters Role (Score 1-5):** Significance of familiar characters in the dream narrative.\n- **Confidence Score (Score 1-5):** Confidence level in the completeness of dream recall.\n\n#### Full Descriptions\n\n#### Sensory Detail (Score 1-5)\nThis metric aims to capture the richness and vividness of the sensory information you recall from your dream.\n\n| Score        | Description |\n| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n| 1 (Minimal)  | You recall very little sensory information. The dream feels vague and lacks specific sights, sounds, textures, smells, or tastes. You might remember the general feeling of a place but not any distinct visual elements, for example. |\n| 2 (Limited)  | You recall a few basic sensory details, perhaps a dominant color or a general sound. The sensory landscape is still quite sparse. |\n| 3 (Moderate) | You recall a noticeable amount of sensory information. You might remember some visual details, perhaps a few distinct sounds, or a general feeling of touch. |\n| 4 (Rich)     | You recall a significant amount of sensory information across multiple senses. You can describe specific visual elements, distinct sounds, perhaps a smell or a texture. The dream feels more immersive. |\n| 5 (Vivid)    | Your recall is highly detailed and encompasses a wide range of sensory experiences. You can clearly describe intricate visual scenes, distinct and multiple sounds, and perhaps even specific tastes and smells. The dream feels very real and alive in your memory. |\n\n#### Emotional Recall (Score 1-5)\nThis metric focuses on your ability to remember and articulate the emotions you experienced within the dream.\n\n| Score                | Description |\n| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n| 1 (Vague)            | You have a faint sense that you felt some emotion in the dream, but you can't identify it specifically. You might just say you felt \"something.\" |\n| 2 (General)          | You can identify a primary emotion (e.g., happy, sad, scared) but can't describe its intensity or nuances. |\n| 3 (Identified)       | You can identify one or two specific emotions you felt and perhaps describe their general intensity. |\n| 4 (Nuanced)          | You recall several distinct emotions and can describe some of the nuances or shifts in your feelings throughout the dream. |\n| 5 (Deep and Complex) | You have a strong recollection of the emotional landscape of the dream, including multiple emotions, their intensity, how they evolved, and perhaps even subtle emotional undertones. |\n\n#### Descriptiveness (Score 1-5)\nThis metric assesses the level of detail and elaboration in your written dream capture, beyond just sensory details (which have their own metric). This considers how thoroughly you describe the events, characters, interactions, and the overall narrative flow.\n\n| Score                | Description |\n| -------------------- | ----------- |\n| 1 (Minimal)          | Your capture is very brief and outlines only the most basic elements of the dream. It lacks detail and elaboration. |\n| 2 (Limited)          | Your capture provides a basic account of the dream but lacks significant descriptive detail in terms of actions, character behavior, or plot progression. |\n| 3 (Moderate)         | Your capture provides a reasonably detailed account of the main events and characters, with some descriptive language used. |\n| 4 (Detailed)         | Your capture includes a significant level of descriptive detail, bringing the dream narrative and its elements to life with more thorough explanations and imagery. |\n| 5 (Highly Elaborate) | Your capture is very rich in detail, using vivid language to describe the events, characters, their motivations (if perceived), and the overall unfolding of the dream narrative. |\n\n#### Characters Role (Score 1-5)\nThis metric tracks the significance of familiar characters in the dream narrative.\n\n| Score                | Description |\n| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n| 1 (None)             | No familiar characters appear in the dream. |\n| 2 (Background)       | Familiar characters appear but only in minor or background roles. |\n| 3 (Supporting)       | Familiar characters play supporting roles in the dream narrative. |\n| 4 (Major)            | Familiar characters are central to the dream's events or narrative. |\n| 5 (Dominant)         | The dream is primarily about or dominated by interactions with familiar characters. |\n\n#### Confidence Score (Score 1-5)\nThis is a subjective metric reflecting your overall sense of how complete and accurate your dream recall feels immediately after waking. It's your gut feeling about how much of the dream you've managed to retrieve.\n\n| Score         | Description |\n| ------------- | ----------- |\n| 1 (Very Low)  | You feel like you've barely scratched the surface of the dream, remembering only a tiny fragment or a fleeting feeling. You suspect you've forgotten a significant portion. |\n| 2 (Low)       | You recall a bit more, but you still feel like a substantial part of the dream is lost. The recall feels fragmented and incomplete. |\n| 3 (Moderate)  | You feel like you've recalled a fair amount of the dream, perhaps the main storyline, but there might be some fuzzy areas or details you're unsure about. |\n| 4 (High)      | You feel like you've recalled the majority of the dream with a good level of detail and coherence. You feel relatively confident in the accuracy of your memory. |\n| 5 (Very High) | You feel like you've recalled the entire dream in vivid detail and with strong confidence in the accuracy and completeness of your memory. You don't have a sense of significant missing parts. |\n\n---\n\n### Optional Metrics\n\n(See plugin documentation for full details.)\n\n### Characters Count\nThis metric represents the total number of characters in your dream. It is automatically calculated as the sum of Familiar Count and Unfamiliar Count.\n\n### Familiar Count\nThis metric tracks the number of characters you know from your waking life that appear in the dream. This includes people, pets, or any other familiar beings.\n\n### Unfamiliar Count\nThis metric tracks the number of characters you don't know from your waking life that appear in the dream. This includes strangers, fictional characters, or any other unfamiliar beings.\n\n### Characters List\nThis metric allows you to list all characters that appeared in your dream. You can add multiple entries, one per line. For example:\n\`\`\`markdown\nMom\nDad\nMy dog Max\nA stranger in a red coat\n\`\`\`\n\n### Dream Theme (Categorical/Keywords)\nThis metric aims to identify the dominant subjects, ideas, or emotional undercurrents present in your dream. Instead of a numerical score, you will select one or more keywords or categories that best represent the core themes of the dream.\n\n*Possible Categories/Keywords (Examples - User-definable list in plugin recommended):*\nTravel/Journey, Conflict/Argument, Learning/Discovery, Loss/Grief, Joy/Happiness, Fear/Anxiety, Absurdity/Surrealism, Creativity/Inspiration, Relationship Dynamics, Work/Career, Health/Illness, Nostalgia/Past, Technology, Nature/Environment, Spiritual/Mystical, Transformation, Communication, Power/Control, Vulnerability\n\n### Lucidity Level (Score 1-5)\nThis metric tracks your degree of awareness that you are dreaming while the dream is in progress.\n\n* 1 (Non-Lucid): You have no awareness that you are dreaming.\n* 2 (Faint Awareness): You might have a fleeting thought or a vague feeling that something is unusual or dreamlike, but this awareness doesn't solidify into the certainty that you are dreaming.\n* 3 (Clear Awareness): You become clearly aware that you are dreaming. However, your ability to control or influence the dream environment and events might be limited. You are an observer who knows it's a dream.\n* 4 (Moderate Control): You are aware that you are dreaming and can actively influence some aspects of the dream, such as your own actions, the environment to a limited extent, or the course of the narrative.\n* 5 (High Lucidity): You have a strong and stable awareness that you are dreaming and possess a significant degree of control over the dream environment, characters, and events.\n\n### Dream Coherence (Score 1-5)\nThis metric assesses the logical consistency and narrative flow of your dream.\n\n* 1 (Incoherent): The dream is fragmented, disjointed, and nonsensical.\n* 2 (Loosely Connected): Some elements or scenes might have a vague or thematic relationship, but the overall narrative lacks a clear and logical progression.\n* 3 (Moderately Coherent): The dream has a discernible narrative thread, but it may contain illogical elements, inconsistencies in character behavior or setting, or sudden, unexplained shifts in the storyline.\n* 4 (Mostly Coherent): The dream generally follows a logical progression with a relatively consistent narrative, characters, and settings. Any illogical elements are minor or don't significantly disrupt the overall sense of a somewhat realistic (albeit dreamlike) experience.\n* 5 (Highly Coherent): The dream feels like a consistent and logical experience, even if the content is surreal or fantastical.\n\n### Setting Familiarity (Score 1-5)\nThis metric tracks the degree to which the locations and environments in your dream are recognizable from your waking life.\n\n* 1 (Completely Unfamiliar): All the settings in the dream are entirely novel and have no discernible connection to any places you have experienced in your waking life.\n* 2 (Vaguely Familiar): You experience a sense of déjà vu or a faint feeling of having been in a similar place before, but you cannot specifically identify the location or its connection to your waking memories.\n* 3 (Partially Familiar): The dream settings are a blend of recognizable and unfamiliar elements.\n* 4 (Mostly Familiar): The dream primarily takes place in locations you know from your waking life, such as your home, workplace, or familiar landmarks, although there might be minor alterations or unusual juxtapositions.\n* 5 (Completely Familiar): All the settings in the dream are direct and accurate representations of places you know well from your waking experience, without any significant alterations or unfamiliar elements.\n\n### Ease of Recall (Score 1-5)\nThis metric assesses how readily and effortlessly you can remember the dream upon waking.\n\n* 1 (Very Difficult): You wake up with little to no memory of having dreamed.\n* 2 (Difficult): You remember a few isolated images, emotions, or very brief snippets of the dream, but the overall narrative is elusive and hard to piece together.\n* 3 (Moderate): You can recall the basic outline or a few key scenes of the dream with a reasonable amount of effort.\n* 4 (Easy): You remember the dream relatively clearly and can recount a significant portion of the narrative and details without much difficulty.\n* 5 (Very Easy): The dream is vividly and immediately present in your memory upon waking.\n\n### Recall Stability (Score 1-5)\nThis metric assesses how well your memory of the dream holds up in the minutes immediately following waking.\n\n* 1 (Rapidly Fading): The dream memory begins to dissipate almost instantly upon waking.\n* 2 (Significant Fading): You can recall a fair amount initially, but key details and the overall narrative structure fade noticeably within the first 10-15 minutes after waking, making it difficult to reconstruct the full dream later.\n* 3 (Moderate Fading): Some details and less significant parts of the dream might fade within the first 15-30 minutes, but the core narrative and key events remain relatively intact.\n* 4 (Mostly Stable): Your recall of the dream remains largely consistent for at least 30 minutes after waking.\n* 5 (Very Stable): The memory of the dream feels solid and enduring in the immediate post-waking period.`;
        const descDiv = contentEl.createEl('div');
        MarkdownRenderer.renderMarkdown(allMetricsMarkdown, descDiv, this.plugin.app.vault.getAbstractFileByPath('') as any, this.plugin);
        // Inject Lucide icons into headings
        const iconMap: Record<string, string> = {
            'Sensory Detail': 'eye',
            'Emotional Recall': 'heart',
            'Descriptiveness': 'pen-tool',
            'Characters Role': 'user-cog',
            'Confidence Score': 'check-circle',
            'Characters Count': 'users',
            'Familiar Count': 'user-check',
            'Unfamiliar Count': 'user-x',
            'Characters List': 'users-round',
            'Dream Theme': 'sparkles',
            'Lucidity Level': 'wand-2',
            'Dream Coherence': 'link',
            'Setting Familiarity': 'glasses',
            'Ease of Recall': 'zap',
            'Recall Stability': 'layers'
        };
        // For h3/h4 headings, inject icon if heading matches
        const headings = descDiv.querySelectorAll('h3, h4');
        headings.forEach(h => {
            const text = h.textContent || '';
            for (const key in iconMap) {
                if (text.startsWith(key)) {
                    const iconName = iconMap[key];
                    if (lucideIconMap[iconName]) {
                        const iconSpan = document.createElement('span');
                        iconSpan.className = 'oom-metric-desc-icon';
                        iconSpan.innerHTML = lucideIconMap[iconName];
                        h.insertBefore(iconSpan, h.firstChild);
                        break;
                    }
                }
            }
        });
        // OK button
        const btnRow = contentEl.createEl('div', { cls: 'oom-metrics-modal-btn-row' });
        btnRow.style.display = 'flex';
        btnRow.style.justifyContent = 'center';
        btnRow.style.marginTop = '2em';
        const okBtn = btnRow.createEl('button', { text: 'OK', cls: 'oom-button oom-button--primary' });
        okBtn.onclick = () => this.close();
    }
}

// --- Metrics Callout Customizations Modal ---
class MetricsCalloutCustomizationsModal extends Modal {
    plugin: DreamMetricsPlugin;
    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-callout-modal');
        contentEl.createEl('h2', { text: 'Metrics Callout Customizations' });
        // State for the callout structure
        let calloutMetadata = '';
        let singleLine = false;
        // Helper to build the callout structure
        const buildCallout = () => {
            const meta = calloutMetadata.trim();
            const metaStr = meta ? `|${meta}` : '';
            const header = `> [!dream-metrics${metaStr}]`;
            const metrics = [
                'Sensory Detail:',
                'Emotional Recall:',
                'Lost Segments:',
                'Descriptiveness:',
                'Confidence Score:'
            ];
            if (singleLine) {
                return `${header}\n> ${metrics.join(' , ')}`;
            } else {
                return `${header}\n> ${metrics.join(' \n> ')}`;
            }
        };
        // Callout Structure Preview (styled div)
        const calloutBox = contentEl.createEl('div', {
            cls: 'oom-callout-structure-box',
        });
        calloutBox.style.width = '100%';
        calloutBox.style.minHeight = '90px';
        calloutBox.style.fontFamily = 'var(--font-monospace, monospace)';
        calloutBox.style.fontSize = '0.93em';
        calloutBox.style.background = '#f5f5f5';
        calloutBox.style.border = '1px solid #bbb';
        calloutBox.style.borderRadius = '4px';
        calloutBox.style.marginBottom = '0.7em';
        calloutBox.style.padding = '8px 12px';
        calloutBox.style.whiteSpace = 'pre-wrap';
        calloutBox.style.wordBreak = 'break-word';
        calloutBox.style.userSelect = 'all';
        calloutBox.textContent = buildCallout();
        // Copy button
        const copyBtn = contentEl.createEl('button', { text: 'Copy', cls: 'oom-copy-btn' });
        copyBtn.style.fontSize = '0.92em';
        copyBtn.style.padding = '2px 10px';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.border = '1px solid #bbb';
        copyBtn.style.background = '#f5f5f5';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.marginBottom = '1em';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(calloutBox.textContent || '');
            new Notice('Copied!');
        };
        // Single-Line Toggle
        new Setting(contentEl)
            .setName('Single-Line Callout Structure')
            .setDesc('Show all metric fields on a single line in the callout structure')
            .addToggle(toggle => {
                toggle.setValue(singleLine)
                    .onChange(async (value) => {
                        singleLine = value;
                        calloutBox.textContent = buildCallout();
                    });
            });
        // Callout Metadata Field
        new Setting(contentEl)
            .setName('Callout Metadata')
            .setDesc('Default metadata to include in dream callouts')
            .addText(text => text
                .setPlaceholder('Enter metadata')
                .setValue(calloutMetadata)
                .onChange(async (value) => {
                    calloutMetadata = value;
                    await this.plugin.saveSettings();
                }));
    }
} 