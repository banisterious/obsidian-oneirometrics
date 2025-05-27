/**
 * Null Service Registrations
 * 
 * This module registers null object implementations with the ServiceRegistry
 * as fallbacks for critical services. These implementations provide safe defaults
 * when the real services are not available.
 */

import { registerFallback, SERVICE_NAMES } from './ServiceRegistry';
import { NullLoggingService } from '../logging/NullLoggingService';
import { NullTimeFilterManager } from '../timeFilters/NullTimeFilterManager';
import { NullEventManager } from '../events/NullEventManager';

/**
 * Register all null service implementations as fallbacks
 */
export function registerNullServices(): void {
    // Register NullLoggingService as fallback for the logger
    registerFallback(SERVICE_NAMES.LOGGER, NullLoggingService.getInstance());
    
    // Register NullTimeFilterManager as fallback for the time filter manager
    registerFallback(SERVICE_NAMES.TIME_FILTER, NullTimeFilterManager.getInstance());
    
    // Register NullEventManager as fallback for event management
    registerFallback('eventManager', NullEventManager.getInstance());
}

/**
 * Initialize all null service registrations
 * This should be called early in the application startup process
 */
export function initializeNullServices(): void {
    registerNullServices();
} 