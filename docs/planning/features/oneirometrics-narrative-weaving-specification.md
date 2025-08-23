OneiroMetrics Narrative Weaving Feature Specification

This document outlines the user experience, logic, and technical requirements for the "Narrative Weaving" feature within the OneiroMetrics Obsidian plugin. The feature's primary objective is to transform raw, fragmented dream data into a cohesive and meaningful narrative, empowering users to find inspiration and insights from their dream collection.

1. User Experience (UX)
1.1 Access & Interface
The user will access the Narrative Weaving feature from a dedicated button in the Obsidian Control Center hub.

Clicking the button will open a new, dedicated view (a leaf) within Obsidian.

This view will have a minimalist interface, resembling the current OneiroMetrics Dashboard.

1.2 Dream Selection
The primary interface will provide a way for users to select the dreams they want to weave.

This selection can be made from a filterable list of all dreams, with options to filter by date, keyword, emotional score, or theme.

Users will also have the option to "Weave All" dreams.

1.3 Weaving Parameters
A collapsible section in the interface will allow users to define the Weaving Parameters.

Narrative Flow: A dropdown menu with the following options (defaults to Thematic Weave):

Thematic Weave: Prioritizes emotional and thematic connections.

Character Arc: Arranges dreams to follow a single character's journey.

Setting-Based Chronology: Prioritizes a specific location or environment.

Emotional Arc: Arranges dreams to follow a specific emotional progression.

Contradiction Handling: A dropdown menu to manage conflicting information.

Embrace the Contradiction (Default): Incorporates conflicts as part of dream logic.

Resolve the Contradiction: Ignores conflicting data to maintain a single narrative.

Flag Contradictions: Inserts a markdown comment to highlight discrepancies.

Tone & Style: A text field for the user to describe the desired tone or style (e.g., "mysterious," "whimsical," "tense," "in the style of Haruki Murakami").

1.4 Output
A button labeled "Weave Narrative" will initiate the process.

The output will be a new Obsidian note (as a new markdown file). The file name and location will be configurable by the user.

The output will be streamed as it is generated, making the process feel faster and more responsive.

The user will have the option to "re-roll" the output to get a new version.

2. Data & Logic
2.1 Core Weaving Logic
The feature will use all currently enabled metrics from the OneiroMetrics Control Center.

The primary input will be the dream content and the associated metrics, with a heavy reliance on the Symbolic Content metric.

The chosen Narrative Flow parameter will guide the LLM's logic for connecting the dreams. For example, a "Character Arc" flow will prompt the LLM to search for and prioritize dreams with recurring characters from the Symbolic Content metric.

2.2 Data Integration
The LLM prompt will be enriched with data beyond the metrics.

Symbolic Content: The plugin will use the Symbolic Content metric to provide the LLM with key people, objects, animals, and concepts to use as narrative anchors.

Waking Life Context (Optional): If a user has a dedicated field for waking life events, this data will be included in the prompt to find connections between dreams and waking experience.

User-Defined Codex (Optional): The plugin can also prompt the user to create a separate "Dream Codex" note, where they define recurring characters or settings. The content of this codex would be included in the prompt to ensure consistency.

3. Technical Requirements & Integrations
3.1 Large Language Model (LLM) Integration
The feature will require a connection to a Large Language Model (LLM) to perform the narrative generation.

The specification will support two modes to prioritize user privacy:

API Mode: The plugin will allow users to input their own API key for an external LLM service (e.g., GPT-4, Claude). A clear warning will be displayed about data being sent to a third party.

Local LLM Mode: The plugin will detect if a local LLM server (like Ollama) is running on the user's computer. If so, it will use this local model, ensuring that the user's data never leaves their machine.

3.2 Performance Optimization
The plugin will pre-process dream data before sending it to the LLM to reduce the number of input tokens, improving performance and reducing cost.

The output text will be streamed to the new note as it's generated to provide a faster user experience.

An option to use a "lighter," faster model (for quick drafts) vs. a "heavier," more powerful model (for final versions) will be considered for a future release.

4. User Control & Customization
Editing: The output is a standard Obsidian note, allowing for full editing by the user.

Re-Rolling: The user can click the "Weave Narrative" button again to generate a completely new version of the story.

Templates & Recipes: The plugin will allow users to save their chosen weaving parameters as a "recipe" that can be loaded for future use. This is a key feature for creative experimentation.

Error Handling: All errors from the LLM or API will be logged to the Obsidian developer console, providing a clear path for debugging.