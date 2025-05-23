import { EventEmitter } from './EventEmitter';
import { SystemEvents } from './EventTypes';

/**
 * Event emitter for system-level events.
 * Provides typed methods for emitting standard system events.
 */
export class SystemEventEmitter extends EventEmitter<SystemEvents> {
  private static instance: SystemEventEmitter;
  
  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    super();
  }
  
  /**
   * Get the singleton instance of the system event emitter.
   * @returns The SystemEventEmitter instance
   */
  public static getInstance(): SystemEventEmitter {
    if (!SystemEventEmitter.instance) {
      SystemEventEmitter.instance = new SystemEventEmitter();
    }
    return SystemEventEmitter.instance;
  }
  
  /**
   * Emit event when a plugin setting is changed.
   * @param key The setting key that changed
   * @param value The new value
   * @param previousValue The previous value
   */
  notifySettingChanged(key: string, value: any, previousValue: any): void {
    this.emit('system:settingChanged', { key, value, previousValue });
  }
  
  /**
   * Emit event when the plugin is loaded.
   * @param version The plugin version
   */
  notifyPluginLoaded(version: string): void {
    this.emit('system:pluginLoaded', { timestamp: Date.now(), version });
  }
  
  /**
   * Emit event when the plugin is unloaded.
   */
  notifyPluginUnloaded(): void {
    this.emit('system:pluginUnloaded', { timestamp: Date.now() });
  }
  
  /**
   * Emit event when an error occurs within the plugin.
   * @param error The error that occurred
   * @param context Additional context about where the error occurred
   */
  notifyError(error: Error, context: string): void {
    this.emit('system:error', { error, context });
  }
} 