/**
 * MetricsTabsModal
 * 
 * A modal that displays detailed metric information in a tabbed interface.
 * Provides comprehensive descriptions of all metrics available in the plugin.
 */

import { App, Modal, MarkdownRenderer, setIcon, Notice, TFile } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
import { DreamMetric } from '../../types/core';
import safeLogger from '../../logging/safe-logger';
import { createSelectedNotesAutocomplete, createFolderAutocomplete } from '../../../autocomplete';

// Interface for grouped metrics
interface MetricGroup {
    name: string;
    metrics: DreamMetric[];
}

export class MetricsTabsModal extends Modal {
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
            
            // Footer with buttons
            const footerEl = contentEl.createDiv({ 
                cls: 'oom-metrics-tabs-footer' 
            });
            
            const closeButton = footerEl.createEl('button', { 
                text: 'Close', 
                cls: 'oom-button' 
            });
            
            closeButton.addEventListener('click', () => this.close());
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
    private selectTab(tabId: string) {
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
        
        welcomeText.createEl('h3', { text: 'Dashboard' });
        
        welcomeText.createEl('p', { 
            text: 'Welcome to Dream Metrics! Manage all aspects of your dream journal from this central hub.'
        });
        
        // Quick Actions Section
        const quickActionsSection = this.contentContainer.createDiv({ cls: 'oom-dashboard-section' });
        quickActionsSection.createEl('h4', { text: 'Quick Actions' });
        
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
        
        // Recent Activity Section
        const recentActivitySection = this.contentContainer.createDiv({ cls: 'oom-dashboard-section' });
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
        const statusSection = this.contentContainer.createDiv({ cls: 'oom-dashboard-section' });
        statusSection.createEl('h4', { text: 'Status Overview' });
        
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
        
        welcomeText.createEl('h3', { text: 'Dream Scrape' });
        
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

    // Enhanced Journal Structure content with full functionality
    private loadJournalStructureContent() {
        this.contentContainer.empty();
        
        // Add welcome text
        const welcomeText = this.contentContainer.createDiv({ 
            cls: 'oom-metrics-tabs-journal-structure-text' 
        });
        
        welcomeText.createEl('h2', { text: 'Journal Structure' });
        
        welcomeText.createEl('p', { 
            text: 'Configure journal structure settings, templates, validation rules, and interface preferences.'
        });
        
        // Create main content container for sections
        const sectionsContainer = this.contentContainer.createDiv({ 
            cls: 'oom-journal-structure-sections' 
        });
        
        // Overview Section
        const overviewSection = sectionsContainer.createDiv({ cls: 'oom-journal-section' });
        overviewSection.createEl('h3', { text: 'Overview', cls: 'oom-section-header' });
        this.buildOverviewSection(overviewSection);
        
        // Structures Section
        const structuresSection = sectionsContainer.createDiv({ cls: 'oom-journal-section' });
        structuresSection.createEl('h3', { text: 'Structures', cls: 'oom-section-header' });
        this.buildStructuresSection(structuresSection);
        
        // Templates Section
        const templatesSection = sectionsContainer.createDiv({ cls: 'oom-journal-section' });
        templatesSection.createEl('h3', { text: 'Templates', cls: 'oom-section-header' });
        this.buildTemplatesSection(templatesSection);
        
        // Templater Integration Section
        const templaterSection = sectionsContainer.createDiv({ cls: 'oom-journal-section' });
        templaterSection.createEl('h3', { text: 'Templater Integration', cls: 'oom-section-header' });
        this.buildTemplaterSection(templaterSection);
        
        // Content Isolation Settings Section
        const contentIsolationSection = sectionsContainer.createDiv({ cls: 'oom-journal-section' });
        contentIsolationSection.createEl('h3', { text: 'Content Isolation', cls: 'oom-section-header' });
        this.buildContentIsolationSection(contentIsolationSection);
        
        // Interface Settings Section
        const interfaceSection = sectionsContainer.createDiv({ cls: 'oom-journal-section' });
        interfaceSection.createEl('h3', { text: 'Interface', cls: 'oom-section-header' });
        this.buildInterfaceSection(interfaceSection);
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
        
        // Create toggle container
        const toggleContainer = controlEl.createDiv({ cls: 'oom-toggle-container' });
        
        // Create hidden checkbox for functionality
        const toggleInput = toggleContainer.createEl('input', {
            type: 'checkbox',
            cls: 'oom-toggle-input'
        });
        toggleInput.checked = defaultValue;
        
        // Create visual toggle switch
        const toggleSwitch = toggleContainer.createDiv({ cls: 'oom-toggle-switch' });
        const toggleSlider = toggleSwitch.createDiv({ cls: 'oom-toggle-slider' });
        
        // Update visual state based on input
        const updateToggleVisual = () => {
            if (toggleInput.checked) {
                toggleSwitch.addClass('oom-toggle-on');
                toggleSwitch.removeClass('oom-toggle-off');
            } else {
                toggleSwitch.addClass('oom-toggle-off');
                toggleSwitch.removeClass('oom-toggle-on');
            }
        };
        
        // Set initial visual state
        updateToggleVisual();
        
        // Handle toggle interaction
        const handleToggle = () => {
            toggleInput.checked = !toggleInput.checked;
            updateToggleVisual();
            onChange(toggleInput.checked);
            this.plugin.saveSettings();
        };
        
        // Add click handlers to both input and visual switch
        toggleInput.addEventListener('change', () => {
            updateToggleVisual();
            onChange(toggleInput.checked);
            this.plugin.saveSettings();
        });
        
        toggleSwitch.addEventListener('click', handleToggle);
        toggleContainer.addEventListener('click', handleToggle);
        
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

    // Build the Overview section with validation toggle and stats
    private buildOverviewSection(containerEl: HTMLElement) {
        containerEl.createEl('p', { 
            text: 'Journal Structure Check helps you maintain consistent formatting in your dream journal entries.' 
        });
        
        // Enable/disable structure validation
        this.createJournalStructureSetting(containerEl, 'Enable Structure Validation', 'Validate journal entries against defined structures', (value) => {
            if (!this.plugin.settings.linting) {
                this.plugin.settings.linting = this.getDefaultLintingSettings();
            }
            this.plugin.settings.linting.enabled = value;
        }, this.plugin.settings.linting?.enabled ?? true);
        
        // Quick stats about configured structures and templates
        const statsEl = containerEl.createDiv({ cls: 'oom-structure-stats' });
        
        const structures = this.plugin.settings.linting?.structures || [];
        const templates = this.plugin.settings.linting?.templates || [];
        
        statsEl.createEl('h4', { text: 'Configuration Summary' });
        statsEl.createEl('div', { 
            text: `Structures: ${structures.length}`,
            cls: 'oom-stat-item' 
        });
        statsEl.createEl('div', { 
            text: `Templates: ${templates.length}`,
            cls: 'oom-stat-item' 
        });
        statsEl.createEl('div', { 
            text: `Templater Integration: ${this.plugin.settings.linting?.templaterIntegration?.enabled ? 'Enabled' : 'Disabled'}`,
            cls: 'oom-stat-item' 
        });
        
        // Quick action buttons
        const actionsEl = containerEl.createDiv({ cls: 'oom-quick-actions' });
        actionsEl.createEl('h4', { text: 'Quick Actions' });
        
        const actionsGrid = actionsEl.createDiv({ cls: 'oom-actions-grid' });
        
        this.createQuickActionButton(actionsGrid, 'Create Structure', 'layout', () => {
            // Future: Navigate to structures section
            new Notice('Structure creation will be implemented soon');
        });
        
        this.createQuickActionButton(actionsGrid, 'Create Template', 'file-text', () => {
            // Open TemplateWizard
            const { TemplateWizard } = require('../../journal_check/ui/TemplateWizard');
            new TemplateWizard(this.app, this.plugin, this.plugin.templaterIntegration).open();
        });
        
        this.createQuickActionButton(actionsGrid, 'Validate Current Note', 'check-circle', () => {
            new Notice('Validation will be implemented soon');
        });
        
        this.createQuickActionButton(actionsGrid, 'Apply Template', 'file-plus', () => {
            new Notice('Template application will be implemented soon');
        });
    }

    // Build the Structures section
    private buildStructuresSection(containerEl: HTMLElement) {
        containerEl.createEl('p', { 
            text: 'Define and manage structures that define the expected format of your journal entries.' 
        });
        
        // Structures list
        const structures = this.plugin.settings.linting?.structures || [];
        
        if (structures.length === 0) {
            containerEl.createEl('p', { 
                text: 'No structures defined yet. Create your first structure to get started.',
                cls: 'oom-empty-state'
            });
        } else {
            const listEl = containerEl.createDiv({ cls: 'oom-structures-list' });
            
            for (const structure of structures) {
                this.createStructureListItem(listEl, structure);
            }
        }
        
        // Create new structure button
        const createBtnContainer = containerEl.createDiv({ cls: 'oom-setting' });
        const createBtn = createBtnContainer.createEl('button', { 
            text: 'Create New Structure',
            cls: 'oom-button-primary'
        });
        createBtn.addEventListener('click', () => {
            new Notice('Structure creation will be implemented soon');
        });
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
        
        itemEl.createEl('h4', { text: structure.name });
        
        const metaEl = itemEl.createDiv({ cls: 'oom-structure-meta' });
        metaEl.createSpan({ text: `Type: ${structure.type}`, cls: 'oom-meta-item' });
        
        if (structure.requiredFields?.length > 0) {
            metaEl.createSpan({ 
                text: `Required Fields: ${structure.requiredFields.length}`,
                cls: 'oom-meta-item' 
            });
        }
        
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
} 