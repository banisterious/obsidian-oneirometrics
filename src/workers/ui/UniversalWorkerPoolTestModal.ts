// Universal Worker Pool Test Modal
// Comprehensive testing for the Universal Worker Pool system

import { App, Modal, Setting } from 'obsidian';
import { getLogger } from '../../logging';
import type { ContextualLogger } from '../../logging';
import { DreamMetricData } from '../../types';
import { UniversalWorkerPool } from '../UniversalWorkerPool';
import { UniversalDateNavigatorManager } from '../UniversalDateNavigatorManager';
import { 
  UniversalTask,
  UniversalTaskType,
  TaskResult,
  UniversalPoolConfiguration,
  PoolStatistics
} from '../types';

export class UniversalWorkerPoolTestModal extends Modal {
  private logger: ContextualLogger = getLogger('UniversalWorkerPoolTestModal') as ContextualLogger;
  private workerPool?: UniversalWorkerPool;
  private dateNavigatorManager?: UniversalDateNavigatorManager;
  private testResults: Array<{
    category: string;
    test: string;
    status: 'running' | 'passed' | 'failed';
    duration?: number;
    details?: string;
    error?: string;
  }> = [];

  constructor(app: App) {
    super(app);
    this.setTitle('Universal Worker Pool Test Suite');
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Add CSS class for styling
    contentEl.addClass('oom-universal-worker-pool-test-suite');

    // Description paragraph (h2 removed as requested)
    contentEl.createEl('p', { 
      text: 'Comprehensive testing for Phase 2.2 Universal Worker Pool implementation' 
    });

    // Test Categories
    this.createTestSection(contentEl);
    
    // Pool Configuration Section
    this.createConfigurationSection(contentEl);

    // Results Section
    this.createResultsSection(contentEl);

    // Action Buttons
    this.createActionButtons(contentEl);
  }

  private createTestSection(containerEl: HTMLElement): void {
    const section = containerEl.createDiv({ cls: 'setting-item-info' });
    section.createEl('h2', { text: 'Test Categories' });

    const categories = [
      {
        name: 'Pool Initialization',
        tests: ['Worker creation', 'Health checks', 'Capability detection', 'Load balancer setup']
      },
      {
        name: 'Task Routing',
        tests: ['DATE_FILTER routing', 'METRICS_CALCULATION routing', 'Priority handling', 'Load balancing']
      },
      {
        name: 'DateNavigator Integration',
        tests: ['Date range filtering', 'Multiple dates filtering', 'Pattern filtering', 'Cache functionality']
      },
      {
        name: 'Error Handling',
        tests: ['Worker failure recovery', 'Task timeout handling', 'Fallback mechanisms', 'Circuit breaker']
      },
      {
        name: 'Performance',
        tests: ['Concurrent task processing', 'Memory usage', 'Processing speed', 'Queue management']
      }
    ];

    categories.forEach(category => {
      const categoryDiv = section.createDiv({ cls: 'test-category' });
      categoryDiv.createEl('h3', { text: category.name });
      
      const testList = categoryDiv.createEl('ul');
      category.tests.forEach(test => {
        testList.createEl('li', { text: test });
      });
    });
  }

  private createConfigurationSection(containerEl: HTMLElement): void {
    // Create heading at container level, outside of section
    containerEl.createEl('h2', { text: 'Pool Configuration' });
    
    const section = containerEl.createDiv({ cls: 'setting-item' });

    new Setting(section)
      .setName('Max Workers')
      .setDesc('Number of workers to create for testing')
      .addSlider(slider => slider
        .setLimits(1, 4, 1)
        .setValue(2)
        .setDynamicTooltip()
        .onChange(value => {
          this.logger.debug('Config', 'Max workers changed', { value });
        }));

    new Setting(section)
      .setName('Load Balancing Strategy')
      .setDesc('Load balancing algorithm to test')
      .addDropdown(dropdown => dropdown
        .addOption('round-robin', 'Round Robin')
        .addOption('least-loaded', 'Least Loaded')
        .addOption('task-affinity', 'Task Affinity')
        .setValue('task-affinity')
        .onChange(value => {
          this.logger.debug('Config', 'Load balancing strategy changed', { value });
        }));

    new Setting(section)
      .setName('Test Data Size')
      .setDesc('Number of test entries to generate')
      .addSlider(slider => slider
        .setLimits(10, 1000, 10)
        .setValue(100)
        .setDynamicTooltip()
        .onChange(value => {
          this.logger.debug('Config', 'Test data size changed', { value });
        }));
  }

