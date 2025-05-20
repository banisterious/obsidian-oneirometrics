# Journal Structure Check - Implementation Plan

## Overview

This document outlines the implementation plan for the Journal Structure Check feature, which will help users maintain consistent dream journal structures and validate their entries against predefined patterns. The implementation will follow a phased approach and include integration with Templater for advanced template support.

## 1. Phased Implementation Framework

### Phase 1: Foundation (1-2 weeks)
- Create core linting engine
- Implement basic structure validation (flat structures)
- Add settings UI for enabling/disabling feature
- Create validation test modal
- Implement basic rule management

### Phase 2: Advanced Validation (2-3 weeks)
- Add nested structure validation
- Implement metrics list validation
- Add structure templates
- Create template management UI
- Implement Templater integration

### Phase 3: User Experience (2-3 weeks)
- Add quick fixes
- Create visual validator in editor
- Implement guided setup wizard
- Add comprehensive testing framework
- Create documentation and examples

### Phase 4: Integration & Polish (1-2 weeks)
- Integrate with Linter plugin
- Optimize performance
- Add advanced features (rule priority, rule persistence)
- Conduct usability testing
- Refine based on user feedback

## 2. Technical Implementation

### 2.1 Core Components

#### LintingEngine
```typescript
class LintingEngine {
    private rules: LintingRule[];
    private structures: CalloutStructure[];
    private templates: JournalTemplate[];
    
    constructor(settings: LintingSettings) {
        this.rules = settings.rules;
        this.structures = settings.structures;
        this.templates = settings.templates;
    }
    
    validate(content: string): ValidationResult[] {
        // Implementation details...
    }
    
    applyQuickFix(content: string, result: ValidationResult): string {
        // Implementation details...
    }
    
    getTemplateForContent(content: string): JournalTemplate | null {
        // Find best matching template...
    }
}
```

#### ContentParser
```typescript
class ContentParser {
    private settings: ContentIsolationSettings;
    
    constructor(settings: ContentIsolationSettings) {
        this.settings = settings;
    }
    
    parseCallouts(content: string): CalloutBlock[] {
        // Parse nested callout structure...
    }
    
    parseMetrics(content: string): MetricEntry[] {
        // Extract metrics from callouts...
    }
    
    stripMarkdown(content: string): string {
        // Remove markdown elements based on settings...
    }
}
```

#### ValidationResult
```typescript
interface ValidationResult {
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

interface QuickFix {
    title: string;
    action: (content: string) => string;
}
```

### 2.2 Settings Structure

```typescript
interface LintingSettings {
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

interface LintingRule {
    id: string;
    name: string;
    description: string;
    type: 'structure' | 'format' | 'content' | 'custom';
    severity: 'error' | 'warning' | 'info';
    enabled: boolean;
    pattern: string | RegExp;
    message: string;
    priority: number;
    quickFixes?: Array<{
        title: string;
        pattern: string | RegExp;
        replacement: string;
    }>;
}

interface CalloutStructure {
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

interface JournalTemplate {
    id: string;
    name: string;
    description: string;
    structure: string; // References a CalloutStructure.id
    content: string;
    isTemplaterTemplate: boolean;
    templaterFile?: string;
}

interface ContentIsolationSettings {
    // Various ignoreX flags...
    ignoreImages: boolean;
    ignoreLinks: boolean;
    // etc.
    customIgnorePatterns: string[];
}
```

### 2.3 UI Components

#### Settings Tab
- Enable/disable linting
- Rule management (add, edit, delete, enable/disable)
- Structure configuration
- Template management
- Templater integration settings
- Content isolation settings
- Validation display options

#### Test Modal
- Input area for markdown
- Live preview with validation indicators
- Results area with error/warning messages
- Quick fix suggestions
- Template selection and application

#### In-Editor Validation
- Inline validation indicators
- Hover tooltips with error details
- Quick fix action buttons
- Structure visualization

#### Template Wizard
- Step-by-step guide for creating journal structure
- Preview of structure
- Template selection and customization
- Templater integration options

## 3. Templater Integration

### 3.1 Functionality
- Detect Templater plugin and enable integration if available
- Allow selection of Templater templates for journal structures
- Support Templater variables in structure validation
- Provide special validation rules for Templater syntax

