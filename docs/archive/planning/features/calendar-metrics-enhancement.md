# ⚠️ **DEPRECATED - MERGED INTO UNIFIED PLAN**

> **📋 This document has been consolidated into the unified plan:**  
> **[Metrics Visualization & Calendar Enhancement - Unified Plan](../../archive/features/metrics-visualization-unified-completed.md)**
>
> **Date Merged**: 2025-06-05  
> **Migration Status**: ✅ All content preserved and enhanced in unified document  
> **Project Status**: ✅ **COMPLETED 2025-06-06** - All phases successfully implemented
> **Action Required**: Reference the archived unified plan for historical documentation

---

# Calendar Metrics Visualization Enhancement

## 📑 Table of Contents

- [Current Issue](#current-issue)
- [Phase 1: Adaptive Metrics Approach (Immediate Fix)](#phase-1-adaptive-metrics-approach-immediate-fix)
  - [Implementation Steps](#implementation-steps)
  - [Code Changes](#code-changes)
- [Phase 2: Configurable Metrics Display (Future Enhancement)](#phase-2-configurable-metrics-display-future-enhancement)
  - [Implementation Steps](#implementation-steps-1)
  - [Detailed Implementation Plan](#detailed-implementation-plan)
  - [User Experience Benefits](#user-experience-benefits)
- [Additional Metric Additions ✅ **COMPLETED**](#additional-metric-additions-completed)
- [Implementation Timeline](#implementation-timeline)
  - [Phase 1 (Immediate)](#phase-1-immediate)
  - [Phase 2 (Next Release)](#phase-2-next-release)
  - [Phase 3 (Future)](#phase-3-future)

---

## Current Issue
- The DateNavigator calendar is not displaying dots (entries) and stars (quality metrics) for actual user entries
- The code is checking for hardcoded metrics (`Clarity`, `Vividness`, `Coherence`, `Intensity`, `Recall`) that don't match the actual metrics used in the plugin

## Phase 1: Adaptive Metrics Approach (Immediate Fix)

### Implementation Steps
1. Modify `calculateDayMetrics` method in `DateNavigator.ts` to adaptively use any metrics present in entries
2. Remove hardcoded metric names array
3. Iterate through all metrics in the entry dynamically
4. Apply the same threshold logic (high ≥8, medium ≥5, low >0) to any numeric metrics
5. Ensure entries without metrics still display dots for dream entry presence
6. Add debug logging to validate entry detection and processing

### Code Changes
```typescript
// Remove this hardcoded array:
// const qualityMetrics = ['Clarity', 'Vividness', 'Coherence', 'Intensity', 'Recall'];

// Instead, check if entry.metrics exists and iterate through all properties:
if (entry.metrics) {
    for (const metricName in entry.metrics) {
        const metricValue = entry.metrics[metricName];
        if (typeof metricValue === 'number') {
            // Apply threshold logic (same as current)
            // ...
        }
    }
}
```

## Phase 2: Configurable Metrics Display (Future Enhancement)

### Implementation Steps
1. Add new section to Settings tab called "Calendar Visualization Settings"
2. Create a MultiSelect component in the settings UI
3. Populate the MultiSelect with all available metrics from the system
4. Add a setting to store selected metrics in plugin settings
5. Modify the `calculateDayMetrics` method to check against user's preferences

### Detailed Implementation Plan

#### Settings Changes
```typescript
// Add to OOMSettings interface in settings.ts
interface OOMSettings {
    // ... existing settings
    calendarMetrics: {
        enabled: boolean;
        selectedMetrics: string[];  // Array of metric IDs to consider for star display
        useAllMetrics: boolean;     // If true, use all metrics regardless of selection
    }
}

// Default settings initialization
const DEFAULT_SETTINGS: OOMSettings = {
    // ... existing defaults
    calendarMetrics: {
        enabled: true,
        selectedMetrics: [],
        useAllMetrics: true
    }
}
```

#### Settings UI Changes
```typescript
// Add to the settings tab rendering
new Setting(containerEl)
    .setName('Calendar Metrics Visualization')
    .setDesc('Configure which metrics affect star quality indicators in the calendar')
    .addToggle(toggle => toggle
        .setValue(this.plugin.settings.calendarMetrics.enabled)
        .onChange(async (value) => {
            this.plugin.settings.calendarMetrics.enabled = value;
            await this.plugin.saveSettings();
            // Refresh any open calendars
            this.plugin.refreshDateNavigators();
        }));

// "Use All Metrics" setting
new Setting(containerEl)
    .setName('Use All Metrics')
    .setDesc('When enabled, all numeric metrics will affect star quality indicators')
    .addToggle(toggle => toggle
        .setValue(this.plugin.settings.calendarMetrics.useAllMetrics)
        .onChange(async (value) => {
            this.plugin.settings.calendarMetrics.useAllMetrics = value;
            // Show or hide the metric selector based on this value
            metricSelectorContainer.style.display = value ? 'none' : 'block';
            await this.plugin.saveSettings();
            // Refresh any open calendars
            this.plugin.refreshDateNavigators();
        }));

// Only show the metric selector if useAllMetrics is false
const metricSelectorContainer = containerEl.createDiv();
metricSelectorContainer.style.display = 
    this.plugin.settings.calendarMetrics.useAllMetrics ? 'none' : 'block';

// Create the metric selector
if (this.plugin.metricRegistry) {
    const metricOptions = this.plugin.metricRegistry
        .getAllMetrics()
        .filter(m => m.type === 'number' || m.type === 'score')
        .map(m => ({
            value: m.id,
            label: m.name
        }));
    
    new Setting(metricSelectorContainer)
        .setName('Select Metrics for Calendar Stars')
        .setDesc('Choose which metrics should affect star quality indicators')
        .addMultiSelect(ms => {
            ms.addOptions(metricOptions)
              .setValue(this.plugin.settings.calendarMetrics.selectedMetrics)
              .onChange(async (value) => {
                  this.plugin.settings.calendarMetrics.selectedMetrics = value;
                  await this.plugin.saveSettings();
                  // Refresh any open calendars
                  this.plugin.refreshDateNavigators();
              });
        });
}
```

#### DateNavigator.ts Changes
```typescript
private calculateDayMetrics(dateKey: string, entries: DreamMetricData[]): void {
    // ... existing initial setup code

    // Get settings for calendar metrics
    const calendarSettings = this.plugin.settings.calendarMetrics;
    const enabled = calendarSettings.enabled;
    const useAllMetrics = calendarSettings.useAllMetrics;
    const selectedMetrics = calendarSettings.selectedMetrics;

    // ... existing entry loop

    entries.forEach(entry => {
        if (entry.metrics) {
            for (const metricName in entry.metrics) {
                const metricValue = entry.metrics[metricName];
                
                // Only process numeric metrics that match our configuration
                if (typeof metricValue === 'number' && 
                    (useAllMetrics || selectedMetrics.includes(metricName)) &&
                    enabled) {
                    
                    // ... existing metric processing logic
                }
            }
        }
    });

    // ... rest of the method
}
```

### User Experience Benefits
- Allows users to specify which metrics are most important for calendar visualization
- Reduces visual clutter if users have many metrics but only want certain ones highlighted
- Consistent with plugin's existing user-configuration philosophy

## Additional Metric Additions ✅ **COMPLETED**

> **Status**: Implementation completed - the new metrics have been successfully added to the system.

Add these new metrics to the Settings as disabled-by-default:
1. "Clarity/Familiarity (1-5 score)" ✅ **IMPLEMENTED**
2. "Setting Familiarity (1-5 score)" ✅ **IMPLEMENTED**

This requires updates to:
- Default settings initialization ✅ **COMPLETED**
- Metrics registration in settings UI ✅ **COMPLETED**

## Implementation Timeline

### Phase 1 (Immediate)
- [x] Remove hardcoded metrics array
- [x] Implement adaptive metrics approach
- [x] Add normalization helper for different metric scales
- [x] Add improved debug logging
- [x] Test with existing entries

### Phase 2 (Next Release)
- [ ] Implement settings schema for configurable metrics
- [ ] Add settings UI components
- [ ] Update DateNavigator to respect settings
- [ ] Add refresh capability for calendar when settings change
- [ ] Document the new configuration options

### Phase 3 (Future)
- [ ] Add new metrics "Clarity/Familiarity" and enhance "Setting Familiarity"
- [ ] Create metrics category UI grouping for better organization
- [ ] Add visualization options (color schemes, icon preferences)
- [ ] Enable per-day detail view of metrics on calendar click 