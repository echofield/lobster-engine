# Studio Intelligence - Design Transformation Handoff

## Vision

Transform Studio Intelligence from a generic web app into a **professional instrument interface** with "quiet luxury" aesthetic. It should feel like operating a high-end piece of studio gear - precise, tactile, and premium without being flashy.

**Reference**: Lobster project design system (C:\Users\echof\Desktop\02_PROJECTS\Lobster)

---

## Design Philosophy

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Less is Presence** | Every element earns its place through restraint |
| **Instrument, Not App** | Interface feels like a physical artifact |
| **Breathing, Not Static** | Subtle animations (pulses, fades, drifts) |
| **Single Color Dominance** | One accent at varying opacities |
| **No Pure Black/White** | Warm tones throughout |

### What We're Moving Away From
- Generic dashboard aesthetic
- Flat, lifeless UI
- Standard component libraries look
- "Tech startup" feel

### What We're Moving Toward
- Studio equipment control surface feel
- Tactile, precise interactions
- Quiet confidence
- Professional tool for professionals

---

## Dependencies to Install

```bash
npm install motion@^12 class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-select
npm install @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-toggle
npm install sonner vaul cmdk
npm install -D @types/node
```

**Already installed**: lucide-react, tailwind-merge, clsx

---

## Color System

### Primary Palette

```css
:root {
  /* Backgrounds - Warm Paper */
  --background: #FAF8F2;
  --background-alt: #F5F3ED;
  --card: #FFFFFF;
  --muted: #F5F3ED;

  /* Text - Ink */
  --foreground: #1A1A1A;
  --foreground-muted: #6B6B6B;
  --foreground-light: #3C3C3C;

  /* Primary Accent - Deep Forest Green */
  --primary: #003D2C;
  --primary-light: #1A5C47;
  --primary-foreground: #FAFAFA;

  /* Secondary Accent - Gold */
  --gold: #A38767;
  --gold-light: #C4A882;
  --gold-muted: rgba(163, 135, 103, 0.15);

  /* Semantic */
  --destructive: #B54242;
  --success: #2D6A4F;

  /* Borders - Nearly Invisible */
  --border: rgba(26, 26, 26, 0.08);
  --border-light: rgba(26, 26, 26, 0.12);

  /* Shadows - Subtle */
  --shadow-subtle: rgba(26, 26, 26, 0.03);
  --shadow-medium: rgba(26, 26, 26, 0.06);

  /* Studio Cable Colors (keep for patchbay) */
  --cable-blue: #3B82F6;
  --cable-red: #EF4444;
  --cable-green: #22C55E;
  --cable-yellow: #EAB308;
  --cable-purple: #A855F7;
  --cable-orange: #F97316;
}
```

### Dark Mode (Studio Environment)

```css
.dark {
  --background: #0A0A0A;
  --background-alt: #141414;
  --card: #1A1A1A;
  --foreground: #FAFAFA;
  --foreground-muted: #A0A0A0;
  --border: rgba(255, 255, 255, 0.08);
}
```

---

## Typography System

### Fonts to Load

```tsx
// app/layout.tsx
import { Cormorant_Garamond, Inter } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-serif',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
})
```

### Type Scale

```css
/* Headings - Cormorant Garamond (Serif) */
.heading-display { font-size: 3.5rem; font-weight: 300; letter-spacing: -0.02em; }
.heading-1 { font-size: 2.875rem; font-weight: 400; letter-spacing: -0.02em; }
.heading-2 { font-size: 2rem; font-weight: 400; letter-spacing: -0.01em; }
.heading-3 { font-size: 1.5rem; font-weight: 400; }

/* Body - Inter (Sans) */
.body-large { font-size: 1.1875rem; font-weight: 400; letter-spacing: 0.02em; }
.body { font-size: 1.0625rem; font-weight: 400; letter-spacing: 0.02em; }
.body-small { font-size: 0.8125rem; font-weight: 400; }

/* Labels - Technical */
.label { font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; }
.micro { font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.08em; opacity: 0.6; }

/* Narrator - Guidance Text */
.narrator { font-family: var(--font-serif); font-style: italic; font-size: 0.8125rem; color: var(--gold); }
```

