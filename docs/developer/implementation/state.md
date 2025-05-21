# OneiroMetrics State Persistence

## Overview
The OneiroMetrics plugin implements state persistence to maintain user preferences across sessions. This includes expanded/collapsed states for dream content, ensuring a consistent user experience.

## Features

### Content Expansion State
- Persists which dream entries are expanded/collapsed
- Maintains state across plugin restarts
- Efficiently stores state using unique content IDs
- Automatically restores state when content is loaded

### State Storage
- States are stored in plugin settings
- Uses efficient Set data structure for lookups
- Converts to array for storage
- Includes debounced saving to prevent performance impact

## Implementation Details

### Content Identification
Each content section is uniquely identified using:
```typescript
const contentId = `${date}-${title}`.replace(/[^a-zA-Z0-9-]/g, '');
```

### State Management
```typescript
// Store expanded states
private expandedStates: Set<string> = new Set();

// Save states to settings
this.settings.expandedStates = Array.from(this.expandedStates);

// Load states from settings
if (this.settings.expandedStates) {
    this.expandedStates = new Set(this.settings.expandedStates);
}
```

### State Updates
```typescript
// Add state
this.expandedStates.add(contentId);

// Remove state
this.expandedStates.delete(contentId);

// Check state
const wasExpanded = this.expandedStates.has(contentId);
```

## Performance Considerations

### Debounced Saving
- State changes are debounced (500ms delay)
- Prevents excessive settings saves
- Maintains responsiveness

### Efficient Storage
- Uses Set for O(1) lookups
- Converts to array only for storage
- Minimal memory footprint

## Logging
State persistence operations are logged for debugging:
```typescript
logger.debug('UI', `Loaded ${expandedStates.size} expanded states`);
logger.debug('UI', `Saved ${expandedStates.size} expanded states`);
```

## Best Practices
1. Use unique, stable identifiers for content
2. Implement proper cleanup on plugin unload
3. Handle missing or invalid states gracefully
4. Log state changes for debugging
5. Use debouncing for performance

## Future Improvements
- Add state compression for large datasets
- Implement state versioning
- Add state migration capabilities
- Add state validation
- Add state backup/restore functionality

## Related Documentation
- [Architecture Overview](../architecture/overview.md)
- [Logging](logging.md)
- [Usage Guide](../../user/guides/usage.md) 