# Dream Journal Manager - Consolidation Plan

## Overview

This document outlines the plan to consolidate the Dream Scrape modal and the Journal Structure Settings modal into a single unified "Dream Journal Manager" modal with a tabbed interface.

## Goals

- Simplify the user experience by reducing the number of separate modals
- Create a cohesive interface for all dream journal management operations
- Maintain all existing functionality in a more integrated format
- Improve discoverability of features by organizing them in logical sections

## Current State

1. **Dream Scrape Modal (`OneiroMetricsModal` class)**
   - Focus: Data extraction/collection from journal entries
   - Core features:
     - File/folder selection for scraping
     - Scrape operation execution with progress tracking
     - Open metrics note button
     - Settings button

2. **Journal Structure Modal (`JournalStructureModal` class)**
   - Focus: Validation and formatting settings for journal entries
   - Core features:
     - Structure definitions
     - Template management
     - Templater integration
     - Content isolation settings
     - User interface preferences

## UI Mockup

Below are text-based mockups of the intended layout for the Dream Journal Manager:

### Dashboard Tab

```
+-----------------------------------------------------------------------------------------------+
|                                   Dream Journal Manager                                        |
+----------------+----------------------------------------------------------------------------+
|                |                                                                            |
| [✓] Dashboard  |                            Dashboard                                       |
|                |                                                                            |
| [ ] Dream      | Welcome to the Dream Journal Manager! Manage all aspects of your dream     |
|     Scrape     | journal from this central hub.                                             |
|                |                                                                            |
| [ ] Journal    | +------------------------------------------------------------------+       |
|     Structure  | |                       Quick Actions                               |       |
|                | +------------------------------------------------------------------+       |
| [ ] Templates  | |                                                                  |       |
|                | | [Open Settings]    [Scrape Metrics]    [Check Structure]         |       |
| [ ] Templater  | |                                                                  |       |
|                | | [Create Template]  [View Metrics]      [Help & Docs]             |       |
| [ ] Content    | +------------------------------------------------------------------+       |
|     Isolation  |                                                                            |
|                | +------------------------------------------------------------------+       |
| [ ] Interface  | |                       Recent Activity                             |       |
|                | +------------------------------------------------------------------+       |
+----------------+ | Last scrape: 03/15/2024 - 15 entries processed, 7 with metrics   |       |
|                | | Last validation: 03/14/2024 - 2 errors, 1 warning                |       |
|                | | Recently used template: "Lucid Dream Template"                    |       |
|                | +------------------------------------------------------------------+       |
|                |                                                                            |
|                | +------------------------------------------------------------------+       |
|                | |                       Status Overview                             |       |
|                | +------------------------------------------------------------------+       |
|                | | Current selection: 12 notes in "Dream Journal" folder             |       |
|                | | Templates: 4 templates defined                                    |       |
|                | | Structures: 2 structures defined                                  |       |
|                | | Validation: Enabled                                               |       |
|                | +------------------------------------------------------------------+       |
|                |                                                                            |
+----------------+----------------------------------------------------------------------------+
```

### Dream Scrape Tab

```
+-----------------------------------------------------------------------------------------------+
|                                   Dream Journal Manager                                        |
+----------------+----------------------------------------------------------------------------+
|                |                                                                            |
| [ ] Dashboard  |                         Dream Metrics Scraper                              |
|                |                                                                            |
| [✓] Dream      | Extract and process metrics from your dream journal entries.               |
|     Scrape     |                                                                            |
|                | +------------------------------------------------------------------+       |
| [ ] Journal    | | File or folder selection                                          |       |
|     Structure  | | Choose whether to select individual notes or a folder for metrics |       |
|                | |                                                                  |       |
| [ ] Templates  | | [Notes ▼]                                                         |       |
|                | +------------------------------------------------------------------+       |
| [ ] Templater  |                                                                            |
|                | +------------------------------------------------------------------+       |
| [ ] Content    | | Selected Notes                                                    |       |
|     Isolation  | | Notes to search for dream metrics (select one or more)           |       |
|                | |                                                                  |       |
| [ ] Interface  | | [Search field with auto-complete] [Selected chips appear here]    |       |
|                | +------------------------------------------------------------------+       |
+----------------+                                                                            |
|                | +------------------------------------------------------------------+       |
|                | | Scrape Files or Folder                                           |       |
|                | | Begin the scraping operation                                     |       |
|                | |                                                                  |       |
|                | | [Scrape Notes] [Open OneiroMetrics]                              |       |
|                | +------------------------------------------------------------------+       |
|                |                                                                            |
|                | +------------------------------------------------------------------+       |
|                | |                       Progress                                    |       |
|                | |                                                                  |       |
|                | | Processing file 1 of 15...                                        |       |
|                | | [================>                    ]  45%                      |       |
|                | | Found 7 entries with metrics                                      |       |
|                | +------------------------------------------------------------------+       |
|                |                                                                            |
+----------------+----------------------------------------------------------------------------+
```

