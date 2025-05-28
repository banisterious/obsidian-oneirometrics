/**
 * SafeCalloutParser - Enhanced CalloutParser with defensive coding patterns
 * 
 * Provides robust error handling and fallback mechanisms for parsing 
 * Obsidian callouts to prevent crashes from malformed content.
 */

import { CalloutMetadata } from '../../types/callout-types';
import { withErrorHandling } from '../../utils/defensive-utils';
import safeLogger from '../../logging/safe-logger';

/**
 * Options for callout parsing
 */
export interface CalloutParsingOptions {
  /** Whether to use strict mode (throw errors) or resilient mode (recover) */
  strict?: boolean;
  
  /** Enable detailed logging for debugging */
  debug?: boolean;
  
  /** Default type to use when parsing fails */
  defaultType?: string;
}

/**
 * Enhanced parser for Obsidian callouts with defensive coding patterns
 */
export class SafeCalloutParser {
  /**
   * Default parsing options
   */
  private defaultOptions: CalloutParsingOptions = {
    strict: false,
    debug: false,
    defaultType: 'unknown'
  };
  
  /**
   * Current options for this parser instance
   */
  private options: CalloutParsingOptions;
  
  /**
   * Create a new SafeCalloutParser
   */
  constructor(options?: CalloutParsingOptions) {
    this.options = {
      ...this.defaultOptions,
      ...options
    };
  }
  
  /**
   * Safely extracts callout metadata with robust error handling
   */
  getCalloutMetadata = withErrorHandling(
    (callout: string): CalloutMetadata => {
      // Defensive check for input
      if (!callout || typeof callout !== 'string') {
        safeLogger.warn('CalloutParser', 'Invalid callout input', { callout });
        return { 
          type: this.options.defaultType || 'unknown',
          isValid: false,
          warnings: ['Invalid callout input']
        };
      }
      
      try {
        // Extract callout type with regex safety
        const calloutTypeMatch = callout.match(/\[!(\w+)\]/);
        const type = calloutTypeMatch ? calloutTypeMatch[1] : this.options.defaultType || 'unknown';
        
        // Generate a unique ID with error handling
        const id = `callout-${this.generateCalloutId(callout)}`;
        
        // Check if the parsed type seems valid
        const isValid = !!calloutTypeMatch;
        
        // Collect any warnings
        const warnings: string[] = [];
        if (!isValid) {
          warnings.push('Could not extract callout type');
        }
        
        return {
          type,
          id,
          isValid,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        safeLogger.error('CalloutParser', 'Error getting callout metadata', error);
        
        // Return fallback metadata in non-strict mode
        if (this.options.strict) {
          throw error;
        }
        
        return {
          type: this.options.defaultType || 'unknown',
          isValid: false,
          warnings: [`Error extracting metadata: ${errorMessage}`]
        };
      }
    },
    {
      fallbackValue: { 
        type: 'unknown', 
        isValid: false,
        warnings: ['Unexpected error extracting callout metadata']
      },
      errorMessage: "Failed to extract callout metadata",
      onError: (error) => safeLogger.error('CalloutParser', 'Error in getCalloutMetadata', error)
    }
  );
  
  /**
   * Safely generates a simple numeric ID based on callout content
   */
  private generateCalloutId = withErrorHandling(
    (callout: string): string => {
      if (!callout || typeof callout !== 'string') {
        return 'invalid-input';
      }
      
      let hash = 0;
      const maxLength = Math.min(callout.length, 1000); // Limit processing for very long callouts
      
      for (let i = 0; i < maxLength; i++) {
        const char = callout.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Convert to positive number and take last 8 digits
      const hashStr = Math.abs(hash).toString();
      return hashStr.slice(-Math.min(8, hashStr.length));
    },
    {
      fallbackValue: 'fallback-id',
      errorMessage: "Failed to generate callout ID",
      onError: (error) => safeLogger.error('CalloutParser', 'Error generating callout ID', error)
    }
  );
  
  /**
   * Safely determines if a string is a valid callout
   */
  isCallout = withErrorHandling(
    (text: string): boolean => {
      if (!text || typeof text !== 'string') {
        return false;
      }
      
      try {
        return /^\s*\[!(\w+)\]/.test(text);
      } catch (error) {
        safeLogger.error('CalloutParser', 'Error in isCallout regex', error);
        return false;
      }
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to check if text is callout",
      onError: (error) => safeLogger.error('CalloutParser', 'Error in isCallout', error)
    }
  );
  
  /**
   * Safely extracts the callout type with fallback
   */
  extractCalloutType = withErrorHandling(
    (callout: string): string => {
      if (!callout || typeof callout !== 'string') {
        return this.options.defaultType || 'unknown';
      }
      
      try {
        const match = callout.match(/\[!(\w+)\]/);
        return match ? match[1] : this.options.defaultType || 'unknown';
      } catch (error) {
        safeLogger.error('CalloutParser', 'Error extracting callout type', error);
        return this.options.defaultType || 'unknown';
      }
    },
    {
      fallbackValue: 'unknown',
      errorMessage: "Failed to extract callout type",
      onError: (error) => safeLogger.error('CalloutParser', 'Error in extractCalloutType', error)
    }
  );
  
  /**
   * Safely parses the callout structure into parts
   */
  parseCalloutStructure = withErrorHandling(
    (callout: string): { type: string; content: string; id?: string } => {
      if (!callout || typeof callout !== 'string') {
        return { 
          type: this.options.defaultType || 'unknown', 
          content: '' 
        };
      }
      
      try {
        // Extract callout type
        const typeMatch = callout.match(/\[!(\w+)\]/);
        const type = typeMatch ? typeMatch[1] : this.options.defaultType || 'unknown';
        
        // Extract content by removing the callout header
        let content = callout.replace(/^\s*\[!(\w+)\]\s*/, '').trim();
        
        // Generate ID
        const id = `callout-${this.generateCalloutId(callout)}`;
        
        return { type, content, id };
      } catch (error) {
        safeLogger.error('CalloutParser', 'Error parsing callout structure', error);
        return { 
          type: this.options.defaultType || 'unknown', 
          content: callout.trim()
        };
      }
    },
    {
      fallbackValue: { 
        type: 'unknown', 
        content: '' 
      },
      errorMessage: "Failed to parse callout structure",
      onError: (error) => safeLogger.error('CalloutParser', 'Error in parseCalloutStructure', error)
    }
  );
  
  /**
   * Extract properties from YAML-like metadata sections in callouts
   */
  extractCalloutProperties = withErrorHandling(
    (callout: string): Record<string, string> => {
      const properties: Record<string, string> = {};
      
      if (!callout || typeof callout !== 'string') {
        return properties;
      }
      
      try {
        // Look for property patterns like "key:: value" or "key: value"
        const lines = callout.split('\n');
        
        for (const line of lines) {
          // Try both property formats
          const propertyMatch = line.match(/^\s*([\w-]+)(?:\:\:|\:)\s*(.+)\s*$/);
          
          if (propertyMatch) {
            const [, key, value] = propertyMatch;
            properties[key.trim()] = value.trim();
          }
        }
      } catch (error) {
        safeLogger.error('CalloutParser', 'Error extracting callout properties', error);
      }
      
      return properties;
    },
    {
      fallbackValue: {},
      errorMessage: "Failed to extract callout properties",
      onError: (error) => safeLogger.error('CalloutParser', 'Error in extractCalloutProperties', error)
    }
  );
  
  /**
   * Factory method to create a new SafeCalloutParser instance
   */
  static create(options?: CalloutParsingOptions): SafeCalloutParser {
    return new SafeCalloutParser(options);
  }
} 