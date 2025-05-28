/**
 * SafeContentParser - Enhanced ContentParser with defensive coding patterns
 * 
 * Provides comprehensive error handling, recovery strategies, and validation
 * for parsing dream content with robust defensive programming patterns.
 */

import { DreamMetricData, DreamMetric } from '../../types/core';
import { CalloutMetadata } from '../../types/callout-types';
import { withErrorHandling, getSafe, isNonEmptyString, safeJsonParse } from '../../utils/defensive-utils';
import safeLogger from '../../logging/safe-logger';
import { SafeCalloutParser } from './SafeCalloutParser';

/**
 * Options for safe content parsing
 */
export interface SafeContentParsingOptions {
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
  
  /** Whether to use transaction-like parsing (all-or-nothing) */
  transactional?: boolean;
  
  /** Whether to enable detailed logging */
  debug?: boolean;
  
  /** Maximum content length to process (prevents regex DoS) */
  maxContentLength?: number;
}

/**
 * Results from content parsing
 */
export interface ParseContentResult {
  /** Extracted dream entries */
  entries: DreamMetricData[];
  
  /** Parsing metadata */
  metadata: {
    /** Total number of entries found */
    totalEntries: number;
    
    /** Total word count across all entries */
    totalWordCount: number;
    
    /** Average word count per entry */
    averageWordCount: string;
    
    /** Callout type that was searched for */
    calloutType: string;
    
    /** Number of entries with errors */
    errorCount?: number;
    
    /** Number of entries with warnings */
    warningCount?: number;
    
    /** Whether the parsing was completely successful */
    success: boolean;
    
    /** Array of error messages if any occurred */
    errors?: string[];
  };
}

/**
 * Provides safe, defensive content parsing with comprehensive error handling
 */
export class SafeContentParser {
  /**
   * Default parsing options
   */
  private defaultOptions: SafeContentParsingOptions = {
    calloutType: 'dream',
    validate: true,
    includeNested: false,
    sanitize: true,
    strict: false,
    transactional: false,
    debug: false,
    maxContentLength: 500000 // 500KB to prevent regex DoS
  };
  
  /**
   * The callout parser used to extract callout metadata
   */
  private calloutParser: SafeCalloutParser;
  
  /**
   * Creates a new SafeContentParser
   */
  constructor(options?: SafeContentParsingOptions) {
    // Create callout parser with appropriate options
    this.calloutParser = SafeCalloutParser.create({
      strict: options?.strict,
      debug: options?.debug,
      defaultType: options?.calloutType || 'dream'
    });
  }
  
