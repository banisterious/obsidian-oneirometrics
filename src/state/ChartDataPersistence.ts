import { App, Plugin } from 'obsidian';
import { ChartTabData } from '../dom/charts/MetricsChartTabs';
import { DreamMetricData } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';

interface PersistedChartData {
    data: ChartTabData;
    scrapeId: string;
    timestamp: number;
    version: string;
    entryCount: number;
    metricsCount: number;
}

export class ChartDataPersistence {
    private static readonly CHART_DATA_KEY = 'oneirometrics-chart-data';
    private static readonly VERSION = '1.0';
    
    private app: App;
    private plugin: Plugin;
    private logger?: ILogger;

    constructor(app: App, plugin: Plugin, logger?: ILogger) {
        this.app = app;
        this.plugin = plugin;
        this.logger = logger;
    }

    /**
     * Debug helper that respects log level settings
     */
    private debugLog(message: string, ...args: any[]): void {
        // Only log if logger is available and configured for debug level
        if (this.logger) {
            this.logger.debug('ChartDataPersistence', message, ...args);
        }
    }

    /**
     * Generate a unique scrape ID based on dream entries content
     * This ID changes when the underlying data changes, invalidating cache
     */
    generateScrapeId(dreamEntries: DreamMetricData[]): string {
        if (this.logger) {
            this.logger.debug('ChartDataPersistence', 'Generating scrape ID for entries', { count: dreamEntries.length });
        }
        
        if (!dreamEntries || dreamEntries.length === 0) {
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Empty dataset - returning empty-dataset');
            }
            return 'empty-dataset';
        }

        // Create content signature based on entries and their metrics
        const contentSignature = dreamEntries
            .map(entry => {
                const metricKeys = Object.keys(entry.metrics || {}).sort();
                const metricValues = metricKeys.map(key => entry.metrics?.[key] || 0);
                return `${entry.date}-${metricKeys.length}-${metricValues.join(',')}`;
            })
            .join('|');

        // Add entry count and total metrics for quick validation
        const entryCount = dreamEntries.length;
        const totalMetrics = dreamEntries.reduce((total, entry) => 
            total + Object.keys(entry.metrics || {}).length, 0
        );

        const fullSignature = `${entryCount}-${totalMetrics}-${contentSignature}`;
        if (this.logger) {
            this.logger.debug('ChartDataPersistence', 'Full signature length:', { length: fullSignature.length });
            this.logger.debug('ChartDataPersistence', 'Entry count:', { count: entryCount, totalMetrics });
        }
        
        // Generate hash-like ID (simple but effective)
        const scrapeId = btoa(fullSignature)
            .replace(/[+/=]/g, '') // Remove base64 special chars
            .slice(0, 16);

        if (this.logger) {
            this.logger.debug('ChartDataPersistence', 'Generated scrape ID:', { scrapeId });
            this.logger.debug('ChartDataPersistence', 'Generated scrape ID details:', {
                scrapeId,
                entryCount,
                totalMetrics
            });
        }

