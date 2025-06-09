import { App, Notice } from 'obsidian';
import { DreamMetricsState } from '../../state/DreamMetricsState';
import { TimeFilterManager } from '../../timeFilters';
import { EnhancedDateNavigatorModal } from '../modals/EnhancedDateNavigatorModal';
import { ILogger } from '../../logging/LoggerTypes';

declare const globalLogger: ILogger | undefined;

/**
 * Manages date navigator functionality including entry collection, test data generation,
 * and modal initialization for the date-based navigation system
 */
export class DateNavigatorManager {
    constructor(
        private app: App,
        private plugin: any,
        private state: DreamMetricsState,
        private timeFilterManager: TimeFilterManager,
        private memoizedTableData: Map<string, any>,
        private logger?: ILogger
    ) {}

    /**
     * Shows the date navigator modal with prepared dream entries
     * Handles entry collection from multiple sources and test data generation
     */
    public showDateNavigator(): void {
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', 'showDateNavigator called - creating DateNavigatorModal');
            }
            
            // Validate required dependencies
            if (!this.validateDependencies()) {
                return;
            }
            
            // Collect all dream entries from various sources
            const allEntries = this.collectDreamEntries();
            
            // Expose entries globally for DateNavigator access
            this.exposeEntriesGlobally(allEntries);
            
