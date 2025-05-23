import { BaseComponent } from '../BaseComponent';
import { ExpandableContentProps, ExpandableContentCallbacks } from './ExpandableContentTypes';

/**
 * View component for expandable content sections
 * 
 * This component renders a collapsible/expandable content section
 * with a header that can be clicked to toggle the expansion state.
 */
export class ExpandableContentView extends BaseComponent {
  private props: ExpandableContentProps;
  private callbacks: ExpandableContentCallbacks;
  
  // DOM elements
  private headerEl: HTMLElement | null = null;
  private contentEl: HTMLElement | null = null;
  private iconEl: HTMLElement | null = null;
  
  // Animation state
  private isAnimating = false;
  
  /**
   * Constructor
   * @param props Initial props for the component
   * @param callbacks Event callbacks for the component
   */
  constructor(props: ExpandableContentProps, callbacks: ExpandableContentCallbacks = {}) {
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
    const expandableEl = this.containerEl.createDiv({
      cls: `oom-expandable ${this.props.className || ''} ${this.props.isExpanded ? 'oom-expandable--expanded' : ''}`
    });
    expandableEl.setAttribute('data-expandable-id', this.props.id);
    
    // Create header
    this.headerEl = expandableEl.createDiv({ cls: 'oom-expandable-header' });
    
    // Add click handler to header
    this.headerEl.addEventListener('click', this.handleHeaderClick.bind(this));
    this.registerCleanup(() => this.headerEl?.removeEventListener('click', this.handleHeaderClick.bind(this)));
    
    // Add header icon
    this.iconEl = this.headerEl.createDiv({ cls: 'oom-expandable-icon' });
    
    // Add title container
    const titleContainer = this.headerEl.createDiv({ cls: 'oom-expandable-title-container' });
    
    // Add title
    titleContainer.createDiv({ 
      cls: 'oom-expandable-title',
      text: this.props.title 
    });
    
    // Add subtitle if provided
    if (this.props.subtitle) {
      titleContainer.createDiv({ 
        cls: 'oom-expandable-subtitle',
        text: this.props.subtitle 
      });
    }
    
    // Add icon if provided
    if (this.props.icon) {
      this.iconEl.addClass(this.props.icon);
    }
    
    // Create content container
    this.contentEl = expandableEl.createDiv({ 
      cls: 'oom-expandable-content'
    });
    
    // Set content
    this.setContent(this.props.content);
    
    // Set initial state
    this.updateExpandedState(this.props.isExpanded, false);
  }
  
  /**
   * Called when the component is updated
   * @param data New data for the component
   */
  protected onUpdate(data: Partial<ExpandableContentProps>): void {
    // Update props
    this.props = { ...this.props, ...data };
    
    // Update title if changed
    if (data.title && this.headerEl) {
      const titleEl = this.headerEl.querySelector('.oom-expandable-title');
      if (titleEl) titleEl.textContent = data.title;
    }
    
    // Update subtitle if changed
    if (data.subtitle !== undefined && this.headerEl) {
      const subtitleEl = this.headerEl.querySelector('.oom-expandable-subtitle') as HTMLElement | null;
      if (subtitleEl) {
        if (data.subtitle) {
          subtitleEl.textContent = data.subtitle;
          subtitleEl.style.display = '';
        } else {
          subtitleEl.style.display = 'none';
        }
      } else if (data.subtitle) {
        // Add subtitle if it didn't exist before
        this.headerEl.querySelector('.oom-expandable-title-container')?.createDiv({
          cls: 'oom-expandable-subtitle',
          text: data.subtitle
        });
      }
    }
    
    // Update icon if changed
    if (data.icon !== undefined && this.iconEl) {
      // Remove old icon classes
      if (this.props.icon) {
        this.iconEl.removeClass(this.props.icon);
      }
      
      // Add new icon class if provided
      if (data.icon) {
        this.iconEl.addClass(data.icon);
      }
    }
    
    // Update content if changed
    if (data.content !== undefined && this.contentEl) {
      this.setContent(data.content);
    }
    
    // Update expanded state if changed
    if (data.isExpanded !== undefined && data.isExpanded !== this.props.isExpanded) {
      this.updateExpandedState(data.isExpanded, this.props.animate !== false);
    }
    
    // Update max height if changed
    if (data.maxContentHeight !== undefined && this.contentEl) {
      this.updateMaxHeight(data.maxContentHeight);
    }
  }
  
  /**
   * Clean up any resources used by the component
   */
  protected onCleanup(): void {
    // Clean up event listeners
    this.headerEl?.removeEventListener('click', this.handleHeaderClick.bind(this));
    
    // Clear references
    this.headerEl = null;
    this.contentEl = null;
    this.iconEl = null;
  }
  
  /**
   * Set the content of the expandable section
   * @param content Content to set (string or HTMLElement)
   */
  private setContent(content: string | HTMLElement): void {
    if (!this.contentEl) return;
    
    // Clear existing content
    this.contentEl.empty();
    
    // Add new content
    if (typeof content === 'string') {
      // Set HTML content
      this.contentEl.innerHTML = content;
    } else {
      // Append element
      this.contentEl.appendChild(content);
    }
  }
  
