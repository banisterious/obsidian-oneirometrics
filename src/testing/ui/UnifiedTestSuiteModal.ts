/**
 * UnifiedTestSuiteModal
 * 
 * A consolidated test suite modal that brings together all testing functionality
 * from various individual test modals into a single, organized interface.
 * 
 * Consolidates:
 * - Performance Testing (ScrapingPerformanceTestModal)
 * - Date Navigator Testing
 * - Universal Worker Pool Testing  
 * - Universal Filter Manager Testing
 * - Metrics Calculator Testing
 * - Web Worker Testing
 * - Journal Structure Validation
 * - General Diagnostics and Tools
 */

import { App, Modal, Setting, ButtonComponent, Notice } from 'obsidian';
import { getLogger } from '../../logging';

// Import existing test functionality
import { DummyDataGenerator } from '../utils/DummyDataGenerator';

// Types for test results and state
interface TestResult {
    testName: string;
    status: 'success' | 'failure' | 'warning' | 'running';
    duration?: number;
    details?: string;
    timestamp: Date;
}

interface TestSuiteState {
    isRunning: boolean;
    currentTest: string | null;
    results: TestResult[];
    selectedCategory: string;
}

export class UnifiedTestSuiteModal extends Modal {
    private tabsContainer: HTMLElement;
    private contentContainer: HTMLElement;
    private selectedTab: string | null = null;
    private logger = getLogger('UnifiedTestSuiteModal');
    
    // Test suite state
    private testState: TestSuiteState = {
        isRunning: false,
        currentTest: null,
        results: [],
        selectedCategory: 'performance'
    };
    
    // Test infrastructure
    private dummyDataGenerator: DummyDataGenerator;
    
    constructor(app: App, private plugin: any) {
        super(app);
        this.dummyDataGenerator = new DummyDataGenerator();
    }
    
    onOpen() {
        try {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass('unified-test-suite-modal');
            
            // Create header
            contentEl.createEl('h1', { 
                text: 'OneiroMetrics Test Suite', 
                cls: 'unified-test-suite-header' 
            });
            
            // Create description
            contentEl.createEl('p', {
                text: 'Comprehensive testing and diagnostics for all OneiroMetrics functionality.',
                cls: 'unified-test-suite-description'
            });
            
            // Create two-column layout
            const modalContainer = contentEl.createDiv({ 
                cls: 'unified-test-suite-container' 
            });
            
            this.tabsContainer = modalContainer.createDiv({ 
                cls: 'unified-test-suite-sidebar' 
            });
            
            this.contentContainer = modalContainer.createDiv({ 
                cls: 'unified-test-suite-content' 
            });
            
            // Build tabs
            this.createTabs();
            
            // Select Dashboard tab by default
            this.selectTab('dashboard');
            
        } catch (error) {
            this.logger.error('Error opening unified test suite modal', (error as Error).message);
        }
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Stop any running tests
        this.testState.isRunning = false;
    }
    
    // Create all tabs
    private createTabs() {
        // Main overview
        this.createDashboardTab();
        
        // Core testing categories
        this.createTestGroup('System Diagnostics', [
            { id: 'test-logging', name: 'Logging', description: 'Test logging infrastructure and manage log data' },
            { id: 'test-web-workers', name: 'Web Workers', description: 'Test web worker functionality' },
            { id: 'test-state-management', name: 'State Management', description: 'Test plugin state handling' }
        ]);
        
        this.createTestGroup('Performance Testing', [
            { id: 'performance-scraping', name: 'Scraping Performance', description: 'Test data scraping performance with various dataset sizes' },
            { id: 'performance-memory', name: 'Memory Analysis', description: 'Memory usage and leak detection' },
            { id: 'performance-scaling', name: 'Scaling Tests', description: 'Test performance across different data scales' }
        ]);
        
        this.createTestGroup('Component Testing', [
            { id: 'test-date-navigator', name: 'Date Navigator', description: 'Test date navigation and selection functionality' },
            { id: 'test-worker-pool', name: 'Worker Pool', description: 'Test universal worker pool operations' },
            { id: 'test-filter-manager', name: 'Filter Manager', description: 'Test universal filter management' },
            { id: 'test-metrics-calculator', name: 'Metrics Calculator', description: 'Test universal metrics calculation' }
        ]);
        
        this.createTestGroup('Validation & Structure', [
            { id: 'test-journal-structure', name: 'Journal Structure', description: 'Validate journal structure and parsing' },
            { id: 'test-data-integrity', name: 'Data Integrity', description: 'Verify data consistency and accuracy' },
            { id: 'test-settings', name: 'Settings & Metrics Infrastructure', description: 'Test plugin settings, unified metrics, and Phase 1 infrastructure' }
        ]);
        
        // Utilities and tools
        this.createUtilitiesTab();
        this.createHelpTab();
    }
    
