/**
 * HubModal
 * 
 * The central OneiroMetrics Hub modal that provides access to all plugin functionality
 * in a unified tabbed interface. Includes Dashboard, Dream Scrape, Journal Structure, 
 * Callout Quick Copy, and detailed metric reference information.
 */

import { App, Modal, MarkdownRenderer, setIcon, Setting, Notice, TFile } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
import { DreamMetric } from '../../types/core';
import { CalloutStructure } from '../../types/journal-check';
import safeLogger from '../../logging/safe-logger';
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

export class HubModal extends Modal {
    private tabsContainer: HTMLElement;
    private contentContainer: HTMLElement;
    private selectedTab: string | null = null;
    
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
        this.createDreamScrapeTab();
        this.createJournalStructureTab();
        this.createCalloutQuickCopyTab();
        
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
    
    // Create Callout Quick Copy tab
    private createCalloutQuickCopyTab() {
        const calloutQuickCopyTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item oom-hub-tab-nav-item',
            attr: { 'data-tab-id': 'callout-quick-copy' }
        });
        
        calloutQuickCopyTab.createDiv({ 
            text: 'Callout Quick Copy', 
            cls: 'oom-hub-tab-label' 
        });
        
        calloutQuickCopyTab.addEventListener('click', () => {
            this.selectTab('callout-quick-copy');
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
        } else if (tabId === 'callout-quick-copy') {
            this.loadCalloutQuickCopyContent();
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
        
        this.createQuickActionButton(quickActionsGrid, 'Open Settings', 'settings', () => {
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById('oneirometrics');
        });
        
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
        
        // Add header section
        const headerSection = this.contentContainer.createDiv({ 
            cls: 'oom-journal-structure-header' 
        });
        
        headerSection.createEl('h2', { text: 'Journal Structure' });
        
        headerSection.createEl('p', { 
            text: 'Configure journal structure settings, templates, validation rules, and interface preferences.',
            cls: 'oom-journal-structure-description'
        });
        
        // Create main content container - single page layout
        const mainContainer = this.contentContainer.createDiv({ 
            cls: 'oom-journal-structure-main' 
        });
        
        // ========== VALIDATION SECTION ==========
        const validationSection = mainContainer.createDiv({ cls: 'oom-journal-section' });
        validationSection.createEl('h3', { text: 'Validation', cls: 'oom-section-header' });
        this.buildValidationSection(validationSection);
        
        // ========== STRUCTURES SECTION ==========
        const structuresSection = mainContainer.createDiv({ cls: 'oom-journal-section' });
        structuresSection.createEl('h3', { text: 'Structures', cls: 'oom-section-header' });
        this.buildStructuresSection(structuresSection);
        
        // ========== TEMPLATES SECTION ==========
        const templatesSection = mainContainer.createDiv({ cls: 'oom-journal-section' });
        templatesSection.createEl('h3', { text: 'Templates', cls: 'oom-section-header' });
        this.buildTemplatesSection(templatesSection);
        
        // ========== TEMPLATER INTEGRATION SECTION ==========
        const templaterSection = mainContainer.createDiv({ cls: 'oom-journal-section' });
        templaterSection.createEl('h3', { text: 'Templater Integration', cls: 'oom-section-header' });
        this.buildTemplaterSection(templaterSection);
        
        // ========== CONTENT ISOLATION SECTION ==========
        const contentIsolationSection = mainContainer.createDiv({ cls: 'oom-journal-section' });
        contentIsolationSection.createEl('h3', { text: 'Content Isolation', cls: 'oom-section-header' });
        this.buildContentIsolationSection(contentIsolationSection);
        
        // ========== INTERFACE SETTINGS SECTION ==========
        const interfaceSection = mainContainer.createDiv({ cls: 'oom-journal-section' });
        interfaceSection.createEl('h3', { text: 'Interface Settings', cls: 'oom-section-header' });
        this.buildInterfaceSection(interfaceSection);
    }

    // Build the Validation section (replaces Overview)
    private buildValidationSection(containerEl: HTMLElement) {
        // Enable/disable structure validation
        this.createJournalStructureSetting(
            containerEl, 
            'Enable Structure Validation', 
            'Validate journal entries against defined structures', 
            (value) => {
                if (!this.plugin.settings.linting) {
                    this.plugin.settings.linting = this.getDefaultLintingSettings();
                }
                this.plugin.settings.linting.enabled = value;
            }, 
            this.plugin.settings.linting?.enabled ?? true
        );
        
        // Show validation indicators in editor
        this.createJournalStructureSetting(
            containerEl, 
            'Show validation indicators in editor', 
            'Display real-time validation feedback', 
            (value) => {
                if (!this.plugin.settings.linting) {
                    this.plugin.settings.linting = this.getDefaultLintingSettings();
                }
                if (!this.plugin.settings.linting.userInterface) {
                    this.plugin.settings.linting.userInterface = this.getDefaultLintingSettings().userInterface;
                }
                this.plugin.settings.linting.userInterface.showInlineValidation = value;
            }, 
            this.plugin.settings.linting?.userInterface?.showInlineValidation ?? true
        );
    }
    
    // Helper method to create collapsible sections
    private createCollapsibleSection(containerEl: HTMLElement, title: string, expanded = true): HTMLElement {
        const sectionEl = containerEl.createDiv({ cls: 'oom-collapsible-section' });
        
        const headerEl = sectionEl.createDiv({ cls: 'oom-collapsible-header' });
        headerEl.createEl('h3', { text: title });
        
        const toggleEl = headerEl.createDiv({ cls: 'oom-collapsible-toggle' });
        setIcon(toggleEl, expanded ? 'chevron-down' : 'chevron-right');
        
        const contentEl = sectionEl.createDiv({ 
            cls: 'oom-collapsible-content' + (expanded ? '' : ' collapsed')
        });
        
        headerEl.addEventListener('click', () => {
            const isExpanded = toggleEl.getAttribute('data-expanded') !== 'false';
            toggleEl.setAttribute('data-expanded', isExpanded ? 'false' : 'true');
            setIcon(toggleEl, isExpanded ? 'chevron-right' : 'chevron-down');
            if (contentEl) {
                contentEl.toggleClass('collapsed', isExpanded);
            }
        });
        
        toggleEl.setAttribute('data-expanded', expanded ? 'true' : 'false');
        
        return contentEl;
    }
    
    // Helper method to create journal structure settings
    private createJournalStructureSetting(
        containerEl: HTMLElement, 
        name: string, 
        description: string, 
        onChange: (value: boolean) => void,
        defaultValue: boolean = true
    ) {
        const settingEl = containerEl.createDiv({ cls: 'oom-setting oom-setting-toggle' });
        
        const infoEl = settingEl.createDiv({ cls: 'oom-setting-info' });
        infoEl.createDiv({ text: name, cls: 'oom-setting-name' });
        infoEl.createDiv({ text: description, cls: 'oom-setting-desc' });
        
        const controlEl = settingEl.createDiv({ cls: 'oom-setting-control' });
        
        // Use Obsidian's native checkbox structure
        const toggleContainer = controlEl.createDiv({ cls: 'checkbox-container' });
        
        const toggleInput = toggleContainer.createEl('input', {
            type: 'checkbox'
        });
        toggleInput.checked = defaultValue;
        
        // Handle toggle interaction
        const handleToggle = () => {
            onChange(toggleInput.checked);
            this.plugin.saveSettings();
        };
        
        // Add change handler
        toggleInput.addEventListener('change', handleToggle);
        
        return settingEl;
    }
    
    // Helper method to get default linting settings
    private getDefaultLintingSettings() {
        return {
            enabled: true,
            rules: [],
            structures: [],
            templates: [],
            templaterIntegration: {
                enabled: false,
                folderPath: 'templates/dreams',
                defaultTemplate: ''
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
    }

    // Build the Structures section - Phase 2.4 Enhanced
    private buildStructuresSection(containerEl: HTMLElement) {
        // Action buttons bar
        const actionBar = containerEl.createDiv({ cls: 'oom-structures-action-bar' });
        
        const addStructureBtn = actionBar.createEl('button', {
            text: '+ Add Structure',
            cls: 'oom-button-primary'
        });
        addStructureBtn.addEventListener('click', () => {
            this.createNewStructure();
        });
        
        const importBtn = actionBar.createEl('button', {
            text: 'Import',
            cls: 'oom-button-secondary'
        });
        importBtn.addEventListener('click', () => {
            this.importStructures();
        });
        
        const exportAllBtn = actionBar.createEl('button', {
            text: 'Export All',
            cls: 'oom-button-secondary'
        });
        exportAllBtn.addEventListener('click', () => {
            this.exportAllStructures();
        });
        
        // Structures list
        let structures = this.plugin.settings.linting?.structures || [];
        
        // If no structures exist, create default ones
        if (structures.length === 0) {
            structures = this.createDefaultStructures();
            
            // Save default structures to settings
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = this.getDefaultLintingSettings();
            }
            this.plugin.settings.linting.structures = structures;
            this.plugin.saveSettings();
        }
        
        if (structures.length === 0) {
            const emptyState = containerEl.createDiv({ cls: 'oom-empty-state' });
            emptyState.createEl('p', { 
                text: 'No structures defined yet. Create your first structure to get started.'
            });
            
            const createFirstBtn = emptyState.createEl('button', {
                text: 'Create Your First Structure',
                cls: 'oom-button-primary'
            });
            createFirstBtn.addEventListener('click', () => {
                this.createNewStructure();
            });
        } else {
            const listContainer = containerEl.createDiv({ cls: 'oom-structures-list' });
            
            for (const structure of structures) {
                this.createStructureListItem(listContainer, structure);
            }
        }
    }
    
    /**
     * Create default structures for testing and initial setup
     */
    private createDefaultStructures() {
        return [
            {
                id: 'legacy-dream-structure',
                name: 'Legacy Dream Structure',
                description: 'Default OneiroMetrics dream journal structure (journal-entry/dream-diary/dream-metrics)',
                type: 'nested' as const,
                rootCallout: 'journal-entry',
                childCallouts: ['dream-diary'],
                metricsCallout: 'dream-metrics',
                enabled: true,
                isDefault: false,
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['journal-entry', 'dream-diary'],
                optionalFields: ['dream-metrics']
            },
            {
                id: 'av-journal-structure',
                name: 'AV Journal Structure',
                description: 'Audio-Visual journal format with av-journal root callout',
                type: 'nested' as const,
                rootCallout: 'av-journal',
                childCallouts: ['dream-diary'],
                metricsCallout: 'dream-metrics',
                enabled: true,
                isDefault: true,
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['av-journal', 'dream-diary'],
                optionalFields: ['dream-metrics']
            },
            {
                id: 'simple-dream-structure',
                name: 'Simple Dream Structure',
                description: 'Simplified flat structure for basic dream journaling',
                type: 'flat' as const,
                rootCallout: 'dream',
                childCallouts: [],
                metricsCallout: 'metrics',
                enabled: true,
                isDefault: false,
                dateFormat: ['YYYY-MM-DD'],
                requiredFields: ['dream'],
                optionalFields: ['metrics']
            }
        ];
    }

    // Build the Templates section  
    private buildTemplatesSection(containerEl: HTMLElement) {
        containerEl.createEl('p', { 
            text: 'Create and manage templates that follow your defined journal structures.' 
        });
        
        // Templates list
        const templates = this.plugin.settings.linting?.templates || [];
        
        if (templates.length === 0) {
            containerEl.createEl('p', { 
                text: 'No templates defined yet. Create your first template to get started.',
                cls: 'oom-empty-state'
            });
        } else {
            const listEl = containerEl.createDiv({ cls: 'oom-templates-list' });
            
            for (const template of templates) {
                this.createTemplateListItem(listEl, template);
            }
        }
        
        // Create new template button
        const createBtnContainer = containerEl.createDiv({ cls: 'oom-setting' });
        const createBtn = createBtnContainer.createEl('button', { 
            text: 'Create New Template',
            cls: 'oom-button-primary'
        });
        createBtn.addEventListener('click', () => {
            const { TemplateWizard } = require('../../journal_check/ui/TemplateWizard');
            new TemplateWizard(this.app, this.plugin, this.plugin.templaterIntegration).open();
        });
        
        // Import/export buttons
        const importExportEl = containerEl.createDiv({ cls: 'oom-import-export' });
        importExportEl.createEl('h4', { text: 'Import/Export Templates' });
        
        const importBtn = importExportEl.createEl('button', { 
            text: 'Import',
            cls: 'oom-button-secondary'
        });
        importBtn.addEventListener('click', () => {
            new Notice('Template import will be implemented soon');
        });
        
        const exportBtn = importExportEl.createEl('button', { 
            text: 'Export',
            cls: 'oom-button-secondary'
        });
        exportBtn.addEventListener('click', () => {
            new Notice('Template export will be implemented soon');
        });
    }

    // Build the Templater Integration section
    private buildTemplaterSection(containerEl: HTMLElement) {
        // Check if Templater is installed
        const templaterInstalled = this.plugin.templaterIntegration?.isTemplaterInstalled();
        
        if (!templaterInstalled) {
            const infoEl = containerEl.createDiv({ cls: 'oom-notice oom-notice-warning' });
            setIcon(infoEl.createSpan({ cls: 'oom-notice-icon' }), 'alert-triangle');
            infoEl.createSpan({ 
                text: 'Templater plugin is not installed. Install it to use dynamic templates.',
                cls: 'oom-notice-text'
            });
        }
        
        // Templater integration settings
        this.createJournalStructureSetting(containerEl, 'Enable Templater Integration', 'Use Templater templates for journal structures', (value) => {
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = this.getDefaultLintingSettings();
            }
            if (!this.plugin.settings.linting.templaterIntegration) {
                this.plugin.settings.linting.templaterIntegration = {
                    enabled: false,
                    folderPath: 'templates/dreams',
                    defaultTemplate: ''
                };
            }
            this.plugin.settings.linting.templaterIntegration.enabled = value;
        }, this.plugin.settings.linting?.templaterIntegration?.enabled ?? false);
        
        // Only show these settings if Templater is installed
        if (templaterInstalled) {
            // Templates folder setting
            const folderEl = containerEl.createDiv({ cls: 'oom-setting' });
            const folderInfo = folderEl.createDiv({ cls: 'oom-setting-info' });
            folderInfo.createDiv({ text: 'Templates Folder', cls: 'oom-setting-name' });
            folderInfo.createDiv({ text: 'Path to the folder containing Templater templates', cls: 'oom-setting-desc' });
            
            const folderControl = folderEl.createDiv({ cls: 'oom-setting-control' });
            const folderInput = folderControl.createEl('input', {
                type: 'text',
                value: this.plugin.settings.linting?.templaterIntegration?.folderPath || 'templates/dreams',
                placeholder: 'templates/dreams'
            });
            
            folderInput.addEventListener('change', async () => {
                if (!this.plugin.settings.linting) {
                    this.plugin.settings.linting = this.getDefaultLintingSettings();
                }
                if (!this.plugin.settings.linting.templaterIntegration) {
                    this.plugin.settings.linting.templaterIntegration = {
                        enabled: false,
                        folderPath: 'templates/dreams',
                        defaultTemplate: ''
                    };
                }
                this.plugin.settings.linting.templaterIntegration.folderPath = folderInput.value;
                await this.plugin.saveSettings();
            });
            
            // Default template setting
            const defaultEl = containerEl.createDiv({ cls: 'oom-setting' });
            const defaultInfo = defaultEl.createDiv({ cls: 'oom-setting-info' });
            defaultInfo.createDiv({ text: 'Default Template', cls: 'oom-setting-name' });
            defaultInfo.createDiv({ text: 'Template to use by default', cls: 'oom-setting-desc' });
            
            const defaultControl = defaultEl.createDiv({ cls: 'oom-setting-control' });
            const defaultInput = defaultControl.createEl('input', {
                type: 'text',
                value: this.plugin.settings.linting?.templaterIntegration?.defaultTemplate || '',
                placeholder: 'templates/dreams/default.md'
            });
            
            defaultInput.addEventListener('change', async () => {
                if (!this.plugin.settings.linting) {
                    this.plugin.settings.linting = this.getDefaultLintingSettings();
                }
                if (!this.plugin.settings.linting.templaterIntegration) {
                    this.plugin.settings.linting.templaterIntegration = {
                        enabled: false,
                        folderPath: 'templates/dreams',
                        defaultTemplate: ''
                    };
                }
                this.plugin.settings.linting.templaterIntegration.defaultTemplate = defaultInput.value;
                await this.plugin.saveSettings();
            });
        }
    }

    // Build the Content Isolation section
    private buildContentIsolationSection(containerEl: HTMLElement) {
        containerEl.createEl('p', { 
            text: 'Configure which elements should be ignored during validation.' 
        });
        
        // Get current settings or defaults
        const contentIsolation = this.plugin.settings.linting?.contentIsolation || this.getDefaultLintingSettings().contentIsolation;
        
        // Create settings for each option
        this.createJournalStructureSetting(containerEl, 'Ignore Images', 'Exclude images from structure validation', (value) => {
            this.updateContentIsolationSetting('ignoreImages', value);
        }, contentIsolation.ignoreImages);
        
        this.createJournalStructureSetting(containerEl, 'Ignore Links', 'Exclude links from structure validation', (value) => {
            this.updateContentIsolationSetting('ignoreLinks', value);
        }, contentIsolation.ignoreLinks);
        
        this.createJournalStructureSetting(containerEl, 'Ignore Formatting', 'Exclude bold, italic, etc. from structure validation', (value) => {
            this.updateContentIsolationSetting('ignoreFormatting', value);
        }, contentIsolation.ignoreFormatting);
        
        this.createJournalStructureSetting(containerEl, 'Ignore Headings', 'Exclude headings from structure validation', (value) => {
            this.updateContentIsolationSetting('ignoreHeadings', value);
        }, contentIsolation.ignoreHeadings);
        
        this.createJournalStructureSetting(containerEl, 'Ignore Code Blocks', 'Exclude code blocks from structure validation', (value) => {
            this.updateContentIsolationSetting('ignoreCodeBlocks', value);
        }, contentIsolation.ignoreCodeBlocks);
        
        this.createJournalStructureSetting(containerEl, 'Ignore Frontmatter', 'Exclude YAML frontmatter from structure validation', (value) => {
            this.updateContentIsolationSetting('ignoreFrontmatter', value);
        }, contentIsolation.ignoreFrontmatter);
        
        this.createJournalStructureSetting(containerEl, 'Ignore Comments', 'Exclude comments from structure validation', (value) => {
            this.updateContentIsolationSetting('ignoreComments', value);
        }, contentIsolation.ignoreComments);
        
        // Custom ignore patterns
        const customPatternsEl = containerEl.createDiv({ cls: 'oom-custom-patterns' });
        customPatternsEl.createEl('h4', { text: 'Custom Ignore Patterns' });
        
        const patterns = contentIsolation.customIgnorePatterns || [];
        
        if (patterns.length === 0) {
            customPatternsEl.createEl('p', { 
                text: 'No custom patterns defined yet.',
                cls: 'oom-empty-state'
            });
        } else {
            const listEl = customPatternsEl.createDiv({ cls: 'oom-patterns-list' });
            
            for (let i = 0; i < patterns.length; i++) {
                this.createPatternListItem(listEl, patterns[i], i);
            }
        }
        
        // Add new pattern
        const addPatternEl = customPatternsEl.createDiv({ cls: 'oom-setting' });
        const addPatternInfo = addPatternEl.createDiv({ cls: 'oom-setting-info' });
        addPatternInfo.createDiv({ text: 'Add Custom Pattern', cls: 'oom-setting-name' });
        addPatternInfo.createDiv({ text: 'Add a regex pattern to ignore during validation', cls: 'oom-setting-desc' });
        
        const addPatternControl = addPatternEl.createDiv({ cls: 'oom-setting-control' });
        const patternInput = addPatternControl.createEl('input', {
            type: 'text',
            placeholder: 'RegEx pattern'
        });
        
        const addBtn = addPatternControl.createEl('button', { 
            text: 'Add',
            cls: 'oom-button-secondary'
        });
        
        addBtn.addEventListener('click', () => {
            const pattern = patternInput.value.trim();
            if (pattern) {
                const patterns = [...(this.plugin.settings.linting?.contentIsolation?.customIgnorePatterns || [])];
                patterns.push(pattern);
                this.updateContentIsolationSetting('customIgnorePatterns', patterns);
                patternInput.value = '';
                
                // Refresh section
                this.loadJournalStructureContent();
            }
        });
    }

    // Build the Interface section
    private buildInterfaceSection(containerEl: HTMLElement) {
        containerEl.createEl('p', { 
            text: 'Configure how validation results are displayed in the editor.' 
        });
        
        // Get current settings
        const ui = this.plugin.settings.linting?.userInterface || this.getDefaultLintingSettings().userInterface;
        
        // UI settings
        this.createJournalStructureSetting(containerEl, 'Show Inline Validation', 'Display validation results within the editor', (value) => {
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = this.getDefaultLintingSettings();
            }
            if (!this.plugin.settings.linting.userInterface) {
                this.plugin.settings.linting.userInterface = this.getDefaultLintingSettings().userInterface;
            }
            this.plugin.settings.linting.userInterface.showInlineValidation = value;
        }, ui.showInlineValidation);
        
        this.createJournalStructureSetting(containerEl, 'Enable Quick Fixes', 'Allow quick fixing of validation issues', (value) => {
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = this.getDefaultLintingSettings();
            }
            if (!this.plugin.settings.linting.userInterface) {
                this.plugin.settings.linting.userInterface = this.getDefaultLintingSettings().userInterface;
            }
            this.plugin.settings.linting.userInterface.quickFixesEnabled = value;
        }, ui.quickFixesEnabled);
        
        // Severity indicators section
        const indicatorsEl = containerEl.createDiv({ cls: 'oom-severity-indicators' });
        indicatorsEl.createEl('h4', { text: 'Severity Indicators' });
        
        // Error indicator
        const errorEl = indicatorsEl.createDiv({ cls: 'oom-setting' });
        const errorInfo = errorEl.createDiv({ cls: 'oom-setting-info' });
        errorInfo.createDiv({ text: 'Error Indicator', cls: 'oom-setting-name' });
        errorInfo.createDiv({ text: 'Symbol to use for error severity issues', cls: 'oom-setting-desc' });
        
        const errorControl = errorEl.createDiv({ cls: 'oom-setting-control' });
        const errorInput = errorControl.createEl('input', {
            type: 'text',
            value: ui.severityIndicators.error
        });
        
        errorInput.addEventListener('change', async () => {
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = this.getDefaultLintingSettings();
            }
            if (!this.plugin.settings.linting.userInterface) {
                this.plugin.settings.linting.userInterface = this.getDefaultLintingSettings().userInterface;
            }
            this.plugin.settings.linting.userInterface.severityIndicators.error = errorInput.value;
            await this.plugin.saveSettings();
        });
        
        // Warning indicator
        const warningEl = indicatorsEl.createDiv({ cls: 'oom-setting' });
        const warningInfo = warningEl.createDiv({ cls: 'oom-setting-info' });
        warningInfo.createDiv({ text: 'Warning Indicator', cls: 'oom-setting-name' });
        warningInfo.createDiv({ text: 'Symbol to use for warning severity issues', cls: 'oom-setting-desc' });
        
        const warningControl = warningEl.createDiv({ cls: 'oom-setting-control' });
        const warningInput = warningControl.createEl('input', {
            type: 'text',
            value: ui.severityIndicators.warning
        });
        
        warningInput.addEventListener('change', async () => {
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = this.getDefaultLintingSettings();
            }
            if (!this.plugin.settings.linting.userInterface) {
                this.plugin.settings.linting.userInterface = this.getDefaultLintingSettings().userInterface;
            }
            this.plugin.settings.linting.userInterface.severityIndicators.warning = warningInput.value;
            await this.plugin.saveSettings();
        });
        
        // Info indicator
        const infoEl = indicatorsEl.createDiv({ cls: 'oom-setting' });
        const infoInfo = infoEl.createDiv({ cls: 'oom-setting-info' });
        infoInfo.createDiv({ text: 'Info Indicator', cls: 'oom-setting-name' });
        infoInfo.createDiv({ text: 'Symbol to use for info severity issues', cls: 'oom-setting-desc' });
        
        const infoControl = infoEl.createDiv({ cls: 'oom-setting-control' });
        const infoInput = infoControl.createEl('input', {
            type: 'text',
            value: ui.severityIndicators.info
        });
        
        infoInput.addEventListener('change', async () => {
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = this.getDefaultLintingSettings();
            }
            if (!this.plugin.settings.linting.userInterface) {
                this.plugin.settings.linting.userInterface = this.getDefaultLintingSettings().userInterface;
            }
            this.plugin.settings.linting.userInterface.severityIndicators.info = infoInput.value;
            await this.plugin.saveSettings();
        });
    }

    // Helper methods for structures and templates
    private createStructureListItem(containerEl: HTMLElement, structure: any) {
        const itemEl = containerEl.createDiv({ cls: 'oom-structure-item' });
        
        // Header with name and status indicators
        const headerEl = itemEl.createDiv({ cls: 'oom-structure-header' });
        
        const infoEl = headerEl.createDiv({ cls: 'oom-structure-info' });
        const nameEl = infoEl.createDiv({ cls: 'oom-structure-name' });
        nameEl.textContent = structure.name;
        
        // Add status indicators
        if (structure.isDefault) {
            const defaultBadge = nameEl.createSpan({ cls: 'oom-structure-badge oom-default-badge' });
            defaultBadge.textContent = 'DEFAULT';
        }
        
        if (!structure.enabled) {
            const disabledBadge = nameEl.createSpan({ cls: 'oom-structure-badge oom-disabled-badge' });
            disabledBadge.textContent = 'DISABLED';
        }
        
        // Description if available
        if (structure.description) {
            infoEl.createDiv({ 
                text: structure.description, 
                cls: 'oom-structure-description' 
            });
        }
        
        // Meta information
        const metaEl = itemEl.createDiv({ cls: 'oom-structure-meta' });
        metaEl.createSpan({ text: `Type: ${structure.type}`, cls: 'oom-meta-item' });
        metaEl.createSpan({ text: `Root: ${structure.rootCallout}`, cls: 'oom-meta-item' });
        
        if (structure.childCallouts?.length > 0) {
            metaEl.createSpan({ 
                text: `Children: ${structure.childCallouts.join(', ')}`,
                cls: 'oom-meta-item' 
            });
        }
        
        if (structure.metricsCallout) {
            metaEl.createSpan({ 
                text: `Metrics: ${structure.metricsCallout}`,
                cls: 'oom-meta-item' 
            });
        }
        
        // Action buttons
        const actionsEl = headerEl.createDiv({ cls: 'oom-structure-actions' });
        
        // Edit button
        const editBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(editBtn, 'edit');
        editBtn.setAttribute('aria-label', 'Edit Structure');
        editBtn.addEventListener('click', () => {
            this.editStructure(structure);
        });
        
        // Clone button
        const cloneBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(cloneBtn, 'copy');
        cloneBtn.setAttribute('aria-label', 'Clone Structure');
        cloneBtn.addEventListener('click', () => {
            this.cloneStructure(structure as ExtendedCalloutStructure);
        });
        
        // Delete button
        const deleteBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(deleteBtn, 'trash');
        deleteBtn.setAttribute('aria-label', 'Delete Structure');
        deleteBtn.addEventListener('click', () => {
            this.deleteStructure(structure as ExtendedCalloutStructure);
        });
        
        return itemEl;
    }

    private createTemplateListItem(containerEl: HTMLElement, template: any) {
        const itemEl = containerEl.createDiv({ cls: 'oom-template-item' });
        
        itemEl.createEl('h4', { text: template.name });
        
        if (template.description) {
            itemEl.createEl('p', { text: template.description, cls: 'oom-template-desc' });
        }
        
        const metaEl = itemEl.createDiv({ cls: 'oom-template-meta' });
        
        // Find associated structure
        const structures = this.plugin.settings.linting?.structures || [];
        const structure = structures.find(s => s.id === template.structure);
        
        if (structure) {
            metaEl.createSpan({ 
                text: `Structure: ${structure.name}`,
                cls: 'oom-meta-item' 
            });
        }
        
        metaEl.createSpan({ 
            text: template.isTemplaterTemplate ? 'Uses Templater' : 'Static Template',
            cls: 'oom-meta-item' 
        });
        
        // Actions
        const actionsEl = itemEl.createDiv({ cls: 'oom-template-actions' });
        
        const editBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(editBtn, 'edit');
        editBtn.setAttribute('aria-label', 'Edit');
        editBtn.addEventListener('click', () => {
            const { TemplateWizard } = require('../../journal_check/ui/TemplateWizard');
            new TemplateWizard(this.app, this.plugin, this.plugin.templaterIntegration, template).open();
        });
        
        const deleteBtn = actionsEl.createDiv({ cls: 'oom-action-btn' });
        setIcon(deleteBtn, 'trash');
        deleteBtn.setAttribute('aria-label', 'Delete');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
                const templates = this.plugin.settings.linting?.templates || [];
                const index = templates.findIndex(t => t.id === template.id);
                
                if (index !== -1) {
                    templates.splice(index, 1);
                    this.plugin.saveSettings().then(() => {
                        // Refresh the templates list
                        this.loadJournalStructureContent();
                        new Notice(`Template "${template.name}" deleted`);
                    });
                }
            }
        });
        
        return itemEl;
    }

    private createPatternListItem(containerEl: HTMLElement, pattern: string, index: number) {
        const itemEl = containerEl.createDiv({ cls: 'oom-pattern-item' });
        
        itemEl.createSpan({ text: pattern, cls: 'oom-pattern-text' });
        
        const deleteBtn = itemEl.createSpan({ cls: 'oom-pattern-delete' });
        setIcon(deleteBtn, 'x');
        
        deleteBtn.addEventListener('click', () => {
            const patterns = [...(this.plugin.settings.linting?.contentIsolation?.customIgnorePatterns || [])];
            patterns.splice(index, 1);
            this.updateContentIsolationSetting('customIgnorePatterns', patterns);
            
            // Refresh section
            this.loadJournalStructureContent();
        });
        
        return itemEl;
    }

    // Helper to update content isolation settings
    private async updateContentIsolationSetting(key: string, value: any) {
        if (!this.plugin.settings.linting) {
            this.plugin.settings.linting = this.getDefaultLintingSettings();
        }
        
        if (!this.plugin.settings.linting.contentIsolation) {
            this.plugin.settings.linting.contentIsolation = this.getDefaultLintingSettings().contentIsolation;
        }
        
        // @ts-ignore - Dynamically set property
        this.plugin.settings.linting.contentIsolation[key] = value;
        await this.plugin.saveSettings();
    }
    
    // Load Callout Quick Copy content with migrated functionality
    private loadCalloutQuickCopyContent() {
        this.contentContainer.empty();
        
        // Add welcome text
        const welcomeText = this.contentContainer.createDiv({ 
            cls: 'oom-metrics-tabs-callout-quick-copy-text' 
        });
        
        welcomeText.createEl('h2', { text: 'Callout Quick Copy' });
        
        welcomeText.createEl('p', { 
            text: 'Generate and customize dream metrics callouts for quick copying into your journal entries.'
        });
        
        // State for the callout structure
        let calloutMetadata = '';
        let singleLine = false;
        
        // Helper to build the callout structure
        const buildCallout = () => {
            const meta = calloutMetadata.trim();
            const metaStr = meta ? `|${meta}` : '';
            const header = `> [!dream-metrics${metaStr}]`;
            const metrics = [
                'Sensory Detail:',
                'Emotional Recall:',
                'Lost Segments:',
                'Descriptiveness:',
                'Confidence Score:'
            ];
            if (singleLine) {
                return `${header}\n> ${metrics.join(' , ')}`;
            } else {
                return `${header}\n> ${metrics.join(' \n> ')}`;
            }
        };
        
        // Callout Structure Preview (styled div)
        const calloutBox = this.contentContainer.createEl('div', {
            cls: 'oom-callout-structure-box',
        });
        
        // Apply styles to callout box
        this.applyCalloutBoxStyles(calloutBox);
        
        // Set initial content
        calloutBox.textContent = buildCallout();
        
        // Copy button
        const copyBtn = this.contentContainer.createEl('button', { 
            text: 'Copy to Clipboard', 
            cls: 'oom-copy-btn mod-cta' 
        });
        
        // Apply styles to copy button
        this.applyCopyButtonStyles(copyBtn);
        
        // Add click handler
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(calloutBox.textContent || '');
            new Notice('Callout copied to clipboard!');
        };
        
        // Settings container
        const settingsContainer = this.contentContainer.createDiv({ 
            cls: 'oom-callout-settings' 
        });
        
        // Single-Line Toggle
        new Setting(settingsContainer)
            .setName('Single-Line Callout Structure')
            .setDesc('Show all metric fields on a single line in the callout structure')
            .addToggle(toggle => {
                toggle.setValue(singleLine)
                    .onChange(async (value) => {
                        singleLine = value;
                        calloutBox.textContent = buildCallout();
                    });
            });
        
        // Callout Metadata Field
        new Setting(settingsContainer)
            .setName('Callout Metadata')
            .setDesc('Default metadata to include in dream callouts')
            .addText(text => text
                .setPlaceholder('Enter metadata')
                .setValue(calloutMetadata)
                .onChange(async (value) => {
                    calloutMetadata = value;
                    calloutBox.textContent = buildCallout();
                    await this.plugin.saveSettings();
                }));
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

    // ========== STRUCTURE MANAGEMENT METHODS - Phase 2.4 ==========
    
    /**
     * Create a new structure
     */
    private createNewStructure() {
        // Create a new empty structure with defaults
        const newStructure = {
            id: 'structure-' + Date.now(),
            name: '',
            description: '',
            type: 'nested' as const,
            rootCallout: '',
            childCallouts: [],
            metricsCallout: '',
            enabled: true,
            isDefault: false,
            dateFormat: ['YYYY-MM-DD'],
            requiredFields: [],
            optionalFields: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Find the structures list container
        const structuresSection = this.contentContainer.querySelector('.oom-journal-section:nth-child(2)');
        if (!structuresSection) {
            new Notice('Could not find structures section');
            return;
        }
        
        const listContainer = structuresSection.querySelector('.oom-structures-list');
        if (!listContainer) {
            new Notice('Could not find structures list container');
            return;
        }
        
        // Create the new structure item with inline editor open by default
        const itemEl = (listContainer as HTMLElement).createDiv({ cls: 'oom-structure-item editing' });
        
        // Header (minimal since we're going straight to editing)
        const headerEl = itemEl.createDiv({ cls: 'oom-structure-header' });
        
        // Simple header for new structure
        const infoEl = headerEl.createDiv({ cls: 'oom-structure-info' });
        infoEl.createDiv({ 
            cls: 'oom-structure-name',
            text: '✏️ New Structure (unsaved)'
        });
        
        // Cancel button for new structure creation
        const actionsEl = headerEl.createDiv({ cls: 'oom-structure-actions' });
        const cancelBtn = actionsEl.createEl('button', {
            text: 'Cancel',
            cls: 'oom-button-small oom-button-danger'
        });
        cancelBtn.addEventListener('click', () => {
            itemEl.remove();
        });
        
        // Inline editor (visible by default for new structures)
        const editorEl = itemEl.createDiv({ 
            cls: 'oom-structure-editor',
            attr: { style: 'display: block;' }
        });
        
        // Build the inline structure editor
        this.buildInlineStructureEditor(editorEl, newStructure as ExtendedCalloutStructure, true);
        
        // Scroll to the new structure
        itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        new Notice('Fill in the structure details and click Save to create');
    }
    
    /**
     * Import structures from JSON file
     */
    private importStructures() {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.addEventListener('change', async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                // Validate import data structure
                if (!importData.structures || !Array.isArray(importData.structures)) {
                    new Notice('Invalid import file: missing or invalid structures array');
                    return;
                }
                
                const importedStructures = importData.structures as ExtendedCalloutStructure[];
                const existingStructures = this.plugin.settings.linting?.structures || [];
                
                let importedCount = 0;
                let skippedCount = 0;
                let conflictStructures: ExtendedCalloutStructure[] = [];
                
                // Check for conflicts
                for (const importedStructure of importedStructures) {
                    const existing = existingStructures.find(s => 
                        s.id === importedStructure.id || s.name === importedStructure.name
                    );
                    
                    if (existing) {
                        conflictStructures.push(importedStructure);
                    }
                }
                
                // Handle conflicts if any
                if (conflictStructures.length > 0) {
                    const action = await this.showConflictResolutionDialog(conflictStructures.length);
                    
                    if (action === 'cancel') {
                        new Notice('Import cancelled');
                        return;
                    }
                    
                    // Process structures based on conflict resolution choice
                    for (const importedStructure of importedStructures) {
                        const existing = existingStructures.find(s => 
                            s.id === importedStructure.id || s.name === importedStructure.name
                        );
                        
                        if (existing && action === 'skip') {
                            skippedCount++;
                            continue;
                        }
                        
                        if (existing && action === 'rename') {
                            // Generate unique name and ID
                            let uniqueName = importedStructure.name;
                            let counter = 1;
                            
                            while (existingStructures.some(s => s.name === uniqueName)) {
                                uniqueName = `${importedStructure.name} (Imported ${counter})`;
                                counter++;
                            }
                            
                            importedStructure.name = uniqueName;
                            importedStructure.id = 'structure-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                            importedStructure.isDefault = false; // Imported structures should not be default
                        }
                        
                        if (existing && action === 'overwrite') {
                            // Remove existing structure
                            const index = existingStructures.findIndex(s => s.id === existing.id);
                            if (index !== -1) {
                                existingStructures.splice(index, 1);
                            }
                        }
                        
                        // Add the imported structure
                        if (!this.plugin.settings.linting) {
                            this.plugin.settings.linting = this.getDefaultLintingSettings();
                        }
                        
                        this.plugin.settings.linting.structures.push({
                            ...importedStructure,
                            lastModified: new Date().toISOString(),
                            isDefault: false // Imported structures should not be default
                        } as ExtendedCalloutStructure);
                        
                        importedCount++;
                    }
                } else {
                    // No conflicts, import all structures
                    for (const importedStructure of importedStructures) {
                        if (!this.plugin.settings.linting) {
                            this.plugin.settings.linting = this.getDefaultLintingSettings();
                        }
                        
                        this.plugin.settings.linting.structures.push({
                            ...importedStructure,
                            lastModified: new Date().toISOString(),
                            isDefault: false // Imported structures should not be default
                        } as ExtendedCalloutStructure);
                        
                        importedCount++;
                    }
                }
                
                // Save settings
                await this.plugin.saveSettings();
                
                // Show summary
                let message = `Import completed: ${importedCount} structures imported`;
                if (skippedCount > 0) {
                    message += `, ${skippedCount} skipped due to conflicts`;
                }
                
                new Notice(message);
                
                // Refresh the structures section
                this.loadJournalStructureContent();
                
            } catch (error) {
                console.error('Error importing structures:', error);
                new Notice('Failed to import structures: Invalid JSON file');
            }
        });
        
        // Trigger file picker
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
    
    /**
     * Show conflict resolution dialog
     */
    private async showConflictResolutionDialog(conflictCount: number): Promise<'overwrite' | 'rename' | 'skip' | 'cancel'> {
        return new Promise((resolve) => {
            const message = `Found ${conflictCount} structure(s) with conflicting names or IDs. How would you like to handle conflicts?`;
            
            // For now, use a simple confirm dialog. In the future, this could be a proper modal
            const choice = prompt(
                `${message}\n\nEnter your choice:\n1. overwrite - Replace existing structures\n2. rename - Import with new names\n3. skip - Skip conflicting structures\n4. cancel - Cancel import\n\nChoice (1-4):`,
                '2'
            );
            
            switch (choice) {
                case '1':
                    resolve('overwrite');
                    break;
                case '2':
                    resolve('rename');
                    break;
                case '3':
                    resolve('skip');
                    break;
                case '4':
                case null:
                    resolve('cancel');
                    break;
                default:
                    resolve('rename'); // Default to rename
                    break;
            }
        });
    }
    
    /**
     * Export all structures to JSON
     */
    private exportAllStructures() {
        const structures = this.plugin.settings.linting?.structures || [];
        
        if (structures.length === 0) {
            new Notice('No structures to export');
            return;
        }
        
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            structures: structures
        };
        
        // Copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
            new Notice(`Exported ${structures.length} structures to clipboard`);
        }).catch(() => {
            new Notice('Failed to copy structures to clipboard');
        });
    }
    
    /**
     * Copy structure definition to clipboard as JSON
     */
    private copyStructureToClipboard(structure: any) {
        const structureData = {
            ...structure,
            exportedAt: new Date().toISOString()
        };
        
        navigator.clipboard.writeText(JSON.stringify(structureData, null, 2)).then(() => {
            new Notice('Structure definition copied to clipboard');
        }).catch(() => {
            new Notice('Failed to copy structure to clipboard');
        });
    }

    /**
     * Build inline editor for structure creation/editing
     */
    private buildInlineStructureEditor(containerEl: HTMLElement, structure: ExtendedCalloutStructure, isNew: boolean = false): HTMLElement {
        const editorForm = containerEl.createDiv({ cls: 'oom-structure-form' });
        
        // Basic Information Section
        const basicSection = editorForm.createDiv({ cls: 'oom-form-section' });
        basicSection.createEl('h4', { text: 'Basic Information' });
        
        // Name field
        const nameContainer = basicSection.createDiv({ cls: 'oom-form-field' });
        nameContainer.createEl('label', { text: 'Structure Name:' });
        const nameInput = nameContainer.createEl('input', {
            type: 'text',
            value: structure.name || '',
            placeholder: 'Enter structure name'
        });
        nameInput.classList.add('oom-input');
        
        // Description field
        const descContainer = basicSection.createDiv({ cls: 'oom-form-field' });
        descContainer.createEl('label', { text: 'Description:' });
        const descTextarea = descContainer.createEl('textarea', {
            value: structure.description || '',
            placeholder: 'Enter structure description'
        });
        descTextarea.classList.add('oom-textarea');
        
        // Type selection
        const typeContainer = basicSection.createDiv({ cls: 'oom-form-field' });
        typeContainer.createEl('label', { text: 'Structure Type:' });
        const typeSelect = typeContainer.createEl('select');
        typeSelect.classList.add('oom-select');
        
        const nestedOption = typeSelect.createEl('option', { value: 'nested', text: 'Nested (Parent > Child > Metrics)' });
        const flatOption = typeSelect.createEl('option', { value: 'flat', text: 'Flat (Single callout with metrics)' });
        
        if (structure.type === 'flat') {
            flatOption.selected = true;
        } else {
            nestedOption.selected = true;
        }
        
        // Callout Configuration Section
        const calloutSection = editorForm.createDiv({ cls: 'oom-form-section' });
        calloutSection.createEl('h4', { text: 'Callout Configuration' });
        
        // Root callout
        const rootContainer = calloutSection.createDiv({ cls: 'oom-form-field' });
        rootContainer.createEl('label', { text: 'Root Callout Type:' });
        const rootInput = rootContainer.createEl('input', {
            type: 'text',
            value: structure.rootCallout || '',
            placeholder: 'e.g. journal-entry, av-journal, dream'
        });
        rootInput.classList.add('oom-input');
        
        // Child callouts (for nested structures)
        const childContainer = calloutSection.createDiv({ cls: 'oom-form-field oom-nested-field' });
        childContainer.createEl('label', { text: 'Child Callout Types:' });
        const childInput = childContainer.createEl('input', {
            type: 'text',
            value: (structure.childCallouts || []).join(', '),
            placeholder: 'e.g. dream-diary, narrative (comma-separated)'
        });
        childInput.classList.add('oom-input');
        
        // Metrics callout
        const metricsContainer = calloutSection.createDiv({ cls: 'oom-form-field' });
        metricsContainer.createEl('label', { text: 'Metrics Callout Type:' });
        const metricsInput = metricsContainer.createEl('input', {
            type: 'text',
            value: structure.metricsCallout || '',
            placeholder: 'e.g. dream-metrics, metrics'
        });
        metricsInput.classList.add('oom-input');
        
        // Settings Section
        const settingsSection = editorForm.createDiv({ cls: 'oom-form-section' });
        settingsSection.createEl('h4', { text: 'Settings' });
        
        // Enabled toggle
        const enabledContainer = settingsSection.createDiv({ cls: 'oom-form-field oom-checkbox-field' });
        const enabledLabel = enabledContainer.createEl('label');
        const enabledInput = enabledLabel.createEl('input', { type: 'checkbox' });
        enabledInput.checked = structure.enabled !== false;
        enabledLabel.appendText(' Structure Enabled');
        
        // Default toggle (only for editing existing structures)
        let defaultInput: HTMLInputElement | null = null;
        if (!isNew) {
            const defaultContainer = settingsSection.createDiv({ cls: 'oom-form-field oom-checkbox-field' });
            const defaultLabel = defaultContainer.createEl('label');
            defaultInput = defaultLabel.createEl('input', { type: 'checkbox' });
            defaultInput.checked = structure.isDefault === true;
            defaultLabel.appendText(' Set as Default Structure');
        }
        
        // Action buttons
        const actionsContainer = editorForm.createDiv({ cls: 'oom-form-actions' });
        
        const saveBtn = actionsContainer.createEl('button', {
            text: isNew ? 'Create Structure' : 'Save Changes',
            cls: 'oom-button-primary'
        });
        
        const cancelBtn = actionsContainer.createEl('button', {
            text: 'Cancel',
            cls: 'oom-button-secondary'
        });
        
        // Handle type changes to show/hide child callouts
        const updateChildVisibility = () => {
            if (typeSelect.value === 'flat') {
                childContainer.style.display = 'none';
            } else {
                childContainer.style.display = 'block';
            }
        };
        updateChildVisibility();
        typeSelect.addEventListener('change', updateChildVisibility);
        
        // Save button handler
        saveBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            if (!name) {
                new Notice('Structure name is required');
                nameInput.focus();
                return;
            }
            
            const rootCallout = rootInput.value.trim();
            if (!rootCallout) {
                new Notice('Root callout type is required');
                rootInput.focus();
                return;
            }
            
            // Parse child callouts
            const childCallouts = typeSelect.value === 'nested' 
                ? childInput.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
                : [];
            
            // Update structure object
            structure.name = name;
            structure.description = descTextarea.value.trim();
            structure.type = typeSelect.value as 'nested' | 'flat';
            structure.rootCallout = rootCallout;
            structure.childCallouts = childCallouts;
            structure.metricsCallout = metricsInput.value.trim();
            structure.enabled = enabledInput.checked;
            structure.lastModified = new Date().toISOString();
            
            if (defaultInput) {
                structure.isDefault = defaultInput.checked;
            }
            
            // Initialize settings if needed
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = this.getDefaultLintingSettings();
            }
            
            if (isNew) {
                // Add new structure
                this.plugin.settings.linting.structures.push(structure as ExtendedCalloutStructure);
                new Notice(`Structure "${name}" created successfully`);
            } else {
                // Update existing structure
                const index = this.plugin.settings.linting.structures.findIndex(s => s.id === structure.id);
                if (index !== -1) {
                    this.plugin.settings.linting.structures[index] = structure as ExtendedCalloutStructure;
                }
                new Notice(`Structure "${name}" updated successfully`);
            }
            
            // Handle default structure logic
            if (structure.isDefault) {
                // Remove default from other structures
                this.plugin.settings.linting.structures.forEach(s => {
                    if (s.id !== structure.id) {
                        (s as ExtendedCalloutStructure).isDefault = false;
                    }
                });
            }
            
            // Save settings
            await this.plugin.saveSettings();
            
            // Refresh the content
            this.loadJournalStructureContent();
        });
        
        // Cancel button handler
        cancelBtn.addEventListener('click', () => {
            if (isNew) {
                // Remove the new structure element
                containerEl.parentElement?.remove();
            } else {
                // Just refresh to cancel editing
                this.loadJournalStructureContent();
            }
        });
        
        // Focus name input for new structures
        if (isNew) {
            setTimeout(() => nameInput.focus(), 100);
        }
        
        return editorForm;
    }
    
    /**
     * Clone an existing structure
     */
    private cloneStructure(sourceStructure: ExtendedCalloutStructure) {
        // Create cloned structure with modified name
        let cloneName = `${sourceStructure.name} (Copy)`;
        const existingStructures = this.plugin.settings.linting?.structures || [];
        
        // Handle name conflicts with incrementing counter
        let counter = 1;
        let finalName = cloneName;
        while (existingStructures.some(s => s.name === finalName)) {
            finalName = `${sourceStructure.name} (Copy ${counter})`;
            counter++;
        }
        
        const clonedStructure: ExtendedCalloutStructure = {
            ...sourceStructure,
            id: 'structure-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name: finalName,
            isDefault: false, // Cloned structures should not be default
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Add to settings
        if (!this.plugin.settings.linting) {
            this.plugin.settings.linting = this.getDefaultLintingSettings();
        }
        
        this.plugin.settings.linting.structures.push(clonedStructure);
        this.plugin.saveSettings();
        
        new Notice(`Structure cloned as "${finalName}"`);
        
        // Refresh the UI
        this.loadJournalStructureContent();
    }
    
    /**
     * Delete a structure with confirmation
     */
    private async deleteStructure(structure: ExtendedCalloutStructure) {
        const structures = this.plugin.settings.linting?.structures || [];
        
        // Prevent deletion of the last structure
        if (structures.length <= 1) {
            new Notice('Cannot delete the last structure. At least one structure is required.');
            return;
        }
        
        // Show confirmation dialog
        const confirmed = confirm(
            `Are you sure you want to delete the structure "${structure.name}"?\n\nThis action cannot be undone.`
        );
        
        if (!confirmed) {
            return;
        }
        
        // Remove from settings
        const index = structures.findIndex(s => s.id === structure.id);
        if (index !== -1) {
            structures.splice(index, 1);
            
            // If we deleted the default structure, assign default to the first remaining structure
            if (structure.isDefault && structures.length > 0) {
                (structures[0] as ExtendedCalloutStructure).isDefault = true;
                new Notice(`"${structures[0].name}" is now the default structure`);
            }
            
            await this.plugin.saveSettings();
            new Notice(`Structure "${structure.name}" deleted successfully`);
            
            // Refresh the UI
            this.loadJournalStructureContent();
        }
    }
    
    /**
     * Edit an existing structure inline
     */
    private editStructure(structure: ExtendedCalloutStructure) {
        // Find the structure item in the DOM
        const structuresSection = this.contentContainer.querySelector('.oom-journal-section:nth-child(2)');
        if (!structuresSection) {
            new Notice('Could not find structures section');
            return;
        }
        
        const listContainer = structuresSection.querySelector('.oom-structures-list');
        if (!listContainer) {
            new Notice('Could not find structures list container');
            return;
        }
        
        // Find the specific structure item
        const structureItems = Array.from(listContainer.querySelectorAll('.oom-structure-item'));
        let targetItem: HTMLElement | null = null;
        
        for (const item of structureItems) {
            const nameEl = item.querySelector('.oom-structure-name');
            if (nameEl && nameEl.textContent?.includes(structure.name)) {
                targetItem = item as HTMLElement;
                break;
            }
        }
        
        if (!targetItem) {
            new Notice('Could not find structure item to edit');
            return;
        }
        
        // Add editing class
        targetItem.addClass('editing');
        
        // Check if editor already exists
        let editorEl = targetItem.querySelector('.oom-structure-editor') as HTMLElement;
        if (!editorEl) {
            // Create editor element
            editorEl = targetItem.createDiv({ 
                cls: 'oom-structure-editor',
                attr: { style: 'display: block;' }
            });
        } else {
            // Show existing editor
            editorEl.style.display = 'block';
        }
        
        // Clear and rebuild editor
        editorEl.empty();
        this.buildInlineStructureEditor(editorEl, structure, false);
        
        // Scroll to the structure
        targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        new Notice('Edit the structure details and click Save to update');
    }
} 