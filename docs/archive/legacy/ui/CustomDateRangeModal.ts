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
                deleteBtn.innerHTML = `<span class="oom-lucide-icon"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></span>`;
                
                // Combine click and delete functionality
                const handleItemClick = () => {
                    // Set the dates in the inputs
                    startInputElements.setValue(range.start);
                    endInputElements.setValue(range.end);
                    
                    // Update the internal date objects
                    this.startDate = new Date(range.start + "T12:00:00");
                    this.endDate = new Date(range.end + "T12:00:00");
                };

                const handleDeleteClick = (e: Event) => {
                    e.stopPropagation();
                    if (this.onDeleteFavorite) {
                        this.onDeleteFavorite(name);
                        // Remove the item from the UI
                        favoriteItem.remove();
                        // If no more favorites, hide the section
                        if (favoritesList.children.length === 0) {
                            favSection.remove();
                        }
                    }
                };

                // Add click handlers
                favoriteItem.addEventListener('click', handleItemClick);
                favoriteItem.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick();
                    }
                });
                
                deleteBtn.addEventListener('click', handleDeleteClick);
            }
        }

        // Save as favorite section
        const saveSection = contentEl.createDiv('oom-modal-section');
        const saveContainer = saveSection.createDiv('oom-save-container');
        
        saveContainer.createEl('label', { text: 'Save as favorite (optional)', cls: 'oom-save-label' });
        const saveInput = saveContainer.createEl('input', {
            type: 'text',
            placeholder: 'Enter favorite name...',
            cls: 'oom-save-input'
        });

        // Action buttons
        const buttonContainer = contentEl.createDiv('oom-modal-buttons');
        
        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'oom-modal-button oom-modal-button--secondary'
        });
        
        const selectBtn = buttonContainer.createEl('button', {
            text: 'Select',
            cls: 'oom-modal-button oom-modal-button--primary'
        });

        // Event handlers
        cancelBtn.addEventListener('click', () => {
            this.close();
        });

        selectBtn.addEventListener('click', () => {
            // Validate dates
            if (this.startDate > this.endDate) {
                // Swap dates if end is before start
                const temp = this.startDate;
                this.startDate = this.endDate;
                this.endDate = temp;
            }

            const saveName = saveInput.value.trim() || undefined;
            this.onSelect(this.startDate, this.endDate, saveName);
            this.close();
        });

        // Handle Enter key in save input
        saveInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                selectBtn.click();
            }
        });

        // Focus the first input
        startInputElements.input.focus();
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
} 