  /**
   * Safely parses content with comprehensive error handling and recovery
   */
  parseContent = withErrorHandling(
    (
      content: string,
      calloutTypeOrSource?: string,
      source?: string,
      options?: SafeContentParsingOptions
    ): ParseContentResult => {
      // Merge options with defaults
      const opts: SafeContentParsingOptions = {
        ...this.defaultOptions,
        ...options
      };
      
      // Check for empty or invalid content with safe fallback
      if (!isNonEmptyString(content)) {
        if (opts.debug) {
          safeLogger.debug('ContentParser', 'Empty or invalid content provided');
        }
        
        return this.createEmptyResult(opts.calloutType || 'dream');
      }
      
      // Limit content size to prevent regex DoS
      const safeContent = content.length > opts.maxContentLength!
        ? content.substring(0, opts.maxContentLength!)
        : content;
      
      if (safeContent.length < content.length) {
        safeLogger.warn('ContentParser', `Content truncated from ${content.length} to ${safeContent.length} characters to prevent DoS`);
      }
      
      // Resolve callout type and source path
      const calloutType = this.resolveCalloutType(calloutTypeOrSource, opts);
      const sourcePath = this.resolveSourcePath(calloutTypeOrSource, source);
      
      // Begin a parsing "transaction"
      const parsingContext = {
        entries: [] as DreamMetricData[],
        errors: [] as string[],
        errorCount: 0,
        warningCount: 0
      };
      
      // Sanitize content if requested
      const processedContent = opts.sanitize 
        ? this.sanitizeContent(safeContent)
        : safeContent;
      
      // Extract callouts from content
      try {
        this.extractCallouts(
          processedContent,
          calloutType,
          sourcePath,
          parsingContext,
          opts
        );
        
        // Include nested callouts if requested
        if (opts.includeNested) {
          this.extractNestedCallouts(
            processedContent,
            calloutType,
            sourcePath,
            parsingContext,
            opts
          );
        }
      } catch (error) {
        safeLogger.error('ContentParser', 'Error extracting callouts', error);
        
        // Handle based on strict mode and transactional settings
        if (opts.strict) {
          throw error;
        }
        
        if (opts.transactional) {
          // In transactional mode, discard all entries on error
          parsingContext.entries = [];
          parsingContext.errors.push(`Failed to parse content: ${error instanceof Error ? error.message : String(error)}`);
          parsingContext.errorCount++;
        }
        // In non-transactional mode, keep any successfully parsed entries
      }
      
      // Calculate metadata
      const wordCounts = parsingContext.entries.map(entry => getSafe(entry, e => e.wordCount, 0));
      const totalWordCount = wordCounts.reduce((sum, count) => sum + count, 0);
      const avgWordCount = parsingContext.entries.length > 0 
        ? totalWordCount / parsingContext.entries.length 
        : 0;
      
      return {
        entries: parsingContext.entries,
        metadata: {
          totalEntries: parsingContext.entries.length,
          totalWordCount,
          averageWordCount: avgWordCount.toFixed(1),
          calloutType,
          errorCount: parsingContext.errorCount,
          warningCount: parsingContext.warningCount,
          success: parsingContext.errorCount === 0,
          errors: parsingContext.errors.length > 0 ? parsingContext.errors : undefined
        }
      };
    },
    {
      fallbackValue: this.createEmptyResult('dream'),
      errorMessage: "Failed to parse content",
      onError: (error) => safeLogger.error('ContentParser', 'Critical error in parseContent', error)
    }
  );
  
  /**
   * Safely extracts callouts from content
   */
  private extractCallouts(
    content: string,
    calloutType: string,
    sourcePath: string,
    parsingContext: {
      entries: DreamMetricData[];
      errors: string[];
      errorCount: number;
      warningCount: number;
    },
    options: SafeContentParsingOptions
  ): void {
    // Create a safe regex for extracting callouts
    try {
      // This regex pattern looks for callouts of the specified type
      // It handles both single and multi-line callouts
      const calloutRegex = new RegExp(`\\[!${calloutType}\\]([\\s\\S]*?)(?=\\[!|$)`, 'gi');
      
      let match;
      let matchCount = 0;
      const MAX_MATCHES = 1000; // Safety limit to prevent infinite loops
      
      while ((match = calloutRegex.exec(content)) !== null && matchCount < MAX_MATCHES) {
        matchCount++;
        
        // Extract callout content with defensive coding
        const calloutContent = getSafe(match, m => m[1]?.trim(), '');
        
        if (!calloutContent) {
          parsingContext.errors.push(`Empty callout content found at position ${match.index}`);
          parsingContext.errorCount++;
          continue;
        }
        
        try {
          // Process the callout
          const entry = this.processCallout(calloutContent, sourcePath, options);
          
          // Validate if requested
          if (options.validate) {
            const validation = this.validateDreamEntry(entry);
            
            if (!validation.valid) {
              if (entry.calloutMetadata) {
                if (Array.isArray(entry.calloutMetadata)) {
                  // Handle array of metadata
                  if (entry.calloutMetadata.length > 0) {
                    entry.calloutMetadata[0].warnings = validation.errors;
                  }
                } else {
                  // Handle single metadata object
                  entry.calloutMetadata.warnings = validation.errors;
                }
              }
              
              parsingContext.warningCount += validation.errors.length;
              
              if (options.debug) {
                safeLogger.debug('ContentParser', `Validation warnings for entry: ${validation.errors.join(', ')}`, {
                  source: sourcePath,
                  title: entry.title
                });
              }
            }
          }
          
          parsingContext.entries.push(entry);
        } catch (error) {
          parsingContext.errorCount++;
          const errorMessage = `Error processing callout: ${error instanceof Error ? error.message : String(error)}`;
          parsingContext.errors.push(errorMessage);
          safeLogger.error('ContentParser', `${errorMessage} (source: ${sourcePath})`);
          
          if (options.strict) {
            throw error; // Re-throw in strict mode
          } 
          
          if (!options.transactional) {
            // In non-transactional mode, create a fallback entry
            const fallbackEntry = this.createFallbackEntry(calloutContent, sourcePath, error);
            parsingContext.entries.push(fallbackEntry);
          }
        }
      }
      
      if (matchCount >= MAX_MATCHES) {
        safeLogger.warn('ContentParser', `Reached maximum callout limit (${MAX_MATCHES}). Some callouts may be skipped.`);
      }
    } catch (regexError) {
      parsingContext.errorCount++;
      const errorMessage = `Error in callout regex: ${regexError instanceof Error ? regexError.message : String(regexError)}`;
      parsingContext.errors.push(errorMessage);
      safeLogger.error('ContentParser', errorMessage);
      
      if (options.strict) {
        throw regexError;
      }
    }
  }
  
