// games/levelDevil.js
// Challenging platformer with 50 tricky levels featuring devilish traps and obstacles

import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(root) {
  const TUTORIAL_KEY = 'level-devil-tutorial-completed';
  const MAX_LEVELS = 50;

  const wrap = document.createElement('div');
  wrap.className = 'level-devil';

  // --- Toolbar ---
  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const startBtn = makeButton('Start');
  startBtn.classList.add('button', 'primary');
  const pauseBtn = makeButton('Pause');
  pauseBtn.classList.add('button');
  const resetBtn = makeButton('Reset Level');
  resetBtn.classList.add('button');
  const tutorialBtn = makeButton('🎓 Tutorial');
  tutorialBtn.classList.add('button');
  tutorialBtn.style.background = '#10b981';
  tutorialBtn.style.color = 'white';

  const levelBadge = makeBadge('Level: 1 / 50');
  const deathsBadge = makeBadge('Deaths: 0');
  const timeBadge = makeBadge('Time: 0s');
  const bestBadge = makeBadge('Best Level: 1');

  toolbar.append(
    startBtn,
    pauseBtn,
    resetBtn,
    tutorialBtn,
    levelBadge,
    deathsBadge,
    timeBadge,
    bestBadge,
  );

  // --- Canvas ---
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const WIDTH = 800;
  const HEIGHT = 500;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvasWrap.appendChild(canvas);

  // Per-game fullscreen button
  if (window.playBoxCreateFullscreenButton) {
    const fsBtn = window.playBoxCreateFullscreenButton(canvasWrap);
    if (fsBtn) toolbar.appendChild(fsBtn);
  }

  const rules = createRules([
    'Use Arrow keys or WASD to move and jump.',
    'Avoid spikes, lava, and moving obstacles.',
    'Reach the door to complete each level.',
    'Levels get progressively harder - watch out for tricks!',
    'Complete all 50 levels to beat the game.'
  ]);

  wrap.append(toolbar, canvasWrap, rules);
  
  // Beautiful start screen overlay
  const startScreen = document.createElement('div');
  startScreen.className = 'level-devil-start-screen';
  startScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 25%, #991b1b 50%, #7f1d1d 75%, #450a0a 100%);
    background-size: 400% 400%;
    animation: gradientShift 8s ease infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  startScreen.innerHTML = `
    <style>
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes flicker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .devil-emoji {
        font-size: 6rem;
        animation: float 3s ease-in-out infinite;
        filter: drop-shadow(0 0 30px rgba(239, 68, 68, 0.8));
      }
      .level-title {
        font-size: 4rem;
        font-weight: 900;
        background: linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444, #dc2626);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 40px rgba(239, 68, 68, 0.5);
        margin: 1rem 0;
        animation: pulse 2s ease-in-out infinite;
      }
      .level-subtitle {
        color: #fbbf24;
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 2rem;
        animation: flicker 3s ease-in-out infinite;
      }
      .level-features {
        background: rgba(0, 0, 0, 0.6);
        border: 2px solid #ef4444;
        border-radius: 16px;
        padding: 2rem;
        margin: 2rem 0;
        max-width: 600px;
        box-shadow: 0 0 40px rgba(239, 68, 68, 0.4);
        animation: slideUp 0.6s ease-out;
      }
      .level-feature {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1rem 0;
        color: #fef3c7;
        font-size: 1.1rem;
      }
      .level-feature-icon {
        font-size: 2rem;
        filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.6));
      }
      .level-stats {
        display: flex;
        gap: 2rem;
        justify-content: center;
        margin: 2rem 0;
      }
      .level-stat {
        background: rgba(239, 68, 68, 0.2);
        border: 2px solid #fbbf24;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        text-align: center;
        animation: slideUp 0.8s ease-out;
      }
      .level-stat-number {
        font-size: 2.5rem;
        font-weight: bold;
        color: #fbbf24;
        text-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
      }
      .level-stat-label {
        color: #fef3c7;
        font-size: 0.9rem;
        margin-top: 0.5rem;
      }
      .level-start-btn {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        border: 3px solid #fbbf24;
        padding: 1.5rem 4rem;
        font-size: 1.8rem;
        font-weight: bold;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 10px 30px rgba(239, 68, 68, 0.5);
        animation: pulse 2s ease-in-out infinite;
      }
      .level-start-btn:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(239, 68, 68, 0.7);
        border-color: #fde047;
      }
      .level-warning {
        color: #fca5a5;
        font-size: 0.95rem;
        margin-top: 1rem;
        font-style: italic;
      }
    </style>
    <div style="text-align: center; max-width: 800px; padding: 2rem;">
      <div class="devil-emoji">😈🔥</div>
      <h1 class="level-title">LEVEL DEVIL</h1>
      <p class="level-subtitle">50 Levels of Pure Chaos</p>
      
      <div class="level-stats">
        <div class="level-stat">
          <div class="level-stat-number">50</div>
          <div class="level-stat-label">Levels</div>
        </div>
        <div class="level-stat">
          <div class="level-stat-number">∞</div>
          <div class="level-stat-label">Deaths</div>
        </div>
        <div class="level-stat">
          <div class="level-stat-number">😈</div>
          <div class="level-stat-label">Difficulty</div>
        </div>
      </div>

      <div class="level-features">
        <div class="level-feature">
          <div class="level-feature-icon">🔪</div>
          <div>Deadly spikes and traps everywhere</div>
        </div>
        <div class="level-feature">
          <div class="level-feature-icon">🌀</div>
          <div>Mind-bending portals from level 5+</div>
        </div>
        <div class="level-feature">
          <div class="level-feature-icon">⚡</div>
          <div>Fast-moving obstacles to dodge</div>
        </div>
        <div class="level-feature">
          <div class="level-feature-icon">🎯</div>
          <div>Pixel-perfect platforming required</div>
        </div>
      </div>

      <button class="level-start-btn" id="level-devil-start">
        START CHALLENGE 🔥
      </button>
      <p class="level-warning">⚠️ Warning: Extremely challenging!</p>
    </div>
  `;

  document.body.appendChild(startScreen);

  // Start button handler
  const startScreenBtn = startScreen.querySelector('#level-devil-start');
  startScreenBtn.addEventListener('click', () => {
    sound.playClick();
    startScreen.style.animation = 'fadeOut 0.5s ease-out';
    setTimeout(() => {
      startScreen.remove();
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  });

  root.appendChild(wrap);

  // --- Game State ---
  let gameRunning = false;
  let gamePaused = false;
  let currentLevel = 1;
  let deaths = 0;
  let startTime = 0;
  let elapsedTime = 0;
  let bestLevel = parseInt(localStorage.getItem('level-devil-best') || '1');

  // Player
  const player = {
    x: 50,
    y: 50,
    width: 30,
    height: 30,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpPower: 12,
    grounded: false,
    color: '#ef4444',
    anim: 0, // Animation timer
    moving: false // Is player moving
  };

  // Input
  const keys = {};
  let jumpBufferTime = 0; // Coyote time buffer for more responsive jumps
  
  window.addEventListener('keydown', (e) => {
    // Handle jump immediately on keydown with buffer
    if ((e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === ' ') && gameRunning && !gamePaused) {
      if (player.grounded || jumpBufferTime > 0) {
        player.vy = -player.jumpPower;
        player.grounded = false;
        jumpBufferTime = 0;
        sound.playMove();
      }
      e.preventDefault(); // Prevent space from scrolling
    }
    keys[e.key.toLowerCase()] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // Level data structure: platforms, spikes, moving obstacles, door, portals
  let currentLevelData = null;

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

  function generateLevel(levelNum) {
    // Generate levels with increasing difficulty
    const level = {
      platforms: [],
      spikes: [],
      movingObstacles: [],
      portals: [], // New: portal pairs
      springs: [], // New: jump springs
      walls: [], // New: vertical walls for Set 4
      door: { x: WIDTH - 80, y: HEIGHT - 120, width: 40, height: 60 }
    };

    // Determine which set we're in (1-5 for levels 1-50)
    const setNum = Math.ceil(levelNum / 10);
    const isLastOfSet = levelNum % 10 === 0;

    // Ground platform
    level.platforms.push({ x: 0, y: HEIGHT - 40, width: WIDTH, height: 40 });

    // Set 1 (Levels 1-10): Basic platforming + Spikes
    if (setNum === 1) {
      const numPlatforms = 5 + Math.floor(levelNum / 2);
      for (let i = 0; i < numPlatforms; i++) {
        const x = 80 + (i * 90);
        const y = HEIGHT - 100 - (Math.random() * 120);
        level.platforms.push({ x, y, width: 100, height: 15 });
      }
      // Add spikes - fewer and more spaced out
      for (let i = 0; i < Math.floor(levelNum / 2); i++) {
        const x = 200 + (Math.random() * (WIDTH - 400));
        level.spikes.push({ x, y: HEIGHT - 60, width: 30, height: 20 });
      }
      if (levelNum === 10) {
        // Last level includes everything from Set 1
        for (let i = 0; i < 3; i++) {
          level.spikes.push({ x: 150 + (i * 150), y: HEIGHT - 60, width: 30, height: 20 });
        }
      }
    }
    
    // Set 2 (Levels 11-20): Add Moving Saws
    else if (setNum === 2) {
      const numPlatforms = 6 + Math.floor((levelNum % 10) / 2);
      for (let i = 0; i < numPlatforms; i++) {
        const x = 70 + (i * 100);
        const y = HEIGHT - 120 - (Math.sin(i) * 60);
        level.platforms.push({ x, y, width: 85, height: 12 });
      }
      // Spikes - reduced
      for (let i = 0; i < Math.floor((levelNum % 10) / 3); i++) {
        const x = 150 + (Math.random() * (WIDTH - 300));
        level.spikes.push({ x, y: HEIGHT - 60, width: 30, height: 20 });
      }
      // Moving saws - slower speed
      for (let i = 0; i < Math.floor((levelNum % 10) / 4); i++) {
        level.movingObstacles.push({
          x: 250 + (i * 250),
          y: HEIGHT - 200,
          width: 35,
          height: 35,
          vx: 1.5,
          minX: 100,
          maxX: WIDTH - 100
        });
      }
      if (levelNum === 20) {
        // Last level includes spikes + saws
        for (let i = 0; i < 2; i++) {
          level.spikes.push({ x: 180 + (i * 200), y: HEIGHT - 60, width: 30, height: 20 });
        }
        level.movingObstacles.push({
          x: 300,
          y: HEIGHT - 250,
          width: 35,
          height: 35,
          vx: 2,
          minX: 120,
          maxX: WIDTH - 120
        });
      }
    }
    
    // Set 3 (Levels 21-30): Add Springs
    else if (setNum === 3) {
      const numPlatforms = 6 + Math.floor((levelNum % 10) / 2);
      for (let i = 0; i < numPlatforms; i++) {
        const x = 60 + (i * 95);
        const y = HEIGHT - 110 - (Math.random() * 140);
        level.platforms.push({ x, y, width: 80, height: 12 });
      }
      // Spikes - very few
      for (let i = 0; i < Math.floor((levelNum % 10) / 4); i++) {
        const x = 180 + (Math.random() * (WIDTH - 350));
        level.spikes.push({ x, y: HEIGHT - 60, width: 30, height: 20 });
      }
      // Saws - slow
      for (let i = 0; i < Math.floor((levelNum % 10) / 5); i++) {
        level.movingObstacles.push({
          x: 200 + (i * 280),
          y: HEIGHT - 210,
          width: 32,
          height: 32,
          vx: 1.8,
          minX: 100,
          maxX: WIDTH - 100
        });
      }
      // Springs (new!)
      for (let i = 0; i < Math.floor((levelNum % 10) / 3) + 1; i++) {
        const x = 220 + (i * 200);
        level.springs.push({ x, y: HEIGHT - 60, width: 40, height: 20 });
      }
      if (levelNum === 30) {
        // Last level includes spikes + saws + springs
        level.spikes.push({ x: 180, y: HEIGHT - 60, width: 30, height: 20 });
        level.movingObstacles.push({
          x: 250,
          y: HEIGHT - 220,
          width: 32,
          height: 32,
          vx: 2,
          minX: 120,
          maxX: WIDTH - 120
        });
        level.springs.push({ x: 140, y: HEIGHT - 60, width: 40, height: 20 });
        level.springs.push({ x: 500, y: HEIGHT - 60, width: 40, height: 20 });
      }
    }
    
    // Set 4 (Levels 31-40): Add Walls
    else if (setNum === 4) {
      const numPlatforms = 7 + Math.floor((levelNum % 10) / 2);
      for (let i = 0; i < numPlatforms; i++) {
        const x = 50 + (i * 90);
        const y = HEIGHT - 100 - (Math.random() * 150);
        level.platforms.push({ x, y, width: 75, height: 12 });
      }
      // Spikes - minimal
      for (let i = 0; i < Math.floor((levelNum % 10) / 4); i++) {
        const x = 140 + (Math.random() * (WIDTH - 280));
        level.spikes.push({ x, y: HEIGHT - 60, width: 28, height: 20 });
      }
      // Saws - slower
      for (let i = 0; i < Math.floor((levelNum % 10) / 5); i++) {
        level.movingObstacles.push({
          x: 180 + (i * 250),
          y: HEIGHT - 230,
          width: 32,
          height: 32,
          vx: 2,
          minX: 80,
          maxX: WIDTH - 80
        });
      }
      // Walls (new!) - vertical barriers to navigate around
      const numWalls = Math.floor((levelNum % 10) / 3) + 1;
      for (let i = 0; i < numWalls; i++) {
        const x = 200 + (i * 240);
        const wallHeight = 140 + (Math.random() * 60);
        level.walls.push({ 
          x, 
          y: HEIGHT - 60 - wallHeight, 
          width: 15, 
          height: wallHeight 
        });
        
        // Place spring before each wall to jump over it
        level.springs.push({ x: x - 50, y: HEIGHT - 60, width: 40, height: 20 });
      }
      if (levelNum === 40) {
        // Last level includes everything from Sets 1-4
        level.spikes.push({ x: 200, y: HEIGHT - 60, width: 28, height: 20 });
        level.movingObstacles.push({
          x: 280,
          y: HEIGHT - 240,
          width: 32,
          height: 32,
          vx: 2.2,
          minX: 100,
          maxX: WIDTH - 100
        });
        level.springs.push({ x: 160, y: HEIGHT - 60, width: 40, height: 20 });
        // Walls with springs to jump over them
        level.walls.push({ x: 350, y: HEIGHT - 200, width: 15, height: 140 });
        level.springs.push({ x: 300, y: HEIGHT - 60, width: 40, height: 20 });
        level.walls.push({ x: 500, y: HEIGHT - 180, width: 15, height: 120 });
        level.springs.push({ x: 450, y: HEIGHT - 60, width: 40, height: 20 });
      }
    }
    
    // Set 5 (Levels 41-50): Add Portals + Master all mechanics
    else if (setNum === 5) {
      const numPlatforms = 8 + Math.floor((levelNum % 10) / 2);
      for (let i = 0; i < numPlatforms; i++) {
        const x = 40 + (i * 85);
        const y = HEIGHT - 90 - (Math.random() * 160);
        level.platforms.push({ x, y, width: 70, height: 10 });
      }
      // Spikes - moderate
      for (let i = 0; i < Math.floor((levelNum % 10) / 3); i++) {
        const x = 130 + (Math.random() * (WIDTH - 260));
        level.spikes.push({ x, y: HEIGHT - 60, width: 26, height: 20 });
      }
      // Saws - moderate speed
      for (let i = 0; i < Math.floor((levelNum % 10) / 4); i++) {
        level.movingObstacles.push({
          x: 160 + (i * 230),
          y: HEIGHT - 240 - (Math.random() * 50),
          width: 32,
          height: 32,
          vx: 2.5 + (levelNum % 10) * 0.15,
          minX: 60,
          maxX: WIDTH - 60
        });
      }
      // Walls with springs positioned before them
      const numWalls = Math.floor((levelNum % 10) / 4);
      for (let i = 0; i < numWalls; i++) {
        const x = 220 + (i * 260);
        const wallHeight = 140 + (Math.random() * 60);
        level.walls.push({ 
          x, 
          y: HEIGHT - 60 - wallHeight, 
          width: 15, 
          height: wallHeight 
        });
        // Add spring before each wall to jump over it
        level.springs.push({ x: x - 50, y: HEIGHT - 60, width: 40, height: 20 });
      }
      // Additional springs for navigation
      for (let i = 0; i < Math.floor((levelNum % 10) / 5) + 1; i++) {
        const x = 150 + (i * 240);
        level.springs.push({ x, y: HEIGHT - 60, width: 40, height: 20 });
      }
      // Portals (new for Set 5!)
      const numPortalPairs = Math.min(Math.floor((levelNum % 10) / 5) + 1, 2);
      for (let i = 0; i < numPortalPairs; i++) {
        const colors = [
          { entrance: '#3b82f6', exit: '#f59e0b' },
          { entrance: '#8b5cf6', exit: '#ec4899' }
        ];
        const colorPair = colors[i % colors.length];
        level.portals.push({
          entrance: { 
            x: 130 + (i * 300), 
            y: HEIGHT - 140 - (Math.random() * 80), 
            width: 40, 
            height: 50, 
            color: colorPair.entrance 
          },
          exit: { 
            x: 400 + (i * 200), 
            y: HEIGHT - 200 - (Math.random() * 80), 
            width: 40, 
            height: 50, 
            color: colorPair.exit 
          }
        });
      }
      // Ceiling spikes - only in later levels
      if ((levelNum % 10) >= 8) {
        for (let i = 0; i < 1; i++) {
          const x = 250 + (i * 250);
          level.spikes.push({ x, y: 0, width: 28, height: 20 });
        }
      }
      if (levelNum === 50) {
        // Final level - ultimate challenge with EVERYTHING!
        level.spikes.push({ x: 190, y: HEIGHT - 60, width: 26, height: 20 });
        level.spikes.push({ x: 450, y: HEIGHT - 60, width: 26, height: 20 });
        level.movingObstacles.push({
          x: 280,
          y: HEIGHT - 260,
          width: 32,
          height: 32,
          vx: 3,
          minX: 80,
          maxX: WIDTH - 80
        });
        level.springs.push({ x: 150, y: HEIGHT - 60, width: 40, height: 20 });
        level.springs.push({ x: 500, y: HEIGHT - 60, width: 40, height: 20 });
        // Wall with spring to jump over it
        level.walls.push({ x: 320, y: HEIGHT - 220, width: 15, height: 160 });
        level.springs.push({ x: 270, y: HEIGHT - 60, width: 40, height: 20 });
        level.portals.push({
          entrance: { x: 130, y: HEIGHT - 150, width: 40, height: 50, color: '#3b82f6' },
          exit: { x: WIDTH - 180, y: HEIGHT - 280, width: 40, height: 50, color: '#f59e0b' }
        });
      }
    }

    return level;
  }

  function loadLevel(levelNum) {
    currentLevel = levelNum;
    currentLevelData = generateLevel(levelNum);
    player.x = 50;
    player.y = HEIGHT - 100;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    levelBadge.textContent = `Level: ${currentLevel} / ${MAX_LEVELS}`;
  }

  function reset() {
    gameRunning = false;
    gamePaused = false;
    currentLevel = 1;
    deaths = 0;
    elapsedTime = 0;
    loadLevel(1);
    updateUI();
    drawInitialState();
  }

  function drawInitialState() {
    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw current level preview
    currentLevelData.platforms.forEach(platform => {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    currentLevelData.spikes.forEach(spike => {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      if (spike.y === 0) {
        ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width / 2, spike.y);
        ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
      } else {
        ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width / 2, spike.y);
        ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
      }
      ctx.closePath();
      ctx.fill();
    });

    const door = currentLevelData.door;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(door.x, door.y, door.width, door.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🚪', door.x + door.width / 2, door.y + 40);

    // Draw portals
    currentLevelData.portals.forEach(portalPair => {
      ctx.fillStyle = portalPair.entrance.color;
      ctx.fillRect(portalPair.entrance.x, portalPair.entrance.y, portalPair.entrance.width, portalPair.entrance.height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        portalPair.entrance.x + portalPair.entrance.width / 2, 
        portalPair.entrance.y + portalPair.entrance.height / 2, 
        15, 
        0, 
        Math.PI * 2
      );
      ctx.stroke();

      ctx.fillStyle = portalPair.exit.color;
      ctx.fillRect(portalPair.exit.x, portalPair.exit.y, portalPair.exit.width, portalPair.exit.height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        portalPair.exit.x + portalPair.exit.width / 2, 
        portalPair.exit.y + portalPair.exit.height / 2, 
        15, 
        0, 
        Math.PI * 2
      );
      ctx.stroke();
    });

    // Draw springs
    currentLevelData.springs.forEach(spring => {
      drawSpring(spring, false);
    });

    // Draw walls
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    currentLevelData.walls.forEach(wall => {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
      // Add brick texture
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      const brickHeight = 20;
      for (let y = wall.y; y < wall.y + wall.height; y += brickHeight) {
        ctx.beginPath();
        ctx.moveTo(wall.x, y);
        ctx.lineTo(wall.x + wall.width, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
    });

    // Draw player with animation
    drawPlayer();

    // Draw "Click Start to Play" message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(WIDTH / 2 - 200, HEIGHT / 2 - 60, 400, 120);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click Start to Play!', WIDTH / 2, HEIGHT / 2 - 10);
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Arrow Keys / WASD to move', WIDTH / 2, HEIGHT / 2 + 30);
  }

  function updateUI() {
    levelBadge.textContent = `Level: ${currentLevel} / ${MAX_LEVELS}`;
    deathsBadge.textContent = `Deaths: ${deaths}`;
    timeBadge.textContent = `Time: ${Math.floor(elapsedTime)}s`;
    bestBadge.textContent = `Best Level: ${bestLevel}`;
  }

  function checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  function die() {
    deaths++;
    sound.playLose();
    loadLevel(currentLevel); // Restart current level
    updateUI();
  }

  function drawSpring(spring, compressed = false) {
    const coils = 6;
    const coilHeight = compressed ? spring.height / (coils * 2) : spring.height / coils;
    
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Base platform
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(spring.x, spring.y + spring.height, spring.width, 5);
    
    // Coiled spring
    ctx.beginPath();
    for (let i = 0; i <= coils; i++) {
      const y = spring.y + spring.height - (i * coilHeight);
      const offset = i % 2 === 0 ? 5 : -5;
      const x = spring.x + spring.width / 2 + offset;
      if (i === 0) {
        ctx.moveTo(spring.x + spring.width / 2, spring.y + spring.height);
      }
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Top cap
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(spring.x + 5, spring.y, spring.width - 10, 4);
    
    ctx.restore();
  }

  function drawPlayer() {
    const t = player.anim;
    const bob = Math.sin(t * 4) * (player.moving ? 4 : 1.5);
    const legSwing = Math.sin(t * 8) * (player.moving ? 7 : 3);
    const armSwing = Math.cos(t * 8) * (player.moving ? 7 : 3);

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, 0 + bob);
    ctx.lineTo(-4, 10 + bob + legSwing);
    ctx.moveTo(4, 0 + bob);
    ctx.lineTo(4, 10 + bob - legSwing);
    ctx.stroke();

    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(-8, -10 + bob, 16, 14, 4);
    ctx.fill();

    // Arms
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, -5 + bob);
    ctx.lineTo(-12, 2 + bob + armSwing);
    ctx.moveTo(8, -5 + bob);
    ctx.lineTo(12, 2 + bob - armSwing);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -14 + bob, 7, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-3, -14 + bob, 1.5, 0, Math.PI * 2);
    ctx.arc(3, -14 + bob, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Devil horns
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-5, -18 + bob);
    ctx.lineTo(-7, -21 + bob);
    ctx.lineTo(-4, -20 + bob);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -18 + bob);
    ctx.lineTo(7, -21 + bob);
    ctx.lineTo(4, -20 + bob);
    ctx.fill();

    ctx.restore();
  }

  function completeLevel() {
    sound.playWin();
    
    if (currentLevel >= bestLevel) {
      bestLevel = currentLevel + 1;
      localStorage.setItem('level-devil-best', bestLevel.toString());
      updateHighScore('level-devil', bestLevel);
    }

    if (currentLevel >= MAX_LEVELS) {
      // Beat the game!
      gameOver(true);
    } else {
      currentLevel++;
      loadLevel(currentLevel);
      updateUI();
    }
  }

  function gameLoop() {
    if (!gameRunning || gamePaused) return;

    elapsedTime = (Date.now() - startTime) / 1000;
    updateUI();

    // Update animation timer
    player.anim += 0.15;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Apply gravity
    if (!player.grounded) {
      player.vy += 0.6; // Gravity
    }

    // Horizontal movement
    player.vx = 0;
    player.moving = false;
    if (keys['arrowleft'] || keys['a']) {
      player.vx = -player.speed;
      player.moving = true;
    }
    if (keys['arrowright'] || keys['d']) {
      player.vx = player.speed;
      player.moving = true;
    }

    player.x += player.vx;
    player.y += player.vy;

    // Keep player in bounds horizontally
    player.x = Math.max(0, Math.min(WIDTH - player.width, player.x));

    // Platform collision
    player.grounded = false;
    currentLevelData.platforms.forEach(platform => {
      if (
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + player.height > platform.y &&
        player.y + player.height < platform.y + platform.height + 10 &&
        player.vy >= 0
      ) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.grounded = true;
      }
    });

    // Coyote time: brief window after leaving ground where jump still works
    if (player.grounded) {
      jumpBufferTime = 5; // 5 frames of buffer
    } else if (jumpBufferTime > 0) {
      jumpBufferTime--;
    }

    // Draw platforms
    ctx.fillStyle = '#64748b';
    currentLevelData.platforms.forEach(platform => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw and handle walls
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    currentLevelData.walls.forEach(wall => {
      // Draw wall with brick pattern
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
      
      // Add brick texture lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      const brickHeight = 20;
      for (let y = wall.y; y < wall.y + wall.height; y += brickHeight) {
        ctx.beginPath();
        ctx.moveTo(wall.x, y);
        ctx.lineTo(wall.x + wall.width, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      
      // Wall collision with player
      if (checkCollision(player, wall)) {
        // Push player away from wall
        if (player.vx > 0) {
          // Moving right, hit left side of wall
          player.x = wall.x - player.width;
        } else if (player.vx < 0) {
          // Moving left, hit right side of wall
          player.x = wall.x + wall.width;
        }
        player.vx = 0;
      }
    });

    // Update and draw moving obstacles (circular saws)
    currentLevelData.movingObstacles.forEach(obs => {
      obs.x += obs.vx;
      if (obs.x <= obs.minX || obs.x >= obs.maxX) {
        obs.vx *= -1;
      }

      // Update rotation for saw animation
      if (!obs.rotation) obs.rotation = 0;
      obs.rotation += 0.15;

      // Draw circular saw (simplified for performance)
      const centerX = obs.x + obs.width / 2;
      const centerY = obs.y + obs.height / 2;
      const radius = obs.width / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(obs.rotation);

      // Outer blade with teeth (simplified - 8 teeth instead of 12)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      const numTeeth = 8;
      for (let i = 0; i < numTeeth; i++) {
        const angle = (i / numTeeth) * Math.PI * 2;
        const nextAngle = ((i + 1) / numTeeth) * Math.PI * 2;
        const toothAngle = (angle + nextAngle) / 2;
        
        ctx.arc(0, 0, radius, angle, nextAngle);
        ctx.lineTo(Math.cos(toothAngle) * (radius + 3), Math.sin(toothAngle) * (radius + 3));
      }
      ctx.closePath();
      ctx.fill();

      // Inner circle
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Collision with player
      if (checkCollision(player, obs)) {
        die();
      }
    });

    // Draw spikes
    ctx.fillStyle = '#dc2626';
    currentLevelData.spikes.forEach(spike => {
      // Draw triangle spikes
      ctx.beginPath();
      if (spike.y === 0) {
        // Ceiling spikes (point down)
        ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width / 2, spike.y);
        ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
      } else {
        // Floor spikes (point up)
        ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width / 2, spike.y);
        ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
      }
      ctx.closePath();
      ctx.fill();

      // Collision with player
      if (checkCollision(player, spike)) {
        die();
      }
    });

    // Draw door (goal)
    const door = currentLevelData.door;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(door.x, door.y, door.width, door.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🚪', door.x + door.width / 2, door.y + 40);

    // Draw portals
    currentLevelData.portals.forEach(portalPair => {
      // Draw entrance portal
      ctx.fillStyle = portalPair.entrance.color;
      ctx.fillRect(portalPair.entrance.x, portalPair.entrance.y, portalPair.entrance.width, portalPair.entrance.height);
      // Portal swirl effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        portalPair.entrance.x + portalPair.entrance.width / 2, 
        portalPair.entrance.y + portalPair.entrance.height / 2, 
        15, 
        0, 
        Math.PI * 2
      );
      ctx.stroke();

      // Draw exit portal
      ctx.fillStyle = portalPair.exit.color;
      ctx.fillRect(portalPair.exit.x, portalPair.exit.y, portalPair.exit.width, portalPair.exit.height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        portalPair.exit.x + portalPair.exit.width / 2, 
        portalPair.exit.y + portalPair.exit.height / 2, 
        15, 
        0, 
        Math.PI * 2
      );
      ctx.stroke();

      // Check collision with entrance portal
      if (checkCollision(player, portalPair.entrance)) {
        // Teleport to exit
        player.x = portalPair.exit.x;
        player.y = portalPair.exit.y;
        sound.playScore(); // Portal sound
      }
    });

    // Draw and handle springs
    currentLevelData.springs.forEach(spring => {
      let compressed = false;
      
      // Check collision with player
      if (checkCollision(player, spring)) {
        // Launch player upward!
        player.vy = -18; // Strong upward boost
        player.grounded = false;
        compressed = true;
        sound.playScore(); // Spring sound
      }
      
      drawSpring(spring, compressed);
    });

    // Check if player reached door
    if (checkCollision(player, door)) {
      completeLevel();
    }

    // Draw player with animation
    drawPlayer();

    // Level indicator and progress dots on screen
    const setNum = Math.ceil(currentLevel / 10);
    const levelInSet = ((currentLevel - 1) % 10) + 1;
    
    // Top panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, WIDTH - 20, 60);
    
    // Level text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Set ${setNum} • Level ${currentLevel}/${MAX_LEVELS}`, 20, 35);
    
    // Progress dots (10 dots per set)
    ctx.textAlign = 'center';
    const dotStartX = WIDTH / 2 - 90;
    const dotY = 50;
    for (let i = 1; i <= 10; i++) {
      const dotX = dotStartX + (i * 20);
      
      if (i < levelInSet) {
        // Completed level - filled dot
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (i === levelInSet) {
        // Current level - highlighted dot with ring
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 9, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Future level - empty dot
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Death if fall off
    if (player.y > HEIGHT) {
      die();
    }

    requestAnimationFrame(gameLoop);
  }

  function gameOver(won = false) {
    gameRunning = false;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    
    if (won) {
      sound.playWin();
      ctx.fillText('🎉 YOU WIN! 🎉', WIDTH / 2, HEIGHT / 2 - 60);
      ctx.font = '32px Arial';
      ctx.fillText(`All 50 levels complete!`, WIDTH / 2, HEIGHT / 2);
      ctx.fillText(`Deaths: ${deaths}`, WIDTH / 2, HEIGHT / 2 + 50);
      ctx.fillText(`Time: ${Math.floor(elapsedTime)}s`, WIDTH / 2, HEIGHT / 2 + 90);
    } else {
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      ctx.font = '24px Arial';
      ctx.fillText(`Level: ${currentLevel}`, WIDTH / 2, HEIGHT / 2 + 40);
    }
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
        title: '😈 Welcome to Level Devil!',
        content: 'Think you can beat 50 increasingly difficult levels? This game will test your platforming skills with devilish traps!'
      },
      {
        title: '🎯 Your Goal',
        content: 'Reach the green door (🚪) in each level to progress. Complete all 50 levels to beat the game!'
      },
      {
        title: '🎮 Movement',
        content: 'Use ARROW KEYS or WASD to move left and right. Press UP, W, or SPACEBAR to jump. Time your jumps carefully!'
      },
      {
        title: '💀 Dangers',
        content: 'Watch out for RED SPIKES (deadly triangles) and ORANGE MOVING OBSTACLES. One touch and you\'ll restart the level!'
      },
      {
        title: '🌀 Portals',
        content: 'Starting from level 5, you\'ll find colored portals! Walk into a BLUE portal to teleport to its ORANGE exit. Multiple portal pairs use different colors - match them to navigate tricky sections!'
      },
      {
        title: '📊 Level Progression',
        content: 'Levels 1-10: Learning basics + portals appear. Levels 11-25: Moving obstacles + multiple portals. Levels 26-50: Complex portal networks + everything gets faster!'
      },
      {
        title: '💡 Pro Tips',
        content: 'Take your time - rushing leads to deaths! Watch moving obstacle patterns before jumping. Some levels have fake platforms!'
      },
      {
        title: '🏆 Challenge',
        content: 'Your death count and completion time are tracked. Can you beat all 50 levels with minimal deaths? Good luck!'
      }
    ];

    let currentStep = 0;

    function renderStep() {
      const step = steps[currentStep];
      tutorialBox.innerHTML = `
        <h2 style="margin-top: 0; color: #dc2626; font-size: 28px;">${step.title}</h2>
        <p style="font-size: 18px; line-height: 1.6; color: #333;">${step.content}</p>
        <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
          <button id="tutorial-back" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;" ${currentStep === 0 ? 'disabled' : ''}>
            ← Back
          </button>
          <span style="color: #6b7280; font-size: 14px;">Step ${currentStep + 1} of ${steps.length}</span>
          <button id="tutorial-next" style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
            ${currentStep === steps.length - 1 ? 'Let\'s Go! 😈' : 'Next →'}
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
      startTime = Date.now();
      sound.playClick();
      gameLoop();
    }
  });

  pauseBtn.addEventListener('click', () => {
    if (gameRunning) {
      gamePaused = !gamePaused;
      pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
      if (!gamePaused) {
        startTime = Date.now() - (elapsedTime * 1000);
        gameLoop();
      }
    }
  });

  resetBtn.addEventListener('click', () => {
    loadLevel(currentLevel);
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
