// --- Safe Export/Import Accounts ---
document.getElementById('export-accounts-btn').addEventListener('click', function () {
  try {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const blob = new Blob([JSON.stringify(accounts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Failed to export accounts.');
  }
});

document.getElementById('import-accounts-input').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      // Optionally: validate each account object structure here
      localStorage.setItem('accounts', JSON.stringify(imported));
      alert('Accounts imported! You may now log in.');
      location.reload();
    } catch (err) {
      alert('Import failed: Invalid file.');
    }
  };
  reader.readAsText(file);
});
// --- Simple Login System ---
document.addEventListener('DOMContentLoaded', () => {
  const loginPanel = document.getElementById('login-panel');
  const showLoginBtn = document.getElementById('show-login-btn');
  const showRegisterBtn = document.getElementById('show-register-btn');
  const loginForm = document.getElementById('login-form');
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const loginBtn = document.getElementById('login-btn');
  const registerForm = document.getElementById('register-form');
  const registerUsername = document.getElementById('register-username');
  const registerPassword = document.getElementById('register-password');
  const registerBtn = document.getElementById('register-btn');
  const welcomeUser = document.getElementById('welcome-user');
  const welcomeMsg = document.getElementById('welcome-msg');
  const logoutBtn = document.getElementById('logout-btn');
  const LS_USER_KEY = 'playbox:user';
  const loginError = document.getElementById('login-error');
  // Toggle between login and register forms
  if (showLoginBtn && showRegisterBtn && loginForm && registerForm) {
    showLoginBtn.addEventListener('click', () => {
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      if (loginUsername) loginUsername.focus();
      clearLoginError();
    });
    showRegisterBtn.addEventListener('click', () => {
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
      if (registerUsername) registerUsername.focus();
      clearLoginError();
    });
  }

  function showLoginError(msg) {
    if (loginError) {
      loginError.textContent = msg;
      loginError.style.display = 'block';
    }
  }
  function clearLoginError() {
    if (loginError) {
      loginError.textContent = '';
      loginError.style.display = 'none';
    }
  }

  function showWelcome(username, isReturning = false) {
    loginForm.style.display = 'none';
    registerForm && (registerForm.style.display = 'none');
    welcomeUser.style.display = 'flex';
    welcomeMsg.textContent = isReturning ? `Welcome back, ${username}!` : `Welcome, ${username}!`;
  }
  function showLogin() {
    loginForm.style.display = 'flex';
    welcomeUser.style.display = 'none';
    loginUsername.value = '';
    loginPassword.value = '';
  }
  function tryAutoLogin() {
    const user = JSON.parse(localStorage.getItem(LS_USER_KEY) || 'null');
    if (user && user.username && user.password) {
      showWelcome(user.username);
    } else {
      showLogin();
    }
  }
  // Registration logic
  if (registerForm && registerBtn && registerUsername && registerPassword) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = registerUsername.value.trim();
      const password = registerPassword.value;
      clearLoginError();
      if (username.length < 3) {
        showLoginError('Username must be at least 3 characters.');
        return;
      }
      if (password.length < 6) {
        showLoginError('Password must be at least 6 characters.');
        return;
      }
      if (!/[a-zA-Z]/.test(password)) {
        showLoginError('Password must include at least 1 letter.');
        return;
      }
      if (!/[^a-zA-Z0-9]/.test(password)) {
        showLoginError('Password must include at least 1 special character.');
        return;
      }
      // Save new user (revert to old logic)
      localStorage.setItem(LS_USER_KEY, JSON.stringify({ username, password }));
      showWelcome(username, false);
    });
  }
  // Login logic
  if (loginForm && loginBtn && loginUsername && loginPassword) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = loginUsername.value.trim();
      const password = loginPassword.value;
      clearLoginError();
      const user = JSON.parse(localStorage.getItem(LS_USER_KEY) || 'null');
      if (!user || user.username !== username) {
        showLoginError('No account found for this username.');
        return;
      }
      if (user.password !== password) {
        showLoginError('Incorrect password.');
        return;
      }
  showWelcome(username, true);
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(LS_USER_KEY);
      showLogin();
      clearLoginError();
    });
  }
  tryAutoLogin();
});
// --- BitPlay Price Graph (Safe Integration) ---
document.addEventListener('DOMContentLoaded', () => {
  const bitplayGraph = document.getElementById('bitplay-graph');
  if (!bitplayGraph) return;
  let bitplayPriceHistory = [];
  const BITPLAY_HISTORY_MAX = 100;

  function addBitPlayPriceToHistory(price) {
    bitplayPriceHistory.push(price);
    if (bitplayPriceHistory.length > BITPLAY_HISTORY_MAX) {
      bitplayPriceHistory.shift();
    }
  }

  function drawBitPlayGraph() {
    if (!bitplayGraph) return;
    const ctx = bitplayGraph.getContext('2d');
    ctx.clearRect(0, 0, bitplayGraph.width, bitplayGraph.height);
    if (bitplayPriceHistory.length < 2) return;
    // Find min/max
    const min = Math.min(...bitplayPriceHistory);
    const max = Math.max(...bitplayPriceHistory);
    const range = max - min || 1;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    bitplayPriceHistory.forEach((p, i) => {
      const x = (i / (BITPLAY_HISTORY_MAX - 1)) * bitplayGraph.width;
      const y = bitplayGraph.height - ((p - min) / range) * (bitplayGraph.height - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Draw current price dot
    const lastX = ((bitplayPriceHistory.length - 1) / (BITPLAY_HISTORY_MAX - 1)) * bitplayGraph.width;
    const lastY = bitplayGraph.height - ((bitplayPriceHistory[bitplayPriceHistory.length - 1] - min) / range) * (bitplayGraph.height - 8) - 4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Hook into price update
  const originalUpdateBitPlayPrice = economy.updateBitPlayPrice.bind(economy);
  economy.updateBitPlayPrice = function() {
    originalUpdateBitPlayPrice();
    addBitPlayPriceToHistory(economy.bitPlayPrice);
    drawBitPlayGraph();
  };

  // Initialize with current price
  addBitPlayPriceToHistory(economy.bitPlayPrice);
  drawBitPlayGraph();
});
// --- Stats Panel Open/Close ---
document.addEventListener('DOMContentLoaded', () => {
  const statsToggle = document.getElementById('stats-toggle');
  const statsPanel = document.getElementById('stats-panel');
  const statsClose = document.getElementById('stats-close');
  // Robustly select the 'BUY A PLAY MATE' button by text content, anywhere in the document
  function findPlaymateBtn() {
    return Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.trim().toLowerCase() === 'buy a play mate');
  }
  let playmateBtn = findPlaymateBtn();
  if (!playmateBtn) {
    // Try again after DOM updates (in case button is rendered later)
    setTimeout(() => {
      playmateBtn = findPlaymateBtn();
      if (!playmateBtn) {
        console.warn("Could not find the 'BUY A PLAY MATE' button. Please check the selector or button text.");
      }
    }, 1000);
  }
  function setPlaymateBtnHidden(hidden) {
    if (!playmateBtn) playmateBtn = findPlaymateBtn();
    if (!playmateBtn) return;
    playmateBtn.style.display = hidden ? 'none' : '';
  }
  if (statsToggle && statsPanel) {
    statsToggle.addEventListener('click', () => {
      const opening = statsPanel.classList.toggle('hidden') === false || !statsPanel.classList.contains('hidden');
      setPlaymateBtnHidden(opening);
    });
  }
  if (statsClose && statsPanel) {
    statsClose.addEventListener('click', () => {
      statsPanel.classList.add('hidden');
      setPlaymateBtnHidden(false);
    });
  }
  if (playmateBtn && statsPanel) {
    playmateBtn.addEventListener('click', () => {
      if (!statsPanel.classList.contains('hidden')) {
        statsPanel.classList.add('hidden');
        setPlaymateBtnHidden(false);
      }
    });
  }
});

// main.js - Play Box bootstrap and router

import { sound } from './sound.js';
import { getHighScore } from './highScores.js';
import { debounce, throttle, batchDOMUpdates, createThrottledStorage } from './performanceUtils.js';
import InGameEconomy from './InGameEconomy.js';

// --- In-Game Economy System ---
const economy = new InGameEconomy();

function updateEconomyPanel() {
  document.getElementById('pb-balance').textContent = `💰 Playbux: ${economy.playbux} PB`;
  document.getElementById('bp-balance').textContent = `🪙 BitPlay: ${economy.bitPlay} BP`;
  document.getElementById('bp-price').textContent = `BP Price: ${economy.bitPlayPrice} PB`;
  // Also sync stats panel Playbux
  const statsPlaybux = document.getElementById('stats-playbux');
  if (statsPlaybux) statsPlaybux.textContent = economy.playbux;
}

// Ensure economy.playbux matches stats panel Playbux on page load
document.addEventListener('DOMContentLoaded', () => {
  const statsPlaybux = document.getElementById('stats-playbux');
  if (statsPlaybux) {
    const n = Number(statsPlaybux.textContent);
    if (Number.isFinite(n)) economy.playbux = n;
    updateEconomyPanel();
  }
});

function showBpMessage(msg, isError = false) {
  const el = document.getElementById('bp-message');
  el.textContent = msg;
  el.style.color = isError ? '#f44' : '#0af';
  setTimeout(() => { el.textContent = ''; }, 3000);
}

function setupEconomyPanel() {
  updateEconomyPanel();
  const buyBtn = document.getElementById('buy-bp-btn');
  const sellBtn = document.getElementById('sell-bp-btn');
  let buyCooldown = false;
  let cooldownTimeout = null;
  buyBtn.onclick = () => {
    if (buyCooldown) return;
    const result = economy.buyBitPlay(1);
    updateEconomyPanel();
    // Only show message if not a cooldown error
    if (!(result.message && result.message.toLowerCase().includes('cooldown'))) {
      showBpMessage(result.message, !result.success);
    }
    if (result.success) {
      buyCooldown = true;
      const originalText = buyBtn.textContent;
      let seconds = 3;
      buyBtn.textContent = `Cooldown: ${seconds}`;
      buyBtn.disabled = true;
      if (cooldownTimeout) clearTimeout(cooldownTimeout);
      const interval = setInterval(() => {
        seconds--;
        if (seconds > 0) {
          buyBtn.textContent = `Cooldown: ${seconds}`;
        } else {
          clearInterval(interval);
          buyBtn.textContent = originalText;
          buyBtn.disabled = false;
          buyCooldown = false;
        }
      }, 1000);
    }
  };
  sellBtn.onclick = () => {
    const result = economy.sellBitPlay(1);
    updateEconomyPanel();
    showBpMessage(result.message, !result.success);
  };
  // Update price every time it changes
  setInterval(updateEconomyPanel, 2000);
}

// Wait for DOMContentLoaded to ensure panel exists
document.addEventListener('DOMContentLoaded', setupEconomyPanel);

const games = [
  // ...existing games...
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    description: 'Classic 3×3 battle',
    emoji: '❌⭕',
    tags: ['classic', 'multiplayer'],
    mood: ['⏱️', '👥'], // Short, 2P
    difficulty: 1, // Easy
    controls: '🖱️ Click to place', // NEW
    addedAt: 1,
    loader: () => import('./games/ticTacToe.js'),
  },
  {
    id: 'tic-tac-toe-ai',
    name: 'Tic-Tac-Toe AI Duel',
    description: 'Watch two AIs battle with a win-streak scoreboard',
    emoji: '🤖❌⭕',
    tags: ['classic', 'ai'],
    mood: ['😌', '😂'], // Chill, Funny
    difficulty: 1, // Easy
    controls: '👀 Watch & enjoy',
    addedAt: 12,
    loader: () => import('./games/ticTacToeAi.js'),
  },
  {
    id: 'snake',
    name: 'Slither Rush',
    description: 'Eat apples, avoid yourself',
    emoji: '🐍',
    tags: ['classic'],
    mood: ['⚡', '🧠'], // Fast, Thinky
    difficulty: 2, // Medium
    controls: '⬆️⬇️⬅️➡️ Arrow keys',
    addedAt: 2,
    loader: () => import('./games/snake.js'),
  },
  {
    id: 'rock-paper-scissors',
    name: 'Rock Paper Win',
    description: 'First to 5 wins!',
    emoji: '🪨📄✂️',
    tags: ['classic'],
    mood: ['⏱️', '😂'], // Short, Funny
    difficulty: 1, // Easy
    controls: '🖱️ Click your choice',
    addedAt: 3,
    loader: () => import('./games/rockPaperScissors.js'),
  },
  {
    id: 'breakout',
    name: 'Brick Blaster',
    description: 'Atari-style blocks with power-ups',
    emoji: '🧱',
    tags: ['classic'],
    mood: ['⚡', '😌'], // Fast, Chill
    difficulty: 2, // Medium
    controls: '⬅️➡️ Move paddle | Space: Pause',
    addedAt: 4,
    loader: () => import('./games/breakout.js'),
  },
  {
    id: 'tetris',
    name: 'Block Rush',
    description: 'Stack falling blocks with hold & pause',
    emoji: '🧩',
    tags: ['classic'],
    mood: ['⚡', '🧠'], // Fast, Thinkys
    difficulty: 2, // Medium
    controls: '⬅️➡️ Move | ⬆️ Rotate | ⬇️ Drop',
    addedAt: 5,
    loader: () => import('./games/tetris.js'),
  },
  {
    id: 'rps-multiplayer',
    name: 'Rock Paper Cut',
    description: 'Local 2-player showdown',
    emoji: '🤝',
    tags: ['multiplayer'],
    mood: ['👥', '😂'], // 2P, Funny
    difficulty: 1, // Easy
    controls: '🖱️ P1 & P2 click',
    addedAt: 6,
    loader: () => import('./games/rpsMultiplayer.js'),
  },
  {
    id: 'rat-run',
    name: 'Rat Run',
    description: 'Dodge traps, grab cheese, unlock skins',
    emoji: '🐀',
    tags: ['classic'],
    mood: ['⚡', '🧠'], // Fast, Thinky
    difficulty: 2, // Medium
    controls: '⬆️⬇️⬅️➡️ Move | Space: Jump',
    addedAt: 7,
    loader: () => import('./games/ratRun.js'),
  },
  {
    id: 'number-guess',
    name: 'Number Guess',
    description: 'Pick a difficulty and guess the hidden number',
    emoji: '🎯',
    tags: ['classic'],
    mood: ['😌', '🧠'], // Chill, Thinky
    difficulty: 1, // Easy
    controls: '⌨️ Type numbers',
    addedAt: 8,
    loader: () => import('./games/numberGuess.js'),
  },
  {
    id: 'level-devil',
    name: 'Level Devil',
    description: '50 devilishly hard platformer levels with spikes, traps, and obstacles.',
    emoji: '😈🔥',
    tags: ['arcade', 'single'],
    mood: ['⚡', '🧠'], // Fast, Thinky
    difficulty: 3, // Hard
    controls: '⬅️➡️ Move | ⬆️/Space: Jump',
    addedAt: 30,
    loader: () => import('./games/levelDevil.js'),
  },
  {
    id: 'pixel-pirates',
    name: 'Pixel Pirates',
    description: 'Sail the high seas! Defeat enemy pirate ships, collect treasure, and survive waves of attackers.',
    emoji: '🏴‍☠️⚓',
    tags: ['arcade', 'shooting'],
    mood: ['⚡', '😊'], // Fast, Chill
    difficulty: 2, // Medium
    controls: '⬅️➡️⬆️⬇️ Move | Space: Fire Cannons',
    addedAt: 31,
    loader: () => import('./games/pixelPirates.js'),
  },
  {
    id: 'fruit-shooter',
    name: 'Enemy Warzone',
    description: '25-level space shooter with fruit power-ups & a boss fight',
    emoji: '🍌🍓🥝',
    tags: ['classic', 'shooting'],
    mood: ['⚡'], // Fast
    difficulty: 3, // Hard
    controls: '⬅️➡️ Move | Space: Shoot',
    addedAt: 9,
    loader: () => import('./games/fruitShooter.js'),
  },
  {
    id: 'racer',
    name: 'Lane Racer',
    description: 'Simple 3-lane traffic dodging with car animation',
    emoji: '🚗',
    tags: ['classic'],
    mood: ['⚡', '😌'], // Fast, Chill
    difficulty: 2, // Medium
    controls: '⬅️➡️ Change lanes',
    addedAt: 10,
    comingSoon: false, // COMING SOON: Game not ready yet
    loader: () => import('./games/racer.js'),
  },
  {
    id: 'tag-em',
    name: "Tag Em! You're It!",
    description: '2-player local tag with running animation & map settings',
    emoji: '🏃‍♂️',
    tags: ['classic', 'multiplayer'],
    mood: ['👥', '⚡'], // 2P, Fast
    difficulty: 1, // Easy
    controls: 'P1: WASD | P2: Arrows',
    addedAt: 11,
    loader: () => import('./games/tagEm.js'),
  },
  {
    id: 'chess',
    name: 'Chess',
    description: 'Full chess with move history and special moves',
    emoji: '♟️',
    tags: ['classic'],
    mood: ['🧠', '😌'], // Thinky, Chill
    difficulty: 3, // Hard
    controls: '🖱️ Drag & drop pieces',
    addedAt: 13,
    loader: () => import('./games/chess.js'),
  },
  {
    id: 'hive',
    name: 'Hive',
    description: '2-player insect strategy — surround the enemy queen',
    emoji: '🐝',
    tags: ['classic', 'multiplayer'],
    mood: ['👥', '🧠'], // 2P, Thinky
    difficulty: 3, // Hard
    controls: '🖱️ Click to move insects',
    addedAt: 14,
    comingSoon: true, // COMING SOON: Game not ready yet
    loader: () => import('./games/hive.js'),
  },
  {
    id: 'checkers',
    name: 'Checkers',
    description: 'Classic 2v2 Checkers',
    emoji: '⛃⛂',
    tags: ['classic', 'multiplayer'],
    mood: ['👥', '🧠'], // 2P, Thinky
    difficulty: 2, // Medium
    controls: '🖱️ Click to select & move',
    addedAt: 15,
    loader: () => import('./games/checkers.js'),
  },
  {
    id: 'peephole',
    name: 'PEEPHOLE - STATION 01',
    description: '3D horror survival in a mysterious station. Collect cells, fix power, escape.',
    emoji: '👁️🔦',
    tags: ['horror', 'single', '3d'],
    mood: ['🧠'], // Thinky
    difficulty: 3, // Hard
    controls: 'WASD: Move | Mouse: Look | E: Interact',
    addedAt: 16,
    comingSoon: true, // COMING SOON: Game not ready yet
    isExternal: true,
    path: './games/Apartment.html',
  },
  {
    id: 'ghost-grabbers',
    name: 'Ghost Grabbers',
    description: 'Top-down chase game. Catch mischievous ghosts before time runs out!',
    emoji: '👻',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😂'], // Fast, Funny
    difficulty: 2, // Medium
    controls: 'WASD/Arrows: Move | Catch ghosts by touching them',
    addedAt: 17,
    loader: () => import('./games/ghostGrabbers.js'),
  },
  {
    id: 'snack-stack',
    name: 'Snack Stack 3000',
    description: '2D puzzle that transforms into 3D! Stack snacks, unlock tower mode with rotating camera and falling hazards.',
    emoji: '🍕🏗️',
    tags: ['arcade', 'single', '3d'],
    mood: ['🧠', '⚡'], // Thinky, Fast
    difficulty: 2, // Medium
    controls: 'A/D or ←/→: Move | S/↓: Fast drop | SPACE: Drop snack',
    addedAt: 18,
    comingSoon: true, // COMING SOON: Game not ready yet
    isExternal: true,
    path: './games/snackStack.html',
  },
  {
    id: 'bug-squash',
    name: 'Bug Squash',
    description: 'Tap/click action game. Squash bugs before time runs out! Collect power-ups for freeze and score multiplier.',
    emoji: '🐛💥',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😂'], // Fast, Funny
    difficulty: 1, // Easy
    controls: '🖱️ Click to squash bugs | Collect ❄️ freeze & ✨ multiplier power-ups',
    addedAt: 19,
    isExternal: true,
    path: './games/bugSquash.html',
  },
  {
    id: 'fruit-samurai',
    name: 'Fruit Samurai',
    description: 'Slice flying fruit with your mouse like a ninja! Get combos for big scores, but avoid the bombs!',
    emoji: '🗡️🍉',
    tags: ['arcade', 'single'],
    mood: ['⚡', '🎯'], // Fast, Skill
    difficulty: 2, // Medium
    controls: '🖱️ Click & drag to slice | Avoid 💣 bombs | Get combos!',
    comingSoon: false,
    addedAt: 20,
    loader: () => import('./games/fruitSamurai.js'),
  },
  {
    id: 'pixel-pet-arena',
    name: 'Pixel Pet Arena',
    description: 'Battle with adorable pixel pets! Choose your moves wisely, manage energy, and defeat opponents!',
    emoji: '🎮🐾',
    tags: ['strategy', 'single'],
    mood: ['🧠', '⚔️'], // Thinky, Combat
    difficulty: 2, // Medium
    controls: '🖱️ Click moves to attack | ⚡ Manage energy | 💚 Use revives',
    comingSoon: false,
    addedAt: 21,
    loader: () => import('./games/pixelPetArena.js'),
  },
  // === NEW GAMES - Coming Soon ===
  {
    id: 'bug-squash-extreme',
    name: 'Bug Squash Extreme',
    description: 'Upgrade your Bug Squash experience with lightning bugs and time-slowing puddles!',
    emoji: '🐛⚡💥',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😂'], // Fast, Funny
    difficulty: 2, // Medium
    controls: '🖱️ Click to squash | Collect ⚡ lightning & ⏰ time-slow power-ups',
    addedAt: 21,
    comingSoon: true,
    loader: () => import('./games/bugSquashExtreme.js'),
  },
  {
    id: 'snack-stack-hive',
    name: 'Snack StackHive',
    description: 'Build a honeycomb tower of snacks before it topples; physics-based stacking challenge.',
    emoji: '🍕🍔🐝',
    tags: ['arcade', 'single'],
    mood: ['🧠', '⚡'], // Thinky, Fast
    difficulty: 2, // Medium
    controls: 'Space: Drop snack | Build stable tower',
    addedAt: 22,
    comingSoon: true,
    loader: () => import('./games/snackStackHive.js'),
  },
  {
    id: 'maze-mania',
    name: 'Maze Mania',
    description: 'Procedurally generated mazes; escape before timer runs out, with teleport portals.',
    emoji: '🌀🏃',
    tags: ['arcade', 'single'],
    mood: ['🧠', '⚡'], // Thinky, Fast
    difficulty: 2, // Medium
    controls: 'Arrow keys: Move | Find exit before time runs out',
    addedAt: 23,
    comingSoon: true,
    loader: () => import('./games/mazeMania.js'),
  },
  {
    id: 'space-slice',
    name: 'Space Slice',
    description: 'Slice asteroids flying at you with swipes; combo chains give multipliers.',
    emoji: '🌠✂️',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😌'], // Fast, Chill
    difficulty: 2, // Medium
    controls: '🖱️ Swipe to slice asteroids | Build combos for multipliers',
    addedAt: 24,
    comingSoon: true,
    loader: () => import('./games/spaceSlice.js'),
  },
  {
    id: 'color-swap',
    name: 'Color Swap',
    description: 'Jump through platforms, but only when your character matches the platform color.',
    emoji: '🎨🦘',
    tags: ['arcade', 'single'],
    mood: ['⚡', '🧠'], // Fast, Thinky
    difficulty: 2, // Medium
    controls: 'Space: Jump | Match colors to pass through',
    addedAt: 25,
    comingSoon: true,
    loader: () => import('./games/colorSwap.js'),
  },
  {
    id: 'pixel-pirates',
    name: 'Pixel Pirates',
    description: '2D side-scrolling ship battle; upgrade cannons, dodge obstacles, collect treasure.',
    emoji: '🏴‍☠️⚓',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😂'], // Fast, Funny
    difficulty: 2, // Medium
    controls: 'Arrow keys: Move ship | Space: Fire cannons',
    addedAt: 26,
    comingSoon: true,
    loader: () => import('./games/pixelPirates.js'),
  },
  {
    id: 'tiny-tower-defense',
    name: 'Tiny Tower Defense',
    description: 'Defend your tiny castle from waves of monsters; upgrade towers and traps.',
    emoji: '🏰🛡️',
    tags: ['arcade', 'single'],
    mood: ['🧠', '⚡'], // Thinky, Fast
    difficulty: 3, // Hard
    controls: '🖱️ Click to place towers | Right-click to sell',
    addedAt: 27,
    loader: () => import('./games/tinyTowerDefense.js'),
  },
  {
    id: 'laser-bounce',
    name: 'Laser Bounce',
    description: 'Reflect lasers off mirrors to hit moving targets; puzzles get harder each level.',
    emoji: '🔦🪞',
    tags: ['arcade', 'single'],
    mood: ['🧠', '😌'], // Thinky, Chill
    difficulty: 3, // Hard
    controls: '🖱️ Click to place mirrors | Reflect lasers to targets',
    addedAt: 28,
    comingSoon: true,
    loader: () => import('./games/laserBounce.js'),
  },
  {
    id: 'emoji-chef',
    name: 'Emoji Chef',
    description: 'Catch falling ingredients to make recipes; wrong ingredients end combo.',
    emoji: '👨‍🍳🍳',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😂'], // Fast, Funny
    difficulty: 1, // Easy
    controls: '⬅️➡️ Move chef | Catch correct ingredients',
    addedAt: 29,
    comingSoon: false,
    loader: () => import('./games/emojiChef.js'),
  },
  {
    id: 'frog-hop-frenzy',
    name: 'Frog Hop Frenzy',
    description: 'Cross rivers, dodge logs & enemies; day/night cycles change difficulty.',
    emoji: '🐸💦',
    tags: ['arcade', 'single'],
    mood: ['⚡', '🧠'], // Fast, Thinky
    difficulty: 2, // Medium
    controls: 'Arrow keys: Hop | Cross river safely',
    addedAt: 30,
    comingSoon: true,
    loader: () => import('./games/frogHopFrenzy.js'),
  },
  {
    id: 'mini-golf-madness',
    name: 'Mini Golf Madness',
    description: 'Top-down golf course with loop-de-loops, moving obstacles, and bumpers.',
    emoji: '⛳🏌️',
    tags: ['arcade', 'single'],
    mood: ['😌', '🧠'], // Chill, Thinky
    difficulty: 2, // Medium
    controls: '🖱️ Drag to aim & shoot | Hole in one!',
    addedAt: 31,
    comingSoon: true,
    loader: () => import('./games/miniGolfMadness.js'),
  },
  {
    id: 'balloon-pop-party',
    name: 'Balloon Pop Party',
    description: 'Pop as many balloons as possible in time limit; power-ups like freeze & multiplier.',
    emoji: '🎈🎉',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😂'], // Fast, Funny
    difficulty: 1, // Easy
    controls: '🖱️ Click to pop balloons | Collect power-ups',
    addedAt: 32,
    comingSoon: true,
    loader: () => import('./games/balloonPopParty.js'),
  },
  {
    id: 'pixel-painter',
    name: 'Pixel Painter',
    description: 'Fill shapes with paint before time runs out; streaks and combos for points.',
    emoji: '🎨🖌️',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😌'], // Fast, Chill
    difficulty: 1, // Easy
    controls: '🖱️ Click to paint | Fill shapes quickly',
    addedAt: 33,
    comingSoon: true,
    loader: () => import('./games/pixelPainter.js'),
  },
  {
    id: 'rocket-rescue',
    name: 'Rocket Rescue',
    description: 'Fly a rocket to save stranded astronauts; avoid asteroids & gravity wells.',
    emoji: '🚀👨‍🚀',
    tags: ['arcade', 'single'],
    mood: ['⚡', '🧠'], // Fast, Thinky
    difficulty: 3, // Hard
    controls: 'Arrow Keys: Move | Space: Boost | P: Pause',
    addedAt: 34,
    loader: () => import('./games/rocketRescue.js'),
  },
  {
    id: 'ice-cream-stack',
    name: 'Ice Cream Stack',
    description: 'Stack ice cream scoops on moving cones; wobble physics make it tricky.',
    emoji: '🍦🍨',
    tags: ['arcade', 'single'],
    mood: ['😌', '🧠'], // Chill, Thinky
    difficulty: 2, // Medium
    controls: 'Space: Drop scoop | Balance your tower',
    addedAt: 35,
    comingSoon: true,
    loader: () => import('./games/iceCreamStack.js'),
  },
  {
    id: 'ghost-chase',
    name: 'Ghost Chase',
    description: 'Collect keys in a haunted mansion while avoiding patrolling ghosts.',
    emoji: '👻🔑',
    tags: ['arcade', 'single'],
    mood: ['⚡', '🧠'], // Fast, Thinky
    difficulty: 2, // Medium
    controls: 'WASD: Move | Collect keys, avoid ghosts',
    addedAt: 36,
    comingSoon: false,
    loader: () => import('./games/ghostChase.js'),
  },
  {
    id: 'hyper-jump',
    name: 'Hyper Jump',
    description: 'Tap to bounce higher on platforms; avoid spikes, collect stars, reach max height.',
    emoji: '⭐🦘',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😌'], // Fast, Chill
    difficulty: 2, // Medium
    controls: 'Space: Jump | Bounce higher, avoid spikes',
    addedAt: 38,
    comingSoon: true,
    loader: () => import('./games/hyperJump.js'),
  },
  {
    id: 'pixel-pets-arena',
    name: 'Pixel Pets Arena',
    description: 'Tiny creatures battle in arena; use elemental powers and dodge attacks.',
    emoji: '🐾⚡',
    tags: ['arcade', 'single'],
    mood: ['⚡', '😂'], // Fast, Funny
    difficulty: 2, // Medium
    controls: 'WASD: Move | Space: Attack | Dodge & battle',
    addedAt: 39,
    comingSoon: true,
    loader: () => import('./games/pixelPetsArena.js'),
  },
];

const latestAddedAt = Math.max(...games.filter(g => !g.comingSoon).map(g => g.addedAt || 0));
const NEW_WINDOW = 2; // show NEW for games within this many steps of latest

const PLAYBUX_KEY = 'gamehub:playbux';
const REVIVE_KEY = 'gamehub:revives';
const DISCORD_KEY = 'gamehub:discord-claimed';
const PLAYMATE_OWNED_KEY = 'gamehub:playmate:owned';
const PLAYMATE_EQUIPPED_KEY = 'gamehub:playmate:equipped';
const PLAYMATE_ITEM_OWNED_PREFIX = 'gamehub:playmate:item:';

const els = {
  list: document.getElementById('game-list'),
  search: document.getElementById('search'),
  welcome: document.getElementById('welcome'),
  container: document.getElementById('game-container'),
  dailyCard: document.getElementById('daily-card'),
  randomGame: document.getElementById('random-game'),
  teacherMode: document.getElementById('teacher-mode'),
  compactMode: document.getElementById('compact-mode'),
  muteToggle: document.getElementById('mute-toggle'),
  fullscreenToggle: document.getElementById('fullscreen-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  tabHome: document.getElementById('tab-home'),
  tabSingle: document.getElementById('tab-single'),
  tabClassic: document.getElementById('tab-classic'),
  tabAi: document.getElementById('tab-ai'),
  tabShooting: document.getElementById('tab-shooting'),
  tab3d: document.getElementById('tab-3d'),
  tabMulti: document.getElementById('tab-multi'),
  tabComingSoon: document.getElementById('tab-coming-soon'),
  multiPanel: document.getElementById('multi-panel'),
  multiContainer: document.getElementById('multi-container'),
  aiMood: document.getElementById('ai-mood'),
  aiSuggest: document.getElementById('ai-suggest'),
  aiResults: document.getElementById('ai-results'),
  aiThinking: document.getElementById('ai-thinking'),
  headerStats: document.getElementById('header-stats'),
  playbuxDisplay: document.getElementById('playbux-display'),
  buyRevive1: document.getElementById('buy-revive-1'),
  buyRevive10: document.getElementById('buy-revive-10'),
  reviveCount: document.getElementById('revive-count'),
  claimDiscord: document.getElementById('claim-discord'),
  resetButton: document.getElementById('reset-button'),
  resetConfirm: document.getElementById('reset-confirm'),
  resetInput: document.getElementById('reset-input'),
  resetConfirmBtn: document.getElementById('reset-confirm-btn'),
  playbuxAdminButton: document.getElementById('playbux-admin-button'),
  playbuxAdminPanel: document.getElementById('playbux-admin'),
  playbuxCodeInput: document.getElementById('playbux-code'),
  playbuxAmountInput: document.getElementById('playbux-amount'),
  playbuxApplyButton: document.getElementById('playbux-apply'),
  devResetAllButton: document.getElementById('dev-reset-all'),
  devResetConfirm: document.getElementById('dev-reset-confirm'),
  devResetInput: document.getElementById('dev-reset-input'),
  devResetConfirmBtn: document.getElementById('dev-reset-confirm-btn'),
  devResetCancelBtn: document.getElementById('dev-reset-cancel-btn'),
  playmateShopOpen: document.getElementById('playmate-shop-open'),
  playmateShop: document.getElementById('playmate-shop'),
  playmateShopClose: document.getElementById('playmate-shop-close'),
  recentlyPlayedPanel: document.getElementById('recently-played-panel'),
  recentlyPlayedList: document.getElementById('recently-played-list'),
  toastContainer: document.getElementById('toast-container'),
  avatarHud: document.querySelector('.avatar-hud'),
  gameEndPanel: document.getElementById('game-end-panel'),
  playAgainBtn: document.getElementById('play-again-btn'),
  randomNextBtn: document.getElementById('random-next-btn'),
  backHubBtn: document.getElementById('back-hub-btn'),
  sessionSummary: document.getElementById('session-summary'),
  sessionTime: document.getElementById('session-time'),
  sessionPlaybux: document.getElementById('session-playbux'),
  sessionGames: document.getElementById('session-games'),
  sessionCloseBtn: document.getElementById('session-close-btn'),
  statsToggle: document.getElementById('stats-toggle'),
  actions: document.querySelector('.actions'),
  settingsToggle: document.getElementById('settings-toggle'),
  settingsPanel: document.getElementById('settings-panel'),
  settingsClose: document.getElementById('settings-close'),
};

function readNumber(key, fallback = 0) {
  try {
    const raw = localStorage.getItem(key);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}
function writeNumber(key, value) {
  try {
    localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
  } catch {}
}
function getPlaybux() {
  return readNumber(PLAYBUX_KEY, 0);
}
function setPlaybux(value) {
  writeNumber(PLAYBUX_KEY, value);
  updatePlaybuxDisplay();
}
function addPlaybux(amount) {
  if (!amount || amount <= 0) return;
  setPlaybux(getPlaybux() + amount);
  // NEW: Show toast for Playbux earnings
  if (amount >= 50) {
    showToast(`+${amount} Playbux!`, '💰', 2500);
  }
}
function getRevives() {
  return readNumber(REVIVE_KEY, 0);
}
function setRevives(value) {
  writeNumber(REVIVE_KEY, value);
  updateReviveDisplay();
}
function isPlaymateOwned() {
  return readNumber(PLAYMATE_OWNED_KEY, 0) > 0;
}
function isPlaymateEquipped() {
  return readNumber(PLAYMATE_EQUIPPED_KEY, 0) > 0;
}
function setPlaymateOwned(val) {
  writeNumber(PLAYMATE_OWNED_KEY, val ? 1 : 0);
}
function setPlaymateEquipped(val) {
  writeNumber(PLAYMATE_EQUIPPED_KEY, val ? 1 : 0);
}
function isShopItemOwned(key) {
  if (!key) return false;
  return readNumber(PLAYMATE_ITEM_OWNED_PREFIX + key, 0) > 0;
}
function setShopItemOwned(key, val) {
  if (!key) return;
  writeNumber(PLAYMATE_ITEM_OWNED_PREFIX + key, val ? 1 : 0);
}
function updateAvatarUnlockState() {
  if (!els.avatarHud) return;
  const owned = isPlaymateOwned();
  const equipped = isPlaymateEquipped();
  // show avatar HUD only when owned and equipped
  els.avatarHud.style.display = owned && equipped ? '' : 'none';
}
function updatePlaybuxDisplay() {
  if (!els.playbuxDisplay) return;
  const total = getPlaybux();
  els.playbuxDisplay.textContent = `💰 ${total} PB`;
}
function updateReviveDisplay() {
  if (!els.reviveCount) return;
  const revives = getRevives();
  els.reviveCount.textContent = `Revives available: ${revives}`;
}
function setupPlaymateShop() {
  const openBtn = els.playmateShopOpen;
  const shop = els.playmateShop;
  const closeBtn = els.playmateShopClose;
  if (!openBtn || !shop || !closeBtn) return;

  const tabButtons = Array.from(document.querySelectorAll('.playmate-tab-btn'));
  const panels = {
    hats: document.getElementById('playmate-tab-hats'),
    mates: document.getElementById('playmate-tab-mates'),
    glasses: document.getElementById('playmate-tab-glasses'),
  };

  const avatarBox = document.querySelector('.avatar-box');

  function clearAvatarSlot(slot) {
    if (!avatarBox) return;
    if (slot === 'hat') {
      avatarBox.classList.remove('avatar-hat-classic', 'avatar-hat-spiky');
    } else if (slot === 'glasses') {
      avatarBox.classList.remove('avatar-glasses-cool', 'avatar-glasses-hero');
    }
  }

  function clearAvatarOutline() {
    if (!avatarBox) return;
    avatarBox.style.outline = '';
  }

  function applyPreview(item) {
    if (!avatarBox || !item) return;
    // reset to base
    avatarBox.style.background = '#050814';
    // keep other slot (hat vs glasses) but replace within the same slot
    if (item.slot) clearAvatarSlot(item.slot);

    // color feedback so you still clearly see that Equip worked
    if (item.slot === 'hat') {
      avatarBox.style.background = '#1d4ed8'; // blue tint when a hat is equipped
    } else if (item.slot === 'glasses') {
      avatarBox.style.background = '#10b981'; // green tint when glasses equipped
    }

    // apply pixel-art overlay
    if (item.previewClass) {
      avatarBox.classList.add(item.previewClass);
    }
  }

  function showTab(name) {
    tabButtons.forEach((btn) => {
      const active = btn.dataset.tab === name;
      btn.setAttribute('aria-selected', String(active));
    });
    Object.entries(panels).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle('hidden', key !== name);
    });
  }

  function populatePanelsOnce() {
    const hatItems = [
      { key: 'hat-classic', slot: 'hat', title: 'Classic Cap', desc: 'Simple starter cap for your play mate.', price: 50, previewClass: 'avatar-hat-classic' },
      { key: 'hat-spiky',  slot: 'hat', title: 'Spiky Hairband', desc: 'Gives your play mate an extra-powered hair look.', price: 75, previewClass: 'avatar-hat-spiky' },
    ];
    const mateItems = [
      { key: 'mate-noob', title: 'Noob Play Mate', desc: 'Unlocks the noob avatar companion.', price: 1000, previewClass: '' },
    ];
    const glassesItems = [
      { key: 'glasses-cool', slot: 'glasses', title: 'Cool Shades', desc: 'Dark glasses for maximum style.', price: 60, previewClass: 'avatar-glasses-cool' },
      { key: 'glasses-hero', slot: 'glasses', title: 'Hero Lenses', desc: 'Bright lenses for anime-level focus.', price: 80, previewClass: 'avatar-glasses-hero' },
    ];

    function renderList(panel, items) {
      if (!panel) return;
      // always rebuild so button labels (Buy / Equip / Owned) match latest state
      panel.innerHTML = '';
      items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'playmate-item';
        row.innerHTML = `
          <div class="playmate-item-info">
            <div class="playmate-item-title">${item.title}</div>
            <div class="playmate-item-desc">${item.desc}</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span class="badge">${item.price} PB</span>
            <button class="button playmate-view-btn" type="button">View</button>
            <button class="button playmate-buy-btn" type="button">Buy</button>
          </div>
        `;

        const viewBtn = row.querySelector('.playmate-view-btn');
        const buyBtn = row.querySelector('.playmate-buy-btn');

        // View => just preview visuals (for hats/glasses), nothing to buy
        if (viewBtn) {
          viewBtn.addEventListener('click', () => {
            applyPreview(item);
          });
        }

        if (buyBtn) {
          // Special logic for the Noob Play Mate (unlocks avatar for 1000 PB)
          if (item.key === 'mate-noob') {
            const refreshState = () => {
              const owned = isPlaymateOwned();
              const equipped = isPlaymateEquipped();
              if (!owned) {
                buyBtn.textContent = `Buy (${item.price} PB)`;
                buyBtn.disabled = false;
              } else if (equipped) {
                buyBtn.textContent = 'Equipped';
                buyBtn.disabled = true;
              } else {
                buyBtn.textContent = 'Equip';
                buyBtn.disabled = false;
              }
            };

            refreshState();

            buyBtn.addEventListener('click', () => {
              const owned = isPlaymateOwned();
              const equipped = isPlaymateEquipped();

              if (!owned) {
                const ok = window.playBoxSpendPlaybux ? window.playBoxSpendPlaybux(item.price) : false;
                if (!ok) {
                  alert(`Not enough Playbux. You need ${item.price} PB.`);
                  return;
                }
                setPlaymateOwned(true);
                setPlaymateEquipped(true); // auto-equip on first purchase
                updateAvatarUnlockState();
                if (window.sound && typeof window.sound.playScore === 'function') {
                  try { window.sound.playScore(); } catch {}
                }
                alert(`Unlocked ${item.title}!`);
                refreshState();
                return;
              }

              if (!equipped) {
                setPlaymateEquipped(true);
                updateAvatarUnlockState();
                refreshState();
              }
            });
          } else {
            // Default cosmetic purchase: buy once, then allow Equip
            const refreshOwned = () => {
              const owned = isShopItemOwned(item.key);
              if (owned) {
                buyBtn.textContent = 'Equip';
                buyBtn.disabled = false;
              } else {
                buyBtn.textContent = `Buy (${item.price} PB)`;
                buyBtn.disabled = false;
              }
            };

            refreshOwned();

            buyBtn.addEventListener('click', () => {
              const owned = isShopItemOwned(item.key);
              if (!owned) {
                const ok = window.playBoxSpendPlaybux ? window.playBoxSpendPlaybux(item.price) : false;
                if (!ok) {
                  alert(`Not enough Playbux. You need ${item.price} PB.`);
                  return;
                }
                setShopItemOwned(item.key, true);
                if (window.sound && typeof window.sound.playScore === 'function') {
                  try { window.sound.playScore(); } catch {}
                }
                alert(`Purchased ${item.title} for ${item.price} PB.`);
                refreshOwned();
                return;
              }

              // Already owned -> treat click as Equip action
              applyPreview(item);
              // In this panel, set all other owned items back to Equip
              Array.from(panel.querySelectorAll('.playmate-item')).forEach((rowEl) => {
                const btn = rowEl.querySelector('.playmate-buy-btn');
                if (!btn) return;
                if (btn === buyBtn) {
                  btn.textContent = 'Equipped';
                } else {
                  // if they own others in this tab, leave as Equip label
                  if (btn.textContent !== 'Buy' && btn.textContent.indexOf('Buy') !== 0) {
                    btn.textContent = 'Equip';
                  }
                }
              });
            });
          }
        }

        panel.appendChild(row);
      });
    }

    renderList(panels.hats, hatItems);
    renderList(panels.mates, mateItems);
    renderList(panels.glasses, glassesItems);
  }

openBtn.addEventListener('click', () => {
    populatePanelsOnce();
    shop.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    shop.classList.add('hidden');
    clearAvatarCosmetics();
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tab;
      if (!name) return;
      showTab(name);
    });
  });

  showTab('hats');
}

