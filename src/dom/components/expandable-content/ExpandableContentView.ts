import { ExpandableContentViewProps } from './ExpandableContentTypes';

/**
 * View component for ExpandableContent
 * Handles UI rendering and DOM interactions
 */
export class ExpandableContentView {
    private containerEl: HTMLElement;
    private contentEl: HTMLElement;
    private expandButtonTop: HTMLElement | null = null;
    private expandButtonBottom: HTMLElement | null = null;
    private headerEl: HTMLElement | null = null;

    constructor(
        containerEl: HTMLElement,
        private props: ExpandableContentViewProps
    ) {
        this.containerEl = containerEl;
        this.containerEl.addClass('oom-expandable-content');
        
        if (this.props.className) {
            this.containerEl.addClass(this.props.className);
        }
        
        this.contentEl = this.containerEl.createDiv('oom-expandable-content-text');
        
        this.render();
    }

    /**
     * Update the view with new props
     */
    public update(props: ExpandableContentViewProps): void {
        this.props = props;
        this.render();
    }

    /**
     * Clean up resources on destruction
     */
    public destroy(): void {
        // Remove event listeners if needed
        if (this.expandButtonTop) {
            this.expandButtonTop.removeEventListener('click', this.handleToggle);
        }
        if (this.expandButtonBottom) {
            this.expandButtonBottom.removeEventListener('click', this.handleToggle);
        }
        
        // Clear container
        this.containerEl.empty();
    }

    /**
     * Render the component
     */
    private render(): void {
        // Update expanded/collapsed class
        this.containerEl.toggleClass('oom-expanded', this.props.isExpanded);
        this.containerEl.toggleClass('oom-collapsed', !this.props.isExpanded);
        
        // Render header if provided
        this.renderHeader();
        
        // Render top button if configured
        if (this.props.showExpandButton !== false && 
            (this.props.buttonPosition === 'top' || this.props.buttonPosition === 'both')) {
            this.renderExpandButton('top');
        } else if (this.expandButtonTop) {
            this.expandButtonTop.remove();
            this.expandButtonTop = null;
        }
        
        // Render content
        this.renderContent();
        
        // Render bottom button if configured
        if (this.props.showExpandButton !== false && 
            (this.props.buttonPosition === 'bottom' || this.props.buttonPosition === 'both' || !this.props.buttonPosition)) {
            this.renderExpandButton('bottom');
        } else if (this.expandButtonBottom) {
            this.expandButtonBottom.remove();
            this.expandButtonBottom = null;
        }
    }

    /**
     * Render the header content if provided
     */
    private renderHeader(): void {
        if (!this.props.headerContent) {
            if (this.headerEl) {
                this.headerEl.remove();
                this.headerEl = null;
            }
            return;
        }
        
        if (!this.headerEl) {
            this.headerEl = this.containerEl.createDiv('oom-expandable-content-header');
        } else {
            this.headerEl.empty();
        }
        
        if (typeof this.props.headerContent === 'string') {
            this.headerEl.setText(this.props.headerContent);
        } else {
            this.headerEl.appendChild(this.props.headerContent.cloneNode(true));
        }
    }

    /**
     * Render the expand/collapse button
     */
    private renderExpandButton(position: 'top' | 'bottom'): void {
        const buttonText = this.props.isExpanded 
            ? (this.props.expandedButtonText || 'Show less') 
            : (this.props.collapsedButtonText || 'Show more');
        
        if (position === 'top') {
            if (!this.expandButtonTop) {
                this.expandButtonTop = this.containerEl.createDiv({
                    cls: 'oom-expandable-content-button oom-expandable-content-button-top',
                    text: buttonText
                });
                this.expandButtonTop.addEventListener('click', this.handleToggle);
            } else {
                this.expandButtonTop.setText(buttonText);
            }
            
            // Add arrow icon
            this.updateButtonIcon(this.expandButtonTop);
            
        } else { // bottom
            if (!this.expandButtonBottom) {
                this.expandButtonBottom = this.containerEl.createDiv({
                    cls: 'oom-expandable-content-button oom-expandable-content-button-bottom',
                    text: buttonText
                });
                this.expandButtonBottom.addEventListener('click', this.handleToggle);
            } else {
                this.expandButtonBottom.setText(buttonText);
            }
            
            // Add arrow icon
            this.updateButtonIcon(this.expandButtonBottom);
        }
    }

    /**
     * Update the button icon to reflect expanded/collapsed state
     */
    private updateButtonIcon(button: HTMLElement): void {
        // Remove existing icon if any
        const existingIcon = button.querySelector('.oom-expandable-content-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        // Create new icon
        const iconEl = document.createElement('span');
        iconEl.addClass('oom-expandable-content-icon');
        
        // Use different SVG based on expanded state
        if (this.props.isExpanded) {
            iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>`;
        } else {
            iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;
        }
        
        button.appendChild(iconEl);
    }

    /**
     * Render the content text
     */
    private renderContent(): void {
        this.contentEl.empty();
        
        // Get the content to display based on expanded state
        const displayContent = this.props.isExpanded 
            ? this.props.content 
            : (this.props.summary || this.truncateContent(this.props.content));
        
        // Format content if formatter is provided
        const formattedContent = this.props.formatContent 
            ? this.props.formatContent(displayContent) 
            : displayContent;
        
        if (this.props.preserveParagraphs) {
            // Split by paragraphs and create paragraph elements
            const paragraphs = formattedContent.split(/\n\s*\n/);
            
            paragraphs.forEach(paragraph => {
                if (paragraph.trim()) {
                    const p = this.contentEl.createEl('p');
                    p.setText(paragraph.trim());
                }
            });
        } else {
            // Just set the text content directly
            this.contentEl.setText(formattedContent);
        }
    }

    /**
     * Truncate content to maxCollapsedLength while preserving words
     */
    private truncateContent(content: string): string {
        if (content.length <= this.props.maxCollapsedLength) {
            return content;
        }
        
        // Find a good breaking point near maxCollapsedLength
        let truncateAt = this.props.maxCollapsedLength;
        
        // Try to find a space or punctuation to break at
        const breakChars = [' ', '.', '!', '?', ',', ';', ':', '\n'];
        
        // Look for a good break point starting from maxCollapsedLength and going backwards
        for (let i = truncateAt; i > truncateAt - 50 && i > 0; i--) {
            if (breakChars.includes(content.charAt(i))) {
                truncateAt = i + 1; // Include the break character
                break;
            }
        }
        
        return content.substring(0, truncateAt) + '...';
    }

    /**
     * Handle expand/collapse toggle
     */
    private handleToggle = (): void => {
        this.props.onToggle();
    }
} 