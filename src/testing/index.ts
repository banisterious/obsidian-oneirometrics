/**
 * Testing infrastructure for the OOMP plugin
 * 
 * This module provides access to testing utilities that can be used
 * for interactive debugging and testing within Obsidian.
 */

import { App } from 'obsidian';
import { TestRunner } from './TestRunner';
import { DateUtilsTestModal } from './utils/DateUtilsTestModal';
import { ContentParserTestModal } from './utils/ContentParserTestModal';

// Import all test module registration functions
import { registerContentParsingTests } from './ContentParsingTests';
import { registerContentParserParameterTests } from './ContentParserParameterTests';
import { registerErrorHandlingContentParserTests } from './ErrorHandlingContentParserTests';
import { registerTemplateSystemTests } from './TemplateSystemTests';
import { registerUIComponentTests } from './UIComponentTests';
import { registerDreamMetricsStateTests } from './DreamMetricsStateTests';
import { registerStateManagementTests } from './StateManagementTests';
import { registerEdgeCaseTests } from './EdgeCaseTests';
import { registerConfigurationTests } from './ConfigurationTests';

// Define plugin type without direct import to avoid circular dependency
type DreamMetricsPlugin = any;

/**
 * Register all tests with the test runner
 * @param testRunner The test runner instance
 */
function registerAllTests(testRunner: TestRunner): void {
  // Register different test categories
  registerContentParsingTests(testRunner);
  registerContentParserParameterTests(testRunner);
  registerErrorHandlingContentParserTests(testRunner);
  registerTemplateSystemTests(testRunner);
  registerUIComponentTests(testRunner);
  registerDreamMetricsStateTests(testRunner);
  registerStateManagementTests(testRunner);
  registerEdgeCaseTests(testRunner);
  registerConfigurationTests(testRunner);
}

/**
 * Opens the DateUtils test modal
 * @param app The Obsidian app instance
 * @param plugin The plugin instance
 */
export function openDateUtilsTestModal(app: App, plugin: DreamMetricsPlugin): void {
  new DateUtilsTestModal(app, plugin).open();
}

/**
 * Opens the ContentParser test modal
 * @param app The Obsidian app instance
 * @param plugin The plugin instance
 */
export function openContentParserTestModal(app: App, plugin: DreamMetricsPlugin): void {
  new ContentParserTestModal(app, plugin).open();
}

/**
 * Creates a test runner with all tests registered
 * @returns A test runner with all tests registered
 */
export function createTestRunner(): TestRunner {
  const testRunner = TestRunner.create();
  registerAllTests(testRunner);
  return testRunner;
}

/**
 * Runs all tests and returns the results
 * @returns A promise that resolves to an array of test results
 */
export async function runAllTests(): Promise<TestRunner['runTests'] extends (...args: any[]) => Promise<infer R> ? R : never> {
  const testRunner = createTestRunner();
  return await testRunner.runTests();
}

/**
 * Exports all test-related functionality
 */
export {
  TestRunner,
  DateUtilsTestModal,
  ContentParserTestModal
}; 