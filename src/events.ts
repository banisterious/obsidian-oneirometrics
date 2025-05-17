import { Events } from 'obsidian';

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
} 