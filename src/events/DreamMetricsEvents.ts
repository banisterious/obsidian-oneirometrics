import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricsDOM } from '../dom/DreamMetricsDOM';
import { DreamMetricData } from '../types/core';
import { App, Notice } from 'obsidian';
import { withErrorHandling, isNonEmptyString } from '../utils/defensive-utils';
import safeLogger from '../logging/safe-logger';
import { EventManager } from './EventManager';
import { DreamMetricsSettings } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';

// Import the global logger from main.ts - will be initialized when plugin loads
declare const globalLogger: any;

/**
 * Manages event handling for the DreamMetrics UI with defensive coding patterns
 */
export class DreamMetricsEvents {
    private state: DreamMetricsState;
    private dom: DreamMetricsDOM;
    private isAttaching: boolean = false;
    private debounceTimeout: number | null = null;
    private _delegatedExpandHandler: ((event: Event) => void) | null = null;
    private app: App | undefined;
    private cleanupFunctions: Array<() => void> = [];
    private eventManager: EventManager;
    private mutationObserver: MutationObserver | null = null;

    /**
     * Creates a new DreamMetricsEvents instance
     * 
     * @param state The state manager
     * @param dom The DOM manager
     * @param app The Obsidian app instance (optional)
     */
    constructor(state: DreamMetricsState, dom: DreamMetricsDOM, app?: App) {
        this.state = state;
        this.dom = dom;
        this.app = app;
        this.eventManager = EventManager.getInstance();
    }

    /**
     * Attaches all event listeners with robust error handling
     */
    attachEventListeners = withErrorHandling(
        (): void => {
            try {
                safeLogger.debug('Events', 'attachEventListeners called');
                
                // Find all dropdown elements
                const allDropdowns = document.querySelectorAll('#oom-date-range-filter');
                safeLogger.debug('Events', 'Number of oom-date-range-filter elements in DOM', {
                    count: allDropdowns.length
                });
                
                // Prevent multiple simultaneous attachments
                if (this.isAttaching) {
                    safeLogger.debug('Events', 'Event attachment already in progress, skipping');
                    return;
                }
                
                this.isAttaching = true;
                
                try {
                    // First clean up any existing listeners to prevent duplicates
                    this.cleanup();
                    
                    // Attach all listeners with error handling for each section
                    this.safelyAttachExpandDelegationListener();
                    this.safelyAttachFilterListeners();
                    this.safelyAttachKeyboardListeners();
                    this.safelySetupMutationObserver();
                    
                    safeLogger.debug('Events', 'All event listeners attached successfully');
                } finally {
                    this.isAttaching = false;
                }
            } catch (error) {
                safeLogger.error('Events', 'Error attaching event listeners', error);
                // Try to clean up any partially attached listeners
                this.cleanup();
                throw error;
            }
        },
        {
            fallbackValue: undefined,
            errorMessage: "Failed to attach event listeners",
            onError: (error) => safeLogger.error('Events', 'Critical error in attachEventListeners', error)
        }
    );

    /**
     * Safely attaches the expand delegation listener with error handling
     */
    private safelyAttachExpandDelegationListener(): void {
        try {
            const container = document.querySelector('.oom-table-container');
            if (!container) {
                safeLogger.debug('Events', 'No .oom-table-container found, skipping expand listener');
                return;
            }
            
            // Remove any existing handler to prevent duplicates
            if (this._delegatedExpandHandler) {
                container.removeEventListener('click', this._delegatedExpandHandler as any);
                this._delegatedExpandHandler = null;
            }
            
            // Create a new handler with error boundary
            this._delegatedExpandHandler = (event: Event) => {
                try {
                    const target = event.target as HTMLElement;
                    if (!target) return;
                    
                    const button = target.closest('.oom-button--expand') as HTMLElement;
                    if (!button || !container.contains(button)) return;
                    
                    event.preventDefault();
                    this.safelyHandleExpandButtonClick(button);
                } catch (error) {
                    safeLogger.error('Events', 'Error in expand button click handler', error);
                }
            };
            
            // Attach the handler
            container.addEventListener('click', this._delegatedExpandHandler);
            
            // Add cleanup function
            this.cleanupFunctions.push(() => {
                if (container && this._delegatedExpandHandler) {
                    container.removeEventListener('click', this._delegatedExpandHandler as any);
                    this._delegatedExpandHandler = null;
                }
            });
            
            safeLogger.debug('Events', 'Expand delegation listener attached');
        } catch (error) {
            safeLogger.error('Events', 'Error attaching expand delegation listener', error);
        }
    }