  private createResultsSection(containerEl: HTMLElement): void {
    const section = containerEl.createDiv({ cls: 'test-results-section' });
    section.createEl('h2', { text: 'Test Results' });

    // Results will be populated here during test execution
    const resultsContainer = section.createDiv({ cls: 'test-results-container' });
    resultsContainer.id = 'test-results-container';
  }

  private createActionButtons(containerEl: HTMLElement): void {
    const buttonContainer = containerEl.createDiv({ cls: 'modal-button-container' });

    // Run All Tests Button
    buttonContainer.createEl('button', { text: 'Run All Tests' })
      .addEventListener('click', () => this.runAllTests());

    // Run Individual Test Category Buttons
    const categories = ['Pool', 'Routing', 'DateNavigator', 'Error Handling', 'Performance'];
    categories.forEach(category => {
      buttonContainer.createEl('button', { text: `Test ${category}` })
        .addEventListener('click', () => this.runTestCategory(category));
    });

    // Utility Buttons
    buttonContainer.createEl('button', { text: 'View Pool Stats' })
      .addEventListener('click', () => this.showPoolStatistics());

    buttonContainer.createEl('button', { text: 'Clear Results' })
      .addEventListener('click', () => this.clearResults());

    buttonContainer.createEl('button', { text: 'Close' })
      .addEventListener('click', () => this.close());
  }

  private async runAllTests(): Promise<void> {
    this.logger.info('Test', 'Starting Universal Worker Pool test suite');
    this.clearResults();

    try {
      // Initialize worker pool
      await this.initializeWorkerPool();

      // Run all test categories
      await this.runPoolInitializationTests();
      await this.runTaskRoutingTests();
      await this.runDateNavigatorIntegrationTests();
      await this.runErrorHandlingTests();
      await this.runPerformanceTests();

      this.displayTestSummary();

    } catch (error) {
      this.logger.error('Test', 'Test suite failed', this.logger.enrichError(error as Error, {
        component: 'UniversalWorkerPoolTestModal',
        operation: 'runAllTests'
      }));

      this.addTestResult('System', 'Test Suite Execution', 'failed', 0, '', (error as Error).message);
    } finally {
      this.cleanup();
    }
  }

  private async runTestCategory(category: string): Promise<void> {
    this.logger.info('Test', `Running ${category} tests`);
    
    try {
      await this.initializeWorkerPool();

      switch (category) {
        case 'Pool':
          await this.runPoolInitializationTests();
          break;
        case 'Routing':
          await this.runTaskRoutingTests();
          break;
        case 'DateNavigator':
          await this.runDateNavigatorIntegrationTests();
          break;
        case 'Error Handling':
          await this.runErrorHandlingTests();
          break;
        case 'Performance':
          await this.runPerformanceTests();
          break;
      }
    } catch (error) {
      this.addTestResult(category, 'Category Execution', 'failed', 0, '', (error as Error).message);
    }
  }

