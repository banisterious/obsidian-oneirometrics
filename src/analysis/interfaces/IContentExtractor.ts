/**
 * Interface for extracting dream content from journal entries.
 */
export interface IContentExtractor {
  /**
   * Extract dream content from journal text.
   * Looks for specified callout blocks or other formatted content.
   * @param journalText Full text of a journal entry
   * @param calloutName Name of the callout to extract (e.g., "dream", "nightmare")
   * @returns Extracted dream content or null if none found
   */
  extractDreamContent(journalText: string, calloutName?: string): string | null;
  
  /**
   * Extract metrics text from journal content.
   * Looks for a metrics section, usually in a format like "Metric1: 5, Metric2: 3"
   * @param journalText Full text of a journal entry
   * @returns Metrics text or null if none found
   */
  extractMetricsText(journalText: string): string | null;
  
  /**
   * Extract dream date from journal entry.
   * Attempts to find a date in various formats, including block references.
   * @param journalText Full text of a journal entry
   * @param filePath Path to the journal file (used as fallback for date extraction)
   * @returns Date string in YYYY-MM-DD format or null if not found
   */
  extractDreamDate(journalText: string, filePath: string): string | null;
  
  /**
   * Extract word count from journal content.
   * @param content Dream content to analyze
   * @returns Number of words in the content
   */
  calculateWordCount(content: string): number;
} 