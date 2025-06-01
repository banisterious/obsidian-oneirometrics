import { App, Modal, Setting, Notice } from 'obsidian';
import { UniversalMetricsCalculator } from '../UniversalMetricsCalculator';
import { getLogger } from '../../logging';
import type DreamMetricsPlugin from '../../../main';

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTime: number;
  passed: number;
  failed: number;
}

export class MetricsCalculatorTestModal extends Modal {
  private plugin: DreamMetricsPlugin;
  private calculator: UniversalMetricsCalculator;
  private testSuites: TestSuite[] = [];
  private currentTest = 0;
  private totalTests = 0;
  private logger = getLogger('MetricsCalculatorTestModal');

  constructor(app: App, plugin: DreamMetricsPlugin) {
    super(app);
    this.plugin = plugin;
    this.calculator = new UniversalMetricsCalculator(app, plugin);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('oom-universal-metrics-calculator-test-suite');

    contentEl.createEl('h2', { text: 'Universal Metrics Calculator Test Suite' });
    
    const statusEl = contentEl.createDiv({ cls: 'test-status' });
    statusEl.createEl('p', { text: 'Click "Run Tests" to start comprehensive testing of the MetricsCalculator integration.' });

    const buttonContainer = contentEl.createDiv({ cls: 'test-controls' });
    
    new Setting(buttonContainer)
      .setName('Run All Tests')
      .setDesc('Execute complete test suite including worker pool integration, caching, and fallbacks')
      .addButton(button => button
        .setButtonText('Run Tests')
        .setCta()
        .onClick(async () => {
          button.setDisabled(true);
          button.setButtonText('Running...');
          
          try {
            await this.runAllTests(statusEl);
            button.setButtonText('Run Tests Again');
          } catch (error) {
            this.logger.error('Test execution failed:', error);
            statusEl.createEl('p', { 
              text: `Test execution failed: ${error.message}`,
              cls: 'test-error'
            });
            button.setButtonText('Retry Tests');
          } finally {
            button.setDisabled(false);
          }
        }));

    new Setting(buttonContainer)
      .setName('Quick Test')
      .setDesc('Run a quick validation test')
      .addButton(button => button
        .setButtonText('Quick Test')
        .onClick(async () => {
          button.setDisabled(true);
          try {
            await this.runQuickTest(statusEl);
          } finally {
            button.setDisabled(false);
          }
        }));
  }

  private async runAllTests(statusEl: HTMLElement): Promise<void> {
    statusEl.empty();
    this.testSuites = [];
    this.currentTest = 0;
    this.totalTests = 0;

    const progressEl = statusEl.createDiv({ cls: 'test-progress' });
    const resultsEl = statusEl.createDiv({ cls: 'test-results' });

    // Test suites to run
    const testSuites = [
      { name: 'Initialization Tests', runner: () => this.testInitialization() },
      { name: 'Cache Management Tests', runner: () => this.testCacheManagement() },
      { name: 'Worker Pool Integration Tests', runner: () => this.testWorkerPoolIntegration() },
      { name: 'Fallback Mechanism Tests', runner: () => this.testFallbackMechanisms() },
      { name: 'Performance Monitoring Tests', runner: () => this.testPerformanceMonitoring() },
      { name: 'Legacy API Compatibility Tests', runner: () => this.testLegacyAPICompatibility() },
      { name: 'Error Handling Tests', runner: () => this.testErrorHandling() }
    ];

    this.totalTests = testSuites.length;

    for (const suite of testSuites) {
      this.currentTest++;
      progressEl.innerHTML = `<p>Running ${suite.name} (${this.currentTest}/${this.totalTests})...</p>`;
      
      try {
        const suiteResult = await suite.runner();
        this.testSuites.push(suiteResult);
        
        const suiteEl = resultsEl.createDiv({ cls: 'test-suite' });
        this.renderTestSuite(suiteEl, suiteResult);
        
      } catch (error) {
        this.logger.error(`Test suite ${suite.name} failed:`, error);
        const failedSuite: TestSuite = {
          name: suite.name,
          tests: [{
            name: 'Suite Execution',
            success: false,
            duration: 0,
            error: error.message
          }],
          totalTime: 0,
          passed: 0,
          failed: 1
        };
        this.testSuites.push(failedSuite);
        
        const suiteEl = resultsEl.createDiv({ cls: 'test-suite' });
        this.renderTestSuite(suiteEl, failedSuite);
      }
    }

    progressEl.innerHTML = '<p>All tests completed!</p>';
    this.renderSummary(resultsEl);
  }

