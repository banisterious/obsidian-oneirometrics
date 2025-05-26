/**
 * ContentParser implementation
 * This updated implementation fixes TypeScript errors and adds proper type definitions.
 */

import { DreamMetricData } from '../../types/core';
import { CalloutMetadata } from '../../types/callout-types';
import { getSourceFile, createSource, isCalloutMetadata } from '../../utils/type-guards';

// Define an extended version of CalloutMetadata that can include error information
interface ExtendedCalloutMetadata extends CalloutMetadata {
  error?: boolean;
}

export class ContentParser {
  /**
   * Parses content from a note to extract dream entries and metadata
   * @param content The content to parse
   * @param calloutTypeOrSource The callout type or source file path
   * @param source Optional source file if first parameter is callout type
   * @returns Parsed content with entries and metadata
   */
  parseContent(
    content: string, 
    calloutTypeOrSource?: string, 
    source?: string
  ): { 
    entries: DreamMetricData[], 
    metadata: Record<string, any> 
  } {
    const entries = this.extractDreamEntries(content, calloutTypeOrSource, source);
    return {
      entries,
      metadata: { totalEntries: entries.length }
    };
  }

  /**
   * Extracts dream entries from content
   * @param content The content to extract from
   * @param calloutTypeOrSource The callout type or source file path
   * @param source Optional source file if first parameter is callout type
   * @returns Array of dream entries
   */
  extractDreamEntries(
    content: string, 
    calloutTypeOrSource?: string, 
    source?: string
  ): DreamMetricData[] {
    // Handle different parameter variations
    let calloutType: string = 'dream';
    let sourcePath: string = '';
    
    if (!calloutTypeOrSource) {
      // Only content provided, use defaults
      calloutType = 'dream';
      sourcePath = '';
    } else if (!source) {
      // Two parameters - could be (content, type) or (content, source)
      if (calloutTypeOrSource.includes('/') || calloutTypeOrSource.includes('\\')) {
        // Likely a file path
        calloutType = 'dream';
        sourcePath = calloutTypeOrSource;
      } else {
        // Likely a callout type
        calloutType = calloutTypeOrSource;
        sourcePath = '';
      }
    } else {
      // Three parameters - standard call
      calloutType = calloutTypeOrSource;
      sourcePath = source;
    }
    
    if (!content) return [];
    
    // Find all dream callouts in the content
    const entries: DreamMetricData[] = [];
    const calloutRegex = new RegExp(`\\[!${calloutType}\\]([\\s\\S]*?)(?=\\[!|$)`, 'gi');
    
    let match;
    while ((match = calloutRegex.exec(content)) !== null) {
      const calloutContent = match[1].trim();
      try {
        const entry = this.processCallout(calloutContent, sourcePath);
        entries.push(entry);
      } catch (error) {
        console.error("Error processing callout:", error);
        // Continue with next callout even if this one fails
      }
    }
    
    return entries;
  }

  /**
   * Processes a callout into a dream entry
   * @param calloutContent The content of the callout
   * @param source The source file path
   * @returns A dream entry
   */
  private processCallout(calloutContent: string, source: string): DreamMetricData {
    try {
      // Extract date from the first line if present
      const dateMatch = calloutContent.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : this.parseDate('');
      
      // Extract metrics
      const metricsText = this.extractMetricsText(calloutContent);
      const metrics: Record<string, number | string> = {};
      
      // Parse metrics text to extract metric values
      const metricRegex = /(\w+(?:\s+\w+)*)\s*:\s*(\d+(?:\.\d+)?|\w+)/g;
      let metricMatch;
      while ((metricMatch = metricRegex.exec(metricsText)) !== null) {
        const name = metricMatch[1].trim();
        const valueStr = metricMatch[2].trim();
        metrics[name] = isNaN(Number(valueStr)) ? valueStr : Number(valueStr);
      }
      
      // Clean and extract the main dream content
      const cleanedContent = this.cleanDreamContent(calloutContent, 'dream');
      const title = this.extractTitle(cleanedContent);
      
      // Calculate word count
      const wordCount = cleanedContent.split(/\s+/).filter(word => word.length > 0).length;
      
      // Create DreamMetricData object
      return {
        date,
        title,
        content: cleanedContent,
        source: createSource(source),
        wordCount: wordCount,
        metrics,
        calloutMetadata: { type: 'dream' }
      };
    } catch (error) {
      console.error("Error in processCallout:", error);
      // Return a minimal valid dream entry to avoid breaking the entire process
      return {
        date: this.parseDate(''),
        title: 'Error processing entry',
        content: 'This entry could not be processed correctly.',
        source: createSource(source),
        wordCount: 0,
        metrics: {},
        calloutMetadata: { type: 'dream' } as ExtendedCalloutMetadata // Use type assertion to avoid type error
      };
    }
  }

