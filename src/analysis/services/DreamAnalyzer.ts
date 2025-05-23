import { DreamMetric } from '../../types';
import { IDreamAnalyzer } from '../interfaces';

/**
 * Implementation of the dream analyzer interface.
 * Provides methods for cleaning dream content and extracting metrics.
 */
export class DreamAnalyzer implements IDreamAnalyzer {
  /**
   * Process and clean dream content by removing markdown artifacts.
   * @param content Raw dream journal content
   * @returns Cleaned dream content
   */
  processDreamContent(content: string): string {
    // Remove callouts, images, and links
    content = content.replace(/\[!.*?\]/g, '')
                   .replace(/!\[\[.*?\]\]/g, '')
                   .replace(/\[\[.*?\]\]/g, '')
                   .trim();
    
    // Remove any remaining markdown artifacts
    content = content.replace(/[#*_~`]/g, '')
                   .replace(/\n{3,}/g, '\n\n')
                   .replace(/^>\s*>/g, '') // Remove nested blockquotes
                   .replace(/^>\s*/gm, '') // Remove single blockquotes
                   .trim();
    
    return content;
  }
  
  /**
   * Extract metrics from metrics text.
   * @param metricsText Text containing metrics
   * @param availableMetrics Dictionary of available metrics
   * @param existingMetrics Optional dictionary to update
   * @returns Dictionary of extracted metrics
   */
  extractMetrics(
    metricsText: string, 
    availableMetrics: Record<string, DreamMetric>,
    existingMetrics?: Record<string, number[]>
  ): Record<string, number> {
    const dreamMetrics: Record<string, number> = {};
    const metricPairs = metricsText.split(',').map(pair => pair.trim());
    
    console.log('[OneiroMetrics] Processing metrics text:', metricsText);
    
    for (const pair of metricPairs) {
      const [name, value] = pair.split(':').map(s => s.trim());
      if (name && value !== '—' && !isNaN(Number(value))) {
        const numValue = Number(value);
        
        // Find the matching metric name from available metrics (case-insensitive)
        const metricName = Object.values(availableMetrics).find(
          m => m.name.toLowerCase() === name.toLowerCase()
        )?.name || name;
        
        dreamMetrics[metricName] = numValue;
        
        // Update global metrics record if provided
        if (existingMetrics) {
          if (!existingMetrics[metricName]) {
            existingMetrics[metricName] = [];
          }
          existingMetrics[metricName].push(numValue);
        }
        
        console.log(`[OneiroMetrics] Processed metric: ${metricName} = ${numValue}`);
      }
    }
    
    console.log('[OneiroMetrics] Final dream metrics:', dreamMetrics);
    return dreamMetrics;
  }
  
  /**
   * Calculate summary statistics for metrics.
   * @param metrics Dictionary of metrics values
   * @returns Dictionary of summary statistics
   */
  calculateMetricsSummary(metrics: Record<string, number[]>): Record<string, {
    min: number;
    max: number;
    avg: number;
    count: number;
  }> {
    const summary: Record<string, {
      min: number;
      max: number;
      avg: number;
      count: number;
    }> = {};
    
    Object.entries(metrics).forEach(([name, values]) => {
      if (values.length === 0) return;
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const avg = sum / values.length;
      
      summary[name] = {
        min,
        max,
        avg,
        count: values.length
      };
    });
    
    return summary;
  }
  
  /**
   * Find patterns in metrics data.
   * @param metrics Dictionary of metrics values
   * @returns Dictionary of pattern analysis
   */
  findMetricsPatterns(metrics: Record<string, number[]>): Record<string, {
    trends: string;
    correlations: Array<{metric: string, strength: number}>;
  }> {
    const patterns: Record<string, {
      trends: string;
      correlations: Array<{metric: string, strength: number}>;
    }> = {};
    
    // Only analyze metrics with enough data points
    const metricsWithEnoughData = Object.entries(metrics)
      .filter(([_, values]) => values.length >= 5);
    
    // Process each metric to find trends and correlations
    for (const [name, values] of metricsWithEnoughData) {
      // Simple trend analysis (increasing, decreasing, stable)
      let trend = "stable";
      if (values.length >= 3) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg * 1.1) {
          trend = "increasing";
        } else if (secondAvg < firstAvg * 0.9) {
          trend = "decreasing";
        }
      }
      
      // Find correlations with other metrics
      const correlations: Array<{metric: string, strength: number}> = [];
      
      for (const [otherName, otherValues] of metricsWithEnoughData) {
        if (otherName === name) continue; // Skip self
        
        // Only calculate for metrics with same number of data points
        // This is a simplification - real correlation would handle uneven data better
        if (otherValues.length === values.length) {
          const correlation = this.calculateCorrelation(values, otherValues);
          
          if (Math.abs(correlation) >= 0.5) { // Only track strong correlations
            correlations.push({
              metric: otherName,
              strength: correlation
            });
          }
        }
      }
      
      patterns[name] = {
        trends: trend,
        correlations: correlations.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength))
      };
    }
    
    return patterns;
  }
  
  /**
   * Calculate Pearson correlation coefficient between two arrays.
   * @param x First array of values
   * @param y Second array of values
   * @returns Correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }
    
    // Calculate means
    const xMean = x.reduce((a, b) => a + b, 0) / x.length;
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    
    // Calculate variances and covariance
    let xxVar = 0;
    let yyVar = 0;
    let xyVar = 0;
    
    for (let i = 0; i < x.length; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      xxVar += xDiff * xDiff;
      yyVar += yDiff * yDiff;
      xyVar += xDiff * yDiff;
    }
    
    // Calculate correlation
    const denominator = Math.sqrt(xxVar * yyVar);
    return denominator === 0 ? 0 : xyVar / denominator;
  }
} 