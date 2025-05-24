import { DreamMetric } from './types/core';
import { LogLevel } from './types/logging';

export const DEFAULT_METRICS: DreamMetric[] = [
    {
        name: 'Words',
        icon: 'text',
        minValue: 0,
        maxValue: 1000,
        description: 'Number of words in the dream entry',
        enabled: true
    },
    {
        name: 'Reading Time',
        icon: 'clock',
        minValue: 0,
        maxValue: 60,
        description: 'Estimated reading time in minutes',
        enabled: true
    }
];

export const DEFAULT_LOGGING = {
    level: 'off' as LogLevel,
    maxSize: 5 * 1024 * 1024, // 5MB - Updated to match logging.ts type
    maxBackups: 3
}; 