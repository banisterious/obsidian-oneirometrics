import { DreamMetric, DreamMetricData, DreamMetricsSettings } from '../types/core';

export class DreamMetricsState {
    private expandedStates: Map<string, boolean> = new Map();
    private metrics: Record<string, DreamMetric> = {};
    private dreamEntries: DreamMetricData[] = [];
    private listeners: Set<() => void> = new Set();
    private settings: DreamMetricsSettings;

    constructor(settings?: Partial<DreamMetricsSettings>) {
        this.expandedStates = new Map();
        // Create default empty settings if none provided
        const defaultSettings: DreamMetricsSettings = {
            projectNote: '',
            selectedNotes: [],
            selectedFolder: '',
            selectionMode: 'notes',
            calloutName: 'dream',
            metrics: {},
            showRibbonButtons: false,
            backupEnabled: false,
            backupFolderPath: '',
            logging: {
                level: 'info'
            }
        };
        
        // Merge provided settings with defaults
        this.settings = {...defaultSettings, ...settings} as DreamMetricsSettings;
        
        // Use settings from merged object
        this.metrics = this.settings.metrics || {};
        this.dreamEntries = [];
        this.listeners = new Set();
    }

    toggleExpandedState(contentId: string, isExpanded: boolean): void {
        this.expandedStates.set(contentId, isExpanded);
        this.notifyListeners();
    }

    getExpandedState(contentId: string): boolean {
        return this.expandedStates.get(contentId) || false;
    }

    updateMetrics(metrics: Record<string, DreamMetric>): void {
        this.metrics = metrics;
        this.notifyListeners();
    }

    updateDreamEntries(entries: DreamMetricData[]): void {
        this.dreamEntries = entries;
        this.notifyListeners();
    }

    getMetrics(): Record<string, DreamMetric> {
        return this.metrics;
    }

    getDreamEntries(): DreamMetricData[] {
        return this.dreamEntries;
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }
} 