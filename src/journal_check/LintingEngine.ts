import DreamMetricsPlugin from '../../main';
import { LintingSettings, LintingRule, ValidationResult, CalloutStructure, JournalTemplate, QuickFix, CalloutBlock } from './types';
import { ContentParser } from './ContentParser';
import { TemplaterIntegration } from './TemplaterIntegration';
import { warn } from '../logging';
import safeLogger from '../logging/safe-logger';

/**
 * Core engine for validating dream journal entries against defined structures
 */
export class LintingEngine {
    private rules: LintingRule[];
    private structures: CalloutStructure[];
    private templates: JournalTemplate[];
    private contentParser: ContentParser;
    private templaterIntegration: TemplaterIntegration | null;
    
    constructor(
        private plugin?: DreamMetricsPlugin, 
        private settings: LintingSettings = { enabled: true, rules: [], structures: [], templates: [], templaterIntegration: { enabled: false, folderPath: '', defaultTemplate: '' }, contentIsolation: { ignoreImages: true, ignoreLinks: false, ignoreFormatting: true, ignoreHeadings: false, ignoreCodeBlocks: true, ignoreFrontmatter: true, ignoreComments: true, customIgnorePatterns: [] }, userInterface: { showInlineValidation: true, severityIndicators: { error: '❌', warning: '⚠️', info: 'ℹ️' }, quickFixesEnabled: true } }
    ) {
        this.rules = settings.rules || [];
        this.structures = settings.structures || [];
        this.templates = settings.templates || [];
        this.contentParser = new ContentParser(settings.contentIsolation);
        
        // Initialize Templater integration if enabled and plugin is provided
        if (plugin && settings.templaterIntegration?.enabled) {
            this.templaterIntegration = new TemplaterIntegration(
                plugin.app,
                plugin,
                {
                    enabled: settings.templaterIntegration.enabled,
                    templateFolder: settings.templaterIntegration.folderPath,
                    defaultTemplate: settings.templaterIntegration.defaultTemplate
                }
            );
            if (!this.templaterIntegration.isTemplaterInstalled()) {
                this.templaterIntegration = null;
                try {
                    safeLogger.warn('LintingEngine', 'Templater plugin not found. Templater integration disabled.');
                } catch (e) {
                    warn('LintingEngine', 'Templater plugin not found. Templater integration disabled.');
                }
            }
        } else {
            this.templaterIntegration = null;
        }
    }
    
