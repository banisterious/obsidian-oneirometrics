import { DreamMetricData, DreamMetricsSettings } from '../types';

export class DreamMetricsProcessor {
    constructor(private settings: DreamMetricsSettings) {}

    processDreamEntries(entries: DreamMetricData[]): {
        metrics: Record<string, number>;
        processedEntries: DreamMetricData[];
    } {
        const metrics: Record<string, number> = {};
        const processedEntries: DreamMetricData[] = [];

        entries.forEach(entry => {
            const processedEntry = this.processEntry(entry);
            processedEntries.push(processedEntry);

            // Update metrics
            Object.entries(processedEntry.metrics).forEach(([key, value]) => {
                if (!metrics[key]) {
                    metrics[key] = 0;
                }
                metrics[key] += value;
            });
        });

        return { metrics, processedEntries };
    }

    private processEntry(entry: DreamMetricData): DreamMetricData {
        const processedEntry: DreamMetricData = {
            ...entry,
            metrics: { ...entry.metrics }
        };

        // Calculate word count
        processedEntry.metrics['Words'] = this.calculateWordCount(entry.content);

        // Calculate reading time (assuming average reading speed of 200 words per minute)
        processedEntry.metrics['Reading Time'] = Math.ceil(processedEntry.metrics['Words'] / 200);

        // Calculate sentiment (placeholder - implement actual sentiment analysis)
        processedEntry.metrics['Sentiment'] = this.calculateSentiment(entry.content);

        // Calculate dream length category
        processedEntry.metrics['Length Category'] = this.calculateLengthCategory(processedEntry.metrics['Words']);

        return processedEntry;
    }

    private calculateWordCount(content: string): number {
        return content.trim().split(/\s+/).length;
    }

    private calculateSentiment(content: string): number {
        // Placeholder for sentiment analysis
        // TODO: Implement actual sentiment analysis
        return 0;
    }

    private calculateLengthCategory(wordCount: number): number {
        if (wordCount < 100) return 1; // Short
        if (wordCount < 500) return 2; // Medium
        if (wordCount < 1000) return 3; // Long
        return 4; // Very Long
    }

    getMetricsSummary(metrics: Record<string, number>): string {
        const summary: Record<string, any> = {
            totalEntries: Object.keys(metrics).length,
            metrics: {}
        };

        Object.entries(metrics).forEach(([key, value]) => {
            summary.metrics[key] = {
                total: value,
                average: value / summary.totalEntries
            };
        });

        return JSON.stringify(summary, null, 2);
    }

    getTimeBasedMetrics(entries: DreamMetricData[]): Record<string, any> {
        const timeMetrics: Record<string, any> = {
            byMonth: {},
            byDayOfWeek: {},
            byHour: {}
        };

        entries.forEach(entry => {
            const date = new Date(entry.date);
            
            // Monthly metrics
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!timeMetrics.byMonth[monthKey]) {
                timeMetrics.byMonth[monthKey] = {
                    count: 0,
                    totalWords: 0
                };
            }
            timeMetrics.byMonth[monthKey].count++;
            timeMetrics.byMonth[monthKey].totalWords += entry.metrics['Words'];

            // Day of week metrics
            const dayKey = date.getDay();
            if (!timeMetrics.byDayOfWeek[dayKey]) {
                timeMetrics.byDayOfWeek[dayKey] = {
                    count: 0,
                    totalWords: 0
                };
            }
            timeMetrics.byDayOfWeek[dayKey].count++;
            timeMetrics.byDayOfWeek[dayKey].totalWords += entry.metrics['Words'];

            // Hour metrics
            const hourKey = date.getHours();
            if (!timeMetrics.byHour[hourKey]) {
                timeMetrics.byHour[hourKey] = {
                    count: 0,
                    totalWords: 0
                };
            }
            timeMetrics.byHour[hourKey].count++;
            timeMetrics.byHour[hourKey].totalWords += entry.metrics['Words'];
        });

        return timeMetrics;
    }
} 