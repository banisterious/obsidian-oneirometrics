# Dream Journal Structure Check – Technical Implementation Plan

## Overview
This document outlines the technical plan for implementing a comprehensive structure checking system for dream journal entries in the OneiroMetrics plugin. The system will allow users to define, validate, and test the structure of their journal entries, dream diaries, and metrics callouts. It will integrate with the existing Metrics Callout Customizations feature to provide a unified interface for managing and validating dream journal formatting.

---

## 1. Linting Configuration Structure

### 1.1 Settings Interface
```typescript
interface LintingRule {
    id: string;
    type: 'structure' | 'format' | 'content' | 'custom';
    severity: 'error' | 'warning' | 'info';
    description: string;
    pattern: string | RegExp;
    message: string;
    fix?: string | ((content: string) => string);
}

interface CalloutStructure {
    type: 'journal-entry' | 'dream-diary' | 'dream-metrics';
    requiredFields: string[];
    optionalFields: string[];
    metadata: {
        allowed: string[];
        required: string[];
    };
    nesting: {
        allowed: string[];
        required: string[];
    };
}

interface LintingSettings {
    rules: LintingRule[];
    structures: {
        [key: string]: CalloutStructure;
    };
    enabled: boolean;
    autoFix: boolean;
    showWarnings: boolean;
    access: LintingAccessSettings;
    metricsListRules: MetricsListRule[];
    contentIsolation: {
        ignoreImages: boolean;
        ignoreLinks: boolean;
        ignoreTables: boolean;
        ignoreHtml: boolean;
        ignoreCode: boolean;
        ignoreCallouts: boolean;
        ignoreMath: boolean;
        ignoreFootnotes: boolean;
        ignoreTags: boolean;
        ignoreMentions: boolean;
        ignoreHighlights: boolean;
        ignoreComments: boolean;
        ignoreEmbeds: boolean;
        ignoreYaml: boolean;
        ignoreTasks: boolean;
        ignoreQuotes: boolean;
        ignoreHorizontalRules: boolean;
        ignoreDefinitions: boolean;
        ignoreMermaid: boolean;
        ignorePlantuml: boolean;
        customIgnorePatterns: string[];
    };
}
```

### 1.2 Default Rules
- Journal Entry Structure
- Dream Diary Nesting
- Metrics Format
- Date Format
- Required Fields
- Metadata Validation

## 2. Linting UI Components

### 2.1 Settings Tab Section
- Enable/Disable Linting
- Rule Management
- Structure Configuration
- Test Modal Integration
- Import/Export Rules

### 2.2 Test Modal
- Markdown Input Area
- Live Preview
- Validation Results
- Quick Fix Suggestions
- Structure Examples

### 2.3 Validation Display
- Inline Error/Warning Indicators
- Error/Warning List
- Quick Fix Buttons
- Structure Visualization

## 3. Core Linting Logic

### 3.1 Validation Engine
```typescript
class LintingEngine {
    private rules: LintingRule[];
    private structures: { [key: string]: CalloutStructure };

    constructor(settings: LintingSettings) {
        this.rules = settings.rules;
        this.structures = settings.structures;
    }

    validate(content: string): ValidationResult[] {
        const results: ValidationResult[] = [];
        
        // Parse content into callout blocks
        const blocks = this.parseCallouts(content);
        
        // Validate structure
        this.validateStructure(blocks, results);
        
        // Apply rules
        this.applyRules(blocks, results);
        
        return results;
    }

    private parseCallouts(content: string): CalloutBlock[] {
        // Implementation for parsing markdown into callout blocks
    }

    private validateStructure(blocks: CalloutBlock[], results: ValidationResult[]): void {
        // Implementation for structure validation
    }

    private applyRules(blocks: CalloutBlock[], results: ValidationResult[]): void {
        // Implementation for rule application
    }
}
```

### 3.2 Rule Application
- Structure Validation
- Format Checking
- Content Validation
- Custom Rule Processing

## 4. Integration with Existing Features

### 4.1 Metrics Callout Customizations
- Merge existing modal into Linting UI
- Preserve current functionality
- Add validation features
- Enhance preview capabilities

### 4.2 Settings Management
- Add Linting section to settings
- Implement rule management
- Add structure configuration
- Enable/disable features

### 4.3 Technical Integration
- For date and time handling implementation details, see [Date and Time Technical Specification](DATE_TIME_TECHNICAL.md)
- For styling and layout implementation details, see [Layout and Styling Technical Specification](LAYOUT_AND_STYLING.md)

## 5. User Interface Components

### 5.1 Settings UI
```typescript
class LintingSettingsTab extends PluginSettingTab {
    display(): void {
        const { containerEl } = this;
        
        // Core Settings
        new Setting(containerEl)
            .setName('Enable Structure Check')
            .setDesc('Enable or disable the journal structure checking system')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.linting.enabled)
                    .onChange(async (value) => {
                        this.plugin.settings.linting.enabled = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Rule Management
        containerEl.createEl('h3', { text: 'Rule Management' });
        new Setting(containerEl)
            .setName('Default Rules')
            .setDesc('Configure which default rules are active')
            .addButton(button => {
                button.setButtonText('Configure Rules')
                    .onClick(() => {
                        // Open rule configuration in the linting leaf
                        this.plugin.openLintingView();
                        // Switch to rules tab in the leaf
                        this.plugin.lintingLeaf?.showRulesTab();
                    });
            });

        // Structure Configuration
        containerEl.createEl('h3', { text: 'Callout Structures' });
        new Setting(containerEl)
            .setName('Structure Templates')
            .setDesc('Manage callout structure templates')
            .addButton(button => {
                button.setButtonText('Manage Templates')
                    .onClick(() => {
                        this.plugin.openLintingView();
                        this.plugin.lintingLeaf?.showTemplatesTab();
                    });
            });

        // Access Methods
        containerEl.createEl('h3', { text: 'Access Methods' });
        new Setting(containerEl)
            .setName('Show Ribbon Icon')
            .setDesc('Display the linting icon in the ribbon')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.linting.access.showRibbonIcon)
                    .onChange(async (value) => {
                        this.plugin.settings.linting.access.showRibbonIcon = value;
                        await this.plugin.saveSettings();
                        this.plugin.updateRibbonIcon();
                    });
            });

        // Linter Plugin Compatibility
        if (this.plugin.linterIntegration.getState().isInstalled) {
            containerEl.createEl('h3', { text: 'Linter Plugin Integration' });
            new Setting(containerEl)
                .setName('Linter Plugin Settings')
                .setDesc('Configure how this plugin works with the Linter plugin')
                .addButton(button => {
                    button.setButtonText('Configure Integration')
                        .onClick(() => {
                            this.plugin.openLintingView();
                            this.plugin.lintingLeaf?.showIntegrationTab();
                        });
                });
        }

        // Metrics List Rules Section
        containerEl.createEl('h3', { text: 'Metrics List Rules' });
        
        new Setting(containerEl)
            .setName('Enforce Metrics Order')
            .setDesc('Ensure metrics appear in the order defined in settings')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.linting.metricsListRules.some(r => r.enforceOrder))
                    .onChange(async (value) => {
                        this.updateMetricsListRule('enforceOrder', value);
                    });
            });

        new Setting(containerEl)
            .setName('Group Metrics By')
            .setDesc('Organize metrics by category or type')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('none', 'No Grouping')
                    .addOption('category', 'Category')
                    .addOption('type', 'Type')
                    .setValue(this.getCurrentGrouping())
                    .onChange(async (value) => {
                        this.updateMetricsListRule('groupBy', value);
                    });
            });

        new Setting(containerEl)
            .setName('Allow Additional Metrics')
            .setDesc('Allow metrics not defined in settings')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.linting.metricsListRules.some(r => r.allowAdditional))
                    .onChange(async (value) => {
                        this.updateMetricsListRule('allowAdditional', value);
                    });
            });

        // Content Isolation Settings
        containerEl.createEl('h3', { text: 'Content Isolation' });
        
        // Group settings by category
        this.addContentIsolationGroup(containerEl, 'Basic Markdown', [
            { name: 'Ignore Images', key: 'ignoreImages' },
            { name: 'Ignore Links', key: 'ignoreLinks' },
            { name: 'Ignore Tables', key: 'ignoreTables' },
            { name: 'Ignore Code Blocks', key: 'ignoreCode' },
            { name: 'Ignore HTML', key: 'ignoreHtml' }
        ]);

        this.addContentIsolationGroup(containerEl, 'Obsidian Features', [
            { name: 'Ignore Callouts', key: 'ignoreCallouts' },
            { name: 'Ignore Embeds', key: 'ignoreEmbeds' },
            { name: 'Ignore Tags', key: 'ignoreTags' },
            { name: 'Ignore Mentions', key: 'ignoreMentions' },
            { name: 'Ignore Comments', key: 'ignoreComments' }
        ]);

        this.addContentIsolationGroup(containerEl, 'Formatting', [
            { name: 'Ignore Math', key: 'ignoreMath' },
            { name: 'Ignore Footnotes', key: 'ignoreFootnotes' },
            { name: 'Ignore Highlights', key: 'ignoreHighlights' },
            { name: 'Ignore Quotes', key: 'ignoreQuotes' },
            { name: 'Ignore Horizontal Rules', key: 'ignoreHorizontalRules' },
            { name: 'Ignore Definitions', key: 'ignoreDefinitions' }
        ]);

        this.addContentIsolationGroup(containerEl, 'Diagrams and Frontmatter', [
            { name: 'Ignore YAML Frontmatter', key: 'ignoreYaml' },
            { name: 'Ignore Tasks', key: 'ignoreTasks' },
            { name: 'Ignore Mermaid Diagrams', key: 'ignoreMermaid' },
            { name: 'Ignore PlantUML Diagrams', key: 'ignorePlantuml' }
        ]);

        // Custom patterns
        new Setting(containerEl)
            .setName('Custom Ignore Patterns')
            .setDesc('Additional regex patterns to ignore (one per line)')
            .addTextArea(text => {
                text.setValue(this.plugin.settings.linting.contentIsolation.customIgnorePatterns.join('\n'))
                    .onChange(async (value) => {
                        this.plugin.settings.linting.contentIsolation.customIgnorePatterns = 
                            value.split('\n').map(p => p.trim()).filter(Boolean);
                        await this.plugin.saveSettings();
                    });
            });
    }

    private addContentIsolationGroup(
        container: HTMLElement,
        groupName: string,
        settings: { name: string; key: keyof LintingSettings['contentIsolation'] }[]
    ): void {
        container.createEl('h4', { text: groupName });
        
        for (const setting of settings) {
            new Setting(container)
                .setName(setting.name)
                .setDesc(`Skip validation of ${setting.name.toLowerCase().replace('ignore ', '')} content`)
                .addToggle(toggle => {
                    toggle.setValue(this.plugin.settings.linting.contentIsolation[setting.key] as boolean)
                        .onChange(async (value) => {
                            this.plugin.settings.linting.contentIsolation[setting.key] = value;
                            await this.plugin.saveSettings();
                        });
                });
        }
    }

    private updateMetricsListRule(key: keyof MetricsListRule, value: any): void {
        const rules = this.plugin.settings.linting.metricsListRules;
        if (rules.length === 0) {
            rules.push({
                id: 'default-metrics-rule',
                type: 'metrics-list',
                severity: 'warning',
                enforceOrder: false,
                requiredMetrics: [],
                optionalMetrics: [],
                customOrder: [],
                allowAdditional: true,
                groupBy: 'none'
            });
        }
        
        rules[0][key] = value;
        this.plugin.saveSettings();
    }

    private getCurrentGrouping(): string {
        const rule = this.plugin.settings.linting.metricsListRules[0];
        return rule?.groupBy || 'none';
    }
}
```

