import { format, parse, isValid, startOfDay, endOfDay } from 'date-fns';
import safeLogger from '../logging/safe-logger';
import { DEFAULT_JOURNAL_STRUCTURE_SETTINGS } from '../types/journal-check';

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

        // Try callout metadata format - use dynamic pattern based on journal structures
        const allJournalCallouts = DEFAULT_JOURNAL_STRUCTURE_SETTINGS.structures
            .map(s => s.rootCallout)
            .concat(['dream-diary', 'diary-entry', 'daily-note', 'daily', 'weekly']); // Include common variants
        const calloutPattern = new RegExp(`\\[!(?:${allJournalCallouts.join('|')})\\|(\\d{8})\\]`);
        const calloutMatch = dateStr.match(calloutPattern);
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
 * 1. Date in callout header (when dateHandling.placement === 'header')
 * 2. Date field content (when dateHandling.placement === 'field') 
 * 3. Block reference (^YYYYMMDD) in the first two lines
 * 4. Legacy date formats for backward compatibility
 * 5. YAML 'created' field
 * 6. YAML 'modified' field
 * 7. Year from folder or filename
 * 8. Current date as fallback
 * 
 * @param journalLines Array of lines from the journal entry
 * @param filePath Path to the file containing the entry
 * @param fileContent Full content of the file
 * @param dateHandling Optional date handling configuration
 * @returns Date string in YYYY-MM-DD format
 */
