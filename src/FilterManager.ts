export class FilterManager {
    private currentFilter: string | null = null;
    private customRange: { start: Date; end: Date } | null = null;

    constructor() {
        // Initialize with today's filter
        this.setFilter('today');
    }

    setFilter(filterId: string): void {
        this.currentFilter = filterId;
        this.updateRange();
    }

    setCustomRange(start: Date, end: Date): void {
        this.customRange = { start, end };
        this.currentFilter = 'custom';
    }

    getCurrentFilter(): string | null {
        return this.currentFilter;
    }

    getCurrentRange(): { start: Date; end: Date } | null {
        return this.customRange;
    }

    private updateRange(): void {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        switch (this.currentFilter) {
            case 'today':
                this.customRange = { start: startOfDay, end: endOfDay };
                break;
            case 'yesterday':
                const yesterday = new Date(startOfDay);
                yesterday.setDate(yesterday.getDate() - 1);
                const endOfYesterday = new Date(endOfDay);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);
                this.customRange = { start: yesterday, end: endOfYesterday };
                break;
            case 'thisWeek':
                const startOfWeek = new Date(startOfDay);
                startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
                this.customRange = { start: startOfWeek, end: endOfDay };
                break;
            case 'lastWeek':
                const startOfLastWeek = new Date(startOfDay);
                startOfLastWeek.setDate(startOfDay.getDate() - startOfDay.getDay() - 7);
                const endOfLastWeek = new Date(startOfDay);
                endOfLastWeek.setDate(startOfDay.getDate() - startOfDay.getDay() - 1);
                endOfLastWeek.setHours(23, 59, 59, 999);
                this.customRange = { start: startOfLastWeek, end: endOfLastWeek };
                break;
            case 'thisMonth':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                this.customRange = { start: startOfMonth, end: endOfDay };
                break;
            case 'lastMonth':
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                this.customRange = { start: startOfLastMonth, end: endOfLastMonth };
                break;
            case 'custom':
                // Keep existing custom range
                break;
            default:
                this.customRange = null;
        }
    }
} 