These mockups show:

1. **Dashboard Tab**:
   - A welcome message introducing the unified interface
   - Quick action cards for common operations (including Open Settings)
   - Recent activity section showing latest operations
   - Status overview with current configuration summary
   
2. **Dream Scrape Tab**:
   - The sidebar navigation with renamed tabs ("Overview" → "Dashboard" and adding "Journal Structure")
   - The main content area displaying the Dream Scrape UI elements:
     - Selection mode dropdown (Notes/Folder)
     - Notes/Folder selection with autocomplete
     - Scrape and Open OneiroMetrics buttons
     - Progress tracking section

The Dashboard serves as a central hub that ties together all functionality, while each specific tab maintains its focused purpose. The renamed "Journal Structure" tab (previously "Overview") provides clearer distinction between the general overview dashboard and the specific structural settings.

The design maintains all the functionality of both the current Dream Scrape modal and Journal Structure modal while providing an improved user experience through meaningful grouping and quick-access options.

## Implementation Plan

### 1. Rename and Update Class

- Rename `JournalStructureModal` to `DreamJournalManager`
- Update references across the codebase
- Modify the title from "Journal Structure Settings" to "Dream Journal Manager"

### 2. Add New Navigation Tab

Add a new tab in the sidebar navigation:
```javascript
{ id: 'dream-scrape', label: 'Dream Scrape', icon: 'wand-sparkles' }
```

### 3. Create Dream Scrape Section

Create a new `buildDreamScrapeSection()` method that implements the functionality of the current Dream Scrape modal:
- File/folder selection UI
- Scrape button and progress tracking
- Results visualization

### 4. State Management

- Ensure proper state initialization when the tab is activated
- Track scraping progress and status within the new modal
- Handle transitions between tabs gracefully

### 5. Update References

- Modify ribbon button references to open the new unified modal
- Update UI elements that linked to the old modals
- Ensure commands open the appropriate tab directly

### 6. UI Adjustments

- Adjust modal dimensions to accommodate both functions
- Ensure consistent styling across all tabs
- Add contextual help text to guide users

### 7. Ribbon Button Update

- Modify the existing Dream Scraper ribbon button (with the lucide wand-sparkles icon) to open the new Dream Journal Manager modal
- Ensure it opens directly to the Dream Scrape tab for a seamless user experience
- Maintain the same tooltip text and functionality to preserve user familiarity
- Update the button's click handler code in `main.ts`:
  
  ```typescript
  // Current implementation
  this.scrapeRibbonEl = this.addRibbonIcon('wand-sparkles', 'Dream Scrape Tool', () => {
      new OneiroMetricsModal(this.app, this).open();
  });
  
  // Updated implementation
  this.scrapeRibbonEl = this.addRibbonIcon('wand-sparkles', 'Dream Scrape Tool', () => {
      new DreamJournalManager(this.app, this, 'dream-scrape').open();
  });
  ```

- Test thoroughly to ensure the transition is seamless for users who regularly use this button

### 8. Implementation of Quick Action Buttons

When implementing the Dashboard's Quick Action buttons, each button needs a specific handler:

