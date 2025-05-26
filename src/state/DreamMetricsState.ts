import { DreamMetric, DreamMetricData, DreamMetricsSettings } from '../types/core';
import { SettingsAdapter } from './adapters/SettingsAdapter';

export class DreamMetricsState {
    private expandedStates: Map<string, boolean> = new Map();
    private metrics: Record<string, DreamMetric> = {};
    private dreamEntries: DreamMetricData[] = [];
    private listeners: Set<() => void> = new Set();
    private settings: DreamMetricsSettings;
    private settingsAdapter: SettingsAdapter;

    constructor(settings?: Partial<DreamMetricsSettings>) {
        this.expandedStates = new Map();
        
        // Create settings adapter and get standardized settings
        this.settingsAdapter = new SettingsAdapter(settings);
        this.settings = this.settingsAdapter.toCoreSettings();
        
        // Use settings from adapted object
        this.metrics = this.settings.metrics || {};
        this.dreamEntries = [];
        this.listeners = new Set();
        
        // Initialize expanded states if available from settings
        if (this.settings.expandedStates) {
            Object.entries(this.settings.expandedStates).forEach(([key, value]) => {
                this.expandedStates.set(key, value);
            });
        }
    }

    toggleExpandedState(contentId: string, isExpanded: boolean): void {
        this.expandedStates.set(contentId, isExpanded);
        
        // Update settings with current expanded states
        if (!this.settings.expandedStates) {
            this.settings.expandedStates = {};
        }
        
        this.settings.expandedStates[contentId] = isExpanded;
        this.notifyListeners();
    }

    getExpandedState(contentId: string): boolean {
        return this.expandedStates.get(contentId) || false;
    }

    updateMetrics(metrics: Record<string, DreamMetric>): void {
        this.metrics = metrics;
        this.settings.metrics = metrics;
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

    getSettings(): DreamMetricsSettings {
        return this.settings;
    }

    getSettingsAdapter(): SettingsAdapter {
        return this.settingsAdapter;
    }

    updateSettings(settings: Partial<DreamMetricsSettings>): void {
        // Create a new adapter with updated settings
        this.settingsAdapter = new SettingsAdapter({
            ...this.settings,
            ...settings
        });
        
        // Get standardized settings
        this.settings = this.settingsAdapter.toCoreSettings();
        
        // Update local metrics reference
        this.metrics = this.settings.metrics || {};
        
        this.notifyListeners();
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }
} 