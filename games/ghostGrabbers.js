// Ghost Grabbers - Top-down 2D chase game
// Catch mischievous ghosts before time runs out!

import { sound } from '../sound.js';

export async function mount(container) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.background = '#1a0033';
  canvas.style.border = '4px solid #4a0080';
  canvas.style.borderRadius = '8px';
  container.appendChild(canvas);

  let gameRunning = false;
  let gameStarted = false;
  let score = 0;
  let timeLeft = 60;
  let level = 1;
  let ghostsCaught = 0;

  // Player
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 4,
    color: '#00ff88'
  };

  // Ghosts
  let ghosts = [];
  const ghostColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff6600', '#ff0088'];

  // Keys
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false
  };

  // Particles
  let particles = [];

  // Initialize ghosts
  function spawnGhost() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(edge) {
      case 0: x = Math.random() * canvas.width; y = -30; break;
      case 1: x = canvas.width + 30; y = Math.random() * canvas.height; break;
      case 2: x = Math.random() * canvas.width; y = canvas.height + 30; break;
      case 3: x = -30; y = Math.random() * canvas.height; break;
    }

    ghosts.push({
      x,
      y,
      size: 25,
      speed: 1 + level * 0.3,
      color: ghostColors[Math.floor(Math.random() * ghostColors.length)],
      angle: Math.random() * Math.PI * 2,
      changeDirectionTimer: 0,
      scared: false,
      scaredTimer: 0
    });
  }

  // Don't spawn initial ghosts here - wait for game to start
  
  // Create particles
  function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 4 + 2,
        color,
        life: 1
      });
    }
  }

  // Key handlers
  function handleKeyDown(e) {
    if (e.key in keys) {
      keys[e.key] = true;
      e.preventDefault();
    }
  }

  function handleKeyUp(e) {
    if (e.key in keys) {
      keys[e.key] = false;
      e.preventDefault();
    }
  }

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Timer
  const timerInterval = setInterval(() => {
    if (gameRunning && gameStarted) {
      timeLeft--;
      if (timeLeft <= 0) {
        gameRunning = false;
        endGame();
      }
    }
  }, 1000);

  // Update player
  function updatePlayer() {
    if (keys.w || keys.ArrowUp) player.y -= player.speed;
    if (keys.s || keys.ArrowDown) player.y += player.speed;
    if (keys.a || keys.ArrowLeft) player.x -= player.speed;
    if (keys.d || keys.ArrowRight) player.x += player.speed;

    // Boundaries
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
  }

  // Update ghosts
  function updateGhosts() {
    ghosts.forEach((ghost, index) => {
      ghost.changeDirectionTimer++;

      if (ghost.scared) {
        ghost.scaredTimer--;
        if (ghost.scaredTimer <= 0) {
          ghost.scared = false;
        }
        // Run away from player
        const dx = ghost.x - player.x;
        const dy = ghost.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          ghost.x += (dx / dist) * ghost.speed * 1.5;
          ghost.y += (dy / dist) * ghost.speed * 1.5;
        }
      } else {
        // Change direction occasionally
        if (ghost.changeDirectionTimer > 60 + Math.random() * 60) {
          ghost.angle = Math.random() * Math.PI * 2;
          ghost.changeDirectionTimer = 0;
        }

        // Move in current direction
        ghost.x += Math.cos(ghost.angle) * ghost.speed;
        ghost.y += Math.sin(ghost.angle) * ghost.speed;

        // Sometimes chase player
        if (Math.random() < 0.02) {
          const dx = player.x - ghost.x;
          const dy = player.y - ghost.y;
          ghost.angle = Math.atan2(dy, dx);
        }
      }

      // Wrap around edges
      if (ghost.x < -50) ghost.x = canvas.width + 50;
      if (ghost.x > canvas.width + 50) ghost.x = -50;
      if (ghost.y < -50) ghost.y = canvas.height + 50;
      if (ghost.y > canvas.height + 50) ghost.y = -50;

      // Check collision with player
      const dx = ghost.x - player.x;
      const dy = ghost.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < player.size + ghost.size) {
        // Caught a ghost!
        sound.playScore();
        createParticles(ghost.x, ghost.y, ghost.color);
        ghosts.splice(index, 1);
        score += 10 + level * 5;
        ghostsCaught++;

        // Level up every 5 ghosts
        if (ghostsCaught % 5 === 0) {
          level++;
          sound.playWin();
          // Spawn more ghosts for new level
          for (let i = 0; i < 2; i++) {
            spawnGhost();
          }
        }

        // Spawn new ghost
        spawnGhost();
      }
    });

    // Ensure minimum ghost count
    while (ghosts.length < 3 + level) {
      spawnGhost();
    }
  }

  // Update particles
  function updateParticles() {
    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= 0.02;
      return p.life > 0;
    });
  }

  // Draw player
  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    
    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-7, -5, 4, 0, Math.PI * 2);
    ctx.arc(7, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Smile
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 3, 10, 0, Math.PI);
    ctx.stroke();
    
    ctx.restore();
  }

  // Draw ghost
  function drawGhost(ghost) {
    ctx.save();
    ctx.translate(ghost.x, ghost.y);
    
    if (ghost.scared) {
      ctx.globalAlpha = 0.6;
      ghost.color = '#8888ff';
    }
    
    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = ghost.color;
    
    // Body
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    ctx.arc(0, 0, ghost.size, Math.PI, 0);
    
    // Wavy bottom
    for (let i = 0; i <= 4; i++) {
      const x = -ghost.size + (i * ghost.size / 2);
      const y = (i % 2 === 0) ? ghost.size : ghost.size - 8;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.quadraticCurveTo(x - ghost.size / 4, ghost.size + 5, x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Eyes
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-8, -3, 6, 0, Math.PI * 2);
    ctx.arc(8, -3, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-6, -3, 3, 0, Math.PI * 2);
    ctx.arc(10, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  // Draw particles
  function drawParticles() {
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Draw UI
  function drawUI() {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Level: ${level}`, 20, 70);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = timeLeft <= 10 ? '#ff3333' : '#fff';
    ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 20, 40);
    
    ctx.fillStyle = '#fff';
    ctx.fillText(`Ghosts: ${ghostsCaught}`, canvas.width - 20, 70);
    
    // Instructions
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('WASD or Arrow Keys to move', canvas.width / 2, canvas.height - 20);
  }

  // End game
  function endGame() {
    sound.playGameOver();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TIME\'S UP!', canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.font = '32px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Ghosts Caught: ${ghostsCaught}`, canvas.width / 2, canvas.height / 2 + 50);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('Refresh to play again', canvas.width / 2, canvas.height / 2 + 100);

    // Notify parent of game end
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({ type: 'game-end' }, '*');
    }
  }

  // Game loop
  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background stars
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % canvas.width;
      const y = (i * 73) % canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }

    if (!gameStarted) {
      requestAnimationFrame(gameLoop);
      return;
    }

    if (!gameRunning) {
      return;
    }

    updatePlayer();
    updateGhosts();
    updateParticles();

    ghosts.forEach(drawGhost);
    drawParticles();
    drawPlayer();
    drawUI();

    requestAnimationFrame(gameLoop);
  }

  // Start game handler
  function startGame() {
    if (!gameStarted) {
      gameStarted = true;
      gameRunning = true;
      
      // Reset game state
      score = 0;
      timeLeft = 60;
      level = 1;
      ghostsCaught = 0;
      ghosts = [];
      particles = [];
      
      // Reset player position
      player.x = canvas.width / 2;
      player.y = canvas.height / 2;
      
      // Spawn initial ghosts
      for (let i = 0; i < 3 + level; i++) {
        spawnGhost();
      }
    }
  }

  // Handle start input
  function handleStartInput(e) {
    if (!gameStarted) {
      if (e.type === 'keydown' && e.key === ' ') {
        startGame();
      } else if (e.type === 'click') {
        startGame();
      }
    }
  }

  canvas.addEventListener('click', handleStartInput);
  document.addEventListener('keydown', handleStartInput);

  // Create Snake-style start screen
  const startScreen = document.createElement('div');
  startScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #1a0033 0%, #4a0080 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;

  const startPanel = document.createElement('div');
  startPanel.style.cssText = `
    background: rgba(0, 0, 0, 0.8);
    border: 3px solid #ff00ff;
    border-radius: 20px;
    padding: 3rem;
    max-width: 600px;
    text-align: center;
    box-shadow: 0 0 40px rgba(255, 0, 255, 0.6), inset 0 0 20px rgba(255, 0, 255, 0.2);
  `;

  const startTitle = document.createElement('h1');
  startTitle.textContent = '👻 GHOST GRABBERS';
  startTitle.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 3rem;
    background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 20px rgba(255, 0, 255, 0.8));
    font-weight: bold;
  `;

  const startDesc = document.createElement('p');
  startDesc.textContent = 'Chase and catch colorful ghosts in this spooky top-down game! Each ghost caught increases your score. Level up every 5 ghosts for more challenge!';
  startDesc.style.cssText = `
    margin: 0 0 1.5rem 0;
    font-size: 1.1rem;
    color: #00ffff;
    line-height: 1.6;
  `;

  const startInstructions = document.createElement('div');
  startInstructions.innerHTML = `
    <div style="background: rgba(138, 43, 226, 0.2); border: 2px solid #8a2be2; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; text-align: left;">
      <div style="color: #ffff00; font-size: 1.1rem; margin-bottom: 1rem; font-weight: bold;">🎮 HOW TO PLAY:</div>
      <div style="color: #fff; line-height: 2; font-size: 0.95rem;">
        👾 Chase the colorful ghosts<br>
        🎯 Touch them to catch them<br>
        ⚡ Faster ghosts = more points<br>
        📈 Level up every 5 ghosts<br>
        ⏱️ 60 seconds to score big
      </div>
      <div style="color: #00ff88; margin-top: 1rem; font-weight: bold;">WASD or Arrow Keys to move</div>
    </div>
  `;

  const startButton = document.createElement('button');
  startButton.textContent = '▶ START GAME';
  startButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.3rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 3px solid #ff00ff;
    border-radius: 12px;
    background: linear-gradient(135deg, #ff00ff 0%, #8a2be2 100%);
    color: white;
    font-weight: bold;
    transition: all 0.3s;
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  `;

  const hubButton = document.createElement('button');
  hubButton.textContent = '🏠 BACK TO HUB';
  hubButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 2px solid #00ffff;
    border-radius: 12px;
    background: transparent;
    color: #00ffff;
    font-weight: bold;
    transition: all 0.3s;
  `;

  startButton.addEventListener('mouseenter', () => {
    startButton.style.transform = 'scale(1.05)';
    startButton.style.boxShadow = '0 0 30px rgba(255, 0, 255, 0.8)';
  });
  startButton.addEventListener('mouseleave', () => {
    startButton.style.transform = 'scale(1)';
    startButton.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.5)';
  });

  hubButton.addEventListener('mouseenter', () => {
    hubButton.style.background = 'rgba(0, 255, 255, 0.2)';
    hubButton.style.borderColor = '#ffff00';
    hubButton.style.color = '#ffff00';
  });
  hubButton.addEventListener('mouseleave', () => {
    hubButton.style.background = 'transparent';
    hubButton.style.borderColor = '#00ffff';
    hubButton.style.color = '#00ffff';
  });

  startButton.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    startGame();
    setTimeout(() => {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  hubButton.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    location.hash = '#/';
  });

  startPanel.append(startTitle, startDesc, startInstructions, startButton, hubButton);
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
    background: rgba(255, 0, 255, 0.9);
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
    clearInterval(timerInterval);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    document.removeEventListener('keydown', handleStartInput);
    canvas.removeEventListener('click', handleStartInput);
    if (startScreen && startScreen.parentNode) {
      startScreen.remove();
    }
    if (scrollIndicator && scrollIndicator.parentNode) {
      scrollIndicator.remove();
    }
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
}
