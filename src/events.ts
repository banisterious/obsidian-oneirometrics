import { Events } from 'obsidian';

// Event data types
export interface EntriesFilteredEventData {
    entries: any[];
    totalCount: number;
    filteredCount: number;
}

export interface DateRangeUpdatedEventData {
    startDate: Date | null;
    endDate: Date | null;
}

export type EventData = 
    EntriesFilteredEventData | 
    DateRangeUpdatedEventData | 
    any;

export type EventType = 
    'entries:updated' | 
    'entries:filtered' | 
    'metrics:updated' | 
    'dateRange:updated';

export class OneiroMetricsEvents extends Events {
    private static instance: OneiroMetricsEvents;

    private constructor() {
        super();
    }

    public static getInstance(): OneiroMetricsEvents {
        if (!OneiroMetricsEvents.instance) {
            OneiroMetricsEvents.instance = new OneiroMetricsEvents();
        }
        return OneiroMetricsEvents.instance;
    }
    
    /**
     * Emit an event with data
     * @param event The event name to trigger
     * @param data The data to send with the event
     */
    public emit(event: EventType, data?: EventData): void {
        this.trigger(event, data);
    }
    
    /**
     * Register a callback for an event
     * @param event The event to listen for
     * @param callback The callback to execute when the event occurs
     * @returns A function to remove the event listener
     */
    public on(event: EventType, callback: (data?: EventData) => void): () => void {
        super.on(event, callback);
        return () => this.off(event, callback);
    }
} 