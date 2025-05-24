/**
 * Improved TestRunner implementation
 * 
 * This implementation supports both synchronous and asynchronous test functions
 * and provides better error handling and reporting.
 */

/**
 * Test result interface
 */
export interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
}

/**
 * Types of test callback functions supported
 */
type TestCallback = (() => boolean | Promise<boolean>) | (() => void | Promise<void>);

export class TestRunner {
  private tests: Array<{name: string, callback: TestCallback}> = [];

  /**
   * Registers a test with the test runner
   * @param name The name of the test
   * @param callback The test callback function (can be sync or async)
   */
  registerTest(name: string, callback: TestCallback): void {
    this.tests.push({name, callback});
    console.log(`Test registered: ${name}`);
  }

  /**
   * Alternative name for registerTest, used by existing tests
   * @param name The name of the test
   * @param callback The test callback function (can be sync or async)
   */
  addTest(name: string, callback: TestCallback): void {
    this.registerTest(name, callback);
  }

  /**
   * Executes all registered tests
   * @returns A promise that resolves to an array of test results
   */
  async runTests(): Promise<TestResult[]> {
    console.log(`Running ${this.tests.length} tests...`);
    
    const results: TestResult[] = [];
    
    for (const test of this.tests) {
      console.log(`Running test: ${test.name}`);
      
      const startTime = performance.now();
      let passed = false;
      let error: Error | undefined = undefined;
      
      try {
        // Handle both sync and async functions
        const result = test.callback();
        
        if (result instanceof Promise) {
          // If it's a promise, await it
          try {
            const promiseResult = await result;
            // If the function returns void/undefined, consider it passed
            // If it returns a boolean, use that value
            passed = promiseResult === undefined ? true : !!promiseResult;
          } catch (e) {
            passed = false;
            error = e instanceof Error ? e : new Error(String(e));
          }
        } else {
          // If it's synchronous, check the return value
          // If it returns void/undefined, consider it passed
          // If it returns a boolean, use that value
          passed = result === undefined ? true : !!result;
        }
      } catch (e) {
        passed = false;
        error = e instanceof Error ? e : new Error(String(e));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      results.push({
        name: test.name,
        passed,
        error,
        duration
      });
      
      console.log(`Test '${test.name}' ${passed ? 'PASSED' : 'FAILED'} in ${duration.toFixed(2)}ms`);
      if (error) {
        console.error(`Error in test '${test.name}':`, error);
      }
    }
    
    // Log summary
    const passedCount = results.filter(r => r.passed).length;
    console.log(`Test run complete: ${passedCount}/${results.length} tests passed`);
    
    return results;
  }

  /**
   * Creates a test runner instance
   */
  static create(): TestRunner {
    return new TestRunner();
  }
} 