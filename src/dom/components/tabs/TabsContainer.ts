import { App, Notice } from 'obsidian';
import { TabsView } from './TabsView';
import { TabItem, TabsCallbacks, TabsConfig, TabsEvent, TabsProps } from './TabsTypes';

/**
 * Container component for the Tabs UI
 * 
 * This component handles the business logic for the tabs interface,
 * while delegating rendering to the TabsView component.
 */
export class TabsContainer {
    // Dependencies
    private app: App;
    
    // Component references
    private view: TabsView;
    
    // Component state
    private tabs: TabItem[] = [];
    private activeTabId: string | null = null;
    private config: TabsConfig;
    private contentRenderCallbacks: Record<string, (containerEl: HTMLElement) => void> = {};
    
    /**
     * Constructor
     * @param app Obsidian app instance
     * @param container DOM element to render into
     * @param tabs Initial tabs
     * @param config Configuration options
     */
    constructor(
        app: App, 
        container: HTMLElement,
        tabs: TabItem[],
        config: TabsConfig = {}
    ) {
        this.app = app;
        this.config = config;
        
        // Initialize tabs
        this.initializeTabs(tabs);
        
        // Create callbacks for view
        const callbacks: TabsCallbacks = {
            onTabSelect: this.handleTabSelect.bind(this),
            onTabClose: this.config.allowTabClose ? this.handleTabClose.bind(this) : undefined,
            onTabAdd: this.config.allowTabAdd ? this.handleTabAdd.bind(this) : undefined
        };
        
        // Create props for view
        const props: TabsProps = {
            tabs: this.tabs,
            orientation: 'horizontal',
            showIcons: true,
            showTooltips: true
        };
        
        // Create view
        this.view = new TabsView(props, callbacks);
        
        // Render view
        this.view.render(container);
        
        // Activate default tab if specified
        if (this.config.defaultTabId) {
            this.activateTab(this.config.defaultTabId);
        } else if (this.tabs.length > 0) {
            // Activate first tab by default
            this.activateTab(this.tabs[0].id);
        }
        
        // Restore active tab from storage if configured
        if (this.config.saveActiveTab && this.config.storageKey) {
            this.restoreActiveTabFromStorage();
        }
    }
    
    /**
     * Initialize tabs data
     * @param tabs Initial tabs
     */
    private initializeTabs(tabs: TabItem[]): void {
        // Copy tabs to internal state
        this.tabs = tabs.map(tab => ({
            ...tab,
            isActive: false // Reset active state
        }));
    }
    
    /**
     * Register a content renderer for a specific tab
     * @param tabId ID of the tab
     * @param renderCallback Callback to render content
     */
    public registerContentRenderer(
        tabId: string, 
        renderCallback: (containerEl: HTMLElement) => void
    ): void {
        this.contentRenderCallbacks[tabId] = renderCallback;
        
        // If this is the active tab, render immediately
        if (this.activeTabId === tabId) {
            const contentEl = this.view.getContentContainer();
            contentEl.empty();
            renderCallback(contentEl);
        }
    }
    
    /**
     * Activate a tab by ID
     * @param tabId ID of the tab to activate
     * @returns true if successful, false if tab not found or disabled
     */
    public activateTab(tabId: string): boolean {
        // Find the tab
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) {
            return false;
        }
        
        // Check if disabled
        if (this.tabs[tabIndex].isDisabled) {
            return false;
        }
        
        // Deactivate all tabs
        this.tabs = this.tabs.map(tab => ({
            ...tab,
            isActive: false
        }));
        
        // Activate the requested tab
        this.tabs[tabIndex].isActive = true;
        this.activeTabId = tabId;
        
        // Update view
        this.view.update({ tabs: this.tabs });
        
        // Render content
        this.renderActiveTabContent();
        
        // Save active tab if configured
        if (this.config.saveActiveTab && this.config.storageKey) {
            this.saveActiveTabToStorage();
        }
        
        return true;
    }
    
    /**
     * Render the content of the active tab
     */
    private renderActiveTabContent(): void {
        if (!this.activeTabId) {
            return;
        }
        
        const contentEl = this.view.getContentContainer();
        contentEl.empty();
        
        const renderCallback = this.contentRenderCallbacks[this.activeTabId];
        if (renderCallback) {
            renderCallback(contentEl);
        }
    }
    
    /**
     * Handle tab selection
     * @param tabId ID of the selected tab
     */
    private handleTabSelect(tabId: string): void {
        if (this.activateTab(tabId)) {
            // Dispatch tab selected event
            dispatchEvent(new CustomEvent(TabsEvent.TAB_SELECTED, {
                detail: { tabId }
            }));
        }
    }
    
    /**
     * Handle tab close
     * @param tabId ID of the tab to close
     */
    private handleTabClose(tabId: string): void {
        // Check if this tab can be closed
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) {
            return;
        }
        
        // Remove the tab
        this.tabs = this.tabs.filter(t => t.id !== tabId);
        
        // If this was the active tab, activate another one
        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                this.activateTab(this.tabs[0].id);
            } else {
                this.activeTabId = null;
            }
        }
        
        // Update view
        this.view.update({ tabs: this.tabs });
        
        // Dispatch tab closed event
        dispatchEvent(new CustomEvent(TabsEvent.TAB_CLOSED, {
            detail: { tabId }
        }));
    }
    
    /**
     * Handle add tab
     */
    private handleTabAdd(): void {
        // Dispatch tab add event
        dispatchEvent(new CustomEvent(TabsEvent.TAB_ADDED));
    }
    
    /**
     * Add a new tab
     * @param tab Tab data
     * @param activate Whether to activate the new tab
     * @returns ID of the new tab
     */
    public addTab(tab: TabItem, activate: boolean = false): string {
        // Add the tab
        this.tabs.push({
            ...tab,
            isActive: false
        });
        
        // Update view
        this.view.update({ tabs: this.tabs });
        
        // Activate if requested
        if (activate) {
            this.activateTab(tab.id);
        }
        
        return tab.id;
    }
    
    /**
     * Update an existing tab
     * @param tabId ID of the tab to update
     * @param updates Updates to apply
     * @returns true if successful, false if tab not found
     */
    public updateTab(tabId: string, updates: Partial<TabItem>): boolean {
        // Find the tab
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) {
            return false;
        }
        
        // Update the tab
        this.tabs[tabIndex] = {
            ...this.tabs[tabIndex],
            ...updates
        };
        
        // Update view
        this.view.update({ tabs: this.tabs });
        
        return true;
    }
    
    /**
     * Save active tab to storage
     */
    private saveActiveTabToStorage(): void {
        if (!this.config.storageKey) {
            return;
        }
        
        try {
            localStorage.setItem(this.config.storageKey, this.activeTabId || '');
        } catch (error) {
            console.error('Failed to save active tab to storage:', error);
        }
    }
    
    /**
     * Restore active tab from storage
     */
    private restoreActiveTabFromStorage(): void {
        if (!this.config.storageKey) {
            return;
        }
        
        try {
            const savedTabId = localStorage.getItem(this.config.storageKey);
            if (savedTabId) {
                this.activateTab(savedTabId);
            }
        } catch (error) {
            console.error('Failed to restore active tab from storage:', error);
        }
    }
    
    /**
     * Clean up resources
     */
    public cleanup(): void {
        this.view.cleanup();
    }
} 