/**
 * modals/index.ts
 * 
 * Barrel file for exporting modal components
 */

export { CustomDateRangeModal } from './CustomDateRangeModal';
export { MetricsDescriptionsModal } from './MetricsDescriptionsModal';
export { MetricsCalloutCustomizationsModal } from './MetricsCalloutCustomizationsModal';
export { ModalsManager } from './ModalsManager';
export { createModal, createProgressModal, createConfirmationModal } from './ModalFactory';
export type { ModalConfig } from './ModalFactory'; 