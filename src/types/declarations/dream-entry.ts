/**
 * Dream Entry Type Declarations
 * 
 * This file provides type definitions for dream journal entries
 * used throughout the application.
 */

import { DreamMetric } from '../../types/core';

/**
 * Interface representing a dream journal entry
 */
export interface DreamEntry {
  /** The date of the dream entry (can be a string or Date object) */
  date: string | Date;
  
  /** The title of the dream entry */
  title?: string;
  
  /** The full content of the dream entry */
  content: string;
  
  /** The source of this dream entry (file path or identifier) */
  source?: string | {
    /** The file path containing this dream entry */
    file: string;
    
    /** Optional identifier for the dream entry */
    id?: string;
  };
  
  /** The word count of the dream content */
  wordCount?: number;
  
  /** Metrics associated with this dream entry */
  metrics?: Array<{
    /** The name of the metric */
    name: string;
    
    /** The value of the metric */
    value?: number | string;
    
    /** The icon for the metric */
    icon?: string;
  }>;
  
  /** Raw metrics data extracted from the dream entry */
  rawMetrics?: Record<string, number | string>;
  
  /** Optional metadata from the callout containing the dream entry */
  calloutMetadata?: any;
  
  /** Whether this entry has been expanded in the UI */
  expanded?: boolean;
  
  /** ID for tracking this entry in lists */
  id?: string;
} 