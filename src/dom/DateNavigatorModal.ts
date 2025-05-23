import { App, Modal, Notice } from 'obsidian';
import { DateNavigator } from './DateNavigator';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { DateNavigatorIntegration } from './DateNavigatorIntegration';
import { TimeFilterManager } from '../timeFilters';
import { startOfDay, endOfDay, startOfYear, getYear } from 'date-fns';

// View modes for hierarchical navigation
export enum NavigatorViewMode {
    YEAR_VIEW = 'year',
    MONTH_VIEW = 'month',
    DAY_VIEW = 'day'
}

// Define globally available functions
declare global {
    interface Window {
        forceApplyDateFilter: (date: Date) => void;
    }
}

export class DateNavigatorModal extends Modal {
    private dateNavigator: DateNavigator | null = null;
    private integration: DateNavigatorIntegration | null = null;
    private state: DreamMetricsState;
    private timeFilterManager: TimeFilterManager;
    private currentViewMode: NavigatorViewMode = NavigatorViewMode.DAY_VIEW;
    private selectedYear: number;
    private selectedMonth: number;
    private selectedDay: number | null = null;
    private selectedDate: Date | null = null;
    private breadcrumbContainer: HTMLElement | null = null;
    private viewContainer: HTMLElement | null = null;
    private yearViewContainer: HTMLElement | null = null;
    private monthViewContainer: HTMLElement | null = null;
    private dayViewContainer: HTMLElement | null = null;
    
    // Static reference to the active modal instance
    public static activeModal: DateNavigatorModal | null = null;

    constructor(app: App, state: DreamMetricsState, timeFilterManager: TimeFilterManager) {
        super(app);
        this.state = state;
        this.timeFilterManager = timeFilterManager;
        
        // Initialize with current date
        const today = new Date();
        this.selectedYear = today.getFullYear();
        this.selectedMonth = today.getMonth();
        
        // Set this as the active instance
        DateNavigatorModal.activeModal = this;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('oom-date-navigator-modal');
        
        // Create title element
        const titleEl = contentEl.createEl('h2', { cls: 'oom-modal-title' });
        titleEl.setText('Date Navigator');
        
        // Create breadcrumb navigation
        this.breadcrumbContainer = contentEl.createDiv({ cls: 'oom-breadcrumb-container' });
        this.updateBreadcrumbs();
        
        // Create view container for different hierarchical views
        this.viewContainer = contentEl.createDiv({ cls: 'oom-view-container' });
        
        // Initialize year view container
        this.yearViewContainer = this.viewContainer.createDiv({ 
            cls: 'oom-year-view-container oom-view-transition' 
        });
        if (this.currentViewMode !== NavigatorViewMode.YEAR_VIEW) {
            this.yearViewContainer.style.display = 'none';
        }
        
        // Initialize month view container
        this.monthViewContainer = this.viewContainer.createDiv({ 
            cls: 'oom-month-view-container oom-view-transition' 
        });
        if (this.currentViewMode !== NavigatorViewMode.MONTH_VIEW) {
            this.monthViewContainer.style.display = 'none';
        }
        
        // Initialize day view container (calendar)
        this.dayViewContainer = this.viewContainer.createDiv();
        if (this.currentViewMode !== NavigatorViewMode.DAY_VIEW) {
            this.dayViewContainer.style.display = 'none';
        }
        
        // Initialize the date navigator in the day view container
        this.dateNavigator = new DateNavigator(this.dayViewContainer, this.state);
        
        // Connect DateNavigatorIntegration with the state and time filter manager
        this.integration = new DateNavigatorIntegration(
            this.app,
            this.state,
            this.timeFilterManager
        );
        
        // Initialize the integration with our container
        if (this.integration && this.dayViewContainer) {
            // Pass the container, not the dateNavigator
            this.integration.initialize(this.dayViewContainer);
        }
        
        // Set up event handlers for date selection
        if (this.dateNavigator) {
            // Directly hook into the DateNavigator's selectDay method
            const origSelectDay = this.dateNavigator.selectDay;
            this.dateNavigator.selectDay = (date: Date) => {
                // Call the original method
                origSelectDay.call(this.dateNavigator, date);
                
                // Update our modal's state
                this.selectedDate = new Date(date);
                this.selectedDay = date.getDate();
                this.selectedMonth = date.getMonth();
                this.selectedYear = date.getFullYear();
                this.updateBreadcrumbs();
                console.log('Date selected via override:', this.selectedDate); // Debug log
            };
            
            // Also keep the event listener as a backup
            document.addEventListener('oom:date-selected', this.handleDateSelection);
        }
        
        // Button container at bottom of modal
        const buttonContainer = contentEl.createDiv({ cls: 'oom-modal-button-container' });
        
        // Today button
        const todayButton = buttonContainer.createEl('button', {
            cls: 'oom-modal-btn oom-today-button',
            text: 'Today'
        });
        
        todayButton.addEventListener('click', () => {
            this.navigateToToday();
            new Notice('Navigated to today');
        });
        
        // Apply button
        const applyButton = buttonContainer.createEl('button', {
            cls: 'oom-modal-btn oom-apply-button',
            text: 'Apply Filter'
        });
        
        applyButton.addEventListener('click', () => {
            console.log('Apply button clicked, selectedDate:', this.selectedDate); // Debug log
            
            if (this.selectedDate) {
                // Use the global forceApplyDateFilter function if available
                if (window.forceApplyDateFilter) {
                    window.forceApplyDateFilter(this.selectedDate);
                    this.close();
                    new Notice(`Applied filter for ${this.selectedDate.toDateString()}`);
                } else {
                    new Notice('Date filtering function not available');
                }
            } else {
                // If no date is explicitly selected, try to get the currently highlighted day
                const highlightedDay = this.dateNavigator?.getSelectedDay();
                if (highlightedDay) {
                    this.selectedDate = new Date(highlightedDay);
                    if (window.forceApplyDateFilter) {
                        window.forceApplyDateFilter(this.selectedDate);
                        this.close();
                        new Notice(`Applied filter for ${this.selectedDate.toDateString()}`);
                    }
                } else {
                    new Notice('Please select a date first');
                }
            }
        });
        
        // Initialize the current view
        this.setViewMode(this.currentViewMode);
    }
    
