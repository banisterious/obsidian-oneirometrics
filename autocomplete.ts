// Shared autocomplete utility for OneiroMetrics Selected Notes
import { App, TFile, TFolder, Plugin, Scope } from 'obsidian';

interface AutocompleteOptions {
    app: App;
    plugin: any;
    containerEl: HTMLElement;
    selectedNotes: string[];
    onChange: (selected: string[]) => void;
}

// Enhanced suggestion display system for multi-select
class MultiSelectSuggestionDisplay {
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
        if (this.suggestions.length === 0) return;
        
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

// Enhanced multi-select notes suggester
class MultiSelectNotesSuggest {
    private app: App;
    private inputEl: HTMLInputElement;
    private scope: Scope;
    private suggestEl: HTMLElement;
    private suggest: MultiSelectSuggestionDisplay;
    private popper: any;
    private selectedNotes: string[];
    private onChange: (selected: string[]) => void;
    private renderChips: () => void;

    constructor(app: App, inputEl: HTMLInputElement, selectedNotes: string[], onChange: (selected: string[]) => void, renderChips: () => void) {
        this.app = app;
        this.inputEl = inputEl;
        this.selectedNotes = selectedNotes;
        this.onChange = onChange;
        this.renderChips = renderChips;
        this.scope = new Scope();
        
        this.suggestEl = createDiv("suggestion-container");
        const suggestionDiv = this.suggestEl.createDiv("suggestion");
        this.suggest = new MultiSelectSuggestionDisplay(this, suggestionDiv, this.scope);
        
        this.scope.register([], "Escape", this.close.bind(this));
        
        this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("blur", this.close.bind(this));
        
        this.suggestEl.on("mousedown", ".suggestion-container", (evt) => {
            evt.preventDefault();
        });
    }

    getSuggestions(query: string): TFile[] {
        if (!query.trim()) return [];
        
        const files = this.app.vault.getMarkdownFiles();
        const lowerQuery = query.toLowerCase();
        const yearMatch = query.match(/^(20\d{2})$/);
        
        let matchingFiles = files.filter(file => {
            // Skip backup files and already selected notes
            if (file.path.includes('.backup-') || 
                file.path.includes('/Backups/') || 
                file.path.endsWith('.backup') ||
                this.selectedNotes.includes(file.path)) {
                return false;
            }
            
            const lowerPath = file.path.toLowerCase();
            return lowerPath.includes(lowerQuery) || (yearMatch && file.path.includes(yearMatch[1]));
        });
        
        // If user types a year, prioritize Journals/<year>/<year>.md if it exists
        if (yearMatch) {
            const yearFile = matchingFiles.find(f => f.path === `Journals/${yearMatch[1]}/${yearMatch[1]}.md`);
            if (yearFile) {
                matchingFiles = [yearFile, ...matchingFiles.filter(f => f !== yearFile)];
            }
        }
        
        // Sort by relevance
        matchingFiles.sort((a, b) => {
            const aExact = a.path.toLowerCase() === lowerQuery;
            const bExact = b.path.toLowerCase() === lowerQuery;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return a.path.localeCompare(b.path);
        });
        
        return matchingFiles.slice(0, 1000);
    }

    renderSuggestion(file: TFile, el: HTMLElement) {
        el.setText(file.path);
        el.setAttr('title', file.path);
    }

    selectSuggestion(file: TFile) {
        // Add the selected file to the list
        this.selectedNotes.push(file.path);
        this.onChange([...this.selectedNotes]);
        
        // Clear the input and close suggestions
        this.inputEl.value = '';
        this.close();
        
        // Re-render chips
        this.renderChips();
    }

