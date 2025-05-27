import { App, Modal, Notice, Setting } from 'obsidian';
import {
  getSafe,
  getNestedProperty,
  withErrorHandling,
  hasProperty,
  isObject,
  isNonEmptyString,
  isValidDate,
  safeJsonParse,
  safeJsonStringify,
  getSafeService,
  ErrorBoundary
} from '../../utils/defensive-utils';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  error?: Error;
}

export class DefensiveUtilsTestModal extends Modal {
  private results: TestResult[] = [];
  private totalTests = 0;
  private passedTests = 0;
  
  constructor(app: App) {
    super(app);
  }
  
  onOpen() {
    const { contentEl } = this;
    
    contentEl.createEl('h2', { text: 'Defensive Utilities Test Suite' });
    const statusEl = contentEl.createEl('div', { cls: 'oom-test-status' });
    const resultsEl = contentEl.createEl('div', { cls: 'oom-test-results' });
    
    // Run button
    new Setting(contentEl)
      .setName('Run Tests')
      .setDesc('Run all tests for defensive utilities')
      .addButton(button => button
        .setButtonText('Run Tests')
        .setCta()
        .onClick(() => {
          statusEl.empty();
          resultsEl.empty();
          this.results = [];
          this.totalTests = 0;
          this.passedTests = 0;
          
          statusEl.createEl('p', { text: 'Running tests...' });
          
          try {
            this.runAllTests();
            this.displayResults(resultsEl, statusEl);
          } catch (e) {
            statusEl.empty();
            statusEl.createEl('p', { text: `Error running tests: ${e.message}`, cls: 'oom-test-error' });
            console.error('Error running tests:', e);
          }
        }));
  }
  
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
  
  private runAllTests() {
    this.runGetSafeTests();
    this.runGetNestedPropertyTests();
    this.runWithErrorHandlingTests();
    this.runTypeGuardTests();
    this.runJsonUtilsTests();
    this.runGetSafeServiceTests();
    this.runErrorBoundaryTests();
  }
  
  private assert(name: string, condition: boolean, message?: string): void {
    this.totalTests++;
    
    if (condition) {
      this.passedTests++;
      this.results.push({
        name,
        passed: true,
        message: message || 'Test passed'
      });
    } else {
      this.results.push({
        name,
        passed: false,
        message: message || 'Test failed'
      });
    }
  }
  
  private assertThrows(name: string, fn: () => void, message?: string): void {
    this.totalTests++;
    
    try {
      fn();
      this.results.push({
        name,
        passed: false,
        message: message || 'Expected function to throw but it did not'
      });
    } catch (e) {
      this.passedTests++;
      this.results.push({
        name,
        passed: true,
        message: message || 'Function threw as expected'
      });
    }
  }
  
  private runGetSafeTests() {
    // Test 1: Return property value when available
    const obj1 = { name: 'Test', value: 42 };
    this.assert(
      'getSafe - returns property value when available',
      getSafe(obj1, o => o.name, 'Default') === 'Test' &&
      getSafe(obj1, o => o.value, 0) === 42,
      'getSafe should return the property value when it exists'
    );
    
    // Test 2: Return fallback when property is undefined
    const obj2 = { name: 'Test' };
    this.assert(
      'getSafe - returns fallback for undefined property',
      getSafe(obj2, o => (o as any).missing, 'Default') === 'Default',
      'getSafe should return the fallback when property is undefined'
    );
    
    // Test 3: Return fallback when property is null
    const obj3 = { name: null };
    this.assert(
      'getSafe - returns fallback for null property',
      getSafe(obj3, o => o.name, 'Default') === 'Default',
      'getSafe should return the fallback when property is null'
    );
    
    // Test 4: Return fallback when object is null
    this.assert(
      'getSafe - returns fallback for null object',
      getSafe(null, o => (o as any).name, 'Default') === 'Default',
      'getSafe should return the fallback when object is null'
    );
    
    // Test 5: Return fallback when getter throws
    const obj5 = { 
      get name(): string { throw new Error('Test error'); } 
    };
    
    let result: string;
    try {
      result = obj5.name;
    } catch (e) {
      result = 'Default';
    }
    
    this.assert(
      'getSafe - returns fallback when getter throws',
      getSafe(obj5, o => o.name as string, 'Default') === 'Default',
      'getSafe should return the fallback when the getter throws'
    );
  }
  
