import { TestRunner } from './TestRunner';
import { ContentParser } from '../parsing/services/ContentParser';
import { DreamMetricData } from '../../types';
import { isObjectSource } from '../utils/type-guards';

/**
 * Register content parser parameter variation tests to the test runner
 * @param testRunner The test runner instance
 */
export function registerContentParserParameterTests(
  testRunner: TestRunner
): void {
  const contentParser = new ContentParser();
  
  // Sample content for testing
  const sampleContent = `
# Dream Journal

[!dream] Dream Entry 1
This is a sample dream.
Clarity: 4, Vividness: 3

[!memory] Memory Entry 1
This is a sample memory.
Emotional Impact: 5, Detail: 4
`;

  // ================================
  // PARAMETER VARIATION TESTS
  // ================================
  
  // Test: Single parameter (content only)
  testRunner.addTest(
    'Parameter Variations - Should handle single parameter (content only)',
    async () => {
      // Call with only content parameter
      const entries = contentParser.extractDreamEntries(sampleContent);
      
      // Should extract the dream entry with default callout type ('dream')
      return entries.length === 1 && 
             entries[0].content.includes("This is a sample dream.") &&
             entries[0].metrics["Clarity"] === 4;
    }
  );
  
  // Test: Two parameters (content, calloutType)
  testRunner.addTest(
    'Parameter Variations - Should handle two parameters (content, calloutType)',
    async () => {
      // Call with content and callout type
      const entries = contentParser.extractDreamEntries(sampleContent, 'memory');
      
      // Should extract the memory entry
      return entries.length === 1 && 
             entries[0].content.includes("This is a sample memory.") &&
             entries[0].metrics["Emotional Impact"] === 5;
    }
  );
  
  // Test: Two parameters (content, source)
  testRunner.addTest(
    'Parameter Variations - Should handle two parameters (content, source)',
    async () => {
      // Call with content and a path-like string (should be interpreted as source)
      const sourcePath = 'journal/2025/06/05.md';
      const entries = contentParser.extractDreamEntries(sampleContent, sourcePath);
      
      // Should extract the dream entry (default type) and set the source
      return entries.length === 1 && 
             entries[0].content.includes("This is a sample dream.") &&
             (entries[0].source === sourcePath || 
              (isObjectSource(entries[0].source) && entries[0].source.file === sourcePath));
    }
  );
  
  // Test: Three parameters (content, calloutType, source)
  testRunner.addTest(
    'Parameter Variations - Should handle three parameters (content, calloutType, source)',
    async () => {
      // Call with all three parameters
      const sourcePath = 'journal/2025/06/05.md';
      const entries = contentParser.extractDreamEntries(sampleContent, 'memory', sourcePath);
      
      // Should extract the memory entry and set the source
      return entries.length === 1 && 
             entries[0].content.includes("This is a sample memory.") &&
             entries[0].metrics["Detail"] === 4 &&
             (entries[0].source === sourcePath || 
              (isObjectSource(entries[0].source) && entries[0].source.file === sourcePath));
    }
  );
  
  // Test: Two ambiguous parameters with non-path callout type
  testRunner.addTest(
    'Parameter Variations - Should correctly identify non-path callout type with two parameters',
    async () => {
      // Call with content and a non-path-like callout type
      const entries = contentParser.extractDreamEntries(sampleContent, 'lucid');
      
      // Should extract nothing (no 'lucid' callout in the content)
      return entries.length === 0;
    }
  );
  
  // Test: Static factory method
  testRunner.addTest(
    'Parameter Variations - Static create method should return functional instance',
    async () => {
      // Use the static factory method
      const parser = ContentParser.create();
      
      // The created instance should work properly
      const entries = parser.extractDreamEntries(sampleContent, 'dream');
      
      return entries.length === 1 && 
             entries[0].content.includes("This is a sample dream.") &&
             entries[0].metrics["Clarity"] === 4;
    }
  );
  
  // Test: parseContent with parameter variations
  testRunner.addTest(
    'Parameter Variations - parseContent should handle parameter variations',
    async () => {
      // Test multiple variations of parseContent
      const result1 = contentParser.parseContent(sampleContent);
      const result2 = contentParser.parseContent(sampleContent, 'memory');
      const result3 = contentParser.parseContent(sampleContent, 'dream', 'journal/test.md');
      
      const sourcePath = 'journal/test.md';
      
      return result1.entries.length === 1 && 
             result1.metadata.totalEntries === 1 &&
             result2.entries.length === 1 && 
             result2.entries[0].metrics["Emotional Impact"] === 5 &&
             result3.entries.length === 1 && 
             (result3.entries[0].source === sourcePath || 
              (isObjectSource(result3.entries[0].source) && result3.entries[0].source.file === sourcePath));
    }
  );
} 