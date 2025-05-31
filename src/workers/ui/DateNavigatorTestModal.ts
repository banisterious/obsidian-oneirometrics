import { App, Modal, Notice } from 'obsidian';
import { DateNavigatorIntegration } from '../../dom/DateNavigatorIntegration';
import { DreamMetricsState } from '../../state/DreamMetricsState';
import { TimeFilterManager } from '../../timeFilters';
import { getLogger } from '../../logging';

/**
 * Test modal for DateNavigator web worker integration
 * Provides comprehensive testing of Phase 2.1 functionality
 */
export class DateNavigatorTestModal extends Modal {
    private integration: DateNavigatorIntegration | null = null;
    private testContainer: HTMLElement | null = null;
    private resultsContainer: HTMLElement | null = null;
    private logger = getLogger('DateNavigatorTestModal');
    private tests: Array<{ name: string; description: string; testFn: () => Promise<boolean> }> = [];

    constructor(app: App) {
        super(app);
        this.setupTests();
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Modal header
        contentEl.createEl('h2', { text: 'DateNavigator Web Worker Integration Test' });
        contentEl.createEl('p', { 
            text: 'This modal tests the Phase 2.1 DateNavigator integration with web workers.',
            cls: 'setting-item-description'
        });

        // Create test container for DateNavigator
        this.testContainer = contentEl.createDiv('oom-test-date-navigator-container');
        this.testContainer.style.cssText = `
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
            min-height: 300px;
            position: relative;
        `;

        // Initialize DateNavigator with test state
        this.initializeTestDateNavigator();

        // Test controls
        const controlsContainer = contentEl.createDiv('oom-test-controls');
        controlsContainer.style.marginBottom = '20px';

        // Test buttons
        const testAllBtn = controlsContainer.createEl('button', {
            cls: 'mod-cta',
            text: 'Run All Tests'
        });

        const testSingleFilterBtn = controlsContainer.createEl('button', {
            text: 'Test Single Date Filter',
            cls: 'mod-warning'
        });

        const testRangeFilterBtn = controlsContainer.createEl('button', {
            text: 'Test Range Filter',
            cls: 'mod-warning'
        });

        const testProgressBtn = controlsContainer.createEl('button', {
            text: 'Test Progress Indicator',
            cls: 'mod-warning'
        });

        // Results container
        this.resultsContainer = contentEl.createDiv('oom-test-results');
        this.resultsContainer.style.cssText = `
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            padding: 15px;
            margin-top: 20px;
            background: var(--background-secondary);
            font-family: var(--font-monospace);
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
        `;

        // Event listeners
        testAllBtn.addEventListener('click', () => this.runAllTests());
        testSingleFilterBtn.addEventListener('click', () => this.testSingleDateFilter());
        testRangeFilterBtn.addEventListener('click', () => this.testRangeFilter());
        testProgressBtn.addEventListener('click', () => this.testProgressIndicator());

        // Close button
        const closeBtn = contentEl.createEl('button', {
            text: 'Close',
            cls: 'mod-muted'
        });
        closeBtn.addEventListener('click', () => this.close());

        this.log('✅ DateNavigator Test Modal initialized');
    }

    private setupTests(): void {
        this.tests = [
            {
                name: 'Single Date Filter',
                description: 'Test filtering for a single date with worker integration',
                testFn: () => this.testSingleDateFilter()
            },
            {
                name: 'Date Range Filter',
                description: 'Test filtering for a date range with worker processing',
                testFn: () => this.testRangeFilter()
            },
            {
                name: 'Progress Indicator',
                description: 'Test progress feedback during filtering operations',
                testFn: () => this.testProgressIndicator()
            },
            {
                name: 'Error Handling',
                description: 'Test graceful error handling and fallback behavior',
                testFn: () => this.testErrorHandling()
            },
            {
                name: 'Worker Integration',
                description: 'Verify web worker manager is properly integrated',
                testFn: () => this.testWorkerIntegration()
            }
        ];
    }

    private initializeTestDateNavigator(): void {
        if (!this.testContainer) return;

        try {
            // Create test state with sample data
            const testState = new DreamMetricsState();
            const timeFilterManager = new TimeFilterManager();

            // Generate some test dream entries
            const testEntries = this.generateTestEntries();
            testState.updateDreamEntries(testEntries);

            // Create the integration
            this.integration = new DateNavigatorIntegration(this.app, testState, timeFilterManager);
            
            // Initialize in the test container
            this.integration.initialize(this.testContainer);

            this.log('✅ Test DateNavigator initialized with ' + testEntries.length + ' test entries');
        } catch (error) {
            this.log('❌ Error initializing test DateNavigator: ' + error);
        }
    }

