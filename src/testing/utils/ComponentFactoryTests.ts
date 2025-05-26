/**
 * Tests for the ComponentFactory module
 * 
 * These tests verify that the component creation functions correctly
 * instantiate and configure UI components.
 */

import { TestRunner } from '../TestRunner';
import { 
  createComponent,
  createComponentFromLegacy,
  createEventableComponent,
  createComponentFromElement,
  createUIComponent
} from '../../templates/ui/ComponentFactory';
import { BaseComponent, EventableComponent } from '../../templates/ui/BaseComponent';

/**
 * Register tests for the ComponentFactory module
 * @param testRunner The test runner to register tests with
 */
export function registerComponentFactoryTests(
  testRunner: TestRunner
): void {
  // Test: createComponent should instantiate a component
  testRunner.addTest(
    'ComponentFactory - createComponent creates a properly configured BaseComponent',
    async () => {
      // Create a component
      const component = createComponent(BaseComponent, { 
        id: 'test-component',
        className: 'test-class'
      });
      
      // Verify properties
      const hasId = component['id'] === 'test-component';
      const hasClass = component['className'] === 'test-class';
      const hasContainer = component['container'] instanceof HTMLElement;
      
      return hasId && hasClass && hasContainer;
    }
  );

  // Test: createComponentFromLegacy should properly merge components
  testRunner.addTest(
    'ComponentFactory - createComponentFromLegacy merges legacy and base components',
    async () => {
      // Create a mock legacy component constructor
      const legacyConstructor = (container: HTMLElement, value: string) => {
        return {
          container,
          value,
          customMethod() { return value; }
        };
      };
      
      // Create a component using the legacy constructor
      const component = createComponentFromLegacy(legacyConstructor, {
        id: 'legacy-component',
        className: 'legacy-class',
        value: 'test-value'
      });
      
      // For debugging
      console.log('Test component:', {
        id: component['id'],
        className: component['className'],
        value: component['value'],
        hasMethod: typeof component['customMethod'],
        container: !!component['container']
      });
      
      // Verify properties from both components exist
      const hasId = component['id'] === 'legacy-component';
      const hasClass = component['className'] === 'legacy-class';
      const hasValue = component['value'] === 'test-value';
      const hasMethod = typeof component['customMethod'] === 'function';
      const methodWorks = component['customMethod']() === 'test-value';
      
      return hasId && hasClass && hasValue && hasMethod && methodWorks;
    }
  );

  // Test: createEventableComponent should create an EventableComponent
  testRunner.addTest(
    'ComponentFactory - createEventableComponent creates a component with event handling',
    async () => {
      // Create an EventableComponent
      const component = createEventableComponent({
        id: 'event-component',
        className: 'event-class'
      });
      
      // Verify it has event handling methods
      const hasOn = typeof component.on === 'function';
      const hasOff = typeof component.off === 'function';
      const hasTrigger = typeof component.trigger === 'function';
      
      // Test event handling
      let eventCalled = false;
      component.on('test', () => { eventCalled = true; });
      component.trigger('test');
      
      return hasOn && hasOff && hasTrigger && eventCalled;
    }
  );

  // Test: createComponentFromElement should wrap an existing element
  testRunner.addTest(
    'ComponentFactory - createComponentFromElement wraps an existing element',
    async () => {
      // Create a test element
      const element = document.createElement('div');
      element.id = 'existing-element';
      document.body.appendChild(element);
      
      // Wrap the element
      const component = createComponentFromElement(element, 'wrapped-class');
      
      // Verify the component uses the existing element
      const usesElement = component['container'] === element;
      const hasClass = element.classList.contains('wrapped-class');
      
      // Clean up
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      return usesElement && hasClass;
    }
  );

  // Test: createUIComponent should create a component with the specified tag
  testRunner.addTest(
    'ComponentFactory - createUIComponent creates a component with the specified element',
    async () => {
      // Create a UI component with a button
      const component = createUIComponent('button', {
        id: 'button-component',
        className: 'button-class'
      }, 'Click me');
      
      // Verify the component contains a button
      const button = component['container'].querySelector('button');
      const hasButton = button instanceof HTMLButtonElement;
      const hasText = button?.textContent === 'Click me';
      
      return hasButton && hasText;
    }
  );
}

/**
 * Run tests for the ComponentFactory module
 */
export async function runComponentFactoryTests(): Promise<void> {
  const testRunner = new TestRunner();
  registerComponentFactoryTests(testRunner);
  await testRunner.runTests();
}

// Allow direct execution of tests
if (require.main === module) {
  runComponentFactoryTests();
} 