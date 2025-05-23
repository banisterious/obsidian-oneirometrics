# Dream Journal Analysis Module

This module contains components for analyzing dream journal content, extracting metrics, and identifying patterns in dream data.

## Key Components

### Interfaces

- **IDreamAnalyzer**: Interface for dream content analysis and metrics processing
- **IContentExtractor**: Interface for extracting dream content from journal entries

### Implementations

- **DreamAnalyzer**: Analyzes dream content, extracts metrics, and identifies patterns
- **ContentExtractor**: Extracts dream content, metrics text, and dates from journal entries

## Usage Examples

### Extracting and Processing Dream Content

```typescript
import { DreamAnalyzer, ContentExtractor } from 'src/analysis';

// Create instances
const contentExtractor = new ContentExtractor();
const dreamAnalyzer = new DreamAnalyzer();

// Example: Process a journal entry
function processDreamJournal(journalText: string, filePath: string, metrics: Record<string, DreamMetric>) {
  // Extract dream content from the journal
  const dreamContent = contentExtractor.extractDreamContent(journalText, 'dream');
  if (!dreamContent) {
    console.log('No dream content found in journal');
    return null;
  }
  
  // Process dream content (clean up markdown artifacts)
  const processedContent = dreamAnalyzer.processDreamContent(dreamContent);
  
  // Extract metrics text
  const metricsText = contentExtractor.extractMetricsText(journalText);
  if (!metricsText) {
    console.log('No metrics found in journal');
    return { content: processedContent, metrics: {} };
  }
  
  // Process metrics
  const dreamMetrics = dreamAnalyzer.extractMetrics(metricsText, metrics);
  
  // Extract date
  const date = contentExtractor.extractDreamDate(journalText, filePath);
  
  return {
    date,
    content: processedContent,
    metrics: dreamMetrics,
    wordCount: contentExtractor.calculateWordCount(processedContent)
  };
}
```

### Finding Patterns in Dream Metrics

```typescript
import { DreamAnalyzer } from 'src/analysis';

// Create instance
const dreamAnalyzer = new DreamAnalyzer();

// Example: Find patterns in metrics
function analyzeDreamMetricsPatterns(metrics: Record<string, number[]>) {
  // Calculate summary statistics
  const summary = dreamAnalyzer.calculateMetricsSummary(metrics);
  
  // Find patterns
  const patterns = dreamAnalyzer.findMetricsPatterns(metrics);
  
  // Display results
  for (const [metricName, pattern] of Object.entries(patterns)) {
    console.log(`Metric: ${metricName}`);
    console.log(`Trend: ${pattern.trends}`);
    console.log('Correlations:');
    
    pattern.correlations.forEach(correlation => {
      const direction = correlation.strength > 0 ? 'positive' : 'negative';
      console.log(`- ${correlation.metric}: ${direction} (${correlation.strength.toFixed(2)})`);
    });
    
    console.log('---');
  }
} 