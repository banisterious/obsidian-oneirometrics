// Web Worker Test Modal
// Tests Phase 1 web worker functionality within Obsidian

import { App, Modal, Notice, ButtonComponent } from 'obsidian';
import { DateNavigatorWorkerManager } from '../DateNavigatorWorkerManager';
import { DreamMetricData } from '../../types';
import { DatePattern, FilterOptions } from '../types';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  error?: string;
}

export class WebWorkerTestModal extends Modal {
  private workerManager: DateNavigatorWorkerManager;
  private results: TestResult[] = [];
  private testsContainer: HTMLElement;
  
  constructor(app: App) {
    super(app);
    this.workerManager = new DateNavigatorWorkerManager(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Modal header
    contentEl.createEl('h2', { text: 'Web Worker Tests - Phase 1' });
    contentEl.createEl('p', { 
      text: 'Testing core worker functionality: fallback methods, caching, and error handling.' 
    });

    // Test controls
    const controlsContainer = contentEl.createDiv('test-controls');
    
    new ButtonComponent(controlsContainer)
      .setButtonText('Run All Tests')
      .setCta()
      .onClick(() => this.runAllTests());

    new ButtonComponent(controlsContainer)
      .setButtonText('Run Fallback Tests')
      .onClick(() => this.runFallbackTests());

    new ButtonComponent(controlsContainer)
      .setButtonText('Run Cache Tests')
      .onClick(() => this.runCacheTests());

    new ButtonComponent(controlsContainer)
      .setButtonText('Run Error Tests')
      .onClick(() => this.runErrorTests());

    new ButtonComponent(controlsContainer)
      .setButtonText('Clear Results')
      .onClick(() => this.clearResults());

    // Results container
    this.testsContainer = contentEl.createDiv('tests-container');
    this.addStyles();
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .test-controls {
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .test-result {
        margin: 10px 0;
        padding: 10px;
        border-radius: 4px;
        border: 1px solid var(--background-modifier-border);
      }
      
      .test-result.passed {
        background-color: var(--color-green);
        color: var(--text-on-accent);
      }
      
      .test-result.failed {
        background-color: var(--color-red);
        color: var(--text-on-accent);
      }
      
      .test-result h4 {
        margin: 0 0 5px 0;
      }
      
      .test-details {
        font-size: 0.9em;
        margin: 5px 0;
      }
      
      .test-error {
        font-family: monospace;
        background-color: rgba(0,0,0,0.1);
        padding: 5px;
        border-radius: 2px;
        margin-top: 5px;
      }
      
      .test-summary {
        margin: 20px 0;
        padding: 15px;
        background-color: var(--background-secondary);
        border-radius: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  private async runAllTests(): Promise<void> {
    this.clearResults();
    this.showProgress('Running all tests...');
    
    await this.runFallbackTests();
    await this.runCacheTests();
    await this.runErrorTests();
    
    this.showSummary();
    new Notice(`Tests completed: ${this.getPassedCount()}/${this.results.length} passed`);
  }

  private async runFallbackTests(): Promise<void> {
    this.addTestGroup('Fallback Method Tests');
    
    const testData = this.generateTestData();
    
    // Test date range filtering
    await this.runTest('Date Range Filter - Basic', async () => {
      const result = await this.workerManager.filterByDateRange(
        testData,
        '2024-01-01',
        '2024-01-31'
      );
      
      if (!result.visibilityMap || result.visibilityMap.length !== testData.length) {
        throw new Error(`Expected ${testData.length} results, got ${result.visibilityMap?.length}`);
      }
      
      const visibleCount = result.visibilityMap.filter(r => r.visible).length;
      return `Processed ${testData.length} entries, ${visibleCount} visible`;
    });

    // Test date range with statistics
    await this.runTest('Date Range Filter - With Statistics', async () => {
      const result = await this.workerManager.filterByDateRange(
        testData,
        '2024-01-01',
        '2024-01-31',
        { includeStatistics: true }
      );
      
      if (!result.statistics) {
        throw new Error('Statistics not included in result');
      }
      
      if (result.statistics.totalEntries !== testData.length) {
        throw new Error(`Statistics mismatch: expected ${testData.length}, got ${result.statistics.totalEntries}`);
      }
      
      return `Statistics: ${result.statistics.totalEntries} total, ${result.statistics.visibleEntries} visible`;
    });

    // Test multiple dates filtering
    await this.runTest('Multiple Dates Filter - Include Mode', async () => {
      const selectedDates = ['2024-01-15', '2024-01-20'];
      const result = await this.workerManager.filterByMultipleDates(
        testData,
        selectedDates,
        'include'
      );
      
      const visibleCount = result.visibilityMap.filter(r => r.visible).length;
      return `Selected ${selectedDates.length} dates, ${visibleCount} entries visible, ${result.affectedDates.length} affected`;
    });

    // Test multiple dates filtering - exclude mode
    await this.runTest('Multiple Dates Filter - Exclude Mode', async () => {
      const selectedDates = ['2024-01-15'];
      const result = await this.workerManager.filterByMultipleDates(
        testData,
        selectedDates,
        'exclude'
      );
      
      const visibleCount = result.visibilityMap.filter(r => r.visible).length;
      const expectedVisible = testData.length - 1; // Should hide 1 entry
      
      if (visibleCount !== expectedVisible) {
        throw new Error(`Expected ${expectedVisible} visible, got ${visibleCount}`);
      }
      
      return `Excluded ${selectedDates.length} dates, ${visibleCount} entries remain visible`;
    });

    // Test pattern filtering
    await this.runTest('Pattern Filter - Weekday', async () => {
      const pattern: DatePattern = {
        type: 'weekday',
        value: 1, // Monday
        description: 'Filter for Mondays'
      };
      
      const result = await this.workerManager.filterByPattern(testData, pattern);
      
      if (!result.patternInfo) {
        throw new Error('Pattern info not included in result');
      }
      
      return `Pattern matches: ${result.patternInfo.totalMatches}, efficiency: ${(result.patternInfo.patternEfficiency * 100).toFixed(1)}%`;
    });

    // Test edge cases
    await this.runTest('Edge Case - Empty Data', async () => {
      const result = await this.workerManager.filterByDateRange([], '2024-01-01', '2024-01-31');
      
      if (result.visibilityMap.length !== 0) {
        throw new Error('Expected empty result for empty input');
      }
      
      return 'Correctly handled empty data set';
    });

    await this.runTest('Edge Case - Invalid Date Range', async () => {
      try {
        await this.workerManager.filterByDateRange(
          testData,
          '2024-12-31',
          '2024-01-01' // End before start
        );
        
        // Should still work, just return no visible entries
        return 'Handled invalid date range gracefully';
      } catch (error) {
        throw new Error(`Should handle invalid dates gracefully: ${error.message}`);
      }
    });
  }

  private async runCacheTests(): Promise<void> {
    this.addTestGroup('Cache Management Tests');
    
    const testData = this.generateTestData();
    
    // Test cache hit
    await this.runTest('Cache Hit Test', async () => {
      // Clear cache first
      this.workerManager.clearCache();
      
      // First call - should cache
      const start1 = performance.now();
      await this.workerManager.filterByDateRange(testData, '2024-01-01', '2024-01-31');
      const duration1 = performance.now() - start1;
      
      // Second call - should hit cache
      const start2 = performance.now();
      await this.workerManager.filterByDateRange(testData, '2024-01-01', '2024-01-31');
      const duration2 = performance.now() - start2;
      
      if (duration2 >= duration1) {
        throw new Error('Cache hit should be faster than original call');
      }
      
      const cacheStats = this.workerManager.getCacheStats();
      if (cacheStats.size === 0) {
        throw new Error('Expected cache to contain entries');
      }
      
      return `Cache hit ~${((duration1 - duration2) / duration1 * 100).toFixed(1)}% faster. Cache size: ${cacheStats.size}`;
    });

    // Test cache clearing
    await this.runTest('Cache Clear Test', async () => {
      // Ensure cache has entries
      await this.workerManager.filterByDateRange(testData, '2024-01-01', '2024-01-31');
      
      let stats = this.workerManager.getCacheStats();
      if (stats.size === 0) {
        throw new Error('Cache should have entries before clearing');
      }
      
      this.workerManager.clearCache();
      stats = this.workerManager.getCacheStats();
      
      if (stats.size !== 0) {
        throw new Error('Cache should be empty after clearing');
      }
      
      return 'Cache cleared successfully';
    });

    // Test cache enable/disable
    await this.runTest('Cache Toggle Test', async () => {
      this.workerManager.setCacheEnabled(false);
      
      let stats = this.workerManager.getCacheStats();
      if (stats.enabled) {
        throw new Error('Cache should be disabled');
      }
      
      // Should not cache when disabled
      await this.workerManager.filterByDateRange(testData, '2024-01-01', '2024-01-31');
      stats = this.workerManager.getCacheStats();
      if (stats.size > 0) {
        throw new Error('Cache should remain empty when disabled');
      }
      
      // Re-enable
      this.workerManager.setCacheEnabled(true);
      stats = this.workerManager.getCacheStats();
      if (!stats.enabled) {
        throw new Error('Cache should be enabled');
      }
      
      return 'Cache enable/disable working correctly';
    });
  }

  private async runErrorTests(): Promise<void> {
    this.addTestGroup('Error Handling Tests');
    
    // Test graceful degradation (worker not available)
    await this.runTest('Graceful Degradation', async () => {
      // The manager should always fall back to main thread processing
      // since we haven't implemented actual worker loading yet
      const testData = this.generateTestData();
      const result = await this.workerManager.filterByDateRange(testData, '2024-01-01', '2024-01-31');
      
      if (!result.visibilityMap) {
        throw new Error('Should have fallback result even without worker');
      }
      
      return `Fallback processing working: ${result.visibilityMap.length} results`;
    });

    // Test invalid input handling
    await this.runTest('Invalid Input Handling', async () => {
      const invalidData = [
        { date: '', source: 'test1', title: 'Test', content: 'Test', wordCount: 0, metrics: {} },
        { date: 'invalid-date', source: 'test2', title: 'Test', content: 'Test', wordCount: 0, metrics: {} }
      ] as DreamMetricData[];
      
      const result = await this.workerManager.filterByDateRange(invalidData, '2024-01-01', '2024-01-31');
      
      // Should handle gracefully without throwing
      const noDateEntries = result.visibilityMap.filter(r => r.matchReason === 'no-date');
      
      return `Handled ${noDateEntries.length} entries with invalid dates gracefully`;
    });
  }

  private async runTest(name: string, testFn: () => Promise<string>): Promise<void> {
    const startTime = performance.now();
    
    try {
      const details = await testFn();
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: name,
        passed: true,
        duration,
        details
      });
      
      this.addTestResult(name, true, duration, details);
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.results.push({
        testName: name,
        passed: false,
        duration,
        details: '',
        error: errorMessage
      });
      
      this.addTestResult(name, false, duration, '', errorMessage);
    }
  }

  private generateTestData(): DreamMetricData[] {
    return [
      {
        date: '2024-01-15',
        source: 'test-note-1.md',
        title: 'Test Dream 1',
        content: 'A vivid dream about flying',
        wordCount: 25,
        metrics: { clarity: 8, emotion: 7 }
      },
      {
        date: '2024-01-20',
        source: 'test-note-2.md',
        title: 'Test Dream 2',
        content: 'A mysterious dream about exploration',
        wordCount: 30,
        metrics: { clarity: 6, emotion: 9 }
      },
      {
        date: '2024-02-01',
        source: 'test-note-3.md',
        title: 'Test Dream 3',
        content: 'A peaceful dream about nature',
        wordCount: 20,
        metrics: { clarity: 9, emotion: 5 }
      },
      {
        date: '2024-01-15', // Duplicate date for testing
        source: 'test-note-4.md',
        title: 'Test Dream 4',
        content: 'Another dream on the same day',
        wordCount: 15,
        metrics: { clarity: 7, emotion: 6 }
      }
    ];
  }

  private addTestGroup(groupName: string): void {
    const groupEl = this.testsContainer.createDiv('test-group');
    groupEl.createEl('h3', { text: groupName });
  }

  private addTestResult(name: string, passed: boolean, duration: number, details: string, error?: string): void {
    const resultEl = this.testsContainer.createDiv(`test-result ${passed ? 'passed' : 'failed'}`);
    
    resultEl.createEl('h4', { text: `${passed ? '✅' : '❌'} ${name}` });
    resultEl.createEl('div', { 
      text: `Duration: ${duration.toFixed(2)}ms`,
      cls: 'test-details'
    });
    
    if (details) {
      resultEl.createEl('div', { 
        text: details,
        cls: 'test-details'
      });
    }
    
    if (error) {
      const errorEl = resultEl.createDiv('test-error');
      errorEl.createEl('strong', { text: 'Error: ' });
      errorEl.appendText(error);
    }
  }

  private showProgress(message: string): void {
    this.testsContainer.empty();
    this.testsContainer.createEl('p', { text: message });
  }

  private clearResults(): void {
    this.results = [];
    this.testsContainer.empty();
  }

  private getPassedCount(): number {
    return this.results.filter(r => r.passed).length;
  }

  private showSummary(): void {
    const summaryEl = this.testsContainer.createDiv('test-summary');
    const passedCount = this.getPassedCount();
    const totalCount = this.results.length;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalCount;
    
    summaryEl.createEl('h3', { text: 'Test Summary' });
    summaryEl.createEl('p', { text: `Passed: ${passedCount}/${totalCount} (${((passedCount/totalCount)*100).toFixed(1)}%)` });
    summaryEl.createEl('p', { text: `Average Duration: ${avgDuration.toFixed(2)}ms` });
    summaryEl.createEl('p', { text: `Total Runtime: ${this.results.reduce((sum, r) => sum + r.duration, 0).toFixed(2)}ms` });
  }

  onClose() {
    // Clean up any resources
    this.workerManager.dispose();
  }
} 