    /**
     * Safely handles expand button clicks with error handling
     */
    private safelyHandleExpandButtonClick = withErrorHandling(
        (button: HTMLElement): void => {
            if (!button) {
                safeLogger.warn('Events', 'No button provided to handleExpandButtonClick');
                return;
            }
            
            const contentId = button.getAttribute('data-content-id');
            if (!contentId) {
                safeLogger.warn('Events', 'Button missing data-content-id attribute');
                return;
            }
            
            const isExpanded = button.getAttribute('data-expanded') === 'true';
            const newState = !isExpanded;
            
            // Update state
            this.state.toggleExpandedState(contentId, newState);
            
            // Update DOM
            this.dom.updateContentVisibility(contentId, newState);
            
            safeLogger.debug('Events', `Toggled expansion state for ${contentId} to ${newState}`);
        },
        {
            fallbackValue: undefined,
            errorMessage: "Failed to handle expand button click",
            onError: (error) => safeLogger.error('Events', 'Error in handleExpandButtonClick', error)
        }
    );

    /**
     * Safely attaches filter listeners with error handling
     */
    private safelyAttachFilterListeners(): void {
        try {
            // Date range filter
            const dateRangeFilter = document.getElementById('oom-date-range-filter');
            safeLogger.debug('Events', 'attachFilterListeners: dateRangeFilter element found', {
                found: !!dateRangeFilter
            });
            
            if (dateRangeFilter) {
                const dateRangeChangeHandler = (e: Event) => {
                    try {
                        const target = e.target as HTMLSelectElement;
                        if (!target) return;
                        
                        safeLogger.debug('Events', 'Dropdown change event fired. Selected value:', {
                            value: target.value
                        });
                        
                        this.safelyHandleDateRangeChange(target.value);
                    } catch (error) {
                        safeLogger.error('Events', 'Error in date range change handler', error);
                    }
                };
                
                dateRangeFilter.addEventListener('change', dateRangeChangeHandler);
                
                // Add cleanup function
                this.cleanupFunctions.push(() => {
                    if (dateRangeFilter) {
                        dateRangeFilter.removeEventListener('change', dateRangeChangeHandler);
                    }
                });
                
                safeLogger.debug('Events', 'Date range filter listener attached');
            }
            
            // Time filter button
            const timeFilterBtn = document.getElementById('oom-time-filter-btn');
            if (timeFilterBtn) {
                const timeFilterClickHandler = () => {
                    try {
                        this.safelyHandleTimeFilterClick();
                    } catch (error) {
                        safeLogger.error('Events', 'Error in time filter click handler', error);
                    }
                };
                
                timeFilterBtn.addEventListener('click', timeFilterClickHandler);
                
                // Add cleanup function
                this.cleanupFunctions.push(() => {
                    if (timeFilterBtn) {
                        timeFilterBtn.removeEventListener('click', timeFilterClickHandler);
                    }
                });
                
                safeLogger.debug('Events', 'Time filter button listener attached');
            }
        } catch (error) {
            safeLogger.error('Events', 'Error attaching filter listeners', error);
        }
    }

