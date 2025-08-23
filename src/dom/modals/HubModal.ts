/**
 * HubModal
 * 
 * The central OneiroMetrics Hub modal that provides access to all plugin functionality
 * in a unified tabbed interface. Includes Dashboard, Dream Scrape, Journal Structure, 
 * Callout Quick Copy, and detailed metric reference information.
 */

import { App, Modal, MarkdownRenderer, setIcon, Setting, Notice, TFile, ButtonComponent, DropdownComponent, TextAreaComponent, TextComponent, TFolder } from 'obsidian';

// Type interfaces for Obsidian internal APIs
interface ObsidianSettings {
    open: (tabId?: string) => void;
    openTabById: (tabId: string) => void;
}

interface AppWithSettings extends App {
    setting: ObsidianSettings;
    plugins: {
        plugins: {
            [key: string]: {
                settings?: {
                    templates_folder?: string;
                    [key: string]: any;
                };
                [key: string]: any;
            };
        };
    };
}

interface MetricWithName {
    name: string;
    [key: string]: any;
}
import DreamMetricsPlugin from '../../../main';
import { DreamMetric, DateHandlingConfig, DatePlacement, SelectionMode } from '../../types/core';
import { CalloutStructure, JournalTemplate, JournalStructureSettings } from '../../types/journal-check';
import safeLogger from '../../logging/safe-logger';
import { getLogger } from '../../logging';
import { format as formatDateWithFns } from 'date-fns';
import { createSelectedNotesAutocomplete, createFolderAutocomplete, createSelectedFoldersAutocomplete } from '../../../autocomplete';
import { 
    getProjectNotePath, 
    setProjectNotePath,
    getSelectedFolder, 
    setSelectedFolder,
    getSelectionMode,
    setSelectionMode
} from '../../utils/settings-helpers';
import { FileSuggest, FolderSuggest } from '../../../settings';
import { 
    isFolderMode,
    isNotesMode,
    areSelectionModesEquivalent,
    getSelectionModeLabel,
    normalizeSelectionMode
} from '../../utils/selection-mode-helpers';
import { SettingsAdapter } from '../../state/adapters/SettingsAdapter';
import { TemplateWizardModal } from './TemplateWizardModal';
import { SafeDOMUtils } from '../../utils/SafeDOMUtils';
import { TemplateHelpers } from '../../utils/TemplateHelpers';
import { DreamTaxonomyTab } from '../components/DreamTaxonomyTab';

// Import metrics functionality from settings
import { 
    RECOMMENDED_METRICS_ORDER, 
    DISABLED_METRICS_ORDER,
    iconCategories,
    lucideIconMap
} from '../../../settings';
import { 
    isMetricEnabled,
    setMetricEnabled,
    getMetricMinValue,
    getMetricMaxValue,
    setMetricRange,
    getMetricRange,
    standardizeMetric,
    createCompatibleMetric
} from '../../utils/metric-helpers';
import { DEFAULT_METRICS } from '../../types/core';
import { debug } from '../../logging';
import { MetricEditorModal, ensureCompleteMetric } from '../../../settings';

// Interface for grouped metrics
interface MetricGroup {
    name: string;
    metrics: DreamMetric[];
}

// Extended structure interface for HubModal usage with additional runtime properties
interface ExtendedCalloutStructure extends CalloutStructure {
    enabled?: boolean;
    isDefault?: boolean;
    createdAt?: string;
    lastModified?: string;
}

/**
 * Creation methods for templates
 */
type TemplateCreationMethod = 'templater' | 'structure' | 'direct';

/**
 * Wizard state for template creation
 */
interface TemplateWizardState {
    method: TemplateCreationMethod | null;
    templaterFile: string;
    structure: CalloutStructure | null;
    content: string;
    templateName: string;
    templateDescription: string;
    isValid: boolean;
    currentStep: number;
    editingTemplateId?: string; // Track if we're editing an existing template
}

interface CalloutNode {
    type: string;
    title: string;
    depth: number;
    children: CalloutNode[];
    lineNumber: number;
    position?: { start: number; end: number };
}

export class HubModal extends Modal {
    private tabsContainer: HTMLElement;
    private contentContainer: HTMLElement;
    private selectedTab: string | null = null;
    private logger = getLogger('HubModal');
    
    // Dream Scrape related properties
    private selectionMode: 'notes' | 'folder' = 'notes';
    private selectedNotes: string[] = [];
    private selectedFolder: string = '';
    private isScraping: boolean = false;
    private hasScraped: boolean = false;
    private scrapeButton: HTMLButtonElement | null = null;
    private openNoteButton: HTMLButtonElement | null = null;

    // Dynamic feedback area for scraping status  
    private feedbackArea: HTMLElement | null = null;

    // Smart preservation: backup storage for selections when switching modes
    private backupSelectedNotes: string[] = [];
    private backupSelectedFolder: string = '';
    
    // Exclusion settings for folder mode
    private excludedNotes: string[] = [];
    private excludedSubfolders: string[] = [];
    
    // Embedded wizard properties
    private journalStructureMode: 'normal' | 'wizard' = 'normal';
    private wizardState: TemplateWizardState | null = null;
    private wizardStepContainers: HTMLElement[] = [];
    private wizardNavigationEl: HTMLElement | null = null;
    private wizardPreviewEl: HTMLElement | null = null;
    
    // Wizard components
    private methodRadios: HTMLInputElement[] = [];
    private templaterDropdown: DropdownComponent | null = null;
    private structureDropdown: DropdownComponent | null = null;
    private contentArea: TextAreaComponent | null = null;
    private nameInput: TextComponent | null = null;
    private descInput: TextComponent | null = null;
    
    constructor(app: App, private plugin: DreamMetricsPlugin) {
        super(app);
        
        // Initialize Dream Scrape properties using safe accessors
        const settingsMode = this.plugin.settings.selectionMode || 'notes';
        this.selectionMode = (settingsMode === 'manual') ? 'notes' : settingsMode as 'notes' | 'folder';
        this.selectedNotes = this.plugin.settings.selectedNotes || [];
        this.selectedFolder = this.plugin.settings.selectedFolder || '';
        
        // Initialize backup storage to preserve current selections
        this.backupSelectedNotes = [...(this.plugin.settings.selectedNotes || [])];
        this.backupSelectedFolder = this.plugin.settings.selectedFolder || '';
        
        // Initialize exclusion settings
        this.excludedNotes = [...(this.plugin.settings.excludedNotes || [])];
        this.excludedSubfolders = [...(this.plugin.settings.excludedSubfolders || [])];
    }
    
    /**
     * Creates a complete DateHandlingConfig object with all required fields
     * This ensures that all fields are present when creating a new dateHandling object
     */
    private createCompleteDateHandlingConfig(): DateHandlingConfig {
        return {
            placement: 'field',
            headerFormat: 'MMMM d, yyyy',
            fieldFormat: 'Date:',
            frontmatterProperty: '',
            includeBlockReferences: false,
            blockReferenceFormat: '^YYYYMMDD',
            dreamTitleInProperties: false,
            dreamTitleProperty: '',
            plainTextDreams: false,
            calloutBasedDreams: true
        };
    }
    