        return scrapeId;
    }

    /**
     * Save chart data to plugin storage with invalidation metadata
     */
    async saveChartData(data: ChartTabData, dreamEntries: DreamMetricData[]): Promise<void> {
        try {
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Saving chart data to cache');
            }

            const scrapeId = this.generateScrapeId(dreamEntries);
            
            const persistedData: PersistedChartData = {
                data,
                scrapeId,
                timestamp: Date.now(),
                version: ChartDataPersistence.VERSION,
                entryCount: dreamEntries.length,
                metricsCount: Object.keys(data.metrics).length
            };

            // Load existing plugin data and add chart data
            const existingData = await this.plugin.loadData() || {};
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Existing plugin data keys before save:', { keys: Object.keys(existingData) });
                this.logger.debug('ChartDataPersistence', 'Saving under key:', ChartDataPersistence.CHART_DATA_KEY);
            }
            
            existingData[ChartDataPersistence.CHART_DATA_KEY] = persistedData;
            
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Plugin data keys after adding chart data:', { keys: Object.keys(existingData) });
            }
            
            // Save back to plugin data storage
            await this.plugin.saveData(existingData);
            
            if (this.logger) {
                this.logger.info('ChartDataPersistence', 'Chart data saved successfully', {
                    scrapeId,
                    entryCount: persistedData.entryCount,
                    metricsCount: persistedData.metricsCount
                });
            }

        } catch (error) {
            if (this.logger) {
                this.logger.error('ChartDataPersistence', 'Failed to save chart data', error);
            }
            throw error;
        }
    }

    /**
     * Restore chart data if it matches current dream entries
     */
    async restoreChartData(currentDreamEntries: DreamMetricData[]): Promise<ChartTabData | null> {
        try {
            // Load plugin data and extract chart data
            const pluginData = await this.plugin.loadData() || {};
            const savedData = pluginData[ChartDataPersistence.CHART_DATA_KEY] as PersistedChartData;
            
            if (!savedData) {
                if (this.logger) {
                    this.logger.debug('ChartDataPersistence', 'No cached chart data found');
                }
                return null;
            }

            // Generate current scrape ID for comparison
            const currentScrapeId = this.generateScrapeId(currentDreamEntries);
            
            // Check if cached data is still valid
            if (!this.isDataValid(savedData, currentScrapeId, currentDreamEntries)) {
                if (this.logger) {
                    this.logger.debug('ChartDataPersistence', 'Cached data invalid, clearing cache');
                }
                await this.clearChartData();
                return null;
            }

            if (this.logger) {
                this.logger.info('ChartDataPersistence', 'Successfully restored chart data from cache', {
                    scrapeId: savedData.scrapeId,
                    age: Date.now() - savedData.timestamp,
                    entryCount: savedData.entryCount
                });
            }

            return savedData.data;

        } catch (error) {
            if (this.logger) {
                this.logger.error('ChartDataPersistence', 'Error restoring chart data', error);
            }
            // Clear corrupted data
            await this.clearChartData();
            return null;
        }
    }

    /**
     * Check if cached data is still valid for current entries
     */
    private isDataValid(savedData: PersistedChartData, currentScrapeId: string, currentEntries: DreamMetricData[]): boolean {
        // Version check
        if (savedData.version !== ChartDataPersistence.VERSION) {
            return false;
        }

        // Scrape ID check with more lenient validation
        // Allow minor differences due to DOM extraction vs file parsing variations
        if (savedData.scrapeId !== currentScrapeId) {
            this.logger?.debug('ChartDataPersistence', 'Scrape ID mismatch, checking if difference is acceptable', {
                saved: savedData.scrapeId,
                current: currentScrapeId,
                savedEntryCount: savedData.entryCount,
                currentEntryCount: currentEntries.length
            });
            
            // If entry counts match and data is recent (less than 1 hour old), allow mismatch
            // This handles cases where DOM extraction produces slightly different metric signatures
            // than the original file parsing due to processing differences
            const oneHour = 60 * 60 * 1000;
            const isRecent = Date.now() - savedData.timestamp < oneHour;
            const entriesMatch = savedData.entryCount === currentEntries.length;
            
            if (!isRecent || !entriesMatch) {
                this.logger?.debug('ChartDataPersistence', 'Scrape ID mismatch not acceptable', {
                    isRecent,
                    entriesMatch,
                    age: Date.now() - savedData.timestamp
                });
                return false;
            }
            
            this.logger?.debug('ChartDataPersistence', 'Scrape ID mismatch accepted due to recent cache and matching entry count');
        }

        // Quick sanity checks
        if (savedData.entryCount !== currentEntries.length) {
            return false;
        }

        // Age check (optional safety net - 7 days max)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        if (Date.now() - savedData.timestamp > maxAge) {
            return false;
        }

        // Data structure validation
        if (!savedData.data || !savedData.data.metrics || !savedData.data.dreamEntries) {
            return false;
        }

        return true;
    }

    /**
     * Clear cached chart data
     */
    async clearChartData(): Promise<void> {
        try {
            // Load existing plugin data and remove chart data
            const existingData = await this.plugin.loadData() || {};
            delete existingData[ChartDataPersistence.CHART_DATA_KEY];
            
            // Save back to plugin data storage
            await this.plugin.saveData(existingData);
            
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Chart data cache cleared');
            }
        } catch (error) {
            if (this.logger) {
                this.logger.error('ChartDataPersistence', 'Error clearing chart data', error);
            }
        }
    }

    /**
     * Get cache status for validation
     */
    async getCacheStatus(dreamEntries: DreamMetricData[]): Promise<{
        hasCache: boolean;
        isValid?: boolean;
        scrapeId?: string;
        timestamp?: number;
        entryCount?: number;
    }> {
        try {
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'getCacheStatus called with entries', { count: dreamEntries.length });
            }
            
            const data = await this.plugin.loadData();
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Plugin data loaded:', !!data);
                this.logger.debug('ChartDataPersistence', 'Plugin data keys:', data ? Object.keys(data) : 'no data');
                this.logger.debug('ChartDataPersistence', 'Looking for key:', ChartDataPersistence.CHART_DATA_KEY);
            }
            
            const cachedData = data?.[ChartDataPersistence.CHART_DATA_KEY] as PersistedChartData;
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Cached data found:', !!cachedData);
            }
            
            if (!cachedData) {
                if (this.logger) {
                    this.logger.debug('ChartDataPersistence', 'No cached data found');
                    this.logger.debug('ChartDataPersistence', 'No cached data - returning hasCache: false');
                }
                return { hasCache: false };
            }

            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Cached data details:', {
                    scrapeId: cachedData.scrapeId,
                    entryCount: cachedData.entryCount,
                    metricsCount: cachedData.metricsCount,
                    timestamp: cachedData.timestamp,
                    version: cachedData.version
                });
            }

            // Generate current scrape ID for comparison
            const currentScrapeId = this.generateScrapeId(dreamEntries);
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Current scrape ID:', currentScrapeId);
                this.logger.debug('ChartDataPersistence', 'Cached scrape ID:', cachedData.scrapeId);
                this.logger.debug('ChartDataPersistence', 'Scrape IDs match:', currentScrapeId === cachedData.scrapeId);
            }
            
            // Validate cache
            const isValid = this.validateCachedData(cachedData, currentScrapeId, dreamEntries.length);
            if (this.logger) {
                this.logger.debug('ChartDataPersistence', 'Cache validation result:', isValid);
            }
            
            return {
                hasCache: true,
                isValid,
                scrapeId: cachedData.scrapeId,
                timestamp: cachedData.timestamp,
                entryCount: cachedData.entryCount
            };
        } catch (error) {
            if (this.logger) {
                this.logger.error('ChartDataPersistence', 'Error in getCacheStatus:', error);
                this.logger.error('ChartDataPersistence', 'Error checking cache status', error as Error);
            }
            return { hasCache: false };
        }
    }

    /**
     * Validate cached data against current state
     */
    private validateCachedData(cachedData: PersistedChartData, currentScrapeId: string, currentEntryCount: number): boolean {
        try {
            // Check version compatibility
            if (cachedData.version !== ChartDataPersistence.VERSION) {
                if (this.logger) {
                    this.logger.debug('ChartDataPersistence', 'Cache invalid: version mismatch');
                }
                return false;
            }

            // Check if scrape ID matches (data hasn't changed)
            if (cachedData.scrapeId !== currentScrapeId) {
                if (this.logger) {
                    this.logger.debug('ChartDataPersistence', 'Scrape ID mismatch, checking if difference is acceptable', {
                        saved: cachedData.scrapeId,
                        current: currentScrapeId,
                        savedEntryCount: cachedData.entryCount,
                        currentEntryCount: currentEntryCount
                    });
                }
                
                // If entry counts match and data is recent (less than 1 hour old), allow mismatch
                // This handles cases where DOM extraction produces slightly different metric signatures
                // than the original file parsing due to processing differences
                const oneHour = 60 * 60 * 1000;
                const isRecent = Date.now() - cachedData.timestamp < oneHour;
                const entriesMatch = cachedData.entryCount === currentEntryCount;
                
                if (!isRecent || !entriesMatch) {
                    if (this.logger) {
                        this.logger.debug('ChartDataPersistence', 'Cache invalid: scrape ID mismatch not acceptable', {
                            isRecent,
                            entriesMatch,
                            age: Date.now() - cachedData.timestamp
                        });
                    }
                    return false;
                }
                
                if (this.logger) {
                    this.logger.debug('ChartDataPersistence', 'Cache invalid: scrape ID mismatch accepted due to recent cache and matching entry count');
                }
            }

            // Check entry count
            if (cachedData.entryCount !== currentEntryCount) {
                if (this.logger) {
                    this.logger.debug('ChartDataPersistence', 'Cache invalid: entry count mismatch');
                }
                return false;
            }

            // Check age (7 days max)
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            const age = Date.now() - cachedData.timestamp;
            if (age > maxAge) {
                if (this.logger) {
                    this.logger.debug('ChartDataPersistence', 'Cache invalid: too old');
                }
                return false;
            }

            return true;
        } catch (error) {
            if (this.logger) {
                this.logger.error('ChartDataPersistence', 'Error validating cache', error as Error);
            }
            return false;
        }
    }
} 