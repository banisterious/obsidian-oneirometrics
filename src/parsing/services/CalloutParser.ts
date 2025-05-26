import { CalloutMetadata } from '../../types/declarations/callout-types';

/**
 * Parser for Obsidian callouts with specialized functions for extracting metadata
 */
export class CalloutParser {
  /**
   * Extracts callout metadata from a callout string
   * 
   * @param callout The callout text
   * @returns The extracted callout metadata
   */
  getCalloutMetadata(callout: string): CalloutMetadata {
    try {
      const calloutTypeMatch = callout.match(/\[!(\w+)\]/);
      const type = calloutTypeMatch ? calloutTypeMatch[1] : 'unknown';
      
      // Generate a unique ID for this callout based on content hash
      const id = `callout-${this.generateCalloutId(callout)}`;
      
      return {
        type,
        id
      };
    } catch (error) {
      console.error("Error getting callout metadata:", error);
      return { type: 'unknown' };
    }
  }
  
  /**
   * Generates a simple numeric ID based on callout content
   * 
   * @param callout The callout content
   * @returns A simple hash ID
   */
  private generateCalloutId(callout: string): string {
    let hash = 0;
    
    for (let i = 0; i < callout.length; i++) {
      const char = callout.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to positive number and take last 8 digits
    return Math.abs(hash).toString().slice(-8);
  }
  
  /**
   * Determines if a string is a valid callout
   * 
   * @param text The text to check
   * @returns True if text appears to be a callout
   */
  isCallout(text: string): boolean {
    return /^\s*\[!(\w+)\]/.test(text);
  }
  
  /**
   * Extracts the callout type from a callout string
   * 
   * @param callout The callout text
   * @returns The extracted callout type or 'unknown'
   */
  extractCalloutType(callout: string): string {
    const match = callout.match(/\[!(\w+)\]/);
    return match ? match[1] : 'unknown';
  }
  
  /**
   * Factory method to create a new CalloutParser instance
   * 
   * @returns A new CalloutParser instance
   */
  static create(): CalloutParser {
    return new CalloutParser();
  }
} 