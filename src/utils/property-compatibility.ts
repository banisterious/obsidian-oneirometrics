/**
 * PROPERTY COMPATIBILITY STUB
 * 
 * This file is a transitional stub that re-exports functions from their
 * permanent locations. It will be removed in a future release.
 * 
 * @deprecated Use the permanent implementations directly instead of this file.
 */

// Re-export the permanent implementation functions
import { 
  getPropertyValue,
  setPropertyValue,
  extractMetricValue,
  applyPropertyDefaults
} from './property-helpers';

// Re-export the CalloutParser for getCalloutMetadata
import { CalloutParser } from '../parsing/services/CalloutParser';

/**
 * Gets a property value with compatibility for different property names
 * @param obj The object to get the property from
 * @param key The property name
 * @param defaultValue Optional default value
 * @returns The property value or default value
 * @deprecated Use getPropertyValue from property-helpers
 */
export function getCompatibleProperty<T extends Record<string, any>, K extends keyof T>(
  obj: T, 
  key: K, 
  defaultValue?: T[K]
): T[K] {
  return getPropertyValue(obj, String(key), defaultValue);
}

/**
 * Sets a property value with compatibility for different property names
 * @param obj The object to set the property on
 * @param key The property name
 * @param value The value to set
 * @returns The updated object
 * @deprecated Use setPropertyValue from property-helpers
 */
export function setCompatibleProperty<T extends Record<string, any>, K extends keyof T>(
  obj: T, 
  key: K, 
  value: T[K]
): T {
  return setPropertyValue(obj, String(key), value);
}

/**
 * Gets callout metadata from a callout string
 * @param callout The callout string
 * @returns The callout metadata
 * @deprecated Use CalloutParser.getCalloutMetadata
 */
export function getCalloutMetadata(callout: string): any {
  const parser = new CalloutParser();
  return parser.getCalloutMetadata(callout);
}

/**
 * Creates a compatible object from a template
 * @param template The template object
 * @param source The source object
 * @returns A new object with properties from both
 * @deprecated Use createPropertyProxy from property-helpers
 */
export function createCompatibleObject<T extends Record<string, any>>(
  template: T,
  source?: Partial<T>
): T {
  // Implementation using property-helpers is more complex
  // For the stub, we'll use a simple implementation
  const result = { ...template };
  
  if (source) {
    Object.keys(source).forEach(key => {
      if (key in template) {
        (result as any)[key] = (source as any)[key];
      }
    });
  }
  
  return result;
} 
