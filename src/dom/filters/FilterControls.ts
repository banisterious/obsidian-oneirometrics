/**
 * FilterControls
 * 
 * Handles the creation and management of filter UI controls for dream metrics tables.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Notice } from 'obsidian';
import { DreamMetricsSettings } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import { parseDate } from '../../utils/date-utils';
import { FilterUI } from './FilterUI';
import { DateRangeService } from './date-range/DateRangeService';

// Constants for filter control IDs and classes
const FILTER_DROPDOWN_ID = 'oom-date-range-filter';
const CUSTOM_RANGE_BUTTON_ID = 'oom-custom-range-btn';
const FILTER_DISPLAY_ID = 'oom-time-filter-display';
const FILTER_CONTROLS_CLASS = 'oom-filter-controls';

/**
 * Interface for filter options used in dropdown
 */
interface FilterOption {
    value: string;
    label: string;
}

/**
 * Class to handle building and managing filter UI controls
 */
export class FilterControls {
    private filterUI: FilterUI;
    private dateRangeService: DateRangeService;
    private container: HTMLElement | null = null;
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private saveSettings: () => Promise<void>,
        private logger?: ILogger,
        private scrapeMetrics?: () => Promise<void>,
        private showDateNavigator?: () => void
    ) {
        this.filterUI = new FilterUI(app, settings, saveSettings, logger);
        this.dateRangeService = new DateRangeService(app);
    }
    
    /**
     * Set the container element for filter controls
     * 
     * @param container - The container element
     */
    public setContainer(container: HTMLElement): void {
        this.container = container;
        this.filterUI.setContainer(container);
        this.logger?.debug('UI', 'Container set for FilterControls');
    }
    
    /**
     * Build filter controls and add them to the container
     * 
     * @param containerEl - The container element to add controls to
     * @returns The created filter controls container
     */
    public buildFilterControls(containerEl: HTMLElement): HTMLElement {
        this.logger?.debug('UI', 'Building filter controls');
        
        // Create filter controls container
        const filterControls = document.createElement('div');
        filterControls.className = FILTER_CONTROLS_CLASS;
        
        // Create filter display element
        const filterDisplay = document.createElement('div');
        filterDisplay.id = FILTER_DISPLAY_ID;
        filterDisplay.className = 'oom-filter-display';
        filterDisplay.innerHTML = `
            <span class="oom-filter-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-calendar-range">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M16 2v4"/>
                    <path d="M8 2v4"/>
                    <path d="M3 10h18"/>
                    <path d="M17 14h-6"/>
                    <path d="M13 18H7"/>
                </svg>
            </span>
            <span class="oom-filter-text">All Time</span>
        `;
        filterDisplay.setAttribute('title', 'Current time filter');
        filterControls.appendChild(filterDisplay);
        
        // Create filter dropdown
        const filterDropdownContainer = document.createElement('div');
        filterDropdownContainer.className = 'oom-filter-dropdown-container';
        
        // Create dropdown label
        const filterLabel = document.createElement('label');
        filterLabel.htmlFor = FILTER_DROPDOWN_ID;
        filterLabel.className = 'oom-filter-label';
        filterLabel.textContent = 'Filter by date:';
        filterDropdownContainer.appendChild(filterLabel);
        
        // Create dropdown select element
        const filterDropdown = document.createElement('select');
        filterDropdown.id = FILTER_DROPDOWN_ID;
        filterDropdown.className = 'oom-select';
        
        // Define filter options
        const filterOptions: FilterOption[] = [
            { value: 'all', label: 'All Time' },
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'thisWeek', label: 'This Week' },
            { value: 'thisMonth', label: 'This Month' },
            { value: 'last30', label: 'Last 30 Days' },
            { value: 'last6months', label: 'Last 6 Months' },
            { value: 'thisYear', label: 'This Year' },
            { value: 'last12months', label: 'Last 12 Months' }
        ];
        
        // Add option for custom date range if it's the currently selected filter
        if (this.settings.lastAppliedFilter === 'custom') {
            filterOptions.push({ value: 'custom', label: 'Custom Date' });
        }
        
        // Add options to dropdown
        filterOptions.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            filterDropdown.appendChild(optionEl);
        });
        
        // Set the selected value based on settings
        if (this.settings.lastAppliedFilter) {
            filterDropdown.value = this.settings.lastAppliedFilter;
        }
        
        // Add change event listener
        filterDropdown.addEventListener('change', () => {
            this.logger?.debug('UI', 'Filter dropdown changed', { value: filterDropdown.value });
            
            // Clear any custom date range when using dropdown (unless it's the custom option)
            if (filterDropdown.value !== 'custom') {
                this.filterUI.setCustomDateRange(null);
            }
            
            // Reset any active state on custom range button
            const customRangeBtn = document.getElementById(CUSTOM_RANGE_BUTTON_ID);
            if (customRangeBtn) {
                customRangeBtn.classList.remove('active');
            }
            
            // Apply the filter with a slight delay to avoid UI jank
            setTimeout(() => {
                const container = this.container || containerEl;
                this.filterUI.applyFilters(container);
            }, 50);
        });
        
        filterDropdownContainer.appendChild(filterDropdown);
        filterControls.appendChild(filterDropdownContainer);
        
        // Add Date Navigator button
        const dateNavigatorBtn = document.createElement('button');
        dateNavigatorBtn.id = 'oom-date-navigator-button';
        dateNavigatorBtn.className = 'oom-button mod-cta oom-date-navigator-button';
        dateNavigatorBtn.textContent = 'Date Navigator';
        dateNavigatorBtn.setAttribute('title', 'Open date navigation and selection interface');
        
        // Add event listener for date navigator button
        dateNavigatorBtn.addEventListener('click', () => {
            this.logger?.debug('UI', 'Date Navigator button clicked from FilterControls');
            new Notice('Opening date navigator...');
            if (this.showDateNavigator) {
                this.showDateNavigator();
            } else {
                this.logger?.warn('FilterControls', 'Date navigator function not provided');
                new Notice('Date navigator function not available');
            }
        });
        
        filterControls.appendChild(dateNavigatorBtn);
        
        // Add Rescrape Metrics button
        const rescrapeBtn = document.createElement('button');
        rescrapeBtn.id = 'oom-rescrape-button';
        rescrapeBtn.className = 'oom-button mod-cta oom-rescrape-button';
        rescrapeBtn.textContent = 'Rescrape Metrics';
        rescrapeBtn.setAttribute('title', 'Rescan dream journal entries and update metrics');
        
        // Add event listener for rescrape button
        rescrapeBtn.addEventListener('click', () => {
            this.logger?.debug('UI', 'Rescrape button clicked from FilterControls');
            new Notice('Rescraping metrics...');
            if (this.scrapeMetrics) {
                this.scrapeMetrics();
            } else {
                this.logger?.warn('FilterControls', 'Rescrape function not provided');
                new Notice('Rescrape function not available');
            }
        });
        
        filterControls.appendChild(rescrapeBtn);
        
        // Add any additional controls for debugging if enabled
        if (this.settings.logging?.level === 'debug' || this.settings.logging?.level === 'trace') {
            this.addDebugControls(filterControls);
        }
        
        // Add the filter controls to the container
        containerEl.appendChild(filterControls);
        
        // Initialize filters based on saved settings
        this.initializeFilters(containerEl);
        
        return filterControls;
    }
    
    /**
     * Initialize filters based on saved settings
     * 
     * @param containerEl - The container element
     */
    private initializeFilters(containerEl: HTMLElement): void {
        this.logger?.debug('Filter', 'Initializing filters from settings');
        
        // Check for custom date range in settings
        if (this.settings.customDateRange) {
            this.filterUI.setCustomDateRange(this.settings.customDateRange);
        }
        
        // Apply saved filter if available
        if (this.settings.lastAppliedFilter) {
            const filterDropdown = containerEl.querySelector(`#${FILTER_DROPDOWN_ID}`) as HTMLSelectElement;
            if (filterDropdown) {
                this.filterUI.applyFilterToDropdown(filterDropdown, containerEl);
            }
        }
    }
    
    /**
     * Add debug controls to the filter controls
     * 
     * @param filterControls - The filter controls container
     */
    private addDebugControls(filterControls: HTMLElement): void {
        // Add debug button to manually attach listeners
        const debugBtn = document.createElement('button');
        debugBtn.className = 'oom-button oom-debug-attach-listeners';
        debugBtn.innerHTML = '<span class="oom-button-text">Debug: Attach Listeners</span>';
        debugBtn.style.backgroundColor = 'var(--color-yellow)';
        debugBtn.style.color = 'black';
        debugBtn.style.marginLeft = '8px';
        debugBtn.addEventListener('click', () => {
            new Notice('Manually attaching filter listeners...');
            this.initializeFilters(this.container || filterControls.parentElement || document.body);
        });
        filterControls.appendChild(debugBtn);
        
        // Add debug expand all button
        const expandAllDebugBtn = document.createElement('button');
        expandAllDebugBtn.className = 'oom-button oom-debug-expand-all';
        expandAllDebugBtn.innerHTML = '<span class="oom-button-text">Debug: Expand All Content</span>';
        expandAllDebugBtn.style.backgroundColor = 'var(--color-red)';
        expandAllDebugBtn.style.color = 'white';
        expandAllDebugBtn.style.marginLeft = '8px';
        expandAllDebugBtn.addEventListener('click', () => {
            new Notice('Expanding all content sections for debugging...');
            const container = this.container || filterControls.parentElement || document.body;
            if (window.expandAllContentSections) {
                window.expandAllContentSections(container);
            } else {
                new Notice('expandAllContentSections function not found');
            }
        });
        filterControls.appendChild(expandAllDebugBtn);
    }
}

// Add type declaration for window object extension
declare global {
    interface Window {
        expandAllContentSections?: (container: HTMLElement) => void;
    }
} 