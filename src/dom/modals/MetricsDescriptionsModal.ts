/**
 * MetricsDescriptionsModal
 * 
 * A modal for displaying descriptions of available metrics.
 * Extracted from settings.ts during the refactoring process.
 */

import { App, Modal, MarkdownRenderer } from 'obsidian';
import safeLogger from '../../logging/safe-logger';
import { lucideIconMap } from '../../../settings';
import DreamMetricsPlugin from '../../../main';
import { HubModal } from './HubModal';
import { ModalsManager } from './ModalsManager';

export class MetricsDescriptionsModal extends Modal {
    constructor(
        app: App,
        private plugin: DreamMetricsPlugin
    ) {
        super(app);
    }
    
    onOpen() {
        try {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass('oom-metrics-modal');
            
            // Modal Title
            contentEl.createEl('h2', { text: 'Metrics Descriptions' });
            
            // Markdown content (default + optional)
            const allMetricsMarkdown = this.getMetricsMarkdown();
            const descDiv = contentEl.createEl('div');
            
            // Render markdown content
            MarkdownRenderer.renderMarkdown(
                allMetricsMarkdown, 
                descDiv, 
                this.plugin.app.vault.getAbstractFileByPath('') as any, 
                this.plugin
            );
            
            // Inject Lucide icons into headings
            this.injectIconsIntoHeadings(descDiv);
            
            // OK button
            const btnRow = contentEl.createEl('div', { cls: 'oom-metrics-modal-btn-row' });
            btnRow.style.display = 'flex';
            btnRow.style.justifyContent = 'center';
            btnRow.style.marginTop = '2em';
            
            const okBtn = btnRow.createEl('button', { text: 'OK', cls: 'oom-button oom-button--primary' });
            okBtn.onclick = () => this.close();

            // Add button to open the new tabbed interface modal
            const footerEl = contentEl.createDiv({
                cls: 'metrics-modal-footer'
            });
            
            const tabbedViewButton = footerEl.createEl('button', {
                text: 'Open Tabbed View',
                cls: 'mod-cta'
            });
            
            tabbedViewButton.addEventListener('click', () => {
                this.close();
                const modalsManager = new ModalsManager(this.app, this.plugin, null);
                modalsManager.openHubModal();
            });
        } catch (error) {
            safeLogger.error('UI', 'Error opening metrics descriptions modal', error as Error);
        }
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    /**
     * Inject Lucide icons into headings based on the icon map
     */
    private injectIconsIntoHeadings(container: HTMLElement): void {
        try {
            // Icon mapping
            const iconMap: Record<string, string> = {
                'Sensory Detail': 'eye',
                'Emotional Recall': 'heart',
                'Descriptiveness': 'pen-tool',
                'Character Roles': 'user-cog',
                'Confidence Score': 'check-circle',
                'Characters Count': 'users',
                'Familiar Count': 'user-check',
                'Unfamiliar Count': 'user-x',
                'Characters List': 'users-round',
                'Dream Theme': 'sparkles',
                'Character Clarity/Familiarity': 'user-search',
                'Lucidity Level': 'wand-2',
                'Dream Coherence': 'link',
                'Environmental Familiarity': 'glasses',
                'Ease of Recall': 'zap',
                'Recall Stability': 'layers'
            };
            
            // For h3/h4 headings, inject icon if heading matches
            const headings = container.querySelectorAll('h3, h4');
            headings.forEach(h => {
                const text = h.textContent || '';
                for (const key in iconMap) {
                    if (text.startsWith(key)) {
                        const iconName = iconMap[key];
                        if (lucideIconMap[iconName]) {
                            const iconSpan = document.createElement('span');
                            iconSpan.className = 'oom-metric-desc-icon';
                            iconSpan.innerHTML = lucideIconMap[iconName];
                            h.insertBefore(iconSpan, h.firstChild);
                            break;
                        }
                    }
                }
            });
        } catch (error) {
            safeLogger.error('UI', 'Error injecting icons into headings', error as Error);
        }
    }
    
    /**
     * Get the markdown content for metrics descriptions
     */
    private getMetricsMarkdown(): string {
        return `### Default Metrics\n\n- **Sensory Detail (Score 1-5):** Level of sensory information recalled from the dream.\n- **Emotional Recall (Score 1-5):** Level of emotional detail recalled from the dream.\n- **Descriptiveness (Score 1-5):** Level of detail in the dream description.\n- **Character Roles (Score 1-5):** Significance of familiar characters in the dream narrative.\n- **Confidence Score (Score 1-5):** Confidence level in the completeness of dream recall.\n\n#### Full Descriptions\n\n#### Sensory Detail (Score 1-5)\nThis metric aims to capture the richness and vividness of the sensory information you recall from your dream.\n\n| Score        | Description |\n| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n| 1 (Minimal)  | You recall very little sensory information. The dream feels vague and lacks specific sights, sounds, textures, smells, or tastes. You might remember the general feeling of a place but not any distinct visual elements, for example. |\n| 2 (Limited)  | You recall a few basic sensory details, perhaps a dominant color or a general sound. The sensory landscape is still quite sparse. |\n| 3 (Moderate) | You recall a noticeable amount of sensory information. You might remember some visual details, perhaps a few distinct sounds, or a general feeling of touch. |\n| 4 (Rich)     | You recall a significant amount of sensory information across multiple senses. You can describe specific visual elements, distinct sounds, perhaps a smell or a texture. The dream feels more immersive. |\n| 5 (Vivid)    | Your recall is highly detailed and encompasses a wide range of sensory experiences. You can clearly describe intricate visual scenes, distinct and multiple sounds, and perhaps even specific tastes and smells. The dream feels very real and alive in your memory. |\n\n#### Emotional Recall (Score 1-5)\nThis metric focuses on your ability to remember and articulate the emotions you experienced within the dream.\n\n| Score                | Description |\n| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n| 1 (Vague)            | You have a faint sense that you felt some emotion in the dream, but you can't identify it specifically. You might just say you felt \"something.\" |\n| 2 (General)          | You can identify a primary emotion (e.g., happy, sad, scared) but can't describe its intensity or nuances. |\n| 3 (Identified)       | You can identify one or two specific emotions you felt and perhaps describe their general intensity. |\n| 4 (Nuanced)          | You recall several distinct emotions and can describe some of the nuances or shifts in your feelings throughout the dream. |\n| 5 (Deep and Complex) | You have a strong recollection of the emotional landscape of the dream, including multiple emotions, their intensity, how they evolved, and perhaps even subtle emotional undertones. |\n\n#### Descriptiveness (Score 1-5)\nThis metric assesses the level of detail and elaboration in your written dream capture, beyond just sensory details (which have their own metric). This considers how thoroughly you describe the events, characters, interactions, and the overall narrative flow.\n\n| Score                | Description |\n| -------------------- | ----------- |\n| 1 (Minimal)          | Your capture is very brief and outlines only the most basic elements of the dream. It lacks detail and elaboration. |\n| 2 (Limited)          | Your capture provides a basic account of the dream but lacks significant descriptive detail in terms of actions, character behavior, or plot progression. |\n| 3 (Moderate)         | Your capture provides a reasonably detailed account of the main events and characters, with some descriptive language used. |\n| 4 (Detailed)         | Your capture includes a significant level of descriptive detail, bringing the dream narrative and its elements to life with more thorough explanations and imagery. |\n| 5 (Highly Elaborate) | Your capture is very rich in detail, using vivid language to describe the events, characters, their motivations (if perceived), and the overall unfolding of the dream narrative. |\n\n#### Character Roles (Score 1-5)\nThis metric tracks the significance of familiar characters in the dream narrative.\n\n| Score                | Description |\n| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n| 1 (None)             | No familiar characters appear in the dream. |\n| 2 (Background)       | Familiar characters appear but only in minor or background roles. |\n| 3 (Supporting)       | Familiar characters play supporting roles in the dream narrative. |\n| 4 (Major)            | Familiar characters are central to the dream's events or narrative. |\n| 5 (Dominant)         | The dream is primarily about or dominated by interactions with familiar characters. |\n\n#### Confidence Score (Score 1-5)\nThis is a subjective metric reflecting your overall sense of how complete and accurate your dream recall feels immediately after waking. It's your gut feeling about how much of the dream you've managed to retrieve.\n\n| Score         | Description |\n| ------------- | ----------- |\n| 1 (Very Low)  | You feel like you've barely scratched the surface of the dream, remembering only a tiny fragment or a fleeting feeling. You suspect you've forgotten a significant portion. |\n| 2 (Low)       | You recall a bit more, but you still feel like a substantial part of the dream is lost. The recall feels fragmented and incomplete. |\n| 3 (Moderate)  | You feel like you've recalled a fair amount of the dream, perhaps the main storyline, but there might be some fuzzy areas or details you're unsure about. |\n| 4 (High)      | You feel like you've recalled the majority of the dream with a good level of detail and coherence. You feel relatively confident in the accuracy of your memory. |\n| 5 (Very High) | You feel like you've recalled the entire dream in vivid detail and with strong confidence in the accuracy and completeness of your memory. You don't have a sense of significant missing parts. |\n\n---\n\n### Optional Metrics\n\n(See plugin documentation for full details.)\n\n### Characters Count\nThis metric represents the total number of characters in your dream. It is automatically calculated as the sum of Familiar Count and Unfamiliar Count.\n\n### Familiar Count\nThis metric tracks the number of characters you know from your waking life that appear in the dream. This includes people, pets, or any other familiar beings.\n\n### Unfamiliar Count\nThis metric tracks the number of characters you don't know from your waking life that appear in the dream. This includes strangers, fictional characters, or any other unfamiliar beings.\n\n### Characters List\nThis metric allows you to list all characters that appeared in your dream. You can add multiple entries, one per line. For example:\n\`\`\`markdown\nMom\nDad\nMy dog Max\nA stranger in a red coat\n\`\`\`\n\n### Dream Theme (Categorical/Keywords)\nThis metric aims to identify the dominant subjects, ideas, or emotional undercurrents present in your dream. Instead of a numerical score, you will select one or more keywords or categories that best represent the core themes of the dream.\n\n*Possible Categories/Keywords (Examples - User-definable list in plugin recommended):*\nTravel/Journey, Conflict/Argument, Learning/Discovery, Loss/Grief, Joy/Happiness, Fear/Anxiety, Absurdity/Surrealism, Creativity/Inspiration, Relationship Dynamics, Work/Career, Health/Illness, Nostalgia/Past, Technology, Nature/Environment, Spiritual/Mystical, Transformation, Communication, Power/Control, Vulnerability

### Character Clarity/Familiarity (Score 1-5)
This metric assesses the distinctness and recognizability of the individual characters (both familiar and unfamiliar) appearing in your dream.

* 1 (Indistinct/Absent): No characters were recalled, or any perceived characters were entirely formless, shadowy, or too indistinct to even categorize as familiar or unfamiliar.
* 2 (Vague Presence): Characters were present but highly blurred, featureless, or rapidly shifting. You had a sense of their presence but couldn't make out details or their identity clearly.
* 3 (Partially Discernible): Characters were somewhat discernible; you might have caught glimpses of features or had a vague sense of their identity (e.g., "a man," "a child") but lacked clear details or certainty.
* 4 (Clearly Recognized): Characters were clearly perceived, and their features/identity were distinct enough to recognize, even if they were unfamiliar. For familiar characters, you recognized them without doubt.
* 5 (Vivid & Defined): Characters appeared with exceptional clarity and detail, almost as if seen in waking life. Their features, expressions, and presence were sharply defined and fully formed in your recall.

### Lucidity Level (Score 1-5)\nThis metric tracks your degree of awareness that you are dreaming while the dream is in progress.\n\n* 1 (Non-Lucid): You have no awareness that you are dreaming.\n* 2 (Faint Awareness): You might have a fleeting thought or a vague feeling that something is unusual or dreamlike, but this awareness doesn't solidify into the certainty that you are dreaming.\n* 3 (Clear Awareness): You become clearly aware that you are dreaming. However, your ability to control or influence the dream environment and events might be limited. You are an observer who knows it's a dream.\n* 4 (Moderate Control): You are aware that you are dreaming and can actively influence some aspects of the dream, such as your own actions, the environment to a limited extent, or the course of the narrative.\n* 5 (High Lucidity): You have a strong and stable awareness that you are dreaming and possess a significant degree of control over the dream environment, characters, and events.\n\n### Dream Coherence (Score 1-5)\nThis metric assesses the logical consistency and narrative flow of your dream.\n\n* 1 (Incoherent): The dream is fragmented, disjointed, and nonsensical.\n* 2 (Loosely Connected): Some elements or scenes might have a vague or thematic relationship, but the overall narrative lacks a clear and logical progression.\n* 3 (Moderately Coherent): The dream has a discernible narrative thread, but it may contain illogical elements, inconsistencies in character behavior or setting, or sudden, unexplained shifts in the storyline.\n* 4 (Mostly Coherent): The dream generally follows a logical progression with a relatively consistent narrative, characters, and settings. Any illogical elements are minor or don't significantly disrupt the overall sense of a somewhat realistic (albeit dreamlike) experience.\n* 5 (Highly Coherent): The dream feels like a consistent and logical experience, even if the content is surreal or fantastical.\n\n### Environmental Familiarity (Score 1-5)\nThis metric tracks the degree to which the locations and environments in your dream are recognizable from your waking life.\n\n* 1 (Completely Unfamiliar): All the settings in the dream are entirely novel and have no discernible connection to any places you have experienced in your waking life.\n* 2 (Vaguely Familiar): You experience a sense of déjà vu or a faint feeling of having been in a similar place before, but you cannot specifically identify the location or its connection to your waking memories.\n* 3 (Partially Familiar): The dream settings are a blend of recognizable and unfamiliar elements.\n* 4 (Mostly Familiar): The dream primarily takes place in locations you know from your waking life, such as your home, workplace, or familiar landmarks, although there might be minor alterations or unusual juxtapositions.\n* 5 (Completely Familiar): All the settings in the dream are direct and accurate representations of places you know well from your waking experience, without any significant alterations or unfamiliar elements.\n\n### Ease of Recall (Score 1-5)\nThis metric assesses how readily and effortlessly you can remember the dream upon waking.\n\n* 1 (Very Difficult): You wake up with little to no memory of having dreamed.\n* 2 (Difficult): You remember a few isolated images, emotions, or very brief snippets of the dream, but the overall narrative is elusive and hard to piece together.\n* 3 (Moderate): You can recall the basic outline or a few key scenes of the dream with a reasonable amount of effort.\n* 4 (Easy): You remember the dream relatively clearly and can recount a significant portion of the narrative and details without much difficulty.\n* 5 (Very Easy): The dream is vividly and immediately present in your memory upon waking.\n\n### Recall Stability (Score 1-5)\nThis metric assesses how well your memory of the dream holds up in the minutes immediately following waking.\n\n* 1 (Rapidly Fading): The dream memory begins to dissipate almost instantly upon waking.\n* 2 (Significant Fading): You can recall a fair amount initially, but key details and the overall narrative structure fade noticeably within the first 10-15 minutes after waking, making it difficult to reconstruct the full dream later.\n* 3 (Moderate Fading): Some details and less significant parts of the dream might fade within the first 15-30 minutes, but the core narrative and key events remain relatively intact.\n* 4 (Mostly Stable): Your recall of the dream remains largely consistent for at least 30 minutes after waking.\n* 5 (Very Stable): The memory of the dream feels solid and enduring in the immediate post-waking period.`;
    }
} 