import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricsDOM } from '../dom/DreamMetricsDOM';
import { DreamMetricData } from '../types/core';
import { App } from 'obsidian';
import { CustomDateRangeModal } from '../CustomDateRangeModal';

// Import the global logger from main.ts - will be initialized when plugin loads
declare const globalLogger: any;

export class DreamMetricsEvents {
    private state: DreamMetricsState;
    private dom: DreamMetricsDOM;
    private isAttaching: boolean = false;
    private debounceTimeout: number | null = null;
    private _delegatedExpandHandler: ((event: Event) => void) | null = null;
    private app: App | undefined;

    constructor(state: DreamMetricsState, dom: DreamMetricsDOM, app?: App) {
        this.state = state;
        this.dom = dom;
        this.app = app;
    }

    attachEventListeners(): void {
        globalLogger?.debug('Events', 'attachEventListeners called');
        const allDropdowns = document.querySelectorAll('#oom-date-range-filter');
        globalLogger?.debug('Events', 'Number of oom-date-range-filter elements in DOM', {
            count: allDropdowns.length, elements: allDropdowns
        });
        if (this.isAttaching) return;
        this.isAttaching = true;

        try {
            this.attachExpandDelegationListener();
            this.attachFilterListeners();
            this.attachKeyboardListeners();
            this.setupMutationObserver();
        } finally {
            this.isAttaching = false;
        }
    }

    private attachExpandDelegationListener(): void {
        const container = document.querySelector('.oom-table-container');
        if (!container) return;
        container.removeEventListener('click', this._delegatedExpandHandler as any);
        this._delegatedExpandHandler = (event: Event) => {
            const target = event.target as HTMLElement;
            const button = target.closest('.oom-button--expand') as HTMLElement;
            if (!button || !container.contains(button)) return;
            event.preventDefault();
            this.handleExpandButtonClick(button);
        };
        container.addEventListener('click', this._delegatedExpandHandler);
    }

    private handleExpandButtonClick(button: HTMLElement): void {
        const contentId = button.getAttribute('data-content-id');
        if (!contentId) return;

        const isExpanded = button.getAttribute('data-expanded') === 'true';
        const newState = !isExpanded;

        // Update state
        this.state.toggleExpandedState(contentId, newState);
        
        // Update DOM
        this.dom.updateContentVisibility(contentId, newState);
    }

