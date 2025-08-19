import type { TimeFilterManager } from '../../timeFilters';

/**
 * Adapter to make EnhancedDateNavigatorModal work with dashboard filtering
 * without requiring actual TimeFilterManager dependency
 */
export class DashboardDateNavigatorAdapter {
    private onDateRangeChange: (start: string, end: string) => void;
    
    constructor(onDateRangeChange: (start: string, end: string) => void) {
        this.onDateRangeChange = onDateRangeChange;
    }

    /**
     * Mimics TimeFilterManager.setCustomRange() interface
     * but calls dashboard's date range callback instead
     */
    setCustomRange(startDate: Date, endDate: Date): void {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        this.onDateRangeChange(startStr, endStr);
    }

    /**
     * Provides empty implementation for other TimeFilterManager methods
     * that EnhancedDateNavigatorModal might call
     */
    getCurrentFilter(): any {
        return null;
    }

    getAvailableFilters(): any[] {
        return [];
    }

    applyFilter(): void {
        // No-op - dashboard handles its own filtering
    }
}