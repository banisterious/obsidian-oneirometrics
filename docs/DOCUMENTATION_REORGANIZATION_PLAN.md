# Documentation Reorganization Plan

## Executive Summary

This document outlines a plan to reorganize the OneiroMetrics documentation directory to improve organization, discoverability, and maintainability. With 28+ documents currently in the root docs directory, a more structured approach will help both users and developers find relevant information more efficiently.

## Table of Contents

- [1. Current State Assessment](#1-current-state-assessment)
- [2. Reorganization Goals](#2-reorganization-goals)
- [3. Proposed Directory Structure](#3-proposed-directory-structure)
- [4. Document Categorization](#4-document-categorization)
- [5. Implementation Process](#5-implementation-process)
- [6. Documentation Index](#6-documentation-index)
- [7. Style Guide Updates](#7-style-guide-updates)
- [8. Timeline](#8-timeline)

## 1. Current State Assessment

### Current Structure
- 28+ documentation files in the root `docs/` directory
- Additional files in `docs/archive/` for historical reference
- `docs/images/` directory for visual assets
- No clear categorization or hierarchy
- Mixed audience documents (users, developers, testers)
- Inconsistent naming conventions
- Varying document formats and structures

### Key Issues
- Difficult to find specific information
- No clear entry points for different user types
- Related documents scattered across the directory
- Maintenance burden when updating cross-referenced information
- Onboarding friction for new contributors
- Limited scalability as documentation continues to grow

## 2. Reorganization Goals

1. **Improve Discoverability**:
   - Clear categorization for different document types
   - Logical hierarchical structure
   - Consistent naming conventions
   - Central index for navigation

2. **Enhance Maintainability**:
   - Group related documents together
   - Reduce duplication through consolidation
   - Establish clear ownership for document sections
   - Simplify update processes

3. **Support Different Audiences**:
   - Separate user-facing vs developer documentation
   - Clear paths for different information needs
   - Appropriate detail levels for target audiences

4. **Future-Proof Organization**:
   - Scalable structure for continued growth
   - Adaptable to evolving product features
   - Compatible with potential documentation tools

## 3. Proposed Directory Structure

```
docs/
├── user/                           # End-user documentation
│   ├── guides/                     # How-to guides
│   │   ├── getting-started.md
│   │   ├── dream-journal.md
│   │   ├── metrics.md
│   │   └── templates.md
│   ├── concepts/                   # Conceptual explanations
│   │   ├── dream-metrics.md
│   │   ├── journal-structure.md
│   │   └── templating.md
│   └── reference/                  # Reference materials
│       ├── settings.md
│       ├── commands.md
│       └── troubleshooting.md
│
├── developer/                      # Developer documentation
│   ├── architecture/               # System architecture
│   │   ├── overview.md
│   │   ├── state-management.md
│   │   └── ui-framework.md
│   ├── implementation/             # Implementation details
│   │   ├── metrics-system.md
│   │   ├── journal-check.md
│   │   ├── template-system.md
│   │   └── date-time.md
│   ├── testing/                    # Testing guidance
│   │   ├── unit-testing.md
│   │   ├── integration-testing.md
│   │   ├── performance-testing.md
│   │   └── accessibility-testing.md
│   └── contributing/               # Contribution guides
│       ├── setup.md
│       ├── code-standards.md
│       └── pull-requests.md
│
├── planning/                       # Active planning documents
│   ├── roadmap.md
│   ├── milestones.md
│   └── features/                   # Feature planning
│       ├── upcoming-features.md
│       └── feature-requirements/
│           └── [feature-name].md
│
├── assets/                         # Documentation assets
│   ├── images/                     # Screenshots and diagrams
│   │   ├── ui/
│   │   ├── workflows/
│   │   └── concepts/
│   └── templates/                  # Document templates
│       ├── feature-spec.md
│       ├── user-guide.md
│       └── api-reference.md
│
├── archive/                        # Historical documents
│   ├── specs/                      # Archived specifications
│   ├── plans/                      # Archived plans
│   └── legacy/                     # Legacy documentation
│
└── README.md                       # Documentation home/index
```

## 4. Document Categorization

### User Documentation
| Current Document | New Location | Notes |
|------------------|--------------|-------|
| USAGE.md | user/guides/usage.md | Expand with clearer section structure |
| VIEW_MODE.md | user/guides/view-mode.md | |
| METRICS_DESCRIPTIONS.md | user/reference/metrics.md | |
| TEMPLATER_INTEGRATION.md | user/guides/templater.md | Focus on user-facing aspects |

### Developer Documentation
| Current Document | New Location | Notes |
|------------------|--------------|-------|
| PROJECT_OVERVIEW.md | developer/architecture/overview.md | |
| SPECIFICATION.md | developer/architecture/specification.md | |
| STATE_PERSISTENCE.md | developer/implementation/state.md | |
| JOURNAL_STRUCTURE_GUIDELINES.md | developer/implementation/journal-structure.md | |
| LOGGING.md | developer/implementation/logging.md | |
| DATE_TIME_TECHNICAL.md | developer/implementation/date-time.md | |
| ICON_PICKER_TECHNICAL_IMPLEMENTATION.md | developer/implementation/icon-picker.md | |
| CSV_EXPORT_TECHNICAL_IMPLEMENTATION.md | developer/implementation/csv-export.md | |

### Testing Documentation
| Current Document | New Location | Notes |
|------------------|--------------|-------|
| TESTING.md | developer/testing/testing-overview.md | Split into multiple focused docs |
| PERFORMANCE_TESTING.md | developer/testing/performance-testing.md | |
| UI_TESTING.md | developer/testing/ui-testing.md | |
| ACCESSIBILITY_TESTING.md | developer/testing/accessibility-testing.md | |

### Planning Documents
| Current Document | New Location | Notes |
|------------------|--------------|-------|
| ROADMAP.md | planning/roadmap.md | |
| DREAM_JOURNAL_MANAGER_PLAN.md | planning/features/dream-journal-manager.md | |
| JOURNAL_STRUCTURE_CHECK_IMPLEMENTATION_PLAN.md | planning/features/journal-structure-check.md | Consider archiving if fully implemented |
| METRICS_ENHANCEMENTS_PLAN.md | planning/features/metrics-enhancements.md | |
| DATE_TOOLS_PLAN.md | planning/features/date-tools.md | |
| TEMPLATER_INTEGRATION_PLAN.md | planning/features/templater-integration.md | |
| VIRTUALIZATION_PLAN.md | planning/features/virtualization.md | |
| TODO_NPM_UPGRADE.md | planning/tasks/npm-upgrade.md | |
| SCREENSHOT_PLAN.md | planning/documentation/screenshot-plan.md | |

### Documentation Process Documents
| Current Document | New Location | Notes |
|------------------|--------------|-------|
| DOCUMENTATION_STYLE_GUIDE.md | assets/templates/documentation-style-guide.md | |

## 5. Implementation Process

### Phase 1: Preparation
1. Create the new directory structure
2. Update the documentation style guide to reflect new organization
3. Create document templates for different document types
4. Create a documentation index (README.md)

### Phase 2: Migration
1. Move high-priority documents first (user guides, key reference materials)
2. Update internal links and references in each document
3. Validate document formatting and compliance with style guide
4. Ensure proper cross-referencing between documents

### Phase 3: Consolidation
1. Identify overlapping or related documents for potential consolidation
2. Merge related smaller documents into comprehensive guides
3. Archive obsolete or superseded documentation
4. Validate all remaining documents against style guide

### Phase 4: Finalization
1. Update project references to documentation
2. Create redirects if necessary for external links
3. Review and test all documentation navigation
4. Communicate changes to team members and users

## 6. Documentation Index

The following template will be used to create a comprehensive index at `docs/README.md`:

```markdown
# OneiroMetrics Documentation

Welcome to the OneiroMetrics documentation. This index will help you find the information you need.

## For Users

- **Getting Started**
  - [Installation and Setup](user/guides/getting-started.md)
  - [Basic Usage](user/guides/usage.md)
  - [View Mode Requirements](user/guides/view-mode.md)

- **Features**
  - [Dream Journal Manager](user/guides/dream-journal.md)
  - [Dream Metrics](user/guides/metrics.md)
  - [Journal Structure](user/guides/journal-structure.md)
  - [Templater Integration](user/guides/templater.md)

- **Reference**
  - [Metrics Reference](user/reference/metrics.md)
  - [Settings Reference](user/reference/settings.md)
  - [Troubleshooting](user/reference/troubleshooting.md)

## For Developers

- **Architecture**
  - [System Overview](developer/architecture/overview.md)
  - [State Management](developer/architecture/state-management.md)
  - [UI Framework](developer/architecture/ui-framework.md)

- **Implementation**
  - [Metrics System](developer/implementation/metrics-system.md)
  - [Journal Check](developer/implementation/journal-check.md)
  - [Date/Time Handling](developer/implementation/date-time.md)

- **Testing**
  - [Testing Overview](developer/testing/testing-overview.md)
  - [Performance Testing](developer/testing/performance-testing.md)
  - [Accessibility Testing](developer/testing/accessibility-testing.md)

- **Contributing**
  - [Developer Setup](developer/contributing/setup.md)
  - [Code Standards](developer/contributing/code-standards.md)
  - [Pull Request Process](developer/contributing/pull-requests.md)

## Planning & Roadmap

- [Project Roadmap](planning/roadmap.md)
- [Upcoming Features](planning/features/upcoming-features.md)
- [Milestones](planning/milestones.md)

## Documentation Resources

- [Documentation Style Guide](assets/templates/documentation-style-guide.md)
- [Document Templates](assets/templates/)
```

## 7. Style Guide Updates

The following additions will be made to the DOCUMENTATION_STYLE_GUIDE.md:

1. **Directory Structure Guidelines**
   - Rules for document placement
   - When to create new directories
   - Guidelines for maintaining the structure

2. **Document Naming Conventions**
   - Naming patterns for different document types
   - Case conventions (kebab-case for files)
   - Prefix/suffix meanings

3. **Cross-Reference Standards**
   - How to link to other documents (relative paths)
   - Anchor link formatting
   - External vs internal link styles

4. **Document Type Templates**
   - Standard formats for user guides
   - Standard formats for reference documents
   - Standard formats for technical specifications

## 8. Timeline

| Phase | Tasks | Timeframe |
|-------|-------|-----------|
| Preparation | Create directory structure<br>Update style guide<br>Create templates<br>Create index | Week 1-2 |
| Migration | Move user documentation<br>Move developer documentation<br>Move testing documentation<br>Update internal references | Week 3-4 |
| Consolidation | Identify documents for consolidation<br>Merge related documents<br>Archive obsolete docs<br>Validate against style guide | Week 5-6 |
| Finalization | Update project references<br>Test documentation navigation<br>Communicate changes<br>Initial maintenance | Week 7-8 |

## Next Steps

1. Review this reorganization plan with the team
2. Prioritize documents for initial migration
3. Update the documentation style guide
4. Create the new directory structure
5. Begin implementation process 