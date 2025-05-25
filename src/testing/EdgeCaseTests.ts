import { TestRunner } from './TestRunner';
import { ContentParser } from '../parsing/services/ContentParser';
import { DreamMetricData } from '../../types';

/**
 * Register edge case tests to the test runner
 * @param testRunner The test runner instance
 */
export function registerEdgeCaseTests(
  testRunner: TestRunner
): void {
  const contentParser = new ContentParser();
  
  // ================================
  // EMPTY JOURNAL FILES
  // ================================
  
  // Test: Empty content
  testRunner.addTest(
    'Edge Case - Should handle completely empty content',
    () => {
      const content = '';
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      // Should return an empty array, not crash
      console.log(`Empty content test: extracted ${entries.length} entries`);
      return entries.length === 0;
    }
  );
  
  // Test: Content with no entries
  testRunner.addTest(
    'Edge Case - Should handle content with no dream entries',
    () => {
      const content = `
# Journal Entry
This is just a regular journal entry with no dream callouts.

Some more text here.
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      // Should return an empty array, not crash
      console.log(`No entries test: extracted ${entries.length} entries`);
      return entries.length === 0;
    }
  );
  
  // ================================
  // EXTREME CONTENT SIZES
  // ================================
  
  // Test: Extremely small entries
  testRunner.addTest(
    'Edge Case - Should handle extremely small entries',
    () => {
      const content = `
[!dream]
.

[!dream]
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      // Should extract the minimal entries without crashing
      console.log(`Minimal entries test: extracted ${entries.length} entries`);
      return entries.length === 2;
    }
  );
  
  // Test: Extremely large single entry
  testRunner.addTest(
    'Edge Case - Should handle extremely large single entry',
    () => {
      // Create massive content with 5000+ lines
      let hugeContent = '[!dream] Massive Dream\n';
      
      // Add 5000 lines of content
      for (let i = 0; i < 5000; i++) {
        hugeContent += `Line ${i} of massive dream content.\n`;
      }
      
      hugeContent += 'Sensory Detail: 5, Emotional Recall: 4\n';
      
      const entries = contentParser.extractDreamEntries(hugeContent, 'dream');
      
      // Should extract the entry without crashing, with all the content
      console.log(`Huge entry test: extracted ${entries.length} entries`);
      if (entries.length > 0) {
        console.log(`Huge entry length: ${entries[0].content.length} characters`);
      }
      
      return entries.length === 1 && 
             entries[0].content.includes('Line 0') && 
             entries[0].content.includes('Line 4999');
    }
  );
  
  // Test: Many small entries
  testRunner.addTest(
    'Edge Case - Should handle many small entries',
    () => {
      let multiEntryContent = '';
      
      // Create 100 minimal entries
      for (let i = 0; i < 100; i++) {
        multiEntryContent += `[!dream] Dream ${i}\nMinimal content for dream ${i}.\n\n`;
      }
      
      const entries = contentParser.extractDreamEntries(multiEntryContent, 'dream');
      
      // Should extract all entries without crashing
      console.log(`Many entries test: extracted ${entries.length} entries`);
      
      return entries.length === 100;
    }
  );
  
  // ================================
  // SPECIAL CHARACTER HANDLING
  // ================================
  
  // Test: Unicode characters in titles and content
  testRunner.addTest(
    'Edge Case - Should handle Unicode characters in titles and content',
    () => {
      const content = `
[!dream] 夢の日記 (Dream Diary)
# こんにちは世界 (Hello World)
これは日本語の夢です。
This is a dream with Japanese text.
☀️🌙✨ <- Emoji characters
Sensory Detail: 4, Emotional Recall: 3
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      console.log(`Unicode test: extracted ${entries.length} entries`);
      if (entries.length > 0) {
        console.log(`Unicode entry title: ${entries[0].title}`);
      }
      
      return entries.length === 1 && 
             entries[0].title === "こんにちは世界 (Hello World)" &&
             entries[0].content.includes("☀️🌙✨");
    }
  );
  
  // Test: Markdown special characters
  testRunner.addTest(
    'Edge Case - Should handle markdown special characters',
    () => {
      const content = `
[!dream] Dream with *special* _markdown_ characters
# Dream **with** ~~formatting~~

This dream has *italic*, **bold**, and ~~strikethrough~~.

> This is a blockquote
> With multiple lines

\`\`\`
This is a code block
function test() {
  return true;
}
\`\`\`

Sensory Detail: 4, Emotional Recall: 3
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      return entries.length === 1 && 
             entries[0].content.includes("*italic*") &&
             entries[0].content.includes("```");
    }
  );
  
  // Test: Special characters in metric names and values
  testRunner.addTest(
    'Edge Case - Should handle special characters in metric names and values',
    () => {
      const content = `
[!dream] Dream with special metrics
This is a dream with unusual metric names and values.

Sensory Detail*: 4.5, Emotional-Recall: very_high, Descriptiveness?: !uncertain!
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      const metricsText = entries[0]?.calloutMetadata?.[0] || '';
      console.log(`Special metrics text: ${metricsText}`);
      
      return entries.length === 1 && 
             metricsText.includes("Sensory Detail*: 4.5") &&
             metricsText.includes("!uncertain!");
    }
  );
  
  // ================================
  // COMPLEX CALLOUT SCENARIOS
  // ================================
  
  // Test: Deeply nested callouts
  testRunner.addTest(
    'Edge Case - Should handle deeply nested callouts',
    () => {
      const content = `
# Journal with nested content

[!dream] Outer Dream
This is the outer dream content.

[!note] Note inside dream
This is a note within the dream.

[!quote] Quote inside a dream
> This is a quote within the dream

More outer dream content.
Sensory Detail: 4

[!dream] Another Dream
This is a separate dream entry.
Emotional Recall: 3
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      console.log(`Nested callouts test: extracted ${entries.length} entries`);
      if (entries.length > 0) {
        console.log(`First entry content length: ${entries[0].content.length}`);
      }
      
      return entries.length === 2 && 
             entries[0].content.includes("[!note]") &&
             entries[0].content.includes("[!quote]");
    }
  );
  
  // Test: Overlapping/malformed callouts
  testRunner.addTest(
    'Edge Case - Should handle overlapping callouts',
    () => {
      const content = `
# Journal with overlapping callouts

[!dream] First Dream
This is the first dream.
[!dream] Second Dream (incorrectly starts inside first)
This is the second dream that incorrectly starts inside the first.
Sensory Detail: 4, Emotional Recall: 3

[!dream] Third Dream
This is a properly separated third dream.
Sensory Detail: 5
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      console.log(`Overlapping callouts test: extracted ${entries.length} entries`);
      entries.forEach((entry, i) => {
        console.log(`Entry ${i+1} content: ${entry.content.substring(0, 50)}...`);
      });
      
      // Depending on the implementation, we might get 2 or 3 entries
      // The important thing is that it doesn't crash
      return entries.length > 0;
    }
  );
  
  // Test: Callouts with unusual levels of indentation
  testRunner.addTest(
    'Edge Case - Should handle callouts with unusual indentation',
    () => {
      const content = `
# Journal with indented content

  [!dream] Indented Dream
    This dream has extra indentation.
      Sensory Detail: 4
        Emotional Recall: 3

[!dream]     Dream with indented title
This is a dream where the title line has spaces.
Sensory Detail: 5
`;
      
      const entries = contentParser.extractDreamEntries(content, 'dream');
      
      console.log(`Indented callouts test: extracted ${entries.length} entries`);
      
      return entries.length === 2;
    }
  );
} 