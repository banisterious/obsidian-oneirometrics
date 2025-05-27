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
   * Parses a callout to extract its type and content
   * 
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
   * 
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
   * 
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
   * 
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
   * 
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
   * 
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
   * Extracts metrics from multiple callouts and combines them
   * 
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
   * 
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
   * Extracts callout metadata from a callout
   * 
   * @param callout The callout text
   * @returns The extracted callout metadata
   */
  getCalloutMetadata(callout: string): CalloutMetadata {
    try {
      const parsed = this.parseCallout(callout);
      return {
        type: parsed.type,
        id: parsed.id
      };
    } catch (error) {
      console.error("Error getting callout metadata:", error);
      return { type: 'unknown' };
    }
  }
} 