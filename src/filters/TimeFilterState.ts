import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricData } from '../types';

export interface TimeRange {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
}

export class TimeFilterState {
    private state: DreamMetricsState;
    private timeRange: TimeRange | null = null;
    private originalEntries: DreamMetricData[] = [];

    constructor(state: DreamMetricsState) {
        this.state = state;
    }

    public setTimeRange(timeRange: TimeRange | null): void {
        this.timeRange = timeRange;
        this.applyFilter();
    }

    public getTimeRange(): TimeRange | null {
        return this.timeRange;
    }

    private applyFilter(): void {
        if (!this.timeRange) {
            // Reset to original entries
            this.state.updateDreamEntries(this.originalEntries);
            return;
        }

        const entries = this.state.getDreamEntries();
        const filteredEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            const entryHour = entryDate.getHours();
            const entryMinute = entryDate.getMinutes();

            // Convert to minutes for easier comparison
            const entryTimeInMinutes = entryHour * 60 + entryMinute;
            const startTimeInMinutes = this.timeRange!.startHour * 60 + this.timeRange!.startMinute;
            const endTimeInMinutes = this.timeRange!.endHour * 60 + this.timeRange!.endMinute;

            // Handle case where end time is on the next day
            if (endTimeInMinutes < startTimeInMinutes) {
                return entryTimeInMinutes >= startTimeInMinutes || entryTimeInMinutes <= endTimeInMinutes;
            }

            return entryTimeInMinutes >= startTimeInMinutes && entryTimeInMinutes <= endTimeInMinutes;
        });

        this.state.updateDreamEntries(filteredEntries);
    }

    public storeOriginalEntries(entries: DreamMetricData[]): void {
        this.originalEntries = [...entries];
    }

    public clearFilter(): void {
        this.timeRange = null;
        this.state.updateDreamEntries(this.originalEntries);
    }
} 