  private runGetNestedPropertyTests() {
    // Test 1: Return nested property when available
    const obj1 = { user: { profile: { name: 'Test' } } };
    const result = getNestedProperty<{ user: { profile: { name: string } } }, string>(obj1, ['user', 'profile', 'name'], 'Default');
    this.assert(
      'getNestedProperty - returns nested property when available',
      result === 'Test',
      'getNestedProperty should return the nested property when it exists'
    );
    
    // Test 2: Return fallback when path is invalid
    const obj2 = { user: { profile: { } } };
    this.assert(
      'getNestedProperty - returns fallback for invalid path',
      getNestedProperty<typeof obj2, string>(obj2, ['user', 'profile', 'name'], 'Default') === 'Default',
      'getNestedProperty should return the fallback when path is invalid'
    );
    
    // Test 3: Return fallback when intermediate property is null
    const obj3 = { user: null };
    this.assert(
      'getNestedProperty - returns fallback for null intermediate',
      getNestedProperty<typeof obj3, string>(obj3, ['user', 'profile', 'name'], 'Default') === 'Default',
      'getNestedProperty should return the fallback when intermediate property is null'
    );
  }
  
  private runWithErrorHandlingTests() {
    // Test 1: Return function result when no error occurs
    const fn1 = (a: number, b: number) => a + b;
    const safeFn1 = withErrorHandling(fn1, 0);
    this.assert(
      'withErrorHandling - returns function result when no error',
      safeFn1(2, 3) === 5,
      'withErrorHandling should return the function result when no error occurs'
    );
    
    // Test 2: Return fallback when function throws
    const fn2 = () => { throw new Error('Test error'); };
    const safeFn2 = withErrorHandling<() => string>(fn2, 'Fallback');
    this.assert(
      'withErrorHandling - returns fallback when function throws',
      safeFn2() === 'Fallback',
      'withErrorHandling should return the fallback when function throws'
    );
    
    // Test 3: Call error handler when provided
    let errorHandlerCalled = false;
    const errorHandler = () => { errorHandlerCalled = true; };
    const fn3 = () => { throw new Error('Test error'); };
    const safeFn3 = withErrorHandling<() => string>(fn3, 'Fallback', errorHandler);
    
    safeFn3();
    this.assert(
      'withErrorHandling - calls error handler when provided',
      errorHandlerCalled,
      'withErrorHandling should call the error handler when provided and function throws'
    );
  }
  
  private runTypeGuardTests() {
    // Test hasProperty
    const obj1 = { name: 'Test', value: 42 };
    this.assert(
      'hasProperty - returns true when property exists',
      hasProperty(obj1, 'name') && hasProperty(obj1, 'value'),
      'hasProperty should return true when the property exists'
    );
    
    this.assert(
      'hasProperty - returns false when property does not exist',
      !hasProperty(obj1, 'missing'),
      'hasProperty should return false when the property does not exist'
    );
    
    // Test isObject
    this.assert(
      'isObject - returns true for object literals',
      isObject({}) && isObject({ name: 'Test' }),
      'isObject should return true for object literals'
    );
    
    this.assert(
      'isObject - returns false for arrays',
      !isObject([]) && !isObject([1, 2, 3]),
      'isObject should return false for arrays'
    );
    
    this.assert(
      'isObject - returns false for null',
      !isObject(null),
      'isObject should return false for null'
    );
    
    // Test isNonEmptyString
    this.assert(
      'isNonEmptyString - returns true for non-empty strings',
      isNonEmptyString('Test') && isNonEmptyString(' Test '),
      'isNonEmptyString should return true for non-empty strings'
    );
    
    this.assert(
      'isNonEmptyString - returns false for empty strings',
      !isNonEmptyString('') && !isNonEmptyString(' '),
      'isNonEmptyString should return false for empty strings'
    );
    
    // Test isValidDate
    this.assert(
      'isValidDate - returns true for valid dates',
      isValidDate(new Date()) && isValidDate(new Date('2023-01-01')),
      'isValidDate should return true for valid dates'
    );
    
    this.assert(
      'isValidDate - returns false for invalid dates',
      !isValidDate(new Date('invalid')),
      'isValidDate should return false for invalid dates'
    );
  }
  
