/**
 * ModalsManager
 * 
 * Centralized manager for modal creation and management throughout the application.
 * This class coordinates modal creation, tracks active modals, and provides
 * utility methods for common modal operations.
 */

import { App, Modal, Notice } from 'obsidian';
import { ILogger } from '../../logging/LoggerTypes';
import DreamMetricsPlugin from '../../../main';
import { CustomDateRangeModal } from './CustomDateRangeModal';
import { MetricsTabsModal } from './MetricsTabsModal';
import { MetricsDescriptionsModal } from './MetricsDescriptionsModal';
import { MetricsCalloutCustomizationsModal } from './MetricsCalloutCustomizationsModal';
import { createModal, createProgressModal, createConfirmationModal, ModalConfig } from './ModalFactory';

/**
 * ModalsManager class for centralized modal creation and management
 */
export class ModalsManager {
    // Track active modals by type
    private activeModals: Map<string, Modal> = new Map();
    
    /**
     * Create a new ModalsManager instance
     * 
     * @param app Obsidian App instance
     * @param plugin Plugin instance
     * @param logger Optional logger for debugging
     */
    constructor(
        private app: App,
        private plugin: DreamMetricsPlugin,
        private logger?: ILogger
    ) {
        this.logger?.debug('UI', 'ModalsManager initialized');
    }
    
    /**
     * Open a modal and track it
     * 
     * @param modal The modal to open
     * @param modalType Optional identifier for the modal type
     * @returns The opened modal
     */
    public openModal(modal: Modal, modalType?: string): Modal {
        try {
            // If a modal type is provided, track this modal
            if (modalType) {
                // If there's already an active modal of this type, close it first
                if (this.activeModals.has(modalType)) {
                    this.logger?.debug('UI', `Closing existing modal of type: ${modalType}`);
                    this.activeModals.get(modalType)?.close();
                }
                
                // Track this modal
                this.activeModals.set(modalType, modal);
                
                // Setup cleanup when modal is closed
                const originalOnClose = modal.onClose;
                modal.onClose = () => {
                    if (originalOnClose) {
                        originalOnClose.call(modal);
                    }
                    
                    // Remove from tracking when closed
                    if (this.activeModals.get(modalType) === modal) {
                        this.activeModals.delete(modalType);
                        this.logger?.debug('UI', `Modal of type ${modalType} removed from tracking`);
                    }
                };
            }
            
            // Open the modal
            modal.open();
            this.logger?.debug('UI', `Opened modal${modalType ? ` of type: ${modalType}` : ''}`);
            
            return modal;
        } catch (error) {
            this.logger?.error('UI', `Error opening modal${modalType ? ` of type: ${modalType}` : ''}`, error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    
    /**
     * Create and open a basic modal with standardized configuration
     * 
     * @param config Modal configuration
     * @param modalType Optional identifier for the modal type
     * @returns The created and opened modal
     */
    public createAndOpenModal(config: ModalConfig, modalType?: string): Modal {
        const modal = createModal(this.app, config);
        return this.openModal(modal, modalType);
    }
    
    /**
     * Create and open a progress modal
     * 
     * @param config Modal configuration
     * @param modalType Optional identifier for the modal type
     * @returns The progress modal objects
     */
    public createAndOpenProgressModal(config: ModalConfig, modalType?: string) {
        const progressModal = createProgressModal(this.app, config);
        this.openModal(progressModal.modal, modalType);
        return progressModal;
    }
    
    /**
     * Show a confirmation modal
     * 
     * @param options Confirmation modal options
     * @returns Promise that resolves to true if confirmed, false otherwise
     */
    public async showConfirmation(options: {
        title?: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        className?: string;
        dangerous?: boolean;
    }): Promise<boolean> {
        return createConfirmationModal(this.app, options);
    }
    
    /**
     * Open the metrics tabs modal
     * 
     * @returns The opened modal
     */
    public openMetricsTabsModal(): Modal {
        const modal = new MetricsTabsModal(this.app, this.plugin);
        return this.openModal(modal, 'metrics-tabs');
    }
    
    /**
     * Open the metrics descriptions modal
     * 
     * @returns The opened modal
     */
    public openMetricsDescriptionsModal(): Modal {
        try {
            const modal = new MetricsDescriptionsModal(this.app, this.plugin);
            return this.openModal(modal, 'metrics-descriptions');
        } catch (error) {
            this.logger?.error('UI', 'Error opening metrics descriptions modal', error instanceof Error ? error : new Error(String(error)));
            new Notice('Error opening metrics descriptions. See console for details.');
            throw error;
        }
    }
    
    /**
     * Open the custom date range modal
     * 
     * @param callback Optional callback function that receives start date, end date, and optional save name
     * @param favorites Optional record of favorite date ranges
     * @param deleteFavorite Optional function to delete a favorite
     * @returns The opened modal
     */
    public openCustomDateRangeModal(
        callback?: (start: string, end: string, saveName?: string) => void,
        favorites: Record<string, { start: string, end: string }> = {},
        deleteFavorite: (name: string) => void = () => {}
    ): Modal {
        const modal = new CustomDateRangeModal(this.app, callback || (() => {}), favorites, deleteFavorite);
        return this.openModal(modal, 'custom-date-range');
    }
    
    /**
     * Open the metrics callout customizations modal
     * 
     * @returns The opened modal
     */
    public openMetricsCalloutCustomizationsModal(): Modal {
        const modal = new MetricsCalloutCustomizationsModal(this.app, this.plugin);
        return this.openModal(modal, 'metrics-callout-customizations');
    }
    
    /**
     * Close all active modals
     */
    public closeAllModals(): void {
        this.logger?.debug('UI', `Closing all active modals (${this.activeModals.size})`);
        
        // Create a copy of the values to avoid modification during iteration
        const modalsToClose = Array.from(this.activeModals.values());
        
        // Close each modal
        modalsToClose.forEach(modal => {
            try {
                modal.close();
            } catch (error) {
                this.logger?.error('UI', 'Error closing modal', error instanceof Error ? error : new Error(String(error)));
            }
        });
        
        // Clear the tracking map
        this.activeModals.clear();
    }
    
    /**
     * Check if a modal of the specified type is currently open
     * 
     * @param modalType The modal type identifier
     * @returns True if a modal of this type is open, false otherwise
     */
    public isModalOpen(modalType: string): boolean {
        return this.activeModals.has(modalType);
    }
    
    /**
     * Get the total number of active modals
     * 
     * @returns The number of active modals
     */
    public getActiveModalCount(): number {
        return this.activeModals.size;
    }
} 