// Web Workers Module Exports
// Phase 1: Core Worker Architecture

// Type definitions
export * from './types';

// Core worker management
export { TypedWorkerManager } from './WorkerManager';
export { DateNavigatorWorkerManager } from './DateNavigatorWorkerManager';

// Worker implementations
// Note: The actual worker script will be bundled separately in later phases
// export { default as DateFilterWorker } from './date-filter-worker'; 