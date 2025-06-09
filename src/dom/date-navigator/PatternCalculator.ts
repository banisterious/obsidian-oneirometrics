import type { DreamMetricData } from '../../types/core';

export interface PatternVisualization {
    // Base pattern from default metrics analysis
    basePattern: 'high-quality' | 'fragmented' | 'rich-narrative' | 'basic-recall';
    
    // Component scores from default metrics
    qualityScore: number;      // From Sensory Detail + Emotional Recall + Confidence Score
    fragmentationLevel: number; // From Lost Segments + (inverted) Confidence Score
    descriptiveness: number;   // From Descriptiveness metric
    
    // Dynamic enhancements when available (future expansion)
    lucidity?: boolean;        // When Lucidity Level metric enabled
    characterDensity?: 'low' | 'medium' | 'high'; // When character metrics enabled
    
    // Visual representation data
    visualStyle: {
        indicator: PatternIndicatorType;
        backgroundGradient?: string; // Quality-based
        opacity: number;             // Based on confidence
        color: string;               // Pattern-specific color
    };
}

export type PatternIndicatorType = 
    | 'composite-dot'     // Small colored dot for pattern
    | 'quality-gradient'  // Background gradient
    | 'multi-layer'       // Multiple small indicators
    | 'minimalist-icon';  // Emoji/icon representation

/**
 * Calculates dream patterns from metric data using the default metrics:
 * - Sensory Detail (1-5)
 * - Emotional Recall (1-5) 
 * - Lost Segments (0-10, lower is better)
 * - Descriptiveness (1-5)
 * - Confidence Score (1-5)
 */
export class PatternCalculator {
    private readonly qualityMetrics = ['Sensory Detail', 'Emotional Recall', 'Confidence Score'];
    private readonly narrativeMetrics = ['Descriptiveness'];
    private readonly fragmentationMetrics = ['Lost Segments'];
    
    /**
     * Analyze a dream entry and determine its primary pattern
     */
    calculateBasePattern(entry: DreamMetricData): PatternVisualization {
        const metrics = this.extractDefaultMetrics(entry);
        
        // Calculate component scores
        const qualityScore = this.calculateQualityScore(metrics);
        const fragmentationLevel = this.calculateFragmentationLevel(metrics);
        const descriptiveness = this.getMetricValue(entry, 'Descriptiveness', 2.5);
        
        // Determine base pattern using thresholds
        const basePattern = this.classifyPattern(qualityScore, fragmentationLevel, descriptiveness);
        
        // Generate visual style
        const visualStyle = this.generateVisualStyle(basePattern, qualityScore, metrics.confidence);
        
        return {
            basePattern,
            qualityScore,
            fragmentationLevel,
            descriptiveness,
            visualStyle
        };
    }
    
    /**
     * Extract default metrics from dream entry with fallback values
     */
    private extractDefaultMetrics(entry: DreamMetricData): {
        sensoryDetail: number;
        emotionalRecall: number;
        lostSegments: number;
        descriptiveness: number;
        confidence: number;
    } {
        return {
            sensoryDetail: this.getMetricValue(entry, 'Sensory Detail', 2.5),
            emotionalRecall: this.getMetricValue(entry, 'Emotional Recall', 2.5),
            lostSegments: this.getMetricValue(entry, 'Lost Segments', 3), // 0-10 scale, 3 is moderate
            descriptiveness: this.getMetricValue(entry, 'Descriptiveness', 2.5),
            confidence: this.getMetricValue(entry, 'Confidence Score', 2.5)
        };
    }
    
    /**
     * Get metric value with fallback for missing metrics
     */
    private getMetricValue(entry: DreamMetricData, metricName: string, fallback: number): number {
        if (!entry.metrics || typeof entry.metrics !== 'object') {
            return fallback;
        }
        
        const value = entry.metrics[metricName];
        return typeof value === 'number' ? value : fallback;
    }
    
