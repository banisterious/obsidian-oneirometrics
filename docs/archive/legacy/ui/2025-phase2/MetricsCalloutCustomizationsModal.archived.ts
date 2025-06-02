/**
 * ARCHIVED FILE - NO LONGER IN USE
 * 
 * This file has been archived as of 2025-06-01 during Phase 2 of the Journal Structure Integration Project
 * 
 * MIGRATION: MetricsCalloutCustomizationsModal → OneiroMetrics Hub "Callout Quick Copy" Tab
 * - All functionality moved to: src/dom/modals/MetricsTabsModal.ts (loadCalloutQuickCopyContent method)
 * - Access via: OneiroMetrics Hub → Callout Quick Copy tab
 * - Settings integration updated to open hub with specific tab
 * 
 * DO NOT USE THIS FILE - It is preserved for reference only
 * 
 * Original functionality:
 * - Callout structure preview with live updates
 * - Copy to clipboard functionality
 * - Single-line vs multi-line toggle
 * - Metadata field customization
 * - Custom styling for preview box and copy button
 * 
 * Migration benefits:
 * - Consolidated UI - all OneiroMetrics features in one place
 * - Consistent navigation and user experience
 * - Reduced modal proliferation
 * - Better integration with existing hub infrastructure
 */

// Original implementation preserved for reference:

import { App, Modal, Notice, Setting } from 'obsidian';
import safeLogger from '../../logging/safe-logger';
import DreamMetricsPlugin from '../../../main';

export class MetricsCalloutCustomizationsModal extends Modal {
    constructor(
        app: App,
        private plugin: DreamMetricsPlugin
    ) {
        super(app);
    }
    
    onOpen() {
        try {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass('oom-callout-modal');
            contentEl.createEl('h2', { text: 'Metrics Callout Customizations' });
            
            // State for the callout structure
            let calloutMetadata = '';
            let singleLine = false;
            
            // Helper to build the callout structure
            const buildCallout = () => {
                const meta = calloutMetadata.trim();
                const metaStr = meta ? `|${meta}` : '';
                const header = `> [!dream-metrics${metaStr}]`;
                const metrics = [
                    'Sensory Detail:',
                    'Emotional Recall:',
                    'Lost Segments:',
                    'Descriptiveness:',
                    'Confidence Score:'
                ];
                if (singleLine) {
                    return `${header}\n> ${metrics.join(' , ')}`;
                } else {
                    return `${header}\n> ${metrics.join(' \n> ')}`;
                }
            };
            
            // Callout Structure Preview (styled div)
            const calloutBox = contentEl.createEl('div', {
                cls: 'oom-callout-structure-box',
            });
            
            // Apply styles
            this.applyCalloutBoxStyles(calloutBox);
            
            // Set initial content
            calloutBox.textContent = buildCallout();
            
            // Copy button
            const copyBtn = contentEl.createEl('button', { text: 'Copy', cls: 'oom-copy-btn' });
            this.applyCopyButtonStyles(copyBtn);
            
            // Add click handler
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(calloutBox.textContent || '');
                new Notice('Copied!');
            };
            
            // Single-Line Toggle
            new Setting(contentEl)
                .setName('Single-Line Callout Structure')
                .setDesc('Show all metric fields on a single line in the callout structure')
                .addToggle(toggle => {
                    toggle.setValue(singleLine)
                        .onChange(async (value) => {
                            singleLine = value;
                            calloutBox.textContent = buildCallout();
                        });
                });
            
            // Callout Metadata Field
            new Setting(contentEl)
                .setName('Callout Metadata')
                .setDesc('Default metadata to include in dream callouts')
                .addText(text => text
                    .setPlaceholder('Enter metadata')
                    .setValue(calloutMetadata)
                    .onChange(async (value) => {
                        calloutMetadata = value;
                        calloutBox.textContent = buildCallout();
                        await this.plugin.saveSettings();
                    }));
        } catch (error) {
            safeLogger.error('UI', 'Error opening metrics callout customizations modal', error as Error);
        }
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    /**
     * Apply styles to the callout box
     */
    private applyCalloutBoxStyles(element: HTMLElement): void {
        element.style.width = '100%';
        element.style.minHeight = '90px';
        element.style.fontFamily = 'var(--font-monospace, monospace)';
        element.style.fontSize = '0.93em';
        element.style.background = '#f5f5f5';
        element.style.border = '1px solid #bbb';
        element.style.borderRadius = '4px';
        element.style.marginBottom = '0.7em';
        element.style.padding = '8px 12px';
        element.style.whiteSpace = 'pre-wrap';
        element.style.wordBreak = 'break-word';
        element.style.userSelect = 'all';
    }
    
    /**
     * Apply styles to the copy button
     */
    private applyCopyButtonStyles(button: HTMLElement): void {
        button.style.fontSize = '0.92em';
        button.style.padding = '2px 10px';
        button.style.borderRadius = '4px';
        button.style.border = '1px solid #bbb';
        button.style.background = '#f5f5f5';
        button.style.cursor = 'pointer';
        button.style.marginBottom = '1em';
    }
} 