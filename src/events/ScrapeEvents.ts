/**
 * ScrapeEvents
 * 
 * Event system for scraping operations to enable real-time feedback
 * without tight coupling between UI and processing components.
 */

export interface ScrapeEventData {
    progress?: number;
    fileName?: string;
    filesProcessed?: number;
    totalFiles?: number;
    onProceed?: () => void;
    onCancel?: () => void;
    error?: Error;
    processingTime?: number;
    entriesFound?: number;
    isHandled?: boolean; // Flag to prevent multiple handlers from processing the same event
}

export interface ScrapeEvent {
    type: 'started' | 'progress' | 'file-processed' | 'backup-warning' | 'completed' | 'error';
    message: string;
    data?: ScrapeEventData;
    timestamp: number;
}

export type ScrapeEventListener = (event: ScrapeEvent) => void;

/**
 * Event types for scraping operations
 */
export const SCRAPE_EVENTS = {
    STARTED: 'started' as const,
    PROGRESS: 'progress' as const,
    FILE_PROCESSED: 'file-processed' as const,
    BACKUP_WARNING: 'backup-warning' as const,
    COMPLETED: 'completed' as const,
    ERROR: 'error' as const
} as const;

export type ScrapeEventType = typeof SCRAPE_EVENTS[keyof typeof SCRAPE_EVENTS];

/**
 * Create a standardized scrape event
 */
export function createScrapeEvent(
    type: ScrapeEventType,
    message: string,
    data?: ScrapeEventData
): ScrapeEvent {
    return {
        type,
        message,
        data,
        timestamp: Date.now()
    };
}

/**
 * Simple event emitter for scrape operations
 * Uses Obsidian's Component events system for lifecycle management
 */
export class ScrapeEventEmitter {
    private listeners: Map<ScrapeEventType, Set<ScrapeEventListener>> = new Map();

    /**
     * Add event listener
     */
    on(eventType: ScrapeEventType, listener: ScrapeEventListener): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(listener);
    }

    /**
     * Remove event listener
     */
    off(eventType: ScrapeEventType, listener: ScrapeEventListener): void {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            listeners.delete(listener);
            if (listeners.size === 0) {
                this.listeners.delete(eventType);
            }
        }
    }

    /**
     * Emit event to all listeners
     */
    emit(event: ScrapeEvent): void {
        const listeners = this.listeners.get(event.type);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    // Use safeLogger instead of console.error to comply with Obsidian guidelines
                    import('../logging/safe-logger').then(({ default: safeLogger }) => {
                        safeLogger.error('ScrapeEvents', `Error in scrape event listener for ${event.type}:`, error as Error);
                    });
                }
            });
        }
    }

    /**
     * Remove all listeners
     */
    removeAllListeners(): void {
        this.listeners.clear();
    }

    /**
     * Get count of listeners for debugging
     */
    getListenerCount(eventType?: ScrapeEventType): number {
        if (eventType) {
            return this.listeners.get(eventType)?.size || 0;
        }
        return Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0);
    }
} 