```typescript
// Help & Docs button implementation
const helpDocsButton = quickActionsContainer.createEl('button', {
    text: 'Help & Docs',
    cls: 'oom-dashboard-button'
});
helpDocsButton.addEventListener('click', () => {
        // Open the usage.md documentation on GitHub    const helpDocsUrl = "https://github.com/banisterious/obsidian-oneirometrics/blob/main/docs/user/guides/usage.md";    window.open(helpDocsUrl, "_blank");
});
```

Replace `your-username` with the actual GitHub username or organization name for the repository.

## Code Changes Required

1. **Class Renaming**
   - Rename `JournalStructureModal` to `DreamJournalManager`
   - Update import statements across files

2. **Moving Dream Scrape Functionality**
   - Port the UI elements and behavior from `OneiroMetricsModal` to a new section
   - Ensure the scraping logic works in the new context

3. **Navigation Updates**
   - Add Dream Scrape as a nav item
   - Ensure it can be directly opened to this tab

4. **Progress Tracking**
   - Move progress tracking logic from the old modal to the new one
   - Ensure proper state management

5. **Command Registration**
   - Update command registration to point to the new modal
   - Add ability to open specific tabs directly

## Technical Implementation Details

### File Changes

1. Rename `src/journal_check/ui/JournalStructureModal.ts` to `src/journal_check/ui/DreamJournalManager.ts`

2. Update the class definition and imports:

```typescript
// src/journal_check/ui/DreamJournalManager.ts
import { App, Modal, Setting, MarkdownRenderer, ToggleComponent, TextComponent, ButtonComponent, Notice, setIcon, TFile } from 'obsidian';
import DreamMetricsPlugin from '../../../main';
import { CalloutStructure, JournalTemplate, LintingRule, ContentIsolationSettings, LintingSettings } from '../types';
import { TemplaterIntegration } from '../TemplaterIntegration';
import { TemplateWizard } from './TemplateWizard';

export class DreamJournalManager extends Modal {
    private mainContentEl: HTMLElement;
    private templaterIntegration: TemplaterIntegration;
    private sections: {[key: string]: HTMLElement} = {};
    
    // For Dream Scrape functionality
    private selectionMode: 'notes' | 'folder';
    private selectedNotes: string[];
    private selectedFolder: string;
    private progressContent: HTMLElement;
    private statusText: HTMLElement;
    private progressBar: HTMLElement;
    private progressFill: HTMLElement;
    private detailsText: HTMLElement;
    private scrapeButton: HTMLButtonElement;
    private isScraping: boolean = false;
    private openNoteButton: HTMLButtonElement;
    private activeSection: string = 'dashboard';
    
    constructor(
        app: App,
        private plugin: DreamMetricsPlugin,
        initialSection: string = 'dashboard'
    ) {
        super(app);
        this.templaterIntegration = this.plugin.templaterIntegration;
        this.selectionMode = plugin.settings.selectionMode || 'notes';
        this.selectedNotes = plugin.settings.selectedNotes || [];
        this.selectedFolder = plugin.settings.selectedFolder || '';
        this.activeSection = initialSection;
    }
    
    // ...existing methods...
}
```

3. Update the sidebar navigation to include the new tab:

```typescript
private buildSidebar(containerEl: HTMLElement) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'home' },
        { id: 'dream-scrape', label: 'Dream Scrape', icon: 'wand-sparkles' },
        { id: 'journal-structure', label: 'Journal Structure', icon: 'layout' },
        { id: 'templates', label: 'Templates', icon: 'file-text' },
        { id: 'templater', label: 'Templater', icon: 'code' },
        { id: 'content-isolation', label: 'Content Isolation', icon: 'filter' },
        { id: 'ui', label: 'Interface', icon: 'sliders' }
    ];
    
    for (const item of navItems) {
        const navItemEl = containerEl.createDiv({ cls: 'oom-nav-item' });
        navItemEl.setAttribute('data-section', item.id);
        
        const iconEl = navItemEl.createSpan({ cls: 'oom-nav-icon' });
        setIcon(iconEl, item.icon);
        
        navItemEl.createSpan({ text: item.label, cls: 'oom-nav-label' });
        
        navItemEl.addEventListener('click', () => {
            this.showSection(item.id);
        });
    }
}
```

