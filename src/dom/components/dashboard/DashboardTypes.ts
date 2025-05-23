/**
 * Types related to the Dashboard component
 */

/**
 * Dashboard statistic item
 */
export interface DashboardStat {
  /**
   * Label for the statistic
   */
  label: string;
  
  /**
   * Value to display
   */
  value: string | number;
  
  /**
   * Optional icon to display
   */
  icon?: string;
  
  /**
   * Optional description or tooltip
   */
  description?: string;
}

/**
 * Quick action item in the dashboard
 */
export interface QuickAction {
  /**
   * Unique identifier for the action
   */
  id: string;
  
  /**
   * Label to display on the button
   */
  label: string;
  
  /**
   * Optional icon to show
   */
  icon?: string;
  
  /**
   * Optional description or tooltip
   */
  description?: string;
  
  /**
   * Whether the action is enabled
   */
  enabled: boolean;
}

/**
 * Recent activity item displayed in the dashboard
 */
export interface RecentActivity {
  /**
   * Type of activity
   */
  type: 'scrape' | 'validation' | 'template' | 'other';
  
  /**
   * Description of the activity
   */
  description: string;
  
  /**
   * When the activity occurred
   */
  timestamp: Date;
  
  /**
   * Optional related data (like stats, counts, etc.)
   */
  data?: Record<string, any>;
}

/**
 * Props for the Dashboard component
 */
export interface DashboardProps {
  /**
   * Statistics to display
   */
  stats: DashboardStat[];
  
  /**
   * Quick actions to display
   */
  quickActions: QuickAction[];
  
  /**
   * Recent activities to display
   */
  recentActivities: RecentActivity[];
  
  /**
   * Whether the dashboard is loading data
   */
  isLoading?: boolean;
  
  /**
   * Optional title for the dashboard
   */
  title?: string;
}

/**
 * Callbacks for the Dashboard component
 */
export interface DashboardCallbacks {
  /**
   * Called when a quick action is invoked
   */
  onQuickAction?: (actionId: string) => void;
  
  /**
   * Called when the dashboard needs to refresh its data
   */
  onRefresh?: () => void;
  
  /**
   * Called when an activity item is selected
   */
  onActivitySelect?: (activity: RecentActivity) => void;
} 