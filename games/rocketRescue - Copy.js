// Rocket Rescue - Vertical scrolling space rescue game
// Pilot your rocket to save stranded astronauts while avoiding asteroids!

export function mount(container) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  const gameState = {
    running: false,
    paused: false,
    started: false,
    score: 0,
    lives: 3,
    fuel: 100,
    rescued: 0,
    gameOver: false,
    highScore: parseInt(localStorage.getItem('rocketRescueHighScore')) || 0,
    level: 1,
    scrollSpeed: 2
  };

  const rocket = {
    x: 200,
    y: 500,
    width: 40,
    height: 60,
    speed: 5,
    velX: 0,
    velY: 0,
    angle: 0,
    targetAngle: 0,
    thrustPower: 0.3,
    maxSpeed: 6,
    friction: 0.92
  };

  const keys = {};
  const stars = [];
  const asteroids = [];
  const astronauts = [];
  const particles = [];
  const explosions = [];
  
  let lastAsteroidSpawn = 0;
  let lastAstronautSpawn = 0;
  let fuelDrainRate = 0.05;
  let animationId = null;

  // Initialize stars background
  function initStars() {
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1 + 0.5
      });
    }
  }

  // Load data
  function loadData() {
    gameState.highScore = parseInt(localStorage.getItem('rocketRescueHighScore')) || 0;
  }

  // Save data
  function saveData() {
    localStorage.setItem('rocketRescueHighScore', gameState.highScore);
  }

  // Create particle effect
  function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        velX: (Math.random() - 0.5) * 6,
        velY: (Math.random() - 0.5) * 6,
        size: Math.random() * 4 + 2,
        life: 30,
        maxLife: 30,
        color
      });
    }
  }

  // Create explosion effect
  function createExplosion(x, y, size = 40) {
    explosions.push({
      x,
      y,
      size: 0,
      maxSize: size,
      life: 20,
      maxLife: 20
    });
  }

  // Spawn asteroid
  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size,
      speed: Math.random() * 2 + gameState.scrollSpeed,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      health: Math.floor(size / 10)
    });
  }

  // Spawn astronaut
  function spawnAstronaut() {
    astronauts.push({
      x: Math.random() * (canvas.width - 30) + 15,
      y: -30,
      size: 25,
      speed: gameState.scrollSpeed * 0.8,
      wave: Math.random() * Math.PI * 2,
      waveSpeed: 0.05,
      rescued: false
    });
  }

  // Initialize game
  function init() {
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.background = '#000';
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
        <div>Score: <span id="rr-score">0</span></div>
        <div>Lives: <span id="rr-lives">3</span></div>
        <div>Fuel: <span id="rr-fuel">100</span>%</div>
        <div>Rescued: <span id="rr-rescued">0</span></div>
        <div>High: <span id="rr-highscore">${gameState.highScore}</span></div>
      </div>
    `;
    container.style.position = 'relative';
    container.appendChild(uiDiv);

    // Create controls overlay
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      color: #888;
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      text-align: center;
      pointer-events: none;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    `;
    controlsDiv.textContent = 'Arrow Keys: Move | Space: Boost | P: Pause';
    container.appendChild(controlsDiv);

    initStars();
    loadData();
    gameState.running = true;
    showStartScreen();
    gameLoop();
  }

  // Show start screen
  function showStartScreen() {
    const startOverlay = document.createElement('div');
    startOverlay.id = 'rr-start-overlay';
    startOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #000428 0%, #004e92 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    `;
    
    startOverlay.innerHTML = `
      <div style="text-align: center; color: white; font-family: Arial, sans-serif;">
        <h1 style="font-size: 42px; margin-bottom: 20px; text-shadow: 0 0 20px #00d4ff;">🚀 Rocket Rescue</h1>
        <p style="font-size: 16px; margin-bottom: 25px; color: #aaa;">Save stranded astronauts in deep space!</p>
        <div style="text-align: left; display: inline-block; margin-bottom: 25px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
          <p style="margin: 6px 0;">⬆️⬅️➡️ <strong>Arrow Keys:</strong> Pilot your rocket</p>
          <p style="margin: 6px 0;">⚡ <strong>Space:</strong> Boost (uses extra fuel)</p>
          <p style="margin: 6px 0;">🧑‍🚀 <strong>Mission:</strong> Rescue astronauts</p>
          <p style="margin: 6px 0;">☄️ <strong>Warning:</strong> Avoid asteroids!</p>
          <p style="margin: 6px 0;">⛽ <strong>Fuel:</strong> Rescue gives +10% fuel</p>
        </div>
        <button id="rr-start-btn" style="
          padding: 15px 40px;
          font-size: 24px;
          font-weight: bold;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
          transition: all 0.3s;
        ">LAUNCH 🚀</button>
        <p style="margin-top: 20px; color: #888; font-size: 14px;">High Score: ${gameState.highScore}</p>
      </div>
    `;
    
    container.appendChild(startOverlay);
    
    const startBtn = document.getElementById('rr-start-btn');
    startBtn.addEventListener('mouseenter', () => {
      startBtn.style.transform = 'scale(1.1)';
      startBtn.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.6)';
    });
    startBtn.addEventListener('mouseleave', () => {
      startBtn.style.transform = 'scale(1)';
      startBtn.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.4)';
    });
    startBtn.addEventListener('click', () => {
      gameState.started = true;
      startOverlay.remove();
    });
  }

  // Handle input
  function handleInput() {
    if (!gameState.running || gameState.paused || gameState.gameOver) return;

    // Rotation based on left/right
    if (keys['ArrowLeft']) {
      rocket.targetAngle = -0.3;
      rocket.velX -= rocket.thrustPower * 0.5;
    } else if (keys['ArrowRight']) {
      rocket.targetAngle = 0.3;
      rocket.velX += rocket.thrustPower * 0.5;
    } else {
      rocket.targetAngle = 0;
    }

    // Vertical thrust
    if (keys['ArrowUp']) {
      rocket.velY -= rocket.thrustPower;
      gameState.fuel = Math.max(0, gameState.fuel - fuelDrainRate);
      // Thrust particles
      if (Math.random() > 0.5) {
        createParticles(
          rocket.x,
          rocket.y + rocket.height / 2,
          `hsl(${Math.random() * 60 + 15}, 100%, 60%)`,
          2
        );
      }
    }
    if (keys['ArrowDown']) {
      rocket.velY += rocket.thrustPower * 0.5;
      gameState.fuel = Math.max(0, gameState.fuel - fuelDrainRate * 0.5);
    }

    // Boost
    if (keys[' '] && gameState.fuel > 10) {
      rocket.velX *= 1.05;
      rocket.velY *= 1.05;
      gameState.fuel = Math.max(0, gameState.fuel - fuelDrainRate * 2);
      createParticles(
        rocket.x,
        rocket.y + rocket.height / 2,
        '#00ffff',
        1
      );
    }
  }

  // Update game state
  function update() {
    if (!gameState.running || gameState.paused || gameState.gameOver || !gameState.started) return;

    const now = Date.now();

    // Update rocket
    handleInput();
    
    rocket.velX *= rocket.friction;
    rocket.velY *= rocket.friction;
    
    // Limit speed
    const speed = Math.sqrt(rocket.velX ** 2 + rocket.velY ** 2);
    if (speed > rocket.maxSpeed) {
      rocket.velX = (rocket.velX / speed) * rocket.maxSpeed;
      rocket.velY = (rocket.velY / speed) * rocket.maxSpeed;
    }

    rocket.x += rocket.velX;
    rocket.y += rocket.velY;

    // Smooth angle rotation
    rocket.angle += (rocket.targetAngle - rocket.angle) * 0.2;

    // Boundary collision
    if (rocket.x < 0) {
      rocket.x = 0;
      rocket.velX *= -0.5;
    }
    if (rocket.x > canvas.width - rocket.width) {
      rocket.x = canvas.width - rocket.width;
      rocket.velX *= -0.5;
    }
    if (rocket.y < 0) {
      rocket.y = 0;
      rocket.velY *= -0.5;
    }
    if (rocket.y > canvas.height - rocket.height) {
      rocket.y = canvas.height - rocket.height;
      rocket.velY *= -0.5;
    }

    // Update stars
    stars.forEach(star => {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });

    // Spawn asteroids
    if (now - lastAsteroidSpawn > 1500 - gameState.level * 50) {
      spawnAsteroid();
      lastAsteroidSpawn = now;
    }

    // Spawn astronauts
    if (now - lastAstronautSpawn > 3000 - gameState.level * 100) {
      spawnAstronaut();
      lastAstronautSpawn = now;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const ast = asteroids[i];
      ast.y += ast.speed;
      ast.rotation += ast.rotationSpeed;

      // Check collision with rocket
      const dx = (rocket.x + rocket.width / 2) - (ast.x + ast.size / 2);
      const dy = (rocket.y + rocket.height / 2) - (ast.y + ast.size / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < (rocket.width / 2 + ast.size / 2) * 0.8) {
        createExplosion(ast.x + ast.size / 2, ast.y + ast.size / 2, ast.size);
        createParticles(ast.x + ast.size / 2, ast.y + ast.size / 2, '#ff4444', 15);
        asteroids.splice(i, 1);
        gameState.lives--;
        updateUI();
        
        if (gameState.lives <= 0) {
          endGame();
        }
        continue;
      }

      // Remove off-screen asteroids
      if (ast.y > canvas.height + ast.size) {
        asteroids.splice(i, 1);
      }
    }

    // Update astronauts
    for (let i = astronauts.length - 1; i >= 0; i--) {
      const astro = astronauts[i];
      astro.y += astro.speed;
      astro.wave += astro.waveSpeed;

      // Check rescue collision
      const dx = (rocket.x + rocket.width / 2) - astro.x;
      const dy = (rocket.y + rocket.height / 2) - astro.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30 && !astro.rescued) {
        astro.rescued = true;
        gameState.rescued++;
        gameState.score += 50;
        gameState.fuel = Math.min(100, gameState.fuel + 10); // Fuel bonus
        createParticles(astro.x, astro.y, '#00ff00', 20);
        updateUI();
      }

      // Remove rescued or off-screen astronauts
      if (astro.rescued || astro.y > canvas.height + 30) {
        if (!astro.rescued && astro.y > canvas.height) {
          // Penalty for missing astronaut
          gameState.score = Math.max(0, gameState.score - 10);
        }
        astronauts.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.velX;
      p.y += p.velY;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
      const exp = explosions[i];
      exp.size += (exp.maxSize - exp.size) * 0.3;
      exp.life--;
      if (exp.life <= 0) {
        explosions.splice(i, 1);
      }
    }

    // Passive score increase
    gameState.score += 0.1;

    // Level progression
    if (gameState.rescued > 0 && gameState.rescued % 5 === 0 && gameState.rescued !== 0) {
      if (gameState.level < 10) {
        gameState.level++;
        gameState.scrollSpeed += 0.3;
        createParticles(canvas.width / 2, canvas.height / 2, '#ffff00', 30);
      }
    }

    // Fuel depletion
    if (gameState.fuel <= 0) {
      gameState.fuel = 0;
      rocket.thrustPower = 0.1; // Limited movement without fuel
    } else {
      rocket.thrustPower = 0.3;
    }

    updateUI();
  }

  // Render game
  function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    stars.forEach(star => {
      ctx.fillStyle = 'white';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw explosions
    explosions.forEach(exp => {
      const alpha = exp.life / exp.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Outer ring
      ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.size, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner ring
      ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();
    });

    // Draw particles
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // Draw asteroids
    asteroids.forEach(ast => {
      ctx.save();
      ctx.translate(ast.x + ast.size / 2, ast.y + ast.size / 2);
      ctx.rotate(ast.rotation);
      
      // Asteroid body
      ctx.fillStyle = '#666';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = ast.size / 2 * (0.8 + Math.random() * 0.4);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      // Asteroid details
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.arc(-ast.size / 4, -ast.size / 4, ast.size / 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ast.size / 4, ast.size / 4, ast.size / 10, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw astronauts
    astronauts.forEach(astro => {
      if (astro.rescued) return;
      
      const wave = Math.sin(astro.wave) * 3;
      
      ctx.save();
      ctx.translate(astro.x, astro.y);
      
      // Helmet
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.arc(0, -5, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Visor
      ctx.fillStyle = '#003366';
      ctx.beginPath();
      ctx.arc(0, -5, 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Body
      ctx.fillStyle = '#fff';
      ctx.fillRect(-6, 5, 12, 15);
      
      // Arms (waving)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(-6, 8);
      ctx.lineTo(-10 + wave, 5);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(6, 8);
      ctx.lineTo(10 - wave, 5);
      ctx.stroke();
      
      // Legs
      ctx.beginPath();
      ctx.moveTo(-3, 20);
      ctx.lineTo(-4, 28);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(3, 20);
      ctx.lineTo(4, 28);
      ctx.stroke();
      
      // SOS signal
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SOS', 0, -20);
      
      ctx.restore();
    });

    // Draw rocket
    ctx.save();
    ctx.translate(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2);
    ctx.rotate(rocket.angle);
    
    // Rocket body
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(12, 10);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.fill();
    
    // Rocket window
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Rocket fins
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(-12, 10);
    ctx.lineTo(-18, 20);
    ctx.lineTo(-8, 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(12, 10);
    ctx.lineTo(18, 20);
    ctx.lineTo(8, 15);
    ctx.closePath();
    ctx.fill();
    
    // Thrust flame (when moving up)
    if (keys['ArrowUp'] && gameState.fuel > 0) {
      const flameSize = 15 + Math.random() * 5;
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.moveTo(-8, 15);
      ctx.lineTo(0, 15 + flameSize);
      ctx.lineTo(8, 15);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.moveTo(-4, 15);
      ctx.lineTo(0, 15 + flameSize * 0.6);
      ctx.lineTo(4, 15);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();

    // Draw fuel warning
    if (gameState.fuel < 20) {
      ctx.fillStyle = gameState.fuel < 10 ? '#ff0000' : '#ffaa00';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LOW FUEL!', canvas.width / 2, 50);
    }

    // Draw level up notification
    if (gameState.rescued % 5 === 0 && gameState.rescued > 0 && particles.length > 20) {
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`LEVEL ${gameState.level}`, canvas.width / 2, canvas.height / 2);
    }

    // Game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${Math.floor(gameState.score)}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Rescued: ${gameState.rescued}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText(`High Score: ${gameState.highScore}`, canvas.width / 2, canvas.height / 2 + 60);
      
      ctx.font = '16px Arial';
      ctx.fillStyle = '#888';
      ctx.fillText('Click to retry', canvas.width / 2, canvas.height / 2 + 100);
    }

    // Pause screen
    if (gameState.paused && !gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
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
    document.getElementById('rr-score').textContent = Math.floor(gameState.score);
    document.getElementById('rr-lives').textContent = gameState.lives;
    document.getElementById('rr-fuel').textContent = Math.floor(gameState.fuel);
    document.getElementById('rr-rescued').textContent = gameState.rescued;
    document.getElementById('rr-highscore').textContent = gameState.highScore;
  }

  // End game
  function endGame() {
    gameState.gameOver = true;
    if (gameState.score > gameState.highScore) {
      gameState.highScore = Math.floor(gameState.score);
      saveData();
    }
  }

  // Reset game
  function resetGame() {
    gameState.running = true;
    gameState.paused = false;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.fuel = 100;
    gameState.rescued = 0;
    gameState.gameOver = false;
    gameState.level = 1;
    gameState.scrollSpeed = 2;
    
    rocket.x = 200;
    rocket.y = 500;
    rocket.velX = 0;
    rocket.velY = 0;
    rocket.angle = 0;
    rocket.targetAngle = 0;
    
    asteroids.length = 0;
    astronauts.length = 0;
    particles.length = 0;
    explosions.length = 0;
    
    lastAsteroidSpawn = 0;
    lastAstronautSpawn = 0;
    
    updateUI();
  }

  // Event listeners
  function handleKeyDown(e) {
    keys[e.key] = true;
    
    if (e.key === 'p' || e.key === 'P') {
      if (!gameState.gameOver) {
        gameState.paused = !gameState.paused;
      }
    }
    
    // Prevent arrow key scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
  }

  function handleKeyUp(e) {
    keys[e.key] = false;
  }

  function handleClick() {
    if (gameState.gameOver) {
      resetGame();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('click', handleClick);

  // Start game
  init();

  // Cleanup function
  return function cleanup() {
    gameState.running = false;
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    canvas.removeEventListener('click', handleClick);
    container.innerHTML = '';
  };
}
