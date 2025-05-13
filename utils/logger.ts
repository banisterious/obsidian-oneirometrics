import { LogLevel } from '../types';
import { Notice, App, TFile } from 'obsidian';

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel = 'off';
    private logFile: string = 'oom-debug-log.txt';
    private maxLogSize: number = 1024 * 1024; // 1MB
    private maxBackups: number = 5;
    private app: App;

    private constructor(app: App) {
        this.app = app;
    }

    static getInstance(app: App): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(app);
        }
        return Logger.instance;
    }

    configure(level: LogLevel, maxLogSize: number = 1024 * 1024, maxBackups: number = 5) {
        this.logLevel = level;
        this.maxLogSize = maxLogSize;
        this.maxBackups = maxBackups;
    }

    private shouldLog(category: string): boolean {
        if (this.logLevel === 'off') return false;
        if (this.logLevel === 'errors' && category !== 'Error') return false;
        return true;
    }

    private async writeToLog(message: string) {
        if (!this.shouldLog('Debug')) return;

        try {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${message}\n`;
            
            // Check log size and rotate if needed
            const logExists = await this.app.vault.adapter.exists(this.logFile);
            if (logExists) {
                const logSize = (await this.app.vault.adapter.read(this.logFile)).length;
                if (logSize > this.maxLogSize) {
                    await this.rotateLog();
                }
            }

            // Append to log file
            await this.app.vault.adapter.append(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write to log:', error);
        }
    }

    private async rotateLog() {
        try {
            // Create backup with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `${this.logFile}.${timestamp}`;
            
            // Rename current log to backup
            await this.app.vault.adapter.rename(this.logFile, backupName);

            // Clean up old backups
            const files = await this.app.vault.adapter.list('');
            const backups = files.files
                .filter((file: string) => file.startsWith(this.logFile + '.'))
                .sort((a: string, b: string) => b.localeCompare(a));

            // Remove excess backups
            for (let i = this.maxBackups; i < backups.length; i++) {
                await this.app.vault.adapter.remove(backups[i]);
            }
        } catch (error) {
            console.error('Failed to rotate log:', error);
        }
    }

    log(category: string, message: string, data?: any) {
        if (!this.shouldLog(category)) return;

        const logMessage = `[${category}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
        console.log(logMessage);
        this.writeToLog(logMessage);
    }

    error(category: string, message: string, error?: any) {
        if (!this.shouldLog('Error')) return;

        const errorMessage = `[${category}] ERROR: ${message}${error ? '\n' + JSON.stringify(error, null, 2) : ''}`;
        console.error(errorMessage);
        this.writeToLog(errorMessage);
        
        // Show notice for errors
        new Notice(`OneiroMetrics Error: ${message}`);
    }

    warn(category: string, message: string, data?: any) {
        if (!this.shouldLog(category)) return;

        const warnMessage = `[${category}] WARNING: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
        console.warn(warnMessage);
        this.writeToLog(warnMessage);
    }
} 