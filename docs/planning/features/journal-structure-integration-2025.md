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
| **Phase 2 Start** | ✅ Complete | UI development begins |
| **Structure Manager UI** | ✅ Complete | Full structure management implemented |
| **Phase 2 Complete** | ✅ Complete | Full configurability available |
| **Hub Consolidation** | ✅ Complete | **v0.12.0** - Unified OneiroMetrics Hub |
| **Date System Overhaul** | ✅ Complete | **v0.12.0** - Complete date formatting rebuild |
| **Field Architecture Rebuild** | ✅ Complete | **v0.12.0** - Core field systems reconstructed |
| **Phase 3 Start** | 🔄 In Progress | Advanced features begin |
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
| 2.1 | Settings UI integration | ✅ **COMPLETE** | Fully integrated with OneiroMetrics Hub (v0.12.0) |
| 2.2 | Structure validation | ✅ **COMPLETE** | Real-time validation with error/warning display |
| 2.3 | User feedback system | ✅ **COMPLETE** | Live preview and validation indicators |
| 2.4 | Hub consolidation | ✅ **COMPLETE** | **v0.12.0** - Unified interface with rebuilt fields |
| **v0.12.0: Architecture Overhaul** | | | |
| A.1 | Field system rebuild | ✅ **COMPLETE** | Ground-up reconstruction of core input fields |
| A.2 | Date formatting overhaul | ✅ **COMPLETE** | Fixed broken formatting, added date-fns integration |
| A.3 | Callout settings integration | ✅ **COMPLETE** | Moved to Hub with enhanced functionality |
| A.4 | Settings consolidation | ✅ **COMPLETE** | Eliminated scattered modals, unified interface |
| A.5 | Enhanced validation systems | ✅ **COMPLETE** | Comprehensive error handling and user feedback |
| **Phase 3: Advanced Features** | | | |
| 3.1 | Auto-detection | 🔄 **PLANNED** | Detect journal structures automatically |
| 3.2 | Migration tools | 🔄 **PLANNED** | Help users migrate between structures |
| 3.3 | Custom structure creation | 🔄 **PLANNED** | UI for creating custom structures |

### **File Modification Tracker**

| File | Type | Priority | Status | Changes Required | Dependencies |
|------|------|----------|--------|------------------|--------------|
| `src/workers/UniversalMetricsCalculator.ts` | Core | High | ✅ **COMPLETE** | Structure-based callout recognition implemented | Settings system |
| `src/types/journal-check.ts` | Types | High | ✅ **COMPLETE** | Default structures and type definitions | None |
| `src/dom/modals/HubModal.ts` | UI | High | ✅ **COMPLETE** | **v0.12.0** - Unified Hub with consolidated settings | Modal components |
| `src/utils/structure-helpers.ts` | Utils | Medium | ✅ **COMPLETE** | Structure helper functions implemented | Type definitions |
| `src/dom/modals/HubModal.ts` (Date Fields) | UI | High | ✅ **COMPLETE** | **v0.12.0** - Complete date field system rebuild | date-fns integration |
| `src/dom/modals/HubModal.ts` (Callout Settings) | UI | High | ✅ **COMPLETE** | **v0.12.0** - Callout Settings integrated into Hub | Settings persistence |
| Test files | Tests | Medium | 🔄 **PLANNED** | Unit and integration tests | Implementation complete |

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

**Status**: Phase 1 Complete ✅ | Phase 2 Complete ✅ | v0.12.0 Architecture Overhaul Complete ✅ | Phase 3 Content Analysis Tab Complete ✅

### **🚀 v0.12.0 Major Architecture Overhaul (January 2025)**

**Completed**: Major architectural consolidation and system rebuilds

**Revolutionary Changes**:
- 🏗️ **Unified OneiroMetrics Hub**: Complete consolidation of all plugin functionality into a single, tabbed interface
- 🔧 **Field Architecture Rebuild**: Ground-up reconstruction of core input fields and settings interfaces
- 📅 **Date System Overhaul**: Complete replacement of broken date formatting with robust date-fns integration
- 🎨 **Callout Settings Integration**: Moved and rebuilt Callout Settings as a core Hub tab
- 🔄 **Settings Consolidation**: Eliminated scattered modal dialogs in favor of unified hub interface