    /**
     * Calculate quality score from sensory, emotional, and confidence metrics
     * Returns normalized 0-1 score
     */
    private calculateQualityScore(metrics: any): number {
        const { sensoryDetail, emotionalRecall, confidence } = metrics;
        
        // Average the three quality metrics and normalize to 0-1
        const average = (sensoryDetail + emotionalRecall + confidence) / 3;
        return (average - 1) / 4; // Convert 1-5 scale to 0-1
    }
    
    /**
     * Calculate fragmentation level from lost segments and confidence
     * Returns normalized 0-1 score (higher = more fragmented)
     */
    private calculateFragmentationLevel(metrics: any): number {
        const { lostSegments, confidence } = metrics;
        
        // Lost segments: 0-10 scale, normalize to 0-1
        const normalizedLostSegments = Math.min(lostSegments / 10, 1);
        
        // Low confidence suggests fragmentation, invert and normalize
        const confidenceFragmentation = (5 - confidence) / 4; // 1-5 becomes 0-1
        
        // Weighted combination: lost segments more important
        return (normalizedLostSegments * 0.7) + (confidenceFragmentation * 0.3);
    }
    
    /**
     * Classify dream pattern based on calculated scores
     */
    private classifyPattern(qualityScore: number, fragmentationLevel: number, descriptiveness: number): PatternVisualization['basePattern'] {
        const normalizedDescriptiveness = (descriptiveness - 1) / 4; // Convert 1-5 to 0-1
        
        // High fragmentation = fragmented pattern
        if (fragmentationLevel > 0.6) {
            return 'fragmented';
        }
        
        // High quality + high descriptiveness = high quality
        if (qualityScore > 0.7 && normalizedDescriptiveness > 0.6) {
            return 'high-quality';
        }
        
        // High descriptiveness but moderate quality = rich narrative
        if (normalizedDescriptiveness > 0.7) {
            return 'rich-narrative';
        }
        
        // Everything else = basic recall
        return 'basic-recall';
    }
    
    /**
     * Generate visual styling based on pattern and metrics
     */
    private generateVisualStyle(
        pattern: PatternVisualization['basePattern'], 
        qualityScore: number, 
        confidence: number
    ): PatternVisualization['visualStyle'] {
        const opacity = Math.max(0.3, confidence / 5); // Minimum 30% opacity
        
        const styles = {
            'high-quality': {
                indicator: 'composite-dot' as PatternIndicatorType,
                color: '#43b581', // Green
                backgroundGradient: `linear-gradient(135deg, rgba(67, 181, 129, ${0.2 * qualityScore}), rgba(67, 181, 129, ${0.05 * qualityScore}))`
            },
            'fragmented': {
                indicator: 'composite-dot' as PatternIndicatorType,
                color: '#f04747', // Red
                backgroundGradient: `linear-gradient(135deg, rgba(240, 71, 71, 0.2), rgba(240, 71, 71, 0.05))`
            },
            'rich-narrative': {
                indicator: 'composite-dot' as PatternIndicatorType,
                color: '#7289da', // Blue
                backgroundGradient: `linear-gradient(135deg, rgba(114, 137, 218, 0.2), rgba(114, 137, 218, 0.05))`
            },
            'basic-recall': {
                indicator: 'composite-dot' as PatternIndicatorType,
                color: '#faa61a', // Orange
                backgroundGradient: `linear-gradient(135deg, rgba(250, 166, 26, 0.15), rgba(250, 166, 26, 0.03))`
            }
        };
        
        const style = styles[pattern];
        return {
            ...style,
            opacity
        };
    }
    
    /**
     * Future enhancement: Add optional metrics when they become available
     */
    enhanceWithOptionalMetrics(base: PatternVisualization, entry: DreamMetricData): PatternVisualization {
        // TODO: Implement when optional metrics integration is needed
        // - Lucidity Level → lucidity boolean
        // - Character metrics → characterDensity
        // - Custom metrics → additional pattern modifiers
        
        return base;
    }
} 