function setupPlaytimeRewards() {
  const start = Date.now();
  const rewards = [
    { ms: 5 * 60 * 1000, amount: 5, claimed: false },
    { ms: 10 * 60 * 1000, amount: 10, claimed: false },
    { ms: 15 * 60 * 1000, amount: 15, claimed: false },
  ];
  setInterval(() => {
    const elapsed = Date.now() - start;
    rewards.forEach(r => {
      if (!r.claimed && elapsed >= r.ms) {
        r.claimed = true;
        addPlaybux(r.amount);
      }
    });
  }, 30000);
}
function setupPlaybux() {
  updatePlaybuxDisplay();
  updateReviveDisplay();

  // Expose helpers so games can read/use the shared revive pool
  window.playBoxGetRevives = function () {
    return getRevives();
  };
  window.playBoxUseRevive = function () {
    const current = getRevives();
    if (current <= 0) return false;
    setRevives(current - 1);
    return true;
  };
  // Let games read the current Playbux balance
  window.playBoxGetPlaybux = function () {
    return getPlaybux();
  };
  // Let games safely spend Playbux from the shared wallet
  window.playBoxSpendPlaybux = function (amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (!n) return false;
    const current = getPlaybux();
    if (current < n) return false;
    setPlaybux(current - n);
    return true;
  };
  // Let games award arbitrary Playbux amounts (positive only)
  window.playBoxAddPlaybux = function (amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (!n) return;
    setPlaybux(getPlaybux() + n);
  };
  // Prompt the player to buy revives on the spot (1 for 100 PB or 10 for 1000 PB)
  window.playBoxPromptRevivePurchase = function () {
    const pb = getPlaybux();
    if (pb < 100) {
      alert('You have 0 revives and not enough Playbux (need at least 100 PB).');
      return false;
    }
    let cost = 100;
    let count = 1;
    if (pb >= 1000) {
      const bulk = confirm(
        `You have 0 revives and ${pb} Playbux.\n\nOK = Buy 10 revives for 1000 PB.\nCancel = Buy 1 revive for 100 PB.`,
      );
      if (bulk) {
        cost = 1000;
        count = 10;
      }
    } else {
      const one = confirm(
        `You have 0 revives and ${pb} Playbux.\n\nBuy 1 revive for 100 PB?`,
      );
      if (!one) return false;
    }
    if (getPlaybux() < cost) {
      alert('Not enough Playbux for that revive purchase.');
      return false;
    }
    setPlaybux(getPlaybux() - cost);
    setRevives(getRevives() + count);
    return true;
  };

  if (els.buyRevive1) {
    els.buyRevive1.addEventListener('click', () => {
      const cost = 100;
      if (getPlaybux() < cost) {
        alert('Not enough Playbux for a free revive pass (cost: 100 PB).');
        return;
      }
      setPlaybux(getPlaybux() - cost);
      setRevives(getRevives() + 1);
    });
  }
  if (els.buyRevive10) {
    els.buyRevive10.addEventListener('click', () => {
      const cost = 1000;
      if (getPlaybux() < cost) {
        alert('Not enough Playbux for the 10 revives pass (cost: 1000 PB).');
        return;
      }
      setPlaybux(getPlaybux() - cost);
      setRevives(getRevives() + 10);
    });
  }

  if (els.claimDiscord) {
    let claimed = false;
    try {
      claimed = localStorage.getItem(DISCORD_KEY) === '1';
    } catch {}
    const markClaimed = () => {
      if (!els.claimDiscord) return;
      els.claimDiscord.disabled = true;
      els.claimDiscord.textContent = 'Game idea bonus claimed';
    };
    const docUrl = 'https://docs.google.com/document/d/13BoWyo6XIid_OJRQHRlxkmoMHvZEPRdZStH3-_qFiBY/edit?tab=t.0';
    if (claimed) {
      markClaimed();
    } else {
      els.claimDiscord.addEventListener('click', () => {
        // Open the Google Doc in a new tab so the player can write their idea
        try { window.open(docUrl, '_blank', 'noopener'); } catch {}
        // Immediately grant the one-time bonus and remember it
        addPlaybux(50);
        try { localStorage.setItem(DISCORD_KEY, '1'); } catch {}
        markClaimed();
      });
    }
  }

  if (els.playbuxAdminButton && els.playbuxAdminPanel && els.playbuxCodeInput && els.playbuxAmountInput && els.playbuxApplyButton) {
    els.playbuxAdminButton.addEventListener('click', () => {
      els.playbuxAdminPanel.classList.toggle('hidden');
      if (!els.playbuxAdminPanel.classList.contains('hidden')) {
        els.playbuxCodeInput.value = '';
        els.playbuxAmountInput.value = '';
        els.playbuxCodeInput.focus();
      }
    });
    els.playbuxApplyButton.addEventListener('click', () => {
      const code = (els.playbuxCodeInput.value || '').trim();
      if (code !== '2015') {
        alert('Incorrect Playbux code.');
        return;
      }
      const raw = els.playbuxAmountInput.value;
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount < 0) {
        alert('Enter a valid Playbux amount.');
        return;
      }
      setPlaybux(amount);
      if (economy) {
        economy.playbux = amount;
        updateEconomyPanel();
        // Also update stats panel Playbux
        const statsPlaybux = document.getElementById('stats-playbux');
        if (statsPlaybux) statsPlaybux.textContent = amount;
      }
      els.playbuxAdminPanel.classList.add('hidden');
    });
  }

  setupPlaytimeRewards();

  // Global hook so games can award Playbux when you win
  // difficulty can be 'easy', 'medium', or 'hard'
  window.playBoxAwardWin = function (difficulty = 'easy') {
    let amount = 0;
    const d = String(difficulty || 'easy').toLowerCase();
    if (d === 'easy') amount = 10;
    else if (d === 'medium' || d === 'med') amount = 50;
    else if (d === 'hard') amount = 100;
    else amount = 10; // fallback if a game passes something custom
    addPlaybux(amount);
  };
}

