import { DreamMetric } from '../../../types';

/**
 * Interface for metrics state.
 * Contains metrics configurations and related state.
 */
export interface IMetricsState {
  /**
   * Map of metric name to metric configuration.
   */
  metrics: Record<string, DreamMetric>;
  
  /**
   * Selected notes for metrics processing.
   */
  selectedNotes: string[];
  
  /**
   * Selection mode (notes, folder, etc.).
   */
  selectionMode: 'notes' | 'folder' | 'tag' | 'all';
  
  /**
   * Selected folder for metrics processing.
   */
  selectedFolder: string;
  
  /**
   * Selected tag for metrics processing.
   */
  selectedTag?: string;
  
  /**
   * Expanded states for UI components.
   */
  expandedStates: Record<string, boolean>;
  
  /**
   * User-defined project note path.
   */
  projectNote: string;
  
  /**
   * Name of callout to use for metrics.
   */
  calloutName: string;
  
  /**
   * Persistent exclusions for metrics processing.
   */
  _persistentExclusions: Record<string, boolean>;
} 