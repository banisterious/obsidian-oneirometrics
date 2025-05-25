import { TestRunner } from './TestRunner';
import { ContentParser } from '../parsing/services/ContentParser';
import { DreamMetricData } from '../../types';

/**
 * Register content parsing tests to the test runner
 * @param testRunner The test runner instance
 */
export function registerContentParsingTests(
  testRunner: TestRunner
): void {
  const contentParser = new ContentParser();
  
  // Test: Extracting dream entries
  testRunner.addTest(
    'ContentParser - Should extract dream entries from markdown content',
    async () => {
      const content = `
# Dream Journal Entry

[!dream] My First Dream
# First Dream Title
This is the content of my first dream.
Sensory Detail: 4, Emotional Recall: 3

[!dream] My Second Dream
# Second Dream Title
This is the content of my second dream.
Sensory Detail: 5, Emotional Recall: 2
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      // Debug information to help identify issues
      console.log(`Extracted ${entries.length} entries`);
      if (entries.length > 0) {
        console.log(`First entry title: "${entries[0].title}"`);
        if (entries.length > 1) {
          console.log(`Second entry title: "${entries[1].title}"`);
        }
      }
      
      // The titles are extracted from the content after cleaning, not from the callout syntax
      // So they should match the heading in the content, not the callout title
      return (
        entries.length === 2 &&
        entries[0].title === 'First Dream Title' &&
        entries[1].title === 'Second Dream Title'
      );
    }
  );
  
  // Test: Extracting metrics text
  testRunner.addTest(
    'ContentParser - Should extract metrics text from callout',
    async () => {
      const calloutContent = `This is a dream entry.
Sensory Detail: 4, Emotional Recall: 3, Descriptiveness: 2`;
      
      const metricsText = contentParser.extractMetricsText(calloutContent);
      
      return metricsText === 'Sensory Detail: 4, Emotional Recall: 3, Descriptiveness: 2';
    }
  );
  
  // Test: Parsing dates
  testRunner.addTest(
    'ContentParser - Should parse various date formats',
    async () => {
      const results = [
        contentParser.parseDate('2025-05-23') === '2025-05-23',
        contentParser.parseDate('05/23/2025') === '2025-05-23',
        contentParser.parseDate('May 23, 2025') === '2025-05-23',
        // Should handle invalid dates
        contentParser.parseDate('invalid').length === 10 // Should return a valid date string
      ];
      
      return results.every(result => result === true);
    }
  );
  
  // Test: Cleaning dream content
  testRunner.addTest(
    'ContentParser - Should clean dream content correctly',
    async () => {
      const content = `[!dream] Dream Title
This is the content of my dream.
Sensory Detail: 4, Emotional Recall: 3

[!note] This is a note callout that should be removed
Note content`;
      
      const cleaned = contentParser.cleanDreamContent(content, 'dream');
      
      return (
        cleaned.includes('This is the content of my dream.') &&
        cleaned.includes('Sensory Detail: 4, Emotional Recall: 3') &&
        !cleaned.includes('[!dream]') &&
        !cleaned.includes('[!note]')
      );
    }
  );
  
  // Test: Extracting title
  testRunner.addTest(
    'ContentParser - Should extract title from content',
    async () => {
      const withHeading = `# Dream Title
This is a dream content.`;
      
      const withSubHeading = `## Dream Subheading
This is a dream content.`;
      
      const withoutHeading = `This is just text without a heading.
More text.`;
      
      const results = [
        contentParser.extractTitle(withHeading) === 'Dream Title',
        contentParser.extractTitle(withSubHeading) === 'Dream Subheading',
        contentParser.extractTitle(withoutHeading) === 'This is just text without a heading.'
      ];
      
      return results.every(result => result === true);
    }
  );
  
  // Test: Processing nested callouts
  testRunner.addTest(
    'ContentParser - Should process nested callouts correctly',
    async () => {
      const content = `
# Dream Journal

[!dream] First Dream
This is the first dream.
Sensory Detail: 4

[!dream] Second Dream
This is the second dream.
Emotional Recall: 3

[!note] Not a dream
This shouldn't be included.
`;
      
      const callouts = contentParser.processNestedCallouts(content, 'dream');
      
      return (
        callouts.length === 2 &&
        callouts[0].content.includes('This is the first dream.') &&
        callouts[1].content.includes('This is the second dream.')
      );
    }
  );
  
  // Test: Handling complex nested content
  testRunner.addTest(
    'ContentParser - Should handle complex nested content',
    async () => {
      const content = `
# Complex Dream Journal

[!dream] Complex Dream
This dream has multiple paragraphs.

It continues here with more content.

Sensory Detail: 5, Emotional Recall: 4
Descriptiveness: 3

[!dream] Dream with lists
- Item 1
- Item 2
- Item 3

Sensory Detail: 3, Emotional Recall: 2
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      return (
        entries.length === 2 &&
        entries[0].content.includes('This dream has multiple paragraphs.') &&
        entries[0].content.includes('It continues here with more content.') &&
        entries[1].content.includes('- Item 1')
      );
    }
  );
} 