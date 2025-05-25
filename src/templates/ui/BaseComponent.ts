/**
 * Base Component Class
 * 
 * Provides a foundation for all OneiroMetrics UI components with
 * type-safe methods and standardized lifecycle.
 */

import { OOMComponentProps, standardizeComponentProps } from '../../utils/ui-component-adapter';
import { findElement, addClass, removeClass, createElement } from '../../utils/dom-helpers';

/**
 * Base component class that all UI components should extend
 */
export class BaseComponent {
  /**
   * The component's root container element
   */
  protected container: HTMLElement;
  
  /**
   * Component ID for reference
   */
  protected id: string;
  
  /**
   * Base CSS class for the component
   */
  protected className: string;
  
  /**
   * Flag indicating if the component has been rendered
   */
  protected isRendered: boolean = false;
  
  /**
   * Creates a new component instance
   * @param props Component properties
   */
  constructor(props: Partial<OOMComponentProps>) {
    const standardProps = standardizeComponentProps(props);
    
    this.id = standardProps.id;
    this.className = standardProps.className;
    
    // Create the container if it doesn't exist
    this.container = createElement('div', {
      id: this.id,
      className: `oom-component ${this.className}`.trim()
    });
    
    // Append to parent if provided
    if (standardProps.container) {
      standardProps.container.appendChild(this.container);
    }
  }
  
  /**
   * Renders the component
   * Override in child classes
   */
  render(): void {
    if (this.isRendered) {
      this.update();
      return;
    }
    
    this.isRendered = true;
  }
  
  /**
   * Updates the component with new data
   * Override in child classes
   */
  update(): void {
    // Default implementation does nothing
  }
  
  /**
   * Shows the component
   */
  show(): void {
    removeClass(this.container, 'oom-hidden');
  }
  
  /**
   * Hides the component
   */
  hide(): void {
    addClass(this.container, 'oom-hidden');
  }
  
  /**
   * Sets the visibility of the component
   * @param visible Whether the component should be visible
   */
  setVisible(visible: boolean): void {
    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  }
  
  /**
   * Finds an element within this component
   * @param selector CSS selector for the element
   * @returns The found element or null
   */
  findElement<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return findElement<T>(selector, this.container);
  }
  
  /**
   * Creates and appends a child element to this component
   * @param tag Element tag name
   * @param attributes Optional attributes
   * @param content Optional content
   * @returns The created element
   */
  createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes?: Record<string, string>,
    content?: string | HTMLElement | HTMLElement[]
  ): HTMLElementTagNameMap[K] {
    const element = createElement(tag, attributes, content);
    this.container.appendChild(element);
    return element;
  }
  
  /**
   * Destroys the component and removes it from the DOM
   */
  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.isRendered = false;
  }
}

/**
 * Event handler type for component events
 */
export type ComponentEventHandler<T = any> = (data: T) => void;

/**
 * Base component with event handling capabilities
 */
export class EventableComponent extends BaseComponent {
  /**
   * Event handlers by event name
   */
  private eventHandlers: Map<string, Set<ComponentEventHandler>> = new Map();
  
  /**
   * Adds an event handler
   * @param eventName Event name
   * @param handler Event handler function
   */
  on<T = any>(eventName: string, handler: ComponentEventHandler<T>): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    
    this.eventHandlers.get(eventName)!.add(handler);
  }
  
  /**
   * Removes an event handler
   * @param eventName Event name
   * @param handler Event handler function
   */
  off<T = any>(eventName: string, handler: ComponentEventHandler<T>): void {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    this.eventHandlers.get(eventName)!.delete(handler);
  }
  
  /**
   * Triggers an event
   * @param eventName Event name
   * @param data Event data
   */
  trigger<T = any>(eventName: string, data?: T): void {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    for (const handler of this.eventHandlers.get(eventName)!) {
      handler(data);
    }
  }
  
  /**
   * Destroys the component and removes all event handlers
   */
  destroy(): void {
    super.destroy();
    
    // Clear all event handlers
    this.eventHandlers.clear();
  }
} 