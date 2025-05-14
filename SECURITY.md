# Security Policy for OneiroMetrics

## Data Storage
- All user data, including journal entries, dream content, metrics, and backups, is stored locally within the user's Obsidian vault.
- No data is transmitted to external servers, cloud services, or third parties by the plugin.
- Backups are created locally in a user-specified or default folder, using the `.bak` extension for easy identification.

## Data Access
- The plugin only accesses files and folders explicitly selected by the user in the plugin settings.
- No files outside the user's chosen scope are read, modified, or backed up.
- The plugin does not collect or transmit telemetry, analytics, or usage data.

## Privacy
- No journal entries, dream content, metrics, or user data is ever sent outside the local device.
- The plugin does not use any external APIs or cloud services.
- All processing and analysis are performed locally within Obsidian.

## User Controls
- Users can delete backups, logs, and any plugin-generated files at any time.
- All plugin settings are local and user-controlled.
- No hidden files or background processes are created by the plugin.

## Vulnerability Reporting
- If you discover a security vulnerability or privacy concern, please report it via the GitHub Issues page for this repository.
- Clearly describe the issue, steps to reproduce, and any potential impact.
- The maintainer will prioritize and address security issues promptly.

## Best Practices
- Regularly update the plugin to receive the latest security and privacy improvements.
- Store your Obsidian vault in a secure location and use device-level encryption if available.
- Review and manage your backups and logs periodically to ensure your data remains private.

---

*OneiroMetrics is designed with privacy and user control as top priorities. If you have questions or suggestions regarding security, please open an issue or contact the maintainer.* 