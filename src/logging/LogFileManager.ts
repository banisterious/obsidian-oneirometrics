import { App, Notice, TFile } from 'obsidian';
import { ILogger } from './LoggerTypes';

/**
 * Manages log file operations including clearing, backing up, size monitoring,
 * and console log capture for the OneiroMetrics plugin
 */
export class LogFileManager {
    private readonly LOG_PATH = 'logs/oom-debug-log.txt';
    private readonly MAX_SIZE = 1024 * 1024; // 1MB
    private readonly MAX_BACKUPS = 5;

    constructor(
        private app: App,
        private logger: ILogger
    ) {}

    /**
     * Clear the debug log file and create a backup
     */
    public async clearDebugLog(): Promise<void> {
        try {
            const logFile = this.app.vault.getAbstractFileByPath(this.LOG_PATH);
            
            if (logFile instanceof TFile) {
                // Create backup before clearing
                const backupPath = `logs/oom-debug-log.backup-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
                const content = await this.app.vault.read(logFile);
                await this.app.vault.create(backupPath, content);
                
                // Clear the log file
                await this.app.vault.modify(logFile, '');
                this.logger.log('Log', 'Debug log cleared and backed up');
                
                // Clean up old backups (keep last 5)
                await this.cleanupOldBackups();
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to clear debug log', error as Error);
            new Notice('Failed to clear debug log. See console for details.');
        }
    }

    /**
     * Create a backup of the debug log file
     */
    public async backupDebugLog(): Promise<void> {
        try {
            const logFile = this.app.vault.getAbstractFileByPath(this.LOG_PATH);
            
            if (logFile instanceof TFile) {
                const backupPath = `logs/oom-debug-log.backup-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
                const content = await this.app.vault.read(logFile);
                await this.app.vault.create(backupPath, content);
                this.logger.log('Log', 'Debug log backed up');
                new Notice('Debug log backed up successfully');
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to backup debug log', error as Error);
            new Notice('Failed to backup debug log. See console for details.');
        }
    }

    /**
     * Check if the log file exceeds size limit and clear if necessary
     */
    public async checkLogFileSize(): Promise<void> {
        try {
            const logFile = this.app.vault.getAbstractFileByPath(this.LOG_PATH);
            
            if (logFile instanceof TFile) {
                if (logFile.stat.size > this.MAX_SIZE) {
                    await this.clearDebugLog();
                    new Notice('Debug log exceeded size limit and was cleared');
                }
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to check log file size', error as Error);
        }
    }

    /**
     * Copy console logs to the debug log file
     */
    public async copyConsoleLogs(): Promise<void> {
        try {
            // Get the console log content
            const consoleLog = await this.getConsoleLog();
            if (!consoleLog) {
                new Notice('No console logs found');
                return;
            }

            // Filter for OneiroMetrics entries
            const filteredLogs = consoleLog
                .split('\n')
                .filter(line => line.includes('[OneiroMetrics]'))
                .join('\n');

            if (!filteredLogs) {
                new Notice('No OneiroMetrics logs found in console');
                return;
            }

            // Get or create the log file
            let logFile = this.app.vault.getAbstractFileByPath(this.LOG_PATH);
            
            if (!logFile) {
                logFile = await this.app.vault.create(this.LOG_PATH, '');
            }

            // Add timestamp and separator
            const timestamp = new Date().toISOString();
            const separator = '\n\n' + '-'.repeat(80) + '\n';
            const newContent = `${separator}Console Log Capture - ${timestamp}\n${separator}\n${filteredLogs}\n`;

            // Append to existing content
            const existingContent = await this.app.vault.read(logFile as TFile);
            await this.app.vault.modify(logFile as TFile, existingContent + newContent);

            new Notice('Console logs copied to debug file');
            this.logger.log('Log', 'Console logs copied to debug file');
        } catch (error) {
            this.logger.error('Log', 'Failed to copy console logs', error as Error);
            new Notice('Failed to copy console logs. See console for details.');
        }
    }

    /**
     * Get console log content (workaround implementation)
     * @returns Console log content or null if not available
     */
    private async getConsoleLog(): Promise<string | null> {
        try {
            // This is a workaround since we can't directly access the console log
            // We'll use the developer tools API to get the log
            const devTools = (window as any).devTools;
            if (!devTools) {
                new Notice('Developer Tools not available. Please open them first (Ctrl+Shift+I)');
                return null;
            }

            // Get the console log from the developer tools
            const consoleLog = await devTools.getConsoleLog();
            return consoleLog;
        } catch (error) {
            this.logger.error('Log', 'Failed to get console log', error as Error);
            return null;
        }
    }

    /**
     * Clean up old backup files, keeping only the most recent ones
     */
    private async cleanupOldBackups(): Promise<void> {
        try {
            const backupFiles = this.app.vault.getMarkdownFiles()
                .filter(f => f.path.startsWith('logs/oom-debug-log.backup-'))
                .sort((a, b) => b.stat.mtime - a.stat.mtime);
            
            for (let i = this.MAX_BACKUPS; i < backupFiles.length; i++) {
                await this.app.vault.delete(backupFiles[i]);
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to cleanup old backups', error as Error);
        }
    }

    /**
     * Get the current log file path
     */
    public getLogPath(): string {
        return this.LOG_PATH;
    }

    /**
     * Get the maximum allowed log file size
     */
    public getMaxSize(): number {
        return this.MAX_SIZE;
    }

    /**
     * Get the maximum number of backup files to keep
     */
    public getMaxBackups(): number {
        return this.MAX_BACKUPS;
    }
} 