### 5.2 Test Modal
```typescript
class LintingTestModal extends Modal {
    private inputEl: HTMLTextAreaElement;
    private previewEl: HTMLElement;
    private resultsEl: HTMLElement;

    onOpen(): void {
        const { contentEl } = this;
        
        // Input Area
        this.inputEl = contentEl.createEl('textarea', {
            attr: { rows: '10' }
        });
        
        // Preview Area
        this.previewEl = contentEl.createEl('div', {
            cls: 'markdown-preview-view'
        });
        
        // Results Area
        this.resultsEl = contentEl.createEl('div', {
            cls: 'linting-results'
        });

        // Live Validation
        this.inputEl.addEventListener('input', this.debounce(() => {
            this.validateContent();
        }, 500));
    }

    private async validateContent(): Promise<void> {
        const content = this.inputEl.value;
        const results = await this.plugin.lintingEngine.validate(content);
        this.displayResults(results);
        this.updatePreview(content);
    }

    private displayResults(results: ValidationResult[]): void {
        // Implementation for displaying validation results
    }

    private updatePreview(content: string): void {
        // Implementation for updating the preview
    }
}
```

## 6. Styling and Theme Integration

### 6.1 CSS Classes
```css
.linting-settings {
    /* Settings tab styling */
}

.linting-test-modal {
    /* Test modal styling */
}

.linting-error {
    /* Error indicator styling */
}

.linting-warning {
    /* Warning indicator styling */
}

.linting-quick-fix {
    /* Quick fix button styling */
}

.oneirometrics-structure-check-leaf {
    padding: 1em;
}

.structure-check-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1em;
    padding-bottom: 0.5em;
    border-bottom: 1px solid var(--background-modifier-border);
}

.structure-check-issues {
    display: flex;
    flex-direction: column;
    gap: 1em;
}

.structure-check-status {
    margin-top: 1em;
    padding-top: 0.5em;
    border-top: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    font-size: 0.9em;
}
```

### 6.2 Theme Compatibility
- Use Obsidian's CSS variables
- Support light/dark themes
- Maintain consistent styling
- Ensure accessibility

## 7. Performance Considerations

### 7.1 Optimization Strategies
- Debounce validation
- Cache validation results
- Lazy load preview
- Optimize rule processing

### 7.2 Memory Management
- Clear validation cache
- Dispose event listeners
- Clean up DOM elements
- Handle large documents

## 8. Testing Requirements

### 8.1 Unit Tests
- Rule validation
- Structure parsing
- Error handling
- UI components

### 8.2 Integration Tests
- Settings integration
- Modal functionality
- Theme compatibility
- Performance metrics

## 9. Future Enhancements

### 9.1 Potential Features
- Custom rule creation
- Rule templates
- Batch validation
- Export/Import rules
- Advanced quick fixes
- Structure visualization

### 9.2 Performance Improvements
- Parallel validation
- Incremental updates
- Caching strategies
- Memory optimization

## 10. Editor Integration

### 10.1 Live Linting in Notes
```typescript
interface EditorLintingState {
    decorations: DecorationSet;
    calloutRanges: { from: number; to: number }[];
    validationResults: ValidationResult[];
}

class EditorLintingPlugin {
    private view: EditorView;
    private state: EditorLintingState;
    private lintingEngine: LintingEngine;

    constructor(view: EditorView, lintingEngine: LintingEngine) {
        this.view = view;
        this.lintingEngine = lintingEngine;
        this.state = {
            decorations: Decoration.none,
            calloutRanges: [],
            validationResults: []
        };
    }

    update(update: ViewUpdate) {
        // Only update if the document changed
        if (!update.docChanged) return;

        // Find journal-entry callouts
        this.state.calloutRanges = this.findCalloutRanges(update.state);
        
        // Validate each callout
        this.state.validationResults = [];
        for (const range of this.state.calloutRanges) {
            const content = update.state.sliceDoc(range.from, range.to);
            const results = this.lintingEngine.validate(content);
            this.state.validationResults.push(...results);
        }

        // Update decorations
        this.state.decorations = this.createDecorations(update.state);
    }

    private findCalloutRanges(state: EditorState): { from: number; to: number }[] {
        const ranges: { from: number; to: number }[] = [];
        const calloutRegex = /^> \[!journal-entry\].*$/gm;
        
        let match;
        while ((match = calloutRegex.exec(state.doc.toString())) !== null) {
            // Find the end of the callout block
            const start = match.index;
            const end = this.findCalloutEnd(state, start);
            ranges.push({ from: start, to: end });
        }
        
        return ranges;
    }

    private createDecorations(state: EditorState): DecorationSet {
        const decorations: Range<Decoration>[] = [];
        
        for (const result of this.state.validationResults) {
            const { line, column, message, severity } = result;
            const pos = state.doc.line(line).from + column;
            
            decorations.push(
                Decoration.widget({
                    pos,
                    widget: new LintingWidget(message, severity)
                })
            );
        }
        
        return Decoration.set(decorations);
    }
}

class LintingWidget extends WidgetType {
    constructor(
        private message: string,
        private severity: 'error' | 'warning' | 'info'
    ) {
        super();
    }

    toDOM() {
        const span = document.createElement('span');
        span.className = `linting-${this.severity}`;
        span.textContent = this.message;
        return span;
    }
}
```

