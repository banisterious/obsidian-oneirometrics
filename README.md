# OneiroMetrics

OneiroMetrics (Turning dreams into data). A plugin for Obsidian to track and analyze dream journal metrics.

## Features

- Track various metrics about your dreams using a simple callout format
- Customize which metrics to track
- Aggregate metrics across multiple dream journal entries
- Generate beautiful tables of your dream data
- Easy-to-use interface with both settings page and quick-access modal

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Click "Browse" and search for "OneiroMetrics"
4. Click Install
5. Enable the plugin

## Usage

### Setting Up Your Dream Notes

Add a callout block to your dream journal entries using the following format:

```markdown
> [!oneirometrics]
> Words: 343, Sensory Detail: 3, Emotional Recall: 3, Lost Segments: 3, Descriptiveness: 4, Confidence Score: 4
```

### Configuring the Plugin

1. Open the plugin settings (Settings > OneiroMetrics)
2. Set the path for your project note (where metrics will be aggregated)
3. Add the paths to your dream journal notes
4. Customize the metrics you want to track
5. Optionally change the callout name

### Using the Plugin

- Click the ribbon icon (dream icon) to open the quick-access modal
- Use the "Open OneiroMetrics" command from the command palette
- Click "Scrape" to collect metrics from your dream notes
- View your aggregated metrics in the project note

## Default Metrics

The plugin comes with five default metrics:

1. **Sensory Detail (1-5)**
   - 1 (Minimal): Very little sensory information
   - 2 (Limited): Basic sights or sounds
   - 3 (Moderate): Noticeable amount of sensory details
   - 4 (Rich): Significant amount across multiple senses
   - 5 (Vivid): Highly detailed across all senses

2. **Emotional Recall (1-5)**
   - 1 (Vague): Faint sense of emotion
   - 2 (General): Primary emotion identified
   - 3 (Identified): Specific emotions with general intensity
   - 4 (Nuanced): Several distinct emotions with nuances
   - 5 (Deep and Complex): Complex emotional landscape

3. **Lost Segments (Number)**
   - Count of distinct instances where parts of the dream are missing

4. **Descriptiveness (1-5)**
   - 1 (Minimal): Very brief capture
   - 2 (Limited): Basic account
   - 3 (Moderate): Reasonably detailed
   - 4 (Detailed): Significant elaboration
   - 5 (Highly Elaborate): Rich in detail

5. **Confidence Score (1-5)**
   - 1 (Very Low): Barely scratched the surface
   - 2 (Low): Fragmented recall
   - 3 (Moderate): Fair amount recalled
   - 4 (High): Majority recalled well
   - 5 (Very High): Complete recall

## Custom Metrics

You can add your own custom metrics in the plugin settings. Each metric requires:
- A name
- A numeric range (minimum and maximum values)
- A description

## Support

If you encounter any issues or have suggestions, please visit the [GitHub repository](https://github.com/banisterious/oneirometrics) to report them.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 