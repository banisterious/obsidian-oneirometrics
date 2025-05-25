@echo off
echo Building OOM plugin with TypeScript errors bypassed...
echo This is for development purposes only - please fix errors before releasing!

:: Run esbuild directly rather than going through tsc
node esbuild.config.mjs

echo Build completed, errors bypassed. 