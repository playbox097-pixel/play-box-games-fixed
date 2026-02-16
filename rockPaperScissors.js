// games/rockPaperScissors.js
import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'rps';

  // Get high score first for start screen
  const HS_KEY = 'rock-paper-scissors';
  let best = getHighScore(HS_KEY);

  // Start screen
  const startScreen = document.createElement('div');
  startScreen.className = 'rps-start-screen';
  startScreen.innerHTML = `
    <div class="rps-start-panel" style="
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
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
        background: rgba(49, 46, 129, 0.8);
        border-radius: 20px;
        border: 2px solid #8b5cf6;
        box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
      ">
        <div style="font-size: 4rem; margin-bottom: 0.5rem; animation: bounce 1s infinite;">
          ✊✋✌️
        </div>
        <h1 style="
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        ">Rock Paper Scissors</h1>
        <p style="color: #94a3b8; margin-bottom: 2rem; font-size: 1.1rem;">
          Classic hand game vs AI
        </p>
        
        <div style="
          background: rgba(30, 27, 75, 0.6);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
          border: 1px solid rgba(139, 92, 246, 0.2);
        ">
          <h3 style="color: #8b5cf6; margin-bottom: 1rem; font-size: 1.2rem;">🎮 How to Play</h3>
          <ul style="color: #cbd5e1; list-style: none; padding: 0; line-height: 1.8;">
            <li>✊ Rock beats Scissors</li>
            <li>✋ Paper beats Rock</li>
            <li>✌️ Scissors beats Paper</li>
            <li>🏆 First to 5 points wins!</li>
          </ul>
        </div>

        <div style="
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        ">
          <div style="
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid #8b5cf6;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            text-align: center;
          ">
            <div style="color: #8b5cf6; font-weight: bold; font-size: 1.5rem;">${best}</div>
            <div style="color: #64748b; font-size: 0.85rem;">Best Streak</div>
          </div>
          <div style="
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            text-align: center;
          ">
            <div style="color: #fbbf24; font-weight: bold; font-size: 1.5rem;">5</div>
            <div style="color: #64748b; font-size: 0.85rem;">Points to Win</div>
          </div>
        </div>

        <button class="rps-start-btn button primary" type="button" style="
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: pulse 2s infinite;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(139, 92, 246, 0.5)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
          🎮 Start Game
        </button>

        <button class="rps-start-hub-btn button secondary" type="button" style="
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

  // Scroll indicator for start screen
  const startScrollIndicator = document.createElement('div');
  startScrollIndicator.className = 'rps-scroll-indicator';
  startScrollIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(139, 92, 246, 0.9);
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
  document.body.appendChild(startScrollIndicator);

  // Enhanced game container
  const gameContainer = document.createElement('div');
  gameContainer.style.cssText = `
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border: 2px solid #8b5cf6;
  `;

  // Score display
  const scoreDisplay = document.createElement('div');
  scoreDisplay.style.cssText = `
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(30, 27, 75, 0.6);
    border-radius: 15px;
    border: 1px solid rgba(139, 92, 246, 0.3);
  `;
  
  const playerScoreBox = document.createElement('div');
  playerScoreBox.style.cssText = `
    text-align: center;
    flex: 1;
  `;
  playerScoreBox.innerHTML = `
    <div style="color: #8b5cf6; font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem;">YOU</div>
    <div class="rps-player-score" style="font-size: 3rem; font-weight: bold; color: #10b981;">0</div>
  `;
  
  const vsText = document.createElement('div');
  vsText.style.cssText = `
    font-size: 1.5rem;
    font-weight: bold;
    color: #64748b;
    padding: 0 2rem;
  `;
  vsText.textContent = 'VS';
  
  const cpuScoreBox = document.createElement('div');
  cpuScoreBox.style.cssText = `
    text-align: center;
    flex: 1;
  `;
  cpuScoreBox.innerHTML = `
    <div style="color: #8b5cf6; font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem;">CPU</div>
    <div class="rps-cpu-score" style="font-size: 3rem; font-weight: bold; color: #ef4444;">0</div>
  `;
  
  scoreDisplay.append(playerScoreBox, vsText, cpuScoreBox);

  // Result message
  const resultEl = document.createElement('div');
  resultEl.className = 'rps-result';
  resultEl.style.cssText = `
    text-align: center;
    padding: 1.5rem;
    margin-bottom: 2rem;
    background: rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: bold;
    color: #cbd5e1;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(139, 92, 246, 0.4);
  `;
  resultEl.textContent = 'Choose your move!';

  // Best streak badge
  const bestEl = document.createElement('div');
  bestEl.style.cssText = `
    text-align: center;
    padding: 1rem;
    margin-bottom: 2rem;
    background: rgba(251, 191, 36, 0.1);
    border: 2px solid #fbbf24;
    border-radius: 10px;
  `;
  bestEl.innerHTML = `
    <span style="color: #64748b; font-size: 0.9rem;">Best Streak: </span>
    <span class="rps-best-streak" style="color: #fbbf24; font-size: 1.3rem; font-weight: bold;">${best}</span>
  `;

  // Choice buttons container
  const choices = document.createElement('div');
  choices.className = 'rps-choices';
  choices.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin-bottom: 2rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  `;

  const buttonData = [
    { id: 'rock', emoji: '✊', color: '#ef4444', name: 'Rock' },
    { id: 'paper', emoji: '✋', color: '#10b981', name: 'Paper' },
    { id: 'scissors', emoji: '✌️', color: '#06b6d4', name: 'Scissors' }
  ];

  const buttons = buttonData.map(({ id, emoji, color, name }) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.dataset.id = id;
    b.style.cssText = `
      padding: 3rem 1.5rem;
      font-size: 5rem;
      background: rgba(30, 27, 75, 0.8);
      border: 3px solid ${color};
      border-radius: 15px;
      cursor: pointer;
      transition: all 0.3s;
      color: white;
      position: relative;
      overflow: hidden;
    `;
    b.innerHTML = `
      ${emoji}
      <div style="font-size: 1rem; margin-top: 0.5rem; color: ${color}; font-weight: bold;">${name}</div>
    `;
    
    // Hover effects
    b.onmouseenter = () => {
      b.style.transform = 'translateY(-10px) scale(1.05)';
      b.style.boxShadow = `0 15px 40px ${color}40`;
      b.style.background = `linear-gradient(135deg, rgba(30, 27, 75, 0.9), ${color}30)`;
    };
    b.onmouseleave = () => {
      b.style.transform = 'translateY(0) scale(1)';
      b.style.boxShadow = 'none';
      b.style.background = 'rgba(30, 27, 75, 0.8)';
    };
    
    return b;
  });
  buttons.forEach(b => choices.appendChild(b));

  const rulesEl = createRules([
    'Choose Rock, Paper, or Scissors.',
    'Rock beats Scissors, Scissors beats Paper, Paper beats Rock.',
    'First to 5 points wins the match.',
    'The AI reveals its move after a short thinking delay.'
  ]);

  // Tutorial button
  const tutorialBtn = document.createElement('button');
  tutorialBtn.className = 'button';
  tutorialBtn.textContent = '🎓 Tutorial';
  tutorialBtn.title = 'Forgot how to play? Try the tutorial again!';
  tutorialBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    border: none;
    border-radius: 12px;
    color: white;
    cursor: pointer;
    margin-top: 1rem;
    transition: all 0.3s;
  `;
  tutorialBtn.onmouseenter = () => {
    tutorialBtn.style.transform = 'translateY(-2px)';
    tutorialBtn.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.5)';
  };
  tutorialBtn.onmouseleave = () => {
    tutorialBtn.style.transform = 'translateY(0)';
    tutorialBtn.style.boxShadow = 'none';
  };

  const hubBtn = document.createElement('button');
  hubBtn.className = 'button';
  hubBtn.textContent = '🏠 Hub';
  hubBtn.title = 'Back to Game Hub';
  hubBtn.style.cssText = `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: none;
    border-radius: 12px;
    color: white;
    cursor: pointer;
    margin-top: 1rem;
    margin-left: 0.5rem;
    transition: all 0.3s;
  `;
  hubBtn.onmouseenter = () => {
    hubBtn.style.transform = 'translateY(-2px)';
    hubBtn.style.boxShadow = '0 5px 15px rgba(239, 68, 68, 0.5)';
  };
  hubBtn.onmouseleave = () => {
    hubBtn.style.transform = 'translateY(0)';
    hubBtn.style.boxShadow = 'none';
  };

  gameContainer.append(scoreDisplay, resultEl, bestEl, choices, rulesEl, tutorialBtn, hubBtn);
  wrap.appendChild(gameContainer);

  // Per-game fullscreen button
  if (window.playBoxCreateFullscreenButton) {
    const fsBtn = window.playBoxCreateFullscreenButton(wrap);
    if (fsBtn) {
      fsBtn.style.cssText = `
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        border: none;
        border-radius: 10px;
        color: white;
        cursor: pointer;
        transition: all 0.3s;
        margin-top: 1rem;
      `;
      gameContainer.appendChild(fsBtn);
    }
  }

  root.appendChild(wrap);

  const playerScoreEl = gameContainer.querySelector('.rps-player-score');
  const cpuScoreEl = gameContainer.querySelector('.rps-cpu-score');
  const bestStreakEl = gameContainer.querySelector('.rps-best-streak');

  let player = 0, cpu = 0;
  let pending = false;
  let thinkTimer = null;
  const AI_DELAY_MS = 700;

  // Tutorial System for First-Time Players
  const TUTORIAL_KEY = 'rps-tutorial-completed';
  const hasCompletedTutorial = localStorage.getItem(TUTORIAL_KEY) === 'true';
  
  let tutorialActive = false;
  let tutorialStep = 0;
  let tutorialOverlay = null;

  if (!hasCompletedTutorial) {
    // Create tutorial overlay
    tutorialOverlay = document.createElement('div');
    tutorialOverlay.className = 'rps-tutorial-overlay';
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
    tutorialBox.className = 'rps-tutorial-box';
    tutorialBox.style.cssText = `
      max-width: 600px;
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      padding: 2.5rem;
      border-radius: 20px;
      border: 3px solid #8b5cf6;
      box-shadow: 0 0 50px rgba(139, 92, 246, 0.5);
      text-align: center;
    `;

    tutorialBox.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
      <h2 style="color: #8b5cf6; font-size: 2rem; margin-bottom: 1rem;">Welcome to Rock Paper Scissors!</h2>
      <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
        This is your first time playing! Would you like a quick tutorial to learn how to play?
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button class="rps-tutorial-start button" style="
          padding: 1rem 2rem;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          font-weight: bold;
        ">📚 Start Tutorial</button>
        <button class="rps-tutorial-skip button" style="
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
        title: '🎯 The Goal',
        message: 'Be the first to win <strong>5 points</strong> against the CPU!<br><br>It\'s a race to 5 rounds.',
        highlight: scoreDisplay,
        waitForClick: false
      },
      {
        title: '✊ Rock Beats Scissors',
        message: 'Rock crushes Scissors!<br><br>When you choose Rock and CPU chooses Scissors, <strong>you win</strong> the round.',
        highlight: buttons[0],
        waitForClick: false
      },
      {
        title: '✋ Paper Beats Rock',
        message: 'Paper covers Rock!<br><br>When you choose Paper and CPU chooses Rock, <strong>you win</strong> the round.',
        highlight: buttons[1],
        waitForClick: false
      },
      {
        title: '✌️ Scissors Beats Paper',
        message: 'Scissors cuts Paper!<br><br>When you choose Scissors and CPU chooses Paper, <strong>you win</strong> the round.',
        highlight: buttons[2],
        waitForClick: false
      },
      {
        title: '🤝 Draws',
        message: 'If you and the CPU choose the same option, it\'s a <strong>draw</strong>!<br><br>No points are awarded, just play again.',
        highlight: resultEl,
        waitForClick: false
      },
      {
        title: '🤖 AI Thinking',
        message: 'After you make your choice, the CPU will think for a moment before revealing its move.<br><br>Wait for the result!',
        highlight: resultEl,
        waitForClick: false
      },
      {
        title: '🏆 Best Streak',
        message: 'Your <strong>best winning streak</strong> is tracked!<br><br>Try to beat your record with consecutive wins.',
        highlight: bestEl,
        waitForClick: false
      },
      {
        title: '🎮 Ready to Play!',
        message: 'Click any button below to make your first move!<br><br>Good luck beating the CPU! ✊✋✌️',
        highlight: choices,
        waitForClick: false
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
        <h2 style="color: #8b5cf6; font-size: 1.8rem; margin-bottom: 1rem;">${step.title.substring(step.title.indexOf(' ') + 1)}</h2>
        <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
          ${step.message}
        </p>
        <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
          Step ${stepIndex + 1} of ${tutorialSteps.length}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          ${stepIndex < tutorialSteps.length - 1 ? 
            '<button class="rps-tutorial-next button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Next ➡️</button>' :
            '<button class="rps-tutorial-finish button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Start Playing! 🎉</button>'
          }
          <button class="rps-tutorial-skip-all button" style="padding: 0.75rem 1.5rem; font-size: 1rem; background: rgba(100, 116, 139, 0.3); border: 2px solid #64748b; border-radius: 12px; color: #cbd5e1; cursor: pointer;">Skip All</button>
        </div>
      `;

      // Highlight element if specified
      document.querySelectorAll('.rps-tutorial-highlight').forEach(el => el.remove());
      if (step.highlight) {
        const highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'rps-tutorial-highlight';
        const rect = step.highlight.getBoundingClientRect();
        highlightOverlay.style.cssText = `
          position: fixed;
          top: ${rect.top - 10}px;
          left: ${rect.left - 10}px;
          width: ${rect.width + 20}px;
          height: ${rect.height + 20}px;
          border: 3px solid #8b5cf6;
          border-radius: 15px;
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
          pointer-events: none;
          z-index: 2999;
          animation: pulse 2s infinite;
        `;
        document.body.appendChild(highlightOverlay);
      }

      // Add event listeners
      const nextBtn = tutorialBox.querySelector('.rps-tutorial-next');
      const finishBtn = tutorialBox.querySelector('.rps-tutorial-finish');
      const skipAllBtn = tutorialBox.querySelector('.rps-tutorial-skip-all');

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
      localStorage.setItem(TUTORIAL_KEY, 'true');
      if (tutorialOverlay) tutorialOverlay.remove();
      document.querySelectorAll('.rps-tutorial-highlight').forEach(el => el.remove());
      tutorialActive = false;
    }

    // Tutorial button handlers
    const startTutorialBtn = tutorialBox.querySelector('.rps-tutorial-start');
    const skipTutorialBtn = tutorialBox.querySelector('.rps-tutorial-skip');

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

  function badge(t){ const s=document.createElement('span'); s.className='badge'; s.textContent=t; return s; }
  function createRules(items){
    const d = document.createElement('details'); d.className='rules';
    const s = document.createElement('summary'); s.textContent='Rules';
    const ul = document.createElement('ul');
    items.forEach(t => { const li=document.createElement('li'); li.textContent=t; ul.appendChild(li); });
    d.append(s, ul); return d;
  }
  const beats = { rock:'scissors', paper:'rock', scissors:'paper' };
  const ids = Object.keys(beats);

  function setButtonsEnabled(on){ 
    buttons.forEach(b => {
      b.disabled = !on;
      if (!on) {
        b.style.opacity = '0.5';
        b.style.cursor = 'not-allowed';
      } else {
        b.style.opacity = '1';
        b.style.cursor = 'pointer';
      }
    });
  }

  function resolveRound(p){
    const c = ids[Math.floor(Math.random()*ids.length)];
    let msg, resultColor;
    if (p === c) {
      msg = `🤝 Draw! ${icon(p)} equals ${icon(c)}`;
      resultColor = 'rgba(100, 116, 139, 0.3)';
    }
    else if (beats[p] === c) {
      player++;
      msg = `🎉 You Win! ${icon(p)} beats ${icon(c)}`;
      resultColor = 'rgba(16, 185, 129, 0.3)';
      sound.playScore();
      // Animate player score
      playerScoreEl.style.transform = 'scale(1.3)';
      playerScoreEl.style.color = '#34d399';
      setTimeout(() => {
        playerScoreEl.style.transform = 'scale(1)';
        playerScoreEl.style.color = '#10b981';
      }, 300);
    }
    else {
      cpu++;
      msg = `😢 You Lose! ${icon(p)} loses to ${icon(c)}`;
      resultColor = 'rgba(239, 68, 68, 0.3)';
      sound.playLose();
      // Animate CPU score
      cpuScoreEl.style.transform = 'scale(1.3)';
      cpuScoreEl.style.color = '#f87171';
      setTimeout(() => {
        cpuScoreEl.style.transform = 'scale(1)';
        cpuScoreEl.style.color = '#ef4444';
      }, 300);
    }

    playerScoreEl.textContent = player;
    cpuScoreEl.textContent = cpu;
    resultEl.textContent = msg;
    resultEl.style.background = resultColor;
    resultEl.style.borderColor = resultColor.replace('0.3', '0.6');

    if (player > best) {
      best = updateHighScore(HS_KEY, player);
      bestStreakEl.textContent = best;
      // Animate best streak
      bestStreakEl.style.transform = 'scale(1.2)';
      setTimeout(() => {
        bestStreakEl.style.transform = 'scale(1)';
      }, 300);
    }

    if (player >= 5 || cpu >= 5) {
      if (player > cpu) {
        sound.playWin();
        resultEl.textContent = '🎊 VICTORY! You won the match! 🎊';
        resultEl.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(16, 185, 129, 0.2))';
        resultEl.style.fontSize = '1.5rem';
        gameContainer.style.animation = 'pulse 0.5s ease-in-out';
      } else {
        sound.playGameOver();
        resultEl.textContent = '💔 DEFEAT! CPU won the match!';
        resultEl.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.2))';
        resultEl.style.fontSize = '1.5rem';
      }
      // Brief pause then reset match
      setTimeout(() => { 
        player = 0; 
        cpu = 0; 
        playerScoreEl.textContent = '0';
        cpuScoreEl.textContent = '0';
        resultEl.textContent = 'Choose your move!';
        resultEl.style.background = 'rgba(139, 92, 246, 0.2)';
        resultEl.style.fontSize = '1.2rem';
        gameContainer.style.animation = '';
      }, 3000);
    }
  }

  function icon(id){ return ({rock:'✊',paper:'✋',scissors:'✌️'})[id]; }

  function onClick(e){
    if (pending) return;
    pending = true;
    setButtonsEnabled(false);
    const button = e.currentTarget;
    const id = button.dataset.id;
    sound.playClick();
    
    // Highlight selected button
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.8)';
    
    // Show a thinking message before CPU decides
    resultEl.textContent = `You chose ${icon(id)} — 🤔 AI is thinking…`;
    resultEl.style.background = 'rgba(139, 92, 246, 0.3)';

    thinkTimer = setTimeout(() => {
      resolveRound(id);
      pending = false;
      setButtonsEnabled(true);
      // Reset button style
      button.style.transform = '';
      button.style.boxShadow = '';
      thinkTimer = null;
    }, AI_DELAY_MS);
  }
  buttons.forEach(b => b.addEventListener('click', onClick));

  // Hub button handler
  hubBtn.addEventListener('click', () => {
    sound.playClick();
    location.hash = '#/';
  });

  // Tutorial button - replay tutorial
  tutorialBtn.addEventListener('click', () => {
    sound.playClick();
    
    // Create a new tutorial overlay
    const newTutorialOverlay = document.createElement('div');
    newTutorialOverlay.className = 'rps-tutorial-overlay';
    newTutorialOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
    `;

    const newTutorialBox = document.createElement('div');
    newTutorialBox.className = 'rps-tutorial-box';
    newTutorialBox.style.cssText = `
      max-width: 600px;
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      padding: 2.5rem;
      border-radius: 20px;
      border: 3px solid #8b5cf6;
      box-shadow: 0 0 50px rgba(139, 92, 246, 0.5);
      text-align: center;
    `;

    newTutorialOverlay.appendChild(newTutorialBox);
    document.body.appendChild(newTutorialOverlay);

    // Define tutorial steps for replay
    const replaySteps = [
      {
        title: '🎓 Welcome Back!',
        message: 'Let\'s review how to play Rock Paper Scissors!',
        highlight: null
      },
      {
        title: '🎯 The Goal',
        message: 'Be the first to win <strong>5 points</strong> against the CPU!<br><br>It\'s a race to 5 rounds.',
        highlight: scoreDisplay
      },
      {
        title: '✊ Rock Beats Scissors',
        message: 'Rock crushes Scissors!<br><br>When you choose Rock and CPU chooses Scissors, <strong>you win</strong> the round.',
        highlight: buttons[0]
      },
      {
        title: '✋ Paper Beats Rock',
        message: 'Paper covers Rock!<br><br>When you choose Paper and CPU chooses Rock, <strong>you win</strong> the round.',
        highlight: buttons[1]
      },
      {
        title: '✌️ Scissors Beats Paper',
        message: 'Scissors cuts Paper!<br><br>When you choose Scissors and CPU chooses Paper, <strong>you win</strong> the round.',
        highlight: buttons[2]
      },
      {
        title: '🤝 Draws',
        message: 'If you and the CPU choose the same option, it\'s a <strong>draw</strong>!<br><br>No points are awarded, just play again.',
        highlight: resultEl
      },
      {
        title: '🤖 AI Thinking',
        message: 'After you make your choice, the CPU will think for a moment before revealing its move.<br><br>Wait for the result!',
        highlight: resultEl
      },
      {
        title: '🏆 Best Streak',
        message: 'Your <strong>best winning streak</strong> is tracked!<br><br>Try to beat your record with consecutive wins.',
        highlight: bestEl
      },
      {
        title: '🎮 Ready to Play!',
        message: 'Click any button to make your move!<br><br>Good luck beating the CPU! ✊✋✌️',
        highlight: choices
      }
    ];

    let replayStep = 0;

    function showReplayStep(stepIndex) {
      if (stepIndex >= replaySteps.length) {
        newTutorialOverlay.remove();
        document.querySelectorAll('.rps-tutorial-highlight').forEach(el => el.remove());
        return;
      }

      const step = replaySteps[stepIndex];
      newTutorialBox.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">${step.title.split(' ')[0]}</div>
        <h2 style="color: #8b5cf6; font-size: 1.8rem; margin-bottom: 1rem;">${step.title.substring(step.title.indexOf(' ') + 1)}</h2>
        <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
          ${step.message}
        </p>
        <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
          Step ${stepIndex + 1} of ${replaySteps.length}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          ${stepIndex < replaySteps.length - 1 ?
            '<button class="replay-next button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Next ➡️</button>' :
            '<button class="replay-finish button" style="padding: 0.75rem 2rem; font-size: 1rem; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold;">Got It! 🎉</button>'
          }
          <button class="replay-close button" style="padding: 0.75rem 1.5rem; font-size: 1rem; background: rgba(100, 116, 139, 0.3); border: 2px solid #64748b; border-radius: 12px; color: #cbd5e1; cursor: pointer;">Close</button>
        </div>
      `;

      // Highlight element
      document.querySelectorAll('.rps-tutorial-highlight').forEach(el => el.remove());
      if (step.highlight) {
        const highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'rps-tutorial-highlight';
        const rect = step.highlight.getBoundingClientRect();
        highlightOverlay.style.cssText = `
          position: fixed;
          top: ${rect.top - 10}px;
          left: ${rect.left - 10}px;
          width: ${rect.width + 20}px;
          height: ${rect.height + 20}px;
          border: 3px solid #8b5cf6;
          border-radius: 15px;
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
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
          document.querySelectorAll('.rps-tutorial-highlight').forEach(el => el.remove());
        };
      }

      if (closeBtn) {
        closeBtn.onclick = () => {
          sound.playClick();
          newTutorialOverlay.remove();
          document.querySelectorAll('.rps-tutorial-highlight').forEach(el => el.remove());
        };
      }
    }

    showReplayStep(0);
  });

  // Start screen button
  const startScreenBtn = startScreen.querySelector('.rps-start-btn');
  if (startScreenBtn) {
    startScreenBtn.addEventListener('click', () => {
      sound.playClick();
      if (startScreen) startScreen.remove();
      // Scroll to game window
      setTimeout(() => {
        gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });
  }

  // Hub button handler from start screen
  const startScreenHubBtn = startScreen.querySelector('.rps-start-hub-btn');
  if (startScreenHubBtn) {
    startScreenHubBtn.addEventListener('click', () => {
      sound.playClick();
      if (startScreen) startScreen.remove();
      location.hash = '#/';
    });
  }

  // Scroll indicator logic
  function updateScrollIndicators() {
    const scrollY = window.scrollY || window.pageYOffset;
    const threshold = 100;
    
    if (startScrollIndicator && document.body.contains(startScrollIndicator) && !startScrollIndicator.classList.contains('hidden')) {
      if (scrollY > threshold) {
        startScrollIndicator.textContent = '⬆️ Scroll Up to Start';
        startScrollIndicator.style.background = 'rgba(59, 130, 246, 0.9)';
      } else {
        startScrollIndicator.textContent = '⬇️ Scroll Down to Game';
        startScrollIndicator.style.background = 'rgba(139, 92, 246, 0.9)';
      }
    }
  }

  // Add scroll event listener
  window.addEventListener('scroll', updateScrollIndicators);
  
  // Make indicator clickable
  if (startScrollIndicator) {
    startScrollIndicator.addEventListener('click', () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 100) {
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Scroll to game
        choices.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // Initialize scroll indicators
  updateScrollIndicators();

  return () => {
    if (thinkTimer) clearTimeout(thinkTimer);
    buttons.forEach(b => b.removeEventListener('click', onClick));
    window.removeEventListener('scroll', updateScrollIndicators);
    wrap.remove();
    if (startScreen) startScreen.remove();
    if (startScrollIndicator) startScrollIndicator.remove();
    if (tutorialOverlay) tutorialOverlay.remove();
    document.querySelectorAll('.rps-tutorial-highlight').forEach(el => el.remove());
  };
}
