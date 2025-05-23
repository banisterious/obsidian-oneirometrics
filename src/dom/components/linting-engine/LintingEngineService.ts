import { ContentParser } from '../../../journal_check/ContentParser';
import { CalloutBlock, CalloutStructure, JournalTemplate, MetricEntry, QuickFix, ValidationResult } from '../../../journal_check/types';
import { ILintingEngineService, LintingSettings } from './LintingEngineTypes';

/**
 * Service implementation for the LintingEngine component
 */
export class LintingEngineService implements ILintingEngineService {
    private contentParser: ContentParser;

    constructor(private settings: LintingSettings) {
        this.contentParser = new ContentParser(settings.contentIsolation);
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
            const template = this.settings.templates.find(t => t.id === templateId);
            if (template) {
                structure = this.settings.structures.find(s => s.id === template.structure);
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
        for (const rule of this.settings.rules.filter(r => r.enabled)) {
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
     * Get a template that best matches the content structure
     */
    getTemplateForContent(content: string): JournalTemplate | null {
        const structure = this.detectStructure(content);
        if (!structure) {
            return null;
        }
        
        // Return the first template that uses this structure
        return this.settings.templates.find(t => t.structure === structure.id) || null;
    }

    /**
     * Get the structure for a given template ID
     */
    getStructureForTemplate(templateId: string): CalloutStructure | null {
        const template = this.settings.templates.find(t => t.id === templateId);
        if (!template) {
            return null;
        }
        
        return this.settings.structures.find(s => s.id === template.structure) || null;
    }

    /**
     * Parse callout blocks from content
     */
    parseCallouts(content: string): CalloutBlock[] {
        return this.contentParser.parseCallouts(content);
    }

    /**
     * Parse metrics from content
     */
    parseMetrics(content: string): MetricEntry[] {
        return this.contentParser.parseMetrics(content);
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
        for (const structure of this.settings.structures) {
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
     * Validate content against a specific rule
     */
    private validateRule(content: string, rule: any): ValidationResult[] {
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
        calloutBlocks: any[], 
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
        
        // Additional validation based on structure type
        if (structure.type === 'flat') {
            // For flat structures, all callouts should be at the root level
            for (const block of calloutBlocks) {
                if (block.parent) {
                    results.push(this.createStructureResult(
                        'nested-callout-in-flat-structure',
                        `Nested callout found in flat structure: ${block.type}`,
                        content,
                        block.position.start,
                        block.position.end,
                        'error'
                    ));
                }
            }
        } else if (structure.type === 'nested') {
            // For nested structures, callouts should be properly nested
            // This is a simplified version - the full validation would be more complex
            for (const block of this.flattenCallouts(calloutBlocks)) {
                if (block.type !== structure.rootCallout && !block.parent) {
                    results.push(this.createStructureResult(
                        'unnested-callout',
                        `Child callout not nested under root: ${block.type}`,
                        content,
                        block.position.start,
                        block.position.end,
                        'error',
                        [this.createFixNestingFix(block, rootCallouts[0])]
                    ));
                }
            }
        }
        
        // Check for required child callouts
        const requiredChildCallouts = structure.childCallouts.filter(callout => 
            structure.requiredFields.includes(callout));
            
        for (const requiredCallout of requiredChildCallouts) {
            if (!this.flattenCallouts(calloutBlocks).some(block => block.type === requiredCallout)) {
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
        
        return results;
    }

    /**
     * Flatten a hierarchical structure of callout blocks
     */
    private flattenCallouts(blocks: CalloutBlock[]): CalloutBlock[] {
        const flattened: CalloutBlock[] = [];
        
        const traverse = (block: CalloutBlock) => {
            flattened.push(block);
            for (const child of block.children) {
                traverse(child);
            }
        };
        
        for (const block of blocks) {
            traverse(block);
        }
        
        return flattened;
    }
    
    /**
     * Create a structure validation result
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
        // Convert position to line and column
        const contentToStart = content.substring(0, start);
        const lines = contentToStart.split('\n');
        const lastLineIndex = lines.length - 1;
        const lastLine = lines[lastLineIndex] || '';
        
        // Create a pseudo rule for structure validation
        const structureRule = {
            id: `structure-${id}`,
            name: `Structure: ${id}`,
            description: `Validates the journal structure: ${id}`,
            type: 'structure' as 'structure',
            severity,
            enabled: true,
            pattern: '',
            message,
            priority: 0
        };
        
        return {
            id: `structure-${id}`,
            severity,
            message,
            position: {
                start: { line: lastLineIndex + 1, column: lastLine.length + 1 },
                end: { line: lastLineIndex + 1, column: lastLine.length + 1 }
            },
            rule: structureRule,
            quickFixes
        };
    }
    
    /**
     * Create a validation result from a rule
     */
    private createResult(
        rule: any,
        content: string,
        start: number,
        end: number,
        quickFixes?: QuickFix[]
    ): ValidationResult {
        // Convert position to line and column
        const contentToStart = content.substring(0, start);
        const lines = contentToStart.split('\n');
        const lastLineIndex = lines.length - 1;
        const lastLine = lines[lastLineIndex] || '';
        
        return {
            id: rule.id,
            severity: rule.severity,
            message: rule.message,
            position: {
                start: { line: lastLineIndex + 1, column: lastLine.length + 1 },
                end: { line: lastLineIndex + 1, column: lastLine.length + 1 }
            },
            rule,
            quickFixes: quickFixes || this.createQuickFixesFromRule(rule, content, start, end)
        };
    }
    
    /**
     * Create quick fixes from rule definition
     */
    private createQuickFixesFromRule(rule: any, content: string, start: number, end: number): QuickFix[] | undefined {
        if (!rule.quickFixes || rule.quickFixes.length === 0) {
            return undefined;
        }
        
        return rule.quickFixes.map((fix: any) => ({
            title: fix.title,
            action: (content: string) => {
                if (typeof fix.pattern === 'string') {
                    fix.pattern = new RegExp(fix.pattern, 'gm');
                }
                return content.replace(fix.pattern, fix.replacement);
            }
        }));
    }
    
    /**
     * Create a quick fix for adding a root callout
     */
    private createAddRootCalloutFix(structure: CalloutStructure): QuickFix {
        return {
            title: `Add ${structure.rootCallout} root callout`,
            action: (content: string) => {
                return `> [!${structure.rootCallout}]\n> Insert your content here.\n\n${content}`;
            }
        };
    }
    
    /**
     * Create a quick fix for adding a child callout
     */
    private createAddChildCalloutFix(structure: CalloutStructure, calloutType: string): QuickFix {
        return {
            title: `Add ${calloutType} callout`,
            action: (content: string) => {
                // Find the root callout to determine where to add the child
                const rootCalloutRegex = new RegExp(`^>\\s*\\[!${structure.rootCallout}\\].*?(?=^\\s*$|^\\s*>[^>]|\\s*>\\s*\\[!|\\s*$)`, 'gms');
                const rootMatch = rootCalloutRegex.exec(content);
                
                if (!rootMatch) {
                    // No root found, add both root and child
                    return `> [!${structure.rootCallout}]\n> Insert your content here.\n\n> [!${calloutType}]\n> Enter ${calloutType} information here.\n\n${content}`;
                }
                
                // Different approach based on structure type
                if (structure.type === 'flat') {
                    // For flat structure, add the child callout after the root
                    const endOfRoot = rootMatch.index + rootMatch[0].length;
                    return content.substring(0, endOfRoot) + 
                           `\n\n> [!${calloutType}]\n> Enter ${calloutType} information here.` +
                           content.substring(endOfRoot);
                } else {
                    // For nested structure, indent the child callout under the root
                    const endOfRoot = rootMatch.index + rootMatch[0].length;
                    return content.substring(0, endOfRoot) + 
                           `\n> > [!${calloutType}]\n> > Enter ${calloutType} information here.` +
                           content.substring(endOfRoot);
                }
            }
        };
    }
    
    /**
     * Create a quick fix for fixing nesting issues
     */
    private createFixNestingFix(block: any, rootCallout: any): QuickFix {
        return {
            title: `Fix nesting of ${block.type} callout`,
            action: (content: string) => {
                // Extract the content of the block
                const blockContent = content.substring(block.position.start, block.position.end);
                
                // Remove the original block
                let newContent = content.substring(0, block.position.start) + 
                                content.substring(block.position.end);
                
                // Find the end of the root callout
                const rootEnd = rootCallout.position.end;
                
                // Convert block content to nested format
                const nestedContent = blockContent.replace(/^>\s*/gm, '> > ');
                
                // Insert the nested block at the end of the root callout
                newContent = newContent.substring(0, rootEnd) + 
                            `\n${nestedContent}` + 
                            newContent.substring(rootEnd);
                
                return newContent;
            }
        };
    }
} 