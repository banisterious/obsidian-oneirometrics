# Template Wizard Modal Implementation

## Table of Contents

- [1. Overview](#1-overview)
- [2. Architecture](#2-architecture)
- [3. User Interface Design](#3-user-interface-design)
- [4. Implementation Details](#4-implementation-details)
- [5. Integration Points](#5-integration-points)
- [6. Configuration](#6-configuration)
- [7. Testing](#7-testing)
- [8. Future Enhancements](#8-future-enhancements)

## 1. Overview

**Date**: June 15, 2025  
**Status**: Implemented  
**Priority**: High  
**Component**: Template Creation System  

The TemplateWizardModal is a dedicated modal component that provides a step-by-step interface for creating journal templates in OneiroMetrics. It replaces the inline template wizard functionality previously embedded in HubModal, offering a cleaner, more focused user experience following Material Design principles.

### Purpose

- Provide an intuitive interface for template creation
- Support multiple template creation methods
- Ensure consistency with Obsidian's design language
- Improve code maintainability by separating concerns

### Key Features

- **Step-by-step wizard interface** (3 steps: Method → Content → Preview)
- **Multiple creation methods**: Direct Input, Structure-based, Templater integration
- **Material Design styling** with monochrome Obsidian-compatible theme
- **Real-time validation** and progress indication
- **Responsive design** for desktop and mobile usage
- **Accessibility-first approach** with proper ARIA attributes

## 2. Architecture

### Component Structure

```
TemplateWizardModal
├── Header
│   ├── Title
│   ├── Step Indicator (1, 2, 3)
│   └── Close Button
├── Content Area
│   ├── Step 1: Method Selection
│   ├── Step 2: Content Creation
│   └── Step 3: Preview & Confirm
└── Footer
    ├── Progress Indicator
    └── Navigation Buttons
```

### Class Hierarchy

```typescript
class TemplateWizardModal extends Modal {
    // Core Properties
    private plugin: DreamMetricsPlugin
    private wizardState: TemplateWizardState
    private contentContainer: HTMLElement
    private footerContainer: HTMLElement
    
    // UI Elements
    private nameInput: TextComponent | null
    private descriptionInput: TextComponent | null
    private contentTextarea: TextAreaComponent | null
    private structureDropdown: DropdownComponent | null
}
```

### State Management

```typescript
interface TemplateWizardState {
    method: TemplateCreationMethod | null;           // 'direct' | 'structure' | 'templater'
    templateName: string;                            // User-provided template name
    templateDescription: string;                     // Optional description
    content: string;                                 // Generated template content
    structure: CalloutStructure | null;             // Selected structure (for structure method)
    templaterFile: string;                          // Templater file path (for templater method)
    currentStep: number;                             // Current wizard step (1-3)
    isValid: boolean;                                // Current step validation state
}
```

## 3. User Interface Design

### Design Principles

1. **Material Design Approach**: Clean, card-based interface with proper spacing and typography
2. **Monochrome Theme**: Uses Obsidian's CSS variables for consistent theming
3. **Progressive Disclosure**: Information revealed step-by-step to avoid cognitive overload
4. **Visual Hierarchy**: Clear headings, descriptions, and interactive elements
5. **Accessibility**: Proper contrast, keyboard navigation, and screen reader support

### Step 1: Method Selection

**Purpose**: Allow users to choose how they want to create their template

**Interface Elements**:
- **Method Cards**: Three selectable cards with icons and descriptions
  - **Direct Input** (`edit-3` icon): Write template content directly
  - **Structure-based** (`building-2` icon): Build from predefined patterns
  - **Templater** (`zap` icon): Import from existing Templater files

**Visual Design**:
- Grid layout with responsive columns
- Hover effects and selection states
- Clear visual feedback for selected method

### Step 2: Content Creation

**Purpose**: Gather template content based on selected method

#### Direct Input Method
- **Template Name Input**: Text field for naming the template
- **Content Textarea**: Large monospace textarea for markdown content
- **Helper Chips**: Quick action buttons for common tasks
  - Paste Sample Content
  - Insert Callout
  - Add Metrics
  - Format Text

#### Structure-based Method
- **Template Name Input**: Text field for naming the template
- **Structure Dropdown**: Selection of predefined callout structures
  - Nested (3-level): journal-entry → dream-diary → dream-metrics
  - Nested (2-level): journal-entry → dream-metrics
  - Flat Structure: Separate callouts without nesting
  - Simple Basic: Minimal structure
- **Live Preview**: Shows generated content based on selected structure

#### Templater Method
- **Template File Selection**: File picker for existing Templater templates
- **Template Name**: Auto-generated from filename, editable
- **Preview**: Shows both dynamic and static versions

### Step 3: Preview & Confirm

**Purpose**: Final review before template creation

**Interface Elements**:
- **Template Description Input**: Optional description field
- **Preview Card**: Shows final template content in monospace font
- **Create Button**: Finalizes template creation

### Footer Navigation

**Components**:
- **Progress Section**: 
  - Step counter ("Step X of 3")
  - Progress bar with visual fill
- **Button Section**:
  - **Back Button**: Navigate to previous step (when available)
  - **Cancel Button**: Close modal without saving
  - **Continue/Create Button**: Proceed or finalize

## 4. Implementation Details

### File Structure

```
src/dom/modals/TemplateWizardModal.ts    # Main modal implementation
styles/wizards.css                       # Dedicated styling
build-css.js                            # Build configuration (includes wizards.css)
```

### Key Methods

#### Core Lifecycle
- `onOpen()`: Initialize modal and render first step
- `onClose()`: Cleanup and reset state
- `renderModal()`: Setup modal structure
- `renderCurrentStep()`: Render step-specific content

#### Step Rendering
- `renderMethodSelection()`: Step 1 interface
- `renderContentCreation()`: Step 2 interface (delegates to method-specific renderers)
- `renderPreviewAndConfirm()`: Step 3 interface

#### Content Generation
- `getAvailableStructures()`: Return predefined callout structures
- `generateContentFromStructure()`: Generate template content from structure
- `getStructureById()`: Retrieve structure by ID

#### Navigation & Validation
- `goNext()`: Advance to next step
- `goBack()`: Return to previous step  
- `validateCurrentStep()`: Check current step completion
- `updateStepIndicator()`: Update visual progress

#### Template Creation
- `createTemplate()`: Build final JournalTemplate object
- `saveTemplate()`: Persist template (integration point)

### Icon Implementation

All icons use Obsidian's built-in `setIcon()` function for proper Lucide icon rendering:

```typescript
import { setIcon } from 'obsidian';

// Example usage
const iconElement = container.createSpan({ cls: 'icon-class' });
setIcon(iconElement, 'icon-name');
```

**Icons Used**:
- `x`: Close button, Cancel button
- `arrow-left`, `arrow-right`: Navigation buttons
- `plus`: Create Template button
- `edit-3`: Direct Input method
- `building-2`: Structure method
- `zap`: Templater method
- `clipboard`, `message-square`, `bar-chart-3`, `type`: Helper chips
- `eye`: Preview title

### CSS Architecture

The modal uses the dedicated `styles/wizards.css` component with:

**CSS Custom Properties**:
- `--modal-max-width: 800px`
- `--modal-max-height: 90vh`
- Standard OneiroMetrics spacing and color variables

**Key CSS Classes**:
- `.oom-template-wizard-modal`: Modal container
- `.oom-method-card`: Selectable method cards
- `.oom-wizard-textarea`: Large content textarea
- `.oom-helper-chip`: Action helper buttons
- `.oom-preview-card`: Content preview container
- `.oom-btn`, `.oom-btn-primary`, `.oom-btn-ghost`: Navigation buttons

### Responsive Design

**Desktop (>768px)**:
- Three-column method grid
- Full modal width (800px)
- Side-by-side navigation buttons

**Mobile (≤768px)**:
- Single-column method grid
- Full-screen modal
- Stacked navigation buttons
- Reduced padding for better touch targets

### Accessibility Features

1. **Keyboard Navigation**: All interactive elements are keyboard accessible
2. **Screen Reader Support**: Proper heading hierarchy and ARIA attributes
3. **High Contrast Mode**: Compatible with forced-colors media query
4. **Reduced Motion**: Respects prefers-reduced-motion preference
5. **Focus Management**: Clear focus indicators and logical tab order

## 5. Integration Points

### Plugin Integration

```typescript
// Import and usage
import { TemplateWizardModal } from './dom/modals/TemplateWizardModal';

// Open modal
const wizard = new TemplateWizardModal(this.app, this.plugin);
wizard.open();
```

### HubModal Integration

The TemplateWizardModal is designed to replace the inline wizard in HubModal:

```typescript
// Previous: Inline wizard in HubModal
// New: Dedicated modal
const templateWizard = new TemplateWizardModal(this.app, this.plugin);
templateWizard.open();
```

### Template Storage Integration

The modal creates `JournalTemplate` objects compatible with the existing template system:

```typescript
interface JournalTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    structure: string;                    // CalloutStructure.id reference
    isTemplaterTemplate: boolean;
    templaterFile?: string;
    staticContent?: string;
}
```

### CalloutStructure Compatibility

Uses existing `CalloutStructure` interface from `src/types/journal-check.ts`:

```typescript
interface CalloutStructure {
    id: string;
    name: string;
    description: string;
    type: 'flat' | 'nested';
    rootCallout: string;
    childCallouts: string[];
    metricsCallout: string;
    dateFormat: string[];
    requiredFields: string[];
    optionalFields: string[];
}
```

## 6. Configuration

### Available Structures

The modal includes four predefined structures:

1. **Nested (3-level)**: `journal-entry → dream-diary → dream-metrics`
2. **Nested (2-level)**: `journal-entry → dream-metrics`  
3. **Flat Structure**: Separate callouts without nesting
4. **Simple Basic**: Minimal `journal-entry` with embedded metrics

### Customization Points

**Template Content Placeholders**:
- Default metrics: Sensory Detail, Emotional Recall, Lost Segments, Descriptiveness, Confidence Score
- Configurable through structure definitions
- Extensible for additional metrics

**Styling Customization**:
- CSS custom properties in `styles/wizards.css`
- Respects Obsidian theme variables
- Can be extended for custom branding

## 7. Testing

### Manual Testing Checklist

#### Step 1: Method Selection
- [ ] All three method cards display correctly
- [ ] Icons render properly using Obsidian's setIcon
- [ ] Card selection updates visual state
- [ ] Continue button enables only when method selected
- [ ] Navigation between cards works with keyboard

#### Step 2: Content Creation

**Direct Input Method**:
- [ ] Template name input accepts text
- [ ] Large textarea displays with monospace font
- [ ] Helper chips render with correct icons
- [ ] Sample content insertion works
- [ ] Content validation prevents proceeding with empty fields

**Structure Method**:
- [ ] Dropdown populates with available structures
- [ ] Structure selection generates appropriate content
- [ ] Preview updates in real-time
- [ ] Generated content follows correct nesting patterns

**Templater Method**:
- [ ] Placeholder text displays correctly
- [ ] Future implementation clearly indicated

#### Step 3: Preview & Confirm
- [ ] Preview displays final content correctly
- [ ] Description input accepts optional text
- [ ] Create button finalizes template
- [ ] Success notice appears on completion

#### Navigation & Progress
- [ ] Step indicator updates correctly
- [ ] Progress bar fills appropriately
- [ ] Back button navigates to previous steps
- [ ] Cancel button closes modal
- [ ] Validation prevents invalid progression

#### Responsive Design
- [ ] Desktop layout uses three-column grid
- [ ] Mobile layout stacks elements appropriately
- [ ] Touch targets meet minimum size requirements
- [ ] Modal scales properly on different screen sizes

#### Accessibility
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announcements are appropriate
- [ ] Focus indicators are visible
- [ ] High contrast mode displays correctly

### Integration Testing

- [ ] Modal opens from HubModal template button
- [ ] Created templates integrate with existing template system
- [ ] CSS builds correctly with wizards.css component
- [ ] No TypeScript compilation errors
- [ ] No console errors during operation

### Error Handling Testing

- [ ] Invalid template names handled gracefully
- [ ] Empty content prevents template creation
- [ ] Network errors during save are caught
- [ ] Modal state resets properly on close/cancel

## 8. Future Enhancements

### Planned Features

1. **Templater Integration**: Full implementation of Templater file selection and processing
2. **Custom Structure Creation**: Allow users to define their own callout structures
3. **Template Import/Export**: Share templates between vaults
4. **Template Categories**: Organize templates by type or purpose
5. **Advanced Preview**: Live rendering of markdown content
6. **Template Variables**: Support for dynamic placeholders
7. **Undo/Redo**: Step-level history for complex template creation

### Technical Improvements

1. **Performance Optimization**: Lazy loading of structure definitions
2. **Enhanced Validation**: Real-time content validation with suggestions
3. **Improved Accessibility**: Enhanced screen reader support
4. **Animation System**: Smooth transitions between steps
5. **Keyboard Shortcuts**: Power user features for quick navigation
6. **Context Help**: Inline help system for complex features

### Integration Enhancements

1. **Plugin API**: Allow other plugins to extend template creation
2. **Theme Integration**: Better support for custom themes
3. **Workspace Integration**: Integration with Obsidian's workspace features
4. **Command Palette**: Quick access through Obsidian commands
5. **Hotkeys**: Customizable keyboard shortcuts for modal operations

---

## Implementation Summary

### ✅ Completed Features

- **Template Creation Wizard**: Full 3-step wizard interface (Method → Content → Preview)
- **Template Editing Support**: Existing templates open in edit mode with pre-populated data
- **Smart Method Detection**: Automatically detects template type (direct, structure, templater) for editing
- **HubModal Integration**: Edit buttons now open the dedicated TemplateWizardModal
- **Material Design UI**: Clean, responsive interface following Obsidian design patterns
- **Import/Export Fix**: Resolved format mismatch between single template exports and bulk imports
- **State Persistence**: Template names and content persist across wizard steps
- **Error Handling**: Comprehensive logging and user-friendly error messages

### 🔧 Technical Improvements

- **Constructor Enhancement**: Optional `existingTemplate` parameter for edit mode
- **State Management**: Enhanced `TemplateWizardState` with editing support
- **Save Logic**: Unified create/update template functionality
- **Format Detection**: Smart detection of template creation method for editing
- **Logging Integration**: Structured logging with safeLogger throughout

### 🎯 Integration Points

- **HubModal**: `editExistingTemplate()` method replaced with TemplateWizardModal instantiation
- **Template Storage**: Compatible with existing `JournalTemplate` interface and settings structure
- **CSS Architecture**: Uses dedicated `wizards.css` component integrated into build system
- **Icon System**: Leverages Obsidian's `setIcon()` function for consistent Lucide icons

---

**Implementation Status**: ✅ Complete  
**Documentation Status**: ✅ Complete  
**Testing Status**: ✅ Ready for Testing  
**Integration Status**: ✅ Complete

**Created**: June 15, 2025  
**Last Updated**: June 15, 2025  
**Completed**: June 15, 2025