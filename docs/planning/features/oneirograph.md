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

#### **6. Performance & Technical Details**

- **Rendering Type:** The visualization will be rendered using **D3.js on an HTML `<canvas>` element**. This is chosen for its superior performance when rendering a large number of dynamic elements compared to SVG.
- **Web Workers:** **Web Workers MUST be utilized** to offload computationally intensive tasks (e.g., running the D3-force simulation, complex data transformations) from the main UI thread. This is critical to ensure Obsidian's interface remains responsive, especially for vaults with many dream entries.
- **Initial Load Time:** A **progress bar or loading spinner** will be displayed during the initial data parsing, cache loading, and force simulation calculation to provide user feedback.
- **Responsiveness:** The map should dynamically resize and adapt its layout (e.g., re-run force simulation or adjust scale) when the Obsidian pane or window size changes, ensuring a consistent user experience across different display sizes.
