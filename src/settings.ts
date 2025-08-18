// Modify the part where metrics are displayed in settings to maintain a specific order

// Define the correct order for recommended metrics
const RECOMMENDED_METRICS_ORDER = [
  'Sensory Detail',
  'Emotional Recall',
  'Lost Segments',
  'Descriptiveness',
  'Confidence Score',
  'Character Roles'
];

// Define the correct order for disabled metrics
const DISABLED_METRICS_ORDER = [
  'Characters Count',
  'Familiar Count',
  'Unfamiliar Count',
  'Characters List',
  'Dream Themes',
  'Character Clarity/Familiarity',
  'Lucidity Level',
  'Dream Coherence',
  'Environmental Familiarity',
  'Ease of Recall',
  'Recall Stability'
];

// Add a helper function to sort metrics by a predefined order
function sortMetricsByOrder(metrics: string[], orderArray: string[]): string[] {
  // Create a copy to avoid modifying the original array
  const sortedMetrics = [...metrics];
  
  // Sort by the predefined order
  sortedMetrics.sort((a, b) => {
    const indexA = orderArray.indexOf(a);
    const indexB = orderArray.indexOf(b);
    
    // If both are in the order array, sort by their position
    if (indexA >= 0 && indexB >= 0) {
      return indexA - indexB;
    }
    
    // If only one is in the order array, prioritize it
    if (indexA >= 0) return -1;
    if (indexB >= 0) return 1;
    
    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });
  
  return sortedMetrics;
} 