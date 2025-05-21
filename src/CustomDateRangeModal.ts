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

        // Date range input section
        const rangeSection = contentEl.createDiv('oom-modal-section');
        const grid = rangeSection.createDiv('oom-modal-grid');
        
        // Format date for input value (YYYY-MM-DD)
        const formatDateForInput = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Create a custom date input with visible date display
        const createCustomDateInput = (label: string, initialDate: Date, onChange: (value: string) => void) => {
            const container = document.createElement('div');
            container.className = 'oom-date-input-container';
            container.style.display = 'contents';
            
            // Create label
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            grid.appendChild(labelEl);
            
            // Create wrapper for better styling control
            const wrapper = document.createElement('div');
            wrapper.className = 'oom-date-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            
            // Hidden input for date picker functionality
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.className = 'oom-date-input';
            dateInput.value = formatDateForInput(initialDate);
            dateInput.style.opacity = '0';
            dateInput.style.position = 'absolute';
            dateInput.style.top = '0';
            dateInput.style.left = '0';
            dateInput.style.width = '100%';
            dateInput.style.height = '100%';
            dateInput.style.cursor = 'pointer';
            dateInput.style.zIndex = '2';
            
            // Visible date display that shows the selected date
            const displayEl = document.createElement('div');
            displayEl.className = 'oom-date-display';
            displayEl.style.flex = '1';
            displayEl.style.padding = '6px 8px';
            displayEl.style.border = '1px solid var(--background-modifier-border)';
            displayEl.style.borderRadius = '4px';
            displayEl.style.backgroundColor = 'var(--background-primary)';
            
            // Format date for display
            const displayDate = (dateStr: string) => {
                try {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (e) {
                    return dateStr || 'Select date';
                }
            };
            
            // Set initial display
            displayEl.textContent = displayDate(dateInput.value);
            
            // Add calendar icon
            const calendarIcon = document.createElement('span');
            calendarIcon.className = 'oom-calendar-icon';
            calendarIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
            calendarIcon.style.position = 'absolute';
            calendarIcon.style.right = '8px';
            calendarIcon.style.zIndex = '1';
            calendarIcon.style.pointerEvents = 'none';
            
            // Handle date input changes
            dateInput.addEventListener('change', (e) => {
                const value = (e.target as HTMLInputElement).value;
                if (value) {
                    displayEl.textContent = displayDate(value);
                    onChange(value);
                }
            });
            
            // Clicking the display also triggers the date picker
            displayEl.addEventListener('click', () => {
                dateInput.showPicker();
            });
            
            wrapper.appendChild(displayEl);
            wrapper.appendChild(dateInput);
            wrapper.appendChild(calendarIcon);
            grid.appendChild(wrapper);
            
            return { 
                input: dateInput, 
                display: displayEl,
                setValue: (value: string) => {
                    dateInput.value = value;
                    displayEl.textContent = displayDate(value);
                }
            };
        };

        // Create date inputs
        const startInputElements = createCustomDateInput('Start Date', this.startDate, (value) => {
            if (value) {
                this.startDate = new Date(value + "T12:00:00");
            }
        });
        
        const endInputElements = createCustomDateInput('End Date', this.endDate, (value) => {
            if (value) {
                this.endDate = new Date(value + "T12:00:00");
            }
        });

        // Favorites list section
        if (Object.keys(this.favorites).length > 0) {
            const favSection = contentEl.createDiv('oom-modal-section');
            favSection.createEl('h3', { text: 'Favorites', cls: 'oom-favorites-heading' });
            favSection.createEl('p', { 
                text: 'Click a favorite to apply it', 
                cls: 'oom-favorites-helper' 
            });
            
            const favoritesList = favSection.createDiv('oom-favorites-list');
            for (const [name, range] of Object.entries(this.favorites)) {
                const favoriteItem = favoritesList.createDiv('oom-favorite-item');
                // Make the entire favorite item clickable
                favoriteItem.addClass('oom-clickable');
                favoriteItem.setAttribute('tabindex', '0');
                favoriteItem.setAttribute('role', 'button');
                favoriteItem.setAttribute('aria-label', `Apply favorite ${name}: ${range.start} to ${range.end}`);
                
                const row = favoriteItem.createDiv('oom-favorite-row');
                const info = row.createDiv('oom-favorite-info');
                info.createEl('span', { text: name, cls: 'oom-favorite-name' });
                
                // Parse dates for display only
                const formatDate = (dateStr: string) => {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                };
                
                const shortRange = `${formatDate(range.start)} - ${formatDate(range.end)}`;
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
                
                // Click event for the entire favorite
                favoriteItem.addEventListener('click', (e) => {
                    const target = e.target as HTMLElement;
                    // Avoid applying when clicking the delete button
                    if (target.closest('.oom-favorite-delete')) return;
                    
                    // Update both the inputs and visual displays
                    startInputElements.setValue(range.start);
                    endInputElements.setValue(range.end);
                    
                    // Update internal state with correct dates
                    this.startDate = new Date(range.start + "T12:00:00");
                    this.endDate = new Date(range.end + "T12:00:00");
                    
                    // Visual feedback
                    favoritesList.querySelectorAll('.oom-favorite-item').forEach(item => 
                        item.removeClass('oom-favorite-active'));
                    favoriteItem.addClass('oom-favorite-active');
                });
                
                // Keyboard support
                favoriteItem.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // Simulate click but avoid delete button
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        favoriteItem.dispatchEvent(clickEvent);
                    }
                });
                
                // Delete button event
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.onDeleteFavorite) {
                        this.onDeleteFavorite(name);
                        favoriteItem.remove();
                        if (Object.keys(this.favorites).length === 0) {
                            favSection.remove();
                        }
                    }
                });
            }
            
            // Add hr after favorites section
            contentEl.createEl('hr');
        }

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
                // Use input values directly
                this.onSelect(startInputElements.input.value, endInputElements.input.value, name);
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
            // Use input values directly to avoid timezone issues
            this.onSelect(startInputElements.input.value, endInputElements.input.value);
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