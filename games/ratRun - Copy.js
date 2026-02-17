// games/ratRun.js
import { sound } from '../sound.js';
import { getNumber, setNumber, getHighScore, updateHighScore } from '../highScores.js';

// Simple lane-based endless runner:
// - Control a running rat with Up/Down or W/S
// - Dodge mouse traps, collect cheese
// - Cheese is persistent currency used to unlock and equip skins

const TUTORIAL_KEY = 'rat-run-tutorial-completed';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'rat-run';

  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const tutorialBtn = makeButton('🎓 Tutorial');
  tutorialBtn.classList.add('button');
  tutorialBtn.style.backgroundColor = '#10b981';

  const startBtn = makeButton('Start');
  startBtn.classList.add('button', 'primary');
  const pauseBtn = makeButton('Pause');
  pauseBtn.classList.add('button');
  const resetBtn = makeButton('Reset');
  resetBtn.classList.add('button');

  const scoreBadge = makeBadge('Dodged: 0');
  const runCheeseBadge = makeBadge('Run cheese: 0');
  const totalCheeseBadge = makeBadge('Playbux: 0');
  const skinBadge = makeBadge('Skin: Street Rat');
  const bestBadge = makeBadge('Best: 0');
  const reviveBtn = makeButton('Revive');
  reviveBtn.classList.add('button');
  reviveBtn.style.display = 'none';

  toolbar.append(
    tutorialBtn,
    startBtn,
    pauseBtn,
    resetBtn,
    reviveBtn,
    scoreBadge,
    bestBadge,
    runCheeseBadge,
    totalCheeseBadge,
    skinBadge,
  );

  // Canvas
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
    'Use Arrow Up/Down or W/S to switch lanes.',
    'Avoid the red mouse traps.',
    'Collect cheese to earn permanent cheese currency.',
    'Open the Cheese Shop to buy and equip new rat skins.',
