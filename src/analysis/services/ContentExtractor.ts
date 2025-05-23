import { IContentExtractor } from '../interfaces';

/**
 * Implementation of the content extractor interface.
 * Provides methods for extracting dream content from journal entries.
 */
export class ContentExtractor implements IContentExtractor {
  /**
   * Extract dream content from journal text.
   * @param journalText Full journal entry text
   * @param calloutName Optional callout name to look for
   * @returns Extracted dream content or null if none found
   */
  extractDreamContent(journalText: string, calloutName?: string): string | null {
    const dreamCallout = calloutName || 'dream';
    
    // Match the dream callout section
    const calloutRegex = new RegExp(`\\[!${dreamCallout}\\][^\\n]*\\n([\\s\\S]*?)(?:(?:\\n\\n\\[!)|(?:$))`, 'i');
    const match = journalText.match(calloutRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Try alternative formats if callout not found
    // Look for dream heading (# Dream)
    const headingRegex = new RegExp(`## (?:${dreamCallout}|Dream)[^\\n]*\\n([\\s\\S]*?)(?:(?:\\n## )|(?:$))`, 'i');
    const headingMatch = journalText.match(headingRegex);
    
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }
    
    return null;
  }
  
  /**
   * Extract metrics text from journal content.
   * @param journalText Full journal entry text
   * @returns Metrics text or null if none found
   */
  extractMetricsText(journalText: string): string | null {
    // Look for metrics callout
    const metricsRegex = /\[!metrics\][^\n]*\n([\s\S]*?)(?:(?:\n\n\[!)|(?:$))/i;
    const metricsMatch = journalText.match(metricsRegex);
    
    if (metricsMatch && metricsMatch[1]) {
      return metricsMatch[1].trim();
    }
    
    // Look for metrics heading
    const headingRegex = /## Metrics[^\n]*\n([\s\S]*?)(?:(?:\n## )|(?:$))/i;
    const headingMatch = journalText.match(headingRegex);
    
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }
    
    // Look for common metric pattern at end of dream content
    const patternMatch = journalText.match(/(?:^|\n)((?:[A-Za-z\s]+: \d+,\s*)+[A-Za-z\s]+: \d+)(?:$|\n)/);
    
    if (patternMatch && patternMatch[1]) {
      return patternMatch[1].trim();
    }
    
    return null;
  }
  
  /**
   * Extract dream date from journal entry.
   * @param journalText Full journal entry text
   * @param filePath Path to the journal file
   * @returns Date string in YYYY-MM-DD format or null if not found
   */
  extractDreamDate(journalText: string, filePath: string): string | null {
    // First try to extract from title or frontmatter
    const titleDateMatch = journalText.match(/^(?:title: |\# ).*?(\d{4}-\d{2}-\d{2})/i);
    if (titleDateMatch && titleDateMatch[1]) {
      return titleDateMatch[1];
    }
    
    // Try to extract from YAML frontmatter date field
    const frontmatterMatch = journalText.match(/^---[\s\S]*?date: (\d{4}-\d{2}-\d{2})[\s\S]*?---/);
    if (frontmatterMatch && frontmatterMatch[1]) {
      return frontmatterMatch[1];
    }
    
    // Try to extract date from filename
    const filenameMatch = filePath.match(/(\d{4}-\d{2}-\d{2})/);
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1];
    }
    
    // Try date-like patterns in common formats
    const datePatterns = [
      // ISO format
      /(?:^|\s)(\d{4}-\d{2}-\d{2})(?:\s|$)/,
      // MM/DD/YYYY
      /(?:^|\s)(\d{1,2}\/\d{1,2}\/\d{4})(?:\s|$)/,
      // DD/MM/YYYY
      /(?:^|\s)(\d{1,2}\/\d{1,2}\/\d{4})(?:\s|$)/,
      // Month DD, YYYY
      /(?:^|\s)([A-Za-z]+\s\d{1,2},\s\d{4})(?:\s|$)/
    ];
    
    for (const pattern of datePatterns) {
      const match = journalText.match(pattern);
      if (match && match[1]) {
        // Convert to YYYY-MM-DD if needed
        try {
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        } catch (e) {
          console.error('[OneiroMetrics] Error parsing date:', e);
        }
      }
    }
    
    return null;
  }
  
  /**
   * Calculate word count from content.
   * @param content Text content to analyze
   * @returns Number of words
   */
  calculateWordCount(content: string): number {
    if (!content) return 0;
    
    // Remove common markdown artifacts that might affect word count
    const cleanedContent = content
      .replace(/!\[\[.*?\]\]/g, '') // Remove image links
      .replace(/\[\[.*?\]\]/g, '') // Remove regular links
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
      .replace(/`.*?`/g, '') // Remove inline code blocks
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/#+\s+/g, '') // Remove heading markers
      .replace(/>\s+/g, '') // Remove blockquote markers
      .trim();
      
    // Split by whitespace and count non-empty words
    return cleanedContent
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }
} 