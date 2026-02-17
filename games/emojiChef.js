// games/emojiChef.js
// Catch falling ingredients to complete recipes. Wrong ingredients break your combo!

import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(root) {
  const TUTORIAL_KEY = 'emoji-chef-tutorial-completed';

  const wrap = document.createElement('div');
  wrap.className = 'emoji-chef';

  // --- Toolbar ---
  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const startBtn = makeButton('Start');
  startBtn.classList.add('button', 'primary');
  const pauseBtn = makeButton('Pause');
  pauseBtn.classList.add('button');
  const resetBtn = makeButton('Reset');
  resetBtn.classList.add('button');
  const tutorialBtn = makeButton('🎓 Tutorial');
  tutorialBtn.classList.add('button');
  tutorialBtn.style.background = '#10b981';
  tutorialBtn.style.color = 'white';

  const recipeBadge = makeBadge('Recipe: Loading...');
  const comboBadge = makeBadge('Combo: 0');
  const scoreBadge = makeBadge('Score: 0');
  const bestBadge = makeBadge('Best: 0');
  const livesBadge = makeBadge('Lives: 3');

  toolbar.append(
    startBtn,
    pauseBtn,
    resetBtn,
    tutorialBtn,
    recipeBadge,
    comboBadge,
    scoreBadge,
    bestBadge,
    livesBadge,
  );

  // --- Canvas ---
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const WIDTH = 640;
  const HEIGHT = 480;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvasWrap.appendChild(canvas);

  // Per-game fullscreen button
  if (window.playBoxCreateFullscreenButton) {
    const fsBtn = window.playBoxCreateFullscreenButton(canvasWrap);
    if (fsBtn) toolbar.appendChild(fsBtn);
  }

  const rules = createRules([
    'Use Arrow keys or AD to move the chef left and right.',
    'Catch the ingredients shown in your current recipe.',
    'Complete recipes to earn points and increase your combo!',
    'Catching wrong ingredients breaks your combo.',
    'Speed increases as you complete more recipes.',
    'Game ends when you lose all 3 lives.'
  ]);

  wrap.append(toolbar, canvasWrap, rules);
  root.appendChild(wrap);

  // --- Game State ---
  let gameRunning = false;
  let gamePaused = false;
  let score = 0;
  let combo = 0;
  let lives = 3;
  let speed = 1;
  let bestScore = getHighScore('emoji-chef') || 0;

  // Chef
  const chef = {
    x: WIDTH / 2,
    y: HEIGHT - 60,
    width: 50,
    height: 50,
    vx: 0,
    emoji: '👨‍🍳'
  };

  // Recipes database
  const RECIPES = [
    { name: '🍕 Pizza', ingredients: ['🍅', '🧀', '🌾'], points: 100 },
    { name: '🍔 Burger', ingredients: ['🥩', '🥬', '🍞'], points: 100 },
    { name: '🍰 Cake', ingredients: ['🥚', '🌾', '🍓'], points: 120 },
    { name: '🍜 Ramen', ingredients: ['🍜', '🥚', '🥬'], points: 100 },
    { name: '🥗 Salad', ingredients: ['🥬', '🍅', '🥕'], points: 80 },
    { name: '🍪 Cookies', ingredients: ['🥚', '🌾', '🍫'], points: 90 },
    { name: '🌮 Taco', ingredients: ['🥩', '🧀', '🥬'], points: 100 },
    { name: '🍝 Pasta', ingredients: ['🍅', '🌾', '🧀'], points: 100 },
    { name: '🥞 Pancakes', ingredients: ['🥚', '🌾', '🍯'], points: 90 },
    { name: '🍣 Sushi', ingredients: ['🍚', '🐟', '🥒'], points: 150 }
  ];

  // All possible ingredients (including wrong ones)
  const ALL_INGREDIENTS = [
    '🍅', '🧀', '🌾', '🥩', '🥬', '🍞', '🥚', '🍓', '🍜', '🥕',
    '🍫', '🍯', '🍚', '🐟', '🥒', '🍋', '🥔', '🌶️', '🍄', '🥜'
  ];

  let currentRecipe = null;
  let neededIngredients = [];
  let fallingItems = [];
  let recipeProgress = 0;

  // Input
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // --- Functions ---
  function makeButton(txt) {
    const btn = document.createElement('button');
    btn.textContent = txt;
    return btn;
  }

  function makeBadge(txt) {
    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.textContent = txt;
    return badge;
  }

  function createRules(lines) {
    const rulesDiv = document.createElement('div');
    rulesDiv.className = 'game-rules';
    const title = document.createElement('h3');
    title.textContent = 'How to Play';
    rulesDiv.appendChild(title);
    const ul = document.createElement('ul');
    lines.forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      ul.appendChild(li);
    });
    rulesDiv.appendChild(ul);
    return rulesDiv;
  }

  function startNewRecipe() {
    currentRecipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    neededIngredients = [...currentRecipe.ingredients];
    recipeProgress = 0;
    recipeBadge.textContent = `Recipe: ${currentRecipe.name} [${neededIngredients.join(' ')}]`;
  }

  function spawnFallingItem() {
    const isCorrect = Math.random() < 0.7; // 70% chance of correct ingredient
    let emoji;
    
    if (isCorrect && neededIngredients.length > 0) {
      emoji = neededIngredients[Math.floor(Math.random() * neededIngredients.length)];
    } else {
      // Wrong ingredient
      const wrongOnes = ALL_INGREDIENTS.filter(ing => !neededIngredients.includes(ing));
      emoji = wrongOnes[Math.floor(Math.random() * wrongOnes.length)];
    }

    fallingItems.push({
      x: Math.random() * (WIDTH - 40) + 20,
      y: -30,
      emoji: emoji,
      width: 40,
      height: 40,
      vy: 2 * speed
    });
  }

  function reset() {
    gameRunning = false;
    gamePaused = false;
    score = 0;
    combo = 0;
    lives = 3;
    speed = 1;
    chef.x = WIDTH / 2;
    chef.vx = 0;
    fallingItems = [];
    startNewRecipe();
    updateUI();
    drawInitialState();
  }

  function drawInitialState() {
    // Clear canvas
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw ground
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, HEIGHT - 40, WIDTH, 40);

    // Draw current recipe inventory at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(10, 10, WIDTH - 20, 80);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, WIDTH - 20, 80);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Recipe: ${currentRecipe.name}`, 20, 38);
    
    // Draw needed ingredients
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('Need:', 20, 65);
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    neededIngredients.forEach((ing, i) => {
      ctx.fillText(ing, 100 + (i * 50), 68);
    });

    // Draw chef
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(chef.emoji, chef.x, chef.y);

    // Draw "Click Start to Play" message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, HEIGHT / 2 - 60, WIDTH, 120);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('Click Start to Play!', WIDTH / 2, HEIGHT / 2 - 10);
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Use ← → or A D to move', WIDTH / 2, HEIGHT / 2 + 30);
  }

  function updateUI() {
    scoreBadge.textContent = `Score: ${score}`;
    bestBadge.textContent = `Best: ${bestScore}`;
    comboBadge.textContent = `Combo: ${combo}`;
    livesBadge.textContent = `Lives: ${lives}`;
  }

  function checkCollision(item) {
    return (
      item.x + item.width > chef.x - chef.width / 2 &&
      item.x < chef.x + chef.width / 2 &&
      item.y + item.height > chef.y - chef.height / 2 &&
      item.y < chef.y + chef.height / 2
    );
  }

  function gameLoop() {
    if (!gameRunning || gamePaused) return;

    // Clear canvas
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw ground
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, HEIGHT - 40, WIDTH, 40);

    // Draw current recipe inventory at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(10, 10, WIDTH - 20, 80);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, WIDTH - 20, 80);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Recipe: ${currentRecipe.name}`, 20, 38);
    
    // Draw needed ingredients
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('Need:', 20, 65);
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    neededIngredients.forEach((ing, i) => {
      ctx.fillText(ing, 100 + (i * 50), 68);
    });
    
    // Draw completed indicator
    if (neededIngredients.length === 0) {
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('✓ Recipe Complete!', WIDTH - 200, 65);
    }

    // Update chef
    chef.vx = 0;
    if (keys['arrowleft'] || keys['a']) chef.vx = -6;
    if (keys['arrowright'] || keys['d']) chef.vx = 6;
    chef.x += chef.vx;
    chef.x = Math.max(chef.width / 2, Math.min(WIDTH - chef.width / 2, chef.x));

    // Draw chef
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(chef.emoji, chef.x, chef.y);

    // Update and draw falling items
    fallingItems = fallingItems.filter(item => {
      item.y += item.vy;

      // Draw item
      ctx.font = 'bold 40px Arial';
      ctx.fillText(item.emoji, item.x, item.y);

      // Check collision
      if (checkCollision(item)) {
        const isNeeded = neededIngredients.includes(item.emoji);
        
        if (isNeeded) {
          // Correct ingredient!
          sound.playScore();
          combo++;
          recipeProgress++;
          
          // Remove this ingredient from needed list
          const idx = neededIngredients.indexOf(item.emoji);
          if (idx !== -1) {
            neededIngredients.splice(idx, 1);
          }

          // Check if recipe is complete
          if (neededIngredients.length === 0) {
            score += currentRecipe.points + (combo * 10);
            sound.playWin();
            speed = Math.min(speed + 0.1, 3); // Increase speed
            setTimeout(() => startNewRecipe(), 1000); // Delay to show completion
          }

          comboBadge.textContent = `Combo: ${combo}`;
          recipeBadge.textContent = `Recipe: ${currentRecipe.name} [${neededIngredients.join(' ')}]`;
          updateUI();
          return false; // Remove item
        } else {
          // Wrong ingredient!
          sound.playLose();
          combo = 0;
          lives--;
          comboBadge.textContent = `Combo: 0`;
          livesBadge.textContent = `Lives: ${lives}`;
          
          if (lives <= 0) {
            gameOver();
          }
          return false; // Remove item
        }
      }

      // Remove if off screen
      if (item.y > HEIGHT) {
        return false;
      }

      return true;
    });

    // Spawn new items
    if (Math.random() < 0.02 * speed) {
      spawnFallingItem();
    }

    requestAnimationFrame(gameLoop);
  }

  function gameOver() {
    gameRunning = false;
    sound.playGameOver();
    
    if (score > bestScore) {
      bestScore = score;
      updateHighScore('emoji-chef', score);
      bestBadge.textContent = `Best: ${bestScore}`;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', WIDTH / 2, HEIGHT / 2 - 40);
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
    ctx.fillText(`Best: ${bestScore}`, WIDTH / 2, HEIGHT / 2 + 65);
  }

  function showTutorial() {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const tutorialBox = document.createElement('div');
    tutorialBox.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    const steps = [
      {
        title: '👨‍🍳 Welcome to Emoji Chef!',
        content: 'You\'re a chef who needs to catch falling ingredients to complete recipes. Let\'s learn how to play!'
      },
      {
        title: '🎯 Your Goal',
        content: 'Look at the top of the screen to see your current recipe and the ingredients you need to catch. Complete recipes to earn points!'
      },
      {
        title: '⬅️➡️ Moving',
        content: 'Use the LEFT and RIGHT arrow keys (or A and D keys) to move your chef left and right across the screen.'
      },
      {
        title: '✅ Correct Ingredients',
        content: 'When you catch an ingredient that\'s part of your current recipe, you\'ll earn combo points and get closer to completing the recipe!'
      },
      {
        title: '❌ Wrong Ingredients',
        content: 'If you catch an ingredient that\'s NOT in your recipe, your combo resets to 0 and you lose a life. Be careful!'
      },
      {
        title: '🔥 Combo System',
        content: 'Each correct ingredient increases your combo. Higher combos give bonus points when you complete a recipe!'
      },
      {
        title: '⚡ Increasing Difficulty',
        content: 'As you complete more recipes, ingredients fall faster! Keep your reflexes sharp.'
      },
      {
        title: '❤️ Lives',
        content: 'You start with 3 lives. Catching wrong ingredients costs a life. The game ends when you run out of lives.'
      },
      {
        title: '🏆 Ready to Cook!',
        content: 'Now you know everything! Click Start to begin catching ingredients and completing delicious recipes. Good luck, chef!'
      }
    ];

    let currentStep = 0;

    function renderStep() {
      const step = steps[currentStep];
      tutorialBox.innerHTML = `
        <h2 style="margin-top: 0; color: #2563eb; font-size: 28px;">${step.title}</h2>
        <p style="font-size: 18px; line-height: 1.6; color: #333;">${step.content}</p>
        <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
          <button id="tutorial-back" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;" ${currentStep === 0 ? 'disabled' : ''}>
            ← Back
          </button>
          <span style="color: #6b7280; font-size: 14px;">Step ${currentStep + 1} of ${steps.length}</span>
          <button id="tutorial-next" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
            ${currentStep === steps.length - 1 ? 'Done! 🎉' : 'Next →'}
          </button>
        </div>
        <button id="tutorial-skip" style="margin-top: 15px; padding: 8px 16px; background: transparent; color: #6b7280; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; width: 100%; font-size: 14px;">
          Skip Tutorial
        </button>
      `;

      const backBtn = tutorialBox.querySelector('#tutorial-back');
      const nextBtn = tutorialBox.querySelector('#tutorial-next');
      const skipBtn = tutorialBox.querySelector('#tutorial-skip');

      backBtn.onclick = () => {
        if (currentStep > 0) {
          currentStep--;
          renderStep();
        }
      };

      nextBtn.onclick = () => {
        if (currentStep < steps.length - 1) {
          currentStep++;
          renderStep();
        } else {
          closeTutorial();
        }
      };

      skipBtn.onclick = closeTutorial;
    }

    function closeTutorial() {
      overlay.remove();
      localStorage.setItem(TUTORIAL_KEY, 'true');
      setTimeout(() => {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }

    overlay.appendChild(tutorialBox);
    document.body.appendChild(overlay);
    renderStep();
  }

  // --- Event Listeners ---
  startBtn.addEventListener('click', () => {
    if (!gameRunning) {
      reset();
      gameRunning = true;
      sound.playClick();
      gameLoop();
    }
  });

  pauseBtn.addEventListener('click', () => {
    if (gameRunning) {
      gamePaused = !gamePaused;
      pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
      if (!gamePaused) gameLoop();
    }
  });

  resetBtn.addEventListener('click', () => {
    reset();
    sound.playClick();
  });

  tutorialBtn.addEventListener('click', () => {
    showTutorial();
    setTimeout(() => {
      document.body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  });

  // --- Initialize ---
  reset();
  updateUI();

  // Auto-show tutorial for first-time players
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    setTimeout(showTutorial, 500);
  }

  // --- Cleanup ---
  return () => {
    root.innerHTML = '';
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
  };
}
