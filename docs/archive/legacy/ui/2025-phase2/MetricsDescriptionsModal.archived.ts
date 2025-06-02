/**
 * ARCHIVED FILE - NO LONGER IN USE
 * 
 * This file has been archived as of 2025-06-01 during the HubModal rename and consolidation project
 * 
 * MIGRATION: MetricsDescriptionsModal → HubModal "Reference Overview" Tab + Individual Metric Tabs
 * - All functionality moved to: src/dom/modals/HubModal.ts 
 * - Detailed descriptions: HubModal.getDetailedDescription() method
 * - Scoring tables: HubModal.getScoringTable() method  
 * - Sources content: HubModal Reference Overview tab
 * - Individual metric content: HubModal individual metric tabs
 * - Access via: OneiroMetrics Hub → Reference Overview tab or individual metric tabs
 * 
 * DO NOT USE THIS FILE - It is preserved for reference only
 * 
 * Original functionality:
 * - Comprehensive metric descriptions and explanations
 * - Detailed scoring rubrics for each metric
 * - Sources and inspirations content
 * - Icon integration with metric headings
 * - Markdown rendering for rich content display
 * 
 * The HubModal now provides superior organization of this content with:
 * - Tabbed interface for better navigation
 * - Individual metric tabs for focused viewing
 * - Integrated with other plugin functionality
 * - Better performance through selective content loading
 * - Consistent styling with the rest of the hub interface
 */

import { App, Modal, MarkdownRenderer } from 'obsidian';
import { lucideIconMap } from '../../../settings';
import DreamMetricsPlugin from '../../../main';
import { HubModal } from './HubModal';
import { ModalsManager } from './ModalsManager';

/**
 * @deprecated Use HubModal instead
 * @see HubModal.loadOverviewContent() for sources content
 * @see HubModal.loadMetricContent() for individual metric descriptions
 */
export class MetricsDescriptionsModal extends Modal {
    constructor(
        app: App,
        private plugin: DreamMetricsPlugin
    ) {
        super(app);
    }

    onOpen() {
        // This modal is no longer used - redirect to HubModal
        console.warn('MetricsDescriptionsModal is deprecated. Use HubModal instead.');
        
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-metrics-descriptions-modal');
        
        // Show migration notice
        contentEl.createEl('h1', { text: 'Content Moved' });
        contentEl.createEl('p', { 
            text: 'The metrics descriptions have been moved to the OneiroMetrics Hub for better organization and navigation.' 
        });
        
        // Add button to open HubModal
        const openHubBtn = contentEl.createEl('button', {
            text: 'Open OneiroMetrics Hub',
            cls: 'mod-cta'
        });
        
        openHubBtn.addEventListener('click', () => {
            try {
                this.close();
                const modalsManager = new ModalsManager(this.app, this.plugin, null);
                modalsManager.openHubModal();
            } catch (error) {
                console.error('Error opening HubModal:', error);
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    // All other methods removed - functionality moved to HubModal
} 