let current = { id: null, destroy: null };
let view = 'home'; // 'home' | 'single' | 'classic' | 'ai' | 'multiplayer' | 'shooting' | '3d' | 'coming-soon'

function getViewGames() {
  if (view === 'single') {
    // Single Play: all games that are not tagged multiplayer and not coming soon
    return games
      .filter(g => !g.tags?.includes('multiplayer') && !g.comingSoon)
      .sort((a, b) => a.addedAt - b.addedAt);
  }
  if (view === 'classic') return games.filter(g => g.tags?.includes('classic') && !g.comingSoon).sort((a,b) => a.addedAt - b.addedAt);
  if (view === 'ai') return games.filter(g => g.tags?.includes('ai') && !g.comingSoon).sort((a,b) => a.addedAt - b.addedAt);
  if (view === 'multiplayer') return games.filter(g => g.tags?.includes('multiplayer') && !g.comingSoon).sort((a,b) => a.addedAt - b.addedAt);
  if (view === 'shooting') return games.filter(g => g.tags?.includes('shooting') && !g.comingSoon).sort((a,b) => a.addedAt - b.addedAt);
  if (view === '3d') return games.filter(g => g.tags?.includes('3d') && !g.comingSoon).sort((a,b) => a.addedAt - b.addedAt);
  if (view === 'coming-soon') return games.filter(g => g.comingSoon === true).sort((a,b) => a.addedAt - b.addedAt);
  // home: only playable games (exclude coming soon), sorted oldest -> newest (first to latest)
  return games.filter(g => !g.comingSoon).sort((a,b) => a.addedAt - b.addedAt);
}

