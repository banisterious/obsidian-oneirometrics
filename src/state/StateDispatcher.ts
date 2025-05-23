import { IStateDispatcher } from './StateInterfaces';
import { MutableState } from './MutableState';

/**
 * Type for a reducer function that updates state.
 */
type Reducer<T, A extends string, P> = (state: T, payload?: P) => Partial<T>;

/**
 * A class that manages state changes through actions and reducers.
 * This implements a unidirectional data flow pattern.
 */
export class StateDispatcher<T extends Record<string, any>> implements IStateDispatcher<T> {
  private state: MutableState<T>;
  private reducers: Map<string, Reducer<T, any, any>> = new Map();
  private middleware: Array<(action: string, payload: any) => void> = [];
  
  /**
   * Create a new state dispatcher for a mutable state.
   * @param state The mutable state to manage
   */
  constructor(state: MutableState<T>) {
    this.state = state;
  }
  
  /**
   * Register a reducer function to handle a specific action.
   * @param action The action name
   * @param reducer The reducer function
   */
  registerReducer<A extends string, P>(
    action: A,
    reducer: Reducer<T, A, P>
  ): void {
    this.reducers.set(action, reducer);
  }
  
  /**
   * Register multiple reducers at once.
   * @param reducers Object mapping action names to reducer functions
   */
  registerReducers(reducers: Record<string, Reducer<T, string, any>>): void {
    Object.entries(reducers).forEach(([action, reducer]) => {
      this.registerReducer(action, reducer as Reducer<T, string, any>);
    });
  }
  
  /**
   * Dispatch an action to update the state.
   * @param action The action name
   * @param payload Optional data for the action
   */
  dispatch<A extends string, P>(action: A, payload?: P): void {
    // Apply middleware first
    this.middleware.forEach(fn => {
      try {
        fn(action, payload);
      } catch (error) {
        console.error(`Error in middleware for action ${action}:`, error);
      }
    });
    
    // Look up the reducer for this action
    const reducer = this.reducers.get(action);
    if (!reducer) {
      console.warn(`No reducer registered for action: ${action}`);
      return;
    }
    
    try {
      // Apply the reducer to get state changes
      const currentState = this.state.getState();
      const changes = reducer(currentState, payload);
      
      // Update the state
      this.state.setState(changes);
    } catch (error) {
      console.error(`Error in reducer for action ${action}:`, error);
    }
  }
  
  /**
   * Add middleware to intercept actions before they reach reducers.
   * @param fn Middleware function
   * @returns Function to remove the middleware
   */
  addMiddleware(fn: (action: string, payload: any) => void): () => void {
    this.middleware.push(fn);
    return () => {
      const index = this.middleware.indexOf(fn);
      if (index !== -1) {
        this.middleware.splice(index, 1);
      }
    };
  }
  
  /**
   * Remove all reducers and middleware.
   */
  clear(): void {
    this.reducers.clear();
    this.middleware = [];
  }
} 