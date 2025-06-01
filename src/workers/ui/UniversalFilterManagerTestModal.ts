/**
 * Universal Filter Manager Test Modal
 * 
 * Comprehensive testing interface for Phase 2.3 FilterManager integration
 * with the Universal Worker Pool system
 */

import { App, Modal, Setting } from 'obsidian';
import { ILogger } from '../../logging/LoggerTypes';
import { UniversalFilterManager } from '../UniversalFilterManager';
import { FilterEntry, FilterCriteria, FilterResult } from '../types';

interface TestResult {
    testName: string;
    status: 'passed' | 'failed' | 'running';
    executionTime: number;
    message: string;
    details?: any;
}

export class UniversalFilterManagerTestModal extends Modal {
    private filterManager: UniversalFilterManager;
    private testResults: TestResult[] = [];
    private isRunning = false;

    // Test configuration
    private testDataSize = 1000;
    private testSearchTerm = 'dream';
    private testDateRange = {
        start: '2024-01-01',
        end: '2024-12-31'
    };

    constructor(
        app: App,
        private logger?: ILogger
    ) {
        super(app);
        this.filterManager = new UniversalFilterManager(
            app,
            {} as any, // Settings placeholder
            async () => {}, // Save settings placeholder
            async () => {}, // Save data placeholder
            logger
        );
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-universal-filter-test-suite');

        contentEl.createEl('p', { 
            text: 'Comprehensive testing for Phase 2.3 Universal Filter Manager integration' 
        });

        this.createConfigurationSection(contentEl);
        this.createTestSection(contentEl);
        this.createControlsSection(contentEl);
        this.createResultsSection(contentEl);
    }

    private createConfigurationSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Test Configuration' });

        const section = containerEl.createDiv({ cls: 'setting-item' });

        new Setting(section)
            .setName('Test Data Size')
            .setDesc('Number of test entries to generate')
            .addSlider(slider => slider
                .setLimits(100, 10000, 100)
                .setValue(this.testDataSize)
                .setDynamicTooltip()
                .onChange(value => {
                    this.testDataSize = value;
                }));

        new Setting(section)
            .setName('Search Term')
            .setDesc('Term to use for content filtering tests')
            .addText(text => text
                .setValue(this.testSearchTerm)
                .onChange(value => {
                    this.testSearchTerm = value;
                }));

        new Setting(section)
            .setName('Date Range Start')
            .setDesc('Start date for date filtering tests')
            .addText(text => text
                .setValue(this.testDateRange.start)
                .onChange(value => {
                    this.testDateRange.start = value;
                }));