---

## Spacing Scale

```css
--space-tight: 0.5rem;   /* 8px - component internals */
--space-normal: 1rem;    /* 16px - element spacing */
--space-medium: 1.5rem;  /* 24px - section spacing */
--space-large: 2.5rem;   /* 40px - major spacing */
--space-xl: 4rem;        /* 64px - large divisions */
--space-2xl: 6rem;       /* 96px - page sections */
```

---

## Motion System

### Durations

```css
--duration-instant: 90ms;
--duration-fast: 200ms;
--duration-normal: 400ms;
--duration-slow: 800ms;
--duration-contemplative: 1200ms;
```

### Easings

```css
--ease-appear: cubic-bezier(0, 0, 0.2, 1);
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-dismiss: cubic-bezier(0.4, 0, 1, 1);
```

### Key Animations

```css
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.02); opacity: 1; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-soft {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 61, 44, 0.1); }
  50% { box-shadow: 0 0 40px rgba(0, 61, 44, 0.2); }
}
```

---

## Core Components to Create

### 1. Button Component

```tsx
// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-light",
        secondary: "bg-transparent border border-border hover:border-primary hover:text-primary",
        ghost: "hover:bg-background-alt",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        sm: "h-8 px-3 text-xs tracking-wide",
        default: "h-10 px-5 text-sm tracking-wide",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### 2. Card Component

```tsx
// src/components/ui/card.tsx
const Card = ({ className, ...props }) => (
  <div
    className={cn(
      "bg-card border border-border rounded-lg shadow-subtle",
      "hover:shadow-medium transition-shadow duration-300",
      className
    )}
    {...props}
  />
)
```

### 3. Badge Component

```tsx
// src/components/ui/badge.tsx
const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wider uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/20",
        secondary: "bg-muted text-foreground-muted",
        outline: "border border-border text-foreground-muted",
        // Cable colors for patchbay
        blue: "bg-cable-blue/10 text-cable-blue border border-cable-blue/20",
        red: "bg-cable-red/10 text-cable-red border border-cable-red/20",
        green: "bg-cable-green/10 text-cable-green border border-cable-green/20",
      },
    },
  }
)
```

### 4. Navigation Component

```tsx
// Redesigned nav - fixed, minimal, professional
<nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border">
  <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
    {/* Logo - Serif, understated */}
    <span className="font-serif text-lg tracking-tight">Studio Intelligence</span>

    {/* Links - Uppercase micro labels */}
    <div className="flex items-center gap-8">
      <NavLink>Gear</NavLink>
      <NavLink>Chains</NavLink>
      <NavLink>Patchbay</NavLink>
      <NavLink>Guide</NavLink>
    </div>

    {/* Language Toggle */}
    <LanguageToggle />
  </div>
</nav>
```

### 5. GearCard Redesign

```tsx
// Professional equipment card
<motion.div
  className="group relative bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-all duration-300"
  whileHover={{ y: -2 }}
>
  {/* Category Badge - Top right */}
  <Badge variant="outline" className="absolute top-4 right-4">
    {gear.category}
  </Badge>

  {/* Manufacturer - Micro label */}
  <span className="label text-foreground-muted">{gear.manufacturer}</span>

  {/* Model - Serif heading */}
  <h3 className="font-serif text-xl mt-1">{gear.model}</h3>

  {/* Signal Type Indicator */}
  <div className="mt-4 flex items-center gap-2">
    <div className={cn(
      "w-2 h-2 rounded-full",
      gear.signalType === 'analog' ? 'bg-gold' : 'bg-primary'
    )} />
    <span className="micro">{gear.signalType}</span>
  </div>

  {/* I/O Summary */}
  <div className="mt-4 pt-4 border-t border-border">
    <span className="label">I/O</span>
    <div className="mt-2 flex flex-wrap gap-1">
      {gear.io.map(port => (
        <span key={port} className="micro bg-muted px-2 py-1 rounded">
          {port}
        </span>
      ))}
    </div>
  </div>
