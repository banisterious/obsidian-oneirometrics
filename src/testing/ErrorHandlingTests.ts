import { ErrorHandlingService, ValidationError, ServiceError } from '../logging/ErrorHandlingService';
import { ILoggingService } from '../logging/LoggingInterfaces';
import { Notice } from 'obsidian';

// Extend the global namespace to add the Notice constructor for testing
declare global {
    interface Global {
        Notice: typeof Notice;
    }
}

/**
 * Mock logging service for testing
 */
class MockLogger implements ILoggingService {
    public logs: Array<{level: string, category: string, message: string, data?: any}> = [];
    
    configure(config: any): void {}
    
    debug(category: string, message: string, data?: any): void {
        this.logs.push({level: 'debug', category, message, data});
    }
    
    info(category: string, message: string, data?: any): void {
        this.logs.push({level: 'info', category, message, data});
    }
    
    warn(category: string, message: string, data?: any): void {
        this.logs.push({level: 'warn', category, message, data});
    }
    
    error(category: string, message: string, error?: any): void {
        this.logs.push({level: 'error', category, message, data: error});
    }
    
    trace(category: string, message: string, data?: any): void {
        this.logs.push({level: 'trace', category, message, data});
    }
    
    enrichError(error: Error, context: any): any {
        return error;
    }
    
    wrapError(originalError: Error, message: string, context: any): any {
        return new Error(message);
    }
}

/**
 * Mock Notice class for testing
 */
class MockNotice {
    constructor(public message: string, public timeout?: number) {}
}

/**
 * Register error handling tests
 */
