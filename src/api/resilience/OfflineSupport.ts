/**
 * OfflineSupport - Provides capabilities for offline operation
 * 
 * Manages offline detection, queuing of operations for later execution,
 * and synchronization when connectivity is restored.
 */

import safeLogger from '../../logging/safe-logger';
import { withErrorHandling } from '../../utils/defensive-utils';

/**
 * Represents an operation that can be performed offline
 */
export interface OfflineOperation<T> {
  /** Unique identifier for the operation */
  id: string;
  
  /** The type of operation */
  type: string;
  
  /** Payload for the operation */
  payload: any;
  
  /** Time when the operation was created */
  timestamp: number;
  
  /** Number of synchronization attempts */
  attempts: number;
  
  /** Time of the last synchronization attempt */
  lastAttempt?: number;
  
  /** Whether the operation can be merged with others */
  mergeable: boolean;
  
  /** Priority of the operation (higher is more important) */
  priority: number;
  
  /** Function to execute the operation */
  execute: () => Promise<T>;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Status of the network connection
 */
export enum ConnectionStatus {
  /** Online and connected */
  ONLINE = 'online',
  
  /** Offline or disconnected */
  OFFLINE = 'offline',
  
  /** Connection status unknown */
  UNKNOWN = 'unknown'
}

/**
 * Strategy for merging operations
 */
export enum MergeStrategy {
  /** Keep only the latest operation */
  LATEST_ONLY = 'latest_only',
  
  /** Merge operations into a single operation */
  COMBINE = 'combine',
  
  /** Keep all operations as separate items */
  KEEP_ALL = 'keep_all'
}

/**
 * Options for configuring offline support
 */
export interface OfflineSupportOptions {
  /** Storage key prefix for offline operations */
  storageKeyPrefix?: string;
  
  /** Maximum number of queued operations */
  maxQueueSize?: number;
  
  /** Maximum age of queued operations in milliseconds */
  maxOperationAge?: number;
  
  /** Whether to automatically sync when going online */
  autoSync?: boolean;
  
  /** Polling interval for checking connection status in milliseconds */
  connectionCheckInterval?: number;
  
  /** Default merge strategy for operations */
  defaultMergeStrategy?: MergeStrategy;
  
  /** Function to check if the application is online */
  isOnlineCheck?: () => Promise<boolean>;
}

/**
 * Default options for offline support
 */
const DEFAULT_OPTIONS: OfflineSupportOptions = {
  storageKeyPrefix: 'oomp_offline_',
  maxQueueSize: 100,
  maxOperationAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  autoSync: true,
  connectionCheckInterval: 30000, // 30 seconds
  defaultMergeStrategy: MergeStrategy.LATEST_ONLY
};

/**
 * Event types for offline support
 */
export enum OfflineEventType {
  /** Emitted when an operation is queued */
  OPERATION_QUEUED = 'operation_queued',
  
  /** Emitted when an operation is dequeued */
  OPERATION_DEQUEUED = 'operation_dequeued',
  
  /** Emitted when an operation is successfully synchronized */
  OPERATION_SYNCED = 'operation_synced',
  
  /** Emitted when an operation fails to synchronize */
  OPERATION_SYNC_FAILED = 'operation_sync_failed',
  
  /** Emitted when the connection status changes */
  CONNECTION_STATUS_CHANGED = 'connection_status_changed',
  
  /** Emitted when synchronization starts */
  SYNC_STARTED = 'sync_started',
  
  /** Emitted when synchronization completes */
  SYNC_COMPLETED = 'sync_completed'
}

/**
 * Type for an offline support event handler
 */
type OfflineEventHandler = (eventType: OfflineEventType, data: any) => void;

/**
 * Type for the sync result
 */
export interface SyncResult {
  /** The number of operations that were successful */
  successCount: number;
  
  /** The number of operations that failed */
  failureCount: number;
  
  /** The total number of operations processed */
  totalCount: number;
  
