# Modal and Notification Animations Framework

## Overview

This CSS animation framework provides reusable classes for modal dialogs and toast notifications. All animations use GPU-accelerated properties (transform and opacity) for 60fps performance and include full accessibility support via `prefers-reduced-motion`.

## Demo

Open `demo-animations.html` in your browser to see all animations in action and test them with both light and dark themes.

## Modal Dialog Animations

### Basic Modal

```html
<!-- Modal structure -->
<div class="modal-container active">
    <div class="modal-content modal-enter">
        <div class="modal-header">Title</div>
        <div class="modal-body">Content</div>
        <div class="modal-footer">
            <button>Close</button>
        </div>
    </div>
</div>
```

### Classes

- **`.modal-container`** - Fixed positioned container for centering
- **`.modal-content`** - The actual modal box with styling
- **`.modal-enter`** - Fade-in with scale effect (300ms)
- **`.modal-exit`** - Fade-out with reverse scale (300ms)

### With Backdrop

```html
<!-- Add backdrop before modal container -->
<div class="modal-backdrop backdrop-enter"></div>
<div class="modal-container active">
    <div class="modal-content modal-enter">
        <!-- content -->
    </div>
</div>
```

### Classes

- **`.modal-backdrop`** - Semi-transparent overlay with blur effect
- **`.backdrop-enter`** - Fade-in backdrop (300ms)
- **`.backdrop-exit`** - Fade-out backdrop (300ms)

## Toast Notification Animations

### Basic Toast

```html
<div class="toast toast-slide-top info">
    ℹ This is an info message
</div>
```

### Position Classes

- **`.toast-slide-top`** - Slides down from top center
- **`.toast-slide-bottom`** - Slides up from bottom center
- **`.toast-slide-top-left`** - Slides from top-left corner
- **`.toast-slide-top-right`** - Slides from top-right corner
- **`.toast-slide-bottom-left`** - Slides from bottom-left corner
- **`.toast-slide-bottom-right`** - Slides from bottom-right corner

### Type Classes (Optional)

- **`.success`** - Green left border for success messages
- **`.error`** - Red left border for error messages
- **`.info`** - Blue left border for info messages

### Exit Animation

```javascript
// Apply .toast-exit class to fade out smoothly
toast.classList.remove('toast-slide-top');
toast.classList.add('toast-exit');

// Remove from DOM after animation (300ms)
setTimeout(() => toast.remove(), 300);
```

## JavaScript Integration Examples

### Show Modal Function

```javascript
function showModal() {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container active';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content modal-enter';
    modalContent.innerHTML = `
        <div class="modal-header">Modal Title</div>
        <div class="modal-body">Modal content here</div>
        <div class="modal-footer">
            <button onclick="closeModal(this)">Close</button>
        </div>
    `;
    
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);
}

function closeModal(button) {
    const modalContainer = button.closest('.modal-container');
    const modalContent = modalContainer.querySelector('.modal-content');
    
    modalContent.classList.remove('modal-enter');
    modalContent.classList.add('modal-exit');
    
    setTimeout(() => modalContainer.remove(), 300);
}
```

### Show Toast Function

```javascript
function showToast(message, type = 'info', position = 'top') {
    const toast = document.createElement('div');
    toast.className = `toast toast-slide-${position} ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove(`toast-slide-${position}`);
        toast.classList.add('toast-exit');
        
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Usage examples
showToast('Operation successful!', 'success', 'top-right');
showToast('Something went wrong', 'error', 'bottom-right');
showToast('Just letting you know', 'info', 'top');
```

## Performance Notes

### GPU-Accelerated Properties

All animations use only `transform` and `opacity`, which are GPU-accelerated:

✅ **Used:**
- `transform: scale()` - For modal scaling
- `transform: translate()` - For toast positioning
- `opacity` - For fading effects

❌ **Avoided:**
- `width`, `height` - Trigger layout recalculation
- `top`, `left`, `margin`, `padding` - Trigger layout recalculation

### Frame Rate

Target: 60fps (16.67ms per frame)

Test performance:
1. Open Chrome DevTools
2. Go to Performance tab
3. Record while triggering animations
4. Check frame rate in timeline

## Accessibility

### prefers-reduced-motion Support

All animations respect the user's motion preferences:

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
System Preferences → Accessibility → Display → Reduce motion

**Windows:**
Settings → Ease of Access → Display → Show animations (turn off)

**Chrome DevTools:**
1. CMD/CTRL + Shift + P
2. Type "Emulate CSS prefers-reduced-motion"
3. Select "reduce"

## Theme Compatibility

All animations work seamlessly with both light and dark themes using CSS variables:

- `var(--bg-primary)` - Modal/toast background
- `var(--text-primary)` - Text color
- `var(--border-color)` - Border color
- `var(--shadow-color)` - Drop shadow
- `var(--success-color)` - Success toast border
- `var(--error-color)` - Error toast border
- `var(--accent-primary)` - Info toast border

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Animation Timing

| Animation Type | Duration | Easing | Notes |
|---------------|----------|--------|-------|
| Modal Enter | 300ms | ease-out | Feels responsive |
| Modal Exit | 300ms | ease-in | Natural exit |
| Backdrop Enter | 300ms | ease-out | Syncs with modal |
| Backdrop Exit | 300ms | ease-in | Syncs with modal |
| Toast Slide | 400ms | ease-out | Slightly longer for visibility |
| Toast Exit | 300ms | ease-in | Quick dismissal |

## Future Use Cases

This framework is designed to support:

- ✅ Confirmation dialogs (delete player, reset data)
- ✅ Success/error toast notifications
- ✅ Loading overlays with messages
- ✅ Help/info popovers
- ✅ Alert messages
- ✅ Form validation feedback
- ✅ User onboarding tooltips

## CSS File Location

All animation styles are in: **`style.css`** (lines 820-1201)

Look for the section:
```css
/* ============================================================================
   MODAL AND NOTIFICATION ANIMATIONS FRAMEWORK
   ============================================================================ */
```