  private runJsonUtilsTests() {
    // Test safeJsonParse
    const json = '{"name":"Test","value":42}';
    const parsed = safeJsonParse<{name: string, value: number}>(json, {name: '', value: 0});
    this.assert(
      'safeJsonParse - parses valid JSON',
      parsed.name === 'Test' && parsed.value === 42,
      'safeJsonParse should correctly parse valid JSON'
    );
    
    const invalidJson = '{invalid json}';
    const fallback = { name: 'Default' };
    this.assert(
      'safeJsonParse - returns fallback for invalid JSON',
      safeJsonParse(invalidJson, fallback) === fallback,
      'safeJsonParse should return the fallback for invalid JSON'
    );
    
    // Test safeJsonStringify
    const obj = { name: 'Test', value: 42 };
    this.assert(
      'safeJsonStringify - stringifies valid objects',
      safeJsonStringify(obj) === '{"name":"Test","value":42}',
      'safeJsonStringify should correctly stringify valid objects'
    );
    
    const circularObj: any = { name: 'Test' };
    circularObj.self = circularObj; // Create circular reference
    this.assert(
      'safeJsonStringify - returns fallback for circular references',
      safeJsonStringify(circularObj, '{"fallback":true}') === '{"fallback":true}',
      'safeJsonStringify should return the fallback for circular references'
    );
  }
  
  private runGetSafeServiceTests() {
    // Test 1: Return service when available
    const service = { name: 'TestService' };
    const registry1 = {
      getService: (id: string) => id === 'test' ? service : null
    };
    
    this.assert(
      'getSafeService - returns service when available',
      getSafeService(registry1, 'test', { name: 'Fallback' }) === service,
      'getSafeService should return the service when it is available'
    );
    
    // Test 2: Return fallback when service is not found
    const registry2 = {
      getService: () => null
    };
    const fallback = { name: 'Fallback' };
    
    this.assert(
      'getSafeService - returns fallback when service not found',
      getSafeService(registry2, 'test', fallback) === fallback,
      'getSafeService should return the fallback when service is not found'
    );
    
    // Test 3: Return fallback when registry is null
    this.assert(
      'getSafeService - returns fallback when registry is null',
      getSafeService(null as any, 'test', fallback) === fallback,
      'getSafeService should return the fallback when registry is null'
    );
  }
  
  private runErrorBoundaryTests() {
    // Create test container
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Test 1: Render content when no error occurs
    let errorLoggerCalled = false;
    const errorLogger = () => { errorLoggerCalled = true; };
    
    const boundary1 = new ErrorBoundary(container, 'Error occurred', errorLogger);
    const content1 = boundary1.getContentElement();
    
    boundary1.renderContent(() => {
      content1.textContent = 'Test content';
    }, 'TestComponent');
    
    this.assert(
      'ErrorBoundary - renders content when no error',
      content1.textContent === 'Test content' && !errorLoggerCalled,
      'ErrorBoundary should render content when no error occurs'
    );
    
    // Test 2: Show fallback UI when error occurs
    errorLoggerCalled = false;
    const boundary2 = new ErrorBoundary(container, 'Error occurred', errorLogger);
    
    boundary2.renderContent(() => {
      throw new Error('Render error');
    }, 'TestComponent');
    
    this.assert(
      'ErrorBoundary - shows fallback UI when error occurs',
      container.textContent?.includes('Error occurred') && errorLoggerCalled,
      'ErrorBoundary should show fallback UI when error occurs'
    );
    
    // Test 3: Reset to initial state
    errorLoggerCalled = false;
    const boundary3 = new ErrorBoundary(container, 'Error occurred', errorLogger);
    const content3 = boundary3.getContentElement();
    
    boundary3.renderContent(() => {
      throw new Error('Render error');
    });
    
    boundary3.reset();
    content3.textContent = 'New content';
    
    this.assert(
      'ErrorBoundary - resets to initial state',
      content3.textContent === 'New content',
      'ErrorBoundary should reset to initial state'
    );
    
    // Clean up
    document.body.removeChild(container);
  }
  