export function getDreamEntryDate(
    journalLines: string[], 
    filePath: string, 
    fileContent: string,
    dateHandling?: {
        placement: 'none' | 'header' | 'field' | 'frontmatter';
        headerFormat?: string;
        fieldFormat?: string;
        frontmatterProperty?: string;
        includeBlockReferences?: boolean;
        blockReferenceFormat?: string;
    }
): string {
    try {
        // If dateHandling is configured, try those methods first
        if (dateHandling) {
            // 1. Try frontmatter date extraction if placement is 'frontmatter'
            if (dateHandling.placement === 'frontmatter' && dateHandling.frontmatterProperty) {
                const frontmatterDate = extractDateFromFrontmatter(fileContent, dateHandling.frontmatterProperty);
                if (frontmatterDate) {
                    safeLogger.debug('Date', 'Found date via frontmatter extraction', { frontmatterDate, property: dateHandling.frontmatterProperty });
                    return frontmatterDate;
                }
            }
            
            // 2. Try header date extraction if placement is 'header'
            if (dateHandling.placement === 'header') {
                const headerDate = extractDateFromHeader(journalLines, dateHandling.headerFormat || 'MMMM d, yyyy');
                if (headerDate) {
                    safeLogger.debug('Date', 'Found date via header extraction', { headerDate });
                    return headerDate;
                }
            }
            
            // 3. Try field date extraction if placement is 'field'
            if (dateHandling.placement === 'field') {
                const fieldDate = extractDateFromField(journalLines, dateHandling.fieldFormat || 'Date:');
                if (fieldDate) {
                    safeLogger.debug('Date', 'Found date via field extraction', { fieldDate });
                    return fieldDate;
                }
            }
            
            // 4. Try block reference with custom format if enabled
            if (dateHandling.includeBlockReferences) {
                const blockDate = extractDateFromBlockReference(journalLines, dateHandling.blockReferenceFormat || '^YYYYMMDD');
                if (blockDate) {
                    safeLogger.debug('Date', 'Found date via custom block reference', { blockDate });
                    return blockDate;
                }
            }
        }

        // Legacy parsing for backward compatibility
        
        // 4. Block Reference (^YYYYMMDD) on the callout line or the next line
        const blockRefRegex = /\^(\d{8})/;
        for (let i = 0; i < Math.min(2, journalLines.length); i++) {
            const blockRefMatch = journalLines[i].match(blockRefRegex);
            if (blockRefMatch) {
                const dateStr = blockRefMatch[1];
                const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
                safeLogger.debug('Date', 'Found date via legacy block reference', { dateStr, formattedDate, line: journalLines[i] });
                return formattedDate;
            }
        }

        // 5. Date in the callout line (e.g., 'Monday, January 6, 2025')
        const calloutLine = journalLines[0] || '';
        const longDateRegex = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/;
        const longDateMatch = calloutLine.match(longDateRegex);
        if (longDateMatch) {
            try {
                const dateObj = new Date(longDateMatch[0]);
                if (!isNaN(dateObj.getTime())) {
                    const formattedDate = dateObj.toISOString().split('T')[0];
                    safeLogger.debug('Date', 'Found date via legacy callout line parsing', { longDateMatch: longDateMatch[0], formattedDate });
                    return formattedDate;
                }
            } catch (error) {
                safeLogger.warn('Date', 'Failed to parse legacy long date format', { dateMatch: longDateMatch[0], error });
            }
        }

        // 6. YAML 'created' field
        const yamlCreatedMatch = fileContent.match(/created:\s*(\d{8})/);
        if (yamlCreatedMatch) {
            const dateStr = yamlCreatedMatch[1];
            const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            safeLogger.debug('Date', 'Found date via YAML created field', { dateStr, formattedDate });
            return formattedDate;
        }

        // 7. YAML 'modified' field
        const yamlModifiedMatch = fileContent.match(/modified:\s*(\d{8})/);
        if (yamlModifiedMatch) {
            const dateStr = yamlModifiedMatch[1];
            const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            safeLogger.debug('Date', 'Found date via YAML modified field', { dateStr, formattedDate });
            return formattedDate;
        }

        // 8. Folder or filename (for year only, as a fallback)
        const yearRegex = /\b(\d{4})\b/;
        const pathMatch = filePath.match(yearRegex);
        if (pathMatch) {
            const year = pathMatch[1];
            const fallbackDate = `${year}-01-01`; // Use January 1st as fallback for year-only matches
            safeLogger.debug('Date', 'Found year via file path, using fallback date', { filePath, year, fallbackDate });
            return fallbackDate;
        }

        // 9. Current date as final fallback
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

/**
 * Extracts date from callout header based on the configured format
 * Handles formats like "[!journal] January 6, 2025" or "[!journal|meta] Jan 6, 2025"
 */
function extractDateFromHeader(journalLines: string[], headerFormat: string): string | null {
    try {
        const calloutLine = journalLines[0] || '';
        
        // Look for callout header with date
        // Pattern: [!type] Date or [!type|meta] Date
        const headerMatch = calloutLine.match(/\[![\w-]+(?:\|[^\]]+)?\]\s+(.+?)(?:\s+\^[\w\d]+)?$/);
        if (!headerMatch) return null;
        
        const datePortion = headerMatch[1].trim();
        
        // Try to parse the date using simple format matching
        const parsedDate = parseDateFromFormat(datePortion, headerFormat);
        if (parsedDate) {
            return parsedDate.toISOString().split('T')[0];
        }
        
        return null;
    } catch (error) {
        safeLogger.warn('Date', 'Error extracting date from header', { error });
        return null;
    }
}

/**
 * Extracts date from field content based on the configured field format
 * Handles formats like "Date: 2025-01-06" or "Created: January 6, 2025"
 */
function extractDateFromField(journalLines: string[], fieldFormat: string): string | null {
    try {
        // Extract field name from format (everything before the colon)
        const fieldName = fieldFormat.includes(':') ? fieldFormat.split(':')[0].trim() : 'Date';
        
        // Look for the field in the content
        for (const line of journalLines) {
            const fieldRegex = new RegExp(`${fieldName}\\s*:\\s*(.+)`, 'i');
            const fieldMatch = line.match(fieldRegex);
            if (fieldMatch) {
                const dateText = fieldMatch[1].trim();
                
                // Try parsing the date
                const parsedDate = parseDate(dateText);
                if (parsedDate) {
                    return parsedDate.toISOString().split('T')[0];
                }
            }
        }
        
        return null;
    } catch (error) {
        safeLogger.warn('Date', 'Error extracting date from field', { error });
        return null;
    }
}

/**
 * Extracts date from block reference with custom format
 * Handles formats like "^20250106" or "^2025-01-06"
 */
function extractDateFromBlockReference(journalLines: string[], blockFormat: string): string | null {
    try {
        // Convert format to regex pattern
        let pattern = blockFormat
            .replace('YYYY', '(\\d{4})')
            .replace('MM', '(\\d{2})')
            .replace('DD', '(\\d{2})');
        
        // Escape the ^ if it's at the beginning
        if (pattern.startsWith('^')) {
            pattern = '\\' + pattern;
        }
        
        const blockRegex = new RegExp(pattern);
        
        for (let i = 0; i < Math.min(2, journalLines.length); i++) {
            const blockMatch = journalLines[i].match(blockRegex);
            if (blockMatch && blockMatch.length >= 4) {
                const year = blockMatch[1];
                const month = blockMatch[2];
                const day = blockMatch[3];
                
                return `${year}-${month}-${day}`;
            }
        }
        
        return null;
    } catch (error) {
        safeLogger.warn('Date', 'Error extracting date from block reference', { error });
        return null;
    }
}

/**
 * Extracts date from frontmatter property
 * Handles YAML frontmatter format
 */
function extractDateFromFrontmatter(fileContent: string, propertyName: string): string | null {
    try {
        // Extract frontmatter section
        const frontmatterMatch = fileContent.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) return null;
        
        const yamlContent = frontmatterMatch[1];
        
        // Create regex to match the property
        // Handle both quoted and unquoted values
        const propertyRegex = new RegExp(`^${propertyName}:\\s*['"]?([^'"\n]+)['"]?\\s*$`, 'm');
        const match = yamlContent.match(propertyRegex);
        
        if (match && match[1]) {
            const dateText = match[1].trim();
            
            // Try to parse the date
            const parsedDate = parseDate(dateText);
            if (parsedDate) {
                return parsedDate.toISOString().split('T')[0];
            }
        }
        
        return null;
    } catch (error) {
        safeLogger.warn('Date', 'Error extracting date from frontmatter', { error, propertyName });
        return null;
    }
}

