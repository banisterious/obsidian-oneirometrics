import { DreamMetricData, CalloutMetadata, CalloutMetadataArray } from '../types';

/**
 * Creates a properly typed callout metadata object
 * @param type The callout type
 * @param id Optional identifier
 * @returns A CalloutMetadata object
 */
export function createCalloutMetadata(type: string, id?: string): CalloutMetadata {
  return { type, id };
}

/**
 * Safely extracts callout metadata from a string
 * @param calloutLine The line containing the callout
 * @returns A CalloutMetadata object with type and optional ID
 */
export function extractCalloutMetadata(calloutLine: string): CalloutMetadata {
  // Default values
  const metadata: CalloutMetadata = {
    type: 'dream'
  };
  
  // Extract callout type
  const typeMatch = calloutLine.match(/\[!(\w+)\]/i);
  if (typeMatch && typeMatch[1]) {
    metadata.type = typeMatch[1].toLowerCase();
  }
  
  // Extract block ID if present
  const blockIdMatch = calloutLine.match(/\^(\w+)/);
  if (blockIdMatch && blockIdMatch[1]) {
    metadata.id = blockIdMatch[1];
  }
  
  return metadata;
}

/**
 * Updates an entry's callout metadata
 * @param entry The dream entry to update
 * @param metadata The callout metadata
 * @returns The updated entry
 */
export function updateEntryCalloutMetadata(
  entry: DreamMetricData,
  metadata: CalloutMetadata
): DreamMetricData {
  // Create a shallow copy of the entry to avoid direct mutation
  const updatedEntry = { ...entry };
  
  // Assign the metadata directly for backward compatibility with code that expects a single object
  updatedEntry.calloutMetadata = metadata;
  
  return updatedEntry;
}

/**
 * Safely applies the callout metadata to a DreamMetricData entry
 * @param entry The dream metric data entry to update
 * @param metadata The callout metadata to apply
 * @returns The updated entry with callout metadata
 */
export function applyCalloutMetadata(entry: DreamMetricData, metadata: CalloutMetadata): DreamMetricData {
  const updatedEntry = { ...entry };
  updatedEntry.calloutMetadata = metadata;
  return updatedEntry;
} 