### 3.2 Implementation Details

#### Templater Detection
```typescript
class TemplaterIntegration {
    private plugin: DreamMetricsPlugin;
    
    constructor(plugin: DreamMetricsPlugin) {
        this.plugin = plugin;
    }
    
    isTemplaterInstalled(): boolean {
        return this.plugin.app.plugins.plugins['templater-obsidian'] !== undefined;
    }
    
    getTemplaterTemplates(): string[] {
        // Return list of available Templater templates
    }
    
    getTemplateContent(templatePath: string): string {
        // Return template content
    }
    
    parseTemplaterVariables(content: string): TemplaterVariable[] {
        // Extract Templater variables for validation
    }
    
    // Support for executing Templater on a string
    async processTemplaterTemplate(templateContent: string, data?: any): Promise<string> {
        // Process template with Templater
    }
}

interface TemplaterVariable {
    name: string;
    type: 'date' | 'prompt' | 'system' | 'custom';
    position: {
        start: { line: number; column: number; };
        end: { line: number; column: number; };
    };
    defaultValue?: string;
}
```

#### Template Selection UI
- Browse and select from available Templater templates
- Preview template with dummy values
- Customize template for dream journal use
- Save as a journal structure template

#### Structure Validation with Templater
- Special handling for Templater syntax in validation
- Support for date variables in date validation
- Optional validation of prompt variables
- Ignoring Templater system commands during validation

## 4. User Experience Enhancements

### 4.1 Visual Structure Validator
- Highlight callout blocks with different colors based on type
- Show inline indicators for structural issues
- Provide hover tooltips with context-specific guidance
- Add quick-action buttons for fixing common issues

### 4.2 Structure Templates
- Predefined templates for common journal structures
- User-defined custom templates
- Template marketplace/sharing
- One-click template application
- Template variables for customization

### 4.3 Guided Setup Wizard
- Welcome screen with overview
- Structure selection step
- Customization step
- Template integration step
- Validation rules configuration
- Final setup and examples

### 4.4 Visual Examples
- Interactive examples of valid structures
- Before/after examples for common fixes
- Animated demonstrations of structure concepts
- Copy-paste example templates

## 5. Testing Framework

### 5.1 Automated Tests
```typescript
interface LintingTest {
    name: string;
    content: string;
    expectedResults: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
        specificErrors?: string[];
    };
}

class LintingTestSuite {
    private tests: LintingTest[];
    private engine: LintingEngine;
    
    constructor(engine: LintingEngine) {
        this.engine = engine;
        this.tests = [];
    }
    
    addTest(test: LintingTest): void {
        this.tests.push(test);
    }
    
    runTests(): TestResult[] {
        // Implementation details...
    }
}
```

### 5.2 Test Cases
- Valid flat structures
- Valid nested structures
- Invalid structures (various error types)
- Edge cases (empty content, very large content)
- Performance benchmarks
- Template validation tests
- Templater integration tests
- Quick fix tests

### 5.3 Test UI
- Test runner in settings
- Visual test results
- Performance metrics
- Export/import test cases
- Custom test creation

## 6. File Structure

```
src/
  linting/
    LintingEngine.ts         # Core validation engine
    ContentParser.ts         # Content parsing and isolation
    TemplaterIntegration.ts  # Templater plugin integration
    ui/
      LintingSettingsTab.ts  # Settings UI
      TestModal.ts           # Validation test modal
      TemplateWizard.ts      # Template setup wizard
      EditorExtension.ts     # Editor integration for validation
    templates/
      DefaultTemplates.ts    # Built-in structure templates
      TemplateManager.ts     # Template management
    rules/
      RuleManager.ts         # Rule management
      DefaultRules.ts        # Built-in validation rules
    tests/
      TestSuite.ts           # Automated testing framework
      TestCases.ts           # Test case definitions
```

## 7. Integration with Existing Code

