import { ItemView } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';
import type { DreamMetricData } from '../../../types';

/**
 * Virtual Scrolling Performance Test
 * 
 * Tests the virtual scrolling implementation with large datasets
 * to ensure smooth 60fps scrolling and efficient memory usage.
 */

export class VirtualScrollingTest {
    private plugin: DreamMetricsPlugin;
    
    constructor(plugin: DreamMetricsPlugin) {
        this.plugin = plugin;
    }
    
    /**
     * Generate test data with specified number of entries
     */
    private generateTestData(count: number): DreamMetricData[] {
        const entries: DreamMetricData[] = [];
        const themes = ['Adventure', 'Mystery', 'Lucid', 'Nightmare', 'Recurring'];
        const emotions = ['Happy', 'Anxious', 'Excited', 'Calm', 'Fearful'];
        
        for (let i = 0; i < count; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const wordCount = 100 + Math.floor(Math.random() * 500);
            
            entries.push({
                date: date.toISOString().split('T')[0],
                title: `Dream Entry ${i + 1}`,
                content: `This is test dream content #${i + 1}. `.repeat(20) + 
                        `It contains various themes and emotions to test the virtual scrolling system. ` +
                        `The content is deliberately long to test the expand/collapse functionality. `.repeat(5),
                source: `test-dream-${i}.md`,
                wordCount: wordCount,
                metrics: {
                    'Lucidity': Math.floor(Math.random() * 10),
                    'Vividness': Math.floor(Math.random() * 10),
                    'Dream Recall': Math.floor(Math.random() * 10),
                    'Emotional Intensity': Math.floor(Math.random() * 10),
                    'Words': wordCount,
                    'Dream Themes': Math.floor(Math.random() * 5), // Use numeric value for now
                    'Emotion': Math.floor(Math.random() * 5) // Use numeric value for now
                }
            });
        }
        
        return entries;
    }
    
