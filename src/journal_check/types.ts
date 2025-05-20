/**
 * Types for the journal structure validation system
 */

import { DreamMetricsSettings } from '../types';

export interface LintingSettings {
    enabled: boolean;
    rules: LintingRule[];
    structures: CalloutStructure[];
    templates: JournalTemplate[];
    templaterIntegration: {
        enabled: boolean;
        folderPath: string;
        defaultTemplate: string;
    };
    contentIsolation: ContentIsolationSettings;
    userInterface: {
        showInlineValidation: boolean;
        severityIndicators: {
            error: string;
            warning: string;
            info: string;
        };
        quickFixesEnabled: boolean;
    };
}

export interface LintingRule {
    id: string;
    name: string;
    description: string;
    type: 'structure' | 'format' | 'content' | 'custom';
    severity: 'error' | 'warning' | 'info';
    enabled: boolean;
    pattern: string | RegExp;
    message: string;
    priority: number;
    negative?: boolean;
    quickFixes?: Array<{
        title: string;
        pattern: string | RegExp;
        replacement: string;
    }>;
}

export interface CalloutStructure {
    id: string;
    name: string;
    description: string;
    type: 'flat' | 'nested';
    rootCallout: string;
    childCallouts: string[];
    metricsCallout: string;
    dateFormat: string[];
    requiredFields: string[];
    optionalFields: string[];
}

export interface JournalTemplate {
    id: string;
    name: string;
    description: string;
    structure: string; // References a CalloutStructure.id
    content: string;
    isTemplaterTemplate: boolean;
    templaterFile?: string;
}

export interface ContentIsolationSettings {
    ignoreImages: boolean;
    ignoreLinks: boolean;
    ignoreFormatting: boolean;
    ignoreHeadings: boolean;
    ignoreCodeBlocks: boolean;
    ignoreFrontmatter: boolean;
    ignoreComments: boolean;
    customIgnorePatterns: string[];
}

export interface ValidationResult {
    id: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    position: {
        start: { line: number; column: number; };
        end: { line: number; column: number; };
    };
    rule: LintingRule;
    quickFixes?: QuickFix[];
}

export interface QuickFix {
    title: string;
    action: (content: string) => string;
}

export interface CalloutBlock {
    type: string;
    content: string;
    position: {
        start: number;
        end: number;
    };
    parent?: CalloutBlock;
    children: CalloutBlock[];
    metadata?: Record<string, any>;
}

export interface MetricEntry {
    name: string;
    value: number | string;
    position: {
        start: number;
        end: number;
    };
}

export interface TemplaterVariable {
    name: string;
    type: 'date' | 'prompt' | 'system' | 'custom';
    position: {
        start: { line: number; column: number; };
        end: { line: number; column: number; };
    };
    defaultValue?: string;
}

export interface TestResult {
    testName: string;
    passed: boolean;
    expectedResults: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
        specificErrors?: string[];
    };
    actualResults: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
        allErrors: ValidationResult[];
    };
    duration: number;
} 