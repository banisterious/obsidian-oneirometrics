# Journal Structure Check - Implementation Plan

## Table of Contents

- [Overview](#overview)
- [Executive Summary](#executive-summary)
- [1. Phased Implementation Framework](#1-phased-implementation-framework)
  - [Phase 1: Foundation](#phase-1-foundation)
  - [Phase 2: Advanced Validation](#phase-2-advanced-validation)
  - [Phase 3: User Experience](#phase-3-user-experience)
  - [Phase 4: UI Reorganization](#phase-4-ui-reorganization)
  - [Phase 5: Integration & Polish](#phase-5-integration--polish)
- [2. Implementation Schedule](#2-implementation-schedule)
- [3. Technical Implementation](#3-technical-implementation)
  - [3.1 Core Components](#31-core-components)
  - [3.2 Settings Structure](#32-settings-structure)
  - [3.3 UI Components](#33-ui-components)
- [4. Templater Integration](#4-templater-integration)
  - [4.1 Functionality](#41-functionality)
  - [4.2 Implementation Details](#42-implementation-details)
- [5. User Experience Enhancements](#5-user-experience-enhancements)
  - [5.1 Visual Structure Validator](#51-visual-structure-validator)
  - [5.2 Structure Templates](#52-structure-templates)
  - [5.3 Guided Setup Wizard](#53-guided-setup-wizard)
  - [5.4 Visual Examples](#54-visual-examples)
  - [5.5 UI Reorganization](#55-ui-reorganization)
  - [5.6 Linter Plugin Integration](#56-linter-plugin-integration)
- [6. Testing Framework](#6-testing-framework)
  - [6.1 Automated Tests](#61-automated-tests)
  - [6.2 Test Cases](#62-test-cases)
  - [6.3 Test UI](#63-test-ui)
- [7. File Structure](#7-file-structure)
- [8. Integration with Existing Code](#8-integration-with-existing-code)
  - [8.1 Plugin Integration](#81-plugin-integration)
  - [8.2 Settings Tab Integration](#82-settings-tab-integration)
  - [8.3 Journal Structure Modal Implementation](#83-journal-structure-modal-implementation)
- [9. Testing and Quality Assurance](#9-testing-and-quality-assurance)
  - [9.1 Unit Tests](#91-unit-tests)
  - [9.2 Integration Tests](#92-integration-tests)
  - [9.3 User Testing](#93-user-testing)
  - [9.4 Documentation](#94-documentation)
- [10. Conclusion](#10-conclusion)

## Overview

The Journal Structure Check is a sophisticated feature designed to help users maintain consistent and well-structured dream journal entries within the OneiroMetrics plugin. This document provides a comprehensive implementation plan that covers all aspects of developing this feature, from core validation capabilities to user interface design.

The Journal Structure Check addresses several key challenges faced by dream journalers:
- Inconsistent journal formatting making it difficult to analyze patterns
- Varying structure of dream entries leading to data quality issues
- Manual effort required to maintain consistent formatting
- Missing key information in dream entries affecting analysis quality

This implementation plan outlines a phased approach to developing a robust system for validating journal entries, creating templates, and providing guidance to users on maintaining optimal dream journal structures. The feature will integrate seamlessly with the existing OneiroMetrics plugin while providing powerful new capabilities for both basic and advanced users.

## Executive Summary

This document outlines a comprehensive plan for implementing the Journal Structure Check feature in the OneiroMetrics plugin. The feature will help users maintain consistent dream journal structures and validate their entries against predefined patterns.

Key deliverables include:
- Core validation engine for checking journal structures
- Template system with Templater integration
- Visual editor interface with guided setup wizard
- Dedicated modal interface for all journal structure features
- Integration with Linter plugin for enhanced validation

The implementation follows five sequential phases:
1. **Foundation**: Core engine and basic validation
2. **Advanced Validation**: Templates and Templater integration
3. **User Experience**: Visual tools and guided setup
4. **UI Reorganization**: Dedicated modal and simplified settings
5. **Integration & Polish**: Linter plugin integration and refinements

## 1. Phased Implementation Framework

### Phase 1: Foundation
- Create core linting engine
- Implement basic structure validation (flat structures)
- Add settings UI for enabling/disabling feature
- Create validation test modal
- Implement basic rule management

### Phase 2: Advanced Validation
- Add nested structure validation
- Implement metrics list validation
- Add structure templates
- Create template management UI
- Implement Templater integration

### Phase 3: User Experience
- Add quick fixes
- Create visual validator in editor
- Implement guided setup wizard
- Add comprehensive testing framework
- Create documentation and examples

### Phase 4: UI Reorganization

#### 4.1 Overview
The UI Reorganization phase addresses the growing complexity of the Settings tab by creating a dedicated Journal Structure modal. This modal will serve as a central hub for all journal structure features, providing a more organized and scalable user interface.

#### 4.2 UI Mockups

##### 4.2.1 Simplified Settings Tab
```
+--------------------------------------+
| Journal Structure                    |
+--------------------------------------+
| Enable Structure Validation  [✓]     |
|                                      |
| Test Structure Validation   [Button] |
|                                      |
| Journal Structure           [Button] |
|                                      |
| Templater Status: Installed          |
+--------------------------------------+
```

##### 4.2.2 Journal Structure Modal
```
+------------------------------------------------------+
| Journal Structure                                    |
+------------------------------------------------------+
| Structure Settings (Expanded)                     v  |
| +--------------------------------------------------+ |
| | Enable Structure Validation  [✓]                 | |
| | Default Structure:  [Dropdown]                   | |
| | Apply Structure to New Notes  [✓]                | |
| | Structure Indicator in Status Bar  [✓]           | |
| +--------------------------------------------------+ |
|                                                      |
| Template Management (Expanded)                    v  |
| +--------------------------------------------------+ |
| | Available Templates:                             | |
| | - Default Dream Journal       [Edit] [Delete]    | |
| | - Lucid Dream Journal        [Edit] [Delete]     | |
| | - Dream Analysis Template    [Edit] [Delete]     | |
| |                                                  | |
| | Create New Template                    [Button]  | |
| | Import Template                        [Button]  | |
| +--------------------------------------------------+ |
|                                                      |
| Validation Rules (Collapsed)                      >  |
|                                                      |
| Templater Integration (Collapsed)                 >  |
+------------------------------------------------------+
```

#### 4.3 Component Specifications

##### 4.3.1 Simplified Settings Tab
- **Section Header**: "Journal Structure" heading
- **Toggle Component**: Enable/disable structure validation checkbox
- **Button Component**: "Test Structure Validation" button that opens the test modal
- **Button Component**: "Journal Structure" button that opens the new Journal Structure modal
- **Status Component**: Templater detection status indicator with appropriate styling

##### 4.3.2 Journal Structure Modal
- **Modal Container**: Full-width modal with responsive layout
- **Section Components**: Four collapsible sections with expand/collapse controls
  - Structure Settings
  - Template Management
  - Validation Rules
  - Templater Integration
- **Template List Component**: Sortable list of templates with edit/delete actions
- **Action Buttons**: Create/Import buttons for template management
- **Form Elements**: Various inputs, dropdowns, and toggles for configuration

#### 4.4 Settings Migration Plan

| Current Location | New Location | Setting |
|------------------|--------------|---------|
| Settings Tab → Linting | Journal Structure Modal → Structure Settings | Enable Structure Validation |
| Settings Tab → Linting | Journal Structure Modal → Structure Settings | Default Structure |
| Settings Tab → Linting | Journal Structure Modal → Structure Settings | Apply to New Notes |
| Settings Tab → Linting | Journal Structure Modal → Structure Settings | Show Indicators |
| Settings Tab → Templates | Journal Structure Modal → Template Management | Template List |
| Settings Tab → Templates | Journal Structure Modal → Template Management | Create/Import Actions |
| Settings Tab → Validation | Journal Structure Modal → Validation Rules | Rule Configuration |
| Settings Tab → Templater | Journal Structure Modal → Templater Integration | Templater Settings |

Only these controls will remain in the Settings tab:
- Enable Structure Validation toggle
- Test Structure Validation button
- Journal Structure button
- Templater status indicator

#### 4.5 User Flow Diagrams

##### 4.5.1 Accessing Journal Structure Features
```
             +---------------+
             | Settings Tab  |
             +---------------+
                    |
          +---------+---------+          
          |                   |          
+---------v----------+  +-----v------+
| Test Validation    |  | Journal    |
| Modal              |  | Structure  |
+---------+----------+  | Modal      |
          |             +-----+------+
          |                   |
          |    +------------+ |
          +----+ Template   +-+
          |    | Management | |
          |    +------------+ |
          |    +------------+ |
          +----+ Validation +-+
          |    | Rules      | |
          |    +------------+ |
          |    +------------+ |
          +----+ Templater  | |
               | Integration| |
               +------------+ |
                              v
                        +-----------+
                        | Command   |
                        | Palette   |
                        +-----------+
```

#### 4.6 Command Integration Details

##### 4.6.1 New Commands
- **Open Journal Structure**: Opens the main Journal Structure modal
- **Create New Template**: Opens the modal directly to template creation
- **Validate Current Note**: Runs validation on the current note
- **Apply Template to Note**: Opens template selector for current note

#### 4.7 Implementation Tasks

1. **Create Modal Framework**
   - Create basic modal structure with sections
   - Implement collapsible section component
   - Add navigation between sections

2. **Simplify Settings Tab**
   - Update settings tab to remove detailed settings
   - Add Journal Structure button
   - Create simplified Templater status indicator

3. **Migrate Settings**
   - Move settings from main tab to modal sections
   - Ensure settings persistence
   - Add migration code for existing settings

4. **Implement Template Management**
   - Create template list component
   - Integrate template creation/editing
   - Add template import/export functionality

5. **Add Command Integration**
   - Create new commands for direct access
   - Update existing commands to work with new modal
   - Add keyboard shortcuts for common actions

6. **Documentation Updates**
   - Update user documentation
   - Create visual guides for new UI
   - Update developer documentation

#### 4.8 Acceptance Criteria

- The Settings tab contains only the simplified Journal Structure section
- All journal structure settings are accessible through the modal
- Templates can be created, edited, and managed within the modal
- The modal sections expand and collapse properly
- Commands provide direct access to all key functionality
- All existing settings are preserved during migration
- The UI is responsive and works on all device sizes
- Keyboard navigation works properly throughout the modal

### Phase 5: Integration & Polish
- Integrate with Linter plugin
- Optimize performance
- Add advanced features (rule priority, rule persistence)
- Conduct usability testing
- Refine based on user feedback

## 2. Implementation Schedule

### Phase 1 - Foundation
- Set up basic file structure
- Implement core LintingEngine
- Create ContentParser
- Add basic Settings UI
- Implement Test Modal

### Phase 2 - Advanced Validation
- Implement nested structure validation
- Add metrics list validation
- Create template system
- Implement Templater integration
- Add template management UI

### Phase 3 - User Experience
- Implement visual validator
- Create guided setup wizard
- Add quick fixes
- Develop testing framework
- Create documentation and examples

### Phase 4 - UI Reorganization
- Create a new dedicated Journal Structure modal
- Move Journal Structure Check settings from Settings tab to the new modal
- Rename "Templater Integration" section to "Journal Structure" in Settings
- Add a "Journal Structure" button in Settings to open the dedicated modal
- Consolidate Create Template and Manage Template modals into the new Journal Structure modal
- Implement collapsible sections for template management and other features
- Update documentation to reflect UI changes
- Update command palette with direct access to the new modal

### Phase 5 - Integration & Polish
- Integrate with Linter plugin
- Optimize performance
- Add advanced features
- Conduct usability testing
- Refine based on feedback

## 3. Technical Implementation

### 3.1 Core Components

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

### 3.2 Settings Structure

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

### 3.3 UI Components

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

## 4. Templater Integration

### 4.1 Functionality
- Detect Templater plugin and enable integration if available
- Allow selection of Templater templates for journal structures
- Support Templater variables in structure validation
- Provide special validation rules for Templater syntax

### 4.2 Implementation Details

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

## 5. User Experience Enhancements

### 5.1 Visual Structure Validator
- Highlight callout blocks with different colors based on type
- Show inline indicators for structural issues
- Provide hover tooltips with context-specific guidance
- Add quick-action buttons for fixing common issues

### 5.2 Structure Templates
- Predefined templates for common journal structures
- User-defined custom templates
- Template marketplace/sharing
- One-click template application
- Template variables for customization

### 5.3 Guided Setup Wizard
- Welcome screen with overview
- Structure selection step
- Customization step
- Template integration step
- Validation rules configuration
- Final setup and examples

### 5.4 Visual Examples
- Interactive examples of valid structures
- Before/after examples for common fixes
- Animated demonstrations of structure concepts
- Copy-paste example templates

### 5.5 UI Reorganization
- **Dedicated Journal Structure Modal**: A comprehensive interface separate from the Settings tab, providing more space and focused organization for journal structure features
- **Simplified Settings**: The main Settings tab will be streamlined, with a single "Journal Structure" section containing a button to access the dedicated modal
- **Consolidated Template Management**: Template creation and management features will be combined into collapsible sections within the new modal
- **Improved Navigation**: Direct access through command palette and settings provides multiple paths to the feature
- **Visual Organization**: Collapsible sections allow for better organization of related features while maintaining a clear overview
- **Scalability**: The new structure provides room for future feature expansion without further cluttering the Settings tab
- **Consistent Experience**: Template creation, structure validation, and management all accessible from a single, cohesive interface

### 5.6 Linter Plugin Integration

#### 5.6.1 Dream Journal Structure Rules
- **Callout Format Validation**
  - Integrate with Linter to enforce consistent callout syntax
  - Validate nested callout hierarchy using Linter's document traversal
  - Provide custom error messages specific to dream journal structures
- **Metrics Consistency**
  - Use Linter's rule engine to check metric name standardization
  - Validate that metric values fall within defined ranges
  - Flag duplicate metrics in the same entry
- **Date Format Standardization**
  - Enforce consistent date formatting across journal entries
  - Leverage Linter's quick fixes to auto-correct variant date formats

#### 5.6.2 Content Processing Integration
- **Automated Tag Extraction**
  - Parse dream content to suggest and standardize tags for recurring themes
  - Create consistent hashtag formatting for dream categories
- **Dream Character Normalization**
  - Identify and standardize recurring character names in dreams
  - Create a consistent reference system for dream personas
- **Citation Formatting**
  - Standardize references to other dreams or notes
  - Ensure proper linking format for cross-referencing related dreams

#### 5.6.3 Template Validation
- **Template Application Checks**
  - Use Linter to verify that new entries follow selected template formats
  - Flag entries missing required sections from templates
- **Placeholder Completion Validation**
  - Integrate with Linter to identify unfilled template placeholders
  - Provide quick fixes to suggest content for empty required fields

#### 5.6.4 Document Organization Rules
- **Structure Validation**
  - Use Linter's heading level validation for dream entries
  - Check for required sections using Linter's document structure analysis
- **Metadata Standardization**
  - Leverage Linter's YAML frontmatter validation
  - Create custom rules for dream-specific metadata properties

#### 5.6.5 Implementation Approach
- **API Integration**: Use Linter's rule engine while maintaining specialized dream journal validation
- **Rule Sharing**: Export Journal Structure validation rules to Linter
- **Complementary Workflows**: Define boundaries where Linter handles general formatting while Journal Structure Check focuses on dream-specific validation
- **Quick Fix Integration**: Offer OneiroMetrics' template insertion and structure fixes through Linter's interface

## 6. Testing Framework

### 6.1 Automated Tests
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

### 6.2 Test Cases
- Valid flat structures
- Valid nested structures
- Invalid structures (various error types)
- Edge cases (empty content, very large content)
- Performance benchmarks
- Template validation tests
- Templater integration tests
- Quick fix tests

### 6.3 Test UI
- Test runner in settings
- Visual test results
- Performance metrics
- Export/import test cases
- Custom test creation

## 7. File Structure

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

## 8. Integration with Existing Code

### 8.1 Plugin Integration
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

### 8.2 Settings Tab Integration
```typescript
class DreamMetricsSettingTab extends PluginSettingTab {
    display(): void {
        // Existing code...
        
        // Add Journal Structure section
        containerEl.createEl('h3', { text: 'Journal Structure' });
        
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
            .setName('Test Structure Validation')
            .setDesc('Test validation rules on sample content')
            .addButton(button => button
                .setButtonText('Open Test Modal')
                .onClick(() => new TestModal(this.app, this.plugin).open()));
                
        new Setting(containerEl)
            .setName('Journal Structure')
            .setDesc('Configure templates, validation rules, and structure options')
            .addButton(button => button
                .setButtonText('Open Journal Structure')
                .onClick(() => new JournalStructureModal(this.app, this.plugin).open()));
        
        // Templater detection information
        if (this.plugin.templaterIntegration.isTemplaterInstalled()) {
            new Setting(containerEl)
                .setName('Templater Status')
                .setDesc('Templater plugin is installed and will be used for templates')
                .setClass('oom-templater-status-success');
        } else {
            new Setting(containerEl)
                .setName('Templater Status')
                .setDesc('Templater plugin is not installed. Templates will use static placeholders instead.')
                .setClass('oom-templater-status-warning');
        }
    }
}
```

### 8.3 Journal Structure Modal Implementation
```typescript
class JournalStructureModal extends Modal {
    constructor(app: App, private plugin: DreamMetricsPlugin) {
        super(app);
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl('h2', { text: 'Journal Structure' });
        
        // Create tabbed interface or sections
        const container = contentEl.createDiv({ cls: 'oom-journal-structure-container' });
        
        // Section: Structure Settings
        const settingsSection = this.createSection(container, 'Structure Settings', true);
        this.buildSettingsSection(settingsSection);
        
        // Section: Template Management
        const templatesSection = this.createSection(container, 'Template Management', true);
        this.buildTemplatesSection(templatesSection);
        
        // Section: Validation Rules
        const rulesSection = this.createSection(container, 'Validation Rules', false);
        this.buildRulesSection(rulesSection);
        
        // Section: Templater Integration
        const templaterSection = this.createSection(container, 'Templater Integration', false);
        this.buildTemplaterSection(templaterSection);
    }
    
    private createSection(container: HTMLElement, title: string, expanded: boolean): HTMLElement {
        const section = container.createDiv({ cls: 'oom-journal-structure-section' });
        const header = section.createDiv({ cls: 'oom-journal-structure-section-header' });
        
        const expandIcon = header.createSpan({ 
            cls: `oom-journal-structure-section-icon ${expanded ? 'expanded' : 'collapsed'}` 
        });
        
        header.createEl('h3', { text: title });
        
        const content = section.createDiv({ 
            cls: 'oom-journal-structure-section-content'
        });
        
        if (!expanded) {
            content.style.display = 'none';
        }
        
        // Toggle expansion when header is clicked
        header.addEventListener('click', () => {
            const isExpanded = expandIcon.classList.contains('expanded');
            
            if (isExpanded) {
                expandIcon.classList.remove('expanded');
                expandIcon.classList.add('collapsed');
                content.style.display = 'none';
            } else {
                expandIcon.classList.remove('collapsed');
                expandIcon.classList.add('expanded');
                content.style.display = 'block';
            }
        });
        
        return content;
    }
    
    // Implementation of section builders...
    private buildSettingsSection(container: HTMLElement) {
        // Structure validation settings
    }
    
    private buildTemplatesSection(container: HTMLElement) {
        // Template management UI
    }
    
    private buildRulesSection(container: HTMLElement) {
        // Validation rules configuration
    }
    
    private buildTemplaterSection(container: HTMLElement) {
        // Templater integration options
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
```

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