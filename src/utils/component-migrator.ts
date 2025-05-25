/**
 * MIGRATION NOTICE
 * 
 * This file is part of the phased migration plan and will eventually be replaced.
 * Do not add new dependencies on this file. Instead, use the permanent replacements
 * as documented in the TypeScript architecture documentation.
 * 
 * See post-refactoring-cleanup-checklist.md for the detailed migration plan.
 */
/**
 * Component Migration Utilities
 * 
 * This file provides utilities to help migrate existing UI components
 * to the new typed architecture with minimal changes.
 */

import { BaseComponent, EventableComponent } from '../templates/ui/BaseComponent';
import { OOMComponentProps, standardizeComponentProps } from './ui-component-adapter';
import { EventAdapter } from './adapter-functions';
import { createElement } from './dom-helpers';

// Create a type with public-only properties for BaseComponent
type PublicBaseComponent = {
  container: HTMLElement;
  render(): void;
  update(): void;
  show(): void;
  hide(): void;
  setVisible(visible: boolean): void;
  findElement<T extends HTMLElement = HTMLElement>(selector: string): T | null;
  createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes?: Record<string, string>,
    content?: string | HTMLElement | HTMLElement[]
  ): HTMLElementTagNameMap[K];
  destroy(): void;
};

/**
 * Wraps a legacy component function to maintain backward compatibility
 * @param originalFn Original component constructor function
 * @returns A function that creates a component with proper typing
 */
export function wrapLegacyComponent<T extends Record<string, any>>(
  originalFn: (container: HTMLElement, ...args: any[]) => T
): (options: Partial<OOMComponentProps> & Record<string, any>) => PublicBaseComponent & T {
  return function(options: Partial<OOMComponentProps> & Record<string, any>): PublicBaseComponent & T {
    // Create base component instance as any to access protected properties
    const baseComponent = new BaseComponent(options) as unknown as PublicBaseComponent;
    
    // Extract parameters for the original function
    const { container, ...rest } = options;
    
    // Create original component
    const originalComponent = originalFn(baseComponent.container, ...Object.values(rest));
    
    // Merge components
    const mergedComponent = Object.assign(baseComponent, originalComponent);
    
    // Override render method to call original render if it exists
    const originalRender = originalComponent.render;
    if (typeof originalRender === 'function') {
      mergedComponent.render = function() {
        BaseComponent.prototype.render.call(this);
        originalRender.call(this);
      };
    }
    
    return mergedComponent;
  };
}

/**
 * Adapts event handling for legacy components
 * @param component Component to adapt
 * @param events Map of event names to legacy handler functions
 */
export function adaptLegacyEvents<T extends Record<string, any>>(
  component: T,
  events: Record<string, string>
): void {
  // Check if component has event handlers
  Object.entries(events).forEach(([eventName, handlerMethodName]) => {
    const handlerKey = handlerMethodName as keyof T;
    const originalHandler = component[handlerKey];
    
    if (typeof originalHandler === 'function') {
      // Replace with adapter
      component[handlerKey] = function(event: Event) {
        // Use event adapter to ensure proper typing
        EventAdapter.adaptEventHandler(originalHandler.bind(component))(event);
      } as unknown as T[keyof T];
    }
  });
}

/**
 * Creates a wrapper BaseComponent around an existing DOM element
 * @param element Existing DOM element
 * @param className Optional class name to add
 * @returns A BaseComponent wrapping the element
 */
export function wrapExistingElement(
  element: HTMLElement,
  className?: string
): PublicBaseComponent {
  // Create a temporary container for the BaseComponent
  const tempContainer = document.createElement('div');
  if (element.parentElement) {
    element.parentElement.appendChild(tempContainer);
  }
  
  // Create base component with the temporary container
  const baseComponent = new BaseComponent({
    container: tempContainer,
    className
  }) as unknown as PublicBaseComponent;
  
  // Get access to the container
  const componentContainer = baseComponent.container;
  
  // Replace with the existing element
  if (componentContainer.parentElement) {
    componentContainer.parentElement.insertBefore(element, componentContainer);
    componentContainer.parentElement.removeChild(componentContainer);
    
    // Update container reference in base component
    (baseComponent as any).container = element;
    
    if (className) {
      element.classList.add(className);
    }
  }
  
  return baseComponent;
}

// Interface for components with event handling
interface EventHandlingComponent {
  on(eventName: string, handler: Function): void;
  off(eventName: string, handler: Function): void;
  trigger(eventName: string, data?: any): void;
}

/**
 * Migrates a component that uses custom events to EventableComponent
 * @param component Component to migrate
 * @param events List of custom event names
 * @returns Same component with added event methods
 */
export function migrateToEventable<T extends Record<string, any>>(
  component: T,
  events: string[]
): T & EventHandlingComponent {
  // Create a map for event handlers
  const eventHandlers = new Map<string, Set<Function>>();
  
  // Add event handlers to component
  (component as any)['eventHandlers'] = eventHandlers;
  
  // Create a new object with event handling methods
  const eventComponent: EventHandlingComponent = {
    on: function(eventName: string, handler: Function): void {
      if (!eventHandlers.has(eventName)) {
        eventHandlers.set(eventName, new Set());
      }
      
      eventHandlers.get(eventName)!.add(handler);
    },
    
    off: function(eventName: string, handler: Function): void {
      if (!eventHandlers.has(eventName)) {
        return;
      }
      
      eventHandlers.get(eventName)!.delete(handler);
    },
    
    trigger: function(eventName: string, data?: any): void {
      if (!eventHandlers.has(eventName)) {
        return;
      }
      
      for (const handler of eventHandlers.get(eventName)!) {
        handler(data);
      }
    }
  };
  
  // Merge the event methods into the component
  return Object.assign(component, eventComponent);
}

/**
 * Transforms a standard constructor function to a component class
 * @param constructorFn Original constructor function
 * @returns A new class extending BaseComponent
 */
export function transformToComponentClass<T>(
  constructorFn: new (container: HTMLElement, ...args: any[]) => T
): new (props: Partial<OOMComponentProps>) => PublicBaseComponent & T {
  return class extends BaseComponent {
    private originalInstance: T;
    
    constructor(props: Partial<OOMComponentProps>) {
      super(props);
      
      // Access container via getter
      const container = (this as unknown as PublicBaseComponent).container;
      
      // Create original instance
      this.originalInstance = new constructorFn(container);
      
      // Copy properties from original instance
      Object.assign(this, this.originalInstance);
    }
    
    // Override render method
    render(): void {
      super.render();
      
      // Call original render if it exists
      const originalRender = this.originalInstance as any;
      if (typeof originalRender.render === 'function') {
        originalRender.render();
      }
    }
  } as unknown as new (props: Partial<OOMComponentProps>) => PublicBaseComponent & T;
} 
