import type { PatternVisualization, PatternIndicatorType } from './PatternCalculator';
import type { EnhancedNavigationState } from '../modals/EnhancedDateNavigatorModal';

/**
 * Renders dream pattern visualizations on calendar days based on the selected visualization style
 */
export class PatternRenderer {
    private visualizationStyle: EnhancedNavigationState['visualizationStyle'];
    
    constructor(visualizationStyle: EnhancedNavigationState['visualizationStyle']) {
        this.visualizationStyle = visualizationStyle;
    }
    
    /**
     * Update the visualization style
     */
    updateVisualizationStyle(style: EnhancedNavigationState['visualizationStyle']): void {
        this.visualizationStyle = style;
    }
    
    /**
     * Render pattern indicators on a calendar day element
     */
    renderDayIndicators(dayElement: HTMLElement, patterns: PatternVisualization[]): void {
        // Clear existing pattern indicators
        this.clearPatternIndicators(dayElement);
        
        if (patterns.length === 0) return;
        
        switch (this.visualizationStyle) {
            case 'composite-dots':
                this.renderCompositeDots(dayElement, patterns);
                break;
            case 'quality-gradients':
                this.renderQualityGradients(dayElement, patterns);
                break;
            case 'multi-layer':
                this.renderMultiLayer(dayElement, patterns);
                break;
            case 'minimalist-icons':
                this.renderMinimalistIcons(dayElement, patterns);
                break;
        }
    }
    
    /**
     * Generate a legend for the current visualization style
     */
    createLegend(activePatterns: Set<string>): HTMLElement {
        const legend = document.createElement('div');
        legend.className = 'oomp-pattern-legend';
        
        const title = legend.createDiv({ cls: 'oomp-legend-title', text: 'Dream Patterns' });
        const items = legend.createDiv({ cls: 'oomp-legend-items' });
        
        switch (this.visualizationStyle) {
            case 'composite-dots':
                this.createCompositeDotLegend(items, activePatterns);
                break;
            case 'quality-gradients':
                this.createQualityGradientLegend(items, activePatterns);
                break;
            case 'multi-layer':
                this.createMultiLayerLegend(items, activePatterns);
                break;
            case 'minimalist-icons':
                this.createMinimalistIconLegend(items, activePatterns);
                break;
        }
        
        return legend;
    }
    
    /**
     * Clear existing pattern indicators from a day element
     */
    private clearPatternIndicators(dayElement: HTMLElement): void {
        // Remove pattern-specific classes
        dayElement.classList.remove(
            'oomp-pattern-high-quality',
            'oomp-pattern-fragmented',
            'oomp-pattern-rich-narrative',
            'oomp-pattern-basic-recall',
            'oomp-quality-high',
            'oomp-quality-medium',
            'oomp-quality-low'
        );
        
        // Remove pattern indicator elements
        const indicators = dayElement.querySelectorAll('.oomp-pattern-indicator, .oomp-metric-overlay, .oomp-pattern-icon');
        indicators.forEach(indicator => indicator.remove());
        
        // Clear background gradients
        dayElement.style.setProperty('--pattern-background', '');
    }
    
    /**
     * Approach A: Composite Pattern Dots
     */
    private renderCompositeDots(dayElement: HTMLElement, patterns: PatternVisualization[]): void {
        // Use the primary pattern (first in array)
        const primaryPattern = patterns[0];
        if (!primaryPattern) return;
        
        // Add pattern class for additional styling
        dayElement.classList.add(`oomp-pattern-${primaryPattern.basePattern}`);
        
        // Create pattern indicator dot
        const indicator = dayElement.createDiv({ cls: 'oomp-pattern-indicator' });
        indicator.style.setProperty('--pattern-color', primaryPattern.visualStyle.color);
        indicator.style.setProperty('--pattern-opacity', primaryPattern.visualStyle.opacity.toString());
    }
    
    /**
     * Approach B: Quality Gradients
     */
    private renderQualityGradients(dayElement: HTMLElement, patterns: PatternVisualization[]): void {
        const primaryPattern = patterns[0];
        if (!primaryPattern) return;
        
        // Apply quality class based on quality score
        const qualityLevel = this.getQualityLevel(primaryPattern.qualityScore);
        dayElement.classList.add(`oomp-quality-${qualityLevel}`);
        
        // Apply background gradient
        if (primaryPattern.visualStyle.backgroundGradient) {
            dayElement.style.setProperty('--pattern-background', primaryPattern.visualStyle.backgroundGradient);
        }
        
        // Add quality score indicator in bottom-right
        const scoreIndicator = dayElement.createDiv({ cls: 'oomp-quality-score' });
        scoreIndicator.textContent = Math.round(primaryPattern.qualityScore * 5).toString();
    }
    
    /**
     * Approach C: Multi-Layer Visualization
     */
    private renderMultiLayer(dayElement: HTMLElement, patterns: PatternVisualization[]): void {
        const primaryPattern = patterns[0];
        if (!primaryPattern) return;
        
        // Apply quality gradient background
        const qualityLevel = this.getQualityLevel(primaryPattern.qualityScore);
        dayElement.classList.add(`oomp-quality-${qualityLevel}`);
        if (primaryPattern.visualStyle.backgroundGradient) {
            dayElement.style.setProperty('--pattern-background', primaryPattern.visualStyle.backgroundGradient);
        }
        
        // Create metric overlay grid
        const overlay = dayElement.createDiv({ cls: 'oomp-metric-overlay' });
        // Grid layout and positioning handled by CSS class
        
        // Add metric dots (using normalized scores for opacity)
        const metrics = [
            { name: 'sensory', color: '#7c3aed', opacity: primaryPattern.qualityScore },
            { name: 'emotional', color: '#06d6a0', opacity: primaryPattern.qualityScore },
            { name: 'fragmentation', color: '#f72585', opacity: primaryPattern.fragmentationLevel },
            { name: 'descriptiveness', color: '#f77f00', opacity: (primaryPattern.descriptiveness - 1) / 4 }
        ];
        
        metrics.forEach(metric => {
            const dot = overlay.createDiv({ cls: `oomp-metric-dot oomp-${metric.name}` });
            dot.style.setProperty('--metric-color', metric.color);
            dot.style.setProperty('--metric-opacity', Math.max(0.2, metric.opacity).toString());
        });
    }
    
