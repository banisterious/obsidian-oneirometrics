# Accessibility Features Guide
> **Last Updated:** 2025-06-10

## Table of Contents

- [Overview](#overview)
- [Keyboard Navigation](#keyboard-navigation)
  - [Enhanced Date Navigator](#enhanced-date-navigator)
    - [Getting Started](#getting-started)
    - [Calendar Grid Navigation](#calendar-grid-navigation)
    - [Multi-Month Views](#multi-month-views)
  - [General Interface Navigation](#general-interface-navigation)
- [Screen Reader Support](#screen-reader-support)
  - [ARIA Implementation](#aria-implementation)
  - [Screen Reader Experience](#screen-reader-experience)
    - [Calendar Navigation](#calendar-navigation)
    - [Dream Entry Information](#dream-entry-information)
    - [View Mode Changes](#view-mode-changes)
  - [Recommended Screen Readers](#recommended-screen-readers)
- [Visual Accessibility](#visual-accessibility)
  - [High Contrast Support](#high-contrast-support)
  - [Color and Visual Indicators](#color-and-visual-indicators)
  - [Reduced Motion Support](#reduced-motion-support)
- [Keyboard-Only Workflows](#keyboard-only-workflows)
  - [Complete Date Selection Workflow](#complete-date-selection-workflow)
  - [Efficient Navigation Patterns](#efficient-navigation-patterns)
  - [Multi-Month Navigation](#multi-month-navigation)
- [Assistive Technology Tips](#assistive-technology-tips)
  - [Screen Reader Optimization](#screen-reader-optimization)
  - [Voice Control Software](#voice-control-software)
  - [Switch Navigation](#switch-navigation)
- [Customization Options](#customization-options)
  - [Obsidian Accessibility Settings](#obsidian-accessibility-settings)
  - [Theme Compatibility](#theme-compatibility)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
    - [Focus Not Visible](#focus-not-visible)
    - [Screen Reader Not Announcing](#screen-reader-not-announcing)
    - [Keyboard Navigation Not Working](#keyboard-navigation-not-working)
  - [Getting Help](#getting-help)
- [Best Practices](#best-practices)
  - [Efficient Usage](#efficient-usage)
  - [Screen Reader Usage](#screen-reader-usage)
  - [Collaboration](#collaboration)

OneiroMetrics v0.16.0 is designed to be fully accessible to users with disabilities, meeting WCAG 2.1 AA compliance standards. This guide explains all accessibility features and how to use them effectively.

## Overview

OneiroMetrics provides comprehensive accessibility support including:

- **Full keyboard navigation** with standard patterns
- **Screen reader compatibility** with complete ARIA implementation
- **High contrast support** for visual accessibility
- **Reduced motion support** for vestibular sensitivity
- **Logical focus management** throughout the interface

## Keyboard Navigation

### Enhanced Date Navigator

#### Getting Started
1. **Open the Date Navigator**: Use `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
2. **Tab to calendar**: The Tab key moves through interface elements in logical order
3. **Enter calendar grid**: Press Tab until you reach a calendar grid, then press Tab again to enter it

#### Calendar Grid Navigation
- **Arrow Keys**: Navigate between dates within a calendar grid
  - `←` **Left Arrow**: Move to previous day
  - `→` **Right Arrow**: Move to next day  
  - `↑` **Up Arrow**: Move to same day previous week
  - `↓` **Down Arrow**: Move to same day next week
- **Home**: Jump to first day of the month
- **End**: Jump to last day of the month
- **Enter** or **Space**: Select the focused date
- **Escape**: Close the Date Navigator

#### Multi-Month Views
- **Tab**: Move between different month grids in dual/quarter view
- **Shift+Tab**: Move backward between month grids
- **Arrow keys**: Navigate within the currently focused month grid

### General Interface Navigation
- **Tab**: Move forward through interactive elements
- **Shift+Tab**: Move backward through interactive elements  
- **Enter** or **Space**: Activate buttons, open dropdowns, select options
- **Escape**: Close modals, cancel operations, return to previous context

## Screen Reader Support

### ARIA Implementation
OneiroMetrics uses industry-standard ARIA (Accessible Rich Internet Applications) markup:

- **Grid Structure**: Calendar grids use `role="grid"` with proper `role="gridcell"` for each date
- **Live Regions**: Important updates are announced automatically
- **Descriptive Labels**: All interactive elements have clear, contextual labels
- **State Information**: Current selection, view mode, and filter status are announced

### Screen Reader Experience

#### Calendar Navigation
- **Grid Announcement**: "Calendar grid for [Month Year]"
- **Date Information**: "[Day of week], [Date], [Dream entry status]"
- **Navigation Context**: "Currently in [Month] view, [Selected dates count] selected"

#### Dream Entry Information
When focusing on dates with dream entries:
- **Entry Count**: "3 dream entries"
- **Quality Information**: "Average quality: 4.2 stars"
- **Pattern Data**: Available through tooltips and detailed announcements

#### View Mode Changes
- **Live Announcements**: "Switched to dual month view" 
- **Context Updates**: "Now showing [Current Month] and [Next Month]"

### Recommended Screen Readers
OneiroMetrics is tested and optimized for:
- **NVDA** (Windows) - Free and excellent support
- **JAWS** (Windows) - Industry standard with full feature support
- **VoiceOver** (Mac) - Built-in Mac screen reader with native support
- **Orca** (Linux) - Open source screen reader with good compatibility

## Visual Accessibility

### High Contrast Support
OneiroMetrics automatically adapts to system high contrast settings:

- **Focus Indicators**: Enhanced visibility with thicker borders and distinct colors
- **Selected States**: High contrast highlighting for selected dates and active elements
- **Text Contrast**: All text meets WCAG AA contrast requirements (4.5:1 minimum)
- **Icon Clarity**: Enhanced icon visibility in high contrast mode

### Color and Visual Indicators
- **Color Independence**: Information is never conveyed by color alone
- **Pattern Redundancy**: Dream quality uses both color and symbols (stars, dots)
- **Focus Clarity**: Focus indicators use multiple visual cues (border, shadow, background)

### Reduced Motion Support
For users sensitive to motion:
- **Respects `prefers-reduced-motion`**: System setting automatically honored
- **Gentle Transitions**: Smooth but minimal animations when motion is enabled
- **Static Alternatives**: No essential information requires animation to understand

## Keyboard-Only Workflows

### Complete Date Selection Workflow
1. **Open Date Navigator**: `Ctrl+Shift+D`
2. **Navigate to calendar**: `Tab` until you reach the calendar grid
3. **Enter calendar**: `Tab` again to focus first date
4. **Navigate to desired date**: Use arrow keys
5. **Select date**: `Enter` or `Space`
6. **Apply filter**: `Tab` to "Apply Filter" button, press `Enter`

### Efficient Navigation Patterns
- **Quick Today Access**: Tab to "Today" button for immediate current date focus
- **Month Navigation**: Tab to month/year controls for quick time period changes
- **View Switching**: Tab to view mode dropdown for layout changes

### Multi-Month Navigation
In dual or quarter view:
1. **Tab to first calendar grid**: Initial calendar becomes accessible
2. **Navigate within grid**: Use arrow keys for date navigation
3. **Tab to next grid**: Move to subsequent month calendar
4. **Repeat navigation**: Each grid maintains independent focus

## Assistive Technology Tips

### Screen Reader Optimization
- **Browse Mode**: Use screen reader browse mode for overview, focus mode for interaction
- **Virtual Cursor**: Navigate by headings (H) and links (K) for quick orientation
- **Forms Mode**: Automatically engaged when interacting with calendar grids

### Voice Control Software
- **Dragon NaturallySpeaking**: Fully compatible with voice commands
- **Windows Speech Recognition**: Standard voice commands work throughout interface
- **Mac Voice Control**: Native support for voice navigation and selection

### Switch Navigation
- **Single Switch**: Sequential Tab navigation provides access to all features
- **Dual Switch**: Forward/backward navigation with selection capability
- **Sip-and-Puff**: Standard keyboard emulation fully supported

## Customization Options

### Obsidian Accessibility Settings
OneiroMetrics respects all Obsidian accessibility preferences:
- **Use tab to indent lists**: Maintained compatibility
- **Focus outline**: Enhanced focus indicators work with Obsidian settings
- **Font size**: Calendar text scales with Obsidian font settings

### Theme Compatibility
- **High contrast themes**: Automatic adaptation to high contrast Obsidian themes
- **Custom CSS**: Accessibility features maintained when using custom CSS
- **Color schemes**: Proper contrast maintained across all supported color schemes

## Troubleshooting

### Common Issues

#### Focus Not Visible
- **Check theme settings**: Some themes may hide focus indicators
- **System high contrast**: Enable Windows/Mac high contrast mode
- **Browser zoom**: Increase zoom level for better focus visibility

#### Screen Reader Not Announcing
- **Refresh screen reader**: Press screen reader's refresh key (NVDA: Insert+F5)
- **Check browse mode**: Switch to focus mode for interactive elements
- **Update screen reader**: Ensure you're using a recent version

#### Keyboard Navigation Not Working
- **Check for conflicting shortcuts**: Some browser/system shortcuts may conflict
- **Modal focus**: Ensure the Date Navigator modal has focus
- **Tab trapping**: Press Escape to exit modal if Tab navigation seems stuck

### Getting Help
- **Community Support**: Join the OneiroMetrics accessibility community
- **Documentation**: Comprehensive guides available in the user documentation
- **Feedback**: Report accessibility issues for continuous improvement

## Best Practices

### Efficient Usage
- **Learn shortcuts**: Keyboard shortcuts significantly speed up navigation
- **Use single month view**: Optimal keyboard navigation experience
- **Practice patterns**: Regular use builds muscle memory for efficient navigation

### Screen Reader Usage
- **Announcement review**: Use screen reader review commands to re-hear announcements
- **Object navigation**: Use object navigation to explore calendar structure
- **Settings optimization**: Configure screen reader verbosity for optimal experience

### Collaboration
- **Share accessibility knowledge**: Help other users discover accessibility features
- **Report issues**: Accessibility feedback helps improve the experience for everyone
- **Document workflows**: Share efficient keyboard navigation patterns

---

OneiroMetrics is committed to providing an inclusive experience for all users. These accessibility features ensure that dream tracking and analysis are available to everyone, regardless of ability or assistive technology needs. 