import { App, Notice } from 'obsidian';
import { DashboardView } from './DashboardView';
import { DashboardProps, DashboardStat, QuickAction, RecentActivity } from './DashboardTypes';
import { DreamMetricsState } from '../../../state/DreamMetricsState';

// REFACTORING: This import will be updated when the events system is refactored
// @ts-ignore - Using the legacy event system until refactoring is complete
import { OneiroMetricsEvents } from '../../../events';

/**
 * Container component for the dashboard
 * 
 * This component handles the business logic for the dashboard,
 * while delegating rendering to the DashboardView component.
 */
export class DashboardContainer {
  // Dependencies
  private app: App;
  private state: DreamMetricsState;
  private events: OneiroMetricsEvents;
  
  // Component references
  private view: DashboardView;
  
  // Component state
  private stats: DashboardStat[] = [];
  private quickActions: QuickAction[] = [];
  private recentActivities: RecentActivity[] = [];
  private isLoading: boolean = false;
  private pluginSettings: any; // Will hold settings from plugin instance
  
  /**
   * Constructor
   * @param app Obsidian app instance
   * @param container DOM element to render into
   * @param state Plugin state
   * @param pluginSettings Plugin settings object
   */
  constructor(
    app: App, 
    container: HTMLElement,
    state: DreamMetricsState,
    pluginSettings: any
  ) {
    this.app = app;
    this.state = state;
    this.pluginSettings = pluginSettings;
    
    // REFACTORING: This will be updated to use the new event system in a future phase
    this.events = OneiroMetricsEvents.getInstance();
    
    // Initialize data
    this.loadDashboardData();
    
    // Create props for view
    const props: DashboardProps = {
      stats: this.stats,
      quickActions: this.quickActions,
      recentActivities: this.recentActivities,
      isLoading: this.isLoading,
      title: 'Dashboard'
    };
    
    // Create view
    this.view = new DashboardView(props, {
      onQuickAction: this.handleQuickAction.bind(this),
      onRefresh: this.handleRefresh.bind(this),
      onActivitySelect: this.handleActivitySelect.bind(this)
    });
    
    // Render view
    this.view.render(container);
    
    // Subscribe to events
    this.subscribeToEvents();
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.view.cleanup();
    this.unsubscribeFromEvents();
  }
  
  /**
   * Load dashboard data
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    
    try {
      // Load stats
      this.loadStats();
      
      // Load quick actions
      this.loadQuickActions();
      
      // Load recent activities
      this.loadRecentActivities();
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      new Notice('Error loading dashboard data. Check console for details.');
      this.isLoading = false;
    }
  }
  
  /**
   * Load dashboard statistics
   */
  private loadStats(): void {
    // Get data from state
    const entries = this.state.getDreamEntries();
    const metrics = this.state.getMetrics();
    
    // REFACTORING: Metric structure will be updated in a future phase
    // Calculate stats
    this.stats = [
      {
        label: 'Total Entries',
        value: entries.length,
        icon: 'book-open',
        description: 'Total number of dream journal entries'
      },
      {
        label: 'With Metrics',
        value: entries.filter(entry => entry.metrics && Object.keys(entry.metrics).length > 0).length,
        icon: 'bar-chart-2',
        description: 'Entries with metrics data'
      },
      {
        label: 'Active Metrics',
        // @ts-ignore - Will be fixed when metric types are updated
        value: Object.keys(metrics).filter(key => metrics[key].enabled).length,
        icon: 'activity',
        description: 'Number of active metrics being tracked'
      },
      {
        label: 'Templates',
        // @ts-ignore - Will be fixed when state API is updated
        value: this.pluginSettings?.templates?.length || 0,
        icon: 'file-text',
        description: 'Number of saved templates'
      }
    ];
    
    // Calculate word count if available
    const totalWords = entries.reduce((total, entry) => {
      const wordCount = entry.content?.split(/\s+/).length || 0;
      return total + wordCount;
    }, 0);
    
    if (totalWords > 0) {
      this.stats.push({
        label: 'Total Words',
        value: totalWords.toLocaleString(),
        icon: 'type',
        description: 'Total word count across all entries'
      });
    }
  }
  
  /**
   * Load quick actions
   */
  private loadQuickActions(): void {
    // Create basic quick actions
    this.quickActions = [
      {
        id: 'scrape-metrics',
        label: 'Scrape Metrics',
        icon: 'search',
        description: 'Extract and analyze metrics from journal entries',
        enabled: true
      },
      {
        id: 'view-metrics',
        label: 'View Metrics',
        icon: 'bar-chart-2',
        description: 'View your dream metrics table',
        // @ts-ignore - Will be fixed when settings are standardized
        enabled: Boolean(this.pluginSettings?.projectNotePath)
      },
      {
        id: 'check-structure',
        label: 'Check Structure',
        icon: 'check-circle',
        description: 'Validate your journal structure',
        enabled: true
      },
      {
        id: 'create-template',
        label: 'Create Template',
        icon: 'file-plus',
        description: 'Create a new dream journal template',
        enabled: true
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        description: 'Open OneiroMetrics settings',
        enabled: true
      },
      {
        id: 'help',
        label: 'Help & Docs',
        icon: 'help-circle',
        description: 'View documentation and help',
        enabled: true
      }
    ];
  }
  
