/**
 * Tests for the EventHandling module
 * 
 * These tests verify that the event handling functions correctly
 * handle event typing and conversion between different formats.
 */

import { TestRunner } from '../TestRunner';
import { 
  createEventHandler, 
  createClickHandler,
  createKeyboardHandler,
  attachEvent,
  attachClickEvent,
  adaptEventHandler,
  adaptClickHandler,
  debounceEventHandler,
  throttleEventHandler,
  convertEventHandlers
} from '../../templates/ui/EventHandling';

/**
 * Register tests for the EventHandling module
 * @param testRunner The test runner to register tests with
 */
export function registerEventHandlingTests(
  testRunner: TestRunner
): void {
  // Test: createEventHandler preserves the handler function
  testRunner.addTest(
    'EventHandling - createEventHandler should preserve handler functionality',
    async () => {
      let handlerCalled = false;
      const originalHandler = (e: Event) => { handlerCalled = true; };
      const adaptedHandler = createEventHandler(originalHandler);
      
      // Create mock event
      const mockEvent = new Event('test');
      
      // Call the adapted handler
      adaptedHandler(mockEvent);
      
      return handlerCalled;
    }
  );
  
  // Test: createClickHandler preserves the handler function
  testRunner.addTest(
    'EventHandling - createClickHandler should preserve handler functionality',
    async () => {
      let clickX = 0;
      const originalHandler = (e: MouseEvent) => { clickX = e.clientX; };
      const adaptedHandler = createClickHandler(originalHandler);
      
      // Create mock mouse event
      const mockEvent = new MouseEvent('click', { clientX: 100 });
      
      // Call the adapted handler
      adaptedHandler(mockEvent);
      
      return clickX === 100;
    }
  );
  
  // Test: createKeyboardHandler preserves the handler function
  testRunner.addTest(
    'EventHandling - createKeyboardHandler should preserve handler functionality',
    async () => {
      let keyCode = '';
      const originalHandler = (e: KeyboardEvent) => { keyCode = e.code; };
      const adaptedHandler = createKeyboardHandler(originalHandler);
      
      // Create mock keyboard event
      const mockEvent = new KeyboardEvent('keydown', { code: 'Enter' });
      
      // Call the adapted handler
      adaptedHandler(mockEvent);
      
      return keyCode === 'Enter';
    }
  );
  
  // Test: adaptEventHandler is compatible with legacy code
  testRunner.addTest(
    'EventHandling - adaptEventHandler should be compatible with legacy code',
    async () => {
      let handlerCalled = false;
      
      // Legacy style handler function
      function legacyHandler(e: Event) {
        handlerCalled = true;
      }
      
      const adaptedHandler = adaptEventHandler(legacyHandler);
      
      // Create mock event
      const mockEvent = new Event('test');
      
      // Call the adapted handler
      adaptedHandler(mockEvent);
      
      return handlerCalled;
    }
  );
  
  // Test: adaptClickHandler is compatible with legacy code
  testRunner.addTest(
    'EventHandling - adaptClickHandler should be compatible with legacy code',
    async () => {
      let clickX = 0;
      
      // Legacy style handler function
      function legacyClickHandler(e: MouseEvent) {
        clickX = e.clientX;
      }
      
      const adaptedHandler = adaptClickHandler(legacyClickHandler);
      
      // Create mock mouse event
      const mockEvent = new MouseEvent('click', { clientX: 100 });
      
      // Call the adapted handler
      adaptedHandler(mockEvent);
      
      return clickX === 100;
    }
  );
  
  // Test: debounceEventHandler should debounce calls
  testRunner.addTest(
    'EventHandling - debounceEventHandler should debounce multiple calls',
    async () => {
      let callCount = 0;
      const originalHandler = (e: Event) => { callCount++; };
      const debouncedHandler = debounceEventHandler(originalHandler, 50);
      
      // Create mock event
      const mockEvent = new Event('test');
      
      // Call multiple times in quick succession
      debouncedHandler(mockEvent);
      debouncedHandler(mockEvent);
      debouncedHandler(mockEvent);
      
      // Should be 0 immediately
      const initialCount = callCount;
      
      // Wait for debounce timeout
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be 1 after timeout
      const finalCount = callCount;
      
      return initialCount === 0 && finalCount === 1;
    }
  );
  
  // Test: throttleEventHandler should throttle calls
  testRunner.addTest(
    'EventHandling - throttleEventHandler should throttle multiple calls',
    async () => {
      let callCount = 0;
      const originalHandler = (e: Event) => { callCount++; };
      const throttledHandler = throttleEventHandler(originalHandler, 50);
      
      // Create mock event
      const mockEvent = new Event('test');
      
      // First call should execute immediately
      throttledHandler(mockEvent);
      const firstCount = callCount;
      
      // Second call should be throttled
      throttledHandler(mockEvent);
      const secondCount = callCount;
      
      // Wait for throttle timeout
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Third call should execute after timeout
      throttledHandler(mockEvent);
      const thirdCount = callCount;
      
      return firstCount === 1 && secondCount === 1 && thirdCount === 2;
    }
  );
  
  // Test: convertEventHandlers should work on component objects
  testRunner.addTest(
    'EventHandling - convertEventHandlers should work on component objects',
    async () => {
      // Create a mock component
      const component = {
        clickCounter: 0,
        handleClick: function(e: MouseEvent) {
          this.clickCounter += e.clientX;
        }
      };
      
      // Convert event handlers
      convertEventHandlers(component, {
        'click': 'handleClick'
      });
      
      // Create mock mouse event
      const mockEvent = new MouseEvent('click', { clientX: 100 });
      
      // Call the converted handler
      component.handleClick(mockEvent);
      
      return component.clickCounter === 100;
    }
  );
  
  // Test: attachEvent should attach and detach event handlers
  testRunner.addTest(
    'EventHandling - attachEvent should attach and detach event handlers',
    async () => {
      // Create a mock element
      const element = document.createElement('div');
      
      let callCount = 0;
      const handler = (e: Event) => { callCount++; };
      
      // Attach the event handler
      const detach = attachEvent(element, 'click', handler);
      
      // Simulate a click
      element.dispatchEvent(new MouseEvent('click'));
      const firstCount = callCount;
      
      // Detach the event handler
      detach();
      
      // Simulate another click
      element.dispatchEvent(new MouseEvent('click'));
      const secondCount = callCount;
      
      return firstCount === 1 && secondCount === 1;
    }
  );
  
  // Test: attachClickEvent should attach click handlers
  testRunner.addTest(
    'EventHandling - attachClickEvent should attach click handlers',
    async () => {
      // Create a mock element
      const element = document.createElement('div');
      
      let clickX = 0;
      const handler = (e: MouseEvent) => { clickX = e.clientX; };
      
      // Attach the click handler
      attachClickEvent(element, handler);
      
      // Simulate a click
      element.dispatchEvent(new MouseEvent('click', { clientX: 100 }));
      
      return clickX === 100;
    }
  );
}

/**
 * Run the EventHandling tests directly
 * @returns Promise that resolves when tests are complete
 */
export async function runEventHandlingTests(): Promise<void> {
  const testRunner = TestRunner.create();
  registerEventHandlingTests(testRunner);
  
  return testRunner.runTests().then((results) => {
    const passedCount = results.filter(r => r.passed).length;
    console.log(`EventHandling tests: ${passedCount}/${results.length} passed`);
    
    if (passedCount < results.length) {
      console.error("Failed tests:");
      results.filter(r => !r.passed).forEach(result => {
        console.error(`- ${result.name}: ${result.error}`);
      });
    }
  });
} 