    /**
     * Safely handles date range changes with error handling
     */
    private safelyHandleDateRangeChange = withErrorHandling(
        (range: string): void => {
            if (!isNonEmptyString(range)) {
                safeLogger.warn('Events', 'Invalid date range value provided');
                return;
            }
            
            safeLogger.debug('Events', 'handleDateRangeChange called with:', {
                range: range
            });
            
            const previewEl = document.querySelector('.oom-metrics-container') as HTMLElement;
            if (previewEl) {
                this.dom.applyFilters(previewEl);
            } else {
                safeLogger.debug('Events', 'handleDateRangeChange: .oom-metrics-container not found');
            }
        },
        {
            fallbackValue: undefined,
            errorMessage: "Failed to handle date range change",
            onError: (error) => safeLogger.error('Events', 'Error in handleDateRangeChange', error)
        }
    );

    /**
     * Safely attaches keyboard listeners with error handling
     */
    private safelyAttachKeyboardListeners(): void {
        try {
            const keyboardHandler = (e: KeyboardEvent) => {
                try {
                    if (e.key === 'Escape') {
                        this.handleEscapeKey();
                    }
                } catch (error) {
                    safeLogger.error('Events', 'Error in keyboard event handler', error);
                }
            };
            
            document.addEventListener('keydown', keyboardHandler);
            
            // Add cleanup function
            this.cleanupFunctions.push(() => {
                document.removeEventListener('keydown', keyboardHandler);
            });
            
            safeLogger.debug('Events', 'Keyboard listeners attached');
        } catch (error) {
            safeLogger.error('Events', 'Error attaching keyboard listeners', error);
        }
    }
    
