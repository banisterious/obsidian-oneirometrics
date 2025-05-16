## OneiroMetrics Metrics Guide

This document provides detailed descriptions of the metrics used in OneiroMetrics for dream journal analysis. For information about metric styling and layout, see the [Layout and Styling Technical Specification](LAYOUT_AND_STYLING.md). For details about temporal aspects of metrics, see the [Date and Time Technical Specification](DATE_TIME_TECHNICAL.md).

## Table of Contents

1. [Default Metric Descriptions](#default-metric-descriptions)
	1. [Sensory Detail](#sensory-detail-score-1-5)
	2. [Emotional Recall](#emotional-recall-score-1-5)
	3. [Descriptiveness](#descriptiveness-score-1-5)
	4. [Lost Segments](#lost-segments-number)
	5. [Characters Role](#characters-role-score-1-5)
	6. [Confidence Score](#confidence-score-score-1-5)
2. [Optional Metric Descriptions](#optional-metric-descriptions)
	1. [Characters Count](#characters-count)
	2. [Familiar Count](#familiar-count)
	3. [Unfamiliar Count](#unfamiliar-count)
	4. [Characters List](#characters-list)
	5. [Dream Theme](#dream-theme)
	6. [Lucidity Level](#lucidity-level-score-1-5)
	7. [Dream Coherence](#dream-coherence-score-1-5)
	8. [Setting Familiarity](#setting-familiarity-score-1-5)
	9. [Ease of Recall](#ease-of-recall-score-1-5)
	10. [Recall Stability](#recall-stability-score-1-5)
3. [Using Metrics](#using-metrics)
	1. [Metadata Support](#metadata-support)
4. [Tips for Accurate Scoring](#tips-for-accurate-scoring)

## Default Metric Descriptions

The following metrics are enabled by default.

### Sensory Detail (Score 1-5)
This metric aims to capture the richness and vividness of the sensory information you recall from your dream.

| Score        | Description |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Minimal)  | You recall very little sensory information. The dream feels vague and lacks specific sights, sounds, textures, smells, or tastes. You might remember the general feeling of a place but not any distinct visual elements, for example. |
| 2 (Limited)  | You recall a few basic sensory details, perhaps a dominant color or a general sound. The sensory landscape is still quite sparse. |
| 3 (Moderate) | You recall a noticeable amount of sensory information. You might remember some visual details, perhaps a few distinct sounds, or a general feeling of touch. |
| 4 (Rich)     | You recall a significant amount of sensory information across multiple senses. You can describe specific visual elements, distinct sounds, perhaps a smell or a texture. The dream feels more immersive. |
| 5 (Vivid)    | Your recall is highly detailed and encompasses a wide range of sensory experiences. You can clearly describe intricate visual scenes, distinct and multiple sounds, and perhaps even specific tastes and smells. The dream feels very real and alive in your memory. |

### Emotional Recall (Score 1-5)
This metric focuses on your ability to remember and articulate the emotions you experienced within the dream.

| Score                | Description |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Vague)            | You have a faint sense that you felt some emotion in the dream, but you can't identify it specifically. You might just say you felt "something." |
| 2 (General)          | You can identify a primary emotion (e.g., happy, sad, scared) but can't describe its intensity or nuances. |
| 3 (Identified)       | You can identify one or two specific emotions you felt and perhaps describe their general intensity. |
| 4 (Nuanced)          | You recall several distinct emotions and can describe some of the nuances or shifts in your feelings throughout the dream. |
| 5 (Deep and Complex) | You have a strong recollection of the emotional landscape of the dream, including multiple emotions, their intensity, how they evolved, and perhaps even subtle emotional undertones. |

### Descriptiveness (Score 1-5)
This metric assesses the level of detail and elaboration in your written dream capture, beyond just sensory details (which have their own metric). This considers how thoroughly you describe the events, characters, interactions, and the overall narrative flow.

| Score                | Description |
| -------------------- | ----------- |
| 1 (Minimal)          | Your capture is very brief and outlines only the most basic elements of the dream. It lacks detail and elaboration. |
| 2 (Limited)          | Your capture provides a basic account of the dream but lacks significant descriptive detail in terms of actions, character behavior, or plot progression. |
| 3 (Moderate)         | Your capture provides a reasonably detailed account of the main events and characters, with some descriptive language used. |
| 4 (Detailed)         | Your capture includes a significant level of descriptive detail, bringing the dream narrative and its elements to life with more thorough explanations and imagery. |
| 5 (Highly Elaborate) | Your capture is very rich in detail, using vivid language to describe the events, characters, their motivations (if perceived), and the overall unfolding of the dream narrative. |

### Lost Segments (Number)
This metric tracks the number of distinct instances where you have a clear feeling or awareness that a part of the dream is missing or has been forgotten. This isn't about omitting fragments you never recalled in the first place. It's about those "gaps" in your recalled narrative where you feel like "there was something else there," or you have a fleeting image or feeling that then vanishes.

If you recall the dream as a complete, seamless narrative with no sense of missing parts, this score would be 0.

If you have a distinct feeling of one or more breaks or missing chunks in the dream's sequence, you would count each of those instances.

### Characters Role (Score 1-5)
This metric tracks the significance of familiar characters in the dream narrative.

| Score                | Description |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (None)             | No familiar characters appear in the dream. |
| 2 (Background)       | Familiar characters appear but only in minor or background roles. |
| 3 (Supporting)       | Familiar characters play supporting roles in the dream narrative. |
| 4 (Major)            | Familiar characters are central to the dream's events or narrative. |
| 5 (Dominant)         | The dream is primarily about or dominated by interactions with familiar characters. |

### Confidence Score (Score 1-5)
This is a subjective metric reflecting your overall sense of how complete and accurate your dream recall feels immediately after waking. It's your gut feeling about how much of the dream you've managed to retrieve.

| Score         | Description |
| ------------- | ----------- |
| 1 (Very Low)  | You feel like you've barely scratched the surface of the dream, remembering only a tiny fragment or a fleeting feeling. You suspect you've forgotten a significant portion. |
| 2 (Low)       | You recall a bit more, but you still feel like a substantial part of the dream is lost. The recall feels fragmented and incomplete. |
| 3 (Moderate)  | You feel like you've recalled a fair amount of the dream, perhaps the main storyline, but there might be some fuzzy areas or details you're unsure about. |
| 4 (High)      | You feel like you've recalled the majority of the dream with a good level of detail and coherence. You feel relatively confident in the accuracy of your memory. |
| 5 (Very High) | You feel like you've recalled the entire dream in vivid detail and with strong confidence in the accuracy and completeness of your memory. You don't have a sense of significant missing parts. |

## Optional Metric Descriptions

The following metrics are suggested optional metrics.

### Characters Count
This metric represents the total number of characters in your dream. It is automatically calculated as the sum of Familiar Count and Unfamiliar Count.

### Familiar Count
This metric tracks the number of characters you know from your waking life that appear in the dream. This includes people, pets, or any other familiar beings.

### Unfamiliar Count
This metric tracks the number of characters you don't know from your waking life that appear in the dream. This includes strangers, fictional characters, or any other unfamiliar beings.

### Characters List
This metric allows you to list all characters that appeared in your dream. You can add multiple entries, one per line. For example:
```markdown
Mom
Dad
My dog Max
A stranger in a red coat
```

### Dream Theme (Categorical/Keywords)

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

### Lucidity Level (Score 1-5)

This metric tracks your degree of awareness that you are dreaming while the dream is in progress.

| Score                | Description                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Non-Lucid)        | You have no awareness that you are dreaming. You experience the dream as reality, no matter how bizarre or illogical it may be.                                                                                                               |
| 2 (Faint Awareness)  | You might have a fleeting thought or a vague feeling that something is unusual or dreamlike, but this awareness doesn't solidify into the certainty that you are dreaming.                                                                    |
| 3 (Clear Awareness)  | You become clearly aware that you are dreaming. However, your ability to control or influence the dream environment and events might be limited. You are an observer who knows it's a dream.                                                  |
| 4 (Moderate Control) | You are aware that you are dreaming and can actively influence some aspects of the dream, such as your own actions, the environment to a limited extent, or the course of the narrative.                                                      |
| 5 (High Lucidity)    | You have a strong and stable awareness that you are dreaming and possess a significant degree of control over the dream environment, characters, and events. You can often perform specific actions or explore the dream world intentionally. | 

### Dream Coherence (Score 1-5)

This metric assesses the logical consistency and narrative flow of your dream.

| Score                   | Description |
| ----------------------- | ----------- |
| 1 (Incoherent)          | The dream is fragmented, disjointed, and nonsensical. Scenes shift abruptly without logical connection, characters and objects may change inexplicably, and the laws of reality are entirely suspended without any internal consistency.            |
| 2 (Loosely Connected)   | Some elements or scenes might have a vague or thematic relationship, but the overall narrative lacks a clear and logical progression. Time, space, and causality are often inconsistent.            |
| 3 (Moderately Coherent) | The dream has a discernible narrative thread, but it may contain illogical elements, inconsistencies in character behavior or setting, or sudden, unexplained shifts in the storyline.            |
| 4 (Mostly Coherent)     | The dream generally follows a logical progression with a relatively consistent narrative, characters, and settings. Any illogical elements are minor or don't significantly disrupt the overall sense of a somewhat realistic (albeit dreamlike) experience.            |
| 5 (Highly Coherent)     | The dream feels like a consistent and logical experience, even if the content is surreal or fantastical. There is a clear flow of events, consistent character behavior (within the dream's rules), and a sense of internal consistency in the dream's reality.            |

### Setting Familiarity (Score 1-5)

This metric tracks the degree to which the locations and environments in your dream are recognizable from your waking life.

| Score                     | Description                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Completely Unfamiliar) | All the settings in the dream are entirely novel and have no discernible connection to any places you have experienced in your waking life.                                                 |
| 2 (Vaguely Familiar)      | You experience a sense of déjà vu or a faint feeling of having been in a similar place before, but you cannot specifically identify the location or its connection to your waking memories. |
| 3 (Partially Familiar)    | The dream settings are a blend of recognizable and unfamiliar elements. You might recognize the layout of a room but find it in a completely new building, or a familiar landscape might have strange, uncharacteristic features.                                                                                                                                                                                            |
| 4 (Mostly Familiar)       | The dream primarily takes place in locations you know from your waking life, such as your home, workplace, or familiar landmarks, although there might be minor alterations or unusual juxtapositions.                                                                                                                                                                                            |
| 5 (Completely Familiar)   | All the settings in the dream are direct and accurate representations of places you know well from your waking experience, without any significant alterations or unfamiliar elements.                                                                                                                                                                                            |

### Ease of Recall (Score 1-5)

This metric assesses how readily and effortlessly you can remember the dream upon waking.

| Score              | Description |
| ------------------ | ----------- |
| 1 (Very Difficult) | You wake up with little to no memory of having dreamed. Recalling even a single fragment requires significant mental effort and may only yield fleeting impressions.            |
| 2 (Difficult)      | You remember a few isolated images, emotions, or very brief snippets of the dream, but the overall narrative is elusive and hard to piece together.            |
| 3 (Moderate)       | You can recall the basic outline or a few key scenes of the dream with a reasonable amount of effort. Some details might be hazy or forgotten, but the core of the dream is accessible.            |
| 4 (Easy)           | You remember the dream relatively clearly and can recount a significant portion of the narrative and details without much difficulty. The recall feels relatively immediate and accessible.            |
| 5 (Very Easy)      | The dream is vividly and immediately present in your memory upon waking. You can recall intricate details and the flow of events with little to no effort, as if the experience just happened.            |

### Recall Stability (Score 1-5)

This metric assesses how well your memory of the dream holds up in the minutes immediately following waking.

| Score                  | Description                                                                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (Rapidly Fading)     | The dream memory begins to dissipate almost instantly upon waking. Details vanish quickly, and within a short time (e.g., a few minutes), only a faint impression or a single image might remain.                 |
| 2 (Significant Fading) | You can recall a fair amount initially, but key details and the overall narrative structure fade noticeably within the first 10-15 minutes after waking, making it difficult to reconstruct the full dream later. |
| 3 (Moderate Fading)    | Some details and less significant parts of the dream might fade within the first 15-30 minutes, but the core narrative and key events remain relatively intact.                                                   |
| 4 (Mostly Stable)      | Your recall of the dream remains largely consistent for at least 30 minutes after waking. Only minor details or less impactful elements might fade over time.                                                                                                                                                                                                                  |
| 5 (Very Stable)        | The memory of the dream feels solid and enduring in the immediate post-waking period. You can recall details consistently even after a longer period without actively trying to remember it.                                                                                                                                                                                                                  |

## Using Metrics

### Adding Metrics to Dream Entries
Add metrics to your dream entries using either of these callout formats:

Format 1 (one metric per line):
```markdown
> [!dream-metrics]
> Sensory Detail: 4
> Emotional Recall: 3
> Characters Role: 4
> Characters List: Mom, Dad, My dog Max
> Characters Count: 3
> Familiar Count: 3
> Unfamiliar Count: 0
> Lost Segments: 2
> Descriptiveness: 4
> Confidence Score: 5
```

Format 2 (all metrics on one line):
```markdown
> [!dream-metrics]
> Sensory Detail: 4, Emotional Recall: 3, Characters Role: 4, Characters List: Mom, Dad, My dog Max, Characters Count: 3, Familiar Count: 3, Unfamiliar Count: 0, Lost Segments: 2, Descriptiveness: 4, Confidence Score: 5
```

### Metadata Support
You can add metadata to the callout for custom styling:
```markdown
> [!dream-metrics|hide]  # Hides the metrics in the note view
> Sensory Detail: 4
> Emotional Recall: 3
> Characters Role: 4
> Characters List: Mom, Dad, My dog Max
> Characters Count: 3
> Familiar Count: 3
> Unfamiliar Count: 0
> Lost Segments: 2
> Descriptiveness: 4
> Confidence Score: 5
```

## Tips for Accurate Scoring
1. Score immediately after waking when recall is freshest
2. Be consistent with your scoring across different dreams
3. Use the full range of scores (don't cluster in the middle)
4. Consider each metric independently
5. Review your scoring patterns periodically 