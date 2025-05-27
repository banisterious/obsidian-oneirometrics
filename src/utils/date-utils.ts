import { format, parse, isValid, startOfDay, endOfDay } from 'date-fns';
import safeLogger from '../logging/safe-logger';

/**
 * Date utility functions for OneiroMetrics
 * Provides consistent date handling throughout the application
 * 
 * IMPORTANT: These utilities are used throughout the application and
 * must be robust against invalid inputs with proper fallbacks.
 */

/**
 * Validates if a date is within a reasonable range
 * 
 * @param date The date to validate
 * @returns Whether the date is valid and within range
 */
export function validateDate(date: Date | null | undefined): boolean {
    if (!date) {
        safeLogger.warn('Date', 'Null or undefined date provided to validateDate');
        return false;
    }
    
    try {
        return !isNaN(date.getTime()) && 
               date.getFullYear() >= 1900 && 
               date.getFullYear() <= 2100;
    } catch (error) {
        safeLogger.error('Date', 'Error validating date', error instanceof Error ? error : new Error(String(error)));
        return false;
    }
}

/**
 * Parses a date string into a Date object
 * Supports multiple date formats with robust error handling
 * 
 * @param dateStr The date string to parse
 * @returns A Date object or null if parsing fails
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
        safeLogger.warn('Date', `Empty or invalid date string provided: ${dateStr}`);
        return null;
    }

    try {
        // Try block reference format first (^YYYYMMDD)
        const blockRefMatch = dateStr.match(/\^(\d{8})/);
        if (blockRefMatch) {
            const dateValue = blockRefMatch[1];
            const year = parseInt(dateValue.slice(0, 4));
            const month = parseInt(dateValue.slice(4, 6)) - 1;
            const day = parseInt(dateValue.slice(6, 8));
            
            // Validate the parsed components
            if (isNaN(year) || isNaN(month) || isNaN(day)) {
                safeLogger.warn('Date', `Invalid date components in block reference: ${dateStr}`);
                return null;
            }
            
            const date = new Date(year, month, day);
            if (validateDate(date)) {
                return date;
            }
            
            safeLogger.warn('Date', `Block reference date out of valid range: ${dateStr}`);
        }

        // Try YYYY-MM-DD format
        const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
            const [_, year, month, day] = dateMatch;
            
            // Validate the parsed components
            if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day))) {
                safeLogger.warn('Date', `Invalid components in YYYY-MM-DD format: ${dateStr}`);
                return null;
            }
            
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (validateDate(date)) {
                return date;
            }
            
            safeLogger.warn('Date', `YYYY-MM-DD format date out of valid range: ${dateStr}`);
        }

        // Try journal entry format (e.g., "Monday, January 6, 2024")
        const journalEntryMatch = dateStr.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}/);
        if (journalEntryMatch) {
            try {
                const dateObj = new Date(journalEntryMatch[0]);
                if (!isNaN(dateObj.getTime()) && validateDate(dateObj)) {
                    return dateObj;
                }
                safeLogger.warn('Date', `Journal entry date parsed but invalid: ${dateStr}`);
            } catch (error) {
                safeLogger.warn('Date', `Failed to parse journal entry date: ${dateStr}`, error instanceof Error ? error : new Error(String(error)));
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
                if (isValid(parsedDate) && validateDate(parsedDate)) {
                    return parsedDate;
                }
            } catch (error) {
                // Try next format
                continue;
            }
        }

        // Try callout metadata format (e.g., [!journal-entry|20250513])
        const calloutMatch = dateStr.match(/\[!(?:journal-entry|dream-diary|diary-entry|daily-note|daily|weekly)\|(\d{8})\]/);
        if (calloutMatch) {
            const dateValue = calloutMatch[1];
            const year = parseInt(dateValue.slice(0, 4));
            const month = parseInt(dateValue.slice(4, 6)) - 1;
            const day = parseInt(dateValue.slice(6, 8));
            
            // Validate the parsed components
            if (isNaN(year) || isNaN(month) || isNaN(day)) {
                safeLogger.warn('Date', `Invalid date components in callout metadata: ${dateStr}`);
                return null;
            }
            
            const date = new Date(year, month, day);
            if (validateDate(date)) {
                return date;
            }
            
            safeLogger.warn('Date', `Callout metadata date out of valid range: ${dateStr}`);
        }

        // If all parsing attempts fail, try a direct Date constructor
        try {
            const directDate = new Date(dateStr);
            if (validateDate(directDate)) {
                return directDate;
            }
        } catch (error) {
            // Ignore error and continue to fallback
        }

        // If all else fails, return null
        safeLogger.warn('Date', `Failed to parse date after all attempts: ${dateStr}`);
        return null;
    } catch (error) {
        safeLogger.error('Date', `Unexpected error parsing date: ${dateStr}`, error instanceof Error ? error : new Error(String(error)));
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
export function formatDate(date: Date | null | undefined, formatStr: string = 'MMM d, yyyy'): string {
    if (!date) {
        safeLogger.warn('Date', 'Null or undefined date provided to formatDate');
        return 'Invalid date';
    }
    
    try {
        if (!isValid(date)) {
            safeLogger.warn('Date', `Invalid date provided to formatDate: ${date}`);
            return 'Invalid date';
        }
        
        return format(date, formatStr);
    } catch (error) {
        safeLogger.error('Date', 'Error formatting date', error instanceof Error ? error : new Error(String(error)));
        return 'Error formatting date';
    }
}

/**
 * Formats a date as YYYY-MM-DD for data storage and sorting
 * 
 * @param date The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateKey(date: Date | null | undefined): string {
    if (!date) {
        safeLogger.warn('Date', 'Null or undefined date provided to formatDateKey');
        return '';
    }
    
    try {
        if (!isValid(date)) {
            safeLogger.warn('Date', `Invalid date provided to formatDateKey: ${date}`);
            return '';
        }
        
        return format(date, 'yyyy-MM-dd');
    } catch (error) {
        safeLogger.error('Date', 'Error creating date key', error instanceof Error ? error : new Error(String(error)));
        return '';
    }
}

/**
 * Parses a date key (YYYY-MM-DD) into a Date object
 * 
 * @param key The date key to parse
 * @returns A Date object or null if parsing fails
 */