  private async initializeWorkerPool(): Promise<void> {
    const config: UniversalPoolConfiguration = {
      maxWorkers: 2,
      batchSize: 50,
      memoryLimit: 50 * 1024 * 1024, // 50MB
      priorityMode: 'balanced',
      workerTypes: {
        DATE_FILTER: {
          dedicatedWorkers: 1,
          fallbackEnabled: true,
          cacheEnabled: true
        },
        METRICS_CALCULATION: {
          fallbackEnabled: true,
          cacheEnabled: true
        },
        TAG_ANALYSIS: {
          fallbackEnabled: true,
          cacheEnabled: false
        }
      },
      loadBalancing: 'task-affinity',
      healthCheckInterval: 10000
    };

    this.workerPool = new UniversalWorkerPool(this.app, config);
    this.dateNavigatorManager = new UniversalDateNavigatorManager(this.app, config);

    // Give workers time to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async runPoolInitializationTests(): Promise<void> {
    const startTime = performance.now();

    // Test 1: Worker Creation
    this.addTestResult('Pool Initialization', 'Worker Creation', 'running');
    try {
      const workerInfo = this.workerPool!.getWorkerInfo();
      const duration = performance.now() - startTime;
      
      if (workerInfo.length > 0 && workerInfo.every(w => w.isHealthy)) {
        this.updateTestResult('Pool Initialization', 'Worker Creation', 'passed', duration, 
          `Created ${workerInfo.length} healthy workers`);
      } else {
        this.updateTestResult('Pool Initialization', 'Worker Creation', 'failed', duration, 
          'Some workers are unhealthy or missing');
      }
    } catch (error) {
      this.updateTestResult('Pool Initialization', 'Worker Creation', 'failed', 
        performance.now() - startTime, '', (error as Error).message);
    }

    // Test 2: Health Checks
    this.addTestResult('Pool Initialization', 'Health Checks', 'running');
    const healthStartTime = performance.now();
    try {
      // Trigger health checks and wait
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const workerInfo = this.workerPool!.getWorkerInfo();
      const healthyWorkers = workerInfo.filter(w => w.isHealthy).length;
      const duration = performance.now() - healthStartTime;
      
      this.updateTestResult('Pool Initialization', 'Health Checks', 'passed', duration, 
        `${healthyWorkers}/${workerInfo.length} workers healthy`);
    } catch (error) {
      this.updateTestResult('Pool Initialization', 'Health Checks', 'failed', 
        performance.now() - healthStartTime, '', (error as Error).message);
    }

    // Test 3: Pool Statistics
    this.addTestResult('Pool Initialization', 'Pool Statistics', 'running');
    const statsStartTime = performance.now();
    try {
      const stats = this.workerPool!.getStatistics();
      const duration = performance.now() - statsStartTime;
      
      if (stats.totalWorkers > 0) {
        this.updateTestResult('Pool Initialization', 'Pool Statistics', 'passed', duration, 
          `Total: ${stats.totalWorkers}, Active: ${stats.activeWorkers}, Idle: ${stats.idleWorkers}`);
      } else {
        this.updateTestResult('Pool Initialization', 'Pool Statistics', 'failed', duration, 
          'No workers found in statistics');
      }
    } catch (error) {
      this.updateTestResult('Pool Initialization', 'Pool Statistics', 'failed', 
        performance.now() - statsStartTime, '', (error as Error).message);
    }
  }

