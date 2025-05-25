/**
 * MIGRATION NOTICE
 * 
 * This file is part of the phased migration plan and will eventually be replaced.
 * Do not add new dependencies on this file. Instead, use the permanent replacements
 * as documented in the TypeScript architecture documentation.
 * 
 * See post-refactoring-cleanup-checklist.md for the detailed migration plan.
 */
/**
 * Adapter Functions for Type Compatibility
 * 
 * This file contains adapter functions to help bridge incompatible function
 * signatures throughout the codebase during the TypeScript migration.
 * 
 * These adapters help convert between different parameter formats without
 * requiring changes to all call sites at once.
 */

import { DreamMetricData, DreamMetric } from '../types/core';
import { createSource, isMetricEnabled } from './type-guards';

/**
 * Adapts function calls with different parameter counts for ContentParser methods
 */
export class ContentParserAdapter {
  /**
   * Adapts calls to extractDreamEntries with different parameter counts
   * @param content The content to extract from
   * @param calloutTypeOrSource The callout type or source file
   * @param source Optional source file if first is callout type
   * @returns Adapted function call result
   */
  static adaptExtractDreamEntries(
    originalFunction: (content: string, calloutType?: string, source?: string) => DreamMetricData[],
    content: string,
    calloutTypeOrSource?: string,
    source?: string
  ): DreamMetricData[] {
    // Check parameter types to determine which signature is being used
    if (!calloutTypeOrSource) {
      // Only content provided
      return originalFunction(content);
    }
    
    if (!source) {
      // Two parameters - could be (content, type) or (content, source)
      // Assume it's (content, type) as that's the most common usage
      return originalFunction(content, calloutTypeOrSource);
    }
    
    // Three parameters - standard call
    return originalFunction(content, calloutTypeOrSource, source);
  }
}

/**
 * Adapts UI component parameter differences
 */
export class UIComponentAdapter {
  /**
   * Adapts metric parameters for UI functions with different requirements
   * @param metric The metric to adapt
   * @param fallbackName Fallback name if not in metric
   * @returns An object with standardized properties
   */
  static adaptMetricForUI(metric: DreamMetric | any, fallbackName?: string): {
    name: string;
    icon: string;
    minValue: number;
    maxValue: number;
    enabled: boolean;
  } {
    return {
      name: metric.name || fallbackName || 'Unknown Metric',
      icon: metric.icon || 'help-circle',
      minValue: metric.minValue || metric.min || (metric.range?.min) || 1,
      maxValue: metric.maxValue || metric.max || (metric.range?.max) || 5,
      enabled: isMetricEnabled(metric)
    };
  }
  
  /**
   * Adapts dream entry data for UI display
   * @param entry The entry to adapt
   * @returns Standardized entry object for UI
   */
  static adaptEntryForUI(entry: DreamMetricData | any): {
    date: string;
    title: string;
    content: string;
    source: string;
    metrics: Record<string, number | string>;
  } {
    const source = typeof entry.source === 'string' 
      ? entry.source 
      : (entry.source?.file || '');
    
    return {
      date: entry.date || new Date().toISOString().split('T')[0],
      title: entry.title || 'Untitled Dream',
      content: entry.content || '',
      source: source,
      metrics: entry.metrics || {}
    };
  }
}

/**
 * Adapts settings parameters for different function signatures
 */
export class SettingsAdapter {
  /**
   * Adapts selection mode parameters between different formats
   * @param mode The selection mode to adapt
   * @returns The adapted selection mode in the requested format
   */
  static adaptSelectionMode(
    mode: 'notes' | 'folder' | 'manual' | 'automatic'
  ): 'notes' | 'folder' {
    if (mode === 'manual') return 'notes';
    if (mode === 'automatic') return 'folder';
    if (mode === 'notes' || mode === 'folder') return mode;
    
    // Default fallback
    return 'notes';
  }
  
  /**
   * Adapts selection mode to legacy format
   * @param mode The selection mode to adapt
   * @returns The adapted selection mode in legacy format
   */
  static adaptSelectionModeToLegacy(
    mode: 'notes' | 'folder' | 'manual' | 'automatic'
  ): 'manual' | 'automatic' {
    if (mode === 'notes') return 'manual';
    if (mode === 'folder') return 'automatic';
    if (mode === 'manual' || mode === 'automatic') return mode;
    
    // Default fallback
    return 'manual';
  }
}

/**
 * Adapts event handling for different function signatures
 */
export class EventAdapter {
  /**
   * Creates an event handler that ensures events are properly typed
   * @param handler The original event handler
   * @returns A new handler that ensures proper event typing
   */
  static adaptEventHandler<T extends Event>(
    handler: (event: T) => void
  ): (event: Event) => void {
    return (event: Event) => {
      handler(event as T);
    };
  }
  
  /**
   * Creates a click handler with proper typing
   * @param handler The original click handler
   * @returns A properly typed click handler
   */
  static adaptClickHandler(
    handler: (event: MouseEvent) => void
  ): (event: MouseEvent) => void {
    return EventAdapter.adaptEventHandler(handler);
  }
} 
