import type { DreamMetricData } from '../../types/core';
import type { PatternVisualization } from './PatternCalculator';

/**
 * Generates rich tooltips for dream patterns and metrics
 */
export class PatternTooltips {
    
    /**
     * Generate a comprehensive tooltip for a dream entry with patterns
     */
    generateTooltip(entry: DreamMetricData, patterns: PatternVisualization[]): string {
        if (patterns.length === 0) {
            return this.generateBasicTooltip(entry);
        }
        
        const primaryPattern = patterns[0];
        const sections: string[] = [];
        
        // Dream basic info
        sections.push(this.generateBasicInfo(entry));
        
        // Pattern information
        sections.push(this.generatePatternInfo(primaryPattern));
        
        // Metrics breakdown
        sections.push(this.generateMetricsBreakdown(entry, primaryPattern));
        
        // Combine sections
        return sections.join('<br/><br/>');
    }
    
    /**
     * Generate a simple tooltip for entries without patterns
     */
    generateBasicTooltip(entry: DreamMetricData): string {
        const title = entry.title || 'Dream Entry';
        const date = new Date(entry.date).toLocaleDateString();
        
        return `<strong>${title}</strong><br/>${date}`;
    }
    
    /**
     * Create and attach tooltip to a calendar day element
     */
    attachTooltip(dayElement: HTMLElement, entry: DreamMetricData, patterns: PatternVisualization[]): void {
        // Remove existing tooltip
        this.removeTooltip(dayElement);
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'oomp-pattern-tooltip';
        tooltip.innerHTML = this.generateTooltip(entry, patterns);
        
        // Style tooltip
        this.styleTooltip(tooltip);
        
        // Add to day element
        dayElement.appendChild(tooltip);
        
        // Position tooltip on hover
        this.setupTooltipEvents(dayElement, tooltip);
    }
    
    /**
     * Remove tooltip from element
     */
    removeTooltip(dayElement: HTMLElement): void {
        const existing = dayElement.querySelector('.oomp-pattern-tooltip');
        if (existing) {
            existing.remove();
        }
    }
    