export function parseDateKey(key: string | null | undefined): Date | null {
    if (!key || typeof key !== 'string' || key.trim() === '') {
        safeLogger.warn('Date', `Empty or invalid date key provided: ${key}`);
        return null;
    }
    
    try {
        const parsedDate = parse(key, 'yyyy-MM-dd', new Date());
        if (isValid(parsedDate) && validateDate(parsedDate)) {
            return parsedDate;
        }
        
        safeLogger.warn('Date', `Failed to parse date key: ${key}`);
        return null;
    } catch (error) {
        safeLogger.error('Date', `Error parsing date key: ${key}`, error instanceof Error ? error : new Error(String(error)));
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
export function isSameDay(date1: Date | null | undefined, date2: Date | null | undefined): boolean {
    if (!date1 || !date2) {
        safeLogger.warn('Date', 'Null or undefined date(s) provided to isSameDay');
        return false;
    }
    
    try {
        if (!isValid(date1) || !isValid(date2)) {
            safeLogger.warn('Date', 'Invalid date(s) provided to isSameDay');
            return false;
        }
        
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    } catch (error) {
        safeLogger.error('Date', 'Error comparing dates', error instanceof Error ? error : new Error(String(error)));
        return false;
    }
}

/**
 * Gets the start of the day (midnight) for a given date
 * 
 * @param date The date to get start of day for
 * @returns Date object set to start of day or null if invalid
 */
export function getStartOfDay(date: Date | null | undefined): Date | null {
    if (!date) {
        safeLogger.warn('Date', 'Null or undefined date provided to getStartOfDay');
        return null;
    }
    
    try {
        if (!isValid(date)) {
            safeLogger.warn('Date', `Invalid date provided to getStartOfDay: ${date}`);
            return null;
        }
        
        return startOfDay(date);
    } catch (error) {
        safeLogger.error('Date', 'Error getting start of day', error instanceof Error ? error : new Error(String(error)));
        return null;
    }
}

/**
 * Gets the end of the day (23:59:59.999) for a given date
 * 
 * @param date The date to get end of day for
 * @returns Date object set to end of day or null if invalid
 */
export function getEndOfDay(date: Date | null | undefined): Date | null {
    if (!date) {
        safeLogger.warn('Date', 'Null or undefined date provided to getEndOfDay');
        return null;
    }
    
    try {
        if (!isValid(date)) {
            safeLogger.warn('Date', `Invalid date provided to getEndOfDay: ${date}`);
            return null;
        }
        
        return endOfDay(date);
    } catch (error) {
        safeLogger.error('Date', 'Error getting end of day', error instanceof Error ? error : new Error(String(error)));
        return null;
    }
}

/**
 * Creates a safe date object, providing a default if the input is invalid
 * 
 * @param date The date to check
 * @param defaultDate Optional default date to use if input is invalid (defaults to current date)
 * @returns A valid date object
 */
export function safeDateOrDefault(
    date: Date | string | null | undefined, 
    defaultDate: Date = new Date()
): Date {
    try {
        // Handle null/undefined
        if (!date) {
            safeLogger.debug('Date', 'Null or undefined date provided to safeDateOrDefault, using default');
            return defaultDate;
        }
        
        // Parse string dates
        if (typeof date === 'string') {
            const parsedDate = parseDate(date);
            if (parsedDate && validateDate(parsedDate)) {
                return parsedDate;
            }
            safeLogger.debug('Date', `String date could not be parsed in safeDateOrDefault: ${date}, using default`);
            return defaultDate;
        }
        
        // Validate Date objects
        if (date instanceof Date && validateDate(date)) {
            return date;
        }
        
        safeLogger.debug('Date', `Invalid date provided to safeDateOrDefault: ${date}, using default`);
        return defaultDate;
    } catch (error) {
        safeLogger.error('Date', 'Error in safeDateOrDefault', error instanceof Error ? error : new Error(String(error)));
        return defaultDate;
    }
} 