  /** The operations that were successful */
  successfulOperations: OfflineOperation<any>[];
  
  /** The operations that failed */
  failedOperations: OfflineOperation<any>[];
}

/**
 * Provides support for offline operation capabilities
 */
export class OfflineSupport {
  /** Configuration options */
  private options: OfflineSupportOptions;
  
  /** The current connection status */
  private connectionStatus: ConnectionStatus = ConnectionStatus.UNKNOWN;
  
  /** Queue of offline operations */
  private operationQueue: OfflineOperation<any>[] = [];
  
  /** Whether synchronization is in progress */
  private isSyncing: boolean = false;

  /** Timer for checking connection status */
  private connectionCheckTimer?: number;

  /** Event handlers */
  private eventHandlers: Map<OfflineEventType, OfflineEventHandler[]> = new Map();
  
  /**
   * Creates a new OfflineSupport with the specified options
   * 
   * @param options Configuration options
   */
  constructor(options: OfflineSupportOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initializes the offline support
   */
  private initialize = withErrorHandling(
    async (): Promise<void> => {
      // Load queued operations from storage
      await this.loadQueuedOperations();
      
      // Set up connection check
      this.startConnectionChecking();
      
      // Check initial connection status
      this.checkConnectionStatus();
      
      // Set up online/offline event listeners
      if (typeof window !== 'undefined') {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
      }
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error initializing offline support', error);
    }
  );
  
  /**
   * Handles the online event
   */
  private handleOnline = withErrorHandling(
    (): void => {
      if (this.connectionStatus !== ConnectionStatus.ONLINE) {
        this.setConnectionStatus(ConnectionStatus.ONLINE);
        
        // Auto-sync if enabled
        if (this.options.autoSync) {
          this.syncOperations();
        }
      }
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error handling online event', error);
    }
  );
  
  /**
   * Handles the offline event
   */
  private handleOffline = withErrorHandling(
    (): void => {
      if (this.connectionStatus !== ConnectionStatus.OFFLINE) {
        this.setConnectionStatus(ConnectionStatus.OFFLINE);
      }
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error handling offline event', error);
    }
  );
  
  /**
   * Starts checking connection status periodically
   */
  private startConnectionChecking = withErrorHandling(
    (): void => {
      if (this.connectionCheckTimer) {
        clearInterval(this.connectionCheckTimer);
      }

      this.connectionCheckTimer = window.setInterval(() => {
        this.checkConnectionStatus();
      }, this.options.connectionCheckInterval || DEFAULT_OPTIONS.connectionCheckInterval!);
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error starting connection checking', error);
    }
  );
  
  /**
   * Checks the current connection status
   */
  private checkConnectionStatus = withErrorHandling(
    async (): Promise<void> => {
      try {
        let isOnline = false;
        
        // Use custom online check if provided
        if (this.options.isOnlineCheck) {
          isOnline = await this.options.isOnlineCheck();
        } else {
          // Use navigator.onLine as a fallback
          isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        }
        
        const newStatus = isOnline ? ConnectionStatus.ONLINE : ConnectionStatus.OFFLINE;
        
        if (newStatus !== this.connectionStatus) {
          this.setConnectionStatus(newStatus);
          
          // Auto-sync if going online and auto-sync is enabled
          if (newStatus === ConnectionStatus.ONLINE && this.options.autoSync) {
            this.syncOperations();
          }
        }
      } catch (error) {
        // If we can't determine status, assume we're offline
        if (this.connectionStatus !== ConnectionStatus.OFFLINE) {
          this.setConnectionStatus(ConnectionStatus.OFFLINE);
        }
      }
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error checking connection status', error);
    }
  );
  
  /**
   * Sets the connection status and emits an event
   * 
   * @param status The new connection status
   */
  private setConnectionStatus = withErrorHandling(
    (status: ConnectionStatus): void => {
      if (this.connectionStatus === status) {
        return;
      }
      
      const oldStatus = this.connectionStatus;
      this.connectionStatus = status;
      
      safeLogger.info('OfflineSupport', `Connection status changed from ${oldStatus} to ${status}`);
      
      this.emitEvent(OfflineEventType.CONNECTION_STATUS_CHANGED, {
        oldStatus,
        newStatus: status
      });
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error setting connection status', error);
    }
  );
  
  /**
   * Loads queued operations from storage
   */
  private loadQueuedOperations = withErrorHandling(
    async (): Promise<void> => {
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      try {
        const storageKey = this.getOperationQueueStorageKey();
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const parsed = JSON.parse(storedData);
          
          if (Array.isArray(parsed)) {
            // Filter out expired operations
            const maxAge = this.options.maxOperationAge || DEFAULT_OPTIONS.maxOperationAge!;
            const now = Date.now();
            
            this.operationQueue = parsed.filter(op => {
              return now - op.timestamp <= maxAge;
            });
            
            // Sort by priority (higher first) and then by timestamp (older first)
            this.operationQueue.sort((a, b) => {
              if (a.priority !== b.priority) {
                return b.priority - a.priority;
              }
              return a.timestamp - b.timestamp;
            });
            
            safeLogger.info('OfflineSupport', `Loaded ${this.operationQueue.length} queued operations`);
          }
        }
      } catch (error) {
        safeLogger.error('OfflineSupport', 'Error loading queued operations', error);
      }
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error in loadQueuedOperations', error);
    }
  );
  
