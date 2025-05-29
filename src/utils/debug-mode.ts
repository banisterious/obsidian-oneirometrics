/**
 * Utility functions for handling debug mode
 */

/**
 * Checks if the application is running in debug/development mode
 * 
 * This function checks both the NODE_ENV environment variable
 * and a localStorage flag that can be set for testing.
 * 
 * @returns {boolean} True if running in debug/development mode
 */
export function isDebugMode(): boolean {
  // Check for development environment
  const isDevelopmentEnv = process.env.NODE_ENV === 'development';
  
  // Check for debug flag in localStorage (useful for testing in production builds)
  const hasDebugFlag = typeof window !== 'undefined' && 
                      window.localStorage?.getItem('oom-debug-mode') === 'true';
  
  return isDevelopmentEnv || hasDebugFlag;
}

/**
 * Enables debug mode by setting a flag in localStorage
 */
export function enableDebugMode(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('oom-debug-mode', 'true');
  }
}

/**
 * Disables debug mode by removing the flag from localStorage
 */
export function disableDebugMode(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('oom-debug-mode');
  }
} 