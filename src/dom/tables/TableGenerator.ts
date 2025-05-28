/**
 * TableGenerator
 * 
 * Handles the generation of HTML tables for metrics display.
 * Extracted from main.ts during the refactoring process.
 */

import { DreamMetricData, DreamMetricsSettings, DreamMetric } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import safeLogger from '../../logging/safe-logger';
import { RECOMMENDED_METRICS_ORDER, DISABLED_METRICS_ORDER, lucideIconMap } from '../../../settings';

export class TableGenerator {
    private memoizedTableData = new Map<string, string>();
    
    constructor(
        private readonly settings: DreamMetricsSettings,
        private logger?: ILogger
    ) {}
    
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
        
        // IMPORTANT: Use simpler HTML structure with fewer nesting levels but add distinct classes
        content += '<div class="oom-buttons-container">\n';
        content += '<button class="mod-cta oom-button oom-rescrape-button" id="oom-rescrape-button" type="button">Rescrape Metrics</button>\n';
        content += '<button class="mod-cta oom-button oom-settings-button" id="oom-settings-button" type="button">Settings</button>\n';
        content += '<button class="mod-cta oom-button oom-date-navigator-button" id="oom-date-navigator-button" type="button">Date Navigator</button>\n';
        content += '</div>\n';
        
        content += '<div class="oom-metrics-container">\n';
        
        // Add metrics summary table
        content += this.generateSummaryTable(metrics);
        
        // Add Dream Entries heading
        content += '<h2 class="oom-dream-entries-title">Dream Entries</h2>\n';
        
        // Add filter controls with simplified structure
        content += '<div class="oom-filter-controls" id="oom-filter-controls">\n';
        content += '<select id="oom-date-range-filter" class="oom-select">\n';
        content += '<option value="all">All Time</option>\n';
        content += '<option value="today">Today</option>\n';
        content += '<option value="week">This Week</option>\n';
        content += '<option value="month">This Month</option>\n';
        content += '<option value="last-month">Last Month</option>\n';
        content += '<option value="custom">Custom Range</option>\n';
        content += '</select>\n';
        
        content += '<button id="oom-custom-range-button" class="oom-button oom-custom-range-button">Set Custom Range</button>\n';
        content += '<button id="oom-reset-filter-button" class="oom-button oom-reset-filter-button">Reset Filters</button>\n';
        content += '<button id="oom-expand-all-button" class="oom-button oom-expand-all-button">Expand All</button>\n';
        content += '<span class="oom-filter-display" id="oom-filter-display">Showing all entries</span>\n';
        content += '</div>\n';
        
        // Create dream entries table
        content += '<div class="oom-table-container">\n';
        content += '<table class="oom-table oom-dreams-table" id="oom-dreams-table">\n';
        content += '<thead>\n';
        content += '<tr>\n';
        content += '<th class="oom-sortable" data-sort-by="date">Date</th>\n';
        content += '<th class="oom-sortable" data-sort-by="content">Content</th>\n';
        
        // Get list of metrics to display as columns (only enabled ones)
        const metricNames = Object.values(this.settings.metrics)
            .filter(metric => metric.enabled)
            .map(metric => metric.name);
        
        // Add metric columns
        for (const name of metricNames) {
            content += `<th class="oom-sortable" data-sort-by="${name}">${name}</th>\n`;
        }
        
        content += '</tr>\n';
        content += '</thead>\n';
        content += '<tbody>\n';
        