### 10.2 Quick Fixes in Editor
```typescript
interface QuickFix {
    title: string;
    apply: (view: EditorView) => void;
}

class LintingQuickFixes {
    static getQuickFixes(result: ValidationResult): QuickFix[] {
        const fixes: QuickFix[] = [];
        
        switch (result.type) {
            case 'structure':
                fixes.push({
                    title: 'Fix Structure',
                    apply: (view) => this.fixStructure(view, result)
                });
                break;
            case 'format':
                fixes.push({
                    title: 'Fix Format',
                    apply: (view) => this.fixFormat(view, result)
                });
                break;
            // Add more fix types as needed
        }
        
        return fixes;
    }

    private static fixStructure(view: EditorView, result: ValidationResult) {
        // Implementation for structure fixes
    }

    private static fixFormat(view: EditorView, result: ValidationResult) {
        // Implementation for format fixes
    }
}
```

### 10.3 Editor Integration Setup
```typescript
class DreamMetricsPlugin {
    // ... existing code ...

    onload() {
        // ... existing code ...

        // Register editor extension
        this.registerEditorExtension([
            EditorView.decorations.of((view) => {
                const plugin = view.state.facets.linting?.find(p => p instanceof EditorLintingPlugin);
                return plugin?.state.decorations || Decoration.none;
            }),
            EditorView.updateListener.of((update) => {
                const plugin = update.state.facets.linting?.find(p => p instanceof EditorLintingPlugin);
                plugin?.update(update);
            })
        ]);
    }
}
```

### 10.4 CSS for Editor Decorations
```css
.linting-error {
    color: var(--text-error);
    border-bottom: 2px wavy var(--text-error);
}

.linting-warning {
    color: var(--text-warning);
    border-bottom: 2px wavy var(--text-warning);
}

.linting-info {
    color: var(--text-info);
    border-bottom: 2px wavy var(--text-info);
}

.linting-quick-fix {
    position: absolute;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 0.9em;
    cursor: pointer;
    z-index: 100;
}

.linting-quick-fix:hover {
    background: var(--background-modifier-hover);
}
```

### 10.5 Performance Considerations
- Debounce validation in editor
- Only validate visible callouts
- Cache validation results
- Use worker for heavy processing
- Optimize decoration updates

### 10.6 User Experience
- Show linting status in status bar
- Provide keyboard shortcuts for quick fixes
- Allow toggling live linting
- Show linting counts in gutter
- Support batch fixes

---

## Integration Notes
- Implement the LintingEngine first
- Add the settings UI
- Create the test modal
- Integrate with existing features
- Add styling and theme support
- Implement testing
- Document usage

---

**For further enhancements, consider adding AI-powered suggestions, advanced rule creation, or integration with other Obsidian plugins.**

## 11. Leaf-Based Linting Alternative

### 11.1 Linting Leaf Structure
```typescript
interface LintingLeafState {
    issues: LintingIssue[];
    lastUpdate: number;
    activeFile: string;
}

interface LintingIssue {
    id: string;
    type: 'structure' | 'format' | 'content' | 'custom';
    severity: 'error' | 'warning' | 'info';
    message: string;
    location: {
        file: string;
        line: number;
        column: number;
        length: number;
    };
    quickFixes: QuickFix[];
    calloutContent: string;
}

class LintingLeaf extends ItemView {
    private state: LintingLeafState;
    private lintingEngine: LintingEngine;

    getViewType(): string {
        return 'oneirometrics-structure-check';
    }

    getDisplayText(): string {
        return 'Journal Structure Check';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('oneirometrics-structure-check-leaf');

        // Header with controls
        const header = container.createEl('div', { cls: 'structure-check-header' });
        header.createEl('h3', { text: 'Journal Structure Check' });
        
        // Add refresh button
        const refreshBtn = header.createEl('button', { 
            text: 'Refresh',
            cls: 'mod-cta'
        });
        refreshBtn.onclick = () => this.refreshLinting();

        // Issues container
        this.issuesContainer = container.createEl('div', { 
            cls: 'structure-check-issues'
        });

        // Status bar
        this.statusBar = container.createEl('div', { 
            cls: 'structure-check-status'
        });
    }

    private async refreshLinting(): Promise<void> {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return;

        const content = await this.app.vault.read(activeFile);
        const issues = await this.lintingEngine.validate(content);

        this.state = {
            issues,
            lastUpdate: Date.now(),
            activeFile: activeFile.path
        };

        this.renderIssues();
    }

    private renderIssues(): void {
        this.issuesContainer.empty();

        // Group issues by severity
        const grouped = this.groupIssuesBySeverity(this.state.issues);

        // Render each group
        for (const [severity, issues] of Object.entries(grouped)) {
            const groupEl = this.issuesContainer.createEl('div', {
                cls: `linting-group linting-${severity}`
            });

            groupEl.createEl('h4', { 
                text: `${severity.charAt(0).toUpperCase() + severity.slice(1)}s (${issues.length})`
            });

            for (const issue of issues) {
                const issueEl = groupEl.createEl('div', {
                    cls: 'linting-issue'
                });

                // Create clickable link to the issue
                const link = issueEl.createEl('a', {
                    text: `${issue.message} (line ${issue.location.line})`,
                    cls: 'linting-issue-link'
                });

                link.onclick = () => this.navigateToIssue(issue);

                // Add quick fixes if available
                if (issue.quickFixes.length > 0) {
                    const fixesEl = issueEl.createEl('div', {
                        cls: 'linting-quick-fixes'
                    });

                    for (const fix of issue.quickFixes) {
                        const fixBtn = fixesEl.createEl('button', {
                            text: fix.title,
                            cls: 'mod-small'
                        });
                        fixBtn.onclick = () => this.applyQuickFix(issue, fix);
                    }
                }
            }
        }

        this.updateStatus();
    }

    private groupIssuesBySeverity(issues: LintingIssue[]): Record<string, LintingIssue[]> {
        return issues.reduce((acc, issue) => {
            if (!acc[issue.severity]) {
                acc[issue.severity] = [];
            }
            acc[issue.severity].push(issue);
            return acc;
        }, {} as Record<string, LintingIssue[]>);
    }

    private async navigateToIssue(issue: LintingIssue): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(issue.location.file);
        if (!(file instanceof TFile)) return;

        // Open the file if it's not already open
        const leaf = this.app.workspace.getLeavesOfType('markdown')
            .find(l => l.getViewState().state?.file === issue.location.file);

        if (!leaf) {
            await this.app.workspace.getLeaf().openFile(file);
        }

        // Highlight the issue
        this.highlightIssue(issue);
    }

    private highlightIssue(issue: LintingIssue): void {
        const editor = this.app.workspace.activeEditor?.editor;
        if (!editor) return;

        // Set cursor to the issue location
        editor.setCursor({
            line: issue.location.line - 1,
            ch: issue.location.column
        });

        // Add temporary highlight
        const highlight = editor.addHighlights([{
            from: { line: issue.location.line - 1, ch: issue.location.column },
            to: { line: issue.location.line - 1, ch: issue.location.column + issue.location.length }
        }], 'linting-highlight');

        // Remove highlight after a delay
        setTimeout(() => {
            editor.removeHighlights(highlight);
        }, 2000);
    }

    private async applyQuickFix(issue: LintingIssue, fix: QuickFix): Promise<void> {
        const editor = this.app.workspace.activeEditor?.editor;
        if (!editor) return;

        // Apply the fix
        fix.apply(editor);

        // Refresh linting
        await this.refreshLinting();
    }

    private updateStatus(): void {
        const total = this.state.issues.length;
        const errors = this.state.issues.filter(i => i.severity === 'error').length;
        const warnings = this.state.issues.filter(i => i.severity === 'warning').length;

        this.statusBar.setText(
            `Last updated: ${new Date(this.state.lastUpdate).toLocaleTimeString()} | ` +
            `Total issues: ${total} (${errors} errors, ${warnings} warnings)`
        );
    }
}
```

### 11.2 CSS for Linting Leaf
```css
.oneirometrics-structure-check-leaf {
    padding: 1em;
}

.structure-check-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1em;
    padding-bottom: 0.5em;
    border-bottom: 1px solid var(--background-modifier-border);
}

.structure-check-issues {
    display: flex;
    flex-direction: column;
    gap: 1em;
}

.linting-group {
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    padding: 0.5em;
}

.linting-group h4 {
    margin: 0 0 0.5em 0;
    padding-bottom: 0.5em;
    border-bottom: 1px solid var(--background-modifier-border);
}

.linting-error {
    border-left: 3px solid var(--text-error);
}

.linting-warning {
    border-left: 3px solid var(--text-warning);
}

.linting-info {
    border-left: 3px solid var(--text-info);
}

.linting-issue {
    padding: 0.5em;
    margin-bottom: 0.5em;
    background: var(--background-primary-alt);
    border-radius: 4px;
}

.linting-issue-link {
    color: var(--text-normal);
    text-decoration: none;
}

.linting-issue-link:hover {
    text-decoration: underline;
}

.linting-quick-fixes {
    display: flex;
    gap: 0.5em;
    margin-top: 0.5em;
}

.linting-status {
    margin-top: 1em;
    padding-top: 0.5em;
    border-top: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    font-size: 0.9em;
}

.linting-highlight {
    background-color: var(--text-highlight-bg);
    transition: background-color 0.2s ease-out;
}
```

