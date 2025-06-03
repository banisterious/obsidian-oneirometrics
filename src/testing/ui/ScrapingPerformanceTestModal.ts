import { Modal, Setting } from 'obsidian';
import { DummyDataGenerator, PerformanceTestRunner } from '../utils/DummyDataGenerator';
import { UniversalMetricsCalculator } from '../../workers/UniversalMetricsCalculator';
import { DreamMetricData } from '../../types/core';
import { getLogger } from '../../logging';

interface TestResults {
    testName: string;
    datasetSize: number;
    executionTime: number;
    throughput: number;
    memoryUsage?: {
        before: number;
        after: number;
        peak: number;
    };
    success: boolean;
    errorMessage?: string;
}

interface ScalingTestResults {
    testName: string;
    sizes: number[];
    results: TestResults[];
    scalingFactor: number; // How much slower per entry as size increases
}

// Type guard for performance.memory
interface PerformanceMemory {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
    memory?: PerformanceMemory;
}

/**
 * Modal for testing scraping performance with large datasets
 */
export class ScrapingPerformanceTestModal extends Modal {
    private logger = getLogger('ScrapingPerformanceTestModal');
    private testRunner = new PerformanceTestRunner();
    private generator = new DummyDataGenerator();
    private metricsCalculator: UniversalMetricsCalculator;
    
    private testResults: TestResults[] = [];
    private isRunning = false;
    private currentTest = '';
    
    private modalContentEl: HTMLElement;
    private statusEl: HTMLElement;
    private resultsEl: HTMLElement;
    private progressEl: HTMLElement;

    constructor(app: any, metricsCalculator: UniversalMetricsCalculator) {
        super(app);
        this.metricsCalculator = metricsCalculator;
    }

    onOpen() {
        this.modalContentEl = this.modalEl.querySelector('.modal-content')!;
        this.modalContentEl.empty();

        // Title
        this.modalContentEl.createEl('h2', { text: 'Scraping Performance Testing' });
        
        // Description
        this.modalContentEl.createEl('p', { 
            text: 'Test scraping performance with large datasets to validate scalability and identify bottlenecks.' 
        });

        // Status section
        const statusSection = this.modalContentEl.createEl('div', { cls: 'oom-test-status' });
        statusSection.createEl('h3', { text: 'Test Status' });
        this.statusEl = statusSection.createEl('div', { cls: 'oom-status-display' });
        this.progressEl = statusSection.createEl('div', { cls: 'oom-progress-display' });
        
        this.updateStatus('Ready to run performance tests');

        // Quick test buttons
        const quickTestSection = this.modalContentEl.createEl('div', { cls: 'oom-quick-tests' });
        quickTestSection.createEl('h3', { text: 'Quick Tests' });
        
        const quickButtonsContainer = quickTestSection.createEl('div', { cls: 'oom-quick-buttons' });
        
        this.createQuickTestButton(quickButtonsContainer, 'Baseline (500 entries)', () => 
            this.runSingleTest('Baseline Performance', 500));
        
        this.createQuickTestButton(quickButtonsContainer, 'Medium (2K entries)', () => 
            this.runSingleTest('Medium Dataset', 2000));
            
        this.createQuickTestButton(quickButtonsContainer, 'Large (5K entries)', () => 
            this.runSingleTest('Large Dataset', 5000));
            
        this.createQuickTestButton(quickButtonsContainer, 'Stress (10K entries)', () => 
            this.runSingleTest('Stress Test', 10000));

        // Scaling test section
        const scalingSection = this.modalContentEl.createEl('div', { cls: 'oom-scaling-tests' });
        scalingSection.createEl('h3', { text: 'Scaling Tests' });
        
        const scalingButtonsContainer = scalingSection.createEl('div', { cls: 'oom-scaling-buttons' });
        
        this.createTestButton(scalingButtonsContainer, 'Full Scaling Test', () => 
            this.runScalingTest('Complete Scaling Analysis', [100, 500, 1000, 2000, 5000, 10000]));
            
        this.createTestButton(scalingButtonsContainer, 'Quick Scaling Test', () => 
            this.runScalingTest('Quick Scaling Check', [100, 500, 1000, 2000]));

        // Memory test section
        const memorySection = this.modalContentEl.createEl('div', { cls: 'oom-memory-tests' });
        memorySection.createEl('h3', { text: 'Memory Tests' });
        
        const memoryButtonsContainer = memorySection.createEl('div', { cls: 'oom-memory-buttons' });
        
        this.createTestButton(memoryButtonsContainer, 'Memory Leak Test', () => 
            this.runMemoryLeakTest());
            
        this.createTestButton(memoryButtonsContainer, 'Garbage Collection Test', () => 
            this.runGarbageCollectionTest());

        // Custom test section
        const customSection = this.modalContentEl.createEl('div', { cls: 'oom-custom-tests' });
        customSection.createEl('h3', { text: 'Custom Test' });
        
        let customSize = 1000;
        new Setting(customSection)
            .setName('Dataset Size')
            .setDesc('Number of entries to generate for testing')
            .addText(text => text
                .setPlaceholder('1000')
                .setValue('1000')
                .onChange(value => {
                    const parsed = parseInt(value);
                    if (!isNaN(parsed) && parsed > 0) {
                        customSize = parsed;
                    }
                }));
                
        this.createTestButton(customSection, 'Run Custom Test', () => 
            this.runSingleTest(`Custom Test (${customSize} entries)`, customSize));

        // Results section
        const resultsSection = this.modalContentEl.createEl('div', { cls: 'oom-test-results' });
        resultsSection.createEl('h3', { text: 'Test Results' });
        this.resultsEl = resultsSection.createEl('div', { cls: 'oom-results-display' });
        
        // Action buttons
        const actionsContainer = this.modalContentEl.createEl('div', { cls: 'oom-actions' });
        
        this.createActionButton(actionsContainer, 'Clear Results', () => this.clearResults());
        this.createActionButton(actionsContainer, 'Export Results', () => this.exportResults());
        this.createActionButton(actionsContainer, 'Close', () => this.close());

        // Apply CSS
        this.addCustomCSS();
    }

