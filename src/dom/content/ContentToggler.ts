/**
 * ContentToggler
 * 
 * Handles the toggling of content visibility in the metrics display.
 * Extracted from main.ts during the refactoring process.
 */

import { Notice } from 'obsidian';
import { ILogger } from '../../logging/LoggerTypes';

export class ContentToggler {
    private container: HTMLElement | null = null;
    private expandedStates: Set<string> = new Set<string>();
    
    constructor(
        private logger?: ILogger
    ) {
        // Initialize expanded states from localStorage
        this.loadExpandedStates();
    }
    
    /**
     * Set the container element for content operations
     * 
     * @param container - The container element
     */
    public setContainer(container: HTMLElement): void {
        this.container = container;
        this.logger?.debug('UI', 'Container set for ContentToggler');
    }
    
    /**
     * Update content visibility state
     * 
     * @param id - The ID of the content to update
     * @param isExpanded - Whether the content should be expanded
     */
    public updateContentVisibility(id: string, isExpanded: boolean): void {
        if (!this.container) {
            this.logger?.warn('UI', 'No container set for content visibility update');
            return;
        }
        
        try {
            const row = this.container.querySelector(`tr[data-source="${id}"]`);
            if (row) {
                const contentWrapper = row.querySelector('.oom-content-wrapper');
                const previewDiv = row.querySelector('.oom-content-preview');
                const fullDiv = row.querySelector('.oom-content-full');
                const expandButton = row.querySelector('.oom-button--expand');

                if (contentWrapper && previewDiv && fullDiv && expandButton) {
                    if (isExpanded) {
                        contentWrapper.classList.add('expanded');
                    } else {
                        contentWrapper.classList.remove('expanded');
                    }
                    expandButton.textContent = isExpanded ? 'Show less' : 'Read more';
                    expandButton.setAttribute('data-expanded', isExpanded.toString());
                    expandButton.setAttribute('aria-expanded', isExpanded.toString());
                    
                    // Update expanded states tracking
                    if (isExpanded) {
                        this.expandedStates.add(id);
                    } else {
                        this.expandedStates.delete(id);
                    }
                    
                    // Save to localStorage
                    this.saveExpandedStates();
                    
                    this.logger?.debug('UI', `Content visibility updated for ${id}`, { isExpanded });
                } else {
                    this.logger?.warn('UI', 'Missing content elements for visibility update', { id });
                }
            } else {
                this.logger?.warn('UI', `Row not found for content ID: ${id}`);
            }
        } catch (error) {
            this.logger?.error('UI', 'Error updating content visibility', error as Error);
        }
    }
    
    /**
     * Toggle content visibility
     * 
     * @param button - The button that triggered the toggle
     */
    public toggleContentVisibility(button: HTMLElement): void {
        this.logger?.debug('UI', 'Toggling content visibility');
        
        try {
            // Get the content cell ID from the button
            const contentCellId = button.getAttribute('data-content-id');
            if (!contentCellId) {
                this.logger?.error('UI', 'No data-content-id attribute on button');
                new Notice('Error: Cannot find content to expand');
                return;
            }
            
            const contentCell = document.getElementById(contentCellId);
            if (!contentCell) {
                this.logger?.error('UI', 'Could not find content cell with ID', { contentCellId });
                new Notice('Error: Content cell not found');
                return;
            }
            
            // Get the current state
            const isExpanded = button.getAttribute('data-expanded') === 'true';
            this.logger?.debug('UI', 'Current expansion state', { isExpanded });
            
            // Get elements - UPDATED selectors to match TableGenerator's HTML structure
            const contentWrapper = button.closest('.oom-content-wrapper');
            const previewContent = contentWrapper?.querySelector('.oom-content-preview');
            const fullContent = document.getElementById(contentCellId);
            
            if (!contentWrapper || !previewContent || !fullContent) {
                this.logger?.error('UI', 'Missing required content elements');
                return;
            }
            
            // Force browser reflow first
            void contentCell.offsetHeight;
            
            // Direct DOM manipulation approach
            if (!isExpanded) {
                this.logger?.debug('UI', 'Expanding content', { contentCellId });
                
                // 1. First update button state
                button.setAttribute('data-expanded', 'true');
                button.setAttribute('aria-expanded', 'true');
                
                // Update button text and icon
                const buttonText = button.querySelector('.oom-button-text');
                if (buttonText) {
                    buttonText.textContent = 'Show less';
                }
                
                // 2. Update content wrapper with CSS class
                contentWrapper.classList.add('expanded');
                
                // 3. Create a transition effect by temporarily setting overflow to hidden
                contentCell.style.overflow = 'hidden';
                
                // 4. Set visibility using CSS classes - use requestAnimationFrame for better performance
                requestAnimationFrame(() => {
                    fullContent.classList.add('oom-content-full--visible');
                    fullContent.classList.remove('oom-content-full--hidden');
                    
                    // 5. Update the table row height to fit the new content
                    const tableRow = contentWrapper.closest('tr');
                    if (tableRow) {
                        (tableRow as HTMLElement).style.height = 'auto';
                        (tableRow as HTMLElement).style.minHeight = 'fit-content';
                    }
                    
                    // 6. Remove overflow constraint after transition
                    setTimeout(() => {
                        contentCell.style.overflow = '';
                    }, 300);
                });
                
                // Add to expanded states
                this.expandedStates.add(contentCellId);
            } else {
                this.logger?.debug('UI', 'Collapsing content', { contentCellId });
                
                // 1. First update button state
                button.setAttribute('data-expanded', 'false');
                button.setAttribute('aria-expanded', 'false');
                
                // Update button text
                const buttonText = button.querySelector('.oom-button-text');
                if (buttonText) {
                    buttonText.textContent = 'Show more';
                }
                
                // 2. Update content wrapper with CSS class
                contentWrapper.classList.remove('expanded');
                
                // 3. Set visibility using CSS classes - use requestAnimationFrame for better performance
                requestAnimationFrame(() => {
                    fullContent.classList.add('oom-content-full--hidden');
                    fullContent.classList.remove('oom-content-full--visible');
                });
                
                // Remove from expanded states
                this.expandedStates.delete(contentCellId);
            }
            
            // Save expanded states
            this.saveExpandedStates();
            
        } catch (error) {
            this.logger?.error('UI', 'Error in toggleContentVisibility', error as Error);
        }
    }
    
