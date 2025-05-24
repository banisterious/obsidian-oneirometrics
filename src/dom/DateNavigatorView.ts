import { ItemView, WorkspaceLeaf } from 'obsidian';

export const DATE_NAVIGATOR_VIEW_TYPE = 'oneiroDateNavigator';

export class DateNavigatorView extends ItemView {
    constructor(
        leaf: WorkspaceLeaf,
        private plugin?: any
    ) {
        super(leaf);
    }

    getViewType(): string {
        return DATE_NAVIGATOR_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Date Navigator';
    }

    async onOpen(): Promise<void> {
        this.containerEl.addClass('oom-date-navigator-view');
        
        // Create a header
        const header = this.containerEl.createDiv('oom-date-navigator-header');
        header.createEl('h3', { text: 'Dream Date Navigator' });
        
        // The actual date navigator component will be initialized from the main plugin
        if (this.plugin && typeof this.plugin.initializeDateNavigator === 'function') {
            this.plugin.initializeDateNavigator(this.containerEl);
        }
    }

    async onClose(): Promise<void> {
        this.containerEl.empty();
    }
} 