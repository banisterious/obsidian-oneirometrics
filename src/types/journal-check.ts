/**
 * Journal Structure Check types for OneiroMetrics
 * 
 * This file contains type definitions for the Journal Structure Check system
 * (formerly known as "Linting"), which validates journal entries against defined structures.
 */

/**
 * Interface representing journal structure check configuration
 */
export interface JournalStructureSettings {
    /** Whether the journal structure check is enabled */
    enabled: boolean;
    
    /** Rules for validating journal structure */
    rules: JournalStructureRule[];
    
    /** Defined structures for journal entries */
    structures: CalloutStructure[];
    
    /** Templates for journal entries */
    templates: JournalTemplate[];
    
    /** Templater integration configuration */
    templaterIntegration: {
        /** Whether Templater integration is enabled */
        enabled: boolean;
        
        /** Path to the folder containing Templater templates */
        folderPath: string;
        
        /** Path to the default Templater template */
        defaultTemplate: string;
    };
    
    /** Content isolation settings for validation */
    contentIsolation: ContentIsolationSettings;
    
    /** User interface settings for validation */
    userInterface: {
        /** Whether to show inline validation in the editor */
        showInlineValidation: boolean;
        
        /** Indicators for different severity levels */
        severityIndicators: {
            error: string;
            warning: string;
            info: string;
        };
        
        /** Whether quick fixes are enabled */
        quickFixesEnabled: boolean;
    };
}

/**
 * Interface representing a journal structure validation rule
 */
export interface JournalStructureRule {
    /** Unique identifier for the rule */
    id: string;
    
    /** Display name for the rule */
    name: string;
    
    /** Description of what the rule checks */
    description: string;
    
    /** The type of rule */
    type: 'structure' | 'format' | 'content' | 'custom';
    
    /** The severity level of rule violations */
    severity: 'error' | 'warning' | 'info';
    
    /** Whether the rule is enabled */
    enabled: boolean;
    
    /** Pattern to match (string or RegExp) */
    pattern: string | RegExp;
    
    /** Message to display for rule violations */
    message: string;
    
    /** Priority of the rule (higher number = higher priority) */
    priority: number;
    
    /** Whether to negate the pattern match */
    negative?: boolean;
    
    /** Quick fixes for rule violations */
    quickFixes?: Array<{
        title: string;
        pattern: string | RegExp;
        replacement: string;
    }>;
}

/**
 * Interface representing a callout structure for journal entries
 */
export interface CalloutStructure {
    /** Unique identifier for the structure */
    id: string;
    
    /** Display name for the structure */
    name: string;
    
    /** Description of the structure */
    description: string;
    
    /** The type of structure (flat or nested callouts) */
    type: 'flat' | 'nested';
    
    /** The root callout type */
    rootCallout: string;
    
    /** The child callout types */
    childCallouts: string[];
    
    /** The callout type for metrics */
    metricsCallout: string;
    
    /** Accepted date formats */
    dateFormat: string[];
    
    /** Required fields in the journal entry */
    requiredFields: string[];
    
    /** Optional fields in the journal entry */
    optionalFields: string[];
}

/**
 * Interface representing a journal template
 */
export interface JournalTemplate {
    /** Unique identifier for the template */
    id: string;
    
    /** Display name for the template */
    name: string;
    
    /** Description of the template */
    description: string;
    
    /** Reference to a CalloutStructure.id */
    structure: string;
    
    /** The content of the template */
    content: string;
    
    /** Whether this is a Templater template */
    isTemplaterTemplate: boolean;
    
    /** Path to the Templater file, if applicable */
    templaterFile?: string;
    
    /** Static version of the template with placeholders for when Templater is not available */
    staticContent?: string;
}

/**
 * Interface representing content isolation settings for validation
 */
export interface ContentIsolationSettings {
    /** Whether to ignore images in validation */
    ignoreImages: boolean;
    
    /** Whether to ignore links in validation */
    ignoreLinks: boolean;
    
    /** Whether to ignore formatting in validation */
    ignoreFormatting: boolean;
    
    /** Whether to ignore headings in validation */
    ignoreHeadings: boolean;
    
    /** Whether to ignore code blocks in validation */
    ignoreCodeBlocks: boolean;
    
