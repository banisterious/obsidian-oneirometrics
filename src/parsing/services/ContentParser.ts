/**
 * ContentParser implementation
 * 
 * This module provides comprehensive content parsing functionality for dream entries.
 * It handles the extraction, processing, and validation of dream callouts from markdown content.
 * 
 * Enhanced with defensive coding features to improve robustness and error resilience.
 */

import { DreamMetricData, DreamMetric } from '../../types/core';
import { CalloutMetadata } from '../../types/callout-types';
import { getSourceFile, createSource, isCalloutMetadata } from '../../utils/type-guards';
import { DreamEntry } from '../../types/declarations/dream-entry';
import { 
  getSafe, 
  getNestedProperty, 
  withErrorHandling, 
  isObject, 
  isNonEmptyString,
  safeJsonParse
} from '../../utils/defensive-utils';
import safeLogger from '../../logging/safe-logger';
import { error, warn, debug } from '../../logging';

/**
 * Content parsing options
 */
export interface ContentParsingOptions {
  /** The callout type to search for (defaults to 'dream') */
  calloutType?: string;
  /** Whether to include validation of entries */
  validate?: boolean;
  /** Whether to include nested callouts */
  includeNested?: boolean;
  /** Whether to sanitize content */
  sanitize?: boolean;
  /** Whether to use strict mode (throw errors) or resilient mode (recover) */
  strict?: boolean;
  /** A fallback function to handle errors */
  errorHandler?: (error: Error, context: string) => void;
}

/**
 * ContentParser provides utilities for parsing Obsidian content to extract dream entries
 */
export class ContentParser {
  /**
   * Default parsing options
   */
  private defaultOptions: ContentParsingOptions = {
    calloutType: 'dream',
    validate: true,
    includeNested: false,
    sanitize: true,
    strict: false,
    errorHandler: (error: Error, context: string) => {
      safeLogger.error('ContentParser', `Error in ${context}`, error);
    }
  };

  /**
   * Parses content from a note to extract dream entries and metadata
   * 
   * @param content The content to parse
   * @param calloutTypeOrSource The callout type or source file path
   * @param source Optional source file if first parameter is callout type
   * @param options Additional parsing options
   * @returns Parsed content with entries and metadata
   */
  parseContent = withErrorHandling(
    (
      content: string, 
      calloutTypeOrSource?: string, 
      source?: string,
      options?: ContentParsingOptions
    ) => {
      // Ensure content is a string
      const safeContent = isNonEmptyString(content) ? content : '';
      
      // Extract entries with defensive error handling
      const entries = this.extractDreamEntries(safeContent, calloutTypeOrSource, source, options);
      
      // Calculate additional metadata with safe calculations
      const wordCounts = entries.map(entry => getSafe(entry, e => e.wordCount, 0));
      const totalWordCount = wordCounts.reduce((sum, count) => sum + count, 0);
      const avgWordCount = entries.length > 0 ? totalWordCount / entries.length : 0;
      
      // Safely resolve callout type
      const resolvedCalloutType = this.resolveCalloutType(calloutTypeOrSource);
      
      return {
        entries,
        metadata: { 
          totalEntries: entries.length,
          totalWordCount,
          averageWordCount: avgWordCount.toFixed(1),
          calloutType: resolvedCalloutType
        }
      };
    },
    {
      fallbackValue: { entries: [], metadata: { totalEntries: 0, totalWordCount: 0, averageWordCount: "0.0", calloutType: "dream" } },
      errorMessage: "Failed to parse content",
      onError: (error) => safeLogger.error('ContentParser', 'Error in parseContent', error)
    }
  );

