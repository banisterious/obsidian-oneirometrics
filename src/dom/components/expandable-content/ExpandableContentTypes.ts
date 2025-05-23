/**
 * Props for the ExpandableContent component
 */
export interface ExpandableContentProps {
  /**
   * Unique identifier for the expandable content
   */
  id: string;
  
  /**
   * The title text to display in the header
   */
  title: string;
  
  /**
   * Optional subtitle or description text
   */
  subtitle?: string;
  
  /**
   * Icon to show next to the title
   * Can be a CSS class name for an icon
   */
  icon?: string;
  
  /**
   * Whether the content is initially expanded
   */
  isExpanded: boolean;
  
  /**
   * Content to display when expanded
   * Can be HTML string or a DOM element
   */
  content: string | HTMLElement;
  
  /**
   * Additional CSS class to apply to the component
   */
  className?: string;
  
  /**
   * Whether to animate the expand/collapse transition
   * Default: true
   */
  animate?: boolean;
  
  /**
   * Maximum height of the content when expanded (in pixels)
   * If provided, content will scroll if it exceeds this height
   */
  maxContentHeight?: number;
}

/**
 * Callbacks for the ExpandableContent component
 */
export interface ExpandableContentCallbacks {
  /**
   * Called when the expand/collapse state changes
   */
  onToggle?: (id: string, isExpanded: boolean) => void;
  
  /**
   * Called when the header is clicked
   */
  onHeaderClick?: (id: string) => void;
  
  /**
   * Called after the content has expanded fully
   */
  onAfterExpand?: (id: string) => void;
  
  /**
   * Called after the content has collapsed fully
   */
  onAfterCollapse?: (id: string) => void;
} 