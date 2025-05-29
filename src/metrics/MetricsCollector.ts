/**
 * MetricsCollector
 * 
 * Handles collecting metrics from dream journal entries.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Notice, TFile, TFolder } from 'obsidian';
import DreamMetricsPlugin from '../../main';
import { DreamMetricData, DreamMetricsSettings } from '../../types';
import { ILogger } from '../logging/LoggerTypes';
import { getSelectedFolder, getSelectionMode } from '../utils/settings-helpers';
import { MetricsProcessor } from './MetricsProcessor';

export class MetricsCollector {
    private readonly settings: DreamMetricsSettings;
    private metricsProcessor: MetricsProcessor;

    constructor(
        private app: App,
        private plugin: DreamMetricsPlugin,
        private logger?: ILogger
    ) {
        this.settings = plugin.settings;
        this.metricsProcessor = new MetricsProcessor(app, plugin, logger);
    }

    /**
     * Scrape metrics from journal entries
     * 
     * This method:
     * 1. Identifies files to process based on selection mode
     * 2. Processes files in batches to extract metrics
     * 3. Updates the project note with the collected metrics
     */
    public async scrapeMetrics(): Promise<void> {
        this.logger?.info('Scrape', 'Starting metrics collection process');
        
        // Show a notice instead of a modal
        new Notice('Scraping dream metrics... This may take a moment.');

        try {
            // Let the MetricsProcessor handle the actual scraping
            await this.metricsProcessor.scrapeMetrics();
            
            this.logger?.info('Scrape', 'Metrics collection completed successfully');
        } catch (error) {
            this.logger?.error('Scrape', 'Error in scrapeMetrics', error as Error);
            new Notice(`Error scraping metrics: ${error.message}`);
        }
    }
} 