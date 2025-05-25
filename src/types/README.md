# OneiroMetrics Type System

This directory contains the consolidated type definitions for the OneiroMetrics plugin. This is part of the Phase 1: Code Cleanup in the Post-Refactoring Roadmap.

## Organization

The type system is organized into domain-specific modules:

- `core.ts` - Core plugin types like settings, metrics, etc.
- `logging.ts` - Logging-specific types
- `journal-check.ts` - Journal structure check (formerly "linting") specific types
- `index.ts` - Exports all types from a single entry point

## Migration Plan

The goal is to transition all type imports to use the new centralized type system:

1. **Phase 1: Introduction (Current)**
   - Set up the new type structure
   - Create bridge files for backward compatibility
   - Add deprecation warnings

2. **Phase 2: Migration**
   - Update imports throughout the codebase
   - Replace old-style imports with new ones
   - Fix any type compatibility issues

3. **Phase 3: Removal**
   - Remove legacy type files
   - Remove bridge files
   - Finalize the migration

## Usage Guidelines

### Preferred Import Style

```typescript
// Import types from the central types module
import { DreamMetric, LogLevel, JournalStructureSettings } from '../types';
```

### Deprecated Import Styles (Avoid These)

```typescript
// DEPRECATED: Don't import from the root types.ts
import { DreamMetric } from '../../types';

// DEPRECATED: Don't import from src/types.ts 
import { LogLevel } from '../types';

// DEPRECATED: Don't import from domain-specific types modules
import { JournalStructureSettings } from '../journal_check/types';
```

## Architecture

The type system follows these architectural principles:

1. **Single Source of Truth**: All types are defined in one location
2. **Domain Separation**: Types are organized by domain
3. **Unified Access**: All types are exported from a single entry point
4. **Backward Compatibility**: Bridge files ensure smooth migration

## Future Enhancements

In Phase 2 (Performance Optimization) and Phase 3 (Documentation Enhancement) of the Post-Refactoring Roadmap, we plan to:

1. Further refine type definitions
2. Add more comprehensive JSDoc comments
3. Create architecture diagrams reflecting the type system
4. Possibly split into more domain-specific modules as needed 