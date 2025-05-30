/**
 * globals.ts
 * Contains globally accessible variables and declarations
 * Used to consolidate global state and reduce circular dependencies
 */

// Create a global logger instance for functions outside the plugin class
import { ILogger } from './logging/LoggerTypes';

// Define global variables - these get initialized during plugin load
export let globalLogger: ILogger | undefined;
export let globalContentToggler: any;

// Set global logger instance
export function setGlobalLogger(logger: ILogger): void {
    globalLogger = logger;
}

// Set global content toggler instance
export function setGlobalContentToggler(toggler: any): void {
    globalContentToggler = toggler;
}

// Add TypeScript declaration for the window object extension
declare global {
    interface Window {
        forceApplyDateFilter: (selectedDate: Date) => void;
        oneiroMetricsPlugin: any; // Using 'any' to avoid circular dependencies
        debugContentExpansion: (showExpanded?: boolean) => string;
    }
} 