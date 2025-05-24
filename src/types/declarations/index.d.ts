/**
 * Global type declarations for OneiroMetrics plugin
 * 
 * This file provides type declarations for modules that may not be properly
 * recognized by TypeScript during the migration process.
 */

// Define core types for use in declarations
interface DreamMetric {
  name: string;
  icon: string;
  minValue: number;
  maxValue: number;
  description?: string;
  enabled: boolean;
  category?: string;
}

interface DreamMetricData {
  date: string;
  title: string;
  content: string;
  source: string | { file: string; id?: string };
  wordCount?: number;
  metrics: Record<string, number | string>;
  calloutMetadata?: any;
}

// Declare TestRunner module
declare module '*/TestRunner' {
  export class TestRunner {
    registerTest(name: string, callback: () => Promise<boolean>): void;
    addTest(name: string, callback: () => Promise<boolean>): void;
    runTests(): Promise<boolean>;
    static create(): TestRunner;
  }
}

// Declare state modules
declare module '*/state/core/ObservableState' {
  export class ObservableState<T> {
    protected state: T;
    constructor(initialState: T);
    getState(): T;
    subscribe(listener: (state: T) => void): () => void;
    protected notifyListeners(): void;
  }
}

declare module '*/state/core/MutableState' {
  import { ObservableState } from '*/state/core/ObservableState';
  
  export class MutableState<T extends object> extends ObservableState<T> {
    setState(newState: T): void;
    updateState(updateFn: (currentState: T) => T): void;
  }
}

declare module '*/state/core/StateSelector' {
  import { ObservableState } from '*/state/core/ObservableState';
  
  export class StateSelector<TState, TSelected> {
    constructor(selector: (state: TState) => TSelected);
    observe(observable: ObservableState<TState>): ObservableState<TSelected>;
  }
}

declare module '*/state/adapters/StateAdapter' {
  export class StateAdapter {
    constructor(stateManager: any, pluginApi: any);
    get(key: string): any;
    set(key: string, value: any): void;
    has(key: string): boolean;
    keys(): string[];
    delete(key: string): void;
    clear(): void;
  }
}

declare module '*/state/metrics/MetricsState' {
  import { MutableState } from '*/state/core/MutableState';
  
  export class MetricsState extends MutableState<any> {
    constructor(initialState?: any);
    addMetric(metric: DreamMetric, options?: { category?: string }): void;
    removeMetric(metricName: string): void;
    addEntry(entry: DreamMetricData): void;
    getMetrics(): Record<string, DreamMetric>;
    getEntries(): DreamMetricData[];
  }
} 