import { BaseComponent } from '../BaseComponent';
import { DashboardProps, DashboardCallbacks, DashboardStat, QuickAction, RecentActivity } from './DashboardTypes';

/**
 * View component for the Dashboard
 * 
 * This component renders a dashboard with statistics, quick actions,
 * and recent activity.
 */
export class DashboardView extends BaseComponent {
  private props: DashboardProps;
  private callbacks: DashboardCallbacks;
  
  // DOM references
  private statsContainer: HTMLElement | null = null;
  private actionsContainer: HTMLElement | null = null;
  private activitiesContainer: HTMLElement | null = null;
  
  /**
   * Constructor
   * @param props Initial props for the component
   * @param callbacks Event callbacks for the component
   */
  constructor(props: DashboardProps, callbacks: DashboardCallbacks = {}) {
    super();
    this.props = props;
    this.callbacks = callbacks;
  }
  
  /**
   * Called when the component is rendered
   */
  protected onRender(): void {
    if (!this.containerEl) return;
    
    // Create main container
    const dashboardContainer = this.containerEl.createDiv({ cls: 'oom-dashboard' });
    
    // Add title if provided
    if (this.props.title) {
      dashboardContainer.createEl('h3', { text: this.props.title, cls: 'oom-dashboard-title' });
    }
    
    // Add welcome message
    dashboardContainer.createEl('p', {
      text: 'Welcome to the Dashboard! View your journal statistics and access key features from this central hub.',
      cls: 'oom-dashboard-intro'
    });
    
    // Create sections
    this.renderQuickActions(dashboardContainer);
    this.renderStats(dashboardContainer);
    this.renderRecentActivities(dashboardContainer);
    
    // Add loading state if needed
    if (this.props.isLoading) {
      const loadingOverlay = dashboardContainer.createDiv({ cls: 'oom-dashboard-loading' });
      loadingOverlay.createEl('span', { text: 'Loading dashboard data...', cls: 'oom-loading-text' });
    }
  }
  
  /**
   * Called when the component is updated
   * @param data New data for the component
   */
  protected onUpdate(data: Partial<DashboardProps>): void {
    // Update internal props
    this.props = { ...this.props, ...data };
    
    // Update each section as needed
    if (data.quickActions && this.actionsContainer) {
      this.actionsContainer.empty();
      this.renderQuickActionsList(this.actionsContainer);
    }
    
    if (data.stats && this.statsContainer) {
      this.statsContainer.empty();
      this.renderStatsList(this.statsContainer);
    }
    
    if (data.recentActivities && this.activitiesContainer) {
      this.activitiesContainer.empty();
      this.renderActivitiesList(this.activitiesContainer);
    }
  }
  
  /**
   * Clean up resources
   */
  protected onCleanup(): void {
    // Clear DOM references
    this.statsContainer = null;
    this.actionsContainer = null;
    this.activitiesContainer = null;
  }
  
  /**
   * Render the quick actions section
   * @param containerEl Container element
   */
  private renderQuickActions(containerEl: HTMLElement): void {
    // Create section
    const section = containerEl.createDiv({ cls: 'oom-dashboard-section oom-dashboard-actions' });
    section.createEl('h4', { text: 'Quick Actions', cls: 'oom-section-title' });
    
    // Create actions container
    this.actionsContainer = section.createDiv({ cls: 'oom-quick-actions' });
    
    // Render actions list
    this.renderQuickActionsList(this.actionsContainer);
  }
  
  /**
   * Render the list of quick actions
   * @param containerEl Container element
   */
  private renderQuickActionsList(containerEl: HTMLElement): void {
    if (this.props.quickActions.length === 0) {
      containerEl.createEl('p', { text: 'No actions available', cls: 'oom-empty-state' });
      return;
    }
    
    // Create actions grid
    const actionsGrid = containerEl.createDiv({ cls: 'oom-actions-grid' });
    
    // Add each action
    this.props.quickActions.forEach(action => {
      const actionButton = actionsGrid.createEl('button', {
        cls: `oom-action-button ${!action.enabled ? 'oom-action-button--disabled' : ''}`
      });
      
      // Add icon if available
      if (action.icon) {
        const iconEl = actionButton.createSpan({ cls: 'oom-action-icon' });
        setIcon(iconEl, action.icon);
      }
      
      // Add label
      actionButton.createSpan({ text: action.label, cls: 'oom-action-label' });
      
      // Set tooltip if available
      if (action.description) {
        actionButton.setAttribute('aria-label', action.description);
        actionButton.setAttribute('title', action.description);
      }
      
      // Disable if not enabled
      if (!action.enabled) {
        actionButton.disabled = true;
      }
      
      // Add click handler
      actionButton.addEventListener('click', () => {
        if (action.enabled) {
          this.callbacks.onQuickAction?.(action.id);
        }
      });
    });
  }
  
