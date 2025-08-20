/**
 * TableGenerator
 * 
 * Handles the generation of HTML tables for metrics display.
 * Extracted from main.ts during the refactoring process.
 */

import { DreamMetricData, DreamMetricsSettings, DreamMetric } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import safeLogger from '../../logging/safe-logger';
import { RECOMMENDED_METRICS_ORDER, DISABLED_METRICS_ORDER } from '../../../settings';
import { parseDate, formatDate } from '../../utils/date-utils';
import { ChartTabsManager } from '../charts/ChartTabsManager';
import { App, Plugin } from 'obsidian';

export class TableGenerator {
    private memoizedTableData = new Map<string, string>();
    private chartTabsManager: ChartTabsManager;
    
    constructor(
        private settings: DreamMetricsSettings,
        private logger?: ILogger,
        private app?: App,
        private plugin?: Plugin
    ) {
        this.chartTabsManager = new ChartTabsManager(logger, app, plugin);
    }
    
    /**
     * Generate the complete metrics table content
     * 
     * @param metrics - Record of metrics data
     * @param dreamEntries - Array of dream entries
     * @returns HTML content for the metrics table
     */
    public generateMetricsTable(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): string {
        this.logger?.debug('Table', 'Generating metrics table');
        this.logger?.debug('Table', 'Table entries', { count: dreamEntries.length });
        
        // Use memoization to avoid regenerating the same table
        const cacheKey = JSON.stringify({ metrics, dreamEntries });
        if (this.memoizedTableData.has(cacheKey)) {
            this.logger?.debug('Table', 'Using cached table data');
            return this.memoizedTableData.get(cacheKey) as string;
        }
        
        let content = "";
        
        // CRITICAL FIX: Ensure all HTML is rendered properly by Obsidian's parser
        // Use data-render-html and proper div enclosures
        content += "<div data-render-html=\"true\">\n";
        content += '<h1 class="oneirometrics-title">OneiroMetrics (Dream Metrics)</h1>\n';
        
        content += '<div class="oom-metrics-container" id="oom-metrics-container">\n';
        
        // Add migration notice for the new OneiroMetrics view
        content += '<div class="oom-migration-notice">\n';
        content += '<strong>📊 New OneiroMetrics View Available!</strong>\n';
        content += 'Experience real-time updates, better performance, and enhanced features with the new OneiroMetrics view.<br>\n';
        content += '<div>\n';
        content += '<button onclick="app.commands.executeCommandById(\'oneirometrics:open-dashboard\')" class="mod-cta">Open OneiroMetrics View</button>\n';
        content += '<button onclick="this.parentElement.parentElement.style.display=\'none\'">Dismiss</button>\n';
        content += '</div>\n';
        content += '</div>\n';
        
        // Add chart tabs container placeholder - this will be populated by initializeChartTabs
        content += '<div id="oom-chart-tabs-placeholder"></div>\n';
        
        // Add Dream Entries heading
        content += '<h2 class="oom-dream-entries-title">Dream Entries</h2>\n';
        
        // Add filter controls with simplified structure
        content += '<div class="oom-filter-controls" id="oom-filter-controls">\n';
        content += '<select id="oom-date-range-filter" class="oom-select">\n';
        content += '<option value="all">All Time</option>\n';
        content += '<option value="today">Today</option>\n';
        content += '<option value="yesterday">Yesterday</option>\n';
        content += '<option value="thisWeek">This Week</option>\n';
        content += '<option value="thisMonth">This Month</option>\n';
        content += '<option value="last30">Last 30 Days</option>\n';
        content += '<option value="last6months">Last 6 Months</option>\n';
        content += '<option value="thisYear">This Year</option>\n';
        content += '<option value="last12months">Last 12 Months</option>\n';
        content += '</select>\n';
        content += '<button id="oom-date-navigator-button" class="oom-button mod-cta oom-date-navigator-button" type="button" title="Open date navigation and selection interface">Date Navigator</button>\n';
        content += '<button id="oom-rescrape-button" class="oom-button mod-cta oom-rescrape-button" type="button" title="Rescan dream journal entries and update metrics">Rescrape Metrics</button>\n';
        content += '<div id="oom-time-filter-display" class="oom-filter-display"></div>\n';
        content += '</div>\n';
        
        // Create dream entries table
        content += '<div class="oom-table-section" id="oom-dream-entries-table-section">\n';
        content += '<table class="oom-table" id="oom-dream-entries-table">\n';
        content += '<thead>\n<tr>\n';
        content += '<th class="column-date">Date</th>\n';
        content += '<th class="column-dream-title">Dream Title</th>\n';
        content += '<th class="column-content">Content</th>\n';
        
        // Get all enabled metrics
        const enabledMetrics = Object.values(this.settings.metrics).filter(metric => metric.enabled);
        
        // Sort metrics by the recommended order
        const metricNames = enabledMetrics.map(m => m.name);
        const combinedOrder = ["Words", ...RECOMMENDED_METRICS_ORDER, ...DISABLED_METRICS_ORDER];
        const sortedMetricNames = this.sortMetricsByOrder(metricNames, combinedOrder);
        
        // Sort the enabled metrics based on the sorted names
        const sortedEnabledMetrics = sortedMetricNames
            .map(name => enabledMetrics.find(m => m.name === name))
            .filter(m => m !== undefined) as DreamMetric[];
        
        // Add metric column headers
        for (const metric of sortedEnabledMetrics) {
            const metricClass = `column-metric-${metric.name.toLowerCase().replace(/\s+/g, "-")}`;
            content += `<th class="${metricClass}"><span class="oom-metric-header">${metric.name}</span></th>\n`;
        }
        content += "</tr>\n</thead>\n<tbody>\n";
        
        if (dreamEntries.length === 0) {
            content += '<tr><td colspan="' + (3 + sortedEnabledMetrics.length) + '" class="oom-no-entries">No dream entries found</td></tr>\n';
        } else {
            // Sort dream entries by date (chronological order - oldest first)
            const sortedEntries = [...dreamEntries].sort((a, b) => {
                const dateA = parseDate(a.date) || new Date();
                const dateB = parseDate(b.date) || new Date();
                return dateA.getTime() - dateB.getTime(); // Chronological order - oldest first
            });
            
            // Add dream entry rows
            for (const entry of sortedEntries) {
                // Ensure entry.date exists and has a valid format
                if (!entry.date || typeof entry.date !== 'string') {
                    this.logger?.error('Table', 'Entry missing date attribute', { entry });
                    continue; // Skip entries without dates
                }
                
                // Log each row being created with its date attribute for debugging
                this.logger?.debug('Table', 'Creating row with date attribute', { date: entry.date });
                
                // Explicitly ensure date attribute is set multiple times for redundancy
                content += `<tr class="oom-dream-row" data-date="${entry.date}" data-date-raw="${entry.date}" data-iso-date="${entry.date}">\n`;
                content += `<td class="column-date" data-date="${entry.date}" data-iso-date="${entry.date}">${formatDate(parseDate(entry.date) || new Date(), 'MMM d, yyyy')}</td>\n`;
                
                // Create a proper link to the source
                const sourceFile = this.getSourceFile(entry);
                const sourceId = this.getSourceId(entry);
                content += `<td class="oom-dream-title column-dream-title"><a href="${sourceFile.replace(/\.md$/, "")}#${sourceId}" data-href="${sourceFile.replace(/\.md$/, "")}#${sourceId}" class="internal-link" data-link-type="block" data-link-path="${sourceFile.replace(/\.md$/, "")}" data-link-hash="${sourceId}" title="${entry.title}">${entry.title}</a></td>\n`;
                
                // Process content for display - properly sanitize markdown elements
                let dreamContent = this.processDreamContent(entry.content);
                if (!dreamContent || !dreamContent.trim()) {
                    dreamContent = "";
                }
                
                // Create unique ID for content cell
                const cellId = `oom-content-${entry.date.replace(/[^0-9]/g, '')}-${entry.title.replace(/[^a-zA-Z0-9]/g, "")}`;
                const preview = dreamContent.length > 200 ? dreamContent.substring(0, 200) + "..." : dreamContent;
                
                // Add content cell with expand/collapse button if needed
                if (dreamContent.length > 200) {
                    // Match exactly the structure the ContentToggler expects
                    content += `<td class="oom-dream-content column-content">\n`;
                    content += `  <div class="oom-content-wrapper">\n`;
                    content += `    <div class="oom-content-preview">${preview}</div>\n`;
                    content += `    <div class="oom-content-full oom-content-full--hidden" id="${cellId}">${dreamContent}</div>\n`;
                    content += `    <button type="button" class="oom-button oom-button--expand oom-button--state-default u-padding--xs" aria-expanded="false" aria-controls="${cellId}" data-expanded="false" data-content-id="${cellId}" data-parent-cell="${cellId}">\n`;
                    content += `      <span class="oom-button-text">Show more</span>\n`;
                    content += `      <span class="oom-button-icon">▼</span>\n`;
                    content += `      <span class="oom-sr-only"> full dream content</span>\n`;
                    content += `    </button>\n`;
                    content += `  </div>\n`;
                    content += `</td>\n`;
                } else {
                    content += `<td class="oom-dream-content column-content">\n`;
                    content += `  <div class="oom-content-wrapper">\n`;
                    content += `    <div class="oom-content-preview">${dreamContent}</div>\n`;
                    content += `  </div>\n`;
                    content += `</td>\n`;
                }
                
                // Add metrics columns using the same sorted order as the headers
                for (const metric of sortedEnabledMetrics) {
                    const metricClass = `column-metric-${metric.name.toLowerCase().replace(/\s+/g, "-")}`;
                    const value = entry.metrics[metric.name];
                    content += `<td class="metric-value ${metricClass}" data-metric="${metric.name}">${value !== undefined ? value : ""}</td>\n`;
                }
                
                content += "</tr>\n";
            }
        }
        
        content += "</tbody>\n</table>\n";
        content += "</div>\n"; // Close table-section
        content += "</div>\n"; // Close metrics-container
        content += "</div>\n"; // Close data-render-html
        
        // Cache the generated table
        this.memoizedTableData.set(cacheKey, content);
        
        return content;
    }
    
