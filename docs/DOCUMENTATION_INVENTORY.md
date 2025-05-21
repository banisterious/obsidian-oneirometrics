# OneiroMetrics Documentation Inventory

This inventory tracks all documentation files in the OneiroMetrics project, organized according to the documentation reorganization plan. This helps track the status of each document during the migration process.

## Migration Status Legend

- ✅ **Migrated**: Document has been successfully migrated to the new structure
- 🔄 **In Progress**: Migration is in progress
- ⏳ **Pending**: Migration not yet started
- 📁 **Archived**: Original document archived in legacy folder
- 🆕 **New**: New document created as part of the reorganization

## Core Documentation

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| README.md | (Root) | ✅ | Updated with new links |
| DOCUMENTATION_REORGANIZATION_PLAN.md | docs/DOCUMENTATION_REORGANIZATION_PLAN.md | ✅ | Kept in original location as reference |
| DOCUMENTATION_STYLE_GUIDE.md | docs/assets/templates/documentation-style-guide.md | ✅ | Migrated and archived |
| USAGE.md | docs/user/guides/usage.md | ✅ | Migrated and archived |
| SPECIFICATION.md | docs/developer/architecture/specification.md | ✅ | Migrated and archived |
| PROJECT_OVERVIEW.md | docs/developer/architecture/overview.md | ✅ | Migrated and archived |
| TESTING.md | docs/developer/testing/testing-overview.md | ✅ | Migrated and archived |
| ROADMAP.md | docs/planning/roadmap.md | ✅ | Migrated and archived |

## Developer Documentation

### Architecture

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| PROJECT_OVERVIEW.md | docs/developer/architecture/overview.md | ✅ | Migrated and archived |
| SPECIFICATION.md | docs/developer/architecture/specification.md | ✅ | Migrated and archived |

### Implementation

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| DATE_TIME_TECHNICAL.md | docs/developer/implementation/date-time.md | ✅ | Migrated and archived |
| ICON_PICKER_TECHNICAL_IMPLEMENTATION.md | docs/developer/implementation/icon-picker.md | ✅ | Migrated and archived |
| CSV_EXPORT_TECHNICAL_IMPLEMENTATION.md | docs/developer/implementation/csv-export.md | ✅ | Migrated and archived |
| LOGGING.md | docs/developer/implementation/logging.md | ✅ | Migrated and archived |
| STATE_PERSISTENCE.md | docs/developer/implementation/state.md | ✅ | Migrated and archived |

### Testing

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| TESTING.md | docs/developer/testing/testing-overview.md | ✅ | Migrated and archived |
| PERFORMANCE_TESTING.md | docs/developer/testing/performance-testing.md | ✅ | Migrated and archived |
| UI_TESTING.md | docs/developer/testing/ui-testing.md | ✅ | Migrated and archived |
| ACCESSIBILITY_TESTING.md | docs/developer/testing/accessibility-testing.md | ✅ | Migrated and archived |

### Contributing

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| (New) | docs/developer/contributing/code-standards.md | 🆕 | Created as part of reorganization |

## Planning Documentation

### Features

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| ROADMAP.md | docs/planning/roadmap.md | ✅ | Migrated and archived |
| VIRTUALIZATION_PLAN.md | docs/planning/features/virtualization.md | ✅ | Migrated and archived |
| TEMPLATER_INTEGRATION_PLAN.md | docs/planning/features/templater-integration.md | ✅ | Migrated and archived |
| DREAM_JOURNAL_MANAGER_PLAN.md | docs/planning/features/dream-journal-manager.md | ✅ | Migrated and archived |
| METRICS_ENHANCEMENTS_PLAN.md | docs/planning/features/metrics-enhancements.md | ✅ | Migrated and archived |
| JOURNAL_STRUCTURE_CHECK_IMPLEMENTATION_PLAN.md | docs/planning/features/journal-structure-check.md | ✅ | Migrated |
| (New) | docs/planning/features/date-tools.md | 🆕 | Created as part of reorganization |

### Documentation

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| SCREENSHOT_PLAN.md | docs/planning/documentation/screenshot-plan.md | ✅ | Migrated and archived |

### Tasks

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| TODO_NPM_UPGRADE.md | docs/planning/tasks/npm-upgrade.md | ✅ | Migrated and archived |

## User Documentation

### Concepts

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| (Pending) | docs/user/concepts/ | ⏳ | Directory created, content pending |

### Guides

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| USAGE.md | docs/user/guides/usage.md | ✅ | Migrated and archived |
| JOURNAL_STRUCTURE_GUIDELINES.md | docs/user/guides/journal-structure.md | ✅ | Migrated and archived |
| TEMPLATER_INTEGRATION.md | docs/user/guides/templater.md | ✅ | Migrated and archived |
| VIEW_MODE.md | docs/user/guides/view-mode.md | ✅ | Migrated and archived |

### Reference

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| METRICS_DESCRIPTIONS.md | docs/user/reference/metrics.md | ✅ | Migrated and deleted |

## Templates

| Original File | New Location | Status | Notes |
|---------------|--------------|--------|-------|
| DOCUMENTATION_STYLE_GUIDE.md | docs/assets/templates/documentation-style-guide.md | ✅ | Migrated and archived |
| (New) | docs/assets/templates/feature-plan-template.md | 🆕 | Created as part of reorganization |
| (New) | docs/assets/templates/technical-doc-template.md | 🆕 | Created as part of reorganization |
| (New) | docs/assets/templates/user-guide-template.md | 🆕 | Created as part of reorganization |

## Archived Documentation

All migrated documents have been archived in `docs/archive/legacy/` as part of Phase 3 (Consolidation).

## Next Steps

1. ✅ Complete migration of remaining documents in original location (those marked 🔄)
2. ✅ Update all cross-references to use new file paths
3. Create any missing documents according to the reorganization plan
4. Final verification that all links work properly
5. Consider deleting archived documents in a future phase after thorough testing 