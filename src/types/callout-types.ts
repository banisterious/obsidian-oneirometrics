/**
 * Types related to callouts and callout metadata
 */

/**
 * Interface representing callout metadata
 */
export interface CalloutMetadata {
  /** The type of callout (e.g., "dream", "note") */
  type: string;
  
  /** Optional ID for the callout */
  id?: string;
  
  /** Optional title for the callout */
  title?: string;
  
  /** Optional color for the callout */
  color?: string;
  
  /** Flag indicating if there was an error processing the callout */
  error?: boolean;
  
  /** Optional warnings that occurred while processing the callout */
  warnings?: string[];
  
  /** Flag indicating if there was a parse failure */
  parseFailure?: boolean;
  
  /** Flag indicating if recovery was attempted */
  recoveryAttempted?: boolean;
  
  /** Whether the callout was successfully parsed */
  isValid?: boolean;
  
  /** Additional properties extracted from the callout */
  [key: string]: any;
}

/**
 * Type for an array of CalloutMetadata
 */
export type CalloutMetadataArray = CalloutMetadata[]; 