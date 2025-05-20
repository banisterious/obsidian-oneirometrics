import { CalloutBlock, ContentIsolationSettings, MetricEntry } from './types';

/**
 * Parses content to extract callout blocks and metrics
 */
export class ContentParser {
    constructor(private settings: ContentIsolationSettings) {}
    
    /**
     * Parse callout blocks from content, including nested callouts
     */
    parseCallouts(content: string): CalloutBlock[] {
        // Apply content isolation settings
        const processedContent = this.applyContentIsolation(content);
        
        // Find all callout blocks
        const calloutRegex = /^(\s*)>\s*\[!(\w+)\](.*?)(?=^\s*$|^\s*>[^>]|\s*>\s*\[!|\s*$)/gms;
        const matches: RegExpExecArray[] = [];
        let match: RegExpExecArray | null;
        
        while ((match = calloutRegex.exec(processedContent)) !== null) {
            matches.push(match);
        }
        
        // Convert matches to CalloutBlock objects
        const blocks: CalloutBlock[] = matches.map(match => {
            const indentation = match[1].length;
            const type = match[2];
            const content = match[3].trim();
            const position = {
                start: match.index,
                end: match.index + match[0].length
            };
            
            return {
                type,
                content,
                position,
                children: [],
                metadata: { indentation }
            };
        });
        
        // Build parent-child relationships based on indentation and position
        const rootBlocks: CalloutBlock[] = [];
        
        // First sort by position to ensure proper nesting detection
        blocks.sort((a, b) => a.position.start - b.position.start);
        
        for (const block of blocks) {
            const indentation = block.metadata?.indentation as number || 0;
            
            // Find the parent block
            // A parent must start before this block and end after it
            // And it must be the closest such block (with highest start position)
            let parent: CalloutBlock | undefined;
            let maxStartPos = -1;
            
            for (const potential of blocks) {
                const potentialIndent = potential.metadata?.indentation as number || 0;
                
                if (potential !== block && 
                    potential.position.start < block.position.start && 
                    potential.position.end > block.position.end &&
                    potentialIndent < indentation && 
                    potential.position.start > maxStartPos) {
                    
                    parent = potential;
                    maxStartPos = potential.position.start;
                }
            }
            
            if (parent) {
                block.parent = parent;
                parent.children.push(block);
            } else {
                rootBlocks.push(block);
            }
        }
        
        return rootBlocks;
    }
    
    /**
     * Parse metrics from content, typically from a metrics callout
     */
    parseMetrics(content: string): MetricEntry[] {
        const metrics: MetricEntry[] = [];
        
        // Find metrics in the format "MetricName: value"
        const metricRegex = /^>\s*(?!>)(\w+(?:\s+\w+)*)\s*:\s*(\d+(?:\.\d+)?|\w+)/gm;
        let match: RegExpExecArray | null;
        
        while ((match = metricRegex.exec(content)) !== null) {
            const name = match[1].trim();
            const valueStr = match[2].trim();
            
            // Try to convert to number if possible
            const value = isNaN(Number(valueStr)) ? valueStr : Number(valueStr);
            
            metrics.push({
                name,
                value,
                position: {
                    start: match.index,
                    end: match.index + match[0].length
                }
            });
        }
        
        return metrics;
    }
    
    /**
     * Apply content isolation settings to ignore certain elements
     */
    private applyContentIsolation(content: string): string {
        let processedContent = content;
        
        // Ignore images
        if (this.settings.ignoreImages) {
            processedContent = processedContent.replace(/!\[.*?\]\(.*?\)/g, '');
        }
        
        // Ignore links
        if (this.settings.ignoreLinks) {
            processedContent = processedContent.replace(/\[.*?\]\(.*?\)/g, '$1');
        }
        
        // Ignore formatting
        if (this.settings.ignoreFormatting) {
            processedContent = processedContent
                .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
                .replace(/(\*|_)(.*?)\1/g, '$2')    // Italic
                .replace(/~~(.*?)~~/g, '$1')        // Strikethrough
                .replace(/==(.*?)==/g, '$1')        // Highlight
                .replace(/\^(.*?)\^/g, '$1');       // Superscript
        }
        
        // Ignore headings
        if (this.settings.ignoreHeadings) {
            processedContent = processedContent.replace(/^#+\s+.*$/gm, '');
        }
        
        // Ignore code blocks
        if (this.settings.ignoreCodeBlocks) {
            processedContent = processedContent.replace(/```[\s\S]*?```/g, '');
        }
        
        // Ignore frontmatter
        if (this.settings.ignoreFrontmatter) {
            processedContent = processedContent.replace(/^---[\s\S]*?---\n/m, '');
        }
        
        // Ignore comments
        if (this.settings.ignoreComments) {
            processedContent = processedContent.replace(/%%([\s\S]*?)%%/g, '');
        }
        
        // Apply custom ignore patterns
        for (const pattern of this.settings.customIgnorePatterns) {
            try {
                const regex = new RegExp(pattern, 'g');
                processedContent = processedContent.replace(regex, '');
            } catch (error) {
                console.error(`Invalid regex pattern: ${pattern}`, error);
            }
        }
        
        return processedContent;
    }
    
    /**
     * Strip all markdown formatting from text
     */
    stripMarkdown(content: string): string {
        return this.applyContentIsolation(content);
    }
    
    /**
     * Flatten a hierarchical structure of callout blocks
     */
    flattenCallouts(blocks: CalloutBlock[]): CalloutBlock[] {
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
     * Extract all callouts of a specific type
     */
    getCalloutsOfType(blocks: CalloutBlock[], type: string): CalloutBlock[] {
        return this.flattenCallouts(blocks).filter(block => block.type === type);
    }
} 