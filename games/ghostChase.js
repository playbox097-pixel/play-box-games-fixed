// games/ghostChase.js
// Ghost Chase: Arcade-style, inspired by Ghost Grabbers
import { sound } from '../sound.js';

export async function mount(container) {
  // Maze grid (1 = wall, 0 = open)
  const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.background = '#181818';
  canvas.style.border = '4px solid #333';
  canvas.style.borderRadius = '8px';
  container.appendChild(canvas);

  let gameRunning = false;
  let gameStarted = false;
  let score = 0;
  let timeLeft = 60;
  let level = 1;
  let ghostsCaught = 0;
  let highscore = 0;

  // Player
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 4,
    color: '#ffe066'
  };

  // Ghosts
  let ghosts = [];
  const ghostColors = ['#f03e3e', '#74c0fc', '#ff922b', '#845ef7', '#63e6be'];

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

  // --- Maze pathfinding logic for ghosts to reach the table ---
  // Table position (for example, center of the maze)
  const table = { x: 5, y: 5 };

  // Helper: BFS pathfinding for grid
  function findPathBFS(start, goal, map) {
    const queue = [[start.x, start.y]];
    const visited = Array.from({ length: map.length }, () => Array(map[0].length).fill(false));
    const prev = Array.from({ length: map.length }, () => Array(map[0].length).fill(null));
    visited[start.y][start.x] = true;
    const dirs = [
      [0, -1], // up
      [0, 1],  // down
      [-1, 0], // left
      [1, 0],  // right
    ];
    while (queue.length) {
      const [x, y] = queue.shift();
      if (x === goal.x && y === goal.y) break;
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (
          nx >= 0 && nx < map[0].length &&
          ny >= 0 && ny < map.length &&
          map[ny][nx] !== 1 &&
          !visited[ny][nx]
        ) {
          queue.push([nx, ny]);
          visited[ny][nx] = true;
          prev[ny][nx] = [x, y];
        }
      }
    }
    // Reconstruct path
    let path = [];
    let curr = [goal.x, goal.y];
    while (curr && !(curr[0] === start.x && curr[1] === start.y)) {
      path.push(curr);
      curr = prev[curr[1]][curr[0]];
    }
    path.reverse();
    return path;
  }

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
      changeDirectionTimer: 0
    });
  }

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

  const timerInterval = setInterval(() => {
    if (gameRunning && gameStarted) {
      timeLeft--;
      if (timeLeft <= 0) {
        gameRunning = false;
        endGame();
      }
    }
  }, 1000);

  function updatePlayer() {
    if (keys.w || keys.ArrowUp) player.y -= player.speed;
    if (keys.s || keys.ArrowDown) player.y += player.speed;
    if (keys.a || keys.ArrowLeft) player.x -= player.speed;
    if (keys.d || keys.ArrowRight) player.x += player.speed;
    while (ghosts.length < 3 + level) spawnGhost();
  }

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

  function drawMaze() {
    const cellSize = 40;
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        if (maze[y][x] === 1) {
          ctx.fillStyle = '#222';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.strokeStyle = '#444';
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-7, -5, 4, 0, Math.PI * 2);
    ctx.arc(7, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 3, 10, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  function drawGhost(ghost) {
    ctx.save();
    ctx.translate(ghost.x, ghost.y);
    ctx.shadowBlur = 15;
    ctx.shadowColor = ghost.color;
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    ctx.arc(0, 0, ghost.size, Math.PI, 0);
    for (let i = 0; i <= 4; i++) {
      const x = -ghost.size + (i * ghost.size / 2);
      const y = (i % 2 === 0) ? ghost.size : ghost.size - 8;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.quadraticCurveTo(x - ghost.size / 4, ghost.size + 5, x, y);
    }
    ctx.closePath();
    ctx.fill();
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
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('WASD or Arrow Keys to move', canvas.width / 2, canvas.height - 20);
  }

  function endGame() {
    sound.playGameOver && sound.playGameOver();
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
    ctx.fillStyle = '#ffe066';
    ctx.fillText('Refresh to play again', canvas.width / 2, canvas.height / 2 + 100);
  }

  function updateGhosts() {
    if (Math.random() < 0.3) spawnGhost();
    for (const ghost of ghosts) {
      // Convert ghost position to grid
      const gx = Math.round(ghost.x / 40);
      const gy = Math.round(ghost.y / 40);
      const px = Math.round(player.x / 40);
      const py = Math.round(player.y / 40);
      const path = findPathBFS({ x: gx, y: gy }, { x: px, y: py }, maze);
      if (path.length > 0) {
        // Move ghost one step toward the player
        const [nx, ny] = path[0];
        ghost.x = nx * 40;
        ghost.y = ny * 40;
      }
    }
  }

  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % canvas.width;
      const y = (i * 73) % canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }
    drawMaze();
    if (!gameStarted) {
      requestAnimationFrame(gameLoop);
      return;
    }
    if (!gameRunning) return;
    updatePlayer();
    updateGhosts();
    updateParticles();
    ghosts.forEach(drawGhost);
    drawParticles();
    drawPlayer();
    drawUI();
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    if (!gameStarted) {
      gameStarted = true;
      gameRunning = true;
      score = 0;
      timeLeft = 60;
      level = 1;
      ghostsCaught = 0;
      ghosts = [];
      particles = [];
      player.x = canvas.width / 2;
      player.y = canvas.height / 2;
      for (let i = 0; i < 3 + level; i++) spawnGhost();
    }
  }

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

  // Start screen
  const startScreen = document.createElement('div');
  startScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #181818 0%, #333 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;
  const startPanel = document.createElement('div');
  startPanel.style.cssText = `
    background: rgba(0, 0, 0, 0.8);
    border: 3px solid #ffe066;
    borderRadius: 20px;
    padding: 3rem;
    max-width: 600px;
    text-align: center;
    box-shadow: 0 0 40px #ffe06699, inset 0 0 20px #ffe06644;
  `;
  const startTitle = document.createElement('h1');
  startTitle.textContent = '👻 GHOST CHASE';
  startTitle.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 3rem;
    color: #ffe066;
    font-weight: bold;
  `;
  const startDesc = document.createElement('p');
  startDesc.textContent = 'Chase and catch ghosts for points! Level up for more challenge. 60 seconds to score big!';
  startDesc.style.cssText = `
    margin: 0 0 1.5rem 0;
    font-size: 1.1rem;
    color: #fff;
    line-height: 1.6;
  `;
  const startInstructions = document.createElement('div');
  startInstructions.innerHTML = `
    <div style="background: rgba(255, 224, 102, 0.1); border: 2px solid #ffe066; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; text-align: left;">
      <div style="color: #ffe066; font-size: 1.1rem; margin-bottom: 1rem; font-weight: bold;">🎮 HOW TO PLAY:</div>
      <div style="color: #fff; line-height: 2; font-size: 0.95rem;">
        👻 Chase the ghosts<br>
        🎯 Touch them to catch them<br>
        ⚡ Faster ghosts = more points<br>
        📈 Level up every 5 ghosts<br>
        ⏱️ 60 seconds to score big
      </div>
      <div style="color: #ffe066; margin-top: 1rem; font-weight: bold;">WASD or Arrow Keys to move</div>
    </div>
  `;
  const startButton = document.createElement('button');
  startButton.textContent = '▶ START GAME';
  startButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.3rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 3px solid #ffe066;
    border-radius: 12px;
    background: linear-gradient(135deg, #ffe066 0%, #ff922b 100%);
    color: #222;
    font-weight: bold;
    transition: all 0.3s;
    box-shadow: 0 0 20px #ffe06688;
    text-shadow: 0 0 10px #0008;
  `;
  const hubButton = document.createElement('button');
  hubButton.textContent = '🏠 BACK TO HUB';
  hubButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 2px solid #ffe066;
    border-radius: 12px;
    background: transparent;
    color: #ffe066;
    font-weight: bold;
    transition: all 0.3s;
  `;
  startButton.addEventListener('mouseenter', () => {
    startButton.style.transform = 'scale(1.05)';
    startButton.style.boxShadow = '0 0 30px #ffe066cc';
  });
  startButton.addEventListener('mouseleave', () => {
    startButton.style.transform = 'scale(1)';
    startButton.style.boxShadow = '0 0 20px #ffe06688';
  });
  hubButton.addEventListener('mouseenter', () => {
    hubButton.style.background = 'rgba(255, 224, 102, 0.2)';
    hubButton.style.borderColor = '#ff922b';
    hubButton.style.color = '#ff922b';
  });
  hubButton.addEventListener('mouseleave', () => {
    hubButton.style.background = 'transparent';
    hubButton.style.borderColor = '#ffe066';
    hubButton.style.color = '#ffe066';
  });
  startButton.addEventListener('click', () => {
    sound.playClick && sound.playClick();
    startScreen.remove();
    startGame();
    setTimeout(() => {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });
  hubButton.addEventListener('click', () => {
    sound.playClick && sound.playClick();
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
    background: #ffe066ee;
    color: #222;
    padding: 0.8rem 1.5rem;
    border-radius: 25px;
    font-weight: bold;
    z-index: 999;
    animation: bounce 2s infinite;
    box-shadow: 0 4px 15px #ffe06644;
  `;
  container.appendChild(scrollIndicator);
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
    if (startScreen && startScreen.parentNode) startScreen.remove();
    if (scrollIndicator && scrollIndicator.parentNode) scrollIndicator.remove();
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
  // ...existing code...
}