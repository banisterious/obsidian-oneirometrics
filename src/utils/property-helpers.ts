/**
 * Property Access Helpers
 * 
 * This file provides type-safe utilities for accessing and modifying properties
 * on objects, especially when dealing with compatibility between different
 * property naming conventions or nested properties.
 */

import { DreamMetricsSettings } from '../types/core';

/**
 * Property compatibility mapping
 * Maps current property names to legacy property names (and vice versa)
 */
const PROPERTY_MAPPING: Record<string, string> = {
  // Settings properties
  'projectNote': 'projectNotePath',
  'projectNotePath': 'projectNote',
  'showRibbonButtons': 'showTestRibbonButton',
  'showTestRibbonButton': 'showRibbonButtons',
  'journalStructure': 'linting',
  'linting': 'journalStructure',
  
  // Logging properties
  'maxSize': 'maxLogSize',
  'maxLogSize': 'maxSize',
  
  // UI state properties
  'activeTab': 'lastTab',
  'lastTab': 'activeTab',
  
  // Metric properties
  'minValue': 'min',
  'min': 'minValue',
  'maxValue': 'max',
  'max': 'maxValue'
};

/**
 * Gets a property value with full compatibility support
 * 
 * This function attempts to get a property value from an object, falling back
 * to compatible property names if the primary name is not found. It also
 * supports accessing nested properties using dot notation.
 * 
 * @param obj - The object to get property from
 * @param propName - The property name (can use dot notation for nested properties)
 * @param defaultValue - Optional default value if property not found
 * @returns The property value or default value if not found
 * 
 * @example
 * // Get a simple property
 * const value = getPropertyValue(settings, 'projectNote', '');
 * 
 * // Get a nested property
 * const maxSize = getPropertyValue(settings, 'logging.maxSize', 1024);
 */
export function getPropertyValue<T extends Record<string, any>, V = any>(
  obj: T,
  propName: string,
  defaultValue?: V
): V {
  // Handle direct property access
  if (propName in obj && obj[propName as keyof T] !== undefined) {
    return obj[propName as keyof T] as unknown as V;
  }
  
  // Check for compatible property name
  const compatibleProp = PROPERTY_MAPPING[propName];
  if (compatibleProp && compatibleProp in obj && obj[compatibleProp as keyof T] !== undefined) {
    return obj[compatibleProp as keyof T] as unknown as V;
  }
  
  // Handle nested properties with dot notation
  if (propName.includes('.')) {
    const parts = propName.split('.');
    let current: any = obj;
    
    // Navigate through the parts
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        // Try compatible name for this part
        const compatPart = PROPERTY_MAPPING[parts[i]];
        if (compatPart && current[compatPart] !== undefined) {
          current = current[compatPart];
        } else {
          return defaultValue as V;
        }
      } else {
        current = current[parts[i]];
      }
    }
    
    // Get the final property
    const finalProp = parts[parts.length - 1];
    if (current && finalProp in current && current[finalProp] !== undefined) {
      return current[finalProp] as unknown as V;
    }
    
    // Try compatible name for final part
    const compatFinalProp = PROPERTY_MAPPING[finalProp];
    if (compatFinalProp && current && compatFinalProp in current && 
        current[compatFinalProp] !== undefined) {
      return current[compatFinalProp] as unknown as V;
    }
  }
  
  // Return default if nothing found
  return defaultValue as V;
}

/**
 * Sets a property value with compatibility support
 * 
 * This function sets a property value on an object and also updates any
 * compatible property names to maintain backward compatibility. It also
 * supports setting nested properties using dot notation.
 * 
 * @param obj - The object to set property on
 * @param propName - The property name (can use dot notation for nested properties)
 * @param value - The value to set
 * @returns The modified object
 * 
 * @example
 * // Set a simple property
 * setPropertyValue(settings, 'projectNote', '/path/to/note.md');
 * 
 * // Set a nested property
 * setPropertyValue(settings, 'logging.maxSize', 2048);
 */
export function setPropertyValue<T extends Record<string, any>, V = any>(
  obj: T,
  propName: string,
  value: V
): T {
  // Handle direct property setting
  (obj as Record<string, any>)[propName] = value;
  
  // Set on compatible property name if it exists
  const compatibleProp = PROPERTY_MAPPING[propName];
  if (compatibleProp) {
    (obj as Record<string, any>)[compatibleProp] = value;
  }
  
  // Handle nested properties with dot notation
  if (propName.includes('.')) {
    const parts = propName.split('.');
    let current: any = obj;
    
    // Navigate and create path if needed
    for (let i = 0; i < parts.length - 1; i++) {
      // Create object path if it doesn't exist
      if (current[parts[i]] === undefined) {
        current[parts[i]] = {};
      }
      
      // Create compatible path if needed
      const compatPart = PROPERTY_MAPPING[parts[i]];
      if (compatPart && current[compatPart] === undefined) {
        current[compatPart] = current[parts[i]];
      }
      
      // Move to next level
      current = current[parts[i]];
    }
    
    // Set the final property
    const finalProp = parts[parts.length - 1];
    current[finalProp] = value;
    
    // Set compatible final property if needed
    const compatFinalProp = PROPERTY_MAPPING[finalProp];
    if (compatFinalProp) {
      current[compatFinalProp] = value;
    }
  }
  
  return obj;
}

