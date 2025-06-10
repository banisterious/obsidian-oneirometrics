# Mobile Compatibility Guide
> **Last Updated:** 2025-06-10

## Table of Contents

- [Overview](#overview)
- [Device Compatibility](#device-compatibility)
  - [Supported Devices](#supported-devices)
  - [Browser Requirements](#browser-requirements)
- [Enhanced Date Navigator on Mobile](#enhanced-date-navigator-on-mobile)
  - [Mobile View Adaptation](#mobile-view-adaptation)
  - [Touch Interface](#touch-interface)
  - [View Mode Behavior](#view-mode-behavior)
- [Responsive Design](#responsive-design)
  - [Screen Size Adaptations](#screen-size-adaptations)
  - [Orientation Support](#orientation-support)
  - [Modal Behavior](#modal-behavior)
- [Accessibility on Mobile](#accessibility-on-mobile)
  - [Mobile Screen Readers](#mobile-screen-readers)
  - [Touch Accessibility](#touch-accessibility)
  - [High Contrast Support](#high-contrast-support)
- [Known Mobile Limitations](#known-mobile-limitations)
  - [Current Constraints](#current-constraints)
  - [Workarounds](#workarounds)
- [Troubleshooting Mobile Issues](#troubleshooting-mobile-issues)
  - [Common Problems](#common-problems)
  - [Layout Issues](#layout-issues)
  - [Touch Issues](#touch-issues)
- [Best Practices](#best-practices)
  - [Efficient Mobile Usage](#efficient-mobile-usage)
  - [Recommended Workflows](#recommended-workflows)

---

OneiroMetrics v0.16.0 includes basic mobile compatibility to ensure the Enhanced Date Navigator and core features work reliably across mobile devices. This guide covers the mobile experience, limitations, and best practices.

## Overview

OneiroMetrics mobile compatibility focuses on ensuring core functionality works on mobile devices:

- **Responsive Interface**: Enhanced Date Navigator adapts to different screen sizes
- **Touch-Friendly Design**: Basic touch interactions for date selection and navigation
- **Mobile Accessibility**: Screen reader and keyboard navigation support on mobile platforms

### Current Mobile Status
- **Basic Compatibility**: Core features work on mobile devices via Obsidian mobile app
- **Responsive Layout**: Enhanced Date Navigator modal adapts to mobile screen sizes
- **Touch Support**: Standard touch interactions for date selection and navigation
- **Accessibility**: Mobile screen reader support through standard ARIA implementation

**Note**: OneiroMetrics is primarily designed for desktop use. Mobile support provides basic functionality rather than a fully optimized mobile experience.

## Device Compatibility

### Supported Devices

#### Mobile Platforms
- **iOS**: Compatible with Obsidian iOS app (iOS 13+)
- **Android**: Compatible with Obsidian Android app (Android 7.0+)
- **Screen sizes**: Works on phones and tablets through responsive design

#### Access Method
OneiroMetrics mobile access is through the **Obsidian mobile app only**. It does not work in mobile web browsers as it's an Obsidian plugin.

### Browser Requirements

#### Obsidian Mobile App
- **iOS App**: Latest version of Obsidian from App Store
- **Android App**: Latest version of Obsidian from Google Play Store
- **Updates**: Keep Obsidian mobile app updated for best compatibility

**Important**: OneiroMetrics requires the full Obsidian mobile app and cannot be accessed through mobile web browsers.

## Enhanced Date Navigator on Mobile

### Mobile View Adaptation

#### Single Month View
- **Full-screen modal**: Takes advantage of available mobile screen space
- **Larger touch targets**: Date cells sized appropriately for finger navigation
- **Clear navigation**: Month navigation arrows and controls easily accessible
- **Readable text**: Date numbers and indicators properly sized for mobile screens

#### Dual Month View
- **Responsive layout**: Adapts to portrait/landscape orientation
- **Stacked on small screens**: Two months displayed vertically on phones
- **Side-by-side on tablets**: Larger screens show months horizontally
- **Maintained functionality**: All selection features work in both layouts

#### Quarter View
- **Adaptive grid**: Three months arranged to fit available screen space
- **Scrollable when needed**: Allows scrolling if content exceeds screen height
- **Touch navigation**: All months remain accessible via touch

### Touch Interface

#### Basic Touch Support
- **Tap to select**: Standard touch interaction for date selection
- **Touch targets**: Date cells meet minimum touch target sizes (44px minimum)
- **Visual feedback**: Selected dates show clear visual indication
- **Navigation buttons**: Month navigation buttons properly sized for touch

#### Standard Touch Interactions
- **Single tap**: Select individual dates
- **Standard scrolling**: Scroll within modal when content exceeds screen height
- **Pinch zoom**: Device-level zoom works for accessibility needs

**Note**: Advanced touch gestures (swipe navigation, multi-touch selection, etc.) are not implemented.

### View Mode Behavior

#### View Mode Switching
- **Dropdown access**: View mode dropdown accessible via touch
- **Mode persistence**: Selected view mode persists across sessions
- **Layout adaptation**: Each view mode adapts to current screen size

## Responsive Design

### Screen Size Adaptations

#### Portrait Mode (Phones)
- **Single-column layouts**: Interface elements stacked vertically
- **Full-width modals**: Enhanced Date Navigator uses full screen width
- **Vertical month stacking**: Dual/quarter views stack months vertically
- **Thumb-friendly navigation**: Controls positioned for easy thumb access

#### Landscape Mode (Phones)
- **Horizontal optimization**: Better use of horizontal screen space
- **Side-by-side layouts**: Dual month view can display side-by-side
- **Compact navigation**: Navigation controls optimized for landscape

#### Tablet Screens
- **Enhanced layouts**: More similar to desktop experience
- **Side-by-side months**: Dual month view displays horizontally
- **Larger touch targets**: Bigger date cells with more spacing
- **Desktop-like navigation**: More space for navigation controls

### Orientation Support

#### Automatic Adaptation
- **Orientation detection**: Layout adapts when device is rotated
- **Maintained state**: Date selections and view modes persist through rotation
- **Optimized layouts**: Different layouts for portrait vs landscape orientations

### Modal Behavior

#### Mobile Modal Adaptation
- **Full-screen appearance**: Modals take advantage of available screen space
- **Proper spacing**: Content properly spaced for mobile viewing
- **Touch-friendly controls**: All buttons and controls appropriately sized
- **Escape routes**: Clear ways to close modals (X button, etc.)

## Accessibility on Mobile

### Mobile Screen Readers

#### iOS VoiceOver Support
- **ARIA compatibility**: Standard ARIA grid structure works with VoiceOver
- **Touch exploration**: VoiceOver touch exploration works with calendar grid
- **Gesture navigation**: Standard VoiceOver gestures work within the interface
- **Announcements**: Important state changes are announced

#### Android TalkBack Support
- **TalkBack compatibility**: Calendar grid works with Android TalkBack
- **Explore by touch**: TalkBack touch exploration supported
- **Navigation**: Standard TalkBack navigation gestures work
- **Feedback**: Audio feedback for interactions and state changes

### Touch Accessibility

#### Accessible Touch Targets
- **Minimum sizes**: Touch targets meet accessibility guidelines (44px minimum)
- **Adequate spacing**: Sufficient space between interactive elements
- **Clear boundaries**: Visual boundaries help with precise targeting

### High Contrast Support

#### System Integration
- **High contrast respect**: Automatically adapts to system high contrast settings
- **Enhanced visibility**: Focus indicators and selection states remain visible
- **Color independence**: All information available without color perception

## Known Mobile Limitations

### Current Constraints

#### Feature Limitations
- **No advanced gestures**: Swipe navigation, pinch-to-zoom, etc. not implemented
- **No haptic feedback**: No vibration or haptic responses
- **No pull-to-refresh**: Manual refresh required for data updates
- **No offline capability**: Requires active data connection
- **No mobile-specific optimizations**: Performance not specifically optimized for mobile devices

#### Interface Limitations
- **Desktop-optimized design**: Interface primarily designed for desktop use
- **Limited mobile patterns**: No bottom sheets, floating action buttons, etc.
- **Standard modals only**: No mobile-native modal patterns
- **Basic responsive design**: Functional but not fully mobile-optimized

### Workarounds

#### For Small Screens
- **Use single month view**: Best experience on small screens
- **Zoom if needed**: Use device zoom for better visibility
- **Portrait orientation**: Often provides better layout on phones

#### For Touch Precision
- **Use device zoom**: Zoom in for more precise date selection
- **Take your time**: Mobile interactions may require more careful targeting
- **Use accessibility features**: Enable device accessibility features if needed

## Troubleshooting Mobile Issues

### Common Problems

#### Modal Not Displaying Properly
- **Symptoms**: Enhanced Date Navigator appears cut off or improperly sized
- **Solutions**:
  - Rotate device to refresh layout
  - Close and reopen the modal
  - Restart Obsidian mobile app
  - Check for Obsidian app updates

#### Touch Targets Too Small
- **Symptoms**: Difficulty selecting dates or navigation elements
- **Solutions**:
  - Use device zoom to enlarge interface
  - Switch to single month view for larger date cells
  - Enable accessibility features in device settings
  - Try landscape orientation for more space

### Layout Issues

#### Overlapping Elements
- **Symptoms**: Interface elements overlap or appear incorrectly positioned
- **Solutions**:
  - Rotate device to trigger layout refresh
  - Close modal and reopen
  - Check device orientation lock settings
  - Update Obsidian mobile app

#### Content Cut Off
- **Symptoms**: Parts of the interface are not visible
- **Solutions**:
  - Scroll within modal to access hidden content
  - Try different view modes (single, dual, quarter)
  - Check if device keyboard is interfering
  - Restart Obsidian app

### Touch Issues

#### Unresponsive Touch
- **Symptoms**: Touch interactions don't register or are delayed
- **Solutions**:
  - Ensure clean screen surface
  - Try tapping more deliberately
  - Check for other apps using touch resources
  - Restart Obsidian app if problem persists

#### Accidental Selection
- **Symptoms**: Wrong dates selected due to touch precision issues
- **Solutions**:
  - Use device zoom for better precision
  - Clear selection and try again
  - Switch to single month view for larger targets
  - Use accessibility features for touch accommodation

## Best Practices

### Efficient Mobile Usage

#### Recommended View Modes
- **Single month view**: Best for phones and precise date selection
- **Dual month view**: Good for tablets and date range selection
- **Quarter view**: Use only on larger screens (tablets)

#### Navigation Strategies
- **Plan selections**: Think through date selections before starting
- **Use landscape mode**: Often provides better layout on mobile devices
- **Take advantage of persistence**: View mode and navigation state persist

### Recommended Workflows

#### Quick Date Selection
1. **Open Enhanced Date Navigator**: Access via ribbon or command
2. **Choose appropriate view**: Single month for phones, dual for tablets
3. **Navigate to target month**: Use month navigation arrows
4. **Select dates**: Tap desired dates carefully
5. **Apply filter**: Tap Apply Filter button

#### Date Range Selection
1. **Enable range mode**: Use selection mode controls
2. **Select start date**: First date of desired range
3. **Navigate if needed**: Move to different month if range spans months
4. **Select end date**: Complete the range selection
5. **Apply filter**: Confirm selection

#### Multi-Date Selection
1. **Enable multi-select mode**: Access selection mode controls
2. **Select first date**: Initial date selection
3. **Add additional dates**: Continue selecting desired dates
4. **Review selection**: Confirm all intended dates are selected
5. **Apply filter**: Complete the multi-date filter

---

OneiroMetrics provides basic mobile compatibility through responsive design and touch support. While not fully optimized for mobile devices, core functionality works reliably on phones and tablets through the Obsidian mobile app. For the best mobile experience, use single month view on phones and take advantage of device accessibility features when needed. 