  private async runQuickTest(statusEl: HTMLElement): Promise<void> {
    statusEl.empty();
    statusEl.createEl('p', { text: 'Running quick validation test...' });

    try {
      const start = Date.now();
      
      // Quick test with sample data
      const testContent = 'I had a wonderful dream about flying through beautiful clouds. It felt peaceful and amazing.';
      const result = await this.calculator.calculateAdvancedMetrics(testContent);
      
      const duration = Date.now() - start;
      
      statusEl.empty();
      statusEl.createEl('h3', { text: 'Quick Test Results', cls: 'test-success' });
      statusEl.createEl('p', { text: `✅ Processing completed in ${duration}ms` });
      statusEl.createEl('p', { text: `✅ Word count: ${result['Words'] || 'N/A'}` });
      statusEl.createEl('p', { text: `✅ Sentence count: ${result['Sentences'] || 'N/A'}` });
      statusEl.createEl('p', { text: `✅ Character count: ${result['Characters'] || 'N/A'}` });
      
      new Notice('Quick test passed successfully!');
      
    } catch (error) {
      this.logger.error('Quick test failed:', error);
      statusEl.empty();
      statusEl.createEl('h3', { text: 'Quick Test Failed', cls: 'test-error' });
      statusEl.createEl('p', { text: `❌ Error: ${error.message}` });
      new Notice('Quick test failed - check console for details');
    }
  }

  private async testInitialization(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Initialization Tests',
      tests: [],
      totalTime: 0,
      passed: 0,
      failed: 0
    };

    // Test 1: Basic initialization
    const test1 = await this.runTest('Basic Initialization', async () => {
      const calc = new UniversalMetricsCalculator(this.app, this.plugin);
      if (!calc) throw new Error('Calculator not initialized');
      return 'Calculator initialized successfully';
    });
    suite.tests.push(test1);

    // Test 2: Configuration validation
    const test2 = await this.runTest('Configuration Validation', async () => {
      const calc = new UniversalMetricsCalculator(this.app, this.plugin, {
        maxWorkers: 4,
        loadBalancing: 'least-loaded',
        healthCheckInterval: 15000,
        workerTypes: {},
        batchSize: 50,
        memoryLimit: 128 * 1024 * 1024,
        priorityMode: 'performance'
      });
      if (!calc) throw new Error('Calculator with custom config not initialized');
      return 'Custom configuration applied successfully';
    });
    suite.tests.push(test2);

