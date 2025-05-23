import { TFile } from 'obsidian';

/**
 * Interface for file operations service.
 * Responsible for file system operations like reading, writing, backup, and validation.
 */
export interface IFileOperations {
  /**
   * Read file content as string.
   * 
   * @param path Path to the file
   * @returns Promise with file content
   */
  readFile(path: string): Promise<string>;
  
  /**
   * Write content to a file.
   * 
   * @param path Path to the file
   * @param content Content to write
   * @returns Promise resolving when operation completes
   */
  writeFile(path: string, content: string): Promise<void>;
  
  /**
   * Create a backup of a file.
   * 
   * @param path Path of the file to backup
   * @returns Promise with the backup path
   */
  createBackup(path: string): Promise<string>;
  
  /**
   * Restore a file from backup.
   * 
   * @param backupPath Path to the backup file
   * @param originalPath Original file path
   * @returns Promise resolving when operation completes
   */
  restoreBackup(backupPath: string, originalPath: string): Promise<void>;
  
  /**
   * Check if a file exists.
   * 
   * @param path Path to check
   * @returns Promise resolving to boolean
   */
  fileExists(path: string): Promise<boolean>;
  
  /**
   * Get all markdown files in a directory.
   * 
   * @param dir Directory path
   * @returns Promise with array of file paths
   */
  getMarkdownFiles(dir: string): Promise<string[]>;
  
  /**
   * Get a file object by path.
   * 
   * @param path File path
   * @returns Promise with TFile or null
   */
  getFile(path: string): Promise<TFile | null>;
  
  /**
   * Create a directory if it doesn't exist.
   * 
   * @param path Directory path
   * @returns Promise resolving when operation completes
   */
  createDirectory(path: string): Promise<void>;
} 