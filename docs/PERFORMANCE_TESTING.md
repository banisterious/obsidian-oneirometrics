# Performance Testing Guide for OneiroMetrics

## Overview
This guide provides step-by-step instructions for using Chrome DevTools to identify and diagnose performance issues in OneiroMetrics, particularly focusing on the Dream Entries table and expand/collapse functionality.

## Prerequisites
1. Chrome or Edge browser (both use Chromium DevTools)
2. Obsidian running in desktop mode
3. Developer Tools enabled in Obsidian (Settings → Advanced → Developer Tools)

## Basic Performance Testing Setup

### 1. Opening DevTools
1. Open Obsidian
2. Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
3. Click on the "Performance" tab
4. Ensure the following settings are enabled:
   - [x] CPU: 4x slowdown
   - [x] Network: No throttling
   - [x] Screenshots: Enabled
   - [x] Memory: Enabled

### 2. Recording a Performance Profile
1. Click the "Record" button (circle icon) or press `Ctrl+E`
2. Perform the action you want to test (e.g., expand/collapse a dream entry)
3. Click "Stop" or press `Ctrl+E` again
4. Wait for the profile to be processed

## Detailed Performance Analysis

### 1. Memory Analysis
1. In the Performance tab, look for:
   - Red bars indicating garbage collection (GC)
   - Yellow bars indicating JavaScript execution
   - Green bars indicating rendering
2. Click on any suspicious bars to see detailed timing
3. Look for patterns in the "Main" thread section

### 2. Frame Rate Analysis
1. Enable FPS meter:
   - Press `Ctrl+Shift+P`
   - Type "Show FPS meter"
   - Select the option
2. Look for:
   - FPS drops below 60
   - Jank (stuttering)
   - Frame time spikes

### 3. Memory Heap Analysis
1. Go to the "Memory" tab
2. Take a heap snapshot:
   - Click "Take heap snapshot"
   - Perform the action being tested
   - Take another snapshot
3. Compare snapshots to identify memory leaks

## Specific Test Cases

### 1. Expand/Collapse Performance
1. Open a project note with 100+ dream entries
2. Start recording
3. Expand and collapse 5 different entries
4. Stop recording
5. Look for:
   - GC events during expand/collapse
   - Long JavaScript execution times
   - Memory allocation spikes

### 2. Scrolling Performance
1. Start recording
2. Scroll through the entire table
3. Stop recording
4. Analyze:
   - Frame rate consistency
   - Memory usage during scroll
   - Virtualization effectiveness

### 3. Filter Performance
1. Start recording
2. Apply various filters in sequence
3. Stop recording
4. Check for:
   - Filter application delay
   - Table update performance
   - Memory usage during filtering

## Interpreting Results

### 1. Performance Metrics to Watch
- **FPS**: Should stay above 30 for smooth experience
- **Frame Time**: Should be under 16.67ms (60 FPS)
- **JS Heap Size**: Watch for continuous growth
- **GC Events**: Should be minimal during user interactions

### 2. Common Issues and Solutions
1. **High GC Activity**
   - Look for frequent red bars
   - Check for large object allocations
   - Consider object pooling or reuse

2. **Long JavaScript Execution**
   - Identify slow functions in the call stack
   - Look for expensive DOM operations
   - Consider breaking up long tasks

3. **Memory Leaks**
   - Compare heap snapshots
   - Look for growing object counts
   - Check for unremoved event listeners

## Best Practices

### 1. Testing Environment
- Use consistent data sets
- Test with realistic amounts of data
- Document test conditions

### 2. Recording Tips
- Keep recordings short (5-10 seconds)
- Focus on one interaction at a time
- Take multiple recordings for consistency

### 3. Analysis Workflow
1. Record the issue
2. Identify the bottleneck
3. Implement a fix
4. Record again
5. Compare results

## Troubleshooting Common Problems

### 1. DevTools Not Showing Data
- Ensure Developer Tools are enabled in Obsidian
- Try refreshing the DevTools window
- Check if the Performance tab is properly initialized

### 2. Inconsistent Results
- Clear browser cache
- Restart Obsidian
- Ensure no other heavy processes are running

### 3. Memory Issues
- Take heap snapshots before and after actions
- Look for growing object counts
- Check for proper cleanup in event listeners

## Reporting Issues

When reporting performance issues, include:
1. Performance profile file
2. Steps to reproduce
3. Expected vs actual behavior
4. System specifications
5. Obsidian version
6. Plugin version

## Additional Resources
- [Chrome DevTools Performance Documentation](https://developer.chrome.com/docs/devtools/performance/)
- [Memory Management Best Practices](https://developer.chrome.com/docs/devtools/memory-problems/)
- [Rendering Performance Guide](https://developer.chrome.com/docs/devtools/rendering-performance/) 