    /**
     * Test virtual scrolling with various dataset sizes
     */
    async runTest(): Promise<{ success: boolean; message: string; details: any }> {
        try {
            this.plugin.logger?.debug('VirtualScrollingTest', 'Starting virtual scrolling test');
            
            // Find the dashboard view
            const leaves = this.plugin.app.workspace.getLeavesOfType('oneirometrics-dashboard');
            if (leaves.length === 0) {
                return {
                    success: false,
                    message: 'Dashboard view not found. Please open the OneiroMetrics Dashboard first.',
                    details: null
                };
            }
            
            const dashboardView = leaves[0].view as any;
            if (!dashboardView) {
                return {
                    success: false,
                    message: 'Could not access dashboard view',
                    details: null
                };
            }
            
            // Test with different dataset sizes
            const testSizes = [100, 500, 1000, 5000, 10000];
            const results: any[] = [];
            
            for (const size of testSizes) {
                this.plugin.logger?.debug('VirtualScrollingTest', `Testing with ${size} entries`);
                
                // Generate test data
                const testData = this.generateTestData(size);
                
                // Update dashboard state with test data
                dashboardView.state.entries = testData;
                dashboardView.state.filteredEntries = testData;
                
                // Measure render performance
                const startTime = performance.now();
                
                // Trigger render
                dashboardView.renderTable();
                
                const renderTime = performance.now() - startTime;
                
                // Check if virtual scroller was initialized
                const hasVirtualScroller = dashboardView.virtualScroller !== null;
                
                // Get performance metrics if available
                let scrollerMetrics = null;
                if (hasVirtualScroller && dashboardView.virtualScroller) {
                    scrollerMetrics = dashboardView.virtualScroller.getPerformanceMetrics();
                }
                
                results.push({
                    size,
                    renderTime: renderTime.toFixed(2),
                    hasVirtualScroller,
                    scrollerMetrics,
                    memoryEstimate: this.estimateMemoryUsage(size)
                });
                
                // Small delay between tests
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Analyze results
            const analysis = this.analyzeResults(results);
            
            return {
                success: true,
                message: 'Virtual scrolling test completed successfully',
                details: {
                    results,
                    analysis,
                    recommendations: this.getRecommendations(analysis)
                }
            };
            
        } catch (error) {
            this.plugin.logger?.error('VirtualScrollingTest', 'Test failed', error);
            return {
                success: false,
                message: `Test failed: ${error.message}`,
                details: { error: error.toString() }
            };
        }
    }
    
    /**
     * Estimate memory usage for given dataset size
     */
    private estimateMemoryUsage(entryCount: number): string {
        // Rough estimate: each entry ~2KB in memory
        const bytesPerEntry = 2048;
        const totalBytes = entryCount * bytesPerEntry;
        
        if (totalBytes < 1024 * 1024) {
            return `${(totalBytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    }
    
    /**
     * Analyze test results
     */
    private analyzeResults(results: any[]): any {
        const renderTimes = results.map(r => parseFloat(r.renderTime));
        const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
        
        // Check if render time scales linearly (bad) or stays constant (good)
        const smallDatasetTime = renderTimes[0]; // 100 entries
        const largeDatasetTime = renderTimes[renderTimes.length - 1]; // 10000 entries
        const scalingFactor = largeDatasetTime / smallDatasetTime;
        
        return {
            averageRenderTime: avgRenderTime.toFixed(2),
            scalingFactor: scalingFactor.toFixed(2),
            isVirtualScrollingActive: results.every(r => r.hasVirtualScroller),
            performanceRating: this.getPerformanceRating(scalingFactor),
            maxTestedSize: results[results.length - 1].size
        };
    }
    
    /**
     * Get performance rating based on scaling factor
     */
    private getPerformanceRating(scalingFactor: number): string {
        if (scalingFactor < 2) {
            return 'Excellent - Virtual scrolling is working efficiently';
        } else if (scalingFactor < 5) {
            return 'Good - Some scaling but manageable';
        } else if (scalingFactor < 10) {
            return 'Fair - Performance degrades with large datasets';
        } else {
            return 'Poor - Virtual scrolling may not be working correctly';
        }
    }
    
    /**
     * Get recommendations based on analysis
     */
    private getRecommendations(analysis: any): string[] {
        const recommendations: string[] = [];
        
        if (!analysis.isVirtualScrollingActive) {
            recommendations.push('Virtual scrolling is not active. Check dashboard settings.');
        }
        
        if (analysis.scalingFactor > 5) {
            recommendations.push('Consider optimizing row rendering for better performance.');
            recommendations.push('Increase buffer size for smoother scrolling.');
        }
        
        if (parseFloat(analysis.averageRenderTime) > 100) {
            recommendations.push('Initial render time is high. Consider lazy loading or progressive rendering.');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Virtual scrolling is performing optimally.');
            recommendations.push(`Successfully tested with up to ${analysis.maxTestedSize} entries.`);
        }
        
        return recommendations;
    }
    
    /**
     * Run scroll simulation test
     */
    async runScrollSimulation(): Promise<{ success: boolean; fps: number; jank: number }> {
        try {
            const leaves = this.plugin.app.workspace.getLeavesOfType('oneirometrics-dashboard');
            if (leaves.length === 0) {
                return { success: false, fps: 0, jank: 0 };
            }
            
            const dashboardView = leaves[0].view as any;
            const container = dashboardView.containerEl.querySelector('.oom-scroll-viewport') as HTMLElement;
            
            if (!container) {
                return { success: false, fps: 0, jank: 0 };
            }
            
            // Simulate scrolling
            const frameCount = 60; // 1 second at 60fps
            const scrollDistance = 100; // pixels per frame
            let actualFrames = 0;
            let jankFrames = 0;
            const targetFrameTime = 16.67; // ms for 60fps
            
            for (let i = 0; i < frameCount; i++) {
                const frameStart = performance.now();
                
                // Scroll
                container.scrollTop += scrollDistance;
                
                // Force layout/repaint
                void container.offsetHeight;
                
                // Wait for next frame
                await new Promise(resolve => requestAnimationFrame(resolve));
                
                const frameTime = performance.now() - frameStart;
                actualFrames++;
                
                if (frameTime > targetFrameTime * 1.5) {
                    jankFrames++;
                }
            }
            
            const fps = (actualFrames / (frameCount / 60)) * 60;
            const jankPercentage = (jankFrames / actualFrames) * 100;
            
            return {
                success: true,
                fps: Math.round(fps),
                jank: Math.round(jankPercentage)
            };
            
        } catch (error) {
            return { success: false, fps: 0, jank: 0 };
        }
    }
}