    /**
     * Validate content against all enabled rules
     */
    validate(content: string, templateId?: string): ValidationResult[] {
        if (!this.settings.enabled) {
            return [];
        }
        
        const results: ValidationResult[] = [];
        
        // Determine which structure to validate against
        let structure: CalloutStructure | undefined;
        if (templateId) {
            const template = this.templates.find(t => t.id === templateId);
            if (template) {
                structure = this.structures.find(s => s.id === template.structure);
            }
        } else {
            // Try to guess the structure from the content
            structure = this.detectStructure(content);
        }
        
        // Parse the content
        const calloutBlocks = this.contentParser.parseCallouts(content);
        
        // Run structure validation if we have a structure
        if (structure) {
            results.push(...this.validateStructure(content, calloutBlocks, structure));
        }
        
        // Run all general enabled rules
        for (const rule of this.rules.filter(r => r.enabled)) {
            results.push(...this.validateRule(content, rule));
        }
        
        // Sort results by priority
        return results.sort((a, b) => {
            // First by severity
            const severityOrder = { error: 0, warning: 1, info: 2 };
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0) {
                return severityDiff;
            }
            
            // Then by rule priority
            return a.rule.priority - b.rule.priority;
        });
    }
    
    /**
     * Apply a quick fix to the content
     */
    applyQuickFix(content: string, result: ValidationResult, fixIndex: number = 0): string {
        if (!result.quickFixes || result.quickFixes.length === 0 || fixIndex >= result.quickFixes.length) {
            return content;
        }
        
        const fix = result.quickFixes[fixIndex];
        return fix.action(content);
    }
    
    /**
     * Detect which structure the content most likely follows
     */
    private detectStructure(content: string): CalloutStructure | undefined {
        // Parse the callouts
        const calloutBlocks = this.contentParser.parseCallouts(content);
        
        // No callouts, no structure to detect
        if (calloutBlocks.length === 0) {
            return undefined;
        }
        
        // Try to find a matching structure by examining the callouts
        for (const structure of this.structures) {
            let matchScore = 0;
            const maxScore = 3; // Arbitrary threshold for a "good" match
            
            // Check for root callout
            if (calloutBlocks.some(block => block.type === structure.rootCallout)) {
                matchScore++;
            }
            
            // Check for child callouts
            const foundChildCallouts = calloutBlocks
                .filter(block => structure.childCallouts.includes(block.type))
                .length;
            
            if (foundChildCallouts > 0) {
                matchScore++;
            }
            
            // Check for metrics callout
            if (structure.metricsCallout && 
                calloutBlocks.some(block => block.type === structure.metricsCallout)) {
                matchScore++;
            }
            
            if (matchScore >= maxScore) {
                return structure;
            }
        }
        
        return undefined;
    }
    
    /**
     * Get a template that best matches the content structure
     */
    getTemplateForContent(content: string): JournalTemplate | null {
        const structure = this.detectStructure(content);
        if (!structure) {
            return null;
        }
        
        // Return the first template that uses this structure
        return this.templates.find(t => t.structure === structure.id) || null;
    }
    
    /**
     * Validate content against a specific rule
     */
    private validateRule(content: string, rule: LintingRule): ValidationResult[] {
        const results: ValidationResult[] = [];
        
        // Handle different rule types
        switch (rule.type) {
            case 'structure':
                // Structure rules are handled separately
                break;
                
            case 'format':
            case 'content':
            case 'custom':
                // Use regex pattern matching for these rule types
                if (typeof rule.pattern === 'string') {
                    rule.pattern = new RegExp(rule.pattern, 'gm');
                }
                
                // Find all matches that FAIL the pattern (if it's a negative pattern)
                const isNegativePattern = rule.negative === true;
                const regex = rule.pattern as RegExp;
                const matches = [];
                let match;
                
                if (isNegativePattern) {
                    // For negative patterns, we find content that DOES match (which is bad)
                    while ((match = regex.exec(content)) !== null) {
                        matches.push(match);
                    }
                } else {
                    // For positive patterns, if we DON'T match, that's a violation
                    if (!regex.test(content)) {
                        // Create one result for the whole content
                        results.push(this.createResult(rule, content, 0, 0));
                    }
                }
                
                // Create results for matches (only matters for negative patterns)
                for (const match of matches) {
                    const startPos = match.index;
                    const endPos = startPos + match[0].length;
                    results.push(this.createResult(rule, content, startPos, endPos));
                }
                break;
        }
        
        return results;
    }
    
    /**
     * Validate content against a structure definition
     */
    private validateStructure(
        content: string, 
        calloutBlocks: CalloutBlock[], 
        structure: CalloutStructure
    ): ValidationResult[] {
        const results: ValidationResult[] = [];
        
        // Check for root callout
        const rootCallouts = calloutBlocks.filter(block => block.type === structure.rootCallout);
        if (rootCallouts.length === 0) {
            results.push(this.createStructureResult(
                'missing-root-callout',
                `Missing root callout: ${structure.rootCallout}`,
                content,
                0,
                0,
                'error',
                [this.createAddRootCalloutFix(structure)]
            ));
        } else if (rootCallouts.length > 1) {
            results.push(this.createStructureResult(
                'multiple-root-callouts',
                `Multiple root callouts found: ${structure.rootCallout}`,
                content,
                rootCallouts[1].position.start,
                rootCallouts[1].position.end,
                'error'
            ));
        }
        
        // Check for required child callouts
        const requiredChildCallouts = structure.childCallouts.filter(callout => 
            structure.requiredFields.includes(callout));
            
        for (const requiredCallout of requiredChildCallouts) {
            if (!calloutBlocks.some(block => block.type === requiredCallout)) {
                results.push(this.createStructureResult(
                    'missing-required-callout',
                    `Missing required callout: ${requiredCallout}`,
                    content,
                    0,
                    0,
                    'error',
                    [this.createAddChildCalloutFix(structure, requiredCallout)]
                ));
            }
        }
        
        // Check for metrics callout if defined
        if (structure.metricsCallout && 
            !calloutBlocks.some(block => block.type === structure.metricsCallout)) {
            results.push(this.createStructureResult(
                'missing-metrics-callout',
                `Missing metrics callout: ${structure.metricsCallout}`,
                content,
                0,
                0,
                'warning',
                [this.createAddMetricsCalloutFix(structure)]
            ));
        }
        
        // For nested structures, check the nesting relationships
        if (structure.type === 'nested') {
            results.push(...this.validateNestedStructure(content, calloutBlocks, structure));
        }
        
        // Check callout content rules
        for (const block of calloutBlocks) {
            results.push(...this.validateCalloutContent(content, block, structure));
        }
        
        return results;
    }
    
    /**
     * Validate nested structure
     */
    private validateNestedStructure(
        content: string,
        calloutBlocks: CalloutBlock[],
        structure: CalloutStructure
    ): ValidationResult[] {
        const results: ValidationResult[] = [];
        
        // Find the root callout
        const rootCallout = calloutBlocks.find(block => block.type === structure.rootCallout);
        if (!rootCallout) {
            return results; // Already reported as missing
        }
        
        // Check that child callouts are properly nested inside the root
        for (const block of calloutBlocks) {
            if (block.type !== structure.rootCallout && 
                structure.childCallouts.includes(block.type)) {
                
                // Check if this block is properly nested
                if (!this.isBlockNestedProperly(block, rootCallout)) {
                    results.push(this.createStructureResult(
                        'improper-nesting',
                        `Callout ${block.type} should be nested inside ${structure.rootCallout}`,
                        content,
                        block.position.start,
                        block.position.end,
                        'error',
                        [this.createFixNestingFix(block, rootCallout)]
                    ));
                }
            }
        }
        
        return results;
    }
    
    /**
     * Check if a block is properly nested inside a parent block
     */
    private isBlockNestedProperly(block: CalloutBlock, parentBlock: CalloutBlock): boolean {
        return block.position.start > parentBlock.position.start && 
               block.position.end < parentBlock.position.end;
    }
    
    /**
     * Validate the content of a callout block
     */
    private validateCalloutContent(
        content: string,
        block: CalloutBlock,
        structure: CalloutStructure
    ): ValidationResult[] {
        const results: ValidationResult[] = [];
        
        // Placeholder for more specific content validation
        // Can check for patterns, required fields inside callouts, etc.
        
        return results;
    }
    
    /**
     * Create a validation result for structure rules
     */
    private createStructureResult(
        id: string,
        message: string,
        content: string,
        start: number,
        end: number,
        severity: 'error' | 'warning' | 'info' = 'error',
        quickFixes?: QuickFix[]
    ): ValidationResult {
        const structureRule: LintingRule = {
            id: `structure-${id}`,
            name: 'Structure Rule',
            description: 'Validates journal structure',
            type: 'structure',
            severity,
            enabled: true,
            pattern: '',
            message,
            priority: 10
        };
        
        return this.createResult(structureRule, content, start, end, quickFixes);
    }
    
    /**
     * Create a validation result
     */
    private createResult(
        rule: LintingRule,
        content: string,
        start: number,
        end: number,
        quickFixes?: QuickFix[]
    ): ValidationResult {
        // Convert start/end positions to line/column
        const lines = content.substring(0, start).split('\n');
        const startLine = lines.length;
        const startColumn = lines[lines.length - 1]?.length || 0;
        
        const linesEnd = content.substring(0, end).split('\n');
        const endLine = linesEnd.length;
        const endColumn = linesEnd[linesEnd.length - 1]?.length || 0;
        
        return {
            id: `${rule.id}-${start}-${end}`,
            severity: rule.severity,
            message: rule.message,
            position: {
                start: { line: startLine, column: startColumn },
                end: { line: endLine, column: endColumn }
            },
            rule,
            quickFixes
        };
    }
    
    /**
     * Create a quick fix to add a root callout
     */
    private createAddRootCalloutFix(structure: CalloutStructure): QuickFix {
        return {
            title: `Add ${structure.rootCallout} callout`,
            action: (content: string) => {
                return `> [!${structure.rootCallout}]\n> Your dream entry\n\n${content}`;
            }
        };
    }
    
    /**
     * Create a quick fix to add a child callout
     */
    private createAddChildCalloutFix(structure: CalloutStructure, calloutType: string): QuickFix {
        return {
            title: `Add ${calloutType} callout`,
            action: (content: string) => {
                if (structure.type === 'nested') {
                    // Find the root callout and add this as a nested callout
                    const lines = content.split('\n');
                    let inRootCallout = false;
                    let rootCalloutIndent = '';
                    let insertIndex = -1;
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.match(new RegExp(`^\\s*>\\s*\\[!${structure.rootCallout}\\]`))) {
                            inRootCallout = true;
                            rootCalloutIndent = line.match(/^(\s*)>/)?.[1] || '';
                            continue;
                        }
                        
                        if (inRootCallout) {
                            if (!line.startsWith(`${rootCalloutIndent}>`)) {
                                insertIndex = i;
                                break;
                            }
                        }
                    }
                    
                    if (insertIndex === -1) {
                        insertIndex = lines.length;
                    }
                    
                    lines.splice(insertIndex, 0, `${rootCalloutIndent}> [!${calloutType}]\n${rootCalloutIndent}> Add content here`);
                    return lines.join('\n');
                } else {
                    // For flat structures, just append to the end
                    return `${content}\n\n> [!${calloutType}]\n> Add content here`;
                }
            }
        };
    }
    
    /**
     * Create a quick fix to add a metrics callout
     */
    private createAddMetricsCalloutFix(structure: CalloutStructure): QuickFix {
        return {
            title: `Add ${structure.metricsCallout} callout`,
            action: (content: string) => {
                return `${content}\n\n> [!${structure.metricsCallout}]\n> Clarity: 5\n> Vividness: 4\n> Coherence: 3`;
            }
        };
    }
    
    /**
     * Create a quick fix to fix nesting of a callout
     */
    private createFixNestingFix(block: CalloutBlock, rootCallout: CalloutBlock): QuickFix {
        return {
            title: 'Fix callout nesting',
            action: (content: string) => {
                // Extract the block content
                const blockContent = content.substring(block.position.start, block.position.end);
                
                // Remove the block from its current position
                let newContent = content.substring(0, block.position.start) + 
                                content.substring(block.position.end);
                
                // Find a good place inside the root callout to insert it
                const rootCalloutEndMatch = newContent.substring(rootCallout.position.start)
                    .match(/^([\s\S]*?>[\s\S]*?\n)([\s\S]*)/);
                    
                if (rootCalloutEndMatch) {
                    const rootCalloutFirstLine = rootCalloutEndMatch[1];
                    const restOfRootCallout = rootCalloutEndMatch[2];
                    
                    newContent = newContent.substring(0, rootCallout.position.start) +
                                rootCalloutFirstLine +
                                blockContent + '\n' +
                                restOfRootCallout;
                } else {
                    // Fallback: just append to the end of the root callout
                    newContent = newContent.substring(0, rootCallout.position.end) +
                                '\n' + blockContent +
                                newContent.substring(rootCallout.position.end);
                }
                
                return newContent;
            }
        };
    }
} 