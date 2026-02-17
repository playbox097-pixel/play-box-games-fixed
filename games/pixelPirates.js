export function mount(container) {
  const sound = window.gameSound || {
    playWin: () => {},
    playLose: () => {},
    playMove: () => {},
    playScore: () => {}
  };

  // Create game UI
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#0a192f;';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;gap:10px;padding:10px;background:#1e3a5f;border-bottom:2px solid #2a5a8f;flex-wrap:wrap;align-items:center;';

  const title = document.createElement('div');
  title.textContent = '🏴‍☠️ PIXEL PIRATES';
  title.style.cssText = 'font-size:24px;font-weight:bold;color:#ffd700;text-shadow:2px 2px #000;';

  const goldBadge = document.createElement('div');
  goldBadge.style.cssText = 'padding:8px 16px;background:#ffd700;border-radius:8px;color:#000;font-weight:bold;';

  const healthBadge = document.createElement('div');
  healthBadge.style.cssText = 'padding:8px 16px;background:#c41e3a;border-radius:8px;color:#fff;font-weight:bold;';

  const enemyHealthBadge = document.createElement('div');
  enemyHealthBadge.style.cssText = 'padding:8px 16px;background:#5a2d2d;border-radius:8px;color:#fff;font-weight:bold;';

  const turnBadge = document.createElement('div');
  turnBadge.style.cssText = 'padding:8px 16px;background:#10b981;border-radius:8px;color:#fff;font-weight:bold;';

  const resetBtn = document.createElement('button');
  resetBtn.textContent = '🔄 NEW BATTLE';
  resetBtn.style.cssText = 'padding:8px 16px;background:#ef4444;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:14px;margin-left:auto;';
  resetBtn.onmouseover = () => resetBtn.style.background = '#dc2626';
  resetBtn.onmouseout = () => resetBtn.style.background = '#ef4444';

  toolbar.append(title, goldBadge, healthBadge, enemyHealthBadge, turnBadge, resetBtn);

  // Canvas wrapper
  const canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = 'flex:1;display:flex;justify-content:center;align-items:center;padding:20px;overflow:hidden;';

  const canvas = document.createElement('canvas');
  const WIDTH = 800;
  const HEIGHT = 600;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.style.cssText = 'border:3px solid #2a5a8f;background:#1a4d7a;box-shadow:0 8px 32px rgba(0,0,0,0.5);max-width:100%;height:auto;cursor:pointer;';

  canvasWrap.appendChild(canvas);
  wrap.append(toolbar, canvasWrap);
  container.appendChild(wrap);

  const ctx = canvas.getContext('2d');

  // Game state
  let gamePhase = 'start'; // start, shop, battle, victory, defeat
  let gold = 100;
  let playerHealth = 100;
  let enemyHealth = 100;
  let playerTurn = true;
  let round = 1;
  let enemiesDefeated = 0;
  
  // Animation state
  let attackAnimation = null; // { type: 'cannon'|'minigun', fromPlayer: boolean, frame: 0, maxFrames: 30 }
  
  // ============================================================================
  // ENEMY BOAT TYPES - 10 Total (7 Surface + 3 Underwater)
  // ============================================================================
  // All boats use existing mechanics: size, health, color, hitChance, reward
  // hitChance: { miss, half, full } - must sum to 1.0 exactly
  // Surface ships: Normal colors, standard sizes
  // Underwater ships: Smaller sizes, blue-green colors, harder to hit
  // ============================================================================
  
  const enemyBoatTypes = [
    // ========== SURFACE SHIPS (7) ==========
    
    // LIGHT SURFACE SHIPS - Fast & evasive
    { 
      name: 'Scout Sloop', 
      size: 0.55, 
      health: 50, 
      color: '#6b4423',
      hitChance: { miss: 0.40, half: 0.35, full: 0.25 },
      reward: 35,
      description: '⚡ Scout Ship'
    },
    { 
      name: 'Light Corvette', 
      size: 0.65, 
      health: 65, 
      color: '#5a3d2d',
      hitChance: { miss: 0.35, half: 0.35, full: 0.30 },
      reward: 45,
      description: '💨 Quick Strike'
    },
    
    // BALANCED SURFACE SHIPS - Standard difficulty
    { 
      name: 'War Sloop', 
      size: 0.75, 
      health: 75, 
      color: '#5a2d2d',
      hitChance: { miss: 0.25, half: 0.35, full: 0.40 },
      reward: 55,
      description: '⚖️ Balanced'
    },
    { 
      name: 'Battle Frigate', 
      size: 0.90, 
      health: 90, 
      color: '#4a3d2d',
      hitChance: { miss: 0.15, half: 0.35, full: 0.50 },
      reward: 70,
      description: '⚔️ Warship'
    },
    
    // HEAVY SURFACE SHIPS - Slow but tough
    { 
      name: 'Heavy Galleon', 
      size: 1.15, 
      health: 115, 
      color: '#3d2d1a',
      hitChance: { miss: 0.05, half: 0.25, full: 0.70 },
      reward: 90,
      description: '🎯 Big Target'
    },
    { 
      name: 'Ironclad Battleship', 
      size: 1.30, 
      health: 140, 
      color: '#2d2d2d',
      hitChance: { miss: 0, half: 0.15, full: 0.85 },
      reward: 120,
      description: '🛡️ Armored'
    },
    { 
      name: 'Dreadnought', 
      size: 1.50, 
      health: 160, 
      color: '#1a1a1a',
      hitChance: { miss: 0, half: 0.10, full: 0.90 },
      reward: 150,
      description: '👑 Flagship'
    },
    
    // ========== UNDERWATER SHIPS (3) ==========
    
    // STEALTH SUBMARINE - Very hard to hit
    { 
      name: 'Stealth Submarine', 
      size: 0.50, 
      health: 60, 
      color: '#1a4d5a',
      hitChance: { miss: 0.50, half: 0.30, full: 0.20 },
      reward: 80,
      description: '🌊 Submerged'
    },
    
    // ARMORED SUBMERSIBLE - Tanky underwater
    { 
      name: 'Deep Nautilus', 
      size: 0.70, 
      health: 100, 
      color: '#0d3d4a',
      hitChance: { miss: 0.35, half: 0.40, full: 0.25 },
      reward: 110,
      description: '🐚 Deep Diver'
    },
    
    // EXPERIMENTAL DEEP-SEA - High risk/reward
    { 
      name: 'Leviathan Sub', 
      size: 0.85, 
      health: 130, 
      color: '#0a2d3a',
      hitChance: { miss: 0.40, half: 0.35, full: 0.25 },
      reward: 140,
      description: '🐋 Legendary'
    }
  ];
  
  let currentEnemyBoat = null;
  
  // ============================================================================
  // WEAPONS SYSTEM - 20 Total Weapons
  // ============================================================================
  // All weapons use existing mechanics: damage (HP dealt) and loadTurns (turns to ready)
  // Organized by tier for game progression:
  //   - STARTER (25-50g): Low damage, fast reload - early game
  //   - EARLY (55-70g): Balanced options - establishing arsenal  
  //   - MID (85-130g): High damage or specialized - mid game dominance
  //   - LATE (140-180g): Elite weapons - serious firepower
  //   - EXPERIMENTAL (150-350g): Unique risk/reward profiles
  // ============================================================================
  
  let playerWeapons = {
    // STARTER WEAPONS (Cheap, basic)
    swivel: { owned: false, damage: 8, loadTurns: 1, currentLoad: 0, cost: 25 },
    cannon: { owned: false, damage: 30, loadTurns: 2, currentLoad: 0, cost: 50 },
    minigun: { owned: false, damage: 15, loadTurns: 1, currentLoad: 0, cost: 40 },
    musket: { owned: false, damage: 12, loadTurns: 1, currentLoad: 0, cost: 35 },
    
    // EARLY GAME WEAPONS (Affordable, reliable)
    lightCannon: { owned: false, damage: 22, loadTurns: 1, currentLoad: 0, cost: 60 },
    harpoon: { owned: false, damage: 35, loadTurns: 2, currentLoad: 0, cost: 70 },
    grapeshot: { owned: false, damage: 18, loadTurns: 1, currentLoad: 0, cost: 55 },
    chainshot: { owned: false, damage: 28, loadTurns: 2, currentLoad: 0, cost: 65 },
    
    // MID GAME WEAPONS (Powerful, expensive)
    heavyCannon: { owned: false, damage: 45, loadTurns: 3, currentLoad: 0, cost: 120 },
    carronade: { owned: false, damage: 40, loadTurns: 2, currentLoad: 0, cost: 100 },
    ballista: { owned: false, damage: 38, loadTurns: 2, currentLoad: 0, cost: 95 },
    gatling: { owned: false, damage: 25, loadTurns: 1, currentLoad: 0, cost: 85 },
    mortar: { owned: false, damage: 50, loadTurns: 3, currentLoad: 0, cost: 130 },
    
    // LATE GAME WEAPONS (Elite, very expensive)
    culverin: { owned: false, damage: 55, loadTurns: 3, currentLoad: 0, cost: 180 },
    drakeCannon: { owned: false, damage: 65, loadTurns: 4, currentLoad: 0, cost: 250 },
    bombard: { owned: false, damage: 70, loadTurns: 4, currentLoad: 0, cost: 280 },
    
    // EXPERIMENTAL WEAPONS (High risk/reward)
    rapidFire: { owned: false, damage: 10, loadTurns: 0, currentLoad: 0, cost: 150 },
    siegeCannon: { owned: false, damage: 80, loadTurns: 5, currentLoad: 0, cost: 350 },
    doubleBarrel: { owned: false, damage: 60, loadTurns: 3, currentLoad: 0, cost: 200 },
    longNine: { owned: false, damage: 48, loadTurns: 2, currentLoad: 0, cost: 140 },
    
    // ULTIMATE WEAPON (Playbux only)
    godCannon: { owned: false, damage: 1000000, loadTurns: 10, currentLoad: 0, cost: 1000, isPlaybux: true }
  };

  let enemyWeapons = {
    cannon: { damage: 25, loadTurns: 2, currentLoad: 0 },
    minigun: { damage: 12, loadTurns: 1, currentLoad: 0 }
  };

  // Shop items - organized by tier
  const shopItems = [
    // STARTER TIER (Row 1)
    { id: 'swivel', name: '🔫 Swivel Gun', description: 'Basic rapid fire (8)\nLoads instantly', cost: 25 },
    { id: 'musket', name: '🎯 Musket', description: 'Quick shot (12)\nLoads in 1 turn', cost: 35 },
    { id: 'minigun', name: '⚡ Mini Gun', description: 'Reliable damage (15)\nLoads in 1 turn', cost: 40 },
    { id: 'cannon', name: '💥 Cannon', description: 'Heavy damage (30)\nLoads in 2 turns', cost: 50 },
    
    // EARLY TIER (Row 2)
    { id: 'grapeshot', name: '🎲 Grapeshot', description: 'Scatter shot (18)\nLoads in 1 turn', cost: 55 },
    { id: 'lightCannon', name: '⚡ Light Cannon', description: 'Fast cannon (22)\nLoads in 1 turn', cost: 60 },
    { id: 'chainshot', name: '⛓️ Chain Shot', description: 'Anti-rigging (28)\nLoads in 2 turns', cost: 65 },
    { id: 'harpoon', name: '🔱 Harpoon', description: 'Piercing bolt (35)\nLoads in 2 turns', cost: 70 },
    
    // MID TIER (Row 3)
    { id: 'gatling', name: '🌀 Gatling Gun', description: 'Rotary fire (25)\nLoads in 1 turn', cost: 85 },
    { id: 'ballista', name: '🏹 Ballista', description: 'Giant bolt (38)\nLoads in 2 turns', cost: 95 },
    { id: 'carronade', name: '💣 Carronade', description: 'Smashing blow (40)\nLoads in 2 turns', cost: 100 },
    { id: 'heavyCannon', name: '🎯 Heavy Cannon', description: 'Devastating (45)\nLoads in 3 turns', cost: 120 },
    
    // LATE TIER (Row 4)
    { id: 'mortar', name: '🌋 Mortar', description: 'Explosive arc (50)\nLoads in 3 turns', cost: 130 },
    { id: 'longNine', name: '📏 Long Nine', description: 'Precision gun (48)\nLoads in 2 turns', cost: 140 },
    { id: 'rapidFire', name: '⚡ Rapid Fire', description: 'Instant shot (10)\nNo loading!', cost: 150 },
    { id: 'culverin', name: '🔥 Culverin', description: 'Long range (55)\nLoads in 3 turns', cost: 180 },
    
    // ELITE TIER (Row 5)
    { id: 'doubleBarrel', name: '🔫 Double Barrel', description: 'Twin blast (60)\nLoads in 3 turns', cost: 200 },
    { id: 'drakeCannon', name: '🐉 Drake Cannon', description: 'Legendary (65)\nLoads in 4 turns', cost: 250 },
    { id: 'bombard', name: '💀 Bombard', description: 'Siege weapon (70)\nLoads in 4 turns', cost: 280 },
    { id: 'siegeCannon', name: '👑 Siege Cannon', description: 'Ultimate (80)\nLoads in 5 turns', cost: 350 },
    
    // ULTIMATE TIER (Playbux only)
    { id: 'godCannon', name: '⚡ GOD CANNON', description: 'OBLITERATE (1M)\nLoads in 10 turns', cost: 1000, isPlaybux: true },
    
    // UTILITY
    { id: 'health', name: '❤️ Repair Kit', description: 'Restore 50 health', cost: 30 }
  ];

  function updateUI() {
    goldBadge.textContent = `💰 Gold: ${gold}`;
    healthBadge.textContent = `❤️ Your HP: ${playerHealth}`;
    enemyHealthBadge.textContent = currentEnemyBoat 
      ? `☠️ ${currentEnemyBoat.name}: ${enemyHealth}/${currentEnemyBoat.health}` 
      : `☠️ Enemy HP: ${enemyHealth}`;
    turnBadge.textContent = playerTurn ? '⚔️ YOUR TURN' : '⏳ ENEMY TURN';
    turnBadge.style.background = playerTurn ? '#10b981' : '#ef4444';
  }

  function drawShip(x, y, width, height, color, isPlayer = false) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    
    // Hull with gradient and shading
    const gradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, lightenColor(color, 20));
    gradient.addColorStop(1, darkenColor(color, 20));
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(-width / 2, height / 2);
    ctx.lineTo(-width / 2.5, height / 4);
    ctx.lineTo(-width / 2.8, -height / 3);
    ctx.lineTo(-width / 3.2, -height / 2);
    ctx.lineTo(width / 3.2, -height / 2);
    ctx.lineTo(width / 2.8, -height / 3);
    ctx.lineTo(width / 2.5, height / 4);
    ctx.lineTo(width / 2, height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Hull outline
    ctx.strokeStyle = darkenColor(color, 40);
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Deck with wood texture
    ctx.fillStyle = isPlayer ? '#8b6914' : '#5d4e37';
    ctx.fillRect(-width / 3.5, -height / 5, width / 1.8, height / 2.8);
    
    // Deck planks
    ctx.strokeStyle = isPlayer ? '#6b5310' : '#4a3c2a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const py = -height / 5 + i * (height / 2.8 / 4);
      ctx.beginPath();
      ctx.moveTo(-width / 3.5, py);
      ctx.lineTo(-width / 3.5 + width / 1.8, py);
      ctx.stroke();
    }
    
    // Main mast
    ctx.fillStyle = '#3d2817';
    ctx.fillRect(-4, -height / 2 - 30, 8, 35);
    
    // Mast shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-4, -height / 2 - 30, 3, 35);
    
    // Sail
    ctx.fillStyle = isPlayer ? 'rgba(240, 240, 230, 0.9)' : 'rgba(200, 200, 190, 0.9)';
    ctx.beginPath();
    ctx.moveTo(4, -height / 2 - 28);
    ctx.quadraticCurveTo(20, -height / 2 - 20, 20, -height / 2);
    ctx.lineTo(4, -height / 2 + 5);
    ctx.closePath();
    ctx.fill();
    
    // Sail shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.moveTo(4, -height / 2 - 28);
    ctx.quadraticCurveTo(12, -height / 2 - 22, 12, -height / 2);
    ctx.lineTo(4, -height / 2 + 5);
    ctx.closePath();
    ctx.fill();
    
    // Flag with wave effect
    const flagWave = Math.sin(Date.now() * 0.01) * 2;
    ctx.fillStyle = isPlayer ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(4, -height / 2 - 30);
    ctx.quadraticCurveTo(20 + flagWave, -height / 2 - 24, 22, -height / 2 - 20);
    ctx.lineTo(18, -height / 2 - 16);
    ctx.quadraticCurveTo(16 + flagWave, -height / 2 - 20, 4, -height / 2 - 23);
    ctx.closePath();
    ctx.fill();
    
    // Flag icon (skull for enemy, anchor for player)
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isPlayer ? '⚓' : '☠', 13, -height / 2 - 19);
    
    // Cannons with metallic look
    const cannonGradient = ctx.createLinearGradient(0, -2, 0, 5);
    cannonGradient.addColorStop(0, '#4a4a4a');
    cannonGradient.addColorStop(0.5, '#2a2a2a');
    cannonGradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = cannonGradient;
    
    for (let i = -1; i <= 1; i += 2) {
      const cannonX = i * width / 4;
      // Cannon body
      ctx.fillRect(cannonX - 1, -2, 10, 6);
      // Cannon tip
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(cannonX + 8, 0, 3, 2);
      ctx.fillStyle = cannonGradient;
    }
    
    // Portholes
    ctx.fillStyle = 'rgba(50, 30, 10, 0.8)';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * width / 5, height / 6, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Porthole highlight
      ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
      ctx.beginPath();
      ctx.arc(i * width / 5 - 1, height / 6 - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(50, 30, 10, 0.8)';
    }
    
    // Water line ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-width / 2, height / 2 - 2);
    ctx.lineTo(width / 2, height / 2 - 2);
    ctx.stroke();
    
    ctx.restore();
  }
  
  // Helper functions for color manipulation
  function lightenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  function darkenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawWaves() {
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const offset = (Date.now() * 0.05 + i * 40) % WIDTH;
      ctx.beginPath();
      for (let x = 0; x < WIDTH; x += 15) {
        const y = 50 + i * 70 + Math.sin((x + offset) * 0.03) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function drawStartScreen() {
    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    drawWaves();
    
    // Title with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏴‍☠️ PIXEL PIRATES ⚓', WIDTH / 2, 150);
    ctx.shadowBlur = 0;
    
    // Subtitle
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Turn-Based Naval Combat', WIDTH / 2, 200);
    
    // Draw player ship (larger, centered)
    drawShip(WIDTH / 2 - 80, HEIGHT / 2 - 60, 160, 110, '#8b4513', true);
    
    // Instructions
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('⚔️ GAME RULES ⚔️', WIDTH / 2, HEIGHT / 2 + 100);
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    const instructions = [
      '1. Buy weapons at the dock with your gold',
      '2. Cannon: 2 turns to load, 30 damage',
      '3. Mini Gun: 1 turn to load, 15 damage',
      '4. Click weapons in battle to load or fire',
      '5. Sink enemy ships to earn more gold!'
    ];
    
    instructions.forEach((line, i) => {
      ctx.fillText(line, WIDTH / 2, HEIGHT / 2 + 140 + i * 30);
    });
    
    // Start button with pulse effect
    const pulse = Math.sin(Date.now() * 0.005) * 10;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(WIDTH / 2 - 150, HEIGHT - 100, 300, 60);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3 + pulse * 0.2;
    ctx.strokeRect(WIDTH / 2 - 150, HEIGHT - 100, 300, 60);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('🚢 SET SAIL! 🚢', WIDTH / 2, HEIGHT - 60);
  }

  function drawShop() {
    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    drawWaves();
    
    // Dock background
    ctx.fillStyle = 'rgba(101, 67, 33, 0.8)';
    ctx.fillRect(50, 50, WIDTH - 100, HEIGHT - 100);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, WIDTH - 100, HEIGHT - 100);
    
    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏴‍☠️ THE DOCK - WEAPON SHOP 🏴‍☠️', WIDTH / 2, 110);
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText('Buy weapons for your ship! Scroll down for more...', WIDTH / 2, 145);
    
    // Draw shop items (grid layout: 4 columns, compact)
    const itemWidth = 180;
    const itemHeight = 140;
    const startX = 50;
    const startY = 165;
    const gap = 15;
    const cols = 4;
    
    shopItems.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (itemWidth + gap);
      const y = startY + row * (itemHeight + gap);
      
      // Show all items that fit (first 16 items visible)
      if (row >= 4) return; // Show only first 4 rows (16 items)
      
      // Item box
      const isOwned = item.id === 'health' ? false : playerWeapons[item.id]?.owned;
      const isPlaybux = item.isPlaybux === true;
      const playerPlaybux = window.gameState ? window.gameState.playbux : 0;
      const canAfford = isPlaybux ? playerPlaybux >= item.cost : gold >= item.cost;
      
      ctx.fillStyle = isOwned ? 'rgba(16, 185, 129, 0.3)' : (isPlaybux ? 'rgba(138, 43, 226, 0.5)' : 'rgba(42, 90, 143, 0.5)');
      ctx.fillRect(x, y, itemWidth, itemHeight);
      ctx.strokeStyle = isOwned ? '#10b981' : (canAfford ? (isPlaybux ? '#9333ea' : '#ffd700') : '#666');
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, itemWidth, itemHeight);
      
      // Item name
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, x + itemWidth / 2, y + 25);
      
      // Description
      ctx.fillStyle = '#fff';
      ctx.font = '11px Arial';
      const lines = item.description.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, x + itemWidth / 2, y + 45 + i * 16);
      });
      
      // Cost
      ctx.fillStyle = canAfford ? (isPlaybux ? '#9333ea' : '#10b981') : '#ef4444';
      ctx.font = 'bold 15px Arial';
      const costText = isPlaybux ? `⚡ ${item.cost} PB` : `💰 ${item.cost}`;
      ctx.fillText(costText, x + itemWidth / 2, y + 95);
      
      // Status
      if (isOwned) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 13px Arial';
        ctx.fillText('✓ OWNED', x + itemWidth / 2, y + 118);
      } else if (!canAfford) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '11px Arial';
        ctx.fillText('Need more gold', x + itemWidth / 2, y + 118);
      } else {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Click to buy', x + itemWidth / 2, y + 118);
      }
    });
    
    // Start battle button
    const hasWeapon = Object.values(playerWeapons).some(w => w.owned);
    if (hasWeapon) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(WIDTH / 2 - 150, HEIGHT - 80, 300, 50);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeRect(WIDTH / 2 - 150, HEIGHT - 80, 300, 50);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️ START BATTLE! ⚔️', WIDTH / 2, HEIGHT - 48);
    } else {
      ctx.fillStyle = '#666';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Buy at least one weapon to start!', WIDTH / 2, HEIGHT - 50);
    }
  }

  function drawBattle() {
    ctx.fillStyle = '#1a4d7a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    drawWaves();
    
    // Player ship (bottom)
    drawShip(WIDTH / 2 - 50, HEIGHT - 150, 100, 70, '#8b4513', true);
    
    // Player health bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(WIDTH / 2 - 100, HEIGHT - 180, 200, 20);
    const playerHealthPercent = playerHealth / 100;
    ctx.fillStyle = playerHealthPercent > 0.5 ? '#10b981' : playerHealthPercent > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(WIDTH / 2 - 100, HEIGHT - 180, 200 * playerHealthPercent, 20);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(WIDTH / 2 - 100, HEIGHT - 180, 200, 20);
    
    // Enemy ship (top) - variable size based on boat type
    const enemyWidth = currentEnemyBoat ? 100 * currentEnemyBoat.size : 100;
    const enemyHeight = currentEnemyBoat ? 70 * currentEnemyBoat.size : 70;
    const enemyColor = currentEnemyBoat ? currentEnemyBoat.color : '#5a2d2d';
    
    ctx.save();
    ctx.translate(WIDTH / 2, 150);
    ctx.rotate(Math.PI);
    drawShip(-enemyWidth / 2, -enemyHeight / 2, enemyWidth, enemyHeight, enemyColor, false);
    ctx.restore();
    
    // Enemy info badge
    if (currentEnemyBoat) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(WIDTH - 210, 10, 200, 80);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(WIDTH - 210, 10, 200, 80);
      
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(currentEnemyBoat.name, WIDTH - 200, 30);
      
      ctx.fillStyle = '#fff';
      ctx.font = '13px Arial';
      ctx.fillText(currentEnemyBoat.description, WIDTH - 200, 50);
      ctx.fillText(`Miss: ${(currentEnemyBoat.hitChance.miss * 100).toFixed(0)}%`, WIDTH - 200, 68);
      ctx.fillText(`Half: ${(currentEnemyBoat.hitChance.half * 100).toFixed(0)}%`, WIDTH - 120, 68);
      ctx.fillText(`Full: ${(currentEnemyBoat.hitChance.full * 100).toFixed(0)}%`, WIDTH - 40, 68);
    }
    
    // Enemy health bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(WIDTH / 2 - 100, 180, 200, 20);
    const enemyMaxHealth = currentEnemyBoat ? currentEnemyBoat.health : 100;
    const enemyHealthPercent = enemyHealth / enemyMaxHealth;
    ctx.fillStyle = enemyHealthPercent > 0.5 ? '#10b981' : enemyHealthPercent > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(WIDTH / 2 - 100, 180, 200 * enemyHealthPercent, 20);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(WIDTH / 2 - 100, 180, 200, 20);
    
    // Draw attack animations
    if (attackAnimation) {
      const progress = attackAnimation.frame / attackAnimation.maxFrames;
      
      if (attackAnimation.type === 'cannon') {
        // Cannonball animation
        const startY = attackAnimation.fromPlayer ? HEIGHT - 100 : 200;
        const endY = attackAnimation.fromPlayer ? 150 : HEIGHT - 130;
        const currentY = startY + (endY - startY) * progress;
        
        // Arc trajectory
        const midX = WIDTH / 2;
        const arc = Math.sin(progress * Math.PI) * 80;
        
        // Cannonball
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(midX + arc, currentY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Smoke trail
        for (let i = 0; i < 5; i++) {
          const trailProgress = Math.max(0, progress - i * 0.05);
          const trailY = startY + (endY - startY) * trailProgress;
          const trailArc = Math.sin(trailProgress * Math.PI) * 80;
          const alpha = 0.3 - i * 0.05;
          
          ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
          ctx.beginPath();
          ctx.arc(midX + trailArc, trailY, 8 - i, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Impact explosion
        if (progress > 0.9) {
          const explosionSize = (progress - 0.9) * 10 * 50;
          ctx.fillStyle = `rgba(255, 100, 0, ${1 - (progress - 0.9) * 10})`;
          ctx.beginPath();
          ctx.arc(midX, endY, explosionSize, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = `rgba(255, 200, 0, ${1 - (progress - 0.9) * 10})`;
          ctx.beginPath();
          ctx.arc(midX, endY, explosionSize * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        
      } else if (attackAnimation.type === 'minigun') {
        // Rapid fire bullets
        const startY = attackAnimation.fromPlayer ? HEIGHT - 100 : 200;
        const endY = attackAnimation.fromPlayer ? 150 : HEIGHT - 130;
        
        // Draw multiple bullets
        for (let i = 0; i < 8; i++) {
          const bulletProgress = Math.max(0, Math.min(1, progress * 1.5 - i * 0.1));
          if (bulletProgress > 0) {
            const currentY = startY + (endY - startY) * bulletProgress;
            const jitter = Math.sin(i * 123) * 15;
            
            // Bullet
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(WIDTH / 2 - 3 + jitter, currentY - 8, 6, 16);
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 1;
            ctx.strokeRect(WIDTH / 2 - 3 + jitter, currentY - 8, 6, 16);
            
            // Tracer
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 * (1 - bulletProgress)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(WIDTH / 2 + jitter, currentY);
            ctx.lineTo(WIDTH / 2 + jitter, currentY - 30);
            ctx.stroke();
          }
        }
        
        // Muzzle flash at start
        if (progress < 0.3) {
          const flashAlpha = 1 - progress / 0.3;
          const flashY = attackAnimation.fromPlayer ? HEIGHT - 100 : 200;
          
          ctx.fillStyle = `rgba(255, 200, 0, ${flashAlpha})`;
          ctx.beginPath();
          ctx.arc(WIDTH / 2, flashY, 30 * flashAlpha, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Impact sparks
        if (progress > 0.7) {
          const sparkProgress = (progress - 0.7) / 0.3;
          const sparkY = endY;
          
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = sparkProgress * 40;
            const sparkX = WIDTH / 2 + Math.cos(angle) * distance;
            const sparkYPos = sparkY + Math.sin(angle) * distance;
            
            ctx.fillStyle = `rgba(255, 150, 0, ${1 - sparkProgress})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkYPos, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    
    // Round counter
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 40);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`⚓ Round ${round}`, 20, 38);
    
    // Draw hit message if active
    if (hitMessage) {
      const alpha = 1 - (hitMessage.frame / hitMessage.maxFrames);
      const yPos = hitMessage.isPlayer ? HEIGHT - 200 : 220;
      const floatUp = hitMessage.frame * 0.5;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Message background
      ctx.fillStyle = hitMessage.damage === 0 ? 'rgba(100, 100, 100, 0.8)' : 
                      hitMessage.damage < 20 ? 'rgba(251, 191, 36, 0.8)' : 
                      'rgba(239, 68, 68, 0.8)';
      const messageWidth = ctx.measureText(hitMessage.text).width + 40;
      ctx.fillRect(WIDTH / 2 - messageWidth / 2, yPos - floatUp - 20, messageWidth, 50);
      
      // Message text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(hitMessage.text, WIDTH / 2, yPos - floatUp + 5);
      
      if (hitMessage.damage > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`-${hitMessage.damage} HP`, WIDTH / 2, yPos - floatUp + 28);
      }
      
      ctx.restore();
    }
    
    if (playerTurn) {
      // Show weapon choices - display all owned weapons
      const ownedWeapons = Object.entries(playerWeapons).filter(([_, w]) => w.owned);
      const maxDisplay = 4; // Show max 4 weapons at once
      const displayWeapons = ownedWeapons.slice(0, maxDisplay);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(50, HEIGHT / 2 - 100, WIDTH - 100, 200);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.strokeRect(50, HEIGHT / 2 - 100, WIDTH - 100, 200);
      
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️ YOUR TURN - CHOOSE WEAPON ⚔️', WIDTH / 2, HEIGHT / 2 - 70);
      
      if (ownedWeapons.length > maxDisplay) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '14px Arial';
        ctx.fillText(`Showing ${maxDisplay} of ${ownedWeapons.length} weapons`, WIDTH / 2, HEIGHT / 2 - 50);
      }
      
      // Weapon buttons in grid
      const buttonWidth = 160;
      const buttonHeight = 90;
      const buttonGap = 20;
      const startX = WIDTH / 2 - (displayWeapons.length * buttonWidth + (displayWeapons.length - 1) * buttonGap) / 2;
      const buttonY = HEIGHT / 2 - 30;
      
      displayWeapons.forEach(([weaponId, weapon], index) => {
        const buttonX = startX + index * (buttonWidth + buttonGap);
        const canFire = weapon.currentLoad >= weapon.loadTurns;
        
        // Find display name from shopItems
        const shopItem = shopItems.find(item => item.id === weaponId);
        const displayName = shopItem ? shopItem.name : weaponId.toUpperCase();
        
        ctx.fillStyle = canFire ? '#10b981' : '#666';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = canFire ? '#fff' : '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(displayName, buttonX + buttonWidth / 2, buttonY + 25);
        ctx.font = '14px Arial';
        ctx.fillText(`DMG: ${weapon.damage}`, buttonX + buttonWidth / 2, buttonY + 45);
        
        if (canFire) {
          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 14px Arial';
          ctx.fillText('✓ READY!', buttonX + buttonWidth / 2, buttonY + 65);
        } else {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '13px Arial';
          ctx.fillText(`Load: ${weapon.currentLoad}/${weapon.loadTurns}`, buttonX + buttonWidth / 2, buttonY + 65);
        }
        
        // Store button position for click detection
        weapon._buttonX = buttonX;
        weapon._buttonY = buttonY;
        weapon._buttonW = buttonWidth;
        weapon._buttonH = buttonHeight;
      });
    } else {
      // Enemy turn indicator
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.fillRect(WIDTH / 2 - 150, HEIGHT / 2 - 40, 300, 80);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeRect(WIDTH / 2 - 150, HEIGHT / 2 - 40, 300, 80);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('☠️ ENEMY TURN ☠️', WIDTH / 2, HEIGHT / 2);
      ctx.font = '18px Arial';
      ctx.fillText('Preparing attack...', WIDTH / 2, HEIGHT / 2 + 25);
    }
  }

  function playerAttack(weapon) {
    if (weapon.currentLoad >= weapon.loadTurns) {
      const weaponType = weapon === playerWeapons.cannon ? 'cannon' : 'minigun';
      
      // Calculate hit result based on enemy boat type
      let damageMultiplier = 1;
      let hitResult = 'HIT!';
      
      if (currentEnemyBoat) {
        const roll = Math.random();
        if (roll < currentEnemyBoat.hitChance.miss) {
          damageMultiplier = 0;
          hitResult = 'MISS!';
        } else if (roll < currentEnemyBoat.hitChance.miss + currentEnemyBoat.hitChance.half) {
          damageMultiplier = 0.5;
          hitResult = 'GRAZE!';
        } else {
          damageMultiplier = 1;
          hitResult = 'DIRECT HIT!';
        }
      }
      
      const actualDamage = Math.floor(weapon.damage * damageMultiplier);
      
      // Start attack animation
      attackAnimation = {
        type: weaponType,
        fromPlayer: true,
        frame: 0,
        maxFrames: 30,
        hitResult: hitResult,
        damage: actualDamage
      };
      
      // Animate the attack
      const animateAttack = () => {
        attackAnimation.frame++;
        if (attackAnimation.frame < attackAnimation.maxFrames) {
          requestAnimationFrame(animateAttack);
        } else {
          // Animation complete, apply damage
          const finalHitResult = attackAnimation.hitResult;
          const finalDamage = attackAnimation.damage;
          attackAnimation = null;
          
          enemyHealth -= finalDamage;
          weapon.currentLoad = 0;
          
          // Show hit result message
          showHitMessage(finalHitResult, finalDamage, false);
          
          if (finalDamage > 0) {
            sound.playScore();
          } else {
            sound.playLose();
          }
          
          if (enemyHealth <= 0) {
            setTimeout(() => victory(), 800);
            return;
          }
          
          playerTurn = false;
          updateUI();
          setTimeout(enemyTurn, 1500);
        }
      };
      animateAttack();
      
    } else {
      weapon.currentLoad++;
      sound.playMove();
      playerTurn = false;
      updateUI();
      setTimeout(enemyTurn, 1000);
    }
  }

  function enemyTurn() {
    const useCanon = Math.random() > 0.5;
    const weapon = useCanon ? enemyWeapons.cannon : enemyWeapons.minigun;
    
    if (weapon.currentLoad >= weapon.loadTurns) {
      const weaponType = useCanon ? 'cannon' : 'minigun';
      
      setTimeout(() => {
        // Start enemy attack animation
        attackAnimation = {
          type: weaponType,
          fromPlayer: false,
          frame: 0,
          maxFrames: 30
        };
        
        // Animate the attack
        const animateAttack = () => {
          attackAnimation.frame++;
          if (attackAnimation.frame < attackAnimation.maxFrames) {
            requestAnimationFrame(animateAttack);
          } else {
            // Animation complete, apply damage
            attackAnimation = null;
            playerHealth -= weapon.damage;
            weapon.currentLoad = 0;
            sound.playLose();
            
            if (playerHealth <= 0) {
              defeat();
              return;
            }
            
            round++;
            playerTurn = true;
            updateUI();
            drawBattle();
          }
        };
        animateAttack();
      }, 1000);
    } else {
      weapon.currentLoad++;
      setTimeout(() => {
        round++;
        playerTurn = true;
        updateUI();
        drawBattle();
      }, 1000);
    }
  }

  // Hit message display
  let hitMessage = null; // { text: string, damage: number, frame: 0, maxFrames: 60, isPlayer: boolean }
  
  function showHitMessage(result, damage, isPlayerHit) {
    hitMessage = {
      text: result,
      damage: damage,
      frame: 0,
      maxFrames: 60,
      isPlayer: isPlayerHit
    };
    
    const fadeMessage = () => {
      if (hitMessage) {
        hitMessage.frame++;
        if (hitMessage.frame < hitMessage.maxFrames) {
          requestAnimationFrame(fadeMessage);
        } else {
          hitMessage = null;
        }
      }
    };
    fadeMessage();
  }

  function victory() {
    gamePhase = 'victory';
    enemiesDefeated++;
    const reward = currentEnemyBoat ? currentEnemyBoat.reward : 50 + round * 10;
    gold += reward;
    
    // Award Playbux for winning (50 PB per win)
    if (window.gameState && typeof window.gameState.addPlaybux === 'function') {
      window.gameState.addPlaybux(50);
    }
    
    sound.playWin();
    updateUI();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 VICTORY! 🎉', WIDTH / 2, HEIGHT / 2 - 60);
    
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.fillText(`Enemy ship sunk!`, WIDTH / 2, HEIGHT / 2);
    ctx.fillText(`Earned: ${reward} gold 💰`, WIDTH / 2, HEIGHT / 2 + 50);
    ctx.font = '24px Arial';
    ctx.fillText('Click to return to dock', WIDTH / 2, HEIGHT / 2 + 100);
  }

  // DOM-based defeat overlay (snake-style)
  let defeatOverlay = null;
  let defeatReviveBtn = null;
  let defeatBuyBtn = null;
  let defeatReturnBtn = null;
  let defeatPBDisplay = null;
  let defeatCountdown = null;
  let defeatBuyModal = null;
  let defeatBuy1Btn = null;
  let defeatBuy10Btn = null;
  let defeatBuyCancelBtn = null;

  function defeat() {
    gamePhase = 'defeat';
    sound.playLose();
    // Remove any existing overlay
    if (defeatOverlay) defeatOverlay.remove();

  // Scroll to top so defeat overlay is visible
  window.scrollTo({ top: 0, behavior: 'smooth' });

    defeatOverlay = document.createElement('div');
    defeatOverlay.className = 'pirate-defeat-overlay';
    defeatOverlay.style.cssText = `
      position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.92); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-family: Arial, sans-serif;
    `;
    defeatOverlay.innerHTML = `
      <div style="color:#ef4444;font-size:3rem;font-weight:bold;margin-bottom:0.5em;text-shadow:2px 2px #000;">💀 DEFEAT! 💀</div>
      <div style="color:#fff;font-size:1.5rem;margin-bottom:0.5em;">Your ship was sunk!</div>
      <div style="color:#ffd700;font-size:1.2rem;margin-bottom:1em;">Ships defeated: ${enemiesDefeated}</div>
      <div id="pirate-pb-display" style="color:#fbbf24;font-size:1.1rem;margin-bottom:1em;"></div>
      <div id="pirate-revive-section" style="margin-bottom:1em;"></div>
      <div style="display:flex;gap:1.5em;justify-content:center;">
        <button id="pirate-revive-btn" style="padding:0.8em 2em;font-size:1.2rem;background:#10b981;color:#fff;border:none;border-radius:10px;font-weight:bold;box-shadow:0 2px 8px #000;cursor:pointer;">⚡ Revive</button>
        <button id="pirate-buy-btn" style="padding:0.8em 2em;font-size:1.2rem;background:#fbbf24;color:#222;border:none;border-radius:10px;font-weight:bold;box-shadow:0 2px 8px #000;cursor:pointer;">Buy Revives</button>
        <button id="pirate-return-btn" style="padding:0.8em 2em;font-size:1.2rem;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-weight:bold;box-shadow:0 2px 8px #000;cursor:pointer;">🏠 Return to Dock</button>
      </div>
      <div id="pirate-countdown" style="margin-top:2em;font-size:2rem;color:#10b981;font-weight:bold;display:none;"></div>
    `;
    document.body.appendChild(defeatOverlay);

    defeatReviveBtn = defeatOverlay.querySelector('#pirate-revive-btn');
    defeatBuyBtn = defeatOverlay.querySelector('#pirate-buy-btn');
    defeatReturnBtn = defeatOverlay.querySelector('#pirate-return-btn');
    defeatPBDisplay = defeatOverlay.querySelector('#pirate-pb-display');
    defeatCountdown = defeatOverlay.querySelector('#pirate-countdown');

    function updatePBDisplay() {
      const pb = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;
      defeatPBDisplay.innerHTML = `You have <span style="color:#fbbf24;font-weight:bold;">${pb} PB</span>`;
    }
    updatePBDisplay();

    // Revive logic
    function updateReviveSection() {
      const revives = window.playBoxGetRevives ? window.playBoxGetRevives() : 0;
      const pb = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;
      let html = '';
      if (revives > 0) {
        html = `<span style="color:#10b981;font-weight:bold;">You have ${revives} revive${revives>1?'s':''}!</span>`;
        defeatReviveBtn.disabled = false;
        defeatReviveBtn.style.opacity = '1';
      } else {
        html = `<span style="color:#ef4444;font-weight:bold;">No revives left.</span>`;
        defeatReviveBtn.disabled = true;
        defeatReviveBtn.style.opacity = '0.5';
      }
      defeatOverlay.querySelector('#pirate-revive-section').innerHTML = html;
      // Buy button enable/disable
      defeatBuyBtn.disabled = pb < 100;
      defeatBuyBtn.style.opacity = pb < 100 ? '0.5' : '1';
    }
    updateReviveSection();

    // Revive button
    defeatReviveBtn.onclick = () => {
      if (window.playBoxUseRevive && window.playBoxGetRevives) {
        if (window.playBoxGetRevives() > 0 && window.playBoxUseRevive()) {
          sound.playClick();
          startReviveCountdown();
        } else {
          updateReviveSection();
          alert('No revives left.');
        }
      }
    };

    // Buy button
    defeatBuyBtn.onclick = () => {
      showBuyModal();
    };

    // Return to dock
    defeatReturnBtn.onclick = () => {
      if (defeatOverlay) defeatOverlay.remove();
      gamePhase = 'shop';
      render();
    };

    // Countdown logic
    function startReviveCountdown() {
      let count = 3;
      defeatCountdown.style.display = '';
      defeatCountdown.textContent = `Resuming in ${count}...`;
      defeatReviveBtn.disabled = true;
      defeatBuyBtn.disabled = true;
      defeatReturnBtn.disabled = true;
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          defeatCountdown.textContent = `Resuming in ${count}...`;
        } else {
          clearInterval(timer);
          if (defeatOverlay) defeatOverlay.remove();
          playerHealth = 50;
          gamePhase = 'battle';
          playerTurn = true;
          sound.playWin();
          updateUI();
        }
      }, 1000);
    }

    // Buy modal (simple)
    function showBuyModal() {
      if (defeatBuyModal) defeatBuyModal.remove();
      defeatBuyModal = document.createElement('div');
      defeatBuyModal.style.cssText = `
        position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center;`;
      defeatBuyModal.innerHTML = `
        <div style="background:#1e293b;padding:2em 3em;border-radius:18px;box-shadow:0 4px 32px #000;display:flex;flex-direction:column;align-items:center;">
          <div style="color:#fbbf24;font-size:1.3rem;margin-bottom:1em;">Buy Revives</div>
          <div id="pirate-buy-pb" style="color:#fbbf24;font-size:1.1rem;margin-bottom:1em;"></div>
          <div style="display:flex;gap:1em;margin-bottom:1.5em;">
            <button id="pirate-buy-1" style="padding:0.7em 1.5em;font-size:1.1rem;background:#10b981;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">Buy 1 (100 PB)</button>
            <button id="pirate-buy-10" style="padding:0.7em 1.5em;font-size:1.1rem;background:#10b981;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">Buy 10 (1000 PB)</button>
          </div>
          <button id="pirate-buy-cancel" style="padding:0.5em 1.2em;font-size:1rem;background:#ef4444;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">Cancel</button>
        </div>
      `;
      document.body.appendChild(defeatBuyModal);
      defeatBuy1Btn = defeatBuyModal.querySelector('#pirate-buy-1');
      defeatBuy10Btn = defeatBuyModal.querySelector('#pirate-buy-10');
      defeatBuyCancelBtn = defeatBuyModal.querySelector('#pirate-buy-cancel');
      const pbDisplay = defeatBuyModal.querySelector('#pirate-buy-pb');
      const pb = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;
      pbDisplay.innerHTML = `You have <span style="color:#fbbf24;font-weight:bold;">${pb} PB</span>`;
      defeatBuy1Btn.disabled = pb < 100;
      defeatBuy10Btn.disabled = pb < 1000;
      defeatBuy1Btn.style.opacity = pb < 100 ? '0.5' : '1';
      defeatBuy10Btn.style.opacity = pb < 1000 ? '0.5' : '1';
      defeatBuy1Btn.onclick = () => {
        if (pb >= 100 && window.playBoxSpendPlaybux && window.playBoxGetRevives) {
          if (window.playBoxSpendPlaybux(100)) {
            // Add 1 revive
            const currentRevives = window.playBoxGetRevives();
            localStorage.setItem('gamehub:revives', String(currentRevives + 1));
            if (window.updateReviveDisplay) window.updateReviveDisplay();
            if (window.updatePlaybuxDisplay) window.updatePlaybuxDisplay();
            defeatBuyModal.remove();
            updatePBDisplay();
            updateReviveSection();
          }
        }
      };
      defeatBuy10Btn.onclick = () => {
        if (pb >= 1000 && window.playBoxSpendPlaybux && window.playBoxGetRevives) {
          if (window.playBoxSpendPlaybux(1000)) {
            // Add 10 revives
            const currentRevives = window.playBoxGetRevives();
            localStorage.setItem('gamehub:revives', String(currentRevives + 10));
            if (window.updateReviveDisplay) window.updateReviveDisplay();
            if (window.updatePlaybuxDisplay) window.updatePlaybuxDisplay();
            defeatBuyModal.remove();
            updatePBDisplay();
            updateReviveSection();
          }
        }
      };
      defeatBuyCancelBtn.onclick = () => {
        defeatBuyModal.remove();
      };
    }
  }

  function reset() {
    gamePhase = 'shop';
    playerHealth = 100;
    enemyHealth = 100;
    playerTurn = true;
    round = 1;
    Object.values(playerWeapons).forEach(w => w.currentLoad = 0);
    Object.values(enemyWeapons).forEach(w => w.currentLoad = 0);
    updateUI();
    render();
  }

  function render() {
    if (gamePhase === 'start') {
      drawStartScreen();
    } else if (gamePhase === 'shop') {
      drawShop();
    } else if (gamePhase === 'battle') {
      drawBattle();
    }
    
    if (gamePhase === 'battle' || gamePhase === 'shop' || gamePhase === 'start') {
      requestAnimationFrame(render);
    }
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (gamePhase === 'start') {
      // Click start button
      if (x >= WIDTH / 2 - 150 && x <= WIDTH / 2 + 150 && y >= HEIGHT - 100 && y <= HEIGHT - 40) {
        gamePhase = 'shop';
        sound.playWin();
      }
    } else if (gamePhase === 'shop') {
      const itemWidth = 180;
      const itemHeight = 140;
      const startX = 50;
      const startY = 165;
      const gap = 15;
      const cols = 4;
      
      shopItems.forEach((item, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const itemX = startX + col * (itemWidth + gap);
        const itemY = startY + row * (itemHeight + gap);
        
        // Skip off-screen items (only first 4 rows visible)
        if (row >= 4) return;
        
        if (x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + itemHeight) {
          const isPlaybux = item.isPlaybux === true;
          const playerPlaybux = window.gameState ? window.gameState.playbux : 0;
          const canAfford = isPlaybux ? playerPlaybux >= item.cost : gold >= item.cost;
          
          if (canAfford) {
            if (item.id === 'health') {
              playerHealth = Math.min(100, playerHealth + 50);
              gold -= item.cost;
              sound.playScore();
            } else if (!playerWeapons[item.id].owned) {
              playerWeapons[item.id].owned = true;
              
              // Deduct currency
              if (isPlaybux && window.gameState && typeof window.gameState.spendPlaybux === 'function') {
                window.gameState.spendPlaybux(item.cost);
              } else {
                gold -= item.cost;
              }
              
              sound.playScore();
            }
            updateUI();
          } else {
            sound.playLose();
          }
        }
      });
      
      const hasWeapon = Object.values(playerWeapons).some(w => w.owned);
      if (hasWeapon && x >= WIDTH / 2 - 150 && x <= WIDTH / 2 + 150 && y >= HEIGHT - 80 && y <= HEIGHT - 30) {
        gamePhase = 'battle';
        
        // Select random enemy boat type
        currentEnemyBoat = enemyBoatTypes[Math.floor(Math.random() * enemyBoatTypes.length)];
        enemyHealth = currentEnemyBoat.health;
        
        round = 1;
        Object.values(playerWeapons).forEach(w => w.currentLoad = 0);
        Object.values(enemyWeapons).forEach(w => w.currentLoad = 0);
        sound.playWin();
        updateUI();
      }
    } else if (gamePhase === 'battle' && playerTurn) {
      // Check if any weapon button was clicked
      for (const [weaponId, weapon] of Object.entries(playerWeapons)) {
        if (weapon.owned && weapon._buttonX !== undefined) {
          if (x >= weapon._buttonX && x <= weapon._buttonX + weapon._buttonW &&
              y >= weapon._buttonY && y <= weapon._buttonY + weapon._buttonH) {
            playerAttack(weapon);
            return;
          }
        }
      }
    } else if (gamePhase === 'victory') {
      // Victory screen - click anywhere to return
      gamePhase = 'shop';
      render();
    }
  });

  resetBtn.onclick = reset;
  updateUI();
  render();

  return () => {};
}
