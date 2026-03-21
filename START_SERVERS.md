# Start VAPOR + Lyria Servers

## Quick Start (2 Terminals)

### Terminal 1 - Backend
```bash
cd C:\Users\echof\Desktop\02_PROJECTS\studio-intelligence\backend
python main.py
```

**Expected:** Server starts on port 3112

### Terminal 2 - Frontend
```bash
cd C:\Users\echof\Desktop\02_PROJECTS\studio-intelligence
npm run dev
```

**Expected:** Next.js starts on port 3000 (NEW PORT!)

---

## URLs

- **Frontend:** http://localhost:3000
- **Canvas Test:** http://localhost:3000/test-canvas (NEW - simple test page)
- **VAPOR:** http://localhost:3000/vapor
- **Backend:** http://localhost:3112

---

## Testing Steps (Do in Order!)

### 1. Pure HTML Test (Bypasses React/Next.js)
Navigate to: **http://localhost:3000/canvas-test.html**

**You should see:**
- ✅ Red, green, blue squares at top
- ✅ Yellow circle
- ✅ Purple text "CANVAS WORKS!"

**If this FAILS:** Browser issue or canvas disabled
**If this WORKS:** Next.js/React issue

### 2. Simple React Canvas Test
Navigate to: **http://localhost:3000/canvas-simple**

**You should see:**
- ✅ Red square
- ✅ Blue circle
- ✅ "IT WORKS!" text

**If HTML worked but this fails:** React/Next.js CSP issue
**If this works:** VAPOR-specific code issue

### 3. Advanced Canvas Test
Navigate to: **http://localhost:3000/test-canvas**

**You should see:**
- ✅ Animated bouncing purple ball
- ✅ Red, blue, green squares
- ✅ Purple circle

**If simple worked but this fails:** Animation/state issue

### 2. Test VAPOR
1. Navigate to: **http://localhost:3000/vapor**
2. Click "Initialize"
3. Click "TEST" button
4. Should see particles

### 3. Test Polyphony
1. Press multiple keys: A + D + G (C major chord)
2. Should play simultaneously
3. Release one key at a time - notes stop independently

### 4. Test MIDI
1. Connect MIDI keyboard
2. Refresh page, click "Initialize"
3. Look for MIDI device name in top-right
4. Play chords on MIDI keyboard

---

## Troubleshooting

### Canvas Test Fails
- CSP still blocking
- Check browser console for errors
- Try different browser (Chrome/Edge/Firefox)

### Canvas Test Works, VAPOR Doesn't
- Issue in particle spawning logic
- Check console for particle spawn logs

### MIDI Not Detected
- Check MIDI cable connection
- Restart browser after connecting MIDI
- Some browsers require HTTPS for MIDI (use Edge/Chrome on localhost)

---

## Port Changes
- Frontend changed from **3111 → 3000**
- Backend stays on **3112**
- CORS and CSP updated accordingly
