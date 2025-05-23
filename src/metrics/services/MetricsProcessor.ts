import { DreamMetric, DreamMetricData } from '../../../types';
import { IMetricsProcessor } from '../interfaces/IMetricsProcessor';

/**
 * Implementation of the metrics processor for analyzing dream journal entries.
 */
export class MetricsProcessor implements IMetricsProcessor {
  /**
   * Create a new metrics processor.
   * @param metrics Map of metric definitions from settings
   */
  constructor(private metrics: Record<string, DreamMetric>) {}

  /**
   * Process metrics text from a dream entry callout.
   * @param metricsText The raw metrics text from a dream entry
   * @param globalMetrics Optional global metrics record to update
   * @returns Record of processed metrics
   */
  processMetricsText(
    metricsText: string, 
    globalMetrics?: Record<string, number[]>
  ): Record<string, number> {
    const dreamMetrics: Record<string, number> = {};
    const metricPairs = metricsText.split(',').map(pair => pair.trim());
    
    console.log('[OneiroMetrics] Processing metrics text:', metricsText);
    
    for (const pair of metricPairs) {
      const [name, value] = pair.split(':').map(s => s.trim());
      if (name && value !== '—' && !isNaN(Number(value))) {
        const numValue = Number(value);
        
        // Find the matching metric name from settings (case-insensitive)
        const metricName = Object.values(this.metrics).find(
          m => m.name.toLowerCase() === name.toLowerCase()
        )?.name || name;
        
        dreamMetrics[metricName] = numValue;
        
        // Update global metrics record if provided
        if (globalMetrics) {
          if (!globalMetrics[metricName]) {
            globalMetrics[metricName] = [];
          }
          globalMetrics[metricName].push(numValue);
        }
        
        console.log(`[OneiroMetrics] Processed metric: ${metricName} = ${numValue}`);
      }
    }
    
    console.log('[OneiroMetrics] Final dream metrics:', dreamMetrics);
    return dreamMetrics;
  }

  /**
   * Process a complete dream entry to extract all metrics.
   * @param entry The dream entry data
   * @returns The processed entry with complete metrics
   */
  processEntry(entry: DreamMetricData): DreamMetricData {
    // Create a copy of the entry
    const processedEntry: DreamMetricData = {
      ...entry,
      metrics: { ...entry.metrics }
    };

    // Calculate word count if not already present
    if (!processedEntry.metrics['Words']) {
      // Simple word count calculation
      const wordCount = entry.content.trim().split(/\s+/).length;
      processedEntry.metrics['Words'] = wordCount;
    }

    return processedEntry;
  }

