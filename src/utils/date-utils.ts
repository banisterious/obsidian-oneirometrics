import { format, parse, isValid } from 'date-fns';

/**
 * Date utility functions for OneiroMetrics
 * Provides consistent date handling throughout the application
 */

/**
 * Validates if a date is within a reasonable range
 * 
 * @param date The date to validate
 * @returns Whether the date is valid and within range
 */
export function validateDate(date: Date): boolean {
    return !isNaN(date.getTime()) && 
           date.getFullYear() >= 1900 && 
           date.getFullYear() <= 2100;
}

/**
 * Parses a date string into a Date object
 * Supports multiple date formats with robust error handling
 * 
 * @param dateStr The date string to parse
 * @returns A Date object or null if parsing fails
 */
export function parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim() === '') {
        console.warn('Empty date string provided');
        return null;
    }

    try {
        // Try block reference format first (^YYYYMMDD)
        const blockRefMatch = dateStr.match(/\^(\d{8})/);
        if (blockRefMatch) {
            const dateStr = blockRefMatch[1];
            const year = parseInt(dateStr.slice(0, 4));
            const month = parseInt(dateStr.slice(4, 6)) - 1;
            const day = parseInt(dateStr.slice(6, 8));
            const date = new Date(year, month, day);
            if (validateDate(date)) {
                return date;
            }
        }

        // Try YYYY-MM-DD format
        const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
            const [_, year, month, day] = dateMatch;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (validateDate(date)) {
                return date;
            }
        }

        // Try journal entry format (e.g., "Monday, January 6, 2024")
        const journalEntryMatch = dateStr.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}/);
        if (journalEntryMatch) {
            const dateObj = new Date(journalEntryMatch[0]);
            if (!isNaN(dateObj.getTime())) {
                return dateObj;
            }
        }

        // Try various formats using date-fns
        const formats = [
            'yyyy-MM-dd',
            'MM/dd/yyyy',
            'dd/MM/yyyy',
            'dd-MM-yyyy',
            'yyyy.MM.dd',
            'MMM d, yyyy',
            'MMMM d, yyyy',
        ];

        for (const formatStr of formats) {
            try {
                const parsedDate = parse(dateStr, formatStr, new Date());
                if (isValid(parsedDate)) {
                    return parsedDate;
                }
            } catch {
                // Try next format
            }
        }

        // If all parsing attempts fail, try a direct Date constructor
        const directDate = new Date(dateStr);
        if (validateDate(directDate)) {
            return directDate;
        }

        // If all else fails, return null
        console.warn(`Failed to parse date: ${dateStr}`);
        return null;
    } catch (error) {
        console.error(`Error parsing date: ${dateStr}`, error);
        return null;
    }
}

/**
 * Formats a Date object into a display string
 * 
 * @param date The date to format
 * @param formatStr Optional format string (defaults to 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: Date, formatStr: string = 'MMM d, yyyy'): string {
    if (!isValid(date)) {
        return 'Invalid date';
    }
    
    return format(date, formatStr);
}

/**
 * Formats a date as YYYY-MM-DD for data storage and sorting
 * 
 * @param date The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

/**
 * Parses a date key (YYYY-MM-DD) into a Date object
 * 
 * @param key The date key to parse
 * @returns A Date object or null if parsing fails
 */
export function parseDateKey(key: string): Date | null {
    try {
        return parse(key, 'yyyy-MM-dd', new Date());
    } catch (error) {
        console.error(`Failed to parse date key: ${key}`, error);
        return null;
    }
}

/**
 * Checks if two dates represent the same day
 * 
 * @param date1 First date
 * @param date2 Second date
 * @returns Whether the dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    if (!isValid(date1) || !isValid(date2)) {
        return false;
    }
    
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
} 