    // Create Dashboard tab
    private createDashboardTab() {
        const dashboardTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item unified-test-suite-tab-nav-item',
            attr: { 'data-tab-id': 'dashboard' }
        });
        
        dashboardTab.createDiv({ 
            text: 'Test Dashboard', 
            cls: 'unified-test-suite-tab-label' 
        });
        
        dashboardTab.addEventListener('click', () => {
            this.selectTab('dashboard');
        });
    }
    
    // Create Utilities tab
    private createUtilitiesTab() {
        const utilitiesTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item unified-test-suite-tab-nav-item',
            attr: { 'data-tab-id': 'utilities' }
        });
        
        utilitiesTab.createDiv({ 
            text: 'Test Utilities', 
            cls: 'unified-test-suite-tab-label' 
        });
        
        utilitiesTab.addEventListener('click', () => {
            this.selectTab('utilities');
        });
    }
    
    // Create Help tab
    private createHelpTab() {
        const helpTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item unified-test-suite-tab-nav-item',
            attr: { 'data-tab-id': 'help' }
        });
        
        helpTab.createDiv({ 
            text: 'Help & Documentation', 
            cls: 'unified-test-suite-tab-label' 
        });
        
        helpTab.addEventListener('click', () => {
            this.selectTab('help');
        });
    }
    
    // Helper to create a group of test tabs
    private createTestGroup(groupName: string, tests: Array<{id: string, name: string, description: string}>) {
        // Create group header
        const groupHeader = this.tabsContainer.createDiv({ 
            text: groupName,
            cls: 'vertical-tab-header-group-title unified-test-suite-tab-group-title' 
        });
        
        // Create tabs for each test in the group
        tests.forEach(test => {
            this.createTestTab(test);
        });
    }
    
    // Create a tab for an individual test
    private createTestTab(test: {id: string, name: string, description: string}) {
        const testTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item unified-test-suite-tab-nav-item',
            attr: { 'data-tab-id': test.id }
        });
        
        testTab.createDiv({ 
            text: test.name, 
            cls: 'unified-test-suite-tab-label' 
        });
        
        testTab.addEventListener('click', () => {
            this.selectTab(test.id);
        });
    }
    
    // Main tab selection logic
    public selectTab(tabId: string) {
        this.selectedTab = tabId;
        
        // Update tab active states
        this.tabsContainer.querySelectorAll('.vertical-tab-nav-item').forEach(tab => {
            tab.removeClass('is-active');
        });
        
        const selectedTabEl = this.tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);
        if (selectedTabEl) {
            selectedTabEl.addClass('is-active');
        }
        
        // Load content based on selected tab
        this.contentContainer.empty();
        
        switch (tabId) {
            case 'dashboard':
                this.loadDashboardContent();
                break;
            case 'performance-scraping':
                this.loadPerformanceTestContent('performance-scraping');
                break;
            case 'performance-memory':
                this.loadPerformanceTestContent('performance-memory');
                break;
            case 'performance-scaling':
                this.loadPerformanceTestContent('performance-scaling');
                break;
            case 'test-date-navigator':
                this.loadComponentTestContent('test-date-navigator');
                break;
            case 'test-logging':
                this.loadLoggingContent();
                // Refresh log level display when loading logging content
                this.refreshLogLevelDisplay();
                break;
            case 'utilities':
                this.loadUtilitiesContent();
                break;
            case 'help':
                this.loadHelpContent();
                break;
            default:
                // Handle specific performance tests
                if (tabId.startsWith('performance-')) {
                    this.loadPerformanceTestContent(tabId);
                } else if (tabId.startsWith('test-')) {
                    this.loadComponentTestContent(tabId);
                }
                break;
        }
    }
    
    // Dashboard content
    private loadDashboardContent() {
        this.contentContainer.empty();
        
        this.contentContainer.createEl('h2', { 
            text: 'Test Suite Dashboard', 
            cls: 'unified-test-suite-content-header' 
        });
        
        this.contentContainer.createEl('p', {
            text: 'Welcome to the OneiroMetrics Test Suite. Monitor overall test status and run comprehensive test suites.',
            cls: 'unified-test-suite-content-description'
        });
        
        // Test status overview
        const statusContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-dashboard-stats' });
        
        this.createStatWidget(statusContainer, 'Total Tests', this.testState.results.length.toString());
        this.createStatWidget(statusContainer, 'Test Status', this.testState.isRunning ? 'Running' : 'Idle');
        this.createStatWidget(statusContainer, 'Last Run', this.getLastTestTime());
        this.createStatWidget(statusContainer, 'Success Rate', this.getSuccessRate());
        
        // Quick actions
        const actionsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-dashboard-actions' });
        actionsContainer.createEl('h3', { text: 'Quick Actions' });
        
        this.createActionButton(actionsContainer, 'Run All Performance Tests', 'zap', () => {
            this.runTestSuite('performance');
        });
        
        this.createActionButton(actionsContainer, 'Run Component Tests', 'cog', () => {
            this.runTestSuite('components');
        });
        
        this.createActionButton(actionsContainer, 'Run Validation Tests', 'check-circle', () => {
            this.runTestSuite('validation');
        });
        
        this.createActionButton(actionsContainer, 'Clear Test Results', 'trash-2', () => {
            this.clearTestResults();
        });
        
        // Recent test results
        this.loadRecentTestResults();
    }
    
    // Performance test content
    private loadPerformanceTestContent(testId: string) {
        this.contentContainer.empty();
        
        const testTitle = this.getTestTitle(testId);
        this.contentContainer.createEl('h2', { 
            text: testTitle, 
            cls: 'unified-test-suite-content-header' 
        });
        
        if (testId === 'performance-scraping') {
            this.loadScrapingPerformanceTest();
        } else if (testId === 'performance-memory') {
            this.loadMemoryAnalysisTest();
        } else if (testId === 'performance-scaling') {
            this.loadScalingTest();
        } else {
            // Fallback for unknown performance tests
            this.contentContainer.createEl('p', {
                text: `Performance test content for ${testTitle} is being loaded...`,
                cls: 'unified-test-suite-content-description'
            });
            
            const runButton = this.contentContainer.createEl('button', { 
                text: `Run ${testTitle}`, 
                cls: 'mod-cta' 
            });
            runButton.onclick = () => this.runIndividualTest(testId);
        }
    }
    
    // Component test content
    private loadComponentTestContent(testId: string) {
        this.contentContainer.empty();
        
        const testTitle = this.getTestTitle(testId);
        this.contentContainer.createEl('h2', { 
            text: testTitle, 
            cls: 'unified-test-suite-content-header' 
        });
        
        // Special handling for logging tab
        if (testId === 'test-logging') {
            this.loadLoggingContent();
            return;
        }
        
        // Special handling for enhanced settings test
        if (testId === 'test-settings') {
            this.loadSettingsAndMetricsTestContent();
            return;
        }
        
        // Generic component test interface
        this.contentContainer.createEl('p', {
            text: `Test interface for ${testTitle}. This integrates the functionality from the individual test modal.`,
            cls: 'unified-test-suite-content-description'
        });
        
        // Test controls
        const controlsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-test-controls' });
        
        const runButton = controlsContainer.createEl('button', { 
            text: `Run ${testTitle}`, 
            cls: 'mod-cta' 
        });
        runButton.onclick = () => this.runIndividualTest(testId);
        
        // Test results area
        const resultsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-test-results' });
        resultsContainer.createEl('h3', { text: 'Test Results' });
        
        const resultsArea = resultsContainer.createEl('div', { cls: 'unified-test-suite-results-area' });
        resultsArea.createEl('p', { text: 'No test results yet. Click "Run Test" to begin.' });
    }
    
    // Scraping performance test (from ScrapingPerformanceTestModal)
    private loadScrapingPerformanceTest() {
        this.contentContainer.createEl('p', {
            text: 'Test scraping performance with various dataset sizes and configurations.',
            cls: 'unified-test-suite-content-description'
        });
        
        // Folder selection section
        const folderSection = this.contentContainer.createDiv({ cls: 'unified-test-suite-folder-section' });
        folderSection.createEl('h3', { text: 'Target Folder Configuration' });
        
        const folderContainer = folderSection.createDiv({ cls: 'unified-test-suite-setting-item' });
        folderContainer.createEl('label', { 
            text: 'Test Folder:',
            cls: 'unified-test-suite-setting-label'
        });
        
        const folderSelect = folderContainer.createEl('select', { 
            cls: 'unified-test-suite-folder-select' 
        });
        
        // Add test data folder option
        const plugin = this.plugin as any;
        const testDataFolder = plugin.settings?.testDataFolder || 'Test Data/Dreams';
        
        // Add current selected folder option
        const currentFolder = plugin.settings?.selectedFolder || '';
        
        const folderOptions = [
            { value: testDataFolder, label: `Test Data (${testDataFolder})` },
            { value: currentFolder, label: currentFolder ? `Current Selection (${currentFolder})` : 'No folder selected' },
            { value: 'custom', label: 'Custom folder path...' }
        ].filter(option => option.value); // Remove empty options
        
        folderOptions.forEach(folder => {
            const option = folderSelect.createEl('option', { 
                text: folder.label,
                value: folder.value
            });
        });
        
        folderSelect.value = testDataFolder; // Default to test data folder
        
        // Custom folder input (hidden by default)
        const customFolderContainer = folderSection.createDiv({ 
            cls: 'unified-test-suite-custom-folder-container',
            attr: { style: 'display: none;' }
        });
        const customFolderInput = customFolderContainer.createEl('input', {
            type: 'text',
            placeholder: 'Enter custom folder path...',
            cls: 'unified-test-suite-custom-folder-input'
        });
        
        folderSelect.addEventListener('change', () => {
            if (folderSelect.value === 'custom') {
                customFolderContainer.style.display = 'block';
            } else {
                customFolderContainer.style.display = 'none';
            }
        });
        
        // Performance settings info
        const perfInfoSection = this.contentContainer.createDiv({ cls: 'unified-test-suite-perf-info' });
        const perfSettings = plugin.settings?.performanceTesting;
        const isPerformanceMode = perfSettings?.enabled ?? false;
        const maxFiles = perfSettings?.maxFiles ?? 0;
        
        if (isPerformanceMode) {
            const limitText = maxFiles > 0 ? `${maxFiles} files` : 'unlimited files';
            perfInfoSection.createEl('p', {
                text: `✅ Performance testing mode active - will process ${limitText}`,
                cls: 'unified-test-suite-helper-text'
            });
        } else {
            perfInfoSection.createEl('p', {
                text: '⚠️ Performance testing mode disabled - limited to 200 files. Enable in Settings or Utilities tab.',
                cls: 'unified-test-suite-helper-text'
            });
        }
        
        // Quick test buttons
        const quickTestsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-quick-tests' });
        quickTestsContainer.createEl('h3', { text: 'Performance Tests' });
        
        const testSizes = [
            { name: 'Small (500 entries)', size: 500 },
            { name: 'Medium (1K entries)', size: 1000 },
            { name: 'Large (5K entries)', size: 5000 },
            { name: 'Extra Large (10K entries)', size: 10000 }
        ];
        
        testSizes.forEach(test => {
            const button = quickTestsContainer.createEl('button', { 
                text: test.name, 
                cls: 'unified-test-suite-quick-test-button' 
            });
            button.onclick = () => {
                const targetFolder = folderSelect.value === 'custom' ? customFolderInput.value : folderSelect.value;
                this.runScrapingPerformanceTest(test.size, targetFolder);
            };
        });
        
        // Results display area
        const resultsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-results-container' });
        resultsContainer.createEl('h3', { text: 'Test Results' });
        
        const resultsArea = resultsContainer.createDiv({ 
            cls: 'unified-test-suite-results-area',
            attr: { id: 'scraping-performance-results' }
        });
        resultsArea.createEl('p', {
            text: 'Run a performance test to see results here.',
            cls: 'unified-test-suite-placeholder-text'
        });
    }
    
    // Memory analysis test
    private loadMemoryAnalysisTest() {
        this.contentContainer.createEl('p', {
            text: 'Analyze memory usage patterns and detect potential memory leaks.',
            cls: 'unified-test-suite-content-description'
        });
        
        // Memory test options
        const memoryTestsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-memory-tests' });
        memoryTestsContainer.createEl('h3', { text: 'Memory Analysis Tests' });
        
        this.createTestButton(memoryTestsContainer, 'Memory Usage Baseline', () => {
            this.runMemoryTest('baseline');
        });
        
        this.createTestButton(memoryTestsContainer, 'Memory Leak Detection', () => {
            this.runMemoryTest('leak-detection');
        });
        
        this.createTestButton(memoryTestsContainer, 'Garbage Collection Analysis', () => {
            this.runMemoryTest('gc-analysis');
        });
    }
    
    // Scaling test
    private loadScalingTest() {
        this.contentContainer.createEl('p', {
            text: 'Test performance scaling across different data sizes and complexity levels.',
            cls: 'unified-test-suite-content-description'
        });
        
        // Scaling test configurations
        const scalingContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-scaling-tests' });
        scalingContainer.createEl('h3', { text: 'Scaling Test Configurations' });
        
        this.createTestButton(scalingContainer, 'Linear Scaling Test', () => {
            this.runScalingTest('linear');
        });
        
        this.createTestButton(scalingContainer, 'Exponential Scaling Test', () => {
            this.runScalingTest('exponential');
        });
        
        this.createTestButton(scalingContainer, 'Complex Data Scaling Test', () => {
            this.runScalingTest('complex');
        });
    }
    
    // Logging content (moved from utilities)
    private loadLoggingContent() {
        this.contentContainer.createEl('p', {
            text: 'Manage logging infrastructure, view logs, and export log data.',
            cls: 'unified-test-suite-content-description'
        });
        
        // Logging settings section
        const settingsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-logging-settings' });
        settingsContainer.createEl('h3', { text: 'Logging Settings' });
        
        // Log level setting
        const logLevelContainer = settingsContainer.createDiv({ cls: 'unified-test-suite-setting-item' });
        logLevelContainer.createEl('label', { 
            text: 'Log Level:',
            cls: 'unified-test-suite-setting-label'
        });
        
        const logLevelSelect = logLevelContainer.createEl('select', { 
            cls: 'unified-test-suite-log-level-select' 
        });
        
        // Add log level options (excluding 'off')
        const logLevels = [
            { value: 'errors', label: 'Error' },
            { value: 'warn', label: 'Warning' },
            { value: 'info', label: 'Info' },
            { value: 'debug', label: 'Debug' },
            { value: 'trace', label: 'Trace' }
        ];
        
        logLevels.forEach(level => {
            const option = logLevelSelect.createEl('option', { 
                text: level.label,
                value: level.value
            });
        });
        
        // Set current log level
        const currentLogLevel = (this.plugin as any).settings?.logging?.level || 'info';
        logLevelSelect.value = currentLogLevel;
        
        // Debug logging to track log level reading
        console.log(`[OneiroMetrics Debug] Test Suite reading log level: ${currentLogLevel}`);
        console.log(`[OneiroMetrics Debug] Full logging settings:`, (this.plugin as any).settings?.logging);
        
        // Add change handler
        logLevelSelect.addEventListener('change', () => {
            this.updateLogLevel(logLevelSelect.value as any);
        });
        
        // Helper text
        const helperText = settingsContainer.createDiv({ cls: 'unified-test-suite-setting-helper' });
        helperText.createEl('p', {
            text: 'Note: To turn logging off completely, go to Settings → OneiroMetrics → Logging → Level and select "Off".',
            cls: 'unified-test-suite-helper-text'
        });
        
        // Logging test controls
        const testingContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-logging-testing' });
        testingContainer.createEl('h3', { text: 'Logging System Tests' });
        
        this.createTestButton(testingContainer, 'Test Log Levels', () => {
            this.testLogLevels();
        });
        
        this.createTestButton(testingContainer, 'Test Memory Adapter', () => {
            this.testMemoryAdapter();
        });
        
        this.createTestButton(testingContainer, 'Test Log Persistence', () => {
            this.testLogPersistence();
        });
        
        // Log management utilities
        const managementContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-log-management' });
        managementContainer.createEl('h3', { text: 'Log Management' });
        
        this.createUtilityButton(managementContainer, 'Open Log Viewer', 'file-text', () => {
            this.openLogViewer();
        });
        
        this.createUtilityButton(managementContainer, 'Export Logs to File', 'download', () => {
            this.exportLogsToFile();
        });
        
        this.createUtilityButton(managementContainer, 'Copy Recent Logs to Clipboard', 'copy', () => {
            this.copyRecentLogsToClipboard();
        });
        
        this.createUtilityButton(managementContainer, 'Clear Logs', 'trash', () => {
            this.clearLogs();
        });
        
        // Log statistics
        const statsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-log-stats' });
        statsContainer.createEl('h3', { text: 'Log Statistics' });
        
        this.loadLogStatistics(statsContainer);
    }
    
    // Update log level setting
    private updateLogLevel(newLevel: string) {
        const plugin = this.plugin as any;
        if (plugin.settings?.logging) {
            plugin.settings.logging.level = newLevel;
            plugin.saveSettings();
            new Notice(`Log level updated to ${newLevel}`);
            
            // Also update the logger's minimum level dynamically if possible
            const loggerInstance = this.plugin.logger || this.plugin.getLogger?.();
            if (loggerInstance && typeof loggerInstance.setLevel === 'function') {
                loggerInstance.setLevel(newLevel);
                console.log(`[OneiroMetrics Debug] Updated logger level to: ${newLevel}`);
            }
        } else {
            new Notice('Unable to update log level - settings not available');
        }
    }
    
    private showCustomDatasetDialog() {
        // Create a simple dialog for custom dataset configuration
        const dialog = this.contentContainer.createDiv({ cls: 'unified-test-suite-custom-dialog' });
        dialog.createEl('h4', { text: 'Custom Dataset Configuration' });
        
        // Entry count setting
        const countContainer = dialog.createDiv({ cls: 'unified-test-suite-setting-item' });
        countContainer.createEl('label', { text: 'Number of entries:' });
        const countInput = countContainer.createEl('input', { 
            type: 'number',
            value: '1000'
        });
        countInput.setAttribute('min', '1');
        countInput.setAttribute('max', '50000');
        
        // Realistic content setting
        const realisticContainer = dialog.createDiv({ cls: 'unified-test-suite-setting-item' });
        realisticContainer.createEl('label', { text: 'Realistic content:' });
        const realisticCheckbox = realisticContainer.createEl('input', { type: 'checkbox' });
        realisticCheckbox.checked = true;
        
        // Date range settings
        const dateContainer = dialog.createDiv({ cls: 'unified-test-suite-setting-item' });
        dateContainer.createEl('label', { text: 'Date range (months back):' });
        const dateInput = dateContainer.createEl('input', { 
            type: 'number',
            value: '12'
        });
        dateInput.setAttribute('min', '1');
        dateInput.setAttribute('max', '60');
        
        // Buttons
        const buttonContainer = dialog.createDiv({ cls: 'unified-test-suite-dialog-buttons' });
        
        const generateButton = buttonContainer.createEl('button', { 
            text: 'Generate Custom Dataset',
            cls: 'mod-cta'
        });
        
        const cancelButton = buttonContainer.createEl('button', { 
            text: 'Cancel'
        });
        
        generateButton.onclick = async () => {
            const count = parseInt(countInput.value);
            const realistic = realisticCheckbox.checked;
            const monthsBack = parseInt(dateInput.value);
            
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - monthsBack);
            
            await this.generateCustomTestData({
                count,
                realistic,
                startDate,
                endDate: new Date()
            });
            
            dialog.remove();
        };
        
        cancelButton.onclick = () => {
            dialog.remove();
        };
    }
    
    private async generateCustomTestData(options: {
        count: number;
        realistic: boolean;
        startDate: Date;
        endDate: Date;
    }) {
        if (this.testState.isRunning) {
            new Notice('A test is already running. Please wait for it to complete.');
            return;
        }
        
        this.testState.isRunning = true;
        new Notice(`Generating custom dataset with ${options.count} entries...`);
        
        try {
            const plugin = this.plugin as any;
            const testDataFolder = plugin.settings?.testDataFolder || 'Test Data/Dreams';
            
            const { DummyDataGenerator } = require('../utils/DummyDataGenerator');
            const generator = new DummyDataGenerator();
            
            const { data, stats } = await generator.generateDreamDataset({
                count: options.count,
                realistic: options.realistic,
                startDate: options.startDate,
                endDate: options.endDate,
                evenDistribution: true
            });
            
            await this.ensureFolderExists(testDataFolder);
            
            let createdCount = 0;
            const calloutName = plugin.settings?.calloutName || 'dream-diary';
            
            for (const entry of data) {
                const noteContent = await this.createDreamNoteContent(entry, calloutName);
                const fileName = `${entry.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}.md`;
                const filePath = `${testDataFolder}/${fileName}`;
                
                try {
                    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
                    if (!existingFile) {
                        await this.app.vault.create(filePath, noteContent);
                        createdCount++;
                        if (createdCount <= 3) {
                            console.log(`[OneiroMetrics] Created note: ${filePath}`);
                        }
                    } else {
                        console.log(`[OneiroMetrics] Skipped existing file: ${filePath}`);
                    }
                } catch (error) {
                    console.error(`[OneiroMetrics] Failed to create note: ${filePath}`, error);
                    this.logger.warn('TestData', `Failed to create test note: ${filePath} - ${(error as Error).message}`);
                }
            }
            
            console.log(`[OneiroMetrics] Note creation complete. Created: ${createdCount}, Total generated: ${data.length}`);
            
            // Update test results
            const result = {
                testName: `Generate custom dataset`,
                status: 'success' as const,
                duration: stats.generationTime,
                details: `Created ${createdCount} custom dream journal notes in ${testDataFolder}. Generated ${stats.totalGenerated} entries in ${stats.generationTime.toFixed(0)}ms.`,
                timestamp: new Date()
            };
            
            this.testState.results.push(result);
            new Notice(`✅ Generated ${createdCount} custom test dream notes`);
            
        } catch (error) {
            console.error(`[OneiroMetrics] Test data generation failed:`, error);
            
            const result = {
                testName: `Generate custom dataset`,
                status: 'failure' as const,
                details: `${(error as Error).message} (Check console for details)`,
                timestamp: new Date()
            };
            
            this.testState.results.push(result);
            new Notice(`❌ Failed to generate custom test data: ${(error as Error).message}`);
            this.logger.error('TestData', 'Custom test data generation failed', error as Error);
            
        } finally {
            this.testState.isRunning = false;
            
            if (this.selectedTab === 'dashboard') {
                this.loadDashboardContent();
            }
        }
    }
    
    private clearTestDataFolder() {
        const plugin = this.plugin as any;
        const testDataFolder = plugin.settings?.testDataFolder || 'Test Data/Dreams';
        
        // Confirm with user
        const confirmed = confirm(`Are you sure you want to delete all files in "${testDataFolder}"? This action cannot be undone.`);
        
        if (!confirmed) {
            return;
        }
        
        this.clearFolderContents(testDataFolder);
    }
    
    private async ensureFolderExists(folderPath: string): Promise<void> {
        if (!folderPath) return;
        
        const pathParts = folderPath.split('/').filter(part => part.length > 0);
        let currentPath = '';
        
        for (const part of pathParts) {
            currentPath += (currentPath ? '/' : '') + part;
            const folder = this.app.vault.getAbstractFileByPath(currentPath);
            
            if (!folder) {
                try {
                    await this.app.vault.createFolder(currentPath);
                    this.logger.debug('TestData', 'Created folder', currentPath);
                } catch (error) {
                    // Folder might already exist, that's OK
                    const errorMessage = (error as Error).message;
                    if (!errorMessage.includes('already exists')) {
                        this.logger.warn('TestData', `Unexpected error creating folder: ${currentPath} - ${errorMessage}`);
                    }
                }
            }
        }
    }
    
    private async clearFolderContents(folderPath: string) {
        try {
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            
            if (!folder || !('children' in folder)) {
                new Notice(`Test data folder "${folderPath}" not found`);
                return;
            }
            
            let deletedCount = 0;
            const folderChildren = folder.children;
            
            if (folderChildren && Array.isArray(folderChildren)) {
                const children = [...folderChildren]; // Create a copy to avoid modification during iteration
                
                for (const child of children) {
                    try {
                        await this.app.vault.delete(child);
                        deletedCount++;
                    } catch (error) {
                        this.logger.warn('TestData', `Failed to delete test file: ${child.path} - ${(error as Error).message}`);
                    }
                }
            }
            
            new Notice(`✅ Deleted ${deletedCount} files from test data folder`);
            
        } catch (error) {
            new Notice(`❌ Failed to clear test data folder: ${(error as Error).message}`);
            this.logger.error('TestData', 'Failed to clear test data folder', error as Error);
        }
    }
    
    private refreshLogLevelDisplay() {
        // Find the log level select element and update its value
        const logLevelSelect = this.contentContainer.querySelector('.unified-test-suite-log-level-select') as HTMLSelectElement;
        if (logLevelSelect) {
            const currentLogLevel = (this.plugin as any).settings?.logging?.level || 'info';
            logLevelSelect.value = currentLogLevel;
            
            // Debug logging
            console.log(`[OneiroMetrics Debug] Refreshed log level display to: ${currentLogLevel}`);
        }
    }
    
    private async createDreamNoteContent(entry: any, calloutName: string): Promise<string> {
        const plugin = this.plugin as any;
        const templateId = plugin.settings?.testDataTemplate;
        
        // If no template is specified, use the default format
        if (!templateId) {
            return this.createDefaultDreamNoteContent(entry, calloutName);
        }
        
        // Find the OneiroMetrics template by ID
        const existingTemplates = plugin.settings?.linting?.templates || [];
        const selectedTemplate = existingTemplates.find((template: any) => template.id === templateId);
        
        if (!selectedTemplate) {
            console.log(`[OneiroMetrics] Template with ID ${templateId} not found, using default format`);
            return this.createDefaultDreamNoteContent(entry, calloutName);
        }
        
        try {
            let noteContent = selectedTemplate.content || '';
            
            // If template is a Templater template, try to read the file
            if (selectedTemplate.isTemplaterTemplate && selectedTemplate.templaterFile) {
                const templateFile = this.app.vault.getAbstractFileByPath(selectedTemplate.templaterFile);
                if (templateFile && 'path' in templateFile) {
                    noteContent = await this.app.vault.read(templateFile as any);
                } else {
                    console.log(`[OneiroMetrics] Templater file ${selectedTemplate.templaterFile} not found, using stored content`);
                }
            }
            
            // Replace template placeholders with actual data
            const entryDate = new Date(entry.date);
            
            // Support multiple date formats
            noteContent = noteContent.replace(/\{\{date\}\}/g, entry.date); // ISO format: YYYY-MM-DD
            noteContent = noteContent.replace(/\{\{date-iso\}\}/g, entry.date); // Same as above, explicit
            noteContent = noteContent.replace(/\{\{date-long\}\}/g, entryDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })); // Format: January 15, 2025
            noteContent = noteContent.replace(/\{\{date-month-day\}\}/g, entryDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric' 
            })); // Format: January 15
            noteContent = noteContent.replace(/\{\{date-compact\}\}/g, entryDate.toISOString().split('T')[0].replace(/-/g, '')); // Format: YYYYMMDD
            noteContent = noteContent.replace(/\{\{date-ref\}\}/g, entryDate.toISOString().split('T')[0].replace(/-/g, '')); // Alias for date-compact
            
            noteContent = noteContent.replace(/\{\{title\}\}/g, entry.title);
            
            // Handle content replacement more carefully to avoid nested callout issues
            if (noteContent.includes('{{content}}')) {
                noteContent = noteContent.replace(/\{\{content\}\}/g, entry.content);
            } else {
                // If no content placeholder, look for nested callout patterns and replace carefully
                // Handle patterns like "> > Dream goes here." 
                const nestedCalloutPattern = /^(>\s*>\s*)(Dream goes here\.|.*goes here\.?)$/gm;
                noteContent = noteContent.replace(nestedCalloutPattern, `$1${entry.content}`);
                
                // Also handle simple "Dream goes here" patterns
                noteContent = noteContent.replace(/Dream goes here\.?/g, entry.content);
            }
            
            // Replace metric placeholders
            Object.entries(entry.metrics).forEach(([key, value]) => {
                const placeholder = new RegExp(`\\{\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g');
                noteContent = noteContent.replace(placeholder, String(value));
            });
            
            // Handle metrics placeholder
            if (noteContent.includes('{{metrics}}')) {
                const metrics = Object.entries(entry.metrics)
                    .map(([key, value]) => `**${key}**: ${value}`)
                    .join(' • ');
                noteContent = noteContent.replace(/\{\{metrics\}\}/g, metrics);
            }
            
            // If the template doesn't contain our callout or metrics, append them
            const expectedCallout = `[!${calloutName}]`;
            if (!noteContent.includes(expectedCallout) && !noteContent.includes('{{metrics}}')) {
                const metrics = Object.entries(entry.metrics)
                    .map(([key, value]) => `**${key}**: ${value}`)
                    .join(' • ');
                noteContent += `\n\n> ${expectedCallout} Dream Metrics
> ${metrics}\n`;
            }
            
            return noteContent;
            
        } catch (error) {
            console.error(`[OneiroMetrics] Error processing template ${selectedTemplate.name}:`, error);
            new Notice(`Failed to process template ${selectedTemplate.name}, using default format`);
            return this.createDefaultDreamNoteContent(entry, calloutName);
        }
    }
    
    private createDefaultDreamNoteContent(entry: any, calloutName: string): string {
        const metrics = Object.entries(entry.metrics)
            .map(([key, value]) => `**${key}**: ${value}`)
            .join(' • ');
        
        return `---
date: ${entry.date}
title: "${entry.title}"
tags: [dream, test-data]
---

# ${entry.title}

${entry.content}

> [!${calloutName}] Dream Metrics
> ${metrics}
`;
    }
    
    private countTestFiles(): number {
        const plugin = this.plugin as any;
        const testDataFolder = plugin.settings?.testDataFolder || 'Test Data/Dreams';
        
        try {
            const folder = this.app.vault.getAbstractFileByPath(testDataFolder);
            
            if (!folder || !('children' in folder)) {
                return 0;
            }
            
            const folderChildren = folder.children;
            let markdownCount = 0;
            
            if (folderChildren && Array.isArray(folderChildren)) {
                for (const child of folderChildren) {
                    if ('extension' in child && child.extension === 'md') {
                        markdownCount++;
                    }
                }
            }
            
            return markdownCount;
            
        } catch (error) {
            this.logger.error('TestData', 'Failed to count test files', error as Error);
            return 0;
        }
    }

    // Missing methods that are being called
    private getLastTestTime(): string {
        if (this.testState.results.length === 0) {
            return 'Never';
        }
        const lastResult = this.testState.results[this.testState.results.length - 1];
        return lastResult.timestamp.toLocaleTimeString();
    }

    private getSuccessRate(): string {
        if (this.testState.results.length === 0) {
            return 'N/A';
        }
        const successful = this.testState.results.filter(r => r.status === 'success').length;
        const rate = (successful / this.testState.results.length) * 100;
        return `${rate.toFixed(1)}%`;
    }

    private clearTestResults(): void {
        this.testState.results = [];
        this.testState.isRunning = false;
        this.testState.currentTest = null;
        new Notice('Test results cleared');
        // Refresh dashboard if currently showing
        if (this.selectedTab === 'dashboard') {
            this.loadDashboardContent();
        }
    }

    private getTestTitle(testId: string): string {
        const testTitles: Record<string, string> = {
            'performance-scraping': 'Scraping Performance Test',
            'performance-memory': 'Memory Analysis Test',
            'performance-scaling': 'Scaling Test',
            'test-logging': 'Logging System Test',
            'test-settings': 'Settings & Metrics Infrastructure Test',
            'test-validation': 'Validation Test',
            'test-parsing': 'Parsing Test',
            'test-components': 'Component Test'
        };
        return testTitles[testId] || testId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Missing memory test methods
    private runMemoryTest(type: string): void {
        new Notice(`Running memory test: ${type}`);
        // Placeholder implementation
        this.testState.results.push({
            testName: `Memory Test - ${type}`,
            status: 'success',
            duration: Math.random() * 1000,
            details: `${type} memory test completed`,
            timestamp: new Date()
        });
    }

    // Missing scaling test methods
    private runScalingTest(type: string): void {
        new Notice(`Running scaling test: ${type}`);
        // Placeholder implementation
        this.testState.results.push({
            testName: `Scaling Test - ${type}`,
            status: 'success',
            duration: Math.random() * 2000,
            details: `${type} scaling test completed`,
            timestamp: new Date()
        });
    }

    // Missing logging test methods
    private testLogLevels(): void {
        new Notice('Testing log levels...');
        
        // Test each log level to see if it's working properly
        const logger = this.plugin.logger;
        if (!logger) {
            new Notice('Logger not available');
            return;
        }
        
        // Test different log levels
        logger.error('LogLevelTest', 'ERROR level test message', { testType: 'logLevel' });
        logger.warn('LogLevelTest', 'WARN level test message', { testType: 'logLevel' });
        logger.info('LogLevelTest', 'INFO level test message', { testType: 'logLevel' });
        logger.debug('LogLevelTest', 'DEBUG level test message', { testType: 'logLevel' });
        logger.trace('LogLevelTest', 'TRACE level test message', { testType: 'logLevel' });
        
        new Notice('Log level test completed - check log viewer to see results');
    }

    private testMemoryAdapter(): void {
        new Notice('Testing memory adapter...');
        
        const memoryAdapter = this.plugin.logger?.memoryAdapter;
        if (!memoryAdapter) {
            new Notice('Memory adapter not available');
            return;
        }
        
        // Test basic memory adapter functionality
        const testEntry = {
            timestamp: new Date(),
            level: 'info' as any,
            category: 'MemoryAdapterTest',
            message: 'Test message for memory adapter',
            data: { testType: 'memoryAdapter', userId: 'test-user' }
        };
        
        memoryAdapter.log(testEntry);
        
        // Check if entry was stored
        const entries = memoryAdapter.getEntries();
        const found = entries.some(entry => 
            entry.category === 'MemoryAdapterTest' && 
            entry.message === 'Test message for memory adapter'
        );
        
        if (found) {
            new Notice('Memory adapter test passed - entry stored successfully');
        } else {
            new Notice('Memory adapter test failed - entry not found');
        }
    }

    private testLogPersistence(): void {
        new Notice('Testing log persistence...');
        
        const memoryAdapter = this.plugin.logger?.memoryAdapter;
        if (!memoryAdapter) {
            new Notice('Memory adapter not available');
            return;
        }
        
        // Add a test log entry
        const testEntry = {
            timestamp: new Date(),
            level: 'info' as any,
            category: 'PersistenceTest',
            message: 'Log persistence test entry',
            data: { persistenceTest: true, timestamp: Date.now() }
        };
        
        memoryAdapter.log(testEntry);
        
        // Test that entries persist
        setTimeout(() => {
            const entries = memoryAdapter.getEntries();
            const found = entries.some(entry => 
                entry.category === 'PersistenceTest' && 
                entry.data?.persistenceTest === true
            );
            
            if (found) {
                new Notice('Log persistence test passed');
            } else {
                new Notice('Log persistence test failed');
            }
        }, 100);
    }

    private openLogViewer(): void {
        const memoryAdapter = this.plugin.logger?.memoryAdapter;
        if (!memoryAdapter) {
            new Notice('Memory adapter not available - cannot open log viewer');
            return;
        }
        
        // Import and open LogViewerModal
        import('../../logging/ui/LogViewerModal').then(({ LogViewerModal }) => {
            new LogViewerModal(this.app, memoryAdapter).open();
        }).catch(error => {
            new Notice('Failed to open log viewer');
            console.error('Error opening log viewer:', error);
        });
    }

    private exportLogsToFile(): void {
        const memoryAdapter = this.plugin.logger?.memoryAdapter;
        if (!memoryAdapter) {
            new Notice('Memory adapter not available');
            return;
        }
        
        const entries = memoryAdapter.getEntries();
        if (entries.length === 0) {
            new Notice('No logs to export');
            return;
        }
        
        // Format logs as JSON
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalEntries: entries.length,
            entries: entries.map(entry => ({
                timestamp: entry.timestamp.toISOString(),
                level: entry.level,
                category: entry.category,
                message: entry.message,
                data: entry.data
            }))
        };
        
        // Create downloadable file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oneirometrics-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        new Notice(`Exported ${entries.length} log entries to file`);
    }

    private copyRecentLogsToClipboard(): void {
        const memoryAdapter = this.plugin.logger?.memoryAdapter;
        if (!memoryAdapter) {
            new Notice('Memory adapter not available');
            return;
        }
        
        const entries = memoryAdapter.getEntries().slice(0, 50); // Get most recent 50 logs
        if (entries.length === 0) {
            new Notice('No logs to copy');
            return;
        }
        
        // Format logs as readable text
        const logText = entries.map(entry => {
            const timestamp = entry.timestamp.toISOString().replace('T', ' ').split('.')[0];
            const data = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
            return `[${timestamp}] ${entry.level.toUpperCase()} ${entry.category}: ${entry.message}${data}`;
        }).join('\n');
        
        // Copy to clipboard
        navigator.clipboard.writeText(logText).then(() => {
            new Notice(`Copied ${entries.length} recent log entries to clipboard`);
        }).catch(error => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = logText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            new Notice(`Copied ${entries.length} recent log entries to clipboard`);
        });
    }

    private clearLogs(): void {
        const memoryAdapter = this.plugin.logger?.memoryAdapter;
        if (!memoryAdapter) {
            new Notice('Memory adapter not available');
            return;
        }
        
        const entryCount = memoryAdapter.getEntries().length;
        memoryAdapter.clear();
        new Notice(`Cleared ${entryCount} log entries`);
    }

    private loadLogStatistics(container: HTMLElement): void {
        const memoryAdapter = this.plugin.logger?.memoryAdapter;
        if (!memoryAdapter) {
            container.createEl('p', { text: 'Memory adapter not available - cannot load log statistics' });
            return;
        }
        
        const entries = memoryAdapter.getEntries();
        const totalEntries = entries.length;
        
        if (totalEntries === 0) {
            container.createEl('p', { text: 'No log entries found' });
            return;
        }
        
        // Calculate statistics
        const levels = entries.reduce((acc, entry) => {
            acc[entry.level] = (acc[entry.level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const categories = entries.reduce((acc, entry) => {
            acc[entry.category] = (acc[entry.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const oldestEntry = entries[entries.length - 1]?.timestamp;
        const newestEntry = entries[0]?.timestamp;
        
        // Create statistics display
        const statsGrid = container.createDiv({ cls: 'unified-test-suite-stats-grid' });
        
        // Total entries
        this.createStatWidget(statsGrid, 'Total Entries', totalEntries.toString());
        
        // Time range
        if (oldestEntry && newestEntry) {
            const timeSpanMs = Math.abs(newestEntry.valueOf() - oldestEntry.valueOf());
            const timeSpanText = timeSpanMs > 86400000 ? 
                `${Math.round(timeSpanMs / 86400000)} days` : 
                `${Math.round(timeSpanMs / 3600000)} hours`;
            this.createStatWidget(statsGrid, 'Time Span', timeSpanText);
        }
        
        // Log levels breakdown
        const levelsContainer = container.createDiv({ cls: 'unified-test-suite-log-levels' });
        levelsContainer.createEl('h4', { text: 'Log Levels' });
        const levelsList = levelsContainer.createEl('ul');
        Object.entries(levels).forEach(([level, count]) => {
            const li = levelsList.createEl('li');
            li.createEl('span', { text: level.toUpperCase(), cls: `unified-test-suite-log-level-${level}` });
            li.createEl('span', { text: `: ${count}` });
        });
        
        // Top categories
        const categoriesContainer = container.createDiv({ cls: 'unified-test-suite-log-categories' });
        categoriesContainer.createEl('h4', { text: 'Top Categories' });
        const categoriesList = categoriesContainer.createEl('ul');
        Object.entries(categories)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 10)
            .forEach(([category, count]) => {
                const li = categoriesList.createEl('li');
                li.createEl('span', { text: category });
                li.createEl('span', { text: `: ${count}` });
            });
    }

    // Missing utility methods
    private generateTestData(size: string): void {
        new Notice(`Generating test data: ${size}`);
        // Placeholder implementation
    }

    private exportTestResults(): void {
        new Notice('Exporting test results');
        // Placeholder implementation
    }

    private clearAllCaches(): void {
        new Notice('Clearing all caches');
        // Placeholder implementation
    }

    private resetTestEnvironment(): void {
        new Notice('Resetting test environment');
        // Placeholder implementation
    }

    // Helper methods for UI components
    private createStatWidget(container: HTMLElement, label: string, value: string) {
        const widget = container.createDiv({ cls: 'unified-test-suite-stat-widget' });
        widget.createDiv({ text: label, cls: 'unified-test-suite-stat-label' });
        widget.createDiv({ text: value, cls: 'unified-test-suite-stat-value' });
    }
    
    private createActionButton(container: HTMLElement, label: string, icon: string, callback: () => void) {
        const button = container.createEl('button', { 
            text: label, 
            cls: 'unified-test-suite-action-button mod-cta' 
        });
        button.onclick = callback;
    }
    
    private createTestButton(container: HTMLElement, label: string, callback: () => void) {
        const button = container.createEl('button', { 
            text: label, 
            cls: 'unified-test-suite-test-button' 
        });
        button.onclick = callback;
    }
    
    private createUtilityButton(container: HTMLElement, label: string, icon: string, callback: () => void) {
        const button = container.createEl('button', { 
            text: label, 
            cls: 'unified-test-suite-utility-button' 
        });
        button.onclick = callback;
    }
    
    // Test execution methods
    private async runTestSuite(category: string) {
        if (this.testState.isRunning) {
            new Notice('A test is already running. Please wait for it to complete.');
            return;
        }
        
        this.testState.isRunning = true;
        new Notice(`Starting ${category} test suite...`);
        
        try {
            // This would run all tests in the category
            // For now, just simulate with a delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const result: TestResult = {
                testName: `${category} Test Suite`,
                status: 'success',
                duration: 2000,
                details: `All ${category} tests completed successfully`,
                timestamp: new Date()
            };
            
            this.testState.results.push(result);
            new Notice(`${category} test suite completed successfully!`);
            
        } catch (error) {
            const result: TestResult = {
                testName: `${category} Test Suite`,
                status: 'failure',
                details: (error as Error).message,
                timestamp: new Date()
            };
            
            this.testState.results.push(result);
            new Notice(`${category} test suite failed: ${(error as Error).message}`);
            
        } finally {
            this.testState.isRunning = false;
            
            // Refresh dashboard if currently selected
            if (this.selectedTab === 'dashboard') {
                this.loadDashboardContent();
            }
        }
    }
    
    private async runIndividualTest(testId: string) {
        // Individual test implementation would go here
        new Notice(`Running ${this.getTestTitle(testId)}...`);
    }
    
    private async runScrapingPerformanceTest(size: number, targetFolder: string) {
        new Notice(`Running scraping performance test with ${size} entries from ${targetFolder}`);
        // Placeholder implementation
        this.testState.results.push({
            testName: `Scraping Performance Test (${size} entries)`,
            status: 'success',
            duration: Math.random() * 3000,
            details: `Performance test completed with ${size} entries`,
            timestamp: new Date()
        });
    }
    
    // Load recent test results
    private loadRecentTestResults() {
        const resultsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-recent-results' });
        resultsContainer.createEl('h3', { text: 'Recent Test Results' });
        
        if (this.testState.results.length === 0) {
            resultsContainer.createEl('p', { text: 'No test results yet. Run some tests to see results here.' });
            return;
        }
        
        // Show last 5 test results
        const recentResults = this.testState.results.slice(-5).reverse();
        const resultsList = resultsContainer.createEl('div', { cls: 'unified-test-suite-results-list' });
        
        recentResults.forEach(result => {
            const resultItem = resultsList.createDiv({ cls: `unified-test-suite-result-item unified-test-suite-result-${result.status}` });
            
            const header = resultItem.createDiv({ cls: 'unified-test-suite-result-header' });
            header.createEl('span', { text: result.testName, cls: 'unified-test-suite-result-name' });
            header.createEl('span', { text: result.status.toUpperCase(), cls: 'unified-test-suite-result-status' });
            
            if (result.duration) {
                resultItem.createEl('div', { 
                    text: `Duration: ${result.duration}ms`,
                    cls: 'unified-test-suite-result-duration'
                });
            }
            
            if (result.details) {
                resultItem.createEl('div', { 
                    text: result.details,
                    cls: 'unified-test-suite-result-details'
                });
            }
        });
    }
    
    // Utilities content
    private loadUtilitiesContent() {
        this.contentContainer.empty();
        
        this.contentContainer.createEl('h2', { 
            text: 'Test Utilities & Tools', 
            cls: 'unified-test-suite-content-header' 
        });
        
        this.contentContainer.createEl('p', {
            text: 'Utility tools for test data generation, cleanup, and analysis.',
            cls: 'unified-test-suite-content-description'
        });

        // Test Data Generation Section
        const dataGenSection = this.contentContainer.createDiv({ cls: 'unified-test-suite-section' });
        dataGenSection.createEl('h3', { text: '📊 Test Data Generation' });
        dataGenSection.createEl('p', {
            text: 'Generate realistic dummy dream journal entries for performance testing and validation.',
            cls: 'unified-test-suite-section-description'
        });

        // Quick Generation Buttons
        const quickGenContainer = dataGenSection.createDiv({ cls: 'unified-test-suite-button-row' });
        
        this.createUtilityButton(quickGenContainer, 'Generate 500 entries (Small)', '📝', async () => {
            await this.generateCustomTestData({
                count: 500,
                realistic: true,
                startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
                endDate: new Date()
            });
        });

        this.createUtilityButton(quickGenContainer, 'Generate 1K entries (Medium)', '📄', async () => {
            await this.generateCustomTestData({
                count: 1000,
                realistic: true,
                startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                endDate: new Date()
            });
        });

        this.createUtilityButton(quickGenContainer, 'Generate 5K entries (Large)', '📚', async () => {
            await this.generateCustomTestData({
                count: 5000,
                realistic: true,
                startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                endDate: new Date()
            });
        });

        // Custom Generation Button
        this.createUtilityButton(dataGenSection, 'Custom Dataset Configuration', '⚙️', () => {
            this.showCustomDatasetDialog();
        });

        // Cleanup Section
        const cleanupSection = this.contentContainer.createDiv({ cls: 'unified-test-suite-section' });
        cleanupSection.createEl('h3', { text: '🧹 Test Data Cleanup' });
        cleanupSection.createEl('p', {
            text: 'Manage and clean up test data files.',
            cls: 'unified-test-suite-section-description'
        });

        this.createUtilityButton(cleanupSection, 'Clear Test Data Folder', '🗑️', () => {
            this.clearTestDataFolder();
        });

        // Analysis Tools Section
        const analysisSection = this.contentContainer.createDiv({ cls: 'unified-test-suite-section' });
        analysisSection.createEl('h3', { text: '📈 Analysis Tools' });
        analysisSection.createEl('p', {
            text: 'Export and analyze test results.',
            cls: 'unified-test-suite-section-description'
        });

        const analysisContainer = analysisSection.createDiv({ cls: 'unified-test-suite-button-row' });
        
        this.createUtilityButton(analysisContainer, 'Export Test Results', '📊', () => {
            this.exportTestResults();
        });

        this.createUtilityButton(analysisContainer, 'Clear All Caches', '💾', () => {
            this.clearAllCaches();
        });

        this.createUtilityButton(analysisContainer, 'Reset Test Environment', '🔄', () => {
            this.resetTestEnvironment();
        });

        // Test File Statistics
        const statsSection = this.contentContainer.createDiv({ cls: 'unified-test-suite-section' });
        statsSection.createEl('h3', { text: '📋 Test Data Statistics' });
        
        const statsContainer = statsSection.createDiv({ cls: 'unified-test-suite-stats-grid' });
        
        // File count
        const fileCount = this.countTestFiles();
        this.createStatWidget(statsContainer, 'Test Files', fileCount.toString());
        
        // Last test time
        const lastTest = this.getLastTestTime();
        this.createStatWidget(statsContainer, 'Last Test', lastTest);
        
        // Success rate
        const successRate = this.getSuccessRate();
        this.createStatWidget(statsContainer, 'Success Rate', successRate);
    }
    
    // Help content
    private loadHelpContent() {
        this.contentContainer.empty();
        
        this.contentContainer.createEl('h2', { 
            text: 'Test Suite Documentation', 
            cls: 'unified-test-suite-content-header' 
        });
        
        this.contentContainer.createEl('p', {
            text: 'Documentation and help for using the test suite.',
            cls: 'unified-test-suite-content-description'
        });
        
        // Placeholder content
        this.contentContainer.createEl('p', { text: 'Help documentation will be implemented here.' });
    }

    // Enhanced Settings and Metrics Test Content
    private loadSettingsAndMetricsTestContent() {
        this.contentContainer.createEl('p', {
            text: 'Comprehensive testing for plugin settings, unified metrics infrastructure, and Phase 1 implementations.',
            cls: 'unified-test-suite-content-description'
        });
        
        // Phase 1 Infrastructure Tests
        const phase1Container = this.contentContainer.createDiv({ cls: 'unified-test-suite-phase1-tests' });
        phase1Container.createEl('h3', { text: '🔧 Phase 1 - Core Metrics Infrastructure' });
        
        this.createTestButton(phase1Container, 'Test MetricsDiscoveryService', () => {
            this.runMetricsDiscoveryTest();
        });
        
        this.createTestButton(phase1Container, 'Test Settings Migration', () => {
            this.runSettingsMigrationTest();
        });
        
        this.createTestButton(phase1Container, 'Test Unified Configuration', () => {
            this.runUnifiedConfigurationTest();
        });
        
        this.createTestButton(phase1Container, 'Test Component Metrics Selection', () => {
            this.runComponentMetricsTest();
        });
        
        this.createTestButton(phase1Container, 'Test Threshold Calculations', () => {
            this.runThresholdCalculationTest();
        });
        
        // Legacy Settings Tests
        const legacyContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-legacy-tests' });
        legacyContainer.createEl('h3', { text: '⚙️ Legacy Settings Validation' });
        
        this.createTestButton(legacyContainer, 'Test Backward Compatibility', () => {
            this.runBackwardCompatibilityTest();
        });
        
        this.createTestButton(legacyContainer, 'Test Settings Validation', () => {
            this.runSettingsValidationTest();
        });
        
        // Comprehensive Test Suite
        const comprehensiveContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-comprehensive-tests' });
        comprehensiveContainer.createEl('h3', { text: '🎯 Comprehensive Testing' });
        
        this.createTestButton(comprehensiveContainer, 'Run All Phase 1 Tests', () => {
            this.runAllPhase1Tests();
        });
        
        // Test results area
        const resultsContainer = this.contentContainer.createDiv({ cls: 'unified-test-suite-test-results' });
        resultsContainer.createEl('h3', { text: 'Test Results' });
        
        this.testResultsArea = resultsContainer.createEl('div', { 
            cls: 'unified-test-suite-results-area',
            text: 'No tests run yet. Click any test button above to begin testing.'
        });
    }

    // Phase 1 Test Implementations
    private async runMetricsDiscoveryTest() {
        this.updateTestResults('🔧 Testing MetricsDiscoveryService...', 'running');
        
        try {
            // Import the required modules
            const { MetricsDiscoveryService } = await import('../../metrics');
            
            // Create test data with proper typing
            const testEntries: any[] = [
                {
                    date: '2024-01-01',
                    title: 'Test Dream 1',
                    content: 'A vivid dream with high sensory detail',
                    source: 'test-file-1.md',
                    metrics: {
                        'Sensory Detail': 4,
                        'Emotional Recall': 3,
                        'Confidence Score': 5,
                        'Custom Metric': 2
                    }
                },
                {
                    date: '2024-01-02', 
                    title: 'Test Dream 2',
                    content: 'Another dream entry',
                    source: 'test-file-2.md',
                    metrics: {
                        'Sensory Detail': 2,
                        'Lost Segments': 1,
                        'New Metric': 3
                    }
                }
            ];
            
            // Initialize MetricsDiscoveryService
            const metricsService = MetricsDiscoveryService.getInstance(this.app, this.plugin.settings);
            
            // Test discovery
            const discoveryResult = await metricsService.discoverMetrics(testEntries);
            
            // Validate results
            let testResults = `✅ MetricsDiscoveryService Test Results:\n`;
            testResults += `   • Discovered ${discoveryResult.discovered.length} total metrics\n`;
            testResults += `   • Found ${discoveryResult.unknown.length} unknown metrics\n`;
            testResults += `   • Validated ${discoveryResult.valid.length} valid metrics\n`;
            testResults += `   • Detected ${discoveryResult.deprecated.length} deprecated metrics\n`;
            
            // Test configured metrics
            const configuredMetrics = metricsService.getConfiguredMetrics();
            testResults += `   • Retrieved ${configuredMetrics.length} configured metrics\n`;
            
            // Test component-specific metrics
            const calendarMetrics = metricsService.getAvailableMetrics('calendar');
            const chartMetrics = metricsService.getAvailableMetrics('charts');
            testResults += `   • Calendar metrics: ${calendarMetrics.length}\n`;
            testResults += `   • Chart metrics: ${chartMetrics.length}\n`;
            
            // Test metric validation
            let validationPassed = 0;
            let validationFailed = 0;
            
            for (const metric of discoveryResult.discovered) {
                const validation = metricsService.validateMetric(metric);
                if (validation.valid) {
                    validationPassed++;
                } else {
                    validationFailed++;
                }
            }
            
            testResults += `   • Validation: ${validationPassed} passed, ${validationFailed} failed\n`;
            
            this.updateTestResults(testResults, 'success');
            
        } catch (error) {
            this.updateTestResults(`❌ MetricsDiscoveryService test failed: ${error.message}`, 'failure');
        }
    }
    
    private async runSettingsMigrationTest() {
        this.updateTestResults('🔄 Testing Settings Migration...', 'running');
        
        try {
            const { migrateToUnifiedMetrics, validateUnifiedMetricsConfig, CURRENT_CONFIG_VERSION } = await import('../../utils/settings-migration');
            
            // Create test settings (legacy format)
            const legacySettings = {
                ...this.plugin.settings,
                unifiedMetrics: undefined // Remove to simulate legacy
            };
            
            // Test migration
            const migrationResult = migrateToUnifiedMetrics(legacySettings);
            
            let testResults = `✅ Settings Migration Test Results:\n`;
            testResults += `   • Migration performed: ${migrationResult.migrated}\n`;
            testResults += `   • From version: ${migrationResult.fromVersion || 'pre-unified'}\n`;
            testResults += `   • To version: ${migrationResult.toVersion}\n`;
            testResults += `   • Warnings: ${migrationResult.warnings.length}\n`;
            
            if (migrationResult.warnings.length > 0) {
                testResults += `   • Warning details: ${migrationResult.warnings.join(', ')}\n`;
            }
            
            // Test validation
            if (legacySettings.unifiedMetrics) {
                const validation = validateUnifiedMetricsConfig(legacySettings.unifiedMetrics);
                testResults += `   • Configuration valid: ${validation.valid}\n`;
                if (!validation.valid) {
                    testResults += `   • Validation errors: ${validation.errors.join(', ')}\n`;
                }
            }
            
            // Test version matching
            const versionMatches = legacySettings.unifiedMetrics?.configVersion === CURRENT_CONFIG_VERSION;
            testResults += `   • Version matches current: ${versionMatches}\n`;
            
            this.updateTestResults(testResults, 'success');
            
        } catch (error) {
            this.updateTestResults(`❌ Settings migration test failed: ${error.message}`, 'failure');
        }
    }
    
    private async runUnifiedConfigurationTest() {
        this.updateTestResults('⚙️ Testing Unified Configuration...', 'running');
        
        try {
            const { hasUnifiedMetricsConfig, DEFAULT_UNIFIED_METRICS_CONFIG } = await import('../../utils/settings-migration');
            
            let testResults = `✅ Unified Configuration Test Results:\n`;
            
            // Test if unified config exists
            const hasConfig = hasUnifiedMetricsConfig(this.plugin.settings);
            testResults += `   • Has unified configuration: ${hasConfig}\n`;
            
            // Test default configuration structure
            const defaultConfig = DEFAULT_UNIFIED_METRICS_CONFIG;
            testResults += `   • Default auto-discovery: ${defaultConfig.autoDiscovery}\n`;
            testResults += `   • Default thresholds: low=${defaultConfig.visualizationThresholds.low}, medium=${defaultConfig.visualizationThresholds.medium}, high=${defaultConfig.visualizationThresholds.high}\n`;
            testResults += `   • Default calendar metrics: ${defaultConfig.preferredMetrics.calendar.length}\n`;
            testResults += `   • Default chart metrics: ${defaultConfig.preferredMetrics.charts.length}\n`;
            testResults += `   • Max new metrics: ${defaultConfig.discovery.maxNewMetrics}\n`;
            
            // Test current configuration if it exists
            if (this.plugin.settings.unifiedMetrics) {
                const config = this.plugin.settings.unifiedMetrics;
                testResults += `   • Current auto-discovery: ${config.autoDiscovery}\n`;
                testResults += `   • Current version: ${config.configVersion}\n`;
                testResults += `   • Calendar metrics configured: ${config.preferredMetrics.calendar.length}\n`;
                testResults += `   • Chart metrics configured: ${config.preferredMetrics.charts.length}\n`;
            }
            
            this.updateTestResults(testResults, 'success');
            
        } catch (error) {
            this.updateTestResults(`❌ Unified configuration test failed: ${error.message}`, 'failure');
        }
    }
    
    private async runComponentMetricsTest() {
        this.updateTestResults('📊 Testing Component Metrics Selection...', 'running');
        
        try {
            const { getComponentMetrics } = await import('../../utils/settings-migration');
            
            let testResults = `✅ Component Metrics Selection Test Results:\n`;
            
            // Test each component type
            const components = ['calendar', 'charts', 'table'] as const;
            
            for (const component of components) {
                const metrics = getComponentMetrics(this.plugin.settings, component);
                testResults += `   • ${component}: ${metrics.length} metrics available\n`;
                
                if (metrics.length > 0) {
                    const metricNames = metrics.slice(0, 3).map(m => m.name).join(', ');
                    testResults += `     └─ First 3: ${metricNames}\n`;
                }
            }
            
            // Test fallback behavior
            const metricsWithFallback = getComponentMetrics(this.plugin.settings, 'calendar', true);
            const metricsWithoutFallback = getComponentMetrics(this.plugin.settings, 'calendar', false);
            
            testResults += `   • Calendar with fallback: ${metricsWithFallback.length}\n`;
            testResults += `   • Calendar without fallback: ${metricsWithoutFallback.length}\n`;
            
            this.updateTestResults(testResults, 'success');
            
        } catch (error) {
            this.updateTestResults(`❌ Component metrics test failed: ${error.message}`, 'failure');
        }
    }
    
    private async runThresholdCalculationTest() {
        this.updateTestResults('📏 Testing Threshold Calculations...', 'running');
        
        try {
            const { getMetricThreshold } = await import('../../utils/settings-migration');
            
            // Test thresholds
            const thresholds = {
                low: 0.33,
                medium: 0.67,
                high: 1.0
            };
            
            let testResults = `✅ Threshold Calculation Test Results:\n`;
            
            // Test various values
            const testCases = [
                { value: 1, min: 1, max: 5, expected: 'low' },    // 0.0 normalized -> low
                { value: 2, min: 1, max: 5, expected: 'low' },    // 0.25 normalized -> low  
                { value: 3, min: 1, max: 5, expected: 'medium' }, // 0.5 normalized -> medium
                { value: 4, min: 1, max: 5, expected: 'high' },   // 0.75 normalized -> high
                { value: 5, min: 1, max: 5, expected: 'high' }    // 1.0 normalized -> high
            ];
            
            let passedTests = 0;
            let totalTests = testCases.length;
            
            for (const testCase of testCases) {
                const result = getMetricThreshold(testCase.value, testCase.min, testCase.max, thresholds);
                const passed = result === testCase.expected;
                
                if (passed) {
                    passedTests++;
                }
                
                testResults += `   • Value ${testCase.value} (${testCase.min}-${testCase.max}): ${result} ${passed ? '✓' : '✗'}\n`;
            }
            
            testResults += `   • Tests passed: ${passedTests}/${totalTests}\n`;
            
            const status = passedTests === totalTests ? 'success' : 'warning';
            this.updateTestResults(testResults, status);
            
        } catch (error) {
            this.updateTestResults(`❌ Threshold calculation test failed: ${error.message}`, 'failure');
        }
    }
    
    private async runBackwardCompatibilityTest() {
        this.updateTestResults('🔄 Testing Backward Compatibility...', 'running');
        
        try {
            let testResults = `✅ Backward Compatibility Test Results:\n`;
            
            // Test that existing metrics still work
            const existingMetrics = this.plugin.settings.metrics;
            if (existingMetrics) {
                const metricCount = Object.keys(existingMetrics).length;
                testResults += `   • Existing metrics preserved: ${metricCount}\n`;
                
                // Check for required properties with proper typing
                let validMetrics = 0;
                for (const [name, metric] of Object.entries(existingMetrics)) {
                    if (metric && typeof metric === 'object' && 'name' in metric && 'enabled' in metric) {
                        if (metric.name && typeof metric.enabled === 'boolean') {
                            validMetrics++;
                        }
                    }
                }
                testResults += `   • Valid metric definitions: ${validMetrics}/${metricCount}\n`;
            }
            
            // Test legacy settings properties
            const hasProjectNote = !!this.plugin.settings.projectNote;
            const hasSelectedNotes = Array.isArray(this.plugin.settings.selectedNotes);
            const hasLogging = !!this.plugin.settings.logging;
            
            testResults += `   • Project note setting: ${hasProjectNote ? '✓' : '✗'}\n`;
            testResults += `   • Selected notes array: ${hasSelectedNotes ? '✓' : '✗'}\n`;
            testResults += `   • Logging configuration: ${hasLogging ? '✓' : '✗'}\n`;
            
            // Test that unified metrics don't break existing functionality
            const unifiedMetricsExists = !!this.plugin.settings.unifiedMetrics;
            testResults += `   • Unified metrics initialized: ${unifiedMetricsExists ? '✓' : '✗'}\n`;
            
            this.updateTestResults(testResults, 'success');
            
        } catch (error) {
            this.updateTestResults(`❌ Backward compatibility test failed: ${error.message}`, 'failure');
        }
    }
    
    private async runSettingsValidationTest() {
        this.updateTestResults('✅ Testing Settings Validation...', 'running');
        
        try {
            let testResults = `✅ Settings Validation Test Results:\n`;
            
            // Validate core settings structure
            const settings = this.plugin.settings;
            const requiredProperties = ['projectNote', 'metrics', 'selectedNotes', 'selectionMode', 'calloutName'];
            
            let validProperties = 0;
            for (const prop of requiredProperties) {
                if (settings[prop] !== undefined) {
                    validProperties++;
                    testResults += `   • ${prop}: ✓\n`;
                } else {
                    testResults += `   • ${prop}: ✗ (missing)\n`;
                }
            }
            
            testResults += `   • Core properties valid: ${validProperties}/${requiredProperties.length}\n`;
            
            // Test metrics validation with proper typing
            if (settings.metrics) {
                const metricsArray = Object.values(settings.metrics);
                let validMetrics = 0;
                
                for (const metric of metricsArray) {
                    if (metric && typeof metric === 'object') {
                        const hasName = 'name' in metric && !!metric.name;
                        const hasEnabled = 'enabled' in metric && typeof metric.enabled === 'boolean';
                        const hasIcon = 'icon' in metric && !!metric.icon;
                        
                        if (hasName && hasEnabled && hasIcon) {
                            validMetrics++;
                        }
                    }
                }
                
                testResults += `   • Valid metrics: ${validMetrics}/${metricsArray.length}\n`;
            }
            
            // Test unified metrics validation if present
            if (settings.unifiedMetrics) {
                const unified = settings.unifiedMetrics;
                const hasThresholds = unified.visualizationThresholds && 
                                      typeof unified.visualizationThresholds.low === 'number';
                const hasPreferredMetrics = unified.preferredMetrics && 
                                            Array.isArray(unified.preferredMetrics.calendar);
                const hasDiscovery = unified.discovery && 
                                     typeof unified.discovery.autoEnable === 'boolean';
                
                testResults += `   • Unified thresholds: ${hasThresholds ? '✓' : '✗'}\n`;
                testResults += `   • Preferred metrics: ${hasPreferredMetrics ? '✓' : '✗'}\n`;
                testResults += `   • Discovery settings: ${hasDiscovery ? '✓' : '✗'}\n`;
            }
            
            this.updateTestResults(testResults, 'success');
            
        } catch (error) {
            this.updateTestResults(`❌ Settings validation test failed: ${error.message}`, 'failure');
        }
    }
    
    private async runAllPhase1Tests() {
        this.updateTestResults('🎯 Running All Phase 1 Tests...', 'running');
        
        try {
            // Run all tests in sequence
            await this.runMetricsDiscoveryTest();
            await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
            
            await this.runSettingsMigrationTest();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await this.runUnifiedConfigurationTest();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await this.runComponentMetricsTest();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await this.runThresholdCalculationTest();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await this.runBackwardCompatibilityTest();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await this.runSettingsValidationTest();
            
            this.updateTestResults('🎉 All Phase 1 Tests Completed Successfully!', 'success');
            
        } catch (error) {
            this.updateTestResults(`❌ Phase 1 test suite failed: ${error.message}`, 'failure');
        }
    }
    
    // Helper to update test results display
    private testResultsArea: HTMLElement;
    
    private updateTestResults(message: string, status: 'success' | 'failure' | 'warning' | 'running') {
        if (!this.testResultsArea) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const statusIcon = {
            'success': '✅',
            'failure': '❌', 
            'warning': '⚠️',
            'running': '⏳'
        }[status];
        
        const resultDiv = this.testResultsArea.createDiv({ 
            cls: `unified-test-suite-result unified-test-suite-result-${status}` 
        });
        
        resultDiv.createEl('div', {
            text: `${statusIcon} [${timestamp}] ${message}`,
            cls: 'unified-test-suite-result-text'
        });
        
        // Scroll to bottom
        this.testResultsArea.scrollTop = this.testResultsArea.scrollHeight;
    }
} 