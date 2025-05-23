import { TabItem, TabsCallbacks, TabsProps } from './TabsTypes';

/**
 * View component for the Tabs UI
 * 
 * This component handles rendering of the tabs interface
 * without containing any business logic.
 */
export class TabsView {
    private containerEl: HTMLElement;
    private tabsContainerEl: HTMLElement;
    private contentContainerEl: HTMLElement;
    private props: TabsProps;
    private callbacks: TabsCallbacks;
    
    /**
     * Constructor
     * @param props View props
     * @param callbacks Callbacks for tab events
     */
    constructor(props: TabsProps, callbacks: TabsCallbacks) {
        this.props = props;
        this.callbacks = callbacks;
        
        // Create container elements
        this.containerEl = document.createElement('div');
        this.containerEl.addClass('oom-tabs-container');
        if (this.props.containerClassName) {
            this.containerEl.addClass(this.props.containerClassName);
        }
        
        if (this.props.orientation === 'vertical') {
            this.containerEl.addClass('oom-tabs-vertical');
        } else {
            this.containerEl.addClass('oom-tabs-horizontal');
        }
        
        // Create tabs container
        this.tabsContainerEl = this.containerEl.createDiv('oom-tabs-header');
        
        // Create content container
        this.contentContainerEl = this.containerEl.createDiv('oom-tabs-content');
    }
    
    /**
     * Render the tabs view
     * @param containerEl Container element to render into
     */
    public render(containerEl: HTMLElement): void {
        // Append the tab container to the parent container
        containerEl.appendChild(this.containerEl);
        
        // Render the tabs
        this.renderTabs();
    }
    
    /**
     * Update the view with new props
     * @param newProps New props to update with
     */
    public update(newProps: Partial<TabsProps>): void {
        // Update props
        this.props = { ...this.props, ...newProps };
        
        // Re-render tabs
        this.renderTabs();
    }
    
    /**
     * Get the content container element
     * This allows the container component to render content into the tabs
     */
    public getContentContainer(): HTMLElement {
        return this.contentContainerEl;
    }
    
    /**
     * Clean up resources
     */
    public cleanup(): void {
        // Remove all event listeners and DOM elements
        this.containerEl.empty();
        if (this.containerEl.parentNode) {
            this.containerEl.parentNode.removeChild(this.containerEl);
        }
    }
    
    /**
     * Render the tabs header
     */
    private renderTabs(): void {
        // Clear existing tabs
        this.tabsContainerEl.empty();
        
        // Render each tab
        for (const tab of this.props.tabs) {
            const tabElement = this.createTabElement(tab);
            this.tabsContainerEl.appendChild(tabElement);
        }
        
        // Add "add tab" button if callback is provided
        if (this.callbacks.onTabAdd) {
            const addButton = this.createAddTabButton();
            this.tabsContainerEl.appendChild(addButton);
        }
    }
    
    /**
     * Create a single tab element
     * @param tab Tab data
     * @returns Tab HTML element
     */
    private createTabElement(tab: TabItem): HTMLElement {
        const tabEl = document.createElement('div');
        tabEl.addClass('oom-tab');
        
        if (this.props.tabClassName) {
            tabEl.addClass(this.props.tabClassName);
        }
        
        if (tab.isActive) {
            tabEl.addClass('oom-tab-active');
            if (this.props.activeTabClassName) {
                tabEl.addClass(this.props.activeTabClassName);
            }
        }
        
        if (tab.isDisabled) {
            tabEl.addClass('oom-tab-disabled');
            if (this.props.disabledTabClassName) {
                tabEl.addClass(this.props.disabledTabClassName);
            }
        }
        
        // Add tooltip if enabled
        if (this.props.showTooltips && tab.tooltip) {
            tabEl.setAttribute('aria-label', tab.tooltip);
            tabEl.setAttribute('title', tab.tooltip);
        }
        
        // Add icon if enabled and available
        if (this.props.showIcons && tab.icon) {
            const iconEl = tabEl.createSpan('oom-tab-icon');
            iconEl.addClass(tab.icon);
        }
        
        // Add title
        const titleEl = tabEl.createSpan('oom-tab-title');
        titleEl.textContent = tab.title;
        
        // Add close button if callback is provided
        if (this.callbacks.onTabClose) {
            const closeButton = tabEl.createSpan('oom-tab-close');
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.callbacks.onTabClose?.(tab.id);
            });
        }
        
        // Add click handler for tab selection (unless disabled)
        if (!tab.isDisabled) {
            tabEl.addEventListener('click', () => {
                this.callbacks.onTabSelect(tab.id);
            });
        }
        
        return tabEl;
    }
    
    /**
     * Create an "add tab" button
     * @returns Add tab button element
     */
    private createAddTabButton(): HTMLElement {
        const addButton = document.createElement('div');
        addButton.addClass('oom-tab-add');
        addButton.innerHTML = '+';
        addButton.setAttribute('aria-label', 'Add new tab');
        addButton.setAttribute('title', 'Add new tab');
        
        addButton.addEventListener('click', () => {
            this.callbacks.onTabAdd?.();
        });
        
        return addButton;
    }
} 