### 7.1 Plugin Integration
```typescript
export default class DreamMetricsPlugin extends Plugin {
    private lintingEngine: LintingEngine;
    private templaterIntegration: TemplaterIntegration;
    
    async onload() {
        // Existing code...
        
        // Initialize linting components
        this.templaterIntegration = new TemplaterIntegration(this);
        this.lintingEngine = new LintingEngine(this.settings.linting, this.templaterIntegration);
        
        // Register commands
        this.addCommand({
            id: 'validate-dream-journal',
            name: 'Validate Dream Journal Structure',
            callback: () => this.validateCurrentFile()
        });
        
        this.addCommand({
            id: 'open-validation-test',
            name: 'Open Validation Test Modal',
            callback: () => new TestModal(this.app, this).open()
        });
        
        this.addCommand({
            id: 'apply-journal-template',
            name: 'Apply Journal Template',
            callback: () => this.showTemplateSelector()
        });
        
        // Editor extension for inline validation
        if (this.settings.linting.userInterface.showInlineValidation) {
            this.registerEditorExtension([buildLintingExtension(this)]);
        }
    }
}
```

### 7.2 Settings Tab Integration
```typescript
class DreamMetricsSettingTab extends PluginSettingTab {
    display(): void {
        // Existing code...
        
        // Add linting section
        containerEl.createEl('h3', { text: 'Journal Structure Check' });
        
        new Setting(containerEl)
            .setName('Enable Structure Validation')
            .setDesc('Validate journal entries against defined structures')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.linting.enabled)
                .onChange(async (value) => {
                    this.plugin.settings.linting.enabled = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('Structure Rules')
            .setDesc('Configure validation rules for journal structures')
            .addButton(button => button
                .setButtonText('Edit Rules')
                .onClick(() => new RuleManagerModal(this.plugin.app, this.plugin).open()));
        
        new Setting(containerEl)
            .setName('Journal Templates')
            .setDesc('Manage templates for dream journal entries')
            .addButton(button => button
                .setButtonText('Manage Templates')
                .onClick(() => new TemplateManagerModal(this.plugin.app, this.plugin).open()));
        
        // Templater integration
        if (this.plugin.templaterIntegration.isTemplaterInstalled()) {
            containerEl.createEl('h4', { text: 'Templater Integration' });
            
            new Setting(containerEl)
                .setName('Enable Templater Integration')
                .setDesc('Use Templater templates for journal structures')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.linting.templaterIntegration.enabled)
                    .onChange(async (value) => {
                        this.plugin.settings.linting.templaterIntegration.enabled = value;
                        await this.plugin.saveSettings();
                    }));
            
            // More Templater settings...
        }
    }
}
```

## 8. Implementation Schedule

### Week 1-2: Phase 1 - Foundation
- Set up basic file structure
- Implement core LintingEngine
- Create ContentParser
- Add basic Settings UI
- Implement Test Modal

### Week 3-5: Phase 2 - Advanced Validation
- Implement nested structure validation
- Add metrics list validation
- Create template system
- Implement Templater integration
- Add template management UI

### Week 6-8: Phase 3 - User Experience
- Implement visual validator
- Create guided setup wizard
- Add quick fixes
- Develop testing framework
- Create documentation and examples

### Week 9-10: Phase 4 - Integration & Polish
- Integrate with Linter plugin
- Optimize performance
- Add advanced features
- Conduct usability testing
- Refine based on feedback

## 9. Testing and Quality Assurance

### 9.1 Unit Tests
- Test LintingEngine with various inputs
- Test ContentParser with edge cases
- Test TemplaterIntegration
- Test rule application logic

### 9.2 Integration Tests
- Test with existing dream journal entries
- Test with Templater templates
- Test with different Obsidian themes
- Test with various device sizes

### 9.3 User Testing
- Create test scenarios for common workflows
- Gather feedback on usability
- Measure performance metrics
- Identify pain points

### 9.4 Documentation
- Create user guide
- Add examples to documentation
- Create troubleshooting guide
- Add visual examples

## 10. Conclusion

This implementation plan outlines a comprehensive approach to adding journal structure checking to the OneiroMetrics plugin. By following this phased approach, we can deliver incremental value while building toward a robust and user-friendly system for maintaining consistent dream journal structures.

The plan emphasizes:
- Flexibility for different user workflows
- Integration with existing tools
- Strong testing and validation
- Clear user guidance
- Performance considerations

By implementing these features, we'll help users maintain more consistent dream journals, improving the quality of data for analysis and insights. 