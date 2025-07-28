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
        this.progressElement.className = 'oom-progress-indicator oom-hidden';
        
        // Create structure using DOM methods
        const progressContent = document.createElement('div');
        progressContent.className = 'oom-progress-content';
        
        this.statusText = document.createElement('div');
        this.statusText.className = 'oom-progress-text';
        this.statusText.textContent = 'Processing...';
        progressContent.appendChild(this.statusText);
        
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'oom-progress-bar-container';
        
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'oom-progress-bar';
        progressBarContainer.appendChild(this.progressBar);
        
        progressContent.appendChild(progressBarContainer);
        this.progressElement.appendChild(progressContent);

        // Add to container
        this.container.appendChild(this.progressElement);

        // Styles are now in styles/utilities.css
    }

    /**
     * Show the progress indicator
     */
    show(message: string = 'Processing...'): void {
        if (this.progressElement) {
            this.progressElement.className = 'oom-progress-indicator';
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
            this.progressBar.classList.add('oom-progress-bar-dynamic');
            this.progressBar.style.setProperty('--oom-progress-width', `${progress.progress}%`);
        }
    }

    /**
     * Hide the progress indicator
     */
    hide(): void {
        if (this.progressElement) {
            this.progressElement.className = 'oom-progress-indicator oom-hidden';
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