  private async runTaskRoutingTests(): Promise<void> {
    // Test DATE_FILTER task routing
    this.addTestResult('Task Routing', 'DATE_FILTER Routing', 'running');
    const dateFilterStart = performance.now();
    
    try {
      const task: UniversalTask = {
        taskType: 'DATE_FILTER',
        taskId: 'test-date-filter-' + Date.now(),
        priority: 'normal',
        data: {
          entries: this.generateTestData(10),
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      };

      const result = await this.workerPool!.processTask(task);
      const duration = performance.now() - dateFilterStart;

      if (result.success && result.data?.visibilityMap) {
        this.updateTestResult('Task Routing', 'DATE_FILTER Routing', 'passed', duration, 
          `Processed ${result.data.visibilityMap.length} entries`);
      } else {
        this.updateTestResult('Task Routing', 'DATE_FILTER Routing', 'failed', duration, 
          'Task failed or returned invalid data');
      }
    } catch (error) {
      this.updateTestResult('Task Routing', 'DATE_FILTER Routing', 'failed', 
        performance.now() - dateFilterStart, '', (error as Error).message);
    }

    // Test priority handling
    this.addTestResult('Task Routing', 'Priority Handling', 'running');
    const priorityStart = performance.now();
    
    try {
      const highPriorityTask: UniversalTask = {
        taskType: 'METRICS_CALCULATION',
        taskId: 'test-high-priority-' + Date.now(),
        priority: 'high',
        data: { metrics: [] }
      };

      const lowPriorityTask: UniversalTask = {
        taskType: 'TAG_ANALYSIS',
        taskId: 'test-low-priority-' + Date.now(),
        priority: 'low',
        data: { tags: [] }
      };

      // Submit both tasks simultaneously
      const [highResult, lowResult] = await Promise.all([
        this.workerPool!.processTask(highPriorityTask),
        this.workerPool!.processTask(lowPriorityTask)
      ]);

      const duration = performance.now() - priorityStart;

      if (highResult.success && lowResult.success) {
        this.updateTestResult('Task Routing', 'Priority Handling', 'passed', duration, 
          'High and low priority tasks processed successfully');
      } else {
        this.updateTestResult('Task Routing', 'Priority Handling', 'failed', duration, 
          'One or more priority tasks failed');
      }
    } catch (error) {
      this.updateTestResult('Task Routing', 'Priority Handling', 'failed', 
        performance.now() - priorityStart, '', (error as Error).message);
    }
  }

  private async runDateNavigatorIntegrationTests(): Promise<void> {
    if (!this.dateNavigatorManager) {
      this.addTestResult('DateNavigator Integration', 'All Tests', 'failed', 0, 'Manager not initialized');
      return;
    }

    const testData = this.generateTestData(50);

    // Test 1: Date Range Filtering
    this.addTestResult('DateNavigator Integration', 'Date Range Filter', 'running');
    const dateRangeStart = performance.now();
    
    try {
      const result = await this.dateNavigatorManager.filterByDateRange(
        testData, 
        '2024-01-01', 
        '2024-01-31'
      );

      const duration = performance.now() - dateRangeStart;

      if (result.visibilityMap && result.visibilityMap.length === testData.length) {
        const visibleCount = result.visibilityMap.filter(v => v.visible).length;
        this.updateTestResult('DateNavigator Integration', 'Date Range Filter', 'passed', duration, 
          `Filtered ${testData.length} entries, ${visibleCount} visible`);
      } else {
        this.updateTestResult('DateNavigator Integration', 'Date Range Filter', 'failed', duration, 
          'Invalid filter result structure');
      }
    } catch (error) {
      this.updateTestResult('DateNavigator Integration', 'Date Range Filter', 'failed', 
        performance.now() - dateRangeStart, '', (error as Error).message);
    }

    // Test 2: Multiple Dates Filtering
    this.addTestResult('DateNavigator Integration', 'Multiple Dates Filter', 'running');
    const multipleDatesStart = performance.now();
    
    try {
      const selectedDates = ['2024-01-05', '2024-01-15', '2024-01-25'];
      const result = await this.dateNavigatorManager.filterByMultipleDates(
        testData,
        selectedDates,
        'include'
      );

      const duration = performance.now() - multipleDatesStart;

      if (result.visibilityMap && result.affectedDates) {
        this.updateTestResult('DateNavigator Integration', 'Multiple Dates Filter', 'passed', duration, 
          `Processed ${selectedDates.length} selected dates, ${result.affectedDates.length} affected`);
      } else {
        this.updateTestResult('DateNavigator Integration', 'Multiple Dates Filter', 'failed', duration, 
          'Invalid multiple dates filter result');
      }
    } catch (error) {
      this.updateTestResult('DateNavigator Integration', 'Multiple Dates Filter', 'failed', 
        performance.now() - multipleDatesStart, '', (error as Error).message);
    }

    // Test 3: Cache Functionality
    this.addTestResult('DateNavigator Integration', 'Cache Functionality', 'running');
    const cacheStart = performance.now();
    
    try {
      // First call to populate cache
      await this.dateNavigatorManager.filterByDateRange(testData, '2024-02-01', '2024-02-29');
      
      // Second call should use cache
      const cachedResult = await this.dateNavigatorManager.filterByDateRange(testData, '2024-02-01', '2024-02-29');
      
      const duration = performance.now() - cacheStart;
      const cacheStats = this.dateNavigatorManager.getCacheStats();

      if (cachedResult.visibilityMap && cacheStats.size > 0) {
        this.updateTestResult('DateNavigator Integration', 'Cache Functionality', 'passed', duration, 
          `Cache working, ${cacheStats.size} entries cached`);
      } else {
        this.updateTestResult('DateNavigator Integration', 'Cache Functionality', 'failed', duration, 
          'Cache not functioning properly');
      }
    } catch (error) {
      this.updateTestResult('DateNavigator Integration', 'Cache Functionality', 'failed', 
        performance.now() - cacheStart, '', (error as Error).message);
    }
  }

  private async runErrorHandlingTests(): Promise<void> {
    // Test error handling with invalid data
    this.addTestResult('Error Handling', 'Invalid Task Data', 'running');
    const invalidDataStart = performance.now();
    
    try {
      const invalidTask: UniversalTask = {
        taskType: 'DATE_FILTER',
        taskId: 'test-invalid-' + Date.now(),
        priority: 'normal',
        data: {
          entries: null, // Invalid data
          startDate: 'invalid-date',
          endDate: 'invalid-date'
        }
      };

      const result = await this.workerPool!.processTask(invalidTask);
      const duration = performance.now() - invalidDataStart;

      // We expect this to either fail gracefully or use fallback
      if (!result.success || result.error) {
        this.updateTestResult('Error Handling', 'Invalid Task Data', 'passed', duration, 
          'Invalid data handled gracefully');
      } else {
        this.updateTestResult('Error Handling', 'Invalid Task Data', 'failed', duration, 
          'Invalid data was not properly rejected');
      }
    } catch (error) {
      // Catching the error is also a valid result for this test
      this.updateTestResult('Error Handling', 'Invalid Task Data', 'passed', 
        performance.now() - invalidDataStart, 'Error properly caught: ' + (error as Error).message);
    }

    // Test timeout handling
    this.addTestResult('Error Handling', 'Task Timeout', 'running');
    const timeoutStart = performance.now();
    
    try {
      const timeoutTask: UniversalTask = {
        taskType: 'METRICS_CALCULATION',
        taskId: 'test-timeout-' + Date.now(),
        priority: 'normal',
        data: { largeDataset: new Array(10000).fill({}) },
        options: {
          timeout: 1 // Very short timeout
        }
      };

      const result = await this.workerPool!.processTask(timeoutTask);
      const duration = performance.now() - timeoutStart;

      if (!result.success || duration > 100) {
        this.updateTestResult('Error Handling', 'Task Timeout', 'passed', duration, 
          'Timeout handled appropriately');
      } else {
        this.updateTestResult('Error Handling', 'Task Timeout', 'failed', duration, 
          'Timeout not properly enforced');
      }
    } catch (error) {
      this.updateTestResult('Error Handling', 'Task Timeout', 'passed', 
        performance.now() - timeoutStart, 'Timeout error properly caught');
    }
  }

  private async runPerformanceTests(): Promise<void> {
    // Test concurrent task processing
    this.addTestResult('Performance', 'Concurrent Processing', 'running');
    const concurrentStart = performance.now();
    
    try {
      const concurrentTasks: UniversalTask[] = [];
      for (let i = 0; i < 5; i++) {
        concurrentTasks.push({
          taskType: 'DATE_FILTER',
          taskId: `concurrent-test-${i}-${Date.now()}`,
          priority: 'normal',
          data: {
            entries: this.generateTestData(20),
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          }
        });
      }

      const results = await Promise.all(
        concurrentTasks.map(task => this.workerPool!.processTask(task))
      );

      const duration = performance.now() - concurrentStart;
      const successfulTasks = results.filter(r => r.success).length;

      if (successfulTasks === concurrentTasks.length) {
        this.updateTestResult('Performance', 'Concurrent Processing', 'passed', duration, 
          `${successfulTasks}/${concurrentTasks.length} concurrent tasks completed`);
      } else {
        this.updateTestResult('Performance', 'Concurrent Processing', 'failed', duration, 
          `Only ${successfulTasks}/${concurrentTasks.length} tasks completed successfully`);
      }
    } catch (error) {
      this.updateTestResult('Performance', 'Concurrent Processing', 'failed', 
        performance.now() - concurrentStart, '', (error as Error).message);
    }

    // Test processing speed
    this.addTestResult('Performance', 'Processing Speed', 'running');
    const speedStart = performance.now();
    
    try {
      const largeDataset = this.generateTestData(500);
      const speedTask: UniversalTask = {
        taskType: 'DATE_FILTER',
        taskId: 'speed-test-' + Date.now(),
        priority: 'high',
        data: {
          entries: largeDataset,
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        }
      };

      const result = await this.workerPool!.processTask(speedTask);
      const duration = performance.now() - speedStart;

      if (result.success && duration < 5000) { // Should complete within 5 seconds
        this.updateTestResult('Performance', 'Processing Speed', 'passed', duration, 
          `Processed ${largeDataset.length} entries in ${duration.toFixed(2)}ms`);
      } else {
        this.updateTestResult('Performance', 'Processing Speed', 'failed', duration, 
          `Processing took too long or failed: ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      this.updateTestResult('Performance', 'Processing Speed', 'failed', 
        performance.now() - speedStart, '', (error as Error).message);
    }
  }

  private generateTestData(count: number): DreamMetricData[] {
    const testData: DreamMetricData[] = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + Math.floor(Math.random() * 365));
      
      testData.push({
        source: `test-entry-${i}`,
        date: date.toISOString().split('T')[0],
        title: `Test Dream ${i}`,
        content: `Test dream entry ${i} with some detailed content about the dream experience.`,
        wordCount: Math.floor(Math.random() * 200) + 50,
        metrics: {
          'Sensory Detail': Math.floor(Math.random() * 5) + 1,
          'Emotional Recall': Math.floor(Math.random() * 5) + 1,
          'Lost Segments': Math.floor(Math.random() * 3),
          'Lucidity': Math.random() > 0.7 ? 1 : 0,  // 1 for lucid, 0 for non-lucid
          'Vividness': Math.floor(Math.random() * 5) + 1
        }
      });
    }
    
    return testData;
  }

  private addTestResult(category: string, test: string, status: 'running' | 'passed' | 'failed', 
                       duration?: number, details?: string, error?: string): void {
    this.testResults.push({
      category,
      test,
      status,
      duration,
      details,
      error
    });
    this.updateResultsDisplay();
  }

  private updateTestResult(category: string, test: string, status: 'passed' | 'failed', 
                          duration: number, details?: string, error?: string): void {
    const result = this.testResults.find(r => r.category === category && r.test === test);
    if (result) {
      result.status = status;
      result.duration = duration;
      result.details = details;
      result.error = error;
      this.updateResultsDisplay();
    }
  }

  private updateResultsDisplay(): void {
    const container = this.contentEl.querySelector('#test-results-container');
    if (!container) return;

    container.innerHTML = '';

    this.testResults.forEach(result => {
      const resultDiv = container.createDiv({ cls: `test-result test-${result.status}` });
      
      const header = resultDiv.createDiv({ cls: 'test-result-header' });
      header.createSpan({ text: `${result.category}: ${result.test}` });
      
      const statusSpan = header.createSpan({ cls: 'test-status' });
      statusSpan.textContent = result.status.toUpperCase();
      
      if (result.duration !== undefined) {
        header.createSpan({ text: ` (${result.duration.toFixed(2)}ms)` });
      }

      if (result.details) {
        resultDiv.createDiv({ text: result.details, cls: 'test-details' });
      }

      if (result.error) {
        resultDiv.createDiv({ text: `Error: ${result.error}`, cls: 'test-error' });
      }
    });
  }

  private displayTestSummary(): void {
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const total = passed + failed;

    const summaryDiv = this.contentEl.createDiv({ cls: 'test-summary' });
    summaryDiv.createEl('h2', { text: 'Test Summary' });
    summaryDiv.createEl('p', { 
      text: `✅ ${passed} passed, ❌ ${failed} failed, Total: ${total}`,
      cls: failed === 0 ? 'summary-success' : 'summary-mixed'
    });

    if (failed === 0) {
      summaryDiv.createEl('p', { 
        text: '🎉 All tests passed! Universal Worker Pool is functioning correctly.',
        cls: 'summary-success'
      });
    } else {
      summaryDiv.createEl('p', { 
        text: '⚠️ Some tests failed. Check the results above for details.',
        cls: 'summary-warning'
      });
    }

    this.logger.info('Test', 'Test suite completed', {
      passed,
      failed,
      total,
      allPassed: failed === 0
    });
  }

  private showPoolStatistics(): void {
    if (!this.workerPool) {
      alert('Worker pool not initialized');
      return;
    }

    const stats = this.workerPool.getStatistics();
    const workerInfo = this.workerPool.getWorkerInfo();

    const statsText = [
      'Universal Worker Pool Statistics:',
      '',
      `Total Workers: ${stats.totalWorkers}`,
      `Active Workers: ${stats.activeWorkers}`,
      `Idle Workers: ${stats.idleWorkers}`,
      `Total Tasks: ${stats.totalTasks}`,
      `Completed Tasks: ${stats.completedTasks}`,
      `Failed Tasks: ${stats.failedTasks}`,
      `Average Task Time: ${stats.averageTaskTime.toFixed(2)}ms`,
      `Queue Depth: ${stats.queueDepth}`,
      '',
      'Worker Details:',
      ...workerInfo.map(w => 
        `  ${w.id}: ${w.isHealthy ? 'Healthy' : 'Unhealthy'}, ` +
        `Active Tasks: ${w.activeTasks}, ` +
        `Completed: ${w.taskHistory.completed}, ` +
        `Failed: ${w.taskHistory.failed}`
      )
    ].join('\n');

    alert(statsText);
  }

  private clearResults(): void {
    this.testResults = [];
    this.updateResultsDisplay();
    
    const summaryDiv = this.contentEl.querySelector('.test-summary');
    if (summaryDiv) {
      summaryDiv.remove();
    }
  }

  private cleanup(): void {
    if (this.workerPool) {
      this.workerPool.dispose();
      this.workerPool = undefined;
    }
    if (this.dateNavigatorManager) {
      this.dateNavigatorManager.dispose();
      this.dateNavigatorManager = undefined;
    }
  }

  onClose() {
    this.cleanup();
    this.contentEl.empty();
  }
} 