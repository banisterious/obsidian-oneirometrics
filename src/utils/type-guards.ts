import { DreamMetricData } from '../types/core';
import { CalloutMetadata } from '../types/callout-types';
import { DreamMetric } from '../types/core';

/**
 * Type guard to check if source is an object with file property
 * @param source The source value to check
 * @returns True if source is an object with file property
 */
export function isObjectSource(source: string | { file: string; id?: string }): source is { file: string; id?: string } {
  return typeof source !== 'string' && 'file' in source;
}

/**
 * Gets the file path from a DreamMetricData entry's source property
 * @param entry The dream metric data entry
 * @returns The file path as a string
 */
export function getSourceFile(entry: DreamMetricData): string {
  if (typeof entry.source === 'string') {
    return entry.source;
  }
  return entry.source?.file || '';
}

/**
 * Gets the source ID from a DreamMetricData entry's source property
 * @param entry The dream metric data entry
 * @returns The source ID or undefined if not available
 */
export function getSourceId(entry: DreamMetricData): string {
  if (typeof entry.source === 'string') {
    return '';
  }
  return entry.source?.id || '';
}

/**
 * Safely creates a source property object or string based on available data
 * @param file The file path
 * @param id Optional ID
 * @returns A source property value
 */
export function createSource(file: string, id?: string): string | { file: string; id?: string } {
  if (id) {
    return { file, id };
  }
  return file;
}

/**
 * Type guard to check if calloutMetadata is an array
 * @param metadata The callout metadata to check
 * @returns True if metadata is an array
 */
export function isCalloutMetadataArray(
  metadata: CalloutMetadata[] | CalloutMetadata | undefined
): metadata is CalloutMetadata[] {
  return Array.isArray(metadata);
}

/**
 * Gets the first callout type from metadata, regardless of format
 * @param entry The dream metric data entry
 * @returns The callout type or undefined if not available
 */
export function getCalloutType(entry: DreamMetricData): string | undefined {
  const metadata = entry.calloutMetadata;
  
  if (!metadata) {
    return undefined;
  }
  
  if (isCalloutMetadataArray(metadata)) {
    return metadata.length > 0 ? metadata[0].type : undefined;
  }
  
  return metadata.type;
}

/**
 * Gets the first callout ID from metadata, regardless of format
 * @param entry The dream metric data entry
 * @returns The callout ID or undefined if not available
 */
export function getCalloutId(entry: DreamMetricData): string | undefined {
  const metadata = entry.calloutMetadata;
  
  if (!metadata) {
    return undefined;
  }
  
  if (isCalloutMetadataArray(metadata)) {
    return metadata.length > 0 ? metadata[0].id : undefined;
  }
  
  return metadata.id;
}

/**
 * Safely checks if a metric is enabled
 */
export function isMetricEnabled(metric: DreamMetric): boolean {
  return 'enabled' in metric ? metric.enabled : true;
}

/**
 * Type guard for callout metadata
 */
export function isCalloutMetadata(obj: any): obj is CalloutMetadata {
  return obj && typeof obj === 'object' && 'type' in obj;
}

/**
 * Type guard to check if a value is a Promise
 * @param value The value to check
 * @returns True if the value is a Promise
 */
export function isPromise<T = any>(value: any): value is Promise<T> {
  return value && typeof value.then === 'function';
} 