/**
 * Simple date parsing from format (basic Moment.js-like functionality)
 * Handles common patterns like "MMMM d, yyyy" and "MMM DD, YYYY"
 */
function parseDateFromFormat(dateText: string, format: string): Date | null {
    try {
        // Simple format matching for common patterns
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Handle "January 6, 2025" format
        if (format.includes('MMMM')) {
            const longMonthRegex = new RegExp(`(${months.join('|')})\\s+(\\d{1,2}),?\\s+(\\d{4})`);
            const match = dateText.match(longMonthRegex);
            if (match) {
                const monthIndex = months.indexOf(match[1]);
                const day = parseInt(match[2]);
                const year = parseInt(match[3]);
                
                if (monthIndex >= 0) {
                    return new Date(year, monthIndex, day);
                }
            }
        }
        
        // Handle "Jan 6, 2025" format
        if (format.includes('MMM')) {
            const shortMonthRegex = new RegExp(`(${monthsShort.join('|')})\\s+(\\d{1,2}),?\\s+(\\d{4})`);
            const match = dateText.match(shortMonthRegex);
            if (match) {
                const monthIndex = monthsShort.indexOf(match[1]);
                const day = parseInt(match[2]);
                const year = parseInt(match[3]);
                
                if (monthIndex >= 0) {
                    return new Date(year, monthIndex, day);
                }
            }
        }
        
        // Fallback to Date constructor
        const fallbackDate = new Date(dateText);
        if (!isNaN(fallbackDate.getTime())) {
            return fallbackDate;
        }
        
        return null;
    } catch (error) {
        safeLogger.warn('Date', 'Error parsing date from format', { dateText, format, error });
        return null;
    }
} 