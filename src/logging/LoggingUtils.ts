import { App } from 'obsidian';
import { ILoggingService } from './LoggingInterfaces';
import { LoggingService } from './LoggingService';

/**
 * Global registry of loggers to avoid creating multiple instances
 * for the same component.
 */
const loggers: Record<string, ILoggingService> = {};

/**
 * Creates a new logger or returns an existing one for the specified component.
 * @param app The Obsidian app instance
 * @param component The component name
 * @returns A logging service instance
 */
export function createLogger(app: App, component: string): ILoggingService {
  if (!loggers[component]) {
    const logger = LoggingService.getInstance(app);
    loggers[component] = logger;
  }
  return loggers[component];
}

/**
 * Returns an existing logger for the specified component.
 * Throws an error if no logger exists for the component.
 * @param component The component name
 * @returns A logging service instance
 */
export function getLogger(component: string): ILoggingService {
  if (!loggers[component]) {
    throw new Error(`No logger found for component: ${component}`);
  }
  return loggers[component];
} 