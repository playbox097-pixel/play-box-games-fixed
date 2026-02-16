// games/racer.js
// Simple 3-lane car dodging game rendered with DOM elements.
// Controls: Left / Right arrows or A / D to change lanes.

import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

const TUTORIAL_KEY = 'racer-tutorial-completed';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'racer';

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

  const reviveBtn = makeButton('Revive');
  reviveBtn.classList.add('button');
  reviveBtn.style.display = 'none';

  const scoreBadge = makeBadge('Score: 0');
  const speedBadge = makeBadge('Speed: 1.0x');
  const livesBadge = makeBadge('Lives: 3');
  const bestBadge = makeBadge('Best: 0');

  const easyBtn = makeButton('Easy');
  easyBtn.classList.add('button');
  const mediumBtn = makeButton('Med');
  mediumBtn.classList.add('button', 'primary');
  const hardBtn = makeButton('Hard');
  hardBtn.classList.add('button');

  toolbar.append(
    tutorialBtn,
    startBtn,
    pauseBtn,
    resetBtn,
    reviveBtn,
    easyBtn,
    mediumBtn,
    hardBtn,
    scoreBadge,
    speedBadge,
    livesBadge,
    bestBadge,
  );

  const rulesEl = createRules([
    'Use Left/Right arrows or A/D to switch lanes.',
    'Avoid the red cars coming towards you.',
    'Your speed slowly increases over time; score increases as you dodge traffic.',
    'Colliding with another car ends the run. Press Reset or Start to try again.',
  ]);

  const container = document.createElement('div');
  container.className = 'racer-container';

  // Per-game fullscreen button (targets just this game area)
  if (window.playBoxCreateFullscreenButton) {
    const fsBtn = window.playBoxCreateFullscreenButton(container);
    if (fsBtn) toolbar.appendChild(fsBtn);
  }

  const road = document.createElement('div');
  road.className = 'racer-road';

  const car = document.createElement('div');
  car.className = 'racer-car';

  const overlay = document.createElement('div');
  overlay.className = 'racer-overlay hidden';
  const overlayTitle = document.createElement('div');
  overlayTitle.className = 'racer-overlay-title';
  const overlaySub = document.createElement('div');
  overlaySub.className = 'racer-overlay-sub';
  overlay.append(overlayTitle, overlaySub);

  // Put the car inside the road so enemies and player share the same coordinate space.
  road.appendChild(car);
  container.append(road, overlay);
  wrap.append(toolbar, rulesEl, container);
  root.appendChild(wrap);

  // --- Lane markers ---
  const laneLines = [];
  const laneSegmentCount = 10;
  for (let i = 0; i < laneSegmentCount; i++) {
    const seg = document.createElement('div');
    seg.className = 'racer-lane-line';
    road.appendChild(seg);
    laneLines.push({ el: seg, y: (i * (560 / laneSegmentCount)) - 40 });
  }

  // --- Game state ---
  const LANE_COUNT = 3;
  const ROAD_WIDTH = 240; // matches CSS
  const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
  const CONTAINER_HEIGHT = 560;
  const CAR_HEIGHT = 70;
  const CAR_BOTTOM_OFFSET = 40;
  const ENEMY_HEIGHT = 70;
  const CAR_TOP = CONTAINER_HEIGHT - CAR_BOTTOM_OFFSET - CAR_HEIGHT;
  const CAR_BOTTOM = CONTAINER_HEIGHT - CAR_BOTTOM_OFFSET;

  let currentLane = 1; // 0,1,2
  let enemies = [];
  let running = false;
  let dead = false;
  let lastTime = null;
  let destroyed = false; // used to stop the animation loop when game is unmounted

  const HS_KEY = 'racer';
  let score = 0;
  let best = getHighScore(HS_KEY);
  let speed = 1.0; // difficulty multiplier
  let lives = 3;
  let difficulty = 'medium'; // easy | medium | hard

  scoreBadge.textContent = 'Score: 0';
  speedBadge.textContent = 'Speed: 1.0x';
  bestBadge.textContent = `Best: ${best}`;

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
        title: '🏎️ Welcome to Racer!',
        text: 'Dodge incoming traffic in this fast-paced 3-lane racing game! Stay focused as the speed increases and test your reflexes.'
      },
      {
        title: '🕹️ Controls',
        text: 'Use Left/Right arrow keys or A/D to switch lanes. Quickly move to avoid the red enemy cars coming toward you!'
      },
      {
        title: '⚡ Speed Increases',
        text: 'Your speed slowly increases over time, making the game harder. The faster you go, the quicker you earn points!'
      },
      {
        title: '❤️ Lives System',
        text: 'You start with multiple lives (depending on difficulty). Each collision costs one life. Lose all lives and it\'s game over!'
      },
      {
        title: '🎚️ Difficulty Modes',
        text: 'Easy: 5 lives, Medium: 3 lives, Hard: 1 life. Choose your challenge level before starting!'
      },
      {
        title: '🏁 Ready to Race!',
        text: 'Hit Start to begin, use Pause to take a break, and watch out for those red cars! Good luck racer!'
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

  function baseLivesForDifficulty(level) {
    if (level === 'easy') return 5;
    if (level === 'hard') return 1;
    return 3; // medium/default
  }

  function updateLivesBadge() {
    livesBadge.textContent = `Lives: ${lives}`;
  }

  function laneCenterX(laneIndex) {
    return laneIndex * LANE_WIDTH + LANE_WIDTH / 2;
  }

  function updateCarPosition() {
    const x = laneCenterX(currentLane);
    // car is 40px wide; position it centered on the lane inside the road
    car.style.left = `${x - 20}px`;
  }

  function spawnEnemyInLane(lane) {
    const enemy = document.createElement('div');
    enemy.className = 'racer-enemy';
    road.appendChild(enemy);

    const x = laneCenterX(lane);
    const y = -80;
    enemies.push({ el: enemy, lane, x, y });
  }

  function spawnRow() {
    // Only allow one wave of cars on screen at a time (Subway Surfers style).
    // This guarantees vertical spacing between waves.
    const hasWaveOnScreen = enemies.some(
      (e) => e.y > -ENEMY_HEIGHT && e.y < CONTAINER_HEIGHT + ENEMY_HEIGHT,
    );
    if (hasWaveOnScreen) return;

    // Pick which lanes get cars in this row.
    const lanes = [];
    for (let i = 0; i < LANE_COUNT; i++) {
      if (Math.random() < 0.5) lanes.push(i);
    }
    if (lanes.length === 0) {
      lanes.push(Math.floor(Math.random() * LANE_COUNT));
    } else if (lanes.length === LANE_COUNT) {
      // At most 2 lanes from this row so one lane is always open.
      lanes.pop();
    }

    lanes.forEach(lane => {
      spawnEnemyInLane(lane);
    });
  }

  function resetState(keepScore = false) {
    running = false;
    dead = false;
    lastTime = null;
    if (!keepScore) {
      score = 0;
      speed = 1.0;
    }
    currentLane = 1;
    lives = baseLivesForDifficulty(difficulty);

    scoreBadge.textContent = 'Score: 0';
    speedBadge.textContent = 'Speed: 1.0x';
    updateLivesBadge();

    enemies.forEach(e => e.el.remove());
    enemies = [];

    updateCarPosition();
    hideOverlay();
    reviveBtn.style.display = 'none';
  }

  function showOverlay(title, sub) {
    overlayTitle.textContent = title;
    overlaySub.textContent = sub;
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function gameOver() {
    if (dead) return;
    dead = true;
    running = false;
    sound.playGameOver();
    if (score > best) {
      best = updateHighScore(HS_KEY, score);
      bestBadge.textContent = `Best: ${best}`;
    }
    showOverlay('Game over', `Final score: ${score}. Press Start, Reset, or Revive to try again.`);
    if (window.playBoxGetRevives && window.playBoxUseRevive) {
      const left = window.playBoxGetRevives();
      if (left > 0) {
        reviveBtn.style.display = '';
        reviveBtn.textContent = `Revive (${left} left)`;
      }
    }
  }

  function handleCrash() {
    // Called when a collision is detected.
    if (!running) return;

    if (lives > 1) {
      lives -= 1;
      updateLivesBadge();
      sound.playLose();
      running = false;

      // Clear current enemies and reset car position, keep score/speed.
      enemies.forEach(e => e.el.remove());
      enemies = [];
      currentLane = 1;
      updateCarPosition();

      const msg = lives === 1 ? 'You have 1 life left.' : `You have ${lives} lives left.`;
      showOverlay('Crash!', `${msg} Press Start or Space to continue.`);
    } else {
      lives = 0;
      updateLivesBadge();
      gameOver();
    }
  }

  function step(dt) {
    if (!running) return;

    const laneSpeed = 200 * speed;
    const enemySpeed = 220 * speed;

    // move lane lines
    laneLines.forEach(line => {
      line.y += laneSpeed * dt;
      if (line.y > 560) {
        line.y -= 560 + 40;
      }
      line.el.style.top = `${line.y}px`;
    });

    // move enemies
    enemies.forEach(e => {
      e.y += enemySpeed * dt;
      e.el.style.top = `${e.y}px`;
      // enemy is inside the road, so center on lane without extra margins
      e.el.style.left = `${e.x - 20}px`;
    });

    // remove off-screen, bump score / difficulty
    enemies = enemies.filter(e => {
      if (e.y > 660) {
        e.el.remove();
        score += 10;
        scoreBadge.textContent = `Score: ${score}`;
        if (score % 50 === 0) {
          speed = Math.min(3.0, speed + 0.2);
          speedBadge.textContent = `Speed: ${speed.toFixed(1)}x`;
        }
        return false;
      }
      return true;
    });

    // random spawns; scaled by speed (keep probability small so road isn't overcrowded)
    const spawnChance = 0.5 * speed * dt; // ~0.5/sec at speed 1, ~1.5/sec at speed 3
    if (Math.random() < spawnChance) {
      spawnRow();
    }

    // collision detection in lane-space: same lane + overlapping vertical ranges
    const crashed = enemies.some(e => {
      if (e.lane !== currentLane) return false;
      const enemyTop = e.y;
      const enemyBottom = e.y + ENEMY_HEIGHT;
      return enemyTop < CAR_BOTTOM && enemyBottom > CAR_TOP;
    });

    if (crashed && !dead) {
      handleCrash();
    }
  }

  function loop(timestamp) {
    if (lastTime == null) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    step(dt);
    if (!destroyed) requestAnimationFrame(loop);
  }

  function handleKeydown(e) {
    const k = e.key;
    const isLeft = k === 'ArrowLeft' || k === 'a' || k === 'A';
    const isRight = k === 'ArrowRight' || k === 'd' || k === 'D';
    const isSpace = k === ' ';

    if (isLeft || isRight || isSpace) {
      e.preventDefault();
    }

    if (isLeft) {
      if (currentLane > 0) {
        currentLane -= 1;
        updateCarPosition();
        sound.playMove();
      }
    } else if (isRight) {
      if (currentLane < LANE_COUNT - 1) {
        currentLane += 1;
        updateCarPosition();
        sound.playMove();
      }
    } else if (isSpace) {
      if (dead) {
        resetState();
      }
      if (!running) {
        sound.playClick();
        hideOverlay();
        running = true;
      }
    }
  }

  function handleStart() {
    if (dead) {
      resetState();
    }
    if (!running) {
      sound.playClick();
      hideOverlay();
      running = true;
    }
  }

  function handlePause() {
    sound.playClick();
    running = !running;
  }

  function handleReset() {
    sound.playClick();
    resetState();
  }

  startBtn.addEventListener('click', handleStart);
  pauseBtn.addEventListener('click', handlePause);
  resetBtn.addEventListener('click', handleReset);
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
    resetState(true);
    hideOverlay();
    running = true;
  });

  function applyDifficulty(level) {
    difficulty = level;
    easyBtn.classList.toggle('primary', level === 'easy');
    mediumBtn.classList.toggle('primary', level === 'medium');
    hardBtn.classList.toggle('primary', level === 'hard');
    resetState();
  }

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

  addEventListener('keydown', handleKeydown);

  // initial placement and overlay
  lives = baseLivesForDifficulty(difficulty);
  updateLivesBadge();
  updateCarPosition();
  showOverlay('Lane Racer', 'Use Left/Right or A/D to dodge traffic. Press Start or Space to begin.');

  // Show tutorial for first-time players
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    setTimeout(() => {
      showTutorial();
    }, 500);
  }

  requestAnimationFrame(loop);

  return () => {
    destroyed = true;
    removeEventListener('keydown', handleKeydown);
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