# Performance Quick Reference Card

## 🎯 Quick Wins (Copy & Paste)

### 1. Debounce Search/Input
```javascript
import { debounce } from './performanceUtils.js';

// Before
input.addEventListener('input', handleInput);

// After
input.addEventListener('input', debounce(handleInput, 150));
```

### 2. Batch DOM Updates
```javascript
import { batchDOMUpdates } from './performanceUtils.js';

// Before
items.forEach(item => {
  const el = createEl(item);
  container.appendChild(el); // 100 reflows!
});

// After
const fragment = document.createDocumentFragment();
items.forEach(item => {
  const el = createEl(item);
  fragment.appendChild(el);
});
container.appendChild(fragment); // 1 reflow!
```

### 3. GPU-Accelerated CSS
```css
/* Always use transform instead of position */
.element:hover {
  transform: translateY(-3px) translateZ(0); /* GPU */
  will-change: transform;
}

/* ❌ Avoid */
.element:hover {
  top: -3px; /* CPU, triggers reflow */
}
```

### 4. Object Pooling for Particles
```javascript
import { createObjectPool } from './performanceUtils.js';

const particlePool = createObjectPool(
  () => new Particle(), // Creator
  (p) => p.reset()      // Resetter
);

// Use
const p = particlePool.acquire();
// ... use particle ...
particlePool.release(p); // Return to pool
```

### 5. Throttle localStorage
```javascript
import { createThrottledStorage } from './performanceUtils.js';

const saveScore = createThrottledStorage('game:score', 1000);

function updateScore(points) {
  score += points;
  saveScore(score); // Writes at most once per second
}
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Don't
```javascript
// Reading and writing DOM in same loop
items.forEach(item => {
  const height = element.offsetHeight; // Read (reflow)
  element.style.height = height + 'px'; // Write (reflow)
});

// Creating new objects every frame
function gameLoop() {
  const particle = new Particle(); // Memory leak!
}

// Spamming localStorage
function everyFrame() {
  localStorage.setItem('key', value); // Slow!
}
```

### ✅ Do
```javascript
// Batch reads, then batch writes
const heights = items.map(item => element.offsetHeight);
items.forEach((item, i) => {
  element.style.height = heights[i] + 'px';
});

// Reuse objects
const particlePool = [];
function gameLoop() {
  const particle = particlePool.pop() || new Particle();
}

// Throttle writes
const saveThrottled = throttle(() => {
  localStorage.setItem('key', value);
}, 1000);
```

---

## 🎨 Canvas Performance Tips

```javascript
// ✅ Pre-calculate constants
const TWO_PI = Math.PI * 2;
const HALF_SIZE = size / 2;

// ✅ Round positions to integers
ctx.fillRect(Math.floor(x), Math.floor(y), width, height);

// ✅ Batch draw calls by style
ctx.fillStyle = 'red';
redObjects.forEach(obj => ctx.fillRect(obj.x, obj.y, 10, 10));

ctx.fillStyle = 'blue';
blueObjects.forEach(obj => ctx.fillRect(obj.x, obj.y, 10, 10));

// ✅ Use layers (multiple canvases)
const bgCanvas = document.getElementById('bg');
const gameCanvas = document.getElementById('game');
const uiCanvas = document.getElementById('ui');

// Only redraw what changed
function drawUI() {
  uiCtx.clearRect(0, 0, width, 50);
  uiCtx.fillText(`Score: ${score}`, 10, 30);
}

// ❌ Don't change state in loops
enemies.forEach(e => {
  ctx.fillStyle = e.color; // State change every iteration!
  ctx.fillRect(e.x, e.y, 10, 10);
});
```

---

## 🔄 Game Loop Pattern

```javascript
import { createGameLoop } from './performanceUtils.js';

let lastTime = 0;
const FPS = 60;
const FRAME_TIME = 1000 / FPS;

const { start, stop } = createGameLoop(() => {
  const now = performance.now();
  const delta = now - lastTime;
  
  if (delta >= FRAME_TIME) {
    update(delta);
    render();
    lastTime = now;
  }
});

// Auto-pauses when tab hidden
start();

// Cleanup
function cleanup() {
  stop();
}
```

---

## 🧹 Memory Cleanup

```javascript
class Game {
  constructor() {
    this.timers = [];
    this.listeners = [];
  }
  
  addTimer(timer) {
    this.timers.push(timer);
  }
  
  addListener(target, event, handler) {
    target.addEventListener(event, handler);
    this.listeners.push({ target, event, handler });
  }
  
  destroy() {
    // Clear timers
    this.timers.forEach(t => {
      clearInterval(t);
      clearTimeout(t);
    });
    
    // Remove listeners
    this.listeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    
    // Clear arrays
    this.bugs = [];
    this.particles = [];
    
    // Nullify references
    this.canvas = null;
    this.ctx = null;
  }
}
```

---

## 📱 Mobile Optimizations

```javascript
// Passive listeners for scroll performance
element.addEventListener('touchstart', handler, { passive: true });

// Cap device pixel ratio
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;
ctx.scale(dpr, dpr);

// Detect reduced motion preference
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
  // Show animations
}
```

---

## 🔍 Debug Performance

```javascript
// FPS Counter
import { createFPSCounter } from './performanceUtils.js';

const stopFPS = createFPSCounter((fps) => {
  console.log('FPS:', fps);
  if (fps < 30) console.warn('⚠️ Low FPS detected!');
});

// Profile function
import { profile } from './performanceUtils.js';

const result = profile('expensiveFunction', () => {
  // ... expensive code ...
});

// Memory check
if (performance.memory) {
  const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
  console.log('Memory used:', used, 'MB');
}
```

---

## 📊 Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| FPS | 60 | < 30 |
| Frame time | < 16ms | > 50ms |
| Memory (5min) | < 100MB | > 200MB |
| Initial load | < 2s | > 5s |
| Input lag | < 100ms | > 300ms |

---

## 🚀 Pre-Launch Checklist

- [ ] No console errors/warnings
- [ ] 60fps on target device
- [ ] Memory stable after 5 minutes
- [ ] All event listeners cleaned up
- [ ] No memory leaks (DevTools Heap)
- [ ] Images optimized/compressed
- [ ] localStorage throttled
- [ ] Canvas cleared properly
- [ ] Animations use transform/opacity
- [ ] Mobile tested (touch events)

---

## 💡 Pro Tips

1. **Measure Before Optimizing**
   - Use Chrome DevTools Performance tab
   - Record 5-second clip during gameplay
   - Look for long tasks (> 50ms)

2. **Optimize the Bottleneck**
   - Find the slowest part first
   - 80/20 rule: 80% of lag from 20% of code

3. **Test on Low-End Devices**
   - 3-year-old laptop
   - Budget tablet
   - Mobile phone

4. **Use Source Maps in Production**
   - Debug minified code easily
   - Keep them in separate .map files

5. **Monitor in Production**
   - Track FPS analytics
   - Log slow functions
   - User feedback on performance

---

**Quick Reference v1.0 - January 19, 2026**
