/**
 * Types for the Tabs Component
 */

/**
 * Represents a single tab item
 */
export interface TabItem {
    id: string;
    title: string;
    icon?: string;
    tooltip?: string;
    isActive?: boolean;
    isDisabled?: boolean;
}

/**
 * Props for the Tabs view component
 */
export interface TabsProps {
    tabs: TabItem[];
    containerClassName?: string;
    tabClassName?: string;
    activeTabClassName?: string;
    disabledTabClassName?: string;
    orientation?: 'horizontal' | 'vertical';
    showIcons?: boolean;
    showTooltips?: boolean;
}

/**
 * Callbacks for the Tabs view component
 */
export interface TabsCallbacks {
    onTabSelect: (tabId: string) => void;
    onTabClose?: (tabId: string) => void;
    onTabAdd?: () => void;
}

/**
 * Events emitted by the Tabs container component
 */
export enum TabsEvent {
    TAB_SELECTED = 'tabs:tabSelected',
    TAB_CLOSED = 'tabs:tabClosed',
    TAB_ADDED = 'tabs:tabAdded'
}

/**
 * Configuration options for the Tabs container component
 */
export interface TabsConfig {
    allowTabClose?: boolean;
    allowTabAdd?: boolean;
    allowReordering?: boolean;
    defaultTabId?: string;
    saveActiveTab?: boolean;
    storageKey?: string;
} 