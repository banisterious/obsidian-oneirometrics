// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { LintingSettings } from '../../types';

/**
 * Default configuration for the journal structure validation system.
 * This provides sensible defaults for dream journal validation including
 * structure rules, templates, and UI settings.
 */
export const defaultLintingSettings: LintingSettings = {
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
        },
        {
            id: 'nested-dream-structure',
            name: 'Nested Dream Structure',
            description: 'Nested dream journal structure with all callouts inside the root callout',
            type: 'nested',
            rootCallout: 'dream',
            childCallouts: ['symbols', 'reflections', 'interpretation', 'metrics'],
            metricsCallout: 'metrics',
            dateFormat: ['YYYY-MM-DD'],
            requiredFields: ['dream', 'reflections'],
            optionalFields: ['symbols', 'interpretation', 'metrics']
        }
    ],
    templates: [
        {
            id: 'default-template',
            name: 'Standard Dream Journal',
            description: 'Default template for dream journal entries',
            structure: 'default-dream-structure',
            content: `# Dream Journal Entry

> [!dream]
> Enter your dream here.

> [!symbols]
> - Symbol 1: Meaning
> - Symbol 2: Meaning

> [!reflections]
> Add your reflections here.

> [!metrics]
> Clarity: 7
> Vividness: 8
> Coherence: 6
`,
            isTemplaterTemplate: false
        }
    ],
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

/**
 * Legacy export for backward compatibility.
 * @deprecated Use defaultLintingSettings instead
 */
export const DEFAULT_LINTING_SETTINGS = defaultLintingSettings; 