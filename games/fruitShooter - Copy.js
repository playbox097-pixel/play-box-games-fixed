// games/fruitShooter.js
// 2D level-based shooter with animated ships, 5 enemy types, a final boss,
// 25 levels, and fruit pickups (banana, strawberry, kiwi).

import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(root) {
  const MAX_LEVEL = 25;

  const wrap = document.createElement('div');
  wrap.className = 'shooter';

  // --- Toolbar ---
  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const startBtn = makeButton('Start');
  startBtn.classList.add('button', 'primary');
  const pauseBtn = makeButton('Pause');
  pauseBtn.classList.add('button');
  const resetBtn = makeButton('Reset');
  resetBtn.classList.add('button');

  const easyBtn = makeButton('Easy');
  easyBtn.classList.add('button');
  const mediumBtn = makeButton('Med');
  mediumBtn.classList.add('button');
  const hardBtn = makeButton('Hard');
  hardBtn.classList.add('button');

  const levelBadge = makeBadge('Level: 1 / ' + MAX_LEVEL);
  const damageBadge = makeBadge('Damage: 10');
  const livesBadge = makeBadge('Lives: 3');
  const scoreBadge = makeBadge('Score: 0');
  const bestBadge = makeBadge('Best: 0');
  const reviveBtn = makeButton('Revive');
  reviveBtn.classList.add('button');
  reviveBtn.style.display = 'none';

  toolbar.append(
    startBtn,
    pauseBtn,
    resetBtn,
    easyBtn,
    mediumBtn,
    hardBtn,
    levelBadge,
    damageBadge,
    livesBadge,
    scoreBadge,
    bestBadge,
    reviveBtn,
  );

  // --- Canvas ---
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const WIDTH = 640;
  const HEIGHT = 360;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvasWrap.appendChild(canvas);

  // Per-game fullscreen button (targets just this game area)
  if (window.playBoxCreateFullscreenButton) {
    const fsBtn = window.playBoxCreateFullscreenButton(canvasWrap);
    if (fsBtn) toolbar.appendChild(fsBtn);
  }

  const rules = createRules([
    'Move with Arrow keys or WASD.',
    'Press Space or K to shoot lasers.',
    'Clear all enemies in a level to advance. Level 25 has the boss.',
    'Fruit pickups (banana, strawberry, kiwi) heal you and give bonus score.',
    'Your laser damage increases every level.'
  ]);

  wrap.append(toolbar, rules, canvasWrap);
  root.appendChild(wrap);

  // --- High score ---
  const HS_KEY = 'fruit-shooter';
  let bestScore = getHighScore(HS_KEY);
  bestBadge.textContent = `Best: ${bestScore}`;

  // --- Game state ---
  let running = false;
  let destroyed = false;
  let gameOver = false;
  let victory = false;
  let level = 1;
  let score = 0;
  let lives = 3;
  let difficulty = 'easy';

  let time = 0;
  let lastTime = 0;

  const player = {
    x: WIDTH / 2,
    y: HEIGHT - 60,
    vx: 0,
    vy: 0,
    radius: 16,
    // faster ship so you can dodge more easily
    maxSpeed: 360,
  };

  const bullets = [];
  const enemyBullets = [];
  const enemies = [];
  const fruits = [];
  const powerups = [];
  let boss = null;

  let shootCooldown = 0;
  let spawnTimer = 0;
  let enemiesToSpawn = 0;
  let enemiesSpawned = 0;

  let bossSpawned = false;
  let invincibleFor = 0;

  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
  };

  function currentDamage() {
    // Base damage grows with level, then scaled by difficulty (easy hits harder).
    const base = 8 + (level - 1) * 1.4;
    let scale = 1;
    if (difficulty === 'easy') scale = 1.5;
    else if (difficulty === 'hard') scale = 0.9;
    else scale = 1.2; // medium
    return Math.round(base * scale);
  }

  function baseLives() {
    if (difficulty === 'easy') return 6;
    if (difficulty === 'hard') return 3;
    return 4; // medium
  }

  function enemyCountForLevel() {
    // On easy: very few enemies per level.
    let base = 3 + level * 1.1;
    if (difficulty === 'easy') {
      base = 2 + level * 0.6;
      base *= 0.5;
    } else if (difficulty === 'hard') {
      base *= 1.2;
    }
    return Math.max(2, Math.round(base));
  }

  function enemyHpScale() {
    // On easy: enemies are much softer.
    let scale = 0.7 + level * 0.1;
    if (difficulty === 'easy') {
      scale = 0.4 + level * 0.06;
      scale *= 0.7;
    } else if (difficulty === 'hard') {
      scale *= 1.25;
    }
    return scale;
  }

  function enemyBulletSpeedScale() {
    // On easy: bullets are very slow and easier to dodge.
    if (difficulty === 'easy') return 0.4;
    if (difficulty === 'hard') return 1.3;
    return 0.9; // medium slightly slower than before
  }

  function enemyBulletScaleForBoss() {
    // slightly faster shots on harder difficulties
    if (difficulty === 'hard') return 1.4;
    if (difficulty === 'medium') return 1.15;
    return 1.0;
  }

  function bossMaxHp() {
    // Stronger boss with more health on all difficulties
    if (difficulty === 'easy') return 900;   // tougher but still fair
    if (difficulty === 'hard') return 2200;  // very tanky on hard
    return 1500;                             // medium
  }

  function resetForNewGame() {
    reviveBtn.style.display = 'none';
    level = 1;
    score = 0;
    lives = baseLives();
    gameOver = false;
    victory = false;
    resetLevelState();
    syncHud();
  }

  function resetLevelState() {
    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    fruits.length = 0;
    powerups.length = 0;
    boss = null;
    bossSpawned = false;
    invincibleFor = 0;
    player.x = WIDTH / 2;
    player.y = HEIGHT - 60;
    player.vx = 0;
    player.vy = 0;

    enemiesSpawned = 0;
    enemiesToSpawn = enemyCountForLevel();
    spawnTimer = 0.5;
    shootCooldown = 0;
    time = 0;
  }

  function syncHud() {
    levelBadge.textContent = `Level: ${level} / ${MAX_LEVEL}`;
    damageBadge.textContent = `Damage: ${currentDamage()}`;
    livesBadge.textContent = `Lives: ${lives}`;
    scoreBadge.textContent = `Score: ${score}`;
    bestBadge.textContent = `Best: ${bestScore}`;
  }

  // Initial state will be set when a difficulty is applied.

  // --- Level & enemy helpers ---

  const ENEMY_TYPES = [
    // id 0: basic drone
    {
      kind: 'drone',
      baseHp: 30,
      speed: 70,
      color: '#f97316',
    },
    // id 1: zig-zag fighter
    {
      kind: 'zig',
      baseHp: 40,
      speed: 90,
      color: '#22c55e',
    },
    // id 2: tank (slow, tough)
    {
      kind: 'tank',
      baseHp: 80,
      speed: 45,
      color: '#e11d48',
    },
    // id 3: side shooter
    {
      kind: 'shooter',
      baseHp: 45,
      speed: 60,
      color: '#38bdf8',
    },
    // id 4: sprinter
    {
      kind: 'sprinter',
      baseHp: 25,
      speed: 130,
      color: '#a855f7',
    },
  ];

  function spawnEnemy() {
    if (enemiesSpawned >= enemiesToSpawn && (level < MAX_LEVEL || bossSpawned)) return;

    if (level === MAX_LEVEL && !bossSpawned) {
      // Final boss spawns at the top center
      bossSpawned = true;
      const hp = bossMaxHp();
      // Boss has two phases: 'attack' (rapid fire) and 'rest' (no shots)
      let attackDuration;
      let restDuration = 3; // 3 second break for the player to counterattack
      let fireInterval; // time between shots during attack
      let shotsPerVolley;
      let baseShotSpeed;

      if (difficulty === 'easy') {
        attackDuration = 1.8; // seconds of rapid fire
        fireInterval = 0.22; // fast shots
        shotsPerVolley = 7;
        baseShotSpeed = 160;
      } else if (difficulty === 'hard') {
        attackDuration = 3.2;
        fireInterval = 0.12;
        shotsPerVolley = 10;
        baseShotSpeed = 220;
      } else {
        // medium
        attackDuration = 2.3;
        fireInterval = 0.18;
        shotsPerVolley = 8;
        baseShotSpeed = 190;
      }

      boss = {
        x: WIDTH / 2,
        y: 80,
        vx: 0,
        radius: 42,
        maxHp: hp,
        hp,
        // used for subtle visual bobbing/rotation
        phase: 0,
        // boss AI timers
        attackPhase: 'rest', // 'attack' or 'rest'
        phaseTimer: restDuration, // time left in current phase
        attackDuration,
        restDuration,
        fireCooldown: 0,
        fireInterval,
        shotsPerVolley,
        baseShotSpeed,
      };
      return;
    }

    const typeIndex = Math.floor(Math.random() * ENEMY_TYPES.length);
    const def = ENEMY_TYPES[typeIndex];
    const lane = Math.random();
    const ex = 40 + lane * (WIDTH - 80);
    const hpScale = enemyHpScale();

    let vyBase = def.speed * 0.55 + level * 1.5;
    if (difficulty === 'easy') vyBase *= 0.7; // even slower on easy

    enemies.push({
      typeIndex,
      kind: def.kind,
      x: ex,
      y: -30,
      // no sideways movement: enemies just fall straight down in their lane
      vx: 0,
      // slower enemies so they drift down more gently
      vy: vyBase,
      radius: 16,
      hp: Math.floor(def.baseHp * hpScale),
      maxHp: Math.floor(def.baseHp * hpScale),
      fireCooldown: 1 + Math.random(),
      t: 0,
    });

    enemiesSpawned++;
  }

  function spawnFruit(x, y) {
    const r = Math.random();
    let kind;
    if (r < 0.33) kind = 'banana';
    else if (r < 0.66) kind = 'strawberry';
    else kind = 'kiwi';

    fruits.push({
      kind,
      x,
      y,
      vy: 40 + Math.random() * 20,
      radius: 12,
      wobbleOffset: Math.random() * Math.PI * 2,
    });
  }

  function spawnPowerup(x, y) {
    powerups.push({
      kind: 'invincible',
      x,
      y,
      vy: 40,
      radius: 14,
      wobbleOffset: Math.random() * Math.PI * 2,
    });
  }

  // --- Input ---
  function onKeyDown(e) {
    const k = e.key;
    if ([
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'a','d','w','s','A','D','W','S',
      ' ','k','K',
    ].includes(k)) {
      e.preventDefault();
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') input.left = true;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') input.right = true;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') input.up = true;
    if (k === 'ArrowDown' || k === 's' || k === 'S') input.down = true;
    if (k === ' ' || k === 'k' || k === 'K') input.shoot = true;
  }

  function onKeyUp(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') input.left = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') input.right = false;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') input.up = false;
    if (k === 'ArrowDown' || k === 's' || k === 'S') input.down = false;
    if (k === ' ' || k === 'k' || k === 'K') input.shoot = false;
  }

  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);

  // --- Loop control ---
  function startLoop() {
    if (running) return;
    if (gameOver || victory) {
      resetForNewGame();
    }
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function stopLoop() {
    running = false;
  }

  function loop(now) {
    if (!running || destroyed) return;
    const dt = Math.min(0.04, (now - lastTime) / 1000);
    lastTime = now;
    step(dt);
    draw(dt);
    if (running) requestAnimationFrame(loop);
  }

  function step(dt) {
    time += dt;

    if (invincibleFor > 0) {
      invincibleFor = Math.max(0, invincibleFor - dt);
    }

    if (!gameOver && !victory) {
      updatePlayer(dt);
      updateSpawning(dt);
      updateBullets(dt);
      updateEnemies(dt);
      updateBoss(dt);
      updateFruits(dt);
      updatePowerups(dt);
      checkLevelComplete();
    }
  }

  function updatePlayer(dt) {
    const accel = player.maxSpeed * 3;
    let ax = 0;
    let ay = 0;
    if (input.left) ax -= accel;
    if (input.right) ax += accel;
    if (input.up) ay -= accel;
    if (input.down) ay += accel;

    player.vx += ax * dt;
    player.vy += ay * dt;

    // Apply friction
    const friction = 6;
    player.vx -= player.vx * friction * dt;
    player.vy -= player.vy * friction * dt;

    const speed = Math.hypot(player.vx, player.vy);
    if (speed > player.maxSpeed) {
      const s = player.maxSpeed / speed;
      player.vx *= s;
      player.vy *= s;
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = clamp(player.x, 32, WIDTH - 32);
    player.y = clamp(player.y, HEIGHT * 0.35, HEIGHT - 40);

    if (input.shoot) {
      shootCooldown -= dt;
      if (shootCooldown <= 0) {
        firePlayerBullet();
        shootCooldown = Math.max(0.18, 0.4 - level * 0.01);
      }
    } else {
      shootCooldown = 0;
    }
  }

  function firePlayerBullet() {
    const dmg = currentDamage();
    bullets.push({
      x: player.x,
      y: player.y - player.radius,
      vy: -360,
      radius: 4,
      damage: dmg,
    });
    sound.playMove();
  }

  function updateSpawning(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      if (enemiesSpawned < enemiesToSpawn || (level === MAX_LEVEL && !bossSpawned)) {
        spawnEnemy();
        spawnTimer = 0.6;
      }
    }
  }

  function updateBullets(dt) {
    bullets.forEach(b => {
      b.y += b.vy * dt;
    });
    enemyBullets.forEach(b => {
      b.y += b.vy * dt;
    });

    // Player bullets vs enemies
    bullets.forEach(b => {
      if (b._hit) return;
      enemies.forEach(e => {
        if (e.hp > 0 && circleHit(b, e)) {
          e.hp -= b.damage;
          b._hit = true;
          score += 5;
          syncScore();
          if (e.hp <= 0) {
            onEnemyKilled(e);
          }
        }
      });
      if (!b._hit && boss && boss.hp > 0 && circleHit(b, boss)) {
        boss.hp -= b.damage;
        b._hit = true;
        score += 10;
        syncScore();
        if (boss.hp <= 0) {
          onBossKilled();
        }
      }
    });

    // Enemy bullets vs player
    enemyBullets.forEach(b => {
      if (b._hit) return;
      if (circleHit(b, player) && invincibleFor <= 0) {
        b._hit = true;
        damagePlayer(1);
      }
    });

    // Cleanup
    removeDeadFromArray(bullets, b => b._hit || b.y < -20 || b.y > HEIGHT + 20);
    removeDeadFromArray(enemyBullets, b => b._hit || b.y > HEIGHT + 40 || b.y < -40);
  }

  function updateEnemies(dt) {
    enemies.forEach(e => {
      e.t += dt;
      // keep enemies locked in their lane, only moving straight down
      e.y += e.vy * dt;

      // bounce off sides a bit
      if (e.x < 24 || e.x > WIDTH - 24) {
        e.vx *= -1;
        e.x = clamp(e.x, 24, WIDTH - 24);
      }

      // Enemy shoots occasionally (only some types)
      e.fireCooldown -= dt;
      const canShoot = (e.kind === 'shooter' || e.kind === 'tank');
      if (canShoot && e.fireCooldown <= 0 && e.y > 40) {
        const speedScale = enemyBulletSpeedScale();
        enemyBullets.push({
          x: e.x,
          y: e.y + e.radius,
          vy: (100 + level * 2.2) * speedScale,
          radius: 4,
        });
        let baseCooldown = 1.4 - Math.min(0.8, level * 0.035) + Math.random() * 0.4;
        if (difficulty === 'easy') baseCooldown *= 1.8; // shoot far less often on easy
        else if (difficulty === 'hard') baseCooldown *= 0.9;
        e.fireCooldown = baseCooldown;
      }

      // Collision with player
      if (e.hp > 0 && circleHit(e, player) && invincibleFor <= 0) {
        e.hp = 0;
        onEnemyKilled(e);
        damagePlayer(1);
      }
    });

    removeDeadFromArray(enemies, e => e.hp <= 0 || e.y > HEIGHT + 40);
  }

  function updateBoss(dt) {
    if (!boss) return;
    if (boss.hp <= 0) return;

    // visual wobble for the boss body
    boss.phase += dt;

    // manage attack / rest phases
    boss.phaseTimer -= dt;
    if (boss.attackPhase === 'attack') {
      // during attack, fire rapidly
      const speedScale = enemyBulletScaleForBoss();
      boss.fireCooldown -= dt;
      if (boss.fireCooldown <= 0) {
        const shots = boss.shotsPerVolley;
        const baseSpeed = boss.baseShotSpeed + 4 * level;
        for (let i = 0; i < shots; i++) {
          const spread = 0.25;
          const angle = -Math.PI / 2 + (i - (shots - 1) / 2) * spread;
          const speed = baseSpeed * speedScale;
          enemyBullets.push({
            x: boss.x,
            y: boss.y + boss.radius * 0.4,
            vy: Math.sin(angle) * speed,
            radius: 5,
          });
        }
        boss.fireCooldown = boss.fireInterval;
      }
      if (boss.phaseTimer <= 0) {
        // switch to rest phase
        boss.attackPhase = 'rest';
        boss.phaseTimer = boss.restDuration;
        boss.fireCooldown = 0;
      }
    } else {
      // rest phase: boss does not fire, gives player a window to attack
      if (boss.phaseTimer <= 0) {
        boss.attackPhase = 'attack';
        boss.phaseTimer = boss.attackDuration;
        boss.fireCooldown = 0; // start burst immediately
      }
    }

    // body collision damage (boss can still bump you during attack or rest)
    if (circleHit(boss, player) && invincibleFor <= 0) {
      damagePlayer(2);
    }
  }

  function updateFruits(dt) {
    fruits.forEach(f => {
      f.y += f.vy * dt;
      const wobble = Math.sin(time * 3 + f.wobbleOffset) * 10;
      f.x += wobble * dt;

      if (circleHit(f, player)) {
        // heal + score depending on fruit kind
        let heal = 1;
        let bonus = 20;
        if (f.kind === 'banana') { heal = 1; bonus = 25; }
        else if (f.kind === 'strawberry') { heal = 2; bonus = 35; }
        else if (f.kind === 'kiwi') { heal = 1; bonus = 30; }
        if (lives < 5) {
          lives = Math.min(5, lives + heal);
        } else {
          bonus += 10; // extra score if already max lives
        }
        score += bonus;
        syncScore();
        sound.playScore();
        f._collected = true;
      }
    });

    removeDeadFromArray(fruits, f => f._collected || f.y > HEIGHT + 40);
  }

  function updatePowerups(dt) {
    powerups.forEach(p => {
      p.y += p.vy * dt;
      const wobble = Math.sin(time * 4 + p.wobbleOffset) * 8;
      p.x += wobble * dt;

      if (circleHit(p, player)) {
        invincibleFor += invincibilityDuration();
        p._collected = true;
        sound.playScore();
      }
    });

    removeDeadFromArray(powerups, p => p._collected || p.y > HEIGHT + 40);
  }

  function invincibilityDuration() {
    if (difficulty === 'easy') return 12; // very long invincibility on easy
    if (difficulty === 'hard') return 4;
    return 7;
  }

  function damagePlayer(amount) {
    if (gameOver || victory || invincibleFor > 0) return;
    let scaled = amount;
    if (difficulty === 'easy') {
      // Easy: every hit is just 1 life, no more.
      scaled = 1;
    } else if (difficulty === 'hard') {
      scaled = amount + 1;
    }
    lives -= scaled;
    if (lives <= 0) {
      lives = 0;
      onGameOver();
    }
    syncHud();
    sound.playGameOver();
  }

  function onEnemyKilled(e) {
    score += 15;
    syncScore();
    sound.playScore();
    const fruitChance = difficulty === 'easy' ? 0.45 : (difficulty === 'hard' ? 0.18 : 0.3);
    const powerChance = difficulty === 'easy' ? 0.2 : (difficulty === 'hard' ? 0.08 : 0.12);
    if (Math.random() < fruitChance) {
      spawnFruit(e.x, e.y);
    }
    if (Math.random() < powerChance) {
      spawnPowerup(e.x, e.y);
    }
  }

  function onBossKilled() {
    score += 500;
    syncScore();
    sound.playWin();
    victory = true;
    running = false;
  }

  function onGameOver() {
    gameOver = true;
    running = false;
    if (window.playBoxGetRevives && window.playBoxUseRevive) {
      const left = window.playBoxGetRevives();
      if (left > 0) {
        reviveBtn.style.display = '';
        reviveBtn.textContent = `Revive (${left} left)`;
      }
    }
  }

  function checkLevelComplete() {
    const noRegulars = enemies.length === 0 && enemiesSpawned >= enemiesToSpawn;
    const bossDone = level < MAX_LEVEL || (boss && boss.hp <= 0);
    if (noRegulars && bossDone && !gameOver && !victory) {
      if (level < MAX_LEVEL) {
        level++;
        resetLevelState();
        syncHud();
      }
    }
  }

  function syncScore() {
    scoreBadge.textContent = `Score: ${score}`;
    const newBest = updateHighScore(HS_KEY, score);
    if (newBest !== bestScore) {
      bestScore = newBest;
      bestBadge.textContent = `Best: ${bestScore}`;
    }
  }

  // --- Drawing ---
  function draw() {
    // space background
    const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    g.addColorStop(0, '#020617');
    g.addColorStop(1, '#020617');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // starfield
    ctx.fillStyle = 'rgba(248,250,252,0.6)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 37 + Math.floor(time * 60)) % WIDTH;
      const sy = (i * 53) % HEIGHT;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // play area horizon
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT * 0.3);
    ctx.lineTo(WIDTH, HEIGHT * 0.3);
    ctx.stroke();

    // player ship
    drawPlayerShip(player.x, player.y, time);

    // enemies
    enemies.forEach(e => drawEnemy(e, time));

    // boss
    if (boss && boss.hp > 0) {
      drawBoss(boss, time);
    }

    // bullets
    bullets.forEach(b => drawPlayerBullet(b));
    enemyBullets.forEach(b => drawEnemyBullet(b));

    // fruits
    fruits.forEach(f => drawFruit(f));

    // powerups
    powerups.forEach(p => drawPowerup(p));

    // invincibility aura around player when active
    if (invincibleFor > 0) {
      drawInvincibleAura();
    }

    if (gameOver || victory) {
      ctx.fillStyle = 'rgba(15,23,42,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#e5e7eb';
      ctx.textAlign = 'center';
      ctx.font = '20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(victory ? 'You beat the boss!' : 'Game Over', WIDTH / 2, HEIGHT / 2 - 8);
      ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('Press Start to play again.', WIDTH / 2, HEIGHT / 2 + 18);
    } else if (!running) {
      ctx.fillStyle = 'rgba(15,23,42,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#e5e7eb';
      ctx.textAlign = 'center';
      ctx.font = '18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Press Start or Space to begin', WIDTH / 2, HEIGHT / 2 - 6);
      ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('Clear 25 levels and defeat the boss.', WIDTH / 2, HEIGHT / 2 + 16);
    }
  }

  function drawPlayerShip(x, y, t) {
    const thruster = (Math.sin(t * 20) + 1) * 0.5;
    const wobble = Math.sin(t * 4) * 1.5;

    ctx.save();
    ctx.translate(x, y + wobble);

    // glow
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
    grad.addColorStop(0, 'rgba(56,189,248,0.7)');
    grad.addColorStop(1, 'rgba(15,23,42,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(18, 16);
    ctx.lineTo(-18, 16);
    ctx.closePath();
    ctx.fill();

    // cockpit
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.ellipse(0, -4, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // wings
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(-20, 4);
    ctx.lineTo(-32, 12);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.moveTo(20, 4);
    ctx.lineTo(32, 12);
    ctx.lineTo(12, 12);
    ctx.closePath();
    ctx.fill();

    // thruster flame
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#f97316';
    const flameLen = 10 + thruster * 18;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(0, 16 + flameLen);
    ctx.lineTo(6, 16);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawEnemy(e, t) {
    const def = ENEMY_TYPES[e.typeIndex];
    const hpRatio = e.hp / Math.max(1, e.maxHp);
    ctx.save();
    ctx.translate(e.x, e.y);

    // base hull
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.roundRect(-14, -14, 28, 28, 8);
    ctx.fill();

    // animated eye / core
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 6 + e.typeIndex));
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 7 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();

    // small health bar
    ctx.fillStyle = 'rgba(15,23,42,0.8)';
    ctx.fillRect(-16, -20, 32, 4);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-16, -20, 32 * hpRatio, 4);

    ctx.restore();
  }

  function drawBoss(b, t) {
    const hpRatio = b.hp / Math.max(1, b.maxHp);
    ctx.save();
    ctx.translate(b.x, b.y);

    // large core ship
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, b.radius + 10);
    grad.addColorStop(0, '#fb7185');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();

    // rotating blades
    ctx.strokeStyle = '#f9a8d4';
    ctx.lineWidth = 4;
    const blades = 4;
    for (let i = 0; i < blades; i++) {
      const ang = t * 1.6 + (i * Math.PI * 2) / blades;
      const x1 = Math.cos(ang) * (b.radius - 10);
      const y1 = Math.sin(ang) * (b.radius - 10);
      const x2 = Math.cos(ang) * (b.radius + 12);
      const y2 = Math.sin(ang) * (b.radius + 12);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // eye
    ctx.fillStyle = '#fecaca';
    ctx.beginPath();
    ctx.arc(0, -4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    // boss health bar (top of screen)
    ctx.restore();
    const barWidth = WIDTH * 0.6;
    const barX = (WIDTH - barWidth) / 2;
    const barY = 14;
    ctx.fillStyle = 'rgba(15,23,42,0.8)';
    ctx.fillRect(barX, barY, barWidth, 10);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(barX, barY, barWidth * hpRatio, 10);
    ctx.strokeStyle = '#fbbf24';
    ctx.strokeRect(barX, barY, barWidth, 10);
  }

  function drawPlayerBullet(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.roundRect(-2, -8, 4, 12, 2);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemyBullet(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFruit(f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.kind === 'banana') {
      drawBanana();
    } else if (f.kind === 'strawberry') {
      drawStrawberry();
    } else {
      drawKiwi();
    }
    ctx.restore();
  }

  function drawPowerup(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    // glowing shield orb for invincibility
    const r = p.radius + 4;
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
    g.addColorStop(0, 'rgba(190,242,255,0.9)');
    g.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBanana() {
    ctx.rotate(-0.3);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0.4 * Math.PI, 1.4 * Math.PI);
    ctx.stroke();
  }

  function drawStrawberry() {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(10, 4, 10, -6, 0, -10);
    ctx.bezierCurveTo(-10, -6, -10, 4, 0, 10);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-4, -12, 8, 4);
  }

  function drawKiwi() {
    ctx.fillStyle = '#4d7c0f';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI * 2) / 8;
      const rx = Math.cos(ang) * 4;
      const ry = Math.sin(ang) * 4;
      ctx.beginPath();
      ctx.arc(rx, ry, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawInvincibleAura() {
    const r = player.radius + 26;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(time * 6);
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, r);
    g.addColorStop(0, 'rgba(190,242,255,0.8)');
    g.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- Small helpers ---
  function makeButton(text) {
    const btn = document.createElement('button');
    btn.textContent = text;
    return btn;
  }

  function makeBadge(text) {
    const span = document.createElement('span');
    span.className = 'badge';
    span.textContent = text;
    return span;
  }

  function createRules(lines) {
    const d = document.createElement('details');
    d.className = 'rules';
    const s = document.createElement('summary');
    s.textContent = 'How to play';
    const ul = document.createElement('ul');
    lines.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    d.append(s, ul);
    return d;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function circleHit(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const ra = a.radius || 10;
    const rb = b.radius || 10;
    return dx * dx + dy * dy <= (ra + rb) * (ra + rb);
  }

  function removeDeadFromArray(arr, isDead) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (isDead(arr[i])) arr.splice(i, 1);
    }
  }

  function applyDifficulty(name) {
    difficulty = name;
    easyBtn.classList.toggle('primary', difficulty === 'easy');
    mediumBtn.classList.toggle('primary', difficulty === 'medium');
    hardBtn.classList.toggle('primary', difficulty === 'hard');
    resetForNewGame();
    draw(0);
  }

  // --- Button bindings ---
  startBtn.addEventListener('click', () => {
    sound.playClick();
    if (!running) {
      startLoop();
    }
  });

  pauseBtn.addEventListener('click', () => {
    sound.playClick();
    if (running) stopLoop(); else startLoop();
  });

  resetBtn.addEventListener('click', () => {
    sound.playClick();
    resetForNewGame();
    draw(0);
  });

  easyBtn.addEventListener('click', () => {
    sound.playClick();
    applyDifficulty('easy');
  });

  mediumBtn.addEventListener('click', () => {
    sound.playClick();
    applyDifficulty('medium');
  });

  hardBtn.addEventListener('click', () => {
    sound.playClick();
    applyDifficulty('hard');
  });

  reviveBtn.addEventListener('click', () => {
    if (!(window.playBoxUseRevive && window.playBoxGetRevives)) return;
    let ok = window.playBoxUseRevive();
    if (!ok) {
      if (window.playBoxPromptRevivePurchase && window.playBoxPromptRevivePurchase()) {
        ok = window.playBoxUseRevive();
      }
      if (!ok) {
        reviveBtn.style.display = 'none';
        alert('No revives left.');
        return;
      }
    }
    sound.playClick();
    gameOver = false;
    running = true;
    lives = baseLives();
    syncHud();
    reviveBtn.style.display = 'none';
    lastTime = performance.now();
    requestAnimationFrame(loop);
  });

  // allow quick start via Space when focused on page
  addEventListener('keydown', (e) => {
    if (e.key === ' ' && !running) {
      e.preventDefault();
      startLoop();
    }
  });

  // Start screen
  const startScreen = document.createElement('div');
  startScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;

  const startPanel = document.createElement('div');
  startPanel.style.cssText = `
    background: white;
    border-radius: 20px;
    padding: 3rem;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  const startTitle = document.createElement('h1');
  startTitle.textContent = '🚀 Fruit Shooter';
  startTitle.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 2.5rem;
    color: #667eea;
  `;

  const startDesc = document.createElement('p');
  startDesc.textContent = 'Level-based space shooter! Battle through 25 levels, collect fruit power-ups, and defeat the final boss. Use WASD/Arrows to move, Space to shoot!';
  startDesc.style.cssText = `
    margin: 0 0 1.5rem 0;
    font-size: 1.1rem;
    color: #555;
    line-height: 1.6;
  `;

  const startHighScore = document.createElement('p');
  startHighScore.textContent = bestScore > 0 ? `🏆 Best Score: ${bestScore}` : '🏆 No high score yet';
  startHighScore.style.cssText = `
    margin: 0 0 2rem 0;
    font-size: 1.2rem;
    color: #764ba2;
    font-weight: bold;
  `;

  const startButton = document.createElement('button');
  startButton.textContent = '▶ Start Game';
  startButton.className = 'button primary';
  startButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.3rem;
    margin: 0.5rem;
    cursor: pointer;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: bold;
    transition: transform 0.2s, box-shadow 0.2s;
  `;

  const hubButton = document.createElement('button');
  hubButton.textContent = '🏠 Back to Hub';
  hubButton.className = 'button';
  hubButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 2px solid #667eea;
    border-radius: 10px;
    background: white;
    color: #667eea;
    font-weight: bold;
    transition: all 0.2s;
  `;

  startButton.addEventListener('mouseenter', () => {
    startButton.style.transform = 'translateY(-2px)';
    startButton.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.4)';
  });
  startButton.addEventListener('mouseleave', () => {
    startButton.style.transform = 'translateY(0)';
    startButton.style.boxShadow = 'none';
  });

  hubButton.addEventListener('mouseenter', () => {
    hubButton.style.background = '#667eea';
    hubButton.style.color = 'white';
  });
  hubButton.addEventListener('mouseleave', () => {
    hubButton.style.background = 'white';
    hubButton.style.color = '#667eea';
  });

  startButton.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    setTimeout(() => {
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  hubButton.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    location.hash = '#/';
  });

  startPanel.append(startTitle, startDesc, startHighScore, startButton, hubButton);
  startScreen.appendChild(startPanel);
  root.appendChild(startScreen);

  // Scroll indicator
  const scrollIndicator = document.createElement('div');
  scrollIndicator.innerHTML = '⬇ Scroll to play ⬇';
  scrollIndicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(102, 126, 234, 0.9);
    color: white;
    padding: 0.8rem 1.5rem;
    border-radius: 25px;
    font-weight: bold;
    z-index: 999;
    animation: bounce 2s infinite;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  `;
  root.appendChild(scrollIndicator);

  // Hide scroll indicator when start screen is removed
  const observerStart = new MutationObserver(() => {
    if (!document.body.contains(startScreen)) {
      scrollIndicator.remove();
      observerStart.disconnect();
    }
  });
  observerStart.observe(root, { childList: true });

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

  // Default difficulty
  applyDifficulty('easy');

  return () => {
    destroyed = true;
    running = false;
    removeEventListener('keydown', onKeyDown);
    removeEventListener('keyup', onKeyUp);
    if (startScreen.parentNode) startScreen.remove();
    if (scrollIndicator.parentNode) scrollIndicator.remove();
    wrap.remove();
  };
}
