/**
 * DebugTools
 * 
 * A utility class that provides debugging functionality for the OneiroMetrics plugin.
 * Consolidates various debugging methods that were previously scattered in main.ts.
 */

import { App, MarkdownView, Plugin } from 'obsidian';
import { ContentParser } from '../parsing/services/ContentParser';
import { format } from 'date-fns';
import { getLogger } from '../logging';
import { ILogger } from '../logging/LoggerTypes';
import { DateNavigatorIntegration } from '../dom/date-navigator/DateNavigatorIntegration';

export class DebugTools {
    private plugin: any; // Use any type to avoid circular reference
    private app: App;
    private logger: ILogger;

    constructor(plugin: any, app: App, logger?: ILogger) {
        this.plugin = plugin;
        this.app = app;
        this.logger = logger || window['globalLogger'] || getLogger('DebugTools');
    }

    /**
     * Debug the table data in the plugin
     * This will dump all table data to help diagnose issues with the date navigator
     */
    public debugTableData(): void {
        try {
            this.logger.debug('Plugin', 'Running debugTableData function');
            
            // Output basic info about available data
            this.logger.debug('Debug', '==== DREAM METRICS DEBUG ====');
            this.logger.debug('Debug', 'Plugin initialized', { available: !!this.plugin });
            this.logger.debug('Debug', 'State initialized', { available: !!this.plugin.state });
            this.logger.debug('Debug', 'State has getDreamEntries', { 
                available: !!(this.plugin.state && typeof this.plugin.state.getDreamEntries === 'function') 
            });
            
            // Check for direct entries
            if (this.plugin.state && typeof this.plugin.state.getDreamEntries === 'function') {
                const entries = this.plugin.state.getDreamEntries();
                this.logger.debug('Debug', 'Direct state entries', { count: entries?.length || 0 });
                if (entries && entries.length > 0) {
                    this.logger.debug('Debug', 'Sample entry', { entry: entries[0] });
                }
            }
            
            // Check table data
            if (this.plugin.memoizedTableData) {
                this.logger.debug('Debug', 'Table data', { count: this.plugin.memoizedTableData.size });
                
                // Loop through all tables
                this.plugin.memoizedTableData.forEach((data, key) => {
                    this.logger.debug('Debug', `Table ${key}`, { rowCount: data?.length || 0 });
                    
                    // Check the first row if available
                    if (data && data.length > 0) {
                        this.logger.debug('Debug', `Table ${key} sample`, { row: data[0] });
                        this.logger.debug('Debug', `Row fields`, { fields: Object.keys(data[0]) });
                        
                        // Check for date fields
                        const hasDate = data[0].date !== undefined;
                        const hasDreamDate = data[0].dream_date !== undefined;
                        this.logger.debug('Debug', 'Date fields availability', { 
                            hasDate, 
                            hasDreamDate 
                        });
                        
                        // Find all date-like fields
                        const dateFields = Object.keys(data[0]).filter(key => 
                            key.includes('date') || 
                            (typeof data[0][key] === 'string' && data[0][key].match(/^\d{4}-\d{2}-\d{2}/))
                        );
                        this.logger.debug('Debug', 'Potential date fields', { fields: dateFields });
                        
                        // Show values of these fields
                        dateFields.forEach(field => {
                            this.logger.debug('Debug', `Values of field ${field}`, { 
                                values: data.slice(0, 5).map(row => row[field])
                            });
                        });
                        
                        // Check for metrics
                        const numericFields = Object.keys(data[0]).filter(key => 
                            typeof data[0][key] === 'number' && 
                            !['id', 'index'].includes(key)
                        );
                        this.logger.debug('Debug', 'Potential metric fields', { fields: numericFields });
                        
                        // Create an example dream entry from this data
                        if (dateFields.length > 0) {
                            this.logger.debug('Debug', 'Example entry conversion');
                            const dateField = dateFields[0];
                            const example = {
                                date: data[0][dateField],
                                title: data[0].title || data[0].dream_title || 'Dream Entry',
                                content: data[0].content || data[0].dream_content || '',
                                source: `table-${key}`,
                                metrics: {}
                            };
                            
                            // Add metrics
                            numericFields.forEach(field => {
                                example.metrics[field] = data[0][field];
                            });
                            
                            this.logger.debug('Debug', 'Example entry', { entry: example });
                        }
                    }
                });
            } else {
                this.logger.debug('Debug', 'No memoizedTableData available');
            }
            
            // DIRECT TABLE SCANNING FROM THE ACTIVE NOTE VIEW
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView) {
                this.logger.debug('Debug', '==== ACTIVE NOTE TABLE SCAN ====');
                this.logger.debug('Debug', 'Active note', { path: activeView.file?.path || 'Unknown' });
                
                // Get the HTML content from the preview
                const previewEl = activeView.previewMode?.containerEl?.querySelector('.markdown-preview-view');
                if (previewEl) {
                    this.logger.debug('Debug', 'Found preview element, scanning for tables');
                    
                    // Find all tables in the preview
                    const tables = previewEl.querySelectorAll('table');
                    this.logger.debug('Debug', 'Tables found in active note', { count: tables.length });
                    
                    // Process each table
                    const extractedEntries: any[] = [];
                    
                    tables.forEach((table, tableIndex) => {
                        this.logger.debug('Debug', `Processing table`, { index: tableIndex + 1, total: tables.length });
                        
                        // Get headers
                        const headerRow = table.querySelector('thead tr');
                        if (!headerRow) {
                            this.logger.debug('Debug', `Table has no header row, skipping`, { tableIndex: tableIndex + 1 });
                            return;
                        }
                        
                        const headers: string[] = [];
                        headerRow.querySelectorAll('th').forEach(th => {
                            headers.push(th.textContent?.trim() || '');
                        });
                        
                        this.logger.debug('Debug', `Table headers`, { tableIndex: tableIndex + 1, headers });
                        
                        // Find date column index
                        const dateColumnIndex = headers.findIndex(h => 
                            h.toLowerCase().includes('date') || 
                            h.toLowerCase() === 'when'
                        );
                        
                        if (dateColumnIndex === -1) {
                            this.logger.debug('Debug', `Table has no date column, skipping`, { tableIndex: tableIndex + 1 });
                            return;
                        }
                        
                        this.logger.debug('Debug', `Date column found`, { 
                            tableIndex: tableIndex + 1, 
                            column: headers[dateColumnIndex], 
                            index: dateColumnIndex 
                        });
                        
                        // Process rows
                        const rows = table.querySelectorAll('tbody tr');
                        this.logger.debug('Debug', `Table rows`, { tableIndex: tableIndex + 1, count: rows.length });
                        
                        // Keep track of columns that might contain metrics
                        const potentialMetricColumns: number[] = [];
                        
                        // Process each row
                        rows.forEach((row, rowIndex) => {
                            const cells = row.querySelectorAll('td');
                            if (cells.length < headers.length) {
                                return; // Skip incomplete rows
                            }
                            
                            // Get date value
                            const dateCell = cells[dateColumnIndex];
                            const dateText = dateCell.textContent?.trim() || '';
                            
                            // Skip rows without dates
                            if (!dateText) {
                                return;
                            }
                            
                            // Try to parse the date
                            let parsedDate = '';
                            
                            // Try different date formats
                            try {
                                // Check if it's already in YYYY-MM-DD format
                                if (/^\d{4}-\d{2}-\d{2}/.test(dateText)) {
                                    parsedDate = dateText.substring(0, 10);
                                } else {
                                    // Try to parse as a Date object
                                    const date = new Date(dateText);
                                    if (!isNaN(date.getTime())) {
                                        parsedDate = date.toISOString().split('T')[0];
                                    }
                                }
                            } catch (e) {
                                this.logger.debug('Debug', `Error parsing date`, { dateText, error: e });
                            }
                            
                            if (!parsedDate) {
                                this.logger.debug('Debug', `Could not parse date, skipping row`, { dateText });
                                return;
                            }
                            
                            // Create an entry object
                            const entry: any = {
                                date: parsedDate,
                                source: `active-note-table-${tableIndex + 1}`,
                                metrics: {}
                            };
                            
                            // Process other cells
                            cells.forEach((cell, cellIndex) => {
                                if (cellIndex === dateColumnIndex) return; // Skip date column
                                
                                const header = headers[cellIndex] || `column${cellIndex}`;
                                const value = cell.textContent?.trim() || '';
                                
                                // Check if this is a title/content column
                                if (header.toLowerCase().includes('title') || 
                                    header.toLowerCase().includes('dream') || 
                                    header.toLowerCase() === 'what') {
                                    entry.title = value;
                                } else if (header.toLowerCase().includes('content') || 
                                           header.toLowerCase().includes('description') || 
                                           header.toLowerCase() === 'notes') {
                                    entry.content = value;
                                } else {
                                    // Try to parse as number for metrics
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue)) {
                                        entry.metrics[header.toLowerCase()] = numValue;
                                        
                                        // Track this as a potential metric column
                                        if (!potentialMetricColumns.includes(cellIndex)) {
                                            potentialMetricColumns.push(cellIndex);
                                        }
                                    } else {
                                        // Store as regular property
                                        entry[header.toLowerCase()] = value;
                                    }
                                }
                            });
                            
                            // Make sure we have title and content
                            if (!entry.title) {
                                entry.title = `Dream on ${parsedDate}`;
                            }
                            
                            if (!entry.content) {
                                entry.content = `Dream entry from table ${tableIndex + 1}, row ${rowIndex + 1}`;
                            }
                            
                            // Add to entries
                            extractedEntries.push(entry);
                        });
                        
                        this.logger.debug('Debug', 'Potential metric columns', { 
                            tableIndex: tableIndex + 1,
                            columns: potentialMetricColumns.map(i => headers[i])
                        });
                    });
                    
                    this.logger.debug('Debug', 'Extracted entries from tables', { count: extractedEntries.length });
                    if (extractedEntries.length > 0) {
                        this.logger.debug('Debug', 'Sample extracted entry', { entry: extractedEntries[0] });
                    }
                } else {
                    this.logger.debug('Debug', 'No preview element found in active view');
                }
            } else {
                this.logger.debug('Debug', 'No active markdown view');
            }
            
            this.logger.debug('Debug', '==== END DREAM METRICS DEBUG ====');
        } catch (error) {
            this.logger.error('Debug', 'Error in debugTableData', { error });
        }
    }

    /**
     * Debug the date navigator component
     */
    public debugDateNavigator(): void {
        try {
            this.logger.debug('Plugin', '===== CALENDAR DEBUG FUNCTION =====');
            
            // First show the date navigator
            this.plugin.showDateNavigator();
            
            // Capture the modal that was created
            const dateNavigatorModals = document.querySelectorAll('.dream-metrics-navigator-modal');
            
            if (dateNavigatorModals.length > 0) {
                this.logger.debug('Plugin', `Found ${dateNavigatorModals.length} date navigator modals`);
                
                // Focus on the first modal
                const modal = dateNavigatorModals[0];
                
                // Check for day cells in the modal
                const dayCells = modal.querySelectorAll('.oom-day-cell');
                this.logger.debug('Plugin', `Found ${dayCells.length} day cells in modal`);
                
                // Check for day cells with entries
                const dayCellsWithEntries = modal.querySelectorAll('.oom-day-cell.has-entries');
                this.logger.debug('Plugin', `Found ${dayCellsWithEntries.length} day cells with entries`);
                
                // Check for indicators in cells
                const dotsElements = modal.querySelectorAll('.oom-dream-indicators');
                this.logger.debug('Plugin', `Found ${dotsElements.length} dot indicator elements`);
                
                const metricsElements = modal.querySelectorAll('.oom-day-metrics');
                this.logger.debug('Plugin', `Found ${metricsElements.length} metrics star elements`);
                
                // IMPORTANT: Find the actual DateNavigator instance
                setTimeout(() => {
                    try {
                        // First, find the modal container
                        const dateNavComponent = this.plugin.dateNavigator;
                        if (dateNavComponent && dateNavComponent.dateNavigator) {
                            this.logger.debug('Plugin', 'Found DateNavigator component instance');
                            
                            // Simple approach - just create test entries for now
                            // We'll revisit this after the refactoring
                            this.logger.debug('Plugin', 'Creating test entries for calendar visualization');
                            
                            // Create guaranteed test entries for the calendar
                            dateNavComponent.dateNavigator.createGuaranteedEntriesForCurrentMonth();
                            
                            // Force update UI
                            dateNavComponent.dateNavigator.updateMonthGrid();
                            
                            this.logger.debug('Plugin', 'Forced creation of guaranteed entries for calendar');
                        } else {
                            this.logger.warn('Plugin', 'Could not find DateNavigator component instance');
                        }
                    } catch (err) {
                        this.logger.error('Plugin', 'Error accessing DateNavigator component:', err);
                    }
                }, 100);
            } else {
                this.logger.warn('Plugin', 'No date navigator modal found in DOM');
            }
            
            // Try another approach - see if the debug function is available globally
            if (window['debugDateNavigator'] && typeof window['debugDateNavigator'] === 'function') {
                this.logger.debug('Plugin', 'Calling global debugDateNavigator function');
                window['debugDateNavigator']();
            } else {
                this.logger.warn('Plugin', 'Global debugDateNavigator function not available');
            }
            
            // Run a special debug check on global entries
            const globalEntries = window['dreamEntries'] || [];
            
            this.logger.debug('Plugin', `Found ${globalEntries.length} entries in window.dreamEntries`);
            
            // Get entries for current month
            const today = new Date();
            const currentMonthYear = format(today, 'yyyy-MM');
            const entriesForCurrentMonth = globalEntries.filter((entry: any) => 
                entry && typeof entry.date === 'string' && entry.date.startsWith(currentMonthYear)
            );
            
            this.logger.debug('Plugin', `Found ${entriesForCurrentMonth.length} entries for current month ${currentMonthYear}`);
            
            // Log sample entries
            if (entriesForCurrentMonth.length > 0) {
                this.logger.debug('Plugin', 'Sample entries for current month:');
                entriesForCurrentMonth.slice(0, 3).forEach((entry: any, i: number) => {
                    this.logger.debug('Plugin', `Entry ${i+1}:`, entry);
                });
            }
            
            this.logger.debug('Plugin', '===== END CALENDAR DEBUG FUNCTION =====');
        } catch (e) {
            this.logger.error('Plugin', 'Error in debugDateNavigator:', e);
        }
    }

    /**
     * Test the ContentParser directly
     */
    public testContentParserDirectly(): string {
        const logger = getLogger('ContentParserTest');
        
        // Create a ContentParser instance
        const parser = new ContentParser();
        
        // Test note content with a dream callout
        const testContent = `
# Test Note

[!dream] Test Dream
This is a test dream.
Clarity: 4, Vividness: 3

[!memory] Memory Entry
This is a memory.
Emotional Impact: 5, Detail: 4
`;

        // Test parameter variations
        logger.debug('Test', '=== CONTENT PARSER PARAMETER VARIATION TESTS ===');
        
        // Test 1: content only
        const test1 = parser.extractDreamEntries(testContent);
        logger.debug('Test', 'Test 1 (content only)', { result: test1 });
        
        // Test 2: content + callout type
        const test2 = parser.extractDreamEntries(testContent, 'memory');
        logger.debug('Test', 'Test 2 (content, type)', { result: test2 });
        
        // Test 3: content + source
        const test3 = parser.extractDreamEntries(testContent, 'test.md');
        logger.debug('Test', 'Test 3 (content, source)', { result: test3 });
        
        // Test 4: content + type + source
        const test4 = parser.extractDreamEntries(testContent, 'dream', 'test.md');
        logger.debug('Test', 'Test 4 (content, type, source)', { result: test4 });
        
        // Test 5: static factory method
        const parser2 = ContentParser.create();
        const test5 = parser2.extractDreamEntries(testContent);
        logger.debug('Test', 'Test 5 (factory method)', { result: test5 });
        
        return "ContentParser direct tests complete - check logs for results";
    }

    /**
     * Register global debug functions
     * Adds debug functions to the window object for easy access from the console
     */
    public registerGlobalDebugFunctions(): void {
        // Add the debug functions to the window object
        window['debugTableData'] = this.debugTableData.bind(this);
        window['debugDateNavigator'] = this.debugDateNavigator.bind(this);
        window['testContentParserDirectly'] = this.testContentParserDirectly.bind(this);
        
        this.logger.debug('Debug', 'Registered global debug functions on window object');
    }
} 