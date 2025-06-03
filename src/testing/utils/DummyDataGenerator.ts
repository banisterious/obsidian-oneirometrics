import { DreamMetricData } from '../../types/core';
import { getLogger } from '../../logging';

interface GenerationOptions {
    /** Number of entries to generate */
    count: number;
    /** Start date for entries (default: 1 year ago) */
    startDate?: Date;
    /** End date for entries (default: today) */
    endDate?: Date;
    /** Whether to include realistic content variations */
    realistic?: boolean;
    /** Seed for reproducible randomization */
    seed?: number;
    /** Source prefix for generated entries */
    sourcePrefix?: string;
    /** Whether to distribute entries evenly across date range */
    evenDistribution?: boolean;
    /** Target metrics to include in generation */
    includeMetrics?: string[];
}

interface GenerationStats {
    /** Total entries generated */
    totalGenerated: number;
    /** Generation time in milliseconds */
    generationTime: number;
    /** Date range of generated entries */
    dateRange: { start: string; end: string };
    /** Metrics included */
    metricsIncluded: string[];
    /** Average metrics per entry */
    averageMetrics: Record<string, number>;
}

/**
 * Comprehensive dummy data generator for performance testing
 * Builds on existing test patterns with realistic content and metrics
 */
export class DummyDataGenerator {
    private logger = getLogger('DummyDataGenerator');
    private random: () => number;

    // Realistic dream content templates and word lists
    private readonly dreamTitles = [
        'Flying Dream', 'Underwater Adventure', 'Lost in a Maze', 'Meeting a Celebrity',
        'Falling from Heights', 'Chased by Shadows', 'Magical Forest', 'Time Travel',
        'Talking Animals', 'Lost Childhood Home', 'School Anxiety', 'Work Stress',
        'Family Gathering', 'Ocean Waves', 'Mountain Climbing', 'Desert Journey',
        'City Streets', 'Mysterious Door', 'Ancient Temple', 'Space Exploration',
        'Lucid Realization', 'Nightmare Escape', 'Peaceful Garden', 'Storm Watching',
        'Mirror Reflection', 'Childhood Memory', 'Future Vision', 'Past Life',
        'Animal Transformation', 'Superpowers', 'Invisible Journey', 'Music Dream',
        'Art Creation', 'Book Adventure', 'Movie Scene', 'Game World',
        'Memory Palace', 'Emotional Release', 'Spiritual Journey', 'Healing Dream'
    ];

    private readonly dreamElements = [
        'vivid colors', 'strange architecture', 'familiar faces', 'impossible physics',
        'emotional intensity', 'symbolic imagery', 'recurring themes', 'lucid moments',
        'time distortion', 'identity shifts', 'environmental changes', 'sensory details',
        'dialogue exchanges', 'movement sensations', 'temperature variations', 'lighting effects',
        'sound landscapes', 'texture experiences', 'taste memories', 'scent triggers',
        'emotional transitions', 'perspective shifts', 'reality blending', 'memory fragments'
    ];

    private readonly dreamDescriptors = [
        'incredibly detailed', 'mysteriously vague', 'emotionally charged', 'visually stunning',
        'surprisingly coherent', 'completely surreal', 'hauntingly beautiful', 'deeply symbolic',
        'remarkably vivid', 'strangely familiar', 'intensely personal', 'universally relatable',
        'psychologically revealing', 'spiritually meaningful', 'creatively inspiring', 'therapeutically healing'
    ];

    constructor() {
        this.random = Math.random; // Default to Math.random, can be seeded
    }

