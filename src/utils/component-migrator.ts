/**
 * COMPONENT MIGRATOR STUB
 * 
 * This file is a transitional stub that re-exports functions from their
 * permanent locations. It will be removed in a future release.
 * 
 * @deprecated Use the permanent implementations directly instead of this file.
 */

// Re-export component factory functions
import { 
  createComponent2 as createComponent,
  createComponentFromLegacy,
  createComponentFromElement,
  createCompatibleComponent,
  createMetricSlider,
  createComponentHeader,
  createComponentButton
} from '../templates/ui/ComponentFactory';

// Re-export modal factory
import { createModal, ModalConfig } from '../dom/modals/ModalFactory';

// Re-export event handling
import { convertEventHandlers } from '../templates/ui/EventHandling';

// Re-export filter factory
import { 
  createFilterDropdown,
  createDateRangeFilter 
} from '../filters/FilterFactory';

/**
 * Creates a new component of a specified type with proper typing
 * @param componentClass The component class to instantiate
 * @param options Component options
 * @returns The created component
 * @deprecated Use createComponent from ComponentFactory instead
 */
export function createCompatibleComponent2(componentClass: any, options: any): any {
  return createComponent(componentClass, options);
}

/**
 * Creates a filter element
 * @param type The filter type
 * @param options Filter options
 * @returns The created filter element
 * @deprecated Use createFilterDropdown or createDateRangeFilter from FilterFactory instead
 */
export function createFilterElement(type: string, options: any = {}): any {
  if (type === 'dropdown' || type === 'select') {
    return createFilterDropdown(options);
  } else if (type === 'dateRange' || type === 'date-range') {
    return createDateRangeFilter(options);
  }
  
  throw new Error(`Filter type "${type}" not supported`);
}

/**
 * Wraps a legacy component constructor to make it compatible with the new component system
 * @param legacyConstructor The legacy component constructor
 * @param options Constructor options
 * @returns The wrapped component
 * @deprecated Use createComponentFromLegacy from ComponentFactory instead
 */
export function wrapLegacyComponent(legacyConstructor: any, options: any = {}): any {
  return createComponentFromLegacy(legacyConstructor, options);
}

/**
 * Creates a component from an existing DOM element
 * @param element The DOM element to wrap
 * @param className Optional class name to add
 * @returns The wrapped component
 * @deprecated Use createComponentFromElement from ComponentFactory instead
 */
export function createElementComponent(element: HTMLElement, className?: string): any {
  return createComponentFromElement(element, className);
}

/**
 * Adapts a modal configuration object to the standard format
 * @param config Original config object
 * @returns Standardized modal config
 * @deprecated Use createModal from ModalFactory directly
 */
export function adaptModalConfig(config: any): ModalConfig {
  return {
    title: config.title,
    description: config.description || config.message,
    width: config.width,
    height: config.height,
    className: config.className,
    closeOnEsc: config.closeOnEsc ?? true,
    closeOnClickOutside: config.closeOnClickOutside ?? false,
    onOpen: config.onOpen,
    onClose: config.onClose
  };
} 
