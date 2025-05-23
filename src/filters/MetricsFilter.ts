/**
 * Represents a filter configuration for metrics data.
 */
export interface FilterConfig {
  startDate?: Date;
  endDate?: Date;
  metricNames?: string[];
  minValue?: number;
  maxValue?: number;
  sourceFiles?: string[];
  tags?: string[];
  keywords?: string[];
  filterType?: 'all' | 'any'; // 'all' means all conditions must be met, 'any' means any condition can be met
}

/**
 * Class for filtering metrics data based on various criteria.
 */
export class MetricsFilter {
  private config: FilterConfig;
  
  /**
   * Creates a new metrics filter with the given configuration.
   * @param config The filter configuration
   */
  constructor(config: FilterConfig = {}) {
    this.config = { ...config };
  }
  
  /**
   * Get the current filter configuration.
   */
  getConfig(): FilterConfig {
    return { ...this.config };
  }
  
  /**
   * Updates the filter configuration.
   * @param config The new filter configuration to merge with the existing one
   */
  updateConfig(config: Partial<FilterConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Sets the date range for filtering.
   * @param startDate The start date
   * @param endDate The end date
   */
  setDateRange(startDate: Date, endDate: Date): void {
    this.config.startDate = startDate;
    this.config.endDate = endDate;
  }
  
  /**
   * Gets the current date range.
   * @returns An object containing the start and end dates
   */
  getDateRange(): { start: Date, end: Date } {
    const now = new Date();
    return {
      start: this.config.startDate || new Date(1900, 0, 1),
      end: this.config.endDate || now
    };
  }
  
  /**
   * Checks if a date is within the filter's date range.
   * @param date The date to check
   * @returns True if the date is within range, false otherwise
   */
  isDateInRange(date: Date): boolean {
    const { start, end } = this.getDateRange();
    return date >= start && date <= end;
  }
  
  /**
   * Sets the metric value range.
   * @param min The minimum value
   * @param max The maximum value
   */
  setValueRange(min: number, max: number): void {
    this.config.minValue = min;
    this.config.maxValue = max;
  }
  
  /**
   * Checks if a value is within the filter's range.
   * @param value The value to check
   * @returns True if the value is within range, false otherwise
   */
  isValueInRange(value: number): boolean {
    const min = this.config.minValue !== undefined ? this.config.minValue : Number.MIN_SAFE_INTEGER;
    const max = this.config.maxValue !== undefined ? this.config.maxValue : Number.MAX_SAFE_INTEGER;
    return value >= min && value <= max;
  }
  
  /**
   * Sets the metric names to include in the filter.
   * @param metricNames The names of metrics to include
   */
  setMetricNames(metricNames: string[]): void {
    this.config.metricNames = [...metricNames];
  }
  
  /**
   * Checks if a metric name is included in the filter.
   * @param metricName The name to check
   * @returns True if the name is included, false otherwise
   */
  includesMetricName(metricName: string): boolean {
    if (!this.config.metricNames || this.config.metricNames.length === 0) {
      return true; // No filter means include all
    }
    return this.config.metricNames.includes(metricName);
  }
  
  /**
   * Sets the source files to include in the filter.
   * @param sourceFiles The file paths to include
   */
  setSourceFiles(sourceFiles: string[]): void {
    this.config.sourceFiles = [...sourceFiles];
  }
  
  /**
   * Checks if a source file is included in the filter.
   * @param filePath The file path to check
   * @returns True if the file is included, false otherwise
   */
  includesSourceFile(filePath: string): boolean {
    if (!this.config.sourceFiles || this.config.sourceFiles.length === 0) {
      return true; // No filter means include all
    }
    return this.config.sourceFiles.includes(filePath);
  }
  
  /**
   * Resets the filter to its default state.
   */
  reset(): void {
    this.config = {};
  }
  
  /**
   * Creates a JSON representation of the filter.
   * @returns A JSON string of the filter configuration
   */
  toJSON(): string {
    return JSON.stringify(this.config);
  }
  
  /**
   * Creates a filter from a JSON string.
   * @param json The JSON representation of a filter
   * @returns A new MetricsFilter instance
   */
  static fromJSON(json: string): MetricsFilter {
    try {
      const config = JSON.parse(json) as FilterConfig;
      
      // Convert date strings back to Date objects
      if (config.startDate) config.startDate = new Date(config.startDate);
      if (config.endDate) config.endDate = new Date(config.endDate);
      
      return new MetricsFilter(config);
    } catch (e) {
      console.error('Error parsing MetricsFilter JSON:', e);
      return new MetricsFilter();
    }
  }
} 