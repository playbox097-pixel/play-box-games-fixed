// games/numberGuess.js
import { sound } from '../sound.js';
import { getNumber, setNumber } from '../highScores.js';

const DIFFICULTIES = {
  easy:  { id: 'easy',   label: 'Easy',   max: 50,  attempts: 10 },
  medium:{ id: 'medium', label: 'Medium', max: 100, attempts: 7  },
  hard:  { id: 'hard',   label: 'Hard',   max: 500, attempts: 5  },
};

const BEST_KEY_PREFIX = 'number-guess:best:';
const TUTORIAL_KEY = 'number-guess-tutorial-completed';

function makeButton(text) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  return btn;
}

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'number-guess';

  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const tutorialBtn = makeButton('🎓 Tutorial');
  tutorialBtn.classList.add('button');
  tutorialBtn.style.backgroundColor = '#10b981';

  const difficultyBadge = badge('Difficulty: Easy (1–50)');
  const attemptsBadge = badge('Attempts left: 10');
  const bestBadge = badge('Best: --');
  toolbar.append(tutorialBtn, difficultyBadge, attemptsBadge, bestBadge);

  const rulesEl = createRules([
    'Pick a difficulty: Easy, Medium, or Hard.',
    'The game secretly chooses a number in the shown range.',
    'Type a guess and press Guess. You will be told if it is higher or lower.',
    'You have limited attempts — fewer on harder difficulties.',
    'Use the Hint button if you are stuck to narrow the range.',
    'Try to find the number in as few guesses as possible!'
  ]);

  const diffBar = document.createElement('div');
  diffBar.className = 'difficulty-bar';

  const feedback = document.createElement('div');
  feedback.className = 'guess-feedback';
  feedback.textContent = 'Pick a difficulty, then start guessing!';

  const row = document.createElement('div');
  row.className = 'guess-row';

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'guess-input';
  input.placeholder = 'Enter your guess';
  input.min = '1';

  const guessBtn = document.createElement('button');
  guessBtn.type = 'button';
  guessBtn.className = 'button primary';
  guessBtn.textContent = 'Guess';

  const hintBtn = document.createElement('button');
  hintBtn.type = 'button';
  hintBtn.className = 'button';
  hintBtn.textContent = 'Hint';

  const newBtn = document.createElement('button');
  newBtn.type = 'button';
  newBtn.className = 'button';
  newBtn.textContent = 'New number';

  row.append(input, guessBtn, hintBtn, newBtn);

  const history = document.createElement('ul');
  history.className = 'guess-history';

  wrap.append(toolbar, rulesEl, diffBar, feedback, row, history);
  root.appendChild(wrap);

  let currentDiff = DIFFICULTIES.easy;
  let secret = 0;
  let attemptsLeft = 0;
  let totalGuesses = 0;
  let gameOver = false;
  let hintUsed = false;

  const diffButtons = [];

  // --- Tutorial System ---
  function showTutorial() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';

    const box = document.createElement('div');
    box.style.backgroundColor = '#1f2937';
    box.style.border = '2px solid #10b981';
    box.style.borderRadius = '12px';
    box.style.padding = '30px';
    box.style.maxWidth = '500px';
    box.style.width = '100%';
    box.style.color = '#fff';
    box.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';

    const title = document.createElement('h2');
    title.style.margin = '0 0 15px 0';
    title.style.color = '#10b981';
    title.style.fontSize = '24px';

    const content = document.createElement('p');
    content.style.margin = '0 0 20px 0';
    content.style.fontSize = '16px';
    content.style.lineHeight = '1.5';

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '10px';
    btnRow.style.justifyContent = 'space-between';

    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back';
    backBtn.className = 'button';
    backBtn.style.flex = '1';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.className = 'button primary';
    nextBtn.style.flex = '1';

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip';
    skipBtn.className = 'button';

    btnRow.append(backBtn, skipBtn, nextBtn);
    box.append(title, content, btnRow);
    overlay.appendChild(box);

    const steps = [
      {
        title: '🎯 Welcome to Number Guess!',
        text: 'Test your guessing skills! The computer picks a secret number, and you must find it within limited attempts. Can you beat your best score?'
      },
      {
        title: '🎮 Choose Your Difficulty',
        text: 'Pick Easy (1-50, 10 attempts), Medium (1-100, 7 attempts), or Hard (1-500, 5 attempts). Higher difficulties mean bigger ranges and fewer guesses!'
      },
      {
        title: '🔢 Making Guesses',
        text: 'Type a number in the input box and click Guess. The game will tell you if you need to go HIGHER or LOWER. Pay attention to the hints!'
      },
      {
        title: '🌡️ Temperature Hints',
        text: 'After each guess, you\'ll see: 🔥 Very Close, Warm, or Cold. Use these clues to narrow down the secret number!'
      },
      {
        title: '💡 Hint System',
        text: 'Stuck? Click the Hint button to reveal a smaller range where the secret number is hiding. You can only use one hint per round!'
      },
      {
        title: '🏆 Track Your Best',
        text: 'The game remembers your best score for each difficulty. Try to guess in fewer attempts to set new records!'
      },
      {
        title: '✨ Ready to Play!',
        text: 'Pick a difficulty and start guessing! Use logic, hints, and temperature clues to find the secret number. Good luck!'
      }
    ];

    let currentStep = 0;

    function render() {
      const step = steps[currentStep];
      title.textContent = step.title;
      content.textContent = step.text;

      backBtn.style.display = currentStep === 0 ? 'none' : 'block';
      nextBtn.textContent = currentStep === steps.length - 1 ? 'Done' : 'Next';
    }

    backBtn.onclick = () => {
      if (currentStep > 0) {
        currentStep--;
        render();
      }
    };

    nextBtn.onclick = () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        render();
      } else {
        localStorage.setItem(TUTORIAL_KEY, 'true');
        document.body.removeChild(overlay);
        setTimeout(() => {
          wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    skipBtn.onclick = () => {
      localStorage.setItem(TUTORIAL_KEY, 'true');
      document.body.removeChild(overlay);
      setTimeout(() => {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };

    render();
    document.body.appendChild(overlay);
  }

  Object.values(DIFFICULTIES).forEach((cfg) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'difficulty-pill';
    b.dataset.id = cfg.id;
    b.textContent = cfg.label;
    diffBar.appendChild(b);
    diffButtons.push(b);
  });

  function badge(text) {
    const s = document.createElement('span');
    s.className = 'badge';
    s.textContent = text;
    return s;
  }

  function createRules(items) {
    const d = document.createElement('details');
    d.className = 'rules';
    const s = document.createElement('summary');
    s.textContent = 'Rules';
    const ul = document.createElement('ul');
    items.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    d.append(s, ul);
    return d;
  }

  function setDifficulty(id) {
    const cfg = DIFFICULTIES[id] || DIFFICULTIES.easy;
    currentDiff = cfg;
    diffButtons.forEach((b) => {
      b.classList.toggle('difficulty-pill--active', b.dataset.id === cfg.id);
    });

    difficultyBadge.textContent = `Difficulty: ${cfg.label} (1–${cfg.max})`;

    const best = getNumber(BEST_KEY_PREFIX + cfg.id, 0);
    bestBadge.textContent = best > 0 ? `Best: ${best} guesses` : 'Best: --';

    startRound();
  }

  function startRound() {
    secret = 1 + Math.floor(Math.random() * currentDiff.max);
    attemptsLeft = currentDiff.attempts;
    totalGuesses = 0;
    gameOver = false;
    attemptsBadge.textContent = `Attempts left: ${attemptsLeft}`;
    feedback.textContent = `I\'ve picked a number between 1 and ${currentDiff.max}. Try to guess it!`;
    history.innerHTML = '';
    input.value = '';
    input.disabled = false;
    guessBtn.disabled = false;
    hintBtn.disabled = false;
    hintUsed = false;
    input.focus();
  }

  function lockInputs() {
    input.disabled = true;
    guessBtn.disabled = true;
    hintBtn.disabled = true;
  }

  function recordBestIfNeeded() {
    const key = BEST_KEY_PREFIX + currentDiff.id;
    const prev = getNumber(key, 0);
    if (!prev || totalGuesses < prev) {
      setNumber(key, totalGuesses);
      bestBadge.textContent = `Best: ${totalGuesses} guesses`;
    } else if (prev) {
      bestBadge.textContent = `Best: ${prev} guesses`;
    }
  }

  function addHistoryLine(text) {
    const li = document.createElement('li');
    li.textContent = text;
    history.prepend(li);
  }

  function handleGuess() {
    if (gameOver) return;
    const raw = input.value.trim();
    const value = Number(raw);

    if (!raw) {
      feedback.textContent = 'Type a number first.';
      return;
    }
    if (!Number.isFinite(value)) {
      feedback.textContent = 'That is not a valid number.';
      return;
    }
    if (value < 1 || value > currentDiff.max) {
      feedback.textContent = `Stay in range: 1 to ${currentDiff.max}.`;
      return;
    }

    sound.playMove();

    attemptsLeft -= 1;
    totalGuesses += 1;

    if (value === secret) {
      const msg = `Correct! ${value} was the number in ${totalGuesses} guess${totalGuesses === 1 ? '' : 'es'}.`;
      feedback.textContent = msg;
      addHistoryLine(msg);
      attemptsBadge.textContent = `Attempts left: ${attemptsLeft}`;
      sound.playWin();
      gameOver = true;
      lockInputs();
      recordBestIfNeeded();
      return;
    }

    const tooHigh = value > secret;
    const directionMsg = tooHigh ? 'Too high — go lower.' : 'Too low — go higher.';
    const distance = Math.abs(value - secret);
    const closeThreshold = Math.max(2, Math.floor(currentDiff.max * 0.05));
    const warmThreshold = Math.max(5, Math.floor(currentDiff.max * 0.12));

    let heat;
    if (distance <= closeThreshold) heat = ' (🔥 very close)';
    else if (distance <= warmThreshold) heat = ' (warm)';
    else heat = ' (cold)';

    const line = `Guess ${totalGuesses}: ${value} → ${directionMsg}${heat}`;
    addHistoryLine(line);

    if (attemptsLeft <= 0) {
      feedback.textContent = `Game over — ${directionMsg} No attempts left. The number was ${secret}.`;
      attemptsBadge.textContent = 'Attempts left: 0';
      sound.playGameOver();
      gameOver = true;
      lockInputs();
      return;
    }

    feedback.textContent = `${directionMsg}${heat} Attempts left: ${attemptsLeft}.`;
    attemptsBadge.textContent = `Attempts left: ${attemptsLeft}`;
    input.value = '';
    input.focus();
  }

  function giveHint() {
    if (gameOver) {
      feedback.textContent = 'Round over. Start a new number to keep playing.';
      return;
    }
    if (hintUsed) {
      feedback.textContent = 'You already used your hint this round.';
      return;
    }
    const span = Math.max(3, Math.floor(currentDiff.max * 0.18));
    const low = Math.max(1, secret - span);
    const high = Math.min(currentDiff.max, secret + span);
    feedback.textContent = `Hint: it\'s between ${low} and ${high}.`;
    hintUsed = true;
    hintBtn.disabled = true;
    sound.playClick();
  }

  function handleDifficultyClick(e) {
    const id = e.currentTarget.dataset.id;
    sound.playClick();
    setDifficulty(id);
  }

  diffButtons.forEach((b) => b.addEventListener('click', handleDifficultyClick));
  tutorialBtn.addEventListener('click', () => {
    sound.playClick();
    setTimeout(() => {
      document.body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    setTimeout(() => {
      showTutorial();
    }, 300);
  });
  guessBtn.addEventListener('click', () => {
    sound.playClick();
    handleGuess();
  });
  hintBtn.addEventListener('click', giveHint);
  newBtn.addEventListener('click', () => {
    sound.playClick();
    startRound();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleGuess();
    }
  });

  // Get best score across all difficulties for start screen
  let bestScore = 0;
  Object.values(DIFFICULTIES).forEach((cfg) => {
    const score = getNumber(BEST_KEY_PREFIX + cfg.id, 0);
    if (score > 0 && (bestScore === 0 || score < bestScore)) {
      bestScore = score;
    }
  });

  // Start screen
  const startScreen = document.createElement('div');
  startScreen.innerHTML = `
    <div style="
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
        border: 2px solid #f59e0b;
        box-shadow: 0 0 40px rgba(245, 158, 11, 0.3);
      ">
        <div style="font-size: 4rem; margin-bottom: 0.5rem; animation: bounce 1s infinite;">
          🎯
        </div>
        <h1 style="
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        ">Number Guess</h1>
        <p style="color: #94a3b8; margin-bottom: 2rem; font-size: 1.1rem;">
          Test your intuition!
        </p>
        
        <div style="
          background: rgba(15, 23, 42, 0.6);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
          border: 1px solid rgba(245, 158, 11, 0.2);
        ">
          <h3 style="color: #f59e0b; margin-bottom: 1rem; font-size: 1.2rem;">🎮 How to Play</h3>
          <ul style="color: #cbd5e1; list-style: none; padding: 0; line-height: 1.8;">
            <li>🔢 Guess the secret number</li>
            <li>🔥 Get hot/cold feedback</li>
            <li>💡 Use hints to narrow it down</li>
            <li>⏱️ Beat your best score!</li>
          </ul>
        </div>

        <div style="
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        ">
          <div style="
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            text-align: center;
          ">
            <div style="color: #f59e0b; font-weight: bold; font-size: 1.5rem;">${bestScore || '—'}</div>
            <div style="color: #64748b; font-size: 0.85rem;">Best Score</div>
          </div>
          <div style="
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid #8b5cf6;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            text-align: center;
          ">
            <div style="color: #8b5cf6; font-weight: bold; font-size: 1.5rem;">3</div>
            <div style="color: #64748b; font-size: 0.85rem;">Difficulties</div>
          </div>
        </div>

        <button class="number-guess-start-btn" type="button" style="
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: pulse 2s infinite;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(245, 158, 11, 0.5)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
          � Start Game
        </button>

        <button class="number-guess-hub-btn" type="button" style="
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
  root.appendChild(startScreen);

  const numGuessStartBtn = startScreen.querySelector('.number-guess-start-btn');
  const numGuessHubBtn = startScreen.querySelector('.number-guess-hub-btn');

  numGuessStartBtn.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    setTimeout(() => {
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  numGuessHubBtn.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    location.hash = '#/';
  });

  // Show tutorial for first-time players
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    setTimeout(() => {
      showTutorial();
    }, 500);
  }

  // Add hub button to toolbar
  const hubToolbarBtn = document.createElement('button');
  hubToolbarBtn.type = 'button';
  hubToolbarBtn.className = 'button';
  hubToolbarBtn.textContent = '🏠 Hub';
  hubToolbarBtn.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
  `;
  hubToolbarBtn.addEventListener('mouseenter', () => {
    hubToolbarBtn.style.transform = 'scale(1.05)';
  });
  hubToolbarBtn.addEventListener('mouseleave', () => {
    hubToolbarBtn.style.transform = 'scale(1)';
  });
  hubToolbarBtn.addEventListener('click', () => {
    sound.playClick();
    location.hash = '#/';
  });
  toolbar.appendChild(hubToolbarBtn);

  setDifficulty('easy');

  return () => {
    diffButtons.forEach((b) => b.removeEventListener('click', handleDifficultyClick));
    guessBtn.removeEventListener('click', handleGuess);
    hintBtn.removeEventListener('click', giveHint);
    newBtn.replaceWith(newBtn.cloneNode(true));
    if (startScreen.parentNode) startScreen.remove();
    wrap.remove();
  };
}
