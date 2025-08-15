# **OneiroMetrics Plugin: Interactive Cluster Map (D3.js) Feature Specification**

**Document Version:** 1.0
**Date:** August 3, 2025
**Author:** John Banister
**Project:** OneiroMetrics Plugin for Obsidian
**Feature:** Interactive Cluster Map (Visualizing Dream Data)

## 1. High-Level Vision & Purpose

The primary goal of the Interactive Cluster Map is to provide users with a **visual, interactive exploration of their dreamscape, dynamically organized by theme and time.** This feature aims to overcome the limitations of linear or static displays by presenting dream data as an intuitive, navigable "galaxy" or "thematic landscape." The map will reside as a **full leaf/pane** within the Obsidian workspace, providing ample dedicated space for rich interaction without requiring manual arrangement by the user.

## 2. Data Model & Input

- **Source Data:** The D3.js visualization will leverage the same robust data source that currently feeds the OneiroMetrics "Metrics note" (i.e., the plugin's internal dream scraping and parsing logic, which extracts data from `[!dream-diary]` callouts within Obsidian notes).
- **Data Cache:** A plugin-managed cache should be utilized for the parsed dream data to ensure optimal performance and responsiveness, avoiding repeated parsing of notes on every map load or update.
- **Relevant Data Points per Dream:**
    - `id`: Unique identifier for the dream (e.g., note path, block ID).
    - `date`: Date of the dream entry (for chronological representation/forces).
    - `title`: Dream title.
    - `themes`: Array of strings (e.g., `["Anxiety", "Lucidity"]`).
    - `characters`: Array of strings.
    - `emotional_intensity`: Numerical score (if applicable).
    - `lucidity_level`: Numerical score (if applicable).
    - `snippet`: First X number of words from the dream content for initial display.
    - `full_content_path`: Pointer or direct access to the full Markdown content for in-situ expansion.
- **Data Structure for D3.js:** The plugin will transform the raw dream data into a **flat array of JavaScript objects (nodes)**. Each object will represent a dream and contain the relevant data points as properties. If explicit "connection lines" are implemented (see 3.4), a separate array of "links" (objects defining source and target node IDs) would also be required.

## 3. Visual Elements & Mapping

- **3.1. The "Dream Sphere" (Node) Representation:**
    - **Basic Visual Element:** Each individual dream will be represented as a simple **dot (circle)**, similar to the provided D3.js force demo image.
    - **Default Appearance:** All dots will have a default color when no filters are applied.
    - **Future Enhancement:** Allow users to switch from dots to icons/glyphs for dream spheres.
- **3.2. Theme Visualization:**
    - **Color-coding:** When a specific theme is filtered or highlighted, relevant dream dots will change to a default, distinct color associated with that theme (e.g., "Anxiety" is red, "Lucid" is blue).
    - **Future Enhancement:** Implement user-customizable color palettes for themes in plugin settings.
    - **Clustering:** The layout algorithm (see Section 5) will be primarily responsible for forming visual clusters of thematically related dreams.
    - **"Island" Representation:** Visual shapes (e.g., dynamically drawn circles or polygons using a convex hull algorithm) will be rendered around these natural clusters to visually define and label the "thematic islands." These shapes will be semi-transparent and may be color-coded by the dominant theme of the cluster. Labels for these clusters will be prominently displayed.
- **3.3. Chronological Representation:**
    - Time will act as a *secondary force* within the layout algorithm. While thematic clustering will be primary, the layout will generally pull older dreams towards one side of the map (e.g., left) and newer dreams towards the other (e.g., right), creating a subtle chronological flow across the entire map.
    - Time will also be available as a filterable metric.
    - **Future Enhancement:** Allow users to define the primary clustering/layout by time instead of theme, if desired, in plugin settings.
- **3.4. Connections (Lines):**
    * **Visual Elements:** Lines will be drawn between dream nodes that share specified commonalities (e.g., multiple themes, specific characters, recurring symbols, or explicit user-defined links).
    * **Visibility:** Lines will initially be hidden to reduce clutter. They will become visible or be highlighted primarily during filtering/selection (e.g., when a theme is selected, all lines connecting dreams with that theme become visible/highlighted).
    - **Visual Mapping:** Line color could optionally match the shared theme, or be a neutral hue. Line thickness could indicate strength/number of shared connections.

## 4. Interactions & User Experience

- **4.1. Global Navigation:**
    - **Zooming and Panning:** Standard D3.js pan and zoom behavior to navigate the entire map.
- **4.2. "Dream Sphere" Interaction (Node Click):**
    - **In-Situ Expansion:** Clicking a "dream sphere" (dot) will open an interactive panel that displays details of that dream directly on the map.
    - **Visual Placement:** The panel will appear slightly to the side of the clicked node, with a visual line or arrow pointing from the panel to the originating node. Intelligent positioning will attempt to place it in an open space to minimize overlap with *other unexpanded nodes*.
    - **"One-at-a-Time" Rule:** Only one full dream content panel can be expanded at a time. Opening a new panel will automatically close (collapse) any currently open panel.
    - **Content Display:** The panel will initially show the dream title, dream date, and a dream snippet (first X words). A clear "Read More" button/link will allow the user to expand to the full content within the same panel.
    - **Closing:** The panel will close automatically if another node is clicked. A prominent "X" close button will also be present on the panel itself, and clicking anywhere on the map background (outside the panel) will close it.
    - **Contextual Highlight:** The originating "dream sphere" will remain visually prominent (e.g., brighter glow, thicker border) while its panel is open.
- **4.3. Filtering:**
    - **Mechanism:** Filtering will be controlled via a dedicated sidebar within the Obsidian pane. This sidebar will list available themes, characters, or other filterable metrics.
    - **Visual Effect:** When a filter is applied (e.g., a theme is selected), all non-matching dream nodes will become semi-transparent or dimmed. Matching nodes will become more prominent (e.g., full opacity, distinct color). Connections related to the filter will also become visible/highlighted.
    - **Search:** Future consideration for a text search bar to filter by title or content.
- **4.4. Hover States:** No specific hover reactivity is planned for the nodes themselves to avoid visual jarring. Hovering over a cluster label might provide a summary of that cluster.

## 5. Layout Algorithm (The "Magic" of Clustering)

- **Core Algorithm:** A **force-directed simulation (D3-force)** will be used to automatically position dream spheres.
- **Forces Configuration:**
    - **Repulsion Force:** All nodes will repel each other to prevent overlap.
    - **Attraction Force (Thematic):** Nodes sharing one or more themes will have an attractive force, pulling them together to form clusters. The strength of this attraction can be weighted by the number of shared themes.
    - **Attraction Force (Chronological):** A subtle horizontal force will pull nodes based on their date (e.g., older to the left, newer to the right), providing a general temporal orientation without overriding thematic clustering.
    - **Centering Force:** A force pulling all nodes towards the center of the viewport to keep the graph contained.
- **Clustering Definition:** Clusters will emerge naturally from the force simulation based on thematic attractions. The "island" shapes (see 3.2) will then be drawn around these emergent clusters.

## 6. Performance & Technical Details

- **Rendering Type:** The visualization will be rendered using **D3.js on an HTML `<canvas>` element**. This is chosen for its superior performance when rendering a large number of dynamic elements compared to SVG.
- **Web Workers:** **Web Workers MUST be utilized** to offload computationally intensive tasks (e.g., running the D3-force simulation, complex data transformations) from the main UI thread. This is critical to ensure Obsidian's interface remains responsive, especially for vaults with many dream entries.
- **Initial Load Time:** A **progress bar or loading spinner** will be displayed during the initial data parsing, cache loading, and force simulation calculation to provide user feedback.
- **Responsiveness:** The map should dynamically resize and adapt its layout (e.g., re-run force simulation or adjust scale) when the Obsidian pane or window size changes, ensuring a consistent user experience across different display sizes.

## 7. Cluster, Vector, and Theme Hierarchical Organization

The visualization will support a hierarchical data model that aligns with the user's defined dream taxonomy, enabling a multi-layered and intuitive organization of dream nodes. This will move beyond simple thematic clustering to a more structured, user-defined landscape.

- **7.1. Data Input (Hybrid Model):** The plugin will operate on a hierarchical taxonomy of clusters, vectors, and themes. To provide maximum flexibility and ease of use, a hybrid data model will be implemented:
    - **Default Taxonomy:** The plugin will ship with a standardized, pre-defined set of clusters and vectors. (See Default Taxonomy below.) This default structure will be applied to a user's dream themes automatically, making the feature functional out of the box without any setup.
    - **Custom Taxonomy:** Users will have the option to override the default model by providing their own custom hierarchy file (e.g., a Markdown note or JSON file). The plugin will parse this file to apply the user's personal taxonomy, mapping specific themes to vectors and vectors to clusters (e.g., `Cluster: Identity -> Vector: Self & Detachment -> Theme: Disorientation`).

- **7.2. Cluster-Level Visualization:**
  - **Primary Layout:** Clusters will form the highest level of organization, represented as distinct, spatially separated regions on the map.
  - **Visual Elements:** A convex hull algorithm will draw a semi-transparent polygon around the nodes of a given cluster, forming a large "thematic island." These islands will have a label with the Cluster's name.

- **7.3. Vector-Level Visualization:**
  - **Sub-Clustering:** Within each Cluster's "island," a secondary force-directed simulation will arrange nodes into tighter sub-clusters based on their assigned Vector.
  - **Visual Elements:** Smaller, more subtle semi-transparent polygons will be drawn around each Vector sub-cluster to visually group them. Vector labels will be smaller than Cluster labels but still clearly visible.

- **7.4. Theme-Level Visualization:**
  - **Node Grouping:** The `d3-force` simulation will be configured to attract nodes that share a common theme, pulling them into the tightest possible grouping within their respective Vector sub-cluster.
  - **Filtering & Highlighting:** Selecting a theme from the filter sidebar will highlight all nodes associated with that theme, regardless of their cluster or vector, and will draw the appropriate connection lines.

- **7.5. User Interaction with the Hierarchy:**
  - **Expand/Collapse:** Clicking a Cluster or Vector label will expand or collapse its visual representation. Collapsing a Cluster will hide all internal nodes and vectors, representing it as a single, large, labeled node.
  - **Hierarchical Tooltips:** Hovering over a dream node will display a tooltip showing its full thematic path, e.g., "Identity -> Self & Detachment -> Theme: Disorientation".

### 7.1.1. Standardized Taxonomy

#### **1. Action & Agency**
* **Vector: Mission & Strategy**
    * `Ambition` - Dreams of achieving goals, reaching heights, accomplishing great feats
    * `Challenge` - Facing tests, competitions, obstacles to overcome
    * `Choice` - Standing at crossroads, making important decisions, selecting paths
    * `Coordination` - Organizing groups, synchronizing efforts, teamwork scenarios
    * `Intervention` - Stepping in to help, preventing disasters, changing outcomes
    * `Leadership` - Leading others, taking charge, guiding groups
    * `Mission` - Having a specific quest, important task, or purpose to fulfill
    * `Outreach` - Helping others, extending assistance, making connections
    * `Responsibility` - Being accountable, carrying burdens, fulfilling duties
    * `Strategy` - Planning approaches, solving complex problems, tactical thinking
* **Vector: Pursuit & Consequence**
    * `Acquisition` - Gathering resources, collecting items, obtaining necessities
    * `Escape` - Breaking free, leaving danger, finding exits
    * `Evasion` - Dodging threats, avoiding capture, staying hidden
    * `Maneuver` - Navigating obstacles, strategic movement, skillful navigation
    * `Pursuit` - Being chased, hunting something, following targets
    * `Traversal` - Crossing territories, moving through spaces, journeying
    * `Urgency` - Racing against time, emergency situations, critical deadlines

#### **2. Boundaries & Barriers**
* **Vector: Confinement**
    * `Boundaries`
    * `Confinement`
    * `Constraint`
    * `Containment`
    * `Obstruction`
    * `Sanctuary`
* **Vector: Breach & Collapse**
    * `Breach`
    * `Chaos`
    * `Collapse`
    * `Deconstruction`
    * `Reordering`

#### **3. Conflict, Obstacles, and Resolution**
* **Vector: Open Conflict**
    * `Aggression`
    * `Conflict`
    * `Confrontation`
    * `Contention`
    * `Violence`
* **Vector: Threat & Danger**
    * `Peril`
    * `Danger`
    * `Predation`
    * `Threat`
* **Vector: Overcoming Obstacles**
    * `Struggle`
    * `Resistance`
    * `Resolve`
    * `Remediation`
    * `Sacrifice`
    * `Endurance`
    * `Persistence`
    * `Resilience`
* **Vector: Consequence & Outcome**
    * `Consequences`
    * `Setback`
    * `Ordeal`
    * `Disruption`
    * `Predicament`
    * `Unraveling`
* **Vector: Suppression & Oppression**
    * `Oppression`
    * `Subjugation`

#### **4. Control, Power, and Agency**
* **Vector: Assertion of Power**
    * `Agency`
    * `Autonomy`
    * `Claim`
    * `Command`
    * `Control`
    * `Domination`
    * `Empowerment`
    * `Projection`
    * `Unleashing`
* **Vector: Authority & Systems**
    * `Authority`
    * `Custodianship`
    * `Duty`
    * `Obedience`
    * `Oversight`
    * `Surveillance`
* **Vector: Loss of Control**
    * `Distrust`
    * `Impotence`
    * `Manipulation`
    * `Powerlessness`
    * `Vulnerability`
* **Vector: Moral and Social Power**
    * `Contribution`
    * `Judgment`
    * `Reconciliation`
    * `Responsibility`

#### **5. Creation & Emergence**
* **Vector: Manifestation & Reordering**
    * `Creation`
    * `Emergence`
    * `Manifestation`
    * `Novelty`
    * `Permeation`
    * `Reordering`
* **Vector: Replication & Uniqueness**
    * `Pattern`
    * `Replication`
    * `Ubiquity`
* **Vector: Potential & Fertility**
    * `Fertility`
    * `Nurturing`
    * `Potential`
    * `Provision`

#### **6. Identity & Consciousness**
* **Vector: Self & Detachment**
    * `Detachment` - Feeling disconnected, observing from outside, emotional distance
    * `Discomfort` - Physical or emotional unease, awkward situations, being out of place
    * `Disgust` - Revulsion, rejection, encountering repulsive elements
    * `Disorientation` - Confusion about location/identity, losing bearings, unclear reality
    * `Impassivity` - Emotional numbness, inability to react, frozen feelings
    * `Resignation` - Accepting fate, giving up, surrendering to circumstances
    * `Self-Discovery` - Learning about oneself, revelations, finding identity
* **Vector: Transformation & Change**
    * `Adaptation` - Adjusting to new situations, evolving abilities, fitting in
    * `Alteration` - Changing form, modifying appearance, shifting states
    * `Ascension` - Rising upward, spiritual elevation, reaching higher planes
    * `Augmentation` - Gaining new abilities, enhancement, becoming more
    * `Awakening` - Realizing truth, becoming aware, enlightenment moments
    * `Evolution` - Gradual development, improving, advancing stages
    * `Initiation` - Beginning journeys, rites of passage, entering new phases
    * `Regeneration` - Healing, renewal, restoration of what was lost
    * `Shift` - Sudden changes, reality alterations, perspective switches
    * `Transformation` - Complete metamorphosis, fundamental changes, becoming other
    * `Transition` - Moving between states, in-between phases, crossing thresholds
* **Vector: Fragmentation & Integration**
    * `Abstraction`
    * `Assimilation`
    * `Blurring`
    * `Duality`
    * `Integration`
    * `Symbiosis`
* **Vector: Liberation & Unrestraint**
    * `Emancipation`
    * `Liberation`
    * `Unrestraint`
    * `Exclusion`
* **Vector: Presence & Affect**
    * `Anticipation`
    * `Confidence`
    * `Presence`
* **Vector: Inheritance & Roots**
    * `Ancestry`
    * `Legacy`
    * `Origin`

#### **7. Journeys, Movement, and Process**
* **Vector: Physical Journeys**
    * `Exploration`
    * `Invasion`
    * `Journey`
    * `Passage`
    * `Time Travel`
    * `Traversal`
* **Vector: Repetitive Processes**
    * `Cycle`
    * `Performance`
    * `Recursion`
    * `Repetition`
    * `Ritual`
* **Vector: Navigation & Maneuver**
    * `Maneuver`
    * `Navigation`
* **Vector: Mental Journeys**
    * `Nostalgia`
    * `Re-experience`
    * `Recollection`
    * `Seeking Clarity`

#### **8. Perception, Reality, and Deception**
* **Vector: Observation & Awareness**
    * `Awareness`
    * `Observation`
    * `Perception`
    * `Scrutiny`
    * `Vigilance`
* **Vector: Revelation & Discovery**
    * `Discovery`
    * `Disclosure`
    * `Encounter`
    * `Incursion`
    * `Origin`
    * `Revelation`
* **Vector: Truth vs. Illusion**
    * `Authenticity`
    * `Deception`
    * `Discrepancy`
    * `Disillusionment`
    * `Elusiveness`
    * `Misunderstanding`
    * `Perspective`
    * `Reality`
    * `Simulation`
* **Vector: The Unknowable**
    * `Dichotomy`
    * `Enigma`
    * `Foreboding`
    * `Omnipotence`
* **Vector: Concealment & Unraveling**
    * `Concealment`
    * `Evasion`
    * `Exposure`
    * `Unraveling`

#### **9. Relationships & Connection**
* **Vector: Forming Connections**
    * `Affection`
    * `Connection`
    * `Interconnection`
    * `Intimacy`
    * `Reconnection`
    * `Relationships`
* **Vector: Social & Emotional Dynamics**
    * `Approval`
    * `Communication`
    * `Empathy`
    * `Judgment`
    * `Longing`
    * `Negotiation`
    * `Reconciliation`
* **Vector: Social Division**
    * `Disconnection`
    * `Disengagement`
    * `Exclusion`
    * `Impassivity`

### **10. Resources & Provision**
* **Vector: Management & Maintenance**
    * `Documentation`
    * `Measurement`
    * `Preservation`
    * `Structure`
* **Vector: Reliance & Support**
    * `Assistance`
    * `Reliance`
    * `Support`
* **Vector: Provision & Scarcity**
    * `Acquisition`
    * `Extraction`
    * `Nurturing`
    * `Provision`

#### **11. Abstract Concepts and Environments**
* **Vector: Scale & Scope**
    * `Abundance`
    * `Density`
    * `Expansion`
    * `Magnitude`
    * `Overwhelm`
* **Vector: Otherworld & The Surreal**
    * `Otherworld`
    * `Dichotomy`
    * `Enigma`
    * `Contamination`
    * `Esotericism`
    * `Mysticism`

#### **12. Physical & Metaphysical**
* **Vector: Physical & Bodily Experience**
    * `Cleansing`
    * `Contamination`
    * `Discomfort`
    * `Disgust`
    * `Extremity`
    * `Fearlessness`
    * `Grief`
    * `Physicality`
    * `Pain`
    * `Sensation`
    * `Emotions`

#### **13. Nature & Elements**
* **Vector: Natural Forces**
    * `Storm` - Weather phenomena, natural power, environmental chaos
    * `Fire` - Burning, destruction, transformation through heat
    * `Water` - Floods, drowning, cleansing, emotional depths
    * `Earth` - Grounding, stability, burial, growth
    * `Air` - Wind, breath, freedom, communication
* **Vector: Natural Environments**
    * `Forest` - Getting lost, finding paths, natural sanctuary
    * `Ocean` - Vast unknown, depths, waves of emotion
    * `Mountain` - Climbing, achievement, obstacles, perspective
    * `Desert` - Isolation, survival, spiritual journey
    * `Garden` - Cultivation, beauty, paradise, growth

#### **14. Technology & Digital**
* **Vector: Digital Existence**
    * `Virtual Reality` - Simulated worlds, questioning reality
    * `Social Media` - Connection/disconnection, public persona
    * `Gaming` - Competition, alternate lives, achievement
    * `Glitches` - Reality breaking down, system errors
* **Vector: Technological Control**
    * `Automation` - Loss of human control, efficiency
    * `Surveillance Tech` - Being watched through devices
    * `AI/Robots` - Non-human intelligence, replacement fears
    * `Connectivity` - Networks, being plugged in/unplugged

### 7.1.2. Common Dream Scenario Mappings

Understanding how common dream scenarios map to the taxonomy helps users quickly categorize their dreams:

* **Being Chased**: Conflict, Obstacles, and Resolution → Threat & Danger → `Pursuit`, `Evasion`, `Danger`
* **Flying**: Identity & Consciousness → Liberation & Unrestraint → `Emancipation`, `Unrestraint`; or Control, Power, and Agency → Assertion of Power → `Empowerment`
* **Falling**: Control, Power, and Agency → Loss of Control → `Powerlessness`, `Vulnerability`
* **Being Naked in Public**: Identity & Consciousness → Self & Detachment → `Discomfort`, `Disorientation`; Perception, Reality, and Deception → Concealment & Unraveling → `Exposure`
* **Death/Dying**: Identity & Consciousness → Transformation & Change → `Transition`, `Transformation`
* **Lost/Can't Find Something**: Journeys, Movement, and Process → Navigation & Maneuver → `Navigation`; Identity & Consciousness → Self & Detachment → `Disorientation`
* **Taking a Test**: Action & Agency → Mission & Strategy → `Challenge`, `Strategy`; Control, Power, and Agency → Loss of Control → `Vulnerability`
* **Meeting Deceased People**: Relationships & Connection → Forming Connections → `Reconnection`; Identity & Consciousness → Inheritance & Roots → `Ancestry`, `Legacy`
* **Natural Disasters**: Boundaries & Barriers → Breach & Collapse → `Chaos`, `Collapse`; Conflict, Obstacles, and Resolution → Threat & Danger → `Peril`
* **Being Late**: Action & Agency → Pursuit & Consequence → `Urgency`; Control, Power, and Agency → Loss of Control → `Powerlessness`
* **Technology Nightmares**: Technology & Digital → Digital Existence → `Glitches`; Technology & Digital → Technological Control → `Automation`
* **Nature Dreams**: Nature & Elements → Natural Environments → Various based on specific environment

### 7.1.3. Theme Overlap and Multi-Vector Assignment

Some themes naturally belong to multiple vectors, reflecting the complex nature of dream symbolism:

* **Themes with Multiple Vectors**: 
  - `Traversal` appears in both "Pursuit & Consequence" (action-oriented movement) and "Physical Journeys" (exploration-oriented movement)
  - `Responsibility` appears in both "Mission & Strategy" (taking on duties) and "Moral and Social Power" (social obligations)
  - Users can assign a theme to multiple vectors through the custom taxonomy file
  
* **Visualization of Multi-Vector Themes**:
  - Nodes with themes belonging to multiple vectors will have connection lines to each relevant vector
  - During filtering, these nodes will be highlighted when any of their associated vectors are selected
  - Tooltip will show all vector associations: "Traversal: Action & Agency → Pursuit & Consequence; Journeys → Physical Journeys"

* **User Customization**:
  - Users can reassign themes to different vectors in their custom taxonomy
  - The settings panel will allow drag-and-drop reassignment of themes between vectors
  - A "theme conflict resolver" will help users decide primary vector assignment when importing dreams

- **7.2. Cluster-Level Visualization:**
  - **Primary Layout:** Clusters will form the highest level of organization, represented as distinct, spatially separated regions on the map.
  - **Visual Elements:** A convex hull algorithm will draw a semi-transparent polygon around the nodes of a given cluster, forming a large "thematic island." These islands will have a label with the Cluster's name.

- **7.3. Vector-Level Visualization:**
  - **Sub-Clustering:** Within each Cluster's "island," a secondary force-directed simulation will arrange nodes into tighter sub-clusters based on their assigned Vector.
  - **Visual Elements:** Smaller, more subtle semi-transparent polygons will be drawn around each Vector sub-cluster to visually group them. Vector labels will be smaller than Cluster labels but still clearly visible.

- **7.4. Theme-Level Visualization:**
  - **Node Grouping:** The `d3-force` simulation will be configured to attract nodes that share a common theme, pulling them into the tightest possible grouping within their respective Vector sub-cluster.
  - **Filtering & Highlighting:** Selecting a theme from the filter sidebar will highlight all nodes associated with that theme, regardless of their cluster or vector, and will draw the appropriate connection lines.

- **7.5. User Interaction with the Hierarchy:**
  - **Expand/Collapse:** Clicking a Cluster or Vector label will expand or collapse its visual representation. Collapsing a Cluster will hide all internal nodes and vectors, representing it as a single, large, labeled node.
  - **Hierarchical Tooltips:** Hovering over a dream node will display a tooltip showing its full thematic path, e.g., "Identity -> Self & Detachment -> Theme: Disorientation".

## 8. Performance Considerations for Large Taxonomies

With 14 clusters containing 300+ themes, performance optimization is critical:

### 8.1. Force Simulation Optimization
- **Hierarchical Simulation**: Run separate force simulations for each cluster to reduce computational complexity from O(n²) to O(n²/k) where k is the number of clusters
- **Simulation Throttling**: Limit force simulation iterations and use `simulation.alphaDecay()` to converge faster
- **Web Worker Implementation**: Run force calculations in a Web Worker to prevent UI blocking
- **Adaptive Quality**: Reduce simulation accuracy when panning/zooming, increase when stationary

### 8.2. Rendering Optimization
- **Level-of-Detail (LOD) Rendering**:
  - Zoomed out: Show only cluster labels and simplified shapes
  - Medium zoom: Show cluster and vector labels
  - Zoomed in: Show all nodes, connections, and theme labels
- **Viewport Culling**: Only render elements within the current viewport + margin
- **Canvas Layering**: Use multiple canvas layers (background clusters, nodes, labels) to optimize redraws
- **Debounced Updates**: Batch DOM updates using requestAnimationFrame

### 8.3. Data Management
- **Lazy Loading**: Load vector and theme data only when clusters are expanded
- **Progressive Enhancement**: Start with basic clusters, load details as needed
- **Indexed Storage**: Use IndexedDB for caching parsed dream data and computed positions
- **Incremental Updates**: When new dreams are added, only recalculate affected clusters

### 8.4. Visual Optimization
- **Color Palette Strategy**: 
  - Use 14 distinct base colors for clusters (including new Nature and Technology clusters)
  - Use color variations (lighter/darker) for vectors within clusters
  - Implement colorblind-friendly palette option
- **Spatial Layout**: 
  - Initial Implementation: Arrange clusters in a circular pattern for equal visibility
  - Alternative Layouts: Honeycomb grid, spiral, or user-customizable positions
  - Smart Positioning: Place frequently-used clusters in more accessible positions

### 8.5. Interaction Performance
- **Interaction Zones**: Create invisible larger hit targets for small nodes
- **Precomputed Paths**: Cache theme hierarchy paths for instant tooltip display
- **Smart Filtering**: Use bloom filters for fast theme membership testing
- **Batched Animations**: Group visual transitions to maintain 60 FPS

### 8.6. Implementation Priorities
Based on performance considerations, implement features in this order:
1. Start with 5-6 most common clusters (Identity, Relationships, Control, Conflict, Journeys, Perception)
2. Implement basic expand/collapse before adding all clusters
3. Add remaining clusters based on user demand and performance testing
4. Implement advanced features (multi-vector themes, custom layouts) last