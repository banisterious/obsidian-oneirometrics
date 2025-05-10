import { App, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, Notice, TFile, TFolder, ExtraButtonComponent } from "obsidian";
import { DEFAULT_METRICS, DreamMetric, DreamMetricsSettings } from "./types";
import DreamMetricsPlugin from "./main";
import { Eye, Heart, CircleMinus, PenTool, CheckCircle, UsersRound } from 'lucide-static';

const lucideIconMap: Record<string, string> = {
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

        // Create metric line with a sample value
        const sampleValue = Math.floor((this.metric.range.min + this.metric.range.max) / 2);
        previewEl.createEl('div', { text: `> ${this.metric.name}: ${sampleValue}` });

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

        containerEl.createEl('h2', { text: 'Dream Metrics Settings' });

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
                                suggestionContainer.classList.add('visible');
                                suggestionContainer.classList.remove('visible');
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

                // (Removed search.onChange; input event is more reliable for real-time suggestions)

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

                search.inputEl.addEventListener('input', (e) => {
                    console.log('[Backup Folder] input event:', search.inputEl.value);
                    showSuggestions(search.inputEl.value);
                });

                // Update suggestions on resize
                window.addEventListener('resize', () => {
                    if (suggestionContainer.classList.contains('visible')) {
                        positionSuggestionContainer();
                    }
                });
            });

        // Project Note Path Setting
        new Setting(containerEl)
            .setName('Project Note Path')
            .setDesc('The path where metrics tables will be written')
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

        // Selected Notes Setting
        new Setting(containerEl)
            .setName('Selected Notes')
            .setDesc('Notes to search for dream metrics (select one or more)')
            .addExtraButton(button => {
                // No-op, just for layout
            });

        // Use shared autocomplete utility
        const selectedNotesContainer = containerEl.createEl('div', { cls: 'oom-multiselect-container' });
        import('./autocomplete').then(({ createSelectedNotesAutocomplete }) => {
            createSelectedNotesAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: selectedNotesContainer,
                selectedNotes: this.plugin.settings.selectedNotes,
                onChange: (selected) => {
                    this.plugin.settings.selectedNotes = selected;
                    this.plugin.saveSettings();
                }
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
            if (metric.icon && lucideIconMap[metric.icon]) {
                const iconSVG = lucideIconMap[metric.icon];
                const iconEl = document.createElement('span');
                iconEl.className = 'oom-metric-icon-svg oom-metric-icon--start';
                iconEl.innerHTML = iconSVG;
                metricSetting.nameEl.insertBefore(iconEl, metricSetting.nameEl.firstChild);
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