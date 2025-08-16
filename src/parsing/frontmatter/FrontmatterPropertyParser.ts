/**
 * FrontmatterPropertyParser
 * 
 * Handles parsing of frontmatter properties from Obsidian notes
 * for extracting dream metrics data.
 */

import { App, TFile } from 'obsidian';
import { 
    FrontmatterData, 
    FrontmatterParseResult, 
    ValidationResult,
    FrontmatterMetricConfig 
} from '../../types/frontmatter';
import { ILogger } from '../../logging/LoggerTypes';

export class FrontmatterPropertyParser {
    constructor(
        private app: App,
        private logger: ILogger
    ) {}

    /**
     * Parse frontmatter from file content
     */
    parse(content: string): FrontmatterParseResult {
        try {
            // Extract frontmatter section
            const match = content.match(/^---\n([\s\S]*?)\n---/);
            
            if (!match) {
                return {
                    data: {},
                    success: true,
                    raw: ''
                };
            }

            const yamlContent = match[1];
            
            // Parse YAML manually (basic implementation)
            // In production, we'd use a proper YAML parser
            const data = this.parseYaml(yamlContent);
            
            return {
                data: this.normalizeData(data),
                success: true,
                raw: yamlContent
            };
        } catch (error) {
            this.logger.error('Frontmatter', 'Failed to parse frontmatter', error);
            return {
                data: {},
                success: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Parse frontmatter from a file using Obsidian's metadata cache
     */
    async parseFromFile(file: TFile): Promise<FrontmatterParseResult> {
        try {
            const cache = this.app.metadataCache.getFileCache(file);
            
            if (!cache?.frontmatter) {
                return {
                    data: {},
                    success: true
                };
            }

            return {
                data: this.normalizeData(cache.frontmatter),
                success: true
            };
        } catch (error) {
            this.logger.error('Frontmatter', `Failed to parse frontmatter from ${file.path}`, error);
            return {
                data: {},
                success: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Update frontmatter in file content
     */
    update(content: string, data: FrontmatterData): string {
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        const yamlContent = this.dataToYaml(data);
        
        if (match) {
            // Replace existing frontmatter
            return content.replace(
                /^---\n[\s\S]*?\n---/,
                `---\n${yamlContent}---`
            );
        } else {
            // Add new frontmatter
            return `---\n${yamlContent}---\n\n${content}`;
        }
    }

    /**
     * Validate frontmatter data against metric configurations
     */
    validate(data: FrontmatterData, configs: FrontmatterMetricConfig[]): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        for (const config of configs) {
            if (!config.enabled) continue;

            const value = data[config.propertyName];
            
            if (value === undefined) continue;

            // Type validation
            if (config.format === 'array' && !Array.isArray(value)) {
                if (!config.coerceType) {
                    warnings.push(`Property '${config.propertyName}' should be an array`);
                }
            }

            if (config.format === 'single' && Array.isArray(value)) {
                warnings.push(`Property '${config.propertyName}' should be a single value, not an array`);
            }

            // Validate metric-specific constraints
            const validationError = this.validateMetricValue(config.metricName, value);
            if (validationError) {
                errors.push(validationError);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Normalize frontmatter data
     */
    private normalizeData(data: any): FrontmatterData {
        const normalized: FrontmatterData = {};

        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                // Handle Obsidian's list format
                normalized[key] = this.normalizeArray(value);
            } else {
                normalized[key] = value;
            }
        }

        return normalized;
    }

    /**
     * Normalize array values
     */
    private normalizeArray(value: any[]): any[] {
        return value.map(item => {
            // Handle Obsidian's list format with dashes
            if (typeof item === 'string' && item.startsWith('- ')) {
                return item.substring(2);
            }
            return item;
        });
    }

    /**
     * Basic YAML parser (simplified for demonstration)
     * In production, use a proper YAML library
     */
    private parseYaml(yaml: string): any {
        const result: any = {};
        const lines = yaml.split('\n');
        let currentKey: string | null = null;
        let currentList: any[] | null = null;

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (!trimmed) continue;

            // List item
            if (trimmed.startsWith('- ')) {
                if (currentKey && currentList !== null) {
                    currentList.push(trimmed.substring(2).trim());
                }
                continue;
            }

            // Key-value pair
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex > 0) {
                const key = trimmed.substring(0, colonIndex).trim();
                const value = trimmed.substring(colonIndex + 1).trim();

                if (!value) {
                    // Start of a list
                    currentKey = key;
                    currentList = [];
                    result[key] = currentList;
                } else if (value.startsWith('[') && value.endsWith(']')) {
                    // Inline array
                    result[key] = this.parseInlineArray(value);
                    currentKey = null;
                    currentList = null;
                } else {
                    // Simple value
                    result[key] = this.parseValue(value);
                    currentKey = null;
                    currentList = null;
                }
            }
        }

        return result;
    }

    /**
     * Parse inline array format [item1, item2]
     */
    private parseInlineArray(value: string): any[] {
        const content = value.slice(1, -1); // Remove brackets
        if (!content.trim()) return [];

        return content.split(',').map(item => {
            const trimmed = item.trim();
            // Remove quotes if present
            if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                return trimmed.slice(1, -1);
            }
            return this.parseValue(trimmed);
        });
    }

    /**
     * Parse a single value
     */
    private parseValue(value: string): any {
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }

        // Boolean
        if (value === 'true') return true;
        if (value === 'false') return false;

        // Number
        const num = Number(value);
        if (!isNaN(num)) return num;

        // String
        return value;
    }

    /**
     * Convert data to YAML format
     */
    private dataToYaml(data: FrontmatterData): string {
        const lines: string[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    lines.push(`${key}: []`);
                } else {
                    // Use inline format for short arrays, expanded for long ones
                    if (value.length <= 3 && value.every(v => typeof v !== 'object')) {
                        lines.push(`${key}: [${value.map(v => this.formatValue(v)).join(', ')}]`);
                    } else {
                        lines.push(`${key}:`);
                        value.forEach(item => {
                            lines.push(`  - ${this.formatValue(item)}`);
                        });
                    }
                }
            } else {
                lines.push(`${key}: ${this.formatValue(value)}`);
            }
        }

        return lines.join('\n') + '\n';
    }

    /**
     * Format a value for YAML
     */
    private formatValue(value: any): string {
        if (typeof value === 'string') {
            // Quote if contains special characters
            if (value.includes(':') || value.includes('#') || value.includes(',')) {
                return `"${value.replace(/"/g, '\\"')}"`;
            }
            return value;
        }
        return String(value);
    }

    /**
     * Validate metric value against known constraints
     */
    private validateMetricValue(metricName: string, value: any): string | null {
        // This would be extended with actual metric validation rules
        // For now, just basic type checking
        
        if (metricName.includes('level') || metricName.includes('score')) {
            if (typeof value === 'number') {
                if (value < 0 || value > 10) {
                    return `${metricName} must be between 0 and 10`;
                }
            } else if (typeof value !== 'number') {
                return `${metricName} must be a number`;
            }
        }

        return null;
    }
}