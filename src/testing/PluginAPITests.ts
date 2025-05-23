import { App, TFile } from 'obsidian';
import { PluginAdapter } from '../plugin/PluginAdapter';
import { IPluginAPI } from '../plugin/IPluginAPI';
import { IFileOperations } from '../file-operations/interfaces/IFileOperations';
import { IErrorHandlingService } from '../logging/IErrorHandlingService';
import { DreamMetricsSettings } from '../types';
import { LintingSettings } from '../journal_check/types';

/**
 * Mock plugin class for testing
 */
class MockPlugin {
    public app: any = {
        workspace: {
            getActiveFile: () => null
        },
        vault: {
            getAbstractFileByPath: () => null
        }
    };
    
    public settings: DreamMetricsSettings = {
        projectNotePath: 'metrics.md',
        metrics: {
            lucidity: {
                name: 'Lucidity',
                icon: 'eye',
                minValue: 1,
                maxValue: 5
            }
        },
        selectedNotes: ['journal1.md', 'journal2.md'],
        folderOptions: {
            enabled: false,
            path: 'dreams'
        },
        selectionMode: 'manual',
        calloutName: 'metrics',
        backup: {
            enabled: true,
            maxBackups: 5
        },
        logging: {
            level: 'info'
        },
        linting: {
            enabled: true,
            rules: [],
            structures: [],
            templates: [],
            templaterIntegration: {
                enabled: false,
                folderPath: '',
                defaultTemplate: ''
            },
            contentIsolation: {
                ignoreImages: false,
                ignoreLinks: false,
                ignoreFormatting: false,
                ignoreHeadings: false,
                ignoreCodeBlocks: false,
                ignoreFrontmatter: false,
                ignoreComments: false,
                customIgnorePatterns: []
            },
            userInterface: {
                showInlineValidation: true,
                severityIndicators: {
                    error: '🔴',
                    warning: '🟠',
                    info: '🔵'
                },
                quickFixesEnabled: true
            }
        },
        _stateStorage: {
            dateFormat: 'YYYY-MM-DD'
        }
    };
    
    public logger: any = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        trace: () => {}
    };
    
    public state: any = {};
    
    public cleanupFunctions: Array<() => void> = [];
    
    constructor() {}
    
    async saveSettings(): Promise<void> {
        return Promise.resolve();
    }
    
    parseDate(dateStr: string): Date {
        return new Date(dateStr);
    }
    
    formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
    
    validateDate(date: Date): boolean {
        return date instanceof Date && !isNaN(date.getTime());
    }
}

/**
 * Register plugin API tests
 */
export function registerPluginAPITests(testRunner: any) {
    testRunner.registerTest('PluginAdapter', 'Basic initialization', async () => {
        // Arrange
        const mockPlugin = new MockPlugin();
        
        // Act
        const pluginAdapter = new PluginAdapter(mockPlugin);
        
        // Assert
        if (!pluginAdapter) {
            throw new Error('PluginAdapter failed to initialize');
        }
        
        return true;
    });
    
    testRunner.registerTest('PluginAdapter', 'Settings access', async () => {
        // Arrange
        const mockPlugin = new MockPlugin();
        const pluginAdapter = new PluginAdapter(mockPlugin);
        
        // Act
        const settings = pluginAdapter.getSettings();
        
        // Assert
        if (!settings) {
            throw new Error('getSettings() returned null or undefined');
        }
        
        if (!settings.metrics.lucidity) {
            throw new Error('Expected settings.metrics.lucidity to exist');
        }
        
        if (settings.calloutName !== 'metrics') {
            throw new Error(`Expected settings.calloutName to be 'metrics', got '${settings.calloutName}'`);
        }
        
        if (settings._stateStorage?.dateFormat !== 'YYYY-MM-DD') {
            throw new Error(`Expected settings._stateStorage.dateFormat to be 'YYYY-MM-DD', got '${settings._stateStorage?.dateFormat}'`);
        }
        
        return true;
    });
    
    testRunner.registerTest('PluginAdapter', 'Date utilities', async () => {
        // Arrange
        const mockPlugin = new MockPlugin();
        const pluginAdapter = new PluginAdapter(mockPlugin);
        const testDate = new Date('2025-05-23');
        
        // Act & Assert
        const formattedDate = pluginAdapter.formatDate(testDate);
        if (formattedDate !== '2025-05-23') {
            throw new Error(`Expected formatted date to be '2025-05-23', got '${formattedDate}'`);
        }
        
        const parsedDate = pluginAdapter.parseDate('2025-05-23');
        if (parsedDate.getFullYear() !== 2025 || parsedDate.getMonth() !== 4 || parsedDate.getDate() !== 23) {
            throw new Error('Date parsing failed');
        }
        
        const validationResult = pluginAdapter.validateDate(testDate);
        if (!validationResult) {
            throw new Error('Expected validateDate to return true for a valid date');
        }
        
        return true;
    });
    
    testRunner.registerTest('PluginAdapter', 'Service access', async () => {
        // Arrange
        const mockPlugin = new MockPlugin();
        const pluginAdapter = new PluginAdapter(mockPlugin);
        
        // Act & Assert
        const fileOps = pluginAdapter.getFileOperations();
        if (!fileOps) {
            throw new Error('getFileOperations() returned null or undefined');
        }
        
        const errorHandler = pluginAdapter.getErrorHandler();
        if (!errorHandler) {
            throw new Error('getErrorHandler() returned null or undefined');
        }
        
        const logger = pluginAdapter.getLogger();
        if (!logger) {
            throw new Error('getLogger() returned null or undefined');
        }
        
        const state = pluginAdapter.getState();
        if (!state) {
            throw new Error('getState() returned null or undefined');
        }
        
        const stateAdapter = pluginAdapter.getStateAdapter();
        if (!stateAdapter) {
            throw new Error('getStateAdapter() returned null or undefined');
        }
        
        return true;
    });
    
    testRunner.registerTest('PluginAdapter', 'Error handling integration', async () => {
        // Arrange
        const mockPlugin = new MockPlugin();
        const pluginAdapter = new PluginAdapter(mockPlugin);
        let errorLogged = false;
        
        // Override the logger's error method to track if it's called
        mockPlugin.logger.error = () => {
            errorLogged = true;
        };
        
        // Act - call a method that should use error handling
        try {
            await pluginAdapter.openFile('non-existent-file.md');
            throw new Error('openFile should have thrown an error for non-existent file');
        } catch (error) {
            // Assert - verify the error was logged through the error handler
            if (!errorLogged) {
                throw new Error('Error handler was not used to log the error');
            }
        }
        
        return true;
    });
    
    testRunner.registerTest('PluginAdapter', 'Event registration', async () => {
        // Arrange
        const mockPlugin = new MockPlugin();
        const pluginAdapter = new PluginAdapter(mockPlugin);
        let cleanupCalled = false;
        
        // Act
        const unregister = pluginAdapter.onUnload(() => {
            cleanupCalled = true;
        });
        
        // Call unregister function
        unregister();
        
        // Assert
        if (mockPlugin.cleanupFunctions.length !== 0) {
            throw new Error('Failed to unregister event handler');
        }
        
        return true;
    });
} 