# VAPOR Particle Debug Guide

## Current Issue
User reports: "don't see the particles still"

## What Should Happen
1. Navigate to http://localhost:3111/vapor
2. Click "Initialize" button
3. Click purple play button (or press A-K keys)
4. **Beautiful purple particles should float across the canvas with trailing motion**

## Quick Debug Steps

### Step 1: Check Browser Console
1. Open http://localhost:3111/vapor
2. Press **F12** to open DevTools
3. Click **Console** tab
4. Look for these messages:
   - `[VAPOR] Init error:` ← BAD, means initialization failed
   - `[LyriaStream] Connected` ← GOOD, backend connected
   - `[Particle] Spawned #1 at (x, y) size=N` ← GOOD, particles creating

### Step 2: Test Particle Spawning
1. After clicking "Initialize", you should see a **"TEST"** button next to the play button
2. Click **"TEST"** button
3. Watch console for: `[DEBUG] Spawning 20 test particles`
4. Watch console for: `[Particle] Spawned #1 at...` (20 times)
5. Watch canvas for particle count overlay: `Particles: 20` (top-left corner)

**If you see "Particles: 20" but NO visual particles:**
- Canvas is rendering
- Particles are being tracked
- Problem is in the drawing code (gradient, opacity, or color)

**If you see NO "Particles:" text at all:**
- Canvas is not rendering
- Animation loop not running
- Problem is in initialization

### Step 3: Verify Canvas Rendering
Open console and run:
```javascript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';
ctx.fillRect(100, 100, 200, 200);
```

**Should see:** Big red square on canvas
**If not:** Canvas element issue or z-index problem

### Step 4: Check Canvas Dimensions
Open console and run:
```javascript
const canvas = document.querySelector('canvas');
console.log('Canvas size:', canvas.width, 'x', canvas.height);
console.log('Canvas offset:', canvas.offsetWidth, 'x', canvas.offsetHeight);
```

**Should see:** `Canvas size: 800 x 500` (or similar)
**If `0 x 0`:** Canvas not initializing properly

### Step 5: Force Particle Spawn on Timer
Add this to the code (temporarily) in `initEngines` function:
```typescript
// After startAnimation()
setInterval(() => {
  spawnParticle(0.5, 0.5, 0.5, 0);
  console.log('Force spawning particle at center');
}, 200);
```

Should spawn particle at canvas center every 200ms.

## Likely Issues & Fixes

### Issue 1: Canvas Not Visible (Z-Index)
**Symptom:** Red square test doesn't show
**Fix:** Add to canvas style:
```typescript
style={{
  background: 'var(--background)',
  position: 'relative',
  zIndex: 1
}}
```

### Issue 2: Particles Fading Too Fast
**Symptom:** Particles spawn (console shows) but disappear instantly
**Fix:** Reduce fade rate:
```typescript
// In animate() loop
ctx.fillStyle = 'rgba(250, 248, 242, 0.02)'; // Was 0.15
```

### Issue 3: Particles Too Small/Transparent
**Symptom:** Particles spawn but barely visible
**Fix:** Increase size/opacity:
```typescript
size: 60 + size * 60,  // Was 20 + size * 40
opacity: 1.0,
// In gradient:
gradient.addColorStop(0, `hsla(${p.hue}, 70%, 60%, 1.0)`); // Full opacity
```

### Issue 4: Wrong Color (Blending with Background)
**Symptom:** Particles might be cream on cream
**Fix:** Test with solid bright color first:
```typescript
// Replace gradient drawing with:
ctx.fillStyle = 'rgba(255, 0, 255, 0.8)'; // Bright magenta
ctx.beginPath();
ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
ctx.fill();
```

### Issue 5: Animation Loop Not Running
**Symptom:** No "Particles:" counter, no console logs
**Fix:** Check if `startAnimation()` was called:
```typescript
// Add in initEngines():
console.log('[VAPOR] Starting animation loop');
startAnimation();
console.log('[VAPOR] Animation loop started');
```

## Nuclear Option: Simplified Particle Test

Replace the entire `animate()` function with this minimal version:

```typescript
const animate = () => {
  if (!canvas || !ctx) return;

  // Simple clear
  ctx.fillStyle = '#FAF8F2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw ALL particles as bright pink circles
  particlesRef.current.forEach(p => {
    ctx.fillStyle = 'rgba(255, 0, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Update
    p.x += p.vx;
    p.y += p.vy;
  });

  // Show count
  ctx.fillStyle = 'black';
  ctx.font = '20px monospace';
  ctx.fillText(`Particles: ${particlesRef.current.length}`, 10, 30);

  animationRef.current = requestAnimationFrame(animate);
};
```

If you see bright pink circles → Problem was in gradient/opacity logic
If you still see nothing → Problem is canvas rendering or loop execution

## Expected Behavior After Fix

1. Click "Initialize" → See canvas with particle count "Particles: 0"
2. Click "TEST" → Count jumps to "Particles: 20", see 20 purple circles spawn
3. Circles float and fade over 3-5 seconds
4. Click play button → Continuous particle generation
5. Press A-K keys → More particles spawn, pitch varies color (purple spectrum)

## Files to Check

- `src/app/vapor/page.tsx` (lines 120-170) - Animation loop
- `src/app/vapor/page.tsx` (lines 93-112) - Particle spawn
- `src/lib/vapor-engine.ts` (lines 182-235) - Grain spawn callback

## Console Commands for Debug

```javascript
// Check if engine initialized
vaporRef.current?.isReady()

// Check if playing
vaporRef.current?.isActive()

// Get current params
vaporRef.current?.getParams()

// Force spawn grain
vaporRef.current?.spawnGrain()

// Count particles
particlesRef.current.length

// Inspect first particle
particlesRef.current[0]
```

## Next Claude Session: Start Here

1. Read this file
2. Read VAPOR_LYRIA_HANDOFF.md
3. Open browser to http://localhost:3111/vapor
4. Click "Initialize" then "TEST"
5. Check console for particle logs
6. Report what you see (or don't see)
7. Follow debug steps above

**Goal:** Get visual confirmation of floating particles on canvas.

---

Generated: 2026-03-19
Status: Debugging particle visibility
