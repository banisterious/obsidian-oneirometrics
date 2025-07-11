/**
 * GlobalHelpers.ts
 * Collection of utility functions used throughout the application
 */

import { format } from 'date-fns';
import { Notice } from 'obsidian';
import { lucideIconMap } from '../../settings';
import { globalLogger, globalContentToggler } from '../globals';

/**
 * Helper function to safely access settings properties
 * Handles type compatibility during refactoring
 */
export function safeSettingsAccess(settings: any, propName: string, defaultValue: any = undefined) {
    if (!settings) return defaultValue;
    return settings[propName] !== undefined ? settings[propName] : defaultValue;
}

/**
 * Format a date for display in a standardized format
 */
export function formatDateForDisplay(date: Date): string {
    return format(date, 'MMM d, yyyy');
}

/**
 * Get icon HTML from icon name with fallbacks
 */
export function getIcon(iconName: string): string | null {
    if (!iconName) return null;
    
    // Special case handling for known icons that might have naming inconsistencies
    if (iconName === 'circle-off') iconName = 'circle-minus';
    
    // Check if it's a Lucide icon from our map
    const lucideIcon = lucideIconMap?.[iconName];
    if (lucideIcon) return lucideIcon;
    
    // Try getting from Obsidian's built-in icons
    try {
        const obsidianIcon = getIcon(iconName);
        if (obsidianIcon) return obsidianIcon;
    } catch (e) {
        // Silent fail and continue to fallback
    }
    
    // Return a simple span as fallback
    return `<span class="icon">${iconName}</span>`;
}

/**
 * Get an icon specifically for metrics with styling modifications
 */
export function getMetricIcon(iconName: string): string | null {
    if (!iconName) return null;
    
    // Special case handling for known icons that might have naming inconsistencies
    if (iconName === 'circle-off') iconName = 'circle-minus';
    if (iconName === 'circle') iconName = 'circle-dot';
    if (iconName === 'x') iconName = 'x-circle';
    
    // Check if it's a Lucide icon from our map
    let iconHtml = lucideIconMap?.[iconName];
    
    if (iconHtml) {
        // Modify SVG to include width and height attributes
        // Add additional classes for better styling and consistency
        iconHtml = iconHtml
            .replace('width="24"', 'width="18"')
            .replace('height="24"', 'height="18"')
            .replace('<svg ', '<svg class="oom-metric-icon" ')
            .replace('stroke-width="2"', 'stroke-width="3"');
        
        // Wrap in a container for better positioning
        return `<span class="oom-metric-icon-container">${iconHtml}</span>`;
    }
    
    // If no icon found but we have a name, use a text fallback
    if (iconName) {
        // Simple visual indicator of the icon type
        switch (iconName.toLowerCase()) {
            case 'circle':
            case 'circle-dot':
                return `<span class="oom-icon-text">●</span>`;
            case 'x':
            case 'x-circle':
                return `<span class="oom-icon-text">✕</span>`;
            case 'square':
                return `<span class="oom-icon-text">■</span>`;
            case 'triangle':
                return `<span class="oom-icon-text">▲</span>`;
            case 'star':
                return `<span class="oom-icon-text">★</span>`;
            default:
                return `<span class="oom-icon-text oom-icon-${iconName}">•</span>`;
        }
    }
    
    // Last resort fallback - return nothing
    return null;
}

/**
 * Toggle content visibility with a button
 */
export function toggleContentVisibility(button: HTMLElement) {
    if (globalContentToggler) {
        globalContentToggler.toggleContentVisibility(button);
    } else if (window.oneiroMetricsPlugin && window.oneiroMetricsPlugin.contentToggler) {
        // Fallback to plugin instance if global isn't set
        window.oneiroMetricsPlugin.contentToggler.toggleContentVisibility(button);
    } else {
        // Use safeLogger instead of console.error to comply with Obsidian guidelines
        import('../logging/safe-logger').then(({ default: safeLogger }) => {
            safeLogger.error('GlobalHelpers', 'ContentToggler not initialized for toggle operation');
        });
    }
}

/**
 * Expand all content sections in a container
 */
export function expandAllContentSections(previewEl: HTMLElement) {
    if (globalContentToggler) {
        globalContentToggler.expandAllContentSections(previewEl);
    } else if (window.oneiroMetricsPlugin && window.oneiroMetricsPlugin.contentToggler) {
        // Fallback to plugin instance if global isn't set
        window.oneiroMetricsPlugin.contentToggler.expandAllContentSections(previewEl);
    } else {
        // Use safeLogger instead of console.error to comply with Obsidian guidelines
        import('../logging/safe-logger').then(({ default: safeLogger }) => {
            safeLogger.error('GlobalHelpers', 'ContentToggler not initialized for expand operation');
        });
    }
}

/**
 * Debug helper to expand/collapse all content sections
 */
export function debugContentExpansion(showExpanded: boolean = true): string {
    globalLogger?.debug('UI', 'Manual content expansion debug triggered', { showExpanded });
    
    // Get the OOM content container
    const previewEl = document.querySelector('.oom-metrics-content') as HTMLElement;
    if (!previewEl) {
        globalLogger?.error('UI', 'Cannot find .oom-metrics-content element');
        return 'Error: Content container not found';
    }
    
    // Find all expand buttons
    const expandButtons = previewEl.querySelectorAll('.oom-button--expand');
    globalLogger?.debug('UI', 'Found content expansion buttons', { count: expandButtons.length });
    
    if (expandButtons.length === 0) {
        return 'No content expansion buttons found';
    }
    
    // Toggle each button to the desired state
    let processed = 0;
    expandButtons.forEach(button => {
        const isCurrentlyExpanded = button.getAttribute('data-expanded') === 'true';
        
        // Only process if the button isn't already in the desired state
        if (showExpanded !== isCurrentlyExpanded) {
            globalLogger?.debug('UI', 'Processing button', { 
                id: button.getAttribute('data-parent-cell'),
                current: isCurrentlyExpanded, 
                target: showExpanded 
            });
            toggleContentVisibility(button as HTMLElement);
            processed++;
        }
    });
    
    // Output summary
    if (processed > 0) {
        return `${processed} content sections ${showExpanded ? 'expanded' : 'collapsed'}`;
    } else {
        return `All content sections already ${showExpanded ? 'expanded' : 'collapsed'}`;
    }
} 