    navigateToToday() {
        const today = new Date();
        this.navigateToMonth(today);
        this.selectDay(today);
        
        if (this.currentViewMode === NavigatorViewMode.YEAR_VIEW) {
            this.selectedYear = today.getFullYear();
            this.renderYearView();
        } else if (this.currentViewMode === NavigatorViewMode.MONTH_VIEW) {
            this.selectedYear = today.getFullYear();
            this.selectedMonth = today.getMonth();
            this.renderMonthView();
        }
    }
    
    navigateToMonth(date: Date) {
        if (this.dateNavigator) {
            this.dateNavigator.navigateToMonth(date);
        }
    }
    
    selectDay(date: Date) {
        if (this.dateNavigator) {
            this.dateNavigator.selectDay(date);
            this.selectedDate = new Date(date); // Create a new Date object to avoid reference issues
            this.selectedDay = date.getDate();
            this.selectedMonth = date.getMonth();
            this.selectedYear = date.getFullYear();
            this.updateBreadcrumbs();
            console.log('Date selected:', this.selectedDate); // Debug log
        }
    }
    
    // Set the current view mode and update UI
    setViewMode(mode: NavigatorViewMode) {
        this.currentViewMode = mode;
        
        // Update visibility of view containers
        if (this.yearViewContainer) {
            this.yearViewContainer.style.display = 
                mode === NavigatorViewMode.YEAR_VIEW ? 'block' : 'none';
        }
        
        if (this.monthViewContainer) {
            this.monthViewContainer.style.display = 
                mode === NavigatorViewMode.MONTH_VIEW ? 'block' : 'none';
        }
        
        if (this.dayViewContainer) {
            this.dayViewContainer.style.display = 
                mode === NavigatorViewMode.DAY_VIEW ? 'block' : 'none';
        }
        
        // Render the appropriate view
        switch (mode) {
            case NavigatorViewMode.YEAR_VIEW:
                this.renderYearView();
                break;
            case NavigatorViewMode.MONTH_VIEW:
                this.renderMonthView();
                break;
            case NavigatorViewMode.DAY_VIEW:
                // Day view is already handled by DateNavigator
                break;
        }
        
        this.updateBreadcrumbs();
    }
    
    // Render the year selection view
    private renderYearView() {
        if (!this.yearViewContainer) return;
        
        this.yearViewContainer.empty();
        
        // Create title
        const titleEl = this.yearViewContainer.createEl('h3', { 
            cls: 'oom-view-title',
            text: 'Select Year'
        });
        
        // Create years grid
        const yearsGrid = this.yearViewContainer.createDiv({ cls: 'oom-years-grid' });
        
        // Get the current year and show a range around it
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 5;
        const endYear = currentYear + 5;
        
        for (let year = startYear; year <= endYear; year++) {
            const yearCell = yearsGrid.createDiv({ cls: 'oom-year-cell' });
            
            // Add classes for current year and selected year
            if (year === currentYear) {
                yearCell.addClass('is-current');
            }
            if (year === this.selectedYear) {
                yearCell.addClass('is-selected');
            }
            
            // Add year number
            const yearNumber = yearCell.createDiv({ 
                cls: 'oom-year-number',
                text: year.toString()
            });
            
            // Add indicator for years with entries
            const yearIndicator = yearCell.createDiv({ cls: 'oom-year-indicator' });
            
            // TODO: Add actual data-driven indicator for years with entries
            const hasEntries = Math.random() > 0.3; // Placeholder for demo
            if (hasEntries) {
                yearCell.addClass('has-entries');
            }
            
            // Add click handler
            yearCell.addEventListener('click', () => {
                this.selectedYear = year;
                this.setViewMode(NavigatorViewMode.MONTH_VIEW);
            });
        }
    }
    