**Technical Achievements**:
- **Rebuilt Field Systems**: All major configuration fields reconstructed with modern patterns
- **Enhanced Validation**: New validation systems with better error reporting and user guidance
- **Improved Data Flow**: More predictable state management across rebuilt field systems
- **Date Format Fixes**: Fixed broken token replacement (e.g., "yyyyMMDD" now correctly shows "20250115" instead of "2025MMDD")
- **Comprehensive Fallbacks**: Robust error handling with graceful degradation across all rebuilt systems

**User Experience Revolution**:
- **Seamless Integration**: Previously separate configurations now work together harmoniously
- **Reduced Cognitive Load**: Fewer modal switches and context changes required
- **Better Accessibility**: Improved keyboard navigation and screen reader support
- **Consistent Interface**: Unified design language across all rebuilt components

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

### **Phase 2.4 Completion Summary** 

**Completed**: Phase 2.4 - HubModal Journal Structure Tab Redesign (All sub-phases complete)

**Major Accomplishments:**
- ✅ **Complete Inline Structure Editor**: Implemented comprehensive form with all necessary fields (name, description, type, callouts, options)
- ✅ **Native Obsidian UI Integration**: Replaced all custom toggle CSS with Obsidian's native `checkbox-container` structure
- ✅ **Real-time Form Validation**: Added live validation with error/warning display and proper user feedback
- ✅ **Live Preview System**: Implemented dynamic preview showing nested vs flat structure examples
- ✅ **Default Structures**: Auto-creation of Legacy Dream, AV Journal, and Simple Dream structures
- ✅ **Settings Persistence**: Complete integration with plugin settings system
- ✅ **Copy to Clipboard**: Export individual structures as JSON
- ✅ **Obsidian Settings Design**: Right-aligned form controls with left-aligned labels
- ✅ **Structure Management Operations**: Create New, Clone, Delete, Import with conflict resolution

### **🎯 Phase 3 Final Tasks - Practical Completion**

The remaining work focuses on making the structure system fully functional and useful for content management:

**Priority 3.1: Structure Validation Logic (Priority 1)** 
- 🔄 **Implement structure validation in LintingEngine**
- 🔄 **Add callout pattern validation against structures**
- 🔄 **Create structure conflict detection**
- 🔄 **Implement validation feedback in HubModal**

**Priority 3.2: Auto-Detection & Content Analysis (Priority 2)**
- 🔄 **Implement auto-detection of journal structures from existing content**
- 🔄 **Create content analysis tools for understanding current patterns**
- 🔄 **Add smart structure suggestions based on existing callouts**
- 🔄 **Implement "Analyze My Content" feature in HubModal**

**Priority 3.3: Migration & Conversion Tools (Priority 3)**
- 🔄 **Create migration tools for converting between structures**
- 🔄 **Add bulk content migration capabilities**
- 🔄 **Implement structure conversion preview**
- 🔄 **Add backup/restore functionality for structure changes**

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
- ✅ **Replace**: Remove collapsible sections with single-page layout
- ✅ **Implement**: CSS-based show/hide for inline editor (`display: none/block`)
- ✅ **Add**: Edit button next to each structure in the list
- ✅ **Expand**: Clicking Edit reveals inline editor below the structure item
- ✅ **Complete**: Full structure editing form with all fields implemented
- ✅ **Complete**: Form validation with real-time preview
- ✅ **Complete**: Save/Cancel functionality with settings persistence
- ✅ **Complete**: Live preview showing structure examples
- ✅ **Complete**: Real-time validation with error/warning display

