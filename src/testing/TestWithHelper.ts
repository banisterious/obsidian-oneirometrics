import { TestRunner } from './TestRunner';
import { MetricsTestHelper } from './MetricsTestHelper';
import { DreamMetricData, DreamMetric } from '../../types';

/**
 * Register tests that use our simplified helper instead of the actual implementation
 * @param testRunner Test runner instance
 * @param metrics Metric definitions from settings
 */
export function registerHelperTests(
  testRunner: TestRunner,
  metrics: Record<string, DreamMetric>
): void {
  console.log('Creating MetricsTestHelper with metrics:', JSON.stringify(metrics));
  const helper = new MetricsTestHelper(metrics);
  
  // Test: Processing dream entries
  testRunner.addTest(
    'Helper - Should process dream entry',
    () => {
      console.log('----- RUNNING HELPER TEST: process dream entry -----');
      const entry: DreamMetricData = {
        date: '2025-05-01',
        title: 'Test Dream',
        content: 'This is a test dream with some content.',
        source: {
          file: 'test.md',
          id: 'test'
        },
        metrics: { 'Sensory Detail': 4 }
      };
      
      console.log('Entry before processing with helper:', JSON.stringify(entry));
      const processedEntry = helper.processEntry(entry);
      console.log('Entry after processing with helper:', JSON.stringify(processedEntry));
      
      const sensoryDetail = processedEntry.metrics['Sensory Detail'];
      const wordCount = processedEntry.metrics['Words'];
      
      console.log(`TEST VALUES: Sensory Detail = ${sensoryDetail}, Words = ${wordCount}`);
      console.log(`EXPECTED: Sensory Detail = 4, Words = 8`);
      console.log(`COMPARISON: Sensory Detail ${sensoryDetail === 4 ? '===' : '!=='} 4, Words ${wordCount === 8 ? '===' : '!=='} 8`);
      
      const result = (
        sensoryDetail === 4 &&
        wordCount === 8
      );
      
      console.log(`TEST RESULT: ${result ? 'PASS' : 'FAIL'}`);
      return result;
    }
  );
  
  // Test: Time-based Metrics
  testRunner.addTest(
    'Helper - Should calculate time-based metrics',
    () => {
      console.log('----- RUNNING HELPER TEST: time-based metrics -----');
      const entries: DreamMetricData[] = [
        {
          date: '2025-05-01',
          title: 'Dream 1',
          content: 'Content 1',
          source: {
            file: 'file1.md',
            id: 'id1'
          },
          metrics: { 'Words': 100 }
        },
        {
          date: '2025-05-02',
          title: 'Dream 2',
          content: 'Content 2',
          source: {
            file: 'file2.md',
            id: 'id2'
          },
          metrics: { 'Words': 200 }
        }
      ];
      
      console.log('Entries before time metrics:', JSON.stringify(entries));
      const timeMetrics = helper.getTimeBasedMetrics(entries);
      console.log('Time metrics result:', JSON.stringify(timeMetrics));
      
      // Both entries should be in May 2025
      const monthKey = '2025-5';
      
      const count = timeMetrics.byMonth[monthKey]?.count;
      const totalWords = timeMetrics.byMonth[monthKey]?.totalWords;
      
      console.log(`TEST VALUES: count = ${count}, totalWords = ${totalWords}`);
      console.log(`EXPECTED: count = 2, totalWords = 300`);
      console.log(`COMPARISON: count ${count === 2 ? '===' : '!=='} 2, totalWords ${totalWords === 300 ? '===' : '!=='} 300`);
      
      const result = (
        count === 2 &&
        totalWords === 300
      );
      
      console.log(`TEST RESULT: ${result ? 'PASS' : 'FAIL'}`);
      return result;
    }
  );
} 