    onOpen() {
        try {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass('oom-metrics-tabs-modal');
            
            // Create header with title and subtitle
            const headerContainer = contentEl.createDiv({ 
                cls: 'oom-hub-header-container' 
            });
            
            headerContainer.createEl('h1', { 
                text: 'OneiroMetrics Control Center', 
                cls: 'oom-hub-title' 
            });
            
            headerContainer.createEl('p', { 
                text: 'Transform your dream journal into meaningful insights and metrics', 
                cls: 'oom-hub-subtitle' 
            });
            
            // Create two-column layout
            const modalContainer = contentEl.createDiv({ 
                cls: 'oom-metrics-tabs-container' 
            });
            
            this.tabsContainer = modalContainer.createDiv({ 
                cls: 'oom-metrics-tabs-sidebar' 
            });
            
            this.contentContainer = modalContainer.createDiv({ 
                cls: 'oom-metrics-tabs-content' 
            });
            
            // Build tabs
            this.createTabs();
            
            // Select Dashboard tab by default
            this.selectTab('dashboard');
            
            // Remove footer with close button to emulate Obsidian's Settings modal behavior
            // Users can close using the X button or Esc key like native Obsidian modals
            
        } catch (error) {
            safeLogger.error('UI', 'Error opening metrics tabs modal', error as Error);
        }
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    // Create tab groups and tabs
    private createTabs() {
        // Create new management tabs first
        this.createDashboardTab();
        this.createJournalStructureTab(); // Now includes template management
        this.createDreamScrapeTab();
        this.createContentAnalysisTab(); // NEW: Content Analysis tab
        this.createMetricsSettingsTab(); // NEW: Metrics Settings tab
        this.createDreamTaxonomyTab(); // NEW: Dream Taxonomy tab
        
        // Create Overview tab (renamed to Reference Overview)
        this.createOverviewTab();
        
        // Create metric categories
        this.createTabGroup('Default Metrics', this.getDefaultMetrics());
        this.createTabGroup('Character Metrics', this.getCharacterMetrics());
        this.createTabGroup('Dream Experience Metrics', this.getDreamExperienceMetrics());
        this.createTabGroup('Memory & Recall Metrics', this.getMemoryRecallMetrics());
    }
    
    // Create Dashboard tab
    private createDashboardTab() {
        const dashboardTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'dashboard' }
        });
        
        dashboardTab.createDiv({ 
            text: 'Dashboard', 
            cls: 'oom-hub-tab-label' 
        });
        
        dashboardTab.addEventListener('click', () => {
            this.selectTab('dashboard');
        });
    }
    
    // Create Journal Structure tab (renamed from Callout Settings)
    private createJournalStructureTab() {
        const journalStructureTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'journal-structure' }
        });

        journalStructureTab.createDiv({ 
            text: 'Journal structure', 
            cls: 'oom-hub-tab-label' 
        });

        journalStructureTab.addEventListener('click', () => {
            this.selectTab('journal-structure');
        });
    }
    
    // Create Dream Scrape tab
    private createDreamScrapeTab() {
        const dreamScrapeTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'dream-scrape' }
        });
        
        dreamScrapeTab.createDiv({ 
            text: 'Dream scrape', 
            cls: 'oom-hub-tab-label' 
        });
        
        dreamScrapeTab.addEventListener('click', () => {
            this.selectTab('dream-scrape');
        });
    }
    
    // Create Content Analysis tab
    private createContentAnalysisTab() {
        const contentAnalysisTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'content-analysis' }
        });
        
        contentAnalysisTab.createDiv({ 
            text: 'Content analysis', 
            cls: 'oom-hub-tab-label' 
        });
        
        contentAnalysisTab.addEventListener('click', () => {
            this.selectTab('content-analysis');
        });
    }
    
    // Create Metrics Settings tab
    private createMetricsSettingsTab() {
        const metricsSettingsTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'metrics-settings' }
        });
        
        metricsSettingsTab.createDiv({ 
            text: 'Metrics settings', 
            cls: 'oom-hub-tab-label' 
        });
        
        metricsSettingsTab.addEventListener('click', () => {
            this.selectTab('metrics-settings');
        });
    }
    
    // Create Dream Taxonomy tab
    private createDreamTaxonomyTab() {
        const dreamTaxonomyTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'dream-taxonomy' }
        });
        
        dreamTaxonomyTab.createDiv({ 
            text: 'Dream Taxonomy', 
            cls: 'oom-hub-tab-label' 
        });
        
        dreamTaxonomyTab.addEventListener('click', () => {
            this.selectTab('dream-taxonomy');
        });
    }
    
    // Create Overview tab
    private createOverviewTab() {
        const overviewTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'overview' }
        });
        
        overviewTab.createDiv({ 
            text: 'Reference overview', 
            cls: 'oom-hub-tab-label' 
        });
        
        overviewTab.addEventListener('click', () => {
            this.selectTab('overview');
        });
    }
    
    // Helper to create a group of tabs
    private createTabGroup(groupName: string, metrics: DreamMetric[]) {
        // Create group header
        const groupHeader = this.tabsContainer.createDiv({ 
            text: groupName,
            cls: 'vertical-tab-header-group-title oom-hub-tab-group-title' 
        });
        
        // Create tabs for each metric in the group
        metrics.forEach(metric => {
            this.createTabButton(metric);
        });
    }
    
    // Create a single tab button
    private createTabButton(metric: DreamMetric) {
        const tabId = this.getTabIdFromMetricName(metric.name);
        const tabButton = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': tabId }
        });
        
        // Add icon if available
        if (metric.icon) {
            const iconSpan = tabButton.createSpan({ 
                cls: 'oom-hub-tab-icon' 
            });
            // Use Obsidian's setIcon method to properly display the icon
            setIcon(iconSpan, metric.icon);
        }
        
        tabButton.createDiv({ 
            text: metric.name, 
            cls: 'oom-hub-tab-label' 
        });
        
        tabButton.addEventListener('click', () => {
            this.selectTab(tabId);
        });
    }
    
    // Handle tab selection
    public selectTab(tabId: string) {
        // Clear previous selection
        this.tabsContainer.querySelectorAll('.vertical-tab-nav-item').forEach(el => {
            el.removeClass('is-active');
        });
        
        // Mark selected tab
        const selectedEl = this.tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);
        if (selectedEl) {
            selectedEl.addClass('is-active');
        }
        
        // Load appropriate content
        if (tabId === 'dashboard') {
            this.loadDashboardContent();
        } else if (tabId === 'dream-scrape') {
            this.loadDreamScrapeContent();
        } else if (tabId === 'content-analysis') {
            this.loadContentAnalysisContent();
        } else if (tabId === 'metrics-settings') {
            this.loadMetricsSettingsContent();
        } else if (tabId === 'dream-taxonomy') {
            this.loadDreamTaxonomyContent();
        } else if (tabId === 'journal-structure') {
            this.loadJournalStructureContent();
        } else if (tabId === 'overview') {
            this.loadOverviewContent();
        } else {
            const metric = this.findMetricByTabId(tabId);
            if (metric) {
                this.loadMetricContent(metric);
            }
        }
        
        this.selectedTab = tabId;
    }
    
    // Display Overview content
    private loadOverviewContent() {
        this.contentContainer.empty();
        
        // Add content from sources-and-inspirations.md directly at the top
        const sourcesContent = this.getSourcesAndInspirationsContent();
        const sourcesDiv = this.contentContainer.createDiv({ 
            cls: 'oom-metrics-tabs-sources-content' 
        });
        
        try {
            MarkdownRenderer.renderMarkdown(
                sourcesContent,
                sourcesDiv,
                '',  // Fixed: Use empty string instead of TFolder
                this.plugin
            );
        } catch (error) {
            safeLogger.error('UI', 'Error rendering markdown for sources content', error as Error);
            sourcesDiv.createEl('p', {
                text: 'Error rendering content. Please check the console for details.'
            });
        }
    }
    
    /**
     * Gets the content from the sources-and-inspirations.md file
     */
    private getSourcesAndInspirationsContent(): string {
        return `
## Sources and Inspirations

### Foundational Concepts

The metrics and tracking concepts in OneiroMetrics are inspired by established practices in dream research, psychology, and qualitative data analysis. While no single source dictates the exact formulation of each metric, the development has been informed by general principles found in these fields:

#### Dream Journaling Practices

The practice of recording dream content, including sensory details, emotions, and narrative flow, is a well-established method for improving dream recall and understanding. OneiroMetrics builds on these traditional approaches by adding structure and quantification to the journaling process.

Dream journaling has been inspired by the broader principles of numerous researchers and practitioners, including:

- Robert Van de Castle's work on dream content analysis
- Stephen LaBerge's research on lucid dreaming
- G. William Domhoff's studies on dream content and meaning

#### Qualitative Research Methodologies

Several approaches from qualitative research have influenced how OneiroMetrics breaks down dream experiences into measurable components:

- **Content Analysis**: Systematically categorizing elements within narratives
- **Thematic Analysis**: Identifying patterns and themes across multiple accounts
- **Phenomenological Approaches**: Capturing the essence of subjective experiences

These methodologies provide the theoretical foundation for transforming subjective dream experiences into data that can be analyzed over time.

#### Cognitive Psychology and Memory Research

Understanding how memory works, particularly the nature of dream recall and its fallibility, informs several OneiroMetrics features:

- Metrics like "Lost Segments" acknowledge the fragmentary nature of dream recall
- "Confidence Score" reflects research on metamemory (how we assess our own memory accuracy)
- The focus on immediate recording aligns with findings about memory degradation over time

### Specific Metric Inspirations

#### Sensory and Perceptual Metrics

- **Sensory Detail**: Draws from research on mental imagery vividness and sensory perception studies
- **Visual Clarity**: Influenced by dream imagery research and visual memory studies

#### Memory and Awareness Metrics

- **Emotional Recall**: Reflects research on emotional memory and affective neuroscience
- **Lost Segments**: Inspired by studies on memory fragmentation and the reconstructive nature of recall
- **Confidence Score**: Based on metacognitive research on certainty judgments

#### Dream Content Metrics

- **Characters Count/List**: Influenced by Hall and Van de Castle's system of dream content analysis
- **Environmental Familiarity**: Draws from research on place recognition and environmental psychology
- **Dream Themes**: Inspired by archetypal and thematic approaches to dream interpretation

#### Lucidity and Awareness

- **Lucidity Level**: Directly informed by research from lucid dreaming studies, particularly the work of Stephen LaBerge and Tholey's reflective awareness scale

### Methodological Influences

#### Rating Scales

The use of 1-5 scales for subjective assessments is a widely adopted practice in psychological research to quantify qualitative experiences. This approach balances:

- Sufficient granularity to capture meaningful differences
- Simplicity that avoids overwhelming users with too many options
- Consistency with common research methodologies

#### Data Visualization Approaches

The calendar visualization and metrics displays are informed by:

- Time-series data visualization principles
- Dashboard design best practices
- User experience research on information density and accessibility

### Dream Taxonomy

The hierarchical structure of Clusters, Vectors, and Themes is a modern application of long-established concepts from qualitative research and information science. This approach is inspired by methodologies like thematic analysis, where a researcher systematically moves from detailed codes to broader themes, and from hierarchical data modeling, which organizes complex information into layered, logical taxonomies for easier comprehension and navigation. In a more technical sense, it also draws inspiration from data science and machine learning, where similar structures are used to organize unstructured data into meaningful clusters based on the properties of a vector, thereby providing a powerful framework for analysis and visualization.

### Conclusion

OneiroMetrics provides a flexible framework built upon these general understandings, allowing individuals to tailor their dream tracking to their personal exploration goals. The specific metrics and their scoring guidelines were developed through an iterative process aimed at creating a practical and insightful tool for Obsidian users.

The plugin does not prescribe any particular interpretation or meaning to dream content - it simply provides tools to help users discover their own patterns and insights through consistent tracking and reflection.
`;
    }
    
    // Load and display content for the selected metric
    private loadMetricContent(metric: DreamMetric) {
        this.contentContainer.empty();
        
        // Metric header
        const headerContainer = this.contentContainer.createDiv();
        new Setting(headerContainer)
            .setHeading()
            .setName(`${metric.name} (Score ${metric.minValue}-${metric.maxValue})`)
            .setClass('oom-metrics-tabs-metric-header');
        
        // Detailed description (not helper text)
        const description = this.getDetailedDescription(metric);
        
        if (description) {
            // For HTML content
            const descriptionDiv = this.contentContainer.createDiv({
                cls: 'oom-metrics-tabs-description'
            });
            
            try {
                MarkdownRenderer.renderMarkdown(
                    description,
                    descriptionDiv,
                    '',  // Fixed: Use empty string instead of TFolder
                    this.plugin
                );
            } catch (error) {
                safeLogger.error('UI', 'Error rendering markdown for metric description', error as Error);
                descriptionDiv.createEl('p', {
                    text: metric.description || 'No description available'
                });
            }
        } else {
            // Fallback to simple description
            this.contentContainer.createEl('p', {
                text: metric.description || 'No description available',
                cls: 'oom-metrics-tabs-description'
            });
        }
        
        // Scoring table if available
        const scoreTable = this.getScoringTable(metric);
        if (scoreTable) {
            const tableDiv = this.contentContainer.createDiv({
                cls: 'oom-metrics-tabs-score-table'
            });
            
            try {
                MarkdownRenderer.renderMarkdown(
                    scoreTable,
                    tableDiv,
                    '',  // Fixed: Use empty string instead of TFolder
                    this.plugin
                );
                
                // Remove inline styles added by MarkdownRenderer using CSS utility class
                tableDiv.classList.add('oom-table-reset-overflow');
            } catch (error) {
                safeLogger.error('UI', 'Error rendering markdown for scoring table', error as Error);
            }
        }
    }
    
    // Find a metric by its tab ID
    private findMetricByTabId(tabId: string): DreamMetric | null {
        const allMetrics = [
            ...this.getDefaultMetrics(),
            ...this.getCharacterMetrics(),
            ...this.getDreamExperienceMetrics(),
            ...this.getMemoryRecallMetrics()
        ];
        
        return allMetrics.find(m => this.getTabIdFromMetricName(m.name) === tabId) || null;
    }
    
    // Convert metric name to tab ID
    private getTabIdFromMetricName(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    
    // Get detailed description for a metric
    private getDetailedDescription(metric: DreamMetric): string {
        // Return detailed description based on metric name
        const descriptions: Record<string, string> = {
            'Sensory Detail': `
This metric captures the **richness and vividness of the sensory information** you recall from your dream experience. It's about how much detail you remember across your five senses�what you saw, heard, felt, smelled, and tasted. Tracking this helps you gauge the overall immersive quality of your dreams and can indicate improvements in your recall abilities.
`,
            'Emotional Recall': `
This metric focuses on your **ability to remember and articulate the emotions you experienced while dreaming**. Dreams are often rich with feelings, and tracking them can provide profound insights into your subconscious state, anxieties, joys, and unresolved issues. This metric helps you assess not just _what_ emotions were present, but also their clarity, intensity, and how they evolved throughout the dream narrative.
`,
            'Descriptiveness': `
This metric assesses the **level of detail and elaboration in your written dream capture**. It goes beyond just raw sensory details (which are covered by the "Sensory Detail" metric) to evaluate how thoroughly you describe the events, actions, characters' behaviors, interactions, and the overall narrative flow of your dream. A higher score means your dream entry paints a more complete and vivid picture for yourself or anyone reading it.
`,
            'Lost Segments': `
This metric tracks the number of distinct instances where you have a clear feeling or awareness that a part of the dream is missing or has been forgotten. This isn't about omitting fragments you never recalled in the first place. It's about those "gaps" in your recalled narrative where you feel like "there was something else there," or you have a fleeting image or feeling that then vanishes.

If you recall the dream as a complete, seamless narrative with no sense of missing parts, this score would be 0.

If you have a distinct feeling of one or more breaks or missing chunks in the dream's sequence, you would count each of those instances.
`,
            'Character Roles': `
This metric tracks the **presence and significance of all individuals** (both familiar and unfamiliar) appearing in your dream's narrative. It assesses how central characters are to the dream's events, plot, and overall experience, regardless of whether you recognize them from waking life.
`,
            'Confidence Score': `
This is a **subjective metric reflecting your overall sense of how complete and accurate your dream recall feels** immediately after waking. It gauges your personal certainty about how much of the dream's content, narrative, and details you've managed to retrieve and record. Tracking your confidence can offer insights into the stability of your dream memory and highlight patterns in how thoroughly your dreams are being retained.
`,
            'Character Clarity/Familiarity': `
This metric assesses the distinctness and recognizability of the individual characters (both familiar and unfamiliar) appearing in your dream. It focuses on how clearly you perceived their features, identity, or presence. When used in conjunction with the other Characters metrics, this metric adds the dimension of _how well you saw/perceived them_.
`,
            'Characters Count': `
This metric tracks the **total number of distinct individual characters** that appeared in your dream. This includes anyone you perceived as a person, familiar or unfamiliar, or any person-like entity (e.g., a sentient robot, an animal behaving like a human, an identifiable mythological figure). This count provides a quantitative measure of the social density or complexity of your dream, indicating how many distinct individuals populated your dream world.

- **Use:** To track the frequency with which your dreams feature other beings, and to analyze trends in the size of your dream's "cast." A higher count might suggest more complex social processing, while a lower count might point to more solitary or abstract dream experiences.
- **Counting Guidelines:**
    - Count each _distinct_ individual present, even if they only appear briefly.
    - Do not count groups of people unless you specifically discern individual members (e.g., "a crowd" would be 1 unless you remember three distinct people within it, then it's 3).
    - Focus on individuals who are perceived as living, conscious beings within the dream's context.
- **Score:** A direct numerical count (e.g., 0, 1, 2, 5, 10+).
`,
            'Familiar Count': `
This metric tracks the **total number of distinct individuals appearing in your dream that you recognize from your waking life**. This includes family members, friends, colleagues, acquaintances, public figures you know, or even pets that play a person-like role and are familiar to you. This count helps to quantify the presence of your real-world social circle within your dreamscape.

- **Use:** To observe the frequency of familiar faces in your dreams. An increase in this count might indicate your mind is actively processing waking-life relationships, social dynamics, or specific interactions with people you know. It can also highlight individuals who are prominent in your subconscious.
- **Counting Guidelines:**
    - Count each _distinct_ familiar individual. If the same person appears multiple times or in different guises but is still recognizable as that one person, count them once.
    - Focus on individuals whom you distinctly recognized as someone from your waking life within the dream.
- **Score:** A direct numerical count (e.g., 0, 1, 2, 5).
`,
            'Unfamiliar Count': `
This metric tracks the **total number of distinct individuals appearing in your dream whom you do not recognize from your waking life**. These might be faces you've never seen before, composite figures, or archetypal characters (e.g., a wise old stranger, an anonymous crowd member, a fantastical creature behaving like a person). This count helps to quantify the presence of unknown or novel social interactions within your dreamscape.

- **Use:** To observe the frequency of new or unknown characters in your dreams. A higher count might suggest your mind is exploring new social situations, processing aspects of your psyche that aren't tied to known individuals, or engaging with universal themes not directly linked to your personal relationships.
- **Counting Guidelines:**
    - Count each _distinct_ unfamiliar individual. If an unknown person appears multiple times but is clearly the same "stranger," count them once.
    - Focus on individuals who are perceived as living, conscious beings within the dream's context, but for whom you have no waking-life recognition.
- **Score:** A direct numerical count (e.g., 0, 1, 3, 7).
`,
            'Characters List': `
This metric serves as a **qualitative record of all distinct individual characters** that appeared in your dream. It's a place to note the names (if known), descriptions, and familiar/unfamiliar status of each character, providing rich context to your numerical counts and role scores. This list helps you to specifically identify recurring figures, analyze their characteristics, and provide a detailed roster of your dream's cast.

- **Use:** To complement the "Characters Count," "Familiar Count," and "Unfamiliar Count" by giving you the specific identities of the characters. It allows for deeper qualitative analysis of who (or what kind of entity) is populating your dream world.
- **Content Guidelines:**
    - List each unique character.
    - For familiar characters, use their name or a clear identifier (e.g., "Mom," "Friend Alex," "Coworker Sarah").
    - For unfamiliar characters, provide a brief descriptive identifier (e.g., "Mysterious cloaked figure," "Tall stranger with a hat," "Smiling old woman," "Talking squirrel").
    - Optionally, you can tag them as \`(fam)\` for familiar or \`(unfam)\` for unfamiliar to quickly distinguish them within the list.
- **Example Format within Callout:** \`Characters List: Mom (fam), Friend Alex (fam), Mysterious Man (unfam), Talking Raven (unfam)\`
- **Score:** This metric does not have a numerical score (1-5); it is a list of descriptive entries.
`,
            'Dream Themes': `
This metric aims to identify the dominant subjects, ideas, or emotional undercurrents present in your dream. Instead of a numerical score, you will select one or more keywords or categories that best represent the core themes of the dream.

* **Possible Categories/Keywords (Examples - User-definable list in plugin recommended):**
    * Travel/Journey
    * Conflict/Argument
    * Learning/Discovery
    * Loss/Grief
    * Joy/Happiness
    * Fear/Anxiety
    * Absurdity/Surrealism
    * Creativity/Inspiration
    * Relationship Dynamics
    * Work/Career
    * Health/Illness
    * Nostalgia/Past
    * Technology
    * Nature/Environment
    * Spiritual/Mystical
    * Transformation
    * Communication
    * Power/Control
    * Vulnerability
* **Use:** To track recurring patterns in the subject matter and emotional tone of your dreams over time. Identifying themes can provide insights into your subconscious concerns, interests, and emotional processing. You can select multiple themes if a dream has several prominent aspects.
`,
            'Lucidity Level': `
This metric tracks your **degree of awareness that you are dreaming while the dream is in progress**. Lucid dreaming is a state where you know you're in a dream, and this metric helps you monitor how often and how clearly you achieve this awareness. Understanding your lucidity levels can be crucial for those interested in exploring, influencing, or even controlling their dream experiences.
`,
            'Dream Coherence': `
This metric assesses the **logical consistency and narrative flow of your dream**. It helps you gauge how well the dream's events, characters, and settings connect and make sense within its own internal "logic," even if that logic is surreal by waking standards. Tracking coherence can reveal patterns in your mind's ability to construct stable, unified narratives during sleep.
`,
            'Environmental Familiarity': `
This metric assesses the degree to which the locations and environments within your dream are **recognizable or familiar from your waking life**. It helps you track whether your dreams place you in known surroundings, completely novel landscapes, or a mix of both. Understanding the familiarity of your dream settings can offer insights into how your mind processes daily experiences and explores unknown territories during sleep.
`,
            'Ease of Recall': `
This metric assesses **how readily and effortlessly you could remember the dream upon waking**. It measures the immediate accessibility of the dream content, from fleeting impressions to vivid, detailed narratives. Tracking your ease of recall can help you identify trends in your dream memory and gauge the effectiveness of recall-boosting practices.
`,
            'Recall Stability': `
This metric assesses **how well your memory of the dream holds up and remains consistent in the minutes and hours immediately following waking**. It measures the resilience of your dream recall against the natural process of forgetting. Tracking recall stability can help you understand if your current dream capture methods are sufficient to preserve details before they fade, and highlight whether certain dreams are inherently more "sticky" than others.
`,
            'Symbolic Content': `
This metric helps you identify and track the specific symbols that appear in your dreams. While your Dream Themes might capture the overall subject, Symbolic Content focuses on individual elements like a lion, a red door, or a recurring specific action that seems to carry deeper meaning. This can be recorded as a list of keywords or tags, allowing you to recognize your unique symbolic language and discover recurring motifs over time.
`,
            'Time Distortion': `
Time Distortion assesses the surreal nature of time's flow within your dream. Unlike waking life, dream time can speed up, slow down, jump abruptly, or even have events happening simultaneously. This 1-5 scale helps you quantify how linear or chaotic the passage of time felt, offering insights into how your mind processes temporal experiences in different dream states.
`
        };
        
        return descriptions[metric.name] || '';
    }
    
    // Get scoring table for a metric
    private getScoringTable(metric: DreamMetric): string {
        // Return scoring table based on metric name
        const tables: Record<string, string> = {
            'Sensory Detail': `
| Score        | Description |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Minimal)  | You recall little to no sensory information. The dream feels vague and lacks specific sights, sounds, textures, smells, or tastes. It's more of a general impression than a lived experience. |
| 2 (Limited)  | You recall a few basic sensory details, perhaps a dominant color or a general sound. The sensory landscape of the dream is still quite sparse and underdeveloped in your memory. |
| 3 (Moderate) | You recall a noticeable amount of sensory information, often encompassing one or two senses more strongly. You might remember some specific visual elements (like shapes or light), a few distinct sounds (like voices or music), or a general feeling of touch or temperature. |
| 4 (Rich)     | You recall a significant amount of sensory information across multiple senses. You can describe specific visual details, distinct sounds and their qualities, and perhaps a clear smell, taste, or detailed texture. The dream feels quite immersive and multi-dimensional. |
| 5 (Vivid)    | Your recall is exceptionally detailed and encompasses a wide range of intense sensory experiences. You can clearly describe intricate visual scenes with specific colors and light, distinct and numerous sounds, and often specific tastes and smells. The dream feels incredibly real and alive in your memory, almost as if you were truly there. |
`,
            'Emotional Recall': `
| Score                | Description |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Vague)            | You have only a faint, undefined sense that you felt _some_ emotion in the dream, but you cannot identify it specifically. It's more of an undifferentiated feeling than a distinct emotion. |
| 2 (General)          | You can identify a primary emotion, broad (e.g., generally happy, generally sad, a sense of fear) but are unable to describe its intensity, specific nuances, or how it might have changed. |
| 3 (Identified)       | You can identify one or two specific emotions you felt during the dream (e.g., excitement, frustration, surprise). You might also be able to describe their general intensity, such as "a little scared" or "very happy." |
| 4 (Nuanced)          | You recall several distinct emotions experienced during the dream. You can describe some of the nuances or shifts in your feelings throughout the dream's narrative (e.g., starting with anxiety, transitioning to relief, then curiosity). |
| 5 (Deep and Complex) | You have a strong and detailed recollection of the emotional landscape of the dream. You can articulate multiple distinct emotions, their precise intensity, and how they interplayed or evolved within the dream's context. The emotional experience feels rich, complex, and clearly remembered. |
`,
            'Descriptiveness': `
| Score                | Description |
| -------------------- | ----------- |
| 1 (Minimal)          | Your dream capture is very brief and outlines only the most basic elements. It lacks significant descriptive language, making it feel like a simple summary or a sparse list of facts rather than a story. |
| 2 (Limited)          | Your capture provides a basic account of the dream's main events and characters, but it lacks significant descriptive detail. You might mention what happened, but not how it happened, who was involved in detail, or the atmosphere of the scene. |
| 3 (Moderate)         | Your dream capture provides a reasonably detailed account of the main events, characters, and their interactions. You use some descriptive language, allowing the reader to get a general sense of the dream's progression and key elements. |
| 4 (Detailed)         | Your capture includes a significant level of descriptive detail, bringing the dream narrative and its elements to life. You elaborate on actions, character behaviors, dialogue (if any), and the unfolding of the plot, creating a richer mental image. |
| 5 (Highly Elaborate) | Your dream capture is exceptionally rich in detail, using vivid and comprehensive language to describe every aspect of the dream. You meticulously capture events, intricate character details, nuanced interactions, and the overall progression of the narrative, making the dream feel fully rendered and immersive. |
`,
            'Character Roles': `
| Score                | Description |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (None)             | No familiar characters appear in the dream. |
| 2 (Background)       | Familiar characters appear but only in minor or background roles. |
| 3 (Supporting)       | Familiar characters play supporting roles in the dream narrative. |
| 4 (Major)            | Familiar characters are central to the dream's events or narrative. |
| 5 (Dominant)         | The dream is primarily about or dominated by interactions with familiar characters. |
`,
            'Confidence Score': `
| Score         | Description |
| ------------- | ----------- |
| 1 (Very Low)  | You wake up with little to no clear memory, feeling like you've barely scratched the surface of the dream. You have very low confidence that what little you recall is accurate or complete, suspecting a significant portion has been lost. |
| 2 (Low)       | You recall a bit more, but the memory feels fragmented and incomplete. You have low confidence that you've captured the full picture, and there are many fuzzy areas or missing sections you're aware of. |
| 3 (Moderate)  | You feel like you've recalled a fair amount of the dream, perhaps the main storyline or several key scenes. Your confidence is moderate, acknowledging that there might be some details or segments you're unsure about or that remain elusive. |
| 4 (High)      | You feel confident that you've recalled the majority of the dream with a good level of detail and coherence. You have a strong sense of its narrative flow and content, with only minor gaps or uncertainties. |
| 5 (Very High) | You feel extremely confident that you've recalled the entire dream in vivid detail and with strong accuracy. The memory feels robust, complete, and fully accessible, leaving you with no significant sense of missing parts or uncertainty. |
`,
            'Character Clarity/Familiarity': `
| Score                     | Description                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Indistinct/Absent)     | No characters were recalled, or any perceived characters were entirely formless, shadowy, or too indistinct to even categorize as familiar or unfamiliar.                                   |
| 2 (Vague Presence)        | Characters were present but highly blurred, featureless, or rapidly shifting. You had a sense of their presence but couldn't make out details or their identity clearly.                    |
| 3 (Partially Discernible) | Characters were somewhat discernible; you might have caught glimpses of features or had a vague sense of their identity (e.g., "a man," "a child") but lacked clear details or certainty.   |
| 4 (Clearly Recognized)    | Characters were clearly perceived, and their features/identity were distinct enough to recognize, even if they were unfamiliar. For familiar characters, you recognized them without doubt. |
| 5 (Vivid & Defined)       | Characters appeared with exceptional clarity and detail, almost as if seen in waking life. Their features, expressions, and presence were sharply defined and fully formed in your recall.  |
`,
            'Lucidity Level': `
| Score                | Description                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Non-Lucid)        | You have no awareness that you are dreaming. You experience the dream as reality, no matter how bizarre or illogical it may be.                                                                                                               |
| 2 (Faint Awareness)  | You experience a fleeting thought or a vague feeling that something in the dream is unusual or dream-like. This awareness doesn't quite solidify into certainty that you are actually dreaming.                                                                    |
| 3 (Clear Awareness)  | You become clearly aware that you are dreaming. You know you're in a dream, but your ability to control or significantly influence the dream environment, characters, or events might be limited. You primarily function as a conscious observer within the dream.                                                  |
| 4 (Moderate Control) | You are aware that you are dreaming and can actively influence some aspects of the dream. This might include changing your own actions or dialogue, altering minor elements of the environment, or gently nudging the dream's narrative in a desired direction.                                                      |
| 5 (High Lucidity)    | You have a strong and stable awareness that you are dreaming, combined with a significant degree of control over the dream environment, its characters, and events. You can often perform specific actions, intentionally explore the dream world, or even manifest objects and scenarios at will. | 
`,
            'Dream Coherence': `
| Score                   | Description |
| ----------------------- | ----------- |
| 1 (Incoherent)          | The dream is fragmented, disjointed, and nonsensical. Scenes shift abruptly without logical connection, characters and objects may change inexplicably, and the laws of reality are entirely suspended without any discernible internal consistency.            |
| 2 (Loosely Connected)   | Some elements or scenes might have a vague or thematic relationship, but the overall narrative lacks a clear and logical progression. Time, space, and causality are often inconsistent, making it hard to follow a consistent story.            |
| 3 (Moderately Coherent) | The dream has a discernible narrative thread, but it may contain noticeable illogical elements, inconsistencies in character behavior or setting, or sudden, unexplained shifts in the storyline that disrupt the flow.            |
| 4 (Mostly Coherent)     | The dream generally follows a logical progression with a relatively consistent narrative, characters, and settings. Any illogical elements are minor or don't significantly disrupt the overall sense of a somewhat realistic (albeit dreamlike) experience.            |
| 5 (Highly Coherent)     | The dream feels like a consistent and logical experience, even if the content is surreal or fantastical. There's a clear flow of events, consistent character behavior (within the dream's own rules), and a strong sense of internal consistency in the dream's reality, making it feel like a complete story.            |
`,
            'Environmental Familiarity': `
| Score                     | Description                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Completely Unfamiliar) | All the settings in the dream are entirely novel and have no discernible connection to any places you have experienced in your waking life.                                                 |
| 2 (Vaguely Familiar)      | You experience a sense of d�j� vu or a faint feeling of having been in a similar place before, but you cannot specifically identify the location or its connection to your waking memories. |
| 3 (Partially Familiar)    | The dream settings are a blend of recognizable and unfamiliar elements. You might recognize the layout of a room but find it in a completely new building, or a familiar landscape might have strange, uncharacteristic features.                                                                                                                                                                                            |
| 4 (Mostly Familiar)       | The dream primarily takes place in locations you know from your waking life, such as your home, workplace, or familiar landmarks, although there might be minor alterations or unusual juxtapositions.                                                                                                                                                                                            |
| 5 (Completely Familiar)   | All the settings in the dream are direct and accurate representations of places you know well from your waking experience, without any significant alterations or unfamiliar elements.                                                                                                                                                                                            |
`,
            'Ease of Recall': `
| Score              | Description |
| ------------------ | ----------- |
| 1 (Very Difficult) | You woke up with little to no memory of having dreamed. Recalling even a single fragment required significant mental effort, and you only managed to grasp fleeting impressions or feelings.            |
| 2 (Difficult)      | You remembered a few isolated images, emotions, or very brief snippets of the dream, but the overall narrative was elusive and very hard to piece together, requiring considerable struggle.            |
| 3 (Moderate)       | You could recall the basic outline or a few key scenes of the dream with a reasonable amount of effort. Some details might have been hazy or forgotten, but the core of the dream was accessible with focused concentration.            |
| 4 (Easy)           | You remembered the dream relatively clearly and could recount a significant portion of the narrative and details without much difficulty. The recall felt relatively immediate and accessible upon waking.            |
| 5 (Very Easy)      | The dream was vividly and immediately present in your memory upon waking. You could recall intricate details and the flow of events with little to no effort, almost as if the experience had just happened in waking life.            |
`,
            'Recall Stability': `
| Score                  | Description                                                                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Rapidly Fading)     | The dream memory begins to dissipate almost instantly upon waking. Details vanish quickly, and within a short time (e.g., a few minutes), only a faint impression or a single image might remain.                 |
| 2 (Significant Fading) | You can recall a fair amount initially, but key details and the overall narrative structure fade noticeably within the first 10-15 minutes after waking, making it difficult to reconstruct the full dream later. |
| 3 (Moderate Fading)    | Some details and less significant parts of the dream might fade within the first 15-30 minutes, but the core narrative and key events remain relatively intact.                                                   |
| 4 (Mostly Stable)      | Your recall of the dream remains largely consistent for at least 30 minutes after waking. Only minor details or less impactful elements might fade over time.                                                                                                                                                                                                  |
| 5 (Very Stable)        | The memory of the dream feels solid and enduring in the immediate post-waking period. You can recall details consistently even after a longer period without actively trying to remember it.                                                                                                                                                                                                                  |
`,
            'Time Distortion': `
| Score              | Description |
| ------------------ | ----------- |
| 1 (Normal) | Time flows linearly, as in waking life.            |
| 2 (Minor Fluctuations) | Slight jumps or skips, but generally linear.            |
| 3 (Noticeable Distortion) | Time speeds up/slows down significantly, or small jumps.            |
| 4 (Significant Distortion) | Time shifts abruptly, jumps backward/forward, or multiple events feel simultaneous.            |
| 5 (Chaotic/Non-Existent) | Time has no discernible order; events happen out of sequence or simultaneously without any linear progression.            |
`
        };
        
        return tables[metric.name] || '';
    }
    
    // Get metric groups - temporary implementation until plugin methods are available
    private getDefaultMetrics(): DreamMetric[] {
        // Simplified implementation for now
        return this.getAllMetrics().filter(m => 
            ['Sensory Detail', 'Emotional Recall', 'Lost Segments', 'Descriptiveness', 'Confidence Score'].includes(m.name)
        ).sort((a, b) => {
            // Define the exact tab order requested
            const order = [
                'Sensory Detail',
                'Emotional Recall', 
                'Lost Segments',
                'Descriptiveness',
                'Confidence Score'
            ];
            return order.indexOf(a.name) - order.indexOf(b.name);
        });
    }
    
    private getCharacterMetrics(): DreamMetric[] {
        return this.getAllMetrics().filter(m => 
            ['Character Roles', 'Characters Count', 'Character Clarity/Familiarity', 'Familiar Count', 'Unfamiliar Count', 'Characters List'].includes(m.name)
        );
    }
    
    private getDreamExperienceMetrics(): DreamMetric[] {
        const allMetrics = this.getAllMetrics();
        const orderedNames = ['Dream Themes', 'Symbolic Content', 'Lucidity Level', 'Dream Coherence', 'Environmental Familiarity', 'Time Distortion'];
        
        // Return metrics in the exact order specified
        return orderedNames
            .map(name => allMetrics.find(m => m.name === name))
            .filter(metric => metric !== undefined) as DreamMetric[];
    }
    
    private getMemoryRecallMetrics(): DreamMetric[] {
        return this.getAllMetrics().filter(m => 
            ['Ease of Recall', 'Recall Stability'].includes(m.name)
        );
    }
    
    // Get all metrics from plugin settings with fallback to DEFAULT_METRICS
    private getAllMetrics(): DreamMetric[] {
        const settingsMetrics = Object.values(this.plugin.settings.metrics || {});
        
        // Always ensure metrics are up to date with DEFAULT_METRICS
        let needsSave = false;
        
        DEFAULT_METRICS.forEach(defaultMetric => {
            if (!this.plugin.settings.metrics[defaultMetric.name]) {
                // Add missing metric
                this.plugin.settings.metrics[defaultMetric.name] = {
                    ...defaultMetric,
                    // Include legacy properties for compatibility
                    min: defaultMetric.minValue,
                    max: defaultMetric.maxValue,
                    step: 1
                };
                needsSave = true;
            } else {
                // Update existing metric's description if it differs from DEFAULT_METRICS
                const existingMetric = this.plugin.settings.metrics[defaultMetric.name];
                if (existingMetric.description !== defaultMetric.description) {
                    existingMetric.description = defaultMetric.description;
                    needsSave = true;
                }
            }
        });
        
        if (needsSave) {
            // Save settings to persist the changes
            this.plugin.saveSettings();
        }
        
        return Object.values(this.plugin.settings.metrics);
    }

    // Display Dashboard content
    private loadDashboardContent() {
        this.contentContainer.empty();
        
        // Add welcome text
        const welcomeText = this.contentContainer.createDiv({ 
            cls: 'oom-metrics-tabs-dashboard-text' 
        });
        
        welcomeText.createEl('p', { 
            text: 'Welcome to Dream Metrics! Manage all aspects of your dream journal from this central hub.'
        });
        
        // Quick Actions Section
        const quickActionsSection = this.contentContainer.createDiv({ cls: 'oom-dashboard-section' });
        new Setting(quickActionsSection).setName('Quick Actions');
        
        const quickActionsGrid = quickActionsSection.createDiv({ cls: 'oom-quick-actions-grid' });
        
        this.createQuickActionButton(quickActionsGrid, 'Scrape Metrics', 'sparkles', () => {
            // Navigate to Dream Scrape tab
            this.selectTab('dream-scrape');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Journal Structure', 'check-circle', () => {
            this.selectTab('journal-structure');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'View Dream Metrics', 'chart-line', () => {
            // Close the hub modal
            this.close();
            
            // Open the new OneiroMetrics view (formerly dashboard)
            this.app.workspace.getLeaf(false).setViewState({
                type: 'oneirometrics-dashboard',
                active: true
            });
        });
        
        this.createQuickActionButton(quickActionsGrid, 'View Metrics Descriptions', 'book-open', () => {
            // Navigate to Reference Overview tab
            this.selectTab('overview');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Open Settings', 'settings', () => {
            // Close the Hub modal first
            this.close();
            
            // Then open the Obsidian Settings to OneiroMetrics tab
            const appWithSettings = this.app as AppWithSettings;
            appWithSettings.setting.open();
            appWithSettings.setting.openTabById('oneirometrics');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Help & Docs', 'help-circle', () => {
            window.open('https://github.com/banisterious/obsidian-oneirometrics/blob/main/docs/user/guides/usage.md', '_blank');
        });
        
        // Create 2-column grid container for Recent Activity and Status Overview
        const infoGridContainer = this.contentContainer.createDiv({ cls: 'oom-dashboard-info-grid' });
        
        // Recent Activity Section
        const recentActivitySection = infoGridContainer.createDiv({ cls: 'oom-dashboard-section' });
        new Setting(recentActivitySection).setName('Recent Activity');
        
        const recentActivityList = recentActivitySection.createEl('ul', { cls: 'oom-recent-activity-list' });
        
        // Placeholder activities - these would be populated from actual usage data in a real implementation
        recentActivityList.createEl('li', { 
            text: 'Last scrape: ' + new Date().toLocaleDateString() + ' - 15 entries processed, 7 with metrics' 
        });
        
        recentActivityList.createEl('li', { 
            text: 'Last validation: ' + new Date().toLocaleDateString() + ' - 2 errors, 1 warning' 
        });
        
        recentActivityList.createEl('li', { 
            text: 'Recently used template: "Lucid Dream Template"' 
        });
        
        // Status Overview Section
        const statusSection = infoGridContainer.createDiv({ cls: 'oom-dashboard-section' });
        new Setting(statusSection).setName('Status Overview');
        
        const statusList = statusSection.createEl('ul', { cls: 'oom-status-list' });
        
        const selectedNotes = this.plugin.settings.selectedNotes || [];
        statusList.createEl('li', { 
            text: `Current selection: ${selectedNotes.length} notes selected` 
        });
        
        statusList.createEl('li', { 
            text: 'Templates: 4 templates defined' 
        });
        
        statusList.createEl('li', { 
            text: 'Structures: 2 structures defined' 
        });
        
        statusList.createEl('li', { 
            text: `Validation: ${this.plugin.settings.linting?.enabled ? 'Enabled' : 'Disabled'}` 
        });
    }
    
    // Create a quick action button for the dashboard
    private createQuickActionButton(
        containerEl: HTMLElement, 
        label: string, 
        icon: string, 
        callback: () => void
    ) {
        const button = containerEl.createEl('button', { 
            cls: 'oom-quick-action-button u-gap--xs u-padding--sm', 
            text: label 
        });
        
        const iconEl = button.createSpan({ cls: 'oom-quick-action-icon' });
        setIcon(iconEl, icon);
        
        button.addEventListener('click', callback);
        
        return button;
    }

    // Display Dream Scrape content
    private loadDreamScrapeContent() {
        this.contentContainer.empty();
        
        // Add welcome text
        const welcomeText = this.contentContainer.createDiv({ 
            cls: 'oom-metrics-tabs-dream-scrape-text' 
        });
        
        welcomeText.createEl('p', { 
            text: 'Extract dream metrics from journal entries.'
        });
        
        // OneiroMetrics note section (mirrored from Settings - exactly matches Settings style)
        const projectNoteSection = this.contentContainer.createDiv({ cls: 'oom-modal-section' });
        
        // Create a Setting-style implementation for consistency with Settings tab
        const projectNoteSetting = new Setting(projectNoteSection)
            .setName('OneiroMetrics note')
            .setDesc('The note where OneiroMetrics tables will be written')
            .addSearch(search => {
                search.setPlaceholder('Example: Journals/Dream Diary/Metrics/Metrics.md')
                    .setValue(getProjectNotePath(this.plugin.settings))
                    .onChange(async (value) => {
                        setProjectNotePath(this.plugin.settings, value);
                        await this.plugin.saveSettings();
                        // Re-validate configuration when setting changes
                        this.validateProjectNoteConfiguration();
                    });
                
                // Add file suggestions - now exactly matches Settings implementation
                new FileSuggest(this.app, search.inputEl);
            });

        // Selection Mode (moved from Settings - identical implementation)
        const selectionModeSetting = new Setting(this.contentContainer)
            .setName('Select notes/folders')
            .setDesc('How to select notes for analyzing')
            .addDropdown(drop => {
                drop.addOption('notes', 'Selected Notes');
                drop.addOption('folder', 'Selected Folder');
                
                // Use the UI representation (notes/folder)
                const settingsAdapter = new SettingsAdapter(this.plugin.settings);
                const selectionMode = getSelectionMode(this.plugin.settings);
                // Convert internal mode (manual/automatic) to UI mode (notes/folder)
                const uiMode = normalizeSelectionMode(selectionMode) === 'manual' ? 'notes' : 'folder';
                drop.setValue(uiMode);
                
                drop.onChange(async (value) => {
                    // Convert to internal representation (manual/automatic)
                    // 'notes' -> 'manual', 'folder' -> 'automatic'
                    const internalMode = value === 'notes' ? 'manual' : 'automatic';
                    const currentMode = getSelectionMode(this.plugin.settings);
                    const currentUiMode = normalizeSelectionMode(currentMode) === 'manual' ? 'notes' : 'folder';
                    
                    // Smart preservation: backup current selections before switching modes
                    if (currentUiMode === 'notes' && this.plugin.settings.selectedNotes?.length > 0) {
                        // Backup current notes selection
                        this.backupSelectedNotes = [...this.plugin.settings.selectedNotes];
                    } else if (currentUiMode === 'folder' && this.plugin.settings.selectedFolder) {
                        // Backup current folder selection
                        this.backupSelectedFolder = this.plugin.settings.selectedFolder;
                    }
                    
                    // Update the selection mode
                    this.plugin.settings.selectionMode = internalMode;
                    
                    // Smart restoration and clearing logic
                    if (isFolderMode(value as SelectionMode)) {
                        // Switching to folder mode
                        this.plugin.settings.selectedNotes = [];
                        
                        // Restore previous folder selection if we have one
                        if (this.backupSelectedFolder) {
                            setSelectedFolder(this.plugin.settings, this.backupSelectedFolder);
                        }
                    } else {
                        // Switching to notes mode  
                        setSelectedFolder(this.plugin.settings, '');
                        
                        // Restore previous notes selection if we have one
                        if (this.backupSelectedNotes.length > 0) {
                            this.plugin.settings.selectedNotes = [...this.backupSelectedNotes];
                        }
                    }
                    
                    await this.plugin.saveSettings();
                    this.loadDreamScrapeContent(); // Refresh the Dream Scrape content to show the updated selection UI
                });
            });

        // Dynamic label and field based on selection mode (identical to Settings implementation)
        const selectionMode = getSelectionMode(this.plugin.settings);
        // Convert internal mode (manual/automatic) to UI mode (notes/folder)
        const uiMode = normalizeSelectionMode(selectionMode) === 'manual' ? 'notes' : 'folder';
        const selectionLabel = getSelectionModeLabel(uiMode);
        let selectionDesc = this.getSelectionModeDescription(uiMode);
        
        // Add visual indicator for restored selections
        if (uiMode === 'notes' && this.plugin.settings.selectedNotes?.length > 0 && this.backupSelectedNotes.length > 0) {
            // Check if current selection matches backup (indicating restoration)
            const currentIds = this.plugin.settings.selectedNotes.sort().join(',');
            const backupIds = this.backupSelectedNotes.sort().join(',');
            if (currentIds === backupIds) {
                selectionDesc += ' (restored from previous session)';
            }
        } else if (uiMode === 'folder' && this.plugin.settings.selectedFolder && this.backupSelectedFolder) {
            if (this.plugin.settings.selectedFolder === this.backupSelectedFolder) {
                selectionDesc += ' (restored from previous session)';
            }
        }
        
        const selectionSetting = new Setting(this.contentContainer)
            .setName(selectionLabel)
            .setDesc(selectionDesc);

        if (isFolderMode(uiMode as SelectionMode)) {
            // Use Obsidian's built-in search like Templater (identical to Settings)
            selectionSetting.addSearch(search => {
                search.setPlaceholder('Choose folder...')
                    .setValue(getSelectedFolder(this.plugin.settings))
                    .onChange(async (value) => {
                        setSelectedFolder(this.plugin.settings, value);
                        await this.plugin.saveSettings();
                    });
                
                // Add folder suggestions
                new FolderSuggest(this.app, search.inputEl);
            });

            // Exclusion fields - only show in folder mode
            
            // Exclude notes - multi-select autocomplete like selectedNotes
            const excludeNotesSection = new Setting(this.contentContainer)
                .setName('Exclude notes')
                .setDesc('Skip specific notes within the selected folder');
            
            const excludeNotesContainer = this.contentContainer.createEl('div', { cls: 'oom-multiselect-search-container oom-exclude-notes-container' });
            createSelectedNotesAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: excludeNotesContainer,
                selectedNotes: this.plugin.settings.excludedNotes || [],
                onChange: async (selected) => {
                    this.plugin.settings.excludedNotes = selected;
                    this.excludedNotes = [...selected];
                    await this.plugin.saveSettings();
                }
            });
            excludeNotesSection.controlEl.appendChild(excludeNotesContainer);
            
            // Exclude subfolders - multi-select autocomplete like excludeNotes
            const excludeSubfoldersSection = new Setting(this.contentContainer)
                .setName('Exclude subfolders')
                .setDesc('Skip specific subfolders within the selected folder');
            
            const excludeSubfoldersContainer = this.contentContainer.createEl('div', { cls: 'oom-multiselect-search-container oom-exclude-subfolders-container' });
            createSelectedFoldersAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: excludeSubfoldersContainer,
                selectedFolders: this.plugin.settings.excludedSubfolders || [],
                onChange: async (selected) => {
                    this.plugin.settings.excludedSubfolders = selected;
                    this.excludedSubfolders = [...selected];
                    await this.plugin.saveSettings();
                }
            });
            excludeSubfoldersSection.controlEl.appendChild(excludeSubfoldersContainer);
        } else {
            // Multi-chip note autocomplete (identical to Settings)
            const searchFieldContainer = this.contentContainer.createEl('div', { cls: 'oom-multiselect-search-container' });
            const chipsContainer = this.contentContainer.createEl('div', { cls: 'oom-multiselect-chips-container' });
            chipsContainer.classList.toggle('oom-container-visible', this.plugin.settings.selectedNotes && this.plugin.settings.selectedNotes.length > 0);
            chipsContainer.classList.toggle('oom-container-hidden', !(this.plugin.settings.selectedNotes && this.plugin.settings.selectedNotes.length > 0));
            createSelectedNotesAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: searchFieldContainer,
                selectedNotes: this.plugin.settings.selectedNotes,
                onChange: (selected) => {
                    this.plugin.settings.selectedNotes = selected;
                    chipsContainer.classList.toggle('oom-container-visible', selected && selected.length > 0);
                    chipsContainer.classList.toggle('oom-container-hidden', !(selected && selected.length > 0));
                    this.plugin.saveSettings();
                }
            });
            // Fix: append the search field to the setting's control element
            selectionSetting.controlEl.appendChild(searchFieldContainer);
        }
        
        // Create dynamic feedback area above the sticky footer
        this.feedbackArea = this.contentContainer.createDiv({ 
            cls: 'oom-dream-scrape-feedback oom-feedback-area-hidden'
        });

        // Check project note validation and show feedback if needed
        this.validateProjectNoteConfiguration();

        // Create the sticky footer for scrape actions
        const scrapeFooter = this.contentContainer.createDiv({ cls: 'oom-dream-scrape-sticky-footer' });
        
        // Scrape Action Section
        const scrapeRow = scrapeFooter.createDiv({ cls: 'oom-dream-scrape-actions' });
        
        this.scrapeButton = scrapeRow.createEl('button', {
            text: 'Scrape Notes',
            cls: 'mod-cta oom-button oom-scrape-button'
        });
        
        this.openNoteButton = scrapeRow.createEl('button', {
            text: 'Open OneiroMetrics',
            cls: 'oom-button oom-open-note-button',
            attr: { title: 'Run a scrape to enable this' }
        });
        this.openNoteButton.disabled = true;
        
        // Set up event handlers
        
        // Scrape button click handler
        this.scrapeButton.addEventListener('click', async () => {
            if (!this.isScraping) {
                this.isScraping = true;
                this.scrapeButton.disabled = true;
                
                // Set up event listeners for real-time feedback
                this.setupScrapeEventListeners();
                
                try {
                    // Call the plugin's scrape method (events will provide feedback)
                    await this.plugin.scrapeMetrics();
                } catch (error) {
                    this.showScrapeFeedback('Error: ' + (error as Error).message, 'error');
                } finally {
                    this.isScraping = false;
                    this.scrapeButton.disabled = false;
                }
            }
        });
        
        // Open note button click handler
        this.openNoteButton.addEventListener('click', () => {
            if (this.openNoteButton?.disabled) return;
            const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.projectNote);
            if (file instanceof TFile) {
                this.app.workspace.openLinkText(this.plugin.settings.projectNote, '', true);
            } else {
                new Notice('Metrics note not found. Please set the path in settings.');
                (this.app as AppWithSettings).setting.open('oneirometrics');
            }
        });
    }

    // Enhanced Journal Structure content with full functionality - Phase 2.4 Redesign
    private loadJournalStructureContent() {
        this.contentContainer.empty();
        
        // Add welcome text
        const welcomeText = this.contentContainer.createDiv({ 
            cls: 'oom-metrics-tabs-callout-settings-text' 
        });
        

        
        // First paragraph
        welcomeText.createEl('p', { 
            text: 'The settings below control how dream entries are recognized and parsed throughout the plugin, and include tools for creating and managing templates.'
        });
        
        // Second paragraph with link
        const secondPara = welcomeText.createEl('p');
        secondPara.appendText('When enabled below, ');
        const calloutsLink = secondPara.createEl('a', {
            text: 'callout structures',
            href: 'https://help.obsidian.md/callouts'
        });
        calloutsLink.setAttribute('target', '_blank');
        secondPara.appendText(' are used in order to identify the journal, dream entry, and dream metrics sections for the Dream Scrape tool and other plugin features.');

        // Global state for all sections
        let calloutMetadata = '';
        let singleLine = this.plugin.settings.singleLineMetrics ?? false;
        let flattenNested = false;
        
        // Get dynamic callout names with fallbacks
        const getJournalCalloutName = () => this.plugin.settings.journalCalloutName || 'journal';
        const getDreamDiaryCalloutName = () => this.plugin.settings.dreamDiaryCalloutName || 'dream-diary';
        const getCalloutName = () => this.plugin.settings.calloutName || 'dream-metrics';

        // Date handling helpers
        const getDateConfig = (): DateHandlingConfig => {
            return this.plugin.settings.dateHandling || this.createCompleteDateHandlingConfig();
        };

        const formatDateForHeader = (date: Date = new Date()): string => {
            const config = getDateConfig();
            const format = config.headerFormat || 'MMMM d, yyyy';
            
            try {
                // Use date-fns for proper date formatting
                return formatDateWithFns(date, format);
            } catch (error) {
                // Fallback to basic formatting if date-fns fails
                const months = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
                const month = months[date.getMonth()];
                const day = date.getDate();
                const year = date.getFullYear();
                
                return format
                    .replace(/YYYY/g, year.toString())
                    .replace(/yyyy/g, year.toString())
                    .replace(/MMMM/g, month)
                    .replace(/MMM/g, month.substring(0, 3))
                    .replace(/MM/g, String(date.getMonth() + 1).padStart(2, '0'))
                    .replace(/DD/g, String(day).padStart(2, '0'))
                    .replace(/dd/g, String(day).padStart(2, '0'))
                    .replace(/d/g, day.toString());
            }
        };

        const formatBlockReference = (date: Date = new Date()): string => {
            const config = getDateConfig();
            const format = config.blockReferenceFormat || '^YYYYMMDD';
            
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return format
                .replace('YYYY', year.toString())
                .replace('MM', month)
                .replace('DD', day);
        };

        const buildCalloutHeader = (calloutName: string, metadata: string = '', includeDate: boolean = false): string => {
            const config = getDateConfig();
            const metaStr = metadata ? `|${metadata}` : '';
            
            if (includeDate && config.placement === 'header') {
                const dateStr = formatDateForHeader();
                const blockRef = config.includeBlockReferences ? ` ${formatBlockReference()}` : '';
                return `> [!${calloutName}${metaStr}] ${dateStr}${blockRef}`;
            }
            
            return `> [!${calloutName}${metaStr}]`;
        };

        const getDateFields = (): string[] => {
            const config = getDateConfig();
            
            if (config.placement === 'field') {
                const dateField = config.fieldFormat || 'Date:';
                return [dateField];
            }
            
            return [];
        };

        // Callout Settings Section (moved to top)
        const settingsContainer = this.contentContainer.createDiv({ 
            cls: 'oom-callout-settings' 
        });

        // Add two new toggles for dream entry types
        let plainTextDreamsEnabled = this.plugin.settings.dateHandling?.plainTextDreams ?? false;
        let calloutBasedDreamsEnabled = this.plugin.settings.dateHandling?.calloutBasedDreams ?? true;
        let calloutSettingsContainer: HTMLElement;
        
        // Plain text dream entries toggle
        new Setting(settingsContainer)
            .setName('Plain text dream entries')
            .setDesc('Parse dream entries from plain text files without callout structures')
            .addToggle(toggle => {
                toggle.setValue(plainTextDreamsEnabled)
                    .onChange(async (value) => {
                        plainTextDreamsEnabled = value;
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.plainTextDreams = value;
                        await this.plugin.saveSettings();
                    });
            });
        
        // Callout-based dream entries toggle
        new Setting(settingsContainer)
            .setName('Callout-based dream entries')
            .setDesc('Parse dream entries from callout structures in your notes')
            .addToggle(toggle => {
                toggle.setValue(calloutBasedDreamsEnabled)
                    .onChange(async (value) => {
                        calloutBasedDreamsEnabled = value;
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.calloutBasedDreams = value;
                        
                        // Show/hide callout settings container
                        if (calloutSettingsContainer) {
                            calloutSettingsContainer.style.display = value ? 'block' : 'none';
                        }
                        
                        await this.plugin.saveSettings();
                    });
            });
        
        // Callout settings container (only visible when callout-based is enabled)
        calloutSettingsContainer = settingsContainer.createDiv({ cls: 'oom-callout-settings-container' });
        calloutSettingsContainer.style.display = calloutBasedDreamsEnabled ? 'block' : 'none';
        
        // Journal callout name setting
        new Setting(calloutSettingsContainer)
            .setName('Journal callout name')
            .setDesc('Name of the callout block used for journal entries (e.g., "journal")')
            .addText(text => text
                .setPlaceholder('journal')
                .setValue(this.plugin.settings.journalCalloutName || 'journal')
                .onChange(async (value) => {
                    this.plugin.settings.journalCalloutName = value.toLowerCase().replace(/\s+/g, '-');
                    await this.plugin.saveSettings();
                }));

        // Dream diary callout name setting
        new Setting(calloutSettingsContainer)
            .setName('Dream diary callout name')
            .setDesc('Name of the callout block used for dream diary entries (e.g., "dream-diary")')
            .addText(text => text
                .setPlaceholder('dream-diary')
                .setValue(this.plugin.settings.dreamDiaryCalloutName || 'dream-diary')
                .onChange(async (value) => {
                    this.plugin.settings.dreamDiaryCalloutName = value.toLowerCase().replace(/\s+/g, '-');
                    await this.plugin.saveSettings();
                }));

        // Metrics callout name setting (moved from settings page)
        new Setting(calloutSettingsContainer)
            .setName('Metrics callout name')
            .setDesc('Name of the callout block used for dream metrics (e.g., "dream-metrics")')
            .addText(text => text
                .setPlaceholder('dream-metrics')
                .setValue(this.plugin.settings.calloutName)
                .onChange(async (value) => {
                    this.plugin.settings.calloutName = value.toLowerCase().replace(/\s+/g, '-');
                    await this.plugin.saveSettings();
                }));

        // Include date fields setting (Master Toggle)
        let dateFieldsEnabled = false;
        let dateOptionsContainer: HTMLElement;
        let frontmatterPropertyContainer: HTMLElement;
        
        const dateFieldsSetting = new Setting(settingsContainer)
            .setName('Dates in properties or callouts')
            .setDesc('Locate and parse date information in journal/dream diary callouts, or in properties. Disable this if you use daily notes with dates in filenames or headers.')
            .addToggle(toggle => {
                const dateConfig = this.plugin.settings.dateHandling || { placement: 'field' };
                dateFieldsEnabled = dateConfig.placement !== 'none';
                toggle.setValue(dateFieldsEnabled)
                    .onChange(async (value) => {
                        dateFieldsEnabled = value;
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.placement = value ? 'field' : 'none';
                        
                        // Show/hide the date options
                        dateOptionsContainer.classList.toggle('oom-display-block', value);
                        dateOptionsContainer.classList.toggle('oom-display-none', !value);
                        
                        await this.plugin.saveSettings();
                    });
            });

        // Date Options Container (only visible when master toggle is ON)
        dateOptionsContainer = settingsContainer.createDiv({ cls: 'oom-date-options-container' });
        dateOptionsContainer.classList.toggle('oom-display-block', dateFieldsEnabled);
        dateOptionsContainer.classList.toggle('oom-display-none', !dateFieldsEnabled);

        // Date placement dropdown
        new Setting(dateOptionsContainer)
            .setName('Date placement')
            .setDesc('Where to look for date information')
            .addDropdown(dropdown => {
                dropdown.addOption('field', 'Field - "Date:" inside callout content');
                dropdown.addOption('header', 'Header - In callout title "[!journal] June 2, 2025"');
                dropdown.addOption('frontmatter', 'Frontmatter - Specify below');
                
                const dateConfig = this.plugin.settings.dateHandling || { placement: 'field' };
                dropdown.setValue(dateConfig.placement === 'none' ? 'field' : dateConfig.placement)
                    .onChange(async (value: 'field' | 'header' | 'frontmatter') => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.placement = value;
                        await this.plugin.saveSettings();
                        
                        // Show/hide frontmatter property field
                        if (frontmatterPropertyContainer) {
                            frontmatterPropertyContainer.style.display = value === 'frontmatter' ? 'block' : 'none';
                        }
                    });
            });

        // Frontmatter property field (only visible when placement is 'frontmatter')
        frontmatterPropertyContainer = dateOptionsContainer.createDiv({ cls: 'oom-frontmatter-property-container' });
        frontmatterPropertyContainer.style.display = 
            this.plugin.settings.dateHandling?.placement === 'frontmatter' ? 'block' : 'none';
        
        new Setting(frontmatterPropertyContainer)
            .setName('Date property name')
            .setDesc('The frontmatter property name containing the date (e.g., "date", "dream-date")')
            .addText(text => {
                const dateConfig = this.plugin.settings.dateHandling || { frontmatterProperty: '' };
                text.setPlaceholder('date')
                    .setValue(dateConfig.frontmatterProperty || '')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                            this.plugin.settings.dateHandling.placement = 'frontmatter';
                        }
                        this.plugin.settings.dateHandling.frontmatterProperty = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Block references toggle
        new Setting(dateOptionsContainer)
            .setName('Include block references')
            .setDesc('Add block references like "^20250602" to date entries for easy linking')
            .addToggle(toggle => {
                const dateConfig = this.plugin.settings.dateHandling || { includeBlockReferences: false };
                toggle.setValue(dateConfig.includeBlockReferences || false)
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.includeBlockReferences = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Date format setting
        const dateFormatSetting = new Setting(dateOptionsContainer)
            .setName('Date format')
            .setDesc('Format for dates using Moment.js syntax.')
            .addText(text => {
                const dateConfig = this.plugin.settings.dateHandling || { headerFormat: 'MMMM d, yyyy' };
                text.setPlaceholder('MMMM d, yyyy')
                    .setValue(dateConfig.headerFormat || 'MMMM d, yyyy')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.headerFormat = value || 'MMMM d, yyyy';
                        
                        // Update the preview
                        updateDateFormatPreview();
                        
                        await this.plugin.saveSettings();
                    });
            });

        // Add custom description with working link
        const descEl = dateFormatSetting.descEl;
        descEl.empty();
        descEl.appendText('Format for dates using ');
        const linkEl = descEl.createEl('a', {
            text: 'Moment.js syntax',
            href: 'https://momentjs.com/docs/#/displaying/format/'
        });
        descEl.appendText('. Your current syntax looks like this: ');
        
        const previewSpan = descEl.createEl('span', { cls: 'oom-date-format-preview-inline' });
        previewSpan.classList.add('oom-preview-span--bold');

        const updateDateFormatPreview = () => {
            const dateConfig = this.plugin.settings.dateHandling || { headerFormat: 'MMMM d, yyyy' };
            const format = dateConfig.headerFormat || 'MMMM d, yyyy';
            const previewDate = formatDateForHeader(new Date());
            previewSpan.textContent = previewDate;
        };

        // Initialize preview
        updateDateFormatPreview();

        // Single-Line Toggle (renamed)
        new Setting(settingsContainer)
            .setName('Single-Line Metrics Callout Structure')
            .setDesc('Show all fields on a single line in all callout structures')
            .addToggle(toggle => {
                toggle.setValue(singleLine)
                    .onChange(async (value) => {
                        singleLine = value;
                        this.plugin.settings.singleLineMetrics = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Flatten Nested Toggle
        new Setting(settingsContainer)
            .setName('Flatten Nested Structure')
            .setDesc('Convert nested 3-level structure to flat format with all fields at the same level')
            .addToggle(toggle => {
                toggle.setValue(flattenNested)
                    .onChange(async (value) => {
                        flattenNested = value;
                    });
            });

        // Callout metadata field
        new Setting(settingsContainer)
            .setName('Callout metadata')
            .setDesc('Default metadata to include in all callouts (applies to all sections below)')
            .addText(text => text
                .setPlaceholder('Enter metadata')
                .setValue(calloutMetadata)
                .onChange(async (value) => {
                    calloutMetadata = value;
                    await this.plugin.saveSettings();
                }));

        // Dream Title in Properties Toggle
        let dreamTitlePropertyContainer: HTMLElement;
        
        new Setting(settingsContainer)
            .setName('Dream title in properties')
            .setDesc('Store dream titles in frontmatter properties')
            .addToggle(toggle => {
                const dateConfig = this.plugin.settings.dateHandling || {} as DateHandlingConfig;
                toggle.setValue(dateConfig.dreamTitleInProperties || false)
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.dreamTitleInProperties = value;
                        await this.plugin.saveSettings();
                        
                        // Show/hide dream title property field
                        if (dreamTitlePropertyContainer) {
                            dreamTitlePropertyContainer.style.display = value ? 'block' : 'none';
                        }
                    });
            });

        // Dream Title Property Field (only visible when dreamTitleInProperties is true)
        dreamTitlePropertyContainer = settingsContainer.createDiv({ cls: 'oom-dream-title-property-container' });
        dreamTitlePropertyContainer.style.display = 
            this.plugin.settings.dateHandling?.dreamTitleInProperties ? 'block' : 'none';
        
        new Setting(dreamTitlePropertyContainer)
            .setName('Dream title property')
            .setDesc('The frontmatter property name for dream titles (e.g., "dream-title", "title")')
            .addText(text => {
                const dateConfig = this.plugin.settings.dateHandling || {} as DateHandlingConfig;
                text.setPlaceholder('dream-title')
                    .setValue(dateConfig.dreamTitleProperty || '')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.dreamTitleProperty = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Add section separator before Template Management
        this.contentContainer.createEl('div', { cls: 'oom-section-border' });

        // Template management section
        new Setting(this.contentContainer).setName('Template management');
        
        this.contentContainer.createEl('p', { 
            text: 'Create and manage journal templates using the unified template wizard. Templates define the structure and content for your journal entries.',
            cls: 'oom-journal-structure-description'
        });
        
        this.contentContainer.createEl('p', {
            text: 'When creating templates, use placeholders for dynamic content: {{date}} (2025-01-15), {{date-long}} (January 15, 2025), {{date-month-day}} (January 15), {{date-compact}} / {{date-ref}} (20250115), {{title}}, {{content}}, {{metrics}}, or individual metric names like {{Sensory Detail}}.',
            cls: 'oom-journal-structure-description'
        });

        // Check if we're in wizard mode
        if (this.journalStructureMode === 'wizard' && this.wizardState) {
            // Render wizard mode
            this.renderEmbeddedWizard();
            return; // Exit early since wizard takes over the entire content area
        }

        // Get existing templates for display
        const templates = this.plugin.settings.linting?.templates || [];
        
        // Create main template container
        const templateSection = this.contentContainer.createDiv({ cls: 'oom-journal-section' });
        
        // Template creation button - switches to wizard mode
        const createBtnContainer = templateSection.createDiv({ cls: 'oom-setting' });
        createBtnContainer.classList.add('oom-create-btn-container');
        const createBtn = createBtnContainer.createEl('button', { 
            text: 'Open Template Wizard',
            cls: 'oom-button-primary'
        });
        createBtn.addEventListener('click', () => {
            const wizardModal = new TemplateWizardModal(this.app, this.plugin);
            wizardModal.open();
        });
        
        // Template import/export section
        const importExportSection = templateSection.createDiv({ cls: 'oom-template-import-export' });
        importExportSection.createEl('h3', { text: 'Import/export templates' });
        importExportSection.createEl('p', { 
            text: 'Save templates to files or load templates from files. Great for sharing templates between vaults or backing up your configurations.',
            cls: 'oom-setting-desc'
        });

        const buttonContainer = importExportSection.createDiv({ cls: 'oom-import-export-buttons' });

        // Export button
        const exportBtn = buttonContainer.createEl('button', {
            text: 'Export templates',
            cls: 'oom-button'
        });
        exportBtn.addEventListener('click', () => {
            this.exportTemplates();
        });

        // Import button  
        const importBtn = buttonContainer.createEl('button', {
            text: 'Import templates',
            cls: 'oom-button'
        });
        importBtn.addEventListener('click', () => {
            this.importTemplates();
        });

        // Individual template export (if templates exist)
        if (templates.length > 0) {
            const individualExportBtn = buttonContainer.createEl('button', {
                text: 'Export selected',
                cls: 'oom-button'
            });
            individualExportBtn.addEventListener('click', () => {
                this.showTemplateExportDialog();
            });
        }
        
        // Show existing templates count if any
        if (templates.length > 0) {
            const statusEl = templateSection.createDiv({ cls: 'oom-template-status' });
            statusEl.createEl('h3', { text: 'Existing Templates' });
            
            // Create a table-like display for templates
            const templatesContainer = statusEl.createDiv({ cls: 'oom-templates-list' });
            
            templates.forEach((template, index) => {
                const templateRow = templatesContainer.createDiv({ cls: 'oom-template-row' });
                
                
                const templateInfo = templateRow.createDiv({ cls: 'oom-template-info' });
                templateInfo.createEl('strong', { text: template.name });
                templateInfo.createEl('br');
                
                const detailsLine = templateInfo.createEl('span', { cls: 'oom-template-details' });
                
                if (template.isTemplaterTemplate && template.templaterFile) {
                    detailsLine.textContent = `Templater: ${template.templaterFile}`;
                } else if (template.structure) {
                    detailsLine.textContent = `Structure: ${template.structure}`;
                } else {
                    detailsLine.textContent = 'Direct input template';
                }
                
                const templateActions = templateRow.createDiv({ cls: 'oom-template-actions' });
                
                // Replace text buttons with icon buttons
                const editBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-icon-button'
                });
                setIcon(editBtn, 'pencil');
                editBtn.setAttribute('aria-label', 'Edit template');
                editBtn.setAttribute('title', 'Edit template');
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.editExistingTemplate(template);
                });
                
                const copyBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-icon-button'
                });
                setIcon(copyBtn, 'copy');
                copyBtn.setAttribute('aria-label', 'Copy template structure to clipboard');
                copyBtn.setAttribute('title', 'Copy template structure to clipboard');
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.copyTemplateToClipboard(template);
                });
                
                const exportBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-icon-button'
                });
                setIcon(exportBtn, 'download');
                exportBtn.setAttribute('aria-label', 'Export template as JSON file');
                exportBtn.setAttribute('title', 'Export template as JSON file');
                exportBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.exportTemplateAsJSON(template);
                });
                
                const deleteBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-template-delete-btn oom-icon-button'
                });
                setIcon(deleteBtn, 'trash');
                deleteBtn.setAttribute('aria-label', 'Delete template');
                deleteBtn.setAttribute('title', 'Delete template');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.deleteTemplate(template);
                });
                
                // Create preview container (initially hidden)
                const previewContainer = templatesContainer.createDiv({ 
                    cls: 'oom-template-preview-container',
                    attr: { 'data-template-id': template.id }
                });
                previewContainer.classList.add('oom-hidden');
                
                // Add expand/collapse functionality to template row
                templateRow.addEventListener('click', () => {
                    const isExpanded = templateRow.classList.contains('oom-template-expanded');
                    
                    if (isExpanded) {
                        // Collapse
                        templateRow.classList.remove('oom-template-expanded');
                        previewContainer.classList.add('oom-hidden');
                    } else {
                        // Expand
                        templateRow.classList.add('oom-template-expanded');
                        previewContainer.classList.remove('oom-hidden');
                        
                        // Populate preview if not already done
                        if (!previewContainer.hasChildNodes()) {
                            this.populateTemplatePreview(previewContainer, template);
                        }
                    }
                });
            });
        } else {
            templateSection.createEl('p', { 
                text: 'No templates configured yet. Use the Template Wizard to create your first template.',
                cls: 'oom-empty-state'
            });
        }
    }
    
    /**
     * Render normal Journal Structure mode
     */
    private renderNormalJournalStructureMode() {
        // Add header section
        const headerSection = this.contentContainer.createDiv({ 
            cls: 'oom-journal-structure-header' 
        });
        

        
        headerSection.createEl('p', { 
            text: 'Configure journal structure settings, templates, validation rules, and interface preferences.',
            cls: 'oom-journal-structure-description'
        });
        
        headerSection.createEl('p', { 
            text: 'Structures define the organizational framework (what callout types are allowed, how they nest, validation rules), while Templates provide the actual content implementations that reference and conform to those structures. Each template must reference exactly one structure, but multiple templates can use the same structure for different content styles.',
            cls: 'oom-journal-structure-description'
        });
        
        // Create main content container - single page layout
        const mainContainer = this.contentContainer.createDiv({ 
            cls: 'oom-journal-structure-main' 
        });
        
        // Simple Template Creation button - launches wizard
        const templateSection = mainContainer.createDiv({ cls: 'oom-journal-section' });
        templateSection.createEl('h3', { text: 'Template Creation', cls: 'oom-section-header' });
        
        templateSection.createEl('p', { 
            text: 'Create and manage journal templates using the unified template wizard.' 
        });
        
        // Add placeholder documentation
        templateSection.createEl('p', {
            text: 'When creating templates, use placeholders for dynamic content: {{date}} (2025-01-15), {{date-long}} (January 15, 2025), {{date-month-day}} (January 15), {{date-compact}} / {{date-ref}} (20250115), {{title}}, {{content}}, {{metrics}}, or individual metric names like {{Sensory Detail}}.',
            cls: 'oom-journal-structure-description'
        });
        
        // Get existing templates for display
        const templates = this.plugin.settings.linting?.templates || [];
        
        // Template creation button - switches to wizard mode
        const createBtnContainer = templateSection.createDiv({ cls: 'oom-setting' });
        createBtnContainer.classList.add('oom-create-btn-container');
        const createBtn = createBtnContainer.createEl('button', { 
            text: 'Open Template Wizard',
            cls: 'oom-button-primary'
        });
        createBtn.addEventListener('click', () => {
            this.enterWizardMode();
        });
        
        // Template import/export section
        const importExportSection = templateSection.createDiv({ cls: 'oom-template-import-export' });
        importExportSection.createEl('h3', { text: 'Import/export templates' });
        importExportSection.createEl('p', { 
            text: 'Save templates to files or load templates from files. Great for sharing templates between vaults or backing up your configurations.',
            cls: 'oom-setting-desc'
        });

        const buttonContainer = importExportSection.createDiv({ cls: 'oom-import-export-buttons' });
        
        
        

        // Export button
        const exportBtn = buttonContainer.createEl('button', {
            text: 'Export templates',
            cls: 'oom-button'
        });
        exportBtn.addEventListener('click', () => {
            this.exportTemplates();
        });

        // Import button  
        const importBtn = buttonContainer.createEl('button', {
            text: 'Import templates',
            cls: 'oom-button'
        });
        importBtn.addEventListener('click', () => {
            this.importTemplates();
        });

        // Individual template export (if templates exist)
        if (templates.length > 0) {
            const individualExportBtn = buttonContainer.createEl('button', {
                text: 'Export selected',
                cls: 'oom-button'
            });
            individualExportBtn.addEventListener('click', () => {
                this.showTemplateExportDialog();
            });
        }
        
        // Show existing templates count if any
        if (templates.length > 0) {
            const statusEl = templateSection.createDiv({ cls: 'oom-template-status' });
            statusEl.createEl('h3', { text: 'Existing Templates' });
            
            // Create a table-like display for templates
            const templatesContainer = statusEl.createDiv({ cls: 'oom-templates-list' });
            
            templates.forEach((template, index) => {
                const templateRow = templatesContainer.createDiv({ cls: 'oom-template-row' });
                
                
                const templateInfo = templateRow.createDiv({ cls: 'oom-template-info' });
                templateInfo.createEl('strong', { text: template.name });
                templateInfo.createEl('br');
                
                const detailsLine = templateInfo.createEl('span', { cls: 'oom-template-details' });
                
                if (template.isTemplaterTemplate && template.templaterFile) {
                    detailsLine.textContent = `Templater: ${template.templaterFile}`;
                } else if (template.structure) {
                    detailsLine.textContent = `Structure: ${template.structure}`;
                } else {
                    detailsLine.textContent = 'Direct input template';
                }
                
                const templateActions = templateRow.createDiv({ cls: 'oom-template-actions' });
                
                // Replace text buttons with icon buttons
                const editBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-icon-button'
                });
                setIcon(editBtn, 'pencil');
                editBtn.setAttribute('aria-label', 'Edit template');
                editBtn.setAttribute('title', 'Edit template');
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.editExistingTemplate(template);
                });
                
                const copyBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-icon-button'
                });
                setIcon(copyBtn, 'copy');
                copyBtn.setAttribute('aria-label', 'Copy template structure to clipboard');
                copyBtn.setAttribute('title', 'Copy template structure to clipboard');
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.copyTemplateToClipboard(template);
                });
                
                const exportBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-icon-button'
                });
                setIcon(exportBtn, 'download');
                exportBtn.setAttribute('aria-label', 'Export template as JSON file');
                exportBtn.setAttribute('title', 'Export template as JSON file');
                exportBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.exportTemplateAsJSON(template);
                });
                
                const deleteBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-template-delete-btn oom-icon-button'
                });
                setIcon(deleteBtn, 'trash');
                deleteBtn.setAttribute('aria-label', 'Delete template');
                deleteBtn.setAttribute('title', 'Delete template');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.deleteTemplate(template);
                });
                
                // Create preview container (initially hidden)
                const previewContainer = templatesContainer.createDiv({ 
                    cls: 'oom-template-preview-container',
                    attr: { 'data-template-id': template.id }
                });
                previewContainer.classList.add('oom-hidden');
                
                // Add expand/collapse functionality to template row
                templateRow.addEventListener('click', () => {
                    const isExpanded = templateRow.classList.contains('oom-template-expanded');
                    
                    if (isExpanded) {
                        // Collapse
                        templateRow.classList.remove('oom-template-expanded');
                        previewContainer.classList.add('oom-hidden');
                    } else {
                        // Expand
                        templateRow.classList.add('oom-template-expanded');
                        previewContainer.classList.remove('oom-hidden');
                        
                        // Populate preview if not already done
                        if (previewContainer.innerHTML === '') {
                            this.populateTemplatePreview(previewContainer, template);
                        }
                    }
                });
            });
        } else {
            templateSection.createEl('p', { 
                text: 'No templates configured yet. Use the Template Wizard to create your first template.',
                cls: 'oom-empty-state'
            });
        }
    }
    
    /**
     * Render embedded wizard mode
     */
    private renderEmbeddedWizard() {
        // Add wizard header
        const headerSection = this.contentContainer.createDiv({ 
            cls: 'oom-journal-structure-header oom-wizard-header' 
        });
        
        const totalSteps = this.getWizardTotalSteps();
        const titleText = `Template Wizard (Step ${this.wizardState!.currentStep} of ${totalSteps})`;
        headerSection.createEl('h2', { text: titleText });
        
        // Add breadcrumb with back button
        const breadcrumbContainer = headerSection.createDiv({ cls: 'oom-wizard-breadcrumb' });
        const backButton = breadcrumbContainer.createEl('button', {
            text: '? Back to Journal Structure',
            cls: 'oom-wizard-back-button'
        });
        backButton.addEventListener('click', () => {
            this.exitWizardMode();
        });
        
        const templateName = this.wizardState!.templateName || 'New Template';
        breadcrumbContainer.createEl('span', { 
            text: ` | Creating: ${templateName}`,
            cls: 'oom-wizard-breadcrumb-text'
        });
        
        // Add description for context
        headerSection.createEl('p', { 
            text: 'Create and configure journal templates with dynamic content placeholders and structured layouts. Templates define how your callouts will be formatted and what information they contain.',
            cls: 'oom-journal-structure-description'
        });
        
        // Create wizard container
        const wizardContainer = this.contentContainer.createDiv({ 
            cls: 'oom-embedded-wizard-container' 
        });
        
        // Create main wizard content area (scrollable)
        const wizardMainContent = wizardContainer.createDiv({
            cls: 'oom-wizard-main-content'
        });
        
        // Clear previous step containers
        this.wizardStepContainers = [];
        
        // Create step containers (max 3 steps)
        for (let i = 1; i <= 3; i++) {
            const stepContainer = wizardMainContent.createDiv({ 
                cls: `oom-wizard-step step-${i}`,
                attr: { 'data-step': i.toString() }
            });
            
            if (i !== this.wizardState!.currentStep) {
                stepContainer.classList.add('oom-hidden');
            }
            
            this.wizardStepContainers.push(stepContainer);
        }
        
        // Build current step
        this.buildWizardStep(this.wizardState!.currentStep);
        
        // Create preview section in main content
        this.createWizardPreviewSection(wizardMainContent);
        
        // Create sticky footer for navigation
        const wizardFooter = wizardContainer.createDiv({ cls: 'oom-wizard-footer' });
        
        this.wizardNavigationEl = wizardFooter;
        this.updateWizardNavigation();
        
        // Update preview
        this.updateWizardPreview();
    }

    // Load Callout Quick Copy content with migrated functionality
    private loadCalloutSettingsContent() {
        this.contentContainer.empty();
        
        // Add welcome text
        const welcomeText = this.contentContainer.createDiv({ 
            cls: 'oom-metrics-tabs-callout-settings-text' 
        });
        
        new Setting(welcomeText).setHeading().setName('Callout Settings');
        
        welcomeText.createEl('p', { 
            text: 'Configure callout names, date formatting, and template management for OneiroMetrics. These settings control how callouts are generated and recognized throughout the plugin, and include tools for creating and managing journal templates.'
        });

        // Global state for all sections
        let calloutMetadata = '';
        let singleLine = this.plugin.settings.singleLineMetrics ?? false;
        let flattenNested = false;
        
        // Get dynamic callout names with fallbacks
        const getJournalCalloutName = () => this.plugin.settings.journalCalloutName || 'journal';
        const getDreamDiaryCalloutName = () => this.plugin.settings.dreamDiaryCalloutName || 'dream-diary';
        const getCalloutName = () => this.plugin.settings.calloutName || 'dream-metrics';

        // Date handling helpers
        const getDateConfig = (): DateHandlingConfig => {
            return this.plugin.settings.dateHandling || this.createCompleteDateHandlingConfig();
        };

        const formatDateForHeader = (date: Date = new Date()): string => {
            const config = getDateConfig();
            const format = config.headerFormat || 'MMMM d, yyyy';
            
            try {
                // Use date-fns for proper date formatting
                return formatDateWithFns(date, format);
            } catch (error) {
                // Fallback to basic formatting if date-fns fails
                const months = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
                const month = months[date.getMonth()];
                const day = date.getDate();
                const year = date.getFullYear();
                
                return format
                    .replace(/YYYY/g, year.toString())
                    .replace(/yyyy/g, year.toString())
                    .replace(/MMMM/g, month)
                    .replace(/MMM/g, month.substring(0, 3))
                    .replace(/MM/g, String(date.getMonth() + 1).padStart(2, '0'))
                    .replace(/DD/g, String(day).padStart(2, '0'))
                    .replace(/dd/g, String(day).padStart(2, '0'))
                    .replace(/d/g, day.toString());
            }
        };

        const formatBlockReference = (date: Date = new Date()): string => {
            const config = getDateConfig();
            const format = config.blockReferenceFormat || '^YYYYMMDD';
            
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return format
                .replace('YYYY', year.toString())
                .replace('MM', month)
                .replace('DD', day);
        };

        const buildCalloutHeader = (calloutName: string, metadata: string = '', includeDate: boolean = false): string => {
            const config = getDateConfig();
            const metaStr = metadata ? `|${metadata}` : '';
            
            if (includeDate && config.placement === 'header') {
                const dateStr = formatDateForHeader();
                const blockRef = config.includeBlockReferences ? ` ${formatBlockReference()}` : '';
                return `> [!${calloutName}${metaStr}] ${dateStr}${blockRef}`;
            }
            
            return `> [!${calloutName}${metaStr}]`;
        };

        const getDateFields = (): string[] => {
            const config = getDateConfig();
            
            if (config.placement === 'field') {
                const dateField = config.fieldFormat || 'Date:';
                return [dateField];
            }
            
            return [];
        };

        // Callout Settings Section (moved to top)
        const settingsContainer = this.contentContainer.createDiv({ 
            cls: 'oom-callout-settings' 
        });

        // Journal Callout Name Setting
        new Setting(settingsContainer)
            .setName('Journal Callout Name')
            .setDesc('Name of the callout block used for journal entries (e.g., "journal")')
            .addText(text => text
                .setPlaceholder('journal')
                .setValue(this.plugin.settings.journalCalloutName || 'journal')
                .onChange(async (value) => {
                    this.plugin.settings.journalCalloutName = value.toLowerCase().replace(/\s+/g, '-');
                    await this.plugin.saveSettings();
                }));

        // Dream Diary Callout Name Setting
        new Setting(settingsContainer)
            .setName('Dream Diary Callout Name')
            .setDesc('Name of the callout block used for dream diary entries (e.g., "dream-diary")')
            .addText(text => text
                .setPlaceholder('dream-diary')
                .setValue(this.plugin.settings.dreamDiaryCalloutName || 'dream-diary')
                .onChange(async (value) => {
                    this.plugin.settings.dreamDiaryCalloutName = value.toLowerCase().replace(/\s+/g, '-');
                    await this.plugin.saveSettings();
                }));

        // Metrics Callout Name Setting (moved from settings page)
        new Setting(settingsContainer)
            .setName('Metrics Callout Name')
            .setDesc('Name of the callout block used for dream metrics (e.g., "dream-metrics")')
            .addText(text => text
                .setPlaceholder('dream-metrics')
                .setValue(this.plugin.settings.calloutName)
                .onChange(async (value) => {
                    this.plugin.settings.calloutName = value.toLowerCase().replace(/\s+/g, '-');
                    await this.plugin.saveSettings();
                }));

        // Include Date Fields Setting (Master Toggle)
        let dateFieldsEnabled = false;
        let dateOptionsContainer: HTMLElement;
        let frontmatterPropertyContainer: HTMLElement;
        
        const dateFieldsSetting = new Setting(settingsContainer)
            .setName('Include Date Fields')
            .setDesc('Include date information in Journal and Dream Diary callouts. Disable this if you use daily notes with dates in filenames or headers.')
            .addToggle(toggle => {
                const dateConfig = this.plugin.settings.dateHandling || { placement: 'field' };
                dateFieldsEnabled = dateConfig.placement !== 'none';
                toggle.setValue(dateFieldsEnabled)
                    .onChange(async (value) => {
                        dateFieldsEnabled = value;
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.placement = value ? 'field' : 'none';
                        
                        // Show/hide the date options
                        dateOptionsContainer.classList.toggle('oom-display-block', value);
                        dateOptionsContainer.classList.toggle('oom-display-none', !value);
                        
                        await this.plugin.saveSettings();
                    });
            });

        // Date Options Container (only visible when master toggle is ON)
        dateOptionsContainer = settingsContainer.createDiv({ cls: 'oom-date-options-container' });
        dateOptionsContainer.classList.toggle('oom-display-block', dateFieldsEnabled);
        dateOptionsContainer.classList.toggle('oom-display-none', !dateFieldsEnabled);

        // Date placement dropdown
        new Setting(dateOptionsContainer)
            .setName('Date placement')
            .setDesc('Where to look for date information')
            .addDropdown(dropdown => {
                dropdown.addOption('field', 'Field - "Date:" inside callout content');
                dropdown.addOption('header', 'Header - In callout title "[!journal] June 2, 2025"');
                dropdown.addOption('frontmatter', 'Frontmatter - Specify below');
                
                const dateConfig = this.plugin.settings.dateHandling || { placement: 'field' };
                dropdown.setValue(dateConfig.placement === 'none' ? 'field' : dateConfig.placement)
                    .onChange(async (value: 'field' | 'header' | 'frontmatter') => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.placement = value;
                        await this.plugin.saveSettings();
                        
                        // Show/hide frontmatter property field
                        if (frontmatterPropertyContainer) {
                            frontmatterPropertyContainer.style.display = value === 'frontmatter' ? 'block' : 'none';
                        }
                    });
            });

        // Frontmatter property field (only visible when placement is 'frontmatter')
        frontmatterPropertyContainer = dateOptionsContainer.createDiv({ cls: 'oom-frontmatter-property-container' });
        frontmatterPropertyContainer.style.display = 
            this.plugin.settings.dateHandling?.placement === 'frontmatter' ? 'block' : 'none';
        
        new Setting(frontmatterPropertyContainer)
            .setName('Date property name')
            .setDesc('The frontmatter property name containing the date (e.g., "date", "dream-date")')
            .addText(text => {
                const dateConfig = this.plugin.settings.dateHandling || { frontmatterProperty: '' };
                text.setPlaceholder('date')
                    .setValue(dateConfig.frontmatterProperty || '')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                            this.plugin.settings.dateHandling.placement = 'frontmatter';
                        }
                        this.plugin.settings.dateHandling.frontmatterProperty = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Block references toggle
        new Setting(dateOptionsContainer)
            .setName('Include block references')
            .setDesc('Add block references like "^20250602" to date entries for easy linking')
            .addToggle(toggle => {
                const dateConfig = this.plugin.settings.dateHandling || { includeBlockReferences: false };
                toggle.setValue(dateConfig.includeBlockReferences || false)
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.includeBlockReferences = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Date format setting
        const dateFormatSetting = new Setting(dateOptionsContainer)
            .setName('Date format')
            .setDesc('Format for dates using Moment.js syntax.')
            .addText(text => {
                const dateConfig = this.plugin.settings.dateHandling || { headerFormat: 'MMMM d, yyyy' };
                text.setPlaceholder('MMMM d, yyyy')
                    .setValue(dateConfig.headerFormat || 'MMMM d, yyyy')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.headerFormat = value || 'MMMM d, yyyy';
                        
                        // Update the preview
                        updateDateFormatPreview();
                        
                        await this.plugin.saveSettings();
                    });
            });

        // Add custom description with working link
        const descEl = dateFormatSetting.descEl;
        descEl.empty();
        descEl.appendText('Format for dates using ');
        const linkEl = descEl.createEl('a', {
            text: 'Moment.js syntax',
            href: 'https://momentjs.com/docs/#/displaying/format/'
        });
        descEl.appendText('. Your current syntax looks like this: ');
        
        const previewSpan = descEl.createEl('span', { cls: 'oom-date-format-preview-inline' });
        previewSpan.classList.add('oom-preview-span--bold');

        const updateDateFormatPreview = () => {
            const dateConfig = this.plugin.settings.dateHandling || { headerFormat: 'MMMM d, yyyy' };
            const format = dateConfig.headerFormat || 'MMMM d, yyyy';
            const previewDate = formatDateForHeader(new Date());
            previewSpan.textContent = previewDate;
        };

        // Initialize preview
        updateDateFormatPreview();

        // Single-Line Toggle (renamed)
        new Setting(settingsContainer)
            .setName('Single-Line Metrics Callout Structure')
            .setDesc('Show all fields on a single line in all callout structures')
            .addToggle(toggle => {
                toggle.setValue(singleLine)
                    .onChange(async (value) => {
                        singleLine = value;
                        this.plugin.settings.singleLineMetrics = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Flatten Nested Toggle
        new Setting(settingsContainer)
            .setName('Flatten Nested Structure')
            .setDesc('Convert nested 3-level structure to flat format with all fields at the same level')
            .addToggle(toggle => {
                toggle.setValue(flattenNested)
                    .onChange(async (value) => {
                        flattenNested = value;
                    });
            });

        // Callout metadata field
        new Setting(settingsContainer)
            .setName('Callout metadata')
            .setDesc('Default metadata to include in all callouts (applies to all sections below)')
            .addText(text => text
                .setPlaceholder('Enter metadata')
                .setValue(calloutMetadata)
                .onChange(async (value) => {
                    calloutMetadata = value;
                    await this.plugin.saveSettings();
                }));

        // Dream Title in Properties Toggle
        let dreamTitlePropertyContainer: HTMLElement;
        
        new Setting(settingsContainer)
            .setName('Dream title in properties')
            .setDesc('Store dream titles in frontmatter properties')
            .addToggle(toggle => {
                const dateConfig = this.plugin.settings.dateHandling || {} as DateHandlingConfig;
                toggle.setValue(dateConfig.dreamTitleInProperties || false)
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.dreamTitleInProperties = value;
                        await this.plugin.saveSettings();
                        
                        // Show/hide dream title property field
                        if (dreamTitlePropertyContainer) {
                            dreamTitlePropertyContainer.style.display = value ? 'block' : 'none';
                        }
                    });
            });

        // Dream Title Property Field (only visible when dreamTitleInProperties is true)
        dreamTitlePropertyContainer = settingsContainer.createDiv({ cls: 'oom-dream-title-property-container' });
        dreamTitlePropertyContainer.style.display = 
            this.plugin.settings.dateHandling?.dreamTitleInProperties ? 'block' : 'none';
        
        new Setting(dreamTitlePropertyContainer)
            .setName('Dream title property')
            .setDesc('The frontmatter property name for dream titles (e.g., "dream-title", "title")')
            .addText(text => {
                const dateConfig = this.plugin.settings.dateHandling || {} as DateHandlingConfig;
                text.setPlaceholder('dream-title')
                    .setValue(dateConfig.dreamTitleProperty || '')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.dateHandling) {
                            this.plugin.settings.dateHandling = this.createCompleteDateHandlingConfig();
                        }
                        this.plugin.settings.dateHandling.dreamTitleProperty = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Add section separator before Template Management
        this.contentContainer.createEl('div', { cls: 'oom-section-border' });

        // Template Management Section
        this.contentContainer.createEl('h3', { text: 'Template Management' });
        
        this.contentContainer.createEl('p', { 
            text: 'Create and manage journal templates using the unified template wizard. Templates define the structure and content for your journal entries.',
            cls: 'oom-journal-structure-description'
        });
        
        this.contentContainer.createEl('p', {
            text: 'When creating templates, use placeholders for dynamic content: {{date}} (2025-01-15), {{date-long}} (January 15, 2025), {{date-month-day}} (January 15), {{date-compact}} / {{date-ref}} (20250115), {{title}}, {{content}}, {{metrics}}, or individual metric names like {{Sensory Detail}}.',
            cls: 'oom-journal-structure-description'
        });

        // Check if we're in wizard mode
        if (this.journalStructureMode === 'wizard' && this.wizardState) {
            // Render wizard mode
            this.renderEmbeddedWizard();
            return; // Exit early since wizard takes over the entire content area
        }

        // Get existing templates for display
        const templates = this.plugin.settings.linting?.templates || [];
        
        // Create main template container
        const templateSection = this.contentContainer.createDiv({ cls: 'oom-journal-section' });
        
        // Template creation button - switches to wizard mode
        const createBtnContainer = templateSection.createDiv({ cls: 'oom-setting' });
        createBtnContainer.classList.add('oom-create-btn-container');
        const createBtn = createBtnContainer.createEl('button', { 
            text: 'Open Template Wizard',
            cls: 'oom-button-primary'
        });
        createBtn.addEventListener('click', () => {
            this.enterWizardMode();
        });
        
        // Template import/export section
        const importExportSection = templateSection.createDiv({ cls: 'oom-template-import-export' });
        importExportSection.createEl('h3', { text: 'Import/export templates' });
        importExportSection.createEl('p', { 
            text: 'Save templates to files or load templates from files. Great for sharing templates between vaults or backing up your configurations.',
            cls: 'oom-setting-desc'
        });

        const buttonContainer = importExportSection.createDiv({ cls: 'oom-import-export-buttons' });
        
        
        

        // Export button
        const exportBtn = buttonContainer.createEl('button', {
            text: 'Export templates',
            cls: 'oom-button'
        });
        exportBtn.addEventListener('click', () => {
            this.exportTemplates();
        });

        // Import button  
        const importBtn = buttonContainer.createEl('button', {
            text: 'Import templates',
            cls: 'oom-button'
        });
        importBtn.addEventListener('click', () => {
            this.importTemplates();
        });

        // Individual template export (if templates exist)
        if (templates.length > 0) {
            const individualExportBtn = buttonContainer.createEl('button', {
                text: 'Export selected',
                cls: 'oom-button'
            });
            individualExportBtn.addEventListener('click', () => {
                this.showTemplateExportDialog();
            });
        }
        
        // Show existing templates count if any
        if (templates.length > 0) {
            const statusEl = templateSection.createDiv({ cls: 'oom-template-status' });
            statusEl.createEl('h3', { text: 'Existing Templates' });
            
            // Create a table-like display for templates
            const templatesContainer = statusEl.createDiv({ cls: 'oom-templates-list' });
            
            templates.forEach((template, index) => {
                const templateRow = templatesContainer.createDiv({ cls: 'oom-template-row' });
                
                
                const templateInfo = templateRow.createDiv({ cls: 'oom-template-info' });
                templateInfo.createEl('strong', { text: template.name });
                templateInfo.createEl('br');
                
                const detailsLine = templateInfo.createEl('span', { cls: 'oom-template-details' });
                
                if (template.isTemplaterTemplate && template.templaterFile) {
                    detailsLine.textContent = `Templater: ${template.templaterFile}`;
                } else if (template.structure) {
                    detailsLine.textContent = `Structure: ${template.structure}`;
                } else {
                    detailsLine.textContent = 'Direct input template';
                }
                
                const templateActions = templateRow.createDiv({ cls: 'oom-template-actions' });
                
                // Replace text buttons with icon buttons
                const editBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-icon-button'
                });
                setIcon(editBtn, 'pencil');
                editBtn.setAttribute('aria-label', 'Edit template');
                editBtn.setAttribute('title', 'Edit template');
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.editExistingTemplate(template);
                });
                
                const copyBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-icon-button'
                });
                setIcon(copyBtn, 'copy');
                copyBtn.setAttribute('aria-label', 'Copy template structure to clipboard');
                copyBtn.setAttribute('title', 'Copy template structure to clipboard');
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.copyTemplateToClipboard(template);
                });
                
                const exportBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-icon-button'
                });
                setIcon(exportBtn, 'download');
                exportBtn.setAttribute('aria-label', 'Export template as JSON file');
                exportBtn.setAttribute('title', 'Export template as JSON file');
                exportBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.exportTemplateAsJSON(template);
                });
                
                const deleteBtn = templateActions.createEl('button', {
                    cls: 'oom-template-action-btn oom-template-delete-btn oom-icon-button'
                });
                setIcon(deleteBtn, 'trash');
                deleteBtn.setAttribute('aria-label', 'Delete template');
                deleteBtn.setAttribute('title', 'Delete template');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    this.deleteTemplate(template);
                });
                
                // Create preview container (initially hidden)
                const previewContainer = templatesContainer.createDiv({ 
                    cls: 'oom-template-preview-container',
                    attr: { 'data-template-id': template.id }
                });
                previewContainer.classList.add('oom-hidden');
                
                // Add expand/collapse functionality to template row
                templateRow.addEventListener('click', () => {
                    const isExpanded = templateRow.classList.contains('oom-template-expanded');
                    
                    if (isExpanded) {
                        // Collapse
                        templateRow.classList.remove('oom-template-expanded');
                        previewContainer.classList.add('oom-hidden');
                    } else {
                        // Expand
                        templateRow.classList.add('oom-template-expanded');
                        previewContainer.classList.remove('oom-hidden');
                        
                        // Populate preview if not already done
                        if (previewContainer.innerHTML === '') {
                            this.populateTemplatePreview(previewContainer, template);
                        }
                    }
                });
            });
        } else {
            templateSection.createEl('p', { 
                text: 'No templates configured yet. Use the Template Wizard to create your first template.',
                cls: 'oom-empty-state'
            });
        }
    }
    
    /**
     * Apply styles to the callout box
     */
    private applyCalloutBoxStyles(element: HTMLElement): void {
        element.addClass('oom-callout-box');
    }
    
    /**
     * Apply styles to the copy button
     */
    private applyCopyButtonStyles(button: HTMLElement): void {
        button.classList.add('oom-copy-button');
    }
    
    /**
     * Apply styles to the templater configuration section
     */
    private styleTemplaterConfigSection(
        configSection: HTMLElement, 
        statusEl: HTMLElement, 
        settingsBtn: HTMLElement
    ): void {
        // Section container styling - use CSS class
        configSection.addClass('oom-templater-config-section');
        
        // Status element styling - use CSS class
        statusEl.addClass('oom-templater-status');
        
        // Status elements use CSS classes for styling (no JS needed)
        // Button container styling handled by CSS
        const buttonContainer = settingsBtn.parentElement;
        if (buttonContainer) {
            buttonContainer.addClass('oom-template-button-container');
        }
        
        // Settings button styling - use CSS class
        settingsBtn.addClass('oom-template-settings-button');
        
        // Debug button styling (if it exists) - use CSS class
        const debugBtn = buttonContainer?.querySelector('.oom-templater-debug-button') as HTMLElement;
        if (debugBtn) {
            debugBtn.addClass('oom-template-debug-button');
        }
    }

    /**
     * Build the Template Creation section (replaces all the old sections)
     */
    private buildTemplateCreationSection(containerEl: HTMLElement) {
        containerEl.createEl('p', { 
            text: 'Use the unified template wizard to create and manage journal templates with structures.' 
        });
        
        // Templater configuration section (always show for user information)
        const templaterConfigSection = containerEl.createDiv({ cls: 'oom-templater-config-section' });
        templaterConfigSection.createEl('h4', { text: 'Templater Configuration' });
        
        const templaterEnabled = !!(this.plugin.templaterIntegration?.isTemplaterInstalled?.());
        let templaterTemplates: string[] = [];
        let templaterTemplateFolder = '';
        
        if (templaterEnabled) {
            // Get the Templater plugin instance to check its settings
            try {
                const templaterPlugin = (this.plugin.app as AppWithSettings).plugins?.plugins?.['templater-obsidian'];
                if (templaterPlugin) {
                    // Fix: Use templates_folder (with 's') not template_folder
                    templaterTemplateFolder = templaterPlugin.settings?.templates_folder || 'Not configured';
                    templaterTemplates = this.plugin.templaterIntegration?.getTemplaterTemplates?.() || [];
                    
                    // Debug information
                    this.logger.debug('TemplaterDetection', 'Templater plugin configuration detected', {
                        pluginFound: !!templaterPlugin,
                        settingsObject: !!templaterPlugin.settings,
                        templatesFolder: templaterTemplateFolder,
                        templatesFound: templaterTemplates.length,
                        availableSettingsKeys: Object.keys(templaterPlugin.settings || {})
                    });
                }
            } catch (error) {
                templaterTemplateFolder = 'Error accessing settings';
                this.logger.error('TemplaterDetection', 'Error accessing Templater settings', { error });
            }
        }
        
        // Status display
        const statusEl = templaterConfigSection.createDiv({ cls: 'oom-templater-status' });
        
        if (templaterEnabled) {
            statusEl.createEl('p', { 
                text: `? Templater plugin detected`,
                cls: 'oom-status-success'
            });
            statusEl.createEl('p', { 
                text: `?? Template folder: ${templaterTemplateFolder}`,
                cls: 'oom-templater-folder-info'
            });
            statusEl.createEl('p', { 
                text: `?? Templates found: ${templaterTemplates.length}`,
                cls: 'oom-templater-count-info'
            });
            
            if (templaterTemplates.length === 0 && templaterTemplateFolder !== 'Not configured') {
                statusEl.createEl('p', { 
                    text: '?? No .md files found in template folder. Create some Templater templates to use this feature.',
                    cls: 'oom-status-warning'
                });
            } else if (templaterTemplateFolder === 'Not configured') {
                statusEl.createEl('p', { 
                    text: '?? Templater template folder not configured. Go to Templater settings to set a template folder.',
                    cls: 'oom-status-warning'
                });
            }
        } else {
            statusEl.createEl('p', { 
                text: '? Templater plugin not found',
                cls: 'oom-status-error u-state--error'
            });
            statusEl.createEl('p', { 
                text: 'Install and enable the Templater plugin to use dynamic templates.',
                cls: 'oom-templater-help-text'
            });
        }
        
        // Add helpful links
        const helpEl = templaterConfigSection.createDiv({ cls: 'oom-templater-help' });
        const settingsBtn = helpEl.createEl('button', {
            text: templaterEnabled ? 'Open Templater Settings' : 'Install Templater',
            cls: 'oom-templater-settings-button'
        });
        
        settingsBtn.addEventListener('click', () => {
            if (templaterEnabled) {
                // Open Obsidian settings to Templater tab
                const appWithSettings = this.app as AppWithSettings;
                appWithSettings.setting.open();
                appWithSettings.setting.openTabById('templater-obsidian');
            } else {
                // Open community plugins to install Templater
                const appWithSettings = this.app as AppWithSettings;
                appWithSettings.setting.open();
                appWithSettings.setting.openTabById('community-plugins');
                new Notice('Search for "Templater" in the Community Plugins tab');
            }
        });
        
        // Add debug button for troubleshooting
        if (templaterEnabled) {
            const debugBtn = helpEl.createEl('button', {
                text: 'Debug Templater Detection',
                cls: 'oom-templater-debug-button'
            });
            
            debugBtn.addEventListener('click', () => {
                try {
                    const templaterPlugin = (this.plugin.app as AppWithSettings).plugins?.plugins?.['templater-obsidian'];
                    const debugInfo = {
                        pluginFound: !!templaterPlugin,
                        pluginEnabled: templaterPlugin?.manifest?.id === 'templater-obsidian',
                        settingsObjectExists: !!templaterPlugin?.settings,
                        templatesFolderSetting: templaterPlugin?.settings?.templates_folder || 'Not set',
                        templatesFolderExistsInVault: !!this.app.vault.getAbstractFileByPath(templaterPlugin?.settings?.templates_folder || ''),
                        templatesFoundViaIntegration: templaterTemplates.length,
                        templaterSettingsKeys: Object.keys(templaterPlugin?.settings || {}),
                        fullTemplaterSettings: templaterPlugin?.settings
                    };
                    
                    this.logger.info('TemplaterDebug', 'Complete Templater debug information', debugInfo);
                    
                    new Notice(`Templater Debug Info:

Plugin found: ${debugInfo.pluginFound}
Plugin enabled: ${debugInfo.pluginEnabled}
Settings exist: ${debugInfo.settingsObjectExists}
Template folder (templates_folder): ${debugInfo.templatesFolderSetting}
Settings keys: ${debugInfo.templaterSettingsKeys.join(', ')}
Templates found: ${debugInfo.templatesFoundViaIntegration}

Full debug info in logs/console`);
                    
                } catch (error) {
                    this.logger.error('TemplaterDebug', 'Error during debug info collection', { error });
                    new Notice('Error collecting debug info - check console/logs');
                }
            });
        }
        
        // Apply inline styling to templater config section
        this.styleTemplaterConfigSection(templaterConfigSection, statusEl, settingsBtn);
        
        // Get existing templates for display
        const templates = this.plugin.settings.linting?.templates || [];
        
        // Template creation button - now switches to wizard mode
        const createBtnContainer = containerEl.createDiv({ cls: 'oom-setting' });
        createBtnContainer.classList.add('oom-create-btn-container--extended');
        const createBtn = createBtnContainer.createEl('button', { 
            text: 'Open Template Wizard',
            cls: 'oom-button-primary'
        });
        createBtn.addEventListener('click', () => {
            this.enterWizardMode();
        });
        
        // Template import/export section
        const importExportSection = containerEl.createDiv({ cls: 'oom-template-import-export' });
        importExportSection.createEl('h3', { text: 'Import/export templates' });
        importExportSection.createEl('p', { 
            text: 'Save templates to files or load templates from files. Great for sharing templates between vaults or backing up your configurations.',
            cls: 'oom-setting-desc'
        });

        const buttonContainer = importExportSection.createDiv({ cls: 'oom-import-export-buttons' });
        
        
        

        // Export button
        const exportBtn = buttonContainer.createEl('button', {
            text: 'Export templates',
            cls: 'oom-button'
        });
        exportBtn.addEventListener('click', () => {
            this.exportTemplates();
        });

        // Import button  
        const importBtn = buttonContainer.createEl('button', {
            text: 'Import templates',
            cls: 'oom-button'
        });
        importBtn.addEventListener('click', () => {
            this.importTemplates();
        });

        // Individual template export (if templates exist)
        if (templates.length > 0) {
            const individualExportBtn = buttonContainer.createEl('button', {
                text: 'Export selected',
                cls: 'oom-button'
            });
            individualExportBtn.addEventListener('click', () => {
                this.showTemplateExportDialog();
            });
        }
        
        // Show existing templates count if any
        if (templates.length > 0) {
            const statusEl = containerEl.createDiv({ cls: 'oom-template-status' });
            statusEl.createEl('p', { 
                text: `Currently configured: ${templates.length} template${templates.length === 1 ? '' : 's'}`,
                cls: 'oom-status-text'
            });
            
            // List template names
            const namesList = templates.map(t => t.name).join(', ');
            statusEl.createEl('p', { 
                text: `Templates: ${namesList}`,
                cls: 'oom-template-names'
            });
        } else {
            containerEl.createEl('p', { 
                text: 'No templates configured yet. Use the Template Wizard to create your first template.',
                cls: 'oom-empty-state'
            });
        }
    }
    
    /**
     * Enter wizard mode
     */
    private enterWizardMode() {
        this.journalStructureMode = 'wizard';
        this.wizardState = {
            method: null,
            templaterFile: '',
            structure: null,
            content: '',
            templateName: '',
            templateDescription: '',
            isValid: false,
            currentStep: 1
        };
        
        // Re-render the Journal Structure content in wizard mode
        this.loadJournalStructureContent();
    }
    
    /**
     * Exit wizard mode and return to normal view
     */
    private exitWizardMode() {
        this.journalStructureMode = 'normal';
        this.wizardState = null;
        this.wizardStepContainers = [];
        this.wizardNavigationEl = null;
        this.wizardPreviewEl = null;
        
        // Clear wizard components
        this.methodRadios = [];
        this.templaterDropdown = null;
        this.structureDropdown = null;
        this.contentArea = null;
        this.nameInput = null;
        this.descInput = null;
        
        // Re-render the Journal Structure content in normal mode
        this.loadJournalStructureContent();
    }
    
    /**
     * Get total steps for wizard based on selected method
     */
    private getWizardTotalSteps(): number {
        if (!this.wizardState?.method) return 2;
        
        switch (this.wizardState.method) {
            case 'templater':
                return 2; // Method selection ? Template selection (with preview)
            case 'structure':
                return 3; // Method selection ? Structure selection ? Final preview
            case 'direct':
                return 2; // Method selection ? Content editing (with preview)
            default:
                return 2;
        }
    }
    
    /**
     * Build a specific wizard step
     */
    private buildWizardStep(step: number) {
        if (step === 1) {
            this.buildWizardStep1();
        } else if (step === 2) {
            this.buildWizardStep2();
        } else if (step === 3) {
            this.buildWizardStep3();
        }
    }
    
    /**
     * Build wizard step 1: Method selection
     */
    private buildWizardStep1() {
        const container = this.wizardStepContainers[0];
        container.empty();
        
        container.createEl('h3', { text: 'Choose Template Creation Method' });
        container.createEl('p', { 
            text: 'Select how you would like to create your journal template.' 
        });
        
        // Clear previous method radios
        this.methodRadios = [];
        
        // Method selection container
        const methodsContainer = container.createDiv({ cls: 'oom-template-methods' });
        
        // Check if Templater is available - fix the detection logic
        const templaterEnabled = !!(this.plugin.templaterIntegration?.isTemplaterInstalled?.());
        let templaterTemplates: string[] = [];
        if (templaterEnabled) {
            templaterTemplates = this.plugin.templaterIntegration?.getTemplaterTemplates?.() || [];
        }
        
        // Option 1: Templater
        const templaterOption = methodsContainer.createDiv({ cls: 'oom-method-option' });
        const templaterRadio = templaterOption.createEl('input', {
            type: 'radio',
            attr: { 
                name: 'creation-method',
                value: 'templater',
                id: 'method-templater'
            }
        });
        
        if (!templaterEnabled || templaterTemplates.length === 0) {
            templaterRadio.disabled = true;
            templaterOption.addClass('oom-method-disabled');
        }
        
        this.methodRadios.push(templaterRadio);
        
        const templaterLabel = templaterOption.createEl('label', {
            attr: { for: 'method-templater' },
            cls: 'oom-method-label'
        });
        templaterLabel.createEl('strong', { text: 'Use Templater Template' });
        templaterLabel.createEl('br');
        
        if (templaterEnabled && templaterTemplates.length > 0) {
            templaterLabel.createEl('span', { 
                text: `Select an existing Templater template for dynamic content generation (${templaterTemplates.length} available)`,
                cls: 'oom-method-description'
            });
        } else if (!templaterEnabled) {
            templaterLabel.createEl('span', { 
                text: 'Templater plugin not found. Install and enable Templater to use this option.',
                cls: 'oom-method-description oom-method-disabled-text'
            });
        } else {
            templaterLabel.createEl('span', { 
                text: 'No Templater templates found. Create some templates in your Templater folder first.',
                cls: 'oom-method-description oom-method-disabled-text'
            });
        }
        
        // Option 2: Structure
        const structureOption = methodsContainer.createDiv({ cls: 'oom-method-option' });
        const structureRadio = structureOption.createEl('input', {
            type: 'radio',
            attr: { 
                name: 'creation-method',
                value: 'structure',
                id: 'method-structure'
            }
        });
        this.methodRadios.push(structureRadio);
        
        const structureLabel = structureOption.createEl('label', {
            attr: { for: 'method-structure' },
            cls: 'oom-method-label'
        });
        structureLabel.createEl('strong', { text: 'Use Journal Structure' });
        structureLabel.createEl('br');
        structureLabel.createEl('span', { 
            text: 'Create a template based on predefined journal structure patterns with nested callouts',
            cls: 'oom-method-description'
        });
        
        // Option 3: Direct Input
        const directOption = methodsContainer.createDiv({ cls: 'oom-method-option' });
        const directRadio = directOption.createEl('input', {
            type: 'radio',
            attr: { 
                name: 'creation-method',
                value: 'direct',
                id: 'method-direct'
            }
        });
        this.methodRadios.push(directRadio);
        
        const directLabel = directOption.createEl('label', {
            attr: { for: 'method-direct' },
            cls: 'oom-method-label'
        });
        directLabel.createEl('strong', { text: 'Direct Input' });
        directLabel.createEl('br');
        directLabel.createEl('span', { 
            text: 'Manually write your template content from scratch with full control',
            cls: 'oom-method-description'
        });
        
        // Add event handlers for radio buttons
        this.methodRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.wizardState!.method = radio.value as TemplateCreationMethod;
                    
                    // Clear previous content when method changes
                    this.wizardState!.content = '';
                    this.wizardState!.templaterFile = '';
                    this.wizardState!.structure = null;
                    
                    // For structure method, set default content immediately
                    if (this.wizardState!.method === 'structure') {
                        this.wizardState!.structure = {
                            id: 'default-nested',
                            name: 'Default Nested Structure',
                            description: 'A nested structure with journal entry, dream diary, and metrics callouts',
                            type: 'nested',
                            rootCallout: 'journal-entry',
                            childCallouts: ['dream-diary'],
                            metricsCallout: 'dream-metrics',
                            dateFormat: ['YYYY-MM-DD'],
                            requiredFields: ['content'],
                            optionalFields: ['tags', 'mood']
                        };
                        this.wizardState!.content = this.generateContentFromStructure(this.wizardState!.structure);
                    }
                    
                    this.validateWizardState();
                    this.updateWizardPreview();
                }
            });
        });
        
        // Set Structure as default selection if no method is chosen
        if (!this.wizardState!.method) {
            structureRadio.checked = true;
            this.wizardState!.method = 'structure';
        } else {
            // Restore previous selection
            const selectedRadio = this.methodRadios.find(r => r.value === this.wizardState!.method);
            if (selectedRadio && !selectedRadio.disabled) {
                selectedRadio.checked = true;
            }
        }
        
        this.validateWizardState();
    }
    
    /**
     * Build wizard step 2: Structure/content selection
     */
    private buildWizardStep2() {
        const container = this.wizardStepContainers[1];
        container.empty();
        
        if (this.wizardState!.method === 'templater') {
            container.createEl('h3', { text: 'Configure Templater Template' });
            container.createEl('p', { 
                text: 'Choose an existing Templater template to associate with a journal structure, and review configuration details.' 
            });
            
            // Add Templater Configuration section here (moved from main template creation section)
            const templaterConfigSection = container.createDiv({ cls: 'oom-templater-config-section' });
            templaterConfigSection.createEl('h4', { text: 'Templater Status' });
            
            const templaterEnabled = !!(this.plugin.templaterIntegration?.isTemplaterInstalled?.());
            let templaterTemplates: string[] = [];
            let templaterTemplateFolder = '';
            
            if (templaterEnabled) {
                // Get the Templater plugin instance to check its settings
                try {
                    const templaterPlugin = (this.plugin.app as AppWithSettings).plugins?.plugins?.['templater-obsidian'];
                    if (templaterPlugin) {
                        templaterTemplateFolder = templaterPlugin.settings?.templates_folder || 'Not configured';
                        templaterTemplates = this.plugin.templaterIntegration?.getTemplaterTemplates?.() || [];
                    }
                } catch (error) {
                    templaterTemplateFolder = 'Error accessing settings';
                }
            }
            
            // Status display (simplified for wizard context)
            const statusEl = templaterConfigSection.createDiv({ cls: 'oom-templater-status' });
            
            if (templaterEnabled) {
                statusEl.createEl('p', { 
                    text: `? Templater plugin detected | ?? Folder: ${templaterTemplateFolder} | ?? Templates: ${templaterTemplates.length}`,
                    cls: 'oom-status-success'
                });
                
                if (templaterTemplates.length === 0) {
                    statusEl.createEl('p', { 
                        text: '?? No .md files found in template folder.',
                        cls: 'oom-status-warning'
                    });
                }
            } else {
                statusEl.createEl('p', { 
                    text: '? Templater plugin not found',
                    cls: 'oom-status-error'
                });
            }
            
            // Apply CSS class instead of inline styling
            templaterConfigSection.addClass('oom-templater-config-section');
            
            // Template selection
            if (templaterTemplates.length > 0) {
                new Setting(container)
                    .setName('Templater Template')
                    .setDesc('Select from your available Templater templates')
                    .addDropdown(dropdown => {
                        this.templaterDropdown = dropdown;
                        dropdown.addOption('', 'Select a template...');
                        
                        templaterTemplates.forEach(template => {
                            dropdown.addOption(template, template);
                        });
                        
                        dropdown.setValue(this.wizardState!.templaterFile || '');
                        dropdown.onChange(async (value) => {
                            this.wizardState!.templaterFile = value;
                            if (value) {
                                // Don't auto-generate template name - let user decide
                                // this.wizardState!.templateName = this.generateTemplateNameFromFile(value);
                                
                                // Load template content for preview
                                try {
                                    const templateContent = await this.loadTemplaterTemplateContent(value);
                                    this.wizardState!.content = templateContent;
                                } catch (error) {
                                    this.wizardState!.content = `Error loading template: ${error.message}`;
                                }
                            } else {
                                this.wizardState!.content = '';
                            }
                            this.validateWizardState();
                            this.updateWizardPreview();
                        });
                    });
                
                // Template name input for Templater templates
                new Setting(container)
                    .setName('Template Name')
                    .setDesc('Enter a name for this template')
                    .addText(text => {
                        this.nameInput = text;
                        text.setValue(this.wizardState!.templateName || '')
                            .setPlaceholder('Enter template name...')
                            .onChange(value => {
                                this.wizardState!.templateName = value;
                                this.validateWizardState();
                            });
                    });
            } else {
                container.createEl('p', { 
                    text: 'No Templater templates found. Please create some Templater templates first.',
                    cls: 'oom-placeholder-text'
                });
            }
            
        } else if (this.wizardState!.method === 'structure') {
            container.createEl('h3', { text: 'Select Journal Structure' });
            container.createEl('p', { 
                text: 'Choose a journal structure to base your template on.' 
            });
            
            // Get available structures (for now, we'll define some default ones)
            const availableStructures = this.getAvailableStructures();
            
            new Setting(container)
                .setName('Journal Structure')
                .setDesc('Select the organizational pattern for your template')
                .addDropdown(dropdown => {
                    this.structureDropdown = dropdown;
                    dropdown.addOption('', 'Select a structure...');
                    
                    availableStructures.forEach(structure => {
                        dropdown.addOption(structure.id, `${structure.name} - ${structure.description}`);
                    });
                    
                    // Set current value if any
                    dropdown.setValue(this.wizardState!.structure?.id || '');
                    dropdown.onChange(value => {
                        if (value) {
                            this.wizardState!.structure = availableStructures.find(s => s.id === value) || null;
                            if (this.wizardState!.structure) {
                                // Generate content from selected structure
                                this.wizardState!.content = this.generateContentFromStructure(this.wizardState!.structure);
                            }
                        } else {
                            this.wizardState!.structure = null;
                            this.wizardState!.content = '';
                        }
                        this.validateWizardState();
                        this.updateWizardPreview();
                    });
                });
            
            // Set default structure if none selected
            if (!this.wizardState!.structure && availableStructures.length > 0) {
                this.wizardState!.structure = availableStructures[0];
                this.wizardState!.content = this.generateContentFromStructure(this.wizardState!.structure);
                if (this.structureDropdown) {
                    this.structureDropdown.setValue(this.wizardState!.structure.id);
                }
            }
        } else if (this.wizardState!.method === 'direct') {
            container.createEl('h3', { text: 'Create Template Content' });
            container.createEl('p', { 
                text: 'Write your template content directly. You can use markdown and callout syntax.' 
            });
            
            // Template name input
            new Setting(container)
                .setName('Template Name')
                .setDesc('Enter a name for this template')
                .addText(text => {
                    this.nameInput = text;
                    text.setValue(this.wizardState!.templateName || '')
                        .setPlaceholder('Enter template name...')
                        .onChange(value => {
                            this.wizardState!.templateName = value;
                            this.validateWizardState();
                        });
                });
            
            // Content input - make this more prominent
            const contentSetting = new Setting(container)
                .setName('Template Content')
                .setDesc('Enter the markdown content for your template. Use callouts like > [!journal-entry] for structure.');
            
            // Create a dedicated container for the textarea to give it more space
            const textareaContainer = contentSetting.settingEl.createDiv({ cls: 'oom-direct-input-container' });
            
            const textarea = textareaContainer.createEl('textarea', {
                cls: 'oom-wizard-textarea',
                attr: {
                    placeholder: `Enter your template content here...

Example:
# Dream Journal Entry

> [!journal-entry]
> Enter your dream here.
>
> > [!dream-diary]
> > Describe your dream experience.
> >
> > > [!dream-metrics]
> > > Sensory Detail: 1-5
> > > Emotional Recall: 1-5
> > > Lost Segments: 0-10
> > > Descriptiveness: 1-5
> > > Confidence Score: 1-5`
                }
            });
            
            // Set initial value - this was missing proper restoration for editing!
            textarea.value = this.wizardState!.content || '';
            
            this.logger?.debug('HubModal', 'Direct Input - Setting textarea content', { contentPreview: this.wizardState!.content?.substring(0, 100) });
            
            // Add event handler
            textarea.addEventListener('input', () => {
                this.wizardState!.content = textarea.value;
                this.validateWizardState();
                this.updateWizardPreview();
            });
            
            // Store reference for later use
            this.contentArea = {
                setValue: (value: string) => {
                    textarea.value = value;
                },
                getValue: () => textarea.value,
                inputEl: textarea
            } as TextAreaComponent;
            
            // Helper buttons - replace simple button with dropdown
            const helpersContainer = container.createDiv({ cls: 'oom-content-helpers' });
            helpersContainer.classList.add('oom-helpers-container');
            
            
            
            // Create dropdown for sample content
            const sampleDropdownContainer = helpersContainer.createDiv({ cls: 'oom-sample-dropdown-container' });
            sampleDropdownContainer.classList.add('oom-sample-dropdown-container');
            
            
            const sampleDropdownBtn = sampleDropdownContainer.createEl('button', {
                text: 'Insert Sample Content ?',
                cls: 'oom-helper-button oom-sample-dropdown-button'
            });
            sampleDropdownBtn.classList.add('oom-sample-dropdown-btn');
            
            
            const sampleDropdownMenu = sampleDropdownContainer.createDiv({ cls: 'oom-sample-dropdown-menu' });
            sampleDropdownMenu.classList.add('oom-hidden');
            sampleDropdownMenu.classList.add('oom-sample-dropdown-menu');
            
            
            
            
            
            
            
            
            
            // Flat sample option
            const flatOption = sampleDropdownMenu.createDiv({ cls: 'oom-sample-option' });
            flatOption.classList.add('oom-dropdown-option');
            
            
            flatOption.textContent = 'Insert Sample (Flat)';
            
            flatOption.addEventListener('click', () => {
                const flatSampleContent = `# Dream Journal Entry

> [!journal-entry]
> Enter your dream here.

> [!dream-diary]  
> Describe your dream experience.

> [!dream-metrics]
> Sensory Detail: 1-5
> Emotional Recall: 1-5
> Lost Segments: 0-10
> Descriptiveness: 1-5
> Confidence Score: 1-5`;
                
                textarea.value = flatSampleContent;
                this.wizardState!.content = flatSampleContent;
                this.validateWizardState();
                this.updateWizardPreview();
                sampleDropdownMenu.classList.add('oom-hidden');
            });
            
            // Nested sample option
            const nestedOption = sampleDropdownMenu.createDiv({ cls: 'oom-sample-option' });
            nestedOption.classList.add('oom-dropdown-option');
            
            nestedOption.textContent = 'Insert Sample (Nested)';
            
            nestedOption.addEventListener('click', () => {
                const nestedSampleContent = `# Dream Journal Entry

> [!journal-entry]
> Enter your dream here.
>
> > [!dream-diary]
> > Describe your dream experience.
> >
> > > [!dream-metrics]
> > > Sensory Detail: 1-5
> > > Emotional Recall: 1-5
> > > Lost Segments: 0-10
> > > Descriptiveness: 1-5
> > > Confidence Score: 1-5`;
                
                textarea.value = nestedSampleContent;
                this.wizardState!.content = nestedSampleContent;
                this.validateWizardState();
                this.updateWizardPreview();
                sampleDropdownMenu.classList.add('oom-hidden');
            });
            
            // Hover effects
            flatOption.addEventListener('mouseenter', () => {
                flatOption.classList.add('oom-dropdown-option--hover');
            });
            flatOption.addEventListener('mouseleave', () => {
                flatOption.classList.remove('oom-dropdown-option--hover');
            });
            
            nestedOption.addEventListener('mouseenter', () => {
                nestedOption.classList.add('oom-dropdown-option--hover');
            });
            nestedOption.addEventListener('mouseleave', () => {
                nestedOption.classList.remove('oom-dropdown-option--hover');
            });
            
            // Toggle dropdown on button click
            let dropdownOpen = false;
            sampleDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownOpen = !dropdownOpen;
                sampleDropdownMenu.classList.toggle('oom-dropdown-show', dropdownOpen);
                sampleDropdownMenu.classList.toggle('oom-dropdown-hide', !dropdownOpen);
                sampleDropdownBtn.textContent = dropdownOpen ? 'Insert Sample Content ?' : 'Insert Sample Content ?';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                if (dropdownOpen) {
                    dropdownOpen = false;
                    sampleDropdownMenu.classList.add('oom-hidden');
                    sampleDropdownBtn.textContent = 'Insert Sample Content ?';
                }
            });
            
            const clearBtn = helpersContainer.createEl('button', {
                text: 'Clear',
                cls: 'oom-helper-button'
            });
            clearBtn.classList.add('oom-clear-btn');
            
            clearBtn.addEventListener('click', () => {
                textarea.value = '';
                this.wizardState!.content = '';
                this.validateWizardState();
                this.updateWizardPreview();
            });
        }
        
        this.validateWizardState();
        this.updateWizardPreview();
    }
    
    /**
     * Generate template name from file
     */
    private generateTemplateNameFromFile(filename: string): string {
        // Remove extension and convert to title case
        const name = filename.replace(/\.[^/.]+$/, '');
        return name.replace(/[-_]/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase()) + ' Template';
    }
    
    /**
     * Load Templater template content for preview
     */
    private async loadTemplaterTemplateContent(templatePath: string): Promise<string> {
        try {
            const file = this.app.vault.getAbstractFileByPath(templatePath);
            if (file instanceof TFile) {
                return await this.app.vault.read(file);
            } else {
                throw new Error(`Template file not found: ${templatePath}`);
            }
        } catch (error) {
            this.logger.error('TemplateWizard', 'Error loading Templater template content', { 
                templatePath, 
                error: error instanceof Error ? error.message : String(error) 
            });
            throw error;
        }
    }
    
    /**
     * Get available predefined structures for the wizard
     */
    private getAvailableStructures(): CalloutStructure[] {
        return [
            {
                id: 'nested-3-level',
                name: 'Nested (3-level)',
                description: 'Deep nested structure: journal-entry ? dream-diary ? dream-metrics',
                type: 'nested',
                rootCallout: 'journal-entry',
                childCallouts: ['dream-diary'],
                metricsCallout: 'dream-metrics',
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['content'],
                optionalFields: ['tags', 'mood']
            },
            {
                id: 'nested-2-level',
                name: 'Nested (2-level)',
                description: 'Simple nested structure: journal-entry ? dream-metrics',
                type: 'nested',
                rootCallout: 'journal-entry',
                childCallouts: [],
                metricsCallout: 'dream-metrics',
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['content'],
                optionalFields: ['tags']
            },
            {
                id: 'flat-structured',
                name: 'Flat Structure',
                description: 'Separate callouts: journal-entry, dream-diary, dream-metrics (no nesting)',
                type: 'flat',
                rootCallout: 'journal-entry',
                childCallouts: ['dream-diary'],
                metricsCallout: 'dream-metrics',
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['content'],
                optionalFields: ['tags', 'mood']
            },
            {
                id: 'simple-basic',
                name: 'Simple Basic',
                description: 'Just journal-entry with embedded dream-metrics',
                type: 'flat',
                rootCallout: 'journal-entry',
                childCallouts: [],
                metricsCallout: 'dream-metrics',
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['content'],
                optionalFields: []
            }
        ];
    }
    
    /**
     * Edit an existing template in the wizard
     */
    private editExistingTemplate(template: JournalTemplate) {
        safeLogger.debug('Template', 'Opening TemplateWizardModal for editing', {
            templateName: template.name,
            templateId: template.id,
            templateStructure: template.structure
        });
        
        // Open the new dedicated TemplateWizardModal for editing
        const wizardModal = new TemplateWizardModal(this.app, this.plugin, template);
        wizardModal.open();
    }
    
    /**
     * View template content in a notice or modal
     */
    private viewTemplateContent(template: JournalTemplate) {
        const content = template.content || 'No content available';
        const truncatedContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
        
        new Notice(`Template: ${template.name}\n\n${truncatedContent}`, 10000);
    }
    
    /**
     * Delete a template with confirmation
     */
    private async deleteTemplate(template: JournalTemplate) {
        const confirmDelete = confirm(`Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`);
        
        if (confirmDelete) {
            try {
                // Remove template from settings
                if (this.plugin.settings.linting?.templates) {
                    const templateIndex = this.plugin.settings.linting.templates.findIndex(t => t.id === template.id);
                    if (templateIndex >= 0) {
                        this.plugin.settings.linting.templates.splice(templateIndex, 1);
                        await this.plugin.saveSettings();
                        
                        new Notice(`Template "${template.name}" deleted successfully.`);
                        
                        // Refresh the view to show updated template list
                        this.loadJournalStructureContent();
                    } else {
                        new Notice(`Template "${template.name}" not found.`);
                    }
                } else {
                    new Notice('No templates found to delete.');
                }
            } catch (error) {
                this.logger.error('TemplateManagement', 'Error deleting template', { templateId: template.id, error });
                new Notice(`Error deleting template: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    
    /**
     * Build wizard step 3: Final preview
     */
    private buildWizardStep3() {
        const container = this.wizardStepContainers[2];
        container.empty();
        
        container.createEl('h3', { text: 'Template Preview' });
        container.createEl('p', { 
            text: 'Review your template and provide a name before saving.' 
        });
        
        // Generate content if not already set
        if (!this.wizardState!.content && this.wizardState!.structure) {
            this.wizardState!.content = this.generateContentFromStructure(this.wizardState!.structure);
        }
        
        // Template name input
        new Setting(container)
            .setName('Template Name')
            .setDesc('Enter a name for this template')
            .addText(text => {
                this.nameInput = text;
                text.setValue(this.wizardState!.templateName || 'New Template')
                    .onChange(value => {
                        this.wizardState!.templateName = value;
                        this.validateWizardState();
                    });
            });
        
        this.validateWizardState();
    }
    
    /**
     * Create wizard preview section
     */
    private createWizardPreviewSection(container: HTMLElement) {
        const previewSection = container.createDiv({ cls: 'oom-wizard-preview-section' });
        
        const previewHeader = previewSection.createDiv({ cls: 'oom-preview-header' });
        const collapseButton = previewHeader.createEl('button', {
            text: '? Preview',
            cls: 'oom-preview-collapse-button'
        });
        
        this.wizardPreviewEl = previewSection.createDiv({ cls: 'oom-wizard-preview-content' });
        
        let isCollapsed = false;
        collapseButton.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            this.wizardPreviewEl!.classList.toggle('oom-display-none', isCollapsed);
            this.wizardPreviewEl!.classList.toggle('oom-display-block', !isCollapsed);
            collapseButton.textContent = isCollapsed ? '? Preview' : '? Preview';
        });
    }
    
    /**
     * Update wizard navigation
     */
    private updateWizardNavigation() {
        if (!this.wizardNavigationEl) return;
        
        this.wizardNavigationEl.empty();
        
        // Create a flex container to hold buttons and step indicator on the same row
        const navContainer = this.wizardNavigationEl.createDiv({ cls: 'oom-nav-container' });
        
        const buttonContainer = navContainer.createDiv({ cls: 'oom-button-container' });
        
        // Back button (if not on first step)
        if (this.wizardState!.currentStep > 1) {
            new ButtonComponent(buttonContainer)
                .setButtonText('Back')
                .onClick(() => {
                    this.navigateToWizardStep(this.wizardState!.currentStep - 1);
                });
        }
        
        // Next/Finish button
        const isLastStep = this.wizardState!.currentStep === this.getWizardTotalSteps();
        const nextButton = new ButtonComponent(buttonContainer)
            .setButtonText(isLastStep ? 'Finish' : 'Next')
            .setCta();
            
        // Enable/disable based on validation
        if (!this.wizardState!.isValid) {
            nextButton.setDisabled(true);
        }
        
        nextButton.onClick(() => {
            if (isLastStep) {
                this.finishWizard();
            } else {
                this.navigateToWizardStep(this.wizardState!.currentStep + 1);
            }
        });
        
        // Cancel button
        new ButtonComponent(buttonContainer)
            .setButtonText('Cancel')
            .onClick(() => {
                this.exitWizardMode();
            });
        
        // Step indicator - now in the same row, right-aligned
        const stepIndicator = navContainer.createEl('div', { 
            text: `Step ${this.wizardState!.currentStep} of ${this.getWizardTotalSteps()}`,
            cls: 'oom-step-indicator'
        });
    }
    
    /**
     * Navigate to a specific wizard step
     */
    private navigateToWizardStep(step: number) {
        if (!this.wizardState || step < 1 || step > this.getWizardTotalSteps()) {
            return;
        }
        
        // Hide current step
        if (this.wizardStepContainers[this.wizardState.currentStep - 1]) {
            this.wizardStepContainers[this.wizardState.currentStep - 1].classList.add('oom-hidden');
        }
        
        // Update current step
        this.wizardState.currentStep = step;
        
        // Update the header title with new step number
        const headerTitle = this.contentContainer.querySelector('h2');
        if (headerTitle) {
            const totalSteps = this.getWizardTotalSteps();
            headerTitle.textContent = `Journal Structure - Template Wizard (Step ${step} of ${totalSteps})`;
        }
        
        // Also update the breadcrumb if template name changed
        const breadcrumbText = this.contentContainer.querySelector('.oom-wizard-breadcrumb-text');
        if (breadcrumbText) {
            const templateName = this.wizardState.templateName || 'New Template';
            breadcrumbText.textContent = ` | Creating: ${templateName}`;
        }
        
        // Build and show new step
        this.buildWizardStep(step);
        if (this.wizardStepContainers[step - 1]) {
            this.wizardStepContainers[step - 1].classList.add('oom-wizard-step--visible');
        }
        
        // Update navigation and preview
        this.updateWizardNavigation();
        this.updateWizardPreview();
    }
    
    /**
     * Update wizard preview
     */
    private updateWizardPreview() {
        if (!this.wizardPreviewEl || !this.wizardState) return;
        
        this.wizardPreviewEl.empty();
        
        if (this.wizardState.content) {
            // Check if this is a Templater template
            const isTemplaterTemplate = this.wizardState.method === 'templater' && this.wizardState.templaterFile;
            const hasTemplaterSyntax = this.plugin.templaterIntegration?.hasTemplaterSyntax?.(this.wizardState.content);
            
            if (isTemplaterTemplate && hasTemplaterSyntax) {
                // Show both original and static versions for Templater templates
                this.wizardPreviewEl.createEl('h4', { 
                    text: 'Template Preview (Dynamic Templater Version)',
                    cls: 'oom-preview-section-header'
                });
                
                const templaterPreview = this.wizardPreviewEl.createEl('pre', { 
                    cls: 'oom-markdown-preview oom-templater-preview oom-journal-structure-preview',
                    text: this.wizardState.content
                });
                
                // Show static fallback version
                this.wizardPreviewEl.createEl('h4', { 
                    text: 'Static Fallback Version (when Templater unavailable)',
                    cls: 'oom-preview-section-header'
                });
                
                const staticContent = this.plugin.templaterIntegration?.convertToStaticTemplate?.(this.wizardState.content) || this.wizardState.content;
                const staticPreview = this.wizardPreviewEl.createEl('pre', { 
                    cls: 'oom-markdown-preview oom-static-preview oom-journal-structure-preview',
                    text: staticContent
                });
                
                // Add explanation
                const explanation = this.wizardPreviewEl.createEl('div', { cls: 'oom-templater-explanation' });
                // SECURITY FIX: Use safe DOM manipulation instead of innerHTML
                TemplateHelpers.createTemplaterExplanation(explanation);
                explanation.classList.add('oom-explanation');
                
                
                
                
                
            } else {
                // Regular preview for non-Templater content
                this.wizardPreviewEl.createEl('h4', { 
                    text: 'Template Preview',
                    cls: 'oom-preview-section-header'
                });
                
                const previewContent = this.wizardPreviewEl.createEl('pre', { 
                    cls: 'oom-markdown-preview oom-journal-structure-preview',
                    text: this.wizardState.content
                });
            }
        } else {
            this.wizardPreviewEl.createEl('p', { 
                text: 'No preview available yet.',
                cls: 'oom-preview-empty'
            });
        }
    }
    
    /**
     * Validate wizard state
     */
    private validateWizardState() {
        if (!this.wizardState) return;
        
        let isValid = false;
        
        switch (this.wizardState.method) {
            case 'templater':
                if (this.wizardState.currentStep === 1) {
                    isValid = !!this.wizardState.method;
                } else {
                    isValid = !!(this.wizardState.templaterFile && this.wizardState.templateName);
                }
                break;
            case 'structure':
                if (this.wizardState.currentStep === 1) {
                    isValid = !!this.wizardState.method;
                } else if (this.wizardState.currentStep === 2) {
                    isValid = !!this.wizardState.structure;
                } else if (this.wizardState.currentStep === 3) {
                    isValid = !!(this.wizardState.structure && this.wizardState.templateName);
                }
                break;
            case 'direct':
                if (this.wizardState.currentStep === 1) {
                    isValid = !!this.wizardState.method;
                } else {
                    isValid = !!(this.wizardState.templateName && this.wizardState.content);
                }
                break;
            default:
                isValid = false;
        }
        
        this.wizardState.isValid = isValid;
        this.updateWizardNavigation();
    }
    
    /**
     * Generate content from structure
     */
    private generateContentFromStructure(structure: CalloutStructure): string {
        let content = `# Dream Journal Entry\n\n`;
        
        if (structure.type === 'nested') {
            // For nested structures
            content += `> [!${structure.rootCallout}]\n> Enter your dream here.\n>\n`;
            
            if (structure.childCallouts.length > 0) {
                // Add child callouts as nested (2-level nesting)
                for (const callout of structure.childCallouts) {
                    content += `> > [!${callout}]\n`;
                    content += `> > Dream content goes here.\n`;
                    
                    // Add metrics callout nested inside this child callout (3-level nesting)
                    if (structure.metricsCallout) {
                        content += `> >\n> > > [!${structure.metricsCallout}]\n`;
                        content += `> > > Sensory Detail: 1-5\n`;
                        content += `> > > Emotional Recall: 1-5\n`;
                        content += `> > > Lost Segments: 0-10\n`;
                        content += `> > > Descriptiveness: 1-5\n`;
                        content += `> > > Confidence Score: 1-5\n`;
                    }
                    content += `>\n`;
                }
            } else {
                // If no child callouts, add metrics directly nested under root (3-level nesting to match user templates)
                if (structure.metricsCallout) {
                    content += `>\n> > > [!${structure.metricsCallout}]\n`;
                    content += `> > > Sensory Detail: 1-5\n`;
                    content += `> > > Emotional Recall: 1-5\n`;
                    content += `> > > Lost Segments: 0-10\n`;
                    content += `> > > Descriptiveness: 1-5\n`;
                    content += `> > > Confidence Score: 1-5\n`;
                }
            }
        } else {
            // For flat structures
            content += `> [!${structure.rootCallout}]\n> Enter your dream here.\n\n`;
            
            // Add child callouts as separate
            for (const callout of structure.childCallouts) {
                if (callout === structure.metricsCallout) continue;
                content += `> [!${callout}]\n> Dream content goes here.\n\n`;
            }
            
            // Add metrics callout last
            if (structure.metricsCallout) {
                content += `> [!${structure.metricsCallout}]\n`;
                content += `> Sensory Detail: 1-5\n`;
                content += `> Emotional Recall: 1-5\n`;
                content += `> Lost Segments: 0-10\n`;
                content += `> Descriptiveness: 1-5\n`;
                content += `> Confidence Score: 1-5\n`;
            }
        }
        
        return content;
    }
    
    /**
     * Finish wizard and save template
     */
    private finishWizard() {
        if (!this.wizardState || !this.wizardState.isValid) return;
        
        const template: JournalTemplate = {
            id: this.wizardState.editingTemplateId || `template-${Date.now()}`, // Use existing ID when editing
            name: this.wizardState.templateName,
            description: this.wizardState.templateDescription,
            content: this.wizardState.content,
            structure: this.wizardState.structure?.id || '', // This was the bug - ensure structure ID is properly set
            isTemplaterTemplate: this.wizardState.method === 'templater',
            templaterFile: this.wizardState.templaterFile || ''
        };
        
        safeLogger.debug('Template', 'Saving template', { 
            structureId: template.structure,
            templateData: template 
        });
        
        this.saveTemplate(template);
    }
    
    /**
     * Save template to settings
     */
    private async saveTemplate(template: JournalTemplate) {
        try {
            // Ensure linting settings exist
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = {
                    enabled: false,
                    rules: [],
                    structures: [],
                    templates: [],
                    templaterIntegration: {
                        enabled: false,
                        folderPath: '',
                        defaultTemplate: ''
                    },
                    contentIsolation: {
                        ignoreImages: false,
                        ignoreLinks: false,
                        ignoreFormatting: false,
                        ignoreHeadings: false,
                        ignoreCodeBlocks: false,
                        ignoreFrontmatter: false,
                        ignoreComments: false,
                        customIgnorePatterns: []
                    },
                    userInterface: {
                        showInlineValidation: false,
                        severityIndicators: {
                            error: '?',
                            warning: '??',
                            info: '??'
                        },
                        quickFixesEnabled: false
                    }
                };
            }
            
            // Check if we're editing an existing template
            if (this.wizardState?.editingTemplateId) {
                // Update existing template
                const templateIndex = this.plugin.settings.linting.templates.findIndex(t => t.id === template.id);
                if (templateIndex >= 0) {
                    this.plugin.settings.linting.templates[templateIndex] = template;
                    new Notice(`Template "${template.name}" updated successfully!`);
                } else {
                    // Template not found, add as new (fallback)
                    this.plugin.settings.linting.templates.push(template);
                    new Notice(`Template "${template.name}" created successfully!`);
                }
            } else {
                // Add new template
                this.plugin.settings.linting.templates.push(template);
                new Notice(`Template "${template.name}" created successfully!`);
            }
            
            // Save settings
            await this.plugin.saveSettings();
            
            // Exit wizard mode and return to overview
            this.exitWizardMode();
            
        } catch (error) {
            safeLogger.error('UI', 'Error saving template', error as Error);
            new Notice('Error saving template. Please try again.');
        }
    }
    
    // Load Content Analysis content
    private loadContentAnalysisContent() {
        this.contentContainer.empty();
        
        // Add title and description
        
        this.contentContainer.createEl('p', { 
            text: 'Analyze your content patterns, validate templates, and manage structure migrations.',
            cls: 'oom-hub-content-description' 
        });

        // Template Validation Section
        const templateValidationSection = this.contentContainer.createDiv({ 
            cls: 'oom-hub-section' 
        });
        
        templateValidationSection.createEl('h3', { 
            text: 'Template Validation',
            cls: 'oom-hub-section-title' 
        });
        
        templateValidationSection.createEl('p', { 
            text: 'Validate your Hub templates against structure patterns and check for common issues.',
            cls: 'oom-hub-section-description' 
        });

        // Template list container
        const templateList = templateValidationSection.createDiv({ 
            cls: 'oom-template-validation-list' 
        });

        // Get available templates
        const templates = this.plugin.settings.linting?.templates || [];
        
        if (templates.length === 0) {
            templateList.createEl('p', { 
                text: 'No templates found. Create templates in the Journal Structure tab first.',
                cls: 'oom-hub-empty-state' 
            });
        } else {
            templates.forEach(template => {
                const templateItem = templateList.createDiv({ 
                    cls: 'oom-template-validation-item' 
                });
                
                // Template info
                const templateInfo = templateItem.createDiv({ 
                    cls: 'oom-template-info' 
                });
                
                templateInfo.createEl('strong', { text: template.name });
                templateInfo.createEl('span', { 
                    text: ` (${template.structure})`,
                    cls: 'oom-template-structure' 
                });
                
                // Validate button
                const validateButton = templateItem.createEl('button', {
                    text: 'Validate',
                    cls: 'mod-cta oom-validate-template-btn'
                });
                
                validateButton.addEventListener('click', () => {
                    this.validateTemplate(template, templateItem);
                });
            });
        }

        // Content Pattern Analysis Section  
        const patternAnalysisSection = this.contentContainer.createDiv({ 
            cls: 'oom-hub-section' 
        });
        
        patternAnalysisSection.createEl('h3', { 
            text: 'Content Pattern Analysis',
            cls: 'oom-hub-section-title' 
        });
        
        patternAnalysisSection.createEl('p', { 
            text: 'Analyze your existing notes to discover patterns and suggest optimal structures.',
            cls: 'oom-hub-section-description' 
        });

        // Analysis targets container
        const analysisTargets = patternAnalysisSection.createDiv({ 
            cls: 'oom-analysis-targets' 
        });

        // Add target buttons
        const addTargetButtons = analysisTargets.createDiv({ 
            cls: 'oom-add-target-buttons' 
        });

        const addFolderBtn = addTargetButtons.createEl('button', {
            text: 'Add Folder',
            cls: 'mod-cta'
        });

        const addNotesBtn = addTargetButtons.createEl('button', {
            text: 'Add Notes',
            cls: 'mod-cta'
        });

        // Selected targets list
        const targetsList = analysisTargets.createDiv({ 
            cls: 'oom-targets-list' 
        });

        const emptyState = targetsList.createDiv({ 
            cls: 'oom-hub-empty-state',
            text: 'No analysis targets selected. Add folders or notes to analyze.'
        });

        // Analyze button (initially disabled)
        const analyzeButton = analysisTargets.createEl('button', {
            text: 'Analyze Selected Content',
            cls: 'mod-cta oom-analyze-btn'
        });
        analyzeButton.disabled = true;

        // Event listeners for target selection
        addFolderBtn.addEventListener('click', () => {
            this.showFolderSelectionDialog(targetsList, emptyState);
        });

        addNotesBtn.addEventListener('click', () => {
            this.showNoteSelectionDialog(targetsList, emptyState);
        });

        analyzeButton.addEventListener('click', () => {
            this.analyzeSelectedContent();
        });

        // Migration Tools Section (Placeholder)
        const migrationSection = this.contentContainer.createDiv({ 
            cls: 'oom-hub-section' 
        });
        
        migrationSection.createEl('h3', { 
            text: 'Migration Tools',
            cls: 'oom-hub-section-title' 
        });
        
        migrationSection.createEl('p', { 
            text: 'Tools for migrating content between different callout structures (coming soon).',
            cls: 'oom-hub-section-description' 
        });

        const placeholderContent = migrationSection.createDiv({ 
            cls: 'oom-hub-placeholder' 
        });
        
        placeholderContent.createEl('p', { 
            text: '?? Migration tools will be available in a future update.',
            cls: 'oom-hub-placeholder-text' 
        });

        // Missing Metrics Section
        // Import DEFAULT_METRICS from types/core
        const { DEFAULT_METRICS } = require('../../types/core');
        
        const missingMetrics = DEFAULT_METRICS
            .filter(defaultMetric => 
                !this.plugin.settings.metrics[defaultMetric.name]
            )
            .map(m => m.name);
        
        if (missingMetrics.length > 0) {
            // Create Missing Metrics Section
            const missingMetricsSection = this.contentContainer.createDiv({ 
                cls: 'oom-hub-section oom-missing-metrics-section' 
            });
            
            missingMetricsSection.createEl('h3', { 
                text: 'Missing Metrics',
                cls: 'oom-hub-section-title' 
            });
            
            missingMetricsSection.createEl('p', { 
                text: `Found ${missingMetrics.length} default metrics missing from your settings. Would you like to restore them?`,
                cls: 'oom-hub-section-description' 
            });

            // Create button container
            const buttonContainer = missingMetricsSection.createDiv({
                cls: 'oom-missing-metrics-buttons'
            });
            
            // Restore All button
            const restoreAllButton = buttonContainer.createEl('button', {
                text: 'Restore All Metrics',
                cls: 'mod-cta oom-restore-all-btn'
            });
            
            restoreAllButton.addEventListener('click', async () => {
                // Loop through all missing metrics and restore them
                const metricsToRestore = DEFAULT_METRICS.filter(defaultMetric => 
                    !this.plugin.settings.metrics[defaultMetric.name]
                );
                
                for (const metricToRestore of metricsToRestore) {
                    const metricName = metricToRestore.name;
                    
                    // Create a new metric from the default
                    this.plugin.settings.metrics[metricName] = {
                        name: metricName,
                        icon: metricToRestore.icon,
                        minValue: metricToRestore.minValue,
                        maxValue: metricToRestore.maxValue,
                        description: metricToRestore.description || '',
                        enabled: metricToRestore.enabled,
                        category: metricToRestore.category || 'dream',
                        type: metricToRestore.type || 'number',
                        format: metricToRestore.format || 'number',
                        options: metricToRestore.options || [],
                        // Include legacy properties for backward compatibility
                        min: metricToRestore.minValue,
                        max: metricToRestore.maxValue,
                        step: 1
                    };
                }
                
                // Save settings and refresh UI
                await this.plugin.saveSettings();
                this.loadMetricsSettingsContent(); // Refresh the content
                new Notice(`Restored ${metricsToRestore.length} missing metrics`);
            });
            
            // Create Manually button
            const createManuallyButton = buttonContainer.createEl('button', {
                text: 'Create Manually',
                cls: 'mod-warning oom-create-manually-btn'
            });
            
            createManuallyButton.addEventListener('click', async () => {
                // Handle manual creation of missing metrics - just create an empty metric for each
                const metricsToCreate = DEFAULT_METRICS.filter(defaultMetric => 
                    !this.plugin.settings.metrics[defaultMetric.name]
                );
                
                for (const metricToCreate of metricsToCreate) {
                    const metricName = metricToCreate.name;
                    
                    // Create a minimal metric with just the name and default values
                    this.plugin.settings.metrics[metricName] = {
                        name: metricName,
                        icon: '',
                        minValue: 1,
                        maxValue: 10,
                        description: '',
                        enabled: false,
                        category: 'dream',
                        type: 'number',
                        format: 'number',
                        options: [],
                        // Include legacy properties for backward compatibility
                        min: 1,
                        max: 10,
                        step: 1
                    };
                }
                
                // Save settings and refresh UI
                await this.plugin.saveSettings();
                this.loadMetricsSettingsContent(); // Refresh the content
                new Notice(`Created ${metricsToCreate.length} missing metrics with default values`);
            });
        }
    }
    
    // Load Metrics Settings content
    private loadMetricsSettingsContent() {
        this.contentContainer.empty();
        
        // Add title and description
        
        this.contentContainer.createEl('p', { 
            text: 'Manage your dream metrics: view descriptions, add new metrics, enable/disable existing ones, and restore missing defaults.',
            cls: 'oom-hub-content-description' 
        });

        // View Metrics Descriptions Section
        const viewDescriptionsSection = this.contentContainer.createDiv({ 
            cls: 'oom-hub-section' 
        });
        
        viewDescriptionsSection.createEl('h3', { 
            text: 'View Metrics Guide',
            cls: 'oom-hub-section-title' 
        });
        
        viewDescriptionsSection.createEl('p', { 
            text: 'View detailed descriptions of all available metrics and understand what each metric measures.',
            cls: 'oom-hub-section-description' 
        });

        const viewDescriptionsButton = viewDescriptionsSection.createEl('button', {
            text: 'View Metrics Descriptions',
            cls: 'mod-cta oom-view-descriptions-btn'
        });

        viewDescriptionsButton.addEventListener('click', () => {
            // Navigate to the Reference Overview tab which contains metrics descriptions
            this.selectTab('overview');
        });

        // Add Metric Section
        const addMetricSection = this.contentContainer.createDiv({ 
            cls: 'oom-hub-section' 
        });
        
        addMetricSection.createEl('h3', { 
            text: 'Add Metric',
            cls: 'oom-hub-section-title' 
        });
        
        addMetricSection.createEl('p', { 
            text: 'Create a custom metric to track additional aspects of your dreams.',
            cls: 'oom-hub-section-description' 
        });

        const addMetricButton = addMetricSection.createEl('button', {
            text: 'Add New Metric',
            cls: 'mod-cta oom-add-metric-btn'
        });

        addMetricButton.addEventListener('click', () => {
            new MetricEditorModal(
                this.app,
                {
                    name: '',
                    icon: '',
                    minValue: 1,
                    maxValue: 5,
                    description: '',
                    enabled: true
                },
                Object.values(this.plugin.settings.metrics),
                async (metric) => {
                    // Create a standardized metric with all required properties
                    const metricTemplate = DEFAULT_METRICS[metric.name] || {};
                    // Merge the template with our metric and ensure all required properties
                    const metricData = {
                        ...metricTemplate,
                        ...metric, // Include all properties from the submitted metric
                        name: metric.name,
                        enabled: true,
                        icon: metric.icon || metricTemplate.icon || 'help-circle',
                        minValue: metric.minValue || metricTemplate.minValue || 1,
                        maxValue: metric.maxValue || metricTemplate.maxValue || 5,
                        description: metric.description || metricTemplate.description || ''
                    };
                    // Use our helper to ensure the metric is complete
                    const completeMetric = ensureCompleteMetric(metricData);
                    this.plugin.settings.metrics[completeMetric.name] = completeMetric;
                    await this.plugin.saveSettings();
                    this.loadMetricsSettingsContent(); // Refresh the content
                }
            ).open();
        });

        // Missing Metrics Section
        // this.addMissingMetricsSection(); // TODO: Implement inline

        // Enabled Metrics Section
        const enabledSection = this.contentContainer.createDiv({ 
            cls: 'oom-hub-section' 
        });
        
        enabledSection.createEl('h3', { 
            text: 'Enabled Metrics',
                cls: 'oom-hub-section-title' 
            });
            
        // Disabled Metrics Section  
        const disabledSection = this.contentContainer.createDiv({ 
            cls: 'oom-hub-section' 
        });
        
        disabledSection.createEl('h3', { 
            text: 'Disabled Metrics',
            cls: 'oom-hub-section-title' 
        });

        // Render metrics
        this.renderMetricsLists(enabledSection, disabledSection);

        // Advanced Configuration Section (Phase 1)
        const advancedSection = this.contentContainer.createDiv({ 
            cls: 'oom-hub-section oom-advanced-section' 
        });
        
        advancedSection.createEl('h3', { 
            text: 'Advanced Configuration',
            cls: 'oom-hub-section-title oom-advanced-title' 
        });
        
        advancedSection.createEl('p', { 
            text: 'Advanced settings for the unified metrics infrastructure.',
            cls: 'oom-hub-section-description' 
        });

        // Check if unified metrics are configured
        const hasUnifiedConfig = this.plugin.settings.unifiedMetrics;
        
        if (hasUnifiedConfig) {
            const config = this.plugin.settings.unifiedMetrics;
            
            // Use proper logging instead of console.log
            this.logger?.debug('HubModal', 'Calendar metrics configuration', { metrics: config.preferredMetrics.calendar });
            this.logger?.debug('HubModal', 'Charts metrics configuration', { metrics: config.preferredMetrics.charts });
            // Unified Metrics Infrastructure Section
            const infrastructureSection = advancedSection.createDiv({ 
                cls: 'oom-hub-subsection' 
            });
            
            infrastructureSection.createEl('h3', { 
                text: 'Unified Metrics Infrastructure',
                cls: 'oom-hub-subsection-title' 
            });
            
            infrastructureSection.createEl('p', { 
                text: 'Centralized metric discovery, component-specific configurations, and enhanced visualization settings.',
                cls: 'oom-hub-subsection-description' 
            });

            // Configuration Status
            new Setting(infrastructureSection)
                .setName('Configuration Status')
                .setDesc(`Version ${config.configVersion} � Auto-discovery: ${config.autoDiscovery ? 'Enabled' : 'Disabled'}`)
                .addButton(button => {
                    button.setButtonText('Test Infrastructure')
                        .onClick(() => {
                            // Close the hub modal first
                            this.close();
                            
                            // Open the test suite and navigate to settings test
                            const { UnifiedTestSuiteModal } = require('../../testing/ui/UnifiedTestSuiteModal');
                            const testModal = new UnifiedTestSuiteModal(this.app, this.plugin);
                            testModal.open();
                            setTimeout(() => {
                                testModal.selectTab('test-settings');
                            }, 100);
                        });
                });

            // Visualization Thresholds Subsection
            const thresholdsSection = advancedSection.createDiv({ 
                cls: 'oom-hub-subsection' 
            });
            
            thresholdsSection.createEl('h3', { 
                text: 'Visualization Thresholds',
                cls: 'oom-hub-subsection-title' 
            });
            
            thresholdsSection.createEl('p', { 
                text: 'Control how metric values are categorized for visualization intensity.',
                cls: 'oom-hub-subsection-description' 
            });
            
            new Setting(thresholdsSection)
                .setName('Low Threshold')
                .setDesc('Values below this normalized threshold are considered "low" intensity')
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.05)
                    .setValue(config.visualizationThresholds.low)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.unifiedMetrics!.visualizationThresholds.low = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(thresholdsSection)
                .setName('Medium Threshold') 
                .setDesc('Values below this normalized threshold are considered "medium" intensity')
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.05)
                    .setValue(config.visualizationThresholds.medium)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.unifiedMetrics!.visualizationThresholds.medium = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(thresholdsSection)
                .setName('High Threshold')
                .setDesc('Values at or above this normalized threshold are considered "high" intensity')
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.05)
                    .setValue(config.visualizationThresholds.high)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.unifiedMetrics!.visualizationThresholds.high = value;
                        await this.plugin.saveSettings();
                    }));

            // Component Metric Preferences Subsection
            const preferencesSection = advancedSection.createDiv({ 
                cls: 'oom-hub-subsection' 
            });
            
            preferencesSection.createEl('h3', { 
                text: 'Component Metric Preferences',
                cls: 'oom-hub-subsection-title' 
            });
            
            preferencesSection.createEl('p', { 
                text: 'Configure which metrics are preferred for different components.',
                cls: 'oom-hub-subsection-description' 
            });
            
            // Calendar metrics
            const calendarMetricsText = config.preferredMetrics.calendar.length > 0 
                ? config.preferredMetrics.calendar.join(', ')
                : 'Using defaults';
            
            new Setting(preferencesSection)
                .setName('Calendar Metrics')
                .setDesc(`Preferred metrics for calendar visualization: ${calendarMetricsText}`)
                .addButton(button => {
                    button.setButtonText('Configure')
                        .onClick(() => {
                            this.showComponentMetricsConfig('calendar');
                        });
                });

            // Charts metrics  
            const chartMetricsText = config.preferredMetrics.charts.length > 0
                ? config.preferredMetrics.charts.join(', ')
                : 'Using defaults';
                
            new Setting(preferencesSection)
                .setName('Chart Metrics')
                .setDesc(`Preferred metrics for chart visualization: ${chartMetricsText}`)
                .addButton(button => {
                    button.setButtonText('Configure')
                        .onClick(() => {
                            this.showComponentMetricsConfig('charts');
                        });
                });

            // Metric Discovery Settings Subsection
            const discoverySection = advancedSection.createDiv({ 
                cls: 'oom-hub-subsection' 
            });
            
            discoverySection.createEl('h3', { 
                text: 'Metric Discovery Settings',
                cls: 'oom-hub-subsection-title' 
            });
            
            discoverySection.createEl('p', { 
                text: 'Configure how new metrics are automatically discovered from your dream entries.',
                cls: 'oom-hub-subsection-description' 
            });
            
            new Setting(discoverySection)
                .setName('Auto-Discovery')
                .setDesc('Automatically discover and suggest new metrics from dream entries')
                .addToggle(toggle => toggle
                    .setValue(config.autoDiscovery)
                    .onChange(async (value) => {
                        this.plugin.settings.unifiedMetrics!.autoDiscovery = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(discoverySection)
                .setName('Max New Metrics')
                .setDesc('Maximum number of new metrics to discover per session')
                .addText(text => text
                    .setValue(String(config.discovery.maxNewMetrics))
                    .onChange(async (value) => {
                        const maxMetrics = parseInt(value) || 10;
                        this.plugin.settings.unifiedMetrics!.discovery.maxNewMetrics = maxMetrics;
                        await this.plugin.saveSettings();
                    }));

        } else {
            // Migration prompt for users without unified config
            const migrationSection = advancedSection.createDiv({ 
                cls: 'oom-hub-subsection oom-migration-prompt' 
            });
            
            migrationSection.createEl('h3', { 
                text: 'Unified Metrics Infrastructure',
                cls: 'oom-hub-subsection-title' 
            });

            const migrationPromptEl = migrationSection.createEl('div', {
                cls: 'oom-notice oom-notice--warning'
            });
            migrationPromptEl.createEl('strong', { text: 'Migration Available: ' });
            migrationPromptEl.createEl('span', { 
                text: 'Your settings can be upgraded to use the new unified metrics infrastructure.'
            });

            new Setting(migrationSection)
                .setName('Upgrade to Unified Metrics')
                .setDesc('Migrate your current settings to the new unified metrics configuration format')
                .addButton(button => {
                    button.setButtonText('Migrate Now')
                        .onClick(async () => {
                            try {
                                const { migrateToUnifiedMetrics } = await import('../../utils/settings-migration');
                                const result = migrateToUnifiedMetrics(this.plugin.settings);
                                
                                if (result.migrated) {
                                    await this.plugin.saveSettings();
                                    new Notice('? Settings migrated to unified metrics format');
                                    this.loadMetricsSettingsContent(); // Refresh the content
                                } else {
                                    new Notice('?? Settings are already up to date');
                                }
                            } catch (error) {
                                new Notice(`? Migration failed: ${(error as Error).message}`);
                                this.logger.error('SettingsMigration', 'Settings migration failed', error);
                            }
                        });
                });
        }

    }

    // Load Dream Taxonomy content
    private loadDreamTaxonomyContent() {
        this.contentContainer.empty();
        
        // Initialize the Dream Taxonomy tab component
        const dreamTaxonomyTab = new DreamTaxonomyTab(this.app, this.contentContainer);
        dreamTaxonomyTab.render();
    }

    // Validate a template (placeholder implementation)
    private validateTemplate(template: JournalTemplate, templateItem: HTMLElement) {
        // Get the results container for this template
        const resultsContainer = templateItem.querySelector('.oom-template-validation-results') as HTMLElement;
        if (!resultsContainer) return;
        
        // Show loading state
        resultsContainer.classList.remove('oom-hidden');
        SafeDOMUtils.safelyEmptyContainer(resultsContainer);
        resultsContainer.createEl('p', { text: '?? Validating template...', cls: 'oom-validation-loading' });
        
        // LOGGING FIX: Use proper logger instead of console.log
        this.logger.debug('TemplateValidation', 'Debug template validation', {
            structureId: template.structure,
            isTemplater: template.isTemplaterTemplate,
            templaterFile: template.templaterFile,
            contentLength: template.content?.length || 0
        });
        
        // Clear loading state
        SafeDOMUtils.safelyEmptyContainer(resultsContainer);
        
        // Determine template type and validate accordingly
        if (template.isTemplaterTemplate) {
            // Templater template validation
            this.validateTemplaterTemplate(template, resultsContainer);
        } else if (template.structure && template.structure.trim() !== '') {
            // Structure-based template validation
            this.validateStructureBasedTemplate(template, resultsContainer);
        } else {
            // Direct Input template validation
            this.validateDirectInputTemplate(template, resultsContainer);
        }
    }
    
    /**
     * Validate a Templater-based template
     */
    private validateTemplaterTemplate(template: JournalTemplate, resultsContainer: HTMLElement) {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];
        
        // Check if Templater plugin is available
        const templaterEnabled = !!(this.plugin.templaterIntegration?.isTemplaterInstalled?.());
        if (!templaterEnabled) {
            errors.push('Templater plugin is not installed or enabled');
        }
        
        // Check if templater file exists
        if (!template.templaterFile) {
            errors.push('No Templater file specified for this template');
        } else {
            const file = this.app.vault.getAbstractFileByPath(template.templaterFile);
            if (!file) {
                errors.push(`Templater file not found: ${template.templaterFile}`);
            } else {
                info.push(`Templater file: ${template.templaterFile}`);
            }
        }
        
        // Check template content
        if (!template.content || template.content.trim() === '') {
            warnings.push('Template content is empty');
        } else {
            info.push(`Template content: ${template.content.length} characters`);
        }
        
        this.displayValidationResults(resultsContainer, errors, warnings, info, 'Templater Template');
    }
    
    /**
     * Validate a structure-based template
     */
    private validateStructureBasedTemplate(template: JournalTemplate, resultsContainer: HTMLElement) {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];
        
        // Get available structures
        const journalStructures = this.plugin.settings.journalStructure?.structures || [];
        const lintingStructures = this.plugin.settings.linting?.structures || [];
        const allStructures = [...journalStructures, ...lintingStructures];
        
        // Check if structure exists
        const associatedStructure = allStructures.find(s => s.id === template.structure);
        if (!associatedStructure) {
            errors.push(`Structure not found: "${template.structure}"`);
            info.push(`Available structures: ${allStructures.map(s => s.id).join(', ')}`);
        } else {
            info.push(`Using structure: ${associatedStructure.name} (${associatedStructure.id})`);
            
            // Validate content against structure if we have the LintingEngine
            try {
                const lintingEngine = new (require('../../journal_check/LintingEngine').LintingEngine)(this.plugin);
                const validationResults = lintingEngine.validateStructureCompliance(template.content, associatedStructure);
                
                validationResults.forEach(result => {
                    if (result.severity === 'error') {
                        errors.push(result.message);
                    } else if (result.severity === 'warning') {
                        warnings.push(result.message);
                    } else {
                        info.push(result.message);
                    }
                });
            } catch (error) {
                warnings.push('Could not perform structure compliance validation');
            }
        }
        
        // Check template content
        if (!template.content || template.content.trim() === '') {
            errors.push('Template content is empty');
        } else {
            info.push(`Template content: ${template.content.length} characters`);
            
            // Check for expected callout patterns
            const hasCallouts = />\s*\[![^\]]+\]/.test(template.content);
            if (!hasCallouts) {
                warnings.push('Template does not contain any callouts - this might be intentional for structure-based templates');
            }
        }
        
        this.displayValidationResults(resultsContainer, errors, warnings, info, 'Structure-Based Template');
    }
    
    /**
     * Validate a direct input template
     */
    private validateDirectInputTemplate(template: JournalTemplate, resultsContainer: HTMLElement) {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];
        
        // For Direct Input templates, we have different validation criteria
        info.push('Template Type: Direct Input (standalone template)');
        
        // Check template content
        if (!template.content || template.content.trim() === '') {
            errors.push('Template content is empty');
        } else {
            info.push(`Template content: ${template.content.length} characters`);
            
            // Check for callout patterns (helpful but not required)
            const calloutMatches = template.content.match(/>\s*\[!([^\]]+)\]/g);
            if (calloutMatches) {
                const calloutTypes = calloutMatches.map(match => {
                    const typeMatch = match.match(/\[!([^\]]+)\]/);
                    return typeMatch ? typeMatch[1] : 'unknown';
                });
                info.push(`Contains callouts: ${calloutTypes.join(', ')}`);
            } else {
                info.push('No callouts detected - this is fine for direct input templates');
            }
            
            // Check for placeholder patterns
            const placeholders = template.content.match(/\{\{[^}]+\}\}/g);
            if (placeholders) {
                info.push(`Contains placeholders: ${placeholders.join(', ')}`);
            }
        }
        
        // Check template name
        if (!template.name || template.name.trim() === '') {
            errors.push('Template name is missing');
        }
        
        // For Direct Input templates, empty structure ID is perfectly fine
        if (!template.structure || template.structure.trim() === '') {
            info.push('No structure association - this is normal for Direct Input templates');
        } else {
            info.push(`Has structure association: ${template.structure} (optional for Direct Input)`);
        }
        
        this.displayValidationResults(resultsContainer, errors, warnings, info, 'Direct Input Template');
    }
    
    /**
     * Display validation results in a consistent format
     */
    private displayValidationResults(resultsContainer: HTMLElement, errors: string[], warnings: string[], info: string[], templateType: string) {
        if (errors.length === 0 && warnings.length === 0) {
            const successEl = resultsContainer.createDiv({ cls: 'oom-validation-success' });
            successEl.createEl('span', { text: '? Template validation passed!' });
            successEl.createEl('p', { 
                text: `${templateType} is properly configured.`,
                cls: 'oom-validation-success-details'
            });
            
            // Show info details
            if (info.length > 0) {
                const infoSection = successEl.createDiv({ cls: 'oom-validation-info-section' });
                infoSection.classList.add('oom-info-section');
                
                
                info.forEach(infoItem => {
                    infoSection.createEl('div', { text: `?? ${infoItem}` });
                });
            }
        } else {
            // Create summary
            const summaryEl = resultsContainer.createDiv({ cls: 'oom-validation-summary' });
            const summaryParts = [];
            if (errors.length > 0) summaryParts.push(`${errors.length} error${errors.length !== 1 ? 's' : ''}`);
            if (warnings.length > 0) summaryParts.push(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`);
            
            summaryEl.createEl('strong', { text: `${templateType} validation found: ${summaryParts.join(', ')}` });
            
            // Show detailed results
            const detailsEl = resultsContainer.createDiv({ cls: 'oom-validation-details' });
            
            // Show errors first
            if (errors.length > 0) {
                const errorsSection = detailsEl.createDiv({ cls: 'oom-validation-section' });
                errorsSection.createEl('h5', { text: '? Errors' });
                errors.forEach(error => {
                    const errorItem = errorsSection.createDiv({ cls: 'oom-validation-item error' });
                    errorItem.createEl('span', { text: error });
                });
            }
            
            // Show warnings
            if (warnings.length > 0) {
                const warningsSection = detailsEl.createDiv({ cls: 'oom-validation-section' });
                warningsSection.createEl('h5', { text: '?? Warnings' });
                warnings.forEach(warning => {
                    const warningItem = warningsSection.createDiv({ cls: 'oom-validation-item warning' });
                    warningItem.createEl('span', { text: warning });
                });
            }
            
            // Show info
            if (info.length > 0) {
                const infoSection = detailsEl.createDiv({ cls: 'oom-validation-section' });
                infoSection.createEl('h5', { text: '?? Information' });
                info.forEach(infoItem => {
                    const infoEl = infoSection.createDiv({ cls: 'oom-validation-item info' });
                    infoEl.createEl('span', { text: infoItem });
                });
            }
        }
    }
    
    /**
     * Show folder selection dialog for content analysis
     */
    private showFolderSelectionDialog(targetsList: HTMLElement, emptyState: HTMLElement) {
        // Get all folders in the vault using Obsidian's TFolder type
        const folders = this.app.vault.getAllLoadedFiles()
            .filter(file => 'children' in file && file.children !== undefined) // This indicates it's a folder
            .map(folder => folder.path)
            .filter(path => path !== '') // Remove empty root path
            .sort();
        
        if (folders.length === 0) {
            new Notice('No folders found in your vault');
            return;
        }
        
        // Create simple selection dialog
        const modal = new Modal(this.app);
        modal.titleEl.textContent = 'Select Folder for Analysis';
        
        const { contentEl } = modal;
        contentEl.createEl('p', { text: 'Choose a folder to analyze for callout patterns:' });
        
        const folderList = contentEl.createDiv({ cls: 'oom-folder-list' });
        folderList.classList.add('oom-folder-list');
        
        
        
        
        
        folders.forEach(folderPath => {
            const folderItem = folderList.createDiv({ cls: 'oom-folder-item' });
            folderItem.classList.add('oom-folder-item');
            
            
            
            folderItem.textContent = `?? ${folderPath}`;
            
            folderItem.addEventListener('click', () => {
                this.addAnalysisTarget(targetsList, emptyState, {
                    type: 'folder',
                    path: folderPath,
                    name: folderPath,
                    includeSubfolders: true
                });
                modal.close();
                new Notice(`Added folder: ${folderPath}`);
            });
            
            folderItem.addEventListener('mouseenter', () => {
                folderItem.classList.add('oom-folder-item--hover');
            });
            
            folderItem.addEventListener('mouseleave', () => {
                folderItem.classList.remove('oom-folder-item--hover');
            });
        });
        
        const buttonContainer = contentEl.createDiv({ cls: 'oom-dialog-buttons' });
        buttonContainer.classList.add('oom-button-container--right');
        buttonContainer.classList.add('oom-button-container');
        
        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => modal.close());
        
        modal.open();
    }
    
    /**
     * Show note selection dialog for content analysis
     */
    private showNoteSelectionDialog(targetsList: HTMLElement, emptyState: HTMLElement) {
        // Get all markdown files in the vault
        const markdownFiles = this.app.vault.getMarkdownFiles()
            .map(file => ({ path: file.path, name: file.basename }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        if (markdownFiles.length === 0) {
            new Notice('No markdown files found in your vault');
            return;
        }
        
        // Create selection dialog with search
        const modal = new Modal(this.app);
        modal.titleEl.textContent = 'Select Note for Analysis';
        
        const { contentEl } = modal;
        contentEl.createEl('p', { text: 'Choose a note to analyze for callout patterns:' });
        
        // Add search input
        const searchContainer = contentEl.createDiv({ cls: 'oom-search-container' });
        searchContainer.classList.add('oom-search-container');
        
        const searchInput = searchContainer.createEl('input', { 
            type: 'text',
            placeholder: 'Search notes...'
        });
        searchInput.classList.add('oom-search-input');
        
        
        
        
        const noteList = contentEl.createDiv({ cls: 'oom-note-list' });
        noteList.classList.add('oom-note-list');
        
        
        
        
        
        const renderNotes = (filteredFiles: typeof markdownFiles) => {
            noteList.empty();
            
            filteredFiles.slice(0, 100).forEach(file => { // Limit to 100 for performance
                const noteItem = noteList.createDiv({ cls: 'oom-note-item' });
                noteItem.classList.add('oom-note-item');
                
                
                
                noteItem.createEl('div', { text: file.name, cls: 'oom-note-name' });
                const pathEl = noteItem.createEl('div', { text: file.path, cls: 'oom-note-path' });
                pathEl.classList.add('oom-path-element');
                
                
                noteItem.addEventListener('click', () => {
                    this.addAnalysisTarget(targetsList, emptyState, {
                        type: 'note',
                        path: file.path,
                        name: file.name
                    });
                    modal.close();
                    new Notice(`Added note: ${file.name}`);
                });
                
                noteItem.addEventListener('mouseenter', () => {
                    noteItem.classList.add('oom-note-item--hover');
                });
                
                noteItem.addEventListener('mouseleave', () => {
                    noteItem.classList.remove('oom-note-item--hover');
                });
            });
            
            if (filteredFiles.length > 100) {
                const moreItem = noteList.createDiv({ cls: 'oom-note-item' });
                moreItem.classList.add('oom-more-item');
                
                
                moreItem.textContent = `... and ${filteredFiles.length - 100} more. Refine your search.`;
            }
        };
        
        // Initial render
        renderNotes(markdownFiles);
        
        // Search functionality
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filtered = markdownFiles.filter(file => 
                file.name.toLowerCase().includes(searchTerm) || 
                file.path.toLowerCase().includes(searchTerm)
            );
            renderNotes(filtered);
        });
        
        const buttonContainer = contentEl.createDiv({ cls: 'oom-dialog-buttons' });
        buttonContainer.classList.add('oom-button-container--right');
        buttonContainer.classList.add('oom-button-container');
        
        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => modal.close());
        
        modal.open();
        
        // Focus search input
        setTimeout(() => searchInput.focus(), 100);
    }
    
    /**
     * Add an analysis target to the list
     */
    private addAnalysisTarget(targetsList: HTMLElement, emptyState: HTMLElement, target: { type: string; path: string; name: string; includeSubfolders?: boolean }) {
        // Hide empty state
        emptyState.classList.add('oom-hidden');
        
        // Check if target already exists
        const existingTargets = Array.from(targetsList.querySelectorAll('.oom-analysis-target'));
        const duplicate = existingTargets.find(el => {
            const pathEl = el.querySelector('.oom-target-path') as HTMLElement;
            return pathEl && pathEl.textContent === target.path;
        });
        
        if (duplicate) {
            new Notice('This target is already in the analysis list');
            return;
        }
        
        // Create target item
        const targetItem = targetsList.createDiv({ cls: 'oom-analysis-target' });
        
        const targetInfo = targetItem.createDiv({ cls: 'oom-target-info' });
        
        const icon = target.type === 'folder' ? '??' : '??';
        targetInfo.createEl('span', { text: `${icon} ${target.name}`, cls: 'oom-target-name' });
        targetInfo.createEl('br');
        targetInfo.createEl('span', { text: target.path, cls: 'oom-target-path' });
        
        if (target.type === 'folder' && target.includeSubfolders) {
            targetInfo.createEl('br');
            const subfoldersEl = targetInfo.createEl('span', { text: 'Includes subfolders', cls: 'oom-target-options' });
        }
        
        // Remove button
        const removeBtn = targetItem.createEl('button', { text: '�', cls: 'oom-remove-target-btn' });
        
        removeBtn.addEventListener('click', () => {
            targetItem.remove();
            
            // Show empty state if no targets left
            const remainingTargets = targetsList.querySelectorAll('.oom-analysis-target');
            if (remainingTargets.length === 0) {
                emptyState.classList.remove('oom-hidden');
            }
            
            // Update analyze button state
            this.updateAnalyzeButtonState();
        });
        
        // Update analyze button state
        this.updateAnalyzeButtonState();
    }
    
    /**
     * Update the analyze button state based on selected targets
     */
    private updateAnalyzeButtonState() {
        const analyzeBtn = this.contentContainer.querySelector('.oom-button-primary') as HTMLButtonElement;
        if (analyzeBtn) {
            const targetsList = this.contentContainer.querySelector('.oom-targets-list');
            const hasTargets = targetsList && targetsList.querySelectorAll('.oom-analysis-target').length > 0;
            analyzeBtn.disabled = !hasTargets;
            
            if (hasTargets) {
                analyzeBtn.textContent = 'Analyze Selected Content';
            } else {
                analyzeBtn.textContent = 'Analyze Selected Content';
            }
        }
    }
    
    /**
     * Analyze selected content for callout patterns
     */
    private async analyzeSelectedContent() {
        // Fallback logging in case structured logging isn't working
        console.log('?? CONTENT ANALYSIS STARTED - METHOD CALLED');
        this.logger.info('ContentAnalysis', 'ANALYSIS STARTED - Checking for targets');
        
        const targetsList = this.contentContainer.querySelector('.oom-targets-list');
        console.log('?? Targets list element:', targetsList);
        
        if (!targetsList) {
            console.log('?? NO TARGETS LIST FOUND IN DOM');
            this.logger.error('ContentAnalysis', 'No targets list found in DOM');
            return;
        }
        
        const targets = Array.from(targetsList.querySelectorAll('.oom-analysis-target'));
        console.log('?? Found targets:', targets.length, targets);
        this.logger.info('ContentAnalysis', `Found ${targets.length} targets for analysis`);
        
        if (targets.length === 0) {
            console.log('?? NO TARGETS SELECTED - This might be the issue');
            this.logger.warn('ContentAnalysis', 'No targets selected for analysis');
            new Notice('No targets selected for analysis');
            return;
        }
        
        console.log('?? Starting analysis process with', targets.length, 'targets');
        this.logger.info('ContentAnalysis', 'Starting content analysis process');
        this.isScraping = true;
        this.updateAnalyzeButtonState();
        
        // Show progress
        const progressContainer = this.contentContainer.createDiv({ cls: 'oom-progress-container' });
        progressContainer.classList.add('oom-progress-container');
        
        
        
        
        const progressTitle = progressContainer.createEl('h3', { text: '?? Analyzing Content...' });
        progressTitle.classList.add('oom-progress-title');
        
        const progressBar = progressContainer.createDiv({ cls: 'oom-progress-bar' });
        progressBar.classList.add('oom-progress-bar');
        
        
        
        
        
        const progressFill = progressBar.createDiv({ cls: 'oom-progress-fill' });
        progressFill.classList.add('oom-progress-fill');
        
        
        
        
        const statusText = progressContainer.createEl('p', { text: 'Preparing analysis...' });
        statusText.classList.add('oom-status-text');
        
        
        try {
            // Initialize results object
            const results = {
                totalFiles: 0,
                filesWithCallouts: 0,
                calloutsFound: {} as Record<string, number>,
                fileStructures: {} as Record<string, { name: string; structure: CalloutNode[] }>
            };
            
            console.log('?? Results object initialized, processing targets');
            this.logger.info('ContentAnalysis', 'Results object initialized, processing targets');
            
            // Get files to analyze from targets
            let filesToAnalyze: any[] = [];
            
            for (const targetEl of targets) {
                const pathEl = targetEl.querySelector('.oom-target-path') as HTMLElement;
                if (!pathEl) continue;
                
                const targetPath = pathEl.textContent || '';
                const isFolder = targetEl.textContent?.includes('??');
                
                this.logger.info('ContentAnalysis', `Processing target: ${targetPath} (folder: ${isFolder})`);
                
                if (isFolder) {
                    // Analyze folder
                    const allFiles = this.app.vault.getMarkdownFiles();
                    const folderFiles = allFiles.filter(file => 
                        file.path.startsWith(targetPath + '/') || file.path === targetPath
                    );
                    this.logger.info('ContentAnalysis', `Found ${folderFiles.length} files in folder ${targetPath}`);
                    filesToAnalyze.push(...folderFiles);
                } else {
                    // Analyze single file
                    const file = this.app.vault.getAbstractFileByPath(targetPath);
                    if (file && 'extension' in file && file.extension === 'md') {
                        this.logger.info('ContentAnalysis', `Added single file: ${targetPath}`);
                        filesToAnalyze.push(file);
                    } else {
                        this.logger.warn('ContentAnalysis', `File not found or not markdown: ${targetPath}`);
                    }
                }
            }
            
            results.totalFiles = filesToAnalyze.length;
            console.log('?? Total files to analyze:', results.totalFiles);
            this.logger.info('ContentAnalysis', `Total files to analyze: ${results.totalFiles}`);
            
            if (results.totalFiles === 0) {
                console.log('?? NO FILES FOUND TO ANALYZE - This is the problem!');
                this.logger.error('ContentAnalysis', 'NO FILES FOUND TO ANALYZE - This is the problem!');
                statusText.textContent = 'No files found to analyze';
                setTimeout(() => {
                    progressContainer.remove();
                    this.isScraping = false;
                    this.updateAnalyzeButtonState();
                }, 1000);
                return;
            }
            
            // Analyze files
            console.log('?? Starting analysis of', filesToAnalyze.length, 'files');
            this.logger.info('ContentAnalysis', `Starting analysis of ${filesToAnalyze.length} files`);
            for (let i = 0; i < filesToAnalyze.length; i++) {
                const file = filesToAnalyze[i];
                const progress = (i / filesToAnalyze.length) * 100;
                
                progressFill.classList.add('oom-progress-bar');
                progressFill.style.setProperty('--oom-progress-width', `${progress}%`);
                statusText.textContent = `Analyzing ${file.name} (${i + 1}/${filesToAnalyze.length})`;
                
                console.log('?? About to analyze file', i + 1, '/', filesToAnalyze.length, ':', file.name);
                this.logger.info('ContentAnalysis', `About to analyze file ${i + 1}/${filesToAnalyze.length}: ${file.name}`);
                await this.analyzeFile(file, results);
                
                // Small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            progressFill.classList.add('oom-progress-fill--complete');
            statusText.textContent = 'Analysis complete!';
            
            this.logger.info('ContentAnalysis', 'All files processed, showing results', {
                totalFiles: results.totalFiles,
                filesWithCallouts: results.filesWithCallouts,
                totalCalloutTypes: Object.keys(results.calloutsFound).length
            });
            
            // Show results after a brief delay
            setTimeout(() => {
                progressContainer.remove();
                this.showAnalysisResults(results);
                this.isScraping = false;
                this.updateAnalyzeButtonState();
            }, 500);
            
        } catch (error) {
            this.logger.error('ContentAnalysis', `CRITICAL ERROR in analysis: ${(error as Error).message}`, error);
            progressContainer.remove();
            new Notice(`Analysis failed: ${(error as Error).message}. Check console for details.`);
            this.isScraping = false;
            this.updateAnalyzeButtonState();
        }
    }
    
    /**
     * Analyze a single file for callout patterns and nested structures
     */
    private async analyzeFile(file: any, results: any) {
        console.log('?? ANALYZE FILE STARTED for:', file.name);
        this.logger.info('ContentAnalysis', 'Starting file analysis', {
            fileName: file.name,
            filePath: file.path
        });
        
        try {
            console.log('?? About to read file content for:', file.name);
            this.logger.info('ContentAnalysis', 'Reading file content', {
                fileName: file.name
            });
            
            const content = await this.app.vault.read(file);
            console.log('?? File content read successfully, length:', content.length);
            
            this.logger.info('ContentAnalysis', 'File content read successfully', {
                fileName: file.name,
                contentLength: content.length,
                contentPreview: content.substring(0, 200)
            });
            
            // Find callout patterns and analyze nesting
            console.log('?? About to call parseCalloutStructure');
            this.logger.info('ContentAnalysis', 'Calling parseCalloutStructure', {
                fileName: file.name
            });
            
            const calloutStructure = this.parseCalloutStructure(content);
            console.log('?? parseCalloutStructure completed, found', calloutStructure.length, 'callouts');
            this.logger.info('ContentAnalysis', 'parseCalloutStructure completed', {
                fileName: file.name,
                structureLength: calloutStructure.length,
                structure: calloutStructure
            });
            
            if (calloutStructure.length > 0) {
                this.logger.info('ContentAnalysis', 'Callouts found in file', {
                    fileName: file.name,
                    calloutCount: calloutStructure.length
                });
                
                results.filesWithCallouts++;
                
                // Store the file's callout structure
                results.fileStructures[file.path] = {
                    name: file.name,
                    structure: calloutStructure
                };
                
                // Count callout types (including nested ones)
                this.countCalloutTypes(calloutStructure, results.calloutsFound);
                
                this.logger.debug('ContentAnalysis', 'File structure stored and types counted', {
                    fileName: file.name,
                    calloutsFound: results.calloutsFound
                });
            } else {
                this.logger.warn('ContentAnalysis', 'No callouts found in file', {
                    fileName: file.name,
                    contentLength: content.length,
                    hasCalloutBrackets: content.includes('[!'),
                    hasGreaterThan: content.includes('>'),
                    firstFewLines: content.split('\n').slice(0, 10)
                });
            }
            
        } catch (error) {
            this.logger.error('ContentAnalysis', `Failed to analyze file ${file.name}`, error);
            // Note: This is a per-file error during batch analysis, logged but no user notification needed
        }
    }
    
    /**
     * Show analysis results in a modal
     */
    private showAnalysisResults(results: any) {
        const modal = new Modal(this.app);
        modal.titleEl.textContent = 'Content Analysis Results';
        
        const { contentEl } = modal;
        
        // Summary section
        const summarySection = contentEl.createDiv({ cls: 'oom-analysis-summary' });
        summarySection.createEl('h3', { text: '?? Summary' });
        
        const summaryList = summarySection.createEl('ul');
        summaryList.createEl('li', { text: `Total files analyzed: ${results.totalFiles}` });
        summaryList.createEl('li', { text: `Files with callouts: ${results.filesWithCallouts}` });
        summaryList.createEl('li', { text: `Callout usage rate: ${results.totalFiles > 0 ? Math.round((results.filesWithCallouts / results.totalFiles) * 100) : 0}%` });
        
        // Structure Analysis section - NEW
        if (Object.keys(results.fileStructures).length > 0) {
            const structureSection = contentEl.createDiv({ cls: 'oom-analysis-structures' });
            structureSection.createEl('h3', { text: '?? Callout Structure Analysis' });
            
            const fileEntries = Object.entries(results.fileStructures);
            
            // Show structure complexity metrics
            const complexitySection = structureSection.createDiv({ cls: 'oom-structure-complexity' });
            complexitySection.classList.add('oom-complexity-section');
            
            
            
            
            const totalCallouts = Object.values(results.calloutsFound).reduce((sum: number, count: number) => sum + count, 0);
            const filesWithNesting = fileEntries.filter(([, data]: [string, any]) => 
                this.hasNestedCallouts(data.structure)
            ).length;
            const avgDepth = this.calculateAverageDepth(fileEntries);
            
            complexitySection.createEl('h4', { text: '?? Structure Metrics' });
            const metricsList = complexitySection.createEl('ul');
            metricsList.createEl('li', { text: `Total callouts found: ${totalCallouts}` });
            metricsList.createEl('li', { text: `Files with nested callouts: ${filesWithNesting}/${results.filesWithCallouts}` });
            metricsList.createEl('li', { text: `Average nesting depth: ${avgDepth.toFixed(1)}` });
            
            // Show file structures
            structureSection.createEl('h4', { text: '?? File Structure Details' });
            
            fileEntries.forEach(([filePath, fileData]: [string, any]) => {
                const fileContainer = structureSection.createDiv({ cls: 'oom-file-structure' });
                fileContainer.classList.add('oom-file-container');
                
                
                fileContainer.classList.add('oom-file-container');
                
                const fileHeader = fileContainer.createDiv({ cls: 'oom-file-header' });
                fileHeader.classList.add('oom-file-header');
                
                fileHeader.createEl('span', { text: `?? ${fileData.name}` });
                
                const pathSpan = fileHeader.createEl('span', { text: ` (${filePath})` });

                
                pathSpan.classList.add('oom-file-path');
                
                
                
                
                // Display callout tree
                const treeContainer = fileContainer.createDiv({ cls: 'oom-callout-tree' });
                this.renderCalloutTree(treeContainer, fileData.structure, 0);
            });
        }
        
        // Callouts found section
        const calloutsSection = contentEl.createDiv({ cls: 'oom-analysis-callouts' });
        calloutsSection.createEl('h3', { text: '?? Callout Types Found' });
        
        const calloutEntries = Object.entries(results.calloutsFound);
        if (calloutEntries.length > 0) {
            const calloutTable = calloutsSection.createEl('table');
            calloutTable.classList.add('oom-callout-table');
            
            
            // Header
            const headerRow = calloutTable.createEl('tr');
            headerRow.createEl('th', { text: 'Callout Type', cls: 'oom-table-header' });
            headerRow.createEl('th', { text: 'Count', cls: 'oom-table-header oom-table-header--right' });
            
            // Sort by count descending
            calloutEntries.sort((a, b) => (b[1] as number) - (a[1] as number)).forEach(([type, count]) => {
                const row = calloutTable.createEl('tr');
                row.createEl('td', { text: type, cls: 'oom-table-cell' });
                row.createEl('td', { text: count.toString(), cls: 'oom-table-cell oom-table-cell--right' });
            });
        } else {
            calloutsSection.createEl('p', { text: 'No callouts found in the analyzed content.' });
        }
        
        // Suggestions section
        const suggestionsSection = contentEl.createDiv({ cls: 'oom-analysis-suggestions' });
        suggestionsSection.createEl('h3', { text: '?? Suggestions' });
        
        const suggestions = this.generateAnalysisSuggestions(results);
        if (suggestions.length > 0) {
            const suggestionsList = suggestionsSection.createEl('ul');
            suggestions.forEach(suggestion => {
                suggestionsList.createEl('li', { text: suggestion });
            });
        } else {
            suggestionsSection.createEl('p', { text: 'No specific suggestions at this time.' });
        }
        
        // Close button
        const buttonContainer = contentEl.createDiv({ cls: 'oom-dialog-buttons' });
        buttonContainer.classList.add('oom-button-container--right');
        buttonContainer.classList.add('oom-button-container-spaced');
        
        const closeBtn = buttonContainer.createEl('button', { text: 'Close', cls: 'mod-cta' });
        closeBtn.addEventListener('click', () => modal.close());
        
        modal.open();
    }
    
    /**
     * Check if callout structure has nested elements
     */
    private hasNestedCallouts(structure: CalloutNode[]): boolean {
        return structure.some(node => node.children.length > 0 || 
            node.children.some(child => this.hasNestedCallouts([child]))
        );
    }
    
    /**
     * Calculate average nesting depth across all files
     */
    private calculateAverageDepth(fileEntries: [string, any][]): number {
        let totalDepth = 0;
        let totalCallouts = 0;
        
        fileEntries.forEach(([, fileData]: [string, any]) => {
            const depths = this.getCalloutDepths(fileData.structure);
            totalDepth += depths.reduce((sum, depth) => sum + depth, 0);
            totalCallouts += depths.length;
        });
        
        return totalCallouts > 0 ? totalDepth / totalCallouts : 0;
    }
    
    /**
     * Get all depths from a callout structure
     */
    private getCalloutDepths(nodes: CalloutNode[]): number[] {
        const depths: number[] = [];
        
        const traverse = (nodeList: CalloutNode[], currentDepth: number) => {
            nodeList.forEach(node => {
                depths.push(currentDepth);
                if (node.children.length > 0) {
                    traverse(node.children, currentDepth + 1);
                }
                });
            };

        traverse(nodes, 1);
        return depths;
    }
    
    /**
     * Render a visual tree of callout structures
     */
    private renderCalloutTree(container: HTMLElement, nodes: CalloutNode[], depth: number) {
        nodes.forEach((node, index) => {
            const nodeEl = container.createDiv({ cls: 'oom-tree-node' });
            // Set depth as a CSS custom property for styling - INTENTIONAL: Dynamic tree hierarchy depth
            nodeEl.style.setProperty('--depth', depth.toString());
            
            // Create tree line indicators
            const lineEl = nodeEl.createSpan({ cls: 'oom-tree-line' });
            
            if (depth === 0) {
                lineEl.textContent = index === nodes.length - 1 ? '+-' : '+-';
            } else {
                lineEl.textContent = index === nodes.length - 1 ? '+-' : '+-';
            }
            
            // Callout type badge
            const typeEl = nodeEl.createSpan({ cls: 'oom-callout-type-badge' });
            typeEl.textContent = `[!${node.type}]`;
            
            // Title or line number
            const titleEl = nodeEl.createSpan({ cls: 'oom-callout-title' });
            if (node.title) {
                titleEl.textContent = node.title;
                // Removed: titleEl.style.fontWeight = 'bold';
            } else {
                titleEl.textContent = `(line ${node.lineNumber})`;
                titleEl.classList.add('oom-title-muted');
                titleEl.classList.add('oom-title-italic');
            }
            
            // Render children recursively
            if (node.children.length > 0) {
                this.renderCalloutTree(container, node.children, depth + 1);
            }
        });
    }
    
    /**
     * Generate suggestions based on analysis results
     */
    private generateAnalysisSuggestions(results: any): string[] {
        const suggestions: string[] = [];
        
        if (results.totalFiles === 0) {
            suggestions.push('No files were found to analyze. Check your target selection.');
            return suggestions;
        }
        
        if (results.filesWithCallouts === 0) {
            suggestions.push('No callouts found. Consider adding structured callouts to organize your content.');
            suggestions.push('Try using [!journal-entry], [!dream-diary], or [!dream-metrics] callouts.');
            return suggestions;
        }
        
        const calloutTypes = Object.keys(results.calloutsFound);
        const usageRate = results.filesWithCallouts / results.totalFiles;
        
        if (usageRate < 0.3) {
            suggestions.push(`Only ${Math.round(usageRate * 100)}% of files use callouts. Consider adding more structured content.`);
        }
        
        // Check for common patterns
        const hasJournalCallouts = calloutTypes.some(type => type.includes('journal'));
        const hasDreamCallouts = calloutTypes.some(type => type.includes('dream'));
        const hasMetricsCallouts = calloutTypes.some(type => type.includes('metric'));
        
        if (!hasJournalCallouts) {
            suggestions.push('Consider using [!journal-entry] callouts for main journal content.');
        }
        
        if (!hasDreamCallouts) {
            suggestions.push('Consider using [!dream-diary] callouts for dream-specific content.');
        }
        
        if (!hasMetricsCallouts) {
            suggestions.push('Consider using [!dream-metrics] callouts to track quantified dream data.');
        }
        
        if (calloutTypes.length > 10) {
            suggestions.push(`Found ${calloutTypes.length} different callout types. Consider standardizing on fewer types for consistency.`);
        }
        
        return suggestions;
    }
    
    /**
     * Emergency template recovery function
     */
    private async recoverLostTemplateContent() {
        const modal = new Modal(this.app);
        modal.titleEl.textContent = '?? Template Recovery Tool';
        
        const { contentEl } = modal;
        
        contentEl.createEl('h3', { text: 'Template Content Recovery' });
        contentEl.createEl('p', { 
            text: 'This tool attempts to recover lost template content from various sources.' 
        });
        
        const recoveryActions = contentEl.createDiv({ cls: 'oom-recovery-actions' });
        
        // Check browser localStorage
        const checkLocalStorageBtn = recoveryActions.createEl('button', {
            text: '?? Check Browser Cache',
            cls: 'oom-recovery-button'
        });
        checkLocalStorageBtn.addEventListener('click', () => {
            this.checkBrowserCacheForTemplates(contentEl);
        });
        
        // Check for backup files
        const checkBackupsBtn = recoveryActions.createEl('button', {
            text: '?? Check Plugin Folder for Backups',
            cls: 'oom-recovery-button'
        });
        checkBackupsBtn.addEventListener('click', () => {
            this.checkPluginFolderForBackups(contentEl);
        });
        
        // Manual content restoration
        const manualRestoreBtn = recoveryActions.createEl('button', {
            text: '?? Manual Content Restoration',
            cls: 'oom-recovery-button'
        });
        manualRestoreBtn.addEventListener('click', () => {
            this.showManualTemplateRestore(contentEl);
        });
        
        const closeBtn = contentEl.createEl('button', { text: 'Close', cls: 'mod-cta' });
        closeBtn.classList.add('oom-close-btn-spaced');
        closeBtn.addEventListener('click', () => modal.close());
        
        modal.open();
    }
    
    /**
     * Check browser cache for template content
     */
    private checkBrowserCacheForTemplates(containerEl: HTMLElement) {
        const resultsEl = containerEl.createDiv({ cls: 'oom-recovery-results' });
        SafeDOMUtils.safelyEmptyContainer(resultsEl);
        
        resultsEl.createEl('h4', { text: '?? Browser Cache Search Results' });
        
        try {
            // Check localStorage
            const localStorageResults = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('template') || key.includes('oneiro') || key.includes('wizard'))) {
                    const value = localStorage.getItem(key);
                    if (value && value.length > 50) { // Only show substantial content
                        localStorageResults.push({ key, value });
                    }
                }
            }
            
            if (localStorageResults.length > 0) {
                resultsEl.createEl('p', { text: `Found ${localStorageResults.length} potential cache entries:` });
                localStorageResults.forEach((item, index) => {
                    const itemEl = resultsEl.createDiv({ cls: 'oom-cache-item' });
                    itemEl.classList.add('oom-item-container');
                    
                    
                    
                    
                    itemEl.createEl('strong', { text: `Cache Entry ${index + 1}: ${item.key}` });
                    const previewEl = itemEl.createEl('pre', { text: item.value.substring(0, 200) + '...' });
                    previewEl.classList.add('oom-preview-element');
                    
                    
                    
                    
                    const restoreBtn = itemEl.createEl('button', { text: 'Restore This Content' });
                    restoreBtn.addEventListener('click', () => {
                        this.restoreTemplateFromCache(item.value);
                    });
            });
        } else {
                resultsEl.createEl('p', { text: 'No template-related content found in browser cache.' });
            }
            
        } catch (error) {
            resultsEl.createEl('p', { text: `Error checking cache: ${(error as Error).message}` });
        }
    }
    
    /**
     * Check plugin folder for backup files
     */
    private checkPluginFolderForBackups(containerEl: HTMLElement) {
        const resultsEl = containerEl.createDiv({ cls: 'oom-recovery-results' });
        resultsEl.innerHTML = '';
        
        resultsEl.createEl('h4', { text: '?? Plugin Folder Search' });
        resultsEl.createEl('p', { 
            text: 'Check these locations in your vault for backup files:' 
        });
        
        const pathsList = resultsEl.createEl('ul');
        // COMPATIBILITY FIX: Use vault.configDir instead of hardcoded .obsidian
        const configDir = this.plugin.app.vault.configDir;
        pathsList.createEl('li', { text: `${configDir}/plugins/oneirometrics/` });
        pathsList.createEl('li', { text: `${configDir}/plugins/oneirometrics/data.json (main settings file)` });
        pathsList.createEl('li', { text: `${configDir}/plugins/oneirometrics/backups/ (if any)` });
        
        resultsEl.createEl('p', { 
            text: 'You can also check for .bak files or temporary files with your template content.' 
        });
    }
    
    /**
     * Show manual template restoration interface
     */
    private showManualTemplateRestore(containerEl: HTMLElement) {
        const restoreEl = containerEl.createDiv({ cls: 'oom-manual-restore' });
        SafeDOMUtils.safelyEmptyContainer(restoreEl);
        
        restoreEl.createEl('h4', { text: '?? Manual Template Restoration' });
        restoreEl.createEl('p', { 
            text: 'If you remember or have a copy of your template content, paste it here to restore:' 
        });
        
        const textarea = restoreEl.createEl('textarea');
        textarea.placeholder = 'Paste your template content here...';
        textarea.classList.add('oom-textarea-editor');
        
        
        
        
        const templateNameInput = restoreEl.createEl('input');
        templateNameInput.type = 'text';
        templateNameInput.placeholder = 'Template name...';
        templateNameInput.classList.add('oom-template-name-input');
        
        
        
        const restoreBtn = restoreEl.createEl('button', { 
            text: 'Restore Template',
            cls: 'mod-cta'
        });
        restoreBtn.addEventListener('click', () => {
            if (textarea.value.trim() && templateNameInput.value.trim()) {
                this.createNewTemplateFromContent(templateNameInput.value, textarea.value);
            } else {
                new Notice('Please provide both template name and content');
            }
        });
    }
    
    /**
     * Restore template from cached content
     */
    private async restoreTemplateFromCache(cachedContent: string) {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(cachedContent);
            if (parsed.name && parsed.content) {
                await this.createNewTemplateFromContent(parsed.name + ' (Recovered)', parsed.content);
                return;
            }
        } catch {
            // If not JSON, treat as plain content
        }
        
        // Create template with cached content
        const templateName = `Recovered Template ${Date.now()}`;
        await this.createNewTemplateFromContent(templateName, cachedContent);
    }
    
    /**
     * Create a new template from recovered content
     */
    private async createNewTemplateFromContent(name: string, content: string) {
        const newTemplate: JournalTemplate = {
            id: `template-${Date.now()}`,
            name: name,
            description: 'Recovered template content',
            content: content,
            structure: 'default-dream-structure',
            isTemplaterTemplate: false,
            templaterFile: ''
        };
        
        try {
            await this.saveTemplate(newTemplate);
            new Notice(`Template "${name}" recovered successfully!`);
        } catch (error) {
            new Notice(`Failed to restore template: ${(error as Error).message}`);
        }
    }
    
    /**
     * Parse the nested structure of callouts in content using the sophisticated logic from ContentParser
     */
    private parseCalloutStructure(content: string): CalloutNode[] {
        this.logger.info('CalloutParser', 'Starting callout structure parsing', {
            contentLength: content.length,
            contentPreview: content.substring(0, 500)
        });
        
        // Enhanced regex to match callout patterns with proper nesting detection
        // Changed from (\w+) to ([\w-]+) to include hyphens in callout names
        const calloutRegex = /^(\s*)(>+)\s*\[!([\w-]+)\](.*)$/gm;
        const matches: RegExpExecArray[] = [];
        let match: RegExpExecArray | null;
        
        while ((match = calloutRegex.exec(content)) !== null) {
            this.logger.info('CalloutParser', 'Found callout match', {
                fullMatch: match[0],
                spaces: match[1],
                chevrons: match[2],
                type: match[3],
                title: match[4],
                index: match.index,
                spacesLength: match[1].length,
                chevronsLength: match[2].length,
                calculatedDepth: match[1].length + match[2].length
            });
            matches.push(match);
        }
        
        this.logger.info('CalloutParser', 'Regex matching completed', {
            totalMatches: matches.length
        });
        
        if (matches.length === 0) {
            this.logger.warn('CalloutParser', 'No callout matches found, analyzing content for debugging');
            
            // Try a simpler pattern to see what's in the content
            const simplePattern = /\[!(\w+)\]/g;
            let simpleMatch;
            const simpleMatches = [];
            while ((simpleMatch = simplePattern.exec(content)) !== null) {
                simpleMatches.push(simpleMatch[0]);
            }
            
            this.logger.debug('CalloutParser', 'Simple pattern analysis', {
                simpleMatches: simpleMatches
            });
            
            // Show content lines that contain callout-like patterns
            const lines = content.split('\n');
            const calloutLines: { lineNumber: number; content: string }[] = [];
            lines.forEach((line, index) => {
                if (line.includes('[!')) {
                    calloutLines.push({
                        lineNumber: index + 1,
                        content: line
                    });
                }
            });
            
            this.logger.debug('CalloutParser', 'Lines containing callout patterns', {
                calloutLines: calloutLines
            });
        }
        
        // Convert matches to CalloutNode objects with position tracking
        const blocks: (CalloutNode & { position: { start: number; end: number } })[] = matches.map((match, index) => {
            const indentation = match[2].length; // Only count chevrons, not spaces
            const type = match[3];
            const title = match[4].trim();
            const position = {
                start: match.index!,
                end: match.index! + match[0].length
            };
            
            // Calculate line number
            const beforeMatch = content.substring(0, match.index!);
            const lineNumber = beforeMatch.split('\n').length;
            
            const nodeData = {
                type: type.toLowerCase().trim(),
                title: title,
                depth: indentation,
                lineNumber: lineNumber,
                chevronCount: match[2].length,
                spacesCount: match[1].length
            };
            
            this.logger.info('CalloutParser', 'Creating callout node', nodeData);

            return {
                type: type.toLowerCase().trim(),
                title: title,
                depth: indentation,
                children: [],
                lineNumber: lineNumber,
                position: position
            };
        });
        
        // Build parent-child relationships based on indentation and sequential order
        const rootBlocks: CalloutNode[] = [];
        
        // Sort by line number to ensure proper sequential processing
        blocks.sort((a, b) => a.lineNumber - b.lineNumber);
        
        // Use a stack-based approach to build the hierarchy
        const parentStack: (CalloutNode & { position: { start: number; end: number } })[] = [];
        
        for (const block of blocks) {
            const currentDepth = block.depth;
            
            console.log('?? Processing callout:', block.type, 'depth:', currentDepth, 'line:', block.lineNumber);
            this.logger.info('CalloutParser', 'Processing block for nesting', {
                type: block.type,
                depth: currentDepth,
                lineNumber: block.lineNumber
            });
            
            // Pop from stack until we find a suitable parent (with lower depth)
            while (parentStack.length > 0 && parentStack[parentStack.length - 1].depth >= currentDepth) {
                const popped = parentStack.pop();
                console.log('?? Popped from stack:', popped?.type, 'depth:', popped?.depth);
            }
            
            console.log('?? Stack after popping:', parentStack.map(p => `${p.type}(${p.depth})`));
            
            // If we have a potential parent in the stack
            if (parentStack.length > 0) {
                const parent = parentStack[parentStack.length - 1];
                console.log('?? Found parent:', parent.type, 'depth:', parent.depth, 'for child:', block.type, 'depth:', currentDepth);
                this.logger.info('CalloutParser', 'Found parent via stack', {
                    child: block.type,
                    childDepth: currentDepth,
                    parent: parent.type,
                    parentDepth: parent.depth
                });
                parent.children.push(block);
        } else {
                console.log('?? Adding as root:', block.type, 'depth:', currentDepth);
                this.logger.info('CalloutParser', 'Adding root level callout', {
                    type: block.type,
                    depth: currentDepth
                });
                rootBlocks.push(block);
            }
            
            // Add current block to stack for potential future children
            parentStack.push(block);
            console.log('?? Added to stack:', block.type, 'Stack now:', parentStack.map(p => `${p.type}(${p.depth})`));
        }
        
        this.logger.info('CalloutParser', 'Callout structure parsing completed', {
            rootBlocksCount: rootBlocks.length,
            totalNodes: matches.length
        });
        
        return rootBlocks;
    }
    
    /**
     * Recursively count callout types in a nested structure
     */
    private countCalloutTypes(nodes: CalloutNode[], calloutsFound: Record<string, number>) {
        for (const node of nodes) {
            calloutsFound[node.type] = (calloutsFound[node.type] || 0) + 1;
            
            if (node.children.length > 0) {
                this.countCalloutTypes(node.children, calloutsFound);
            }
        }
    }

    /**
     * Export all templates to a JSON file with user-chosen filename
     */
    private async exportTemplates() {
        const templates = this.plugin.settings.linting?.templates || [];
        
        if (templates.length === 0) {
            new Notice('No templates to export.');
            return;
        }

        try {
            // Create export data with metadata
            const exportData = {
                exportDate: new Date().toISOString(),
                exportedFrom: 'OneiroMetrics Obsidian Plugin',
                version: '1.0',
                templateCount: templates.length,
                templates: templates
            };

            // Convert to JSON with pretty formatting
            const jsonData = JSON.stringify(exportData, null, 2);
            
            // Create blob and download
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link with suggested filename
            const currentDate = new Date().toISOString().split('T')[0];
            const suggestedFilename = `oneirometrics-templates-${currentDate}.json`;
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = suggestedFilename;
            downloadLink.classList.add('oom-hidden');
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            URL.revokeObjectURL(url);
            
            new Notice(`Exported ${templates.length} templates successfully!`);
            this.logger.info('Templates', `Exported ${templates.length} templates to ${suggestedFilename}`);
            
        } catch (error) {
            this.logger.error('Templates', 'Failed to export templates:', error as Error);
            new Notice('Failed to export templates. Please try again.');
        }
    }

    /**
     * Import templates from a JSON file with user file selection
     */
    private async importTemplates() {
        try {
            // Create file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.classList.add('oom-hidden');
            
            fileInput.addEventListener('change', async (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (!file) return;
                
                try {
                    const fileContent = await file.text();
                    await this.processImportedTemplates(fileContent, file.name);
                } catch (error) {
                    this.logger.error('Templates', 'Failed to read import file:', error as Error);
                    new Notice(`Failed to read file: ${(error as Error).message}`);
                }
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
            
        } catch (error) {
            this.logger.error('Templates', 'Failed to import templates:', error as Error);
            new Notice('Failed to import templates. Please try again.');
        }
    }

    /**
     * Process imported template data
     */
    private async processImportedTemplates(fileContent: string, filename: string) {
        try {
            const importData = JSON.parse(fileContent);
            
            let importedTemplates: any[];
            let importFormat: string;
            
            // Handle both single template and templates array formats
            if (importData.templates && Array.isArray(importData.templates)) {
                // Multi-template format: { templates: [...] }
                importedTemplates = importData.templates;
                importFormat = 'multi-template array';
                this.logger.debug('Templates', `Import detected multi-template format with ${importedTemplates.length} templates`);
            } else if (importData.name && importData.content !== undefined) {
                // Single template format: { name: "...", content: "...", ... }
                importedTemplates = [importData];
                importFormat = 'single template';
                this.logger.debug('Templates', `Import detected single template format: "${importData.name}"`);
            } else {
                this.logger.warn('Templates', 'Import failed: invalid format', { 
                    hasTemplatesArray: !!importData.templates,
                    hasName: !!importData.name,
                    hasContent: importData.content !== undefined,
                    keys: Object.keys(importData)
                });
                new Notice('Invalid template file format. Expected either a single template object or JSON with templates array.');
                return;
            }
            
            // Validate that we have at least one template
            if (!importedTemplates.length) {
                this.logger.warn('Templates', 'Import failed: no templates found', { importFormat });
                new Notice('No templates found in the imported file.');
                return;
            }
            
            this.logger.info('Templates', `Processing ${importedTemplates.length} template(s) from ${importFormat}`, { filename });
            const existingTemplates = this.plugin.settings.linting?.templates || [];
            
            // Check for conflicts and show import dialog
            await this.showImportConfirmationDialog(importedTemplates, existingTemplates, filename);
            
        } catch (error) {
            this.logger.error('Templates', 'Failed to parse import data:', error as Error);
            new Notice('Invalid JSON file. Please check the file format.');
        }
    }

    /**
     * Show import confirmation dialog with conflict resolution
     */
    private async showImportConfirmationDialog(importedTemplates: JournalTemplate[], existingTemplates: JournalTemplate[], filename: string) {
        const modal = new Modal(this.app);
        modal.titleEl.textContent = 'Import Templates';
        
        const { contentEl } = modal;
        
        contentEl.createEl('h3', { text: `Import from ${filename}` });
        contentEl.createEl('p', { text: `Found ${importedTemplates.length} templates to import.` });
        
        // Check for conflicts
        const conflicts: { imported: JournalTemplate; existing: JournalTemplate }[] = [];
        const newTemplates: JournalTemplate[] = [];
        
        importedTemplates.forEach(imported => {
            const existing = existingTemplates.find(existing => 
                existing.name === imported.name || existing.id === imported.id
            );
            if (existing) {
                conflicts.push({ imported, existing });
            } else {
                newTemplates.push(imported);
            }
        });
        
        if (newTemplates.length > 0) {
            contentEl.createEl('p', { text: `${newTemplates.length} new templates will be added.` });
        }
        
        if (conflicts.length > 0) {
            contentEl.createEl('p', { 
                text: `${conflicts.length} templates have naming conflicts.`,
                cls: 'oom-warning'
            });
            
            const conflictSection = contentEl.createDiv({ cls: 'oom-import-conflicts' });
            conflictSection.createEl('h4', { text: 'Conflict Resolution' });
            
            const resolutionSelect = conflictSection.createEl('select');
            resolutionSelect.createEl('option', { value: 'skip', text: 'Skip conflicting templates' });
            resolutionSelect.createEl('option', { value: 'replace', text: 'Replace existing templates' });
            resolutionSelect.createEl('option', { value: 'rename', text: 'Import with new names (add suffix)' });
        }
        
        const buttonContainer = contentEl.createDiv({ cls: 'oom-dialog-buttons' });
        
        
        
        
        
        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'oom-button'
        });
        cancelBtn.addEventListener('click', () => modal.close());
        
        const importBtn = buttonContainer.createEl('button', {
            text: 'Import',
            cls: 'oom-button mod-cta'
        });
        importBtn.addEventListener('click', async () => {
            const resolution = conflicts.length > 0 ? 
                (contentEl.querySelector('select') as HTMLSelectElement).value : 'none';
            await this.executeTemplateImport(importedTemplates, existingTemplates, resolution);
            modal.close();
            // Refresh the templates display
            this.loadJournalStructureContent();
        });
        
        modal.open();
    }

    /**
     * Execute the template import with the chosen resolution strategy
     */
    private async executeTemplateImport(importedTemplates: JournalTemplate[], existingTemplates: JournalTemplate[], resolution: string) {
        try {
            // Ensure linting settings exist
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = {
                    enabled: true,
                    rules: [],
                    structures: [],
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
                            error: '?',
                            warning: '??',
                            info: '??'
                        },
                        quickFixesEnabled: true
                    }
                } as JournalStructureSettings;
            }

            let importCount = 0;
            let skipCount = 0;
            let replaceCount = 0;

            for (const importedTemplate of importedTemplates) {
                const existingIndex = existingTemplates.findIndex(existing => 
                    existing.name === importedTemplate.name || existing.id === importedTemplate.id
                );
                
                if (existingIndex >= 0) {
                    // Handle conflict
                    switch (resolution) {
                        case 'skip':
                            skipCount++;
                            break;
                        case 'replace':
                            this.plugin.settings.linting.templates[existingIndex] = {
                                ...importedTemplate,
                                id: existingTemplates[existingIndex].id // Keep original ID
                            };
                            replaceCount++;
                            break;
                        case 'rename':
                            const newTemplate = {
                                ...importedTemplate,
                                id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                name: `${importedTemplate.name} (imported)`
                            };
                            this.plugin.settings.linting.templates.push(newTemplate);
                            importCount++;
                            break;
                    }
        } else {
                    // No conflict, add new template
                    const newTemplate = {
                        ...importedTemplate,
                        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    };
                    this.plugin.settings.linting.templates.push(newTemplate);
                    importCount++;
                }
            }

            await this.plugin.saveSettings();
            
            let message = `Import completed! `;
            if (importCount > 0) message += `${importCount} templates imported. `;
            if (replaceCount > 0) message += `${replaceCount} templates replaced. `;
            if (skipCount > 0) message += `${skipCount} templates skipped.`;
            
            new Notice(message);
            this.logger.info('Templates', `Import completed: ${importCount} imported, ${replaceCount} replaced, ${skipCount} skipped`);
            
        } catch (error) {
            this.logger.error('Templates', 'Failed to execute template import:', error as Error);
            new Notice('Failed to import templates. Please try again.');
        }
    }

    /**
     * Show dialog for selecting individual templates to export
     */
    private async showTemplateExportDialog() {
        const templates = this.plugin.settings.linting?.templates || [];
        
        if (templates.length === 0) {
            new Notice('No templates available to export.');
            return;
        }

        const modal = new Modal(this.app);
        modal.titleEl.textContent = 'Export Selected Templates';
        
        const { contentEl } = modal;
        
        contentEl.createEl('h3', { text: 'Select Templates to Export' });
        contentEl.createEl('p', { text: 'Choose which templates you want to export:' });
        
        const templateList = contentEl.createDiv({ cls: 'oom-template-selection-list' });
        templateList.classList.add('oom-template-list');
        
        
        
        
        
        
        const checkboxes: { template: JournalTemplate; checkbox: HTMLInputElement }[] = [];
        
        templates.forEach(template => {
            const templateItem = templateList.createDiv({ cls: 'oom-template-selection-item' });
            templateItem.classList.add('oom-template-item');
            
            
            
            
            const checkbox = templateItem.createEl('input', { type: 'checkbox' });
            checkbox.classList.add('oom-template-checkbox');
            
            const labelContainer = templateItem.createDiv();
            labelContainer.createEl('strong', { text: template.name });
            
            if (template.description) {
                labelContainer.createEl('br');
                labelContainer.createEl('span', { 
                    text: template.description,
                    cls: 'oom-template-desc'
                });
            }
            
            checkboxes.push({ template, checkbox });
        });
        
        const selectAllContainer = contentEl.createDiv({ cls: 'oom-select-all' });
        selectAllContainer.classList.add('oom-select-all-container');
        
        const selectAllCheckbox = selectAllContainer.createEl('input', { type: 'checkbox' });
        selectAllCheckbox.classList.add('oom-select-all-checkbox');
        selectAllContainer.createEl('label', { text: 'Select All' });
        
        selectAllCheckbox.addEventListener('change', () => {
            checkboxes.forEach(({ checkbox }) => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
        
        const buttonContainer = contentEl.createDiv({ cls: 'oom-dialog-buttons' });
        
        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'oom-button'
        });
        cancelBtn.addEventListener('click', () => modal.close());
        
        const exportBtn = buttonContainer.createEl('button', {
            text: 'Export Selected',
            cls: 'oom-button mod-cta'
        });
        exportBtn.addEventListener('click', async () => {
            const selectedTemplates = checkboxes
                .filter(({ checkbox }) => checkbox.checked)
                .map(({ template }) => template);
                
            if (selectedTemplates.length === 0) {
                new Notice('Please select at least one template to export.');
                return;
            }
            
            await this.exportSelectedTemplates(selectedTemplates);
            modal.close();
        });
        
        modal.open();
    }

    /**
     * Export selected templates to a file
     */
    private async exportSelectedTemplates(templates: JournalTemplate[]) {
        try {
            // Create export data
            const exportData = {
                exportDate: new Date().toISOString(),
                exportedFrom: 'OneiroMetrics Obsidian Plugin',
                version: '1.0',
                templateCount: templates.length,
                templates: templates
            };

            const jsonData = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const currentDate = new Date().toISOString().split('T')[0];
            const suggestedFilename = templates.length === 1 
                ? `oneirometrics-template-${templates[0].name.replace(/[^a-zA-Z0-9]/g, '-')}-${currentDate}.json`
                : `oneirometrics-templates-selected-${currentDate}.json`;
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = suggestedFilename;
            downloadLink.classList.add('oom-hidden');
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            URL.revokeObjectURL(url);
            
            new Notice(`Exported ${templates.length} selected templates successfully!`);
            this.logger.info('Templates', `Exported ${templates.length} selected templates`);
            
        } catch (error) {
            this.logger.error('Templates', 'Failed to export selected templates:', error as Error);
            new Notice('Failed to export templates. Please try again.');
        }
    }

    // Helper function to get selection mode description
    private getSelectionModeDescription(mode: string): string {
        if (mode === 'notes' || mode === 'manual') {
            return 'Select individual notes to include in dream metrics';
        }
        if (mode === 'folder' || mode === 'automatic') {
            return 'Select a folder to recursively search for dream metrics';
        }
        return 'Choose how to select notes for metrics processing';
    }

    /**
     * Copy template to clipboard
     */
    private copyTemplateToClipboard(template: JournalTemplate) {
        try {
            const content = template.content || '';
            navigator.clipboard.writeText(content).then(() => {
                new Notice(`Template "${template.name}" structure copied to clipboard!`);
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                new Notice(`Template "${template.name}" structure copied to clipboard!`);
            });
        } catch (error) {
            this.logger?.error('CopyTemplate', 'Error copying template to clipboard', error as Error);
            new Notice('Failed to copy template to clipboard.');
        }
    }

    /**
     * Export template as JSON
     */
    private exportTemplateAsJSON(template: JournalTemplate) {
        const content = template.content || '';
        const jsonData = JSON.stringify({
            id: template.id,
            name: template.name,
            description: template.description,
            content: content,
            structure: template.structure,
            isTemplaterTemplate: template.isTemplaterTemplate,
            templaterFile: template.templaterFile
        }, null, 2);
        
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${template.name}.json`;
        downloadLink.classList.add('oom-hidden');
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        
        new Notice(`Template "${template.name}" exported as JSON.`);
    }

    /**
     * Populate template preview container with structure and content
     */
    private populateTemplatePreview(container: HTMLElement, template: JournalTemplate) {
        // Clear any existing content
        container.empty();
        
        // Description if available
        if (template.description) {
            const descSection = container.createEl('div', { cls: 'oom-preview-section' });
            descSection.createEl('span', { text: template.description });
        }
        
        // Content preview
        const codeBlock = container.createEl('pre', { cls: 'oom-template-preview-code' });
        
        // Get preview content
        let previewContent = template.content || '';
        if (previewContent.length > 500) {
            previewContent = previewContent.substring(0, 500) + '\n\n... (content truncated)';
        }
        
        codeBlock.textContent = previewContent || '(No content available)';
    }

    // Render metrics lists
    private renderMetricsLists(enabledSection: HTMLElement, disabledSection: HTMLElement) {
        // Helper function to add metric toggles with full functionality
        const addMetricToggle = (metric: DreamMetric, key: string, container: HTMLElement) => {
            const setting = new Setting(container)
                .setName(metric.name)
                .setDesc(metric.description || '')
                .addToggle(toggle => {
                    toggle.setValue(isMetricEnabled(metric))
                        .onChange(async (value) => {
                            // Update the metric directly
                            this.plugin.settings.metrics[key].enabled = value;
                            await this.plugin.saveSettings();
                            this.loadMetricsSettingsContent(); // Refresh the content
                        });
                })
                .addExtraButton(button => {
                    button.setIcon('pencil')
                        .setTooltip('Edit metric')
                        .onClick(() => {
                            // Import MetricEditorModal from settings.ts
                            const { MetricEditorModal } = require('../../../settings');
                            new MetricEditorModal(
                                this.app,
                                { ...metric },
                                Object.values(this.plugin.settings.metrics),
                                async (updatedMetric) => {
                                    // Use our helper to ensure the metric is complete
                                    this.logger.info('MetricEdit', 'Saving updated metric', {
                                        originalMetric: metric,
                                        updatedMetric,
                                        hasFrontmatterProperty: !!updatedMetric.frontmatterProperty,
                                        frontmatterValue: updatedMetric.frontmatterProperty
                                    });
                                    const completeUpdatedMetric = ensureCompleteMetric(updatedMetric);
                                    this.logger.info('MetricEdit', 'After ensureCompleteMetric', {
                                        completeMetric: completeUpdatedMetric,
                                        hasFrontmatterProperty: !!completeUpdatedMetric.frontmatterProperty,
                                        frontmatterValue: completeUpdatedMetric.frontmatterProperty
                                    });
                                    this.plugin.settings.metrics[updatedMetric.name] = completeUpdatedMetric;
                                    // If the name was changed, remove the old key
                                    if (updatedMetric.name !== key) {
                                        delete this.plugin.settings.metrics[key];
                                    }
                                    await this.plugin.saveSettings();
                                    this.loadMetricsSettingsContent(); // Refresh
                                },
                                true // isEditing
                            ).open();
                        });
                })
                .addExtraButton(button => {
                    button.setIcon('trash')
                        .setTooltip('Delete metric')
                        .onClick(() => {
                            delete this.plugin.settings.metrics[key];
                            this.plugin.saveSettings();
                            this.loadMetricsSettingsContent(); // Refresh the content
                        });
                });
                
            // Add drag handle
            const dragHandle = setting.controlEl.createEl('div', {
                cls: 'oom-drag-handle',
                attr: { 'data-index': key }
            });
            dragHandle.textContent = '⚐';
        };

        // Function to check if a metric should be displayed in settings
        const shouldDisplayInSettings = (metric: DreamMetric): boolean => {
            // Skip the Words metric as it's a calculated value
            return metric.name !== 'Words';
        };

        // Get all metrics from settings
        const allMetrics = Object.entries(this.plugin.settings.metrics || {});
        
        // Group metrics by enabled status
        const groupedMetrics = {
            enabled: [] as [string, DreamMetric][],
            disabled: [] as [string, DreamMetric][]
        };

        // Sort into enabled/disabled groups
        allMetrics.forEach(([key, metric]) => {
            // Only include metrics that should be displayed in settings
            if (shouldDisplayInSettings(metric)) {
                const group = isMetricEnabled(metric) ? groupedMetrics.enabled : groupedMetrics.disabled;
                group.push([key, metric]);
            }
        });

        // Helper function to sort metrics by order
        const sortMetricEntriesByOrder = (
            metricEntries: [string, DreamMetric][],
            orderArray: string[]
        ): [string, DreamMetric][] => {
            return metricEntries.sort(([keyA, metricA], [keyB, metricB]) => {
                const indexA = orderArray.indexOf(metricA.name);
                const indexB = orderArray.indexOf(metricB.name);
                
                // If both metrics are in the order array, sort by their position
                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }
                
                // If only A is in the order array, it comes first
                if (indexA !== -1) return -1;
                
                // If only B is in the order array, it comes first
                if (indexB !== -1) return 1;
                
                // If neither is in the order array, sort alphabetically
                return metricA.name.localeCompare(metricB.name);
            });
        };

        // Import the order arrays from settings
        const { RECOMMENDED_METRICS_ORDER, DISABLED_METRICS_ORDER } = require('../../../settings');

        // Sort metrics by the predefined order
        if (groupedMetrics.enabled.length > 0) {
            groupedMetrics.enabled = sortMetricEntriesByOrder(
                groupedMetrics.enabled, 
                RECOMMENDED_METRICS_ORDER
            );
        }

        if (groupedMetrics.disabled.length > 0) {
            groupedMetrics.disabled = sortMetricEntriesByOrder(
                groupedMetrics.disabled,
                DISABLED_METRICS_ORDER
            );
        }

        // Clear existing content
        SafeDOMUtils.safelyEmptyContainer(enabledSection);
        enabledSection.createEl('h3', { 
            text: 'Enabled Metrics',
            cls: 'oom-hub-section-title' 
        });

        SafeDOMUtils.safelyEmptyContainer(disabledSection);
        disabledSection.createEl('h3', { 
            text: 'Disabled Metrics',
            cls: 'oom-hub-section-title' 
        });

        // Render enabled metrics
        if (groupedMetrics.enabled.length > 0) {
            groupedMetrics.enabled.forEach(([key, metric]) => {
                addMetricToggle(metric, key, enabledSection);
            });
        } else {
            enabledSection.createEl('p', { 
                text: 'No metrics are currently enabled. Enable some metrics below or add new ones.',
                cls: 'oom-hub-empty-state' 
            });
        }

        // Render disabled metrics
        if (groupedMetrics.disabled.length > 0) {
            groupedMetrics.disabled.forEach(([key, metric]) => {
                addMetricToggle(metric, key, disabledSection);
            });
        } else {
            disabledSection.createEl('p', { 
                text: 'All available metrics are currently enabled.',
                cls: 'oom-hub-empty-state' 
            });
        }
    }

    /**
     * Show processing feedback in the Dream Scrape tab
     */
    public showScrapeFeedback(message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info'): void {
        if (!this.feedbackArea) return;
        
        this.feedbackArea.empty();
        this.feedbackArea.classList.remove('oom-hidden'); this.feedbackArea.classList.add('oom-visible');
        
        const feedbackContent = this.feedbackArea.createDiv({ cls: `oom-feedback-content oom-feedback-${type}` });
        
        // Add icon based on type
        const icon = feedbackContent.createSpan({ cls: 'oom-feedback-icon' });
        switch (type) {
            case 'info':
                setIcon(icon, 'info');
                break;
            case 'warning':
                setIcon(icon, 'alert-triangle');
                break;
            case 'success':
                setIcon(icon, 'check-circle');
                break;
            case 'error':
                setIcon(icon, 'x-circle');
                break;
        }
        
        // Add message
        const messageEl = feedbackContent.createSpan({ cls: 'oom-feedback-message' });
        messageEl.textContent = message;
    }
    
    /**
     * Show backup warning with action buttons in the Dream Scrape tab
     */
    public showBackupWarning(onProceed: () => void, onCancel: () => void): void {
        if (!this.feedbackArea) return;
        
        this.feedbackArea.empty();
        this.feedbackArea.classList.remove('oom-hidden'); this.feedbackArea.classList.add('oom-visible');
        
        const warningContent = this.feedbackArea.createDiv({ cls: 'oom-feedback-content oom-feedback-warning' });
        
        // Warning icon and message
        const icon = warningContent.createSpan({ cls: 'oom-feedback-icon' });
        setIcon(icon, 'alert-triangle');
        
        const messageEl = warningContent.createSpan({ cls: 'oom-feedback-message' });
        messageEl.textContent = 'Warning: Backup is disabled. Updating the project note may overwrite existing content. Proceed?';
        
        // Action buttons
        const buttonContainer = warningContent.createDiv({ cls: 'oom-feedback-buttons' });
        
        const cancelButton = buttonContainer.createEl('button', { 
            text: 'Cancel',
            cls: 'oom-button'
        });
        cancelButton.addEventListener('click', () => {
            this.hideFeedback();
            onCancel();
        });
        
        const proceedButton = buttonContainer.createEl('button', { 
            text: 'Proceed',
            cls: 'oom-button mod-warning'
        });
        proceedButton.addEventListener('click', () => {
            this.hideFeedback();
            onProceed();
        });
    }
    
    /**
     * Hide the feedback area
     */
    public hideFeedback(): void {
        if (!this.feedbackArea) return;
        this.feedbackArea.classList.remove('oom-visible'); this.feedbackArea.classList.add('oom-hidden');
        this.feedbackArea.empty();
    }

    /**
     * Set up event listeners for scrape operations
     */
    private setupScrapeEventListeners(): void {
        // Remove any existing listeners to avoid duplicates
        this.plugin.scrapeEventEmitter.removeAllListeners();
        
        // Listen for started events
        this.plugin.scrapeEventEmitter.on('started', (event) => {
            this.showScrapeFeedback(event.message, 'info');
        });
        
        // Listen for progress events
        this.plugin.scrapeEventEmitter.on('progress', (event) => {
            this.showScrapeFeedback(event.message, 'info');
        });
        
        // Listen for backup warning events
        this.plugin.scrapeEventEmitter.on('backup-warning', (event) => {
            if (event.data?.onProceed && event.data?.onCancel) {
                // Mark as handled by HubModal to prevent global fallback handler
                event.data.isHandled = true;
                this.showBackupWarning(event.data.onProceed, event.data.onCancel);
            }
        });
        
        // Listen for completion events
        this.plugin.scrapeEventEmitter.on('completed', (event) => {
            this.showScrapeFeedback(event.message, 'success');
            
            // Enable the open note button
            if (this.openNoteButton) {
                this.openNoteButton.disabled = false;
                this.openNoteButton.classList.add('enabled');
                this.hasScraped = true;
            }
            
            // Hide feedback after a few seconds
            setTimeout(() => {
                this.hideFeedback();
            }, 3000);
        });
        
        // Listen for error events
        this.plugin.scrapeEventEmitter.on('error', (event) => {
            this.showScrapeFeedback(event.message, 'error');
        });
    }
    /**
     * Show component metrics configuration modal
     */
    private async showComponentMetricsConfig(component: 'calendar' | 'charts'): Promise<void> {
        const { ComponentMetricsModal } = await import('../modals/ComponentMetricsModal');
        const modal = new ComponentMetricsModal(
            this.app, 
            this.plugin, 
            component,
            () => {
                // Refresh the metrics settings content when modal closes
                this.loadMetricsSettingsContent();
            }
        );
        modal.open();
    }

    /**
     * Validate project note configuration and show feedback if there are issues
     */
    private validateProjectNoteConfiguration(): void {
        const projectNotePath = this.plugin.settings.projectNote;
        
        if (!projectNotePath) {
            this.showScrapeFeedback(
                '?? Please select your OneiroMetrics note above before scraping.',
                'warning'
            );
            return;
        }
        
        const projectFile = this.app.vault.getAbstractFileByPath(projectNotePath);
        if (!projectFile) {
            this.showScrapeFeedback(
                `?? OneiroMetrics note not found: "${projectNotePath}". Please select an existing file above.`,
                'warning'
            );
            return;
        }
        
        // If we get here, configuration is valid - hide any existing feedback
        this.hideFeedback();
    }

}


