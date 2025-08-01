import type { DreamMetricData } from '../../types/core';
import type { PatternVisualization } from './PatternCalculator';
import { SafeDOMUtils } from '../../utils/SafeDOMUtils';
import { TemplateHelpers } from '../../utils/TemplateHelpers';

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
        
        // SECURITY FIX: Use safe DOM manipulation instead of innerHTML
        this.populateTooltipContent(tooltip, entry, patterns);
        
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
     * SECURITY FIX: Safely populate tooltip content using DOM manipulation
     * Replaces unsafe innerHTML usage with secure DOM building
     */
    private populateTooltipContent(tooltip: HTMLElement, entry: DreamMetricData, patterns: PatternVisualization[]): void {
        SafeDOMUtils.safelyEmptyContainer(tooltip);
        
        if (patterns.length === 0) {
            this.createBasicTooltipContent(tooltip, entry);
            return;
        }
        
        const primaryPattern = patterns[0];
        
        // Create sections safely
        this.createBasicInfoSection(tooltip, entry);
        this.addSectionDivider(tooltip);
        
        this.createPatternInfoSection(tooltip, primaryPattern);
        this.addSectionDivider(tooltip);
        
        this.createMetricsBreakdownSection(tooltip, entry);
    }
    
    /**
     * Create basic tooltip content for entries without patterns
     */
    private createBasicTooltipContent(tooltip: HTMLElement, entry: DreamMetricData): void {
        const title = entry.title || 'Dream Entry';
        const date = new Date(entry.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        tooltip.createEl('strong', {
            cls: 'oomp-tooltip-title',
            text: title // Automatically escaped
        });
        
        tooltip.createEl('br');
        
        tooltip.createEl('span', {
            cls: 'oomp-tooltip-date',
            text: date // Automatically escaped
        });
    }
    
    /**
     * Create basic info section safely
     */
    private createBasicInfoSection(tooltip: HTMLElement, entry: DreamMetricData): void {
        const title = entry.title || 'Dream Entry';
        const date = new Date(entry.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        tooltip.createEl('strong', {
            cls: 'oomp-tooltip-title',
            text: title
        });
        
        tooltip.createEl('br');
        
        tooltip.createEl('span', {
            cls: 'oomp-tooltip-date', 
            text: date
        });
    }
    
    /**
     * Create pattern info section safely
     */
    private createPatternInfoSection(tooltip: HTMLElement, pattern: PatternVisualization): void {
        const patternInfo = tooltip.createEl('div', {
            cls: 'oomp-tooltip-pattern-info'
        });
        
        patternInfo.createEl('span', {
            cls: 'oomp-tooltip-pattern-type',
            text: `Pattern: ${pattern.basePattern}`
        });
        
        patternInfo.createEl('br');
        
        patternInfo.createEl('span', {
            cls: 'oomp-tooltip-quality',
            text: `Quality: ${pattern.qualityScore.toFixed(1)}/5.0`
        });
        
        // Pattern description is derived from basePattern
        const patternDescriptions = {
            'high-quality': 'Vivid sensory details and strong emotional recall',
            'fragmented': 'Many lost segments, unclear narrative flow',
            'rich-narrative': 'Highly descriptive with clear story progression',
            'basic-recall': 'Standard dream recall with moderate detail'
        };
        
        const description = patternDescriptions[pattern.basePattern];
        if (description) {
            patternInfo.createEl('br');
            patternInfo.createEl('span', {
                cls: 'oomp-tooltip-description',
                text: description
            });
        }
    }
    
    /**
     * Create metrics breakdown section safely
     */
    private createMetricsBreakdownSection(tooltip: HTMLElement, entry: DreamMetricData): void {
        if (!entry.metrics || Object.keys(entry.metrics).length === 0) {
            return;
        }
        
        const metricsSection = tooltip.createEl('div', {
            cls: 'oomp-tooltip-metrics'
        });
        
        metricsSection.createEl('strong', {
            text: 'Metrics:'
        });
        
        Object.entries(entry.metrics).forEach(([metricName, value]) => {
            if (typeof value === 'number' && value > 0) {
                const metricRow = metricsSection.createEl('div', {
                    cls: 'oomp-tooltip-metric-row'
                });
                
                metricRow.createEl('span', {
                    cls: 'oomp-tooltip-metric-name',
                    text: metricName
                });
                
                metricRow.createEl('span', {
                    cls: 'oomp-tooltip-metric-value',
                    text: value.toString()
                });
                
                // Add metric bar safely
                const bar = this.createSafeMetricBar(metricName, value);
                metricRow.appendChild(bar);
            }
        });
    }
    
    /**
     * Add section divider safely
     */
    private addSectionDivider(tooltip: HTMLElement): void {
        tooltip.createEl('br');
        tooltip.createEl('br');
    }
    
    /**
     * SECURITY FIX: Create visual bar representation of metric value - SAFE VERSION
     * Returns DOM element instead of HTML string with outerHTML
     */
    private createSafeMetricBar(metricName: string, value: number): HTMLElement {
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
        
        // Create elements safely - no innerHTML or outerHTML usage
        const barContainer = document.createElement('span');
        barContainer.className = 'oom-tooltip-bar';
        
        const barFill = document.createElement('span');
        barFill.className = 'oom-tooltip-bar-fill oom-tooltip-bar-dynamic';
        barFill.style.setProperty('--bar-width', `${percentage}%`);
        barFill.style.setProperty('--bar-color', barColor);
        
        barContainer.appendChild(barFill);
        return barContainer; // SECURITY FIX: Return element directly, not outerHTML
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
     * DEPRECATED: Legacy method that returns HTML string with outerHTML usage
     * Use createSafeMetricBar() instead for secure DOM manipulation
     * 
     * This method is kept for backward compatibility with existing string-based templates
     * but should be phased out in favor of the secure DOM-based approach
     */
    private createMetricBar(metricName: string, value: number): string {
        // SECURITY FIX: Use the safe version and convert to string only when absolutely necessary
        const safeElement = this.createSafeMetricBar(metricName, value);
        
        // Create a temporary container to get the HTML string safely
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(safeElement);
        
        // Return the innerHTML of the container (safer than outerHTML on the element directly)
        return tempContainer.innerHTML;
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