4. Add the Dream Scrape section builder method:

```typescript
private buildDreamScrapeSection() {
    const sectionEl = this.mainContentEl.createDiv();
    this.sections['dream-scrape'] = sectionEl;
    
    sectionEl.createEl('h3', { text: 'Dream Metrics Scraper' });
    
    sectionEl.createEl('p', { 
        text: 'Extract and process metrics from your dream journal entries.' 
    });

    // --- Selection Mode Row ---
    const modeRow = sectionEl.createEl('div', { cls: 'oom-modal-section oom-modal-row' });
    const modeLeft = modeRow.createEl('div', { cls: 'oom-modal-col-left' });
    modeLeft.createEl('label', { text: 'File or folder selection', cls: 'oom-modal-label' });
    modeLeft.createEl('div', { text: 'Choose whether to select individual notes or a folder for metrics scraping', cls: 'oom-modal-helper' });
    const modeRight = modeRow.createEl('div', { cls: 'oom-modal-col-right' });
    const modeDropdown = modeRight.createEl('select', { cls: 'oom-dropdown' });
    modeDropdown.createEl('option', { text: 'Notes', value: 'notes' });
    modeDropdown.createEl('option', { text: 'Folder', value: 'folder' });
    modeDropdown.value = this.selectionMode;

    // --- File/Folder Selector Row ---
    const selectorRow = sectionEl.createEl('div', { cls: 'oom-modal-section oom-modal-row' });
    const selectorLeft = selectorRow.createEl('div', { cls: 'oom-modal-col-left' });
    const selectorRight = selectorRow.createEl('div', { cls: 'oom-modal-col-right' });
    
    this.buildSelectorUI(selectorLeft, selectorRight);
    
    // --- Scrape Button Row ---
    const scrapeRow = sectionEl.createEl('div', { cls: 'oom-modal-section oom-modal-row' });
    const scrapeLeft = scrapeRow.createEl('div', { cls: 'oom-modal-col-left' });
    scrapeLeft.createEl('label', { text: 'Scrape Files or Folder', cls: 'oom-modal-label' });
    scrapeLeft.createEl('div', { text: 'Begin the scraping operation', cls: 'oom-modal-helper' });
    const scrapeRight = scrapeRow.createEl('div', { cls: 'oom-modal-col-right' });
    
    this.scrapeButton = scrapeRight.createEl('button', {
        text: 'Scrape Notes',
        cls: 'mod-cta oom-modal-button oom-scrape-button'
    });
    
    this.scrapeButton.addEventListener('click', () => {
        if (!this.isScraping) {
            this.isScraping = true;
            this.scrapeButton.disabled = true;
            this.plugin.scrapeMetrics();
        }
    });

    // --- Open OneiroMetrics button ---
    this.openNoteButton = scrapeRight.createEl('button', {
        text: 'Open OneiroMetrics',
        cls: 'mod-cta oom-modal-button oom-open-note-button',
        attr: { title: 'Run a scrape to enable this' }
    });
    this.openNoteButton.disabled = true;
    this.openNoteButton.classList.remove('enabled');
    this.openNoteButton.addEventListener('click', () => {
        if (this.openNoteButton.disabled) return;
        const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.projectNote);
        if (file instanceof TFile) {
            this.app.workspace.openLinkText(this.plugin.settings.projectNote, '', true);
        } else {
            new Notice('Metrics note not found. Please set the path in settings.');
            (this.app as any).setting.open('oneirometrics');
        }
    });

    // --- Progress Section ---
    const progressSection = sectionEl.createEl('div', { cls: 'oom-modal-section oom-modal-progress' });
    this.progressContent = progressSection.createEl('div', { cls: 'oom-progress-content' });
    this.statusText = this.progressContent.createEl('div', { cls: 'oom-status-text' });
    this.progressBar = this.progressContent.createEl('div', { cls: 'oom-progress-bar' });
    this.progressFill = this.progressBar.createEl('div', { cls: 'oom-progress-fill' });
    this.detailsText = this.progressContent.createEl('div', { cls: 'oom-details-text' });
    
    // --- Dropdown Change Handler ---
    modeDropdown.addEventListener('change', async (e) => {
        const value = (e.target as HTMLSelectElement).value as 'notes' | 'folder';
        this.selectionMode = value;
        this.plugin.settings.selectionMode = value;
        if (value === 'folder') {
            this.plugin.settings.selectedNotes = [];
        } else {
            this.plugin.settings.selectedFolder = '';
        }
        await this.plugin.saveSettings();
        
        // Re-render selector UI
        selectorLeft.empty();
        selectorRight.empty();
        this.buildSelectorUI(selectorLeft, selectorRight);
    });
}

private buildSelectorUI(leftEl: HTMLElement, rightEl: HTMLElement) {
    if (this.selectionMode === 'folder') {
        leftEl.createEl('label', { text: 'Selected Folder', cls: 'oom-modal-label' });
        leftEl.createEl('div', { text: 'Name of the folder you intend to scrape (e.g. "Journals/YYYY-MM-DD") (max 200 files)', cls: 'oom-modal-helper' });
        
        // Folder autocomplete
        const folderAutocompleteContainer = rightEl.createDiv('oom-folder-autocomplete-container');
        import('../../../autocomplete').then(({ createFolderAutocomplete }) => {
            createFolderAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: folderAutocompleteContainer,
                selectedFolder: this.selectedFolder,
                onChange: async (folder) => {
                    this.selectedFolder = folder;
                    this.plugin.settings.selectedFolder = folder;
                    await this.plugin.saveSettings();
                }
            });
        });
    } else {
        leftEl.createEl('label', { text: 'Selected Notes', cls: 'oom-modal-label' });
        leftEl.createEl('div', { text: 'Notes to search for dream metrics (select one or more)', cls: 'oom-modal-helper' });
        
        // Notes autocomplete
        const notesAutocompleteContainer = rightEl.createDiv('oom-notes-autocomplete-container');
        import('../../../autocomplete').then(({ createSelectedNotesAutocomplete }) => {
            createSelectedNotesAutocomplete({
                app: this.app,
                plugin: this.plugin,
                containerEl: notesAutocompleteContainer,
                selectedNotes: this.selectedNotes,
                onChange: async (selected) => {
                    this.selectedNotes = selected;
                    this.plugin.settings.selectedNotes = selected;
                    await this.plugin.saveSettings();
                }
            });
        });
    }
}
```

