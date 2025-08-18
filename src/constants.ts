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
        name: 'Sensory Detail',
        icon: 'eye',
        minValue: 1,
        maxValue: 5,
        description: 'Level of sensory information recalled from the dream',
        enabled: true
    },
    {
        name: 'Emotional Recall',
        icon: 'heart',
        minValue: 1,
        maxValue: 5,
        description: 'Level of emotional detail recalled from the dream',
        enabled: true
    },
    {
        name: 'Lost Segments',
        icon: 'circle-minus',
        minValue: 0,
        maxValue: 5,
        description: 'Number of dream segments that feel missing or incomplete',
        enabled: true
    },
    {
        name: 'Descriptiveness',
        icon: 'pen-tool',
        minValue: 1,
        maxValue: 5,
        description: 'Level of detail in the dream description',
        enabled: true
    },
    {
        name: 'Confidence Score',
        icon: 'check-circle',
        minValue: 1,
        maxValue: 5,
        description: 'Confidence level in the completeness of dream recall',
        enabled: true
    },
    {
        name: 'Character Roles',
        icon: 'user-cog',
        minValue: 1,
        maxValue: 5,
        description: 'Significance of familiar characters in the dream narrative',
        enabled: false
    },
    {
        name: 'Characters Count',
        icon: 'users',
        minValue: 0,
        maxValue: 20,
        description: 'Total number of characters in the dream',
        enabled: false
    },
    {
        name: 'Familiar Count',
        icon: 'user-check',
        minValue: 0,
        maxValue: 10,
        description: 'Number of familiar characters in the dream',
        enabled: false
    },
    {
        name: 'Unfamiliar Count',
        icon: 'user-x',
        minValue: 0,
        maxValue: 10,
        description: 'Number of unfamiliar characters in the dream',
        enabled: false
    },
    {
        name: 'Characters List',
        icon: 'users-round',
        description: 'List of characters that appeared in the dream',
        enabled: false,
        type: 'string',
        format: 'list'
    },
    {
        name: 'Dream Themes',
        icon: 'sparkles',
        description: 'Main themes or motifs in the dream',
        enabled: false,
        type: 'string',
        format: 'tags'
    },
    {
        name: 'Character Clarity/Familiarity',
        icon: 'user-search',
        minValue: 1,
        maxValue: 5,
        description: 'The distinctness and recognizability of the individual characters appearing in your dream',
        enabled: false
    },
    {
        name: 'Lucidity Level',
        icon: 'wand-2',
        minValue: 1,
        maxValue: 5,
        description: 'Degree of awareness that you were dreaming while in the dream',
        enabled: false
    },
    {
        name: 'Dream Coherence',
        icon: 'link',
        minValue: 1,
        maxValue: 5,
        description: 'How logical and consistent the dream narrative was',
        enabled: false
    },
    {
        name: 'Environmental Familiarity',
        icon: 'glasses',
        minValue: 1,
        maxValue: 5,
        description: 'How familiar the dream locations were compared to waking life',
        enabled: false
    },
    {
        name: 'Ease of Recall',
        icon: 'zap',
        minValue: 1,
        maxValue: 5,
        description: 'How easily you could remember the dream upon waking',
        enabled: false
    },
    {
        name: 'Recall Stability',
        icon: 'layers',
        minValue: 1,
        maxValue: 5,
        description: 'How well your memory of the dream held up after waking',
        enabled: false
    }
];

export const DEFAULT_LOGGING = {
    level: 'off' as LogLevel,
    maxSize: 5 * 1024 * 1024, // 5MB - Updated to match logging.ts type
    maxBackups: 3
}; 