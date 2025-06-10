# CSS Linting Activation Guide
**OneiroMetrics CSS Refactoring v3**

## Current Status: ✅ Complete and Ready for Activation

The CSS linting infrastructure has been fully set up and is ready for activation. The linting system is currently **disabled** to allow final testing and preparation before enforcement.

## ⚠️ **CRITICAL REFACTORING CONSTRAINT**

**All existing CSS class names must remain unchanged during refactoring.**

CSS classes are extensively referenced throughout the TypeScript/JavaScript codebase. The linting system is configured to **not enforce** class naming patterns to preserve existing functionality.

**Linting Strategy:**
- ✅ **Enforce CSS quality** - duplicates, complexity, consistency
- ✅ **Guide new classes** - `u-` prefix for utilities, `oomp-` for new components  
- ❌ **Do not enforce** global class naming on existing classes
- ❌ **Do not require** existing classes to follow new patterns

## Activation Ready

All prerequisite phases have been completed:
- ✅ Phase 3.1: Component Architecture Audit (COMPLETE)
- ✅ Phase 3.2: High-Impact Quick Wins (Size & State utilities) (COMPLETE)
- ✅ Phase 3.3: Medium-Impact Optimizations (COMPLETE)
- ✅ Phase 3.4: Long-Term Architecture Improvements (COMPLETE)

**Status**: Ready for immediate activation when desired

## What's Already Set Up

### ✅ Tools Installed
```bash
npm list --depth=0 | grep -E "(stylelint|prettier|husky|lint-staged)"
├── stylelint@16.20.0
├── stylelint-config-standard@38.0.0  
├── prettier@3.5.3
├── husky@9.1.7
├── lint-staged@16.1.0
```

### ✅ Configuration Files Created
- `.stylelintrc.js` - CSS linting rules (warning mode)
- `.prettierrc.js` - CSS formatting rules
- `.prettierignore` - Files to exclude from formatting
- `.lintstagedrc.js` - Pre-commit automation (commented out)

### ✅ NPM Scripts Available
```bash
npm run css:lint        # Check CSS for issues (warnings only)
npm run css:lint:fix    # Auto-fix CSS issues where possible
npm run css:format      # Format CSS files with Prettier
npm run css:check       # Run both linting and format checking
npm run lint:setup      # Verify infrastructure is ready
```

## Testing Current Setup (Safe)

You can test the linting system without enforcement:

```bash
# Check what issues exist (won't block anything)
npm run css:lint

# See what auto-fixes are available
npm run css:lint:fix

# Format CSS files for consistency
npm run css:format
```

## Activation Steps

### Step 1: Update Stylelint Rules
Edit `.stylelintrc.js` and change critical rules from `'warn'` to `'error'`:

```javascript
// Change these after refactoring is complete:
'declaration-block-no-duplicate-properties': 'error', // was 'warn'
'no-duplicate-selectors': 'error',                    // was 'warn'
'selector-no-qualifying-type': 'error',               // was 'warn'

// Enable strict rules that were disabled:
'selector-max-specificity': '0,3,2',                  // was null
'selector-max-compound-selectors': 3,                 // was null
```

### Step 2: Enable Pre-commit Hooks
Uncomment CSS linting in `.lintstagedrc.js`:

```javascript
// Uncomment these lines:
'styles/**/*.css': [
  'stylelint --fix',
  'prettier --write', 
  'git add'
],
```

### Step 3: Install Git Hooks
```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

### Step 4: Update Build Integration
Optionally enhance `build-css.js` to fail on linting errors:

```javascript
// Add this to build-css.js if desired:
try {
  execSync('npm run css:lint', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ CSS linting failed - build aborted');
  process.exit(1);
}
```

## Gradual Activation Strategy

### Phase A: Warnings Only (Current)
- All rules set to `'warn'`
- No build blocking
- Manual linting available

### Phase B: Critical Rules Enforced
- Duplicate patterns → `'error'` 
- Selector complexity → `'error'`
- Still allow most issues

### Phase C: Full Enforcement
- All rules active
- Pre-commit hooks enabled
- Build integration active

## Benefits After Activation

### Prevents Regression
- No new repetitive patterns (47 found in audit)
- No new complex selectors (12 found in audit)
- Consistent utility class naming

### Enforces Optimizations
- Size utilities must follow `u-size--*` pattern
- State utilities must follow `u-state--*` pattern  
- Component classes must follow `oom-*` BEM pattern

### Developer Experience
```bash
# Before activation (current):
Developer writes: .oomButton { padding: 8px 16px !important; }
Result: Works fine, adds to technical debt

# After activation:
Developer writes: .oomButton { padding: 8px 16px !important; }
Stylelint: ❌ Use kebab-case: .oom-button
Stylelint: ❌ Avoid !important declarations  
Stylelint: ❌ Use utility class: u-size--md
Auto-fix: .oom-button { /* use u-size--md utility instead */ }
```

## IDE Integration (Optional)

### VS Code Extensions
```bash
# Install for real-time feedback:
code --install-extension stylelint.vscode-stylelint
code --install-extension esbenp.prettier-vscode
```

### Settings Configuration
```json
// .vscode/settings.json
{
  "css.validate": false,
  "stylelint.enable": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.stylelint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Rollback Plan

If linting causes issues after activation:

```bash
# Disable pre-commit hooks
rm .husky/pre-commit

# Change rules back to warnings
# Edit .stylelintrc.js: 'error' → 'warn'

# Comment out lint-staged CSS rules
# Edit .lintstagedrc.js: comment CSS sections
```

## Success Metrics

After activation, track:
- ✅ No new duplicate selectors introduced
- ✅ No new overly complex selectors (>3 levels)
- ✅ All utility classes follow naming convention
- ✅ No new hardcoded color values (use CSS variables)
- ✅ Consistent formatting across all CSS files

## Next Steps

1. **Complete current refactoring phases** (3.2-3.4)
2. **Test activation on feature branch** first
3. **Gradually enable rules** (warnings → errors)
4. **Train team** on new conventions
5. **Monitor and adjust** rules based on usage

**Activation Target**: After 85KB CSS optimization is complete and utility system is established. 

## ✅ Implementation Complete

**Status**: All refactoring phases completed. System ready for immediate activation.

### Next Actions Available:

1. **Activate immediately** - Follow activation steps above
2. **Test on feature branch first** - Recommended for safety  
3. **Gradually enable rules** - Start with warnings → critical errors → full enforcement
4. **Train team** on new conventions and tools
5. **Monitor and adjust** rules based on real-world usage

**All prerequisites completed**: CSS refactoring v3, utility system established, and 85KB+ optimization achieved. 