### 11.3 Integration with Plugin
```typescript
class DreamMetricsPlugin {
    // ... existing code ...

    onload() {
        // ... existing code ...

        // Register the linting leaf
        this.registerView(
            'oneirometrics-structure-check',
            (leaf) => new LintingLeaf(leaf, this.lintingEngine)
        );

        // Add command to open linting leaf
        this.addCommand({
            id: 'open-structure-check',
            name: 'Open Journal Structure Check',
            callback: () => {
                this.app.workspace.getRightLeaf(false).setViewState({
                    type: 'oneirometrics-structure-check',
                    active: true
                });
            }
        });

        // Add status bar item
        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.setText('Linting: Ready');
    }
}
```

### 11.4 Advantages of Leaf-Based Approach
- No performance impact on editing
- Cleaner user interface
- Better organization of issues
- Easier to implement and maintain
- More flexible for future enhancements
- Better separation of concerns

### 11.5 User Experience
- Real-time updates as user edits
- Clickable links to issues
- Quick fixes available in the leaf
- Status bar integration
- Keyboard shortcuts for navigation
- Batch fix capabilities

---

**For further enhancements, consider adding AI-powered suggestions, advanced rule creation, or integration with other Obsidian plugins.**

### 11.6 User Access Methods
```typescript
class DreamMetricsPlugin {
    // ... existing code ...

    onload() {
        // ... existing code ...

        // Add ribbon icon
        this.addRibbonIcon(
            'checkmark',
            'Open Journal Structure Check',
            () => this.openLintingView()
        );

        // Add status bar click handler
        this.statusBarItem.onclick = () => this.openLintingView();

        // Add keyboard shortcut
        this.addCommand({
            id: 'toggle-structure-check',
            name: 'Toggle Journal Structure Check',
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'J' }],
            callback: () => this.toggleLintingView()
        });

        // Add context menu item
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu, editor, view) => {
                menu.addItem((item) => {
                    item
                        .setTitle('Check Structure of this File')
                        .setIcon('checkmark')
                        .onClick(() => this.openLintingView(view.file));
                });
            })
        );
    }

    private openLintingView(file?: TFile): void {
        const leaf = this.app.workspace.getRightLeaf(false);
        leaf.setViewState({
            type: 'oneirometrics-structure-check',
            active: true,
            state: file ? { activeFile: file.path } : undefined
        });
    }

    private toggleLintingView(): void {
        const existingLeaf = this.app.workspace.getLeavesOfType('oneirometrics-structure-check')[0];
        if (existingLeaf) {
            existingLeaf.detach();
        } else {
            this.openLintingView();
        }
    }
}
```

### 11.7 Access Methods Overview

1. **Ribbon Icon**
   - Quick access button in the left ribbon
   - Always visible and easily accessible
   - Clear visual indicator of linting availability

2. **Command Palette**
   - Command: "Open Journal Structure Check"
   - Command: "Toggle Journal Structure Check"
   - Keyboard shortcut: `Ctrl/Cmd + Shift + J`

3. **Status Bar**
   - Clickable status indicator
   - Shows current linting state
   - Quick toggle functionality

4. **Context Menu**
   - Right-click in editor
   - "Check Structure of this File" option
   - Context-aware file selection

### 11.8 Settings for Access Methods
```typescript
interface LintingAccessSettings {
    defaultPosition: 'right' | 'bottom';
    rememberLastPosition: boolean;
    showRibbonIcon: boolean;
    showStatusBar: boolean;
    enableContextMenu: boolean;
}

// Add to LintingSettings interface
interface LintingSettings {
    // ... existing settings ...
    access: LintingAccessSettings;
}
```

### 11.9 User Experience Considerations
- All access methods are explicitly user-initiated
- No automatic popups or interruptions
- Clear visual feedback when linting is active
- Easy to close/hide when not needed
- Persistent settings for preferred access methods

---

**For further enhancements, consider adding AI-powered suggestions, advanced rule creation, or integration with other Obsidian plugins.**

## 12. Linter Plugin Compatibility

### 12.1 Detection and Integration
```typescript
interface LinterPluginState {
    isInstalled: boolean;
    version: string;
    isEnabled: boolean;
}

class LinterPluginIntegration {
    private state: LinterPluginState;

    constructor(app: App) {
        this.state = this.detectLinterPlugin(app);
    }

    private detectLinterPlugin(app: App): LinterPluginState {
        const linterPlugin = app.plugins.plugins['linter'];
        return {
            isInstalled: !!linterPlugin,
            version: linterPlugin?.manifest?.version || '',
            isEnabled: linterPlugin?.enabled || false
        };
    }

    public getState(): LinterPluginState {
        return this.state;
    }

    public async handleLinterConflict(): Promise<void> {
        if (!this.state.isInstalled) return;

        // Check for potential conflicts
        const conflicts = await this.checkForConflicts();
        if (conflicts.length > 0) {
            // Show warning to user
            this.showConflictWarning(conflicts);
        }
    }

    private async checkForConflicts(): Promise<string[]> {
        const conflicts: string[] = [];
        
        // Check for overlapping rules
        if (this.hasOverlappingRules()) {
            conflicts.push('Overlapping linting rules detected');
        }

        // Check for conflicting keyboard shortcuts
        if (this.hasConflictingShortcuts()) {
            conflicts.push('Conflicting keyboard shortcuts detected');
        }

        return conflicts;
    }

    private showConflictWarning(conflicts: string[]): void {
        new Notice(
            'Potential conflicts detected with Linter plugin. ' +
            'Consider disabling overlapping features in one of the plugins.'
        );
    }
}
```

### 12.2 Compatibility Settings
```typescript
interface LinterCompatibilitySettings {
    disableOverlappingRules: boolean;
    useLinterPluginRules: boolean;
    showConflictWarnings: boolean;
    customRulePrefix: string;
}

// Add to LintingSettings interface
interface LintingSettings {
    // ... existing settings ...
    linterCompatibility: LinterCompatibilitySettings;
}
```

### 12.3 Integration Strategies

1. **Rule Prefixing**
   - Prefix all OneiroMetrics rules with `oneirometrics-`
   - Avoid rule name collisions
   - Clear separation of concerns

2. **Keyboard Shortcuts**
   - Use distinct shortcut combinations
   - Allow user to customize
   - Check for conflicts on startup

3. **UI Integration**
   - Different visual styling
   - Clear indication of rule source
   - Separate settings sections

4. **Rule Management**
   - Allow importing Linter plugin rules
   - Export rules in Linter plugin format
   - Maintain rule compatibility

### 12.4 User Experience

1. **First-Time Setup**
   - Detect Linter plugin on startup
   - Show compatibility options
   - Guide user through configuration

2. **Conflict Resolution**
   - Clear conflict warnings
   - Easy resolution options
   - Documentation on best practices

3. **Settings Integration**
   - Separate settings sections
   - Clear labeling of features
   - Easy toggling of compatibility options

### 12.5 Implementation Notes

1. **Plugin Detection**
   - Check for Linter plugin on startup
   - Monitor plugin state changes
   - Handle plugin updates

2. **Rule Management**
   - Maintain rule compatibility
   - Allow rule sharing
   - Support rule migration

3. **Performance Considerations**
   - Avoid duplicate processing
   - Share resources when possible
   - Optimize rule execution

4. **Documentation**
   - Clear compatibility guidelines
   - Setup instructions
   - Troubleshooting guide

---

**For further enhancements, consider adding AI-powered suggestions, advanced rule creation, or integration with other Obsidian plugins.**

## 13. UI Component Reorganization