  /**
   * Update the expanded state of the component
   * @param isExpanded Whether the component should be expanded
   * @param animate Whether to animate the transition
   */
  private updateExpandedState(isExpanded: boolean, animate: boolean): void {
    if (!this.containerEl || !this.contentEl) return;
    
    // Get expandable element
    const expandableEl = this.containerEl.querySelector('.oom-expandable');
    if (!expandableEl) return;
    
    // Skip if already animating
    if (this.isAnimating) return;
    
    if (isExpanded) {
      // Expanding
      if (animate) {
        this.isAnimating = true;
        
        // Set max height to 0 then to actual height to enable animation
        const contentHeight = this.getContentHeight();
        this.contentEl.style.maxHeight = '0px';
        
        // Force reflow
        this.contentEl.getBoundingClientRect();
        
        // Add expanded class
        expandableEl.classList.add('oom-expandable--expanded');
        
        // Set max height to actual content height
        this.contentEl.style.maxHeight = `${contentHeight}px`;
        
        // Listen for transition end
        const onTransitionEnd = () => {
          // If maxContentHeight is set, apply it
          if (this.props.maxContentHeight) {
            this.updateMaxHeight(this.props.maxContentHeight);
          } else {
            this.contentEl!.style.maxHeight = '';
          }
          
          this.isAnimating = false;
          this.contentEl!.removeEventListener('transitionend', onTransitionEnd);
          
          // Trigger callback
          this.callbacks.onAfterExpand?.(this.props.id);
        };
        
        this.contentEl.addEventListener('transitionend', onTransitionEnd);
      } else {
        // No animation, just expand
        expandableEl.classList.add('oom-expandable--expanded');
        
        // Set max height if specified
        if (this.props.maxContentHeight) {
          this.updateMaxHeight(this.props.maxContentHeight);
        } else {
          this.contentEl.style.maxHeight = '';
        }
        
        // Trigger callback
        this.callbacks.onAfterExpand?.(this.props.id);
      }
    } else {
      // Collapsing
      if (animate) {
        this.isAnimating = true;
        
        // Set max height to current height then to 0 to enable animation
        const contentHeight = this.contentEl.getBoundingClientRect().height;
        this.contentEl.style.maxHeight = `${contentHeight}px`;
        
        // Force reflow
        this.contentEl.getBoundingClientRect();
        
        // Set max height to 0
        this.contentEl.style.maxHeight = '0px';
        
        // Listen for transition end
        const onTransitionEnd = () => {
          expandableEl.classList.remove('oom-expandable--expanded');
          this.isAnimating = false;
          this.contentEl!.removeEventListener('transitionend', onTransitionEnd);
          
          // Trigger callback
          this.callbacks.onAfterCollapse?.(this.props.id);
        };
        
        this.contentEl.addEventListener('transitionend', onTransitionEnd);
      } else {
        // No animation, just collapse
        expandableEl.classList.remove('oom-expandable--expanded');
        this.contentEl.style.maxHeight = '0px';
        
        // Trigger callback
        this.callbacks.onAfterCollapse?.(this.props.id);
      }
    }
  }
  
  /**
   * Update the maximum height of the content
   * @param maxHeight Maximum height in pixels, or undefined to remove max height
   */
  private updateMaxHeight(maxHeight?: number): void {
    if (!this.contentEl) return;
    
    if (maxHeight) {
      this.contentEl.style.maxHeight = `${maxHeight}px`;
      this.contentEl.style.overflowY = 'auto';
    } else {
      this.contentEl.style.maxHeight = '';
      this.contentEl.style.overflowY = '';
    }
  }
  
  /**
   * Get the actual height of the content
   * @returns Content height in pixels
   */
  private getContentHeight(): number {
    if (!this.contentEl) return 0;
    
    // Store original max height
    const originalMaxHeight = this.contentEl.style.maxHeight;
    const originalOverflow = this.contentEl.style.overflow;
    
    // Temporarily remove max height and measure
    this.contentEl.style.maxHeight = '';
    this.contentEl.style.overflow = 'hidden';
    const height = this.contentEl.getBoundingClientRect().height;
    
    // Restore original max height
    this.contentEl.style.maxHeight = originalMaxHeight;
    this.contentEl.style.overflow = originalOverflow;
    
    return height;
  }
  
  /**
   * Handle click on the header
   */
  private handleHeaderClick(e: MouseEvent): void {
    // Call header click callback
    this.callbacks.onHeaderClick?.(this.props.id);
    
    // Toggle expanded state
    const newExpandedState = !this.props.isExpanded;
    
    // Call onToggle callback
    this.callbacks.onToggle?.(this.props.id, newExpandedState);
    
    // Update the expanded state
    if (!this.containerEl) return;
    this.props.isExpanded = newExpandedState;
    this.updateExpandedState(newExpandedState, this.props.animate !== false);
  }
} 