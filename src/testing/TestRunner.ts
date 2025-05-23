import { App, Modal } from 'obsidian';

export class TestRunner {
  private tests: Array<{name: string, fn: () => Promise<boolean> | boolean}> = [];
  private results: Array<{name: string, passed: boolean, error?: any}> = [];
  
  /**
   * Add a new test to the test runner
   * @param name Name of the test
   * @param fn Test function that returns a boolean or Promise<boolean> (true if test passes)
   */
  addTest(name: string, fn: () => Promise<boolean> | boolean) {
    this.tests.push({name, fn});
  }
  
  /**
   * Run all registered tests
   * @returns Test results
   */
  async runTests() {
    this.results = [];
    console.log(`[OneiroMetrics Tests] Running ${this.tests.length} tests...`);
    
    for (const test of this.tests) {
      try {
        const result = await Promise.resolve(test.fn());
        this.results.push({name: test.name, passed: result});
        console.log(`[OneiroMetrics Tests] ${result ? '✅' : '❌'} ${test.name}`);
      } catch (error) {
        this.results.push({name: test.name, passed: false, error});
        console.error(`[OneiroMetrics Tests] ❌ ${test.name} - Error:`, error);
      }
    }
    
    const passed = this.results.filter(r => r.passed).length;
    console.log(`[OneiroMetrics Tests] Results: ${passed}/${this.tests.length} tests passed`);
    
    return this.results;
  }
  
  /**
   * Display test results in a container element
   * @param container HTML element to display results in
   */
  displayResults(container: HTMLElement) {
    container.empty();
    container.createEl('h3', {text: 'Test Results'});
    
    const resultList = container.createEl('ul');
    for (const result of this.results) {
      const item = resultList.createEl('li');
      const icon = result.passed ? '✅' : '❌';
      item.setText(`${icon} ${result.name}`);
      
      if (result.error) {
        const errorDetails = item.createEl('pre', {cls: 'oom-test-error'});
        errorDetails.setText(result.error.toString());
      }
    }
    
    const summary = container.createEl('p', {cls: 'oom-test-summary'});
    const passed = this.results.filter(r => r.passed).length;
    summary.setText(`${passed}/${this.tests.length} tests passed`);
  }
  
  /**
   * Show test results in a modal
   * @param app Obsidian App instance
   */
  showResultsModal(app: App) {
    const modal = new Modal(app);
    modal.titleEl.setText('OneiroMetrics Tests');
    this.displayResults(modal.contentEl);
    modal.open();
  }
} 