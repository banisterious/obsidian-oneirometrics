import { App, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, Notice, TFile, TFolder, ExtraButtonComponent, MarkdownRenderer } from "obsidian";
import { DEFAULT_METRICS, DreamMetric, DreamMetricsSettings } from "./types";
import DreamMetricsPlugin from "./main";
import { Eye, Heart, CircleMinus, PenTool, CheckCircle, UsersRound } from 'lucide-static';

export const lucideIconMap: Record<string, string> = {
  eye: Eye,
  heart: Heart,
  'circle-minus': CircleMinus,
  'pen-tool': PenTool,
  'check-circle': CheckCircle,
  'users-round': UsersRound,
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

        contentEl.createEl('h2', { text: this.isEditing ? 'Edit Metric' : 'Add New Metric' });

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
        iconPickerContainer.createEl('div', { text: 'Icon (optional):', cls: 'oom-icon-picker-label' });
        const iconGrid = iconPickerContainer.createEl('div', { cls: 'oom-icon-picker-grid' });
        Object.entries(lucideIconMap).forEach(([iconName, iconSVG]) => {
            const iconBtn = iconGrid.createEl('button', {
                cls: 'oom-icon-picker-btn',
                attr: { type: 'button', 'aria-label': iconName }
            });
            iconBtn.innerHTML = iconSVG;
            if (this.metric.icon === iconName) iconBtn.classList.add('selected');
            iconBtn.onclick = () => {
                this.metric.icon = iconName;
                Array.from(iconGrid.children).forEach(btn => btn.classList.remove('selected'));
                iconBtn.classList.add('selected');
                this.updatePreview();
            };
        });
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
    plugin: DreamMetricsPlugin;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

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

        // Backup Settings
        containerEl.createEl('h3', { text: 'Backup Settings' });

        // Enable Backups
        new Setting(containerEl)
            .setName('Enable Backups')
            .setDesc('Create backups of the project note before making changes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.backupEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.backupEnabled = value;
                    await this.plugin.saveSettings();
                }));

        // Backup Folder Path
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

        // OneiroMetrics Note Path Setting
        new Setting(containerEl)
            .setName('OneiroMetrics Note Path')
            .setDesc('The path where OneiroMetrics tables will be written')
            .addText(text => {
                text.setPlaceholder('Journals/Dream Diary/Metrics/Metrics.md')
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
                    cls: 'suggestion-container oom-suggestion-container'
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

                    suggestionContainer.classList.add('oom-suggestion-container');
                    suggestionContainer.style.removeProperty('position');
                    suggestionContainer.style.removeProperty('left');
                    suggestionContainer.style.removeProperty('top');
                    suggestionContainer.style.removeProperty('width');
                    suggestionContainer.style.removeProperty('overflowX');
                    suggestionContainer.style.removeProperty('maxWidth');
                    suggestionContainer.style.removeProperty('right');

                    if (left + dropdownWidth > modalRect.width) {
                        suggestionContainer.style.left = 'auto';
                        suggestionContainer.style.right = '0';
                    }

                    suggestionContainer.style.setProperty('--oom-suggestion-left', `${left}px`);
                    suggestionContainer.style.setProperty('--oom-suggestion-top', `${top}px`);
                    suggestionContainer.style.setProperty('--oom-suggestion-width', `${dropdownWidth}px`);
                }

                // Normalize function (lowercase, collapse whitespace)
                function normalize(str: string): string {
                    return str.toLowerCase().replace(/\s+/g, '');
                }

                // Hide suggestion container
                function hideSuggestions() {
                    suggestionContainer.classList.remove('visible');
                    suggestionContainer.empty();
                }

                // Generate year-based path suggestions
                function generateYearPaths(year: string): string[] {
                    const basePaths = [
                        'Journals',
                        'Dreams',
                        'Journal',
                        'Dream Diary'
                    ];
                    
                    return basePaths.flatMap(base => [
                        `${base}/${year}/${year}.md`,
                        `${base}/${year}/`,
                        `${base}/${year}/Entries/`,
                        `${base}/${year}/Dreams/`
                    ]);
                }

                // Filter function for file suggestions
                function filterFiles(files: TFile[], searchValue: string): string[] {
                    const normalizedSearch = normalize(searchValue);
                    const yearMatch = searchValue.match(/^(20\d{2})$/);
                    let suggestions: string[] = [];

                    // Add year-based suggestions if applicable
                    if (yearMatch) {
                        suggestions.push(...generateYearPaths(yearMatch[1]));
                    }

                    // Add matching files, excluding backups and backup files
                    const matchingFiles = files
                        .filter(file => {
                            // Exclude backup files and directories
                            if (file.path.includes('.backup-') || 
                                file.path.includes('/Backups/') ||
                                file.basename.endsWith('.backup')) {
                                return false;
                            }

                            const normalizedPath = normalize(file.path);
                            // Match by normalized path or year
                            return normalizedPath.includes(normalizedSearch) || 
                                   (yearMatch && file.path.includes(yearMatch[1]));
                        })
                        .map(file => file.path);

                    suggestions.push(...matchingFiles);

                    // Remove duplicates and sort
                    suggestions = [...new Set(suggestions)]
                        .sort((a, b) => {
                            // Prioritize exact matches
                            const aExact = a.toLowerCase() === searchValue.toLowerCase();
                            const bExact = b.toLowerCase() === searchValue.toLowerCase();
                            if (aExact && !bExact) return -1;
                            if (!aExact && bExact) return 1;
                            
                            // Then prioritize year-based paths
                            const aYear = a.includes(`/${searchValue}/`);
                            const bYear = b.includes(`/${searchValue}/`);
                            if (aYear && !bYear) return -1;
                            if (!aYear && bYear) return 1;
                            
                            // Finally sort alphabetically
                            return a.localeCompare(b);
                        })
                        .slice(0, 7);

                    return suggestions;
                }

                // Update suggestions
                async function updateSuggestions() {
                    const value = inputEl.value.trim();
                    if (!value) {
                        hideSuggestions();
                        return;
                    }

                    const files = this.app.vault.getMarkdownFiles();
                    const suggestions = filterFiles(files, value);

                    if (suggestions.length > 0) {
                        suggestionContainer.empty();
                        suggestions.forEach(suggestion => {
                            const item = suggestionContainer.createEl('div', {
                                cls: 'suggestion-item',
                                attr: { title: suggestion }
                            });

                            // Highlight matching text
                            const regex = new RegExp(`(${value})`, 'gi');
                            item.innerHTML = suggestion.replace(regex, '<strong>$1</strong>');

                            // Add hover effects
                            item.classList.add('selected');
                            item.classList.remove('selected');

                            // Handle selection
                            item.addEventListener('click', async () => {
                                inputEl.value = suggestion;
                                this.plugin.settings.projectNotePath = suggestion;
                                await this.plugin.saveSettings();
                                hideSuggestions();
                            });
                        });

                        suggestionContainer.classList.add('visible');
                        suggestionContainer.style.display = 'block';
                        positionSuggestionContainer();
                    } else {
                        hideSuggestions();
                    }
                }

                // Event listeners
                inputEl.addEventListener('input', updateSuggestions.bind(this));
                inputEl.addEventListener('blur', () => {
                    // Delay hiding to allow click events to process
                    setTimeout(hideSuggestions, 200);
                });

                // Handle keyboard navigation
                inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
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
                                const path = selectedItem.textContent;
                                if (path) {
                                    inputEl.value = path;
                                    this.plugin.settings.projectNotePath = path;
                                    this.plugin.saveSettings();
                                    hideSuggestions();
                                }
                            }
                            break;

                        case 'Escape':
                            hideSuggestions();
                            break;
                    }
                });

                // Hide suggestions when clicking outside
                document.addEventListener('click', (e: MouseEvent) => {
                    if (!inputEl.contains(e.target as Node) && 
                        !suggestionContainer.contains(e.target as Node)) {
                        hideSuggestions();
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

        // --- Flexible Note/Folder Selection ---
        new Setting(containerEl)
            .setName('Selection Mode')
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

        // Dynamic label and field
        let selectionLabel = this.plugin.settings.selectionMode === 'folder' ? 'Selected Folder' : 'Selected Notes';
        let selectionDesc = this.plugin.settings.selectionMode === 'folder'
            ? 'Choose a folder to recursively search for dream metrics (max 200 files)'
            : 'Notes to search for dream metrics (select one or more)';
        let selectionSetting = new Setting(containerEl)
            .setName(selectionLabel)
            .setDesc(selectionDesc);

        if ((this.plugin.settings.selectionMode || 'notes') === 'folder') {
            // Folder autocomplete (styled like Backup Folder)
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
                this.plugin.register(() => suggestionContainer.remove());
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
                const showSuggestions = (query: string) => {
                    const folders = getFolders();
                    const normalizedQuery = query.toLowerCase();
                    const filteredFolders = folders
                        .filter(folder => folder.toLowerCase().includes(normalizedQuery))
                        .slice(0, 10);
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
                                this.display();
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
                search.inputEl.addEventListener('input', (e) => {
                    showSuggestions(search.inputEl.value);
                });
                search.inputEl.addEventListener('focus', (e) => {
                    showSuggestions(search.inputEl.value);
                });
                search.inputEl.addEventListener('blur', () => {
                    setTimeout(() => {
                        suggestionContainer.classList.remove('visible');
                        suggestionContainer.style.display = 'none';
                    }, 200);
                });
            });
            // Preview Files Button
            selectionSetting.addButton(btn => {
                btn.setButtonText('Preview Files');
                btn.setCta();
                btn.setDisabled(!this.plugin.settings.selectedFolder);
                btn.onClick(() => {
                    const folderPath = this.plugin.settings.selectedFolder;
                    if (!folderPath) {
                        new Notice('Please select a folder first.');
                        return;
                    }
                    const folder = this.app.vault.getAbstractFileByPath(folderPath);
                    if (!folder || !(folder instanceof TFolder)) {
                        new Notice('Selected folder not found.');
                        return;
                    }
                    // Gather up to 200 markdown files recursively
                    const files: string[] = [];
                    const gatherFiles = (folder: TFolder, acc: string[]) => {
                        for (const child of folder.children) {
                            if (child instanceof TFile && child.extension === 'md') {
                                acc.push(child.path);
                                if (acc.length >= 200) break;
                            } else if (child instanceof TFolder) {
                                gatherFiles(child, acc);
                                if (acc.length >= 200) break;
                            }
                        }
                    };
                    gatherFiles(folder, files);
                    // Count total markdown files (for warning)
                    let totalCount = 0;
                    const countFiles = (folder: TFolder) => {
                        for (const child of folder.children) {
                            if (child instanceof TFile && child.extension === 'md') {
                                totalCount++;
                            } else if (child instanceof TFolder) {
                                countFiles(child);
                            }
                        }
                    };
                    countFiles(folder);
                    if (files.length === 0) {
                        new Notice('No markdown files found in the selected folder.');
                        return;
                    }
                    // Get any previously excluded files for this folder
                    const pluginAny = this.plugin as any;
                    const excludedFiles: Set<string> = new Set(Array.isArray(pluginAny._excludedFilesForNextScrape) ? pluginAny._excludedFilesForNextScrape : []);
                    // Modal UI
                    const modal = new Modal(this.app);
                    modal.titleEl.setText('Preview Files to be Scraped');
                    const content = modal.contentEl.createEl('div');
                    content.style.maxHeight = '400px';
                    content.style.overflowY = 'auto';
                    content.style.fontSize = '0.98em';
                    content.style.padding = '0.5em 0';

                    // Filter and sort controls
                    const controls = modal.contentEl.createEl('div');
                    controls.style.display = 'flex';
                    controls.style.gap = '0.7em';
                    controls.style.alignItems = 'center';
                    controls.style.marginBottom = '0.7em';

                    const filterInput = controls.createEl('input', { type: 'text', placeholder: 'Filter files...' });
                    filterInput.style.flex = '2 1 0';
                    filterInput.style.fontSize = '1em';
                    filterInput.style.padding = '2px 6px';

                    const sortSelect = controls.createEl('select');
                    [
                        { label: 'Name (A-Z)', value: 'name-asc' },
                        { label: 'Name (Z-A)', value: 'name-desc' },
                        { label: 'Path (A-Z)', value: 'path-asc' },
                        { label: 'Path (Z-A)', value: 'path-desc' }
                    ].forEach(opt => {
                        const option = sortSelect.createEl('option', { text: opt.label });
                        option.value = opt.value;
                    });
                    sortSelect.value = 'name-asc';
                    sortSelect.style.fontSize = '1em';
                    sortSelect.style.padding = '2px 6px';

                    // File list state
                    let fileList: { path: string; name: string; checked: boolean }[] = files.map(path => ({
                        path,
                        name: path.split('/').pop() || path,
                        checked: !excludedFiles.has(path)
                    }));

                    // File list UI
                    const listContainer = content.createEl('div');
                    listContainer.style.margin = '0';
                    listContainer.style.paddingLeft = '0';

                    // Render function
                    function renderList() {
                        console.log('[DEBUG] renderList called in Preview Files modal');
                        listContainer.empty();
                        // Filter
                        const filter = filterInput.value.trim().toLowerCase();
                        let filtered = fileList.filter(f =>
                            f.path.toLowerCase().includes(filter) || f.name.toLowerCase().includes(filter)
                        );
                        // Sort
                        const sort = sortSelect.value;
                        filtered = filtered.slice();
                        if (sort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
                        if (sort === 'name-desc') filtered.sort((a, b) => b.name.localeCompare(a.name));
                        if (sort === 'path-asc') filtered.sort((a, b) => a.path.localeCompare(b.path));
                        if (sort === 'path-desc') filtered.sort((a, b) => b.path.localeCompare(a.path));
                        // List
                        if (filtered.length === 0) {
                            listContainer.createEl('div', { text: 'No files match your filter.' });
                        } else {
                            const ul = listContainer.createEl('ul');
                            ul.style.margin = '0';
                            ul.style.paddingLeft = '1.2em';
                            filtered.forEach((file, idx) => {
                                const li = ul.createEl('li');
                                li.style.wordBreak = 'break-all';
                                const checkbox = li.createEl('input', { type: 'checkbox' });
                                checkbox.checked = file.checked;
                                checkbox.style.marginRight = '0.5em';
                                checkbox.addEventListener('change', () => {
                                    file.checked = checkbox.checked;
                                });
                                li.appendChild(document.createTextNode(file.path));
                            });
                        }
                    }
                    renderList();
                    filterInput.addEventListener('input', renderList);
                    sortSelect.addEventListener('change', renderList);

                    // Info/warning
                    if (totalCount > 200) {
                        const warn = content.createEl('div', {
                            text: `Warning: This folder contains ${totalCount} markdown files. Only the first 200 will be processed for performance reasons.`
                        });
                        warn.style.color = 'var(--color-warning, #d97706)';
                        warn.style.marginTop = '1em';
                        warn.style.fontWeight = '500';
                    } else {
                        const info = content.createEl('div', {
                            text: `Total markdown files: ${totalCount}`
                        });
                        info.style.color = 'var(--color-info, #2563eb)';
                        info.style.marginTop = '1em';
                    }

                    // Apply/Cancel buttons
                    const btnRow = modal.contentEl.createEl('div');
                    btnRow.style.display = 'flex';
                    btnRow.style.justifyContent = 'flex-end';
                    btnRow.style.gap = '1em';
                    btnRow.style.marginTop = '1.2em';
                    const cancelBtn = btnRow.createEl('button', { text: 'Cancel' });
                    cancelBtn.addClass('oom-modal-btn');
                    cancelBtn.onclick = () => {
                        new Notice('[DEBUG] Cancel clicked in Preview Files modal');
                        console.log('[DEBUG] Cancel clicked in Preview Files modal');
                        modal.close();
                    };
                    const applyBtn = btnRow.createEl('button', { text: 'Apply' });
                    applyBtn.addClass('oom-modal-btn');
                    applyBtn.addClass('oom-modal-btn--apply');
                    applyBtn.onclick = () => {
                        new Notice('[DEBUG] Apply clicked in Preview Files modal');
                        console.log('[DEBUG] Apply clicked in Preview Files modal');
                        // Save excluded files for next scrape
                        const excluded = fileList.filter(f => !f.checked).map(f => f.path);
                        pluginAny._excludedFilesForNextScrape = excluded;
                        const includedCount = fileList.length - excluded.length;
                        new Notice(`Will include ${includedCount} file${includedCount === 1 ? '' : 's'} in next scrape.`);
                        modal.close();
                    };
                    // Focus filter input on open
                    setTimeout(() => filterInput.focus(), 100);
                    // Debug: before opening modal
                    new Notice('[DEBUG] About to call modal.open() in Preview Files');
                    console.log('[DEBUG] About to call modal.open() in Preview Files');
                    modal.open();
                    // Debug: after opening modal
                    new Notice('[DEBUG] modal.open() called in Preview Files');
                    console.log('[DEBUG] modal.open() called in Preview Files');
                });
            });
            // Helper/warning for file cap
            if (this.plugin.settings.selectedFolder) {
                const folder = this.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
                let fileCount = 0;
                if (folder && folder instanceof TFolder) {
                    fileCount = folder.children.filter(f => f instanceof TFile && f.extension === 'md').length;
                }
                if (fileCount > 200) {
                    selectionSetting.descEl.createEl('div', {
                        text: `Warning: This folder contains ${fileCount} markdown files. Only the first 200 will be processed for performance reasons.`,
                        cls: 'oom-warning',
                        attr: { style: 'color: var(--color-warning, #d97706); margin-top: 0.5em;' }
                    });
                } else if (fileCount > 0) {
                    selectionSetting.descEl.createEl('div', {
                        text: `This folder contains ${fileCount} markdown files.`,
                        cls: 'oom-info',
                        attr: { style: 'color: var(--color-info, #2563eb); margin-top: 0.5em;' }
                    });
                }
            }
        } else {
            // Multi-chip note autocomplete (existing)
            selectionSetting.addExtraButton(button => { }); // No-op for layout
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
        }

        // Week Start Day Setting
        new Setting(containerEl)
            .setName('Week Start Day')
            .setDesc('Choose the first day of the week for "This Week" filtering (affects metrics table)')
            .addDropdown(drop => {
                drop.addOption('0', 'Sunday');
                drop.addOption('1', 'Monday');
                drop.setValue(String(this.plugin.settings.weekStartDay ?? 0));
                drop.onChange(async (value) => {
                    this.plugin.settings.weekStartDay = parseInt(value);
                    await this.plugin.saveSettings();
                });
            });

        // Metrics Section
        containerEl.createEl('h3', { text: 'Metrics Configuration' });

        // Display existing metrics
        this.plugin.settings.metrics.forEach((metric, index) => {
            const metricSetting = new Setting(containerEl)
                .setName(metric.icon && lucideIconMap[metric.icon] ? `${metric.name} ` : metric.name)
                .setDesc(`${metric.description} (${['Lost Segments', 'Familiar People'].includes(metric.name) ? 'Any whole number' : `Range: ${metric.range.min}-${metric.range.max}`})`)
                .setClass('oom-metric-setting');
            // Render icon if present and valid, else show nothing (or a placeholder if desired)
            if (metric.icon && lucideIconMap[metric.icon]) {
                const iconSVG = lucideIconMap[metric.icon];
                const iconEl = document.createElement('span');
                iconEl.className = 'oom-metric-icon-svg oom-metric-icon--start';
                iconEl.innerHTML = iconSVG;
                metricSetting.nameEl.insertBefore(iconEl, metricSetting.nameEl.firstChild);
            } else if (metric.icon) {
                // Optionally, show a placeholder or warning if icon is missing from map
                // const placeholder = document.createElement('span');
                // placeholder.className = 'oom-metric-icon-svg oom-metric-icon--start';
                // placeholder.textContent = '?';
                // metricSetting.nameEl.insertBefore(placeholder, metricSetting.nameEl.firstChild);
            }

            // Add drag handle
            metricSetting.addExtraButton((button: ExtraButtonComponent) => {
                const handle = button
                    .setIcon('grip-vertical')
                    .setTooltip('Drag to reorder')
                    .extraSettingsEl;

                handle.addClass('oom-drag-handle');
                handle.setAttribute('draggable', 'true');
                handle.setAttribute('tabindex', '0');
                handle.setAttribute('aria-label', 'Reorder metric');
                handle.setAttribute('aria-grabbed', 'false');
                handle.addEventListener('focus', () => handle.classList.add('is-focused'));
                handle.addEventListener('blur', () => handle.classList.remove('is-focused'));
                handle.addEventListener('keydown', async (e: KeyboardEvent) => {
                    if (e.key === 'ArrowUp' && index > 0) {
                        e.preventDefault();
                        const metrics = this.plugin.settings.metrics;
                        [metrics[index], metrics[index - 1]] = [metrics[index - 1], metrics[index]];
                        await this.plugin.saveSettings();
                        this.display();
                        announce('Metric moved up');
                    } else if (e.key === 'ArrowDown' && index < this.plugin.settings.metrics.length - 1) {
                        e.preventDefault();
                        const metrics = this.plugin.settings.metrics;
                        [metrics[index], metrics[index + 1]] = [metrics[index + 1], metrics[index]];
                        await this.plugin.saveSettings();
                        this.display();
                        announce('Metric moved down');
                    }
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
                metricSetting.addExtraButton((button: ExtraButtonComponent) => button
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
                metricSetting.addExtraButton((button: ExtraButtonComponent) => button
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
                .addExtraButton((button: ExtraButtonComponent) => button
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
                .addExtraButton((button: ExtraButtonComponent) => button
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

        // Metrics Export/Import Section
        new Setting(containerEl)
            .setName('Export Metrics')
            .setDesc('Export your current metrics configuration as a JSON file')
            .addButton(button => button
                .setButtonText('Export')
                .onClick(() => {
                    const data = JSON.stringify(this.plugin.settings.metrics, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'oneirometrics-metrics.json';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                })
            );
        new Setting(containerEl)
            .setName('Import Metrics')
            .setDesc('Import a metrics configuration from a JSON file (replaces current metrics)')
            .addButton(button => button
                .setButtonText('Import')
                .onClick(() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json,application/json';
                    input.onchange = async (e: any) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const text = await file.text();
                        try {
                            const metrics = JSON.parse(text);
                            if (Array.isArray(metrics) && metrics.every(m => m.name && m.range && m.description)) {
                                this.plugin.settings.metrics = metrics;
                                await this.plugin.saveSettings();
                                this.display();
                                new Notice('Metrics imported successfully!');
                            } else {
                                new Notice('Invalid metrics file format.');
                            }
                        } catch (err) {
                            new Notice('Failed to import metrics: ' + err);
                        }
                    };
                    input.click();
                })
            );

        // CSV Export Section
        new Setting(containerEl)
            .setName('Export Metrics Data (CSV)')
            .setDesc('Export your current metrics data (summary and detailed dream entries) as a CSV file')
            .addButton(button => button
                .setButtonText('Export CSV')
                .onClick(async () => {
                    // Gather data from plugin (simulate for now)
                    const summaryRows = [
                        ['Metric', 'Average', 'Min', 'Max', 'Count'],
                        ...this.plugin.settings.metrics.map(m => [
                            m.name,
                            '', // Placeholder for average
                            '', // Placeholder for min
                            '', // Placeholder for max
                            ''  // Placeholder for count
                        ])
                    ];
                    // Simulate detailed entries (empty for now)
                    const detailedRows = [
                        ['Date', 'Title', 'Words', ...this.plugin.settings.metrics.map(m => m.name)],
                        // Add rows here if available
                    ];
                    // Convert to CSV
                    function toCSV(rows: string[][]) {
                        return rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
                    }
                    const csvContent = toCSV(summaryRows) + '\n\n' + toCSV(detailedRows);
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'oneirometrics-export.csv';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                })
            );

        // OneiroMetrics Callout Customizations Section
        const calloutSection = containerEl.createEl('div', { cls: 'oom-callout-customizations' });
        calloutSection.style.border = '1px solid #ccc';
        calloutSection.style.borderRadius = '8px';
        calloutSection.style.padding = '18px 18px 12px 18px';
        calloutSection.style.marginBottom = '2em';
        calloutSection.style.background = 'var(--background-secondary, #f8f9fa)';
        calloutSection.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
        calloutSection.style.marginTop = '2em';

        // Section heading and Copy button
        const headingRow = calloutSection.createEl('div');
        headingRow.style.display = 'flex';
        headingRow.style.alignItems = 'center';
        headingRow.style.justifyContent = 'space-between';
        headingRow.style.marginBottom = '0.3em';
        headingRow.createEl('div', { text: 'OneiroMetrics Callout Customizations', cls: 'oom-callout-customizations-heading' });
        const copyBtn = headingRow.createEl('button', { text: 'Copy', cls: 'oom-copy-btn' });
        copyBtn.style.marginLeft = '1em';
        copyBtn.style.fontSize = '0.95em';
        copyBtn.style.padding = '2px 10px';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.border = '1px solid #bbb';
        copyBtn.style.background = '#f5f5f5';
        copyBtn.style.cursor = 'pointer';

        // State for the callout structure
        let calloutMetadata = this.plugin.settings.defaultCalloutMetadata || '';
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
        const calloutBox = calloutSection.createEl('div', {
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

        copyBtn.onclick = () => {
            navigator.clipboard.writeText(calloutBox.textContent || '');
            new Notice('Copied!');
        };

        // Single-Line Toggle
        new Setting(calloutSection)
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
        new Setting(calloutSection)
            .setName('Callout Metadata')
            .setDesc('Comma-separated list of metadata to add to new [!dream-metrics] callouts (e.g., "compact,summary")')
            .addText(text => {
                text.setPlaceholder('compact,summary')
                    .setValue(calloutMetadata)
                    .onChange(async (value) => {
                        calloutMetadata = value;
                        this.plugin.settings.defaultCalloutMetadata = value;
                        calloutBox.textContent = buildCallout();
                        await this.plugin.saveSettings();
                    });
            });

        // Metrics Description Section
        const metricsDescH3 = containerEl.createEl('h3', { text: 'Metrics Descriptions' });
        metricsDescH3.style.marginTop = '2.5em';
        const descSection = containerEl.createEl('div', { cls: 'oom-metrics-description-section' });
        // Add custom CSS for table borders and metric icons
        const style = document.createElement('style');
        style.textContent = `
            .oom-metrics-description-section table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 1em;
            }
            .oom-metrics-description-section th, .oom-metrics-description-section td {
                border: 1px solid #ddd;
                padding: 6px 10px;
            }
            .oom-metrics-description-section th {
                background: #f3f3f3;
            }
            .oom-metric-desc-heading {
                display: flex;
                align-items: center;
                gap: 0.6em;
                font-size: 1.08em;
                margin-top: 1.7em;
                margin-bottom: 0.2em;
            }
            .oom-metric-desc-icon {
                width: 20px;
                height: 20px;
                display: inline-block;
                vertical-align: middle;
            }
        `;
        descSection.appendChild(style);
        // Render Metrics Descriptions with icons
        const metricDescriptions = [
            {
                name: 'Sensory Detail',
                icon: 'eye',
                heading: 'Sensory Detail (Score 1-5)',
                markdown: `This metric aims to capture the richness and vividness of the sensory information you recall from your dream.

| Score        | Description |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Minimal)  | You recall very little sensory information. The dream feels vague and lacks specific sights, sounds, textures, smells, or tastes. You might remember the general feeling of a place but not any distinct visual elements, for example. |
| 2 (Limited)  | You recall a few basic sensory details, perhaps a dominant color or a general sound. The sensory landscape is still quite sparse. |
| 3 (Moderate) | You recall a noticeable amount of sensory information. You might remember some visual details, perhaps a few distinct sounds, or a general feeling of touch. |
| 4 (Rich)     | You recall a significant amount of sensory information across multiple senses. You can describe specific visual elements, distinct sounds, perhaps a smell or a texture. The dream feels more immersive. |
| 5 (Vivid)    | Your recall is highly detailed and encompasses a wide range of sensory experiences. You can clearly describe intricate visual scenes, distinct and multiple sounds, and perhaps even specific tastes and smells. The dream feels very real and alive in your memory. |`
            },
            {
                name: 'Emotional Recall',
                icon: 'heart',
                heading: 'Emotional Recall (Score 1-5)',
                markdown: `This metric focuses on your ability to remember and articulate the emotions you experienced within the dream.

| Score                | Description |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Vague)            | You have a faint sense that you felt some emotion in the dream, but you can't identify it specifically. You might just say you felt "something." |
| 2 (General)          | You can identify a primary emotion (e.g., happy, sad, scared) but can't describe its intensity or nuances. |
| 3 (Identified)       | You can identify one or two specific emotions you felt and perhaps describe their general intensity. |
| 4 (Nuanced)          | You recall several distinct emotions and can describe some of the nuances or shifts in your feelings throughout the dream. |
| 5 (Deep and Complex) | You have a strong recollection of the emotional landscape of the dream, including multiple emotions, their intensity, how they evolved, and perhaps even subtle emotional undertones. |`
            },
            {
                name: 'Lost Segments',
                icon: 'circle-minus',
                heading: 'Lost Segments (Number)',
                markdown: `This metric tracks the number of distinct instances where you have a clear feeling or awareness that a part of the dream is missing or has been forgotten. This isn't about omitting fragments you never recalled in the first place. It's about those "gaps" in your recalled narrative where you feel like "there was something else there," or you have a fleeting image or feeling that then vanishes.

If you recall the dream as a complete, seamless narrative with no sense of missing parts, this score would be 0.

If you have a distinct feeling of one or more breaks or missing chunks in the dream's sequence, you would count each of those instances.`
            },
            {
                name: 'Descriptiveness',
                icon: 'pen-tool',
                heading: 'Descriptiveness (Score 1-5)',
                markdown: `This metric assesses the level of detail and elaboration in your written dream capture, beyond just sensory details (which have their own metric). This considers how thoroughly you describe the events, characters, interactions, and the overall narrative flow.

| Score                | Description |
| -------------------- | ----------- |
| 1 (Minimal)          | Your capture is very brief and outlines only the most basic elements of the dream. It lacks detail and elaboration. |
| 2 (Limited)          | Your capture provides a basic account of the dream but lacks significant descriptive detail in terms of actions, character behavior, or plot progression. |
| 3 (Moderate)         | Your capture provides a reasonably detailed account of the main events and characters, with some descriptive language used. |
| 4 (Detailed)         | Your capture includes a significant level of descriptive detail, bringing the dream narrative and its elements to life with more thorough explanations and imagery. |
| 5 (Highly Elaborate) | Your capture is very rich in detail, using vivid language to describe the events, characters, their motivations (if perceived), and the overall unfolding of the dream narrative. |`
            },
            {
                name: 'Confidence Score',
                icon: 'check-circle',
                heading: 'Confidence Score (Score 1-5)',
                markdown: `This is a subjective metric reflecting your overall sense of how complete and accurate your dream recall feels immediately after waking. It's your gut feeling about how much of the dream you've managed to retrieve.

| Score         | Description |
| ------------- | ----------- |
| 1 (Very Low)  | You feel like you've barely scratched the surface of the dream, remembering only a tiny fragment or a fleeting feeling. You suspect you've forgotten a significant portion. |
| 2 (Low)       | You recall a bit more, but you still feel like a substantial part of the dream is lost. The recall feels fragmented and incomplete. |
| 3 (Moderate)  | You feel like you've recalled a fair amount of the dream, perhaps the main storyline, but there might be some fuzzy areas or details you're unsure about. |
| 4 (High)      | You feel like you've recalled the majority of the dream with a good level of detail and coherence. You feel relatively confident in the accuracy of your memory. |
| 5 (Very High) | You feel like you've recalled the entire dream in vivid detail and with strong confidence in the accuracy and completeness of your memory. You don't have a sense of significant missing parts. |`
            }
        ];
        for (const desc of metricDescriptions) {
            const headingRow = descSection.createEl('div', { cls: 'oom-metric-desc-heading' });
            const iconSVG = lucideIconMap[desc.icon];
            const iconSpan = document.createElement('span');
            iconSpan.className = 'oom-metric-desc-icon';
            iconSpan.innerHTML = iconSVG;
            headingRow.appendChild(iconSpan);
            headingRow.appendChild(document.createTextNode(desc.heading));
            const descDiv = descSection.createEl('div');
            MarkdownRenderer.renderMarkdown(desc.markdown, descDiv, this.plugin.app.vault.getAbstractFileByPath('') as any, this.plugin);
        }

        // Add a visually hidden live region for announcements at the top of display()
        let liveRegion = containerEl.querySelector('.oom-live-region') as HTMLElement;
        if (!liveRegion) {
            liveRegion = containerEl.createEl('div', { cls: 'oom-live-region' });
            liveRegion.setAttr('aria-live', 'polite');
            liveRegion.setAttr('role', 'status');
            liveRegion.style.position = 'absolute';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            liveRegion.style.clip = 'rect(0 0 0 0)';
            liveRegion.style.whiteSpace = 'nowrap';
            liveRegion.style.border = '0';
        }
        function announce(msg: string) {
            liveRegion.textContent = msg;
        }

        containerEl.scrollTop = prevScroll;
        if (focusSelector) {
            const toFocus = containerEl.querySelector(focusSelector) as HTMLElement;
            if (toFocus) toFocus.focus();
        }
    }
} 