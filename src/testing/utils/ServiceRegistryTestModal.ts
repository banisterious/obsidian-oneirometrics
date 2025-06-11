/**
 * Test modal for the Service Registry
 * 
 * This modal allows testing the Service Registry within Obsidian.
 */

import { App, Modal, Setting, ButtonComponent, TextAreaComponent, Notice } from 'obsidian';
import { 
  getServiceRegistry, 
  registerService, 
  getService, 
  SERVICE_NAMES, 
  registerFallback,
  getServiceSafe,
  safeCall
} from '../../state/ServiceRegistry';
import type DreamMetricsPlugin from '../../../main';
import safeLogger from '../../logging/safe-logger';

export class ServiceRegistryTestModal extends Modal {
  private plugin: DreamMetricsPlugin;
  private resultEl: HTMLElement;
  private servicesTextArea: TextAreaComponent;
  
  constructor(app: App, plugin: DreamMetricsPlugin) {
    super(app);
    this.plugin = plugin;
  }
  
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Service Registry Test' });
    
    // Create result container
    const resultContainer = contentEl.createDiv();
    resultContainer.addClass('service-registry-test-results');
    resultContainer.addClass('oom-service-registry-results');
    this.resultEl = resultContainer;
    
    // Create services text area
    new Setting(contentEl)
      .setName('Custom Service')
      .setDesc('Enter a JSON object to register as a custom service')
      .addTextArea(text => {
        this.servicesTextArea = text;
        text.setValue('{\n  "name": "testService",\n  "value": "Hello from test service"\n}');
        text.inputEl.classList.add('oom-service-registry-textarea');
      });
    
    // Test buttons
    const buttonContainer = contentEl.createDiv();
    buttonContainer.addClass('service-registry-test-buttons');
    buttonContainer.addClass('oom-service-registry-buttons');
    
    // List services button
    new ButtonComponent(buttonContainer)
      .setButtonText('List Services')
      .onClick(() => {
        this.testListServices();
      });
    
    // Register service button
    new ButtonComponent(buttonContainer)
      .setButtonText('Register Custom Service')
      .onClick(() => {
        this.testRegisterService();
      });
    
    // Get service button
    new ButtonComponent(buttonContainer)
      .setButtonText('Get Service')
      .onClick(() => {
        this.testGetService();
      });
    
    // Clear registry button
    new ButtonComponent(buttonContainer)
      .setButtonText('Clear Registry')
      .onClick(() => {
        this.testClearRegistry();
      });
    
    // Test full cycle button
    new ButtonComponent(buttonContainer)
      .setButtonText('Test Full Cycle')
      .onClick(() => {
        this.testFullCycle();
      });
    
    // Test defensive features button
    new ButtonComponent(buttonContainer)
      .setButtonText('Test Defensive Features')
      .onClick(() => {
        this.testDefensiveFeatures();
      });
    