  /**
   * Process multiple dream entries and aggregate their metrics.
   * @param entries Array of dream entries to process
   * @returns Object containing aggregated metrics and processed entries
   */
  processDreamEntries(
    entries: DreamMetricData[]
  ): {
    metrics: Record<string, number[]>;
    processedEntries: DreamMetricData[];
  } {
    const metrics: Record<string, number[]> = {};
    const processedEntries: DreamMetricData[] = [];

    entries.forEach(entry => {
      const processedEntry = this.processEntry(entry);
      processedEntries.push(processedEntry);

      // Update metrics
      Object.entries(processedEntry.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (!metrics[key]) {
            metrics[key] = [];
          }
          metrics[key].push(value);
        } else if (typeof value === 'string') {
          // Try to convert string values to numbers
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            if (!metrics[key]) {
              metrics[key] = [];
            }
            metrics[key].push(numValue);
          }
        }
      });
    });

    return { metrics, processedEntries };
  }

  /**
   * Calculate summary statistics for metrics.
   * @param metrics Metrics data to analyze
   * @returns Summary statistics for each metric
   */
  calculateSummaryStatistics(
    metrics: Record<string, number[]>
  ): Record<string, { min: number; max: number; avg: number; count: number }> {
    const result: Record<string, { min: number; max: number; avg: number; count: number }> = {};

    Object.entries(metrics).forEach(([metricName, values]) => {
      if (values.length === 0) return;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;

      result[metricName] = {
        min,
        max,
        avg,
        count: values.length
      };
    });

    return result;
  }

  /**
   * Generate a metrics summary in string format.
   * @param metrics The metrics to summarize
   * @returns Formatted summary string
   */
  getMetricsSummary(metrics: Record<string, number[]>): string {
    const summary = this.calculateSummaryStatistics(metrics);
    return JSON.stringify(summary, null, 2);
  }

  /**
   * Calculate time-based metrics analysis.
   * @param entries Dream entries to analyze
   * @returns Time-based metrics analysis
   */
  getTimeBasedMetrics(entries: DreamMetricData[]): Record<string, any> {
    const result: Record<string, any> = {
      byMonth: {},
      byDayOfWeek: {}
    };

    console.log('[MetricsProcessor] getTimeBasedMetrics called with', entries.length, 'entries');

    // Process each entry
    for (const entry of entries) {
      try {
        // Enhanced date parsing for consistent results
        let date: Date;
        
        if (typeof entry.date === 'string') {
          // Split YYYY-MM-DD format for exact control
          const dateParts = entry.date.split('-').map(n => parseInt(n));
          if (dateParts.length === 3 && !dateParts.some(isNaN)) {
            // Create date with year, month-1, day
            date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            console.log(`[MetricsProcessor] Parsed date ${entry.date} → ${date.toISOString()}`);
          } else {
            date = new Date(entry.date);
            console.log(`[MetricsProcessor] Fallback date parsing ${entry.date} → ${date.toISOString()}`);
          }
        } else {
          // For non-string dates (should not happen, but just in case)
          date = new Date(entry.date);
        }
        
        if (isNaN(date.getTime())) {
          console.error('[MetricsProcessor] Invalid date:', entry.date);
          continue;
        }
        
        // Extract year and month (month is 0-indexed in JS Date)
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        // Create month key in YYYY-M format (important: not YYYY-MM)
        const monthKey = `${year}-${month}`;
        console.log(`[MetricsProcessor] Using month key: ${monthKey}`);
        
        // Initialize month data if not present
        if (!result.byMonth[monthKey]) {
          result.byMonth[monthKey] = {
            count: 0,
            totalWords: 0
          };
        }
        
        // Update month data
        result.byMonth[monthKey].count++;
        
        // Add word count if available (convert to number if it's a string)
        const wordsValue = 
          typeof entry.metrics['Words'] === 'number' ? entry.metrics['Words'] :
          typeof entry.metrics['Words'] === 'string' ? parseInt(entry.metrics['Words'] as string, 10) : 0;
        
        if (!isNaN(wordsValue)) {
          result.byMonth[monthKey].totalWords += wordsValue;
          console.log(`[MetricsProcessor] Added ${wordsValue} words to month ${monthKey}`);
        }
        
        // Get day of week
        const dayKey = date.getDay();
        
        // Initialize day data if not present
        if (!result.byDayOfWeek[dayKey]) {
          result.byDayOfWeek[dayKey] = {
            count: 0,
            totalWords: 0
          };
        }
        
        // Update day data
        result.byDayOfWeek[dayKey].count++;
        if (!isNaN(wordsValue)) {
          result.byDayOfWeek[dayKey].totalWords += wordsValue;
        }
      } catch (error) {
        console.error('[MetricsProcessor] Error processing entry date:', error);
      }
    }

    // Final log of results for debugging
    console.log('[MetricsProcessor] Time-based metrics result:', JSON.stringify(result));
    
    return result;
  }

  /**
   * Extract metrics from visible table rows in the UI.
   * @param container HTML element containing the table rows
   * @returns Collected metrics from visible rows
   */
  collectVisibleRowMetrics(container: HTMLElement): Record<string, number[]> {
    const metrics: Record<string, number[]> = {};
    
    // Initialize metrics arrays
    metrics['Words'] = [];
    
    // Find all visible rows in the table
    const visibleRows = container.querySelectorAll('.oom-table tbody tr:not(.hidden)');
    
    // Collect metrics from visible rows
    visibleRows.forEach(row => {
      // Get Words metric
      const wordsCell = row.querySelector('.column-words');
      if (wordsCell && wordsCell.textContent) {
        const wordsValue = parseInt(wordsCell.textContent.trim(), 10);
        if (!isNaN(wordsValue)) {
          metrics['Words'].push(wordsValue);
        }
      }
      
      // Process all metric columns by iterating through all cells
      row.querySelectorAll('td').forEach(cell => {
        // Skip non-metric cells
        if (cell.classList.contains('column-date') || 
            cell.classList.contains('column-dream-title') || 
            cell.classList.contains('column-content')) {
          return;
        }
        
        // Get column header to determine metric name
        const colIndex = cell.parentNode ? Array.from(cell.parentNode.children).indexOf(cell) : -1;
        if (colIndex === -1) return;
        const header = container.querySelector(`.oom-table th:nth-child(${colIndex + 1})`);
        if (!header) return;
        
        const metricName = header.textContent?.trim() || '';
        if (!metricName || metricName === 'Words') return; // Skip already handled Words column
        
        const value = parseFloat(cell.textContent?.trim() || '0');
        if (!isNaN(value)) {
          if (!metrics[metricName]) {
            metrics[metricName] = [];
          }
          metrics[metricName].push(value);
        }
      });
    });
    
    return metrics;
  }
} 