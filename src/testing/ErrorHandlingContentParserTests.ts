import { TestRunner } from './TestRunner';
import { ContentParser } from '../parsing/services/ContentParser';
import { DreamMetricData } from '../../types';

/**
 * Register content parser error handling tests to the test runner
 * @param testRunner The test runner instance
 */
export function registerErrorHandlingContentParserTests(
  testRunner: TestRunner
): void {
  const contentParser = new ContentParser();
  
  // ================================
  // MALFORMED METRICS TESTS
  // ================================
  
  // Test: Missing metrics values
  testRunner.addTest(
    'Error Handling - Should handle missing metrics values',
    async () => {
      const calloutContent = `This is a dream entry.
Sensory Detail: , Emotional Recall: 3, Descriptiveness:`;
      
      const metricsText = contentParser.extractMetricsText(calloutContent);
      
      // Should still extract the text even with missing values
      return metricsText === 'Sensory Detail: , Emotional Recall: 3, Descriptiveness:';
    }
  );
  
  // Test: Incorrect metrics format
  testRunner.addTest(
    'Error Handling - Should handle incorrect metrics format',
    async () => {
      const calloutContent = `This is a dream entry.
Sensory Detail - 4, Emotional Recall -> 3, Descriptiveness = 2`;
      
      const metricsText = contentParser.extractMetricsText(calloutContent);
      
      // The current regex looks for colon-separated values, so this might not extract as expected
      // We're testing that it doesn't crash, not that it succeeds in extracting
      try {
        console.log(`Extracted metrics text: "${metricsText}"`);
        return true; // Test passes if no exception is thrown
      } catch (error) {
        console.error("Error extracting metrics with incorrect format:", error);
        return false;
      }
    }
  );
  
  // Test: Non-numeric values for numeric metrics
  testRunner.addTest(
    'Error Handling - Should handle non-numeric values for numeric metrics',
    async () => {
      const calloutContent = `This is a dream entry.
Sensory Detail: high, Emotional Recall: moderate, Descriptiveness: low`;
      
      const metricsText = contentParser.extractMetricsText(calloutContent);
      
      // Should still extract the text even with non-numeric values
      // Later processing would need to handle this, but extraction should work
      return metricsText === 'Sensory Detail: high, Emotional Recall: moderate, Descriptiveness: low';
    }
  );
  
  // Test: Extra whitespace and unusual formatting
  testRunner.addTest(
    'Error Handling - Should handle extra whitespace and unusual formatting',
    async () => {
      const calloutContent = `This is a dream entry.
Sensory Detail:    4   ,   Emotional Recall:3,Descriptiveness:2  `;
      
      const metricsText = contentParser.extractMetricsText(calloutContent);
      
      // Even with irregular spacing, it should extract the metrics
      return metricsText.includes('Sensory Detail:') && 
             metricsText.includes('Emotional Recall:3') && 
             metricsText.includes('Descriptiveness:2');
    }
  );
  
  // ================================
  // RECOVERY FROM PARSE ERRORS
  // ================================
  
  // Test: Should recover from corrupted entries
  testRunner.addTest(
    'Error Handling - Should continue processing when one entry is corrupted',
    async () => {
      const content = `
# Dream Journal

[!dream] Valid Dream 1
This is a valid dream.
Sensory Detail: 4, Emotional Recall: 3

[!dream] Corrupted Dream
This dream has a malformed structure.
Sensory Detail: [invalid
Emotional Recall: \`unclosed code block

[!dream] Valid Dream 2
This is another valid dream.
Sensory Detail: 5, Emotional Recall: 2
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      // The parser should still extract the valid entries
      console.log(`Extracted ${entries.length} entries with one corrupted entry`);
      
      // We should have at least 2 entries (the valid ones)
      return entries.length >= 2;
    }
  );
  
  // Test: Should handle entries with invalid date formats
  testRunner.addTest(
    'Error Handling - Should handle entries with invalid date formats',
    async () => {
      const content = `
# Dream Journal

[!dream] Dream with invalid date
InvalidDate: Not-A-Real-Date
This is a dream with an invalid date.
Sensory Detail: 4, Emotional Recall: 3
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      // Should extract the entry and use a fallback date
      console.log(`Extracted entry with invalid date: ${entries[0]?.date}`);
      
      // Parser should extract the entry and use today's date or some default
      return entries.length === 1 && (entries[0].date.match(/^\d{4}-\d{2}-\d{2}$/) !== null);
    }
  );
  
  // Test: Should handle extremely long entries
  testRunner.addTest(
    'Error Handling - Should handle extremely long entries',
    async () => {
      // Create a very long dream entry
      let longContent = `
# Dream Journal

[!dream] Very Long Dream
# Long Dream Title
`;
      
      // Add a lot of content to make it very long
      for (let i = 0; i < 1000; i++) {
        longContent += `This is line ${i} of a very long dream entry.\n`;
      }
      
      longContent += `
Sensory Detail: 5, Emotional Recall: 4

[!dream] Normal Dream
# Normal Dream Title
This is a normal dream entry.
Sensory Detail: 3, Emotional Recall: 2
`;
      
      const entries = contentParser.extractDreamEntries(longContent, 'dream');
      
      console.log(`Extracted ${entries.length} entries including one very long entry`);
      
      // Should extract both the long entry and the normal one
      return entries.length === 2 && 
             entries[0].content.includes("This is line 999") &&
             entries[1].title === "Normal Dream Title";
    }
  );
  
  // Test: Should handle unclosed callout syntax
  testRunner.addTest(
    'Error Handling - Should handle unclosed callout syntax',
    async () => {
      const content = `
# Dream Journal

[!dream] Valid Dream
This is a valid dream.
Sensory Detail: 4, Emotional Recall: 3

[!dream Unclosed callout syntax
This dream has unclosed callout syntax.
Sensory Detail: 3, Emotional Recall: 2

[!dream] Another Valid Dream
This is another valid dream.
Sensory Detail: 5, Emotional Recall: 4
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      console.log(`Extracted ${entries.length} entries with unclosed callout syntax`);
      
      // Should extract at least the valid entries
      return entries.length >= 2;
    }
  );
} 