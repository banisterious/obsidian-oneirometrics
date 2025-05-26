# New Metrics Implementation Plan

## New Metrics to Add

1. **Clarity/Familiarity (1-5 score)** - A measure of how familiar or clear the dream environment/setting felt
2. **Setting Familiarity (1-5 score)** - A measure of how familiar the physical setting/location was

## Implementation Steps

### Step 1: Add Metrics to DEFAULT_METRICS

Location: `src/types/core.ts`

```typescript
// Add these new metrics to the DEFAULT_METRICS array:
{
    name: "Clarity/Familiarity",
    description: "How familiar or clear the dream environment felt",
    icon: "compass",
    minValue: 1,
    maxValue: 5,
    enabled: false,
    category: "dream",
    type: "number",
    format: "number"
},
{
    name: "Setting Familiarity",
    description: "How familiar the physical setting/location was",
    icon: "map-pin",
    minValue: 1,
    maxValue: 5,
    enabled: false,
    category: "dream",
    type: "number",
    format: "number"
}
```

Note: We already have a "Setting Familiarity" metric in the defaults, so we'll only need to add the "Clarity/Familiarity" metric, while renaming the existing one to be more specific if needed.

### Step 2: Add Migration Code

Location: `main.ts` (in the `loadSettings` method)

```typescript
// Check for the new metrics and add them if they don't exist
const newMetricsToAdd = [
    {
        name: "Clarity/Familiarity",
        description: "How familiar or clear the dream environment felt",
        icon: "compass",
        minValue: 1,
        maxValue: 5,
        enabled: false,
        category: "dream",
        type: "number",
        format: "number"
    }
];

// Add any missing new metrics
newMetricsToAdd.forEach(newMetric => {
    if (!this.settings.metrics[newMetric.name]) {
        // Add the missing metric with default values
        this.settings.metrics[newMetric.name] = {
            name: newMetric.name,
            icon: newMetric.icon,
            minValue: newMetric.minValue,
            maxValue: newMetric.maxValue,
            description: newMetric.description || '',
            enabled: newMetric.enabled,
            category: newMetric.category || 'dream',
            type: newMetric.type || 'number',
            format: newMetric.format || 'number',
            options: newMetric.options || [],
            // Include legacy properties for backward compatibility
            min: newMetric.minValue,
            max: newMetric.maxValue,
            step: 1
        };
    }
});
```

### Step 3: Update Documentation

Location: `docs/user/concepts/dream-metrics.md`

Add the new metrics to the appropriate section:

```markdown
### Memory and Awareness
- **Dream Recall (1-5)**: Overall completeness of your memory of the dream
- **Lost Segments (Number)**: Number of times you felt parts of the dream were forgotten
- **Confidence Score (1-5)**: How confident you are in your recollection
- **Clarity/Familiarity (1-5)**: How familiar or clear the dream environment felt

### Setting and Environment
- **Setting Familiarity (1-5)**: How familiar the physical settings/locations were from waking life
```

### Step 4: Testing

1. **Settings Test**:
   - Load the plugin and verify the new metrics appear in settings
   - Toggle them on/off and verify the setting persists

2. **Migration Test**:
   - Delete the metrics from settings (if possible) and reload
   - Verify they are properly re-added

3. **Usage Test**:
   - Create a test dream entry with the new metrics
   - Verify they display correctly in the metrics view
   - Verify the calendar visualization includes them when enabled

## Implementation Risks and Mitigations

### Risk: Settings Corruption
**Mitigation**: Use try/catch blocks in the settings loading code and add a fallback mechanism.

### Risk: Breaking Existing Metrics
**Mitigation**: Thoroughly test with existing data before releasing. Implement backup/restore functionality.

### Risk: Processing Pipeline Issues 
**Mitigation**: Make metrics optional and implement proper null checks.

## Rollback Plan

If issues are detected:

1. Create an emergency update that:
   - Disables the new metrics by default
   - Adds a feature flag to completely disable them
   - Provides a setting to hide them from the UI

2. Communication plan:
   - Add a notice in the plugin UI about the issue
   - Update documentation with workarounds 