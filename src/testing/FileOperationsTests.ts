import { App, TAbstractFile, TFile, TFolder, Vault } from 'obsidian';
import { FileOperations } from '../file-operations/services/FileOperations';
import { IFileOperations } from '../file-operations/interfaces/IFileOperations';

/**
 * Mock Vault class for testing
 */
class MockVault implements Partial<Vault> {
    files: Record<string, {content: string, mtime: number}> = {};
    folders: Record<string, boolean> = {
        '': true,  // Root folder
        'test-folder': true
    };
    
    // Mock vault methods
    async read(file: TFile): Promise<string> {
        const path = typeof file === 'string' ? file : file.path;
        if (this.files[path]) {
            return this.files[path].content;
        }
        throw new Error(`File not found: ${path}`);
    }
    
    async write(file: TFile | string, data: string): Promise<void> {
        const path = typeof file === 'string' ? file : file.path;
        this.files[path] = { content: data, mtime: Date.now() };
        return Promise.resolve();
    }
    
    // Fix to match Vault interface signature
    async delete(file: TAbstractFile, force?: boolean): Promise<void> {
        const path = file.path;
        if (this.files[path]) {
            delete this.files[path];
            return Promise.resolve();
        }
        throw new Error(`File not found: ${path}`);
    }
    
    // Fix to return TFolder
    async createFolder(path: string): Promise<TFolder> {
        this.folders[path] = true;
        return {
            path,
            name: path.split('/').pop() || path,
            vault: this as unknown as Vault,
            children: []
        } as unknown as TFolder;
    }
    
    getAbstractFileByPath(path: string): TFile | TFolder | null {
        if (this.files[path]) {
            return {
                path,
                basename: path.split('/').pop() || path,
                extension: path.split('.').pop() || '',
                vault: this as unknown as Vault
            } as TFile;
        }
        
        if (this.folders[path]) {
            return {
                path,
                name: path.split('/').pop() || path,
                vault: this as unknown as Vault,
                children: []
            } as unknown as TFolder;
        }
        
        return null;
    }
    
    getFiles(): TFile[] {
        return Object.keys(this.files).map(path => ({
            path,
            basename: path.split('/').pop() || path,
            extension: path.split('.').pop() || '',
            vault: this as unknown as Vault
        } as TFile));
    }
}

/**
 * Mock App class for testing
 */
class MockApp {
    vault: MockVault;
    
    constructor() {
        this.vault = new MockVault();
    }
}

/**
 * Register file operations tests
 */
export function registerFileOperationsTests(testRunner: any) {
    testRunner.registerTest('FileOperations', 'Reading files', async () => {
        // Arrange
        const mockApp = new MockApp();
        const fileOps = new FileOperations(mockApp as unknown as App);
        const testPath = 'test-file.md';
        const testContent = 'Test content';
        
        // Setup the mock file
        mockApp.vault.files[testPath] = { content: testContent, mtime: Date.now() };
        
        // Act
        const content = await fileOps.readFile(testPath);
        
        // Assert
        if (content !== testContent) {
            throw new Error(`Expected content to be '${testContent}', got '${content}'`);
        }
        
        return true;
    });
    
    testRunner.registerTest('FileOperations', 'Writing files', async () => {
        // Arrange
        const mockApp = new MockApp();
        const fileOps = new FileOperations(mockApp as unknown as App);
        const testPath = 'test-write-file.md';
        const testContent = 'Test write content';
        
        // Act
        await fileOps.writeFile(testPath, testContent);
        
        // Assert
        if (!mockApp.vault.files[testPath]) {
            throw new Error(`File '${testPath}' was not created`);
        }
        
        if (mockApp.vault.files[testPath].content !== testContent) {
            throw new Error(`Expected content to be '${testContent}', got '${mockApp.vault.files[testPath].content}'`);
        }
        
        return true;
    });
    
    testRunner.registerTest('FileOperations', 'File existence check', async () => {
        // Arrange
        const mockApp = new MockApp();
        const fileOps = new FileOperations(mockApp as unknown as App);
        const existingPath = 'existing-file.md';
        const nonExistingPath = 'non-existing-file.md';
        
        // Setup the mock file
        mockApp.vault.files[existingPath] = { content: 'content', mtime: Date.now() };
        
        // Act & Assert
        if (!(await fileOps.fileExists(existingPath))) {
            throw new Error(`Expected '${existingPath}' to exist`);
        }
        
        if (await fileOps.fileExists(nonExistingPath)) {
            throw new Error(`Expected '${nonExistingPath}' to not exist`);
        }
        
        return true;
    });
    
    testRunner.registerTest('FileOperations', 'Creating backup files', async () => {
        // Arrange
        const mockApp = new MockApp();
        const fileOps = new FileOperations(mockApp as unknown as App);
        const originalPath = 'original-file.md';
        const originalContent = 'Original content';
        
        // Setup the mock file
        mockApp.vault.files[originalPath] = { content: originalContent, mtime: Date.now() };
        
        // Act
        const backupPath = await fileOps.createBackup(originalPath);
        
        // Assert
        if (!backupPath) {
            throw new Error('Expected backup path to be returned');
        }
        
        if (!mockApp.vault.files[backupPath]) {
            throw new Error(`Backup file '${backupPath}' was not created`);
        }
        
        if (mockApp.vault.files[backupPath].content !== originalContent) {
            throw new Error(`Expected backup content to match original content`);
        }
        
        return true;
    });
    
    testRunner.registerTest('FileOperations', 'Managing backup rotation', async () => {
        // Arrange
        const mockApp = new MockApp();
        const fileOps = new FileOperations(mockApp as unknown as App);
        const originalPath = 'rotation-test.md';
        const maxBackups = 3;
        
        // Setup the mock file
        mockApp.vault.files[originalPath] = { content: 'content', mtime: Date.now() };
        
        // Act - create 5 backups (exceeding the max)
        const backups = [];
        for (let i = 0; i < 5; i++) {
            // Create backup and then create a custom backup path for our test
            const customBackupPath = await fileOps.createBackup(originalPath);
            mockApp.vault.files[`backup-${i}`] = { 
                content: mockApp.vault.files[customBackupPath].content,
                mtime: Date.now() + i * 1000 // Ensure different timestamps
            };
            backups.push(`backup-${i}`);
            // Delete the original backup to avoid test confusion
            delete mockApp.vault.files[customBackupPath];
            // Simulate a delay between backups to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 5));
        }
        
        // Get all files in the vault to check backup count
        const allFiles = Object.keys(mockApp.vault.files);
        const backupFiles = allFiles.filter(path => path.startsWith('backup-'));
        
        // Assert
        if (backupFiles.length > maxBackups) {
            throw new Error(`Expected at most ${maxBackups} backups, got ${backupFiles.length}`);
        }
        
        // Ensure the most recent backups are kept (backups 2-4)
        for (let i = 2; i < 5; i++) {
            const backupPath = `backup-${i}`;
            if (!mockApp.vault.files[backupPath]) {
                throw new Error(`Expected '${backupPath}' to exist as a recent backup`);
            }
        }
        
        return true;
    });
} 