    /** Whether to ignore frontmatter in validation */
    ignoreFrontmatter: boolean;
    
    /** Whether to ignore comments in validation */
    ignoreComments: boolean;
    
    /** Custom patterns to ignore in validation */
    customIgnorePatterns: string[];
}

/**
 * Interface representing a validation result
 */
export interface ValidationResult {
    /** Unique identifier for the result */
    id: string;
    
    /** Severity level of the result */
    severity: 'error' | 'warning' | 'info';
    
    /** Message describing the issue */
    message: string;
    
    /** Position of the issue in the document */
    position: {
        start: { line: number; column: number; };
        end: { line: number; column: number; };
    };
    
    /** The rule that was violated */
    rule: JournalStructureRule;
    
    /** Quick fixes for the issue */
    quickFixes?: QuickFix[];
}

/**
 * Interface representing a quick fix for a validation issue
 */
export interface QuickFix {
    /** Display title for the quick fix */
    title: string;
    
    /** Action function to apply the fix */
    action: (content: string) => string;
}

/**
 * Interface representing a callout block in a document
 */
export interface CalloutBlock {
    /** The type of callout */
    type: string;
    
    /** The content of the callout */
    content: string;
    
    /** Position of the callout in the document */
    position: {
        start: number;
        end: number;
    };
    
    /** Parent callout, if nested */
    parent?: CalloutBlock;
    
    /** Child callouts, if any */
    children: CalloutBlock[];
    
    /** Additional metadata for the callout */
    metadata?: Record<string, any>;
}

/**
 * Interface representing a metric entry in a document
 */
export interface MetricEntry {
    /** Name of the metric */
    name: string;
    
    /** Value of the metric */
    value: number | string;
    
    /** Position of the metric in the document */
    position: {
        start: number;
        end: number;
    };
}

/**
 * Interface representing a Templater variable
 */
export interface TemplaterVariable {
    /** Name of the variable */
    name: string;
    
    /** Type of the variable */
    type: 'date' | 'prompt' | 'system' | 'custom';
    
    /** Position of the variable in the document */
    position: {
        start: { line: number; column: number; };
        end: { line: number; column: number; };
    };
    
    /** Default value for the variable */
    defaultValue?: string;
}

/**
 * Interface representing a test result
 */
export interface TestResult {
    /** Name of the test */
    testName: string;
    
    /** Whether the test passed */
    passed: boolean;
    
    /** Expected results from the test */
    expectedResults: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
        specificErrors?: string[];
    };
    
    /** Actual results from the test */
    actualResults: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
        allErrors: ValidationResult[];
    };
    
    /** Duration of the test in milliseconds */
    duration: number;
}

/**
 * Default journal structure check settings
 */
export const DEFAULT_JOURNAL_STRUCTURE_SETTINGS: JournalStructureSettings = {
    enabled: true,
    rules: [
        {
            id: 'dream-callout-required',
            name: 'Dream Callout Required',
            description: 'Requires the dream callout in journal entries',
            type: 'structure',
            severity: 'error',
            enabled: true,
            pattern: '> \\[!dream\\]',
            message: 'Dream journal entries must include a dream callout',
            priority: 10
        }
    ],
    structures: [
        {
            id: 'default-dream-structure',
            name: 'Default Dream Structure',
            description: 'Standard dream journal structure with required callouts',
            type: 'flat',
            rootCallout: 'dream',
            childCallouts: ['symbols', 'reflections', 'interpretation'],
            metricsCallout: 'metrics',
            dateFormat: ['YYYY-MM-DD'],
            requiredFields: ['dream'],
            optionalFields: ['symbols', 'reflections', 'interpretation', 'metrics']
        }
    ],
    templates: [],
    templaterIntegration: {
        enabled: false,
        folderPath: 'templates/dreams',
        defaultTemplate: 'templates/dreams/default.md'
    },
    contentIsolation: {
        ignoreImages: true,
        ignoreLinks: false,
        ignoreFormatting: true,
        ignoreHeadings: false,
        ignoreCodeBlocks: true,
        ignoreFrontmatter: true,
        ignoreComments: true,
        customIgnorePatterns: []
    },
    userInterface: {
        showInlineValidation: true,
        severityIndicators: {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        },
        quickFixesEnabled: true
    }
}; 