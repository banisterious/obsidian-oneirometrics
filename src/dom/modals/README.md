# Modal Components

This directory contains the modal components for the OneiroMetrics plugin. These modals are designed to be reusable and consistent across the application.

## Architecture

The modal components follow a hierarchical structure:

```
IModal (Interface)
├── BaseModal (Abstract Class)
│   ├── ConfirmModal
│   ├── NotificationModal
│   ├── FormModal
│   └── Other specific modals...
```

## Core Components

- **ModalInterfaces.ts**: Contains interfaces that define the contract for modal components
- **BaseModal.ts**: Abstract base class implementing common modal functionality 
- **ConfirmModal.ts**: Modal for confirmation dialogs
- **index.ts**: Exports all modal components for easy importing

## Usage Examples

### Basic Confirmation Modal

```typescript
import { ConfirmModal } from 'src/dom/modals';

// Using callback approach
const modal = new ConfirmModal(this.app, 'Confirm Action', 'Are you sure you want to proceed?');
modal.onConfirm(() => {
  console.log('User confirmed the action');
  performAction();
});
modal.onCancel(() => {
  console.log('User canceled the action');
});
modal.open();

// Using Promise-based approach
async function confirmAndProceed() {
  const modal = new ConfirmModal(this.app, 'Confirm Action', 'Are you sure you want to proceed?');
  const confirmed = await modal.waitForConfirmation();
  
  if (confirmed) {
    console.log('User confirmed the action');
    performAction();
  } else {
    console.log('User canceled the action');
  }
}
```

### Creating a Custom Modal

To create a custom modal, extend the BaseModal class:

```typescript
import { App } from 'obsidian';
import { BaseModal } from 'src/dom/modals';

export class CustomModal extends BaseModal {
  constructor(app: App) {
    super(app, {
      title: 'Custom Modal',
      className: 'oom-custom-modal',
      width: 500
    });
  }
  
  open(): void {
    super.open();
    
    // Add your custom content
    this.contentEl.createEl('h2', { text: 'Custom Content' });
    this.contentEl.createEl('p', { text: 'This is a custom modal.' });
    
    // Add buttons
    const buttonContainer = this.createButtonContainer();
    this.createButton(buttonContainer, 'Close', () => this.close());
  }
}
```

## Best Practices

1. **Always extend BaseModal** for new modal components
2. **Implement appropriate interfaces** based on the modal's functionality
3. **Use proper CSS classes** to ensure consistent styling
4. **Follow the interface contracts** to ensure compatibility
5. **Provide both callback and Promise-based APIs** where appropriate
6. **Clean up resources** in the `onClose` method

## Style Guidelines

Modal components use CSS classes that are defined in the main `styles.css` file following the project's CSS organization pattern:

- `oom-modal`: Base class for all modals
- `oom-confirm-modal`: Class for confirmation modals
- `oom-modal-button-container`: Container for modal buttons

For additional styling, add your component-specific classes to the `className` option in the constructor and then define those styles in the main `styles.css` file under the appropriate section. 