**Task 2.4.2: Enhanced Structure List**
- ✅ **Add**: Usage statistics display (times used, last used)
- ✅ **Add**: Validation status indicators (✅ valid, ⚠️ warnings, ❌ errors)
- ✅ **Add**: Visual hierarchy with proper spacing and typography
- ✅ **Add**: Enable/disable toggles using Obsidian's native checkbox structure
- ✅ **Implement**: Action buttons (Edit, Clone, Delete) for each structure
- ✅ **Replace**: Basic list with enhanced visual design
- ✅ **Complete**: Default structures auto-creation (Legacy Dream, AV Journal, Simple Dream)
- 🔄 **TODO**: Connect to actual usage analytics data
- 🔄 **TODO**: Implement structure validation logic

**Task 2.4.3: Copy to Clipboard Integration**
- ✅ **Add**: "Copy to Clipboard" button in structure editor
- ✅ **Add**: Export functionality for individual structures  
- ✅ **Implement**: Export all structures functionality
- 🔄 **TODO**: Import structures with conflict resolution

**Task 2.4.4: Single-Page Layout Implementation**
- ✅ **Remove**: All collapsible/expandable sections
- ✅ **Convert**: To single scrollable page like Obsidian Settings
- ✅ **Organize**: Content in logical sections with clear headers
- ✅ **Replace**: Overview section with focused Validation section
- ✅ **Update**: Visual hierarchy and spacing
- ✅ **Complete**: Full Obsidian Settings-style design

**Task 2.4.5: Progressive Disclosure and Native UI**
- ✅ **Implement**: Inline editors hidden by default, shown on demand
- ✅ **Add**: Action buttons that reveal functionality progressively
- ✅ **Complete**: Native Obsidian checkbox structure for all toggles
- ✅ **Remove**: Custom toggle CSS in favor of native styling
- ✅ **Complete**: Right-aligned form controls matching Obsidian's design patterns

### **✅ Phase 2.4 Completion Summary (2025-01-06)**

**Major Accomplishments:**
- ✅ **Complete Inline Structure Editor**: Implemented comprehensive form with all necessary fields (name, description, type, callouts, options)
- ✅ **Native Obsidian UI Integration**: Replaced all custom toggle CSS with Obsidian's native `checkbox-container` structure
- ✅ **Real-time Form Validation**: Added live validation with error/warning display and proper user feedback
- ✅ **Live Preview System**: Implemented dynamic preview showing nested vs flat structure examples
- ✅ **Default Structures**: Auto-creation of Legacy Dream, AV Journal, and Simple Dream structures
- ✅ **Settings Persistence**: Complete integration with plugin settings system
- ✅ **Copy to Clipboard**: Export individual structures as JSON
- ✅ **Obsidian Settings Design**: Right-aligned form controls with left-aligned labels

**Priority 2 Structure Management Operations (2025-01-06):**
- ✅ **Create New Structure**: Implemented `createNewStructure()` with blank form creation and inline editing
- ✅ **Clone Structure**: Implemented `cloneStructure()` with automatic name conflict resolution
- ✅ **Delete Structure**: Implemented `deleteStructure()` with confirmation dialog and default structure handling
- ✅ **Import Structures**: Implemented `importStructures()` with JSON file import and conflict resolution dialog
- ✅ **Conflict Resolution**: Added `showConflictResolutionDialog()` with overwrite/rename/skip/cancel options
- ✅ **Type Safety**: Added `ExtendedCalloutStructure` interface for runtime properties (enabled, isDefault, timestamps)
- ✅ **Error Handling**: Comprehensive error handling and user feedback for all operations

**Technical Achievements:**
- ✅ **TypeScript Compliance**: Fixed all compilation errors with proper type casting and interface extensions
- ✅ **Settings Integration**: All operations properly save to and load from plugin settings
- ✅ **UI Refresh**: Automatic UI refresh after structure modifications
- ✅ **Validation**: Prevents deletion of last structure and handles default structure reassignment

### **🎯 Next Implementation Priorities**

**✅ COMPLETED IN v0.12.0:**
- ✅ **Unified Hub Architecture**: Complete consolidation of all plugin functionality
- ✅ **Field System Overhaul**: Ground-up reconstruction of core input and configuration fields
- ✅ **Date Formatting Revolution**: Fixed broken date format preview system with proper date-fns integration
- ✅ **Callout Settings Integration**: Moved and enhanced Callout Settings as core Hub functionality
- ✅ **Settings Persistence**: Robust settings synchronization across all rebuilt field systems
- ✅ **Enhanced User Experience**: Eliminated modal switching, improved accessibility, unified design

