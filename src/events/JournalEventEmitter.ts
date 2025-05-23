import { TFile } from 'obsidian';
import { EventEmitter } from './EventEmitter';
import { JournalEvents } from './EventTypes';

/**
 * Event emitter for journal-related events.
 * Provides typed methods for emitting standard journal events.
 */
export class JournalEventEmitter extends EventEmitter<JournalEvents> {
  private static instance: JournalEventEmitter;
  
  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    super();
  }
  
  /**
   * Get the singleton instance of the journal event emitter.
   * @returns The JournalEventEmitter instance
   */
  public static getInstance(): JournalEventEmitter {
    if (!JournalEventEmitter.instance) {
      JournalEventEmitter.instance = new JournalEventEmitter();
    }
    return JournalEventEmitter.instance;
  }
  
  /**
   * Emit event when a journal entry has been processed.
   * @param path The file path of the journal entry
   * @param date The date of the entry
   * @param content The content of the entry
   */
  notifyEntryProcessed(path: string, date: string, content: string): void {
    this.emit('journal:entryProcessed', { path, date, content });
  }
  
  /**
   * Emit event when processing a journal entry fails.
   * @param path The file path of the journal entry
   * @param error The error that occurred
   */
  notifyEntryFailed(path: string, error: Error): void {
    this.emit('journal:entryFailed', { path, error });
  }
  
  /**
   * Emit event when a journal scan is completed.
   * @param totalEntries The total number of entries found
   * @param processedEntries The number of entries successfully processed
   */
  notifyScanCompleted(totalEntries: number, processedEntries: number): void {
    this.emit('journal:scanCompleted', { totalEntries, processedEntries });
  }
  
  /**
   * Emit event when a journal entry is modified.
   * @param file The file that was modified
   * @param previousContent The previous content of the file (optional)
   * @param newContent The new content of the file
   */
  notifyEntryModified(file: TFile, newContent: string, previousContent?: string): void {
    this.emit('journal:entryModified', { file, previousContent, newContent });
  }
} 