/**
 * HubModal
 * 
 * The central OneiroMetrics Hub modal that provides access to all plugin functionality
 * in a unified tabbed interface. Includes Dashboard, Dream Scrape, Journal Structure, 
 * Callout Quick Copy, and detailed metric reference information.
 */

import { App, Modal, MarkdownRenderer, setIcon, Setting, Notice, TFile, ButtonComponent, DropdownComponent, TextAreaComponent, TextComponent } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
import { DreamMetric } from '../../types/core';
import { CalloutStructure, JournalTemplate, JournalStructureSettings } from '../../types/journal-check';
import safeLogger from '../../logging/safe-logger';
import { getLogger } from '../../logging';
import { createSelectedNotesAutocomplete, createFolderAutocomplete } from '../../../autocomplete';

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
    private progressContent: HTMLElement | null = null;
    private statusText: HTMLElement | null = null;
    private progressBar: HTMLElement | null = null;
    private progressFill: HTMLElement | null = null;
    private detailsText: HTMLElement | null = null;
    private scrapeButton: HTMLButtonElement | null = null;
    private openNoteButton: HTMLButtonElement | null = null;
    
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
    }
    
    onOpen() {
        try {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass('oom-metrics-tabs-modal');
            
            // Create header
            contentEl.createEl('h1', { 
                text: 'OneiroMetrics Hub', 
                cls: 'oom-metrics-tabs-header' 
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
        this.createCalloutSettingsTab(); // Moved up and renamed
        this.createDreamScrapeTab();
        this.createJournalStructureTab();
        
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
    
    // Create Dream Scrape tab
    private createDreamScrapeTab() {
        const dreamScrapeTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'dream-scrape' }
        });
        
        dreamScrapeTab.createDiv({ 
            text: 'Dream Scrape', 
            cls: 'oom-hub-tab-label' 
        });
        
        dreamScrapeTab.addEventListener('click', () => {
            this.selectTab('dream-scrape');
        });
    }
    
    // Create Journal Structure tab
    private createJournalStructureTab() {
        const journalStructureTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'journal-structure' }
        });
        
        journalStructureTab.createDiv({ 
            text: 'Journal Structure', 
            cls: 'oom-hub-tab-label' 
        });
        
        journalStructureTab.addEventListener('click', () => {
            this.selectTab('journal-structure');
        });
    }
    
    // Create Callout Settings tab (renamed from Callout Quick Copy)
    private createCalloutSettingsTab() {
        const calloutSettingsTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'callout-settings' }
        });

        calloutSettingsTab.createDiv({ 
            text: 'Callout Settings', 
            cls: 'oom-hub-tab-label' 
        });

        calloutSettingsTab.addEventListener('click', () => {
            this.selectTab('callout-settings');
        });
    }
    
    // Create Overview tab
    private createOverviewTab() {
        const overviewTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'overview' }
        });
        
        overviewTab.createDiv({ 
            text: 'Reference Overview', 
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
        } else if (tabId === 'journal-structure') {
            this.loadJournalStructureContent();
        } else if (tabId === 'callout-settings') {
            this.loadCalloutSettingsContent();
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
        
        // Add welcome text
        const welcomeText = this.contentContainer.createDiv({ 
            cls: 'oom-metrics-tabs-overview-text' 
        });
        
        welcomeText.createEl('p', { 
            text: 'Welcome to the OneiroMetrics guide for understanding your dreams! This section provides clear definitions for each metric you can track in your dream journal. Use these descriptions to consistently score your dream entries, helping you unlock powerful insights into your nightly experiences and discover fascinating patterns in your subconscious mind.'
        });
        
        // Add content from sources-and-inspirations.md
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
- **Dream Theme**: Inspired by archetypal and thematic approaches to dream interpretation

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

### Conclusion

OneiroMetrics provides a flexible framework built upon these general understandings, allowing individuals to tailor their dream tracking to their personal exploration goals. The specific metrics and their scoring guidelines were developed through an iterative process aimed at creating a practical and insightful tool for Obsidian users.

The plugin does not prescribe any particular interpretation or meaning to dream content - it simply provides tools to help users discover their own patterns and insights through consistent tracking and reflection.
`;
    }
    
    // Load and display content for the selected metric
    private loadMetricContent(metric: DreamMetric) {
        this.contentContainer.empty();
        
        // Metric header
        this.contentContainer.createEl('h3', { 
            text: `${metric.name} (Score ${metric.minValue}-${metric.maxValue})`,
            cls: 'oom-metrics-tabs-metric-header' 
        });
        
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
                
                // Remove inline styles added by MarkdownRenderer
                tableDiv.style.removeProperty('overflow-x');
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
This metric captures the **richness and vividness of the sensory information** you recall from your dream experience. It's about how much detail you remember across your five senses—what you saw, heard, felt, smelled, and tasted. Tracking this helps you gauge the overall immersive quality of your dreams and can indicate improvements in your recall abilities.
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
            'Dream Theme': `
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
| 2 (Vaguely Familiar)      | You experience a sense of déjà vu or a faint feeling of having been in a similar place before, but you cannot specifically identify the location or its connection to your waking memories. |
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
        return this.getAllMetrics().filter(m => 
            ['Dream Theme', 'Lucidity Level', 'Dream Coherence', 'Environmental Familiarity'].includes(m.name)
        );
    }
    
    private getMemoryRecallMetrics(): DreamMetric[] {
        return this.getAllMetrics().filter(m => 
            ['Ease of Recall', 'Recall Stability'].includes(m.name)
        );
    }
    
    // Temporary method to get all metrics
    private getAllMetrics(): DreamMetric[] {
        // This is a temporary solution until we implement the plugin methods
        return [
            {
                name: 'Sensory Detail',
                icon: 'eye',
                minValue: 1,
                maxValue: 5,
                description: 'Level of sensory information recalled from the dream',
                enabled: true
            },
            {
                name: 'Emotional Recall',
                icon: 'heart',
                minValue: 1,
                maxValue: 5,
                description: 'Ability to recall emotions from the dream',
                enabled: true
            },
            {
                name: 'Descriptiveness',
                icon: 'pen-tool',
                minValue: 1,
                maxValue: 5,
                description: 'Detail level in your written description',
                enabled: true
            },
            {
                name: 'Character Roles',
                icon: 'user-cog',
                minValue: 1,
                maxValue: 5,
                description: 'Prominence of characters in the dream',
                enabled: false
            },
            {
                name: 'Confidence Score',
                icon: 'check-circle',
                minValue: 1,
                maxValue: 5,
                description: 'Confidence in your memory of the dream',
                enabled: true
            },
            {
                name: 'Characters Count',
                icon: 'users',
                minValue: 0,
                maxValue: 100,
                description: 'Number of characters in the dream',
                enabled: false
            },
            {
                name: 'Familiar Count',
                icon: 'user-check',
                minValue: 0,
                maxValue: 100,
                description: 'Number of familiar characters',
                enabled: false
            },
            {
                name: 'Unfamiliar Count',
                icon: 'user-x',
                minValue: 0,
                maxValue: 100,
                description: 'Number of unfamiliar characters',
                enabled: false
            },
            {
                name: 'Characters List',
                icon: 'users-round',
                minValue: 0,
                maxValue: 0,
                description: 'List of characters in the dream',
                enabled: false
            },
            {
                name: 'Dream Theme',
                icon: 'sparkles',
                minValue: 0,
                maxValue: 0,
                description: 'Main theme of the dream',
                enabled: false
            },
            {
                name: 'Character Clarity/Familiarity',
                icon: 'user-search',
                minValue: 1,
                maxValue: 5,
                description: 'The distinctness and recognizability of the individual characters appearing in your dream',
                enabled: false
            },
            {
                name: 'Lucidity Level',
                icon: 'wand-2',
                minValue: 1,
                maxValue: 5,
                description: 'Awareness that you were dreaming',
                enabled: false
            },
            {
                name: 'Dream Coherence',
                icon: 'brain-circuit',
                minValue: 1,
                maxValue: 5,
                description: 'How logical or coherent the dream narrative was',
                enabled: false
            },
            {
                name: 'Environmental Familiarity',
                icon: 'map',
                minValue: 1,
                maxValue: 5,
                description: 'How familiar the dream setting was',
                enabled: false
            },
            {
                name: 'Lost Segments',
                icon: 'puzzle',
                minValue: 0,
                maxValue: 10,
                description: 'Number of gaps or forgotten segments',
                enabled: true
            },
            {
                name: 'Ease of Recall',
                icon: 'brain',
                minValue: 1,
                maxValue: 5,
                description: 'How easily you remembered the dream',
                enabled: false
            },
            {
                name: 'Recall Stability',
                icon: 'anchor',
                minValue: 1,
                maxValue: 5,
                description: 'How stable the memory remains over time',
                enabled: false
            }
        ];
    }

    // Display Dashboard content
    private loadDashboardContent() {
        this.contentContainer.empty();
        
        // Add welcome text
        const welcomeText = this.contentContainer.createDiv({ 
            cls: 'oom-metrics-tabs-dashboard-text' 
        });
        
        welcomeText.createEl('h2', { text: 'Dashboard' });
        
        welcomeText.createEl('p', { 
            text: 'Welcome to Dream Metrics! Manage all aspects of your dream journal from this central hub.'
        });
        
        // Quick Actions Section
        const quickActionsSection = this.contentContainer.createDiv({ cls: 'oom-dashboard-section' });
        quickActionsSection.createEl('h3', { text: 'Quick Actions' });
        
        const quickActionsGrid = quickActionsSection.createDiv({ cls: 'oom-quick-actions-grid' });
        
        this.createQuickActionButton(quickActionsGrid, 'Scrape Metrics', 'sparkles', () => {
            // Navigate to Dream Scrape tab
            this.selectTab('dream-scrape');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Journal Structure', 'check-circle', () => {
            this.selectTab('journal-structure');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'View Metrics', 'bar-chart', () => {
            const projectNote = this.plugin.settings.projectNote;
            if (projectNote) {
                const file = this.app.vault.getAbstractFileByPath(projectNote);
                if (file) {
                    this.app.workspace.openLinkText(projectNote, '', true);
                } else {
                    new Notice('Metrics note not found. Please set the path in settings.');
                }
            } else {
                new Notice('No metrics note configured. Please set the path in settings.');
            }
        });
        
        this.createQuickActionButton(quickActionsGrid, 'View Metrics Descriptions', 'book-open', () => {
            // Navigate to Reference Overview tab
            this.selectTab('overview');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Open Settings', 'settings', () => {
            // Close the Hub modal first
            this.close();
            
            // Then open the Obsidian Settings to OneiroMetrics tab
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById('oneirometrics');
        });
        
        this.createQuickActionButton(quickActionsGrid, 'Help & Docs', 'help-circle', () => {
            window.open('https://github.com/banisterious/obsidian-oneirometrics/blob/main/docs/user/guides/usage.md', '_blank');
        });
        
        // Create 2-column grid container for Recent Activity and Status Overview
        const infoGridContainer = this.contentContainer.createDiv({ cls: 'oom-dashboard-info-grid' });
        
        // Recent Activity Section
        const recentActivitySection = infoGridContainer.createDiv({ cls: 'oom-dashboard-section' });
        recentActivitySection.createEl('h4', { text: 'Recent Activity' });
        
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
        statusSection.createEl('h3', { text: 'Status Overview' });
        
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
            cls: 'oom-quick-action-button', 
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
        
        welcomeText.createEl('h2', { text: 'Dream Scrape' });
        
        welcomeText.createEl('p', { 
            text: 'Extract dream metrics from journal entries.'
        });
        
        // Mode Selection Section
        const modeSection = this.contentContainer.createDiv({ cls: 'oom-modal-section' });
        
        modeSection.createEl('h4', { text: 'Selection Mode' });
        modeSection.createEl('p', { 
            text: 'Choose whether to scrape individual notes or a folder',
            cls: 'oom-section-helper'
        });
        
        const modeRow = modeSection.createDiv({ cls: 'oom-actions-row' });
        
        const modeDropdown = modeRow.createEl('select', { cls: 'oom-dropdown' });
        modeDropdown.createEl('option', { text: 'Notes', value: 'notes' });
        modeDropdown.createEl('option', { text: 'Folder', value: 'folder' });
        modeDropdown.value = this.selectionMode;
        
        // File/Folder Selector Section
        const selectorSection = this.contentContainer.createDiv({ cls: 'oom-modal-section' });
        
        if (this.selectionMode === 'folder') {
            selectorSection.createEl('h4', { text: 'Selected Folder' });
            selectorSection.createEl('p', { 
                text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)',
                cls: 'oom-section-helper'
            });
            
            // Replace placeholder with actual folder selector
            const folderSelectorContainer = selectorSection.createDiv('oom-folder-selector-container');
            createFolderAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: folderSelectorContainer,
                selectedFolder: this.selectedFolder,
                onChange: (folder: string) => {
                    this.selectedFolder = folder;
                    this.plugin.settings.selectedFolder = folder;
                    this.plugin.saveSettings();
                }
            });
        } else {
            selectorSection.createEl('h4', { text: 'Selected Notes' });
            selectorSection.createEl('p', { 
                text: 'Notes to search for dream metrics (select one or more)',
                cls: 'oom-section-helper'
            });
            
            // Replace placeholder with actual notes selector
            const notesSelectorContainer = selectorSection.createDiv('oom-notes-selector-container');
            createSelectedNotesAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: notesSelectorContainer,
                selectedNotes: this.selectedNotes,
                onChange: (notes: string[]) => {
                    this.selectedNotes = notes;
                    this.plugin.settings.selectedNotes = notes;
                    this.plugin.saveSettings();
                }
            });
        }
        
        // Progress Section
        const progressSection = this.contentContainer.createDiv({ cls: 'oom-modal-section oom-progress-section' });
        
        progressSection.createEl('h4', { text: 'Progress' });
        
        this.progressContent = progressSection.createDiv({ cls: 'oom-progress-content' });
        this.statusText = this.progressContent.createEl('div', { cls: 'oom-status-text' });
        this.progressBar = this.progressContent.createEl('div', { cls: 'oom-progress-bar' });
        this.progressFill = this.progressBar.createEl('div', { cls: 'oom-progress-fill' });
        this.detailsText = this.progressContent.createEl('div', { cls: 'oom-details-text' });
        
        // Create the sticky footer for scrape actions
        const scrapeFooter = this.contentContainer.createDiv({ cls: 'oom-dream-scrape-footer' });
        
        // Scrape Action Section
        const scrapeRow = scrapeFooter.createDiv({ cls: 'oom-actions-row' });
        
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
        
        // Mode dropdown change handler
        modeDropdown.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value as 'notes' | 'folder';
            this.selectionMode = value;
            this.plugin.settings.selectionMode = value;
            this.plugin.saveSettings();
            
            // Rebuild the selector section with the new mode
            selectorSection.empty();
            
            if (value === 'folder') {
                selectorSection.createEl('h4', { text: 'Selected Folder' });
                selectorSection.createEl('p', { 
                    text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)',
                    cls: 'oom-section-helper'
                });
                
                // Add folder selector
                const folderSelectorContainer = selectorSection.createDiv('oom-folder-selector-container');
                createFolderAutocomplete({
                    app: this.app,
                    plugin: this.plugin,
                    containerEl: folderSelectorContainer,
                    selectedFolder: this.selectedFolder,
                    onChange: (folder: string) => {
                        this.selectedFolder = folder;
                        this.plugin.settings.selectedFolder = folder;
                        this.plugin.saveSettings();
                    }
                });
            } else {
                selectorSection.createEl('h4', { text: 'Selected Notes' });
                selectorSection.createEl('p', { 
                    text: 'Notes to search for dream metrics (select one or more)',
                    cls: 'oom-section-helper'
                });
                
                // Add notes selector
                const notesSelectorContainer = selectorSection.createDiv('oom-notes-selector-container');
                createSelectedNotesAutocomplete({
                    app: this.app,
                    plugin: this.plugin,
                    containerEl: notesSelectorContainer,
                    selectedNotes: this.selectedNotes,
                    onChange: (notes: string[]) => {
                        this.selectedNotes = notes;
                        this.plugin.settings.selectedNotes = notes;
                        this.plugin.saveSettings();
                    }
                });
            }
        });
        
        // Scrape button click handler
        this.scrapeButton.addEventListener('click', () => {
            if (!this.isScraping) {
                this.isScraping = true;
                this.scrapeButton.disabled = true;
                this.plugin.scrapeMetrics();
                // Set timer to enable the open note button after scraping
                setTimeout(() => {
                    if (this.openNoteButton) {
                        this.openNoteButton.disabled = false;
                        this.openNoteButton.classList.add('enabled');
                        this.hasScraped = true;
                    }
                }, 2000); // This is a placeholder, actual enabling would happen when scraping completes
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
                (this.app as any).setting.open('oneirometrics');
            }
        });
    }

    // Enhanced Journal Structure content with full functionality - Phase 2.4 Redesign
    private loadJournalStructureContent() {
        this.contentContainer.empty();
        
        if (this.journalStructureMode === 'wizard' && this.wizardState) {
            // Render wizard mode with preserved state
            this.renderEmbeddedWizard();
        } else {
            // Render normal mode
            this.renderNormalJournalStructureMode();
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
        
        headerSection.createEl('h2', { text: 'Journal Structure' });
        
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
        
        // Get existing templates for display
        const templates = this.plugin.settings.linting?.templates || [];
        
        // Template creation button - switches to wizard mode
        const createBtnContainer = templateSection.createDiv({ cls: 'oom-setting' });
        createBtnContainer.style.marginTop = '1em';
        const createBtn = createBtnContainer.createEl('button', { 
            text: 'Open Template Wizard',
            cls: 'oom-button-primary'
        });
        createBtn.addEventListener('click', () => {
            this.enterWizardMode();
        });
        
        // Show existing templates count if any
        if (templates.length > 0) {
            const statusEl = templateSection.createDiv({ cls: 'oom-template-status' });
            statusEl.style.marginTop = '1em';
            statusEl.createEl('h4', { text: 'Existing Templates' });
            
            // Create a table-like display for templates
            const templatesContainer = statusEl.createDiv({ cls: 'oom-templates-list' });
            templatesContainer.style.border = '1px solid var(--background-modifier-border)';
            templatesContainer.style.borderRadius = '4px';
            templatesContainer.style.marginTop = '0.5em';
            
            templates.forEach((template, index) => {
                const templateRow = templatesContainer.createDiv({ cls: 'oom-template-row' });
                templateRow.style.padding = '0.75em 1em';
                templateRow.style.borderBottom = index < templates.length - 1 ? '1px solid var(--background-modifier-border)' : 'none';
                templateRow.style.display = 'flex';
                templateRow.style.justifyContent = 'space-between';
                templateRow.style.alignItems = 'center';
                
                const templateInfo = templateRow.createDiv({ cls: 'oom-template-info' });
                templateInfo.createEl('strong', { text: template.name });
                templateInfo.createEl('br');
                
                const detailsLine = templateInfo.createEl('span', { cls: 'oom-template-details' });
                detailsLine.style.color = 'var(--text-muted)';
                detailsLine.style.fontSize = '0.9em';
                
                if (template.isTemplaterTemplate && template.templaterFile) {
                    detailsLine.textContent = `Templater: ${template.templaterFile}`;
                } else if (template.structure) {
                    detailsLine.textContent = `Structure: ${template.structure}`;
                } else {
                    detailsLine.textContent = 'Direct input template';
                }
                
                const templateActions = templateRow.createDiv({ cls: 'oom-template-actions' });
                templateActions.style.display = 'flex';
                templateActions.style.gap = '0.5em';
                
                const editBtn = templateActions.createEl('button', {
                    text: 'Edit',
                    cls: 'oom-template-action-btn'
                });
                editBtn.style.padding = '0.25em 0.75em';
                editBtn.style.fontSize = '0.85em';
                editBtn.addEventListener('click', () => {
                    this.editExistingTemplate(template);
                });
                
                const viewBtn = templateActions.createEl('button', {
                    text: 'View',
                    cls: 'oom-template-action-btn'
                });
                viewBtn.style.padding = '0.25em 0.75em';
                viewBtn.style.fontSize = '0.85em';
                viewBtn.addEventListener('click', () => {
                    this.viewTemplateContent(template);
                });
                
                const deleteBtn = templateActions.createEl('button', {
                    text: 'Delete',
                    cls: 'oom-template-action-btn oom-template-delete-btn'
                });
                deleteBtn.style.padding = '0.25em 0.75em';
                deleteBtn.style.fontSize = '0.85em';
                deleteBtn.style.backgroundColor = 'var(--color-red)';
                deleteBtn.style.color = 'var(--text-on-accent)';
                deleteBtn.style.border = 'none';
                deleteBtn.style.borderRadius = '3px';
                deleteBtn.addEventListener('click', () => {
                    this.deleteTemplate(template);
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
        const titleText = `Journal Structure - Template Wizard (Step ${this.wizardState!.currentStep} of ${totalSteps})`;
        headerSection.createEl('h2', { text: titleText });
        
        // Add breadcrumb with back button
        const breadcrumbContainer = headerSection.createDiv({ cls: 'oom-wizard-breadcrumb' });
        const backButton = breadcrumbContainer.createEl('button', {
            text: '← Back to Overview',
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
        
        // Add description paragraphs for context (same as normal mode)
        headerSection.createEl('p', { 
            text: 'Configure journal structure settings, templates, validation rules, and interface preferences.',
            cls: 'oom-journal-structure-description'
        });
        
        headerSection.createEl('p', { 
            text: 'Structures define the organizational framework (what callout types are allowed, how they nest, validation rules), while Templates provide the actual content implementations that reference and conform to those structures. Each template must reference exactly one structure, but multiple templates can use the same structure for different content styles.',
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
                stepContainer.style.display = 'none';
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
        
        welcomeText.createEl('h2', { text: 'Callout Settings' });
        
        welcomeText.createEl('p', { 
            text: 'Configure the callout names used throughout OneiroMetrics. These settings control how callouts are generated in Quick Copy and recognized during scraping.'
        });

        // Global state for all sections
        let calloutMetadata = '';
        let singleLine = false;
        let flattenNested = false;
        
        // Get dynamic callout names with fallbacks
        const getJournalCalloutName = () => this.plugin.settings.journalCalloutName || 'journal';
        const getDreamDiaryCalloutName = () => this.plugin.settings.dreamDiaryCalloutName || 'dream-diary';
        const getCalloutName = () => this.plugin.settings.calloutName || 'dream-metrics';

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
                    updateAllCallouts();
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
                    updateAllCallouts();
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
                    updateAllCallouts();
                }));

        // Include Date Fields Setting
        new Setting(settingsContainer)
            .setName('Include Date Fields')
            .setDesc('Include "Date:" fields in Journal and Dream Diary callouts. Disable this if you use daily notes with dates in filenames or headers.')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.includeDateFields !== false)
                    .onChange(async (value) => {
                        this.plugin.settings.includeDateFields = value;
                        await this.plugin.saveSettings();
                        updateAllCallouts();
                    });
            });

        // Single-Line Toggle (renamed)
        new Setting(settingsContainer)
            .setName('Single-Line Metrics Callout Structure')
            .setDesc('Show all fields on a single line in all callout structures')
            .addToggle(toggle => {
                toggle.setValue(singleLine)
                    .onChange(async (value) => {
                        singleLine = value;
                        updateAllCallouts();
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
                        updateAllCallouts();
                    });
            });

        // Callout Metadata Field
        new Setting(settingsContainer)
            .setName('Callout Metadata')
            .setDesc('Default metadata to include in all callouts (applies to all sections below)')
            .addText(text => text
                .setPlaceholder('Enter metadata')
                .setValue(calloutMetadata)
                .onChange(async (value) => {
                    calloutMetadata = value;
                    updateAllCallouts();
                    await this.plugin.saveSettings();
                }));

        // Add section separator
        this.contentContainer.createEl('div', { cls: 'oom-section-border' });

        // Quick Copy Section Header
        this.contentContainer.createEl('h2', { text: 'Quick Copy' });
        
        this.contentContainer.createEl('p', { 
            text: 'Generate and customize callouts for quick copying into your journal entries using the settings above.'
        });

        // Helper functions for callout generation
        const buildDreamMetricsCallout = () => {
            const meta = calloutMetadata.trim();
            const metaStr = meta ? `|${meta}` : '';
            const calloutName = getCalloutName();
            const header = `> [!${calloutName}${metaStr}]`;
            const metrics = [
                '',
                'Sensory Detail:',
                'Emotional Recall:',
                'Lost Segments:',
                'Descriptiveness:',
                'Confidence Score:'
            ];
            if (singleLine) {
                return `${header}\n> ${metrics.slice(1).join(' , ')}`;
            } else {
                return `${header}\n> ${metrics.join(' \n> ')}`;
            }
        };

        // Helper to build journal callout
        const buildJournalCallout = () => {
            const meta = calloutMetadata.trim();
            const metaStr = meta ? `|${meta}` : '';
            const calloutName = getJournalCalloutName();
            const header = `> [!${calloutName}${metaStr}]`;
            const fields = [
                '',
                ...(this.plugin.settings.includeDateFields !== false ? ['Date:'] : []),
                'Location:',
                'Mood:',
                'Key Events:',
                'Reflections:'
            ];
            if (singleLine) {
                return `${header}\n> ${fields.slice(1).join(' , ')}`;
            } else {
                return `${header}\n> ${fields.join(' \n> ')}`;
            }
        };

        // Helper to build dream diary callout
        const buildDreamDiaryCallout = () => {
            const meta = calloutMetadata.trim();
            const metaStr = meta ? `|${meta}` : '';
            const calloutName = getDreamDiaryCalloutName();
            const header = `> [!${calloutName}${metaStr}]`;
            const fields = [
                '',
                ...(this.plugin.settings.includeDateFields !== false ? ['Date:'] : []),
                'Dream Title:',
                'Vividness:',
                'Emotions:',
                'Symbols:',
                'Personal Meaning:'
            ];
            if (singleLine) {
                return `${header}\n> ${fields.slice(1).join(' , ')}`;
            } else {
                return `${header}\n> ${fields.join(' \n> ')}`;
            }
        };

        // Helper to build nested callout
        const buildNestedCallout = () => {
            const meta = calloutMetadata.trim();
            const metaStr = meta ? `|${meta}` : '';
            const journalCalloutName = getJournalCalloutName();
            const dreamDiaryCalloutName = getDreamDiaryCalloutName();
            const metricsCalloutName = getCalloutName();
            
            if (flattenNested) {
                // Create separate callouts when flattened
                const journalFields = [
                    '',
                    ...(this.plugin.settings.includeDateFields !== false ? ['Date:'] : []),
                    'Location:',
                    'Mood:',
                    'Key Events:',
                    'Reflections:'
                ];
                const journalContent = journalFields.join(' \n> ');
                const journalCallout = `> [!${journalCalloutName}${metaStr}]${journalContent}`;
                
                const dreamDiaryFields = [
                    '',
                    ...(this.plugin.settings.includeDateFields !== false ? ['Date:'] : []),
                    'Dream Title:',
                    'Vividness:',
                    'Emotions:',
                    'Symbols:',
                    'Personal Meaning:'
                ];
                const dreamDiaryContent = dreamDiaryFields.join(' \n> ');
                const diaryCallout = `> [!${dreamDiaryCalloutName}${metaStr}]${dreamDiaryContent}`;
                
                const metricsFields = [
                    '',
                    'Sensory Detail: 1-5',
                    'Emotional Recall: 1-5',
                    'Lost Segments: 0-10',
                    'Descriptiveness: 1-5',
                    'Confidence Score: 1-5'
                ];
                const metricsCallout = `> [!${metricsCalloutName}${metaStr}]\n> ${metricsFields.join(' \n> ')}`;
                
                return `${journalCallout}\n\n${diaryCallout}\n\n${metricsCallout}`;
            } else {
                // Create nested structure with conditional date fields
                const metricsFields = [
                    'Sensory Detail: 1-5',
                    'Emotional Recall: 1-5', 
                    'Lost Segments: 0-10',
                    'Descriptiveness: 1-5',
                    'Confidence Score: 1-5'
                ];
                
                // Apply single-line only to the metrics part
                const metricsContent = singleLine 
                    ? metricsFields.join(' , ')
                    : metricsFields.join(' \n> > > ');
                
                // Build the nested structure with conditional date fields
                let nestedContent = `> [!${journalCalloutName}${metaStr}]\n> Enter your dream here.\n>\n`;
                
                // Add dream diary section with conditional date field
                nestedContent += `> > [!${dreamDiaryCalloutName}${metaStr}]\n`;
                if (this.plugin.settings.includeDateFields !== false) {
                    nestedContent += `> > Date:\n`;
                }
                nestedContent += `> > Dream Title:\n> > Vividness:\n> > Emotions:\n> > Symbols:\n> > Personal Meaning:\n> >\n`;
                
                // Add metrics section
                nestedContent += `> > > [!${metricsCalloutName}${metaStr}]\n> > > ${metricsContent}`;
                
                return nestedContent;
            }
        };

        // Function to update all callout previews
        const updateAllCallouts = () => {
            // Update Journal section
            if (journalStructureEl) {
                journalStructureEl.textContent = buildJournalCallout();
                this.applyCalloutBoxStyles(journalStructureEl);
            }
            
            // Update Dream Diary section
            if (dreamDiaryStructureEl) {
                dreamDiaryStructureEl.textContent = buildDreamDiaryCallout();
                this.applyCalloutBoxStyles(dreamDiaryStructureEl);
            }
            
            // Update Dream Metrics section
            if (dreamMetricsStructureEl) {
                dreamMetricsStructureEl.textContent = buildDreamMetricsCallout();
                this.applyCalloutBoxStyles(dreamMetricsStructureEl);
            }
            
            // Update Nested section
            if (nestedStructureEl) {
                nestedStructureEl.textContent = buildNestedCallout();
                this.applyCalloutBoxStyles(nestedStructureEl);
            }
        };

        // Create variables to hold the callout structure elements
        let journalStructureEl: HTMLElement;
        let dreamDiaryStructureEl: HTMLElement;
        let dreamMetricsStructureEl: HTMLElement;
        let nestedStructureEl: HTMLElement;

        // 1. Journal Section
        const journalSection = this.contentContainer.createDiv({ cls: 'oom-callout-section' });
        journalSection.createEl('h3', { text: 'Journal' });
        
        journalStructureEl = journalSection.createEl('div', { cls: 'oom-callout-structure-box' });
        journalStructureEl.textContent = buildJournalCallout();
        this.applyCalloutBoxStyles(journalStructureEl);
        
        const journalCopyBtn = journalSection.createEl('button', { 
            text: 'Copy Journal Callout',
            cls: 'oom-copy-button'
        });
        this.applyCopyButtonStyles(journalCopyBtn);
        journalCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(buildJournalCallout());
            new Notice('Journal callout copied to clipboard!');
        });

        // 2. Dream Diary Section
        const dreamDiarySection = this.contentContainer.createDiv({ cls: 'oom-callout-section' });
        dreamDiarySection.createEl('h3', { text: 'Dream Diary' });
        
        dreamDiaryStructureEl = dreamDiarySection.createEl('div', { cls: 'oom-callout-structure-box' });
        dreamDiaryStructureEl.textContent = buildDreamDiaryCallout();
        this.applyCalloutBoxStyles(dreamDiaryStructureEl);
        
        const dreamDiaryCopyBtn = dreamDiarySection.createEl('button', { 
            text: 'Copy Dream Diary Callout',
            cls: 'oom-copy-button'
        });
        this.applyCopyButtonStyles(dreamDiaryCopyBtn);
        dreamDiaryCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(buildDreamDiaryCallout());
            new Notice('Dream Diary callout copied to clipboard!');
        });

        // 3. Dream Metrics Section
        const dreamMetricsSection = this.contentContainer.createDiv({ cls: 'oom-callout-section' });
        dreamMetricsSection.createEl('h3', { text: 'Dream Metrics' });
        
        dreamMetricsStructureEl = dreamMetricsSection.createEl('div', { cls: 'oom-callout-structure-box' });
        dreamMetricsStructureEl.textContent = buildDreamMetricsCallout();
        this.applyCalloutBoxStyles(dreamMetricsStructureEl);
        
        const dreamMetricsCopyBtn = dreamMetricsSection.createEl('button', { 
            text: 'Copy Dream Metrics Callout',
            cls: 'oom-copy-button'
        });
        this.applyCopyButtonStyles(dreamMetricsCopyBtn);
        dreamMetricsCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(buildDreamMetricsCallout());
            new Notice('Dream Metrics callout copied to clipboard!');
        });

        // 4. Nested (3-level) Section
        const nestedSection = this.contentContainer.createDiv({ cls: 'oom-callout-section' });
        nestedSection.createEl('h3', { text: 'Nested (3-level)' });
        
        nestedStructureEl = nestedSection.createEl('div', { cls: 'oom-callout-structure-box' });
        nestedStructureEl.textContent = buildNestedCallout();
        this.applyCalloutBoxStyles(nestedStructureEl);
        
        const nestedCopyBtn = nestedSection.createEl('button', { 
            text: 'Copy Nested Callout',
            cls: 'oom-copy-button'
        });
        this.applyCopyButtonStyles(nestedCopyBtn);
        nestedCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(buildNestedCallout());
            new Notice('Nested callout copied to clipboard!');
        });

        // Initial update of all callouts
        updateAllCallouts();
    }
    
    /**
     * Apply styles to the callout box
     */
    private applyCalloutBoxStyles(element: HTMLElement): void {
        element.style.width = '100%';
        element.style.minHeight = '90px';
        element.style.fontFamily = 'var(--font-monospace, monospace)';
        element.style.fontSize = '0.93em';
        element.style.background = 'var(--background-secondary)';
        element.style.border = '1px solid var(--border-color)';
        element.style.borderRadius = '4px';
        element.style.marginBottom = '1em';
        element.style.padding = '12px';
        element.style.whiteSpace = 'pre-wrap';
        element.style.wordBreak = 'break-word';
        element.style.userSelect = 'all';
    }
    
    /**
     * Apply styles to the copy button
     */
    private applyCopyButtonStyles(button: HTMLElement): void {
        button.style.marginBottom = '1.5em';
    }
    
    /**
     * Apply styles to the templater configuration section
     */
    private styleTemplaterConfigSection(
        configSection: HTMLElement, 
        statusEl: HTMLElement, 
        settingsBtn: HTMLElement
    ): void {
        // Section container styling
        configSection.style.marginBottom = '1.5em';
        configSection.style.padding = '1em';
        configSection.style.backgroundColor = 'var(--background-secondary)';
        configSection.style.borderRadius = '4px';
        configSection.style.border = '1px solid var(--background-modifier-border)';
        
        // Status element styling
        statusEl.style.marginBottom = '1em';
        
        // Apply styles to status paragraphs
        const successElements = statusEl.querySelectorAll('.oom-status-success');
        successElements.forEach((el: Element) => {
            (el as HTMLElement).style.color = 'var(--text-success)';
            (el as HTMLElement).style.fontWeight = '500';
        });
        
        const warningElements = statusEl.querySelectorAll('.oom-status-warning');
        warningElements.forEach((el: Element) => {
            (el as HTMLElement).style.color = 'var(--text-warning)';
            (el as HTMLElement).style.fontStyle = 'italic';
        });
        
        const errorElements = statusEl.querySelectorAll('.oom-status-error');
        errorElements.forEach((el: Element) => {
            (el as HTMLElement).style.color = 'var(--text-error)';
            (el as HTMLElement).style.fontWeight = '500';
        });
        
        const infoElements = statusEl.querySelectorAll('.oom-templater-folder-info, .oom-templater-count-info');
        infoElements.forEach((el: Element) => {
            (el as HTMLElement).style.color = 'var(--text-muted)';
            (el as HTMLElement).style.fontSize = '0.9em';
            (el as HTMLElement).style.margin = '0.25em 0';
        });
        
        const helpElements = statusEl.querySelectorAll('.oom-templater-help-text');
        helpElements.forEach((el: Element) => {
            (el as HTMLElement).style.color = 'var(--text-muted)';
            (el as HTMLElement).style.fontSize = '0.9em';
        });
        
        // Button container styling
        const buttonContainer = settingsBtn.parentElement;
        if (buttonContainer) {
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '0.5em';
            buttonContainer.style.flexWrap = 'wrap';
        }
        
        // Settings button styling
        settingsBtn.style.padding = '0.5em 1em';
        settingsBtn.style.backgroundColor = 'var(--interactive-accent)';
        settingsBtn.style.color = 'var(--text-on-accent)';
        settingsBtn.style.border = 'none';
        settingsBtn.style.borderRadius = '4px';
        settingsBtn.style.cursor = 'pointer';
        settingsBtn.style.fontSize = '0.9em';
        
        // Add hover effect for settings button
        settingsBtn.addEventListener('mouseenter', () => {
            settingsBtn.style.backgroundColor = 'var(--interactive-accent-hover)';
        });
        settingsBtn.addEventListener('mouseleave', () => {
            settingsBtn.style.backgroundColor = 'var(--interactive-accent)';
        });
        
        // Debug button styling (if it exists)
        const debugBtn = buttonContainer?.querySelector('.oom-templater-debug-button') as HTMLElement;
        if (debugBtn) {
            debugBtn.style.padding = '0.5em 1em';
            debugBtn.style.backgroundColor = 'var(--background-modifier-border)';
            debugBtn.style.color = 'var(--text-normal)';
            debugBtn.style.border = '1px solid var(--background-modifier-border)';
            debugBtn.style.borderRadius = '4px';
            debugBtn.style.cursor = 'pointer';
            debugBtn.style.fontSize = '0.9em';
            
            // Add hover effect for debug button
            debugBtn.addEventListener('mouseenter', () => {
                debugBtn.style.backgroundColor = 'var(--background-modifier-hover)';
            });
            debugBtn.addEventListener('mouseleave', () => {
                debugBtn.style.backgroundColor = 'var(--background-modifier-border)';
            });
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
                const templaterPlugin = (this.plugin.app as any).plugins?.plugins?.['templater-obsidian'];
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
                text: `✅ Templater plugin detected`,
                cls: 'oom-status-success'
            });
            statusEl.createEl('p', { 
                text: `📁 Template folder: ${templaterTemplateFolder}`,
                cls: 'oom-templater-folder-info'
            });
            statusEl.createEl('p', { 
                text: `📄 Templates found: ${templaterTemplates.length}`,
                cls: 'oom-templater-count-info'
            });
            
            if (templaterTemplates.length === 0 && templaterTemplateFolder !== 'Not configured') {
                statusEl.createEl('p', { 
                    text: '⚠️ No .md files found in template folder. Create some Templater templates to use this feature.',
                    cls: 'oom-status-warning'
                });
            } else if (templaterTemplateFolder === 'Not configured') {
                statusEl.createEl('p', { 
                    text: '⚠️ Templater template folder not configured. Go to Templater settings to set a template folder.',
                    cls: 'oom-status-warning'
                });
            }
        } else {
            statusEl.createEl('p', { 
                text: '❌ Templater plugin not found',
                cls: 'oom-status-error'
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
                (this.app as any).setting.open();
                (this.app as any).setting.openTabById('templater-obsidian');
            } else {
                // Open community plugins to install Templater
                (this.app as any).setting.open();
                (this.app as any).setting.openTabById('community-plugins');
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
                    const templaterPlugin = (this.plugin.app as any).plugins?.plugins?.['templater-obsidian'];
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
                    
                    // Also log to console as fallback
                    console.log('OneiroMetrics Templater Debug:', debugInfo);
                    
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
        createBtnContainer.style.marginTop = '1.5em';
        const createBtn = createBtnContainer.createEl('button', { 
            text: 'Open Template Wizard',
            cls: 'oom-button-primary'
        });
        createBtn.addEventListener('click', () => {
            this.enterWizardMode();
        });
        
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
                return 2; // Method selection → Template selection (with preview)
            case 'structure':
                return 3; // Method selection → Structure selection → Final preview
            case 'direct':
                return 2; // Method selection → Content editing (with preview)
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
                    const templaterPlugin = (this.plugin.app as any).plugins?.plugins?.['templater-obsidian'];
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
                    text: `✅ Templater plugin detected | 📁 Folder: ${templaterTemplateFolder} | 📄 Templates: ${templaterTemplates.length}`,
                    cls: 'oom-status-success'
                });
                
                if (templaterTemplates.length === 0) {
                    statusEl.createEl('p', { 
                        text: '⚠️ No .md files found in template folder.',
                        cls: 'oom-status-warning'
                    });
                }
            } else {
                statusEl.createEl('p', { 
                    text: '❌ Templater plugin not found',
                    cls: 'oom-status-error'
                });
            }
            
            // Apply inline styling
            templaterConfigSection.style.marginBottom = '1.5em';
            templaterConfigSection.style.padding = '1em';
            templaterConfigSection.style.backgroundColor = 'var(--background-secondary)';
            templaterConfigSection.style.borderRadius = '4px';
            templaterConfigSection.style.border = '1px solid var(--background-modifier-border)';
            
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
            const textareaContainer = container.createDiv({ cls: 'oom-direct-input-container' });
            
            const textarea = textareaContainer.createEl('textarea', {
                cls: 'oom-direct-input-textarea',
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
            
            // Style the textarea
            textarea.style.width = '100%';
            textarea.style.minHeight = '300px';
            textarea.style.fontFamily = 'var(--font-monospace)';
            textarea.style.fontSize = '14px';
            textarea.style.padding = '12px';
            textarea.style.border = '1px solid var(--background-modifier-border)';
            textarea.style.borderRadius = '4px';
            textarea.style.resize = 'vertical';
            
            // Set initial value
            textarea.value = this.wizardState!.content || '';
            
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
            } as any;
            
            // Helper buttons - replace simple button with dropdown
            const helpersContainer = container.createDiv({ cls: 'oom-content-helpers' });
            helpersContainer.style.marginTop = '10px';
            helpersContainer.style.display = 'flex';
            helpersContainer.style.gap = '10px';
            
            // Create dropdown for sample content
            const sampleDropdownContainer = helpersContainer.createDiv({ cls: 'oom-sample-dropdown-container' });
            sampleDropdownContainer.style.position = 'relative';
            sampleDropdownContainer.style.display = 'inline-block';
            
            const sampleDropdownBtn = sampleDropdownContainer.createEl('button', {
                text: 'Insert Sample Content ▼',
                cls: 'oom-helper-button oom-sample-dropdown-button'
            });
            sampleDropdownBtn.style.padding = '6px 12px';
            sampleDropdownBtn.style.fontSize = '14px';
            
            const sampleDropdownMenu = sampleDropdownContainer.createDiv({ cls: 'oom-sample-dropdown-menu' });
            sampleDropdownMenu.style.display = 'none';
            sampleDropdownMenu.style.position = 'absolute';
            sampleDropdownMenu.style.top = '100%';
            sampleDropdownMenu.style.left = '0';
            sampleDropdownMenu.style.backgroundColor = 'var(--background-primary)';
            sampleDropdownMenu.style.border = '1px solid var(--background-modifier-border)';
            sampleDropdownMenu.style.borderRadius = '4px';
            sampleDropdownMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            sampleDropdownMenu.style.zIndex = '1000';
            sampleDropdownMenu.style.minWidth = '200px';
            
            // Flat sample option
            const flatOption = sampleDropdownMenu.createDiv({ cls: 'oom-sample-option' });
            flatOption.style.padding = '8px 12px';
            flatOption.style.cursor = 'pointer';
            flatOption.style.borderBottom = '1px solid var(--background-modifier-border)';
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
                sampleDropdownMenu.style.display = 'none';
            });
            
            // Nested sample option
            const nestedOption = sampleDropdownMenu.createDiv({ cls: 'oom-sample-option' });
            nestedOption.style.padding = '8px 12px';
            nestedOption.style.cursor = 'pointer';
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
                sampleDropdownMenu.style.display = 'none';
            });
            
            // Hover effects
            flatOption.addEventListener('mouseenter', () => {
                flatOption.style.backgroundColor = 'var(--background-modifier-hover)';
            });
            flatOption.addEventListener('mouseleave', () => {
                flatOption.style.backgroundColor = '';
            });
            
            nestedOption.addEventListener('mouseenter', () => {
                nestedOption.style.backgroundColor = 'var(--background-modifier-hover)';
            });
            nestedOption.addEventListener('mouseleave', () => {
                nestedOption.style.backgroundColor = '';
            });
            
            // Toggle dropdown on button click
            let dropdownOpen = false;
            sampleDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownOpen = !dropdownOpen;
                sampleDropdownMenu.style.display = dropdownOpen ? 'block' : 'none';
                sampleDropdownBtn.textContent = dropdownOpen ? 'Insert Sample Content ▲' : 'Insert Sample Content ▼';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                if (dropdownOpen) {
                    dropdownOpen = false;
                    sampleDropdownMenu.style.display = 'none';
                    sampleDropdownBtn.textContent = 'Insert Sample Content ▼';
                }
            });
            
            const clearBtn = helpersContainer.createEl('button', {
                text: 'Clear',
                cls: 'oom-helper-button'
            });
            clearBtn.style.padding = '6px 12px';
            clearBtn.style.fontSize = '14px';
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
                description: 'Deep nested structure: journal-entry → dream-diary → dream-metrics',
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
                description: 'Simple nested structure: journal-entry → dream-metrics',
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
        // Enter wizard mode with the existing template data
        this.journalStructureMode = 'wizard';
        
        // Determine the method based on template properties
        let method: TemplateCreationMethod = 'direct';
        if (template.isTemplaterTemplate && template.templaterFile) {
            method = 'templater';
        } else if (template.structure) {
            method = 'structure';
        }
        
        // Find the structure if it exists
        let structure: CalloutStructure | null = null;
        if (template.structure) {
            structure = this.getAvailableStructures().find(s => s.id === template.structure) || null;
        }
        
        this.wizardState = {
            method,
            templaterFile: template.templaterFile || '',
            structure,
            content: template.content || '',
            templateName: template.name,
            templateDescription: template.description || '',
            isValid: true,
            currentStep: method === 'templater' ? 2 : (method === 'structure' ? 3 : 2)
        };
        
        // Re-render in wizard mode
        this.loadJournalStructureContent();
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
            text: '▼ Preview',
            cls: 'oom-preview-collapse-button'
        });
        
        this.wizardPreviewEl = previewSection.createDiv({ cls: 'oom-wizard-preview-content' });
        
        let isCollapsed = false;
        collapseButton.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            this.wizardPreviewEl!.style.display = isCollapsed ? 'none' : 'block';
            collapseButton.textContent = isCollapsed ? '▶ Preview' : '▼ Preview';
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
            this.wizardStepContainers[this.wizardState.currentStep - 1].style.display = 'none';
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
            this.wizardStepContainers[step - 1].style.display = 'block';
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
                explanation.innerHTML = `
                    <p><strong>Templater Support:</strong></p>
                    <ul>
                        <li><strong>Dynamic Version:</strong> Uses Templater's JavaScript execution and interactive prompts</li>
                        <li><strong>Static Fallback:</strong> Converts Templater syntax to placeholders for manual replacement</li>
                        <li><strong>Your Template Features:</strong>
                            <ul>
                                <li><code>tp.system.prompt()</code> → Interactive user prompts</li>
                                <li><code>&lt;%* ... -%&gt;</code> → JavaScript execution blocks</li>
                                <li><code>&lt;% variable %&gt;</code> → Variable insertion</li>
                            </ul>
                        </li>
                    </ul>
                `;
                explanation.style.marginTop = '1em';
                explanation.style.padding = '1em';
                explanation.style.backgroundColor = 'var(--background-primary)';
                explanation.style.borderRadius = '4px';
                explanation.style.fontSize = '14px';
                
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
                // If no child callouts, add metrics directly nested under root (2-level nesting)
                if (structure.metricsCallout) {
                    content += `>\n> > [!${structure.metricsCallout}]\n`;
                    content += `> > Sensory Detail: 1-5\n`;
                    content += `> > Emotional Recall: 1-5\n`;
                    content += `> > Lost Segments: 0-10\n`;
                    content += `> > Descriptiveness: 1-5\n`;
                    content += `> > Confidence Score: 1-5\n`;
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
            id: `template-${Date.now()}`,
            name: this.wizardState.templateName,
            description: this.wizardState.templateDescription,
            content: this.wizardState.content,
            structure: this.wizardState.structure?.id || '',
            isTemplaterTemplate: this.wizardState.method === 'templater',
            templaterFile: this.wizardState.templaterFile || ''
        };
        
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
                            error: '❌',
                            warning: '⚠️',
                            info: 'ℹ️'
                        },
                        quickFixesEnabled: false
                    }
                };
            }
            
            // Add template
            this.plugin.settings.linting.templates.push(template);
            
            // Save settings
            await this.plugin.saveSettings();
            
            new Notice(`Template "${template.name}" created successfully!`);
            
            // Exit wizard mode and return to overview
            this.exitWizardMode();
            
        } catch (error) {
            safeLogger.error('UI', 'Error saving template', error as Error);
            new Notice('Error saving template. Please try again.');
        }
    }
}