// === NEW: Helper function for mood labels ===
function getMoodLabel(emoji) {
  const labels = {
    '⚡': 'Fast',
    '😌': 'Chill',
    '👥': '2 Player',
    '🧠': 'Thinky',
    '😂': 'Funny',
    '⏱️': 'Short'
  };
  return labels[emoji] || emoji;
}

// === NEW: Toast notification system ===
function showToast(message, emoji = '🎉', duration = 3000) {
  if (!els.toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-emoji">${emoji}</span><span class="toast-message">${message}</span>`;
  
  els.toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function renderList(filter = '') {
  const q = filter.trim().toLowerCase();
  els.list.innerHTML = '';
  
  const filtered = getViewGames()
    .filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
  
  // Use DocumentFragment for batch DOM updates (better performance)
  const fragment = document.createDocumentFragment();
  
  filtered.forEach(g => {
    const li = document.createElement('li');
    li.className = 'game-item';
    li.tabIndex = 0;
    li.dataset.id = g.id;

    const tags = Array.isArray(g.tags) ? g.tags : [];
    const badgeChunks = tags.map(tag => {
      if (tag === 'classic') return '<span class="game-tag game-tag--classic">Classic</span>';
      if (tag === 'multiplayer') return '<span class="game-tag game-tag--multiplayer">Multiplayer</span>';
      if (tag === 'shooting') return '<span class="game-tag game-tag--shooting">Shooting</span>';
      if (tag === 'ai') return '<span class="game-tag game-tag--ai">AI</span>';
      if (tag === '3d') return '<span class="game-tag game-tag--3d">3D</span>';
      return `<span class=\"game-tag\">${tag}</span>`;
    });
    // Single Play badge for all games that are not marked multiplayer
    if (!tags.includes('multiplayer')) {
      badgeChunks.push('<span class="game-tag game-tag--single">Single Play</span>');
    }
    const tagBadges = badgeChunks.join('');

    // === NEW: Mood tags (⚡ Fast, 😌 Chill, 👥 2P, 🧠 Thinky, 😂 Funny, ⏱️ Short) ===
    const moods = Array.isArray(g.mood) ? g.mood : [];
    const moodBadges = moods.map(m => `<span class="game-mood" title="${getMoodLabel(m)}">${m}</span>`).join('');

    // === NEW: Difficulty dots (● Easy ●● Medium ●●● Hard) ===
    const diff = g.difficulty || 1;
    const diffDots = '●'.repeat(Math.min(Math.max(diff, 1), 3));
    const diffLabel = diff === 1 ? 'Easy' : diff === 2 ? 'Medium' : 'Hard';
    const difficultyIndicator = `<span class="game-difficulty" title="${diffLabel}">${diffDots}</span>`;

    // highscore tooltip (falls back to 0 if none yet)
    let high = 0;
    try { high = getHighScore(g.id) || 0; } catch {}
    li.title = `Highscore: ${high}`;

    const isNew = latestAddedAt - (g.addedAt || 0) <= NEW_WINDOW;
    
    // COMING SOON: Check if game has comingSoon flag
    const isComingSoon = g.comingSoon === true;

    li.innerHTML = `
      ${isNew && !isComingSoon ? '<span class="game-ribbon new-game">NEW</span>' : ''}
      ${isComingSoon ? '<span class="game-ribbon coming-soon">COMING SOON</span>' : ''}
      <span class="game-emoji">${g.emoji}</span>
      <div class="game-meta">
        <span class="game-name">${g.name}</span>
        <span class="game-desc">${g.description}</span>
        <span class="game-high">Highscore: ${high}</span>
        <div class="game-tags">${tagBadges}</div>
        <div class="game-moods">${moodBadges}${difficultyIndicator}</div>
        ${g.controls ? `<div class="game-controls">💡 ${g.controls}</div>` : ''}
      </div>`;
    
    // COMING SOON: Prevent click if game is not ready
    li.addEventListener('click', () => {
      if (isComingSoon) {
        showComingSoonOverlay(g);
        return;
      }
      sound.playClick();
      navigateTo(g.id);
    });
    li.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if (isComingSoon) {
          showComingSoonOverlay(g);
          return;
        }
        sound.playClick();
        navigateTo(g.id);
      }
    });
    
    // COMING SOON: Add visual indicator class
    if (isComingSoon) {
      li.classList.add('game-coming-soon');
      li.setAttribute('aria-label', `${g.name} - Coming Soon`);
    }
    fragment.appendChild(li);
  });
  
  // Single DOM update instead of multiple appendChild calls
  els.list.appendChild(fragment);
  syncActiveListItem();
}