    /**
     * Initialize chart tabs in the metrics container
     * This should be called after the HTML content is inserted into the DOM
     */
    public async initializeChartTabs(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        try {
            // Find the metrics container
            const metricsContainer = document.querySelector('#oom-metrics-container') as HTMLElement;
            if (!metricsContainer) {
                this.logger?.warn('Table', 'Metrics container not found, cannot initialize chart tabs');
                return;
            }

            // Find the chart tabs placeholder (for validation)
            const placeholder = metricsContainer.querySelector('#oom-chart-tabs-placeholder') as HTMLElement;
            if (!placeholder) {
                this.logger?.warn('Table', 'Chart tabs placeholder not found');
                return;
            }

            // Generate the statistics table HTML
            const statisticsTableHTML = this.generateSummaryTable(metrics);

            // Initialize chart tabs - pass metricsContainer instead of placeholder
            await this.chartTabsManager.initializeChartTabs(
                metricsContainer,
                { metrics, dreamEntries },
                statisticsTableHTML
            );

            this.logger?.debug('Table', 'Chart tabs initialized successfully');
        } catch (error) {
            this.logger?.error('Table', 'Failed to initialize chart tabs', { error });
        }
    }

    /**
     * Update chart tabs with new data
     */
    public async updateChartTabs(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        try {
            const statisticsTableHTML = this.generateSummaryTable(metrics);
            await this.chartTabsManager.updateChartData(
                { metrics, dreamEntries },
                statisticsTableHTML
            );
            this.logger?.debug('Table', 'Chart tabs updated successfully');
        } catch (error) {
            this.logger?.error('Table', 'Failed to update chart tabs', { error });
        }
    }
    