    private onInputChanged() {
        const query = this.inputEl.value;
        const suggestions = this.getSuggestions(query);
        
        if (!suggestions || suggestions.length === 0) {
            this.close();
            return;
        }
        
        this.suggest.setSuggestions(suggestions);
        this.open(document.body, this.inputEl);
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
            // Fallback positioning using CSS utility classes
            const rect = referenceEl.getBoundingClientRect();
            this.suggestEl.addClass('oom-dropdown-absolute');
            this.suggestEl.addClass('oom-dropdown-positioned');
            this.suggestEl.style.setProperty('--oom-dropdown-top', `${rect.bottom}px`);
            this.suggestEl.style.setProperty('--oom-dropdown-left', `${rect.left}px`);
            this.suggestEl.style.setProperty('--oom-dropdown-width', `${rect.width}px`);
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

export function createSelectedNotesAutocomplete({
    app,
    plugin,
    containerEl,
    selectedNotes,
    onChange
}: AutocompleteOptions) {
    // Container for chips and input
    const input = containerEl.createEl('input', {
        type: 'text',
        cls: 'oom-multiselect-input',
        attr: { placeholder: 'Type to search notes...' }
    });
    const chipsContainer = containerEl.createEl('div', { cls: 'oom-chips-container' });
    
    // Remove border/background from .oom-chip as well
    const style = document.createElement('style');
    style.textContent = `
        .oom-chips-container { 
            border: none !important; 
            background: none !important; 
            box-shadow: none !important;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 8px;
        }
        .oom-chip { 
            border: none !important; 
            background: var(--background-modifier-border) !important; 
            box-shadow: none !important;
            display: inline-flex;
            align-items: center;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            color: var(--text-normal);
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
        }
        .oom-chip-text {
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: default;
        }
        .oom-chip-remove {
            margin-left: 4px;
            cursor: pointer;
            color: var(--text-muted);
            font-weight: bold;
            font-size: 12px;
            line-height: 1;
            padding: 0 2px;
            border-radius: 2px;
            transition: color 0.2s ease, background-color 0.2s ease;
        }
        .oom-chip-remove:hover {
            color: var(--text-error);
            background-color: var(--background-modifier-error);
        }
        .oom-multiselect-input {
            margin-bottom: 4px;
        }
    `;
    document.head.appendChild(style);

    function renderChips() {
        chipsContainer.empty();
        if (selectedNotes.length === 0) {
            chipsContainer.classList.add('oom-chips-hidden');
        } else {
            chipsContainer.classList.remove('oom-chips-hidden');
            
            // Helper function to get display name for a note path
            const getDisplayName = (notePath: string): string => {
                const filename = notePath.split('/').pop() || notePath;
                
                // Check for filename conflicts
                const conflictingPaths = selectedNotes.filter(path => {
                    const otherFilename = path.split('/').pop() || path;
                    return otherFilename === filename && path !== notePath;
                });
                
                if (conflictingPaths.length > 0) {
                    // If there are conflicts, show minimal disambiguating path
                    const pathParts = notePath.split('/');
                    if (pathParts.length > 1) {
                        // Show parent folder + filename (e.g., "2025/2025.md")
                        return `${pathParts[pathParts.length - 2]}/${filename}`;
                    }
                }
                
                return filename;
            };
            
            for (const note of selectedNotes) {
                const chip = chipsContainer.createEl('span', { cls: 'oom-chip' });
                const displayName = getDisplayName(note);
                const chipText = chip.createEl('span', { 
                    cls: 'oom-chip-text', 
                    text: displayName 
                });
                
                // Set tooltip to show full path
                chipText.setAttr('title', note);
                
                const removeBtn = chip.createEl('span', { cls: 'oom-chip-remove', text: '×' });
                removeBtn.onclick = () => {
                    const idx = selectedNotes.indexOf(note);
                    if (idx !== -1) {
                        selectedNotes.splice(idx, 1);
                        onChange([...selectedNotes]);
                        renderChips();
                    }
                };
            }
        }
    }

    // Initialize the enhanced suggestions system
    const notesSuggest = new MultiSelectNotesSuggest(app, input, selectedNotes, onChange, renderChips);

    // Initial render
    renderChips();
    
    return {
        input,
        chipsContainer,
        suggestionContainer: undefined // Not needed anymore with the new system
    };
}

interface FolderAutocompleteOptions {
    app: App;
    plugin: any;
    containerEl: HTMLElement;
    selectedFolder: string;
    onChange: (selected: string) => void;
}

export function createFolderAutocomplete({
    app,
    plugin,
    containerEl,
    selectedFolder,
    onChange
}: FolderAutocompleteOptions) {
    const input = containerEl.createEl('input', {
        type: 'text',
        cls: 'oom-folder-autocomplete-input',
        attr: { placeholder: 'Choose folder...' }
    });
    input.value = selectedFolder || '';
    const suggestionContainer = containerEl.createEl('div', {
        cls: 'oom-suggestion-container'
    });

    function getFolders(): string[] {
        const folders: string[] = [];
        const files = app.vault.getAllLoadedFiles();
        files.forEach(file => {
            if (file instanceof TFolder) {
                folders.push(file.path);
            }
        });
        return folders.sort((a, b) => a.localeCompare(b));
    }

    function hideSuggestions() {
        suggestionContainer.classList.remove('oom-suggestions-visible');
        suggestionContainer.empty();
    }

    function showSuggestions(query: string) {
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
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    input.value = folder;
                    onChange(folder);
                    hideSuggestions();
                });
            });
            suggestionContainer.classList.add('oom-suggestions-visible');
            suggestionContainer.classList.add('oom-suggestion-positioned');
            suggestionContainer.style.setProperty('--oom-suggestion-top', `${input.offsetTop + input.offsetHeight}px`);
            suggestionContainer.style.setProperty('--oom-suggestion-left', `${input.offsetLeft}px`);
            suggestionContainer.style.setProperty('--oom-suggestion-width', `${input.offsetWidth}px`);
        } else {
            hideSuggestions();
        }
    }

    input.addEventListener('input', () => {
        showSuggestions(input.value);
        onChange(input.value);
    });
    input.addEventListener('focus', () => {
        showSuggestions(input.value);
    });
    input.addEventListener('blur', () => {
        setTimeout(() => hideSuggestions(), 200);
    });
    input.addEventListener('keydown', (e) => {
        const items = suggestionContainer.querySelectorAll('.suggestion-item');
        const currentIndex = Array.from(items).findIndex(item => item.classList.contains('is-selected'));
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < items.length - 1) {
                    items[currentIndex]?.classList.remove('is-selected');
                    items[currentIndex + 1].classList.add('is-selected');
                    (items[currentIndex + 1] as HTMLElement).scrollIntoView({ block: 'nearest' });
                } else if (items.length > 0 && currentIndex === -1) {
                    items[0].classList.add('is-selected');
                    (items[0] as HTMLElement).scrollIntoView({ block: 'nearest' });
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
                        input.value = folder;
                        onChange(folder);
                        hideSuggestions();
                    }
                }
                break;
            case 'Escape':
                hideSuggestions();
                break;
        }
    });

    return {
        input,
        suggestionContainer
    };
}

