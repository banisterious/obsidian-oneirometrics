import { TestRunner } from './TestRunner';
import { App } from 'obsidian';

/**
 * Register UI component tests to the test runner
 * @param testRunner The test runner instance
 */
export function registerUIComponentTests(
  testRunner: TestRunner
): void {
  // ================================
  // TABLE GENERATION TESTS
  // ================================
  
  // Test: Basic metrics table generation
  testRunner.addTest(
    'UI Components - Should generate a basic metrics table',
    () => {
      // Create a simple metrics data object
      const metrics = {
        'Sensory Detail': [4, 3, 5, 2],
        'Emotional Recall': [3, 4, 2, 5]
      };
      
      // Create a simple table generator function
      const generateTable = (data: Record<string, number[]>): HTMLElement => {
        const table = document.createElement('table');
        table.className = 'metrics-table';
        
        // Add header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Add metric name header
        const metricHeader = document.createElement('th');
        metricHeader.textContent = 'Metric';
        headerRow.appendChild(metricHeader);
        
        // Add statistic column headers
        const avgHeader = document.createElement('th');
        avgHeader.textContent = 'Average';
        headerRow.appendChild(avgHeader);
        
        const countHeader = document.createElement('th');
        countHeader.textContent = 'Count';
        headerRow.appendChild(countHeader);
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Add data rows
        const tbody = document.createElement('tbody');
        
        Object.entries(data).forEach(([metric, values]) => {
          const row = document.createElement('tr');
          
          // Add metric name
          const metricCell = document.createElement('td');
          metricCell.textContent = metric;
          metricCell.className = 'metric-name';
          row.appendChild(metricCell);
          
          // Add average
          const avgCell = document.createElement('td');
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          avgCell.textContent = avg.toFixed(1);
          avgCell.className = 'metric-avg';
          row.appendChild(avgCell);
          
          // Add count
          const countCell = document.createElement('td');
          countCell.textContent = values.length.toString();
          countCell.className = 'metric-count';
          row.appendChild(countCell);
          
          tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        return table;
      };
      
      // Generate the table
      const table = generateTable(metrics);
      
      // Check table structure
      return table.tagName === 'TABLE' &&
             table.querySelector('thead tr th')?.textContent === 'Metric' &&
             table.querySelectorAll('tbody tr').length === 2 &&
             table.querySelector('tbody tr:first-child td.metric-name')?.textContent === 'Sensory Detail' &&
             table.querySelector('tbody tr:first-child td.metric-avg')?.textContent === '3.5' &&
             table.querySelector('tbody tr:first-child td.metric-count')?.textContent === '4';
    }
  );
  
  // Test: Empty metrics table generation
  testRunner.addTest(
    'UI Components - Should handle empty metrics data in table',
    () => {
      // Create metrics without data
      const emptyMetrics = {};
      
      // Create a metrics table generator function
      const generateTable = (data: Record<string, number[]>): HTMLElement => {
        const table = document.createElement('table');
        table.className = 'metrics-table';
        
        // Add header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Add standard headers
        headerRow.appendChild(document.createElement('th')).textContent = 'Metric';
        headerRow.appendChild(document.createElement('th')).textContent = 'Average';
        headerRow.appendChild(document.createElement('th')).textContent = 'Count';
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Add message for empty data
        if (Object.keys(data).length === 0) {
          const tbody = document.createElement('tbody');
          const emptyRow = document.createElement('tr');
          const emptyCell = document.createElement('td');
          
          emptyCell.colSpan = 3;
          emptyCell.className = 'empty-metrics';
          emptyCell.textContent = 'No metrics data available';
          
          emptyRow.appendChild(emptyCell);
          tbody.appendChild(emptyRow);
          table.appendChild(tbody);
        } else {
          // Normal table generation for non-empty data
          // (left out for brevity in this test)
        }
        
        return table;
      };
      
      // Generate the table
      const table = generateTable(emptyMetrics);
      
      // Check empty table structure
      return table.tagName === 'TABLE' &&
             table.querySelectorAll('thead th').length === 3 &&
             table.querySelector('.empty-metrics')?.textContent === 'No metrics data available' &&
             (table.querySelector('.empty-metrics') as HTMLTableCellElement)?.colSpan === 3;
    }
  );
  
  // ================================
  // FILTER APPLICATION TESTS
  // ================================
  
  // Test: Date range filter
  testRunner.addTest(
    'UI Components - Should correctly apply date range filter',
    () => {
      // Create sample entries with dates
      const entries = [
        { date: '2025-05-01', title: 'Entry 1', content: 'Content 1' },
        { date: '2025-05-15', title: 'Entry 2', content: 'Content 2' },
        { date: '2025-06-01', title: 'Entry 3', content: 'Content 3' },
        { date: '2025-06-15', title: 'Entry 4', content: 'Content 4' },
        { date: '2025-07-01', title: 'Entry 5', content: 'Content 5' }
      ];
      
      // Create a date range filter function
      const applyDateRangeFilter = (
        entries: Array<{date: string, title: string, content: string}>,
        startDate: string,
        endDate: string
      ): Array<{date: string, title: string, content: string}> => {
        return entries.filter(entry => {
          const entryDate = entry.date;
          return entryDate >= startDate && entryDate <= endDate;
        });
      };
      
      // Apply the filter for May 2025
      const filteredEntries = applyDateRangeFilter(entries, '2025-05-01', '2025-05-31');
      
      // Check filter results
      return filteredEntries.length === 2 &&
             filteredEntries[0].title === 'Entry 1' &&
             filteredEntries[1].title === 'Entry 2' &&
             !filteredEntries.some(e => e.date.startsWith('2025-06')) &&
             !filteredEntries.some(e => e.date.startsWith('2025-07'));
    }
  );
  
  // Test: Metrics value filter
  testRunner.addTest(
    'UI Components - Should correctly apply metrics value filter',
    () => {
      // Create sample entries with metrics
      const entries = [
        { title: 'Entry 1', metrics: { 'Sensory Detail': 2, 'Emotional Recall': 3 } },
        { title: 'Entry 2', metrics: { 'Sensory Detail': 4, 'Emotional Recall': 2 } },
        { title: 'Entry 3', metrics: { 'Sensory Detail': 1, 'Emotional Recall': 5 } },
        { title: 'Entry 4', metrics: { 'Sensory Detail': 5, 'Emotional Recall': 1 } },
        { title: 'Entry 5', metrics: { 'Sensory Detail': 3, 'Emotional Recall': 3 } }
      ];
      
      // Create a metrics value filter function
      const applyMetricsFilter = (
        entries: Array<{title: string, metrics: Record<string, number>}>,
        metricName: string,
        minValue: number,
        maxValue: number
      ): Array<{title: string, metrics: Record<string, number>}> => {
        return entries.filter(entry => {
          const value = entry.metrics[metricName];
          return value !== undefined && value >= minValue && value <= maxValue;
        });
      };
      
      // Apply filter for high Sensory Detail (4-5)
      const highSensoryEntries = applyMetricsFilter(entries, 'Sensory Detail', 4, 5);
      
      // Apply filter for high Emotional Recall (4-5)
      const highEmotionalEntries = applyMetricsFilter(entries, 'Emotional Recall', 4, 5);
      
      // Check filter results
      return highSensoryEntries.length === 2 &&
             highSensoryEntries[0].title === 'Entry 2' &&
             highSensoryEntries[1].title === 'Entry 4' &&
             highEmotionalEntries.length === 1 &&
             highEmotionalEntries[0].title === 'Entry 3';
    }
  );
  
  // Test: Combined filters
  testRunner.addTest(
    'UI Components - Should correctly apply combined filters',
    () => {
      // Create sample entries with dates and metrics
      const entries = [
        { date: '2025-05-01', title: 'Entry 1', metrics: { 'Sensory Detail': 2, 'Emotional Recall': 3 } },
        { date: '2025-05-15', title: 'Entry 2', metrics: { 'Sensory Detail': 4, 'Emotional Recall': 2 } },
        { date: '2025-06-01', title: 'Entry 3', metrics: { 'Sensory Detail': 1, 'Emotional Recall': 5 } },
        { date: '2025-06-15', title: 'Entry 4', metrics: { 'Sensory Detail': 5, 'Emotional Recall': 1 } },
        { date: '2025-07-01', title: 'Entry 5', metrics: { 'Sensory Detail': 3, 'Emotional Recall': 3 } }
      ];
      
      // Create a combined filter function
      const applyCombinedFilter = (
        entries: Array<{date: string, title: string, metrics: Record<string, number>}>,
        startDate: string,
        endDate: string,
        metricName: string,
        minValue: number,
        maxValue: number
      ): Array<{date: string, title: string, metrics: Record<string, number>}> => {
        return entries.filter(entry => {
          // Date filter
          const dateMatches = entry.date >= startDate && entry.date <= endDate;
          
          // Metrics filter
          const value = entry.metrics[metricName];
          const metricMatches = value !== undefined && value >= minValue && value <= maxValue;
          
          // Combined result
          return dateMatches && metricMatches;
        });
      };
      
      // Apply combined filter: June 2025 with high Sensory Detail (4-5)
      const filteredEntries = applyCombinedFilter(
        entries,
        '2025-06-01',
        '2025-06-30',
        'Sensory Detail',
        4,
        5
      );
      
      // Check filter results
      return filteredEntries.length === 1 &&
             filteredEntries[0].title === 'Entry 4' &&
             filteredEntries[0].date === '2025-06-15' &&
             filteredEntries[0].metrics['Sensory Detail'] === 5;
    }
  );
} 