    /**
     * Generate basic dream entry information
     */
    private generateBasicInfo(entry: DreamMetricData): string {
        const title = entry.title || 'Dream Entry';
        const date = new Date(entry.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        return `<strong class="oomp-tooltip-title">${title}</strong><br/>
                <span class="oomp-tooltip-date">${date}</span>`;
    }
    
    /**
     * Generate pattern classification information
     */
    private generatePatternInfo(pattern: PatternVisualization): string {
        const patternLabels = {
            'high-quality': '✨ High Quality Dream',
            'fragmented': '🧩 Fragmented Dream',
            'rich-narrative': '📖 Rich Narrative Dream',
            'basic-recall': '💭 Basic Recall'
        };
        
        const patternDescriptions = {
            'high-quality': 'Vivid sensory details and strong emotional recall',
            'fragmented': 'Many lost segments, unclear narrative flow',
            'rich-narrative': 'Highly descriptive with clear story progression',
            'basic-recall': 'Standard dream recall with moderate detail'
        };
        
        const label = patternLabels[pattern.basePattern];
        const description = patternDescriptions[pattern.basePattern];
        
        return `<span class="oomp-tooltip-pattern">${label}</span><br/>
                <span class="oomp-tooltip-pattern-desc">${description}</span>`;
    }
    
    /**
     * Generate detailed metrics breakdown
     */
    private generateMetricsBreakdown(entry: DreamMetricData, pattern: PatternVisualization): string {
        const metrics = this.extractAvailableMetrics(entry);
        
        if (Object.keys(metrics).length === 0) {
            return '<span class="oomp-tooltip-no-metrics">No metrics available</span>';
        }
        
        const metricLines: string[] = [];
        
        // Format each available metric
        Object.entries(metrics).forEach(([name, value]) => {
            const formattedValue = this.formatMetricValue(name, value);
            const bar = this.createMetricBar(name, value);
            metricLines.push(`<span class="oomp-tooltip-metric">
                ${name}: ${formattedValue} ${bar}
            </span>`);
        });
        
        // Add calculated scores
        metricLines.push(`<span class="oomp-tooltip-calculated">
            Quality Score: ${this.formatScore(pattern.qualityScore)}
        </span>`);
        
        if (pattern.fragmentationLevel > 0.1) {
            metricLines.push(`<span class="oomp-tooltip-calculated">
                Fragmentation: ${this.formatScore(pattern.fragmentationLevel)}
            </span>`);
        }
        
        return metricLines.join('<br/>');
    }
    
    /**
     * Extract available metrics from dream entry
     */
    private extractAvailableMetrics(entry: DreamMetricData): Record<string, number> {
        const metrics: Record<string, number> = {};
        
        if (!entry.metrics || typeof entry.metrics !== 'object') {
            return metrics;
        }
        
        // Default metrics to display
        const defaultMetrics = [
            'Sensory Detail',
            'Emotional Recall', 
            'Lost Segments',
            'Descriptiveness',
            'Confidence Score'
        ];
        
        defaultMetrics.forEach(metricName => {
            const value = entry.metrics[metricName];
            if (typeof value === 'number') {
                metrics[metricName] = value;
            }
        });
        
        return metrics;
    }
    
    /**
     * Format metric value for display
     */
    private formatMetricValue(metricName: string, value: number): string {
        // Special formatting for Lost Segments (higher is worse)
        if (metricName === 'Lost Segments') {
            return `${value}`;
        }
        
        // Standard 1-5 scale metrics
        return `${value}/5`;
    }
    
    /**
     * Create visual bar representation of metric value
     */
    private createMetricBar(metricName: string, value: number): string {
        let maxValue = 5;
        let normalizedValue = value;
        
        // Handle Lost Segments (0-10 scale, lower is better)
        if (metricName === 'Lost Segments') {
            maxValue = 10;
            // Invert for visualization (lower lost segments = better)
            normalizedValue = Math.max(0, 10 - value);
        }
        
        const percentage = Math.min(100, (normalizedValue / maxValue) * 100);
        const barColor = this.getMetricBarColor(metricName, normalizedValue, maxValue);
        
        return `<span class="oom-tooltip-bar">
            <span class="oom-tooltip-bar-fill" style="--bar-width: ${percentage}%; --bar-color: ${barColor};"></span>
        </span>`;
    }
    
    /**
     * Get color for metric bar based on value
     */
    private getMetricBarColor(metricName: string, value: number, maxValue: number): string {
        const ratio = value / maxValue;
        
        // Lost Segments uses inverted logic (lower is better)
        if (metricName === 'Lost Segments') {
            if (ratio > 0.7) return '#43b581'; // Good (low lost segments)
            if (ratio > 0.4) return '#faa61a'; // Medium
            return '#f04747'; // Poor (high lost segments)
        }
        
        // Standard metrics (higher is better)
        if (ratio > 0.7) return '#43b581'; // Good
        if (ratio > 0.4) return '#faa61a'; // Medium  
        return '#f04747'; // Poor
    }
    
    /**
     * Format calculated score (0-1 range) for display
     */
    private formatScore(score: number): string {
        const percentage = Math.round(score * 100);
        return `${percentage}%`;
    }
    
    /**
     * Apply styling to tooltip element
     */
    private styleTooltip(tooltip: HTMLElement): void {
        // Use existing CSS class for all tooltip styling
        tooltip.className = 'oomp-pattern-tooltip';
    }
    
    /**
     * Setup hover events for tooltip visibility
     */
    private setupTooltipEvents(dayElement: HTMLElement, tooltip: HTMLElement): void {
        dayElement.addEventListener('mouseenter', () => {
            tooltip.classList.add('oom-tooltip-visible');
            
            // Adjust position if tooltip would go off screen
            const rect = tooltip.getBoundingClientRect();
            if (rect.left < 0) {
                tooltip.classList.add('oom-tooltip-left');
                tooltip.classList.remove('oom-tooltip-right');
            } else if (rect.right > window.innerWidth) {
                tooltip.classList.add('oom-tooltip-right');
                tooltip.classList.remove('oom-tooltip-left');
            }
        });
        
        dayElement.addEventListener('mouseleave', () => {
            tooltip.classList.remove('oom-tooltip-visible');
        });
        
        // Additional arrow pointer
        this.addTooltipArrow(tooltip);
    }
    
    /**
     * Add arrow pointer to tooltip
     */
    private addTooltipArrow(tooltip: HTMLElement): void {
        const arrow = document.createElement('div');
        arrow.className = 'oomp-tooltip-arrow';
        
        tooltip.appendChild(arrow);
    }
} 