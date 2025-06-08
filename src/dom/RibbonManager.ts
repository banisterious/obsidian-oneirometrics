/**
 * RibbonManager
 * 
 * Manages ribbon icons for the OneiroMetrics plugin.
 */

import { App, Plugin } from 'obsidian';
import { DreamMetricsSettings } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';
import { shouldShowRibbonButtons } from '../utils/settings-helpers';
import { ModalsManager } from './modals/ModalsManager';
import { getProjectNotePath } from '../utils/settings-helpers';

export class RibbonManager {
    private ribbonIcons: HTMLElement[] = [];
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private plugin: Plugin, // Plugin instance that has methods like showMetrics
        private logger?: ILogger
    ) {}
    
    /**
     * Update ribbon icons based on settings
     */
    public updateRibbonIcons(): void {
        const shouldShow = shouldShowRibbonButtons(this.settings);
        
        if (shouldShow) {
            this.addRibbonIcons();
        } else {
            this.removeRibbonIcons();
        }
        
        this.logger?.debug('UI', 'Updated ribbon icons', { visible: shouldShow });
    }
    
    /**
     * Remove all ribbon icons
     */
    public removeRibbonIcons(): void {
        this.ribbonIcons.forEach(icon => icon.remove());
        this.ribbonIcons = [];
        
        this.logger?.debug('UI', 'Removed ribbon icons');
    }
    
    /**
     * Add ribbon icons based on settings
     */
    public addRibbonIcons(): void {
        // Remove existing icons first
        this.removeRibbonIcons();
        
        // Add OneiroMetrics Hub button with lucide-shell icon
        // @ts-ignore - Obsidian typings aren't fully accurate
        const metricsHubRibbonEl = this.plugin.addRibbonIcon(
            'lucide-shell',
            'OneiroMetrics Hub',
            () => {
                // Use ModalsManager to open the consolidated hub
                try {
                    const modalsManager = new ModalsManager(this.app, this.plugin as any, this.logger);
                    modalsManager.openHubModal();
                } catch (e) {
                    this.logger?.error('UI', 'Error opening OneiroMetrics Hub', e instanceof Error ? e : new Error(String(e)));
                }
            }
        );
        this.ribbonIcons.push(metricsHubRibbonEl);
        
        this.logger?.debug('UI', 'Added ribbon icons');
    }
    
    
    
    /**
     * Add a test ribbon icon for debugging
     * 
     * @param callback - Function to call when the icon is clicked
     * @param icon - Icon name
     * @param tooltip - Tooltip text
     * @returns The created ribbon icon element
     */
    public addTestRibbon(callback: () => void, icon: string = 'lucide-beaker', tooltip: string = 'Test'): HTMLElement {
        // @ts-ignore - Obsidian typings aren't fully accurate
        const ribbonIcon = this.plugin.addRibbonIcon(
            icon,
            tooltip,
            callback
        );
        this.ribbonIcons.push(ribbonIcon);
        return ribbonIcon;
    }
} 