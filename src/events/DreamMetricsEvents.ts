import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricsDOM } from '../dom/DreamMetricsDOM';
import { DreamMetricData } from '../types';

export class DreamMetricsEvents {
    private state: DreamMetricsState;
    private dom: DreamMetricsDOM;
    private isAttaching: boolean = false;
    private debounceTimeout: number | null = null;
    private _delegatedExpandHandler: ((event: Event) => void) | null = null;

    constructor(state: DreamMetricsState, dom: DreamMetricsDOM) {
        this.state = state;
        this.dom = dom;
    }

    attachEventListeners(): void {
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
        const container = document.querySelector('.oom-table-container');
        if (container && this._delegatedExpandHandler) {
            container.removeEventListener('click', this._delegatedExpandHandler);
        }
    }
} 