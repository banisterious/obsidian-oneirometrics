# Dream Taxonomy & Oneirograph Integration Plan

- **Document Version:** 1.1
- **Date:** August 2025
- **Status:** Phase 4 Partially Complete
- **Priority:** High  
- **Progress:** 3 phases complete, Phase 4 ~50% implemented

## Executive Summary

This document outlines the integrated implementation plan for two complementary features: the Dream Taxonomy system and the Oneirograph visualization. Together, these features will provide OneiroMetrics users with a structured yet flexible framework for categorizing their dreams and a powerful visual interface for exploring their dreamscape.

The Dream Taxonomy provides a three-tier hierarchical organization (Clusters → Vectors → Themes), while the Oneirograph creates an interactive, force-directed graph visualization that spatially represents this hierarchy as a navigable "dream landscape."

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Feature Overview](#feature-overview)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Phases](#implementation-phases)
5. [User Experience Design](#user-experience-design)
6. [Performance Strategy](#performance-strategy)
7. [Testing & Quality Assurance](#testing--quality-assurance)
8. [Success Metrics](#success-metrics)
9. [Risk Mitigation](#risk-mitigation)
10. [Future Enhancements](#future-enhancements)

## Vision & Goals

### Primary Objectives

1. **Structured Organization**: Provide users with a meaningful way to categorize and understand their dream themes beyond flat lists
2. **Visual Exploration**: Enable intuitive navigation of dream data through spatial representation
3. **Progressive Complexity**: Offer immediate value with defaults while supporting advanced customization
4. **Seamless Integration**: Create a unified experience between taxonomy management and visualization

### Key Benefits

- **For New Users**: Immediate structure and guidance for dream categorization
- **For Power Users**: Deep customization and analytical capabilities
- **For Researchers**: Standardized framework for dream analysis and comparison
- **For the Community**: Shareable taxonomies and visualization patterns

## Feature Overview

### Dream Taxonomy System

A hierarchical classification system with three levels:

1. **Clusters** (14 default categories): Broad thematic domains
2. **Vectors** (60+ subcategories): Specific aspects within clusters
3. **Themes** (300+ items): Individual dream elements

**Key Capabilities:**
- Default taxonomy provided out-of-the-box
- Full customization via drag-and-drop interface
- Import/export for sharing
- Multi-vector theme support
- Backward compatibility with existing flat themes

### Oneirograph Visualization

An interactive, force-directed graph that visualizes dreams as nodes within the taxonomy structure:

**Key Features:**
- Spatial clustering based on taxonomy hierarchy
- Progressive detail levels (zoom-dependent)
- Real-time filtering and search
- In-situ dream content expansion
- Connection lines for shared themes
- Performance optimization for large datasets

## Technical Architecture

### Data Models

```typescript
// Taxonomy Structure
interface TaxonomyCluster {
  id: string;
  name: string;
  description?: string;
  color: string;
  vectors: TaxonomyVector[];
  position?: { x: number; y: number }; // For custom layouts
}

interface TaxonomyVector {
  id: string;
  name: string;
  description?: string;
  themes: TaxonomyTheme[];
  parentClusterId: string;
}

interface TaxonomyTheme {
  id: string;
  name: string;
  aliases?: string[]; // Alternative names/spellings
  vectorIds: string[]; // Support multi-vector assignment
  customMetadata?: Record<string, any>;
}

// Visualization Data
interface OneirographNode {
  id: string; // Dream entry ID
  date: Date;
  title: string;
  themes: ThemeAssignment[];
  position: { x: number; y: number };
  cluster: string;
  vectors: string[];
}

interface ThemeAssignment {
  themeId: string;
  clusterId: string;
  vectorId: string;
  confidence?: number; // For future ML features
}
```

### Storage Architecture

```typescript
// File Structure
plugin-data/
├── taxonomy/
│   ├── default-taxonomy.json    // Shipped with plugin
│   ├── user-taxonomy.json       // User customizations
│   └── taxonomy-backup-{date}.json
├── oneirograph/
│   ├── layout-cache.json        // Cached node positions
│   ├── view-state.json          // Zoom, pan, filters
│   └── performance-metrics.json
└── settings.json                // Plugin settings
```

### Component Architecture

```mermaid
graph TB
    subgraph "Data Layer"
        TM[TaxonomyManager]
        DC[DreamCache]
        PM[PositionManager]
    end
    
    subgraph "UI Layer"
        TE[TaxonomyEditor]
        OV[OneirographView]
        TP[ThemePicker]
    end
    
    subgraph "Visualization Engine"
        FS[ForceSimulation]
        RP[RenderPipeline]
        WW[WebWorker]
    end
    
    TM --> TE
    TM --> TP
    TM --> FS
    DC --> OV
    DC --> FS
    PM --> OV
    FS --> WW
    WW --> RP
    RP --> OV
```

## Implementation Phases

### Phase 1: Taxonomy Foundation (Weeks 1-2) ✅ **COMPLETED**

**Goals**: Establish core taxonomy system with basic UI

**Tasks**:
1. **Data Model Implementation** ✅
   - Create TypeScript interfaces and classes
   - Implement taxonomy storage/retrieval
   - Build default taxonomy dataset
   - Add migration support for existing themes

2. **Taxonomy Manager Service** ✅
   - CRUD operations for clusters/vectors/themes
   - Import/export functionality
   - Validation and consistency checks
   - Theme search and lookup

3. **Basic Control Center Tab UI** ✅
   - Read-only taxonomy viewer
   - Expand/collapse tree navigation
   - Search functionality
   - Theme count indicators

**Deliverables**: ✅ **ALL COMPLETED**
- Working taxonomy data model with comprehensive type definitions
- Dream Taxonomy tab added to Control Center (positioned between Metrics and Reference)
- Default taxonomy loaded with 11 clusters, 40+ vectors, 200+ themes
- Basic hierarchical tree view UI with search and statistics
- Full theme compatibility and accessibility compliance
- Foundation ready for Phase 2 editing features

**Implementation Details**:
- **Branch**: `feature/dream-taxonomy`
- **Files Created**: 5 new files, 12 files modified, 3,200+ lines of code
- **Key Components**: 
  - `src/types/taxonomy.ts` - Complete type definitions
  - `src/data/default-taxonomy.ts` - Comprehensive default taxonomy
  - `src/dom/components/DreamTaxonomyTab.ts` - Main UI component
  - `src/state/TaxonomyManager.ts` - Data management service
  - `styles/dream-taxonomy.css` - Obsidian-native styling

### Phase 2: Taxonomy Editing (Weeks 3-4) ✅ **COMPLETED**

**Goals**: Full editing capabilities for taxonomy customization

**Important**: Phase 2 **enhances the existing Control Center Dream Taxonomy tab** with in-place editing capabilities using a hybrid approach - simple operations inline, complex operations via modals.

**Tasks**:
1. **In-Place Drag-and-Drop Editor** ✅
   - Enable drag-and-drop within the existing tree view
   - Move themes between vectors
   - Reorder vectors within clusters
   - Inline editing for names (double-click to edit)
   - Create/rename/delete operations via hover actions
   - Undo/redo support in existing toolbar

2. **Advanced Tree View Features** ✅
   - Multi-vector theme assignment (via modal)
   - Bulk selection and operations
   - Theme aliasing and synonyms (via modal)
   - Custom cluster colors (via modal color picker)
   - Import/Export buttons functionality

3. **Modal Integration** ✅
   - ClusterEditModal for complex cluster editing
   - VectorEditModal for vector management
   - ThemeEditModal for multi-vector assignment and aliases
   - TaxonomyDeleteModal for safe deletion with warnings

**Deliverables**: ✅ **ALL COMPLETED**
- Enhanced Control Center tab with hybrid editing approach
- Full drag-and-drop functionality for themes and vectors
- Comprehensive modal system for complex operations
- Undo/redo system with 50-action history
- Import/export functionality for JSON taxonomy files
- Keyboard navigation and accessibility compliance
- Introduction paragraph explaining hierarchical system
- Mobile-optimized touch interactions

**Implementation Details**:
- **Hybrid Approach**: Simple edits inline, complex operations in modals
- **Files Enhanced**: `DreamTaxonomyTab.ts` (867+ lines), `TaxonomyEditModal.ts` (867 lines)
- **Key Features**: 
  - Double-click inline editing with validation
  - Hover action buttons (Edit, Add, Delete)
  - Full drag-and-drop with visual feedback
  - Modal forms with color pickers, icon selection
  - Keyboard navigation (F2, Delete, Arrow keys)
  - Touch-optimized for mobile devices

### Phase 3: Basic Oneirograph (Weeks 5-6) ✅ **COMPLETED**

**Goals**: Minimum viable graph visualization

**Tasks**:
1. **View Infrastructure**
   - Create OneirographView extending ItemView
   - Canvas setup with pan/zoom
   - Basic D3.js integration
   - Loading states and error handling

2. **Cluster-Level Visualization**
   - Force simulation for cluster positioning
   - Convex hull rendering for cluster boundaries
   - Cluster labels and colors
   - Basic node rendering (dots)

3. **Core Interactions**
   - Click cluster to zoom in
   - Pan and zoom controls
   - Node hover tooltips
   - Basic performance monitoring

**Deliverables**:
- Working Oneirograph view
- Cluster-level visualization
- Basic navigation
- Performance baseline

### Phase 4: Full Oneirograph (Weeks 7-8) ✅ **COMPLETED**

**Goals**: Complete visualization with all planned features

**Tasks**:
1. **Vector & Theme Visualization**
   - Sub-clustering within clusters
   - Vector boundary rendering
   - Theme-based node positioning
   - Connection lines implementation

2. **Advanced Interactions**
   - Expand/collapse clusters and vectors
   - Dream content in-situ expansion
   - Live filtering and search
   - Keyboard navigation

3. **Performance Optimization**
   - Web Worker integration
   - Level-of-detail rendering
   - Viewport culling
   - Canvas layering

**Deliverables**:
- Full hierarchical visualization
- All interaction features
- Optimized performance
- Accessibility compliance

### Phase 5: Integration & Polish (Weeks 9-10)

**Goals**: Seamless integration and production readiness

**Tasks**:
1. **Cross-Feature Integration**
   - Sync taxonomy changes to graph
   - Bidirectional navigation
   - Unified search/filter
   - Settings persistence

2. **Analytics Integration**
   - Theme distribution charts
   - Cluster/vector statistics
   - Orphan theme detection
   - Usage patterns

3. **Polish & Documentation**
   - UI/UX refinements
   - Performance tuning
   - User guide creation
   - Video tutorials

**Deliverables**:
- Fully integrated features
- Analytics dashboards
- Complete documentation
- Release candidate

## User Experience Design

### Taxonomy Editor Workflow

```
1. User opens Settings → Dream Taxonomy
2. Sees tree view with clusters expanded
3. Can drag themes between vectors
4. Changes reflected immediately
5. Auto-save with undo support
6. Export to share with others
```

### Oneirograph Navigation Flow

```
1. User opens Oneirograph view
2. Sees high-level cluster map
3. Clicks cluster to zoom in
4. Sees vectors within cluster
5. Clicks vector to see themes
6. Clicks node to read dream
7. Uses sidebar for filtering
```

### Key UI Principles

1. **Progressive Disclosure**: Start simple, reveal complexity
2. **Direct Manipulation**: Drag-and-drop, click-to-zoom
3. **Immediate Feedback**: Real-time updates, smooth animations
4. **Contextual Help**: Tooltips, guided tours
5. **Keyboard Accessible**: Full keyboard navigation

## Performance Strategy

### Taxonomy Performance

- **Lazy Loading**: Load vectors/themes on demand
- **Indexing**: Build search indices for fast lookup
- **Caching**: Cache computed hierarchies
- **Debouncing**: Batch rapid edits

### Oneirograph Performance

#### Rendering Targets
| Dreams | Initial Load | Pan/Zoom | Filter |
|--------|-------------|----------|---------|
| 100    | <500ms      | 60 FPS   | <50ms   |
| 1,000  | <2s         | 30 FPS   | <100ms  |
| 10,000 | <5s         | 20 FPS   | <200ms  |

#### Optimization Techniques

1. **Web Workers**: Offload force calculations
2. **Canvas Layers**: Separate static/dynamic content
3. **Spatial Indexing**: Quadtree for hit detection
4. **LOD System**: Detail based on zoom level
5. **Incremental Updates**: Only recalculate changes

## Testing & Quality Assurance

### Test Categories

1. **Unit Tests**
   - Taxonomy CRUD operations
   - Force simulation calculations
   - Data model validation
   - Performance benchmarks

2. **Integration Tests**
   - Theme picker ↔ Taxonomy
   - Taxonomy changes → Graph updates
   - Settings persistence
   - Migration scenarios

3. **E2E Tests**
   - Complete user workflows
   - Cross-browser compatibility
   - Performance under load
   - Accessibility compliance

### Test Data Sets

- **Small**: 10 dreams, 20 themes
- **Medium**: 100 dreams, 50 themes
- **Large**: 1,000 dreams, 200 themes
- **Stress**: 10,000 dreams, 300+ themes

## Success Metrics

### Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Taxonomy adoption | 80% of users customize | Settings telemetry |
| Oneirograph usage | 50% weekly active | View open events |
| Performance | <2s load for 1k dreams | Performance API |
| Theme organization | 90% themes categorized | Theme assignment rate |

### Qualitative Metrics

- User feedback scores >4.5/5
- Reduced support questions about organization
- Community taxonomy sharing
- Power user testimonials

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation | High | Progressive loading, Web Workers |
| Browser compatibility | Medium | Polyfills, graceful degradation |
| Data corruption | High | Validation, backups, migrations |
| Memory leaks | Medium | Proper cleanup, monitoring |

### User Experience Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complexity overwhelm | High | Progressive disclosure, tutorials |
| Migration anxiety | Medium | Non-destructive, reversible |
| Learning curve | Medium | Defaults, guided tours |
| Feature discovery | Low | Prominent UI, documentation |

## Future Enhancements

### Version 2.0 Candidates

1. **ML-Powered Features**
   - Auto-categorization suggestions
   - Theme relationship discovery
   - Anomaly detection
   - Trend prediction

2. **Collaboration Features**
   - Taxonomy marketplace
   - Shared dreamscapes
   - Research templates
   - Community insights

3. **Advanced Visualizations**
   - Time-based animations
   - 3D graph option
   - VR exploration mode
   - Alternative layouts

4. **Integration Expansions**
   - Export to graph databases
   - Academic paper generation
   - API for researchers
   - Mobile companion app

### Long-term Vision

Create an ecosystem where:
- Researchers share standardized taxonomies
- Communities explore collective dreamscapes
- Individuals gain deep insights through visualization
- The tool becomes essential for dream work

## Appendices

### Appendix A: Default Taxonomy Structure

#### Cluster 1: Action & Agency
**Vector: Mission & Strategy**
- `Ambition` - Dreams of achieving goals, reaching heights, accomplishing great feats
- `Challenge` - Facing tests, competitions, obstacles to overcome
- `Choice` - Standing at crossroads, making important decisions, selecting paths
- `Coordination` - Organizing groups, synchronizing efforts, teamwork scenarios
- `Intervention` - Stepping in to help, preventing disasters, changing outcomes
- `Leadership` - Leading others, taking charge, guiding groups
- `Mission` - Having a specific quest, important task, or purpose to fulfill
- `Outreach` - Helping others, extending assistance, making connections
- `Responsibility` - Being accountable, carrying burdens, fulfilling duties
- `Strategy` - Planning approaches, solving complex problems, tactical thinking

**Vector: Pursuit & Consequence**
- `Acquisition` - Gathering resources, collecting items, obtaining necessities
- `Escape` - Breaking free, leaving danger, finding exits
- `Evasion` - Dodging threats, avoiding capture, staying hidden
- `Maneuver` - Navigating obstacles, strategic movement, skillful navigation
- `Pursuit` - Being chased, hunting something, following targets
- `Traversal` - Crossing territories, moving through spaces, journeying
- `Urgency` - Racing against time, emergency situations, critical deadlines

#### Cluster 2: Boundaries & Barriers
**Vector: Confinement**
- `Boundaries`
- `Confinement`
- `Constraint`
- `Containment`
- `Obstruction`
- `Sanctuary`

**Vector: Breach & Collapse**
- `Breach`
- `Chaos`
- `Collapse`
- `Deconstruction`
- `Reordering`

#### Cluster 3: Conflict, Obstacles, and Resolution
**Vector: Open Conflict**
- `Aggression`
- `Conflict`
- `Confrontation`
- `Contention`
- `Violence`

**Vector: Threat & Danger**
- `Peril`
- `Danger`
- `Predation`
- `Threat`

**Vector: Overcoming Obstacles**
- `Struggle`
- `Resistance`
- `Resolve`
- `Remediation`
- `Sacrifice`
- `Endurance`
- `Persistence`
- `Resilience`

**Vector: Consequence & Outcome**
- `Consequences`
- `Setback`
- `Ordeal`
- `Disruption`
- `Predicament`
- `Unraveling`

**Vector: Suppression & Oppression**
- `Oppression`
- `Subjugation`

#### Cluster 4: Control, Power, and Agency
**Vector: Assertion of Power**
- `Agency`
- `Autonomy`
- `Claim`
- `Command`
- `Control`
- `Domination`
- `Empowerment`
- `Projection`
- `Unleashing`

**Vector: Authority & Systems**
- `Authority`
- `Custodianship`
- `Duty`
- `Obedience`
- `Oversight`
- `Surveillance`

**Vector: Loss of Control**
- `Distrust`
- `Impotence`
- `Manipulation`
- `Powerlessness`
- `Vulnerability`

**Vector: Moral and Social Power**
- `Contribution`
- `Judgment`
- `Reconciliation`
- `Responsibility`

#### Cluster 5: Creation & Emergence
**Vector: Manifestation & Reordering**
- `Creation`
- `Emergence`
- `Manifestation`
- `Novelty`
- `Permeation`
- `Reordering`

**Vector: Replication & Uniqueness**
- `Pattern`
- `Replication`
- `Ubiquity`

**Vector: Potential & Fertility**
- `Fertility`
- `Nurturing`
- `Potential`
- `Provision`

#### Cluster 6: Identity & Consciousness
**Vector: Self & Detachment**
- `Detachment` - Feeling disconnected, observing from outside, emotional distance
- `Discomfort` - Physical or emotional unease, awkward situations, being out of place
- `Disgust` - Revulsion, rejection, encountering repulsive elements
- `Disorientation` - Confusion about location/identity, losing bearings, unclear reality
- `Impassivity` - Emotional numbness, inability to react, frozen feelings
- `Resignation` - Accepting fate, giving up, surrendering to circumstances
- `Self-Discovery` - Learning about oneself, revelations, finding identity

**Vector: Transformation & Change**
- `Adaptation` - Adjusting to new situations, evolving abilities, fitting in
- `Alteration` - Changing form, modifying appearance, shifting states
- `Ascension` - Rising upward, spiritual elevation, reaching higher planes
- `Augmentation` - Gaining new abilities, enhancement, becoming more
- `Awakening` - Realizing truth, becoming aware, enlightenment moments
- `Evolution` - Gradual development, improving, advancing stages
- `Initiation` - Beginning journeys, rites of passage, entering new phases
- `Regeneration` - Healing, renewal, restoration of what was lost
- `Shift` - Sudden changes, reality alterations, perspective switches
- `Transformation` - Complete metamorphosis, fundamental changes, becoming other
- `Transition` - Moving between states, in-between phases, crossing thresholds

**Vector: Fragmentation & Integration**
- `Abstraction`
- `Assimilation`
- `Blurring`
- `Duality`
- `Integration`
- `Symbiosis`

**Vector: Liberation & Unrestraint**
- `Emancipation`
- `Liberation`
- `Unrestraint`
- `Exclusion`

**Vector: Presence & Affect**
- `Anticipation`
- `Confidence`
- `Presence`

**Vector: Inheritance & Roots**
- `Ancestry`
- `Legacy`
- `Origin`

#### Cluster 7: Journeys, Movement, and Process
**Vector: Physical Journeys**
- `Exploration`
- `Invasion`
- `Journey`
- `Passage`
- `Time Travel`
- `Traversal`

**Vector: Repetitive Processes**
- `Cycle`
- `Performance`
- `Recursion`
- `Repetition`
- `Ritual`

**Vector: Navigation & Maneuver**
- `Maneuver`
- `Navigation`

**Vector: Mental Journeys**
- `Nostalgia`
- `Re-experience`
- `Recollection`
- `Seeking Clarity`

#### Cluster 8: Perception, Reality, and Deception
**Vector: Observation & Awareness**
- `Awareness`
- `Observation`
- `Perception`
- `Scrutiny`
- `Vigilance`

**Vector: Revelation & Discovery**
- `Discovery`
- `Disclosure`
- `Encounter`
- `Incursion`
- `Origin`
- `Revelation`

**Vector: Truth vs. Illusion**
- `Authenticity`
- `Deception`
- `Discrepancy`
- `Disillusionment`
- `Elusiveness`
- `Misunderstanding`
- `Perspective`
- `Reality`
- `Simulation`

**Vector: The Unknowable**
- `Dichotomy`
- `Enigma`
- `Foreboding`
- `Omnipotence`

**Vector: Concealment & Unraveling**
- `Concealment`
- `Evasion`
- `Exposure`
- `Unraveling`

#### Cluster 9: Relationships & Connection
**Vector: Forming Connections**
- `Affection`
- `Connection`
- `Interconnection`
- `Intimacy`
- `Reconnection`
- `Relationships`

**Vector: Social & Emotional Dynamics**
- `Approval`
- `Communication`
- `Empathy`
- `Judgment`
- `Longing`
- `Negotiation`
- `Reconciliation`

**Vector: Social Division**
- `Disconnection`
- `Disengagement`
- `Exclusion`
- `Impassivity`

#### Cluster 10: Resources & Provision
**Vector: Management & Maintenance**
- `Documentation`
- `Measurement`
- `Preservation`
- `Structure`

**Vector: Reliance & Support**
- `Assistance`
- `Reliance`
- `Support`

**Vector: Provision & Scarcity**
- `Acquisition`
- `Extraction`
- `Nurturing`
- `Provision`

#### Cluster 11: Abstract Concepts and Environments
**Vector: Scale & Scope**
- `Abundance`
- `Density`
- `Expansion`
- `Magnitude`
- `Overwhelm`

**Vector: Otherworld & The Surreal**
- `Otherworld`
- `Dichotomy`
- `Enigma`
- `Contamination`
- `Esotericism`
- `Mysticism`

#### Cluster 12: Physical & Metaphysical
**Vector: Physical & Bodily Experience**
- `Cleansing`
- `Contamination`
- `Discomfort`
- `Disgust`
- `Extremity`
- `Fearlessness`
- `Grief`
- `Physicality`
- `Pain`
- `Sensation`
- `Emotions`

#### Cluster 13: Nature & Elements
**Vector: Natural Forces**
- `Storm` - Weather phenomena, natural power, environmental chaos
- `Fire` - Burning, destruction, transformation through heat
- `Water` - Floods, drowning, cleansing, emotional depths
- `Earth` - Grounding, stability, burial, growth
- `Air` - Wind, breath, freedom, communication

**Vector: Natural Environments**
- `Forest` - Getting lost, finding paths, natural sanctuary
- `Ocean` - Vast unknown, depths, waves of emotion
- `Mountain` - Climbing, achievement, obstacles, perspective
- `Desert` - Isolation, survival, spiritual journey
- `Garden` - Cultivation, beauty, paradise, growth

#### Cluster 14: Technology & Digital
**Vector: Digital Existence**
- `Virtual Reality` - Simulated worlds, questioning reality
- `Social Media` - Connection/disconnection, public persona
- `Gaming` - Competition, alternate lives, achievement
- `Glitches` - Reality breaking down, system errors

**Vector: Technological Control**
- `Automation` - Loss of human control, efficiency
- `Surveillance Tech` - Being watched through devices
- `AI/Robots` - Non-human intelligence, replacement fears
- `Connectivity` - Networks, being plugged in/unplugged

### Common Dream Scenario Mappings

Understanding how common dream scenarios map to the taxonomy helps users quickly categorize their dreams:

- **Being Chased**: Cluster 3: Conflict, Obstacles, and Resolution → Threat & Danger → `Pursuit`, `Evasion`, `Danger`
- **Flying**: Cluster 6: Identity & Consciousness → Liberation & Unrestraint → `Emancipation`, `Unrestraint`; or Cluster 4: Control, Power, and Agency → Assertion of Power → `Empowerment`
- **Falling**: Cluster 4: Control, Power, and Agency → Loss of Control → `Powerlessness`, `Vulnerability`
- **Being Naked in Public**: Cluster 6: Identity & Consciousness → Self & Detachment → `Discomfort`, `Disorientation`; Cluster 8: Perception, Reality, and Deception → Concealment & Unraveling → `Exposure`
- **Death/Dying**: Cluster 6: Identity & Consciousness → Transformation & Change → `Transition`, `Transformation`
- **Lost/Can't Find Something**: Cluster 7: Journeys, Movement, and Process → Navigation & Maneuver → `Navigation`; Cluster 6: Identity & Consciousness → Self & Detachment → `Disorientation`
- **Taking a Test**: Cluster 1: Action & Agency → Mission & Strategy → `Challenge`, `Strategy`; Cluster 4: Control, Power, and Agency → Loss of Control → `Vulnerability`
- **Meeting Deceased People**: Cluster 9: Relationships & Connection → Forming Connections → `Reconnection`; Cluster 6: Identity & Consciousness → Inheritance & Roots → `Ancestry`, `Legacy`
- **Natural Disasters**: Cluster 2: Boundaries & Barriers → Breach & Collapse → `Chaos`, `Collapse`; Cluster 3: Conflict, Obstacles, and Resolution → Threat & Danger → `Peril`
- **Being Late**: Cluster 1: Action & Agency → Pursuit & Consequence → `Urgency`; Cluster 4: Control, Power, and Agency → Loss of Control → `Powerlessness`
- **Technology Nightmares**: Cluster 14: Technology & Digital → Digital Existence → `Glitches`; Cluster 14: Technology & Digital → Technological Control → `Automation`
- **Nature Dreams**: Cluster 13: Nature & Elements → Natural Environments → Various based on specific environment

### Appendix B: API Documentation

[Detailed API specs for taxonomy and graph systems]

### Appendix C: Performance Benchmarks

[Detailed performance testing methodology and baselines]

### Appendix D: Accessibility Guidelines

[WCAG 2.1 AA compliance checklist and implementation notes]

---

## Design Update: Control Center Integration

**Important UI Location Change (August 2025):**
After review, the Dream Taxonomy management interface will be implemented as a dedicated tab in the Control Center rather than in Settings. This provides:
- Better accessibility and visibility as a core feature
- Larger workspace for complex taxonomy operations  
- Seamless integration with other analytical tools
- Consistent tab-based navigation experience

**Tab Placement:**
The Dream Taxonomy tab will be positioned specifically between the Metrics settings tab and the Reference overview tab in the Control Center:
- Analytics
- Charts  
- Metrics
- **Dream Taxonomy** ← New tab positioned here
- Reference

This placement provides a logical flow from configuration (Metrics) to organization (Dream Taxonomy) to documentation (Reference).

The Oneirograph will remain as a separate view (like Graph View) but may be added as a Control Center tab in a future iteration based on user feedback.

---

## Implementation Progress

### ✅ Phase 1 Complete (August 2025)

**Status**: Successfully implemented and tested
**Branch**: `feature/dream-taxonomy` 
**Commit**: `14159a0` - "Implement Dream Taxonomy Phase 1: Read-only hierarchical taxonomy viewer"

**What's Working**:
- Dream Taxonomy tab fully functional in Control Center
- Hierarchical tree view with 11 clusters, 40+ vectors, 200+ themes
- Real-time search and filtering across all taxonomy levels
- Expand/collapse functionality with visual indicators
- Statistics panel showing totals and uncategorized themes
- Full Obsidian theme compatibility and accessibility compliance
- Clean integration with existing Control Center navigation

### ✅ Phase 2 Complete (August 2025)

**Status**: Successfully implemented and tested with hybrid approach
**Branch**: `feature/dream-taxonomy`

**What's Working**:
- **Hybrid Editing System**: Simple operations inline, complex operations via modals
- **Inline Editing**: Double-click to rename any cluster, vector, or theme
- **Drag-and-Drop**: Move themes between vectors and vectors between clusters
- **Action Buttons**: Hover to reveal Edit, Add, Delete buttons on all nodes
- **Modal Integration**: Comprehensive forms for complex operations
  - ClusterEditModal: Color picker, description editing
  - VectorEditModal: Icon selection, parent cluster reassignment  
  - ThemeEditModal: Multi-vector assignment, aliases management
  - TaxonomyDeleteModal: Safe deletion with cascade warnings
- **Undo/Redo System**: 50-action history with toolbar buttons
- **Import/Export**: JSON file support for taxonomy backup/sharing
- **Keyboard Navigation**: F2 edit, Delete key, Arrow navigation, accessibility
- **Mobile Optimization**: Touch-friendly interactions, larger targets
- **Introduction Paragraph**: User guidance explaining hierarchical system

### ✅ Phase 3 Complete (August 2025)

**Status**: Successfully implemented and fully functional
**Branch**: `feature/dream-taxonomy`
**Final Commits**: 
- `82734d6` - "Fix theme extraction to recognize Dream Themes metric"
- `f16efeb` - "Fix Oneirograph file discovery to use recursive folder search" 
- `3e3099e` - "Add vector nodes to Oneirograph visualization"

**What's Working**:
- **Complete Oneirograph View**: Force-directed graph visualization with D3.js simulation
- **Full Node Hierarchy**: Displays clusters (large), vectors (medium), and dreams (small) with proper connections
- **Dynamic Theme Extraction**: Automatically finds user's Dream Themes metric regardless of configuration
- **Recursive File Discovery**: Processes all dream files from subdirectories like the Dashboard
- **Interactive Simulation**: Physics-based positioning with clustering, chronological, and thematic forces
- **Canvas Rendering**: High-performance rendering with CanvasRenderer for large datasets
- **Data Integration**: Seamlessly integrates with existing UniversalMetricsCalculator pipeline

**Technical Implementation**:
- `src/dom/oneirograph/OneirographView.ts` - Main view extending ItemView (781 lines)
- `src/dom/oneirograph/ForceSimulation.ts` - D3.js physics simulation (351 lines)  
- `src/dom/oneirograph/CanvasRenderer.ts` - High-performance canvas rendering
- `src/dom/oneirograph/OneirographInteractions.ts` - User interaction handling
- `styles/components/oneirograph.css` - Obsidian-native styling

**Key Features Delivered**:
- **3-Level Hierarchy**: Dreams → Vectors → Clusters (themes implicit in connections)
- **184+ Dreams Processed**: Successfully handles user's full dream dataset
- **Smart Theme Mapping**: Dynamic detection of Dream Themes with malformed data cleanup
- **Performance Optimized**: Canvas rendering with force simulation for smooth interaction

**User Experience**: 
- Opens via ribbon icon to dedicated Oneirograph view
- Interactive graph showing dream relationships through taxonomy
- Visual cluster boundaries with convex hull rendering
- Smooth physics simulation with customizable forces

### 🔄 Phase 4 Partially Complete (August 2025)

**Status**: Successfully implemented and fully functional
**Branch**: `feature/dream-taxonomy`  
**Final Commits**:
- `[pending]` - "Implement Phase 4: Advanced Oneirograph interactions"
- `[pending]` - "Tune orbital forces for hierarchical clustering"
- `[pending]` - "Remove disorienting zoom behavior from clusters"

**What's Working**:
- **Expand/Collapse Functionality**: Progressive disclosure with collapsed view mode
  - Toggle between full view (all nodes) and collapsed view (clusters only)
  - Click clusters → expand to show vectors
  - Click vectors → expand to show connected dreams
  - Smart hierarchical collapse (collapsing cluster collapses its vectors)
- **Dream Content In-Situ Expansion**: Click dreams → floating content panel
  - Full dream text display without leaving graph context
  - Dream metrics organized in clean layout
  - Mobile-responsive panel design
  - Easy dismissal with close button
- **Orbital Physics System**: Tuned force simulation for natural hierarchy
  - Dreams orbit around their specific vector nodes
  - Vectors orbit around their parent cluster nodes  
  - Balanced repulsion (-50) and attraction (0.8-1.0) forces
  - Natural dragging behavior for all nodes
- **Enhanced Interactions**: 
  - Removed disorienting zoom behavior from cluster clicks
  - Natural node dragging moves entire orbital systems
  - Smooth expand/collapse with physics simulation updates

**Technical Implementation**:
- Enhanced `OneirographView.ts` with expand/collapse state management
- Tuned `ForceSimulation.ts` forces for hierarchical orbiting
- Added floating dream content panel with Obsidian-native styling
- Custom force balance: stronger links, weaker global repulsion
- Disabled competing cluster force to preserve link hierarchy

**User Experience Improvements**:
- **Intuitive Exploration**: Start with overview, drill down progressively
- **Contextual Reading**: Read dreams without losing graph position
- **Natural Physics**: Organic orbital movement feels alive and responsive
- **Comfortable Spacing**: Perfect balance between connection and breathing room
- **Fluid Interactions**: Draggable nodes with no jarring zoom behavior

**Implementation Status (~50% Complete)**:
- ✅ **Completed**: Expand/collapse functionality, dream content expansion, orbital physics
- ❌ **Pending**: Sub-clustering, vector boundaries, live filtering, search, keyboard navigation

**Status**: Core Phase 4 interactions implemented. Additional features (filtering, boundaries, sub-clustering) remain for future implementation.

---

**Implementation Progress**:
1. ✅ ~~Review and approve plan with Control Center integration~~
2. ✅ ~~Update component designs for tab-based implementation~~
3. ✅ ~~Set up project tracking~~
4. ✅ ~~Begin Phase 1 implementation with new UI location~~
5. ✅ ~~Complete Phase 2 implementation - Taxonomy Editing capabilities~~
6. ✅ ~~Complete Phase 3 implementation - Basic Oneirograph visualization~~
7. 🔄 **Partial**: Phase 4 implementation - Advanced Oneirograph features (~50% complete)

**Current Status**: Phases 1-3 fully complete. Phase 4 partially implemented with core interactions (expand/collapse, dream content, orbital physics). Remaining features: sub-clustering, vector boundaries, filtering, search, keyboard navigation.