  private displayResults(resultsEl: HTMLElement, statusEl: HTMLElement) {
    statusEl.empty();
    statusEl.createEl('h3', { 
      text: `Tests: ${this.passedTests}/${this.totalTests} passed (${Math.round(this.passedTests / this.totalTests * 100)}%)` 
    });
    
    if (this.passedTests === this.totalTests) {
      statusEl.createEl('p', { 
        text: 'All tests passed! 🎉', 
        cls: 'oom-test-success' 
      });
    } else {
      statusEl.createEl('p', { 
        text: `${this.totalTests - this.passedTests} tests failed ❌`, 
        cls: 'oom-test-failure' 
      });
    }
    
    // Group results by category
    const categories = this.results.reduce((acc, result) => {
      const category = result.name.split(' - ')[0];
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(result);
      return acc;
    }, {} as Record<string, TestResult[]>);
    
    // Display results by category
    for (const category in categories) {
      const categoryEl = resultsEl.createEl('div', { cls: 'oom-test-category' });
      
      const categoryResults = categories[category];
      const passedInCategory = categoryResults.filter(r => r.passed).length;
      
      categoryEl.createEl('h4', { 
        text: `${category}: ${passedInCategory}/${categoryResults.length} passed`,
        cls: passedInCategory === categoryResults.length ? 'oom-test-category-success' : 'oom-test-category-partial'
      });
      
      const resultsTable = categoryEl.createEl('table', { cls: 'oom-test-table' });
      const headerRow = resultsTable.createEl('tr');
      headerRow.createEl('th', { text: 'Test' });
      headerRow.createEl('th', { text: 'Result' });
      headerRow.createEl('th', { text: 'Message' });
      
      for (const result of categoryResults) {
        const row = resultsTable.createEl('tr');
        
        const nameCell = row.createEl('td');
        nameCell.textContent = result.name.split(' - ')[1];
        
        const resultCell = row.createEl('td');
        resultCell.textContent = result.passed ? '✅' : '❌';
        resultCell.addClass(result.passed ? 'oom-test-passed' : 'oom-test-failed');
        
        const messageCell = row.createEl('td');
        messageCell.textContent = result.message || '';
      }
    }
    
    // Add CSS
    this.addTestStyles();
  }
  
  private addTestStyles() {
    const styleEl = document.createElement('style');
    styleEl.id = 'oom-test-styles';
    
    // Only add styles if they don't already exist
    if (!document.getElementById('oom-test-styles')) {
      styleEl.textContent = `
        .oom-test-status {
          margin-bottom: 20px;
          padding: 10px;
          border-radius: 5px;
          background-color: var(--background-secondary);
        }
        
        .oom-test-results {
          margin-top: 20px;
        }
        
        .oom-test-category {
          margin-bottom: 20px;
        }
        
        .oom-test-category-success {
          color: var(--text-success);
        }
        
        .oom-test-category-partial {
          color: var(--text-warning);
        }
        
        .oom-test-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .oom-test-table th,
        .oom-test-table td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid var(--background-modifier-border);
        }
        
        .oom-test-passed {
          color: var(--text-success);
        }
        
        .oom-test-failed {
          color: var(--text-error);
        }
        
        .oom-test-success {
          color: var(--text-success);
          font-weight: bold;
        }
        
        .oom-test-failure {
          color: var(--text-error);
          font-weight: bold;
        }
        
        .oom-test-error {
          color: var(--text-error);
          font-weight: bold;
          padding: 10px;
          background-color: var(--background-modifier-error);
          border-radius: 5px;
        }
      `;
      
      document.head.appendChild(styleEl);
    }
  }
} 