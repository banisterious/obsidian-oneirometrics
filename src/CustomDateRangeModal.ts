import { Modal, Setting } from 'obsidian';

export class CustomDateRangeModal extends Modal {
    private startDate: Date;
    private endDate: Date;
    private onSelect: (start: string | Date, end: string | Date, saveName?: string) => void;
    private favorites: Record<string, { start: string, end: string }>;
    private onDeleteFavorite?: (name: string) => void;

    constructor(
        app: any, 
        onSelect: (start: string | Date, end: string | Date, saveName?: string) => void, 
        favorites: Record<string, { start: string, end: string }> = {},
        onDeleteFavorite?: (name: string) => void
    ) {
        super(app);
        this.onSelect = onSelect;
        this.startDate = new Date();
        this.endDate = new Date();
        this.favorites = favorites;
        this.onDeleteFavorite = onDeleteFavorite;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oneirometrics-custom-date-modal');

        // Add title
        contentEl.createEl('h2', { text: 'Select Date Range' });

        // Favorites dropdown and list section
        if (Object.keys(this.favorites).length > 0) {
            const favSection = contentEl.createDiv('oom-modal-section');
            const favDiv = favSection.createDiv('oom-favorites-container');
            favDiv.createEl('label', { text: 'Favorites: ', attr: { for: 'oom-fav-select' } });
            const favSelect = favDiv.createEl('select', { attr: { id: 'oom-fav-select' } });
            favSelect.createEl('option', { text: '-- Select a favorite --', value: '' });
            const favoritesList = favSection.createDiv('oom-favorites-list');
            for (const [name, range] of Object.entries(this.favorites)) {
                const favoriteItem = favoritesList.createDiv('oom-favorite-item');
                favSelect.createEl('option', { text: `${name}: ${range.start} to ${range.end}`, value: name });
                const row = favoriteItem.createDiv('oom-favorite-row');
                const info = row.createDiv('oom-favorite-info');
                info.createEl('span', { text: name, cls: 'oom-favorite-name' });
                const startDate = new Date(range.start);
                const endDate = new Date(range.end);
                const formatDate = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const shortRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;
                const fullRange = `${range.start} to ${range.end}`;
                info.createEl('span', { text: shortRange, cls: 'oom-favorite-range', attr: { 'title': fullRange } });
                // Lucide sparkle icon for favorite
                const sparkleIcon = document.createElement('span');
                sparkleIcon.className = 'oom-lucide-icon';
                sparkleIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.07 6.07-1.41-1.41M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>`;
                info.prepend(sparkleIcon);
                // Lucide trash-2 icon for delete
                const deleteBtn = row.createEl('button', {
                    cls: 'oom-favorite-delete',
                    attr: {
                        'aria-label': `Delete favorite ${name}`,
                        'title': `Delete favorite ${name}`
                    }
                });
                deleteBtn.innerHTML = `<span class="oom-lucide-icon"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></span>`;
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.onDeleteFavorite) {
                        this.onDeleteFavorite(name);
                        favoriteItem.remove();
                        const option = favSelect.querySelector(`option[value="${name}"]`);
                        if (option) option.remove();
                        if (Object.keys(this.favorites).length === 0) {
                            favSection.remove();
                        }
                    }
                });
            }
            favSelect.addEventListener('change', () => {
                const selected = favSelect.value;
                if (selected && this.favorites[selected]) {
                    this.startDate = new Date(this.favorites[selected].start);
                    this.endDate = new Date(this.favorites[selected].end);
                    startInput.value = this.startDate.toISOString().split('T')[0];
                    endInput.value = this.endDate.toISOString().split('T')[0];
                }
            });
            // Add hr after favorites section
            contentEl.createEl('hr');
        }

        // Date range input section
        const rangeSection = contentEl.createDiv('oom-modal-section');
        const grid = rangeSection.createDiv('oom-modal-grid');
        let startInput: HTMLInputElement;
        let endInput: HTMLInputElement;
        // Start Date
        const startLabel = document.createElement('label');
        startLabel.textContent = 'Start Date';
        grid.appendChild(startLabel);
        startInput = document.createElement('input');
        startInput.type = 'date';
        startInput.value = this.startDate.toISOString().split('T')[0];
        startInput.addEventListener('change', (e) => {
            this.startDate = new Date((e.target as HTMLInputElement).value);
        });
        grid.appendChild(startInput);
        // End Date
        const endLabel = document.createElement('label');
        endLabel.textContent = 'End Date';
        grid.appendChild(endLabel);
        endInput = document.createElement('input');
        endInput.type = 'date';
        endInput.value = this.endDate.toISOString().split('T')[0];
        endInput.addEventListener('change', (e) => {
            this.endDate = new Date((e.target as HTMLInputElement).value);
        });
        grid.appendChild(endInput);
        // Add hr after range section
        contentEl.createEl('hr');

        // Save as favorite section
        const favSaveSection = contentEl.createDiv('oom-modal-section');
        // Favorite name row with custom class (side-by-side layout)
        const favNameRow = document.createElement('div');
        favNameRow.className = 'oom-fav-name-row';
        favNameRow.style.display = 'flex';
        favNameRow.style.alignItems = 'center';
        favNameRow.style.gap = '0.5em';
        favNameRow.style.marginBottom = '0.5em';
        favNameRow.style.width = '100%';
        const favInputLabel = document.createElement('label');
        favInputLabel.textContent = 'Name';
        favNameRow.appendChild(favInputLabel);
        const favInput = document.createElement('input');
        favInput.type = 'text';
        favInput.placeholder = 'Favorite name';
        favInput.style.flex = '1 1 0';
        favNameRow.appendChild(favInput);
        const favSaveBtn = document.createElement('button');
        favSaveBtn.textContent = 'Save as Favorite';
        favSaveBtn.className = 'mod-cta';
        favNameRow.appendChild(favSaveBtn);
        favSaveSection.appendChild(favNameRow);
        favSaveBtn.addEventListener('click', () => {
            const name = favInput.value.trim();
            if (name) {
                this.onSelect(this.startDate, this.endDate, name);
                this.close();
            }
        });

        // Modal buttons
        const buttonContainer = contentEl.createDiv('oneirometrics-modal-buttons');
        buttonContainer.style.justifyContent = 'center';
        const applyButton = buttonContainer.createEl('button', {
            text: 'Apply',
            cls: 'mod-cta'
        });
        applyButton.addEventListener('click', () => {
            this.onSelect(this.startDate, this.endDate);
            this.close();
        });
        const clearButton = buttonContainer.createEl('button', {
            text: 'Clear',
            cls: 'oom-modal-btn-muted'
        });
        clearButton.addEventListener('click', () => {
            this.onSelect('', '');
            this.close();
        });
        const cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'oom-modal-btn-muted'
        });
        cancelButton.addEventListener('click', () => this.close());

        // Add keyboard support
        contentEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyButton.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
} 