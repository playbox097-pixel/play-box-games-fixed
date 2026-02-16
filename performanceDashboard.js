// performanceDashboard.js - Optional FPS/Memory monitor for development

/**
 * Performance Dashboard - Shows real-time FPS and memory usage
 * Only enable in development mode
 * 
 * Usage:
 * import { enablePerformanceDashboard } from './performanceDashboard.js';
 * if (location.hostname === 'localhost') {
 *   enablePerformanceDashboard();
 * }
 */

let dashboard = null;
let isEnabled = false;

export function enablePerformanceDashboard() {
  if (isEnabled || dashboard) return;
  
  // Create dashboard UI
  dashboard = document.createElement('div');
  dashboard.id = 'perf-dashboard';
  dashboard.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: #0f0;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    padding: 10px;
    border-radius: 5px;
    z-index: 999999;
    min-width: 200px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    user-select: none;
  `;
  
  dashboard.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px; color: #0ff;">⚡ Performance Monitor</div>
    <div id="perf-fps">FPS: --</div>
    <div id="perf-frame-time">Frame: -- ms</div>
    <div id="perf-memory">Memory: -- MB</div>
    <div id="perf-dom">DOM Nodes: --</div>
    <div id="perf-listeners">Listeners: --</div>
    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #333;">
      <div id="perf-status" style="font-weight: bold;">✅ Smooth</div>
    </div>
  `;
  
  document.body.appendChild(dashboard);
  isEnabled = true;
  
  // Start monitoring
  startMonitoring();
}

export function disablePerformanceDashboard() {
  if (!isEnabled || !dashboard) return;
  
  dashboard.remove();
  dashboard = null;
  isEnabled = false;
  stopMonitoring();
}

let monitoringInterval = null;
let fpsData = {
  frames: 0,
  lastTime: performance.now(),
  fps: 60,
  frameTime: 0,
};

function startMonitoring() {
  let rafId;
  
  // FPS counter using RAF
  function countFrame() {
    fpsData.frames++;
    rafId = requestAnimationFrame(countFrame);
  }
  countFrame();
  
  // Update dashboard every 500ms
  monitoringInterval = setInterval(() => {
    const now = performance.now();
    const elapsed = now - fpsData.lastTime;
    fpsData.fps = Math.round((fpsData.frames * 1000) / elapsed);
    fpsData.frameTime = elapsed / fpsData.frames;
    fpsData.frames = 0;
    fpsData.lastTime = now;
    
    updateDashboard();
  }, 500);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
    stopMonitoring();
  });
}

function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

function updateDashboard() {
  if (!dashboard) return;
  
  const { fps, frameTime } = fpsData;
  
  // FPS
  const fpsEl = dashboard.querySelector('#perf-fps');
  if (fpsEl) {
    fpsEl.textContent = `FPS: ${fps}`;
    fpsEl.style.color = fps >= 55 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00';
  }
  
  // Frame time
  const frameEl = dashboard.querySelector('#perf-frame-time');
  if (frameEl) {
    frameEl.textContent = `Frame: ${frameTime.toFixed(2)} ms`;
    frameEl.style.color = frameTime < 20 ? '#0f0' : frameTime < 35 ? '#ff0' : '#f00';
  }
  
  // Memory (if available)
  const memEl = dashboard.querySelector('#perf-memory');
  if (memEl && performance.memory) {
    const mb = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
    memEl.textContent = `Memory: ${mb} MB`;
    memEl.style.color = mb < 100 ? '#0f0' : mb < 200 ? '#ff0' : '#f00';
  }
  
  // DOM nodes
  const domEl = dashboard.querySelector('#perf-dom');
  if (domEl) {
    const nodes = document.getElementsByTagName('*').length;
    domEl.textContent = `DOM Nodes: ${nodes}`;
    domEl.style.color = nodes < 1000 ? '#0f0' : nodes < 2000 ? '#ff0' : '#f00';
  }
  
  // Event listeners (approximate)
  const listenerEl = dashboard.querySelector('#perf-listeners');
  if (listenerEl) {
    const estimate = getEventListenerCount();
    listenerEl.textContent = `Listeners: ~${estimate}`;
  }
  
  // Overall status
  const statusEl = dashboard.querySelector('#perf-status');
  if (statusEl) {
    if (fps >= 55 && frameTime < 20) {
      statusEl.textContent = '✅ Smooth';
      statusEl.style.color = '#0f0';
    } else if (fps >= 30 && frameTime < 35) {
      statusEl.textContent = '⚠️ Acceptable';
      statusEl.style.color = '#ff0';
    } else {
      statusEl.textContent = '❌ Laggy';
      statusEl.style.color = '#f00';
    }
  }
}

function getEventListenerCount() {
  // Rough estimate based on common elements
  const buttons = document.querySelectorAll('button').length;
  const inputs = document.querySelectorAll('input').length;
  const interactive = document.querySelectorAll('[onclick]').length;
  
  return buttons + inputs + interactive + 20; // +20 for document/window listeners
}

/**
 * Log performance warning to console
 */
export function logPerformanceWarning(message, data = {}) {
  console.warn(`⚠️ Performance Warning: ${message}`, data);
  
  // Could send to analytics in production
  if (typeof gtag !== 'undefined') {
    gtag('event', 'performance_warning', {
      message,
      ...data,
    });
  }
}

/**
 * Check if performance is acceptable
 */
export function checkPerformance() {
  const { fps, frameTime } = fpsData;
  
  if (fps < 30) {
    logPerformanceWarning('Low FPS detected', { fps, frameTime });
    return 'poor';
  } else if (fps < 55) {
    return 'acceptable';
  }
  return 'good';
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
  return {
    fps: fpsData.fps,
    frameTime: fpsData.frameTime,
    memory: performance.memory
      ? (performance.memory.usedJSHeapSize / 1048576).toFixed(2)
      : 'N/A',
    domNodes: document.getElementsByTagName('*').length,
    listeners: getEventListenerCount(),
  };
}

/**
 * Export performance report
 */
export function exportPerformanceReport() {
  const metrics = getPerformanceMetrics();
  const report = {
    timestamp: new Date().toISOString(),
    metrics,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    devicePixelRatio: window.devicePixelRatio,
  };
  
  console.log('📊 Performance Report:', report);
  
  // Download as JSON
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-report-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Auto-enable in development
if (
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.search.includes('debug=true')
) {
  // Uncomment to auto-enable:
  // enablePerformanceDashboard();
  
  // Add keyboard shortcut: Ctrl+Shift+P
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      if (isEnabled) {
        disablePerformanceDashboard();
      } else {
        enablePerformanceDashboard();
      }
    }
  });
  
  console.log('🎮 Performance Dashboard available!');
  console.log('Press Ctrl+Shift+P to toggle');
  console.log('Or call: enablePerformanceDashboard()');
}

export default {
  enable: enablePerformanceDashboard,
  disable: disablePerformanceDashboard,
  getMetrics: getPerformanceMetrics,
  exportReport: exportPerformanceReport,
  logWarning: logPerformanceWarning,
  checkPerformance,
};