### 13.1 Settings Tab
```typescript
class LintingSettingsTab extends PluginSettingTab {
    display(): void {
        const { containerEl } = this;
        
        // Core Settings
        new Setting(containerEl)
            .setName('Enable Structure Check')
            .setDesc('Enable or disable the journal structure checking system')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.linting.enabled)
                    .onChange(async (value) => {
                        this.plugin.settings.linting.enabled = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Rule Management
        containerEl.createEl('h3', { text: 'Rule Management' });
        new Setting(containerEl)
            .setName('Default Rules')
            .setDesc('Configure which default rules are active')
            .addButton(button => {
                button.setButtonText('Configure Rules')
                    .onClick(() => {
                        // Open rule configuration in the linting leaf
                        this.plugin.openLintingView();
                        // Switch to rules tab in the leaf
                        this.plugin.lintingLeaf?.showRulesTab();
                    });
            });

        // Structure Configuration
        containerEl.createEl('h3', { text: 'Callout Structures' });
        new Setting(containerEl)
            .setName('Structure Templates')
            .setDesc('Manage callout structure templates')
            .addButton(button => {
                button.setButtonText('Manage Templates')
                    .onClick(() => {
                        this.plugin.openLintingView();
                        this.plugin.lintingLeaf?.showTemplatesTab();
                    });
            });

        // Access Methods
        containerEl.createEl('h3', { text: 'Access Methods' });
        new Setting(containerEl)
            .setName('Show Ribbon Icon')
            .setDesc('Display the linting icon in the ribbon')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.linting.access.showRibbonIcon)
                    .onChange(async (value) => {
                        this.plugin.settings.linting.access.showRibbonIcon = value;
                        await this.plugin.saveSettings();
                        this.plugin.updateRibbonIcon();
                    });
            });

        // Linter Plugin Compatibility
        if (this.plugin.linterIntegration.getState().isInstalled) {
            containerEl.createEl('h3', { text: 'Linter Plugin Integration' });
            new Setting(containerEl)
                .setName('Linter Plugin Settings')
                .setDesc('Configure how this plugin works with the Linter plugin')
                .addButton(button => {
                    button.setButtonText('Configure Integration')
                        .onClick(() => {
                            this.plugin.openLintingView();
                            this.plugin.lintingLeaf?.showIntegrationTab();
                        });
                });
        }
    }
}
```

### 13.2 Linting Leaf Tabs
```typescript
interface LintingLeafTab {
    id: string;
    name: string;
    icon: string;
    view: HTMLElement;
}

class LintingLeaf extends ItemView {
    private tabs: LintingLeafTab[] = [
        {
            id: 'issues',
            name: 'Issues',
            icon: 'alert-circle',
            view: this.createIssuesView()
        },
        {
            id: 'rules',
            name: 'Rules',
            icon: 'list-checks',
            view: this.createRulesView()
        },
        {
            id: 'templates',
            name: 'Templates',
            icon: 'file-text',
            view: this.createTemplatesView()
        },
        {
            id: 'integration',
            name: 'Integration',
            icon: 'link',
            view: this.createIntegrationView()
        }
    ];

    private createRulesView(): HTMLElement {
        const container = document.createElement('div');
        container.addClass('linting-rules-view');

        // Rule list
        const ruleList = container.createEl('div', { cls: 'rule-list' });
        
        // Rule editor
        const ruleEditor = container.createEl('div', { cls: 'rule-editor' });
        
        // Rule testing area
        const testArea = container.createEl('div', { cls: 'rule-test-area' });

        return container;
    }

    private createTemplatesView(): HTMLElement {
        const container = document.createElement('div');
        container.addClass('linting-templates-view');

        // Template list
        const templateList = container.createEl('div', { cls: 'template-list' });
        
        // Template editor
        const templateEditor = container.createEl('div', { cls: 'template-editor' });
        
        // Preview area
        const previewArea = container.createEl('div', { cls: 'template-preview' });

        return container;
    }

    private createIntegrationView(): HTMLElement {
        const container = document.createElement('div');
        container.addClass('linting-integration-view');

        // Linter plugin status
        const statusSection = container.createEl('div', { cls: 'integration-status' });
        
        // Conflict resolution
        const conflictSection = container.createEl('div', { cls: 'conflict-resolution' });
        
        // Rule mapping
        const ruleMapping = container.createEl('div', { cls: 'rule-mapping' });

        return container;
    }

    public showRulesTab(): void {
        this.switchTab('rules');
    }

    public showTemplatesTab(): void {
        this.switchTab('templates');
    }

    public showIntegrationTab(): void {
        this.switchTab('integration');
    }

    private switchTab(tabId: string): void {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;

        // Update active tab
        this.tabs.forEach(t => t.view.style.display = 'none');
        tab.view.style.display = 'block';

        // Update tab indicators
        this.updateTabIndicators(tabId);
    }
}
```

### 13.3 UI Component Changes

1. **Settings Tab**
   - Simplified to core configuration
   - Links to relevant leaf tabs
   - Focus on global settings
   - Quick access to common tasks

2. **Linting Leaf**
   - Primary interface for all linting features
   - Tabbed interface for different aspects
   - Real-time validation and feedback
   - Rule management and testing
   - Template management
   - Integration settings

3. **Removed Components**
   - Standalone test modal (integrated into leaf)
   - Separate rule management UI
   - Independent template editor
   - Isolated integration settings

4. **New Organization**
   - All linting features in one place
   - Consistent UI patterns
   - Better workflow integration
   - Clearer feature boundaries

### 13.4 User Workflow

1. **Initial Setup**
   - Configure core settings in Settings tab
   - Access detailed features via leaf
   - Set up rules and templates
   - Configure integrations

2. **Daily Use**
   - Open linting leaf when needed
   - View and fix issues
   - Manage rules and templates
   - Monitor integration status

3. **Maintenance**
   - Update rules in leaf
   - Modify templates as needed
   - Adjust integration settings
   - Review and resolve conflicts

---

**For further enhancements, consider adding AI-powered suggestions, advanced rule creation, or integration with other Obsidian plugins.**

### 13.5 Detailed Tab Functionality

#### Issues Tab
```typescript
interface IssueViewState {
    filters: {
        severity: ('error' | 'warning' | 'info')[];
        type: ('structure' | 'format' | 'content' | 'custom')[];
        file: string | null;
    };
    sortBy: 'severity' | 'line' | 'type';
    groupBy: 'severity' | 'type' | 'file' | 'none';
    showResolved: boolean;
}

class IssuesView {
    private state: IssueViewState;
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.state = this.getDefaultState();
        this.render();
    }

    private render(): void {
        // Filter bar
        const filterBar = this.container.createEl('div', { cls: 'filter-bar' });
        this.renderSeverityFilters(filterBar);
        this.renderTypeFilters(filterBar);
        this.renderFileFilter(filterBar);
        
        // Sort/Group controls
        const controls = this.container.createEl('div', { cls: 'view-controls' });
        this.renderSortControls(controls);
        this.renderGroupControls(controls);
        
        // Issues list
        const issuesList = this.container.createEl('div', { cls: 'issues-list' });
        this.renderIssues(issuesList);
        
        // Batch actions
        const batchActions = this.container.createEl('div', { cls: 'batch-actions' });
        this.renderBatchActions(batchActions);
    }

    private renderBatchActions(container: HTMLElement): void {
        container.createEl('button', {
            text: 'Fix All Auto-fixable',
            cls: 'mod-cta'
        }).onclick = () => this.fixAllAutoFixable();

        container.createEl('button', {
            text: 'Export Issues',
            cls: 'mod-warning'
        }).onclick = () => this.exportIssues();
    }
}
```

#### Rules Tab
```typescript
interface RuleEditorState {
    selectedRule: LintingRule | null;
    isEditing: boolean;
    testContent: string;
    testResults: ValidationResult[];
}

class RulesView {
    private state: RuleEditorState;
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.state = this.getDefaultState();
        this.render();
    }

    private render(): void {
        // Rule list with search
        const ruleList = this.container.createEl('div', { cls: 'rule-list' });
        this.renderRuleSearch(ruleList);
        this.renderRuleList(ruleList);
        
        // Rule editor
        const editor = this.container.createEl('div', { cls: 'rule-editor' });
        this.renderRuleForm(editor);
        
        // Test area
        const testArea = this.container.createEl('div', { cls: 'test-area' });
        this.renderTestEditor(testArea);
        this.renderTestResults(testArea);
    }

    private renderRuleForm(container: HTMLElement): void {
        // Rule type selector
        container.createEl('select', {
            cls: 'rule-type-selector'
        }).innerHTML = `
            <option value="structure">Structure Rule</option>
            <option value="format">Format Rule</option>
            <option value="content">Content Rule</option>
            <option value="custom">Custom Rule</option>
        `;

        // Rule pattern editor
        container.createEl('div', { cls: 'pattern-editor' });
        
        // Severity selector
        container.createEl('div', { cls: 'severity-selector' });
        
        // Message template
        container.createEl('div', { cls: 'message-template' });
        
        // Fix template
        container.createEl('div', { cls: 'fix-template' });
    }
}
```

