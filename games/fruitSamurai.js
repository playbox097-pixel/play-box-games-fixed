// Fruit Samurai - Slice fruit with your mouse like a ninja!
// Swipe to slice fruit, avoid bombs, get combos!

import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(container) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.display = 'block';
  canvas.style.margin = '20px auto';
  canvas.style.background = 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)';
  canvas.style.borderRadius = '12px';
  canvas.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
  canvas.style.cursor = 'none';
  container.appendChild(canvas);

  const HS_KEY = 'fruit-samurai';
  let bestScore = getHighScore(HS_KEY) || 0;

  let gameRunning = false;
  let gameStarted = false;
  let score = 0;
  let lives = 3;
  let combo = 0;
  let maxCombo = 0;

  // Settings
  let settings = {
    difficulty: 'medium', // easy, medium, hard, chaos
    fruitSize: 'normal', // small, normal, big, huge
    particleEffects: 'normal', // minimal, normal, extreme
    trailLength: 'normal', // short, normal, long
  };

  // Load settings
  try {
    const savedSettings = localStorage.getItem('fruit-samurai-settings');
    if (savedSettings) {
      settings = { ...settings, ...JSON.parse(savedSettings) };
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }

  // Save settings
  function saveSettings() {
    try {
      localStorage.setItem('fruit-samurai-settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }

  // Difficulty configs
  const difficultyConfigs = {
    easy: { spawnRate: 80, speedMultiplier: 0.7, bombChance: 0.1, lives: 5 },
    medium: { spawnRate: 60, speedMultiplier: 1.0, bombChance: 0.2, lives: 3 },
    hard: { spawnRate: 45, speedMultiplier: 1.3, bombChance: 0.25, lives: 2 },
    chaos: { spawnRate: 30, speedMultiplier: 1.5, bombChance: 0.3, lives: 1 },
  };

  // Visual configs
  const sizeMultipliers = {
    small: 0.6,
    normal: 1.0,
    big: 1.4,
    huge: 2.0,
  };

  const particleConfigs = {
    minimal: 8,
    normal: 15,
    extreme: 30,
  };

  const trailConfigs = {
    short: 10,
    normal: 20,
    long: 40,
  };

  // Fruit types
  const fruitTypes = [
    { name: 'apple', emoji: '🍎', color: '#ff0000', points: 1 },
    { name: 'orange', emoji: '🍊', color: '#ff8800', points: 1 },
    { name: 'banana', emoji: '🍌', color: '#ffdd00', points: 1 },
    { name: 'watermelon', emoji: '🍉', color: '#ff6b9d', points: 2 },
    { name: 'grapes', emoji: '🍇', color: '#9370db', points: 1 },
    { name: 'strawberry', emoji: '🍓', color: '#ff3366', points: 1 },
    { name: 'pineapple', emoji: '🍍', color: '#ffd700', points: 2 },
    { name: 'kiwi', emoji: '🥝', color: '#8bc34a', points: 1 },
  ];

  // Game objects
  let fruits = [];
  let bombs = [];
  let sliceTrail = [];
  let particles = [];

  // Mouse tracking
  let mouseX = 0;
  let mouseY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let isSlicing = false;

  // Spawn timers
  let spawnTimer = 0;
  let difficultyTimer = 0;
  let spawnRate = difficultyConfigs[settings.difficulty].spawnRate;

  // Get current difficulty config
  function getDifficultyConfig() {
    return difficultyConfigs[settings.difficulty];
  }

  // Spawn fruit
  function spawnFruit() {
    const type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
    const x = Math.random() * (canvas.width - 100) + 50;
    const config = getDifficultyConfig();
    const sizeMulti = sizeMultipliers[settings.fruitSize];
    const velocityX = (Math.random() - 0.5) * 5 * config.speedMultiplier;
    const velocityY = (-12 - Math.random() * 4) * config.speedMultiplier; // Increased from -8 to -12
    
    fruits.push({
      x: x,
      y: canvas.height,
      size: (40 + Math.random() * 20) * sizeMulti,
      velocityX: velocityX,
      velocityY: velocityY,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      type: type,
      sliced: false,
    });
  }

  // Spawn bomb
  function spawnBomb() {
    const x = Math.random() * (canvas.width - 100) + 50;
    const config = getDifficultyConfig();
    const sizeMulti = sizeMultipliers[settings.fruitSize];
    const velocityX = (Math.random() - 0.5) * 4 * config.speedMultiplier;
    const velocityY = (-11 - Math.random() * 4) * config.speedMultiplier; // Increased from -7 to -11
    
    bombs.push({
      x: x,
      y: canvas.height,
      size: 45 * sizeMulti,
      velocityX: velocityX,
      velocityY: velocityY,
      rotation: 0,
      rotationSpeed: 0.08,
      sliced: false,
    });
  }

  // Create particles
  function createParticles(x, y, color, count = 15) {
    const particleCount = particleConfigs[settings.particleEffects];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        size: 3 + Math.random() * 5,
        color: color,
        life: 1,
        gravity: 0.3,
      });
    }
  }

  // Check if point is near line
  function isNearLine(px, py, x1, y1, x2, y2, threshold = 30) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return false;
    
    const dot = ((px - x1) * dx + (py - y1) * dy) / (length * length);
    const closestX = x1 + dot * dx;
    const closestY = y1 + dot * dy;
    
    const distance = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
    return distance < threshold && dot >= 0 && dot <= 1;
  }

  // Update game
  function update() {
    if (!gameRunning || !gameStarted) return;

    const GRAVITY = 0.35; // Reduced from 0.5 for slower fall

    // Increase difficulty over time (slower progression)
    difficultyTimer++;
    if (difficultyTimer > 900 && spawnRate > 35) { // Changed from 600 and 30
      spawnRate -= 3; // Reduced from 5
      difficultyTimer = 0;
    }

    // Spawn objects
    spawnTimer++;
    if (spawnTimer > spawnRate) {
      spawnTimer = 0;
      
      const config = getDifficultyConfig();
      // Spawn based on difficulty bomb chance
      if (Math.random() < (1 - config.bombChance)) {
        spawnFruit();
        // Sometimes spawn multiple fruits
        if (Math.random() < 0.3) {
          setTimeout(() => spawnFruit(), 200);
        }
      } else {
        spawnBomb();
      }
    }

    // Update fruits
    fruits.forEach((fruit, index) => {
      fruit.velocityY += GRAVITY;
      fruit.x += fruit.velocityX;
      fruit.y += fruit.velocityY;
      fruit.rotation += fruit.rotationSpeed;

      // Check if sliced
      if (!fruit.sliced && sliceTrail.length > 1) {
        const trail = sliceTrail[sliceTrail.length - 1];
        const prevTrail = sliceTrail[sliceTrail.length - 2];
        
        if (isNearLine(fruit.x, fruit.y, prevTrail.x, prevTrail.y, trail.x, trail.y, fruit.size / 2)) {
          fruit.sliced = true;
          score += fruit.type.points;
          combo++;
          maxCombo = Math.max(maxCombo, combo);
          sound.playScore();
          createParticles(fruit.x, fruit.y, fruit.type.color, 20);
          
          // Create sliced halves
          createSlicedHalves(fruit);
          
          fruits.splice(index, 1);
        }
      }

      // Remove if off screen
      if (fruit.y > canvas.height + 100) {
        if (!fruit.sliced) {
          lives--;
          combo = 0;
          sound.playGameOver();
          if (lives <= 0) {
            endGame();
          }
        }
        fruits.splice(index, 1);
      }
    });

    // Update bombs
    bombs.forEach((bomb, index) => {
      bomb.velocityY += GRAVITY;
      bomb.x += bomb.velocityX;
      bomb.y += bomb.velocityY;
      bomb.rotation += bomb.rotationSpeed;

      // Check if sliced
      if (!bomb.sliced && sliceTrail.length > 1) {
        const trail = sliceTrail[sliceTrail.length - 1];
        const prevTrail = sliceTrail[sliceTrail.length - 2];
        
        if (isNearLine(bomb.x, bomb.y, prevTrail.x, prevTrail.y, trail.x, trail.y, bomb.size / 2)) {
          bomb.sliced = true;
          lives = 0;
          sound.playGameOver();
          createParticles(bomb.x, bomb.y, '#333', 30);
          endGame();
          bombs.splice(index, 1);
        }
      }

      // Remove if off screen
      if (bomb.y > canvas.height + 100) {
        bombs.splice(index, 1);
      }
    });

    // Update particles
    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.life -= 0.02;
      return p.life > 0;
    });

    // Update slice trail
    sliceTrail = sliceTrail.filter(t => {
      t.life -= 0.05;
      return t.life > 0;
    });
  }

  // Create sliced halves effect
  function createSlicedHalves(fruit) {
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: fruit.x,
        y: fruit.y,
        vx: (i === 0 ? -4 : 4) + (Math.random() - 0.5) * 2,
        vy: -5 - Math.random() * 3,
        size: fruit.size * 0.6,
        color: fruit.type.color,
        life: 1,
        gravity: 0.4,
        isFruitHalf: true,
        emoji: fruit.type.emoji,
      });
    }
  }

  // Draw
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) return;

    // Draw particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      
      if (p.isFruitHalf) {
        ctx.font = `${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });

    // Draw fruits
    fruits.forEach(fruit => {
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.rotation);
      ctx.font = `${fruit.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fruit.type.emoji, 0, 0);
      ctx.restore();
    });

    // Draw bombs
    bombs.forEach(bomb => {
      ctx.save();
      ctx.translate(bomb.x, bomb.y);
      ctx.rotate(bomb.rotation);
      ctx.font = `${bomb.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💣', 0, 0);
      ctx.restore();
    });

    // Draw slice trail
    if (sliceTrail.length > 1) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffff';
      
      ctx.beginPath();
      ctx.moveTo(sliceTrail[0].x, sliceTrail[0].y);
      
      for (let i = 1; i < sliceTrail.length; i++) {
        ctx.globalAlpha = sliceTrail[i].life;
        ctx.lineTo(sliceTrail[i].x, sliceTrail[i].y);
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Draw cursor
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw UI
    drawUI();
  }

  // Draw UI
  function drawUI() {
    // Top bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, 100);

    // Score
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(`Score: ${score}`, 20, 45);
    ctx.fillText(`Score: ${score}`, 20, 45);
    
    // Lives
    ctx.textAlign = 'right';
    ctx.fillStyle = lives <= 1 ? '#ff3333' : '#fff';
    ctx.strokeText(`❤️ ${lives}`, canvas.width - 20, 45);
    ctx.fillText(`❤️ ${lives}`, canvas.width - 20, 45);
    
    // Settings button (gear icon)
    const settingsX = canvas.width - 80;
    const settingsY = 60;
    const settingsSize = 30;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(settingsX - 5, settingsY - 5, settingsSize + 10, settingsSize + 10);
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('⚙️', settingsX + settingsSize / 2, settingsY + settingsSize - 2);
    
    // Combo
    if (combo > 1) {
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffff00';
      ctx.strokeStyle = '#ff6b00';
      ctx.lineWidth = 5;
      ctx.strokeText(`${combo}x COMBO!`, canvas.width / 2, 120);
      ctx.fillText(`${combo}x COMBO!`, canvas.width / 2, 120);
    }

    // Scoreboard on the right side
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width - 200, 110, 190, 150);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width - 200, 110, 190, 150);

    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#feca57';
    ctx.fillText('📊 STATS', canvas.width - 185, 135);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`🏆 Best: ${bestScore}`, canvas.width - 185, 165);
    ctx.fillText(`🎯 Score: ${score}`, canvas.width - 185, 190);
    ctx.fillText(`🔥 Max Combo: ${maxCombo}x`, canvas.width - 185, 215);
    ctx.fillText(`💥 Sliced: ${score > 0 ? Math.floor(score / 2) : 0}`, canvas.width - 185, 240);
  }

  // End game
  function endGame() {
    gameRunning = false;
    sound.playGameOver();
    
    // Update high score
    if (score > bestScore) {
      bestScore = score;
      updateHighScore(HS_KEY, score);
    }

    // Check if it's Taco Tuesday (day 2 = Tuesday, 0-indexed)
    const today = new Date().getDay();
    const isTacoTuesday = today === 2;

    // Create game over overlay
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'fruit-samurai-game-over';
    gameOverScreen.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      animation: fadeIn 0.3s;
    `;

    // Check if revive system is available
    const hasReviveSystem = window.playBoxGetRevives && window.playBoxUseRevive;
    const revivesLeft = hasReviveSystem ? window.playBoxGetRevives() : 0;
    const canRevive = revivesLeft > 0;
    const currentPB = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;

    gameOverScreen.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .fs-modal-hidden {
          display: none !important;
        }
      </style>
      <div style="background: linear-gradient(135deg, #ff6b00, #ff3838); padding: 40px; border-radius: 20px; max-width: 500px; width: 90%; text-align: center; box-shadow: 0 0 50px rgba(255, 107, 0, 0.8); border: 4px solid #feca57;">
        <div style="font-size: 64px; margin-bottom: 20px; animation: pulse 2s infinite;">💀</div>
        <h1 style="color: #fff; margin: 0 0 10px 0; font-size: 48px; text-shadow: 3px 3px 6px rgba(0,0,0,0.5);">GAME OVER</h1>
        <div style="color: #feca57; font-size: 20px; margin-bottom: 30px;">Your blade has dulled...</div>
        
        <div style="background: rgba(0, 0, 0, 0.4); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
          <div style="color: #fff; font-size: 18px; margin-bottom: 15px;">
            <span style="color: #feca57;">🎯 Score:</span> <span style="font-size: 32px; font-weight: bold;">${score}</span>
          </div>
          <div style="color: #fff; font-size: 16px; margin-bottom: 8px;">
            <span style="color: #ff8e53;">🔥 Max Combo:</span> <span style="font-weight: bold;">${maxCombo}x</span>
          </div>
          <div style="color: #fff; font-size: 16px; margin-bottom: 8px;">
            <span style="color: #4caf50;">🏆 Best Score:</span> <span style="font-weight: bold;">${bestScore}</span>
          </div>
          ${score === bestScore && score > 0 ? '<div style="color: #FFD700; font-size: 20px; margin-top: 10px; font-weight: bold;">✨ NEW HIGH SCORE! ✨</div>' : ''}
        </div>

        ${canRevive ? `
          <div style="background: rgba(76, 175, 80, 0.2); border: 3px solid #4caf50; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
            <div style="color: #4caf50; font-size: 18px; font-weight: bold; margin-bottom: 10px;">💚 REVIVE AVAILABLE</div>
            <div style="color: #fff; font-size: 14px; margin-bottom: 10px;">Continue with 3 lives!</div>
            <div style="color: #feca57; font-size: 12px;">${revivesLeft} revive${revivesLeft > 1 ? 's' : ''} remaining</div>
          </div>
          <button id="revive-btn" style="width: 100%; padding: 15px; font-size: 20px; background: linear-gradient(135deg, #4caf50, #45a049); color: #fff; border: 3px solid #6fbf73; border-radius: 12px; cursor: pointer; font-weight: bold; margin-bottom: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
            💚 USE REVIVE (${revivesLeft})
          </button>
        ` : hasReviveSystem ? `
          <div style="background: rgba(255, 107, 107, 0.2); border: 2px solid #ff6b6b; border-radius: 12px; padding: 12px; margin-bottom: 15px;">
            <div style="color: #ff6b6b; font-size: 14px; margin-bottom: 8px;">❌ No revives remaining</div>
            <div style="color: #feca57; font-size: 12px;">Buy revives with Playbux!</div>
          </div>
          <button id="buy-revive-btn" style="width: 100%; padding: 12px; font-size: 16px; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; border: 2px solid #fbbf24; border-radius: 10px; cursor: pointer; font-weight: bold; margin-bottom: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
            💰 BUY REVIVES
          </button>
        ` : ''}
        
        <button id="restart-btn" style="width: 100%; padding: 15px; font-size: 18px; background: linear-gradient(135deg, #ff6b00, #ff8e53); color: #fff; border: 3px solid #feca57; border-radius: 12px; cursor: pointer; font-weight: bold; margin-bottom: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
          🔄 RESTART
        </button>
        
        <button id="menu-btn" style="width: 100%; padding: 12px; font-size: 16px; background: transparent; color: #feca57; border: 2px solid #feca57; border-radius: 10px; cursor: pointer; font-weight: bold;">
          🏠 BACK TO HUB
        </button>
      </div>

      <!-- Buy Revives Modal -->
      <div id="buy-revives-modal" class="fs-modal-hidden" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.9); display: flex; align-items: center; justify-content: center; z-index: 10001;">
        <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 30px; border-radius: 20px; max-width: 450px; width: 90%; border: 3px solid #fbbf24; box-shadow: 0 0 40px rgba(251, 191, 36, 0.6);">
          ${isTacoTuesday ? `
            <div style="background: linear-gradient(135deg, #ff6b00, #ff8e53); padding: 12px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #feca57; animation: pulse 2s infinite;">
              <div style="font-size: 32px; margin-bottom: 5px;">🌮 TACO TUESDAY! 🌮</div>
              <div style="color: #fff; font-size: 18px; font-weight: bold;">30% OFF ALL REVIVES!</div>
              <div style="color: #feca57; font-size: 12px; margin-top: 5px;">Today only!</div>
            </div>
          ` : ''}
          
          <h2 style="color: #fbbf24; margin: 0 0 10px 0; font-size: 28px; text-align: center;">💰 BUY REVIVES</h2>
          <div style="color: #94a3b8; text-align: center; font-size: 14px; margin-bottom: 20px;">
            Your Balance: <span style="color: #fbbf24; font-weight: bold;">${currentPB} PB</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
            <!-- 1 Revive Option -->
            <button id="buy-1-revive" style="background: ${currentPB >= (isTacoTuesday ? 70 : 100) ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'linear-gradient(135deg, #64748b, #475569)'}; color: #fff; padding: 15px; border-radius: 12px; border: 3px solid ${currentPB >= (isTacoTuesday ? 70 : 100) ? '#86efac' : '#94a3b8'}; cursor: ${currentPB >= (isTacoTuesday ? 70 : 100) ? 'pointer' : 'not-allowed'}; font-weight: bold; position: relative; overflow: hidden;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="text-align: left;">
                  <div style="font-size: 20px;">💚 1 Revive</div>
                  ${isTacoTuesday ? `
                    <div style="font-size: 12px; color: #feca57; margin-top: 3px;">
                      <span style="text-decoration: line-through; opacity: 0.7;">100 PB</span>
                      <span style="margin-left: 8px; font-weight: bold;">70 PB</span>
                    </div>
                  ` : `
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 3px;">100 Playbux</div>
                  `}
                </div>
                <div style="font-size: 24px;">${currentPB >= (isTacoTuesday ? 70 : 100) ? '✓' : '🔒'}</div>
              </div>
              ${isTacoTuesday ? '<div style="position: absolute; top: -5px; right: -5px; background: #ff6b00; color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; transform: rotate(15deg); box-shadow: 0 2px 8px rgba(0,0,0,0.3);">-30%</div>' : ''}
            </button>

            <!-- 10 Revives Option -->
            <button id="buy-10-revives" style="background: ${currentPB >= (isTacoTuesday ? 700 : 1000) ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'linear-gradient(135deg, #64748b, #475569)'}; color: #fff; padding: 15px; border-radius: 12px; border: 3px solid ${currentPB >= (isTacoTuesday ? 700 : 1000) ? '#a5b4fc' : '#94a3b8'}; cursor: ${currentPB >= (isTacoTuesday ? 700 : 1000) ? 'pointer' : 'not-allowed'}; font-weight: bold; position: relative; overflow: hidden;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="text-align: left;">
                  <div style="font-size: 20px;">💎 10 Revives</div>
                  ${isTacoTuesday ? `
                    <div style="font-size: 12px; color: #feca57; margin-top: 3px;">
                      <span style="text-decoration: line-through; opacity: 0.7;">1000 PB</span>
                      <span style="margin-left: 8px; font-weight: bold;">700 PB</span>
                    </div>
                  ` : `
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 3px;">1000 Playbux</div>
                  `}
                </div>
                <div style="font-size: 24px;">${currentPB >= (isTacoTuesday ? 700 : 1000) ? '✓' : '🔒'}</div>
              </div>
              ${isTacoTuesday ? '<div style="position: absolute; top: -5px; right: -5px; background: #ff6b00; color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; transform: rotate(15deg); box-shadow: 0 2px 8px rgba(0,0,0,0.3);">-30%</div>' : ''}
              <div style="position: absolute; bottom: 5px; right: 10px; background: rgba(251, 191, 36, 0.2); color: #fbbf24; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold;">BEST VALUE</div>
            </button>
          </div>

          <button id="cancel-buy" style="width: 100%; padding: 12px; font-size: 16px; background: transparent; color: #94a3b8; border: 2px solid #475569; border-radius: 10px; cursor: pointer; font-weight: bold;">
            ✖ CANCEL
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(gameOverScreen);

    // Scroll to center the game over panel
    setTimeout(() => {
      const gameOverPanel = gameOverScreen.querySelector('div');
      if (gameOverPanel) {
        gameOverPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    const buyRevivesModal = gameOverScreen.querySelector('#buy-revives-modal');
    const buy1Btn = gameOverScreen.querySelector('#buy-1-revive');
    const buy10Btn = gameOverScreen.querySelector('#buy-10-revives');
    const cancelBuyBtn = gameOverScreen.querySelector('#cancel-buy');

    // Revive button handler
    if (canRevive) {
      gameOverScreen.querySelector('#revive-btn').addEventListener('click', () => {
        if (window.playBoxUseRevive && window.playBoxUseRevive()) {
          sound.playClick();
          lives = 3;
          gameRunning = true;
          gameOverScreen.remove();
          // Update revive display if it exists
          if (window.updateReviveDisplay) window.updateReviveDisplay();
          // Scroll DOWN to game
          setTimeout(() => {
            canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      });
    }

    // Buy revive button handler - opens modal
    const buyReviveBtn = gameOverScreen.querySelector('#buy-revive-btn');
    if (buyReviveBtn) {
      buyReviveBtn.addEventListener('click', () => {
        sound.playClick();
        buyRevivesModal.classList.remove('fs-modal-hidden');
      });
    }

    // Buy 1 revive
    if (buy1Btn) {
      buy1Btn.addEventListener('click', () => {
        const cost = isTacoTuesday ? 70 : 100;
        const pb = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;
        
        if (pb >= cost) {
          if (window.playBoxSpendPlaybux && window.playBoxSpendPlaybux(cost)) {
            sound.playClick();
            // Add 1 revive
            const currentRevives = window.playBoxGetRevives ? window.playBoxGetRevives() : 0;
            localStorage.setItem('gamehub:revives', String(currentRevives + 1));
            // Update displays
            if (window.updateReviveDisplay) window.updateReviveDisplay();
            if (window.updatePlaybuxDisplay) window.updatePlaybuxDisplay();
            // Close modal and refresh game over screen
            gameOverScreen.remove();
            endGame();
          }
        } else {
          sound.playClick();
          alert(`Not enough Playbux! You need ${cost} PB but only have ${pb} PB.`);
        }
      });
    }

    // Buy 10 revives
    if (buy10Btn) {
      buy10Btn.addEventListener('click', () => {
        const cost = isTacoTuesday ? 700 : 1000;
        const pb = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;
        
        if (pb >= cost) {
          if (window.playBoxSpendPlaybux && window.playBoxSpendPlaybux(cost)) {
            sound.playClick();
            // Add 10 revives
            const currentRevives = window.playBoxGetRevives ? window.playBoxGetRevives() : 0;
            localStorage.setItem('gamehub:revives', String(currentRevives + 10));
            // Update displays
            if (window.updateReviveDisplay) window.updateReviveDisplay();
            if (window.updatePlaybuxDisplay) window.updatePlaybuxDisplay();
            // Close modal and refresh game over screen
            gameOverScreen.remove();
            endGame();
          }
        } else {
          sound.playClick();
          alert(`Not enough Playbux! You need ${cost} PB but only have ${pb} PB.`);
        }
      });
    }

    // Cancel button
    if (cancelBuyBtn) {
      cancelBuyBtn.addEventListener('click', () => {
        sound.playClick();
        buyRevivesModal.classList.add('fs-modal-hidden');
      });
    }

    // Restart button handler
    gameOverScreen.querySelector('#restart-btn').addEventListener('click', () => {
      sound.playClick();
      gameOverScreen.remove();
      resetGame();
      // Scroll down to game
      setTimeout(() => {
        canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });

    // Menu button handler
    gameOverScreen.querySelector('#menu-btn').addEventListener('click', () => {
      sound.playClick();
      gameOverScreen.remove();
      location.hash = '#/';
    });
  }

  // Mouse handlers
  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (isSlicing && gameRunning && gameStarted) {
      sliceTrail.push({
        x: mouseX,
        y: mouseY,
        life: 1,
      });
      
      // Keep trail length based on settings
      const maxTrailLength = trailConfigs[settings.trailLength];
      if (sliceTrail.length > maxTrailLength) {
        sliceTrail.shift();
      }
    }

    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }

  function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check settings button click
    const settingsX = canvas.width - 80;
    const settingsY = 60;
    const settingsSize = 40;
    
    if (x >= settingsX - 5 && x <= settingsX + settingsSize + 5 &&
        y >= settingsY - 5 && y <= settingsY + settingsSize + 5) {
      openSettings();
      return;
    }
    
    if (!gameStarted || !gameRunning) {
      resetGame();
      return;
    }
    
    isSlicing = true;
    sliceTrail = [];
  }

  function handleMouseUp() {
    isSlicing = false;
    sliceTrail = [];
  }

  // Settings modal functions
  function openSettings() {
    const wasPaused = !gameRunning;
    gameRunning = false; // Pause game
    
    const modal = document.createElement('div');
    modal.id = 'fruit-samurai-settings';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;
    
    modal.innerHTML = `
      <div style="background: linear-gradient(135deg, #ff6b00, #feca57); padding: 40px; border-radius: 20px; max-width: 600px; width: 90%; box-shadow: 0 0 50px rgba(255, 107, 0, 0.5);">
        <h2 style="color: #fff; text-align: center; margin: 0 0 30px 0; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">⚙️ SETTINGS</h2>
        
        <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 24px;">🎯 DIFFICULTY</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <button class="difficulty-btn" data-difficulty="easy" style="padding: 15px; font-size: 18px; border: 3px solid #4caf50; background: ${settings.difficulty === 'easy' ? '#4caf50' : 'rgba(76, 175, 80, 0.3)'}; color: #fff; border-radius: 10px; cursor: pointer; font-weight: bold;">
              😊 EASY<br><small style="font-size: 12px;">5 Lives, Slower</small>
            </button>
            <button class="difficulty-btn" data-difficulty="medium" style="padding: 15px; font-size: 18px; border: 3px solid #feca57; background: ${settings.difficulty === 'medium' ? '#feca57' : 'rgba(254, 202, 87, 0.3)'}; color: #fff; border-radius: 10px; cursor: pointer; font-weight: bold;">
              😐 MEDIUM<br><small style="font-size: 12px;">3 Lives, Normal</small>
            </button>
            <button class="difficulty-btn" data-difficulty="hard" style="padding: 15px; font-size: 18px; border: 3px solid #ff6b6b; background: ${settings.difficulty === 'hard' ? '#ff6b6b' : 'rgba(255, 107, 107, 0.3)'}; color: #fff; border-radius: 10px; cursor: pointer; font-weight: bold;">
              😰 HARD<br><small style="font-size: 12px;">2 Lives, Faster</small>
            </button>
            <button class="difficulty-btn" data-difficulty="chaos" style="padding: 15px; font-size: 18px; border: 3px solid #9b59b6; background: ${settings.difficulty === 'chaos' ? '#9b59b6' : 'rgba(155, 89, 182, 0.3)'}; color: #fff; border-radius: 10px; cursor: pointer; font-weight: bold;">
              😱 CHAOS<br><small style="font-size: 12px;">1 Life, Insane!</small>
            </button>
          </div>
        </div>
        
        <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 24px;">🍉 FRUIT SIZE</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <button class="size-btn" data-size="small" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.fruitSize === 'small' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">SMALL</button>
            <button class="size-btn" data-size="normal" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.fruitSize === 'normal' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">NORMAL</button>
            <button class="size-btn" data-size="big" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.fruitSize === 'big' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">BIG</button>
            <button class="size-btn" data-size="huge" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.fruitSize === 'huge' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">HUGE</button>
          </div>
        </div>
        
        <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 24px;">✨ PARTICLES</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <button class="particles-btn" data-particles="minimal" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.particleEffects === 'minimal' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">MINIMAL</button>
            <button class="particles-btn" data-particles="normal" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.particleEffects === 'normal' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">NORMAL</button>
            <button class="particles-btn" data-particles="extreme" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.particleEffects === 'extreme' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">EXTREME</button>
          </div>
        </div>
        
        <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 24px;">🌟 TRAIL LENGTH</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <button class="trail-btn" data-trail="short" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.trailLength === 'short' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">SHORT</button>
            <button class="trail-btn" data-trail="normal" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.trailLength === 'normal' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">NORMAL</button>
            <button class="trail-btn" data-trail="long" style="padding: 10px; font-size: 14px; border: 2px solid #fff; background: ${settings.trailLength === 'long' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; color: #fff; border-radius: 8px; cursor: pointer;">LONG</button>
          </div>
        </div>
        
        <button id="close-settings" style="width: 100%; padding: 15px; font-size: 20px; background: linear-gradient(135deg, #4caf50, #45a049); color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
          ✅ CLOSE & APPLY
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for settings buttons
    modal.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.difficulty = btn.dataset.difficulty;
        saveSettings();
        closeSettings(modal, wasPaused);
        resetGame(); // Reset game with new difficulty
      });
    });
    
    modal.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.fruitSize = btn.dataset.size;
        saveSettings();
        updateSettingsUI(modal);
      });
    });
    
    modal.querySelectorAll('.particles-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.particleEffects = btn.dataset.particles;
        saveSettings();
        updateSettingsUI(modal);
      });
    });
    
    modal.querySelectorAll('.trail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.trailLength = btn.dataset.trail;
        saveSettings();
        updateSettingsUI(modal);
      });
    });
    
    modal.querySelector('#close-settings').addEventListener('click', () => {
      closeSettings(modal, wasPaused);
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeSettings(modal, wasPaused);
      }
    });
  }
  
  function updateSettingsUI(modal) {
    // Update difficulty buttons
    modal.querySelectorAll('.difficulty-btn').forEach(btn => {
      const isActive = btn.dataset.difficulty === settings.difficulty;
      if (btn.dataset.difficulty === 'easy') {
        btn.style.background = isActive ? '#4caf50' : 'rgba(76, 175, 80, 0.3)';
      } else if (btn.dataset.difficulty === 'medium') {
        btn.style.background = isActive ? '#feca57' : 'rgba(254, 202, 87, 0.3)';
      } else if (btn.dataset.difficulty === 'hard') {
        btn.style.background = isActive ? '#ff6b6b' : 'rgba(255, 107, 107, 0.3)';
      } else if (btn.dataset.difficulty === 'chaos') {
        btn.style.background = isActive ? '#9b59b6' : 'rgba(155, 89, 182, 0.3)';
      }
    });
    
    // Update size buttons
    modal.querySelectorAll('.size-btn').forEach(btn => {
      btn.style.background = btn.dataset.size === settings.fruitSize ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)';
    });
    
    // Update particle buttons
    modal.querySelectorAll('.particles-btn').forEach(btn => {
      btn.style.background = btn.dataset.particles === settings.particleEffects ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)';
    });
    
    // Update trail buttons
    modal.querySelectorAll('.trail-btn').forEach(btn => {
      btn.style.background = btn.dataset.trail === settings.trailLength ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)';
    });
  }
  
  function closeSettings(modal, wasPaused) {
    sound.playClick();
    modal.remove();
    if (!wasPaused && gameStarted) {
      gameRunning = true; // Resume game
    }
  }

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);

  // Reset game
  function resetGame() {
    if (!gameStarted) {
      gameStarted = true;
    }
    
    const config = getDifficultyConfig();
    gameRunning = true;
    score = 0;
    lives = config.lives;
    combo = 0;
    maxCombo = 0;
    fruits = [];
    bombs = [];
    particles = [];
    sliceTrail = [];
    spawnTimer = 0;
    difficultyTimer = 0;
    spawnRate = config.spawnRate;
  }

  // Game loop
  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Tutorial System for First-Time Players
  const TUTORIAL_KEY = 'fruit-samurai-tutorial-completed';
  const hasCompletedTutorial = localStorage.getItem(TUTORIAL_KEY) === 'true';
  
  let tutorialActive = false;
  let tutorialOverlay = null;

  function showTutorial() {
    tutorialActive = true;
    
    // Create tutorial overlay
    tutorialOverlay = document.createElement('div');
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
    tutorialBox.style.cssText = `
      max-width: 600px;
      background: linear-gradient(135deg, #1e293b, #334155);
      padding: 2.5rem;
      border-radius: 20px;
      border: 3px solid #ff6b6b;
      box-shadow: 0 0 50px rgba(255, 107, 107, 0.5);
      text-align: center;
    `;

    const tutorialSteps = [
      {
        emoji: '🎓',
        title: 'Welcome to Fruit Samurai!',
        message: 'Learn how to slice fruit like a ninja warrior! Would you like a quick tutorial?',
        isWelcome: true
      },
      {
        emoji: '🖱️',
        title: 'Mouse Controls',
        message: '<strong>Click and drag</strong> your mouse to create slicing trails!<br><br>Move your mouse across fruits to slice them.'
      },
      {
        emoji: '🍎',
        title: 'Slice Fruits',
        message: 'Swipe through flying fruits to slice them!<br><br>Each fruit gives you <strong>points</strong> based on its type.'
      },
      {
        emoji: '🔥',
        title: 'Build Combos',
        message: 'Slice <strong>multiple fruits</strong> in one swipe for combo bonuses!<br><br>Higher combos = More points!'
      },
      {
        emoji: '💣',
        title: 'Avoid Bombs!',
        message: 'NEVER slice the <strong>bombs (💣)</strong>!<br><br>Hitting a bomb ends the game instantly!'
      },
      {
        emoji: '❤️',
        title: 'Lives System',
        message: 'You start with <strong>3-5 lives</strong> (depending on difficulty).<br><br>Miss a fruit = Lose a life!'
      },
      {
        emoji: '⚙️',
        title: 'Settings',
        message: 'Click the <strong>⚙️ gear icon</strong> during gameplay to adjust:<br><br>• Difficulty (Easy/Medium/Hard/Chaos)<br>• Fruit Size<br>• Particle Effects<br>• Trail Length'
      },
      {
        emoji: '💚',
        title: 'Revive System',
        message: 'If you die, use <strong>revives</strong> to continue!<br><br>Revives can be purchased with Playbux.'
      },
      {
        emoji: '🗡️',
        title: 'Ready to Slice!',
        message: 'You\'re ready to become a Fruit Samurai!<br><br>Remember: Slice fruit, avoid bombs, get combos!'
      }
    ];

    let currentStep = 0;

    function showStep(stepIndex) {
      if (stepIndex >= tutorialSteps.length) {
        completeTutorial();
        return;
      }

      const step = tutorialSteps[stepIndex];
      
      if (step.isWelcome) {
        tutorialBox.innerHTML = `
          <div style="font-size: 3rem; margin-bottom: 1rem;">${step.emoji}</div>
          <h2 style="color: #ff6b6b; font-size: 2rem; margin-bottom: 1rem;">${step.title}</h2>
          <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
            ${step.message}
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="tutorial-start" style="
              padding: 1rem 2rem;
              font-size: 1.1rem;
              background: linear-gradient(135deg, #ff6b6b, #ff8e53);
              border: none;
              border-radius: 12px;
              color: white;
              cursor: pointer;
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
            ">📚 Start Tutorial</button>
            <button id="tutorial-skip" style="
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

        tutorialBox.querySelector('#tutorial-start').addEventListener('click', () => {
          sound.playClick();
          currentStep++;
          showStep(currentStep);
        });

        tutorialBox.querySelector('#tutorial-skip').addEventListener('click', () => {
          sound.playClick();
          completeTutorial();
        });
      } else {
        tutorialBox.innerHTML = `
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">${step.emoji}</div>
          <h2 style="color: #ff6b6b; font-size: 1.8rem; margin-bottom: 1rem;">${step.title}</h2>
          <p style="color: #cbd5e1; font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
            ${step.message}
          </p>
          <div style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;">
            Step ${stepIndex + 1} of ${tutorialSteps.length}
          </div>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            ${stepIndex > 0 ? `
              <button id="tutorial-prev" style="
                padding: 0.8rem 1.5rem;
                font-size: 1rem;
                background: rgba(100, 116, 139, 0.3);
                border: 2px solid #64748b;
                border-radius: 10px;
                color: #cbd5e1;
                cursor: pointer;
              ">⬅️ Back</button>
            ` : ''}
            <button id="tutorial-next" style="
              padding: 0.8rem 1.5rem;
              font-size: 1rem;
              background: linear-gradient(135deg, #ff6b6b, #ff8e53);
              border: none;
              border-radius: 10px;
              color: white;
              cursor: pointer;
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
            ">${stepIndex === tutorialSteps.length - 1 ? '✅ Finish' : 'Next ➡️'}</button>
          </div>
        `;

        const prevBtn = tutorialBox.querySelector('#tutorial-prev');
        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            sound.playClick();
            currentStep--;
            showStep(currentStep);
          });
        }

        tutorialBox.querySelector('#tutorial-next').addEventListener('click', () => {
          sound.playClick();
          currentStep++;
          showStep(currentStep);
        });
      }
    }

    function completeTutorial() {
      localStorage.setItem(TUTORIAL_KEY, 'true');
      tutorialActive = false;
      if (tutorialOverlay && tutorialOverlay.parentNode) {
        tutorialOverlay.remove();
      }
    }

    tutorialOverlay.appendChild(tutorialBox);
    document.body.appendChild(tutorialOverlay);
    
    showStep(0);

    // Scroll to tutorial
    setTimeout(() => {
      tutorialBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  // Show tutorial automatically for first-time players
  if (!hasCompletedTutorial) {
    setTimeout(() => {
      showTutorial();
    }, 500);
  }

  // Create Snake-style start screen
  const startScreen = document.createElement('div');
  startScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #feca57 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;

  const startPanel = document.createElement('div');
  startPanel.style.cssText = `
    background: rgba(0, 0, 0, 0.85);
    border: 4px solid #ff6b6b;
    border-radius: 20px;
    padding: 3rem;
    max-width: 600px;
    text-align: center;
    box-shadow: 0 0 50px rgba(255, 107, 107, 0.8), inset 0 0 30px rgba(255, 107, 107, 0.2);
  `;

  const startTitle = document.createElement('h1');
  startTitle.textContent = '🗡️ FRUIT SAMURAI 🍉';
  startTitle.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 3rem;
    background: linear-gradient(45deg, #ff6b6b, #feca57, #ff6b6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 20px rgba(255, 107, 107, 0.8));
    font-weight: bold;
  `;

  const startDesc = document.createElement('p');
  startDesc.textContent = 'Slice fruit with your mouse like a ninja warrior! Get combos for big scores, but watch out for bombs!';
  startDesc.style.cssText = `
    margin: 0 0 1.5rem 0;
    font-size: 1.2rem;
    color: #feca57;
    line-height: 1.6;
  `;

  const startHighScore = document.createElement('p');
  startHighScore.textContent = bestScore > 0 ? `🏆 Best Score: ${bestScore}` : '🏆 No high score yet';
  startHighScore.style.cssText = `
    margin: 0 0 1.5rem 0;
    font-size: 1.3rem;
    color: #ff8e53;
    font-weight: bold;
  `;

  const startInstructions = document.createElement('div');
  startInstructions.innerHTML = `
    <div style="background: rgba(255, 107, 107, 0.15); border: 3px solid #ff6b6b; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; text-align: left;">
      <div style="color: #feca57; font-size: 1.2rem; margin-bottom: 1rem; font-weight: bold;">⚔️ HOW TO PLAY:</div>
      <div style="color: #fff; line-height: 2.2; font-size: 1rem;">
        🖱️ Move mouse to control sword<br>
        ✂️ Click and drag to slice fruit<br>
        🎯 Slice multiple fruits for combos<br>
        💣 <span style="color: #ff6b6b; font-weight: bold;">AVOID BOMBS!</span> Instant game over!<br>
        ❤️ Miss 3 fruits = Game over
      </div>
    </div>
  `;

  const startButton = document.createElement('button');
  startButton.textContent = '⚔️ START SLICING';
  startButton.style.cssText = `
    padding: 1.2rem 3rem;
    font-size: 1.4rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 4px solid #ff6b6b;
    border-radius: 15px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
    color: white;
    font-weight: bold;
    transition: all 0.3s;
    box-shadow: 0 0 25px rgba(255, 107, 107, 0.6);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  `;

  const hubButton = document.createElement('button');
  hubButton.textContent = '🏠 BACK TO HUB';
  hubButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 3px solid #feca57;
    border-radius: 12px;
    background: transparent;
    color: #feca57;
    font-weight: bold;
    transition: all 0.3s;
  `;

  const settingsButton = document.createElement('button');
  settingsButton.textContent = '⚙️ SETTINGS';
  settingsButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 3px solid #9b59b6;
    border-radius: 12px;
    background: transparent;
    color: #9b59b6;
    font-weight: bold;
    transition: all 0.3s;
  `;

  const tutorialButton = document.createElement('button');
  tutorialButton.textContent = '🎓 TUTORIAL';
  tutorialButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 3px solid #4ade80;
    border-radius: 12px;
    background: transparent;
    color: #4ade80;
    font-weight: bold;
    transition: all 0.3s;
  `;

  startButton.addEventListener('mouseenter', () => {
    startButton.style.transform = 'scale(1.05) rotate(-2deg)';
    startButton.style.boxShadow = '0 0 40px rgba(255, 107, 107, 1)';
  });
  startButton.addEventListener('mouseleave', () => {
    startButton.style.transform = 'scale(1) rotate(0deg)';
    startButton.style.boxShadow = '0 0 25px rgba(255, 107, 107, 0.6)';
  });

  hubButton.addEventListener('mouseenter', () => {
    hubButton.style.background = 'rgba(254, 202, 87, 0.2)';
    hubButton.style.borderColor = '#ff8e53';
    hubButton.style.color = '#ff8e53';
    hubButton.style.transform = 'scale(1.05)';
  });
  hubButton.addEventListener('mouseleave', () => {
    hubButton.style.background = 'transparent';
    hubButton.style.borderColor = '#feca57';
    hubButton.style.color = '#feca57';
    hubButton.style.transform = 'scale(1)';
  });

  settingsButton.addEventListener('mouseenter', () => {
    settingsButton.style.background = 'rgba(155, 89, 182, 0.2)';
    settingsButton.style.transform = 'scale(1.05)';
  });
  settingsButton.addEventListener('mouseleave', () => {
    settingsButton.style.background = 'transparent';
    settingsButton.style.transform = 'scale(1)';
  });

  tutorialButton.addEventListener('mouseenter', () => {
    tutorialButton.style.background = 'rgba(74, 222, 128, 0.2)';
    tutorialButton.style.transform = 'scale(1.05)';
  });
  tutorialButton.addEventListener('mouseleave', () => {
    tutorialButton.style.background = 'transparent';
    tutorialButton.style.transform = 'scale(1)';
  });

  startButton.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    resetGame();
    setTimeout(() => {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  hubButton.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    location.hash = '#/';
  });

  settingsButton.addEventListener('click', () => {
    sound.playClick();
    openSettings();
  });

  tutorialButton.addEventListener('click', () => {
    sound.playClick();
    showTutorial();
  });

  startPanel.append(startTitle, startDesc, startHighScore, startInstructions, startButton, tutorialButton, settingsButton, hubButton);
  startScreen.appendChild(startPanel);
  container.appendChild(startScreen);

  // Scroll indicator
  const scrollIndicator = document.createElement('div');
  scrollIndicator.innerHTML = '⬇ Scroll to play ⬇';
  scrollIndicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 107, 107, 0.95);
    color: white;
    padding: 0.8rem 1.5rem;
    border-radius: 25px;
    font-weight: bold;
    z-index: 999;
    animation: bounce 2s infinite;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  `;
  container.appendChild(scrollIndicator);

  // Hide scroll indicator when start screen is removed
  const observerStart = new MutationObserver(() => {
    if (!document.body.contains(startScreen)) {
      scrollIndicator.remove();
      observerStart.disconnect();
    }
  });
  observerStart.observe(container, { childList: true });

  gameLoop();

  // Cleanup
  return () => {
    gameRunning = false;
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseleave', handleMouseUp);
    if (startScreen && startScreen.parentNode) {
      startScreen.remove();
    }
    if (scrollIndicator && scrollIndicator.parentNode) {
      scrollIndicator.remove();
    }
    if (tutorialOverlay && tutorialOverlay.parentNode) {
      tutorialOverlay.remove();
    }
    const gameOverScreen = document.getElementById('fruit-samurai-game-over');
    if (gameOverScreen) {
      gameOverScreen.remove();
    }
    const settingsModal = document.getElementById('fruit-samurai-settings');
    if (settingsModal) {
      settingsModal.remove();
    }
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
}
