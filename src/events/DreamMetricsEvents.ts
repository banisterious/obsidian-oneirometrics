import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricsDOM } from '../dom/DreamMetricsDOM';
import { DreamMetricData } from '../types';

export class DreamMetricsEvents {
    private state: DreamMetricsState;
    private dom: DreamMetricsDOM;
    private isAttaching: boolean = false;
    private debounceTimeout: number | null = null;

    constructor(state: DreamMetricsState, dom: DreamMetricsDOM) {
        this.state = state;
        this.dom = dom;
    }

    attachEventListeners(): void {
        if (this.isAttaching) return;
        this.isAttaching = true;

        try {
            this.attachExpandButtonListeners();
            this.attachFilterListeners();
            this.attachKeyboardListeners();
            this.setupMutationObserver();
        } finally {
            this.isAttaching = false;
        }
    }

    private attachExpandButtonListeners(): void {
        const buttons = document.querySelectorAll('.oom-button--expand');
        
        buttons.forEach(button => {
            // Remove existing listeners
            const newButton = button.cloneNode(true) as HTMLElement;
            button.parentNode?.replaceChild(newButton, button);
            
            // Add click listener
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleExpandButtonClick(newButton);
            });
            
            // Add keyboard listener
            newButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleExpandButtonClick(newButton);
                }
            });
        });
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
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
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
        // TODO: Implement date range filtering
        console.log('Date range changed:', range);
    }

    private handleTimeFilterClick(): void {
        // TODO: Implement time filter dialog
        console.log('Time filter clicked');
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
        
        // Remove all event listeners
        const buttons = document.querySelectorAll('.oom-button--expand');
        buttons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode?.replaceChild(newButton, button);
        });
    }
} 