#### Templates Tab
```typescript
interface TemplateEditorState {
    selectedTemplate: CalloutStructure | null;
    isEditing: boolean;
    previewContent: string;
    blockIdSettings: BlockIdSettings;
}

interface BlockIdSettings {
    enabled: boolean;
    format: 'date' | 'uuid' | 'timestamp' | 'custom';
    prefix: string;
    customFormat: string;
    autoGenerate: boolean;
    validateUniqueness: boolean;
    referenceFields: string[];
    style: BlockIdStyle;
}

interface BlockIdStyle {
    prefix: string;
    suffix: string;
    separator: string;
    case: 'lower' | 'upper' | 'preserve';
    useCarat: boolean;
    useHyphens: boolean;
}

class TemplatesView {
    private state: TemplateEditorState;
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.state = this.getDefaultState();
        this.render();
    }

    private render(): void {
        // Template list
        const templateList = this.container.createEl('div', { cls: 'template-list' });
        this.renderTemplateList(templateList);
        
        // Template editor
        const editor = this.container.createEl('div', { cls: 'template-editor' });
        this.renderStructureEditor(editor);
        
        // Preview
        const preview = this.container.createEl('div', { cls: 'template-preview' });
        this.renderLivePreview(preview);
    }

    private renderStructureEditor(container: HTMLElement): void {
        // Required fields
        container.createEl('div', { cls: 'required-fields' });
        
        // Optional fields
        container.createEl('div', { cls: 'optional-fields' });
        
        // Metadata
        container.createEl('div', { cls: 'metadata-fields' });
        
        // Nesting rules
        container.createEl('div', { cls: 'nesting-rules' });

        // Block ID Settings
        const blockIdSection = container.createEl('div', { cls: 'block-id-settings' });
        this.renderBlockIdSettings(blockIdSection);
    }

    private renderBlockIdSettings(container: HTMLElement): void {
        container.createEl('h4', { text: 'Block ID Settings' });

        // Enable/Disable
        new Setting(container)
            .setName('Enable Block IDs')
            .setDesc('Generate and validate block IDs for callouts')
            .addToggle(toggle => {
                toggle.setValue(this.state.blockIdSettings.enabled)
                    .onChange(async (value) => {
                        this.state.blockIdSettings.enabled = value;
                        this.updatePreview();
                    });
            });

        // ID Format
        new Setting(container)
            .setName('ID Format')
            .setDesc('Choose how block IDs are generated')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('date', 'Date (YYYYMMDD)')
                    .addOption('uuid', 'UUID')
                    .addOption('timestamp', 'Timestamp')
                    .addOption('custom', 'Custom Format')
                    .setValue(this.state.blockIdSettings.format)
                    .onChange(async (value) => {
                        this.state.blockIdSettings.format = value as BlockIdSettings['format'];
                        this.updatePreview();
                    });
            });

        // Style Settings
        const styleSection = container.createEl('div', { cls: 'block-id-style-settings' });
        this.renderBlockIdStyleSettings(styleSection);

        // Prefix
        new Setting(container)
            .setName('ID Prefix')
            .setDesc('Prefix for all block IDs (e.g., "dream-")')
            .addText(text => {
                text.setValue(this.state.blockIdSettings.prefix)
                    .onChange(async (value) => {
                        this.state.blockIdSettings.prefix = value;
                        this.updatePreview();
                    });
            });

        // Auto-generate
        new Setting(container)
            .setName('Auto-generate IDs')
            .setDesc('Automatically generate IDs for new callouts')
            .addToggle(toggle => {
                toggle.setValue(this.state.blockIdSettings.autoGenerate)
                    .onChange(async (value) => {
                        this.state.blockIdSettings.autoGenerate = value;
                        this.updatePreview();
                    });
            });

        // Validate uniqueness
        new Setting(container)
            .setName('Validate Uniqueness')
            .setDesc('Check for duplicate block IDs')
            .addToggle(toggle => {
                toggle.setValue(this.state.blockIdSettings.validateUniqueness)
                    .onChange(async (value) => {
                        this.state.blockIdSettings.validateUniqueness = value;
                        this.updatePreview();
                    });
            });

        // Reference fields
        new Setting(container)
            .setName('Reference Fields')
            .setDesc('Fields that should reference block IDs')
            .addTextArea(text => {
                text.setValue(this.state.blockIdSettings.referenceFields.join(', '))
                    .onChange(async (value) => {
                        this.state.blockIdSettings.referenceFields = 
                            value.split(',').map(f => f.trim()).filter(Boolean);
                        this.updatePreview();
                    });
            });
    }

    private renderBlockIdStyleSettings(container: HTMLElement): void {
        container.createEl('h5', { text: 'Style Settings' });

        // Use carat
        new Setting(container)
            .setName('Use Carat (^)')
            .setDesc('Prefix IDs with a carat (^) for Obsidian block references')
            .addToggle(toggle => {
                toggle.setValue(this.state.blockIdSettings.style.useCarat)
                    .onChange(async (value) => {
                        this.state.blockIdSettings.style.useCarat = value;
                        this.updatePreview();
                    });
            });

        // Use hyphens
        new Setting(container)
            .setName('Use Hyphens')
            .setDesc('Use hyphens in date format (YYYY-MM-DD vs YYYYMMDD)')
            .addToggle(toggle => {
                toggle.setValue(this.state.blockIdSettings.style.useHyphens)
                    .onChange(async (value) => {
                        this.state.blockIdSettings.style.useHyphens = value;
                        this.updatePreview();
                    });
            });

        // Case
        new Setting(container)
            .setName('Case')
            .setDesc('Text case for IDs')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('lower', 'Lowercase')
                    .addOption('upper', 'Uppercase')
                    .addOption('preserve', 'Preserve Original')
                    .setValue(this.state.blockIdSettings.style.case)
                    .onChange(async (value) => {
                        this.state.blockIdSettings.style.case = value as BlockIdStyle['case'];
                        this.updatePreview();
                    });
            });

        // Separator
        new Setting(container)
            .setName('Separator')
            .setDesc('Character to separate prefix/suffix from ID')
            .addText(text => {
                text.setValue(this.state.blockIdSettings.style.separator)
                    .onChange(async (value) => {
                        this.state.blockIdSettings.style.separator = value;
                        this.updatePreview();
                    });
            });
    }

    private generateBlockId(): string {
        const { format, style } = this.state.blockIdSettings;
        let id: string;
        
        switch (format) {
            case 'date':
                id = this.generateDateId();
                break;
            case 'uuid':
                id = crypto.randomUUID();
                break;
            case 'timestamp':
                id = Date.now().toString();
                break;
            case 'custom':
                id = this.generateCustomBlockId(this.state.blockIdSettings.customFormat);
                break;
            default:
                id = this.generateDateId();
        }

        return this.applyStyle(id);
    }

    private generateDateId(): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        if (this.state.blockIdSettings.style.useHyphens) {
            return `${year}-${month}-${day}`;
        }
        return `${year}${month}${day}`;
    }

    private applyStyle(id: string): string {
        const { style } = this.state.blockIdSettings;
        let styledId = id;

        // Apply case
        switch (style.case) {
            case 'lower':
                styledId = styledId.toLowerCase();
                break;
            case 'upper':
                styledId = styledId.toUpperCase();
                break;
        }

        // Add carat if enabled
        if (style.useCarat) {
            styledId = `^${styledId}`;
        }

        // Add prefix with separator
        if (style.prefix) {
            styledId = `${style.prefix}${style.separator}${styledId}`;
        }

        // Add suffix with separator
        if (style.suffix) {
            styledId = `${styledId}${style.separator}${style.suffix}`;
        }

        return styledId;
    }
}
```

### 13.6 Enhanced Settings Options

