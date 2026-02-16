// performanceUtils.js - Shared performance utilities for Play Box

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function to ensure function is called at most once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request animation frame with auto-stop on hidden
 * @param {Function} callback - Animation loop function
 * @returns {Function} Stop function
 */
export function createGameLoop(callback) {
  let rafId;
  let running = false;

  function loop() {
    if (!running) return;
    callback();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  // Auto-pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else if (running) {
      start();
    }
  });

  return { start, stop };
}

/**
 * Object pool for reusing objects instead of creating new ones
 * @param {Function} creator - Function that creates new objects
 * @param {Function} resetter - Function that resets object state
 * @returns {Object} Pool API
 */
export function createObjectPool(creator, resetter) {
  const pool = [];

  return {
    acquire() {
      return pool.pop() || creator();
    },
    release(obj) {
      resetter(obj);
      pool.push(obj);
    },
    clear() {
      pool.length = 0;
    },
    size() {
      return pool.length;
    },
  };
}

/**
 * Batch DOM updates to minimize reflows
 * @param {Array} items - Items to render
 * @param {Function} renderer - Function that creates DOM element for item
 * @returns {DocumentFragment} Fragment with all elements
 */
export function batchDOMUpdates(items, renderer) {
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const el = renderer(item);
    if (el) fragment.appendChild(el);
  });
  return fragment;
}

/**
 * Check if element is in viewport (for lazy rendering)
 * @param {HTMLElement} el - Element to check
 * @param {number} margin - Extra margin in pixels
 * @returns {boolean} True if in viewport
 */
export function isInViewport(el, margin = 0) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top < window.innerHeight + margin &&
    rect.bottom > -margin &&
    rect.left < window.innerWidth + margin &&
    rect.right > -margin
  );
}

/**
 * Memoize expensive function results
 * @param {Function} fn - Function to memoize
 * @returns {Function} Memoized function
 */
export function memoize(fn) {
  const cache = new Map();
  return function memoized(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * FPS counter for debugging
 * @param {Function} callback - Called with FPS value every second
 * @returns {Function} Stop function
 */
export function createFPSCounter(callback) {
  let frames = 0;
  let lastTime = performance.now();
  let rafId;

  function count() {
    frames++;
    const now = performance.now();
    if (now >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (now - lastTime));
      callback(fps);
      frames = 0;
      lastTime = now;
    }
    rafId = requestAnimationFrame(count);
  }

  count();

  return () => cancelAnimationFrame(rafId);
}

/**
 * Optimized collision detection with spatial hashing
 * @param {number} cellSize - Size of grid cells
 * @returns {Object} Spatial hash API
 */
export function createSpatialHash(cellSize = 50) {
  const grid = new Map();

  function getKey(x, y) {
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    return `${cellX},${cellY}`;
  }

  return {
    clear() {
      grid.clear();
    },
    insert(obj, x, y) {
      const key = getKey(x, y);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(obj);
    },
    queryRadius(x, y, radius) {
      const results = [];
      const cells = Math.ceil(radius / cellSize);
      
      for (let dx = -cells; dx <= cells; dx++) {
        for (let dy = -cells; dy <= cells; dy++) {
          const key = getKey(x + dx * cellSize, y + dy * cellSize);
          if (grid.has(key)) {
            results.push(...grid.get(key));
          }
        }
      }
      
      return results;
    },
  };
}

/**
 * Throttled localStorage write
 * @param {string} key - Storage key
 * @param {number} delay - Delay in ms
 * @returns {Function} Write function
 */
export function createThrottledStorage(key, delay = 1000) {
  let timer;
  let pending = null;

  return function write(data) {
    pending = data;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (pending !== null) {
        try {
          localStorage.setItem(key, JSON.stringify(pending));
          pending = null;
        } catch (e) {
          console.warn('localStorage write failed:', e);
        }
      }
    }, delay);
  };
}

/**
 * Optimized canvas clear for specific region
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} w - Width
 * @param {number} h - Height
 */
