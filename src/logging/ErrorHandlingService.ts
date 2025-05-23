import { Notice } from 'obsidian';
import { EnrichedError, ErrorContext, ILoggingService } from './LoggingInterfaces';
import { IErrorHandlingService } from './IErrorHandlingService';

/**
 * Service for handling errors in a consistent way throughout the application.
 * Provides utilities for enriching errors with context, wrapping errors,
 * and creating user-friendly messages.
 */
export class ErrorHandlingService implements IErrorHandlingService {
  /**
   * Creates a new ErrorHandlingService.
   * @param logger The logging service to use for logging errors
   */
  constructor(private logger: ILoggingService) {}

  /**
   * Enriches an error with additional context.
   * @param error The original error
   * @param context The context to add to the error
   * @returns The enriched error
   */
  enrichError(error: Error, context: Partial<ErrorContext>): EnrichedError {
    const enriched = error as EnrichedError;
    enriched.context = {
      component: context.component || 'unknown',
      operation: context.operation || 'unknown',
      timestamp: context.timestamp || Date.now(),
      metadata: context.metadata || {}
    };
    return enriched;
  }

  /**
   * Creates a new error that wraps an original error with additional context.
   * @param originalError The original error
   * @param message The new error message
   * @param context The context to add to the error
   * @returns The wrapped error
   */
  wrapError(
    originalError: Error, 
    message: string, 
    context: Partial<ErrorContext>
  ): EnrichedError {
    const wrapped = new Error(message) as EnrichedError;
    wrapped.originalError = originalError;
    wrapped.stack = `${wrapped.stack}\nCaused by: ${originalError.stack}`;
    wrapped.context = {
      component: context.component || 'unknown',
      operation: context.operation || 'unknown',
      timestamp: context.timestamp || Date.now(),
      metadata: context.metadata || {}
    };
    return wrapped;
  }

  /**
   * Handles an error by logging it and optionally showing a notice to the user.
   * @param error The error to handle
   * @param component The component where the error occurred
   * @param operation The operation that caused the error
   * @param userMessage Optional message to show to the user
   * @param showNotice Whether to show a notice to the user
   */
  handleError(
    error: Error,
    component: string,
    operation: string,
    userMessage?: string,
    showNotice: boolean = true
  ): void {
    // Enrich the error with context
    const enrichedError = this.enrichError(error, {
      component,
      operation,
      timestamp: Date.now()
    });

    // Log the error
    this.logger.error(component, userMessage || error.message, enrichedError);

    // Show a notice to the user if requested
    if (showNotice) {
      this.showUserError(userMessage || error.message);
    }
  }

  /**
   * Attempts to execute a function, handling any errors that occur.
   * @param component The component executing the operation
   * @param operation The operation being performed
   * @param fn The function to execute
   * @param fallback Optional fallback function to execute if the main function fails
   * @param userMessage Optional message to show to the user if an error occurs
   * @returns The result of the function or fallback
   */
  async tryExecute<T>(
    component: string,
    operation: string,
    fn: () => Promise<T> | T,
    fallback?: () => Promise<T> | T,
    userMessage?: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Handle the error
      this.handleError(
        error as Error,
        component,
        operation,
        userMessage || `Error during ${operation}: ${(error as Error).message}`
      );

      // Execute fallback if provided
      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          // Handle fallback error
          this.handleError(
            fallbackError as Error,
            component,
            `${operation} (fallback)`,
            `Fallback for ${operation} also failed: ${(fallbackError as Error).message}`,
            true
          );
        }
      }

      // Re-throw the error if no fallback or fallback failed
      throw error;
    }
  }

  /**
   * Shows a user-friendly error message.
   * @param message The message to show
   * @param timeout The timeout in milliseconds
   */
  showUserError(message: string, timeout: number = 5000): Notice {
    return new Notice(`OneiroMetrics: ${message}`, timeout);
  }

  /**
   * Shows a validation error message.
   * @param message The message to show
   * @param details Optional details to log
   */
  showValidationError(message: string, details?: any): Notice {
    this.logger.warn('Validation', message, details);
    return new Notice(`Validation Error: ${message}`, 4000);
  }
}

/**
 * Standard error types for different areas of the application.
 */

/**
 * Error thrown when validation fails.
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when parsing fails.
 */
export class ParseError extends Error {
  constructor(message: string, public source?: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Error thrown by a service.
 */
export class ServiceError extends Error {
  constructor(message: string, public service: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Error thrown by a UI component.
 */
export class UIError extends Error {
  constructor(message: string, public component: string) {
    super(message);
    this.name = 'UIError';
  }
}

/**
 * Error thrown when a file operation fails.
 */
export class FileOperationError extends Error {
  constructor(message: string, public path?: string) {
    super(message);
    this.name = 'FileOperationError';
  }
}

/**
 * Error thrown when a plugin operation fails.
 */
export class PluginError extends Error {
  constructor(message: string, public operation?: string) {
    super(message);
    this.name = 'PluginError';
  }
} 