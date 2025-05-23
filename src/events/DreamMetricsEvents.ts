import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricsDOM } from '../dom/DreamMetricsDOM';
import { DreamMetricData } from '../types';

export class DreamMetricsEvents {
    private state: DreamMetricsState;
    private dom: DreamMetricsDOM;
    private isAttaching: boolean = false;
    private debounceTimeout: number | null = null;
    private _delegatedExpandHandler: ((event: Event) => void) | null = null;
    private _observer: MutationObserver | null = null;

    constructor(state: DreamMetricsState, dom: DreamMetricsDOM) {
        this.state = state;
        this.dom = dom;
    }

    attachEventListeners(): void {
        console.log('[DEBUG] attachEventListeners called');
        const allDropdowns = document.querySelectorAll('#oom-date-range-filter');
        console.log('[DEBUG] Number of oom-date-range-filter elements in DOM:', allDropdowns.length, allDropdowns);
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
        if (!container) {
            console.log('[DEBUG] attachExpandDelegationListener: No .oom-table-container found');
            return;
        }
        
        // Clean up any previous handlers to avoid duplication
        if (this._delegatedExpandHandler) {
            console.log('[DEBUG] Removing previous expand button handler');
            container.removeEventListener('click', this._delegatedExpandHandler);
            this._delegatedExpandHandler = null;
        }
        
        // Create new handler with improved button detection
        this._delegatedExpandHandler = (event: Event) => {
            const target = event.target as HTMLElement;
            
            // Check if the click was on the button or any of its children
            const button = target.closest('.oom-button--expand') as HTMLElement;
            if (!button) {
                return; // Not our button
            }
            
            if (!container.contains(button)) {
                console.log('[DEBUG] Button found but not in container');
                return;
            }
            
            console.log('[DEBUG] Expand button clicked:', button);
            event.preventDefault();
            event.stopPropagation();
            this.handleExpandButtonClick(button);
        };
        
        console.log('[DEBUG] Adding expand button click handler to container');
        container.addEventListener('click', this._delegatedExpandHandler);
        
        // Add direct handlers as a fallback
        const buttons = container.querySelectorAll('.oom-button--expand');
        console.log(`[DEBUG] Found ${buttons.length} expand buttons to attach direct handlers`);
        buttons.forEach((button, index) => {
            // Use data attribute to mark buttons we've processed
            if (!(button as HTMLElement).dataset.handlerAttached) {
                console.log(`[DEBUG] Attaching direct handler to button ${index}`);
                button.addEventListener('click', (e) => {
                    console.log(`[DEBUG] Direct click on button ${index}`);
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleExpandButtonClick(button as HTMLElement);
                });
                (button as HTMLElement).dataset.handlerAttached = 'true';
            }
        });
    }

    private handleExpandButtonClick(button: HTMLElement): void {
        try {
            console.log('[DEBUG] handleExpandButtonClick called with button:', button);
            
            const contentId = button.getAttribute('data-content-id');
            if (!contentId) {
                console.error('[DEBUG] No content-id found on button:', button);
                return;
            }

            const isExpanded = button.getAttribute('data-expanded') === 'true';
            const newState = !isExpanded;
            
            console.log(`[DEBUG] Toggle content ${contentId} from ${isExpanded} to ${newState}`);

            // Update state
            this.state.toggleExpandedState(contentId, newState);
            
            // Update DOM and button state directly
            this.dom.updateContentVisibility(contentId, newState);
            
            // Also directly update the button as a fallback
            button.setAttribute('data-expanded', String(newState));
            button.setAttribute('aria-expanded', String(newState));
            
            // Update button text
            const buttonText = button.querySelector('.oom-button-text');
            if (buttonText) {
                buttonText.textContent = newState ? 'Show less' : 'Show more';
            } else {
                // If no text element, update the button text directly
                button.textContent = newState ? 'Show less' : 'Show more';
            }
            
            // Find and directly manipulate the content elements as fallback
            const contentCell = document.querySelector(`[data-source="${contentId}"]`);
            if (contentCell) {
                const contentWrapper = contentCell.querySelector('.oom-content-wrapper');
                if (contentWrapper) {
                    if (newState) {
                        contentWrapper.classList.add('expanded');
                    } else {
                        contentWrapper.classList.remove('expanded');
                    }
                    
                    // Directly toggle visibility on the preview/full content elements
                    const previewDiv = contentWrapper.querySelector('.oom-content-preview');
                    const fullDiv = contentWrapper.querySelector('.oom-content-full');
                    
                    if (previewDiv && fullDiv) {
                        if (newState) {
                            (previewDiv as HTMLElement).style.display = 'none';
                            (fullDiv as HTMLElement).style.display = 'block';
                        } else {
                            (previewDiv as HTMLElement).style.display = 'block';
                            (fullDiv as HTMLElement).style.display = 'none';
                        }
                    }
                }
            }
            
            console.log(`[DEBUG] Content visibility toggled for ${contentId}`);
        } catch (error) {
            console.error('[DEBUG] Error in handleExpandButtonClick:', error);
        }
    }

