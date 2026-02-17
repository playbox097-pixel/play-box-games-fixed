// games/tetris.js
// Vanilla JS Tetris with difficulty (easy / normal / hard / chaos), hold, and pause

import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'tetris';

  // Settings modal (created early like Snake)
  const settingsModal = document.createElement('div');
  settingsModal.className = 'tetris-settings-modal hidden';
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
        background: linear-gradient(135deg, #1e1b4b, #312e81);
        padding: 2rem;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        border: 2px solid #7c3aed;
        box-shadow: 0 0 40px rgba(124, 58, 237, 0.3);
      ">
        <h2 style="color: #7c3aed; margin-bottom: 1.5rem; text-align: center;">⚙️ Game Settings</h2>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🎨 Block Theme</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
            <button class="button tetris-theme-classic" type="button" style="background: linear-gradient(135deg, #7c3aed, #6366f1);">Classic</button>
            <button class="button tetris-theme-neon" type="button" style="background: linear-gradient(135deg, #ec4899, #8b5cf6);">Neon</button>
            <button class="button tetris-theme-retro" type="button" style="background: linear-gradient(135deg, #10b981, #3b82f6);">Retro</button>
            <button class="button tetris-theme-dark" type="button" style="background: linear-gradient(135deg, #374151, #1f2937);">Dark</button>
          </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🎵 Ghost Piece</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button tetris-ghost-on" type="button" style="flex: 1;">Show</button>
            <button class="button tetris-ghost-off" type="button" style="flex: 1;">Hide</button>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🔳 Grid Lines</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button tetris-grid-on" type="button" style="flex: 1;">Show</button>
            <button class="button tetris-grid-off" type="button" style="flex: 1;">Hide</button>
          </div>
        </div>
        
        <button class="button primary tetris-settings-close" type="button" style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #7c3aed, #6366f1);">
          Close Settings
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(settingsModal);

  // Get high score for start screen
  const HS_KEY = 'tetris';
  let highScore = getHighScore(HS_KEY);

  // Start Screen - Fullscreen Overlay
  const startScreen = document.createElement('div');
  startScreen.className = 'tetris-start-screen';
  startScreen.innerHTML = `
    <div class="tetris-start-panel" style="
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #1e1b4b 100%);
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
        background: rgba(30, 27, 75, 0.8);
        border-radius: 20px;
        border: 2px solid #7c3aed;
        box-shadow: 0 0 40px rgba(124, 58, 237, 0.3);
      ">
        <div style="font-size: 4rem; margin-bottom: 0.5rem; animation: bounce 1s infinite;">
          🟦🟨
        </div>
        <h1 style="
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        ">Block Rush</h1>
        <p style="color: #ddd6fe; margin-bottom: 2rem; font-size: 1.1rem;">
          Stack & Clear Lines!
        </p>
        
        <div style="
          background: rgba(30, 27, 75, 0.6);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
          border: 1px solid rgba(124, 58, 237, 0.2);
        ">
          <h3 style="color: #7c3aed; margin-bottom: 1rem; font-size: 1.2rem;">🎮 How to Play</h3>
          <ul style="color: #cbd5e1; list-style: none; padding: 0; line-height: 1.8;">
            <li>⬅️➡️ Arrows to move & rotate</li>
            <li>⬇️ Down to drop faster</li>
            <li>🚀 Space for hard drop</li>
            <li>🔄 Shift to hold piece</li>
            <li>⏸️ P to pause game</li>
          </ul>
        </div>

        <div style="
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid #7c3aed;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          text-align: center;
          margin-bottom: 1.5rem;
        ">
          <div style="color: #7c3aed; font-weight: bold; font-size: 1.5rem;">${highScore}</div>
          <div style="color: #64748b; font-size: 0.85rem;">Best Score</div>
        </div>

        <button class="tetris-start-btn button primary" type="button" style="
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: pulse 2s infinite;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(124, 58, 237, 0.5)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
          🎮 Start Game
        </button>

        <button class="tetris-start-settings-btn button secondary" type="button" style="
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

        <button class="tetris-start-hub-btn button secondary" type="button" style="
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
    </div>
  `;
  document.body.appendChild(startScreen);

  const startBtn = startScreen.querySelector('.tetris-start-btn');

  // Scroll indicator for start screen
  const startScrollIndicator = document.createElement('div');
  startScrollIndicator.className = 'tetris-scroll-indicator';
  startScrollIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(124, 58, 237, 0.9);
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
      layout.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  document.body.appendChild(startScrollIndicator);

  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const title = badge('Block Rush — Arrows to move/rotate, Space = hard drop, Shift = hold, P = pause');
  const statusEl = badge('Score: 0 | Lines: 0 | Level: 1');
  const highLabel = badge('Best: 0');
  const diffLabel = badge('Difficulty: Normal');

  // Difficulty buttons
  const diffBar = document.createElement('div');
  diffBar.style.display = 'flex';
  diffBar.style.gap = '4px';

  const difficultyNames = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
    chaos: 'Chaos',
  };

  let difficulty = 'normal';
  const diffButtons = {};
  ['easy', 'normal', 'hard', 'chaos'].forEach((d) => {
    const btn = document.createElement('button');
    btn.className = 'button';
    btn.textContent = difficultyNames[d];
    if (d === difficulty) btn.classList.add('primary');
    btn.addEventListener('click', () => {
      difficulty = d;
      Object.entries(diffButtons).forEach(([name, el]) => {
        el.classList.toggle('primary', name === difficulty);
      });
      diffLabel.textContent = 'Difficulty: ' + difficultyNames[difficulty];
      setDropIntervalForDifficulty();
      resetGame();
    });
    diffButtons[d] = btn;
    diffBar.appendChild(btn);
  });

  const holdBtn = document.createElement('button');
  holdBtn.className = 'button';
  holdBtn.textContent = 'Hold piece';

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'button';
  pauseBtn.textContent = 'Pause';

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
    background: linear-gradient(135deg, #7c3aed, #6366f1);
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

  toolbar.append(title, statusEl, highLabel, diffLabel, diffBar, holdBtn, pauseBtn, settingsBtn, tutorialBtn, reviveBtn, hubBtn);

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const COLS = 10;
  const ROWS = 18; // Increased from 16
  const CELL = 35; // Increased from 30
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  canvasWrap.appendChild(canvas);

  // Simple hold / next display
  const sidePanel = document.createElement('div');
  sidePanel.style.display = 'grid';
  sidePanel.style.gap = '6px';

  const holdLabel = badge('Hold: —');
  const nextLabel = badge('Next: —');
  sidePanel.append(holdLabel, nextLabel);

  const layout = document.createElement('div');
  layout.className = 'tetris-layout';
  layout.append(canvasWrap, sidePanel);

  wrap.append(toolbar, layout);
  root.appendChild(wrap);

  // Settings state (load from localStorage or defaults)
  let blockTheme = localStorage.getItem('tetris-theme') || 'classic';
  let showGhost = localStorage.getItem('tetris-ghost') !== 'false';
  let showGrid = localStorage.getItem('tetris-grid') !== 'false';

  function applyTetrisSettings() {
    // Update button states in modal
    settingsModal.querySelectorAll('.tetris-theme-classic, .tetris-theme-neon, .tetris-theme-retro, .tetris-theme-dark').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.tetris-theme-${blockTheme}`)?.classList.add('primary');

    settingsModal.querySelectorAll('.tetris-ghost-on, .tetris-ghost-off').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.tetris-ghost-${showGhost ? 'on' : 'off'}`)?.classList.add('primary');

    settingsModal.querySelectorAll('.tetris-grid-on, .tetris-grid-off').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.tetris-grid-${showGrid ? 'on' : 'off'}`)?.classList.add('primary');
  }

  // Settings button click handler
  settingsBtn.addEventListener('click', () => {
    sound.playClick();
    // Auto-pause the game when opening settings
    if (!isPaused && !gameOver) {
      isPaused = true;
      pauseBtn.textContent = 'Resume';
    }
    settingsModal.style.display = 'flex';
    settingsModal.classList.remove('hidden');
    applyTetrisSettings();
    // Scroll to top of the settings panel
    setTimeout(() => {
      const panel = settingsModal.querySelector('div > div');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  });

  // Settings modal event listeners
  settingsModal.querySelector('.tetris-settings-close').addEventListener('click', () => {
    sound.playClick();
    settingsModal.classList.add('hidden');
    settingsModal.style.display = 'none';
    // Scroll back to game
    setTimeout(() => {
      layout.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  // Theme buttons
  ['classic', 'neon', 'retro', 'dark'].forEach(theme => {
    settingsModal.querySelector(`.tetris-theme-${theme}`).addEventListener('click', () => {
      sound.playClick();
      blockTheme = theme;
      localStorage.setItem('tetris-theme', theme);
      applyTetrisSettings();
    });
  });

  // Ghost piece buttons
  settingsModal.querySelector('.tetris-ghost-on').addEventListener('click', () => {
    sound.playClick();
    showGhost = true;
    localStorage.setItem('tetris-ghost', 'true');
    applyTetrisSettings();
  });
  settingsModal.querySelector('.tetris-ghost-off').addEventListener('click', () => {
    sound.playClick();
    showGhost = false;
    localStorage.setItem('tetris-ghost', 'false');
    applyTetrisSettings();
  });

  // Grid lines buttons
  settingsModal.querySelector('.tetris-grid-on').addEventListener('click', () => {
    sound.playClick();
    showGrid = true;
    localStorage.setItem('tetris-grid', 'true');
    applyTetrisSettings();
  });
  settingsModal.querySelector('.tetris-grid-off').addEventListener('click', () => {
    sound.playClick();
    showGrid = false;
    localStorage.setItem('tetris-grid', 'false');
    applyTetrisSettings();
  });

  // Apply initial settings
  applyTetrisSettings();

  // Tutorial System for First-Time Players
  const TUTORIAL_KEY = 'tetris-tutorial-completed';
  const hasCompletedTutorial = localStorage.getItem(TUTORIAL_KEY) === 'true';
  
  let tutorialActive = false;
  let tutorialStep = 0;
  let tutorialOverlay = null;

  function showTutorial() {
    // Create tutorial overlay
    tutorialOverlay = document.createElement('div');
    tutorialOverlay.className = 'tetris-tutorial-overlay';
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
    tutorialBox.className = 'tetris-tutorial-box';
    tutorialBox.style.cssText = `
      max-width: 600px;
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      padding: 2.5rem;
      border-radius: 20px;
      border: 3px solid #7c3aed;
      box-shadow: 0 0 50px rgba(124, 58, 237, 0.5);
      text-align: center;
      pointer-events: auto;
      position: relative;
      z-index: 3001;
    `;

    tutorialBox.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
      <h2 style="color: #7c3aed; font-size: 2rem; margin-bottom: 1rem;">Welcome to Block Rush!</h2>
      <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
        ${hasCompletedTutorial ? 'Let\'s review how to play!' : 'This is your first time playing! Would you like a quick tutorial to learn how to play?'}
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button class="tetris-tutorial-start button" style="
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          font-weight: bold;
        ">📚 Start Tutorial</button>
        <button class="tetris-tutorial-skip button" style="
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
        message: 'Use <strong>Left/Right Arrow Keys</strong> to move pieces.<br><br>Press <strong>Up Arrow</strong> to rotate pieces.<br><br>Press <strong>Down Arrow</strong> to drop faster!',
        highlight: canvasWrap,
        waitForKey: false
      },
      {
        title: '🚀 Hard Drop',
        message: 'Press <strong>Space</strong> for an instant hard drop!<br><br>The piece will slam down to the bottom immediately.',
        highlight: canvasWrap,
        waitForKey: false
      },
      {
        title: '🔄 Hold Piece',
        message: 'Press <strong>Shift</strong> or click <strong>Hold piece</strong> to swap the current piece with your held piece!<br><br>Use this strategically to save pieces for later.',
        highlight: holdBtn,
        waitForKey: false
      },
      {
        title: '📊 Clear Lines',
        message: 'Complete horizontal lines to clear them and score points!<br><br>Clear multiple lines at once for bonus points!',
        highlight: canvasWrap,
        waitForKey: false
      },
      {
        title: '⏸️ Pause',
        message: 'Press <strong>P</strong> or click <strong>Pause</strong> to pause the game anytime!<br><br>Take a break whenever you need it.',
        highlight: pauseBtn,
        waitForKey: false
      },
      {
        title: '⚙️ Difficulty Levels',
        message: 'Try different difficulty modes!<br><br><strong>Easy</strong>: Slower pace<br><strong>Normal</strong>: Balanced<br><strong>Hard</strong>: Faster drops<br><strong>Chaos</strong>: Random fast speed!',
        highlight: diffBar,
        waitForKey: false
      },
      {
        title: '🎉 Ready to Play!',
        message: 'Stack blocks and clear lines to score!<br><br>Game ends when blocks reach the top. Good luck! 🟦',
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
        <h2 style="color: #7c3aed; font-size: 1.8rem; margin-bottom: 1rem;">${step.title.substring(step.title.indexOf(' ') + 1)}</h2>
        <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
          ${step.message}
        </p>
        <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
          Step ${stepIndex + 1} of ${tutorialSteps.length}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          ${stepIndex < tutorialSteps.length - 1 ? 
            '<button class="tetris-tutorial-next button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #7c3aed, #6366f1); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Next ➡️</button>' :
            '<button class="tetris-tutorial-finish button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #7c3aed, #6366f1); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Finish Tutorial 🎉</button>'
          }
          <button class="tetris-tutorial-skip-all button" style="padding: 0.75rem 1.5rem; font-size: 1rem; background: rgba(100, 116, 139, 0.3); border: 2px solid #64748b; border-radius: 12px; color: #cbd5e1; cursor: pointer;">Skip All</button>
        </div>
      `;

      // Highlight element if specified
      document.querySelectorAll('.tetris-tutorial-highlight').forEach(el => el.remove());
      if (step.highlight) {
        const highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'tetris-tutorial-highlight';
        const rect = step.highlight.getBoundingClientRect();
        highlightOverlay.style.cssText = `
          position: fixed;
          top: ${rect.top - 10}px;
          left: ${rect.left - 10}px;
          width: ${rect.width + 20}px;
          height: ${rect.height + 20}px;
          border: 3px solid #7c3aed;
          border-radius: 15px;
          box-shadow: 0 0 30px rgba(124, 58, 237, 0.6);
          pointer-events: none;
          z-index: 2999;
          animation: pulse 2s infinite;
        `;
        document.body.appendChild(highlightOverlay);
      }

      // Add event listeners
      const nextBtn = tutorialBox.querySelector('.tetris-tutorial-next');
      const finishBtn = tutorialBox.querySelector('.tetris-tutorial-finish');
      const skipAllBtn = tutorialBox.querySelector('.tetris-tutorial-skip-all');

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
      document.querySelectorAll('.tetris-tutorial-highlight').forEach(el => el.remove());
      tutorialActive = false;
      // Scroll back to game after closing tutorial
      setTimeout(() => {
        layout.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }

    // Tutorial button handlers
    const startTutorialBtn = tutorialBox.querySelector('.tetris-tutorial-start');
    const skipTutorialBtn = tutorialBox.querySelector('.tetris-tutorial-skip');

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

  // ===== Game state =====
  const emptyRow = () => Array(COLS).fill(0);
  let board = Array.from({ length: ROWS }, emptyRow);

  const SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  };

  const COLORS = {
    I: '#6ea4ff',
    J: '#3458d6',
    L: '#ffb347',
    O: '#ffd93b',
    S: '#7bffb0',
    T: '#c77dff',
    Z: '#ff6e7b',
  };

  const TYPES = Object.keys(SHAPES);

  function randomType() {
    return TYPES[Math.floor(Math.random() * TYPES.length)];
  }

  let current = null; // {x,y,type,shape}
  let nextType = randomType();
  let holdType = null;
  let holdLocked = false; // can only hold once per piece drop
  let dropInterval = 600; // ms
  let lastDropTime = 0;
  let animationId = null;
  let running = true;
  let isPaused = false;
  let gameOver = false;
  let score = 0;
  let lines = 0;
  let level = 1;

  // Variables already declared at top for start screen
  let best = highScore;
  highLabel.textContent = 'Best: ' + best;

  function setDropIntervalForDifficulty() {
    if (difficulty === 'easy') dropInterval = 850;
    else if (difficulty === 'normal') dropInterval = 600;
    else if (difficulty === 'hard') dropInterval = 380;
    else if (difficulty === 'chaos') dropInterval = 240;
  }

  setDropIntervalForDifficulty();

  function updateStatus() {
    statusEl.textContent = `Score: ${score} | Lines: ${lines} | Level: ${level}` +
      (isPaused ? ' (Paused)' : gameOver ? ' (Game over)' : '');
  }

  function spawnPiece(fromType) {
    const type = fromType || nextType || randomType();
    const shape = SHAPES[type].map(row => row.slice());
    current = {
      type,
      shape,
      x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
      y: 0,
    };
    nextType = randomType();
    nextLabel.textContent = 'Next: ' + nextType;
    holdLocked = false;

    if (!isValidPosition(current.shape, current.x, current.y)) {
      gameOver = true;
      running = false;
      sound.playGameOver();
      if (window.playBoxGetRevives && window.playBoxUseRevive) {
        const left = window.playBoxGetRevives();
        if (left > 0) {
          reviveBtn.style.display = '';
          reviveBtn.textContent = `Revive (${left} left)`;
        }
      }
    }
  }

  function cloneShape(shape) {
    return shape.map(row => row.slice());
  }

  function isValidPosition(shape, x, y) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
        if (ny >= 0 && board[ny][nx]) return false;
      }
    }
    return true;
  }

  function rotate(shape) {
    const N = shape.length;
    const M = shape[0].length;
    const res = [];
    for (let c = 0; c < M; c++) {
      const row = [];
      for (let r = N - 1; r >= 0; r--) {
        row.push(shape[r][c]);
      }
      res.push(row);
    }
    return res;
  }

  function mergeToBoard() {
    const { shape, x, y, type } = current;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
          board[ny][nx] = type;
        }
      }
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(v => v)) {
        board.splice(r, 1);
        board.unshift(emptyRow());
        cleared++;
        r++; // re-check same row index after unshift
      }
    }
    if (cleared > 0) {
      lines += cleared;
      // basic scoring: more for multi-line clears
      const base = 100;
      score += base * cleared * cleared;
      level = 1 + Math.floor(lines / 10);
      if (difficulty === 'chaos') {
        // small random bonus for chaos
        score += Math.floor(Math.random() * 50);
      }
      const updated = updateHighScore(HS_KEY, score);
      if (updated !== best) {
        best = updated;
        highLabel.textContent = 'Best: ' + best;
      }
      sound.playScore();
    }
  }

  function addChaosGarbage() {
    // occasionally push a garbage line from the bottom
    if (difficulty !== 'chaos') return;
    if (Math.random() < 0.35) {
      board.shift();
      const row = [];
      const hole = Math.floor(Math.random() * COLS);
      for (let c = 0; c < COLS; c++) {
        row[c] = c === hole ? 0 : TYPES[Math.floor(Math.random() * TYPES.length)];
      }
      board.push(row);
    }
  }

  function hardDrop() {
    if (!current || gameOver || isPaused) return;
    while (move(0, 1)) {}
    sound.playScore();
    lockPiece();
  }

  function move(dx, dy) {
    if (!current || gameOver || isPaused) return false;
    const { shape, x, y } = current;
    const nx = x + dx;
    const ny = y + dy;
    if (!isValidPosition(shape, nx, ny)) return false;
    current.x = nx;
    current.y = ny;
    return true;
  }

  function rotateCurrent() {
    if (!current || gameOver || isPaused) return;
    const rotated = rotate(current.shape);
    if (isValidPosition(rotated, current.x, current.y)) {
      current.shape = rotated;
      return;
    }
    // simple wall kicks: try shifting left/right by 1
    if (isValidPosition(rotated, current.x - 1, current.y)) {
      current.x -= 1;
      current.shape = rotated;
    } else if (isValidPosition(rotated, current.x + 1, current.y)) {
      current.x += 1;
      current.shape = rotated;
    }
  }

  function lockPiece() {
    mergeToBoard();
    clearLines();
    addChaosGarbage();
    spawnPiece();
    updateStatus();
  }

  function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    sound.playClick();
    updateStatus();
  }

  function holdPiece() {
    if (!current || gameOver || holdLocked) return;
    const oldType = current.type;
    if (holdType == null) {
      holdType = oldType;
      holdLabel.textContent = 'Hold: ' + holdType;
      spawnPiece();
    } else {
      const tmp = holdType;
      holdType = oldType;
      spawnPiece(tmp);
    }
    holdLabel.textContent = 'Hold: ' + holdType;
    holdLocked = true;
    sound.playClick();
  }

  function resetGame() {
    reviveBtn.style.display = 'none';
    board = Array.from({ length: ROWS }, emptyRow);
    current = null;
    nextType = randomType();
    holdType = null;
    holdLocked = false;
    lastDropTime = 0;
    running = true;
    isPaused = false;
    gameOver = false;
    score = 0;
    lines = 0;
    level = 1;
    holdLabel.textContent = 'Hold: —';
    nextLabel.textContent = 'Next: —';
    pauseBtn.textContent = 'Pause';
    spawnPiece();
    updateStatus();
  }

  function drawCell(x, y, type, ghost = false) {
    const color = COLORS[type] || '#6ea4ff';
    ctx.fillStyle = ghost ? 'rgba(255,255,255,0.15)' : color;
    ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
  }

  function getGhostY() {
    if (!current) return null;
    let gy = current.y;
    while (isValidPosition(current.shape, current.x, gy + 1)) gy++;
    return gy;
  }

  function draw() {
    ctx.fillStyle = '#0a0e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(canvas.width, y * CELL + 0.5);
      ctx.stroke();
    }

    // board
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = board[r][c];
        if (type) drawCell(c, r, type, false);
      }
    }

    if (current) {
      const ghostY = getGhostY();
      if (ghostY != null && ghostY !== current.y) {
        for (let r = 0; r < current.shape.length; r++) {
          for (let c = 0; c < current.shape[r].length; c++) {
            if (!current.shape[r][c]) continue;
            const gx = current.x + c;
            const gy = ghostY + r;
            if (gy >= 0) drawCell(gx, gy, current.type, true);
          }
        }
      }

      for (let r = 0; r < current.shape.length; r++) {
        for (let c = 0; c < current.shape[r].length; c++) {
          if (!current.shape[r][c]) continue;
          const x = current.x + c;
          const y = current.y + r;
          if (y >= 0) drawCell(x, y, current.type, false);
        }
      }
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '26px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '18px sans-serif';
      ctx.fillText('Refresh page to try again or change difficulty', canvas.width / 2, canvas.height / 2 + 18);
    } else if (isPaused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    }
  }

  function update(time) {
    if (!running) {
      draw();
      return;
    }
    if (!current) {
      spawnPiece();
    }
    if (!isPaused && !gameOver) {
      if (!lastDropTime) lastDropTime = time;
      const speedMult = 1 + (level - 1) * 0.12;
      const interval = dropInterval / speedMult;
      if (time - lastDropTime >= interval) {
        if (!move(0, 1)) {
          lockPiece();
        }
        lastDropTime = time;
      }
      // extra chaos: occasional random sideways nudge
      if (difficulty === 'chaos' && Math.random() < 0.004) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        move(dir, 0);
      }
    }
    draw();
  }

  function loop(time) {
    update(time);
    animationId = requestAnimationFrame(loop);
  }

  function onKeyDown(e) {
    const k = e.key;
    const handled =
      k === 'ArrowLeft' ||
      k === 'ArrowRight' ||
      k === 'ArrowDown' ||
      k === 'ArrowUp' ||
      e.code === 'Space' ||
      k === 'Shift' ||
      e.code === 'ShiftLeft' ||
      e.code === 'ShiftRight';

    if (handled) {
      // prevent the page from scrolling while using keyboard controls
      e.preventDefault();
    }

    if (!current || gameOver) {
      if (k === 'p' || k === 'P') {
        togglePause();
      }
      return;
    }
    if (k === 'ArrowLeft') {
      if (move(-1, 0)) sound.playMove();
    } else if (k === 'ArrowRight') {
      if (move(1, 0)) sound.playMove();
    } else if (k === 'ArrowDown') {
      if (move(0, 1)) sound.playMove();
    } else if (k === 'ArrowUp') {
      rotateCurrent();
      sound.playMove();
    } else if (e.code === 'Space') {
      hardDrop();
    } else if (k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      holdPiece();
    } else if (k === 'p' || k === 'P') {
      togglePause();
    }
  }

  holdBtn.addEventListener('click', () => holdPiece());
  pauseBtn.addEventListener('click', () => togglePause());
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
    resetGame();
  });

  // Start screen button
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      sound.playClick();
      if (startScreen) startScreen.remove();
      if (startScrollIndicator) startScrollIndicator.remove();
      // Scroll to game window
      setTimeout(() => {
        layout.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });
  }

  // Settings button handler from start screen
  const startScreenSettingsBtn = startScreen.querySelector('.tetris-start-settings-btn');
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
  const startScreenHubBtn = startScreen.querySelector('.tetris-start-hub-btn');
  if (startScreenHubBtn) {
    startScreenHubBtn.addEventListener('click', () => {
      sound.playClick();
      if (startScreen) startScreen.remove();
      if (startScrollIndicator) startScrollIndicator.remove();
      location.hash = '#/';
    });
  }

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

  addEventListener('keydown', onKeyDown);

  resetGame();
  animationId = requestAnimationFrame(loop);

  function badge(text) {
    const span = document.createElement('span');
    span.className = 'badge';
    span.textContent = text;
    return span;
  }

  return () => {
    if (animationId != null) cancelAnimationFrame(animationId);
    removeEventListener('keydown', onKeyDown);
    wrap.remove();
  };
}
