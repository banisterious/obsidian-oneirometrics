/**
 * Interface for representing metadata for an Obsidian callout
 */
export interface CalloutMetadata {
  /**
   * The type of callout (e.g., 'note', 'info', 'warning', 'dream')
   */
  type: string;
  
  /**
   * Optional unique identifier for the callout
   */
  id?: string;
  
  /**
   * Optional additional metadata fields
   */
  [key: string]: any;
} 