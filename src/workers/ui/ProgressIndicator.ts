/**
 * Progress indicator for web worker operations
 * Provides visual feedback during filtering operations
 */
export class ProgressIndicator {
    private container: HTMLElement;
    private progressElement: HTMLElement | null = null;
    private progressBar: HTMLElement | null = null;
    private statusText: HTMLElement | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.createProgressUI();
    }

    /**
     * Create the progress indicator UI elements
     */
    private createProgressUI(): void {
        this.progressElement = document.createElement('div');
        this.progressElement.className = 'oom-progress-indicator';
        this.progressElement.style.display = 'none';
        this.progressElement.innerHTML = `
            <div class="oom-progress-content">
                <div class="oom-progress-text">Processing...</div>
                <div class="oom-progress-bar-container">
                    <div class="oom-progress-bar"></div>
                </div>
            </div>
        `;

        // Get references to child elements
        this.statusText = this.progressElement.querySelector('.oom-progress-text');
        this.progressBar = this.progressElement.querySelector('.oom-progress-bar');

        // Add to container
        this.container.appendChild(this.progressElement);

        // Add CSS styles
        this.addProgressStyles();
    }

    /**
     * Add CSS styles for the progress indicator
     */
    private addProgressStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .oom-progress-indicator {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(var(--background-primary), 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100;
                border-radius: 4px;
            }

            .oom-progress-content {
                text-align: center;
                padding: 20px;
                background: var(--background-secondary);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                min-width: 200px;
            }

            .oom-progress-text {
                margin-bottom: 10px;
                font-size: 14px;
                color: var(--text-normal);
            }

            .oom-progress-bar-container {
                width: 100%;
                height: 6px;
                background: var(--background-modifier-border);
                border-radius: 3px;
                overflow: hidden;
            }

            .oom-progress-bar {
                height: 100%;
                background: var(--interactive-accent);
                border-radius: 3px;
                transition: width 0.3s ease;
                width: 0%;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show the progress indicator
     */
    show(message: string = 'Processing...'): void {
        if (this.progressElement) {
            this.progressElement.style.display = 'flex';
        }
        if (this.statusText) {
            this.statusText.textContent = message;
        }
        this.updateProgress({ progress: 0, entriesProcessed: 0, currentPhase: 'preparing' });
    }

    /**
     * Update progress indicator
     */
    updateProgress(progress: { progress: number; entriesProcessed: number; currentPhase: string }): void {
        if (this.statusText) {
            const phaseText = this.getPhaseText(progress.currentPhase);
            this.statusText.textContent = `${phaseText} (${progress.progress}%)`;
        }
        
        if (this.progressBar) {
            this.progressBar.style.width = `${progress.progress}%`;
        }
    }

    /**
     * Hide the progress indicator
     */
    hide(): void {
        if (this.progressElement) {
            this.progressElement.style.display = 'none';
        }
    }

    /**
     * Get user-friendly text for processing phase
     */
    private getPhaseText(phase: string): string {
        switch (phase) {
            case 'preparing':
                return 'Preparing to filter';
            case 'parsing':
                return 'Processing entries';
            case 'filtering':
                return 'Applying filters';
            case 'optimizing':
                return 'Optimizing results';
            default:
                return 'Processing';
        }
    }

    /**
     * Destroy the progress indicator and clean up
     */
    destroy(): void {
        if (this.progressElement && this.progressElement.parentNode) {
            this.progressElement.parentNode.removeChild(this.progressElement);
        }
        this.progressElement = null;
        this.progressBar = null;
        this.statusText = null;
    }
} 