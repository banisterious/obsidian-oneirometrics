/**
 * Test modal for the Service Registry
 * 
 * This modal allows testing the Service Registry within Obsidian.
 */

import { App, Modal, Setting, ButtonComponent, TextAreaComponent, Notice } from 'obsidian';
import { getServiceRegistry, registerService, getService, SERVICE_NAMES } from '../../state/ServiceRegistry';
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
    resultContainer.style.height = '200px';
    resultContainer.style.overflow = 'auto';
    resultContainer.style.border = '1px solid var(--background-modifier-border)';
    resultContainer.style.padding = '10px';
    resultContainer.style.marginBottom = '10px';
    resultContainer.style.fontFamily = 'monospace';
    this.resultEl = resultContainer;
    
    // Create services text area
    new Setting(contentEl)
      .setName('Custom Service')
      .setDesc('Enter a JSON object to register as a custom service')
      .addTextArea(text => {
        this.servicesTextArea = text;
        text.setValue('{\n  "name": "testService",\n  "value": "Hello from test service"\n}');
        text.inputEl.style.height = '100px';
        text.inputEl.style.width = '100%';
      });
    
    // Test buttons
    const buttonContainer = contentEl.createDiv();
    buttonContainer.addClass('service-registry-test-buttons');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.marginTop = '20px';
    
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
} 