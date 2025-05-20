import { App, Plugin, PluginSettingTab, Setting, Notice, addIcon, Modal } from 'obsidian';
import { DreamMetricsState } from './state/DreamMetricsState';
import { DreamMetricsDOM } from './dom/DreamMetricsDOM';
import { DreamMetricsEvents } from './events/DreamMetricsEvents';
import { DreamMetricsProcessor } from './metrics/DreamMetricsProcessor';
import { DreamMetricsSettings, DreamMetricData, DreamMetric } from './types';
import { LintingEngine } from './linting/LintingEngine';
import { TemplaterIntegration } from './linting/TemplaterIntegration';
import { TestModal } from './linting/ui/TestModal';
import { TemplateWizard } from './linting/ui/TemplateWizard';
import { LintingSettings, CalloutStructure, JournalTemplate } from './linting/types';
import { DreamMetricsSettingTab } from '../settings';

// Default settings for linting functionality
const DEFAULT_LINTING_SETTINGS: LintingSettings = {
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

export default class DreamMetricsPlugin extends Plugin {
    private state: DreamMetricsState;
    private dom: DreamMetricsDOM;
    private events: DreamMetricsEvents;
    private processor: DreamMetricsProcessor;
    private lintingEngine: LintingEngine;
    public templaterIntegration: TemplaterIntegration;
    public settings: DreamMetricsSettings;

    async onload() {
        await this.loadSettings();

        // Initialize components
        this.state = new DreamMetricsState(this.settings);
        this.processor = new DreamMetricsProcessor(this.settings);
        this.templaterIntegration = new TemplaterIntegration(this);
        this.lintingEngine = new LintingEngine(this, this.settings.linting);
        
        // Load linting styles
        this.loadStyles();

        // Register commands
        this.addCommand({
            id: 'show-dream-metrics',
            name: 'Show Dream Metrics',
            callback: () => this.showMetrics()
        });

        // Add journal structure validation commands
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
            id: 'create-journal-template',
            name: 'Create Journal Template',
            callback: () => new TemplateWizard(this.app, this, this.templaterIntegration).open()
        });

        // Add command to insert journal template
        this.addCommand({
            id: 'insert-journal-template',
            name: 'Insert Journal Template',
            editorCallback: (editor) => this.insertTemplate(editor)
        });

        // Register editor menu for template insertion
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu, editor) => {
                // Add template insertion option
                menu.addItem((item) => {
                    item.setTitle('Insert Dream Journal Template')
                        .onClick(() => {
                            this.insertTemplate(editor);
                        });
                });
            })
        );

        // Add settings tab
        this.addSettingTab(new DreamMetricsSettingTab(this.app, this));
    }

    onunload() {
        // Cleanup
        if (this.dom) {
            this.dom.cleanup();
        }
        if (this.events) {
            this.events.cleanup();
        }
    }

    async loadSettings() {
        // Load core settings
        const loadedSettings = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings);
        
        // Initialize linting settings if not present
        if (!this.settings.linting) {
            this.settings.linting = DEFAULT_LINTING_SETTINGS;
        } else {
            // Ensure all required fields are present
            this.settings.linting = Object.assign({}, DEFAULT_LINTING_SETTINGS, this.settings.linting);
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
    
    /**
     * Validate the structure of the current file
     */
    private async validateCurrentFile() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No file is active');
            return;
        }
        
        // Get the content of the file
        const content = await this.app.vault.read(activeFile);
        
        // Validate content
        const results = this.lintingEngine.validate(content);
        
        // If no issues, show a success notice
        if (results.length === 0) {
            new Notice('No structure issues found! 🎉');
            return;
        }
        
        // Otherwise, show the validation modal with the results
        const modal = new TestModal(this.app, this);
        modal.open();
    }

    private async showMetrics() {
        // Get the active leaf
        const leaf = this.app.workspace.activeLeaf;
        if (!leaf) return;

        // Create container
        const container = document.createElement('div');
        container.addClass('dream-metrics-container');

        // Initialize DOM
        this.dom = new DreamMetricsDOM(this.app, container, this.state);
        this.events = new DreamMetricsEvents(this.state, this.dom);

        // Process and display metrics
        const entries = await this.getDreamEntries();
        const { metrics, processedEntries } = this.processor.processDreamEntries(entries);

        // Update state
        const dreamMetrics: Record<string, DreamMetric> = Object.entries(metrics).reduce((acc, [key, value]) => {
            acc[key] = {
                name: key,
                icon: 'circle', // default icon
                minValue: 0,
                maxValue: 100,
                description: ''
            };
            return acc;
        }, {} as Record<string, DreamMetric>);
        this.state.updateMetrics(dreamMetrics);
        this.state.updateDreamEntries(processedEntries);

        // Render table
        this.dom.render();

        // Attach event listeners
        this.events.attachEventListeners();

        // Display in leaf
        leaf.setViewState({
            type: 'markdown',
            state: { file: 'Dream Metrics' }
        });

        const view = leaf.view;
        if (view) {
            view.containerEl.empty();
            view.containerEl.appendChild(container);
        }
    }

    private async getDreamEntries(): Promise<DreamMetricData[]> {
        // TODO: Implement dream entry retrieval
        return [];
    }

    /**
     * Load CSS styles for the plugin
     */
    private loadStyles() {
        // Add a class to body when our plugin is active
        document.body.addClass('dream-metrics-active');
        
        // Load the styles
        this.registerDomEvent(document, 'DOMContentLoaded', () => {
            // Add styles by appending style element
            const styleEl = document.createElement('style');
            styleEl.id = 'dream-metrics-styles';
            
            // Add linting styles
            styleEl.textContent = `
/* Journal Structure Validation Styles */

/* Test Modal */
.dream-journal-test-modal {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.test-modal-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    min-height: 400px;
}

.test-modal-content-pane {
    flex: 1;
    padding: 10px;
    border-right: 1px solid var(--background-modifier-border);
    overflow-y: auto;
}

.test-modal-results-pane {
    flex: 1;
    padding: 10px;
    overflow-y: auto;
}

.test-modal-editor-section {
    margin-bottom: 20px;
}

.test-modal-actions-section {
    margin-top: 10px;
    margin-bottom: 10px;
}

/* Validation Results */
.validation-summary {
    margin-bottom: 15px;
    padding: 10px;
    background-color: var(--background-secondary);
    border-radius: 5px;
}

.validation-details {
    margin-top: 10px;
}

.validation-item {
    margin-bottom: 10px;
    border-left: 3px solid var(--background-modifier-border);
    padding-left: 10px;
}

.validation-error {
    border-left-color: var(--text-error);
}

.validation-warning {
    border-left-color: var(--text-warning);
}

.validation-info {
    border-left-color: var(--text-accent);
}
`;
            
            document.head.appendChild(styleEl);
        });
    }

    /**
     * Insert a template into the current editor
     */
    async insertTemplate(editor: any) {
        // Get templates from settings
        const templates = this.settings.linting?.templates || [];
        if (templates.length === 0) {
            new Notice('No templates available. Create templates in the OneiroMetrics settings.');
            return;
        }

        // Open template selection modal
        const modal = new TestModal(this.app, this);
        modal.open();
        
        // Create template list in a modal
        const templateModal = new Modal(this.app);
        templateModal.titleEl.setText('Insert Journal Template');
        
        // Create template list
        for (const template of templates) {
            const templateItem = templateModal.contentEl.createDiv({ cls: 'oom-template-item' });
            templateItem.createEl('h3', { text: template.name });
            if (template.description) {
                templateItem.createEl('p', { text: template.description, cls: 'oom-template-description' });
            }
            
            // Add button to insert template
            const buttonContainer = templateItem.createDiv({ cls: 'oom-template-buttons' });
            const insertButton = buttonContainer.createEl('button', { 
                text: 'Insert',
                cls: 'mod-cta'
            });
            
            insertButton.addEventListener('click', async () => {
                templateModal.close();
                
                // Get template content
                const templateContent = await this.app.vault.read(template.structure);
                
                // Insert template content into editor
                editor.replaceSelection(templateContent);
            });
        }
    }
}

// Default settings for core functionality
const DEFAULT_SETTINGS: DreamMetricsSettings = {
    projectNotePath: '',
    metrics: {
        'Words': {
            name: 'Words',
            icon: '📝',
            minValue: 0,
            maxValue: 1000,
            description: 'Number of words in the dream entry'
        },
        'Reading Time': {
            name: 'Reading Time',
            icon: '⏱️',
            minValue: 0,
            maxValue: 10,
            description: 'Estimated reading time in minutes'
        }
    },
    selectedNotes: [],
    folderOptions: {
        enabled: false,
        path: ''
    },
    selectionMode: 'manual',
    calloutName: 'dream',
    backup: {
        enabled: true,
        maxBackups: 5
    },
    logging: {
        level: 'info',
        maxSize: 1024 * 1024, // 1MB
        maxBackups: 3
    },
    linting: DEFAULT_LINTING_SETTINGS
}; 