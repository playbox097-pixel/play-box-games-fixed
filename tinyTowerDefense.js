// Tiny Tower Defense - Strategic tower defense game
// Place towers to stop waves of enemies from reaching your base!

export function mount(container) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  const gameState = {
    running: false,
    paused: false,
    started: false,
    money: 150,
    lives: 20,
    wave: 1,
    waveInProgress: false,
    enemiesThisWave: 0,
    enemiesSpawned: 0,
    gameOver: false,
    victory: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('towerDefenseHighScore')) || 0
  };

  // Tower types
  const towerTypes = {
    basic: {
      name: 'Basic Tower',
      cost: 50,
      damage: 10,
      range: 100,
      fireRate: 30,
      color: '#3b82f6',
      projectileColor: '#60a5fa',
      emoji: '🔫'
    },
    cannon: {
      name: 'Cannon',
      cost: 100,
      damage: 25,
      range: 120,
      fireRate: 45,
      color: '#ef4444',
      projectileColor: '#fca5a5',
      emoji: '💣'
    },
    laser: {
      name: 'Laser Tower',
      cost: 150,
      damage: 8,
      range: 150,
      fireRate: 10,
      color: '#8b5cf6',
      projectileColor: '#c4b5fd',
      emoji: '⚡'
    },
    sniper: {
      name: 'Sniper',
      cost: 200,
      damage: 60,
      range: 200,
      fireRate: 60,
      color: '#10b981',
      projectileColor: '#6ee7b7',
      emoji: '🎯'
    }
  };

  const towers = [];
  const enemies = [];
  const projectiles = [];
  const particles = [];
  
  let selectedTowerType = 'basic';
  let placementMode = false;
  let mouseX = 0;
  let mouseY = 0;
  let hoveredTower = null;
  let animationId = null;

  // Path for enemies to follow (serpentine pattern)
  const path = [
    { x: -20, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 250 },
    { x: 500, y: 250 },
    { x: 500, y: 100 },
    { x: 700, y: 100 },
    { x: 700, y: 400 },
    { x: 400, y: 400 },
    { x: 400, y: 500 },
    { x: 820, y: 500 }
  ];

  // Enemy types
  const enemyTypes = [
    { speed: 1.5, health: 30, reward: 10, color: '#f87171', size: 15, emoji: '👾' },
    { speed: 1.0, health: 60, reward: 15, color: '#fb923c', size: 18, emoji: '👹' },
    { speed: 2.0, health: 20, reward: 12, color: '#fbbf24', size: 12, emoji: '👻' },
    { speed: 0.8, health: 100, reward: 25, color: '#a855f7', size: 22, emoji: '🤖' },
    { speed: 1.2, health: 150, reward: 40, color: '#ef4444', size: 25, emoji: '👿' }
  ];

  // Load data
  function loadData() {
    gameState.highScore = parseInt(localStorage.getItem('towerDefenseHighScore')) || 0;
  }

  // Save data
  function saveData() {
    localStorage.setItem('towerDefenseHighScore', gameState.highScore);
  }

  // Create particle effect
  function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        velX: (Math.random() - 0.5) * 4,
        velY: (Math.random() - 0.5) * 4,
        size: Math.random() * 3 + 1,
        life: 30,
        maxLife: 30,
        color
      });
    }
  }

  // Initialize game
  function init() {
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.background = '#1a1a1a';
    canvas.style.cursor = 'crosshair';
    container.appendChild(canvas);

    // Create UI overlay
    const uiDiv = document.createElement('div');
    uiDiv.style.cssText = `
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-family: 'Arial', sans-serif;
      text-align: center;
      pointer-events: none;
      z-index: 10;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    uiDiv.innerHTML = `
      <div style="display: flex; gap: 20px; justify-content: center; font-size: 14px; font-weight: bold;">
        <div>💰 <span id="td-money">150</span></div>
        <div>❤️ <span id="td-lives">20</span></div>
        <div>🌊 Wave <span id="td-wave">1</span></div>
        <div>⭐ Score: <span id="td-score">0</span></div>
        <div>🏆 High: <span id="td-highscore">${gameState.highScore}</span></div>
      </div>
    `;
    container.style.position = 'relative';
    container.appendChild(uiDiv);

    // Create tower selection panel
    const towerPanel = document.createElement('div');
    towerPanel.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      border: 2px solid #444;
      z-index: 10;
    `;
    
    Object.entries(towerTypes).forEach(([key, tower]) => {
      const btn = document.createElement('button');
      btn.id = `tower-${key}`;
      btn.style.cssText = `
        padding: 8px 12px;
        background: ${tower.color};
        color: white;
        border: 2px solid #fff;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        font-weight: bold;
        transition: all 0.2s;
      `;
      btn.innerHTML = `${tower.emoji}<br>$${tower.cost}`;
      btn.addEventListener('click', () => selectTower(key));
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.1)';
        btn.style.boxShadow = '0 4px 12px rgba(255,255,255,0.3)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
      });
      towerPanel.appendChild(btn);
    });

    // Add wave button
    const waveBtn = document.createElement('button');
    waveBtn.id = 'start-wave-btn';
    waveBtn.style.cssText = `
      padding: 8px 16px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: 2px solid #fff;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    waveBtn.textContent = 'Start Wave';
    waveBtn.addEventListener('click', startWave);
    waveBtn.addEventListener('mouseenter', () => {
      waveBtn.style.transform = 'scale(1.1)';
      waveBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.5)';
    });
    waveBtn.addEventListener('mouseleave', () => {
      waveBtn.style.transform = 'scale(1)';
      waveBtn.style.boxShadow = 'none';
    });
    towerPanel.appendChild(waveBtn);

    container.appendChild(towerPanel);

    // Controls info
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      position: absolute;
      top: 50px;
      left: 10px;
      color: #888;
      font-family: 'Arial', sans-serif;
      font-size: 11px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      pointer-events: none;
    `;
    controlsDiv.innerHTML = `
      🖱️ Click tower → Click map to place<br>
      🖱️ Hover tower → View range & info<br>
      💰 Earn money by defeating enemies<br>
      ❌ Right-click tower to sell (50% refund)
    `;
    container.appendChild(controlsDiv);

    loadData();
    gameState.running = true;
    showStartScreen();
    gameLoop();
  }

  // Show start screen
  function showStartScreen() {
    const startOverlay = document.createElement('div');
    startOverlay.id = 'td-start-overlay';
    startOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    `;
    
    startOverlay.innerHTML = `
      <div style="text-align: center; color: white; font-family: Arial, sans-serif;">
        <h1 style="font-size: 48px; margin-bottom: 20px; color: #10b981;">🏰 Tiny Tower Defense</h1>
        <p style="font-size: 18px; margin-bottom: 30px; color: #aaa;">Place towers to defend against waves of enemies!</p>
        <div style="text-align: left; display: inline-block; margin-bottom: 30px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
          <p style="margin: 8px 0;"><strong>🔫 Basic Tower ($50):</strong> Balanced damage</p>
          <p style="margin: 8px 0;"><strong>💣 Cannon ($100):</strong> Heavy damage</p>
          <p style="margin: 8px 0;"><strong>⚡ Laser ($150):</strong> Rapid fire</p>
          <p style="margin: 8px 0;"><strong>🎯 Sniper ($200):</strong> Extreme range</p>
        </div>
        <div style="margin-bottom: 20px;">
          <p style="margin: 8px 0;">🖱️ Click tower → Click map to place</p>
          <p style="margin: 8px 0;">🖱️ Right-click to sell (50% refund)</p>
          <p style="margin: 8px 0;">❤️ Survive 20 waves to win!</p>
        </div>
        <button id="td-start-btn" style="
          padding: 15px 40px;
          font-size: 24px;
          font-weight: bold;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
          transition: all 0.3s;
        ">START GAME</button>
        <p style="margin-top: 20px; color: #888; font-size: 14px;">High Score: ${gameState.highScore}</p>
      </div>
    `;
    
    container.appendChild(startOverlay);
    
    const startBtn = document.getElementById('td-start-btn');
    startBtn.addEventListener('mouseenter', () => {
      startBtn.style.transform = 'scale(1.1)';
      startBtn.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
    });
    startBtn.addEventListener('mouseleave', () => {
      startBtn.style.transform = 'scale(1)';
      startBtn.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
    });
    startBtn.addEventListener('click', () => {
      gameState.started = true;
      startOverlay.remove();
    });
  }

  // Select tower type
  function selectTower(type) {
    selectedTowerType = type;
    placementMode = true;
    
    // Update button styles
    Object.keys(towerTypes).forEach(key => {
      const btn = document.getElementById(`tower-${key}`);
      if (btn) {
        btn.style.border = key === type ? '3px solid yellow' : '2px solid #fff';
      }
    });
  }

  // Start wave
  function startWave() {
    if (gameState.waveInProgress || gameState.gameOver) return;
    
    gameState.waveInProgress = true;
    gameState.enemiesThisWave = 5 + gameState.wave * 3;
    gameState.enemiesSpawned = 0;
    
    const btn = document.getElementById('start-wave-btn');
    if (btn) btn.disabled = true;
  }

  // Spawn enemy
  function spawnEnemy() {
    if (gameState.enemiesSpawned >= gameState.enemiesThisWave) return;
    
    // Choose enemy type based on wave
    const maxType = Math.min(Math.floor(gameState.wave / 2), enemyTypes.length - 1);
    const typeIndex = Math.floor(Math.random() * (maxType + 1));
    const type = enemyTypes[typeIndex];
    
    enemies.push({
      x: path[0].x,
      y: path[0].y,
      pathIndex: 0,
      health: type.health + gameState.wave * 5,
      maxHealth: type.health + gameState.wave * 5,
      speed: type.speed,
      reward: type.reward + Math.floor(gameState.wave * 1.5),
      color: type.color,
      size: type.size,
      emoji: type.emoji
    });
    
    gameState.enemiesSpawned++;
  }

  // Place tower
  function placeTower(x, y) {
    const tower = towerTypes[selectedTowerType];
    
    if (gameState.money < tower.cost) return;
    
    // Check if too close to path
    let tooClose = false;
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const dist = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dist < 40) {
        tooClose = true;
        break;
      }
    }
    
    if (tooClose) return;
    
    // Check if too close to other towers
    for (const t of towers) {
      const dist = Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2);
      if (dist < 50) return;
    }
    
    towers.push({
      x,
      y,
      type: selectedTowerType,
      damage: tower.damage,
      range: tower.range,
      fireRate: tower.fireRate,
      color: tower.color,
      projectileColor: tower.projectileColor,
      emoji: tower.emoji,
      cooldown: 0,
      target: null,
      cost: tower.cost
    });
    
    gameState.money -= tower.cost;
    placementMode = false;
    updateUI();
    createParticles(x, y, tower.color, 12);
  }

  // Sell tower
  function sellTower(tower) {
    const refund = Math.floor(tower.cost * 0.5);
    gameState.money += refund;
    const index = towers.indexOf(tower);
    if (index > -1) {
      createParticles(tower.x, tower.y, '#fbbf24', 15);
      towers.splice(index, 1);
    }
    updateUI();
  }

  // Distance from point to line segment
  function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Update game state
  function update() {
    if (!gameState.running || gameState.paused || gameState.gameOver || !gameState.started) return;

    // Spawn enemies during wave
    if (gameState.waveInProgress && enemies.length < 20) {
      if (Math.random() < 0.02) {
        spawnEnemy();
      }
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      
      if (enemy.pathIndex < path.length - 1) {
        const target = path[enemy.pathIndex + 1];
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
          enemy.pathIndex++;
        } else {
          enemy.x += (dx / dist) * enemy.speed;
          enemy.y += (dy / dist) * enemy.speed;
        }
      } else {
        // Enemy reached the end
        gameState.lives--;
        enemies.splice(i, 1);
        createParticles(enemy.x, enemy.y, '#ef4444', 10);
        
        if (gameState.lives <= 0) {
          endGame(false);
        }
        updateUI();
        continue;
      }
      
      // Remove dead enemies
      if (enemy.health <= 0) {
        gameState.money += enemy.reward;
        gameState.score += enemy.reward * 10;
        createParticles(enemy.x, enemy.y, enemy.color, 15);
        enemies.splice(i, 1);
        updateUI();
      }
    }

    // Check if wave is complete
    if (gameState.waveInProgress && 
        gameState.enemiesSpawned >= gameState.enemiesThisWave && 
        enemies.length === 0) {
      gameState.waveInProgress = false;
      gameState.wave++;
      gameState.money += 50; // Wave completion bonus
      gameState.score += 100 * gameState.wave;
      
      const btn = document.getElementById('start-wave-btn');
      if (btn) btn.disabled = false;
      
      // Victory condition
      if (gameState.wave > 20) {
        endGame(true);
      }
      
      updateUI();
    }

    // Update towers
    towers.forEach(tower => {
      if (tower.cooldown > 0) {
        tower.cooldown--;
        return;
      }
      
      // Find target
      let closestEnemy = null;
      let closestDist = Infinity;
      
      enemies.forEach(enemy => {
        const dist = Math.sqrt((enemy.x - tower.x) ** 2 + (enemy.y - tower.y) ** 2);
        if (dist < tower.range && dist < closestDist) {
          closestEnemy = enemy;
          closestDist = dist;
        }
      });
      
      if (closestEnemy) {
        tower.target = closestEnemy;
        tower.cooldown = tower.fireRate;
        
        // Fire projectile
        projectiles.push({
          x: tower.x,
          y: tower.y,
          targetX: closestEnemy.x,
          targetY: closestEnemy.y,
          target: closestEnemy,
          damage: tower.damage,
          color: tower.projectileColor,
          speed: 8
        });
      } else {
        tower.target = null;
      }
    });

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      
      if (!proj.target || proj.target.health <= 0) {
        projectiles.splice(i, 1);
        continue;
      }
      
      const dx = proj.target.x - proj.x;
      const dy = proj.target.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 5) {
        // Hit
        proj.target.health -= proj.damage;
        createParticles(proj.x, proj.y, proj.color, 6);
        projectiles.splice(i, 1);
      } else {
        proj.x += (dx / dist) * proj.speed;
        proj.y += (dy / dist) * proj.speed;
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.velX;
      p.y += p.velY;
      p.velX *= 0.95;
      p.velY *= 0.95;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  // Render game
  function render() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw path
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 60;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    // Draw path markers
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 50;
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw start and end
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(path[0].x, path[0].y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶', path[0].x, path[0].y);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('🏠', path[path.length - 1].x, path[path.length - 1].y);

    // Draw tower ranges (for hovered tower)
    if (hoveredTower) {
      ctx.strokeStyle = hoveredTower.color + '40';
      ctx.fillStyle = hoveredTower.color + '10';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hoveredTower.x, hoveredTower.y, hoveredTower.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Draw placement preview
    if (placementMode && !gameState.gameOver) {
      const tower = towerTypes[selectedTowerType];
      
      // Check if valid placement
      let valid = true;
      
      // Check path distance
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        const dist = distanceToLineSegment(mouseX, mouseY, p1.x, p1.y, p2.x, p2.y);
        if (dist < 40) {
          valid = false;
          break;
        }
      }
      
      // Check tower distance
      for (const t of towers) {
        const dist = Math.sqrt((t.x - mouseX) ** 2 + (t.y - mouseY) ** 2);
        if (dist < 50) {
          valid = false;
          break;
        }
      }
      
      // Check money
      if (gameState.money < tower.cost) {
        valid = false;
      }
      
      ctx.strokeStyle = valid ? '#10b981' : '#ef4444';
      ctx.fillStyle = (valid ? tower.color : '#ef4444') + '20';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, tower.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw tower preview
      ctx.fillStyle = valid ? tower.color : '#ef4444';
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.emoji, mouseX, mouseY);
    }

    // Draw towers
    towers.forEach(tower => {
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Tower border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Tower emoji
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.emoji, tower.x, tower.y);
      
      // Draw targeting line
      if (tower.target && tower.cooldown < 5) {
        ctx.strokeStyle = tower.projectileColor + '60';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tower.x, tower.y);
        ctx.lineTo(tower.target.x, tower.target.y);
        ctx.stroke();
      }
    });

    // Draw projectiles
    projectiles.forEach(proj => {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Trail effect
      ctx.fillStyle = proj.color + '40';
      ctx.beginPath();
      ctx.arc(proj.x - proj.speed / 2, proj.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw enemies
    enemies.forEach(enemy => {
      // Enemy body
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Enemy emoji
      ctx.font = `${enemy.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(enemy.emoji, enemy.x, enemy.y);
      
      // Health bar
      const healthBarWidth = enemy.size * 2;
      const healthPercent = enemy.health / enemy.maxHealth;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.size - 8, healthBarWidth, 4);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#10b981' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.size - 8, healthBarWidth * healthPercent, 4);
    });

    // Draw particles
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color.includes('#') ? p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0') : p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // Draw tower info on hover
    if (hoveredTower) {
      const towerInfo = towerTypes[hoveredTower.type];
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(hoveredTower.x - 60, hoveredTower.y - 60, 120, 35);
      
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(towerInfo.name, hoveredTower.x, hoveredTower.y - 45);
      ctx.fillText(`💥 ${hoveredTower.damage} | 📏 ${hoveredTower.range}`, hoveredTower.x, hoveredTower.y - 30);
      ctx.fillText(`💰 Sell: $${Math.floor(hoveredTower.cost * 0.5)}`, hoveredTower.x, hoveredTower.y - 15);
    }

    // Game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = gameState.victory ? '#10b981' : '#ef4444';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(gameState.victory ? 'VICTORY!' : 'DEFEATED', canvas.width / 2, canvas.height / 2 - 60);
      
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Wave: ${gameState.wave}`, canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText(`High Score: ${gameState.highScore}`, canvas.width / 2, canvas.height / 2 + 50);
      
      ctx.font = '18px Arial';
      ctx.fillStyle = '#888';
      ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 90);
    }
  }

  // Game loop
  function gameLoop() {
    update();
    render();
    animationId = requestAnimationFrame(gameLoop);
  }

  // Update UI
  function updateUI() {
    document.getElementById('td-money').textContent = gameState.money;
    document.getElementById('td-lives').textContent = gameState.lives;
    document.getElementById('td-wave').textContent = gameState.wave;
    document.getElementById('td-score').textContent = gameState.score;
    document.getElementById('td-highscore').textContent = gameState.highScore;
  }

  // End game
  function endGame(victory) {
    gameState.gameOver = true;
    gameState.victory = victory;
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      saveData();
    }
    updateUI();
  }

  // Reset game
  function resetGame() {
    gameState.running = true;
    gameState.paused = false;
    gameState.money = 150;
    gameState.lives = 20;
    gameState.wave = 1;
    gameState.waveInProgress = false;
    gameState.enemiesThisWave = 0;
    gameState.enemiesSpawned = 0;
    gameState.gameOver = false;
    gameState.victory = false;
    gameState.score = 0;
    
    towers.length = 0;
    enemies.length = 0;
    projectiles.length = 0;
    particles.length = 0;
    
    placementMode = false;
    
    const btn = document.getElementById('start-wave-btn');
    if (btn) btn.disabled = false;
    
    updateUI();
  }

  // Event handlers
  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // Check for tower hover
    hoveredTower = null;
    for (const tower of towers) {
      const dist = Math.sqrt((tower.x - mouseX) ** 2 + (tower.y - mouseY) ** 2);
      if (dist < 20) {
        hoveredTower = tower;
        break;
      }
    }
  }

  function handleClick(e) {
    if (gameState.gameOver) {
      resetGame();
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (placementMode) {
      placeTower(x, y);
    }
  }

  function handleRightClick(e) {
    e.preventDefault();
    
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on a tower
    for (const tower of towers) {
      const dist = Math.sqrt((tower.x - x) ** 2 + (tower.y - y) ** 2);
      if (dist < 20) {
        sellTower(tower);
        return;
      }
    }
  }

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('contextmenu', handleRightClick);

  // Start game
  init();

  // Cleanup function
  return function cleanup() {
    gameState.running = false;
    if (animationId) cancelAnimationFrame(animationId);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('click', handleClick);
    canvas.removeEventListener('contextmenu', handleRightClick);
    container.innerHTML = '';
  };
}
