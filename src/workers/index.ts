// Web Worker Architecture - Phase 1 Core Components
// Exports for main thread integration

// Core Architecture
export { TypedWorkerManager } from './WorkerManager';
export { DateNavigatorWorkerManager } from './DateNavigatorWorkerManager';

// Message Protocol & Types
export * from './types';

// Testing Infrastructure (Development)
export { WebWorkerTestModal } from './ui/WebWorkerTestModal';
export { addWorkerTestCommand } from './ui/WorkerTestCommand';

// Worker implementations
// Note: The actual worker script will be bundled separately in later phases
// export { default as DateFilterWorker } from './date-filter-worker'; 