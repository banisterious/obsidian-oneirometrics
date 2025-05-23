import { App, TFile, TFolder, normalizePath } from 'obsidian';
import { IFileOperations } from '../interfaces/IFileOperations';
import * as path from 'path';

/**
 * Implementation of file operations service.
 */
export class FileOperations implements IFileOperations {
  constructor(private app: App) {}

  /**
   * Read file content as string.
   * 
   * @param path Path to the file
   * @returns Promise with file content
   */
  async readFile(path: string): Promise<string> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) {
        throw new Error(`File not found or not a file: ${path}`);
      }
      
      const content = await this.app.vault.read(file);
      return content;
    } catch (error) {
      console.error(`[FileOperations] Error reading file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Write content to a file.
   * 
   * @param path Path to the file
   * @param content Content to write
   * @returns Promise resolving when operation completes
   */
  async writeFile(path: string, content: string): Promise<void> {
    try {
      const normalizedPath = normalizePath(path);
      const file = this.app.vault.getAbstractFileByPath(normalizedPath);
      
      if (file && file instanceof TFile) {
        await this.app.vault.modify(file, content);
      } else {
        // Create parent directories if they don't exist
        const dirPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
        if (dirPath) {
          await this.createDirectory(dirPath);
        }
        
        await this.app.vault.create(normalizedPath, content);
      }
    } catch (error) {
      console.error(`[FileOperations] Error writing file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Create a backup of a file.
   * 
   * @param path Path of the file to backup
   * @returns Promise with the backup path
   */
  async createBackup(path: string): Promise<string> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) {
        throw new Error(`File not found or not a file: ${path}`);
      }
      
      const content = await this.app.vault.read(file);
      
      // Generate backup path with .bak extension
      const backupPath = `${path}.bak`;
      
      await this.writeFile(backupPath, content);
      
      console.log(`[FileOperations] Created backup: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`[FileOperations] Error creating backup for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Restore a file from backup.
   * 
   * @param backupPath Path to the backup file
   * @param originalPath Original file path
   * @returns Promise resolving when operation completes
   */
  async restoreBackup(backupPath: string, originalPath: string): Promise<void> {
    try {
      const backupFile = this.app.vault.getAbstractFileByPath(backupPath);
      if (!backupFile || !(backupFile instanceof TFile)) {
        throw new Error(`Backup file not found or not a file: ${backupPath}`);
      }
      
      const content = await this.app.vault.read(backupFile);
      
      await this.writeFile(originalPath, content);
      
      console.log(`[FileOperations] Restored from backup: ${originalPath}`);
    } catch (error) {
      console.error(`[FileOperations] Error restoring from backup:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists.
   * 
   * @param path Path to check
   * @returns Promise resolving to boolean
   */
  async fileExists(path: string): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(path);
    return file !== null && file instanceof TFile;
  }

  /**
   * Get all markdown files in a directory.
   * 
   * @param dir Directory path
   * @returns Promise with array of file paths
   */
  async getMarkdownFiles(dir: string): Promise<string[]> {
    try {
      const folder = this.app.vault.getAbstractFileByPath(dir);
      if (!folder || !(folder instanceof TFolder)) {
        throw new Error(`Directory not found or not a folder: ${dir}`);
      }
      
      const files: string[] = [];
      
      const processFolder = (folder: TFolder) => {
        for (const child of folder.children) {
          if (child instanceof TFile && child.extension === 'md') {
            files.push(child.path);
          } else if (child instanceof TFolder) {
            processFolder(child);
          }
        }
      };
      
      processFolder(folder);
      
      return files;
    } catch (error) {
      console.error(`[FileOperations] Error getting markdown files in ${dir}:`, error);
      return [];
    }
  }

  /**
   * Get a file object by path.
   * 
   * @param path File path
   * @returns Promise with TFile or null
   */
  async getFile(path: string): Promise<TFile | null> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file && file instanceof TFile) {
      return file;
    }
    return null;
  }

  /**
   * Create a directory if it doesn't exist.
   * 
   * @param path Directory path
   * @returns Promise resolving when operation completes
   */
  async createDirectory(path: string): Promise<void> {
    try {
      const normalizedPath = normalizePath(path);
      if (!this.app.vault.getAbstractFileByPath(normalizedPath)) {
        await this.app.vault.createFolder(normalizedPath);
      }
    } catch (error) {
      console.error(`[FileOperations] Error creating directory ${path}:`, error);
      throw error;
    }
  }
} 