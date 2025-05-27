/**
 * Global Helper Functions
 * 
 * These functions are made available globally to prevent reference errors
 * during plugin initialization.
 */

// Safe implementation of getProjectNotePath
export function getProjectNotePath(settings: any): string {
    if (!settings) return '';
    
    // Check for direct path
    if (settings.projectNotePath) {
        return settings.projectNotePath;
    }
    
    // Check for legacy path with default
    return settings.projectNote || 'DreamMetrics.md';
}

// Initialize global variables
window.customDateRange = null;
window.getProjectNotePath = getProjectNotePath;

// Declare types for TypeScript
declare global {
    interface Window {
        customDateRange: { start: string, end: string } | null;
        getProjectNotePath: (settings: any) => string;
    }
}

/**
 * Function to safely access the customDateRange global variable
 * @returns The current custom date range or null
 */
export function getCustomDateRange(): { start: string, end: string } | null {
    return window.customDateRange;
}

/**
 * Function to safely set the customDateRange global variable
 * @param range The date range to set
 */
export function setCustomDateRange(range: { start: string, end: string } | null): void {
    window.customDateRange = range;
} 