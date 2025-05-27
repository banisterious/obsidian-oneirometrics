/**
 * Backup of the OneiroMetricsModal class removed during refactoring.
 * This file is kept as a reference in case the functionality needs to be restored.
 * Date: June 2025
 */

import { App, Modal, Setting, TFile, TFolder, Notice } from 'obsidian';
import { getSelectionMode, getSelectedFolder, setSelectionMode, setSelectedFolder, getProjectNotePath } from '../../utils/settings-helpers';

// Note: These imports would need to be fixed if this file is ever restored
// Import DreamMetricsPlugin as a type only to prevent circular dependencies
import type { default as DreamMetricsPlugin } from '../../../main';

// Adding placeholder for missing imports
const attachClickEvent = (el: HTMLElement, fn: () => void) => el.addEventListener('click', fn);
const attachEvent = (el: HTMLElement, event: string, fn: (e: Event) => void) => el.addEventListener(event, fn);

/**
 * Legacy modal for selecting files/folders and initiating metrics scraping.
 * Functionality largely replaced by DreamJournalManager and direct scrapeMetrics calls.
 */
class OneiroMetricsModal extends Modal {
    private plugin: DreamMetricsPlugin;
    private selectionMode: 'notes' | 'folder';
    private selectedNotes: string[];
    private selectedFolder: string;
    private progressContent: HTMLElement;
    private statusText: HTMLElement;
    private progressBar: HTMLElement;
    private progressFill: HTMLElement;
    private detailsText: HTMLElement;
    private scrapeButton: HTMLButtonElement;
    private isScraping: boolean = false;
    private noteDismissed: boolean = false;
    public hasScraped: boolean = false;
    public openNoteButton: HTMLButtonElement;
    public static activeModal: OneiroMetricsModal | null = null;
    
    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
        
