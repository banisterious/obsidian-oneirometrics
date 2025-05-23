/**
 * Plugin module exports.
 * This module contains the core plugin infrastructure components.
 */

export type { IPluginAPI } from './IPluginAPI';
export { PluginAdapter } from './PluginAdapter';
export { CommandRegistry } from './CommandRegistry';
export type { PluginCommand } from './CommandRegistry'; 