// COMING SOON: Show overlay when clicking on coming soon games
function showComingSoonOverlay(game) {
  sound.playClick();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'coming-soon-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'coming-soon-title');
  
  overlay.innerHTML = `
    <div class="coming-soon-backdrop"></div>
    <div class="coming-soon-content">
      <div class="coming-soon-sparkles" aria-hidden="true">
        <span class="sparkle">✨</span>
        <span class="sparkle">✨</span>
        <span class="sparkle">✨</span>
        <span class="sparkle">✨</span>
        <span class="sparkle">✨</span>
      </div>
      <h2 id="coming-soon-title" class="coming-soon-title">COMING SOON</h2>
      <div class="coming-soon-game">
        <span class="coming-soon-emoji">${game.emoji}</span>
        <span class="coming-soon-name">${game.name}</span>
      </div>
      <p class="coming-soon-text">This game is currently under development. Stay tuned!</p>
      <button class="button primary coming-soon-close" type="button">Got it!</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Focus trap
  const closeBtn = overlay.querySelector('.coming-soon-close');
  closeBtn.focus();
  
  // Close handlers
  const closeOverlay = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  };
  
  closeBtn.addEventListener('click', closeOverlay);
  overlay.querySelector('.coming-soon-backdrop').addEventListener('click', closeOverlay);
  
  // Keyboard support
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlay();
    }
  });
  
  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });
}

function syncActiveListItem() {
  const { id } = current;
  [...els.list.children].forEach(li => {
    li.classList.toggle('active', li.dataset.id === id);
  });
}

// --- Daily mini game ---
function getDailyGame(date = new Date()) {
  // Filter out coming soon games - only select from playable games
  const availableGames = games.filter(g => !g.comingSoon);
  if (!availableGames.length) return null;
  
  // simple deterministic hash from YYYY-MM-DD
  const key = date.toISOString().slice(0, 10);
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  const idx = sum % availableGames.length;
  return availableGames[idx];
}

function renderDailyCard() {
  if (!els.dailyCard) return;
  const game = getDailyGame();
  if (!game) {
    els.dailyCard.textContent = 'No games available yet.';
    return;
  }
  els.dailyCard.innerHTML = `
    <span class="game-emoji">${game.emoji}</span>
    <div class="daily-meta">
      <span class="daily-title">${game.name}</span>
      <span class="daily-sub">Today\'s featured mini game — ${game.description}</span>
      <button class="button primary" type="button">Play daily pick / Jouer le jeu du jour</button>
    </div>
  `;
  const btn = els.dailyCard.querySelector('button');
  if (btn) btn.addEventListener('click', () => {
    sound.playClick();
    navigateTo(game.id);
  });
}

// === NEW: Recently Played row ===
function renderRecentlyPlayed() {
  if (!els.recentlyPlayedPanel || !els.recentlyPlayedList) return;
  
  const history = getPlayHistory();
  if (!history || history.length === 0) {
    els.recentlyPlayedPanel.classList.add('hidden');
    return;
  }

  // Get unique game IDs (most recent first), limit to 5
  const uniqueIds = [...new Set(history.map(h => h.id))].slice(0, 5);
  const recentGames = uniqueIds.map(id => games.find(g => g.id === id)).filter(Boolean);

  if (recentGames.length === 0) {
    els.recentlyPlayedPanel.classList.add('hidden');
    return;
  }

  els.recentlyPlayedList.innerHTML = '';
  recentGames.forEach(game => {
    const li = document.createElement('li');
    li.className = 'recently-played-item';
    li.innerHTML = `
      <span class="recent-emoji">${game.emoji}</span>
      <span class="recent-name">${game.name}</span>
    `;
    li.addEventListener('click', () => {
      sound.playClick();
      navigateTo(game.id);
    });
    els.recentlyPlayedList.appendChild(li);
  });

  els.recentlyPlayedPanel.classList.remove('hidden');
}

// --- Simple local "AI" recommender ---
function scoreGameForQuery(game, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  let score = 1;
  const name = game.name.toLowerCase();
  const desc = game.description.toLowerCase();
  const tags = (game.tags || []).map(t => String(t).toLowerCase());

  const hasTag = (t) => tags.includes(t);

  if (q.includes('fast') || q.includes('quick')) {
    if (hasTag('classic')) score += 1;
    if (game.id === 'snake' || game.id === 'breakout' || game.id === 'rock-paper-scissors') score += 2;
  }
  if (q.includes('blocks') || q.includes('tetris') || q.includes('block rush')) {
    if (game.id === 'tetris') score += 3;
  }
  if (q.includes('2 player') || q.includes('two player') || q.includes('friend') || q.includes('multiplayer')) {
    if (hasTag('multiplayer')) score += 3;
  }
  if (q.includes('classic')) {
    if (hasTag('classic')) score += 2;
  }
  if (q.includes('snake') || q.includes('slither')) {
    if (game.id === 'snake') score += 3;
  }
  if (q.includes('random')) {
    score += Math.random();
  }

  // Small boost if the words appear in name or description
  if (name.includes(q) || desc.includes(q)) score += 1.5;

  return score;
}

function getAiRecommendations(query) {
  // Filter out coming soon games from AI recommendations
  const availableGames = getViewGames().filter(g => !g.comingSoon);
  const scored = availableGames.map(g => ({
    game: g,
    score: scoreGameForQuery(g, query),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

function setupAiRecommendations() {
  if (!els.aiSuggest || !els.aiResults) return;

  const run = () => {
    const mood = els.aiMood?.value || '';
    els.aiResults.innerHTML = '';
    if (els.aiThinking) els.aiThinking.classList.remove('hidden');

    setTimeout(() => {
      const picks = getAiRecommendations(mood);
      if (els.aiThinking) els.aiThinking.classList.add('hidden');

      if (!picks.length) {
        const li = document.createElement('li');
        li.className = 'thinking';
        li.textContent = 'No suggestions found. Try a different mood or keyword!';
        els.aiResults.appendChild(li);
        return;
      }

      picks.forEach(({ game }, idx) => {
        const li = document.createElement('li');
        li.className = 'ai-result-item';
        li.innerHTML = `
          <span class="game-emoji">${game.emoji}</span>
          <div class="meta">
            <span class="name">${game.name}</span>
            <span class="reason">${idx === 0 ? 'Best match for your mood' : 'Also a great pick'} (${(game.tags || []).join(', ') || 'arcade'})</span>
          </div>
          <button class="button primary" type="button">Play / Jouer</button>
        `;
        const btn = li.querySelector('button');
        if (btn) btn.addEventListener('click', () => {
          sound.playClick();
          navigateTo(game.id);
        });
        els.aiResults.appendChild(li);
      });
    }, 450);
  };

  els.aiSuggest.addEventListener('click', run);
  if (els.aiMood) {
    els.aiMood.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') run();
    });
  }
}

function navigateTo(id) {
  location.hash = `#/game/${id}`;
}
function navigateView(next) {
  location.hash = `#/${next}`;
}