  /**
   * Load recent activities
   */
  private loadRecentActivities(): void {
    // REFACTORING: This will use a dedicated state manager in a future phase
    // Get activities from plugin settings
    const storedActivities = this.pluginSettings?.recentActivities as RecentActivity[] || [];
    
    // Convert timestamps from strings to Date objects
    this.recentActivities = storedActivities.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp)
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Limit to last 5 activities
    this.recentActivities = this.recentActivities.slice(0, 5);
    
    // If no activities found, add placeholder
    if (this.recentActivities.length === 0) {
      const now = new Date();
      this.recentActivities = [
        {
          type: 'other',
          description: 'Dashboard initialized',
          timestamp: now
        }
      ];
    }
  }
  
  /**
   * Subscribe to events
   */
  private subscribeToEvents(): void {
    // REFACTORING: This will be updated to use the new event system in a future phase
    
    // Listen for metrics updates
    // @ts-ignore - Will be fixed when event system is standardized
    this.events.on('metrics:calculated', () => {
      this.addActivity({
        type: 'scrape',
        description: 'Metrics calculated from journal entries',
        timestamp: new Date()
      });
      this.refreshStats();
    });
    
    // Listen for validation events
    // @ts-ignore - Will be fixed when event system is standardized
    this.events.on('journal:validated', (result: { errors: number, warnings: number }) => {
      this.addActivity({
        type: 'validation',
        description: `Journal validation: ${result.errors} errors, ${result.warnings} warnings`,
        timestamp: new Date(),
        data: result
      });
    });
    
    // Listen for template events
    // @ts-ignore - Will be fixed when event system is standardized
    this.events.on('template:created', (templateName: string) => {
      this.addActivity({
        type: 'template',
        description: `Template "${templateName}" created`,
        timestamp: new Date()
      });
      this.refreshStats();
    });
  }
  
  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    // Unsubscribe from all events
    // In a real implementation, we would store event references and unsubscribe from each
  }
  
  /**
   * Add a new activity
   * @param activity Activity to add
   */
  private addActivity(activity: RecentActivity): void {
    // Add to the beginning of the list
    this.recentActivities.unshift(activity);
    
    // Limit to 5 activities
    if (this.recentActivities.length > 5) {
      this.recentActivities = this.recentActivities.slice(0, 5);
    }
    
    // Save to plugin settings
    this.saveActivities();
    
    // Update view
    this.view.update({ recentActivities: this.recentActivities });
  }
  
  /**
   * Save activities to plugin settings
   */
  private saveActivities(): void {
    // REFACTORING: This will use a dedicated state manager in a future phase
    if (this.pluginSettings) {
      this.pluginSettings.recentActivities = this.recentActivities;
      // Call save settings method on the plugin
    }
  }
  
  /**
   * Refresh statistics
   */
  private refreshStats(): void {
    this.loadStats();
    this.view.update({ stats: this.stats });
  }
  
  /**
   * Handle quick action
   * @param actionId ID of the action
   */
  private handleQuickAction(actionId: string): void {
    switch (actionId) {
      case 'scrape-metrics':
        // @ts-ignore - Will be fixed when event system is standardized
        this.events.emit('dashboard:scrapeMetrics');
        break;
        
      case 'view-metrics':
        // Get the project note path from settings
        const projectNote = this.pluginSettings?.projectNotePath;
        if (projectNote) {
          this.app.workspace.openLinkText(projectNote, '', true);
        } else {
          new Notice('Project note not set. Please configure in settings.');
        }
        break;
        
      case 'check-structure':
        // @ts-ignore - Will be fixed when event system is standardized
        this.events.emit('dashboard:checkStructure');
        break;
        
      case 'create-template':
        // @ts-ignore - Will be fixed when event system is standardized
        this.events.emit('dashboard:createTemplate');
        break;
        
      case 'settings':
        // @ts-ignore - Will be fixed when event system is standardized
        this.events.emit('dashboard:openSettings');
        break;
        
      case 'help':
        // Open help documentation URL
        const helpUrl = 'https://github.com/banisterious/obsidian-oneirometrics/blob/main/docs/user/guides/usage.md';
        window.open(helpUrl, '_blank');
        break;
        
      default:
        console.warn(`Unknown action: ${actionId}`);
    }
  }
  
  /**
   * Handle refresh
   */
  private handleRefresh(): void {
    this.isLoading = true;
    this.view.update({ isLoading: true });
    
    // Simulate loading delay
    setTimeout(() => {
      this.loadDashboardData();
      this.view.update({
        stats: this.stats,
        quickActions: this.quickActions,
        recentActivities: this.recentActivities,
        isLoading: false
      });
      
      new Notice('Dashboard refreshed');
    }, 500);
  }
  
  /**
   * Handle activity selection
   * @param activity Selected activity
   */
  private handleActivitySelect(activity: RecentActivity): void {
    // Handle different activity types
    switch (activity.type) {
      case 'scrape':
        // Navigate to metrics page
        const projectNote = this.pluginSettings?.projectNotePath;
        if (projectNote) {
          this.app.workspace.openLinkText(projectNote, '', true);
        }
        break;
        
      case 'validation':
        // @ts-ignore - Will be fixed when event system is standardized
        this.events.emit('dashboard:showValidationResults', activity.data);
        break;
        
      case 'template':
        // @ts-ignore - Will be fixed when event system is standardized
        this.events.emit('dashboard:openTemplates');
        break;
        
      default:
        // No action for other types
        break;
    }
  }
} 