    private createQuickTestButton(container: HTMLElement, text: string, onClick: () => void) {
        const button = container.createEl('button', { 
            text, 
            cls: 'oom-quick-test-btn mod-cta' 
        });
        button.onclick = onClick;
        return button;
    }

    private createTestButton(container: HTMLElement, text: string, onClick: () => void) {
        const button = container.createEl('button', { 
            text, 
            cls: 'oom-test-btn' 
        });
        button.onclick = onClick;
        return button;
    }

    private createActionButton(container: HTMLElement, text: string, onClick: () => void) {
        const button = container.createEl('button', { 
            text, 
            cls: 'oom-action-btn' 
        });
        button.onclick = onClick;
        return button;
    }

    private async runSingleTest(testName: string, datasetSize: number) {
        if (this.isRunning) {
            this.updateStatus('Test already running...');
            return;
        }

        this.isRunning = true;
        this.currentTest = testName;
        this.updateStatus(`Running ${testName}...`);
        this.updateProgress(`Generating ${datasetSize} test entries...`);

        try {
            const memoryBefore = this.getMemoryUsage();
            
            const result = await this.testRunner.runPerformanceTest(
                testName,
                datasetSize,
                async (data: DreamMetricData[]) => {
                    this.updateProgress(`Processing ${data.length} entries...`);
                    
                    // Test the UniversalMetricsCalculator
                    const startTime = performance.now();
                    const processedEntries = [];
                    
                    for (let i = 0; i < data.length; i++) {
                        const entry = data[i];
                        
                        // Simulate processing each entry through the calculator
                        const processed = await this.processEntry(entry);
                        processedEntries.push(processed);
                        
                        // Update progress every 100 entries
                        if (i % 100 === 0) {
                            this.updateProgress(`Processed ${i}/${data.length} entries...`);
                        }
                    }
                    
                    const endTime = performance.now();
                    
                    return {
                        processedCount: processedEntries.length,
                        totalTime: endTime - startTime,
                        averageTimePerEntry: (endTime - startTime) / processedEntries.length
                    };
                },
                { realistic: datasetSize <= 5000 } // Use realistic data for smaller tests
            );

            const memoryAfter = this.getMemoryUsage();
            const memoryPeak = Math.max(memoryBefore, memoryAfter);

            const testResult: TestResults = {
                testName,
                datasetSize,
                executionTime: result.executionTime,
                throughput: result.throughput,
                memoryUsage: {
                    before: memoryBefore,
                    after: memoryAfter,
                    peak: memoryPeak
                },
                success: true
            };

            this.testResults.push(testResult);
            this.updateResults();
            this.updateStatus(`${testName} completed successfully`);
            this.updateProgress('');

            this.logger.info('Performance test completed', JSON.stringify({ 
                testName: testResult.testName,
                datasetSize: testResult.datasetSize,
                executionTime: testResult.executionTime,
                throughput: testResult.throughput
            }));

        } catch (error) {
            const testResult: TestResults = {
                testName,
                datasetSize,
                executionTime: 0,
                throughput: 0,
                success: false,
                errorMessage: (error as Error).message
            };

            this.testResults.push(testResult);
            this.updateResults();
            this.updateStatus(`${testName} failed: ${(error as Error).message}`);
            this.updateProgress('');

            this.logger.error('Performance test failed', JSON.stringify({ 
                testName,
                error: (error as Error).message 
            }));
        } finally {
            this.isRunning = false;
            this.currentTest = '';
        }
    }