    /**
     * Process dream content to make it suitable for display
     * Properly cleans markdown formatting while preserving readable text
     */
    private processDreamContent(content: string): string {
        if (!content) return '';
        
        try {
            // Remove callouts and images
            let processedContent = content.replace(/\[!.*?\]/g, '')
                           .replace(/!\[\[.*?\]\]/g, '')
                           .replace(/\[\[.*?\]\]/g, '')
                           .trim();
            
            // Remove any remaining markdown artifacts
            processedContent = processedContent.replace(/[#*_~`]/g, '')
                           .replace(/\n{3,}/g, '\n\n')
                           .replace(/^>\s*>/g, '') // Remove nested blockquotes
                           .replace(/^>\s*/gm, '') // Remove single blockquotes
                           .trim();
            
            // Escape HTML entities
            processedContent = processedContent
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            // Convert newlines to <br> tags
            processedContent = processedContent.replace(/\n/g, '<br>');
            
            return processedContent;
        } catch (error) {
            this.logger?.error('Content', 'Error processing dream content', error as Error);
            // Return sanitized original content if processing fails
            return content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
        }
    }
    
    /**
     * Helper to get the source file from a dream entry
     */
    private getSourceFile(entry: DreamMetricData): string {
        if (!entry.source) return "unknown";
        if (typeof entry.source === 'string') return entry.source;
        return entry.source.file || "unknown";
    }
    
    /**
     * Helper to get the source ID from a dream entry
     */
    private getSourceId(entry: DreamMetricData): string {
        // Generate a simple ID if none exists
        if (!entry.source || typeof entry.source === 'string') {
            return `dream-${entry.date.replace(/[^0-9]/g, '')}`;
        }
        return entry.source.id || `dream-${entry.date.replace(/[^0-9]/g, '')}`;
    }
    
    /**
     * Sort metrics according to a predefined order
     */
    private sortMetricsByOrder(metrics: string[], order: string[]): string[] {
        return [...metrics].sort((a, b) => {
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);
            
            // If both items are in the order array, sort by their position
            if (indexA >= 0 && indexB >= 0) {
                return indexA - indexB;
            }
            
            // If only one item is in the order array, prioritize it
            if (indexA >= 0) return -1;
            if (indexB >= 0) return 1;
            
            // If neither is in the order array, maintain original order
            return 0;
        });
    }
    
    
    /**
     * Generate the summary table with metrics statistics
     * 
     * @param metrics - Record of metrics data
     * @returns HTML content for the summary table
     */
    public generateSummaryTable(metrics: Record<string, number[]>): string {
        this.logger?.debug('TableGenerator', 'generateSummaryTable called with metrics', { metricNames: Object.keys(metrics) });
        
        let content = "";
        content += `<div class="oom-table-section oom-stats-section">`;
        content += '<h2 class="oom-table-title oom-stats-title">Statistics</h2>';
        content += '<div class="oom-table-container">\n';
        content += '<table class="oom-table oom-stats-table" id="oom-stats-table">\n';
        content += "<thead>\n";
        content += "<tr>\n";
        content += "<th>Metric</th>\n";
        content += "<th>Average</th>\n";
        content += "<th>Min</th>\n";
        content += "<th>Max</th>\n";
        content += "<th>Count</th>\n";
        content += "</tr>\n";
        content += "</thead>\n";
        content += "<tbody>\n";
        
        // CRITICAL FIX: More explicit and controlled metrics ordering
        const combinedOrder = ["Words", ...RECOMMENDED_METRICS_ORDER, ...DISABLED_METRICS_ORDER];
        
        // Create a lookup map for metrics by name
        const metricsLookup: Record<string, DreamMetric> = {};
        Object.values(this.settings.metrics).forEach(metric => {
            metricsLookup[metric.name] = metric;
        });
        
        // Track metrics we've processed to avoid duplicates
        const processedMetrics = new Set<string>();
        let hasMetrics = false;
        let rowsAdded = 0;
        
        this.logger?.debug('TableGenerator', 'Starting metrics processing loop');
        
        // First, ALWAYS handle Words metric specially (even if not in enabled metrics)
        if (metrics["Words"] && metrics["Words"].length > 0) {
            hasMetrics = true;
            const values = metrics["Words"];
            const avg = values.reduce((a, b) => a + b) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const total = values.reduce((a, b) => a + b, 0);
            
            this.logger?.debug('TableGenerator', 'Processing Words metric', { avg, min, max, total, count: values.length });
            
            content += "<tr>\n";
            content += `<td>Words <span class="oom-words-total">(total: ${total})</span></td>\n`;
            content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
            content += `<td class="metric-value">${min}</td>\n`;
            content += `<td class="metric-value">${max}</td>\n`;
            content += `<td class="metric-value">${values.length}</td>\n`;
            content += "</tr>\n";
            
            // Mark Words as processed to avoid duplication
            processedMetrics.add("Words");
            rowsAdded++;
        }
        
        // Then process the rest in the defined order, skipping Words which we already processed
        for (const name of combinedOrder) {
            // Skip already processed metrics
            if (processedMetrics.has(name)) continue;
            
            const values = metrics[name];
            if (!values || values.length === 0) continue;
            
            this.logger?.debug('TableGenerator', 'Processing metric', { name, count: values.length });
            
            hasMetrics = true;
            const avg = values.reduce((a, b) => a + b) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            let label = name;
            const metric = metricsLookup[name];
            
            // Use metric name as label (no icons)
            
            content += "<tr>\n";
            content += `<td>${label}</td>\n`;
            content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
            content += `<td class="metric-value">${min}</td>\n`;
            content += `<td class="metric-value">${max}</td>\n`;
            content += `<td class="metric-value">${values.length}</td>\n`;
            content += "</tr>\n";
            
            processedMetrics.add(name);
            rowsAdded++;
        }
        
        // Finally, handle any metrics not covered by our predefined lists
        for (const name of Object.keys(metrics)) {
            // Skip already processed metrics
            if (processedMetrics.has(name)) continue;
            
            const values = metrics[name];
            if (!values || values.length === 0) continue;
            
            this.logger?.debug('TableGenerator', 'Processing unlisted metric', { name, count: values.length });
            
            hasMetrics = true;
            const avg = values.reduce((a, b) => a + b) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            let label = name;
            const metric = metricsLookup[name];
            
            // No icons - just use metric name
            
            content += "<tr>\n";
            content += `<td>${label}</td>\n`;
            content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
            content += `<td class="metric-value">${min}</td>\n`;
            content += `<td class="metric-value">${max}</td>\n`;
            content += `<td class="metric-value">${values.length}</td>\n`;
            content += "</tr>\n";
            
            rowsAdded++;
        }
        
        if (!hasMetrics) {
            this.logger?.debug('TableGenerator', 'No metrics found, adding empty row');
            content += '<tr><td colspan="5" class="oom-no-metrics">No metrics available</td></tr>\n';
            rowsAdded++;
        }
        
        content += "</tbody>\n";
        content += "</table>\n";
        content += "</div>\n"; // Close table-container
        content += "</div>\n"; // Close stats-section
        
        this.logger?.debug('TableGenerator', 'generateSummaryTable completed', { 
            hasMetrics, 
            rowsAdded, 
            contentLength: content.length
        });
        
        return content;
    }
    
    /**
     * Clear the table data cache
     */
    public clearCache(): void {
        this.memoizedTableData.clear();
        this.logger?.debug('Table', 'Table data cache cleared');
    }
} 