    // Run the list services test on open
    setTimeout(() => {
      this.testListServices();
    }, 100);
  }
  
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
  
  private log(message: string) {
    const line = this.resultEl.createDiv();
    line.textContent = message;
    this.resultEl.scrollTop = this.resultEl.scrollHeight;
  }
  
  private testListServices() {
    this.resultEl.empty();
    this.log('Testing List Services:');
    
    try {
      const registry = getServiceRegistry();
      const services = registry.listServices();
      
      if (services.length === 0) {
        this.log('No services registered.');
      } else {
        this.log(`Found ${services.length} registered services:`);
        services.forEach(service => {
          this.log(` - ${service}`);
        });
      }
    } catch (error) {
      this.log(`Error listing services: ${error.message}`);
      safeLogger.error('ServiceRegistryTest', 'Error listing services', error);
    }
  }
  
  private testRegisterService() {
    this.resultEl.empty();
    this.log('Testing Register Service:');
    
    try {
      // Get service data from text area
      const serviceData = JSON.parse(this.servicesTextArea.getValue());
      
      if (!serviceData.name) {
        this.log('Error: Service must have a name property');
        return;
      }
      
      // Register the service
      registerService(serviceData.name, serviceData);
      this.log(`Registered service: ${serviceData.name}`);
      
      // List all services to confirm registration
      const registry = getServiceRegistry();
      const services = registry.listServices();
      this.log(`\nCurrent services (${services.length}):`);
      services.forEach(service => {
        this.log(` - ${service}`);
      });
      
      new Notice(`Service ${serviceData.name} registered successfully`);
    } catch (error) {
      this.log(`Error registering service: ${error.message}`);
      safeLogger.error('ServiceRegistryTest', 'Error registering service', error);
    }
  }
  
  private testGetService() {
    this.resultEl.empty();
    this.log('Testing Get Service:');
    
    try {
      // Get service data from text area to determine which service to get
      const serviceData = JSON.parse(this.servicesTextArea.getValue());
      
      if (!serviceData.name) {
        this.log('Error: Service must have a name property');
        return;
      }
      
      // Get the service
      const service = getService(serviceData.name);
      
      if (service) {
        this.log(`Found service: ${serviceData.name}`);
        this.log('Service data:');
        this.log(JSON.stringify(service, null, 2));
      } else {
        this.log(`Service not found: ${serviceData.name}`);
      }
    } catch (error) {
      this.log(`Error getting service: ${error.message}`);
      safeLogger.error('ServiceRegistryTest', 'Error getting service', error);
    }
  }
  
  private testClearRegistry() {
    this.resultEl.empty();
    this.log('Testing Clear Registry:');
    
    try {
      const registry = getServiceRegistry();
      
      // First list current services
      const beforeServices = registry.listServices();
      this.log(`Before clearing: ${beforeServices.length} services`);
      
      // Clear the registry
      registry.clear();
      this.log('Registry cleared');
      
      // List services after clearing
      const afterServices = registry.listServices();
      this.log(`After clearing: ${afterServices.length} services`);
      
      new Notice('Registry cleared successfully');
    } catch (error) {
      this.log(`Error clearing registry: ${error.message}`);
      safeLogger.error('ServiceRegistryTest', 'Error clearing registry', error);
    }
  }
  
  private testFullCycle() {
    this.resultEl.empty();
    this.log('Testing Full Cycle:');
    
    try {
      // 1. Clear the registry
      this.log('1. Clearing registry...');
      const registry = getServiceRegistry();
      registry.clear();
      
      // 2. Register a service
      this.log('\n2. Registering test service...');
      registerService('testFullCycleService', {
        name: 'testFullCycleService',
        value: 'This is a test service',
        timestamp: new Date().toISOString()
      });
      
      // 3. List services
      this.log('\n3. Listing services...');
      const services = registry.listServices();
      this.log(`Found ${services.length} services:`);
      services.forEach(service => {
        this.log(` - ${service}`);
      });
      
      // 4. Get the service
      this.log('\n4. Getting test service...');
      const service = getService('testFullCycleService');
      if (service) {
        this.log('Found test service:');
        this.log(JSON.stringify(service, null, 2));
      } else {
        this.log('Test service not found!');
      }
      
      // 5. Clear again
      this.log('\n5. Clearing registry again...');
      registry.clear();
      const finalServices = registry.listServices();
      this.log(`Final services count: ${finalServices.length}`);
      
      new Notice('Full cycle test completed successfully');
    } catch (error) {
      this.log(`Error in full cycle test: ${error.message}`);
      safeLogger.error('ServiceRegistryTest', 'Error in full cycle test', error);
    }
  }
  
  private testDefensiveFeatures() {
    this.resultEl.empty();
    this.log('Testing Defensive Features:');
    
    try {
      const registry = getServiceRegistry();
      
      // Clear any existing services
      registry.clear();
      this.log('Registry cleared for testing');
      
      // Test registerFallback and getSafe
      const testService = { name: 'TestService', getValue: () => 42 };
      const fallbackService = { name: 'FallbackService', getValue: () => 0 };
      
      // Register a fallback service
      registry.registerFallback('test', fallbackService);
      this.log('Registered fallback service');
      
      // Test getSafe with a missing service (should return fallback)
      const result1 = registry.getSafe('test', { name: 'ProvidedFallback', getValue: () => -1 });
      
      // The result should be the registered fallback, not the provided one
      if (result1.name === 'FallbackService') {
        this.log('PASS: getSafe returns registered fallback when service is missing');
      } else {
        this.log('FAIL: getSafe did not return registered fallback');
      }
      
      // Now register the actual service
      registry.register('test', testService);
      this.log('Registered actual service');
      
      // Test getSafe with a registered service (should return the service)
      const result2 = registry.getSafe('test', fallbackService);
      
      // The result should be the actual service, not the fallback
      if (result2.name === 'TestService') {
        this.log('PASS: getSafe returns service when available');
      } else {
        this.log('FAIL: getSafe did not return service');
      }
      
      // Test safeCall with a registered service
      const callResult1 = registry.safeCall<any, number>('test', 'getValue', [], -1);
      
      if (callResult1 === 42) {
        this.log('PASS: safeCall returns method result');
      } else {
        this.log('FAIL: safeCall did not return method result');
      }
      
      // Test safeCall with a missing method
      const callResult2 = registry.safeCall<any, string>('test', 'nonExistentMethod', [], 'fallback');
      
      if (callResult2 === 'fallback') {
        this.log('PASS: safeCall returns fallback when method is missing');
      } else {
        this.log('FAIL: safeCall did not return fallback for missing method');
      }
      
      // Test safeCall with a missing service
      registry.clear();
      this.log('Registry cleared again');
      const callResult3 = registry.safeCall<any, string>('test', 'getValue', [], 'fallback');
      
      if (callResult3 === 'fallback') {
        this.log('PASS: safeCall returns fallback when service is missing');
      } else {
        this.log('FAIL: safeCall did not return fallback for missing service');
      }
      
      // Test helper functions
      registry.clear();
      this.log('Testing helper functions...');
      
      // Register a service and fallback
      registerService('helper-test', testService);
      registerFallback('helper-test', fallbackService);
      
      // Test getServiceSafe with a registered service
      const helperResult1 = getServiceSafe('helper-test', { name: 'ProvidedFallback', getValue: () => -1 });
      
      if (helperResult1.name === 'TestService') {
        this.log('PASS: getServiceSafe returns service when available');
      } else {
        this.log('FAIL: getServiceSafe did not return service');
      }
      
      // Remove the service
      registry.clear();
      registerFallback('helper-test', fallbackService);
      
      // Test getServiceSafe with a missing service but registered fallback
      const helperResult2 = getServiceSafe('helper-test', { name: 'ProvidedFallback', getValue: () => -1 });
      
      if (helperResult2.name === 'FallbackService') {
        this.log('PASS: getServiceSafe returns registered fallback when service is missing');
      } else {
        this.log('FAIL: getServiceSafe did not return registered fallback');
      }
      
      // Test safeCall helper function
      registry.clear();
      registerService('helper-test', testService);
      
      const helperCallResult = safeCall<any, number>('helper-test', 'getValue', [], -1);
      
      if (helperCallResult === 42) {
        this.log('PASS: safeCall helper returns method result');
      } else {
        this.log('FAIL: safeCall helper did not return method result');
      }
      
      this.log('\nAll defensive feature tests completed.');
      new Notice('Defensive feature tests completed');
    } catch (error) {
      this.log(`Error testing defensive features: ${error.message}`);
      safeLogger.error('ServiceRegistryTest', 'Error testing defensive features', error);
    }
  }
}

// Function to open the test modal
export function openServiceRegistryTestModal(app: App, plugin: DreamMetricsPlugin): void {
  new ServiceRegistryTestModal(app, plugin).open();
} 