async function loadGameById(id) {
  const meta = games.find(g => g.id === id);
  if (!meta) return;

  // cleanup previous
  if (current.destroy) try { current.destroy(); } catch {}
  current = { id, destroy: null };

  // UI
  els.welcome.classList.add('hidden');
  els.container.classList.remove('hidden');
  // Set the current game title so CSS can render a big heading
  if (meta.name) {
    els.container.setAttribute('data-game-title', meta.name);
  } else {
    els.container.removeAttribute('data-game-title');
  }
  els.container.innerHTML = '';

  // Handle external HTML games (like Peephole)
  if (meta.isExternal && meta.path) {
    try {
      // Create a toolbar for the fullscreen button
      const toolbar = document.createElement('div');
      toolbar.className = 'game-toolbar';
      
      // Create wrapper for iframe
      const iframeWrap = document.createElement('div');
      iframeWrap.style.position = 'relative';
      iframeWrap.style.width = '100%';
      iframeWrap.style.height = '100vh';
      
      // Create an iframe to load the game
      const iframe = document.createElement('iframe');
      iframe.src = meta.path;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.display = 'block';
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('webkitallowfullscreen', '');
      iframe.setAttribute('mozallowfullscreen', '');
      
      iframeWrap.appendChild(iframe);
      
      // Add fullscreen button to toolbar
      if (window.playBoxCreateFullscreenButton) {
        const fsBtn = window.playBoxCreateFullscreenButton(iframeWrap);
        if (fsBtn) toolbar.appendChild(fsBtn);
      }
      
      els.container.appendChild(toolbar);
      els.container.appendChild(iframeWrap);
      
      // Setup destroy function to remove iframe
      current.destroy = () => {
        if (iframeWrap.parentNode) {
          iframeWrap.parentNode.removeChild(iframeWrap);
        }
        if (toolbar.parentNode) {
          toolbar.parentNode.removeChild(toolbar);
        }
      };
      
      // start per-game background music once a game is actually running
      sound.startMusic(meta.id);
      // scroll game window into view so the player sees it right away
      if (els.container) {
        els.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error(err);
      els.container.innerHTML = `<div class="welcome"><h3>Failed to load ${meta.name}</h3><p>${String(err)}</p></div>`;
    }
    syncActiveListItem();
    return;
  }

  try {
    const mod = await meta.loader();
    const destroy = await mod.mount(els.container);
    current.destroy = typeof destroy === 'function' ? destroy : null;
    // start per-game background music once a game is actually running
    sound.startMusic(meta.id);
    // scroll game window into view so the player sees it right away
    if (els.container) {
      els.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    console.error(err);
    els.container.innerHTML = `<div class="welcome"><h3>Failed to load ${meta.name}</h3><p>${String(err)}</p></div>`;
  }

  syncActiveListItem();
  
  // Track play history and show AI recommendations
  addToPlayHistory(id);
  showGameRecommendations(id);
}

// ===== AI Recommendation System =====
const PLAY_HISTORY_KEY = 'gamehub:play-history';
const MAX_HISTORY = 20;

function getPlayHistory() {
  try {
    const raw = localStorage.getItem(PLAY_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToPlayHistory(gameId) {
  try {
    const history = getPlayHistory();
    const isFirstGame = history.length === 0;
    history.unshift({ id: gameId, timestamp: Date.now() });
    const trimmed = history.slice(0, MAX_HISTORY);
    localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(trimmed));
    
    // NEW: Show achievement toast for first game
    if (isFirstGame) {
      setTimeout(() => showToast('First game played!', '🎮', 3000), 500);
    }
    // Show toast for milestones
    const uniqueGames = new Set(trimmed.map(h => h.id)).size;
    if (uniqueGames === 5) {
      setTimeout(() => showToast('5 games played!', '🌟', 3000), 500);
    } else if (uniqueGames === 10) {
      setTimeout(() => showToast('Game Explorer!', '🏆', 3000), 500);
    }
  } catch {}
}

function generateAIRecommendations(currentGameId) {
  const history = getPlayHistory();
  const currentGame = games.find(g => g.id === currentGameId);
  if (!currentGame) return [];

  const currentTags = currentGame.tags || [];

  const scores = games
    .filter(g => g.id !== currentGameId)
    .map(game => {
      let score = 0;
      let reason = '';

      const playCount = history.filter(h => h.id === game.id).length;
      if (playCount > 0) {
        score += playCount * 5;
        if (playCount >= 3) reason = 'You love this!';
      }

      const gameTags = game.tags || [];
      const currentMoods = currentGame.mood || [];
      const gameMoods = game.mood || [];
      const sharedTags = currentTags.filter(t => gameTags.includes(t));
      const sharedMoods = currentMoods.filter(m => gameMoods.includes(m));
      
      if (sharedTags.length > 0) {
        score += sharedTags.length * 10;
      }
      
      // NEW: Smarter contextual reasons based on moods
      if (sharedMoods.length > 0) {
        score += sharedMoods.length * 8;
        if (sharedMoods.includes('⚡')) reason = 'Keep the energy up!';
        else if (sharedMoods.includes('😌')) reason = 'Another chill vibe';
        else if (sharedMoods.includes('👥')) reason = 'Bring a friend!';
        else if (sharedMoods.includes('🧠')) reason = 'Test your brain';
        else if (sharedMoods.includes('😂')) reason = 'More laughs ahead';
        else if (sharedMoods.includes('⏱️')) reason = 'Quick & fun';
      }
      
      // Tag-based reasons with more personality
      if (sharedTags.includes('horror') && !reason) reason = 'Dare to be scared?';
      if (sharedTags.includes('3d') && !reason) reason = 'Immersive 3D action';
      if (sharedTags.includes('multiplayer') && !reason) reason = 'Challenge someone!';
      if (sharedTags.includes('shooting') && !reason) reason = 'Lock and load!';
      if (sharedTags.includes('classic') && !reason) reason = 'Timeless classic';
      
      // Difficulty-based suggestions
      if (game.difficulty === currentGame.difficulty && !reason) {
        reason = 'Same difficulty level';
      } else if (game.difficulty > currentGame.difficulty && !reason) {
        reason = 'Ready for harder?';
      } else if (game.difficulty < currentGame.difficulty && !reason) {
        reason = 'Take it easy';
      }

      if (game.addedAt >= latestAddedAt - NEW_WINDOW) {
        score += 3;
        if (!reason) reason = 'Fresh & new!';
      }

      score += Math.random() * 2;

      return { game, score, reason: reason || 'You might like this' };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return scores;
}

function showGameRecommendations(gameId) {
  const recContainer = document.getElementById('game-recommendations');
  const recList = document.getElementById('game-rec-list');
  
  if (!recContainer || !recList) return;

  const recommendations = generateAIRecommendations(gameId);
  
  if (recommendations.length === 0) {
    recContainer.classList.add('hidden');
    return;
  }

  recList.innerHTML = '';
  
  recommendations.forEach(({ game, reason }) => {
    const item = document.createElement('div');
    item.className = 'game-rec-item';
    item.innerHTML = `
      <div class="rec-emoji">${game.emoji}</div>
      <div class="rec-info">
        <div class="rec-name">${game.name}</div>
        <div class="rec-reason">${reason}</div>
      </div>
    `;
    item.addEventListener('click', () => {
      sound.playClick();
      loadGameById(game.id);
      location.hash = `#/game/${game.id}`;
    });
    recList.appendChild(item);
  });

  recContainer.classList.remove('hidden');
}

function hideGameRecommendations() {
  const recContainer = document.getElementById('game-recommendations');
  if (recContainer) recContainer.classList.add('hidden');
}

function setActiveTab() {
  if (els.tabHome) els.tabHome.setAttribute('aria-selected', String(view === 'home'));
  if (els.tabSingle) els.tabSingle.setAttribute('aria-selected', String(view === 'single'));
  if (els.tabClassic) els.tabClassic.setAttribute('aria-selected', String(view === 'classic'));
  if (els.tabAi) els.tabAi.setAttribute('aria-selected', String(view === 'ai'));
  if (els.tabShooting) els.tabShooting.setAttribute('aria-selected', String(view === 'shooting'));
  if (els.tab3d) els.tab3d.setAttribute('aria-selected', String(view === '3d'));
  if (els.tabMulti) els.tabMulti.setAttribute('aria-selected', String(view === 'multiplayer'));
  if (els.tabComingSoon) els.tabComingSoon.setAttribute('aria-selected', String(view === 'coming-soon'));
}
function updatePanels() {
  // Multiplayer games now render like other games in the main container,
  // so keep the dedicated multiplayer panel hidden.
  if (els.multiPanel) els.multiPanel.classList.add('hidden');
}

function renderHeaderStats() {
  if (!els.headerStats) return;
  const count = games.length;
  let dailyName = '';
  try {
    const daily = getDailyGame();
    dailyName = daily?.name || '';
  } catch {}
  els.headerStats.textContent = dailyName
    ? `Games: ${count} · Daily: ${dailyName}`
    : `Games: ${count}`;
}

function setupResetButton() {
  if (!els.resetButton || !els.resetConfirm || !els.resetInput || !els.resetConfirmBtn) return;

  const CODES = ['892562', '2015'];

  els.resetButton.addEventListener('click', () => {
    els.resetConfirm.classList.toggle('hidden');
    if (!els.resetConfirm.classList.contains('hidden')) {
      els.resetInput.value = '';
      els.resetInput.focus();
    }
  });

  els.resetConfirmBtn.addEventListener('click', () => {
    const code = (els.resetInput.value || '').trim();
    if (!CODES.includes(code)) {
      alert('Incorrect code. If you forgot it, try entering your backup code to unlock the real reset code.');
      return;
    }
    try {
      // Remove known saved keys (highscores, theme, mute, tutorials)
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('gamehub:') || key === 'theme' || key === 'mute' || key.endsWith('-tutorial-completed')) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
    location.reload();
  });
}

function setupDevResetButton() {
  if (!els.devResetAllButton || !els.devResetConfirm || !els.devResetInput || !els.devResetConfirmBtn || !els.devResetCancelBtn) return;

  els.devResetAllButton.addEventListener('click', () => {
    sound.playClick();
    els.devResetConfirm.classList.remove('hidden');
    els.devResetInput.value = '';
    els.devResetInput.focus();
  });

  els.devResetCancelBtn.addEventListener('click', () => {
    sound.playClick();
    els.devResetConfirm.classList.add('hidden');
    els.devResetInput.value = '';
  });

  els.devResetConfirmBtn.addEventListener('click', () => {
    const input = (els.devResetInput.value || '').trim().toUpperCase();
    if (input !== 'RESET') {
      alert('Please type "RESET" exactly to confirm data deletion.');
      return;
    }

    // Confirm one more time
    if (!confirm('⚠️ FINAL WARNING: This will permanently delete ALL localStorage data. Are you absolutely sure?')) {
      return;
    }

    try {
      // Clear everything in localStorage
      localStorage.clear();
      
      // Show success message
      alert('✅ All data has been cleared! The page will now reload.');
      
      // Reload the page
      location.reload();
    } catch (error) {
      alert('❌ Error clearing data: ' + error.message);
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.devResetConfirm.classList.contains('hidden')) {
      els.devResetConfirm.classList.add('hidden');
      els.devResetInput.value = '';
    }
  });
}

function handleHashChange() {
  const game = location.hash.match(/^#\/game\/([^\s?#]+)/);
  const tab = location.hash.match(/^#\/(home|single|classic|ai|multiplayer|shooting|3d|coming-soon)(?:$|[?#])/);
  if (game) {
    loadGameById(game[1]);
    return;
  }
  if (tab) {
    view = tab[1];
  } else {
    // default to home if not specified
    view = 'home';
    if (!location.hash) navigateView('home');
  }
  // Show welcome screen and hide game container when returning to game list
  els.welcome.classList.remove('hidden');
  els.container.classList.add('hidden');
  // no direct game route active anymore → stop background music
  sound.stopMusic();
  hideGameRecommendations();
  renderRecentlyPlayed();
  setActiveTab();
  updatePanels();
  renderList(els.search?.value || '');
}

// tab clicks
if (els.tabHome) els.tabHome.addEventListener('click', () => {
  sound.playClick();
  navigateView('home');
});
if (els.tabSingle) els.tabSingle.addEventListener('click', () => {
  sound.playClick();
  navigateView('single');
});
if (els.tabClassic) els.tabClassic.addEventListener('click', () => {
  sound.playClick();
  navigateView('classic');
});
if (els.tabAi) els.tabAi.addEventListener('click', () => {
  sound.playClick();
  navigateView('ai');
});
if (els.tabShooting) els.tabShooting.addEventListener('click', () => {
  sound.playClick();
  navigateView('shooting');
});
if (els.tab3d) els.tab3d.addEventListener('click', () => {
  sound.playClick();
  navigateView('3d');
});
if (els.tabMulti) els.tabMulti.addEventListener('click', () => {
  sound.playClick();
  navigateView('multiplayer');
});
if (els.tabComingSoon) els.tabComingSoon.addEventListener('click', () => {
  sound.playClick();
  navigateView('coming-soon');
});

// search - optimized with debounce to reduce render calls
els.search.addEventListener('input', debounce((e) => renderList(e.target.value), 150));

// === NEW: Random game button ===
if (els.randomGame) {
  els.randomGame.addEventListener('click', () => {
    sound.playClick();
    // Filter out coming soon games from random selection
    const available = getViewGames().filter(g => (!g.isExternal || g.id) && !g.comingSoon);
    if (available.length === 0) return;
    const randomGame = available[Math.floor(Math.random() * available.length)];
    navigateTo(randomGame.id);
  });
}

// theme handling
function updateThemeToggleLabel() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (els.themeToggle) {
    els.themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    els.themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }
}
function setTheme(theme) {
  const isDark = theme === 'dark';
  if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  try { localStorage.setItem('theme', theme); } catch {}
  updateThemeToggleLabel();
}
function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
  } catch {}
  // Default to light the first time someone opens Play Box
  return 'light';
}
if (els.themeToggle) {
  els.themeToggle.addEventListener('click', () => {
    sound.playClick();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
  });
}

if (els.muteToggle) {
  els.muteToggle.addEventListener('click', () => {
    const wasMuted = sound.muted;
    sound.toggleMute();
    try { localStorage.setItem('mute', sound.muted ? '1' : '0'); } catch {}
    els.muteToggle.textContent = sound.muted ? '🔊 Unmute' : '🔇 Mute';
    els.muteToggle.title = sound.muted ? 'Turn sound back on' : 'Mute all sounds';
    if (!wasMuted) sound.playClick();
  });
}

if (els.fullscreenToggle) {
  const updateFsUi = () => {
    const active = !!document.fullscreenElement;
    els.fullscreenToggle.textContent = active ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
    els.fullscreenToggle.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
    // When fullscreen is active, also mark the page so the game window can expand
    document.documentElement.classList.toggle('pb-game-fullscreen', active);
  };
  els.fullscreenToggle.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error(e);
    }
    // Keep the button label and layout in sync even before the fullscreenchange event fires
    updateFsUi();
  });
  document.addEventListener('fullscreenchange', updateFsUi);
  updateFsUi();
}

// Helper so individual games can add their own fullscreen button
window.playBoxCreateFullscreenButton = function (targetEl) {
  if (!targetEl || !targetEl.requestFullscreen) return null;
  const btn = document.createElement('button');
  btn.className = 'button';
  const updateLabel = () => {
    const active = document.fullscreenElement === targetEl;
    btn.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
    btn.title = active ? 'Exit fullscreen for this game' : 'Fullscreen this game only';
  };
  btn.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === targetEl) {
        await document.exitFullscreen();
      } else {
        await targetEl.requestFullscreen();
      }
    } catch (e) {
      console.error(e);
    }
  });
  document.addEventListener('fullscreenchange', updateLabel);
  updateLabel();
  return btn;
};

