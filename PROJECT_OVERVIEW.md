## Recent Improvements

- All inline styles for UI elements (autocomplete dropdowns, suggestion lists, expand/collapse dream content, etc.) have been moved to the main stylesheet (`styles.css`).
- Dynamic positioning and sizing for dropdowns now use CSS variables, improving maintainability and theme compatibility.
- The expand/collapse UI for dream content is now fully accessible, keyboard-friendly, and visually polished.
- Metrics now support custom icons via a user-friendly icon picker in the Metric Editor Modal.
- Dream content extraction now strips `[!dream-metrics]` callouts and their content, preserves paragraph breaks for clean, readable previews and exports, and correctly handles blockquote markers with spaces (e.g., '>> >'), and fully supports HTML rendering (e.g., <br>), ampersands, and all tested edge cases.

## Planned Improvements

- Add search/filter functionality to the metric icon picker.
- Add more icons to the icon picker for greater variety.
- Add a Test Modal where users can paste Markdown and see how the plugin processes and renders it.

## Release Status

A new release (`0.2.0`) will be created to capture all recent improvements:
- Major UI/UX and accessibility enhancements
- Custom metric icon picker
- Dream content extraction now strips `[!dream-metrics]` callouts
- Improved settings management, live previews, and more

Please refer to the CHANGELOG.md for a detailed summary of changes in this release. 