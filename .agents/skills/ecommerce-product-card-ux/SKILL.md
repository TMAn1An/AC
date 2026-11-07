---
name: ecommerce-product-card-ux
description: >-
  Optimize product cards and CTAs for e-commerce conversion. Use when the task involves positioning, sizing, feedback states, or reorganizing product cards and action buttons to maximize add-to-cart rate, reduce friction, and feel comfortable and intuitive across devices.
license: MIT
compatibility: opencode
---

# E-commerce Product Card UX Optimization

## Core Principles

1. **Scan speed first** — users decide in under 2 seconds whether to click
2. **Touch-friendly always** — 44×44px minimum, no hover-only interactions
3. **Feedback everywhere** — every tap/click shows immediate visual response
4. **Price is the anchor** — highest contrast, boldest weight, stable position
5. **One primary action per card** — never hide it behind hover

---

## Product Card Layout (priority order)

```
┌──────────────────────────┐
│                          │
│    PRODUCT IMAGE         │  ← 1. Dominant, consistent aspect ratio
│    (with optional zoom   │
│     on hover/click)      │
│                          │
├──────────────────────────┤
│  MARCA (teal, uppercase) │  ← 2. Brand/trust signal (small)
│  Nombre del Producto     │  ← 3. Name (bold, readable)
│                          │
│  $XX.XXX                 │  ← 4. PRICE (900 bold, orange, largest text)
│                          │
│  [−]  [0]  [+]           │  ← 5. Quantity selector (teal outline)
│                          │
│  [🛒 AGREGAR AL CARRITO] │  ← 6. CTA (gradient, full-width on mobile)
│                          │
│  ⭐ Stock: 12 unidades   │  ← 7. Trust/social proof (optional)
└──────────────────────────┘
```

## Card States

| State | Visual | Trigger |
|-------|--------|---------|
| **Default** | Normal shadow, white bg | Initial load |
| **Hover** | TranslateY(-4px), shadow-lg, slight scale(1.01) | Mouse hover |
| **Focus-visible** | Orange outline ring (3px) | Keyboard focus |
| **Active/Press** | Scale(0.98), no lift | Mousedown/touch |
| **In-cart** | Orange border, subtle pulse animation, subtotal shown | Item added |
| **Loading** | Skeleton shimmer (CSS only, no JS) | Image/data pending |
| **Out of stock** | Grayscale image, "Agotado" badge, muted CTA | Stock = 0 |

## CTA Button Hierarchy

| Level | Style | Placement | Size |
|-------|-------|-----------|------|
| **Primary** (Add to cart) | Gradient orange→yellow, white text, full-width on mobile | Below qty selector, inside card | 16px padding vertical, 24px on mobile |
| **Secondary** (WhatsApp consult) | Green gradient, full-width on mobile | Cart panel footer, below total | 16px padding vertical |
| **Tertiary** (View details) | Ghost/text button, no bg | Below price or as card link | 12px padding |
| **Icon-only** (±, remove, close) | Round 44×44px, teal outline for ±, red hover for remove | Inline with qty/cart | Fixed 44×44px circle |

## Quantity Selector Rules

- **Position**: Directly above CTA button, centered or left-aligned
- **Min size**: 44×44px buttons, 28px min-width for count text
- **State colors**: Teal for ± (default), Orange for count text
- **Hover**: Scale(1.1) on ± buttons, fill teal bg
- **Active**: Scale(0.9) on press
- **Edge case**: At 0 quantity, show only [+] (already in cart check)

## Cart Panel UX

- **Header**: Gradient header (orange→yellow) with white close button
- **Items**: White cards with orange left border, rounded corners, shadow
- **Each item**: Name, price, qty selector (same ± style), remove button
- **Footer**: Gradient bg, total on left, whatsapp CTA full-width
- **Animation**: Slide in from right (0.4s bounce), items popIn staggered
- **Empty state**: Centered text with emoji, "El carrito está vacío"
- **Scrollbar**: Custom thin orange scrollbar

## Checkout Float Bar

- **Visible only when cart has items**
- **Position**: Sticky bottom on mobile, floating bottom-right on desktop (260px max)
- **Animation**: Bounce in from below (translateY), spring curve
- **Content**: Total (bold orange), item count, WhatsApp CTA button
- **Desktop**: Column layout, shadow-lg + glow

## Responsive Card Grid

| Breakpoint | Columns | Card max-width | Notes |
|------------|---------|----------------|-------|
| < 480px | 1 | 100% | Stacked, CTA full-width |
| 480-768px | 2 | 50% | Compact, show qty inline |
| 768-1024px | 3 | 33% | Desktop comfort |
| > 1024px | 4 | 25% | Spacious layout |

## Accessibility Baseline

- All interactive elements have visible `:focus-visible` (orange 3px ring + 3px offset)
- Cart count has `aria-live="polite"` for screen reader updates
- Icon buttons MUST have `aria-label`
- Images MUST have `alt` text (product name)
- Skip-to-content link as first focusable element
- Touch targets ≥ 44×44px on mobile
- `prefers-reduced-motion` disables all animations
- Color is never the only differentiator (use text + icon)
- Search results area has `aria-live="polite"`

## Cart Feedback Micro-interactions

| Action | Feedback | Timing |
|--------|----------|--------|
| Add to cart | Card border glows orange, pulse animation, cart count +1 | Immediate |
| Quantity change | Subtotal updates inline, total in footer updates | Immediate |
| Remove item | Item slides out (fade + reduce), cart count -1 | 200ms |
| Cart open | Panel slides right with bounce curve | 400ms |
| Cart close | Panel slides right, overlay fades | 300ms |
| WhatsApp send | Opens in new tab with formatted message | On click |

## Common Anti-patterns to Avoid

❌ CTAs hidden behind hover (breaks mobile/keyboard)
❌ Tiny touch targets (< 44px) on quantity buttons
❌ Price in low-contrast gray (hard to scan)
❌ No visual feedback on add-to-cart (user unsure it worked)
❌ Cards without consistent height (layout shifts when filtering)
❌ Hover-only states (breaks keyboard and touch)
❌ Cluttered cards with too much info (decision paralysis)
❌ No empty state in cart (confusing when empty)
❌ Removing item without undo/recovery option