  /**
   * Render the statistics section
   * @param containerEl Container element
   */
  private renderStats(containerEl: HTMLElement): void {
    // Create section
    const section = containerEl.createDiv({ cls: 'oom-dashboard-section oom-dashboard-stats' });
    section.createEl('h4', { text: 'Status Overview', cls: 'oom-section-title' });
    
    // Create stats container
    this.statsContainer = section.createDiv({ cls: 'oom-stats-container' });
    
    // Render stats list
    this.renderStatsList(this.statsContainer);
  }
  
  /**
   * Render the list of statistics
   * @param containerEl Container element
   */
  private renderStatsList(containerEl: HTMLElement): void {
    if (this.props.stats.length === 0) {
      containerEl.createEl('p', { text: 'No statistics available', cls: 'oom-empty-state' });
      return;
    }
    
    // Create stats grid
    const statsGrid = containerEl.createDiv({ cls: 'oom-stats-grid' });
    
    // Add each stat
    this.props.stats.forEach(stat => {
      const statCard = statsGrid.createDiv({ cls: 'oom-stat-card' });
      
      // Add icon if available
      if (stat.icon) {
        const iconEl = statCard.createSpan({ cls: 'oom-stat-icon' });
        setIcon(iconEl, stat.icon);
      }
      
      // Add stat info
      const statInfo = statCard.createDiv({ cls: 'oom-stat-info' });
      statInfo.createEl('span', { text: stat.label, cls: 'oom-stat-label' });
      statInfo.createEl('span', { text: String(stat.value), cls: 'oom-stat-value' });
      
      // Add description if available
      if (stat.description) {
        statCard.setAttribute('aria-label', stat.description);
        statCard.setAttribute('title', stat.description);
      }
    });
  }
  
  /**
   * Render the recent activities section
   * @param containerEl Container element
   */
  private renderRecentActivities(containerEl: HTMLElement): void {
    // Create section
    const section = containerEl.createDiv({ cls: 'oom-dashboard-section oom-dashboard-activities' });
    section.createEl('h4', { text: 'Recent Activity', cls: 'oom-section-title' });
    
    // Create refresh button
    if (this.callbacks.onRefresh) {
      const refreshButton = section.createEl('button', {
        cls: 'oom-refresh-button'
      });
      const iconEl = refreshButton.createSpan({ cls: 'oom-refresh-icon' });
      setIcon(iconEl, 'refresh-cw');
      refreshButton.createSpan({ text: 'Refresh', cls: 'oom-refresh-label' });
      
      refreshButton.addEventListener('click', () => {
        this.callbacks.onRefresh?.();
      });
    }
    
    // Create activities container
    this.activitiesContainer = section.createDiv({ cls: 'oom-activities-container' });
    
    // Render activities list
    this.renderActivitiesList(this.activitiesContainer);
  }
  
  /**
   * Render the list of recent activities
   * @param containerEl Container element
   */
  private renderActivitiesList(containerEl: HTMLElement): void {
    if (this.props.recentActivities.length === 0) {
      containerEl.createEl('p', { text: 'No recent activity', cls: 'oom-empty-state' });
      return;
    }
    
    // Create activities list
    const activitiesList = containerEl.createEl('ul', { cls: 'oom-activities-list' });
    
    // Helper to format timestamp
    const formatTimestamp = (date: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 0) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
      } else if (diffHour > 0) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
      } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    };
    
    // Add each activity
    this.props.recentActivities.forEach(activity => {
      const activityItem = activitiesList.createEl('li', { 
        cls: `oom-activity-item oom-activity-${activity.type}`
      });
      
      // Add icon based on type
      const iconEl = activityItem.createSpan({ cls: 'oom-activity-icon' });
      const iconType = this.getActivityIcon(activity.type);
      setIcon(iconEl, iconType);
      
      // Add content
      const activityContent = activityItem.createDiv({ cls: 'oom-activity-content' });
      activityContent.createEl('span', { 
        text: activity.description, 
        cls: 'oom-activity-description' 
      });
      activityContent.createEl('span', { 
        text: formatTimestamp(activity.timestamp), 
        cls: 'oom-activity-time' 
      });
      
      // Add click handler
      if (this.callbacks.onActivitySelect) {
        activityItem.addClass('oom-activity-item--clickable');
        activityItem.addEventListener('click', () => {
          this.callbacks.onActivitySelect?.(activity);
        });
      }
    });
  }
  
  /**
   * Get the appropriate icon for an activity type
   * @param type Activity type
   * @returns Icon name
   */
  private getActivityIcon(type: string): string {
    switch (type) {
      case 'scrape':
        return 'search';
      case 'validation':
        return 'check-circle';
      case 'template':
        return 'file-text';
      default:
        return 'activity';
    }
  }
}

/**
 * Helper to set icon on an element
 * This is a simplified version to avoid adding a dependency on Obsidian API
 * In a real implementation, it would use Obsidian's setIcon function
 * @param el Element to set icon on
 * @param iconName Icon name
 */
function setIcon(el: HTMLElement, iconName: string): void {
  el.addClass('oom-icon');
  el.addClass(`oom-icon-${iconName}`);
} 