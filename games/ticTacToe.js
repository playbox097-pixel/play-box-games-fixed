// games/ticTacToe.js
import { sound } from '../sound.js';
import { getNumber, setNumber } from '../highScores.js';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'ttt';

  // Settings modal (created early like Snake)
  const settingsModal = document.createElement('div');
  settingsModal.className = 'ttt-settings-modal hidden';
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
        background: linear-gradient(135deg, #1e3a8a, #1e40af);
        padding: 2rem;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        border: 2px solid #3b82f6;
        box-shadow: 0 0 40px rgba(59, 130, 246, 0.3);
      ">
        <h2 style="color: #3b82f6; margin-bottom: 1.5rem; text-align: center;">⚙️ Game Settings</h2>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">🎨 Board Theme</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
            <button class="button ttt-theme-classic" type="button" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">Classic Blue</button>
            <button class="button ttt-theme-purple" type="button" style="background: linear-gradient(135deg, #a855f7, #7c3aed);">Purple</button>
            <button class="button ttt-theme-green" type="button" style="background: linear-gradient(135deg, #10b981, #059669);">Green</button>
            <button class="button ttt-theme-red" type="button" style="background: linear-gradient(135deg, #ef4444, #dc2626);">Red</button>
            <button class="button ttt-theme-orange" type="button" style="background: linear-gradient(135deg, #f97316, #ea580c);">Orange</button>
            <button class="button ttt-theme-pink" type="button" style="background: linear-gradient(135deg, #ec4899, #db2777);">Pink</button>
          </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">✨ Animation Speed</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button ttt-anim-slow" type="button" style="flex: 1;">Slow</button>
            <button class="button ttt-anim-normal" type="button" style="flex: 1;">Normal</button>
            <button class="button ttt-anim-fast" type="button" style="flex: 1;">Fast</button>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 0.75rem;">📐 Grid Size</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button ttt-size-small" type="button" style="flex: 1;">Small</button>
            <button class="button ttt-size-medium" type="button" style="flex: 1;">Medium</button>
            <button class="button ttt-size-large" type="button" style="flex: 1;">Large</button>
          </div>
        </div>
        
        <button class="button primary ttt-settings-close" type="button" style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #3b82f6, #2563eb);">
          Close Settings
        </button>
      </div>
  `;
  document.body.appendChild(settingsModal);

  // Get win counts for start screen
  const WINS_X_KEY = 'wins:tic-tac-toe:X';
  const WINS_O_KEY = 'wins:tic-tac-toe:O';
  let winsX = getNumber(WINS_X_KEY, 0);
  let winsO = getNumber(WINS_O_KEY, 0);

  // Start Screen - Fullscreen Overlay
  const startScreen = document.createElement('div');
  startScreen.className = 'ttt-start-screen';
  startScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%);
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
        background: rgba(30, 58, 138, 0.8);
        border-radius: 20px;
        border: 2px solid #3b82f6;
        box-shadow: 0 0 40px rgba(59, 130, 246, 0.3);
      ">
        <div style="font-size: 4rem; margin-bottom: 0.5rem; animation: bounce 1s infinite;">
          ❌⭕
        </div>
        <h1 style="
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        ">Tic-Tac-Toe</h1>
        <p style="color: #bfdbfe; margin-bottom: 2rem; font-size: 1.1rem;">
          Classic 2-Player Battle
        </p>
        
        <div style="
          background: rgba(30, 58, 138, 0.6);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
          border: 1px solid rgba(59, 130, 246, 0.2);
        ">
          <h3 style="color: #3b82f6; margin-bottom: 1rem; font-size: 1.2rem;">🎮 How to Play</h3>
          <ul style="color: #cbd5e1; list-style: none; padding: 0; line-height: 1.8;">
            <li>🖱️ Click cells to place X or O</li>
            <li>🎭 Or drag your mark to a cell</li>
            <li>🎯 Get 3 in a row to win</li>
            <li>⚔️ 2 players take turns</li>
          </ul>
        </div>

        <div style="
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        ">
          <div style="
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            text-align: center;
          ">
            <div style="color: #3b82f6; font-weight: bold; font-size: 1.5rem;">${winsX}</div>
            <div style="color: #64748b; font-size: 0.85rem;">X Wins</div>
          </div>
          <div style="
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            text-align: center;
          ">
            <div style="color: #fbbf24; font-weight: bold; font-size: 1.5rem;">${winsO}</div>
            <div style="color: #64748b; font-size: 0.85rem;">O Wins</div>
          </div>
        </div>

        <button class="ttt-start-btn button primary" type="button" style="
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: pulse 2s infinite;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(59, 130, 246, 0.5)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
          🎮 Start Game
        </button>

        <button class="ttt-start-settings-btn button secondary" type="button" style="
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

        <button class="ttt-start-hub-btn button secondary" type="button" style="
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

  const startBtn = startScreen.querySelector('.ttt-start-btn');

  // Scroll indicator for start screen
  const startScrollIndicator = document.createElement('div');
  startScrollIndicator.className = 'ttt-scroll-indicator';
  startScrollIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(59, 130, 246, 0.9);
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
      grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  document.body.appendChild(startScreen);
  document.body.appendChild(startScrollIndicator);

  const status = document.createElement('div');
  status.className = 'ttt-status';

  // Drag source for the current player's mark (X or O)
  const dragSource = document.createElement('div');
  dragSource.className = 'ttt-drag';
  dragSource.draggable = true;

  const grid = document.createElement('div');
  grid.className = 'ttt-grid';

  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const resetBtn = btn('Reset');
  resetBtn.classList.add('button');
  const scoreEl = badge('X wins: 0 | O wins: 0');
  
  const tutorialBtn = btn('🎓 Tutorial');
  tutorialBtn.classList.add('button');
  tutorialBtn.title = 'Forgot how to play? Try the tutorial again!';
  tutorialBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const settingsBtn = btn('⚙️ Settings');
  settingsBtn.classList.add('button');
  settingsBtn.title = 'Customize your game!';
  settingsBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
  `;

  const hubBtn = btn('🏠 Hub');
  hubBtn.classList.add('button');
  hubBtn.title = 'Back to Game Hub';
  hubBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
  `;
  
  toolbar.append(resetBtn, badge('First player: X'), scoreEl, settingsBtn, tutorialBtn, hubBtn);

  const rulesEl = createRules([
    'Two players take turns placing X and O.',
    'Get three in a row (horizontal, vertical, or diagonal) to win.',
    'If the board fills with no winner, it\'s a draw.',
    'Click Reset to start a new game.'
  ]);

  wrap.append(toolbar, rulesEl, status, dragSource, grid);

  // Per-game fullscreen button
  if (window.playBoxCreateFullscreenButton) {
    const fsBtn = window.playBoxCreateFullscreenButton(wrap);
    if (fsBtn) toolbar.appendChild(fsBtn);
  }

  root.appendChild(wrap);

  // Settings state (load from localStorage or defaults)
  let boardTheme = localStorage.getItem('ttt-theme') || 'classic';
  let animSpeed = localStorage.getItem('ttt-anim-speed') || 'normal';
  let gridSize = localStorage.getItem('ttt-grid-size') || 'medium';

  function applySettings() {
    // Apply theme
    const themeColors = {
      classic: { primary: '#3b82f6', secondary: '#2563eb', bg: '#1e3a8a' },
      purple: { primary: '#a855f7', secondary: '#7c3aed', bg: '#581c87' },
      green: { primary: '#10b981', secondary: '#059669', bg: '#065f46' },
      red: { primary: '#ef4444', secondary: '#dc2626', bg: '#7f1d1d' },
      orange: { primary: '#f97316', secondary: '#ea580c', bg: '#7c2d12' },
      pink: { primary: '#ec4899', secondary: '#db2777', bg: '#831843' }
    };
    const colors = themeColors[boardTheme];
    grid.style.borderColor = colors.primary;
    cells.forEach(c => {
      c.el.style.borderColor = colors.primary;
    });
    status.style.color = colors.primary;
    dragSource.style.borderColor = colors.primary;
    dragSource.style.background = `linear-gradient(135deg, ${colors.bg}, ${colors.secondary})`;

    // Apply animation speed
    const animDurations = { slow: '0.6s', normal: '0.3s', fast: '0.15s' };
    cells.forEach(c => {
      c.el.style.transition = `all ${animDurations[animSpeed]}`;
    });

    // Apply grid size
    const gridSizes = { small: '350px', medium: '480px', large: '600px' };
    grid.style.width = gridSizes[gridSize];
    grid.style.height = gridSizes[gridSize];

    // Update button states in modal
    settingsModal.querySelectorAll('.ttt-theme-classic, .ttt-theme-purple, .ttt-theme-green, .ttt-theme-red, .ttt-theme-orange, .ttt-theme-pink').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.ttt-theme-${boardTheme}`)?.classList.add('primary');

    settingsModal.querySelectorAll('.ttt-anim-slow, .ttt-anim-normal, .ttt-anim-fast').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.ttt-anim-${animSpeed}`)?.classList.add('primary');

    settingsModal.querySelectorAll('.ttt-size-small, .ttt-size-medium, .ttt-size-large').forEach(btn => {
      btn.classList.remove('primary');
    });
    settingsModal.querySelector(`.ttt-size-${gridSize}`)?.classList.add('primary');
  }

  // Settings button click handler
  settingsBtn.addEventListener('click', () => {
    sound.playClick();
    // Auto-pause: set gameOver to true temporarily to prevent moves
    if (!gameOver) {
      gameOver = true;
    }
    settingsModal.classList.remove('hidden');
    settingsModal.style.display = 'flex';
    applySettings();
    // Auto-scroll up to settings modal when accessed from game toolbar
    setTimeout(() => {
      settingsModal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  // Settings modal event listeners
  settingsModal.querySelector('.ttt-settings-close').addEventListener('click', () => {
    sound.playClick();
    settingsModal.classList.add('hidden');
    settingsModal.style.display = 'none';
    // Scroll back to game
    setTimeout(() => {
      grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  // Theme buttons
  ['classic', 'purple', 'green', 'red', 'orange', 'pink'].forEach(theme => {
    settingsModal.querySelector(`.ttt-theme-${theme}`).addEventListener('click', () => {
      sound.playClick();
      boardTheme = theme;
      localStorage.setItem('ttt-theme', theme);
      applySettings();
    });
  });

  // Animation speed buttons
  ['slow', 'normal', 'fast'].forEach(speed => {
    settingsModal.querySelector(`.ttt-anim-${speed}`).addEventListener('click', () => {
      sound.playClick();
      animSpeed = speed;
      localStorage.setItem('ttt-anim-speed', speed);
      applySettings();
    });
  });

  // Grid size buttons
  ['small', 'medium', 'large'].forEach(size => {
    settingsModal.querySelector(`.ttt-size-${size}`).addEventListener('click', () => {
      sound.playClick();
      gridSize = size;
      localStorage.setItem('ttt-grid-size', size);
      applySettings();
    });
  });

  const cells = Array.from({ length: 9 }, () => ({ el: cell(), val: '' }));
  
  // Apply initial settings after cells are created
  applySettings();
  
  cells.forEach((c, i) => {
    // Click to place a mark as before
    c.el.addEventListener('click', () => handleTurn(i));

    // Allow drag-over so we can drop the current mark onto a cell
    c.el.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    c.el.addEventListener('dragenter', (e) => {
      e.preventDefault();
      c.el.classList.add('ttt-cell--drop-hover');
    });
    c.el.addEventListener('dragleave', () => {
      c.el.classList.remove('ttt-cell--drop-hover');
    });
    c.el.addEventListener('drop', (e) => {
      e.preventDefault();
      c.el.classList.remove('ttt-cell--drop-hover');
      // Treat a drop the same as a click on that cell
      handleTurn(i);
    });

    grid.appendChild(c.el);
  });

  // Tutorial System for First-Time Players
  const TUTORIAL_KEY = 'ttt-tutorial-completed';
  const hasCompletedTutorial = localStorage.getItem(TUTORIAL_KEY) === 'true';
  
  let tutorialActive = false;
  let tutorialOverlay = null;

  function showTutorial() {
    // Create tutorial overlay
    tutorialOverlay = document.createElement('div');
    tutorialOverlay.className = 'ttt-tutorial-overlay';
    tutorialOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
    `;

    const tutorialBox = document.createElement('div');
    tutorialBox.className = 'ttt-tutorial-box';
    tutorialBox.style.cssText = `
      max-width: 600px;
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      padding: 2.5rem;
      border-radius: 20px;
      border: 3px solid #3b82f6;
      box-shadow: 0 0 50px rgba(59, 130, 246, 0.5);
      text-align: center;
    `;

    // Show welcome screen first
    tutorialBox.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
      <h2 style="color: white; font-size: 2rem; margin-bottom: 1rem;">Welcome to Tic-Tac-Toe!</h2>
      <p style="color: #bfdbfe; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
        ${hasCompletedTutorial ? 'Want to review how to play?' : 'This is your first time playing! Would you like a quick tutorial?'}
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button class="ttt-tutorial-start button" style="
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #ffffff, #e0e7ff);
          color: #1e3a8a;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
        ">📚 Start Tutorial</button>
        <button class="ttt-tutorial-skip button" style="
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

    const tutorialSteps = [
      {
        title: '🎮 Two Players',
        message: 'This is a <strong>2-player game</strong>!<br><br>Player 1 is <strong>X</strong> and Player 2 is <strong>O</strong>.',
        highlight: null
      },
      {
        title: '🎯 The Goal',
        message: 'Get <strong>three in a row</strong> to win!<br><br>You can win horizontally, vertically, or diagonally.',
        highlight: grid
      },
      {
        title: '🖱️ Click to Place',
        message: 'Click any empty cell to place your mark (X or O).<br><br>Players take turns automatically.',
        highlight: grid
      },
      {
        title: '🎭 Drag & Drop',
        message: 'You can also <strong>drag your mark</strong> from the top and drop it on any cell!<br><br>Try it out!',
        highlight: dragSource
      },
      {
        title: '⚔️ Take Turns',
        message: 'After X places their mark, it becomes <strong>O\'s turn</strong>.<br><br>Keep alternating until someone wins!',
        highlight: status
      },
      {
        title: '🤝 Draw Game',
        message: 'If all 9 cells fill up with no winner, the game is a <strong>draw</strong>!<br><br>Click Reset to play again.',
        highlight: resetBtn
      },
      {
        title: '🏆 Win Tracking',
        message: 'Your wins are tracked for both X and O!<br><br>See how many games each player has won.',
        highlight: scoreEl
      },
      {
        title: '🎉 Ready to Play!',
        message: 'You\'re all set! Start playing and may the best player win! ❌⭕',
        highlight: null
      }
    ];

    let currentStep = 0;

    function showStep(stepIndex) {
      if (stepIndex >= tutorialSteps.length) {
        localStorage.setItem(TUTORIAL_KEY, 'true');
        tutorialOverlay.remove();
        document.querySelectorAll('.ttt-tutorial-highlight').forEach(el => el.remove());
        tutorialActive = false;
        return;
      }

      const step = tutorialSteps[stepIndex];
      tutorialBox.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">${step.title.split(' ')[0]}</div>
        <h2 style="color: white; font-size: 1.8rem; margin-bottom: 1rem;">${step.title.substring(step.title.indexOf(' ') + 1)}</h2>
        <p style="color: #bfdbfe; font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
          ${step.message}
        </p>
        <div style="color: #93c5fd; font-size: 0.9rem; margin-bottom: 1rem;">
          Step ${stepIndex + 1} of ${tutorialSteps.length}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          ${stepIndex < tutorialSteps.length - 1 ?
            '<button class="ttt-tutorial-next button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #ffffff, #e0e7ff); color: #1e3a8a; border: none; border-radius: 12px; cursor: pointer; font-weight: bold;">Next ➡️</button>' :
            '<button class="ttt-tutorial-finish button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #ffffff, #e0e7ff); color: #1e3a8a; border: none; border-radius: 12px; cursor: pointer; font-weight: bold;">Start Playing! 🎉</button>'
          }
          <button class="ttt-tutorial-close button" style="padding: 0.75rem 1.5rem; font-size: 1rem; background: rgba(100, 116, 139, 0.3); border: 2px solid #64748b; border-radius: 12px; color: #cbd5e1; cursor: pointer;">Close</button>
        </div>
      `;

      // Highlight element
      document.querySelectorAll('.ttt-tutorial-highlight').forEach(el => el.remove());
      if (step.highlight) {
        const highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'ttt-tutorial-highlight';
        const rect = step.highlight.getBoundingClientRect();
        highlightOverlay.style.cssText = `
          position: fixed;
          top: ${rect.top - 10}px;
          left: ${rect.left - 10}px;
          width: ${rect.width + 20}px;
          height: ${rect.height + 20}px;
          border: 3px solid #3b82f6;
          border-radius: 15px;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
          pointer-events: none;
          z-index: 2999;
          animation: pulse 2s infinite;
        `;
        document.body.appendChild(highlightOverlay);
      }

      // Event listeners
      const nextBtn = tutorialBox.querySelector('.ttt-tutorial-next');
      const finishBtn = tutorialBox.querySelector('.ttt-tutorial-finish');
      const closeBtn = tutorialBox.querySelector('.ttt-tutorial-close');

      if (nextBtn) {
        nextBtn.onclick = () => {
          sound.playClick();
          currentStep++;
          showStep(currentStep);
        };
      }

      if (finishBtn) {
        finishBtn.onclick = () => {
          sound.playClick();
          localStorage.setItem(TUTORIAL_KEY, 'true');
          tutorialOverlay.remove();
          document.querySelectorAll('.ttt-tutorial-highlight').forEach(el => el.remove());
          tutorialActive = false;
        };
      }

      if (closeBtn) {
        closeBtn.onclick = () => {
          sound.playClick();
          localStorage.setItem(TUTORIAL_KEY, 'true');
          tutorialOverlay.remove();
          document.querySelectorAll('.ttt-tutorial-highlight').forEach(el => el.remove());
          tutorialActive = false;
        };
      }
    }

    // Welcome screen button handlers
    const startTutorialBtn = tutorialBox.querySelector('.ttt-tutorial-start');
    const skipTutorialBtn = tutorialBox.querySelector('.ttt-tutorial-skip');

    if (startTutorialBtn) {
      startTutorialBtn.onclick = () => {
        sound.playClick();
        tutorialActive = true;
        showStep(0);
      };
    }

    if (skipTutorialBtn) {
      skipTutorialBtn.onclick = () => {
        sound.playClick();
        localStorage.setItem(TUTORIAL_KEY, 'true');
        tutorialOverlay.remove();
        document.querySelectorAll('.ttt-tutorial-highlight').forEach(el => el.remove());
        tutorialActive = false;
      };
    }
  }

  // Show tutorial welcome screen for first-time users
  if (!hasCompletedTutorial) {
    setTimeout(() => showTutorial(), 500);
  }

  // Tutorial button handler
  tutorialBtn.addEventListener('click', () => {
    sound.playClick();
    showTutorial();
  });

  // Hub button handler
  hubBtn.addEventListener('click', () => {
    sound.playClick();
    location.hash = '#/';
  });

  // Start button handler
  startBtn.addEventListener('click', () => {
    sound.playClick();
    if (startScreen) startScreen.remove();
    // Scroll to game window
    setTimeout(() => {
      grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  // Settings button handler from start screen
  const startScreenSettingsBtn = startScreen.querySelector('.ttt-start-settings-btn');
  startScreenSettingsBtn.addEventListener('click', () => {
    sound.playClick();
    if (startScreen) startScreen.remove();
    settingsModal.classList.remove('hidden');
    settingsModal.style.display = 'flex';
  });

  // Hub button handler from start screen
  const startScreenHubBtn = startScreen.querySelector('.ttt-start-hub-btn');
  startScreenHubBtn.addEventListener('click', () => {
    sound.playClick();
    if (startScreen) startScreen.remove();
    location.hash = '#/';
  });

  // Scroll indicator logic
  function updateScrollIndicators() {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 100) {
      startScrollIndicator.innerHTML = '⬆️ Scroll Up to Start';
      startScrollIndicator.style.color = '#2563eb';
    } else {
      startScrollIndicator.innerHTML = '⬇️ Scroll Down to Game';
      startScrollIndicator.style.color = '#3b82f6';
    }
  }

  window.addEventListener('scroll', updateScrollIndicators);
  updateScrollIndicators();
  updateScrollIndicators();

  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  let turn = 'X';
  let gameOver = false;

  // Variables already declared at top for start screen
  function renderScore() {
    scoreEl.textContent = `X wins: ${winsX} | O wins: ${winsO}`;
  }
  renderScore();

  function updateDragSource() {
    dragSource.textContent = `Drag your mark: ${turn}`;
  }

  // Configure drag data for HTML5 drag-and-drop
  dragSource.addEventListener('dragstart', (e) => {
    try {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', turn);
    } catch {}
  });

  function cell() {
    const b = document.createElement('button');
    b.className = 'ttt-cell';
    b.setAttribute('aria-label', 'cell');
    return b;
  }

  function btn(text) { const b = document.createElement('button'); b.textContent = text; return b; }
  function badge(text) { const s = document.createElement('span'); s.className='badge'; s.textContent = text; return s; }
  function createRules(items){
    const d = document.createElement('details'); d.className='rules';
    const s = document.createElement('summary'); s.textContent='Rules';
    const ul = document.createElement('ul');
    items.forEach(t => { const li=document.createElement('li'); li.textContent=t; ul.appendChild(li); });
    d.append(s, ul); return d;
  }

  function handleTurn(i) {
    if (gameOver) return;
    const c = cells[i];
    if (c.val) return;
    c.val = turn;
    c.el.textContent = turn;
    sound.playMove();

    const win = wins.some(line => line.every(idx => cells[idx].val === turn));
    const full = cells.every(c => c.val);

    if (win) {
      status.textContent = `${turn} wins!`;
      updateDragSource();
      gameOver = true;
      disableAll();
      if (turn === 'X') {
        winsX += 1;
        setNumber(WINS_X_KEY, winsX);
      } else {
        winsO += 1;
        setNumber(WINS_O_KEY, winsO);
      }
      renderScore();
      sound.playWin();
      return;
    }
    if (full) {
      status.textContent = 'Draw!';
      updateDragSource();
      gameOver = true;
      sound.playGameOver();
      return;
    }

    turn = turn === 'X' ? 'O' : 'X';
    status.textContent = `${turn}'s turn`;
    updateDragSource();
  }

  function disableAll() { cells.forEach(c => c.el.disabled = true); }
  function enableAll() { cells.forEach(c => c.el.disabled = false); }

  function reset() {
    turn = 'X';
    gameOver = false;
    cells.forEach(c => { c.val=''; c.el.textContent=''; });
    enableAll();
    status.textContent = `X's turn`;
    updateDragSource();
  }

  resetBtn.addEventListener('click', () => {
    sound.playClick();
    reset();
  });
  reset();

  return () => {
    // Cleanup if needed
    wrap.remove();
  };
}
