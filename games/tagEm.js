// games/tagEm.js
// "Tag Em! You're It!" — local 2-player tag game on a single keyboard.
// Player 1: W/A/S/D
// Player 2: Arrow keys
// First we draw a simple running animation for each player, then
// we add an in-game Settings tab for map, round time, and who is "it".

import { sound } from '../sound.js';

const TUTORIAL_KEY = 'tag-em-tutorial-completed';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'tag-em';

  // --- Top toolbar ---
  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const tutorialBtn = makeButton('🎓 Tutorial');
  tutorialBtn.classList.add('button');
  tutorialBtn.style.backgroundColor = '#10b981';

  const startBtn = makeButton('Start');
  startBtn.classList.add('button', 'primary');
  const resetBtn = makeButton('Reset');
  resetBtn.classList.add('button');

  const timerBadge = makeBadge('Time: 60s');
  const itBadge = makeBadge('It: Player 1');
  const mapBadge = makeBadge('Map: Neon Grid');

  toolbar.append(tutorialBtn, startBtn, resetBtn, timerBadge, itBadge, mapBadge);

  // --- Tabs: Play field / Settings ---
  const tabsRow = document.createElement('div');
  tabsRow.style.display = 'flex';
  tabsRow.style.gap = '8px';
  tabsRow.style.marginTop = '8px';

  const playTabBtn = document.createElement('button');
  playTabBtn.type = 'button';
  playTabBtn.textContent = 'Play';
  playTabBtn.className = 'button primary';

  const settingsTabBtn = document.createElement('button');
  settingsTabBtn.type = 'button';
  settingsTabBtn.textContent = 'Settings';
  settingsTabBtn.className = 'button';

  tabsRow.append(playTabBtn, settingsTabBtn);

  const panelsRow = document.createElement('div');
  panelsRow.style.display = 'flex';
  panelsRow.style.marginTop = '8px';
  panelsRow.style.gap = '12px';
  panelsRow.style.alignItems = 'flex-start';

  const playPanel = document.createElement('div');
  playPanel.style.flex = '1 1 auto';

  const settingsPanel = document.createElement('div');
  settingsPanel.style.flex = '0 0 260px';
  settingsPanel.classList.add('hidden');

  // --- Rules ---
  const rules = createRules([
    'Player 1: W/A/S/D to move.',
    'Player 2: Arrow keys to move.',
    'The red-outlined runner is IT.',
    'When IT touches the other player, tag swaps after a short cooldown.',
    'Jump on platforms and use portals (purple swirls) to teleport!',
    'Use the Settings tab to pick the map, round time, and who starts as IT.',
  ]);

  // --- Canvas setup ---
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const WIDTH = 640;
  const HEIGHT = 360;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvasWrap.appendChild(canvas);

  playPanel.append(rules, canvasWrap);

  // --- Settings panel content ---
  const settingsBox = document.createElement('div');
  settingsBox.className = 'rules';

  const settingsTitle = document.createElement('h3');
  settingsTitle.textContent = 'Match settings';
  settingsTitle.style.marginTop = '0';

  // Map selection
  const mapLabel = document.createElement('label');
  mapLabel.textContent = 'Map:';
  mapLabel.style.display = 'block';
  mapLabel.style.marginTop = '4px';

  const mapSelect = document.createElement('select');
  mapSelect.className = 'select';
  const MAPS = [
    { id: 'grid', name: 'Neon Grid', platforms: [], portals: [] },
    { id: 'forest', name: 'Forest Chase',
      platforms: [
        { x: 120, y: 200, w: 100, h: 12 },
        { x: 400, y: 180, w: 140, h: 12 },
        { x: 250, y: 280, w: 90, h: 12 },
      ],
      portals: [
        { x: 80, y: 320, radius: 25, linkedTo: 1 },
        { x: 550, y: 100, radius: 25, linkedTo: 0 },
      ],
    },
    { id: 'playground', name: 'Playground',
      platforms: [
        { x: 160, y: 160, w: 120, h: 14 },
        { x: 360, y: 220, w: 150, h: 14 },
        { x: 100, y: 300, w: 80, h: 14 },
        { x: 480, y: 280, w: 100, h: 14 },
      ],
      portals: [
        { x: 70, y: 80, radius: 28, linkedTo: 1 },
        { x: 570, y: 280, radius: 28, linkedTo: 0 },
      ],
    },
  ];
  MAPS.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    mapSelect.appendChild(opt);
  });
  mapSelect.value = 'grid';
  mapLabel.appendChild(mapSelect);

  // Time selection
  const timeLabel = document.createElement('label');
  timeLabel.textContent = 'Round time:';
  timeLabel.style.display = 'block';
  timeLabel.style.marginTop = '8px';

  const timeSelect = document.createElement('select');
  timeSelect.className = 'select';
  [60, 120, 180].forEach((sec) => {
    const opt = document.createElement('option');
    opt.value = String(sec);
    opt.textContent = `${sec} seconds`;
    timeSelect.appendChild(opt);
  });
  timeSelect.value = '60';
  timeLabel.appendChild(timeSelect);

  // Who is it selection
  const itGroupLabel = document.createElement('div');
  itGroupLabel.textContent = 'Who is IT at start?';
  itGroupLabel.style.marginTop = '8px';
  itGroupLabel.style.marginBottom = '4px';

  const itOptions = document.createElement('div');
  itOptions.style.display = 'flex';
  itOptions.style.flexDirection = 'column';
  itOptions.style.gap = '4px';

  function makeRadio(value, labelText, checked = false) {
    const lbl = document.createElement('label');
    lbl.style.display = 'flex';
    lbl.style.alignItems = 'center';
    lbl.style.gap = '4px';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'tag-em-it-start';
    input.value = value;
    input.checked = checked;
    const span = document.createElement('span');
    span.textContent = labelText;
    lbl.append(input, span);
    return lbl;
  }

  const itP1Radio = makeRadio('p1', 'Player 1 (blue)', true);
  const itP2Radio = makeRadio('p2', 'Player 2 (orange)', false);
  const itRandomRadio = makeRadio('random', 'Random each round', false);

  itOptions.append(itP1Radio, itP2Radio, itRandomRadio);

  const hint = document.createElement('p');
  hint.textContent = 'Tip: You can change these while paused. Press Start to begin the round.';
  hint.style.fontSize = '0.8rem';
  hint.style.opacity = '0.85';
  hint.style.marginTop = '8px';

  settingsBox.append(settingsTitle, mapLabel, timeLabel, itGroupLabel, itOptions, hint);
  settingsPanel.appendChild(settingsBox);

  panelsRow.append(playPanel, settingsPanel);

  wrap.append(toolbar, tabsRow, panelsRow);
  root.appendChild(wrap);

  // --- Tab logic ---
  function activateTab(which) {
    const showPlay = which === 'play';
    playPanel.classList.toggle('hidden', !showPlay);
    settingsPanel.classList.toggle('hidden', showPlay);
    playTabBtn.classList.toggle('primary', showPlay);
    settingsTabBtn.classList.toggle('primary', !showPlay);
  }

  playTabBtn.addEventListener('click', () => {
    sound.playClick();
    activateTab('play');
  });
  settingsTabBtn.addEventListener('click', () => {
    sound.playClick();
    activateTab('settings');
  });

  activateTab('play');

  // --- Tutorial System ---
  function showTutorial() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';

    const box = document.createElement('div');
    box.style.backgroundColor = '#1f2937';
    box.style.border = '2px solid #10b981';
    box.style.borderRadius = '12px';
    box.style.padding = '30px';
    box.style.maxWidth = '500px';
    box.style.width = '100%';
    box.style.color = '#fff';
    box.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';

    const title = document.createElement('h2');
    title.style.margin = '0 0 15px 0';
    title.style.color = '#10b981';
    title.style.fontSize = '24px';

    const content = document.createElement('p');
    content.style.margin = '0 0 20px 0';
    content.style.fontSize = '16px';
    content.style.lineHeight = '1.5';

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '10px';
    btnRow.style.justifyContent = 'space-between';

    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back';
    backBtn.className = 'button';
    backBtn.style.flex = '1';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.className = 'button primary';
    nextBtn.style.flex = '1';

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip';
    skipBtn.className = 'button';

    btnRow.append(backBtn, skipBtn, nextBtn);
    box.append(title, content, btnRow);
    overlay.appendChild(box);

    const steps = [
      {
        title: '🏃 Welcome to Tag Em!',
        text: 'A fast-paced 2-player tag game on one keyboard! Chase your friend, jump on platforms, and use portals. Who will be "it" when time runs out?'
      },
      {
        title: '🎮 Player 1 Controls',
        text: 'Player 1 (Blue) uses W/A/S/D: W to jump, A to move left, D to move right. The player with the red outline is IT!'
      },
      {
        title: '🕹️ Player 2 Controls',
        text: 'Player 2 (Orange) uses Arrow Keys: Up to jump, Left to move left, Right to move right. Run away if you\'re IT!'
      },
      {
        title: '⭕ Tag Mechanics',
        text: 'When the IT player touches the other player, the tag swaps after a short cooldown. Try to avoid being IT when the timer hits zero!'
      },
      {
        title: '🗺️ Maps & Portals',
        text: 'Each map has platforms to jump on and purple portals to teleport! Use the Settings tab to change maps, round time, and who starts as IT.'
      },
      {
        title: '🏆 Win Condition',
        text: 'Whoever is NOT "it" when time runs out wins the round! Use strategy, speed, and portals to your advantage!'
      }
    ];

    let currentStep = 0;

    function render() {
      const step = steps[currentStep];
      title.textContent = step.title;
      content.textContent = step.text;

      backBtn.style.display = currentStep === 0 ? 'none' : 'block';
      nextBtn.textContent = currentStep === steps.length - 1 ? 'Done' : 'Next';
    }

    backBtn.onclick = () => {
      if (currentStep > 0) {
        currentStep--;
        render();
      }
    };

    nextBtn.onclick = () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        render();
      } else {
        localStorage.setItem(TUTORIAL_KEY, 'true');
        document.body.removeChild(overlay);
        setTimeout(() => {
          wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    skipBtn.onclick = () => {
      localStorage.setItem(TUTORIAL_KEY, 'true');
      document.body.removeChild(overlay);
      setTimeout(() => {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };

    render();
    document.body.appendChild(overlay);
  }

  // --- Game state ---
  const PLAYER_RADIUS = 18;
  const BASE_SPEED = 200; // pixels per second
  const GRAVITY = 800; // pixels per second^2
  const JUMP_SPEED = 300;

  const p1 = {
    x: WIDTH * 0.3,
    y: HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    onGround: false,
    anim: 0,
    moving: false,
    color: '#4aa8ff',
    portalCooldown: 0,
  };
  const p2 = {
    x: WIDTH * 0.7,
    y: HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    onGround: false,
    anim: 0,
    moving: false,
    color: '#ffb347',
    portalCooldown: 0,
  };

  let itPlayer = 'p1';
  let running = false;
  let destroyed = false;
  let lastTime = null;
  let timeLeft = 60;
  let roundDuration = 60;
  let tagCooldown = 0; // seconds
  let message = 'Press Start to play!';

  const keys = Object.create(null);

  function chooseItFromSettings() {
    const startChoice = getItChoice();
    if (startChoice === 'random') {
      itPlayer = Math.random() < 0.5 ? 'p1' : 'p2';
    } else if (startChoice === 'p1' || startChoice === 'p2') {
      itPlayer = startChoice;
    } else {
      itPlayer = 'p1';
    }
  }

  function getItChoice() {
    const inputs = settingsBox.querySelectorAll('input[name="tag-em-it-start"]');
    for (const input of inputs) {
      if (input.checked) return input.value;
    }
    return 'p1';
  }

  function syncBadges() {
    timerBadge.textContent = `Time: ${Math.ceil(timeLeft)}s`;
    itBadge.textContent = itPlayer === 'p1' ? 'It: Player 1' : 'It: Player 2';
    const mapMeta = MAPS.find((m) => m.id === mapSelect.value) || MAPS[0];
    mapBadge.textContent = `Map: ${mapMeta.name}`;
  }

  function resetPositions() {
    p1.x = WIDTH * 0.3;
    p1.y = HEIGHT * 0.5;
    p1.vx = 0;
    p1.vy = 0;
    p1.onGround = false;
    p1.portalCooldown = 0;
    p2.x = WIDTH * 0.7;
    p2.y = HEIGHT * 0.5;
    p2.vx = 0;
    p2.vy = 0;
    p2.onGround = false;
    p2.portalCooldown = 0;
    p1.anim = 0;
    p2.anim = 0;
    p1.moving = false;
    p2.moving = false;
  }

  function resetState() {
    running = false;
    lastTime = null;
    roundDuration = Number(timeSelect.value) || 60;
    timeLeft = roundDuration;
    tagCooldown = 0;
    resetPositions();
    chooseItFromSettings();
    message = 'Press Start to play!';
    syncBadges();
    draw();
  }

  function startRound() {
    if (running) return;
    sound.playClick();
    // if previous round ended, reset before starting again
    if (timeLeft <= 0 || !lastTime) {
      resetState();
    }
    running = true;
    lastTime = performance.now();
    message = '';
    requestAnimationFrame(loop);
  }

  function getCurrentMap() {
    return MAPS.find((m) => m.id === mapSelect.value) || MAPS[0];
  }

  function clampPlayer(p) {
    if (p.x < PLAYER_RADIUS) p.x = PLAYER_RADIUS;
    if (p.x > WIDTH - PLAYER_RADIUS) p.x = WIDTH - PLAYER_RADIUS;
    if (p.y > HEIGHT - PLAYER_RADIUS) {
      p.y = HEIGHT - PLAYER_RADIUS;
      p.vy = 0;
      p.onGround = true;
    }
  }

  function handleMovementAndAnim(p, input, dt) {
    const { up, left, right, jump } = input;
    
    // Horizontal movement
    let vx = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    
    const moving = Math.abs(vx) > 0.001;
    p.moving = moving;
    const animSpeed = moving ? 9 : 3;
    p.anim += dt * animSpeed;

    p.vx = vx * BASE_SPEED;

    // Apply gravity
    p.vy += GRAVITY * dt;

    // Jump
    if (jump && p.onGround) {
      p.vy = -JUMP_SPEED;
      p.onGround = false;
    }

    // Update position
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Platform collision
    const map = getCurrentMap();
    p.onGround = false;
    
    map.platforms.forEach((plat) => {
      const px = p.x;
      const py = p.y + PLAYER_RADIUS;
      const prevY = py - p.vy * dt;

      if (px > plat.x && px < plat.x + plat.w) {
        if (py >= plat.y && prevY <= plat.y && p.vy > 0) {
          p.y = plat.y - PLAYER_RADIUS;
          p.vy = 0;
          p.onGround = true;
        }
      }
    });

    clampPlayer(p);

    // Portal teleportation
    if (p.portalCooldown > 0) {
      p.portalCooldown -= dt;
    } else {
      map.portals.forEach((portal, idx) => {
        const dx = p.x - portal.x;
        const dy = p.y - portal.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < portal.radius + PLAYER_RADIUS * 0.5) {
          const linked = map.portals[portal.linkedTo];
          if (linked) {
            p.x = linked.x;
            p.y = linked.y;
            p.portalCooldown = 0.5;
            sound.playMove();
          }
        }
      });
    }
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function maybeHandleTag(dt) {
    if (tagCooldown > 0) {
      tagCooldown = Math.max(0, tagCooldown - dt);
      return;
    }
    const d = distance(p1, p2);
    if (d <= PLAYER_RADIUS * 1.6) {
      // swap IT
      itPlayer = itPlayer === 'p1' ? 'p2' : 'p1';
      tagCooldown = 0.7;
      sound.playScore();
      message = itPlayer === 'p1' ? 'Tag! Player 1 is now IT!' : 'Tag! Player 2 is now IT!';
      syncBadges();
    }
  }

  function step(dt) {
    if (!running) return;

    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      running = false;
      sound.playGameOver();
      message = itPlayer === 'p1' ? 'Time up! Player 2 escaped IT.' : 'Time up! Player 1 escaped IT.';
      syncBadges();
      return;
    }

    // Input states for both players
    const inputP1 = {
      left: !!(keys['a'] || keys['A']),
      right: !!(keys['d'] || keys['D']),
      jump: !!(keys['w'] || keys['W']),
    };
    const inputP2 = {
      left: !!keys['ArrowLeft'],
      right: !!keys['ArrowRight'],
      jump: !!keys['ArrowUp'],
    };

    handleMovementAndAnim(p1, inputP1, dt);
    handleMovementAndAnim(p2, inputP2, dt);

    maybeHandleTag(dt);
    syncBadges();
  }

  function loop(now) {
    if (destroyed) return;
    if (!running) {
      draw();
      return;
    }

    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    step(dt);
    draw();

    if (!destroyed) requestAnimationFrame(loop);
  }

  // --- Drawing ---
  function drawPlatforms(platforms) {
    ctx.save();
    platforms.forEach((plat) => {
      const gradient = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1e40af');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 4);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawPortals(portals, t) {
    ctx.save();
    portals.forEach((portal, idx) => {
      const spin = t * 2 + idx * Math.PI;
      
      // Outer glow
      const grad = ctx.createRadialGradient(
        portal.x, portal.y, portal.radius * 0.3,
        portal.x, portal.y, portal.radius
      );
      grad.addColorStop(0, 'rgba(147, 51, 234, 0.8)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
      grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
      ctx.fill();

      // Spinning spiral
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = spin + (i * Math.PI * 2) / 3;
        const r = portal.radius * 0.7;
        ctx.moveTo(portal.x, portal.y);
        ctx.lineTo(
          portal.x + Math.cos(angle) * r,
          portal.y + Math.sin(angle) * r
        );
      }
      ctx.stroke();

      // Center dot
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawBackground(kind, t) {
    if (kind === 'forest') {
      const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      g.addColorStop(0, '#0c2f1c');
      g.addColorStop(1, '#184c2b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // simple trees
      ctx.fillStyle = '#0b2014';
      for (let i = 0; i < 10; i++) {
        const x = (i * 70 + (t * 40)) % (WIDTH + 80) - 40;
        ctx.fillRect(x, HEIGHT - 70, 10, 40);
        ctx.beginPath();
        ctx.arc(x + 5, HEIGHT - 80, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === 'playground') {
      const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      g.addColorStop(0, '#87ceeb');
      g.addColorStop(1, '#ffe9a9');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // sandbox
      ctx.fillStyle = '#f5c77b';
      ctx.fillRect(40, HEIGHT - 120, WIDTH - 80, 80);

      // simple slides
      ctx.strokeStyle = '#ff5c7a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(120, HEIGHT - 140);
      ctx.lineTo(60, HEIGHT - 40);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(WIDTH - 120, HEIGHT - 140);
      ctx.lineTo(WIDTH - 60, HEIGHT - 40);
      ctx.stroke();
    } else {
      // default: neon grid
      const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      g.addColorStop(0, '#05060f');
      g.addColorStop(1, '#111827');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = 'rgba(0, 255, 200, 0.2)';
      ctx.lineWidth = 1;

      const spacing = 40;
      for (let x = 0; x <= WIDTH; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= HEIGHT; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
      }
    }
  }

  function drawRunner(p, isIt) {
    const t = p.anim;
    const bob = Math.sin(t * 4) * (p.moving ? 4 : 1.5);
    const legSwing = Math.sin(t * 8) * (p.moving ? 7 : 3);
    const armSwing = Math.cos(t * 8) * (p.moving ? 7 : 3);

    ctx.save();
    ctx.translate(p.x, p.y);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs
    ctx.strokeStyle = '#1f2933';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 8 + bob);
    ctx.lineTo(-6, 18 + bob + legSwing);
    ctx.moveTo(6, 8 + bob);
    ctx.lineTo(6, 18 + bob - legSwing);
    ctx.stroke();

    // body
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.roundRect(-11, -4 + bob, 22, 18, 6);
    ctx.fill();

    // arms
    ctx.strokeStyle = '#1f2933';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -2 + bob);
    ctx.lineTo(-16, 6 + bob + armSwing);
    ctx.moveTo(10, -2 + bob);
    ctx.lineTo(16, 6 + bob - armSwing);
    ctx.stroke();

    // head
    ctx.fillStyle = '#f5d0a0';
    ctx.beginPath();
    ctx.arc(0, -12 + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    // face
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(2, -13 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // IT ring
    if (isIt) {
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -18 + bob, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function draw() {
    const now = performance.now() / 1000;
    const map = getCurrentMap();

    drawBackground(map.id, now);
    drawPlatforms(map.platforms);
    drawPortals(map.portals, now);
    drawRunner(p1, itPlayer === 'p1');
    drawRunner(p2, itPlayer === 'p2');

    // HUD text
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(8, 8, 150, 44);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}s`, 14, 14);
    ctx.fillText(itPlayer === 'p1' ? 'IT: Player 1' : 'IT: Player 2', 14, 30);
    ctx.restore();

    if (!running && message) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, HEIGHT * 0.5 - 40, WIDTH, 80);
      ctx.fillStyle = '#f9fafb';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(message, WIDTH / 2, HEIGHT / 2);
      ctx.restore();
    }
  }

  // --- Input handling ---
  function onKeyDown(e) {
    const k = e.key;
    if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight' ||
        k === 'w' || k === 'a' || k === 's' || k === 'd' ||
        k === 'W' || k === 'A' || k === 'S' || k === 'D') {
      e.preventDefault();
    }
    if (k === ' ') {
      // space to start/pause
      if (running) {
        running = false;
        message = 'Paused';
      } else {
        startRound();
      }
      return;
    }
    keys[k] = true;
  }

  function onKeyUp(e) {
    keys[e.key] = false;
  }

  // --- Button bindings ---
  startBtn.addEventListener('click', () => {
    if (running) return;
    startRound();
  });

  resetBtn.addEventListener('click', () => {
    sound.playClick();
    resetState();
  });

  tutorialBtn.addEventListener('click', () => {
    sound.playClick();
    setTimeout(() => {
      document.body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    setTimeout(() => {
      showTutorial();
    }, 300);
  });

  mapSelect.addEventListener('change', () => {
    syncBadges();
    draw();
  });
  timeSelect.addEventListener('change', () => {
    // time length only changes on next reset/start
    roundDuration = Number(timeSelect.value) || 60;
    if (!running) {
      timeLeft = roundDuration;
      syncBadges();
      draw();
    }
  });
  settingsBox.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'tag-em-it-start' && !running) {
      chooseItFromSettings();
      syncBadges();
      draw();
    }
  });

  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);

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
  startTitle.textContent = '🏃 Tag Em!';
  startTitle.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 2.5rem;
    color: #667eea;
  `;

  const startDesc = document.createElement('p');
  startDesc.textContent = "You're It! Chase your friend in this 2-player tag game. Player 1 uses WASD, Player 2 uses arrow keys. Jump platforms, use portals, and don't get caught!";
  startDesc.style.cssText = `
    margin: 0 0 1.5rem 0;
    font-size: 1.1rem;
    color: #555;
    line-height: 1.6;
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

  startPanel.append(startTitle, startDesc, startButton, hubButton);
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

  // initial state
  resetState();

  // Show tutorial for first-time players
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    setTimeout(() => {
      showTutorial();
    }, 500);
  }

  // cleanup on unmount
  return () => {
    destroyed = true;
    removeEventListener('keydown', onKeyDown);
    removeEventListener('keyup', onKeyUp);
    if (startScreen.parentNode) startScreen.remove();
    if (scrollIndicator.parentNode) scrollIndicator.remove();
    wrap.remove();
  };
}

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

function createRules(items) {
  const d = document.createElement('details');
  d.className = 'rules';
  const s = document.createElement('summary');
  s.textContent = 'How to play';
  const ul = document.createElement('ul');
  items.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });
  d.append(s, ul);
  return d;
}