    /**
     * Generate a large dataset of realistic dream entries
     */
    async generateDreamDataset(options: GenerationOptions): Promise<{
        data: DreamMetricData[];
        stats: GenerationStats;
    }> {
        const startTime = performance.now();
        this.logger.debug('Starting dummy data generation', JSON.stringify(options));

        // Setup randomization seed if provided
        if (options.seed !== undefined) {
            this.setupSeededRandom(options.seed);
        }

        const {
            count,
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
            endDate = new Date(),
            realistic = true,
            sourcePrefix = 'perf-test',
            evenDistribution = false,
            includeMetrics = [
                'Sensory Detail', 'Emotional Recall', 'Lost Segments',
                'Lucidity', 'Vividness', 'Descriptiveness', 'Confidence Score'
            ]
        } = options;

        const data: DreamMetricData[] = [];
        const dateRange = endDate.getTime() - startDate.getTime();

        // Generate entries
        for (let i = 0; i < count; i++) {
            // Generate date
            let entryDate: Date;
            if (evenDistribution) {
                // Evenly distribute across date range
                const progress = i / (count - 1);
                entryDate = new Date(startDate.getTime() + progress * dateRange);
            } else {
                // Random distribution with slight bias toward recent dates
                const randomFactor = Math.pow(this.random(), 0.7); // Bias toward 1.0 (recent)
                entryDate = new Date(startDate.getTime() + randomFactor * dateRange);
            }

            // Generate entry
            const entry = realistic 
                ? this.generateRealisticEntry(i, entryDate, sourcePrefix, includeMetrics)
                : this.generateBasicEntry(i, entryDate, sourcePrefix, includeMetrics);

            data.push(entry);

            // Log progress for large datasets
            if (count > 1000 && i % 1000 === 0) {
                this.logger.debug(`Generated ${i}/${count} entries (${(i/count*100).toFixed(1)}%)`, 'progress');
            }
        }

        // Sort by date if needed
        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const generationTime = performance.now() - startTime;
        
        // Calculate statistics
        const stats: GenerationStats = {
            totalGenerated: data.length,
            generationTime,
            dateRange: {
                start: data[0]?.date || startDate.toISOString().split('T')[0],
                end: data[data.length - 1]?.date || endDate.toISOString().split('T')[0]
            },
            metricsIncluded: includeMetrics,
            averageMetrics: this.calculateAverageMetrics(data, includeMetrics)
        };

        this.logger.info('Dummy data generation complete', JSON.stringify(stats));
        return { data, stats };
    }

    /**
     * Generate realistic dream entry with varied content and metrics
     */
    private generateRealisticEntry(
        index: number,
        date: Date,
        sourcePrefix: string,
        metrics: string[]
    ): DreamMetricData {
        const dateStr = date.toISOString().split('T')[0];
        
        // Select random title and elements
        const title = this.dreamTitles[Math.floor(this.random() * this.dreamTitles.length)];
        const element1 = this.dreamElements[Math.floor(this.random() * this.dreamElements.length)];
        const element2 = this.dreamElements[Math.floor(this.random() * this.dreamElements.length)];
        const descriptor = this.dreamDescriptors[Math.floor(this.random() * this.dreamDescriptors.length)];

        // Generate realistic content with varying length
        const contentLength = this.generateRealisticLength();
        const content = this.generateRealisticContent(title, element1, element2, descriptor, contentLength);

        // Generate realistic metrics
        const entryMetrics: Record<string, number> = {};
        
        // Base metrics distribution with correlations
        const baseVividness = Math.floor(this.random() * 5) + 1;
        const isLucid = this.random() > 0.85; // ~15% lucid dreams
        
        metrics.forEach(metricName => {
            switch (metricName) {
                case 'Sensory Detail':
                    // Correlate with vividness
                    entryMetrics[metricName] = Math.max(1, Math.min(5, 
                        baseVividness + Math.floor((this.random() - 0.5) * 2)
                    ));
                    break;
                    
                case 'Emotional Recall':
                    // Independent but realistic distribution
                    entryMetrics[metricName] = Math.floor(this.random() * 5) + 1;
                    break;
                    
                case 'Lost Segments':
                    // Inverse correlation with confidence and vividness
                    const maxLost = Math.max(0, 5 - baseVividness);
                    entryMetrics[metricName] = Math.floor(this.random() * (maxLost + 1));
                    break;
                    
                case 'Lucidity':
                    entryMetrics[metricName] = isLucid ? 1 : 0;
                    break;
                    
                case 'Vividness':
                    entryMetrics[metricName] = baseVividness;
                    break;
                    
                case 'Descriptiveness':
                    // Correlate with content length
                    const lengthFactor = Math.min(5, Math.max(1, 
                        Math.floor(content.length / 50) + 1
                    ));
                    entryMetrics[metricName] = lengthFactor;
                    break;
                    
                case 'Confidence Score':
                    // Correlate with vividness and inverse with lost segments
                    const lostSegments = entryMetrics['Lost Segments'] || 0;
                    entryMetrics[metricName] = Math.max(1, Math.min(5,
                        baseVividness - lostSegments + Math.floor((this.random() - 0.5) * 2)
                    ));
                    break;
                    
                default:
                    // Generic metric generation
                    entryMetrics[metricName] = Math.floor(this.random() * 5) + 1;
            }
        });

        return {
            date: dateStr,
            title: `${title} #${index + 1}`,
            content,
            source: `${sourcePrefix}-entry-${index + 1}.md`,
            wordCount: this.calculateWordCount(content),
            metrics: entryMetrics
        };
    }

