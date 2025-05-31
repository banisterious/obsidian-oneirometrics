/**
 * modals/index.ts
 * 
 * Barrel file for exporting modal components
 */

export { MetricsDescriptionsModal } from './MetricsDescriptionsModal';
export { MetricsCalloutCustomizationsModal } from './MetricsCalloutCustomizationsModal';
export { ModalsManager } from './ModalsManager';
export { createModal, createProgressModal, createConfirmationModal } from './ModalFactory';
export type { ModalConfig } from './ModalFactory';
export { DateSelectionModal } from './DateSelectionModal';