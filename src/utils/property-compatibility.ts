/**
 * MIGRATION NOTICE: This adapter file is maintained for backward compatibility.
 * New code should not directly use functions from this file.
 * 
 * This file contains utility functions for handling property compatibility
 * during the TypeScript migration.
 * 
 * See docs/developer/architecture/typescript-architecture-lessons.md for the detailed migration plan.
 */
/**
 * Property Compatibility Utilities
 * 
 * This file contains utilities for handling property compatibility issues
 * between different versions of OneiroMetrics plugin.
 * 
 * The primary issue is that properties were renamed for clarity and consistency,
 * but we need to maintain backward compatibility with existing data.
 */

import { DreamMetricsSettings } from '../types/core';

/**
 * Property compatibility mapping
 * Maps legacy property names to current property names
 */
const PROPERTY_MAPPING: Record<string, string> = {
  // Settings properties
  'projectNotePath': 'projectNote',
  'showTestRibbonButton': 'showRibbonButtons',
  'linting': 'journalStructure',
  'maxLogSize': 'maxSize',
  
  // Metric properties
  'min': 'minValue',
  'max': 'maxValue',
  'range.min': 'minValue',
  'range.max': 'maxValue'
};

/**
 * Gets a property value with compatibility support
 * @param obj The object to get property from
 * @param prop The property name
 * @param defaultValue Optional default value if not found
 * @returns The property value
 */
export function getCompatibleProperty<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  prop: K,
  defaultValue?: T[K]
): T[K] {
  // Check if property exists directly
  if (prop in obj && obj[prop] !== undefined) {
    return obj[prop];
  }
  
  // Convert string prop to actual string
  const propStr = String(prop);
  
  // Check if there's a legacy property name mapping
  if (propStr in PROPERTY_MAPPING) {
    const legacyProp = PROPERTY_MAPPING[propStr] as unknown as K;
    
    if (legacyProp in obj && obj[legacyProp] !== undefined) {
      return obj[legacyProp];
    }
  }
  
  // For nested properties (e.g., 'range.min')
  if (propStr.includes('.')) {
    const [parentProp, childProp] = propStr.split('.');
    const parent = obj[parentProp as unknown as K] as any;
    
    if (parent && childProp in parent) {
      return parent[childProp] as unknown as T[K];
    }
  }
  
  // Return default value if provided
  return defaultValue as T[K];
}

/**
 * Sets a property with compatibility support
 * @param obj The object to set property on
 * @param prop The property name
 * @param value The value to set
 */
export function setCompatibleProperty<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  prop: K,
  value: T[K]
): void {
  // Set on primary property
  obj[prop] = value;
  
  // Convert string prop to actual string
  const propStr = String(prop);
  
  // Set on legacy property if mapping exists
  if (propStr in PROPERTY_MAPPING) {
    const legacyProp = PROPERTY_MAPPING[propStr] as unknown as K;
    obj[legacyProp] = value;
  }
  
  // For nested properties (e.g., 'range.min')
  if (propStr.includes('.')) {
    const [parentProp, childProp] = propStr.split('.');
    const parent = obj[parentProp as unknown as K] as any;
    
    if (parent) {
      parent[childProp] = value;
    }
  }
}

/**
 * Creates a compatible object by ensuring all properties exist in both legacy and current forms
 * @param obj The object to make compatible
 * @returns A new object with both sets of properties
 */
export function createCompatibleObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj } as any;
  
  // Iterate through all properties
  for (const prop in obj) {
    if (prop in PROPERTY_MAPPING) {
      const newProp = PROPERTY_MAPPING[prop];
      result[newProp] = obj[prop];
    }
  }
  
  // Iterate through mappings to check for missing properties
  for (const [oldProp, newProp] of Object.entries(PROPERTY_MAPPING)) {
    if (newProp in obj && !(oldProp in result)) {
      result[oldProp] = obj[newProp];
    }
  }
  
  return result as T;
}

/**
 * Gets enhanced settings with compatibility support
 * @param settings The settings object
 * @returns Enhanced settings object
 */
export function getCompatibleSettings(settings: DreamMetricsSettings): DreamMetricsSettings {
  return createCompatibleObject(settings);
} 
