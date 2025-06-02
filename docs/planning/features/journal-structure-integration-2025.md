# Journal Structure Integration Project 2025

## 📋 **Table of Contents**

- [🎯 Project Overview](#-project-overview)
- [🗓️ Key Milestones](#️-key-milestones)
- [📊 Project Tracking](#-project-tracking)
  - [Implementation Progress](#implementation-progress)
  - [File Modification Tracker](#file-modification-tracker)
  - [Testing Progress](#testing-progress)
  - [Risk & Issue Tracker](#risk--issue-tracker)
  - [Dependencies Tracker](#dependencies-tracker)
  - [Decision Log](#decision-log)
  - [Resource Allocation](#resource-allocation)
- [📊 Current State Assessment](#-current-state-assessment)
- [🚀 Implementation Plan](#-implementation-plan)
  - [Phase 1: Core Integration](#phase-1-core-integration-immediate---week-1)
  - [Phase 2: Structure Management UI](#phase-2-structure-management-ui-week-2-3)
  - [Phase 3: Advanced Features](#phase-3-advanced-features-week-4)
- [🔧 Technical Implementation Details](#-technical-implementation-details)
- [📁 File Modifications Required](#-file-modifications-required)
- [🎯 Success Criteria](#-success-criteria)
- [🔄 Testing Strategy](#-testing-strategy)
- [📝 Implementation Notes](#-implementation-notes)
- [📅 Timeline Estimate](#-timeline-estimate)
- [🎉 Expected Benefits](#-expected-benefits)

---

## 🗓️ **Key Milestones**

| Milestone | Status | Deliverables |
|-----------|--------|--------------|
| **Project Initiation** | ✅ Complete | Project document, planning complete |
| **Phase 1 Start** | ✅ Complete | Core integration begins |
| **AV-Journal Fix** | ✅ Complete | `[!av-journal]` callouts recognized |
| **Structure Integration** | ✅ Complete | Hardcoded callouts replaced |
| **Phase 1 Complete** | ✅ Complete | Core integration functional |
| **Phase 2 Start** | 🔄 Ready | UI development begins |
| **Structure Manager UI** | ⏳ Pending | Basic structure management |
| **Phase 2 Complete** | ⏳ Pending | Full configurability available |
| **Phase 3 Start** | ⏳ Pending | Advanced features begin |
| **Auto-Detection** | ⏳ Pending | Structure detection implemented |
| **Migration Tools** | ⏳ Pending | Content migration capabilities |
| **Project Complete** | ⏳ Pending | All phases delivered |

---

## 📊 **Project Tracking**

### **Implementation Progress**

| Phase | Component | Status | Notes |
|-------|-----------|--------|-------|
| **Phase 1: Core Integration** | | | |
| 1.1 | Replace hardcoded callout arrays | ✅ **COMPLETE** | Implemented structure-based recognition in UniversalMetricsCalculator |
| 1.2 | Add structure lookup methods | ✅ **COMPLETE** | Added getActiveStructures(), isRecognizedCallout(), getCalloutRole() |
| 1.3 | Update parsing logic | ✅ **COMPLETE** | Dynamic parent-child relationship detection, structure-aware patterns |
| 1.4 | Test with existing journals | ✅ **COMPLETE** | Backward compatible, av-journal callouts now recognized |
| **Phase 2: Structure Management** | | | |
| 2.1 | Settings UI integration | 🔄 **PLANNED** | Integrate with existing journal structure settings |
| 2.2 | Structure validation | 🔄 **PLANNED** | Validate structure definitions |
| 2.3 | User feedback system | 🔄 **PLANNED** | Show which structures are active |
| **Phase 3: Advanced Features** | | | |
| 3.1 | Auto-detection | 🔄 **PLANNED** | Detect journal structures automatically |
| 3.2 | Migration tools | 🔄 **PLANNED** | Help users migrate between structures |
| 3.3 | Custom structure creation | 🔄 **PLANNED** | UI for creating custom structures |

### **File Modification Tracker**

| File | Type | Priority | Status | Changes Required | Dependencies |
|------|------|----------|--------|------------------|--------------|
| `src/workers/UniversalMetricsCalculator.ts` | Core | High | ⏳ Pending | Replace hardcoded callout array | Settings system |
| `src/types/journal-check.ts` | Types | High | ⏳ Pending | Add default structures | None |
| `settings.ts` | UI | High | ⏳ Pending | Structure management controls | Modal components |
| `src/utils/structure-helpers.ts` | Utils | Medium | ⏳ Pending | Create new file | Type definitions |
| `src/journal_check/ui/StructureManagerModal.ts` | UI | Medium | ⏳ Pending | Create new file | Settings integration |
| Tests files | Tests | Medium | ⏳ Pending | Unit and integration tests | Implementation complete |

### **Testing Progress**

| Test Category | Total Tests | Planned | Implemented | Passing | Coverage |
|---------------|-------------|---------|-------------|---------|----------|
| **Unit Tests** | TBD | 0 | 0 | 0 | 0% |
| Structure Lookup | - | 5 | 0 | 0 | 0% |
| Callout Recognition | - | 8 | 0 | 0 | 0% |
| Settings Migration | - | 6 | 0 | 0 | 0% |
| **Integration Tests** | TBD | 0 | 0 | 0 | 0% |
| End-to-End Parsing | - | 10 | 0 | 0 | 0% |
| UI Workflows | - | 8 | 0 | 0 | 0% |
| **User Acceptance** | TBD | 0 | 0 | 0 | 0% |
| Backward Compatibility | - | 5 | 0 | 0 | 0% |
| New Functionality | - | 7 | 0 | 0 | 0% |

### **Risk & Issue Tracker**

| Risk/Issue | Severity | Probability | Impact | Mitigation Strategy | Status | Owner |
|------------|----------|-------------|--------|-------------------|--------|-------|
| Breaking existing parsing | High | Medium | High | Comprehensive testing, fallback logic | ⏳ Open | - |
| Performance degradation | Medium | Low | Medium | Caching, optimization | ⏳ Open | - |
| Complex migration path | Medium | Medium | Medium | Auto-migration, clear documentation | ⏳ Open | - |
| User confusion | Low | Medium | Medium | Intuitive UI, good defaults | ⏳ Open | - |
| Settings corruption | High | Low | High | Validation, backup/restore | ⏳ Open | - |

### **Dependencies Tracker**

| Component | Depends On | Type | Status | Blocker | Resolution |
|-----------|------------|------|--------|---------|------------|
| Parse Logic Integration | Settings system access | Technical | ✅ Available | None | - |
| Structure Manager Modal | Modal framework | Technical | ✅ Available | None | - |
| Auto-Detection | Parse Logic Integration | Sequential | ⏳ Blocked | Phase 1 incomplete | Wait for Phase 1 |
| Migration Tools | Structure Manager Modal | Sequential | ⏳ Blocked | Phase 2 incomplete | Wait for Phase 2 |
| Testing Suite | All implementations | Sequential | ⏳ Blocked | Components incomplete | Wait for implementations |

### **Decision Log**

| Decision | Rationale | Impact | Status |
|----------|-----------|--------|--------|
| Use existing CalloutStructure system | Leverage existing foundation | Low risk, faster implementation | ✅ Approved |
| Prioritize backward compatibility | Protect existing users | Slower initial development | ✅ Approved |
| Phase-based implementation | Incremental value delivery | Manageable complexity | ✅ Approved |
| UI framework choice | TBD | TBD | ⏳ Pending |
| Testing strategy details | TBD | TBD | ⏳ Pending |

### **Resource Allocation**

| Phase | Estimated Effort | Skills Required | Notes |
|-------|------------------|-----------------|-------|
| **Phase 1** | 1 week | TypeScript, Obsidian API | Critical path |
| **Phase 2** | 2-3 weeks | UI/UX, Modal development | Parallel development possible |
| **Phase 3** | 2-4 weeks | Algorithm design, Migration tools | Enhancement phase |
| **Testing** | Ongoing | Test automation, QA | Continuous |

---

## 🎯 **Project Overview**

**Status**: Phase 1 Complete ✅ | Phase 2 In Planning 🔄

### **Phase 1 Completion Summary** 

**Completed**: Phase 1 - Core Integration (All sub-phases complete)

**Key Achievements**:
- ✅ **Fixed [!av-journal] Recognition**: The primary issue where `[!av-journal]` callouts were not being scraped has been resolved
- ✅ **Structure-Based Parsing**: Replaced hardcoded callout arrays with configurable structure lookup system
- ✅ **Backward Compatibility**: All existing journals continue to work without modification
- ✅ **Flexible Architecture**: System now supports any callout structure defined in settings
- ✅ **Enhanced Logging**: Added structure-aware debug logging for better troubleshooting

**Technical Implementation**:
- Added `getActiveStructures()`, `isRecognizedCallout()`, `getCalloutRole()` methods
- Dynamic regex pattern generation for structure-aware content extraction
- Parent-child relationship detection based on configured structures
- Integration with existing `CalloutStructure` and `JournalStructureSettings` types

**Impact**: Users can now successfully scrape metrics from `[!av-journal]` entries and any other custom callout structures they define.

### **Problem Statement**

**Goal**: Integrate the existing Journal Structure system with the parsing/scraping logic to replace hardcoded callout type recognition with a flexible, user-configurable approach.

**Current Problem**: The `UniversalMetricsCalculator` uses hardcoded callout types (`['journal-entry', 'dream-diary', 'dream-metrics']`), causing issues like `[!av-journal]` callouts being ignored during scraping.

**Solution**: Leverage the existing `CalloutStructure` system to make callout recognition fully configurable and user-extensible.

---

## 📊 **Current State Assessment**

### ✅ **What's Working (Phase 1 Foundation Complete)**
- `LintingEngine` class with validation capabilities
- `CalloutStructure` interface and type definitions
- `JournalStructureSettings` configuration system  
- Settings tab integration with basic toggle
- Default structure definitions

### 🔧 **What's Partially Implemented**
- Content parsing for callouts (exists but not integrated)
- Template system interfaces (UI incomplete)
- Validation rules engine (basic implementation)

### ❌ **What's Missing**
- **Integration with parsing system** ← **Primary Focus**
- UI components for structure management
- Advanced validation features

---

## 🚀 **Implementation Plan**

### **Phase 1: Core Integration (Immediate - Week 1)**
**Objective**: Replace hardcoded callout recognition with Journal Structure system

#### 1.1 Parse Logic Integration
- **File**: `src/workers/UniversalMetricsCalculator.ts`
- **Change**: Replace hardcoded array with `CalloutStructure` lookup
- **Impact**: Immediate fix for `[!av-journal]` issue

#### 1.2 Settings Enhancement
- **File**: `src/types/journal-check.ts` 
- **Change**: Add default structures for common patterns
- **Include**: `av-journal`, `journal-entry`, `dream-diary`, etc.

#### 1.3 Backward Compatibility
- **Ensure**: Existing parsing behavior unchanged for default users
- **Migration**: Automatic creation of structures from existing patterns

### **Phase 2: Structure Management UI (Week 2-3)**
**Objective**: Allow users to configure their own callout structures

#### 2.1 Structure Configuration Modal
- **Feature**: Add/edit/delete callout structures
- **UI**: Simple interface for defining root/child/metrics callouts
- **Validation**: Ensure structure consistency

#### 2.2 Settings Integration
- **Location**: Settings tab → Journal Structure section
- **Controls**: Enable/disable structures, set defaults
- **Testing**: Validation test interface

## 🚀 **Phase 2 Detailed Implementation Plan**

### **Phase 2.1: Enhance Structure Management in Settings** 

**Target**: Extend existing journal structure settings UI with structure CRUD operations

#### **Files to Modify**:
1. **`src/dom/modals/MetricsTabsModal.ts`** - Enhance structures section
2. **`src/utils/settings-helpers.ts`** - Add structure manipulation helpers  
3. **`src/types/journal-check.ts`** - Add structure validation functions
4. **`styles.css`** - Add structure management UI styles

#### **Implementation Tasks**:

**Task 2.1.1: Structure List Enhancement**
- ✅ **Current**: Basic structures display in MetricsTabsModal
- 🔄 **Add**: CRUD buttons for each structure (Edit, Delete, Clone)
- 🔄 **Add**: Enabled/disabled toggle for each structure
- 🔄 **Add**: Structure validation status indicators
- 🔄 **Add**: "Add New Structure" button with wizard

**Task 2.1.2: Structure Editor Modal**
- 🔄 **Create**: `StructureEditorModal` class
- 🔄 **Features**: 
  - Name, description, and type editing
  - Root callout selection/input
  - Child callouts list management (add/remove)
  - Metrics callout selection
  - Date format configuration
  - Required/optional fields management
  - Live preview of structure
  - Validation feedback

**Task 2.1.3: Structure Validation System**
- 🔄 **Add**: `validateStructure()` function
- 🔄 **Check**: Unique IDs and names
- 🔄 **Check**: No circular dependencies
- 🔄 **Check**: Valid callout names (no special chars)
- 🔄 **Check**: At least one root callout defined
- 🔄 **Warn**: Conflicts with existing structures

**Task 2.1.4: User Feedback System**
- 🔄 **Add**: Active structure indicator in scrape modal
- 🔄 **Add**: Structure usage statistics  
- 🔄 **Add**: "Structure not recognized" warnings
- 🔄 **Add**: Quick-fix suggestions for unrecognized callouts

### **Phase 2.2: Structure Import/Export System**

**Target**: Allow sharing and backup of structure configurations

#### **Implementation Tasks**:

**Task 2.2.1: Export Functionality**
- 🔄 **Create**: `exportStructures()` function
- 🔄 **Format**: JSON with metadata (version, created date, etc.)
- 🔄 **UI**: Export button in structures section
- 🔄 **Options**: Export all structures or selected structures

**Task 2.2.2: Import Functionality**  
- 🔄 **Create**: `importStructures()` function
- 🔄 **Validation**: Verify format and content
- 🔄 **Conflict Resolution**: Handle duplicate IDs/names
- 🔄 **UI**: Import button with file picker
- 🔄 **Preview**: Show what will be imported before confirming

**Task 2.2.3: Preset Structure Library**
- 🔄 **Create**: Common structure presets
- 🔄 **Include**: Popular journal formats (bullet journal, GTD, etc.)
- 🔄 **UI**: "Add from Preset" option in structure creation
- 🔄 **Metadata**: Description, use cases, examples

### **Phase 2.3: Enhanced User Experience**

**Target**: Improve usability and provide better feedback

#### **Implementation Tasks**:

**Task 2.3.1: Structure Usage Analytics**
- 🔄 **Track**: Which structures are used most frequently
- 🔄 **Track**: Success rates of parsing for each structure
- 🔄 **Display**: Usage statistics in structure management UI
- 🔄 **Suggest**: Optimization recommendations

**Task 2.3.2: Interactive Structure Testing**
- 🔄 **Enhance**: Existing test modal with structure testing
- 🔄 **Add**: "Test with Structure" option
- 🔄 **Add**: Live preview of how content would be parsed
- 🔄 **Add**: Suggestions for improving structure definitions

**Task 2.3.3: Guided Structure Creation**
- 🔄 **Create**: Structure creation wizard
- 🔄 **Step 1**: Choose template or start from scratch  
- 🔄 **Step 2**: Define callout hierarchy
- 🔄 **Step 3**: Configure metadata and validation
- 🔄 **Step 4**: Test with sample content
- 🔄 **Step 5**: Save and activate

### **Phase 2.4: HubModal Journal Structure Tab Redesign**

**Target**: Redesign the Journal Structure tab with inline editing and Obsidian Settings-style interface

#### **Implementation Tasks**:

**Task 2.4.1: Inline Structure Editor**
- 🔄 **Replace**: Modal-based editing with inline expansion
- 🔄 **Implement**: CSS-based show/hide for structure editor forms
- 🔄 **Add**: Smooth expand/collapse transitions
- 🔄 **Design**: Single-page layout matching Obsidian Settings patterns

**Task 2.4.2: Enhanced Structure List**
- 🔄 **Add**: Usage statistics display (times used, last used date)
- 🔄 **Add**: Validation status indicators (✅ Valid, ⚠️ Warning, ❌ Error)
- 🔄 **Add**: Visual callout hierarchy display (root → child → metrics)
- 🔄 **Add**: Inline enable/disable toggles
- 🔄 **Add**: Contextual action buttons (Edit/Clone/Delete)

**Task 2.4.3: Copy to Clipboard Functionality**
- 🔄 **Add**: "Copy to Clipboard" button next to Save Structure
- 🔄 **Export**: Structure definition as JSON for sharing
- 🔄 **Include**: Metadata (name, description, creation date)
- 🔄 **UI**: Success notification when copied

**Task 2.4.4: Single-Page Layout Implementation**
- 🔄 **Remove**: Collapsible sections (per user preference)
- 🔄 **Implement**: Clear grouped sections with headers
- 🔄 **Structure**: Validation → Structures → Templates → Integration → Settings
- 🔄 **Remove**: Apply Template button (unclear purpose)

**Task 2.4.5: Progressive Disclosure**
- 🔄 **Default**: Collapsed structure items showing summary
- 🔄 **Expand**: Inline editor when clicking "Edit"
- 🔄 **Preview**: Live structure rendering in editor
- 🔄 **Context**: Keep user in same tab, no modal management

## 🎨 **Phase 2.4 UI Design Specifications - Obsidian Settings Style**

### **Inline Editing Behavior**

```typescript
// Structure list item states
interface StructureItemState {
    collapsed: boolean;  // Default: true
    editing: boolean;    // When Edit clicked: true
    validationStatus: 'valid' | 'warning' | 'error';
    usageStats: {
        timesUsed: number;
        lastUsed: Date | null;
    };
}

// CSS implementation
.oom-structure-editor { 
    display: none; 
    transition: all 0.3s ease;
}

.oom-structure-item.editing .oom-structure-editor { 
    display: block; 
}
```

### **Complete Single-Page Layout**

```
╔══════════════════════════════════════════════════════════════╗
║                    Journal Structure                          ║
╠══════════════════════════════════════════════════════════════╣
║ Configure journal structure settings, templates, validation  ║
║ rules, and interface preferences.                            ║
║                                                              ║
║ ┌─ VALIDATION ──────────────────────────────────────────────┐ ║
║ │ ☑ Enable Structure Validation                             │ ║
║ │   Validate journal entries against defined structures     │ ║
║ │                                                           │ ║
║ │ ☑ Show validation indicators in editor                    │ ║
║ │   Display real-time validation feedback                   │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║                                                              ║
║ ┌─ STRUCTURES ──────────────────────────────────────────────┐ ║
║ │ [+ Add Structure] [Import] [Export All]                   │ ║
║ │                                                           │ ║
║ │ ☑ Default Dream Journal        [Edit] [Clone] [Delete]    │ ║
║ │   journal-entry → dream-diary → dream-metrics             │ ║
║ │   📊 Used: 45 times  📅 Last: 2 days ago  ✅ Valid        │ ║
║ │                                                           │ ║
║ │ ☑ AV Journal Format           [Edit] [Clone] [Delete]     │ ║
║ │   av-journal → dream-diary → dream-metrics                │ ║
║ │   📊 Used: 12 times  📅 Last: Today  ✅ Valid             │ ║
║ │                                                           │ ║
║ │ ☐ Custom Format               [Edit] [Clone] [Delete]     │ ║
║ │   my-journal → dreams → data                              │ ║
║ │   📊 Used: 0 times  📅 Never  ⚠️ Conflicts detected       │ ║
║ │                                                           │ ║
║ │ ── INLINE STRUCTURE EDITOR (hidden via CSS until Edit) ── │ ║
║ │ Name:         [AV Journal Format                    ]     │ ║
║ │ Description:  [Audio-visual journal entries        ]     │ ║
║ │ Type:         [Nested ▼]                                 │ ║
║ │                                                           │ ║
║ │ Root Callout:    [av-journal                       ]     │ ║
║ │ Child Callouts:  [dream-diary              ] [+ Add]     │ ║
║ │                  [interpretation           ] [Remove]    │ ║
║ │ Metrics Callout: [dream-metrics                    ]     │ ║
║ │                                                           │ ║
║ │ ☑ Enabled  ☑ Default for new entries                     │ ║
║ │                                                           │ ║
║ │ Preview:                                                  │ ║
║ │ ┌─────────────────────────────────────────────────────┐   │ ║
║ │ │ > [!av-journal] 2025-06-01                          │   │ ║
║ │ │ > > [!dream-diary] Dream Title                      │   │ ║
║ │ │ > > Dream content goes here...                      │   │ ║
║ │ │ > > > [!dream-metrics]                              │   │ ║
║ │ │ > > > Sensory Detail: 4, Emotional Recall: 3       │   │ ║
║ │ └─────────────────────────────────────────────────────┘   │ ║
║ │                                                           │ ║
║ │ [Cancel] [Copy to Clipboard] [Save Structure]            │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║                                                              ║
║ ┌─ TEMPLATES ───────────────────────────────────────────────┐ ║
║ │ [+ Create Template] [Import] [Export Selected]            │ ║
║ │                                                           │ ║
║ │ ☑ Basic Dream Template        [Edit] [Clone] [Delete]     │ ║
║ │   Structure: Default Dream Journal                        │ ║
║ │   📊 Used: 23 times  📅 Last: Yesterday  ✅ Valid         │ ║
║ │                                                           │ ║
║ │ ☑ AV Dream Template          [Edit] [Clone] [Delete]      │ ║
║ │   Structure: AV Journal Format                            │ ║
║ │   📊 Used: 8 times  📅 Last: Today  ✅ Valid              │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║                                                              ║
║ ┌─ TEMPLATER INTEGRATION ───────────────────────────────────┐ ║
║ │ ☑ Enable Templater Integration                            │ ║
║ │   Use Templater templates for journal structures          │ ║
║ │                                                           │ ║
║ │ Templates Folder: [templates/dreams                 ]     │ ║
║ │ Default Template: [templates/dreams/default.md      ]     │ ║
║ │                                                           │ ║
║ │ Status: ✅ Templater plugin detected                       │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║                                                              ║
║ ┌─ CONTENT ISOLATION ───────────────────────────────────────┐ ║
║ │ Configure which elements should be ignored during         │ ║
║ │ validation.                                               │ ║
║ │                                                           │ ║
║ │ ☑ Ignore Images         ☑ Ignore Links                   │ ║
║ │ ☑ Ignore Formatting     ☑ Ignore Headings               │ ║
║ │ ☑ Ignore Code Blocks    ☑ Ignore Frontmatter            │ ║
║ │ ☑ Ignore Comments                                         │ ║
║ │                                                           │ ║
║ │ Custom Ignore Patterns:                                   │ ║
║ │ [%%.*%%                                  ] [+ Add]       │ ║
║ │ ^\s*\[\[.*\]\]\s*$                        [Remove]       │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║                                                              ║
║ ┌─ INTERFACE SETTINGS ──────────────────────────────────────┐ ║
║ │ ☑ Show inline validation in editor                        │ ║
║ │   Display real-time validation feedback                   │ ║
║ │                                                           │ ║
║ │ ☑ Enable quick fixes                                      │ ║
║ │   Show suggested fixes for validation issues              │ ║
║ │                                                           │ ║
║ │ Severity Indicators:                                      │ ║
║ │ Error:   [🔴] [❌] [⛔] [Custom: ▼]                        │ ║
║ │ Warning: [🟡] [⚠️ ] [🚧] [Custom: ▼]                        │ ║
║ │ Info:    [🔵] [ℹ️ ] [💡] [Custom: ▼]                        │ ║
║ └───────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════╝
```

### **Phase 3: Advanced Features (Week 4+)**
**Objective**: Enhanced capabilities and user experience

#### 3.1 Structure Detection
- **Auto-detection**: Analyze existing journals to suggest structures
- **Import/Export**: Share structure definitions
- **Templates**: Pre-built structures for common patterns

#### 3.2 Migration Tools
- **Content Analysis**: Scan vault for callout patterns
- **Structure Suggestions**: Recommend optimal structures
- **Bulk Updates**: Apply new structures to existing content

---

## 🔧 **Technical Implementation Details**

### **Core Integration Architecture**

```typescript
// Current (Hardcoded)
if (calloutType && ['journal-entry', 'dream-diary', 'dream-metrics'].includes(calloutType)) {
    // Process...
}

// New (Structure-Based)
if (calloutType && this.isRecognizedCallout(calloutType)) {
    // Process...
}

private isRecognizedCallout(calloutType: string): boolean {
    return this.getActiveStructures().some(structure => 
        structure.rootCallout === calloutType ||
        structure.childCallouts.includes(calloutType) ||
        structure.metricsCallout === calloutType
    );
}
```

### **Structure Definition Examples**

```typescript
// Default Dream Journal Structure
{
    id: 'default-dream-structure',
    name: 'Default Dream Journal',
    rootCallout: 'journal-entry',
    childCallouts: ['dream-diary'],
    metricsCallout: 'dream-metrics',
    type: 'nested'
}

// AV Journal Structure (New)
{
    id: 'av-journal-structure', 
    name: 'AV Journal Format',
    rootCallout: 'av-journal',
    childCallouts: ['dream-diary'],
    metricsCallout: 'dream-metrics',
    type: 'nested'
}

// Flat Structure Example
{
    id: 'simple-dream-structure',
    name: 'Simple Dream Format', 
    rootCallout: 'dream',
    childCallouts: [],
    metricsCallout: 'metrics',
    type: 'flat'
}
```

### **Settings Migration Strategy**

```typescript
// Auto-migrate existing behavior to structures
function createDefaultStructures(): CalloutStructure[] {
    return [
        // Preserve current hardcoded behavior
        {
            id: 'legacy-structure',
            name: 'Legacy Format (Auto-Generated)',
            rootCallout: 'journal-entry',
            childCallouts: ['dream-diary'],
            metricsCallout: 'dream-metrics',
            type: 'nested',
            enabled: true
        }
    ];
}
```

---

## 📁 **File Modifications Required**

### **High Priority (Phase 1)**

1. **`src/workers/UniversalMetricsCalculator.ts`**
   - Replace hardcoded callout array with structure lookup
   - Add methods for structure-based callout recognition
   - Integrate with settings system

2. **`src/types/journal-check.ts`**
   - Add default structure definitions
   - Include common patterns (av-journal, etc.)
   - Ensure backward compatibility

3. **`settings.ts`**
   - Add structure management controls
   - Migration logic for existing users
   - Test interface integration

### **Medium Priority (Phase 2)**

4. **`src/journal_check/ui/StructureManagerModal.ts`** (New)
   - Create/edit/delete structures
   - Structure validation
   - Import/export functionality

5. **`src/utils/structure-helpers.ts`** (New)
   - Structure lookup utilities
   - Migration helpers
   - Validation functions

### **Lower Priority (Phase 3)**

6. **Structure detection algorithms**
7. **Advanced UI components**
8. **Bulk migration tools**

---

## 🎯 **Success Criteria**

### **Phase 1 Complete When:**
- ✅ `[!av-journal]` callouts are recognized and parsed
- ✅ Existing parsing behavior unchanged for current users
- ✅ Structure system integrated with parsing logic
- ✅ Settings allow basic structure configuration

### **Phase 2 Complete When:**
- ✅ Users can create custom callout structures
- ✅ UI provides structure management capabilities
- ✅ Structure validation prevents invalid configurations
- ✅ Import/export works for structure sharing

### **Phase 3 Complete When:**
- ✅ Auto-detection suggests optimal structures
- ✅ Migration tools help transition existing content
- ✅ Advanced features enhance user experience
- ✅ Documentation covers all capabilities

---

## 🔄 **Testing Strategy**

### **Unit Tests**
- Structure lookup functions
- Callout recognition logic
- Settings migration
- Validation rules

### **Integration Tests**
- End-to-end parsing with custom structures
- Settings persistence
- UI workflow testing
- Performance with multiple structures

### **User Acceptance Tests**
- Current users see no behavior change
- New structures work as expected
- UI is intuitive and functional
- Migration tools work correctly

---

## 📝 **Implementation Notes**

### **Design Principles**
1. **Backward Compatibility**: Existing behavior preserved
2. **User Control**: Full configurability without complexity
3. **Performance**: Minimal impact on parsing speed
4. **Extensibility**: Easy to add new structure types
5. **Reliability**: Robust error handling and fallbacks

### **Risk Mitigation**
- **Settings Migration**: Automatic fallback to default structures
- **Performance**: Cache structure lookups during parsing
- **Validation**: Prevent invalid structure configurations
- **Testing**: Comprehensive test coverage before deployment

### **Future Enhancements**
- Plugin ecosystem integration
- Community structure sharing
- Advanced pattern matching
- Machine learning suggestions

---

## 📅 **Timeline Estimate**

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | 1 week | Core integration, immediate fix for av-journal |
| **Phase 2** | 2-3 weeks | Structure management UI, full configurability |
| **Phase 3** | 2-4 weeks | Advanced features, migration tools |
| **Total** | **5-8 weeks** | Complete configurable journal structure system |

---

## 🎉 **Expected Benefits**

### **For Users**
- **Flexibility**: Define any callout structure they prefer
- **Compatibility**: Support for existing and new journal formats
- **Control**: No dependence on hardcoded plugin behavior
- **Migration**: Easy transition between structure formats

### **For Development**
- **Maintainability**: No more hardcoded callout lists
- **Extensibility**: Easy to add new structure types
- **User Support**: Self-service structure configuration
- **Future-Proofing**: Adaptable to any journal format

---

**Status**: Ready for Phase 1 implementation  
**Next Action**: Begin core integration in `UniversalMetricsCalculator.ts` 