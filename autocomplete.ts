// Shared autocomplete utility for OneiroMetrics Selected Notes
import { App, TFile, Plugin } from 'obsidian';

interface AutocompleteOptions {
    app: App;
    plugin: any;
    containerEl: HTMLElement;
    selectedNotes: string[];
    onChange: (selected: string[]) => void;
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
    chipsContainer.style.border = 'none';
    chipsContainer.style.background = 'none';
    chipsContainer.style.padding = '0';
    chipsContainer.style.margin = '0';
    chipsContainer.style.boxShadow = 'none';
    // Remove border/background from .oom-chip as well
    const style = document.createElement('style');
    style.textContent = `
        .oom-chips-container { border: none !important; background: none !important; box-shadow: none !important; }
        .oom-chip { border: none !important; background: none !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    const suggestionContainer = containerEl.createEl('div', {
        cls: 'suggestion-container oom-suggestion-container'
    });

    function renderChips() {
        chipsContainer.empty();
        if (selectedNotes.length === 0) {
            chipsContainer.style.display = 'none';
        } else {
            chipsContainer.style.display = '';
            for (const note of selectedNotes) {
                const chip = chipsContainer.createEl('span', { cls: 'oom-chip' });
                const chipText = chip.createEl('span', { cls: 'oom-chip-text', text: note });
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
    renderChips();

    function hideSuggestions() {
        suggestionContainer.classList.remove('visible');
        suggestionContainer.empty();
    }

    function showSuggestions() {
        if (suggestionContainer.children.length > 0) {
            suggestionContainer.classList.add('visible');
            const inputRect = input.getBoundingClientRect();
            const containerRect = containerEl.getBoundingClientRect();
            suggestionContainer.style.position = 'absolute';
            suggestionContainer.style.top = `${input.offsetTop + input.offsetHeight}px`;
            suggestionContainer.style.left = `${input.offsetLeft}px`;
            suggestionContainer.style.width = `${input.offsetWidth}px`;
        }
    }

    input.addEventListener('input', async () => {
        const value = input.value;
        if (!value) {
            hideSuggestions();
            return;
        }
        const files = app.vault.getMarkdownFiles();
        const lowerInput = value.toLowerCase();
        const yearMatch = value.match(/^(20\d{2})$/);
        let matchingFiles = files
            .map(file => file.path)
            .filter(path => {
                if (path.includes('.backup-') || path.includes('/Backups/') || path.endsWith('.backup')) {
                    return false;
                }
                const lowerPath = path.toLowerCase();
                return !selectedNotes.includes(path) &&
                    (lowerPath.includes(lowerInput) || (yearMatch && path.includes(yearMatch[1])));
            });
        // If user types a year, suggest Journals/<year>/<year>.md if it exists
        if (yearMatch) {
            const yearFile = `Journals/${yearMatch[1]}/${yearMatch[1]}.md`;
            if (matchingFiles.includes(yearFile)) {
                matchingFiles = [yearFile, ...matchingFiles.filter(f => f !== yearFile)];
            }
        }
        matchingFiles = [...new Set(matchingFiles)]
            .sort((a, b) => {
                const aExact = a.toLowerCase() === lowerInput;
                const bExact = b.toLowerCase() === lowerInput;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                return a.localeCompare(b);
            })
            .slice(0, 7);
        suggestionContainer.empty();
        if (matchingFiles.length > 0) {
            for (const suggestion of matchingFiles) {
                const item = suggestionContainer.createEl('div', {
                    cls: 'suggestion-item',
                    attr: { title: suggestion }
                });
                item.textContent = suggestion;
                item.onclick = () => {
                    selectedNotes.push(suggestion);
                    onChange([...selectedNotes]);
                    input.value = '';
                    hideSuggestions();
                    renderChips();
                };
            }
            showSuggestions();
        } else {
            hideSuggestions();
        }
    });

    document.addEventListener('click', (e) => {
        if (!containerEl.contains(e.target as Node)) {
            hideSuggestions();
        }
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
                    const path = selectedItem.textContent;
                    if (path) {
                        selectedNotes.push(path);
                        onChange([...selectedNotes]);
                        input.value = '';
                        hideSuggestions();
                        renderChips();
                    }
                }
                break;
            case 'Escape':
                hideSuggestions();
                break;
        }
    });

    // Initial render
    renderChips();
    return {
        input,
        chipsContainer,
        suggestionContainer
    };
} 