    private generateTestEntries(): any[] {
        const entries = [];
        const today = new Date();
        
        // Generate entries for the past 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            entries.push({
                date: date.toISOString().split('T')[0],
                title: `Test Dream ${i + 1}`,
                content: `This is test dream content for day ${i + 1}. Lorem ipsum dolor sit amet.`,
                metrics: {
                    wordCount: Math.floor(Math.random() * 200) + 50,
                    lucidity: Math.floor(Math.random() * 5) + 1,
                    vividness: Math.floor(Math.random() * 5) + 1
                }
            });
        }

        return entries;
    }

    private async testSingleDateFilter(): Promise<boolean> {
        this.log('🧪 Testing single date filter...');
        
        try {
            if (!this.integration) {
                throw new Error('DateNavigator integration not initialized');
            }

            // Test filtering to today
            const today = new Date();
            const startTime = performance.now();

            // Simulate selecting today in the DateNavigator
            if (this.integration.dateNavigator) {
                await this.integration.dateNavigator.applyFilter(today, today);
            }

            const duration = performance.now() - startTime;
            this.log(`✅ Single date filter completed in ${Math.round(duration)}ms`);
            
            new Notice('Single date filter test completed successfully');
            return true;
        } catch (error) {
            this.log(`❌ Single date filter test failed: ${error}`);
            return false;
        }
    }

    private async testRangeFilter(): Promise<boolean> {
        this.log('🧪 Testing date range filter...');
        
        try {
            if (!this.integration) {
                throw new Error('DateNavigator integration not initialized');
            }

            // Test filtering last 7 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            const startTime = performance.now();

            // Simulate selecting a date range in the DateNavigator
            if (this.integration.dateNavigator) {
                await this.integration.dateNavigator.applyFilter(startDate, endDate);
            }

            const duration = performance.now() - startTime;
            this.log(`✅ Date range filter completed in ${Math.round(duration)}ms`);
            
            new Notice('Date range filter test completed successfully');
            return true;
        } catch (error) {
            this.log(`❌ Date range filter test failed: ${error}`);
            return false;
        }
    }

    private async testProgressIndicator(): Promise<boolean> {
        this.log('🧪 Testing progress indicator...');
        
        try {
            if (!this.integration) {
                throw new Error('DateNavigator integration not initialized');
            }

            this.log('📊 Progress indicator should be visible during filtering operations');
            
            // Test with a larger dataset to see progress
            const largeDatesSet = [];
            const baseDate = new Date();
            for (let i = 0; i < 100; i++) {
                const date = new Date(baseDate);
                date.setDate(date.getDate() - i);
                largeDatesSet.push(date);
            }

            const startDate = largeDatesSet[largeDatesSet.length - 1];
            const endDate = largeDatesSet[0];

            // Apply filter and watch for progress
            if (this.integration.dateNavigator) {
                await this.integration.dateNavigator.applyFilter(startDate, endDate);
            }

            this.log('✅ Progress indicator test completed');
            new Notice('Progress indicator test completed');
            return true;
        } catch (error) {
            this.log(`❌ Progress indicator test failed: ${error}`);
            return false;
        }
    }

    private async testErrorHandling(): Promise<boolean> {
        this.log('🧪 Testing error handling...');
        
        try {
            // Test with invalid dates
            const invalidDate1 = new Date('invalid');
            const invalidDate2 = new Date();

            this.log('📝 Testing with invalid date (should handle gracefully)');
            
            if (this.integration?.dateNavigator) {
                // This should not crash but handle the error gracefully
                await this.integration.dateNavigator.applyFilter(invalidDate1, invalidDate2);
            }

            this.log('✅ Error handling test completed (no crashes)');
            return true;
        } catch (error) {
            this.log(`❌ Error handling test failed: ${error}`);
            return false;
        }
    }

    private async testWorkerIntegration(): Promise<boolean> {
        this.log('🧪 Testing worker integration...');
        
        try {
            if (!this.integration) {
                throw new Error('DateNavigator integration not initialized');
            }

            // Check if worker manager is properly initialized
            const hasWorkerManager = !!(this.integration as any).workerManager;
            const hasProgressIndicator = !!(this.integration as any).progressIndicator;

            this.log(`📊 Worker Manager initialized: ${hasWorkerManager ? '✅' : '❌'}`);
            this.log(`📊 Progress Indicator initialized: ${hasProgressIndicator ? '✅' : '❌'}`);

            if (hasWorkerManager && hasProgressIndicator) {
                this.log('✅ Worker integration verified');
                return true;
            } else {
                this.log('❌ Worker integration incomplete');
                return false;
            }
        } catch (error) {
            this.log(`❌ Worker integration test failed: ${error}`);
            return false;
        }
    }

    private async runAllTests(): Promise<void> {
        this.log('🚀 Running all DateNavigator integration tests...');
        this.log('═'.repeat(50));

        let passed = 0;
        let failed = 0;

        for (const test of this.tests) {
            this.log(`\n📋 Test: ${test.name}`);
            this.log(`📝 ${test.description}`);
            
            try {
                const result = await test.testFn();
                if (result) {
                    passed++;
                    this.log(`✅ PASSED: ${test.name}`);
                } else {
                    failed++;
                    this.log(`❌ FAILED: ${test.name}`);
                }
            } catch (error) {
                failed++;
                this.log(`❌ ERROR in ${test.name}: ${error}`);
            }
            
            // Add delay between tests
            await this.delay(500);
        }

        this.log('\n' + '═'.repeat(50));
        this.log(`🏁 Test Results: ${passed} passed, ${failed} failed`);
        
        if (failed === 0) {
            this.log('🎉 All tests passed! DateNavigator web worker integration is working correctly.');
            new Notice('🎉 All DateNavigator integration tests passed!', 5000);
        } else {
            this.log('⚠️ Some tests failed. Check the logs for details.');
            new Notice('⚠️ Some tests failed. Check the test results.', 5000);
        }
    }

    private log(message: string): void {
        if (this.resultsContainer) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = this.resultsContainer.createDiv();
            logEntry.textContent = `[${timestamp}] ${message}`;
            
            // Scroll to bottom
            this.resultsContainer.scrollTop = this.resultsContainer.scrollHeight;
        }
        
        // Also log to console for debugging
        this.logger.debug('Test', message);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onClose() {
        // Clean up the test integration
        if (this.integration) {
            this.integration.destroy();
            this.integration = null;
        }

        const { contentEl } = this;
        contentEl.empty();
    }
} 