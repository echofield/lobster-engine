# Canvas Test Instructions - ISOLATED TEST

## ⚠️ IMPORTANT: Close ALL Browser Tabs First!

Those errors (op-ra.vercel.app, GameScene, MRRTicker) are from **another project** that's cached or still open.

### Before Testing:
1. **Close ALL browser tabs** for localhost:3000
2. **Clear browser cache** (Ctrl+Shift+Delete → Cached images and files)
3. **Close DevTools** if open
4. **Restart browser** (optional but recommended)

---

## Server Setup

### Terminal 1 - Start Frontend
```bash
cd C:\Users\echof\Desktop\02_PROJECTS\studio-intelligence
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

---

## Testing

### Navigate to ISOLATED TEST:
```
http://localhost:3000/isolated-test
```

**This page:**
- ✅ No global Navigation component
- ✅ No other projects loaded
- ✅ Completely isolated
- ✅ No interference

---

## What You Should See

### ✅ SUCCESS - Canvas Working:
- **3 colored squares** at top (red, green, blue)
- **3 colored circles** in middle (yellow with orange border, purple, pink)
- **Black text** "✅ CANVAS WORKS!" at bottom
- Info text describing what you should see

### ❌ FAIL - Canvas Not Working:
- Blank white rectangle with border
- No colors, shapes, or text inside
- Alert popup saying "Failed to get canvas 2D context"

---

## Browser Check

If canvas doesn't work, check:

1. **Which browser?** (Chrome, Edge, Firefox, Safari?)
2. **Hardware acceleration enabled?**
   - Chrome/Edge: `chrome://settings/system` → Enable "Use hardware acceleration"
   - Firefox: `about:preferences` → Performance → Uncheck "Use recommended performance settings"
3. **Canvas blocked by extension?** (Try incognito/private mode)
4. **GPU/graphics drivers updated?**

---

## Report Back

Tell me:
1. ✅ or ❌ - Did you see the colored shapes and text?
2. What browser are you using?
3. Any errors in console (F12)?

---

## What This Tells Us

**If isolated-test WORKS:**
→ Canvas is fine, VAPOR particle code has a bug

**If isolated-test FAILS:**
→ Canvas is blocked by browser/system, not a code issue

---

## Alternative: Pure HTML Test

If React test fails, try pure HTML (no React/Next.js):
```
http://localhost:3000/canvas-test.html
```

This bypasses ALL JavaScript frameworks.
