import { 
    startOfDay, 
    endOfDay, 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth,
    subDays,
    subWeeks,
    subMonths,
    isWithinInterval,
    format,
    parse,
    isValid
} from 'date-fns';

export interface DateRange {
    start: Date;
    end: Date;
}

export interface TimeFilter {
    id: string;
    name: string;
    getDateRange: () => DateRange;
    isCustom?: boolean;
}

export const TIME_FILTERS: TimeFilter[] = [
    {
        id: 'today',
        name: 'Today',
        getDateRange: () => ({
            start: startOfDay(new Date()),
            end: endOfDay(new Date())
        })
    },
    {
        id: 'yesterday',
        name: 'Yesterday',
        getDateRange: () => {
            const yesterday = subDays(new Date(), 1);
            return {
                start: startOfDay(yesterday),
                end: endOfDay(yesterday)
            };
        }
    },
    {
        id: 'thisWeek',
        name: 'This Week',
        getDateRange: () => ({
            start: startOfWeek(new Date()),
            end: endOfWeek(new Date())
        })
    },
    {
        id: 'lastWeek',
        name: 'Last Week',
        getDateRange: () => {
            const lastWeek = subWeeks(new Date(), 1);
            return {
                start: startOfWeek(lastWeek),
                end: endOfWeek(lastWeek)
            };
        }
    },
    {
        id: 'thisMonth',
        name: 'This Month',
        getDateRange: () => ({
            start: startOfMonth(new Date()),
            end: endOfMonth(new Date())
        })
    },
    {
        id: 'lastMonth',
        name: 'Last Month',
        getDateRange: () => {
            const lastMonth = subMonths(new Date(), 1);
            return {
                start: startOfMonth(lastMonth),
                end: endOfMonth(lastMonth)
            };
        }
    }
];

export class TimeFilterManager {
    private currentFilter: TimeFilter | null = null;
    private customFilters: Map<string, TimeFilter> = new Map();
    private readonly storageKey = 'oneirometrics-time-filter';

    constructor() {
        this.loadCurrentFilter();
    }

    private loadCurrentFilter(): void {
        const savedFilterId = localStorage.getItem(this.storageKey);
        if (savedFilterId) {
            const filter = this.getFilterById(savedFilterId);
            if (filter) {
                this.currentFilter = filter;
            }
        }
    }

    private saveCurrentFilter(): void {
        if (this.currentFilter) {
            localStorage.setItem(this.storageKey, this.currentFilter.id);
        } else {
            localStorage.removeItem(this.storageKey);
        }
    }

    private getFilterById(id: string): TimeFilter | undefined {
        const predefinedFilters = this.getPredefinedFilters();
        return predefinedFilters.find(f => f.id === id) || this.customFilters.get(id);
    }

    private getPredefinedFilters(): TimeFilter[] {
        return [
            {
                id: 'today',
                name: 'Today',
                getDateRange: () => ({
                    start: startOfDay(new Date()),
                    end: endOfDay(new Date())
                })
            },
            {
                id: 'yesterday',
                name: 'Yesterday',
                getDateRange: () => {
                    const yesterday = subDays(new Date(), 1);
                    return {
                        start: startOfDay(yesterday),
                        end: endOfDay(yesterday)
                    };
                }
            },
            {
                id: 'thisWeek',
                name: 'This Week',
                getDateRange: () => ({
                    start: startOfWeek(new Date()),
                    end: endOfWeek(new Date())
                })
            },
            {
                id: 'lastWeek',
                name: 'Last Week',
                getDateRange: () => {
                    const lastWeek = subWeeks(new Date(), 1);
                    return {
                        start: startOfWeek(lastWeek),
                        end: endOfWeek(lastWeek)
                    };
                }
            },
            {
                id: 'thisMonth',
                name: 'This Month',
                getDateRange: () => ({
                    start: startOfMonth(new Date()),
                    end: endOfMonth(new Date())
                })
            },
            {
                id: 'lastMonth',
                name: 'Last Month',
                getDateRange: () => {
                    const lastMonth = subMonths(new Date(), 1);
                    return {
                        start: startOfMonth(lastMonth),
                        end: endOfMonth(lastMonth)
                    };
                }
            }
        ];
    }

    setFilter(filterId: string): void {
        const filter = this.getFilterById(filterId);
        if (filter) {
            this.currentFilter = filter;
            this.saveCurrentFilter();
        }
    }

    getCurrentFilter(): TimeFilter | null {
        return this.currentFilter;
    }

    getCurrentRange(): DateRange | null {
        return this.currentFilter?.getDateRange() || null;
    }

    addCustomFilter(start: Date, end: Date): TimeFilter {
        const id = `custom-${start.getTime()}-${end.getTime()}`;
        const filter: TimeFilter = {
            id,
            name: `Custom (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`,
            getDateRange: () => ({ start, end }),
            isCustom: true
        };
        this.customFilters.set(id, filter);
        this.currentFilter = filter;
        this.saveCurrentFilter();
        return filter;
    }

    removeCustomFilter(filterId: string): void {
        this.customFilters.delete(filterId);
        if (this.currentFilter?.id === filterId) {
            this.currentFilter = null;
            this.saveCurrentFilter();
        }
    }

    getCustomFilters(): TimeFilter[] {
        return Array.from(this.customFilters.values());
    }

    clearCurrentFilter(): void {
        this.currentFilter = null;
        this.saveCurrentFilter();
    }

    setCustomRange(start: Date, end: Date): void {
        const customFilter: TimeFilter = {
            id: `custom-${start.getTime()}-${end.getTime()}`,
            name: 'Custom Range',
            getDateRange: () => ({
                start: startOfDay(start),
                end: endOfDay(end)
            }),
            isCustom: true
        };
        this.customFilters.set(customFilter.id, customFilter);
        this.currentFilter = customFilter;
        this.saveCurrentFilter();
    }
}

// Helper function to format date range for display
export function formatDateRange(filter: TimeFilter): string {
    const range = filter.getDateRange();
    return `${format(range.start, 'MMM d')} - ${format(range.end, 'MMM d, yyyy')}`;
}

// Helper function to parse date string
export function parseDateString(dateStr: string): Date | null {
    const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'MM-dd-yyyy'];
    for (const fmt of formats) {
        const parsed = parse(dateStr, fmt, new Date());
        if (isValid(parsed)) {
            return parsed;
        }
    }
    return null;
} 