</motion.div>
```

### 6. Signal Chain Visualizer

```tsx
// Vertical flow with connection lines
<div className="space-y-0">
  {chain.steps.map((step, i) => (
    <div key={step.id} className="relative">
      {/* Connection Line */}
      {i > 0 && (
        <div className="absolute left-6 -top-4 w-px h-4 bg-gradient-to-b from-border to-primary/30" />
      )}

      {/* Step Node */}
      <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
        {/* Step Number - Diamond */}
        <div className="w-12 h-12 rotate-45 border border-primary/30 flex items-center justify-center">
          <span className="-rotate-45 font-serif text-lg">{i + 1}</span>
        </div>

        {/* Step Content */}
        <div className="flex-1">
          <h4 className="font-medium">{step.equipment}</h4>
          <p className="text-sm text-foreground-muted mt-1">{step.action}</p>

          {/* Patch Points */}
          <div className="mt-2 flex gap-2">
            <Badge variant="outline">{step.from}</Badge>
            <span className="text-foreground-muted">→</span>
            <Badge variant="outline">{step.to}</Badge>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
```

---

## Page Layouts

### Dashboard (Home)

```
┌─────────────────────────────────────────────────────────┐
│  [Nav Bar - Fixed]                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│           STUDIO INTELLIGENCE                           │
│           ─────────────────                             │
│           Signal routing for the modern studio          │
│                                                         │
│                    ◆                                    │
│                                                         │
│        [Gear]    [Chains]    [Patchbay]                │
│                                                         │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Quick Start │  │ Recent      │  │ Favorites   │     │
│  │ Cards       │  │ Chains      │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Gear Page

```
┌─────────────────────────────────────────────────────────┐
│  Equipment                                              │
│  ──────────                                             │
│  24 pieces in the studio                                │
│                                                         │
│  [Search................................] [Category ▼]  │
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐           │
│  │ STUDER    │  │ NEVE      │  │ BURL      │           │
│  │ 269       │  │ 1073      │  │ B2        │           │
│  │ ◆ Analog  │  │ ◆ Analog  │  │ ◆ Digital │           │
│  └───────────┘  └───────────┘  └───────────┘           │
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐           │
│  │ ...       │  │ ...       │  │ ...       │           │
│  └───────────┘  └───────────┘  └───────────┘           │
└─────────────────────────────────────────────────────────┘
```

### Patchbay Field (Simplified)

```
┌─────────────────────────────────────────────────────────┐
│  Patchbay                                               │
│  ────────                                               │
│  Signal routing visualization                           │
│                                                         │
│        [Grid View]  [Field View]  [List View]           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │     ○ ○ ○ ○ ○ ○ ○ ○    Bay 1 - AD/DA            │   │
│  │     ○ ○ ○ ○ ○ ○ ○ ○    Bay 2 - Inputs           │   │
│  │     ○ ○ ○ ○ ○ ○ ○ ○    Bay 3 - Inserts          │   │
│  │     ○ ○ ○ ○ ○ ○ ○ ○    Bay 4 - Gear I/O         │   │
│  │     ○ ○ ○ ○ ○ ○ ○ ○    Bay 5 - Studer           │   │
│  │     ○ ○ ○ ○ ○ ○ ○ ○    Bay 6 - Aux              │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Selected: Lynx Aurora OUT 1-2                          │
│  Available connections: [Studer CH1] [Burl IN] [...]    │
└─────────────────────────────────────────────────────────┘
```

---

## Decorative Elements

### Corner Marks

```tsx
// Registration marks - print aesthetic
const CornerMark = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => (
  <div className={cn(
    "fixed w-8 h-8 pointer-events-none opacity-[0.08]",
    position === 'tl' && 'top-4 left-4',
    position === 'tr' && 'top-4 right-4',
    position === 'bl' && 'bottom-4 left-4',
    position === 'br' && 'bottom-4 right-4',
  )}>
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <path d="M0 8 L0 0 L8 0" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M24 0 L32 0 L32 8" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  </div>
)
```

### Diamond Dividers

```tsx
const DiamondDivider = () => (
  <div className="flex items-center justify-center gap-4 py-8">
    <div className="flex-1 h-px bg-border" />
    <div className="w-2 h-2 rotate-45 border border-border" />
    <div className="flex-1 h-px bg-border" />
  </div>
)
```

---

## File Structure

```
src/
├── components/
│   ├── ui/                    # Base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   └── dialog.tsx
│   │
│   ├── layout/               # Layout components
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── PageHeader.tsx
│   │   └── CornerMarks.tsx
│   │
│   ├── gear/                 # Gear-specific
│   │   ├── GearCard.tsx
│   │   ├── GearGrid.tsx
│   │   └── GearDetail.tsx
│   │
│   ├── chains/               # Chain-specific
│   │   ├── ChainCard.tsx
│   │   ├── ChainVisualizer.tsx
│   │   └── ChainStep.tsx
│   │
│   └── patchbay/             # Patchbay-specific
│       ├── PatchbayGrid.tsx
│       ├── PatchbayField.tsx
│       ├── PatchNode.tsx
│       └── CableConnection.tsx
│
├── lib/
│   ├── utils.ts              # cn() helper, etc.
│   └── motion.ts             # Animation presets
│
└── styles/
    └── tokens.css            # Design tokens
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Install dependencies
- [ ] Set up design tokens in globals.css
- [ ] Configure fonts (Cormorant Garamond + Inter)
- [ ] Create `cn()` utility function
- [ ] Create base UI components (Button, Card, Badge, Input)

### Phase 2: Layout
- [ ] Redesign Navigation component
- [ ] Add CornerMarks decorative element
- [ ] Create PageHeader component
- [ ] Update layout.tsx with new fonts and theme

### Phase 3: Gear Section
- [ ] Redesign GearCard with new aesthetic
- [ ] Update gear list page
- [ ] Update gear detail page
- [ ] Add hover animations

### Phase 4: Chains Section
- [ ] Create ChainVisualizer component
- [ ] Redesign chain list page
- [ ] Update chain detail with step flow

### Phase 5: Patchbay
- [ ] Create PatchbayGrid (accurate layout)
- [ ] Add PatchNode interactive component
- [ ] Implement cable visualization
- [ ] Add selection/connection UI

### Phase 6: Polish
- [ ] Add page transitions (Motion)
- [ ] Implement breathing animations
- [ ] Add loading states
- [ ] Test dark mode
- [ ] Mobile responsiveness

---

## Key Motion Patterns

```tsx
// Fade up on mount
const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

// Stagger children
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

// Hover lift
const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 }
}

// Breathing pulse (for active states)
const breathe = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 2, repeat: Infinity }
  }
}
```

---

## Summary

This transformation takes Studio Intelligence from a generic web app to a **professional instrument interface**. The Lobster design system provides the foundation:

- **Warm, paper-like backgrounds** instead of stark whites
- **Deep green + gold accents** for a premium, timeless feel
- **Serif headings** for editorial elegance
- **Micro labels** for technical precision
- **Subtle animations** that breathe life without distraction
- **Diamond shapes and corner marks** for visual identity

The result should feel like opening a luxury equipment manual or operating a piece of high-end studio gear - precise, confident, and built to last.

---

*Handoff created: 2026-03-20*
*Reference project: Lobster (C:\Users\echof\Desktop\02_PROJECTS\Lobster)*