  /**
   * Extracts dream entries from content
   * 
   * @param content The content to extract from
   * @param calloutTypeOrSource The callout type or source file path
   * @param source Optional source file if first parameter is callout type
   * @param options Additional parsing options
   * @returns Array of dream entries
   */
  extractDreamEntries = withErrorHandling(
    (
      content: string, 
      calloutTypeOrSource?: string, 
      source?: string,
      options?: ContentParsingOptions
    ): DreamMetricData[] => {
      // Set default options
      const opts: ContentParsingOptions = {
        ...this.defaultOptions,
        ...options
      };
      
      // Ensure we have valid inputs or use safe defaults
      const safeContent = isNonEmptyString(content) ? content : '';
      
      // Handle different parameter variations with defensive coding
      const calloutType = this.resolveCalloutType(calloutTypeOrSource);
      const sourcePath = this.resolveSourcePath(calloutTypeOrSource, source);
      
      if (!safeContent) return [];
      
      // Sanitize content if requested
      const processedContent = opts.sanitize ? this.sanitizeContent(safeContent) : safeContent;
      
      // Find all dream callouts in the content
      const entries: DreamMetricData[] = [];
      
      try {
        const calloutRegex = new RegExp(`\\[!${calloutType}\\]([\\s\\S]*?)(?=\\[!|$)`, 'gi');
        
        let match;
        while ((match = calloutRegex.exec(processedContent)) !== null) {
          // Safely extract callout content with defensive coding
          const calloutContent = getSafe(match, m => m[1]?.trim(), '');
          
          try {
            const entry = this.processCallout(calloutContent, sourcePath);
            
            // Validate if requested
            if (opts.validate) {
              const validation = this.validateDreamEntry(entry);
              if (!validation.valid) {
                safeLogger.warn('ContentParser', `Validation warnings for entry: ${validation.errors.join(', ')}`);
                // Add validation warnings to the entry's metadata
                if (isCalloutMetadata(entry.calloutMetadata)) {
                  (entry.calloutMetadata as CalloutMetadata).warnings = validation.errors;
                }
              }
            }
            
            entries.push(entry);
          } catch (error) {
            safeLogger.error("ContentParser", "Error processing callout", error);
            
            if (opts.strict) {
              throw error; // Re-throw in strict mode
            } else {
              // In non-strict mode, create a fallback entry to maintain continuity
              const fallbackEntry = this.createFallbackEntry(calloutContent, sourcePath, error);
              entries.push(fallbackEntry);
            }
          }
        }
      } catch (regexError) {
        safeLogger.error("ContentParser", "Error in callout regex", regexError);
        // Even in case of regex failure, return what we have so far
        if (opts.strict) {
          throw regexError;
        }
      }
      
      // Include nested callouts if requested
      if (opts.includeNested) {
        try {
          const nestedCallouts = this.processNestedCallouts(processedContent, calloutType);
          for (const nestedCallout of nestedCallouts) {
            try {
              const nestedContent = getSafe(nestedCallout, n => n.content, '');
              const entry = this.processCallout(nestedContent, sourcePath);
              entry.calloutMetadata = nestedCallout.metadata;
              entries.push(entry);
            } catch (error) {
              safeLogger.error("ContentParser", "Error processing nested callout", error);
              
              if (opts.strict) {
                throw error; // Re-throw in strict mode
              } else {
                // In non-strict mode, create a fallback entry
                const fallbackEntry = this.createFallbackEntry(
                  getSafe(nestedCallout, n => n.content, ''),
                  sourcePath, 
                  error,
                  nestedCallout.metadata
                );
                entries.push(fallbackEntry);
              }
            }
          }
        } catch (error) {
          safeLogger.error("ContentParser", "Error processing nested callouts", error);
          if (opts.strict) {
            throw error;
          }
        }
      }
      
      return entries;
    },
    {
      fallbackValue: [],
      errorMessage: "Failed to extract dream entries",
      onError: (error) => safeLogger.error('ContentParser', 'Error in extractDreamEntries', error)
    }
  );