'Collect cheese to earn currency and spend it in the shop on the right.',
  ]);

  // Cheese shop UI
  const shop = document.createElement('details');
  shop.className = 'rules';
  const shopSummary = document.createElement('summary');
  shopSummary.textContent = 'Cheese Shop (skins)';
  const shopWallet = document.createElement('p');
  shopWallet.style.margin = '4px 0';
  const shopInfo = document.createElement('p');
  shopInfo.textContent = 'Cheese is saved across sessions. Each cheese you grab adds to your total.';
  shopInfo.style.margin = '4px 0 8px';
  const shopSkins = document.createElement('div');
  shopSkins.style.display = 'flex';
  shopSkins.style.flexWrap = 'wrap';
  shopSkins.style.gap = '8px';

  shop.append(shopSummary, shopWallet, shopInfo, shopSkins);

  // Layout: toolbar on top, then a row with play area (rules + canvas) and shop on the side
  const mainRow = document.createElement('div');
  mainRow.style.display = 'flex';
  mainRow.style.gap = '12px';
  mainRow.style.alignItems = 'flex-start';

  const playColumn = document.createElement('div');
  playColumn.style.flex = '1 1 auto';
  playColumn.append(rules, canvasWrap);

  const shopColumn = document.createElement('div');
  shopColumn.style.flex = '0 0 260px';
  shopColumn.append(shop);

  mainRow.append(playColumn, shopColumn);

  wrap.append(toolbar, mainRow);
  root.appendChild(wrap);

  // === Persistent data: cheese currency & skins ===
  // CHEESE_KEY stores total cheese currency (1 cheese collected = 1 cheese).
  const CHEESE_KEY = 'rat-run:cheese';
  const SELECTED_SKIN_KEY = 'rat-run:skin:selected';
  const OWNED_PREFIX = 'rat-run:skin:owned:';
  const HS_KEY = 'rat-run';

  const SKINS = [
    {
      id: 'street',
      name: 'Street Rat',
      price: 0,
      body: '#c0c0c0',
      ear: '#f7b0c4',
      tail: '#d28d6c',
    },
    {
      id: 'golden',
      name: 'Golden Runner',
      price: 20,
      body: '#f7d65c',
      ear: '#ffe6a3',
      tail: '#f5b041',
    },
    {
      id: 'shadow',
      name: 'Shadow Sneak',
      price: 35,
      body: '#1b1b23',
      ear: '#3c3c4d',
      tail: '#444457',
    },
    {
      id: 'cheddar',
      name: 'Cheddar Suit',
      price: 50,
      body: '#ffd447',
      ear: '#ffe6a3',
      tail: '#ffb347',
    },
    {
      id: 'custom',
      name: 'Custom Rat',
      price: 150,
      body: '#c0c0c0',
      ear: '#f7b0c4',
      tail: '#d28d6c',
      customizable: true,
    },
  ];

  // Load saved custom rat colors if present
  (function loadCustomRatFromStorage() {
    let store = null;
    try { store = window.localStorage; } catch { store = null; }
    if (!store) return;
    const custom = SKINS.find((s) => s.id === 'custom');
    if (!custom) return;
    const body = store.getItem('rat-run:skin:custom:body');
    const ear = store.getItem('rat-run:skin:custom:ear');
    const tail = store.getItem('rat-run:skin:custom:tail');
    if (body) custom.body = body;
    if (ear) custom.ear = ear;
    if (tail) custom.tail = tail;
  })();

  // totalCheese now represents total cheese currency (used directly in the shop)
  let totalCheese = getNumber(CHEESE_KEY, 0);

  let ownedSkins = new Set();
  SKINS.forEach((skin, index) => {
    const owned = skin.price === 0 || getNumber(OWNED_PREFIX + skin.id, skin.price === 0 ? 1 : 0) > 0;
    if (owned) ownedSkins.add(skin.id);
    if (skin.price === 0) {
      // ensure starter skin is marked owned persistently
      setNumber(OWNED_PREFIX + skin.id, 1);
    }
  });

  const storedSelectedIndex = getNumber(SELECTED_SKIN_KEY, 0);
  let selectedSkinIndex = Math.min(Math.max(storedSelectedIndex, 0), SKINS.length - 1);
  if (!ownedSkins.has(SKINS[selectedSkinIndex].id)) {
    selectedSkinIndex = 0;
  }

  let bestDodged = getHighScore(HS_KEY);
  bestBadge.textContent = `Best: ${bestDodged}`;

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
        title: '🐀 Welcome to Rat Run!',
        text: 'Guide your rat through the streets, dodging deadly mouse traps! Collect cheese to unlock cool skins and become the ultimate street rat.'
      },
      {
        title: '🕹️ Controls',
        text: 'Use Up/Down arrow keys or W/S to switch between 3 lanes. Stay alert as the speed increases!'
      },
      {
        title: '🪤 Dodge Traps',
        text: 'Red mouse traps will end your run! Dodge them by moving to a different lane. Each trap you avoid increases your score.'
      },
      {
        title: '🧀 Collect Cheese',
        text: 'Yellow cheese appears in lanes! Collecting cheese earns you permanent currency. Cheese is saved across all your runs!'
      },
      {
        title: '🎨 Cheese Shop',
        text: 'Spend cheese to unlock new rat skins! Each skin gives your rat a unique look. Check the shop on the right to browse skins.'
      },
      {
        title: '🏃 Ready to Run!',
        text: 'Hit Start when you\'re ready! See how many traps you can dodge and how much cheese you can collect. Good luck!'
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

  function currentSkin() {
    return SKINS[selectedSkinIndex] || SKINS[0];
  }

  function syncCheeseUI() {
    const label = `Cheese: ${totalCheese}`;
    shopWallet.textContent = label;
    totalCheeseBadge.textContent = label;
  }

  function updatePersistentCheese() {
    // Save cheese currency and refresh UI labels
    setNumber(CHEESE_KEY, totalCheese);
    syncCheeseUI();
  }

  function updateSkinSelection(index) {
    selectedSkinIndex = index;
    setNumber(SELECTED_SKIN_KEY, selectedSkinIndex);
    skinBadge.textContent = `Skin: ${currentSkin().name}`;
    renderShop();
  }

  function renderShop() {
    syncCheeseUI();
    shopSkins.innerHTML = '';
    const selectedId = currentSkin().id;

    SKINS.forEach((skin, index) => {
      const card = document.createElement('div');
      card.style.border = '1px solid rgba(255,255,255,0.15)';
      card.style.borderRadius = '6px';
      card.style.padding = '6px 8px';
      card.style.minWidth = '140px';
      card.style.background = 'rgba(0,0,0,0.25)';

      const title = document.createElement('div');
      title.textContent = skin.name;
      title.style.fontWeight = '600';
      title.style.fontSize = '0.9rem';

      const price = document.createElement('div');
      price.style.fontSize = '0.8rem';
      price.style.opacity = '0.8';
      price.textContent = skin.price === 0 ? 'Free starter skin' : `Cost: ${skin.price} cheese`;

      const preview = document.createElement('canvas');
      preview.width = 80;
      preview.height = 40;
      preview.style.width = '80px';
      preview.style.height = '40px';
      const pctx = preview.getContext('2d');
      drawRatPreview(pctx, preview.width, preview.height, skin);

      const btn = document.createElement('button');
      btn.className = 'button';
      btn.style.marginTop = '4px';

      const isOwned = ownedSkins.has(skin.id);
      const isSelected = skin.id === selectedId;

      if (!isOwned) {
        const affordable = totalCheese >= skin.price;
        btn.textContent = affordable ? `Buy (${skin.price})` : `Need ${skin.price}`;
        btn.disabled = !affordable;
        btn.addEventListener('click', () => {
          if (totalCheese < skin.price) return;
          totalCheese -= skin.price;
          updatePersistentCheese();
          ownedSkins.add(skin.id);
          setNumber(OWNED_PREFIX + skin.id, 1);
          sound.playScore();
          updateSkinSelection(index);
        });
      } else {
        btn.textContent = isSelected ? 'Equipped' : 'Equip';
        btn.disabled = isSelected;
        btn.addEventListener('click', () => {
          sound.playClick();
          updateSkinSelection(index);
        });
      }

      card.append(title, price, preview, btn);

      // If this is the custom rat and owned, show color pickers
      if (skin.id === 'custom' && isOwned) {
        const controls = document.createElement('div');
        controls.style.marginTop = '6px';
        controls.style.display = 'flex';
        controls.style.flexDirection = 'column';
        controls.style.gap = '4px';

        function makeColorRow(labelText, key) {
          const row = document.createElement('label');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.gap = '4px';
          row.style.fontSize = '0.75rem';
          const span = document.createElement('span');
          span.textContent = labelText;
          const input = document.createElement('input');
          input.type = 'color';
          input.value = skin[key];
          input.style.width = '34px';
          input.style.height = '20px';
          input.addEventListener('input', () => {
            skin[key] = input.value;
            saveCustomSkinColors(skin);
            drawRatPreview(pctx, preview.width, preview.height, skin);
          });
          row.append(span, input);
          return row;
        }

        controls.append(
          makeColorRow('Body', 'body'),
          makeColorRow('Ears', 'ear'),
          makeColorRow('Tail', 'tail'),
        );

        const hint = document.createElement('div');
        hint.textContent = 'Customize your rat colors';
        hint.style.fontSize = '0.7rem';
        hint.style.opacity = '0.85';
        controls.appendChild(hint);

        card.appendChild(controls);
      }

      shopSkins.appendChild(card);
    });

    skinBadge.textContent = `Skin: ${currentSkin().name}`;
  }

  renderShop();

  // === Game state ===
  const LANE_COUNT = 3;
  const lanesY = [HEIGHT * 0.25, HEIGHT * 0.5, HEIGHT * 0.75];
  const RAT_X = 130;
  const RAT_W = 80;
  const RAT_H = 34;

  let ratY = lanesY[1];
  let targetLane = 1;

  let running = false;
  let destroyed = false;
  let lastTime = null;
  let time = 0;

  let traps = [];
  let cheeses = [];
  let powerups = [];
  let distance = 0;
  let dodged = 0;
  let runCheese = 0;
  let crashed = false;

  let speed = 220; // px / second
  const SPEED_MAX = 480;
  const SPEED_ACCEL = 12; // per second

  // temporary effects (seconds remaining)
  let invincibleFor = 0;
  let speedBoostFor = 0;
  let slowFor = 0;

  let nextTrapIn = 0.8; // seconds
  let nextCheeseIn = 1.5;
  let nextPowerIn = 6; // seconds until next power-up pad

  scoreBadge.textContent = 'Dodged: 0';
  runCheeseBadge.textContent = 'Run cheese: 0';
  syncCheeseUI();
  skinBadge.textContent = `Skin: ${currentSkin().name}`;

  function resetState(keepRun = false) {
    traps = [];
    cheeses = [];
    powerups = [];
    distance = 0;
    if (!keepRun) {
      dodged = 0;
      runCheese = 0;
    }
    crashed = false;
    speed = 220;
    invincibleFor = 0;
    speedBoostFor = 0;
    slowFor = 0;
    nextTrapIn = 0.8;
    nextCheeseIn = 1.5;
    nextPowerIn = randRange(4, 8);
    ratY = lanesY[1];
    targetLane = 1;
    lastTime = null;
    time = 0;
    running = false;
    reviveBtn.style.display = 'none';
    scoreBadge.textContent = `Dodged: ${dodged}`;
    runCheeseBadge.textContent = `Run cheese: ${runCheese}`;
    syncCheeseUI();
  }

  function laneToY(lane) {
    return lanesY[Math.max(0, Math.min(LANE_COUNT - 1, lane))];
  }

  function changeLane(delta) {
    const next = Math.max(0, Math.min(LANE_COUNT - 1, targetLane + delta));
    if (next !== targetLane) {
      targetLane = next;
      sound.playMove();
    }
  }

  function spawnTrap() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    traps.push({
      x: WIDTH + 40,
      lane,
      w: 44,
      h: 26,
      counted: false,
    });
    nextTrapIn = randRange(0.6, 1.2) * (speed > 360 ? 0.85 : 1);
  }

  function spawnCheese() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    cheeses.push({
      x: WIDTH + 40,
      lane,
      size: 26,
    });
    nextCheeseIn = randRange(1.0, 2.2);
  }

  function spawnPowerup() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const kinds = ['invincible', 'speed', 'slow', 'hammer'];
    // weight toward fun ones
    const weights = {
      invincible: 2,
      speed: 3,
      slow: 2,
      hammer: 2,
    };
    const totalW = kinds.reduce((s, k) => s + weights[k], 0);
    let r = Math.random() * totalW;
    let kind = kinds[0];
    for (const k of kinds) {
      if (r < weights[k]) {
        kind = k;
        break;
      }
      r -= weights[k];
    }
    powerups.push({
      x: WIDTH + 40,
      lane,
      size: 30,
      kind,
    });
    nextPowerIn = randRange(5, 10);
  }

  function startLoop() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function stopLoop() {
    running = false;
  }

  function loop(now) {
    if (!running || destroyed) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    step(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  function step(dt) {
    time += dt;
    speed = Math.min(SPEED_MAX, speed + SPEED_ACCEL * dt);

    // update timers for effects
    if (invincibleFor > 0) invincibleFor = Math.max(0, invincibleFor - dt);
    if (speedBoostFor > 0) speedBoostFor = Math.max(0, speedBoostFor - dt);
    if (slowFor > 0) slowFor = Math.max(0, slowFor - dt);

    // base speed plus temporary modifiers
    let effectiveSpeed = speed;
    if (speedBoostFor > 0 && slowFor <= 0) {
      effectiveSpeed *= 1.6;
    } else if (slowFor > 0 && speedBoostFor <= 0) {
      effectiveSpeed *= 0.55;
    }

    distance += (effectiveSpeed * dt) / 50;

    // Smooth rat position towards target lane
    const targetY = laneToY(targetLane);
    const lerp = 1 - Math.exp(-8 * dt); // smoothstep-ish
    ratY += (targetY - ratY) * lerp;

    // Timers
    nextTrapIn -= dt;
    nextCheeseIn -= dt;
    nextPowerIn -= dt;
    if (nextTrapIn <= 0) spawnTrap();
    if (nextCheeseIn <= 0) spawnCheese();
    if (nextPowerIn <= 0) spawnPowerup();

    const ratBox = {
      x: RAT_X - RAT_W * 0.5,
      y: ratY - RAT_H * 0.5,
      w: RAT_W,
      h: RAT_H,
    };

    // Move traps
    traps.forEach((t) => {
      t.x -= effectiveSpeed * dt;
      const trapBox = {
        x: t.x - t.w * 0.5,
        y: laneToY(t.lane) - t.h * 0.5,
        w: t.w,
        h: t.h,
      };
      if (!t.counted && trapBox.x + trapBox.w < RAT_X - 10) {
        t.counted = true;
        dodged += 1;
        scoreBadge.textContent = `Dodged: ${dodged}`;
        const updated = updateHighScore(HS_KEY, dodged);
        if (updated !== bestDodged) {
          bestDodged = updated;
          bestBadge.textContent = `Best: ${bestDodged}`;
        }
      }
      if (rectsOverlap(ratBox, trapBox) && invincibleFor <= 0) {
        onGameOver();
      }
    });

    // Prune off-screen traps
    traps = traps.filter((t) => t.x + t.w > -40);

    // Move cheeses
    cheeses.forEach((c) => {
      c.x -= effectiveSpeed * dt * 0.9;
      const size = c.size;
      const cheeseBox = {
        x: c.x - size * 0.5,
        y: laneToY(c.lane) - size * 0.5,
        w: size,
        h: size,
      };
      if (rectsOverlap(ratBox, cheeseBox)) {
        // Each cheese increases this run's cheese counter
        runCheese += 1;
        runCheeseBadge.textContent = `Run cheese: ${runCheese}`;

        // Each cheese also directly increases the player's cheese currency
        totalCheese += 1;
        updatePersistentCheese();
        sound.playScore();
        // remove this cheese from the world
        c._collected = true;
      }
    });

    cheeses = cheeses.filter((c) => !c._collected && c.x + c.size > -40);

    // Move power-ups / pads
    powerups.forEach((p) => {
      p.x -= effectiveSpeed * dt * 0.85;
      const size = p.size;
      const box = {
        x: p.x - size * 0.5,
        y: laneToY(p.lane) - size * 0.3,
        w: size,
        h: size * 0.6,
      };
      if (rectsOverlap(ratBox, box)) {
        // apply effect by type
        if (p.kind === 'invincible') {
          invincibleFor = 20;
        } else if (p.kind === 'speed') {
          speedBoostFor = 5;
          slowFor = 0; // cancel slow if active
        } else if (p.kind === 'slow') {
          slowFor = 5;
          speedBoostFor = 0; // cancel boost if active
        } else if (p.kind === 'hammer') {
          // instantly break up to 10 traps in front of the rat
          let remaining = 10;
          traps.forEach((t) => {
            if (remaining > 0 && t.x > RAT_X - 10) {
              t._destroy = true;
              remaining--;
            }
          });
          traps = traps.filter((t) => !t._destroy);
        }
        sound.playScore();
        p._collected = true;
      }
    });
    powerups = powerups.filter((p) => !p._collected && p.x + p.size > -40);
  }

  function onGameOver() {
    if (!running) return;
    running = false;
    crashed = true;
    sound.playGameOver();
    // soft flash overlay drawn in draw()

    // Offer revive if there are shared revives available
    if (window.playBoxGetRevives && window.playBoxUseRevive) {
      const left = window.playBoxGetRevives();
      if (left > 0) {
        reviveBtn.style.display = '';
        reviveBtn.textContent = `Revive (${left} left)`;
      }
    }
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    g.addColorStop(0, '#050814');
    g.addColorStop(1, '#171b30');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ground lanes
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 2;
    lanesY.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y + RAT_H * 0.65);
      ctx.lineTo(WIDTH, y + RAT_H * 0.65);
      ctx.stroke();
    });

    // subtle parallax buildings
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    const seed = Math.floor(time * 0.5);
    for (let i = 0; i < 20; i++) {
      const x = ((i * 60 + seed * 23) % (WIDTH + 120)) - 60;
      const h = 40 + ((i * 37) % 80);
      ctx.fillRect(x, HEIGHT - h - 80, 30, h);
    }
  }

  function drawRat(x, y, t, skin) {
    ctx.save();
    ctx.translate(x, y);

    const bodyColor = skin.body;
    const earColor = skin.ear;
    const tailColor = skin.tail;

    // running phase controls bob, tail and legs
    const bob = Math.sin(t * 6) * 3;
    const tailWave = Math.sin(t * 9) * 5;

    // tail
    ctx.strokeStyle = tailColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-RAT_W * 0.5, 4 + bob);
    ctx.quadraticCurveTo(-RAT_W * 0.8, -4 + tailWave, -RAT_W, 2 - tailWave * 0.5);
    ctx.stroke();

    // body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-RAT_W * 0.3, -RAT_H * 0.4 + bob, RAT_W * 0.55, RAT_H * 0.8, 10);
    ctx.fill();

    // head with slight tilt
    const headTilt = Math.sin(t * 3) * 4;
    ctx.save();
    ctx.translate(RAT_W * 0.25, -RAT_H * 0.05 + bob);
    ctx.rotate((headTilt * Math.PI) / 180);
    ctx.translate(-RAT_W * 0.25, RAT_H * 0.05 - bob);
    ctx.beginPath();
    ctx.roundRect(RAT_W * 0.05, -RAT_H * 0.35 + bob, RAT_W * 0.35, RAT_H * 0.7, 10);
    ctx.fill();

    // nose
    ctx.fillStyle = '#f58c8c';
    ctx.beginPath();
    ctx.arc(RAT_W * 0.42, bob, 4, 0, Math.PI * 2);
    ctx.fill();

    // eye
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(RAT_W * 0.25, -RAT_H * 0.12 + bob, 3, 0, Math.PI * 2);
    ctx.fill();

    // ear
    ctx.fillStyle = earColor;
    ctx.beginPath();
    ctx.arc(RAT_W * 0.12, -RAT_H * 0.45 + bob, 7, 0, Math.PI * 2);
    ctx.fill();

    // whiskers
    ctx.strokeStyle = '#f5d3c3';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const wx = RAT_W * 0.38;
    const wy = bob - 2;
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + 10, wy - 3);
    ctx.moveTo(wx, wy + 2);
    ctx.lineTo(wx + 10, wy + 1);
    ctx.stroke();
    ctx.restore();

    // legs (simple 2-step run cycle)
    ctx.fillStyle = '#1a1a1a';
    const legPhase = Math.sin(t * 12);
    const legOpp = Math.sin(t * 12 + Math.PI);
    const legY = RAT_H * 0.35 + bob;
    ctx.fillRect(-10, legY + legOpp * 3, 8, 10);
    ctx.fillRect(8, legY + legPhase * 3, 8, 10);

    ctx.restore();
  }

  function drawTrap(t) {
    const y = laneToY(t.lane);
    const w = t.w;
    const h = t.h;
    const x = t.x;

    ctx.save();
    ctx.translate(x, y + RAT_H * 0.4);

    // base
    ctx.fillStyle = '#444b5e';
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // springs / spikes
    ctx.fillStyle = '#ff6b6b';
    const spikes = 5;
    for (let i = 0; i < spikes; i++) {
      const sx = -w / 2 + (i + 0.5) * (w / spikes);
      ctx.beginPath();
      ctx.moveTo(sx - 6, -h / 2);
      ctx.lineTo(sx + 6, -h / 2);
      ctx.lineTo(sx, -h / 2 - 12);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawCheese(c) {
    const y = laneToY(c.lane) - 6;
    const x = c.x;
    const size = c.size;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffd447';
    ctx.beginPath();
    ctx.moveTo(-size / 2, size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, -size / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f5c13a';
    ctx.beginPath();
    ctx.arc(-size * 0.05, 0, 3, 0, Math.PI * 2);
    ctx.arc(-size * 0.2, size * 0.2, 2.5, 0, Math.PI * 2);
    ctx.arc(0, size * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawPowerup(p) {
    const laneY = laneToY(p.lane);
    const x = p.x;
    const size = p.size;

    ctx.save();
    ctx.translate(x, laneY);

    if (p.kind === 'invincible') {
      // glowing shield orb
      const r = size * 0.45;
      const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
      g.addColorStop(0, 'rgba(255,255,200,0.9)');
      g.addColorStop(1, 'rgba(255,215,120,0.1)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -4, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffe28a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -4, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'speed') {
      // arrows pad
      ctx.fillStyle = '#1e90ff';
      ctx.fillRect(-size * 0.5, 6, size, size * 0.35);
      ctx.fillStyle = '#bce1ff';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 8 - 4, 4);
        ctx.lineTo(i * 8 + 6, 10);
        ctx.lineTo(i * 8 - 4, 16);
        ctx.closePath();
        ctx.fill();
      }
    } else if (p.kind === 'slow') {
      // slow pad
      ctx.fillStyle = '#5b2c83';
      ctx.fillRect(-size * 0.6, 6, size * 1.2, size * 0.35);
      ctx.fillStyle = '#e0c3ff';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SLOW', 0, 6 + size * 0.18);
    } else if (p.kind === 'hammer') {
      // hammer icon
      ctx.fillStyle = '#d5d8e0';
      ctx.fillRect(-4, -10, 8, 16); // handle
      ctx.fillStyle = '#f5f5f5';
      ctx.beginPath();
      ctx.roundRect(-10, -18, 14, 8, 3);
      ctx.fill();
      ctx.strokeStyle = '#c1c4cc';
      ctx.lineWidth = 1;
      ctx.strokeRect(-10, -18, 14, 8);
    }

    ctx.restore();
  }

  function draw() {
    drawBackground();

    // trail
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const k = i / steps;
      const off = (1 - k) * 70;
      ctx.beginPath();
      ctx.ellipse(
        RAT_X - off,
        ratY + 12 + Math.sin(time * 4 + i) * 2,
        40 * (1 - k * 0.7),
        12 * (1 - k * 0.7),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();

    // rat (speed-reactive animation)
    const animSpeed = 0.8 + (speed / SPEED_MAX) * 0.7;
    const runT = time * animSpeed;
    drawRat(RAT_X, ratY, runT, currentSkin());

    // traps & cheese
    traps.forEach(drawTrap);
    cheeses.forEach(drawCheese);
    powerups.forEach(drawPowerup);

    // wallet HUD (top-right): show total + this run separately
    ctx.save();
    const pad = 8;
    const labelTotal = `Cheese: ${totalCheese}`;
    const labelRun = `Run:   ${runCheese}`;
    ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    const widthTotal = ctx.measureText(labelTotal).width;
    const widthRun = ctx.measureText(labelRun).width;
    const boxW = Math.max(widthTotal, widthRun) + pad * 2;
    const lineH = 18;
    const boxH = lineH * 2 + 4;
    const hudX = WIDTH - boxW - 10;
    const hudY = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(hudX, hudY, boxW, boxH);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffd447';
    ctx.fillText(labelTotal, hudX + pad, hudY + 4);
    ctx.fillStyle = '#7bffb0';
    ctx.fillText(labelRun, hudX + pad, hudY + 4 + lineH);
    ctx.restore();

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      if (crashed && (dodged > 0 || runCheese > 0)) {
        ctx.font = '20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Game Over — you hit a trap', WIDTH / 2, HEIGHT / 2 - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Press Space or Start to run again.', WIDTH / 2, HEIGHT / 2 + 16);
      } else {
        ctx.font = '18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Press Space or Start to run', WIDTH / 2, HEIGHT / 2 - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Dodge traps, grab cheese, then visit the Cheese Shop for skins.', WIDTH / 2, HEIGHT / 2 + 16);
      }
    }

    if (!running && crashed && (dodged > 0 || runCheese > 0)) {
      ctx.fillStyle = 'rgba(255,110,123,0.25)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  // initial draw
  resetState();
  draw();

  // === Input bindings ===
  function onKey(e) {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 's' || k === ' ') {
      e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'w') {
      changeLane(-1);
    } else if (k === 'ArrowDown' || k === 's') {
      changeLane(1);
    } else if (k === ' ') {
      if (running) {
        // pause / unpause mid-run
        stopLoop();
        sound.playClick();
      } else {
        sound.playClick();
        // restart state if we previously crashed or finished a run
        if (crashed || (!running && (dodged > 0 || runCheese > 0))) {
          resetState();
        }
        startLoop();
      }
    }
  }

  startBtn.addEventListener('click', () => {
    if (!running) {
      sound.playClick();
      if (crashed || (!running && (dodged > 0 || runCheese > 0))) {
        resetState();
      }
      startLoop();
    }
  });

  pauseBtn.addEventListener('click', () => {
    sound.playClick();
    if (running) stopLoop(); else startLoop();
  });

  resetBtn.addEventListener('click', () => {
    sound.playClick();
    resetState();
    draw();
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
    resetState(true); // keep dodged and runCheese this run
    startLoop();
  });

  addEventListener('keydown', onKey);

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
  startTitle.textContent = '🐀 Rat Run';
  startTitle.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 2.5rem;
    color: #667eea;
  `;

  const startDesc = document.createElement('p');
  startDesc.textContent = 'Endless lane runner! Switch lanes with arrow keys or W/S to dodge traps and collect cheese. Unlock cool rat skins in the shop!';
  startDesc.style.cssText = `
    margin: 0 0 1.5rem 0;
    font-size: 1.1rem;
    color: #555;
    line-height: 1.6;
  `;

  const bestScore = getHighScore('rat-run') || 0;
  const startHighScore = document.createElement('p');
  startHighScore.textContent = bestScore > 0 ? `🏆 Best: ${bestScore} dodged` : '🏆 No high score yet';
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

  // Show tutorial for first-time players
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    setTimeout(() => {
      showTutorial();
    }, 500);
  }

  return () => {
    destroyed = true;
    stopLoop();
    removeEventListener('keydown', onKey);
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

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function saveCustomSkinColors(skin) {
  if (!skin || skin.id !== 'custom') return;
  let store = null;
  try { store = window.localStorage; } catch { store = null; }
  if (!store) return;
  try {
    store.setItem('rat-run:skin:custom:body', skin.body || '');
    store.setItem('rat-run:skin:custom:ear', skin.ear || '');
    store.setItem('rat-run:skin:custom:tail', skin.tail || '');
  } catch {}
}

function drawRatPreview(ctx, w, h, skin) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5;
  const cy = h * 0.55;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = skin.body;
  ctx.beginPath();
  ctx.roundRect(-20, -10, 32, 20, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(4, -9, 18, 18, 6);
  ctx.fill();

  ctx.fillStyle = skin.ear;
  ctx.beginPath();
  ctx.arc(6, -11, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(12, -3, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f58c8c';
  ctx.beginPath();
  ctx.arc(20, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}