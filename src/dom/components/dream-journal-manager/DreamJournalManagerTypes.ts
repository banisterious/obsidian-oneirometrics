/**
 * Types for the Dream Journal Manager Component
 */
import { TFile } from 'obsidian';
import { LintingSettings, CalloutStructure, JournalTemplate, ContentIsolationSettings } from '../../../journal_check/types';

/**
 * Selection mode for dream scraping
 */
export type SelectionMode = 'notes' | 'folder';

/**
 * Tab sections available in the Dream Journal Manager
 */
export type JournalManagerTab = 
    | 'dashboard' 
    | 'dream-scrape' 
    | 'journal-structure' 
    | 'templates' 
    | 'content-isolation' 
    | 'interface';

/**
 * Quick action definition for dashboard
 */
export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    onClick: () => void;
}

/**
 * Recent activity definition for dashboard
 */
export interface RecentActivity {
    type: string;
    message: string;
    timestamp: Date;
    details?: any;
}

/**
 * Status item definition for dashboard
 */
export interface StatusItem {
    id: string;
    label: string;
    value: string;
}

/**
 * Dream scrape progress state
 */
export interface ScrapeProgress {
    current: number;
    total: number;
    message: string;
    details?: string;
    isActive: boolean;
}

/**
 * Props for the Dream Journal Manager view component
 */
export interface DreamJournalManagerProps {
    activeTab: JournalManagerTab;
    
    // Dashboard props
    quickActions: QuickAction[];
    recentActivities: RecentActivity[];
    statusItems: StatusItem[];
    
    // Dream Scrape props
    selectionMode: SelectionMode;
    selectedNotes: string[];
    selectedFolder: string;
    scrapeProgress: ScrapeProgress;
    isScraping: boolean;
    hasScraped: boolean;
    
    // Journal Structure props
    lintingSettings: LintingSettings;
    
    // Templates props
    templates: JournalTemplate[];
    
    // Content isolation props
    contentIsolationSettings: ContentIsolationSettings;
    
    // UI customization props
    customCss: string;
}

/**
 * Callbacks for the Dream Journal Manager view component
 */
export interface DreamJournalManagerCallbacks {
    // Navigation
    onTabChange: (tab: JournalManagerTab) => void;
    
    // Dashboard callbacks
    onQuickActionClick: (actionId: string) => void;
    
    // Dream Scrape callbacks
    onSelectionModeChange: (mode: SelectionMode) => void;
    onSelectedNotesChange: (notes: string[]) => void;
    onSelectedFolderChange: (folder: string) => void;
    onStartScrape: () => void;
    onCancelScrape: () => void;
    onOpenProjectNote: () => void;
    onViewMetricsDescriptions: () => void;
    
    // Journal Structure callbacks
    onLintingSettingsChange: (settings: Partial<LintingSettings>) => void;
    
    // Templates callbacks
    onCreateTemplate: () => void;
    onEditTemplate: (templateId: string) => void;
    onDeleteTemplate: (templateId: string) => void;
    onApplyTemplate: (templateId: string, targetFile?: TFile) => void;
    
    // Content isolation callbacks
    onContentIsolationSettingsChange: (settings: Partial<ContentIsolationSettings>) => void;
    
    // UI customization callbacks
    onCustomCssChange: (css: string) => void;
} 