    private attachFilterListeners(): void {
        // Date range filter
        const dateRangeFilter = document.getElementById('oom-date-range-filter');
        console.log('[DEBUG] attachFilterListeners: dateRangeFilter', dateRangeFilter);
        if (dateRangeFilter) {
            console.log('[DEBUG] Attaching change event to oom-date-range-filter');
            dateRangeFilter.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                console.log('[DEBUG] Dropdown change event fired. Selected value:', target.value);
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
        console.log('[DEBUG] handleDateRangeChange called with:', range);
        const previewEl = document.querySelector('.oom-metrics-container') as HTMLElement;
        if (previewEl) {
            this.dom.applyFilters(previewEl);
        } else {
            console.log('[DEBUG] handleDateRangeChange: .oom-metrics-container not found');
        }
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
        // Disconnect any existing observer
        if (this._observer) {
            this._observer.disconnect();
        }
        
        const observer = new MutationObserver((mutations) => {
            console.log('[DEBUG] MutationObserver triggered, mutations:', mutations.length);
            
            // Look for relevant changes like button additions or expanded state changes
            const relevantChanges = mutations.some(mutation => {
                // Check for new nodes that are or contain expand buttons
                if (mutation.type === 'childList') {
                    const hasNewButtons = Array.from(mutation.addedNodes).some(node => {
                        if (node instanceof HTMLElement) {
                            return node.classList.contains('oom-button--expand') || 
                                   node.querySelector('.oom-button--expand') !== null;
                        }
                        return false;
                    });
                    
                    if (hasNewButtons) {
                        console.log('[DEBUG] New expand buttons detected in DOM');
                        return true;
                    }
                }
                
                // Check for attribute changes on expand buttons
                if (mutation.type === 'attributes' && 
                    mutation.target instanceof HTMLElement &&
                    (mutation.target.classList.contains('oom-button--expand') ||
                     mutation.target.classList.contains('oom-content-wrapper'))) {
                    console.log('[DEBUG] Expand button attributes changed:', mutation.attributeName);
                    return true;
                }
                
                return false;
            });
            
            if (!relevantChanges) {
                return; // No need to reattach if no relevant changes
            }
            
            // Debounce the reattachment
            if (this.debounceTimeout) {
                window.clearTimeout(this.debounceTimeout);
            }
            
            this.debounceTimeout = window.setTimeout(() => {
                console.log('[DEBUG] Reattaching event listeners after DOM mutations');
                // Focus only on the expand button handlers to avoid disrupting other functionality
                this.attachExpandDelegationListener();
            }, 250);
        });

        // Store observer reference for cleanup
        this._observer = observer;

        // Observe both the metrics container and table for changes
        const metricsContainer = document.querySelector('.oom-metrics-container');
        const tableContainer = document.querySelector('.oom-table-container');
        
        if (metricsContainer) {
            console.log('[DEBUG] Setting up mutation observer on .oom-metrics-container');
            observer.observe(metricsContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-expanded', 'style']
            });
        }
        
        if (tableContainer) {
            console.log('[DEBUG] Setting up mutation observer on .oom-table-container');
            observer.observe(tableContainer, {
                childList: true, 
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-expanded', 'style']
            });
        }
        
        if (!metricsContainer && !tableContainer) {
            console.log('[DEBUG] No container elements found for mutation observer');
        }
    }

    cleanup(): void {
        console.log('[DEBUG] Cleaning up DreamMetricsEvents');
        
        // Clear any pending debounce timeouts
        if (this.debounceTimeout) {
            window.clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
        
        // Remove event listeners
        const container = document.querySelector('.oom-table-container');
        if (container && this._delegatedExpandHandler) {
            console.log('[DEBUG] Removing expand button delegation handler');
            container.removeEventListener('click', this._delegatedExpandHandler);
            this._delegatedExpandHandler = null;
        }
        
        // Also try to remove direct event listeners from buttons
        const buttons = document.querySelectorAll('.oom-button--expand[data-handler-attached="true"]');
        console.log(`[DEBUG] Found ${buttons.length} buttons with direct handlers to clean up`);
        buttons.forEach((button) => {
            (button as HTMLElement).removeAttribute('data-handler-attached');
        });
        
        // Disconnect mutation observer
        if (this._observer) {
            console.log('[DEBUG] Disconnecting mutation observer');
            this._observer.disconnect();
            this._observer = null;
        }
        
        console.log('[DEBUG] DreamMetricsEvents cleanup complete');
    }
} 