  /**
   * Saves the operation queue to storage
   */
  private saveOperationQueue = withErrorHandling(
    (): void => {
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      try {
        const storageKey = this.getOperationQueueStorageKey();
        const dataToStore = JSON.stringify(this.operationQueue);
        
        localStorage.setItem(storageKey, dataToStore);
      } catch (error) {
        safeLogger.error('OfflineSupport', 'Error saving operation queue', error);
      }
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error in saveOperationQueue', error);
    }
  );
  
  /**
   * Gets the storage key for the operation queue
   * 
   * @returns The storage key
   */
  private getOperationQueueStorageKey(): string {
    return `${this.options.storageKeyPrefix || DEFAULT_OPTIONS.storageKeyPrefix}operation_queue`;
  }
  
  /**
   * Enqueues an operation for later execution
   * 
   * @param operation The operation to enqueue
   */
  enqueueOperation<T>(operation: Partial<OfflineOperation<T>>): string {
    const now = Date.now();
    
    // Generate an ID if not provided
    const id = operation.id || `${now}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create a complete operation object
    const completeOperation: OfflineOperation<T> = {
      id,
      type: operation.type || 'unknown',
      payload: operation.payload || {},
      timestamp: now,
      attempts: 0,
      mergeable: operation.mergeable !== undefined ? operation.mergeable : false,
      priority: operation.priority !== undefined ? operation.priority : 0,
      execute: operation.execute || (() => Promise.resolve(null as unknown as T)),
      metadata: operation.metadata || {}
    };
    
    // Apply merge strategy if operation is mergeable
    if (completeOperation.mergeable) {
      this.applyMergeStrategy(completeOperation);
    } else {
      // Otherwise just add to queue
      this.operationQueue.push(completeOperation);
    }
    
    // Ensure queue doesn't exceed maximum size
    this.enforceQueueSize();
    
    // Save the updated queue
    this.saveOperationQueue();
    
    // Emit event
    this.emitEvent(OfflineEventType.OPERATION_QUEUED, {
      operation: completeOperation
    });
    
    safeLogger.info('OfflineSupport', `Operation enqueued: ${completeOperation.id} (${completeOperation.type})`, {
      payload: completeOperation.payload
    });
    
    return id;
  }
  
  /**
   * Applies the merge strategy to a new operation
   * 
   * @param newOperation The new operation to merge
   */
  private applyMergeStrategy = withErrorHandling(
    <T>(newOperation: OfflineOperation<T>): void => {
      const strategy = this.options.defaultMergeStrategy || DEFAULT_OPTIONS.defaultMergeStrategy!;
      
      // Find existing operations of the same type
      const existingOperations = this.operationQueue.filter(op => 
        op.type === newOperation.type && op.mergeable
      );
      
      if (existingOperations.length === 0) {
        // No existing operations to merge with
        this.operationQueue.push(newOperation);
        return;
      }
      
      // Apply the merge strategy
      switch (strategy) {
        case MergeStrategy.LATEST_ONLY:
          // Remove existing operations of the same type
          this.operationQueue = this.operationQueue.filter(op => 
            !(op.type === newOperation.type && op.mergeable)
          );
          // Add the new operation
          this.operationQueue.push(newOperation);
          break;
          
        case MergeStrategy.COMBINE:
          // Combine operations (implementation depends on operation type)
          // For now, we just remove the old ones and add the new one
          this.operationQueue = this.operationQueue.filter(op => 
            !(op.type === newOperation.type && op.mergeable)
          );
          this.operationQueue.push(newOperation);
          break;
          
        case MergeStrategy.KEEP_ALL:
        default:
          // Just add the new operation
          this.operationQueue.push(newOperation);
          break;
      }
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error applying merge strategy', error);
    }
  );
  
  /**
   * Enforces the maximum queue size
   */
  private enforceQueueSize = withErrorHandling(
    (): void => {
      const maxSize = this.options.maxQueueSize || DEFAULT_OPTIONS.maxQueueSize!;
      
      if (this.operationQueue.length <= maxSize) {
        return;
      }
      
      // Sort by priority (higher first) and then by timestamp (newer first for removal)
      this.operationQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.timestamp - a.timestamp;
      });
      
      // Remove the lowest priority/oldest operations
      this.operationQueue = this.operationQueue.slice(0, maxSize);
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error enforcing queue size', error);
    }
  );
  
  /**
   * Synchronizes queued operations with the server
   * 
   * @returns The result of the synchronization
   */
  async syncOperations(): Promise<SyncResult> {
    // Don't sync if already syncing or if offline
    if (this.isSyncing || this.connectionStatus !== ConnectionStatus.ONLINE) {
      return {
        successCount: 0,
        failureCount: 0,
        totalCount: 0,
        successfulOperations: [],
        failedOperations: []
      };
    }
    
    // No operations to sync
    if (this.operationQueue.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        totalCount: 0,
        successfulOperations: [],
        failedOperations: []
      };
    }
    
    this.isSyncing = true;
    
    // Emit sync started event
    this.emitEvent(OfflineEventType.SYNC_STARTED, {
      operationCount: this.operationQueue.length
    });
    
    safeLogger.info('OfflineSupport', `Starting sync of ${this.operationQueue.length} operations`);
    
    const successfulOperations: OfflineOperation<any>[] = [];
    const failedOperations: OfflineOperation<any>[] = [];
    
    // Create a copy of the queue to avoid modification during iteration
    const operations = [...this.operationQueue];
    
    // Process each operation
    for (const operation of operations) {
      try {
        // Update attempt count and timestamp
        operation.attempts++;
        operation.lastAttempt = Date.now();
        
        // Execute the operation
        await operation.execute();
        
        // Operation succeeded
        successfulOperations.push(operation);
        
        // Remove from queue
        this.operationQueue = this.operationQueue.filter(op => op.id !== operation.id);
        
        // Emit success event
        this.emitEvent(OfflineEventType.OPERATION_SYNCED, {
          operation
        });
        
        safeLogger.info('OfflineSupport', `Operation synced successfully: ${operation.id} (${operation.type})`);
      } catch (error) {
        // Operation failed
        failedOperations.push(operation);
        
        // Emit failure event
        this.emitEvent(OfflineEventType.OPERATION_SYNC_FAILED, {
          operation,
          error
        });
        
        safeLogger.warn('OfflineSupport', `Operation sync failed: ${operation.id} (${operation.type})`, {
          error: error instanceof Error ? error.message : String(error),
          attempts: operation.attempts
        });
      }
    }
    
    // Save the updated queue
    this.saveOperationQueue();
    
    const result: SyncResult = {
      successCount: successfulOperations.length,
      failureCount: failedOperations.length,
      totalCount: operations.length,
      successfulOperations,
      failedOperations
    };
    
    // Emit sync completed event
    this.emitEvent(OfflineEventType.SYNC_COMPLETED, result);
    
    safeLogger.info('OfflineSupport', `Sync completed: ${result.successCount} succeeded, ${result.failureCount} failed`);
    
    this.isSyncing = false;
    
    return result;
  }
  
  /**
   * Gets the current connection status
   * 
   * @returns The current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
  
  /**
   * Gets the queued operations
   * 
   * @returns The queued operations
   */
  getQueuedOperations(): OfflineOperation<any>[] {
    return [...this.operationQueue];
  }
  
  /**
   * Removes an operation from the queue
   * 
   * @param id The ID of the operation to remove
   * @returns True if the operation was removed
   */
  removeOperation(id: string): boolean {
    const initialLength = this.operationQueue.length;
    
    this.operationQueue = this.operationQueue.filter(op => op.id !== id);
    
    const wasRemoved = initialLength > this.operationQueue.length;
    
    if (wasRemoved) {
      this.saveOperationQueue();
      
      // Emit event
      this.emitEvent(OfflineEventType.OPERATION_DEQUEUED, {
        operationId: id
      });
      
      safeLogger.info('OfflineSupport', `Operation removed from queue: ${id}`);
    }
    
    return wasRemoved;
  }
  
  /**
   * Clears all queued operations
   */
  clearQueue(): void {
    const count = this.operationQueue.length;
    this.operationQueue = [];
    this.saveOperationQueue();
    
    safeLogger.info('OfflineSupport', `Cleared ${count} operations from queue`);
  }
  
  /**
   * Adds an event handler
   * 
   * @param eventType The event type to listen for
   * @param handler The handler function
   */
  addEventListener(eventType: OfflineEventType, handler: OfflineEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
  }
  
  /**
   * Removes an event handler
   * 
   * @param eventType The event type to remove the handler from
   * @param handler The handler function to remove
   */
  removeEventListener(eventType: OfflineEventType, handler: OfflineEventHandler): void {
    if (this.eventHandlers.has(eventType)) {
      const handlers = this.eventHandlers.get(eventType)!;
      const index = handlers.indexOf(handler);
      
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  /**
   * Emits an event to all listeners
   * 
   * @param eventType The event type to emit
   * @param data The event data
   */
  private emitEvent = withErrorHandling(
    (eventType: OfflineEventType, data: any): void => {
      if (this.eventHandlers.has(eventType)) {
        const handlers = this.eventHandlers.get(eventType)!;
        
        for (const handler of handlers) {
          try {
            handler(eventType, data);
          } catch (error) {
            safeLogger.error('OfflineSupport', 'Error in event handler', error);
          }
        }
      }
    },
    undefined,
    (error) => {
      safeLogger.error('OfflineSupport', 'Error emitting event', error);
    }
  );
  
  /**
   * Disposes of resources
   */
  dispose(): void {
    if (this.connectionCheckTimer) {
      clearInterval(this.connectionCheckTimer);
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    this.eventHandlers.clear();
    
    safeLogger.info('OfflineSupport', 'Disposed');
  }
  
  /**
   * Creates an OfflineSupport instance with default options
   * 
   * @param options Configuration options
   * @returns A new OfflineSupport instance
   */
  static create(options: OfflineSupportOptions = {}): OfflineSupport {
    return new OfflineSupport(options);
  }
} 