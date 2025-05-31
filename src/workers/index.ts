// Web Workers Module Exports
// Phase 1: Core Worker Architecture

// Type definitions
export * from './types';

// Core worker management
export { TypedWorkerManager } from './WorkerManager';
export { DateNavigatorWorkerManager } from './DateNavigatorWorkerManager';

// Testing utilities
export { WebWorkerTestModal } from './ui/WebWorkerTestModal';
export { addWorkerTestCommand, addWorkerTestRibbon } from './ui/WorkerTestCommand';

// Worker implementations
// Note: The actual worker script will be bundled separately in later phases
// export { default as DateFilterWorker } from './date-filter-worker'; 