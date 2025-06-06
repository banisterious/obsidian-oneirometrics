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
     * Generate a unique scrape ID based on dream entries content
     * This ID changes when the underlying data changes, invalidating cache
     */
    generateScrapeId(dreamEntries: DreamMetricData[]): string {
        try {
            console.log('🔄 SCRAPE ID DEBUG: Generating scrape ID for', dreamEntries.length, 'entries');
            
            if (!dreamEntries || dreamEntries.length === 0) {
                console.log('🔄 SCRAPE ID DEBUG: Empty dataset - returning empty-dataset');
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
            console.log('🔄 SCRAPE ID DEBUG: Full signature length:', fullSignature.length);
            console.log('🔄 SCRAPE ID DEBUG: Entry count:', entryCount, 'Total metrics:', totalMetrics);
            
            // Generate hash-like ID (simple but effective)
            const scrapeId = btoa(fullSignature)
                .replace(/[+/=]/g, '') // Remove base64 special chars
                .slice(0, 16);

            console.log('🔄 SCRAPE ID DEBUG: Generated scrape ID:', scrapeId);

            this.logger?.debug('ChartDataPersistence', 'Generated scrape ID', {
                scrapeId,
                entryCount,
                totalMetrics
            });

            return scrapeId;
        } catch (error) {
            console.error('🔄 SCRAPE ID DEBUG: Error generating scrape ID:', error);
            this.logger?.error('ChartDataPersistence', 'Error generating scrape ID', error);
            return `error-${Date.now()}`;
        }
    }

    /**
     * Save chart data to plugin storage with invalidation metadata
     */
    async saveChartData(data: ChartTabData, dreamEntries: DreamMetricData[]): Promise<void> {
        try {
            this.logger?.debug('ChartDataPersistence', 'Saving chart data to cache');

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
            console.log('🔄 SAVE DEBUG: Existing plugin data keys before save:', Object.keys(existingData));
            console.log('🔄 SAVE DEBUG: Saving under key:', ChartDataPersistence.CHART_DATA_KEY);
            
            existingData[ChartDataPersistence.CHART_DATA_KEY] = persistedData;
            
            console.log('🔄 SAVE DEBUG: Plugin data keys after adding chart data:', Object.keys(existingData));
            
            // Save back to plugin data storage
            await this.plugin.saveData(existingData);
            
            console.log('🔄 SAVE DEBUG: Plugin data saved successfully');

            this.logger?.info('ChartDataPersistence', 'Chart data saved successfully', {
                scrapeId,
                entryCount: persistedData.entryCount,
                metricsCount: persistedData.metricsCount
            });

        } catch (error) {
            this.logger?.error('ChartDataPersistence', 'Failed to save chart data', error);
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
                this.logger?.debug('ChartDataPersistence', 'No cached chart data found');
                return null;
            }

            // Generate current scrape ID for comparison
            const currentScrapeId = this.generateScrapeId(currentDreamEntries);
            
            // Check if cached data is still valid
            if (!this.isDataValid(savedData, currentScrapeId, currentDreamEntries)) {
                this.logger?.debug('ChartDataPersistence', 'Cached data invalid, clearing cache');
                await this.clearChartData();
                return null;
            }

            this.logger?.info('ChartDataPersistence', 'Successfully restored chart data from cache', {
                scrapeId: savedData.scrapeId,
                age: Date.now() - savedData.timestamp,
                entryCount: savedData.entryCount
            });

            return savedData.data;

        } catch (error) {
            this.logger?.error('ChartDataPersistence', 'Error restoring chart data', error);
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

        // Scrape ID check (most important - data content match)
        if (savedData.scrapeId !== currentScrapeId) {
            return false;
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
            
            this.logger?.debug('ChartDataPersistence', 'Chart data cache cleared');
        } catch (error) {
            this.logger?.error('ChartDataPersistence', 'Error clearing chart data', error);
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
            console.log('🔄 CACHE DEBUG: getCacheStatus called with', dreamEntries.length, 'entries');
            
            const data = await this.plugin.loadData();
            console.log('🔄 CACHE DEBUG: Plugin data loaded:', !!data);
            console.log('🔄 CACHE DEBUG: Plugin data keys:', data ? Object.keys(data) : 'no data');
            console.log('🔄 CACHE DEBUG: Looking for key:', ChartDataPersistence.CHART_DATA_KEY);
            
            const cachedData = data?.[ChartDataPersistence.CHART_DATA_KEY] as PersistedChartData;
            console.log('🔄 CACHE DEBUG: Cached data found:', !!cachedData);
            
            if (!cachedData) {
                this.logger?.debug('ChartPersistence', 'No cached data found');
                console.log('🔄 CACHE DEBUG: No cached data - returning hasCache: false');
                return { hasCache: false };
            }

            console.log('🔄 CACHE DEBUG: Cached data details:', {
                scrapeId: cachedData.scrapeId,
                entryCount: cachedData.entryCount,
                metricsCount: cachedData.metricsCount,
                timestamp: cachedData.timestamp,
                version: cachedData.version
            });

            // Generate current scrape ID for comparison
            const currentScrapeId = this.generateScrapeId(dreamEntries);
            console.log('🔄 CACHE DEBUG: Current scrape ID:', currentScrapeId);
            console.log('🔄 CACHE DEBUG: Cached scrape ID:', cachedData.scrapeId);
            console.log('🔄 CACHE DEBUG: Scrape IDs match:', currentScrapeId === cachedData.scrapeId);
            
            // Validate cache
            const isValid = this.validateCachedData(cachedData, currentScrapeId, dreamEntries.length);
            console.log('🔄 CACHE DEBUG: Cache validation result:', isValid);
            
            return {
                hasCache: true,
                isValid,
                scrapeId: cachedData.scrapeId,
                timestamp: cachedData.timestamp,
                entryCount: cachedData.entryCount
            };
        } catch (error) {
            console.error('🔄 CACHE DEBUG: Error in getCacheStatus:', error);
            this.logger?.error('ChartPersistence', 'Error checking cache status', error as Error);
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
                this.logger?.debug('ChartPersistence', 'Cache invalid: version mismatch');
                return false;
            }

            // Check if scrape ID matches (data hasn't changed)
            if (cachedData.scrapeId !== currentScrapeId) {
                this.logger?.debug('ChartPersistence', 'Cache invalid: scrape ID mismatch');
                return false;
            }

            // Check entry count
            if (cachedData.entryCount !== currentEntryCount) {
                this.logger?.debug('ChartPersistence', 'Cache invalid: entry count mismatch');
                return false;
            }

            // Check age (7 days max)
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            const age = Date.now() - cachedData.timestamp;
            if (age > maxAge) {
                this.logger?.debug('ChartPersistence', 'Cache invalid: too old');
                return false;
            }

            return true;
        } catch (error) {
            this.logger?.error('ChartPersistence', 'Error validating cache', error as Error);
            return false;
        }
    }
} 