**🔄 REMAINING PRIORITIES (Phase 3):**

**Priority 3.1: Content Analysis & Detection (High Priority)**  
- 🔄 **Implement auto-detection of journal structures from existing content**
- 🔄 **Create content analysis tools for understanding current patterns**
- 🔄 **Add smart structure suggestions based on existing callouts**
- 🔄 **Implement "Analyze My Content" feature in Hub Content Analysis tab**

**Priority 3.2: Advanced Validation (Medium Priority)**
- 🔄 **Connect structure validation to actual LintingEngine**
- 🔄 **Add callout pattern validation against structures**
- 🔄 **Create structure conflict detection**
- 🔄 **Implement real-time validation feedback in Hub**

**Priority 3.3: Migration & Conversion Tools (Lower Priority)**
- 🔄 **Create migration tools for converting between structures**
- 🔄 **Add bulk content migration capabilities**
- 🔄 **Implement automated structure migration workflows**

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

### **User Testing Strategy**
- [ ] **Historical data import** - How to best import journal data going back to 1990?
- [ ] **Structure migration** - Tools for converting between different journal structures?
- [ ] **Validation accuracy** - How to ensure scraping works correctly across decades of data?
- [ ] **Performance with large datasets** - How does the system handle thousands of entries?
- [ ] **Performance Testing: Dummy Data Generation** - Create system to generate realistic test datasets (500-10k+ entries) for performance benchmarking and scalability validation. See [Performance Testing Plan](./feature-requirements/performance-testing-dummy-data.md) for detailed specifications.

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

---

## 🤔 **Open Questions and Feature Gaps**

### **Template Management Gaps**
- [ ] **Template validation** - Does the wizard validate that templates actually work?
- [ ] **Template preview accuracy** - Are Templater previews showing realistic output?
- [ ] **Template editing workflow** - Can users easily modify existing templates?
- [ ] **Structure import/export** - Can users share template configurations?
- [ ] **Bulk template operations** - Delete multiple, duplicate templates, etc.
- [ ] **Template versioning** - Track changes to templates over time

### **First-Time User Experience**
- [ ] **Wizard suitability for beginners** - Is the existing wizard accessible to first-time users?
- [ ] **Interactive tooltips** - Should we add contextual help throughout the wizard?
- [ ] **Progressive disclosure** - Do we reveal complexity gradually?
- [ ] **Default template suggestions** - Should we provide more starter templates?

### **User Testing Strategy**
- [ ] **Historical data import** - How to best import journal data going back to 1990?
- [ ] **Structure migration** - Tools for converting between different journal structures?
- [ ] **Validation accuracy** - How to ensure scraping works correctly across decades of data?
- [ ] **Performance with large datasets** - How does the system handle thousands of entries?
- [ ] **Performance Testing: Dummy Data Generation** - Create system to generate realistic test datasets (500-10k+ entries) for performance benchmarking and scalability validation. See [Performance Testing Plan](./feature-requirements/performance-testing-dummy-data.md) for detailed specifications.

### **Testing & Quality Assurance Integration**
- [ ] **Existing testing modals** - How to integrate new Developer Tools with current testing infrastructure?
- [ ] **Test coverage gaps** - Which areas need automated testing most urgently?
- [ ] **User acceptance criteria** - What constitutes "working correctly" for imported historical data?

---

## 📋 **Accessibility and Responsiveness Testing Scripts**

### **Accessibility Testing Checklist**

#### **Keyboard Navigation Test**
- [ ] **Tab Navigation**: Can user navigate entire wizard using only Tab/Shift+Tab?
- [ ] **Focus Indicators**: Are focus states clearly visible on all interactive elements?
- [ ] **Skip Links**: Can users skip repetitive navigation elements?
- [ ] **Logical Tab Order**: Does tab order follow visual layout and content flow?
- [ ] **No Keyboard Traps**: Can users always escape focused elements?

