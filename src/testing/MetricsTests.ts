import { TestRunner } from './TestRunner';
import { MetricsProcessor } from '../metrics/services/MetricsProcessor';
import { DreamMetricData, DreamMetric } from '../../types';

/**
 * Register metrics processing tests to the test runner
 * @param testRunner The test runner instance
 * @param metrics Metric definitions from settings
 */
export function registerMetricsProcessorTests(
  testRunner: TestRunner,
  metrics: Record<string, DreamMetric>
): void {
  const processor = new MetricsProcessor(metrics);
  
  // Test: Processing metrics text
  testRunner.addTest(
    'MetricsProcessor - Should parse valid metrics text',
    () => {
      const result = processor.processMetricsText('Sensory Detail: 4, Emotional Recall: 3');
      return result['Sensory Detail'] === 4 && result['Emotional Recall'] === 3;
    }
  );
  
  testRunner.addTest(
    'MetricsProcessor - Should handle invalid numeric values',
    () => {
      const result = processor.processMetricsText('Sensory Detail: x, Emotional Recall: 3');
      return !('Sensory Detail' in result) && result['Emotional Recall'] === 3;
    }
  );
  
  testRunner.addTest(
    'MetricsProcessor - Should handle empty metrics text',
    () => {
      const result = processor.processMetricsText('');
      return Object.keys(result).length === 0;
    }
  );
  
  testRunner.addTest(
    'MetricsProcessor - Should update global metrics',
    () => {
      const globalMetrics: Record<string, number[]> = {};
      processor.processMetricsText('Sensory Detail: 4, Emotional Recall: 3', globalMetrics);
      return (
        globalMetrics['Sensory Detail']?.length === 1 &&
        globalMetrics['Sensory Detail'][0] === 4 &&
        globalMetrics['Emotional Recall']?.length === 1 &&
        globalMetrics['Emotional Recall'][0] === 3
      );
    }
  );
  
  // Test: Processing dream entries
  testRunner.addTest(
    'MetricsProcessor - Should process dream entry',
    () => {
      console.log('Running process dream entry test');
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
      
      console.log('Entry before processing:', JSON.stringify(entry));
      const processedEntry = processor.processEntry(entry);
      console.log('Entry after processing:', JSON.stringify(processedEntry));
      console.log('Sensory Detail:', processedEntry.metrics['Sensory Detail']);
      console.log('Words:', processedEntry.metrics['Words']);
      
      // There are 8 words in "This is a test dream with some content."
      const result = (
        processedEntry.metrics['Sensory Detail'] === 4 &&
        processedEntry.metrics['Words'] === 8
      );
      console.log('Test result:', result);
      return result;
    }
  );
  
  // Test: Calculating summary statistics
  testRunner.addTest(
    'MetricsProcessor - Should calculate summary statistics',
    () => {
      const metrics = {
        'Sensory Detail': [2, 4, 6]
      };
      
      const stats = processor.calculateSummaryStatistics(metrics);
      
      return (
        stats['Sensory Detail']?.min === 2 &&
        stats['Sensory Detail']?.max === 6 &&
        stats['Sensory Detail']?.avg === 4 &&
        stats['Sensory Detail']?.count === 3
      );
    }
  );
  
  // Test: Time-based metrics
  testRunner.addTest(
    'MetricsProcessor - Should calculate time-based metrics',
    () => {
      console.log('Running time-based metrics test');
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
      
      console.log('Entries before processing:', JSON.stringify(entries));
      const timeMetrics = processor.getTimeBasedMetrics(entries);
      console.log('Time metrics result:', JSON.stringify(timeMetrics));
      
      // Both entries should be in May 2025
      const monthKey = '2025-5';
      console.log('Month key:', monthKey);
      console.log('Months in result:', Object.keys(timeMetrics.byMonth));
      console.log('Month data:', timeMetrics.byMonth[monthKey]);
      
      const result = (
        timeMetrics.byMonth[monthKey]?.count === 2 &&
        timeMetrics.byMonth[monthKey]?.totalWords === 300
      );
      console.log('Test result:', result);
      return result;
    }
  );
} 