/**
 * Creates a compatibility layer for an object
 * 
 * This function creates a proxy that automatically handles property compatibility
 * without needing to manually use getPropertyValue and setPropertyValue.
 * 
 * @param obj - The object to create a compatibility layer for
 * @returns A proxy object that handles property compatibility
 * 
 * @example
 * const compatibleSettings = createPropertyProxy(settings);
 * // Now you can use either naming convention:
 * const path = compatibleSettings.projectNote; // or compatibleSettings.projectNotePath
 * compatibleSettings.projectNote = '/new/path.md'; // also updates projectNotePath
 */
export function createPropertyProxy<T extends Record<string, any>>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop) {
      if (typeof prop === 'string') {
        return getPropertyValue(target, prop);
      }
      return Reflect.get(target, prop);
    },
    set(target, prop, value) {
      if (typeof prop === 'string') {
        setPropertyValue(target, prop, value);
        return true;
      }
      return Reflect.set(target, prop, value);
    }
  });
}

/**
 * Ensures an object has both current and legacy property values
 * 
 * This function creates a new object with both current and legacy property values
 * synchronized, ensuring maximum compatibility.
 * 
 * @param obj - The object to make compatible
 * @returns A new object with both sets of properties synchronized
 * 
 * @example
 * const compatibleObject = createCompatibleObject(settings);
 * // Now compatibleObject has both projectNote and projectNotePath properties
 */
export function createCompatibleObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj } as Record<string, any>;
  
  // Ensure all properties exist in both current and legacy forms
  for (const [prop1, prop2] of Object.entries(PROPERTY_MAPPING)) {
    // If prop1 exists but prop2 doesn't, copy prop1 to prop2
    if (prop1 in obj && !(prop2 in obj)) {
      result[prop2] = (obj as Record<string, any>)[prop1];
    }
    // If prop2 exists but prop1 doesn't, copy prop2 to prop1
    else if (prop2 in obj && !(prop1 in obj)) {
      result[prop1] = (obj as Record<string, any>)[prop2];
    }
  }
  
  return result as T;
}

/**
 * Applies default values to an object for missing properties
 * 
 * This function fills in default values for properties that are missing
 * in the target object.
 * 
 * @param obj - The object to apply defaults to
 * @param defaults - The default values to apply
 * @returns The object with defaults applied
 * 
 * @example
 * const settings = applyPropertyDefaults(userSettings, DEFAULT_SETTINGS);
 */
export function applyPropertyDefaults<T extends Record<string, any>>(
  obj: T,
  defaults: Partial<T>
): T {
  const result = { ...obj } as Record<string, any>;
  
  // Apply default values for missing properties
  for (const [key, value] of Object.entries(defaults)) {
    if (result[key] === undefined) {
      result[key] = value;
      
      // Also set compatible property if it exists
      const compatibleKey = PROPERTY_MAPPING[key];
      if (compatibleKey && result[compatibleKey] === undefined) {
        result[compatibleKey] = value;
      }
    }
  }
  
  return result as T;
}

/**
 * Gets compatible settings with all properties synchronized
 * 
 * This is a convenience function specifically for DreamMetricsSettings objects.
 * 
 * @param settings - The settings object
 * @returns Settings object with all properties synchronized
 */
export function getCompatibleSettings(settings: DreamMetricsSettings): DreamMetricsSettings {
  return createCompatibleObject(settings);
}

/**
 * Extracts a numeric metric value from various possible formats
 * 
 * This function handles extracting metric values that might be stored in
 * different formats due to changing data structures over time.
 * 
 * @param data - The data object to extract from
 * @param metricName - The name of the metric
 * @param defaultValue - Default value if metric not found
 * @returns The numeric value of the metric
 */
export function extractMetricValue(
  data: Record<string, any>,
  metricName: string,
  defaultValue: number = 0
): number {
  // Handle direct property access
  if (typeof data[metricName] === 'number') {
    return data[metricName];
  }
  
  // Handle metrics object format
  if (data.metrics && typeof data.metrics[metricName] === 'number') {
    return data.metrics[metricName];
  }
  
  // Handle compatible property name
  const compatibleName = PROPERTY_MAPPING[metricName];
  if (compatibleName && typeof data[compatibleName] === 'number') {
    return data[compatibleName];
  }
  
  // Handle metrics object with compatible name
  if (data.metrics && compatibleName && typeof data.metrics[compatibleName] === 'number') {
    return data.metrics[compatibleName];
  }
  
  // Handle legacy format where metrics are direct properties
  if (metricName.toLowerCase() === 'words' && typeof data.wordCount === 'number') {
    return data.wordCount;
  }
  
  // Return default value if not found
  return defaultValue;
} 