import { TestRunner } from './TestRunner';
import { StateAdapter } from '../state/adapters/StateAdapter';
import { ObservableState } from '../state/core/ObservableState';
import { MutableState } from '../state/core/MutableState';
import { StateSelector } from '../state/core/StateSelector';
import { MetricsState } from '../state/metrics/MetricsState';

// Mock plugin adapter for testing
class MockPluginAdapter {
  private settings: any = { _stateStorage: {} };
  
  getSettings() {
    return this.settings;
  }
  
  async saveSettings() {
    // Mock implementation
    return Promise.resolve();
  }
}

/**
 * Register state management tests to the test runner
 * @param testRunner The test runner instance
 */
export function registerStateManagementTests(
  testRunner: TestRunner
): void {
  // Test: Observable State
  testRunner.addTest(
    'StateManagement - ObservableState should notify subscribers',
    async () => {
      // Create a subclass of ObservableState for testing that exposes a method to update state
      class TestObservableState<T> extends ObservableState<T> {
        updateState(newState: T): void {
          this.state = newState;
          this.notifyListeners();
        }
      }
      
      // Create a simple observable state
      const initialState = { count: 0 };
      const state = new TestObservableState(initialState);
      
      let notified = false;
      let newState: any = null;
      
      // Subscribe to state changes (initial notification happens here)
      const unsubscribe = state.subscribe(s => {
        notified = true;
        newState = s;
      });
      
      // Reset the notification flag as the initial subscribe already called it
      notified = false;
      
      // Update the state to trigger notification
      state.updateState({ count: 1 });
      
      // Clean up
      unsubscribe();
      
      return notified && newState.count === 1;
    }
  );
  
  // Test: Mutable State
  testRunner.addTest(
    'StateManagement - MutableState should update state correctly',
    async () => {
      // Create a mutable state
      const initialState = { count: 0, name: 'test' };
      const state = new MutableState(initialState);
      
      let notified = false;
      let newState: any = null;
      
      // Subscribe to state changes
      const unsubscribe = state.subscribe(s => {
        notified = true;
        newState = s;
      });
      
      // Update state
      state.setState({ count: 1 });
      
      // Verify state was updated and notification was sent
      const result = notified && newState.count === 1 && newState.name === 'test';
      
      // Clean up
      unsubscribe();
      
      return result;
    }
  );
  
  // Test: Selective updates with updateState
  testRunner.addTest(
    'StateManagement - updateState should update based on current state',
    async () => {
      // Create a mutable state
      const initialState = { count: 5, name: 'test' };
      const state = new MutableState(initialState);
      
      let finalState: any = null;
      
      // Subscribe to state changes
      const unsubscribe = state.subscribe(s => {
        finalState = s;
      });
      
      // Update state using updateState (increment count)
      state.updateState(currentState => ({
        ...currentState,
        count: currentState.count + 1
      }));
      
      // Verify state was updated correctly
      const result = finalState.count === 6 && finalState.name === 'test';
      
      // Clean up
      unsubscribe();
      
      return result;
    }
  );
  
  // Test: StateSelector
  testRunner.addTest(
    'StateManagement - StateSelector should select specific parts of state',
    async () => {
      // Create a mutable state
      const initialState = { user: { name: 'John', age: 30 }, settings: { theme: 'dark' } };
      const state = new MutableState(initialState);
      
      // Create a selector for user - add explicit type information
      const userSelector = new StateSelector<typeof initialState, typeof initialState.user>(
        (s: typeof initialState) => s.user
      );
      
      let selectedUser: any = null;
      
      // Observe the selected state
      const observable = userSelector.observe(state);
      const unsubscribe = observable.subscribe(user => {
        selectedUser = user;
      });
      
      // Initial selection should work
      const initialSelectionCorrect = selectedUser.name === 'John' && selectedUser.age === 30;
      
      // Update the state
      state.setState({ user: { name: 'Jane', age: 28 }, settings: { theme: 'dark' } });
      
      // Selection should be updated
      const updatedSelectionCorrect = selectedUser.name === 'Jane' && selectedUser.age === 28;
      
      // Clean up
      unsubscribe();
      
      return initialSelectionCorrect && updatedSelectionCorrect;
    }
  );
  
  // Test: MetricsState
  testRunner.addTest(
    'StateManagement - MetricsState should handle metrics data correctly',
    async () => {
      // Create metrics state with initial data
      const initialState = {
        metricsVersion: '1.0.0',
        metrics: {
          'Sensory Detail': { 
            name: 'Sensory Detail', 
            icon: 'eye', 
            minValue: 1,
            maxValue: 5,
            enabled: true
          }
        },
        entries: []
      };
      
      // Use 'as any' to bypass type checking for testing purposes
      // In a real implementation, we'd use proper types
      const metricsState = new MetricsState(initialState as any);
      
      let currentState: any = null;
      
      // Subscribe to state changes
      const unsubscribe = metricsState.subscribe(state => {
        currentState = state;
      });
      
      // Add a new metric - use a properly typed object
      metricsState.addMetric({
        name: 'Emotional Recall',
        icon: 'heart',
        minValue: 1,
        maxValue: 5,
        enabled: true
      }, { category: 'dream' });
      
      // Clean up
      unsubscribe();
      
      // Verify the new metric was added
      return (
        currentState.metrics['Sensory Detail']?.name === 'Sensory Detail' &&
        currentState.metrics['Emotional Recall']?.name === 'Emotional Recall'
      );
    }
  );
  
  // Test: StateAdapter
  testRunner.addTest(
    'StateManagement - StateAdapter should store and retrieve values',
    async () => {
      // Create mock plugin adapter
      const pluginApi = new MockPluginAdapter() as any;
      
      // Mock DreamMetricsState
      const mockState = new MutableState({});
      
      // Create state adapter
      const stateAdapter = new StateAdapter(mockState, pluginApi);
      
      // Set some values
      stateAdapter.set('testKey', 'testValue');
      stateAdapter.set('numberKey', 42);
      stateAdapter.set('objectKey', { foo: 'bar' });
      
      // Test retrieval
      const stringResult = stateAdapter.get('testKey') === 'testValue';
      const numberResult = stateAdapter.get('numberKey') === 42;
      // Use type assertion to access the property
      const objectResult = (stateAdapter.get('objectKey') as { foo: string }).foo === 'bar';
      
      // Test has, keys, delete
      const hasResult = stateAdapter.has('testKey');
      const keysResult = stateAdapter.keys().length === 3;
      
      stateAdapter.delete('testKey');
      const deleteResult = !stateAdapter.has('testKey');
      
      return stringResult && numberResult && objectResult && hasResult && keysResult && deleteResult;
    }
  );
  
  // Test: State persistence
  testRunner.addTest(
    'StateManagement - State should persist across reloads',
    async () => {
      // This test simulates persistence by:
      // 1. Saving state to the mock adapter
      // 2. Creating a new instance that would normally load from storage
      
      // Create mock plugin adapter
      const pluginApi = new MockPluginAdapter() as any;
      
      // Create a simple state
      const initialState = { test: 'initial' };
      const mockState = new MutableState(initialState);
      
      // Create state adapter and store a value
      const stateAdapter = new StateAdapter(mockState, pluginApi);
      stateAdapter.set('persistTest', 'persisted value');
      
      // Simulate storage by examining the mock plugin settings
      const settingsAfterSet = pluginApi.getSettings();
      
      // Check if the value was stored in the mock
      const storedCorrectly = settingsAfterSet._stateStorage.persistTest === 'persisted value';
      
      // Create a new adapter that would load from the mock storage
      const newStateAdapter = new StateAdapter(mockState, pluginApi);
      
      // Check if the value is available in the new adapter
      const loadedCorrectly = newStateAdapter.get('persistTest') === 'persisted value';
      
      return storedCorrectly && loadedCorrectly;
    }
  );
} 