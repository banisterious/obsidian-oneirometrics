/**
 * EventHandling Module
 * 
 * Provides utilities for working with DOM events in a type-safe manner.
 * This module replaces the legacy EventAdapter functions with a more
 * comprehensive set of utilities for event handling.
 */

/**
 * Type for DOM event handler functions
 */
export type EventHandler<T extends Event = Event> = (event: T) => void;

/**
 * Type for click event handler functions
 */
export type ClickHandler = EventHandler<MouseEvent>;

/**
 * Type for keyboard event handler functions
 */
export type KeyboardHandler = EventHandler<KeyboardEvent>;

/**
 * Type for input event handler functions
 */
export type InputHandler = EventHandler<InputEvent>;

/**
 * Type for change event handler functions
 */
export type ChangeHandler = EventHandler<Event>;

/**
 * Type for drag event handler functions
 */
export type DragHandler = EventHandler<DragEvent>;

/**
 * Creates an event handler that ensures events are properly typed
 * @param handler The original event handler
 * @returns A new handler that ensures proper event typing
 */
export function createEventHandler<T extends Event>(
  handler: EventHandler<T>
): EventHandler {
  return (event: Event) => {
    handler(event as T);
  };
}

/**
 * Creates a click handler with proper typing
 * @param handler The original click handler
 * @returns A properly typed click handler
 */
export function createClickHandler(
  handler: ClickHandler
): EventHandler {
  return createEventHandler<MouseEvent>(handler);
}

/**
 * Creates a keyboard handler with proper typing
 * @param handler The original keyboard handler
 * @returns A properly typed keyboard handler
 */
export function createKeyboardHandler(
  handler: KeyboardHandler
): EventHandler {
  return createEventHandler<KeyboardEvent>(handler);
}

/**
 * Creates an input handler with proper typing
 * @param handler The original input handler
 * @returns A properly typed input handler
 */
export function createInputHandler(
  handler: InputHandler
): EventHandler {
  return createEventHandler<InputEvent>(handler);
}

/**
 * Creates a change handler with proper typing
 * @param handler The original change handler
 * @returns A properly typed change handler
 */
export function createChangeHandler(
  handler: ChangeHandler
): EventHandler {
  return createEventHandler<Event>(handler);
}

/**
 * Creates a drag handler with proper typing
 * @param handler The original drag handler
 * @returns A properly typed drag handler
 */
export function createDragHandler(
  handler: DragHandler
): EventHandler {
  return createEventHandler<DragEvent>(handler);
}

/**
 * Attaches an event handler to an element
 * @param element The element to attach the handler to
 * @param eventName The event name
 * @param handler The event handler
 * @param options Optional event listener options
 * @returns A function to remove the event listener
 */
export function attachEvent<T extends Event>(
  element: HTMLElement,
  eventName: string,
  handler: EventHandler<T>,
  options?: boolean | AddEventListenerOptions
): () => void {
  const wrappedHandler = createEventHandler(handler);
  element.addEventListener(eventName, wrappedHandler, options);
  
  return () => {
    element.removeEventListener(eventName, wrappedHandler, options);
  };
}

/**
 * Attaches a click handler to an element
 * @param element The element to attach the handler to
 * @param handler The click handler
 * @param options Optional event listener options
 * @returns A function to remove the event listener
 */
export function attachClickEvent(
  element: HTMLElement,
  handler: ClickHandler,
  options?: boolean | AddEventListenerOptions
): () => void {
  return attachEvent(element, 'click', handler, options);
}

/**
 * Attaches a keyboard handler to an element
 * @param element The element to attach the handler to
 * @param eventName The keyboard event name (keydown, keyup, keypress)
 * @param handler The keyboard handler
 * @param options Optional event listener options
 * @returns A function to remove the event listener
 */
export function attachKeyboardEvent(
  element: HTMLElement,
  eventName: 'keydown' | 'keyup' | 'keypress',
  handler: KeyboardHandler,
  options?: boolean | AddEventListenerOptions
): () => void {
  return attachEvent(element, eventName, handler, options);
}

/**
 * Converts a legacy event handler to a type-safe event handler
 * This function is provided for backward compatibility
 * @param handler The original event handler
 * @returns A typed event handler
 * @deprecated Use createEventHandler instead
 */
export function adaptEventHandler<T extends Event>(
  handler: (event: T) => void
): (event: Event) => void {
  return createEventHandler(handler);
}

/**
 * Converts a legacy click handler to a type-safe click handler
 * This function is provided for backward compatibility
 * @param handler The original click handler
 * @returns A typed click handler
 * @deprecated Use createClickHandler instead
 */
export function adaptClickHandler(
  handler: (event: MouseEvent) => void
): (event: Event) => void {
  return createClickHandler(handler);
}

/**
 * Creates a debounced event handler
 * @param handler The original event handler
 * @param delay The debounce delay in milliseconds
 * @returns A debounced event handler
 */
export function debounceEventHandler<T extends Event>(
  handler: EventHandler<T>,
  delay: number
): EventHandler<T> {
  let timeoutId: number | undefined;
  
  return (event: T) => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      handler(event);
      timeoutId = undefined;
    }, delay);
  };
}

/**
 * Creates a throttled event handler
 * @param handler The original event handler
 * @param limit The throttle limit in milliseconds
 * @returns A throttled event handler
 */
export function throttleEventHandler<T extends Event>(
  handler: EventHandler<T>,
  limit: number
): EventHandler<T> {
  let lastRun = 0;
  let throttled = false;
  
  return (event: T) => {
    if (!throttled) {
      handler(event);
      lastRun = Date.now();
      throttled = true;
      
      setTimeout(() => {
        throttled = false;
      }, limit);
    }
  };
}

/**
 * Converts handler methods in a component to use type-safe event handlers
 * @param component The component to convert
 * @param events Map of event names to handler method names
 */
export function convertEventHandlers<T extends Record<string, any>>(
  component: T,
  events: Record<string, string>
): void {
  Object.entries(events).forEach(([eventName, handlerMethodName]) => {
    const handlerKey = handlerMethodName as keyof T;
    const originalHandler = component[handlerKey];
    
    if (typeof originalHandler === 'function') {
      // Replace with adapter
      component[handlerKey] = function(event: Event) {
        createEventHandler(originalHandler.bind(component))(event);
      } as unknown as T[keyof T];
    }
  });
} 