        new Setting(section)
            .setName('Date Range End')
            .setDesc('End date for date filtering tests')
            .addText(text => text
                .setValue(this.testDateRange.end)
                .onChange(value => {
                    this.testDateRange.end = value;
                }));
    }

    private createTestSection(containerEl: HTMLElement): void {
        const section = containerEl.createDiv({ cls: 'setting-item-info' });
        section.createEl('h2', { text: 'Filter Test Categories' });

        const categories = [
            {
                name: 'Date Range Filtering',
                tests: ['Basic date range', 'Edge dates', 'Invalid dates', 'Performance with large datasets']
            },
            {
                name: 'Content Filtering',
                tests: ['Exact match', 'Partial match', 'Regex patterns', 'Case sensitivity']
            },
            {
                name: 'Metadata Filtering',
                tests: ['Tag filtering', 'Property filtering', 'Combined filters', 'Missing metadata']
            },
            {
                name: 'Complex Filtering',
                tests: ['AND conditions', 'OR conditions', 'Nested conditions', 'Performance optimization']
            },
            {
                name: 'Filter Validation',
                tests: ['Date validation', 'Regex validation', 'Criteria validation', 'Error handling']
            },
            {
                name: 'Performance & Caching',
                tests: ['Cache performance', 'Large dataset handling', 'Worker pool efficiency', 'Memory usage']
            }
        ];

        const categoriesContainer = section.createDiv({ cls: 'test-categories-grid' });

        categories.forEach(category => {
            const categoryDiv = categoriesContainer.createDiv({ cls: 'test-category' });
            categoryDiv.createEl('h3', { text: category.name });
            
            const testList = categoryDiv.createEl('ul', { cls: 'test-list' });
            category.tests.forEach(test => {
                testList.createEl('li', { text: test });
            });
        });
    }

    private createControlsSection(containerEl: HTMLElement): void {
        const section = containerEl.createDiv({ cls: 'test-controls' });
        
        const runAllButton = section.createEl('button', {
            text: 'Run All Tests',
            cls: 'mod-cta'
        });
        runAllButton.onclick = () => this.runAllTests();

        const runFilteringButton = section.createEl('button', {
            text: 'Test Date Range Filtering'
        });
        runFilteringButton.onclick = () => this.runDateRangeTests();

        const runContentButton = section.createEl('button', {
            text: 'Test Content Filtering'
        });
        runContentButton.onclick = () => this.runContentTests();

        const runMetadataButton = section.createEl('button', {
            text: 'Test Metadata Filtering'
        });
        runMetadataButton.onclick = () => this.runMetadataTests();

        const runValidationButton = section.createEl('button', {
            text: 'Test Filter Validation'
        });
        runValidationButton.onclick = () => this.runValidationTests();

        const runPerformanceButton = section.createEl('button', {
            text: 'Test Performance & Caching'
        });
        runPerformanceButton.onclick = () => this.runPerformanceTests();

        const clearButton = section.createEl('button', {
            text: 'Clear Results'
        });
        clearButton.onclick = () => this.clearResults();
    }

    private createResultsSection(containerEl: HTMLElement): void {
        const section = containerEl.createDiv({ cls: 'test-results-section' });
        section.createEl('h2', { text: 'Test Results' });

        const resultsContainer = section.createDiv({ cls: 'test-results-container' });
        resultsContainer.id = 'filter-test-results-container';
    }

    private async runAllTests(): Promise<void> {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.testResults = [];
        this.updateResults();

        try {
            await this.filterManager.initialize();
            
            await this.runDateRangeTests();
            await this.runContentTests();
            await this.runMetadataTests();
            await this.runValidationTests();
            await this.runPerformanceTests();

            this.displayTestSummary();
        } catch (error) {
            this.logger?.error('FilterTest', 'Test suite failed', error instanceof Error ? error : new Error(String(error)));
        } finally {
            this.isRunning = false;
        }
    }

    private async runDateRangeTests(): Promise<void> {
        const testData = this.generateTestData();

        // Test 1: Basic date range filtering
        await this.runTest('Basic Date Range Filter', async () => {
            const result = await this.filterManager.filterByDateRange(
                testData,
                this.testDateRange.start,
                this.testDateRange.end
            );
            
            if (result.total !== testData.length) {
                throw new Error(`Expected total ${testData.length}, got ${result.total}`);
            }
            
            return {
                total: result.total,
                matched: result.matched,
                executionTime: result.metadata?.executionTime || 0
            };
        });

        // Test 2: Edge case - same start and end date
        await this.runTest('Same Start/End Date', async () => {
            const singleDate = '2024-06-15';
            const result = await this.filterManager.filterByDateRange(
                testData,
                singleDate,
                singleDate
            );
            
            return {
                total: result.total,
                matched: result.matched,
                singleDateMatches: result.filtered.filter(e => e.date === singleDate).length
            };
        });

        // Test 3: Performance with large dataset
        await this.runTest('Large Dataset Performance', async () => {
            const largeData = this.generateTestData(5000);
            const startTime = performance.now();
            
            const result = await this.filterManager.filterByDateRange(
                largeData,
                this.testDateRange.start,
                this.testDateRange.end
            );
            
            const executionTime = performance.now() - startTime;
            
            if (executionTime > 1000) { // Should complete within 1 second
                throw new Error(`Performance test failed: ${executionTime}ms > 1000ms`);
            }
            
            return {
                dataSize: largeData.length,
                executionTime,
                throughput: Math.round(largeData.length / (executionTime / 1000))
            };
        });
    }

    private async runContentTests(): Promise<void> {
        const testData = this.generateTestData();

        // Test 1: Exact match
        await this.runTest('Content Exact Match', async () => {
            const result = await this.filterManager.filterByContent(
                testData,
                this.testSearchTerm,
                'exact'
            );
            
            const exactMatches = result.filtered.filter(e => e.content === this.testSearchTerm).length;
            
            return {
                total: result.total,
                matched: result.matched,
                exactMatches
            };
        });

        // Test 2: Partial match
        await this.runTest('Content Partial Match', async () => {
            const result = await this.filterManager.filterByContent(
                testData,
                this.testSearchTerm,
                'partial'
            );
            
            return {
                total: result.total,
                matched: result.matched,
                partialMatches: result.filtered.filter(e => 
                    e.content?.toLowerCase().includes(this.testSearchTerm.toLowerCase())
                ).length
            };
        });

        // Test 3: Regex pattern
        await this.runTest('Content Regex Pattern', async () => {
            const pattern = '\\b\\w{5,}\\b'; // Words with 5+ characters
            const result = await this.filterManager.filterByContent(
                testData,
                pattern,
                'regex'
            );
            
            return {
                total: result.total,
                matched: result.matched,
                regexPattern: pattern
            };
        });
    }

    private async runMetadataTests(): Promise<void> {
        const testData = this.generateTestDataWithMetadata();

        // Test 1: Tag filtering
        await this.runTest('Metadata Tag Filtering', async () => {
            const result = await this.filterManager.filterByMetadata(
                testData,
                ['important', 'work'],
                undefined
            );
            
            return {
                total: result.total,
                matched: result.matched,
                tagsUsed: ['important', 'work']
            };
        });

        // Test 2: Property filtering
        await this.runTest('Metadata Property Filtering', async () => {
            const result = await this.filterManager.filterByMetadata(
                testData,
                undefined,
                { category: 'journal', priority: 'high' }
            );
            
            return {
                total: result.total,
                matched: result.matched,
                propertiesUsed: { category: 'journal', priority: 'high' }
            };
        });
    }

    private async runValidationTests(): Promise<void> {
        // Test 1: Valid criteria
        await this.runTest('Valid Criteria Validation', async () => {
            const criteria: FilterCriteria = {
                dateRange: {
                    start: this.testDateRange.start,
                    end: this.testDateRange.end
                },
                searchTerm: this.testSearchTerm,
                searchMode: 'partial'
            };
            
            const result = await this.filterManager.validateFilter(criteria);
            
            if (!result.valid) {
                throw new Error(`Expected valid criteria, got errors: ${result.errors.join(', ')}`);
            }
            
            return {
                valid: result.valid,
                errors: result.errors
            };
        });

        // Test 2: Invalid date range
        await this.runTest('Invalid Date Range Validation', async () => {
            const criteria: FilterCriteria = {
                dateRange: {
                    start: '2024-12-31',
                    end: '2024-01-01' // End before start
                }
            };
            
            const result = await this.filterManager.validateFilter(criteria);
            
            return {
                valid: result.valid,
                errors: result.errors,
                expectedInvalid: true
            };
        });
    }

    private async runPerformanceTests(): Promise<void> {
        // Test 1: Cache performance
        await this.runTest('Cache Performance', async () => {
            const testData = this.generateTestData();
            
            // First call - no cache
            const start1 = performance.now();
            const result1 = await this.filterManager.filterByDateRange(
                testData,
                this.testDateRange.start,
                this.testDateRange.end,
                { enableCache: true, cacheKey: 'perf-test' }
            );
            const time1 = performance.now() - start1;
            
            // Second call - should hit cache
            const start2 = performance.now();
            const result2 = await this.filterManager.filterByDateRange(
                testData,
                this.testDateRange.start,
                this.testDateRange.end,
                { enableCache: true, cacheKey: 'perf-test' }
            );
            const time2 = performance.now() - start2;
            
            const cacheSpeedup = time1 / time2;
            
            return {
                firstCallTime: time1,
                secondCallTime: time2,
                cacheSpeedup: Math.round(cacheSpeedup * 100) / 100,
                cacheEffective: cacheSpeedup > 2 // Should be at least 2x faster
            };
        });

        // Test 2: Worker pool statistics
        await this.runTest('Worker Pool Statistics', async () => {
            const stats = this.filterManager.getPoolStatistics();
            const workers = this.filterManager.getWorkerInformation();
            
            return {
                totalWorkers: stats.totalWorkers,
                activeWorkers: stats.activeWorkers,
                completedTasks: stats.completedTasks,
                averageTaskTime: stats.averageTaskTime,
                workerDetails: workers.length
            };
        });
    }

    private async runTest(name: string, testFunction: () => Promise<any>): Promise<void> {
        const startTime = performance.now();
        
        this.testResults.push({
            testName: name,
            status: 'running',
            executionTime: 0,
            message: 'Running...'
        });
        this.updateResults();

        try {
            const result = await testFunction();
            const executionTime = performance.now() - startTime;
            
            this.testResults[this.testResults.length - 1] = {
                testName: name,
                status: 'passed',
                executionTime,
                message: 'Test passed successfully',
                details: result
            };
        } catch (error) {
            const executionTime = performance.now() - startTime;
            
            this.testResults[this.testResults.length - 1] = {
                testName: name,
                status: 'failed',
                executionTime,
                message: error instanceof Error ? error.message : String(error)
            };
        }
        
        this.updateResults();
        
        // Small delay to show running status
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    private generateTestData(count?: number): FilterEntry[] {
        const size = count || this.testDataSize;
        const entries: FilterEntry[] = [];
        
        const startDate = new Date(this.testDateRange.start);
        const endDate = new Date(this.testDateRange.end);
        const dateRange = endDate.getTime() - startDate.getTime();
        
        for (let i = 0; i < size; i++) {
            const randomTime = startDate.getTime() + Math.random() * dateRange;
            const date = new Date(randomTime);
            
            entries.push({
                id: `entry_${i}`,
                date: date.toISOString().split('T')[0],
                content: `Test entry ${i} with ${this.testSearchTerm} content and more text`,
                metadata: {
                    index: i,
                    random: Math.random()
                }
            });
        }
        
        return entries;
    }

    private generateTestDataWithMetadata(count?: number): FilterEntry[] {
        const entries = this.generateTestData(count);
        
        const tags = ['important', 'work', 'personal', 'project', 'meeting'];
        const categories = ['journal', 'task', 'note', 'reminder'];
        const priorities = ['high', 'medium', 'low'];
        
        return entries.map((entry, index) => ({
            ...entry,
            metadata: {
                ...entry.metadata,
                tags: [tags[Math.floor(Math.random() * tags.length)]],
                category: categories[Math.floor(Math.random() * categories.length)],
                priority: priorities[Math.floor(Math.random() * priorities.length)]
            }
        }));
    }

    private updateResults(): void {
        const container = document.getElementById('filter-test-results-container');
        if (!container) return;

        container.empty();

        this.testResults.forEach(result => {
            const resultDiv = container.createDiv({ cls: 'test-result' });
            resultDiv.addClass(`test-result--${result.status}`);

            const header = resultDiv.createDiv({ cls: 'test-result-header' });
            header.createSpan({ text: result.testName, cls: 'test-name' });
            header.createSpan({ text: `${Math.round(result.executionTime)}ms`, cls: 'test-time' });
            
            const statusIcon = result.status === 'passed' ? '✅' : 
                              result.status === 'failed' ? '❌' : '⏳';
            header.createSpan({ text: statusIcon, cls: 'test-status' });

            const message = resultDiv.createDiv({ cls: 'test-message' });
            message.textContent = result.message;

            if (result.details && result.status === 'passed') {
                const details = resultDiv.createDiv({ cls: 'test-details' });
                details.createEl('pre', { text: JSON.stringify(result.details, null, 2) });
            }
        });
    }

    private displayTestSummary(): void {
        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;
        const total = passed + failed;

        const summaryDiv = this.contentEl.createDiv({ cls: 'test-summary' });
        summaryDiv.createEl('h2', { text: 'Filter Test Summary' });
        summaryDiv.createEl('p', { 
            text: `✅ ${passed} passed, ❌ ${failed} failed, Total: ${total}`,
            cls: failed === 0 ? 'summary-success' : 'summary-mixed'
        });

        // Pool statistics
        const stats = this.filterManager.getPoolStatistics();
        const statsDiv = summaryDiv.createDiv({ cls: 'pool-stats' });
        statsDiv.createEl('h3', { text: 'Worker Pool Statistics' });
        statsDiv.createEl('p', { text: `Workers: ${stats.totalWorkers}, Tasks: ${stats.completedTasks}` });
        statsDiv.createEl('p', { text: `Average Task Time: ${Math.round(stats.averageTaskTime)}ms` });
    }

    private clearResults(): void {
        this.testResults = [];
        this.updateResults();
        
        // Clear summary if it exists
        const summary = this.contentEl.querySelector('.test-summary');
        if (summary) {
            summary.remove();
        }
    }

    onClose() {
        this.filterManager.cleanup();
    }
} 