    /**
     * Safely sets up the mutation observer with error handling
     */
    private safelySetupMutationObserver(): void {
        try {
            // Clean up any existing observer
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
                this.mutationObserver = null;
            }
            
            // Create a new observer
            this.mutationObserver = new MutationObserver((mutations) => {
                try {
                    // Look for new elements that might need event listeners
                    const shouldReattach = mutations.some(mutation => {
                        return mutation.type === 'childList' && 
                               Array.from(mutation.addedNodes).some(node => {
                                   if (node instanceof HTMLElement) {
                                       return node.querySelector('#oom-date-range-filter') || 
                                              node.querySelector('#oom-time-filter-btn') ||
                                              node.querySelector('.oom-table-container');
                                   }
                                   return false;
                               });
                    });
                    
                    if (shouldReattach) {
                        // Use debouncing to prevent multiple rapid reattachments
                        if (this.debounceTimeout) {
                            clearTimeout(this.debounceTimeout);
                        }
                        
                        this.debounceTimeout = setTimeout(() => {
                            safeLogger.debug('Events', 'DOM mutation detected, reattaching event listeners');
                            this.attachEventListeners();
                            this.debounceTimeout = null;
                        }, 500) as unknown as number;
                    }
                } catch (error) {
                    safeLogger.error('Events', 'Error in mutation observer callback', error);
                }
            });
            
            // Start observing
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Add cleanup function
            this.cleanupFunctions.push(() => {
                if (this.mutationObserver) {
                    this.mutationObserver.disconnect();
                    this.mutationObserver = null;
                }
            });
            
            safeLogger.debug('Events', 'Mutation observer setup complete');
        } catch (error) {
            safeLogger.error('Events', 'Error setting up mutation observer', error);
        }
    }
    
    /**
     * Safely handles time filter clicks with error handling
     */
    private safelyHandleTimeFilterClick = withErrorHandling(
        (): void => {
            safeLogger.debug('Events', 'Time filter button clicked, opening custom date range modal');
            
            // If app wasn't provided in constructor, try to get it from window
            const app = this.app || (window as any).app;
            
            if (!app) {
                safeLogger.error('Events', 'Cannot open time filter dialog: app instance not available');
                return;
            }
            
            // Load saved favorite ranges from localStorage
            const loadFavoriteRanges = (): Record<string, { start: string, end: string }> => {
                try {
                    const data = localStorage.getItem('oneirometrics-saved-custom-ranges');
                    if (!data) return {};
                    return JSON.parse(data);
                } catch (error) {
                    safeLogger.error('Events', 'Error loading favorite ranges', error);
                    return {};
                }
            };
            
            // Save a favorite range
            const saveFavoriteRange = (name: string, range: { start: string, end: string }) => {
                try {
                    if (!isNonEmptyString(name)) {
                        safeLogger.warn('Events', 'Invalid name for favorite range');
                        return;
                    }
                    
                    const saved = loadFavoriteRanges();
                    saved[name] = range;
                    localStorage.setItem('oneirometrics-saved-custom-ranges', JSON.stringify(saved));
                    safeLogger.debug('Events', `Saved favorite range: ${name}`, range);
                } catch (error) {
                    safeLogger.error('Events', 'Error saving favorite range', error);
                }
            };
            
            // Delete a favorite range
            const deleteFavoriteRange = (name: string) => {
                try {
                    if (!isNonEmptyString(name)) {
                        safeLogger.warn('Events', 'Invalid name for favorite range deletion');
                        return;
                    }
                    
                    const saved = loadFavoriteRanges();
                    delete saved[name];
                    localStorage.setItem('oneirometrics-saved-custom-ranges', JSON.stringify(saved));
                    safeLogger.debug('Events', `Deleted favorite range: ${name}`);
                } catch (error) {
                    safeLogger.error('Events', 'Error deleting favorite range', error);
                }
            };

            try {
                // Show notice that custom date range has been moved to Date Navigator
                new Notice('Custom date range selection has been moved to the Date Navigator. Please use the "Date Navigator" button instead.');
            } catch (error) {
                safeLogger.error('Events', 'Error showing notice', error);
                throw error;
            }
        },
        {
            fallbackValue: undefined,
            errorMessage: "Failed to handle time filter click",
            onError: (error) => safeLogger.error('Events', 'Error in handleTimeFilterClick', error)
        }
    );

    /**
     * Handles escape key press with error handling
     */
    private handleEscapeKey = withErrorHandling(
        (): void => {
            try {
                // Get any open modal or flyout
                const openModal = document.querySelector('.modal.active');
                const openFlyout = document.querySelector('.oom-flyout.active');
                
                // Close modal if open
                if (openModal && openModal instanceof HTMLElement) {
                    safeLogger.debug('Events', 'Escape key pressed, closing active modal');
                    
                    // Try to find and click close button
                    const closeBtn = openModal.querySelector('.modal-close-btn') as HTMLElement;
                    if (closeBtn) {
                        closeBtn.click();
                    } else {
                        // If no close button, try to remove active class
                        openModal.classList.remove('active');
                    }
                    return;
                }
                
                // Close flyout if open
                if (openFlyout && openFlyout instanceof HTMLElement) {
                    safeLogger.debug('Events', 'Escape key pressed, closing active flyout');
                    openFlyout.classList.remove('active');
                    return;
                }
                
                safeLogger.debug('Events', 'Escape key pressed, but no active modal or flyout found');
            } catch (error) {
                safeLogger.error('Events', 'Error handling escape key', error);
            }
        },
        {
            fallbackValue: undefined,
            errorMessage: "Failed to handle escape key",
            onError: (error) => safeLogger.error('Events', 'Error in handleEscapeKey', error)
        }
    );

    /**
     * Cleans up all event listeners and resources
     */
    cleanup(): void {
        safeLogger.debug('Events', 'Cleaning up event listeners');
        
        // Execute all cleanup functions
        this.cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                safeLogger.error('Events', 'Error in cleanup function', error);
            }
        });
        
        // Clear the cleanup functions array
        this.cleanupFunctions = [];
        
        // Clean up mutation observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        
        // Clear any pending debounce
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
        
        safeLogger.debug('Events', 'Event cleanup complete');
    }
} 