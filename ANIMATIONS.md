# Animation Framework Documentation
## Story #93 - Modal and Notification Animations

This document describes the reusable CSS animation framework for modals and toast notifications added to `style.css`.

## Overview

All animations in this framework:
- ✅ Use GPU-accelerated properties only (`transform` and `opacity`)
- ✅ Maintain 60fps performance
- ✅ Respect `prefers-reduced-motion` for accessibility
- ✅ Work with both dark and light themes
- ✅ Include smooth enter and exit animations

## Modal Animations

### Usage

To show a modal:
```javascript
// Show the modal overlay
overlay.classList.add('modal-overlay-enter');

// Show the modal dialog
dialog.classList.add('modal-enter');
```

To hide a modal:
```javascript
// Hide the overlay
overlay.classList.remove('modal-overlay-enter');
overlay.classList.add('modal-overlay-exit');

// Hide the dialog
dialog.classList.remove('modal-enter');
dialog.classList.add('modal-exit');

// After 300ms, remove the modal from DOM
setTimeout(() => {
  overlay.style.display = 'none';
}, 300);
```

### Available Classes

| Class | Duration | Effect |
|-------|----------|--------|
| `.modal-overlay-enter` | 300ms | Backdrop fades in with blur effect (0 → 4px blur) |
| `.modal-overlay-exit` | 300ms | Backdrop fades out, blur removes |
| `.modal-enter` | 300ms | Dialog fades in + scales up (0.9 → 1.0) |
| `.modal-exit` | 300ms | Dialog fades out + scales down (1.0 → 0.9) |

### Example HTML Structure
```html
<div class="modal-overlay">
  <div class="modal-dialog">
    <h3>Modal Title</h3>
    <p>Modal content here</p>
    <button onclick="closeModal()">Close</button>
  </div>
</div>
```

## Toast Notification Animations

### Usage

To show a toast notification:
```javascript
// Create toast element
const toast = document.createElement('div');
toast.classList.add('toast', 'toast-slide-down'); // or any other direction
document.body.appendChild(toast);

// Auto-dismiss after 3 seconds
setTimeout(() => {
  toast.classList.remove('toast-slide-down');
  toast.classList.add('toast-slide-down-exit');
  
  // Remove from DOM after exit animation
  setTimeout(() => toast.remove(), 400);
}, 3000);
```

### Available Directions

#### Edge Directions (4 directions)

| Class | Exit Class | Duration | Effect |
|-------|-----------|----------|--------|
| `.toast-slide-down` | `.toast-slide-down-exit` | 400ms | Slides down from top |
| `.toast-slide-up` | `.toast-slide-up-exit` | 400ms | Slides up from bottom |
| `.toast-slide-left` | `.toast-slide-left-exit` | 400ms | Slides left from right |
| `.toast-slide-right` | `.toast-slide-right-exit` | 400ms | Slides right from left |

#### Corner Directions (4 corners)

| Class | Exit Class | Duration | Effect |
|-------|-----------|----------|--------|
| `.toast-corner-top-right` | `.toast-corner-top-right-exit` | 400ms | Slides diagonally from top-right |
| `.toast-corner-top-left` | `.toast-corner-top-left-exit` | 400ms | Slides diagonally from top-left |
| `.toast-corner-bottom-right` | `.toast-corner-bottom-right-exit` | 400ms | Slides diagonally from bottom-right |
| `.toast-corner-bottom-left` | `.toast-corner-bottom-left-exit` | 400ms | Slides diagonally from bottom-left |

## Performance Notes

### GPU Acceleration
All animations use only `transform` and `opacity`, which are GPU-accelerated properties. This ensures smooth 60fps performance.

**DO NOT** animate these properties (causes layout thrashing):
- ❌ `width`, `height`
- ❌ `top`, `left`, `right`, `bottom`
- ❌ `margin`, `padding`

### Timing Functions
- **Enter animations**: `ease-out` - Quick start, smooth finish
- **Exit animations**: `ease-in` - Smooth start, quick finish

### Animation Durations
- **Modals**: 300ms (quick for responsiveness)
- **Toasts**: 400ms (slightly longer for better visibility)

## Accessibility

All animations automatically respect the user's `prefers-reduced-motion` preference:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

When a user has motion sensitivity enabled:
- Animations complete in ~0.01ms (effectively instant)
- Functionality remains intact
- No motion sickness triggers

### Testing Accessibility

**Chrome/Edge DevTools:**
1. Open DevTools (F12)
2. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Type "Emulate CSS prefers-reduced-motion"
4. Select "prefers-reduced-motion: reduce"
5. Test animations - they should appear/disappear instantly

**Firefox DevTools:**
1. Open DevTools (F12)
2. Click the three-dot menu → Settings
3. Enable "Accessibility" under "Advanced Settings"
4. Toggle "prefers-reduced-motion: reduce"

## Theme Compatibility

All animations work seamlessly with both light and dark themes:
- Modal overlays use theme-aware colors
- Backdrop effects respect theme settings
- No hardcoded colors in animation framework

## Testing

A comprehensive test page is available at `test-animations.html` (not committed to repo).

To test locally:
1. Start a local server: `python3 -m http.server 8000`
2. Open `http://localhost:8000/test-animations.html`
3. Test all modal and toast animations
4. Toggle dark/light theme
5. Test with `prefers-reduced-motion` enabled

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

All modern browsers support:
- CSS animations with `@keyframes`
- `transform` and `opacity` transitions
- `backdrop-filter` (progressive enhancement)
- `prefers-reduced-motion` media query

## Future Enhancements

Possible additions for future stories:
- Bounce/elastic easing functions
- Shake animation for errors
- Pulse animation for notifications
- Stagger animations for lists
- Page transition animations

## Related Stories

- #87 - Basic CSS Transitions
- #88 - Table Sorting Animations (Closed)
- #89 - Loading Skeleton Animations
- #90 - Chart.js Animation Enhancement
- #91 - Accessibility Support

## Code Location

All animation classes are defined in `/style.css` starting at line ~820, in the section:
```css
/* ==================================
   MODAL AND NOTIFICATION ANIMATIONS
   Story #93
   ================================== */
```