    private attachFilterListeners(): void {
        // Date range filter
        const dateRangeFilter = document.getElementById('oom-date-range-filter');
        globalLogger?.debug('Events', 'attachFilterListeners: dateRangeFilter', {
            element: dateRangeFilter
        });
        if (dateRangeFilter) {
            globalLogger?.debug('Events', 'Attaching change event to oom-date-range-filter');
            dateRangeFilter.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                globalLogger?.debug('Events', 'Dropdown change event fired. Selected value:', {
                    value: target.value
                });
                this.handleDateRangeChange(target.value);
            });
        }

        // Time filter button
        const timeFilterBtn = document.getElementById('oom-time-filter-btn');
        if (timeFilterBtn) {
            timeFilterBtn.addEventListener('click', () => {
                this.handleTimeFilterClick();
            });
        }
    }

    private handleDateRangeChange(range: string): void {
        globalLogger?.debug('Events', 'handleDateRangeChange called with:', {
            range: range
        });
        const previewEl = document.querySelector('.oom-metrics-container') as HTMLElement;
        if (previewEl) {
            this.dom.applyFilters(previewEl);
        } else {
            globalLogger?.debug('Events', 'handleDateRangeChange: .oom-metrics-container not found');
        }
    }

    private handleTimeFilterClick(): void {
        globalLogger?.debug('Events', 'Time filter button clicked, opening custom date range modal');
        
        // If app wasn't provided in constructor, try to get it from window
        const app = this.app || (window as any).app;
        
        if (!app) {
            globalLogger?.error('Events', 'Cannot open time filter dialog: app instance not available');
            return;
        }
        
        // Load saved favorite ranges from localStorage
        const loadFavoriteRanges = (): Record<string, { start: string, end: string }> => {
            const data = localStorage.getItem('oneirometrics-saved-custom-ranges');
            if (!data) return {};
            try {
                return JSON.parse(data);
            } catch {
                return {};
            }
        };
        
        // Save a favorite range
        const saveFavoriteRange = (name: string, range: { start: string, end: string }) => {
            const saved = loadFavoriteRanges();
            saved[name] = range;
            localStorage.setItem('oneirometrics-saved-custom-ranges', JSON.stringify(saved));
            globalLogger?.debug('Events', `Saved favorite range: ${name}`, range);
        };
        
        // Delete a favorite range
        const deleteFavoriteRange = (name: string) => {
            const saved = loadFavoriteRanges();
            delete saved[name];
            localStorage.setItem('oneirometrics-saved-custom-ranges', JSON.stringify(saved));
            globalLogger?.debug('Events', `Deleted favorite range: ${name}`);
        };

        // Open the custom date range modal with the app instance
        const favorites = loadFavoriteRanges();
        new CustomDateRangeModal(
            app, 
            (start: string, end: string, saveName?: string) => {
                if (start && end) {
                    // First, update button state before making any layout changes
                    requestAnimationFrame(() => {
                        const btn = document.getElementById('oom-custom-range-btn');
                        if (btn) btn.classList.add('active');
                    });
                    
                    // Set custom date range in localStorage
                    const newRange = { start, end };
                    const CUSTOM_RANGE_KEY = 'oneirometrics-last-custom-range';
                    localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(newRange));
                    
                    // Save favorite if provided
                    if (saveName) {
                        saveFavoriteRange(saveName, newRange);
                    }
                    
                    // Set dropdown to custom
                    const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
                    if (dropdown) {
                        // Add custom option if it doesn't exist
                        let customOption = dropdown.querySelector('option[value="custom"]') as HTMLOptionElement;
                        if (!customOption) {
                            customOption = document.createElement('option');
                            customOption.value = 'custom';
                            customOption.text = 'Custom Date';
                            dropdown.appendChild(customOption);
                        }
                        dropdown.value = 'custom';
                    }
                    
                    // Apply the filter
                    const previewEl = document.querySelector('.oom-metrics-container') as HTMLElement;
                    if (previewEl) {
                        this.dom.applyCustomDateRangeFilter(previewEl, newRange);
                    }
                    
                    globalLogger?.debug('Events', 'Applied custom date range filter', newRange);
                }
            }, 
            favorites, 
            deleteFavoriteRange
        ).open();
    }

    private attachKeyboardListeners(): void {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    }

    private handleEscapeKey(): void {
        // Close any open dialogs or expanded content
        const expandedButtons = document.querySelectorAll('.oom-button--expand[data-expanded="true"]');
        expandedButtons.forEach(button => {
            const contentId = button.getAttribute('data-content-id');
            if (contentId) {
                this.state.toggleExpandedState(contentId, false);
                this.dom.updateContentVisibility(contentId, false);
            }
        });
    }

    private setupMutationObserver(): void {
        const observer = new MutationObserver((mutations) => {
            // Debounce the reattachment
            if (this.debounceTimeout) {
                window.clearTimeout(this.debounceTimeout);
            }
            
            this.debounceTimeout = window.setTimeout(() => {
                this.attachEventListeners();
            }, 250);
        });

        // Observe the container for changes
        const container = document.querySelector('.oom-table');
        if (container) {
            observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-expanded']
            });
        }
    }

    cleanup(): void {
        if (this.debounceTimeout) {
            window.clearTimeout(this.debounceTimeout);
        }
        const container = document.querySelector('.oom-table-container');
        if (container && this._delegatedExpandHandler) {
            container.removeEventListener('click', this._delegatedExpandHandler);
        }
    }
} 