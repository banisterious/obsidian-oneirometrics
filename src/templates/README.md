# Template System Module

This module provides components for managing dream journal templates, including creation, editing, and application of templates to journal entries.

## Module Structure

- **interfaces/** - Contains interfaces defining the module's API
  - `ITemplateManager` - Template management operations
  - `ITemplateProcessor` - Template processing and Templater integration
  
- **services/** - Contains implementations of the interfaces
  - `TemplateProcessor` - Handles template processing and Templater integration
  - `TemplateManager` - Manages template lifecycle (coming soon)
  
- **ui/** - Contains UI components for template interaction
  - `TemplateWizard` - Wizard for creating and editing templates (to be migrated)
  - `TemplateSelectionModal` - Modal for selecting templates (to be migrated)

- **types.ts** - Defines all template-related types

## Refactoring Approach

During refactoring, we're taking a gradual approach to extracting template functionality from the main plugin:

1. **Create New Types**: We've defined template-related types in `types.ts`
2. **Define Interfaces**: We've created interfaces to establish clear APIs
3. **Implement Core Services**: We're implementing services that follow these interfaces
4. **Migrate UI Components**: We'll migrate UI components in a way that preserves functionality
5. **Update Imports**: We'll update imports in all modules that use template functionality
6. **Remove Duplicated Code**: Finally, we'll remove duplicated code from the original locations

### Type Management Strategy

**Problem**: Some types are currently defined in both `src/journal_check/types.ts` and `src/templates/types.ts`.

**Short-term Strategy**: During refactoring, we allow this duplication to enable incremental changes.

**Long-term Solution**: 
- Use `src/templates/types.ts` as the single source of truth for all template-related types
- Gradually migrate imports to reference the new location
- Eventually remove duplicate definitions from the original file

## Usage Examples

### Processing a Template

```typescript
import { TemplateProcessor } from 'src/templates/services';
import { JournalTemplate } from 'src/templates/types';

// Create the processor
const processor = new TemplateProcessor(app, plugin);

// Example template
const template: JournalTemplate = {
  id: 'example-template',
  name: 'Example Template',
  description: 'An example template',
  structure: 'default-structure',
  content: '# Dream Journal\n\nDate: <% tp.date.now("YYYY-MM-DD") %>\n\n[!dream]\n',
  isTemplaterTemplate: true
};

// Process the template
const processedContent = await processor.processTemplate(template);
```

### Working with Templater

```typescript
import { TemplateProcessor } from 'src/templates/services';

// Create the processor
const processor = new TemplateProcessor(app, plugin);

// Check if Templater is available
if (processor.isTemplaterAvailable()) {
  // Get available Templater templates
  const templates = processor.getTemplaterFiles();
  
  // Generate both dynamic and static versions of a template
  const { content, staticContent } = processor.generateTemplateVersions(templates[0]);
  
  // Extract variables from a template
  const variables = processor.extractTemplateVariables(content);
  
  // Log the variables
  console.log('Template variables:', variables);
}
``` 