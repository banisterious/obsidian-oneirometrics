import { DreamMetricData } from '../../../types';

/**
 * Interface for the content parsing service.
 * Responsible for extracting dream entries and metrics from markdown content.
 */
export interface IContentParser {
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
  ): DreamMetricData[];
  
  /**
   * Extract metrics text from a dream entry callout.
   * 
   * @param calloutContent The content of the callout
   * @returns The extracted metrics text
   */
  extractMetricsText(calloutContent: string): string;
  
  /**
   * Parse a date string from various formats.
   * 
   * @param dateStr The date string to parse
   * @returns Parsed date in YYYY-MM-DD format
   */
  parseDate(dateStr: string): string;
  
  /**
   * Clean dream content by removing callouts and formatting.
   * 
   * @param content The content to clean
   * @param calloutName The name of callouts to remove
   * @returns Cleaned content
   */
  cleanDreamContent(content: string, calloutName: string): string;
  
  /**
   * Extract title from dream entry content.
   * 
   * @param content The content to extract title from
   * @returns Extracted title or default title
   */
  extractTitle(content: string): string;
  
  /**
   * Process nested callouts correctly.
   * 
   * @param content The content with nested callouts
   * @param calloutName The name of callouts to process
   * @returns Processed callout content
   */
  processNestedCallouts(content: string, calloutName: string): string[];
} 