```typescript
interface LintingSettings {
    // Core Settings
    enabled: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    
    // Display Settings
    defaultView: 'issues' | 'rules' | 'templates' | 'integration';
    defaultGroupBy: 'severity' | 'type' | 'file' | 'none';
    defaultSortBy: 'severity' | 'line' | 'type';
    showResolvedIssues: boolean;
    
    // Rule Settings
    defaultSeverity: 'error' | 'warning' | 'info';
    autoFixOnSave: boolean;
    confirmBeforeAutoFix: boolean;
    
    // Template Settings
    defaultTemplate: string;
    autoApplyTemplate: boolean;
    templateVariables: Record<string, string>;
    
    // Integration Settings
    linterCompatibility: LinterCompatibilitySettings;
    
    // Performance Settings
    maxIssuesPerFile: number;
    validationTimeout: number;
    cacheValidationResults: boolean;
    
    // Notification Settings
    showNotifications: boolean;
    notifyOnError: boolean;
    notifyOnWarning: boolean;
    notificationTimeout: number;
}

class LintingSettingsTab extends PluginSettingTab {
    display(): void {
        const { containerEl } = this;
        
        // Core Settings Section
        containerEl.createEl('h3', { text: 'Core Settings' });
        this.addToggleSetting('Enable Structure Check', 'enabled');
        this.addToggleSetting('Auto-refresh', 'autoRefresh');
        this.addNumberSetting('Refresh Interval (ms)', 'refreshInterval', 1000, 10000);
        
        // Display Settings Section
        containerEl.createEl('h3', { text: 'Display Settings' });
        this.addDropdownSetting('Default View', 'defaultView', [
            { value: 'issues', label: 'Issues' },
            { value: 'rules', label: 'Rules' },
            { value: 'templates', label: 'Templates' },
            { value: 'integration', label: 'Integration' }
        ]);
        
        // Rule Settings Section
        containerEl.createEl('h3', { text: 'Rule Settings' });
        this.addToggleSetting('Auto-fix on Save', 'autoFixOnSave');
        this.addToggleSetting('Confirm Before Auto-fix', 'confirmBeforeAutoFix');
        
        // Template Settings Section
        containerEl.createEl('h3', { text: 'Template Settings' });
        this.addToggleSetting('Auto-apply Template', 'autoApplyTemplate');
        
        // Performance Settings Section
        containerEl.createEl('h3', { text: 'Performance Settings' });
        this.addNumberSetting('Max Issues Per File', 'maxIssuesPerFile', 100, 1000);
        this.addNumberSetting('Validation Timeout (ms)', 'validationTimeout', 1000, 5000);
        this.addToggleSetting('Cache Validation Results', 'cacheValidationResults');
        
        // Notification Settings Section
        containerEl.createEl('h3', { text: 'Notification Settings' });
        this.addToggleSetting('Show Notifications', 'showNotifications');
        this.addToggleSetting('Notify on Error', 'notifyOnError');
        this.addToggleSetting('Notify on Warning', 'notifyOnWarning');
        this.addNumberSetting('Notification Timeout (ms)', 'notificationTimeout', 1000, 5000);
    }
}
```

### 13.7 Initial Implementation Priorities

1. **Core Infrastructure**
   - Basic leaf implementation
   - Settings tab structure
   - Linting engine core
   - Rule validation system

2. **Essential Features**
   - Issues tab with basic filtering
   - Simple rule management
   - Basic template support
   - Linter plugin detection

3. **User Experience**
   - Access methods (ribbon, command)
   - Basic settings
   - Simple notifications
   - Error handling

4. **Integration**
   - Linter plugin compatibility
   - Basic conflict detection
   - Rule prefixing
   - Settings separation

This phased approach allows for:
- Early user testing
- Incremental feature addition
- Feedback incorporation
- Performance optimization

---

**For further enhancements, consider adding AI-powered suggestions, advanced rule creation, or integration with other Obsidian plugins.**

### 13.8 Metrics List Linting

```typescript
interface MetricsListRule {
    id: string;
    type: 'metrics-list';
    severity: 'error' | 'warning' | 'info';
    enforceOrder: boolean;
    requiredMetrics: string[];
    optionalMetrics: string[];
    customOrder: string[];
    allowAdditional: boolean;
    groupBy: 'category' | 'type' | 'none';
}

class MetricsListLinter {
    private rules: MetricsListRule[];
    private settings: DreamMetricsSettings;
    private contentParser: ContentParser;

    constructor(rules: MetricsListRule[], settings: DreamMetricsSettings) {
        this.rules = rules;
        this.settings = settings;
        this.contentParser = new ContentParser();
    }

    validateMetricsList(content: string): ValidationResult[] {
        const results: ValidationResult[] = [];
        const parsedContent = this.contentParser.parseCalloutContent(content);
        
        // Only validate metrics, ignoring other content
        this.validateMetrics(parsedContent.metrics, results);
        
        return results;
    }

    private validateMetrics(metrics: ParsedMetric[], results: ValidationResult[]): void {
        // Check for required metrics
        this.validateRequiredMetrics(metrics, results);
        
        // Validate order if enforced
        if (this.rules.some(r => r.enforceOrder)) {
            this.validateMetricsOrder(metrics, results);
        }
        
        // Check for additional metrics if not allowed
        if (!this.rules.some(r => r.allowAdditional)) {
            this.validateNoAdditionalMetrics(metrics, results);
        }
        
        // Validate grouping if specified
        this.validateMetricsGrouping(metrics, results);
    }
}

// Add to LintingSettings interface
interface LintingSettings {
    // ... existing settings ...
    metricsListRules: MetricsListRule[];
}

// Add to LintingSettingsTab
class LintingSettingsTab extends PluginSettingTab {
    display(): void {
        // ... existing display code ...

        // Metrics List Rules Section
        containerEl.createEl('h3', { text: 'Metrics List Rules' });
        
        new Setting(containerEl)
            .setName('Enforce Metrics Order')
            .setDesc('Ensure metrics appear in the order defined in settings')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.linting.metricsListRules.some(r => r.enforceOrder))
                    .onChange(async (value) => {
                        this.updateMetricsListRule('enforceOrder', value);
                    });
            });

        new Setting(containerEl)
            .setName('Group Metrics By')
            .setDesc('Organize metrics by category or type')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('none', 'No Grouping')
                    .addOption('category', 'Category')
                    .addOption('type', 'Type')
                    .setValue(this.getCurrentGrouping())
                    .onChange(async (value) => {
                        this.updateMetricsListRule('groupBy', value);
                    });
            });

        new Setting(containerEl)
            .setName('Allow Additional Metrics')
            .setDesc('Allow metrics not defined in settings')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.linting.metricsListRules.some(r => r.allowAdditional))
                    .onChange(async (value) => {
                        this.updateMetricsListRule('allowAdditional', value);
                    });
            });
    }

    private updateMetricsListRule(key: keyof MetricsListRule, value: any): void {
        const rules = this.plugin.settings.linting.metricsListRules;
        if (rules.length === 0) {
            rules.push({
                id: 'default-metrics-rule',
                type: 'metrics-list',
                severity: 'warning',
                enforceOrder: false,
                requiredMetrics: [],
                optionalMetrics: [],
                customOrder: [],
                allowAdditional: true,
                groupBy: 'none'
            });
        }
        
        rules[0][key] = value;
        this.plugin.saveSettings();
    }

    private getCurrentGrouping(): string {
        const rule = this.plugin.settings.linting.metricsListRules[0];
        return rule?.groupBy || 'none';
    }
}
```

### 13.9 Metrics List Validation Features

1. **Order Enforcement**
   - Validate against settings-defined order
   - Support custom ordering rules
   - Quick fixes for reordering
   - Visual indicators for out-of-order metrics

2. **Required Metrics**
   - Ensure all required metrics are present
   - Validate metric values
   - Support for optional metrics
   - Custom required metric lists

3. **Grouping Validation**
   - Category-based grouping
   - Type-based grouping
   - Group order validation
   - Visual group separation

4. **Quick Fixes**
   - Reorder metrics
   - Add missing metrics
   - Remove unexpected metrics
   - Fix grouping issues

5. **Visual Feedback**
   - Color coding for groups
   - Order indicators
   - Missing metric highlights
   - Group separation lines

---

**For further enhancements, consider adding AI-powered suggestions, advanced rule creation, or integration with other Obsidian plugins.**

### 13.10 Content Isolation and Parsing

