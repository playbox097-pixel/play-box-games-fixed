// games/breakout.js
import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'breakout';

  // Settings modal (created early like Snake)
  const settingsModal = document.createElement('div');
  settingsModal.className = 'breakout-settings-modal hidden';
  settingsModal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.9);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  `;
  settingsModal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #7c2d12, #9a3412);
        padding: 2rem;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        border: 2px solid #ea580c;
        box-shadow: 0 0 40px rgba(234, 88, 12, 0.3);
      ">
        <h2 style="color: #ea580c; margin-bottom: 1.5rem; text-align: center;">⚙️ Game Settings</h2>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">⚔️ Difficulty</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
            <button class="button breakout-diff-easy" type="button">Easy</button>
            <button class="button breakout-diff-medium" type="button">Medium</button>
            <button class="button breakout-diff-hard" type="button">Hard</button>
            <button class="button breakout-diff-chaos" type="button">Chaos</button>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🏓 Paddle Size</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button breakout-paddle-small" type="button" style="flex: 1;">Small</button>
            <button class="button breakout-paddle-normal" type="button" style="flex: 1;">Normal</button>
            <button class="button breakout-paddle-large" type="button" style="flex: 1;">Large</button>
          </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">⚡ Ball Speed</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button breakout-speed-slow" type="button" style="flex: 1;">Slow</button>
            <button class="button breakout-speed-normal" type="button" style="flex: 1;">Normal</button>
            <button class="button breakout-speed-fast" type="button" style="flex: 1;">Fast</button>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🎨 Visual Effects</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button breakout-fx-minimal" type="button" style="flex: 1;">Minimal</button>
            <button class="button breakout-fx-normal" type="button" style="flex: 1;">Normal</button>
            <button class="button breakout-fx-max" type="button" style="flex: 1;">Maximum</button>
          </div>
        </div>
        
        <button class="button primary breakout-settings-close" type="button" style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #ea580c, #dc2626);">
          Close Settings
        </button>
      </div>
  `;
  document.body.appendChild(settingsModal);

  // Get high score for start screen
  const HS_KEY = 'breakout';
  let best = getHighScore(HS_KEY);

  // Start Screen - Fullscreen Overlay
  const startScreen = document.createElement('div');
  startScreen.className = 'breakout-start-screen';
  startScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #7c2d12 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
  `;
  startScreen.innerHTML = `
      <div style="
        text-align: center;
        max-width: 500px;
        padding: 2rem;
        background: rgba(124, 45, 18, 0.8);
        border-radius: 20px;
        border: 2px solid #ea580c;
        box-shadow: 0 0 40px rgba(234, 88, 12, 0.3);
      ">
        <div style="font-size: 4rem; margin-bottom: 0.5rem; animation: bounce 1s infinite;">
          🧱🎮
        </div>
        <h1 style="
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #ea580c, #fb923c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        ">Brick Blaster</h1>
        <p style="color: #fed7aa; margin-bottom: 2rem; font-size: 1.1rem;">
          Break All The Bricks!
        </p>
        
        <div style="
          background: rgba(124, 45, 18, 0.6);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
          border: 1px solid rgba(234, 88, 12, 0.2);
        ">
          <h3 style="color: #ea580c; margin-bottom: 1rem; font-size: 1.2rem;">🎮 How to Play</h3>
          <ul style="color: #cbd5e1; list-style: none; padding: 0; line-height: 1.8;">
            <li>⬅️➡️ Arrow keys or A/D to move</li>
            <li>🎯 Break all bricks to advance</li>
            <li>⚡ Collect power-ups for bonuses</li>
            <li>🎪 Space to start each level</li>
          </ul>
        </div>

        <div style="
          background: rgba(234, 88, 12, 0.1);
          border: 1px solid #ea580c;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          text-align: center;
          margin-bottom: 1.5rem;
        ">
          <div style="color: #ea580c; font-weight: bold; font-size: 1.5rem;">${best}</div>
          <div style="color: #64748b; font-size: 0.85rem;">Best Score</div>
        </div>

        <button class="breakout-start-btn button primary" type="button" style="
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #ea580c, #dc2626);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: pulse 2s infinite;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(234, 88, 12, 0.5)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
          🎮 Start Game
        </button>

        <button class="breakout-start-settings-btn button secondary" type="button" style="
          width: 100%;
          margin-top: 0.75rem;
          padding: 0.875rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          background: rgba(100, 116, 139, 0.3);
          border: 1px solid #64748b;
          border-radius: 12px;
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.background='rgba(100, 116, 139, 0.5)'; this.style.borderColor='#94a3b8'" onmouseout="this.style.background='rgba(100, 116, 139, 0.3)'; this.style.borderColor='#64748b'">
          ⚙️ Settings
        </button>

        <button class="breakout-start-hub-btn button secondary" type="button" style="
          width: 100%;
          margin-top: 0.75rem;
          padding: 0.875rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          background: rgba(239, 68, 68, 0.3);
          border: 1px solid #ef4444;
          border-radius: 12px;
          color: #fca5a5;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.background='rgba(239, 68, 68, 0.5)'; this.style.borderColor='#f87171'" onmouseout="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'">
          🏠 Back to Hub
        </button>
      </div>
  `;
  document.body.appendChild(startScreen);

  const startBtn = startScreen.querySelector('.breakout-start-btn');

  // Scroll indicator for start screen
  const startScrollIndicator = document.createElement('div');
  startScrollIndicator.className = 'breakout-scroll-indicator';
  startScrollIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(234, 88, 12, 0.9);
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
      canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  document.body.appendChild(startScrollIndicator);

  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const title = document.createElement('span');
  title.className = 'badge';
  title.textContent = 'Brick Blaster — Move: Arrow keys or A/D, Start: Space';

  const statusEl = document.createElement('span');
  statusEl.className = 'badge';

  const scoreEl = document.createElement('span');
  scoreEl.className = 'badge';
  scoreEl.textContent = 'Score: 0';

  const bestEl = document.createElement('span');
  bestEl.className = 'badge';
  bestEl.textContent = 'Best: 0';

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'button';
  pauseBtn.textContent = 'Pause';
  pauseBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const reviveBtn = document.createElement('button');
  reviveBtn.className = 'button';
  reviveBtn.textContent = 'Revive';
  reviveBtn.style.display = 'none';

  const tutorialBtn = document.createElement('button');
  tutorialBtn.className = 'button';
  tutorialBtn.textContent = '🎓 Tutorial';
  tutorialBtn.title = 'Forgot how to play? Try the tutorial again!';
  tutorialBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #ea580c, #dc2626);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'button';
  settingsBtn.textContent = '⚙️ Settings';
  settingsBtn.title = 'Customize your game!';
  settingsBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const hubBtn = document.createElement('button');
  hubBtn.className = 'button';
  hubBtn.textContent = '🏠 Hub';
  hubBtn.title = 'Back to Game Hub';
  hubBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
  `;

  toolbar.append(title, statusEl, scoreEl, bestEl, pauseBtn, settingsBtn, tutorialBtn, reviveBtn, hubBtn);

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1000;
  canvas.height = 700;
  canvasWrap.appendChild(canvas);

  // Per-game fullscreen button (targets just this game area)
  if (window.playBoxCreateFullscreenButton) {
    const fsBtn = window.playBoxCreateFullscreenButton(canvasWrap);
    if (fsBtn) toolbar.appendChild(fsBtn);
  }

  wrap.append(toolbar, canvasWrap);
  root.appendChild(wrap);

  // Settings state (load from localStorage or defaults)
  let paddleSizeSetting = localStorage.getItem('breakout-paddle-size') || 'normal';
  let ballSpeedSetting = localStorage.getItem('breakout-ball-speed') || 'normal';
  let visualFxSetting = localStorage.getItem('breakout-visual-fx') || 'normal';
  let difficulty = localStorage.getItem('breakout-difficulty') || 'medium';

  function applyBreakoutSettings() {
    // Apply paddle size
    const paddleSizes = { small: 90, normal: 120, large: 160 };
    paddle.baseWidth = paddleSizes[paddleSizeSetting];
    paddle.width = paddle.baseWidth;

    // Update button states in modal
    settingsModal.querySelectorAll('.breakout-diff-easy, .breakout-diff-medium, .breakout-diff-hard, .breakout-diff-chaos').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.breakout-diff-${difficulty}`)?.classList.add('primary');

    settingsModal.querySelectorAll('.breakout-paddle-small, .breakout-paddle-normal, .breakout-paddle-large').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.breakout-paddle-${paddleSizeSetting}`)?.classList.add('primary');

    settingsModal.querySelectorAll('.breakout-speed-slow, .breakout-speed-normal, .breakout-speed-fast').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.breakout-speed-${ballSpeedSetting}`)?.classList.add('primary');

    settingsModal.querySelectorAll('.breakout-fx-minimal, .breakout-fx-normal, .breakout-fx-max').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.breakout-fx-${visualFxSetting}`)?.classList.add('primary');
  }

  // Settings button click handler
  settingsBtn.addEventListener('click', () => {
    sound.playClick();
    // Auto-pause when opening settings
    if (running && gameState === 'playing') {
      running = false;
      isPaused = true;
      pauseBtn.textContent = 'Resume';
    }
    settingsModal.classList.remove('hidden');
    settingsModal.style.display = 'flex';
    applyBreakoutSettings();
    // Auto-scroll up to settings modal when accessed from game toolbar
    setTimeout(() => {
      settingsModal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  // Settings modal event listeners
  settingsModal.querySelector('.breakout-settings-close').addEventListener('click', () => {
    sound.playClick();
    settingsModal.classList.add('hidden');
    settingsModal.style.display = 'none';
    // Scroll back to game
    setTimeout(() => {
      canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  // Difficulty buttons
  ['easy', 'medium', 'hard', 'chaos'].forEach(diff => {
    settingsModal.querySelector(`.breakout-diff-${diff}`).addEventListener('click', () => {
      sound.playClick();
      difficulty = diff;
      localStorage.setItem('breakout-difficulty', diff);
      applyBreakoutSettings();
      // Reset game on difficulty change
      lives = 3;
      level = 1;
      resetScore();
      initLevel(level);
      running = false;
      isPaused = false;
      pauseBtn.textContent = 'Pause';
      gameState = 'ready';
      updateStatus();
    });
  });

  // Paddle size buttons
  ['small', 'normal', 'large'].forEach(size => {
    settingsModal.querySelector(`.breakout-paddle-${size}`).addEventListener('click', () => {
      sound.playClick();
      paddleSizeSetting = size;
      localStorage.setItem('breakout-paddle-size', size);
      applyBreakoutSettings();
    });
  });

  // Ball speed buttons
  ['slow', 'normal', 'fast'].forEach(speed => {
    settingsModal.querySelector(`.breakout-speed-${speed}`).addEventListener('click', () => {
      sound.playClick();
      ballSpeedSetting = speed;
      localStorage.setItem('breakout-ball-speed', speed);
      applyBreakoutSettings();
    });
  });

  // Visual FX buttons
  ['minimal', 'normal', 'max'].forEach(fx => {
    settingsModal.querySelector(`.breakout-fx-${fx}`).addEventListener('click', () => {
      sound.playClick();
      visualFxSetting = fx;
      localStorage.setItem('breakout-visual-fx', fx);
      applyBreakoutSettings();
    });
  });

  // Tutorial System for First-Time Players
  const TUTORIAL_KEY = 'breakout-tutorial-completed';
  const hasCompletedTutorial = localStorage.getItem(TUTORIAL_KEY) === 'true';
  
  let tutorialActive = false;
  let tutorialStep = 0;
  let tutorialOverlay = null;

  function showTutorial() {
    // Create tutorial overlay
    tutorialOverlay = document.createElement('div');
    tutorialOverlay.className = 'breakout-tutorial-overlay';
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
    tutorialBox.className = 'breakout-tutorial-box';
    tutorialBox.style.cssText = `
      max-width: 600px;
      background: linear-gradient(135deg, #7c2d12, #9a3412);
      padding: 2.5rem;
      border-radius: 20px;
      border: 3px solid #ea580c;
      box-shadow: 0 0 50px rgba(234, 88, 12, 0.5);
      text-align: center;
      pointer-events: auto;
      position: relative;
      z-index: 3001;
    `;

    tutorialBox.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
      <h2 style="color: #ea580c; font-size: 2rem; margin-bottom: 1rem;">Welcome to Brick Blaster!</h2>
      <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
        ${hasCompletedTutorial ? 'Let\'s review how to play!' : 'This is your first time playing! Would you like a quick tutorial to learn how to play?'}
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button class="breakout-tutorial-start button" style="
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #ea580c, #dc2626);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          font-weight: bold;
        ">📚 Start Tutorial</button>
        <button class="breakout-tutorial-skip button" style="
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
        message: 'Use <strong>Left/Right Arrow Keys</strong> or <strong>A/D</strong> to move the paddle.<br><br>Press <strong>Space</strong> to launch the ball!',
        highlight: canvasWrap,
        waitForKey: false
      },
      {
        title: '🧱 Break Bricks',
        message: 'Bounce the ball off your paddle to break all the bricks!<br><br>Each brick you break earns points.',
        highlight: canvasWrap,
        waitForKey: false
      },
      {
        title: '⚡ Power-Ups',
        message: 'Some bricks drop <strong>power-ups</strong> when broken!<br><br>Catch them with your paddle for special abilities like extra balls or larger paddle.',
        highlight: canvasWrap,
        waitForKey: false
      },
      {
        title: '💣 Explosion Charges',
        message: 'Yellow power-ups give you <strong>explosion charges</strong>!<br><br>Press <strong>E</strong> to create an explosion that clears nearby bricks.',
        highlight: null,
        waitForKey: false
      },
      {
        title: '💔 Lives',
        message: 'You have <strong>3 lives</strong>. If the ball falls off the bottom, you lose one life.<br><br>When you run out of lives, it\'s game over!',
        highlight: statusEl,
        waitForKey: false
      },
      {
        title: '⚙️ Settings',
        message: 'Click <strong>Settings</strong> to customize your game!<br><br>Change <strong>difficulty</strong>, paddle size, ball speed, and visual effects!',
        highlight: settingsBtn,
        waitForKey: false
      },
      {
        title: '🎉 Ready to Play!',
        message: 'Clear all bricks to advance to the next level!<br><br>Press <strong>Space</strong> to start each level. Good luck! 🧱',
        highlight: null,
        waitForKey: false
      }
    ];

    let currentStep = 0;

    function showTutorialStep(stepIndex) {
      if (stepIndex >= tutorialSteps.length) {
        completeTutorial();
        return;
      }

      const step = tutorialSteps[stepIndex];
      tutorialBox.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">${step.title.split(' ')[0]}</div>
        <h2 style="color: #ea580c; font-size: 1.8rem; margin-bottom: 1rem;">${step.title.substring(step.title.indexOf(' ') + 1)}</h2>
        <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
          ${step.message}
        </p>
        <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
          Step ${stepIndex + 1} of ${tutorialSteps.length}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          ${stepIndex < tutorialSteps.length - 1 ? 
            '<button class="breakout-tutorial-next button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #ea580c, #dc2626); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Next ➡️</button>' :
            '<button class="breakout-tutorial-finish button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #ea580c, #dc2626); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Finish Tutorial 🎉</button>'
          }
          <button class="breakout-tutorial-skip-all button" style="padding: 0.75rem 1.5rem; font-size: 1rem; background: rgba(100, 116, 139, 0.3); border: 2px solid #64748b; border-radius: 12px; color: #cbd5e1; cursor: pointer;">Skip All</button>
        </div>
      `;

      // Highlight element if specified
      document.querySelectorAll('.breakout-tutorial-highlight').forEach(el => el.remove());
      if (step.highlight) {
        const highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'breakout-tutorial-highlight';
        const rect = step.highlight.getBoundingClientRect();
        highlightOverlay.style.cssText = `
          position: fixed;
          top: ${rect.top - 10}px;
          left: ${rect.left - 10}px;
          width: ${rect.width + 20}px;
          height: ${rect.height + 20}px;
          border: 3px solid #ea580c;
          border-radius: 15px;
          box-shadow: 0 0 30px rgba(234, 88, 12, 0.6);
          pointer-events: none;
          z-index: 2999;
          animation: pulse 2s infinite;
        `;
        document.body.appendChild(highlightOverlay);
      }

      // Add event listeners
      const nextBtn = tutorialBox.querySelector('.breakout-tutorial-next');
      const finishBtn = tutorialBox.querySelector('.breakout-tutorial-finish');
      const skipAllBtn = tutorialBox.querySelector('.breakout-tutorial-skip-all');

      if (nextBtn) {
        nextBtn.onclick = () => {
          sound.playClick();
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
    }

    function completeTutorial() {
      if (!hasCompletedTutorial) {
        localStorage.setItem(TUTORIAL_KEY, 'true');
      }
      if (tutorialOverlay) tutorialOverlay.remove();
      document.querySelectorAll('.breakout-tutorial-highlight').forEach(el => el.remove());
      tutorialActive = false;
      // Scroll back to game after closing tutorial
      setTimeout(() => {
        canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }

    // Tutorial button handlers
    const startTutorialBtn = tutorialBox.querySelector('.breakout-tutorial-start');
    const skipTutorialBtn = tutorialBox.querySelector('.breakout-tutorial-skip');

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

  // Show tutorial for first-time users
  if (!hasCompletedTutorial) {
    showTutorial();
  }

  // Tutorial button click handler
  tutorialBtn.addEventListener('click', () => {
    sound.playClick();
    showTutorial();
  });

  // Hub button handler
  hubBtn.addEventListener('click', () => {
    sound.playClick();
    location.hash = '#/';
  });

  // Pause button handler
  pauseBtn.addEventListener('click', () => {
    sound.playClick();
    if (gameState === 'playing' || (gameState === 'ready' && running)) {
      if (isPaused) {
        running = true;
        isPaused = false;
        pauseBtn.textContent = 'Pause';
      } else {
        running = false;
        isPaused = true;
        pauseBtn.textContent = 'Resume';
      }
    }
  });

  // === Game State ===
  const paddle = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 30,
    width: 120,
    height: 15,
    speed: 7,
    dx: 0,
    baseWidth: 120,
    enlargeTimer: 0,
  };

  // Apply initial settings after paddle is created
  applyBreakoutSettings();

  const BALL_SPEED = 4;
  let balls = [];
  let bricks = [];
  let powerUps = [];

  let lives = 3;
  let level = 1;
  const MAX_LEVEL = 15;
  let running = false;
  let isPaused = false;
  let explosionCharges = 0;
  let score = 0;

  // Variables already declared at top for start screen
  bestEl.textContent = 'Best: ' + best;

  function resetScore() {
    score = 0;
    scoreEl.textContent = 'Score: 0';
    best = getHighScore(HS_KEY);
    bestEl.textContent = 'Best: ' + best;
  }

  function addScore(delta) {
    if (!delta) return;
    score += delta;
    scoreEl.textContent = 'Score: ' + score;
    const updated = updateHighScore(HS_KEY, score);
    if (updated !== best) {
      best = updated;
      bestEl.textContent = 'Best: ' + best;
    }
  }
  // gameState: 'ready' | 'playing' | 'gameover' | 'win'
  let gameState = 'ready';

  const POWERUP_TYPES = ['multiball', 'explosion', 'enlarge'];

  const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    a: false,
    d: false,
  };

  function updateStatus() {
    const bigSecs = Math.max(0, Math.ceil(paddle.enlargeTimer / 1000));
    const bigLabel = bigSecs > 0 ? `${bigSecs}s` : 'off';
    statusEl.textContent = `Level: ${level}/${MAX_LEVEL} | Lives: ${lives} | Explosions: ${explosionCharges} | Big paddle: ${bigLabel}`;
  }

  // Ball factory
  function createBall(x, y) {
    const angle = (Math.random() * 0.6 + 0.2) * Math.PI;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const speedMultipliers = { slow: 0.75, normal: 1, fast: 1.35 };
    const speedMult = speedMultipliers[ballSpeedSetting] || 1;
    return {
      x,
      y,
      radius: 8,
      dx: BALL_SPEED * Math.cos(angle) * dir * speedMult,
      dy: -BALL_SPEED * Math.sin(angle) * speedMult,
    };
  }

  function resetBalls() {
    balls = [createBall(canvas.width / 2, canvas.height - 60)];
  }

  // Level / bricks
  function initLevel(n) {
    bricks = [];
    powerUps = [];
    resetBalls();
    reviveBtn.style.display = 'none';

    const baseRows = 3 + Math.min(n, 8);
    const baseCols = 8 + Math.floor(n / 2);

    let rows = baseRows;
    let cols = baseCols;
    let powerChance = 0.15;
    let holeChance = 0.3;

    if (difficulty === 'easy') {
      rows = Math.max(3, baseRows - 2);
      cols = baseCols - 1;
      powerChance = 0.12;
      holeChance = 0.45; // more gaps, fewer bricks
    } else if (difficulty === 'hard') {
      rows = baseRows + 1;
      cols = baseCols + 1;
      powerChance = 0.2;
      holeChance = 0.2;
    } else if (difficulty === 'chaos') {
      rows = baseRows + 1;
      cols = baseCols;
      powerChance = 1; // every brick is a power-up
      holeChance = 0.1; // mostly filled wall
    }

    const brickWidth = canvas.width / cols;
    const brickHeight = 20;
    const topOffset = 60;
    const gap = 2;

    for (let r = 0; r < rows; r++) {
      bricks[r] = [];
      for (let c = 0; c < cols; c++) {
        // random gaps pattern, scaled by level and difficulty
        if ((r + c + n) % 3 === 0 && n > 3 && Math.random() < holeChance) {
          bricks[r][c] = null;
          continue;
        }
        const hasPower = difficulty === 'chaos' ? true : Math.random() < powerChance;
        const type = hasPower
          ? POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]
          : null;
        bricks[r][c] = {
          x: c * brickWidth + gap / 2,
          y: topOffset + r * (brickHeight + gap),
          width: brickWidth - gap,
          height: brickHeight - gap,
          alive: true,
          hasPowerUp: hasPower,
          powerType: type,
          row: r,
          col: c,
        };
      }
    }

    paddle.x = canvas.width / 2 - paddle.baseWidth / 2;
    paddle.width = paddle.baseWidth;
    paddle.enlargeTimer = 0;
    explosionCharges = 0;
    running = false;
    gameState = 'ready';
    updateStatus();
  }

  // Power-ups
  function spawnPowerUp(brick) {
    powerUps.push({
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height / 2,
      radius: 10,
      dy: 2,
      type: brick.powerType,
    });
  }

  function applyPowerUp(type) {
    if (type === 'multiball') {
      const baseX = paddle.x + paddle.width / 2;
      const baseY = paddle.y - 10;
      balls.push(createBall(baseX, baseY));
      balls.push(createBall(baseX, baseY));
    } else if (type === 'explosion') {
      explosionCharges++;
    } else if (type === 'enlarge') {
      paddle.width = paddle.baseWidth * 1.8;
      paddle.enlargeTimer = 10000;
    }
    sound.playScore();
  }

  function explodeAround(row, col) {
    if (!bricks[row]) return;
    const maxR = bricks.length;
    const maxC = bricks[0].length;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = row + dr;
        const cc = col + dc;
        if (rr >= 0 && rr < maxR && cc >= 0 && cc < maxC) {
          const b = bricks[rr][cc];
          if (b && b.alive) {
            b.alive = false;
            addScore(6);
            if (b.hasPowerUp) spawnPowerUp(b);
          }
        }
      }
    }
  }

  // Collision helpers
  function rectCircleCollide(circle, rect) {
    const distX = Math.abs(circle.x - (rect.x + rect.width / 2));
    const distY = Math.abs(circle.y - (rect.y + rect.height / 2));

    if (distX > rect.width / 2 + circle.radius) return false;
    if (distY > rect.height / 2 + circle.radius) return false;

    if (distX <= rect.width / 2) return true;
    if (distY <= rect.height / 2) return true;

    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  // Input
  function onKeyDown(e) {
    const k = e.key;
    const handled = k === 'ArrowLeft' || k === 'ArrowRight' || e.code === 'Space';
    if (handled) {
      // prevent the page from scrolling when using keyboard controls
      e.preventDefault();
    }

    if (e.code === 'Space') {
      // ignore auto-repeat when holding Space so it only triggers once per press
      if (e.repeat) return;
      if (gameState === 'ready') {
        running = true;
        gameState = 'playing';
      } else if (gameState === 'gameover' || gameState === 'win') {
        // restart from the beginning
        lives = 3;
        level = 1;
        resetScore();
        initLevel(level);
        running = false;
        gameState = 'ready';
      }
    }
    if (k in keys) {
      keys[k] = true;
    }
  }

  function onKeyUp(e) {
    if (e.key in keys) {
      keys[e.key] = false;
    }
  }

  // Start screen button
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      sound.playClick();
      if (startScreen) startScreen.remove();
      if (startScrollIndicator) startScrollIndicator.remove();
      // Scroll to game window
      setTimeout(() => {
        canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });
  }

  // Settings button handler from start screen
  const startScreenSettingsBtn = startScreen.querySelector('.breakout-start-settings-btn');
  if (startScreenSettingsBtn) {
    startScreenSettingsBtn.addEventListener('click', () => {
      sound.playClick();
      if (startScreen) startScreen.remove();
      if (startScrollIndicator) startScrollIndicator.remove();
      settingsModal.classList.remove('hidden');
      settingsModal.style.display = 'flex';
    });
  }

  // Hub button handler from start screen
  const startScreenHubBtn = startScreen.querySelector('.breakout-start-hub-btn');
  if (startScreenHubBtn) {
    startScreenHubBtn.addEventListener('click', () => {
      sound.playClick();
      if (startScreen) startScreen.remove();
      if (startScrollIndicator) startScrollIndicator.remove();
      location.hash = '#/';
    });
  }

  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);

  // Game loop
  let lastTime = performance.now();
  let animationId = null;

  function update(delta) {
    // Don't update game if paused
    if (isPaused) return;

    if (!running && gameState === 'ready') {
      balls.forEach((b) => {
        b.x = paddle.x + paddle.width / 2;
        b.y = paddle.y - 20;
      });
    }

    // Paddle movement
    let move = 0;
    if (keys.ArrowLeft || keys.a) move -= 1;
    if (keys.ArrowRight || keys.d) move += 1;
    paddle.dx = move * paddle.speed;
    paddle.x += paddle.dx;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) {
      paddle.x = canvas.width - paddle.width;
    }

    if (paddle.enlargeTimer > 0) {
      paddle.enlargeTimer -= delta;
      if (paddle.enlargeTimer <= 0) {
        paddle.width = paddle.baseWidth;
      }
    }

    if (running) {
      // Update balls
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collisions
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.dx *= -1;
        }
        if (ball.x + ball.radius > canvas.width) {
          ball.x = canvas.width - ball.radius;
          ball.dx *= -1;
        }
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.dy *= -1;
        }

        // Bottom
        if (ball.y - ball.radius > canvas.height) {
          balls.splice(i, 1);
        }
      }

      if (balls.length === 0) {
        lives--;

        if (lives <= 0) {
          // show game over screen; restart on Space or Revive
          gameState = 'gameover';
          running = false;
          sound.playGameOver();
          updateStatus();
          // Only allow revives starting after level 4
          if (level > 4 && window.playBoxGetRevives && window.playBoxUseRevive) {
            const left = window.playBoxGetRevives();
            if (left > 0) {
              reviveBtn.style.display = '';
              reviveBtn.textContent = `Revive (${left} left)`;
            }
          }
          return;
        }
        // lost a life: reset current level and wait for Space
        initLevel(level);
        running = false;
        gameState = 'ready';
        sound.playLose();
        updateStatus();
        return;
      }

      // Paddle collisions
      balls.forEach((ball) => {
        if (rectCircleCollide(ball, paddle) && ball.dy > 0) {
          ball.y = paddle.y - ball.radius;
          const hitPos = (ball.x - paddle.x) / paddle.width - 0.5;
          ball.dx = BALL_SPEED * hitPos * 2.2;
          ball.dy = -Math.abs(ball.dy);
          sound.playMove();
        }
      });

      // Brick collisions
      let bricksRemaining = 0;
      for (let r = 0; r < bricks.length; r++) {
        for (let c = 0; c < bricks[r].length; c++) {
          const brick = bricks[r][c];
          if (!brick || !brick.alive) continue;
          bricksRemaining++;
          balls.forEach((ball) => {
            if (rectCircleCollide(ball, brick)) {
              ball.dy *= -1;
              brick.alive = false;
              addScore(10);
              sound.playScore();
              if (brick.hasPowerUp) {
                spawnPowerUp(brick);
              }
              if (explosionCharges > 0) {
                explosionCharges--;
                explodeAround(brick.row, brick.col);
              }
            }
          });
        }
      }

      // Power-up movement and collection
      for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        p.y += p.dy;
        if (p.y - p.radius > canvas.height) {
          powerUps.splice(i, 1);
          continue;
        }
        const asRect = {
          x: p.x - p.radius,
          y: p.y - p.radius,
          width: p.radius * 2,
          height: p.radius * 2,
        };
        if (rectCircleCollide({ x: p.x, y: p.y, radius: p.radius }, paddle)) {
          applyPowerUp(p.type);
          powerUps.splice(i, 1);
        }
      }

      // Level complete
      if (bricksRemaining === 0) {
        if (level >= MAX_LEVEL) {
          // all levels beaten; show win screen
          gameState = 'win';
          running = false;
          sound.playWin();
          updateStatus();
          return;
        }
        level++;
        initLevel(level);
        running = false;
        gameState = 'ready';
        updateStatus();
        return;
      }
    }

    updateStatus();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bricks
    for (let r = 0; r < bricks.length; r++) {
      for (let c = 0; c < bricks[r].length; c++) {
        const brick = bricks[r][c];
        if (!brick || !brick.alive) continue;
        const hue = (r * 20 + level * 10) % 360;
        ctx.fillStyle = `hsl(${hue},70%,50%)`;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        if (brick.hasPowerUp) {
          ctx.fillStyle = '#000';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let text = '?';
          if (brick.powerType === 'multiball') text = '+2';
          else if (brick.powerType === 'explosion') text = 'X';
          else if (brick.powerType === 'enlarge') text = '↔';
          ctx.fillText(text, brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
      }
    }

    // Power-ups
    powerUps.forEach((p) => {
      if (p.type === 'multiball') ctx.fillStyle = '#0ff';
      else if (p.type === 'explosion') ctx.fillStyle = '#f00';
      else if (p.type === 'enlarge') ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Paddle on top of everything else
    ctx.fillStyle = '#0f0';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Balls above paddle
    ctx.fillStyle = '#fff';
    balls.forEach((ball) => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI overlays for states
    if (gameState !== 'playing') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';

      let main = '';
      let sub = '';
      if (gameState === 'ready') {
        main = `Level ${level}`;
        sub = 'Press Space to start';
      } else if (gameState === 'gameover') {
        main = 'Game Over';
        sub = 'Press Space to restart';
      } else if (gameState === 'win') {
        main = 'You beat all levels!';
        sub = 'Press Space to play again';
      }

      ctx.font = '28px sans-serif';
      ctx.fillText(main, canvas.width / 2, canvas.height / 2 - 16);
      ctx.font = '20px sans-serif';
      ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 16);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  initLevel(level);
  resetScore();
  updateStatus();

  // Scroll indicator logic
  function updateScrollIndicators() {
    const scrollY = window.scrollY || window.pageYOffset;
    if (startScrollIndicator) {
      if (scrollY > 100) {
        startScrollIndicator.textContent = '⬆️ Scroll Up to Start';
      } else {
        startScrollIndicator.textContent = '⬇️ Scroll Down to Game';
      }
    }
  }

  window.addEventListener('scroll', updateScrollIndicators);
  updateScrollIndicators();

  reviveBtn.addEventListener('click', () => {
    if (!(window.playBoxUseRevive && window.playBoxGetRevives)) return;
    let ok = window.playBoxUseRevive();
    if (!ok) {
      if (window.playBoxPromptRevivePurchase && window.playBoxPromptRevivePurchase()) {
        ok = window.playBoxUseRevive();
      }
      if (!ok) {
        reviveBtn.style.display = 'none';
        alert('No revives left.');
        return;
      }
    }
    sound.playClick();
    // Restore 1 life and restart current level, keeping score and level.
    lives = 1;
    initLevel(level);
    updateStatus();
  });

  animationId = requestAnimationFrame(loop);

  return () => {
    if (animationId != null) cancelAnimationFrame(animationId);
    removeEventListener('keydown', onKeyDown);
    removeEventListener('keyup', onKeyUp);
    wrap.remove();
  };
}
