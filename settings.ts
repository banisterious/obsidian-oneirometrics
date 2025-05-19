import { App, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, Notice, TFile, TFolder, ExtraButtonComponent, MarkdownRenderer, getIcon } from "obsidian";
import { DEFAULT_METRICS, DreamMetric, DreamMetricsSettings, LogLevel } from "./types";
import DreamMetricsPlugin from "./main";
import { Eye, Heart, CircleMinus, PenTool, CheckCircle, UsersRound, UserCog, Users, UserCheck, UserX, Sparkles, Wand2, Zap, Glasses, Link, Ruler, Layers, Shell } from 'lucide-static';

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
        let rangeSetting: Setting | undefined;
        const renderRangeSection = () => {
            rangeSection.empty();
            const isAnyWholeNumber = ["Lost Segments", "Familiar People"].includes(this.metric.name);
            if (!isAnyWholeNumber) {
                rangeSetting = new Setting(rangeSection)
                    .setName('Range')
                    .setDesc('The valid range for this metric')
                    .addText(text => {
                        text.setValue(this.metric.range.min.toString())
                            .setPlaceholder('Min')
                            .onChange(value => {
                                const min = parseInt(value);
                                const error = validateMetricRange(min, this.metric.range.max);
                                rangeSetting!.setDesc(error || 'The valid range for this metric');
                                rangeSetting!.controlEl.classList.toggle('is-invalid', !!error);
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
                                rangeSetting!.setDesc(error || 'The valid range for this metric');
                                rangeSetting!.controlEl.classList.toggle('is-invalid', !!error);
                                if (!isNaN(max)) this.metric.range.max = max;
                                this.updatePreview();
                            });
                    });
            } else {
                new Setting(rangeSection)
                    .setName('Valid values')
                    .setDesc('Any whole number (integer)');
            }
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

        // Add enable/disable toggle
        const enableSection = contentEl.createEl('div', { cls: 'oom-metric-editor-section' });
        new Setting(enableSection)
            .setName('Enabled')
            .setDesc('Whether this metric should be enabled by default')
            .addToggle(toggle => {
                toggle
                    .setValue(this.metric.enabled)
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
            const el = this.contentEl.querySelector('.oom-metric-preview');
            if (!el) return;
            previewEl = el as HTMLElement;
        }
        previewEl.empty();

        // Create callout header
        previewEl.createEl('div', { text: `> [!dream-metrics]` });

        // Create metric line with a sample value, including icon if present
        const sampleValue = Math.floor((this.metric.range.min + this.metric.range.max) / 2);
        const metricLine = previewEl.createEl('div', { cls: 'oom-metric-preview-line' });
        if (this.metric.icon && lucideIconMap[this.metric.icon]) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'oom-metric-icon-svg oom-metric-icon--start';
            iconSpan.innerHTML = lucideIconMap[this.metric.icon];
            iconSpan.style.verticalAlign = 'middle';
            iconSpan.style.display = 'inline-block';
            iconSpan.style.width = '1.2em';
            iconSpan.style.height = '1.2em';
            iconSpan.style.marginRight = '0.4em';
            metricLine.appendChild(iconSpan);
        }
        metricLine.appendChild(document.createTextNode(`${this.metric.name}: ${sampleValue}`));

        // Add range information
        if (["Lost Segments", "Familiar People"].includes(this.metric.name)) {
            previewEl.createEl('div', {
                cls: 'oom-preview-range',
                text: `Valid values: Any whole number`
            });
        } else {
            previewEl.createEl('div', {
                cls: 'oom-preview-range',
                text: `Valid range: ${this.metric.range.min} to ${this.metric.range.max}`
            });
        }
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
            cls: 'oom-notice oom-notice--info',
            attr: {
                style: `
                    margin: 1em 0;
                    padding: 1em;
                    background: var(--background-modifier-hover);
                    border: 1px solid var(--text-muted);
                    border-radius: 4px;
                    color: var(--text-normal);
                `
            }
        });
        noticeEl.createEl('strong', { text: 'Note: ' });
        noticeEl.createEl('span', { 
            text: 'OneiroMetrics is optimized for Reading View mode. While Live Preview is supported, you may experience some layout inconsistencies.'
        });

        // Add OneiroMetrics Buttons Section (move to top)
        containerEl.createEl('h2', { text: 'OneiroMetrics Buttons' });

        // Show Ribbon Buttons Setting
        const ribbonLabelFrag = document.createDocumentFragment();
        ribbonLabelFrag.append('Show OneiroMetrics Ribbon Buttons ');
        const wandSvg = getIcon('wand-sparkles');
        const shellSvg = getIcon('shell');
        const iconsSpan = document.createElement('span');
        iconsSpan.classList.add('oom-example-button');
        if (wandSvg) {
            wandSvg.setAttribute('width', '16');
            wandSvg.setAttribute('height', '16');
            iconsSpan.append(wandSvg);
        } else {
            iconsSpan.append('(?)');
        }
        if (shellSvg) {
            shellSvg.setAttribute('width', '16');
            shellSvg.setAttribute('height', '16');
            iconsSpan.append(shellSvg);
        } else {
            iconsSpan.append('(?)');
        }
        ribbonLabelFrag.append(iconsSpan);
        new Setting(containerEl)
            .setName(ribbonLabelFrag)
            .setDesc('Add ribbon buttons to quickly open the Dream Scrape tool or your metrics note')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showRibbonButtons ?? true)
                .onChange(async (value) => {
                    this.plugin.settings.showRibbonButtons = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateRibbonIcons();
                }));

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

        // Add Select Notes/Folders Section
        containerEl.createEl('h2', { text: 'Select Notes/Folders' });
        
        new Setting(containerEl)
            .setName('File or Folder Selection')
            .setDesc('Choose whether to select individual notes or a folder for metrics scraping')
            .addDropdown(drop => {
                drop.addOption('notes', 'Notes');
                drop.addOption('folder', 'Folder');
                drop.setValue(this.plugin.settings.selectionMode || 'notes');
                drop.onChange(async (value) => {
                    this.plugin.settings.selectionMode = value as 'notes' | 'folder';
                    // Clear irrelevant selection when switching modes
                    if (value === 'folder') {
                        this.plugin.settings.selectedNotes = [];
                    } else {
                        this.plugin.settings.selectedFolder = '';
                    }
                    await this.plugin.saveSettings();
                    this.display();
                });
            });

        // Dynamic label and field based on selection mode
        const selectionLabel = this.plugin.settings.selectionMode === 'folder' ? 'Selected Folder' : 'Selected Notes';
        const selectionDesc = this.plugin.settings.selectionMode === 'folder'
            ? 'Choose a folder to recursively search for dream metrics (max 200 files)'
            : 'Notes to search for dream metrics (select one or more)';
        
        const selectionSetting = new Setting(containerEl)
            .setName(selectionLabel)
            .setDesc(selectionDesc);

        if (this.plugin.settings.selectionMode === 'folder') {
            // Folder autocomplete
            selectionSetting.addSearch(search => {
                search.setPlaceholder('Choose folder...');
                search.setValue(this.plugin.settings.selectedFolder || '');
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
                            
                            item.addEventListener('mousedown', async (e) => {
                                e.preventDefault();
                                search.setValue(folder);
                                this.plugin.settings.selectedFolder = folder;
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
                                    this.plugin.settings.selectedFolder = folder;
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
            import('./autocomplete').then(({ createSelectedNotesAutocomplete }) => {
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
            });
            // Fix: append the search field to the setting's control element
            selectionSetting.controlEl.appendChild(searchFieldContainer);
        }

        // Add section border after selection settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Metrics Settings Section
        containerEl.createEl('h2', { text: 'Metrics Settings' });

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

        // Add Metrics List
        const metricsContainer = containerEl.createEl('div', { cls: 'oom-metrics-container' });
        
        // Add button to add new metric
        const addMetricButton = metricsContainer.createEl('button', {
            text: 'Add Metric',
            cls: 'mod-cta'
        });
        addMetricButton.addEventListener('click', () => {
            new MetricEditorModal(
                this.app,
                {
                    name: '',
                    icon: '',
                    range: { min: 0, max: 10 },
                    description: '',
                    enabled: true,
                    type: 'number',
                    category: 'dream',
                    format: 'number',
                    options: [],
                    min: 0,
                    max: 10,
                    step: 1
                },
                Object.values(this.plugin.settings.metrics),
                async (metric) => {
                    this.plugin.settings.metrics[metric.name] = metric;
                    await this.plugin.saveSettings();
                    this.display();
                }
            ).open();
        });

        // Group metrics by enabled state
        const enabledMetrics = Object.entries(this.plugin.settings.metrics).filter(([_, metric]) => metric.enabled);
        const disabledMetrics = Object.entries(this.plugin.settings.metrics).filter(([_, metric]) => !metric.enabled);

        // Display enabled metrics
        if (enabledMetrics.length > 0) {
            metricsContainer.createEl('h2', { text: 'Enabled Metrics' });
            enabledMetrics.forEach(([key, metric]) => {
                const metricSetting = new Setting(metricsContainer)
                    .setName(metric.name)
                    .setDesc(metric.description)
                    .addToggle(toggle => {
                        toggle.setValue(metric.enabled)
                            .onChange(async (value) => {
                                metric.enabled = value;
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
                    .setDesc(metric.description)
                    .addToggle(toggle => {
                        toggle.setValue(metric.enabled)
                            .onChange(async (value) => {
                                metric.enabled = value;
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

        // Add section border after metrics settings
        containerEl.createEl('div', { cls: 'oom-section-border' });

        // Add Backup Settings Section
        containerEl.createEl('h2', { text: 'Backup Settings' });

        // Enable Backups
        new Setting(containerEl)
            .setName('Enable Backups')
            .setDesc('Create backups of the project note before making changes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.backupEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.backupEnabled = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide backup folder setting
                }));

        // Backup Folder Path (only shown when backups are enabled)
        if (this.plugin.settings.backupEnabled) {
            const backupFolderSetting = new Setting(containerEl)
                .setName('Backup Folder')
                .setDesc('Select an existing folder where backups will be stored')
                .addSearch(search => {
                    search
                        .setPlaceholder('Choose backup folder...')
                        .setValue(this.plugin.settings.backupFolderPath);

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
                .setValue(String(this.plugin.settings.logging.maxLogSize / (1024 * 1024)))
                .onChange(async (value) => {
                    const size = parseInt(value) * 1024 * 1024;
                    if (!isNaN(size) && size > 0) {
                        this.plugin.settings.logging.maxLogSize = size;
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
                            this.plugin.settings.logging.maxLogSize,
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