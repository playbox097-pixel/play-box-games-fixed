// games/snake.js
import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'snake';

  // Enhanced game container
  const gameContainer = document.createElement('div');
  gameContainer.style.cssText = `
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border: 2px solid #10b981;
  `;

  // Stats display at the top
  const statsDisplay = document.createElement('div');
  statsDisplay.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  `;

  const scoreBox = document.createElement('div');
  scoreBox.style.cssText = `
    text-align: center;
    padding: 1rem;
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid #10b981;
    border-radius: 12px;
  `;
  scoreBox.innerHTML = `
    <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 0.3rem;">SCORE</div>
    <div class="snake-score-display" style="font-size: 2rem; font-weight: bold; color: #10b981;">0</div>
  `;

  const speedBox = document.createElement('div');
  speedBox.style.cssText = `
    text-align: center;
    padding: 1rem;
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid #3b82f6;
    border-radius: 12px;
  `;
  speedBox.innerHTML = `
    <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 0.3rem;">SPEED</div>
    <div class="snake-speed-display" style="font-size: 2rem; font-weight: bold; color: #3b82f6;">8</div>
  `;

  const bestBox = document.createElement('div');
  bestBox.style.cssText = `
    text-align: center;
    padding: 1rem;
    background: rgba(251, 191, 36, 0.1);
    border: 2px solid #fbbf24;
    border-radius: 12px;
  `;
  bestBox.innerHTML = `
    <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 0.3rem;">BEST</div>
    <div class="snake-best-display" style="font-size: 2rem; font-weight: bold; color: #fbbf24;">0</div>
  `;

  statsDisplay.append(scoreBox, speedBox, bestBox);

  // Control buttons
  const controlsDisplay = document.createElement('div');
  controlsDisplay.style.cssText = `
    display: flex;
    gap: 0.75rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    justify-content: center;
  `;

  const startBtn = document.createElement('button');
  startBtn.className = 'button primary';
  startBtn.textContent = '▶️ Start';
  startBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: bold;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'button';
  pauseBtn.textContent = '⏸️ Pause';
  pauseBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: rgba(59, 130, 246, 0.2);
    border: 2px solid #3b82f6;
    border-radius: 10px;
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const resetBtn = document.createElement('button');
  resetBtn.className = 'button';
  resetBtn.textContent = '🔄 Reset';
  resetBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: rgba(239, 68, 68, 0.2);
    border: 2px solid #ef4444;
    border-radius: 10px;
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'button';
  settingsBtn.textContent = '⚙️ Settings';
  settingsBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: rgba(139, 92, 246, 0.2);
    border: 2px solid #8b5cf6;
    border-radius: 10px;
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const reviveBtn = document.createElement('button');
  reviveBtn.className = 'button';
  reviveBtn.textContent = '💚 Revive';
  reviveBtn.style.display = 'none';
  reviveBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const tutorialBtn = document.createElement('button');
  tutorialBtn.className = 'button';
  tutorialBtn.textContent = '🎓 Tutorial';
  tutorialBtn.title = 'Forgot how to play? Try the tutorial again!';
  tutorialBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const reviveBanner = document.createElement('span');
  reviveBanner.className = 'badge';
  reviveBanner.style.display = 'none';

  const hubBtn = document.createElement('button');
  hubBtn.className = 'button';
  hubBtn.textContent = '🏠 Hub';
  hubBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: rgba(239, 68, 68, 0.2);
    border: 2px solid #ef4444;
    border-radius: 10px;
    color: #fca5a5;
    cursor: pointer;
    transition: all 0.3s;
  `;

  // Add hover effects to buttons
  [startBtn, pauseBtn, resetBtn, settingsBtn, reviveBtn, tutorialBtn, hubBtn].forEach(btn => {
    btn.onmouseenter = () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    };
  });

  controlsDisplay.append(startBtn, pauseBtn, resetBtn, settingsBtn, reviveBtn, tutorialBtn, hubBtn, reviveBanner);

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  canvasWrap.style.cssText = `
    position: relative;
    background: #0a0e1e;
    border-radius: 15px;
    overflow: hidden;
    border: 3px solid #10b981;
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
    margin-bottom: 1.5rem;
    aspect-ratio: 1 / 1;
    max-width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // When in fullscreen, adjust styling
  canvasWrap.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === canvasWrap) {
      canvasWrap.style.borderRadius = '0';
      canvasWrap.style.margin = '0';
      canvasWrap.style.width = '100vw';
      canvasWrap.style.height = '100vh';
      canvasWrap.style.maxWidth = '100vw';
    } else {
      canvasWrap.style.borderRadius = '15px';
      canvasWrap.style.margin = '';
      canvasWrap.style.width = '';
      canvasWrap.style.height = '';
      canvasWrap.style.maxWidth = '100%';
    }
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // fixed logical size; displayed responsive via CSS
  const SIZE = 600;
  canvas.width = SIZE; canvas.height = SIZE;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.objectFit = 'contain';
  canvas.style.maxHeight = '100%';
  canvasWrap.appendChild(canvas);

  // Per-game fullscreen button (targets just this game area)
  if (window.playBoxCreateFullscreenButton) {
    const fsBtn = window.playBoxCreateFullscreenButton(canvasWrap);
    if (fsBtn) {
      fsBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(16, 185, 129, 0.8);
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        color: white;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.3s;
        z-index: 10;
      `;
      canvasWrap.appendChild(fsBtn);
    }
  }

  // Game over overlay
  const overlay = document.createElement('div');
  overlay.className = 'snake-gameover hidden';
  overlay.innerHTML = `
    <div class="snake-gameover-panel" style="position: relative;">
      <h2>Game Over</h2>
      <p class="snake-gameover-score">Score: 0</p>
      <p class="snake-gameover-best">Best: 0</p>
      <div class="snake-revive-section">
        <div class="snake-revive-timer">
          <div class="snake-revive-circle">
            <svg width="80" height="80" class="snake-timer-svg">
              <circle cx="40" cy="40" r="35" class="snake-timer-bg"/>
              <circle cx="40" cy="40" r="35" class="snake-timer-progress"/>
            </svg>
            <div class="snake-timer-text">5</div>
          </div>
        </div>
        <button class="button primary snake-revive-btn" type="button">💚 Use Revive</button>
        <p class="snake-revive-count">Revives: 0</p>
        <div class="snake-no-revives hidden" style="text-align: center; margin: 1rem 0;">
          <p style="color: #ff6b6b; font-weight: bold; margin-bottom: 0.5rem;">⚠️ No revives available</p>
          <p style="font-size: 0.9rem; color: #888; margin-bottom: 1rem;">Continue your run! Get revives now.</p>
          <button class="button primary snake-buy-revive-btn" type="button" style="background: linear-gradient(135deg, #10b981, #06b6d4); font-weight: bold;">💎 Buy Revives</button>
        </div>
      </div>
      <div class="snake-countdown-overlay hidden" style="position: absolute; inset: 0; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 100; border-radius: inherit;">
        <div style="text-align: center;">
          <div style="font-size: 4rem; font-weight: bold; color: #10b981; margin-bottom: 0.5rem;" class="snake-countdown-num">3</div>
          <div style="font-size: 1.2rem; color: #888;">Get Ready...</div>
        </div>
      </div>
      <div class="snake-buy-modal hidden" style="position: absolute; inset: 0; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 100; border-radius: inherit;">
        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 2rem; border-radius: 12px; text-align: center; max-width: 400px; border: 2px solid #10b981;">
          <h3 style="color: #10b981; margin-bottom: 1rem; font-size: 1.5rem;">💎 Buy Revives</h3>
          <p class="snake-buy-pb-display" style="color: #888; margin-bottom: 1.5rem; font-size: 0.95rem;">You have <span style="color: #fbbf24; font-weight: bold;">0 PB</span></p>
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <button class="button primary snake-buy-1-btn" type="button" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); padding: 1rem;">
              <div style="font-size: 1.2rem; font-weight: bold;">1 Revive</div>
              <div style="font-size: 0.85rem; opacity: 0.9;">100 PB</div>
            </button>
            <button class="button primary snake-buy-10-btn" type="button" style="flex: 1; background: linear-gradient(135deg, #06b6d4, #0284c7); padding: 1rem;">
              <div style="font-size: 1.2rem; font-weight: bold;">10 Revives</div>
              <div style="font-size: 0.85rem; opacity: 0.9;">1000 PB</div>
            </button>
          </div>
          <button class="button snake-buy-cancel-btn" type="button" style="width: 100%; background: #374151;">Cancel</button>
        </div>
      </div>
      <p class="snake-gameover-hint">Press Start or an arrow key to play again.</p>
      <div class="snake-gameover-actions">
        <button class="button primary snake-restart-btn" type="button">Play again</button>
      </div>
    </div>
  `;
  canvasWrap.appendChild(overlay);

  // Settings modal
  const settingsModal = document.createElement('div');
  settingsModal.className = 'snake-settings-modal hidden';
  settingsModal.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    ">
      <div style="
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        padding: 2rem;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        border: 2px solid #10b981;
        box-shadow: 0 0 40px rgba(16, 185, 129, 0.3);
      ">
        <h2 style="color: #10b981; margin-bottom: 1.5rem; text-align: center;">⚙️ Game Settings</h2>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🏃 Game Speed</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button snake-speed-slow" type="button" style="flex: 1;">Slow</button>
            <button class="button snake-speed-normal" type="button" style="flex: 1;">Normal</button>
            <button class="button snake-speed-fast" type="button" style="flex: 1;">Fast</button>
          </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🍎 Food Spawn Mode</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
            <button class="button snake-food-1" type="button">1 Food</button>
            <button class="button snake-food-3" type="button">3 Foods</button>
            <button class="button snake-food-5" type="button">5 Foods</button>
            <button class="button snake-food-10" type="button">10 Foods</button>
            <button class="button snake-food-bomb" type="button">💣 Food Bomb!</button>
            <button class="button snake-food-chaos" type="button" style="grid-column: span 2; background: linear-gradient(135deg, #ef4444, #dc2626);">🌪️ CHAOS MODE</button>
          </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🐍 Snake Color</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
            <button class="button snake-color-blue" type="button" style="background: linear-gradient(135deg, #6ea4ff, #3b5bcc);">Blue</button>
            <button class="button snake-color-green" type="button" style="background: linear-gradient(135deg, #10b981, #059669);">Green</button>
            <button class="button snake-color-red" type="button" style="background: linear-gradient(135deg, #ef4444, #dc2626);">Red</button>
            <button class="button snake-color-purple" type="button" style="background: linear-gradient(135deg, #a855f7, #7c3aed);">Purple</button>
            <button class="button snake-color-orange" type="button" style="background: linear-gradient(135deg, #f97316, #ea580c);">Orange</button>
            <button class="button snake-color-pink" type="button" style="background: linear-gradient(135deg, #ec4899, #db2777);">Pink</button>
            <button class="button snake-color-yellow" type="button" style="background: linear-gradient(135deg, #fbbf24, #f59e0b);">Yellow</button>
            <button class="button snake-color-cyan" type="button" style="background: linear-gradient(135deg, #06b6d4, #0891b2);">Cyan</button>
          </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🎯 Difficulty</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button snake-diff-easy" type="button" style="flex: 1;">Easy</button>
            <button class="button snake-diff-medium" type="button" style="flex: 1;">Medium</button>
            <button class="button snake-diff-hard" type="button" style="flex: 1;">Hard</button>
          </div>
        </div>
        
        <button class="button primary snake-settings-close" type="button" style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #10b981, #059669);">
          Close Settings
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(settingsModal);

  // Scroll indicator for settings modal
  const settingsScrollIndicator = document.createElement('div');
  settingsScrollIndicator.className = 'snake-scroll-indicator hidden';
  settingsScrollIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: bold;
    z-index: 2001;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  settingsScrollIndicator.textContent = '⬇️ Scroll Down';
  document.body.appendChild(settingsScrollIndicator);

  // Get high score first for start screen
  const HS_KEY = 'snake';
  let best = getHighScore(HS_KEY);

  // Start screen
  const startScreen = document.createElement('div');
  startScreen.className = 'snake-start-screen';
  startScreen.innerHTML = `
    <div class="snake-start-panel" style="
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    ">
      <div style="
        text-align: center;
        max-width: 500px;
        padding: 2rem;
        background: rgba(30, 41, 59, 0.8);
        border-radius: 20px;
        border: 2px solid #10b981;
        box-shadow: 0 0 40px rgba(16, 185, 129, 0.3);
      ">
        <div style="font-size: 4rem; margin-bottom: 0.5rem; animation: bounce 1s infinite;">
          🐍
        </div>
        <h1 style="
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #10b981, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        ">Snake</h1>
        <p style="color: #94a3b8; margin-bottom: 2rem; font-size: 1.1rem;">
          Classic arcade snake game
        </p>
        
        <div style="
          background: rgba(15, 23, 42, 0.6);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
          border: 1px solid rgba(16, 185, 129, 0.2);
        ">
          <h3 style="color: #10b981; margin-bottom: 1rem; font-size: 1.2rem;">🎮 How to Play</h3>
          <ul style="color: #cbd5e1; list-style: none; padding: 0; line-height: 1.8;">
            <li>⌨️ Use Arrow keys or WASD to move</li>
            <li>🍎 Eat food to grow and score points</li>
            <li>💨 Speed increases as you score</li>
            <li>⚠️ Don't hit walls or yourself!</li>
          </ul>
        </div>

        <div style="
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        ">
          <div style="
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            text-align: center;
          ">
            <div style="color: #10b981; font-weight: bold; font-size: 1.5rem;">${best}</div>
            <div style="color: #64748b; font-size: 0.85rem;">Best Score</div>
          </div>
          <div style="
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            text-align: center;
          ">
            <div style="color: #fbbf24; font-weight: bold; font-size: 1.5rem;">3</div>
            <div style="color: #64748b; font-size: 0.85rem;">Difficulties</div>
          </div>
        </div>

        <button class="snake-start-btn button primary" type="button" style="
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: pulse 2s infinite;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(16, 185, 129, 0.5)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
          🎮 Start Game
        </button>
        
        <button class="snake-start-settings-btn button" type="button" style="
          width: 100%;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          margin-top: 0.75rem;
          background: rgba(100, 116, 139, 0.3);
          border: 1px solid #64748b;
          border-radius: 8px;
          color: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.background='rgba(100, 116, 139, 0.5)'; this.style.borderColor='#94a3b8'" onmouseout="this.style.background='rgba(100, 116, 139, 0.3)'; this.style.borderColor='#64748b'">
          ⚙️ Settings
        </button>

        <button class="snake-start-hub-btn button" type="button" style="
          width: 100%;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          margin-top: 0.75rem;
          background: rgba(239, 68, 68, 0.3);
          border: 1px solid #ef4444;
          border-radius: 8px;
          color: #fca5a5;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.background='rgba(239, 68, 68, 0.5)'; this.style.borderColor='#f87171'" onmouseout="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'">
          🏠 Back to Hub
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(startScreen);

  // Scroll indicator for start screen
  const startScrollIndicator = document.createElement('div');
  startScrollIndicator.className = 'snake-scroll-indicator';
  startScrollIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: bold;
    z-index: 1001;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  startScrollIndicator.textContent = '⬇️ Scroll Down to Game';
  
  startScrollIndicator.onclick = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 100) {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to game
      gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  document.body.appendChild(startScrollIndicator);

  const rulesEl = createRules([
    'Use Arrow keys or WASD to steer.',
    'Eat the green food to grow and score.',
    'Don\'t hit the walls or yourself.',
    'Press Space to pause/resume. Use Start, Pause, and Reset buttons as needed.'
  ]);

  gameContainer.append(statsDisplay, controlsDisplay, canvasWrap, rulesEl);
  wrap.appendChild(gameContainer);
  root.appendChild(wrap);

  // Get display elements
  const scoreDisplay = gameContainer.querySelector('.snake-score-display');
  const speedDisplay = gameContainer.querySelector('.snake-speed-display');
  const bestDisplay = gameContainer.querySelector('.snake-best-display');

  // Tutorial System for First-Time Players
  const TUTORIAL_KEY = 'snake-tutorial-completed';
  const hasCompletedTutorial = localStorage.getItem(TUTORIAL_KEY) === 'true';
  
  let tutorialActive = false;
  let tutorialStep = 0;
  let tutorialOverlay = null;

  if (!hasCompletedTutorial) {
    // Create tutorial overlay
    tutorialOverlay = document.createElement('div');
    tutorialOverlay.className = 'snake-tutorial-overlay';
    tutorialOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
      pointer-events: auto;
    `;

    const tutorialBox = document.createElement('div');
    tutorialBox.className = 'snake-tutorial-box';
    tutorialBox.style.cssText = `
      max-width: 600px;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      padding: 2.5rem;
      border-radius: 20px;
      border: 3px solid #10b981;
      box-shadow: 0 0 50px rgba(16, 185, 129, 0.5);
      text-align: center;
      pointer-events: auto;
      position: relative;
      z-index: 3001;
    `;

    tutorialBox.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
      <h2 style="color: #10b981; font-size: 2rem; margin-bottom: 1rem;">Welcome to Snake!</h2>
      <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
        This is your first time playing! Would you like a quick tutorial to learn how to play?
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button class="snake-tutorial-start button" style="
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          font-weight: bold;
        ">📚 Start Tutorial</button>
        <button class="snake-tutorial-skip button" style="
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background: rgba(100, 116, 139, 0.3);
          border: 2px solid #64748b;
          border-radius: 12px;
          color: #cbd5e1;
          cursor: pointer;
        ">⏭️ Skip</button>
      </div>
    `;

    tutorialOverlay.appendChild(tutorialBox);
    document.body.appendChild(tutorialOverlay);

    // Scroll to the tutorial panel
    setTimeout(() => {
      tutorialBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    const tutorialSteps = [
      {
        title: '🎮 Controls',
        message: 'Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to move the snake.<br><br>Try pressing the arrow keys now!',
        highlight: null,
        waitForKey: true
      },
      {
        title: '🍎 Eating Food',
        message: 'Eat the green food circles to grow longer and earn points!<br><br>Each food gives you <strong>1 point</strong>.',
        highlight: canvasWrap,
        waitForKey: false
      },
      {
        title: '⚡ Speed Increases',
        message: 'As you score more points, your snake will move faster!<br><br>The speed is shown in the <strong>blue box</strong> above.',
        highlight: speedBox,
        waitForKey: false
      },
      {
        title: '⚠️ Avoid Collisions',
        message: 'Don\'t hit the walls or your own tail, or it\'s <strong>Game Over</strong>!<br><br>Stay alert as you get longer.',
        highlight: canvasWrap,
        waitForKey: false
      },
      {
        title: '⏸️ Pause Anytime',
        message: 'Press <strong>Space</strong> or click <strong>Pause</strong> to pause the game whenever you need a break.',
        highlight: pauseBtn,
        waitForKey: false
      },
      {
        title: '💚 Revive System',
        message: 'If you die, you can use a <strong>Revive</strong> to continue your run!<br><br>Revives can be purchased with Playbux.',
        highlight: null,
        waitForKey: false
      },
      {
        title: '⚙️ Customize Your Game',
        message: 'Click <strong>Settings</strong> to change speed, food spawn mode, snake color, and difficulty!',
        highlight: settingsBtn,
        waitForKey: false
      },
      {
        title: '🎉 Ready to Play!',
        message: 'You\'re all set! Click <strong>Start</strong> when you\'re ready to begin your snake adventure!<br><br>Good luck! 🐍',
        highlight: startBtn,
        waitForKey: false
      }
    ];

    let currentStep = 0;
    let keyPressed = false;

    function showTutorialStep(stepIndex) {
      if (stepIndex >= tutorialSteps.length) {
        completeTutorial();
        return;
      }

      const step = tutorialSteps[stepIndex];
      tutorialBox.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">${step.title.split(' ')[0]}</div>
        <h2 style="color: #10b981; font-size: 1.8rem; margin-bottom: 1rem;">${step.title.substring(step.title.indexOf(' ') + 1)}</h2>
        <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
          ${step.message}
        </p>
        <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
          Step ${stepIndex + 1} of ${tutorialSteps.length}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          ${stepIndex < tutorialSteps.length - 1 ? 
            '<button class="snake-tutorial-next button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Next ➡️</button>' :
            '<button class="snake-tutorial-finish button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Finish Tutorial 🎉</button>'
          }
          <button class="snake-tutorial-skip-all button" style="padding: 0.75rem 1.5rem; font-size: 1rem; background: rgba(100, 116, 139, 0.3); border: 2px solid #64748b; border-radius: 12px; color: #cbd5e1; cursor: pointer;">Skip All</button>
        </div>
      `;

      // Highlight element if specified
      document.querySelectorAll('.snake-tutorial-highlight').forEach(el => el.remove());
      if (step.highlight) {
        const highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'snake-tutorial-highlight';
        const rect = step.highlight.getBoundingClientRect();
        highlightOverlay.style.cssText = `
          position: fixed;
          top: ${rect.top - 10}px;
          left: ${rect.left - 10}px;
          width: ${rect.width + 20}px;
          height: ${rect.height + 20}px;
          border: 3px solid #10b981;
          border-radius: 15px;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
          pointer-events: none;
          z-index: 2999;
          animation: pulse 2s infinite;
        `;
        document.body.appendChild(highlightOverlay);
      }

      // Add event listeners
      const nextBtn = tutorialBox.querySelector('.snake-tutorial-next');
      const finishBtn = tutorialBox.querySelector('.snake-tutorial-finish');
      const skipAllBtn = tutorialBox.querySelector('.snake-tutorial-skip-all');

      if (nextBtn) {
        nextBtn.onclick = () => {
          sound.playClick();
          if (step.waitForKey && !keyPressed) {
            return; // Wait for key press
          }
          currentStep++;
          showTutorialStep(currentStep);
        };
      }

      if (finishBtn) {
        finishBtn.onclick = () => {
          sound.playClick();
          completeTutorial();
        };
      }

      if (skipAllBtn) {
        skipAllBtn.onclick = () => {
          sound.playClick();
          completeTutorial();
        };
      }

      // Listen for key press on first step
      if (step.waitForKey && !keyPressed) {
        const keyListener = (e) => {
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
            keyPressed = true;
            tutorialBox.querySelector('p').innerHTML = step.message + '<br><br><span style="color: #10b981; font-weight: bold;">✓ Great! You got it!</span>';
            window.removeEventListener('keydown', keyListener);
          }
        };
        window.addEventListener('keydown', keyListener);
      }
    }

    function completeTutorial() {
      localStorage.setItem(TUTORIAL_KEY, 'true');
      if (tutorialOverlay) tutorialOverlay.remove();
      document.querySelectorAll('.snake-tutorial-highlight').forEach(el => el.remove());
      tutorialActive = false;
      // Scroll back to game after closing tutorial
      setTimeout(() => {
        canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }

    // Tutorial button handlers
    const startTutorialBtn = tutorialBox.querySelector('.snake-tutorial-start');
    const skipTutorialBtn = tutorialBox.querySelector('.snake-tutorial-skip');

    if (startTutorialBtn) {
      startTutorialBtn.onclick = () => {
        sound.playClick();
        tutorialActive = true;
        showTutorialStep(0);
      };
    }

    if (skipTutorialBtn) {
      skipTutorialBtn.onclick = () => {
        sound.playClick();
        completeTutorial();
      };
    }
  }

  // Game state
  const CELL = 24; // 20px cells   24 grid
  const GRID = SIZE / CELL; // 20
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let snake = [ {x: 8, y: 10}, {x:7, y:10}, {x:6, y:10} ];
  let foodList = []; // Multiple food items for spawn modes
  let score = 0;
  let speed = 8; // cells per second
  let loop = null;
  let running = false;
  let difficulty = 'medium';
  let dead = false;
  let reviveLength = 0;
  let reviveCountdown = 0;
  let reviveTimerId = null;
  let isReviving = false; // Prevent double-revive spam
  
  // Settings
  let speedMultiplier = 1; // 0.5=slow, 1=normal, 1.5=fast
  let foodSpawnCount = 1; // 1, 3, 5, 10, or "bomb"
  let snakeColor = 'blue'; // blue, green, red, purple, orange, pink, yellow, cyan
  
  // Snake color palettes (head, body)
  const snakeColors = {
    blue: { head: '#6ea4ff', body: '#3b5bcc' },
    green: { head: '#34d399', body: '#10b981' },
    red: { head: '#f87171', body: '#ef4444' },
    purple: { head: '#c084fc', body: '#a855f7' },
    orange: { head: '#fb923c', body: '#f97316' },
    pink: { head: '#f472b6', body: '#ec4899' },
    yellow: { head: '#fcd34d', body: '#fbbf24' },
    cyan: { head: '#22d3ee', body: '#06b6d4' }
  };

  bestDisplay.textContent = best;

  // Start screen elements
  const startScreenBtn = startScreen.querySelector('.snake-start-btn');
  const startScreenSettingsBtn = startScreen.querySelector('.snake-start-settings-btn');

  // elements inside game over overlay
  const overlayScore = overlay.querySelector('.snake-gameover-score');
  const overlayBest = overlay.querySelector('.snake-gameover-best');
  const overlayRestartBtn = overlay.querySelector('.snake-restart-btn');
  const overlayReviveSection = overlay.querySelector('.snake-revive-section');
  const overlayReviveTimer = overlay.querySelector('.snake-revive-timer');
  const overlayTimerProgress = overlay.querySelector('.snake-timer-progress');
  const overlayReviveBtn = overlay.querySelector('.snake-revive-btn');
  const overlayReviveCount = overlay.querySelector('.snake-revive-count');
  const overlayNoRevives = overlay.querySelector('.snake-no-revives');
  const overlayBuyReviveBtn = overlay.querySelector('.snake-buy-revive-btn');
  const overlayCountdownOverlay = overlay.querySelector('.snake-countdown-overlay');
  const overlayCountdownNum = overlay.querySelector('.snake-countdown-num');
  const overlayBuyModal = overlay.querySelector('.snake-buy-modal');
  const overlayBuyPBDisplay = overlay.querySelector('.snake-buy-pb-display');
  const overlayBuy1Btn = overlay.querySelector('.snake-buy-1-btn');
  const overlayBuy10Btn = overlay.querySelector('.snake-buy-10-btn');
  const overlayBuyCancelBtn = overlay.querySelector('.snake-buy-cancel-btn');

  // Settings modal elements
  const settingsSpeedSlow = settingsModal.querySelector('.snake-speed-slow');
  const settingsSpeedNormal = settingsModal.querySelector('.snake-speed-normal');
  const settingsSpeedFast = settingsModal.querySelector('.snake-speed-fast');
  const settingsFood1 = settingsModal.querySelector('.snake-food-1');
  const settingsFood3 = settingsModal.querySelector('.snake-food-3');
  const settingsFood5 = settingsModal.querySelector('.snake-food-5');
  const settingsFood10 = settingsModal.querySelector('.snake-food-10');
  const settingsFoodBomb = settingsModal.querySelector('.snake-food-bomb');
  const settingsFoodChaos = settingsModal.querySelector('.snake-food-chaos');
  const settingsColorBlue = settingsModal.querySelector('.snake-color-blue');
  const settingsColorGreen = settingsModal.querySelector('.snake-color-green');
  const settingsColorRed = settingsModal.querySelector('.snake-color-red');
  const settingsColorPurple = settingsModal.querySelector('.snake-color-purple');
  const settingsColorOrange = settingsModal.querySelector('.snake-color-orange');
  const settingsColorPink = settingsModal.querySelector('.snake-color-pink');
  const settingsColorYellow = settingsModal.querySelector('.snake-color-yellow');
  const settingsColorCyan = settingsModal.querySelector('.snake-color-cyan');
  const settingsDiffEasy = settingsModal.querySelector('.snake-diff-easy');
  const settingsDiffMedium = settingsModal.querySelector('.snake-diff-medium');
  const settingsDiffHard = settingsModal.querySelector('.snake-diff-hard');
  const settingsClose = settingsModal.querySelector('.snake-settings-close');

  function button(t){ const b=document.createElement('button'); b.textContent=t; return b; }
  function badge(t){ const s=document.createElement('span'); s.className='badge'; s.textContent=t; return s; }
  function createRules(items){
    const d = document.createElement('details'); d.className='rules';
    const s = document.createElement('summary'); s.textContent='Rules';
    const ul = document.createElement('ul');
    items.forEach(t => { const li=document.createElement('li'); li.textContent=t; ul.appendChild(li); });
    d.append(s, ul); return d;
  }

  function randInt(n){ return Math.floor(Math.random()*n); }
  function equals(a,b){ return a.x===b.x && a.y===b.y; }
  function within(p){ return p.x>=0 && p.y>=0 && p.x<GRID && p.y<GRID; }

  function randEmpty(){
    let p;
    do { p = { x: randInt(GRID), y: randInt(GRID) }; }
    while (snake.some(s => equals(s,p)) || foodList.some(f => equals(f,p)));
    return p;
  }
  
  function spawnFoods(count) {
    foodList = [];
    let actualCount;
    if (count === 'bomb') {
      actualCount = 50;
    } else if (count === 'chaos') {
      // Fill halfway through the map (24x24 grid = 576 cells, so ~288 food)
      actualCount = Math.floor(((SIZE / CELL) * (SIZE / CELL)) / 2);
    } else {
      actualCount = count;
    }
    for (let i = 0; i < actualCount; i++) {
      const pos = randEmpty();
      if (pos) foodList.push(pos); // Only add if there's space
    }
  }

  function drawCell(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*CELL, y*CELL, CELL, CELL);
  }

  function drawSnakeSegment(x, y, isHead) {
    const cx = x * CELL + CELL / 2;
    const cy = y * CELL + CELL / 2;
    const r = CELL / 2 - 2;
    ctx.beginPath();
    const colors = snakeColors[snakeColor];
    ctx.fillStyle = isHead ? colors.head : colors.body;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    // background
    ctx.fillStyle = '#0a0e1e';
    ctx.fillRect(0,0,SIZE,SIZE);

    // grid light
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i=0;i<=GRID;i++){
      ctx.beginPath(); ctx.moveTo(i*CELL+0.5,0); ctx.lineTo(i*CELL+0.5,SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*CELL+0.5); ctx.lineTo(SIZE,i*CELL+0.5); ctx.stroke();
    }

    // Draw all foods
    foodList.forEach(f => {
      drawCell(f.x, f.y, '#7bffb0');
    });

    // snake with rounded body segments
    snake.forEach((s, i) => drawSnakeSegment(s.x, s.y, i === 0));
  }

  function step(){
    dir = nextDir; // commit direction changes once per tick

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    // collisions
    if (!within(head) || snake.some(s => equals(s, head))) {
      gameOver();
      return;
    }

    snake.unshift(head);
    
    // Check if head hit any food
    const foodIndex = foodList.findIndex(f => equals(f, head));
    if (foodIndex !== -1) {
      // Remove the eaten food
      foodList.splice(foodIndex, 1);
      
      score += 1;
      scoreDisplay.textContent = score;
      if (score > best) {
        best = updateHighScore(HS_KEY, score);
        bestDisplay.textContent = best;
        // Animate best display
        bestDisplay.style.transform = 'scale(1.3)';
        setTimeout(() => {
          bestDisplay.style.transform = 'scale(1)';
        }, 300);
      }
      sound.playScore();
      // Visual feedback: pulse the score display
      scoreDisplay.style.transform = 'scale(1.3)';
      scoreDisplay.style.color = '#34d399';
      setTimeout(() => {
        scoreDisplay.style.transform = 'scale(1)';
        scoreDisplay.style.color = '#10b981';
      }, 300);
      // accelerate smoothly, capped at speed 20 for fairness
      if (score % 3 === 0 && speed < 20) setSpeed(speed + 1);
      
      // Spawn new food to maintain count
      foodList.push(randEmpty());
    } else {
      snake.pop();
    }

    draw();
  }

  function setSpeed(s){
    speed = Math.min(20, Math.max(4, s));
    speedDisplay.textContent = speed;
    if (running) startLoop();
  }

  function difficultyBaseSpeed(level) {
    if (level === 'easy') return 6;
    if (level === 'hard') return 12;
    return 8; // medium / default
  }

  function hideGameOverOverlay() {
    clearReviveTimer();
    overlay.classList.add('hidden');
  }

  function showGameOverOverlay() {
    if (overlayScore) overlayScore.textContent = `Score: ${score}`;
    if (overlayBest) overlayBest.textContent = `Best: ${best}`;
    
    // Reset visibility
    if (overlayReviveSection) overlayReviveSection.style.display = 'block';
    if (overlayReviveCount) overlayReviveCount.style.display = 'block';
    
    // Check revives and show appropriate UI
    if (window.playBoxGetRevives) {
      const revivesLeft = window.playBoxGetRevives();
      
      if (revivesLeft > 0) {
        // Show revive section with timer
        if (overlayReviveCount) overlayReviveCount.textContent = `Revives: ${revivesLeft}`;
        if (overlayNoRevives) overlayNoRevives.classList.add('hidden');
        if (overlayReviveTimer) overlayReviveTimer.style.display = 'block';
        if (overlayReviveBtn) overlayReviveBtn.style.display = 'block';
        startReviveOverlayTimer();
      } else {
        // Show no revives message with recommendation
        if (overlayReviveTimer) overlayReviveTimer.style.display = 'none';
        if (overlayReviveBtn) overlayReviveBtn.style.display = 'none';
        if (overlayReviveCount) overlayReviveCount.style.display = 'none';
        if (overlayNoRevives) overlayNoRevives.classList.remove('hidden');
      }
    } else {
      // No revive system available
      if (overlayReviveSection) overlayReviveSection.style.display = 'none';
    }
    
    overlay.classList.remove('hidden');
  }

  function updateReviveBanner(left) {
    if (!reviveBanner) return;
    reviveBanner.textContent = `Revive? ${left} left — ${reviveCountdown}s`;
  }

  function clearReviveTimer() {
    if (reviveTimerId) clearInterval(reviveTimerId);
    reviveTimerId = null;
    reviveCountdown = 0;
    if (reviveBanner) reviveBanner.style.display = 'none';
  }

  function startReviveCountdown(left) {
    clearReviveTimer();
    reviveCountdown = 5;
    if (reviveBanner) reviveBanner.style.display = '';
    updateReviveBanner(left);
    reviveTimerId = setInterval(() => {
      reviveCountdown -= 1;
      if (reviveCountdown <= 0) {
        clearReviveTimer();
        reviveBtn.style.display = 'none';
      } else {
        updateReviveBanner(left);
      }
    }, 1000);
  }

  function startReviveOverlayTimer() {
    clearReviveTimer();
    reviveCountdown = 5;
    
    // Show timer elements
    if (overlayReviveTimer) overlayReviveTimer.style.display = 'block';
    if (overlayReviveBtn) overlayReviveBtn.style.display = 'block';
    
    // Animate the progress circle (SVG circumference for r=35)
    const circumference = 2 * Math.PI * 35;
    if (overlayTimerProgress) {
      overlayTimerProgress.style.strokeDasharray = circumference;
      overlayTimerProgress.style.strokeDashoffset = '0';
    }
    
    // Update timer text
    const timerText = overlayReviveTimer?.querySelector('.snake-timer-text');
    if (timerText) timerText.textContent = reviveCountdown;
    
    reviveTimerId = setInterval(() => {
      reviveCountdown -= 1;
      
      // Update timer text
      if (timerText) timerText.textContent = reviveCountdown;
      
      // Update progress circle (animate from full to empty)
      if (overlayTimerProgress) {
        const offset = circumference * (1 - reviveCountdown / 5);
        overlayTimerProgress.style.strokeDashoffset = offset;
      }
      
      // Timer expired - hide revive option
      if (reviveCountdown <= 0) {
        clearReviveTimer();
        if (overlayReviveSection) overlayReviveSection.style.display = 'none';
      }
    }, 1000);
  }

  function start3SecondCountdown(callback) {
    // Show countdown overlay - gives player time to prepare
    if (overlayCountdownOverlay) overlayCountdownOverlay.classList.remove('hidden');
    
    let count = 3;
    if (overlayCountdownNum) overlayCountdownNum.textContent = count;
    
    const countdownInterval = setInterval(() => {
      count--;
      if (overlayCountdownNum) overlayCountdownNum.textContent = count;
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        // Hide countdown overlay
        if (overlayCountdownOverlay) overlayCountdownOverlay.classList.add('hidden');
        // Execute callback (start game)
        if (callback) callback();
      }
    }, 1000);
  }

  function applyDifficulty(level) {
    difficulty = level;
    reset();
    updateSettingsUI(); // Update the settings UI to show active difficulty
  }

  function startLoop(){
    stopLoop();
    const adjustedSpeed = speed * speedMultiplier;
    const interval = Math.floor(1000 / adjustedSpeed);
    loop = setInterval(step, interval);
    running = true;
  }

  function stopLoop(){ if (loop) clearInterval(loop); loop = null; running = false; }

  function reset(keepScore = false, keepLength = false, skipOverlayHide = false){
    dead = false;
    if (!skipOverlayHide) {
      hideGameOverOverlay();
    }
    reviveBtn.style.display = 'none';
    clearReviveTimer();
    dir = {x:1,y:0}; nextDir = {x:1,y:0};

    const targetLen = keepLength && reviveLength
      ? Math.min(reviveLength, GRID)
      : 3;
    const startY = Math.floor(GRID / 2);
    const startX = Math.floor(GRID / 2) + Math.floor(targetLen / 2) - 1;

    snake = [];
    for (let i = 0; i < targetLen; i++) {
      snake.push({ x: startX - i, y: startY });
    }

    // Spawn food based on current settings
    spawnFoods(foodSpawnCount);
    
    if (!keepScore) {
      score = 0;
    }
    scoreDisplay.textContent = score;
    setSpeed(difficultyBaseSpeed(difficulty));
    draw();
  }

  function reviveGame() {
    // Just un-dead the game, don't reset position or anything else
    dead = false;
    // Snake stays in same position, food stays same, score stays same
    // Just resume from where we died
    draw();
  }

  function gameOver(){
    reviveLength = snake.length;
    stopLoop();
    running = false;
    dead = true;
    sound.playGameOver();
    
    // Visual feedback: screen shake effect
    canvasWrap.style.animation = 'screenShake 0.3s ease-out';
    setTimeout(() => {
      canvasWrap.style.animation = '';
    }, 300);
    
    // flash on canvas (red overlay for damage feel)
    ctx.fillStyle = 'rgba(255,110,123,0.15)';
    ctx.fillRect(0,0,SIZE,SIZE);
    
    // show overlay UI with revive options
    showGameOverOverlay();
  }

  // input
  function onKey(e){
    const k = e.key;

    const isUp = (k === 'ArrowUp' || k === 'w');
    const isDown = (k === 'ArrowDown' || k === 's');
    const isLeft = (k === 'ArrowLeft' || k === 'a');
    const isRight = (k === 'ArrowRight' || k === 'd');
    const isSpace = (k === ' ');

    // prevent the page from scrolling when controlling the game
    const handled = (isUp || isDown || isLeft || isRight || isSpace);
    if (handled) e.preventDefault();

    // After a game over, only space bar can restart (not arrow keys)
    if (dead && isSpace) {
      reset();
      startLoop();
      sound.playClick();
      return;
    }

    // Don't allow direction changes when dead
    if (dead) return;

    if (isUp) {
      if (dir.y===0) {
        nextDir={x:0,y:-1};
        sound.playMove();
      }
    }
    else if (isDown) {
      if (dir.y===0) {
        nextDir={x:0,y:1};
        sound.playMove();
      }
    }
    else if (isLeft) {
      if (dir.x===0) {
        nextDir={x:-1,y:0};
        sound.playMove();
      }
    }
    else if (isRight) {
      if (dir.x===0) {
        nextDir={x:1,y:0};
        sound.playMove();
      }
    }
    else if (isSpace) {
      if (running) stopLoop(); else startLoop();
      sound.playClick();
    }
  }

  // bind
  startBtn.addEventListener('click', () => {
    if (!running) {
      sound.playClick();
      if (dead) reset();
      startLoop();
    }
  });
  pauseBtn.addEventListener('click', () => {
    sound.playClick();
    if (running) stopLoop(); else startLoop();
  });
  resetBtn.addEventListener('click', () => {
    sound.playClick();
    reset();
  });
  reviveBtn.addEventListener('click', () => {
    if (!(window.playBoxUseRevive && window.playBoxGetRevives)) return;
    let ok = window.playBoxUseRevive();
    if (!ok) {
      if (window.playBoxPromptRevivePurchase && window.playBoxPromptRevivePurchase()) {
        ok = window.playBoxUseRevive();
      }
      if (!ok) {
        reviveBtn.style.display = 'none';
        clearReviveTimer();
        alert('No revives left.');
        return;
      }
    }
    sound.playClick();
    reset(true, true);
    startLoop();
  });
  
  // Start screen button
  if (startScreenBtn) {
    startScreenBtn.addEventListener('click', () => {
      sound.playClick();
      if (startScreen) startScreen.remove();
      // Scroll to game window
      setTimeout(() => {
        gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      startLoop();
    });
  }
  
  if (overlayRestartBtn) {
    overlayRestartBtn.addEventListener('click', () => {
      sound.playClick();
      reset();
      startLoop();
    });
  }
  
  // Revive button click handler
  if (overlayReviveBtn) {
    overlayReviveBtn.addEventListener('click', () => {
      // Prevent double-revive spam
      if (isReviving) return;
      
      if (window.playBoxUseRevive && window.playBoxGetRevives) {
        const revivesLeft = window.playBoxGetRevives();
        if (revivesLeft > 0 && window.playBoxUseRevive()) {
          isReviving = true; // Lock to prevent spam
          sound.playClick();
          clearReviveTimer();
          
          // Reset to center with same score and length
          reset(true, true, true);
          
          // Start 3-second countdown WHILE overlay is still visible
          // This gives player time to prepare before game resumes
          start3SecondCountdown(() => {
            // After countdown, hide overlay and start game
            hideGameOverOverlay();
            isReviving = false; // Unlock for next death
            startLoop();
          });
        }
      }
    });
  }
  
  // Buy revive button click handler
  if (overlayBuyReviveBtn) {
    overlayBuyReviveBtn.addEventListener('click', () => {
      sound.playClick();
      // Show the buy modal
      if (overlayBuyModal) {
        // Get current Playbux
        const pb = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;
        if (overlayBuyPBDisplay) {
          overlayBuyPBDisplay.innerHTML = `You have <span style="color: #fbbf24; font-weight: bold;">${pb} PB</span>`;
        }
        // Disable buttons if not enough PB
        if (overlayBuy1Btn) {
          overlayBuy1Btn.disabled = pb < 100;
          overlayBuy1Btn.style.opacity = pb < 100 ? '0.5' : '1';
        }
        if (overlayBuy10Btn) {
          overlayBuy10Btn.disabled = pb < 1000;
          overlayBuy10Btn.style.opacity = pb < 1000 ? '0.5' : '1';
        }
        overlayBuyModal.classList.remove('hidden');
      }
    });
  }
  
  // Buy 1 revive button
  if (overlayBuy1Btn) {
    overlayBuy1Btn.addEventListener('click', () => {
      const pb = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;
      if (pb >= 100) {
        sound.playClick();
        if (window.playBoxSpendPlaybux && window.playBoxGetRevives) {
          if (window.playBoxSpendPlaybux(100)) {
            // Add 1 revive manually
            const currentRevives = window.playBoxGetRevives();
            localStorage.setItem('gamehub:revives', String(currentRevives + 1));
            // Update display
            if (window.updateReviveDisplay) window.updateReviveDisplay();
            if (window.updatePlaybuxDisplay) window.updatePlaybuxDisplay();
            // Hide buy modal and refresh overlay
            if (overlayBuyModal) overlayBuyModal.classList.add('hidden');
            showGameOverOverlay();
          }
        }
      }
    });
  }
  
  // Buy 10 revives button
  if (overlayBuy10Btn) {
    overlayBuy10Btn.addEventListener('click', () => {
      const pb = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;
      if (pb >= 1000) {
        sound.playClick();
        if (window.playBoxSpendPlaybux && window.playBoxGetRevives) {
          if (window.playBoxSpendPlaybux(1000)) {
            // Add 10 revives manually
            const currentRevives = window.playBoxGetRevives();
            localStorage.setItem('gamehub:revives', String(currentRevives + 10));
            // Update display
            if (window.updateReviveDisplay) window.updateReviveDisplay();
            if (window.updatePlaybuxDisplay) window.updatePlaybuxDisplay();
            // Hide buy modal and refresh overlay
            if (overlayBuyModal) overlayBuyModal.classList.add('hidden');
            showGameOverOverlay();
          }
        }
      }
    });
  }
  
  // Cancel buy button
  if (overlayBuyCancelBtn) {
    overlayBuyCancelBtn.addEventListener('click', () => {
      sound.playClick();
      if (overlayBuyModal) overlayBuyModal.classList.add('hidden');
    });
  }
  
  // Settings button - open modal (from toolbar - scroll to it)
  settingsBtn.addEventListener('click', () => {
    sound.playClick();
    settingsModal.classList.remove('hidden');
    settingsScrollIndicator.classList.remove('hidden');
    updateSettingsUI();
    updateScrollIndicators();
    // Auto-scroll up to settings modal when accessed from game toolbar
    setTimeout(() => {
      settingsModal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  // Tutorial button - replay tutorial
  tutorialBtn.addEventListener('click', () => {
    sound.playClick();
    
    // Create a new tutorial overlay
    const newTutorialOverlay = document.createElement('div');
    newTutorialOverlay.className = 'snake-tutorial-overlay';
    newTutorialOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
      pointer-events: auto;
    `;

    const newTutorialBox = document.createElement('div');
    newTutorialBox.className = 'snake-tutorial-box';
    newTutorialBox.style.cssText = `
      max-width: 600px;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      padding: 2.5rem;
      border-radius: 20px;
      border: 3px solid #10b981;
      box-shadow: 0 0 50px rgba(16, 185, 129, 0.5);
      text-align: center;
      pointer-events: auto;
      position: relative;
      z-index: 3001;
    `;

    newTutorialOverlay.appendChild(newTutorialBox);
    document.body.appendChild(newTutorialOverlay);

    // Scroll to the tutorial panel
    setTimeout(() => {
      newTutorialBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    // Define tutorial steps for replay
    const replaySteps = [
      {
        title: '🎓 Welcome Back!',
        message: 'Let\'s review how to play Snake!',
        highlight: null
      },
      {
        title: '⬆️ Movement',
        message: 'Use <strong>Arrow Keys</strong> to control your snake in any direction.',
        highlight: canvasWrap
      },
      {
        title: '🍎 Eating Food',
        message: 'Eat the green food circles to grow longer and earn points!<br><br>Each food gives you <strong>1 point</strong>.',
        highlight: canvasWrap
      },
      {
        title: '⚡ Speed Increases',
        message: 'As you score more points, your snake will move faster!<br><br>The speed is shown in the <strong>blue box</strong> above.',
        highlight: speedBox
      },
      {
        title: '⚠️ Avoid Collisions',
        message: 'Don\'t hit the walls or your own tail, or it\'s <strong>Game Over</strong>!<br><br>Stay alert as you get longer.',
        highlight: canvasWrap
      },
      {
        title: '⏸️ Pause Anytime',
        message: 'Press <strong>Space</strong> or click <strong>Pause</strong> to pause the game whenever you need a break.',
        highlight: pauseBtn
      },
      {
        title: '💚 Revive System',
        message: 'If you die, you can use a <strong>Revive</strong> to continue your run!<br><br>Revives can be purchased with Playbux.',
        highlight: null
      },
      {
        title: '⚙️ Customize Your Game',
        message: 'Click <strong>Settings</strong> to change speed, food spawn mode, snake color, and difficulty!',
        highlight: settingsBtn
      },
      {
        title: '🎉 Ready to Play!',
        message: 'You\'re all set! Have fun playing Snake! 🐍',
        highlight: startBtn
      }
    ];

    let replayStep = 0;

    function showReplayStep(stepIndex) {
      if (stepIndex >= replaySteps.length) {
        newTutorialOverlay.remove();
        document.querySelectorAll('.snake-tutorial-highlight').forEach(el => el.remove());
        // Scroll back to game
        setTimeout(() => {
          canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }

      const step = replaySteps[stepIndex];
      newTutorialBox.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">${step.title.split(' ')[0]}</div>
        <h2 style="color: #10b981; font-size: 1.8rem; margin-bottom: 1rem;">${step.title.substring(step.title.indexOf(' ') + 1)}</h2>
        <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
          ${step.message}
        </p>
        <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
          Step ${stepIndex + 1} of ${replaySteps.length}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          ${stepIndex < replaySteps.length - 1 ?
            '<button class="replay-next button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Next ➡️</button>' :
            '<button class="replay-finish button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Got It! 🎉</button>'
          }
          <button class="replay-close button" style="padding: 0.75rem 1.5rem; font-size: 1rem; background: rgba(100, 116, 139, 0.3); border: 2px solid #64748b; border-radius: 12px; color: #cbd5e1; cursor: pointer;">Close</button>
        </div>
      `;

      // Highlight element
      document.querySelectorAll('.snake-tutorial-highlight').forEach(el => el.remove());
      if (step.highlight) {
        const highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'snake-tutorial-highlight';
        const rect = step.highlight.getBoundingClientRect();
        highlightOverlay.style.cssText = `
          position: fixed;
          top: ${rect.top - 10}px;
          left: ${rect.left - 10}px;
          width: ${rect.width + 20}px;
          height: ${rect.height + 20}px;
          border: 3px solid #10b981;
          border-radius: 15px;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
          pointer-events: none;
          z-index: 2999;
          animation: pulse 2s infinite;
        `;
        document.body.appendChild(highlightOverlay);
      }

      // Event listeners
      const nextBtn = newTutorialBox.querySelector('.replay-next');
      const finishBtn = newTutorialBox.querySelector('.replay-finish');
      const closeBtn = newTutorialBox.querySelector('.replay-close');

      if (nextBtn) {
        nextBtn.onclick = () => {
          sound.playClick();
          replayStep++;
          showReplayStep(replayStep);
        };
      }

      if (finishBtn) {
        finishBtn.onclick = () => {
          sound.playClick();
          newTutorialOverlay.remove();
          document.querySelectorAll('.snake-tutorial-highlight').forEach(el => el.remove());
          // Scroll back to game
          setTimeout(() => {
            canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        };
      }

      if (closeBtn) {
        closeBtn.onclick = () => {
          sound.playClick();
          newTutorialOverlay.remove();
          document.querySelectorAll('.snake-tutorial-highlight').forEach(el => el.remove());
          // Scroll back to game
          setTimeout(() => {
            canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        };
      }
    }

    showReplayStep(0);
  });

  // Hub button - navigate back to game hub
  hubBtn.addEventListener('click', () => {
    sound.playClick();
    location.hash = '#/';
  });
  
  // Start screen settings button - open modal (no scroll, already visible)
  if (startScreenSettingsBtn) {
    startScreenSettingsBtn.addEventListener('click', () => {
      sound.playClick();
      settingsModal.classList.remove('hidden');
      settingsScrollIndicator.classList.remove('hidden');
      updateSettingsUI();
      updateScrollIndicators();
      // No scroll - settings modal is near start screen
    });
  }

  // Start screen back to hub button
  const startScreenHubBtn = startScreen.querySelector('.snake-start-hub-btn');
  if (startScreenHubBtn) {
    startScreenHubBtn.addEventListener('click', () => {
      sound.playClick();
      if (startScreen) startScreen.remove();
      if (startScrollIndicator) startScrollIndicator.remove();
      location.hash = '#/';
    });
  }
  
  // Settings: Speed controls
  if (settingsSpeedSlow) {
    settingsSpeedSlow.addEventListener('click', () => {
      sound.playClick();
      speedMultiplier = 0.5;
      updateSettingsUI();
    });
  }
  if (settingsSpeedNormal) {
    settingsSpeedNormal.addEventListener('click', () => {
      sound.playClick();
      speedMultiplier = 1;
      updateSettingsUI();
    });
  }
  if (settingsSpeedFast) {
    settingsSpeedFast.addEventListener('click', () => {
      sound.playClick();
      speedMultiplier = 1.5;
      updateSettingsUI();
    });
  }
  
  // Settings: Food spawn controls
  if (settingsFood1) {
    settingsFood1.addEventListener('click', () => {
      sound.playClick();
      foodSpawnCount = 1;
      spawnFoods(foodSpawnCount);
      updateSettingsUI();
      draw();
    });
  }
  if (settingsFood3) {
    settingsFood3.addEventListener('click', () => {
      sound.playClick();
      foodSpawnCount = 3;
      spawnFoods(foodSpawnCount);
      updateSettingsUI();
      draw();
    });
  }
  if (settingsFood5) {
    settingsFood5.addEventListener('click', () => {
      sound.playClick();
      foodSpawnCount = 5;
      spawnFoods(foodSpawnCount);
      updateSettingsUI();
      draw();
    });
  }
  if (settingsFood10) {
    settingsFood10.addEventListener('click', () => {
      sound.playClick();
      foodSpawnCount = 10;
      spawnFoods(foodSpawnCount);
      updateSettingsUI();
      draw();
    });
  }
  if (settingsFoodBomb) {
    settingsFoodBomb.addEventListener('click', () => {
      sound.playClick();
      foodSpawnCount = 'bomb';
      spawnFoods(foodSpawnCount);
      updateSettingsUI();
      draw();
    });
  }
  if (settingsFoodChaos) {
    settingsFoodChaos.addEventListener('click', () => {
      sound.playClick();
      foodSpawnCount = 'chaos';
      spawnFoods(foodSpawnCount);
      updateSettingsUI();
      draw();
    });
  }
  
  // Settings: Snake color controls
  if (settingsColorBlue) {
    settingsColorBlue.addEventListener('click', () => {
      sound.playClick();
      snakeColor = 'blue';
      updateSettingsUI();
      draw();
    });
  }
  if (settingsColorGreen) {
    settingsColorGreen.addEventListener('click', () => {
      sound.playClick();
      snakeColor = 'green';
      updateSettingsUI();
      draw();
    });
  }
  if (settingsColorRed) {
    settingsColorRed.addEventListener('click', () => {
      sound.playClick();
      snakeColor = 'red';
      updateSettingsUI();
      draw();
    });
  }
  if (settingsColorPurple) {
    settingsColorPurple.addEventListener('click', () => {
      sound.playClick();
      snakeColor = 'purple';
      updateSettingsUI();
      draw();
    });
  }
  if (settingsColorOrange) {
    settingsColorOrange.addEventListener('click', () => {
      sound.playClick();
      snakeColor = 'orange';
      updateSettingsUI();
      draw();
    });
  }
  if (settingsColorPink) {
    settingsColorPink.addEventListener('click', () => {
      sound.playClick();
      snakeColor = 'pink';
      updateSettingsUI();
      draw();
    });
  }
  if (settingsColorYellow) {
    settingsColorYellow.addEventListener('click', () => {
      sound.playClick();
      snakeColor = 'yellow';
      updateSettingsUI();
      draw();
    });
  }
  if (settingsColorCyan) {
    settingsColorCyan.addEventListener('click', () => {
      sound.playClick();
      snakeColor = 'cyan';
      updateSettingsUI();
      draw();
    });
  }
  
  // Settings: Difficulty controls
  if (settingsDiffEasy) {
    settingsDiffEasy.addEventListener('click', () => {
      sound.playClick();
      applyDifficulty('easy');
    });
  }
  if (settingsDiffMedium) {
    settingsDiffMedium.addEventListener('click', () => {
      sound.playClick();
      applyDifficulty('medium');
    });
  }
  if (settingsDiffHard) {
    settingsDiffHard.addEventListener('click', () => {
      sound.playClick();
      applyDifficulty('hard');
    });
  }
  
  // Settings: Close button
  if (settingsClose) {
    settingsClose.addEventListener('click', () => {
      sound.playClick();
      settingsModal.classList.add('hidden');
      settingsScrollIndicator.classList.add('hidden');
      // Scroll back to game
      setTimeout(() => {
        canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });
  }
  
  // Update settings UI to show active selections
  function updateSettingsUI() {
    // Speed buttons
    if (settingsSpeedSlow) settingsSpeedSlow.classList.toggle('primary', speedMultiplier === 0.5);
    if (settingsSpeedNormal) settingsSpeedNormal.classList.toggle('primary', speedMultiplier === 1);
    if (settingsSpeedFast) settingsSpeedFast.classList.toggle('primary', speedMultiplier === 1.5);
    
    // Food spawn buttons
    if (settingsFood1) settingsFood1.classList.toggle('primary', foodSpawnCount === 1);
    if (settingsFood3) settingsFood3.classList.toggle('primary', foodSpawnCount === 3);
    if (settingsFood5) settingsFood5.classList.toggle('primary', foodSpawnCount === 5);
    if (settingsFood10) settingsFood10.classList.toggle('primary', foodSpawnCount === 10);
    if (settingsFoodBomb) settingsFoodBomb.classList.toggle('primary', foodSpawnCount === 'bomb');
    if (settingsFoodChaos) settingsFoodChaos.classList.toggle('primary', foodSpawnCount === 'chaos');
    
    // Snake color buttons
    if (settingsColorBlue) settingsColorBlue.classList.toggle('primary', snakeColor === 'blue');
    if (settingsColorGreen) settingsColorGreen.classList.toggle('primary', snakeColor === 'green');
    if (settingsColorRed) settingsColorRed.classList.toggle('primary', snakeColor === 'red');
    if (settingsColorPurple) settingsColorPurple.classList.toggle('primary', snakeColor === 'purple');
    if (settingsColorOrange) settingsColorOrange.classList.toggle('primary', snakeColor === 'orange');
    if (settingsColorPink) settingsColorPink.classList.toggle('primary', snakeColor === 'pink');
    if (settingsColorYellow) settingsColorYellow.classList.toggle('primary', snakeColor === 'yellow');
    if (settingsColorCyan) settingsColorCyan.classList.toggle('primary', snakeColor === 'cyan');
    
    // Difficulty buttons
    if (settingsDiffEasy) settingsDiffEasy.classList.toggle('primary', difficulty === 'easy');
    if (settingsDiffMedium) settingsDiffMedium.classList.toggle('primary', difficulty === 'medium');
    if (settingsDiffHard) settingsDiffHard.classList.toggle('primary', difficulty === 'hard');
  }
  
  addEventListener('keydown', onKey);

  // Scroll indicator logic
  function updateScrollIndicators() {
    const scrollY = window.scrollY || window.pageYOffset;
    const threshold = 100; // pixels scrolled before changing indicator
    
    // Update start screen indicator (check if element is in DOM)
    if (startScrollIndicator && document.body.contains(startScrollIndicator) && !startScrollIndicator.classList.contains('hidden')) {
      if (scrollY > threshold) {
        startScrollIndicator.textContent = '⬆️ Scroll Up to Start';
        startScrollIndicator.style.background = 'rgba(59, 130, 246, 0.9)'; // Blue when scrolled down
      } else {
        startScrollIndicator.textContent = '⬇️ Scroll Down to Game';
        startScrollIndicator.style.background = 'rgba(16, 185, 129, 0.9)'; // Green at top
      }
    }
    
    // Update settings indicator (check if modal is visible)
    if (settingsScrollIndicator && !settingsScrollIndicator.classList.contains('hidden')) {
      if (scrollY > threshold) {
        settingsScrollIndicator.textContent = '⬆️ Scroll Up';
        settingsScrollIndicator.style.background = 'rgba(59, 130, 246, 0.9)'; // Blue when scrolled down
      } else {
        settingsScrollIndicator.textContent = '⬇️ Scroll Down';
        settingsScrollIndicator.style.background = 'rgba(16, 185, 129, 0.9)'; // Green at top
      }
    }
  }

  // Add scroll event listener
  window.addEventListener('scroll', updateScrollIndicators);
  
  // Make indicators clickable - always scroll to top when clicked
  if (startScrollIndicator) {
    startScrollIndicator.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  if (settingsScrollIndicator) {
    settingsScrollIndicator.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  // Update indicators when start screen is shown/hidden
  const originalStartScreenRemove = startScreen.remove.bind(startScreen);
  startScreen.remove = function() {
    if (startScrollIndicator) startScrollIndicator.classList.add('hidden');
    originalStartScreenRemove();
  };

  // Initialize game: spawn initial food and draw
  spawnFoods(foodSpawnCount);
  draw();
  
  // first draw / default difficulty
  applyDifficulty(difficulty);
  
  // Initialize scroll indicators
  updateScrollIndicators();

  return () => {
    stopLoop();
    removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', updateScrollIndicators);
    wrap.remove();
    if (settingsModal) settingsModal.remove();
    if (startScreen) startScreen.remove();
    if (startScrollIndicator) startScrollIndicator.remove();
    if (settingsScrollIndicator) settingsScrollIndicator.remove();
    if (tutorialOverlay) tutorialOverlay.remove();
    document.querySelectorAll('.snake-tutorial-highlight').forEach(el => el.remove());
  };
}