    /**
     * Expand all content sections
     * 
     * @param previewEl - The preview element containing all content sections
     */
    public expandAllContentSections(previewEl: HTMLElement): void {
        this.logger?.debug('UI', 'Expanding all content sections');
        
        try {
            // UPDATED: Use the class that matches our new structure
            const expandButtons = previewEl.querySelectorAll('.oom-button--expand');
            let expanded = 0;
            
            expandButtons.forEach(button => {
                const isExpanded = button.getAttribute('data-expanded') === 'true';
                if (!isExpanded) {
                    // Only expand sections that aren't already expanded
                    this.logger?.debug('UI', 'Expanding content section', { 
                        contentCellId: button.getAttribute('data-content-id') 
                    });
                    this.toggleContentVisibility(button as HTMLElement);
                    expanded++;
                }
            });
            
            this.logger?.debug('UI', `Expanded ${expanded} content sections`);
            if (expanded > 0) {
                new Notice(`Expanded ${expanded} content sections`);
            } else {
                new Notice('All sections already expanded');
            }
        } catch (error) {
            this.logger?.error('UI', 'Error expanding all content sections', error as Error);
            new Notice('Error expanding content sections');
        }
    }
    
    /**
     * Apply saved expanded states to the current view
     * 
     * @param previewEl - The preview element containing all content sections
     */
    public applyExpandedStates(previewEl: HTMLElement): void {
        this.logger?.debug('UI', 'Applying saved expanded states');
        
        try {
            if (this.expandedStates.size === 0) {
                this.logger?.debug('UI', 'No saved expanded states to apply');
                return;
            }
            
            // UPDATED: Use the class that matches our new structure
            const buttons = previewEl.querySelectorAll('.oom-button--expand');
            let applied = 0;
            
            buttons.forEach(button => {
                const contentId = button.getAttribute('data-content-id');
                if (contentId && this.expandedStates.has(contentId)) {
                    const isCurrentlyExpanded = button.getAttribute('data-expanded') === 'true';
                    if (!isCurrentlyExpanded) {
                        this.toggleContentVisibility(button as HTMLElement);
                        applied++;
                    }
                }
            });
            
            this.logger?.debug('UI', `Applied ${applied} saved expanded states`);
        } catch (error) {
            this.logger?.error('UI', 'Error applying expanded states', error as Error);
        }
    }
    
    /**
     * Load expanded states from localStorage
     */
    private loadExpandedStates(): void {
        try {
            const savedStates = localStorage.getItem('oom-expanded-states');
            if (savedStates) {
                const states = JSON.parse(savedStates);
                this.expandedStates = new Set<string>();
                
                // Handle both array and object formats for backward compatibility
                if (Array.isArray(states)) {
                    states.forEach(id => this.expandedStates.add(id));
                } else {
                    Object.entries(states).forEach(([id, isExpanded]) => {
                        if (isExpanded) this.expandedStates.add(id);
                    });
                }
                
                this.logger?.debug('UI', `Loaded ${this.expandedStates.size} expanded states from localStorage`);
            }
        } catch (error) {
            this.logger?.error('UI', 'Error loading expanded states from localStorage', error as Error);
            this.expandedStates = new Set<string>();
        }
    }
    
    /**
     * Save expanded states to localStorage
     */
    private saveExpandedStates(): void {
        try {
            const expandedStatesObj: Record<string, boolean> = {};
            this.expandedStates.forEach(id => {
                expandedStatesObj[id] = true;
            });
            localStorage.setItem('oom-expanded-states', JSON.stringify(expandedStatesObj));
            this.logger?.debug('UI', `Saved ${this.expandedStates.size} expanded states to localStorage`);
        } catch (error) {
            this.logger?.error('UI', 'Error saving expanded states to localStorage', error as Error);
        }
    }
} 