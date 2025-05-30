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

/**
 * Extracts the date for a dream entry using multiple fallback strategies
 * 
 * This function attempts to find a date associated with a dream journal entry
 * by checking various sources in order of preference:
 * 1. Block reference (^YYYYMMDD) in the first two lines
 * 2. Date in the callout line (e.g., 'Monday, January 6, 2025')
 * 3. YAML 'created' field
 * 4. YAML 'modified' field
 * 5. Year from folder or filename
 * 6. Current date as fallback
 * 
 * @param journalLines Array of lines from the journal entry
 * @param filePath Path to the file containing the entry
 * @param fileContent Full content of the file
 * @returns Date string in YYYY-MM-DD format
 */
export function getDreamEntryDate(journalLines: string[], filePath: string, fileContent: string): string {
    try {
        // 1. Block Reference (^YYYYMMDD) on the callout line or the next line
        const blockRefRegex = /\^(\d{8})/;
        for (let i = 0; i < Math.min(2, journalLines.length); i++) {
            const blockRefMatch = journalLines[i].match(blockRefRegex);
            if (blockRefMatch) {
                const dateStr = blockRefMatch[1];
                const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
                safeLogger.debug('Date', 'Found date via block reference', { dateStr, formattedDate, line: journalLines[i] });
                return formattedDate;
            }
        }

        // 2. Date in the callout line (e.g., 'Monday, January 6, 2025')
        const calloutLine = journalLines[0] || '';
        const longDateRegex = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/;
        const longDateMatch = calloutLine.match(longDateRegex);
        if (longDateMatch) {
            try {
                const dateObj = new Date(longDateMatch[0]);
                if (!isNaN(dateObj.getTime())) {
                    const formattedDate = dateObj.toISOString().split('T')[0];
                    safeLogger.debug('Date', 'Found date via callout line parsing', { longDateMatch: longDateMatch[0], formattedDate });
                    return formattedDate;
                }
            } catch (error) {
                safeLogger.warn('Date', 'Failed to parse long date format', { dateMatch: longDateMatch[0], error });
            }
        }

        // 3. YAML 'created' field
        const yamlCreatedMatch = fileContent.match(/created:\s*(\d{8})/);
        if (yamlCreatedMatch) {
            const dateStr = yamlCreatedMatch[1];
            const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            safeLogger.debug('Date', 'Found date via YAML created field', { dateStr, formattedDate });
            return formattedDate;
        }

        // 4. YAML 'modified' field
        const yamlModifiedMatch = fileContent.match(/modified:\s*(\d{8})/);
        if (yamlModifiedMatch) {
            const dateStr = yamlModifiedMatch[1];
            const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            safeLogger.debug('Date', 'Found date via YAML modified field', { dateStr, formattedDate });
            return formattedDate;
        }

        // 5. Folder or filename (for year only, as a fallback)
        const yearRegex = /\b(\d{4})\b/;
        const pathMatch = filePath.match(yearRegex);
        if (pathMatch) {
            const year = pathMatch[1];
            const fallbackDate = `${year}-01-01`; // Use January 1st as fallback for year-only matches
            safeLogger.debug('Date', 'Found year via file path, using fallback date', { filePath, year, fallbackDate });
            return fallbackDate;
        }

        // 6. Current date as final fallback
        const currentDate = new Date().toISOString().split('T')[0];
        safeLogger.warn('Date', 'No date found in dream entry, using current date as fallback', { 
            filePath, 
            journalLinesCount: journalLines.length,
            currentDate 
        });
        return currentDate;

    } catch (error) {
        safeLogger.error('Date', 'Error extracting dream entry date, using current date as fallback', {
            error: error instanceof Error ? error : new Error(String(error)),
            filePath,
            journalLinesCount: journalLines.length
        });
        return new Date().toISOString().split('T')[0];
    }
} 