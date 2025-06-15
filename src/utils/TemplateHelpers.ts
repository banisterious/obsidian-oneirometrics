/**
 * Template Generation Helpers
 * 
 * Safe alternatives for complex HTML template generation found in HubModal.ts
 * and other components that need structured content creation.
 * 
 * Created as part of Issue 1: innerHTML/outerHTML Security Risk remediation
 */

import { SafeDOMUtils } from './SafeDOMUtils';

export class TemplateHelpers {
    
    /**
     * Create Templater explanation content (replaces HubModal.ts line 3810-3823)
     * 
     * @param parent - Parent element to append content to
     * @returns The created explanation container
     */
    static createTemplaterExplanation(parent: HTMLElement): HTMLElement {
        const explanation = parent.createEl('div', { cls: 'oom-templater-explanation' });
        
        // Main title
        const title = explanation.createEl('p');
        title.createEl('strong', { text: 'Templater Support:' });
        
        // Main list
        const mainList = explanation.createEl('ul');
        
        // Dynamic Version item
        const dynamicItem = mainList.createEl('li');
        dynamicItem.createEl('strong', { text: 'Dynamic Version:' });
        dynamicItem.appendText(' Uses Templater\'s JavaScript execution and interactive prompts');
        
        // Static Fallback item
        const staticItem = mainList.createEl('li');
        staticItem.createEl('strong', { text: 'Static Fallback:' });
        staticItem.appendText(' Converts Templater syntax to placeholders for manual replacement');
        
        // Your Template Features item with nested list
        const featuresItem = mainList.createEl('li');
        featuresItem.createEl('strong', { text: 'Your Template Features:' });
        
        const featuresList = featuresItem.createEl('ul');
        
        // tp.system.prompt() feature
        const promptFeature = featuresList.createEl('li');
        promptFeature.createEl('code', { text: 'tp.system.prompt()' });
        promptFeature.appendText(' ? Interactive user prompts');
        
        // JavaScript execution blocks feature
        const jsFeature = featuresList.createEl('li');
        jsFeature.createEl('code', { text: '<%* ... -%>' });
        jsFeature.appendText(' ? JavaScript execution blocks');
        
        // Variable insertion feature
        const varFeature = featuresList.createEl('li');
        varFeature.createEl('code', { text: '<% variable %>' });
        varFeature.appendText(' ? Variable insertion');
        
        return explanation;
    }
    
    /**
     * Create filter display with icon and text (replaces EnhancedDateNavigatorModal.ts line 1960)
     * 
     * @param parent - Parent element to append content to
     * @param displayText - Text to display (will be escaped)
     * @param iconText - Icon text/emoji (default: calendar)
     * @returns The created filter display container
     */
    static createFilterDisplay(
        parent: HTMLElement, 
        displayText: string, 
        iconText: string = '🗓️'
    ): HTMLElement {
        SafeDOMUtils.safelyEmptyContainer(parent);
        
        const iconSpan = parent.createEl('span', {
            cls: 'oom-filter-icon',
            text: iconText
        });
        
        const textSpan = parent.createEl('span', {
            cls: 'oom-filter-text oom-filter--custom',
            text: displayText // Automatically escaped by textContent
        });
        
        return parent;
    }
    
    /**
     * Create month option with entry indicator (replaces EnhancedDateNavigatorModal.ts line 349)
     * 
     * @param parent - Parent element to append to
     * @param monthName - Name of the month
     * @param hasEntries - Whether the month has dream entries
     * @returns The created month option element
     */
    static createMonthOption(
        parent: HTMLElement, 
        monthName: string, 
        hasEntries: boolean = false
    ): HTMLElement {
        const monthOption = parent.createEl('option', { text: monthName });
        
        if (hasEntries) {
            monthOption.appendText(' ');
            monthOption.createEl('span', {
                cls: 'oomp-entry-indicator',
                text: '●'
            });
        }
        
        return monthOption;
    }
    
    /**
     * Create progress loading state (replaces common pattern in HubModal.ts)
     * 
     * @param container - Container to show loading in
     * @param message - Loading message
     * @param className - Optional CSS class
     */
    static showLoadingState(
        container: HTMLElement, 
        message: string = '⏳ Loading...', 
        className?: string
    ): void {
        SafeDOMUtils.safelyEmptyContainer(container);
        container.createEl('p', { 
            text: message, 
            cls: className || 'oom-loading-state' 
        });
    }
    
