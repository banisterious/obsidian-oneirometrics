/**
 * ADAPTER FUNCTIONS STUB
 * 
 * This file is a transitional stub that re-exports functions from their
 * permanent locations. It will be removed in a future release.
 * 
 * @deprecated Use the permanent implementations directly instead of this file.
 */

// Re-export ContentParser functionality
import { ContentParser } from '../parsing/services/ContentParser';

// Re-export UI component adapters
import { adaptMetricForUI } from '../templates/ui/MetricComponent';
import { adaptEntryForUI } from '../journal_check/ui/EntryComponent';

// Re-export selection mode helpers
import { 
  normalizeSelectionMode, 
  normalizeLegacySelectionMode
} from './selection-mode-helpers';

// Re-export event handling
import { 
  createEventHandler,
  createClickHandler,
  EventHandler,
  ClickHandler
} from '../templates/ui/EventHandling';

// Import required types
import { DreamMetricData, SelectionMode } from '../types/core';

// ContentParserAdapter (replaced by ContentParser class)
export class ContentParserAdapter {
  static adaptExtractDreamEntries(content: string, date?: Date, options?: any): DreamMetricData[] {
    const parser = new ContentParser();
    // Convert Date to string if provided
    const dateString = date ? date.toISOString().split('T')[0] : undefined;
    return parser.extractDreamEntries(content, dateString, options);
  }
}

// UIComponentAdapter (replaced by specific component adapters)
export class UIComponentAdapter {
  static adaptMetricForUI(metric: any, fallbackName?: string) {
    return adaptMetricForUI(metric);
  }
  
  static adaptEntryForUI(entry: any) {
    return adaptEntryForUI(entry);
  }
}

// SettingsAdapter (replaced by selection-mode-helpers)
export class SettingsAdapter {
  static adaptSelectionMode(mode: SelectionMode) {
    return normalizeSelectionMode(mode);
  }
  
  static adaptSelectionModeToLegacy(mode: SelectionMode) {
    return normalizeLegacySelectionMode(mode);
  }
}

// EventAdapter (replaced by EventHandling module)
export class EventAdapter {
  static adaptEventHandler<T extends Event>(handler: EventHandler<T>) {
    return createEventHandler<T>(handler);
  }
  
  static adaptClickHandler(handler: ClickHandler) {
    return createClickHandler(handler);
  }
} 