    // Render the month selection view for the selected year
    private renderMonthView() {
        if (!this.monthViewContainer) return;
        
        this.monthViewContainer.empty();
        
        // Create title
        const titleEl = this.monthViewContainer.createEl('h3', { 
            cls: 'oom-view-title',
            text: `${this.selectedYear} - Select Month` 
        });
        
        // Create months grid
        const monthsGrid = this.monthViewContainer.createDiv({ cls: 'oom-months-grid' });
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const currentDate = new Date();
        const isCurrentYear = this.selectedYear === currentDate.getFullYear();
        
        for (let month = 0; month < 12; month++) {
            const monthCell = monthsGrid.createDiv({ cls: 'oom-month-cell' });
            
            // Add class for current month
            if (isCurrentYear && month === currentDate.getMonth()) {
                monthCell.addClass('is-current');
            }
            
            // Add month name
            const monthName = monthCell.createDiv({ 
                cls: 'oom-month-name',
                text: monthNames[month]
            });
            
            // Add density indicator
            const monthDensity = monthCell.createDiv({ cls: 'oom-month-density' });
            
            // TODO: Add actual data-driven density indicator
            // For demo, show random density
            const density = Math.floor(Math.random() * 4); // 0-3
            monthDensity.setAttribute('data-density', density.toString());
            
            const hasEntries = density > 0;
            if (hasEntries) {
                monthCell.addClass('has-entries');
            }
            
            // Add click handler
            monthCell.addEventListener('click', () => {
                this.selectedMonth = month;
                const date = new Date(this.selectedYear, month, 1);
                this.navigateToMonth(date);
                this.setViewMode(NavigatorViewMode.DAY_VIEW);
            });
        }
    }
    
    // Update breadcrumb navigation based on current view
    private updateBreadcrumbs() {
        if (!this.breadcrumbContainer) return;
        
        this.breadcrumbContainer.empty();
        
        // Create the year breadcrumb
        const yearBreadcrumb = this.breadcrumbContainer.createSpan({ 
            cls: 'oom-breadcrumb',
            text: this.selectedYear.toString()
        });
        
        yearBreadcrumb.addEventListener('click', () => {
            this.setViewMode(NavigatorViewMode.YEAR_VIEW);
        });
        
        // For month and day views, add month breadcrumb
        if (this.currentViewMode === NavigatorViewMode.MONTH_VIEW || 
            this.currentViewMode === NavigatorViewMode.DAY_VIEW) {
            
            // Add separator
            this.breadcrumbContainer.createSpan({ 
                cls: 'oom-breadcrumb-separator',
                text: ' > '
            });
            
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            const monthBreadcrumb = this.breadcrumbContainer.createSpan({ 
                cls: 'oom-breadcrumb',
                text: monthNames[this.selectedMonth]
            });
            
            monthBreadcrumb.addEventListener('click', () => {
                this.setViewMode(NavigatorViewMode.MONTH_VIEW);
            });
        }
        
        // For day view with a selected day, add day breadcrumb
        if (this.currentViewMode === NavigatorViewMode.DAY_VIEW && this.selectedDay) {
            // Add separator
            this.breadcrumbContainer.createSpan({ 
                cls: 'oom-breadcrumb-separator',
                text: ' > '
            });
            
            const dayBreadcrumb = this.breadcrumbContainer.createSpan({ 
                cls: 'oom-breadcrumb oom-breadcrumb-current',
                text: this.selectedDay.toString()
            });
        }
    }

    onClose() {
        // Clear the static reference
        DateNavigatorModal.activeModal = null;
        
        // Remove event listener
        document.removeEventListener('oom:date-selected', this.handleDateSelection);
        
        // Clean up integration
        if (this.integration) {
            this.integration.destroy();
            this.integration = null;
        }
        
        // Clear content
        this.contentEl.empty();
    }
    
    // Handle date selection event
    private handleDateSelection = (e: CustomEvent) => {
        if (e.detail && e.detail.date) {
            this.selectDay(e.detail.date);
        }
    }
} 