    private async runScalingTest(testName: string, sizes: number[]) {
        if (this.isRunning) {
            this.updateStatus('Test already running...');
            return;
        }

        this.isRunning = true;
        this.updateStatus(`Running scaling test: ${testName}...`);

        try {
            const scalingResults: TestResults[] = [];
            
            for (let i = 0; i < sizes.length; i++) {
                const size = sizes[i];
                this.updateProgress(`Running test ${i + 1}/${sizes.length}: ${size} entries...`);
                
                await this.runSingleTest(`${testName} (${size})`, size);
                
                // Get the latest result
                const latestResult = this.testResults[this.testResults.length - 1];
                scalingResults.push(latestResult);
                
                // Brief pause between tests
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Calculate scaling factor
            const scalingFactor = this.calculateScalingFactor(scalingResults);
            
            this.updateStatus(`Scaling test completed. Scaling factor: ${scalingFactor.toFixed(2)}x`);
            this.updateProgress('');

            this.logger.info('Scaling test completed', JSON.stringify({ 
                testName, 
                sizes: sizes.join(','), 
                scalingFactor,
                resultCount: scalingResults.length
            }));

        } catch (error) {
            this.updateStatus(`Scaling test failed: ${(error as Error).message}`);
            this.updateProgress('');
            this.logger.error('Scaling test failed', JSON.stringify({ 
                testName,
                error: (error as Error).message 
            }));
        } finally {
            this.isRunning = false;
        }
    }

    private async runMemoryLeakTest() {
        if (this.isRunning) {
            this.updateStatus('Test already running...');
            return;
        }

        this.isRunning = true;
        this.updateStatus('Running memory leak test...');

        try {
            const iterations = 5;
            const datasetSize = 1000;
            const memoryReadings: number[] = [];

            for (let i = 0; i < iterations; i++) {
                this.updateProgress(`Memory test iteration ${i + 1}/${iterations}...`);
                
                // Force garbage collection if available
                if ((window as any).gc) {
                    (window as any).gc();
                }
                
                const memoryBefore = this.getMemoryUsage();
                
                // Generate and process data
                const { data } = await this.generator.generateDreamDataset({
                    count: datasetSize,
                    realistic: false
                });
                
                // Process the data
                for (const entry of data) {
                    await this.processEntry(entry);
                }
                
                // Force garbage collection again
                if ((window as any).gc) {
                    (window as any).gc();
                }
                
                const memoryAfter = this.getMemoryUsage();
                memoryReadings.push(memoryAfter - memoryBefore);
                
                // Brief pause
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const avgMemoryDelta = memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length;
            const memoryTrend = this.calculateMemoryTrend(memoryReadings);

            const result: TestResults = {
                testName: 'Memory Leak Test',
                datasetSize: datasetSize * iterations,
                executionTime: 0,
                throughput: 0,
                success: memoryTrend < 0.1, // Acceptable if memory growth is less than 10% per iteration
                errorMessage: memoryTrend >= 0.1 ? `Memory trend: ${(memoryTrend * 100).toFixed(1)}% growth per iteration` : undefined
            };

            this.testResults.push(result);
            this.updateResults();
            this.updateStatus(`Memory leak test completed. Average memory delta: ${avgMemoryDelta.toFixed(2)}MB`);
            this.updateProgress('');

        } catch (error) {
            this.updateStatus(`Memory leak test failed: ${(error as Error).message}`);
            this.updateProgress('');
        } finally {
            this.isRunning = false;
        }
    }

    private async runGarbageCollectionTest() {
        if (this.isRunning) {
            this.updateStatus('Test already running...');
            return;
        }

        this.isRunning = true;
        this.updateStatus('Running garbage collection test...');

        try {
            // Generate large dataset
            this.updateProgress('Generating large dataset...');
            const { data } = await this.generator.generateDreamDataset({
                count: 5000,
                realistic: false
            });

            const memoryBefore = this.getMemoryUsage();
            
            // Process data
            this.updateProgress('Processing data...');
            for (const entry of data) {
                await this.processEntry(entry);
            }

            const memoryPeak = this.getMemoryUsage();

            // Force garbage collection
            this.updateProgress('Forcing garbage collection...');
            if ((window as any).gc) {
                (window as any).gc();
            }
            
            // Wait for GC to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const memoryAfter = this.getMemoryUsage();
            const memoryReclaimed = memoryPeak - memoryAfter;
            const gcEfficiency = memoryReclaimed / (memoryPeak - memoryBefore);

            const result: TestResults = {
                testName: 'Garbage Collection Test',
                datasetSize: data.length,
                executionTime: 0,
                throughput: 0,
                memoryUsage: {
                    before: memoryBefore,
                    after: memoryAfter,
                    peak: memoryPeak
                },
                success: gcEfficiency > 0.7, // Good if >70% of allocated memory was reclaimed
                errorMessage: gcEfficiency <= 0.7 ? `Low GC efficiency: ${(gcEfficiency * 100).toFixed(1)}%` : undefined
            };

            this.testResults.push(result);
            this.updateResults();
            this.updateStatus(`GC test completed. Efficiency: ${(gcEfficiency * 100).toFixed(1)}%`);
            this.updateProgress('');

        } catch (error) {
            this.updateStatus(`GC test failed: ${(error as Error).message}`);
            this.updateProgress('');
        } finally {
            this.isRunning = false;
        }
    }

    private async processEntry(entry: DreamMetricData): Promise<any> {
        // Simulate the actual processing that would happen in the metrics calculator
        // This should be replaced with actual UniversalMetricsCalculator methods
        
        // Basic processing simulation
        const processed = {
            ...entry,
            processed: true,
            processingTime: performance.now()
        };
        
        // Simulate some computation time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
        
        return processed;
    }

    private calculateScalingFactor(results: TestResults[]): number {
        if (results.length < 2) return 1;
        
        // Calculate average time per entry for each result
        const timesPerEntry = results.map(r => r.executionTime / r.datasetSize);
        
        // Calculate how much the time per entry increases as dataset size grows
        const firstTime = timesPerEntry[0];
        const lastTime = timesPerEntry[timesPerEntry.length - 1];
        
        return lastTime / firstTime;
    }

    private calculateMemoryTrend(readings: number[]): number {
        if (readings.length < 2) return 0;
        
        // Simple linear regression to find trend
        const n = readings.length;
        const sumX = readings.reduce((sum, _, i) => sum + i, 0);
        const sumY = readings.reduce((sum, val) => sum + val, 0);
        const sumXY = readings.reduce((sum, val, i) => sum + i * val, 0);
        const sumX2 = readings.reduce((sum, _, i) => sum + i * i, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    private getMemoryUsage(): number {
        // Get memory usage in MB
        const perfWithMemory = performance as PerformanceWithMemory;
        if (perfWithMemory.memory) {
            return perfWithMemory.memory.usedJSHeapSize / (1024 * 1024);
        }
        return 0;
    }

    private updateStatus(message: string) {
        this.statusEl.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    }

    private updateProgress(message: string) {
        this.progressEl.textContent = message;
    }

    private updateResults() {
        this.resultsEl.empty();
        
        if (this.testResults.length === 0) {
            this.resultsEl.createEl('p', { text: 'No test results yet.' });
            return;
        }

        const table = this.resultsEl.createEl('table', { cls: 'oom-results-table' });
        
        // Header
        const header = table.createEl('thead').createEl('tr');
        header.createEl('th', { text: 'Test Name' });
        header.createEl('th', { text: 'Dataset Size' });
        header.createEl('th', { text: 'Execution Time (ms)' });
        header.createEl('th', { text: 'Throughput (entries/s)' });
        header.createEl('th', { text: 'Memory Usage (MB)' });
        header.createEl('th', { text: 'Status' });

        // Results
        const tbody = table.createEl('tbody');
        this.testResults.forEach(result => {
            const row = tbody.createEl('tr', { 
                cls: result.success ? 'oom-success' : 'oom-failure' 
            });
            
            row.createEl('td', { text: result.testName });
            row.createEl('td', { text: result.datasetSize.toLocaleString() });
            row.createEl('td', { text: result.executionTime.toFixed(2) });
            row.createEl('td', { text: result.throughput.toLocaleString() });
            
            const memoryText = result.memoryUsage ? 
                `${result.memoryUsage.peak.toFixed(1)} (peak)` : 'N/A';
            row.createEl('td', { text: memoryText });
            
            const statusText = result.success ? 'Success' : 
                `Failed: ${result.errorMessage || 'Unknown error'}`;
            row.createEl('td', { text: statusText });
        });
    }

    private clearResults() {
        this.testResults = [];
        this.updateResults();
        this.updateStatus('Results cleared');
    }

    private async exportResults() {
        if (this.testResults.length === 0) {
            this.updateStatus('No results to export');
            return;
        }

        const exportData = {
            exportTime: new Date().toISOString(),
            totalTests: this.testResults.length,
            successfulTests: this.testResults.filter(r => r.success).length,
            results: this.testResults
        };

        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Copy to clipboard
        await navigator.clipboard.writeText(jsonData);
        this.updateStatus('Results exported to clipboard');
    }

    private addCustomCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .oom-test-status {
                margin-bottom: 20px;
                padding: 10px;
                background: var(--background-secondary);
                border-radius: 6px;
            }
            
            .oom-status-display {
                font-weight: bold;
                color: var(--text-accent);
            }
            
            .oom-progress-display {
                margin-top: 5px;
                font-style: italic;
                color: var(--text-muted);
            }
            
            .oom-quick-tests, .oom-scaling-tests, 
            .oom-memory-tests, .oom-custom-tests {
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
            }
            
            .oom-quick-buttons, .oom-scaling-buttons, 
            .oom-memory-buttons {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 10px;
            }
            
            .oom-quick-test-btn {
                padding: 8px 16px;
                border-radius: 4px;
                border: none;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                cursor: pointer;
            }
            
            .oom-test-btn, .oom-action-btn {
                padding: 8px 16px;
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
                background: var(--background-primary);
                color: var(--text-normal);
                cursor: pointer;
            }
            
            .oom-test-btn:hover, .oom-action-btn:hover {
                background: var(--background-secondary);
            }
            
            .oom-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--background-modifier-border);
            }
            
            .oom-results-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            
            .oom-results-table th,
            .oom-results-table td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid var(--background-modifier-border);
            }
            
            .oom-results-table th {
                background: var(--background-secondary);
                font-weight: bold;
            }
            
            .oom-success {
                background: var(--background-success);
            }
            
            .oom-failure {
                background: var(--background-error);
            }
        `;
        document.head.appendChild(style);
    }

    onClose() {
        this.modalContentEl.empty();
    }
} 