```typescript
interface ParsedContent {
    metrics: ParsedMetric[];
    ignoredContent: {
        type: 'image' | 'link' | 'table' | 'html' | 'code' | 'other';
        content: string;
        line: number;
        length: number;
    }[];
}

class ContentParser {
    private readonly IGNORED_PATTERNS = {
        // Existing patterns
        image: /!\[.*?\]\(.*?\)/g,
        link: /\[.*?\]\(.*?\)/g,
        table: /^\|.*\|$/gm,
        html: /<[^>]+>/g,
        code: /```[\s\S]*?```|`[^`]+`/g,
        
        // Additional patterns
        callout: /^> \[!.*?\].*$/gm,
        math: /\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g,
        footnote: /\[\^.*?\]/g,
        tag: /#[a-zA-Z0-9-_/]+/g,
        mention: /@[a-zA-Z0-9-_]+/g,
        highlight: /==.*?==/g,
        comment: /%%[\s\S]*?%%/g,
        embed: /!\[\[.*?\]\]|\[\[.*?\]\]/g,
        yaml: /^---[\s\S]*?---$/gm,
        task: /^> - \[ \] .*$|^> - \[x\] .*$/gm,
        quote: /^> .*$/gm,
        horizontalRule: /^> ---$/gm,
        definition: /^> .*::.*$/gm,
        mermaid: /```mermaid[\s\S]*?```/g,
        plantuml: /```plantuml[\s\S]*?```/g,
        custom: [] as RegExp[]
    };

    parseCalloutContent(content: string): ParsedContent {
        const lines = content.split('\n');
        const result: ParsedContent = {
            metrics: [],
            ignoredContent: []
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Skip if line is part of ignored content
            if (this.isPartOfIgnoredContent(line, result.ignoredContent)) {
                continue;
            }

            // Check for metrics
            const metricMatch = line.match(/^> - (\w+):\s*(.+)$/);
            if (metricMatch) {
                result.metrics.push({
                    name: metricMatch[1],
                    value: metricMatch[2],
                    line: i + 1
                });
                continue;
            }

            // Check for ignored content patterns
            this.checkForIgnoredContent(line, i + 1, result.ignoredContent);
        }

        return result;
    }

    private isPartOfIgnoredContent(line: string, ignoredContent: ParsedContent['ignoredContent']): boolean {
        return ignoredContent.some(ignored => {
            const lineNum = ignored.line;
            const endLine = lineNum + Math.ceil(ignored.length / line.length);
            return lineNum <= line.length && line.length <= endLine;
        });
    }

    private checkForIgnoredContent(line: string, lineNum: number, ignoredContent: ParsedContent['ignoredContent']): void {
        // Existing checks
        this.checkPattern(this.IGNORED_PATTERNS.image, 'image', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.link, 'link', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.table, 'table', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.html, 'html', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.code, 'code', line, lineNum, ignoredContent);

        // Additional checks
        this.checkPattern(this.IGNORED_PATTERNS.callout, 'callout', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.math, 'math', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.footnote, 'footnote', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.tag, 'tag', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.mention, 'mention', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.highlight, 'highlight', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.comment, 'comment', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.embed, 'embed', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.yaml, 'yaml', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.task, 'task', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.quote, 'quote', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.horizontalRule, 'horizontalRule', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.definition, 'definition', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.mermaid, 'mermaid', line, lineNum, ignoredContent);
        this.checkPattern(this.IGNORED_PATTERNS.plantuml, 'plantuml', line, lineNum, ignoredContent);

        // Custom patterns
        for (const pattern of this.IGNORED_PATTERNS.custom) {
            this.checkPattern(pattern, 'custom', line, lineNum, ignoredContent);
        }
    }

    private checkPattern(
        pattern: RegExp,
        type: ParsedContent['ignoredContent'][0]['type'],
        line: string,
        lineNum: number,
        ignoredContent: ParsedContent['ignoredContent']
    ): void {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
            ignoredContent.push({
                type,
                content: match[0],
                line: lineNum,
                length: match[0].length
            });
        }
    }
}

// Update MetricsListLinter to use ContentParser
class MetricsListLinter {
    private rules: MetricsListRule[];
    private settings: DreamMetricsSettings;
    private contentParser: ContentParser;

    constructor(rules: MetricsListRule[], settings: DreamMetricsSettings) {
        this.rules = rules;
        this.settings = settings;
        this.contentParser = new ContentParser();
    }

    validateMetricsList(content: string): ValidationResult[] {
        const results: ValidationResult[] = [];
        const parsedContent = this.contentParser.parseCalloutContent(content);
        
        // Only validate metrics, ignoring other content
        this.validateMetrics(parsedContent.metrics, results);
        
        return results;
    }

    private validateMetrics(metrics: ParsedMetric[], results: ValidationResult[]): void {
        // Check for required metrics
        this.validateRequiredMetrics(metrics, results);
        
        // Validate order if enforced
        if (this.rules.some(r => r.enforceOrder)) {
            this.validateMetricsOrder(metrics, results);
        }
        
        // Check for additional metrics if not allowed
        if (!this.rules.some(r => r.allowAdditional)) {
            this.validateNoAdditionalMetrics(metrics, results);
        }
        
        // Validate grouping if specified
        this.validateMetricsGrouping(metrics, results);
    }
}

// Add to LintingSettings interface
interface LintingSettings {
    // ... existing settings ...
    contentIsolation: {
        // Existing settings
        ignoreImages: boolean;
        ignoreLinks: boolean;
        ignoreTables: boolean;
        ignoreHtml: boolean;
        ignoreCode: boolean;
        
        // Additional settings
        ignoreCallouts: boolean;
        ignoreMath: boolean;
        ignoreFootnotes: boolean;
        ignoreTags: boolean;
        ignoreMentions: boolean;
        ignoreHighlights: boolean;
        ignoreComments: boolean;
        ignoreEmbeds: boolean;
        ignoreYaml: boolean;
        ignoreTasks: boolean;
        ignoreQuotes: boolean;
        ignoreHorizontalRules: boolean;
        ignoreDefinitions: boolean;
        ignoreMermaid: boolean;
        ignorePlantuml: boolean;
        
        customIgnorePatterns: string[];
    };
}

// Add to LintingSettingsTab
class LintingSettingsTab extends PluginSettingTab {
    display(): void {
        // ... existing display code ...

        // Content Isolation Settings
        containerEl.createEl('h3', { text: 'Content Isolation' });
        
        // Group settings by category
        this.addContentIsolationGroup(containerEl, 'Basic Markdown', [
            { name: 'Ignore Images', key: 'ignoreImages' },
            { name: 'Ignore Links', key: 'ignoreLinks' },
            { name: 'Ignore Tables', key: 'ignoreTables' },
            { name: 'Ignore Code Blocks', key: 'ignoreCode' },
            { name: 'Ignore HTML', key: 'ignoreHtml' }
        ]);

        this.addContentIsolationGroup(containerEl, 'Obsidian Features', [
            { name: 'Ignore Callouts', key: 'ignoreCallouts' },
            { name: 'Ignore Embeds', key: 'ignoreEmbeds' },
            { name: 'Ignore Tags', key: 'ignoreTags' },
            { name: 'Ignore Mentions', key: 'ignoreMentions' },
            { name: 'Ignore Comments', key: 'ignoreComments' }
        ]);

        this.addContentIsolationGroup(containerEl, 'Formatting', [
            { name: 'Ignore Math', key: 'ignoreMath' },
            { name: 'Ignore Footnotes', key: 'ignoreFootnotes' },
            { name: 'Ignore Highlights', key: 'ignoreHighlights' },
            { name: 'Ignore Quotes', key: 'ignoreQuotes' },
            { name: 'Ignore Horizontal Rules', key: 'ignoreHorizontalRules' },
            { name: 'Ignore Definitions', key: 'ignoreDefinitions' }
        ]);

        this.addContentIsolationGroup(containerEl, 'Diagrams and Frontmatter', [
            { name: 'Ignore YAML Frontmatter', key: 'ignoreYaml' },
            { name: 'Ignore Tasks', key: 'ignoreTasks' },
            { name: 'Ignore Mermaid Diagrams', key: 'ignoreMermaid' },
            { name: 'Ignore PlantUML Diagrams', key: 'ignorePlantuml' }
        ]);

        // Custom patterns
        new Setting(containerEl)
            .setName('Custom Ignore Patterns')
            .setDesc('Additional regex patterns to ignore (one per line)')
            .addTextArea(text => {
                text.setValue(this.plugin.settings.linting.contentIsolation.customIgnorePatterns.join('\n'))
                    .onChange(async (value) => {
                        this.plugin.settings.linting.contentIsolation.customIgnorePatterns = 
                            value.split('\n').map(p => p.trim()).filter(Boolean);
                        await this.plugin.saveSettings();
                    });
            });
    }

    private addContentIsolationGroup(
        container: HTMLElement,
        groupName: string,
        settings: { name: string; key: keyof LintingSettings['contentIsolation'] }[]
    ): void {
        container.createEl('h4', { text: groupName });
        
        for (const setting of settings) {
            new Setting(container)
                .setName(setting.name)
                .setDesc(`Skip validation of ${setting.name.toLowerCase().replace('ignore ', '')} content`)
                .addToggle(toggle => {
                    toggle.setValue(this.plugin.settings.linting.contentIsolation[setting.key] as boolean)
                        .onChange(async (value) => {
                            this.plugin.settings.linting.contentIsolation[setting.key] = value;
                            await this.plugin.saveSettings();
                        });
                });
        }
    }
}
```

### 13.11 Content Isolation Features

1. **Pattern Recognition**
   - Image detection
   - Link detection
   - Table detection
   - HTML detection
   - Code block detection
   - Custom pattern support

2. **Content Parsing**
   - Line-by-line analysis
   - Pattern matching
   - Content type identification
   - Position tracking

3. **Isolation Settings**
   - Toggle individual content types
   - Custom ignore patterns
   - Pattern priority
   - Pattern validation

4. **Performance Optimization**
   - Efficient pattern matching
   - Cached patterns
   - Early exit conditions
   - Batch processing

5. **User Control**
   - Granular content type control
   - Custom pattern definition
   - Pattern testing
   - Pattern management

---

**For further enhancements, consider adding AI-powered suggestions, advanced rule creation, or integration with other Obsidian plugins.** 