export function clearRect(ctx, x, y, w, h) {
  // Use clearRect when possible, save/restore for complex clipping
  ctx.clearRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

/**
 * Preload images and return promises
 * @param {Array<string>} urls - Image URLs to preload
 * @returns {Promise<Array<HTMLImageElement>>} Loaded images
 */
export async function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        })
    )
  );
}

/**
 * Safe remove event listener (prevents errors if already removed)
 * @param {EventTarget} target - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 */
export function safeRemoveEventListener(target, event, handler, options) {
  try {
    target?.removeEventListener(event, handler, options);
  } catch (e) {
    // Already removed or invalid
  }
}

/**
 * Create event listener that auto-removes after N calls
 * @param {EventTarget} target - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {number} maxCalls - Maximum number of calls
 * @param {Object} options - Event options
 */
export function addOnceAfterN(target, event, handler, maxCalls = 1, options) {
  let count = 0;
  const wrapper = (e) => {
    count++;
    handler(e);
    if (count >= maxCalls) {
      safeRemoveEventListener(target, event, wrapper, options);
    }
  };
  target.addEventListener(event, wrapper, options);
}

/**
 * Batch read DOM properties to minimize reflows
 * @param {Array<Function>} readers - Array of functions that read DOM
 * @returns {Array} Results from readers
 */
export function batchRead(readers) {
  // All reads happen together, triggering only one reflow
  return readers.map((fn) => fn());
}

/**
 * Batch write DOM properties to minimize reflows
 * @param {Array<Function>} writers - Array of functions that write DOM
 */
export function batchWrite(writers) {
  requestAnimationFrame(() => {
    writers.forEach((fn) => fn());
  });
}

/**
 * Check if reduced motion is preferred
 * @returns {boolean} True if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Smooth scroll to element with custom easing
 * @param {HTMLElement} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
export function smoothScrollTo(element, options = {}) {
  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
    offset = 0,
  } = options;
  
  if (!element) return;
  
  // Respect user preferences
  if (prefersReducedMotion()) {
    element.scrollIntoView({ behavior: 'auto', block, inline });
    return;
  }
  
  // Use native smooth scrolling
  if (offset === 0) {
    element.scrollIntoView({ behavior, block, inline });
    return;
  }
  
  // Custom offset scrolling
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: behavior,
  });
}

/**
 * Smooth scroll with easing animation (for more control)
 * @param {number} targetY - Target scroll position
 * @param {number} duration - Animation duration in ms
 * @param {Function} easing - Easing function
 */
export function animateScroll(targetY, duration = 500, easing = easeInOutCubic) {
  const startY = window.pageYOffset;
  const difference = targetY - startY;
  const startTime = performance.now();
  
  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    
    window.scrollTo(0, startY + difference * easedProgress);
    
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  
  requestAnimationFrame(step);
}

// Easing functions
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t) {
  return t * (2 - t);
}

/**
 * Get optimized device pixel ratio (cap at 2 for performance)
 * @param {number} max - Maximum DPR to use
 * @returns {number} Capped device pixel ratio
 */
export function getOptimizedDPR(max = 2) {
  return Math.min(window.devicePixelRatio || 1, max);
}

/**
 * Simple profiler for measuring function execution time
 * @param {string} name - Profile name
 * @param {Function} fn - Function to profile
 * @returns {*} Function result
 */
export function profile(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[Profile] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// Export all utilities as default object as well
export default {
  debounce,
  throttle,
  createGameLoop,
  createObjectPool,
  batchDOMUpdates,
  isInViewport,
  memoize,
  createFPSCounter,
  createSpatialHash,
  createThrottledStorage,
  clearRect,
  preloadImages,
  safeRemoveEventListener,
  addOnceAfterN,
  batchRead,
  batchWrite,
  prefersReducedMotion,
  smoothScrollTo,
  animateScroll,
  getOptimizedDPR,
  profile,
};
