import { DreamMetricData, DreamMetricsSettings } from '../types/core';

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
                // Handle numeric values only
                if (typeof value === 'number') {
                    metrics[key] += value;
                }
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
        const wordCount = this.calculateWordCount(entry.content);
        processedEntry.metrics['Words'] = wordCount;
        // Ensure wordCount property is set for compatibility
        processedEntry.wordCount = wordCount;

        // Calculate reading time (assuming average reading speed of 200 words per minute)
        processedEntry.metrics['Reading Time'] = Math.ceil(wordCount / 200);

        // Calculate sentiment
        processedEntry.metrics['Sentiment'] = this.calculateSentiment(entry.content);

        // Calculate dream length category
        processedEntry.metrics['Length Category'] = this.calculateLengthCategory(wordCount);

        return processedEntry;
    }

    private calculateWordCount(content: string): number {
        return content.trim().split(/\s+/).length;
    }

    private calculateSentiment(content: string): number {
        // Basic sentiment analysis implementation
        // Returns a value between -1 (negative) and 1 (positive)
        
        // Define basic positive and negative word lists
        const positiveWords = [
            "happy", "joy", "love", "peaceful", "beautiful", "wonderful", "amazing", 
            "good", "great", "excellent", "pleasant", "delight", "calm", "safe", 
            "clarity", "flying", "float", "success", "achieve", "accomplish"
        ];
        
        const negativeWords = [
            "sad", "fear", "anxious", "angry", "terrified", "nightmare", "falling", 
            "chase", "dark", "scary", "bad", "awful", "terrible", "horror", 
            "trapped", "confused", "lost", "danger", "threat", "panic", "death"
        ];
        
        // Convert to lowercase for case-insensitive matching
        const lowerContent = content.toLowerCase();
        
        // Count occurrences of positive and negative words
        let positiveCount = 0;
        let negativeCount = 0;
        
        // Check positive words
        positiveWords.forEach(word => {
            // Use regex with word boundaries to match whole words only
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            const matches = lowerContent.match(regex);
            if (matches) {
                positiveCount += matches.length;
            }
        });
        
        // Check negative words
        negativeWords.forEach(word => {
            // Use regex with word boundaries to match whole words only
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            const matches = lowerContent.match(regex);
            if (matches) {
                negativeCount += matches.length;
            }
        });
        
        // Calculate sentiment score
        if (positiveCount === 0 && negativeCount === 0) {
            return 0; // Neutral if no sentiment words found
        }
        
        // Normalize to a value between -1 and 1
        const total = positiveCount + negativeCount;
        const sentiment = (positiveCount - negativeCount) / total;
        
        // Round to 2 decimal places for readability
        return Math.round(sentiment * 100) / 100;
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
            const wordsValue = typeof entry.metrics['Words'] === 'number' 
                ? entry.metrics['Words'] 
                : entry.wordCount || 0;
            
            // Monthly metrics
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!timeMetrics.byMonth[monthKey]) {
                timeMetrics.byMonth[monthKey] = {
                    count: 0,
                    totalWords: 0
                };
            }
            timeMetrics.byMonth[monthKey].count++;
            timeMetrics.byMonth[monthKey].totalWords += wordsValue;

            // Day of week metrics
            const dayKey = date.getDay();
            if (!timeMetrics.byDayOfWeek[dayKey]) {
                timeMetrics.byDayOfWeek[dayKey] = {
                    count: 0,
                    totalWords: 0
                };
            }
            timeMetrics.byDayOfWeek[dayKey].count++;
            timeMetrics.byDayOfWeek[dayKey].totalWords += wordsValue;

            // Hour metrics
            const hourKey = date.getHours();
            if (!timeMetrics.byHour[hourKey]) {
                timeMetrics.byHour[hourKey] = {
                    count: 0,
                    totalWords: 0
                };
            }
            timeMetrics.byHour[hourKey].count++;
            timeMetrics.byHour[hourKey].totalWords += wordsValue;
        });

        return timeMetrics;
    }
} 