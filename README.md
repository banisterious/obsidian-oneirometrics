## OneiroMetrics

> **Track, analyze, and visualize your dream journal metrics in Obsidian.**

<p align="center">
  <img src="docs/images/gsa-barn.jpg" alt="A country barn painting, representing the foundation of dream journaling." width="600"/>
</p>
<p align="center"><em>"Barn at Sunrise" by Gary Armstrong, inspiration for OneiroMetrics</em></p>

---

### Table of Contents

- [OneiroMetrics Hub](#oneirometrics-hub)
- [OneiroMetrics Dashboard](#oneirometrics-dashboard)
- [Dream Taxonomy & Oneirograph](#dream-taxonomy--oneirograph)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Settings](#settings)
- [Documentation](#documentation)
- [Support](#support)
- [License](#license)

---

## OneiroMetrics Hub

Access all plugin features through the main hub interface:

- **Dream Scrape:** Extract and analyze metrics from your dream journal entries
- **Metrics Settings:** Configure custom metrics, scoring systems, and display preferences
- **Journal Structure:** Validate and maintain consistent dream journal entry formats
- **Templates:** Create and manage dream journal templates with dynamic placeholders
- **OneiroGraph:** Access the interactive dream taxonomy visualization system

## OneiroMetrics Dashboard

Your real-time dashboard for dream analysis and insights:

- **Live Updates:** Dynamic view that updates in real-time as you add entries
- **Interactive Charts:** Multiple visualization tabs (Statistics, Trends, Compare, Correlations, Heatmap, Insights)
- **Advanced Analytics:** Trend analysis, outlier detection, correlation analysis, and pattern recognition
- **Data Export:** Export charts and data in multiple formats with complete statistical metadata
- **Dream Entries Table:** Sortable, filterable table with virtual scrolling for performance
- **Date Navigator:** Advanced filtering with month, dual-month, and quarter views
- **Enhanced Performance:** Optimized for large datasets with incremental updates

<p align="center">
  <img src="docs/images/OneiroMetrics-Note.gif" alt="Animated demonstration of the OneiroMetrics metrics view" width="600"/>
</p>
<p align="center"><em>OneiroMetrics metrics view showing dream journal analysis</em></p>

## Dream Taxonomy & Oneirograph

Visualize your dream data through an interactive hierarchical graph system:

- **Hierarchical Visualization:** Explore your dreams through a structured taxonomy of Clusters → Vectors → Themes → Dreams
- **Interactive Force-Directed Graph:** Powered by D3.js physics simulation with intelligent node positioning and relationship mapping
- **Advanced Filtering:** Real-time search and filter by themes, clusters, dates, or free text with collapsible control panel
- **Vector Sub-Clustering:** Automatic grouping of related vectors within clusters using theme similarity algorithms
- **Visual Boundaries:** Convex hull rendering shows vector groupings with clear visual boundaries
- **Directional Connections:** Color-coded arrows indicate relationship types and hierarchy levels
- **Accessibility First:** Full keyboard navigation and screen reader support following Obsidian conventions
- **Performance Optimized:** Canvas-based rendering handles large datasets efficiently with smart filtering

<p align="center">
  <img src="docs/images/oneirometrics-dream-taxonomy-table.png" alt="Dream Taxonomy hierarchical visualization showing clusters, vectors, themes, and dreams" width="600"/>
</p>
<p align="center"><em>OneiroGraph visualization displaying hierarchical dream taxonomy relationships</em></p>

---

## Quick Start

1. **Install:** In Obsidian, go to Settings → Community Plugins → Browse, search for "OneiroMetrics", and install.
2. **Enable:** Turn on the plugin in Community Plugins.
3. **Set Up:** Create a note for your dream journal. Add entries using the callout format:
   ```markdown
   > [!dream-metrics]
   > Words: 343, Sensory Detail: 3, Emotional Recall: 3
   ```
4. **Configure:** Open OneiroMetrics settings to select your metrics note, choose notes/folders to analyze, and adjust preferences.

---

## Support My Work

If you find this plugin useful, please consider supporting its development!

<a href="https://www.buymeacoffee.com/banisterious" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## Usage

**OneiroMetrics Hub Access:**
- Use the ribbon button or command palette to open the OneiroMetrics Hub
- Access all plugin features from the centralized hub interface

**Metrics Analysis:**
- Access the OneiroMetrics Dashboard through the Hub or command palette
- Use advanced date filtering to analyze specific time periods
- Sort and filter dream entries in the high-performance table
- Explore different chart visualizations with real-time updates

**Dream Taxonomy Visualization:**
- Launch the OneiroGraph from the Control Center or command palette
- Explore hierarchical relationships through interactive force-directed graphs
- Use the search panel to filter by themes, clusters, dates, or content
- Navigate using keyboard shortcuts for full accessibility

**Data Management:**
- Configure which notes and folders to analyze
- Set up custom metrics with personalized scoring systems
- Export data and visualizations for external analysis
- Enable automatic backups to protect your data

---

## Settings

**Core Configuration:**
- **OneiroMetrics Note:** Configure the data source for analysis (legacy feature)
- **Selected Notes/Folders:** Choose which notes to include in analysis
- **Metrics:** Customize tracked metrics with names, icons, ranges, and descriptions

**Display Options:**
- **Interface:** Toggle readable line length and configure display preferences
- **Calendar:** Set week start day for date navigation
- **Visualization:** Configure chart colors and display options

**Data Management:**
- **Backups:** Enable automatic backups with configurable retention
- **Export:** Configure default export formats and options
- **Logging:** Adjust log levels for troubleshooting (Off by default)

---

## Documentation

- [Usage Guide](docs/user/guides/usage.md)
- [Dashboard Migration Guide](docs/user/guides/dashboard-migration.md)
- [Project Overview](docs/developer/architecture/overview.md)
- [Known Issues](ISSUES.md)

---

## Support

- Check [GitHub Issues](https://github.com/your-repo/issues)
- Open a new issue with details and steps to reproduce

---

## License

MIT License – see [LICENSE.md](LICENSE.md)

---

**For advanced details, see the [docs/](docs/) folder.** 