  /**
   * Parses a callout to extract its type and content
   * @param callout The callout text to parse
   * @returns Parsed callout object with type and content
   */
  parseCallout(callout: string): { type: string; content: string; id?: string } {
    try {
      // Extract callout type and content
      const match = callout.match(/\[!(\w+)\]([\s\S]*)/);
      if (!match) {
        return { type: '', content: callout };
      }
      
      const type = match[1];
      const content = match[2].trim();
      
      // Try to find an ID in the content (usually in the first line)
      const idMatch = content.match(/^#(\w+)/);
      const id = idMatch ? idMatch[1] : undefined;
      
      return { type, content, id };
    } catch (error) {
      console.error("Error in parseCallout:", error);
      return { type: '', content: callout || '' };
    }
  }

  /**
   * Extracts metrics text from a callout
   * @param calloutContent The content of the callout
   * @returns The text containing metrics
   */
  extractMetricsText(calloutContent: string): string {
    if (!calloutContent) return '';
    
    try {
      // Look for a section with metrics (usually at the end or in a specific format)
      const sections = calloutContent.split('\n\n');
      
      // First try to find a dedicated metrics section
      const metricSection = sections.find(section => 
        section.includes(':') && /\w+\s*:\s*\d+/.test(section)
      );
      
      if (metricSection) {
        return metricSection;
      }
      
      // If no dedicated section, look for lines with metrics format anywhere
      const lines = calloutContent.split('\n');
      const metricLines = lines.filter(line => /\w+\s*:\s*\d+/.test(line));
      
      return metricLines.join('\n');
    } catch (error) {
      console.error("Error in extractMetricsText:", error);
      return '';
    }
  }

  /**
   * Parses a date string into a standardized format
   * @param dateString The date string to parse
   * @returns A standardized date string (YYYY-MM-DD)
   */
  parseDate(dateString: string): string {
    if (!dateString) {
      return new Date().toISOString().split('T')[0]; // Default to today
    }
    
    try {
      // Try to parse the date string
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      // Try alternative formats
      // Format: DD/MM/YYYY
      const ddmmyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [_, day, month, year] = ddmmyyyy;
        const parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      }
      
      // Format: MM/DD/YYYY
      const mmddyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (mmddyyyy) {
        const [_, month, day, year] = mmddyyyy;
        const parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      }
      
      // Fallback to today's date
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error("Error parsing date:", error);
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Cleans dream content by removing metadata and formatting
   * @param content The content to clean
   * @param calloutType The type of callout
   * @returns Cleaned dream content
   */
  cleanDreamContent(content: string, calloutType: string): string {
    if (!content) return '';
    
    try {
      // Remove metadata sections (lines with key: value format)
      const lines = content.split('\n');
      const contentLines = lines.filter(line => !(/^\w+(?:\s+\w+)*\s*:\s*\d+(?:\.\d+)?(?:\s*,\s*\w+(?:\s+\w+)*\s*:\s*\d+(?:\.\d+)?)*$/.test(line)));
      
      // Also remove any title-like lines at the beginning that start with # or are all uppercase
      let startIndex = 0;
      while (startIndex < contentLines.length && 
             (contentLines[startIndex].startsWith('#') || 
              contentLines[startIndex].toUpperCase() === contentLines[startIndex] && contentLines[startIndex].length > 5)) {
        startIndex++;
      }
      
      // Join the remaining content
      let result = contentLines.slice(startIndex).join('\n').trim();
      
      // Handle special case where entire content might be metrics
      if (!result && lines.length > 0) {
        // Include at least the first line if we filtered everything out
        result = lines[0];
      }
      
      return result;
    } catch (error) {
      console.error("Error cleaning dream content:", error);
      return content; // Return original content if cleaning fails
    }
  }

  /**
   * Extracts a title from content
   * @param content The content to extract from
   * @returns The extracted title
   */
  extractTitle(content: string): string {
    if (!content) return 'Untitled Dream';
    
    try {
      const lines = content.split('\n');
      let firstLine = lines[0] || '';
      
      // If first line is a heading, remove the # symbols
      if (firstLine.startsWith('#')) {
        firstLine = firstLine.replace(/^#+\s*/, '');
      }
      
      // Remove leading/trailing punctuation and trim
      firstLine = firstLine.replace(/^[#\s]+|[:.!?]+$/g, '').trim();
      
      // If title is too long, truncate it
      if (firstLine.length > 50) {
        firstLine = firstLine.substring(0, 47) + '...';
      }
      
      // If we end up with an empty title, use a fallback
      return firstLine || 'Untitled Dream';
    } catch (error) {
      console.error("Error extracting title:", error);
      return 'Untitled Dream';
    }
  }

  /**
   * Processes nested callouts in content
   * @param content The content to process
   * @param calloutType The type of callout to look for
   * @returns Array of processed callouts
   */
  processNestedCallouts(content: string, calloutType: string): Array<{ 
    content: string; 
    metadata: CalloutMetadata 
  }> {
    const results: Array<{ content: string; metadata: CalloutMetadata }> = [];
    
    try {
      // Regex to find nested callouts
      const nestedCalloutRegex = new RegExp(`\\[!${calloutType}\\]([\\s\\S]*?)(?=\\[!|$)`, 'gi');
      
      let match;
      while ((match = nestedCalloutRegex.exec(content)) !== null) {
        const calloutContent = match[1].trim();
        
        // Create metadata for this callout
        const metadata: CalloutMetadata = {
          type: calloutType,
          id: `callout-${results.length + 1}`
        };
        
        results.push({
          content: calloutContent,
          metadata
        });
      }
    } catch (error) {
      console.error("Error processing nested callouts:", error);
    }
    
    return results;
  }

  /**
   * Factory method to create a new ContentParser instance
   * @returns A new ContentParser instance
   */
  static create(): ContentParser {
    return new ContentParser();
  }
  
  /**
   * Handles unusual or corrupted formatting in dream entries
   * @param content The potentially corrupted content
   * @returns Cleaned up content
   */
  sanitizeContent(content: string): string {
    if (!content) return '';
    
    try {
      // Replace repeated newlines with double newlines
      let sanitized = content.replace(/\n{3,}/g, '\n\n');
      
      // Fix unclosed code blocks
      const codeBlockMatches = sanitized.match(/```[^`]*$/g);
      if (codeBlockMatches) {
        for (const match of codeBlockMatches) {
          sanitized = sanitized.replace(match, match + '\n```');
        }
      }
      
      // Fix unclosed callouts
      const unclosedCallouts = sanitized.match(/\[!(\w+)(?!\])([^\n]*)/g);
      if (unclosedCallouts) {
        for (const match of unclosedCallouts) {
          const fixed = match.replace(/\[!(\w+)(?!\])([^\n]*)/, '[!$1]$2');
          sanitized = sanitized.replace(match, fixed);
        }
      }
      
      // Remove invalid characters
      sanitized = sanitized.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      
      return sanitized;
    } catch (error) {
      console.error("Error sanitizing content:", error);
      return content; // Return original if sanitization fails
    }
  }
  
  /**
   * Extracts metrics from multiple callouts and combines them
   * @param callouts Array of callout contents
   * @returns Combined metrics from all callouts
   */
  extractMetricsFromCallouts(callouts: string[]): Record<string, number | string> {
    const combinedMetrics: Record<string, number | string> = {};
    
    try {
      for (const callout of callouts) {
        const metricsText = this.extractMetricsText(callout);
        const metricRegex = /(\w+(?:\s+\w+)*)\s*:\s*(\d+(?:\.\d+)?|\w+)/g;
        
        let metricMatch;
        while ((metricMatch = metricRegex.exec(metricsText)) !== null) {
          const name = metricMatch[1].trim();
          const valueStr = metricMatch[2].trim();
          const value = isNaN(Number(valueStr)) ? valueStr : Number(valueStr);
          
          // Take the higher value if the metric already exists
          if (name in combinedMetrics && typeof value === 'number' && typeof combinedMetrics[name] === 'number') {
            combinedMetrics[name] = Math.max(value as number, combinedMetrics[name] as number);
          } else if (!(name in combinedMetrics)) {
            combinedMetrics[name] = value;
          }
        }
      }
    } catch (error) {
      console.error("Error extracting metrics from callouts:", error);
    }
    
    return combinedMetrics;
  }
  
  /**
   * Validates a dream entry for required fields and formats
   * @param entry The dream entry to validate
   * @returns Object with validation status and any error messages
   */
  validateDreamEntry(entry: DreamMetricData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Check required fields
      if (!entry.date) {
        errors.push('Missing date field');
      } else {
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
          errors.push('Invalid date format (should be YYYY-MM-DD)');
        }
      }
      
      if (!entry.title || entry.title.trim() === '') {
        errors.push('Missing title');
      }
      
      if (!entry.content || entry.content.trim() === '') {
        errors.push('Missing content');
      }
      
      // Check for empty metrics
      if (!entry.metrics || Object.keys(entry.metrics).length === 0) {
        errors.push('No metrics found in entry');
      }
      
      // Validate source
      if (!entry.source) {
        errors.push('Missing source information');
      }
    } catch (error) {
      console.error("Error validating dream entry:", error);
      errors.push('Error during validation: ' + (error as Error).message);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
} 