  /**
   * Creates a fallback entry when processing fails
   * 
   * @param calloutContent Original callout content that failed to process
   * @param source Source file path
   * @param error The error that occurred
   * @param metadata Optional callout metadata
   * @returns A minimal valid dream entry
   */
  private createFallbackEntry(
    calloutContent: string, 
    source: string, 
    error: any,
    metadata?: CalloutMetadata
  ): DreamMetricData {
    // Try to extract some minimal information if possible
    let title = 'Error processing entry';
    let date = this.parseDate('');
    
    try {
      // Attempt to extract date from the content
      const dateMatch = calloutContent.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        date = dateMatch[1];
      }
      
      // Attempt to extract a title
      const firstLine = calloutContent.split('\n')[0];
      if (firstLine && firstLine.length < 100) {
        title = firstLine;
      }
    } catch (extractionError) {
      // Ignore errors in fallback extraction
    }
    
    // Create extended metadata with error information
    const errorMetadata: CalloutMetadata = {
      type: 'dream',
      error: true,
      parseFailure: true,
      recoveryAttempted: true,
      ...metadata
    };
    
    // Create a minimal valid entry
    return {
      date,
      title,
      content: `This entry could not be processed correctly.\nOriginal content: ${calloutContent.substring(0, 100)}...`,
      source: createSource(source),
      wordCount: 0,
      metrics: {},
      calloutMetadata: errorMetadata
    };
  }

  /**
   * Resolves the callout type from the input parameters
   * 
   * @param calloutTypeOrSource The callout type or source file path
   * @returns The resolved callout type
   */
  private resolveCalloutType = withErrorHandling(
    (calloutTypeOrSource?: string): string => {
      if (!calloutTypeOrSource) {
        return 'dream';
      }
      
      // If it looks like a file path, assume default callout type
      if (calloutTypeOrSource.includes('/') || calloutTypeOrSource.includes('\\')) {
        return 'dream';
      }
      
      return calloutTypeOrSource;
    },
    {
      errorMessage: "Failed to resolve callout type",
      fallbackValue: 'dream',
      onError: (error) => safeLogger.error('ContentParser', 'Error in resolveCalloutType', error)
    }
  );
  
  /**
   * Resolves the source path from the input parameters
   * 
   * @param calloutTypeOrSource The callout type or source file path
   * @param source Optional source file
   * @returns The resolved source path
   */
  private resolveSourcePath = withErrorHandling(
    (calloutTypeOrSource?: string, source?: string): string => {
      if (source) {
        return source;
      }
      
      if (!calloutTypeOrSource) {
        return '';
      }
      
      // If it looks like a file path, use it as the source
      if (calloutTypeOrSource.includes('/') || calloutTypeOrSource.includes('\\')) {
        return calloutTypeOrSource;
      }
      
      return '';
    },
    {
      errorMessage: "Failed to resolve source path",
      fallbackValue: '',
      onError: (error) => safeLogger.error('ContentParser', 'Error in resolveSourcePath', error)
    }
  );

  /**
   * Processes a callout into a dream entry
   * 
   * @param calloutContent The content of the callout
   * @param source The source file path
   * @returns A dream entry
   */
  private processCallout = withErrorHandling(
    (calloutContent: string, source: string): DreamMetricData => {
      // Ensure we have valid inputs
      const safeCalloutContent = isNonEmptyString(calloutContent) ? calloutContent : '';
      const safeSource = isNonEmptyString(source) ? source : '';
      
      // Extract date from the first line if present
      const dateMatch = safeCalloutContent.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : this.parseDate('');
      
      // Extract metrics with defensive coding
      const metricsText = this.extractMetricsText(safeCalloutContent);
      const metrics: Record<string, number | string> = {};
      
      try {
        // Parse metrics text to extract metric values
        const metricRegex = /(\w+(?:\s+\w+)*)\s*:\s*(\d+(?:\.\d+)?|\w+)/g;
        let metricMatch;
        while ((metricMatch = metricRegex.exec(metricsText)) !== null) {
          const name = getSafe(metricMatch, m => m[1]?.trim(), '');
          const valueStr = getSafe(metricMatch, m => m[2]?.trim(), '');
          
          if (name && valueStr) {
            metrics[name] = isNaN(Number(valueStr)) ? valueStr : Number(valueStr);
          }
        }
      } catch (metricError) {
        safeLogger.error('ContentParser', 'Error extracting metrics', metricError);
        // Continue with empty metrics rather than failing the whole entry
      }
      
      // Clean and extract the main dream content
      const cleanedContent = this.cleanDreamContent(safeCalloutContent, 'dream');
      const title = this.extractTitle(cleanedContent);
      
      // Calculate word count safely
      const wordCount = cleanedContent.split(/\s+/).filter(word => word && word.length > 0).length;
      
      // Create DreamMetricData object
      return {
        date,
        title,
        content: cleanedContent,
        source: createSource(safeSource),
        wordCount: wordCount,
        metrics,
        calloutMetadata: { type: 'dream' }
      };
    },
    {
      fallbackValue: {
        date: '',
        title: 'Error processing entry',
        content: 'This entry could not be processed correctly.',
        source: createSource(''),
        wordCount: 0,
        metrics: {},
        calloutMetadata: { type: 'dream', error: true }
      },
      errorMessage: "Failed to process callout",
      onError: (error) => safeLogger.error('ContentParser', 'Error in processCallout', error)
    }
  );

  /**
   * Parse a callout to extract its type, content, and optional block ID
   * 
   * @param callout The callout text to parse
   * @returns The parsed callout data
   */
  parseCallout(callout: string): { type: string; content: string; id?: string } {
    try {
      const calloutMatch = callout.match(/\[!([^\]]+)\]([\s\S]*)/);
      if (!calloutMatch) {
        return { type: 'unknown', content: callout };
      }
      
      const type = calloutMatch[1].trim();
      const content = calloutMatch[2].trim();
      
      // Look for a block ID
      const blockIdMatch = callout.match(/\^(\w+)/);
      const id = blockIdMatch ? blockIdMatch[1] : undefined;
      
      return { type, content, id };
    } catch (error) {
      error("ContentParser", "Error in parseCallout", error);
      // Return a fallback value for resilience
      return { type: 'unknown', content: callout || '' };
    }
  }

  /**
   * Extracts metrics text from a callout
   * 
   * @param calloutContent The content of the callout
   * @returns The text containing metrics
   */
  extractMetricsText(calloutContent: string): string {
    try {
      // If empty content, return empty string
      if (!calloutContent) return '';
      
      // Split content by lines
      const lines = calloutContent.split('\n');
      
      // Identify metrics lines by looking for key-value pairs
      let metricsText = '';
      for (const line of lines) {
        // Look for lines with metrics in format "Name: Value"
        if (line.includes(':')) {
          metricsText += line + '\n';
        }
      }
      
      return metricsText.trim();
    } catch (error) {
      error("ContentParser", "Error in extractMetricsText", error);
      return '';
    }
  }

  /**
   * Parse a date string into a standardized format
   * 
   * @param dateString The date string to parse
   * @returns A standardized date string
   */
  parseDate(dateString: string): string {
    try {
      // If no date string, return empty
      if (!dateString) return '';
      
      // Attempt to parse the date (normalize formats like YYYY-MM-DD, MM/DD/YYYY, etc.)
      // This is a simplified example - in real code we would use a proper date library
      const dateMatches = dateString.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
      if (dateMatches) {
        const [_, year, month, day] = dateMatches;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Try other common formats (MM/DD/YYYY)
      const altMatches = dateString.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
      if (altMatches) {
        const [_, month, day, year] = altMatches;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // If we couldn't parse it, return it unchanged
      return dateString;
    } catch (error) {
      error("ContentParser", "Error parsing date", error);
      return dateString;
    }
  }

  /**
   * Clean dream content by removing callout syntax and other unwanted elements
   * 
   * @param content The content to clean
   * @param calloutType The type of callout to look for
   * @returns Cleaned content
   */
  cleanDreamContent(content: string, calloutType: string): string {
    try {
      // If no content, return empty string
      if (!content) return '';
      
      // Remove callout syntax
      let cleaned = content.replace(new RegExp(`\\[!${calloutType}\\]`, 'gi'), '');
      
      // Remove block IDs
      cleaned = cleaned.replace(/\^[\w\d]+/g, '');
      
      // Remove multiple consecutive blank lines
      cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // Remove leading/trailing whitespace
      cleaned = cleaned.trim();
      
      return cleaned;
    } catch (error) {
      error("ContentParser", "Error cleaning dream content", error);
      return content;
    }
  }

  /**
   * Extracts a title from content
   * 
   * @param content The content to extract from
   * @returns The extracted title
   */
  extractTitle(content: string): string {
    try {
      // Return empty string for empty content
      if (!content) return '';
      
      // Split by lines
      const lines = content.split('\n');
      
      // Try to find a title line using different approaches
      
      // Check for a heading (# Title)
      const headingLine = lines.find(line => /^#+\s+(.+)$/.test(line));
      if (headingLine) {
        const headingMatch = headingLine.match(/^#+\s+(.+)$/);
        if (headingMatch && headingMatch[1]) {
          return headingMatch[1].trim();
        }
      }
      
      // If no heading, use the first non-empty line
      const firstNonEmptyLine = lines.find(line => line.trim().length > 0);
      if (firstNonEmptyLine) {
        return firstNonEmptyLine.trim();
      }
      
      // If nothing found, return a default title
      return 'Untitled Dream';
    } catch (error) {
      error("ContentParser", "Error extracting title", error);
      return 'Untitled Dream';
    }
  }

  /**
   * Process nested callouts within content
   * 
   * @param content The content to process
   * @param calloutType The type of callout to look for
   * @returns Array of nested callout objects
   */
  processNestedCallouts(content: string, calloutType: string): Array<{ 
    content: string; 
    metadata: CalloutMetadata 
  }> {
    try {
      // If no content, return empty array
      if (!content) return [];
      
      const results = [];
      
      // Find all nested callouts
      const nestedRegex = new RegExp(`<div class="callout-content">\\s*\\[!${calloutType}\\]([\\s\\S]*?)(?=<\\/div>)`, 'gi');
      
      let match;
      while ((match = nestedRegex.exec(content)) !== null) {
        const calloutContent = match[1].trim();
        
        // Extract metadata from the callout
        const metadata = this.getCalloutMetadata(calloutContent);
        
        results.push({
          content: calloutContent,
          metadata
        });
      }
      
      return results;
    } catch (error) {
      error("ContentParser", "Error processing nested callouts", error);
      return [];
    }
  }

  /**
   * Factory method to create a new ContentParser instance
   * 
   * @returns A new ContentParser instance
   */
  static create(): ContentParser {
    return new ContentParser();
  }
  
  /**
   * Handles unusual or corrupted formatting in dream entries
   * 
   * @param content The potentially corrupted content
   * @returns Cleaned up content
   */
  sanitizeContent = withErrorHandling(
    (content: string): string => {
      if (!content) return '';
      
      // Replace problematic characters and sequences
      let sanitized = content
        .replace(/\u0000/g, '') // Remove null bytes
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n');  // Convert remaining CR to LF
      
      return sanitized;
    },
    {
      fallbackValue: '',
      errorMessage: "Failed to sanitize content",
      onError: (error) => safeLogger.error('ContentParser', 'Error in sanitizeContent', error)
    }
  );
  
  /**
   * Extract metrics from callout content strings
   * 
   * @param callouts Array of callout content strings
   * @returns Record of metric names and values
   */
  extractMetricsFromCallouts(callouts: string[]): Record<string, number | string> {
    try {
      // If no callouts, return empty object
      if (!callouts || callouts.length === 0) return {};
      
      const metrics: Record<string, number | string> = {};
      
      // Process each callout
      for (const callout of callouts) {
        // Extract metrics text
        const metricsText = this.extractMetricsText(callout);
        
        // Split into lines
        const lines = metricsText.split('\n');
        
        // Process each line to extract metrics
        for (const line of lines) {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const name = line.substring(0, colonIndex).trim();
            const valueText = line.substring(colonIndex + 1).trim();
            
            // Try to convert to number if possible
            const numValue = parseFloat(valueText);
            const value = !isNaN(numValue) ? numValue : valueText;
            
            // Add to metrics object
            metrics[name] = value;
          }
        }
      }
      
      return metrics;
    } catch (error) {
      error("ContentParser", "Error extracting metrics from callouts", error);
      return {};
    }
  }
  
  /**
   * Validate a dream entry for required fields and data types
   * 
   * @param entry The dream entry to validate
   * @returns Validation result with errors list
   */
  validateDreamEntry(entry: DreamMetricData): { valid: boolean; errors: string[] } {
    try {
      const errors = [];
      
      // Check for required fields
      if (!entry.content) {
        errors.push('Missing content');
      }
      
      // Check date format if present
      if (entry.date) {
        const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(entry.date);
        if (!dateValid) {
          errors.push('Invalid date format');
        }
      }
      
      // Check metrics
      if (!entry.metrics || typeof entry.metrics !== 'object') {
        errors.push('Missing or invalid metrics object');
      }
      
      // Check title
      if (!entry.title) {
        errors.push('Missing title');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      error("ContentParser", "Error validating dream entry", error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }
  
  /**
   * Converts a DreamMetricData object to a DreamEntry
   * 
   * @param metricData The DreamMetricData object to convert
   * @returns A DreamEntry object
   */
  convertToEntry(metricData: DreamMetricData): DreamEntry {
    // Create metrics array from metrics record
    const metrics: DreamMetric[] = Object.entries(metricData.metrics).map(([name, value]) => ({
      name,
      value: typeof value === 'number' ? value : 0,
      icon: '', // We don't have icon information in the metrics record
      enabled: true,
      minValue: 1,  // Add required properties
      maxValue: 5,  // Add required properties
      description: `${name} metric` // Add required property with default value
    }));
    
    return {
      date: metricData.date,
      title: metricData.title,
      content: metricData.content,
      source: metricData.source,
      wordCount: metricData.wordCount,
      metrics
    };
  }
  
  /**
   * Extract metadata from a callout string
   * 
   * @param callout The callout string
   * @returns Callout metadata object
   */
  getCalloutMetadata(callout: string): CalloutMetadata {
    try {
      // If no callout, return default metadata
      if (!callout) {
        return { type: 'unknown' };
      }
      
      // Extract callout type and metadata
      const calloutMatch = callout.match(/\[!([^\]]+)\]/);
      if (!calloutMatch) {
        return { type: 'unknown' };
      }
      
      const typeWithMeta = calloutMatch[1];
      
      // Split type and metadata if pipe character exists
      const parts = typeWithMeta.split('|');
      const type = parts[0].trim();
      
      // Initialize metadata with type
      const metadata: CalloutMetadata = { type };
      
      // Process metadata if present
      if (parts.length > 1) {
        const metaParts = parts.slice(1);
        
        for (const part of metaParts) {
          // Look for key=value pairs
          const keyValueMatch = part.match(/(\w+)=([^,]+)/);
          if (keyValueMatch) {
            const [_, key, value] = keyValueMatch;
            metadata[key] = value.trim();
          }
        }
      }
      
      // Look for block ID
      const blockIdMatch = callout.match(/\^(\w+)/);
      if (blockIdMatch) {
        metadata.id = blockIdMatch[1];
      }
      
      return metadata;
    } catch (error) {
      error("ContentParser", "Error getting callout metadata", error);
      return { type: 'unknown' };
    }
  }
} 