export function registerErrorHandlingTests(testRunner: any) {
    testRunner.registerTest('ErrorHandlingService', 'Basic error enrichment', async () => {
        // Arrange
        const mockLogger = new MockLogger();
        const errorHandler = new ErrorHandlingService(mockLogger);
        const error = new Error('Test error');
        
        // Act
        const enrichedError = errorHandler.enrichError(error, {
            component: 'TestComponent',
            operation: 'testOperation'
        });
        
        // Assert
        if (!enrichedError.context) {
            throw new Error('Error context is undefined');
        }
        
        if (enrichedError.context.component !== 'TestComponent') {
            throw new Error(`Expected component to be 'TestComponent', got '${enrichedError.context.component}'`);
        }
        
        if (enrichedError.context.operation !== 'testOperation') {
            throw new Error(`Expected operation to be 'testOperation', got '${enrichedError.context.operation}'`);
        }
        
        if (!enrichedError.context.timestamp) {
            throw new Error('Error timestamp is undefined');
        }
        
        return true;
    });
    
    testRunner.registerTest('ErrorHandlingService', 'Error wrapping', async () => {
        // Arrange
        const mockLogger = new MockLogger();
        const errorHandler = new ErrorHandlingService(mockLogger);
        const originalError = new Error('Original error');
        
        // Act
        const wrappedError = errorHandler.wrapError(originalError, 'Wrapped error', {
            component: 'TestComponent',
            operation: 'testOperation'
        });
        
        // Assert
        if (wrappedError.message !== 'Wrapped error') {
            throw new Error(`Expected message to be 'Wrapped error', got '${wrappedError.message}'`);
        }
        
        if (!wrappedError.originalError) {
            throw new Error('Original error is undefined');
        }
        
        if (wrappedError.originalError !== originalError) {
            throw new Error('Original error reference is not preserved');
        }
        
        if (!wrappedError.context) {
            throw new Error('Error context is undefined');
        }
        
        if (wrappedError.context.component !== 'TestComponent') {
            throw new Error(`Expected component to be 'TestComponent', got '${wrappedError.context.component}'`);
        }
        
        return true;
    });
    
    testRunner.registerTest('ErrorHandlingService', 'Error handling with notice', async () => {
        // Arrange
        const mockLogger = new MockLogger();
        const errorHandler = new ErrorHandlingService(mockLogger);
        const error = new Error('Test error');
        
        // Mock the Notice class
        const originalNotice = (global as any).Notice;
        let noticeMessage = '';
        let noticeTimeout = 0;
        
        // Replace global Notice with mock
        (global as any).Notice = function(message: string, timeout?: number) {
            noticeMessage = message;
            noticeTimeout = timeout || 0;
            return new MockNotice(message, timeout);
        };
        
        try {
            // Act
            errorHandler.handleError(error, 'TestComponent', 'testOperation', 'User-friendly message', true);
            
            // Assert
            if (mockLogger.logs.length !== 1) {
                throw new Error(`Expected 1 log entry, got ${mockLogger.logs.length}`);
            }
            
            if (mockLogger.logs[0].level !== 'error') {
                throw new Error(`Expected log level to be 'error', got '${mockLogger.logs[0].level}'`);
            }
            
            if (mockLogger.logs[0].category !== 'TestComponent') {
                throw new Error(`Expected log category to be 'TestComponent', got '${mockLogger.logs[0].category}'`);
            }
            
            if (mockLogger.logs[0].message !== 'User-friendly message') {
                throw new Error(`Expected log message to be 'User-friendly message', got '${mockLogger.logs[0].message}'`);
            }
            
            if (noticeMessage !== 'OneiroMetrics: User-friendly message') {
                throw new Error(`Expected notice message to be 'OneiroMetrics: User-friendly message', got '${noticeMessage}'`);
            }
            
            return true;
        } finally {
            // Restore the original Notice class
            (global as any).Notice = originalNotice;
        }
    });
    
    testRunner.registerTest('ErrorHandlingService', 'Try execute success', async () => {
        // Arrange
        const mockLogger = new MockLogger();
        const errorHandler = new ErrorHandlingService(mockLogger);
        
        // Act
        const result = await errorHandler.tryExecute<number>(
            'TestComponent',
            'testOperation',
            () => 42
        );
        
        // Assert
        if (result !== 42) {
            throw new Error(`Expected result to be 42, got ${result}`);
        }
        
        if (mockLogger.logs.length !== 0) {
            throw new Error(`Expected 0 log entries, got ${mockLogger.logs.length}`);
        }
        
        return true;
    });
    
    testRunner.registerTest('ErrorHandlingService', 'Try execute failure with fallback', async () => {
        // Arrange
        const mockLogger = new MockLogger();
        const errorHandler = new ErrorHandlingService(mockLogger);
        
        // Mock the Notice class
        const originalNotice = (global as any).Notice;
        let noticeShown = false;
        
        // Replace global Notice with mock
        (global as any).Notice = function(message: string, timeout?: number) {
            noticeShown = true;
            return new MockNotice(message, timeout);
        };
        
        try {
            // Act
            const result = await errorHandler.tryExecute<number>(
                'TestComponent',
                'testOperation',
                () => { throw new Error('Test error'); },
                () => 42
            );
            
            // Assert
            if (result !== 42) {
                throw new Error(`Expected result to be 42, got ${result}`);
            }
            
            if (mockLogger.logs.length !== 1) {
                throw new Error(`Expected 1 log entry, got ${mockLogger.logs.length}`);
            }
            
            if (mockLogger.logs[0].level !== 'error') {
                throw new Error(`Expected log level to be 'error', got '${mockLogger.logs[0].level}'`);
            }
            
            if (!noticeShown) {
                throw new Error('Expected notice to be shown');
            }
            
            return true;
        } finally {
            // Restore the original Notice class
            (global as any).Notice = originalNotice;
        }
    });
    
    testRunner.registerTest('ErrorHandlingService', 'Custom error types', () => {
        // Arrange & Act
        const validationError = new ValidationError('Invalid input', { field: 'username' });
        const serviceError = new ServiceError('Service failed', 'AuthService');
        
        // Assert
        if (validationError.name !== 'ValidationError') {
            throw new Error(`Expected name to be 'ValidationError', got '${validationError.name}'`);
        }
        
        if (validationError.message !== 'Invalid input') {
            throw new Error(`Expected message to be 'Invalid input', got '${validationError.message}'`);
        }
        
        if (validationError.details?.field !== 'username') {
            throw new Error(`Expected details.field to be 'username', got '${validationError.details?.field}'`);
        }
        
        if (serviceError.name !== 'ServiceError') {
            throw new Error(`Expected name to be 'ServiceError', got '${serviceError.name}'`);
        }
        
        if (serviceError.service !== 'AuthService') {
            throw new Error(`Expected service to be 'AuthService', got '${serviceError.service}'`);
        }
        
        return true;
    });
} 