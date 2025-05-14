import { DreamMetric, DreamMetricData, DreamMetricsSettings } from '../types';

export class DreamMetricsState {
    private expandedStates: Map<string, boolean> = new Map();
    private metrics: Record<string, DreamMetric> = {};
    private dreamEntries: DreamMetricData[] = [];
    private listeners: Set<() => void> = new Set();
    private settings: DreamMetricsSettings;

    constructor(settings: DreamMetricsSettings) {
        this.expandedStates = new Map();
        this.metrics = settings.metrics;
        this.dreamEntries = [];
        this.listeners = new Set();
        this.settings = settings;
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

    // Debug helper
    getStateSummary(): string {
        return JSON.stringify({
            expandedStatesCount: this.expandedStates.size,
            metricsCount: Object.keys(this.metrics).length,
            dreamEntriesCount: this.dreamEntries.length,
            listenersCount: this.listeners.size
        }, null, 2);
    }

    public saveSettings(): void {
        // Implementation for saving settings
    }

    public loadSettings(): void {
        // Implementation for loading settings
    }
} 