    /**
     * Create navigation button with safe text content
     * 
     * @param parent - Parent element
     * @param direction - 'prev' or 'next'
     * @param onClick - Click handler
     * @returns The created button element
     */
    static createNavigationButton(
        parent: HTMLElement,
        direction: 'prev' | 'next',
        onClick?: () => void
    ): HTMLElement {
        const button = parent.createEl('button', {
            cls: `oom-nav-btn oom-nav-btn--${direction}`,
            text: direction === 'prev' ? '‹' : '›'
        });
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }
    
    /**
     * Create a metric bar visualization (for PatternTooltips.ts)
     * 
     * @param percentage - Percentage value (0-100)
     * @param color - Bar color
     * @param className - Optional CSS class
     * @returns The created bar container element
     */
    static createMetricBar(
        percentage: number, 
        color: string, 
        className?: string
    ): HTMLElement {
        const barContainer = SafeDOMUtils.createElement('span', {
            className: className || 'oom-tooltip-bar'
        });
        
        const barFill = SafeDOMUtils.createElement('span', {
            className: 'oom-tooltip-bar-fill oom-tooltip-bar-dynamic'
        });
        
        // Use CSS custom properties for dynamic values (safe approach)
        barFill.style.setProperty('--bar-width', `${Math.min(100, Math.max(0, percentage))}%`);
        barFill.style.setProperty('--bar-color', color);
        
        barContainer.appendChild(barFill);
        return barContainer;
    }
    
    /**
     * Create tooltip content structure safely (for PatternTooltips.ts line 53)
     * 
     * @param container - Container element to populate
     * @param entry - Dream entry data
     * @param patterns - Pattern data
     * @returns The populated container
     */
    static createTooltipContent(
        container: HTMLElement,
        entry: {
            title: string;
            date: string;
            metrics?: Record<string, number>;
        },
        patterns: any[]
    ): HTMLElement {
        SafeDOMUtils.safelyEmptyContainer(container);
        
        // Title (safely escaped)
        const titleEl = container.createEl('h4', {
            cls: 'oom-tooltip-title',
            text: entry.title // Automatically escaped
        });
        
        // Date (safely escaped)
        const dateEl = container.createEl('p', {
            cls: 'oom-tooltip-date',
            text: entry.date // Automatically escaped
        });
        
        // Metrics section
        if (entry.metrics && Object.keys(entry.metrics).length > 0) {
            const metricsSection = container.createEl('div', {
                cls: 'oom-tooltip-metrics'
            });
            
            Object.entries(entry.metrics).forEach(([metricName, value]) => {
                const metricRow = metricsSection.createEl('div', {
                    cls: 'oom-tooltip-metric-row'
                });
                
                metricRow.createEl('span', {
                    cls: 'oom-tooltip-metric-name',
                    text: metricName // Automatically escaped
                });
                
                metricRow.createEl('span', {
                    cls: 'oom-tooltip-metric-value',
                    text: value.toString() // Automatically escaped
                });
                
                // Add metric bar if applicable
                if (typeof value === 'number' && value >= 0) {
                    const barContainer = this.createMetricBar(
                        (value / 5) * 100, // Assuming 5-point scale
                        this.getMetricColor(metricName, value)
                    );
                    metricRow.appendChild(barContainer);
                }
            });
        }
        
        return container;
    }
    
    /**
     * Get color for metric visualization
     * 
     * @param metricName - Name of the metric
     * @param value - Metric value
     * @returns Color string
     */
    private static getMetricColor(metricName: string, value: number): string {
        // Simple color scheme based on value
        if (value >= 4) return '#4CAF50'; // Green for high values
        if (value >= 3) return '#FFC107'; // Yellow for medium values
        if (value >= 2) return '#FF9800'; // Orange for low-medium values
        return '#F44336'; // Red for low values
    }
    
    /**
     * Create complex nested structure helper
     * 
     * @param parent - Parent element
     * @param structure - Structure definition
     * @returns Created elements container
     */
    static createComplexStructure(
        parent: HTMLElement,
        structure: {
            tag: keyof HTMLElementTagNameMap;
            className?: string;
            text?: string;
            children?: any[];
        }
    ): HTMLElement {
        const element = parent.createEl(structure.tag, {
            cls: structure.className,
            text: structure.text
        });
        
        if (structure.children) {
            structure.children.forEach(child => {
                this.createComplexStructure(element, child);
            });
        }
        
        return element;
    }
}

/**
 * Export specific helpers for convenience
 */
export const {
    createTemplaterExplanation,
    createFilterDisplay,
    createMonthOption,
    showLoadingState,
    createNavigationButton,
    createMetricBar,
    createTooltipContent
} = TemplateHelpers;