    /**
     * Generate basic entry for simple testing
     */
    private generateBasicEntry(
        index: number,
        date: Date,
        sourcePrefix: string,
        metrics: string[]
    ): DreamMetricData {
        const dateStr = date.toISOString().split('T')[0];
        const content = `Test dream entry ${index + 1} with some basic content for performance testing.`;
        
        const entryMetrics: Record<string, number> = {};
        metrics.forEach(metric => {
            entryMetrics[metric] = Math.floor(this.random() * 5) + 1;
        });

        return {
            date: dateStr,
            title: `Test Dream ${index + 1}`,
            content,
            source: `${sourcePrefix}-entry-${index + 1}.md`,
            wordCount: this.calculateWordCount(content),
            metrics: entryMetrics
        };
    }

    /**
     * Generate realistic content with varying length and detail
     */
    private generateRealisticContent(
        title: string,
        element1: string,
        element2: string,
        descriptor: string,
        targetLength: number
    ): string {
        const sentences = [
            `I found myself in a ${descriptor} dream about ${title.toLowerCase()}.`,
            `The experience featured ${element1} and ${element2}.`,
            `Throughout the dream, I noticed how ${element1} seemed to shift and change.`,
            `There was something particularly striking about ${element2} in this context.`,
            `The overall atmosphere was ${descriptor} and left a lasting impression.`,
            `Details about the environment included various sensory experiences.`,
            `The emotional tone of the dream fluctuated between different states.`,
            `I remember feeling surprised by how coherent the narrative seemed.`,
            `Certain aspects of the dream reminded me of real-life experiences.`,
            `The dream concluded with a sense of completion and understanding.`
        ];

        let content = '';
        let sentenceIndex = 0;
        
        while (content.length < targetLength && sentenceIndex < sentences.length * 2) {
            const sentence = sentences[sentenceIndex % sentences.length];
            content += sentence + ' ';
            sentenceIndex++;
        }

        return content.trim();
    }

    /**
     * Generate realistic content length with distribution similar to real dreams
     */
    private generateRealisticLength(): number {
        // Most dreams are 50-200 words, with some longer entries
        const baseLength = 50 + Math.floor(this.random() * 150);
        
        // 20% chance of longer entry (200-500 words)
        if (this.random() > 0.8) {
            return baseLength + Math.floor(this.random() * 300);
        }
        
        // 5% chance of very short entry (20-50 words)
        if (this.random() > 0.95) {
            return 20 + Math.floor(this.random() * 30);
        }
        
        return baseLength;
    }

