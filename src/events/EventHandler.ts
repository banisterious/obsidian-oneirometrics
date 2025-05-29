/**
 * EventHandler
 * 
 * A unified class to handle all DOM event attachments for the plugin.
 * Combines functionality from both ProjectNoteEvents and filter-related events.
 */

import { App, MarkdownView, Notice } from 'obsidian';
import { debug, info, warn, error } from '../logging';
import { ILogger } from '../logging/LoggerTypes';
import { DreamMetricsSettings } from '../types/core';
import { ContentToggler } from '../dom/content';
import { FilterManager } from '../dom/filters/FilterManager';
import { FilterUI } from '../dom/filters/FilterUI';

// For backward compatibility with the global customDateRange variable
declare global {
    var customDateRange: { start: string, end: string } | null;
}

export class EventHandler {
    private container: HTMLElement | null = null;
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private contentToggler: ContentToggler,
        private filterManager: FilterManager,
        private filterUI: FilterUI,
        private scrapeMetrics: () => Promise<void>,
        private showDateNavigator: () => void,
        private saveSettings: () => Promise<void>,
        private logger?: ILogger
    ) {}
    
    /**
     * Set the container element for event operations
     * 
     * @param container - The container element
     */
    public setContainer(container: HTMLElement): void {
        this.container = container;
        this.logger?.debug('UI', 'Container set for EventHandler');
        
        // Also set container for FilterUI
        this.filterUI.setContainer(container);
    }
    
    /**
     * Attach all event listeners to the project note view
     */
    public attachProjectNoteEventListeners(): void {
        this.logger?.debug('UI', 'Attaching metrics note event listeners');
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || view.getMode() !== 'preview') return;
        
        const previewEl = view.previewMode?.containerEl;
        if (!previewEl) {
            this.logger?.warn('UI', 'No preview element found for attaching event listeners');
            return;
        }
        
        // CRITICAL FIX: Robust, failsafe filter application in event listeners
        // Check if filters are already applied before trying again
        if ((window as any).oomFiltersApplied) {
            this.logger?.info('Filter', 'Filters already applied, skipping filter application in event listeners');
        }
        
        // Attach all event listeners
        this.attachButtonEventListeners(previewEl);
        this.attachDebugFunctionality(previewEl);
        this.attachContentToggleEventListeners(previewEl);
        this.attachFilterEventListeners(previewEl);
        this.attachCustomRangeButtonListeners(previewEl);
    }
    
    /**
     * Attach button event listeners
     * 
     * @param previewEl - The preview element containing the buttons
     */
    private attachButtonEventListeners(previewEl: HTMLElement): void {
        // Find the rescrape button with multiple fallbacks
        const rescrapeBtn = this.findButton(
            previewEl,
            'oom-rescrape-button', 
            'oom-rescrape-button', 
            'button.mod-cta:not(.oom-settings-button):not(.oom-date-navigator-button)'
        );
        
        this.attachClickEvent(rescrapeBtn, () => {
            this.logger?.debug('UI', 'Rescrape button clicked');
            new Notice('Rescraping metrics...');
            this.scrapeMetrics();
        }, 'Rescrape button');
        
        // Find the settings button with multiple fallbacks
        const settingsBtn = this.findButton(
            previewEl,
            'oom-settings-button', 
            'oom-settings-button', 
            'button.mod-cta:not(.oom-rescrape-button):not(.oom-date-navigator-button)'
        );
        
        this.attachClickEvent(settingsBtn, () => {
            this.logger?.debug('UI', 'Settings button clicked');
            new Notice('Opening settings...');
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById('oneirometrics');
        }, 'Settings button');
        
        // Find the date navigator button with multiple fallbacks
        const dateNavigatorBtn = this.findButton(
            previewEl,
            'oom-date-navigator-button', 
            'oom-date-navigator-button', 
            'button.mod-cta:not(.oom-rescrape-button):not(.oom-settings-button)'
        );
        
        this.attachClickEvent(dateNavigatorBtn, () => {
            this.logger?.debug('UI', 'Date navigator button clicked');
            new Notice('Opening date navigator...');
            this.showDateNavigator();
        }, 'Date navigator button');
    }
    
    /**
     * Attach debug functionality
     * 
     * @param previewEl - The preview element containing the debug buttons
     */
    private attachDebugFunctionality(previewEl: HTMLElement): void {
        // Add event listeners for debug buttons
        const debugBtn = previewEl.querySelector('.oom-debug-attach-listeners');
        if (debugBtn) {
            // Remove existing listeners
            const newDebugBtn = debugBtn.cloneNode(true);
            newDebugBtn.addEventListener('click', () => {
                new Notice('Manually attaching Show More listeners...');
                this.attachProjectNoteEventListeners();
            });
            debugBtn.parentNode?.replaceChild(newDebugBtn, debugBtn);
        }
        
        // Add debug expand all button in debug mode
        if (this.settings.logging?.level === 'debug' || this.settings.logging?.level === 'trace') {
            const expandAllDebugBtn = previewEl.querySelector('.oom-debug-expand-all');
            if (!expandAllDebugBtn) {
                // Create a new debug button if it doesn't exist
                const debugBtnContainer = previewEl.querySelector('.oom-filter-controls');
                if (debugBtnContainer) {
                    const newDebugBtn = document.createElement('button');
                    newDebugBtn.className = 'oom-button oom-debug-expand-all';
                    newDebugBtn.innerHTML = '<span class="oom-button-text">Debug: Expand All Content</span>';
                    newDebugBtn.style.backgroundColor = 'var(--color-red)';
                    newDebugBtn.style.color = 'white';
                    newDebugBtn.style.marginLeft = '8px';
                    newDebugBtn.addEventListener('click', () => {
                        new Notice('Expanding all content sections for debugging...');
                        this.contentToggler.expandAllContentSections(previewEl);
                    });
                    debugBtnContainer.appendChild(newDebugBtn);
                }
            }
        }
    }
    
    /**
     * Attach event listeners to content toggle buttons
     * 
     * @param previewEl - The preview element containing the buttons
     */
    private attachContentToggleEventListeners(previewEl: HTMLElement): void {
        // Find all show more/less buttons
        const buttons = previewEl.querySelectorAll('.oom-button--expand');
        this.logger?.debug('UI', 'Found show more/less buttons', { count: buttons?.length });
        
        buttons.forEach((button) => {
            // Remove any existing click listeners by replacing the node
            const newButton = button.cloneNode(true) as HTMLElement;
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                this.logger?.debug('UI', 'Show more/less button clicked');
                
                // Use the content toggler to handle visibility
                const contentCellId = newButton.getAttribute('data-content-id');
                if (contentCellId) {
                    this.contentToggler.toggleContentVisibility(newButton);
                } else {
                    this.logger?.warn('UI', 'Button clicked but no content ID found');
                }
            });
            button.parentNode?.replaceChild(newButton, button);
        });
    }
    
    /**
     * Attach filter event listeners
     * 
     * @param previewEl - The preview element containing the filter controls
     */
    private attachFilterEventListeners(previewEl: HTMLElement): void {
        // Find date range filter with multiple attempts
        const dateRangeFilter = this.findDateRangeFilter(previewEl);
        if (dateRangeFilter) {
            this.logger?.debug('UI', 'Found date range filter', { element: dateRangeFilter?.tagName });
            // First remove any existing event listeners by cloning the node
            const newDateRangeFilter = dateRangeFilter.cloneNode(true) as HTMLSelectElement;
            newDateRangeFilter.addEventListener('change', () => {
                this.logger?.debug('UI', 'Date range filter changed', { value: newDateRangeFilter?.value });
                
                // Clear any custom date range when using dropdown
                customDateRange = null;
                
                // Reset any active state on custom range button - do this in a requestAnimationFrame
                // to avoid forced reflow
                const customRangeBtn = document.getElementById('oom-custom-range-btn');
                if (customRangeBtn) {
                    requestAnimationFrame(() => {
                        customRangeBtn.classList.remove('active');
                    });
                }
                
                // Apply the filter in a delayed manner to avoid UI jank
                setTimeout(() => {
                    // Use the FilterManager to apply the filter
                    this.filterManager.applyFilters(previewEl);
                }, 50);
            });
            dateRangeFilter.parentNode?.replaceChild(newDateRangeFilter, dateRangeFilter);
            this.logger?.debug('UI', 'Attached event listener to date range filter');
        } else {
            this.logger?.warn('UI', 'Date range filter not found');
        }
    }
    
    /**
     * Attach custom range button listeners
     * 
     * @param previewEl - The preview element containing the custom range button
     */
    private attachCustomRangeButtonListeners(previewEl: HTMLElement): void {
        // Find custom range button with fallbacks
        const customRangeBtn = this.findButton(
            previewEl,
            'oom-custom-range-btn',
            'oom-custom-range-btn',
            'button.oom-button:not(.oom-debug-expand-all)'
        );
        
        if (customRangeBtn) {
            // Remove existing listeners
            const newCustomRangeBtn = customRangeBtn.cloneNode(true) as HTMLElement;
            newCustomRangeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                this.logger?.debug('UI', 'Custom range button clicked');
                
                // Open the custom range modal
                this.openCustomRangeModal();
            });
            customRangeBtn.parentNode?.replaceChild(newCustomRangeBtn, customRangeBtn);
            this.logger?.debug('UI', 'Attached event listener to custom range button');
        } else {
            this.logger?.warn('UI', 'Custom range button not found');
        }
    }
    
    /**
     * Open the custom date range modal
     */
    private openCustomRangeModal(): void {
        // Delegate to FilterUI to handle the custom range modal
        // This is just a placeholder until we have a proper implementation
        if (typeof (window as any).openCustomRangeModal === 'function') {
            (window as any).openCustomRangeModal(this.app);
        } else {
            this.logger?.error('UI', 'openCustomRangeModal function not found on window object');
            new Notice('Custom date range not available. Please try again later.');
        }
    }
    
    /**
     * Helper function to safely attach click event with console warning for debugging
     * 
     * @param element - The element to attach the event to
     * @param callback - The callback function to execute on click
     * @param elementName - The name of the element for logging
     * @returns true if the event was attached, false otherwise
     */
    private attachClickEvent(element: Element | null, callback: () => void, elementName: string): boolean {
        if (!element) {
            this.logger?.warn('UI', `${elementName} not found`);
            return false;
        }
        
        try {
            // Remove existing listeners by cloning
            const newElement = element.cloneNode(true) as HTMLElement;
            newElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback();
            });
            element.parentNode?.replaceChild(newElement, element);
            this.logger?.debug('UI', `Attached event listener to ${elementName}`);
            return true;
        } catch (error) {
            this.logger?.error('UI', `Error attaching event to ${elementName}`, error as Error);
            return false;
        }
    }
    
    /**
     * Find a button element with multiple fallback strategies
     * 
     * @param previewEl - The preview element to search in
     * @param id - The ID of the button
     * @param className - The class name of the button
     * @param fallbackSelector - A fallback CSS selector
     * @returns The button element, or null if not found
     */
    private findButton(previewEl: HTMLElement, id: string, className: string, fallbackSelector: string): HTMLElement | null {
        // Try by ID first (most specific)
        const buttonById = document.getElementById(id);
        if (buttonById) return buttonById as HTMLElement;
        
        // Try by class in preview element
        const buttonByClass = previewEl.querySelector(`.${className}`);
        if (buttonByClass) return buttonByClass as HTMLElement;
        
        // Try fallback selector as last resort
        const buttonByFallback = previewEl.querySelector(fallbackSelector);
        if (buttonByFallback) return buttonByFallback as HTMLElement;
        
        return null;
    }
    
    /**
     * Find date range filter with multiple attempts
     * 
     * @param previewEl - The preview element to search in
     * @returns The date range filter element, or null if not found
     */
    private findDateRangeFilter(previewEl: HTMLElement): HTMLSelectElement | null {
        // Try by ID first
        const filterById = document.getElementById('oom-date-range-filter');
        if (filterById) return filterById as HTMLSelectElement;
        
        // Try by class in preview element
        const filterByClass = previewEl.querySelector('.oom-select');
        if (filterByClass) return filterByClass as HTMLSelectElement;
        
        // Try more generic selector
        const filterBySelector = previewEl.querySelector('select[id*="date-range"]');
        if (filterBySelector) return filterBySelector as HTMLSelectElement;
        
        return null;
    }
} 