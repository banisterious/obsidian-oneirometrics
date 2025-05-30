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

export class RibbonManager {
    private ribbonIcons: HTMLElement[] = [];
    private journalManagerRibbonEl: HTMLElement | null = null;
    
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
        
        if (this.journalManagerRibbonEl) {
            this.journalManagerRibbonEl.remove();
            this.journalManagerRibbonEl = null;
        }
        
        this.logger?.debug('UI', 'Removed ribbon icons');
    }
    
    /**
     * Add ribbon icons based on settings
     */
    public addRibbonIcons(): void {
        // Remove existing icons first
        this.removeRibbonIcons();
        
        // Add journal manager button
        // @ts-ignore - Obsidian typings aren't fully accurate
        this.journalManagerRibbonEl = this.plugin.addRibbonIcon(
            'lucide-moon',
            'Dream Journal Manager',
            () => {
                // Use type assertion to access properties not defined in Plugin
                const pluginInstance = this.plugin as any;
                
                if (pluginInstance.dreamJournalManager?.open) {
                    pluginInstance.dreamJournalManager.open();
                } else {
                    // Fallback to JournalStructureModal
                    try {
                        // Import dynamically to avoid circular dependencies
                        import('../journal_check/ui/JournalStructureModal').then(module => {
                            const JournalStructureModal = module.JournalStructureModal;
                            new JournalStructureModal(this.app, pluginInstance).open();
                        }).catch(() => {
                            this.logger?.error('UI', 'Failed to open JournalStructureModal');
                        });
                    } catch (e) {
                        this.logger?.error('UI', 'Error opening JournalStructureModal', e instanceof Error ? e : new Error(String(e)));
                    }
                }
            }
        );
        this.ribbonIcons.push(this.journalManagerRibbonEl);
        
        // Add metrics guide button
        // @ts-ignore - Obsidian typings aren't fully accurate
        const metricsGuideRibbonEl = this.plugin.addRibbonIcon(
            'lucide-scroll-text',
            'Dream Metrics Reference',
            () => {
                // Use ModalsManager instead of the removed showMetricsTabsModal method
                try {
                    const modalsManager = new ModalsManager(this.app, this.plugin as any, this.logger);
                    modalsManager.openMetricsTabsModal();
                } catch (e) {
                    this.logger?.error('UI', 'Error opening Metrics Tabs Modal', e instanceof Error ? e : new Error(String(e)));
                }
            }
        );
        this.ribbonIcons.push(metricsGuideRibbonEl);
        
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