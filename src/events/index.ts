// Export base event emitter
export { EventEmitter } from './EventEmitter';
export type { EventListener } from './EventEmitter';

// Export event type interfaces
export type {
  MetricsEvents,
  UIEvents,
  JournalEvents,
  SystemEvents
} from './EventTypes';

// Export specific event emitters
import { MetricsEventEmitter } from './MetricsEventEmitter';
import { UIEventEmitter } from './UIEventEmitter';
import { JournalEventEmitter } from './JournalEventEmitter';
import { SystemEventEmitter } from './SystemEventEmitter';

// Export legacy events adapter
export { DreamMetricsEventsAdapter } from './DreamMetricsEventsAdapter';

export {
  MetricsEventEmitter,
  UIEventEmitter,
  JournalEventEmitter,
  SystemEventEmitter
};

/**
 * A helper class to manage all event emitters in the application.
 * Provides a central access point for all emitters.
 */
export class EventManager {
  private static instance: EventManager;

  private constructor() {}

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Get the metrics event emitter instance.
   */
  public get metrics(): MetricsEventEmitter {
    return MetricsEventEmitter.getInstance();
  }

  /**
   * Get the UI event emitter instance.
   */
  public get ui(): UIEventEmitter {
    return UIEventEmitter.getInstance();
  }

  /**
   * Get the journal event emitter instance.
   */
  public get journal(): JournalEventEmitter {
    return JournalEventEmitter.getInstance();
  }

  /**
   * Get the system event emitter instance.
   */
  public get system(): SystemEventEmitter {
    return SystemEventEmitter.getInstance();
  }

  /**
   * Clear all event listeners from all emitters.
   * Useful when unloading the plugin.
   */
  public clearAll(): void {
    this.metrics.clear();
    this.ui.clear();
    this.journal.clear();
    this.system.clear();
  }
} 