    /**
     * Calculate word count for content
     */
    private calculateWordCount(content: string): number {
        return content.trim().split(/\s+/).length;
    }

    /**
     * Calculate average metrics across all entries
     */
    private calculateAverageMetrics(
        data: DreamMetricData[],
        metricNames: string[]
    ): Record<string, number> {
        const averages: Record<string, number> = {};
        
        metricNames.forEach(metricName => {
            const values = data
                .map(entry => entry.metrics[metricName] as number)
                .filter(value => typeof value === 'number');
                
            if (values.length > 0) {
                averages[metricName] = values.reduce((sum, val) => sum + val, 0) / values.length;
            }
        });
        
        return averages;
    }

    /**
     * Setup seeded random number generator for reproducible results
     */
    private setupSeededRandom(seed: number): void {
        // Simple seeded PRNG for reproducible testing
        let currentSeed = seed;
        this.random = () => {
            currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
            return currentSeed / 4294967296;
        };
    }

    /**
     * Quick generation presets for common testing scenarios
     */
    static createPreset(preset: 'small' | 'medium' | 'large' | 'xlarge' | 'stress'): GenerationOptions {
        switch (preset) {
            case 'small':
                return { count: 500, realistic: true, evenDistribution: true };
            case 'medium':
                return { count: 1000, realistic: true };
            case 'large':
                return { count: 5000, realistic: true };
            case 'xlarge':
                return { count: 10000, realistic: false }; // Use basic for speed
            case 'stress':
                return { count: 50000, realistic: false }; // Basic for stress testing
            default:
                return { count: 1000, realistic: true };
        }
    }
}

/**
 * Performance testing utility with dummy data generation
 */
export class PerformanceTestRunner {
    private generator = new DummyDataGenerator();
    private logger = getLogger('PerformanceTestRunner');

    /**
     * Run performance test with generated dataset
     */
    async runPerformanceTest<T>(
        testName: string,
        datasetSize: number,
        testFunction: (data: DreamMetricData[]) => Promise<T>,
        options: Partial<GenerationOptions> = {}
    ): Promise<{
        result: T;
        generationStats: GenerationStats;
        executionTime: number;
        throughput: number; // entries per second
    }> {
        this.logger.info(`Starting performance test: ${testName}`, JSON.stringify({ datasetSize }));

        // Generate test dataset
        const { data, stats } = await this.generator.generateDreamDataset({
            count: datasetSize,
            ...options
        });

        // Run test function
        const executionStart = performance.now();
        const result = await testFunction(data);
        const executionTime = performance.now() - executionStart;

        const throughput = Math.round(datasetSize / (executionTime / 1000));

        this.logger.info(`Performance test complete: ${testName}`, JSON.stringify({
            datasetSize,
            executionTime,
            throughput,
            generationTime: stats.generationTime
        }));

        return {
            result,
            generationStats: stats,
            executionTime,
            throughput
        };
    }

    /**
     * Run scaling test across multiple dataset sizes
     */
    async runScalingTest<T>(
        testName: string,
        sizes: number[],
        testFunction: (data: DreamMetricData[]) => Promise<T>,
        options: Partial<GenerationOptions> = {}
    ): Promise<{
        results: Array<{
            size: number;
            result: T;
            executionTime: number;
            throughput: number;
        }>;
    }> {
        this.logger.info(`Starting scaling test: ${testName}`, JSON.stringify({ sizes }));

        const results = [];
        
        for (const size of sizes) {
            const testResult = await this.runPerformanceTest(
                `${testName} (${size} entries)`,
                size,
                testFunction,
                options
            );
            
            results.push({
                size,
                result: testResult.result,
                executionTime: testResult.executionTime,
                throughput: testResult.throughput
            });
        }

        this.logger.info('Scaling test completed', JSON.stringify({ 
            testName, 
            sizes: sizes.join(','), 
            scalingFactor: sizes.length,
            resultCount: results.length
        }));

        return { results };
    }
} 