// Multi-select folders autocomplete interface
interface FoldersAutocompleteOptions {
    app: App;
    plugin: any;
    containerEl: HTMLElement;
    selectedFolders: string[];
    onChange: (selected: string[]) => void;
}

// Multi-select folders suggester class
class MultiSelectFoldersSuggest {
    private app: App;
    private inputEl: HTMLInputElement;
    private scope: Scope;
    private suggestEl: HTMLElement;
    private suggest: MultiSelectSuggestionDisplay;
    private popper: any;
    private selectedFolders: string[];
    private onChange: (selected: string[]) => void;
    private renderChips: () => void;

    constructor(app: App, inputEl: HTMLInputElement, selectedFolders: string[], onChange: (selected: string[]) => void, renderChips: () => void) {
        this.app = app;
        this.inputEl = inputEl;
        this.selectedFolders = selectedFolders;
        this.onChange = onChange;
        this.renderChips = renderChips;
        this.scope = new Scope();
        
        this.suggestEl = createDiv("suggestion-container");
        const suggestionDiv = this.suggestEl.createDiv("suggestion");
        this.suggest = new MultiSelectSuggestionDisplay(this, suggestionDiv, this.scope);
        
        this.scope.register([], "Escape", this.close.bind(this));
        
        this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("blur", this.close.bind(this));
        
        this.suggestEl.on("mousedown", ".suggestion-container", (evt) => {
            evt.preventDefault();
        });
    }

