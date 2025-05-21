# Release Process

This document outlines the process for releasing new versions of the Dream Metrics plugin.

## Versioning

We follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (MAJOR.MINOR.PATCH):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

## Release Checklist

### Pre-Release

1. **Update Documentation**
   - Update CHANGELOG.md with new changes
   - Update README.md if needed
   - Update docs/developer/architecture/specification.md if needed
   - Update docs/user/guides/usage.md if needed

2. **Code Review**
   - Ensure all tests pass
   - Check for any linting errors
   - Verify all features are working as expected
   - Test on different Obsidian versions

3. **Version Update**
   ```bash
   npm run version <new-version>
   ```
   This will automatically update:
   - manifest.json
   - versions.json

### Release Process

1. **Build**
   ```bash
   npm run build
   ```

2. **Test Build**
   - Install the built plugin in a test Obsidian vault
   - Verify all functionality works
   - Check for any visual issues
   - Test on different platforms if possible

3. **Create Release**
   - Create a new release on GitHub
   - Tag the release with the version number (e.g., v1.0.0)
   - Include the relevant section from CHANGELOG.md in the release notes
   - Attach the built main.js and styles.css files

4. **Publish**
   - Submit the new version to the Obsidian Community Plugins repository
   - Update the plugin listing with any new features or changes

### Post-Release

1. **Monitor**
   - Watch for any issues reported by users
   - Be ready to release a patch version if critical bugs are found

2. **Documentation**
   - Update any documentation based on user feedback
   - Add any new usage examples if needed

## Release Types

### Major Release (X.0.0)
- Breaking changes
- Major feature additions
- Complete redesigns
- Requires thorough testing and documentation updates

### Minor Release (0.X.0)
- New features
- Backwards compatible
- May require documentation updates
- Should include new tests

### Patch Release (0.0.X)
- Bug fixes
- Minor improvements
- No breaking changes
- Minimal documentation updates needed

## Emergency Releases

For critical bug fixes:
1. Create a hotfix branch
2. Fix the issue
3. Test thoroughly
4. Release as a patch version
5. Update CHANGELOG.md
6. Follow normal release process 