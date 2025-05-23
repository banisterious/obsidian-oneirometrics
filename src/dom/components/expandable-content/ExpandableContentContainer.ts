import { ExpandableContentOptions, ExpandableContentState, ExpandableContentViewProps } from './ExpandableContentTypes';
import { ExpandableContentView } from './ExpandableContentView';

/**
 * Container component for ExpandableContent
 * Implements business logic and state management
 */
export class ExpandableContentContainer {
    private view: ExpandableContentView;
    private state: ExpandableContentState;
    private id: string;
    
    private static idCounter = 0;

    constructor(
        private containerEl: HTMLElement,
        private options: ExpandableContentOptions
    ) {
        // Generate unique ID
        this.id = `oom-expandable-content-${ExpandableContentContainer.idCounter++}`;
        this.containerEl.setAttribute('id', this.id);
        
        // Set default values
        const maxCollapsedLength = options.maxCollapsedLength || 150;
        const content = options.content || '';
        
        // Calculate initial summary
        const summary = this.createSummary(content, maxCollapsedLength);
        
        // Initialize state
        this.state = {
            isExpanded: options.initiallyExpanded || false,
            content: content,
            summary: summary,
            hasTruncatedContent: content.length > maxCollapsedLength
        };
        
        // Create and render view
        this.view = new ExpandableContentView(containerEl, this.getViewProps());
    }

    /**
     * Clean up on component destruction
     */
    public destroy(): void {
        this.view.destroy();
    }

    /**
     * Alias for destroy() to maintain compatibility
     */
    public cleanup(): void {
        this.destroy();
    }

    /**
     * Update component with new content or options
     */
    public update(options: Partial<ExpandableContentOptions>): void {
        // Update options
        this.options = { ...this.options, ...options };
        
        // Update state if content changed
        if (options.content !== undefined) {
            const maxCollapsedLength = this.options.maxCollapsedLength || 150;
            const content = options.content;
            const summary = this.createSummary(content, maxCollapsedLength);
            
            this.state = {
                ...this.state,
                content: content,
                summary: summary,
                hasTruncatedContent: content.length > maxCollapsedLength
            };
        }
        
        // Update view
        this.view.update(this.getViewProps());
    }

    /**
     * Set the content of the expandable container
     * @param content The new content
     */
    public setContent(content: string | HTMLElement): void {
        let contentStr = '';
        
        if (typeof content === 'string') {
            contentStr = content;
        } else if (content instanceof HTMLElement) {
            contentStr = content.outerHTML;
        }
        
        this.update({ content: contentStr });
    }

    /**
     * Toggle expanded state
     */
    public toggle(): void {
        this.state.isExpanded = !this.state.isExpanded;
        this.view.update(this.getViewProps());
    }

    /**
     * Handle toggle event from view
     */
    private handleToggle(): void {
        this.toggle();
    }

    /**
     * Expand the content
     */
    public expand(): void {
        if (!this.state.isExpanded) {
            this.state.isExpanded = true;
            this.view.update(this.getViewProps());
        }
    }

    /**
     * Collapse the content
     */
    public collapse(): void {
        if (this.state.isExpanded) {
            this.state.isExpanded = false;
            this.view.update(this.getViewProps());
        }
    }

    /**
     * Get the current expanded state
     */
    public isExpanded(): boolean {
        return this.state.isExpanded;
    }

    /**
     * Get the component's ID
     */
    public getId(): string {
        return this.id;
    }

    /**
     * Get view props from current state and options
     */
    private getViewProps(): ExpandableContentViewProps {
        return {
            content: this.state.content,
            summary: this.state.summary,
            isExpanded: this.state.isExpanded,
            maxCollapsedLength: this.options.maxCollapsedLength || 150,
            onToggle: this.handleToggle.bind(this),
            className: this.options.className,
            formatContent: this.options.formatContent,
            preserveParagraphs: this.options.preserveParagraphs,
            showExpandButton: this.options.showExpandButton,
            buttonPosition: this.options.buttonPosition,
            expandedButtonText: this.options.expandedButtonText,
            collapsedButtonText: this.options.collapsedButtonText,
            headerContent: this.options.headerContent
        };
    }

    /**
     * Create a summary of the content
     */
    private createSummary(content: string, maxLength: number): string {
        if (content.length <= maxLength) {
            return content;
        }

        // Find a suitable breaking point - end of a sentence or word
        let truncateAt = maxLength;
        const breakChars = [' ', '.', '!', '?', ',', ';', ':', '\n'];
        
        // Look back from maxLength to find a good break point
        for (let i = truncateAt; i > truncateAt - 50 && i > 0; i--) {
            if (breakChars.includes(content.charAt(i))) {
                truncateAt = i + 1; // Include the break character
                break;
            }
        }
        
        return content.substring(0, truncateAt) + '...';
    }
} 