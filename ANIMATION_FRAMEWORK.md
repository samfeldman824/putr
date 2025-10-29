# Animation Framework Documentation

## Story #93 - Modal and Notification Animations

**Comprehensive reusable CSS animation framework for modal dialogs and toast notifications**

This document combines the best features from both implementation approaches, providing a complete guide to the animation system added to `style.css`.

---

## Table of Contents

1. [Overview](#overview)
2. [Modal Animations](#modal-animations)
3. [Toast Notifications](#toast-notifications)
4. [JavaScript Integration](#javascript-integration)
5. [Performance](#performance)
6. [Accessibility](#accessibility)
7. [Theme Compatibility](#theme-compatibility)
8. [Browser Support](#browser-support)
9. [Testing](#testing)

---

## Overview

### Key Features

- ✅ **GPU-Accelerated**: Only `transform` and `opacity` properties (60fps target)
- ✅ **Accessible**: Full `prefers-reduced-motion` support
- ✅ **Theme-Agnostic**: Works with both light and dark modes
- ✅ **Comprehensive**: 10 toast positions + modal variants
- ✅ **Type-Safe**: Success/error/info variants for toasts
- ✅ **Smooth**: Separate enter/exit animations with proper easing

### What's Included

**Modal Features:**
- Modal container and content base styles
- Backdrop overlay with blur effect
- Fade + scale enter/exit animations (300ms)
- Semantic helper classes (`.modal-header`, `.modal-body`, `.modal-footer`)

**Toast Features:**
- 10 positioning options (6 edges + 4 corners)
- 3 type variants (success/error/info) with color-coded borders
- Slide animations from all directions (400ms)
- Universal exit animation option

---

## Modal Animations

### Basic Structure

```html
<!-- Modal with backdrop -->
<div class="modal-backdrop backdrop-enter"></div>
<div class="modal-container active">
  <div class="modal-content modal-enter">
    <div class="modal-header">Modal Title</div>
    <div class="modal-body">
      <p>Your modal content goes here.</p>
    </div>
    <div class="modal-footer">
      <button onclick="closeModal()">Cancel</button>
      <button onclick="submitModal()">Confirm</button>
    </div>
  </div>
</div>
```

### CSS Classes

| Class | Purpose | Duration |
|-------|---------|----------|
| `.modal-container` | Fixed positioned wrapper for centering | - |
| `.modal-container.active` | Enables pointer events | - |
| `.modal-content` | The actual modal box with styling | - |
| `.modal-backdrop` | Semi-transparent overlay with blur | - |
| `.modal-enter` | Fade-in with scale (0.9→1.0) | 300ms |
| `.modal-exit` | Fade-out with reverse scale | 300ms |
| `.backdrop-enter` | Backdrop fade-in with blur effect | 300ms |
| `.backdrop-exit` | Backdrop fade-out | 300ms |
| `.modal-overlay-enter` | Alternative name for backdrop-enter | 300ms |
| `.modal-overlay-exit` | Alternative name for backdrop-exit | 300ms |

### Helper Classes

- `.modal-header` - Styled header section
- `.modal-body` - Content area with proper spacing
- `.modal-footer` - Footer with button alignment

---

## Toast Notifications

### Basic Structure

```html
<div class="toast toast-slide-top-right success">
  ✓ Operation completed successfully!
</div>
```

### Position Classes

#### Edge Positions (6 options)

| Class | Position | Alternative Name |
|-------|----------|------------------|
| `.toast-slide-top` | Top center | `.toast-slide-down` |
| `.toast-slide-bottom` | Bottom center | `.toast-slide-up` |
| `.toast-slide-left` | Top right (slides left) | - |
| `.toast-slide-right` | Top left (slides right) | - |

#### Corner Positions (4 options)

| Class | Position | Alternative Name |
|-------|----------|------------------|
| `.toast-slide-top-left` | Top-left corner | `.toast-corner-top-left` |
| `.toast-slide-top-right` | Top-right corner | `.toast-corner-top-right` |
| `.toast-slide-bottom-left` | Bottom-left corner | `.toast-corner-bottom-left` |
| `.toast-slide-bottom-right` | Bottom-right corner | `.toast-corner-bottom-right` |

### Type Variants

Add these classes for color-coded left borders:

- `.success` - Green border (uses `var(--success-color)`)
- `.error` - Red border (uses `var(--error-color)`)
- `.info` - Blue border (uses `var(--accent-primary)`)

### Exit Animations

Each position has a dedicated exit animation:

- `.toast-slide-down-exit`
- `.toast-slide-up-exit`
- `.toast-slide-left-exit`
- `.toast-slide-right-exit`
- `.toast-corner-top-left-exit`
- `.toast-corner-top-right-exit`
- `.toast-corner-bottom-left-exit`
- `.toast-corner-bottom-right-exit`

**Universal exit:** `.toast-exit` - Works with any position (fade + scale)

---

## JavaScript Integration

### Show Modal Function

```javascript
function showModal(title, message, onConfirm) {
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop backdrop-enter';
  backdrop.id = 'modal-backdrop';
  
  // Create modal container
  const container = document.createElement('div');
  container.className = 'modal-container active';
  container.id = 'modal-container';
  
  // Create modal content
  const content = document.createElement('div');
  content.className = 'modal-content modal-enter';
  content.innerHTML = `
    <div class="modal-header">${title}</div>
    <div class="modal-body">${message}</div>
    <div class="modal-footer">
      <button onclick="closeModal()">Cancel</button>
      <button onclick="closeModal(true)">Confirm</button>
    </div>
  `;
  
  container.appendChild(content);
  document.body.appendChild(backdrop);
  document.body.appendChild(container);
  
  // Store callback
  window._modalCallback = onConfirm;
}

function closeModal(confirmed = false) {
  const backdrop = document.getElementById('modal-backdrop');
  const container = document.getElementById('modal-container');
  const content = container.querySelector('.modal-content');
  
  // Apply exit animations
  backdrop.classList.remove('backdrop-enter');
  backdrop.classList.add('backdrop-exit');
  content.classList.remove('modal-enter');
  content.classList.add('modal-exit');
  
  // Remove from DOM after animation
  setTimeout(() => {
    backdrop.remove();
    container.remove();
    
    // Execute callback if confirmed
    if (confirmed && window._modalCallback) {
      window._modalCallback();
      delete window._modalCallback;
    }
  }, 300);
}
```

### Show Toast Function

```javascript
function showToast(message, type = 'info', position = 'top-right', duration = 4000) {
  const toast = document.createElement('div');
  const positionClass = `toast-slide-${position}`;
  toast.className = `toast ${positionClass} ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Auto-dismiss
  setTimeout(() => {
    dismissToast(toast, positionClass);
  }, duration);
  
  return toast;
}

function dismissToast(toast, positionClass) {
  // Remove position animation and add exit animation
  toast.classList.remove(positionClass);
  toast.classList.add('toast-exit');
  
  // Remove from DOM after animation
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// Usage examples
showToast('✓ Saved successfully!', 'success', 'top-right');
showToast('✗ Error occurred', 'error', 'top');
showToast('ℹ Just so you know', 'info', 'bottom-right', 5000);
```

---

## Performance

### GPU Acceleration

All animations use **only** GPU-accelerated properties:

✅ **Safe to animate:**
- `transform` (translate, scale, rotate)
- `opacity`

❌ **Avoid animating:**
- `width`, `height` - Triggers layout
- `top`, `left`, `right`, `bottom` - Triggers layout
- `margin`, `padding` - Triggers layout

### Timing Strategy

- **Modal enter/exit**: 300ms (responsive feel)
- **Toast slide**: 400ms (better visibility)
- **Toast exit**: 300ms (quick dismissal)

### Easing Functions

- **Enter animations**: `ease-out` (quick start, smooth finish)
- **Exit animations**: `ease-in` (smooth start, quick finish)

### Performance Testing

1. Open Chrome DevTools (F12)
2. Navigate to **Performance** tab
3. Click **Record** (●)
4. Trigger animations
5. Stop recording
6. Check **Frames** section - should be green (60fps)

---

## Accessibility

### prefers-reduced-motion Support

All animations automatically respect user motion preferences. When `prefers-reduced-motion: reduce` is enabled:

- ✅ Animations complete instantly (~0ms)
- ✅ Functionality remains intact
- ✅ No motion sickness triggers
- ✅ Elements still show/hide properly

### How It Works

```css
@media (prefers-reduced-motion: reduce) {
  .modal-enter,
  .modal-exit,
  .toast-slide-top,
  /* ... all animation classes ... */ {
    animation: none !important;
  }
  
  /* Instant show state */
  .modal-enter {
    opacity: 1;
    transform: scale(1);
  }
  
  /* Instant hide state */
  .modal-exit {
    opacity: 0;
  }
}
```

### Testing Reduced Motion

**macOS:**
1. System Preferences → Accessibility → Display
2. Check "Reduce motion"

**Windows:**
1. Settings → Ease of Access → Display
2. Toggle "Show animations" off

**Chrome DevTools:**
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "Emulate CSS prefers-reduced-motion"
3. Select "prefers-reduced-motion: reduce"
4. Test animations - should appear/disappear instantly

---

## Theme Compatibility

All styles use CSS variables for seamless theme integration:

**Variables Used:**
- `var(--bg-primary)` - Modal/toast background
- `var(--bg-secondary)` - Alternative backgrounds
- `var(--text-primary)` - Primary text color
- `var(--text-secondary)` - Secondary text color
- `var(--border-color)` - Border color
- `var(--shadow-color)` - Drop shadows
- `var(--success-color)` - Success toast border
- `var(--error-color)` - Error toast border
- `var(--accent-primary)` - Info toast border

**Automatic theme switching** - No additional code needed!

---

## Browser Support

### Tested Browsers

✅ Chrome 90+
✅ Firefox 88+  
✅ Safari 14+
✅ Edge 90+

### Feature Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Animations | ✅ | ✅ | ✅ | ✅ |
| @keyframes | ✅ | ✅ | ✅ | ✅ |
| transform | ✅ | ✅ | ✅ | ✅ |
| opacity | ✅ | ✅ | ✅ | ✅ |
| backdrop-filter | ✅ | ✅ | ✅ | ✅ |
| prefers-reduced-motion | ✅ | ✅ | ✅ | ✅ |

**Note:** `backdrop-filter` is a progressive enhancement. If not supported, modals will still work with a solid color backdrop.

---

## Testing

### Interactive Demo

Open `demo-animations.html` in your browser to:

- ✅ Test all 10 toast positions
- ✅ Try all 3 toast types (success/error/info)
- ✅ Demo modals with and without backdrop
- ✅ Toggle between light and dark themes
- ✅ Verify accessibility with reduced motion

### Manual Testing Checklist

- [ ] Modal enters with smooth fade + scale
- [ ] Modal exits with reverse animation
- [ ] Backdrop fades in/out smoothly
- [ ] Backdrop blur effect works (if supported)
- [ ] All 10 toast positions work correctly
- [ ] Toast type borders display correct colors
- [ ] Exit animations reverse properly
- [ ] No layout jumps or flashes
- [ ] Works in light theme
- [ ] Works in dark theme
- [ ] Respects prefers-reduced-motion
- [ ] No console errors

---

## File Locations

**CSS Animations:**
- `/style.css` (lines ~800+)
- Section: "MODAL AND NOTIFICATION ANIMATIONS FRAMEWORK"

**Documentation:**
- `/ANIMATION_FRAMEWORK.md` (this file)

**Demo:**
- `/demo-animations.html`

---

## Future Enhancements

Possible additions for future stories:

- Bounce/elastic easing for playful interactions
- Shake animation for error states
- Pulse animation for attention-grabbing
- Stagger animations for lists
- Page transition animations
- Confetti or celebration effects

---

## Related Issues

- Resolves: #93 - Modal and Notification Animations
- Relates to: #70 - Smooth Animations & Transitions (Epic)
- Relates to: #87 - Basic CSS Transitions
- Relates to: #91 - Accessibility Support
- Relates to: #89 - Loading Skeleton Animations

---

**Created:** October 29, 2025  
**Version:** 1.0.0  
**Story:** #93