            // Create and open the modal
            this.createAndOpenModal();
            
        } catch (error) {
            this.handleError('Failed to open date navigator', error);
        }
    }

    /**
     * Validate that required dependencies are available
     */
    private validateDependencies(): boolean {
        // Make sure state is available
        if (!this.state) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('Plugin', 'Cannot show DateNavigator: state is undefined');
            }
            new Notice('Error: Dream state not available');
            return false;
        }
        
        // Make sure timeFilterManager is available
        if (!this.timeFilterManager) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('Plugin', 'Cannot show DateNavigator: timeFilterManager is undefined');
            }
            new Notice('Error: Time filter manager not available');
            return false;
        }
        
        return true;
    }

    /**
     * Collect dream entries from all available sources
     */
    private collectDreamEntries(): any[] {
        const allEntries: any[] = [];
        
        try {
            // 1. Try direct state entries
            this.collectStateEntries(allEntries);
            
            // 2. Try to directly extract data from memoized tables
            this.collectTableEntries(allEntries);
            
            // Log what we found
            this.logCollectionResults(allEntries);
            
            // Create test entries if none exist
            if (allEntries.length === 0) {
                this.generateTestEntries(allEntries);
            }
            
        } catch (err) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('Plugin', 'Error checking entries:', err);
            }
        }
        
        return allEntries;
    }

    /**
     * Collect entries from the plugin state
     */
    private collectStateEntries(allEntries: any[]): void {
        const entries = this.state.getDreamEntries();
        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
            window['globalLogger'].debug('Plugin', `Found ${entries?.length || 0} entries in state.getDreamEntries()`);
        }
        
        if (entries && Array.isArray(entries) && entries.length > 0) {
            allEntries.push(...entries);
        }
    }

    /**
     * Collect entries from memoized table data
     */
    private collectTableEntries(allEntries: any[]): void {
        if (this.memoizedTableData && this.memoizedTableData.size > 0) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', `Found ${this.memoizedTableData.size} tables to scan for entries`);
            }
            
            // Look at each table in the memoized data
            this.memoizedTableData.forEach((tableData, key) => {
                this.processTableData(tableData, key, allEntries);
            });
        }
    }

    /**
     * Process individual table data to extract dream entries
     */
    private processTableData(tableData: any, key: string, allEntries: any[]): void {
        if (Array.isArray(tableData) && tableData.length > 0) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', `Processing table ${key} with ${tableData.length} rows`);
            }
            
            // Only process tables with rows that have date fields
            if (tableData[0] && (tableData[0].date || tableData[0].dream_date)) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('Plugin', `Table ${key} has valid date format`);
                }
                
                // Extract dream entries from table rows
                tableData.forEach(row => {
                    const entry = this.createEntryFromRow(row, key);
                    if (entry) {
                        allEntries.push(entry);
                    }
                });
            }
        }
    }

    /**
     * Create a dream entry from a table row
     */
    private createEntryFromRow(row: any, tableKey: string): any | null {
        if (!row || (!row.date && !row.dream_date)) {
            return null;
        }
        
        const dateField = row.date || row.dream_date;
        
        // Create a dream entry from this row
        const entry = {
            date: dateField,
            title: row.title || row.dream_title || 'Dream Entry',
            content: row.content || row.dream_content || '',
            source: `table-${tableKey}`,
            metrics: row.metrics || {}
        };
        
        // Add any numeric properties as metrics
        Object.keys(row).forEach(field => {
            if (typeof row[field] === 'number' && !['id', 'index'].includes(field)) {
                if (!entry.metrics) entry.metrics = {};
                entry.metrics[field] = row[field];
            }
        });
        
        return entry;
    }

    /**
     * Log the results of entry collection
     */
    private logCollectionResults(allEntries: any[]): void {
        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
            window['globalLogger'].debug('Plugin', `Found ${allEntries.length} total entries from all sources`);
            
            // Log a sample for debugging
            if (allEntries.length > 0) {
                window['globalLogger'].debug('Plugin', 'Sample entry:', allEntries[0]);
            }
        }
    }

    /**
     * Generate test entries if no real entries are found
     */
    private generateTestEntries(allEntries: any[]): void {
        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
            window['globalLogger'].debug('Plugin', 'No entries found, creating test entries for calendar');
        }
        
        // Create simple test entries for May 2025
        const testEntries = [];
        const month = new Date(2025, 4, 1); // May 2025
        
        // Add 10 entries on random days
        for (let i = 0; i < 10; i++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const dateStr = `2025-05-${day.toString().padStart(2, '0')}`;
            
            testEntries.push({
                date: dateStr,
                title: `Test Dream ${i+1}`,
                content: `Test dream content for ${dateStr}`,
                source: 'test-generator',
                metrics: {
                    clarity: Math.floor(Math.random() * 10) + 1,
                    intensity: Math.floor(Math.random() * 10) + 1
                }
            });
        }
        
        // Add to our collected entries
        allEntries.push(...testEntries);
        
        // Update the state with these test entries
        this.updateStateWithTestEntries(testEntries);
    }

    /**
     * Update the plugin state with generated test entries
     */
    private updateStateWithTestEntries(testEntries: any[]): void {
        if (typeof this.state.updateDreamEntries === 'function') {
            this.state.updateDreamEntries(testEntries);
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', 'Added test entries to state');
            }
        } else {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('Plugin', 'Cannot add test entries: updateDreamEntries not available');
            }
        }
    }

    /**
     * Expose entries globally so the DateNavigator can find them
     */
    private exposeEntriesGlobally(allEntries: any[]): void {
        try {
            window['dreamEntries'] = allEntries;
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', `Exposed ${allEntries.length} entries to window.dreamEntries`);
            }
        } catch (e) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('Plugin', 'Failed to expose entries globally:', e);
            }
        }
    }

    /**
     * Create and open the DateSelectionModal
     */
    private createAndOpenModal(): void {
        // Log the modal initialization for debugging
        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
            window['globalLogger'].info('DateNavigatorManager', 'Creating clean DateSelectionModal');
            window['globalLogger'].debug('DateNavigatorManager', 'Modal dependencies check', {
                hasApp: !!this.app,
                hasTimeFilterManager: !!this.timeFilterManager,
                hasPlugin: !!this.plugin,
                timeFilterManagerType: typeof this.timeFilterManager
            });
        }
        
        // Create a new EnhancedDateNavigatorModal instance with pattern visualization
        const modal = new EnhancedDateNavigatorModal(this.app, this.timeFilterManager, this.plugin);
        
        // Verify that the modal was created successfully
        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
            window['globalLogger'].info('DateNavigatorManager', 'EnhancedDateNavigatorModal created - advanced pattern visualization interface');
            window['globalLogger'].debug('DateNavigatorManager', 'Modal created successfully', {
                modalType: modal.constructor.name,
                hasModal: !!modal
            });
        }
        
        // Open the modal
        try {
            modal.open();
            
            // Log successful opening
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].info('DateNavigatorManager', 'Enhanced Date Navigator Modal opened successfully');
            }
            
            // Add a notice to help users understand the new interface
            new Notice('📊 Enhanced Date Navigator opened! Explore dream patterns with visualization options dropdown.', 4000);
            
        } catch (error) {
            this.handleError('Failed to open DateSelectionModal', error);
        }
    }

    /**
     * Handle errors that occur during date navigator operations
     */
    private handleError(message: string, error: any): void {
        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
            window['globalLogger'].error('Plugin', message + ':', error);
        }
        new Notice('Error opening Date Navigator. See console for details.');
    }
} 