import { Notice } from 'obsidian';
import { EnrichedError, ErrorContext } from './LoggingInterfaces';

/**
 * Interface for error handling service. This service provides utilities for
 * enriching errors with context, wrapping errors, and handling errors in a
 * consistent way throughout the application.
 */
export interface IErrorHandlingService {
  /**
   * Enriches an error with additional context.
   * @param error The original error
   * @param context The context to add to the error
   * @returns The enriched error
   */
  enrichError(error: Error, context: Partial<ErrorContext>): EnrichedError;

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
  ): EnrichedError;

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
    showNotice?: boolean
  ): void;

  /**
   * Attempts to execute a function, handling any errors that occur.
   * @param component The component executing the operation
   * @param operation The operation being performed
   * @param fn The function to execute
   * @param fallback Optional fallback function to execute if the main function fails
   * @param userMessage Optional message to show to the user if an error occurs
   * @returns The result of the function or fallback
   */
  tryExecute<T>(
    component: string,
    operation: string,
    fn: () => Promise<T> | T,
    fallback?: () => Promise<T> | T,
    userMessage?: string
  ): Promise<T>;

  /**
   * Shows a user-friendly error message.
   * @param message The message to show
   * @param timeout The timeout in milliseconds
   */
  showUserError(message: string, timeout?: number): Notice;

  /**
   * Shows a validation error message.
   * @param message The message to show
   * @param details Optional details to log
   */
  showValidationError(message: string, details?: any): Notice;
} 