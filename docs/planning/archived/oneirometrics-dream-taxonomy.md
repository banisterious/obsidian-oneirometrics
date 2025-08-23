### **OneiroMetrics Plugin: Cluster/Vector/Theme Hierarchy Specification**

**Document Version:** 1.0
**Date:** August 21, 2025
**Author:** AI Assistant / [Your Name]
**Project:** OneiroMetrics Plugin for Obsidian
**Feature:** Cluster/Vector/Theme Management

#### **1. High-Level Vision & Purpose**

The purpose of this feature is to provide users with a structured, hierarchical framework for categorizing their dreams beyond a flat list of themes. By defining a hierarchy of **Clusters, Vectors, and Themes**, users can gain a deeper understanding of their dreamscape and organize their data in a way that directly informs visualizations like the OneiroGraph. This structure will serve as the default categorization system and be fully user-editable.

#### **2. Core Concepts & Terminology**

* **Theme (Lowest Level):** A single, specific keyword or concept describing an aspect of a dream (e.g., `Anxiety`, `Flying`, `Lucidity`). Themes are the building blocks of the system.
* **Vector (Mid-Level):** A logical grouping of one or more related Themes. A Vector represents a focused area or a specific type of dream experience (e.g., the **"Movement & Action"** Vector could contain the themes `Flying`, `Falling`, and `Running`).
* **Cluster (Highest Level):** A broad grouping of one or more Vectors. A Cluster represents a major domain of the dreamscape, providing the highest level of organization (e.g., the **"Core Emotions"** Cluster could contain the Vectors for `Anxiety` and `Joy & Fulfillment`).

---

#### **3. Default Hierarchy & Structure**

The plugin will ship with a sensible, pre-defined default hierarchy to guide new users. This structure can be fully edited, renamed, or deleted by the user.

<p align="center">
  <img src="docs/images/oneirometrics-dream-taxonomy-table.png" alt="Dream Taxonomy table" width="600"/>
</p>
<p align="center"><em>OneiroMetrics Dream Taxonomy table</em></p>

---

#### **4. Feature Functionality**

* **4.1. Hierarchy Management UI:**
    * A new, dedicated settings tab or a modal window will provide a visual interface for managing the hierarchy.
    * The UI will display the hierarchy as a collapsible tree structure, allowing users to expand/collapse Clusters and Vectors to navigate.
    * **Actions:**
        * **Add:** A button or context menu to add a new Cluster, Vector, or Theme at the appropriate level.
        * **Edit:** Click to rename an existing Cluster, Vector, or Theme.
        * **Delete:** A button to delete an entry and all its nested children. A confirmation dialog will be required.
        * **Drag-and-Drop:** Users will be able to drag-and-drop a Theme, Vector, or Cluster to rearrange its position within the hierarchy or move it to a different parent.
* **4.2. Integration with Dream Metrics:**
    * The in-app modal for applying dream metrics will use this hierarchy to populate its options, allowing users to select themes from the tree view.
    * When a user selects a Theme, its parent Vector and Cluster will be automatically recorded in the note's YAML frontmatter (or a JSON object within the note's callout) in a structured format (e.g., `themes: [{cluster: "Core Emotions", vector: "Negative Affects", theme: "Anxiety"}]`).
* **4.3. Integration with OneiroGraph:**
    * The OneiroGraph visualization will directly leverage this hierarchy. Clusters will be used to define the "thematic islands" or major groupings. Vectors will inform a finer level of clustering within those islands.
    * The hierarchical data will be used to automatically apply the color-coding, layout forces, and filtering logic of the OneiroGraph, without requiring any manual setup from the user.

---

#### **5. Technical Considerations**

* **5.1. Data Storage:** The entire Cluster/Vector/Theme hierarchy will be saved as a single **JSON file** within the plugin's data directory. This file will be loaded on plugin startup and saved whenever the user makes an edit.
* **5.2. UI Implementation:** The UI should be built with a JavaScript framework that supports dynamic tree views and drag-and-drop functionality, ensuring a smooth and intuitive user experience that is not overwhelming.
* **5.3. Backwards Compatibility:** The feature should be designed to handle older dream notes that used a flat list of themes, ensuring the plugin can still parse and display them correctly within the new system (e.g., by automatically assigning them to an "Uncategorized" Cluster).
* **5.4. Performance:** Given the nature of a single, static data file, performance should be excellent, as no heavy parsing is required on every note. The focus will be on the responsiveness of the editing UI itself.