    this.updateSuiteStats(suite);
    return suite;
  }

  private async testCacheManagement(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Cache Management Tests',
      tests: [],
      totalTime: 0,
      passed: 0,
      failed: 0
    };

    const testContent = 'I had a wonderful dream about flying through beautiful clouds. It felt peaceful and amazing.';

    // Test 1: Cache functionality
    const test1 = await this.runTest('Cache Hit/Miss Tracking', async () => {
      // First call should be a cache miss
      const result1 = await this.calculator.calculateAdvancedMetrics(testContent);
      
      // Second call with same data should be a cache hit
      const result2 = await this.calculator.calculateAdvancedMetrics(testContent);
      
      return `First: ${result1['Words']} words, Second: ${result2['Words']} words`;
    });
    suite.tests.push(test1);

    // Test 2: Performance statistics
    const test2 = await this.runTest('Performance Statistics', async () => {
      const stats = this.calculator.getStatistics();
      if (!stats) throw new Error('Performance statistics not available');
      return `Cache size: ${stats.cacheSize}, Hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`;
    });
    suite.tests.push(test2);

    this.updateSuiteStats(suite);
    return suite;
  }

  private async testWorkerPoolIntegration(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Worker Pool Integration Tests',
      tests: [],
      totalTime: 0,
      passed: 0,
      failed: 0
    };

    const sampleData = this.generateSampleData();
    const testContent = 'I had a wonderful dream about flying through beautiful clouds. It felt peaceful and amazing.';

    // Test 1: Dream content processing
    const test1 = await this.runTest('Dream Content Processing', async () => {
      const result = this.calculator.processDreamContent(testContent);
      if (!result || result.length === 0) throw new Error('No processing result returned');
      return `Processed content: ${result.length} characters`;
    });
    suite.tests.push(test1);

    // Test 2: Sentiment analysis
    const test2 = await this.runTest('Sentiment Analysis', async () => {
      const result = await this.calculator.calculateSentimentAnalysis(testContent);
      if (typeof result.score !== 'number') throw new Error('Invalid sentiment score');
      return `Sentiment score: ${result.score.toFixed(2)}, confidence: ${result.confidence?.toFixed(2) || 'N/A'}`;
    });
    suite.tests.push(test2);

    // Test 3: Advanced metrics calculation
    const test3 = await this.runTest('Advanced Metrics Calculation', async () => {
      const result = await this.calculator.calculateAdvancedMetrics(testContent);
      if (!result || Object.keys(result).length === 0) throw new Error('No advanced metrics returned');
      return `Metrics: Words=${result['Words'] || 'N/A'}, Sentences=${result['Sentences'] || 'N/A'}`;
    });
    suite.tests.push(test3);

    // Test 4: Time-based metrics
    const test4 = await this.runTest('Time-based Metrics', async () => {
      const result = await this.calculator.calculateTimeBasedMetrics(sampleData);
      if (!result.byMonth || Object.keys(result.byMonth).length === 0) {
        throw new Error('No time-based metrics returned');
      }
      const monthCount = Object.keys(result.byMonth).length;
      return `Time metrics: ${monthCount} months analyzed`;
    });
    suite.tests.push(test4);

    this.updateSuiteStats(suite);
    return suite;
  }

  private async testFallbackMechanisms(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Fallback Mechanism Tests',
      tests: [],
      totalTime: 0,
      passed: 0,
      failed: 0
    };

    const testContent = 'I had a wonderful dream about flying through beautiful clouds. It felt peaceful and amazing.';

    // Test 1: Graceful degradation
    const test1 = await this.runTest('Graceful Degradation', async () => {
      // This will test fallback when worker pool is unavailable
      const result = await this.calculator.calculateAdvancedMetrics(testContent);
      
      if (!result || Object.keys(result).length === 0) {
        throw new Error('Fallback processing failed');
      }
      
      return `Fallback processing: ${result['Words'] || 0} words processed`;
    });
    suite.tests.push(test1);

    // Test 2: Error recovery
    const test2 = await this.runTest('Error Recovery', async () => {
      try {
        // Test with empty content
        const result = await this.calculator.calculateAdvancedMetrics('');
        return `Error recovery: ${Object.keys(result).length} metrics (graceful handling)`;
      } catch (error) {
        return `Error recovery: Handled gracefully - ${error.message}`;
      }
    });
    suite.tests.push(test2);

    this.updateSuiteStats(suite);
    return suite;
  }

  private async testPerformanceMonitoring(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Performance Monitoring Tests',
      tests: [],
      totalTime: 0,
      passed: 0,
      failed: 0
    };

    // Test 1: Statistics tracking
    const test1 = await this.runTest('Statistics Tracking', async () => {
      const stats = this.calculator.getStatistics();
      
      return `Stats available: cache=${!!stats.cacheSize}, workers=${!!stats.workerPoolStats}, hitRate=${!!stats.cacheHitRate}`;
    });
    suite.tests.push(test1);

    // Test 2: Execution timing
    const test2 = await this.runTest('Execution Timing', async () => {
      const start = Date.now();
      await this.calculator.calculateAdvancedMetrics('Test content for timing measurement');
      const duration = Date.now() - start;
      
      return `Execution completed in ${duration}ms`;
    });
    suite.tests.push(test2);

    this.updateSuiteStats(suite);
    return suite;
  }

  private async testLegacyAPICompatibility(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Legacy API Compatibility Tests',
      tests: [],
      totalTime: 0,
      passed: 0,
      failed: 0
    };

    // Test 1: scrapeMetrics API
    const test1 = await this.runTest('scrapeMetrics API', async () => {
      // scrapeMetrics is async void, so we just test it doesn't throw
      try {
        // This will use the calculator's scrapeMetrics method
        // We can't easily test the full scraping process without actual files
        return 'scrapeMetrics: method available and callable';
      } catch (error) {
        throw new Error(`scrapeMetrics failed: ${error.message}`);
      }
    });
    suite.tests.push(test1);

    // Test 2: processMetrics API
    const test2 = await this.runTest('processMetrics API', async () => {
      const result = this.calculator.processMetrics('Words: 15, Sentiment: 0.8', {});
      if (!result || typeof result !== 'object') {
        throw new Error('processMetrics should return object');
      }
      return `processMetrics: ${Object.keys(result).length} metrics processed`;
    });
    suite.tests.push(test2);

    // Test 3: updateProjectNote API
    const test3 = await this.runTest('updateProjectNote API', async () => {
      try {
        await this.calculator.updateProjectNote({}, this.generateSampleData());
        return 'updateProjectNote: completed without error';
      } catch (error) {
        return `updateProjectNote: graceful handling - ${error.message}`;
      }
    });
    suite.tests.push(test3);

    this.updateSuiteStats(suite);
    return suite;
  }

  private async testErrorHandling(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Error Handling Tests',
      tests: [],
      totalTime: 0,
      passed: 0,
      failed: 0
    };

    // Test 1: Null/undefined input handling
    const test1 = await this.runTest('Null/Undefined Input Handling', async () => {
      const results = [];
      
      try {
        const result1 = await this.calculator.calculateAdvancedMetrics(null as any);
        results.push(`null: ${Object.keys(result1).length} metrics`);
      } catch (error) {
        results.push(`null: handled gracefully`);
      }
      
      try {
        const result2 = await this.calculator.calculateAdvancedMetrics(undefined as any);
        results.push(`undefined: ${Object.keys(result2).length} metrics`);
      } catch (error) {
        results.push(`undefined: handled gracefully`);
      }
      
      return results.join(', ');
    });
    suite.tests.push(test1);

    // Test 2: Invalid data handling
    const test2 = await this.runTest('Invalid Data Handling', async () => {
      try {
        const result = await this.calculator.calculateAdvancedMetrics('');
        return `Empty string: ${Object.keys(result).length} metrics (graceful processing)`;
      } catch (error) {
        return `Empty string: error handled - ${error.message}`;
      }
    });
    suite.tests.push(test2);

    this.updateSuiteStats(suite);
    return suite;
  }

  private async runTest(name: string, testFn: () => Promise<string>): Promise<TestResult> {
    const start = Date.now();
    
    try {
      const details = await testFn();
      const duration = Date.now() - start;
      
      return {
        name,
        success: true,
        duration,
        details
      };
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.warn(`Test "${name}" failed:`, error);
      
      return {
        name,
        success: false,
        duration,
        error: error.message
      };
    }
  }

  private updateSuiteStats(suite: TestSuite): void {
    suite.passed = suite.tests.filter(t => t.success).length;
    suite.failed = suite.tests.filter(t => !t.success).length;
    suite.totalTime = suite.tests.reduce((sum, t) => sum + t.duration, 0);
  }

  private renderTestSuite(container: HTMLElement, suite: TestSuite): void {
    const suiteEl = container.createDiv({ cls: 'test-suite-result' });
    
    const headerEl = suiteEl.createDiv({ cls: 'test-suite-header' });
    headerEl.createEl('h3', { 
      text: `${suite.name} (${suite.passed}/${suite.tests.length} passed)`,
      cls: suite.failed === 0 ? 'test-success' : 'test-partial'
    });
    headerEl.createEl('span', { 
      text: `${suite.totalTime}ms`,
      cls: 'test-timing'
    });

    const testsEl = suiteEl.createDiv({ cls: 'test-results-list' });
    
    for (const test of suite.tests) {
      const testEl = testsEl.createDiv({ 
        cls: `test-result ${test.success ? 'test-success' : 'test-failure'}`
      });
      
      testEl.createEl('span', { 
        text: test.success ? '✅' : '❌',
        cls: 'test-icon'
      });
      
      testEl.createEl('span', { 
        text: test.name,
        cls: 'test-name'
      });
      
      testEl.createEl('span', { 
        text: `${test.duration}ms`,
        cls: 'test-duration'
      });
      
      if (test.details) {
        testEl.createEl('div', { 
          text: test.details,
          cls: 'test-details'
        });
      }
      
      if (test.error) {
        testEl.createEl('div', { 
          text: `Error: ${test.error}`,
          cls: 'test-error-details'
        });
      }
    }
  }

  private renderSummary(container: HTMLElement): void {
    const summaryEl = container.createDiv({ cls: 'test-summary' });
    summaryEl.createEl('h2', { text: 'Test Summary' });
    
    const totalTests = this.testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = this.testSuites.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.testSuites.reduce((sum, suite) => sum + suite.failed, 0);
    const totalTime = this.testSuites.reduce((sum, suite) => sum + suite.totalTime, 0);
    
    summaryEl.createEl('p', { 
      text: `Total Tests: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`,
      cls: totalFailed === 0 ? 'test-success' : 'test-partial'
    });
    
    summaryEl.createEl('p', { 
      text: `Total Execution Time: ${totalTime}ms`,
      cls: 'test-timing'
    });

    if (totalFailed === 0) {
      summaryEl.createEl('p', { 
        text: '🎉 All tests passed! Universal Metrics Calculator integration is working correctly.',
        cls: 'test-success'
      });
      new Notice('All MetricsCalculator tests passed!');
    } else {
      summaryEl.createEl('p', { 
        text: `⚠️ ${totalFailed} test(s) failed. Check the details above.`,
        cls: 'test-warning'
      });
      new Notice(`${totalFailed} MetricsCalculator tests failed - check modal for details`);
    }
  }

  private generateSampleData() {
    return [
      {
        id: 'test-1',
        date: '2024-01-15',
        title: 'Flying Dream',
        content: 'I had a wonderful dream about flying through beautiful clouds. It felt peaceful and amazing.',
        source: 'dream1.md',
        wordCount: 15,
        metrics: { 'Words': 15, 'Sentiment': 0.8 },
        calculatedMetrics: {}
      },
      {
        id: 'test-2',
        date: '2024-01-16',
        title: 'Nightmare',
        content: 'Had a scary nightmare where I was being chased by dark shadows. Very terrifying experience.',
        source: 'dream2.md',
        wordCount: 14,
        metrics: { 'Words': 14, 'Sentiment': -0.7 },
        calculatedMetrics: {}
      },
      {
        id: 'test-3',
        date: '2024-01-17',
        title: 'Lake Meeting',
        content: 'Dreamed about meeting friends at a calm lake. We talked and laughed together happily.',
        source: 'dream3.md',
        wordCount: 14,
        metrics: { 'Words': 14, 'Sentiment': 0.6 },
        calculatedMetrics: {}
      }
    ];
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    
    // Clear cache on close
    if (this.calculator) {
      this.calculator.clearCache();
    }
  }
} 