        // Get the selection mode from settings
        this.selectionMode = getSelectionMode(plugin.settings);
        this.selectedNotes = plugin.settings.selectedNotes || [];
        this.selectedFolder = getSelectedFolder(plugin.settings);
    }
    
    onOpen() {
        const {contentEl} = this;
        contentEl.empty();
        
        // Store the active instance for access from external functions
        OneiroMetricsModal.activeModal = this;
        
        // Add the container
        contentEl.createEl('h2', {text: 'Dream Metrics Processor'});
        
        // Create selection mode selector
        const selectionSettingsDiv = contentEl.createDiv({cls: 'selection-settings'});
        selectionSettingsDiv.createEl('h3', {text: 'Selection Mode'});
        
        const selectionModeDiv = selectionSettingsDiv.createDiv({cls: 'selection-mode'});
        
        // Create the notes mode option
        // Reset scrape state when modal is opened
        this.hasScraped = false;
        if (this.openNoteButton) {
            this.openNoteButton.disabled = true;
            this.openNoteButton.title = 'Run a scrape to enable this';
            this.openNoteButton.classList.remove('enabled');
        }
        // Set modal dimensions and classes first
        this.modalEl.style.width = '600px';
        this.modalEl.style.maxHeight = '80vh';
        this.modalEl.addClass('oom-modal');
        // Clear and set up content container
        contentEl.empty();
        contentEl.className = 'modal-content oom-modal'; // Only these classes, per spec

        // Create title
        contentEl.createEl('h2', { text: 'OneiroMetrics Dream Scrape', cls: 'oom-modal-title' });

        // Add dismissible note
        if (!this.noteDismissed) {
            const noteEl = contentEl.createEl('div', { cls: 'oom-modal-note' });
            noteEl.createEl('strong', { text: 'Note: ' });
            noteEl.createEl('span', { 
                text: 'This is where you kick off the "scraping" process, which searches your selected notes or folder and gathers up dream entries and metrics. Click the Scrape button to begin, or change your files/folder selection, below.'
            });
        }

        // --- Selection Mode Row ---
        const modeRow = contentEl.createEl('div', { cls: 'oom-modal-section oom-modal-row' });
        const modeLeft = modeRow.createEl('div', { cls: 'oom-modal-col-left' });
        modeLeft.createEl('label', { text: 'File or folder selection', cls: 'oom-modal-label' });
        modeLeft.createEl('div', { text: 'Choose whether to select individual notes or a folder for metrics scraping', cls: 'oom-modal-helper' });
        const modeRight = modeRow.createEl('div', { cls: 'oom-modal-col-right' });
        const modeDropdown = modeRight.createEl('select', { cls: 'oom-dropdown' });
        modeDropdown.createEl('option', { text: 'Notes', value: 'notes' });
        modeDropdown.createEl('option', { text: 'Folder', value: 'folder' });
        modeDropdown.value = this.selectionMode;

        // --- File/Folder Selector Row ---
        const selectorRow = contentEl.createEl('div', { cls: 'oom-modal-section oom-modal-row' });
        const selectorLeft = selectorRow.createEl('div', { cls: 'oom-modal-col-left' });
        if (this.selectionMode === 'folder') {
            selectorLeft.createEl('label', { text: 'Selected Folder', cls: 'oom-modal-label' });
            selectorLeft.createEl('div', { text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)', cls: 'oom-modal-helper' });
        } else {
            selectorLeft.createEl('label', { text: 'Selected Notes', cls: 'oom-modal-label' });
            selectorLeft.createEl('div', { text: 'Notes to search for dream metrics (select one or more)', cls: 'oom-modal-helper' });
        }
        const selectorRight = selectorRow.createEl('div', { cls: 'oom-modal-col-right' });
        if (this.selectionMode === 'folder') {
            // Restore folder autocomplete
            const folderAutocompleteContainer = selectorRight.createDiv('oom-folder-autocomplete-container');
            import('../../../autocomplete').then(({ createFolderAutocomplete }) => {
                createFolderAutocomplete({
                    app: this.app,
                    plugin: this,
                    containerEl: folderAutocompleteContainer,
                    selectedFolder: this.selectedFolder,
                    onChange: async (folder) => {
                        this.selectedFolder = folder;
                        setSelectedFolder(this.plugin.settings, folder);
                        await this.plugin.saveSettings();
                    }
                });
            });
        } else {
            // Restore notes autocomplete
            const notesAutocompleteContainer = selectorRight.createDiv('oom-notes-autocomplete-container');
            import('../../../autocomplete').then(({ createSelectedNotesAutocomplete }) => {
                createSelectedNotesAutocomplete({
                    app: this.app,
                    plugin: this,
                    containerEl: notesAutocompleteContainer,
                    selectedNotes: this.selectedNotes,
                    onChange: async (selected) => {
                        this.selectedNotes = selected;
                        this.plugin.settings.selectedNotes = selected;
                        await this.plugin.saveSettings();
                    }
                });
            });
        }

        // --- Scrape Button Row ---
        const scrapeRow = contentEl.createEl('div', { cls: 'oom-modal-section oom-modal-row' });
        const scrapeLeft = scrapeRow.createEl('div', { cls: 'oom-modal-col-left' });
        scrapeLeft.createEl('label', { text: 'Scrape Files or Folder', cls: 'oom-modal-label' });
        scrapeLeft.createEl('div', { text: 'Begin the scraping operation', cls: 'oom-modal-helper' });
        const scrapeRight = scrapeRow.createEl('div', { cls: 'oom-modal-col-right' });
        this.scrapeButton = scrapeRight.createEl('button', {
            text: 'Scrape Notes',
            cls: 'mod-cta oom-modal-button oom-scrape-button'
        });
        attachClickEvent(this.scrapeButton, () => {
            if (!this.isScraping) {
                this.isScraping = true;
                this.scrapeButton.disabled = true;
                this.plugin.scrapeMetrics();
            }
        });

        // Add Settings button directly after Scrape Metrics
        const settingsButton = scrapeRight.createEl('button', {
            text: 'Open Settings',
            cls: 'mod-cta oom-modal-button oom-settings-button'
        });
        attachClickEvent(settingsButton, () => {
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById('oneirometrics');
        });

        // Add Open OneiroMetrics button directly after Settings
        this.openNoteButton = scrapeRight.createEl('button', {
            text: 'Open OneiroMetrics',
            cls: 'mod-cta oom-modal-button oom-open-note-button',
            attr: { title: 'Run a scrape to enable this' }
        });
        this.openNoteButton.disabled = true;
        this.openNoteButton.classList.remove('enabled');
        attachClickEvent(this.openNoteButton, () => {
            if (this.openNoteButton.disabled) return;
            const projPath = getProjectNotePath(this.plugin.settings);
            const file = this.app.vault.getAbstractFileByPath(projPath);
            if (file instanceof TFile) {
                this.app.workspace.openLinkText(projPath, '', true);
            } else {
                new Notice('Metrics note not found. Please set the path in settings.');
                (this.app as any).setting.open('oneirometrics');
            }
        });

        // --- Progress Section ---
        const progressSection = contentEl.createEl('div', { cls: 'oom-modal-section oom-modal-progress' });
        this.progressContent = progressSection.createEl('div', { cls: 'oom-progress-content' });
        this.statusText = this.progressContent.createEl('div', { cls: 'oom-status-text' });
        this.progressBar = this.progressContent.createEl('div', { cls: 'oom-progress-bar' });
        this.progressFill = this.progressBar.createEl('div', { cls: 'oom-progress-fill' });
        this.detailsText = this.progressContent.createEl('div', { cls: 'oom-details-text' });

        // --- Dropdown Change Handler ---
        attachEvent(modeDropdown, 'change', async (e: Event) => {
            const value = (e.target as HTMLSelectElement).value as 'notes' | 'folder';
            this.selectionMode = value;
            setSelectionMode(this.plugin.settings, value);
            if (value === 'folder') {
                this.plugin.settings.selectedNotes = [];
            } else {
                setSelectedFolder(this.plugin.settings, '');
            }
            await this.plugin.saveSettings();
            // Re-render selector row
            selectorLeft.empty();
            selectorRight.empty();
            if (value === 'folder') {
                selectorLeft.createEl('label', { text: 'Selected Folder', cls: 'oom-modal-label' });
                selectorLeft.createEl('div', { text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)', cls: 'oom-modal-helper' });
                
                // Add folder selector
                const folderAutocompleteContainer = selectorRight.createDiv('oom-folder-autocomplete-container');
                import('../../../autocomplete').then(({ createFolderAutocomplete }) => {
                    createFolderAutocomplete({
                        app: this.app,
                        plugin: this,
                        containerEl: folderAutocompleteContainer,
                        selectedFolder: this.selectedFolder,
                        onChange: async (folder) => {
                            this.selectedFolder = folder;
                            setSelectedFolder(this.plugin.settings, folder);
                            await this.plugin.saveSettings();
                        }
                    });
                });
            } else {
                selectorLeft.createEl('label', { text: 'Selected Notes', cls: 'oom-modal-label' });
                selectorLeft.createEl('div', { text: 'Notes to search for dream metrics (select one or more)', cls: 'oom-modal-helper' });
                
                // Add notes autocomplete
                const notesAutocompleteContainer = selectorRight.createDiv('oom-notes-autocomplete-container');
                import('../../../autocomplete').then(({ createSelectedNotesAutocomplete }) => {
                    createSelectedNotesAutocomplete({
                        app: this.app,
                        plugin: this,
                        containerEl: notesAutocompleteContainer,
                        selectedNotes: this.selectedNotes,
                        onChange: async (selected) => {
                            this.selectedNotes = selected;
                            this.plugin.settings.selectedNotes = selected;
                            await this.plugin.saveSettings();
                        }
                    });
                });
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        if (OneiroMetricsModal.activeModal === this) {
            OneiroMetricsModal.activeModal = null;
        }
    }
}

// Export to make it available if needed for rollback
export { OneiroMetricsModal }; 