function applyInitialMute() {
  let muted = false;
  try {
    muted = localStorage.getItem('mute') === '1';
  } catch {}
  if (muted) sound.toggleMute();
  if (els.muteToggle) {
    els.muteToggle.textContent = muted ? '🔊 Unmute' : '🔇 Mute';
    els.muteToggle.title = muted ? 'Turn sound back on' : 'Mute all sounds';
  }
}

// === NEW: Teacher Safe Mode ===
const TEACHER_MODE_KEY = 'gamehub:teacher-mode';

function isTeacherMode() {
  try {
    return localStorage.getItem(TEACHER_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

function setTeacherMode(enabled) {
  try {
    localStorage.setItem(TEACHER_MODE_KEY, enabled ? '1' : '0');
  } catch {}
  
  // Apply visual changes
  if (enabled) {
    document.documentElement.setAttribute('data-teacher-mode', 'true');
    // Auto-mute when enabling teacher mode
    if (!sound.isMuted()) {
      sound.toggleMute();
      if (els.muteToggle) {
        els.muteToggle.textContent = '🔊 Unmute';
        els.muteToggle.title = 'Turn sound back on';
      }
    }
  } else {
    document.documentElement.removeAttribute('data-teacher-mode');
  }
  
  // Update button state
  updateTeacherModeButton();
}

function updateTeacherModeButton() {
  if (!els.teacherMode) return;
  const active = isTeacherMode();
  els.teacherMode.classList.toggle('active', active);
  els.teacherMode.setAttribute('aria-pressed', String(active));
  els.teacherMode.style.opacity = active ? '1' : '0.6';
}

function setupTeacherMode() {
  if (!els.teacherMode) return;
  
  // Apply initial state
  if (isTeacherMode()) {
    setTeacherMode(true);
  }
  
  // Toggle handler
  els.teacherMode.addEventListener('click', () => {
    sound.playClick();
    setTeacherMode(!isTeacherMode());
  });
}

// === NEW: Compact Mode ===
const COMPACT_MODE_KEY = 'gamehub:compact-mode';

function isCompactMode() {
  try {
    return localStorage.getItem(COMPACT_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

function setCompactMode(enabled) {
  try {
    localStorage.setItem(COMPACT_MODE_KEY, enabled ? '1' : '0');
  } catch {}
  
  // Apply visual changes
  if (enabled) {
    document.documentElement.setAttribute('data-compact-mode', 'true');
  } else {
    document.documentElement.removeAttribute('data-compact-mode');
  }
  
  // Update button state
  updateCompactModeButton();
}

function updateCompactModeButton() {
  if (!els.compactMode) return;
  const active = isCompactMode();
  els.compactMode.classList.toggle('active', active);
  els.compactMode.setAttribute('aria-pressed', String(active));
  els.compactMode.style.opacity = active ? '1' : '0.6';
}

function setupCompactMode() {
  if (!els.compactMode) return;
  
  // Apply initial state
  if (isCompactMode()) {
    setCompactMode(true);
  }
  
  // Toggle handler
  els.compactMode.addEventListener('click', () => {
    sound.playClick();
    setCompactMode(!isCompactMode());
  });
}

setTheme(getInitialTheme());
applyInitialMute();
setupTeacherMode();
setupCompactMode();

// === NEW: Stats Toggle System ===
function isStatsVisible() {
  const stored = localStorage.getItem('gamehub:stats-visible');
  // Default to false (hidden) if not set
  return stored === 'true';
}

function setStatsVisible(visible) {
  localStorage.setItem('gamehub:stats-visible', String(visible));
  if (els.actions) {
    if (visible) {
      els.actions.classList.remove('stats-hidden');
    } else {
      els.actions.classList.add('stats-hidden');
    }
  }
  if (els.statsToggle) {
    els.statsToggle.classList.toggle('active', visible);
    els.statsToggle.setAttribute('aria-pressed', String(visible));
  }
}

function setupStatsToggle() {
  if (!els.statsToggle) return;
  
  // Apply initial state
  setStatsVisible(isStatsVisible());
  
  // Toggle handler
  els.statsToggle.addEventListener('click', () => {
    sound.playClick();
    setStatsVisible(!isStatsVisible());
  });
}

setupStatsToggle();

// === Settings Panel ===
function setupSettingsPanel() {
  if (!els.settingsToggle || !els.settingsPanel || !els.settingsClose) return;

  // Open settings
  els.settingsToggle.addEventListener('click', () => {
    sound.playClick();
    els.settingsPanel.classList.remove('hidden');
    // Scroll down to show the panel
    setTimeout(() => {
      els.settingsPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  });

  // Close settings and scroll back up
  const closeSettings = () => {
    sound.playClick();
    els.settingsPanel.classList.add('hidden');
    // Scroll back to top
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  // Close settings
  els.settingsClose.addEventListener('click', closeSettings);

  // Close on backdrop click
  const backdrop = els.settingsPanel.querySelector('.settings-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeSettings);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.settingsPanel.classList.contains('hidden')) {
      els.settingsPanel.classList.add('hidden');
      // Scroll back to top
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  });
}

setupSettingsPanel();

// === NEW: Daily Streak System ===
function getDailyStreak() {
  const data = JSON.parse(localStorage.getItem('gamehub:streak') || '{"count":0,"lastDate":""}');
  return data;
}

function updateDailyStreak() {
  const today = new Date().toDateString();
  const streakData = getDailyStreak();
  
  if (streakData.lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (streakData.lastDate === yesterdayStr) {
      // Continue streak
      streakData.count += 1;
    } else if (streakData.lastDate === '') {
      // First time
      streakData.count = 1;
    } else {
      // Streak broken, reset
      streakData.count = 1;
    }
    
    streakData.lastDate = today;
    localStorage.setItem('gamehub:streak', JSON.stringify(streakData));
    
    // Award bonus Playbux for streaks
    if (streakData.count % 7 === 0) {
      showToast(`${streakData.count} day streak! Bonus!`, '🔥', 4000);
      addPlaybux(50);
    }
  }
  
  renderStreakRing();
}

function renderStreakRing() {
  const streakData = getDailyStreak();
  const count = streakData.count;
  const textEl = document.getElementById('streak-ring-text');
  const progressEl = document.getElementById('streak-ring-progress');
  
  if (textEl) textEl.textContent = count;
  
  if (progressEl) {
    // Progress fills over 30 days max
    const maxDays = 30;
    const progress = Math.min(count / maxDays, 1);
    const circumference = 125.6; // 2 * π * r (r=20)
    const offset = circumference * (1 - progress);
    progressEl.style.strokeDashoffset = offset;
  }
}

updateDailyStreak();

// === NEW: Easter Eggs ===
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let clickCount = 0;
let clickTimer = null;

document.addEventListener('keydown', (e) => {
  konamiCode.push(e.key);
  konamiCode = konamiCode.slice(-10);
  
  if (konamiCode.join(',') === konamiSequence.join(',')) {
    showToast('Konami Code activated! 🎮', '✨', 4000);
    addPlaybux(100);
    konamiCode = [];
  }
});

// Triple-click logo easter egg
if (document.querySelector('.logo')) {
  document.querySelector('.logo').addEventListener('click', () => {
    clickCount++;
    clearTimeout(clickTimer);
    
    if (clickCount === 3) {
      const messages = [
        'You found a secret! 🎉',
        'Sneaky sneaky! 👀',
        'Triple click master! 🖱️',
        'Secret unlocked! 🔓'
      ];
      showToast(messages[Math.floor(Math.random() * messages.length)], '🥚', 3000);
      addPlaybux(25);
      clickCount = 0;
    } else {
      clickTimer = setTimeout(() => clickCount = 0, 500);
    }
  });
}

// === NEW: Game End Action Panel ===
let currentGameId = null;

function showGameEndPanel(gameId) {
  if (!els.gameEndPanel) return;
  currentGameId = gameId;
  els.gameEndPanel.classList.remove('hidden');
}

function hideGameEndPanel() {
  if (!els.gameEndPanel) return;
  els.gameEndPanel.classList.add('hidden');
}

if (els.playAgainBtn) {
  els.playAgainBtn.addEventListener('click', () => {
    sound.playClick();
    hideGameEndPanel();
    if (currentGameId) {
      loadGameById(currentGameId);
    }
  });
}

if (els.randomNextBtn) {
  els.randomNextBtn.addEventListener('click', () => {
    sound.playClick();
    hideGameEndPanel();
    const filtered = getFilteredGames();
    if (filtered.length > 0) {
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      loadGameById(random.id);
    }
  });
}

if (els.backHubBtn) {
  els.backHubBtn.addEventListener('click', () => {
    sound.playClick();
    hideGameEndPanel();
    navigate('home');
  });
}

// Listen for game end event from iframes or game modules
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'game-end') {
    setTimeout(() => showGameEndPanel(current.id), 1000);
  }
  // NEW: Play Mate reactions
  if (event.data && event.data.type === 'game-result') {
    playMateReact(event.data.result);
  }
});

// === NEW: Play Mate Reaction System ===
let lastReactionTime = 0;
const REACTION_COOLDOWN = 3000; // 3 seconds between reactions

function playMateReact(result) {
  if (!els.avatarHud) return;
  
  // Prevent toast spam with cooldown
  const now = Date.now();
  if (now - lastReactionTime < REACTION_COOLDOWN) {
    return;
  }
  lastReactionTime = now;
  
  // Remove any existing reaction classes
  els.avatarHud.classList.remove('reaction-win', 'reaction-lose', 'reaction-idle');
  
  // Add new reaction based on result
  if (result === 'win') {
    els.avatarHud.classList.add('reaction-win');
    const messages = ['Good job!', 'Nice!', 'Amazing!', 'Perfect!'];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    showToast(randomMsg, '🎉', 2000);
  } else if (result === 'lose') {
    els.avatarHud.classList.add('reaction-lose');
    showToast('Try again!', '💪', 2000);
  } else {
    els.avatarHud.classList.add('reaction-idle');
  }
  
  // Remove reaction class after animation completes
  setTimeout(() => {
    els.avatarHud.classList.remove('reaction-win', 'reaction-lose', 'reaction-idle');
  }, 2000);
}

// Auto-play idle animation periodically
setInterval(() => {
  if (els.avatarHud && !els.avatarHud.classList.contains('reaction-win') && !els.avatarHud.classList.contains('reaction-lose')) {
    els.avatarHud.classList.add('reaction-idle');
    setTimeout(() => els.avatarHud.classList.remove('reaction-idle'), 2000);
  }
}, 15000);

// === NEW: Session Summary System ===
const SESSION_KEY = 'gamehub:session';

function getSessionData() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : { startTime: Date.now(), playbuxStart: readNumber('playbux', 0), gamesPlayed: 0 };
  } catch {
    return { startTime: Date.now(), playbuxStart: readNumber('playbux', 0), gamesPlayed: 0 };
  }
}

function updateSessionData() {
  const session = getSessionData();
  session.gamesPlayed = getPlayHistory().length;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function showSessionSummary() {
  if (!els.sessionSummary) return;
  
  const session = getSessionData();
  const timePlayedMs = Date.now() - session.startTime;
  const minutes = Math.floor(timePlayedMs / 60000);
  const currentPlaybux = readNumber('playbux', 0);
  const playbuxEarned = currentPlaybux - session.playbuxStart;
  const gamesPlayed = getPlayHistory().length;
  
  if (els.sessionTime) {
    els.sessionTime.textContent = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
  if (els.sessionPlaybux) {
    els.sessionPlaybux.textContent = `${playbuxEarned} PB`;
  }
  if (els.sessionGames) {
    els.sessionGames.textContent = gamesPlayed;
  }
  
  els.sessionSummary.classList.remove('hidden');
}

if (els.sessionCloseBtn) {
  els.sessionCloseBtn.addEventListener('click', () => {
    sound.playClick();
    if (els.sessionSummary) {
      els.sessionSummary.classList.add('hidden');
    }
  });
}

// Show session summary after 30 minutes of play
setTimeout(() => {
  showSessionSummary();
}, 30 * 60 * 1000);


// ...existing code for addToPlayHistory...


// Update session data when games are played
const originalAddToPlayHistory = addToPlayHistory;
window.addToPlayHistory = function(gameId) {
  originalAddToPlayHistory(gameId);
  updateSessionData();
};

// init
renderList('');
renderDailyCard();
renderRecentlyPlayed();
renderHeaderStats();
setupPlaybux();
setupAiRecommendations();
setupResetButton();
setupDevResetButton();
setupPlaymateShop();
setupSettingsPanel();
updateAvatarUnlockState();
addEventListener('hashchange', handleHashChange);
handleHashChange();
setActiveTab();
updatePanels();

// Add to game loader (example, adjust as needed):

