import { CalloutBlock, CalloutStructure, ContentIsolationSettings, JournalTemplate, LintingRule, MetricEntry, ValidationResult, QuickFix } from '../../../journal_check/types';
import { TFile } from 'obsidian';

/**
 * Props for the LintingEngineView component
 */
export interface LintingEngineViewProps {
    validationResults: ValidationResult[];
    currentFilePath: string | null;
    isValidating: boolean;
    templateId: string | null;
    onSelectTemplate: (templateId: string) => void;
    onApplyQuickFix: (result: ValidationResult, fixIndex: number) => void;
    onRunValidation: () => void;
    onClearValidation: () => void;
    onExportResults: () => void;
    availableTemplates: JournalTemplate[];
    structureInfo: CalloutStructure | null;
}

/**
 * State for the LintingEngineContainer component
 */
export interface LintingEngineState {
    validationResults: ValidationResult[];
    currentFilePath: string | null;
    isValidating: boolean;
    templateId: string | null;
    structureInfo: CalloutStructure | null;
}

/**
 * External dependencies required by the LintingEngineContainer
 */
export interface LintingEngineDependencies {
    getSettings: () => LintingSettings;
    saveSettings: () => Promise<void>;
    getActiveFile: () => TFile | null;
    getFileContent: (file: TFile) => Promise<string>;
    setFileContent: (file: TFile, content: string) => Promise<void>;
    createNotice: (message: string, duration?: number) => void;
}

/**
 * Settings interface for the LintingEngine
 */
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

/**
 * Service interface for the LintingEngine
 */
export interface ILintingEngineService {
    validate(content: string, templateId?: string): ValidationResult[];
    applyQuickFix(content: string, result: ValidationResult, fixIndex?: number): string;
    getTemplateForContent(content: string): JournalTemplate | null;
    getStructureForTemplate(templateId: string): CalloutStructure | null;
    parseCallouts(content: string): CalloutBlock[];
    parseMetrics(content: string): MetricEntry[];
}

/**
 * Events related to linting
 */
export interface LintingEngineEvents {
    'validation:complete': { results: ValidationResult[], filePath: string };
    'validation:start': { filePath: string };
    'quickfix:applied': { result: ValidationResult, fixIndex: number, filePath: string };
    'template:selected': { templateId: string };
} 