#### **Screen Reader Test**
- [ ] **Semantic HTML**: Are headings, lists, and landmarks properly structured?
- [ ] **ARIA Labels**: Do buttons and form controls have descriptive labels?
- [ ] **Error Messages**: Are validation errors announced to screen readers?
- [ ] **Live Regions**: Do dynamic content updates get announced?
- [ ] **Image Alt Text**: Do meaningful images have appropriate descriptions?

#### **Color and Contrast Test**
- [ ] **WCAG AA Compliance**: Does text meet 4.5:1 contrast ratio requirement?
- [ ] **WCAG AAA Compliance**: Does text meet 7:1 contrast ratio for enhanced accessibility?
- [ ] **Color Dependence**: Is information conveyed without relying solely on color?
- [ ] **High Contrast Mode**: Does interface work in Windows high contrast mode?
- [ ] **Dark/Light Themes**: Are both themes accessible?

#### **Focus Management Test**
- [ ] **Modal Focus**: Is focus trapped within modal dialogs?
- [ ] **Step Navigation**: Does focus move logically between wizard steps?
- [ ] **Error Handling**: Is focus moved to error messages when validation fails?
- [ ] **Success Actions**: Is focus managed appropriately after successful actions?
- [ ] **Escape Handling**: Can users escape modal dialogs with Esc key?

### **Mobile/Responsiveness Testing Checklist**

#### **Responsive Breakpoints Test**
- [ ] **320px (Small Phone)**: Does layout work on smallest common screen?
- [ ] **375px (iPhone)**: Standard mobile phone experience acceptable?
- [ ] **768px (Tablet Portrait)**: Tablet interface usable and intuitive?
- [ ] **1024px (Tablet Landscape)**: Does layout utilize available space well?
- [ ] **1200px+ (Desktop)**: Full desktop experience optimal?

#### **Touch Interaction Test**
- [ ] **44px Minimum**: Are all touch targets at least 44px in size?
- [ ] **Thumb Reach**: Can users reach all controls with thumb navigation?
- [ ] **Gesture Support**: Do swipe/pinch gestures work where appropriate?
- [ ] **Tap Response**: Is touch feedback immediate and clear?
- [ ] **No Hover Dependence**: Do interactions work without hover states?

#### **Modal Behavior Test**
- [ ] **Small Screen Layout**: Does wizard modal fit comfortably on phone screens?
- [ ] **Scrolling Behavior**: Can users scroll through long content easily?
- [ ] **Sticky Elements**: Do navigation buttons remain accessible while scrolling?
- [ ] **Orientation Changes**: Does layout adapt to portrait/landscape rotation?
- [ ] **Virtual Keyboard**: Does interface adjust when on-screen keyboard appears?

#### **Text and Content Test**
- [ ] **Font Size**: Is text readable without zooming on mobile devices?
- [ ] **Line Height**: Is text comfortable to read on small screens?
- [ ] **Content Hierarchy**: Is information priority clear on mobile?
- [ ] **Truncation**: Does text truncate gracefully when space is limited?
- [ ] **White Space**: Is there adequate spacing between elements?

#### **Navigation Usability Test**
- [ ] **One-Handed Use**: Can interface be navigated with one hand/thumb?
- [ ] **Back Button**: Does device back button work predictably?
- [ ] **Step Indicators**: Are current step and progress clear on small screens?
- [ ] **Error Recovery**: Can users easily correct mistakes on mobile?
- [ ] **Save/Resume**: Can users save progress and return later?

### **Testing Script Template**

```markdown
## Accessibility Test Session - [Date]

**Tester**: [Name]
**Environment**: [OS, Browser, Assistive Technology]
**Test Duration**: [Start Time] - [End Time]

### Results Summary
- **Passed**: [Number] tests
- **Failed**: [Number] tests  
- **Critical Issues**: [Number]
- **Minor Issues**: [Number]

### Critical Issues Found
1. [Issue description, steps to reproduce, expected vs actual behavior]
2. [Additional issues...]

### Minor Issues Found
1. [Issue description and suggested improvement]
2. [Additional issues...]

### Recommendations
- [Priority fixes needed]
- [Suggested improvements]
- [Follow-up testing needed]
```

