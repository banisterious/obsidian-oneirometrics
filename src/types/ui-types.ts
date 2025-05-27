/**
 * UI Types
 * 
 * This file contains types and interfaces related to UI components
 * that are shared across the application.
 */

/**
 * Error boundary options for UI components
 */
export interface ErrorBoundaryOptions {
  /** Whether to show fallback UI when an error occurs */
  showFallback?: boolean;
  /** Custom error handler function */
  onError?: (error: Error, componentName: string) => void;
  /** Message to display in fallback UI */
  fallbackMessage?: string;
} 