    /**
     * Approach D: Minimalist Icons
     */
    private renderMinimalistIcons(dayElement: HTMLElement, patterns: PatternVisualization[]): void {
        const primaryPattern = patterns[0];
        if (!primaryPattern) return;
        
        // Add pattern class
        dayElement.classList.add(`oomp-pattern-${primaryPattern.basePattern}`);
        
        // Get icon for pattern
        const icon = this.getPatternIcon(primaryPattern.basePattern);
        
        // Create icon element
        const iconElement = dayElement.createDiv({ cls: 'oomp-pattern-icon' });
        iconElement.textContent = icon;
        // Positioning handled by CSS class
        iconElement.style.setProperty('--pattern-opacity', primaryPattern.visualStyle.opacity.toString());
        iconElement.style.setProperty('--pattern-color', primaryPattern.visualStyle.color);
    }
    
    /**
     * Get quality level classification from quality score
     */
    private getQualityLevel(qualityScore: number): 'low' | 'medium' | 'high' {
        if (qualityScore > 0.66) return 'high';
        if (qualityScore > 0.33) return 'medium';
        return 'low';
    }
    
    /**
     * Get emoji icon for pattern type
     */
    private getPatternIcon(pattern: PatternVisualization['basePattern']): string {
        const icons = {
            'high-quality': '✨',
            'fragmented': '🧩', 
            'rich-narrative': '📖',
            'basic-recall': '💭'
        };
        return icons[pattern];
    }
    
    /**
     * Create legend for composite dots approach
     */
    private createCompositeDotLegend(container: HTMLElement, activePatterns: Set<string>): void {
        const patterns = [
            { key: 'high-quality', label: 'High Quality Dreams', color: '#43b581' },
            { key: 'fragmented', label: 'Fragmented Dreams', color: '#f04747' },
            { key: 'rich-narrative', label: 'Rich Narrative Dreams', color: '#7289da' },
            { key: 'basic-recall', label: 'Basic Recall', color: '#faa61a' }
        ];
        
        patterns.forEach(pattern => {
            if (activePatterns.has(pattern.key)) {
                const item = container.createDiv({ cls: 'oomp-legend-item' });
                const dot = item.createDiv({ cls: 'oomp-legend-dot' });
                dot.style.setProperty('--legend-color', pattern.color);
                item.createSpan({ text: pattern.label });
            }
        });
    }
    
    /**
     * Create legend for quality gradients approach
     */
    private createQualityGradientLegend(container: HTMLElement, activePatterns: Set<string>): void {
        const levels = [
            { key: 'high', label: 'High Quality (4-5)', color: '#43b581' },
            { key: 'medium', label: 'Medium Quality (2-3)', color: '#faa61a' },
            { key: 'low', label: 'Low Quality (1-2)', color: '#f04747' }
        ];
        
        levels.forEach(level => {
            const item = container.createDiv({ cls: 'oomp-legend-item' });
            const gradient = item.createDiv({ cls: 'oomp-legend-gradient' });
            gradient.style.width = '16px';
            gradient.style.height = '12px';
            gradient.style.background = `linear-gradient(135deg, ${level.color}40, ${level.color}10)`;
            item.createSpan({ text: level.label });
        });
    }
    
    /**
     * Create legend for multi-layer approach
     */
    private createMultiLayerLegend(container: HTMLElement, activePatterns: Set<string>): void {
        const metrics = [
            { key: 'sensory', label: 'Sensory Detail', color: '#7c3aed' },
            { key: 'emotional', label: 'Emotional Recall', color: '#06d6a0' },
            { key: 'fragmentation', label: 'Lost Segments', color: '#f72585' },
            { key: 'descriptiveness', label: 'Descriptiveness', color: '#f77f00' }
        ];
        
        metrics.forEach(metric => {
            const item = container.createDiv({ cls: 'oomp-legend-item' });
            const dot = item.createDiv({ cls: 'oomp-legend-dot' });
            dot.style.width = '8px';
            dot.style.height = '8px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = metric.color;
            item.createSpan({ text: metric.label });
        });
    }
    
    /**
     * Create legend for minimalist icons approach
     */
    private createMinimalistIconLegend(container: HTMLElement, activePatterns: Set<string>): void {
        const patterns = [
            { key: 'high-quality', label: 'High Quality Dreams', icon: '✨' },
            { key: 'fragmented', label: 'Fragmented Dreams', icon: '🧩' },
            { key: 'rich-narrative', label: 'Rich Narrative Dreams', icon: '📖' },
            { key: 'basic-recall', label: 'Basic Recall', icon: '💭' }
        ];
        
        patterns.forEach(pattern => {
            if (activePatterns.has(pattern.key)) {
                const item = container.createDiv({ cls: 'oomp-legend-item' });
                const icon = item.createDiv({ cls: 'oomp-legend-icon' });
                icon.textContent = pattern.icon;
                icon.style.fontSize = '16px';
                item.createSpan({ text: pattern.label });
            }
        });
    }
} 