### **Mobile Test Session Template**

```markdown
## Mobile Responsiveness Test - [Date]

**Tester**: [Name]
**Device**: [Device model/Browser dev tools]
**Screen Sizes Tested**: [List of breakpoints]
**Orientations**: [Portrait/Landscape]

### Breakpoint Results
- **320px**: [Pass/Fail with notes]
- **375px**: [Pass/Fail with notes]
- **768px**: [Pass/Fail with notes]
- **1024px**: [Pass/Fail with notes]

### Critical Issues
[Layout breaks, unusable features, accessibility problems]

### Minor Issues  
[Polish improvements, spacing adjustments, etc.]

### Device-Specific Notes
[Any unique behavior on specific devices/browsers]
```

### **🚀 Final Phase 3 Plan - Content Analysis Tab**

**Decision**: Add "Content Analysis" tab to Hub for analysis/migration/validation features ✅ **IMPLEMENTED**

**Core Use Cases:**
1. **Template Validation**: Check if your Hub templates follow proper structure patterns ✅ **IMPLEMENTED**
2. **Content Checking**: Analyze specific folders/notes to understand existing patterns ✅ **UI IMPLEMENTED**
3. **Structure Migration**: Convert between different callout structures safely ✅ **UI IMPLEMENTED**
4. **Conflict Detection**: Ensure structures don't interfere with each other ✅ **PLANNED**

**Hub Structure:**
```
Hub Tabs:
├── Dashboard
├── Callout Settings  
├── Dream Scrape
├── Journal Structure (manage/create/edit structures)
└── Content Analysis (validate templates, analyze content, migrate) ✅ **IMPLEMENTED**
```

### **Content Analysis Tab Features:**

#### **1. Template Validation (Priority 1) ✅ IMPLEMENTED**
- ✅ Select templates from Hub to analyze
- ✅ Check if template patterns match defined structures  
- ✅ Validate callout syntax and nesting
- ✅ Show structure compliance report
- 🔄 **TODO**: Implement actual validation logic (currently placeholder)

#### **2. Content Pattern Analysis (Priority 2) ✅ UI IMPLEMENTED**  
- ✅ Select specific folders or notes to analyze
- ✅ Discover what callout patterns you're actually using
- ✅ Compare with existing structure definitions
- ✅ Suggest new structures based on discovered patterns
- 🔄 **TODO**: Implement folder/note picker functionality
- 🔄 **TODO**: Implement content analysis logic

#### **3. Basic Migration Tools (Priority 3) ✅ UI IMPLEMENTED**
- ✅ Preview what changes would happen when switching structures
- ✅ Convert content between structure formats
- ✅ Backup before making changes
- ✅ Simple callout renaming (e.g., `journal-entry` → `av-journal`)
- 🔄 **TODO**: Implement migration logic

#### **4. Structure Validation (Built into Journal Structure tab)**
- 🔄 Check for conflicts between structures (duplicate callouts, invalid names)
- 🔄 Validate structure definitions before saving
- 🔄 Show warnings for potential issues

### **✅ Implementation Status (2025-06-03)**

**Completed:**
- ✅ **Content Analysis Tab**: Successfully added to HubModal with full UI
- ✅ **Template Validation Section**: Lists all Hub templates with validate buttons
- ✅ **Content Pattern Analysis Section**: UI for selecting folders/notes for analysis
- ✅ **Migration Tools Section**: Placeholder UI for future migration functionality
- ✅ **Tab Navigation**: Integrated into existing Hub tab system
- ✅ **Build Success**: All changes compile and build successfully

**Next Steps (Optional Enhancement):**
1. **Implement Template Validation Logic**: Add actual callout pattern validation
2. **Add Folder/Note Picker**: Implement file selection for content analysis
3. **Content Analysis Engine**: Build pattern detection and analysis logic
4. **Migration Tools**: Implement structure conversion functionality

This keeps the scope practical and focused on features you'd actually use, without overwhelming complexity.