5. Modify the `onOpen` method to build the new section and respect the `initialSection`:

```typescript
onOpen() {
    const { contentEl } = this;
    
    contentEl.addClass('oom-journal-structure-modal');
    
    // Create header
    contentEl.createEl('h2', { text: 'Dream Journal Manager' });
    
    // Create main content container with navigation sidebar and content area
    const container = contentEl.createDiv({ cls: 'oom-journal-structure-container' });
    const sidebar = container.createDiv({ cls: 'oom-journal-structure-sidebar' });
    this.mainContentEl = container.createDiv({ cls: 'oom-journal-structure-content' });
    
    // Build sidebar navigation
    this.buildSidebar(sidebar);
    
    // Build content sections
    this.buildDashboardSection();
    this.buildDreamScrapeSection();
    this.buildJournalStructureSection();
    this.buildTemplatesSection();
    this.buildTemplaterSection();
    this.buildContentIsolationSection();
    this.buildInterfaceSection();
    
    // Show the initial section
    this.showSection(this.activeSection);
}
```

## Future Enhancements

Once the consolidation is complete, we can consider additional improvements:
- Better integration between validation and scraping
- Shared state between tabs
- Unified reporting of issues and metrics
- Additional tabs for other functionality (e.g., metrics visualization)
- Move Templater Settings from the dedicated Templater tab into the Templates tab to improve UX and reduce tab clutter:
  - This would reduce the number of tabs in the navigation sidebar
  - Group all template-related functionality in one place for better user experience
  - Create a natural workflow where users can manage templates and their Templater integration in a single tab
  - Keep settings for Templater in a collapsible section at the bottom of the Templates tab
- TODO: Consider building a local help modal as an alternative to opening GitHub docs directly. For now, the "Help & Docs" button should open docs/USAGE.md on GitHub. 