        if (dreamEntries.length === 0) {
            content += '<tr><td colspan="' + (2 + metricNames.length) + '" class="oom-no-entries">No dream entries found</td></tr>\n';
        } else {
            // Sort dream entries by date descending (newest first)
            const sortedEntries = [...dreamEntries].sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
            });
            
            // Add row for each dream entry
            for (const entry of sortedEntries) {
                // Generate unique ID for this entry for expanding/collapsing
                const entryId = `oom-entry-${entry.date.replace(/[^0-9]/g, '')}-${Math.floor(Math.random() * 1000)}`;
                
                content += `<tr class="oom-entry-row" data-date="${entry.date}" data-entry-id="${entryId}">\n`;
                
                // Format date for display
                const displayDate = this.formatDateForDisplay(new Date(entry.date));
                content += `<td class="oom-date-cell">${displayDate}</td>\n`;
                
                // Add content cell with collapse/expand functionality
                content += '<td class="oom-content-cell">\n';
                content += `<div class="oom-content-summary">\n`;
                content += `<button class="oom-toggle-content" data-content-id="${entryId}">+</button>\n`;
                
                // Show the first 100 characters of content as preview
                const contentPreview = entry.content.substring(0, 100).trim() + (entry.content.length > 100 ? '...' : '');
                content += `<span class="oom-content-preview">${contentPreview}</span>\n`;
                content += `</div>\n`;
                
                // Full content (initially hidden)
                content += `<div class="oom-content-full" id="${entryId}" style="display: none;">\n`;
                content += `<div class="oom-entry-content">${entry.content.replace(/\n/g, '<br>')}</div>\n`;
                
                // Add source file link if available
                if (entry.source) {
                    const sourceText = typeof entry.source === 'string' 
                        ? entry.source 
                        : entry.source.file || 'Unknown source';
                    
                    content += `<div class="oom-entry-source">Source: ${sourceText}</div>\n`;
                }
                
                content += `</div>\n`;
                content += `</td>\n`;
                
                // Add metric values
                for (const metricName of metricNames) {
                    const value = entry.metrics[metricName] !== undefined 
                        ? entry.metrics[metricName] 
                        : '—';
                    
                    content += `<td class="oom-metric-cell">${value}</td>\n`;
                }
                
                content += `</tr>\n`;
            }
        }
        
        content += '</tbody>\n';
        content += '</table>\n';
        content += '</div>\n'; // Close table-container
        
        content += '</div>\n'; // Close metrics-container
        content += '</div>\n'; // Close data-render-html
        
        // Cache the generated table
        this.memoizedTableData.set(cacheKey, content);
        
        return content;
    }
    
    /**
     * Generate the summary table with metrics statistics
     * 
     * @param metrics - Record of metrics data
     * @returns HTML content for the summary table
     */
    public generateSummaryTable(metrics: Record<string, number[]>): string {
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
        const combinedOrder = ["Words", "Reading Time", ...RECOMMENDED_METRICS_ORDER, ...DISABLED_METRICS_ORDER];
        
        // Create a lookup map for metrics by name
        const metricsLookup: Record<string, DreamMetric> = {};
        Object.values(this.settings.metrics).forEach(metric => {
            metricsLookup[metric.name] = metric;
        });
        
        // Track metrics we've processed to avoid duplicates
        const processedMetrics = new Set<string>();
        let hasMetrics = false;
        
        // First, handle special cases (Words, Reading Time)
        if (metrics["Words"] && metrics["Words"].length > 0) {
            hasMetrics = true;
            const values = metrics["Words"];
            const avg = values.reduce((a, b) => a + b) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const total = values.reduce((a, b) => a + b, 0);
            
            content += "<tr>\n";
            content += `<td>Words <span class="oom-words-total">(total: ${total})</span></td>\n`;
            content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
            content += `<td class="metric-value">${min}</td>\n`;
            content += `<td class="metric-value">${max}</td>\n`;
            content += `<td class="metric-value">${values.length}</td>\n`;
            content += "</tr>\n";
            
            processedMetrics.add("Words");
        }
        
        if (metrics["Reading Time"] && metrics["Reading Time"].length > 0) {
            hasMetrics = true;
            const values = metrics["Reading Time"];
            const avg = values.reduce((a, b) => a + b) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            content += "<tr>\n";
            content += `<td>Reading Time</td>\n`;
            content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
            content += `<td class="metric-value">${min}</td>\n`;
            content += `<td class="metric-value">${max}</td>\n`;
            content += `<td class="metric-value">${values.length}</td>\n`;
            content += "</tr>\n";
            
            processedMetrics.add("Reading Time");
        }
        
        // Then process the rest in the defined order
        for (const name of combinedOrder) {
            // Skip already processed metrics
            if (processedMetrics.has(name)) continue;
            
            const values = metrics[name];
            if (!values || values.length === 0) continue;
            
            hasMetrics = true;
            const avg = values.reduce((a, b) => a + b) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            let label = name;
            const metric = metricsLookup[name];
            
            // CRITICAL FIX: Proper icon handling and display
            if (metric?.icon) {
                // Ensure icon name is valid, use fallbacks for problematic icons
                let iconName = metric.icon;
                if (iconName === 'circle-off') iconName = 'circle-minus';
                
                // Get icon from lucideIconMap
                const svgContent = lucideIconMap[iconName];
                if (svgContent) {
                    // Ensure SVG has proper dimensions and attributes for consistent display
                    const iconHtml = svgContent
                        .replace('<svg ', '<svg width="18" height="18" class="oom-metric-icon" ')
                        .replace('stroke-width="2"', 'stroke-width="2.5"');
                    
                    label = `<span class="oom-metric-icon-container">${iconHtml}</span> ${name}`;
                }
            }
            
            content += "<tr>\n";
            content += `<td>${label}</td>\n`;
            content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
            content += `<td class="metric-value">${min}</td>\n`;
            content += `<td class="metric-value">${max}</td>\n`;
            content += `<td class="metric-value">${values.length}</td>\n`;
            content += "</tr>\n";
            
            processedMetrics.add(name);
        }
        
        // Finally, handle any metrics not covered by our predefined lists
        for (const name of Object.keys(metrics)) {
            // Skip already processed metrics
            if (processedMetrics.has(name)) continue;
            
            const values = metrics[name];
            if (!values || values.length === 0) continue;
            
            hasMetrics = true;
            const avg = values.reduce((a, b) => a + b) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            let label = name;
            const metric = metricsLookup[name];
            
            // Handle icons the same way as above for consistency
            if (metric?.icon) {
                let iconName = metric.icon;
                if (iconName === 'circle-off') iconName = 'circle-minus';
                
                const svgContent = lucideIconMap[iconName];
                if (svgContent) {
                    const iconHtml = svgContent
                        .replace('<svg ', '<svg width="18" height="18" class="oom-metric-icon" ')
                        .replace('stroke-width="2"', 'stroke-width="2.5"');
                    
                    label = `<span class="oom-metric-icon-container">${iconHtml}</span> ${name}`;
                }
            }
            
            content += "<tr>\n";
            content += `<td>${label}</td>\n`;
            content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
            content += `<td class="metric-value">${min}</td>\n`;
            content += `<td class="metric-value">${max}</td>\n`;
            content += `<td class="metric-value">${values.length}</td>\n`;
            content += "</tr>\n";
        }
        
        if (!hasMetrics) {
            content += '<tr><td colspan="5" class="oom-no-metrics">No metrics available</td></tr>\n';
        }
        
        content += "</tbody>\n";
        content += "</table>\n";
        content += "</div>\n"; // Close table-container
        content += "</div>\n"; // Close stats-section
        
        return content;
    }
    
    /**
     * Format a date for display in the metrics table
     * 
     * @param date - Date to format
     * @returns Formatted date string
     */
    private formatDateForDisplay(date: Date): string {
        try {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            safeLogger.error('Table', 'Error formatting date for display', error as Error);
            return 'Invalid Date';
        }
    }
    
    /**
     * Clear the table data cache
     */
    public clearCache(): void {
        this.memoizedTableData.clear();
        this.logger?.debug('Table', 'Table data cache cleared');
    }
} 