  /**
   * Safely extracts nested callouts
   */
  private extractNestedCallouts(
    content: string,
    calloutType: string,
    sourcePath: string,
    parsingContext: {
      entries: DreamMetricData[];
      errors: string[];
      errorCount: number;
      warningCount: number;
    },
    options: SafeContentParsingOptions
  ): void {
    try {
      // Find callouts that might contain nested dream callouts
      const containerCalloutRegex = new RegExp(`\\[!(\\w+)\\]([\\s\\S]*?)(?=\\[!|$)`, 'gi');
      
      let match;
      let matchCount = 0;
      const MAX_MATCHES = 100; // Safety limit
      
      while ((match = containerCalloutRegex.exec(content)) !== null && matchCount < MAX_MATCHES) {
        matchCount++;
        
        const containerType = getSafe(match, m => m[1], '');
        const containerContent = getSafe(match, m => m[2], '');
        
        // Skip the main callout type we're already processing
        if (containerType.toLowerCase() === calloutType.toLowerCase()) {
          continue;
        }
        
        // Look for nested callouts of our target type
        const nestedRegex = new RegExp(`\\[!${calloutType}\\]([\\s\\S]*?)(?=\\[!|$)`, 'gi');
        let nestedMatch;
        
        while ((nestedMatch = nestedRegex.exec(containerContent)) !== null) {
          const nestedContent = getSafe(nestedMatch, m => m[1]?.trim(), '');
          
          if (!nestedContent) continue;
          
          try {
            // Create metadata for the nested callout
            const metadata: CalloutMetadata = {
              type: calloutType,
              id: `nested-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              isValid: true,
              nestedInType: containerType
            };
            
            // Process the nested callout
            const entry = this.processCallout(nestedContent, sourcePath, options);
            entry.calloutMetadata = metadata;
            
            if (options.validate) {
              const validation = this.validateDreamEntry(entry);
              if (!validation.valid) {
                metadata.warnings = validation.errors;
                metadata.isValid = false;
                parsingContext.warningCount += validation.errors.length;
              }
            }
            
            parsingContext.entries.push(entry);
          } catch (error) {
            parsingContext.errorCount++;
            const errorMessage = `Error processing nested callout: ${error instanceof Error ? error.message : String(error)}`;
            parsingContext.errors.push(errorMessage);
            safeLogger.error('ContentParser', `${errorMessage} (source: ${sourcePath})`);
            
            if (options.strict) {
              throw error;
            }
            
            if (!options.transactional) {
              const fallbackEntry = this.createFallbackEntry(
                nestedContent, 
                sourcePath, 
                error, 
                { type: calloutType, nestedInType: containerType, isValid: false }
              );
              parsingContext.entries.push(fallbackEntry);
            }
          }
        }
      }
    } catch (error) {
      parsingContext.errorCount++;
      const errorMessage = `Error extracting nested callouts: ${error instanceof Error ? error.message : String(error)}`;
      parsingContext.errors.push(errorMessage);
      safeLogger.error('ContentParser', errorMessage);
      
      if (options.strict) {
        throw error;
      }
    }
  }
  
  /**
   * Creates a fallback entry when parsing fails
   */
  private createFallbackEntry(
    calloutContent: string,
    source: string,
    error: any,
    metadata?: CalloutMetadata
  ): DreamMetricData {
    // Create a minimal valid entry with error indicators
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fallbackMetadata: CalloutMetadata = metadata || {
      type: 'unknown',
      error: true,
      parseFailure: true,
      recoveryAttempted: true,
      isValid: false,
      warnings: [`Parsing error: ${errorMessage}`]
    };
    
    // Try to extract at least a title
    let title = 'Unparseable Entry';
    try {
      const firstLine = calloutContent.split('\n')[0];
      if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
        title = `Unparseable: ${firstLine.trim()}`;
      }
    } catch (e) {
      // Ignore title extraction errors
    }
    
    // Calculate a basic word count
    let wordCount = 0;
    try {
      wordCount = calloutContent.split(/\s+/).filter(Boolean).length;
    } catch (e) {
      // Ignore word count errors
    }
    
    // Create a source object
    const sourceObj = typeof source === 'string' ? { file: source } : source;
    
    return {
      date: new Date().toISOString().split('T')[0], // Today's date
      title,
      content: `Error parsing content: ${errorMessage}\n\nOriginal content:\n${calloutContent}`,
      source: sourceObj,
      wordCount,
      metrics: {},
      calloutMetadata: fallbackMetadata
    };
  }
  
  /**
   * Creates an empty result for when no content is available
   */
  private createEmptyResult(calloutType: string): ParseContentResult {
    return {
      entries: [],
      metadata: {
        totalEntries: 0,
        totalWordCount: 0,
        averageWordCount: "0.0",
        calloutType,
        errorCount: 0,
        warningCount: 0,
        success: true
      }
    };
  }
  
  /**
   * Safely resolves the callout type
   */
  private resolveCalloutType = withErrorHandling(
    (
      calloutTypeOrSource?: string,
      options?: SafeContentParsingOptions
    ): string => {
      // First, check if it looks like a callout type
      if (isNonEmptyString(calloutTypeOrSource) && !calloutTypeOrSource.includes('/') && !calloutTypeOrSource.includes('\\')) {
        return calloutTypeOrSource;
      }
      
      // Otherwise, use the default from options
      return options?.calloutType || this.defaultOptions.calloutType || 'dream';
    },
    {
      fallbackValue: 'dream',
      errorMessage: "Failed to resolve callout type",
      onError: (error) => safeLogger.error('ContentParser', 'Error resolving callout type', error)
    }
  );
  
  /**
   * Safely resolves the source path
   */
  private resolveSourcePath = withErrorHandling(
    (
      calloutTypeOrSource?: string,
      source?: string
    ): string => {
      // If source is provided directly, use it
      if (isNonEmptyString(source)) {
        return source;
      }
      
      // If calloutTypeOrSource looks like a path, use it as source
      if (isNonEmptyString(calloutTypeOrSource) && (calloutTypeOrSource.includes('/') || calloutTypeOrSource.includes('\\'))) {
        return calloutTypeOrSource;
      }
      
      // Default to 'unknown'
      return 'unknown';
    },
    {
      fallbackValue: 'unknown',
      errorMessage: "Failed to resolve source path",
      onError: (error) => safeLogger.error('ContentParser', 'Error resolving source path', error)
    }
  );
  
  /**
   * Processes a single callout
   */
  private processCallout = withErrorHandling(
    (
      calloutContent: string,
      sourcePath: string,
      options?: SafeContentParsingOptions
    ): DreamMetricData => {
      if (!isNonEmptyString(calloutContent)) {
        throw new Error('Empty callout content');
      }
      
      // Extract callout metadata
      const metadata = this.calloutParser.getCalloutMetadata(calloutContent);
      
      // Extract date from the content
      const dateString = this.extractDate(calloutContent);
      const date = dateString || new Date().toISOString().split('T')[0]; // Today as fallback
      
      // Extract title
      const title = this.extractTitle(calloutContent) || 'Untitled Entry';
      
      // Clean the content
      const content = this.cleanDreamContent(calloutContent, options?.calloutType || 'dream');
      
      // Calculate word count
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      
      // Extract metrics
      const metrics = this.extractMetricsFromContent(calloutContent);
      
      // Create source object
      const source = typeof sourcePath === 'string' ? { file: sourcePath } : sourcePath;
      
      // Construct the dream entry
      return {
        date,
        title,
        content,
        source,
        wordCount,
        metrics,
        calloutMetadata: metadata
      };
    },
    {
      fallbackValue: {
        date: new Date().toISOString().split('T')[0],
        title: 'Error Entry',
        content: 'Failed to process callout content',
        source: 'unknown',
        wordCount: 0,
        metrics: {},
        calloutMetadata: { 
          type: 'unknown', 
          error: true,
          isValid: false
        }
      },
      errorMessage: "Failed to process callout",
      onError: (error) => safeLogger.error('ContentParser', 'Error processing callout', error)
    }
  );
  
  /**
   * Safely extracts a date from content
   */
  private extractDate = withErrorHandling(
    (content: string): string | null => {
      if (!isNonEmptyString(content)) {
        return null;
      }
      
      // Try multiple date formats
      
      // Try to find a date in YYYY-MM-DD format
      const isoDateMatch = content.match(/\b(20\d{2}[-/][01]\d[-/][0-3]\d)\b/);
      if (isoDateMatch && isoDateMatch[1]) {
        return isoDateMatch[1].replace(/\//g, '-');
      }
      
      // Try MM/DD/YYYY format
      const usDateMatch = content.match(/\b([01]?\d\/[0-3]?\d\/20\d{2})\b/);
      if (usDateMatch && usDateMatch[1]) {
        try {
          const parts = usDateMatch[1].split('/');
          const month = parts[0].padStart(2, '0');
          const day = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${year}-${month}-${day}`;
        } catch (e) {
          // Continue to next format if this fails
        }
      }
      
      // Try to find a date in text format like "January 15, 2023"
      const textDateMatch = content.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i);
      if (textDateMatch) {
        try {
          const months: Record<string, string> = {
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12'
          };
          
          const month = months[textDateMatch[1].toLowerCase()];
          const day = textDateMatch[2].padStart(2, '0');
          const year = textDateMatch[3];
          
          if (month && day && year) {
            return `${year}-${month}-${day}`;
          }
        } catch (e) {
          // Continue to next format if this fails
        }
      }
      
      // If no date is found, return null
      return null;
    },
    {
      fallbackValue: null,
      errorMessage: "Failed to extract date",
      onError: (error) => safeLogger.error('ContentParser', 'Error extracting date', error)
    }
  );
  
  /**
   * Safely extracts a title from content
   */
  private extractTitle = withErrorHandling(
    (content: string): string | null => {
      if (!isNonEmptyString(content)) {
        return null;
      }
      
      // Try to find a title in various formats
      
      // Look for a title in H1 format: # Title
      const h1Match = content.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1]) {
        return h1Match[1].trim();
      }
      
      // Look for a title in H2 format: ## Title
      const h2Match = content.match(/^##\s+(.+)$/m);
      if (h2Match && h2Match[1]) {
        return h2Match[1].trim();
      }
      
      // Look for a "Title: Something" format
      const titleMatch = content.match(/^Title:?\s*(.+)$/mi);
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim();
      }
      
      // Fallback: use the first line if it's not too long
      const firstLine = content.split('\n')[0];
      if (firstLine && firstLine.length > 0 && firstLine.length < 80) {
        return firstLine.trim();
      }
      
      // Return null if no title is found
      return null;
    },
    {
      fallbackValue: null,
      errorMessage: "Failed to extract title",
      onError: (error) => safeLogger.error('ContentParser', 'Error extracting title', error)
    }
  );
  
  /**
   * Safely cleans dream content
   */
  private cleanDreamContent = withErrorHandling(
    (content: string, calloutType: string): string => {
      if (!isNonEmptyString(content)) {
        return '';
      }
      
      let cleanedContent = content;
      
      // Remove the callout header if present
      cleanedContent = cleanedContent.replace(new RegExp(`^\\s*\\[!${calloutType}\\]\\s*`, 'i'), '');
      
      // Remove any title lines
      cleanedContent = cleanedContent.replace(/^#\s+.+$/m, '');
      cleanedContent = cleanedContent.replace(/^##\s+.+$/m, '');
      cleanedContent = cleanedContent.replace(/^Title:?\s*.+$/mi, '');
      
      // Remove metrics sections
      cleanedContent = cleanedContent.replace(/^Metrics:?\s*\n(?:[\s\S]*?)(?=\n\n|\n$|$)/mi, '');
      
      // Remove any YAML-like properties
      cleanedContent = cleanedContent.replace(/^[\w-]+::\s*.+$/gm, '');
      
      // Remove extra blank lines and trim
      cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n');
      
      return cleanedContent.trim();
    },
    {
      fallbackValue: '',
      errorMessage: "Failed to clean dream content",
      onError: (error) => safeLogger.error('ContentParser', 'Error cleaning dream content', error)
    }
  );
  
  /**
   * Safely sanitizes content
   */
  private sanitizeContent = withErrorHandling(
    (content: string): string => {
      if (!isNonEmptyString(content)) {
        return '';
      }
      
      let sanitized = content;
      
      // Replace potentially problematic characters
      sanitized = sanitized.replace(/[\u2018\u2019]/g, "'"); // Smart quotes to regular quotes
      sanitized = sanitized.replace(/[\u201C\u201D]/g, '"'); // Smart double quotes to regular quotes
      sanitized = sanitized.replace(/\u2014/g, '--'); // Em dash to double dash
      sanitized = sanitized.replace(/\u2013/g, '-'); // En dash to dash
      sanitized = sanitized.replace(/\u2026/g, '...'); // Ellipsis to dots
      
      // Remove any control characters
      sanitized = sanitized.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
      return sanitized;
    },
    {
      fallbackValue: '',
      errorMessage: "Failed to sanitize content",
      onError: (error) => safeLogger.error('ContentParser', 'Error sanitizing content', error)
    }
  );
  
  /**
   * Safely extracts metrics from content
   */
  private extractMetricsFromContent = withErrorHandling(
    (content: string): Record<string, number | string> => {
      const metrics: Record<string, number | string> = {};
      
      if (!isNonEmptyString(content)) {
        return metrics;
      }
      
      try {
        // Look for a metrics section
        const metricsMatch = content.match(/Metrics:?\s*\n([\s\S]*?)(?=\n\n|\n$|$)/i);
        
        if (metricsMatch && metricsMatch[1]) {
          const metricsText = metricsMatch[1];
          const metricLines = metricsText.split('\n');
          
          for (const line of metricLines) {
            // Look for pattern like "MetricName: value" or "MetricName:: value"
            const metricMatch = line.match(/^\s*([\w\s]+?)(?:\:\:|\:)\s*(.+)\s*$/);
            
            if (metricMatch) {
              const [, name, valueStr] = metricMatch;
              const metricName = name.trim();
              const valueText = valueStr.trim();
              
              // Try to convert to a number if possible
              const numValue = parseFloat(valueText);
              
              if (!isNaN(numValue) && /^[\d\.\-]+$/.test(valueText)) {
                metrics[metricName] = numValue;
              } else {
                metrics[metricName] = valueText;
              }
            }
          }
        }
        
        // Also look for properties in the callout format
        const propertyLines = content.split('\n');
        
        for (const line of propertyLines) {
          // Look for pattern like "MetricName: value" or "MetricName:: value"
          // But only if it's at the start of a line (not part of prose)
          const propertyMatch = line.match(/^\s*([\w\s]+?)(?:\:\:|\:)\s*(.+)\s*$/);
          
          if (propertyMatch) {
            const [, name, valueStr] = propertyMatch;
            const propName = name.trim();
            const valueText = valueStr.trim();
            
            // Skip if already found in metrics section
            if (metrics[propName] !== undefined) {
              continue;
            }
            
            // Try to convert to a number if possible
            const numValue = parseFloat(valueText);
            
            if (!isNaN(numValue) && /^[\d\.\-]+$/.test(valueText)) {
              metrics[propName] = numValue;
            } else {
              metrics[propName] = valueText;
            }
          }
        }
      } catch (error) {
        safeLogger.error('ContentParser', 'Error extracting metrics from content', error);
      }
      
      return metrics;
    },
    {
      fallbackValue: {},
      errorMessage: "Failed to extract metrics from content",
      onError: (error) => safeLogger.error('ContentParser', 'Error extracting metrics', error)
    }
  );
  
  /**
   * Validates a dream entry
   */
  private validateDreamEntry = withErrorHandling(
    (entry: DreamMetricData): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      // Check required fields
      if (!entry.date) {
        errors.push('Missing date');
      }
      
      if (!entry.title) {
        errors.push('Missing title');
      }
      
      if (!entry.content || entry.content.length < 5) {
        errors.push('Content too short or missing');
      }
      
      // Check date format
      if (entry.date && !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
        errors.push('Invalid date format (should be YYYY-MM-DD)');
      }
      
      // Check title length
      if (entry.title && (entry.title.length < 2 || entry.title.length > 200)) {
        errors.push('Title length should be between 2 and 200 characters');
      }
      
      // Check word count
      if (typeof entry.wordCount === 'number') {
        if (entry.wordCount <= 0) {
          errors.push('Word count should be positive');
        }
        
        // Check for word count consistency
        const estimatedWordCount = entry.content.split(/\s+/).filter(Boolean).length;
        const tolerance = Math.max(10, estimatedWordCount * 0.2); // 20% tolerance or at least 10 words
        
        if (Math.abs(entry.wordCount - estimatedWordCount) > tolerance) {
          errors.push(`Word count (${entry.wordCount}) doesn't match content (${estimatedWordCount} words)`);
        }
      } else {
        errors.push('Missing word count');
      }
      
      // Check source
      if (!entry.source) {
        errors.push('Missing source');
      }
      
      return { 
        valid: errors.length === 0,
        errors
      };
    },
    {
      fallbackValue: { valid: false, errors: ['Validation failed due to internal error'] },
      errorMessage: "Failed to validate dream entry",
      onError: (error) => safeLogger.error('ContentParser', 'Error validating dream entry', error)
    }
  );
  
  /**
   * Factory method to create a new SafeContentParser
   */
  static create(options?: SafeContentParsingOptions): SafeContentParser {
    return new SafeContentParser(options);
  }
} 