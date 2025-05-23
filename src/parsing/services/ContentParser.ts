import { DreamMetricData } from '../../../types';
import { IContentParser } from '../interfaces/IContentParser';

/**
 * Implementation of the content parser for extracting dream entries and metrics.
 */
export class ContentParser implements IContentParser {
  /**
   * Extract dream metrics data from markdown content.
   * 
   * @param content The markdown content to parse
   * @param calloutName The name of the callout containing dream metrics
   * @returns Array of extracted dream metrics data
   */
  extractDreamEntries(
    content: string,
    calloutName: string
  ): DreamMetricData[] {
    console.log(`[ContentParser] Extracting dream entries with callout: ${calloutName}`);
    const entries: DreamMetricData[] = [];
    
    try {
      // Process nested callouts
      const calloutContents = this.processNestedCallouts(content, calloutName);
      
      for (const calloutContent of calloutContents) {
        try {
          // Extract metrics text
          const metricsText = this.extractMetricsText(calloutContent);
          
          // Clean content (remove callouts and formatting)
          const cleanedContent = this.cleanDreamContent(calloutContent, calloutName);
          
          // Extract title
          const title = this.extractTitle(cleanedContent);
          
          // Parse date from content or filename
          // For simplicity, we'll use today's date as a fallback
          const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          const date = this.parseDate(dateStr);
          
          // Create a basic metrics object based on the metrics text
          // This will be processed further by the metrics processor
          const metrics: Record<string, number | string> = {};
          
          // Add a placeholder source - this would be populated with real data in production
          const source = {
            file: "unknown",
            id: "unknown"
          };
          
          entries.push({
            date,
            title,
            content: cleanedContent,
            source,
            metrics,
            // Store metrics text in calloutMetadata for later processing
            calloutMetadata: [metricsText]
          });
          
          console.log(`[ContentParser] Extracted entry: ${date} - ${title}`);
        } catch (error) {
          console.error(`[ContentParser] Error processing callout content:`, error);
        }
      }
    } catch (error) {
      console.error(`[ContentParser] Error extracting dream entries:`, error);
    }
    
    console.log(`[ContentParser] Extracted ${entries.length} dream entries`);
    return entries;
  }

  /**
   * Extract metrics text from a dream entry callout.
   * 
   * @param calloutContent The content of the callout
   * @returns The extracted metrics text
   */
  extractMetricsText(calloutContent: string): string {
    // Look for metrics in the format "metric1: value1, metric2: value2"
    const metricsRegex = /(?:^|\n)([^:\n]+:[^,\n]+(?:,[^:\n]+:[^,\n]+)*)/;
    const match = calloutContent.match(metricsRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return '';
  }

  /**
   * Parse a date string from various formats.
   * 
   * @param dateStr The date string to parse
   * @returns Parsed date in YYYY-MM-DD format
   */
  parseDate(dateStr: string): string {
    try {
      // Try to parse the date string
      const date = new Date(dateStr);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn(`[ContentParser] Invalid date: ${dateStr}, using current date`);
        return new Date().toISOString().split('T')[0];
      }
      
      // Format as YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error(`[ContentParser] Error parsing date: ${dateStr}`, error);
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Clean dream content by removing callouts and formatting.
   * 
   * @param content The content to clean
   * @param calloutName The name of callouts to remove
   * @returns Cleaned content
   */
  cleanDreamContent(content: string, calloutName: string): string {
    try {
      // Remove callout syntax
      let cleaned = content.replace(
        new RegExp(`\\[!${calloutName}\\][^\\n]*\\n`, 'gi'), 
        ''
      );
      
      // Remove any remaining callouts
      cleaned = cleaned.replace(/\[!.*?\].*?\n/g, '');
      
      // Trim whitespace
      cleaned = cleaned.trim();
      
      return cleaned;
    } catch (error) {
      console.error(`[ContentParser] Error cleaning content:`, error);
      return content;
    }
  }

  /**
   * Extract title from dream entry content.
   * 
   * @param content The content to extract title from
   * @returns Extracted title or default title
   */
  extractTitle(content: string): string {
    // Look for a title in the format "# Title" or "## Title"
    const titleRegex = /^#{1,2}\s+(.+?)$/m;
    const match = content.match(titleRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If no title found, use the first line
    const firstLine = content.split('\n')[0];
    
    if (firstLine && firstLine.length > 0) {
      // Limit title length
      return firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
    }
    
    return 'Untitled Dream';
  }

  /**
   * Process nested callouts correctly.
   * 
   * @param content The content with nested callouts
   * @param calloutName The name of callouts to process
   * @returns Processed callout content
   */
  processNestedCallouts(content: string, calloutName: string): string[] {
    const results: string[] = [];
    const calloutRegex = new RegExp(`\\[!${calloutName}\\]([^\\n]*)\\n((?:\\s*[^\\[\\n].*\\n|\\s*\\n)*)`, 'gim');
    
    let match;
    while ((match = calloutRegex.exec(content)) !== null) {
      const calloutContent = match[2].trim();
      results.push(calloutContent);
    }
    
    return results;
  }
} 