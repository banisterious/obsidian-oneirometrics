/**
 * Types related to callouts and callout metadata
 */

/**
 * Interface representing callout metadata
 */
export interface CalloutMetadata {
  /** The type of callout (dream, nightmare, etc.) */
  type: string;
  
  /** Optional identifier for the callout */
  id?: string;
}

/**
 * Type for an array of CalloutMetadata
 */
export type CalloutMetadataArray = CalloutMetadata[]; 