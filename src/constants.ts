import { DreamMetric, LogLevel } from './types';

export const DEFAULT_METRICS: DreamMetric[] = [
    {
        name: 'Words',
        icon: 'text',
        minValue: 0,
        maxValue: 1000,
        description: 'Number of words in the dream entry'
    },
    {
        name: 'Reading Time',
        icon: 'clock',
        minValue: 0,
        maxValue: 60,
        description: 'Estimated reading time in minutes'
    }
];

export const DEFAULT_LOGGING = {
    level: 'off' as LogLevel,
    maxLogSize: 5 * 1024 * 1024, // 5MB
    maxBackups: 3
}; 