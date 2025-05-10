# OneiroMetrics Metrics Guide

This document provides detailed descriptions of the metrics used in OneiroMetrics for dream journal analysis.

## Metric Descriptions

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

### Lost Segments (Number)
This metric tracks the number of distinct instances where you have a clear feeling or awareness that a part of the dream is missing or has been forgotten. This isn't about omitting fragments you never recalled in the first place. It's about those "gaps" in your recalled narrative where you feel like "there was something else there," or you have a fleeting image or feeling that then vanishes.

If you recall the dream as a complete, seamless narrative with no sense of missing parts, this score would be 0.

If you have a distinct feeling of one or more breaks or missing chunks in the dream's sequence, you would count each of those instances.

### Descriptiveness (Score 1-5)
This metric assesses the level of detail and elaboration in your written dream capture, beyond just sensory details (which have their own metric). This considers how thoroughly you describe the events, characters, interactions, and the overall narrative flow.

| Score                | Description |
| -------------------- | ----------- |
| 1 (Minimal)          | Your capture is very brief and outlines only the most basic elements of the dream. It lacks detail and elaboration. |
| 2 (Limited)          | Your capture provides a basic account of the dream but lacks significant descriptive detail in terms of actions, character behavior, or plot progression. |
| 3 (Moderate)         | Your capture provides a reasonably detailed account of the main events and characters, with some descriptive language used. |
| 4 (Detailed)         | Your capture includes a significant level of descriptive detail, bringing the dream narrative and its elements to life with more thorough explanations and imagery. |
| 5 (Highly Elaborate) | Your capture is very rich in detail, using vivid language to describe the events, characters, their motivations (if perceived), and the overall unfolding of the dream narrative. |

### Confidence Score (Score 1-5)
This is a subjective metric reflecting your overall sense of how complete and accurate your dream recall feels immediately after waking. It's your gut feeling about how much of the dream you've managed to retrieve.

| Score         | Description |
| ------------- | ----------- |
| 1 (Very Low)  | You feel like you've barely scratched the surface of the dream, remembering only a tiny fragment or a fleeting feeling. You suspect you've forgotten a significant portion. |
| 2 (Low)       | You recall a bit more, but you still feel like a substantial part of the dream is lost. The recall feels fragmented and incomplete. |
| 3 (Moderate)  | You feel like you've recalled a fair amount of the dream, perhaps the main storyline, but there might be some fuzzy areas or details you're unsure about. |
| 4 (High)      | You feel like you've recalled the majority of the dream with a good level of detail and coherence. You feel relatively confident in the accuracy of your memory. |
| 5 (Very High) | You feel like you've recalled the entire dream in vivid detail and with strong confidence in the accuracy and completeness of your memory. You don't have a sense of significant missing parts. |

## Using Metrics

### Adding Metrics to Dream Entries
Add metrics to your dream entries using either of these callout formats:

Format 1 (one metric per line):
```markdown
> [!dream-metrics]
> Sensory Detail: 4
> Emotional Recall: 3
> Lost Segments: 2
> Descriptiveness: 4
> Confidence Score: 5
```

Format 2 (all metrics on one line):
```markdown
> [!dream-metrics]
> Sensory Detail: 4, Emotional Recall: 3, Lost Segments: 2, Descriptiveness: 4, Confidence Score: 5
```

### Metadata Support
You can add metadata to the callout for custom styling:
```markdown
> [!dream-metrics|hide]  # Hides the metrics in the note view
> Sensory Detail: 4
> Emotional Recall: 3
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