    getSuggestions(query: string): TFolder[] {
        if (!query.trim()) return [];
        
        const files = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerQuery = query.toLowerCase();
        
        files.forEach(file => {
            if (file instanceof TFolder && 
                !this.selectedFolders.includes(file.path) &&
                file.path.toLowerCase().includes(lowerQuery)) {
                folders.push(file);
            }
        });
        
        // Sort by relevance
        folders.sort((a, b) => {
            const aExact = a.path.toLowerCase() === lowerQuery;
            const bExact = b.path.toLowerCase() === lowerQuery;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return a.path.localeCompare(b.path);
        });
        
        return folders.slice(0, 1000);
    }

    renderSuggestion(folder: TFolder, el: HTMLElement) {
        el.setText(folder.path);
        el.setAttr('title', folder.path);
    }

    selectSuggestion(folder: TFolder) {
        // Add the selected folder to the list
        this.selectedFolders.push(folder.path);
        this.onChange([...this.selectedFolders]);
        
        // Clear the input and close suggestions
        this.inputEl.value = '';
        this.close();
        
        // Re-render chips
        this.renderChips();
    }

    private onInputChanged() {
        const query = this.inputEl.value;
        const suggestions = this.getSuggestions(query);
        
        if (!suggestions || suggestions.length === 0) {
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
        
        // Use Obsidian's positioning if available
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
            // Fallback positioning using CSS utility classes
            const rect = referenceEl.getBoundingClientRect();
            this.suggestEl.addClass('oom-dropdown-absolute');
            this.suggestEl.addClass('oom-dropdown-positioned');
            this.suggestEl.style.setProperty('--oom-dropdown-top', `${rect.bottom}px`);
            this.suggestEl.style.setProperty('--oom-dropdown-left', `${rect.left}px`);
            this.suggestEl.style.setProperty('--oom-dropdown-width', `${rect.width}px`);
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

// Export function for multi-select folders autocomplete
export function createSelectedFoldersAutocomplete({
    app,
    plugin,
    containerEl,
    selectedFolders,
    onChange
}: FoldersAutocompleteOptions) {
    const input = containerEl.createEl('input', {
        type: 'text',
        cls: 'oom-multiselect-input',
        attr: { placeholder: 'Type to search and select folders...' }
    });
    
    const chipsContainer = containerEl.createEl('div', {
        cls: 'oom-multiselect-chips-container oom-exclude-folders-chips'
    });
    
    // Add styles for folder chips (similar to notes but with folder styling)
    if (!document.getElementById('oom-folder-chips-styles')) {
        const style = document.createElement('style');
        style.id = 'oom-folder-chips-styles';
        style.textContent = `
            .oom-exclude-folders-chips .oom-chip {
                background-color: var(--background-modifier-error);
                border-color: var(--text-error);
                color: var(--text-error);
            }
            .oom-exclude-folders-chips .oom-chip:hover {
                background-color: var(--text-error);
                color: var(--text-on-accent);
            }
        `;
        document.head.appendChild(style);
    }

    function renderChips() {
        chipsContainer.empty();
        if (selectedFolders.length === 0) {
            chipsContainer.classList.add('oom-chips-hidden');
        } else {
            chipsContainer.classList.remove('oom-chips-hidden');
            
            for (const folder of selectedFolders) {
                const chip = chipsContainer.createEl('span', { cls: 'oom-chip' });
                const chipText = chip.createEl('span', { 
                    cls: 'oom-chip-text', 
                    text: folder 
                });
                
                // Set tooltip to show full path
                chipText.setAttr('title', folder);
                
                const removeBtn = chip.createEl('span', { cls: 'oom-chip-remove', text: '×' });
                removeBtn.onclick = () => {
                    const idx = selectedFolders.indexOf(folder);
                    if (idx !== -1) {
                        selectedFolders.splice(idx, 1);
                        onChange([...selectedFolders]);
                        renderChips();
                    }
                };
            }
        }
    }

    // Initialize the enhanced suggestions system
    const foldersSuggest = new MultiSelectFoldersSuggest(app, input, selectedFolders, onChange, renderChips);

    // Initial render
    renderChips();
    
    return {
        input,
        chipsContainer,
        suggestionContainer: undefined // Not needed with the new system
    };
} 