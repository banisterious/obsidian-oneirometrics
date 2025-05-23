import { App } from 'obsidian';
import { ExpandableContentView } from './ExpandableContentView';
import { ExpandableContentProps, ExpandableContentCallbacks } from './ExpandableContentTypes';

/**
 * Container component for expandable content
 * 
 * This component handles the business logic for the expandable content,
 * while delegating rendering to the ExpandableContentView component.
 */
export class ExpandableContentContainer {
  // Component reference
  private view: ExpandableContentView;
  
  // Component state
  private isExpanded: boolean;
  private props: ExpandableContentProps;
  private contentElements: Map<string, HTMLElement> = new Map();
  
  /**
   * Constructor
   * @param app Obsidian app instance
   * @param container DOM element to render into
   * @param props Initial props for the component
   * @param callbacks Optional callbacks for component events
   */
  constructor(
    private app: App,
    container: HTMLElement,
    props: ExpandableContentProps,
    callbacks?: ExpandableContentCallbacks
  ) {
    this.props = props;
    this.isExpanded = props.isExpanded;
    
    // Create callbacks with internal handlers
    const containerCallbacks: ExpandableContentCallbacks = {
      onToggle: this.handleToggle.bind(this),
      onHeaderClick: this.handleHeaderClick.bind(this),
      ...callbacks
    };
    
    // Create view
    this.view = new ExpandableContentView(props, containerCallbacks);
    
    // Render view
    this.view.render(container);
  }
  
  /**
   * Clean up resources used by the component
   */
  public cleanup(): void {
    this.view.cleanup();
    this.contentElements.clear();
  }
  
  /**
   * Update the component with new props
   * @param props New props to update with
   */
  public update(props: Partial<ExpandableContentProps>): void {
    // Update internal state
    this.props = { ...this.props, ...props };
    
    if (props.isExpanded !== undefined) {
      this.isExpanded = props.isExpanded;
    }
    
    // Update view
    this.view.update(props);
  }
  
  /**
   * Get the current expanded state
   * @returns Whether the content is expanded
   */
  public getIsExpanded(): boolean {
    return this.isExpanded;
  }
  
  /**
   * Set the expanded state
   * @param isExpanded Whether the content should be expanded
   * @param animate Whether to animate the transition
   */
  public setExpanded(isExpanded: boolean, animate = true): void {
    if (isExpanded === this.isExpanded) return;
    
    this.isExpanded = isExpanded;
    this.view.update({ isExpanded, animate });
  }
  
  /**
   * Toggle the expanded state
   * @param animate Whether to animate the transition
   */
  public toggle(animate = true): void {
    this.setExpanded(!this.isExpanded, animate);
  }
  
  /**
   * Set the content of the expandable section
   * @param content Content to display (string or HTMLElement)
   */
  public setContent(content: string | HTMLElement): void {
    this.view.update({ content });
  }
  
  /**
   * Add content to the component with a key for later reference
   * @param key Identifier for the content
   * @param element Element to add
   */
  public addContent(key: string, element: HTMLElement): void {
    this.contentElements.set(key, element);
    
    // If this is the first content, set it as the current content
    if (this.contentElements.size === 1) {
      this.setContent(element);
    }
  }
  
  /**
   * Switch to content with the specified key
   * @param key Identifier for the content to display
   * @returns True if content was found and switched, false otherwise
   */
  public switchContent(key: string): boolean {
    const content = this.contentElements.get(key);
    
    if (content) {
      this.setContent(content);
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle toggle event from view
   * @param id Component ID
   * @param isExpanded New expanded state
   */
  private handleToggle(id: string, isExpanded: boolean): void {
    this.isExpanded = isExpanded;
  }
  
  /**
   * Handle header click event from view
   * @param id Component ID
   */
  private handleHeaderClick(id: string): void {
    // This is already handled by the view's toggle event
    // Additional logic could be added here if needed
  }
} 